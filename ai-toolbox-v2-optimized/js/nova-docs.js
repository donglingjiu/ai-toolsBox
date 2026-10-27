/* ============================================================
   Nova Docs v1.3 · 文件处理队列 / 确定性转换引擎 / Nova Vault(IndexedDB)
   v1.0: mammoth(docx→html)、SheetJS(xlsx/csv)、pdf.js(pdf→txt/md)
   v1.1: pdf→docx（复用 pdf2word-core，纯文本流重建）
   v1.2: 自研版面引擎（行聚类/列拆分/表格合成/图片版 DOCX）
   v1.3: 版面引擎三修（发票类高密度表格版式）：
        · 表格列宽自适应：按列内容最大宽度加权分配 dxa，不再均分挤压
        · 竖排文字合并：连续单字行且 x 相近 → 合并为一个段落
        · 表头吸附：整行跨度重叠率 >55% 即并入表格（容忍列内居中）
        · 标题拆分：大字行多区块时首块做标题、其余独立成段
   诚实边界：docx→pdf 不提供；扫描版 PDF 文本模式明确报错（图片版可用）
   ============================================================ */
"use strict";

const $d = (s) => document.querySelector(s);
const $$d = (s) => Array.from(document.querySelectorAll(s));
const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(2) + " MB";
const extOf = (n) => (n.split(".").pop() || "").toLowerCase();
const baseOf = (n) => n.replace(/\.[^.]+$/, "");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const safeName = (s) => s.replace(/[\\/:*?"<>|]/g, "_");
const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; };
/* 估算显示宽度：CJK 全角算 2，半角算 1（用于表格列宽加权） */
const estW = (s) => [...String(s)].reduce((w, ch) => w + (/[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("加载失败 " + src));
    document.head.appendChild(s);
  });
}

/* ---------- 转换矩阵 ---------- */
const SHEET_FMTS = [
  { v: "csv",  label: "CSV（每工作表一份）" },
  { v: "json", label: "JSON" },
  { v: "xlsx", label: "XLSX 重存" },
];
const CONVERT = {
  docx: [ { v: "html", label: "HTML 网页" }, { v: "txt", label: "纯文本 TXT" } ],
  pdf:  [
    { v: "docx",  label: "Word · 智能文本重建（可编辑）" },
    { v: "docxim", label: "Word · 高保真图片版（视觉还原）" },
    { v: "txt",   label: "纯文本 TXT" },
    { v: "md",    label: "Markdown MD" },
  ],
  xlsx: SHEET_FMTS, xls: SHEET_FMTS,
  csv:  [ { v: "json", label: "JSON" }, { v: "xlsx", label: "XLSX 表格" } ],
  html: [ { v: "print", label: "打印 / 导出 PDF（系统打印）" } ],
  htm:  [ { v: "print", label: "打印 / 导出 PDF（系统打印）" } ],
};
const targetsFor = (ext) => CONVERT[ext] || [ { v: "vault", label: "不转换，仅存入星库" } ];

/* ---------- pdf.js / docx 组件加载（路径已钉死） ---------- */
let _pdfP = null;
function ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfP) return _pdfP;
  _pdfP = (async () => {
    await loadScript("js/pdfjs/pdf.min.js");
    if (!window.pdfjsLib) { _pdfP = null; throw new Error("pdf.js 加载异常（js/pdfjs/pdf.min.js）"); }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "js/pdfjs/pdf.worker.min.js";
    return window.pdfjsLib;
  })();
  return _pdfP;
}
let _docxP = null;
function ensureDocxLib() {
  if (window.docx && window.docx.Document) return Promise.resolve();
  if (_docxP) return _docxP;
  _docxP = loadScript("js/docx.js").then(() => {
    if (!window.docx || !window.docx.Document) { _docxP = null; throw new Error("docx 库加载异常（js/docx.js）"); }
  });
  return _docxP;
}

