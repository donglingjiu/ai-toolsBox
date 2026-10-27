/* ============================================================
   Nova Flow v1.0 · 五阶段 AI 交付流水线（需求→调研→方案→代码→评审）
   复用 flow-prompts.js：FLOW_STAGES / FLOW_TEAMS（提示词与图谱）
   复用 app.js：llmChat（多Profile故障切换+流式）/ llmReady /
   getActiveProfile / mdRender / downloadText
   新增仅：接力编排 + 流式渲染 + 中止 + localStorage 断点续跑
   ============================================================ */
"use strict";

const $d = (s) => document.querySelector(s);
const ARTIFACT = ["需求分析文档", "技术调研报告", "技术方案", "代码实现包", "交付评审报告"];
const STORE_KEY = "nova-flow-state-v1";

const State = { stage: 0, requirement: "", inputs: {}, outputs: {}, status: {} };
let Ctrl = null, Running = false, StopAll = false;

/* ---------- 持久化 ---------- */
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(State)); } catch {}
}
function loadState() {
  try { Object.assign(State, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); } catch {}
}

/* ---------- 接力编排：阶段 N 的 user 消息 ---------- */
function buildUserMessage(idx) {
  const extra = (State.inputs[FLOW_STAGES[idx].key] || "").trim();
  if (idx === 0) return extra ? State.requirement + "\n\n【补充说明】\n" + extra : State.requirement;
  const parts = [];
  for (let k = 0; k < idx; k++) {
    const out = State.outputs[FLOW_STAGES[k].key];
    if (out && out.text) parts.push(`《${ARTIFACT[k]}》\n\n${out.text}`);
  }
  if (extra) parts.push(`【本阶段补充要求】\n${extra}`);
  return parts.join("\n\n---\n\n");
}

/* ---------- 执行一个阶段 ---------- */
async function runStage(idx) {
  if (!window.llmChat || !llmReady()) { $d("#api-banner").hidden = false; novaToast("请先配置模型 API", "error"); return false; }
  if (idx === 0 && !State.requirement.trim()) { novaToast("请先填写产品需求描述", "error"); return false; }

  const st = FLOW_STAGES[idx];
  State.status[st.key] = "run"; Running = true; StopAll = false;
  $d("#stop-btn").disabled = false;
  Ctrl = new AbortController();
  selectStage(idx, true);
  paintRail();

  State.outputs[st.key] = State.outputs[st.key] || { text: "", ts: 0 };
  const box = $d("#out-box");
  let full = "", lastPaint = 0;

  try {
    full = await llmChat(
      [{ role: "system", content: st.system }, { role: "user", content: buildUserMessage(idx) }],
      {
        temperature: 0.7,
        signal: Ctrl.signal,
        onDelta: (d, f) => {
          full = f;
          const now = Date.now();
          if (now - lastPaint > 80) { lastPaint = now; box.innerHTML = mdRender(full); box.scrollTop = box.scrollHeight; }
        },
      }
    );
    State.outputs[st.key] = { text: full, ts: Date.now() };
    State.status[st.key] = "done";
    if (idx < FLOW_STAGES.length - 1) { State.stage = idx + 1; selectStage(idx + 1, true); }
    novaToast(`✅ ${st.name} 完成`);
  } catch (e) {
    if (e && e.name === "AbortError") {
      State.outputs[st.key] = { text: full, ts: Date.now() };
      State.status[st.key] = full ? "fail" : "pending";
      novaToast(full ? "已停止（保留部分输出，可重跑覆盖）" : "已停止", "warn");
    } else {
      State.status[st.key] = "fail";
      State.outputs[st.key] = { text: (State.outputs[st.key] && State.outputs[st.key].text) || "", ts: 0 };
      box.innerHTML = `<p style="color:#FF6B81">❌ ${st.name} 失败：${String(e.message || e)}</p>`;
      novaToast("❌ " + st.name + " 失败", "error");
    }
  }
  State.outputs[st.key] && (State.outputs[st.key].text = full || (State.outputs[st.key].text || ""));
  saveState(); Running = false; Ctrl = null;
  $d("#stop-btn").disabled = true;
  paintRail(); paintOut(); paintProgress();
  return State.status[st.key] === "done";
}

