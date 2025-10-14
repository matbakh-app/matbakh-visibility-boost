/**
 * Test Mocks for Unified AI API
 *
 * Provides complete mock implementations for all dependencies
 */

import { jest } from "@jest/globals";
import { Provider } from "./types";

// Monitor Interface
export interface AiMonitor {
  recordError(err: Error, meta?: any): Promise<void>;
  recordSuccess(meta?: any): Promise<void>;
  recordAttempt?(
    provider: string,
    latencyMs: number,
    success: boolean
  ): Promise<void>;
  recordCacheHit?(): Promise<void>;
  recordLatency(latencyMs: number, meta?: any): Promise<void>;
  recordHealthCheck(
    provider: string,
    success: boolean,
    latency: number
  ): Promise<void>;
  getHealth?(): Promise<any>;
  getProviderMetrics(provider: string): Promise<any>;
  shutdown(): Promise<void>;
}

// Cache Interface
export interface AiCache<T = any> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  clear(): Promise<void>;
}

// Circuit Breaker Interface
export interface CircuitBreaker {
  getState(): "closed" | "open" | "half-open";
  isOpen(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  reset(): void;
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

// Feature Flags Interface
export interface FeatureFlags {
  isProviderEnabled(provider: string): Promise<boolean>;
  setProviderEnabled(provider: string, enabled: boolean): Promise<void>;
}

// Provider Adapter Interface
export interface ProviderAdapter {
  name: Provider;
  generateResponse(request: any): Promise<any>;
  testConnection?(): Promise<{ success: boolean }>;
  healthCheck?(): Promise<void>;
}

/**
 * Create monitor mock
 */
export const createMonitorMock = (): AiMonitor => ({
  recordError: jest.fn().mockResolvedValue(void 0),
  recordSuccess: jest.fn().mockResolvedValue(void 0),
  recordAttempt: jest.fn().mockResolvedValue(void 0),
  recordCacheHit: jest.fn().mockResolvedValue(void 0),
  recordLatency: jest.fn().mockResolvedValue(void 0),
  recordHealthCheck: jest.fn().mockResolvedValue(void 0),
  getHealth: jest.fn().mockResolvedValue({ providers: [] }),
  getProviderMetrics: jest.fn().mockResolvedValue({
    averageLatency: 500,
    errorRate: 0.02,
  }),
  shutdown: jest.fn().mockResolvedValue(void 0),
});

/**
 * Create cache mock
 */
export const createCacheMock = (): AiCache => ({
  get: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(void 0),
  clear: jest.fn().mockResolvedValue(void 0),
});

/**
 * Create circuit breaker mock
 */
export const createCircuitBreakerMock = (): any => ({
  getState: jest.fn().mockReturnValue("closed"),
  isOpen: jest.fn().mockReturnValue(false),
  recordSuccess: jest.fn(),
  recordFailure: jest.fn(),
  reset: jest.fn(),
  execute: jest.fn().mockImplementation(async (operation) => {
    return await operation();
  }),
});

/**
 * Create feature flags mock
 */
export const createFeatureFlagsMock = (): FeatureFlags => ({
  isProviderEnabled: jest.fn().mockResolvedValue(true),
  setProviderEnabled: jest.fn().mockResolvedValue(void 0),
});

/**
 * Create provider adapter mock
 */
export const createProviderAdapterMock = (
  provider: Provider
): ProviderAdapter => ({
  name: provider,
  generateResponse: jest.fn().mockResolvedValue({
    content: `Mock response from ${provider}`,
    provider,
    requestId: "mock-request-id",
    processingTime: 500,
    success: true,
  }),
  testConnection: jest.fn().mockResolvedValue({ success: true }),
  healthCheck: jest.fn().mockResolvedValue(void 0),
});

/**
 * Create multi-provider integration mock
 */
export const createMultiProviderMock = () => ({
  routeRequest: jest.fn().mockResolvedValue({
    content: "Mock multi-provider response",
    provider: "bedrock" as Provider,
    requestId: "mock-request-id",
    processingTime: 500,
    success: true,
  }),
  getProviderHealth: jest.fn().mockResolvedValue([
    {
      provider: "bedrock" as Provider,
      status: "healthy" as const,
      latency: 500,
      errorRate: 0.01,
      lastCheck: new Date(),
      circuitBreakerState: "closed" as const,
    },
  ]),
  updateProviderConfig: jest.fn(),
});

/**
 * Create router gateway mock
 */
export const createRouterGatewayMock = () => ({
  execute: jest.fn().mockResolvedValue({
    provider: "bedrock" as Provider,
    modelId: "claude-3-5-sonnet",
    text: "Mock router response",
    latencyMs: 500,
    costEuro: 0.01,
    success: true,
    requestId: "mock-request-id",
  }),
  getAvailableModels: jest.fn().mockReturnValue([]),
  updateModelCapability: jest.fn(),
});

/**
 * Setup all mocks for unified AI API tests
 */
export const setupUnifiedAiMocks = () => {
  const monitor = createMonitorMock();
  const cache = createCacheMock();
  const circuitBreakers = new Map<Provider, CircuitBreaker>();
  const featureFlags = createFeatureFlagsMock();
  const multiProvider = createMultiProviderMock();
  const router = createRouterGatewayMock();

  // Setup circuit breakers for each provider
  (["bedrock", "google", "meta"] as Provider[]).forEach((provider) => {
    circuitBreakers.set(provider, createCircuitBreakerMock());
  });

  return {
    monitor,
    cache,
    circuitBreakers,
    featureFlags,
    multiProvider,
    router,
  };
};

/**
 * Mock timeout promise for testing
 */
export const createTimeoutMock = (timeoutMs: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
};
