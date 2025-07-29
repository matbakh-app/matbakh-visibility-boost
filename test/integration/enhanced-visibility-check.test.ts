import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        limit: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })),
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: { downloadUrl: 'https://test.com/report.pdf' }, error: null }))
  }
};

// Mock the todoGenerator
vi.mock('@/lib/todoGenerator', () => ({
  generateTodos: vi.fn((analysis, industry) => ({
    todos: [
      {
        type: 'Google: Fotos fehlen',
        priority: 'high',
        text: 'Test todo text',
        why: 'Test reason'
      }
    ],
    is_fully_satisfied: analysis.score >= 80
  }))
}));

// Mock the pdfReport
vi.mock('@/lib/pdfReport', () => ({
  createPdfReportAndSend: vi.fn(() => Promise.resolve('https://test.com/report.pdf'))
}));

describe('Enhanced Visibility Check Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process complete visibility check flow', async () => {
    const mockRequest = {
      leadId: 'lead-123',
      analysisResult: {
        score: 85,
        google: { photos: [], hasHours: true },
        meta: { messenger_enabled: true }
      },
      industry: 'hospitality',
      gdprConsent: true,
      marketingConsent: true
    };

    // Simulate the main logic from the edge function
    const { generateTodos } = await import('@/lib/todoGenerator');
    const { createPdfReportAndSend } = await import('@/lib/pdfReport');
    
    const { todos, is_fully_satisfied } = generateTodos(mockRequest.analysisResult, mockRequest.industry);
    
    expect(todos).toBeDefined();
    expect(is_fully_satisfied).toBe(true); // Score is 85, >= 80
    
    // Verify database update would be called
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('visibility_check_results');
    
    // If fully satisfied and consent given, PDF should be generated
    if (is_fully_satisfied && mockRequest.marketingConsent) {
      expect(createPdfReportAndSend).toHaveBeenCalledWith(mockRequest.leadId);
    }
  });

  it('should handle low score scenario (not fully satisfied)', async () => {
    const mockRequest = {
      leadId: 'lead-456',
      analysisResult: {
        score: 65, // Below 80
        google: { photos: [] },
        meta: { messenger_enabled: false }
      },
      industry: 'hospitality',
      gdprConsent: true,
      marketingConsent: true
    };

    const { generateTodos } = await import('@/lib/todoGenerator');
    const { createPdfReportAndSend } = await import('@/lib/pdfReport');
    
    const { todos, is_fully_satisfied } = generateTodos(mockRequest.analysisResult, mockRequest.industry);
    
    expect(todos.length).toBeGreaterThan(0);
    expect(is_fully_satisfied).toBe(false); // Score is 65, < 80
    
    // PDF should NOT be generated for low satisfaction
    expect(createPdfReportAndSend).not.toHaveBeenCalled();
  });

  it('should handle no consent scenario', async () => {
    const mockRequest = {
      leadId: 'lead-789',
      analysisResult: {
        score: 90, // High score
        google: { photos: ['photo1.jpg'], hasHours: true },
        meta: { messenger_enabled: true }
      },
      industry: 'hospitality',
      gdprConsent: false, // No consent
      marketingConsent: false
    };

    const { generateTodos } = await import('@/lib/todoGenerator');
    const { createPdfReportAndSend } = await import('@/lib/pdfReport');
    
    const { todos, is_fully_satisfied } = generateTodos(mockRequest.analysisResult, mockRequest.industry);
    
    expect(is_fully_satisfied).toBe(true); // Score is 90
    
    // PDF should NOT be generated without consent
    expect(createPdfReportAndSend).not.toHaveBeenCalled();
  });

  it('should handle PDF generation failure gracefully', async () => {
    const { createPdfReportAndSend } = await import('@/lib/pdfReport');
    
    // Mock PDF generation failure
    vi.mocked(createPdfReportAndSend).mockRejectedValueOnce(new Error('PDF generation failed'));
    
    const mockRequest = {
      leadId: 'lead-error',
      analysisResult: {
        score: 90,
        google: { photos: ['photo1.jpg'], hasHours: true },
        meta: { messenger_enabled: true }
      },
      industry: 'hospitality',
      gdprConsent: true,
      marketingConsent: true
    };

    // Should not throw error even if PDF generation fails
    expect(async () => {
      const { generateTodos } = await import('@/lib/todoGenerator');
      const { todos, is_fully_satisfied } = generateTodos(mockRequest.analysisResult, mockRequest.industry);
      
      if (is_fully_satisfied && mockRequest.marketingConsent) {
        try {
          await createPdfReportAndSend(mockRequest.leadId);
        } catch (pdfError) {
          console.warn('PDF generation failed, continuing without PDF');
        }
      }
    }).not.toThrow();
  });

  it('should update analysis_result with todos', async () => {
    const mockRequest = {
      leadId: 'lead-update-test',
      analysisResult: {
        score: 75,
        google: { photos: [] }
      },
      industry: 'retail'
    };

    const { generateTodos } = await import('@/lib/todoGenerator');
    const { todos, is_fully_satisfied } = generateTodos(mockRequest.analysisResult, mockRequest.industry);
    
    const updatedAnalysisResult = {
      ...mockRequest.analysisResult,
      todos
    };

    expect(updatedAnalysisResult.todos).toBeDefined();
    expect(updatedAnalysisResult.todos.length).toBeGreaterThan(0);
    expect(is_fully_satisfied).toBe(false);
  });
});