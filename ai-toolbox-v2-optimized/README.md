# AI 工具箱（AI Toolbox）

纯静态工具站：无需服务器、无需数据库，所有 AI 能力通过你自己的 OpenAI 兼容 API 实现，Key 只保存在你浏览器本地。

A pure-static toolbox site: no backend needed. All AI features run through your own OpenAI-compatible API; keys stay in your browser only.

## 本地使用 / Run Locally

```bash
cd ai-toolbox-site
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

或直接双击 `index.html`（部分浏览器对 file:// 下的 fetch 有限制，推荐用上面的小服务器）。

## 功能一览 / Features

| 页面 | 功能 |
|---|---|
| index.html | 首页导航（11 大工具） |
| qr.html + call.html | 艺术挪车码：4 主题（白羊座/六芒星/星月/简约），AES-GCM 隐私中转——扫码只看到「点击拨打」按钮 |
| excel.html | **表格分析工具**：上传 .xlsx/.xls/.csv → 本地解析与数据画像 → 按目标让 AI 生成「受限整理方案」→ 确认后本地确定性执行 → 导出 Excel/CSV/分析说明。整表数据默认不上传，仅发送列摘要+样本行，疑似敏感列默认脱敏 |
| ppt.html | AI 演示（PPT）：主题/粘贴大纲/导入文档/**上传PPT** 四种入口 → 大纲可编辑 → 一键成稿 → 5 套主题、原生可编辑 PPTX（含图表）、演示网页、打印 PDF。上传 .pptx 会逐页提取文字，由 AI 诊断问题并重排优化 |
| convert.html | Word→PDF / PDF→Word（浏览器本地转换，文件不上传） |
| resume.html | AI 简历优化：STAR 重写 + 关键词覆盖率 + 模拟面试官追问 |
| brain.html | 本地第二大脑：文档导入 → BM25 检索 → 带引用问答 → 周报 |
| advisor.html | AI 副业顾问：3 个可落地方向 + 30 天起步计划 |
| mood.html | 情绪日记：本地记录 + 30 天曲线 + AI 周报 + 连续低落预警 |
| tryon.html | AI 试衣间：人像+服装 → 试穿效果图（需图像编辑 API） |
| prompts.html | 提示词工具库：123 个工具、12 分类、搜索、收藏、占位符表单一键执行 |
| settings.html | API 配置（**多套文本模型 Profile + 默认切换 + 失败自动兜底** + 图像模型）与本地数据管理 |

## API 配置 / API Setup

进入「设置」页，以「多套配置（Profile）」方式管理任意 OpenAI 兼容服务，可随时切换默认、开启失败自动兜底：

- DeepSeek：`https://api.deepseek.com/v1` + `deepseek-chat`
- 通义千问：`https://dashscope.aliyuncs.com/compatible-mode/v1` + `qwen-plus`
- 智谱 GLM：`https://open.bigmodel.cn/api/paas/v4` + `glm-4-flash`
- MiniMax：`https://api.minimax.chat/v1` + `abab6.5s-chat`
- Kimi：`https://api.moonshot.cn/v1` + `moonshot-v1-8k`
- OpenAI：`https://api.openai.com/v1` + `gpt-4o-mini`
- 扣子 Coze：`https://api.coze.cn/v1`

多 Profile 说明：

- **默认切换**：可保存多套配置，指定其中一套为「默认」；未指定时自动选启用项中优先级最高者。
- **失败自动兜底（可选开关）**：开启后，默认配置调用失败时按优先级自动尝试下一套。仅对「可重试」错误（网络/超时/408/429/5xx/返回格式错误）触发；对取消、400/401/403（鉴权/参数错误）不切换；一旦已开始输出（流式）则不再切换，避免内容错乱。默认关闭。
- **接口地址会被安全清洗**：只保留 origin+path，剥离 query/fragment 与内嵌账号密码，且强制 https（本地调试可用 http://localhost）。

AI 试衣需额外配置支持 `/images/edits` 多图输入的图像模型（如 gpt-image-1）。

> ⚠️ 关于安全：模型 Key 以**明文**保存在浏览器 `localStorage`（键 `at_settings_v1`），并非加密存储。请勿在公共/共享设备上保存 Key；不再使用时可在「设置」页一键「仅清除模型密钥」或「清空全部本地数据」。

## 隐私说明 / Privacy

- 挪车码隐私中转：手机号经 AES-256-GCM 加密后编码进链接，扫码者只能看到拨打按钮；但点击拨打时仍会暴露真实号码，彻底隐藏请使用运营商副号/虚拟号（将虚拟号填入生成即可）。
- 情绪日记、第二大脑、收藏等全部数据仅存于本机浏览器。
- AI 功能只会把你主动提交的内容发送到你自己配置的 API 服务商。

## 本次优化记录 / Optimizations

在 v2 基础上做了两处关键修复与增强：

1. **修复 `js/app.js` 的 `el()` 致命 bug**：原实现将 `el` 定义为 `querySelector`，但 6 个页面（简历/第二大脑/副业顾问/情绪日记/试衣/提示词库，共 60+ 处）以 `el('div',{…}, child)` 工厂方式调用它来动态渲染 DOM，导致这些页面的动态内容无法正常生成。现将 `el()` 重写为轻量 `createElement` 工厂（支持 class/style/html/on事件/dataset/子节点递归），`$` 独立指向 `querySelector`，一处修复即恢复全部受影响页面。
2. **补齐 AI 演示（ppt.html）的全站导航**：v2 仅在首页放了入口，其余工具页顶部导航缺少「AI 演示」链接，现已在全部工具页导航中补齐，保持全站一致。