/* ---------- 渲染 ---------- */
const ST_LABEL = { pending: "待执行", run: "生成中…", done: "✓ 完成", fail: "✗ 失败" };
function paintRail() {
  $d("#rail-list").innerHTML = FLOW_STAGES.map((s, i) => {
    const stat = State.status[s.key] || "pending";
    return `<div class="stage-item ${i === State.stage ? "on" : ""} ${stat}" data-stage="${i}" role="button" tabindex="0" aria-label="${s.name}">
      <span class="ic">${s.icon}</span>
      <span><div class="nm">${i + 1}. ${s.name}</div><div class="tm">${s.teamName}</div></span>
      <span class="st">${ST_LABEL[stat] || stat}</span>
    </div>`;
  }).join("");
}
function paintTeams() {
  $d("#teams-box").innerHTML = FLOW_TEAMS.map((t) =>
    `<div class="teamcard"><div class="hd">${t.icon} ${t.name}</div><div class="ds">${t.desc}</div>
     <div class="mb">${t.members.map((m) => `<b>${m.n}</b>·${m.d}`).join("<br>")}</div></div>`).join("");
}
function paintProgress() {
  const done = FLOW_STAGES.filter((s) => State.status[s.key] === "done").length;
  $d("#flow-progress").textContent = `${done}/${FLOW_STAGES.length} 阶段完成`;
}
function paintOut() {
  const st = FLOW_STAGES[State.stage];
  const out = State.outputs[st.key];
  $d("#out-title").textContent = `《${ARTIFACT[State.stage]}》`;
  $d("#out-meta").textContent = out && out.ts ? `更新于 ${new Date(out.ts).toLocaleString()} · ${out.text.length} 字` : "尚未生成";
  $d("#out-box").innerHTML = out && out.text ? mdRender(out.text) : "";
}
function paintInput() {
  const st = FLOW_STAGES[State.stage];
  $d("#in-label").textContent = st.inputLabel + "（可留空）";
  $d("#stage-input").value = State.inputs[st.key] || "";
  $d("#stage-input").placeholder = st.inputPh;
  $d("#req-group").style.display = State.stage === 0 ? "flex" : "none";
  $d("#stage-title").textContent = `${st.icon} ${st.name} · ${st.teamName}`;
  $d("#in-hint").textContent = State.stage === 0 ? "需求描述是全流程输入；执行后自动接力下一阶段" : "将自动携带前面全部产物作为上下文";
}
function selectStage(idx, force) {
  if (Running && !force) { novaToast("生成中，请先停止", "warn"); return; }
  State.stage = idx; saveState();
  paintRail(); paintInput(); paintOut();
}

/* ---------- 导出 ---------- */
function allMarkdown() {
  const head = `# Nova Flow 交付流水线产物\n\n需求：${State.requirement}\n\n导出时间：${new Date().toLocaleString()}\n\n`;
  const body = FLOW_STAGES.map((s, i) => {
    const o = State.outputs[s.key];
    return o && o.text ? `\n\n---\n\n# 第 ${i + 1} 阶段 · ${s.name}（${s.teamName}）\n\n${o.text}` : "";
  }).join("");
  return head + body;
}

/* ---------- 事件 ---------- */
function initFlow() {
  loadState();
  const ready = window.llmReady && llmReady();
  $d("#api-banner").hidden = ready;
  const p = window.getActiveProfile && getActiveProfile();
  $d("#model-badge").textContent = p ? `模型：${p.model} · ${p.name}` : "模型：未配置";

  paintRail(); paintTeams(); paintProgress(); paintInput(); paintOut();
  $d("#requirement").value = State.requirement || "";
  $d("#requirement").addEventListener("input", (e) => { State.requirement = e.target.value; saveState(); });
  $d("#stage-input").addEventListener("input", (e) => { State.inputs[FLOW_STAGES[State.stage].key] = e.target.value; saveState(); });

  $d("#rail-list").addEventListener("click", (e) => {
    const it = e.target.closest("[data-stage]");
    if (it) selectStage(+it.dataset.stage);
  });

  $d("#run-stage").addEventListener("click", () => runStage(State.stage));
  $d("#run-all").addEventListener("click", async () => {
    if (!State.requirement.trim()) { novaToast("请先填写产品需求描述", "error"); selectStage(0); return; }
    for (let i = 0; i < FLOW_STAGES.length; i++) {
      if (StopAll) break;
      if (State.status[FLOW_STAGES[i].key] === "done") continue;
      const ok = await runStage(i);
      if (!ok) break;
    }
  });
  $d("#stop-btn").addEventListener("click", () => { StopAll = true; if (Ctrl) Ctrl.abort(); });

  $d("#copy-out").addEventListener("click", async () => {
    const o = State.outputs[FLOW_STAGES[State.stage].key];
    if (!o || !o.text) { novaToast("暂无产物可复制", "error"); return; }
    try { await navigator.clipboard.writeText(o.text); novaToast("✅ 已复制到剪贴板"); }
    catch { novaToast("复制失败：浏览器未授权剪贴板", "error"); }
  });
  $d("#dl-out").addEventListener("click", () => {
    const o = State.outputs[FLOW_STAGES[State.stage].key];
    if (!o || !o.text) { novaToast("暂无产物可下载", "error"); return; }
    downloadText(`${ARTIFACT[State.stage]}.md`, o.text, "text/markdown;charset=utf-8");
  });
  $d("#dl-all").addEventListener("click", () => {
    const md = allMarkdown();
    if (!State.outputs[FLOW_STAGES[0].key] || !State.outputs[FLOW_STAGES[0].key].text) { novaToast("至少完成第一阶段后再导出", "error"); return; }
    downloadText(`NovaFlow-全流程产物.md`, md, "text/markdown;charset=utf-8");
  });
}

document.addEventListener("DOMContentLoaded", initFlow);
