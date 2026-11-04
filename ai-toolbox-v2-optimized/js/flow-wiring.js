/* flow-wiring.js — v1 轨迹脊柱
 * 原则：纯旁路观察不改业务；依赖缺失自动降级；卡片识别取"最短匹配"防误判
 */
(function () {
  'use strict';
  if (window.__FLOW_WIRED__) return;
  window.__FLOW_WIRED__ = true;

  var CSS = 'color:#8b5cf6;font-weight:bold';
  function T(s) { try { console.log('%c[wiring]', CSS, s); } catch (e) {} }
  if (!window.FlowTrace) T('⚠ FlowTrace 未加载：只打印事件不落轨迹');

  var WF = sessionStorage.getItem('wf_id');
  if (!WF) {
    WF = 'wf_' + new Date().toISOString().slice(2, 16).replace(/[-:T]/g, '');
    sessionStorage.setItem('wf_id', WF);
  }
  var NAME = ['需求分析', '技术调研', '方案设计', '代码实现', '交付评审'];
  var startTs = {}, seen = {};

  function trace(stage, event, extra) {
    var rec = { wf_id: WF, steps: ['s' + stage + ':' + event] };
    if (extra) for (var k in extra) rec[k] = extra[k];
    try { if (window.FlowTrace && FlowTrace.appendTrace) FlowTrace.appendTrace(rec); } catch (e) {}
  }

  function stageOf(t) {
    for (var i = 0; i < 5; i++) if (t.indexOf(NAME[i]) >= 0) return i + 1;
    return 0;
  }
  /* 扫描5张状态卡：同一阶段可能有多个容器匹配（含流式产物误含阶段名），
     取文本最短者=最内层真卡片，天然排除正文干扰 */
  function scanCards() {
    var found = {}, els = document.querySelectorAll('div,li,section');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').replace(/\s+/g, '');
      if (!t || t.length > 120) continue;
      if (/模型[:：]/.test(t) || /阶段完成/.test(t)) continue;  // 排除右侧标题与计数
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
    T('✅ 阶段' + st + ' 完成' + (dur !== null ? ' · ' + dur + 's' : '') +
      (g ? ' · gate=' + JSON.stringify(g).slice(0, 100) : ''));
  }

  function hookBtn(re, label, fn) {
    var b = null, els = document.querySelectorAll('button');
    for (var i = 0; i < els.length; i++)
      if (re.test((els[i].textContent || '').replace(/\s+/g, ''))) { b = els[i]; break; }
    if (!b) { T('未找到「' + label + '」：退化为纯状态观察'); return; }
    b.addEventListener('click', fn, true);
    T('已挂钩「' + label + '」');
  }

  hookBtn(/一键全流程/, '一键全流程', function () {
    
    sessionStorage.setItem('wf_id', WF);
    startTs = {};
    trace(0, 'run_all:start');
    T('��� 新工作流 ' + WF);
  });
  hookBtn(/执行本阶段/, '执行本阶段', function () {
    var 
    if (!st) { T('五阶段已全部完成'); return; }
    startTs[st] = Date.now();
    trace(st, 'start');
    smFire(st, 'start');
    T('▶ 阶段' + st + ' 开始（' + NAME[st - 1] + '）');
  });

  /* 状态翻
  function check() {
    var now = scanCards();
    for (var s = 1; s <= 5; s++) {
      if (!now[s]) continu
      var key = now[s].done ? '1' : '0';
      if (seen[s] === undefined) { seen[s] = key; continue; }
      if (seen[s] === key) continue;
      seen[s] = key;
      if (key === '1') onDone(s);
      else { trace(s, 'reset'); T('↩ 阶段' + s + ' 状态回退'); }
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
  T('v1 就绪 · wf_id=' + WF + ' · 验证: FlowTrace.listTraces(WiringDebug.WF)');
})();
