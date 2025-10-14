/**
 * Direct Bedrock Client Tests
 *
 * Tests for the DirectBedrockClient implementation including:
 * - Emergency operations (< 5s latency)
 * - Critical operations (< 10s latency)
 * - Circuit breaker integration
 * - Health monitoring
 * - Compliance checks
 * - Error handling
 */

const mockBedrockSend = jest.fn();
const mockCircuitBreakerExecute = jest.fn();
const mockCircuitBreakerIsOpen = jest.fn();
const mockFeatureFlagsIsEnabled = jest.fn();

// Mock AWS SDK
jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockBedrockSend,
  })),
  InvokeModelCommand: jest.fn().mockImplementation((input) => ({ ...input })),
  InvokeModelWithResponseStreamCommand: jest
    .fn()
    .mockImplementation((input) => ({ ...input })),
}));

// Mock Circuit Breaker
jest.mock("../circuit-breaker", () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: mockCircuitBreakerExecute,
    isOpen: mockCircuitBreakerIsOpen,
  })),
}));

// Mock AI Feature Flags
jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isEnabled: mockFeatureFlagsIsEnabled,
  })),
}));

import {
  DirectBedrockClient,
  OperationType,
  SupportOperationRequest,
} from "../direct-bedrock-client";

describe("DirectBedrockClient", () => {
  let client: DirectBedrockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockFeatureFlagsIsEnabled.mockReturnValue(true);
    mockCircuitBreakerIsOpen.mockReturnValue(false);
    mockCircuitBreakerExecute.mockImplementation(
      async (provider, operation) => {
        return await operation();
      }
    );

    // Mock successful Bedrock response
    mockBedrockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [{ type: "text", text: "Test response" }],
          usage: { input_tokens: 10, output_tokens: 20 },
        })
      ),
    });

    client = new DirectBedrockClient({
      enableHealthMonitoring: false, // Disable for tests
    });
  });

  afterEach(() => {
    client.destroy();
  });

  describe("Constructor and Configuration", () => {
    it("should initialize with default configuration", () => {
      const testClient = new DirectBedrockClient();
      expect(testClient).toBeDefined();
      testClient.destroy();
    });

    it("should initialize with custom configuration", () => {
      const config = {
        region: "us-east-1",
        maxRetries: 5,
        timeout: 60000,
        emergencyTimeout: 3000,
        criticalTimeout: 8000,
      };

      const testClient = new DirectBedrockClient(config);
      expect(testClient).toBeDefined();
      testClient.destroy();
    });
  });

  describe("Emergency Operations", () => {
    it("should execute emergency operation with < 5s timeout", async () => {
      const response = await client.executeEmergencyOperation(
        "Emergency: System down, need immediate action"
      );

      expect(response.success).toBe(true);
      expect(response.text).toBe("Test response");
      expect(response.operationId).toMatch(/^direct-bedrock-/);
    });

    it("should use emergency model configuration", async () => {
      await client.executeEmergencyOperation("Emergency test");

      expect(mockBedrockSend).toHaveBeenCalled();
      const command = mockBedrockSend.mock.calls[0][0];
      expect(command.modelId).toBe("anthropic.claude-3-5-sonnet-20241022-v2:0");

      const body = JSON.parse(command.body);
      expect(body.temperature).toBe(0.1);
      expect(body.max_tokens).toBe(1024);
    });

    it("should include emergency system message", async () => {
      await client.executeEmergencyOperation("Emergency test");

      const command = mockBedrockSend.mock.calls[0][0];
      const body = JSON.parse(command.body);
      expect(body.system).toContain("emergency support assistant");
    });
  });

  describe("Critical Operations", () => {
    it("should execute critical operation with < 10s timeout", async () => {
      const response = await client.executeCriticalOperation(
        "Critical infrastructure issue detected",
        { userId: "test-user", correlationId: "test-123" }
      );

      expect(response.success).toBe(true);
      expect(response.text).toBe("Test response");
    });

    it("should support tools in critical operations", async () => {
      const tools = [
        {
          name: "analyze_system",
          description: "Analyze system health",
          parameters: { system: { type: "string" } },
        },
      ];

      await client.executeCriticalOperation(
        "Analyze infrastructure",
        undefined,
        tools
      );

      const command = mockBedrockSend.mock.calls[0][0];
      const body = JSON.parse(command.body);
      expect(body.tools).toHaveLength(1);
      expect(body.tools[0].name).toBe("analyze_system");
    });
  });

  describe("Support Operation Execution", () => {
    it("should execute standard support operation", async () => {
      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt: "Help with incomplete module",
        context: { userId: "test-user" },
        maxTokens: 2048,
        temperature: 0.4,
      };

      const response = await client.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.text).toBe("Test response");
      expect(response.tokensUsed).toEqual({ input: 10, output: 20 });
      expect(response.costEuro).toBeGreaterThan(0);
    });

    it("should handle different operation types", async () => {
      const operations: OperationType[] = [
        "emergency",
        "infrastructure",
        "meta_monitor",
        "implementation",
        "standard",
      ];

      for (const operation of operations) {
        const request: SupportOperationRequest = {
          operation,
          priority: "high",
          prompt: `Test ${operation} operation`,
        };

        const response = await client.executeSupportOperation(request);
        expect(response.success).toBe(true);
      }
    });

    it("should handle tool calls in response", async () => {
      // Mock response with tool calls
      mockBedrockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [
              { type: "text", text: "I'll analyze the system" },
              {
                type: "tool_use",
                name: "analyze_system",
                input: { system: "infrastructure" },
              },
            ],
            usage: { input_tokens: 15, output_tokens: 25 },
          })
        ),
      });

      const response = await client.executeSupportOperation({
        operation: "infrastructure",
        priority: "critical",
        prompt: "Analyze system health",
        tools: [
          {
            name: "analyze_system",
            parameters: { system: { type: "string" } },
          },
        ],
      });

      expect(response.success).toBe(true);
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0].name).toBe("analyze_system");
      expect(response.toolCalls![0].arguments).toEqual({
        system: "infrastructure",
      });
    });
  });

  describe("Circuit Breaker Integration", () => {
    it("should check circuit breaker before execution", async () => {
      mockCircuitBreakerIsOpen.mockReturnValue(true);

      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain("Circuit breaker is open");
      expect(mockBedrockSend).not.toHaveBeenCalled();
    });

    it("should execute through circuit breaker when closed", async () => {
      mockCircuitBreakerIsOpen.mockReturnValue(false);

      await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(mockCircuitBreakerExecute).toHaveBeenCalledWith(
        "bedrock",
        expect.any(Function)
      );
    });
  });

  describe("Feature Flag Integration", () => {
    it("should check feature flag before execution", async () => {
      mockFeatureFlagsIsEnabled.mockReturnValue(false);

      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain("Direct Bedrock access is disabled");
      expect(mockFeatureFlagsIsEnabled).toHaveBeenCalledWith(
        "ENABLE_DIRECT_BEDROCK_FALLBACK"
      );
    });
  });

  describe("Health Monitoring", () => {
    it("should perform health check", async () => {
      const healthStatus = await client.performHealthCheck();

      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.latencyMs).toBeGreaterThanOrEqual(0);
      expect(healthStatus.consecutiveFailures).toBe(0);
      expect(mockBedrockSend).toHaveBeenCalled();
    });

    it("should update health status on failure", async () => {
      mockBedrockSend.mockRejectedValueOnce(new Error("Bedrock error"));

      const healthStatus = await client.performHealthCheck();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.consecutiveFailures).toBe(1);
      expect(healthStatus.error).toBe("Bedrock error");
    });

    it("should get current health status", () => {
      const healthStatus = client.getHealthStatus();

      expect(healthStatus).toHaveProperty("isHealthy");
      expect(healthStatus).toHaveProperty("latencyMs");
      expect(healthStatus).toHaveProperty("lastCheck");
      expect(healthStatus).toHaveProperty("consecutiveFailures");
      expect(healthStatus).toHaveProperty("circuitBreakerState");
    });
  });

  describe("Compliance Checks", () => {
    it("should detect PII in prompt", async () => {
      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "User email is test@example.com and SSN is 123-45-6789",
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain("PII detected");
    });

    it("should allow clean prompts", async () => {
      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Analyze system performance metrics",
      });

      expect(response.success).toBe(true);
    });

    it("should skip compliance checks when disabled", async () => {
      const testClient = new DirectBedrockClient({
        enableComplianceChecks: false,
        enableHealthMonitoring: false,
      });

      const response = await testClient.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "User email is test@example.com",
      });

      expect(response.success).toBe(true);
      testClient.destroy();
    });
  });

  describe("Error Handling", () => {
    it("should handle Bedrock API errors", async () => {
      mockBedrockSend.mockRejectedValueOnce(
        new Error("API rate limit exceeded")
      );

      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain("API rate limit exceeded");
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should handle malformed responses", async () => {
      mockBedrockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode("invalid json"),
      });

      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe("Cost Calculation", () => {
    it("should calculate cost based on token usage", async () => {
      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.costEuro).toBeGreaterThan(0);
      expect(response.tokensUsed).toEqual({ input: 10, output: 20 });
    });

    it("should handle missing token usage", async () => {
      mockBedrockSend.mockResolvedValueOnce({
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ type: "text", text: "Test response" }],
            // No usage field
          })
        ),
      });

      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      });

      expect(response.costEuro).toBe(0);
      expect(response.tokensUsed).toEqual({ input: 0, output: 0 });
    });
  });

  describe("Timeout Validation", () => {
    it("should validate emergency operation timeout", async () => {
      const testClient = new DirectBedrockClient({
        emergencyTimeout: 6000, // > 5s limit
        enableHealthMonitoring: false,
      });

      const response = await testClient.executeEmergencyOperation(
        "Emergency test"
      );

      expect(response.success).toBe(false);
      expect(response.error).toContain("timeout");
      expect(response.error).toContain("exceeds maximum 5000ms");

      testClient.destroy();
    });

    it("should validate critical operation timeout", async () => {
      const testClient = new DirectBedrockClient({
        criticalTimeout: 15000, // > 10s limit
        enableHealthMonitoring: false,
      });

      const response = await testClient.executeCriticalOperation(
        "Critical test"
      );

      expect(response.success).toBe(false);
      expect(response.error).toContain("timeout");
      expect(response.error).toContain("exceeds maximum 10000ms");

      testClient.destroy();
    });
  });

  describe("Streaming Support", () => {
    it("should handle streaming requests", async () => {
      const response = await client.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test streaming",
        streaming: true,
      });

      expect(response.success).toBe(true);
      // Note: Streaming implementation is simplified in this version
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup resources on destroy", () => {
      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: true,
      });

      // Should not throw
      testClient.destroy();
    });
  });
});
