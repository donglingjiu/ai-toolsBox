/* flow-wiring.js v2 - observe-only trace spine
 * ID hooks + status-word cards + SM shadow recorder + gate heuristics */
(function () {
  'use strict';
  window.__FLOW_WIRED__ = true;
  window.__WIRING_V__ = 2;

  var CSS = 'color:#8b5cf6;font-weight:bold';
  function T(s) { try { console.log('%c[wiring]', CSS, s); } catch (e) {} }
  if (!window.FlowTrace) T('WARN FlowTrace missing: print-only mode');

  var WF = sessionStorage.getItem('wf_id');
  if (!WF) {
    WF = 'wf_' + new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '');
    sessionStorage.setItem('wf_id', WF);
  }
  var CN = ['需求分析', '技术调研', '方案设计', '代码实现', '交付评审'];
  var startTs = {}, seen = {};

  function trace(stage, event, extra) {
    var rec = { wf_id: WF, steps: ['s' + stage + ':' + event] };
    if (extra) for (var k in extra) rec[k] = extra[k];
    try { if (window.FlowTrace && FlowTrace.appendTrace) FlowTrace.appendTrace(rec); } catch (e) {}
    try {
      var K = 'flow_traces_' + WF, arr = [];
      try { arr = JSON.parse(localStorage.getItem(K) || '[]'); } catch (e2) {}
      arr.push(rec);
      localStorage.setItem(K, JSON.stringify(arr));
    } catch (e) {}
  }
/* -- part 1 ok -- */

  function stageOf(t) {
    for (var i = 0; i < 5; i++) if (t.indexOf(CN[i]) >= 0) return i + 1;
    return 0;
  }
  /* v2: node must contain stage name AND a status word; shortest wins */
  function scanCards() {
    var found = {}, els = document.querySelectorAll('div,li,section');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').replace(/\s+/g, '');
      if (!t || t.length > 120) continue;
      if (/模型[:：]/.test(t) || /阶段完成/.test(t)) continue;
      var s = stageOf(t);
      if (!s) continue;
      if (!/(完成|生成中|失败|跳过|等待)/.test(t)) continue;
      if (!found[s] || t.length < found[s].len)
        found[s] = { len: t.length, done: /完成$/.test(t), fail: /失败/.test(t) };
    }
    return found;
  }
  function currentStage() {
    var c = scanCards();
    for (var i = 1; i <= 5; i++) if (!c[i] || !c[i].done) return i;
    return 0;
  }
  function productText(st) {
    if (window.__getProduct) { try { var x = __getProduct(st); if (x) return x; } catch (e) {} }
    var best = '', els = document.querySelectorAll('div,section,article');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').replace(/\s+/g, '');
      if (t.length > best.length && t.length <= 8000 && t.indexOf(CN[st - 1]) >= 0) best = t;
    }
    return best;
  }
  function cov(t, words) {
    var hit = 0;
    for (var i = 0; i < words.length; i++) if (t.indexOf(words[i]) >= 0) hit++;
    return Math.round(100 * hit / words.length);
  }
  function gateScore(st) {
    try {
      if (typeof window.scoreGate !== 'function') return null;
      var text = productText(st);
      if (!text) return null;
      var gid, m;
      if (st <= 2) { gid = 'G1'; m = { req_completeness: cov(text, ['页面', '功能', '约束', '验收']) }; }
      else if (st === 3) { gid = 'G2'; m = { prd_coverage: cov(text, ['架构', '页面', '接口', '风险']), user_confirmed: 80 }; }
      else { gid = 'G3'; m = { token_coverage: Math.min(100, Math.round(text.length / 40)), page_list_ready: cov(text, ['页面', '路由']) }; }
      var r = window.scoreGate(gid, m);
      r.heur = true;
      return r;
    } catch (e) { return null; }
  }
