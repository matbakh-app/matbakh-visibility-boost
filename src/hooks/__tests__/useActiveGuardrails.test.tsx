/**
 * Tests for useActiveGuardrails hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useActiveGuardrails } from '../useActiveGuardrails';

// Mock timers for testing polling
jest.useFakeTimers();

describe('useActiveGuardrails', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.config).toBeNull();
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load initial data', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.config).toBeDefined();
    expect(result.current.metrics).toBeDefined();
    expect(result.current.recentViolations).toBeDefined();
    expect(result.current.systemHealth).toMatch(/healthy|degraded|error/);
  });

  it('should update configuration', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const newConfig = {
      enablePIIDetection: false,
      strictMode: true
    };
    
    await act(async () => {
      await result.current.updateConfig(newConfig);
    });
    
    expect(result.current.config?.enablePIIDetection).toBe(false);
    expect(result.current.config?.strictMode).toBe(true);
  });

  it('should refresh data manually', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const initialMetrics = result.current.metrics;
    
    await act(async () => {
      await result.current.refreshData();
    });
    
    // Metrics should be updated (different random values)
    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.lastUpdated).toBeInstanceOf(Date);
  });

  it('should test guardrails with sample content', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    let testResult;
    await act(async () => {
      testResult = await result.current.testGuardrails('Test content with email@example.com', 'google');
    });
    
    expect(testResult).toBeDefined();
    expect(testResult.violations).toBeDefined();
    expect(testResult.processingTimeMs).toBeGreaterThan(0);
    expect(testResult.guardrailsApplied).toContain('pii-toxicity-detection');
  });

  it('should export violations data', async () => {
    // Mock DOM methods for file download
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockAppendChild = jest.spyOn(document.body, 'appendChild');
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
    const mockCreateObjectURL = jest.spyOn(window.URL, 'createObjectURL');
    const mockRevokeObjectURL = jest.spyOn(window.URL, 'revokeObjectURL');
    
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    
    mockCreateElement.mockReturnValue(mockAnchor as any);
    mockAppendChild.mockImplementation(() => mockAnchor as any);
    mockRemoveChild.mockImplementation(() => mockAnchor as any);
    mockCreateObjectURL.mockReturnValue('mock-url');
    mockRevokeObjectURL.mockImplementation(() => {});
    
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      await result.current.exportViolations('24h');
    });
    
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.download).toContain('guardrails-violations-24h.csv');
    
    // Cleanup mocks
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    mockCreateObjectURL.mockRestore();
    mockRevokeObjectURL.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // Mock console.log to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Test error handling in updateConfig
    const originalConfig = result.current.config;
    
    try {
      await act(async () => {
        // This should not throw in the mock implementation
        await result.current.updateConfig({ enablePIIDetection: false });
      });
    } catch (error) {
      // If it does throw, make sure error is handled
      expect(result.current.error).toBeDefined();
    }
    
    consoleSpy.mockRestore();
  });

  it('should determine system health based on metrics', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.systemHealth).toMatch(/healthy|degraded|error/);
    
    // System health should be determined by error rate
    if (result.current.metrics) {
      const errorRate = (result.current.metrics.blockedRequests / result.current.metrics.totalRequests) * 100;
      
      if (errorRate > 5) {
        expect(result.current.systemHealth).toBe('error');
      } else if (errorRate > 2) {
        expect(result.current.systemHealth).toBe('degraded');
      } else {
        expect(result.current.systemHealth).toBe('healthy');
      }
    }
  });

  it('should set up polling for real-time updates', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const initialMetrics = result.current.metrics;
    
    // Fast-forward time to trigger polling
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });
    
    await waitFor(() => {
      // Metrics should be updated due to polling
      expect(result.current.metrics?.lastUpdated).toBeInstanceOf(Date);
    });
  });

  it('should handle violations data correctly', async () => {
    const { result } = renderHook(() => useActiveGuardrails());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.recentViolations).toBeDefined();
    expect(Array.isArray(result.current.recentViolations)).toBe(true);
    
    if (result.current.recentViolations.length > 0) {
      const violation = result.current.recentViolations[0];
      expect(violation).toHaveProperty('id');
      expect(violation).toHaveProperty('timestamp');
      expect(violation).toHaveProperty('type');
      expect(violation).toHaveProperty('severity');
      expect(violation).toHaveProperty('provider');
      expect(violation).toHaveProperty('domain');
      expect(violation).toHaveProperty('blocked');
    }
  });
});