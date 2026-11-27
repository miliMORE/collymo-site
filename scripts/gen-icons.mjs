/**
 * Rebuild the slate favicon set and Open Graph images.
 *   npm run icons
 *
 * Portrait: public/img/collo-cutout-660.webp (not renamed, not rewritten).
 * Type: Inter latin subsets in scripts/fonts (OFL). Text is drawn as SVG.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = path.join(root, 'scripts', 'fonts');

const INK = '#151b24';
const CY = '#22d3ee';
const MID = '#93c5fd';
const MG = '#f472d0';
const CO = '#ff7a6b';
const PAPER = '#f1f5f9';

// How much of the circular icon the full cutout fills. Bottom-aligned,
// so a little slate stays above the hair, matching the previous crop.
const FACE_SCALE = 0.94;

const OG_W = 1200;
const OG_H = 630;
const TEXT_X = 76;

const fonts = {
  400: await readFile(path.join(fontDir, 'Inter-Regular.ttf')),
  600: await readFile(path.join(fontDir, 'Inter-SemiBold.ttf')),
  700: await readFile(path.join(fontDir, 'Inter-Bold.ttf')),
};
const faceCss = Object.entries(fonts)
  .map(([weight, buf]) => `@font-face{font-family:Inter;src:url(data:font/ttf;base64,${buf.toString('base64')});font-weight:${weight};font-style:normal;}`)
  .join('');

const cutout = await sharp(path.join(root, 'public/img/collo-cutout-660.webp')).ensureAlpha().png().toBuffer();
const cutMeta = await sharp(cutout).metadata();

function xml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** Horizontal centre of the head, as a fraction of the cutout width. */
async function headCenterRatio(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const y0 = Math.floor(info.height * 0.08);
  const y1 = Math.floor(info.height * 0.4);
  let min = info.width;
  let max = 0;
  for (let y = y0; y < y1; y += 2) {
    const row = y * info.width;
    let left = -1;
    let right = -1;
    for (let x = 0; x < info.width; x++) {
      if (data[(row + x) * 4 + 3] > 80) { left = x; break; }
    }
    for (let x = info.width - 1; x >= 0; x--) {
      if (data[(row + x) * 4 + 3] > 80) { right = x; break; }
    }
    if (left >= 0) {
      if (left < min) min = left;
      if (right > max) max = right;
    }
  }
  return (min + max) / 2 / info.width;
}

/**
 * Square portrait, bottom-aligned, head centred, transparent outside the photo.
 * `inner` is the circle's inner diameter in pixels.
 */
async function faceSquare(inner, centerRatio) {
  const faceW = Math.round(inner * FACE_SCALE);
  const faceH = Math.round(faceW * cutMeta.height / cutMeta.width);
  const shiftX = Math.round(faceW * (0.5 - centerRatio));
  const left = Math.round((inner - faceW) / 2 + shiftX);
  const top = inner - faceH;
  const face = await sharp(cutout).resize(faceW, faceH).png().toBuffer();
  const pad = inner + Math.abs(left) + Math.abs(top) + 4;
  const big = await sharp({
    create: {
      width: faceW + pad * 2,
      height: faceH + pad * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: face, left: pad + left, top: pad + top }]).png().toBuffer();
  return sharp(big).extract({ left: pad, top: pad, width: inner, height: inner }).png().toBuffer();
}

/** Master icon at 512. Ring: cyan → #93c5fd → magenta. Field: #151b24. */
async function iconMaster(centerRatio) {
  const S = 512;
  const margin = 36;
  const stroke = 19;
  const outerR = S / 2 - margin;
  const ringR = outerR - stroke / 2;
  const inner = Math.round((outerR - stroke) * 2);
  const photo = await faceSquare(inner, centerRatio);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}"><circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2 + 0.5}" fill="#fff"/></svg>`,
  );
  const masked = await sharp(photo).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const ring = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs>
      <linearGradient id="ring" x1="0" y1="${S / 2}" x2="${S}" y2="${S / 2}" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${CY}"/>
        <stop offset="50%" stop-color="${MID}"/>
        <stop offset="100%" stop-color="${MG}"/>
      </linearGradient>
    </defs>
    <circle cx="${S / 2}" cy="${S / 2}" r="${ringR}" fill="none" stroke="url(#ring)" stroke-width="${stroke}"/>
  </svg>`);
  const inset = Math.round((S - inner) / 2);
  return sharp({ create: { width: S, height: S, channels: 4, background: INK } })
    .composite([
      { input: masked, left: inset, top: inset },
      { input: ring, left: 0, top: 0 },
    ])
    .flatten({ background: INK })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function pngSize(master, size) {
  const img = size === 512 ? sharp(master) : sharp(master).resize(size, size, { kernel: 'lanczos3' });
  return img.flatten({ background: INK }).png({ compressionLevel: 9 }).toBuffer();
}

