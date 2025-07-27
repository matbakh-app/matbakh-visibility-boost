import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface RedeemCodeRequest {
  code: string
  leadId: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, leadId }: RedeemCodeRequest = await req.json()

    if (!code || !leadId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code, leadId' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get and validate redeem code
    const { data: redeemCode, error: codeError } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (codeError || !redeemCode) {
      return new Response(
        JSON.stringify({ error: 'Ungültiger Code' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Check if code is expired
    if (new Date(redeemCode.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code abgelaufen' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if code has remaining uses
    if (redeemCode.uses >= redeemCode.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Code bereits vollständig eingelöst' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if lead exists
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select('id, hasSubscription')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Update lead subscription status and increment code usage
    const { error: updateLeadError } = await supabase
      .from('visibility_check_leads')
      .update({ hasSubscription: true })
      .eq('id', leadId)

    if (updateLeadError) {
      console.error('Update lead error:', updateLeadError)
      return new Response(
        JSON.stringify({ error: 'Failed to update lead subscription' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Increment code usage
    const { error: updateCodeError } = await supabase
      .from('redeem_codes')
      .update({ uses: redeemCode.uses + 1 })
      .eq('id', redeemCode.id)

    if (updateCodeError) {
      console.error('Update code error:', updateCodeError)
      return new Response(
        JSON.stringify({ error: 'Failed to update code usage' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`Code ${code} redeemed successfully for lead ${leadId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Code erfolgreich eingelöst',
        campaignTag: redeemCode.campaign_tag,
        remainingUses: redeemCode.max_uses - (redeemCode.uses + 1)
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Redeem code error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})