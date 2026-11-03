// supabase/functions/wisal-pay/index.ts
// Creates an SSLCommerz payment session and returns the gateway URL.
// The Wisal app already POSTs here from onbCheckout().
//
// Deploy:  supabase functions deploy wisal-pay --no-verify-jwt
// (--no-verify-jwt lets us verify the token ourselves and keeps CORS simple;
//  we still authenticate the user manually below.)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Prices in BDT — decided on the SERVER so the browser can't change them.
// Keep these in sync with WISAL_PRICE in the app.
const PRICE: Record<string, number> = { month: 149, year: 990 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({} as any));
    const cycle = body?.cycle === "year" ? "year" : "month";
    const method = String(body?.method || "");

    // 1) Identify the user from their Supabase JWT (never trust body.user_id).
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: u } = await anon.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Please sign in first." }, 401);

    // 2) Amount comes from the server-side price table.
    const amount = PRICE[cycle];

    // 3) Ask SSLCommerz to create a session.
    const sandbox = (Deno.env.get("SSLCZ_SANDBOX") ?? "true") === "true";
    const base = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
    const APP = Deno.env.get("APP_URL") ?? "https://wisal.family";
    const tran_id = "WISAL-" + user.id.slice(0, 8) + "-" + Date.now();

    const form = new URLSearchParams({
      store_id: Deno.env.get("SSLCZ_STORE_ID")!,
      store_passwd: Deno.env.get("SSLCZ_STORE_PASS")!,
      total_amount: String(amount),
      currency: "BDT",
      tran_id,
      // Where SSLCommerz sends the user back. The app reads ?wisal_pay=... on load.
      success_url: `${APP}/?wisal_pay=success&tran=${tran_id}`,
      fail_url: `${APP}/?wisal_pay=fail`,
      cancel_url: `${APP}/?wisal_pay=cancel`,
      // Server-to-server payment notification -> our other function.
      ipn_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/wisal-pay-ipn`,
      shipping_method: "NO",
      product_name: "Wisal Plus",
      product_category: "subscription",
      product_profile: "non-physical-goods",
      cus_name: (user.email || "Wisal user").split("@")[0],
      cus_email: user.email || "user@wisal.family",
      cus_phone: "01700000000",
      cus_add1: "N/A",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      // Echoed back to us verbatim in the IPN — our trusted user + plan info.
      value_a: user.id,
      value_b: "plus",
      value_c: cycle,
      value_d: method,
    });

    const r = await fetch(`${base}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = await r.json();

    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return json({ url: data.GatewayPageURL });
    }
    return json({ error: data.failedreason || "Could not start payment." }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
