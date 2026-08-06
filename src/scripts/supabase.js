// =============================================================
// Supabase browser client (singleton)
// -------------------------------------------------------------
// The anon key is safe to ship to the browser — it can only do what RLS
// policies allow. The SERVICE ROLE key is NEVER shipped to the browser;
// it belongs in a Worker secret.
//
// Missing config throws loudly rather than returning a dead client. A quiet
// no-op here would show up much later as an unexplained "nothing happens
// when I click sign in."
// =============================================================

import { createClient } from '@supabase/supabase-js';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _client = null;

export function getSupabase() {
  if (_client) return _client;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example).'
    );
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // parses the token fragment on /auth/callback
      flowType: 'pkce',
    },
  });

  return _client;
}
