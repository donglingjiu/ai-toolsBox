/**
 * flow-trace.js — 任务链轨迹日志（追加式，上限5MB自动压缩最旧50%）
 */
const TRACE_KEY = 'wf_traces';
const TRACE_MAX = 5*1024*1024;

function appendTrace(entry) {
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem(TRACE_KEY)||'[]'); } catch(e){}
  logs.push(Object.assign({ ts:new Date().toISOString() }, entry));
  let raw = JSON.stringify(logs);
  if (raw.length > TRACE_MAX) {
    logs = logs.slice(Math.floor(logs.length/2));
    raw = JSON.stringify(logs);
  }
  try { localStorage.setItem(TRACE_KEY, raw); } catch(e){ console.warn('trace persist fail', e); }
  return logs.length;
}

function listTraces(wfId) {
  try {
    const logs = JSON.parse(localStorage.getItem(TRACE_KEY)||'[]');
    return wfId ? logs.filter(function(t){return t.wf_id===wfId;}) : logs;
  } catch(e){ return []; }
}

function exportTraces() {
  const blob = new Blob([JSON.stringify(listTraces(),null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'wf-traces-' + Date.now() + '.jsonl';
  a.click();
}

if (typeof window !== 'undefined') window.FlowTrace = { appendTrace, listTraces, exportTraces };
if (typeof module !== 'undefined') module.exports = { appendTrace, listTraces, exportTraces };
