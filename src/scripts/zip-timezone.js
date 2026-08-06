// =============================================================
// ZIP → time zone inference (bundled, no external API)
// -------------------------------------------------------------
// A wrong time zone means Mabel calls at the wrong hour — early morning for
// someone elderly is not a cosmetic bug. So this module follows the
// architecture rule on inference: it returns a BEST GUESS or null, and never
// pretends. The caller must show the result back for confirmation and let it
// be overridden. `null` means "ask the person", not "assume Central".
//
// Granularity is the 3-digit ZIP prefix (ZCTA3), expressed as ranges. Full
// ZIP-level data is ~42,000 rows; prefix ranges cover the same territory in a
// couple of kilobytes. Where a prefix genuinely straddles a time-zone boundary
// and cannot be resolved at this granularity, it is deliberately OMITTED so the
// lookup returns null and the UI asks.
//
// Known limits (all resolve to "ask", never to a wrong guess):
//   - parts of North Dakota (584-588) — Central/Mountain boundary
//   - parts of Kentucky (425-427)     — Eastern/Central boundary
//   - western Upper Peninsula MI (498-499), eastern Oregon (979)
//   - military APO/FPO prefixes (090-098)
// =============================================================

/** @type {Array<[number, number, string]>} start prefix, end prefix, IANA zone */
const ZIP3_RANGES = [
  // ── Atlantic ────────────────────────────────────────────────
  [6, 9, 'America/Puerto_Rico'],        // PR, VI

  // ── Eastern ─────────────────────────────────────────────────
  [10, 27, 'America/New_York'],         // MA
  [28, 29, 'America/New_York'],         // RI
  [30, 38, 'America/New_York'],         // NH
  [39, 49, 'America/New_York'],         // ME
  [50, 59, 'America/New_York'],         // VT
  [60, 69, 'America/New_York'],         // CT
  [70, 89, 'America/New_York'],         // NJ
  [100, 149, 'America/New_York'],       // NY
  [150, 196, 'America/New_York'],       // PA
  [197, 199, 'America/New_York'],       // DE
  [200, 205, 'America/New_York'],       // DC
  [206, 219, 'America/New_York'],       // MD
  [220, 246, 'America/New_York'],       // VA
  [247, 268, 'America/New_York'],       // WV
  [270, 289, 'America/New_York'],       // NC
  [290, 299, 'America/New_York'],       // SC
  [300, 319, 'America/New_York'],       // GA
  [320, 323, 'America/New_York'],       // FL (north/central, incl. Tallahassee)
  [326, 342, 'America/New_York'],       // FL (peninsula)
  [344, 344, 'America/New_York'],
  [346, 347, 'America/New_York'],
  [349, 349, 'America/New_York'],
  [398, 399, 'America/New_York'],       // GA (south)
  [400, 418, 'America/New_York'],       // KY (eastern: Louisville, Lexington)
  [430, 459, 'America/New_York'],       // OH
  [460, 462, 'America/New_York'],       // IN (Indianapolis)
  [465, 475, 'America/New_York'],       // IN
  [478, 479, 'America/New_York'],       // IN
  [480, 497, 'America/New_York'],       // MI (lower peninsula + east UP)
  [373, 374, 'America/New_York'],       // TN (Chattanooga)
  [376, 379, 'America/New_York'],       // TN (Knoxville, Johnson City)

  // ── Central ─────────────────────────────────────────────────
  [324, 325, 'America/Chicago'],        // FL panhandle (Panama City, Pensacola)
  [350, 369, 'America/Chicago'],        // AL
  [370, 372, 'America/Chicago'],        // TN (Nashville)
  [375, 375, 'America/Chicago'],        // TN (Memphis)
  [380, 385, 'America/Chicago'],        // TN (Memphis, Jackson, Cookeville)
  [386, 397, 'America/Chicago'],        // MS
  [420, 424, 'America/Chicago'],        // KY (western: Paducah, Bowling Green)
  [463, 464, 'America/Chicago'],        // IN (Gary / NW)
  [476, 477, 'America/Chicago'],        // IN (Evansville / SW)
  [500, 528, 'America/Chicago'],        // IA
  [530, 549, 'America/Chicago'],        // WI
  [550, 567, 'America/Chicago'],        // MN
  [570, 575, 'America/Chicago'],        // SD (eastern)
  [580, 583, 'America/Chicago'],        // ND (eastern)
  [600, 629, 'America/Chicago'],        // IL
  [630, 658, 'America/Chicago'],        // MO
  [660, 676, 'America/Chicago'],        // KS (eastern)
  [680, 691, 'America/Chicago'],        // NE (eastern)
  [700, 714, 'America/Chicago'],        // LA
  [716, 729, 'America/Chicago'],        // AR
  [730, 749, 'America/Chicago'],        // OK
  [750, 797, 'America/Chicago'],        // TX (all but far west)

  // ── Mountain ────────────────────────────────────────────────
  [576, 577, 'America/Denver'],         // SD (western)
  [590, 599, 'America/Denver'],         // MT
  [677, 679, 'America/Denver'],         // KS (western)
  [692, 693, 'America/Denver'],         // NE (western)
  [798, 799, 'America/Denver'],         // TX (El Paso)
  [800, 816, 'America/Denver'],         // CO
  [820, 831, 'America/Denver'],         // WY
  [832, 836, 'America/Denver'],         // ID (southern)
  [840, 847, 'America/Denver'],         // UT
  [870, 884, 'America/Denver'],         // NM

  // ── Arizona (Mountain, but no daylight saving) ──────────────
  [850, 865, 'America/Phoenix'],        // AZ

  // ── Pacific ─────────────────────────────────────────────────
  [837, 838, 'America/Los_Angeles'],    // ID (northern)
  [889, 898, 'America/Los_Angeles'],    // NV
  [900, 961, 'America/Los_Angeles'],    // CA
  [970, 978, 'America/Los_Angeles'],    // OR (west of the Cascades)
  [980, 994, 'America/Los_Angeles'],    // WA

  // ── Alaska / Hawaii / Pacific territories ───────────────────
  [995, 999, 'America/Anchorage'],      // AK
  [967, 968, 'Pacific/Honolulu'],       // HI
  [969, 969, 'Pacific/Guam'],           // GU, MP
];

/** Friendly names, in the order we offer them for manual choice. */
export const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern time' },
  { value: 'America/Chicago',     label: 'Central time' },
  { value: 'America/Denver',      label: 'Mountain time' },
  { value: 'America/Phoenix',     label: 'Arizona (no daylight saving)' },
  { value: 'America/Los_Angeles', label: 'Pacific time' },
  { value: 'America/Anchorage',   label: 'Alaska time' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii time' },
  { value: 'America/Puerto_Rico', label: 'Atlantic time (Puerto Rico)' },
  { value: 'Pacific/Guam',        label: 'Guam' },
];

/** @type {(tz: string) => string} */
export function timezoneLabel(tz) {
  const hit = TIMEZONES.find((t) => t.value === tz);
  return hit ? hit.label : tz;
}

/**
 * Infer an IANA time zone from a 5-digit US ZIP.
 * Returns null when the ZIP is malformed OR when its prefix straddles a
 * time-zone boundary — in both cases the caller must ask rather than guess.
 *
 * @type {(zip: string) => string | null}
 */
export function timezoneForZip(zip) {
  if (!/^\d{5}$/.test(String(zip || '').trim())) return null;
  const prefix = Number(String(zip).slice(0, 3));
  for (const [lo, hi, tz] of ZIP3_RANGES) {
    if (prefix >= lo && prefix <= hi) return tz;
  }
  return null;
}
