-- Aunt Mabel — the account holder's own name (Dashboard 3a)
-- Run manually in the Supabase SQL editor (aunt-mabel project).
-- MUST be applied BEFORE the dashboard code that selects it is deployed.
--
-- WHY THIS EXISTS
-- The dashboard greets the person paying: "Good morning, Sarah." Every name we
-- currently store belongs to a RECIPIENT — the person Mabel calls — and the
-- account row carries only an email. Greeting someone by the email in front of
-- the @ is worse than not greeting them at all.
--
-- Deliberately nullable. A null here is a real state, not a defect: someone can
-- sign up with an email provider that hands us no name at all, and the honest
-- answer is to greet them plainly and let them fill it in. Code that reads this
-- must handle null rather than assume a string.

alter table public.accounts
  add column if not exists holder_name text;

-- ── backfill from the identity provider ─────────────────────────────────────
-- Google returns the person's display name in the OAuth id_token, and Supabase
-- keeps it on auth.users.raw_user_meta_data. Providers disagree on the key, so
-- try both spellings, and take nothing if neither is present.
--
-- Guarded by `holder_name is null` so re-running this file can never overwrite
-- a name someone has since corrected by hand in the account settings.
update public.accounts a
   set holder_name = nullif(btrim(coalesce(
         u.raw_user_meta_data ->> 'full_name',
         u.raw_user_meta_data ->> 'name'
       )), '')
  from auth.users u
 where u.id = a.auth_user_id
   and a.holder_name is null;

-- NO new RLS policy is needed. 0001 already covers this table with a policy
-- over the whole row (`for all using (auth_user_id = auth.uid())`), so the new
-- column inherits it: a signed-in user reads and writes their own name and
-- nobody else's. Adding a second policy here would only widen the surface.

-- Verification (run after).
--
-- 1. The column exists and is nullable (expect: text, YES):
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'accounts'
--    and column_name = 'holder_name';
--
-- 2. What the backfill actually got — how many accounts now have a name, and
--    how many are still null because their provider gave us nothing:
-- select count(*) filter (where holder_name is not null) as named,
--        count(*) filter (where holder_name is null)     as unnamed,
--        count(*)                                        as total
--   from public.accounts;
--
-- 3. Eyeball the result (email + name side by side):
-- select email, holder_name from public.accounts order by created_at;
