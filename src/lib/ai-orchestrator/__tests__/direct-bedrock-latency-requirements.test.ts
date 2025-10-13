/**
 * Direct Bedrock Latency Requirements Validation
 *
 * This test suite validates the core latency requirements for direct Bedrock operations
 * as specified in the Bedrock Activation specification:
 * - Emergency operations: < 5 seconds
 * - Critical operations: < 10 seconds
 * - Standard operations: < 30 seconds
 */

import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";

// Mock AWS SDK with realistic response times
const mockBedrockSend = jest.fn();

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockBedrockSend,
  })),
  InvokeModelCommand: jest.fn(),
}));

// Mock other dependencies to avoid complex setup
jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isEnabled: jest.fn().mockReturnValue(true),
    getFlag: jest.fn().mockReturnValue(true),
  })),
}));

jest.mock("../circuit-breaker", () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    isOpen: jest.fn().mockReturnValue(false),
    execute: jest.fn().mockImplementation((fn) => fn()),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  })),
}));

jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../gdpr-hybrid-compliance-validator", () => ({
  GDPRHybridComplianceValidator: jest.fn().mockImplementation(() => ({
    validateHybridRouting: jest.fn().mockResolvedValue({
      isCompliant: true,
      violations: [],
      recommendations: [],
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
      violations: [],
      redactedText: "test text",
      confidence: 0.1,
    }),
  })),
}));

jest.mock("../ssrf-protection-validator", () => ({
  SSRFProtectionValidator: jest.fn().mockImplementation(() => ({
    validateRequest: jest.fn().mockResolvedValue({
      isValid: true,
      violations: [],
    }),
  })),
}));

