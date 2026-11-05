# Welcome email: how it works and how to switch it on

**What users get:** right after an account is created, an email from **Wisal Family &lt;hello@wisal.family&gt;**,
subject *"Welcome to Wisal. Your family's space starts here."*, with a personal greeting and the button
**"Open Your Wisal Account →"**. Sent once per account, automatically.

## What I found in the existing system (audit)
| Area | Finding |
|---|---|
| Sign-up | Supabase Auth (`signUp` in `app.js`), no custom backend |
| Email today | Supabase's own auth emails (confirm / reset) through **Resend SMTP**; no marketing/welcome mail existed |
| Confirm email | Recommended OFF for launch, so an account is usable the moment it is created |
| Database | Supabase Postgres; `auth.users` is the source of truth for "a new account exists" |
| Design | dark theme `#0A0E1A / #141A2B / #1C2338`, text `#E9ECF6`, accent `#7B9BF0 / #9DB6F7`, Plus Jakarta Sans, two-ring logo |
| Name at sign-up | not collected, so I added an **optional "First name" box** to the Create-account form only |

## How it works (one email, once, never blocking sign-up)
```
account is created ──► DB trigger (migration 004)
                              │ inserts a row in welcome_emails (primary key = user_id → no duplicates)
                              │ calls the Edge Function with a shared secret
                              ▼
                         wisal-welcome ──► claims the row (pending/failed → sending: only one caller wins)
                                       ──► reads the user (email, first name) with the service key
                                       ──► sends through Resend (HTML + plain text, Idempotency-Key per user)
                                       ──► row = sent (+ Resend message id)  or  failed (+ short reason)
```
- **Fires** the moment an account is created, so the welcome arrives together with Supabase's confirmation email (Confirm email ON) or right away (Confirm email OFF). While confirmation is still pending, the welcome carries a short "One more step" note telling the person to tap the confirmation link in the other email. Nobody is welcomed twice.
- **Duplicate protection, three layers:** primary key in the table, the claim step in the function, and Resend's idempotency key.
- **Retries:** temporary problems (network, 429, 5xx) are retried up to 3 times in the function. Permanent ones (bad key, unverified domain) are recorded as `failed` and can be re-sent (below).
- **Sign-up can never fail because of email:** the trigger catches every error and only writes it on the row.
- **Nothing sensitive in the email:** no password, no token, no magic link. The button opens `https://wisal.family`; if the person is already signed in on that device they land in their app, otherwise they sign in normally. The destination is locked to `wisal.family` in code.
- **Logs** (Edge Functions → wisal-welcome → Logs): one line per attempt with user id, result, Resend id, masked email. No keys or tokens.

## Switch it on (about 20 minutes, in this order)
1. **Resend → Domains → wisal.family must be "Verified"** (SPF + DKIM records). Add a DMARC record at your DNS host: name `_dmarc`, type TXT, value `v=DMARC1; p=none; rua=mailto:hello@wisal.family`. After a few weeks of clean reports you can move to `p=quarantine`.
2. **Make `hello@wisal.family` a real mailbox** (Cloudflare Email Routing to your Gmail is free). Replies and the "Support" link go there.
3. Supabase → **Database → Extensions** → enable **pg_net**.
4. Supabase → **SQL Editor** → run `supabase/migrations/004_welcome_email.sql`.
5. SQL Editor → run these two lines **separately**, with your own values (the random text is a password you invent, 40+ characters; never put it in GitHub):
   ```
   select vault.create_secret('YOUR-LONG-RANDOM-TEXT', 'wisal_welcome_secret');
   select vault.create_secret('https://rddhicjixcavdcvqkmer.supabase.co/functions/v1/wisal-welcome', 'wisal_welcome_url');
   ```
6. **Edge Functions → Deploy new function** named `wisal-welcome`, paste `supabase/functions/wisal-welcome/index.ts`, **Verify JWT OFF**.
7. **Edge Functions → Secrets**: `RESEND_API_KEY` (your new key) and `WELCOME_WEBHOOK_SECRET` (the **same** random text as step 5). Optional: `APP_URL`, `WELCOME_FROM`.
8. Upload the repo (this build) so that `https://wisal.family/email/hero.jpg` and `https://wisal.family/email/logo-mark.png` open in a browser. The email loads its pictures from there.
9. **Test:** create an account with a Gmail alias such as `yourname+welcome1@gmail.com` and a first name. The email should arrive within a minute.

## Already set this up earlier? Do these two things once
1. SQL Editor: run the updated `supabase/migrations/004_welcome_email.sql` again (safe to repeat). It changes the trigger so the welcome goes out when the account is created, together with the confirmation email.
2. Edge Functions: open `wisal-welcome`, paste the new `supabase/functions/wisal-welcome/index.ts`, Deploy.
Optional but nicer: in Supabase SMTP settings set the sender to `hello@wisal.family` instead of `no-reply@wisal.family`, so the sender name people read has no hyphen either.

## If it does not arrive
SQL Editor: `select user_id, status, attempts, last_error, sent_at from welcome_emails order by created_at desc limit 10;`

| status / last_error | Meaning | Fix |
|---|---|---|
| no row at all | trigger did not fire | run the latest `004` (it must say `after insert on auth.users`), and test with an account created after that |
| `failed` · "Vault secrets … missing" | step 5 not done | run the two `vault.create_secret` lines |
| `pending` for more than a minute | the call never reached the function | pg_net not enabled (step 3), wrong URL in `wisal_welcome_url`, function not deployed |
| `failed` · `resend 422` / "domain is not verified" | Resend domain | step 1 |
| `failed` · `resend 401` | wrong or revoked key | set `RESEND_API_KEY` again |
| `failed` · "RESEND_API_KEY is not set" | step 7 | add the secret |
| `sent` but nothing in inbox | spam folder / DNS | check spam; Resend → Emails shows delivery status; finish SPF/DKIM/DMARC |

**Re-send every failed one** (after fixing the cause):
```
select net.http_post(
  url     := (select decrypted_secret from vault.decrypted_secrets where name = 'wisal_welcome_url'),
  headers := jsonb_build_object('Content-Type','application/json',
             'x-webhook-secret',(select decrypted_secret from vault.decrypted_secrets where name = 'wisal_welcome_secret')),
  body    := jsonb_build_object('user_id', user_id))
from welcome_emails where status = 'failed' and created_at > now() - interval '3 days';
```

## What was tested, and what was not
**Tested here (automated):** the function (10 groups, with type-checking): wrong/missing secret rejected, correct sender / subject / greeting / button / link, duplicates and 3 parallel calls send once, retry after a temporary error, permanent error recorded and later re-sent, unconfirmed or missing user, stale "sending" takeover, HTML-injection in a name, non-wisal redirect rejected, no scripts or external CSS, images have alt text, HTML size well under Gmail's clipping limit. The trigger (16 checks on a real Postgres): created confirmed or unconfirmed (one email at creation, none extra when confirming later), accounts without an email skipped, duplicate row blocked, missing secrets and a failing pg_net both leave sign-up working and record the reason, browsers cannot read the table. Sign-up form (38 checks) and a scan of all 20 pages and 75 tabs for dashes, hyphens and stars. The email was rendered at desktop and phone width.

**Not tested (cannot be from here):** a real send through Resend; real pg_net and Vault on your project; how Gmail (Android/iOS/web), Outlook and Apple Mail draw it. It uses tables, inline CSS, background-colour attributes, a text-only button and alt text, which is the standard safe recipe, but please send yourself a test and look at it in Gmail on your phone, in Outlook if you use it, and in the Gmail web app. If the logo or picture looks missing, the images in step 8 are not live yet.
