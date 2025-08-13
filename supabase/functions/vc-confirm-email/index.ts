import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function sha256Hex(s: string): Promise<string> {
  const u8 = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest("SHA-256", u8);
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Missing token", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const tokenHash = await sha256Hex(token);

    const { data, error } = await supabase
      .from("visibility_check_leads")
      .update({ email_confirmed: true })
      .eq("confirm_token_hash", tokenHash)
      .gt("confirm_expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("vc-confirm-email: update error", error);
    }

    const frontend = Deno.env.get("FRONTEND_BASE_URL") ?? "http://localhost:5173";
    const target = `${frontend}/visibilitycheck/result/${encodeURIComponent(token)}`;

    return new Response(null, { status: 302, headers: { Location: target } });
  } catch (e) {
    console.error("vc-confirm-email: error", e);
    return new Response("Internal error", { status: 500 });
  }
});
