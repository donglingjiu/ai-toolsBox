/* =============================================================
 * AT Skill Store —— 双库存储层
 * builtin: 全局变量（脚本产物，随版本更新） / custom: localStorage
 * ============================================================= */
(function (global) {
  'use strict';

  const CUSTOM_KEY = 'at_skills_custom_v1';
  const USAGE_KEY  = 'at_skills_usage_v1';

  function readLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function writeLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      console.warn('[AT Skills] localStorage 写入失败，请导出备份：', e);
      return false;
    }
  }

  function builtinRaw() {
    return Array.isArray(global.AT_SKILLS_BUILTIN) ? global.AT_SKILLS_BUILTIN : [];
  }

  /** 合并双库 → 规范化数组（custom 按 name 覆盖同名 builtin） */
  function listAll() {
    const map = new Map();
    builtinRaw().forEach(s => map.set(s.name, s));
    readLS(CUSTOM_KEY, []).forEach(s => map.set(s.name, s));
    return [...map.values()].map(s => {
      const n = global.ATSkillSchema.normalizeSkill(s);
      n.usage_count = readLS(USAGE_KEY, {})[n.name] || n.usage_count || 0;
      return n;
    });
  }

  function getByName(name) {
    return listAll().find(s => s.name === String(name).toLowerCase()) || null;
  }

  /* ---- custom 库 CRUD ---- */
  function saveCustom(skill) {
    const { valid, errors, normalized } = global.ATSkillSchema.validateSkill(skill);
    if (!valid) return { ok: false, errors };
    const customs = readLS(CUSTOM_KEY, []).filter(s => s.name !== normalized.name);
    normalized.author = normalized.author === 'ai-toolbox' ? 'user' : normalized.author;
    customs.push(normalized);
    return { ok: writeLS(CUSTOM_KEY, customs), skill: normalized };
  }
  function removeCustom(name) {
    const rest = readLS(CUSTOM_KEY, []).filter(s => s.name !== String(name).toLowerCase());
    return writeLS(CUSTOM_KEY, rest);
  }

  /* ---- 使用计数（独立小键，避免频繁重写大库） ---- */
  function incrementUsage(name) {
    const usage = readLS(USAGE_KEY, {});
    usage[name] = (usage[name] || 0) + 1;
    writeLS(USAGE_KEY, usage);
  }
  function getUsage(name) { return readLS(USAGE_KEY, {})[name] || 0; }

  /* ---- 导入 / 导出 ---- */
  function exportCustom() {
    return JSON.stringify({ _format: 'at-skill-export', version: '1.0.0',
      skills: readLS(CUSTOM_KEY, []) }, null, 2);
  }
  function importJSON(text) {
    let data;
    try { data = JSON.parse(text); } catch { return { ok: false, errors: ['JSON 解析失败'] }; }
    const incoming = Array.isArray(data) ? data : (data.skills || []);
    if (!Array.isArray(incoming) || !incoming.length) return { ok: false, errors: ['未发现任何 Skill'] };
    const errors = [];
    const customs = readLS(CUSTOM_KEY, []);
    incoming.forEach((raw, i) => {
      const { valid, errors: errs, normalized } = global.ATSkillSchema.validateSkill(raw);
      if (!valid) { errors.push(`第 ${i + 1} 条：${errs.join('；')}`); return; }
      const exist = customs.findIndex(s => s.name === normalized.name);
      if (exist >= 0) customs[exist] = normalized; else customs.push(normalized);
    });
    writeLS(CUSTOM_KEY, customs);
    return { ok: errors.length === 0, imported: incoming.length - errors.length, errors };
  }

  global.ATSkillStore = { listAll, getByName, saveCustom, removeCustom,
    incrementUsage, getUsage, exportCustom, importJSON };
})(window);
