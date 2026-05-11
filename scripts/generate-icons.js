#!/usr/bin/env node
// PWA иконки: радиальный градиент #1a7a44 + белая чашка кофе в pixel-art стиле,
// с 4× anti-aliasing для гладких краёв.
// Без зависимостей — чистый Node.
// Размеры: 192×192 (icon-192), 512×512 (icon-512), 180×180 (apple-touch-icon).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Палитра
const BG_CENTER = [0x2d, 0x9e, 0x5a]; // brand-mid (светлее в центре)
const BG_EDGE   = [0x14, 0x5a, 0x32]; // тёмно-зелёный по краям
const FG        = [0xff, 0xff, 0xff];

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Pixel-art чашка на сетке 24×24, вписана с padding 1 cell.
const ART_W = 24;
const ART_H = 24;
const ART = [
  '........................',
  '...11....11....11.......',
  '..1..1..1..1..1..1......',
  '..1..1..1..1..1..1......',
  '...11....11....11.......',
  '........................',
  '........................',
  '.1111111111111111.......',
  '.1111111111111111.111...',
  '.11............11.1.1...',
  '.11............11.1.1...',
  '.11............11.1.1...',
  '.11............11.1.1...',
  '.11............11.1.1...',
  '.11............11.111...',
  '.11............11.......',
  '.11............11.......',
  '..1111111111111111......',
  '..1111111111111111......',
  '........................',
  '111111111111111111111111',
  '111111111111111111111111',
  '........................',
  '........................',
];
function isCup(ax, ay) {
  if (ay < 0 || ay >= ART_H || ax < 0 || ax >= ART_W) return false;
  return ART[ay][ax] !== '.';
}

function lerp(a, b, t) { return a + (b - a) * t; }
// Детерминированный hash-шум для текстуры фона (защищает PNG от over-compression
// и даёт лёгкое "тканевое" ощущение).
function noise(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177 | 0;
  return ((n ^ (n >>> 16)) & 0xff) / 255;
}
function bgColor(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const dx = (x - cx) / cx, dy = (y - cy) / cy;
  const r = Math.min(1, Math.sqrt(dx * dx + dy * dy));
  const t = r * r;
  const jitter = (noise(x, y) - 0.5) * 4; // ±2 на канал
  return [
    Math.max(0, Math.min(255, Math.round(lerp(BG_CENTER[0], BG_EDGE[0], t) + jitter))),
    Math.max(0, Math.min(255, Math.round(lerp(BG_CENTER[1], BG_EDGE[1], t) + jitter))),
    Math.max(0, Math.min(255, Math.round(lerp(BG_CENTER[2], BG_EDGE[2], t) + jitter))),
  ];
}

function makeIcon(size) {
  const SS = 4; // supersampling factor for anti-aliasing
  const ssSize = size * SS;

  // Логическая сетка art — вписана с padding 1 cell по периметру
  const cell = ssSize / (ART_W + 2);
  const offset = cell; // padding = 1 cell

  // Буфер supersampled: 0=fg(white), 1=bg, drawn per-subpixel
  // Сразу даунсемплим в один проход: для каждого выходного пикселя считаем среднее.
  const rowSize = size * 3 + 1;
  const raw = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x * SS + sx;
          const py = y * SS + sy;
          const ax = Math.floor((px - offset) / cell);
          const ay = Math.floor((py - offset) / cell);
          let c;
          if (isCup(ax, ay)) {
            c = FG;
          } else {
            c = bgColor(px, py, ssSize);
          }
          rSum += c[0]; gSum += c[1]; bSum += c[2];
        }
      }
      const n = SS * SS;
      const off = y * rowSize + 1 + x * 3;
      raw[off] = Math.round(rSum / n);
      raw[off + 1] = Math.round(gSum / n);
      raw[off + 2] = Math.round(bSum / n);
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public');
const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  const buf = makeIcon(t.size);
  fs.writeFileSync(path.join(outDir, t.name), buf);
  console.log(`Generated ${t.name} (${buf.length} bytes, ${t.size}×${t.size})`);
}
