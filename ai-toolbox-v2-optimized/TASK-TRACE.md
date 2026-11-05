# 任务轨迹 · ai-toolbox-v2-optimized 对标优化改版
日期: 2026-11-05 | 调度: web-delivery-director | 路径: 改版快捷路径(阶段1-2压缩/阶段门1确认制)

## 对标结论(阶段2)
- 对话工作台对标 LobeChat/OpenWebUI/LibreChat: RAG入chat/配置可携/对话分享 缺 → P0-1/2/4
- PPT 对标 Gamma: 品牌色板/AI配图 缺 → P0-3/5
- NotebookLM(音频概览/思维导图)/Julius(对话式分析)/Coze(发布分享) → 列入 P1/P2

## 变更清单(commit 链)
- d54311f P0-2 智能体配置导出导入(skill.js)+html2canvas本地化
- d66a165 P0-4 对话分享双形态(share.js: 自动PNG长图/独立HTML)+expBtn存量bug修复
- 59ee375 P0-4a mdLite零依赖渲染(代码围栏/粗体/行内code), 清除marked/DOMPurify依赖
- 5044635 垃圾字体出仓
- 2afa749 P0-3 我的品牌色板(ppt-brand.js: 取色器→validTheme→custom槽位)
- 2112fc6 P0-5 每页AI配图(ppt-illustrate.js)+P0-3a boot硬化

## 意外与修复(工程账)
1. 门禁退化史: parity奇引号计数器三轮误报(注释排除丢失→正则字符类/双引号串内引号读不懂) → v3: node --check权威化(环境无node)→qok行内白名单兜底。教训: 启发式闸门首次误报就该找替代品, 白名单是止痛药
2. expBtn存量bug: chat.html导出.md用c.messages而chat.js存c.msgs, 按钮长期静默失效 → 防御修复(c.msgs||c.messages)
3. 垃圾字体事件: curl失败产物被git add -f提交(挂在分号后未受前序失败保护) → git rm出仓。教训: 链式命令容错语义必须显式设计
4. P0-1改判: search_brain在M3.1已注册(agent-extra.js), 盘点口径过时 → 零开发, 实证通过(ReAct调用search_brain+来源合成)
5. PPT主题误判: R2视野截断看成8套 → raw拉取确认10套(cream/cyber) → P0-3收敛为纯色板
6. push网络瞬断x2: Empty reply/卡顿 → 手动补推化解

## 技术决策
- 分享自动形态: 含代码块||>30条||>6000字→独立HTML(导出时静态渲染,file://直开), 否则html2canvas长图; PNG失败自动降级HTML, 永不白点
- mdLite: 先整体转义再插自产标签, 安全自证
- 品牌色板: 零LLM确定性方案(与aiTheme的AI定制互补), boot恢复无条件重填下拉防内联初始化回退
- 配图: renderSlideHTML零锚点包装(预览/演示网页/打印三路通吃)+buildPPTX锚点addImage(sizing:contain防拉伸); 再点一次=移除; 封尾页不配图
- generations端点为全案唯一外推点(tryon仅实证edits; 智谱CogView同族形状)
- 缓存戳纪律: JS/CSS用?v=递增; HTML本体更新需硬刷新(验收陷阱,已记)

## 遗留与移交
- P1: brain音频概览(Web Speech双主持人)/思维导图+闪卡(markmap通路已存在)/对话分支+临时聊天
- P2: 对话式数据分析(excel受限DSL+chat融合)/PWA+移动适配/语音输入
- 用户配置: 图像三件套(imgBase/imgKey/imgModel=智谱cogview-3-flash); generations若404需加CogView分支
- Inter字体404: 仓库全量大小写不敏感扫描零命中, 疑为浏览器扩展注入 — 网络面板"发起者"列可定案
- normalizeDeck丢弃未登记字段: img已入schema, 后续重构deck结构时需保留
