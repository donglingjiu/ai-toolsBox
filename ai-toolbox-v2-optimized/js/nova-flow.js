/* Nova Flow v1.3 自包含版：编排数据内联，不依赖 flow-prompts.js；无 emoji，终端粘贴安全 */
"use strict";

const NF_TEAMS = window.FLOW_TEAMS || [
  { key: "product", name: "产品专家团", desc: "需求分析 / PRD / 优先级", members: [
    { n: "CEO 中枢", d: "任务分派与流转" },
    { n: "产品发现专家", d: "创意 / 假设识别 / 反馈分析" },
    { n: "产品战略专家", d: "SWOT / 商业模式" },
    { n: "市场研究专家", d: "竞品 / 测算 / 用户画像" },
    { n: "执行专家", d: "PRD / 用户故事 / Sprint 计划" },
    { n: "营销增长专家", d: "定位 / 北极星指标" } ] },
  { key: "research", name: "技术调研专家团", desc: "选型 / PoC / 红队校验", members: [
    { n: "调研总监", d: "问题拆解 / 编排 / 最终判断" },
    { n: "信息侦察员", d: "多源广搜 / 来源与可信度标注" },
    { n: "方案分析师", d: "对比矩阵 / trade-off" },
    { n: "红队质疑官", d: "七点质疑 / 分级" },
    { n: "PoC 执行官", d: "隔离环境验证" },
    { n: "报告书记员", d: "报告排版与归档" } ] },
  { key: "autodev", name: "AutoDev 开发小队", desc: "需求到开发到验证到交付", members: [
    { n: "流程编排", d: "入参校验 / 派发调度" },
    { n: "Skill 构建师", d: "采访固化开发与验证流程" },
    { n: "自主开发执行", d: "按 Skill 开发并给 PASS/FAIL 证据" },
    { n: "Skill 升级师", d: "流程迭代维护" } ] },
  { key: "review", name: "长文审阅专家团", desc: "审阅网页 / 批注回收", members: [
    { n: "审阅页制作官", d: "目录锚点 / 划词批注 / 批注导出" } ] },
];

