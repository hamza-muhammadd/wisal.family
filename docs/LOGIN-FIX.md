# Login fix: forgot / reset password (sw cache v132)

Changed: `app.js`, `index.html`, `styles.css`, `sw.js`.

## What was wrong
| # | Problem | Result |
|---|---|---|
| 1 | The sign-in panel had **no "Forgot password?" control at all** | no way to recover an account |
| 2 | No recovery flow in the code (`resetPasswordForEmail`, `PASSWORD_RECOVERY`, `updateUser` unused) | a recovery link would sign the user in without asking for a new password |
| 3 | Rate-limit error told users to "turn off Confirm email in Supabase" | developer text shown to families |
| 4 | Enter key worked only in the password box | Enter in Email did nothing |
| 5 | Password field was `current-password` even when creating an account | password managers offered the wrong thing |
| 6 | "Check your email" title after sign-up was overwritten by "Welcome back" | users missed the instruction |
| 7 | A CAPTCHA that fails to load gave a misleading message | users stuck with no explanation |
| 8 | No way to reveal the typed password | typos |

## What changed
- Forgot password: email → reset link → "Choose a new password" (with confirm) → signed in.
- A recovery link opens a locked screen; the app stays hidden until a new password is saved.
- Expired or already-used link → forgot screen with an explanation.
- Neutral confirmation text, so nobody can probe which emails are registered.
- Show/hide password, Enter in every field, correct autocomplete, friendlier error texts.
- If `TURNSTILE_SITE_KEY` is ever left as the placeholder, the app logs a console error and continues without a token instead of blocking.

## Tested (jsdom with a mocked Supabase, 27 checks, all pass)
Forgot screen layout, bad email, missing CAPTCHA token, correct API call (email, redirect, CAPTCHA), neutral
success text, back button, show/hide password, sign-up autocomplete, Enter key, recovery link → reset screen
with the URL token removed, short and mismatched passwords rejected, `updateUser` call, app unlocks after
success, back from reset signs the recovery session out, expired link, normal signed-in user is not sent to
reset, "Check your email" title kept.
**Not tested:** the real email arriving, and live Supabase / Turnstile responses.

## To verify after deploy
1. Supabase → Authentication → URL Configuration: Site URL `https://wisal.family`; Redirect URLs include `https://wisal.family` and `https://wisal.family/**`.
2. Supabase → Authentication → Emails → Templates → Reset Password keeps `{{ .ConfirmationURL }}`.
3. With a real Gmail: request the link, open it on the same phone, set a new password, sign in.
