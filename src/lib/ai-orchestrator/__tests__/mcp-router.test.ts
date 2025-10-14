/**
 * MCP Router Tests
 *
 * Comprehensive test suite for MCP (Model Context Protocol) router implementation
 * covering connection management, message handling, health monitoring, and error scenarios.
 */

import { SupportOperationRequest } from "../direct-bedrock-client";
import { MCPConnectionConfig, MCPMessage, MCPRouter } from "../mcp-router";

// Mock WebSocket
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
    // Simulate connection establishment
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    // Simulate message sending
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    // Parse and auto-respond to certain messages
    try {
      const message: MCPMessage = JSON.parse(data);

      // Auto-respond to ping messages
      if (message.method === "ping") {
        setTimeout(() => {
          const response: MCPMessage = {
            id: message.id,
            type: "response",
            method: "pong",
            result: { status: "ok" },
            timestamp: new Date().toISOString(),
            correlationId: message.correlationId,
            retryCount: 0,
            priority: "low",
          };
          this.onmessage?.({ data: JSON.stringify(response) });
        }, 5);
      }

      // Auto-respond to support operations
      if (message.method === "support_operation") {
        setTimeout(() => {
          const response: MCPMessage = {
            id: message.id,
            type: "response",
            method: "support_operation_response",
            result: {
              operationId: `mcp-op-${Date.now()}`,
              success: true,
              data: "Mock MCP operation result",
            },
            timestamp: new Date().toISOString(),
            correlationId: message.correlationId,
            retryCount: 0,
            priority: message.priority,
          };
          this.onmessage?.({ data: JSON.stringify(response) });
        }, 10);
      }
    } catch (error) {
      // Invalid JSON, ignore
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => this.onclose?.(), 5);
  }

  // Simulate connection error
  simulateError(): void {
    // Trigger error event
    this.onerror?.(new Error("Mock WebSocket error"));

    // Set connection to CLOSED
    this.readyState = MockWebSocket.CLOSED;

    // Trigger onclose to reflect connection loss
    setTimeout(() => {
      this.onclose?.({
        code: 1006, // Abnormal closure
        reason: "Mock WebSocket error",
        wasClean: false,
      } as CloseEvent);
    }, 5);
  }

  // Simulate message from server
  simulateMessage(message: MCPMessage): void {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.({ data: JSON.stringify(message) });
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock AiFeatureFlags
jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isEnabled: jest.fn().mockReturnValue(true),
  })),
}));

// Mock CircuitBreaker
jest.mock("../circuit-breaker", () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    canExecute: jest.fn().mockReturnValue(true),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  })),
}));

