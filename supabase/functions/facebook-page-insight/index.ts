import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageName, accessToken } = await req.json()

    if (!pageName || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing pageName or accessToken' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Facebook Page Insight: Analyzing page "${pageName}"`);

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageName}?fields=name,fan_count,category,link,about,description,location,verification_status,messenger_enabled,website&access_token=${accessToken}`
    )

    if (!res.ok) {
      const error = await res.json()
      console.error('❌ Facebook Graph API Error:', error);
      return new Response(
        JSON.stringify({ error }), 
        { 
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await res.json()
    console.log('✅ Facebook Page Insight successful:', data.name || pageName);
    
    return new Response(
      JSON.stringify({ data }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (err) {
    console.error('💥 Facebook Page Insight Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})