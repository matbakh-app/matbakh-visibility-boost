import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestGet = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get 24h stats from leads table
    const { data: leads24h } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const { data: doiConfirmed24h } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('status', 'verified')
      .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Mock VC runs and bedrock fail rate for now
    const mockVcRuns24h = Math.floor(Math.random() * 20) + 5
    const mockBedrockFailRate = Math.random() * 0.05 // 0-5%

    const stats = {
      leads_24h: leads24h?.length || 0,
      doi_confirmed_24h: doiConfirmed24h?.length || 0,
      vc_runs_24h: mockVcRuns24h,
      bedrock_fail_rate: mockBedrockFailRate
    }

    return new Response(
      JSON.stringify(stats),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Admin overview error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}