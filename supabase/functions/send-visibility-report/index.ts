import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisibilityReportRequest {
  leadId: string;
  email: string;
  businessName: string;
  reportType?: 'basic' | 'detailed';
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Visibility report email function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { leadId, email, businessName, reportType = 'basic' }: VisibilityReportRequest = await req.json();

    console.log("Sending visibility report for:", businessName, "to:", email);

    // Get lead data from database
    const { data: leadData, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      console.error('Lead not found:', leadError);
      return new Response(
        JSON.stringify({ error: "Lead nicht gefunden" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get analysis results
    const { data: resultsData, error: resultsError } = await supabase
      .from('visibility_check_results')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultsError) {
      console.error('Results not found:', resultsError);
      return new Response(
        JSON.stringify({ error: "Analyseergebnisse nicht gefunden" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate report link (for detailed reports)
    const reportLink = `https://matbakh.app/visibility-report/${leadId}`;
    
    // Create email content based on report type
    let emailHtml = '';
    let emailSubject = '';

    if (reportType === 'detailed') {
      emailSubject = `Ihr detaillierter Sichtbarkeits-Report für ${businessName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Ihr detaillierter Sichtbarkeits-Report
          </h1>
          
          <p>Hallo,</p>
          
          <p>vielen Dank für Ihr Interesse an unserem Sichtbarkeits-Check für <strong>${businessName}</strong>.</p>
          
          <p>Ihr detaillierter Report ist bereit und kann unter folgendem Link abgerufen werden:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <a href="${reportLink}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              📊 Detaillierten Report jetzt ansehen
            </a>
          </div>
          
          <p><strong>Was Sie in Ihrem Report finden:</strong></p>
          <ul>
            <li>✅ Vollständige Analyse Ihrer Online-Präsenz</li>
            <li>📈 Detaillierte Bewertung aller Plattformen</li>
            <li>🎯 Konkrete Handlungsempfehlungen</li>
            <li>📊 Vergleich mit Wettbewerbern</li>
            <li>🚀 Schritt-für-Schritt Verbesserungsplan</li>
          </ul>
          
          <p>Falls Sie Fragen haben oder Unterstützung bei der Umsetzung benötigen, 
             stehen wir Ihnen gerne zur Verfügung.</p>
          
          <p>Mit freundlichen Grüßen,<br>
          Das matbakh.app Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            BaSSco (Bavarian Software Solution), München<br>
            E-Mail: mail(at)matbakh(dot)app
          </p>
        </div>
      `;
    } else {
      // Basic double opt-in confirmation
      emailSubject = `Bestätigen Sie Ihre E-Mail-Adresse - Sichtbarkeits-Check für ${businessName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            E-Mail-Adresse bestätigen
          </h1>
          
          <p>Hallo,</p>
          
          <p>vielen Dank für Ihr Interesse an unserem kostenlosen Sichtbarkeits-Check für <strong>${businessName}</strong>.</p>
          
          <p>Um Ihnen die Ergebnisse zusenden zu können, bestätigen Sie bitte Ihre E-Mail-Adresse:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <a href="${reportLink}?confirm=true" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              ✅ E-Mail-Adresse bestätigen
            </a>
          </div>
          
          <p><strong>Nach der Bestätigung erhalten Sie:</strong></p>
          <ul>
            <li>📊 Ihre persönlichen Analyseergebnisse</li>
            <li>🎯 Konkrete Verbesserungsvorschläge</li>
            <li>📈 Vergleich mit Branchendurchschnitt</li>
            <li>🚀 Kostenlose Erstberatung (optional)</li>
          </ul>
          
          <p><strong>100% kostenlos • DSGVO-konform • Keine Verpflichtungen</strong></p>
          
          <p>Falls Sie diese E-Mail nicht angefordert haben, können Sie sie einfach ignorieren.</p>
          
          <p>Mit freundlichen Grüßen,<br>
          Das matbakh.app Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            BaSSco (Bavarian Software Solution), München<br>
            E-Mail: mail(at)matbakh(dot)app
          </p>
        </div>
      `;
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "matbakh.app Sichtbarkeits-Check <mail@matbakh.app>",
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Visibility report email sent:", emailResponse);

    // Log the email sending activity
    await supabase
      .from('visibility_check_actions')
      .insert({
        lead_id: leadId,
        action_type: reportType === 'detailed' ? 'detailed_report_sent' : 'double_optin_sent',
        platform: 'email',
        details: {
          email_id: emailResponse.data?.id,
          email: email,
          business_name: businessName,
          report_type: reportType
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-Mail erfolgreich versendet",
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-visibility-report function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Fehler beim Versenden der E-Mail", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);