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

## Emergency posture (standing rule, every repo)

> **Aunt Mabel is never emergency response.** Real emergencies route to 911,
> always. Family-connect is a comfort-and-notification layer — **not** a
> substitute for emergency services. Nothing in the product, the persona, the UI
> copy, or the marketing may imply otherwise.

This is a standing rule, not a roadmap item: it constrains the voice agent, the
website, the emails, and the legal pages equally. It sits alongside the
not-a-medical-service positioning and the open attorney items.

Three pieces of work follow from it — **the second is a core MVP requirement
that blocks launch**, not a future enhancement. All detailed in
[`aunt-mabel-engine/docs/ROADMAP.md`](../../aunt-mabel-engine/docs/ROADMAP.md)
§ Emergency posture & between-call reachability:

1. **Persona refinement (near-term).** Mabel already urges 911 on a reported
   fall — that stays. The refinement: a cost or logistics objection ("I can't
   afford an ambulance") must not soften the urgency. She acknowledges the
   worry, keeps pointing firmly to emergency care, and escalates to family
   **regardless** of what the person decides. No reassurance that helps someone
   talk themselves out of calling 911. Retell prompt is the source of truth;
   `prompts/mabel-persona.md` is synced to match.
2. 🔴 **In-the-moment family connect — CORE MVP REQUIREMENT, every account.**
   Distress detected *during* a call triggers an immediate notification to the
   emergency contact — "let me let Sarah know right now" — rather than waiting
   for the post-call analysis that escalation hangs off today.

   **Promoted from a future upcharge to core**, because an elderly person in
   distress must never be told, in effect, "I'll call back tomorrow." Reaching
   their family in the moment is central to the product's purpose, not a tier
   sold to families who can afford it. It may raise the base price and may delay
   MVP launch — **both accepted**, and neither reopens the decision.
3. **Reachability tiers.** **Core, every account, in MVP:** Mabel leads with 911,
   and immediately reaches the emergency contact on detected distress. **Later
   enhancement:** warm-transfer the live call to the family member. **Later
   premium (optional):** a paid real-person callback line — whose wording is a
   legal question, of the same class as the disaster-check "effort, not
   guaranteed arrival" item already with the attorney.

## Consent (applies wherever consent is read or written)

Consent is layered and the layers are never conflated:
- the payer's signup checkbox (`consent`)
- the recipient's verbal yes on the first call (`verbal_consent`, TCPA-driven)
- recording/Legacy and voice-cloning — separate future consents, not implied by
  either of the above

## Admin / operator dashboard (planned — after the family dashboard)

Rob's internal view of every customer: all accounts and recipients, subscription
status and MRR, system-wide call monitoring, and support lookup with manual
intervene. **Not customer-facing.** Planned after the family dashboard (3a/3b),
whose call queries and display patterns it reuses. At pilot scale Rob manages
via Supabase queries in the interim.

**The security model is inverted, and that is the point to remember.** The
family dashboard is safe because RLS lets a signed-in user see only their own
account. The admin dashboard exists to see everyone, so RLS cannot be what
protects it:

> A bug that widens a family query leaks one family's data.
> A bug in the admin gate leaks everybody's.

So it lives on a **separate route** (`/admin`), behind an **explicit admin gate
checked server-side**, and must never be reachable by a regular customer. Access
model is decided at build time — an allowlist of admin emails is the simplest, a
`role` column on `accounts` the fuller version once staff exist.

Full detail, including the RLS-vs-service-role fork this choice implies, is in
[`aunt-mabel-engine/docs/ROADMAP.md`](../../aunt-mabel-engine/docs/ROADMAP.md)
§ Admin / Operator dashboard.

## Working conventions (every repo)

- **MOVE FAST — always build a fast path to test.** Rob cannot and will not wait
  on slow feedback loops (e.g. waiting up to 15 minutes for a cron tick to test
  a call). Whenever a feature can only be exercised through a slow or scheduled
  path, **also** provide an immediate on-demand trigger — an authenticated test
  endpoint, a manual invoke, a bypass of timing windows — so it can be tested
  instantly and iterated on rapidly. **Default to giving Rob a way to fire the
  thing NOW.** Test-only triggers are marked clearly and removed or secured
  before launch, but **they exist from the start**. Slow-only test paths are
  unacceptable.

  The trigger is additional, never a substitute: it must exercise the real code
  path rather than a lookalike, or it proves nothing. And a shortcut around a
  *timing* control is not licence to shortcut a *safety* control — see
  `/api/place-call-now` in the engine, which skips the call window and the
  same-day dedup but still refuses to ring anyone whose payer never consented.
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
