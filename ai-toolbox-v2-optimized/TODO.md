# TODO · Nova AI 工具箱
> 详细背景见 TASK-TRACE.md(遗留与移交段) | 明日开工口令: "做P1" + 序号

## UI重构(新议题 2026-11-06 用户反馈"界面太乱")
- [ ] 病灶: 顶栏18入口挤两行 / 注入卡无正式家 / 设计语言混血(Nova紫 vs legacy卡)
- [ ] 统一设计tokens(间距/字号/色板)强制全站
- [ ] 导航IA: 首页卡片网格launcher + CtrlK命令面板提级为主导航
- [ ] brain注入卡(音频/大纲/闪卡)收纳为正式tab, 内联markmap渲染(mind.html同款vendor)
- [ ] 阶段式推进: 先tokens+导航, 再逐页, 不搞大爆炸

## P1(①②③已完成 2026-11-06)
- [x] ① brain音频概览 — NotebookLM招牌功能的本地平替; Web Speech API双主持人(解说员+专家), 免费离线, 摘要脚本走已配置LLM
- [x] ② brain思维导图+闪卡 — markmap-lib/markmap-view 已在 vendor, 文档摘要→导图, 问答对→翻转卡
- [x] ③ chat对话分支+临时聊天 — 会话树(msgs快照分叉); 临时聊天不落 at_chat_sessions

## P2(远期)
- [ ] 对话式数据分析 — excel受限DSL与chat融合(沙箱执行+图表)
- [ ] PWA+移动适配 — manifest+SW离线壳, 断点布局
- [ ] 语音输入 — chat输入框 Web Speech recognition

## 待用户/观察项
- [ ] 设置页配图像三件套(imgBase/imgKey/imgModel=智谱cogview-3-flash) → 验证P0-5配图
- [ ] 配图若报 HTTP 404(generations端点) → 贴回报错, 加CogView专属分支
- [ ] Inter字体404 → 网络面板"发起者"列定案(疑浏览器扩展注入, 非仓库源码)
- [ ] QA终验清单(TASK-TRACE 交付评审段)有空时整体勾一遍
