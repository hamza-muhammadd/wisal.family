// supabase/functions/wisal-welcome/index.ts
//
// Sends the branded Welcome email, exactly once per account, from hello@wisal.family.
//
// HOW IT RUNS
//   A database trigger (migration 004) fires the moment an account is created, so the welcome goes out
//   together with Supabase's confirmation email (or right away when "Confirm email" is OFF). The trigger records the user in
//   `welcome_emails` (primary key = user_id, so a retry can never create a second row) and calls
//   this function with { user_id } and a shared secret header.
//
// SECRETS (Supabase -> Edge Functions -> Secrets)
//   RESEND_API_KEY            required  (Resend API key, never in the browser)
//   WELCOME_WEBHOOK_SECRET    required  (same random value stored in Vault as wisal_welcome_secret)
//   WELCOME_FROM              optional  default: Wisal Family <hello@wisal.family>
//   APP_URL                   optional  default: https://wisal.family  (only wisal.family hosts are accepted)
// Deploy with "Verify JWT" OFF. The shared secret is the lock.
//
// NOTHING SENSITIVE IS IN THE EMAIL: no password, no token, no magic link. The button opens the app;
// people who are not signed in on that device sign in normally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUBJECT = "Welcome to Wisal. Your family's space starts here.";
const ASSET_BASE = "https://wisal.family";
const SUPPORT = "hello@wisal.family";
const SECRET = Deno.env.get("WELCOME_WEBHOOK_SECRET") ?? "";
const FROM = Deno.env.get("WELCOME_FROM") ?? "Wisal Family <hello@wisal.family>";
const ALLOWED_HOSTS = ["wisal.family", "www.wisal.family"];

