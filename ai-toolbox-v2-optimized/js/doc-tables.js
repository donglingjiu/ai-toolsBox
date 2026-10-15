/* doc-tables.js — 从 Word(.docx) / PDF / HTML 文档中提取表格数据
 * 输出与 xlsx-core.js 的 xlsxParse 同构：{ sheetNames, sheets: { name: { aoa } }, source }
 * 纯逻辑函数（tablesAoaFromHtml / pdfRowsToTables）可在 Node vm 中测试。
 */
(function () {
  'use strict';

  function decodeEntities(s) {
    return String(s)
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'").replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&');
  }

  /* ---------- HTML <table> → aoa（支持 colspan/rowspan 占位回填） ---------- */
  function htmlTableToAoa(tblHtml) {
    var occ = []; /* occ[r][c] = true 表示被上方 rowspan 占用 */
    function nextFree(r) {
      occ[r] = occ[r] || [];
      var c = 0;
      while (occ[r][c]) c++;
      return c;
    }
    function occupy(r, c) { occ[r] = occ[r] || []; occ[r][c] = true; }
    var rowsOut = [];
    var rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    var m, r = 0;
    while ((m = rowRe.exec(tblHtml))) {
      rowsOut[r] = rowsOut[r] || [];
      var cellRe = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
      var c;
      while ((c = cellRe.exec(m[1]))) {
        var openTag = c[0].slice(0, c[0].indexOf('>') + 1);
        var cs = parseInt((openTag.match(/colspan\s*=\s*["']?(\d+)/i) || [0, 1])[1], 10) || 1;
        var rs = parseInt((openTag.match(/rowspan\s*=\s*["']?(\d+)/i) || [0, 1])[1], 10) || 1;
        var text = decodeEntities(c[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
        var col0 = nextFree(r);
        for (var k = 0; k < cs; k++) { rowsOut[r][col0 + k] = k === 0 ? text : ''; occupy(r, col0 + k); }
        for (var d = 1; d < rs; d++) {
          rowsOut[r + d] = rowsOut[r + d] || [];
          for (var k2 = 0; k2 < cs; k2++) { rowsOut[r + d][col0 + k2] = ''; occupy(r + d, col0 + k2); }
        }
      }
      r++;
    }
    var width = rowsOut.reduce(function (w, row) { return Math.max(w, row ? row.length : 0); }, 0);
    if (!width) return null;
    return rowsOut.filter(Boolean).map(function (row) {
      var out = [];
      for (var i = 0; i < width; i++) out.push(row[i] === undefined ? '' : row[i]);
      return out;
    });
  }

  function tablesAoaFromHtml(html) {
    var tables = String(html || '').match(/<table[\s\S]*?<\/table>/gi) || [];
    var out = [];
    tables.forEach(function (tbl) {
      var aoa = htmlTableToAoa(tbl);
      if (aoa && aoa.length && aoa[0].length) out.push(aoa);
    });
    if (!out.length) throw new Error('文档中未找到表格（Word 请另存为 .docx 格式）');
    return out;
  }

  /* ---------- PDF：items → 行聚类 → 间隙切列 → 表格段识别 ---------- */
  function pdfPageRows(items) {
    var its = [];
    (items || []).forEach(function (it) {
      if (!it.str || !it.str.trim()) return;
      its.push({
        x: it.transform[4], y: it.transform[5],
        w: it.width || it.str.length * 6, h: it.height || 10,
        s: it.str.trim(),
      });
    });
    if (its.length < 4) return [];
    var hs = its.map(function (i) { return i.h; }).sort(function (a, b) { return a - b; });
    var medH = hs[Math.floor(hs.length / 2)] || 10;
    var ws = its.map(function (i) { return i.w; }).sort(function (a, b) { return a - b; });
    var medW = ws[Math.floor(ws.length / 2)] || 6;
    var tol = medH * 0.5;
    var gapTh = Math.max(medW * 1.7, medH * 1.1);

    its.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [];
    var cur = null;
    its.forEach(function (it) {
      if (!cur || Math.abs(it.y - cur.y) > tol) {
        cur = { y: it.y, items: [it] };
        lines.push(cur);
      } else {
        cur.items.push(it);
        if (it.y > cur.y) cur.y = it.y;
      }
    });

    var rows = lines.map(function (ln) {
      var arr = ln.items.slice().sort(function (a, b) { return a.x - b.x; });
      var cells = [];
      var acc = arr[0];
      for (var i = 1; i < arr.length; i++) {
        var gap = arr[i].x - (acc.x + acc.w);
        if (gap > gapTh) { cells.push(acc.s); acc = arr[i]; }
        else {
          acc = {
            x: acc.x, y: acc.y, h: acc.h,
            w: (arr[i].x + arr[i].w) - acc.x,
            s: acc.s + (gap > gapTh * 0.45 ? ' ' : '') + arr[i].s,
          };
        }
      }
      cells.push(acc.s);
      return cells;
    });

    /* 连续 ≥2 列的行聚成表格段 */
    var segs = [];
    var seg = [];
    var prevLen = -1;
    function flush() { if (seg.length >= 2) segs.push(seg.slice()); seg = []; }
    rows.forEach(function (r) {
      if (r.length >= 2 && (prevLen === -1 || Math.abs(r.length - prevLen) <= 1)) {
        seg.push(r); prevLen = r.length;
      } else {
        flush();
        if (r.length >= 2) { seg = [r]; prevLen = r.length; }
        else { prevLen = -1; }
      }
    });
    flush();

    /* 伪表格过滤：列数一致率 ≥ 60% 且列数 ≥ 2 */
    return segs.filter(function (t) {
      if (t.length < 2) return false;
      var w0 = t[0].length;
      var same = t.filter(function (r) { return r.length === w0; }).length;
      return w0 >= 2 && same / t.length >= 0.6;
    });
  }

  /* ---------- 包装为 parsed 结构 ---------- */
  function wrapSheets(list, prefix) {
    var sheets = {}, names = [];
    list.forEach(function (aoa, i) {
      var nm = prefix + (i + 1);
      names.push(nm);
      sheets[nm] = { aoa: aoa };
    });
    return { sheetNames: names, sheets: sheets, source: 'doc' };
  }

  function docTablesFromHtml(html) {
    return wrapSheets(tablesAoaFromHtml(html), '网页表格');
  }

  function docTablesFromDocx(buf) {
    var M = (typeof window !== 'undefined' && window.mammoth) || (typeof mammoth !== 'undefined' ? mammoth : null);
    if (!M) return Promise.reject(new Error('mammoth 引擎未加载（js/mammoth.browser.min.js）'));
    return M.convertToHtml({ arrayBuffer: buf }).then(function (res) {
      return wrapSheets(tablesAoaFromHtml(res && res.value), '表格');
    });
  }

  function docTablesFromPdf(buf) {
    var lib = (typeof window !== 'undefined' && window.pdfjsLib) || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
    if (!lib) return Promise.reject(new Error('pdf.js 引擎未加载（js/pdfjs/pdf.min.js）'));
    try { lib.GlobalWorkerOptions.workerSrc = lib.GlobalWorkerOptions.workerSrc || 'js/pdfjs/pdf.worker.min.js'; } catch (e) { /* ignore */ }
    return lib.getDocument({ data: new Uint8Array(buf) }).promise.then(function (doc) {
      var jobs = [];
      var n = Math.min(doc.numPages, 30);
      for (var i = 1; i <= n; i++) {
        jobs.push(doc.getPage(i).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
          return pdfPageRows(tc.items);
        }));
      }
      return Promise.all(jobs).then(function (perPage) {
        var tables = [];
        perPage.forEach(function (list) { tables = tables.concat(list); });
        if (!tables.length) throw new Error('PDF 中未检测到表格（纯文字或扫描件无法提取，扫描件请先 OCR）');
        return wrapSheets(tables, 'PDF表格');
      });
    });
  }

  var G = (typeof window !== 'undefined') ? window : global;
  G.tablesAoaFromHtml = tablesAoaFromHtml;
  G.pdfPageRows = pdfPageRows;
  G.docTablesFromDocx = docTablesFromDocx;
  G.docTablesFromPdf = docTablesFromPdf;
  G.docTablesFromHtml = docTablesFromHtml;
})();
