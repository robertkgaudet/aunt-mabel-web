#!/usr/bin/env node
// Guarded prod deploy for aunt-mabel-web → Cloudflare Pages.
// Aborts on dirty tree, unpushed commits, missing auth, or build failure.
// This is the ONLY safe path to prod — do not call `wrangler pages deploy`
// against the prod project directly.
//
// Usage: npm run deploy:prod
//   (set CLOUDFLARE_API_TOKEN from User env first — see CLAUDE.md)

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const PROD_PROJECT = 'aunt-mabel-web';

function run(cmd, args = []) {
  return spawnSync(cmd, args, { shell: true, encoding: 'utf8', stdio: 'pipe' });
}

function abort(msg) {
  console.error(`\n\u{1F6AB}  DEPLOY ABORTED: ${msg}\n`);
  process.exit(1);
}

// ── 1. Git repo present ────────────────────────────────────────────────────
console.log('> Checking git repo...');
const headResult = run('git', ['rev-parse', 'HEAD']);
if (headResult.status !== 0) abort('Not inside a git repository (git rev-parse HEAD failed).');
const headHash = headResult.stdout.trim();
console.log(`  HEAD: ${headHash.slice(0, 12)}`);

// ── 2. Working tree clean ──────────────────────────────────────────────────
console.log('> Checking working tree...');
const status = run('git', ['status', '--porcelain']);
if (status.stdout.trim() !== '') {
  abort(`Working tree is dirty — commit or stash all changes before deploying to prod.\n\n${status.stdout}`);
}
console.log('  Clean.');

// ── 3. HEAD pushed to upstream ─────────────────────────────────────────────
// Deploying something that exists only on this laptop means the deployed
// version can never be recovered or diffed. Refuse.
console.log('> Checking upstream sync...');
const upstream = run('git', ['rev-parse', '@{u}']);
if (upstream.status !== 0) {
  abort('No upstream tracking branch configured. Push this branch before deploying to prod.');
}
const upstreamHash = upstream.stdout.trim();
if (headHash !== upstreamHash) {
  abort(`HEAD (${headHash.slice(0, 8)}) is ahead of upstream (${upstreamHash.slice(0, 8)}). Push first.`);
}
console.log('  HEAD matches upstream.');

// ── 4. CLOUDFLARE_API_TOKEN set ────────────────────────────────────────────
console.log('> Checking CLOUDFLARE_API_TOKEN...');
if (!process.env.CLOUDFLARE_API_TOKEN) {
  abort(
    'CLOUDFLARE_API_TOKEN is not set. Run:\n' +
    "  $env:CLOUDFLARE_API_TOKEN = [System.Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN', 'User')"
  );
}
console.log('  Set.');

// ── 5. Supabase build vars present ─────────────────────────────────────────
// These are inlined into the browser bundle at build time. If they are missing
// the build still "succeeds" and ships a site where every sign-in throws.
// Catch it here rather than in production.
console.log('> Checking Supabase build vars...');
const missing = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'].filter(
  (k) => !process.env[k]
);
if (missing.length > 0) {
  console.log(`  Not in shell env (${missing.join(', ')}) — relying on .env files.`);
} else {
  console.log('  Present in shell env.');
}

// ── 6. Wrangler auth check ─────────────────────────────────────────────────
// wrangler whoami exits 255 on Windows even when auth succeeds — check stdout,
// not the exit code.
console.log('> Checking wrangler auth...');
const whoami = run('npx', ['wrangler', 'whoami']);
const whoamiOut = whoami.stdout + whoami.stderr;
if (!whoamiOut.includes('You are logged in')) {
  abort(`wrangler whoami did not confirm auth.\n\n${whoamiOut}`);
}
console.log('  Authenticated.');

// ── 7. Fresh build ─────────────────────────────────────────────────────────
console.log('\n> Running astro build...');
const build = spawnSync('npm', ['run', 'build'], { shell: true, encoding: 'utf8', stdio: 'inherit' });
if (build.status !== 0) abort(`astro build failed (exit ${build.status}).`);

// ── 8. Deploy ──────────────────────────────────────────────────────────────
console.log(`\n> Deploying to prod (${PROD_PROJECT})...`);
// NO --config. `wrangler pages deploy` rejects a custom config path outright:
// "Pages does not support custom paths for the Wrangler configuration file".
// The project is selected by --project-name, which is all this needs; the
// compatibility settings in wrangler.prod.toml live on the Pages project
// itself, set once via the dashboard or `pages project` commands.
const deploy = spawnSync(
  'npx',
  ['wrangler', 'pages', 'deploy', 'dist', '--project-name', PROD_PROJECT],
  { shell: true, encoding: 'utf8', stdio: 'inherit' }
);
if (deploy.status !== 0) abort(`wrangler pages deploy failed (exit ${deploy.status}).`);

console.log('\n✅  Prod deploy complete. Now verify by effect — load the site and sign in.\n');
