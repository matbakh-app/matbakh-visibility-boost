import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthExchangeRequest {
  code: string;
  serviceType: 'gmb' | 'analytics' | 'ads';
  userId: string;
  redirectUri: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, serviceType, userId, redirectUri }: OAuthExchangeRequest = await req.json();
    
    console.log('🔐 Processing Google OAuth exchange for service:', serviceType);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    // Get service-specific account IDs
    let serviceAccountId = null;
    try {
      if (serviceType === 'gmb') {
        // Get GMB accounts
        const gmbResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (gmbResponse.ok) {
          const gmbData = await gmbResponse.json();
          serviceAccountId = gmbData.accounts?.[0]?.name?.split('/').pop();
        }
      } else if (serviceType === 'analytics') {
        // Get GA4 properties
        const ga4Response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts/-/properties', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (ga4Response.ok) {
          const ga4Data = await ga4Response.json();
          serviceAccountId = ga4Data.properties?.[0]?.name?.split('/').pop();
        }
      } else if (serviceType === 'ads') {
        // Get Google Ads customer ID
        const adsResponse = await fetch('https://googleads.googleapis.com/v15/customers:listAccessibleCustomers', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '',
          },
        });
        
        if (adsResponse.ok) {
          const adsData = await adsResponse.json();
          serviceAccountId = adsData.resourceNames?.[0]?.split('/').pop();
        }
      }
    } catch (error) {
      console.warn('Failed to fetch service account ID:', error);
      // Continue without service account ID
    }

    // Prepare token data
    const tokenInsertData: any = {
      user_id: userId,
      google_user_id: userInfo.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      email: userInfo.email,
      service_type: serviceType,
      scopes: tokenData.scope?.split(' ') || [],
    };

    // Add service-specific fields
    if (serviceType === 'gmb' && serviceAccountId) {
      tokenInsertData.gmb_account_id = serviceAccountId;
    } else if (serviceType === 'analytics' && serviceAccountId) {
      tokenInsertData.ga4_property_id = serviceAccountId;
    } else if (serviceType === 'ads' && serviceAccountId) {
      tokenInsertData.ads_customer_id = serviceAccountId;
    }

    // Store tokens in database (upsert to handle reconnections)
    const { data, error } = await supabase
      .from('google_oauth_tokens')
      .upsert(tokenInsertData, {
        onConflict: 'user_id,service_type',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to store tokens: ${error.message}`);
    }

    console.log('✅ Google OAuth tokens stored successfully for service:', serviceType);

    return new Response(JSON.stringify({
      success: true,
      serviceType,
      accountId: serviceAccountId,
      email: userInfo.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Google OAuth exchange error:', error);
    
    return new Response(JSON.stringify({
      error: 'OAuth exchange failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});