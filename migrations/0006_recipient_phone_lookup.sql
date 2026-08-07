-- Aunt Mabel — phone lookup for the consent-decline billing cancellation
-- Run manually in the Supabase SQL editor (aunt-mabel project).
--
-- ⚠️ READ FIRST — THIS IS NOT WHAT THE BRIEF ASKED 0006 TO BE.
-- The brief asked for 0006 to store `stripe_subscription_id`. **Migration 0005,
-- as approved, already adds that column** (plus its partial unique index) — the
-- column had to live there because activate_recipient() references it and the
-- ordering could not be allowed to go wrong. A second migration adding it would
-- be a no-op. The recommendation the brief asked for is recorded below.
--
-- So 0006 addresses the thing that actually blocks the decline path instead.
-- **It is optional.** Skip it and the code still behaves correctly — it is a
-- lookup index and a documented seam, not a correctness fix.
--
-- ── WHY stripe_subscription_id LIVES ON `recipients`, NOT `accounts` ─────────
-- A Stripe CUSTOMER is the payer, so it belongs on `accounts` — one per payer.
-- A Stripe SUBSCRIPTION is one enrollment of one person, so it belongs on
-- `recipients`. The two are not the same cardinality: an account with two
-- parents enrolled has ONE customer and TWO subscriptions.
-- Putting the subscription on `accounts` would make the second enrollment
-- overwrite the first, and a lapse webhook could then only ever pause "the
-- account", stopping calls for a parent whose subscription is fully paid up.
-- That is exactly the bug the engine's old D1 code had.
--
-- ── WHY THIS INDEX ──────────────────────────────────────────────────────────
-- When a recipient declines verbal consent on Mabel's welcome call, the trial
-- subscription must be cancelled before it converts. But Retell calls are placed
-- from D1 `enrollees` (the scheduler still reads that table), while the
-- subscription lives on a Supabase `recipients` row, and NOTHING links those two
-- records. The phone number — normalized to E.164 on both sides — is the only
-- bridge available today, so the webhook looks the recipient up by phone.
--
-- 7c should put the Supabase recipient id into the Retell call metadata and
-- delete that lookup. This index is scaffolding for the interim, and the comment
-- on it says so, so it can be dropped without archaeology.

-- ── the columns, restated idempotently ──────────────────────────────────────
-- 0005 already adds this; repeated here with `if not exists` so 0006 satisfies
-- the brief on its own terms and is a safe no-op after 0005. It is deliberately
-- NOT the authoritative home for the column — 0005 is, because the function
-- there references it.
alter table public.recipients
  add column if not exists stripe_subscription_id text;

-- accounts.stripe_customer_id already exists — it has been in the schema since
-- migration 0001 (`stripe_customer_id text` on accounts). Restated here for the
-- same reason, and a no-op on any database that ran 0001.
alter table public.accounts
  add column if not exists stripe_customer_id text;

create index if not exists idx_recipients_phone
  on public.recipients (phone);

comment on index public.idx_recipients_phone is
  'Interim: lets the consent-decline path find a recipient by phone, because Retell calls are keyed to D1 enrollees and nothing else links the two. Drop once 7c puts recipient_id into Retell call metadata.';

-- ── DELIBERATELY *NOT* A UNIQUE INDEX ───────────────────────────────────────
-- Uniqueness on phone would make the lookup unambiguous, and D1's `enrollees`
-- does enforce it. It is not done here because it would also block re-enrolling
-- someone after a cancellation: the old paused row keeps the number, and the new
-- signup would fail at the database with an error no one in the enrollment flow
-- is expecting.
--
-- The code handles ambiguity instead, and refuses to guess: if a phone matches
-- more than one recipient it cancels NOTHING and tells Rob to do it by hand.
-- Cancelling the wrong person's subscription is worse than cancelling none.

-- Verification (run after; expect idx_recipients_phone):
-- select indexname from pg_indexes
--  where tablename = 'recipients' and indexname = 'idx_recipients_phone';
