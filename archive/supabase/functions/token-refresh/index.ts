
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting token refresh process...');

    // Fetch tokens expiring within 5 minutes (300 seconds)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { data: tokens, error: fetchError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .lt('expires_at', fiveMinutesFromNow)
      .not('refresh_token', 'is', null);

    if (fetchError) {
      console.error('Error fetching tokens:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${tokens?.length || 0} tokens to refresh`);

    let refreshed = 0;
    let failed = 0;

    for (const token of tokens || []) {
      try {
        // Refresh token using Google OAuth2
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: token.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
          throw new Error(`Token refresh failed: ${refreshData.error_description || refreshData.error}`);
        }

        // Update token in database
        const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();
        
        const { error: updateError } = await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', token.id);

        if (updateError) {
          throw updateError;
        }

        refreshed++;
        console.log(`Successfully refreshed token for user ${token.user_id}`);

      } catch (error) {
        failed++;
        console.error(`Failed to refresh token for user ${token.user_id}:`, error);
        
        // Log the failure but don't stop the process
        await supabase.from('oauth_event_logs').insert({
          user_id: token.user_id,
          provider: 'google',
          event_type: 'token_refresh_failed',
          success: false,
          error_message: error.message,
        });
      }
    }

    const result = {
      success: true,
      message: `Token refresh complete: ${refreshed} refreshed, ${failed} failed`,
      refreshed,
      failed,
      total: tokens?.length || 0,
    };

    console.log(result.message);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
