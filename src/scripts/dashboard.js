// =============================================================
// Dashboard shared behaviour
// -------------------------------------------------------------
// Every /dashboard page starts the same way: prove there is a session, load the
// account row, greet the person by name, and wire the header menu. Doing it in
// one place keeps the three pages from drifting apart, and means the header
// resolves identically everywhere.
// =============================================================

import { getSupabase } from './supabase.js';
import { requireSession } from './auth.js';

/** Postgres "column does not exist" — see initDashboard for why this matters. */
const UNDEFINED_COLUMN = '42703';

/**
 * Boot a dashboard page.
 *
 * Returns { supabase, session, account } — or null when the caller must stop
 * (no session, so requireSession has already redirected; or the account could
 * not be read, in which case the page has been told why on screen).
 */
export async function initDashboard() {
  const session = await requireSession();
  if (!session) return null; // requireSession redirected to /login

  const supabase = getSupabase();

  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, email, holder_name, stripe_customer_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (error) {
    // Migration 0008 adds accounts.holder_name. If the code is live and the
    // migration is not, this is the exact error — so name the fix rather than
    // showing a generic failure that sends someone hunting through the source.
    if (error.code === UNDEFINED_COLUMN) {
      fatal(
        'This dashboard needs database migration 0008 (accounts.holder_name), which has not been applied yet.'
      );
    } else {
      console.error('[dashboard] account load failed', error);
      fatal('We could not load your account just now. Please refresh in a moment.');
    }
    return null;
  }

  if (!account) {
    // Signed in with no account row — a signup that stopped partway. Send them
    // back to finish rather than showing an empty dashboard.
    fatal(
      'We could not find an account for this sign-in. If you started signing up and did not finish, ' +
        '<a href="/enroll">pick up where you left off</a>.'
    );
    return null;
  }

  // Self-heal the name. Google hands us a display name at sign-in and Supabase
  // keeps it on the user record; migration 0008 backfills accounts that existed
  // before this column did, and this covers everyone who signs up after it.
  if (!account.holder_name) {
    const meta = session.user.user_metadata || {};
    const fromProvider = (meta.full_name || meta.name || '').trim();
    if (fromProvider) {
      const { error: healErr } = await supabase
        .from('accounts')
        .update({ holder_name: fromProvider })
        .eq('id', account.id);
      // A failure here is cosmetic — they simply get the plain greeting and can
      // type their name in themselves. Log it; do not block the page.
      if (healErr) console.error('[dashboard] could not save provider name', healErr);
      else account.holder_name = fromProvider;
    }
  }

  paintHeader(account, session);
  wireMenu();
  return { supabase, session, account };
}

/** First name only — "Good morning, Sarah" reads better than the full name. */
export function firstName(account) {
  const full = (account?.holder_name || '').trim();
  if (!full) return '';
  return full.split(/\s+/)[0];
}

/** Up to two initials for the header avatar; falls back to the email's first letter. */
export function initials(account) {
  const full = (account?.holder_name || '').trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
  return (account?.email || '?').charAt(0).toUpperCase();
}

/** "Good morning" / "Good afternoon" / "Good evening" in the viewer's own clock. */
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "09:00" → "9:00 AM". Returns '' for anything malformed rather than guessing. */
export function friendlyTime(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return '';
  const h = Number(m[1]);
  const min = m[2];
  if (h > 23 || Number(min) > 59) return '';
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${suffix}`;
}

/** "America/Chicago" → "Central time" where we know it; the raw zone otherwise. */
export function friendlyZone(tz) {
  const known = {
    'America/New_York': 'Eastern time',
    'America/Chicago': 'Central time',
    'America/Denver': 'Mountain time',
    'America/Phoenix': 'Arizona time',
    'America/Los_Angeles': 'Pacific time',
    'America/Anchorage': 'Alaska time',
    'Pacific/Honolulu': 'Hawaii time',
  };
  return known[tz] || tz || '';
}

/**
 * POST to the engine as the signed-in user.
 *
 * The access token goes in the Authorization header — the engine verifies it
 * with Supabase and works out the account itself, so nothing here needs to (or
 * may) tell the engine which account it is acting for.
 */
export async function engineFetch(path, body, session) {
  const base = import.meta.env.PUBLIC_ENGINE_URL;
  if (!base) {
    throw new Error('PUBLIC_ENGINE_URL is not set (see .env.example).');
  }

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body || {}),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Fall through to the status-based message below.
  }

  if (!res.ok || !data?.ok) {
    const message = data?.error || `The server returned ${res.status}.`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------- internals

function paintHeader(account, session) {
  const nameEl = document.getElementById('dash-user-name');
  const avatarEl = document.getElementById('dash-user-initials');
  if (nameEl) nameEl.textContent = account.holder_name || account.email || session.user.email || '';
  if (avatarEl) avatarEl.textContent = initials(account);

  const shell = document.getElementById('dash-user');
  if (shell) shell.hidden = false;
}

function wireMenu() {
  const button = document.getElementById('dash-user');
  const menu = document.getElementById('dash-menu');
  if (!button || !menu) return;

  const close = () => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });

  // Click-away and Escape both close it. Without these the menu strands itself
  // open on touch devices, where there is no hover to imply dismissal.
  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  menu.addEventListener('click', (e) => e.stopPropagation());
}

/** Replace the page body with a plain, honest failure. */
function fatal(html) {
  const slot = document.getElementById('dash-fatal');
  if (!slot) {
    console.error('[dashboard]', html);
    return;
  }
  slot.innerHTML = html;
  slot.hidden = false;
  const content = document.getElementById('dash-content');
  if (content) content.hidden = true;
}
