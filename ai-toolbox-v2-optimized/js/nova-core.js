/* ============================================================
   Nova core v1.2 · 命令面板 / Toast / 最近使用 / 自检
   v1.1: Mac ⌘K 加固（window 捕获 + e.code 兜底）、平台快捷键提示、
        tokens 自检、全局错误可见化、控制台测试入口
   v1.2: 三通道热键，对抗浏览器扩展（如 AI 助手侧边栏）抢键：
        ① keydown 捕获通道（主通道）
        ② keyup 兜底通道（扩展在 keydown 阶段 stopImmediatePropagation 时，
           keyup 仍会到达我们；用 _pending 标记防止双触发，替代时间戳方案）
        ③ "/" 备用键（GitHub 同款，无修饰键零冲突）
   控制台直测：NovaCmdk.open()
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
  { t: "AI 对话 — Chat 工作台", k: "chat 对话 聊天 ai 流式", u: "chat.html", h: "Chat" },
  { t: "Nova Mind · 星智 — 脑图工作室", k: "mind 脑图 思维导图 markmap 大纲 笔记 导出", u: "mind.html", h: "Mind" },
  { t: "PDF 工具箱 — 六卡合集",
    k: "pdf 合并 拆分 提取 旋转",
    u: "pdf.html", h: "PDF" },
  { t: "表格工具 — Excel/CSV",
    k: "excel 表格 csv xlsx json",
    u: "excel.html", h: "表格" },
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

/* A1 融合：Skill 灌入命令索引（延迟重试兼容加载时序，幂等） */
(function(){
  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    var skills = [];
    try{
      if (window.ATSkillStore && typeof window.ATSkillStore.listAll === 'function'){
        var a = window.ATSkillStore.listAll();
        if (Array.isArray(a)) skills = a;
      }
    }catch(e){}
    if (!skills.length && window.AT_SKILLS_BUILTIN) skills = window.AT_SKILLS_BUILTIN;
    if (skills.length){
      clearInterval(timer);
      var dup = false;
      for (var i = 0; i < NovaCommandIndex.length; i++){ if (NovaCommandIndex[i] && NovaCommandIndex[i].h === 'Skill'){ dup = true; break; } }
      if (dup) return;
      NovaCommandIndex.push({ group: 'Skill 库' });
      skills.forEach(function(s){
        var tags = Array.isArray(s.tags) ? s.tags.join(' ') : (s.tags || '');
        NovaCommandIndex.push({
          t: 'Skill · ' + (s.name || s.id || '未命名'),
          k: ((s.name || '') + ' ' + (s.description || s.desc || '') + ' ' + tags + ' skill 技能').toLowerCase(),
          u: 'skills.html',
          h: 'Skill'
        });
      });
    } else if (tries > 20){ clearInterval(timer); }
  }, 300);
})();

const Cmdk = {
  el: null, input: null, listEl: null, items: [], sel: 0,
  _pending: false,   /* v1.2: keydown 已处理标记，防 keyup 双触发 */

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

    /* —— 通道①：keydown 捕获（主通道） —— */
    window.addEventListener("keydown", (e) => {
      const k = (e.key || "").toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (k === "k" || e.code === "KeyK")) {
        e.preventDefault();
        e.stopPropagation();
        this._pending = true;          /* 标记：keydown 已由我们处理 */
        this.toggle();
        return;
      }
      /* —— 通道③："/" 备用键（非输入场景且面板未开时唤起） —— */
      if (k === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && this.el.dataset.open !== "true") {
        const a = document.activeElement;
        const typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
        if (!typing) { e.preventDefault(); this.open(); }
        return;
      }
      if (e.key === "Escape" && this.el.dataset.open === "true") this.close();
    }, true);

    /* —— 通道②：keyup 兜底（keydown 被扩展拦截时，keyup 仍会到达） —— */
    window.addEventListener("keyup", (e) => {
      const k = (e.key || "").toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (k === "k" || e.code === "KeyK")) {
        if (this._pending) { this._pending = false; return; }  /* keydown 已处理，跳过 */
        this.toggle();                                          /* keydown 被拦截，兜底触发 */
      }
    }, true);

    this.el.addEventListener("click", (e) => { if (e.target === this.el) this.close(); });
    this.input.addEventListener("input", () => this.render(this.input.value.trim().toLowerCase()));
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown")    { e.preventDefault(); this.move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); this.move(-1); }
      else if (e.key === "Enter" && this.items[this.sel]) { e.preventDefault(); this.go(this.items[this.sel]); }
    });
    document.querySelectorAll("[data-cmdk-open]").forEach((b) => b.addEventListener("click", () => this.open()));

    /* —— 按平台改写快捷键提示文案 —— */
    document.querySelectorAll(".cmdk-btn kbd").forEach((el) => (el.textContent = HOTKEY_LABEL));
    const heroBtn = document.querySelector(".hero__cta .btn--primary");
    if (heroBtn) heroBtn.textContent = IS_MAC
      ? "按 ⌘ K 或 / 唤起 Nova Command"
      : "按 Ctrl + K 或 / 唤起 Nova Command";
  },

  open()   { this.el.dataset.open = "true"; this.input.value = ""; this.render(""); this.input.focus(); },
  close()  { this.el.dataset.open = "false"; },
  toggle() { this.el.dataset.open === "true" ? this.close() : this.open(); },

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
  /* 令牌存在性：tokens.css 404 时会静默降级，这里主动报警 */
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
  window.NovaCmdk = Cmdk;   /* 控制台直测入口 */
  console.log(`[Nova] 命令面板就绪：${HOTKEY_LABEL} 或 / 唤起；控制台可执行 NovaCmdk.open() 直测`);

  const zone = document.querySelector("[data-recent-zone]");
  if (zone) {
    const rec = Cmdk.getRecent();
    if (!rec.length) { const sec = zone.closest("section"); if (sec) sec.style.display = "none"; return; }
    zone.innerHTML = rec.map((r) =>
      `<a class="tag" href="${r.u}" style="cursor:pointer">${r.t.split("—")[0].trim()}</a>`).join("");
  }
});
