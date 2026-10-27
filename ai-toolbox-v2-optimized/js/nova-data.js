/* ============================================================
   Nova Data v1.0 · 预览 / 画像 / 受限变换 / SVG 图表
   复用 xlsx-core.js 纯函数：xlsxParse / toTable / profileTable /
   isSensitiveColumn / applyTransformPlan（内含校验）
   零新增依赖；图表为手写 SVG；全部本地执行
   ============================================================ */
"use strict";

const $d = (s) => document.querySelector(s);
const $$d = (s) => Array.from(document.querySelectorAll(s));
const baseName = (n) => n.replace(/\.[^.]+$/, "");
const toNum = (v) => { if (typeof v === "number") return v; const n = parseFloat(String(v == null ? "" : v).replace(/,/g, "")); return isNaN(n) ? null : n; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmtN = (n) => Math.abs(n) >= 1000 ? n.toLocaleString("zh-CN", { maximumFractionDigits: 1 }) : String(Math.round(n * 100) / 100);
const PALETTE = ["#4C6FFF","#45E0C8","#FFC24B","#FF6B81","#B18CFF","#5B9DFF","#4ADE80","#F59E0B","#EC4899","#22D3EE"];

/* ---------- 状态 ---------- */
let WB = null, SHEET = null, BASE = "", ORIG = null, TABLE = null, OPS = [], LASTCHART = "";
const maskOn = () => $d("#mask-toggle").checked;

/* ---------- 脱敏 ---------- */
function maskCell(colName, v) {
  if (!isSensitiveColumn(colName) || v == null) return v;
  const s = String(v).trim();
  if (/^1[3-9]\d{9}$/.test(s)) return s.slice(0, 3) + "****" + s.slice(7);
  if (/^\d{17}[\dXx]$/.test(s)) return s.slice(0, 6) + "********" + s.slice(14);
  if (/^[^@]+@[^@]+$/.test(s)) return s[0] + "***" + s.slice(s.indexOf("@"));
  return "***";
}
const cellOf = (r, h) => maskOn() ? maskCell(h, r[h]) : r[h];

/* ---------- 加载 ---------- */
async function loadFile(file) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { novaToast("仅支持 xlsx / xls / csv", "error"); return; }
  if (file.size > 20 * 1048576) { novaToast("文件超过 20MB，请拆分后再试", "error"); return; }
  try {
    WB = xlsxParse(await file.arrayBuffer());
    BASE = baseName(file.name);
    switchSheet(WB.sheetNames[0]);
    novaToast(`✅ 已加载 ${file.name}（${WB.sheetNames.length} 个工作表）`);
  } catch (e) { novaToast("解析失败：" + (e.message || e), "error"); }
}

function switchSheet(name) {
  SHEET = name;
  ORIG = toTable(WB.sheets[name].aoa, 0);
  OPS = []; TABLE = ORIG;
  renderAll();
}

/* ---------- 渲染总入口 ---------- */
function renderAll() {
  renderChips(); renderPreview(); renderProfile(); renderOpFields(); renderHistory(); renderChartSelectors();
  const has = !!TABLE && TABLE.headers.length > 0;
  $d("#ds-info").textContent = has
    ? `Sheet「${SHEET}」· ${TABLE.rows.length} 行 × ${TABLE.headers.length} 列${OPS.length ? ` · 已应用 ${OPS.length} 项变换` : ""}`
    : "未加载数据";
  $d("#export-csv").disabled = $d("#export-xlsx").disabled = !has;
}

function renderChips() {
  const box = $d("#sheet-chips");
  box.innerHTML = WB ? WB.sheetNames.map((n) =>
    `<button class="mini chip-btn" data-sheet="${esc(n)}" aria-pressed="${n === SHEET}">${esc(n)}</button>`).join("") : "";
}

