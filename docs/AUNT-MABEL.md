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

A paid daily wellness-call service for elderly people living alone, operated as
a **for-profit enterprise by Trustlight LLC**, in partnership with Cajun Navy Ground
Force. An AI voice agent (Aunt Mabel) calls each recipient daily, holds a warm
conversation, flags health/safety concerns, and escalates to human contacts. The
same daily call doubles as a disaster tripwire: when disaster hits a recipient's
area, it triggers an in-person Cajun Navy Ground Force check — the partner's
side of the arrangement.

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

## Entity & naming (corrected 2026-08-06 — supersedes the earlier version)

> ⚠️ **This section replaces an earlier recording that made Cajun Relief
> Foundation the contracting party. That was wrong.** Anything written before
> this correction — in these docs, in code comments, or in the draft legal
> pages — that names the nonprofit as the operator or contracting party is
> superseded by what follows.

**Two organizations, and the distinction is the whole point:**

- **Trustlight LLC** — Rob's consulting company, and the operating entity:

  > **Trustlight LLC**
  > 1023 Jena Street
  > New Orleans, LA 70115 (Orleans Parish)

  Aunt Mabel is a **for-profit enterprise operated by Trustlight LLC**. It is the
  operator, the contracting party, the Stripe/payment entity, and the party named
  in the ToS and Privacy Policy. Its registered parish sets the venue for
  disputes — **Orleans Parish**, Louisiana governing law.
- **Cajun Navy Ground Force** — a DBA of Cajun Relief Foundation (a registered
  nonprofit), and a **PARTNER, not the owner or operator**. Its role is the
  in-person disaster-response wellness checks. Aunt Mabel uses the CNGF name **by
  partnership and permission**; the service is not operated by, or under, the
  nonprofit.

**The rule:**

| Context | Use |
|---|---|
| Brand-facing copy — marketing pages, UI, email, the voice agent | **Cajun Navy Ground Force** — the trusted name Mabel says |
| Legal documents — ToS, Privacy Policy, contracting-party language | **Trustlight LLC** — never Cajun Relief Foundation |
| Describing the disaster-response check | Cajun Navy Ground Force, **as the named partner** performing it |

So the customer-facing name and the contracting entity are deliberately
different: people hear the trusted local name, and they contract with the
for-profit that runs the service. **Never write copy implying the nonprofit
operates Aunt Mabel or takes the payment** — that is the specific error this
correction exists to prevent.

Three items remain open for the attorney, none of them naming questions: the
Trustlight LLC ↔ CNGF partnership agreement, the effort-not-guaranteed-arrival
wording on the disaster check, and how prominently the for-profit operator must
be identified behind a nonprofit-branded front. See
[legal-source.md](legal-source.md) § 4 item 8.

"Ground Force Humanitarian Aid" is another DBA of the same nonprofit but is
**not** the brand we lead with — brand-facing copy was standardized away from it
on 2026-08-06. Don't reintroduce it into user-visible text.

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

   > **Known exception, deliberate:** the engine's scheduler places calls
   > **inline** in its 15-minute cron run rather than through a Queue. Fine while
   > few recipients share a call window; the trigger to change it is a single
   > window trying to place roughly a few dozen calls or more. Call times cluster
   > hard on "9:00 AM", so that arrives sooner than subscriber counts suggest.
   > Provider concurrency (Retell/Twilio) will bind before the Worker's own
   > limits do, because the loop is I/O-bound. See
   > `aunt-mabel-engine/docs/ROADMAP.md` § Scaling.
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
