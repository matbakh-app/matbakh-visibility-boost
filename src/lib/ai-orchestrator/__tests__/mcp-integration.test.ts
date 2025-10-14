/**
 * MCP Integration Tests
 *
 * Tests for MCP router integration with the intelligent router and Bedrock support system.
 */

// Mock dependencies BEFORE imports
jest.mock("../ai-feature-flags");
jest.mock("../circuit-breaker");
jest.mock("../audit-trail-system");

import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock WebSocket for MCP router
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: (error: any) => void;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    // Auto-respond to messages
    try {
      const message = JSON.parse(data);
      if (message.method === "support_operation") {
        setTimeout(() => {
          const response = {
            id: message.id,
            type: "response",
            result: {
              operationId: `mcp-${Date.now()}`,
              success: true,
              data: "MCP operation completed",
            },
            timestamp: new Date().toISOString(),
            correlationId: message.correlationId,
            retryCount: 0,
            priority: message.priority,
          };
          this.onmessage?.({ data: JSON.stringify(response) });
        }, 5);
      }
    } catch (error) {
      // Ignore invalid JSON
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => this.onclose?.(), 5);
  }
}

(global as any).WebSocket = MockWebSocket;

// Configure mocks
const { AiFeatureFlags } = jest.requireMock("../ai-feature-flags");
AiFeatureFlags.mockImplementation(() => ({
  isEnabled: jest.fn().mockReturnValue(true),
}));

const { CircuitBreaker } = jest.requireMock("../circuit-breaker");
CircuitBreaker.mockImplementation(() => ({
  canExecute: jest.fn().mockReturnValue(true),
  isOpen: jest.fn().mockReturnValue(false),
  recordSuccess: jest.fn(),
  recordFailure: jest.fn(),
}));

const { AuditTrailSystem } = jest.requireMock("../audit-trail-system");
AuditTrailSystem.mockImplementation(() => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
  logSupportOperation: jest.fn().mockResolvedValue(undefined),
  logHybridRoutingOperation: jest.fn().mockResolvedValue(undefined),
  logComplianceCheck: jest.fn().mockResolvedValue(undefined),
}));

