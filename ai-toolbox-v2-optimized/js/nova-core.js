/* ============================================================
   Nova core v1.1 · 命令面板 / Toast / 最近使用 / 自检
   v1.1: Mac ⌘K 加固（window 捕获 + e.code 兜底）、平台快捷键提示、
        tokens 自检、全局错误可见化、控制台测试入口
   ============================================================ */
"use strict";

/* —— 平台检测 —— */
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
const HOTKEY_LABEL = IS_MAC ? "⌘ K" : "Ctrl K";

/* —— 命令索引：四大工作台 + 旧工具直达（零删除承诺） —— */
const NovaCommandIndex = [
  { group: "工作台" },
  { t: "Nova Docs · 星文 — 文档工作台", k: "docs 文档 word pdf 转换 演示 ppt",   u: "docs.html",   h: "Docs" },
  { t: "Nova Data · 星数 — 数据工作台", k: "data 数据 表格 csv excel 图表 脱敏",  u: "data.html",   h: "Data" },
  { t: "Nova Flow · 星流 — 流程工作台", k: "flow 流程 流水线 编排 步骤",          u: "flow.html",   h: "Flow" },
  { t: "Nova Mind · 星智 — AI 全流程",  k: "mind ai 对话 流水线 六专家 lab",      u: "mind.html",   h: "Mind" },
  { group: "工具直达" },
  { t: "表格分析工具",       k: "excel xlsx csv 表格 画像 dsl",        u: "excel.html",   h: "Data 复用" },
  { t: "AI 演示 PPT",        k: "ppt 演示 幻灯片 大纲",                u: "ppt.html",     h: "Docs 复用" },
  { t: "Word↔PDF 转换",      k: "convert word pdf 转换",               u: "convert.html", h: "Docs 复用" },
  { t: "提示词工具库",       k: "prompts 提示词 123 分类",             u: "prompts.html", h: "Mind 复用" },
  { t: "第二大脑",           k: "brain 知识库 bm25 问答 周报",         u: "brain.html",   h: "Mind 复用" },
  { t: "AI 简历优化",        k: "resume 简历 star 面试",               u: "resume.html",  h: "Lab" },
  { t: "AI 副业顾问",        k: "advisor 副业 顾问 计划",              u: "advisor.html", h: "Lab" },
  { t: "情绪日记",           k: "mood 情绪 日记 曲线",                 u: "mood.html",    h: "Lab" },
  { t: "AI 试衣间",          k: "tryon 试衣 图像",                     u: "tryon.html",   h: "Lab" },
  { t: "艺术挪车码",         k: "qr call 挪车码 二维码",               u: "qr.html",      h: "工具" },
  { group: "全局" },
  { t: "设置 · API Profile 与隐私", k: "settings 设置 key api profile 兜底", u: "settings.html",     h: "⚙" },
  { t: "经典版首页（12 工具平铺）", k: "legacy 经典 旧版 工具列表",          u: "index-legacy.html", h: "↩" },
];

