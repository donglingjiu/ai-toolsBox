/* AT Skill Boot —— 各对话页零侵入接入器：自动加载 skill 依赖并挂载选择器 */
(function () {
  'use strict';
  var FILES = ['skill-schema.js', 'skills-builtin.data.js', 'skill-store.js', 'skill-picker.js', 'skill-injector.js'];
  function loadCSS() {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'css/skill-picker.css';
    document.head.appendChild(l);
  }
  function loadJS(i) {
    if (i >= FILES.length) { boot(); return; }
    var s = document.createElement('script');
    s.src = 'js/skills/' + FILES[i];
    s.onload = function () { loadJS(i + 1); };
    s.onerror = function () { loadJS(i + 1); };
    document.head.appendChild(s);
  }
  function isVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 20 && el.offsetParent !== null;
  }
  function findInput() {
    var sels = ['#chatInput', '#userInput', '#msgInput', '#promptInput', '#question', '#input', '.chat-input textarea', '.input-area textarea', 'textarea'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && isVisible(el)) return el;
    }
    var tas = document.querySelectorAll('textarea'), best = null, area = 0;
    for (var j = 0; j < tas.length; j++) {
      var t = tas[j];
      if (!isVisible(t)) continue;
      var r = t.getBoundingClientRect(), a = r.width * r.height;
      if (a > area) { area = a; best = t; }
    }
    return best;
  }
  function boot() {
    var el = findInput();
    if (!el) return;
    var page = location.pathname.split('/').pop() || 'index';
    var chatId = page.replace('.html', '') || 'index';
    try { window.ATSkillInjector.attachToChat(el, { chatId: chatId, mode: 'fill' }); } catch (e) {}
  }
  loadCSS();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { loadJS(0); });
  else loadJS(0);
})();