const NF_STAGES = window.FLOW_STAGES || [
  {
    key: "prd", name: "需求分析", team: "product", teamName: "产品专家团",
    inputLabel: "产品需求描述", inputPh: "例如：给内部团队做一个周报自动汇总工具，能从群聊拉取消息、按人汇总、生成周报页面",
    system: "你是资深产品专家，融合「产品发现」与「执行落地」双职能（假设识别、机会梳理、PRD 撰写）。基于用户的需求描述产出《需求分析文档》，用 Markdown，结构如下：\n## 1. 问题定义（解决什么问题、给谁解决、为什么是现在）\n## 2. 目标与关键结果（SMART，最多 3 条）\n## 3. 目标用户与核心场景（最多 3 个场景，每个含触发条件与期望结果）\n## 4. 核心假设与风险（按「若此假设错误则后果如何」标注 高/中/低，最多 5 条）\n## 5. 解决方案概要（关键功能列表，用 MoSCoW 标注 Must/Should/Could/Wont）\n## 6. 成功指标（可量化）\n## 7. 范围边界（本期明确不做什么）\n要求：对模糊表述给出合理默认假设并标注「假设」；量化优先，能用数字不用形容词；全文不超过 1200 字；只输出文档本身，不要开场白。"
  },
  {
    key: "research", name: "技术调研", team: "research", teamName: "技术调研专家团",
    inputLabel: "补充约束（已选技术栈 / 规模 / 预算等）", inputPh: "例如：团队只熟 Python；日活预计 500 以内；希望两周内上线",
    system: "你是技术调研总监，一人融合三重专业视角：信息侦察员（多源信息、标注来源与可信度、禁止无依据断言）、方案分析师（量化对比矩阵、trade-off）、红队质疑官（对抗性质疑）。基于《需求分析文档》与用户补充约束，产出《技术调研报告》，用 Markdown，结构如下：\n## 1. 候选方案全景（至少 3 个，含一句话定位；基于通用工程知识给出，标注「需上线前核实」处）\n## 2. 对比矩阵（自选 4-6 个与需求匹配的评估维度，逐项 1-5 打分加一句话依据，附总分）\n## 3. Trade-off 分析（每个候选的得与失，各不超过 3 条）\n## 4. 红队质疑（对初步倾向做 7 点检查：假设检验/数据质量/逻辑链/遗漏视角/极端场景/时间维度/反例；每条标注【致命】【重要】【轻微】；方式；分析确实严谨就明确说未发现实质性问题，不强行凑数）\n## 5. 最终推荐（格式必须是「推荐 X，因为 Y」；给出信心水平 高/中/低加理由加风险提示加下一步动作）\n要求：量化优先；不编造具体版本号与性能数字；只输出报告本身。"
  },
  {
    key: "design", name: "方案设计", team: "autodev", teamName: "AutoDev 开发小队",
    inputLabel: "方案偏好", inputPh: "例如：单体优先不要微服务；前端用原生 HTML；数据库用 SQLite",
    system: "你是资深架构师。基于《需求分析文档》与《技术调研报告》（含最终推荐），产出《技术方案》，用 Markdown，结构如下：\n## 1. 架构总览（Mermaid 图：flowchart 语法，组件加数据流；节点命名与下文模块拆解一致）\n## 2. 技术选型清单（表：层 / 选型 / 理由一句话）\n## 3. 模块拆解（每个模块：职责 / 输入 / 输出 / 依赖；模块边界要能独立验证）\n## 4. 关键接口与数据契约（核心 API 或数据结构的定义，用代码块）\n## 5. 里程碑计划（M1/M2/M3，每个含范围与可验收标准）\n## 6. 风险与预案（pre-mortem 视角：假设三个月后项目失败了，回看最可能的 3 个原因，各配预案）\n要求：方案要能直接指导编码，不留模糊空间；只输出方案本身。"
  },
  {
    key: "code", name: "代码实现", team: "autodev", teamName: "AutoDev 开发小队",
    inputLabel: "实现偏好", inputPh: "例如：先只实现 M1 范围；代码注释用中文",
    system: "你是自主开发执行工程师（AutoDev Runner），唯一职责：忠实执行《技术方案》，不做方案之外的事。产出《代码实现包》，用 Markdown，结构如下：\n## 1. 目录结构（代码块内的树形图）\n## 2. 核心模块代码（方案中最核心的 1-2 个模块，完整可运行的代码，语言与选型一致；注释标注关键决策点；每段代码用三个反引号加语言名标注）\n## 3. 其余模块实现要点（每个模块一段话：逻辑骨架加注意事项）\n## 4. 验证清单（表格：验证项 / 具体命令或操作步骤 / 预期 PASS 表现；覆盖静态检查加核心功能路径加一个边界情况）\n## 5. 与方案的偏差说明（如有偏差说明原因；没有就写「无偏差」）\n要求：代码收敛在需求范围内，遵循方案的接口契约；只输出实现包本身。"
  },
  {
    key: "review", name: "交付评审", team: "review", teamName: "长文审阅专家团",
    inputLabel: "评审关注点", inputPh: "例如：重点关注安全性；下周要给管理层演示",
    system: "你是交付评审官，融合「红队质疑官」与「长文审阅制作官」双职能。审阅前四段全部产物（需求、调研、方案、代码），产出《项目交付总文档》，用 Markdown，结构如下：\n## 1. 完整性核对（需求到方案到代码链路逐环核对：需求的功能点是否都被方案覆盖、方案模块是否都有实现说明、验证清单是否能证明需求达成；列出缺口）\n## 2. 问题清单（每条标注【阻塞】【建议】【记录】；含所在阶段、问题描述、具体修正建议；不强行凑问题，确实严谨就写「未发现阻塞问题」）\n## 3. 交付就绪度评分（0-100，四个维度各 25 分：功能完整性 / 可验证性 / 文档质量 / 风险可控，给出各维度得分与扣分理由）\n## 4. 上线前 checklist（不超过 10 项，每项可勾选验证）\n## 5. 结论（可交付 / 有条件交付（列条件）/ 需返工）\n对事不对人；只输出报告本身。"
  },
];

/* ---------- 运行时 ---------- */
const $d = (s) => document.querySelector(s);
const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const ARTIFACT = ["需求分析文档","技术调研报告","技术方案","代码实现包","项目交付总文档"];
const STORE_KEY = "nova-flow-state-v2";
const State = { stage:0, requirement:"", inputs:{}, outputs:{}, status:{} };
let Ctrl = null, Running = false, StopAll = false;

function saveState(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(State)); }catch(e){} }
function loadState(){ try{ Object.assign(State, JSON.parse(localStorage.getItem(STORE_KEY)||"{}")); }catch(e){} }