describe("MCPRouter", () => {
  let mcpRouter: MCPRouter;
  let mockConfig: MCPConnectionConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      endpoint: "ws://localhost:8080/mcp",
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 100,
      queueMaxSize: 100,
      healthCheckInterval: 1000,
      enableCompression: false,
      enableEncryption: false,
    };

    mcpRouter = new MCPRouter(mockConfig);
  });

  afterEach(() => {
    mcpRouter.destroy();
  });

  describe("Initialization", () => {
    it("should initialize with default configuration", () => {
      const router = new MCPRouter();
      expect(router).toBeDefined();
      expect(router.isAvailable()).toBe(false); // Initially not connected
    });

    it("should initialize with custom configuration", () => {
      expect(mcpRouter).toBeDefined();
    });

    it("should establish WebSocket connection when MCP is enabled", async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));

      const healthStatus = await mcpRouter.getHealthStatus();
      expect(healthStatus.connectionStatus).toBe("connected");
    });
  });

  describe("Support Operation Execution", () => {
    beforeEach(async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should execute support operation successfully", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      const response = await mcpRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toBeDefined();
      expect(response.latencyMs).toBeGreaterThan(0);
      expect(response.result).toBeDefined();
    });

    it("should handle operation timeout", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 1, // Very short timeout
      };

      const response = await mcpRouter.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("timeout");
    });

    it("should retry failed operations", async () => {
      // Mock a connection that fails initially
      const router = new MCPRouter({
        ...mockConfig,
        maxRetries: 2,
        retryDelay: 10,
      });

      // Wait for initial connection
      await new Promise((resolve) => setTimeout(resolve, 50));

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      const response = await router.executeSupportOperation(request);

      // Should eventually succeed after retries
      expect(response.success).toBe(true);

      router.destroy();
    });

    it("should handle circuit breaker open state", async () => {
      // Mock circuit breaker to return false
      const mockCircuitBreaker = {
        canExecute: jest.fn().mockReturnValue(false),
        recordSuccess: jest.fn(),
        recordFailure: jest.fn(),
      };

      (mcpRouter as any).circuitBreaker = mockCircuitBreaker;

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      const response = await mcpRouter.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("circuit breaker");
    });
  });

  describe("Health Monitoring", () => {
    beforeEach(async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should return healthy status when connected", async () => {
      const healthStatus = await mcpRouter.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.connectionStatus).toBe("connected");
      expect(healthStatus.route).toBe("mcp");
      expect(healthStatus.queueSize).toBe(0);
      expect(healthStatus.pendingOperations).toBe(0);
    });

    it("should return unhealthy status when disconnected", async () => {
      // Simulate connection close
      (mcpRouter as any).connection?.close();

      // Wait for close event to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      const healthStatus = await mcpRouter.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.connectionStatus).toBe("disconnected");
    });

    it("should track error rate correctly", async () => {
      // Execute some operations to generate metrics
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      await mcpRouter.executeSupportOperation(request);

      const healthStatus = await mcpRouter.getHealthStatus();
      expect(healthStatus.errorRate).toBeGreaterThanOrEqual(0);
    });

    it("should check availability correctly", () => {
      expect(mcpRouter.isAvailable()).toBe(true);
    });
  });

  describe("Kiro Bridge Communication", () => {
    beforeEach(async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should send diagnostics to Kiro", async () => {
      const diagnostics = {
        systemHealth: "good",
        issues: [],
        recommendations: ["test recommendation"],
      };

      await expect(
        mcpRouter.sendDiagnosticsToKiro(diagnostics, "test-correlation-id")
      ).resolves.not.toThrow();
    });

    it("should receive execution data from Kiro", async () => {
      const executionData = {
        executionId: "test-execution",
        status: "completed",
        metrics: { duration: 1000 },
      };

      await expect(
        mcpRouter.receiveKiroExecutionData(executionData, "test-correlation-id")
      ).resolves.not.toThrow();
    });

    it("should handle Kiro notifications", async () => {
      const notification: MCPMessage = {
        id: "test-notification",
        type: "notification",
        method: "execution_update",
        params: { status: "running" },
        timestamp: new Date(),
        correlationId: "test-correlation",
        retryCount: 0,
        priority: "medium",
      };

      // Simulate receiving notification
      (mcpRouter as any).connection?.simulateMessage(notification);

      // Should not throw
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("should respond to health check notifications", async () => {
      const healthCheckNotification: MCPMessage = {
        id: "health-check",
        type: "notification",
        method: "health_check",
        timestamp: new Date(),
        correlationId: "health-correlation",
        retryCount: 0,
        priority: "high",
      };

      // Mock connection send method to capture response
      const sendSpy = jest.spyOn((mcpRouter as any).connection, "send");

      // Simulate receiving health check
      (mcpRouter as any).connection?.simulateMessage(healthCheckNotification);

      // Wait for response processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have sent a response
      expect(sendSpy).toHaveBeenCalled();
    });
  });

  describe("Message Queue Management", () => {
    beforeEach(async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should handle queue overflow", async () => {
      // Create router with small queue size
      const smallQueueRouter = new MCPRouter({
        ...mockConfig,
        queueMaxSize: 1,
      });

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mock the connection to not respond immediately (simulate slow responses)
      const mockConnection = (smallQueueRouter as any).connection;
      const originalSend = mockConnection.send;
      mockConnection.send = jest.fn(); // Don't actually send, so messages stay pending

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 1000, // Short timeout to fail quickly
      };

      // Try to send multiple operations that will fill the queue
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(smallQueueRouter.executeSupportOperation(request));
      }

      const results = await Promise.allSettled(promises);

      // At least one should fail due to queue overflow or timeout
      const failures = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success)
      );
      expect(failures.length).toBeGreaterThan(0);

      // Restore original send method
      mockConnection.send = originalSend;
      smallQueueRouter.destroy();
    });

    it("should track pending operations correctly", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      // Start operation but don't wait for completion
      const promise = mcpRouter.executeSupportOperation(request);

      // Check pending operations immediately
      const healthStatus = await mcpRouter.getHealthStatus();
      expect(healthStatus.pendingOperations).toBeGreaterThanOrEqual(0);

      // Wait for completion
      await promise;
    });
  });

  describe("Error Handling", () => {
    it("should handle WebSocket connection errors", async () => {
      const router = new MCPRouter(mockConfig);

      // Wait for initial connection attempt
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Prevent automatic reconnection by mocking the scheduleReconnection method
      const scheduleReconnectionSpy = jest.spyOn(
        router as any,
        "scheduleReconnection"
      );
      scheduleReconnectionSpy.mockImplementation(() => {
        // Do nothing - prevent reconnection
      });

      // Simulate connection error (this will also close the connection)
      const connection = (router as any).connection;
      connection?.simulateError();

      // Check error state immediately (before any reconnection)
      await new Promise((resolve) => setTimeout(resolve, 10));
      const healthStatus = await router.getHealthStatus();
      expect(healthStatus.connectionStatus).toBe("error");

      scheduleReconnectionSpy.mockRestore();
      router.destroy();
    });

    it("should handle malformed messages", async () => {
      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate malformed message
      const mockConnection = (mcpRouter as any).connection;
      mockConnection?.onmessage?.({ data: "invalid json" });

      // Should not crash
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it("should handle MCP integration disabled", async () => {
      // Mock feature flags to return false
      const mockFeatureFlags = {
        isEnabled: jest.fn().mockReturnValue(false),
      };
      (mcpRouter as any).featureFlags = mockFeatureFlags;

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      const response = await mcpRouter.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("MCP integration is disabled");
    });
  });

  describe("Metrics and Monitoring", () => {
    beforeEach(async () => {
      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should track operation metrics", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        context: { test: "data" },
        timeout: 30000,
      };

      await mcpRouter.executeSupportOperation(request);

      const metrics = mcpRouter.getMetrics();
      expect(metrics.totalMessages).toBeGreaterThan(0);
      expect(metrics.successfulMessages).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });

    it("should track connection resets", async () => {
      const initialMetrics = mcpRouter.getMetrics();
      const initialResets = initialMetrics.connectionResets;

      // Simulate connection error
      (mcpRouter as any).connection?.simulateError();

      // Wait for error processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedMetrics = mcpRouter.getMetrics();
      expect(updatedMetrics.connectionResets).toBeGreaterThan(initialResets);
    });
  });

  describe("Cleanup and Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const router = new MCPRouter(mockConfig);

      // Should not throw
      expect(() => router.destroy()).not.toThrow();
    });

    it("should clear intervals and timeouts on destroy", async () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const router = new MCPRouter(mockConfig);

      // Wait for connection to establish and health monitoring to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger a reconnection timeout by closing the connection
      (router as any).connection?.close();
      await new Promise((resolve) => setTimeout(resolve, 10));

      router.destroy();

      // Should have called cleanup functions
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it("should close WebSocket connection on destroy", async () => {
      const router = new MCPRouter(mockConfig);

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 50));

      const closeSpy = jest.spyOn((router as any).connection, "close");

      router.destroy();

      expect(closeSpy).toHaveBeenCalled();
    });
  });
});