/** Multi-size ICO with embedded PNGs (16, 32, 48). */
function pngsToIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let offset = header.length;
  const parts = [header];
  images.forEach((img, i) => {
    const e = 6 + i * 16;
    header[e] = img.size >= 256 ? 0 : img.size;
    header[e + 1] = img.size >= 256 ? 0 : img.size;
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(img.buffer.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += img.buffer.length;
    parts.push(img.buffer);
  });
  return Buffer.concat(parts);
}

function faviconSvg(masterPng) {
  const b64 = masterPng.toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${INK}"/><image href="data:image/png;base64,${b64}" x="0" y="0" width="64" height="64"/></svg>\n`;
}

function ogBackground() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
    <defs>
      <radialGradient id="slate" cx="74%" cy="34%" r="40%">
        <stop offset="0%" stop-color="rgb(90,110,140)" stop-opacity="0.50"/>
        <stop offset="70%" stop-color="rgb(90,110,140)" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="cy" cx="68%" cy="78%" r="28%">
        <stop offset="0%" stop-color="rgb(34,211,238)" stop-opacity="0.14"/>
        <stop offset="72%" stop-color="rgb(34,211,238)" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mg" cx="10%" cy="92%" r="30%">
        <stop offset="0%" stop-color="rgb(244,114,208)" stop-opacity="0.12"/>
        <stop offset="68%" stop-color="rgb(244,114,208)" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse" x="16" y="16">
        <path d="M48 0H0V48" fill="none" stroke="rgb(255,255,255)" stroke-opacity="0.05" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${OG_W}" height="${OG_H}" fill="${INK}"/>
    <rect width="${OG_W}" height="${OG_H}" fill="url(#slate)"/>
    <rect width="${OG_W}" height="${OG_H}" fill="url(#cy)"/>
    <rect width="${OG_W}" height="${OG_H}" fill="url(#mg)"/>
    <rect width="${OG_W}" height="${OG_H}" fill="url(#grid)"/>
  </svg>`);
}

/** Right-aligned portrait, bottom flush, a little slate above the hair. */
async function ogPortrait() {
  const scaledH = 648;
  const scaled = await sharp(cutout).resize({ height: scaledH }).png().toBuffer();
  const meta = await sharp(scaled).metadata();
  const top = 6;
  const visibleH = OG_H - top;
  const height = Math.min(visibleH, meta.height);
  const buf = await sharp(scaled).extract({ left: 0, top: 0, width: meta.width, height }).png().toBuffer();
  return { buf, left: OG_W - meta.width, top: OG_H - height };
}

function textSvg(body) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
  <style><![CDATA[${faceCss}]]></style>
  <defs>
    <linearGradient id="headline" x1="${TEXT_X}" y1="0" x2="620" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${CY}"/>
      <stop offset="38%" stop-color="${MID}"/>
      <stop offset="68%" stop-color="${MG}"/>
      <stop offset="100%" stop-color="${CO}"/>
    </linearGradient>
    <linearGradient id="phrase" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${CY}"/>
      <stop offset="38%" stop-color="${MID}"/>
      <stop offset="68%" stop-color="${MG}"/>
      <stop offset="100%" stop-color="${CO}"/>
    </linearGradient>
  </defs>
  ${body}
</svg>`);
}

function wordmark(y = 556) {
  return `<text x="${TEXT_X}" y="${y}" font-family="Inter" font-weight="700" font-size="28" fill="${PAPER}" letter-spacing="-0.3">collymo<tspan fill="url(#phrase)">.</tspan></text>`;
}

function homeText() {
  return textSvg(`
    <text x="${TEXT_X}" y="158" font-family="Inter" font-weight="600" font-size="26" fill="${CY}">${xml('Collins Milimo')}</text>
    <text x="${TEXT_X}" y="258" font-family="Inter" font-weight="700" font-size="56" fill="url(#headline)" letter-spacing="-1.2">${xml('Software Developer &')}</text>
    <text x="${TEXT_X}" y="326" font-family="Inter" font-weight="700" font-size="56" fill="url(#headline)" letter-spacing="-1.2">${xml('Clinical Data Manager')}</text>
    ${wordmark()}
  `);
}

function clinicalText() {
  return textSvg(`
    <text x="${TEXT_X}" y="108" font-family="Inter" font-weight="600" font-size="18" letter-spacing="3.2" fill="${CY}">${xml('CLINICAL RESEARCH JOURNEY')}</text>
    <text x="${TEXT_X}" y="196" font-family="Inter" font-weight="700" font-size="54" fill="#f8fafc" letter-spacing="-1.1">${xml('Five years of trial')}</text>
    <text x="${TEXT_X}" y="262" font-family="Inter" font-weight="700" font-size="54" fill="#f8fafc" letter-spacing="-1.1">${xml('data, ')}<tspan fill="url(#phrase)">${xml('regulation and')}</tspan></text>
    <text x="${TEXT_X}" y="328" font-family="Inter" font-weight="700" font-size="54" fill="url(#phrase)" letter-spacing="-1.1">${xml('quality')}</text>
    <text x="${TEXT_X}" y="400" font-family="Inter" font-weight="400" font-size="24" fill="#e2e8f0">${xml('13 studies · Phase 1–4 · GCP since 2021')}</text>
    ${wordmark()}
  `);
}

