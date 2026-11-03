# Wisal: set everything up from the start

Everything the app needs on the server, in the order to do it. About 45 minutes.
Do not skip the order: later steps depend on earlier ones.

## Step 0: decide: new Supabase project or reuse the current one
| | New project (recommended) | Reuse current project |
|---|---|---|
| Result | clean, known-good database | old tables may have different columns than the app expects |
| Cost | everyone must create an account again; old data stays in the old project | none |
| App change | edit 2 lines in `app.js` | none |

Reuse only works if you first erase the old Wisal tables (see "Reset" at the bottom).
Region for a new project: **Singapore (ap-southeast-1)**, closest to Bangladesh.

## Step 1: run the 3 migrations (Supabase → SQL Editor, in this order)
Open each file from `supabase/migrations/`, paste everything, press **Run**. Safe to run twice.

| Order | File | What it creates |
|---|---|---|
| 1 | `001_core.sql` | tables `family_data`, `family_members`, `family_messages`, `family_reads`; the `join_household` invite function; security rules; live-chat realtime; the `chat-media` bucket |
| 2 | `002_subscriptions.sql` | `subscriptions` (Wisal Plus; written only by the payment function) |
| 3 | `003_ai_usage.sql` | `ai_usage` + `ai_bump()` (daily free-AI limit) |
| 4 | `004_welcome_email.sql` | automatic Welcome email (do this last, after sign-up works; see `docs/WELCOME-EMAIL.md`) |

Check afterwards: **Table Editor** shows 6 tables (all with the RLS shield on); **Storage** shows `chat-media`.
Older file `supabase/sql/subscriptions.sql` is replaced by migration 002, you can ignore or delete it.

## Step 2: Authentication settings (this is what makes sign-up and forgot-password work)
Supabase → Authentication.

1. **URL Configuration**: Site URL `https://wisal.family`. Redirect URLs: `https://wisal.family` and `https://wisal.family/**`.
2. **Sign In / Providers → Email**: Email provider ON.
   **Confirm email: OFF for the first launch.** New people are signed in immediately and no email is needed to create an account.
   Turn it ON later, only after step 2.4 proves emails really arrive.
   Leave minimum password length at 6 (the app says 6).
3. **Attack Protection → CAPTCHA → Cloudflare Turnstile**: paste the Turnstile **secret** key.
   In Cloudflare → Turnstile → your widget → **Hostnames**: `wisal.family` must be listed. Site key (in `app.js`) and secret must belong to the same widget.
4. **Emails → SMTP Settings** (needed for forgot-password, and for confirmation emails later):
   - Resend → Domains: `wisal.family` shows **Verified**.
   - Resend → API Keys: create a key with Sending access.
   - Supabase: Enable custom SMTP · Sender `no-reply@wisal.family` · Name `Wisal` · Host `smtp.resend.com` · Port `465` (or `587`) · Username `resend` · Password = the `re_…` key.
   - Resend free plan ≈ 100 emails/day. If you grow, upgrade; this is the most common reason "emails stopped".
5. **Rate Limits**: raise emails per hour to 100–200.
6. **Emails → Templates**: keep `{{ .ConfirmationURL }}` in both "Confirm signup" and "Reset password".

## Step 3: Edge Functions (Supabase → Edge Functions)
Create four functions with the **exact names** below, paste the code from `supabase/functions/<name>/index.ts`.
For **all four, turn "Verify JWT" OFF** (they check the user themselves; the new publishable key is not a JWT).

| Function | Needed for | Secrets it needs |
|---|---|---|
| `wisal-ai` | free AI chat | `GEMINI_API_KEY` (from aistudio.google.com). Optional: `AI_FREE_DAILY_LIMIT` (default 20), `AI_PLUS_DAILY_LIMIT` (200) |
| `wisal-delete-account` | Settings → delete account | none |
| `wisal-welcome` | Welcome email after sign-up | `RESEND_API_KEY`, `WELCOME_WEBHOOK_SECRET` (see `docs/WELCOME-EMAIL.md`) |
| `wisal-pay` | start a Plus payment | `SSLCZ_STORE_ID`, `SSLCZ_STORE_PASS`, `SSLCZ_SANDBOX` (`true` while testing), `APP_URL` = `https://wisal.family` |
| `wisal-pay-ipn` | payment confirmation callback | same three `SSLCZ_*` values |

Secrets: Edge Functions → Secrets → add. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.
You can skip the two `wisal-pay*` functions until you want to charge money (see `docs/SSLCOMMERZ-SETUP.md`).

## Step 4: point the app at the new project (done in this build: project `rddhicjixcavdcvqkmer`)
This build already uses the new project URL and its public **anon** key (a JWT whose role is `anon`; safe in the browser, protected by the security rules from migration 001).
The steps below are only needed if you ever move to another project.
In `app.js`, near line 4872, change these two lines:
```
var SUPA_URL='https://<new-project-ref>.supabase.co';
var SUPA_KEY='sb_publishable_…';        // Supabase → Settings → API Keys → Publishable key
```
Nothing else in the repo contains the project address (checked). The function URLs are built from `SUPA_URL`.
Never put the `secret` / service-role key in the app.
Then bump `CACHE` in `sw.js` (e.g. `wisal-v134`) so phones fetch the new file.

## Step 5: deploy and test (use a real Gmail you own)
1. Open `https://wisal.family` in a private window.
2. **Create account** → you should be inside the app straight away (Confirm email OFF).
3. Sign out → **Sign in** works.
4. **Forgot password** → mail arrives within a minute → open it on the same phone → choose new password → you are signed in.
5. Settings → create an invite code. In a second browser create another account → **Join with a code** → both see the same family.
6. Open Chat in both → send a message and a photo → it appears live on the other side.
7. Ask Wisal AI one question.
If any step shows a red message, its small grey **Details:** line tells the cause; see `docs/EMAIL-AND-LOGIN-CHECKLIST.md`.

## Known issue to fix next (not part of this setup)
A person who **joins** a family with an invite code may be detached from it on the next sign-in, because the app's sync reads only the person's own `family_data` row and never looks up `family_members`. The database side is ready for the fix (members can read the owner's row). This is the first item for the Family step.

## Reset (only if you REUSE the current project and want a clean slate)
**This permanently deletes all Wisal data in that project. Run only if you are sure.**
```
drop table if exists public.family_reads, public.family_messages, public.family_members,
  public.family_data, public.subscriptions, public.ai_usage cascade;
drop function if exists public.join_household(text), public.is_household_member(uuid),
  public.ai_bump(uuid, int), public.family_data_guard(), public.family_messages_guard();
```
Then run migrations 001, 002, 003. Existing users in Authentication → Users can stay (or delete them there).