/* ---------- 预览 ---------- */
function renderPreview() {
  const tb = $d("#preview-table");
  $d("#preview-empty").hidden = !!TABLE && TABLE.rows.length > 0;
  if (!TABLE || !TABLE.headers.length) { tb.innerHTML = ""; return; }
  const heads = TABLE.headers.map((h) => `<th>${esc(h)}${isSensitiveColumn(h) ? " 🔒" : ""}</th>`).join("");
  const rows = TABLE.rows.slice(0, 50).map((r) => "<tr>" + TABLE.headers.map((h) => {
    const v = cellOf(r, h);
    const cls = v == null || v === "" ? "is-null" : (maskOn() && cellOf(r, h) !== r[h] ? "is-masked" : "");
    return `<td class="${cls}">${v == null || v === "" ? "空" : esc(String(v))}</td>`;
  }).join("") + "</tr>").join("");
  tb.innerHTML = `<thead><tr>${heads}</tr></thead><tbody>${rows}</tbody>`;
}

/* ---------- 画像 ---------- */
function renderProfile() {
  const grid = $d("#profile-grid");
  $d("#profile-empty").hidden = !!TABLE && TABLE.rows.length > 0;
  if (!TABLE || !TABLE.headers.length) { grid.innerHTML = ""; $d("#profile-summary").textContent = ""; return; }
  const p = profileTable(TABLE, { sample: 5 });
  $d("#profile-summary").textContent = `${p.rowCount} 行 × ${p.colCount} 列 · 本地统计`;
  grid.innerHTML = p.columns.map((c) => {
    const stat = c.type === "number" && c.min != null
      ? `<dt>min</dt><dd>${fmtN(c.min)}</dd><dt>mean</dt><dd>${fmtN(c.mean)}</dd><dt>max</dt><dd>${fmtN(c.max)}</dd>` : "";
    return `<div class="pcard">
      <div class="pcard__name">${esc(c.name)}${isSensitiveColumn(c.name) ? '<span class="badge-sens">敏感</span>' : ""}</div>
      <dl>
        <dt>类型</dt><dd>${c.type}</dd>
        <dt>非空</dt><dd>${c.nonNull}（空 ${c.nullCount}）</dd>
        <dt>唯一值</dt><dd>${c.unique}</dd>${stat}
      </dl></div>`;
  }).join("");
}

/* ---------- 变换 ---------- */
const OP_UI = {
  select_columns:  [{ k: "columns", t: "multi", label: "保留列（可多选）" }],
  rename_column:   [{ k: "from", t: "col", label: "原列名" }, { k: "to", t: "text", label: "新列名" }],
  filter_rows:     [{ k: "column", t: "col", label: "列" },
                    { k: "op", t: "select", label: "比较", opts: ["eq","ne","gt","lt","ge","le","contains","not_empty","empty"] },
                    { k: "value", t: "text", label: "值（空值比较可留空）" }],
  sort_rows:       [{ k: "column", t: "col", label: "列" }, { k: "order", t: "select", label: "方向", opts: ["asc", "desc"] }],
  dedupe_rows:     [{ k: "keys", t: "multi", label: "判重键（可多选）" }],
  trim_text:       [{ k: "columns", t: "multi", label: "处理列（可多选）" }],
  coerce_number:   [{ k: "column", t: "col", label: "列" }],
  group_aggregate: [{ k: "groupBy", t: "multi", label: "分组列（可多选）" },
                    { k: "_mcol", t: "col", label: "度量列" }, { k: "_magg", t: "select", label: "聚合", opts: ["sum","count","avg","min","max"] }],
  add_computed:    [{ k: "formula", t: "select", label: "公式", opts: ["concat","add","subtract","multiply","divide"] },
                    { k: "columns", t: "multi", label: "参与列（算术选 2 列）" }, { k: "as", t: "text", label: "新列名" }],
};

function renderOpFields() {
  const type = $d("#op-type").value;
  const cols = TABLE ? TABLE.headers : [];
  const opt = (v, l) => `<option value="${esc(v)}">${esc(l || v)}</option>`;
  $d("#op-fields").innerHTML = OP_UI[type].map((f) => {
    if (f.t === "col")    return `<label class="field">${f.label}<select class="fld" data-k="${f.k}">${cols.map((c) => opt(c)).join("")}</select></label>`;
    if (f.t === "multi")  return `<label class="field">${f.label}<select class="fld" data-k="${f.k}" multiple size="4">${cols.map((c) => opt(c)).join("")}</select></label>`;
    if (f.t === "select") return `<label class="field">${f.label}<select class="fld" data-k="${f.k}">${f.opts.map((o) => opt(o)).join("")}</select></label>`;
    return `<label class="field">${f.label}<input class="fld" data-k="${f.k}" type="text"></label>`;
  }).join("");
}

