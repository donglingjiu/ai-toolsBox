/**
 * workflow-schema.js — 工作流定义校验
 */
const STEP_TYPES = ['llm','transform','cond'];

function validateWorkflow(def) {
  const errs = [];
  if (!def || typeof def !== 'object') return { ok:false, errs:['def must be object'] };
  if (!def.id || !/^[a-z0-9_-]+$/.test(def.id)) errs.push('id 必填且仅含小写字母数字_-');
  if (!def.name) errs.push('name 必填');
  if (!Array.isArray(def.steps) || def.steps.length === 0) errs.push('steps 必须为非空数组');
  const ids = {};
  (def.steps||[]).forEach((s,i)=>{
    if (!s.id || ids[s.id]) errs.push('steps['+i+'].id 重复或缺失');
    ids[s.id] = 1;
    if (STEP_TYPES.indexOf(s.type) < 0) errs.push('steps['+i+'].type 非法: ' + s.type);
    if (s.type === 'llm' && !s.prompt) errs.push('steps['+i+'] llm 必须有 prompt');
    if (s.type === 'transform' && !s.from) errs.push('steps['+i+'] transform 必须有 from');
  });
  return { ok: errs.length === 0, errs: errs };
}

function validateTrace(t) {
  return !!(t && ('ts' in t) && ('wf_id' in t) && ('steps' in t));
}

if (typeof window !== 'undefined') window.WFSchema = { validateWorkflow: validateWorkflow, validateTrace: validateTrace };
if (typeof module !== 'undefined') module.exports = { validateWorkflow, validateTrace, STEP_TYPES };
