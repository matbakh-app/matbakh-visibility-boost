
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partner_id } = await req.json();
    
    if (!partner_id) {
      return new Response(JSON.stringify({ error: "partner_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { 
      apiVersion: "2023-10-16" 
    });

    console.log(`Activating billing for partner ${partner_id}`);

    // Get partner info including business profile
    const { data: partner, error: partnerError } = await supabase
      .from("business_profiles")
      .select("google_connected, go_live, partner_id")
      .eq("partner_id", partner_id)
      .single();

    if (partnerError || !partner) {
      console.error("Partner not found:", partnerError);
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (!partner.go_live || !partner.google_connected) {
      return new Response(JSON.stringify({ error: "Partner not ready for billing activation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get partner booking info
    const { data: booking, error: bookingError } = await supabase
      .from("partner_bookings")
      .select("stripe_subscription_id")
      .eq("partner_id", partner_id)
      .single();

    if (bookingError || !booking?.stripe_subscription_id) {
      console.error("No active subscription found:", bookingError);
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // End trial and activate billing
    await stripe.subscriptions.update(booking.stripe_subscription_id, {
      trial_end: "now",
      proration_behavior: "none",
    });

    // Update partner booking status
    await supabase
      .from("partner_bookings")
      .update({ 
        go_live_required: false, 
        go_live_at: new Date().toISOString() 
      })
      .eq("partner_id", partner_id);

    console.log(`Successfully activated billing for partner ${partner_id}`);

    return new Response(JSON.stringify({ message: "Billing activated successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Activate billing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
