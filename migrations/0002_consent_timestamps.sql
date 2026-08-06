-- Aunt Mabel — consent audit timestamps (enrollment flow)
-- Run manually in the Supabase SQL editor (aunt-mabel project).

alter table accounts
  add column if not exists tos_accepted_at timestamptz,
  add column if not exists not_medical_ack_at timestamptz;

-- recipients.consent already exists (the TCPA call-consent box);
-- these two capture when the payer accepted ToS/Privacy and the
-- not-a-medical-service acknowledgment, timestamped for audit.

-- Verification (run after; expect both columns present):
-- select column_name from information_schema.columns
--   where table_name = 'accounts'
--   and column_name in ('tos_accepted_at','not_medical_ack_at');
