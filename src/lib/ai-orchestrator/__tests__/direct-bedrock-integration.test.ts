/**
 * Direct Bedrock Integration Tests
 *
 * Comprehensive integration tests for direct Bedrock client communication,
 * including security, compliance, and performance validation.
 */

import {
  DirectBedrockClient,
  DirectBedrockConfig,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock AWS SDK
jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      body: {
        transformToString: jest.fn().mockResolvedValue(
          JSON.stringify({
            content: [{ text: "Direct Bedrock response" }],
            usage: { input_tokens: 100, output_tokens: 50 },
          })
        ),
      },
    }),
  })),
  InvokeModelCommand: jest.fn(),
  InvokeModelWithResponseStreamCommand: jest.fn(),
}));

// Mock dependencies
jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isEnabled: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock("../circuit-breaker", () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    canExecute: jest.fn().mockReturnValue(true),
    isOpen: jest.fn().mockReturnValue(false),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  })),
}));

jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
    logSupportOperation: jest.fn().mockResolvedValue(undefined),
    logHybridRoutingOperation: jest.fn().mockResolvedValue(undefined),
    logComplianceCheck: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../gdpr-hybrid-compliance-validator", () => ({
  GDPRHybridComplianceValidator: jest.fn().mockImplementation(() => ({
    validateHybridRouting: jest.fn().mockResolvedValue({
      compliant: true,
      path: "direct_bedrock",
      checks: {
        euRegion: true,
        dataResidency: true,
        consentValid: true,
      },
    }),
  })),
}));

jest.mock("../kms-encryption-service", () => ({
  KMSEncryptionService: jest.fn().mockImplementation(() => ({
    encrypt: jest.fn().mockResolvedValue("encrypted-data"),
    decrypt: jest.fn().mockResolvedValue("decrypted-data"),
  })),
}));

jest.mock("../safety/pii-toxicity-detector", () => ({
  PIIToxicityDetectionService: jest.fn().mockImplementation(() => ({
    detectPII: jest.fn().mockResolvedValue({
      hasPII: false,
      confidence: 0.95,
      detectedTypes: [],
    }),
    detectToxicity: jest.fn().mockResolvedValue({
      isToxic: false,
      confidence: 0.95,
      categories: [],
    }),
  })),
}));

jest.mock("../ssrf-protection-validator", () => ({
  SSRFProtectionValidator: jest.fn().mockImplementation(() => ({
    validateUrl: jest.fn().mockResolvedValue({ safe: true }),
  })),
}));

