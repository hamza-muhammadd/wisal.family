// supabase/functions/wisal-ai/index.ts
//
// The free "Wisal AI" proxy. The app POSTs { system, contents, generationConfig } here and
// expects back { text } or { kind: "daily_limit" | "server_key", error }.
// The Gemini key lives ONLY here, as a secret, never in the browser.
//
// Secrets to set (Supabase -> Edge Functions -> Secrets):
//   GEMINI_API_KEY            required
//   AI_FREE_DAILY_LIMIT       optional, default 20 messages per user per day
//   AI_PLUS_DAILY_LIMIT       optional, default 200
//   GEMINI_MODELS             optional, comma list, tried in order
//
// Deploy with "Verify JWT" OFF (the app sends the new publishable key, which is not a JWT);
// this function checks the signed-in user itself.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const FREE_LIMIT = Number(Deno.env.get("AI_FREE_DAILY_LIMIT") ?? "20");
const PLUS_LIMIT = Number(Deno.env.get("AI_PLUS_DAILY_LIMIT") ?? "200");
const MODELS = (Deno.env.get("GEMINI_MODELS") ??
  "gemini-3.1-flash-lite,gemini-3.5-flash,gemini-2.5-flash-lite,gemini-flash-latest")
  .split(",").map((s) => s.trim()).filter(Boolean);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ kind: "server_key", error: "The free AI is not configured yet." });

    // 1) who is asking? (signed-in users only, so the limit is fair and bots cannot burn the quota)
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: u } = await anon.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Please sign in to use Wisal AI." }, 401);

    // 2) validate what the browser sent
    const body = await req.json().catch(() => ({} as any));
    const contents = Array.isArray(body?.contents) ? body.contents.slice(-40) : [];
    if (!contents.length) return json({ error: "Nothing to answer." }, 400);
    if (JSON.stringify(contents).length > 60000) return json({ error: "That conversation is too long. Start a new chat." }, 400);
    const system = String(body?.system ?? "").slice(0, 8000);
    const gc = body?.generationConfig ?? {};
    const generationConfig = {
      maxOutputTokens: Math.min(Number(gc.maxOutputTokens) || 1024, 1024),
      temperature: Math.min(Math.max(Number(gc.temperature) || 0.7, 0), 1),
    };

    // 3) daily limit (Plus gets more)
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sub } = await admin.from("subscriptions")
      .select("tier,status,current_period_end").eq("user_id", user.id).maybeSingle();
    const isPlus = !!sub && sub.tier === "plus" && sub.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    const limit = isPlus ? PLUS_LIMIT : FREE_LIMIT;
    const { data: used, error: bumpErr } = await admin.rpc("ai_bump", { p_user: user.id, p_limit: limit });
    if (bumpErr) return json({ error: "The AI is busy, please try again in a moment." }, 500);
    if (used === -1) {
      return json({ kind: "daily_limit", error: `You have used today\u2019s ${limit} free AI messages. Add your own free key for unlimited use, or come back tomorrow.` });
    }

    // 4) ask Gemini, falling back through the model list
    for (const model of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig }),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({} as any));
        const text = (d?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("").trim();
        if (text) return json({ text });
        continue;
      }
      if (r.status === 400 || r.status === 401 || r.status === 403) {
        return json({ kind: "server_key", error: "The free AI is not available right now." });
      }
      // 404 / 429 / 5xx: try the next model
    }
    return json({ error: "The AI models are busy right now. Please try again in a minute." }, 502);
  } catch (e) {
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
