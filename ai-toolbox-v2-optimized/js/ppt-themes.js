/* ============ PPT 主题与版式引擎（单一事实源：deck JSON → HTML 预览 / PPTX 导出） ============
 * 版式：title / toc / section / bullets / two / data / end
 * 设计对标：Gamma（快速成稿+主题换装）、Beautiful.ai（自动版式）、WPS AI（大纲先行）
 * PPTX 用 pptxgenjs 原生写文本框/形状/图表 —— 天生可编辑、不跑版
 */
'use strict';

var PPT_THEMES = {
  business: { name: '深空商务', bg: 'FFFFFF', band: 'EFF4FF', accent: '2563EB', title: '1B2A4A', text: '334155', muted: '64748B', dark: false },
  tech:     { name: '青岳科技', bg: 'FFFFFF', band: 'E8F7F2', accent: '0D9488', title: '134E4A', text: '334155', muted: '64748B', dark: false },
  warm:     { name: '暖阳活力', bg: 'FFFFFF', band: 'FFF4EC', accent: 'EA580C', title: '7C2D12', text: '44403C', muted: '78716C', dark: false },
  academic: { name: '学术素雅', bg: 'FFFFFF', band: 'F5F5F4', accent: '57534E', title: '1C1917', text: '44403C', muted: '78716C', dark: false },
  midnight: { name: '暗夜路演', bg: '0F172A', band: '1E293B', accent: '38BDF8', title: 'F1F5F9', text: 'CBD5E1', muted: '94A3B8', dark: true }
};

var PPT_LAYOUTS = ['title', 'toc', 'section', 'bullets', 'two', 'data', 'end'];

/* ---------- deck 规范化：容忍 LLM 输出的各种形态，修复为合法 deck ---------- */
function normalizeDeck(raw) {
  var d = (typeof raw === 'string') ? JSON.parse(raw) : raw;
  if (!d || !Array.isArray(d.slides) || !d.slides.length) throw new Error('大纲缺少 slides 数组');
  var out = { title: String(d.title || '未命名演示').slice(0, 60), subtitle: String(d.subtitle || '').slice(0, 120), slides: [] };
  d.slides.forEach(function (s, i) {
    if (!s || typeof s !== 'object') return;
    var L = PPT_LAYOUTS.indexOf(String(s.layout || 'bullets')) >= 0 ? String(s.layout) : 'bullets';
    var sl = { layout: L, title: String(s.title || '').slice(0, 60), note: String(s.note || '').slice(0, 400) };
    if (L === 'title') { sl.title = sl.title || out.title; sl.subtitle = String(s.subtitle || out.subtitle).slice(0, 120); }
    if (L === 'bullets' || L === 'toc') {
      var pts = s.points || s.items || s.bullets || [];
      if (!Array.isArray(pts)) pts = String(pts).split(/\n+/);
      sl.points = pts.map(function (p) { return typeof p === 'string' ? p : String(p && (p.text || p.t || p.k) || ''); })
        .map(function (p) { return p.trim(); }).filter(Boolean).slice(0, 6)
        .map(function (p) { return p.slice(0, 90); });
      if (L === 'bullets' && !sl.points.length) L = sl.layout = 'section';
    }
    if (L === 'two') {
      function side(o, fb) {
        o = o || {};
        var p = o.points || o.items || [];
        if (!Array.isArray(p)) p = String(p).split(/\n+/);
        return { t: String(o.t || o.title || fb).slice(0, 30), points: p.map(String).map(function (x) { return x.trim().slice(0, 80); }).filter(Boolean).slice(0, 4) };
      }
      sl.left = side(s.left, '方案 A'); sl.right = side(s.right, '方案 B');
    }
    if (L === 'data') {
      var bars = s.bars || s.data || [];
      if (!Array.isArray(bars)) bars = [];
      sl.bars = bars.slice(0, 6).map(function (b) {
        if (typeof b === 'string') { var m = b.match(/^(.+?)[\s:：=]+([\d.]+)$/); return m ? { label: m[1].slice(0, 12), value: parseFloat(m[2]) || 0 } : { label: b.slice(0, 12), value: 0 }; }
        return { label: String(b.label || '').slice(0, 12), value: Number(b.value) || 0 };
      }).filter(function (b) { return b.label; });
      sl.unit = String(s.unit || '').slice(0, 8);
      if (!sl.bars.length) L = sl.layout = 'section';
      else if (!sl.points) sl.points = [];
    }
    if (L === 'end') { sl.title = sl.title || '谢谢观看'; }
    sl.layout = L;
    if (sl.title || (sl.points && sl.points.length)) out.slides.push(sl);
  });
  if (!out.slides.length || out.slides[0].layout !== 'title') {
    out.slides.unshift({ layout: 'title', title: out.title, subtitle: out.subtitle, note: '' });
  }
  var hasEnd = out.slides[out.slides.length - 1].layout === 'end';
  if (!hasEnd) out.slides.push({ layout: 'end', title: '谢谢观看', subtitle: 'Q & A', note: '' });
  return out;
}