const Cmdk = {
  el: null, input: null, listEl: null, items: [], sel: 0,

  init() {
    this.el = document.createElement("div");
    this.el.className = "cmdk-overlay";
    this.el.innerHTML = `
      <div class="cmdk" role="dialog" aria-modal="true" aria-label="Nova Command 命令面板">
        <div class="cmdk__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="text" placeholder="搜索工作台、工具、功能…" aria-label="搜索命令" autocomplete="off" spellcheck="false">
        </div>
        <div class="cmdk__list"></div>
      </div>`;
    document.body.appendChild(this.el);
    this.input = this.el.querySelector("input");
    this.listEl = this.el.querySelector(".cmdk__list");

    /* v1.1: window + 捕获阶段 + e.code 兜底（防中文输入法 e.key=Process） */
    window.addEventListener("keydown", (e) => {
      const k = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "k" || e.code === "KeyK")) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
        return;
      }
      if (e.key === "Escape" && this.el.dataset.open === "true") this.close();
    }, true);

    this.el.addEventListener("click", (e) => { if (e.target === this.el) this.close(); });
    this.input.addEventListener("input", () => this.render(this.input.value.trim().toLowerCase()));
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown")    { e.preventDefault(); this.move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      else if (e.key === "Enter" && this.items[this.sel]) { e.preventDefault(); this.go(this.items[this.sel]); }
    });
    document.querySelectorAll("[data-cmdk-open]").forEach((b) => b.addEventListener("click", () => this.open()));

    /* v1.1: 按平台改写快捷键提示文案 */
    document.querySelectorAll(".cmdk-btn kbd").forEach((el) => (el.textContent = HOTKEY_LABEL));
    const heroBtn = document.querySelector(".hero__cta .btn--primary");
    if (heroBtn) heroBtn.textContent = `按 ${IS_MAC ? "⌘ K" : "Ctrl + K"} 唤起 Nova Command`;
  },

  open()  { this.el.dataset.open = "true"; this.input.value = ""; this.render(""); this.input.focus(); },
  close() { this.el.dataset.open = "false"; },
  toggle(){ this.el.dataset.open === "true" ? this.close() : this.open(); },

  render(q) {
    const hits = NovaCommandIndex.filter((i) =>
      !i.group && (!q || i.t.toLowerCase().includes(q) || i.k.includes(q)));
    this.items = hits; this.sel = 0;
    if (!hits.length) { this.listEl.innerHTML = `<div class="cmdk__empty">没有匹配「${this.escapeHtml(q)}」的结果</div>`; return; }
    const ordered = NovaCommandIndex.filter((i) => hits.includes(i));
    this.listEl.innerHTML = ordered.map((i, idx) => {
      const g = this.groupOf(i);
      const head = (g && g !== this.groupOf(ordered[idx - 1] || {}))
        ? `<div class="cmdk__group">${g}</div>` : "";
      return `${head}<button class="cmdk__item" data-idx="${idx}">
        <span class="cmdk__item-title">${this.escapeHtml(i.t)}</span>
        <span class="cmdk__item-hint">${i.h}</span></button>`;
    }).join("");
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
  move(d)    { this.sel = (this.sel + d + this.items.length) % this.items.length; this.paint(); this.scrollSel(); },
  paint()    { this.listEl.querySelectorAll(".cmdk__item").forEach((b, i) => b.dataset.selected = String(i === this.sel)); },
  scrollSel(){ const el = this.listEl.querySelector(`[data-idx="${this.sel}"]`); if (el) el.scrollIntoView({ block: "nearest" }); },
  go(item)   { this.markRecent(item); this.close(); location.href = item.u; },
  escapeHtml(s){ return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); },

  markRecent(item) {
    const rec = this.getRecent().filter((r) => r.u !== item.u);
    rec.unshift({ t: item.t, u: item.u, ts: Date.now() });
    localStorage.setItem("nova.recent", JSON.stringify(rec.slice(0, 6)));
  },
  getRecent(){ try { return JSON.parse(localStorage.getItem("nova.recent")) || []; } catch { return []; } },
};

/* —— Toast —— */
function novaToast(msg, type = "ok") {
  let zone = document.querySelector(".toast-zone");
  if (!zone) { zone = document.createElement("div"); zone.className = "toast-zone"; document.body.appendChild(zone); }
  const t = document.createElement("div");
  t.className = "toast"; t.dataset.type = type; t.textContent = msg;
  zone.appendChild(t);
  setTimeout(() => { t.classList.add("is-leaving"); setTimeout(() => t.remove(), 300); }, 3200);
}

/* —— 自检 —— */
let _errShown = false;
function novaSelfCheck() {
  /* 令牌存在性：上次 css 404 静默降级的教训 */
  const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
  if (!brand) novaToast("⚠ 设计令牌未加载：检查 css/tokens.css 路径与部署", "error");
  /* 全局脚本错误可见化 */
  window.addEventListener("error", (e) => {
    if (_errShown) return; _errShown = true;
    novaToast("脚本错误：" + (e.message || "未知"), "error");
  });
}

/* —— 启动 —— */
document.addEventListener("DOMContentLoaded", () => {
  Cmdk.init();
  novaSelfCheck();
  window.NovaCmdk = Cmdk;   /* 控制台直测入口：NovaCmdk.open() */
  console.log(`[Nova] 命令面板就绪：${HOTKEY_LABEL} 唤起；控制台可执行 NovaCmdk.open() 直测`);

  const zone = document.querySelector("[data-recent-zone]");
  if (zone) {
    const rec = Cmdk.getRecent();
    if (!rec.length) { const sec = zone.closest("section"); if (sec) sec.style.display = "none"; return; }
    zone.innerHTML = rec.map((r) =>
      `<a class="tag" href="${r.u}" style="cursor:pointer">${r.t.split("—")[0].trim()}</a>`).join("");
  }
});
