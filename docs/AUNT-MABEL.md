# Aunt Mabel — shared rules (all repos)

This is the shared root for every Aunt Mabel repo. Each repo's own `CLAUDE.md`
condenses from this file and then adds what's specific to it. If a rule applies
to more than one repo, it belongs here, not there.

**Where this file lives:** `aunt-mabel-web/docs/AUNT-MABEL.md`. It sits in the
web repo so it is version-controlled and backed up, not because it belongs to
that repo — it governs all of them. `aunt-mabel-engine/CLAUDE.md` carries its
own condensed copy of these rules; when this file changes in a way that affects
the engine, update that copy too.

## What Aunt Mabel is

A paid daily wellness-call service for elderly people living alone, operated
under Cajun Navy Ground Force. An AI voice agent (Aunt Mabel) calls each
recipient daily, holds a warm conversation, flags health/safety concerns, and
escalates to human contacts. The same daily call doubles as a disaster
tripwire: when disaster hits a recipient's area, it triggers an in-person
Cajun Navy Ground Force check.

Promise: "A friendly call every day — and a knock on the door when disaster strikes."

Future "Legacy" expansion (not yet built): with layered consent, record and
transcribe calls to preserve life stories and voice for families.

## Who's who

- **Rob** — solo founder, not CLI-native. Verifies everything visually. Never
  deploys manually — that's the repos' job.
- **Chat (a separate Claude instance)** — architect/PM. Writes briefs, makes
  design/product calls, reviews outcomes. Does not write production code.
- **Claude Code** — implementer. Receives briefs (via Rob, pasted verbatim),
  does recon, codes, builds, deploys, commits.

## The repos

| Repo | Role | Stack |
|---|---|---|
| `aunt-mabel-engine` | The calling pipeline. Live, calls real phones. | Cloudflare Workers `fetch` + `scheduled` cron, D1, Retell |
| `aunt-mabel-web` | Public site, auth, account pages. | Astro 5, Cloudflare Pages, Supabase |
| _web-backend_ | Auth/payments/email API. Not yet created. | Hono on Workers, Supabase Postgres, Stripe, SendGrid |

Each repo has its own git remote and deploys independently. They are separate
projects, not a monorepo.

**The engine is a deliberate divergence ("Option A")**: it stays a plain Workers
handler on D1 — not Hono, not Supabase. It's proven and it calls real phones.
Only realign it as a later, deliberate refactor if the split causes real
friction — never preemptively.

## Entity & naming (settled — do not re-argue)

- **Legal entity: Cajun Relief Foundation** — the registered nonprofit.
- **"Cajun Navy Ground Force"** and **"Ground Force Humanitarian Aid"** are both
  **DBAs of Cajun Relief Foundation**. They are brand names, not separate
  organizations.

**The rule:**

| Context | Use |
|---|---|
| Brand-facing copy — marketing pages, UI, email, the voice agent | **Cajun Navy Ground Force** |
| Legal documents — ToS, Privacy Policy, contracting-party language | **Cajun Relief Foundation, d/b/a Cajun Navy Ground Force** |

This settles the open contracting-party question: **Cajun Relief Foundation is
the party that contracts with the customer.** The DBAs never contract in their
own name.

"Ground Force Humanitarian Aid" is a valid DBA but is **not** the brand we lead
with — brand-facing copy was standardized away from it on 2026-08-06. Don't
reintroduce it into user-visible text.

## Architecture principles (non-negotiable, every repo)

1. Structured data through templates/config — never raw hardcoded blobs where
   config should live. New capability = configuration, not a deploy, wherever
   that's feasible.
2. **No silent fallbacks.** Missing required field/config → halt, throw, log
   loudly. The most important reliability rule — do not swallow errors into a
   quiet no-op.
3. Nothing hardcoded "just for MVP" that should be config.
4. Prompts are data.
5. Verify by effect, not presence. Confirm a change actually did what it claims
   (query the DB, check the log line, load the page) — don't assume success from
   a 200 response alone.
6. Evidence before theory in every incident. Get real trace/network/DB state
   first; treat causes as hypotheses until confirmed; diagnose live before
   grepping source.
7. Cache-bust before declaring a bug — verify against the actual deployed
   version, not an assumption that the latest edit is live.
8. Debug-hole rule: stuck, and a known-working version of the same pattern
   exists elsewhere → look at how the working one does it early, don't reinvent.
9. Long-running work goes to a Queue. Keep request handlers fast; flag anything
   that risks a CPU/time limit.
10. Log external calls — every outbound API call and inbound webhook, with
    enough detail to diagnose failures (status, headers, body), sensitive fields
    redacted. Keep real error logging in failure branches; remove only true
    debug-only scaffolding once its job is done.

## Consent (applies wherever consent is read or written)

Consent is layered and the layers are never conflated:
- the payer's signup checkbox (`consent`)
- the recipient's verbal yes on the first call (`verbal_consent`, TCPA-driven)
- recording/Legacy and voice-cloning — separate future consents, not implied by
  either of the above

## Working conventions (every repo)

- **Recon before build.** Read current state (the actual file, the actual DB
  row, the actual live log) before changing anything or proposing a fix.
- **Deploy flow**: build → deploy → verify by effect → commit.
- **Interactive/auth/secret-setting commands are Rob's to run.** Secrets are set
  via piped input, never an interactive paste — an interactive paste once
  captured a stray control character and silently corrupted a secret. Never ask
  Rob for a secret's value in chat; only secret *names* belong in conversation.
- Real key values live in Bitwarden and in the platform's own settings, never in
  a repo. Committed `.env.example` files carry placeholder names only.
- Explanations back to Rob should be plain language, brief, non-verbose — no
  jargon, no compressed rule-names quoted back at him.
- Settled architecture decisions get written into the repo's `docs/` so they
  aren't re-argued.
