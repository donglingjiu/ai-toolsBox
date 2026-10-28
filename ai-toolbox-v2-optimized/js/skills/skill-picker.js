/* =============================================================
 * AT Skill Picker —— 选择器抽屉组件
 * 用法: ATSkillPicker.open({ onSelect({skill, values, systemPrompt}) })
 * 视图状态机: LIST（浏览）→ PARAMS（填占位符）→ 确认回调
 * ============================================================= */
(function (global) {
  'use strict';

  const S = () => global.ATSkillStore, SC = () => global.ATSkillSchema;
  let root = null, state = { view: 'list', skills: [], filtered: [], cat: '全部', q: '', active: -1, skill: null };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---- 56px 内联 SVG 雷达图（五维） ---- */
  function radarSVG(q, size = 56) {
    const dims = Object.keys(SC().QUALITY_DIMENSIONS), n = dims.length;
    const cx = size / 2, cy = size / 2, r = size / 2 - 7;
    const pt = (i, ratio) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return `${(cx + Math.cos(a) * r * ratio).toFixed(1)},${(cy + Math.sin(a) * r * ratio).toFixed(1)}`;
    };
    const rings = [1 / 3, 2 / 3, 1].map(k =>
      `<polygon points="${dims.map((_, i) => pt(i, k)).join(' ')}" fill="none" stroke="rgba(43,108,176,.15)" stroke-width="1"/>`).join('');
    const poly = `<polygon points="${dims.map((d, i) => pt(i, (q?.[d] || 0) / 5)).join(' ')}"
      fill="rgba(159,122,234,.28)" stroke="var(--accent,#9F7AEA)" stroke-width="1.5"
      style="filter:drop-shadow(0 0 4px rgba(159,122,234,.4))"/>`;
    const dots = dims.map((d, i) => { const [x, y] = pt(i, (q?.[d] || 0) / 5).split(',');
      return `<circle cx="${x}" cy="${y}" r="2" fill="var(--accent,#9F7AEA)"/>`; }).join('');
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${rings}${poly}${dots}</svg>`;
  }

  /* ---- 主体骨架（只建一次） ---- */
  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'atsp-root';
    root.innerHTML = `
      <div class="atsp-mask" data-close="1"></div>
      <aside class="atsp-drawer" role="dialog" aria-label="Skill 选择器">
        <header class="atsp-head">
          <div class="atsp-title"><span class="atsp-spark">✦</span> 选择 Skill</div>
          <button class="atsp-close" data-close="1" aria-label="关闭">✕</button>
        </header>
        <div class="atsp-searchbar">
          <input class="atsp-search" type="search" placeholder="搜索名称 / 触发场景 / 标签…（Esc 关闭）"/>
        </div>
        <div class="atsp-body">
          <nav class="atsp-cats" aria-label="Skill 分类"></nav>
          <div class="atsp-list" role="listbox"></div>
          <div class="atsp-params" hidden></div>
        </div>
        <footer class="atsp-foot">
          <span class="atsp-hint">↑↓ 导航 · Enter 选中 · / 快速唤起</span>
        </footer>
      </aside>`;
    document.body.appendChild(root);
    root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    root.querySelector('.atsp-search').addEventListener('input', e => {
      state.q = e.target.value.trim().toLowerCase();
      state.cat = '全部'; state.active = -1; renderList();
    });
    root.addEventListener('keydown', onKeydown);
    return root;
  }

  /* ---- 键盘：Esc 关闭 / ↑↓ 移动 / Enter 选中 ---- */
  function onKeydown(e) {
    if (e.key === 'Escape') { if (state.view === 'params') backToList(); else close(); return; }
    if (state.view !== 'list') return;
    const items = root.querySelectorAll('.atsp-card');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      state.active = Math.min(items.length - 1, Math.max(0, state.active + (e.key === 'ArrowDown' ? 1 : -1)));
      items.forEach((el, i) => el.classList.toggle('is-active', i === state.active));
      items[state.active]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && state.active >= 0) items[state.active]?.click();
  }

  /* ---- 分类树 ---- */
  function renderCats() {
    const counts = new Map([['全部', state.skills.length]]);
    state.skills.forEach(s => counts.set(s.category, (counts.get(s.category) || 0) + 1));
    root.querySelector('.atsp-cats').innerHTML = [...counts.entries()].map(([cat, n]) =>
      `<button class="atsp-cat ${state.cat === cat ? 'is-on' : ''}" data-cat="${esc(cat)}">
         ${esc(cat)}<span class="atsp-cat-n">${n}</span></button>`).join('');
    root.querySelector('.atsp-cats').onclick = e => {
      const btn = e.target.closest('[data-cat]'); if (!btn) return;
      state.cat = btn.dataset.cat; state.active = -1; renderCats(); renderList();
    };
  }

  /* ---- 卡片流（stagger 入场 + reduced-motion 降级） ---- */
  function renderList() {
    const { q, cat } = state;
    state.filtered = state.skills.filter(s => {
      if (cat !== '全部' && s.category !== cat) return false;
      if (!q) return true;
      return [s.name, s.description, s.category, s.tags.join(' '), s.use_cases.join(' ')]
        .join(' ').toLowerCase().includes(q);
    });
    const box = root.querySelector('.atsp-list');
    if (!state.filtered.length) {
      box.innerHTML = `<div class="atsp-empty">
        <div class="atsp-empty-spark">✦</div>
        <p>没有匹配的 Skill</p>
        <p class="atsp-empty-sub">换个关键词，或等待工坊上线后自建</p></div>`;
      return;
    }
    box.innerHTML = state.filtered.map((s, i) => {
      const score = SC().overallScore(s.quality);
      const ph = SC().extractPlaceholders(s.body).length;
      return `
      <article class="atsp-card" role="option" data-idx="${i}" tabindex="0"
           style="--i:${Math.min(i, 12)}">
        <div class="atsp-card-main">
          <div class="atsp-card-top">
            <span class="atsp-badge" data-cat="${esc(s.category)}">${esc(s.category)}</span>
            ${score >= 4.5 ? '<span class="atsp-gold" title="高质量 Skill">✓ 高质量</span>' : ''}
            ${s.author === 'user' ? '<span class="atsp-mine" title="我的 Skill">我的</span>' : ''}
          </div>
          <h4 class="atsp-card-name">${esc(s.name)}</h4>
          <p class="atsp-card-desc">${esc(s.description)}</p>
          <div class="atsp-card-meta">
            <span>⭐ ${score.toFixed(1)}</span><span>▶ ${s.usage_count}</span>
            ${ph ? `<span>${ph} 个参数</span>` : ''}
            ${s.tags.slice(0, 3).map(t => `<i class="atsp-tag">#${esc(t)}</i>`).join('')}
          </div>
        </div>
        <div class="atsp-card-radar">${radarSVG(s.quality)}</div>
      </article>`;
    }).join('');
    box.onclick = e => {
      const card = e.target.closest('.atsp-card'); if (!card) return;
      choose(state.filtered[+card.dataset.idx]);
    };
  }

  /* ---- 选中 → 占位符表单（无占位符则直接确认） ---- */
  function choose(skill) {
    const phs = SC().extractPlaceholders(skill.body);
    state.skill = skill;
    if (!phs.length) return confirmSkill({});
    state.view = 'params';
    root.querySelector('.atsp-list').hidden = true;
    const paramsBox = root.querySelector('.atsp-params');
    paramsBox.hidden = false;
    paramsBox.innerHTML = `
      <button class="atsp-back">← 返回列表</button>
      <h3 class="atsp-params-title">${esc(skill.name)}</h3>
      <p class="atsp-params-desc">${esc(skill.description)}</p>
      <form class="atsp-form">
        ${phs.map(p => `
          <label class="atsp-field">
            <span class="atsp-field-name">${esc(p)}</span>
            <input name="${esc(p)}" required placeholder="请输入「${esc(p)}」"
                   autocomplete="off"/>
          </label>`).join('')}
        <div class="atsp-ai-line"><span class="atsp-spark">✦</span> 参数仅用于本地组装提示词，不额外上传</div>
        <div class="atsp-params-actions">
          <button type="button" class="atsp-btn-ghost" data-cancel>取消</button>
          <button type="submit" class="atsp-btn-ai">✦ 应用此 Skill</button>
        </div>
      </form>`;
    paramsBox.querySelector('.atsp-back').onclick = backToList;
    paramsBox.querySelector('[data-cancel]').onclick = backToList;
    paramsBox.querySelector('.atsp-form').onsubmit = e => {
      e.preventDefault();
      const values = {}; new FormData(e.target).forEach((v, k) => values[k] = v.trim());
      confirmSkill(values);
    };
    paramsBox.querySelector('input')?.focus();
  }

  function backToList() {
    state.view = 'list';
    root.querySelector('.atsp-params').hidden = true;
    root.querySelector('.atsp-list').hidden = false;
    root.querySelector('.atsp-search').focus();
  }

  function confirmSkill(values) {
    const skill = state.skill;
    const systemPrompt = skill.body.replace(/\{\{\s*([^}]+?)\s*\}\}/g,
      (_, k) => values[k] ?? `「${k}」`);
    global.ATSkillInjector._recordUse(skill.name);
    const cb = state.onSelect;
    close();
    cb && cb({ skill, values, systemPrompt });
  }

  /* ---- 开放 API ---- */
  function open(opts = {}) {
    state = { view: 'list', skills: S().listAll(), filtered: [], cat: '全部', q: '', active: -1, onSelect: opts.onSelect || null };
    if (!state.skills.length) { alert('Skill 库为空：请先运行迁移脚本生成 skills-builtin.data.js'); return; }
    const r = ensureRoot();
    backToList();
    renderCats(); renderList();
    r.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    const mq = matchMedia('(max-width: 768px)');
    r.classList.toggle('is-mobile', mq.matches);
    r.querySelector('.atsp-search').focus();
  }
  function close() {
    if (!root) return;
    root.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }

  global.ATSkillPicker = { open, close, radarSVG };
})(window);