/* ---------- Nova Vault（IndexedDB） ---------- */
const Vault = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open("nova-vault", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("docs", { keyPath: "id" });
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  put(doc) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction("docs", "readwrite");
      tx.objectStore("docs").put(doc);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  all() {
    return new Promise((res, rej) => {
      const rq = this.db.transaction("docs").objectStore("docs").getAll();
      rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error);
    });
  },
  del(id) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction("docs", "readwrite");
      tx.objectStore("docs").delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  clear() {
    return new Promise((res, rej) => {
      const tx = this.db.transaction("docs", "readwrite");
      tx.objectStore("docs").clear();
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
};

/* ============================================================
   Nova 版面引擎 v1.3（基于 pdf.js 原始坐标）
   ============================================================ */

/* 统一解析：pages[{ items:[{str,x,y,w,h,bold,fs}], width, height }] */
async function extractLayout(file) {
  const pdfjs = await ensurePdfJs();
  const pdf = await pdfjs.getDocument({ data: await readAB(file) }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = [];
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const t = it.transform;
      const fs = Math.hypot(t[2], t[3]) || Math.abs(t[3]) || 10;
      const style = (tc.styles && tc.styles[it.fontName]) || {};
      const fam = String(style.fontFamily || "");
      items.push({
        str: it.str,
        x: t[4], y: t[5],
        w: it.width || 0, h: it.height || fs,
        fs,
        bold: /bold|black|heavy|semib/i.test(fam),
      });
    }
    pages.push({ items, width: vp.width, height: vp.height });
  }
  return { pages, pdf };
}

/* 行聚类：y 容差 = 行高中位数的一半；行内按 x 升序 */
function clusterRows(items) {
  if (!items.length) return [];
  const medH = median(items.map((i) => i.h)) || 10;
  const tol = Math.max(2, medH * 0.55);
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  for (const it of sorted) {
    const row = rows.find((r) => Math.abs(r.y - it.y) <= tol);
    if (row) { row.items.push(it); row.y = (row.y * (row.items.length - 1) + it.y) / row.items.length; }
    else rows.push({ y: it.y, items: [it] });
  }
  rows.forEach((r) => r.items.sort((a, b) => a.x - b.x));
  return rows.sort((a, b) => b.y - a.y);
}

/* 行内列拆分：间隙 > max(24, 行高*1.6) 视为分栏/表格列 */
function splitCells(row, medH) {
  const gapTh = Math.max(24, medH * 1.6);
  const cells = [];
  let cur = null;
  for (const it of row.items) {
    if (!cur) { cur = newCell(it); continue; }
    const gap = it.x - cur.x - cur.w;
    if (gap > gapTh) { cells.push(cur); cur = newCell(it); }
    else joinCell(cur, it, medH);
  }
  if (cur) cells.push(cur);
  return cells;

  function newCell(it) {
    return { x: it.x, w: it.w, fs: it.fs, bold: it.bold, parts: [it.str], lastX: it.x + it.w };
  }
  function joinCell(c, it, mh) {
    const innerGap = it.x - c.lastX;
    const cjkTail = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]$/.test(c.parts[c.parts.length - 1]);
    const cjkHead = /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(it.str);
    c.parts.push(innerGap > Math.max(6, mh * 0.9) && !(cjkTail && cjkHead) ? " " + it.str : it.str);
    c.w = it.x + it.w - c.x;
    c.lastX = it.x + it.w;
    c.fs = Math.max(c.fs, it.fs);
    c.bold = c.bold || it.bold;
  }
}

/* 行跨度与重叠率（v1.3 表格吸附判定） */
function rowSpan(cells) {
  let min = Infinity, max = -Infinity;
  for (const c of cells) { min = Math.min(min, c.x); max = Math.max(max, c.x + c.w); }
  return { min, max };
}
function spanOverlap(a, b) {
  const inter = Math.min(a.max, b.max) - Math.max(a.min, b.min);
  const union = Math.max(a.max, b.max) - Math.min(a.min, b.min);
  return union > 0 ? inter / union : 0;
}

