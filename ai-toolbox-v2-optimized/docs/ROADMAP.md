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
  ↳ P2-2b: 视觉v2「Obsidian工作台」暗色(品牌薄荷#45E0C8)+自绘dropzone+tile图标+mono状态行；bump规则补全:覆写缓存资产必bump(v11)；门规约+1:计数断言先print后assert(自诊断)，本轮门拦下操作员自己的6vs5算术错
  ↳ P2-2c: 运行时逮住门漏放的伤——第6截断把extract.js的var P整行蒸发(结构门全免疫,ReferenceError才现形)；修复+全家族声明扫描进门(第6层)；扫描名单显式枚举不用glob(vendor混入教训)；套件页favicon灭404；sw v12
  ↳ P2-3: 变换算子+3(列拆分/值映射/填充空值)，侦察砍掉2个伪空白(分组聚合/转数值已存在)；六触点齐改=白名单+校验case+执行分支+OP_UI+gatherOp+下拉；validate证实STRICT(陌生类型throw)→白名单必须同步；无node→平衡增量断言(插入对称才放行)；cache-bust?v=2双文件；sw v13
  ↳ P2-4: 脑图导出三格式(OPML 2.0/FreeMind 1.0.1/归一化MD)；架构=从#mind-src源头解析，零耦合markmap闭包；复用mind-png动态注入模式；Python镜像测试验树形；门盲区一课=裸字符计数把列表正则字符类[.)]里的)计入→假阳性，源码改十六进制转义规避(功能不变)，真·JS词法门(剥离字符串/注释/正则再计数)挂账P3工具债
  ↳ P2-4b: 浏览器终验抓出 toMd 双失真(collapse后根标题被虚拟深度d=0吞掉；li被一律转标题违背承诺)→v2 kind感知修复：h按语义深度、li/p相对最近标题祖先缩进，导出↔导入幂等；覆写bust?v=2；sw免bump(URL键新取)；OPML/.mm截图实证collapse生效；挂账=mind页窄屏按钮挤压(视觉P3)
  ↳ C-阶段2: PDF三新卡=页码(3位置/字号/起始号/跳首页)+水印(ASCII守卫中文如实提示/密度3档/透明度3档/45°平铺)+压缩瘦身(objectStreams结构级,前后字节如实报,图片重采样超纲不吹)；卡四件套照抄；NovaPdf.fr/dl全复用；6卡→9卡；新文件?v=1；教训=门脚本一行生成噪声致SyntaxError，编译期死=零副作用(&&链护仓)，门脚本最小化原则再+1
  ↳ D1-阶段1: 具身机器人线(robot.html)=URDF查看器(内置图元示例臂+关节滑条+STL文件名映射+迷你轨道控制)+DH-FK计算器+量化显存估算器(AI编译器诚实切片)；皮=suite.css,骨架=div.suite/s-top/s-hero/s-chip/s-sub/grid(诊断五问实锤)；传输对策=裸heredoc直写+三小段&&串联+尾标签断言；astral规则划界=只扫新增字符串,既有文件全body不扫(index深藏合法emoji致误伤)；门哑弹自查=nav精确串计数1非2
  ↳ 导航规范化=全站topbar nav补齐7链(只补缺,已有链含aria-current一字不碰)；robot.html suite系s-top内联flex nav行(Robot青色高亮)；Phase2侦察入册=@mujoco/mujoco官方WASM绑定(Emscripten MODULARIZE异步工厂),MJCF原生+URDF支持,渲染接线=qpos→three网格(openarm web先例),wasm数MB需自托管vendor+加载态
  ↳ data编码Bug结案=xlsx-core.js唯一读入口加嗅探层(PK/OLE2签名放行二进制,UTF-16 BOM直解,strict-UTF8→GB18030级联覆盖无BOM CSV与中国Excel默认编码)；法证教训=「å§ å」=UTF8字节按cp1252逐字节解的教科书签名,诊断脚本曾因未剥?v=查空文件+被vendor压缩库噪声淹没(200条fromCharCode=SheetJS合法cp表),剥query+项目层过滤后一行定罪
  ↳ 【断言纪律·制度入册】教训三连=s-top缩进凭记忆(炸)、src未剥?v=当路径(空转)、raw-string写入vs普通串断言形态不同源(炸)。根因共性=锚点凭记忆不凭文件真实字节。制度三条=①门禁锚点优先ASCII；②中文/转义锚点必须双形态fallback(真实字符 or 字面反斜杠u序列)；③写入与断言同源——含中文内容一律非raw+真实字符写入，raw string只留给JS正则与纯ASCII转义。本次本体：焊单JS为r三引号，文件中是字面反斜杠u序列，JS引擎运行时解析显示中文，功能无恙；仅门禁形态错配自杀
  ↳ 【传输截断·第4课】heredoc经终端/聊天链路粘贴时单行可被拦腰截断(pole行`<body name="pole" p`后段丢失)，产生未闭合字符串=V8「Invalid or unexpected token」，行号算术定罪=文档105+块内15=robot:120:8列8=引号起点三坐标全中；旧闸盲区=括号配平/astral均不查字符串闭合且服务器无node；新闸=注入块逐行单引号奇偶扫描(合法行必成对)，配scene锚点(RK4/slide/freejoint/keyframe)双保险；制度补遗=大段写入后必须过奇偶闸再commit
  ↳ 【幻影修复·第5课】POLEFIX改内存变量漏write回盘——成功打印/闸门通过/ALL GREEN全假象；commit diffstat「1 file,1 insertion」即尸检报告(仅ROADMAP在场)却未被读取；线上8分钟STALE真相=修复不在任何commit里，Pages无罪。制度三条=①改文件必须write后从磁盘重读再验证(disk≠memory)；②commit后必读diffstat，预期文件必须在场；③闸门一律对磁盘内容跑，不对内存变量跑
  ↳ 【部署架构·第6课】本站真身=Cloudflare Pages项目ai-toolsbox(CNAME ai.donglingjiu.top→ai-toolsbox.pages.dev，Git集成donglingjiu/ai-toolsBox main，Automatic deployments enabled)；GitHub Pages=settings显示disabled/Branch None、Actions=白板、/deployments 404——GitHub仅是代码仓库，排查勿再入坑；CF Pages免费版500构建/月，每次push消耗一次构建；大wasm(10.9MB)构建耗时可超10分钟，4-8分钟轮询窗全STALE不等于失败——先看CF仪表盘Deployments时间戳再动锤；源站真伪探针=curl pages.dev与自定义域对照grep修复串；空提交锤子(ba3d801)重踢管线有效，本次终以双域fix=1换血成功
  ↳ 【裸说明符·第7课】浏览器ESM动态import路径必须./ ../ /开头，裸路径按bare specifier解析、fetch发出前即拒——Network零请求≠资源不存在；此前SyntaxError修复后按钮已活(控制台无错误)，卡在import语法形态。制度=①凡写import()必带相对前缀；②新闸=扫描注入块全部import()说明符强制前缀检查；③预检=先curl线上资源可达性再落补丁，补丁与资源互证
  ↳ 【MIME截流·第8课】CF Pages对.wasm发CT=text/javascript(两域GET实测)→compileStreaming拒收→回退分支次生v.get崩溃；Network见双304=浏览器缓存旧CT条目，Response重建须status:200缓冲整包(304/空体场景new Response(rs.body,{status:304})甩RangeError)。↳ 【闸门时序·第9课】v1垫片闸门正则未自测，崩于写盘后→&&链断：磁盘已改、commit未发生、轮询空等——半成品状态；制度=全部闸门先审候选字节，通过后才落盘，落盘后仅做字节比对(d2==disk)，commit永远只发生在「候选即磁盘」确认之后
  ↳ 【栈盲区·第10课】api日志已打=工厂+wasm实例化成功，v.get死在场景构建段；catch只渲染message进画布、零stack=修到第四层仍瞎。前次探针崩于「fail字面量不在盘」——中文在源码是\u5F15\u64CE转义形态，find中文必落空；因闸门在写盘前，磁盘零污染commit零发生(第9课立功)。制度=①锚点一律取ASCII段(}).catch(function(e){fail)；②fail路径必须console.error(err.stack)；③观测三件套=栈探针+调用点dump+未压缩库源码直查，之后才动刀
  ↳ 【变量名回声·第11课】栈探针一轮定罪：STACK>指向gd@127←rebuild@213(st.prevTh=gd(data.qpos,0))←then@288；data.qpos为typed array(无.get)，错误文本回声gd形参v=未压缩指纹；api全function+崩溃点在XML加载之后=模型已建成；修复=双模访问器v.get?v.get(i):v[i]覆盖全部读路径，poke写qvel[0]=v(mujoco_wasm用typed_memory_view暴露字段=活视图可写)；教训=①栈探针>一切猜测；②观测留任当哨兵。↳ 【工具自噬·第12课】DUALMODE脚本漏import re→崩于第18行闸门(写盘前)→零写入零提交零推送，POLL12 STALE=诚实回声(线上仍是探针版)；制度=①heredoc开头统一import块；②脚本崩溃≠业务失败，先看崩溃行号是否越过open(w)；③STALE先查「到底推没推」再怀疑管线
  ↳ 【画面升级·第13课】用户判定画面「假」——单摆本体是geom_rgba真数据，假的是地面/网格/灯光/背景四件硬编码+渲染器三缺(ACES/sRGB/shadowMap)；修复=Canvas现场生成studio渐变equirect→PMREMGenerator.fromEquirectangular→scene.environment(IBL反射)+Fog+ACESFilmicToneMapping+outputColorSpace=SRGB+PCFSoftShadowMap；不拉市面直链(第8课MIME/CORS三重雷)；备选=Poly Haven CC0 HDR入仓(先curl -I验CT)。制度=①画面质感两把钥匙=IBL+tone mapping，先拧这两把再谈贴图；②场景数据真≠画面真——材质与渲染配置决定90%观感
  ↳ 【前缀撞车·第16课】替换锚点取前缀ren.toneMapping，而toneMappingExposure已先换成window.__ren.toneMappingExposure——新串恰含旧前缀→断言count=2崩(写盘前，磁盘零伤，第9课三度兑现)；制度=①替换/断言锚点必须完整语句级(ren.toneMapping=THREE...;)，前缀互为子串必撞车；②git add -A是扫帚——粘贴回声行首>当重定向默默创建done/echo/fi/main/sleep五个空文件，若python成功即被扫入仓库；制度=git add只点名具体文件，工作区异常先git status；③清理流程=ls -la验体积→rm→status复查
  ↳ 【成员伪装·第18课】三轮ren迷案根凶=D1正则(\w+)=new匹配st.ren=new...时只捕获ren——st.前缀被截断，报出从未存在的裸变量名；c41ce08的VU引裸ren被自身catch接住(引擎尚活)；1a03afe把window.__ren=ren追加进190行initGL→内部ReferenceError→st.cam/st.ctl未建→上抛.catch→引擎死；P6全文地图20分钟定罪，栈证词190:77与毒点列号吻合。制度=①成员赋值≠变量声明：锚边界须(?<![\w.$])或全路径[\w.$]+，否则st.前缀截断造幽灵；②同一假设连败两次=立即回源码全文侦察，一轮读+一轮修=最少往返；③st对象是全模块共享状态仓，跨作用域一律st.xxx不用window桥；④VIS工艺：PMREM/渲染器配置once(st.envRT守卫)，environment/background/fog每rebuild赋新scene
  ↳ 【作用域盲区·第14课】(补录)VU引裸ren跨作用域，regex变量捕获必须验作用域；诊断方向正确、修法后被18课重判
  ↳ 【粘贴回声·第15课】(补录)日志粘回bash=噪音零伤害；行首>建空文件险被add -A扫入；curl(23)=grep -q命中关管道
  ↳ 【粘贴层损伤·第17课】(补录)heredoc内超长中文行被终端粘贴折断→SyntaxError解析期死亡、零执行零伤害；制度=heredoc行≤72列，长文案拆多次短write
  ↳ 【全读再修·第19课】同一假设连败两次=立即回源码全文；P0-P7一轮侦察+一轮手术=最短路径，侦察脚本只读零风险
  ↳ 【双伽马·第20课】CanvasTexture是sRGB像素，未标注colorSpace被当linear→输出再sRGB编码=整体发灰变亮；修复=贴图标注colorSpace(须在PMREM烘焙前)+渲染器输出colorSpace；r150/151无colorSpace API须双模守卫(SRGBColorSpace?colorSpace:encoding)；升级渲染管线先核three版本再选API形态
  ↳ 【无米下锅·第21课】data.html脱敏「前后一致」三案定性：接线三层全通(开关324/预览30/导出292-303)+规则=列名白名单(xlsx-core:119手机|身份证|邮箱等16词)+测试列零命中→no-op=按设计非bug；空列名已有守卫且优于拒绝(解析时自动命名列N,xlsx-core:49)；红点真身=badge-sens敏感徽章(nova-data:92,列名命中规则即现身)。制度=「特性没生效」四种可能:①死接线②规则未命中③时序未到④按设计静默——判决前必须读规则内容；接线通≠可见,有米才下锅
  ↳ 【xml降噪】loadModel三策略逐个warn改收集errs、全败才一条all-failed汇总；正常路径零警告，场景切换不再累积黄警(实测3→9→15无界增长)
  ↳ 【姓名PII·决策记录】第21课定性+用户续令，按产品立场代拍：页面自述「数据不出境」+个保法姓名属PII+开关默认关可逆→isSensitiveColumn白名单补姓名|；连锁=预览/导出打码、画像敏感徽章、AI摘要默认不含；回滚=删一个词；外链JS改动必戳缓存版本v3→v4
  ↳ 英文name列变体(user_name等)刻意缓刑：裸name子串误伤filename类列，等真实需求再上段锚正则
  ↳ rename_column空名边角：R1侦察输出在案待定性
  ↳ 【粘贴层损伤·第22课】heredoc内emoji(增补平面)经终端粘贴被编为CESU-8代理对(0xed开头)，Python解码stdin即SyntaxError——解析期死亡零执行零改动；与17课同族不同机制；制度=heredoc只用ASCII+BMP汉字
  ↳ 【同名孪生·第23课】M1锚点全文件x2=校验区/执行区各一份rename映射；上轮侦察窗口(120-190)只见校验区=窗口局部性偏差；assert唯一性守门写盘前拒绝=第三次零伤害；制度=锚点唯一性对全文件验证，双区模式(validate+execute)是本库常态，修校验区用边界法(以「执行受限变换」注释为界)，执行区孪生不碰(其作用域无tag变量,注入即ReferenceError)
  ↳ 【R1收刀落地】rename_column补to空/重名拒单、add_computed补as重名拒单(对照split_col自有标准)；缓存戳v4→v5；R-A/R-B/R-C调用链打印随跑在案
  ↳ 【第24课·软探针与硬闸门分离】REVISION正则按未压缩源码形态直取并assert(压缩构建里REVISION非直赋形态,实况见探针上下文转储)——记录字段竟成闸门杀死手术；制度=元数据只探针不assert(打印上下文留证)，assert只测正确性：标记唯一/span含靶/API五连/括号与长度精确delta；零伤害第四次兑现(死于首个open(w)之前)
  ↳ 【three r160 EOL·结案】警告=自托管钉版UMD构建自带(REV=160)，r160移除对钉版副本零影响；C案整句摘除console.warn换void 0(配平扫描+span含靶双防误切)，引用戳?v=2(旧戳归一+引号前瞻防.map误伤)；A案module化条件入册(重启=下次主动碰渲染管线；难点=urdf-loader.umd第二消费者+blk4内联IIFE就绪模式)；按钮层级缩水结案(robot.html零z-index/fixed，atcmd FAB顶层属面板设计)
  ↳ 【BACKLOG v1 立账】对标驱动优化总清单=docs/BACKLOG.md：P0=图表扩容+出境定性+徽章统一(各带动工前置RECON段)，P1=pdf三件+NL-DSL+mind+robot+品牌统一，P2=模板库/批量/整合/A案/别名守卫；结案存档区防重开
  ↳ 【P0-2 出境定性·结案】五处网络调用全=用户自配端点(baseUrl/imgBase+apiKey用户键入，migrate出处探针随跑在案)；qr/call=hash传参零服务端；E1静态零外链+D段定性=审计闭环，叙事定稿入BACKLOG
  ↳ 【P0-1 图表扩容·结案】area/hist/box 三型 vanilla SVG 落地（quantile+drawHist/drawArea/drawBox，分发+select+boundary 同步），nova-data v2→3 戳；热力图尾巴入 P1（第二维度选择器跨框架）
  ↳ 【第26课·多写者战场/记忆作废制】同仓同工作区并行会话对刀：P0-1 三发手术被闸拦下(守门7连零伤害)后，并行写手 31972ed 以另一套实现收编 area/hist/box 并 CLOSED——上轮 dump=快照非事实，每轮动刀前 git log 对表+区带重读；本会话尾刀只补其未覆盖象限=scatter 第7图+SW v14；读断言前置+写盘殿后=全或无；守门第8次=折行断言缺续行符解析期死亡(零执行零伤害)
  ↳ 【P0-1 七图总闭案】7/7 真渲染+SVG 下载+零回归；柱/折/饼(存量)+面积/直方/箱线(并行写手 31972ed)+散点(尾刀 90a4286)=三手联作无缝拼图；STALE=CDN 边缘假阴性(cache-buster 定性)；饼图图例 quirk 实拍入册
  ↳ 【第27课·星体面字符不过闸】徽章文案直书锁形emoji(U+1F512,4字节UTF-8)过终端heredoc被CESU-8化(0xED代理项首字节)，Py3.6解析期拒收(守门第9次,零执行零伤害)；制度=手术载荷中的emoji一律HTML实体&#128274;(纯ASCII传输,渲染等价)+载荷BMP断言(无4字节字符)——CJK三字节不受影响；【P0-3·A档】5敏感页徽章上线
  ↳ 【P0-3·A档闭案】5敏感页徽章实拍级验收(clean-URL探针+实体存活)；第28课=哨兵探canonical路由非文件路径(T2证据在手仍按习惯写.html,自首)；B档+tag统一→P1；P0三件套(七图/出境定性/敏感页徽章)全数闭案
  ↳ 【终扫双绿·浏览器实拍收尾】rename三笔=rename_column已执行+已应用1变换+敏感锁标(姓名/手机号)+零控制台错误；Robot终扫=a6028b2除警野外实证(UMD弃用零出现)+MuJoCo实时求解(steps=2153,T实测2.016s≈理论2.006s)+URDF滑条实时驱动(joints:3)+IBL/ACES/shadow就绪——本session工单全清(P0三件套+rename+robot)
  ↳ 【第29课·锚不誊抄=切片直取】旧行含异形字符（■/·/模板串）时不手工重打锚——从文件切片取旧行，新行只写BMP字符+BMP断言护航（27课延伸）；【图表小修包】pie图例div→<text>+tspan(div为HTML元素入SVG外来内容不渲染=实拍不可见根因)+clearChart首行挂载(拒单统一清场)+v5/v15配对bump(94348b3家规)
  ↳ 【图表小修包·野外验收】pie图例首现(div-in-svg死因根除,<text>+tspan随SVG下载归档)+拒单清场(clearChart统一清画布+禁陈图下载)+v5/v15配对生效——观察队列清偿2/3(余rename空新列名拒单=下小刀,先recon校验区归属)；第28课即时兑现:canonical探针poll0命中,40秒定谳
