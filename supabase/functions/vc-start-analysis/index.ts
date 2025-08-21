import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED = (Deno.env.get("CORS_ORIGINS") || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function cors(origin: string | null) {
  const allow = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  console.log("vc-start-analysis: Function called with method:", req.method, "from origin:", origin);

  if (req.method === "OPTIONS") {
    console.log("vc-start-analysis: Handling OPTIONS request");
    return new Response(null, { headers: cors(origin) });
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
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // For now, return success - TODO: implement email sending and database operations
    const res = { ok: true, test: true, received: { email, business_name }, ts: new Date().toISOString() };
    console.log("vc-start-analysis: Returning success response");
    
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });

  } catch (e) {
    console.error("vc-start-analysis: error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }
});