#!/usr/bin/env node
/**
 * Generates the extension icons as PNGs with no image dependencies.
 *
 * The artwork is a rounded square holding three "message lines"; the top two
 * are gaussian-blurred and the bottom one is sharp, which is the whole idea of
 * the extension in one glyph. Everything is rasterised here — supersampled
 * coverage, a separable box blur and a hand-rolled PNG encoder — so that CI can
 * reproduce the icons byte for byte without native modules.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const OUT_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));
const SIZES = [16, 32, 48, 128, 256, 512];
const SUPERSAMPLE = 4;

/** Background gradient, top to bottom. */
const TOP = [99, 102, 241]; // indigo-500
const BOTTOM = [139, 92, 246]; // violet-500
const INK = [255, 255, 255];

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Signed distance to a rounded box centred on (cx, cy). Negative inside. */
function roundedBoxDistance(x, y, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(x - cx) - (halfW - radius);
  const qy = Math.abs(y - cy) - (halfH - radius);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - radius;
}

/** Separable box blur, run three times to approximate a gaussian. */
function blurMask(mask, width, height, radius) {
  if (radius < 1) return mask;
  let source = mask;
  let target = new Float32Array(mask.length);
  for (let pass = 0; pass < 3; pass += 1) {
    // Horizontal
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const sx = x + k;
          if (sx < 0 || sx >= width) continue;
          sum += source[y * width + sx];
          count += 1;
        }
        target[y * width + x] = sum / count;
      }
    }
    [source, target] = [target, source];
    // Vertical
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let count = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const sy = y + k;
          if (sy < 0 || sy >= height) continue;
          sum += source[sy * width + x];
          count += 1;
        }
        target[y * width + x] = sum / count;
      }
    }
    [source, target] = [target, source];
  }
  return source;
}

/** Fills `mask` with a rounded bar in unit coordinates (0..1). */
function stampBar(mask, size, { x, y, width, height }) {
  const cx = (x + width / 2) * size;
  const cy = (y + height / 2) * size;
  const halfW = (width / 2) * size;
  const halfH = (height / 2) * size;
  const radius = Math.min(halfW, halfH);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const d = roundedBoxDistance(px + 0.5, py + 0.5, cx, cy, halfW, halfH, radius);
      if (d <= 0) mask[py * size + px] = 1;
    }
  }
}

function renderRgba(size) {
  const big = size * SUPERSAMPLE;

  // --- background mask -----------------------------------------------------
  const background = new Float32Array(big * big);
  const cornerRadius = big * 0.22;
  for (let y = 0; y < big; y += 1) {
    for (let x = 0; x < big; x += 1) {
      const d = roundedBoxDistance(
        x + 0.5,
        y + 0.5,
        big / 2,
        big / 2,
        big / 2,
        big / 2,
        cornerRadius,
      );
      background[y * big + x] = d <= 0 ? 1 : 0;
    }
  }

  // --- foreground: two blurred lines and one sharp line --------------------
  const blurred = new Float32Array(big * big);
  stampBar(blurred, big, { x: 0.22, y: 0.28, width: 0.56, height: 0.1 });
  stampBar(blurred, big, { x: 0.22, y: 0.45, width: 0.42, height: 0.1 });
  const softened = blurMask(blurred, big, big, Math.max(1, Math.round(big * 0.035)));

  const sharp = new Float32Array(big * big);
  stampBar(sharp, big, { x: 0.22, y: 0.62, width: 0.5, height: 0.1 });

  // --- composite -----------------------------------------------------------
  const pixels = new Uint8Array(size * size * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const bx = x * SUPERSAMPLE + sx;
          const by = y * SUPERSAMPLE + sy;
          const index = by * big + bx;
          const bgAlpha = background[index];
          if (bgAlpha === 0) continue;

          const t = by / big;
          let cr = TOP[0] + (BOTTOM[0] - TOP[0]) * t;
          let cg = TOP[1] + (BOTTOM[1] - TOP[1]) * t;
          let cb = TOP[2] + (BOTTOM[2] - TOP[2]) * t;

          const ink = clamp01(softened[index] * 0.95 + sharp[index]);
          cr += (INK[0] - cr) * ink;
          cg += (INK[1] - cg) * ink;
          cb += (INK[2] - cb) * ink;

          r += cr * bgAlpha;
          g += cg * bgAlpha;
          b += cb * bgAlpha;
          a += bgAlpha;
        }
      }
      const offset = (y * size + x) * 4;
      const alpha = a / samples;
      // Store straight (non-premultiplied) colour, as PNG expects.
      pixels[offset] = alpha === 0 ? 0 : Math.round(r / a);
      pixels[offset + 1] = alpha === 0 ? 0 : Math.round(g / a);
      pixels[offset + 2] = alpha === 0 ? 0 : Math.round(b / a);
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  return pixels;
}

// --- minimal PNG encoder ---------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, size) {
  const stride = size * 4;
  // One filter byte (0 = none) per scanline.
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = path.join(OUT_DIR, `icon-${size}.png`);
  await writeFile(file, encodePng(renderRgba(size), size));
  console.log(`✓ ${path.basename(file)}`);
}
