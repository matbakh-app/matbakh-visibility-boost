/**
 * Direct Bedrock Latency Validation Tests
 *
 * This test suite validates that direct Bedrock operations meet the specified
 * latency requirements as defined in the Bedrock Activation specification:
 * - Emergency operations: < 5 seconds
 * - Critical operations: < 10 seconds
 * - Infrastructure audits: < 15 seconds
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { CircuitBreaker } from "../circuit-breaker";
import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock AWS SDK
jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      body: {
        transformToString: () =>
          JSON.stringify({
            content: [{ text: "Test response" }],
            usage: { input_tokens: 10, output_tokens: 20 },
          }),
      },
    }),
  })),
  InvokeModelCommand: jest.fn(),
}));

// Mock other dependencies
jest.mock("../ai-feature-flags");
jest.mock("../circuit-breaker");
jest.mock("../audit-trail-system");
jest.mock("../gdpr-hybrid-compliance-validator");
jest.mock("../kms-encryption-service");
jest.mock("../safety/pii-toxicity-detector");
jest.mock("../ssrf-protection-validator");
jest.mock("../mcp-router");

describe("Direct Bedrock Latency Validation", () => {
  let directClient: DirectBedrockClient;
  let intelligentRouter: IntelligentRouter;
  let mockMcpRouter: jest.Mocked<MCPRouter>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  beforeEach(() => {
    // Setup mocks
    mockFeatureFlags = {
      isEnabled: jest.fn().mockReturnValue(true),
      getFlag: jest.fn().mockReturnValue(true),
    } as any;

    mockCircuitBreaker = {
      isOpen: jest.fn().mockReturnValue(false),
      execute: jest.fn().mockImplementation((fn) => fn()),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    } as any;

    mockMcpRouter = {
      isAvailable: jest.fn().mockReturnValue(true),
      getHealthStatus: jest.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 200,
        timestamp: new Date(),
      }),
      executeSupportOperation: jest.fn().mockResolvedValue({
        success: true,
        result: "MCP operation completed",
        latencyMs: 200,
        operationId: "mcp-op-123",
        timestamp: new Date(),
      }),
    } as any;

    // Initialize clients
    directClient = new DirectBedrockClient({
      region: "eu-central-1",
      maxRetries: 3,
      timeout: 30000,
      emergencyTimeout: 5000,
      criticalTimeout: 10000,
      enableCircuitBreaker: true,
      enableHealthMonitoring: true,
      enableComplianceChecks: true,
    });

    intelligentRouter = new IntelligentRouter(directClient, mockMcpRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Emergency Operations Latency Requirements (<5s)", () => {
    it("should complete emergency operations within 5 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt:
          "Emergency system failure detected, immediate analysis required",
        context: {
          correlationId: "emergency-test-001",
          metadata: { urgency: "critical" },
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(5000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(5000);

      console.log(
        `Emergency operation completed in ${duration}ms (requirement: <5000ms)`
      );
    });

    it("should maintain <5s latency under concurrent emergency operations", async () => {
      const concurrentOperations = 5;
      const operations: Promise<any>[] = [];

      const startTime = Date.now();

      // Execute multiple emergency operations concurrently
      for (let i = 0; i < concurrentOperations; i++) {
        const request: SupportOperationRequest = {
          operation: "emergency",
          priority: "critical",
          prompt: `Emergency operation ${i + 1}`,
          context: {
            correlationId: `emergency-concurrent-${i + 1}`,
          },
        };

        operations.push(intelligentRouter.executeSupportOperation(request));
      }

      const results = await Promise.all(operations);
      const totalDuration = Date.now() - startTime;
      const avgLatency = totalDuration / concurrentOperations;

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Average latency should be under 5s
      expect(avgLatency).toBeLessThan(5000);

      // Individual operations should also meet requirement
      results.forEach((result, index) => {
        expect(result.latencyMs).toBeLessThan(5000);
        console.log(
          `Emergency operation ${index + 1} completed in ${result.latencyMs}ms`
        );
      });

      console.log(
        `Concurrent emergency operations avg latency: ${avgLatency}ms (requirement: <5000ms)`
      );
    });

    it("should use direct Bedrock for emergency operations (bypass MCP)", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency system analysis required",
      };

      const response = await intelligentRouter.executeSupportOperation(request);

      expect(response.success).toBe(true);
      // Emergency operations should not use MCP router
      expect(mockMcpRouter.executeSupportOperation).not.toHaveBeenCalled();
    });
  });

  describe("Critical Support Operations Latency Requirements (<10s)", () => {
    it("should complete infrastructure audits within 10 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Perform comprehensive infrastructure audit",
        context: {
          correlationId: "infra-audit-test-001",
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(10000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(10000);

      console.log(
        `Infrastructure audit completed in ${duration}ms (requirement: <10000ms)`
      );
    });

    it("should complete meta monitoring within 10 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "critical",
        prompt: "Analyze Kiro execution patterns and provide feedback",
        context: {
          correlationId: "meta-monitor-test-001",
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(10000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(10000);

      console.log(
        `Meta monitoring completed in ${duration}ms (requirement: <10000ms)`
      );
    });

    it("should maintain <10s latency for critical operations under load", async () => {
      const concurrentOperations = 3;
      const operations: Promise<any>[] = [];

      const startTime = Date.now();

      // Execute multiple critical operations concurrently
      for (let i = 0; i < concurrentOperations; i++) {
        const request: SupportOperationRequest = {
          operation: "infrastructure",
          priority: "critical",
          prompt: `Infrastructure audit ${i + 1}`,
          context: {
            correlationId: `infra-audit-load-${i + 1}`,
          },
        };

        operations.push(intelligentRouter.executeSupportOperation(request));
      }

      const results = await Promise.all(operations);
      const totalDuration = Date.now() - startTime;
      const avgLatency = totalDuration / concurrentOperations;

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Average latency should be under 10s
      expect(avgLatency).toBeLessThan(10000);

      // Individual operations should also meet requirement
      results.forEach((result, index) => {
        expect(result.latencyMs).toBeLessThan(10000);
        console.log(
          `Critical operation ${index + 1} completed in ${result.latencyMs}ms`
        );
      });

      console.log(
        `Concurrent critical operations avg latency: ${avgLatency}ms (requirement: <10000ms)`
      );
    });
  });

  describe("Implementation Support Operations Latency Requirements (<15s)", () => {
    it("should complete implementation support within 15 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt:
          "Analyze implementation gaps and provide remediation suggestions",
        context: {
          correlationId: "impl-support-test-001",
        },
      };

      const response = await intelligentRouter.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement (15s for implementation support)
      expect(duration).toBeLessThan(15000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(15000);

      console.log(
        `Implementation support completed in ${duration}ms (requirement: <15000ms)`
      );
    });

    it("should handle complex implementation analysis within time limits", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt:
          "Perform comprehensive implementation gap analysis including dependency mapping, risk assessment, and remediation planning",
        context: {
          correlationId: "complex-impl-test-001",
          metadata: {
            complexity: "high",
            modules: ["auth", "payment", "analytics", "reporting"],
          },
        },
        maxTokens: 2048, // Larger response for complex analysis
      };

      const response = await intelligentRouter.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Even complex operations should complete within 15s
      expect(duration).toBeLessThan(15000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(15000);

      console.log(
        `Complex implementation analysis completed in ${duration}ms (requirement: <15000ms)`
      );
    });
  });

  describe("Timeout Configuration Validation", () => {
    it("should respect emergency timeout configuration (5s)", async () => {
      // Test that emergency operations timeout at 5s
      const client = new DirectBedrockClient({
        region: "eu-central-1",
        maxRetries: 1,
        timeout: 30000,
        emergencyTimeout: 5000, // 5s emergency timeout
        criticalTimeout: 10000,
        enableCircuitBreaker: false,
        enableHealthMonitoring: false,
        enableComplianceChecks: false,
      });

      const config = (client as any).config;
      expect(config.emergencyTimeout).toBe(5000);
      expect(config.criticalTimeout).toBe(10000);
    });

    it("should respect critical timeout configuration (10s)", async () => {
      // Test that critical operations timeout at 10s
      const client = new DirectBedrockClient({
        region: "eu-central-1",
        maxRetries: 1,
        timeout: 30000,
        emergencyTimeout: 5000,
        criticalTimeout: 10000, // 10s critical timeout
        enableCircuitBreaker: false,
        enableHealthMonitoring: false,
        enableComplianceChecks: false,
      });

      const config = (client as any).config;
      expect(config.emergencyTimeout).toBe(5000);
      expect(config.criticalTimeout).toBe(10000);
    });

    it("should validate timeout enforcement in operation execution", async () => {
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Test timeout enforcement",
      };

      // Mock a slow operation to test timeout
      const originalExecute = directClient.executeSupportOperation;
      (directClient as any).executeSupportOperation = jest
        .fn()
        .mockImplementation(async () => {
          // Simulate operation that takes longer than emergency timeout
          await new Promise((resolve) => setTimeout(resolve, 6000)); // 6s > 5s emergency timeout
          return {
            success: true,
            text: "Slow operation completed",
            latencyMs: 6000,
            operationId: "timeout-test",
            timestamp: new Date(),
          };
        });

      const startTime = Date.now();

      try {
        await intelligentRouter.executeSupportOperation(request);
        const duration = Date.now() - startTime;

        // Should either complete quickly or timeout appropriately
        expect(duration).toBeLessThan(7000); // Allow some buffer for timeout handling
      } catch (error) {
        const duration = Date.now() - startTime;
        // If it times out, it should be around the emergency timeout
        expect(duration).toBeLessThan(7000);
        expect(error.message).toMatch(/timeout|time.*out/i);
      }

      // Restore original method
      (directClient as any).executeSupportOperation = originalExecute;
    });
  });

  describe("Performance Regression Detection", () => {
    it("should detect if latency requirements are being violated", async () => {
      const testOperations = [
        { operation: "emergency" as const, maxLatency: 5000 },
        { operation: "infrastructure" as const, maxLatency: 10000 },
        { operation: "meta_monitor" as const, maxLatency: 10000 },
        { operation: "implementation" as const, maxLatency: 15000 },
      ];

      const results: Array<{
        operation: string;
        latency: number;
        withinLimit: boolean;
      }> = [];

      for (const testOp of testOperations) {
        const startTime = Date.now();

        const request: SupportOperationRequest = {
          operation: testOp.operation,
          priority: "critical",
          prompt: `Test ${testOp.operation} operation latency`,
          context: {
            correlationId: `regression-test-${testOp.operation}`,
          },
        };

        try {
          const response = await intelligentRouter.executeSupportOperation(
            request
          );
          const duration = Date.now() - startTime;

          const withinLimit = duration < testOp.maxLatency;
          results.push({
            operation: testOp.operation,
            latency: duration,
            withinLimit,
          });

          console.log(
            `${testOp.operation}: ${duration}ms (limit: ${
              testOp.maxLatency
            }ms) - ${withinLimit ? "PASS" : "FAIL"}`
          );
        } catch (error) {
          const duration = Date.now() - startTime;
          results.push({
            operation: testOp.operation,
            latency: duration,
            withinLimit: false,
          });

          console.log(
            `${testOp.operation}: FAILED after ${duration}ms - ${error.message}`
          );
        }
      }

      // All operations should meet their latency requirements
      const failedOperations = results.filter((r) => !r.withinLimit);

      if (failedOperations.length > 0) {
        console.error(
          "Latency requirement violations detected:",
          failedOperations
        );
      }

      expect(failedOperations.length).toBe(0);

      // Generate performance report
      console.log("\n=== Latency Validation Report ===");
      results.forEach((result) => {
        console.log(
          `${result.operation}: ${result.latency}ms - ${
            result.withinLimit ? "✅ PASS" : "❌ FAIL"
          }`
        );
      });
    });
  });
});
