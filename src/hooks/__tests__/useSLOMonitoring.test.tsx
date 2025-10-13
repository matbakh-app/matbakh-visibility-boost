/**
 * Tests for useSLOMonitoring hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';

// Mock the SLO monitoring service - must be defined before the module mock
const mockSLOMonitoringService = {
  getSLODefinitions: jest.fn(() => [
    {
      id: 'test-slo-1',
      name: 'Test SLO 1',
      description: 'First test SLO',
      category: 'performance',
      metric: 'test_metric_1',
      target: 100,
      unit: 'ms',
      operator: 'lte',
      errorBudget: 5,
      alertThresholds: { warning: 120, critical: 150 },
      burnRateThresholds: {
        warning: { short: 3, long: 1.5 },
        critical: { short: 6, long: 3 }
      },
      enabled: true,
      tags: ['test']
    }
  ]),
  getSLOStatuses: jest.fn(() => [
    {
      sloId: 'test-slo-1',
      currentValue: 95,
      targetValue: 100,
      compliance: 98.5,
      status: 'healthy',
      errorBudgetRemaining: 85,
      burnRate: { short: 0.5, long: 0.3 },
      trend: 'stable',
      violationCount24h: 0,
      uptime: 99.9,
      timestamp: new Date()
    }
  ]),
  getActiveAlerts: jest.fn(() => []),
  getAllAlerts: jest.fn(() => [
    {
      id: 'alert-1',
      sloId: 'test-slo-1',
      type: 'violation',
      severity: 'warning',
      title: 'Test Alert',
      description: 'Test alert description',
      currentValue: 125,
      threshold: 120,
      timestamp: new Date(),
      resolved: false,
      metadata: {}
    }
  ]),
  getSystemHealthSummary: jest.fn(() => ({
    overall: 'healthy',
    sloCompliance: 98.5,
    activeAlerts: 0,
    criticalAlerts: 0,
    services: [
      { name: 'Test Service', status: 'up', uptime: 99.9 }
    ]
  })),
  resolveAlert: jest.fn(() => true),
  generateReport: jest.fn(() => ({
    period: { start: new Date(), end: new Date() },
    summary: {
      totalSLOs: 1,
      healthySLOs: 1,
      warningSLOs: 0,
      criticalSLOs: 0,
      overallCompliance: 98.5,
      averageErrorBudgetRemaining: 85
    },
    sloStatuses: [],
    alerts: [],
    trends: {
      complianceHistory: [],
      categoryBreakdown: { performance: 1 },
      topViolators: []
    }
  })),
  getSLOStatus: jest.fn((id: string) => 
    id === 'test-slo-1' ? {
      sloId: 'test-slo-1',
      currentValue: 95,
      targetValue: 100,
      compliance: 98.5,
      status: 'healthy',
      errorBudgetRemaining: 85,
      burnRate: { short: 0.5, long: 0.3 },
      trend: 'stable',
      violationCount24h: 0,
      uptime: 99.9,
      timestamp: new Date()
    } : undefined
  ),
  getSLODefinition: jest.fn((id: string) => 
    id === 'test-slo-1' ? {
      id: 'test-slo-1',
      name: 'Test SLO 1',
      description: 'First test SLO',
      category: 'performance',
      metric: 'test_metric_1',
      target: 100,
      unit: 'ms',
      operator: 'lte',
      errorBudget: 5,
      alertThresholds: { warning: 120, critical: 150 },
      burnRateThresholds: {
        warning: { short: 3, long: 1.5 },
        critical: { short: 6, long: 3 }
      },
      enabled: true,
      tags: ['test']
    } : undefined
  ),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('@/lib/monitoring/slo-monitoring-service', () => ({
  sloMonitoringService: mockSLOMonitoringService
}));

// Import hooks after mocking
import { useSLO, useSLOAlerts, useSLOMonitoring, useSystemHealth } from '../useSLOMonitoring';

describe('useSLOMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load SLO monitoring data on mount', async () => {
    const { result } = renderHook(() => useSLOMonitoring());

    // Wait for data to load (loading state might be very brief with synchronous mocks)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sloDefinitions).toHaveLength(1);
    expect(result.current.sloStatuses).toHaveLength(1);
    expect(result.current.systemHealth.overall).toBe('healthy');
    expect(result.current.error).toBeNull();
  });

  it('should handle refresh data', async () => {
    const { result } = renderHook(() => useSLOMonitoring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshData();
    });

    expect(mockSLOMonitoringService.getSLODefinitions).toHaveBeenCalledTimes(2);
    expect(mockSLOMonitoringService.getSLOStatuses).toHaveBeenCalledTimes(2);
  });

  it('should resolve alerts', async () => {
    const { result } = renderHook(() => useSLOMonitoring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const resolved = result.current.resolveAlert('alert-1');
      expect(resolved).toBe(true);
    });

    expect(mockSLOMonitoringService.resolveAlert).toHaveBeenCalledWith('alert-1');
  });

  it('should generate reports', async () => {
    const { result } = renderHook(() => useSLOMonitoring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const report = result.current.generateReport();
      expect(report).toBeDefined();
      expect(report.summary.totalSLOs).toBe(1);
    });

    expect(mockSLOMonitoringService.generateReport).toHaveBeenCalled();
  });

  it('should get SLO status and definition by ID', async () => {
    const { result } = renderHook(() => useSLOMonitoring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const status = result.current.getSLOStatus('test-slo-1');
      const definition = result.current.getSLODefinition('test-slo-1');

      expect(status).toBeDefined();
      expect(status?.sloId).toBe('test-slo-1');
      expect(definition).toBeDefined();
      expect(definition?.id).toBe('test-slo-1');
    });
  });

  it('should handle auto-refresh when enabled', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => 
      useSLOMonitoring({ autoRefresh: true, refreshInterval: 1000 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fast-forward time to trigger refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockSLOMonitoringService.getSLODefinitions).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should not auto-refresh when disabled', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => 
      useSLOMonitoring({ autoRefresh: false })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should only have been called once (initial load)
    expect(mockSLOMonitoringService.getSLODefinitions).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});

describe('useSLO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return specific SLO data', async () => {
    const { result } = renderHook(() => useSLO('test-slo-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sloStatus).toBeDefined();
    expect(result.current.sloDefinition).toBeDefined();
    expect(result.current.exists).toBe(true);
  });

  it('should handle non-existent SLO', async () => {
    const { result } = renderHook(() => useSLO('non-existent-slo'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true); // Still loading because SLO doesn't exist
    });

    expect(result.current.sloStatus).toBeUndefined();
    expect(result.current.sloDefinition).toBeUndefined();
    expect(result.current.exists).toBe(false);
  });
});

describe('useSLOAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered alerts', async () => {
    const { result } = renderHook(() => useSLOAlerts({ severity: 'warning' }));

    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
    });

    expect(result.current.alerts[0].severity).toBe('warning');
    expect(result.current.warningCount).toBe(1);
    expect(result.current.criticalCount).toBe(0);
  });

  it('should filter by SLO ID', async () => {
    const { result } = renderHook(() => useSLOAlerts({ sloId: 'test-slo-1' }));

    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
    });

    expect(result.current.alerts[0].sloId).toBe('test-slo-1');
  });

  it('should resolve alerts', async () => {
    const { result } = renderHook(() => useSLOAlerts());

    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
    });

    act(() => {
      const resolved = result.current.resolveAlert('alert-1');
      expect(resolved).toBe(true);
    });

    expect(mockSLOMonitoringService.resolveAlert).toHaveBeenCalledWith('alert-1');
  });
});

describe('useSystemHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return system health data', async () => {
    const { result } = renderHook(() => useSystemHealth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.overall).toBe('healthy');
    expect(result.current.sloCompliance).toBe(98.5);
    expect(result.current.sloBreakdown.total).toBe(1);
    expect(result.current.sloBreakdown.healthy).toBe(1);
    expect(result.current.services).toHaveLength(1);
  });

  it('should calculate compliance by category', async () => {
    const { result } = renderHook(() => useSystemHealth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.complianceByCategory).toBeDefined();
    expect(result.current.complianceByCategory.performance).toEqual({
      total: 1,
      compliant: 1
    });
  });
});