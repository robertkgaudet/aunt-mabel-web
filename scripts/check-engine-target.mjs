#!/usr/bin/env node
// Refuse to build a site pointed at the wrong engine.
//
// The bug this prevents: aunt-mabel-web-test.pages.dev was built with
// PUBLIC_ENGINE_URL pointing at the PRODUCTION engine. Once production flipped
// to live Stripe keys, every "test" checkout on staging opened a real cs_live_
// session against real money — and nothing looked wrong. The staging site
// rendered perfectly. The only visible difference was in Stripe.
//
// A build-time assertion is the right place for this because the failure is
// invisible at runtime: PUBLIC_ vars are inlined into the bundle, so by the
// time anyone could notice, the wrong URL is already deployed.
//
// Usage:  node scripts/check-engine-target.mjs <test|prod>

import process from 'node:process';
import { loadEnv } from 'vite';

const target = process.argv[2];
if (target !== 'test' && target !== 'prod') {
  console.error('Usage: node scripts/check-engine-target.mjs <test|prod>');
  process.exit(2);
}

// Read env exactly the way the build will: same mode, same directory, same
// precedence. Anything else would be checking a different thing from the one
// that ships.
const mode = target === 'test' ? 'test' : 'production';
const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
const url = (env.PUBLIC_ENGINE_URL || '').trim().replace(/\/+$/, '');

const PROD_ENGINE = 'https://aunt-mabel-engine.rgaudet2023.workers.dev';
const STAGING_ENGINE = 'https://aunt-mabel-engine-staging.rgaudet2023.workers.dev';

function fail(msg) {
  console.error(`\n\u{1F6AB}  BUILD ABORTED: ${msg}\n`);
  process.exit(1);
}

if (!url) {
  fail(
    `PUBLIC_ENGINE_URL is not set for the ${target} build.\n` +
      `   Expected it in ${target === 'test' ? '.env.test (committed)' : '.env.local'}.`
  );
}

if (target === 'test') {
  if (url === PROD_ENGINE) {
    fail(
      `The STAGING build is pointing at the PRODUCTION engine.\n` +
        `   ${url}\n\n` +
        `   That engine holds LIVE Stripe keys, so staging checkouts would charge real cards.\n` +
        `   Set PUBLIC_ENGINE_URL=${STAGING_ENGINE} in .env.test`
    );
  }
  // Not an exact-match check: a future second staging engine should pass, and
  // only the production one is genuinely dangerous here.
  console.log(`  Engine target OK for staging: ${url}`);
} else {
  if (url === STAGING_ENGINE) {
    fail(
      `The PRODUCTION build is pointing at the STAGING engine.\n` +
        `   ${url}\n\n` +
        `   Real customers would be sent to test-mode Stripe and never actually pay.\n` +
        `   Set PUBLIC_ENGINE_URL=${PROD_ENGINE} in .env.local`
    );
  }
  if (url !== PROD_ENGINE) {
    // Loud, but not fatal: the production engine could legitimately be renamed
    // or moved behind a custom domain, and blocking a prod deploy over a URL
    // this script has not been told about would be worse than a warning.
    console.warn(`  ⚠️  Production build engine URL is not the expected one:\n     got      ${url}\n     expected ${PROD_ENGINE}`);
  } else {
    console.log(`  Engine target OK for production: ${url}`);
  }
}
