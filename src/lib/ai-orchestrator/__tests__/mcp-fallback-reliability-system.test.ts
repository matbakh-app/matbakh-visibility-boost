/**
 * Tests for MCP Fallback Reliability System
 *
 * Validates >99% success rate requirement when direct Bedrock is unavailable
 */

import { AuditTrailSystem } from "../audit-trail-system";
import {
  MCPFallbackConfig,
  MCPFallbackReliabilitySystem,
} from "../mcp-fallback-reliability-system";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../mcp-router");
jest.mock("../audit-trail-system");

const MockedMCPRouter = MCPRouter as jest.MockedClass<typeof MCPRouter>;
const MockedAuditTrailSystem = AuditTrailSystem as jest.MockedClass<
  typeof AuditTrailSystem
>;

describe("MCPFallbackReliabilitySystem", () => {
  let mcpRouter: jest.Mocked<MCPRouter>;
  let auditTrail: jest.Mocked<AuditTrailSystem>;
  let fallbackSystem: MCPFallbackReliabilitySystem;
  let testConfig: Partial<MCPFallbackConfig>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mcpRouter = new MockedMCPRouter() as jest.Mocked<MCPRouter>;
    auditTrail = new MockedAuditTrailSystem() as jest.Mocked<AuditTrailSystem>;

    // Configure test configuration for faster tests
    testConfig = {
      maxRetries: 3,
      baseRetryDelay: 10, // 10ms for fast tests
      maxRetryDelay: 100, // 100ms max
      exponentialBackoffMultiplier: 2,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 1000, // 1 second
      healthCheckInterval: 100, // 100ms
      successRateTarget: 0.99, // 99%
      performanceThresholds: {
        maxLatency: 5000,
        maxErrorRate: 0.01,
        minSuccessRate: 0.99,
      },
    };

    // Setup default mock behaviors
    mcpRouter.routeRequest = jest
      .fn()
      .mockResolvedValue({ success: true, data: "test response" });
    mcpRouter.getHealthStatus = jest.fn().mockResolvedValue({
      isHealthy: true,
      queueSize: 0,
      pendingOperations: 0,
    });
    mcpRouter.reconnect = jest.fn().mockResolvedValue(undefined);

    auditTrail.logEvent = jest.fn().mockResolvedValue(undefined);

    // Create system instance
    fallbackSystem = new MCPFallbackReliabilitySystem(
      mcpRouter,
      auditTrail,
      testConfig
    );
  });

  afterEach(() => {
    fallbackSystem.destroy();
  });

  describe("Basic Fallback Operations", () => {
    it("should successfully execute fallback operation", async () => {
      const request = { operation: "test", data: "test data" };
      const correlationId = "test-correlation-id";

      const result = await fallbackSystem.executeFallbackOperation(
        request,
        correlationId
      );

      expect(result.success).toBe(true);
      expect(result.response).toEqual({ success: true, data: "test response" });
      expect(result.latency).toBeGreaterThan(0);
      expect(result.retryCount).toBe(0);
      expect(result.routeUsed).toBe("mcp");
      expect(result.correlationId).toBe(correlationId);

      // Verify audit logging
      expect(auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "mcp_fallback_initiation",
          correlationId,
        })
      );
      expect(auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "mcp_fallback_completion",
          correlationId,
          metadata: expect.objectContaining({
            success: true,
          }),
        })
      );
    });

    it("should handle MCP router failures with retries", async () => {
      // Setup MCP router to fail twice then succeed
      mcpRouter.routeRequest
        .mockRejectedValueOnce(new Error("Connection timeout"))
        .mockRejectedValueOnce(new Error("Service unavailable"))
        .mockResolvedValueOnce({
          success: true,
          data: "success after retries",
        });

      const request = { operation: "test", data: "test data" };
      const correlationId = "test-retry-correlation-id";

      const result = await fallbackSystem.executeFallbackOperation(
        request,
        correlationId
      );

      expect(result.success).toBe(true);
      expect(result.response).toEqual({
        success: true,
        data: "success after retries",
      });
      expect(result.retryCount).toBe(2);
      expect(result.routeUsed).toBe("mcp");

      // Verify MCP router was called 3 times (initial + 2 retries)
      expect(mcpRouter.routeRequest).toHaveBeenCalledTimes(3);
    });

    it("should fail after exhausting all retries", async () => {
      // Setup MCP router to always fail
      const testError = new Error("Persistent failure");
      mcpRouter.routeRequest.mockRejectedValue(testError);

      const request = { operation: "test", data: "test data" };
      const correlationId = "test-failure-correlation-id";

      const result = await fallbackSystem.executeFallbackOperation(
        request,
        correlationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toEqual(testError);
      expect(result.retryCount).toBe(3); // maxRetries from testConfig
      expect(result.routeUsed).toBe("fallback");

      // Verify all retries were attempted
      expect(mcpRouter.routeRequest).toHaveBeenCalledTimes(4); // initial + 3 retries
    });
  });

  describe("Circuit Breaker Protection", () => {
    it("should open circuit breaker after consecutive failures", async () => {
      const testError = new Error("Service down");
      mcpRouter.routeRequest.mockRejectedValue(testError);

      const request = { operation: "test", data: "test data" };

      // Execute enough operations to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `correlation-${i}`
        );
      }

      // Next operation should fail immediately due to circuit breaker
      const result = await fallbackSystem.executeFallbackOperation(
        request,
        "circuit-breaker-test"
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("circuit breaker is open");
      expect(result.retryCount).toBe(0); // No retries when circuit breaker is open

      const metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.circuitBreakerTrips).toBeGreaterThan(0);
    });

    it("should reset circuit breaker after timeout", async () => {
      const testError = new Error("Service down");
      mcpRouter.routeRequest.mockRejectedValue(testError);

      const request = { operation: "test", data: "test data" };

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `correlation-${i}`
        );
      }

      // Wait for circuit breaker timeout
      await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait longer than circuitBreakerTimeout

      // Setup success response
      mcpRouter.routeRequest.mockResolvedValueOnce({
        success: true,
        data: "recovered",
      });

      // Should succeed now
      const result = await fallbackSystem.executeFallbackOperation(
        request,
        "recovery-test"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("Health Monitoring", () => {
    it("should perform health checks periodically", async () => {
      // Wait for at least one health check
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mcpRouter.getHealthStatus).toHaveBeenCalled();

      const healthStatus = fallbackSystem.getHealthStatus();
      expect(healthStatus.lastCheck).toBeInstanceOf(Date);
      expect(healthStatus.isHealthy).toBe(true);
    });

    it("should trigger recovery when health degrades", async () => {
      // Setup unhealthy MCP router
      mcpRouter.getHealthStatus.mockResolvedValue({
        isHealthy: false,
        queueSize: 10,
        pendingOperations: 5,
      });

      // Simulate consecutive failures to trigger recovery
      const healthStatus = fallbackSystem.getHealthStatus();
      (healthStatus as any).consecutiveFailures = 4; // Force high failure count

      // Wait for health check and recovery
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mcpRouter.reconnect).toHaveBeenCalled();
    });

    it("should provide force health check and recovery", async () => {
      // Setup initially unhealthy, then healthy after recovery
      mcpRouter.getHealthStatus
        .mockResolvedValueOnce({
          isHealthy: false,
          queueSize: 5,
          pendingOperations: 3,
        })
        .mockResolvedValueOnce({
          isHealthy: true,
          queueSize: 0,
          pendingOperations: 0,
        });

      const result = await fallbackSystem.forceHealthCheckAndRecovery();

      expect(result.healthImproved).toBe(true);
      expect(result.actions).toContain("Health recovered successfully");
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(mcpRouter.reconnect).toHaveBeenCalled();
    });
  });

  describe("Performance Metrics", () => {
    it("should track success rate accurately", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute 10 successful operations
      for (let i = 0; i < 10; i++) {
        await fallbackSystem.executeFallbackOperation(request, `success-${i}`);
      }

      let metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.successRate).toBe(1.0); // 100%
      expect(metrics.totalFallbackAttempts).toBe(10);
      expect(metrics.successfulFallbacks).toBe(10);
      expect(metrics.failedFallbacks).toBe(0);

      // Add 1 failure
      mcpRouter.routeRequest.mockRejectedValueOnce(new Error("Test failure"));
      await fallbackSystem.executeFallbackOperation(request, "failure-1");

      metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.successRate).toBeCloseTo(0.909, 3); // 10/11 ≈ 90.9%
      expect(metrics.totalFallbackAttempts).toBe(11);
      expect(metrics.successfulFallbacks).toBe(10);
      expect(metrics.failedFallbacks).toBe(1);
    });

    it("should calculate performance grades correctly", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute operations to get Grade A (>99% success, <5s latency)
      for (let i = 0; i < 100; i++) {
        await fallbackSystem.executeFallbackOperation(request, `grade-a-${i}`);
      }

      let metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.performanceGrade).toBe("A");

      // Add some failures to lower grade
      mcpRouter.routeRequest.mockRejectedValue(new Error("Test failure"));
      for (let i = 0; i < 5; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `grade-lower-${i}`
        );
      }

      metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.performanceGrade).toBe("B"); // Should be B or lower due to failures
    });

    it("should provide actionable recommendations", async () => {
      const request = { operation: "test", data: "test data" };

      // Create scenario with low success rate
      mcpRouter.routeRequest.mockRejectedValue(new Error("Frequent failures"));

      for (let i = 0; i < 10; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `low-success-${i}`
        );
      }

      const metrics = fallbackSystem.getFallbackMetrics();
      expect(metrics.recommendations).toContain(
        expect.stringMatching(/Success rate below target/)
      );
    });
  });

  describe("Reliability Validation", () => {
    it("should validate reliability targets", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute 100 successful operations to meet 99% target
      for (let i = 0; i < 100; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `reliability-${i}`
        );
      }

      const validation = await fallbackSystem.validateReliabilityTargets();

      expect(validation.meetsTarget).toBe(true);
      expect(validation.currentSuccessRate).toBe(1.0);
      expect(validation.targetSuccessRate).toBe(0.99);
      expect(validation.totalOperations).toBe(100);
      expect(validation.lastValidation).toBeInstanceOf(Date);
    });

    it("should detect when reliability targets are not met", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute operations with high failure rate
      mcpRouter.routeRequest
        .mockResolvedValue({ success: true, data: "success" })
        .mockRejectedValue(new Error("failure"))
        .mockRejectedValue(new Error("failure"))
        .mockRejectedValue(new Error("failure"));

      // Execute pattern: 1 success, 3 failures (25% success rate)
      for (let i = 0; i < 4; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `unreliable-${i}`
        );
      }

      const validation = await fallbackSystem.validateReliabilityTargets();

      expect(validation.meetsTarget).toBe(false);
      expect(validation.currentSuccessRate).toBeLessThan(0.99);
      expect(validation.recommendations).toContain(
        expect.stringMatching(/Success rate below target/)
      );
    });
  });

  describe("Configuration Optimization", () => {
    it("should suggest configuration optimizations", async () => {
      const request = { operation: "test", data: "test data" };

      // Create scenario with low success rate to trigger optimization suggestions
      mcpRouter.routeRequest.mockRejectedValue(new Error("Frequent failures"));

      for (let i = 0; i < 20; i++) {
        await fallbackSystem.executeFallbackOperation(request, `optimize-${i}`);
      }

      const optimization = await fallbackSystem.optimizeFallbackConfiguration();

      expect(optimization.optimizations.length).toBeGreaterThan(0);
      expect(optimization.expectedImprovement).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(optimization.riskLevel);

      if (
        optimization.optimizations[0] !==
        "Configuration is already optimized for current conditions"
      ) {
        expect(optimization.newConfig).toBeDefined();
      }
    });
  });

  describe("Operation History", () => {
    it("should maintain operation history", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute some operations
      for (let i = 0; i < 5; i++) {
        await fallbackSystem.executeFallbackOperation(request, `history-${i}`);
      }

      const history = fallbackSystem.getOperationHistory(10);

      expect(history).toHaveLength(5);
      expect(history[0]).toHaveProperty("timestamp");
      expect(history[0]).toHaveProperty("success");
      expect(history[0]).toHaveProperty("latency");
      expect(history[0].success).toBe(true);
    });

    it("should limit operation history size", async () => {
      const request = { operation: "test", data: "test data" };

      // Execute more operations than history limit
      for (let i = 0; i < 15; i++) {
        await fallbackSystem.executeFallbackOperation(
          request,
          `history-limit-${i}`
        );
      }

      const history = fallbackSystem.getOperationHistory(10);
      expect(history).toHaveLength(10); // Should be limited to requested size
    });
  });

  describe("Error Handling", () => {
    it("should not retry non-retryable errors", async () => {
      // Create a validation error (non-retryable)
      const validationError = new Error("Invalid input");
      validationError.name = "ValidationError";
      mcpRouter.routeRequest.mockRejectedValue(validationError);

      const request = { operation: "test", data: "invalid data" };
      const result = await fallbackSystem.executeFallbackOperation(
        request,
        "validation-error"
      );

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(0); // Should not retry validation errors
      expect(mcpRouter.routeRequest).toHaveBeenCalledTimes(1); // Only called once
    });

    it("should handle audit trail failures gracefully", async () => {
      // Setup audit trail to fail
      auditTrail.logEvent.mockRejectedValue(new Error("Audit system down"));

      const request = { operation: "test", data: "test data" };

      // Should still complete successfully despite audit failures
      const result = await fallbackSystem.executeFallbackOperation(
        request,
        "audit-fail"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const system = new MCPFallbackReliabilitySystem(
        mcpRouter,
        auditTrail,
        testConfig
      );

      // Verify timer is running
      expect((system as any).healthCheckTimer).toBeDefined();

      system.destroy();

      // Verify timer is cleared
      expect((system as any).healthCheckTimer).toBeUndefined();
    });
  });
});
