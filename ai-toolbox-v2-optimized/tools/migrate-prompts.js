#!/usr/bin/env node
/* =============================================================
 * migrate-prompts.js —— 123 个提示词 → skills-builtin.data.js
 * 用法：
 *   node tools/migrate-prompts.js --parse            # 步骤1：解析提取，产出 .migrate-raw.json
 *   node tools/migrate-prompts.js --enrich           # 步骤2：AI 重构（需 env，断点续跑）
 *   node tools/migrate-prompts.js --out              # 步骤3：生成 js/skills/skills-builtin.data.js
 * env: OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL
 * ============================================================= */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../ai-toolbox-site/prompts.html');   // ← 适配点：源文件路径
const RAW_FILE = path.resolve(__dirname, '.migrate-raw.json');
const CACHE_FILE = path.resolve(__dirname, '.migrate-cache.json');       // AI 重构缓存（断点续跑）
const OUT_FILE = path.resolve(__dirname, '../ai-toolbox-site/js/skills/skills-builtin.data.js');
const REVIEW_FILE = path.resolve(__dirname, 'skills-review.md');         // 人工复核清单

/* ---------- 步骤 1：解析 prompts.html ---------- */
function parse() {
  const html = fs.readFileSync(SRC, 'utf8');
  let items = [];
  /* 策略A：内联 JS 数据（常见 const PROMPTS = [...]） */
  const m = html.match(/(?:const|let|var)\s+(PROMPTS|prompts|PROMPT_LIST)\s*=\s*(\[[\s\S]*?\]);/);
  if (m) {
    try { items = eval(m[2]); } catch { /* fallthrough */ }
  }
  /* 策略B：DOM 卡片提取（适配点：按实际 class 名调整） */
  if (!items.length) {
    const cardRe = /<div class="prompt-card[^"]*"[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>([\s\S]*?)<\/div>\s*(?=<div class="prompt-card|<\/main|$)/g;
    let mm; const bodyRe = /<pre[^>]*>([\s\S]*?)<\/pre>|<code[^>]*>([\s\S]*?)<\/code>/;
    while ((mm = cardRe.exec(html))) {
      const body = (html.slice(mm.index, cardRe.lastIndex).match(bodyRe) || [])[1]
        ?.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim() || '';
      const cat = (html.slice(mm.index, cardRe.lastIndex).match(/data-cat="([^"]+)"/) || [])[1] || '未分类';
      items.push({ title: mm[1].trim(), category: cat, body });
    }
  }
  if (!items.length) { console.error('✗ 解析失败：请按实际 HTML 结构调整策略A/B 的正则（见“适配点”注释）'); process.exit(1); }
  const raw = items.filter(i => i.body && i.title);
  fs.writeFileSync(RAW_FILE, JSON.stringify(raw, null, 2));
  console.log(`✓ 解析 ${raw.length} 条（预期 123，缺失请核对源文件）`);
  const cats = [...new Set(raw.map(i => i.category))];
  console.log('  分类:', cats.join(' / '));
}

/* ---------- 步骤 2：AI 重构（元提示词 → SKILL.md 六段式） ---------- */
const ENRICH_META_PROMPT = `你是一名提示词工程师。将下面的原始提示词重构为标准 Skill，只输出 JSON。
Schema: {"name":"小写连字符英文标识","description":"15~60字，必须包含明确触发场景（当用户…时使用）","category":"沿用原文分类","tags":["..."],"use_cases":["..."],"body":"markdown正文，必须包含 ## 角色、## 操作步骤、## 输入参数、## 输出格式、## 边界约束 五段（有示例加 ## 示例），可变内容写成 {{参数名}} 占位符","quality":{"role_clarity":0-5,"constraints":0-5,"verifiable":0-5,"examples":0-5,"boundary":0-5}}
要求：专业、职业、可直接投入使用；保留原文全部有效指令；补齐缺失段；广告法等敏感边界写入边界约束。
原始提示词：
---
TITLE: {title}
CATEGORY: {category}
CONTENT: {content}`;

async function enrich() {
  if (!process.env.OPENAI_API_KEY) { console.error('✗ 需要 env: OPENAI_API_KEY（与 OPENAI_BASE_URL / OPENAI_MODEL）'); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  let done = 0;
  for (const [i, item] of raw.entries()) {
    const key = 'k' + Buffer.from(item.title).toString('base64').slice(0, 16);
    if (cache[key]) { done++; continue; }
    process.stdout.write(`\r重构中 ${i + 1}/${raw.length} …`);
    const prompt = ENRICH_META_PROMPT.replace('{title}', item.title)
      .replace('{category}', item.category).replace('{content}', item.body);
    for (let retry = 0; retry < 3; retry++) {                    // 三次重试
      try {
        const res = await fetch(base.replace(/\/$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
          body: JSON.stringify({ model, temperature: 0.3,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const out = JSON.parse((await res.json()).choices[0].message.content);
        out.name = String(out.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        out.category = item.category; out.author = 'ai-toolbox';
        cache[key] = out; done++;
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); // 每条落盘：Ctrl+C 可续跑
        break;
      } catch (e) { if (retry === 2) console.error(`\n✗ 「${item.title}」失败: ${e.message}（已跳过，重跑即续）`); else await new Promise(r => setTimeout(r, 1500 * (retry + 1))); }
    }
  }
  console.log(`\n✓ 重构完成 ${done}/${raw.length}（缓存 ${Object.keys(cache).length} 条）`);
}

/* ---------- 步骤 3：生成产物 + 人工复核清单 ---------- */
function genOut() {
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  const skills = [], review = ['# Skill 迁移人工复核清单（阶段门：抽检合格率 ≥90%）', ''];
  const seen = new Set();
  for (const item of raw) {
    const key = 'k' + Buffer.from(item.title).toString('base64').slice(0, 16);
    const s = cache[key]; if (!s) { review.push(`- [ ] ❌未重构：${item.title}`); continue; }
    if (seen.has(s.name)) s.name += '-' + Math.random().toString(36).slice(2, 5);
    seen.add(s.name);
    /* 阶段门自动检查：description 含触发语义 */
    const hasTrigger = /(当|如果|用于|需要|时)/.test(s.description || '') && (s.description || '').length >= 15;
    skills.push({ ...s, version: '1.0.0', usage_count: 0, created_at: new Date().toISOString().slice(0, 10) });
    if (!hasTrigger) review.push(`- [ ] ⚠️ description 缺触发语义：${s.name} → ${s.description}`);
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE,
    `/* 自动生成：tools/migrate-prompts.js，请勿手改 */\n` +
    `window.AT_SKILLS_BUILTIN = ${JSON.stringify(skills, null, 1)};\n` +
    `window.AT_SKILLS_BUILTIN_META = { version: "1.0.0", count: ${skills.length}, generatedAt: "${new Date().toISOString()}" };\n`);
  fs.writeFileSync(REVIEW_FILE, review.join('\n') + `\n\n共 ${skills.length} 条入库，${raw.length - skills.length} 条待补。\n`);
  console.log(`✓ 已生成 ${OUT_FILE}（${skills.length} 条）与复核清单 ${REVIEW_FILE}`);
}

/* ---------- CLI ---------- */
const arg = process.argv[2];
if (arg === '--parse') parse();
else if (arg === '--enrich') enrich();
else if (arg === '--out') genOut();
else console.log('用法: node tools/migrate-prompts.js --parse | --enrich | --out');