/* 页 → 块序列：para / table / heading */
/* 页 → 块序列：para / table / heading（v1.4：行带 y 坐标，供段落回流判定；无内嵌函数，无作用域陷阱） */
function pageToBlocks(page, medF) {
  const medH = median(page.items.map((i) => i.h)) || 10;
  const rows = clusterRows(page.items);
  const blocks = [];
  let paraBuf = [];

  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push({ type: "para", lines: paraBuf });
    paraBuf = [];
  };

  for (let ri = 0; ri < rows.length; ri++) {
    const cells = splitCells(rows[ri], medH);
    const fs = median(cells.map((c) => c.fs));

    /* 表格判定：≥2 cell 且与相邻行跨度重叠率 >55% */
    if (cells.length >= 2) {
      const prevBlock = blocks[blocks.length - 1];
      const span = rowSpan(cells);
      const nextCells = ri + 1 < rows.length ? splitCells(rows[ri + 1], medH) : [];
      const alignedWithNext = nextCells.length >= 2 && spanOverlap(span, rowSpan(nextCells)) > 0.55;
      const alignedWithPrevTable = prevBlock && prevBlock.type === "table"
        && spanOverlap(span, rowSpan(prevBlock.rows[0])) > 0.55;
      if (alignedWithNext || alignedWithPrevTable) {
        flushPara();
        if (alignedWithPrevTable) prevBlock.rows.push(cells);
        else blocks.push({ type: "table", rows: [cells] });
        continue;
      }
    }

    /* 标题判定：字号显著大于正文中位数；大字行多区块拆开 */
    const ratio = fs / (medF || 10);
    if (ratio >= 1.35) {
      flushPara();
      blocks.push({ type: "heading", level: ratio >= 1.7 ? 1 : 2, text: cells[0].parts.join("").trim(), bold: true });
      for (let k = 1; k < cells.length; k++) {
        const t = cells[k].parts.join("").trim();
        if (t) blocks.push({ type: "para", lines: [{ cells: [cells[k]], fs, y: rows[ri].y }] });
      }
      continue;
    }

    /* 普通文本行：带 y 坐标入段落缓存（v1.4 段落回流依赖） */
    paraBuf.push({ cells, fs, y: rows[ri].y });
  }
  flushPara();
  return blocks;
}


const LIST_RE = /^([•·‣◦▪▸●○◆■□\-–—*]|\d{1,2}[.)、]|[（(]\d{1,2}[)）]|[a-zA-Z][.)])\s+/;
const CJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

function joinLineParts(parts) {
  let text = "";
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) { text = parts[i]; continue; }
    const tail = text.slice(-1), head = parts[i].slice(0, 1);
    text += (CJK.test(tail) && CJK.test(head) ? "" : " ") + parts[i];
  }
  return text;
}

/* A4 可用宽度（twips/dxa）：11906 - 2×1440 页边距 */
const PAGE_DXA = 10466;

