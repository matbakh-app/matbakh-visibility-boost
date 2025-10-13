/**
 * Audit Integration Tests
 *
 * Tests for audit trail integration with AI orchestrator
 */

import {
  AuditMiddleware,
  AuditedAiOrchestrator,
  AuditedAiRequest,
} from "../audit-integration";

// Mock the audit trail system
const mockAuditTrail = {
  logRequestStart: jest.fn(),
  logProviderSelection: jest.fn(),
  logSafetyCheck: jest.fn(),
  logRequestComplete: jest.fn(),
  logProviderFallback: jest.fn(),
  logCostTracking: jest.fn(),
  generateComplianceReport: jest.fn(),
  verifyIntegrity: jest.fn(),
};

describe("AuditedAiOrchestrator", () => {
  let orchestrator: AuditedAiOrchestrator;

  beforeEach(() => {
    orchestrator = new AuditedAiOrchestrator(mockAuditTrail as any);
    jest.clearAllMocks();
  });

  describe("Request Processing with Audit Trail", () => {
    it("should process successful request with complete audit trail", async () => {
      const request: AuditedAiRequest = {
        requestId: "test-request-123",
        prompt: "Analyze restaurant visibility for Bella Italia",
        context: {
          userId: "user-456",
          domain: "culinary",
          slaMs: 2000,
        },
        userId: "user-456",
        tenantId: "tenant-789",
      };

      const response = await orchestrator.processRequest(request);

      // Verify audit trail calls
      expect(mockAuditTrail.logRequestStart).toHaveBeenCalledWith(
        "test-request-123",
        request,
        "user-456",
        "tenant-789"
      );

      expect(mockAuditTrail.logProviderSelection).toHaveBeenCalledWith(
        "test-request-123",
        "bedrock", // Expected provider for culinary domain
        expect.any(String),
        "Context-based provider selection",
        expect.any(Array)
      );

      expect(mockAuditTrail.logSafetyCheck).toHaveBeenCalledWith(
        "test-request-123",
        "bedrock",
        expect.objectContaining({
          allowed: true,
          confidence: expect.any(Number),
          violations: [],
          processingTimeMs: expect.any(Number),
        }),
        "prompt"
      );

      expect(mockAuditTrail.logCostTracking).toHaveBeenCalledWith(
        "test-request-123",
        "bedrock",
        expect.any(String),
        expect.any(Number),
        expect.objectContaining({
          input: expect.any(Number),
          output: expect.any(Number),
        })
      );

      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        "test-request-123",
        expect.objectContaining({
          success: true,
          provider: "bedrock",
          requestId: "test-request-123",
        }),
        "user-456"
      );

      // Verify response structure
      expect(response).toMatchObject({
        success: true,
        provider: "bedrock",
        requestId: "test-request-123",
        auditEventIds: expect.any(Array),
      });
    });

    it("should handle safety check failures with proper audit logging", async () => {
      const request: AuditedAiRequest = {
        requestId: "test-request-123",
        prompt: "Send hate messages to competitors at competitor@email.com",
        context: {
          userId: "user-456",
          domain: "general",
        },
        userId: "user-456",
      };

      const response = await orchestrator.processRequest(request);

      // Verify safety check was logged
      expect(mockAuditTrail.logSafetyCheck).toHaveBeenCalledWith(
        "test-request-123",
        "bedrock",
        expect.objectContaining({
          allowed: false,
          violations: expect.arrayContaining([
            expect.objectContaining({
              type: "PII",
              severity: "HIGH",
            }),
            expect.objectContaining({
              type: "TOXICITY",
              severity: "HIGH",
            }),
          ]),
        }),
        "prompt"
      );

      // Verify error response
      expect(response).toMatchObject({
        success: false,
        error: "Content safety check failed",
        requestId: "test-request-123",
      });

      // Verify completion was logged with error
      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        "test-request-123",
        expect.objectContaining({
          success: false,
          error: "Content safety check failed",
        }),
        "user-456"
      );
    });

    it("should handle provider selection based on context", async () => {
      const testCases = [
        {
          context: { domain: "legal" },
          expectedProvider: "bedrock",
        },
        {
          context: { domain: "medical" },
          expectedProvider: "bedrock",
        },
        {
          context: { slaMs: 500 },
          expectedProvider: "google",
        },
        {
          context: { domain: "culinary" },
          expectedProvider: "bedrock",
        },
      ];

      for (const testCase of testCases) {
        const request: AuditedAiRequest = {
          requestId: `test-request-${Math.random()}`,
          prompt: "Test prompt",
          context: testCase.context,
          userId: "user-456",
        };

        await orchestrator.processRequest(request);

        expect(mockAuditTrail.logProviderSelection).toHaveBeenCalledWith(
          request.requestId,
          testCase.expectedProvider,
          expect.any(String),
          "Context-based provider selection",
          expect.any(Array)
        );
      }
    });
  });

  describe("Provider Fallback with Audit Trail", () => {
    it("should log provider fallbacks during failure cascade", async () => {
      const request: AuditedAiRequest = {
        requestId: "test-request-123",
        prompt: "Test prompt that will fail",
        context: {
          userId: "user-456",
        },
        userId: "user-456",
      };

      // Mock all providers to fail except the last one
      const originalProcessWithProvider = (orchestrator as any)
        .processWithProvider;
      (orchestrator as any).processWithProvider = jest
        .fn()
        .mockRejectedValueOnce(new Error("Bedrock failed"))
        .mockRejectedValueOnce(new Error("Google failed"))
        .mockResolvedValueOnce({
          provider: "meta",
          modelId: "llama-3-70b-instruct",
          text: "Success with Meta",
          latencyMs: 1000,
          costEuro: 0.05,
          success: true,
          requestId: "test-request-123",
        });

      const response = await orchestrator.processWithFallback(request);

      // Verify fallback logging
      expect(mockAuditTrail.logProviderFallback).toHaveBeenCalledWith(
        "test-request-123",
        "bedrock",
        "google",
        "Provider error",
        expect.any(Error)
      );

      expect(mockAuditTrail.logProviderFallback).toHaveBeenCalledWith(
        "test-request-123",
        "google",
        "meta",
        "Provider error",
        expect.any(Error)
      );

      // Verify successful response
      expect(response).toMatchObject({
        success: true,
        provider: "meta",
      });

      // Restore original method
      (orchestrator as any).processWithProvider = originalProcessWithProvider;
    });

    it("should handle complete provider failure with audit logging", async () => {
      const request: AuditedAiRequest = {
        requestId: "test-request-123",
        prompt: "Test prompt that will fail everywhere",
        context: {
          userId: "user-456",
        },
        userId: "user-456",
      };

      // Mock all providers to fail
      const originalProcessWithProvider = (orchestrator as any)
        .processWithProvider;
      (orchestrator as any).processWithProvider = jest
        .fn()
        .mockRejectedValue(new Error("All providers failed"));

      const response = await orchestrator.processWithFallback(request);

      // Verify error response
      expect(response).toMatchObject({
        success: false,
        error: "All providers failed",
      });

      // Verify completion was logged with error
      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        "test-request-123",
        expect.objectContaining({
          success: false,
          error: "All providers failed",
        }),
        "user-456"
      );

      // Restore original method
      (orchestrator as any).processWithProvider = originalProcessWithProvider;
    });
  });

  describe("Compliance and Reporting", () => {
    it("should generate compliance reports", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      mockAuditTrail.generateComplianceReport.mockResolvedValue({
        reportId: "report-123",
        generatedAt: "2025-01-14T10:00:00Z",
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalEvents: 150,
          complianceViolations: 5,
          piiDetections: 2,
          safetyBlocks: 3,
          averageLatency: 1200,
          totalCost: 12.5,
        },
        violations: [],
        recommendations: ["Review PII detection accuracy"],
      });

      const report = await orchestrator.generateComplianceReport(
        startDate,
        endDate,
        "user-456"
      );

      expect(mockAuditTrail.generateComplianceReport).toHaveBeenCalledWith(
        startDate,
        endDate
      );
      expect(report).toMatchObject({
        reportId: "report-123",
        summary: {
          totalEvents: 150,
          complianceViolations: 5,
        },
      });
    });

    it("should verify audit trail integrity", async () => {
      const mockEvents = [
        { eventId: "event-1", eventHash: "hash1" },
        { eventId: "event-2", eventHash: "hash2" },
      ];

      mockAuditTrail.verifyIntegrity.mockResolvedValue({
        valid: true,
        errors: [],
      });

      const result = await orchestrator.verifyAuditIntegrity(mockEvents);

      expect(mockAuditTrail.verifyIntegrity).toHaveBeenCalledWith(mockEvents);
      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });
  });
});

