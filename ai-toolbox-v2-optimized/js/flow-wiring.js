/* flow-wiring.js v1.1 - observe-only trace spine
 * bypass design: never touches business logic; auto-degrade if deps missing */
(function () {
  'use strict';
  if (window.__FLOW_WIRED__) return;
  window.__FLOW_WIRED__ = true;

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
/* -- part 1 ok -- */

  function trace(stage, event, extra) {
    var rec = { wf_id: WF, steps: ['s' + stage + ':' + event] };
    if (extra) for (var k in extra) rec[k] = extra[k];
    try { if (window.FlowTrace && FlowTrace.appendTrace) FlowTrace.appendTrace(rec); } catch (e) {}
  }

  function stageOf(t) {
    for (var i = 0; i < 5; i++) if (t.indexOf(CN[i]) >= 0) return i + 1;
    return 0;
  }

  function scanCards() {
    var found = {}, els = document.querySelectorAll('div,li,section');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').replace(/\s+/g, '');
      if (!t || t.length > 120) continue;
      if (/模型[:：]/.test(t) || /阶段完成/.test(t)) continue;
      var s = stageOf(t);
      if (!s) continue;
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
/* -- part 2 ok -- */

  function gateScore(stage) {
    try {
      var G = window.GateScorer;
      if (!G) return null;
      var gid = stage <= 2 ? 'G1' : (stage === 3 ? 'G2' : 'G3');
      var text = window.__getProduct ? (window.__getProduct(stage) || '') : '';
      if (typeof G.score === 'function') return G.score(gid, text);
      if (typeof G.scoreGate === 'function') return G.scoreGate(gid, text);
    } catch (e) {}
    return null;
  }

  function smFire(stage, ok) {
    try {
      var sm = window.__wf_sm;
      if (sm && typeof sm.transition === 'function') sm.transition('s' + stage, ok);
    } catch (e) {}
  }

  function onDone(st) {
    var dur = startTs[st] ? Math.round((Date.now() - startTs[st]) / 1000) : null;
    var g = gateScore(st), ex = {};
    if (dur !== null) ex.dur_s = dur;
    if (g) ex.gate = g;
    trace(st, 'done', ex);
    smFire(st, true);
    T('stage ' + st + ' done' + (dur !== null ? ' in ' + dur + 's' : '') +
      (g ? ' gate=' + JSON.stringify(g).slice(0, 100) : ''));
  }

  function hookBtn(re, label, fn) {
    var b = null, els = document.querySelectorAll('button');
    for (var i = 0; i < els.length; i++)
      if (re.test((els[i].textContent || '').replace(/\s+/g, ''))) { b = els[i]; break; }
    if (!b) { T('button not found: ' + label + ' observe-only'); return; }
    b.addEventListener('click', fn, true);
    T('hooked: ' + label);
  }
/* -- part 3 ok -- */

  hookBtn(/一键全流程/, 'run-all', function () {
    WF = 'wf_' + Date.now().toString(36);
    sessionStorage.setItem('wf_id', WF);
    startTs = {}; seen = {};
    trace(0, 'run_all:start');
    T('new workflow ' + WF);
  });
  hookBtn(/执行本阶段/, 'run-stage', function () {
    var st = currentStage();
    if (!st) { T('all 5 stages done'); return; }
    startTs[st] = Date.now();
    trace(st, 'start');
    smFire(st, 'start');
    T('stage ' + st + ' start');
  });

  function check() {
    var now = scanCards();
    for (var s = 1; s <= 5; s++) {
      if (!now[s]) continue;
      var key = now[s].done ? '1' : '0';
      if (seen[s] === undefined) { seen[s] = key; continue; }
      if (seen[s] === key) continue;
      seen[s] = key;
      if (key === '1') onDone(s);
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
    seen: seen, startTs: startTs, rescan: scanCards, current: currentStage
  };
  T('v1.1 ready wf_id=' + WF);
})();
