import { describe, it, expect, vi } from 'vitest';
import { createPdfReportAndSend, createSimplePdfReport } from '@/lib/pdfReport';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ 
        data: { downloadUrl: 'https://test-bucket.com/report_test-lead.pdf' }, 
        error: null 
      }))
    }
  }
}));

describe('PDF Report Generation', () => {
  describe('createPdfReportAndSend', () => {
    it('should successfully generate PDF report and return download URL', async () => {
      const leadId = 'test-lead-123';
      
      const result = await createPdfReportAndSend(leadId);
      
      expect(result).toBe('https://test-bucket.com/report_test-lead.pdf');
    });

    it('should handle PDF generation errors', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock error scenario
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: { message: 'PDF generation failed' }
      });

      const leadId = 'error-lead';
      
      await expect(createPdfReportAndSend(leadId)).rejects.toThrow('PDF generation failed');
    });

    it('should handle missing download URL', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock missing URL scenario
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { downloadUrl: null },
        error: null
      });

      const leadId = 'no-url-lead';
      
      await expect(createPdfReportAndSend(leadId)).rejects.toThrow('No download URL returned from PDF generation');
    });
  });

  describe('createSimplePdfReport', () => {
    it('should generate a simple PDF blob with lead data', async () => {
      const mockLeadData = {
        businessName: 'Test Restaurant',
        industry: 'hospitality',
        overallScore: 85,
        platformAnalyses: [
          { platform: 'google', score: 80 },
          { platform: 'facebook', score: 75 },
          { platform: 'instagram', score: 60 }
        ],
        todos: [
          {
            priority: 'high',
            text: 'Add more photos to Google My Business',
            why: 'Increases click-through rate'
          }
        ],
        quickWins: [
          'Upload 5 high-quality photos',
          'Respond to recent reviews'
        ]
      };

      const pdfBlob = await createSimplePdfReport(mockLeadData);
      
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('text/plain; charset=utf-8');
      
      // Read blob content to verify structure
      const text = await pdfBlob.text();
      expect(text).toContain('Test Restaurant');
      expect(text).toContain('hospitality');
      expect(text).toContain('85/100');
      expect(text).toContain('Add more photos');
      expect(text).toContain('matbakh.app');
    });

    it('should handle missing data gracefully', async () => {
      const emptyLeadData = {};

      const pdfBlob = await createSimplePdfReport(emptyLeadData);
      
      expect(pdfBlob).toBeInstanceOf(Blob);
      
      const text = await pdfBlob.text();
      expect(text).toContain('N/A'); // Should show fallback values
      expect(text).toContain('Keine To-Dos verfügbar');
      expect(text).toContain('matbakh.app');
    });
  });
});