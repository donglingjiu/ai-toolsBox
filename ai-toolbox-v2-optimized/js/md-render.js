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
  var HLJS="pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!\n  Theme: GitHub Dark\n  Description: Dark theme as seen on github.com\n  Author: github.com\n  Maintainer: @Hirse\n  Updated: 2021-05-15\n\n  Outdated base version: https://github.com/primer/github-syntax-dark\n  Current colors taken from GitHub's CSS\n*/.hljs{color:#c9d1d9;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}";
  function injectHljs() {
    var st=document.createElement('style');
    st.textContent=HLJS; document.head.appendChild(st);
  }
  function injectCss() {
    var st = document.createElement('style');
    st.textContent = CSS; document.head.appendChild(st);
  }
  function finish() {
    try { marked.setOptions({ gfm: true, breaks: true }); M.ready = true; }
    catch (e) { return false; }
    if (orig) {
      window.mdRender = function (t) {
        t = tidy(t);
        M.lastText = t;
        mdFabSync();
        var h = M.render(t);
        return (h == null) ? orig(t) : h;
      };
    }
    return true;
  }
  M.init = function (cb) {
    if (M.ready) return cb && cb(true);
    injectCss();
    injectHljs();
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
  function tidy(t) {
    t = t.replace(/```markdown\s*\n([\s\S]*?)```/g, function (all, inner) {
      return /^(\s*)(#{1,4}\s|\|)/m.test(inner) ? '\n' + inner + '\n' : all;
    });
    return t.replace(/(^|\n)(#{1,4}\s+\d{1,2}\.\s*[^\n\uff08()]{1,40}?)[\uff08(][^\uff08()\n]{2,90}[\uff09)](?=\s*\n|$)/g, '$1$2');
  }
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
  /* ---- mind map (markmap), lazy chain, dark overlay ---- */
  M.lastText = '';
  var fab = null, ov = null, svg = null, mm = null, mmReady = false;
  var MIND_CSS = '#md-mind-fab{position:fixed;right:22px;bottom:22px;z-index:9990;display:none;padding:10px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg,#14b8a6,#6366f1);color:#fff;font-size:14px;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.4)}'
    + '#md-mind-fab:hover{filter:brightness(1.08)}'
    + '#md-mind-ov{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9991;display:none;background:rgba(6,10,20,.97);color:#e8ecf5}'
    + '.md-mind-bar{position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid rgba(255,255,255,.1)}'
    + '.md-mind-bar span{font-size:14px;opacity:.85}'
    + '.md-mind-x{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;font-size:20px;line-height:1;border-radius:8px;padding:2px 10px;cursor:pointer}'
    + '.md-mind-wrap{position:absolute;top:52px;right:0;bottom:0;left:0}'
    + '.md-mind-wrap svg{width:100%;height:100%}'
    + '.md-mind-wrap .markmap-foreign,.md-mind-wrap foreignObject div{color:#e8ecf5}';
  function chain(srcs, i, cb) {
    if (i >= srcs.length) return cb(true);
    loadScript(srcs[i], function (ok) { ok ? chain(srcs, i + 1, cb) : cb(false); });
  }
  function mdFab() {
    if (fab) return fab;
    var st = document.createElement('style');
    st.textContent = MIND_CSS; document.head.appendChild(st);
    fab = document.createElement('button');
    fab.id = 'md-mind-fab';
    fab.textContent = '\u8111\u56fe';
    fab.onclick = openMind;
    document.body.appendChild(fab);
    return fab;
  }
  function mdFabSync() {
    mdFab().style.display = (M.lastText && M.lastText.length > 60) ? 'block' : 'none';
  }
  function openMind() {
    if (!M.lastText) return;
    if (!ov) buildOv();
    ov.style.display = 'block';
    renderMind();
  }
  function buildOv() {
    ov = document.createElement('div');
    ov.id = 'md-mind-ov';
    var bar = document.createElement('div');
    bar.className = 'md-mind-bar';
    var tip = document.createElement('span');
    tip.textContent = '\u8111\u56fe\u89c6\u56fe \u00b7 \u5f53\u524d\u6587\u6863';
    var x = document.createElement('button');
    x.className = 'md-mind-x';
    x.textContent = '\u00d7';
    x.onclick = function () { ov.style.display = 'none'; };
    bar.appendChild(tip); bar.appendChild(x);
    var wrap = document.createElement('div');
    wrap.className = 'md-mind-wrap';
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrap.appendChild(svg);
    ov.appendChild(bar); ov.appendChild(wrap);
    document.body.appendChild(ov);
    ov._tip = tip;
    window.addEventListener('resize', function () {
      if (ov.style.display === 'block' && mm) { try { mm.fit(); } catch (e) {} }
    });
  }
  function renderMind() {
    if (mmReady) return draw(M.lastText);
    ov._tip.textContent = '\u8111\u56fe\u5f15\u64ce\u52a0\u8f7d\u4e2d\u2026';
    chain(['js/vendor/d3.min.js', 'js/vendor/markmap-lib.min.js', 'js/vendor/markmap-view.min.js'], 0, function (ok) {
      if (!ok) { ov._tip.textContent = '\u8d44\u6e90\u52a0\u8f7d\u5931\u8d25 \u00b7 \u8bf7\u7a0d\u540e\u91cd\u8bd5'; return; }
      mmReady = true; draw(M.lastText);
    });
  }
  function fallbackRoot(text) {
    var root = { content: '\u6587\u6863', children: [] };
    var cur = null;
    text.split('\n').forEach(function (ln) {
      var m = ln.match(/^(#{1,4})\s+(.*)$/);
      if (m) { cur = { content: m[2].slice(0, 40), children: [] }; root.children.push(cur); }
      else if (cur && ln.trim() && cur.children.length < 6) {
        cur.children.push({ content: ln.trim().slice(0, 36), children: [] });
      }
    });
    return root;
  }
  function mount(root) {
    if (!root) return;
    if (mm) { mm.setData(root); mm.fit(); return; }
    mm = markmap.Markmap.create(svg, { autoFit: true, duration: 300, maxWidth: 300, spacingVertical: 8 }, root);
    setTimeout(function () { try { mm.fit(); } catch (e) {} }, 80);
  }
  function draw(text) {
    try {
      var tf = new markmap.Transformer();
      var r = tf.transform(text);
      if (r && typeof r.then === 'function') r.then(function (res) { mount(res && res.root); });
      else mount(r && r.root);
    } catch (e) { mount(fallbackRoot(text)); }
  }
  M.openMind = openMind;
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
      clearTimeout(pend); pend = setTimeout(sweep, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
