/**
 * Hybrid Health Monitor Tests
 *
 * Comprehensive test suite for Hybrid Health Monitor covering
 * health monitoring, routing efficiency analysis, and optimization recommendations.
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import {
  HybridHealthConfig,
  HybridHealthMonitor,
} from "../hybrid-health-monitor";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../direct-bedrock-client");
jest.mock("../mcp-router");
jest.mock("../intelligent-router");

describe("HybridHealthMonitor", () => {
  let hybridHealthMonitor: HybridHealthMonitor;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockMcpRouter: jest.Mocked<MCPRouter>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;
  let mockConfig: HybridHealthConfig;

  beforeEach(() => {
    // Create mocks
    mockDirectBedrockClient = {
      getHealthStatus: jest.fn(),
      executeSupportOperation: jest.fn(),
      isAvailable: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockMcpRouter = {
      getHealthStatus: jest.fn(),
      executeSupportOperation: jest.fn(),
      isAvailable: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockIntelligentRouter = {
      executeSupportOperation: jest.fn(),
      makeRoutingDecision: jest.fn(),
      checkRouteHealth: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockConfig = {
      checkInterval: 1000, // 1 second for testing
      analysisInterval: 2000, // 2 seconds for testing
      performanceWindow: 60000, // 1 minute for testing
      healthThresholds: {
        minHealthScore: 70,
        maxLatency: 5000,
        minSuccessRate: 0.95,
        maxFallbackRate: 0.1,
      },
      enableContinuousMonitoring: false, // Disable for testing
      enablePerformanceOptimization: false, // Disable for testing
      alertThresholds: {
        criticalHealthScore: 50,
        warningLatency: 3000,
        criticalLatency: 10000,
      },
    };

    // Mock feature flags to be enabled
    const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
    mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(true);

    // Mock health status responses
    mockDirectBedrockClient.getHealthStatus.mockResolvedValue({
      isHealthy: true,
      latencyMs: 100,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      circuitBreakerState: "closed",
    });

    mockMcpRouter.getHealthStatus.mockResolvedValue({
      route: "mcp",
      isHealthy: true,
      latencyMs: 200,
      successRate: 0.98,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      connectionStatus: "connected",
      queueSize: 5,
      pendingOperations: 2,
      lastSuccessfulOperation: new Date(),
      errorRate: 0.02,
    });

    hybridHealthMonitor = new HybridHealthMonitor(
      mockDirectBedrockClient,
      mockMcpRouter,
      mockIntelligentRouter,
      mockConfig
    );
  });

  afterEach(() => {
    hybridHealthMonitor.destroy();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default configuration", () => {
      const defaultMonitor = new HybridHealthMonitor(
        mockDirectBedrockClient,
        mockMcpRouter,
        mockIntelligentRouter
      );

      expect(defaultMonitor).toBeDefined();
      expect(defaultMonitor.getMetrics().uptime).toBeGreaterThanOrEqual(0);

      defaultMonitor.destroy();
    });

    it("should merge custom configuration with defaults", () => {
      const customConfig = { checkInterval: 5000 };
      const customMonitor = new HybridHealthMonitor(
        mockDirectBedrockClient,
        mockMcpRouter,
        mockIntelligentRouter,
        customConfig
      );

      expect(customMonitor).toBeDefined();
      customMonitor.destroy();
    });
  });

  describe("getHealthStatus", () => {
    it("should return comprehensive health status", async () => {
      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.overall).toBeDefined();
      expect(healthStatus.overall.isHealthy).toBeDefined();
      expect(healthStatus.overall.healthScore).toBeGreaterThanOrEqual(0);
      expect(healthStatus.overall.healthScore).toBeLessThanOrEqual(100);

      expect(healthStatus.routes).toBeDefined();
      expect(healthStatus.routes.mcp).toBeDefined();
      expect(healthStatus.routes.directBedrock).toBeDefined();

      expect(healthStatus.routing).toBeDefined();
      expect(healthStatus.routing.efficiency).toBeGreaterThanOrEqual(0);
      expect(healthStatus.routing.efficiency).toBeLessThanOrEqual(1);

      expect(healthStatus.performance).toBeDefined();
      expect(healthStatus.recommendations).toBeDefined();
      expect(healthStatus.recommendations.immediate).toBeInstanceOf(Array);
      expect(healthStatus.recommendations.optimization).toBeInstanceOf(Array);
      expect(healthStatus.recommendations.maintenance).toBeInstanceOf(Array);
    });

    it("should handle healthy routes correctly", async () => {
      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.routes.mcp.isHealthy).toBe(true);
      expect(healthStatus.routes.directBedrock.isHealthy).toBe(true);
      expect(healthStatus.overall.isHealthy).toBe(true);
      expect(healthStatus.overall.healthScore).toBeGreaterThan(0);
    });

    it("should handle unhealthy MCP route", async () => {
      mockMcpRouter.getHealthStatus.mockResolvedValue({
        route: "mcp",
        isHealthy: false,
        latencyMs: 8000,
        successRate: 0.5,
        lastCheck: new Date(),
        consecutiveFailures: 10,
        connectionStatus: "error",
        queueSize: 100,
        pendingOperations: 50,
        lastSuccessfulOperation: new Date(Date.now() - 300000), // 5 minutes ago
        errorRate: 0.5,
      });

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.routes.mcp.isHealthy).toBe(false);
      expect(healthStatus.overall.healthScore).toBeLessThan(100);
      expect(healthStatus.recommendations.immediate).toContain(
        "MCP route is unhealthy - check connection and configuration"
      );
    });

    it("should handle unhealthy Direct Bedrock route", async () => {
      mockDirectBedrockClient.getHealthStatus.mockResolvedValue({
        isHealthy: false,
        latencyMs: 12000,
        lastCheck: new Date(),
        consecutiveFailures: 8,
        circuitBreakerState: "open",
        error: "Connection timeout",
      });

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.routes.directBedrock.isHealthy).toBe(false);
      expect(healthStatus.overall.healthScore).toBeLessThan(100);
      expect(healthStatus.recommendations.immediate).toContain(
        "Direct Bedrock route is unhealthy - check AWS connectivity"
      );
    });

    it("should handle health check errors gracefully", async () => {
      mockMcpRouter.getHealthStatus.mockRejectedValue(
        new Error("Health check failed")
      );

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.overall.isHealthy).toBe(false);
      expect(healthStatus.overall.healthScore).toBe(0);
    });
  });

  describe("analyzeRoutingEfficiency", () => {
    beforeEach(() => {
      // Add some routing decisions and requests for analysis
      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "mcp",
        10,
        "Optimal route"
      );
      hybridHealthMonitor.recordRoutingDecision(
        "direct",
        "direct",
        15,
        "Optimal route"
      );
      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "direct",
        25,
        "MCP unavailable"
      );

      hybridHealthMonitor.recordRequestPerformance(
        "mcp",
        200,
        true,
        "analysis"
      );
      hybridHealthMonitor.recordRequestPerformance(
        "direct",
        150,
        true,
        "emergency"
      );
      hybridHealthMonitor.recordRequestPerformance(
        "mcp",
        300,
        false,
        "processing"
      );
      hybridHealthMonitor.recordRequestPerformance(
        "direct",
        100,
        true,
        "infrastructure"
      );
    });

    it("should analyze routing efficiency", async () => {
      const analysis = await hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(analysis).toBeDefined();
      expect(analysis.analysisId).toBeDefined();
      expect(analysis.timestamp).toBeInstanceOf(Date);
      expect(analysis.totalDecisions).toBe(3);
      expect(analysis.optimalDecisions).toBe(2);
      expect(analysis.suboptimalDecisions).toBe(1);
      expect(analysis.efficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency).toBeLessThanOrEqual(1);
    });

    it("should calculate routing patterns correctly", async () => {
      const analysis = await hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(analysis.routingPatterns).toBeDefined();
      expect(analysis.routingPatterns.mcpUsage).toBeGreaterThanOrEqual(0);
      expect(analysis.routingPatterns.mcpUsage).toBeLessThanOrEqual(1);
      expect(
        analysis.routingPatterns.directBedrockUsage
      ).toBeGreaterThanOrEqual(0);
      expect(analysis.routingPatterns.directBedrockUsage).toBeLessThanOrEqual(
        1
      );
      expect(analysis.routingPatterns.fallbackOccurrences).toBe(1);
    });

    it("should analyze performance by route", async () => {
      const analysis = await hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(analysis.performanceComparison).toBeDefined();
      expect(analysis.performanceComparison.mcpPerformance).toBeDefined();
      expect(
        analysis.performanceComparison.directBedrockPerformance
      ).toBeDefined();

      const mcpPerf = analysis.performanceComparison.mcpPerformance;
      const directPerf =
        analysis.performanceComparison.directBedrockPerformance;

      expect(mcpPerf.averageLatency).toBeGreaterThan(0);
      expect(mcpPerf.successRate).toBeGreaterThanOrEqual(0);
      expect(mcpPerf.successRate).toBeLessThanOrEqual(1);
      expect(mcpPerf.throughput).toBeGreaterThanOrEqual(0);

      expect(directPerf.averageLatency).toBeGreaterThan(0);
      expect(directPerf.successRate).toBeGreaterThanOrEqual(0);
      expect(directPerf.successRate).toBeLessThanOrEqual(1);
      expect(directPerf.throughput).toBeGreaterThanOrEqual(0);
    });

    it("should generate routing recommendations", async () => {
      const analysis = await hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.routingOptimizations).toBeInstanceOf(
        Array
      );
      expect(analysis.recommendations.performanceImprovements).toBeInstanceOf(
        Array
      );
      expect(analysis.recommendations.configurationChanges).toBeInstanceOf(
        Array
      );

      // Should have at least some configuration recommendations
      expect(
        analysis.recommendations.configurationChanges.length
      ).toBeGreaterThan(0);
    });

    it("should handle empty data gracefully", async () => {
      // Create a new monitor with no recorded data
      const emptyMonitor = new HybridHealthMonitor(
        mockDirectBedrockClient,
        mockMcpRouter,
        mockIntelligentRouter,
        mockConfig
      );

      const analysis = await emptyMonitor.analyzeRoutingEfficiency();

      expect(analysis.totalDecisions).toBe(0);
      expect(analysis.optimalDecisions).toBe(0);
      expect(analysis.suboptimalDecisions).toBe(0);
      expect(analysis.efficiency).toBe(0);

      emptyMonitor.destroy();
    });
  });

  describe("recordRoutingDecision", () => {
    it("should record routing decisions", () => {
      const initialMetrics = hybridHealthMonitor.getMetrics();
      const initialDecisions = initialMetrics.routingDecisions;

      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "mcp",
        10,
        "Optimal route"
      );
      hybridHealthMonitor.recordRoutingDecision(
        "direct",
        "mcp",
        20,
        "Fallback to MCP"
      );

      const updatedMetrics = hybridHealthMonitor.getMetrics();
      expect(updatedMetrics.routingDecisions).toBe(initialDecisions + 2);
    });

    it("should clean up old routing decisions", () => {
      // Record a decision
      hybridHealthMonitor.recordRoutingDecision("mcp", "mcp", 10, "Test");

      // Mock time to be beyond the performance window (1 hour)
      const originalNow = Date.now;
      const originalDate = Date;
      const futureTime = originalNow() + 3700000; // 1 hour + 100 seconds later

      Date.now = jest.fn(() => futureTime);
      // @ts-ignore - Mock Date constructor
      global.Date = class extends originalDate {
        constructor() {
          super();
          return new originalDate(futureTime);
        }
        static now() {
          return futureTime;
        }
      } as any;

      // Record another decision (should trigger cleanup)
      hybridHealthMonitor.recordRoutingDecision(
        "direct",
        "direct",
        15,
        "Test 2"
      );

      // Restore Date
      Date.now = originalNow;
      global.Date = originalDate;

      const metrics = hybridHealthMonitor.getMetrics();
      expect(metrics.routingDecisions).toBe(1); // Only the recent decision should remain
    });
  });

  describe("recordRequestPerformance", () => {
    it("should record request performance", () => {
      const initialMetrics = hybridHealthMonitor.getMetrics();
      const initialRequests = initialMetrics.totalRequests;

      hybridHealthMonitor.recordRequestPerformance(
        "mcp",
        200,
        true,
        "analysis"
      );
      hybridHealthMonitor.recordRequestPerformance(
        "direct",
        150,
        false,
        "emergency"
      );

      const updatedMetrics = hybridHealthMonitor.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(initialRequests + 2);
    });

    it("should clean up old request data", () => {
      // Record a request
      hybridHealthMonitor.recordRequestPerformance("mcp", 200, true, "test");

      // Mock time to be beyond the performance window (1 hour)
      const originalNow = Date.now;
      const originalDate = Date;
      const futureTime = originalNow() + 3700000; // 1 hour + 100 seconds later

      Date.now = jest.fn(() => futureTime);
      // @ts-ignore - Mock Date constructor
      global.Date = class extends originalDate {
        constructor() {
          super();
          return new originalDate(futureTime);
        }
        static now() {
          return futureTime;
        }
      } as any;

      // Record another request (should trigger cleanup)
      hybridHealthMonitor.recordRequestPerformance(
        "direct",
        150,
        true,
        "test 2"
      );

      // Restore Date
      Date.now = originalNow;
      global.Date = originalDate;

      const metrics = hybridHealthMonitor.getMetrics();
      expect(metrics.totalRequests).toBe(1); // Only the recent request should remain
    });
  });

  describe("getOptimizationRecommendations", () => {
    it("should return optimization recommendations", async () => {
      // Add some data for analysis
      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "direct",
        30,
        "Fallback"
      );
      hybridHealthMonitor.recordRequestPerformance(
        "direct",
        4000,
        true,
        "fallback"
      );

      const recommendations =
        await hybridHealthMonitor.getOptimizationRecommendations();

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should handle recommendation generation errors", async () => {
      // Mock analysis to fail
      const originalAnalyze = hybridHealthMonitor.analyzeRoutingEfficiency;
      hybridHealthMonitor.analyzeRoutingEfficiency = jest
        .fn()
        .mockRejectedValue(new Error("Analysis failed"));

      const recommendations =
        await hybridHealthMonitor.getOptimizationRecommendations();

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations).toContain("Monitor system health regularly");

      // Restore original method
      hybridHealthMonitor.analyzeRoutingEfficiency = originalAnalyze;
    });
  });

  describe("Health Recommendations", () => {
    it("should generate immediate recommendations for critical issues", async () => {
      // Record requests with critical latency to trigger p95 threshold
      for (let i = 0; i < 20; i++) {
        hybridHealthMonitor.recordRequestPerformance(
          "direct",
          15000, // Critical latency (> 10000ms threshold)
          false,
          "critical-test"
        );
      }

      // Mock critical health conditions
      mockDirectBedrockClient.getHealthStatus.mockResolvedValue({
        isHealthy: false,
        latencyMs: 15000,
        lastCheck: new Date(),
        consecutiveFailures: 10,
        circuitBreakerState: "open",
        error: "Critical error",
      });

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.recommendations.immediate).toContain(
        "Critical health issue detected - investigate system status"
      );
      expect(healthStatus.recommendations.immediate).toContain(
        "Direct Bedrock route is unhealthy - check AWS connectivity"
      );
    });

    it("should generate optimization recommendations for performance issues", async () => {
      // Add performance data that triggers optimization recommendations
      hybridHealthMonitor.recordRequestPerformance(
        "mcp",
        4000,
        true,
        "slow-request"
      );
      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "direct",
        50,
        "High fallback"
      );

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.recommendations.optimization.length).toBeGreaterThan(
        0
      );
    });

    it("should always include maintenance recommendations", async () => {
      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.recommendations.maintenance).toContain(
        "Review health monitoring configuration regularly"
      );
      expect(healthStatus.recommendations.maintenance).toContain(
        "Update routing thresholds based on performance trends"
      );
    });
  });

  describe("Metrics and Monitoring", () => {
    it("should return comprehensive metrics", () => {
      const metrics = hybridHealthMonitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.recentRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.routingDecisions).toBeGreaterThanOrEqual(0);
      expect(metrics.systemStartTime).toBeInstanceOf(Date);
    });

    it("should track system uptime", () => {
      const metrics1 = hybridHealthMonitor.getMetrics();

      // Wait a bit
      setTimeout(() => {
        const metrics2 = hybridHealthMonitor.getMetrics();
        expect(metrics2.uptime).toBeGreaterThan(metrics1.uptime);
      }, 10);
    });

    it("should track efficiency analyses", async () => {
      const initialMetrics = hybridHealthMonitor.getMetrics();

      await hybridHealthMonitor.analyzeRoutingEfficiency();

      const updatedMetrics = hybridHealthMonitor.getMetrics();
      expect(updatedMetrics.efficiencyAnalyses).toBe(
        initialMetrics.efficiencyAnalyses + 1
      );
    });
  });

  describe("Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const metrics = hybridHealthMonitor.getMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);

      hybridHealthMonitor.destroy();

      // After destroy, should not throw errors
      expect(() => hybridHealthMonitor.getMetrics()).not.toThrow();
    });

    it("should handle multiple destroy calls safely", () => {
      expect(() => {
        hybridHealthMonitor.destroy();
        hybridHealthMonitor.destroy();
      }).not.toThrow();
    });
  });

  describe("Configuration Validation", () => {
    it("should work with minimal configuration", () => {
      const minimalMonitor = new HybridHealthMonitor(
        mockDirectBedrockClient,
        mockMcpRouter,
        mockIntelligentRouter,
        { checkInterval: 1000 }
      );

      expect(minimalMonitor).toBeDefined();
      expect(minimalMonitor.getMetrics()).toBeDefined();

      minimalMonitor.destroy();
    });

    it("should handle invalid configuration gracefully", () => {
      const invalidConfig = {
        checkInterval: -1000,
        analysisInterval: -2000,
      } as any;

      expect(() => {
        const invalidMonitor = new HybridHealthMonitor(
          mockDirectBedrockClient,
          mockMcpRouter,
          mockIntelligentRouter,
          invalidConfig
        );
        invalidMonitor.destroy();
      }).not.toThrow();
    });
  });

  describe("Feature Flag Integration", () => {
    it("should respect feature flag settings", () => {
      const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
      mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(false);

      const disabledMonitor = new HybridHealthMonitor(
        mockDirectBedrockClient,
        mockMcpRouter,
        mockIntelligentRouter,
        mockConfig
      );

      expect(disabledMonitor).toBeDefined();
      // Should still work but without continuous monitoring
      expect(disabledMonitor.getMetrics()).toBeDefined();

      disabledMonitor.destroy();
    });
  });
});
