#!/usr/bin/env node
// Render scripts/og-image.html → public/og-image.jpg at exactly 1200x630.
//
// Usage: node scripts/build-og-image.mjs
//
// Uses the installed Edge via Playwright's `msedge` channel rather than
// downloading Chromium — same approach the enrollment-flow checks use.
//
// Re-run this whenever scripts/og-image.html changes. The JPEG is committed so
// a deploy never depends on a browser being present.

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'og-image.html');
const out = path.join(here, '..', 'public', 'og-image.jpg');

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.goto('file://' + source.replace(/\\/g, '/'));

// Wait for the webfonts. Screenshotting before they land produces a card set in
// a fallback serif — which still looks "fine" and would ship unnoticed.
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);

await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
await browser.close();

console.log(`✅ wrote ${out}`);
process.exit(0);
