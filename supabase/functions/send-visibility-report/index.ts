import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { DoubleOptInEmail } from './_templates/double-optin.tsx';
import { VisibilityReportEmail } from './_templates/visibility-report.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisibilityReportRequest {
  leadId: string;
  email: string;
  businessName: string;
  reportType?: 'double_optin' | 'full_report';
  verifyToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests for verification
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const verifyToken = url.searchParams.get('verify');
      const leadId = url.searchParams.get('leadId');

      if (verifyToken && leadId) {
        console.log(`✅ Processing verification for lead: ${leadId}`);

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verify token and update lead
        const { data: lead, error } = await supabase
          .from('visibility_check_leads')
          .select('*')
          .eq('id', leadId)
          .eq('verification_token', verifyToken)
          .single();

        if (error || !lead) {
          return new Response(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>❌ Ungültiger Verifizierungslink</h1>
                <p>Der Link ist entweder abgelaufen oder ungültig.</p>
                <a href="/" style="color: #007bff;">Zurück zur Startseite</a>
              </body>
            </html>
          `, { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
          });
        }

        // Mark as verified
        await supabase
          .from('visibility_check_leads')
          .update({ 
            double_optin_confirmed: true,
            double_optin_confirmed_at: new Date().toISOString(),
            verification_token: null
          })
          .eq('id', leadId);

        // Log verification
        await supabase
          .from('visibility_check_actions')
          .insert({
            lead_id: leadId,
            action_type: 'double_optin_confirmed',
            details: { verified_at: new Date().toISOString() }
          });

        // Trigger report email in background
        EdgeRuntime.waitUntil((async () => {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/send-visibility-report`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                leadId: lead.id,
                email: lead.email,
                businessName: lead.business_name,
                reportType: 'full_report'
              })
            });
          } catch (error) {
            console.error('Error sending report email:', error);
          }
        })());

        // Redirect to verification success page
        const publicBaseUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://matbakh.app';
        const redirectUrl = `${publicBaseUrl}/visibility-check/verified?leadId=${leadId}&status=success`;
        
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': redirectUrl
          }
        });
      }

      return new Response('Invalid request', { status: 400, headers: corsHeaders });
    } catch (error) {
      console.error('Error in GET handler:', error);
      return new Response('Server error', { status: 500, headers: corsHeaders });
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }

  try {
    console.log('📧 Starting visibility report email process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const body: VisibilityReportRequest = await req.json();
    const { leadId, email, businessName, reportType = 'double_optin', verifyToken } = body;

    console.log(`📧 Processing ${reportType} for lead: ${leadId}`);

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('❌ Error fetching lead:', leadError);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (reportType === 'double_optin') {
      // Generate verification token if not provided
      const token = verifyToken || crypto.randomUUID();
      
      // Save token to database
      await supabase
        .from('visibility_check_leads')
        .update({ 
          verification_token: token,
          double_optin_sent_at: new Date().toISOString()
        })
        .eq('id', leadId);

      // Generate Double Opt-In email
      const verifyUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/send-visibility-report?verify=${token}&leadId=${leadId}`;
      
      console.log(`📧 Generating Double Opt-In email for: ${email}`);
      
      const html = await renderAsync(
        React.createElement(DoubleOptInEmail, {
          businessName,
          verifyUrl,
          email
        })
      );

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: 'matbakh.app <noreply@matbakh.app>',
        to: [email],
        subject: `Bestätigen Sie Ihre E-Mail für den Sichtbarkeits-Check von ${businessName}`,
        html,
      });

      if (emailError) {
        console.error('❌ Error sending double opt-in email:', emailError);
        return new Response(JSON.stringify({ error: emailError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Double Opt-In email sent successfully:', emailResult);

      // Log the action
      await supabase
        .from('visibility_check_actions')
        .insert({
          lead_id: leadId,
          action_type: 'double_optin_sent',
          details: { email, email_id: emailResult?.id }
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Double Opt-In email sent',
        emailId: emailResult?.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (reportType === 'full_report') {
      // Get analysis results
      const { data: analysisResults, error: analysisError } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (analysisError || !analysisResults?.length) {
        console.error('❌ Error fetching analysis results:', analysisError);
        return new Response(JSON.stringify({ error: 'Analysis results not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const analysisData = analysisResults[0];
      
      console.log(`📧 Generating full report email for: ${email}`);

      const html = await renderAsync(
        React.createElement(VisibilityReportEmail, {
          businessName,
          email,
          analysisData: analysisData.analysis_results,
          reportUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/generate-pdf-report?leadId=${leadId}`
        })
      );

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: 'matbakh.app <noreply@matbakh.app>',
        to: [email],
        subject: `Ihr Sichtbarkeits-Report für ${businessName} ist fertig!`,
        html,
      });

      if (emailError) {
        console.error('❌ Error sending report email:', emailError);
        return new Response(JSON.stringify({ error: emailError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Full report email sent successfully:', emailResult);

      // Update lead status
      await supabase
        .from('visibility_check_leads')
        .update({ 
          report_sent_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', leadId);

      // Log the action
      await supabase
        .from('visibility_check_actions')
        .insert({
          lead_id: leadId,
          action_type: 'report_sent',
          details: { email, email_id: emailResult?.id }
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Report email sent',
        emailId: emailResult?.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in send-visibility-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);