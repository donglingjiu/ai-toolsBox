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
## 门禁工程四起事故复盘(2026-11-06 P1战役)
1. 听四字节emoji粘贴损坏(CESU-8代理对) → 字节级UTF-8预检门(报位置+现场)
2. 装饰符计数嘴算(3 vs 实际4) → 重数审计门(打印每处上下文再断言)+关键件存在性断言
3. 逃逸安全习惯反噬(\u##无效转义) → 无效转义类门禁全集(\u/\x/\8\9/旧八进制)
4. 验证器层级混淆(Python\u解码层 vs JS文件字面层) → raw层断言纪律(r串对字面)
元教训: 静态门都是概率盾, 唯一权威是运行时(浏览器控制台截图两次破案);
验证器必须与工件同层; 门禁防得住外人防不住作者(最大违规者是自己)。
P1成果: 音频概览(双主持人WebSpeech)/学习中心(大纲树+闪卡)/临时聊天+对话分叉。
## Flow 轨迹脊柱取证复盘(2026-11-13~18 saga)
1. 十日幽灵席位/票名/改写恐慌全部源于截图OCR转录腐化 → 纪律: 机器布尔>落盘文件>粘贴文本>截图; 盔甲(len+算术自证)入宪; 不可能性证明可自证腐化
2. 票名拓扑: smoke(手工)/2611041428(v1.1+78s首跑)/2611061402/2611110814(11-11 16:14僵尸页, 全边沿天然通过B1b大考); Tab各自sessionStorage结构性隔离
3. 账本25=1+8+12+4, 镜像4/12/4逐票⊆账本; s1:done@15:18:10为OCR回声幻影, prd1767=流中保存非加冕
4. 全账恰1条fail(11-11 08:23); 11-4"fail"与22:08伏击均为转录虚构; B1 diff证明fail边沿11-10才出生
5. 元教训: 盔甲护计数不护内容(主卷宗seat8案); 多数证词不等于真相(probeC冤案); 探针须三态区分; K徽章单源(感知腐化)
## UI一致性战役开卷(2026-11-18)
- 对标: tokens-light光宪法(54行)+tokens暗宪法(66行)已在, 5页合法/21页法外/42处裸值/4套蓝紫并存
- 金丝雀: skills.html挂tokens-light(c666bee已push); 验收三重: curl=1 + sheets=7 + bg=rgb(237,246,255)
- 教训: commit≠上线, 验收前先过部署跳(curl); 版本单源化待修(一文件四版本)
- 部署=CF Pages自动同步GitHub(push即构建, 无repo侧CI); CF Pretty URLs对*.html发308→无扩展名路径, HTML验收curl必带-L
- L2/L3竣工: 22页单份宪法v3对齐, stone.html 244-link历史事故修复, K徽章/sw-card令牌化(带fallback)
- 遗留: s1-io面板令牌化(人眼手术), SW预缓存对无扩展名路径失败(P3小案), 版本单源化(P4)
- 第二卷竣工: s1-io令牌化(9处7种/21页v4) · wiring单源(v7) · SW手术(nova-v20+nav可见化, 运行时激活#1945验证)
- 7f00aab备注: message含未执行项, SW由0f7dd04补完 — 家训: message只写已验证事实
- SW终章: 卡死SW为更老祖先脚本(sw.js:123), 非v20版本bump驱逐; 激活证明CORE全URL健在
- 遗留: 5页迁移(data/docs/flow/index/mind双重着装, 侦察先行) P3 · s1-io CORE条目失配 P4 · 几何token入宪 P4
- 第三卷竣工: 宪法合并v5—21基础设施变量收编+--r-fab语义立法; 五页脱双袍(tokens.css退役+CORE清尸+CACHE v21); nova.css明化(color-scheme light+selection令牌化)
- 法医: v4收编块曾孤儿上线(08f23c3, grep"^--"=8暴露顶格) → 5623226 :root包裹成活; 运行时三证1280px/10px/light; 畸形sed空转由diff统计自证
- 家训: heredoc追加CSS必先tail结构 · 条件占位行必须注释化 · 变异命令禁挂2>/dev/null
- 遗留P4: 青绿K真身(s1-backup零样式串, 嫌疑转nova-core/css) · sw注释塔 · s1-io CORE戳失配 · --sidebar博物馆藏品 · tokens.css文件归档
- e444bb6备注: message首半句失实(令牌化未发生, 同帧grep=0互证); 实际仅单页戳bump — 家训升级: commit前最后一眼必须是验收grep
- 出生证明翻案: nova-core 85-87=cmdk overlay(有户口,样式在nova.css命令面板辖区); 真浮动K在:217区待二读; s1-backup终审清白(Blob/download)
- 转述弹劾: "双K摆放"系截图误读(源码log=⌘K 或 / 唤起); K徽章=cmdk-btn(nova.css:55+kbd键帽) 待DevTools定谳
- v5静默修复: --cmdk宽+t-fast/e-out动画v5前在~18非老兵页失效, v5后全站统一
- suite.css新大陆(v1硬编码化石床, 消费者待查); nova-core戳塔三时代(v1×12/bare×4/v15×1), 下次真改动统一bump v16
- runtime塔: novaSelfCheck报错文案仍指已退役tokens.css
- at-cmdk:42运行时注入<style>—三卷CSS考古扑空终审; :454 fab出生地; :148让位协议
- 青绿K传说解体: 实体=青绿文字胶囊(脑…,flow特有)+蓝紫圆K(全站); index齿轮=制服撤诉
- v5-18页论断死亡(@import空+style.css无cmdk+nova.css仅5页); split-brain嫌疑: JS16页vs CSS5页, nova-core自着装普查中
- suite立法: --suite-accent×10(>9系大写hex逃过大小写敏感普查); #3aa5f7+rgba残留; 戳v3
- /flow版本地质六层(v1/v7/v14/v15/v16/bare), md-render v16最高峰
- v15案终审: 活体DOM唱名?v=1 — census全对, console"v15"=转录#4(数字粘连?v=1:217); SW无罪维持; 戳塔v1×11/裸×4/v15×1
- 308真凶: CF Pages clean URL(resume.html→/resume) — 仪器三规程: curl -sL + -w %{http_code} + 截图放大读戳
- 嫁接刀口: 手贴link标签body尾(resume:198/advisor:119), 三件套nova-cmdk→tokens-light→nova-core — 座次即法
- 级联政变反转: 宪法永远后到永远赢, 复印件共享名全被压制(改宪法自动传播11页); 独名(--glass/--shadow-card)待查
- style.css≠基础设施供体(--ink平行namespace, body法被嫁接三条删除线覆盖); nova-cmdk借粮经tokens-light — v5第三笔静默战果(11工厂页按钮)
- /resume单页四代戳同堂: app.js?v=11新高 + v1/v5/bare
- de1b1cc勘误: message"循环普查0独名"失实—grep把--xxx当选项, 29条报错被误读为空; 修剪安全性改记前帧逐字对表证据, 补发正确普查(--守卫+判定行)归档
- 家训: 预检仪器必须显式打印PASS/FAIL判定行; 循环喂参grep必带--守卫; 处方QA#3入册
- accent定谳: 宪法tokens-light:13四驿站(docs蓝/data紫/FLOW青绿#20bda0/mind橘粉#e99b75); 博物馆旧mind=#FF8A5C星焰已换代; 绿色合法户籍=FLOW
- 绿胶囊: /resume探针零命中=正确行为错现场; nova-flow.js出清; flow.html静态markup头号嫌疑; console照片封卷?v=1—转录#4终审
- 木乃伊死亡证明: 好仪器(--守卫+判定行)11连OK·0MISSING — de1b1cc claim追溯补证; /qr活体验尸健康=视觉章准予; 座次铭v2生产上线(头注释v1微漂P4)
- 绿案: flow.html无"脑"(markup死)+accent-flow唯一消费者=首页驿站名(var死) → 运行时+内联绿唯一幸存; 增强版侦查法(outerHTML)待/flow第4次唱名
- push三幕: SSL抖动→403(owner被拒=2021密码退役)→新凭据成功; 凭据卫生: PAT+store或SSH
- 凭据溃败: 毒票(~/.git-credentials无scope token)静默403×4; set-url无空格拼接静默vandalize origin; SSH无钥匙; PAT明文入史已吊销; 修复=remote复原+清缓存+新PAT(repo scope)仅交互输入; 家训: remote手术后必git remote -v, append前必查重
- 绿案: 全库"脑"仅提示词书堆(head截断+-v at-cmdk自盲=仪器过滤器也造盲区); #20bda0双重国籍(--ok+--accent-flow)=颜色同名词; toast假说(3.2s瞬态)→MutationObserver蹲守代替巡逻
- v15闭环: /flow console正统v15:217(census唯一v15页) + /resume活体v1 + 行号一致=stamp-only铁证; 三页console三重确认, 转录#4终审维持
- 前门修复: remote -v验伤复原+毒票火化(125B·mtime14:06=store后首推入库的无scope票)+新PAT两连push全绿; 教训: store后首推必验, 403即火化
- 账本自愈: awk -4古董重复行(+3/−7) — TASK-TRACE曾静默积累复写; 处方QA#4: 验证pattern必取自数据非commit记忆
- 绿案: 陷阱合格但出生于init窗口(加载→布网间)+持久在场=toast假说死亡; registry驱动假说(文字来自户口簿注册名非label字面量); 唱名条件全齐
- 新住户: agent-extra.js/brain-study.js首次入册; flow-wiring五连log+Shadow DOM首见+双时钟(内v2.3/戳v7); NovaCmdk.open()公开API
- 探针盲区定谳: 正确舞台+目标可见+零输出=仪器事故; offsetParent对position:fixed返null(角标家族全被筛掉)+Shadow DOM新面纱(flow-wiring首例); 修复=SING2(*+leaf+contains脑+rect高度+position唱名); 零成本通道=Elements Ctrl+F
- estate核弹: 26页!(户口簿17系低估) 处女房间migrate/stone/skill-test/chat从未受审; agent-extra→chat唯一/brain-study→brain唯一
- 绿案收敛: 双户口簿脑头文本(at-cmdk:52"脑图 Mind"/nova-core:25尾段"脑图工作室")→registry角标假说; 裁缝在两文件之一
- StateMachine持久: wf_id=wf_mnet789跨会话恒定(shadow即状态容器); Violation浮动193→141ms
- 纪律: 新钥匙三连推全绿(7da2017清洁+5/-0)
- 绿案供词: <button id="md-mind-…"> ∅class·fixed·内联仅display:block·渐变135deg #1ab8a6→#6366f1(#1ab8a6=第三枚青绿≠#20bda0; #6366f1=Tailwind indigo-500家族第三人); offsetParent盲区被元素自证; 渐变必来自ID选择器规则; 唯一命中=/flow全域唯一"脑"叶节点
- Shadow DOM死亡: attachShadow全宅0命中+"StateMachine shadow"=JS状态影子(假朋友) — 教训: 凭日志措辞立项前先grep对应API
- estate矩阵: 宪法23/26·大脑16/26·atcmd22/26; 完美包含律: 大脑辖区=宪法∩atcmd(三全16页); atcmd比大脑更普适(旧系统=真通用层, fab照22页); 404的K=atcmd+无宪法→fallback✓; chat=三网全off孤岛; stone/migrate/skill-test=工具/测试页(户口簿差额大半系有意)
- 纪律: fc75a9e零疤痕; 新钥匙四连推全绿
