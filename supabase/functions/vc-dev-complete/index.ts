import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = new Uint8Array(crypto.subtle.digestSync("SHA-256", data));
  return Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return new Response("missing token", { status: 400 });

  console.log("vc-dev-complete: marking analysis as completed for token", token.substring(0, 8) + "...");

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const tokenHash = sha256Hex(token);

  const { error } = await supabase
    .from("visibility_check_leads")
    .update({
      analysis_status: "completed",
      analysis_completed_at: new Date().toISOString(),
      report_url: "https://matbakh.app/demo-report",
    })
    .eq("confirm_token_hash", tokenHash);

  if (error) {
    console.error("vc-dev-complete: error", error);
    return new Response(error.message, { status: 500 });
  }

  console.log("vc-dev-complete: analysis marked as completed");
  return new Response("ok");
});