function buildUserMessage(i){
  const extra = (State.inputs[NF_STAGES[i].key]||"").trim();
  if(i===0) return extra ? State.requirement+"\n\n【补充说明】\n"+extra : State.requirement;
  const parts=[];
  for(let k=0;k<i;k++){ const o=State.outputs[NF_STAGES[k].key]; if(o&&o.text) parts.push("《"+ARTIFACT[k]+"》\n\n"+o.text); }
  if(extra) parts.push("【本阶段补充要求】\n"+extra);
  return parts.join("\n\n---\n\n");
}

async function runStage(idx){
  if(!window.llmChat||!llmReady()){ $d("#api-banner").hidden=false; novaToast("请先配置模型 API","error"); return false; }
  if(idx===0&&!State.requirement.trim()){ novaToast("请先填写产品需求描述","error"); return false; }
  const st=NF_STAGES[idx];
  State.status[st.key]="run"; Running=true; StopAll=false;
  $d("#stop-btn").disabled=false;
  Ctrl=new AbortController();
  selectStage(idx,true); paintRail();
  const box=$d("#out-box"); let full="",lastPaint=0;
  try{
    function dateLine(){
      var d=new Date();
      var ds=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
      return '\n\n[\u7cfb\u7edf\u65e5\u671f] \u4eca\u5929\u662f '+ds+' \uff08\u771f\u5b9e\u5f53\u524d\u65e5\u671f\uff09\u3002\u6587\u6863\u5143\u6570\u636e\u3001\u9875\u7709\u3001\u843d\u6b3e\u5904\u7684\u751f\u6210\u65e5\u671f\u5fc5\u987b\u4f7f\u7528\u6b64\u65e5\u671f\uff0c\u7981\u6b62\u4f7f\u7528\u8bad\u7ec3\u6570\u636e\u4e2d\u7684\u65e7\u65e5\u671f\u3002';
    }
    full=await llmChat(
      [{role:"system",content:st.system},{role:"user",content:buildUserMessage(idx)+dateLine()}],
      { temperature:0.7, signal:Ctrl.signal,
        onDelta:(d,f)=>{ full=f; const n=Date.now(); if(n-lastPaint>80){ lastPaint=n; box.innerHTML=mdRender(full); box.scrollTop=box.scrollHeight; } } }
    );
    State.outputs[st.key]={text:full,ts:Date.now()};
    State.status[st.key]="done";
    if(idx<NF_STAGES.length-1){ State.stage=idx+1; selectStage(idx+1,true); }
    novaToast(st.name+" 完成");
  }catch(e){
    if(e&&e.name==="AbortError"){
      if(full) State.outputs[st.key]={text:full,ts:Date.now()};
      State.status[st.key]=full?"fail":"pending";
      novaToast("已停止"+(full?"（保留部分输出，可重跑覆盖）":""),"warn");
    }else{
      State.status[st.key]="fail";
      box.innerHTML='<p style="color:#FF6B81">失败：'+escH(String((e&&e.message)||e))+'</p>';
      novaToast(st.name+" 失败","error");
    }
  }
  saveState(); Running=false; Ctrl=null; $d("#stop-btn").disabled=true;
  paintRail(); paintOut(); paintProgress();
  return State.status[st.key]==="done";
}