/* ---------- HTML 渲染（预览 / 导出演示 HTML 共用） ---------- */
function _esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderSlideHTML(slide, theme, idx, total) {
  var t = theme;
  var base = 'box-sizing:border-box;width:100%;height:100%;padding:4.2em 4.6em;position:relative;overflow:hidden;background:#' + t.bg + ';color:#' + t.text + ';font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;display:flex;flex-direction:column;';
  var head = '<div style="position:absolute;top:0;left:0;right:0;height:.5em;background:#' + t.accent + ';"></div>';
  var foot = '<div style="position:absolute;bottom:1.6em;left:4.6em;right:4.6em;display:flex;justify-content:space-between;font-size:.72em;color:#' + t.muted + ';"><span>' + _esc(theme.__deckTitle || '') + '</span><span>' + (idx + 1) + ' / ' + total + '</span></div>';
  var h = '';

  if (slide.layout === 'title' || slide.layout === 'end') {
    h = '<div style="' + base + 'justify-content:center;align-items:center;text-align:center;">' +
      head +
      '<div style="font-size:1em;color:#' + t.accent + ';letter-spacing:.35em;margin-bottom:1.2em;font-weight:600;">' + (slide.layout === 'title' ? 'PRESENTATION' : 'THANKS') + '</div>' +
      '<div style="font-size:2.6em;font-weight:800;color:#' + t.title + ';line-height:1.25;max-width:90%;">' + _esc(slide.title) + '</div>' +
      (slide.subtitle ? '<div style="font-size:1.15em;color:#' + t.muted + ';margin-top:1.1em;">' + _esc(slide.subtitle) + '</div>' : '') +
      '<div style="width:4em;height:.28em;background:#' + t.accent + ';border-radius:1em;margin-top:1.8em;"></div>' +
      foot + '</div>';
  } else if (slide.layout === 'section') {
    h = '<div style="' + base + 'justify-content:center;background:#' + t.accent + ';color:#fff;">' +
      '<div style="position:absolute;top:0;left:0;right:0;height:.5em;background:rgba(255,255,255,.35);"></div>' +
      '<div style="font-size:5em;font-weight:800;opacity:.28;line-height:1;">' + String(idx).padStart(2, '0') + '</div>' +
      '<div style="font-size:2.1em;font-weight:700;margin-top:.4em;">' + _esc(slide.title) + '</div>' +
      foot + '</div>';
  } else if (slide.layout === 'toc') {
    var n = Math.ceil((slide.points || []).length / 2) || 1;
    var col = function (arr, off) {
      return '<div style="flex:1;display:flex;flex-direction:column;gap:1em;">' + arr.map(function (p, i) {
        return '<div style="display:flex;gap:.8em;align-items:baseline;"><span style="font-size:1.15em;font-weight:800;color:#' + t.accent + ';min-width:1.6em;">' + String(i + 1 + off).padStart(2, '0') + '</span><span style="font-size:1.02em;">' + _esc(p) + '</span></div>';
      }).join('') + '</div>';
    };
    var pts = slide.points || [];
    h = '<div style="' + base + '">' + head +
      '<div style="font-size:1.7em;font-weight:800;color:#' + t.title + ';margin-bottom:1.4em;">' + _esc(slide.title) + '</div>' +
      '<div style="display:flex;gap:3em;flex:1;background:#' + t.band + ';border-radius:1em;padding:2em;">' + col(pts.slice(0, n), 0) + col(pts.slice(n), n) + '</div>' +
      foot + '</div>';
  } else if (slide.layout === 'two') {
    var card = function (side, align) {
      var inner = '<div style="font-size:1.15em;font-weight:700;color:#' + t.accent + ';margin-bottom:.9em;">' + _esc(side.t) + '</div>';
      inner += (side.points || []).map(function (p) { return '<div style="display:flex;gap:.6em;margin-bottom:.7em;font-size:.95em;line-height:1.5;"><span style="color:#' + t.accent + ';font-weight:800;">·</span><span>' + _esc(p) + '</span></div>'; }).join('');
      return '<div style="flex:1;background:#' + t.band + ';border-radius:1em;padding:1.6em 1.8em;' + align + '">' + inner + '</div>';
    };
    h = '<div style="' + base + '">' + head +
      '<div style="font-size:1.7em;font-weight:800;color:#' + t.title + ';margin-bottom:1.2em;">' + _esc(slide.title) + '</div>' +
      '<div style="display:flex;gap:1.5em;flex:1;">' + card(slide.left || {}, '') + card(slide.right || {}, '') + '</div>' +
      foot + '</div>';
  } else if (slide.layout === 'data') {
    var bars = slide.bars || [];
    var maxv = Math.max.apply(null, bars.map(function (b) { return b.value; }).concat([1]));
    var chart = bars.map(function (b) {
      var w = Math.max(4, Math.round(b.value / maxv * 100));
      return '<div style="display:flex;align-items:center;gap:1em;margin-bottom:1.05em;">' +
        '<span style="min-width:6.5em;font-size:.95em;text-align:right;color:#' + t.muted + ';">' + _esc(b.label) + '</span>' +
        '<div style="flex:1;height:1.6em;background:#' + t.band + ';border-radius:.5em;overflow:hidden;"><div style="width:' + w + '%;height:100%;background:#' + t.accent + ';border-radius:.5em;"></div></div>' +
        '<span style="min-width:4.5em;font-size:.95em;font-weight:700;color:#' + t.title + ';">' + b.value + _esc(slide.unit || '') + '</span></div>';
    }).join('');
    h = '<div style="' + base + '">' + head +
      '<div style="font-size:1.7em;font-weight:800;color:#' + t.title + ';margin-bottom:1.2em;">' + _esc(slide.title) + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;">' + chart + '</div>' +
      foot + '</div>';
  } else { /* bullets */
    var bpts = slide.points || [];
    h = '<div style="' + base + '">' + head +
      '<div style="font-size:1.7em;font-weight:800;color:#' + t.title + ';margin-bottom:1.1em;">' + _esc(slide.title) + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:1.05em;">' +
      bpts.map(function (p) {
        return '<div style="display:flex;gap:1em;align-items:flex-start;font-size:1.06em;line-height:1.55;">' +
          '<span style="width:.55em;height:.55em;border-radius:.12em;background:#' + t.accent + ';margin-top:.42em;flex-shrink:0;"></span>' +
          '<span>' + _esc(p) + '</span></div>';
      }).join('') + '</div>' + foot + '</div>';
  }
  return h;
}

