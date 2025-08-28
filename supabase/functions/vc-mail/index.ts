import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VCStartRequest {
  email: string;
  business_name: string;
  consent: {
    analytics: boolean;
    marketing?: boolean;
  };
  partner_id?: string;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ref?: string;
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
      .rpc('is_feature_enabled', { p_flag_name: 'vc_doi_live' })

    if (!flagEnabled) {
      return new Response(
        JSON.stringify({ error: 'DOI service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: VCStartRequest = await request.json()
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown'
    const userAgent = request.headers.get('User-Agent') || 'unknown'

    // Validate required fields
    if (!body.email || !body.business_name || !body.consent?.analytics) {
      return new Response(
        JSON.stringify({ error: 'Email, business_name, and analytics consent required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        email: body.email,
        business_name: body.business_name,
        partner_id: body.partner_id,
        campaign_id: body.campaign_id,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        utm_content: body.utm_content,
        ref: body.ref,
        status: 'pending'
      })
      .select()
      .single()

    if (leadError) {
      console.error('Lead creation error:', leadError)
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store consents
    const consents = [
      { lead_id: lead.id, consent_type: 'analytics', granted: body.consent.analytics },
      { lead_id: lead.id, consent_type: 'marketing', granted: body.consent.marketing || false }
    ]

    const { error: consentError } = await supabase
      .from('consents')
      .insert(consents.map(c => ({
        ...c,
        ip_address: clientIP,
        user_agent: userAgent
      })))

    if (consentError) {
      console.error('Consent storage error:', consentError)
    }

    // Generate DOI token
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_doi_token_minimal', { p_lead_id: lead.id })

    if (tokenError) {
      console.error('Token generation error:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send DOI email
    const emailSent = await sendDOIEmail({
      email: body.email,
      businessName: body.business_name,
      token,
      leadId: lead.id
    })

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Partner Credits: Consume on ISSUE mode
    if (Deno.env.get('FEATURE_PARTNER_CREDITS') === 'true' && body.partner_id) {
      try {
        const isIssue = await checkIsIssueMode(body.partner_id)
        if (isIssue) {
          await consumePartnerCredit(body.partner_id, 'vc_start')
        }
      } catch (error) {
        console.error('Partner credit consumption error:', error)
        // Don't fail the main flow for credit issues
      }
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'doi_sent' })
      .eq('id', lead.id)

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: 'Verification email sent. Please check your inbox.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('VC Mail error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function sendDOIEmail({ email, businessName, token, leadId }) {
  try {
    const SES_REGION = Deno.env.get('SES_REGION') || 'eu-central-1'
    const SES_SENDER = Deno.env.get('SES_SENDER') || 'noreply@matbakh.app'
    const DOI_URL_BASE = Deno.env.get('DOI_URL_BASE') || 'https://matbakh.app'
    
    const verifyUrl = `${DOI_URL_BASE}/vc/confirm?t=${token}`
    
    // German DOI email template
    const subject = `${businessName} - Sichtbarkeits-Check bestätigen`
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0;">matbakh.app</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Digitale Sichtbarkeit für Restaurants</p>
        </div>
        
        <h2 style="color: #1f2937;">Hallo!</h2>
        <p style="color: #374151; line-height: 1.6;">
          Sie haben einen kostenlosen Sichtbarkeits-Check für <strong>${businessName}</strong> angefordert.
        </p>
        <p style="color: #374151; line-height: 1.6;">
          Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihre Analyse zu erhalten:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            E-Mail bestätigen
          </a>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Falls der Button nicht funktioniert:</strong><br>
            Kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Dieser Link ist 24 Stunden gültig. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Diese E-Mail wurde an ${email} gesendet.<br>
            matbakh.app - Ihr Partner für digitale Sichtbarkeit
          </p>
        </div>
      </div>
    `

    // In production, use AWS SES SDK
    // For now, log the email (replace with actual SES call)
    console.log(`[SES] Sending DOI email to ${email}`)
    console.log(`[SES] Subject: ${subject}`)
    console.log(`[SES] Verify URL: ${verifyUrl}`)
    
    // Simulate SES success
    return true

  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

async function checkIsIssueMode(partnerId: string): Promise<boolean> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/partner-credits?partner_id=${partnerId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    return data.billing_mode === 'issue'
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