/* 块 → docx children */
/* 块 → docx children（v1.4：竖排合并 + 段落回流，行碎片并回自然段） */
function blocksToDocxChildren(blocks) {
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } = window.docx;
  const out = [];
  const TERM = /[。！？!?；;："”）》】>]$/;   /* 句末标点 → 段落终止 */

  const para = (text, isList) => isList
    ? new Paragraph({ children: [new TextRun({ text: text.replace(LIST_RE, "") })], bullet: { level: 0 } })
    : new Paragraph({ children: [new TextRun({ text })] });

  const lineText = (line) => line.cells.length === 1
    ? line.cells[0].parts.join("")
    : line.cells.map((c) => c.parts.join("")).join("\t");

  for (const b of blocks) {
    if (b.type === "heading") {
      out.push(new Paragraph({
        children: [new TextRun({ text: b.text, bold: true })],
        heading: b.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      }));
      continue;
    }

    if (b.type === "table") {
      const maxCols = Math.max(...b.rows.map((r) => r.length));
      const colW = new Array(maxCols).fill(4);
      for (const r of b.rows) r.forEach((c, ci) => {
        if (c && ci < maxCols) colW[ci] = Math.max(colW[ci], estW(c.parts.join("")) + 2);
      });
      const total = colW.reduce((a, x) => a + x, 0) || 1;
      const columnWidths = colW.map((w) => Math.max(360, Math.round(PAGE_DXA * w / total)));
      const trows = b.rows.map((cells) => {
        const tds = [];
        for (let c = 0; c < maxCols; c++) {
          const cell = cells[c];
          tds.push(new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell ? cell.parts.join("") : "" })] })],
          }));
        }
        return new TableRow({ children: tds });
      });
      const tOpts = { rows: trows, width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths };
      if (window.docx.TableLayoutType) tOpts.layout = window.docx.TableLayoutType.FIXED;
      out.push(new Table(tOpts));
      out.push(new Paragraph({ children: [] }));
      continue;
    }

    /* —— para：第一步，竖排单字行合并成词行 —— */
    const lines = b.lines, norm = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const text0 = line.cells.length === 1 ? line.cells[0].parts.join("").trim() : null;
      if (text0 !== null && [...text0].length === 1) {
        const x0 = line.cells[0].x;
        const chars = [text0];
        let j = i + 1;
        while (j < lines.length) {
          const l2 = lines[j];
          if (l2.cells.length === 1) {
            const t2 = l2.cells[0].parts.join("").trim();
            if ([...t2].length === 1 && Math.abs(l2.cells[0].x - x0) < 5) { chars.push(t2); j++; continue; }
          }
          break;
        }
        if (chars.length >= 2) {
          norm.push({ cells: [{ parts: [chars.join("")] }], fs: line.fs, y: line.y });
          i = j; continue;
        }
      }
      norm.push(line); i++;
    }

    /* —— 第二步：段落回流（无句末标点 + 行距紧凑 → 并段） —— */
    let cur = null;
    for (const line of norm) {
      const clean = lineText(line).trim();
      if (!clean) continue;
      const isList = LIST_RE.test(clean);
      const multiCell = line.cells.length > 1;
      const bigGap = cur && cur.prevY != null && line.y != null && (cur.prevY - line.y) > cur.lh * 1.8;

      if (!cur || isList || multiCell || TERM.test(cur.text) || bigGap) {
        if (cur) { out.push(para(cur.text, false)); cur = null; }
        if (isList || multiCell) out.push(para(clean, isList));
        else cur = { text: clean, prevY: line.y, lh: line.fs || 10 };
      } else {
        const tail = cur.text.slice(-1), head = clean.slice(0, 1);
        cur.text += (CJK.test(tail) && CJK.test(head) ? "" : " ") + clean;
        cur.prevY = line.y;
      }
    }
    if (cur) out.push(para(cur.text, false));
  }
  return out;
}


/* ---------- pdf → docx：智能文本重建 ---------- */
async function convPdfToDocxSmart(file) {
  await ensureDocxLib();
  const { pages } = await extractLayout(file);
  const hasText = pages.some((p) => p.items.length);
  if (!hasText) {
    /* v1.4：扫描版不再硬失败 —— 自动降级图片版，Toast 明确告知 */
    novaToast("未检测到文字层，已自动改用「高保真图片版」输出", "warn");
    return convPdfToDocxImage(file);
  }

  const medF = median(pages.flat().map((p) => p.items).flat().map((i) => i.fs)) || 10;
  const children = [];
  const { Paragraph, TextRun } = window.docx;
  pages.forEach((page, pi) => {
    if (pi > 0) children.push(new Paragraph({ children: [new TextRun({ text: `— 第 ${pi + 1} 页 —`, color: "888888", size: 18 })] }));
    children.push(...blocksToDocxChildren(pageToBlocks(page, medF)));
  });

  const { Document, Packer } = window.docx;
  const doc = new Document({ sections: [{ children }] });
  return [{ name: baseOf(file.name) + ".docx", blob: await Packer.toBlob(doc) }];
}

