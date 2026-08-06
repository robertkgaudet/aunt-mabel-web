# Legal source material — for adaptation

Captured **2026-08-06**. Source material only. **Nothing here is published,
linked, or wired into any page**, and none of it has been adapted for Aunt Mabel
yet.

Two usable sources were found:

| Source | Files | Character |
|---|---|---|
| **TrustLight Advisory** (`trustlight.ai`) | `C:\source\trustlight\terms.html`, `privacy.html` | Consulting/agency site. Terms of **Use** (website terms), not Terms of Service for a paid product. Last updated April 8, 2026. Louisiana governing law. |
| **Victora / TextOS** (`app.victora.ai`) | `C:\code\textos-web\src\pages\terms.astro`, `privacy.astro` | SaaS product. Terms of **Service** for a paid subscription with Stripe billing and third-party data processors. Last updated May 4, 2026. Self-labelled "alpha version." |

**Victora is the closer structural fit** — it's a paid product with accounts,
subscriptions, passwordless auth, and a list of data processors, which is what
Aunt Mabel is. TrustLight contributes the Louisiana governing-law clause and
some website-use boilerplate Victora lacks.

⚠️ **Neither source contemplates anything Aunt Mabel actually does**: recorded
phone calls, elderly and potentially cognitively-impaired end users who are not
the paying customer, health-adjacent information, or emergency escalation. Those
sections have to be written, not adapted. See §4.

---

## 1. Victora — Terms of Service (structure and text)

Ten numbered sections. Verbatim where quoted.

| § | Heading | Carry-over verdict |
|---|---|---|
| 1 | Acceptance | ✅ **Generic** — "By using X ('the Service'), you agree to these Terms. If you do not agree, do not use the Service." Swap the name. |
| 2 | The Service | ❌ **Product-specific** — describes an AI agent platform and names SendGrid/Stripe/Buffer/Hunter.io/Anthropic. Full rewrite. |
| 3 | Account | ⚠️ **Mostly generic, one keeper** — "You must be 18 or older… You are responsible for maintaining the security of your account." Notably: *"Victora uses passwordless authentication — you are responsible for keeping your email account secure."* That sentence applies to us verbatim; our auth is also passwordless magic-link/OAuth. |
| 4 | Acceptable use | ⚠️ **Half generic** — "Engage in illegal activity or harass other people," "Attempt to reverse-engineer, scrape, or abuse the platform," "Impersonate another person or business" all carry. The CAN-SPAM/GDPR bulk-email clause does not apply to us. |
| 5 | Content ownership | ⚠️ **Adapt** — the shape (you own your data, we own the platform, AI output carries no warranty) is right, but for us "your content" means *another living person's* health and welfare information, which needs different handling. |
| 6 | Payment and refunds | ⚠️ **Adapt** — "Payments are processed by Stripe. Subscriptions may be cancelled at any time; you retain access through the end of the billing period." Structure carries; Victora's Founder-Lifetime and à-la-carte tiers do not. |
| 7 | Limitation of liability | ✅ **Generic boilerplate** — "provided 'as is'… total liability will not exceed the amount you paid in the 12 months before the claim." **But see §4 — this cap needs legal review for a service people may rely on in an emergency.** |
| 8 | Termination | ✅ **Generic** — suspend on violation; user closes by email. |
| 9 | Changes | ✅ **Generic** — "We will notify you of material changes… by email at least 14 days before they take effect." Good practice, carry as-is. |
| 10 | Contact | ✅ **Generic** — swap the address. |

Presentation note: both Victora pages open with an "alpha note" panel — *"This is
the alpha version of our Terms of Service. We'll publish the final, reviewed
version before public launch."* Both are `noindex`. That's an honest pattern
worth copying while we're pre-launch.

## 2. Victora — Privacy Policy (structure and text)

Six sections.

| § | Heading | Carry-over verdict |
|---|---|---|
| 1 | What we collect | ⚠️ **Structure carries, contents don't** — the itemized `<strong>label</strong> — explanation` list format is good. Victora's items (business info, anonymous-form IP, GA4) mostly don't apply; ours are recipient phone/name/timezone, call recordings/transcripts, and escalation contacts. |
| 2 | How we use it | ⚠️ **Rewrite** — same shape, different purposes. |
| 3 | Third-party services | ⚠️ **Partly reusable** — **Supabase** ("authentication and database hosting") and **Cloudflare** ("CDN, hosting, edge computing, DNS, storage") carry verbatim; both are in our stack. **Anthropic** carries with its caveat about model-improvement opt-out. **Stripe** carries when billing exists. SendGrid/Hunter.io/Buffer/Google Analytics do not apply. **Missing and required for us: Retell (voice agent + call audio) and Resend (alert email).** |
| 4 | Data retention | ⚠️ **Shape only** — "Account data is retained as long as your account is active… You may request deletion at any time." Call recordings need their own retention answer, which we do not have yet. |
| 5 | Your rights | ✅ **Generic** — access/correct/delete, 30-day response window. |
| 6 | Contact | ✅ **Generic.** |

## 3. TrustLight — what it adds