/* ------------------------------ helpers ------------------------------ */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Turns whatever was typed at sign-up into a safe, tidy first name ("" when unusable). */
export function cleanFirstName(raw: unknown): string {
  let s = String(raw ?? "")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060\uFEFF<>]/g, "")
    .replace(/\s+/g, " ").trim();
  s = s.split(" ")[0] ?? "";                       // first word only
  s = Array.from(s).slice(0, 30).join("");
  if (/^[a-z][a-z'’-]*$/.test(s)) s = s.charAt(0).toUpperCase() + s.slice(1);   // "hamza" -> "Hamza"
  return s;
}

/** The only place the button may point. Anything that is not a wisal.family https URL falls back. */
export function safeAppUrl(raw: string | undefined): string {
  try {
    const u = new URL(raw || "https://wisal.family");
    if (u.protocol === "https:" && ALLOWED_HOSTS.includes(u.hostname)) return u.origin;
  } catch (_) { /* fall through */ }
  return "https://wisal.family";
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ------------------------------ the email ------------------------------ */
export function renderWelcome(firstName: string, appUrl: string, needsConfirm = false): { subject: string; html: string; text: string } {
  const name = cleanFirstName(firstName);
  const hello = name ? `Hello, ${esc(name)}!` : "Hello there!";
  const helloText = name ? `Hello, ${name}!` : "Hello there!";
  const cta = `${appUrl}/?utm_source=welcome&utm_medium=email`;
  const F = "'Plus Jakarta Sans','Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans Bengali',sans-serif";

  const confirmHtml = needsConfirm
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr>
        <td bgcolor="#1C2338" style="background-color:#1C2338;border:1px solid #3A4A7A;border-radius:18px;padding:16px 20px;">
          <div style="font-family:${F};font-size:15px;line-height:23px;color:#C9D6F7;"><strong style="color:#F4F6FC;">One more step.</strong> Please tap the confirmation link in the separate email we just sent, then open your account.</div>
        </td></tr></table>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<title>${esc(SUBJECT)}</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}
  a{text-decoration:none}
  @media only screen and (max-width:620px){
    .px{padding-left:20px !important;padding-right:20px !important}
    .card-pad{padding:20px !important}
    .h1{font-size:30px !important;line-height:36px !important}
    .h2{font-size:20px !important;line-height:28px !important}
    .hero{height:auto !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#0A0E1A;" bgcolor="#0A0E1A">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0A0E1A;font-size:1px;line-height:1px;">Your family&rsquo;s calm, private space is ready. Open it in one tap.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0E1A" style="background-color:#0A0E1A;">
<tr><td align="center" class="px" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

    <!-- brand header -->
    <tr><td style="padding:0 8px 18px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="left" valign="middle" width="58"><img src="${ASSET_BASE}/email/logo-mark.png" width="46" height="28" alt="" style="width:46px;height:28px;"></td>
        <td align="left" valign="middle" style="font-family:${F};font-size:24px;font-weight:700;letter-spacing:-0.3px;color:#E9ECF6;">Wisal</td>
        <td align="right" valign="middle"><span style="display:inline-block;font-family:${F};font-size:11px;font-weight:700;letter-spacing:1.6px;color:#9DB6F7;background-color:#141A2B;border:1px solid #2A3454;border-radius:999px;padding:7px 12px;">WELCOME</span></td>
      </tr></table>
    </td></tr>

    <!-- main card -->
    <tr><td bgcolor="#141A2B" class="card-pad" style="background-color:#141A2B;border:1px solid #232C46;border-radius:24px;padding:26px;">

      <!-- hero -->
      <img class="hero" src="${ASSET_BASE}/email/hero.jpg" width="546" height="191" alt="Wisal. A calm space for your family." style="width:100%;max-width:546px;height:auto;border-radius:18px;border:1px solid #232C46;">

      <!-- headline -->
      <h1 class="h1" style="margin:28px 0 0 0;font-family:${F};font-size:36px;line-height:42px;font-weight:800;letter-spacing:-0.8px;color:#F4F6FC;">Welcome to Wisal.</h1>
      <h2 class="h2" style="margin:10px 0 0 0;font-family:${F};font-size:22px;line-height:30px;font-weight:600;color:#9DB6F7;">Your family&rsquo;s space starts here.</h2>

      <!-- greeting + message -->
      <p style="margin:26px 0 0 0;font-family:${F};font-size:17px;line-height:26px;font-weight:700;color:#E9ECF6;">${hello}</p>
      <p style="margin:14px 0 0 0;font-family:${F};font-size:16px;line-height:26px;color:#B4BCD4;">We&rsquo;re glad you&rsquo;re here.</p>
      <p style="margin:14px 0 0 0;font-family:${F};font-size:16px;line-height:26px;color:#B4BCD4;">Wisal brings your family&rsquo;s important moments, plans and everyday life together in one calm, private space.</p>
      <p style="margin:14px 0 0 0;font-family:${F};font-size:16px;line-height:26px;color:#B4BCD4;">From organizing daily responsibilities to planning family events, preserving memories and managing shared goals, everything starts here.</p>

      <!-- soft callout -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr>
        <td bgcolor="#1C2338" style="background-color:#1C2338;border:1px solid #2A3454;border-radius:18px;padding:20px 22px;">
          <div style="font-family:${F};font-size:21px;line-height:28px;font-weight:700;letter-spacing:-0.3px;color:#F4F6FC;">Your family. Your space.</div>
          <div style="margin-top:6px;font-family:${F};font-size:15px;line-height:23px;color:#A9B3CE;">A place to organize, connect, plan and grow together.</div>
        </td>
      </tr></table>

      ${confirmHtml}
      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr>
        <td align="center" bgcolor="#9DB6F7" style="background-color:#9DB6F7;border-radius:16px;">
          <a href="${esc(cta)}" target="_blank" style="display:block;padding:18px 24px;font-family:${F};font-size:17px;line-height:22px;font-weight:700;color:#0A0E1A;text-decoration:none;border-radius:16px;">Open Your Wisal Account &rarr;</a>
        </td>
      </tr></table>

      <!-- security note -->
      <p style="margin:22px 0 0 0;font-family:${F};font-size:13px;line-height:20px;color:#8E97AF;">If you didn&rsquo;t create this account, you can safely ignore this email.</p>
    </td></tr>

    <!-- footer -->
    <tr><td align="center" style="padding:26px 12px 0 12px;">
      <p style="margin:0;font-family:${F};font-size:14px;line-height:22px;font-weight:600;color:#C9D2EA;">Wisal Family. One calm home for everything your family is.</p>
      <p style="margin:14px 0 0 0;font-family:${F};font-size:13px;line-height:20px;color:#8E97AF;">
        <a href="${ASSET_BASE}/privacy" target="_blank" style="color:#9DB6F7;text-decoration:none;">Privacy Policy</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:${SUPPORT}" style="color:#9DB6F7;text-decoration:none;">Support</a>
        &nbsp;&middot;&nbsp;
        <a href="${ASSET_BASE}" target="_blank" style="color:#9DB6F7;text-decoration:none;">wisal.family</a>
      </p>
      <p style="margin:14px 0 0 0;font-family:${F};font-size:12px;line-height:18px;color:#6D7590;">You&rsquo;re receiving this because an account was just created with this email address on wisal.family.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = `${SUBJECT}

WELCOME TO WISAL.
Your family's space starts here.

${helloText}

We're glad you're here.

Wisal brings your family's important moments, plans and everyday life together in one calm, private space.

From organizing daily responsibilities to planning family events, preserving memories and managing shared goals, everything starts here.

${needsConfirm ? "One more step. Please tap the confirmation link in the separate email we just sent, then open your account.\n\n" : ""}Open Your Wisal Account:
${cta}

If you didn't create this account, you can safely ignore this email.

Wisal Family. One calm home for everything your family is.
Privacy Policy: ${ASSET_BASE}/privacy
Support: ${SUPPORT}
Website: ${ASSET_BASE}
`;
  return { subject: SUBJECT, html, text };
}

/* ------------------------------ delivery ------------------------------ */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mask = (e: string) => e.replace(/^(.).*(@.*)$/, "$1***$2");

async function sendViaResend(apiKey: string, userId: string, to: string, msg: { subject: string; html: string; text: string }) {
  let last = "unknown error";
  for (const wait of [0, 1500, 4000]) {                       // up to 3 tries on temporary problems
    if (wait) await sleep(wait);
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `wisal-welcome-${userId}`,        // Resend refuses to send the same key twice
        },
        body: JSON.stringify({
          from: FROM, to: [to], reply_to: SUPPORT,
          subject: msg.subject, html: msg.html, text: msg.text,
          tags: [{ name: "category", value: "welcome" }],
        }),
      });
      const d = await r.json().catch(() => ({} as any));
      if (r.ok && d?.id) return { ok: true as const, id: String(d.id) };
      last = `resend ${r.status}: ${String(d?.message ?? d?.name ?? "").slice(0, 160)}`;
      if (r.status !== 429 && r.status < 500) break;           // permanent problem (bad key, unverified domain...)
    } catch (e) {
      last = `network: ${String((e as Error)?.message ?? e).slice(0, 120)}`;
    }
  }
  return { ok: false as const, error: last };
}

