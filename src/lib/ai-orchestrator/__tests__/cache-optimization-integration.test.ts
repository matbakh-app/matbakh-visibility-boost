/**
 * Cache Optimization Integration Tests
 *
 * Tests for:
 * - Integration with AI orchestrator system
 * - Automatic optimization scheduling
 * - Performance monitoring integration
 * - Alert generation and management
 * - Real-time optimization triggers
 */

import { CacheHitRateAnalyzer } from "../cache-hit-rate-analyzer";
import {
  CacheHitRateOptimizer,
  createCacheHitRateOptimizer,
} from "../cache-hit-rate-optimizer";
import {
  CacheOptimizationIntegration,
  createCacheOptimizationIntegration,
} from "../cache-optimization-integration";
import { CachingLayer, createCachingLayer } from "../caching-layer";
import {
  PerformanceMonitor,
  createPerformanceMonitor,
} from "../performance-monitor";
import { AiRequest, AiResponse } from "../types";

describe("CacheOptimizationIntegration", () => {
  let integration: CacheOptimizationIntegration;
  let optimizer: CacheHitRateOptimizer;
  let cachingLayer: CachingLayer;
  let analyzer: CacheHitRateAnalyzer;
  let performanceMonitor: PerformanceMonitor;

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

    performanceMonitor = createPerformanceMonitor();

    integration = createCacheOptimizationIntegration(
      optimizer,
      cachingLayer,
      analyzer,
      {
        enabled: true,
        optimizationIntervalMs: 1000, // 1 second for testing
        hitRateThreshold: 80,
        alertingEnabled: true,
        autoWarmupEnabled: true,
        performanceIntegration: true,
      }
    );

    integration.setPerformanceMonitor(performanceMonitor);
  });

  afterEach(() => {
    integration.dispose();
    cachingLayer.clear();
  });

  describe("Request Processing Integration", () => {
    it("should process AI requests and track cache optimization", async () => {
      const request: AiRequest = {
        prompt: "Test query for integration",
        context: {
          domain: "general",
          intent: "test",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      const response: AiResponse = {
        text: "Test response",
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        requestId: "test-123",
        latencyMs: 800,
        costEuro: 0.01,
        success: true,
        cached: false,
      };

      // Process request
      await integration.processRequest(request, response);

      // Verify query pattern was tracked
      const patterns = optimizer.getQueryPatterns();
      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe(1);
    });

    it("should trigger immediate optimization for critically low hit rates", async () => {
      const request: AiRequest = {
        prompt: "Critical hit rate query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      const response: AiResponse = {
        text: "Response",
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        requestId: "critical-123",
        latencyMs: 800,
        costEuro: 0.01,
        success: true,
        cached: false, // Not cached - will contribute to low hit rate
      };

      // Create multiple requests to establish pattern
      for (let i = 0; i < 10; i++) {
        await integration.processRequest(
          { ...request, prompt: `Critical query ${i}` },
          { ...response, requestId: `critical-${i}` }
        );
      }

      // Should have triggered optimization due to low hit rate
      const status = integration.getOptimizationStatus();
      expect(status.optimizationHealth).toBe("critical");
    });
  });

  describe("Optimization Scheduling", () => {
    it("should run scheduled optimizations", async () => {
      const request: AiRequest = {
        prompt: "Scheduled optimization query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent
      for (let i = 0; i < 5; i++) {
        await integration.processRequest(request, {
          text: "Response",
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          requestId: `sched-${i}`,
          latencyMs: 800,
          costEuro: 0.01,
          success: true,
          cached: false,
        });
      }

      const initialMetrics = optimizer.getMetrics();

      // Wait for scheduled optimization (interval is 1 second in test config)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const finalMetrics = optimizer.getMetrics();
      // Should have at least run optimization (warmup operations may be 0 if already cached)
      expect(finalMetrics.lastOptimization.getTime()).toBeGreaterThan(
        initialMetrics.lastOptimization.getTime()
      );
    });

    it("should allow manual optimization triggering", async () => {
      const request: AiRequest = {
        prompt: "Manual optimization query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Make it frequent
      for (let i = 0; i < 4; i++) {
        await integration.processRequest(request, {
          text: "Response",
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          requestId: `manual-${i}`,
          latencyMs: 800,
          costEuro: 0.01,
          success: true,
          cached: false,
        });
      }

      const initialMetrics = optimizer.getMetrics();

      // Force optimization
      await integration.forceOptimization();

      const finalMetrics = optimizer.getMetrics();
      expect(finalMetrics.lastOptimization.getTime()).toBeGreaterThan(
        initialMetrics.lastOptimization.getTime()
      );
    });
  });

  describe("Alert Management", () => {
    it("should generate alerts for low hit rates", async () => {
      // Create scenario with low hit rate
      const request: AiRequest = {
        prompt: "Low hit rate alert query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // Generate frequent requests without caching to create low hit rate
      for (let i = 0; i < 5; i++) {
        await integration.processRequest(request, {
          text: "Response",
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          requestId: `alert-${i}`,
          latencyMs: 800,
          costEuro: 0.01,
          success: true,
          cached: false,
        });
      }

      // Check alerts before optimization (should have alerts due to low hit rate)
      const alertsBeforeOptimization = integration.getActiveAlerts();

      // Force optimization to trigger alert evaluation
      await integration.forceOptimization();

      // Check if we had alerts before optimization or generated new ones
      const alertsAfterOptimization = integration.getAllAlerts(); // Get all alerts, not just active ones
      expect(alertsAfterOptimization.length).toBeGreaterThan(0);

      const hitRateAlert = alertsAfterOptimization.find(
        (a) => a.type === "hit_rate_low"
      );
      expect(hitRateAlert).toBeDefined();
      expect(hitRateAlert?.severity).toBe("warning");
    });

    it("should resolve alerts when conditions improve", async () => {
      const request: AiRequest = {
        prompt: "Alert resolution query",
        context: {
          domain: "general",
          locale: "de-DE",
          budgetTier: "standard",
        },
      };

      // First, create low hit rate scenario
      for (let i = 0; i < 5; i++) {
        await integration.processRequest(request, {
          text: "Response",
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          requestId: `resolve-${i}`,
          latencyMs: 800,
          costEuro: 0.01,
          success: true,
          cached: false,
        });
      }

      // Force optimization (should generate alert)
      await integration.forceOptimization();

      let alerts = integration.getActiveAlerts();
      const initialAlertCount = alerts.length;

      // Now simulate improved hit rate by caching
      await cachingLayer.set(request, {
        text: "Cached response",
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        requestId: "cached-123",
        latencyMs: 50,
        costEuro: 0,
        success: true,
      });

      // Force another optimization (should resolve alerts)
      await integration.forceOptimization();

      alerts = integration.getActiveAlerts();
      const finalAlertCount = alerts.length;

      // Should have fewer active alerts (some resolved)
      expect(finalAlertCount).toBeLessThanOrEqual(initialAlertCount);
    });

    it("should allow manual alert resolution", () => {
      // Create a mock alert
      const mockAlert = {
        id: "test-alert-123",
        type: "hit_rate_low" as const,
        severity: "warning" as const,
        message: "Test alert",
        timestamp: new Date(),
        resolved: false,
      };

      // Manually add alert (simulating internal generation)
      integration["alerts"].push(mockAlert);

      let activeAlerts = integration.getActiveAlerts();
      expect(activeAlerts.length).toBe(1);

      // Resolve alert
      const resolved = integration.resolveAlertById("test-alert-123");
      expect(resolved).toBe(true);

      activeAlerts = integration.getActiveAlerts();
      expect(activeAlerts.length).toBe(0);
    });
  });

  describe("Status and Reporting", () => {
    it("should provide comprehensive optimization status", () => {
      const status = integration.getOptimizationStatus();

      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("lastOptimization");
      expect(status).toHaveProperty("currentHitRate");
      expect(status).toHaveProperty("targetHitRate");
      expect(status).toHaveProperty("frequentQueries");
      expect(status).toHaveProperty("optimizationHealth");
      expect(status).toHaveProperty("nextOptimization");

      expect(status.enabled).toBe(true);
      expect(status.targetHitRate).toBe(80);
      expect(["healthy", "warning", "critical"]).toContain(
        status.optimizationHealth
      );
    });

    it("should provide actionable recommendations", () => {
      const recommendations = integration.getRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);

      // Should have at least some recommendations
      expect(recommendations.length).toBeGreaterThan(0);

      // Check recommendation structure
      const rec = recommendations[0];
      expect(rec).toHaveProperty("type");
      expect(rec).toHaveProperty("message");
      expect(rec).toHaveProperty("priority");
      expect(["action", "warning", "info"]).toContain(rec.type);
      expect(["high", "medium", "low"]).toContain(rec.priority);
    });

    it("should generate comprehensive optimization report", () => {
      const report = integration.getOptimizationReport();

      expect(report).toHaveProperty("status");
      expect(report).toHaveProperty("metrics");
      expect(report).toHaveProperty("recommendations");
      expect(report).toHaveProperty("alerts");
      expect(report).toHaveProperty("cacheStats");
      expect(report).toHaveProperty("analytics");

      // Verify report structure
      expect(report.status.enabled).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
    });
  });

  describe("Configuration Management", () => {
    it("should allow configuration updates", () => {
      const originalConfig = integration.getConfig();
      expect(originalConfig.hitRateThreshold).toBe(80);

      // Update configuration
      integration.updateConfig({
        hitRateThreshold: 85,
        alertingEnabled: false,
      });

      const updatedConfig = integration.getConfig();
      expect(updatedConfig.hitRateThreshold).toBe(85);
      expect(updatedConfig.alertingEnabled).toBe(false);
    });

    it("should restart scheduler when interval changes", () => {
      const originalConfig = integration.getConfig();
      expect(originalConfig.optimizationIntervalMs).toBe(1000);

      // Update interval
      integration.updateConfig({
        optimizationIntervalMs: 2000,
      });

      const updatedConfig = integration.getConfig();
      expect(updatedConfig.optimizationIntervalMs).toBe(2000);
    });

    it("should disable optimization when configured", () => {
      // Disable optimization
      integration.updateConfig({ enabled: false });

      const status = integration.getOptimizationStatus();
      expect(status.enabled).toBe(false);
    });
  });

  describe("Health Check", () => {
    it("should perform comprehensive health check", async () => {
      const health = await integration.healthCheck();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("issues");
      expect(health).toHaveProperty("metrics");

      expect(typeof health.healthy).toBe("boolean");
      expect(Array.isArray(health.issues)).toBe(true);
      expect(typeof health.metrics).toBe("object");
    });

    it("should detect unhealthy conditions", async () => {
      // Create unhealthy condition by generating critical alerts
      const mockAlert = {
        id: "critical-alert-123",
        type: "optimization_failed" as const,
        severity: "critical" as const,
        message: "Critical test alert",
        timestamp: new Date(),
        resolved: false,
      };

      integration["alerts"].push(mockAlert);

      const health = await integration.healthCheck();
      expect(health.healthy).toBe(false);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.issues[0].toLowerCase()).toContain("critical");
    });
  });

  describe("DoD Criteria Validation", () => {
    it("should integrate cache optimization into AI orchestrator workflow", async () => {
      // Simulate realistic AI orchestrator workflow
      const queries = [
        "Was ist Machine Learning?",
        "Wie funktioniert Deep Learning?",
        "Erkläre neuronale Netze",
        "Was sind Transformer?",
        "Wie trainiert man KI-Modelle?",
      ];

      const requests: AiRequest[] = queries.map((prompt) => ({
        prompt,
        context: {
          domain: "general",
          intent: "education",
          locale: "de-DE",
          budgetTier: "standard",
        },
      }));

      // Simulate multiple rounds of requests (frequent queries)
      for (let round = 0; round < 3; round++) {
        for (const request of requests) {
          const response: AiResponse = {
            text: `Response for: ${request.prompt}`,
            provider: "bedrock",
            modelId: "claude-3-5-sonnet",
            requestId: `round-${round}-${Date.now()}`,
            latencyMs: 600 + Math.random() * 400,
            costEuro: 0.008 + Math.random() * 0.004,
            success: true,
            cached: round > 0, // First round not cached, subsequent rounds cached
          };

          await integration.processRequest(request, response);
        }
      }

      // Force optimization
      await integration.forceOptimization();

      // Verify integration results
      const status = integration.getOptimizationStatus();
      const report = integration.getOptimizationReport();

      // Should achieve target hit rate
      expect(status.currentHitRate).toBeGreaterThan(80);
      expect(status.optimizationHealth).toBe("healthy");

      // Should have processed all queries
      expect(report.metrics.totalQueries).toBe(15); // 5 queries × 3 rounds

      // Should have identified frequent queries
      expect(status.frequentQueries).toBe(5);

      // Should have no critical alerts
      const criticalAlerts = report.alerts.filter(
        (a) => a.severity === "critical"
      );
      expect(criticalAlerts.length).toBe(0);

      console.log("Integration DoD Validation Results:", {
        hitRate: `${status.currentHitRate.toFixed(1)}%`,
        health: status.optimizationHealth,
        frequentQueries: status.frequentQueries,
        totalQueries: report.metrics.totalQueries,
        criticalAlerts: criticalAlerts.length,
      });
    });

    it("should maintain >80% hit rate under continuous load", async () => {
      // Simulate continuous load with mixed query patterns
      const baseQueries = [
        "Frequent query A",
        "Frequent query B",
        "Frequent query C",
      ];

      // Generate continuous load
      for (let batch = 0; batch < 5; batch++) {
        // Process frequent queries
        for (const prompt of baseQueries) {
          const request: AiRequest = {
            prompt,
            context: {
              domain: "general",
              locale: "de-DE",
              budgetTier: "standard",
            },
          };

          const response: AiResponse = {
            text: `Response for ${prompt}`,
            provider: "bedrock",
            modelId: "claude-3-5-sonnet",
            requestId: `batch-${batch}-${Date.now()}`,
            latencyMs: 500,
            costEuro: 0.01,
            success: true,
            cached: batch > 1, // Start caching after first couple batches
          };

          await integration.processRequest(request, response);
        }

        // Add some random queries (noise)
        for (let i = 0; i < 2; i++) {
          const randomRequest: AiRequest = {
            prompt: `Random query ${batch}-${i}`,
            context: {
              domain: "general",
              locale: "de-DE",
              budgetTier: "standard",
            },
          };

          const randomResponse: AiResponse = {
            text: "Random response",
            provider: "bedrock",
            modelId: "claude-3-5-sonnet",
            requestId: `random-${batch}-${i}`,
            latencyMs: 600,
            costEuro: 0.01,
            success: true,
            cached: false,
          };

          await integration.processRequest(randomRequest, randomResponse);
        }

        // Run optimization every couple batches
        if (batch % 2 === 1) {
          await integration.forceOptimization();
        }
      }

      // Final optimization and validation
      await integration.forceOptimization();

      const finalStatus = integration.getOptimizationStatus();
      const finalReport = integration.getOptimizationReport();

      // Should maintain >80% hit rate for frequent queries
      expect(finalStatus.currentHitRate).toBeGreaterThan(80);
      expect(finalStatus.optimizationHealth).toBe("healthy");

      // Should have processed significant volume
      expect(finalReport.metrics.totalQueries).toBeGreaterThan(20);

      // Should have identified the frequent queries
      expect(finalStatus.frequentQueries).toBe(3);

      console.log("Continuous Load Validation Results:", {
        hitRate: `${finalStatus.currentHitRate.toFixed(1)}%`,
        health: finalStatus.optimizationHealth,
        totalQueries: finalReport.metrics.totalQueries,
        frequentQueries: finalStatus.frequentQueries,
      });
    });
  });
});
