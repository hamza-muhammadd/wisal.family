// supabase/functions/wisal-delete-account/index.ts
//
// Removes the user's auth record for real. The browser cannot do this itself:
// deleting an auth user needs the service-role key, which must never leave the server.
//
// Deploy:  supabase functions deploy wisal-delete-account --no-verify-jwt
// (--no-verify-jwt because we verify the caller's token ourselves, below.)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    // 1. Who is asking? Only a signed-in user may delete, and only themselves.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not signed in." }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: u } = await anon.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Not signed in." }, 401);

    // 2. Service role: clear the rows first, then the account itself.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Best-effort on each table — a missing table must not block the deletion.
    const wipe = async (table: string, column: string) => {
      try { await admin.from(table).delete().eq(column, user.id); } catch (_) { /* ignore */ }
    };
    await wipe("family_messages", "user_id");
    await wipe("family_members", "member_id");
    await wipe("family_data", "user_id");
    await wipe("subscriptions", "user_id");

    // 3. The account itself. This is the part the browser cannot do.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