/* ------------------------------ entry point ------------------------------ */
Deno.serve(async (req: Request) => {
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!SECRET || !safeEqual(req.headers.get("x-webhook-secret") ?? "", SECRET)) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null as any);
  const userId = String(body?.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "bad user_id" }, 400);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const log = (o: Record<string, unknown>) => console.log(JSON.stringify({ evt: "welcome", user: userId, ...o }));

  // 1) claim the job. Only one caller can move pending/failed -> sending, so duplicates stop here.
  const now = new Date().toISOString();
  let claim = await admin.from("welcome_emails").update({ status: "sending", updated_at: now })
    .eq("user_id", userId).in("status", ["pending", "failed"]).select("attempts");
  if (!claim.data?.length) {
    const stale = new Date(Date.now() - 10 * 60_000).toISOString();     // a crashed run: take over after 10 min
    claim = await admin.from("welcome_emails").update({ status: "sending", updated_at: now })
      .eq("user_id", userId).eq("status", "sending").lt("updated_at", stale).select("attempts");
  }
  if (!claim.data?.length) { log({ result: "skipped" }); return json({ ok: true, skipped: true }); }
  const attempts = (claim.data[0].attempts ?? 0) + 1;
  const fail = async (why: string, status = 502) => {
    await admin.from("welcome_emails").update({ status: "failed", attempts, last_error: why.slice(0, 300), updated_at: new Date().toISOString() }).eq("user_id", userId);
    log({ result: "failed", why });
    return json({ ok: false, error: why }, status);
  };

  if (!apiKey) return await fail("RESEND_API_KEY is not set", 500);

  // 2) who is it?
  const { data: u, error: ue } = await admin.auth.admin.getUserById(userId);
  const user = u?.user;
  if (ue || !user?.email) return await fail("user or email not found", 404);

  // 3) send
  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const first = cleanFirstName(md.first_name ?? md.given_name ?? md.name ?? md.full_name ?? "");
  const msg = renderWelcome(first, safeAppUrl(Deno.env.get("APP_URL")), !user.email_confirmed_at);
  const res = await sendViaResend(apiKey, userId, user.email, msg);
  if (!res.ok) return await fail(res.error);

  await admin.from("welcome_emails").update({ status: "sent", attempts, provider_id: res.id, last_error: null, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
  log({ result: "sent", provider_id: res.id, to: mask(user.email) });
  return json({ ok: true });
});
