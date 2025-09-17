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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Check feature flag
    const { data: flagEnabled } = await supabase
      .rpc('is_feature_enabled', { p_flag_name: 'vc_ident_live' })

    if (!flagEnabled) {
      return new Response(
        JSON.stringify({ error: 'Identification service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.lead_id || !body.business_name) {
      return new Response(
        JSON.stringify({ error: 'lead_id and business_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate mock candidates for now
    const candidates = [
      {
        place_id: `place_${Date.now()}_1`,
        name: body.business_name,
        address: 'Musterstraße 123, 80331 München',
        phone: '+49 89 12345678',
        website: 'https://example.com',
        category: 'restaurant',
        confidence: 0.95,
        evidence_count: 3
      },
      {
        place_id: `place_${Date.now()}_2`,
        name: `${body.business_name} Restaurant`,
        address: 'Beispielplatz 456, 80331 München',
        phone: '+49 89 87654321',
        category: 'restaurant',
        confidence: 0.78,
        evidence_count: 2
      }
    ]

    // Log analytics event (without PII)
    console.log(`[Analytics] vc_identify_candidates: lead_id=${body.lead_id}, candidate_count=${candidates.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        candidates,
        normalized_query: body.business_name.trim().toLowerCase()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Identification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}