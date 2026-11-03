# Wisal — Product Audit

**Date:** 6 August 2026
**Version audited:** v76 (`family-wellbeing-76.html`)
**Auditor:** Claude, at Hamza's request
**Method:** every number below was measured from the source, not estimated.

---

## 1. Where Wisal stands today

**Overall: 72 / 100 — a real product with a hole in the middle of its business.**

Wisal is no longer a project. It has its own domain, HTTPS, real email delivery,
bot protection, an installable Android package, and a payment rail waiting to be
switched on. That is further than most solo builds ever get, and it happened in
two months.

The honest problem is not the code. It is that **nobody is using it yet**, and
**the paid plan currently delivers nothing extra**. Both of those are fixable
faster than anything technical.

| Area | Score | One-line verdict |
|---|---|---|
| Code health | 88% | Genuinely clean. Better than most shipped code. |
| Security | 82% | Strong foundations, one real gap (see 4.2). |
| Design & UX | 85% | Coherent, premium, and now consistent. |
| Accessibility | 61% | Good bones, unfinished edges. |
| Performance | 64% | The single-file weight is now the main cost. |
| Data safety | 74% | Sync works; recovery story is thin. |
| Monetisation readiness | 35% | **The weakest link. Detail in 4.1.** |
| Product validation | 10% | No real users yet. Everything else waits on this. |

---

## 2. What was built — measured

| Metric | Value |
|---|---|
| Total file | 1,306 KB / 13,566 lines |
| JavaScript | 873 KB (67%) |
| CSS | 322 KB (25%), 3,183 rules, 64 media queries |
| Functions | 695 |
| Views / screens | 20 |
| `try/catch` blocks | 324 |
| `esc()` escaping calls | 467 (against 220 `innerHTML` writes) |
| External dependencies | 7 domains |
| Supabase queries | 19 |
| `aria-label` uses | 193 |
| `role=` uses | 171 |

**The 20 screens:** ai, cooking, dashboard, family, finance, fitness, health,
home, homemgmt, journal, learning, legacy, memory, nutrition, planning,
relationship, settings, travel, vault, wellbeing.

---

## 3. What improved in the last two months

Ordered by how much each mattered.

| # | Improvement | Impact |
|---|---|---|
| 1 | Own domain + HTTPS (`wisal.family`) | From a project to a product |
| 2 | Real email delivery (Resend + verified domain) | Sign-up actually works for strangers |
| 3 | Cloudflare Turnstile on auth | Bots cannot farm accounts |
| 4 | Full re-theme: green → deep blue ink | Reads considered, not templated |
| 5 | Interlocked-ring mark, redrawn to be legible at 16px | A logo that survives its smallest size |
| 6 | Paywall + pricing page + SSLCommerz plumbing | The revenue path exists end to end |
| 7 | App icons at every size, rounded + maskable | Installs look native, not amateur |
| 8 | Onboarding: responsive tiers, scroll-clip fix, in-place updates | The first five minutes stopped feeling broken |
| 9 | Hover-expanding glass sidebar, zero layout shift | The interface finally feels designed |
| 10 | Privacy policy rewritten to cover payments, CAPTCHA, email | Legally current, and required for SSLCommerz approval |
| 11 | Cold-start returns Home; resume refreshes data | The app stopped feeling stale |
| 12 | Scroll thumbs hidden app-wide | Small, but it is the difference people feel |
| 13 | Account deletion now removes the auth record | The privacy policy is now true |

**Latent bugs caught and fixed along the way** — each of these was silently
broken and would have been very hard to find later:

- `aiLoadThread()` was trapped inside the `<!doctype>` and never ran at boot.
- `wisalHandlePaymentReturn()` existed but was never called — a completed payment
  would have unlocked nothing.
- CAPTCHA tokens were reused, causing `timeout-or-duplicate` sign-in failures.
- The onboarding stage clipped its own top on short screens.
- Home glance cards and action cards had zero gap between them.
- `icon-maskable-192.png` was missing, failing three PWA checks at once.

---

## 4. What needs work — with percentages

### 4.1 Monetisation readiness — 35% → needs 90%

**This is the most important finding in this audit.**

`isPlus()` is called **2 times** in 13,566 lines. The app records who paid and
gates almost nothing. Today a family could pay ৳149 and receive, in practice,
what they already had.

Everything else about payments is built: the paywall, the pricing page, the
Edge Functions, the subscriptions table, the return handler. The only missing
piece is the reason to pay.

**What to do, in order:**
1. Pick **three** things that are genuinely better with Plus. The onboarding
   already promises: unlimited AI, weekly family insights, unlimited members.
   Ship exactly those three — nothing more.
2. Wrap each with `if(!isPlus()){ … }` and a soft upgrade prompt, never a wall.
3. Enforce the Free AI cap (30 actions/month) — that is the one limit people
   will actually feel, and it is the honest reason to upgrade.
4. Only then apply for the SSLCommerz live account.

**Do not** add a fourth Plus feature until the first three are used.

### 4.2 Security — 82% → needs 92%

