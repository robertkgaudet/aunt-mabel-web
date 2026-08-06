# Enrollment flow — settled design

**Status: settled 2026-08-06.** This is the spec. Build chunks from this file,
not from inference. If a chunk needs something this document doesn't answer,
the answer gets added here first.

Entity/naming, registered address, palette and type all follow
[AUNT-MABEL.md](AUNT-MABEL.md) and [brand-capture.md](brand-capture.md).

---

## Architecture — "C" (hybrid)

Eight steps: **7 user-visible steps + a confirmation.** Two of them are real
navigation boundaries, the rest swap client-side on a single `/enroll` page.

| | Step | Kind | Writes |
|---|---|---|---|
| 1 | Who is this for? | collect | — (held in state) |
| 2 | Create your account | **handoff** | `accounts` |
| 3 | Who we're calling | collect | `recipients` |
| 4 | Emergency contacts | collect | `contacts` |
| 5 | Doctor (optional) | collect | `recipients` |
| 6 | Consent | collect | `recipients.consent`, `accounts.tos_accepted_at`, `accounts.not_medical_ack_at` |
| 7 | Payment | **handoff** | `accounts.stripe_customer_id`, flips `recipients.status` |
| 8 | Done | confirmation | — |

**Why hybrid.** Answering short questions shouldn't cost a page load each, so
the collect steps swap in place. But two steps genuinely cannot be JS views:

- **Step 2** has to survive an email round-trip (magic link) or an OAuth
  redirect. The user physically leaves the browser tab.
- **Step 7** is Stripe Checkout, which owns its own page.

Do not "optimize" either into an in-page view. They are the two points where
the flow hands control to something outside it, and the design depends on
them being real boundaries.

---

## The steps

### Step 1 — Who is this for? ✅ BUILT

Single question, two choice cards:

- **"My parent or loved one"** → `is_self = false`
- **"Myself"** → `is_self = true`

Explicit Continue rather than auto-advance — this audience benefits from a beat
to change their mind, and a screen that jumps out from under a tap reads as an
error, not as speed. Held in client state; nothing is written to the database
at this step.

### Step 2 — Create your account (payer) — **NAVIGATION BOUNDARY**

Supabase auth: **Google OAuth + email magic link. No passwords, no Apple.**
Reuses the existing pattern in `src/scripts/supabase.js` and `src/scripts/auth.js`.

Then **find-or-create** the `accounts` row for the authenticated user
(`auth_user_id`, `email`). Find-or-create, not create — someone enrolling a
second recipient already has an account.

**Why it sits at position 2, right after one cheap question:** everything from
Step 3 onward is information about a *third party* — a name, a phone number, a
medical contact. Capturing the payer's identity first means (a) we have a real
account to attach that data to as it is entered, and (b) **a mid-flow dropout
after Step 2 is still a captured lead** rather than an anonymous bounce. Step 1
comes first only because it is one tap and it frames what the account is for.

### Step 3 — Who we're calling (recipient)

Writes `recipients`.

| Field | Notes |
|---|---|
| `name` | required |
| `phone` | required, normalized to **E.164** |
| `call_time` | required, local `HH:MM` 24h |
| `zip` | required — this is the disaster tripwire key, not an optional nicety |
| `timezone` | **inferred from `zip`, then shown back for confirmation** |

`is_self` from Step 1 is written here too. When `is_self = true`, prefill what
we already know from the account rather than asking twice.

> **Open implementation question:** the zip → timezone inference needs a source
> (lookup table shipped with the app, or an API). Whichever it is, the inferred
> value must be *displayed for confirmation* and overridable — a silently wrong
> timezone means calls land at the wrong hour, and per the architecture rules a
> bad inference must not pass silently.

### Step 4 — Emergency contacts

Writes `contacts`. **One required, up to two.** The cap is a current-tier limit,
not a permanent one — paid tiers raise it later, so don't hard-code 2 anywhere
that config could live.

Per contact: `name`, `phone`, `email`, `relationship`, `notify_method`.

`notify_method` offers **email / sms / call**, but **only email is actually
delivered today**. SMS and call render **visibly disabled with a "coming soon"
label** — shown so the roadmap is legible, disabled so nobody selects a channel
that silently never fires.

**Each contact needs at least one of phone or email** (settled 2026-08-06). A
contact we cannot actually reach is not an escalation path, and `name` alone
gives us nowhere to send the alert. Both columns stay nullable in the schema —
the requirement is "at least one", not "both".

