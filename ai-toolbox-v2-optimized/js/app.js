/* ============ AI 工具箱 · 公共库 ============ */
'use strict';

/* ---------- DOM 快捷方式 ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
const $$ = els;

/* el(tag, attrs, ...children) —— 轻量 createElement 工厂。
   6 个页面（简历/第二大脑/副业顾问/情绪日记/试衣/提示词库）以工厂方式调用
   el('div',{class:'x'},child…) 动态渲染 DOM，故 el 必须是 createElement 工厂而非 querySelector。 */
function el(tag, attrs) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v == null) return;
      if (k === 'class' || k === 'className') node.className = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k === 'html' || k === 'innerHTML') node.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset' && typeof v === 'object') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
      else node.setAttribute(k, v);
    });
  }
  (function add(list) {
    list.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { add(c); return; }
      node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
  })(Array.prototype.slice.call(arguments, 2));
  return node;
}

/* ---------- 提示气泡 ---------- */
let _toastTimer = null;
function toast(msg, type) {
  let box = document.getElementById('atToast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'atToast';
    box.style.cssText = 'position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:9999;padding:10px 18px;border-radius:12px;font-size:14px;max-width:80vw;box-shadow:0 8px 24px rgba(0,0,0,.18);color:#fff;transition:opacity .25s;opacity:0;pointer-events:none;';
    document.body.appendChild(box);
  }
  box.style.background = type === 'error' ? '#e5484d' : (type === 'warn' ? '#d97706' : '#2563eb');
  box.textContent = msg;
  box.style.opacity = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { box.style.opacity = '0'; }, type === 'error' ? 4200 : 2600);
}

/* ---------- 设置（localStorage: at_settings_v1） ---------- */
const SETTINGS_KEY = 'at_settings_v1';
function getSettings() {
  try {
    const s = Object.assign({
      apiBase: '', apiKey: '', model: 'deepseek-chat',
      imgBase: '', imgKey: '', imgModel: 'gpt-image-1',
      virtualApiBase: '', virtualApiKey: '', virtualMode: 'AXN',
      llmProfiles: null, activeProfileId: '', llmFailover: false,
    }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    /* 首次迁移：把旧的单一 apiBase/apiKey/model 生成为一条默认 Profile。
       仅在内存中补齐，不主动写回，避免"仅加载页面"就改动用户存储。 */
    if (!Array.isArray(s.llmProfiles)) {
      s.llmProfiles = [];
      if (s.apiBase && s.apiKey) {
        s.llmProfiles.push({
          id: 'migrated', name: '默认配置', provider: 'openai-compatible',
          baseUrl: s.apiBase, apiKey: s.apiKey, model: s.model || 'deepseek-chat',
          enabled: true, priority: 10,
        });
        s.activeProfileId = s.activeProfileId || 'migrated';
      }
    }
    return s;
  } catch (e) { return { llmProfiles: [] }; }
}
function saveSettings(patch) {
  const s = getSettings();
  Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  return s;
}

/* ---------- 模型 Profile 管理 ---------- */
function genId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
/* URL 安全清洗：只保留 origin+pathname，剥离用户名/密码/query/fragment；仅允许 https（localhost 可 http） */
function sanitizeBaseUrl(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  let u;
  try { u = new URL(t); } catch (e) { throw new Error('接口地址格式无效'); }
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(u.hostname);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && isLocal)) {
    throw new Error('接口地址必须使用 https://（本地调试可用 http://localhost）');
  }
  if (u.username || u.password) throw new Error('接口地址不得内嵌账号密码');
  return u.origin + u.pathname.replace(/\/+$/, '');
}
function getProfiles() { const s = getSettings(); return Array.isArray(s.llmProfiles) ? s.llmProfiles : []; }
function getActiveProfile() {
  const s = getSettings();
  const list = getProfiles().filter(function (p) { return p && p.enabled !== false; });
  if (!list.length) return null;
  const act = list.filter(function (p) { return p.id === s.activeProfileId; })[0];
  return act || list.slice().sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); })[0];
}
/* 故障切换时的候选顺序：活动配置优先，其余按 priority 降序 */
function getFailoverChain() {
  const active = getActiveProfile();
  const rest = getProfiles()
    .filter(function (p) { return p && p.enabled !== false && (!active || p.id !== active.id); })
    .sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
  return (active ? [active] : []).concat(rest);
}
function saveProfiles(list, activeId) {
  return saveSettings({ llmProfiles: list, activeProfileId: activeId != null ? activeId : getSettings().activeProfileId });
}

