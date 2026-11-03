# Wisal — what connects to what

Built by reading the actual code (`app.js`, `index.html`, `sw.js`) and the
Edge Function sources. Nothing here is assumed; the "Not in this package" section lists
what the code calls but the files do not contain.

## 1. The big picture

```
 BROWSER (wisal.family, Vercel, auto-deploy from GitHub main)
 ┌──────────────────────────────────────────────────────────────────┐
 │ index.html ──► /styles.css, /world.js, /places.js, /app.js       │
 │     │            (world.js + places.js = Travel map/places data) │
 │     ├─► /manifest.json ──► icon-192/512 + icon-maskable-192/512  │
 │     ├─► /privacy.html, /pricing.html (linked from Settings)      │
 │     ├─► sw.js (registered by app.js: offline + update toast)     │
 │     ├─► cdn.jsdelivr.net      supabase-js@2                      │
 │     ├─► challenges.cloudflare.com   Turnstile CAPTCHA            │
 │     └─► fonts.googleapis.com / fonts.gstatic.com                 │
 │                                                                  │
 │ app.js stores everything in localStorage ("fw.*" keys)           │
 │ and copies it to Supabase when signed in.                        │
 └───────────────┬──────────────────────────────────────────────────┘
                 │ HTTPS, publishable key + user JWT
                 ▼
 SUPABASE project rddhicjixcavdcvqkmer
 ┌──────────────────────────────────────────────────────────────────┐
 │ Auth ──► Email via Resend SMTP (no-reply@wisal.family)           │
 │      └─► Turnstile secret key (Auth → Attack Protection)         │
 │ Tables:  family_data      whole family = one JSON row            │
 │          family_members   who belongs to which household         │
 │          family_messages  family chat                            │
 │          family_reads     chat read-receipts                     │
 │          subscriptions    who is Plus   (SQL included)           │
 │ Storage: chat-media       chat photos (public URLs)              │
 │ Edge Functions:                                                  │
 │   wisal-ai              ──► Google Gemini (key lives server-side)│
 │   wisal-pay             ──► SSLCommerz session                   │
 │   wisal-pay-ipn         ◄── SSLCommerz server callback           │
 │   wisal-delete-account  ──► deletes auth user + rows             │
 └──────────────────────────────────────────────────────────────────┘
```

## 2. Feature → files → backend

| Feature | Front-end | Backend |
|---|---|---|
| Sign-up / sign-in | `app.js` §"ACCOUNT: Supabase auth" | Supabase Auth, Resend SMTP, Turnstile |
| Cloud sync of all family data | `cloudPush`, `adoptCloud` in `app.js` | `family_data` |
| Family chat | chat section in `app.js` | `family_messages`, `family_reads`, `chat-media` bucket |
| Joining a household | invite code in `app.js` | `family_data.invite_code`, `family_members` |
| Wisal AI (free path) | `aiSendViaProxy` | `wisal-ai` Edge Function → Gemini |
| Wisal AI (own key) | `aiGetKey` (key kept in localStorage) | calls Google directly |
| Paywall → Plus | onboarding step 6, `onbCheckout`, `WISAL_PRICE` | `wisal-pay` → SSLCommerz → `wisal-pay-ipn` → `subscriptions` |
| Plus unlock on any device | `wisalSyncPlan`, `isPlus` | reads `subscriptions` |
| Delete account | Settings → delete | `wisal-delete-account` |
| Install as app / offline | `manifest.json`, icons, `sw.js` | none |
| Travel map and places | `world.js`, `places.js` | none (static data) |
| Privacy / pricing pages | `privacy.html`, `pricing.html` | none |

## 3. Things that must stay in sync

| If you change… | …also change |
|---|---|
| Plus price | `WISAL_PRICE` in `app.js` **and** `PRICE` in `supabase/functions/wisal-pay/index.ts` |
| Any deployed file | bump `CACHE` in `sw.js` (currently `wisal-v132`) |
| Turnstile site key | `TURNSTILE_SITE_KEY` in `app.js` (set in this repo) |
| Table or column names | `app.js` queries **and** `wisal-delete-account/index.ts` |

## 4. Not in this package (the code calls it, the files were not provided)

1. **`wisal-ai` Edge Function source** — called by the app, never supplied.
2. **SQL for `family_data`, `family_members`, `family_messages`, `family_reads`** and
   their RLS policies. Only `subscriptions.sql` exists. The August audit says RLS is on
   for every table, but the policies themselves are not in any file.
3. **Storage bucket `chat-media`** configuration.
4. **Android package** (the August audit mentions an installable Android package).

