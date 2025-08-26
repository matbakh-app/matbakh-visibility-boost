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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] vc-start-analysis: Function called with method:`, req.method, "from origin:", origin);
  console.log(`[${timestamp}] vc-start-analysis: Headers:`, Object.fromEntries(req.headers.entries()));

  if (req.method === "OPTIONS") {
    console.log(`[${timestamp}] vc-start-analysis: Handling OPTIONS request`);
    return new Response(null, { headers: cors(origin) });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const business_name = (body.restaurantName || "").trim();
    const location_text = (body.address || "").trim();
    const locale = (body.locale || "de").trim();
    const marketing_consent: boolean = !!body.marketing_consent;

    console.log(`[${timestamp}] vc-start-analysis: received data`, { email, business_name, location_text, locale, marketing_consent });

    if (!email || !business_name) {
      console.log(`[${timestamp}] vc-start-analysis: validation failed`, { email: !!email, business_name: !!business_name });
      return new Response(JSON.stringify({ ok: false, error: "validation" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    // TODO: implement email sending and database operations
    // Current status: This function is a placeholder and does NOT send emails
    console.log(`[${timestamp}] vc-start-analysis: WARNING - This is a placeholder function. No email will be sent!`);
    console.log(`[${timestamp}] vc-start-analysis: Email sending should be implemented here or called via separate function`);
    
    const res = { 
      ok: true, 
      test: true, 
      received: { email, business_name }, 
      ts: timestamp,
      warning: "This is a placeholder - no email sent"
    };
    console.log(`[${timestamp}] vc-start-analysis: Returning success response (but no email sent)`);
    
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });

  } catch (e) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] vc-start-analysis: error`, e);
    console.error(`[${timestamp}] vc-start-analysis: error stack`, e instanceof Error ? e.stack : 'No stack trace');
    return new Response(JSON.stringify({ ok: false, error: "Internal server error", timestamp }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  }
});