# Wisal

Family life OS (PWA). Static site (no build step) + Supabase backend.

## Folder
- `index.html`, `styles.css`, `app.js`, `world.js`, `places.js` — the app
- `pricing.html`, `privacy.html` — public pages
- `sw.js`, `manifest.json`, `icon-*.png` — PWA / offline
- `vercel.json` — Vercel headers and clean URLs
- `supabase/migrations/` — database setup, run 001 → 002 → 003 → 004 in the Supabase SQL Editor
- `supabase/functions/` — Edge Functions (`wisal-ai`, `wisal-welcome`, `wisal-pay`, `wisal-pay-ipn`, `wisal-delete-account`); not deployed by Vercel
- `docs/SETUP-FROM-SCRATCH.md` — the full server setup, in order
- `docs/WELCOME-EMAIL.md` — the automatic welcome email: how it works, setup, troubleshooting
- `email/` — pictures used inside the welcome email (must stay at `/email/…`)
- `docs/EMAIL-AND-LOGIN-CHECKLIST.md` — what to check when sign-up or password reset fails
- `docs/` and `Records/` — notes, audits, company record

## Deploy (Git + Vercel)
1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo.
3. Framework Preset: **Other**. Build Command: empty. Output Directory: empty. → Deploy.
4. Settings → Domains → add `wisal.family`.
5. Do the Supabase steps in `docs/SETUP-FROM-SCRATCH.md` (SQL, auth settings, secrets, functions).

**Never commit secrets** (Supabase secret/service-role key, Resend key, Turnstile secret, Gemini key, SSLCommerz password). Only the Supabase *publishable* key and the Turnstile *site* key belong in this repo.

Every `git push` to `main` redeploys automatically. When you change app code, bump `CACHE` in `sw.js` (e.g. `wisal-v131` → `wisal-v132`).
