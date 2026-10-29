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

- [ ] A1 全站 ⌘K 命令面板（对标 Notion AI / Linear）
  - 搜工具/Skill + AI 快捷指令（改写/摘要/翻译）
  - 技术：全局快捷键 + skill-injector 复用
  - UI：毛玻璃居中弹窗 · 淡入缩放 · Esc 关闭
- [ ] A2 AI 对话工作台 chat.html（对标 ChatGPT）
  - 流式输出 · Markdown 渲染 · ✦ Skill · 多 Profile 兜底 · 本地历史
- [ ] A3 第二大脑 RAG 升级（对标 Notion Q&A）
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