/* -- part 2 ok -- */

  /* StateMachine shadow: real instance, recorder-only (never calls run()) */
  var sm = null;
  try {
    if (typeof window.StateMachine === 'function') {
      sm = new StateMachine({ id: 'flow-shadow', steps: [] }, { onStep: function () {}, onDone: function () {} });
      window.__wf_sm = sm;
      T('StateMachine shadow attached');
    }
  } catch (e) { sm = null; }
  function smNote(stage, event, extra) {
    try {
      if (!sm) return;
      sm.ctx.outputs['s' + stage] = { event: event, extra: extra || null };
      sm.ctx.cursor = stage;
      sm.state = (event === 'done' && stage === 5) ? 'done' : (event === 'cancel' ? 'paused' : 'running');
      if (typeof sm.persist === 'function') sm.persist();
    } catch (e) {}
  }

  function onDone(st) {
    var dur = startTs[st] ? Math.round((Date.now() - startTs[st]) / 1000) : null;
    var g = gateScore(st), ex = {};
    if (dur !== null) ex.dur_s = dur;
    if (g) ex.gate = g;
    trace(st, 'done', ex);
    smNote(st, 'done', ex);
    T('stage ' + st + ' done' + (dur !== null ? ' ' + dur + 's' : '') +
      (g ? ' gate=' + g.score + '/' + g.threshold : ''));
  }

  function onFail(st) {
    trace(st, 'fail');
    T('stage ' + st + ' fail');
  }
  function hookBtn(re, fn) {
    var els = document.querySelectorAll('button');
    for (var i = 0; i < els.length; i++)
      if (re.test((els[i].textContent || '').replace(/\s+/g, ''))) {
        els[i].addEventListener('click', fn, true); T('hooked by text'); return;
      }
    T('button not found: ' + re);
  }
  function hookId(id, re, fn) {
    var b = document.getElementById(id);
    if (b) { b.addEventListener('click', fn, true); T('hooked #' + id); return; }
    hookBtn(re, fn);
  }
/* -- part 3 ok -- */

  hookId('run-all', /一键全流程/, function () {
    WF = 'wf_' + Date.now().toString(36);
    sessionStorage.setItem('wf_id', WF);
    startTs = {}; seen = {};
    trace(0, 'run_all:start');
    smNote(0, 'run_all', null);
    T('new workflow ' + WF);
  });
  hookId('run-stage', /执行本阶段/, function () {
    var st = currentStage();
    if (!st) { T('all 5 stages done'); return; }
    startTs[st] = Date.now();
    trace(st, 'start');
    smNote(st, 'start', null);
    T('stage ' + st + ' start');
  });
  hookId('stop-btn', /停止/, function () {
    var st = currentStage();
    trace(st, 'cancel');
    smNote(st, 'cancel', null);
    T('stage ' + st + ' cancel');
  });

  function check() {
    var now = scanCards();
    for (var s = 1; s <= 5; s++) {
      if (!now[s]) continue;
      var key = now[s].done ? '1' : (now[s].fail ? 'F' : '0');
      if (seen[s] === undefined) { seen[s] = key; continue; }
      if (seen[s] === key) continue;
      seen[s] = key;
      if (key === '1') onDone(s);
      else if (key === 'F') onFail(s);
      else { trace(s, 'reset'); T('stage ' + s + ' reset'); }
    }
  }
  var deb;
  new MutationObserver(function () {
    clearTimeout(deb); deb = setTimeout(check, 300);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  setTimeout(check, 600);

  window.WiringDebug = {
    get WF() { return WF; },
    version: 2,
    dump: function () {
      try {
        var all = JSON.parse(localStorage.getItem('flow_traces_' + WF) || '[]');
        copy(JSON.stringify(all)); console.log('dumped ' + all.length + ' traces to clipboard');
        return all;
      } catch (e) { return []; }
    },
    seen: seen, startTs: startTs, rescan: scanCards, current: currentStage,
    product: productText
  };
  T('v2.2 ready wf_id=' + WF);
})();
