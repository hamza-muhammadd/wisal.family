# Wisal — making email confirmation actually work

You want to **keep** email confirmation on. Good call — it stops fake signups and
typo'd addresses. This guide makes the emails actually arrive.

---

## Why nothing arrived (the real cause)

Supabase's built-in email sender is **for testing only**. Two hard limits:

1. It only delivers to addresses that belong to **your own Supabase organization**
   (i.e. your own team members). Sign up with any other address and the mail is
   simply never delivered — that's why it wasn't even in spam.
2. It's rate-limited to a couple of emails **per hour**.

So this was never a bug in Wisal. The fix is to give Supabase a real mail service
to send through. That's what "custom SMTP" means.

---

## What you'll set up

**Resend** (resend.com) — built for developers, free tier covers roughly 3,000
emails/month, and Supabase's own docs recommend it. Emails will come from your own
domain, e.g. `no-reply@wisal.family`, which also looks far more trustworthy than
`noreply@mail.app.supabase.io`.

(Alternatives that work the same way: Brevo, SendGrid, Mailgun, Amazon SES. If you'd
rather not touch DNS at all, Brevo lets you verify a single sender address instead of a
whole domain — but domain verification gives much better inbox placement.)

---

## Step 1 — Create a Resend account

1. Go to **resend.com** → sign up (GitHub login works).

## Step 2 — Add and verify wisal.family

1. Resend dashboard → **Domains** → **Add Domain** → enter `wisal.family`.
2. Resend shows you several **DNS records** (DKIM, SPF, and usually DMARC).
3. Go to wherever your domain's DNS lives (your registrar, or Vercel if the domain
   is managed there) and add those records exactly as shown.
4. Back in Resend, click **Verify**. It usually passes within minutes (can take a
   few hours). Wait until it says **Verified** — don't skip this.

> This step is what tells Gmail "wisal.family really did send this", so mail lands in
> the inbox instead of spam.

## Step 3 — Create an API key

1. Resend → **API Keys** → **Create API Key**.
2. Name it something like `supabase-smtp`, permission **Sending access**.
3. Copy the key — it starts with `re_`. **It's shown only once**, save it somewhere safe.

## Step 4 — Put it into Supabase

1. Supabase → **Authentication** → **Emails** (under NOTIFICATIONS) → **SMTP Settings** tab.
2. Turn **Enable Custom SMTP** on, and fill in:

   | Field | Value |
   |---|---|
   | Sender email | `no-reply@wisal.family` |
   | Sender name | `Wisal` |
   | Host | `smtp.resend.com` |
   | Port | `587` |
   | Username | `resend` |
   | Password | your `re_...` API key |

   > If port 587 gives trouble, `465` also works. Minimum TLS 1.2 if it asks.

3. **Save**.

## Step 5 — Turn confirmation back on

Authentication → **Sign In / Providers** → **User Signups** section →
**Confirm email** → **ON** → **Save changes**.

(That's the page you already found.)

## Step 6 — Raise the rate limit

Right after enabling custom SMTP, Supabase caps you at **30 emails/hour** by default
as a safety measure.

Authentication → **Rate Limits** → raise the email limit to something sane for you
(e.g. 100–200/hour). You can raise it again as Wisal grows.

## Step 7 — URL configuration

Authentication → **URL Configuration**:

- **Site URL**: `https://wisal.family`
- **Redirect URLs**: add `https://wisal.family` and `https://wisal.family/**`

The app sends `emailRedirectTo` pointing at your own origin, so the confirmation link
brings people straight back into Wisal.

---

## Test it

1. Sign up in the app with a **real email you own** (a Gmail is a good test — it's the
   strictest).
2. The mail should arrive within seconds, from `Wisal <no-reply@wisal.family>`.
3. Tap the link → you land back on wisal.family → the app picks up the session
   automatically, cleans the URL, and shows **"Email confirmed — welcome to Wisal!"**
4. If it didn't arrive, tap **"Didn't get it? Resend email"** on the check-your-email
   screen (already built into the app).

### If something goes wrong

- **Resend → Logs** shows every message and exactly why it bounced or was rejected.
  This is the first place to look — it tells you far more than Supabase does.
- Mail lands in spam → domain isn't fully verified yet, or DMARC record is missing.
- "Email address not authorized" → custom SMTP didn't save; you're still on the
  built-in sender.
- Nothing at all in Resend logs → Supabase never sent it; re-check the SMTP fields
  (username is literally the word `resend`, not your email).

---

## Also worth knowing

- Password reset ("forgot password") emails go through the same SMTP, so those start
  working too once this is done.
- You can brand the emails: Authentication → **Emails** → **Templates** → edit
  *Confirm signup*. Keep the `{{ .ConfirmationURL }}` variable intact.
- Keep the Resend API key in Supabase only — never put it in the HTML file.
