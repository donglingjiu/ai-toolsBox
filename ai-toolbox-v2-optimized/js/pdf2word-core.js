/* ============ PDF→Word 版面重建核心（纯逻辑，可独立测试） ============
 * 输入：pdfjs getTextContent 的 items（每页）
 * 输出：段落计划 [{kind, runs}] + 乱码警告
 * 策略：行聚类 → 段落重建（行距分位数/缩进）→ 标题分级（字号对比）→ 粗体 run → 列表识别
 */
'use strict';

function _median(arr) {
  if (!arr.length) return 0;
  const a = arr.slice().sort(function (x, y) { return x - y; });
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function _quantile(arr, q) {
  if (!arr.length) return 0;
  const a = arr.slice().sort(function (x, y) { return x - y; });
  return a[Math.min(a.length - 1, Math.floor(q * (a.length - 1)))];
}

/* ---------- 第一步：页内 items → 行 ---------- */
function clusterLines(pages) {
  const lines = [];
  pages.forEach(function (items, pageIdx) {
    const valid = items.filter(function (it) {
      return it && typeof it.str === 'string' && it.str.trim() !== '' && it.transform;
    });
    valid.forEach(function (it) {
      /* transform: [a,b,c,d,e,f] → e=x, f=y（基线）；字号用向量长度 */
      it._x = it.transform[4];
      it._y = it.transform[5];
      it._fs = Math.hypot(it.transform[2], it.transform[3]) || 10;
      it._h = it.height || it._fs;
    });
    valid.sort(function (a, b) { return b._y - a._y || a._x - b._x; });
    /* 去重影：部分 PDF 用"同字双绘"实现伪粗体，或叠加隐藏 OCR 文本层，
     * pdfjs 会为同一字符吐出两个几乎重合的 item → 输出"检检索索"式重字。
     * 排序后重复项彼此相邻，逐个与最近保留项比对：字符串相同且位置几乎重合即视为重影丢弃。 */
    const dedup = [];
    valid.forEach(function (it) {
      const tol = Math.max(it._fs, 4) * 0.35;
      for (let j = dedup.length - 1; j >= 0 && j >= dedup.length - 4; j--) {
        const p = dedup[j];
        if (p.str === it.str && Math.abs(p._x - it._x) < tol && Math.abs(p._y - it._y) < tol) return;
      }
      dedup.push(it);
    });
    /* 行聚类：y 容差 = 行内中位字高一半 */
    let cur = null;
    dedup.forEach(function (it) {
      if (!cur || Math.abs(it._y - cur.y) > Math.max(it._h, cur.h) * 0.55) {
        cur = { pageIdx: pageIdx, y: it._y, h: it._h, parts: [it] };
        lines.push(cur);
      } else {
        cur.parts.push(it);
        cur.y = (cur.y * (cur.parts.length - 1) + it._y) / cur.parts.length;
        if (it._h > cur.h) cur.h = it._h;
      }
    });
  });
  /* 行内按 x 排序并拼文本 */
  lines.forEach(function (ln) {
    ln.parts.sort(function (a, b) { return a._x - b._x; });
    let text = '';
    const x0 = ln.parts[0]._x;
    let lastEnd = x0;
    ln.parts.forEach(function (it, i) {
      const s = it.str;
      if (i > 0) {
        const gap = it._x - lastEnd;
        const unit = Math.max(it._fs, 1);
        const prevTail = text.slice(-1), curHead = s.slice(0, 1);
        const cjkBoth = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(prevTail) && /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(curHead);
        if (!cjkBoth && (gap > unit * 0.18 || (/[A-Za-z0-9,.;:!?%)\]]/.test(prevTail) && /^[A-Za-z0-9(\[]/.test(curHead)))) {
          text += ' ';
        }
      }
      text += s;
      lastEnd = it._x + (it.width || s.length * it._fs * 0.5);
    });
    ln.text = text.replace(/\s+$/, '');
    ln.x0 = x0;
    let wSum = 0, fsSum = 0;
    ln.parts.forEach(function (it) {
      const w = Math.max(it.str.trim().length, 1);
      wSum += w; fsSum += it._fs * w;
    });
    ln.fontSize = fsSum / (wSum || 1);
    ln.bold = ln.parts.some(function (it) { return /bold|black|heavy/i.test(it.fontName || ''); });
    ln.fontNames = ln.parts.map(function (it) { return it.fontName || ''; });
  });
  return lines.filter(function (ln) { return ln.text.trim() !== ''; });
}

/* ---------- 第二步：行 → 段落（行距 25 分位 + 首行缩进 + 连字符） ---------- */
function buildParagraphs(lines) {
  const medH = _median(lines.map(function (l) { return l.h; })) || 10;
  const medF = _median(lines.map(function (l) { return l.fontSize; })) || 10;
  /* 常见 x0（正文左边界） */
  const medX0 = _median(lines.map(function (l) { return l.x0; }));
  /* 正文行距估计：同页相邻行 gap 的 25 分位（段间距会抬高中位数，取低分位更接近真实行距） */
  const gaps = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].pageIdx === lines[i - 1].pageIdx && lines[i].y < lines[i - 1].y) {
      gaps.push(lines[i - 1].y - lines[i].y);
    }
  }
  const medGap = _quantile(gaps, 0.25) || medH * 1.4;

  const paras = [];
  let curPara = null;
  function flush() {
    if (curPara && curPara.lines.length) paras.push(curPara);
    curPara = null;
  }
  function start(ln) {
    flush();
    curPara = { lines: [ln], x0: ln.x0, fontSize: ln.fontSize, bold: ln.bold, fontNames: ln.fontNames.slice() };
  }
  function cont(ln) {
    curPara.lines.push(ln);
    curPara.fontSize = Math.max(curPara.fontSize, ln.fontSize);
    curPara.bold = curPara.bold || ln.bold;
    ln.fontNames.forEach(function (f) { if (curPara.fontNames.indexOf(f) === -1) curPara.fontNames.push(f); });
  }

  let prev = null;
  lines.forEach(function (ln) {
    const LIST_RE = /^([•·‣◦▪▸●○◆■□\-–—*]|\d{1,2}[.)、]|[（(]\d{1,2}[)）]|[a-zA-Z][.)])\s+/;
    const isList = LIST_RE.test(ln.text);
    if (!curPara) { start(ln); prev = ln; return; }

    const samePage = prev.pageIdx === ln.pageIdx;
    const gap = samePage ? (prev.y - ln.y) : Infinity;
    /* prev 以句末标点结尾 = 句子完整（prevEndOpen 为 false） */
    const prevEndOpen = !/[。！？.!?：:；;”"’']$/.test(prev.text);
    const indent = ln.x0 - curPara.x0 > medF * 1.5 && ln.x0 - medX0 > medF * 0.9;
    const fsJump = Math.abs(ln.fontSize - curPara.fontSize) > medF * 0.18;
    /* 大行距：显著超过正文行距基准才断段；段落内正常行距 + 行末句号不断段 */
    const bigGap = samePage && gap > medGap * 1.45 && gap > medH * 1.15;

    if (isList || indent || fsJump || bigGap || (!samePage && !prevEndOpen)) {
      start(ln);
    } else {
      /* 英文连字符合并 */
      if (/[A-Za-z]-$/.test(curPara.lines[curPara.lines.length - 1].text) && /^[a-z]/.test(ln.text)) {
        const lastLn = curPara.lines[curPara.lines.length - 1];
        lastLn.text = lastLn.text.replace(/-$/, '');
        ln.text = ' ' + ln.text;
      }
      cont(ln);
    }
    prev = ln;
  });
  flush();
  return { paras: paras, medF: medF, medH: medH, medGap: medGap };
}

