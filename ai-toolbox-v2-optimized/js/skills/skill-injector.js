/* =============================================================
 * AT Skill Injector —— 一行代码把 Skill 能力接入任意对话页
 *
 *   ATSkillInjector.attachToChat(inputEl, { chatId: 'resume' });
 *
 * 行为：输入框右上角注入 ✦ 按钮；输入框为空时按 "/" 唤起选择器；
 *       选中后按 mode 注入：'fill'（默认，填入输入框）/ 'system'（会话级 system，页面发送时读取）
 * ============================================================= */
(function (global) {
  'use strict';

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function sessionKey(chatId) { return 'at_skill_session_' + chatId; }

  /** 页面发送消息前调用：取回（一次性）会话级 system prompt */
  function getSessionSystem(chatId) {
    const raw = sessionStorage.getItem(sessionKey(chatId));
    if (!raw) return null;
    sessionStorage.removeItem(sessionKey(chatId));   // 一次性消费
    try { return JSON.parse(raw); } catch { return null; }
  }

  function attachToChat(inputEl, opts = {}) {
    if (!inputEl) return console.warn('[AT Skills] attachToChat: inputEl 不存在');
    const chatId = opts.chatId || 'default';
    const mode = opts.mode || 'fill';
    const wrap = inputEl.closest('.input-wrap') || inputEl.parentElement;
    if (!wrap) return console.warn('[AT Skills] 输入框缺少可定位父容器');
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';

    /* ✦ 按钮（AI 类按钮规范：紫色描边，hover 才填充） */
    if (!wrap.querySelector('.atsi-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'atsi-btn';
      btn.title = '选择 Skill（快捷键 /）';
      btn.setAttribute('aria-label', '选择 Skill');
      btn.innerHTML = '✦ Skill';
      btn.onclick = () => global.ATSkillPicker.open({ onSelect: apply });
      wrap.appendChild(btn);
    }

    /* "/" 快捷唤起（仅输入框为空时） */
    inputEl.addEventListener('keydown', e => {
      if (e.key === '/' && inputEl.value.trim() === '') {
        e.preventDefault();
        global.ATSkillPicker.open({ onSelect: apply });
      }
    });

    function apply({ skill, systemPrompt }) {
      if (mode === 'system') {
        sessionStorage.setItem(sessionKey(chatId),
          JSON.stringify({ name: skill.name, content: systemPrompt }));
        inputEl.placeholder = `✦ 已挂载 Skill「${skill.name}」，直接输入你的问题…`;
        inputEl.focus();
        toast(`✦ Skill「${skill.name}」已挂载本次会话`);
      } else {
        inputEl.value = `【Skill：${skill.name}】\n\n${systemPrompt}\n\n——\n\n`;
        inputEl.focus();
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        toast(`✦ Skill「${skill.name}」已填入，补充后发送`);
      }
    }
  }

  /* 轻量 Toast（紫色系 AI 样式） */
  function toast(msg) {
    let host = document.querySelector('.atsi-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'atsi-toast-host';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'atsi-toast'; t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.classList.add('is-out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }

  global.ATSkillInjector = { attachToChat, getSessionSystem, _recordUse: n => global.ATSkillStore.incrementUsage(n) };
})(window);