/* ---------- PPTX 渲染（pptxgenjs，原生可编辑元素） ---------- */
function buildPPTX(deck, themeKey) {
  if (typeof window.PptxGenJS !== 'function' && typeof window.PptxGenJS !== 'object') {
    throw new Error('pptxgenjs 引擎未加载（js/pptxgen.bundle.js）');
  }
  var pptx = new window.PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  var t = PPT_THEMES[themeKey] || PPT_THEMES.business;
  var total = deck.slides.length;
  var FONT = 'Microsoft YaHei';

  deck.slides.forEach(function (s, idx) {
    var slide = pptx.addSlide();
    var dark = !!t.dark;
    if (s.layout === 'section') {
      slide.background = { color: t.accent };
      slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.12, fill: { color: 'FFFFFF', transparency: 65 } });
      slide.addText(String(idx).padStart(2, '0'), { x: 0.8, y: 1.5, w: 3, h: 1.6, fontFace: FONT, fontSize: 66, bold: true, color: 'FFFFFF', transparency: 30 });
      slide.addText(s.title, { x: 0.8, y: 3.0, w: 8.4, h: 1.1, fontFace: FONT, fontSize: 30, bold: true, color: 'FFFFFF' });
    } else if (s.layout === 'title' || s.layout === 'end') {
      slide.background = { color: t.bg };
      slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.12, fill: { color: t.accent } });
      slide.addText(s.layout === 'title' ? 'PRESENTATION' : 'THANKS', { x: 0, y: 1.15, w: 10, h: 0.4, align: 'center', fontFace: FONT, fontSize: 12, bold: true, color: t.accent, charSpacing: 6 });
      slide.addText(s.title, { x: 0.6, y: 1.75, w: 8.8, h: 1.5, align: 'center', fontFace: FONT, fontSize: 36, bold: true, color: t.title });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.6, y: 3.3, w: 8.8, h: 0.5, align: 'center', fontFace: FONT, fontSize: 15, color: t.muted });
      slide.addShape('roundRect', { x: 4.55, y: 3.95, w: 0.9, h: 0.06, fill: { color: t.accent } });
      slide.addText({ text: String(idx + 1) + ' / ' + total, options: { x: 9.0, y: 5.15, w: 0.8, h: 0.3, fontFace: FONT, fontSize: 9, color: t.muted, align: 'right' } });
    } else {
      slide.background = { color: t.bg };
      slide.addShape('rect', { x: 0, y: 0, w: 10, h: 0.12, fill: { color: t.accent } });
      slide.addText(s.title, { x: 0.8, y: 0.55, w: 8.4, h: 0.75, fontFace: FONT, fontSize: 24, bold: true, color: t.title });
      slide.addText(String(idx + 1) + ' / ' + total, { x: 8.9, y: 5.2, w: 0.9, h: 0.3, align: 'right', fontFace: FONT, fontSize: 9, color: t.muted });

      if (s.layout === 'toc') {
        var pts = s.points || [];
        var half = Math.ceil(pts.length / 2) || 1;
        slide.addShape('roundRect', { x: 0.8, y: 1.55, w: 8.4, h: 3.4, fill: { color: t.band } });
        [[pts.slice(0, half), 0], [pts.slice(half), half]].forEach(function (col, ci) {
          var arr = col[0], off = col[1];
          if (!arr.length) return;
          var runs = [];
          arr.forEach(function (p, i) {
            runs.push({ text: String(i + 1 + off).padStart(2, '0') + '  ', options: { fontSize: 15, bold: true, color: t.accent, breakLine: false } });
            runs.push({ text: p, options: { fontSize: 14, color: t.text, breakLine: true } });
          });
          slide.addText(runs, { x: ci === 0 ? 1.3 : 5.35, y: 1.95, w: 3.5, h: 2.7, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.5 });
        });
      } else if (s.layout === 'two') {
        [['left', 0.8], ['right', 5.15]].forEach(function (cfg) {
          var sd = s[cfg[0]] || { t: '', points: [] };
          slide.addShape('roundRect', { x: cfg[1], y: 1.55, w: 4.05, h: 3.5, fill: { color: t.band } });
          var runs = [{ text: sd.t, options: { fontSize: 17, bold: true, color: t.accent, breakLine: true } }];
          (sd.points || []).forEach(function (p) { runs.push({ text: '· ' + p, options: { fontSize: 13, color: t.text, breakLine: true } }); });
          slide.addText(runs, { x: cfg[1] + 0.3, y: 1.85, w: 3.5, h: 2.9, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.45 });
        });
      } else if (s.layout === 'data') {
        var bars = s.bars || [];
        if (bars.length) {
          slide.addChart(pptx.ChartType.bar, [{ name: s.title, labels: bars.map(function (b) { return b.label; }), values: bars.map(function (b) { return b.value; }) }], {
            x: 0.9, y: 1.6, w: 8.2, h: 3.3,
            barDir: 'bar', chartColors: [t.accent],
            catAxisLabelColor: t.muted, valAxisLabelColor: t.muted,
            catAxisLabelFontFace: FONT, valAxisLabelFontFace: FONT,
            catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
            showValue: true, dataLabelColor: t.title, dataLabelFontSize: 11, dataLabelFontFace: FONT,
            valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
            showLegend: false, barGapWidthPct: 60
          });
        }
      } else { /* bullets */
        var bp = s.points || [];
        var runs2 = [];
        bp.forEach(function (p) {
          runs2.push({ text: '■  ', options: { fontSize: 11, color: t.accent, breakLine: false } });
          runs2.push({ text: p, options: { fontSize: 15, color: t.text, breakLine: true } });
        });
        slide.addText(runs2, { x: 0.95, y: 1.55, w: 8.1, h: 3.45, fontFace: FONT, valign: 'middle', lineSpacingMultiple: 1.55 });
      }
    }
    if (s.note) slide.addNotes(s.note);
  });
  return pptx;
}

