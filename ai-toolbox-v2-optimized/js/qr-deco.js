/* ============ 艺术二维码引擎：矩阵绘制 + 四主题背景 + 自定义形状/渐变/图片 + 隐私中转 + 虚拟号预留 ============ */
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

/* ---------- 可选形状 ---------- */
var QR_MODULE_STYLES = ['square', 'dot', 'rounded', 'diamond', 'fluid'];
var QR_FINDER_STYLES = ['square', 'rounded', 'circle', 'leaf'];
var QR_IMG_MODES = ['logo', 'fill', 'bg'];

/* 单个模块路径（px,py 为模块左上角，cell 为边长） */
function modulePath(ctx, style, px, py, cell, connected) {
  const cx = px + cell / 2, cy = py + cell / 2;
  if (style === 'dot') {
    ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
  } else if (style === 'rounded') {
    const r = cell * 0.32;
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + cell, py, px + cell, py + cell, r);
    ctx.arcTo(px + cell, py + cell, px, py + cell, r);
    ctx.arcTo(px, py + cell, px, py, r);
    ctx.arcTo(px, py, px + cell, py, r);
    ctx.closePath();
  } else if (style === 'diamond') {
    ctx.moveTo(cx, py + cell * 0.06);
    ctx.lineTo(px + cell * 0.94, cy);
    ctx.lineTo(cx, py + cell * 0.94);
    ctx.lineTo(px + cell * 0.06, cy);
    ctx.closePath();
  } else if (style === 'fluid' && connected) {
    /* 流体：与相邻暗模块连接处画直边，孤立处圆角——近似连续流线 */
    const r = cell * 0.5;
    ctx.arc(cx, cy, r * (connected.left || connected.right || connected.up || connected.down ? 0.62 : 0.46), 0, Math.PI * 2);
  } else {
    ctx.rect(px, py, cell, cell);
  }
}

