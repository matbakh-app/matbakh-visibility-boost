import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateProfileRequest {
  partnerId: string;
  gmbMetrics?: any;
  ga4Metrics?: any;
  adsMetrics?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerId, gmbMetrics, ga4Metrics, adsMetrics }: UpdateProfileRequest = await req.json();
    
    console.log('📊 Updating business profile with Google metrics for partner:', partnerId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update business profile with new Google metrics
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (gmbMetrics) {
      updateData.gmb_metrics = gmbMetrics;
      updateData.gmb_connected = true;
    }

    if (ga4Metrics) {
      updateData.ga4_metrics = ga4Metrics;
    }

    if (adsMetrics) {
      updateData.ads_metrics = adsMetrics;
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .update(updateData)
      .eq('partner_id', partnerId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating business profile:', error);
      throw error;
    }

    console.log('✅ Business profile updated successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      profile: data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in update-business-profile:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to update business profile', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});