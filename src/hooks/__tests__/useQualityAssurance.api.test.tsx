/**
 * useQualityAssurance Hook Tests (API Mode)
 * Tests the hook when using API calls instead of direct orchestrator
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import useQualityAssurance from '../useQualityAssurance';

describe('useQualityAssurance (API mode)', () => {
  const mockQAResult = {
    timestamp: '2025-01-14T10:00:00Z',
    overallStatus: 'passed' as const,
    overallScore: 88,
    results: {
      codeReview: [
        {
          filePath: 'src/test.ts',
          overallScore: 88,
          suggestions: [
            {
              line: 15,
              severity: 'warning' as const,
              category: 'style' as const,
              message: 'Consider using const instead of let',
              confidence: 0.8,
            },
          ],
          summary: { totalIssues: 1, criticalIssues: 0, securityIssues: 0, performanceIssues: 0 },
          aiAnalysis: 'Code quality is good with minor improvements',
        },
      ],
    },
    summary: { totalIssues: 1, criticalIssues: 0, recommendations: ['Use const instead of let'] },
    reports: { markdown: '# QA Report\nMinor issues found', json: '{"status": "passed"}' },
  };

  const mockSecurityResult = {
    timestamp: '2025-01-14T10:00:00Z',
    totalVulnerabilities: 0,
    vulnerabilities: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0 },
    recommendations: [],
    passed: true,
  };

  const mockAccessibilityResult = [
    {
      url: 'http://localhost:3000',
      timestamp: '2025-01-14T10:00:00Z',
      violations: [],
      passes: 12,
      incomplete: 0,
      inapplicable: 1,
      wcagLevel: 'AA' as const,
      score: 95,
      summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      recommendations: [],
      passed: true,
    },
  ];

  const mockCodeReviewResult = [
    {
      filePath: 'src/component.tsx',
      overallScore: 92,
      suggestions: [],
      summary: { totalIssues: 0, criticalIssues: 0, securityIssues: 0, performanceIssues: 0 },
      aiAnalysis: 'Excellent code quality',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    
    // API URL for tests
    process.env.VITE_QA_API_URL = 'http://localhost:3001';
    
    // Mock fetch globally
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: mockQAResult }),
      status: 200,
      statusText: 'OK',
    } as any);
  });

  afterEach(() => {
    delete process.env.VITE_QA_API_URL;
    jest.restoreAllMocks();
  });

  describe('runFullAnalysis', () => {
    it('fetches results via API successfully', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['src/test.ts'], ['http://localhost:3000']);
        expect(analysisResult).toEqual(mockQAResult);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/qa/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: ['src/test.ts'],
            urls: ['http://localhost:3000'],
            config: undefined,
          }),
        })
      );

      expect(result.current.results?.overallScore).toBe(88);
      expect(result.current.qualityMetrics.score).toBe(88);
      expect(result.current.qualityMetrics.status).toBe('passed');
    });

    it('returns error when no files or URLs provided', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis([], []);
        expect(analysisResult).toBeNull();
      });

      expect(result.current.error).toMatch(/No files or URLs provided for analysis/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles API error responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['src/test.ts']);
        expect(analysisResult).toBeNull();
      });

      expect(result.current.error).toBe('QA API error: 500 Internal Server Error');
      expect(result.current.hasError).toBe(true);
    });

    it('handles API success=false responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'Analysis failed' }),
      } as any);

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['src/test.ts']);
        expect(analysisResult).toBeNull();
      });

      expect(result.current.error).toBe('Analysis failed');
    });

    it('handles network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['src/test.ts']);
        expect(analysisResult).toBeNull();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('handles missing API URL configuration', async () => {
      delete process.env.VITE_QA_API_URL;

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['src/test.ts']);
        expect(analysisResult).toBeNull();
      });

      expect(result.current.error).toMatch(/QA API URL not configured/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('runQuickScan', () => {
    it('calls quick scan API endpoint', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const scanResult = await result.current.runQuickScan(['src/component.tsx']);
        expect(scanResult).toEqual(mockQAResult);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/qa/quick-scan',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ files: ['src/component.tsx'] }),
        })
      );
    });
  });

  describe('runSecurityScan', () => {
    it('calls security scan API endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: mockSecurityResult }),
      } as any);

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const scanResult = await result.current.runSecurityScan(['src/auth.ts']);
        expect(scanResult).toEqual(mockSecurityResult);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/qa/security-scan',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ files: ['src/auth.ts'] }),
        })
      );
    });
  });

  describe('runAccessibilityTest', () => {
    it('calls accessibility test API endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: mockAccessibilityResult }),
      } as any);

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const testResult = await result.current.runAccessibilityTest(['http://localhost:3000']);
        expect(testResult).toEqual(mockAccessibilityResult);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/qa/accessibility-test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ urls: ['http://localhost:3000'] }),
        })
      );
    });

    it('returns error when no URLs provided', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const testResult = await result.current.runAccessibilityTest([]);
        expect(testResult).toBeNull();
      });

      expect(result.current.error).toMatch(/No URLs provided for accessibility test/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('runCodeReview', () => {
    it('calls code review API endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: mockCodeReviewResult }),
      } as any);

      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const reviewResult = await result.current.runCodeReview(['src/utils.ts']);
        expect(reviewResult).toEqual(mockCodeReviewResult);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/qa/code-review',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ files: ['src/utils.ts'] }),
        })
      );
    });

    it('returns error when no files provided', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      await act(async () => {
        const reviewResult = await result.current.runCodeReview([]);
        expect(reviewResult).toBeNull();
      });

      expect(result.current.error).toMatch(/No files provided for code review/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('sets isRunning to true during API calls', async () => {
      // Mock a slow API response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, result: mockQAResult }),
          }), 100)
        )
      );

      const { result } = renderHook(() => useQualityAssurance());
      
      act(() => {
        result.current.runFullAnalysis(['src/test.ts']);
      });

      // Should be running immediately
      expect(result.current.isRunning).toBe(true);

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('clears error state when starting new analysis', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      // First, cause an error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await act(async () => {
        await result.current.runFullAnalysis(['src/test.ts']);
      });

      expect(result.current.error).toBe('Network error');

      // Now make a successful call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: mockQAResult }),
      } as any);

      await act(async () => {
        await result.current.runFullAnalysis(['src/test.ts']);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.results).toEqual(mockQAResult);
    });
  });

  describe('utility functions', () => {
    it('clears results and error', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      // Set some state first
      await act(async () => {
        await result.current.runFullAnalysis(['src/test.ts']);
      });

      expect(result.current.results).not.toBeNull();

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('clears only error', async () => {
      const { result } = renderHook(() => useQualityAssurance());
      
      // Cause an error
      global.fetch = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await act(async () => {
        await result.current.runFullAnalysis(['src/test.ts']);
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});