Its Terms of Use is website-terms, not product-terms, so most of it is the wrong
document. Four things are worth lifting:

- ✅ **Governing law** — *"These terms are governed by the laws of the State of
  Louisiana. Any disputes shall be resolved in the courts of Orleans Parish,
  Louisiana."* Aunt Mabel is a Louisiana operation under GFHA; Victora's terms
  have **no** governing-law clause at all. This fills a real gap. (Parish may
  need to change — GFHA is in Lafayette, not Orleans.)
- ✅ **AI-generated content disclosure** — *"Some content on this site may be
  drafted or assisted by AI tools. We review all published content for accuracy
  and tone, but we do not guarantee that AI-assisted content is free from errors
  or omissions."* Directly relevant, and a good precedent for the much stronger
  AI disclosure Aunt Mabel needs.
- ✅ **Disclaimer of warranties** — standard "as is," no warranty of
  error-free/uninterrupted service.
- ✅ **Site-use restrictions** — no scraping/harvesting, no unauthorized access,
  no commercial redistribution. Victora's §4 covers most of this; TrustLight's
  wording is tighter on scraping.

Its Privacy Policy adds three clauses Victora lacks:

- ✅ **Information sharing** — *"We do not sell, rent, or trade your personal
  information."* An explicit no-sale statement. Victora never says this. For a
  service handling elderly people's welfare data, saying it plainly matters.
- ✅ **Cookies & analytics** — including *"We do not use cookies for advertising
  or tracking across third-party sites."*
- ✅ **Third-party links** and **Data security** ("no method of transmission over
  the internet is 100% secure") — routine but standard-to-include.

Ignore entirely: TrustLight's Consulting Services and Events sections, its
entire nav/footer chrome, and its green `#4ADE80` / Libre Baskerville styling.

---

## 4. What neither source covers — must be written from scratch

This is the important part of this capture. Both sources are for products where
the customer and the user are the same person and nothing is recorded. Aunt
Mabel breaks both assumptions.

1. **Two-party structure.** The payer signs the terms; the *recipient* is a
   different person who never visits the website and may never see the terms.
   Neither source has any concept of this. Needs: what the payer warrants about
   their authority to enroll someone, and what the recipient is owed directly.

2. **TCPA and call consent.** Automated calls to a residential line are
   regulated. Our engine already implements layered consent (payer checkbox +
   recipient's verbal yes captured on the first call). The terms and privacy
   policy must describe this, and must state that a recipient can stop the calls
   themselves at any time, on the call, without going through the payer.

3. **Call recording and transcripts.** Not contemplated anywhere in either
   source. Needs: whether calls are recorded, retention period, who can access
   them, and — separately — the future Legacy/voice-cloning consents, which per
   the shared rules must never be conflated with wellness-call consent.

4. **Health-adjacent information.** Mabel elicits and stores mentions of falls,
   symptoms, medication, and mental state. Likely **not** HIPAA-covered (we're
   not a covered entity or business associate), but that conclusion needs a
   lawyer's sign-off, and the policy needs to say what we do with it either way.

5. **Emergency limitations — the highest-risk clause in the whole document.**
   The service must state clearly that it is **not** an emergency service, not a
   medical service, not a monitoring or alarm system, and is no substitute for
   911, a medical alert device, or human caregiving. The marketing page's
   "knock on the door" promise makes this disclaimer more necessary, not less.

6. **Escalation and third-party contacts.** Up to two contacts per recipient,
   whose names, phones, and emails we store — people who never agreed to
   anything. Needs a basis for holding and contacting them.

7. **Vulnerable-adult and capacity considerations.** Recipients may have
   cognitive impairment. Consent, cancellation, and data-subject rights all
   behave differently in that case, and neither source has a word about it.

8. **Nonprofit / GFHA relationship.** Aunt Mabel is operated under Cajun Navy
   Ground Force / Ground Force Humanitarian Aid. Which legal entity contracts
   with the customer, and what the disaster-response in-person check does and
   does not promise, both need stating. Note the in-person check is a promise of
   *effort*, not of guaranteed arrival — that distinction should be explicit.

9. **Service-level honesty.** Calls can fail: no answer, dead phone, carrier
   outage, our own downtime. What we commit to (retry, notify) and explicitly do
   not commit to belongs in the terms.

---

## 5. Recommended approach when we do adapt

1. Start from **Victora's ToS skeleton** (10 sections — it's the right document
   type), graft in TrustLight's **governing law**, **AI-content**, and
   **no-scraping** clauses.
2. Start from **Victora's Privacy skeleton** (6 sections), graft in TrustLight's
   **no-sale-of-data**, **cookies**, and **data-security** clauses.
3. Add the nine items in §4 as new sections. They are the majority of the real
   work and none of them can be copied from anywhere.
4. Keep the **"alpha version" honesty banner** and `noindex` until a lawyer has
   reviewed.
5. **Have a Louisiana attorney review before launch.** Items 2, 4, 5, and 7 in
   §4 carry real regulatory and liability exposure — TCPA in particular has
   statutory per-call damages. This is not a fill-in-the-blanks job.