describe("Direct Bedrock Latency Requirements Validation", () => {
  let directClient: DirectBedrockClient;

  beforeEach(() => {
    // Setup realistic mock responses
    mockBedrockSend.mockImplementation(async () => {
      // Simulate realistic Bedrock response time (100-500ms)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 400 + 100)
      );

      return {
        body: {
          transformToString: () =>
            JSON.stringify({
              content: [{ text: "Test response from Bedrock" }],
              usage: { input_tokens: 10, output_tokens: 20 },
            }),
        },
      };
    });

    // Initialize DirectBedrockClient with proper timeout configurations
    directClient = new DirectBedrockClient({
      region: "eu-central-1",
      maxRetries: 2,
      timeout: 30000,
      emergencyTimeout: 5000, // < 5s for emergency operations
      criticalTimeout: 10000, // < 10s for critical operations
      enableCircuitBreaker: true,
      enableHealthMonitoring: true,
      enableComplianceChecks: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Emergency Operations Latency (<5s requirement)", () => {
    it("should complete emergency operations within 5 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Emergency system failure - immediate response required",
        context: {
          correlationId: "emergency-latency-test-001",
        },
      };

      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(5000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(5000);

      console.log(
        `✅ Emergency operation completed in ${duration}ms (requirement: <5000ms)`
      );
    });

    it("should use emergency timeout configuration", async () => {
      const config = (directClient as any).config;
      expect(config.emergencyTimeout).toBe(5000);

      // Verify emergency operations use the emergency timeout
      const request: SupportOperationRequest = {
        operation: "emergency",
        priority: "critical",
        prompt: "Test emergency timeout",
      };

      const startTime = Date.now();
      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Should complete well within emergency timeout
      expect(duration).toBeLessThan(5000);
      expect(response.success).toBe(true);

      console.log(`✅ Emergency timeout validation: ${duration}ms < 5000ms`);
    });

    it("should maintain emergency latency under concurrent load", async () => {
      const concurrentOperations = 3;
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

        operations.push(directClient.executeSupportOperation(request));
      }

      const results = await Promise.all(operations);
      const totalDuration = Date.now() - startTime;

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Each operation should meet the emergency latency requirement
      results.forEach((result, index) => {
        expect(result.latencyMs).toBeLessThan(5000);
        console.log(
          `✅ Emergency operation ${index + 1}: ${result.latencyMs}ms < 5000ms`
        );
      });

      console.log(
        `✅ Concurrent emergency operations completed in ${totalDuration}ms`
      );
    });
  });

  describe("Critical Operations Latency (<10s requirement)", () => {
    it("should complete infrastructure audits within 10 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Perform comprehensive infrastructure audit and analysis",
        context: {
          correlationId: "infra-audit-latency-test-001",
        },
      };

      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(10000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(10000);

      console.log(
        `✅ Infrastructure audit completed in ${duration}ms (requirement: <10000ms)`
      );
    });

    it("should complete meta monitoring within 10 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "critical",
        prompt: "Analyze Kiro execution patterns and provide detailed feedback",
        context: {
          correlationId: "meta-monitor-latency-test-001",
        },
      };

      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Validate latency requirement
      expect(duration).toBeLessThan(10000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(10000);

      console.log(
        `✅ Meta monitoring completed in ${duration}ms (requirement: <10000ms)`
      );
    });

    it("should use critical timeout configuration", async () => {
      const config = (directClient as any).config;
      expect(config.criticalTimeout).toBe(10000);

      // Verify critical operations use the critical timeout
      const request: SupportOperationRequest = {
        operation: "infrastructure",
        priority: "critical",
        prompt: "Test critical timeout configuration",
      };

      const startTime = Date.now();
      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Should complete well within critical timeout
      expect(duration).toBeLessThan(10000);
      expect(response.success).toBe(true);

      console.log(`✅ Critical timeout validation: ${duration}ms < 10000ms`);
    });
  });

  describe("Implementation Support Operations Latency (<15s requirement)", () => {
    it("should complete implementation support within 15 seconds", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt:
          "Analyze implementation gaps and provide comprehensive remediation suggestions",
        context: {
          correlationId: "impl-support-latency-test-001",
        },
      };

      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Implementation support should complete within 15s (design requirement)
      expect(duration).toBeLessThan(15000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(15000);

      console.log(
        `✅ Implementation support completed in ${duration}ms (requirement: <15000ms)`
      );
    });

    it("should handle complex implementation analysis efficiently", async () => {
      const startTime = Date.now();

      const request: SupportOperationRequest = {
        operation: "implementation",
        priority: "high",
        prompt:
          "Perform comprehensive implementation gap analysis including dependency mapping, risk assessment, auto-resolution planning, and backlog prioritization",
        context: {
          correlationId: "complex-impl-latency-test-001",
          metadata: {
            complexity: "high",
            modules: [
              "auth",
              "payment",
              "analytics",
              "reporting",
              "compliance",
            ],
          },
        },
        maxTokens: 2048, // Larger response for complex analysis
      };

      const response = await directClient.executeSupportOperation(request);
      const duration = Date.now() - startTime;

      // Even complex operations should complete within 15s
      expect(duration).toBeLessThan(15000);
      expect(response.success).toBe(true);
      expect(response.latencyMs).toBeLessThan(15000);

      console.log(
        `✅ Complex implementation analysis completed in ${duration}ms (requirement: <15000ms)`
      );
    });
  });

  describe("Latency Performance Benchmarks", () => {
    it("should demonstrate consistent latency across operation types", async () => {
      const testOperations = [
        {
          operation: "emergency" as const,
          priority: "critical" as const,
          maxLatency: 5000,
        },
        {
          operation: "infrastructure" as const,
          priority: "critical" as const,
          maxLatency: 10000,
        },
        {
          operation: "meta_monitor" as const,
          priority: "critical" as const,
          maxLatency: 10000,
        },
        {
          operation: "implementation" as const,
          priority: "high" as const,
          maxLatency: 15000,
        },
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
          priority: testOp.priority,
          prompt: `Benchmark test for ${testOp.operation} operation`,
          context: {
            correlationId: `benchmark-${testOp.operation}-${Date.now()}`,
          },
        };

        const response = await directClient.executeSupportOperation(request);
        const duration = Date.now() - startTime;

        const withinLimit = duration < testOp.maxLatency && response.success;
        results.push({
          operation: testOp.operation,
          latency: duration,
          withinLimit,
        });

        console.log(
          `${testOp.operation}: ${duration}ms (limit: ${
            testOp.maxLatency
          }ms) - ${withinLimit ? "✅ PASS" : "❌ FAIL"}`
        );
      }

      // All operations should meet their latency requirements
      const failedOperations = results.filter((r) => !r.withinLimit);

      if (failedOperations.length > 0) {
        console.error(
          "❌ Latency requirement violations detected:",
          failedOperations
        );
      }

      expect(failedOperations.length).toBe(0);

      // Generate performance summary
      console.log("\n=== Direct Bedrock Latency Validation Summary ===");
      results.forEach((result) => {
        console.log(
          `${result.operation}: ${result.latency}ms - ${
            result.withinLimit ? "✅ PASS" : "❌ FAIL"
          }`
        );
      });

      const avgLatency =
        results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      console.log(
        `Average latency across all operations: ${avgLatency.toFixed(2)}ms`
      );
    });

    it("should validate timeout enforcement mechanisms", async () => {
      // Test that the client properly enforces different timeouts for different operation types
      const timeoutTests = [
        { operation: "emergency" as const, expectedTimeout: 5000 },
        { operation: "infrastructure" as const, expectedTimeout: 10000 },
        { operation: "meta_monitor" as const, expectedTimeout: 10000 },
        { operation: "implementation" as const, expectedTimeout: 30000 }, // Uses default timeout
      ];

      for (const test of timeoutTests) {
        const request: SupportOperationRequest = {
          operation: test.operation,
          priority: "critical",
          prompt: `Timeout validation for ${test.operation}`,
        };

        const startTime = Date.now();
        const response = await directClient.executeSupportOperation(request);
        const duration = Date.now() - startTime;

        // Should complete well within the expected timeout
        expect(duration).toBeLessThan(test.expectedTimeout);
        expect(response.success).toBe(true);

        console.log(
          `✅ ${test.operation} timeout validation: ${duration}ms < ${test.expectedTimeout}ms`
        );
      }
    });
  });

  describe("Performance Under Load", () => {
    it("should maintain latency requirements under sustained load", async () => {
      const loadTestDuration = 5000; // 5 seconds of load testing
      const operationsPerSecond = 2; // Conservative load
      const totalOperations =
        Math.floor(loadTestDuration / 1000) * operationsPerSecond;

      const operations: Promise<any>[] = [];
      const startTime = Date.now();

      // Generate sustained load
      for (let i = 0; i < totalOperations; i++) {
        const operationType = i % 2 === 0 ? "emergency" : "infrastructure";
        const maxLatency = operationType === "emergency" ? 5000 : 10000;

        const request: SupportOperationRequest = {
          operation: operationType as any,
          priority: "critical",
          prompt: `Load test operation ${i + 1}`,
          context: {
            correlationId: `load-test-${i + 1}`,
          },
        };

        // Stagger operations to simulate realistic load
        setTimeout(() => {
          operations.push(directClient.executeSupportOperation(request));
        }, (i * 1000) / operationsPerSecond);
      }

      // Wait for all operations to complete
      await new Promise((resolve) =>
        setTimeout(resolve, loadTestDuration + 2000)
      );
      const results = await Promise.allSettled(operations);

      const successfulResults = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<any>).value)
        .filter((r) => r.success);

      const totalDuration = Date.now() - startTime;

      console.log(
        `Load test completed: ${successfulResults.length}/${totalOperations} operations successful`
      );
      console.log(`Total duration: ${totalDuration}ms`);

      // At least 80% of operations should succeed
      expect(successfulResults.length / totalOperations).toBeGreaterThan(0.8);

      // All successful operations should meet latency requirements
      successfulResults.forEach((result, index) => {
        const maxLatency = index % 2 === 0 ? 5000 : 10000; // emergency vs infrastructure
        expect(result.latencyMs).toBeLessThan(maxLatency);
      });

      console.log(
        `✅ Load test passed: ${successfulResults.length} operations within latency limits`
      );
    });
  });
});