describe("MCP Integration", () => {
  jest.setTimeout(10000); // Increase timeout for integration tests

  let intelligentRouter: IntelligentRouter;
  let mcpRouter: MCPRouter;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;

  beforeEach(async () => {
    // Create mock direct Bedrock client
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        operationId: "direct-op-123",
        latencyMs: 100,
        timestamp: new Date(),
        result: "Direct Bedrock result",
      }),
      performHealthCheck: jest.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 50,
        timestamp: new Date(),
      }),
    } as any;

    // Create MCP router
    mcpRouter = new MCPRouter({
      endpoint: "ws://localhost:8080/mcp",
      timeout: 5000,
      maxRetries: 1,
      retryDelay: 100,
      queueMaxSize: 100,
      healthCheckInterval: 1000,
      enableCompression: false,
      enableEncryption: false,
    });

    // Wait for MCP connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Create intelligent router with both clients
    intelligentRouter = new IntelligentRouter(
      mockDirectBedrockClient,
      mcpRouter
    );
  });

  afterEach(() => {
    intelligentRouter.destroy();
    mcpRouter.destroy();
  });

  describe("Hybrid Routing Integration", () => {
    it("should route emergency operations to direct Bedrock", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency system check required",
        context: {
          metadata: { urgency: "high" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalledWith(request);
      expect(response.operationId).toContain("direct");
    });

    it("should route standard operations to MCP", async () => {
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Analyze system performance",
        context: {
          metadata: { type: "analysis" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("mcp");
    });

    it("should fallback from direct to MCP when direct fails", async () => {
      // Mock direct client to fail
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Direct Bedrock unavailable")
      );

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Run infrastructure audit",
        context: {
          metadata: { audit: true },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("fallback");
    });

    it("should fallback from MCP to direct when MCP fails", async () => {
      // Close MCP connection to simulate failure
      (mcpRouter as any).connection?.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Standard analysis operation",
        context: {
          metadata: { type: "analysis" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalled();
    });
  });

  describe("Health Monitoring Integration", () => {
    it("should check health of both routes", async () => {
      const directHealth = await intelligentRouter.checkRouteHealth("direct");
      const mcpHealth = await intelligentRouter.checkRouteHealth("mcp");

      expect(directHealth.isHealthy).toBe(true);
      expect(directHealth.route).toBe("direct");
      expect(mcpHealth.isHealthy).toBe(true);
      expect(mcpHealth.route).toBe("mcp");
    });

    it("should detect MCP route as unhealthy when disconnected", async () => {
      // Disconnect MCP
      (mcpRouter as any).connection?.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const mcpHealth = await intelligentRouter.checkRouteHealth("mcp");

      expect(mcpHealth.isHealthy).toBe(false);
    });

    it("should provide routing efficiency metrics", () => {
      const efficiency = intelligentRouter.getRoutingEfficiency();

      expect(efficiency).toHaveProperty("totalRequests");
      expect(efficiency).toHaveProperty("directRouteUsage");
      expect(efficiency).toHaveProperty("mcpRouteUsage");
      expect(efficiency).toHaveProperty("fallbackUsage");
      expect(efficiency).toHaveProperty("averageLatency");
      expect(efficiency).toHaveProperty("successRate");
    });
  });

  describe("Kiro Bridge Communication", () => {
    it("should send diagnostics through MCP to Kiro", async () => {
      const diagnostics = {
        systemHealth: "good",
        issues: [],
        recommendations: ["Optimize cache usage"],
      };

      await expect(
        mcpRouter.sendDiagnosticsToKiro(diagnostics, "test-correlation-123")
      ).resolves.not.toThrow();
    });

    it("should receive execution data from Kiro through MCP", async () => {
      const executionData = {
        executionId: "kiro-exec-456",
        status: "completed",
        metrics: { duration: 2000, success: true },
      };

      await expect(
        mcpRouter.receiveKiroExecutionData(
          executionData,
          "test-correlation-456"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("Message Queuing and Retry Logic", () => {
    it("should handle message queuing during high load", async () => {
      const requests: SupportOperationRequest[] = Array.from(
        { length: 5 },
        (_, i) => ({
          operation: "standard",
          priority: "medium",
          prompt: `Batch operation ${i}`,
          context: {
            metadata: { batch: i },
          },
        })
      );

      const promises = requests.map((req) =>
        intelligentRouter.executeSupportOperation(req)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.success).toBe(true);
      });
    });

    it("should retry failed MCP operations", async () => {
      // Create a router with retry configuration
      const retryMcpRouter = new MCPRouter({
        endpoint: "ws://localhost:8080/mcp",
        timeout: 1000,
        maxRetries: 2,
        retryDelay: 50,
        queueMaxSize: 100,
        healthCheckInterval: 1000,
        enableCompression: false,
        enableEncryption: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const retryIntelligentRouter = new IntelligentRouter(
        mockDirectBedrockClient,
        retryMcpRouter
      );

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Retry test operation",
        context: {
          metadata: { retry: true },
        },
      };

      const response = await retryIntelligentRouter.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);

      retryIntelligentRouter.destroy();
      retryMcpRouter.destroy();
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle MCP connection errors gracefully", async () => {
      // Simulate connection error
      (mcpRouter as any).connection?.simulateError?.();

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test error handling",
        context: {
          metadata: { test: "error" },
        },
      };

      // Should fallback to direct Bedrock
      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(
        mockDirectBedrockClient.executeSupportOperation
      ).toHaveBeenCalled();
    });

    it("should handle both routes failing", async () => {
      // Make direct client fail
      mockDirectBedrockClient.executeSupportOperation.mockRejectedValue(
        new Error("Direct client error")
      );

      // Close MCP connection
      (mcpRouter as any).connection?.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Test both routes failing",
        context: {
          metadata: { test: "both-fail" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe("Correlation ID Tracking", () => {
    it("should maintain correlation IDs across routing", async () => {
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test correlation tracking",
        context: {
          correlationId: "test-correlation-123",
          metadata: { correlationTest: true },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toBeDefined();

      // Should contain routing information
      expect(response.operationId).toContain("mcp");
    });

    it("should log all MCP communications with correlation IDs", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test logging with correlation",
        context: {
          correlationId: "test-correlation-456",
          metadata: { logging: true },
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      // Should have logged routing decision and MCP operation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[IntelligentRouter]")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Performance and Optimization", () => {
    it("should provide routing optimization recommendations", async () => {
      // Execute several operations to generate metrics
      const requests = Array.from({ length: 10 }, (_, i) => ({
        operation: (i % 2 === 0 ? "standard" : "infrastructure") as const,
        priority: "medium" as const,
        prompt: `Batch operation ${i}`,
        context: {
          metadata: { batch: i },
        },
      }));

      for (const request of requests) {
        await intelligentRouter.executeSupportOperation(request);
      }

      const recommendations = await intelligentRouter.optimizeRouting();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should track routing efficiency metrics", async () => {
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test metrics tracking",
        context: {
          metadata: { metrics: true },
        },
      };

      await intelligentRouter.executeSupportOperation(request);

      const efficiency = intelligentRouter.getRoutingEfficiency();
      expect(efficiency.totalRequests).toBeGreaterThan(0);
      expect(efficiency.mcpRouteUsage).toBeGreaterThan(0);
    });
  });
});
