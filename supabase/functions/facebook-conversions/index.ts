
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookEventData {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url?: string;
  user_data?: {
    em?: string[]; // hashed email
    ph?: string[]; // hashed phone
    fn?: string[]; // hashed first name
    ln?: string[]; // hashed last name
    ct?: string[]; // hashed city
    st?: string[]; // hashed state
    zp?: string[]; // hashed zip
    country?: string[]; // hashed country
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // facebook click id
    fbp?: string; // facebook browser id
  };
  custom_data?: Record<string, any>;
}

interface ConversionsPayload {
  data: FacebookEventData[];
  test_event_code?: string;
}

// SHA256 Hash Function
async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash user data for privacy
async function hashUserData(userData: any): Promise<any> {
  if (!userData) return undefined;

  const hashedData: any = {};

  // Hash email
  if (userData.email) {
    hashedData.em = [await hashSHA256(userData.email)];
  }

  // Hash phone
  if (userData.phone) {
    const cleanPhone = userData.phone.replace(/[^\d]/g, '');
    hashedData.ph = [await hashSHA256(cleanPhone)];
  }

  // Hash first name
  if (userData.first_name) {
    hashedData.fn = [await hashSHA256(userData.first_name)];
  }

  // Hash last name  
  if (userData.last_name) {
    hashedData.ln = [await hashSHA256(userData.last_name)];
  }

  // Hash city
  if (userData.city) {
    hashedData.ct = [await hashSHA256(userData.city)];
  }

  // Hash state
  if (userData.state) {
    hashedData.st = [await hashSHA256(userData.state)];
  }

  // Hash zip
  if (userData.zip) {
    hashedData.zp = [await hashSHA256(userData.zip)];
  }

  // Hash country (2-letter code)
  if (userData.country) {
    hashedData.country = [await hashSHA256(userData.country)];
  }

  // Non-hashed data
  if (userData.client_ip_address) {
    hashedData.client_ip_address = userData.client_ip_address;
  }

  if (userData.client_user_agent) {
    hashedData.client_user_agent = userData.client_user_agent;
  }

  if (userData.fbc) {
    hashedData.fbc = userData.fbc;
  }

  if (userData.fbp) {
    hashedData.fbp = userData.fbp;
  }

  return hashedData;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      partner_id, 
      event_data, 
      user_data, 
      custom_data, 
      test_event_code 
    } = await req.json();

    if (!partner_id || !event_data) {
      return new Response(
        JSON.stringify({ error: 'partner_id and event_data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Facebook config for partner
    const { data: fbConfig, error: configError } = await supabase
      .from('fb_conversions_config')
      .select('pixel_id, access_token, is_active')
      .eq('partner_id', partner_id)
      .eq('is_active', true)
      .single();

    if (configError || !fbConfig) {
      console.error('Facebook config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'Facebook Conversions API not configured for this partner' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user consent (DSGVO compliance)
    const { data: consent } = await supabase
      .from('user_consent_tracking')
      .select('consent_given')
      .eq('partner_id', partner_id)
      .eq('consent_type', 'facebook_conversions')
      .eq('consent_given', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!consent) {
      console.warn('No Facebook conversions consent found for partner:', partner_id);
      // Still log the attempt but don't send
      await supabase.from('fb_conversion_logs').insert({
        partner_id,
        event_name: event_data.event_name,
        pixel_id: fbConfig.pixel_id,
        event_payload: { error: 'No consent given' },
        error_message: 'DSGVO: No user consent for Facebook Conversions API',
        success: false
      });

      return new Response(
        JSON.stringify({ error: 'No consent given for Facebook Conversions API' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash user data for privacy
    const hashedUserData = await hashUserData(user_data);

    // Prepare event payload
    const eventPayload: FacebookEventData = {
      event_name: event_data.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: event_data.event_id || crypto.randomUUID(),
      event_source_url: event_data.event_source_url,
      user_data: hashedUserData,
      custom_data: custom_data
    };

    const payload: ConversionsPayload = {
      data: [eventPayload],
      test_event_code: test_event_code
    };

    // Send to Facebook Conversions API
    const facebookUrl = `https://graph.facebook.com/v17.0/${fbConfig.pixel_id}/events?access_token=${fbConfig.access_token}`;
    
    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    // Log the result
    await supabase.from('fb_conversion_logs').insert({
      partner_id,
      event_name: event_data.event_name,
      pixel_id: fbConfig.pixel_id,
      event_payload: payload,
      response_status: response.status,
      response_body: responseData,
      error_message: response.ok ? null : responseData.error?.message || 'Unknown error',
      success: response.ok
    });

    if (!response.ok) {
      console.error('Facebook API Error:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send event to Facebook', 
          details: responseData 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        facebook_response: responseData,
        event_id: eventPayload.event_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Facebook Conversions API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
