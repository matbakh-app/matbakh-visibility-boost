
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Starting token refresh process...");

    // fetch tokens expiring within 5 minutes
    const { data: tokens, error } = await supabase
      .from("google_oauth_tokens")
      .select("*")
      .lt("expires_at", Math.floor(Date.now() / 1000) + 300);

    if (error) {
      console.error("Error fetching tokens:", error);
      throw error;
    }

    console.log(`Found ${tokens?.length || 0} tokens to refresh`);

    for (const token of tokens || []) {
      try {
        // Using fetch instead of googleapis to avoid dependency issues
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
            refresh_token: token.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error(`HTTP error! status: ${refreshResponse.status}`);
        }

        const refreshData = await refreshResponse.json();

        const { error: updateError } = await supabase
          .from("google_oauth_tokens")
          .update({
            access_token: refreshData.access_token,
            expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
            updated_at: new Date().toISOString(),
          })
          .eq("id", token.id);

        if (updateError) {
          console.error("Error updating token:", updateError);
        } else {
          console.log(`Successfully refreshed token for user ${token.user_id}`);
        }
      } catch (e) {
        console.error(`Refresh failed for token ${token.id}:`, e);
      }
    }

    return new Response("Token refresh completed", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
