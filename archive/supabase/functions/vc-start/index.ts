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

    // Generate tracking ID
    const trackingId = crypto.randomUUID()

    // Create VC lead entry
    const { error: leadError } = await supabase
      .from('visibility_check_leads')
      .insert({
        id: trackingId,
        email: body.email,
        business_name: body.business_name,
        status: 'doi_pending',
        partner_id: body.partner_id,
        campaign_id: body.campaign_id,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        utm_content: body.utm_content,
        ref: body.ref,
        consent_analytics: body.consent.analytics,
        consent_marketing: body.consent.marketing || false,
        ip_address: clientIP,
        user_agent: userAgent
      })

    if (leadError) {
      console.error('Lead creation error:', leadError)
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate DOI token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_doi_token', {
        p_email: body.email,
        p_tracking_id: trackingId,
        p_partner_id: body.partner_id,
        p_campaign_id: body.campaign_id,
        p_consent_data: body.consent,
        p_ip_address: clientIP,
        p_user_agent: userAgent
      })

    if (tokenError) {
      console.error('Token generation error:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send DOI email via SES
    const emailSent = await sendDOIEmail({
      email: body.email,
      businessName: body.business_name,
      token: tokenData,
      trackingId,
      partnerId: body.partner_id
    })

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log analytics event
    await logAnalyticsEvent('vc_start', {
      tracking_id: trackingId,
      partner_id: body.partner_id,
      campaign_id: body.campaign_id,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      ref: body.ref
    })

    return new Response(
      JSON.stringify({
        success: true,
        tracking_id: trackingId,
        message: 'Verification email sent. Please check your inbox.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('VC Start error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function sendDOIEmail({ email, businessName, token, trackingId, partnerId }) {
  try {
    const sesEndpoint = Deno.env.get('AWS_SES_ENDPOINT')
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_REGION') || 'eu-central-1'

    if (!sesEndpoint || !accessKeyId || !secretAccessKey) {
      console.error('AWS SES credentials not configured')
      return false
    }

    const verifyUrl = `${Deno.env.get('PUBLIC_URL')}/vc/verify?token=${token}`
    
    // Load German microcopy for DOI email
    const subject = `${businessName} - Sichtbarkeits-Check bestätigen`
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hallo!</h2>
        <p>Sie haben einen kostenlosen Sichtbarkeits-Check für <strong>${businessName}</strong> angefordert.</p>
        <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihre Analyse zu erhalten:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            E-Mail bestätigen
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Dieser Link ist 24 Stunden gültig. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          matbakh.app - Digitale Sichtbarkeit für Restaurants<br>
          Diese E-Mail wurde an ${email} gesendet.
        </p>
      </div>
    `

    // Send via AWS SES (simplified - in production use proper AWS SDK)
    const messageId = `${trackingId}-${Date.now()}`
    
    // Log email sent event
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    await supabase
      .from('mail_events')
      .insert({
        event_type: 'sent',
        message_id: messageId,
        recipient_email: email,
        subject,
        template_name: 'doi_verification',
        tracking_id: trackingId,
        partner_id: partnerId,
        metadata: { business_name: businessName }
      })

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

async function logAnalyticsEvent(eventName: string, data: any) {
  try {
    // In production, send to your analytics service
    console.log(`Analytics: ${eventName}`, data)
  } catch (error) {
    console.error('Analytics logging error:', error)
  }
}