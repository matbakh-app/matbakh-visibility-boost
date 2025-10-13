/**
 * Tests for useExperimentWinRate hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';

// Mock the experiment win rate service - must be defined before the module mock
const mockExperimentWinRateService = {
  getAllExperiments: jest.fn(() => [
    {
      id: 'exp-001',
      name: 'Test Experiment 1',
      description: 'First test experiment',
      status: 'running',
      type: 'ab_test',
      createdAt: new Date('2024-01-15'),
      startedAt: new Date('2024-01-20'),
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Control variant',
          traffic: 50,
          config: {},
          isControl: true,
        },
        {
          id: 'variant',
          name: 'Variant',
          description: 'Test variant',
          traffic: 50,
          config: {},
          isControl: false,
        },
      ],
      trafficSplit: { control: 50, variant: 50 },
      participants: 1000,
      targetMetric: 'conversion_rate',
      successCriteria: {
        metric: 'conversion_rate',
        operator: 'gt',
        value: 0.1,
        confidenceLevel: 95,
      },
      metadata: {},
      tags: ['test'],
    }
  ]),
  getExperimentsByIds: jest.fn((ids: string[]) => 
    ids.includes('exp-001') ? [
      {
        id: 'exp-001',
        name: 'Test Experiment 1',
        description: 'First test experiment',
        status: 'running',
        type: 'ab_test',
        createdAt: new Date('2024-01-15'),
        startedAt: new Date('2024-01-20'),
        variants: [
          {
            id: 'control',
            name: 'Control',
            description: 'Control variant',
            traffic: 50,
            config: {},
            isControl: true,
          },
          {
            id: 'variant',
            name: 'Variant',
            description: 'Test variant',
            traffic: 50,
            config: {},
            isControl: false,
          },
        ],
        trafficSplit: { control: 50, variant: 50 },
        participants: 1000,
        targetMetric: 'conversion_rate',
        successCriteria: {
          metric: 'conversion_rate',
          operator: 'gt',
          value: 0.1,
          confidenceLevel: 95,
        },
        metadata: {},
        tags: ['test'],
      }
    ] : []
  ),
  getWinRates: jest.fn(() => [
    {
      experimentId: 'exp-001',
      variantId: 'control',
      rate: 45.5,
      confidence: 95,
      sampleSize: 500,
      conversions: 227,
      timestamp: new Date(),
      trend: 'stable',
      statisticalSignificance: true,
      pValue: 0.03,
      confidenceInterval: { lower: 41.2, upper: 49.8 },
    },
    {
      experimentId: 'exp-001',
      variantId: 'variant',
      rate: 52.3,
      confidence: 95,
      sampleSize: 500,
      conversions: 261,
      timestamp: new Date(),
      trend: 'improving',
      statisticalSignificance: true,
      pValue: 0.01,
      confidenceInterval: { lower: 48.1, upper: 56.5 },
    },
  ]),
  getCostImpact: jest.fn(() => [
    {
      experimentId: 'exp-001',
      variantId: 'control',
      impact: 0,
      costPerConversion: 2.5,
      totalCost: 100,
      costSavings: 0,
      roi: 0,
      timestamp: new Date(),
      breakdown: {
        infrastructure: 40,
        aiProviders: 30,
        storage: 10,
        networking: 10,
        other: 10,
      },
    },
    {
      experimentId: 'exp-001',
      variantId: 'variant',
      impact: -15.5,
      costPerConversion: 2.1,
      totalCost: 84.5,
      costSavings: 15.5,
      roi: 18.3,
      timestamp: new Date(),
      breakdown: {
        infrastructure: 33.8,
        aiProviders: 25.4,
        storage: 8.5,
        networking: 8.5,
        other: 8.3,
      },
    },
  ]),
  startExperiment: jest.fn(() => true),
  stopExperiment: jest.fn(() => true),
  updateTrafficSplit: jest.fn(() => true),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('@/lib/monitoring/experiment-win-rate-service', () => ({
  experimentWinRateService: mockExperimentWinRateService
}));

// Import hooks after mocking
import { useExperiment, useExperimentComparison, useExperimentWinRate } from '../useExperimentWinRate';

describe('useExperimentWinRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load experiment win rate data on mount', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.experiments).toHaveLength(1);
    expect(result.current.winRates).toHaveLength(2);
    expect(result.current.costImpact).toHaveLength(2);
    expect(result.current.aggregatedMetrics.totalExperiments).toBe(1);
    expect(result.current.aggregatedMetrics.activeExperiments).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should calculate aggregated metrics correctly', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { aggregatedMetrics } = result.current;
    expect(aggregatedMetrics.totalExperiments).toBe(1);
    expect(aggregatedMetrics.activeExperiments).toBe(1);
    expect(aggregatedMetrics.averageWinRate).toBeCloseTo(48.9, 1); // (45.5 + 52.3) / 2
    expect(aggregatedMetrics.totalCostImpact).toBeCloseTo(-15.5, 1);
    expect(aggregatedMetrics.topPerformingExperiment).toBe('Test Experiment 1');
  });

  it('should handle refresh experiments', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshExperiments();
    });

    expect(mockExperimentWinRateService.getAllExperiments).toHaveBeenCalledTimes(2);
    expect(mockExperimentWinRateService.getWinRates).toHaveBeenCalledTimes(2);
    expect(mockExperimentWinRateService.getCostImpact).toHaveBeenCalledTimes(2);
  });

  it('should get experiment win rate by ID', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const winRate = result.current.getExperimentWinRate('exp-001');
    expect(winRate).toBeDefined();
    expect(winRate?.experimentId).toBe('exp-001');
  });

  it('should get experiment cost impact by ID', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const costImpact = result.current.getExperimentCostImpact('exp-001');
    expect(costImpact).toBeDefined();
    expect(costImpact?.experimentId).toBe('exp-001');
  });

  it('should start experiment', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const success = result.current.startExperiment('exp-001');
      expect(success).toBe(true);
    });

    expect(mockExperimentWinRateService.startExperiment).toHaveBeenCalledWith('exp-001');
  });

  it('should stop experiment', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const success = result.current.stopExperiment('exp-001');
      expect(success).toBe(true);
    });

    expect(mockExperimentWinRateService.stopExperiment).toHaveBeenCalledWith('exp-001');
  });

  it('should update traffic split', async () => {
    const { result } = renderHook(() => useExperimentWinRate());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newTrafficSplit = { control: 30, variant: 70 };

    act(() => {
      const success = result.current.updateTrafficSplit('exp-001', newTrafficSplit);
      expect(success).toBe(true);
    });

    expect(mockExperimentWinRateService.updateTrafficSplit).toHaveBeenCalledWith('exp-001', newTrafficSplit);
  });

  it('should filter experiments by IDs', async () => {
    const { result } = renderHook(() => useExperimentWinRate({ experimentIds: ['exp-001'] }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockExperimentWinRateService.getExperimentsByIds).toHaveBeenCalledWith(['exp-001']);
    expect(result.current.experiments).toHaveLength(1);
  });

  it('should handle auto-refresh when enabled', async () => {
    const { result } = renderHook(() => 
      useExperimentWinRate({ autoRefresh: true, refreshInterval: 100 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Wait a bit for potential auto-refresh
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockExperimentWinRateService.getAllExperiments).toHaveBeenCalled();
  });

  it('should not auto-refresh when disabled', async () => {
    const { result } = renderHook(() => 
      useExperimentWinRate({ autoRefresh: false })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have been called once (initial load)
    expect(mockExperimentWinRateService.getAllExperiments).toHaveBeenCalledTimes(1);
  });
});

describe('useExperiment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return specific experiment data', async () => {
    const { result } = renderHook(() => useExperiment('exp-001'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.experiment).toBeDefined();
    expect(result.current.winRate).toBeDefined();
    expect(result.current.cost).toBeDefined();
    expect(result.current.exists).toBe(true);
  });

  it('should handle non-existent experiment', async () => {
    const { result } = renderHook(() => useExperiment('non-existent'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.experiment).toBeUndefined();
    expect(result.current.exists).toBe(false);
  });

  it('should start experiment', async () => {
    const { result } = renderHook(() => useExperiment('exp-001'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const success = result.current.start();
      expect(success).toBe(true);
    });

    expect(mockExperimentWinRateService.startExperiment).toHaveBeenCalledWith('exp-001');
  });

  it('should stop experiment', async () => {
    const { result } = renderHook(() => useExperiment('exp-001'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      const success = result.current.stop();
      expect(success).toBe(true);
    });

    expect(mockExperimentWinRateService.stopExperiment).toHaveBeenCalledWith('exp-001');
  });
});

describe('useExperimentComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compare experiments', async () => {
    const { result } = renderHook(() => useExperimentComparison(['exp-001']));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comparison).toHaveLength(1);
    expect(result.current.bestPerforming).toBeDefined();
    expect(result.current.worstPerforming).toBeDefined();
  });

  it('should sort experiments by win rate', async () => {
    // Mock multiple experiments for comparison
    mockExperimentWinRateService.getExperimentsByIds.mockReturnValueOnce([
      {
        id: 'exp-001',
        name: 'Experiment 1',
        status: 'running',
        participants: 1000,
      },
      {
        id: 'exp-002',
        name: 'Experiment 2',
        status: 'running',
        participants: 800,
      },
    ]);

    mockExperimentWinRateService.getWinRates.mockReturnValueOnce([
      {
        experimentId: 'exp-001',
        variantId: 'control',
        rate: 45.5,
        confidence: 95,
        sampleSize: 500,
        conversions: 227,
        timestamp: new Date(),
        trend: 'stable',
        statisticalSignificance: true,
        pValue: 0.03,
        confidenceInterval: { lower: 41.2, upper: 49.8 },
      },
      {
        experimentId: 'exp-002',
        variantId: 'control',
        rate: 60.2,
        confidence: 95,
        sampleSize: 400,
        conversions: 241,
        timestamp: new Date(),
        trend: 'improving',
        statisticalSignificance: true,
        pValue: 0.01,
        confidenceInterval: { lower: 55.8, upper: 64.6 },
      },
    ]);

    const { result } = renderHook(() => useExperimentComparison(['exp-001', 'exp-002']));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.comparison).toHaveLength(2);
    expect(result.current.bestPerforming.experimentId).toBe('exp-002');
    expect(result.current.worstPerforming.experimentId).toBe('exp-001');
  });
});