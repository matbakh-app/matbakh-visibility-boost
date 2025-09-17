import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestPost = async ({ request }) => {
  // POST /partner-credits { partner_id, grant, billing_mode?, overage_policy?, unit_price_eur? }
  // Idempotent: upsert partner_credits; add ledger 'grant'
  
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const body = await request.json()
    const { 
      partner_id, 
      grant, 
      billing_mode = 'issue', 
      overage_policy = 'allow_and_invoice', 
      unit_price_eur = 0.00,
      reason = 'Admin grant',
      created_by = 'admin'
    } = body

    if (!partner_id || !grant || grant <= 0) {
      return new Response(
        JSON.stringify({ error: 'partner_id and positive grant amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert partner credits configuration
    const { error: upsertError } = await supabase
      .from('partner_credits')
      .upsert({
        partner_id,
        billing_mode,
        overage_policy,
        unit_price_eur,
        credits_granted: grant,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'partner_id'
      })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to update partner credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add ledger entry
    const { error: ledgerError } = await supabase
      .from('partner_credit_ledger')
      .insert({
        partner_id,
        kind: 'grant',
        quantity: grant,
        reason,
        created_by
      })

    if (ledgerError) {
      console.error('Ledger error:', ledgerError)
      return new Response(
        JSON.stringify({ error: 'Failed to record ledger entry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        partner_id, 
        granted: grant,
        billing_mode,
        overage_policy 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

export const onRequestGet = async ({ request }) => {
  // GET /partner-credits?partner_id=... -> current balance + policies
  
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const partner_id = url.searchParams.get('partner_id')

    if (!partner_id) {
      return new Response(
        JSON.stringify({ error: 'partner_id parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data, error } = await supabase
      .from('v_partner_credit_balance')
      .select('*')
      .eq('partner_id', partner_id)
      .single()

    if (error) {
      console.error('Query error:', error)
      return new Response(
        JSON.stringify({ error: 'Partner not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

export const onRequestPatch = async ({ request }) => {
  // PATCH /partner-credits { partner_id, adjust: +/-int, policy updates }
  
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const body = await request.json()
    const { 
      partner_id, 
      adjust, 
      billing_mode, 
      overage_policy, 
      unit_price_eur,
      reason = 'Admin adjustment',
      created_by = 'admin'
    } = body

    if (!partner_id) {
      return new Response(
        JSON.stringify({ error: 'partner_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update policies if provided
    const updates: any = { updated_at: new Date().toISOString() }
    if (billing_mode) updates.billing_mode = billing_mode
    if (overage_policy) updates.overage_policy = overage_policy
    if (unit_price_eur !== undefined) updates.unit_price_eur = unit_price_eur

    if (Object.keys(updates).length > 1) { // More than just updated_at
      const { error: updateError } = await supabase
        .from('partner_credits')
        .update(updates)
        .eq('partner_id', partner_id)

      if (updateError) {
        console.error('Update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update partner policies' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle credit adjustment if provided
    if (adjust && adjust !== 0) {
      // Update credits_granted for positive adjustments, credits_consumed for negative
      const creditUpdate = adjust > 0 
        ? { credits_granted: supabase.raw(`credits_granted + ${adjust}`) }
        : { credits_consumed: supabase.raw(`credits_consumed + ${Math.abs(adjust)}`) }

      const { error: adjustError } = await supabase
        .from('partner_credits')
        .update(creditUpdate)
        .eq('partner_id', partner_id)

      if (adjustError) {
        console.error('Adjust error:', adjustError)
        return new Response(
          JSON.stringify({ error: 'Failed to adjust credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add ledger entry
      const { error: ledgerError } = await supabase
        .from('partner_credit_ledger')
        .insert({
          partner_id,
          kind: 'adjust',
          quantity: adjust,
          reason,
          created_by
        })

      if (ledgerError) {
        console.error('Ledger error:', ledgerError)
      }
    }

    // Return updated balance
    const { data } = await supabase
      .from('v_partner_credit_balance')
      .select('*')
      .eq('partner_id', partner_id)
      .single()

    return new Response(
      JSON.stringify({ success: true, ...data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}