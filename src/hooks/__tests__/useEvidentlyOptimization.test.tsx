/**
 * Tests for useEvidentlyOptimization React Hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { EvidentlyOptimizationService } from '../../lib/optimization/evidently-integration';
import { EvidentlyProvider, useEvidentlyOptimization } from '../useEvidentlyOptimization';

// Mock the service
jest.mock('../../lib/optimization/evidently-integration');

const MockEvidentlyService = EvidentlyOptimizationService as jest.MockedClass<typeof EvidentlyOptimizationService>;

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)'
  }
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    timing: {
      navigationStart: 1000,
      loadEventEnd: 2500,
      domContentLoadedEventEnd: 2000
    }
  }
});

describe('useEvidentlyOptimization', () => {
  let mockService: jest.Mocked<EvidentlyOptimizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockService = {
      initializeProject: jest.fn(),
      evaluateFeature: jest.fn(),
      evaluateMultipleFeatures: jest.fn(),
      recordMetric: jest.fn(),
      recordPerformanceMetrics: jest.fn(),
      healthCheck: jest.fn()
    } as any;

    MockEvidentlyService.mockImplementation(() => mockService);

    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Hook Initialization', () => {
    it('should initialize with default configuration', async () => {
      mockService.initializeProject.mockResolvedValue(undefined);
      mockService.evaluateMultipleFeatures.mockResolvedValue({
        'bundle-optimization': false,
        'caching-strategy': 'memory',
        'lazy-loading': 'routes',
        'database-optimization': 'pooling'
      });

      const { result } = renderHook(() => useEvidentlyOptimization());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockService.initializeProject).toHaveBeenCalled();
      expect(mockService.evaluateMultipleFeatures).toHaveBeenCalledWith([
        'bundle-optimization',
        'caching-strategy',
        'lazy-loading',
        'database-optimization'
      ]);
    });

    it('should use provided configuration', () => {
      const config = {
        projectName: 'custom-project',
        region: 'us-west-2',
        userId: 'user123'
      };

      renderHook(() => useEvidentlyOptimization(config));

      expect(MockEvidentlyService).toHaveBeenCalledWith('custom-project', 'us-west-2');
    });

    it('should generate session ID if not provided', () => {
      const { result } = renderHook(() => useEvidentlyOptimization());

      expect(result.current.userContext.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'sessionId',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      );
    });

    it('should use existing session ID from storage', () => {
      mockSessionStorage.getItem.mockReturnValue('existing-session-123');

      const { result } = renderHook(() => useEvidentlyOptimization());

      expect(result.current.userContext.sessionId).toBe('existing-session-123');
    });
  });

  describe('Feature Flag Evaluation', () => {
    it('should evaluate single feature flag', async () => {
      mockService.evaluateFeature.mockResolvedValue('advanced');

      const { result } = renderHook(() => useEvidentlyOptimization());

      let evaluation;
      act(() => {
        evaluation = result.current.evaluateFeature('bundle-optimization', false);
      });

      expect(evaluation.loading).toBe(true);
      expect(evaluation.value).toBe(false); // Default value while loading

      await waitFor(() => {
        const newEvaluation = result.current.evaluateFeature('bundle-optimization', false);
        expect(newEvaluation.loading).toBe(false);
        expect(newEvaluation.value).toBe('advanced');
        expect(newEvaluation.variation).toBe('advanced');
      });
    });

    it('should handle feature evaluation errors', async () => {
      const error = new Error('Network error');
      mockService.evaluateFeature.mockRejectedValue(error);

      const { result } = renderHook(() => useEvidentlyOptimization());

      act(() => {
        result.current.evaluateFeature('bundle-optimization', 'default');
      });

      await waitFor(() => {
        const evaluation = result.current.evaluateFeature('bundle-optimization', 'default');
        expect(evaluation.loading).toBe(false);
        expect(evaluation.value).toBe('default');
        expect(evaluation.variation).toBe('error');
        expect(evaluation.error).toBe(error);
      });

      expect(result.current.error).toBe(error);
    });

    it('should evaluate multiple features at once', async () => {
      mockService.evaluateMultipleFeatures.mockResolvedValue({
        'bundle-optimization': 'advanced',
        'caching-strategy': 'redis'
      });

      const { result } = renderHook(() => useEvidentlyOptimization());

      let evaluations;
      act(() => {
        evaluations = result.current.evaluateMultipleFeatures(['bundle-optimization', 'caching-strategy']);
      });

      expect(evaluations['bundle-optimization'].loading).toBe(true);
      expect(evaluations['caching-strategy'].loading).toBe(true);

      await waitFor(() => {
        const newEvaluations = result.current.evaluateMultipleFeatures(['bundle-optimization', 'caching-strategy']);
        expect(newEvaluations['bundle-optimization'].value).toBe('advanced');
        expect(newEvaluations['caching-strategy'].value).toBe('redis');
      });
    });

    it('should cache feature evaluations', async () => {
      mockService.evaluateFeature.mockResolvedValue('advanced');

      const { result } = renderHook(() => useEvidentlyOptimization());

      // First evaluation
      act(() => {
        result.current.evaluateFeature('bundle-optimization', false);
      });

      await waitFor(() => {
        const evaluation = result.current.evaluateFeature('bundle-optimization', false);
        expect(evaluation.loading).toBe(false);
      });

      // Second evaluation should use cache
      act(() => {
        const cachedEvaluation = result.current.evaluateFeature('bundle-optimization', false);
        expect(cachedEvaluation.loading).toBe(false);
        expect(cachedEvaluation.value).toBe('advanced');
      });

      // Service should only be called once
      expect(mockService.evaluateFeature).toHaveBeenCalledTimes(1);
    });
  });

  describe('Optimization Helpers', () => {
    beforeEach(() => {
      mockService.evaluateFeature
        .mockResolvedValueOnce('advanced') // bundle-optimization
        .mockResolvedValueOnce('redis') // caching-strategy
        .mockResolvedValueOnce('all') // lazy-loading
        .mockResolvedValueOnce('full'); // database-optimization
    });

    it('should get bundle optimization setting', async () => {
      const { result } = renderHook(() => useEvidentlyOptimization());

      await waitFor(() => {
        const bundleOpt = result.current.getBundleOptimization();
        expect(bundleOpt).toBe('advanced');
      });
    });

    it('should get caching strategy', async () => {
      const { result } = renderHook(() => useEvidentlyOptimization());

      await waitFor(() => {
        const cachingStrategy = result.current.getCachingStrategy();
        expect(cachingStrategy).toBe('redis');
      });
    });

    it('should get lazy loading mode', async () => {
      const { result } = renderHook(() => useEvidentlyOptimization());

      await waitFor(() => {
        const lazyLoading = result.current.getLazyLoadingMode();
        expect(lazyLoading).toBe('all');
      });
    });

    it('should get database optimization setting', async () => {
      const { result } = renderHook(() => useEvidentlyOptimization());

      await waitFor(() => {
        const dbOpt = result.current.getDatabaseOptimization();
        expect(dbOpt).toBe('full');
      });
    });
  });

  describe('Metrics Recording', () => {
    it('should record custom metric', async () => {
      mockService.recordMetric.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEvidentlyOptimization());

      await act(async () => {
        await result.current.recordMetric('loadTime', 1.5, 'bundle-optimization');
      });

      expect(mockService.recordMetric).toHaveBeenCalledWith(
        'loadTime',
        1.5,
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Test Browser)',
          customAttributes: expect.objectContaining({
            timestamp: expect.any(String),
            url: expect.any(String)
          })
        }),
        'bundle-optimization'
      );
    });

    it('should record performance metrics', async () => {
      mockService.recordPerformanceMetrics.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEvidentlyOptimization());

      const metrics = {
        loadTime: 1.2,
        renderTime: 0.8,
        bundleSize: 450
      };

      await act(async () => {
        await result.current.recordPerformanceMetrics(metrics, 'performance-test');
      });

      expect(mockService.recordPerformanceMetrics).toHaveBeenCalledWith(
        metrics,
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Test Browser)'
        }),
        'performance-test'
      );
    });

    it('should handle metric recording errors gracefully', async () => {
      const error = new Error('Recording failed');
      mockService.recordMetric.mockRejectedValue(error);

      const { result } = renderHook(() => useEvidentlyOptimization());

      await act(async () => {
        await result.current.recordMetric('loadTime', 1.5);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      mockService.healthCheck.mockResolvedValue({
        connected: true,
        projectExists: true,
        featuresCount: 4,
        experimentsCount: 2
      });

      const { result } = renderHook(() => useEvidentlyOptimization());

      let isHealthy;
      await act(async () => {
        isHealthy = await result.current.healthCheck();
      });

      expect(isHealthy).toBe(true);
      expect(mockService.healthCheck).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      const error = new Error('Health check failed');
      mockService.healthCheck.mockRejectedValue(error);

      const { result } = renderHook(() => useEvidentlyOptimization());

      let isHealthy;
      await act(async () => {
        isHealthy = await result.current.healthCheck();
      });

      expect(isHealthy).toBe(false);
      expect(result.current.error).toBe(error);
    });
  });

  describe('Performance Metrics Auto-Recording', () => {
    it('should automatically record page load metrics', async () => {
      mockService.recordPerformanceMetrics.mockResolvedValue(undefined);

      // Mock document ready state
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        configurable: true
      });

      renderHook(() => useEvidentlyOptimization());

      await waitFor(() => {
        expect(mockService.recordPerformanceMetrics).toHaveBeenCalledWith(
          {
            loadTime: 1500, // 2500 - 1000
            renderTime: 1000 // 2000 - 1000
          },
          expect.any(Object)
        );
      });
    });

    it('should wait for load event if document not ready', async () => {
      mockService.recordPerformanceMetrics.mockResolvedValue(undefined);

      // Mock document loading state
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        configurable: true
      });

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useEvidentlyOptimization());

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });

  describe('Provider Context', () => {
    it('should use service from provider context', () => {
      const config = { projectName: 'provider-project' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <EvidentlyProvider config={config}>
          {children}
        </EvidentlyProvider>
      );

      renderHook(() => useEvidentlyOptimization(), { wrapper });

      // Should use the service from provider, not create a new one
      expect(MockEvidentlyService).toHaveBeenCalledTimes(1);
      expect(MockEvidentlyService).toHaveBeenCalledWith('provider-project', undefined);
    });

    it('should create new service if no provider', () => {
      const config = { projectName: 'standalone-project' };

      renderHook(() => useEvidentlyOptimization(config));

      expect(MockEvidentlyService).toHaveBeenCalledWith('standalone-project', undefined);
    });
  });
});