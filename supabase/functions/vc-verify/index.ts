import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestGet = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        'Missing verification token',
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify DOI token
    const { data: verificationResult, error: verifyError } = await supabase
      .rpc('verify_doi_token', { p_token: token })

    if (verifyError || !verificationResult?.success) {
      return new Response(
        generateErrorPage('Ungültiger oder abgelaufener Bestätigungslink'),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      )
    }

    // Update lead status to verified
    const { error: updateError } = await supabase
      .from('visibility_check_leads')
      .update({ 
        status: 'doi_verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', verificationResult.tracking_id)

    if (updateError) {
      console.error('Lead update error:', updateError)
    }

    // Log analytics event
    await logAnalyticsEvent('vc_doi_verified', {
      tracking_id: verificationResult.tracking_id,
      partner_id: verificationResult.partner_id,
      campaign_id: verificationResult.campaign_id
    })

    // Redirect to identification form
    const redirectUrl = `${Deno.env.get('PUBLIC_URL')}/vc/identify?t=${verificationResult.tracking_id}`
    
    return new Response(
      generateSuccessPage(verificationResult.email, redirectUrl),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
      }
    )

  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      generateErrorPage('Ein Fehler ist aufgetreten'),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
      }
    )
  }
}

function generateSuccessPage(email: string, redirectUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Mail bestätigt - matbakh.app</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { color: #059669; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .button:hover { background-color: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="success">
        <h1>✓ E-Mail bestätigt!</h1>
        <p>Vielen Dank! Ihre E-Mail-Adresse <strong>${email}</strong> wurde erfolgreich bestätigt.</p>
        <p>Jetzt können Sie mit Ihrem kostenlosen Sichtbarkeits-Check fortfahren:</p>
        <a href="${redirectUrl}" class="button">Zur Geschäfts-Identifikation</a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Sie werden automatisch in 5 Sekunden weitergeleitet...
        </p>
      </div>
      <script>
        setTimeout(() => {
          window.location.href = '${redirectUrl}';
        }, 5000);
      </script>
    </body>
    </html>
  `
}

function generateErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fehler - matbakh.app</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { color: #dc2626; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="error">
        <h1>⚠ Bestätigung fehlgeschlagen</h1>
        <p>${message}</p>
        <p>Möglicherweise ist der Link abgelaufen oder bereits verwendet worden.</p>
        <a href="${Deno.env.get('PUBLIC_URL')}/vc" class="button">Neuen Sichtbarkeits-Check starten</a>
      </div>
    </body>
    </html>
  `
}

async function logAnalyticsEvent(eventName: string, data: any) {
  try {
    console.log(`Analytics: ${eventName}`, data)
  } catch (error) {
    console.error('Analytics logging error:', error)
  }
}