/* ---------- 第三步：段落 → 标题/正文/列表 + run 级粗体 ---------- */
function planToParagraphs(pars, medF) {
  return pars.map(function (p) {
    /* 逐行拼接：中文尾+中文头直接连，否则补空格 */
    let text = '';
    p.lines.forEach(function (l, i) {
      if (i === 0) { text = l.text; return; }
      const tail = text.slice(-1), head = l.text.slice(0, 1);
      const bothCJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(tail) && /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(head);
      text += (bothCJK ? '' : ' ') + l.text;
    });
    const nLines = p.lines.length;
    const fsRatio = p.fontSize / medF;
    let kind = 'p';
    const LIST_RE = /^([•·‣◦▪▸●○◆■□\-–—*]|\d{1,2}[.)、]|[（(]\d{1,2}[)）]|[a-zA-Z][.)])\s+/;
    if (LIST_RE.test(text)) kind = 'li';
    else if (nLines <= 2 && fsRatio >= 1.5) kind = 'h1';
    else if (nLines <= 2 && fsRatio >= 1.28) kind = 'h2';
    else if (nLines <= 2 && (fsRatio >= 1.12 || (p.bold && text.length <= 34 && !/[。.，,]$/.test(text)))) kind = 'h3';

    /* run 级粗体：同行内 Bold 字体的连续 part 合并 */
    const runs = [];
    if (kind === 'h1' || kind === 'h2' || kind === 'h3') {
      runs.push({ text: text, bold: true });
    } else {
      p.lines.forEach(function (ln, li) {
        ln.parts.forEach(function (it) {
          const b = /bold|black|heavy/i.test(it.fontName || '');
          if (runs.length && runs[runs.length - 1].bold === b) {
            runs[runs.length - 1].text += it.str;
          } else {
            runs.push({ text: it.str, bold: b });
          }
        });
      });
      /* 校验 run 拼接与整段文本一致，不一致则回退纯文本 */
      const merged = runs.map(function (r) { return r.text; }).join('');
      if (merged.replace(/\s+/g, '') !== text.replace(/\s+/g, '')) {
        runs.length = 0;
        runs.push({ text: text, bold: false });
      }
    }
    return { kind: kind, runs: runs };
  });
}

