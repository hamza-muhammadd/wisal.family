# Sign-up / forgot-password not working: checklist

Sign-in sends no email. Sign-up and forgot-password both do. If only those two fail,
the cause is almost always email delivery or the CAPTCHA, not the app code.

## Step 0: read the real error (1 minute)
Since sw v133 the error box shows a grey **Details:** line. Ask a failing user for a screenshot.

| Details line says | Cause | Fix |
|---|---|---|
| `unexpected_failure` / "Error sending … email" | Supabase could not send through SMTP | A, B |
| `over_email_send_rate_limit` / "rate limit" | Too many emails per hour | C |
| "Email address not authorized" | Custom SMTP not saved, still on Supabase's test sender | A |
| `captcha` / "captcha verification process failed" | Turnstile secret does not match site key | D |
| "Turnstile 110200" (or any Turnstile code) | wisal.family not allowed for the site key | D |
| "That email already has a Wisal account" | Account exists | tell user: Sign in or Forgot password |

Also open **Supabase → Logs → Auth** and **Resend → Logs**: they show the exact reason per attempt.

## A. Resend (most likely)
- Resend free plan: about **100 emails per day** and 3,000 per month. A busy day stops all mail.
- Resend → Domains: `wisal.family` must say **Verified** (DNS records can lapse or be edited at Hostinger).
- Resend → API Keys: the key in Supabase must still exist. If unsure, create a new one and paste it again.
- Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465` (try `587` if it fails),
  username literally `resend`, password = the `re_…` key, sender `no-reply@wisal.family`. Save.

## B. Quick way to let people in today (no email needed to sign up)
Supabase → Authentication → Sign In / Providers → Email → turn **Confirm email OFF** → Save.
New users are then signed in immediately. Turnstile still blocks bots.
Trade-off: typo'd emails are accepted, so password reset will not reach those users. Turn it back ON once email is stable.
Forgot-password always needs a working email.

## C. Rate limits
Supabase → Authentication → Rate Limits: raise "emails per hour" (default 30 after custom SMTP) to 100–200.

## D. Turnstile (Cloudflare)
- Cloudflare → Turnstile → your widget → **Hostnames** must include `wisal.family`.
- The **site key** in `app.js` and the **secret key** in Supabase → Authentication → Attack Protection must belong to the **same** widget.
- Not sure? Supabase → Attack Protection → turn CAPTCHA OFF temporarily. The app keeps working (it just sends the token anyway).

## E. URL configuration
Supabase → Authentication → URL Configuration: Site URL `https://wisal.family`; Redirect URLs `https://wisal.family` and `https://wisal.family/**`.

## Test after every change
Use a real Gmail you own: Create account → mail arrives → tap link. Then Forgot password → mail arrives → set new password.