**When `is_self` is true, nudge but don't block** (settled 2026-08-06). Someone
enrolling themselves may list themselves as their own emergency contact, which
defeats the point — if Mabel is worried about them, we'd be alerting the person
we're worried about. Show helper text naming the recipient ("someone other than
Eleanor who we can reach if we're worried"). It stays a nudge: a person with no
one else to list must still be able to finish, and blocking them would exclude
exactly the most isolated recipients this service exists for.

### Step 5 — Doctor (optional)

Writes `doctor_name`, `doctor_phone` on `recipients`. Genuinely optional —
present a clear way to skip that doesn't read as a dead end or as a warning.

### Step 6 — Consent (the legal heart of the flow)

**Three separate checkboxes. Unbundled. None pre-checked. None combined into a
single "I agree to everything."**

| | Box | Writes |
|---|---|---|
| a | **TCPA call consent + authority to enroll** — permission to place automated calls to this number, and confirmation the payer has the standing to enroll this person | `recipients.consent` |
| b | **Not-an-emergency / medical / monitoring service** acknowledgment | `accounts.not_medical_ack_at` |
| c | **Terms of Service + Privacy Policy** acceptance | `accounts.tos_accepted_at` |

All three are **timestamped** (`timestamptz`) for audit — see
[migration 0002](../migrations/0002_consent_timestamps.sql).

**Do not "improve" this step.** Bundling the boxes, pre-checking any of them, or
collapsing them into one control destroys the audit trail's meaning and the
legal defensibility that is the entire reason the step exists. TCPA carries
statutory per-call damages.

This is the payer's consent layer only. The recipient's **verbal consent** is
captured separately, on the first call, via the `call_analyzed` webhook
(`verbal_consent`). Legacy/recording and voice-cloning consents are separate
future consents. Per [AUNT-MABEL.md](AUNT-MABEL.md), these layers are never
conflated.

### Step 7 — Payment — **NAVIGATION BOUNDARY**

Stripe Checkout.

- **$39/month** standard
- **$29/month** founding rate, via **promo code**
- `client_reference_id` carries the **recipient id** (or account id) so the
  webhook can tie the payment back to the right row
- Webhook flips `recipients.status` from `pending_payment` → `active`

> **Open questions:** (1) `client_reference_id` — recipient id and account id
> behave differently once an account has more than one recipient; pick recipient
> id unless there's a reason not to, and write the choice down here. (2) Which
> service owns the Stripe webhook. The engine already has `/api/stripe-webhook`,
> but per AUNT-MABEL.md payments belong to the future web-backend repo. Decide
> before building this chunk.

### Step 8 — Done

Confirmation, plus a link to the dashboard. Say plainly what happens next and
when the first call goes out.

---

## Recorded decisions

**State is in-memory only. No `sessionStorage`, no `localStorage` — deliberately.**
From Step 3 onward the flow holds information about a *third party* who has not
yet consented to anything; consent is not captured until Step 6. Persisting that
to the browser before then is not a caching detail, it's a data-handling
decision, and the answer is no. **A reload returns to Step 1.** That is the
intended behavior, not a bug to fix.

**Progress indicator denominator derives from the step config** (currently 8).
Change the step array and the "Step N of M" text follows. Never hard-code the
total.

**A dropout after Step 2 is a captured lead.** The account row exists with no
recipient attached. That's a recoverable state worth reporting on later, not an
error.

**Entity, naming, address, palette, type** — per [AUNT-MABEL.md](AUNT-MABEL.md).
Brand-facing copy says "Cajun Navy Ground Force"; legal text says "Cajun Relief
Foundation, d/b/a Cajun Navy Ground Force."

---

## What's built today (2026-08-06)

**Chunk 1 shipped:** the hybrid skeleton and Step 1, live at
`/enroll` on the test deployment. Step advance, progress indicator, in-flow
browser Back, and `is_self` capture are all verified in-browser against the
deployed page.

⚠️ **The `STEPS` array in `src/pages/enroll.astro` does not yet match this
document.** It was written before this design was settled and still reflects the
earlier inferred order — it puts account creation at position 7 and has no
doctor or done step. The denominator happens to read 8 either way, so this will
not announce itself. **Realigning that array to the table at the top of this
file is the first task of the next chunk.**

Also carried into the next chunk: the temporary debug strip and the
`console.log('[enroll] state', …)` in `enroll.astro` are marked for removal
before launch.
