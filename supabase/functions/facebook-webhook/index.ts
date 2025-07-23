
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const VERIFY_TOKEN = Deno.env.get("FACEBOOK_WEBHOOK_VERIFY_TOKEN") || "";
const APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET") || "";
const DEBUG_MODE = Deno.env.get("FACEBOOK_DEBUG_MODE") === "true";

const SIGNATURE_HEADER = "x-hub-signature";

// CORS Headers für Web-Requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function log(...args: any[]) {
  if (DEBUG_MODE || true) { // Immer loggen für Debugging
    console.log("[Facebook Webhook]", new Date().toISOString(), ...args);
  }
}

async function isValidSignature(req: Request, rawBody: string): Promise<boolean> {
  const signature = req.headers.get(SIGNATURE_HEADER) || req.headers.get("x-hub-signature-256");
  if (!signature || !APP_SECRET) {
    log("❌ Keine Signatur oder App Secret vorhanden");
    return false;
  }

  try {
    const [algo, receivedHash] = signature.split("=");
    log("🔐 Validiere Signatur:", { algo, receivedHash: receivedHash?.substring(0, 10) + "..." });

    // SHA-1 oder SHA-256 Support
    const hashAlgo = algo === "sha256" ? "SHA-256" : "SHA-1";
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(APP_SECRET),
      { name: "HMAC", hash: { name: hashAlgo } },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody)
    );
    
    const expectedHashHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = receivedHash === expectedHashHex;
    log(isValid ? "✅ Signatur gültig" : "❌ Signatur ungültig");
    return isValid;
  } catch (error) {
    log("❌ Fehler bei Signatur-Validierung:", error);
    return false;
  }
}

serve(async (req: Request) => {
  const { method, url } = req;
  const parsedUrl = new URL(url);

  log(`📨 ${method} Request erhalten:`, parsedUrl.pathname);

  // Handle CORS preflight requests
  if (method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // GET: Webhook Verification (Facebook Setup)
  if (method === "GET") {
    const mode = parsedUrl.searchParams.get("hub.mode");
    const token = parsedUrl.searchParams.get("hub.verify_token");
    const challenge = parsedUrl.searchParams.get("hub.challenge");

    log("🔍 Webhook-Verifizierung:", { mode, token: token ? "***" : "nicht vorhanden", challenge });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      log("✅ Webhook-Verifizierung erfolgreich");
      return new Response(challenge, { 
        status: 200,
        headers: corsHeaders
      });
    } else {
      log("❌ Webhook-Verifizierung fehlgeschlagen - Token stimmt nicht überein");
      return new Response("Forbidden", { 
        status: 403,
        headers: corsHeaders
      });
    }
  }

  // POST: Facebook Events empfangen
  if (method === "POST") {
    const rawBody = await req.text();
    log("📦 POST Body empfangen, Länge:", rawBody.length);

    // Signatur-Validierung
    if (!(await isValidSignature(req, rawBody))) {
      log("❌ Ungültige Signatur - Request abgelehnt");
      return new Response("Invalid signature", { 
        status: 403,
        headers: corsHeaders
      });
    }

    try {
      const body = JSON.parse(rawBody);
      
      if (body.object) {
        log("✅ Facebook Event empfangen:", {
          object: body.object,
          entry_count: body.entry?.length || 0,
          first_entry: body.entry?.[0] ? {
            id: body.entry[0].id,
            time: body.entry[0].time,
            changes_count: body.entry[0].changes?.length || 0
          } : null
        });

        // Hier könntest du später Events verarbeiten und in Supabase speichern
        // Beispiel: await supabase.from('facebook_events').insert({ ... })

        return new Response("EVENT_RECEIVED", { 
          status: 200,
          headers: corsHeaders
        });
      } else {
        log("⚠️ Unbekannter Event-Typ empfangen");
        return new Response("Unknown event type", { 
          status: 200,
          headers: corsHeaders
        });
      }
    } catch (error) {
      log("❌ Fehler beim Parsen der Facebook Events:", error);
      return new Response("Invalid JSON", { 
        status: 400,
        headers: corsHeaders
      });
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      ...corsHeaders,
      'Allow': 'GET, POST, OPTIONS'
    }
  });
});
