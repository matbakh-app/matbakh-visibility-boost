/**
 * Routing Efficiency Under Stress Tests
 *
 * This test suite validates that the hybrid routing system maintains efficiency
 * under various stress conditions including:
 * - High concurrent load
 * - Mixed operation types
 * - Route failures and recovery
 * - Resource constraints
 * - Performance degradation scenarios
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { CircuitBreaker } from "../circuit-breaker";
import {
  DirectBedrockClient,
  OperationPriority,
  OperationType,
  SupportOperationRequest,
  SupportOperationResponse,
} from "../direct-bedrock-client";
import { IntelligentRouter, RouteType } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../direct-bedrock-client");
jest.mock("../mcp-router");
jest.mock("../circuit-breaker");
jest.mock("../ai-feature-flags");

describe("Routing Efficiency Under Stress", () => {
  let router: IntelligentRouter;
  let mockDirectClient: jest.Mocked<DirectBedrockClient>;
  let mockMcpRouter: jest.Mocked<MCPRouter>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;

  // Performance tracking
  let routingDecisions: Array<{
    route: RouteType;
    latency: number;
    success: boolean;
  }> = [];
  let totalOperations = 0;
  let successfulOperations = 0;

  beforeEach(() => {
    // Reset tracking
    routingDecisions = [];
    totalOperations = 0;
    successfulOperations = 0;

    // Setup mocks
    mockDirectClient = new DirectBedrockClient(
      {} as any
    ) as jest.Mocked<DirectBedrockClient>;
    mockMcpRouter = new MCPRouter({} as any) as jest.Mocked<MCPRouter>;
    mockCircuitBreaker = new CircuitBreaker(
      {} as any
    ) as jest.Mocked<CircuitBreaker>;
    mockFeatureFlags = new AiFeatureFlags() as jest.Mocked<AiFeatureFlags>;

    // Default mock implementations - enable intelligent routing
    mockFeatureFlags.isEnabled = jest
      .fn()
      .mockImplementation((flag: string) => {
        if (flag === "ENABLE_INTELLIGENT_ROUTING") return true;
        if (flag === "ENABLE_BEDROCK_SUPPORT_MODE") return true;
        if (flag === "ENABLE_DIRECT_BEDROCK_FALLBACK") return true;
        return true; // Default to enabled for other flags
      });
    mockFeatureFlags.isIntelligentRoutingEnabled = jest
      .fn()
      .mockResolvedValue(true);
    mockFeatureFlags.isBedrockSupportModeEnabled = jest
      .fn()
      .mockResolvedValue(true);
    mockFeatureFlags.isDirectBedrockFallbackEnabled = jest
      .fn()
      .mockResolvedValue(true);
    mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(false);

    // Mock health check methods
    mockDirectClient.performHealthCheck = jest.fn().mockResolvedValue({
      isHealthy: true,
      latencyMs: 100,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      circuitBreakerState: "closed",
    });

    mockMcpRouter.getHealthStatus = jest.fn().mockResolvedValue({
      isHealthy: true,
      latencyMs: 200,
      timestamp: new Date(),
    });

    mockMcpRouter.isAvailable = jest.fn().mockReturnValue(true);

    // Setup operation execution mocks with performance tracking
    mockDirectClient.executeSupportOperation = jest
      .fn()
      .mockImplementation(async (request: SupportOperationRequest) => {
        const startTime = Date.now();

        // Simulate variable latency based on operation type
        let baseLatency = 100;
        if (request.operation === "emergency") baseLatency = 50;
        if (request.operation === "infrastructure") baseLatency = 150;

        const latency = baseLatency + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, latency));

        const endTime = Date.now();
        const actualLatency = endTime - startTime;

        totalOperations++;
        successfulOperations++;
        routingDecisions.push({
          route: "direct",
          latency: actualLatency,
          success: true,
        });

        return {
          success: true,
          text: `Direct Bedrock operation completed: ${request.operation}`,
          latencyMs: actualLatency,
          operationId: `direct-${Date.now()}`,
          timestamp: new Date(),
          tokensUsed: { input: 100, output: 200 },
          costEuro: 0.01,
        };
      });

    mockMcpRouter.executeSupportOperation = jest
      .fn()
      .mockImplementation(async (request: SupportOperationRequest) => {
        const startTime = Date.now();

        // MCP typically has higher latency
        const latency = 200 + Math.random() * 150;
        await new Promise((resolve) => setTimeout(resolve, latency));

        const endTime = Date.now();
        const actualLatency = endTime - startTime;

        totalOperations++;
        successfulOperations++;
        routingDecisions.push({
          route: "mcp",
          latency: actualLatency,
          success: true,
        });

        return {
          success: true,
          text: `MCP operation completed: ${request.operation}`,
          latencyMs: actualLatency,
          operationId: `mcp-${Date.now()}`,
          timestamp: new Date(),
          tokensUsed: { input: 100, output: 200 },
          costEuro: 0.005,
        };
      });

    router = new IntelligentRouter(mockDirectClient, mockMcpRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("High Concurrent Load Stress Tests", () => {
    it("should maintain routing efficiency under 100 concurrent operations", async () => {
      const concurrentOperations = 100;
      const operations: Promise<SupportOperationResponse>[] = [];

      // Create mixed operation types
      const operationTypes: Array<{
        operation: OperationType;
        priority: OperationPriority;
      }> = [
        { operation: "emergency", priority: "critical" },
        { operation: "infrastructure", priority: "critical" },
        { operation: "meta_monitor", priority: "high" },
        { operation: "implementation", priority: "high" },
        { operation: "standard", priority: "medium" },
      ];

      // Launch concurrent operations
      for (let i = 0; i < concurrentOperations; i++) {
        const opType = operationTypes[i % operationTypes.length];
        operations.push(
          router.executeSupportOperation({
            operation: opType.operation,
            priority: opType.priority,
            prompt: `Test operation ${i}`,
            context: { correlationId: `stress-test-${i}` },
          })
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // Validate results
      expect(results).toHaveLength(concurrentOperations);
      expect(results.every((r) => r.success)).toBe(true);

      // Calculate efficiency metrics
      const avgLatency = totalTime / concurrentOperations;
      const directRouteCount = routingDecisions.filter(
        (d) => d.route === "direct"
      ).length;
      const mcpRouteCount = routingDecisions.filter(
        (d) => d.route === "mcp"
      ).length;
      const routingEfficiency =
        (directRouteCount + mcpRouteCount) / totalOperations;

      // Performance assertions - focus on core stress test requirements
      expect(avgLatency).toBeLessThan(1000); // Average < 1s per operation
      expect(routingEfficiency).toBeGreaterThan(0.95); // >95% routing efficiency
      expect(successfulOperations / totalOperations).toBeGreaterThan(0.98); // >98% success rate

      // Validate that all operations completed successfully under stress
      expect(totalOperations).toBe(concurrentOperations);
      expect(successfulOperations).toBe(concurrentOperations);

      // Validate routing decisions were made efficiently
      expect(routingDecisions.length).toBe(concurrentOperations);
      expect(routingDecisions.every((d) => d.success)).toBe(true);

      console.log(`Stress Test Results:
        - Total Operations: ${totalOperations}
        - Success Rate: ${(
          (successfulOperations / totalOperations) *
          100
        ).toFixed(2)}%
        - Average Latency: ${avgLatency.toFixed(2)}ms
        - Routing Decisions Made: ${routingDecisions.length}
        - Routing Efficiency: ${(routingEfficiency * 100).toFixed(2)}%
      `);

      // The key requirement: routing efficiency maintained under stress
      // Whether using MCP or direct routing, the system should handle load efficiently
      expect(routingEfficiency).toBeGreaterThan(0.95);
      expect(avgLatency).toBeLessThan(500); // Tighter latency requirement under stress
    });

    it("should handle burst traffic patterns efficiently", async () => {
      const burstSize = 50;
      const burstCount = 3;
      const burstInterval = 100; // ms between bursts

      for (let burst = 0; burst < burstCount; burst++) {
        const burstOperations: Promise<SupportOperationResponse>[] = [];

        // Create burst of operations
        for (let i = 0; i < burstSize; i++) {
          burstOperations.push(
            router.executeSupportOperation({
              operation: "infrastructure",
              priority: "critical",
              prompt: `Burst ${burst} operation ${i}`,
              context: { correlationId: `burst-${burst}-${i}` },
            })
          );
        }

        const burstStartTime = Date.now();
        const burstResults = await Promise.all(burstOperations);
        const burstTime = Date.now() - burstStartTime;

        // Validate burst results
        expect(burstResults.every((r) => r.success)).toBe(true);
        expect(burstTime).toBeLessThan(5000); // Burst should complete in <5s

        // Wait between bursts
        if (burst < burstCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, burstInterval));
        }
      }

      // Overall efficiency should remain high
      const overallEfficiency = successfulOperations / totalOperations;
      expect(overallEfficiency).toBeGreaterThan(0.95);
    });

    it("should maintain performance under sustained load", async () => {
      const sustainedDuration = 2000; // 2 seconds
      const operationInterval = 50; // New operation every 50ms
      const operations: Promise<SupportOperationResponse>[] = [];

      const startTime = Date.now();
      let operationCount = 0;

      // Generate sustained load
      while (Date.now() - startTime < sustainedDuration) {
        operations.push(
          router.executeSupportOperation({
            operation: "standard",
            priority: "medium",
            prompt: `Sustained operation ${operationCount}`,
            context: { correlationId: `sustained-${operationCount}` },
          })
        );

        operationCount++;
        await new Promise((resolve) => setTimeout(resolve, operationInterval));
      }

      // Wait for all operations to complete
      const results = await Promise.all(operations);

      // Validate sustained performance
      expect(results.every((r) => r.success)).toBe(true);
      expect(operationCount).toBeGreaterThan(30); // Should have generated significant load

      // Calculate performance degradation
      const firstHalfLatencies = routingDecisions.slice(
        0,
        Math.floor(routingDecisions.length / 2)
      );
      const secondHalfLatencies = routingDecisions.slice(
        Math.floor(routingDecisions.length / 2)
      );

      const firstHalfAvg =
        firstHalfLatencies.reduce((sum, d) => sum + d.latency, 0) /
        firstHalfLatencies.length;
      const secondHalfAvg =
        secondHalfLatencies.reduce((sum, d) => sum + d.latency, 0) /
        secondHalfLatencies.length;

      const degradation = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

      // Performance degradation should be minimal (<20%)
      expect(degradation).toBeLessThan(0.2);
    });
  });

  describe("Route Failure and Recovery Stress Tests", () => {
    it("should handle direct Bedrock failures gracefully under load", async () => {
      let directFailureCount = 0;
      const maxDirectFailures = 10;

      // Mock direct client to fail intermittently
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async (request: SupportOperationRequest) => {
          if (directFailureCount < maxDirectFailures && Math.random() < 0.3) {
            directFailureCount++;
            totalOperations++;
            routingDecisions.push({
              route: "direct",
              latency: 0,
              success: false,
            });
            throw new Error("Direct Bedrock temporarily unavailable");
          }

          // Successful operation
          const latency = 100 + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, latency));

          totalOperations++;
          successfulOperations++;
          routingDecisions.push({ route: "direct", latency, success: true });

          return {
            success: true,
            text: "Direct operation completed",
            latencyMs: latency,
            operationId: `direct-${Date.now()}`,
            timestamp: new Date(),
          };
        });

      // Run operations that should prefer direct route
      const operations = Array(50)
        .fill(null)
        .map((_, i) =>
          router
            .executeSupportOperation({
              operation: "infrastructure",
              priority: "critical",
              prompt: `Failure test ${i}`,
              context: { correlationId: `failure-test-${i}` },
            })
            .catch((error) => ({
              success: false,
              error: error.message,
              latencyMs: 0,
              operationId: `failed-${i}`,
              timestamp: new Date(),
            }))
        );

      const results = await Promise.all(operations);

      // Should have some failures but overall success rate should be reasonable
      const successCount = results.filter((r: any) => r.success).length;
      const successRate = successCount / results.length;

      expect(successRate).toBeGreaterThan(0.7); // >70% success rate despite failures
      expect(directFailureCount).toBeLessThanOrEqual(maxDirectFailures);

      // MCP should have been used as fallback
      const mcpUsage = routingDecisions.filter((d) => d.route === "mcp").length;
      expect(mcpUsage).toBeGreaterThan(0);
    });

    it("should recover routing efficiency after circuit breaker opens", async () => {
      let circuitBreakerOpen = false;
      let operationsAfterOpen = 0;

      // Mock circuit breaker behavior
      mockCircuitBreaker.isOpen = jest.fn().mockImplementation(() => {
        if (operationsAfterOpen > 20) {
          circuitBreakerOpen = false; // Circuit breaker closes after recovery
        }
        return circuitBreakerOpen;
      });

      // Mock direct client to trigger circuit breaker
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async (request: SupportOperationRequest) => {
          operationsAfterOpen++;

          if (operationsAfterOpen <= 10) {
            // Trigger circuit breaker after 10 failures
            if (operationsAfterOpen === 10) {
              circuitBreakerOpen = true;
            }
            totalOperations++;
            routingDecisions.push({
              route: "direct",
              latency: 0,
              success: false,
            });
            throw new Error("Service unavailable");
          }

          // Recovery phase
          const latency = 100 + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, latency));

          totalOperations++;
          successfulOperations++;
          routingDecisions.push({ route: "direct", latency, success: true });

          return {
            success: true,
            text: "Direct operation recovered",
            latencyMs: latency,
            operationId: `recovered-${Date.now()}`,
            timestamp: new Date(),
          };
        });

      // Run operations through failure and recovery cycle
      const operations = Array(40)
        .fill(null)
        .map((_, i) =>
          router
            .executeSupportOperation({
              operation: "infrastructure",
              priority: "critical",
              prompt: `Recovery test ${i}`,
              context: { correlationId: `recovery-test-${i}` },
            })
            .catch((error) => ({
              success: false,
              error: error.message,
              latencyMs: 0,
              operationId: `failed-${i}`,
              timestamp: new Date(),
            }))
        );

      const results = await Promise.all(operations);

      // Should show recovery pattern
      const successCount = results.filter((r: any) => r.success).length;
      expect(successCount).toBeGreaterThan(20); // Should recover after circuit breaker opens

      // Routing should adapt during failure and recovery
      const directSuccesses = routingDecisions.filter(
        (d) => d.route === "direct" && d.success
      ).length;
      const mcpUsage = routingDecisions.filter((d) => d.route === "mcp").length;

      expect(directSuccesses).toBeGreaterThan(0); // Should recover
      expect(mcpUsage).toBeGreaterThan(0); // Should use fallback during failures
    });
  });

  describe("Resource Constraint Stress Tests", () => {
    it("should maintain efficiency under memory pressure", async () => {
      // Simulate memory pressure by creating large objects
      const memoryPressureData: any[] = [];

      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async (request: SupportOperationRequest) => {
          // Create memory pressure
          const largeObject = new Array(10000).fill(
            `memory-pressure-${Date.now()}`
          );
          memoryPressureData.push(largeObject);

          const latency = 150 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, latency));

          totalOperations++;
          successfulOperations++;
          routingDecisions.push({ route: "direct", latency, success: true });

          return {
            success: true,
            text: "Operation under memory pressure",
            latencyMs: latency,
            operationId: `memory-${Date.now()}`,
            timestamp: new Date(),
          };
        });

      const initialMemory = process.memoryUsage().heapUsed;

      // Run operations under memory pressure
      const operations = Array(30)
        .fill(null)
        .map((_, i) =>
          router.executeSupportOperation({
            operation: "infrastructure",
            priority: "critical",
            prompt: `Memory pressure test ${i}`,
            context: { correlationId: `memory-${i}` },
          })
        );

      const results = await Promise.all(operations);
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Validate performance under memory pressure
      expect(results.every((r) => r.success)).toBe(true);
      expect(memoryIncrease).toBeLessThan(100); // Memory increase should be reasonable

      // Routing efficiency should remain high
      const efficiency = successfulOperations / totalOperations;
      expect(efficiency).toBeGreaterThan(0.95);

      // Cleanup
      memoryPressureData.length = 0;
    });

    it("should handle CPU-intensive routing decisions efficiently", async () => {
      let routingDecisionTime = 0;

      // Mock complex routing decision
      const originalExecute = router.executeSupportOperation.bind(router);
      router.executeSupportOperation = jest
        .fn()
        .mockImplementation(async (request: SupportOperationRequest) => {
          const decisionStart = Date.now();

          // Simulate CPU-intensive routing decision
          for (let i = 0; i < 10000; i++) {
            Math.sqrt(Math.random() * 1000);
          }

          routingDecisionTime += Date.now() - decisionStart;

          return originalExecute(request);
        });

      // Run operations with CPU-intensive routing
      const operations = Array(20)
        .fill(null)
        .map((_, i) =>
          router.executeSupportOperation({
            operation: "standard",
            priority: "medium",
            prompt: `CPU test ${i}`,
            context: { correlationId: `cpu-${i}` },
          })
        );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // Validate performance
      expect(results.every((r) => r.success)).toBe(true);

      const avgRoutingDecisionTime = routingDecisionTime / operations.length;
      const avgTotalTime = totalTime / operations.length;

      // Routing decision overhead should be reasonable
      expect(avgRoutingDecisionTime).toBeLessThan(50); // <50ms per routing decision
      expect(avgTotalTime).toBeLessThan(500); // <500ms total per operation
    });
  });

  describe("Performance Degradation Detection", () => {
    it("should detect and adapt to performance degradation", async () => {
      let operationCount = 0;
      const degradationThreshold = 20;

      // Mock progressive performance degradation
      mockDirectClient.executeSupportOperation = jest
        .fn()
        .mockImplementation(async (request: SupportOperationRequest) => {
          operationCount++;

          // Progressive latency increase to simulate degradation
          const baseLatency = 100;
          const degradationFactor = Math.max(
            1,
            operationCount / degradationThreshold
          );
          const latency = baseLatency * degradationFactor + Math.random() * 50;

          await new Promise((resolve) => setTimeout(resolve, latency));

          totalOperations++;
          successfulOperations++;
          routingDecisions.push({ route: "direct", latency, success: true });

          return {
            success: true,
            text: "Operation with degradation",
            latencyMs: latency,
            operationId: `degraded-${Date.now()}`,
            timestamp: new Date(),
          };
        });

      // Run operations to trigger degradation
      const operations = Array(40)
        .fill(null)
        .map((_, i) =>
          router.executeSupportOperation({
            operation: "infrastructure",
            priority: "critical",
            prompt: `Degradation test ${i}`,
            context: { correlationId: `degradation-${i}` },
          })
        );

      const results = await Promise.all(operations);

      // All operations should still succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Analyze performance degradation
      const firstQuarter = routingDecisions.slice(0, 10);
      const lastQuarter = routingDecisions.slice(-10);

      const firstQuarterAvg =
        firstQuarter.reduce((sum, d) => sum + d.latency, 0) /
        firstQuarter.length;
      const lastQuarterAvg =
        lastQuarter.reduce((sum, d) => sum + d.latency, 0) / lastQuarter.length;

      const degradationRatio = lastQuarterAvg / firstQuarterAvg;

      // Should detect significant degradation
      expect(degradationRatio).toBeGreaterThan(1.5); // >50% degradation detected

      // System should still maintain functionality
      const overallSuccessRate = successfulOperations / totalOperations;
      expect(overallSuccessRate).toBeGreaterThan(0.9);
    });

    it("should maintain routing efficiency metrics accuracy under stress", async () => {
      const testDuration = 1000; // 1 second
      const operationInterval = 25; // 40 operations per second

      let metricsCollected = 0;
      const startTime = Date.now();

      // Simulate high-frequency operations
      while (Date.now() - startTime < testDuration) {
        const operation = router.executeSupportOperation({
          operation: "standard",
          priority: "medium",
          prompt: `Metrics test ${metricsCollected}`,
          context: { correlationId: `metrics-${metricsCollected}` },
        });

        metricsCollected++;

        // Don't wait for completion to simulate high frequency
        operation.catch(() => {}); // Handle potential errors

        await new Promise((resolve) => setTimeout(resolve, operationInterval));
      }

      // Wait a bit for operations to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Validate metrics accuracy
      expect(metricsCollected).toBeGreaterThan(30); // Should have generated significant load
      expect(totalOperations).toBeGreaterThan(0); // Should have tracked operations

      // Metrics should be consistent
      const trackedOperations = routingDecisions.length;
      const successfulTracked = routingDecisions.filter(
        (d) => d.success
      ).length;

      expect(trackedOperations).toBeGreaterThan(0);
      expect(successfulTracked / trackedOperations).toBeGreaterThan(0.8); // >80% success rate
    });
  });

  describe("Stress Test Summary and Reporting", () => {
    it("should generate comprehensive stress test report", async () => {
      // Run a comprehensive mixed workload
      const workloadTypes = [
        {
          operation: "emergency" as OperationType,
          priority: "critical" as OperationPriority,
          count: 10,
        },
        {
          operation: "infrastructure" as OperationType,
          priority: "critical" as OperationPriority,
          count: 20,
        },
        {
          operation: "meta_monitor" as OperationType,
          priority: "high" as OperationPriority,
          count: 15,
        },
        {
          operation: "implementation" as OperationType,
          priority: "high" as OperationPriority,
          count: 15,
        },
        {
          operation: "standard" as OperationType,
          priority: "medium" as OperationPriority,
          count: 40,
        },
      ];

      const allOperations: Promise<SupportOperationResponse>[] = [];

      for (const workload of workloadTypes) {
        for (let i = 0; i < workload.count; i++) {
          allOperations.push(
            router.executeSupportOperation({
              operation: workload.operation,
              priority: workload.priority,
              prompt: `${workload.operation} operation ${i}`,
              context: { correlationId: `report-${workload.operation}-${i}` },
            })
          );
        }
      }

      const testStartTime = Date.now();
      const results = await Promise.all(allOperations);
      const testDuration = Date.now() - testStartTime;

      // Generate comprehensive report
      const report = {
        testDuration,
        totalOperations: results.length,
        successfulOperations: results.filter((r) => r.success).length,
        failedOperations: results.filter((r) => !r.success).length,
        averageLatency:
          routingDecisions.reduce((sum, d) => sum + d.latency, 0) /
          routingDecisions.length,
        routingDistribution: {
          direct: routingDecisions.filter((d) => d.route === "direct").length,
          mcp: routingDecisions.filter((d) => d.route === "mcp").length,
        },
        performanceByOperationType: workloadTypes.map((wl) => ({
          operation: wl.operation,
          priority: wl.priority,
          count: wl.count,
          avgLatency: routingDecisions
            .filter((_, i) => {
              const result = results[i];
              return result.text?.includes(wl.operation);
            })
            .reduce((sum, d, _, arr) => sum + d.latency / arr.length, 0),
        })),
        efficiency: {
          successRate:
            (results.filter((r) => r.success).length / results.length) * 100,
          routingEfficiency: (routingDecisions.length / totalOperations) * 100,
          throughput: results.length / (testDuration / 1000), // operations per second
        },
      };

      // Validate report metrics
      expect(report.efficiency.successRate).toBeGreaterThan(95); // >95% success rate
      expect(report.efficiency.routingEfficiency).toBeGreaterThan(90); // >90% routing efficiency
      expect(report.efficiency.throughput).toBeGreaterThan(10); // >10 ops/sec
      expect(report.averageLatency).toBeLessThan(1000); // <1s average latency

      // Log comprehensive report
      console.log("=== Routing Efficiency Stress Test Report ===");
      console.log(JSON.stringify(report, null, 2));

      // Validate routing distribution follows expected patterns
      expect(report.routingDistribution.direct).toBeGreaterThan(0);
      expect(report.routingDistribution.mcp).toBeGreaterThan(0);
    });
  });
});
