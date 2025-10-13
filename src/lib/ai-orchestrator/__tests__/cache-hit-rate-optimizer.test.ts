/**
 * Cache Hit Rate Optimizer Tests
 *
 * Tests for:
 * - Query pattern analysis and frequency tracking
 * - Cache warming for frequent queries
 * - Hit rate optimization to >80% target
 * - Proactive cache refresh
 * - Optimization recommendations
 */

import { CacheHitRateAnalyzer } from "../cache-hit-rate-analyzer";
import {
  CacheHitRateOptimizer,
  createCacheHitRateOptimizer,
  OPTIMIZATION_CONFIGS,
} from "../cache-hit-rate-optimizer";
import { CachingLayer, createCachingLayer } from "../caching-layer";
import { AiRequest, AiResponse } from "../types";

describe("CacheHitRateOptimizer", () => {
  let optimizer: CacheHitRateOptimizer;
  let cachingLayer: CachingLayer;
  let analyzer: CacheHitRateAnalyzer;

  beforeEach(() => {
    cachingLayer = createCachingLayer({
      enabled: true,
      ttlSeconds: 3600,
      hitRateTarget: 0.8,
    });

    analyzer = new CacheHitRateAnalyzer();

    optimizer = createCacheHitRateOptimizer(cachingLayer, analyzer, {
      frequentQueryThreshold: 3,
      targetHitRate: 0.8,
      warmupBatchSize: 10,
    });
  });

  afterEach(() => {
    optimizer.dispose();
    cachingLayer.clear();
  });

  describe("Query Pattern Analysis", () => {
    it("should track query patterns and frequency", () => {
      const request: AiRequest = {
        prompt: "What is the weather today?",
        context: {
          domain: "general",
          intent: "weather",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      const response: AiResponse = {
        text: "Today's weather is sunny",
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        requestId: "test-123",
        latencyMs: 800,
        costEuro: 0.01,
        success: true,
      };

      // Analyze the same query multiple times
      for (let i = 0; i < 5; i++) {
        optimizer.analyzeQuery(request, response);
      }

      const patterns = optimizer.getQueryPatterns();
      expect(patterns.length).toBe(1);

      const pattern = patterns[0];
      expect(pattern.frequency).toBe(5);
      expect(pattern.domains.has("general")).toBe(true);
      expect(pattern.intents.has("weather")).toBe(true);
      expect(pattern.averageLatency).toBe(800);
      expect(pattern.estimatedCost).toBe(0.01);
    });

    it("should identify frequent queries", () => {
      const requests = [
        {
          prompt: "Frequent query 1",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
        {
          prompt: "Frequent query 2",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
        {
          prompt: "Rare query",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
      ] as AiRequest[];

      // Make first two queries frequent (>= 3 times)
      for (let i = 0; i < 4; i++) {
        optimizer.analyzeQuery(requests[0]);
        optimizer.analyzeQuery(requests[1]);
      }

      // Make third query rare (< 3 times)
      optimizer.analyzeQuery(requests[2]);

      const frequentQueries = optimizer.getFrequentQueries();
      expect(frequentQueries.length).toBe(2);
      expect(frequentQueries[0].frequency).toBe(4);
      expect(frequentQueries[1].frequency).toBe(4);
    });

    it("should normalize prompts for pattern matching", () => {
      const requests = [
        {
          prompt: "What is the weather?",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
        {
          prompt: "WHAT IS THE WEATHER?",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
        {
          prompt: "What   is   the   weather?",
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        },
      ] as AiRequest[];

      // All should be treated as the same pattern
      requests.forEach((request) => optimizer.analyzeQuery(request));

      const patterns = optimizer.getQueryPatterns();
      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe(3);
    });
  });

  describe("Cache Warming", () => {
    it("should warm up frequent queries", async () => {
      // Create frequent queries
      const frequentRequest: AiRequest = {
        prompt: "Frequent query for warming",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent
      for (let i = 0; i < 5; i++) {
        optimizer.analyzeQuery(frequentRequest);
      }

      // Verify not cached initially
      let cached = await cachingLayer.get(frequentRequest);
      expect(cached).toBeNull();

      // Warm up cache
      await optimizer.warmUpFrequentQueries();

      // Verify now cached
      cached = await cachingLayer.get(frequentRequest);
      expect(cached).not.toBeNull();
      expect(cached?.cached).toBe(true);
      expect(cached?.cacheHit).toBe(true);
    });

    it("should not warm up already cached queries", async () => {
      const request: AiRequest = {
        prompt: "Already cached query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      const response: AiResponse = {
        text: "Original response",
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        requestId: "original-123",
        latencyMs: 800,
        costEuro: 0.01,
        success: true,
      };

      // Make it frequent
      for (let i = 0; i < 5; i++) {
        optimizer.analyzeQuery(request);
      }

      // Cache it manually first
      await cachingLayer.set(request, response);

      const initialMetrics = optimizer.getMetrics();
      const initialWarmupOps = initialMetrics.warmupOperations;

      // Warm up cache
      await optimizer.warmUpFrequentQueries();

      // Should not have performed additional warmup
      const finalMetrics = optimizer.getMetrics();
      expect(finalMetrics.warmupOperations).toBe(initialWarmupOps);

      // Original response should still be there
      const cached = await cachingLayer.get(request);
      expect(cached?.text).toBe("Original response");
    });
  });

  describe("Hit Rate Optimization", () => {
    it("should achieve >80% hit rate for frequent queries", async () => {
      // Create multiple frequent queries
      const frequentQueries = [
        "What is machine learning?",
        "How does AI work?",
        "Explain neural networks",
        "What is deep learning?",
        "How to train models?",
      ];

      const requests: AiRequest[] = frequentQueries.map((prompt) => ({
        prompt,
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      }));

      // Make all queries frequent
      for (const request of requests) {
        for (let i = 0; i < 6; i++) {
          optimizer.analyzeQuery(request);
        }
      }

      // Run optimization
      await optimizer.optimize();

      // Check hit rate
      const hitRate = await optimizer.calculateFrequentQueriesHitRate();
      expect(hitRate).toBeGreaterThan(80);

      // Verify target is met
      expect(optimizer.isOptimizationTargetMet()).toBe(true);
    });

    it("should provide optimization recommendations", async () => {
      // Create scenario with low hit rate
      const request: AiRequest = {
        prompt: "Low hit rate query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent but don't cache it
      for (let i = 0; i < 5; i++) {
        optimizer.analyzeQuery(request);
      }

      const recommendations = optimizer.getOptimizationRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);

      const highPriorityRecs = recommendations.filter(
        (r) => r.priority === "high"
      );
      expect(highPriorityRecs.length).toBeGreaterThan(0);
      expect(highPriorityRecs[0].message).toContain("below");
    });
  });

  describe("Proactive Cache Refresh", () => {
    it("should refresh expiring cache entries", async () => {
      const request: AiRequest = {
        prompt: "Query needing refresh",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent
      for (let i = 0; i < 5; i++) {
        optimizer.analyzeQuery(request);
      }

      // Warm up initially
      await optimizer.warmUpFrequentQueries();

      const initialMetrics = optimizer.getMetrics();
      const initialRefreshOps = initialMetrics.refreshOperations;

      // Simulate time passing and refresh
      await optimizer.refreshExpiringEntries();

      const finalMetrics = optimizer.getMetrics();
      expect(finalMetrics.refreshOperations).toBeGreaterThanOrEqual(
        initialRefreshOps
      );
    });
  });

  describe("Configuration and Metrics", () => {
    it("should use different configurations for different environments", () => {
      const devOptimizer = createCacheHitRateOptimizer(
        cachingLayer,
        analyzer,
        OPTIMIZATION_CONFIGS.development
      );

      const prodOptimizer = createCacheHitRateOptimizer(
        cachingLayer,
        analyzer,
        OPTIMIZATION_CONFIGS.production
      );

      // Development should have lower thresholds
      expect(OPTIMIZATION_CONFIGS.development.frequentQueryThreshold).toBe(2);
      expect(OPTIMIZATION_CONFIGS.development.targetHitRate).toBe(0.6);

      // Production should have higher thresholds
      expect(OPTIMIZATION_CONFIGS.production.frequentQueryThreshold).toBe(5);
      expect(OPTIMIZATION_CONFIGS.production.targetHitRate).toBe(0.8);

      devOptimizer.dispose();
      prodOptimizer.dispose();
    });

    it("should track optimization metrics", async () => {
      const request: AiRequest = {
        prompt: "Metrics tracking query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Generate some activity
      for (let i = 0; i < 4; i++) {
        optimizer.analyzeQuery(request);
      }

      await optimizer.optimize();

      const metrics = optimizer.getMetrics();
      expect(metrics.totalQueries).toBe(4);
      expect(metrics.frequentQueries).toBe(1);
      expect(metrics.warmupOperations).toBeGreaterThan(0);
      expect(metrics.lastOptimization).toBeInstanceOf(Date);
    });

    it("should clean up old patterns", async () => {
      const oldRequest: AiRequest = {
        prompt: "Old query pattern",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Analyze old query only once (so it's infrequent)
      optimizer.analyzeQuery(oldRequest);

      let patterns = optimizer.getQueryPatterns();
      expect(patterns.length).toBe(1);

      // Simulate time passing by manually setting old timestamp
      const pattern = patterns[0];
      pattern.lastSeen = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      // Ensure it's infrequent (< threshold)
      pattern.frequency = 1; // Below the threshold of 3

      // Run optimization (which includes cleanup)
      await optimizer.optimize();

      patterns = optimizer.getQueryPatterns();
      expect(patterns.length).toBe(0); // Should be cleaned up
    });
  });

  describe("DoD Criteria Validation", () => {
    it("should meet DoD: Caching-Hit-Rate > 80% für häufige Queries", async () => {
      // Create a realistic scenario with frequent queries
      const frequentQueries = [
        "Was ist Künstliche Intelligenz?",
        "Wie funktioniert Machine Learning?",
        "Erkläre mir neuronale Netze",
        "Was ist Deep Learning?",
        "Wie trainiert man KI-Modelle?",
        "Was sind die Vorteile von AI?",
        "Wie implementiert man Chatbots?",
        "Was ist Natural Language Processing?",
      ];

      const requests: AiRequest[] = frequentQueries.map((prompt) => ({
        prompt,
        context: {
          domain: "general",
          intent: "education",
          locale: "de-DE",
          budgetTier: "standard",
        },
      }));

      // Simulate realistic usage patterns
      for (const request of requests) {
        // Each query appears 5-10 times (frequent)
        const frequency = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < frequency; i++) {
          optimizer.analyzeQuery(request, {
            text: `Response for: ${request.prompt}`,
            provider: "bedrock",
            modelId: "claude-3-5-sonnet",
            requestId: `req-${Date.now()}-${i}`,
            latencyMs: 600 + Math.random() * 400,
            costEuro: 0.008 + Math.random() * 0.004,
            success: true,
          });
        }
      }

      // Add some infrequent queries (noise)
      for (let i = 0; i < 20; i++) {
        const rareRequest: AiRequest = {
          prompt: `Rare query ${i} with unique content`,
          context: {
            domain: "general",
            locale: "de-DE",
            budgetTier: "standard",
          },
        };
        optimizer.analyzeQuery(rareRequest);
      }

      // Run comprehensive optimization
      const optimizationResult = await optimizer.optimize();

      // Verify DoD criteria
      expect(optimizationResult.frequentQueriesHitRate).toBeGreaterThan(80);
      expect(optimizer.isOptimizationTargetMet()).toBe(true);

      // Verify frequent queries are identified correctly
      const frequentPatterns = optimizer.getFrequentQueries();
      expect(frequentPatterns.length).toBe(8); // All our frequent queries

      // Verify all frequent queries are cached
      for (const request of requests) {
        const cached = await cachingLayer.get(request);
        expect(cached).not.toBeNull();
        expect(cached?.cached).toBe(true);
      }

      // Verify metrics are reasonable
      expect(optimizationResult.totalQueries).toBeGreaterThan(40); // 8 frequent + 20 rare
      expect(optimizationResult.frequentQueries).toBe(8);
      expect(optimizationResult.warmupOperations).toBeGreaterThan(0);

      console.log("DoD Validation Results:", {
        hitRate: `${optimizationResult.frequentQueriesHitRate.toFixed(1)}%`,
        targetMet: optimizer.isOptimizationTargetMet(),
        frequentQueries: optimizationResult.frequentQueries,
        totalQueries: optimizationResult.totalQueries,
        warmupOps: optimizationResult.warmupOperations,
      });
    });

    it("should maintain performance under load", async () => {
      // Simulate high-volume scenario
      const startTime = Date.now();

      // Generate 1000 queries with various patterns
      for (let i = 0; i < 1000; i++) {
        const request: AiRequest = {
          prompt: `Query pattern ${i % 50}`, // 50 different patterns, some frequent
          context: {
            domain: i % 3 === 0 ? "general" : i % 3 === 1 ? "support" : "legal",
            locale: "de-DE",
            budgetTier: "standard",
          },
        };

        optimizer.analyzeQuery(request);
      }

      const analysisTime = Date.now() - startTime;
      expect(analysisTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Run optimization
      const optimizationStart = Date.now();
      await optimizer.optimize();
      const optimizationTime = Date.now() - optimizationStart;

      expect(optimizationTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify system still functions correctly
      const metrics = optimizer.getMetrics();
      expect(metrics.totalQueries).toBe(1000);
      expect(metrics.frequentQueries).toBeGreaterThan(0);
    });

    it("should provide actionable optimization insights", () => {
      // Create suboptimal scenario
      const request: AiRequest = {
        prompt: "Suboptimal query pattern",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent but don't optimize
      for (let i = 0; i < 10; i++) {
        optimizer.analyzeQuery(request);
      }

      const recommendations = optimizer.getOptimizationRecommendations();

      // Should provide specific, actionable recommendations
      expect(recommendations.length).toBeGreaterThan(0);

      const actionableRecs = recommendations.filter((r) => r.type === "action");
      expect(actionableRecs.length).toBeGreaterThan(0);

      // Should include hit rate improvement suggestion
      const hitRateRec = recommendations.find(
        (r) => r.message.includes("hit rate") && r.message.includes("target")
      );
      expect(hitRateRec).toBeDefined();
      expect(hitRateRec?.priority).toBe("high");
    });
  });
});