/* 定位角绘制（三种同心结构） */
function finderDraw(ctx, style, px, py, cell, fg, bg) {
  const S = cell * 7;
  const roundRect = (x, y, w, h, r) => {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const shape = (k, x, y, w, fill) => {
    ctx.beginPath();
    if (style === 'circle' && k !== 2) ctx.arc(x + w / 2, y + w / 2, w / 2, 0, Math.PI * 2);
    else if (style === 'rounded' && k !== 2) roundRect(x, y, w, w, w * 0.28);
    else if (style === 'leaf' && k !== 2) {
      /* 叶形：对角大圆角 */
      ctx.moveTo(x + w * 0.28, y);
      ctx.arcTo(x + w, y, x + w, y + w, w * 0.42);
      ctx.arcTo(x + w, y + w, x, y + w, w * 0.42);
      ctx.arcTo(x, y + w, x, y, w * 0.42);
      ctx.arcTo(x, y, x + w, y, w * 0.42);
      ctx.closePath();
    } else ctx.rect(x, y, w, w);
    if (fill) { ctx.fillStyle = fg; ctx.fill(); } else { ctx.fillStyle = bg; ctx.fill(); }
  };
  shape(0, px, py, S, true);            /* 外框 */
  shape(1, px + cell, py + cell, cell * 5, false); /* 白环 */
  ctx.beginPath();                       /* 中心芯：始终实心 */
  if (style === 'circle') ctx.arc(px + S / 2, py + S / 2, cell * 1.5, 0, Math.PI * 2);
  else if (style === 'rounded') roundRect(px + cell * 2, py + cell * 2, cell * 3, cell * 3, cell * 0.8);
  else if (style === 'leaf') roundRect(px + cell * 2, py + cell * 2, cell * 3, cell * 3, cell * 0.9);
  else ctx.rect(px + cell * 2, py + cell * 2, cell * 3, cell * 3);
  ctx.fillStyle = fg; ctx.fill();
}

/* ---------- 通用二维码渲染核心（方形 / 圆盘通用） ----------
 * opt: { fg, fg2, gradient:'none'|'linear'|'radial', bg, moduleStyle, finderStyle,
 *        disk:null|color(圆盘承托), ring, ringWidth, logoImg, logoScale, quiet }
 */
function renderQrCore(ctx, matrix, ox, oy, qrSide, opt) {
  const n = matrix.size;
  const cell = qrSide / (n + (opt.quiet || 0) * 2);
  const q = opt.quiet || 0;
  const gridOx = ox + q * cell, gridOy = oy + q * cell;

  /* 前景色（支持渐变） */
  let fg = opt.fg || '#1f2937';
  if (opt.gradient === 'linear' && opt.fg2) {
    const g = ctx.createLinearGradient(ox, oy, ox + qrSide, oy + qrSide);
    g.addColorStop(0, fg); g.addColorStop(1, opt.fg2);
    fg = g;
  } else if (opt.gradient === 'radial' && opt.fg2) {
    const g = ctx.createRadialGradient(ox + qrSide / 2, oy + qrSide / 2, qrSide * 0.05, ox + qrSide / 2, oy + qrSide / 2, qrSide * 0.72);
    g.addColorStop(0, fg); g.addColorStop(1, opt.fg2);
    fg = g;
  }

  /* 圆盘承托 */
  if (opt.disk) {
    const cx = ox + qrSide / 2, cy = oy + qrSide / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, qrSide / Math.SQRT2, 0, Math.PI * 2);
    ctx.fillStyle = opt.disk; ctx.fill();
    if (opt.ringWidth > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, qrSide / Math.SQRT2 - opt.ringWidth / 2 - 2, 0, Math.PI * 2);
      ctx.lineWidth = opt.ringWidth;
      ctx.strokeStyle = opt.ring || opt.fg || '#333';
      ctx.stroke();
    }
  }

  const style = opt.moduleStyle || 'square';
  const connected = (x, y) => ({
    left: x > 0 && matrix.get(y, x - 1) && !inFinder(x - 1, y, n),
    right: x < n - 1 && matrix.get(y, x + 1) && !inFinder(x + 1, y, n),
    up: y > 0 && matrix.get(y - 1, x) && !inFinder(x, y - 1, n),
    down: y < n - 1 && matrix.get(y + 1, x) && !inFinder(x, y + 1, n),
  });

  ctx.fillStyle = fg;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!matrix.get(y, x) || inFinder(x, y, n)) continue;
      ctx.beginPath();
      modulePath(ctx, style, gridOx + x * cell, gridOy + y * cell, cell, connected(x, y));
      ctx.fill();
    }
  }

  /* 定位角 */
  const fs = opt.finderStyle || 'square';
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (p) {
    finderDraw(ctx, fs, gridOx + p[0] * cell, gridOy + p[1] * cell, cell, opt.fg || '#1f2937', opt.disk || opt.bg || '#ffffff');
  });

  /* 中心 Logo（面积限制 + 白色托底） */
  if (opt.logoImg) {
    const lw = qrSide * (opt.logoScale || 0.2);
    const lx = ox + (qrSide - lw) / 2, ly = oy + (qrSide - lw) / 2;
    const pad = lw * 0.08, rr = lw * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lx - pad + rr, ly - pad);
    ctx.arcTo(lx + lw + pad, ly - pad, lx + lw + pad, ly + lw + pad, rr);
    ctx.arcTo(lx + lw + pad, ly + lw + pad, lx - pad, ly + lw + pad, rr);
    ctx.arcTo(lx - pad, ly + lw + pad, lx - pad, ly - pad, rr);
    ctx.arcTo(lx - pad, ly - pad, lx + lw + pad, ly - pad, rr);
    ctx.closePath();
    ctx.fillStyle = opt.logoPad !== false ? '#ffffff' : 'rgba(255,255,255,0)';
    ctx.fill();
    ctx.clip();
    const img = opt.logoImg;
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, lx, ly, lw, lw);
    ctx.restore();
  }
}

