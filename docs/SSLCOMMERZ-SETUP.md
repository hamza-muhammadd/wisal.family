# Wisal Plus — turning on real payments (SSLCommerz)

## What is SSLCommerz? (short version)

SSLCommerz is Bangladesh's most common **payment gateway**. Instead of you
integrating bKash, Nagad, Rocket, Visa, Mastercard and every bank one-by-one,
you integrate **SSLCommerz once** and it gives your customer a single secure page
where they pick any of those and pay. The money settles into your business bank
account. It's the same rail most BD e-commerce sites use.

**How the flow works in Wisal:**

1. User taps **Start Wisal Plus** → picks bKash / Nagad / Card → **Continue to secure checkout**.
2. Your app calls the **`wisal-pay`** function → it asks SSLCommerz for a payment session → gets a secure URL → sends the user there.
3. User pays on SSLCommerz's page.
4. SSLCommerz does two things: sends the user **back to your app** (`?wisal_pay=success`) **and** pings your **`wisal-pay-ipn`** function server-to-server.
5. `wisal-pay-ipn` double-checks the payment with SSLCommerz, then writes a row in the **`subscriptions`** table (tier = plus, active).
6. Your app reads that row (`wisalSyncPlan`) and unlocks Plus — on any device.

The app side (steps 1, 2, 6) is **already built and wired**. This guide is only the
backend (steps 2's function, and 4–5).

---

## Two worlds: Sandbox vs Live (read this first)

- **Sandbox** = free test mode. You get test credentials **instantly**, no documents.
  Payments are fake (test cards / test bKash). Use this to build and test everything today.
- **Live** = real money. This needs a **registered business** (trade licence, business
  bank account, etc.) because SSLCommerz has to settle real funds to you. Approval takes
  a few days and their team reviews your site.

**Do everything in Sandbox first.** Flip one setting to go Live later.

- Sandbox sign-up: https://developer.sslcommerz.com/registration/
- Live sign-up (when your business is ready): https://signup.sslcommerz.com/register

---

## Step 1 — Get sandbox credentials
Register on the sandbox link above. You'll receive a **Store ID** and **Store Password**.

## Step 2 — Set them as Supabase secrets
(You already did this style of thing for your `wisal-ai` function.)

```bash
supabase secrets set SSLCZ_STORE_ID=your_sandbox_store_id
supabase secrets set SSLCZ_STORE_PASS=your_sandbox_store_pass
supabase secrets set SSLCZ_SANDBOX=true
supabase secrets set APP_URL=https://wisal.family
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — you don't set those.

## Step 3 — Create the subscriptions table
Open Supabase → **SQL Editor**, paste the contents of **`subscriptions.sql`**, run it.

## Step 4 — Add the two functions
Put the files here in your project:

```
supabase/functions/wisal-pay/index.ts
supabase/functions/wisal-pay-ipn/index.ts
```

Deploy both:

```bash
supabase functions deploy wisal-pay --no-verify-jwt
supabase functions deploy wisal-pay-ipn --no-verify-jwt
```

`--no-verify-jwt` is required: `wisal-pay` verifies the user itself, and SSLCommerz
(which calls the IPN) has no Supabase token.

## Step 5 — Test it (sandbox)
1. Open your app, sign in, finish onboarding → **Start Wisal Plus** → pick a method → checkout.
2. You'll land on the SSLCommerz **sandbox** page. Complete a test payment
   (their page shows test cards / test wallet options).
3. You return to the app on `?wisal_pay=success` and see **"Welcome to Wisal Plus"**.
4. In Supabase → **Table editor → subscriptions**, you'll see your row with
   `status = active`, `tier = plus`.
5. Reload the app / sign in on another device — still Plus. Loop complete.

If something fails, check **Supabase → Edge Functions → Logs** for `wisal-pay`
and `wisal-pay-ipn`.

## Step 6 — Go live (later, once your business is registered)
1. Get **live** Store ID / Password from the live dashboard.
2. Update secrets and flip the switch:
   ```bash
   supabase secrets set SSLCZ_STORE_ID=your_live_store_id
   supabase secrets set SSLCZ_STORE_PASS=your_live_store_pass
   supabase secrets set SSLCZ_SANDBOX=false
   ```
   (No code change, no redeploy needed — the functions read `SSLCZ_SANDBOX`.)
3. Do one small real payment yourself to confirm, then you're taking real money.

---

## Notes & good-to-know

- **Prices live in two places on purpose.** The app's `WISAL_PRICE` (৳149 / ৳990) is for
  display; `wisal-pay/index.ts` has its own `PRICE` used for the actual charge, so the
  amount can never be tampered with from the browser. If you change a price, change both.
- **Security:** the user is identified from their Supabase login token inside `wisal-pay`,
  and every payment is re-validated inside `wisal-pay-ipn` before Plus is granted. The
  browser can't fake "I'm Plus" — only the IPN (service role) writes the table.
- **Not built yet (future):** actually *gating* Plus-only features. Right now the app
  records who is Plus (`isPlus()` is ready to use); when you want to lock a feature, wrap it
  with `if(!isPlus()){ /* show upgrade */ }`. Say the word and I'll wire specific features.
- **Recurring billing:** this is a simple "pay for a period" model (renews by paying again).
  SSLCommerz also has subscription/tokenized billing if you want true auto-renew later.
