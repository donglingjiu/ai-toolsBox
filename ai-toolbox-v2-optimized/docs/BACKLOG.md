# Nova 工具箱 · 优化 BACKLOG v1（对标驱动）

> 来源：线上产品对标侦察（ChatExcel / Stirling PDF / Foxglove / Gamma / XMind）+ RECON5/RECON-ALL 全站审计
> 纪律：每项动工前 RECON 定性（未读不开口，第21课）；实现=锚点手术+disk-verify+缓存戳+哨兵+UI验收；结案入册 ROADMAP
> 标记：[ ] 待做 / [~] 进行中 / [x] 结案 / [-] won'"'"'t-fix

## P0（对标核心缺口，本轮起逐项实现）

### [x] P0-1 data.html 图表种类扩容
- 尾刀（31972ed 后·本会话）：散点图补齐=第 7 图（drawScatter 维度X×度量Y 双数值，>400 点自动抽样，缺列/无值 toast 拒单）；nova-data ?v=3→v4；SW nova-v13→v14（并行写手 bump 了 JS 戳但未 bump SW，缓存优先下旧 data.html 不换代）；UI 验收=散点渲染+下载+6 旧图零回归
- 验收终笔（浏览器实拍+补测）：7/7 真渲染通过（直方 12 箱/箱线 Top20 组/散点抽样点云）+ SVG 下载 + 旧四图零回归；散点守卫 toast 逐字命中；STALE 哨兵=CDN 边缘假阴性（cache-buster 定性）；观察入册：hist/box 拒单保留旧画布、饼图图例 div-in-svg 不可见（实拍实锤，排队 <text> 小修）；P0-1 七图总闭案（柱/折/饼+面积/直方/箱线/散点=三手联作）
- 小修包（本会话）：饼图图例 div-in-svg→SVG <text>+tspan 色块（实拍不可见 quirk 修复；22px 行距与居中系数 11 自洽零改动）；clearChart() 挂 drawChart 首行=任意拒单（无维度/直方/箱线/散点/聚合空）统一清画布+禁下载，陈图不可导；nova-data ?v=4→v5 + SW v14→v15 配对 bump（循 94348b3 先例）；rename 空新列名拒单=下一小刀（需先 recon 校验区归属）
- 加时赛：rename 空新列名拒单 ✅（漏斗头 gate@applyOne 首行、try 之前=第一副作用之前：不变表、不入 OPS、无成功 toast；GPROBE 实证 gatherOp=纯构建器,applyOne=唯一漏斗,replay 直连绕行安全；原 build 行裸 return 计划作废,会吐 undefined；duplicate 新列名=新观察项）；nova-data v5→v6 + SW v15→v16 配对
- pdf 三件套 kickoff 卡（弹药已入库）：①双轨并存=legacy js/pdfjs/ 与 root pdf-lib(convert.html?v=11) 对 vendor pdf-lib(pdf.html)②cantoo 采纳决策(602K 零引用 vs 在用 512K)③pdf.html 七加载器 stamp 卫生(仅 annot?v=1 其余裸奔)④sw.js 预缓存清单含否 pdf 资产待查⑤引爆半径=23 处导航入口,大刀慢动⑥pdf 区零 TODO=干净；N4 rider 补充：root js/pdf-lib.min.js 与 vendor 同为 512.8KB=重复副本(dedup 候选)；pdfjs 双版本共存=legacy 312.5KB(在用) vs vendor 368.3KB(新弹药)，归一时需版本决策
- 证据：图表分析 tab + 生成图表 + 下载SVG 已存在（RECON5），d3.min.js vendor 已就位；对标 ChatExcel 主卖点
- 动工前置：RECON-ALL C 段定性现有图表种类，只补高频缺口（候选：直方图/箱线/面积/热力）
- 验收：新图表渲染正确 + SVG 下载 + 缓存戳 + 三场景零回归
- 判决：三型落地——面积图（line变体，闭合填充）/直方图（度量列12箱连续分箱）/箱线图（按维度分组五数概括，Top 20组）；全vanilla SVG零新依赖（d3.min.js在库不接线）；drawChart新增hist/box早退分支（需度量列）+area并入line数据管道（date-sort放宽）；缓存戳nova-data.js?v=2→3（cache-first硬要求，data.html走SWR自愈）；热力图尾巴→P1（需第二维度选择器，跨renderChartSelectors框架）。

