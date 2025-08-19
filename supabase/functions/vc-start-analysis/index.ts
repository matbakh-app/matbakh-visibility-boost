import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "info@matbakh.app";
const FRONTEND_BASE_URL = Deno.env.get("FRONTEND_BASE_URL") || "https://matbakh.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = new Uint8Array(crypto.subtle.digestSync("SHA-256", data));
  return Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendConfirmEmail(to: string, token: string) {
  const confirmUrl =
    `${SUPABASE_URL.replace("https://", "https://")}/functions/v1/vc-confirm-email?token=${token}`;
  const html = `
    <p>Bitte bestätige deine E-Mail für deinen Sichtbarkeits-Check.</p>
    <p><a href="${confirmUrl}">E-Mail bestätigen und Ergebnis öffnen</a></p>
    <p>Oder kopiere den Link in den Browser: ${confirmUrl}</p>
  `;
  const payload = {
    from: MAIL_FROM,
    to,
    subject: "Bestätigung – Sichtbarkeits-Check",
    html,
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend error: ${res.status} ${t}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const business_name = (body.restaurantName || "").trim();
    const location_text = (body.address || "").trim();
    const locale = (body.locale || "de").trim();
    const marketing_consent: boolean = !!body.marketing_consent;

    console.log("vc-start-analysis: received data", { email, business_name, location_text, locale, marketing_consent });

    if (!email || !business_name) {
      console.log("vc-start-analysis: validation failed", { email, business_name });
      return new Response(JSON.stringify({ ok: false, error: "validation" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Token + Hash
    const token = crypto.randomUUID().replace(/-/g, "");
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Insert Lead – Spaltennamen an dein Schema angepasst
    const { error: insertErr } = await supabase.from("visibility_check_leads").insert({
      email,
      email_confirmed: false,
      confirm_token_hash: tokenHash,
      confirm_expires_at: expiresAt,
      analysis_status: "pending",
      analysis_started_at: new Date().toISOString(),
      locale,
      marketing_consent,
      business_name,     // vormals restaurant_name
      location_text,     // vormals address
    });

    if (insertErr) {
      console.error("vc-start-analysis: insert failed", insertErr);
      return new Response(JSON.stringify({ ok: false, error: "insert_failed", details: insertErr.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    console.log("vc-start-analysis: lead inserted, sending email to", email);

    // Bestätigungsmail
    await sendConfirmEmail(email, token);

    console.log("vc-start-analysis: email sent successfully");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("vc-start-analysis: error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "internal" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});