/* AT Command Palette v2 - A1 全站 Ctrl/Cmd+K
   零 emoji（2 字母徽章防终端粘贴损坏）
   自包含：运行时注入样式；数据源：工具注册表 / skill-store / llmProfiles 兜底 */
(function () {
  'use strict';
  if (window.__AT_CMDK__) return;
  window.__AT_CMDK__ = true;

  var DEFAULT_PH = '搜索工具、Skill 或执行 AI 指令';

  /* ---------- 样式 ---------- */
  var CSS = [
    '.atcmd-overlay{position:fixed;inset:0;z-index:2147483000;display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;background:rgba(13,16,32,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}',
    '.atcmd-overlay.atcmd-open{display:flex}',
    '.atcmd-panel{width:100%;max-width:640px;background:rgba(22,25,38,.92);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(255,255,255,.10);border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.45);overflow:hidden;color:#e8eaf2;animation:atcmdIn .16s ease-out}',
    '@keyframes atcmdIn{from{opacity:0;transform:scale(.96) translateY(-8px)}to{opacity:1;transform:none}}',
    '.atcmd-input{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.atcmd-input>span:first-child{color:#aeb6ff;font-size:15px}',
    '.atcmd-input input{flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:16px;caret-color:#7c8cff}',
    '.atcmd-input input::placeholder{color:#6d7288}',
    '.atcmd-hint{font-size:11px;color:#6d7288;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:2px 6px;white-space:nowrap}',
    '.atcmd-list{max-height:52vh;overflow-y:auto;padding:6px}',
    '.atcmd-list::-webkit-scrollbar{width:8px}',
    '.atcmd-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}',
    '.atcmd-group{font-size:11px;letter-spacing:.08em;color:#8b90a8;padding:10px 12px 4px}',
    '.atcmd-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;color:#c9cde0}',
    '.atcmd-item .ico{width:34px;height:28px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(124,140,255,.14);color:#aeb6ff;font-size:11px;font-weight:700;letter-spacing:.5px}',
    '.atcmd-item .txt{flex:1;min-width:0}',
    '.atcmd-item .name{font-size:14px;color:#f0f2fa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.atcmd-item .desc{font-size:12px;color:#8b90a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}',
    '.atcmd-item .kbd{font-size:11px;color:#6d7288;flex:none}',
    '.atcmd-item.atcmd-sel{background:linear-gradient(90deg,rgba(124,140,255,.18),rgba(124,140,255,.06));outline:1px solid rgba(124,140,255,.35)}',
    '.atcmd-empty{padding:28px 16px;text-align:center;color:#6d7288;font-size:13px}',
    '.atcmd-foot{display:flex;gap:14px;padding:9px 14px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#6d7288}',
    '.atcmd-foot b{color:#8b90a8;font-weight:600}',
    '.atcmd-fab{position:fixed;right:16px;bottom:16px;z-index:2147482999;width:44px;height:44px;border-radius:22px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(135deg,#5b6cff,#8a5bff);color:#fff;font-size:13px;font-weight:600;box-shadow:0 8px 28px rgba(91,108,255,.45);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;transition:transform .18s ease,box-shadow .18s ease}',
    '.atcmd-fab:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(91,108,255,.55)}',
    '.atcmd-toast{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:2147483001;background:rgba(22,25,38,.95);color:#e8eaf2;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 16px;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:80vw;font-family:inherit}',
    '@media (prefers-reduced-motion: reduce){.atcmd-panel{animation:none}.atcmd-fab{transition:none}}',
    '@media (max-width:560px){.atcmd-overlay{padding-top:8vh}.atcmd-fab{right:12px;bottom:12px}}'
  ].join(' ');
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- 工具注册表：[文件, 名称, 描述, 徽章, 搜索词] ---------- */
  var PAGES = [
    ['index.html','主页','工具总览与快捷入口','IN','home 首页'],
    ['docs.html','星文 Docs','文件格式转换与 AI 文档处理','DO','docs 文档 转换 word pdf'],
    ['data.html','星库 Data','文件星库与数据资产','DA','data 星库 vault 文件'],
    ['flow.html','星流 Flow','多阶段 AI 流水线编排','FL','flow 星流 流水线 编排'],
    ['mind.html','脑图 Mind','思维导图','MI','mind 脑图 导图'],
    ['skills.html','Skill 工坊','内置 Skill 管理与复用','SK','skills 工坊 技能'],
    ['prompts.html','提示词库','精选提示词合集','PR','prompts 提示词'],
    ['brain.html','第二大脑','个人知识库问答','BR','brain 知识 问答'],
    ['resume.html','简历助手','简历优化与生成','RE','resume 简历'],
    ['mood.html','情绪日记','情绪记录与 AI 分析','MO','mood 情绪 日记'],
    ['advisor.html','副业顾问','副业方向规划','AD','advisor 副业 顾问'],
    ['ppt.html','PPT 生成','大纲一键生成演示文稿','PP','ppt 幻灯片'],
    ['excel.html','Excel 工具','表格画像与 AI 整理','EX','excel 表格 csv'],
    ['tryon.html','AI 试衣间','虚拟试衣','TY','tryon 试衣'],
    ['qr.html','挪车码','一键生成挪车码','QR','qr 二维码 挪车'],
    ['settings.html','设置','模型 API 与代理配置','SE','settings 设置 配置']
  ];

  /* ---------- AI 快捷指令 ---------- */
  var AI_ACTIONS = [
    ['polish','AI 改写','润色选中文本或输入框内容','改写 润色 rewrite','你是中文文字润色专家。在保持原意的前提下优化表达，使其更流畅、专业、简洁，直接输出优化后的文本，不要任何解释。用户内容：'],
    ['summary','AI 摘要','提炼选中文本或输入框要点','摘要 总结 summary','你是摘要专家。用简洁要点提炼以下内容的核心信息，最多 8 条，直接输出要点，不要任何解释。用户内容：'],
    ['zh2en','中译英','翻译为地道专业英文','翻译 英文 english','你是专业翻译。将以下内容翻译成地道、专业的英文，保留专有名词，直接输出译文，不要任何解释。用户内容：'],
    ['en2zh','英译中','翻译为通顺自然中文','翻译 中文 chinese','你是专业翻译。将以下内容翻译成通顺、自然的中文，保留专有名词，直接输出译文，不要任何解释。用户内容：'],
    ['expand','AI 扩写','扩展深化选中文本','扩写 expand','你是写作助手。在不改变原意与事实的前提下，将以下内容扩写得更具体、更有深度，长度约为原文两倍，直接输出，不要任何解释。用户内容：']
  ];

  /* ---------- 状态 ---------- */
  var state = { open:false, mode:'normal', action:null, items:[], sel:0, out:'', busy:false };
  var ov, input, list, fab;

  /* ---------- 通用 ---------- */
  function esc(s){ s = String(s == null ? '' : s); return s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;'); }
  function toast(msg, ms){
    var t = document.createElement('div'); t.className = 'atcmd-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 320); }, ms || 2600);
  }
  function copy(text){
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function(res, rej){
      try{
        var ta = document.createElement('textarea'); ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? res() : rej(new Error('复制失败'));
      }catch(e){ rej(e); }
    });
  }
  function visible(el){
    if(!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 20 && el.offsetParent !== null;
  }
  function visibleInput(){
    var sels = ['#chatInput','#userInput','#msgInput','#promptInput','#question','.chat-input textarea','.input-area textarea','textarea'];
    for(var i=0;i<sels.length;i++){
      var els = document.querySelectorAll(sels[i]);
      for(var j=0;j<els.length;j++){ if(visible(els[j])) return els[j]; }
    }
    return null;
  }
  function getSourceText(){
    var sel = '';
    try{ sel = String(window.getSelection ? window.getSelection() : ''); }catch(e){}
    sel = sel.trim();
    if(sel.length > 8) return sel;
    var el = visibleInput();
    if(el && el.value && el.value.trim().length > 8) return el.value.trim();
    return '';
  }

  /* ---------- LLM：多 Profile 兜底（空 Key 跳过 Authorization） ---------- */
  var PROFILE_KEYS = ['llmProfiles','llm_profiles','at_llm_profiles','aiProfiles','openaiProfiles','profiles'];
  function validProfiles(arr){
    var out = [];
    if(!Array.isArray(arr)) return out;
    for(var i=0;i<arr.length;i++){
      var p = arr[i];
      if(p && typeof p.baseUrl === 'string' && p.baseUrl.indexOf('http') === 0 && p.enabled !== false) out.push(p);
    }
    return out;
  }
  function loadProfiles(){
    for(var i=0;i<PROFILE_KEYS.length;i++){
      try{
        var raw = localStorage.getItem(PROFILE_KEYS[i]);
        if(!raw) continue;
        var ok = validProfiles(JSON.parse(raw));
        if(ok.length) return ok;
      }catch(e){}
    }
    try{
      for(var k=0;k<localStorage.length;k++){
        var key = localStorage.key(k);
        if(!key) continue;
        var low = key.toLowerCase();
        if(low.indexOf('skill') >= 0 || low.indexOf('history') >= 0 || low.indexOf('recent') >= 0 || low.indexOf('cmdk') >= 0) continue;
        var raw2 = localStorage.getItem(key);
        if(!raw2 || raw2.charAt(0) !== '[') continue;
        var ok2 = validProfiles(JSON.parse(raw2));
        if(ok2.length) return ok2;
      }
    }catch(e){}
    try{ if(window.AT_LLM_PROFILES){ var ok3 = validProfiles(window.AT_LLM_PROFILES); if(ok3.length) return ok3; } }catch(e){}
    return [];
  }
  function chatOnce(p, sys, user){
    var url = p.baseUrl;
    while(url.charAt(url.length - 1) === '/') url = url.slice(0, -1);
    url = url + '/chat/completions';
    var key = p.apiKey || p.api_key || p.key || '';
    var headers = {'Content-Type':'application/json'};
    if(key) headers['Authorization'] = 'Bearer ' + key;
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tid = setTimeout(function(){ if(ctrl) ctrl.abort(); }, 30000);
    var opt = {method:'POST', headers:headers, body: JSON.stringify({
      model: p.model || p.modelName || 'glm-4-flash',
      messages:[{role:'system',content:sys},{role:'user',content:user}],
      temperature:0.7, stream:false
    })};
    if(ctrl) opt.signal = ctrl.signal;
    return fetch(url, opt).then(function(r){
      clearTimeout(tid);
      if(!r.ok){
        var why = r.status === 402 ? ' 欠费' : r.status === 401 ? ' Key 无效' : r.status === 429 ? ' 限流' : '';
        throw new Error('HTTP ' + r.status + why);
      }
      return r.json();
    }).then(function(d){
      var c = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
      if(!c) throw new Error('空响应');
      return String(c).trim();
    }).catch(function(e){ clearTimeout(tid); throw e; });
  }
  function callLLM(sys, user){
    var ps = loadProfiles();
    if(!ps.length) return Promise.reject(new Error('NO_PROFILE'));
    var chain = Promise.reject(new Error('start'));
    for(var i=0;i<ps.length;i++){
      (function(p){ chain = chain.catch(function(){ return chatOnce(p, sys, user); }); })(ps[i]);
    }
    return chain;
  }

  /* ---------- Skill ---------- */
  function loadSkills(){
    try{
      if(window.ATSkillStore && typeof window.ATSkillStore.listAll === 'function'){
        var a = window.ATSkillStore.listAll();
        if(Array.isArray(a) && a.length) return a;
      }
    }catch(e){}
    return window.AT_SKILLS_BUILTIN || [];
  }
  function skillText(s){
    return s.prompt || s.body || s.content || s.template || s.system || s.instruction || '';
  }

  /* ---------- 最近使用 ---------- */
  function recents(){
    try{ return JSON.parse(localStorage.getItem('atcmd_recents') || '[]'); }catch(e){ return []; }
  }
  function pushRecent(t, n, u){
    try{
      var r = recents().filter(function(x){ return !(x.t === t && x.n === n); });
      r.unshift({t:t, n:n, u:u || ''});
      localStorage.setItem('atcmd_recents', JSON.stringify(r.slice(0,5)));
    }catch(e){}
  }
  function resolveRecent(x){
    if(!x || !x.t) return null;
    var i;
    if(x.t === 'page'){ for(i=0;i<PAGES.length;i++){ if(PAGES[i][0] === x.u) return pageItem(PAGES[i]); } return null; }
    if(x.t === 'ai'){ for(i=0;i<AI_ACTIONS.length;i++){ if(AI_ACTIONS[i][1] === x.n) return aiItem(AI_ACTIONS[i]); } return null; }
    if(x.t === 'skill'){ var ss = loadSkills(); for(i=0;i<ss.length;i++){ if((ss[i].name || '') === x.n) return skillItem(ss[i]); } return null; }
    return null;
  }

  /* ---------- 条目 ---------- */
  function pageItem(p){
    return {t:'page', name:p[1], desc:p[2], icon:p[3] || 'GO', run:function(){
      pushRecent('page', p[1], p[0]); location.href = p[0];
    }};
  }
  function aiItem(a){
    return {t:'ai', name:a[1], desc:a[2], icon:'AI', run:function(){ startAI(a); }};
  }
  function skillItem(s){
    var name = s.name || s.id || '未命名 Skill';
    var desc = s.description || s.desc || '';
    return {t:'skill', name:name, desc:desc, icon:'SK', run:function(){
      pushRecent('skill', name, ''); applySkill(s);
    }};
  }
  function applySkill(s){
    var txt = skillText(s);
    var el = visibleInput();
    if(el){
      if(!txt){ toast('该 Skill 缺少提示词正文'); return; }
      el.value = txt;
      try{ el.dispatchEvent(new Event('input', {bubbles:true})); }catch(e){}
      el.focus();
      toast('已应用 Skill：' + (s.name || ''));
      close(); return;
    }
    try{ sessionStorage.setItem('AT_CMDK_SKILL', JSON.stringify({name:s.name || '', text:txt})); }catch(e){}
    location.href = 'brain.html';
  }
  function startAI(a){
    var src = getSourceText();
    if(src.length > 4){ runAI(a, src); return; }
    state.mode = 'text'; state.action = a;
    input.value = '';
    input.placeholder = a[1] + '：粘贴或输入文本，回车执行';
    render(); input.focus();
  }
  function runAI(a, text){
    state.busy = true;
    list.innerHTML = '<div class="atcmd-group">' + esc(a[1]) + ' 执行中</div><div class="atcmd-empty">正在调用模型，请稍候…</div>';
    callLLM(a[4], text).then(function(out){
      state.busy = false;
      var el = visibleInput();
      if(el){
        el.value = out;
        try{ el.dispatchEvent(new Event('input', {bubbles:true})); }catch(e){}
        el.focus();
        toast('AI 结果已填入输入框');
        close(); return;
      }
      copy(out).then(function(){
        toast('AI 结果已复制到剪贴板'); close();
      }, function(){
        state.mode = 'result'; state.out = out;
        input.value = ''; input.placeholder = '回车复制结果';
        render();
      });
    }).catch(function(e){
      state.busy = false;
      var m = (e && e.message) || String(e);
      toast(m === 'NO_PROFILE' ? '未找到可用模型配置：请到 设置 页添加 API 或使用内置代理' : ('AI 调用失败：' + m));
      render();
    });
  }

  /* ---------- 检索与渲染 ---------- */
  function rank(s, q){ var n = String(s).toLowerCase(); return n.indexOf(q) === 0 ? 0 : 1; }
  function matchPage(p, q){ return (p[1] + ' ' + p[2] + ' ' + (p[4] || '')).toLowerCase().indexOf(q) >= 0; }
  function matchAI(a, q){ return (a[1] + ' ' + a[2] + ' ' + (a[3] || '')).toLowerCase().indexOf(q) >= 0; }
  function matchSkill(s, q){
    var tags = Array.isArray(s.tags) ? s.tags.join(' ') : (s.tags || '');
    var hay = ((s.name || '') + ' ' + (s.description || s.desc || '') + ' ' + tags + ' ' + (s.category || s.cat || '')).toLowerCase();
    return hay.indexOf(q) >= 0;
  }
  function itemHTML(it, i){
    var sel = i === state.sel ? ' atcmd-sel' : '';
    return '<div class="atcmd-item' + sel + '" data-i="' + i + '"><div class="ico">' + esc(it.icon) + '</div><div class="txt"><div class="name">' + esc(it.name) + '</div>' + (it.desc ? '<div class="desc">' + esc(it.desc) + '</div>' : '') + '</div>' + (it.kbd ? '<div class="kbd">' + it.kbd + '</div>' : '') + '</div>';
  }
  function render(){
    if(state.busy) return;
    if(state.mode === 'text'){
      list.innerHTML = '<div class="atcmd-group">模式</div><div class="atcmd-item atcmd-sel"><div class="ico">AI</div><div class="txt"><div class="name">' + esc(state.action[1]) + '</div><div class="desc">粘贴或输入文本后回车执行 · Esc 返回</div></div></div>';
      state.items = [];
      return;
    }
    if(state.mode === 'result'){
      list.innerHTML = '<div class="atcmd-group">AI 结果</div><div class="atcmd-item atcmd-sel" data-i="0"><div class="ico">CP</div><div class="txt"><div class="name">复制完整结果</div><div class="desc">' + esc(state.out.slice(0, 160)) + '</div></div><div class="kbd">↵</div></div>';
      state.items = [{t:'copyout'}];
      return;
    }
    var q = input.value.trim().toLowerCase();
    var blocks = [];
    if(!q){
      var r = recents();
      if(r.length){ blocks.push({g:'最近'}); r.forEach(function(x){ var it = resolveRecent(x); if(it) blocks.push(it); }); }
      blocks.push({g:'AI 指令'});
      AI_ACTIONS.forEach(function(a){ blocks.push(aiItem(a)); });
      blocks.push({g:'工具'});
      PAGES.slice(0, 8).forEach(function(p){ blocks.push(pageItem(p)); });
    } else {
      var ps = [], ss = [], as = [];
      PAGES.forEach(function(p){ if(matchPage(p, q)) ps.push(p); });
      loadSkills().forEach(function(s){ if(matchSkill(s, q)) ss.push(s); });
      AI_ACTIONS.forEach(function(a){ if(matchAI(a, q)) as.push(a); });
      ps.sort(function(x, y){ return rank(x[1], q) - rank(y[1], q); });
      ss.sort(function(x, y){ return rank(x.name || '', q) - rank(y.name || '', q); });
      if(ps.length){ blocks.push({g:'工具'}); ps.slice(0, 8).forEach(function(p){ blocks.push(pageItem(p)); }); }
      if(ss.length){ blocks.push({g:'Skill'}); ss.slice(0, 8).forEach(function(s){ blocks.push(skillItem(s)); }); }
      if(as.length){ blocks.push({g:'AI 指令'}); as.forEach(function(a){ blocks.push(aiItem(a)); }); }
      if(!blocks.length) blocks.push({g:'没有匹配'}, {empty:true});
    }
    var html = '', items = [], i = 0;
    blocks.forEach(function(b){
      if(b.g){ html += '<div class="atcmd-group">' + esc(b.g) + '</div>'; if(b.empty) html += '<div class="atcmd-empty">没有匹配结果，换个关键词试试</div>'; return; }
      html += itemHTML(b, i); items.push(b); i++;
    });
    state.items = items;
    list.innerHTML = html;
  }
  function paintSel(){
    var els = list.querySelectorAll('.atcmd-item');
    for(var i=0;i<els.length;i++){
      var idx = parseInt(els[i].getAttribute('data-i'), 10);
      if(isNaN(idx)) continue;
      if(idx === state.sel) els[i].classList.add('atcmd-sel');
      else els[i].classList.remove('atcmd-sel');
    }
  }
  function scrollSel(){
    var el = list.querySelector('.atcmd-item.atcmd-sel');
    if(el && el.scrollIntoView) el.scrollIntoView({block:'nearest'});
  }
  function exec(it){
    if(state.busy) return;
    if(state.mode === 'result' && it.t === 'copyout'){
      copy(state.out).then(function(){ toast('已复制'); close(); }, function(){ toast('复制失败'); });
      return;
    }
    if(it.run) it.run();
  }

  /* ---------- 面板 ---------- */
  function buildUI(){
    ov = document.createElement('div'); ov.className = 'atcmd-overlay';
    ov.innerHTML = '<div class="atcmd-panel"><div class="atcmd-input"><span>✦</span><input type="text" autocomplete="off" spellcheck="false" placeholder="' + DEFAULT_PH + '"><span class="atcmd-hint">esc</span></div><div class="atcmd-list"></div><div class="atcmd-foot"><span><b>↑↓</b> 选择</span><span><b>↵</b> 执行</span><span><b>esc</b> 关闭</span><span style="margin-left:auto">搜索工具与 Skill</span></div></div>';
    document.body.appendChild(ov);
    input = ov.querySelector('input');
    list = ov.querySelector('.atcmd-list');
    ov.addEventListener('mousedown', function(e){ if(e.target === ov) close(); });
    input.addEventListener('input', function(){ state.sel = 0; if(state.mode === 'normal') render(); });
    list.addEventListener('click', function(e){
      var el = e.target.closest ? e.target.closest('.atcmd-item') : null;
      if(!el) return;
      var i = parseInt(el.getAttribute('data-i'), 10);
      if(!isNaN(i) && state.items[i]) exec(state.items[i]);
    });
    list.addEventListener('mousemove', function(e){
      var el = e.target.closest ? e.target.closest('.atcmd-item') : null;
      if(!el) return;
      var i = parseInt(el.getAttribute('data-i'), 10);
      if(!isNaN(i) && i !== state.sel){ state.sel = i; paintSel(); }
    });
  }
  function open(){
    if(!ov) buildUI();
    state.mode = 'normal'; state.action = null; state.sel = 0; state.busy = false;
    input.value = ''; input.placeholder = DEFAULT_PH;
    render();
    ov.classList.add('atcmd-open');
    state.open = true;
    setTimeout(function(){ input.focus(); }, 0);
  }
  function close(){ if(ov) ov.classList.remove('atcmd-open'); state.open = false; }
  function toggle(){ state.open ? close() : open(); }
  function resetMode(){
    state.mode = 'normal'; state.action = null;
    input.placeholder = DEFAULT_PH;
    render(); input.focus();
  }

  /* ---------- 全局键位（capture 优先） ---------- */
  document.addEventListener('keydown', function(e){
    var k = (e.key || '').toLowerCase();
    if(k === 'k' && (e.metaKey || e.ctrlKey)){
      e.preventDefault(); e.stopPropagation(); toggle(); return;
    }
    if(!state.open) return;
    if(k === 'escape'){
      e.preventDefault(); e.stopPropagation();
      if(state.mode !== 'normal') resetMode(); else close();
      return;
    }
    if(state.mode === 'text'){
      if(e.key === 'Enter'){
        e.preventDefault();
        var v = input.value.trim();
        if(v.length > 4){ var a = state.action; resetMode(); runAI(a, v); }
      }
      return;
    }
    if(e.key === 'ArrowDown'){ e.preventDefault(); state.sel = Math.min(state.sel + 1, state.items.length - 1); paintSel(); scrollSel(); return; }
    if(e.key === 'ArrowUp'){ e.preventDefault(); state.sel = Math.max(state.sel - 1, 0); paintSel(); scrollSel(); return; }
    if(e.key === 'Enter'){ e.preventDefault(); var it = state.items[state.sel]; if(it) exec(it); }
  }, true);

  /* ---------- FAB 入口（双击隐藏 7 天） ---------- */
  function buildFab(){
    try{
      var h = parseInt(localStorage.getItem('atcmd_fab_hide') || '0', 10);
      if(h && Date.now() - h < 7 * 24 * 3600 * 1000) return;
    }catch(e){}
    fab = document.createElement('button');
    fab.className = 'atcmd-fab'; fab.type = 'button';
    fab.title = '命令面板 Ctrl/Cmd+K（双击隐藏 7 天）';
    fab.setAttribute('aria-label', '打开命令面板');
    fab.textContent = 'K';
    fab.addEventListener('click', open);
    fab.addEventListener('dblclick', function(){
      try{ localStorage.setItem('atcmd_fab_hide', String(Date.now())); }catch(e){}
      if(fab.parentNode) fab.parentNode.removeChild(fab);
    });
    document.body.appendChild(fab);
  }

  /* ---------- 跨页 Skill 接力 ---------- */
  function consumePending(){
    var raw = null;
    try{ raw = sessionStorage.getItem('AT_CMDK_SKILL'); }catch(e){}
    if(!raw) return;
    var data = null;
    try{ data = JSON.parse(raw); }catch(e){}
    try{ sessionStorage.removeItem('AT_CMDK_SKILL'); }catch(e){}
    if(!data) return;
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      var el = visibleInput();
      if(el || tries > 8){
        clearInterval(timer);
        if(el && data.text){
          el.value = data.text;
          try{ el.dispatchEvent(new Event('input', {bubbles:true})); }catch(e){}
          el.focus();
          toast('已应用 Skill：' + (data.name || '') + '（回车发送）');
        }
      }
    }, 500);
  }

  function init(){ buildFab(); consumePending(); }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

  window.ATCmdK = { open: open, close: close, toggle: toggle };
})();