/* ---------- pdf → docx：高保真图片版（视觉 100% 还原，文字不可编辑） ---------- */
async function convPdfToDocxImage(file) {
  await ensureDocxLib();
  const pdfjs = await ensurePdfJs();
  const pdf = await pdfjs.getDocument({ data: await readAB(file) }).promise;
  const { Document, Packer, Paragraph, ImageRun } = window.docx;
  const children = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    /* 按 2400px 目标宽度渲染（约 200+ DPI），发票小字清晰且防内存爆 */
    const scale = 2400 / vp1.width;
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    if (!blob) throw new Error("页面渲染失败（第 " + i + " 页）");
    const buf = await blob.arrayBuffer();

    /* 显示宽 680px：0.5 英寸边距下内容区约 697px，留 17px 余量确保右侧不被裁 */
    const dispW = 680, dispH = Math.round(680 * vp1.height / vp1.width);
    children.push(new Paragraph({
      children: [new ImageRun({ type: "jpg", data: buf, transformation: { width: dispW, height: dispH } })],
    }));
    if (i < pdf.numPages) children.push(new Paragraph({ children: [] }));
  }

  /* 0.5 英寸页边距：给宽幅发票留最大显示空间 */
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  });
  return [{ name: baseOf(file.name) + ".docx", blob: await Packer.toBlob(doc) }];
}


/* ---------- pdf → txt / md ---------- */
async function convPdfText(file, to) {
  const { pages } = await extractLayout(file);
  const hasText = pages.some((p) => p.items.length);
  if (!hasText) throw new Error("扫描版 PDF（图片型）无法提取文字，暂不支持 TXT/MD 导出");
  const parts = pages.map((page, pi) => {
    const rows = clusterRows(page.items);
    const text = rows.map((r) => r.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
    return { no: pi + 1, text };
  });
  const base = baseOf(file.name);
  if (to === "md") {
    const md = parts.map((p) => `## 第 ${p.no} 页\n\n${p.text}`).join("\n\n");
    return [{ name: base + ".md", blob: new Blob([md], { type: "text/markdown" }) }];
  }
  const txt = parts.map((p) => `— 第 ${p.no} 页 —\n${p.text}`).join("\n\n");
  return [{ name: base + ".txt", blob: new Blob([txt], { type: "text/plain" }) }];
}

/* ---------- 其他格式 ---------- */
async function readAB(file) { return file.arrayBuffer(); }

async function convDocx(file, to) {
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await readAB(file) });
  const base = baseOf(file.name);
  if (to === "html") return [{ name: base + ".html", blob: new Blob([wrapHtml(html, base)], { type: "text/html" }) }];
  const dom = new DOMParser().parseFromString(html, "text/html");
  const txt = (dom.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  return [{ name: base + ".txt", blob: new Blob([txt], { type: "text/plain" }) }];
}

async function convSheet(file, to) {
  const wb = XLSX.read(await readAB(file), { type: "array" });
  const base = baseOf(file.name);
  if (to === "json") {
    const obj = {};
    wb.SheetNames.forEach((n) => { obj[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: null }); });
    return [{ name: base + ".json", blob: new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }) }];
  }
  if (to === "xlsx") {
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return [{ name: base + ".xlsx", blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) }];
  }
  return wb.SheetNames.map((n) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[n]);
    return { name: safeName(base + "." + n) + ".csv", blob: new Blob(["\uFEFF" + csv], { type: "text/csv" }) };
  });
}

async function convCsv(file, to) {
  const wb = XLSX.read(await file.text(), { type: "string" });
  const base = baseOf(file.name);
  if (to === "xlsx") {
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return [{ name: base + ".xlsx", blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) }];
  }
  const obj = {};
  wb.SheetNames.forEach((n) => { obj[n] = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: null }); });
  return [{ name: base + ".json", blob: new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }) }];
}