/* ---------- 把二维码画成圆盘（旧接口，保留兼容：主题模式走 renderQrCore） ---------- */
function drawQrDisk(ctx, matrix, cx, cy, diskD, opt) {
  const n = matrix.size;
  const qrSide = Math.floor(diskD / Math.SQRT2 * 0.97);
  renderQrCore(ctx, matrix, cx - qrSide / 2, cy - qrSide / 2, qrSide, {
    fg: opt.fg, bg: opt.disk, disk: null, ring: opt.ring, ringWidth: 0,
    moduleStyle: 'dot', finderStyle: 'square', quiet: 0,
  });
  /* 重新补画圆盘边框（renderQrCore 不画） */
  if (opt.ringWidth > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, diskD / 2 - opt.ringWidth / 2 - 2, 0, Math.PI * 2);
    ctx.lineWidth = opt.ringWidth;
    ctx.strokeStyle = opt.ring || opt.fg;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, diskD / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
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
  /* —— 流行款：干净模块形状 + 精致配色 + 满版留白（对标主流美化器）—— */
  ocean: {
    name: '海洋渐变',
    sw: 'linear-gradient(135deg,#2563eb,#06b6d4)',
    layout: 'full', fg: '#1d4ed8', fg2: '#06b6d4', gradient: 'linear',
    bg: '#ffffff', moduleStyle: 'dot', finderStyle: 'rounded',
    draw: function (ctx, W) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, W); },
  },
  sunset: {
    name: '日落渐变',
    sw: 'linear-gradient(135deg,#f97316,#ec4899)',
    layout: 'full', fg: '#ea580c', fg2: '#ec4899', gradient: 'linear',
    bg: '#ffffff', moduleStyle: 'dot', finderStyle: 'rounded',
    draw: function (ctx, W) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, W); },
  },
  midnight: {
    name: '午夜蓝',
    sw: 'linear-gradient(135deg,#475569,#4f46e5)',
    layout: 'full', fg: '#312e81', fg2: '#4f46e5', gradient: 'linear',
    bg: '#f8fafc', moduleStyle: 'rounded', finderStyle: 'rounded',
    draw: function (ctx, W) { ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, W); },
  },
  emerald: {
    name: '翡翠圆点',
    sw: 'linear-gradient(135deg,#059669,#34d399)',
    layout: 'full', fg: '#047857', fg2: '#10b981', gradient: 'linear',
    bg: '#ffffff', moduleStyle: 'dot', finderStyle: 'circle',
    draw: function (ctx, W) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, W); },
  },
  rosegold: {
    name: '玫瑰金',
    sw: 'linear-gradient(135deg,#b76e79,#e8b4a0)',
    layout: 'full', fg: '#b76e79', fg2: '#e0a899', gradient: 'linear',
    bg: '#fffaf7', moduleStyle: 'dot', finderStyle: 'rounded',
    draw: function (ctx, W) { ctx.fillStyle = '#fffaf7'; ctx.fillRect(0, 0, W, W); },
  },
  hexagram: {
    name: '六芒星法阵',
    layout: 'disk',
    sw: 'linear-gradient(135deg,#1e2a5e,#0f1530)',
    fg: '#1e3a8a', disk: '#f5efe0', ring: '#e6c15a',
    draw: function (ctx, W) {
      const rnd = rand(777);
      const g = ctx.createRadialGradient(W / 2, W / 2, 40, W / 2, W / 1.3, W * 0.85);
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
    layout: 'disk',
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
    layout: 'disk',
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

/* ---------- 生成完整艺术二维码（主题模式） ---------- */
function generateArtQR(payload, themeKey, opts) {
  opts = opts || {};
  const W = opts.size || 1024;
  const theme = THEMES[themeKey] || THEMES.ocean;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = W;
  const ctx = canvas.getContext('2d');
  const matrix = qrMatrix(payload); /* 可能抛错：调用方负责 catch */
  const fg = opts.fg || theme.fg;
  const mStyle = opts.moduleStyle || theme.moduleStyle || 'dot';
  const fStyle = opts.finderStyle || theme.finderStyle || 'square';
  if ((theme.layout || 'full') === 'disk') {
    /* 圆盘装饰布局：背景装饰 + 圆盘承托 + 外环 */
    theme.draw(ctx, W);
    const disk = opts.disk || theme.disk;
    const qrSide = Math.floor(W * (opts.scale || 0.62) / Math.SQRT2 * 0.97);
    const cx = W / 2, cy = W / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, W * (opts.scale || 0.62) / 2, 0, Math.PI * 2);
    ctx.fillStyle = disk; ctx.fill();
    const ringWidth = opts.ringWidth != null ? opts.ringWidth : Math.round(W * 0.014);
    if (ringWidth > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, W * (opts.scale || 0.62) / 2 - ringWidth / 2 - 2, 0, Math.PI * 2);
      ctx.lineWidth = ringWidth;
      ctx.strokeStyle = opts.ring || theme.ring || fg;
      ctx.stroke();
    }
    renderQrCore(ctx, matrix, cx - qrSide / 2, cy - qrSide / 2, qrSide, {
      fg: fg, fg2: opts.fg2, gradient: opts.gradient || 'none',
      bg: disk, disk: null, ringWidth: 0,
      moduleStyle: mStyle, finderStyle: fStyle, quiet: 0,
      logoImg: opts.logoImg, logoScale: opts.logoScale,
    });
  } else {
    /* 满版布局：浅底 + 全幅码点（流行款） */
    theme.draw(ctx, W);
    renderQrCore(ctx, matrix, 0, 0, W, {
      fg: fg, fg2: opts.fg2 || theme.fg2, gradient: opts.gradient || theme.gradient || 'none',
      bg: opts.bg || theme.bg || '#ffffff', disk: null, ringWidth: 0,
      moduleStyle: mStyle, finderStyle: fStyle, quiet: 4,
      logoImg: opts.logoImg, logoScale: opts.logoScale,
    });
  }
  return canvas;
}

