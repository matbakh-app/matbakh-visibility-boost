import { supabase } from '@/integrations/supabase/client';

export async function createPdfReportAndSend(leadId: string): Promise<string> {
  try {
    console.log('🚀 Starting PDF report generation for lead:', leadId);

    // Call the PDF generation edge function
    const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
      body: { leadId }
    });

    if (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }

    if (!data?.downloadUrl) {
      throw new Error('No download URL returned from PDF generation');
    }

    console.log('✅ PDF report generated successfully:', data.downloadUrl);
    return data.downloadUrl;

  } catch (error) {
    console.error('❌ PDF report creation failed:', error);
    throw error;
  }
}

// Helper function to create a simple PDF report stub (for testing)
export async function createSimplePdfReport(leadData: any): Promise<Blob> {
  // This is a stub implementation for testing purposes
  // In production, this would generate a proper PDF with charts, analysis, etc.
  
  const reportContent = `
Sichtbarkeits-Check Report
========================

Unternehmen: ${leadData.businessName || 'N/A'}
Branche: ${leadData.industry || 'hospitality'}
Datum: ${new Date().toLocaleDateString('de-DE')}

Gesamt-Score: ${leadData.overallScore || 0}/100

Zusammenfassung:
- Google My Business: ${leadData.platformAnalyses?.find((p: any) => p.platform === 'google')?.score || 0}%
- Facebook: ${leadData.platformAnalyses?.find((p: any) => p.platform === 'facebook')?.score || 0}%
- Instagram: ${leadData.platformAnalyses?.find((p: any) => p.platform === 'instagram')?.score || 0}%

To-Dos:
${leadData.todos?.map((todo: any, index: number) => 
  `${index + 1}. [${todo.priority.toUpperCase()}] ${todo.text} (${todo.why})`
).join('\n') || 'Keine To-Dos verfügbar'}

Empfehlungen:
${leadData.quickWins?.map((win: string, index: number) => 
  `${index + 1}. ${win}`
).join('\n') || 'Keine Empfehlungen verfügbar'}

---
Generiert durch matbakh.app
  `;

  // Create a simple text blob (in production, use PDFKit or Puppeteer)
  return new Blob([reportContent], { type: 'text/plain; charset=utf-8' });
}