function llmReady() { return !!getActiveProfile(); }
function imgReady() { const s = getSettings(); return !!(s.imgBase && s.imgKey && s.imgModel); }

/* 未配置 API 时显示页面内提示条（.api-banner） */
function apiBannerIfNeeded() {
  if (llmReady()) return true;
  els('.api-banner').forEach(function (b) { b.style.display = 'flex'; });
  return false;
}

/* ---------- 轻量 Markdown 渲染（先转义再替换，防 XSS） ---------- */
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function mdRender(src) {
  let t = escapeHtml(String(src || ''));
  const codes = [];
  t = t.replace(/```([\s\S]*?)```/g, function (_, c) {
    codes.push('<pre><code>' + c.replace(/^\n/, '') + '</code></pre>');
    return '\u0000C' + (codes.length - 1) + '\u0000';
  });
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  t = t.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  /* 列表 */
  const lines = t.split('\n');
  let out = '', inUl = false, inOl = false;
  lines.forEach(function (ln) {
    const ul = ln.match(/^\s*[-*•]\s+(.*)/);
    const ol = ln.match(/^\s*\d+[.)、]\s+(.*)/);
    if (ul) { if (!inUl) { out += '<ul>'; inUl = true; } out += '<li>' + ul[1] + '</li>'; return; }
    if (ol) { if (!inOl) { out += '<ol>'; inOl = true; } out += '<li>' + ol[1] + '</li>'; return; }
    if (inUl) { out += '</ul>'; inUl = false; }
    if (inOl) { out += '</ol>'; inOl = false; }
    if (/^<h[123]>|^<pre>/.test(ln)) { out += ln; }
    else if (ln.trim() === '') { /* 空行 */ }
    else out += '<p>' + ln + '</p>';
  });
  if (inUl) out += '</ul>';
  if (inOl) out += '</ol>';
  t = out;
  return t.replace(/\u0000C(\d+)\u0000/g, function (_, i) { return codes[+i]; });
}

/* ---------- LLM 调用（OpenAI 兼容 /chat/completions，多 Profile + 故障切换） ---------- */
/* 错误分类：可切换（网络/超时/429/5xx/格式）与不可切换（取消/400/401/403） */
function _isFailoverable(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return false;
  const code = err.httpStatus;
  if (code === 400 || code === 401 || code === 403) return false;
  if (code === 408 || code === 429 || (code >= 500 && code < 600)) return true;
  return true; /* 网络错误、无 code、格式错误 → 可切换 */
}
/* 单次向指定 Profile 发起请求 */
async function _llmCallProfile(profile, messages, opt) {
  const base = sanitizeBaseUrl(profile.baseUrl);
  const url = base + '/chat/completions';
  const body = { model: opt.model || profile.model, messages: messages, stream: opt.stream !== false };
  if (opt.temperature != null) body.temperature = opt.temperature;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + profile.apiKey },
    body: JSON.stringify(body),
    signal: opt.signal,
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(function () { return ''; });
    const e = new Error('模型接口 HTTP ' + resp.status + (txt ? '：' + txt.slice(0, 300) : ''));
    e.httpStatus = resp.status;
    throw e;
  }
  const ctype = resp.headers.get('content-type') || '';
  if (!resp.body || ctype.indexOf('text/event-stream') === -1) {
    const j = await resp.json();
    const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '';
    if (opt.onDelta) opt.onDelta(content);
    return content;
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder('utf-8');
  let buf = '', full = '';
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    buf += dec.decode(r.value, { stream: true });
    const parts = buf.split('\n');
    buf = parts.pop();
    for (const ln of parts) {
      const line = ln.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const d = j.choices && j.choices[0] && (j.choices[0].delta || {});
        if (d.content) { full += d.content; if (opt.onDelta) opt.onDelta(d.content, full); }
      } catch (e) { /* 忽略非 JSON 行 */ }
    }
  }
  return full;
}
async function llmChat(messages, opt) {
  opt = opt || {};
  const chain = getFailoverChain();
  if (!chain.length) throw new Error('请先在「设置」页配置文本模型 API');
  const s = getSettings();
  /* 是否允许切换：全局开关开启 且 调用方未显式禁止；一旦已产生可见输出则不再切换 */
  const allowFailover = s.llmFailover && opt.allowFailover !== false;
  let started = false;
  const wrapDelta = opt.onDelta ? function (d, f) { started = true; opt.onDelta(d, f); } : null;
  let lastErr = null;
  for (let i = 0; i < chain.length; i++) {
    const profile = chain[i];
    try {
      const out = await _llmCallProfile(profile, messages, Object.assign({}, opt, { onDelta: wrapDelta }));
      if (opt.onProfile) opt.onProfile(profile.name, i);
      return out;
    } catch (e) {
      lastErr = e;
      if (!allowFailover || started || !_isFailoverable(e) || i === chain.length - 1) throw e;
      /* 尝试下一个 Profile（最多每个一次） */
    }
  }
  throw lastErr || new Error('模型调用失败');
}

