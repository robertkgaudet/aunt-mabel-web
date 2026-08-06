-- Aunt Mabel — atomic consent write (enrollment Step 6)
-- Run manually in the Supabase SQL editor (aunt-mabel project).
--
-- WHY THIS EXISTS
-- Step 6 records consent across two tables: acceptance timestamps on accounts,
-- and the TCPA call-consent flag on recipients. Done as two PostgREST calls
-- there is no transaction around them, so a failure in between leaves consent
-- half-recorded. This function makes both updates one statement, and therefore
-- one transaction: either the whole consent record lands, or none of it does.
--
-- SECURITY: SECURITY INVOKER (the default) — deliberately.
-- The function runs as the calling user, so the existing RLS policies on
-- accounts and recipients still apply to every statement inside it. That means
-- ownership is defined in exactly ONE place (the policies in migration 0001),
-- and this function cannot grant access the caller doesn't already have.
-- A SECURITY DEFINER version would bypass RLS and need its own auth.uid()
-- checks — a second copy of the ownership rules, free to drift out of sync with
-- the policies. For a function whose entire job is recording legal consent,
-- duplicated authorization logic is exactly the wrong trade.
--
-- Because RLS filters rather than errors, an UPDATE that matches nothing simply
-- affects zero rows. That would be a silent no-op returning "success", so both
-- updates check FOUND and raise instead.

create or replace function public.record_consent(
  p_account_id uuid,
  p_recipient_id uuid
)
returns table (
  consent boolean,
  tos_accepted_at timestamptz,
  not_medical_ack_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_tos     timestamptz;
  v_ack     timestamptz;
  v_consent boolean;
begin
  if p_account_id is null or p_recipient_id is null then
    raise exception 'record_consent: account_id and recipient_id are both required';
  end if;

  -- coalesce, not assignment: an existing acceptance is never overwritten.
  -- Coming back and pressing Continue again is the same acceptance, not a new
  -- one — the audit question is when the payer FIRST accepted.
  -- now() is the transaction timestamp, so both columns get the same instant.
  update public.accounts a
     set tos_accepted_at    = coalesce(a.tos_accepted_at, now()),
         not_medical_ack_at = coalesce(a.not_medical_ack_at, now())
   where a.id = p_account_id
  returning a.tos_accepted_at, a.not_medical_ack_at
       into v_tos, v_ack;

  if not found then
    raise exception 'record_consent: account % is not available to this user', p_account_id
      using errcode = '42501';
  end if;

  -- The account_id predicate is belt and braces: it ties the consent flag to
  -- the same account we just timestamped, so consent can never be recorded for
  -- a recipient sitting under a different account — even one the caller owns.
  update public.recipients r
     set consent = true
   where r.id = p_recipient_id
     and r.account_id = p_account_id
  returning r.consent
       into v_consent;

  if not found then
    raise exception 'record_consent: recipient % is not available to this user on account %',
      p_recipient_id, p_account_id
      using errcode = '42501';
  end if;

  return query select v_consent, v_tos, v_ack;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on new functions by default. Take that back
-- first, then hand it to signed-in users only. RLS would already stop an anon
-- caller from changing anything, but there is no reason to leave the door open.
revoke execute on function public.record_consent(uuid, uuid) from public;
grant  execute on function public.record_consent(uuid, uuid) to authenticated;

-- Verification (run after; expect one row, security_type = INVOKER):
-- select p.proname,
--        case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security_type,
--        pg_get_function_identity_arguments(p.oid) as args
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public' and p.proname = 'record_consent';
--
-- And that only `authenticated` can execute it (expect no 'PUBLIC=X' entry):
-- select proacl from pg_proc where proname = 'record_consent';
