/**
 * gate-scorer.js — web-delivery-team 阶段门量化评分器
 * 用法：Post-Hook 在每阶段完成后调用 scoreGate(gateId, metrics)
 */
const GATE_CONFIG = {
  G1: { dimensions: [{ key: 'req_completeness', weight: 1.0 }], threshold: 70 },
  G2: { dimensions: [
    { key: 'prd_coverage',    weight: 0.6 },
    { key: 'user_confirmed',  weight: 0.4 }
  ], threshold: 75 },
  G3: { dimensions: [
    { key: 'token_coverage',  weight: 0.5 },
    { key: 'page_list_ready', weight: 0.5 }
  ], threshold: 80 },
  G4: { dimensions: [
    { key: 'lint_pass_rate',  weight: 0.3 },
    { key: 'test_pass_rate',  weight: 0.4 },
    { key: 'design_fidelity', weight: 0.3 }
  ], threshold: 80 },
  G6: { dimensions: [
    { key: 'qa_pass_rate',     weight: 0.7 },
    { key: 'agentic_redline',  weight: 0.3 }
  ], threshold: 90 },
  G7: { dimensions: [{ key: 'deploy_success', weight: 1.0 }], threshold: 100 }
};

function scoreGate(gateId, metrics) {
  const cfg = GATE_CONFIG[gateId];
  if (!cfg) throw new Error(`Unknown gate: ${gateId}`);
  let total = 0;
  const detail = {};
  for (const dim of cfg.dimensions) {
    const val = metrics[dim.key];
    if (typeof val !== 'number' || val < 0 || val > 100) {
      throw new Error(`Invalid metric ${dim.key}: ${val}`);
    }
    const weighted = val * dim.weight;
    detail[dim.key] = { raw: val, weighted };
    total += weighted;
  }
  return {
    gate: gateId,
    score: Math.round(total * 10) / 10,
    threshold: cfg.threshold,
    passed: total >= cfg.threshold,
    detail
  };
}

if (typeof module !== 'undefined') module.exports = { scoreGate, GATE_CONFIG };
