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
  ↳ 托管确认：Cloudflare Pages；内网 curl 实测 DNS 2.5s 为大头，出口抖动=随机停顿离群值根因
  ↳ marked 处置：v12.0.2 还原（brain/flow 原配），v9.1.6 独立为 marked-9（4 页原配）——匹配还原零风险
  ↳ 复测判读：docs 冷加载 14.4→3.65s 基线健康（页面未改动，纯环境波动回落）；prompts 16s 为离群值
  ↳ SW 缓存层上线（SWR HTML + 缓存优先静态）：重复访问零网络依赖，随机停顿不再影响体验
  ↳ SW 维护约定：大版本发布将 CACHE 'nova-v1' bump 'nova-v2'
  ↳ N1-2 完成：旧世代 6 页换装 nova topbar（自包含 nova-topbar.css；链接列表原样保留；cmdk 按钮仅挂已载 at-cmdk 的页）
  ↳ 判读修正：旧顶栏非 app.js 生成（app.js 零 nav 代码），系各页内联 HTML——app.js 为页逻辑工厂，保留不动
  ↳ 教训：grep -c 数行不数个数——链接保全抽查误报「2」，正确口径为 grep -o | wc -l 与 href 多重集 diff
  ↳ 教训：探针须自校验基线非空；git show 相对路径带 ./（仓库根≠cwd）；引用历史提交锚定 hash，HEAD~N 会随提交漂移（差点造出假绿灯）
  ↳ S2 环境lesson：老coreutils——sed用-r非-E、grep无--exclude-dir（ls|xargs替代）、git grep无-o
  ↳ S2手术：md-render唯一漏斗包DOMPurify（缺失时降级直出）——AI输出XSS面关闭
  ↳ ===== S2 安全审计收官 =====
  ↳ 密钥面✅：仓库零真实密钥；Profile 用户自填本地存、运行时拼装；内置代理=自有域名/llm（服务端持key）
  ↳ 出网面✅：仅用户自配模型端点（sanitizeBaseUrl 预处理）+ opt-in 虚拟号/bind；零遥测
  ↳ 动态执行✅：唯一命中=docs导出自包含HTML（用户主动自食内容）——接受
  ↳ 注入面✅：用户侧 esc/escapeHtml；AI侧唯一漏斗 md-render→DOMPurify（自举+降级）
  ↳ P0复盘：BRE中\|是"或"→sed腐蚀222行已push；教训=改代码用脚本替换+锚计数断言；SW约定首次实战（bump v2强刷）
  ↳ guard.js定位：威慑性门神，无安全价值无风险——保留
  ↳ 自举落地：py2 heredoc 含中文触发编码限制→全ASCII重试成功（lesson：共享机python默认py2，脚本块纯ASCII）
  ↳ 对标改判：docs=文件转换+星库（非md编辑器）——大纲/快照不适用结案；docs真缺口=星库搜索（侦察中）
  ↳ F2手术：mind PNG导出（自装脚本 svg→canvas 2x + markmap CSS内联 + toBlob fail-closed）；SVG下载本就有
  ↳ SW缓存bump nova-v3（内容变更刷新约定第二次实战）
  ↳ F2修复：PNG导出v2——根因=WHATWG html#10641（blob URL+foreignObject必污染canvas，data URI干净，全浏览器一致）；附带剔除url()规则+20px留白+toBlob自诊断alert
  ↳ F1手术：星库即时搜索（自装脚本行级过滤+命中计数+MutationObserver跟随刷新，零侵入refreshVault）
  ↳ SW缓存bump nova-v4（两文件变更，约定第三次实战）
  ↳ sw.js:40离线uncaught fetch定性：NewCard扩展透传×离线，cosmetic——下轮recon(30-60行)后加catch
  ↳ F1事故复盘：docs.html:149 SyntaxError——heredoc粘贴时长行被终端截断半行入库；
    lesson升级=标记计数不够，写入后须关键行内容断言+JS行短化(≤80字符)
  ↳ F1 v2上线：守卫拆三短行+内容断言双key——星库即时搜索
  ↳ F2 v3重型版：PNG加粗节点上缘裁切→根因=导出重渲染样式子集与实况微差×markmap紧viewBox；
    处方=逐节点computed style内联+并集bbox(getScreenCTM逆变换)+pad24——样式/几何双对齐
  ↳ sw.js:40补catch(504合成响应)——离线NewCard透传红屏消除
  ↳ SW缓存bump nova-v5（三文件变更，第四次实战）
  ↳ F2三号事故：v3 heredoc尾部被粘贴截断(img.onerror行腰斩)→内联块语法死亡→按钮未挂载；
    断言只盖头/中未盖尾，残件畅通入库——lesson终极版：逻辑独立成文件(首中尾三锚+长度下限)，
    HTML只挂一行引用；v4落地=js/mind-png.js外置+script配平断言
  ↳ todo侧线协查结论：真身todo.md无续12段(全/半角皆无)——stage5-3i的去重目标是过时情报
  ↳ ===== F线（常用功能对标）收官 =====
  ↳ 矩阵终版：docs=转换台+星库（补即时搜索✓）；data=管线算子达标结行；
    flow=提示词链模板库结行；mind=折叠/缩放已有，补PNG导出✓
  ↳ F1星库搜索：自装行级过滤+命中计数+Observer（v1截断事故→v2短行+内容断言上线）
  ↳ F2 PNG四代：v1 blob撞WHATWG污染墙→v2 data URL出图但加粗节点裁顶
    →v3样式内联+并集bbox（被粘贴截断击毙）→v4外置js/mind-png.js完整落地✓
  ↳ 事故三连封门规约：改文件必关键行内容断言；能独立成文件必独立成文件
    （首中尾三锚+长度下限+tail肉眼验）；create mode信号=预期新件才算绿
  ↳ SW缓存约定v1→v6五次实战；sw.js:40离线catch(504)兜底
  ↳ ===== N1+S2+F 全战役总收尾 =====
  ↳ N1交付：统一导航24页/全站备份/性能（外链清零+SW离线）
  ↳ S2交付：安全五维全绿（密钥/出网/注入/动态执行/存储）+P0腐蚀复盘闭环
  ↳ F线交付：对标补缺（星库搜索/PNG导出）+三事故教训入册
  ↳ 遗留挂账：guard站长旁路（待批）/ppt导出翻页/扩展开关后1s档复测/离线docs复确认
  ↳ guard站长旁路落地：IIFE顶部早退(localStorage.novaOwner='1'则return)，
    按键拦截/模糊/检测循环全不注册；恢复=removeItem；SW缓存bump nova-v7（第六次实战）
  ↳ ===== 挂账清零：全战役遗留仅剩ppt翻页/扩展开关1s档/离线docs复确认（低优，随机触发） =====
  ↳ T线P1-1落地：pdf(合并/拆分·pdf-lib)+excel(预览/CSV/JSON·SheetJS)全部vendor本地
  ↳ 第4次截断事故：150行heredoc腰斩×6处+GATE锚点盲区假放行→新规：单heredoc≤70行/
    锚点扎进函数体内/括号配平进门/sed无引号；pdf-tools拆util+merge+split三小文件
  ↳ 定位注记：docs转换台=批量流水线，excel.html=逐sheet探查导出，互补
  ↳ 修正：上条P1-1 premature——GATE2括号配平首胜(第5次截断:for头被吃+base行腰斩)但门后批次照跑,b0ad631带伤入库+sw未bump；热修=一体化python门&&焊链commit；新铁律：GATE与git必须同链,门红不commit
  ↳ P2-1: PDF套件=提取/旋转/图片转PDF+cmdk注册；第7次截断复盘：死因=单次粘贴字节量(4.6/5.8KB死,2KB全活)而非行数→新协议:载荷≤2KB+数据独立成文件+门焊commit
  ↳ P2-1b: suite.css暖色重做+pdf重建+excel换肤；表情4字节UTF-8被粘贴链路碾成0xED代理对(CESU-8)→破案: index.html@8034同源！图标改BMP符号(⊕✂▤↻▣⇄)；0xED金丝雀进门(valid UTF-8永不含ED字节)
  ↳ P2-2: 表格套件=合并工作簿/数据清洗(去重·trim·空行)/按行拆分CSV；index@80340xED残骸清除(挂账兑现)；JS变更轮→sw v10
