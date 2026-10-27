/* ============================================================
   Nova Docs v1.0 · 文件处理队列 / 确定性转换引擎 / Nova Vault(IndexedDB)
   零新增依赖：mammoth(docx→html)、SheetJS(xlsx/csv)、pdf.js(自适应加载)
   诚实边界：docx→pdf 不提供；html→pdf 走系统打印；产物自动存星库
   ============================================================ */
"use strict";

const $d = (s) => document.querySelector(s);
const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " KB" : (b/1048576).toFixed(2) + " MB";
const extOf = (n) => (n.split(".").pop() || "").toLowerCase();
const baseOf = (n) => n.replace(/\.[^.]+$/, "");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const safeName = (s) => s.replace(/[\\/:*?"<>|]/g, "_");

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
  pdf:  [ { v: "txt", label: "纯文本 TXT" }, { v: "md", label: "Markdown MD" } ],
  xlsx: SHEET_FMTS, xls: SHEET_FMTS,
  csv:  [ { v: "json", label: "JSON" }, { v: "xlsx", label: "XLSX 表格" } ],
  html: [ { v: "print", label: "打印 / 导出 PDF（系统打印）" } ],
  htm:  [ { v: "print", label: "打印 / 导出 PDF（系统打印）" } ],
};
const targetsFor = (ext) => CONVERT[ext] || [ { v: "vault", label: "不转换，仅存入星库" } ];

/* ---------- pdf.js 自适应加载（路径未知，多候选 + 优雅降级） ---------- */
let _pdfP = null;
function ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfP) return _pdfP;
  const mains = ["js/pdfjs/pdf.min.js", "js/pdfjs/pdf.js", "js/pdfjs/build/pdf.min.js", "js/vendor/pdf.min.js"];
  _pdfP = (async () => {
    for (const src of mains) {
      try { await loadScript(src); } catch { continue; }
      if (window.pdfjsLib) {
        const base = src.replace(/pdf(\.min)?\.js$/, "");
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js";
        return window.pdfjsLib;
      }
    }
    _pdfP = null;
    throw new Error("未找到本地 pdf.js（js/pdfjs/），PDF 转换暂不可用，其余格式不受影响");
  })();
  return _pdfP;
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

/* ---------- 转换实现（全部确定性，无 AI 参与） ---------- */
async function readAB(file) { return file.arrayBuffer(); }

async function convDocx(file, to) {
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await readAB(file) });
  const base = baseOf(file.name);
  if (to === "html") return [{ name: base + ".html", blob: new Blob([wrapHtml(html, base)], { type: "text/html" }) }];
  /* txt：HTML 剥标签（表格结构建议转 HTML 查看） */
  const dom = new DOMParser().parseFromString(html, "text/html");
  const txt = (dom.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  return [{ name: base + ".txt", blob: new Blob([txt], { type: "text/plain" }) }];
}

async function convPdf(file, to) {
  const pdfjs = await ensurePdfJs();
  const pdf = await pdfjs.getDocument({ data: await readAB(file) }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
    parts.push({ no: i, text });
  }
  const base = baseOf(file.name);
  if (to === "md") {
    const md = parts.map((p) => `## 第 ${p.no} 页\n\n${p.text}`).join("\n\n");
    return [{ name: base + ".md", blob: new Blob([md], { type: "text/markdown" }) }];
  }
  const txt = parts.map((p) => `— 第 ${p.no} 页 —\n${p.text}`).join("\n\n");
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
  /* csv：每个工作表一份 */
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
      outs = await convPdf(it.file, it.to);
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

  /* Tabs */
  $d$(".tab").forEach((tab) => tab.addEventListener("click", async () => {
    $d$(".tab").forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    ["convert", "ai", "vault"].forEach((n) => { $d("#tab-" + n).hidden = n !== tab.dataset.tab; });
    if (tab.dataset.tab === "vault") refreshVault();
  }));
  $d("#vault-refresh").addEventListener("click", refreshVault);
  $d("#vault-clear").addEventListener("click", async () => {
    if (!confirm("确定清空 Nova Vault 星库？此操作不可恢复。")) return;
    await Vault.clear(); refreshVault(); novaToast("星库已清空", "warn");
  });

  /* 星库操作 + 预览 */
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
