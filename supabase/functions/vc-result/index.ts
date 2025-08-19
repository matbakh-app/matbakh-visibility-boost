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
    if (!token) return new Response(JSON.stringify({ error: "missing token" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const tokenHash = sha256Hex(token);
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await supabase
      .from("visibility_check_leads")
      .select("analysis_status, report_url, locale")
      .eq("confirm_token_hash", tokenHash)
      .maybeSingle();

    if (error) throw error;
    if (!data) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
