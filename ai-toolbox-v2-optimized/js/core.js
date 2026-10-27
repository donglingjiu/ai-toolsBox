/* ============================================================
   Nova core · 命令面板 / Toast / 最近使用（B1）
   ============================================================ */
"use strict";

/* —— 工具索引（B2-B6 持续扩充） —— */
const NovaCommandIndex = [
  { group: "工作台" },
  { t: "Nova Docs · 星文 — 文档工作台",  k: "docs 文档 word pdf 转换 演示 ppt",        u: "docs.html",   h: "Docs" },
  { t: "Nova Data · 星数 — 数据工作台",  k: "data 数据 表格 csv excel 图表 脱敏",     u: "data.html",   h: "Data" },
  { t: "Nova Flow · 星流 — 流程工作台",  k: "flow 流程 流水线 编排 步骤",             u: "flow.html",   h: "Flow" },
  { t: "Nova Mind · 星智 — AI 全流程",   k: "mind ai 对话 流水线 六专家 lab 提示词",   u: "mind.html",   h: "Mind" },
  { group: "全局" },
  { t: "设置 · API 与隐私",             k: "settings 设置 key api profile 隐私",      u: "settings.html", h: "⚙" },
];

/* —— 命令面板 —— */
const Cmdk = {
  el: null, input: null, listEl: null,
  items: [], sel: 0,

  init() {
    this.el = document.createElement("div");
    this.el.className = "cmdk-overlay";
    this.el.innerHTML = `
      <div class="cmdk" role="dialog" aria-modal="true" aria-label="Nova Command 命令面板">
        <div class="cmdk__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" placeholder="搜索工具、工作台、功能…" aria-label="搜索命令" autocomplete="off" spellcheck="false">
        </div>
        <div class="cmdk__list"></div>
      </div>`;
    document.body.appendChild(this.el);
    this.input = this.el.querySelector("input");
    this.listEl = this.el.querySelector(".cmdk__list");

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); this.toggle(); }
      if (e.key === "Escape" && this.el.dataset.open === "true") this.close();
    });
    this.el.addEventListener("click", (e) => { if (e.target === this.el) this.close(); });
    this.input.addEventListener("input", () => this.render(this.input.value.trim().toLowerCase()));
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); this.move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      else if (e.key === "Enter" && this.items[this.sel]) { e.preventDefault(); this.go(this.items[this.sel]); }
    });
    document.querySelectorAll("[data-cmdk-open]").forEach((b) =>
      b.addEventListener("click", () => this.open()));
  },

  open()  { this.el.dataset.open = "true"; this.input.value = ""; this.render(""); this.input.focus(); },
  close() { this.el.dataset.open = "false"; },
  toggle(){ this.el.dataset.open === "true" ? this.close() : this.open(); },

  render(q) {
    const hits = NovaCommandIndex.filter((i) =>
      !i.group && (!q || i.t.toLowerCase().includes(q) || i.k.includes(q)));
    this.items = hits; this.sel = 0;
    if (!hits.length) { this.listEl.innerHTML = `<div class="cmdk__empty">没有匹配「${this.escapeHtml(q)}」的结果</div>`; return; }
    let html = "", lastGroup = "";
    NovaCommandIndex.forEach((i) => {
      if (i.group) { lastGroup = i.group; return; }
      if (q && !hits.includes(i)) return;
      if (!q && i.group !== undefined) {}
    });
    /* 按分组渲染命中项 */
    const ordered = NovaCommandIndex.filter((i) => hits.includes(i));
    html = ordered.map((i) => {
      const gi = NovaCommandIndex.indexOf(
        [...NovaCommandIndex].reverse().find((g) => g.group && NovaCommandIndex.indexOf(g) < NovaCommandIndex.indexOf(i)) || { group: "" });
      return "";
    }).join("");
    html = ordered.map((i, idx) => {
      const g = this.groupOf(i);
      const head = (g && g !== this.groupOf(ordered[idx - 1] || {}))
        ? `<div class="cmdk__group">${g}</div>` : "";
      return `${head}<button class="cmdk__item" data-idx="${idx}" data-u="${i.u}">
        <span class="cmdk__item-title">${this.escapeHtml(i.t)}</span>
        <span class="cmdk__item-hint">${i.h}</span></button>`;
    }).join("");
    this.listEl.innerHTML = html;
    this.listEl.querySelectorAll(".cmdk__item").forEach((btn) => {
      btn.addEventListener("click", () => this.go(this.items[+btn.dataset.idx]));
      btn.addEventListener("mousemove", () => { this.sel = +btn.dataset.idx; this.paint(); });
    });
    this.paint();
  },

  groupOf(item) {
    let g = "";
    for (const i of NovaCommandIndex) { if (i.group) g = i.group; else if (i === item) return g; }
    return "";
  },
  move(d) { this.sel = (this.sel + d + this.items.length) % this.items.length; this.paint(); this.scrollSel(); },
  paint() { this.listEl.querySelectorAll(".cmdk__item").forEach((b, i) => b.dataset.selected = String(i === this.sel)); },
  scrollSel() { const el = this.listEl.querySelector(`[data-idx="${this.sel}"]`); if (el) el.scrollIntoView({ block: "nearest" }); },
  go(item) { this.markRecent(item); this.close(); location.href = item.u; },
  escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },

  /* —— 最近使用（localStorage） —— */
  markRecent(item) {
    const rec = this.getRecent().filter((r) => r.u !== item.u);
    rec.unshift({ t: item.t, u: item.u, ts: Date.now() });
    localStorage.setItem("nova.recent", JSON.stringify(rec.slice(0, 6)));
  },
  getRecent() { try { return JSON.parse(localStorage.getItem("nova.recent")) || []; } catch { return []; } },
};

/* —— Toast —— */
function novaToast(msg, type = "ok") {
  let zone = document.querySelector(".toast-zone");
  if (!zone) { zone = document.createElement("div"); zone.className = "toast-zone"; document.body.appendChild(zone); }
  const t = document.createElement("div");
  t.className = "toast"; t.dataset.type = type; t.textContent = msg;
  zone.appendChild(t);
  setTimeout(() => { t.classList.add("is-leaving"); setTimeout(() => t.remove(), 300); }, 2600);
}

/* —— 启动 —— */
document.addEventListener("DOMContentLoaded", () => {
  Cmdk.init();
  const zone = document.querySelector("[data-recent-zone]");
  if (zone) {
    const rec = Cmdk.getRecent();
    if (!rec.length) { zone.closest("section").style.display = "none"; return; }
    zone.innerHTML = rec.map((r) =>
      `<a class="tag" href="${r.u}" style="cursor:pointer">${r.t.split("—")[0].trim()}</a>`).join("");
  }
});