/* ---------- 乱码检测（ToUnicode 缺失时 pdfjs 会吐出内部编码） ---------- */
function detectGarbled(planTexts) {
  const text = planTexts.join('');
  const chars = text.replace(/\s/g, '').split('');
  if (!chars.length) return null;
  let readable = 0;
  chars.forEach(function (ch) {
    const c = ch.codePointAt(0);
    if (
      (c >= 0x4e00 && c <= 0x9fff) ||   /* CJK */
      (c >= 0x20 && c <= 0x7e) ||       /* ASCII 可打印 */
      (c >= 0x3000 && c <= 0x303f) ||   /* CJK 标点 */
      (c >= 0xff00 && c <= 0xffef)      /* 全角 */
    ) readable++;
  });
  const ratio = readable / chars.length;
  if (ratio < 0.55) {
    return '检测到 ' + Math.round((1 - ratio) * 100) + '% 的字符无法识别（该 PDF 的内嵌字体缺少 ToUnicode 映射），文字可能显示为乱码。建议改用 OCR 方式处理此文件。';
  }
  return null;
}

/* ---------- 总入口：pages → {paragraphs, warning} ---------- */
function buildParagraphPlan(pages) {
  const lines = clusterLines(pages);
  if (!lines.length) return { paragraphs: [], warning: '未在 PDF 中提取到文本（可能是扫描件）。' };
  const built = buildParagraphs(lines);
  const paras = planToParagraphs(built.paras, built.medF);
  const warning = detectGarbled(paras.map(function (p) {
    return p.runs.map(function (r) { return r.text; }).join('');
  }));
  return { paragraphs: paras, warning: warning };
}
