# Wisal — Company Record

> The single place where Wisal's history, decisions and rules live.
> Add to the top of each section. Never delete an entry — strike it through and
> write why it changed. In two years this file will be worth more than the code.

**Product:** Wisal — Family Life OS
**Maker:** Hamza · Bangladesh
**Live at:** https://wisal.family
**Started:** June 2026 · **This record opened:** 6 August 2026

---

## 1. What Wisal is

One calm home for a family's plans, health, money and memories — built for
Bangladeshi households first, and for the people who have never heard the word
"productivity" but carry the whole weight of a home anyway.

**Who it is for:** the person in a Bangladeshi family who holds everything in
their head — the appointments, the bills, whose exam is when, which medicine ran out.

**What it is not:** a general AI assistant. Not a competitor to Meta AI or ChatGPT.
The edge is knowing *this* family, not knowing everything.

---

## 2. Decision log

Why things are the way they are. Read this before changing anything structural.

| Date | Decision | Reason | Revisit when |
|---|---|---|---|
| 2026-08-06 | Deletion goes through an Edge Function | The browser cannot delete an auth user; leaving it behind blocked email reuse and made the privacy policy untrue | Never |
| 2026-08-06 | Collapse button hidden on hover-capable desktop only | Hover replaces it there; touch users would otherwise be stranded | If touch laptops become the main device |
| 2026-08-06 | Sidebar overlays instead of pushing content | Pushing made the whole page shift on every hover | Never |
| 2026-08-05 | Onboarding updates in place, no full re-render | Full redraw replayed the entry animation on every tap | Never |
| 2026-08-05 | Collapsed sidebar by default | More canvas; hover makes it costless | If users report they cannot find navigation |
| 2026-08-05 | `wisal.family`, not `wisal.ai` | `.ai` was taken — and "family" speaks to the actual audience better than "ai" | Never (this turned out better) |
| 2026-08-05 | Deep blue ink palette, green retired | Green read as a health app; blue reads considered | Never — stop touching the palette |
| 2026-08-05 | Interlocked-ring mark, r5.7 / sep4.15 / stroke2.5 | The heavier version collapsed into a blob below 24px | Never — this was measured at 7 sizes |
| 2026-08-05 | Icons: rounded for "any", square for maskable | Android crops maskable itself; rounding both double-crops | Never |
| 2026-08-04 | Custom SMTP via Resend | Supabase's built-in sender only delivers to org members | If volume outgrows Resend's free tier |
| 2026-08-04 | Email confirmation stays ON | Security over convenience — Hamza's explicit call | Never |
| 2026-08-04 | Cloudflare Turnstile on auth | Stops bots farming accounts and burning AI quota | Never |
| 2026-07-26 | SSLCommerz as the single payment rail | Covers bKash, Nagad, cards and banks in one integration | If fees become material at scale |
| 2026-07-26 | Prices decided server-side, not in the browser | The amount must not be tamperable | Never |
| 2026-07-26 | Paywall at the end of onboarding, Free clearly available | Trust first; a hard wall would kill adoption | Never |
| — | Single-file HTML architecture | It is why daily shipping happens | Only if a real limitation forces it |
| — | Local-first storage, cloud as a copy | Works offline, and survives any backend outage | Never |
| — | No ads, no trackers, no analytics SDK | The actual differentiator against big tech | **Never. Not for any amount of money.** |

---

## 3. Changelog

Newest first. Version = the `family-wellbeing-NN.html` number.

### v76 — 6 Aug 2026
- Account deletion now removes the auth record via `wisal-delete-account`, so a
  deleted email can be used again. Falls back to row-deletion if the function is
  not deployed.
- First full product audit written (`WISAL-AUDIT.md`).
- This record opened.

### v75 — 6 Aug 2026
- **Fix:** Continue button stayed dim after selecting a preference in onboarding.
  Regression from v72 — in-place pill updates stopped recomputing the button state.

### v74 — 6 Aug 2026
- Collapse button hidden where hover replaces it; kept for touch.

### v73 — 6 Aug 2026
- Hover-expanding glass sidebar. Grid column fixed at 78px so nothing reflows.
- Blur raised to 26px, deeper shadow, labels fade instead of popping.
- Removed a leftover `scrollbar-width:thin` that contradicted hiding scrollbars.

### v72 — 5 Aug 2026
- **Fix:** onboarding flickered on every selection — full re-render replayed the
  entry animation. Pills, billing cycle and payment method now update in place.
- Scroll position preserved across same-step renders.

### v71 — 5 Aug 2026
- Scroll thumbs hidden app-wide.
- Settings: removed the purely informational stats strip.
- Privacy: 2,821-character legal wall reduced to one line plus a link.
- New `pricing.html`; Settings gained a "Your plan" card.
- `?upgrade=` deep link opens the paywall on the chosen cycle.

### v70 — 5 Aug 2026
- Icons regenerated with rounded corners; maskable kept square.

