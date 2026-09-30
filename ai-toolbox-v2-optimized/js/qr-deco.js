/* ============ 艺术二维码引擎：矩阵绘制 + 四主题背景 + 隐私中转 + 虚拟号预留 ============ */
'use strict';

/* ---------- 二维码矩阵（双库适配：本地 qrcode-generator 优先，npm qrcode UMD 兼容） ---------- */
function qrMatrix(text) {
  if (typeof window.qrcode === 'function') {
    /* qrcode-generator@1.4.4：typeNumber 0 = 自动版本 */
    const qr = window.qrcode(0, 'H');
    qr.addData(text);
    qr.make();
    const size = qr.getModuleCount();
    return { size, get: (r, c) => r >= 0 && c >= 0 && r < size && c < size && qr.isDark(r, c) };
  }
  if (window.QRCode && typeof window.QRCode.create === 'function') {
    /* qrcode npm UMD（如有） */
    const qr = window.QRCode.create(text, { errorCorrectionLevel: 'H' });
    const size = qr.modules.size;
    const data = qr.modules.data;
    return { size, get: (r, c) => r >= 0 && c >= 0 && r < size && c < size && !!data[r * size + c] };
  }
  throw new Error('二维码核心库未加载（js/vendor/qrcode-generator.js）');
}

/* 定位角（左上/右上/左下 7×7） */
function inFinder(x, y, n, s) {
  s = s || 7;
  return (x < s && y < s) || (x >= n - s && y < s) || (x < s && y >= n - s);
}

