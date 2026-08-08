#!/usr/bin/env node
// Crop and optimise the homepage hero.
//
// Usage: node scripts/build-hero.mjs
//   public/images/hero-family-source.jpg  (untouched original, 1728x1152, 3:2)
//   → public/images/hero-family.jpg       (1100x1375, 4:5, web-sized)
//
// WHY CROP HERE RATHER THAN WITH object-fit
// The hero frame is 4:5 portrait and the photograph is 3:2 landscape, so only
// about 53% of its width is ever visible. Letting CSS do it means shipping
// nearly half the pixels to be thrown away, and the framing then depends on an
// object-position guess that shifts with every breakpoint. Cropping once, on
// purpose, fixes the composition and halves the bytes.
//
// THE CROP IS CHOSEN AROUND THE FACES, NOT THE CENTRE. The emotional centre is
// his lips on her forehead and her closed-eyed smile — roughly x 600–1300 in the
// original. A centred crop would have clipped his face at the left edge.

import sharp from 'sharp';

const SRC = 'public/images/hero-family-source.jpg';
const OUT = 'public/images/hero-family.jpg';

const { width, height } = await sharp(SRC).metadata();

// 4:5 window, full height, positioned so both faces sit comfortably inside.
const cropW = Math.round(height * (4 / 5));
const left = Math.max(0, Math.min(width - cropW, Math.round(950 - cropW / 2)));

await sharp(SRC)
  .extract({ left, top: 0, width: cropW, height })
  .resize({ width: 1100 })
  .jpeg({ quality: 84, progressive: true, mozjpeg: true })
  .toFile(OUT);

const { size } = await sharp(OUT).metadata().then(async (m) => ({ ...m, size: (await import('node:fs')).statSync(OUT).size }));
console.log(`hero: ${width}x${height} -> crop ${cropW}x${height} at x=${left} -> 1100 wide, ${(size / 1024) | 0} KB`);
