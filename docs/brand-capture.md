# Brand capture — auntmabel.app

Captured **2026-08-06** from the live static marketing page at
<https://auntmabel.app/> (HTTP 200, 22,342 bytes, single self-contained HTML
file with inline `<style>`). Everything below is verbatim from that source
unless marked as an observation.

This is the style and voice reference for every public page we build. When the
new site and this document disagree, this document is what the brand actually
looks and sounds like today — update it deliberately, don't drift from it.

---

## 1. Voice — what makes this copy work

Read the story section before writing any new page. The voice is:

- **Warm and plain-spoken, never clinical.** "How'd you sleep, hon?" not "daily
  wellness verification."
- **Concrete over abstract.** A named woman in a named house on a named street,
  not "vulnerable populations."
- **Understated at the emotional peak.** The strongest line in the whole page is
  "She was something quieter and worse than hurt — she was *alone*." No
  exclamation, no plea.
- **Honest about the AI.** It says plainly, twice, that Mabel is an AI voice. It
  never pretends otherwise or hides it in fine print.
- **Em-dashes and sentence fragments** carry the rhythm. "Different street,
  different name, same shut door."

---

## 2. Copy — verbatim

### Meta / SEO

| Field | Value |
|---|---|
| `<title>` | Aunt Mabel — A call every day, and a check-in when disaster strikes |
| `description` | List your elderly parent and Aunt Mabel checks in on the schedule you choose. When a disaster hits their area, that same call becomes an in-person wellness check from Ground Force. |
| `author` | Ground Force Humanitarian Aid |
| `og:site_name` | Aunt Mabel |
| `og:image:alt` | An elderly woman on the phone at home — Aunt Mabel, a friendly call every day and a knock on the door when disaster strikes. |
| `robots` | index, follow |
| `canonical` | https://auntmabel.app/ |

Geo meta targets Lafayette, Louisiana (`US-LA`, 30.2241;-92.0198).

JSON-LD `Service` schema, provider block:

```
Organization: Ground Force Humanitarian Aid
url:          https://groundforce.ngo
email:        programs@groundforce.ngo
telephone:    +1-318-572-3161
address:      Lafayette, LA, US
areaServed:   US
```

### Header

- Brand name: **Aunt Mabel**
- Brand subline: **Everyday calls · disaster check-ins**
- Affiliation tag (with green dot): **A project of Ground Force Humanitarian Aid**

### Hero

- Eyebrow: **Coming soon · join the waitlist**
- H1: **A friendly call every day — *and a knock on the door when disaster strikes.***
  (second clause is `<em>`, rendered italic in rose `#c25b50` at weight 500;
  first clause is weight 900 upright — the contrast is the signature type moment
  of the whole page)
- Lede: **List your elderly parent and Aunt Mabel checks in on the schedule you choose. When a disaster hits their area, that same call becomes an in-person wellness check from Ground Force.**

### Hero phone-card (the demo-call mock)

- Caller name: **Aunt Mabel**
- Status line: **calling Eleanor…** (preceded by a pulsing sage dot)
- Bubble 1: **"Morning, Eleanor. It's Mabel, just checking in on you. How'd you sleep, hon?"**
- Bubble 2: **"You have your breakfast yet this morning?"**
- Bubble 3: **"Alright, sweetheart. I'll ring you again tomorrow. You take care now."**
- AI disclosure (with info icon): **Aunt Mabel is a friendly AI voice that places the calls automatically, on your schedule.**

### Waitlist / signup block

- Kicker: **Be among the first families**
- H2: **Join the waitlist.**
- Sub: **We're inviting a small group of families first. Leave your email and we'll reach out when Aunt Mabel is ready to make her first call.**
- Input placeholder: **you@email.com**
- **CTA button: "Save my spot"**
- Success message: **Thank you — you're on the list. Mabel will be in touch. 🌼**
- Fine print: **No spam. We'll only email you about early access.**

### Story section

- Kicker: **A true story from the field**
- H2: **The house on Verret Street.**

> The water came up in the night. By the time Ground Force teams reached the neighborhood the next morning — boats first, then boots — most of the able-bodied had already gotten themselves to the shelter. They'd packed a bag, called a cousin, climbed into a truck bed. The young and the connected move fast.
>
> But in the small brick house on Verret Street, the door was still shut.
>
> Inside, Miss Eleanor was sitting in her chair in two feet of water, exactly where she'd been when the power died eighteen hours earlier. Eighty-one years old. Her phone was dead. Her daughter lived four states away and had been calling and calling, getting nothing, assuming the lines were just down like everyone else's. Eleanor wasn't hurt. She was something quieter and worse than hurt — she was *alone*, with no way to tell anyone, and no one whose job it was to come find her specifically.
>
> The team got her out. She was fine. But across twenty disaster responses, the same door keeps showing up. Different street, different name, same shut door. The elderly are the last to be reached and the first to be forgotten — not because anyone is cruel, but because no system is pointed at them *by name* until it's already too late.