### v69 — 5 Aug 2026
- Mark redrawn at r5.7 / sep4.15 / stroke2.5 after measuring six variants at six sizes.
- Full icon set generated; manifest and embedded favicons updated.

### v68 — 5 Aug 2026
- Onboarding mark became real frosted glass, two nested panes.

### v67 — 4 Aug 2026
- **Fix:** CAPTCHA `timeout-or-duplicate`. Tokens are single-use; now retired on
  use, refreshed on expiry, and read via Turnstile's own API.
- Email validated for shape before spending a token.

### v66 — 4 Aug 2026
- Cold start returns Home; in-session reload keeps its place.
- Resume refreshes data; 30+ minutes away returns Home.

### v65 — 4 Aug 2026
- Auth tokens stripped from the URL after email confirmation.

### v64 — 4 Aug 2026
- "Resend confirmation email" added.

### v63 — 26 Jul 2026
- **Fix:** `wisalHandlePaymentReturn()` existed but was never called — a completed
  payment would have unlocked nothing.
- SSLCommerz Edge Functions and `subscriptions` table delivered.

### v62 — 26 Jul 2026
- Cloudflare Turnstile integrated into sign-in and sign-up.

### v61 — 26 Jul 2026
- Home spacing fixed; onboarding visually elevated.

### v60 — 26 Jul 2026
- Phase 2 paywall added as onboarding step 6.
- **Fix:** `aiLoadThread()` was trapped inside the `<!doctype>` and never ran.

---

## 4. Standing rules

Things that are true regardless of what is being built this week.

### Always
- **Turnstile site key** must be pasted at ~line 8066 after every new file delivery.
- **Test with a fresh email** — onboarding only runs once per account.
- **Bump the `sw.js` cache version** on every deploy.
- Keep `WISAL_PRICE` in the app and `PRICE` in `wisal-pay/index.ts` in sync.
- Verify tag balance and JS syntax before shipping.
- After uploading icons, count them in the repo — files have silently gone missing twice.

### Never
- Put a service-role key, SMTP password or Resend API key in the HTML.
- Add ads, trackers or an analytics SDK.
- Take live payments while Plus delivers nothing extra.
- Change the palette or the mark again without a measured reason.
- Add a screen before proving the existing 20 are used.
- Re-add scroll-collapse to the AI engine card.

### Secrets live only here
| Secret | Where it belongs |
|---|---|
| Turnstile **secret** key | Supabase → Auth → Attack Protection |
| Turnstile **site** key | In the HTML (public, safe) |
| Resend API key | Supabase → SMTP settings |
| SSLCommerz store ID / password | Supabase secrets |
| Supabase service-role key | Never leaves Edge Functions |
| Android signing keystore + password | Offline backup. **Losing this ends Play Store updates forever.** |

---

## 5. Open items

Carried from the audit. Move to the changelog when done.

| Priority | Item | Est. | Status |
|---|---|---|---|
| **1** | Per-view usage counters | half a day | open |
| **1** | Wisal in 10 real families' hands | ongoing | open |
| **1** | Gate the 3 Plus features + enforce Free AI cap | 1–2 days | open |
| 2 | `type="button"` on 586 buttons | 1 hour | open |
| 2 | Rate-limit the AI proxy per user | half a day | open |
| 2 | `:focus-visible` styling across the app | half a day | open |
| 2 | Deploy `wisal-delete-account` | 30 min | **ready, not deployed** |
| 3 | SSLCommerz sandbox end to end | 1 day | open |
| 3 | Warn about PIN irrecoverability when the PIN is set | 1 hour | open |
| 3 | Landing page for wisal.family | 1–2 days | open |
| 4 | Sync conflict handling | 2–3 days | open |
| 4 | Automatic backup | 1 day | open |
| later | Flutter migration | 3–4 months | **blocked on evidence** |

---

## 6. Numbers to watch

Fill in weekly. Empty rows are the point — they show what is not yet known.

| Week | Signed up | Used 7 days later | Most-opened screen | Paying | Revenue |
|---|---|---|---|---|---|
| 6 Aug 2026 | 1 (maker) | — | unknown | 0 | ৳0 |

**The number that decides everything:** how many families open Wisal in week two.
Not sign-ups. Week two.

---

## 7. Reference

| Thing | Where |
|---|---|
| App | https://wisal.family |
| Supabase project | `uiiyumjnlcreqdzqierd` |
| Edge Functions | `wisal-ai`, `wisal-pay`, `wisal-pay-ipn`, `wisal-delete-account` |
| Hosting | Vercel (auto-deploy from GitHub `main`) |
| Domain + DNS | Hostinger |
| Email | Resend, domain verified |
| Payments | SSLCommerz (sandbox) |
| Bot protection | Cloudflare Turnstile |
| Second domain | `inayaquran.com` (separate project) |
| Setup guides | `SSLCOMMERZ-SETUP.md`, `EMAIL-CONFIRMATION-SETUP.md` |
