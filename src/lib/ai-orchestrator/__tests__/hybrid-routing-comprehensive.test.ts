/**
 * Comprehensive Hybrid Routing Tests
 *
 * This test suite provides comprehensive coverage for all hybrid routing components:
 * - IntelligentRouter
 * - DirectBedrockClient
 * - MCPRouter
 * - HybridHealthMonitor
 * - Integration scenarios
 * - Error handling
 * - Edge cases
 * - Performance validation
 */

// CRITICAL: Mock dependencies BEFORE imports to ensure they exist when modules load
jest.mock("@aws-sdk/client-bedrock-runtime");
jest.mock("../ai-feature-flags");
jest.mock("../circuit-breaker");
jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
    logSupportOperation: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock("../ssrf-protection-validator", () => ({
  SSRFProtectionValidator: jest.fn().mockImplementation(() => ({
    validatePrompt: jest.fn().mockResolvedValue({
      isValid: true,
      sanitizedPrompt: "test prompt",
    }),
  })),
}));

// Now import the modules after mocks are defined
import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { HybridHealthMonitor } from "../hybrid-health-monitor";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

describe("Hybrid Routing - Comprehensive Integration Tests", () => {
  let directBedrockClient: DirectBedrockClient;
  let mcpRouter: MCPRouter;
  let intelligentRouter: IntelligentRouter;
  let hybridHealthMonitor: HybridHealthMonitor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock feature flags to be enabled
    const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
    mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(true);

    // Mock circuit breaker
    const mockCircuitBreaker = require("../circuit-breaker").CircuitBreaker;
    mockCircuitBreaker.mockImplementation(() => ({
      execute: jest.fn().mockImplementation(async (_provider, operation) => {
        return await operation();
      }),
      isOpen: jest.fn().mockReturnValue(false),
      canExecute: jest.fn().mockReturnValue(true),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    }));

    // Mock SSRF Protection Validator
    const mockSSRFValidator =
      require("../ssrf-protection-validator").SSRFProtectionValidator;
    mockSSRFValidator.mockImplementation(() => ({
      validatePrompt: jest
        .fn()
        .mockResolvedValue({ isValid: true, sanitizedPrompt: "test prompt" }),
    }));

    // Mock Audit Trail System
    const mockAuditTrail = require("../audit-trail-system").AuditTrailSystem;
    mockAuditTrail.mockImplementation(() => ({
      logEvent: jest.fn().mockResolvedValue(undefined),
      logSupportOperation: jest.fn().mockResolvedValue(undefined),
    }));

    // Mock Bedrock Runtime Client
    const mockBedrockRuntime = require("@aws-sdk/client-bedrock-runtime");
    mockBedrockRuntime.BedrockRuntimeClient = jest
      .fn()
      .mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({
          body: new TextEncoder().encode(
            JSON.stringify({
              content: [{ type: "text", text: "Test response" }],
              usage: { input_tokens: 10, output_tokens: 20 },
            })
          ),
        }),
      }));

    // Initialize components
    directBedrockClient = new DirectBedrockClient({
      enableHealthMonitoring: false,
      enableComplianceChecks: false,
    });

    mcpRouter = new MCPRouter({
      endpoint: "ws://localhost:8080/mcp",
      timeout: 5000,
      maxRetries: 2,
    });

    intelligentRouter = new IntelligentRouter(directBedrockClient, mcpRouter);

    hybridHealthMonitor = new HybridHealthMonitor(
      directBedrockClient,
      mcpRouter,
      intelligentRouter,
      {
        checkInterval: 1000,
        enableContinuousMonitoring: false,
      }
    );
  });

  afterEach(() => {
    directBedrockClient?.destroy();
    mcpRouter?.destroy();
    intelligentRouter?.destroy();
    hybridHealthMonitor?.destroy();
  });

  describe("End-to-End Routing Scenarios", () => {
    it("should route emergency operations to direct Bedrock", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency: System down",
        timeout: 5000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.operationId).toBeDefined();
    });

    it("should route infrastructure operations to direct Bedrock", async () => {
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        prompt: "Analyze infrastructure health",
        timeout: 10000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    });

    it("should handle fallback from MCP to direct Bedrock", async () => {
      // Mock MCP router to fail
      jest
        .spyOn(mcpRouter, "executeSupportOperation")
        .mockRejectedValueOnce(new Error("MCP unavailable"));

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Standard operation",
        timeout: 30000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response).toBeDefined();
      // Should succeed via fallback
      expect(response.success).toBe(true);
    });

    it("should handle fallback from direct Bedrock to MCP", async () => {
      // Mock direct Bedrock to fail
      jest
        .spyOn(directBedrockClient, "executeSupportOperation")
        .mockRejectedValueOnce(new Error("Bedrock unavailable"));

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        prompt: "Infrastructure check",
        timeout: 10000,
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response).toBeDefined();
      // Should attempt fallback
    });
  });

  describe("Health Monitoring Integration", () => {
    it("should monitor health of all routing paths", async () => {
      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.overall).toBeDefined();
      expect(healthStatus.routes).toBeDefined();
      expect(healthStatus.routes.mcp).toBeDefined();
      expect(healthStatus.routes.directBedrock).toBeDefined();
    });

    it("should detect unhealthy routes", async () => {
      // Mock unhealthy direct Bedrock
      jest.spyOn(directBedrockClient, "getHealthStatus").mockResolvedValue({
        isHealthy: false,
        latencyMs: 15000,
        lastCheck: new Date(),
        consecutiveFailures: 10,
        circuitBreakerState: "open",
      });

      const healthStatus = await hybridHealthMonitor.getHealthStatus();

      expect(healthStatus.routes.directBedrock.isHealthy).toBe(false);
      expect(healthStatus.recommendations.immediate.length).toBeGreaterThan(0);
    });

    it("should track routing efficiency over time", async () => {
      // Record some routing decisions
      hybridHealthMonitor.recordRoutingDecision("mcp", "mcp", 10, "Optimal");
      hybridHealthMonitor.recordRoutingDecision(
        "direct",
        "direct",
        15,
        "Optimal"
      );
      hybridHealthMonitor.recordRoutingDecision(
        "mcp",
        "direct",
        25,
        "Fallback"
      );

      const analysis = await hybridHealthMonitor.analyzeRoutingEfficiency();

      expect(analysis.totalDecisions).toBe(3);
      expect(analysis.optimalDecisions).toBe(2);
      expect(analysis.suboptimalDecisions).toBe(1);
      expect(analysis.efficiency).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle circuit breaker open state", async () => {
      // Mock circuit breaker to be open
      const mockCircuitBreaker = require("../circuit-breaker").CircuitBreaker;
      mockCircuitBreaker.mockImplementation(() => ({
        execute: jest.fn(),
        isOpen: jest.fn().mockReturnValue(true),
        canExecute: jest.fn().mockReturnValue(false),
        recordSuccess: jest.fn(),
        recordFailure: jest.fn(),
      }));

      // Recreate client with open circuit breaker
      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: false,
        enableComplianceChecks: false,
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      };

      const response = await testClient.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("Circuit breaker is open");

      testClient.destroy();
    });

    it("should handle feature flag disabled", async () => {
      // Mock feature flags to be disabled
      const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
      mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(false);

      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: false,
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      };

      const response = await testClient.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("disabled");

      testClient.destroy();
    });

    it("should handle timeout scenarios", async () => {
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
        timeout: 1, // Very short timeout
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      // Should handle timeout gracefully
      expect(response).toBeDefined();
    });

    it("should handle malformed responses", async () => {
      // Mock malformed response
      const mockBedrockRuntime = require("@aws-sdk/client-bedrock-runtime");
      mockBedrockRuntime.BedrockRuntimeClient = jest
        .fn()
        .mockImplementation(() => ({
          send: jest.fn().mockResolvedValue({
            body: new TextEncoder().encode("invalid json"),
          }),
        }));

      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: false,
        enableComplianceChecks: false,
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Test prompt",
      };

      const response = await testClient.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();

      testClient.destroy();
    });
  });

  describe("Performance Validation", () => {
    it("should meet emergency operation latency requirements (< 5s)", async () => {
      const startTime = Date.now();

      const response = await directBedrockClient.executeEmergencyOperation(
        "Emergency test"
      );

      const latency = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(latency).toBeLessThan(5000);
    });

    it("should meet critical operation latency requirements (< 10s)", async () => {
      const startTime = Date.now();

      const response = await directBedrockClient.executeCriticalOperation(
        "Critical test"
      );

      const latency = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(latency).toBeLessThan(10000);
    });

    it("should track performance metrics", async () => {
      // Execute some operations
      await directBedrockClient.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test 1",
      });

      await directBedrockClient.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test 2",
      });

      // Performance metrics should be tracked
      const healthStatus = directBedrockClient.getHealthStatus();
      expect(healthStatus.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Compliance and Security", () => {
    it("should detect PII in prompts", async () => {
      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: false,
        enableComplianceChecks: true,
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "User email is test@example.com and SSN is 123-45-6789",
      };

      const response = await testClient.executeSupportOperation(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain("PII detected");

      testClient.destroy();
    });

    it("should allow clean prompts", async () => {
      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: false,
        enableComplianceChecks: true,
      });

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "Analyze system performance metrics",
      };

      const response = await testClient.executeSupportOperation(request);

      expect(response.success).toBe(true);

      testClient.destroy();
    });

    it("should validate GDPR compliance for hybrid routing", async () => {
      // This test validates that GDPR compliance is maintained across both routing paths
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "high",
        prompt: "Infrastructure audit",
        context: {
          userId: "test-user",
          metadata: { region: "eu-central-1" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response).toBeDefined();
      // Should succeed with GDPR compliance
      expect(response.success).toBe(true);
    });
  });

  describe("Resource Management", () => {
    it("should cleanup resources properly", () => {
      const testClient = new DirectBedrockClient({
        enableHealthMonitoring: true,
      });

      expect(() => testClient.destroy()).not.toThrow();
    });

    it("should handle multiple destroy calls", () => {
      const testClient = new DirectBedrockClient();

      expect(() => {
        testClient.destroy();
        testClient.destroy();
      }).not.toThrow();
    });

    it("should cleanup all hybrid routing components", () => {
      expect(() => {
        directBedrockClient.destroy();
        mcpRouter.destroy();
        intelligentRouter.destroy();
        hybridHealthMonitor.destroy();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty prompts", async () => {
      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: "",
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response).toBeDefined();
      // Should handle gracefully
    });

    it("should handle very long prompts", async () => {
      const longPrompt = "A".repeat(10000);

      const request: SupportOperationRequest = {
        operation: "standard",
        priority: "medium",
        prompt: longPrompt,
      };

      const response = await directBedrockClient.executeSupportOperation(
        request
      );

      expect(response).toBeDefined();
    });

    it("should handle concurrent operations", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        operation: "standard" as const,
        priority: "medium" as const,
        prompt: `Concurrent test ${i}`,
      }));

      const responses = await Promise.all(
        requests.map((req) => directBedrockClient.executeSupportOperation(req))
      );

      expect(responses).toHaveLength(5);
      responses.forEach((response) => {
        expect(response).toBeDefined();
      });
    });

    it("should handle rapid sequential operations", async () => {
      const responses = [];

      for (let i = 0; i < 10; i++) {
        const response = await directBedrockClient.executeSupportOperation({
          operation: "standard",
          priority: "medium",
          prompt: `Sequential test ${i}`,
        });
        responses.push(response);
      }

      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response).toBeDefined();
      });
    });
  });

  describe("Configuration Validation", () => {
    it("should work with minimal configuration", () => {
      const minimalClient = new DirectBedrockClient();
      expect(minimalClient).toBeDefined();
      minimalClient.destroy();
    });

    it("should work with custom configuration", () => {
      const customClient = new DirectBedrockClient({
        region: "us-east-1",
        maxRetries: 5,
        timeout: 60000,
        emergencyTimeout: 3000,
        criticalTimeout: 8000,
        enableHealthMonitoring: false,
      });

      expect(customClient).toBeDefined();
      customClient.destroy();
    });

    it("should validate timeout constraints", async () => {
      const testClient = new DirectBedrockClient({
        emergencyTimeout: 6000, // > 5s limit
        enableHealthMonitoring: false,
      });

      const response = await testClient.executeEmergencyOperation("Test");

      expect(response.success).toBe(false);
      expect(response.error).toContain("timeout");

      testClient.destroy();
    });
  });

  describe("Metrics and Observability", () => {
    it("should track operation metrics", async () => {
      await directBedrockClient.executeSupportOperation({
        operation: "standard",
        priority: "medium",
        prompt: "Test",
      });

      const healthStatus = directBedrockClient.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should track routing decisions", () => {
      hybridHealthMonitor.recordRoutingDecision("mcp", "mcp", 10, "Test");
      hybridHealthMonitor.recordRoutingDecision("direct", "direct", 15, "Test");

      const metrics = hybridHealthMonitor.getMetrics();

      expect(metrics.routingDecisions).toBe(2);
    });

    it("should track request performance", () => {
      hybridHealthMonitor.recordRequestPerformance("mcp", 200, true, "test");
      hybridHealthMonitor.recordRequestPerformance("direct", 150, true, "test");

      const metrics = hybridHealthMonitor.getMetrics();

      expect(metrics.totalRequests).toBe(2);
    });
  });
});