/* ---------- 把二维码画成圆盘（定位角方块 + 数据圆点） ---------- */
function drawQrDisk(ctx, matrix, cx, cy, diskD, opt) {
  const fg = opt.fg, disk = opt.disk;
  const n = matrix.size;
  /* 内切正方形：保证定位角不被圆盘边缘裁掉，留 3% 边距 */
  const qrSide = Math.floor(diskD / Math.SQRT2 * 0.97);
  const cell = qrSide / n;
  const half = qrSide / 2;
  const ox = cx - half, oy = cy - half;

  /* 承托盘 */
  ctx.beginPath();
  ctx.arc(cx, cy, diskD / 2, 0, Math.PI * 2);
  ctx.fillStyle = disk;
  ctx.fill();
  /* 外环 */
  if (opt.ringWidth > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, diskD / 2 - opt.ringWidth / 2 - 2, 0, Math.PI * 2);
    ctx.lineWidth = opt.ringWidth;
    ctx.strokeStyle = opt.ring || fg;
    ctx.stroke();
  }

  /* 定位角：方块三层结构 */
  const drawFinder = (fx, fy) => {
    const px = ox + fx * cell, py = oy + fy * cell;
    ctx.fillStyle = fg;
    ctx.fillRect(px, py, cell * 7, cell * 7);
    ctx.fillStyle = disk;
    ctx.fillRect(px + cell, py + cell, cell * 5, cell * 5);
    ctx.fillStyle = fg;
    ctx.fillRect(px + cell * 2, py + cell * 2, cell * 3, cell * 3);
  };
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  /* 数据点：圆点 */
  ctx.fillStyle = fg;
  const r = cell * 0.42;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!matrix.get(y, x)) continue;
      if (inFinder(x, y, n)) continue;
      ctx.beginPath();
      ctx.arc(ox + (x + 0.5) * cell, oy + (y + 0.5) * cell, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ---------- 工具：确定性伪随机 / 星空 ---------- */
function rand(seed) {
  let s = seed >>> 0 || 1;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function starField(ctx, W, rnd, count, color) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() * W, r = rnd() * 2.2 + 0.6;
    ctx.globalAlpha = 0.3 + rnd() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- 主题元素 ---------- */
function drawSixStar(ctx, cx, cy, R, color, lw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  for (const rot of [0, Math.PI]) {
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = -Math.PI / 2 + rot + (i * 2 * Math.PI) / 3;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
}
function drawFiveStar(ctx, cx, cy, R, color, lw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI * 2) / 5;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
}
function drawHorn(ctx, cx, cy, dir, scale, color) {
  /* 白羊座羊角：阿基米德螺线，渐细收尾 */
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const steps = 120;
  for (const [lw, alpha] of [[scale * 30, 1], [scale * 12, 0.35]]) {
    ctx.lineWidth = lw;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = dir * (t * Math.PI * 1.5) + (dir > 0 ? -0.35 : Math.PI + 0.35);
      const rr = scale * (30 + t * 210);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function runeRing(ctx, cx, cy, R, color, rnd, W) {
  /* 外圈刻度环 + 星座连线 */
  ctx.strokeStyle = color;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    ctx.lineWidth = long ? 3 : 1.5;
    ctx.globalAlpha = long ? 0.9 : 0.55;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R - (long ? 20 : 11)), cy + Math.sin(a) * (R - (long ? 20 : 11)));
    ctx.stroke();
  }
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, R + 8, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  /* 星座连线 */
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.75;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2, rr = R * (0.55 + rnd() * 0.4);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  ctx.beginPath();
  pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
  ctx.stroke();
  pts.forEach(function (p) {
    ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  });
  ctx.globalAlpha = 1;
  starField(ctx, W, rnd, 80, color);
}

/* ---------- 四主题 ---------- */
const THEMES = {
  aries: {
    name: '白羊座',
    sw: 'linear-gradient(135deg,#f7b955,#e2762d)',
    fg: '#7a4a12', disk: '#fdf6e8', ring: '#e6a23c',
    draw: function (ctx, W) {
      const rnd = rand(20240321);
      const g = ctx.createRadialGradient(W / 2, W / 2, 40, W / 2, W / 2, W / 1.4);
      g.addColorStop(0, '#ffe9c4'); g.addColorStop(0.55, '#f6c169'); g.addColorStop(1, '#d97c2b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      runeRing(ctx, W / 2, W / 2, W * 0.468, '#8a4d13', rnd, W);
      drawHorn(ctx, W * 0.28, W * 0.38, 1, W / 1024, '#b8631e');
      drawHorn(ctx, W * 0.72, W * 0.38, -1, W / 1024, '#b8631e');
    },
  },
  hexagram: {
    name: '六芒星法阵',
    sw: 'linear-gradient(135deg,#1e2a5e,#0f1530)',
    fg: '#1e3a8a', disk: '#f5efe0', ring: '#e6c15a',
    draw: function (ctx, W) {
      const rnd = rand(777);
      const g = ctx.createRadialGradient(W / 2, W / 2, 40, W / 2, W / 2, W / 1.3);
      g.addColorStop(0, '#243064'); g.addColorStop(1, '#0d1229');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      const cx = W / 2, cy = W / 2;
      ctx.strokeStyle = '#e6c15a';
      [[W * 0.468, 5, 0.95], [W * 0.435, 2, 0.7], [W * 0.40, 1.4, 0.5]].forEach(function (t) {
        ctx.globalAlpha = t[2]; ctx.lineWidth = t[1];
        ctx.beginPath(); ctx.arc(cx, cy, t[0], 0, Math.PI * 2); ctx.stroke();
      });
      ctx.globalAlpha = 0.9;
      drawSixStar(ctx, cx, cy, W * 0.435, '#e6c15a', 4);
      drawFiveStar(ctx, cx, cy, W * 0.19, 'rgba(230,193,90,.55)', 2.5);
      ctx.globalAlpha = 1;
      starField(ctx, W, rnd, 110, '#fff');
    },
  },
  moonstar: {
    name: '星月夜',
    sw: 'linear-gradient(135deg,#312e81,#1e1b4b)',
    fg: '#312e81', disk: '#f6f4ec', ring: '#c7b96b',
    draw: function (ctx, W) {
      const rnd = rand(20260928);
      const g = ctx.createLinearGradient(0, 0, W, W);
      g.addColorStop(0, '#4338ca'); g.addColorStop(0.6, '#312e81'); g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      /* 月亮 */
      ctx.fillStyle = 'rgba(245,230,180,.9)';
      ctx.beginPath(); ctx.arc(W * 0.82, W * 0.16, W * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b34a0';
      ctx.beginPath(); ctx.arc(W * 0.845, W * 0.135, W * 0.048, 0, Math.PI * 2); ctx.fill();
      starField(ctx, W, rnd, 130, '#f5e6b4');
      ctx.strokeStyle = 'rgba(199,185,107,.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(W / 2, W / 2, W * 0.468, 0, Math.PI * 2); ctx.stroke();
    },
  },
  minimal: {
    name: '简约渐变',
    sw: 'linear-gradient(135deg,#94a3b8,#475569)',
    fg: '#334155', disk: '#ffffff', ring: '#94a3b8',
    draw: function (ctx, W) {
      const g = ctx.createLinearGradient(0, 0, W, W);
      g.addColorStop(0, '#e2e8f0'); g.addColorStop(1, '#94a3b8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(W / 2, W / 2, W * 0.468, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(W / 2, W / 2, W * 0.435, 0, Math.PI * 2); ctx.stroke();
    },
  },
};

/* ---------- 生成完整艺术二维码 ---------- */
function generateArtQR(payload, themeKey, opts) {
  opts = opts || {};
  const W = opts.size || 1024;
  const theme = THEMES[themeKey] || THEMES.aries;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = W;
  const ctx = canvas.getContext('2d');
  theme.draw(ctx, W);
  const matrix = qrMatrix(payload); /* 可能抛错：调用方负责 catch */
  drawQrDisk(ctx, matrix, W / 2, W / 2, W * (opts.scale || 0.62), {
    fg: opts.fg || theme.fg,
    disk: opts.disk || theme.disk,
    ring: opts.ring || theme.ring,
    ringWidth: opts.ringWidth != null ? opts.ringWidth : Math.round(W * 0.014),
  });
  return canvas;
}

/* ---------- 隐私中转：AES-GCM 加密到 URL ---------- */
function b64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function makePrivateLink(phone, baseURL) {
  const keyRaw = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['encrypt']);
  const data = new TextEncoder().encode(JSON.stringify({ t: 'tel', n: phone }));
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
  const merged = new Uint8Array(iv.length + enc.byteLength);
  merged.set(iv); merged.set(new Uint8Array(enc), iv.length);
  const base = baseURL || location.href.replace(/[^/]*$/, '');
  /* 载荷放在 query（?）而非 fragment（#）：fragment 在 SSO 登录跳转、聊天工具转发时易被丢弃 */
  return base + 'call.html?k=' + b64url(keyRaw) + '&d=' + b64url(merged);
}
async function decodePrivateLink(loc) {
  /* 兼容三种入参：location 对象 / 查询串(?..) / 旧版哈希串(#..)；并同时尝试 search 与 hash */
  let raw = '';
  if (loc && typeof loc === 'object') {
    raw = (loc.search && loc.search.length > 1) ? loc.search : (loc.hash || '');
  } else {
    raw = loc || '';
  }
  const params = new URLSearchParams(raw.replace(/^[?#]/, ''));
  const k = params.get('k'), d = params.get('d');
  if (!k || !d) throw new Error('参数缺失');
  const keyRaw = b64urlDecode(k);
  const merged = b64urlDecode(d);
  const iv = merged.slice(0, 12);
  const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, merged.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

/* ---------- 虚拟号平台接入（预留接口） ----------
 * 后续接入运营商副号/隐私号平台（阿里隐私号 AXN、移动和多号等）时：
 * 1. 在设置页填写平台网关（建议自建一层适配网关，统一为下方 REST 约定）
 * 2. 网关约定：POST {virtualApiBase}/bind  Body: {mode, phoneA, expire}
 *    响应：{ virtual_number: "虚拟号" }（兼容 data.virtual_number 嵌套）
 * 3. 配置后生成流程自动改为「先绑定拿虚拟号，再编码进二维码」；未配置走内置 AES 中转。
 */
async function virtualBind(phone) {
  const s = (typeof getSettings === 'function') ? getSettings() : {};
  if (!s.virtualApiBase) return null;
  const base = s.virtualApiBase.replace(/\/+$/, '');
  const resp = await fetch(base + '/bind', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (s.virtualApiKey || ''),
    },
    body: JSON.stringify({
      mode: s.virtualMode || 'AXN',
      phoneA: phone,
      expire: 86400,
    }),
  });
  if (!resp.ok) throw new Error('虚拟号平台返回 HTTP ' + resp.status);
  const j = await resp.json();
  return (j && (j.virtual_number || (j.data && j.data.virtual_number))) || null;
}
