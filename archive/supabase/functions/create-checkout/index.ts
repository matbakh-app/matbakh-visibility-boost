
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase with service role key for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get partner ID from business_partners table
    const { data: partnerData, error: partnerError } = await supabaseClient
      .from('business_partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError || !partnerData) {
      throw new Error("Partner profile not found");
    }
    const partnerId = partnerData.id;
    logStep("Partner found", { partnerId });

    // Parse request body
    const { packageCode, returnUrl } = await req.json();
    if (!packageCode) throw new Error("Package code is required");
    logStep("Request parsed", { packageCode, returnUrl });

    // Get package details from service_packages
    const { data: packageData, error: packageError } = await supabaseClient
      .from('service_packages')
      .select(`
        *,
        prices:service_prices(*)
      `)
      .eq('code', packageCode)
      .single();

    if (packageError || !packageData) {
      throw new Error(`Package not found: ${packageCode}`);
    }
    logStep("Package found", { packageData });

    const packagePrice = packageData.prices?.[0];
    if (!packagePrice) {
      throw new Error("No price found for package");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { partner_id: partnerId }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    const origin = req.headers.get("origin") || returnUrl || "http://localhost:5173";
    
    // Create checkout session based on package type
    let sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: packagePrice.currency.toLowerCase(),
            product_data: { 
              name: packageData.default_name,
              metadata: { package_code: packageCode }
            },
            unit_amount: packagePrice.promo_active && packagePrice.promo_price_cents 
              ? packagePrice.promo_price_cents 
              : packagePrice.normal_price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/angebote?canceled=true`,
      metadata: {
        partner_id: partnerId,
        package_code: packageCode,
        user_id: user.id
      }
    };

    // Set mode based on package type
    if (packageData.is_recurring) {
      sessionConfig.mode = "subscription";
      sessionConfig.line_items[0].price_data.recurring = {
        interval: packageData.interval_months === 1 ? "month" : "year",
        interval_count: packageData.interval_months || 1
      };
      
      // Add 14-day trial for recurring subscriptions
      sessionConfig.subscription_data = {
        trial_period_days: 14,
        metadata: {
          partner_id: partnerId,
          package_code: packageCode,
          trial_enabled: "true"
        }
      };
      logStep("Recurring subscription with 14-day trial configured");
    } else {
      sessionConfig.mode = "payment";
      logStep("One-time payment configured");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Store booking record
    await supabaseClient.from('partner_bookings').insert({
      partner_id: partnerId,
      service_name: packageData.default_name,
      service_slug: packageCode,
      service_type: packageData.is_recurring ? 'subscription' : 'one_time',
      price: (packagePrice.promo_active && packagePrice.promo_price_cents 
        ? packagePrice.promo_price_cents 
        : packagePrice.normal_price_cents) / 100,
      status: 'pending',
      stripe_customer_id: customerId,
      payment_status: 'pending'
    });
    logStep("Booking record created");

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      customerId: customerId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
