import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestGet = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('t')

    if (!token) {
      return new Response(
        generateErrorPage('Fehlender Bestätigungstoken'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Find and verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('doi_tokens_minimal')
      .select(`
        *,
        leads (
          id,
          email,
          business_name,
          partner_id,
          campaign_id
        )
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('verified_at', null)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        generateErrorPage('Ungültiger oder abgelaufener Bestätigungslink'),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Mark token as verified
    const { error: verifyError } = await supabase
      .from('doi_tokens_minimal')
      .update({ verified_at: new Date().toISOString() })
      .eq('token', token)

    if (verifyError) {
      console.error('Token verification error:', verifyError)
    }

    // Update lead status
    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', tokenData.lead_id)

    if (leadUpdateError) {
      console.error('Lead update error:', leadUpdateError)
    }

    // Log analytics event
    console.log(`[Analytics] vc_doi_confirmed: ${tokenData.leads.email}, lead_id: ${tokenData.lead_id}`)

    // Generate result token for VC dashboard access
    const resultToken = crypto.randomUUID()
    
    // Store result token for VC dashboard access
    const { error: resultTokenError } = await supabase
      .from('vc_result_tokens')
      .insert({
        token: resultToken,
        lead_id: tokenData.lead_id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        created_at: new Date().toISOString()
      })

    if (resultTokenError) {
      console.error('Result token creation error:', resultTokenError)
    }

    // Redirect to VC result dashboard with token
    const redirectUrl = `${Deno.env.get('PUBLIC_URL') || 'https://matbakh.app'}/vc/result?t=${resultToken}`
    
    return new Response(
      generateSuccessPage(tokenData.leads.email, tokenData.leads.business_name, redirectUrl),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
    )

  } catch (error) {
    console.error('DOI confirmation error:', error)
    return new Response(
      generateErrorPage('Ein Fehler ist aufgetreten'),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

function generateSuccessPage(email: string, businessName: string, redirectUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Mail bestätigt - matbakh.app</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .success { color: #059669; }
        .button { 
          background-color: #2563eb; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          display: inline-block; 
          margin: 20px 0;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .button:hover { background-color: #1d4ed8; }
        .checkmark {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #059669;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="checkmark">✓</div>
        <h1 style="color: #1f2937; margin-bottom: 10px;">E-Mail bestätigt!</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Vielen Dank! Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
        </p>
        <p style="color: #374151; margin-bottom: 30px;">
          Ihr Sichtbarkeits-Check für <strong>${businessName}</strong> ist bereit! Sehen Sie sich Ihre Ergebnisse an:
        </p>
        <a href="${redirectUrl}" class="button">Zu Ihren Ergebnissen</a>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
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
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .error { color: #dc2626; }
        .button { 
          background-color: #2563eb; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          display: inline-block; 
          margin: 20px 0;
          font-weight: 600;
        }
        .error-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #dc2626;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">⚠</div>
        <h1 style="color: #1f2937; margin-bottom: 10px;">Bestätigung fehlgeschlagen</h1>
        <p style="color: #dc2626; margin-bottom: 20px;">${message}</p>
        <p style="color: #6b7280; margin-bottom: 30px;">
          Möglicherweise ist der Link abgelaufen oder bereits verwendet worden.
        </p>
        <a href="${Deno.env.get('PUBLIC_URL') || 'https://matbakh.app'}/vc" class="button">
          Neuen Sichtbarkeits-Check starten
        </a>
      </div>
    </body>
    </html>
  `
}