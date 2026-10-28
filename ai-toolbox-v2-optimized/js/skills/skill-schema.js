/* =============================================================
 * AT Skill Schema v1 —— 全站 Skill 数据结构标准
 * 依据 SKILL.md 规范：YAML frontmatter 字段 + 六段式正文
 * ============================================================= */
(function (global) {
  'use strict';

  const SCHEMA_VERSION = '1.0.0';

  /* 正文六段（迁移与工坊均按此结构校验） */
  const BODY_SECTIONS = ['角色', '操作步骤', '输入参数', '输出格式', '示例', '边界约束'];

  /* 质量雷达五维度（权重合计 100%） */
  const QUALITY_DIMENSIONS = {
    role_clarity:   { label: '角色清晰度', weight: 0.20 },
    constraints:    { label: '约束完整度', weight: 0.25 },
    verifiable:    { label: '输出可验证', weight: 0.20 },
    examples:       { label: '示例质量',   weight: 0.15 },
    boundary:       { label: '边界安全',   weight: 0.20 },
  };

  const VALID_EXPERTS = ['none', 'web-delivery-director', 'product-expert-team', 'frontend-builder', 'autodev'];

  /** 规范化：补默认值、修剪字符串、校验 name 格式 */
  function normalizeSkill(raw) {
    const s = Object.assign({}, raw);
    s.name        = String(s.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    s.description = String(s.description || '').trim();
    s.category    = String(s.category || '未分类').trim();
    s.version     = String(s.version || '1.0.0');
    s.author      = String(s.author || 'user');
    s.tags        = Array.isArray(s.tags) ? s.tags.map(t => String(t).trim()).filter(Boolean) : [];
    s.use_cases   = Array.isArray(s.use_cases) ? s.use_cases.map(t => String(t).trim()).filter(Boolean) : [];
    s.expert_injection = VALID_EXPERTS.includes(s.expert_injection) ? s.expert_injection : 'none';
    s.quality     = normalizeQuality(s.quality);
    s.usage_count = Number.isFinite(+s.usage_count) ? Math.max(0, +s.usage_count | 0) : 0;
    s.created_at  = s.created_at || new Date().toISOString().slice(0, 10);
    s.body        = String(s.body || '').trim();
    return s;
  }

  function normalizeQuality(q) {
    const out = {};
    Object.keys(QUALITY_DIMENSIONS).forEach(k => {
      let v = Number(q && q[k]);
      if (!Number.isFinite(v)) v = 0;
      out[k] = Math.min(5, Math.max(0, Math.round(v * 10) / 10));
    });
    return out;
  }

  /** 校验器：返回 { valid, errors[] }，errors 为人类可读中文 */
  function validateSkill(skill) {
    const s = normalizeSkill(skill);
    const errors = [];
    if (!s.name) errors.push('name 不能为空');
    else if (!/^[a-z0-9][a-z0-9-]*$/.test(s.name)) errors.push('name 必须为小写字母/数字/连字符');
    if (s.description.length < 15) errors.push('description 过短（<15 字），必须包含明确触发场景');
    if (!s.body) errors.push('正文 body 不能为空');
    else {
      if (!/^##\s*角色/m.test(s.body) && !/^#\s*角色/m.test(s.body)) errors.push('缺少「角色」段');
      if (!/^##\s*(边界约束|操作步骤)/m.test(s.body)) errors.push('缺少「边界约束」或「操作步骤」段');
    }
    const dimEmpty = Object.keys(QUALITY_DIMENSIONS).every(k => !(s.quality[k] > 0));
    if (dimEmpty) errors.push('质量五维度均为 0，需先过质量评估');
    return { valid: errors.length === 0, errors, normalized: s };
  }

  /** 综合质量分（加权 0~5） */
  function overallScore(quality) {
    let sum = 0, w = 0;
    Object.entries(QUALITY_DIMENSIONS).forEach(([k, d]) => {
      sum += (quality?.[k] || 0) * d.weight; w += d.weight;
    });
    return Math.round((sum / w) * 10) / 10;
  }

  /** 从正文中提取 {{占位符}}（去重、保持出现顺序） */
  function extractPlaceholders(body) {
    const seen = new Set(), out = [];
    const re = /\{\{\s*([^}]+?)\s*\}\}/g; let m;
    while ((m = re.exec(body || ''))) {
      if (!seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
    }
    return out;
  }

  global.ATSkillSchema = {
    SCHEMA_VERSION, BODY_SECTIONS, QUALITY_DIMENSIONS, VALID_EXPERTS,
    normalizeSkill, validateSkill, overallScore, extractPlaceholders,
  };
})(window);
