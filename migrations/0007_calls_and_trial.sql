-- Aunt Mabel — per-call records, trial end, and the scheduler cutover (7c)
-- Run manually in the Supabase SQL editor (aunt-mabel project).
-- MUST be applied BEFORE the engine code that uses it is deployed.
--
-- WHY THIS EXISTS
-- The scheduler is moving off D1 `enrollees` onto Supabase `recipients`. Two
-- things have to exist first: somewhere to record each call, and a way to know
-- when a trial ends so a recipient who never answered is never charged.

-- ── per-call records ────────────────────────────────────────────────────────
create table if not exists public.calls (
  id                 uuid primary key default gen_random_uuid(),
  recipient_id       uuid not null references public.recipients(id) on delete cascade,
  retell_call_id     text unique,
  call_date          date not null,          -- LOCAL date in the recipient's timezone,
                                             -- not UTC: the scheduler's "already called
                                             -- today" question is about their day.
  attempt            smallint not null default 1,
  status             text not null default 'placed',  -- placed|completed|no_answer|failed
  duration_seconds   integer,
  summary            text,
  sentiment          text,
  escalate           boolean not null default false,
  escalate_reason    text,
  consent_confirmed  boolean,                -- NULL is meaningful: not asked, or asked
                                             -- and not answered. Distinct from false.
  analysis           jsonb,
  created_at         timestamptz not null default now(),
  ended_at           timestamptz
);

-- The scheduler's dedup lookup is exactly this pair, every 15 minutes, per
-- recipient — the one query that must stay fast as call history grows.
create index if not exists idx_calls_recipient_date on public.calls (recipient_id, call_date);

alter table public.calls enable row level security;

-- Families READ their own recipients' calls. There is deliberately NO insert,
-- update or delete policy: only the engine writes here, and it holds the
-- service-role key, which bypasses RLS. With RLS on and no write policy, a
-- browser session cannot fabricate or alter a call record even if it tried —
-- these rows are the account of what actually happened to someone's parent.
create policy "own calls" on public.calls
  for select using (
    recipient_id in (
      select r.id
        from public.recipients r
        join public.accounts a on a.id = r.account_id
       where a.auth_user_id = auth.uid()
    )
  );

-- ── trial end, for the silence case ─────────────────────────────────────────
-- If a recipient reaches the end of the free trial having never confirmed
-- consent — no yes, no no, simply never reached — the subscription is cancelled
-- and the recipient paused BEFORE any charge. That needs a deadline to compare
-- against, and `created_at` is not it: the row is created at step 3 of
-- enrollment, minutes-to-days before payment actually starts the trial.
alter table public.recipients
  add column if not exists trial_ends_at timestamptz;

-- The silence sweep runs every 15 minutes and filters on exactly these three.
create index if not exists idx_recipients_trial_watch
  on public.recipients (trial_ends_at)
  where status = 'active' and verbal_consent = false;

-- ── activate_recipient, now also stamping the trial deadline ────────────────
--
-- ⚠️ DROP FIRST, DELIBERATELY. In Postgres a different argument list creates an
-- OVERLOAD rather than replacing the function, and PostgREST would then see two
-- candidates for the same name. Dropping also discards the grants, so 0004's
-- lockdown is re-applied at the bottom — without that the new function would
-- silently come back with Supabase's default anon/authenticated EXECUTE grants,
-- on a SECURITY DEFINER function that bypasses RLS.
drop function if exists public.activate_recipient(uuid, text, text);

create or replace function public.activate_recipient(
  p_recipient_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text default null,
  p_trial_days integer default 3
)
returns table (
  recipient_id uuid,
  account_id uuid,
  status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_account_id   uuid;
  v_status       text;
  v_customer     text;
  v_subscription text;
  v_trial        timestamptz;
begin
  if p_recipient_id is null then
    raise exception 'activate_recipient: recipient_id is required';
  end if;
  if p_stripe_customer_id is null or btrim(p_stripe_customer_id) = '' then
    raise exception 'activate_recipient: stripe_customer_id is required';
  end if;
  if p_trial_days is null or p_trial_days < 0 then
    raise exception 'activate_recipient: trial_days must be zero or more';
  end if;

  -- The parent account is LOOKED UP, never passed in, so a caller cannot aim
  -- the customer-id write at an account of its choosing.
  select r.account_id into v_account_id
    from public.recipients r
   where r.id = p_recipient_id;

  if not found then
    raise exception 'activate_recipient: no recipient %', p_recipient_id
      using errcode = 'P0002';
  end if;

  update public.accounts a
     set stripe_customer_id = p_stripe_customer_id
   where a.id = v_account_id
  returning a.stripe_customer_id into v_customer;

  if not found then
    raise exception 'activate_recipient: no account % for recipient %', v_account_id, p_recipient_id
      using errcode = 'P0002';
  end if;

  -- coalesce throughout: a redelivered Stripe event must not erase a
  -- subscription id we already hold, and must not EXTEND someone's trial by
  -- restamping the deadline.
  update public.recipients r
     set status = 'active',
         stripe_subscription_id = coalesce(p_stripe_subscription_id, r.stripe_subscription_id),
         trial_ends_at = coalesce(r.trial_ends_at, now() + make_interval(days => p_trial_days))
   where r.id = p_recipient_id
  returning r.status, r.stripe_subscription_id, r.trial_ends_at
       into v_status, v_subscription, v_trial;

  if not found then
    raise exception 'activate_recipient: recipient % vanished mid-transaction', p_recipient_id
      using errcode = 'P0002';
  end if;

  return query select p_recipient_id, v_account_id, v_status, v_customer, v_subscription, v_trial;
end;
$$;

-- Re-apply the 0004 lockdown to the NEW signature. Supabase's default
-- privileges grant EXECUTE to anon AND authenticated explicitly at creation,
-- and revoking from PUBLIC does not remove an explicit grant held by a named
-- role — so all three are revoked by name.
revoke execute on function public.activate_recipient(uuid, text, text, integer) from public;
revoke execute on function public.activate_recipient(uuid, text, text, integer) from anon;
revoke execute on function public.activate_recipient(uuid, text, text, integer) from authenticated;
grant  execute on function public.activate_recipient(uuid, text, text, integer) to service_role;

-- Verification (run after).
--
-- 1. The calls table and its policy (expect 1 row, and "own calls"):
-- select tablename, rowsecurity from pg_tables where tablename = 'calls';
-- select policyname, cmd from pg_policies where tablename = 'calls';
--
-- 2. Exactly ONE activate_recipient, with four arguments:
-- select p.proname,
--        pg_get_function_identity_arguments(p.oid) as args,
--        case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security_type
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'activate_recipient';
--
-- 3. Lockdown intact on the new signature (expect false, false, true):
-- select
--   has_function_privilege('anon',          'public.activate_recipient(uuid,text,text,integer)', 'execute') as anon_can,
--   has_function_privilege('authenticated', 'public.activate_recipient(uuid,text,text,integer)', 'execute') as authed_can,
--   has_function_privilege('service_role',  'public.activate_recipient(uuid,text,text,integer)', 'execute') as service_can;
--
-- 4. trial_ends_at exists:
-- select column_name, data_type from information_schema.columns
--  where table_name = 'recipients' and column_name = 'trial_ends_at';
