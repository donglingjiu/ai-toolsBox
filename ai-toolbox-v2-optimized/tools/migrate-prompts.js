#!/usr/bin/env node
/* =============================================================
 * migrate-prompts.js —— PROMPT_TOOLS(123条) → skills-builtin.data.js
 * 数据源：js/prompts.js 的 const PROMPT_TOOLS = [{name,cat,audience,score,prompt}]
 * 用法（Node ≥18，需 env OPENAI_API_KEY）：
 *   node tools/migrate-prompts.js --parse    # 解析提取 → .migrate-raw.json
 *   node tools/migrate-prompts.js --enrich   # AI 重构（断点续跑，Ctrl+C 可中断）
 *   node tools/migrate-prompts.js --out      # 生成 js/skills/skills-builtin.data.js
 * ============================================================= */
const fs = require('fs');
const path = require('path');

const SRC   = path.resolve(__dirname, '../js/prompts.js');
const RAW   = path.resolve(__dirname, '.migrate-raw.json');
const CACHE = path.resolve(__dirname, '.migrate-cache.json');
const OUT   = path.resolve(__dirname, '../js/skills/skills-builtin.data.js');
const REVIEW = path.resolve(__dirname, 'skills-review.md');

/* ---- 步骤1：解析 js/prompts.js（纯数据文件，Function 沙箱执行） ---- */
function parse() {
  const src = fs.readFileSync(SRC, 'utf8');
  const PROMPT_TOOLS = new Function(src + '\nreturn PROMPT_TOOLS;')();
  if (!Array.isArray(PROMPT_TOOLS) || !PROMPT_TOOLS.length) { console.error('✗ 解析失败：PROMPT_TOOLS 为空'); process.exit(1); }
  const raw = PROMPT_TOOLS.filter(t => t.prompt && t.name).map(t => ({
    title: String(t.name).trim(), category: String(t.cat || '未分类').trim(),
    audience: Array.isArray(t.audience) ? t.audience : [],
    origScore: t.score || 0, content: String(t.prompt).trim() }));
  fs.writeFileSync(RAW, JSON.stringify(raw, null, 2));
  const cats = [...new Set(raw.map(i => i.category))];
  console.log('✓ 解析 ' + raw.length + ' 条（预期 123）');
  console.log('  分类(' + cats.length + '): ' + cats.join(' / '));
}

/* ---- 步骤2：AI 重构（每条落盘缓存，断点续跑） ---- */
const META = '你是一名提示词工程师。将下面的原始提示词重构为标准 Skill，只输出一个 JSON 对象（不要 markdown 代码块包裹）。\n' +
  'Schema: {"name":"小写连字符英文标识(从中文标题意译，简洁达意)","description":"15~60字，必须包含明确触发场景(当用户…时使用)","category":"沿用给定分类","tags":["3-5个中文"],"use_cases":["2-3个，参考受众"],"body":"markdown正文，统一用##二级标题(原文的# 角色/# 任务/# 约束/# 输出格式/# 示例 分别映射为 ## 角色/## 操作步骤/## 边界约束/## 输出格式/## 示例，缺失段补写)，必须包含 ## 角色、## 操作步骤、## 输出格式、## 边界约束 四段；原文所有 [请填写X] 和 [X] 形式的可变占位一律转成 {{X}}","quality":{"role_clarity":0-5,"constraints":0-5,"verifiable":0-5,"examples":0-5,"boundary":0-5}}\n' +
  '要求：专业、职业、保质保量；保留原文全部有效指令与约束；广告法禁用词等敏感边界写入边界约束；quality 按 0-5 打分（可 0.5 步进）。\n' +
  '原始提示词：\n---\nTITLE: {title}\nCATEGORY: {category}\nAUDIENCE: {audience}\nCONTENT: {content}';

