import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function sha256Hex(s: string): Promise<string> {
  const u8 = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest("SHA-256", u8);
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      email,
      restaurantName,
      address,
      locale = "de",
      marketing_consent = false,
    } = body ?? {};

    if (!email || !restaurantName) {
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token and hash for secure confirmation
    const token = crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await sha256Hex(token);
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48h

    // Insert lead
    const { data: lead, error: insertErr } = await supabase
      .from("visibility_check_leads")
      .insert({
        email,
        business_name: restaurantName,
        location_text: address,
        locale,
        gdpr_consent: true,
        marketing_consent,
        marketing_consent_at: marketing_consent ? new Date().toISOString() : null,
        confirm_token_hash: tokenHash,
        confirm_expires_at: expires,
        analysis_status: "pending",
      })
      .select()
      .maybeSingle();

    if (insertErr || !lead) {
      console.error("vc-start-analysis: insert error", insertErr);
      return new Response(JSON.stringify({ ok: false, error: "insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Queue analysis job (best-effort)
    await supabase.from("google_job_queue").insert({
      job_type: "visibility_analysis",
      partner_id: null,
      payload: { lead_id: lead.id },
      status: "pending",
    });

    const confirmUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/vc-confirm-email?token=${token}`;

    // Send Double-Opt-In email
    await resend.emails.send({
      from: Deno.env.get("MAIL_FROM") ?? "info@matbakh.app",
      to: email,
      subject:
        locale === "de"
          ? "Bitte E-Mail bestätigen – Sichtbarkeitsanalyse"
          : "Confirm your email – Visibility Report",
      html: `<p>${
        locale === "de"
          ? "Bitte bestätige deine E-Mail, um deinen Sichtbarkeitsbericht zu öffnen."
          : "Please confirm your email to open your visibility report."
      }</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
      text: confirmUrl,
    });

    console.log(
      "vc-start-analysis: lead created",
      JSON.stringify({ lead_id: lead.id, token_prefix: token.slice(0, 6), locale })
    );

    return new Response(
      JSON.stringify({ ok: true, lead_id: lead.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("vc-start-analysis: error", e);
    return new Response(JSON.stringify({ ok: false, error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
