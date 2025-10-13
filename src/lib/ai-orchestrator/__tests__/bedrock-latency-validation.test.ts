/**
 * Bedrock Latency Validation Tests
 *
 * Validates that direct Bedrock operations meet the specified latency requirements:
 * - Emergency operations: < 5 seconds
 * - Critical operations: < 10 seconds
 * - Implementation support: < 15 seconds
 */

import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";

// Mock AWS SDK
const mockBedrockSend = jest.fn();

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockBedrockSend,
  })),
  InvokeModelCommand: jest.fn(),
}));

// Mock dependencies with correct method names
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
    validateBeforeRouting: jest.fn().mockResolvedValue({
      isCompliant: true,
      violations: [],
      recommendations: [],
    }),
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
    performSafetyCheck: jest.fn().mockResolvedValue({
      allowed: true,
      confidence: 0.1,
      violations: [],
      processingTimeMs: 10,
    }),
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

describe("Bedrock Latency Validation", () => {
  let directClient: DirectBedrockClient;

  beforeEach(() => {
    // Setup realistic mock response with proper timing
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

  describe("Emergency Operations Latency Requirements (<5s)", () => {
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

  describe("Critical Operations Latency Requirements (<10s)", () => {
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
  });

  describe("Implementation Support Operations (<15s)", () => {
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
  });

  describe("Timeout Configuration Validation", () => {
    it("should have correct timeout configurations", async () => {
      const config = (directClient as any).config;

      expect(config.emergencyTimeout).toBe(5000);
      expect(config.criticalTimeout).toBe(10000);
      expect(config.timeout).toBe(30000);

      console.log(`✅ Timeout configuration validated:`, {
        emergency: config.emergencyTimeout,
        critical: config.criticalTimeout,
        standard: config.timeout,
      });
    });

    it("should validate operation timeout method", async () => {
      // Check if validateOperationTimeout method exists and works
      const hasMethod =
        typeof (directClient as any).validateOperationTimeout === "function";
      expect(hasMethod).toBe(true);

      // Test that it doesn't throw for valid operations
      expect(() => {
        (directClient as any).validateOperationTimeout("emergency");
        (directClient as any).validateOperationTimeout("infrastructure");
        (directClient as any).validateOperationTimeout("meta_monitor");
        (directClient as any).validateOperationTimeout("implementation");
      }).not.toThrow();

      console.log(`✅ Operation timeout validation method works correctly`);
    });
  });

  describe("Comprehensive Latency Benchmark", () => {
    it("should validate all operation types meet their latency requirements", async () => {
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
        success: boolean;
        withinLimit: boolean;
      }> = [];

      for (const testOp of testOperations) {
        const startTime = Date.now();

        const request: SupportOperationRequest = {
          operation: testOp.operation,
          priority: testOp.priority,
          prompt: `Latency benchmark test for ${testOp.operation} operation`,
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
          success: response.success,
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
      console.log("\n=== Bedrock Latency Validation Summary ===");
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

      // Verify all operations succeeded
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe("Performance Regression Detection", () => {
    it("should detect if any operation exceeds its latency threshold", async () => {
      // Test multiple iterations to catch potential performance regressions
      const iterations = 5;
      const operationTypes = [
        "emergency",
        "infrastructure",
        "meta_monitor",
        "implementation",
      ] as const;
      const maxLatencies = [5000, 10000, 10000, 15000];

      const allResults: Array<{
        operation: string;
        iteration: number;
        latency: number;
        withinLimit: boolean;
      }> = [];

      for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < operationTypes.length; j++) {
          const operation = operationTypes[j];
          const maxLatency = maxLatencies[j];

          const startTime = Date.now();

          const request: SupportOperationRequest = {
            operation,
            priority: "critical",
            prompt: `Regression test iteration ${i + 1} for ${operation}`,
            context: {
              correlationId: `regression-${operation}-${i + 1}`,
            },
          };

          const response = await directClient.executeSupportOperation(request);
          const duration = Date.now() - startTime;

          const withinLimit = duration < maxLatency && response.success;
          allResults.push({
            operation,
            iteration: i + 1,
            latency: duration,
            withinLimit,
          });
        }
      }

      // Analyze results for regressions
      const regressions = allResults.filter((r) => !r.withinLimit);

      if (regressions.length > 0) {
        console.error("❌ Performance regressions detected:", regressions);
      }

      // Calculate statistics per operation
      operationTypes.forEach((operation, index) => {
        const operationResults = allResults.filter(
          (r) => r.operation === operation
        );
        const latencies = operationResults.map((r) => r.latency);
        const avgLatency =
          latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const maxLatency = Math.max(...latencies);
        const minLatency = Math.min(...latencies);

        console.log(
          `${operation} stats: avg=${avgLatency.toFixed(
            2
          )}ms, min=${minLatency}ms, max=${maxLatency}ms (limit=${
            maxLatencies[index]
          }ms)`
        );
      });

      // No regressions should be detected
      expect(regressions.length).toBe(0);

      console.log(
        `✅ Performance regression test passed: ${allResults.length} operations tested`
      );
    });
  });
});
