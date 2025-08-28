import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal read-only endpoint: GET ?business_id=...
export const onRequestGet = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const businessId = url.searchParams.get("business_id")
    
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "missing business_id" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // For now, return mock data since we don't have vc_results table yet
    const mockData = {
      total_score: 78,
      trend_30d: 12,
      actions_top3: [
        {
          id: "optimize_photos",
          title: "Fotos optimieren",
          why: "Bessere Fotos steigern Klicks um 35%",
          roi_hint: "hoch",
          effort: "niedrig"
        },
        {
          id: "respond_reviews",
          title: "Bewertungen beantworten",
          why: "Zeigt Kundenservice und verbessert Ranking",
          roi_hint: "mittel",
          effort: "niedrig"
        },
        {
          id: "update_hours",
          title: "Öffnungszeiten aktualisieren",
          why: "Verhindert verlorene Kunden",
          roi_hint: "mittel",
          effort: "niedrig"
        }
      ],
      history: [
        { date: "2025-01-20", score: 72 },
        { date: "2025-01-25", score: 78 }
      ],
      created_at: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(mockData), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Owner overview error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}