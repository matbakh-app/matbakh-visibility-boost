/**
 * Tests for useUnifiedAi React Hook
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AiRequest, Provider } from '../../lib/ai-orchestrator/types';
import { useAiMetrics, useProviderManagement, useUnifiedAi } from '../useUnifiedAi';

// Mock the unified AI API
const mockApi = {
  generateResponse: jest.fn(),
  testProvider: jest.fn(),
  resetCircuitBreaker: jest.fn(),
  setProviderEnabled: jest.fn(),
  getProviderHealth: jest.fn(),
  getMetrics: jest.fn(),
  getProviderModels: jest.fn(),
};

jest.mock('../../lib/ai-orchestrator/unified-ai-api', () => ({
  getUnifiedAiApi: () => mockApi,
}));

describe('useUnifiedAi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useUnifiedAi());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.response).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.metrics).toBeNull();
      expect(result.current.providerHealth).toEqual([]);
      expect(result.current.currentProvider).toBeNull();
      expect(result.current.requestId).toBeNull();
    });

    it('should provide all expected actions', () => {
      const { result } = renderHook(() => useUnifiedAi());

      expect(typeof result.current.generateResponse).toBe('function');
      expect(typeof result.current.testProvider).toBe('function');
      expect(typeof result.current.resetCircuitBreaker).toBe('function');
      expect(typeof result.current.setProviderEnabled).toBe('function');
      expect(typeof result.current.refreshHealth).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('generateResponse', () => {
    const mockRequest: AiRequest = {
      prompt: 'Test prompt',
      context: { domain: 'general' },
    };

    it('should handle successful response', async () => {
      const mockResponse = {
        provider: 'bedrock' as Provider,
        modelId: 'claude-3-5-sonnet',
        text: 'Test response',
        latencyMs: 500,
        costEuro: 0.01,
        success: true,
        requestId: 'test-id',
      };

      mockApi.generateResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUnifiedAi());

      let response;
      await act(async () => {
        response = await result.current.generateResponse(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.response).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(result.current.currentProvider).toBe('bedrock');
      expect(result.current.requestId).toBe('test-id');
      expect(response).toEqual(mockResponse);
    });

    it('should handle failed response', async () => {
      const mockResponse = {
        provider: 'bedrock' as Provider,
        modelId: 'claude-3-5-sonnet',
        latencyMs: 500,
        costEuro: 0,
        success: false,
        error: 'API Error',
        requestId: 'test-id',
      };

      mockApi.generateResponse.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUnifiedAi());

      await act(async () => {
        await result.current.generateResponse(mockRequest);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.response).toEqual(mockResponse);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('API Error');
    });

    it('should handle API exceptions', async () => {
      const error = new Error('Network error');
      mockApi.generateResponse.mockRejectedValue(error);

      const { result } = renderHook(() => useUnifiedAi());

      await act(async () => {
        try {
          await result.current.generateResponse(mockRequest);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    it('should set loading state during request', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockApi.generateResponse.mockReturnValue(promise);

      const { result } = renderHook(() => useUnifiedAi());

      act(() => {
        result.current.generateResponse(mockRequest);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          provider: 'bedrock' as Provider,
          modelId: 'claude-3-5-sonnet',
          text: 'Test response',
          latencyMs: 500,
          costEuro: 0.01,
          success: true,
          requestId: 'test-id',
        });
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call onProviderSwitch when provider changes', async () => {
      const onProviderSwitch = jest.fn();
      
      const { result } = renderHook(() => 
        useUnifiedAi({ onProviderSwitch })
      );

      // First request with bedrock
      mockApi.generateResponse.mockResolvedValueOnce({
        provider: 'bedrock' as Provider,
        modelId: 'claude-3-5-sonnet',
        text: 'Response 1',
        latencyMs: 500,
        costEuro: 0.01,
        success: true,
        requestId: 'test-id-1',
      });

      await act(async () => {
        await result.current.generateResponse(mockRequest);
      });

      // Second request with google
      mockApi.generateResponse.mockResolvedValueOnce({
        provider: 'google' as Provider,
        modelId: 'gemini-1.5-pro',
        text: 'Response 2',
        latencyMs: 600,
        costEuro: 0.008,
        success: true,
        requestId: 'test-id-2',
      });

      await act(async () => {
        await result.current.generateResponse(mockRequest);
      });

      expect(onProviderSwitch).toHaveBeenCalledWith('bedrock', 'google');
    });

    it('should call onError when request fails', async () => {
      const onError = jest.fn();
      const error = new Error('Test error');
      
      mockApi.generateResponse.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useUnifiedAi({ onError })
      );

      await act(async () => {
        try {
          await result.current.generateResponse(mockRequest);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(onError).toHaveBeenCalledWith(error, mockRequest);
    });
  });

  describe('Auto-retry functionality', () => {
    const mockRequest: AiRequest = {
      prompt: 'Test prompt',
      context: { domain: 'general' },
    };

    it('should retry on failure when enableAutoRetry is true', async () => {
      const error = new Error('Temporary failure');
      const successResponse = {
        provider: 'google' as Provider,
        modelId: 'gemini-1.5-pro',
        text: 'Success after retry',
        latencyMs: 600,
        costEuro: 0.008,
        success: true,
        requestId: 'test-id',
      };

      mockApi.generateResponse
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(successResponse);

      const { result } = renderHook(() => 
        useUnifiedAi({ 
          enableAutoRetry: true, 
          maxRetries: 2,
          retryDelay: 100 
        })
      );

      await act(async () => {
        await result.current.generateResponse(mockRequest);
      });

      expect(mockApi.generateResponse).toHaveBeenCalledTimes(2);
      expect(result.current.response).toEqual(successResponse);
      expect(result.current.error).toBeNull();
    });

    it('should not retry when enableAutoRetry is false', async () => {
      const error = new Error('Failure');
      mockApi.generateResponse.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useUnifiedAi({ enableAutoRetry: false })
      );

      await act(async () => {
        try {
          await result.current.generateResponse(mockRequest);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockApi.generateResponse).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual(error);
    });

    it('should respect maxRetries limit', async () => {
      const error = new Error('Persistent failure');
      mockApi.generateResponse.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useUnifiedAi({ 
          enableAutoRetry: true, 
          maxRetries: 3,
          retryDelay: 10 
        })
      );

      await act(async () => {
        try {
          await result.current.generateResponse(mockRequest);
        } catch (e) {
          // Expected to throw after all retries
        }
      });

      expect(mockApi.generateResponse).toHaveBeenCalledTimes(3);
      expect(result.current.error).toEqual(error);
    });
  });

  describe('Provider management actions', () => {
    it('should test provider connectivity', async () => {
      mockApi.testProvider.mockResolvedValue(true);

      const { result } = renderHook(() => useUnifiedAi());

      let testResult;
      await act(async () => {
        testResult = await result.current.testProvider('bedrock');
      });

      expect(mockApi.testProvider).toHaveBeenCalledWith('bedrock');
      expect(testResult).toBe(true);
    });

    it('should reset circuit breaker', async () => {
      mockApi.getProviderHealth.mockResolvedValue([]);

      const { result } = renderHook(() => useUnifiedAi());

      await act(async () => {
        result.current.resetCircuitBreaker('google');
      });

      expect(mockApi.resetCircuitBreaker).toHaveBeenCalledWith('google');
      expect(mockApi.getProviderHealth).toHaveBeenCalled();
    });

    it('should enable/disable provider', async () => {
      mockApi.getProviderHealth.mockResolvedValue([]);

      const { result } = renderHook(() => useUnifiedAi());

      await act(async () => {
        await result.current.setProviderEnabled('meta', false);
      });

      expect(mockApi.setProviderEnabled).toHaveBeenCalledWith('meta', false);
      expect(mockApi.getProviderHealth).toHaveBeenCalled();
    });

    it('should refresh health status', async () => {
      const mockHealth = [
        {
          provider: 'bedrock' as Provider,
          status: 'healthy' as const,
          latency: 500,
          errorRate: 0.01,
          lastCheck: new Date(),
          circuitBreakerState: 'closed' as const,
        },
      ];

      mockApi.getProviderHealth.mockResolvedValue(mockHealth);

      const { result } = renderHook(() => useUnifiedAi());

      await act(async () => {
        await result.current.refreshHealth();
      });

      expect(mockApi.getProviderHealth).toHaveBeenCalled();
      expect(result.current.providerHealth).toEqual(mockHealth);
    });
  });

  describe('State management actions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useUnifiedAi());

      // Set an error first
      act(() => {
        (result.current as any).setState((prev: any) => ({
          ...prev,
          error: new Error('Test error'),
        }));
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset all state', () => {
      const { result } = renderHook(() => useUnifiedAi());

      // Set some state first
      act(() => {
        (result.current as any).setState((prev: any) => ({
          ...prev,
          response: { text: 'test' },
          error: new Error('test'),
          currentProvider: 'bedrock',
        }));
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.response).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.currentProvider).toBeNull();
    });
  });
});

describe('useProviderManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get provider models', () => {
    const mockModels = ['model1', 'model2'];
    mockApi.getProviderModels.mockReturnValue(mockModels);

    const { result } = renderHook(() => useProviderManagement());

    const models = result.current.getProviderModels('bedrock');

    expect(mockApi.getProviderModels).toHaveBeenCalledWith('bedrock');
    expect(models).toEqual(mockModels);
  });

  it('should test all providers', async () => {
    mockApi.testProvider
      .mockResolvedValueOnce(true)  // bedrock
      .mockResolvedValueOnce(false) // google
      .mockResolvedValueOnce(true); // meta

    const { result } = renderHook(() => useProviderManagement());

    let testResults;
    await act(async () => {
      testResults = await result.current.testAllProviders();
    });

    expect(mockApi.testProvider).toHaveBeenCalledTimes(3);
    expect(testResults).toEqual({
      bedrock: true,
      google: false,
      meta: true,
    });
  });

  it('should reset all circuit breakers', () => {
    const { result } = renderHook(() => useProviderManagement());

    act(() => {
      result.current.resetAllCircuitBreakers();
    });

    expect(mockApi.resetCircuitBreaker).toHaveBeenCalledTimes(3);
    expect(mockApi.resetCircuitBreaker).toHaveBeenCalledWith('bedrock');
    expect(mockApi.resetCircuitBreaker).toHaveBeenCalledWith('google');
    expect(mockApi.resetCircuitBreaker).toHaveBeenCalledWith('meta');
  });
});

describe('useAiMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch metrics on mount', async () => {
    const mockMetrics = {
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      averageLatency: 500,
      costPerRequest: 0.01,
      providerDistribution: { bedrock: 50, google: 30, meta: 20 },
      cacheHitRate: 0.8,
    };

    const mockHealth = [
      {
        provider: 'bedrock' as Provider,
        status: 'healthy' as const,
        latency: 500,
        errorRate: 0.01,
        lastCheck: new Date(),
        circuitBreakerState: 'closed' as const,
      },
    ];

    mockApi.getMetrics.mockReturnValue(mockMetrics);
    mockApi.getProviderHealth.mockResolvedValue(mockHealth);

    const { result } = renderHook(() => useAiMetrics(1000));

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.health).toEqual(mockHealth);
    });

    expect(mockApi.getMetrics).toHaveBeenCalled();
    expect(mockApi.getProviderHealth).toHaveBeenCalled();
  });

  it('should poll metrics at specified interval', async () => {
    const mockMetrics = { totalRequests: 100 };
    const mockHealth = [];

    mockApi.getMetrics.mockReturnValue(mockMetrics);
    mockApi.getProviderHealth.mockResolvedValue(mockHealth);

    renderHook(() => useAiMetrics(1000));

    // Fast-forward time to trigger polling
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockApi.getMetrics).toHaveBeenCalledTimes(2); // Initial + 1 poll
    });
  });

  it('should refresh metrics manually', async () => {
    const mockMetrics = { totalRequests: 200 };
    const mockHealth = [];

    mockApi.getMetrics.mockReturnValue(mockMetrics);
    mockApi.getProviderHealth.mockResolvedValue(mockHealth);

    const { result } = renderHook(() => useAiMetrics(10000));

    await act(async () => {
      await result.current.refreshMetrics();
    });

    expect(mockApi.getMetrics).toHaveBeenCalledTimes(2); // Initial + manual refresh
    expect(result.current.metrics).toEqual(mockMetrics);
  });

  it('should handle errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    mockApi.getMetrics.mockImplementation(() => {
      throw new Error('Metrics error');
    });
    mockApi.getProviderHealth.mockRejectedValue(new Error('Health error'));

    const { result } = renderHook(() => useAiMetrics(1000));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});