/* ---------- 下载 ---------- */
function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function downloadText(name, text, mime) {
  downloadBlob(name, new Blob([text], { type: mime || 'text/plain;charset=utf-8' }));
}

/* ---------- IndexedDB ---------- */
function idbOpen(dbName, storeName) {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error || new Error('IndexedDB 打开失败')); };
  });
}
function _idbTx(dbName, storeName, mode, fn) {
  return idbOpen(dbName, storeName).then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(storeName, mode);
      const st = tx.objectStore(storeName);
      const req = fn(st);
      tx.oncomplete = function () { db.close(); resolve(req ? req.result : undefined); };
      tx.onerror = function () { db.close(); reject(tx.error || new Error('IndexedDB 操作失败')); };
    });
  });
}
function idbPut(dbName, storeName, val) { return _idbTx(dbName, storeName, 'readwrite', function (st) { return st.put(val); }); }
function idbAll(dbName, storeName) { return _idbTx(dbName, storeName, 'readonly', function (st) { return st.getAll(); }); }
function idbDel(dbName, storeName, key) { return _idbTx(dbName, storeName, 'readwrite', function (st) { return st.delete(key); }); }
function idbClear(dbName, storeName) { return _idbTx(dbName, storeName, 'readwrite', function (st) { return st.clear(); }); }

/* ---------- 读文件为文本（自动编码检测：UTF-8 严格解码失败 → GB18030） ---------- */
async function readTextFile(file) {
  if (/\.docx$/i.test(file.name)) {
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return result.value || '';
  }
  const buf = await file.arrayBuffer();
  try {
    /* fatal: true — 遇到非法 UTF-8 序列立即抛错，据此判定非 UTF-8 */
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (e1) {
    try { return new TextDecoder('gb18030').decode(buf); }
    catch (e2) { return new TextDecoder('utf-8').decode(buf); }
  }
}

/* ---------- BM25 检索（中文 2-gram + 英文单词） ---------- */
function tokenize(text) {
  const t = String(text || '').toLowerCase();
  const toks = [];
  const en = t.match(/[a-z0-9]+/g) || [];
  en.forEach(function (w) { if (w.length > 1) toks.push(w); });
  const cjk = t.match(/[\u4e00-\u9fff]/g) || [];
  for (let i = 0; i < cjk.length - 1; i++) toks.push(cjk[i] + cjk[i + 1]);
  return toks;
}
function bm25Search(docs, query, opt) {
  /* docs: [{id, text, meta}]；返回按相关度排序的 [{id, score, meta}] */
  opt = opt || {};
  const k1 = 1.5, b = 0.75;
  const qToks = tokenize(query);
  if (!qToks.length) return [];
  const docTokens = docs.map(function (d) { return tokenize(d.text); });
  const N = docs.length;
  let avgLen = 0;
  docTokens.forEach(function (tk) { avgLen += tk.length; });
  avgLen = avgLen / N || 1;
  /* df 表 */
  const df = {};
  docTokens.forEach(function (tk) {
    const set = {};
    tk.forEach(function (w) { set[w] = 1; });
    Object.keys(set).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
  });
  const results = docs.map(function (d, i) {
    const tk = docTokens[i];
    const tf = {};
    tk.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
    let score = 0;
    const matched = [];
    qToks.forEach(function (q) {
      if (!tf[q]) return;
      matched.push(q);
      const idf = Math.log(1 + (N - df[q] + 0.5) / (df[q] + 0.5));
      score += idf * (tf[q] * (k1 + 1)) / (tf[q] + k1 * (1 - b + b * tk.length / avgLen));
    });
    return { id: d.id, score: score, meta: d.meta, text: d.text };
  }).filter(function (r) { return r.score > 0; });
  results.sort(function (a, bb) { return bb.score - a.score; });
  return opt.limit ? results.slice(0, opt.limit) : results;
}
