# ai-toolbox 产品路线图（对标版）

> 原则：纯前端无后台 · AI 能力走用户自配 OpenAI 兼容 API · 每实现一块功能同步调整对应界面
> 参考仓：donglingjiu/nebula-tools（⌘K 面板 / Toast / 弹窗规范 / workspace / mindmap / flowchart 可直接借鉴）

## 竞品对标矩阵

| 板块 | 对标产品 | 我方现状 | 差距 |
|---|---|---|---|
| 文档 | Notion / 语雀 / 飞书文档 | docs.html 转换+AI | 缺块编辑器 |
| 数据 | Airtable / 飞书多维表格 / vika | data.html Vault | 缺多视图 |
| 表格 | Airtable AI / Excel | excel.html 画像+DSL | 缺 AI 字段 |
| 脑图 | 幕布 / XMind / markmap | mind.html 基础 | 缺双向同步 |
| 工作台 | Notion 3.0 / ClickUp | flow.html 固定 5 阶段 | 缺自定义编排 |

## P0 · AI 六件套（优先）

- [x] A1 全站 ⌘K 命令面板（对标 Notion AI / Linear）
  - 搜工具/Skill + AI 快捷指令（改写/摘要/翻译）
  - 技术：全局快捷键 + skill-injector 复用
  - UI：毛玻璃居中弹窗 · 淡入缩放 · Esc 关闭
- [x] A2 AI 对话工作台 chat.html（对标 ChatGPT）
  - 流式输出 · Markdown 渲染 · ✦ Skill · 多 Profile 兜底 · 本地历史
- [x] A3 第二大脑 RAG 升级（对标 Notion Q&A）
  - embedding 向量检索 + BM25 混合 · IndexedDB 存向量 · 引用浮层
- [ ] A4 Excel AI 字段生成（对标 Airtable AI）
  - 列头「✦ AI 字段」：classify/sentiment/summarize/tag 四类受限算子，走白名单校验
- [ ] A5 PPT AI 配图 + 高级母版（对标 Gamma）
  - 复用 tryon 图像通道 · 新增深色玻璃/渐变光晕母版
- [ ] A6 Skill 工坊 AI 造 Skill
  - 一句话生成结构化 Skill · schema 校验后入库

## P1 · 功能扩展六件套

- [ ] B1 docs.html Markdown 块编辑器（对标 Notion）：双向预览 · 导出 docx/pdf
- [ ] B2 mind.html 大纲⇄导图双向（对标幕布）：分屏 · AI 生成骨架
- [ ] B3 data.html 多维表格视图（对标 Airtable）：表格/看板/日历/画廊 · 字段类型 · 分组筛选
- [ ] B4 workspace.html 聚合工作台：最近文档/流水线/文件队列统一卡片
- [ ] B5 flow.html 自定义编排：阶段增删改排序 · 模板库
- [ ] B6 flowchart.html 流程图：mermaid 本地打包 · 导出 SVG/PNG

## P2 · 质感四件套

- [ ] C1 Nova Design Tokens v2：统一圆角/阴影/动效曲线 · 玻璃拟态
- [ ] C2 全站动效：按钮动效/焦点环/弹窗缩放/背景模糊（对齐 nebula 规范）
- [ ] C3 Toast + 空状态 + 骨架屏统一组件
- [ ] C4 暗色模式（tokens 一键切换）

## 执行约定

1. P0 全部做完前不开 P1；每项完成必须同步：入口按钮 + 空状态 + 加载态 + 移动端适配
2. 新对话页接入 Skill 一行命令：body 前 script src=js/skills/skill-boot.js
3. 每完成一项勾选本清单并 commit：feat(P0-A1): xxx

## 追加待办（用户立项）
- [ ] N1 全站导航统一重构：chat 已补侧栏导航；其余页面导航样式/层级/当前页高亮统一（先探针各页 header 结构再动刀）
  ↳ 澄清（用户）：重点=首页工具分区（AI类/数据类/文档类）+ docs/data/flow/mind 布局刷新；打法=与其他 TODO 同页动刀、增量交付
  ↳ 进度：step1/5 首页分组上线并验证通过（AI7/文档4/数据3/生活2，控制台零错）
- [ ] S1 各界面数据导出/导入：每个工作台一键导出（JSON/MD）+ 跨设备迁移（migrate.html 已有底子，补全覆盖面）
- [ ] S2 安全审计：Markdown 渲染 XSS 复核（转义前置）、API Key 明文存 localStorage 的风险评估（掩码显示/可选记忆）、vendor 第三方脚本加 SRI 完整性校验、CSP
- [ ] S3 隐私与数据安全：localStorage/IndexedDB 一键清空入口、导出文件脱敏选项、错误提示不泄露 Key
  ↳ 进度：S1 引擎+docs 入口实测通过；升级为 s1-io 浮动入口全站铺开
  ↳ N1 观察：旧世代页（brain 等）topnav 溢出截断（「设」被切）——导航统一时修复
  ↳ 教训：预检告警必须 fail-closed 拦截动作——ppt.html 双 </body> 预检已报但循环仍注入，已去重修复
  ↳ ppt 确诊修复：导出字符串混入 profile/guard + skill 栈（裸 </script> 截断整个内联脚本，页面静默瘫痪）——历史误注入遗留，已清除恢复
  ↳ N1 巡检：data/flow/mind 达标免大刀；修 s1 悬浮球被 K 按钮压住（bottom 60px）；旧导航 flex-wrap 缓解
  ↳ 挂账 N1-2：旧世代 6 页（brain/mood/advisor/resume/tryon/prompts）顶栏换装 nova 统一 topbar（根治溢出与风格分裂）
  ↳ 性能分诊：基线健康（brain 冷加载 DCL 1.81s），30s 为离群值；系统性风险=jsdelivr 外链阻塞脚本，已全部本地化（marked→js/vendor，mammoth 复用本地件）
  ↳ P2 挂账：CSS 4→1 合并、Service Worker 缓存层（当前请求数与 DCL 不构成瓶颈，暂不动刀）
