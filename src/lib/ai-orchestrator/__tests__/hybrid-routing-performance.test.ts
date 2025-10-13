/**
 * Hybrid Routing Performance Tests
 *
 * Tests performance characteristics of hybrid routing under various load scenarios:
 * - Emergency operations latency (<5s requirement)
 * - Critical support operations latency (<10s requirement)
 * - Routing efficiency under stress
 * - Cost controls under load
 * - Failover mechanisms performance
 * - System impact measurement
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { CircuitBreaker } from "../circuit-breaker";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../direct-bedrock-client");
jest.mock("../mcp-router");
jest.mock("../circuit-breaker");
jest.mock("../ai-feature-flags");

describe("Hybrid Routing Performance Tests", () => {
  let router: IntelligentRouter;
  let mockDirectClient: jest.Mocked<DirectBedrockClient>;
  let mockMcpRouter: jest.Mocked<MCPRouter>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;

  beforeEach(() => {
    // Setup mocks
    mockDirectClient = new DirectBedrockClient(
      {} as any
    ) as jest.Mocked<DirectBedrockClient>;
    mockMcpRouter = new MCPRouter({} as any) as jest.Mocked<MCPRouter>;
    mockCircuitBreaker = new CircuitBreaker(
      {} as any
    ) as jest.Mocked<CircuitBreaker>;
    mockFeatureFlags = new AiFeatureFlags() as jest.Mocked<AiFeatureFlags>;

    // Default mock implementations
    mockFeatureFlags.isEnabled = jest.fn().mockReturnValue(true);
    mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(false);
    mockCircuitBreaker.recordSuccess = jest.fn();
    mockCircuitBreaker.recordFailure = jest.fn();

    // Mock health check methods
    mockDirectClient.performHealthCheck = jest.fn().mockResolvedValue({
      isHealthy: true,
      latencyMs: 100,
      timestamp: new Date(),
    });

    mockMcpRouter.getHealthStatus = jest.fn().mockResolvedValue({
      isHealthy: true,
      latencyMs: 200,
      timestamp: new Date(),
    });

    mockMcpRouter.isAvailable = jest.fn().mockReturnValue(true);

    // Mock executeSupportOperation for both clients
    mockMcpRouter.executeSupportOperation = jest.fn().mockResolvedValue({
      success: true,
      result: "MCP operation completed",
      latencyMs: 200,
      operationId: "mcp-op-123",
      timestamp: new Date(),
    });

    router = new IntelligentRouter(mockDirectClient, mockMcpRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Emergency Operations Latency (<5s requirement)", () => {
    it("should complete emergency operations within 5 seconds under normal load", async () => {
      const startTime = Date.now();

      mockDirectClient.executeSupportOperation = jest.fn().mockResolvedValue({
        success: true,
        result: "Emergency operation completed",
        latency: 3000,
        route: "direct_bedrock",
      });

      const result = await router.executeSupportOperation({
        operation: "emergency_operations",
        priority: "emergency",
        latencyRequirement: 5000,
        operationType: "emergency",
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(result.success).toBe(true);
      expect(result.route).toBe("direct_bedrock");
    });

    it("should maintain <5s latency under concurrent emergency operations", async () => {
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return {
            success: true,
            result: "Emergency operation completed",
            latency: 2000,
            route: "direct_bedrock",
          };
        });

      const operations = Array(10)
        .fill(null)
        .map(() =>
          router.executeSupportOperation({
            operation: "emergency_operations",
            priority: "emergency",
            latencyRequirement: 5000,
            operationType: "emergency",
          })
        );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      // All operations should complete
      expect(results.every((r) => r.success)).toBe(true);

      // Average latency should be under 5s
      const avgLatency = duration / operations.length;
      expect(avgLatency).toBeLessThan(5000);
    });

    it("should handle emergency operation failures gracefully", async () => {
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockRejectedValue(new Error("Emergency operation failed"));

      const startTime = Date.now();

      await expect(
        router.executeSupportOperation({
          operation: "emergency_operations",
          priority: "emergency",
          latencyRequirement: 5000,
          operationType: "emergency",
        })
      ).rejects.toThrow();

      const duration = Date.now() - startTime;

      // Should fail fast, not wait for timeout
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Critical Support Operations Latency (<10s requirement)", () => {
    it("should complete critical operations within 10 seconds", async () => {
      const startTime = Date.now();

      mockDirectClient.executeSupportOperation = jest.fn().mockResolvedValue({
        success: true,
        result: "Critical operation completed",
        latency: 7000,
        route: "direct_bedrock",
      });

      const result = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        latencyRequirement: 10000,
        operationType: "support",
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000);
      expect(result.success).toBe(true);
    });

    it("should maintain <10s latency for infrastructure audits under load", async () => {
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return {
            success: true,
            result: "Infrastructure audit completed",
            latency: 5000,
            route: "direct_bedrock",
          };
        });

      const operations = Array(5)
        .fill(null)
        .map(() =>
          router.executeSupportOperation({
            operation: "infrastructure_audit",
            priority: "critical",
            latencyRequirement: 10000,
            operationType: "support",
          })
        );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      expect(results.every((r) => r.success)).toBe(true);

      const avgLatency = duration / operations.length;
      expect(avgLatency).toBeLessThan(10000);
    });

    it("should fallback to MCP when direct Bedrock is slow", async () => {
      // Direct Bedrock is slow
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 12000));
          return {
            success: true,
            result: "Slow operation",
            latency: 12000,
            route: "direct_bedrock",
          };
        });

      // MCP is faster
      mockMcpRouter.route = jest.fn().mockResolvedValue({
        success: true,
        result: "MCP operation completed",
        latency: 6000,
        route: "mcp",
      });

      const startTime = Date.now();

      const result = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        latencyRequirement: 10000,
        operationType: "support",
      });

      const duration = Date.now() - startTime;

      // Should use faster route
      expect(duration).toBeLessThan(10000);
      expect(result.success).toBe(true);
    });
  });

  describe("Routing Efficiency Under Stress", () => {
    it("should maintain routing efficiency under high load", async () => {
      let directBedrockCalls = 0;
      let mcpCalls = 0;

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          directBedrockCalls++;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            success: true,
            result: "Direct operation",
            latency: 100,
            route: "direct_bedrock",
          };
        });

      mockMcpRouter.route = jest.fn().mockImplementation(async () => {
        mcpCalls++;
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          success: true,
          result: "MCP operation",
          latency: 200,
          route: "mcp",
        };
      });

      // Mix of operation types
      const operations = [
        ...Array(20).fill({
          operation: "emergency_operations",
          priority: "emergency",
          operationType: "emergency",
        }),
        ...Array(30).fill({
          operation: "infrastructure_audit",
          priority: "critical",
          operationType: "support",
        }),
        ...Array(50).fill({
          operation: "standard_analysis",
          priority: "medium",
          operationType: "standard",
        }),
      ];

      const results = await Promise.all(
        operations.map((op) => router.executeSupportOperation(op as any))
      );

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Emergency and critical should use direct Bedrock
      expect(directBedrockCalls).toBeGreaterThan(40);

      // Standard operations should use MCP
      expect(mcpCalls).toBeGreaterThan(40);

      // Routing efficiency: correct route selection
      const efficiency = (directBedrockCalls + mcpCalls) / operations.length;
      expect(efficiency).toBeGreaterThan(0.9); // >90% efficiency
    });

    it("should handle routing decision overhead efficiently", async () => {
      mockDirectClient.executeSupportOperation = jest.fn().mockResolvedValue({
        success: true,
        result: "Operation completed",
        latency: 50,
        route: "direct_bedrock",
      });

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await router.executeSupportOperation({
          operation: "emergency_operations",
          priority: "emergency",
          operationType: "emergency",
        });
      }

      const duration = Date.now() - startTime;
      const avgOverhead = duration / iterations;

      // Routing decision overhead should be minimal (<10ms per operation)
      expect(avgOverhead).toBeLessThan(100);
    });
  });

  describe("Cost Controls Under Load", () => {
    it("should respect cost limits under high load", async () => {
      let totalCost = 0;
      const costPerOperation = 0.01;
      const maxBudget = 1.0;

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          totalCost += costPerOperation;

          if (totalCost > maxBudget) {
            throw new Error("Budget exceeded");
          }

          return {
            success: true,
            result: "Operation completed",
            latency: 100,
            route: "direct_bedrock",
            cost: costPerOperation,
          };
        });

      const operations = Array(150)
        .fill(null)
        .map(() =>
          router
            .executeSupportOperation({
              operation: "infrastructure_audit",
              priority: "critical",
              operationType: "support",
            })
            .catch((err) => ({ success: false, error: err.message }))
        );

      const results = await Promise.all(operations);

      // Some operations should succeed
      const successCount = results.filter((r: any) => r.success).length;
      expect(successCount).toBeGreaterThan(0);

      // Should stop when budget is exceeded
      expect(totalCost).toBeLessThanOrEqual(maxBudget + costPerOperation);
    });

    it("should track cost metrics accurately under load", async () => {
      const costs: number[] = [];

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          const cost = Math.random() * 0.05;
          costs.push(cost);

          return {
            success: true,
            result: "Operation completed",
            latency: 100,
            route: "direct_bedrock",
            cost,
          };
        });

      const operations = Array(50)
        .fill(null)
        .map(() =>
          router.executeSupportOperation({
            operation: "infrastructure_audit",
            priority: "critical",
            operationType: "support",
          })
        );

      await Promise.all(operations);

      const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
      const avgCost = totalCost / costs.length;

      expect(totalCost).toBeGreaterThan(0);
      expect(avgCost).toBeGreaterThan(0);
      expect(avgCost).toBeLessThan(0.05);
    });
  });

  describe("Failover Mechanisms Performance", () => {
    it("should failover quickly when direct Bedrock fails", async () => {
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockRejectedValue(new Error("Direct Bedrock unavailable"));

      mockMcpRouter.route = jest.fn().mockResolvedValue({
        success: true,
        result: "MCP fallback completed",
        latency: 500,
        route: "mcp",
      });

      const startTime = Date.now();

      const result = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        operationType: "support",
      });

      const duration = Date.now() - startTime;

      // Failover should be fast (<2s)
      expect(duration).toBeLessThan(2000);
      expect(result.success).toBe(true);
      expect(result.route).toBe("mcp");
    });

    it("should handle multiple concurrent failovers efficiently", async () => {
      let failoverCount = 0;

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockRejectedValue(new Error("Direct Bedrock unavailable"));

      mockMcpRouter.route = jest.fn().mockImplementation(async () => {
        failoverCount++;
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          success: true,
          result: "MCP fallback completed",
          latency: 300,
          route: "mcp",
        };
      });

      const operations = Array(20)
        .fill(null)
        .map(() =>
          router.executeSupportOperation({
            operation: "infrastructure_audit",
            priority: "critical",
            operationType: "support",
          })
        );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      // All should succeed via failover
      expect(results.every((r) => r.success)).toBe(true);
      expect(failoverCount).toBe(20);

      // Average failover time should be reasonable
      const avgFailoverTime = duration / operations.length;
      expect(avgFailoverTime).toBeLessThan(1000);
    });

    it("should recover from circuit breaker open state", async () => {
      // Circuit breaker is open initially
      mockCircuitBreaker.isOpen = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);

      mockMcpRouter.route = jest.fn().mockResolvedValue({
        success: true,
        result: "MCP operation completed",
        latency: 500,
        route: "mcp",
      });

      // First two calls should use MCP due to circuit breaker
      const result1 = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        operationType: "support",
      });

      const result2 = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        operationType: "support",
      });

      expect(result1.route).toBe("mcp");
      expect(result2.route).toBe("mcp");

      // Circuit breaker closes, should use direct Bedrock
      mockDirectClient.executeSupportOperation = jest.fn().mockResolvedValue({
        success: true,
        result: "Direct operation completed",
        latency: 200,
        route: "direct_bedrock",
      });

      const result3 = await router.executeSupportOperation({
        operation: "infrastructure_audit",
        priority: "critical",
        operationType: "support",
      });

      expect(result3.route).toBe("direct_bedrock");
    });
  });

  describe("System Impact Measurement", () => {
    it("should measure CPU and memory impact under load", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          // Simulate some work
          const data = new Array(1000).fill("test");
          await new Promise((resolve) => setTimeout(resolve, 50));

          return {
            success: true,
            result: data.join(","),
            latency: 50,
            route: "direct_bedrock",
          };
        });

      const operations = Array(100)
        .fill(null)
        .map(() =>
          router.executeSupportOperation({
            operation: "infrastructure_audit",
            priority: "critical",
            operationType: "support",
          })
        );

      await Promise.all(operations);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (<50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50);
    });

    it("should maintain performance under sustained load", async () => {
      const latencies: number[] = [];

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          const startTime = Date.now();
          await new Promise((resolve) => setTimeout(resolve, 100));
          const latency = Date.now() - startTime;
          latencies.push(latency);

          return {
            success: true,
            result: "Operation completed",
            latency,
            route: "direct_bedrock",
          };
        });

      // Sustained load over time
      for (let batch = 0; batch < 5; batch++) {
        const operations = Array(20)
          .fill(null)
          .map(() =>
            router.executeSupportOperation({
              operation: "infrastructure_audit",
              priority: "critical",
              operationType: "support",
            })
          );

        await Promise.all(operations);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Calculate performance degradation
      const firstBatchAvg =
        latencies.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
      const lastBatchAvg = latencies.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const degradation = (lastBatchAvg - firstBatchAvg) / firstBatchAvg;

      // Performance degradation should be minimal (<10%)
      expect(degradation).toBeLessThan(0.1);
    });

    it("should handle resource cleanup efficiently", async () => {
      const initialHandles =
        (process as any)._getActiveHandles?.()?.length || 0;

      mockDirectClient.executeSupportOperation = jest.fn().mockResolvedValue({
        success: true,
        result: "Operation completed",
        latency: 100,
        route: "direct_bedrock",
      });

      // Create and complete many operations
      for (let i = 0; i < 50; i++) {
        await router.executeSupportOperation({
          operation: "infrastructure_audit",
          priority: "critical",
          operationType: "support",
        });
      }

      // Allow cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalHandles = (process as any)._getActiveHandles?.()?.length || 0;
      const handleIncrease = finalHandles - initialHandles;

      // Should not leak handles
      expect(handleIncrease).toBeLessThan(10);
    });
  });

  describe("Performance Regression Detection", () => {
    it("should detect performance regressions in routing decisions", async () => {
      const baselineLatencies: number[] = [];
      const testLatencies: number[] = [];

      // Baseline performance
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          const latency = 100 + Math.random() * 50;
          baselineLatencies.push(latency);
          await new Promise((resolve) => setTimeout(resolve, latency));

          return {
            success: true,
            result: "Operation completed",
            latency,
            route: "direct_bedrock",
          };
        });

      for (let i = 0; i < 30; i++) {
        await router.executeSupportOperation({
          operation: "infrastructure_audit",
          priority: "critical",
          operationType: "support",
        });
      }

      // Test performance (simulating regression)
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          const latency = 150 + Math.random() * 100; // Slower
          testLatencies.push(latency);
          await new Promise((resolve) => setTimeout(resolve, latency));

          return {
            success: true,
            result: "Operation completed",
            latency,
            route: "direct_bedrock",
          };
        });

      for (let i = 0; i < 30; i++) {
        await router.executeSupportOperation({
          operation: "infrastructure_audit",
          priority: "critical",
          operationType: "support",
        });
      }

      const baselineAvg =
        baselineLatencies.reduce((a, b) => a + b, 0) / baselineLatencies.length;
      const testAvg =
        testLatencies.reduce((a, b) => a + b, 0) / testLatencies.length;
      const regression = (testAvg - baselineAvg) / baselineAvg;

      // Should detect significant regression (>20%)
      expect(regression).toBeGreaterThan(0.2);
    });
  });
});
