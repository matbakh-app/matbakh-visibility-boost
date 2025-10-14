/**
 * React Hook for Unified AI API
 *
 * Provides easy integration with the multi-provider AI system
 * including state management, error handling, and caching.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AiRequest, AiResponse, Provider } from "../lib/ai-orchestrator/types";
import {
  getUnifiedAiApi,
  ProviderHealth,
  UnifiedAiApi,
  UnifiedApiMetrics,
} from "../lib/ai-orchestrator/unified-ai-api";

export interface UseUnifiedAiOptions {
  enableAutoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableRealTimeMetrics?: boolean;
  onProviderSwitch?: (from: Provider, to: Provider) => void;
  onError?: (error: Error, context: AiRequest) => void;
}

export interface UseUnifiedAiState {
  isLoading: boolean;
  response: AiResponse | null;
  error: Error | null;
  metrics: UnifiedApiMetrics | null;
  providerHealth: ProviderHealth[];
  currentProvider: Provider | null;
  requestId: string | null;
}

export interface UseUnifiedAiActions {
  generateResponse: (request: AiRequest) => Promise<AiResponse>;
  testProvider: (provider: Provider) => Promise<boolean>;
  resetCircuitBreaker: (provider: Provider) => void;
  setProviderEnabled: (provider: Provider, enabled: boolean) => Promise<void>;
  refreshHealth: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export interface UseUnifiedAiReturn
  extends UseUnifiedAiState,
    UseUnifiedAiActions {}

/**
 * React hook for unified AI API integration
 */
export function useUnifiedAi(
  options: UseUnifiedAiOptions = {}
): UseUnifiedAiReturn {
  const {
    enableAutoRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableRealTimeMetrics = false,
    onProviderSwitch,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<UseUnifiedAiState>({
    isLoading: false,
    response: null,
    error: null,
    metrics: null,
    providerHealth: [],
    currentProvider: null,
    requestId: null,
  });

  // Refs for stable references
  const apiRef = useRef<UnifiedAiApi | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize API
  useEffect(() => {
    if (!apiRef.current) {
      apiRef.current = getUnifiedAiApi();
    }

    // Start real-time metrics if enabled
    if (enableRealTimeMetrics) {
      startMetricsPolling();
    }

    // Initial health check
    refreshHealth();

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enableRealTimeMetrics]);

  /**
   * Start polling for real-time metrics
   */
  const startMetricsPolling = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    metricsIntervalRef.current = setInterval(async () => {
      if (apiRef.current) {
        try {
          const metrics = apiRef.current.getMetrics();
          const health = await apiRef.current.getProviderHealth();

          setState((prev) => ({
            ...prev,
            metrics,
            providerHealth: health,
          }));
        } catch (error) {
          console.warn("Failed to fetch real-time metrics:", error);
        }
      }
    }, 5000); // Update every 5 seconds
  }, []);

  /**
   * Generate AI response with automatic retry and error handling
   */
  const generateResponse = useCallback(
    async (request: AiRequest): Promise<AiResponse> => {
      if (!apiRef.current) {
        throw new Error("Unified AI API not initialized");
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: null,
      }));

      let lastError: Error | null = null;
      let attempts = 0;
      const maxAttempts = enableAutoRetry ? maxRetries : 1;

      while (attempts < maxAttempts) {
        try {
          const response = await apiRef.current.generateResponse(request);

          // Track provider switches
          if (
            state.currentProvider &&
            response.provider !== state.currentProvider
          ) {
            onProviderSwitch?.(state.currentProvider, response.provider);
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            response,
            currentProvider: response.provider,
            requestId: response.requestId,
            error: response.success
              ? null
              : new Error(response.error || "Unknown error"),
          }));

          // Update metrics if not using real-time polling
          if (!enableRealTimeMetrics && apiRef.current) {
            const metrics = apiRef.current.getMetrics();
            setState((prev) => ({ ...prev, metrics }));
          }

          return response;
        } catch (error) {
          lastError = error as Error;
          attempts++;

          console.warn(`AI request attempt ${attempts} failed:`, error);

          // If not the last attempt, wait before retrying
          if (attempts < maxAttempts) {
            await new Promise((resolve) => {
              retryTimeoutRef.current = setTimeout(
                resolve,
                retryDelay * attempts
              );
            });
          }
        }
      }

      // All attempts failed
      const finalError = lastError || new Error("All AI providers failed");

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: finalError,
      }));

      onError?.(finalError, request);
      throw finalError;
    },
    [
      enableAutoRetry,
      maxRetries,
      retryDelay,
      state.currentProvider,
      onProviderSwitch,
      onError,
      enableRealTimeMetrics,
    ]
  );

  /**
   * Test connectivity to a specific provider
   */
  const testProvider = useCallback(
    async (provider: Provider): Promise<boolean> => {
      if (!apiRef.current) {
        return false;
      }

      try {
        return await apiRef.current.testProvider(provider);
      } catch (error) {
        console.error(`Provider test failed for ${provider}:`, error);
        return false;
      }
    },
    []
  );

  /**
   * Reset circuit breaker for a provider
   */
  const resetCircuitBreaker = useCallback((provider: Provider) => {
    if (apiRef.current) {
      apiRef.current.resetCircuitBreaker(provider);

      // Refresh health status
      refreshHealth();
    }
  }, []);

  /**
   * Enable or disable a specific provider
   */
  const setProviderEnabled = useCallback(
    async (provider: Provider, enabled: boolean) => {
      if (apiRef.current) {
        await apiRef.current.setProviderEnabled(provider, enabled);

        // Refresh health status
        await refreshHealth();
      }
    },
    []
  );

  /**
   * Refresh provider health status
   */
  const refreshHealth = useCallback(async () => {
    if (apiRef.current) {
      try {
        const health = await apiRef.current.getProviderHealth();
        setState((prev) => ({
          ...prev,
          providerHealth: health,
        }));
      } catch (error) {
        console.warn("Failed to refresh provider health:", error);
      }
    }
  }, []);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      response: null,
      error: null,
      metrics: null,
      providerHealth: [],
      currentProvider: null,
      requestId: null,
    });

    // Clear any pending timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    response: state.response,
    error: state.error,
    metrics: state.metrics,
    providerHealth: state.providerHealth,
    currentProvider: state.currentProvider,
    requestId: state.requestId,

    // Actions
    generateResponse,
    testProvider,
    resetCircuitBreaker,
    setProviderEnabled,
    refreshHealth,
    clearError,
    reset,
  };
}

