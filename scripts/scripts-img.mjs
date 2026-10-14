import sharp from 'sharp';
const src = '/workspace/shots-src';
const items = ['verdict-home','verdict-product','verdict-security','verdict-login','shelfcast-home','shelfcast-pricing','shelfcast-signup'];
for (const n of items) {
  const base = sharp(`${src}/${n}.png`).extract({ left: 0, top: 0, width: 1440, height: 810 });
  const buf = await base.toBuffer();
  for (const w of [640, 1280]) {
    await sharp(buf).resize(w).avif({ quality: 55 }).toFile(`public/img/shots/${n}-${w}.avif`);
    await sharp(buf).resize(w).webp({ quality: 78 }).toFile(`public/img/shots/${n}-${w}.webp`);
  }
}
// portrait: avif + webp at 330/660 (2x), small png fallback
const cut = '/workspace/plans/assets/derived/collo-cutout.png';
const trimmed = await sharp(cut).extract({ left: 40, top: 46, width: 1368, height: 1362 }).toBuffer();
for (const w of [330, 660]) {
  await sharp(trimmed).resize(w).avif({ quality: 60 }).toFile(`public/img/collo-cutout-${w}.avif`);
  await sharp(trimmed).resize(w).webp({ quality: 80 }).toFile(`public/img/collo-cutout-${w}.webp`);
}
await sharp(trimmed).resize(330).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile('public/img/collo-cutout-330.png');
console.log('done');
