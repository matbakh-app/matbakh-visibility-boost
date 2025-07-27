import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface GenerateRedeemCodeRequest {
  partnerId: string
  maxUses: number
  description?: string
  campaignTag?: string
  durationValue: number
  durationUnit: 'hours' | 'days' | 'weeks'
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      partnerId,
      maxUses,
      description,
      campaignTag,
      durationValue,
      durationUnit
    }: GenerateRedeemCodeRequest = await req.json()

    // Validate input
    if (!partnerId || !maxUses || !durationValue || !durationUnit) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: partnerId, maxUses, durationValue, durationUnit' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate partner exists
    const { data: partner, error: partnerError } = await supabase
      .from('business_partners')
      .select('id')
      .eq('id', partnerId)
      .single()

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: 'Partner not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Generate random code (8 characters, alphanumeric)
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Calculate expiration date
    const multiplier = {
      hours: 3600_000,
      days: 24 * 3600_000,
      weeks: 7 * 24 * 3600_000
    }

    const expires_at = new Date(
      Date.now() + durationValue * multiplier[durationUnit]
    ).toISOString()

    // Insert redeem code
    const { data: redeemCode, error: insertError } = await supabase
      .from('redeem_codes')
      .insert({
        code,
        partner_id: partnerId,
        description: description || null,
        campaign_tag: campaignTag || null,
        expires_at,
        max_uses: maxUses,
        uses: 0,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create redeem code' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`Generated redeem code: ${code} for partner: ${partnerId}`)

    return new Response(
      JSON.stringify({
        success: true,
        code: redeemCode.code,
        campaignTag: redeemCode.campaign_tag,
        expiresAt: redeemCode.expires_at,
        maxUses: redeemCode.max_uses,
        duration: `${durationValue} ${durationUnit}`
      }),
      { status: 201, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Generate redeem code error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})