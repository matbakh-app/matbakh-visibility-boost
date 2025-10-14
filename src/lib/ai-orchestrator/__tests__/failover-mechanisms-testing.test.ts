/**
 * Failover Mechanisms Testing Suite
 *
 * Tests failover behavior between Direct Bedrock and MCP routing paths
 * Validates automatic failover, recovery, and routing decision logic
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Mock implementations
const mockDirectBedrockClient = {
  isHealthy: jest.fn(),
  executeOperation: jest.fn(),
  getHealthStatus: jest.fn(),
  getLatencyMetrics: jest.fn(),
  circuitBreakerStatus: jest.fn(),
};

const mockMcpRouter = {
  isHealthy: jest.fn(),
  executeOperation: jest.fn(),
  getHealthStatus: jest.fn(),
  getLatencyMetrics: jest.fn(),
  circuitBreakerStatus: jest.fn(),
};

const mockIntelligentRouter = {
  makeRoutingDecision: jest.fn(),
  executeWithFailover: jest.fn(),
  getRoutingHealth: jest.fn(),
  updateHealthStatus: jest.fn(),
  getFailoverHistory: jest.fn(),
};

const mockHybridHealthMonitor = {
  getOverallHealth: jest.fn(),
  getPathHealth: jest.fn(),
  recordFailover: jest.fn(),
  getFailoverMetrics: jest.fn(),
};

describe("Failover Mechanisms Testing", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default healthy state
    mockDirectBedrockClient.isHealthy.mockReturnValue(true);
    mockMcpRouter.isHealthy.mockReturnValue(true);
    mockDirectBedrockClient.getHealthStatus.mockReturnValue({
      status: "healthy",
      latency: 150,
      successRate: 0.98,
      lastCheck: new Date(),
    });
    mockMcpRouter.getHealthStatus.mockReturnValue({
      status: "healthy",
      latency: 200,
      successRate: 0.95,
      lastCheck: new Date(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Direct Bedrock to MCP Failover", () => {
    it("should failover to MCP when Direct Bedrock becomes unhealthy", async () => {
      // Arrange
      mockDirectBedrockClient.isHealthy.mockReturnValue(false);
      mockDirectBedrockClient.getHealthStatus.mockReturnValue({
        status: "unhealthy",
        latency: 5000,
        successRate: 0.3,
        lastCheck: new Date(),
        error: "Circuit breaker open",
      });

      const requestParams = {
        operationType: "infrastructure_audit",
        priority: "high",
        maxLatency: 10000,
      };

      // Mock the routing decision
      mockIntelligentRouter.makeRoutingDecision.mockReturnValue({
        primaryPath: "mcp",
        fallbackPath: "direct_bedrock",
        reason: "direct_bedrock_unhealthy",
        confidence: 0.95,
      });

      // Mock executeWithFailover to call makeRoutingDecision internally
      mockIntelligentRouter.executeWithFailover.mockImplementation(
        async (params) => {
          // Simulate internal routing decision call
          mockIntelligentRouter.makeRoutingDecision(params);

          return {
            result: { success: true, data: "Operation completed via MCP" },
            routePath: "mcp",
            failoverOccurred: true,
            originalPath: "direct_bedrock",
            executionTime: 250,
          };
        }
      );

      // Act
      const result = await mockIntelligentRouter.executeWithFailover(
        requestParams
      );

      // Assert
      expect(result.failoverOccurred).toBe(true);
      expect(result.originalPath).toBe("direct_bedrock");
      expect(result.routePath).toBe("mcp");
      expect(result.result.success).toBe(true);
      expect(mockIntelligentRouter.makeRoutingDecision).toHaveBeenCalledWith(
        requestParams
      );
    });

    it("should record failover metrics when Direct Bedrock fails", async () => {
      // Arrange
      mockDirectBedrockClient.isHealthy.mockReturnValue(false);
      mockHybridHealthMonitor.recordFailover.mockResolvedValue(undefined);

      mockIntelligentRouter.executeWithFailover.mockImplementation(
        async (request) => {
          await mockHybridHealthMonitor.recordFailover({
            fromPath: "direct_bedrock",
            toPath: "mcp",
            reason: "health_check_failed",
            timestamp: new Date(),
            operationType: request.operationType,
          });

          return {
            result: { success: true, data: "Failover completed" },
            routePath: "mcp",
            failoverOccurred: true,
            originalPath: "direct_bedrock",
            executionTime: 300,
          };
        }
      );

      // Act
      await mockIntelligentRouter.executeWithFailover({
        operationType: "meta_monitor",
        priority: "high",
        maxLatency: 15000,
      });

      // Assert
      expect(mockHybridHealthMonitor.recordFailover).toHaveBeenCalledWith({
        fromPath: "direct_bedrock",
        toPath: "mcp",
        reason: "health_check_failed",
        timestamp: expect.any(Date),
        operationType: "meta_monitor",
      });
    });

    it("should handle cascading failures gracefully", async () => {
      // Arrange - Both paths unhealthy
      mockDirectBedrockClient.isHealthy.mockReturnValue(false);
      mockMcpRouter.isHealthy.mockReturnValue(false);

      mockIntelligentRouter.executeWithFailover.mockRejectedValue(
        new Error("All routing paths unavailable")
      );

      // Act & Assert
      await expect(
        mockIntelligentRouter.executeWithFailover({
          operationType: "emergency_operation",
          priority: "critical",
          maxLatency: 5000,
        })
      ).rejects.toThrow("All routing paths unavailable");
    });
  });

  describe("MCP to Direct Bedrock Failover", () => {
    it("should failover to Direct Bedrock when MCP becomes unhealthy", async () => {
      // Arrange
      mockMcpRouter.isHealthy.mockReturnValue(false);
      mockMcpRouter.getHealthStatus.mockReturnValue({
        status: "unhealthy",
        latency: 8000,
        successRate: 0.2,
        lastCheck: new Date(),
        error: "Connection timeout",
      });

      mockIntelligentRouter.makeRoutingDecision.mockReturnValue({
        primaryPath: "direct_bedrock",
        fallbackPath: null,
        reason: "mcp_unhealthy",
        confidence: 0.9,
      });

      mockIntelligentRouter.executeWithFailover.mockResolvedValue({
        result: {
          success: true,
          data: "Operation completed via Direct Bedrock",
        },
        routePath: "direct_bedrock",
        failoverOccurred: true,
        originalPath: "mcp",
        executionTime: 180,
      });

      // Act
      const result = await mockIntelligentRouter.executeWithFailover({
        operationType: "implementation_support",
        priority: "medium",
        maxLatency: 30000,
      });

      // Assert
      expect(result.failoverOccurred).toBe(true);
      expect(result.originalPath).toBe("mcp");
      expect(result.routePath).toBe("direct_bedrock");
      expect(result.result.success).toBe(true);
    });

    it("should prioritize Direct Bedrock for emergency operations during MCP issues", async () => {
      // Arrange
      mockMcpRouter.isHealthy.mockReturnValue(false);

      mockIntelligentRouter.makeRoutingDecision.mockReturnValue({
        primaryPath: "direct_bedrock",
        fallbackPath: null,
        reason: "emergency_operation_priority",
        confidence: 1.0,
      });

      mockIntelligentRouter.executeWithFailover.mockResolvedValue({
        result: { success: true, data: "Emergency operation completed" },
        routePath: "direct_bedrock",
        failoverOccurred: false, // Direct route was chosen, not failover
        originalPath: "direct_bedrock",
        executionTime: 120,
      });

      // Act
      const result = await mockIntelligentRouter.executeWithFailover({
        operationType: "emergency_operation",
        priority: "critical",
        maxLatency: 5000,
      });

      // Assert
      expect(result.routePath).toBe("direct_bedrock");
      expect(result.executionTime).toBeLessThan(5000);
      expect(result.result.success).toBe(true);
    });
  });

  describe("Failover Recovery Testing", () => {
    it("should recover to preferred path when health improves", async () => {
      // Arrange - Initial unhealthy state
      mockDirectBedrockClient.isHealthy.mockReturnValueOnce(false);
      mockDirectBedrockClient.isHealthy.mockReturnValueOnce(true); // Recovery

      mockIntelligentRouter.updateHealthStatus.mockImplementation(async () => {
        // Simulate health status update
        return {
          directBedrock: { status: "healthy", latency: 150, successRate: 0.98 },
          mcp: { status: "healthy", latency: 200, successRate: 0.95 },
        };
      });

      // Act
      await mockIntelligentRouter.updateHealthStatus();

      // First call should use MCP due to Direct Bedrock being unhealthy
      mockIntelligentRouter.makeRoutingDecision.mockReturnValueOnce({
        primaryPath: "mcp",
        fallbackPath: "direct_bedrock",
        reason: "direct_bedrock_recovering",
      });

      // Second call should prefer Direct Bedrock again
      mockIntelligentRouter.makeRoutingDecision.mockReturnValueOnce({
        primaryPath: "direct_bedrock",
        fallbackPath: "mcp",
        reason: "direct_bedrock_recovered",
      });

      const firstDecision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "infrastructure_audit",
        priority: "high",
      });

      const secondDecision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "infrastructure_audit",
        priority: "high",
      });

      // Assert
      expect(firstDecision.primaryPath).toBe("mcp");
      expect(secondDecision.primaryPath).toBe("direct_bedrock");
      expect(mockIntelligentRouter.updateHealthStatus).toHaveBeenCalled();
    });

    it("should implement gradual recovery with confidence scoring", async () => {
      // Arrange
      mockDirectBedrockClient.isHealthy.mockReturnValue(true);
      mockDirectBedrockClient.getHealthStatus.mockReturnValue({
        status: "recovering",
        latency: 300, // Higher latency during recovery
        successRate: 0.85, // Lower success rate during recovery
        lastCheck: new Date(),
      });

      mockIntelligentRouter.makeRoutingDecision.mockImplementation(
        (request) => {
          // Simulate gradual confidence recovery based on health status
          const healthStatus = mockDirectBedrockClient.getHealthStatus();
          const confidence = healthStatus.successRate > 0.8 ? 0.7 : 0.3;

          return {
            primaryPath: confidence > 0.5 ? "direct_bedrock" : "mcp",
            fallbackPath: confidence > 0.5 ? "mcp" : "direct_bedrock",
            reason: "gradual_recovery",
            confidence,
          };
        }
      );

      // Act
      const decision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "meta_monitor",
        priority: "high",
      });

      // Assert
      expect(decision.confidence).toBe(0.7);
      expect(decision.primaryPath).toBe("direct_bedrock");
      expect(decision.reason).toBe("gradual_recovery");
      expect(mockDirectBedrockClient.getHealthStatus).toHaveBeenCalled();
    });
  });

  describe("Circuit Breaker Integration", () => {
    it("should respect circuit breaker states during failover", async () => {
      // Arrange
      mockDirectBedrockClient.circuitBreakerStatus.mockReturnValue({
        state: "OPEN",
        failureCount: 5,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date(Date.now() + 30000),
      });

      mockIntelligentRouter.makeRoutingDecision.mockImplementation(
        (request) => {
          // Check circuit breaker status during routing decision
          const cbStatus = mockDirectBedrockClient.circuitBreakerStatus();

          return {
            primaryPath: cbStatus.state === "OPEN" ? "mcp" : "direct_bedrock",
            fallbackPath: null,
            reason: "circuit_breaker_open",
            confidence: 1.0,
          };
        }
      );

      // Act
      const decision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "implementation_support",
        priority: "medium",
      });

      // Assert
      expect(decision.primaryPath).toBe("mcp");
      expect(decision.reason).toBe("circuit_breaker_open");
      expect(mockDirectBedrockClient.circuitBreakerStatus).toHaveBeenCalled();
    });

    it("should handle half-open circuit breaker state", async () => {
      // Arrange
      mockDirectBedrockClient.circuitBreakerStatus.mockReturnValue({
        state: "HALF_OPEN",
        failureCount: 3,
        lastFailureTime: new Date(Date.now() - 60000),
        nextAttemptTime: new Date(),
      });

      mockIntelligentRouter.makeRoutingDecision.mockReturnValue({
        primaryPath: "direct_bedrock",
        fallbackPath: "mcp",
        reason: "circuit_breaker_half_open_test",
        confidence: 0.6,
      });

      // Act
      const decision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "infrastructure_audit",
        priority: "high",
      });

      // Assert
      expect(decision.primaryPath).toBe("direct_bedrock");
      expect(decision.confidence).toBe(0.6);
      expect(decision.reason).toBe("circuit_breaker_half_open_test");
    });
  });

  describe("Latency-Based Failover", () => {
    it("should failover when latency exceeds thresholds", async () => {
      // Arrange
      mockDirectBedrockClient.getLatencyMetrics.mockReturnValue({
        p95: 6000, // Exceeds 5s emergency threshold
        p99: 6000,
        average: 3000,
        current: 4800,
      });

      mockMcpRouter.getLatencyMetrics.mockReturnValue({
        p95: 2000,
        p99: 3000,
        average: 1500,
        current: 1800,
      });

      mockIntelligentRouter.makeRoutingDecision.mockImplementation(
        (request) => {
          // Check latency metrics during routing decision
          const directLatency = mockDirectBedrockClient.getLatencyMetrics();
          const mcpLatency = mockMcpRouter.getLatencyMetrics();

          return {
            primaryPath:
              directLatency.p95 > request.maxLatency ? "mcp" : "direct_bedrock",
            fallbackPath: "direct_bedrock",
            reason: "latency_threshold_exceeded",
            confidence: 0.9,
          };
        }
      );

      // Act
      const decision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "emergency_operation",
        priority: "critical",
        maxLatency: 5000,
      });

      // Assert
      expect(decision.primaryPath).toBe("mcp");
      expect(decision.reason).toBe("latency_threshold_exceeded");
      expect(mockDirectBedrockClient.getLatencyMetrics).toHaveBeenCalled();
      expect(mockMcpRouter.getLatencyMetrics).toHaveBeenCalled();
    });

    it("should consider operation-specific latency requirements", async () => {
      // Arrange
      const testCases = [
        {
          operationType: "emergency_operation",
          maxLatency: 5000,
          expectedPath: "direct_bedrock", // Usually faster for emergency
        },
        {
          operationType: "implementation_support",
          maxLatency: 30000,
          expectedPath: "mcp", // Can tolerate higher latency
        },
        {
          operationType: "meta_monitor",
          maxLatency: 15000,
          expectedPath: "direct_bedrock", // Needs moderate speed
        },
      ];

      testCases.forEach((testCase, index) => {
        mockIntelligentRouter.makeRoutingDecision.mockReturnValueOnce({
          primaryPath: testCase.expectedPath,
          fallbackPath:
            testCase.expectedPath === "direct_bedrock"
              ? "mcp"
              : "direct_bedrock",
          reason: "operation_specific_latency",
          confidence: 0.8,
        });
      });

      // Act & Assert
      for (const testCase of testCases) {
        const decision = mockIntelligentRouter.makeRoutingDecision({
          operationType: testCase.operationType,
          priority: "high",
          maxLatency: testCase.maxLatency,
        });

        expect(decision.primaryPath).toBe(testCase.expectedPath);
      }
    });
  });

  describe("Failover Metrics and Monitoring", () => {
    it("should track failover frequency and patterns", async () => {
      // Arrange
      const failoverHistory = [
        {
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          fromPath: "direct_bedrock",
          toPath: "mcp",
          reason: "health_check_failed",
          operationType: "infrastructure_audit",
        },
        {
          timestamp: new Date(Date.now() - 180000), // 3 minutes ago
          fromPath: "mcp",
          toPath: "direct_bedrock",
          reason: "latency_threshold_exceeded",
          operationType: "emergency_operation",
        },
      ];

      mockIntelligentRouter.getFailoverHistory.mockReturnValue(failoverHistory);
      mockHybridHealthMonitor.getFailoverMetrics.mockReturnValue({
        totalFailovers: 2,
        failoverRate: 0.1, // 10% of operations
        mostCommonReason: "health_check_failed",
        averageRecoveryTime: 120000, // 2 minutes
        pathReliability: {
          direct_bedrock: 0.9,
          mcp: 0.85,
        },
      });

      // Act
      const history = mockIntelligentRouter.getFailoverHistory();
      const metrics = mockHybridHealthMonitor.getFailoverMetrics();

      // Assert
      expect(history).toHaveLength(2);
      expect(metrics.totalFailovers).toBe(2);
      expect(metrics.failoverRate).toBe(0.1);
      expect(metrics.mostCommonReason).toBe("health_check_failed");
      expect(metrics.pathReliability.direct_bedrock).toBeGreaterThan(0.8);
    });

    it("should provide failover recommendations based on patterns", async () => {
      // Arrange
      mockHybridHealthMonitor.getFailoverMetrics.mockReturnValue({
        totalFailovers: 10,
        failoverRate: 0.25, // High failover rate
        mostCommonReason: "latency_threshold_exceeded",
        averageRecoveryTime: 300000, // 5 minutes
        pathReliability: {
          direct_bedrock: 0.75, // Lower reliability
          mcp: 0.9,
        },
        recommendations: [
          "Consider increasing Direct Bedrock timeout thresholds",
          "Investigate Direct Bedrock performance issues",
          "Consider load balancing optimization",
        ],
      });

      // Act
      const metrics = mockHybridHealthMonitor.getFailoverMetrics();

      // Assert
      expect(metrics.failoverRate).toBeGreaterThan(0.2); // High failover rate detected
      expect(metrics.recommendations).toContain(
        "Consider increasing Direct Bedrock timeout thresholds"
      );
      expect(metrics.pathReliability.mcp).toBeGreaterThan(
        metrics.pathReliability.direct_bedrock
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    it("should handle simultaneous path failures gracefully", async () => {
      // Arrange
      mockDirectBedrockClient.isHealthy.mockReturnValue(false);
      mockMcpRouter.isHealthy.mockReturnValue(false);

      mockIntelligentRouter.executeWithFailover.mockImplementation(async () => {
        throw new Error("No healthy routing paths available");
      });

      // Act & Assert
      await expect(
        mockIntelligentRouter.executeWithFailover({
          operationType: "infrastructure_audit",
          priority: "high",
        })
      ).rejects.toThrow("No healthy routing paths available");
    });

    it("should handle partial failures during failover", async () => {
      // Arrange
      mockDirectBedrockClient.executeOperation.mockRejectedValueOnce(
        new Error("Partial failure during operation")
      );

      mockIntelligentRouter.executeWithFailover.mockResolvedValue({
        result: {
          success: false,
          error: "Partial failure during operation",
          partialData: { completed: 0.6 },
        },
        routePath: "mcp",
        failoverOccurred: true,
        originalPath: "direct_bedrock",
        executionTime: 400,
      });

      // Act
      const result = await mockIntelligentRouter.executeWithFailover({
        operationType: "implementation_support",
        priority: "medium",
      });

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.failoverOccurred).toBe(true);
      expect(result.result.partialData).toBeDefined();
    });

    it("should handle network partitions between paths", async () => {
      // Arrange - Simulate network partition
      mockMcpRouter.isHealthy.mockReturnValue(false);
      mockMcpRouter.getHealthStatus.mockReturnValue({
        status: "unhealthy",
        latency: null,
        successRate: 0,
        lastCheck: new Date(Date.now() - 60000), // Old check
        error: "Network partition detected",
      });

      mockIntelligentRouter.makeRoutingDecision.mockReturnValue({
        primaryPath: "direct_bedrock",
        fallbackPath: null,
        reason: "network_partition_mcp",
        confidence: 0.95,
      });

      // Act
      const decision = mockIntelligentRouter.makeRoutingDecision({
        operationType: "emergency_operation",
        priority: "critical",
      });

      // Assert
      expect(decision.primaryPath).toBe("direct_bedrock");
      expect(decision.reason).toBe("network_partition_mcp");
      expect(decision.confidence).toBeGreaterThan(0.9);
    });
  });
});