function wrapHtml(inner, title) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font:15px/1.9 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#1B2340}
img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 10px}h1,h2,h3{line-height:1.4}</style>
</head><body>${inner}</body></html>`;
}

async function convHtml(file) {
  const html = await file.text();
  const w = window.open("", "_blank");
  if (!w) throw new Error("弹窗被浏览器拦截，请允许弹窗后重试");
  w.document.write(wrapHtml(html, baseOf(file.name)));
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 600);
  return [];
}

/* ---------- 队列状态与渲染 ---------- */
const Queue = [];

function chip(status) {
  const map = { wait: ["wait", "等待"], run: ["run", "转换中"], done: ["done", "完成"], fail: ["fail", "失败"] };
  const [cls, label] = map[status] || map.wait;
  return `<span class="chip chip--${cls}">${label}</span>`;
}

function paintQueue() {
  const tb = $d("#queue-body");
  $d("#queue-empty").hidden = Queue.length > 0;
  tb.innerHTML = Queue.map((it, i) => {
    const opts = targetsFor(it.ext).map((t) =>
      `<option value="${t.v}" ${it.to === t.v ? "selected" : ""}>${t.label}</option>`).join("");
    const acts = it.status === "done" && it.results.length
      ? it.results.map((r, ri) => `<button class="mini" data-dl="${i}:${ri}">下载 ${r.name.length > 18 ? "…" + r.name.slice(-15) : r.name}</button>`).join(" ")
      : it.status === "wait" ? `<button class="mini" data-run="${i}">开始</button>`
      : "";
    return `<tr>
      <td class="fname">${it.file.name}<div class="fmeta">${fmtSize(it.file.size)}</div></td>
      <td><select class="mini" data-to="${i}" ${it.status !== "wait" ? "disabled" : ""}>${opts}</select></td>
      <td>${chip(it.status)}${it.err ? `<div class="fmeta">${it.err}</div>` : ""}</td>
      <td>${acts} <button class="mini mini--danger" data-rm="${i}">移除</button></td>
    </tr>`;
  }).join("");
}

function paintVault(docs) {
  const tb = $d("#vault-body");
  $d("#vault-empty").hidden = docs.length > 0;
  tb.innerHTML = docs.sort((a, b) => b.ts - a.ts).map((d) => `<tr>
    <td class="fname">${d.name}<div class="fmeta">${d.mime || ""}</div></td>
    <td class="fname hide-sm">${d.from || "—"}</td>
    <td class="hide-sm">${fmtSize(d.size)}</td>
    <td class="hide-sm fmeta">${new Date(d.ts).toLocaleString()}</td>
    <td><button class="mini" data-pv="${d.id}">预览</button>
        <button class="mini" data-vdl="${d.id}">下载</button>
        <button class="mini mini--danger" data-vrm="${d.id}">删除</button></td>
  </tr>`).join("");
  Vault._cache = docs;
}

async function refreshVault() { paintVault(await Vault.all()); }

/* ---------- 单项执行 ---------- */
async function runItem(it) {
  it.status = "run"; it.err = ""; paintQueue();
  try {
    let outs = [];
    if (it.to === "vault") {
      outs = [{ name: it.file.name, blob: it.file }];
    } else if (it.ext === "docx") {
      outs = await convDocx(it.file, it.to);
    } else if (it.ext === "pdf") {
      if (it.to === "docx") outs = await convPdfToDocxSmart(it.file);
      else if (it.to === "docxim") outs = await convPdfToDocxImage(it.file);
      else outs = await convPdfText(it.file, it.to);
    } else if (it.ext === "xlsx" || it.ext === "xls") {
      outs = await convSheet(it.file, it.to);
    } else if (it.ext === "csv") {
      outs = await convCsv(it.file, it.to);
    } else if (it.ext === "html" || it.ext === "htm") {
      outs = await convHtml(it.file);
    } else {
      throw new Error("该格式暂无转换目标");
    }
    it.status = "done"; it.results = outs;
    for (const o of outs) {
      await Vault.put({ id: uid(), name: o.name, mime: o.blob.type, size: o.blob.size, ts: Date.now(), from: it.file.name, blob: o.blob });
    }
    novaToast(outs.length ? `✅ ${it.file.name} → ${outs.length} 个产物，已存入星库` : `🖨 已打开打印视图（导出 PDF 在打印对话框中选择）`);
  } catch (err) {
    it.status = "fail"; it.err = err.message || String(err);
    novaToast("❌ 转换失败：" + it.file.name, "error");
  }
  paintQueue();
  if ($d("#tab-vault").hidden === false) refreshVault();
}

/* ---------- 事件接线 ---------- */
function addFiles(files) {
  for (const f of files) {
    const ext = extOf(f.name);
    Queue.push({ id: uid(), file: f, ext, to: targetsFor(ext)[0].v, status: "wait", results: [], err: "" });
  }
  paintQueue();
}

function initDocs() {
  const dz = $d("#dropzone"), fi = $d("#file-input");
  dz.addEventListener("click", () => fi.click());
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } });
  fi.addEventListener("change", () => { addFiles([...fi.files]); fi.value = ""; });
  ["dragover", "dragenter"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-drag"); }));
  dz.addEventListener("drop", (e) => addFiles([...e.dataTransfer.files]));

  $d("#queue-body").addEventListener("click", async (e) => {
    const t = e.target;
    if (t.dataset.run !== undefined) runItem(Queue[+t.dataset.run]);
    if (t.dataset.rm !== undefined) { Queue.splice(+t.dataset.rm, 1); paintQueue(); }
    if (t.dataset.dl) {
      const [qi, ri] = t.dataset.dl.split(":").map(Number);
      const r = Queue[qi].results[ri];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.blob); a.download = r.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  });
  $d("#queue-body").addEventListener("change", (e) => {
    if (e.target.dataset.to !== undefined) Queue[+e.target.dataset.to].to = e.target.value;
  });
  $d("#run-all").addEventListener("click", async () => {
    for (const it of Queue.filter((i) => i.status === "wait")) await runItem(it);
  });
  $d("#clear-done").addEventListener("click", () => {
    for (let i = Queue.length - 1; i >= 0; i--) if (Queue[i].status === "done") Queue.splice(i, 1);
    paintQueue();
  });

  $$d(".tab").forEach((tab) => tab.addEventListener("click", async () => {
    $$d(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    ["convert", "ai", "vault"].forEach((n) => { $d("#tab-" + n).hidden = n !== tab.dataset.tab; });
    if (tab.dataset.tab === "vault") refreshVault();
  }));
  $d("#vault-refresh").addEventListener("click", refreshVault);
  $d("#vault-clear").addEventListener("click", async () => {
    if (!confirm("确定清空 Nova Vault 星库？此操作不可恢复。")) return;
    await Vault.clear(); refreshVault(); novaToast("星库已清空", "warn");
  });

  const overlay = $d("#pv-overlay");
  const closePv = () => { overlay.dataset.open = "false"; $d("#pv-body").innerHTML = ""; };
  $d("#pv-close").addEventListener("click", closePv);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePv(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.dataset.open === "true") closePv(); });

  $d("#vault-body").addEventListener("click", async (e) => {
    const t = e.target, cache = Vault._cache || [];
    const find = (id) => cache.find((x) => x.id === id);
    if (t.dataset.vdl) {
      const d = find(t.dataset.vdl);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(d.blob); a.download = d.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    if (t.dataset.vrm) { await Vault.del(t.dataset.vrm); refreshVault(); }
    if (t.dataset.pv) {
      const d = find(t.dataset.pv);
      $d("#pv-title").textContent = d.name;
      const body = $d("#pv-body");
      if ((d.mime || "").includes("html")) {
        body.className = "pv__body pv__body--paper";
        body.innerHTML = `<iframe sandbox="" srcdoc=""></iframe>`;
        body.querySelector("iframe").srcdoc = await d.blob.text();
      } else if (/\.(txt|md|json|csv)$/.test(d.name) || (d.mime || "").startsWith("text/")) {
        body.className = "pv__body pv__body--paper";
        const pre = document.createElement("pre");
        pre.textContent = (await d.blob.text()).slice(0, 100000);
        body.innerHTML = ""; body.appendChild(pre);
      } else {
        body.className = "pv__body";
        body.innerHTML = `<p style="color:var(--text-3)">该格式不支持预览，请下载后查看。</p>`;
      }
      overlay.dataset.open = "true";
    }
  });
}

/* ---------- 启动 ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  try { await Vault.open(); } catch (e) { novaToast("星库初始化失败：" + e.message, "error"); }
  initDocs();
  paintQueue();
});