- Closing line (set apart above a rule): **That's the gap. Not a lack of compassion — a lack of a tripwire. Nobody knew Eleanor was there until someone physically opened the door. Aunt Mabel is that tripwire.**
  ("Aunt Mabel is that tripwire." is `<strong>` in rose.)

### "Why we built her" band (dark)

- Kicker: **Why we built her**
- H2: **We've seen what happens when no one checks in.**

> Ground Force has responded to **20 disasters**, and in community after community we found the same thing: elderly neighbors completely alone. Many disabled. Many physically unable to clear debris or repair their own homes — and with no one coming to help.
>
> When we're in trouble, help usually comes from our friends. But the elderly often have **few close friends left**. Spouses and friends pass on, families live far away, mobility fades, and the world gets quiet. **Social isolation is the single most troubling factor** standing between an older person and a safe recovery — and it doesn't only happen after a storm. For too many, it's every day.
>
> Aunt Mabel grew out of that mission: to be a safety net for the elderly and vulnerable. A simple, warm daily call so someone is always checking in — and so a family member always knows their loved one is okay.

Stat row (numbers in Ground Force green, `Fraunces` 900):

| Number | Label |
|---|---|
| **184%** | growth in Americans over 65 since 1980 |
| **72M** | elderly Americans today, and climbing |
| **1 call** | a day can be the difference between alone and looked after |

### "How it works"

- Kicker: **How it works**
- H2: **Peace of mind, without the hovering.**

1. **Tell Mabel who to call** — Add your loved one's name, number, and the time of day that suits them best.
2. **She calls, on schedule** — A warm, natural conversation — not a checklist. She asks how they slept, if they've eaten, how they're feeling. It's an AI voice, calling automatically so it never gets missed.
3. **You get the all-clear** — A simple daily note that they're okay. And if something sounds off, you're the first to know.

### "Two ways she shows up"

- Kicker: **Two ways she shows up**
- H2: **The same enrollment. Two levels of care.**

| Tag | Heading | Body |
|---|---|---|
| **Every day** | **The everyday call** | On the schedule you choose — daily, weekdays, mornings or evenings — Aunt Mabel calls to ask how they slept, if they've eaten, and how they're feeling. A warm voice, a steady rhythm, and a quiet note to you that all is well. |
| **When disaster strikes** | **The in-person check** | When a storm or disaster hits their area, the call escalates. Ground Force's trained teams — already on the ground in impacted communities — go knock on the door for a real wellness check, so your loved one is never left alone in the chaos. |

### Trust strip (three items)

- **Warm, not clinical** — Mabel sounds like family, not a service. The call is the point — never a task to rush through.
- **You set the rhythm** — Daily, weekdays, mornings or evenings — whatever fits their routine and yours.
- **Backed by boots on the ground** — If a call is missed or a disaster strikes, Ground Force is ready to step in — in person when it counts.

### Footer

- **Aunt Mabel is a project of Ground Force Humanitarian Aid — protecting and stabilizing the elderly and vulnerable.**
- **© 2026 · A call every day, and a knock on the door when it matters most.**

**Observation:** there are no testimonials and no named third-party endorsements
anywhere on the page. Trust is carried entirely by the Ground Force affiliation,
the "20 disasters" track record, and the first-person field story.

---

## 3. Color palette

Verbatim from the `:root` block:

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#f6efe2` | page background |
| `--paper` | `#fbf7ee` | cards, panels, light surfaces |
| `--ink` | `#2d2417` | body text; also the dark-band background |
| `--soft-ink` | `#6b5d48` | secondary/muted text |
| `--rose` | `#c25b50` | primary accent — CTA button, italic hero clause |
| `--rose-deep` | `#a3463d` | CTA hover, eyebrow text, strip headings |
| `--sage` | `#6f7d5e` | tertiary accent — status text, muted tags |
| `--gf-green` | `#7ab648` | Ground Force green — stat numbers, success state, dot |
| `--gold` | `#d9a441` | warm highlight — kickers on dark, left border, glows |
| `--line` | `#e3d8c3` | borders and hairlines |

Also present, not tokenized:
- `#ded3c0` — body text on dark bands
- `#bcae98` — fine print on dark bands
- `#fff` — CTA button label
- `theme-color` meta: `#c25b50` (rose)

Dark bands invert to `--ink` background with `--paper` text; kickers switch from
rose to `--gold`, and stat figures use `--gf-green`.

> ⚠️ **Conflict with the current scaffold.** `src/styles/site.css` in this repo
> was written before this capture and uses an invented green/terracotta palette
> (`--brand: #1F5E52`, `--accent: #C4703A`). It does **not** match the real
> brand. Reconciling it is a build task, not a recon task — flagged, not done.

---

## 4. Typography

Two Google fonts, loaded in one request with `preconnect` to both
`fonts.googleapis.com` and `fonts.gstatic.com`:

```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,900&family=Libre+Franklin:wght@300;400;500;600&display=swap
```

| Face | Weights used | Where |
|---|---|---|
| **Fraunces** (serif, variable optical size) | 400, 500, 600, 900 | all headings, brand name, stat numbers, step numerals, the call bubbles, story body |
| **Libre Franklin** (sans) | 300, 400, 500, 600 | body text, lede, form input, button |

