import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_BASE_URL = Deno.env.get("FRONTEND_BASE_URL") || "https://matbakh.app";

function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = new Uint8Array(crypto.subtle.digestSync("SHA-256", data));
  return Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });

  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (!token) return new Response("missing token", { status: 400 });

    console.log("vc-confirm-email: confirming token", token.substring(0, 8) + "...");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const tokenHash = sha256Hex(token);

    const { error } = await supabase
      .from("visibility_check_leads")
      .update({ email_confirmed: true })
      .eq("confirm_token_hash", tokenHash)
      .gte("confirm_expires_at", new Date().toISOString());

    if (error) {
      console.error("vc-confirm-email: update failed", error);
      return new Response("update failed", { status: 500 });
    }

    console.log("vc-confirm-email: email confirmed, redirecting");

    const redirect = `${FRONTEND_BASE_URL}/visibilitycheck/result/${token}`;
    return new Response(null, { status: 302, headers: { Location: redirect } });
  } catch (e) {
    console.error("vc-confirm-email: error", e);
    return new Response("internal", { status: 500 });
  }
});