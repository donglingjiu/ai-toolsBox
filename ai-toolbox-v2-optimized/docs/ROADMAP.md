# ROADMAP · v2.3 统一与扩展

> 立项：2026-10-28 深夜（v2.2-nova-complete 合龙当晚）。
> 三条诉求：① 四工作台功能对标市场产品并扩展；② 界面偏暗黑，不够高级温暖；③ 新（Nova 暗色）旧（legacy 暖色）两套界面不统一。
> 方法论：按用户自有 web-delivery-team 总编排执行，改版路径=「阶段 1-2 压缩成一次确认，直接进阶段 3-4」。

## 一、侦察实证（2026-10-28 深夜，已读源）

### nebula-tools/web（Nova AI 静态前后台原型 V6）
- 30+ 页面：ai 对话 / workspace 文件处理 / workflows 流程编排 / mindmap / flowchart / analytics / requirements / developer / admin 后台 10 页。
- 视觉：统一基底 + 分区气质——工作区海天蓝白+珍珠白+淡紫，主页水晶星环，后台深蓝侧栏，开发工具用深色编辑器。
- tokens 坐标：web/assets/nova-tokens.css（另有 nova-v6.css / experiences.css / 星环素材）。
- design-reference/approved-single-page/ 13 张审定参考图；DESIGN_NOTES / QA_REPORT 齐备。
- 判定：与 ai-toolsBox 的 Nova 同品牌。nebula 浅色系=诉求②的现成答案，也是诉求③的统一基底。

### nebula-tools Go 后端（tools.go 已读）
- 17 工具：JSON / MD转HTML / 编码 / 哈希 / SQL格式化 / 时间·UUID / 文本对比 / 二维码 / 进制 / 密码 / CSV·JSON互转 / PDF提取 / Excel转CSV / Word提取 / 图片压缩。
- llmproxy.go：服务端 LLM 代理=远期可选「服务端 Key 模式」。

### 三份技能库（方法论，执行时现读）
- web-delivery-team：8 阶段调度表 + 阶段门 + 交付物清单。
- frontend-builder：五红线（零新依赖 / 导入复制 / 样式复制 / 禁自造图标 / 布局对齐）+ 审美方向先行。
- AutoDev：计划→开发→交付；模块 Skill 随仓入库。

## 二、决策点（用户确认后才动工）
- D1 统一基底：A=nebula 海天蓝白+柔紫（推荐，13 张参考图背书）；B=暖米色升级版。
- D2 平移形态：A=纯前端客户端实现（推荐，守住零后端架构）；B=接入 nebula-server。
- D3 导航扩张：Nova 四工作台 → 六工作台（+Chat 对话台，蓝本 ai.html；+Tools 工具集）？

## 三、Phase A 设计统一（最高优先，先试点后铺开）
1. 提取 web/assets/nova-tokens.css → 建 css/tokens-light.css。
2. 试点两页：mind.html（Nova 系代表）+ prompts.html（legacy 系代表）→ 用户验收。
3. 验收后全量：Nova 四页 → legacy 12 页 → 首页。
4. 红线照抄 frontend-builder；缓存戳递增。

## 四、Phase B 功能平移（客户端可行性）
- 直接：JSON、编码、进制、密码、时间·UUID、CSV↔JSON（SheetJS 在库）、MD→HTML（marked 在库）、二维码（qrcode-generator 在库）、图片压缩（canvas）、PDF 提取（pdf.js 在库）。
- 中等：哈希（WebCrypto；MD5 需小库）、文本 diff（逐行简版）、SQL 格式化（轻量格式化器）。
- 新页：Chat 对话工作台（llmChat 基建现成，蓝本 nebula ai.html）。

## 五、Phase C 四工作台对标扩展（逐个 gap 分析）
- Docs vs Notion AI / Gamma；Data vs Julius / Rows；Mind vs XMind / Whimsical（PNG 导出 / 节点编辑 / 多布局）；Flow vs Dify / Coze（节点类型 / 变量传递 / 配置导出）。

## 六、执行纪律
阶段过门再走；大改造留白天，夜里只做小针；ES5 无反引号；uXXXX 转义传输；只探后改；每次提交后 CF 实测。