/* ---------- Prompt 模板 ---------- */
function pptOutlinePrompt(opts) {
  return [
    '你是一位资深演示设计师。请为以下需求生成一份 PPT 大纲（Markdown 格式）。',
    '',
    '主题：' + opts.topic,
    '受众：' + (opts.audience || '通用职场'),
    '目标页数：约 ' + (opts.pages || 12) + ' 页（含封面、目录、章节页、结尾页）',
    '风格要求：' + (opts.style || '专业、简练、有观点'),
    opts.extra ? '补充要求：' + opts.extra : '',
    '',
    '输出格式要求（严格遵守，不要额外解释）：',
    '# 主标题',
    '副标题：一句话副标题',
    '## 章节/页面标题',
    '- 要点1（每页 3~5 条，每条不超过 22 字）',
    '- 要点2',
    '…',
    '若某页适合左右对比，用【对比】标记并在下级列出两侧；若适合数据展示，用【数据】标记并列出 名称:数值。',
    '最后一行输出（备注）：演讲者备注建议（一句话）。'
  ].filter(Boolean).join('\n');
}

function pptDeckPrompt(outlineMd, themeName) {
  return [
    '把下面的 PPT 大纲转换为 JSON deck。只输出 JSON，不要任何解释或代码块围栏。',
    '主题：' + themeName,
    '',
    'JSON 结构：',
    '{"title":"主标题","subtitle":"副标题","slides":[{"layout":"…","title":"…",…}]}',
    'layout 取值与字段：',
    '- "title"：封面，{title, subtitle}',
    '- "toc"：目录，{title:"目录", points:["章节名",…]}（3~6 项）',
    '- "section"：章节过渡页，{title:"章节名"}',
    '- "bullets"：内容页，{title, points:["…"]}（每条≤22字，3~6条）',
    '- "two"：对比页，{title, left:{t:"名",points:[…]}, right:{t:"名",points:[…]}}（各2~4条）',
    '- "data"：数据页，{title, unit:"单位", bars:[{label:"名",value:数字}]}（2~6项）',
    '- "end"：结尾页，{title:"谢谢观看", subtitle:"Q & A"}',
    '每页可加 "note":"演讲备注一句话"。总页数与大纲一致。不要编造大纲没有的数据。',
    '',
    '大纲：',
    outlineMd
  ].join('\n');
}

