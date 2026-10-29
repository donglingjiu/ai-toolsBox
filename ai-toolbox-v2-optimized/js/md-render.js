try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }/* md-render.js v3 - sync-first wrapper, lazy mermaid */
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }(function () {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var M = { ready: false, mermaidReady: false };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  window.MdRender = M;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var orig = (typeof window.mdRender === 'function') ? window.mdRender : null;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function loadScript(src, cb) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var s = document.createElement('script');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    s.onload = function () { cb(true); };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    s.onerror = function () { cb(false); };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    s.src = src; document.head.appendChild(s);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function loadCss(href) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var l = document.createElement('link');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    l.rel = 'stylesheet'; l.href = href;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    document.head.appendChild(l);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var CSS = '.md-enh table{border-collapse:collapse;margin:12px 0;display:block;overflow-x:auto;max-width:100%}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh th,.md-enh td{border:1px solid rgba(255,255,255,.16);padding:6px 10px;font-size:.92em;text-align:left;vertical-align:top}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh th{background:rgba(255,255,255,.07)}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh tr:nth-child(even) td{background:rgba(255,255,255,.03)}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh pre{background:#0d1117;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;overflow-x:auto}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh pre code.hljs{background:transparent;padding:0}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh .mermaid-box{margin:14px 0;text-align:center;overflow-x:auto}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-enh .mermaid-box svg{max-width:100%;height:auto}';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var HLJS="pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!\n  Theme: GitHub Dark\n  Description: Dark theme as seen on github.com\n  Author: github.com\n  Maintainer: @Hirse\n  Updated: 2021-05-15\n\n  Outdated base version: https://github.com/primer/github-syntax-dark\n  Current colors taken from GitHub's CSS\n*/.hljs{color:#c9d1d9;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}";
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function injectHljs() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var st=document.createElement('style');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    st.textContent=HLJS; document.head.appendChild(st);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function injectCss() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var st = document.createElement('style');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    st.textContent = CSS; document.head.appendChild(st);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function finish() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    try { marked.setOptions({ gfm: true, breaks: true }); M.ready = true; }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    catch (e) { return false; }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (orig) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      window.mdRender = function (t) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        t = tidy(t);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        M.lastText = t;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        mdFabSync();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        var h = M.render(t);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        return (h == null) ? orig(t) : h;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    return true;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.init = function (cb) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (M.ready) return cb && cb(true);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    injectCss();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    injectHljs();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (window.marked && window.hljs) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var ok = finish(); return cb && cb(ok);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    loadScript('js/vendor/marked.min.js', function (ok1) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (!ok1) return cb && cb(false);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      loadScript('js/vendor/highlight.min.js', function (ok2) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        if (!ok2) return cb && cb(false);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        cb && cb(finish());
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function tidy(t) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    t = t.replace(/```markdown\s*\n([\s\S]*?)```/g, function (all, inner) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      return /^(\s*)(#{1,4}\s|\|)/m.test(inner) ? '\n' + inner + '\n' : all;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    return t.replace(/(^|\n)(#{1,4}\s+\d{1,2}\.\s*[^\n\uff08()]{1,40}?)[\uff08(][^\uff08()\n]{2,90}[\uff09)](?=\s*\n|$)/g, '$1$2');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.render = function (text) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!M.ready) return null;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    try { return marked.parse(text || ''); } catch (e) { return null; }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.enhance = function (el, cb) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    cb = cb || function () {};
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!el || !M.ready) return cb(false);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var total = 0, done = 0, fired = false;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    function tick() { if (++done >= total) cb(true); }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    el.querySelectorAll('pre code').forEach(function (code) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (code.dataset.enh) return;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      code.dataset.enh = '1'; fired = true;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (/language-mermaid/i.test(code.className)) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        total++; mdMermaid(code, tick);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      } else {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        total++;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        try { hljs.highlightElement(code); } catch (e) {}
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        tick();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!fired) cb(true);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function mdMermaid(code, done) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var src = code.textContent;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var pre = code.closest ? code.closest('pre') : null;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    function go() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var id = 'mmd-' + Math.random().toString(36).slice(2, 9);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      mermaid.render(id, src).then(function (r) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        var d = document.createElement('div');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        d.className = 'mermaid-box'; d.innerHTML = r.svg;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        if (pre) pre.replaceWith(d); else code.replaceWith(d);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        done();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      }).catch(function () { done(); });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (M.mermaidReady) return go();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    loadScript('js/vendor/mermaid.min.js', function (ok) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (!ok) return done();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      try {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        mermaid.initialize({ startOnLoad: false, theme: 'dark',
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }          securityLevel: 'strict', fontFamily: 'inherit' });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        M.mermaidReady = true; go();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      } catch (e) { done(); }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  /* ---- mind map (markmap), lazy chain, dark overlay ---- */
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.lastText = '';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var fab = null, ov = null, svg = null, mm = null, mmReady = false;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  var MIND_CSS = '#md-mind-fab{position:fixed;right:22px;bottom:22px;z-index:9990;display:none;padding:10px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg,#14b8a6,#6366f1);color:#fff;font-size:14px;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.4)}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '#md-mind-fab:hover{filter:brightness(1.08)}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '#md-mind-ov{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9991;display:none;background:rgba(6,10,20,.97);color:#e8ecf5}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-bar{position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid rgba(255,255,255,.1)}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-bar span{font-size:14px;opacity:.85}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-x{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;font-size:20px;line-height:1;border-radius:8px;padding:2px 10px;cursor:pointer}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-wrap{position:absolute;top:52px;right:0;bottom:0;left:0}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-wrap svg{width:100%;height:100%}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-wrap .markmap-foreign,.md-mind-wrap foreignObject div{color:#e8ecf5}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-wrap pre{background:#0d1117;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:8px;color:#e8ecf5;font-size:.85em;max-height:260px;overflow:hidden}'
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    + '.md-mind-wrap table{color:#e8ecf5}';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function chain(srcs, i, cb) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (i >= srcs.length) return cb(true);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    loadScript(srcs[i], function (ok) { ok ? chain(srcs, i + 1, cb) : cb(false); });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function mdFab() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (fab) return fab;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var st = document.createElement('style');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    st.textContent = MIND_CSS; document.head.appendChild(st);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    fab = document.createElement('button');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    fab.id = 'md-mind-fab';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    fab.textContent = '\u8111\u56fe';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    fab.onclick = openMind;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    document.body.appendChild(fab);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    return fab;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function mdFabSync() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    mdFab().style.display = (M.lastText && M.lastText.length > 60) ? 'block' : 'none';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function openMind() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!M.lastText) return;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!ov) buildOv();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov.style.display = 'block';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    renderMind();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function buildOv() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov = document.createElement('div');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov.id = 'md-mind-ov';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var bar = document.createElement('div');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    bar.className = 'md-mind-bar';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var tip = document.createElement('span');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    tip.textContent = '\u8111\u56fe\u89c6\u56fe \u00b7 \u5f53\u524d\u6587\u6863';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var x = document.createElement('button');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    x.className = 'md-mind-x';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    x.textContent = '\u00d7';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    x.onclick = function () { ov.style.display = 'none'; };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    bar.appendChild(tip); bar.appendChild(x);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var wrap = document.createElement('div');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    wrap.className = 'md-mind-wrap';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    wrap.appendChild(svg);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov.appendChild(bar); ov.appendChild(wrap);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    document.body.appendChild(ov);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov._tip = tip;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    window.addEventListener('resize', function () {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (ov.style.display === 'block' && mm) { try { mm.fit(); } catch (e) {} }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function renderMind() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (mmReady) return draw(M.lastText);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    ov._tip.textContent = '\u8111\u56fe\u5f15\u64ce\u52a0\u8f7d\u4e2d\u2026';
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    chain(['js/vendor/d3.min.js', 'js/vendor/markmap-lib.min.js', 'js/vendor/markmap-view.min.js'], 0, function (ok) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (!ok) { ov._tip.textContent = '\u8d44\u6e90\u52a0\u8f7d\u5931\u8d25 \u00b7 \u8bf7\u7a0d\u540e\u91cd\u8bd5'; return; }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      mmReady = true; ov._tip.textContent = '\u8111\u56fe\u89c6\u56fe \u00b7 \u5f53\u524d\u6587\u6863'; draw(M.lastText);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function fallbackRoot(text) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var root = { content: '\u6587\u6863', children: [] };
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var cur = null;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    text.split('\n').forEach(function (ln) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var m = ln.match(/^(#{1,4})\s+(.*)$/);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (m) { cur = { content: m[2].slice(0, 40), children: [] }; root.children.push(cur); }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      else if (cur && ln.trim() && cur.children.length < 6) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }        cur.children.push({ content: ln.trim().slice(0, 36), children: [] });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    return root;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function mount(root) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (!root) return;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    if (mm) { mm.setData(root); mm.fit(); return; }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    mm = markmap.Markmap.create(svg, { autoFit: true, duration: 300, maxWidth: 300, spacingVertical: 8 }, root);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    setTimeout(function () { try { mm.fit(); } catch (e) {} }, 80);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  function draw(text) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    try {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var tf = new markmap.Transformer();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var r = tf.transform(text);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (r && typeof r.then === 'function') r.then(function (res) { mount(res && res.root); });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      else mount(r && r.root);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    } catch (e) { mount(fallbackRoot(text)); }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.openMind = openMind;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  M.init();
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  if (document.body) {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    var pend = null;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    function sweep() {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      var box = document.getElementById('out-box');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      if (!box || !M.ready) return;
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      box.classList.add('md-enh');
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      M.enhance(box);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    new MutationObserver(function () {
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }      clearTimeout(pend); pend = setTimeout(sweep, 300);
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }    }).observe(document.body, { childList: true, subtree: true });
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }  }
try { var h = marked.parse(text || ''); return window.DOMPurify ? DOMPurify.sanitize(h) : h; } catch (e) { return null; }})();
