#!/usr/bin/env node
// Resize the family scans for the web, in place.
//
// Usage: node scripts/optimize-family-photos.mjs
//
// These arrive as full-resolution scans — one was 681 KB, and /story shows ten
// of them. Capped at 1600px on the long edge, which is still generous for a
// full-width plate on a retina screen, and re-encoded as progressive JPEG so a
// slow connection sees the picture appear rather than wipe down the page.
//
// Idempotent: an already-small file is left alone, so re-running is safe.

import sharp from 'sharp';
import { readdir, stat, rename } from 'node:fs/promises';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'images', 'family');
const MAX = 1600;

for (const name of (await readdir(dir)).filter((f) => /\.jpe?g$/i.test(f))) {
  const file = path.join(dir, name);
  const before = (await stat(file)).size;
  const meta = await sharp(file).metadata();

  if (Math.max(meta.width, meta.height) <= MAX && before < 220_000) {
    console.log(`  skip ${name} (${meta.width}x${meta.height}, ${(before / 1024) | 0} KB)`);
    continue;
  }

  const tmp = file + '.tmp';
  await sharp(file)
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(tmp);
  await rename(tmp, file);

  const after = (await stat(file)).size;
  console.log(
    `  ${name}: ${meta.width}x${meta.height} ${(before / 1024) | 0} KB → ${(after / 1024) | 0} KB`
  );
}
