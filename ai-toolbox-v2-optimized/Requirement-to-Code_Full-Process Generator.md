---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 2926240349828904_0-drive/223362226290728845/全流程平台-架构设计.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 2926240349828904#1792044122449
    ReservedCode2: ""
---
# 全流程交付平台 — 完整版架构设计

> 定位：把 4 套 Paperclip Agent 专家团（产品/技术调研/AutoDev/长文审阅）改造成可自部署的「需求分析 → 技术调研 → 方案设计 → 代码实现 → 交付评审」全流程编排平台。轻量版（AI 工具箱 flow.html）是其单机浏览器版；本文档描述带后端编排的完整形态。

## 1. 目标与差距

| 能力 | 轻量版（已上线） | 完整版（本文档） |
|---|---|---|
| 流水线编排 | 前端串行调用，单轮 LLM | 状态机 + 断点续跑 + 并行分支 |
| 多角色协作 | 每段一个融合角色 prompt | 真实多 Agent：角色间互审/辩论/重试 |
| 工具执行 | 无（纯推理） | Web 搜索、PoC 沙箱、代码执行、内网 API |
| 产物管理 | localStorage | 版本化仓库 + 审计 + 协作 |
| 内网交付 | 不支持 | iCafe 建卡 / iCode 提交 CR / ugate 鉴权 |

## 2. 总体架构

```
┌─────────────── Web 前端（复用 AI 工具箱壳）───────────────┐
│  流水线看板 │ 产物审阅（划词批注） │ 配置中心（模型/凭证）  │
└──────────────────────────┬───────────────────────────────┘
                           │ REST / SSE
┌──────────────────────────▼───────────────────────────────┐
│                Pipeline Orchestrator（编排核心）           │
│  状态机: PRD→RESEARCH→DESIGN→CODE→REVIEW                   │
│  · 段内并行（多角色分支聚合）  · 失败重试  · 人工卡点审批    │
├──────────────────────────────────────────────────────────┤
│  Agent Runtime        │  Tool Router        │  Artifact   │
│  · 角色池(17 角色)     │  · web_search        │  Store      │
│  · prompt 版本管理     │  · poc_sandbox(Python)│ · 版本/diff │
│  · 会话记忆           │  · code_runner        │ · 导出服务  │
│  · 成本配额           │  · intranet_proxy ⚠️  │ · 审阅页渲染│
└──────────────┬───────────────────────┬───────────────────┘
               │                       │
        LLM Provider 适配          内网适配层（可选）
        (OpenAI 兼容/Claude)       iCafe · iCode · ugate
```

## 3. 核心模块

### 3.1 Pipeline Orchestrator
- **状态机**：五段主链路，每段 `pending → running → review → done/failed`；段间产物以 Artifact ID 引用传递（非全文复制）
- **人工卡点**：每段结束默认人工确认后放行（可配自动放行）；REVIEW 段 🔴 问题必须回修对应段后重跑
- **断点续跑**：pipeline state 持久化（PostgreSQL），中断后从最后完成段恢复
- **实现建议**：Node.js (NestJS) 或 Python (FastAPI) + Redis（队列/锁）；编排用显式状态表而非工作流框架，保持可调试

### 3.2 Agent Runtime
- **角色池**：17 角色定义迁移自 4 包 AGENTS.md（剥离平台指令，保留方法论）；与轻量版 `flow-prompts.js` 同源维护——服务端 prompts/ 目录生成前端降级版
- **多角色协作模式**：
  - `solo`：单角色产出（同轻量版）
  - `panel`：多角色同题独立产出 → 聚合（如技术调研：scout×N → analyst → critic 质疑 → director 汇总）
  - `debate`：critic ↔ builder 对抗式互审（CODE 段质量保证核心）
- **模型路由**：角色 → 模型映射可配（如 director 用强模型、scribe 用快模型）

### 3.3 Tool Router 与沙箱
- `web_search` / `web_fetch`：调研段实时情报（轻量版缺这环，完整版补齐）
- `poc_sandbox`：临时容器执行 Python/Node 验证脚本（调研团 PoC 执行官、AutoDev 验证共用），超时销毁
- `code_runner`：测试执行与 PASS/FAIL 证据采集
- `intranet_proxy`（⚠️ 可选模块，独立进程）：
  - iCafe：需求建卡/状态回写（映射 AutoDev runner 的 `icafe-operate` skill）
  - iCode：分支创建、MR 提交、CR 状态查询
  - ugate：token 获取与刷新（服务端持有凭证，前端永不接触）
  - 开关按部署环境配置：外网部署时整体禁用

### 3.4 Artifact Store
- 产物版本化（每次生成新版本，保留 diff），审阅批注挂在产物锚点上
- **审阅网页服务**：长文审阅专家团的 HTML 渲染逻辑服务端化——目录锚点/划词批注/批注导出 md；批注回流触发对应段重跑
- 导出：全流程报告 md、审阅网页、（可选）iCafe 卡片同步

## 4. 四包能力映射

| 源包 | 迁移内容 | 落点 |
|---|---|---|
| 产品专家团-v2 | 6 角色 prompt + create-prd/SWOT/竞品等 30+ 框架 | PRD 段角色 + 方法论模板库 |
| 技术调研专家团-v11 | 6 角色 + 五步法 + 红队 7 点质疑 | RESEARCH 段 panel 编排模板 |
| AutoDev-v19 | orchestrator 编排规则 + runner 验证证据规范 | CODE 段 + Tool Router 内网代理 |
| 长文审阅页专家团-v2 | 审阅网页渲染 + 批注协议 | Artifact Store 审阅服务 |

## 5. 部署拓扑与安全

- **最小部署**：1×编排服务 + 1×PostgreSQL + 1×Redis + 1×沙箱 runner（Docker），前端静态托管可复用 AI 工具箱域名反代
- **安全**：内网凭证仅存服务端 secret 管理；沙箱网络默认隔离（白名单出口）；全链路审计（谁/何时/哪个角色/改了什么）
- **成本控制**：角色级配额 + 段级 token 上限 + 重试熔断

## 6. 里程碑建议

- **M1**：编排核心 + PRD/RESEARCH 两段（panel 模式）+ 产物仓库 → 端到端跑通
- **M2**：DESIGN/CODE/REVIEW 三段 + debate 互审 + 审阅网页服务
- **M3**：web_search/PoC 沙箱接入（调研段情报实时化）
- **M4**：内网适配层（iCafe/iCode/ugate）——仅内网环境部署

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