**Good:** no `eval`, no hardcoded secrets, 467 `esc()` calls guarding 220
`innerHTML` writes, all 11 `target="_blank"` links carry `rel="noopener"`,
RLS on every table, CAPTCHA on auth, payment details never touch Wisal.

**The real gap:** the AI proxy Edge Function (`wisal-ai`) has no per-user rate
limit. Anyone who signs up can burn your Gemini quota. This costs money the day
you get attention.

- **Fix:** count requests per user per day in the Edge Function; return a clear
  message past the limit. Half a day of work.
- **Also:** the Turnstile site key must be re-pasted at line ~8066 after every
  delivery. That is a step waiting to be forgotten on a Friday night — move it
  to a build step or a small config file.

### 4.3 Accessibility — 61% → needs 80%

**Good:** 193 `aria-label`s, 171 `role`s, 14 `prefers-reduced-motion` rules,
`aria-pressed` on toggles.

**Weak:**
- **586 of 736 buttons have no `type` attribute.** Inside a form, those default
  to `submit` and can cause surprise submissions. One find-and-replace fixes it.
- Only **6** `:focus-visible` rules for 736 buttons — keyboard users cannot see
  where they are on most screens.
- No skip-to-content link.
- Colour contrast has not been formally checked in dark mode.

None of this is hard. It is an afternoon, and it matters for Play Store review.

### 4.4 Performance — 64% → needs 78%

1,306 KB in one file. Every visitor downloads all 20 screens to use one.

- On a good connection this is fine. On 3G in a district town — your actual
  audience — the first load is slow.
- The service worker is network-first, so repeat visits are fine. **First
  impression is the problem, and first impressions are the whole game.**
- **Do not split the file yet.** That breaks your single-file workflow for a
  gain nobody has complained about. Revisit if real users report slow loads.
- **Cheap wins available now:** the fonts are the largest external cost; the
  six embedded base64 images are only 47 KB and not worth touching.

### 4.5 Data safety — 74% → needs 85%

Cloud sync works, RLS is correct, export/import exists. What is thin:

- **Conflict handling.** Two devices editing at once — last write wins, silently.
  With one user that never shows. With a real family it will.
- **No automatic backup.** Export is manual, so almost nobody will do it.
- **PIN spaces are unrecoverable by design.** That is the right call, but the
  warning should appear *when the PIN is set*, not only in the privacy policy.

### 4.6 Product validation — 10% → needs 70%

There is no measurement in the app at all. You cannot see which of the 20
screens anyone opens.

**This is the highest-value work available to you right now**, and it is small:
a counter per view in localStorage, synced with the rest. Then ten real families
for two weeks. Their behaviour will tell you which screens deserve depth and
which should quietly disappear.

Every other item in this audit is a guess until this exists.

---

## 5. What to keep exactly as it is

Do not let anyone, including me, talk you out of these.

| Keep | Why |
|---|---|
| **Single-file HTML** | It is why you ship daily. Architecture that slows you down is worse architecture. |
| **Local-first storage** | Works offline, works when Supabase is down, works when money runs out. |
| **Inline SVG, no icon library** | Zero dependencies, perfect control, no supply-chain risk. |
| **No ads, no trackers, no analytics SDK** | Your actual differentiator against Meta. Never trade this. |
| **The deep blue palette + interlocked mark** | Settled and coherent. Stop touching it. |
| **Bangladesh-first: ৳, bKash/Nagad, Bangla** | The thing global apps will not do. |
| **Free tier that is genuinely usable** | Trust first, money second. |
| **Onboarding that builds a real plan** | Better than almost every app you are compared to. |
| **Honest privacy policy** | Rare, and it will matter at SSLCommerz and Play Store review. |

---

## 6. What not to do

| Do not | Because |
|---|---|
| Migrate to Flutter now | 3–4 months, zero new user value, and you do not yet know which screens matter. |
| Add a 21st screen | 20 is already more than anyone uses. Depth beats breadth. |
| Compete with Meta on general AI | Unwinnable. Your edge is the specific family, not the general answer. |
| Chase funding before users | Investors buy evidence. 100 paying families is better evidence than any deck. |
| Split the single file | Solves a problem nobody has reported. |
| Polish screens nobody opens | You cannot know which those are until 4.6 is done. |
| Take live payments before Plus does something | Charging for nothing is the one mistake that costs trust permanently. |

---

## 7. The order of work

**This week**
1. Add per-view counters, then get Wisal into 10 real families' hands.
2. Gate the three Plus features and enforce the Free AI cap.
3. Add `type="button"` to the 586 buttons missing it.

**This month**
4. Rate-limit the AI proxy per user.
5. Add `:focus-visible` styling across the app.
6. SSLCommerz sandbox end to end, then apply for live.
7. Warn about PIN irrecoverability at the moment the PIN is set.

**When there are 100 weekly families**
8. Revisit performance with real numbers.
9. Consider Flutter — only if a real limitation forces it.
10. Talk to investors, with usage data in hand.

---

## 8. The one paragraph that matters

Wisal's risk was never that the code would be bad. The code is good — cleaner
than most funded products. The risk is building beautifully for an audience you
have not met yet.

Two months produced a real product. The next two should produce **real users**.
Everything in section 4 can wait; section 4.6 cannot.
