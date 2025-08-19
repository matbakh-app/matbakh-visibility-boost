import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM = Deno.env.get("MAIL_FROM") || "info@matbakh.app";
const FRONTEND_BASE_URL = Deno.env.get("FRONTEND_BASE_URL") || "https://matbakh.app";

const ALLOWED_ORIGINS = [
  "https://matbakh.app",
  "https://www.matbakh.app", 
  "http://localhost:5173",
  "http://localhost:4173",
];

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  // Preview-Links von Lovable erlauben (*.lovable.app und *.sandbox.lovable.dev)
  if (origin.endsWith(".lovable.app") || origin.endsWith(".sandbox.lovable.dev")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin! : "https://matbakh.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  console.log("vc-start-analysis: Function called with method:", req.method, "from origin:", origin);

  if (req.method === "OPTIONS") {
    console.log("vc-start-analysis: Handling OPTIONS request");
    return new Response("ok", { 
      headers: corsHeaders,
      status: 200 
    });
  }

  if (req.method !== "POST") {
    console.log("vc-start-analysis: Method not allowed:", req.method);
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For now, just return success without sending email to test if function works
    console.log("vc-start-analysis: Returning test response");
    return new Response(JSON.stringify({ ok: true, test: true, received: { email, business_name } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("vc-start-analysis: error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});