function extractJSON(text) {
  var m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  var raw = m ? m[1] : text;
  var start = raw.indexOf('{');
  var end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('未找到 JSON 内容');
  return raw.slice(start, end + 1);
}

/* ============ .pptx 解析（纯浏览器：ZIP 目录 + deflate-raw 解压，逐页提取文字） ============
 * .pptx 本质是 ZIP，幻灯片文字位于 ppt/slides/slideN.xml 的 <a:t> 中。
 * 用浏览器原生 DecompressionStream('deflate-raw') 解压，无需任何第三方库。
 */
function _pptxUnzip(arrayBuffer) {
  var dv = new DataView(arrayBuffer);
  var u8 = new Uint8Array(arrayBuffer);
  var dec = new TextDecoder('utf-8');
  var eocd = -1;
  var lo = Math.max(0, u8.length - 22 - 65536);
  for (var i = u8.length - 22; i >= lo; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 PPTX（未找到 ZIP 目录）');
  var cdCount = dv.getUint16(eocd + 10, true);
  var cdOffset = dv.getUint32(eocd + 16, true);
  var entries = {};
  var p = cdOffset;
  for (var c = 0; c < cdCount; c++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    var method = dv.getUint16(p + 10, true);
    var compSize = dv.getUint32(p + 20, true);
    var nameLen = dv.getUint16(p + 28, true);
    var extraLen = dv.getUint16(p + 30, true);
    var commentLen = dv.getUint16(p + 32, true);
    var localOffset = dv.getUint32(p + 42, true);
    var name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    var lhNameLen = dv.getUint16(localOffset + 26, true);
    var lhExtraLen = dv.getUint16(localOffset + 28, true);
    var dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    entries[name] = { method: method, data: u8.subarray(dataStart, dataStart + compSize) };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function _pptxInflate(entry) {
  if (entry.method === 0) return entry.data;
  if (entry.method === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('当前浏览器不支持解压（需较新版 Chrome/Edge/Firefox/Safari）');
    }
    var stream = new Blob([entry.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    var ab = await new Response(stream).arrayBuffer();
    return new Uint8Array(ab);
  }
  throw new Error('不支持的 ZIP 压缩方式: ' + entry.method);
}

function _decodeXmlEntities(s) {
  return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); }).replace(/&amp;/g, '&');
}

function _extractSlideLines(xml) {
  var lines = [];
  var paras = xml.split('<a:p>');
  for (var i = 0; i < paras.length; i++) {
    var runs = paras[i].match(/<a:t>([\s\S]*?)<\/a:t>/g);
    if (!runs) continue;
    var line = runs.map(function (r) { return r.replace(/<\/?a:t>/g, ''); }).join('');
    line = _decodeXmlEntities(line).replace(/\s+/g, ' ').trim();
    if (line) lines.push(line);
  }
  return lines;
}

/* 返回：{ slides:[{lines:[...], note:''}], count }  —— 逐页文字与备注 */
async function parsePptxFile(file) {
  var buf = await file.arrayBuffer();
  var entries = _pptxUnzip(buf);
  var dec = new TextDecoder('utf-8');
  var slideNames = Object.keys(entries).filter(function (n) { return /^ppt\/slides\/slide\d+\.xml$/.test(n); });
  if (!slideNames.length) throw new Error('未在文件中找到幻灯片（ppt/slides/*.xml）');
  slideNames.sort(function (a, b) {
    return parseInt(a.match(/slide(\d+)\.xml/)[1], 10) - parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
  });
  var slides = [];
  for (var i = 0; i < slideNames.length; i++) {
    var xml = dec.decode(await _pptxInflate(entries[slideNames[i]]));
    var lines = _extractSlideLines(xml);
    var noteName = 'ppt/notesSlides/notesSlide' + (i + 1) + '.xml';
    var note = '';
    if (entries[noteName]) {
      try { note = _extractSlideLines(dec.decode(await _pptxInflate(entries[noteName]))).join(' '); } catch (e) { note = ''; }
    }
    slides.push({ lines: lines, note: note });
  }
  return { slides: slides, count: slides.length };
}

/* 把解析结果整理为喂给 LLM 的原文文本 */
function pptxToPlainText(parsed) {
  return parsed.slides.map(function (s, i) {
    var body = s.lines.length ? s.lines.join('\n') : '（本页无文字）';
    return '【第 ' + (i + 1) + ' 页】\n' + body + (s.note ? '\n（备注：' + s.note + '）' : '');
  }).join('\n\n');
}

/* ---------- 分析并优化现有 PPT 的 Prompt ---------- */
function pptOptimizePrompt(opts) {
  return [
    '你是一位资深演示优化专家。下面是从一份现有 PPT 中逐页提取的原始文字内容。',
    '请先诊断它的主要问题（逻辑主线、结构层次、表达是否观点先行、信息密度、数据呈现、视觉叙事等），再据此产出一份【优化后】的 PPT 大纲（Markdown 格式）。',
    '',
    '受众：' + (opts.audience || '通用职场'),
    '目标页数：约 ' + (opts.pages || 12) + ' 页（可在原稿基础上合并、拆分或重排页面）',
    '风格要求：' + (opts.style || '专业、简练、有观点'),
    opts.extra ? '补充要求：' + opts.extra : '',
    '',
    '输出格式（严格遵守，不要额外解释、不要代码块围栏）：',
    '先输出不超过 5 条「优化说明」，每条独占一行且以 > 开头，简述你改了什么、为什么；',
    '空一行后，紧接着输出优化大纲：',
    '# 主标题',
    '副标题：一句话副标题',
    '## 章节/页面标题',
    '- 要点（每页 3~5 条，每条不超过 22 字）',
    '若某页适合左右对比，用【对比】标记并在下级列出两侧；若适合数据展示，用【数据】标记并列出 名称:数值。',
    '尊重原稿的核心信息，不要编造原文完全没有依据的数据或结论。',
    '',
    '原始 PPT 内容：',
    opts.original
  ].filter(Boolean).join('\n');
}
