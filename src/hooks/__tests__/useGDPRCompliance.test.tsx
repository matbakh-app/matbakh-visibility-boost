/**
 * GDPR Compliance Hook Tests
 * 
 * Test suite for the useGDPRCompliance React hook.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { GDPRComplianceValidator } from '../../lib/compliance/gdpr-compliance-validator';
import { useGDPRCompliance } from '../useGDPRCompliance';

// Mock the GDPRComplianceValidator
jest.mock('../../lib/compliance/gdpr-compliance-validator');

const mockValidator = {
  validateCompliance: jest.fn(),
  generateComplianceReport: jest.fn(),
  exportComplianceData: jest.fn()
};

const mockReport = {
  timestamp: new Date(),
  overallStatus: 'compliant' as const,
  totalChecks: 15,
  compliantChecks: 15,
  nonCompliantChecks: 0,
  partialChecks: 0,
  notApplicableChecks: 0,
  complianceScore: 100,
  checks: [],
  summary: {
    data_processing: { total: 3, compliant: 3, score: 100, criticalIssues: [] },
    data_storage: { total: 3, compliant: 3, score: 100, criticalIssues: [] },
    user_rights: { total: 4, compliant: 4, score: 100, criticalIssues: [] },
    consent: { total: 2, compliant: 2, score: 100, criticalIssues: [] },
    security: { total: 3, compliant: 3, score: 100, criticalIssues: [] },
    ai_operations: { total: 3, compliant: 3, score: 100, criticalIssues: [] }
  },
  recommendations: ['Keep privacy policy up to date']
};

describe('useGDPRCompliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (GDPRComplianceValidator as jest.Mock).mockImplementation(() => mockValidator);
    mockValidator.validateCompliance.mockResolvedValue(mockReport);
    mockValidator.generateComplianceReport.mockResolvedValue('# GDPR Report');
    mockValidator.exportComplianceData.mockResolvedValue({ compliance: mockReport });
    
    // Mock DOM methods
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: jest.fn(),
    })) as any;
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useGDPRCompliance());

      expect(result.current.loading).toBe(true);
      expect(result.current.report).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should load compliance report on mount', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(1);
      expect(result.current.report).toEqual(mockReport);
      expect(result.current.error).toBe(null);
    });
  });

  describe('compliance data', () => {
    it('should provide derived compliance values', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isCompliant).toBe(true);
      expect(result.current.complianceScore).toBe(100);
      expect(result.current.criticalIssues).toEqual([]);
    });

    it('should handle non-compliant status', async () => {
      const nonCompliantReport = {
        ...mockReport,
        overallStatus: 'non_compliant' as const,
        complianceScore: 75,
        summary: {
          ...mockReport.summary,
          security: { total: 3, compliant: 2, score: 67, criticalIssues: ['Encryption issue'] }
        }
      };

      mockValidator.validateCompliance.mockResolvedValue(nonCompliantReport);

      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isCompliant).toBe(false);
      expect(result.current.complianceScore).toBe(75);
      expect(result.current.criticalIssues).toContain('Encryption issue');
    });
  });

  describe('refreshCompliance', () => {
    it('should refresh compliance data', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refreshCompliance();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Validation failed');
      mockValidator.validateCompliance.mockRejectedValueOnce(error);

      await act(async () => {
        await result.current.refreshCompliance();
      });

      expect(result.current.error).toBe('Validation failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('downloadReport', () => {
    it('should download compliance report', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.downloadReport();
      });

      expect(mockValidator.generateComplianceReport).toHaveBeenCalledTimes(1);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle download errors', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockValidator.generateComplianceReport.mockRejectedValueOnce(new Error('Download failed'));

      await expect(result.current.downloadReport()).rejects.toThrow('Failed to download GDPR compliance report');
      expect(result.current.error).toBe('Failed to download GDPR compliance report');
    });
  });

  describe('exportData', () => {
    it('should export compliance data', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportData();
      });

      expect(mockValidator.exportComplianceData).toHaveBeenCalledTimes(1);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle export errors', async () => {
      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockValidator.exportComplianceData.mockRejectedValueOnce(new Error('Export failed'));

      await expect(result.current.exportData()).rejects.toThrow('Failed to export GDPR compliance data');
      expect(result.current.error).toBe('Failed to export GDPR compliance data');
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh when enabled', async () => {
      const { result } = renderHook(() => 
        useGDPRCompliance({ autoRefresh: true, refreshInterval: 1000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useGDPRCompliance({ autoRefresh: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(1);

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should still be called only once
      expect(mockValidator.validateCompliance).toHaveBeenCalledTimes(1);
    });
  });

  describe('onComplianceChange callback', () => {
    it('should call onComplianceChange when report updates', async () => {
      const onComplianceChange = jest.fn();
      
      const { result } = renderHook(() => 
        useGDPRCompliance({ onComplianceChange })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(onComplianceChange).toHaveBeenCalledWith(mockReport);
    });

    it('should call onComplianceChange on refresh', async () => {
      const onComplianceChange = jest.fn();
      
      const { result } = renderHook(() => 
        useGDPRCompliance({ onComplianceChange })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      onComplianceChange.mockClear();

      await act(async () => {
        await result.current.refreshCompliance();
      });

      expect(onComplianceChange).toHaveBeenCalledWith(mockReport);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const error = new Error('Network error');
      mockValidator.validateCompliance.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.report).toBe(null);
    });

    it('should handle unknown errors', async () => {
      mockValidator.validateCompliance.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useGDPRCompliance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to validate GDPR compliance');
    });
  });
});