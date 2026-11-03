// supabase/functions/wisal-pay-ipn/index.ts
// SSLCommerz calls this after a payment. We re-check the transaction directly
// with SSLCommerz (never trust the POST alone), then write the subscription row.
//
// Deploy:  supabase functions deploy wisal-pay-ipn --no-verify-jwt
// (MUST be --no-verify-jwt: SSLCommerz has no Supabase token.)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const form = await req.formData();
    const val_id = String(form.get("val_id") || "");
    const user_id = String(form.get("value_a") || ""); // set by wisal-pay from the verified user
    const tier = String(form.get("value_b") || "plus");
    const cycle = String(form.get("value_c") || "month");
    const method = String(form.get("value_d") || "");
    const tran_id = String(form.get("tran_id") || "");
    if (!val_id || !user_id) return new Response("missing fields", { status: 400 });

    // Server-to-server validation.
    const sandbox = (Deno.env.get("SSLCZ_SANDBOX") ?? "true") === "true";
    const base = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    const url =
      `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}` +
      `&store_id=${encodeURIComponent(Deno.env.get("SSLCZ_STORE_ID")!)}` +
      `&store_passwd=${encodeURIComponent(Deno.env.get("SSLCZ_STORE_PASS")!)}` +
      `&format=json`;
    const v = await fetch(url).then((r) => r.json());

    if (v.status === "VALID" || v.status === "VALIDATED") {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const end = new Date();
      end.setMonth(end.getMonth() + (cycle === "year" ? 12 : 1));
      await admin.from("subscriptions").upsert({
        user_id,
        tier,
        cycle,
        method,
        status: "active",
        last_tran: tran_id,
        current_period_end: end.toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    // Always 200 so SSLCommerz doesn't keep retrying the IPN.
    return new Response("ok");
  } catch (e) {
    return new Response("err: " + e, { status: 500 });
  }
});