function shelfText() {
  return textSvg(`
    <text x="${TEXT_X}" y="108" font-family="Inter" font-weight="600" font-size="18" letter-spacing="3.4" fill="${CY}">${xml('CASE STUDY')}</text>
    <text x="${TEXT_X}" y="196" font-family="Inter" font-weight="700" font-size="54" fill="#f8fafc" letter-spacing="-1.1"><tspan fill="url(#phrase)">${xml('ShelfCast:')}</tspan>${xml(' your')}</text>
    <text x="${TEXT_X}" y="262" font-family="Inter" font-weight="700" font-size="54" fill="#f8fafc" letter-spacing="-1.1">${xml('ebooks, as private')}</text>
    <text x="${TEXT_X}" y="328" font-family="Inter" font-weight="700" font-size="54" fill="#f8fafc" letter-spacing="-1.1">${xml('audiobooks')}</text>
    <text x="${TEXT_X}" y="404" font-family="Inter" font-weight="400" font-size="22" fill="#e2e8f0">${xml('Next.js · Prisma · PostgreSQL · worker queue · Stripe')}</text>
    ${wordmark()}
  `);
}

async function writeOg(name, text) {
  const bg = ogBackground();
  const portrait = await ogPortrait();
  const out = path.join(root, 'public/img/og', name);
  await sharp(bg)
    .composite([
      { input: portrait.buf, left: portrait.left, top: portrait.top },
      { input: text, left: 0, top: 0 },
    ])
    .flatten({ background: INK })
    .png({ compressionLevel: 9 })
    .toFile(out);
}

function hex(n) {
  return n.toString(16).padStart(2, '0');
}

/** Square icons: corners are the slate field. Flag an indigo/purple wash if one appears. */
async function assertSlate(file, { corners = true } = {}) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const samples = corners
    ? [px(0, 0), px(info.width - 1, 0), px(0, info.height - 1), px(info.width - 1, info.height - 1)]
    : [px(8, 8), px(40, 220)];
  for (const [r, g, b] of samples) {
    if (r !== 0x15 || g !== 0x1b || b !== 0x24) {
      throw new Error(`${file} field sample is #${hex(r)}${hex(g)}${hex(b)}, expected ${INK}`);
    }
  }
  let purple = 0;
  const step = Math.max(1, Math.floor(Math.min(info.width, info.height) / 180));
  for (let y = 0; y < info.height; y += step) {
    for (let x = 0; x < info.width; x += step) {
      const [r, g, b] = px(x, y);
      // #0d0726 is blue-dominant. Dark hair and #151b24 are not.
      const nearOldField = r < 22 && g < 18 && b > r + 18 && b > g + 18 && b < 70;
      const indigoWash = b > 140 && r > 30 && r < 120 && g < 75 && g < r * 0.75 && b > r + 50;
      if (nearOldField || indigoWash) purple++;
    }
  }
  if (purple > 0) throw new Error(`${file} still has ${purple} purple/indigo sample(s)`);
}

const centerRatio = await headCenterRatio(cutout);
const master = await iconMaster(centerRatio);

const iconFiles = [
  ['public/favicon-32.png', 32],
  ['public/favicon-48.png', 48],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
];
for (const [rel, size] of iconFiles) {
  await writeFile(path.join(root, rel), await pngSize(master, size));
}
const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, buffer: await pngSize(master, size) });
await writeFile(path.join(root, 'public/favicon.ico'), pngsToIco(icoImages));
await writeFile(path.join(root, 'public/favicon.svg'), faviconSvg(await pngSize(master, 256)));

await writeOg('og-home.png', homeText());
await writeOg('og-clinical.png', clinicalText());
await writeOg('og-shelfcast.png', shelfText());

const checks = [
  'public/favicon-32.png',
  'public/favicon-48.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/apple-touch-icon.png',
  'public/img/og/og-home.png',
  'public/img/og/og-clinical.png',
  'public/img/og/og-shelfcast.png',
];
for (const rel of checks) {
  await assertSlate(path.join(root, rel), { corners: !rel.includes('/og/') });
}
const svgPng = await sharp(path.join(root, 'public/favicon.svg')).resize(64, 64).png().toBuffer();
const svgCorner = await sharp(svgPng).removeAlpha().raw().toBuffer();
if (svgCorner[0] !== 0x15 || svgCorner[1] !== 0x1b || svgCorner[2] !== 0x24) {
  throw new Error('rendered favicon.svg corner is not the slate field');
}

const svg = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');
if (!svg.includes(`fill="${INK}"`)) throw new Error('favicon.svg is missing the slate field');
if (svg.includes('#0d0726') || svg.includes('13,7,38')) throw new Error('favicon.svg still references the old purple field');

console.log(`icons rebuilt (head centre ${centerRatio.toFixed(3)})`);