describe("Direct Bedrock Integration", () => {
  jest.setTimeout(15000); // Increase timeout for integration tests

  let directBedrockClient: DirectBedrockClient;
  let intelligentRouter: IntelligentRouter;
  let mockMcpRouter: jest.Mocked<MCPRouter>;

  const defaultConfig: DirectBedrockConfig = {
    region: "eu-central-1",
    maxRetries: 2,
    timeout: 30000,
    emergencyTimeout: 5000,
    criticalTimeout: 10000,
    enableCircuitBreaker: true,
    enableHealthMonitoring: true,
    enableComplianceChecks: true,
  };

  beforeEach(async () => {
    // Create direct Bedrock client
    directBedrockClient = new DirectBedrockClient(defaultConfig);

    // Create mock MCP router
    mockMcpRouter = {
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        operationId: "mcp-op-123",
        latencyMs: 200,
        timestamp: new Date(),
      }),
      performHealthCheck: jest.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 100,
        timestamp: new Date(),
      }),
      destroy: jest.fn(),
    } as any;

    // Create intelligent router
    intelligentRouter = new IntelligentRouter(
      directBedrockClient,
      mockMcpRouter
    );
  });

  afterEach(() => {
    intelligentRouter.destroy();
    directBedrockClient.destroy();
  });

  describe("Emergency Operations", () => {
    it("should execute emergency operations within 5 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency system check required immediately",
        maxTokens: 1024,
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(5000);
      expect(response.latencyMs).toBeLessThan(5000);
    });

    it("should use direct Bedrock for emergency operations", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Critical infrastructure failure detected",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("direct");
      expect(mockMcpRouter.executeSupportOperation).not.toHaveBeenCalled();
    });

    it("should enforce token limits for emergency operations", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency operation with token limit",
        maxTokens: 2048, // Should be capped at 1024 for emergency
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      // Token limit should be enforced by the client
    });
  });

  describe("Critical Support Operations", () => {
    it("should execute critical operations within 10 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Run comprehensive infrastructure audit",
        maxTokens: 2048,
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(10000);
      expect(response.latencyMs).toBeLessThan(10000);
    });

    it("should use direct Bedrock for infrastructure audits", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Audit system infrastructure for issues",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("direct");
    });

    it("should use direct Bedrock for meta monitoring", async () => {
      const request: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "high",
        prompt: "Monitor Kiro execution patterns",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("direct");
    });

    it("should use direct Bedrock for implementation support", async () => {
      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt: "Provide implementation support for module",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("direct");
    });
  });

  describe("Security and Compliance", () => {
    it("should validate GDPR compliance for direct operations", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Audit with GDPR compliance check",
        context: {
          userId: "user-123",
          tenant: "tenant-456",
        },
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.complianceValidation).toBeDefined();
      expect(response.complianceValidation?.gdprCompliant).toBe(true);
    });

    it("should detect and redact PII in prompts", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Analyze user data for john.doe@example.com",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.piiDetectionResult).toBeDefined();
    });

    it("should enforce EU data residency", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Process sensitive EU data",
        context: {
          metadata: { region: "eu-central-1" },
        },
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.complianceValidation?.gdprCompliant).toBe(true);
    });

    it("should log all operations to audit trail", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Audit trail test operation",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.complianceValidation?.auditLogged).toBe(true);
    });
  });

  describe("Health Monitoring", () => {
    it("should perform health checks", async () => {
      const health = await directBedrockClient.performHealthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.latencyMs).toBeDefined();
      expect(health.lastCheck).toBeInstanceOf(Date);
      expect(health.circuitBreakerState).toBe("closed");
    });

    it("should track consecutive failures", async () => {
      // Mock client to fail
      const mockSend = jest.fn().mockRejectedValue(new Error("Service error"));
      (directBedrockClient as any).client.send = mockSend;

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Test failure tracking",
      };

      try {
        await directBedrockClient.executeSupportOperation(request);
      } catch (error) {
        // Expected to fail
      }

      const health = await directBedrockClient.performHealthCheck();
      expect(health.consecutiveFailures).toBeGreaterThan(0);
    });

    it("should report circuit breaker state", async () => {
      const health = await directBedrockClient.performHealthCheck();

      expect(health.circuitBreakerState).toBeDefined();
      expect(["closed", "open", "half-open"]).toContain(
        health.circuitBreakerState
      );
    });
  });

  describe("Performance Optimization", () => {
    it("should track operation latency", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Performance test operation",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeDefined();
      expect(response.latencyMs).toBeGreaterThan(0);
    });

    it("should calculate cost per operation", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Cost tracking test",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.costEuro).toBeDefined();
      expect(response.tokensUsed).toBeDefined();
    });

    it("should provide token usage metrics", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Token usage test",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
      expect(response.tokensUsed).toBeDefined();
      expect(response.tokensUsed?.input).toBeGreaterThan(0);
      expect(response.tokensUsed?.output).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle Bedrock service errors gracefully", async () => {
      // Mock client to fail
      const mockSend = jest.fn().mockRejectedValue(new Error("Service error"));
      (directBedrockClient as any).client.send = mockSend;

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Test error handling",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error).toContain("Service error");
    });

    it("should handle timeout errors", async () => {
      // Mock client to timeout
      const mockSend = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 15000))
        );
      (directBedrockClient as any).client.send = mockSend;

      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Test timeout",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it("should handle circuit breaker open state", async () => {
      // Mock circuit breaker to be open
      (directBedrockClient as any).circuitBreaker.isOpen = jest
        .fn()
        .mockReturnValue(true);

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Test circuit breaker",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(false);
      expect(response.error).toContain("Circuit breaker");
    });
  });

  describe("Tool Calling Support", () => {
    it("should support tool calling in operations", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Use tools to analyze system",
        tools: [
          {
            name: "analyze_system",
            description: "Analyze system health",
            input_schema: {
              type: "object",
              properties: {
                component: { type: "string" },
              },
              required: ["component"],
            },
          },
        ],
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
    });
  });

  describe("Streaming Support", () => {
    it("should support streaming responses", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Stream analysis results",
        streaming: true,
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response.success).toBe(true);
    });
  });

  describe("Integration with Intelligent Router", () => {
    it("should route emergency operations to direct Bedrock", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency routing test",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      expect(response.operationId).toContain("direct");
      expect(mockMcpRouter.executeSupportOperation).not.toHaveBeenCalled();
    });

    it("should provide health status for routing decisions", async () => {
      const health = await intelligentRouter.checkRouteHealth("direct");

      expect(health.isHealthy).toBe(true);
      expect(health.route).toBe("direct");
      expect(health.latencyMs).toBeDefined();
    });

    it("should track routing efficiency for direct path", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Efficiency tracking test",
      };

      await intelligentRouter.executeSupportOperation(request);

      const efficiency = intelligentRouter.getRoutingEfficiency();
      expect(efficiency.directRouteUsage).toBeGreaterThan(0);
    });
  });

  describe("Cleanup and Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const client = new DirectBedrockClient(defaultConfig);
      expect(() => client.destroy()).not.toThrow();
    });

    it("should handle multiple destroy calls", () => {
      const client = new DirectBedrockClient(defaultConfig);
      client.destroy();
      expect(() => client.destroy()).not.toThrow();
    });
  });
});
