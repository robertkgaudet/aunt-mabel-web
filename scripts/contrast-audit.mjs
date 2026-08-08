#!/usr/bin/env node
// Flag text that is invisible or near-invisible against what is behind it.
//
// Usage: node scripts/contrast-audit.mjs [url]
//
// Written after the founding CTA shipped with a dark heading on a dark panel.
// Grepping the stylesheet could not catch it: site.css sets a global
// `h1,h2,h3 { color: var(--ink) }`, so the bug was an ABSENCE of a rule, and
// you cannot grep for a declaration that was never written. This asks the
// browser what colour things actually came out.

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4321/';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });

const findings = await page.evaluate(() => {
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  // Walk up until something actually paints a background.
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const p = parse(bg);
      if (p.length >= 3 && (p[3] === undefined || p[3] > 0.5)) return p;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };

  const out = [];
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,strong,em,div')) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;

    const fg = parse(cs.color);
    const bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio < 3) {
      out.push({
        ratio: Number(ratio.toFixed(2)),
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().split(' ').filter((c) => !c.startsWith('astro-'))[0] || '',
        color: cs.color,
        bg: `rgb(${bg.slice(0, 3).join(',')})`,
        text: text.slice(0, 68),
      });
    }
  }
  return out.sort((a, b) => a.ratio - b.ratio);
});

if (!findings.length) console.log('✅ no low-contrast text found');
else {
  console.log(`⚠️  ${findings.length} low-contrast element(s):\n`);
  for (const f of findings) {
    console.log(`  ${String(f.ratio).padStart(5)}:1  <${f.tag}${f.cls ? '.' + f.cls : ''}>  ${f.color} on ${f.bg}`);
    console.log(`          "${f.text}"`);
  }
}
await browser.close();
process.exit(0);