/* ---------- 自定义模式：形状 / 渐变 / 图片自由组合 ----------
 * opt: { size, moduleStyle, finderStyle, fg, fg2, gradient, bg,
 *        img, imgMode:'logo'|'fill'|'bg', imgAlpha(0~1 遮罩强度), scale }
 */
function generateCustomQR(payload, opt) {
  opt = opt || {};
  const W = opt.size || 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = W;
  const ctx = canvas.getContext('2d');
  const matrix = qrMatrix(payload);

  const scale = opt.scale || 0.86;             /* 方形模式：二维码占画布比例 */
  const quiet = 4;                              /* 四边静区（模块数） */
  const qrSide = W * scale;
  const ox = (W - qrSide) / 2, oy = (W - qrSide) / 2;

  /* 背景：纯色 / 图片(bg 模式) */
  ctx.fillStyle = opt.bg || '#ffffff';
  ctx.fillRect(0, 0, W, W);
  if (opt.img && opt.imgMode === 'bg') {
    const s = Math.max(W / opt.img.width, W / opt.img.height);
    const dw = opt.img.width * s, dh = opt.img.height * s;
    ctx.drawImage(opt.img, (W - dw) / 2, (W - dh) / 2, dw, dh);
    ctx.fillStyle = 'rgba(255,255,255,' + (opt.imgAlpha != null ? opt.imgAlpha : 0.55) + ')';
    ctx.fillRect(0, 0, W, W);
  }

  /* fill 模式：先把模块画到离屏画布，再把图片 source-atop 进模块形状 */
  if (opt.img && opt.imgMode === 'fill') {
    const off = document.createElement('canvas');
    off.width = off.height = W;
    const octx = off.getContext('2d');
    renderQrCore(octx, matrix, ox, oy, qrSide, {
      fg: '#000000', bg: '#ffffff', disk: null, ringWidth: 0,
      moduleStyle: opt.moduleStyle || 'rounded', finderStyle: opt.finderStyle || 'rounded', quiet: quiet,
    });
    octx.globalCompositeOperation = 'source-atop';
    const s = Math.max(W / opt.img.width, W / opt.img.height);
    const dw = opt.img.width * s, dh = opt.img.height * s;
    octx.drawImage(opt.img, (W - dw) / 2, (W - dh) / 2, dw, dh);
    if (opt.imgAlpha != null && opt.imgAlpha < 1) {
      /* tint：把图片压暗保证扫码对比度 */
      octx.globalAlpha = 1 - opt.imgAlpha;
      octx.fillStyle = '#111827';
      octx.fillRect(0, 0, W, W);
      octx.globalAlpha = 1;
    }
    ctx.drawImage(off, 0, 0);
    return canvas;
  }

  /* logo / 无图模式：直接核心渲染 */
  renderQrCore(ctx, matrix, ox, oy, qrSide, {
    fg: opt.fg || '#111827', fg2: opt.fg2, gradient: opt.gradient || 'none',
    bg: opt.bg || '#ffffff', disk: null, ringWidth: 0,
    moduleStyle: opt.moduleStyle || 'square', finderStyle: opt.finderStyle || 'square',
    quiet: quiet, logoImg: opt.imgMode === 'logo' ? opt.img : null,
    logoScale: opt.logoScale || 0.2,
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
