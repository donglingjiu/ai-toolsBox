/* mind-export-v2: OPML / FreeMind / Markdown export
   源头单一事实源 = #mind-src（Markdown 原文）
   v2: toMd 改 kind 感知——h 按语义深度出标题(根 H1 不再丢)，
   li/p 相对最近标题祖先出缩进列表(列表语义保留)，导出↔导入幂等 */
(function(){
  'use strict';
  var src = document.getElementById('mind-src');
  var dl = document.getElementById('mind-dl');
  if (!src || !dl) return;
  var png = document.getElementById('mind-dl-png');
  var ref = png || dl;
  var toast = window.novaToast || function (m) { alert(m); };
  var xesc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  function mdToTree(text) {
    var root = { text: 'Mindmap', kind: 'h', depth: 0, children: [] };
    var stack = [root];
    var anchor = function () {
      for (var i = stack.length - 1; i > 0; i--)
        if (stack[i].kind === 'h') return stack[i].depth;
      return 0;
    };
    String(text).split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        var d = m[1].length;
        while (stack.length > 1 && stack[stack.length - 1].depth >= d) stack.pop();
        var nh = { text: m[2].trim(), kind: 'h', depth: d, children: [] };
        stack[stack.length - 1].children.push(nh);
        stack.push(nh);
        return;
      }
      m = line.match(/^(\s*)(?:[-*+]|\d+[.\x29])\s+(.*)$/);
      if (m) {
        var ind = Math.floor(m[1].replace(/\t/g, '  ').length / 2);
        var d2 = anchor() + 1 + ind;
        while (stack.length > 1 && stack[stack.length - 1].depth >= d2) stack.pop();
        var nl = { text: m[2].trim(), kind: 'li', depth: d2, children: [] };
        stack[stack.length - 1].children.push(nl);
        stack.push(nl);
        return;
      }
      var top = stack[stack.length - 1];
      top.children.push({ text: line.trim(), kind: 'p', depth: top.depth + 1, children: [] });
    });
    return root;
  }
  function collapse(root) {
    if (root.children && root.children.length === 1) return root.children[0];
    return root;
  }
  function toMd(root) {
    var out = [];
    (function walk(n, base) {
      if (n.depth > 0) {
        if (n.kind === 'h') {
          if (out.length) out.push('');
          out.push(new Array(n.depth + 1).join('#') + ' ' + n.text);
        } else {
          var lvl = Math.max(1, n.depth - base);
          out.push(new Array(lvl).join('  ') + (n.kind === 'p' ? '' : '- ') + n.text);
        }
      }
      var nb = n.kind === 'h' ? n.depth : base;
      (n.children || []).forEach(function (c) { walk(c, nb); });
    })(root, 0);
    return out.join('\n') + '\n';
  }
  function toOpml(root) {
    var out = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<opml version="2.0">',
      '<head><title>' + xesc(root.text) + '</title></head>', '<body>'];
    (function walk(n) {
      var kids = n.children || [];
      if (kids.length) {
        out.push('<outline text="' + xesc(n.text) + '">');
        kids.forEach(walk);
        out.push('</outline>');
      } else out.push('<outline text="' + xesc(n.text) + '"/>');
    })(root);
    out.push('</body>', '</opml>');
    return out.join('\n') + '\n';
  }
  function toMm(root) {
    var out = ['<map version="1.0.1">'];
    (function walk(n) {
      var kids = n.children || [];
      if (kids.length) {
        out.push('<node TEXT="' + xesc(n.text) + '">');
        kids.forEach(walk);
        out.push('</node>');
      } else out.push('<node TEXT="' + xesc(n.text) + '"/>');
    })(root);
    out.push('</map>');
    return out.join('\n') + '\n';
  }
  function save(text, ext, mime) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mindmap-' + Date.now() + '.' + ext;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function mkBtn(id, label) {
    var b = document.getElementById(id);
    if (b) return b;
    b = document.createElement('button');
    b.id = id; b.className = 'mbtn'; b.type = 'button';
    b.textContent = label;
    ref.parentNode.insertBefore(b, ref);
    return b;
  }
  [['mind-dl-opml', '导出 OPML', toOpml, 'opml', 'text/x-opml+xml'],
   ['mind-dl-mm', '导出 FreeMind', toMm, 'mm', 'text/xml'],
   ['mind-dl-md', '导出 MD', toMd, 'md', 'text/markdown']
  ].forEach(function (cfg) {
    mkBtn(cfg[0], cfg[1]).onclick = function () {
      if (!src.value.trim()) { toast('先在左侧粘贴 Markdown，再导出'); return; }
      save(cfg[2](collapse(mdToTree(src.value))), cfg[3], cfg[4]);
    };
  });
})();
