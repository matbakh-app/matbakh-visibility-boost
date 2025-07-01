
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { partner_id } = await req.json();

    if (!partner_id) {
      return new Response(
        JSON.stringify({ error: 'partner_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log(`Activating billing for partner: ${partner_id}`);

    // Get partner's business profile and booking info
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('google_connected, go_live')
      .eq('partner_id', partner_id)
      .single();

    if (profileError || !businessProfile) {
      console.error('Failed to fetch business profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Business profile not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if partner is ready for billing activation
    if (!businessProfile.google_connected || !businessProfile.go_live) {
      return new Response(
        JSON.stringify({ 
          error: 'Partner not ready for billing activation',
          google_connected: businessProfile.google_connected,
          go_live: businessProfile.go_live,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get partner's active bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('partner_bookings')
      .select('*')
      .eq('partner_id', partner_id)
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null);

    if (bookingsError) {
      console.error('Failed to fetch bookings:', bookingsError);
      throw bookingsError;
    }

    let activatedCount = 0;

    // Activate billing for each subscription
    for (const booking of bookings || []) {
      try {
        if (booking.stripe_subscription_id) {
          console.log(`Activating subscription: ${booking.stripe_subscription_id}`);
          
          // End trial period and start billing
          await stripe.subscriptions.update(booking.stripe_subscription_id, {
            trial_end: 'now',
            proration_behavior: 'none',
          });

          // Update booking status
          await supabase
            .from('partner_bookings')
            .update({
              go_live_required: false,
              go_live_at: new Date().toISOString(),
              status: 'active',
            })
            .eq('id', booking.id);

          activatedCount++;
          console.log(`Successfully activated billing for booking ${booking.id}`);
        }
      } catch (error) {
        console.error(`Failed to activate billing for booking ${booking.id}:`, error);
        // Continue with other bookings even if one fails
      }
    }

    // Log the billing activation event
    await supabase.from('billing_events').insert({
      partner_id: partner_id,
      event: 'billing_activated',
    });

    const result = {
      success: true,
      message: `Billing activated for ${activatedCount} subscription(s)`,
      partner_id,
      activated_subscriptions: activatedCount,
    };

    console.log(`Billing activation complete for partner ${partner_id}: ${activatedCount} subscriptions activated`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Billing activation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
