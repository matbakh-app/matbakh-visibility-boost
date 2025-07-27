import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { jsPDF } from 'npm:jspdf@2.5.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const leadId = url.searchParams.get('leadId');

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Generating PDF report for lead: ${leadId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Verify lead is confirmed
    if (!lead.double_optin_confirmed) {
      return new Response(JSON.stringify({ error: 'Lead not verified' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get analysis results (optional - PDF can be generated without them)
    const { data: analysisResults, error: analysisError } = await supabase
      .from('visibility_check_results')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Don't fail if no analysis results - create basic PDF
    if (analysisError) {
      console.warn('⚠️ Error fetching analysis results (continuing with basic PDF):', analysisError);
    }

    const analysis = analysisResults || null;
    const analysisData = analysis?.analysis_results || {};

    console.log(`📄 Generating PDF for business: ${lead.business_name}`);

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Sichtbarkeits-Report', 20, 30);
    
    doc.setFontSize(16);
    doc.text(`für ${lead.business_name}`, 20, 45);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 55);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 65, 190, 65);

    let yPosition = 80;

    // Business Info Section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Geschäftsinformationen', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Name: ${lead.business_name}`, 25, yPosition);
    yPosition += 8;
    if (lead.location) {
      doc.text(`Standort: ${lead.location}`, 25, yPosition);
      yPosition += 8;
    }
    doc.text(`E-Mail: ${lead.email}`, 25, yPosition);
    yPosition += 20;

    // Overall Score (if available)
    if (analysisData.overallScore !== undefined) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Gesamtbewertung', 20, yPosition);
      
      doc.setFontSize(24);
      const scoreColor = analysisData.overallScore >= 70 ? [0, 150, 0] : 
                        analysisData.overallScore >= 40 ? [255, 165, 0] : [220, 20, 60];
      doc.setTextColor(...scoreColor);
      doc.text(`${analysisData.overallScore}/100`, 20, yPosition + 15);
      
      yPosition += 35;
    } else {
      // Default message if no analysis available
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Analyse-Status', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('Ihre detaillierte Sichtbarkeitsanalyse wird noch durchgeführt.', 25, yPosition);
      yPosition += 8;
      doc.text('Sie erhalten eine aktualisierte Version sobald verfügbar.', 25, yPosition);
      yPosition += 20;
    }

    // Platform Analysis (if available)
    if (analysisData.platformAnalyses && Array.isArray(analysisData.platformAnalyses)) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Plattform-Analyse', 20, yPosition);
      yPosition += 15;

      analysisData.platformAnalyses.forEach((platform: any) => {
        if (yPosition > 250) { // Start new page if needed
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`${platform.platform}: ${platform.score}/100`, 25, yPosition);
        
        if (platform.insights && Array.isArray(platform.insights)) {
          platform.insights.slice(0, 2).forEach((insight: string, index: number) => {
            yPosition += 8;
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const maxWidth = 160;
            const lines = doc.splitTextToSize(`• ${insight}`, maxWidth);
            doc.text(lines, 30, yPosition);
            yPosition += lines.length * 4;
          });
        }
        yPosition += 10;
      });
    }

    // Quick Wins (if available)
    if (analysisData.quickWins && Array.isArray(analysisData.quickWins)) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Sofort umsetzbare Verbesserungen', 20, yPosition);
      yPosition += 15;

      analysisData.quickWins.slice(0, 5).forEach((win: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        const maxWidth = 160;
        const lines = doc.splitTextToSize(`• ${win}`, maxWidth);
        doc.text(lines, 25, yPosition);
        yPosition += lines.length * 6 + 3;
      });
    } else if (!analysisData.quickWins) {
      // Default content for basic PDF
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Nächste Schritte', 20, yPosition);
      yPosition += 15;

      const defaultTips = [
        'Vervollständigen Sie Ihr Google My Business Profil',
        'Fügen Sie aktuelle Fotos Ihres Unternehmens hinzu',
        'Sammeln Sie Kundenbewertungen',
        'Halten Sie Ihre Öffnungszeiten aktuell',
        'Nutzen Sie relevante Keywords in Ihrer Beschreibung'
      ];

      defaultTips.forEach((tip) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`• ${tip}`, 25, yPosition);
        yPosition += 12;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('matbakh.app - Ihr Partner für digitale Sichtbarkeit', 20, 285);
      doc.text(`Seite ${i} von ${pageCount}`, 170, 285);
    }

    // Generate PDF buffer
    const pdfBuffer = new Uint8Array(doc.output('arraybuffer'));

    // Upload to Storage
    const fileName = `${leadId}/report.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('visibility-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading PDF:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload PDF' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ PDF uploaded to storage:', uploadData.path);

    // Generate signed URL for download
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('visibility-reports')
      .createSignedUrl(fileName, 86400); // 24 hours

    if (signedUrlError) {
      console.error('❌ Error creating signed URL:', signedUrlError);
      return new Response(JSON.stringify({ error: 'Failed to create download link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update lead with report info
    await supabase
      .from('visibility_check_leads')
      .update({
        report_url: signedUrlData.signedUrl,
        report_generated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    // Log PDF generation
    await supabase
      .from('visibility_check_actions')
      .insert({
        lead_id: leadId,
        action_type: 'report_generated',
        details: { 
          file_path: uploadData.path,
          file_size: pdfBuffer.length
        }
      });

    console.log('✅ PDF report generated successfully');

    // For direct download requests, return the PDF
    if (req.headers.get('accept')?.includes('application/pdf')) {
      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="sichtbarkeits-report-${lead.business_name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`
        },
      });
    }

    // Return JSON response with download URL
    return new Response(JSON.stringify({
      success: true,
      message: 'PDF report generated',
      downloadUrl: signedUrlData.signedUrl,
      reportPath: uploadData.path
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in generate-pdf-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);