function gatherOp() {
  const type = $d("#op-type").value;
  const get = (k) => { const el = $d(`#op-fields [data-k="${k}"]`); return el ? el.value : undefined; };
  const getMulti = (k) => { const el = $d(`#op-fields [data-k="${k}"]`); return el ? Array.from(el.selectedOptions).map((o) => o.value) : []; };
  const op = { type };
  if (type === "select_columns" || type === "trim_text") op.columns = getMulti("columns");
  if (type === "dedupe_rows") op.keys = getMulti("keys");
  if (type === "rename_column") { op.from = get("from"); op.to = get("to"); }
  if (type === "filter_rows")  { op.column = get("column"); op.op = get("op"); op.value = get("value"); }
  if (type === "sort_rows")    { op.column = get("column"); op.order = get("order"); }
  if (type === "coerce_number") op.column = get("column");
  if (type === "add_computed") { op.formula = get("formula"); op.columns = getMulti("columns"); op.as = get("as"); }
  if (type === "group_aggregate") {
    op.groupBy = getMulti("groupBy");
    op.metrics = [{ column: get("_mcol"), op: get("_magg") }];
  }
  return op;
}

function applyOne(op, { record = true } = {}) {
  try {
    const nt = applyTransformPlan(TABLE, { operations: [op] });
    if (!nt || !Array.isArray(nt.headers)) throw new Error("变换引擎返回异常");
    TABLE = nt;
    if (record) OPS.push(op);
    novaToast("✅ 已执行：" + op.type);
    renderAll();
  } catch (e) { novaToast("变换被拒绝：" + (e.message || e), "error"); }
}

function replay() {
  let t = ORIG;
  for (const op of OPS) t = applyTransformPlan(t, { operations: [op] });
  TABLE = t;
}

function renderHistory() {
  $d("#op-history").innerHTML = OPS.map((op, i) =>
    `<button class="mini ${i === OPS.length - 1 ? "is-head" : ""}" data-hist="${i}" title="回退到这一步">${i + 1}. ${esc(op.type)} ✕</button>`).join("");
}

/* ---------- 图表 ---------- */
function renderChartSelectors() {
  const cols = TABLE ? TABLE.headers : [];
  const nums = TABLE ? TABLE.headers.filter((h) => {
    const vals = TABLE.rows.slice(0, 50).map((r) => r[h]).filter((v) => v != null && v !== "");
    return vals.length && vals.filter((v) => toNum(v) != null).length / vals.length > 0.6;
  }) : [];
  const opt = (v, l) => `<option value="${esc(v)}">${esc(l || v)}</option>`;
  $d("#chart-dim").innerHTML = cols.map((c) => opt(c)).join("") || "<option value=''>—</option>";
  $d("#chart-measure").innerHTML = `<option value="">（仅计数）</option>` + nums.map((c) => opt(c)).join("");
}

