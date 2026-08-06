// =============================================================
// Auth helpers — Google OAuth + email magic link only.
// -------------------------------------------------------------
// No password auth, no Apple. Adding a provider means changing exactly two
// places: a button in /login and the provider list in Supabase's dashboard.
// =============================================================

import { getSupabase } from './supabase.js';

/**
 * Guard against open redirects. Only same-site, single-leading-slash paths
 * are accepted, and never into /auth/ (which would loop) or /api/.
 */
export function isSafeRedirect(target) {
  if (!target || typeof target !== 'string') return false;
  if (target.length > 200) return false;
  if (target.includes('\n') || target.includes('\r')) return false;
  if (!target.startsWith('/')) return false;
  if (target.startsWith('//')) return false;
  if (target.startsWith('/api/')) return false;
  if (target.toLowerCase().startsWith('/auth/')) return false;
  return true;
}

/** Where a signed-in user lands when no explicit redirect was requested. */
export const DEFAULT_SIGNED_IN_DESTINATION = '/account';

/**
 * Resolve where to send a freshly-authenticated user.
 * An explicit safe ?redirect= wins; otherwise the default destination.
 *
 * This is intentionally dumb for now. Once the account/recipient pages exist,
 * this is the one place to add "no recipients yet → /signup" style routing.
 */
export function resolveAuthDestination({ redirect } = {}) {
  if (redirect && isSafeRedirect(redirect)) return redirect;
  return DEFAULT_SIGNED_IN_DESTINATION;
}

/**
 * Per-page client-side session guard.
 *
 * Call at the top of any page that requires a signed-in user. Returns the
 * session, or redirects to /login (preserving where they were headed) and
 * returns null — callers must stop work when it returns null.
 *
 *   const session = await requireSession();
 *   if (!session) return;
 */
export async function requireSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[auth] getSession failed', error);
  }

  const session = data?.session ?? null;
  if (!session) {
    const here = window.location.pathname + window.location.search;
    window.location.href = '/login?redirect=' + encodeURIComponent(here);
    return null;
  }
  return session;
}

/**
 * Sign out and clear every Supabase token this browser holds.
 *
 * scope:'local' clears localStorage immediately without a network round-trip.
 * The default 'global' needs a successful server call — if the token is
 * already expired the request fails and Supabase silently KEEPS the session,
 * which looks to the user like sign-out did nothing.
 */
export async function signOutCleanly() {
  const supabase = getSupabase();
  await supabase.auth.signOut({ scope: 'local' });

  // Belt-and-suspenders: wipe any sb-* key the SDK may have written under a
  // name we don't predict.
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}