其余能力（本地内置 pptxgen / mammoth / pdf-lib / pdfjs 等依赖、离线可用、AI 演示的三入口 + 大纲可编辑 + 原生图表 PPTX）均沿用 v2 的设计。

3. **AI 演示新增「上传PPT」模式**：新增第 4 个输入入口，可上传已有 `.pptx` 文件。纯浏览器解析（把 .pptx 当作 ZIP，用原生 `DecompressionStream('deflate-raw')` 解压 `ppt/slides/slideN.xml`，正则提取 `<a:t>` 文字并按段落聚合，同时读取演讲者备注），无需任何第三方解压库、文件不上传。提取的逐页文字交由你自己配置的 AI 先输出「优化说明」再产出重排后的优化大纲，随后走原有大纲→成稿管线，导出全新的可编辑 PPTX/演示网页/PDF。仅支持 .pptx（旧版 .ppt 需先另存为 .pptx），纯图片型幻灯片因无文字可提取会有提示。

## v3 增强 / v3 Enhancements

本次新增「表格分析工具」并重构 API 设置：

4. **表格分析工具（excel.html + js/xlsx-core.js + js/excel-page.js）**
   - **本地解析**：基于 SheetJS 解析 .xlsx/.xls/.csv，生成数据画像（行列数、每列类型/非空/唯一值/空值，数值列附 min/max/mean）。
   - **AI 只见摘要**：调用 AI 时仅发送「列信息摘要 + 前几行样本」，**整表数据不发送**；姓名/手机/邮箱/身份证/地址/密码/银行卡等疑似敏感列默认以 `***` 脱敏（含数值统计一并屏蔽），可显式勾选后才发送真实值。
   - **受限整理 DSL**：AI 只能返回白名单操作的 JSON 方案（`select_columns / rename_column / filter_rows / sort_rows / dedupe_rows / trim_text / coerce_number / group_aggregate / add_computed`），聚合仅 `sum/count/avg/min/max`。方案先经严格校验（列名必须存在、操作/聚合必须在白名单内），确认后由**本地确定性引擎**执行——模型永远不会产出可执行 JS、公式或外链。
   - **防公式注入导出**：导出的文本单元格若以 `= + - @` 开头会自动加前导 `'`，避免在 Excel 中被当作公式执行。
   - **可离线单测**：核心逻辑与 UI 分离，`js/xlsx-core.js` 提供 Node `module.exports`，配套 20 项单测覆盖解析/画像/脱敏/校验/执行/导出/JSON 提取。

5. **API 设置重构为多 Profile + 失败兜底**：由单一接口升级为「多套 OpenAI 兼容配置」，支持预设一键填充、默认切换、逐条测试连通性、启用/禁用、编辑/删除，以及可选的「失败自动兜底」。接口地址统一做安全清洗（仅 origin+path、剥离账号密码、强制 https）。旧的单一 `apiBase/apiKey/model` 配置会在首次加载时自动迁移为一条默认 Profile（仅内存补齐，不擅自写回存储）。配套 30 项单测覆盖 URL 清洗、迁移、默认选取、故障链顺序、错误分类与切换行为。

## 第三方依赖 / Third-party Dependencies

均为本地打包、离线可用，无 CDN 依赖：

| 依赖 | 用途 | 许可证 |
|---|---|---|
| SheetJS (xlsx) 0.18.5 · `js/vendor/xlsx.full.min.js` | 表格分析工具的 xlsx/xls/csv 解析与导出 | Apache-2.0 |
| pptxgenjs · `js/pptxgen.bundle.js` | 生成可编辑 PPTX | MIT |
| mammoth.js · `js/mammoth.browser.min.js` | Word(docx) 提取文本 | BSD-2-Clause |
| pdf-lib · `js/pdf-lib.min.js` | 生成/编辑 PDF | MIT |
| pdf.js · `js/pdfjs/` | PDF 解析渲染 | Apache-2.0 |
| qrcode-generator · `js/vendor/qrcode-generator.js` | 二维码生成 | MIT |

## 与商业化表格工具的定位对比 / Positioning

> 说明：下表为**产品定位对比**，用于说明本工具的取舍；商业产品的具体能力以其官网为准，本项目在离线环境构建，未对各家做实测评测。

| 维度 | 本工具（表格分析） | 典型商业方案（如 Excel/Sheets 内置 AI、WPS AI、ChatGPT 数据分析等） |
|---|---|---|
| 部署 | 纯静态、无后端、可离线 | 云端服务，需登录/订阅 |
| 数据出域 | 整表不出域，仅摘要+样本，敏感列脱敏 | 通常需上传数据到云端处理 |
| AI 角色 | 只产出「受限操作方案」，本地确定性执行 | 直接由模型生成结果/代码，可能不可复现 |
| 可解释性 | 每步操作可读、可确认、可导出说明 | 依产品而异，部分为黑盒 |
| 计算范围 | 白名单内的筛选/排序/去重/分组聚合/计算列 | 覆盖更广（透视表、图表、自然语言即席分析等） |
| 成本 | 用自己的 API Key，按量自付 | 多为订阅制 |

定位取舍：本工具优先**隐私可控 + 结果可复现**，适合「让 AI 出方案、由本地按确定规则整理」的场景；需要复杂即席分析、可视化图表或超大数据集时，成熟商业方案仍更全面。