function aggregate(dim, measure, agg) {
  const map = new Map();
  for (const r of TABLE.rows) {
    const key = r[dim] == null || r[dim] === "" ? "(空)" : String(r[dim]);
    if (!map.has(key)) map.set(key, { sum: 0, count: 0, min: Infinity, max: -Infinity });
    const b = map.get(key); const n = measure ? toNum(r[measure]) : 1;
    b.count++; if (n != null) { b.sum += n; b.min = Math.min(b.min, n); b.max = Math.max(b.max, n); }
  }
  return Array.from(map, ([k, b]) => ({
    k,
    v: measure ? (agg === "avg" ? b.sum / (b.count || 1) : agg === "min" ? b.min : agg === "max" ? b.max : b.sum) : b.count,
  })).filter((d) => isFinite(d.v));
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

function drawBar(data) {
  const W = 860, H = 420, M = { l: 70, r: 24, t: 24, b: 64 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const max = niceMax(Math.max(...data.map((d) => d.v)));
  const bw = iw / data.length;
  const skip = Math.ceil(data.length / 14);
  const y = (v) => M.t + ih - (v / max) * ih;
  let s = "";
  for (let g = 0; g <= 4; g++) {
    const gv = (max / 4) * g, gy = y(gv);
    s += `<line x1="${M.l}" y1="${gy}" x2="${W - M.r}" y2="${gy}" stroke="var(--line)"/><text x="${M.l - 8}" y="${gy + 4}" text-anchor="end" font-size="11" fill="currentColor">${fmtN(gv)}</text>`;
  }
  data.forEach((d, i) => {
    const x = M.l + i * bw, by = y(d.v);
    s += `<rect x="${x + bw * 0.15}" y="${by}" width="${bw * 0.7}" height="${M.t + ih - by}" rx="3" fill="${PALETTE[i % PALETTE.length]}"><title>${esc(d.k)}：${fmtN(d.v)}</title></rect>`;
    if (i % skip === 0) s += `<text x="${x + bw / 2}" y="${H - M.b + 16}" text-anchor="middle" font-size="11" fill="currentColor">${esc(d.k.length > 8 ? d.k.slice(0, 7) + "…" : d.k)}</text>`;
  });
  return svgWrap(W, H, s);
}

function drawLine(data) {
  const W = 860, H = 420, M = { l: 70, r: 24, t: 24, b: 64 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const max = niceMax(Math.max(...data.map((d) => d.v)));
  const x = (i) => M.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => M.t + ih - (v / max) * ih;
  let s = "";
  for (let g = 0; g <= 4; g++) {
    const gv = (max / 4) * g, gy = y(gv);
    s += `<line x1="${M.l}" y1="${gy}" x2="${W - M.r}" y2="${gy}" stroke="var(--line)"/><text x="${M.l - 8}" y="${gy + 4}" text-anchor="end" font-size="11" fill="currentColor">${fmtN(gv)}</text>`;
  }
  const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(" ");
  s += `<polyline points="${pts}" fill="none" stroke="${PALETTE[0]}" stroke-width="2"/>`;
  data.forEach((d, i) => {
    s += `<circle cx="${x(i)}" cy="${y(d.v)}" r="3.5" fill="${PALETTE[0]}"><title>${esc(d.k)}：${fmtN(d.v)}</title></circle>`;
    if (i % Math.ceil(data.length / 14) === 0) s += `<text x="${x(i)}" y="${H - M.b + 16}" text-anchor="middle" font-size="11" fill="currentColor">${esc(d.k.length > 8 ? d.k.slice(0, 7) + "…" : d.k)}</text>`;
  });
  return svgWrap(W, H, s);
}

function drawPie(data) {
  const W = 860, H = 420, cx = 240, cy = 210, r = 150, r0 = 78;
  const total = data.reduce((a, d) => a + d.v, 0) || 1;
  let a0 = -Math.PI / 2, s = "", legend = "";
  data.forEach((d, i) => {
    const frac = d.v / total;
    const span = Math.max(0.02, frac * Math.PI * 2 - 0.02);
    const a1 = a0 + span;
    const p = (rr, a) => `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
    const lg = a1 - a0 > Math.PI ? 1 : 0;
    s += `<path d="M${p(r, a0)} A${r},${r} 0 ${lg} 1 ${p(r, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${lg} 0 ${p(r0, a0)} Z" fill="${PALETTE[i % PALETTE.length]}"><title>${esc(d.k)}：${fmtN(d.v)}（${(frac * 100).toFixed(1)}%）</title></path>`;
    legend += `<div class="legend"><span><span style="color:${PALETTE[i % PALETTE.length]}">■</span> ${esc(d.k)} · ${fmtN(d.v)} · ${(frac * 100).toFixed(1)}%</span></div>`;
    a0 = a1;
  });
  return svgWrap(W, H, s + `<g transform="translate(${cx + r + 60},${cy - data.length * 11})">${legend}</g>`);
}

const svgWrap = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;

function drawChart() {
  if (!TABLE || !TABLE.rows.length) { novaToast("请先加载数据", "error"); return; }
  const type = $d("#chart-type").value, dim = $d("#chart-dim").value;
  const measure = $d("#chart-measure").value, agg = measure ? $d("#chart-agg").value : "count";
  if (!dim) return;
  let data = aggregate(dim, measure, agg).sort((a, b) => b.v - a.v);
  if (type === "line") {
    const isDate = data.every((d) => /^\d{4}[-/]/.test(d.k));
    data = isDate ? data.sort((a, b) => a.k.localeCompare(b.k)) : data;
  }
  if (type === "pie") { const top = data.slice(0, 8); if (data.length > 8) top.push({ k: "其他", v: data.slice(8).reduce((a, d) => a + d.v, 0) }); data = top; }
  else data = data.slice(0, 20);
  if (!data.length) { novaToast("聚合结果为空：检查维度/度量列", "error"); return; }

  LASTCHART = type === "pie" ? drawPie(data) : type === "line" ? drawLine(data) : drawBar(data);
  $d("#chart-box").innerHTML = LASTCHART;
  $d("#chart-empty").hidden = true;
  $d("#chart-svg").disabled = false;
}

/* ---------- 导出 ---------- */
function exportRows() {
  if (!TABLE) return null;
  if (!maskOn()) return TABLE.rows;
  return TABLE.rows.map((r) => { const o = {}; TABLE.headers.forEach((h) => (o[h] = maskCell(h, r[h]))); return o; });
}
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportCsv() {
  const rows = exportRows(); if (!rows) return;
  const ws = XLSX.utils.json_to_sheet(rows, { header: TABLE.headers });
  download(new Blob(["\uFEFF" + XLSX.utils.sheet_to_csv(ws)], { type: "text/csv" }), `${BASE}-${SHEET}${maskOn() ? "-脱敏" : ""}.csv`);
}
function exportXlsx() {
  const rows = exportRows(); if (!rows) return;
  const ws = XLSX.utils.json_to_sheet(rows, { header: TABLE.headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(SHEET).slice(0, 31) || "data");
  download(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${BASE}-${SHEET}${maskOn() ? "-脱敏" : ""}.xlsx`);
}

/* ---------- 事件接线 ---------- */
function initData() {
  const dz = $d("#dropzone"), fi = $d("#file-input");
  dz.addEventListener("click", () => fi.click());
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } });
  fi.addEventListener("change", () => { if (fi.files[0]) loadFile(fi.files[0]); fi.value = ""; });
  ["dragover", "dragenter"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-drag"); }));
  dz.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });

  $d("#sheet-chips").addEventListener("click", (e) => { if (e.target.dataset.sheet && e.target.dataset.sheet !== SHEET) switchSheet(e.target.dataset.sheet); });
  $d("#mask-toggle").addEventListener("change", renderPreview);

  $$d(".tab").forEach((tab) => tab.addEventListener("click", () => {
    $$d(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    ["preview", "profile", "transform", "chart"].forEach((n) => { $d("#tab-" + n).hidden = n !== tab.dataset.tab; });
  }));

  $d("#export-csv").addEventListener("click", exportCsv);
  $d("#export-xlsx").addEventListener("click", exportXlsx);

  $d("#op-type").addEventListener("change", renderOpFields);
  $d("#op-apply").addEventListener("click", () => { if (!TABLE) { novaToast("请先加载数据", "error"); return; } applyOne(gatherOp()); });
  $d("#op-undo").addEventListener("click", () => { if (!OPS.length) { novaToast("没有可撤销的变换", "error"); return; } OPS.pop(); replay(); renderAll(); novaToast("已撤销一步"); });
  $d("#op-reset").addEventListener("click", () => { if (!OPS.length) return; OPS = []; replay(); renderAll(); novaToast("已重置为原始数据", "warn"); });
  $d("#op-history").addEventListener("click", (e) => {
    const i = e.target.dataset.hist; if (i === undefined) return;
    OPS = OPS.slice(0, +i); replay(); renderAll(); novaToast(`已回退到第 ${+i + 1} 步之前`);
  });
  $d("#plan-apply").addEventListener("click", () => {
    if (!TABLE) { novaToast("请先加载数据", "error"); return; }
    try {
      const plan = JSON.parse($d("#plan-json").value);
      const nt = applyTransformPlan(TABLE, plan);
      TABLE = nt; OPS = OPS.concat(plan.operations);
      novaToast(`✅ JSON 方案已执行（${plan.operations.length} 项）`);
      renderAll();
    } catch (e) { novaToast("方案被拒绝：" + (e.message || e), "error"); }
  });

  $d("#chart-draw").addEventListener("click", drawChart);
  $d("#chart-svg").addEventListener("click", () => {
    if (!LASTCHART) return;
    download(new Blob([LASTCHART], { type: "image/svg+xml" }), `${BASE}-chart.svg`);
  });
}

document.addEventListener("DOMContentLoaded", initData);
