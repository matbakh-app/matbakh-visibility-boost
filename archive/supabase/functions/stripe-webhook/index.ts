
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook verified", { eventType: event.type, eventId: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const partnerId = session.metadata?.partner_id;
        const packageCode = session.metadata?.package_code;

        if (!partnerId || !packageCode) {
          logStep("Missing metadata in session", { partnerId, packageCode });
          break;
        }

        // Update booking record
        const updateData: any = {
          payment_status: 'completed',
          status: 'active',
          stripe_customer_id: session.customer as string,
          activated_at: new Date().toISOString()
        };

        if (session.subscription) {
          updateData.stripe_subscription_id = session.subscription as string;
          updateData.go_live_required = true; // Will be activated after go_live
        }

        await supabaseClient
          .from('partner_bookings')
          .update(updateData)
          .eq('partner_id', partnerId)
          .eq('service_slug', packageCode)
          .eq('payment_status', 'pending');

        logStep("Booking updated after successful checkout");
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const partnerId = subscription.metadata?.partner_id;

          if (partnerId) {
            await supabaseClient
              .from('partner_bookings')
              .update({
                payment_status: 'completed',
                status: 'active',
                activated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', subscription.id);

            logStep("Subscription booking activated", { subscriptionId: subscription.id });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const partnerId = subscription.metadata?.partner_id;

          if (partnerId) {
            await supabaseClient
              .from('partner_bookings')
              .update({
                payment_status: 'failed',
                status: 'inactive'
              })
              .eq('stripe_subscription_id', subscription.id);

            logStep("Subscription marked as failed", { subscriptionId: subscription.id });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

        const partnerId = subscription.metadata?.partner_id;
        if (partnerId) {
          await supabaseClient
            .from('partner_bookings')
            .update({
              status: 'cancelled',
              expires_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          logStep("Subscription cancelled", { subscriptionId: subscription.id });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
