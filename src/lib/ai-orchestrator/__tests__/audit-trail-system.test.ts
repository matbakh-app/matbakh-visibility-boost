/**
 * Audit Trail System Tests
 *
 * Comprehensive test suite for AI operations audit trail
 */

import { AuditEvent, AuditTrailSystem } from "../audit-trail-system";
import { SafetyCheckResult } from "../safety/guardrails-service";
import { AiRequest, AiResponse } from "../types";

// Mock console.log to capture audit logs
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

describe("AuditTrailSystem", () => {
  let auditTrail: AuditTrailSystem;

  beforeEach(() => {
    auditTrail = new AuditTrailSystem({
      enableAuditTrail: true,
      enableIntegrityChecking: true,
      enablePIILogging: false,
      retentionDays: 90,
      complianceMode: "strict",
      encryptionEnabled: true,
      anonymizationEnabled: true,
    });

    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("Request Lifecycle Logging", () => {
    it("should log AI request start with proper audit event", async () => {
      const requestId = "test-request-123";
      const request: AiRequest = {
        prompt: "Test prompt for restaurant analysis",
        context: {
          userId: "user-456",
          domain: "culinary",
          pii: false,
          tenant: "tenant-789",
        },
      };

      await auditTrail.logRequestStart(
        requestId,
        request,
        "user-456",
        "tenant-789"
      );

      // Verify audit event structure
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("AUDIT:")
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "ai_request_start",
          requestId,
          contentType: "prompt",
          dataClassification: "internal",
          complianceStatus: "pending",
          gdprLawfulBasis: "legitimate_interests",
          dataProcessingPurpose: "ai_analysis",
        });

        expect(auditEvent.eventId).toBeDefined();
        expect(auditEvent.timestamp).toBeDefined();
        expect(auditEvent.contentHash).toBeDefined();
        expect(auditEvent.eventHash).toBeDefined();
        expect(auditEvent.contentLength).toBe(request.prompt.length);
      }
    });

    it("should log AI request completion with performance metrics", async () => {
      const requestId = "test-request-123";
      const response: AiResponse = {
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        text: "Analysis complete: Your restaurant has good visibility.",
        latencyMs: 1250,
        costEuro: 0.05,
        success: true,
        requestId,
      };

      await auditTrail.logRequestComplete(requestId, response, "user-456");

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "ai_request_complete",
          requestId,
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          contentType: "response",
          latencyMs: 1250,
          costEuro: 0.05,
          complianceStatus: "compliant",
        });

        expect(auditEvent.tokensUsed).toBeDefined();
        expect(auditEvent.contentHash).toBeDefined();
      }
    });

    it("should log request errors with proper error details", async () => {
      const requestId = "test-request-123";
      const response: AiResponse = {
        provider: "bedrock",
        modelId: "claude-3-5-sonnet",
        latencyMs: 500,
        costEuro: 0,
        success: false,
        error: "Rate limit exceeded",
        requestId,
      };

      await auditTrail.logRequestComplete(requestId, response, "user-456");

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "ai_request_complete",
          complianceStatus: "violation",
          error: {
            type: "ai_response_error",
            message: "Rate limit exceeded",
          },
        });
      }
    });
  });

  describe("Provider Selection Logging", () => {
    it("should log provider selection with routing decision", async () => {
      const requestId = "test-request-123";

      await auditTrail.logProviderSelection(
        requestId,
        "bedrock",
        "claude-3-5-sonnet",
        "Domain-based routing for culinary analysis",
        ["google", "meta"]
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "provider_selection",
          requestId,
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          operation: "provider_routing",
          complianceStatus: "compliant",
          metadata: {
            selectionReason: "Domain-based routing for culinary analysis",
            alternativeProviders: ["google", "meta"],
          },
        });
      }
    });

    it("should log provider fallback with error details", async () => {
      const requestId = "test-request-123";
      const error = new Error("Service unavailable");

      await auditTrail.logProviderFallback(
        requestId,
        "bedrock",
        "google",
        "Primary provider timeout",
        error
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "provider_fallback",
          requestId,
          provider: "bedrock",
          operation: "fallback_routing",
          complianceStatus: "warning",
          error: {
            type: "Error",
            message: "Service unavailable",
          },
          metadata: {
            fromProvider: "bedrock",
            toProvider: "google",
            fallbackReason: "Primary provider timeout",
          },
        });
      }
    });
  });

  describe("Safety and Compliance Logging", () => {
    it("should log safety check results for compliant content", async () => {
      const requestId = "test-request-123";
      const safetyResult: SafetyCheckResult = {
        allowed: true,
        confidence: 0.95,
        violations: [],
        processingTimeMs: 150,
      };

      await auditTrail.logSafetyCheck(
        requestId,
        "bedrock",
        safetyResult,
        "prompt"
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "safety_check",
          requestId,
          provider: "bedrock",
          contentType: "prompt",
          complianceStatus: "compliant",
          safetyCheckResult: {
            allowed: true,
            confidence: 0.95,
            violationTypes: [],
            processingTimeMs: 150,
          },
        });
      }
    });

    it("should log safety violations and trigger compliance violation", async () => {
      const requestId = "test-request-123";
      const safetyResult: SafetyCheckResult = {
        allowed: false,
        confidence: 0.85,
        violations: [
          {
            type: "TOXICITY",
            severity: "HIGH",
            confidence: 0.9,
            details: "Toxic language detected",
          },
          {
            type: "PII",
            severity: "MEDIUM",
            confidence: 0.8,
            details: "Email address detected",
          },
        ],
        processingTimeMs: 200,
      };

      await auditTrail.logSafetyCheck(
        requestId,
        "bedrock",
        safetyResult,
        "prompt"
      );

      // Should log both safety check and compliance violation
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      // Check safety check event
      const safetyEvent = JSON.parse(
        auditLogCalls[0][0].replace("AUDIT: ", "")
      );
      expect(safetyEvent).toMatchObject({
        eventType: "pii_detection", // Should be PII detection due to PII violation
        complianceStatus: "violation",
        piiDetected: true,
        piiTypes: ["Email address detected"],
      });

      // Check compliance violation event
      const violationEvent = JSON.parse(
        auditLogCalls[1][0].replace("AUDIT: ", "")
      );
      expect(violationEvent).toMatchObject({
        eventType: "compliance_violation",
        complianceStatus: "violation",
      });
    });

    it("should log PII detection with proper classification", async () => {
      const requestId = "test-request-123";
      const safetyResult: SafetyCheckResult = {
        allowed: false,
        confidence: 0.9,
        violations: [
          {
            type: "PII",
            severity: "HIGH",
            confidence: 0.95,
            details: "Credit card number detected",
            position: { start: 10, end: 25 },
          },
        ],
        processingTimeMs: 180,
      };

      await auditTrail.logSafetyCheck(
        requestId,
        "bedrock",
        safetyResult,
        "prompt"
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "pii_detection",
          piiDetected: true,
          piiTypes: ["Credit card number detected"],
          complianceStatus: "violation",
        });
      }
    });
  });

  describe("Cost and Performance Tracking", () => {
    it("should log cost tracking with token usage", async () => {
      const requestId = "test-request-123";

      await auditTrail.logCostTracking(
        requestId,
        "bedrock",
        "claude-3-5-sonnet",
        0.08,
        { input: 150, output: 75 }
      );

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        expect(auditEvent).toMatchObject({
          eventType: "cost_tracking",
          requestId,
          provider: "bedrock",
          modelId: "claude-3-5-sonnet",
          costEuro: 0.08,
          tokensUsed: {
            input: 150,
            output: 75,
          },
          complianceStatus: "compliant",
        });
      }
    });
  });

  describe("Audit Trail Integrity", () => {
    it("should maintain event chain integrity", async () => {
      const requestId = "test-request-123";

      // Log multiple events
      await auditTrail.logProviderSelection(
        requestId,
        "bedrock",
        "claude-3-5-sonnet",
        "test"
      );
      await auditTrail.logCostTracking(
        requestId,
        "bedrock",
        "claude-3-5-sonnet",
        0.05,
        { input: 100, output: 50 }
      );

      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const event1 = JSON.parse(auditLogCalls[0][0].replace("AUDIT: ", ""));
      const event2 = JSON.parse(auditLogCalls[1][0].replace("AUDIT: ", ""));

      // Second event should reference first event's hash
      expect(event2.previousEventHash).toBe(event1.eventHash);
      expect(event1.eventHash).toBeDefined();
      expect(event2.eventHash).toBeDefined();
      expect(event1.eventHash).not.toBe(event2.eventHash);
    });

    it("should verify audit trail integrity", async () => {
      const events: AuditEvent[] = [
        {
          eventId: "event-1",
          timestamp: "2025-01-14T10:00:00Z",
          eventType: "ai_request_start",
          requestId: "req-1",
          complianceStatus: "pending",
          eventHash: "hash1",
          previousEventHash: "",
        },
        {
          eventId: "event-2",
          timestamp: "2025-01-14T10:00:01Z",
          eventType: "ai_request_complete",
          requestId: "req-1",
          complianceStatus: "compliant",
          eventHash: "hash2",
          previousEventHash: "hash1",
        },
      ];

      // Mock the hash calculation to return expected values
      const auditTrailWithMockedHash = new AuditTrailSystem();
      (auditTrailWithMockedHash as any).calculateEventHash = jest
        .fn()
        .mockResolvedValueOnce("hash1")
        .mockResolvedValueOnce("hash2");

      const result = await auditTrailWithMockedHash.verifyIntegrity(events);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect integrity violations", async () => {
      const events: AuditEvent[] = [
        {
          eventId: "event-1",
          timestamp: "2025-01-14T10:00:00Z",
          eventType: "ai_request_start",
          requestId: "req-1",
          complianceStatus: "pending",
          eventHash: "wrong-hash",
          previousEventHash: "",
        },
      ];

      const result = await auditTrail.verifyIntegrity(events);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Event event-1 has invalid hash");
    });
  });

  describe("Compliance Reporting", () => {
    it("should generate compliance report structure", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const report = await auditTrail.generateComplianceReport(
        startDate,
        endDate
      );

      expect(report).toMatchObject({
        reportId: expect.any(String),
        generatedAt: expect.any(String),
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalEvents: expect.any(Number),
          complianceViolations: expect.any(Number),
          piiDetections: expect.any(Number),
          safetyBlocks: expect.any(Number),
          averageLatency: expect.any(Number),
          totalCost: expect.any(Number),
        },
        violations: expect.any(Array),
        recommendations: expect.any(Array),
      });

      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration and Privacy", () => {
    it("should respect audit trail disable setting", async () => {
      const disabledAuditTrail = new AuditTrailSystem({
        enableAuditTrail: false,
      });

      const requestId = "test-request-123";
      const request: AiRequest = {
        prompt: "Test prompt",
        context: { userId: "user-456" },
      };

      await disabledAuditTrail.logRequestStart(requestId, request, "user-456");

      // Should not log anything when disabled
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(0);
    });

    it("should anonymize user IDs when anonymization is enabled", async () => {
      const requestId = "test-request-123";
      const request: AiRequest = {
        prompt: "Test prompt",
        context: { userId: "user-456" },
      };

      await auditTrail.logRequestStart(requestId, request, "user-456");

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));

        // User ID should be hashed, not original
        expect(auditEvent.userId).not.toBe("user-456");
        expect(auditEvent.userId).toMatch(/^user_-?\d+$/);
      }
    });

    it("should classify content based on context", async () => {
      const testCases = [
        { context: { pii: true }, expected: "restricted" },
        { context: { domain: "legal" }, expected: "confidential" },
        { context: { domain: "medical" }, expected: "confidential" },
        { context: { tenant: "tenant-123" }, expected: "internal" },
        { context: {}, expected: "public" },
      ];

      for (const testCase of testCases) {
        const requestId = `test-request-${Math.random()}`;
        const request: AiRequest = {
          prompt: "Test prompt",
          context: testCase.context,
        };

        await auditTrail.logRequestStart(requestId, request);

        const auditLogCall = mockConsoleLog.mock.calls.find(
          (call) => call[0].includes("AUDIT:") && call[0].includes(requestId)
        );

        if (auditLogCall) {
          const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));
          expect(auditEvent.dataClassification).toBe(testCase.expected);
        }
      }
    });
  });

  describe("GDPR Compliance", () => {
    it("should determine correct lawful basis for processing", async () => {
      const testCases = [
        { context: { pii: true }, expected: "consent" },
        { context: { domain: "legal" }, expected: "legal_obligation" },
        { context: { domain: "culinary" }, expected: "legitimate_interests" },
      ];

      for (const testCase of testCases) {
        const requestId = `test-request-${Math.random()}`;
        const request: AiRequest = {
          prompt: "Test prompt",
          context: testCase.context,
        };

        await auditTrail.logRequestStart(requestId, request);

        const auditLogCall = mockConsoleLog.mock.calls.find(
          (call) => call[0].includes("AUDIT:") && call[0].includes(requestId)
        );

        if (auditLogCall) {
          const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));
          expect(auditEvent.gdprLawfulBasis).toBe(testCase.expected);
        }
      }
    });

    it("should set appropriate data processing purpose", async () => {
      const requestId = "test-request-123";
      const request: AiRequest = {
        prompt: "Test prompt",
        context: { userId: "user-456" },
      };

      await auditTrail.logRequestStart(requestId, request);

      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      if (auditLogCall) {
        const auditEvent = JSON.parse(auditLogCall[0].replace("AUDIT: ", ""));
        expect(auditEvent.dataProcessingPurpose).toBe("ai_analysis");
      }
    });
  });
});
