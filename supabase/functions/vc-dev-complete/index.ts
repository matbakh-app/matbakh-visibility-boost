import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function sha256Hex(s: string){const d=new TextEncoder().encode(s);const h=new Uint8Array(crypto.subtle.digestSync("SHA-256", d));return encodeHex(h);}

serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) return new Response("missing token", { status: 400 });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { error } = await supabase
    .from("visibility_check_leads")
    .update({
      analysis_status: "completed",
      analysis_completed_at: new Date().toISOString(),
      report_url: "https://matbakh.app/demo-report",
    })
    .eq("confirm_token_hash", sha256Hex(token));

  if (error) return new Response(error.message, { status: 500 });
  return new Response("ok");
});