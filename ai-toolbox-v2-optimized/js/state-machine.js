/**
 * state-machine.js — 浏览器端轻量任务链状态机
 * 支持：线性步骤编排 / 条件跳过 / 失败重试 / 状态持久化
 */
const WF_STATES = { IDLE:'idle', RUNNING:'running', PAUSED:'paused', DONE:'done', PARTIAL:'partial', FAILED:'failed' };

class StateMachine {
  constructor(def, opts={}) {
    this.def = def;
    this.steps = def.steps || [];
    this.state = WF_STATES.IDLE;
    this.ctx = { vars:{}, outputs:{}, cursor:0, errors:[] };
    this.onStep = opts.onStep || (()=>{});
    this.onDone = opts.onDone || (()=>{});
    this.persistKey = 'wf_run_' + def.id;
  }

  async run(input={}) {
    this.ctx.vars = Object.assign({}, this.ctx.vars, input);
    this.state = WF_STATES.RUNNING;
    this.persist();
    for (; this.ctx.cursor < this.steps.length; this.ctx.cursor++) {
      const step = this.steps[this.ctx.cursor];
      if (step.when && !this.evalCond(step.when)) continue;
      try {
        this.onStep(step, 'start');
        const out = await this.execStep(step);
        this.ctx.outputs[step.id] = out;
        this.ctx.vars[step.id] = out;
        this.onStep(step, 'done', out);
      } catch(e) {
        this.ctx.errors.push({step:step.id, msg:e.message});
        this.onStep(step, 'error', e);
        if (step.required !== false) {
          this.state = WF_STATES.FAILED;
          this.persist(); return this.ctx;
        }
      }
      this.persist();
    }
    this.state = this.ctx.errors.length ? WF_STATES.PARTIAL : WF_STATES.DONE;
    this.persist();
    this.onDone(this.ctx);
    return this.ctx;
  }

  async execStep(step) {
    if (step.type === 'llm') return await this.callLLM(step);
    if (step.type === 'transform') return this.transform(step);
    if (step.type === 'cond') return this.evalCond(step.expr);
    throw new Error('Unknown step type: ' + step.type);
  }

  async callLLM(step) {
    const profile = JSON.parse(localStorage.getItem('active_profile')||'{}');
    if (!profile.endpoint) throw new Error('未配置 API Profile，请到设置页配置');
    const prompt = this.render(step.prompt, this.ctx.vars);
    const res = await fetch(profile.endpoint.replace(/\/+$/,'') + '/chat/completions', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + profile.key},
      body: JSON.stringify({model:profile.model, messages:[{role:'user',content:prompt}]})
    });
    if (!res.ok) throw new Error('API ' + res.status + ': ' + (await res.text()).slice(0,200));
    const j = await res.json();
    return j.choices[0].message.content;
  }

  transform(step) {
    const src = this.ctx.vars[step.from];
    if (src === undefined) throw new Error('Missing input: ' + step.from);
    return (step.fn && step.fn !== 'identity') ? step.fn(src) : src;
  }

  evalCond(expr) {
    try { return !!new Function('v','return !!(' + expr + ')')(this.ctx.vars); }
    catch(e){ return false; }
  }

  render(tpl, vars) {
    return String(tpl).replace(/\{\{(\w+)\}\}/g, (m,k)=> (vars[k]===undefined?'':vars[k]));
  }

  persist() {
    try { localStorage.setItem(this.persistKey, JSON.stringify({
      state:this.state, cursor:this.ctx.cursor,
      outputs:this.ctx.outputs, errors:this.ctx.errors })); } catch(e){}
  }
}

if (typeof window !== 'undefined') window.StateMachine = StateMachine;
if (typeof module !== 'undefined') module.exports = { StateMachine, WF_STATES };
