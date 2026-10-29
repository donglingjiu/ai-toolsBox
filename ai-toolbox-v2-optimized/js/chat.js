/* AT Chat Workspace - A2
   流式 / Markdown / Skill / 多 Profile 兜底 / 本地历史 · 零依赖无后端 */
(function(){
'use strict';
if(window.__AT_CHAT__) return;
window.__AT_CHAT__ = true;

function $(id){ return document.getElementById(id); }
function esc(s){ s = String(s == null ? '' : s); return s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); }
var BT = String.fromCharCode(96);
var FENCE = BT + BT + BT;

/* Markdown 迷你渲染：先整体转义再逐行解析（防注入） */
function inline(s){
  var re = new RegExp(BT + '([^' + BT + ']+)' + BT, 'g');
  s = s.replace(re, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function md(src){
  var lines = esc(src).split('\n');
  var out = [], inCode = false, codeBuf = [], inList = false;
  for(var i = 0; i < lines.length; i++){
    var L = lines[i];
    if(L.trim().indexOf(FENCE) === 0){
      if(inCode){ out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>'); codeBuf = []; inCode = false; }
      else { if(inList){ out.push('</ul>'); inList = false; } inCode = true; }
      continue;
    }
    if(inCode){ codeBuf.push(L); continue; }
    var li = L.match(/^\s*[-*] (.*)$/);
    if(li){ if(!inList){ out.push('<ul>'); inList = true; } out.push('<li>' + inline(li[1]) + '</li>'); continue; }
    if(inList){ out.push('</ul>'); inList = false; }
    var h = L.match(/^(#{1,3})\s+(.*)$/);
    if(h){ var lv = h[1].length + 1; out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); continue; }
    if(!L.trim()){ out.push(''); continue; }
    out.push('<p>' + inline(L) + '</p>');
  }
  if(inCode) out.push('<pre><code>' + codeBuf.join('\n') + '</code></pre>');
  if(inList) out.push('</ul>');
  return out.join('\n');
}

/* Profile 加载（与 at-cmdk 同源逻辑） */
var PROFILE_KEYS = ['llmProfiles','llm_profiles','at_llm_profiles','aiProfiles','openaiProfiles','profiles'];
function validProfiles(arr){
  var out = [];
  if(!Array.isArray(arr)) return out;
  for(var i = 0; i < arr.length; i++){
    var p = arr[i];
    if(p && typeof p.baseUrl === 'string' && p.baseUrl.indexOf('http') === 0 && p.enabled !== false) out.push(p);
  }
  return out;
}
function loadProfiles(){
  for(var i = 0; i < PROFILE_KEYS.length; i++){
    try{
      var raw = localStorage.getItem(PROFILE_KEYS[i]);
      if(!raw) continue;
      var ok = validProfiles(JSON.parse(raw));
      if(ok.length) return ok;
    }catch(e){}
  }
  try{
    for(var k = 0; k < localStorage.length; k++){
      var key = localStorage.key(k);
      if(!key) continue;
      var low = key.toLowerCase();
      if(low.indexOf('skill') >= 0 || low.indexOf('history') >= 0 || low.indexOf('chat') >= 0 || low.indexOf('recent') >= 0) continue;
      var raw2 = localStorage.getItem(key);
      if(!raw2 || raw2.charAt(0) !== '[') continue;
      var ok2 = validProfiles(JSON.parse(raw2));
      if(ok2.length) return ok2;
    }
  }catch(e){}
  return [];
}

/* Skill */
function loadSkills(){
  try{
    if(window.ATSkillStore && typeof window.ATSkillStore.listAll === 'function'){
      var a = window.ATSkillStore.listAll();
      if(Array.isArray(a) && a.length) return a;
    }
  }catch(e){}
  return window.AT_SKILLS_BUILTIN || [];
}
function skillText(s){ return s.prompt || s.body || s.content || s.template || s.system || s.instruction || ''; }

/* 历史存储 */
var HKEY = 'at_chat_sessions';
function loadSessions(){ try{ var a = JSON.parse(localStorage.getItem(HKEY) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
function saveSessions(a){ try{ localStorage.setItem(HKEY, JSON.stringify(a.slice(0, 50))); }catch(e){} }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmtTime(ts){ var d = new Date(ts || Date.now()); return (d.getMonth() + 1) + '/' + d.getDate(); }

/* 流式引擎：SSE 解析 + 多 Profile 顺序兜底 */
function streamOnce(p, msgs, onDelta, signal){
  var url = p.baseUrl;
  while(url.charAt(url.length - 1) === '/') url = url.slice(0, -1);
  url += '/chat/completions';
  var key = p.apiKey || p.api_key || p.key || '';
  var headers = { 'Content-Type':'application/json' };
  if(key) headers['Authorization'] = 'Bearer ' + key;
  var opt = { method:'POST', headers:headers, body: JSON.stringify({
    model: p.model || p.modelName || 'glm-4-flash',
    messages: msgs, temperature: 0.7, stream: true
  }) };
  if(signal) opt.signal = signal;
  return fetch(url, opt).then(function(r){
    if(!r.ok){
      var why = r.status === 402 ? '（欠费）' : r.status === 401 ? '（Key 无效）' : r.status === 429 ? '（限流）' : '';
      throw new Error('HTTP ' + r.status + why);
    }
    if(!r.body || !r.body.getReader){
      return r.json().then(function(d){
        var c = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '';
        c = String(c); onDelta(c, c); return c;
      });
    }
    var reader = r.body.getReader();
    var dec = new TextDecoder('utf-8');
    var buf = '', full = '';
    return new Promise(function(resolve, reject){
      function pump(){
        reader.read().then(function(res){
          if(res.done){ resolve(full); return; }
          buf += dec.decode(res.value, { stream:true });
          var parts = buf.split('\n');
          buf = parts.pop();
          for(var i = 0; i < parts.length; i++){
            var line = parts[i].trim();
            if(line.indexOf('data:') !== 0) continue;
            var payload = line.slice(5).trim();
            if(!payload || payload === '[DONE]') continue;
            try{
              var j = JSON.parse(payload);
              var ch = j.choices && j.choices[0];
              var d = ch && ((ch.delta && ch.delta.content) || (ch.message && ch.message.content)) || '';
              if(d){ full += d; onDelta(d, full); }
            }catch(e){}
          }
          pump();
        }).catch(reject);
      }
      pump();
    });
  });
}
function chatStream(msgs, onDelta, signal){
  var ps = loadProfiles();
  if(!ps.length) return Promise.reject(new Error('NO_PROFILE'));
  var idx = 0, gotAny = false;
  function attempt(){
    if(idx >= ps.length) return Promise.reject(new Error('所有模型配置均调用失败'));
    var p = ps[idx++];
    gotAny = false;
    return streamOnce(p, msgs, function(d, f){ gotAny = true; onDelta(d, f); }, signal).catch(function(e){
      if(gotAny || (signal && signal.aborted)) throw e;
      return attempt();
    });
  }
  return attempt();
}

/* ---------- UI 层 ---------- */
var sessions = loadSessions();
var cur = null, busy = false, ctrl = null;

function doCopy(text){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text); return; }
  var ta = document.createElement('textarea'); ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}
function scrollBottom(force){
  var sc = $('scroll');
  var near = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 140;
  if(force || near) sc.scrollTop = sc.scrollHeight;
}
function autosize(){ var t = $('input'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 200) + 'px'; }
function setSend(){
  var b = $('sendBtn');
  if(busy){ b.textContent = '停止'; b.classList.add('stop'); }
  else { b.textContent = '发送'; b.classList.remove('stop'); }
}
function renderEmpty(show){ $('empty').style.display = show ? '' : 'none'; }
function renderSidebar(){
  var box = $('sessList');
  if(!sessions.length){ box.innerHTML = '<div class="side-empty">暂无历史会话<br>开始第一次对话吧</div>'; return; }
  var html = '';
  for(var i = sessions.length - 1; i >= 0; i--){
    var s = sessions[i];
    var cls = (cur && s.id === cur.id) ? 'sess-item cur' : 'sess-item';
    html += '<div class="' + cls + '" data-id="' + s.id + '"><span class="t">' + esc(s.title || '新对话') + '</span><span class="d">' + fmtTime(s.ts) + '</span><button class="x" data-del="' + s.id + '" title="删除">✕</button></div>';
  }
  box.innerHTML = html;
}
function addActions(el, getText){
  var bar = document.createElement('div'); bar.className = 'msg-actions';
  var b = document.createElement('button'); b.className = 'act'; b.textContent = '复制';
  b.onclick = function(){ doCopy(getText()); b.textContent = '已复制'; setTimeout(function(){ b.textContent = '复制'; }, 1200); };
  bar.appendChild(b); el.querySelector('.body').appendChild(bar);
}
function addMsgEl(role, content){
  renderEmpty(false);
  var wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  wrap.innerHTML = '<div class="avatar">' + (role === 'user' ? '我' : 'AI') + '</div><div class="body"><div class="who">' + (role === 'user' ? '你' : 'AI 助手') + '</div><div class="bubble">' + (role === 'user' ? esc(content) : md(content)) + '</div></div>';
  $('inner').appendChild(wrap);
  scrollBottom(true);
  return wrap;
}
function finishAI(aiEl, full, err){
  busy = false; setSend();
  var bub = aiEl.querySelector('.bubble');
  if(full){
    cur.msgs.push({ role:'assistant', content: full });
    bub.innerHTML = md(full);
    addActions(aiEl, function(){ return full; });
  } else if(err){
    bub.innerHTML = '<span class="err">' + esc(err) + '</span>';
  } else {
    bub.innerHTML = '<span class="err">模型返回为空，请重试或更换 Profile</span>';
  }
  if(err && full){
    var e2 = document.createElement('div'); e2.className = 'err'; e2.style.marginTop = '6px';
    e2.textContent = err; bub.parentNode.appendChild(e2);
  }
  cur.ts = Date.now(); saveSessions(sessions); renderSidebar();
  scrollBottom(false);
}
function send(){
  if(busy) return;
  var v = $('input').value.trim();
  if(!v) return;
  if(!cur) newSession();
  cur.msgs.push({ role:'user', content: v });
  if(cur.title === '新对话') cur.title = v.slice(0, 18);
  addMsgEl('user', v);
  $('input').value = ''; autosize();
  renderSidebar();
  busy = true; setSend();
  var aiEl = addMsgEl('ai', '');
  aiEl.querySelector('.bubble').innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var full = '';
  chatStream(cur.msgs.slice(), function(d, f){
    full = f;
    aiEl.querySelector('.bubble').innerHTML = md(f);
    scrollBottom(false);
  }, ctrl).then(function(){
    finishAI(aiEl, full, '');
  }).catch(function(e){
    var m = (e && e.message) ? e.message : String(e);
    var msg = (ctrl && ctrl.signal && ctrl.signal.aborted) ? '（已停止生成）'
      : (m === 'NO_PROFILE' ? '未找到可用模型配置：请到 设置 页添加 API，或使用内置代理' : ('调用失败：' + m));
    finishAI(aiEl, full, msg);
  });
}
function newSession(){
  cur = { id: uid(), title: '新对话', ts: Date.now(), msgs: [] };
  sessions.push(cur); saveSessions(sessions);
  $('inner').innerHTML = ''; renderEmpty(true);
  renderSidebar();
  $('app').classList.remove('side-open');
}
function loadSession(id){
  for(var i = 0; i < sessions.length; i++){
    if(sessions[i].id !== id) continue;
    cur = sessions[i];
    $('inner').innerHTML = '';
    renderEmpty(cur.msgs.length === 0);
    for(var j = 0; j < cur.msgs.length; j++){
      var el = addMsgEl(cur.msgs[j].role, cur.msgs[j].content);
      if(cur.msgs[j].role === 'assistant' && cur.msgs[j].content){
        addActions(el, (function(k){ return function(){ return cur.msgs[k].content; }; })(j));
      }
    }
    renderSidebar();
    $('app').classList.remove('side-open');
    return;
  }
}
/* Skill 菜单 */
function renderSkillList(q){
  q = q.trim().toLowerCase();
  var all = loadSkills(), html = '', n = 0;
  for(var i = 0; i < all.length && n < 40; i++){
    var s = all[i];
    var tags = Array.isArray(s.tags) ? s.tags.join(' ') : (s.tags || '');
    var hay = ((s.name || '') + ' ' + (s.description || s.desc || '') + ' ' + tags).toLowerCase();
    if(q && hay.indexOf(q) < 0) continue;
    n++;
    html += '<div class="skill-item" data-i="' + i + '"><div class="n">' + esc(s.name || s.id || '未命名') + '</div><div class="m">' + esc(s.description || s.desc || '') + '</div></div>';
  }
  $('skillList').innerHTML = html || '<div class="skill-none">没有匹配的 Skill</div>';
}
function openSkill(){ $('skillOv').classList.add('open'); $('skillSearch').value = ''; renderSkillList(''); $('skillSearch').focus(); }
function closeSkill(){ $('skillOv').classList.remove('open'); }

function init(){
  $('newBtn').onclick = function(){ if(!busy) newSession(); };
  $('sendBtn').onclick = function(){ if(busy){ if(ctrl) ctrl.abort(); } else send(); };
  $('menuBtn').onclick = function(){ $('app').classList.toggle('side-open'); };
  $('skillBtn').onclick = openSkill;
  $('skillOv').addEventListener('mousedown', function(e){ if(e.target === $('skillOv')) closeSkill(); });
  $('skillOv').addEventListener('keydown', function(e){ if(e.key === 'Escape') closeSkill(); });
  $('skillSearch').addEventListener('input', function(){ renderSkillList(this.value); });
  $('skillList').addEventListener('click', function(e){
    var it = e.target.closest ? e.target.closest('.skill-item') : null;
    if(!it) return;
    var s = loadSkills()[parseInt(it.getAttribute('data-i'), 10)];
    if(!s) return;
    var txt = skillText(s);
    if(!txt){ closeSkill(); return; }
    $('input').value = txt; autosize(); closeSkill(); $('input').focus();
  });
  $('empty').addEventListener('click', function(e){
    var c = e.target.closest ? e.target.closest('.chip') : null;
    if(!c) return;
    $('input').value = c.getAttribute('data-q');
    autosize(); $('input').focus();
  });
  $('sessList').addEventListener('click', function(e){
    if(busy) return;
    var del = e.target.getAttribute && e.target.getAttribute('data-del');
    if(del){
      sessions = sessions.filter(function(s){ return s.id !== del; });
      if(cur && cur.id === del){ cur = null; $('inner').innerHTML = ''; renderEmpty(true); }
      saveSessions(sessions); renderSidebar(); return;
    }
    var item = e.target.closest ? e.target.closest('.sess-item') : null;
    if(item) loadSession(item.getAttribute('data-id'));
  });
  $('input').addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); }
  });
  $('input').addEventListener('input', autosize);
  $('exportBtn').onclick = function(){
    if(!cur || !cur.msgs.length) return;
    var lines = ['# ' + (cur.title || 'AI 对话'), ''];
    for(var i = 0; i < cur.msgs.length; i++){
      var m = cur.msgs[i];
      lines.push(m.role === 'user' ? '## 你' : '## AI');
      lines.push(''); lines.push(m.content); lines.push('');
    }
    var blob = new Blob([lines.join('\n')], { type:'text/markdown' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chat-' + new Date().toISOString().slice(0, 10) + '.md';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 400);
  };
  if(sessions.length) loadSession(sessions[sessions.length - 1].id);
  else newSession();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
