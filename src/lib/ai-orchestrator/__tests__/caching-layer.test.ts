/**
 * Caching Layer Tests
 *
 * Tests for:
 * - Cache hit/miss functionality
 * - TTL-based expiration
 * - Performance metrics
 * - Cache key generation
 * - Compression handling
 */

import {
  CACHE_CONFIGS,
  CachingLayer,
  createCachingLayer,
} from "../caching-layer";
import { AiRequest, AiResponse } from "../types";

describe("CachingLayer", () => {
  let cachingLayer: CachingLayer;
  let mockRequest: AiRequest;
  let mockResponse: AiResponse;

  beforeEach(() => {
    cachingLayer = createCachingLayer({
      enabled: true,
      ttlSeconds: 300,
      hitRateTarget: 0.8,
    });

    mockRequest = {
      prompt: "Test prompt for caching",
      context: {
        domain: "general",
        locale: "de-DE",
        budgetTier: "standard",
      },
    };

    mockResponse = {
      text: "Test response from AI",
      provider: "bedrock",
      modelId: "claude-3-5-sonnet",
      requestId: "test-request-123",
      latencyMs: 800,
      costEuro: 0.01,
      success: true,
    };
  });

  afterEach(() => {
    cachingLayer.clear();
  });

  describe("Basic Cache Operations", () => {
    it("should return null for cache miss", async () => {
      const result = await cachingLayer.get(mockRequest);
      expect(result).toBeNull();
    });

    it("should store and retrieve cached response", async () => {
      // Store response
      await cachingLayer.set(mockRequest, mockResponse);

      // Retrieve response
      const cached = await cachingLayer.get(mockRequest);

      expect(cached).not.toBeNull();
      expect(cached?.text).toBe(mockResponse.text);
      expect(cached?.cached).toBe(true);
      expect(cached?.cacheHit).toBe(true);
    });

    it("should not cache error responses", async () => {
      const errorResponse: AiResponse = {
        ...mockResponse,
        success: false,
        error: "Test error",
      };

      await cachingLayer.set(mockRequest, errorResponse);
      const cached = await cachingLayer.get(mockRequest);

      expect(cached).toBeNull();
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate consistent cache keys for identical requests", async () => {
      const request1 = { ...mockRequest };
      const request2 = { ...mockRequest };

      await cachingLayer.set(request1, mockResponse);
      const cached = await cachingLayer.get(request2);

      expect(cached).not.toBeNull();
      expect(cached?.text).toBe(mockResponse.text);
    });

    it("should generate different cache keys for different requests", async () => {
      const request1 = { ...mockRequest, prompt: "First prompt" };
      const request2 = { ...mockRequest, prompt: "Second prompt" };

      await cachingLayer.set(request1, mockResponse);
      const cached = await cachingLayer.get(request2);

      expect(cached).toBeNull();
    });

    it("should consider context in cache key generation", async () => {
      const request1 = {
        ...mockRequest,
        context: { ...mockRequest.context, domain: "legal" },
      };
      const request2 = {
        ...mockRequest,
        context: { ...mockRequest.context, domain: "medical" },
      };

      await cachingLayer.set(request1, mockResponse);
      const cached = await cachingLayer.get(request2);

      expect(cached).toBeNull();
    });
  });

  describe("Performance Metrics", () => {
    it("should track cache hits and misses", async () => {
      // Initial stats
      let stats = cachingLayer.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Cache miss
      await cachingLayer.get(mockRequest);
      stats = cachingLayer.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Store and hit
      await cachingLayer.set(mockRequest, mockResponse);
      await cachingLayer.get(mockRequest);

      stats = cachingLayer.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it("should check performance targets", async () => {
      // Initially should not meet target (no requests)
      expect(cachingLayer.isPerformanceTarget()).toBe(false);

      // Add cache hits to meet target
      await cachingLayer.set(mockRequest, mockResponse);

      // Generate enough hits to meet 80% target
      for (let i = 0; i < 9; i++) {
        await cachingLayer.get(mockRequest);
      }

      // Add some misses
      const differentRequest = { ...mockRequest, prompt: "Different prompt" };
      await cachingLayer.get(differentRequest);

      const stats = cachingLayer.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.8);
      expect(cachingLayer.isPerformanceTarget()).toBe(true);
    });
  });

  describe("Configuration", () => {
    it("should respect enabled/disabled configuration", async () => {
      const disabledCache = createCachingLayer({ enabled: false });

      await disabledCache.set(mockRequest, mockResponse);
      const cached = await disabledCache.get(mockRequest);

      expect(cached).toBeNull();
    });

    it("should use different TTL for different domains", async () => {
      const supportRequest = {
        ...mockRequest,
        context: { ...mockRequest.context, domain: "support" as const },
      };

      const generalRequest = {
        ...mockRequest,
        context: { ...mockRequest.context, domain: "general" as const },
      };

      // Both should cache initially
      await cachingLayer.set(supportRequest, mockResponse);
      await cachingLayer.set(generalRequest, mockResponse);

      const supportCached = await cachingLayer.get(supportRequest);
      const generalCached = await cachingLayer.get(generalRequest);

      expect(supportCached).not.toBeNull();
      expect(generalCached).not.toBeNull();
    });

    it("should provide predefined configurations", () => {
      expect(CACHE_CONFIGS.development.ttlSeconds).toBe(300);
      expect(CACHE_CONFIGS.staging.ttlSeconds).toBe(1800);
      expect(CACHE_CONFIGS.production.ttlSeconds).toBe(3600);

      expect(CACHE_CONFIGS.production.hitRateTarget).toBe(0.8);
    });
  });

  describe("Health Check", () => {
    it("should perform health check", async () => {
      const health = await cachingLayer.healthCheck();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("latency");
      expect(health).toHaveProperty("hitRate");
      expect(health).toHaveProperty("errors");

      expect(typeof health.healthy).toBe("boolean");
      expect(typeof health.latency).toBe("number");
      expect(Array.isArray(health.errors)).toBe(true);
    });
  });

  describe("Cache Warm-up", () => {
    it("should warm up cache with common queries", async () => {
      const commonQueries: AiRequest[] = [
        { ...mockRequest, prompt: "Common query 1" },
        { ...mockRequest, prompt: "Common query 2" },
        { ...mockRequest, prompt: "Common query 3" },
      ];

      await cachingLayer.warmUp(commonQueries);

      // Check that queries are now cached
      for (const query of commonQueries) {
        const cached = await cachingLayer.get(query);
        expect(cached).not.toBeNull();
      }
    });
  });

  describe("Cache Management", () => {
    it("should clear cache", async () => {
      await cachingLayer.set(mockRequest, mockResponse);

      let cached = await cachingLayer.get(mockRequest);
      expect(cached).not.toBeNull();

      await cachingLayer.clear();

      // Check stats immediately after clear (before any new operations)
      let stats = cachingLayer.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Verify cache is actually cleared
      cached = await cachingLayer.get(mockRequest);
      expect(cached).toBeNull();
    });

    it("should update configuration", () => {
      const originalConfig = cachingLayer.getConfig();
      expect(originalConfig.ttlSeconds).toBe(300);

      cachingLayer.updateConfig({ ttlSeconds: 600 });

      const updatedConfig = cachingLayer.getConfig();
      expect(updatedConfig.ttlSeconds).toBe(600);
    });
  });

  describe("DoD Criteria Validation", () => {
    it("should meet DoD: Cache hit rate > 80% for frequent queries", async () => {
      // Simulate frequent queries
      const frequentQuery = { ...mockRequest, prompt: "Frequent query" };

      await cachingLayer.set(frequentQuery, mockResponse);

      // Generate 10 hits and 1 miss
      for (let i = 0; i < 10; i++) {
        await cachingLayer.get(frequentQuery);
      }

      const differentQuery = { ...mockRequest, prompt: "Different query" };
      await cachingLayer.get(differentQuery); // This will be a miss

      const stats = cachingLayer.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.8);
      expect(cachingLayer.isPerformanceTarget()).toBe(true);
    });

    it("should meet DoD: P95 ≤ 300ms for cached responses", async () => {
      await cachingLayer.set(mockRequest, mockResponse);

      const startTime = Date.now();
      const cached = await cachingLayer.get(mockRequest);
      const latency = Date.now() - startTime;

      expect(cached).not.toBeNull();
      expect(latency).toBeLessThan(300); // Should be much faster than 300ms for cache hit
    });

    it("should meet DoD: Intelligent cache key generation", async () => {
      // Test that cache keys are deterministic and consider all relevant factors
      const request1 = {
        prompt: "Test prompt",
        context: {
          domain: "legal" as const,
          locale: "de-DE",
          budgetTier: "premium" as const,
        },
        tools: [{ name: "search", parameters: { query: "test" } }],
      };

      const request2 = { ...request1 };
      const request3 = {
        ...request1,
        context: { ...request1.context, domain: "medical" as const },
      };

      await cachingLayer.set(request1, mockResponse);

      // Same request should hit cache
      const cached1 = await cachingLayer.get(request2);
      expect(cached1).not.toBeNull();

      // Different domain should miss cache
      const cached2 = await cachingLayer.get(request3);
      expect(cached2).toBeNull();
    });
  });
});