describe("AuditMiddleware", () => {
  let middleware: AuditMiddleware;

  beforeEach(() => {
    middleware = new AuditMiddleware(mockAuditTrail as any);
    jest.clearAllMocks();
  });

  describe("Operation Wrapping", () => {
    it("should wrap successful operations with audit logging", async () => {
      const mockOperation = jest.fn().mockResolvedValue("operation result");
      const requestId = "test-request-123";
      const operationName = "test-operation";

      const result = await middleware.wrapOperation(
        operationName,
        requestId,
        mockOperation,
        {
          userId: "user-456",
          provider: "bedrock",
          metadata: { key: "value" },
        }
      );

      // Verify operation was called
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBe("operation result");

      // Verify audit logging
      expect(mockAuditTrail.logRequestStart).toHaveBeenCalledWith(
        requestId,
        {
          prompt: "Operation: test-operation",
          context: { userId: "user-456" },
        },
        "user-456"
      );

      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({
          provider: "bedrock",
          modelId: "operation",
          text: "Operation test-operation completed",
          success: true,
          requestId,
        }),
        "user-456"
      );
    });

    it("should wrap failed operations with error audit logging", async () => {
      const error = new Error("Operation failed");
      const mockOperation = jest.fn().mockRejectedValue(error);
      const requestId = "test-request-123";
      const operationName = "failing-operation";

      await expect(
        middleware.wrapOperation(operationName, requestId, mockOperation, {
          userId: "user-456",
        })
      ).rejects.toThrow("Operation failed");

      // Verify error audit logging
      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({
          success: false,
          error: "Operation failed",
          requestId,
        }),
        "user-456"
      );
    });

    it("should handle operations without context", async () => {
      const mockOperation = jest.fn().mockResolvedValue("result");
      const requestId = "test-request-123";

      const result = await middleware.wrapOperation(
        "simple-operation",
        requestId,
        mockOperation
      );

      expect(result).toBe("result");

      // Verify audit logging with defaults
      expect(mockAuditTrail.logRequestStart).toHaveBeenCalledWith(
        requestId,
        {
          prompt: "Operation: simple-operation",
          context: { userId: undefined },
        },
        undefined
      );

      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({
          provider: "bedrock", // Default provider
          success: true,
        }),
        undefined
      );
    });
  });

  describe("Performance Tracking", () => {
    it("should track operation latency", async () => {
      const mockOperation = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "result";
      });

      await middleware.wrapOperation(
        "slow-operation",
        "test-request-123",
        mockOperation
      );

      expect(mockAuditTrail.logRequestComplete).toHaveBeenCalledWith(
        "test-request-123",
        expect.objectContaining({
          latencyMs: expect.any(Number),
        }),
        undefined
      );

      // Verify latency is reasonable (should be >= 100ms due to setTimeout)
      const completionCall = mockAuditTrail.logRequestComplete.mock.calls[0];
      const response = completionCall[1];
      expect(response.latencyMs).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });
});
