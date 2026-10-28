/* md-render.js v3 - sync-first wrapper, lazy mermaid */
(function () {
  var M = { ready: false, mermaidReady: false };
  window.MdRender = M;
  var orig = (typeof window.mdRender === 'function') ? window.mdRender : null;
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    s.src = src; document.head.appendChild(s);
  }
  function loadCss(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
  var CSS = '.md-enh table{border-collapse:collapse;margin:12px 0;display:block;overflow-x:auto;max-width:100%}'
    + '.md-enh th,.md-enh td{border:1px solid rgba(255,255,255,.16);padding:6px 10px;font-size:.92em;text-align:left;vertical-align:top}'
    + '.md-enh th{background:rgba(255,255,255,.07)}'
    + '.md-enh tr:nth-child(even) td{background:rgba(255,255,255,.03)}'
    + '.md-enh pre{background:#0d1117;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;overflow-x:auto}'
    + '.md-enh pre code.hljs{background:transparent;padding:0}'
    + '.md-enh .mermaid-box{margin:14px 0;text-align:center;overflow-x:auto}'
    + '.md-enh .mermaid-box svg{max-width:100%;height:auto}';
  function injectCss() {
    var st = document.createElement('style');
    st.textContent = CSS; document.head.appendChild(st);
  }
  function finish() {
    try { marked.setOptions({ gfm: true, breaks: true }); M.ready = true; }
    catch (e) { return false; }
    if (orig) {
      window.mdRender = function (t) {
        var h = M.render(t);
        return (h == null) ? orig(t) : h;
      };
    }
    return true;
  }
  M.init = function (cb) {
    if (M.ready) return cb && cb(true);
    injectCss();
    loadCss('js/vendor/github-dark.min.css');
    if (window.marked && window.hljs) {
      var ok = finish(); return cb && cb(ok);
    }
    loadScript('js/vendor/marked.min.js', function (ok1) {
      if (!ok1) return cb && cb(false);
      loadScript('js/vendor/highlight.min.js', function (ok2) {
        if (!ok2) return cb && cb(false);
        cb && cb(finish());
      });
    });
  };
  M.render = function (text) {
    if (!M.ready) return null;
    try { return marked.parse(text || ''); } catch (e) { return null; }
  };
  M.enhance = function (el, cb) {
    cb = cb || function () {};
    if (!el || !M.ready) return cb(false);
    var total = 0, done = 0, fired = false;
    function tick() { if (++done >= total) cb(true); }
    el.querySelectorAll('pre code').forEach(function (code) {
      if (code.dataset.enh) return;
      code.dataset.enh = '1'; fired = true;
      if (/language-mermaid/i.test(code.className)) {
        total++; mdMermaid(code, tick);
      } else {
        total++;
        try { hljs.highlightElement(code); } catch (e) {}
        tick();
      }
    });
    if (!fired) cb(true);
  };
  function mdMermaid(code, done) {
    var src = code.textContent;
    var pre = code.closest ? code.closest('pre') : null;
    function go() {
      var id = 'mmd-' + Math.random().toString(36).slice(2, 9);
      mermaid.render(id, src).then(function (r) {
        var d = document.createElement('div');
        d.className = 'mermaid-box'; d.innerHTML = r.svg;
        if (pre) pre.replaceWith(d); else code.replaceWith(d);
        done();
      }).catch(function () { done(); });
    }
    if (M.mermaidReady) return go();
    loadScript('js/vendor/mermaid.min.js', function (ok) {
      if (!ok) return done();
      try {
        mermaid.initialize({ startOnLoad: false, theme: 'dark',
          securityLevel: 'strict', fontFamily: 'inherit' });
        M.mermaidReady = true; go();
      } catch (e) { done(); }
    });
  }
  M.init();
  if (document.body) {
    var pend = null;
    function sweep() {
      var box = document.getElementById('out-box');
      if (!box || !M.ready) return;
      box.classList.add('md-enh');
      M.enhance(box);
    }
    new MutationObserver(function () {
      clearTimeout(pend); pend =
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