const ST_LABEL={pending:"待执行",run:"生成中",done:"完成",fail:"失败"};
function paintRail(){
  $d("#rail-list").innerHTML=NF_STAGES.map((s,i)=>{
    const stat=State.status[s.key]||"pending";
    return '<div class="stage-item '+(i===State.stage?"on ":"")+stat+'" data-stage="'+i+'" role="button" tabindex="0">'
      +'<span class="ic">'+(i+1)+'</span><span><div class="nm">'+(i+1)+'. '+escH(s.name)+'</div><div class="tm">'+escH(s.teamName)+'</div></span>'
      +'<span class="st">'+ST_LABEL[stat]+'</span></div>';
  }).join("");
}
function paintTeams(){
  $d("#teams-box").innerHTML=NF_TEAMS.map((t)=>
    '<div class="teamcard"><div class="hd">'+escH(t.name)+'</div><div class="ds">'+escH(t.desc)+'</div>'
    +'<div class="mb">'+t.members.map((m)=>"<b>"+escH(m.n)+"</b>·"+escH(m.d)).join("<br>")+'</div></div>').join("");
}
function paintProgress(){
  const done=NF_STAGES.filter((s)=>State.status[s.key]==="done").length;
  $d("#flow-progress").textContent=done+"/"+NF_STAGES.length+" 阶段完成";
}
function paintOut(){
  const st=NF_STAGES[State.stage],out=State.outputs[st.key];
  $d("#out-title").textContent="《"+ARTIFACT[State.stage]+"》";
  $d("#out-meta").textContent=out&&out.ts?"更新于 "+new Date(out.ts).toLocaleString()+" · "+out.text.length+" 字":"尚未生成";
  $d("#out-box").innerHTML=out&&out.text?mdRender(out.text):"";
}
function paintInput(){
  const st=NF_STAGES[State.stage];
  $d("#in-label").textContent=st.inputLabel+"（可留空）";
  $d("#stage-input").value=State.inputs[st.key]||"";
  $d("#stage-input").placeholder=st.inputPh;
  $d("#req-group").style.display=State.stage===0?"flex":"none";
  $d("#stage-title").textContent=(State.stage+1)+". "+st.name+" · "+st.teamName;
  $d("#in-hint").textContent=State.stage===0?"需求描述是全流程输入；执行后自动接力下一阶段":"将自动携带前面全部产物作为上下文";
}
function selectStage(idx,force){
  if(Running&&!force){ novaToast("生成中，请先停止","warn"); return; }
  State.stage=idx; saveState(); paintRail(); paintInput(); paintOut();
}
function allMarkdown(){
  let md="# Nova Flow 交付流水线产物\n\n需求："+State.requirement+"\n\n导出时间："+new Date().toLocaleString()+"\n";
  NF_STAGES.forEach((s,i)=>{ const o=State.outputs[s.key]; if(o&&o.text) md+="\n\n---\n\n# 第 "+(i+1)+" 阶段 · "+s.name+"（"+s.teamName+"）\n\n"+o.text; });
  return md;
}
function initFlow(){
  loadState();
  const ready=window.llmReady&&llmReady();
  $d("#api-banner").hidden=!!ready;
  const p=window.getActiveProfile&&getActiveProfile();
  $d("#model-badge").textContent=p?("模型："+p.model+" · "+p.name):"模型：未配置";
  paintRail(); paintTeams(); paintProgress(); paintInput(); paintOut();
  $d("#requirement").value=State.requirement||"";
  $d("#requirement").addEventListener("input",(e)=>{ State.requirement=e.target.value; saveState(); });
  $d("#stage-input").addEventListener("input",(e)=>{ State.inputs[NF_STAGES[State.stage].key]=e.target.value; saveState(); });
  $d("#rail-list").addEventListener("click",(e)=>{ const it=e.target.closest("[data-stage]"); if(it) selectStage(+it.dataset.stage); });
  $d("#run-stage").addEventListener("click",()=>runStage(State.stage));
  $d("#run-all").addEventListener("click",async()=>{
    if(!State.requirement.trim()){ novaToast("请先填写产品需求描述","error"); selectStage(0); return; }
    for(let i=0;i<NF_STAGES.length;i++){
      if(StopAll) break;
      if(State.status[NF_STAGES[i].key]==="done") continue;
      const ok=await runStage(i);
      if(!ok) break;
    }
  });
  $d("#stop-btn").addEventListener("click",()=>{ StopAll=true; if(Ctrl) Ctrl.abort(); });
  $d("#copy-out").addEventListener("click",async()=>{
    const o=State.outputs[NF_STAGES[State.stage].key];
    if(!o||!o.text){ novaToast("暂无产物可复制","error"); return; }
    try{ await navigator.clipboard.writeText(o.text); novaToast("已复制到剪贴板"); }
    catch(e){ novaToast("复制失败：浏览器未授权剪贴板","error"); }
  });
  $d("#dl-out").addEventListener("click",()=>{
    const o=State.outputs[NF_STAGES[State.stage].key];
    if(!o||!o.text){ novaToast("暂无产物可下载","error"); return; }
    downloadText(ARTIFACT[State.stage]+".md",o.text,"text/markdown;charset=utf-8");
  });
  $d("#dl-all").addEventListener("click",()=>{
    const first=State.outputs[NF_STAGES[0].key];
    if(!first||!first.text){ novaToast("至少完成第一阶段后再导出","error"); return; }
    downloadText("NovaFlow-全流程产物.md",allMarkdown(),"text/markdown;charset=utf-8");
  });
}
document.addEventListener("DOMContentLoaded",initFlow);