Notable type behavior:
- `h1`: Fraunces **900**, `clamp(2.5rem, 5.2vw, 4.1rem)`, line-height `1.03`, letter-spacing `-.5px`
- `h1 em`: switches to **italic weight 500** in rose — the deliberate contrast
- `h2`: Fraunces 600, `clamp(1.7rem, 3.3vw, 2.5rem)`, capped at `max-width: 20ch`
- `.kicker`: Fraunces **italic** 1.4rem in rose — the recurring section opener
- Body copy is frequently weight **300**, not 400 — the page reads light
- Story paragraphs use **Fraunces** (not the sans) at 1.12rem/1.7 — the story is
  set like prose, deliberately different from the rest of the page
- Measure is constrained everywhere: `32ch` lede, `60ch` body, `20–24ch` headings

---

## 5. Logo and imagery

| Asset | Path | Notes |
|---|---|---|
| Logo mark | `/logo.png` | 46×46, `border-radius:50%`, `object-fit:cover` — a circular photo/illustration mark |
| Favicons | `/favicon.ico`, `/favicon-32.png`, `/favicon-16.png`, `/apple-touch-icon.png` (180×180) | |
| Web manifest | `/site.webmanifest` | |
| OG image | `/og-image.jpg` | 1248×832 — "An elderly woman on the phone at home" |

**All imagery is first-party and self-hosted.** No stock photo services, no
CDNs, no icon libraries. The only external requests on the whole page are the
two Google Fonts hosts and the Formspree endpoint.

Decorative elements are all CSS/SVG, no image files:
- **Film grain overlay** — a fixed full-viewport inline SVG `feTurbulence`
  fractal noise data-URI at `opacity:.4`. This is what gives the page its warm
  print texture; it is cheap and worth keeping.
- **Caller avatar** — pure CSS `radial-gradient(circle at 35% 30%, gold, rose)`
- **Radial glow blooms** — `::after` / `::before` circles on the dark bands
- **Pulsing ring dot** — 1.6s CSS keyframe on the "calling Eleanor…" status
- **Phone card tilt** — `transform: rotate(1.3deg)`, straightened to `0` under
  820px

---

## 6. Layout and section structure

Single column, `max-width: 1080px`, `padding: 0 28px`, sections at `64px 0`.
Order top to bottom:

1. **Header** — brand lockup left, Ground Force tag right, flex-wrap
2. **Hero** — 2-col grid `1.15fr .85fr`, gap 54px: copy left, phone-card right
3. **Waitlist / signup** — dark rounded band (`--ink`), centered, radius 28px
4. **Story** — light panel, `border-left: 4px solid gold`, radius 22px
5. **Why we built her** — dark band with green radial glow + 3-stat row
6. **How it works** — 3-col grid of numbered steps
7. **Two ways she shows up** — 2-col grid, one light card + one dark card
8. **Trust strip** — light panel, 3-col grid
9. **Footer** — centered, two lines

**Observation on section order:** the waitlist CTA sits *second*, immediately
after the hero and **before** the story and the argument — the page asks for the
email before it makes its case, then keeps making the case for anyone who scrolls.
Worth preserving deliberately or changing deliberately, not by accident.

Corner radii run large and consistent: 26px hero card, 28px signup, 22px story
and strip, 20px mode cards, 16px call bubbles, 14px form controls.

### Responsive

One breakpoint: `@media (max-width: 820px)`. All multi-column grids collapse to
`1fr`, the phone card un-rotates and caps at 380px, and every panel's padding
shrinks. No hamburger menu — the header simply wraps.

---

## 7. The Formspree waitlist form

```html
<form id="waitForm" action="https://formspree.io/f/xeewgqvk" method="POST">
  <input type="email" id="email" name="email" placeholder="you@email.com" required>
  <button type="submit">Save my spot</button>
</form>
```

| Item | Value |
|---|---|
| **Endpoint ID** | **`xeewgqvk`** |
| **Full endpoint** | `https://formspree.io/f/xeewgqvk` |
| **Method** | POST |
| **Fields collected** | **`email` only** — one field, nothing else. No name, no phone, no recipient details, no consent checkbox. |
| **Validation** | `type="email"` + `required` (browser-native only) |

Submission is intercepted by JS: `preventDefault`, `fetch(form.action)` with
`FormData` and `Accept: application/json`. On `res.ok` the form is hidden and
the success message shown. On a non-OK response or a network throw, a
`window.alert()` fires — no inline error state.

**Observations for when we rebuild this:**
- Only an email is captured today, so the waitlist gives us no recipient or
  consent data — everything else gets collected at real signup.
- Failure handling is a browser `alert()`, which is jarring and untestable. The
  rebuilt version should render an inline error in the page.
- There is no honeypot or spam control beyond whatever Formspree applies.
- Whether we keep Formspree at all, or point the waitlist at Supabase once the
  signup flow exists, is an open product decision — not one this capture makes.
