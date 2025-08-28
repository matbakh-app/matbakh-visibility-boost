import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = new Uint8Array(crypto.subtle.digestSync("SHA-256", data));
  return encodeHex(hash);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    if (!token) {
      console.log("vc-result: missing token");
      return new Response(JSON.stringify({ error: "missing token" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    console.log("vc-result: checking token", token.substring(0, 8) + "...");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // First try new vc_result_tokens table
    const { data: resultToken, error: resultTokenError } = await supabase
      .from("vc_result_tokens")
      .select(`
        *,
        leads (
          id,
          email,
          business_name,
          analysis_status,
          report_url,
          locale
        )
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .maybeSingle();

    if (resultToken && !resultTokenError) {
      console.log("vc-result: found result token data");
      
      // Mark token as used
      await supabase
        .from("vc_result_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      // Generate mock VC result data for now
      const mockResult = {
        overall_score: 78,
        confidence: 0.92,
        subscores: {
          google_presence: 85,
          social_media: 65,
          website_quality: 72,
          review_management: 88
        },
        trend: {
          direction: 'improving',
          change_pct: 12,
          period: '30_days'
        },
        top_actions: [
          {
            id: 'optimize_gmb_photos',
            title: 'Google My Business Fotos optimieren',
            description: 'Hochwertige Fotos von Gerichten und Ambiente hinzufügen',
            why: 'Restaurants mit professionellen Fotos erhalten 42% mehr Anfragen',
            how: 'Mindestens 10 hochauflösende Fotos in verschiedenen Kategorien uploaden',
            impact: 'Bis zu 300€ mehr Umsatz pro Monat',
            effort: 'low',
            roi_estimate: 300,
            priority: 1
          },
          {
            id: 'respond_to_reviews',
            title: 'Auf alle Bewertungen antworten',
            description: 'Professionelle Antworten auf positive und negative Bewertungen',
            why: 'Antworten zeigen Kundenservice und verbessern das Ranking',
            how: 'Wöchentlich alle neuen Bewertungen beantworten, höflich und persönlich',
            impact: 'Bis zu 200€ mehr Umsatz pro Monat',
            effort: 'medium',
            roi_estimate: 200,
            priority: 2
          }
        ],
        evidence: [
          {
            source: 'google_places',
            type: 'profile_completeness',
            score: 0.85,
            details: 'Profil zu 85% vollständig'
          }
        ],
        business_name: resultToken.leads.business_name,
        email: resultToken.leads.email
      };

      return new Response(JSON.stringify({ ok: true, data: mockResult }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Fallback to old token system (hashed tokens)
    const tokenHash = sha256Hex(token);
    const { data, error } = await supabase
      .from("visibility_check_leads")
      .select("analysis_status, report_url, locale")
      .eq("confirm_token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      console.error("vc-result: query error", error);
      throw error;
    }
    if (!data) {
      console.log("vc-result: token not found", token.substring(0, 8) + "...");
      return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    console.log("vc-result: found legacy data", data);

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("vc-result: error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