/**
 * Hook for provider-specific operations
 */
export function useProviderManagement() {
  const apiRef = useRef<UnifiedAiApi | null>(null);

  useEffect(() => {
    if (!apiRef.current) {
      apiRef.current = getUnifiedAiApi();
    }
  }, []);

  const getProviderModels = useCallback((provider: Provider): string[] => {
    if (!apiRef.current) return [];
    return apiRef.current.getProviderModels(provider);
  }, []);

  const testAllProviders = useCallback(async (): Promise<
    Record<Provider, boolean>
  > => {
    if (!apiRef.current) return { bedrock: false, google: false, meta: false };

    const providers: Provider[] = ["bedrock", "google", "meta"];
    const results: Record<Provider, boolean> = {} as any;

    await Promise.all(
      providers.map(async (provider) => {
        try {
          results[provider] = await apiRef.current!.testProvider(provider);
        } catch (error) {
          results[provider] = false;
        }
      })
    );

    return results;
  }, []);

  const resetAllCircuitBreakers = useCallback(() => {
    if (!apiRef.current) return;

    const providers: Provider[] = ["bedrock", "google", "meta"];
    providers.forEach((provider) => {
      apiRef.current!.resetCircuitBreaker(provider);
    });
  }, []);

  return {
    getProviderModels,
    testAllProviders,
    resetAllCircuitBreakers,
  };
}

/**
 * Hook for AI metrics and monitoring
 */
export function useAiMetrics(refreshInterval: number = 10000) {
  const [metrics, setMetrics] = useState<UnifiedApiMetrics | null>(null);
  const [health, setHealth] = useState<ProviderHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiRef = useRef<UnifiedAiApi | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!apiRef.current) {
      apiRef.current = getUnifiedAiApi();
    }

    // Start metrics polling
    const fetchMetrics = async () => {
      if (!apiRef.current) return;

      setIsLoading(true);
      try {
        const [currentMetrics, currentHealth] = await Promise.all([
          Promise.resolve(apiRef.current.getMetrics()),
          apiRef.current.getProviderHealth(),
        ]);

        setMetrics(currentMetrics);
        setHealth(currentHealth);
      } catch (error) {
        console.error("Failed to fetch AI metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling
    intervalRef.current = setInterval(fetchMetrics, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  const refreshMetrics = useCallback(async () => {
    if (!apiRef.current) return;

    setIsLoading(true);
    try {
      const [currentMetrics, currentHealth] = await Promise.all([
        Promise.resolve(apiRef.current.getMetrics()),
        apiRef.current.getProviderHealth(),
      ]);

      setMetrics(currentMetrics);
      setHealth(currentHealth);
    } catch (error) {
      console.error("Failed to refresh AI metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    metrics,
    health,
    isLoading,
    refreshMetrics,
  };
}

/**
 * Hook for streaming AI responses (future enhancement)
 */
export function useStreamingAi() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const startStreaming = useCallback(async (request: AiRequest) => {
    // TODO: Implement streaming functionality
    // This would integrate with the streaming capabilities of the providers
    setIsStreaming(true);
    setStreamedContent("");
    setError(null);

    try {
      // Placeholder for streaming implementation
      console.log("Streaming not yet implemented:", request);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamedContent,
    error,
    startStreaming,
    stopStreaming,
  };
}