### [x] P0-2 出境调用定性收尾（安全审计闭环）
- 证据：settings/skills fetch x1、tryon x2、migrate XHR x1（RECON5 E2）；数据不出境是全站核心叙事
- 动工前置：RECON-ALL D 段上下文 dump；定性=用户自配模型端点（合规，叙事闭环）或硬编码第三方（P0-2a 手术）
- 验收：定性结论入册；如有硬编码端点改为用户自配并缓存戳

- 判决：五处网络调用(settings:164/skills:150/tryon:106,127/migrate:189)全部=用户自配模型或图像端点(baseUrl/imgBase+apiKey用户键入，密钥仅存本地配置)；qr/call 中转=纯前端 location.hash 零服务端；叠加 E1 静态零外链=数据不出境审计闭环。叙事定稿：「文件与表格数据 100% 本地处理；AI 功能仅按需调用你自配的模型端点，密钥只存本机」

### [x] P0-3 「100% 本地处理」徽章全站统一
- 进展（本会话）：A 档 5 敏感页徽章上线（mood/brain/resume/tryon/qr）——boundary 形态+内联样式（5 页均未引 nova-docs.css，qr 连 style.css 亦无）；文案逐页对表 P0-2 审计+页内既有声明（AI 页=主动触发+自配端点+密钥本机，qr=哈希中转零服务器）；插入锚=各页 page-sub/sub 唯一行后；emoji=HTML 实体（第 27 课）；待 UI 验收 5 页实拍
- 验收终笔：5 页 clean-URL 探针 boundary x1 + 实体 x1（第 27 课实体全链路存活）；哨兵误报=.html 非 canonical（第 28 课：探 canonical 路由）；B 档 21 页+散沙 tag 统一降 scope 至 P1（原 26 页口径收窄=敏感页先装，其余页已有散落诚实声明不构成误导）
- 证据：robot 页有完整徽章、多数页文案弱（RECON5）；差异化卖点必须可视化
- 动工前置：RECON-ALL F 段普查密度，出补齐清单
- 验收：26 页头牌一致；缓存戳批次 bump；截图对比入册

## P1（功能密度补齐）

- [ ] P1-热力图：data.html 图表第二维度（维度×维度热力矩阵+色标），P0-1 收尾移出项——需 renderChartSelectors 增第二维度选择器

- [ ] P1-1 pdf.html 补高频三件：压缩分级 / 图片互转 / PDF加密（对标 Stirling PDF）
- [ ] P1-2 data.html NL→受限变换 DSL：本地规则引擎一句话操作，零云端（对标 ChatExcel 一句话体验）
- [ ] P1-3 mind.html PNG 导出 + 节点直编辑评估（对标 XMind）
- [ ] P1-4 robot.html 碰撞几何 toggle + 关节滑块直控（对标 Foxglove / urdf-loaders editor）
- [ ] P1-5 老工具箱页设计语言统一：emoji h1 → Nova 星系品牌（RECON-ALL I 段出清单后分批）

## P2（观察 / 缓刑 / 挂账）

- [ ] P2-1 ppt 模板库（对标 Gamma）
- [ ] P2-2 批量文件队列
- [ ] P2-3 excel.html 与 data.html 整合（RECON-ALL 定性后定去留）
- [ ] P2-4 qr 中转链路定性（D 段后决定）
- [ ] P2-5 A案 three module 化（重启条件=主动碰渲染管线）
- [ ] P2-6 group_aggregate as 别名撞车守卫
- [ ] P2-7 英文列 name 变体审计

## 结案存档（本 session，勿重开）

- [x] data.html：脱敏白名单（姓名 PII）/ rename+add_computed 守卫 / 缓存戳纪律 / validate-then-execute 架构定性
- [x] robot.html：three r160 末代 UMD 摘警（REV=160）→ 控制台零噪音；按钮层级缩水结案（零 z-index）
- [x] 全站：外链 CDN 扫描零命中（静态资源层数据不出境审计通过）
- [x] 课程入册：21 无米下锅 / 22 emoji 粘贴污染 / 23 同名孪生 / 24 软探针与硬闸门分离；assert 守门制四次零伤害
