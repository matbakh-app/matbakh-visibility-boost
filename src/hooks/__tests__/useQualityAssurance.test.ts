/**
 * useQualityAssurance Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import useQualityAssurance from '../useQualityAssurance';
import { qaOrchestrator } from '../../lib/quality-assurance';

// Mock the QA orchestrator
jest.mock('../../lib/quality-assurance', () => ({
  qaOrchestrator: {
    runFullQAAnalysis: jest.fn(),
    runQuickScan: jest.fn(),
    runSecurityOnlyScan: jest.fn(),
    runAccessibilityOnlyScan: jest.fn(),
    runCodeReviewOnly: jest.fn(),
  },
}));

const mockQAOrchestrator = qaOrchestrator as jest.Mocked<typeof qaOrchestrator>;

describe('useQualityAssurance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQAResult = {
    timestamp: '2025-01-14T10:00:00Z',
    overallStatus: 'passed' as const,
    overallScore: 85,
    results: {
      codeReview: [
        {
          filePath: 'test.ts',
          overallScore: 85,
          suggestions: [],
          summary: { totalIssues: 0, criticalIssues: 0, securityIssues: 0, performanceIssues: 0 },
          aiAnalysis: 'Good code quality',
        },
      ],
    },
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      recommendations: [],
    },
    reports: {
      markdown: '# QA Report\nAll good!',
      json: '{"status": "passed"}',
    },
  };

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useQualityAssurance());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.results).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.lastRun).toBe(null);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.qualityMetrics.score).toBe(0);
      expect(result.current.qualityMetrics.status).toBe('unknown');
    });

    it('should not auto-run when autoRun is false', () => {
      renderHook(() => useQualityAssurance({
        autoRun: false,
        files: ['test.ts'],
      }));

      expect(mockQAOrchestrator.runFullQAAnalysis).not.toHaveBeenCalled();
    });

    it('should auto-run when autoRun is true and files are provided', async () => {
      mockQAOrchestrator.runFullQAAnalysis.mockResolvedValue(mockQAResult);

      renderHook(() => useQualityAssurance({
        autoRun: true,
        files: ['test.ts'],
      }));

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockQAOrchestrator.runFullQAAnalysis).toHaveBeenCalledWith(
        ['test.ts'],
        [],
        undefined
      );
    });
  });

  describe('runFullAnalysis', () => {
    it('should run full analysis successfully', async () => {
      mockQAOrchestrator.runFullQAAnalysis.mockResolvedValue(mockQAResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['test.ts'], ['http://example.com']);
        expect(analysisResult).toEqual(mockQAResult);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.results).toEqual(mockQAResult);
      expect(result.current.error).toBe(null);
      expect(result.current.hasResults).toBe(true);
      expect(result.current.qualityMetrics.score).toBe(85);
      expect(result.current.qualityMetrics.status).toBe('passed');
    });

    it('should handle analysis failure', async () => {
      const error = new Error('Analysis failed');
      mockQAOrchestrator.runFullQAAnalysis.mockRejectedValue(error);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis(['test.ts']);
        expect(analysisResult).toBe(null);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.results).toBe(null);
      expect(result.current.error).toBe('Analysis failed');
      expect(result.current.hasError).toBe(true);
    });

    it('should return error when no files or URLs provided', async () => {
      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const analysisResult = await result.current.runFullAnalysis([], []);
        expect(analysisResult).toBe(null);
      });

      expect(result.current.error).toBe('No files or URLs provided for analysis');
      expect(mockQAOrchestrator.runFullQAAnalysis).not.toHaveBeenCalled();
    });

    it('should use default files and URLs from options', async () => {
      mockQAOrchestrator.runFullQAAnalysis.mockResolvedValue(mockQAResult);

      const { result } = renderHook(() => useQualityAssurance({
        files: ['default.ts'],
        urls: ['http://default.com'],
      }));

      await act(async () => {
        await result.current.runFullAnalysis();
      });

      expect(mockQAOrchestrator.runFullQAAnalysis).toHaveBeenCalledWith(
        ['default.ts'],
        ['http://default.com'],
        undefined
      );
    });
  });

  describe('runQuickScan', () => {
    it('should run quick scan successfully', async () => {
      mockQAOrchestrator.runQuickScan.mockResolvedValue(mockQAResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const scanResult = await result.current.runQuickScan(['test.ts']);
        expect(scanResult).toEqual(mockQAResult);
      });

      expect(mockQAOrchestrator.runQuickScan).toHaveBeenCalledWith(['test.ts']);
      expect(result.current.results).toEqual(mockQAResult);
    });

    it('should handle quick scan failure', async () => {
      const error = new Error('Quick scan failed');
      mockQAOrchestrator.runQuickScan.mockRejectedValue(error);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const scanResult = await result.current.runQuickScan(['test.ts']);
        expect(scanResult).toBe(null);
      });

      expect(result.current.error).toBe('Quick scan failed');
    });
  });

  describe('runSecurityScan', () => {
    it('should run security scan successfully', async () => {
      const securityResult = {
        timestamp: '2025-01-14T10:00:00Z',
        totalVulnerabilities: 0,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
        recommendations: [],
        passed: true,
      };

      mockQAOrchestrator.runSecurityOnlyScan.mockResolvedValue(securityResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const scanResult = await result.current.runSecurityScan(['test.ts']);
        expect(scanResult).toEqual(securityResult);
      });

      expect(mockQAOrchestrator.runSecurityOnlyScan).toHaveBeenCalledWith(['test.ts']);
    });
  });

  describe('runAccessibilityTest', () => {
    it('should run accessibility test successfully', async () => {
      const accessibilityResult = [
        {
          url: 'http://example.com',
          timestamp: '2025-01-14T10:00:00Z',
          violations: [],
          passes: 10,
          incomplete: 0,
          inapplicable: 0,
          wcagLevel: 'AA' as const,
          score: 95,
          summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          recommendations: [],
          passed: true,
        },
      ];

      mockQAOrchestrator.runAccessibilityOnlyScan.mockResolvedValue(accessibilityResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const testResult = await result.current.runAccessibilityTest(['http://example.com']);
        expect(testResult).toEqual(accessibilityResult);
      });

      expect(mockQAOrchestrator.runAccessibilityOnlyScan).toHaveBeenCalledWith(['http://example.com']);
    });

    it('should return error when no URLs provided', async () => {
      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const testResult = await result.current.runAccessibilityTest([]);
        expect(testResult).toBe(null);
      });

      expect(result.current.error).toBe('No URLs provided for accessibility test');
      expect(mockQAOrchestrator.runAccessibilityOnlyScan).not.toHaveBeenCalled();
    });
  });

  describe('runCodeReview', () => {
    it('should run code review successfully', async () => {
      const codeReviewResult = [
        {
          filePath: 'test.ts',
          overallScore: 85,
          suggestions: [],
          summary: { totalIssues: 0, criticalIssues: 0, securityIssues: 0, performanceIssues: 0 },
          aiAnalysis: 'Good code quality',
        },
      ];

      mockQAOrchestrator.runCodeReviewOnly.mockResolvedValue(codeReviewResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        const reviewResult = await result.current.runCodeReview(['test.ts']);
        expect(reviewResult).toEqual(codeReviewResult);
      });

      expect(mockQAOrchestrator.runCodeReviewOnly).toHaveBeenCalledWith(['test.ts']);
    });
  });

  describe('utility functions', () => {
    it('should clear results', () => {
      const { result } = renderHook(() => useQualityAssurance());

      // Set some initial state
      act(() => {
        result.current.runFullAnalysis(['test.ts']);
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should clear error', async () => {
      mockQAOrchestrator.runFullQAAnalysis.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        await result.current.runFullAnalysis(['test.ts']);
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should calculate quality metrics correctly', async () => {
      const failedResult = {
        ...mockQAResult,
        overallStatus: 'failed' as const,
        overallScore: 45,
        summary: {
          totalIssues: 10,
          criticalIssues: 3,
          recommendations: ['Fix critical issues'],
        },
      };

      mockQAOrchestrator.runFullQAAnalysis.mockResolvedValue(failedResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        await result.current.runFullAnalysis(['test.ts']);
      });

      expect(result.current.qualityMetrics).toEqual({
        score: 45,
        status: 'failed',
        totalIssues: 10,
        criticalIssues: 3,
        passed: false,
        hasWarnings: false,
        failed: true,
      });
    });

    it('should handle download report', async () => {
      // Mock DOM methods
      const mockCreateElement = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockClick = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = jest.fn();

      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      mockCreateElement.mockReturnValue(mockAnchor);

      Object.defineProperty(document, 'createElement', { value: mockCreateElement });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

      mockQAOrchestrator.runFullQAAnalysis.mockResolvedValue(mockQAResult);

      const { result } = renderHook(() => useQualityAssurance());

      await act(async () => {
        await result.current.runFullAnalysis(['test.ts']);
      });

      act(() => {
        result.current.downloadReport('markdown');
      });

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });
});