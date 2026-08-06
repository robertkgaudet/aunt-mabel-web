# Aunt Mabel Web — CLAUDE.md

This is the **frontend repo** for Aunt Mabel: public site, auth, and account
pages. Read this before making changes.

Shared rules for every Aunt Mabel repo live in `../AUNT-MABEL.md` — read that
too. The condensed version is below; where the two disagree, the parent wins.

## What this repo is

Astro 5 static site on Cloudflare Pages. Public marketing pages, sign-in, and
(soon) the account area where a payer manages recipients and contacts.

It is a **separate project and separate git repo** from `aunt-mabel-engine`.
Not a monorepo, not a workspace. The engine calls phones; this repo does not
place calls and does not talk to D1.

## Condensed shared rules

- **No silent fallbacks.** Missing required config → throw loudly. A missing
  Supabase env var must break visibly at first use, never degrade into a button
  that does nothing.
- **Verify by effect.** A green build is not proof. Load the page, click the
  button, confirm the session actually exists.
- **Recon before build.** Read the actual file / actual live page first.
- **Evidence before theory.** Real network trace and console state before
  hypotheses.
- Structured data through config, not hardcoded blobs.
- Explanations back to Rob: plain language, brief, no jargon.
- Rob runs anything interactive or secret-setting. Never ask him for a secret's
  value in chat — only secret *names*.

## Stack and structure

- **Astro 5**, `output: 'static'` with `@astrojs/cloudflare`. Every page
  prerenders by default; a page opts INTO SSR with `export const prerender = false`
  in its frontmatter. Nothing needs SSR today — auth is entirely client-side.
- **Plain CSS.** No Tailwind, no CSS-in-JS, no component library on the public
  side. Tokens and shared classes live in `src/styles/site.css`.
- **Supabase** for auth only, from the browser.

```
src/
  layouts/BaseLayout.astro     public shell — plain CSS, no Bootstrap
  layouts/homer/               Homer's shell (Bootstrap) — admin area only
  components/homer/            Homer's 6 chrome components
  config/homer-theme.ts        Homer theme data-* attributes
  content-fragments/           Homer's 110 raw HTML fragments
  pages/                       our pages (plain CSS)
  pages/homer/                 Homer's 110 demo pages, namespaced
  scripts/supabase.js          the client singleton
  scripts/auth.js              guard + redirect helpers
  styles/site.css              our tokens and classes
public/assets/                 Homer's 20 MB of CSS/JS/plugins/images
```

## The two design worlds (do not mix them)

This repo carries two visual systems that must never appear on the same page:

- **Public + auth pages** — hand-written plain CSS via `BaseLayout.astro`. No
  Bootstrap, no jQuery. Type is deliberately large (18px base) and contrast
  high: many visitors are elderly recipients or family reading on a phone.
- **Homer admin area at `/homer/`** — Bootstrap 5 + jQuery + ~20 plugins, via
  `src/layouts/homer/*`. This is the harvested template, kept browsable as a
  component reference for building the logged-in area.

Homer owns the `/assets/` URL namespace (its minified bundles resolve plugin
paths that way at runtime — do not relocate them). Our own files go under
`/styles/` and elsewhere. Homer's pages are namespaced under `/homer/` so its
110 demo routes can't collide with ours.

## Auth

Google OAuth + email magic link. **No passwords. No Apple.** Adding a provider
means a button in `/login` and enabling it in Supabase's dashboard — nowhere else.

- `src/scripts/supabase.js` — `getSupabase()`, a memoized singleton. Throws if
  `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are missing. PKCE flow.
- `src/pages/login.astro` — both sign-in methods; hides the form until the
  already-signed-in check completes so there's no flash.
- `src/pages/auth/callback.astro` — **polls `getSession()` 8× at 250ms.** The
  SDK parses the token out of the URL asynchronously, so the session is not
  reliably there on the first tick after the redirect. Do not "simplify" this
  into a single call; it will work locally and fail intermittently in prod.
- `src/pages/auth/check-email.astro` — magic-link confirmation.
- `src/pages/signout.astro` — uses `signOut({ scope: 'local' })`. The default
  `'global'` needs a successful server call; with an expired token that call
  fails and Supabase silently KEEPS the session, so sign-out appears to do
  nothing.
- `src/scripts/auth.js` — `requireSession()` (the per-page guard),
  `isSafeRedirect()` (open-redirect guard), `resolveAuthDestination()`,
  `signOutCleanly()`.

**Per-page guard** — three lines at the top of any page needing a session:

```js
import { requireSession } from '../scripts/auth.js';
const session = await requireSession();
if (!session) return;   // requireSession already redirected to /login
```

See `src/pages/account.astro` for the working reference.

## Environment variables

Only two, both browser-safe:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

Anything prefixed `PUBLIC_` is inlined into the browser bundle at build time.
The anon key is safe to expose — it can only do what RLS policies allow. **The
service-role key is never used in this repo** and must never appear in a browser
bundle.

Real values come from Bitwarden. `.env.example` holds placeholder names only;
`.env.local` is gitignored. For deployed builds, set them in the Cloudflare Pages
project's build environment variables.

## Deploy

Two Cloudflare Pages projects, one guarded path to each:

| | Project | Command | Config |
|---|---|---|---|
| Test | `aunt-mabel-web-test` | `npm run deploy:test` | `wrangler.toml` |
| Prod | `aunt-mabel-web` | `npm run deploy:prod` | `wrangler.prod.toml` |

`deploy:prod` runs `scripts/deploy-prod.mjs`, which refuses to deploy on: not a
git repo, dirty working tree, HEAD ahead of upstream, missing
`CLOUDFLARE_API_TOKEN`, unconfirmed wrangler auth, or a failed build. **Never
call `wrangler pages deploy` against the prod project directly** — that bypasses
every one of those checks.

Before a prod deploy, Rob sets the token in his shell:

```powershell
$env:CLOUDFLARE_API_TOKEN = [System.Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN', 'User')
```

Note: `wrangler whoami` exits 255 on Windows even when auth succeeds. The guard
checks stdout for "You are logged in", not the exit code — don't "fix" that.

## Not built yet (don't build without a brief)

- **Signup / registration flow** — deliberately absent. Rob is designing it; it
  arrives as its own brief.
- Account management (recipients, contacts, call history), billing/Stripe, and
  any read of engine data. Stripe and transactional email belong in the future
  web-backend repo, not here.
