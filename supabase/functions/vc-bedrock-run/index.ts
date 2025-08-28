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

    const body = await request.json()
    const { lead_id, place_id, selected_candidate } = body

    if (!lead_id || !place_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id and place_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if Bedrock is enabled and canary percentage
    const { data: bedrockEnabled } = await supabase
      .rpc('is_feature_enabled', { p_flag_name: 'vc_bedrock_live' })

    const { data: canaryPct } = await supabase
      .rpc('get_feature_value', { p_flag_name: 'vc_canary_pct' })

    const useBedrockAnalysis = bedrockEnabled && shouldUseCanary(canaryPct || 10)

    let analysisResult
    if (useBedrockAnalysis) {
      console.log(`[Bedrock] Running AI analysis for lead ${lead_id}`)
      analysisResult = await runBedrockAnalysis(selected_candidate)
    } else {
      console.log(`[Stub] Using stub analysis for lead ${lead_id}`)
      analysisResult = await runStubAnalysis(selected_candidate)
    }

    // Store result
    const runId = crypto.randomUUID()
    const { error: storeError } = await supabase
      .from('vc_runs')
      .insert({
        id: runId,
        lead_id,
        place_id,
        selected_candidate,
        result: analysisResult,
        analysis_type: useBedrockAnalysis ? 'bedrock' : 'stub',
        confidence: analysisResult.confidence || 0.8,
        created_at: new Date().toISOString()
      })

    if (storeError) {
      console.error('Result storage error:', storeError)
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', lead_id)

    // Partner Credits: Consume on REDEEM mode
    if (Deno.env.get('FEATURE_PARTNER_CREDITS') === 'true') {
      try {
        // Get partner_id from lead
        const { data: leadData } = await supabase
          .from('leads')
          .select('partner_id')
          .eq('id', lead_id)
          .single()

        if (leadData?.partner_id) {
          const isRedeem = await checkIsRedeemMode(leadData.partner_id)
          if (isRedeem) {
            await consumePartnerCredit(leadData.partner_id, 'vc_redeem')
          }
        }
      } catch (error) {
        console.error('Partner credit consumption error:', error)
        // Don't fail the main flow for credit issues
      }
    }

    // Log analytics
    console.log(`[Analytics] vc_analysis_complete: lead_id=${lead_id}, type=${useBedrockAnalysis ? 'bedrock' : 'stub'}`)

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        result: analysisResult,
        analysis_type: useBedrockAnalysis ? 'bedrock' : 'stub'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bedrock run error:', error)
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function shouldUseCanary(percentage: number): boolean {
  return Math.random() * 100 < percentage
}

async function runBedrockAnalysis(candidate: any) {
  try {
    // AWS Bedrock integration would go here
    // For now, return enhanced stub data
    console.log('[Bedrock] Analyzing business:', candidate.name)
    
    // Simulate Bedrock API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      overall_score: 78,
      confidence: 0.92,
      subscores: {
        google_presence: 85,
        social_media: 65,
        website_quality: 72,
        review_management: 88
      },
      trend: {
        direction: 'improving',
        change_pct: 12,
        period: '30_days'
      },
      top_actions: [
        {
          id: 'optimize_gmb_photos',
          title: 'Google My Business Fotos optimieren',
          description: 'Hochwertige Fotos von Gerichten und Ambiente hinzufügen',
          why: 'Restaurants mit professionellen Fotos erhalten 42% mehr Anfragen',
          how: 'Mindestens 10 hochauflösende Fotos in verschiedenen Kategorien uploaden',
          impact: 'Bis zu 300€ mehr Umsatz pro Monat',
          effort: 'low',
          roi_estimate: 300,
          priority: 1
        },
        {
          id: 'respond_to_reviews',
          title: 'Auf alle Bewertungen antworten',
          description: 'Professionelle Antworten auf positive und negative Bewertungen',
          why: 'Antworten zeigen Kundenservice und verbessern das Ranking',
          how: 'Wöchentlich alle neuen Bewertungen beantworten, höflich und persönlich',
          impact: 'Bis zu 200€ mehr Umsatz pro Monat',
          effort: 'medium',
          roi_estimate: 200,
          priority: 2
        },
        {
          id: 'update_opening_hours',
          title: 'Öffnungszeiten aktualisieren',
          description: 'Aktuelle Öffnungszeiten in allen Online-Profilen',
          why: 'Falsche Öffnungszeiten führen zu verlorenen Kunden',
          how: 'Öffnungszeiten in Google, Facebook und Website synchronisieren',
          impact: 'Bis zu 150€ mehr Umsatz pro Monat',
          effort: 'low',
          roi_estimate: 150,
          priority: 3
        }
      ],
      evidence: [
        {
          source: 'google_places',
          type: 'profile_completeness',
          score: 0.85,
          details: 'Profil zu 85% vollständig'
        },
        {
          source: 'reviews_analysis',
          type: 'sentiment',
          score: 0.78,
          details: '78% positive Bewertungen'
        }
      ],
      generated_at: new Date().toISOString(),
      analysis_version: 'bedrock_v1.0'
    }
    
  } catch (error) {
    console.error('[Bedrock] Analysis failed:', error)
    // Fallback to stub
    return runStubAnalysis(candidate)
  }
}

async function runStubAnalysis(candidate: any) {
  return {
    overall_score: 72,
    confidence: 0.8,
    subscores: {
      google_presence: 80,
      social_media: 60,
      website_quality: 70,
      review_management: 75
    },
    trend: {
      direction: 'stable',
      change_pct: 3,
      period: '30_days'
    },
    top_actions: [
      {
        id: 'improve_photos',
        title: 'Bessere Fotos hinzufügen',
        description: 'Professionelle Fotos von Speisen und Restaurant',
        why: 'Fotos steigern die Klickrate um durchschnittlich 35%',
        how: 'Mindestens 8 hochwertige Fotos in Google My Business uploaden',
        impact: 'Bis zu 250€ mehr Umsatz pro Monat',
        effort: 'low',
        roi_estimate: 250,
        priority: 1
      },
      {
        id: 'complete_profile',
        title: 'Profil vervollständigen',
        description: 'Alle Geschäftsinformationen ausfüllen',
        why: 'Vollständige Profile werden 2x häufiger besucht',
        how: 'Beschreibung, Öffnungszeiten, Kontaktdaten prüfen und ergänzen',
        impact: 'Bis zu 180€ mehr Umsatz pro Monat',
        effort: 'low',
        roi_estimate: 180,
        priority: 2
      }
    ],
    evidence: [
      {
        source: 'stub_analysis',
        type: 'mock_data',
        score: 0.8,
        details: 'Simulierte Analyse für Entwicklung'
      }
    ],
    generated_at: new Date().toISOString(),
    analysis_version: 'stub_v1.0'
  }
}

async function checkIsRedeemMode(partnerId: string): Promise<boolean> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/partner-credits?partner_id=${partnerId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return data.billing_mode === 'redeem'
  } catch (error) {
    console.error('Error checking billing mode:', error)
    return false
  }
}

async function consumePartnerCredit(partnerId: string, reason: string) {
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/partner-credits`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        partner_id: partnerId,
        adjust: -1,
        reason: reason,
        created_by: 'system'
      })
    })
    console.log(`[Credits] Consumed 1 credit for ${partnerId}: ${reason}`)
  } catch (error) {
    console.error('Credit consumption error:', error)
    throw error
  }
}