-- Aunt Mabel — accounts / recipients / contacts (Supabase Postgres + RLS)
-- Run manually in the Supabase SQL editor (aunt-mabel project, separate from Victora).

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  tier text not null default 'standard',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists recipients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  phone text not null,
  timezone text not null default 'America/Chicago',
  call_time text not null default '09:00',
  is_self boolean not null default false,
  consent boolean not null default false,
  verbal_consent boolean not null default false,
  doctor_name text,
  doctor_phone text,
  zip text,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references recipients(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  relationship text,
  notify_method text not null default 'email',
  created_at timestamptz not null default now()
);

create index if not exists idx_recipients_account on recipients(account_id);
create index if not exists idx_recipients_status on recipients(status);
create index if not exists idx_contacts_recipient on contacts(recipient_id);

alter table accounts enable row level security;
alter table recipients enable row level security;
alter table contacts enable row level security;

create policy "own account" on accounts
  for all using (auth_user_id = auth.uid());

create policy "own recipients" on recipients
  for all using (account_id in (select id from accounts where auth_user_id = auth.uid()));

create policy "own contacts" on contacts
  for all using (recipient_id in (
    select r.id from recipients r
    join accounts a on a.id = r.account_id
    where a.auth_user_id = auth.uid()
  ));

-- Verification (run after; expect all three tables + relrowsecurity=true):
-- select tablename from pg_tables where schemaname='public';
-- select relname, relrowsecurity from pg_class where relname in ('accounts','recipients','contacts');