async function enrich() {
  if (!process.env.OPENAI_API_KEY) { console.error('✗ 需要 env: OPENAI_API_KEY（可配 OPENAI_BASE_URL / OPENAI_MODEL）'); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  let done = 0;
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    const key = 'k' + Buffer.from(item.title).toString('base64').slice(0, 16);
    if (cache[key]) { done++; continue; }
    process.stdout.write('\r重构中 ' + (i + 1) + '/' + raw.length + ' …');
    const prompt = META.replace('{title}', item.title).replace('{category}', item.category)
      .replace('{audience}', item.audience.join('、') || '通用').replace('{content}', item.content);
    for (let retry = 0; retry < 3; retry++) {
      try {
        const res = await fetch(base + '/chat/completions', { method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
          body: JSON.stringify({ model, temperature: 0.3, response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }] }) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const out = JSON.parse((await res.json()).choices[0].message.content);
        out.name = String(out.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        out.category = item.category; out.author = 'ai-toolbox';
        cache[key] = out; done++;
        fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));   // 每条落盘：随时 Ctrl+C 续跑
        break;
      } catch (e) {
        if (retry === 2) console.error('\n✗ 「' + item.title + '」失败: ' + e.message + '（重跑 --enrich 即续）');
        else await new Promise(r => setTimeout(r, 1500 * (retry + 1)));
      }
    }
  }
  console.log('\n✓ 重构完成 ' + done + '/' + raw.length + '（缓存 ' + Object.keys(cache).length + ' 条）');
}

/* ---- 步骤3：生成产物 + 人工复核清单 ---- */
function genOut() {
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const skills = [], review = ['# Skill 迁移人工复核清单（阶段门：抽检合格率 ≥90%）', ''];
  const seen = new Set();
  for (const item of raw) {
    const key = 'k' + Buffer.from(item.title).toString('base64').slice(0, 16);
    const s = cache[key];
    if (!s || !s.name) { review.push('- [ ] ❌ 未重构：' + item.title); continue; }
    if (seen.has(s.name)) s.name += '-' + Math.random().toString(36).slice(2, 5);
    seen.add(s.name);
    const desc = s.description || '';
    const ok = desc.length >= 15 && /(当|如果|用于|需要|时)/.test(desc);
    skills.push({ name: s.name, description: desc, category: s.category, version: '1.0.0',
      author: 'ai-toolbox', tags: s.tags || [], use_cases: s.use_cases || item.audience,
      expert_injection: 'none', body: s.body || '',
      quality: s.quality || { role_clarity: 3, constraints: 3, verifiable: 3, examples: 3, boundary: 3 },
      usage_count: 0, created_at: new Date().toISOString().slice(0, 10) });
    if (!ok) review.push('- [ ] ⚠️ description 缺触发语义：' + s.name + ' → ' + desc);
    if (!/\{\{.+?\}\}/.test(s.body || '') && /\[.+?\]/.test(s.body || '')) review.push('- [ ] ⚠️ 占位符未转换：' + s.name);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, '/* 自动生成：tools/migrate-prompts.js，请勿手改 */\n' +
    'window.AT_SKILLS_BUILTIN = ' + JSON.stringify(skills, null, 1) + ';\n' +
    'window.AT_SKILLS_BUILTIN_META = { version: "1.0.0", count: ' + skills.length + ', generatedAt: "' + new Date().toISOString() + '" };\n');
  fs.writeFileSync(REVIEW, review.join('\n') + '\n\n共 ' + skills.length + ' 条入库，' + (raw.length - skills.length) + ' 条待补。抽检建议：每分类抽 2 条核对 description 触发词与 body 结构。\n');
  console.log('✓ 已生成 ' + OUT + '（' + skills.length + ' 条）');
  console.log('✓ 复核清单 ' + REVIEW);
  console.log('  待复核项：' + Math.max(0, review.length - 1) + ' 条');
}

const arg = process.argv[2];
if (arg === '--parse') parse();
else if (arg === '--enrich') enrich();
else if (arg === '--out') genOut();
else console.log('用法: node tools/migrate-prompts.js --parse | --enrich | --out');
