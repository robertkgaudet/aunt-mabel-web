-- Aunt Mabel — atomic recipient activation on successful payment
-- Run manually in the Supabase SQL editor (aunt-mabel project).
-- MUST be applied BEFORE the engine code that calls it is deployed.
--
-- WHY THIS EXISTS
-- The Stripe webhook records a successful payment across two tables: the Stripe
-- customer on `accounts`, and activation on `recipients`. Two PostgREST calls
-- have no transaction around them, so a failure in between leaves a payment
-- half-recorded. This function makes both one statement, therefore one
-- transaction. Same reasoning as record_consent() in migration 0003.
--
-- ⚠️ SECURITY DEFINER — and here that is correct, unlike record_consent().
-- record_consent() runs as the signed-in user, so RLS defines what it may
-- touch. This function has NO user session: it is called by a server-to-server
-- Stripe webhook holding the service-role key. There is no auth.uid() to check
-- against, so the safety cannot come from RLS. It comes instead from the body
-- being deliberately narrow:
--   * it touches exactly ONE recipient — the id it was handed
--   * and exactly ONE account — that recipient's own parent, looked up here
--     rather than accepted as a parameter, so a caller cannot aim the write at
--     an account of its choosing
--   * it sets a fixed set of columns to a fixed status; nothing is caller-driven
--     except the Stripe ids
-- It cannot be made to update an arbitrary row, which is the property that makes
-- DEFINER acceptable in this one place.
--
-- Execution is locked to `service_role` at the bottom. Note that service_role
-- bypasses RLS but NOT function-execute grants, so that grant is real.

-- ── the column the pause path needs ──────────────────────────────────────────
-- Billing is one subscription PER RECIPIENT (checkout sends the recipient id as
-- client_reference_id), while an account has ONE Stripe customer for the payer.
-- Without this column, a lapsed-subscription webhook only has the customer id —
-- so a payer with two parents enrolled would have BOTH paused when one
-- subscription failed. The engine's old D1 code had exactly that bug
-- (`UPDATE enrollees SET status='paused' WHERE stripe_customer_id = ?`).
--
-- It lives in this migration rather than its own so the ordering cannot go
-- wrong: the function below references the column.

alter table public.recipients
  add column if not exists stripe_subscription_id text;

-- One recipient per subscription. Also the guard that would catch the bug above
-- returning: attaching one subscription to two recipients fails here instead of
-- quietly pausing the wrong person.
create unique index if not exists idx_recipients_stripe_subscription
  on public.recipients (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ── the function ─────────────────────────────────────────────────────────────
--
-- NOTE ON THE SIGNATURE: the brief specified
--   activate_recipient(p_recipient_id uuid, p_stripe_customer_id text)
-- and that exact two-argument call still works — the third parameter defaults
-- to null. It was added because the subscription id has to be written in the
-- SAME transaction as the activation. Writing it afterwards would reintroduce
-- precisely the split this function exists to remove, and in the worse
-- direction: a recipient activated but with no subscription id recorded can
-- never be paused when they stop paying, so calls would continue after
-- cancellation.

create or replace function public.activate_recipient(
  p_recipient_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text default null
)
returns table (
  recipient_id uuid,
  account_id uuid,
  status text,
  stripe_customer_id text,
  stripe_subscription_id text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_account_id uuid;
  v_status     text;
  v_customer   text;
  v_subscription text;
begin
  if p_recipient_id is null then
    raise exception 'activate_recipient: recipient_id is required';
  end if;
  if p_stripe_customer_id is null or btrim(p_stripe_customer_id) = '' then
    raise exception 'activate_recipient: stripe_customer_id is required';
  end if;

  -- The parent account is LOOKED UP, never passed in. This is what stops a
  -- caller from pointing the customer-id write at someone else's account.
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

  -- coalesce so a retried webhook that arrives without a subscription id does
  -- not erase one we already recorded.
  update public.recipients r
     set status = 'active',
         stripe_subscription_id = coalesce(p_stripe_subscription_id, r.stripe_subscription_id)
   where r.id = p_recipient_id
  returning r.status, r.stripe_subscription_id into v_status, v_subscription;

  if not found then
    raise exception 'activate_recipient: recipient % vanished mid-transaction', p_recipient_id
      using errcode = 'P0002';
  end if;

  return query select p_recipient_id, v_account_id, v_status, v_customer, v_subscription;
end;
$$;

-- ── lock execution to the service role ───────────────────────────────────────
-- Supabase's default privileges grant EXECUTE to anon AND authenticated
-- explicitly at creation time, and revoking from PUBLIC does not remove an
-- explicit grant held by a named role — the lesson from migration 0004. Revoke
-- all three by name. A SECURITY DEFINER function reachable by anon would be a
-- genuine hole, not merely untidy: it bypasses RLS by design.
revoke execute on function public.activate_recipient(uuid, text, text) from public;
revoke execute on function public.activate_recipient(uuid, text, text) from anon;
revoke execute on function public.activate_recipient(uuid, text, text) from authenticated;
grant  execute on function public.activate_recipient(uuid, text, text) to service_role;

-- Verification (run after).
--
-- 1. The column and its index (expect one row each):
-- select column_name, data_type from information_schema.columns
--   where table_name = 'recipients' and column_name = 'stripe_subscription_id';
-- select indexname from pg_indexes
--   where tablename = 'recipients' and indexname = 'idx_recipients_stripe_subscription';
--
-- 2. The function exists and is DEFINER (expect security_type = DEFINER):
-- select p.proname,
--        case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security_type,
--        pg_get_function_identity_arguments(p.oid) as args
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'activate_recipient';
--
-- 3. Only service_role may execute it (expect false, false, true):
-- select
--   has_function_privilege('anon',          'public.activate_recipient(uuid,text,text)', 'execute') as anon_can,
--   has_function_privilege('authenticated', 'public.activate_recipient(uuid,text,text)', 'execute') as authed_can,
--   has_function_privilege('service_role',  'public.activate_recipient(uuid,text,text)', 'execute') as service_can;
