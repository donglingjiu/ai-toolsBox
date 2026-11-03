# Nova 工具箱 · 优化 BACKLOG v1（对标驱动）

> 来源：线上产品对标侦察（ChatExcel / Stirling PDF / Foxglove / Gamma / XMind）+ RECON5/RECON-ALL 全站审计
> 纪律：每项动工前 RECON 定性（未读不开口，第21课）；实现=锚点手术+disk-verify+缓存戳+哨兵+UI验收；结案入册 ROADMAP
> 标记：[ ] 待做 / [~] 进行中 / [x] 结案 / [-] won'"'"'t-fix

## P0（对标核心缺口，本轮起逐项实现）

### [ ] P0-1 data.html 图表种类扩容
- 证据：图表分析 tab + 生成图表 + 下载SVG 已存在（RECON5），d3.min.js vendor 已就位；对标 ChatExcel 主卖点
- 动工前置：RECON-ALL C 段定性现有图表种类，只补高频缺口（候选：直方图/箱线/面积/热力）
- 验收：新图表渲染正确 + SVG 下载 + 缓存戳 + 三场景零回归

### [ ] P0-2 出境调用定性收尾（安全审计闭环）
- 证据：settings/skills fetch x1、tryon x2、migrate XHR x1（RECON5 E2）；数据不出境是全站核心叙事
- 动工前置：RECON-ALL D 段上下文 dump；定性=用户自配模型端点（合规，叙事闭环）或硬编码第三方（P0-2a 手术）
- 验收：定性结论入册；如有硬编码端点改为用户自配并缓存戳

### [ ] P0-3 「100% 本地处理」徽章全站统一
- 证据：robot 页有完整徽章、多数页文案弱（RECON5）；差异化卖点必须可视化
- 动工前置：RECON-ALL F 段普查密度，出补齐清单
- 验收：26 页头牌一致；缓存戳批次 bump；截图对比入册

## P1（功能密度补齐）

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
