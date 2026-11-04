# JD 对齐 TODO · 站点即作品集

> 原则：保持纯前端架构优势——零后端、零部署、SW 缓存、数据不出端；
> 每个展台 = 面试官打开 URL 即见的活体演示。

## JD#1 Agent Harness（OpenCode / OpenClaw 类）
- [ ] harness.html 新页：工具注册表 + loop 执行（model→tool_call→execute→append）+ trace 时间线
- [ ] 双模驱动：Mock 剧本（零 key 可跑）+ BYOK（复用 app.js apiKey 层）
- [ ] guardrails：max_turns / 步数预算 / 工具 allowlist / 参数 schema 校验
- [ ] nav 接线 + SW bump 配对 + 冒烟
- 状态：未开工（下一波头题；Robot 页是 URDF/DH-FK 域，不复用地皮）

## JD#2 Coding & Agentic 评测框架
- [ ] eval.html：case 库（contains / regex / JSON-schema 断言）
- [ ] runner + 规则打分 + case×model 矩阵视图
- [ ] 结果导出 JSON；case 可从 Data 表格一键生成（联动 JD#3）
- 状态：未开工

## JD#3 数据生产与清洗框架
- [x] 导出脱敏 —— 侦察实证已在线上（maskCell 手机/身份证/邮箱 + mask-toggle 预览导出双生效），零新代码
- [x] 清洗流水线模板：快速清洗（全列 trim + 整行去重）/ 一键制备（+数值规范化自动探列，敏感列豁免）→ 逐 op 过 applyOne，chips/账本/闸门全继承
- [x] JSONL 导出（训练集格式，复用 exportRows 脱敏管线，文件名 -masked 语义对齐 CSV）
- [x] 质量报告卡：行 / 缺失单元 / 重复行 前后 diff
- 状态：代码落地（本波），冒烟六拍后销账

## JD#4 大规模分布式系统
- [ ] sim.html：Raft 选举 / 日志复制动画（纯状态机 + SVG，零网络）
- [ ] 一致性哈希环 / 令牌桶限流演示
- 状态：未开工（展示性强，排 Harness 之后）
