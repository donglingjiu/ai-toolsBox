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
| index.html | 首页导航（10 大工具） |
| qr.html + call.html | 艺术挪车码：4 主题（白羊座/六芒星/星月/简约），AES-GCM 隐私中转——扫码只看到「点击拨打」按钮 |
| ppt.html | AI 演示（PPT）：主题/粘贴大纲/导入文档/**上传PPT** 四种入口 → 大纲可编辑 → 一键成稿 → 5 套主题、原生可编辑 PPTX（含图表）、演示网页、打印 PDF。上传 .pptx 会逐页提取文字，由 AI 诊断问题并重排优化 |
| convert.html | Word→PDF / PDF→Word（浏览器本地转换，文件不上传） |
| resume.html | AI 简历优化：STAR 重写 + 关键词覆盖率 + 模拟面试官追问 |
| brain.html | 本地第二大脑：文档导入 → BM25 检索 → 带引用问答 → 周报 |
| advisor.html | AI 副业顾问：3 个可落地方向 + 30 天起步计划 |
| mood.html | 情绪日记：本地记录 + 30 天曲线 + AI 周报 + 连续低落预警 |
| tryon.html | AI 试衣间：人像+服装 → 试穿效果图（需图像编辑 API） |
| prompts.html | 提示词工具库：123 个工具、12 分类、搜索、收藏、占位符表单一键执行 |
| settings.html | API 配置（文本模型 + 图像模型）与本地数据管理 |

## API 配置 / API Setup

进入「设置」页填入任意 OpenAI 兼容服务：

- DeepSeek：`https://api.deepseek.com/v1` + `deepseek-chat`
- 通义：`https://dashscope.aliyuncs.com/compatible-mode/v1` + `qwen-plus`
- Kimi：`https://api.moonshot.cn/v1` + `moonshot-v1-8k`
- OpenAI：`https://api.openai.com/v1` + `gpt-4o-mini`

AI 试衣需额外配置支持 `/images/edits` 多图输入的图像模型（如 gpt-image-1）。

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
