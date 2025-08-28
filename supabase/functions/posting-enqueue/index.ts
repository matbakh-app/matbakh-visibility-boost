import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestPost = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check feature flag
    if (Deno.env.get('FEATURE_VC_POSTING') !== 'true') {
      return new Response(
        JSON.stringify({ disabled: true, message: 'Posting hooks are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { business_id, channel, payload } = await request.json()

    if (!business_id || !channel || !payload) {
      return new Response(
        JSON.stringify({ error: 'business_id, channel, and payload are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enqueue content using the database function
    const { data, error } = await supabase
      .rpc('enqueue_content', {
        p_business_id: business_id,
        p_channel: channel,
        p_payload: payload
      })

    if (error) {
      console.error('Enqueue error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to enqueue content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Posting] Enqueued content for ${business_id} on ${channel}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data,
        message: 'Content enqueued successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Posting enqueue error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}