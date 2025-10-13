/**
 * Performance Rollback Hook Tests
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { usePerformanceRollback } from '../usePerformanceRollback';

// Mock timers
jest.useFakeTimers();

// Suppress act warnings for polling intervals
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to TestComponent inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('usePerformanceRollback', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    // Initial state before data loads
    expect(result.current.currentRollback).toBeNull();
    expect(result.current.isMonitoring).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for initial data load to complete
    await waitFor(() => {
      expect(result.current.rollbackHistory.length).toBeGreaterThan(0);
      expect(result.current.performanceMetrics).toBeTruthy();
      expect(result.current.configuration).toBeTruthy();
    });
  });

  it('should load initial data on mount', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.rollbackHistory.length).toBeGreaterThan(0);
    });

    expect(result.current.performanceMetrics).toBeTruthy();
    expect(result.current.configuration).toBeTruthy();
    expect(result.current.rollbackHistory).toHaveLength(2);
  });

  it('should trigger manual rollback', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    const reason = 'Test manual rollback';

    await act(async () => {
      await result.current.triggerManualRollback(reason);
    });

    expect(result.current.currentRollback).toBeTruthy();
    expect(result.current.currentRollback?.reason).toBe(reason);
    expect(result.current.currentRollback?.severity).toBe('warning');
    expect(result.current.currentRollback?.status).toBe('initiated');

    // Fast-forward through the rollback simulation
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.currentRollback?.status).toBe('in_progress');
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.currentRollback?.status).toBe('completed');
    });

    // Fast-forward to clear the rollback
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.currentRollback).toBeNull();
    });
  });

  it('should cancel rollback', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    // First trigger a rollback
    await act(async () => {
      await result.current.triggerManualRollback('Test rollback');
    });

    expect(result.current.currentRollback).toBeTruthy();

    // Then cancel it
    await act(async () => {
      await result.current.cancelRollback();
    });

    expect(result.current.currentRollback?.status).toBe('cancelled');

    // Fast-forward to clear the rollback
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.currentRollback).toBeNull();
    });
  });

  it('should handle monitoring start/stop', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    expect(result.current.isMonitoring).toBe(true);

    act(() => {
      result.current.stopMonitoring();
    });

    expect(result.current.isMonitoring).toBe(false);

    act(() => {
      result.current.startMonitoring();
    });

    expect(result.current.isMonitoring).toBe(true);
  });

  it('should update configuration', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    const originalThreshold = result.current.configuration?.sloViolationThreshold;
    const newConfig = { sloViolationThreshold: 5 };

    await act(async () => {
      await result.current.updateConfiguration(newConfig);
    });

    expect(result.current.configuration?.sloViolationThreshold).toBe(5);
    expect(result.current.configuration?.sloViolationThreshold).not.toBe(originalThreshold);
  });

  it('should refresh data', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
      expect(result.current.performanceMetrics).toBeTruthy();
    });

    await act(async () => {
      await result.current.refreshData();
    });

    // Just verify that refresh completes successfully
    expect(result.current.performanceMetrics).toBeTruthy();
    expect(result.current.performanceMetrics?.lastUpdated).toBeInstanceOf(Date);
  });

  it('should handle loading states correctly', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    // Should be false after initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger manual rollback and check loading state
    await act(async () => {
      await result.current.triggerManualRollback('Test');
    });

    // Loading should be false after completion
    expect(result.current.loading).toBe(false);
  });

  it('should handle cancel rollback when no current rollback', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    // Should not throw when cancelling with no current rollback
    await act(async () => {
      await result.current.cancelRollback();
    });

    expect(result.current.currentRollback).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should poll for updates when monitoring is enabled', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    const originalMetrics = result.current.performanceMetrics;

    // Fast-forward past the polling interval (30 seconds)
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(result.current.performanceMetrics?.lastUpdated).not.toEqual(
        originalMetrics?.lastUpdated
      );
    });
  });

  it('should not poll when monitoring is disabled', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    // Stop monitoring
    act(() => {
      result.current.stopMonitoring();
    });

    const originalMetrics = result.current.performanceMetrics;

    // Fast-forward past the polling interval
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Metrics should not have been updated
    expect(result.current.performanceMetrics?.lastUpdated).toEqual(
      originalMetrics?.lastUpdated
    );
  });

  it('should provide correct rollback history structure', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.rollbackHistory.length).toBeGreaterThan(0);
    });

    const history = result.current.rollbackHistory;
    
    expect(history).toHaveLength(2);
    
    // Check first rollback (most recent)
    const recentRollback = history[0];
    expect(recentRollback).toHaveProperty('id');
    expect(recentRollback).toHaveProperty('timestamp');
    expect(recentRollback).toHaveProperty('reason');
    expect(recentRollback).toHaveProperty('severity');
    expect(recentRollback).toHaveProperty('status');
    expect(recentRollback).toHaveProperty('rollbackSteps');
    expect(recentRollback).toHaveProperty('validationResults');
    
    expect(recentRollback.severity).toBe('critical');
    expect(recentRollback.status).toBe('completed');
    expect(recentRollback.rollbackSteps).toHaveLength(1);
    expect(recentRollback.validationResults).toHaveLength(1);
    
    // Check emergency rollback
    const emergencyRollback = history[1];
    expect(emergencyRollback.severity).toBe('emergency');
    expect(emergencyRollback.rollbackSteps[0].type).toBe('emergency_stop');
  });

  it('should provide correct configuration structure', async () => {
    const { result } = renderHook(() => usePerformanceRollback());

    await waitFor(() => {
      expect(result.current.configuration).toBeTruthy();
    });

    const config = result.current.configuration!;
    
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('sloViolationThreshold');
    expect(config).toHaveProperty('rollbackCooldownMs');
    expect(config).toHaveProperty('emergencyThresholds');
    expect(config).toHaveProperty('gradualRollback');
    
    expect(config.enabled).toBe(true);
    expect(config.sloViolationThreshold).toBe(3);
    expect(config.rollbackCooldownMs).toBe(5 * 60 * 1000);
    
    expect(config.emergencyThresholds).toHaveProperty('errorRate');
    expect(config.emergencyThresholds).toHaveProperty('latencyP95');
    expect(config.emergencyThresholds).toHaveProperty('costPerRequest');
    
    expect(config.gradualRollback).toHaveProperty('enabled');
    expect(config.gradualRollback).toHaveProperty('trafficReductionSteps');
    expect(config.gradualRollback).toHaveProperty('stepDurationMs');
    
    expect(config.gradualRollback.trafficReductionSteps).toEqual([80, 60, 40, 20]);
  });
});