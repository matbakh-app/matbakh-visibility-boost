/**
 * Hybrid Routing Audit Trail Integrity Validation Tests
 *
 * Comprehensive test suite for validating audit trail integrity
 * specifically for hybrid routing operations (Direct Bedrock + MCP)
 */

import { AuditEvent, AuditTrailSystem } from "../audit-trail-system";
import { BedrockSupportManager } from "../bedrock-support-manager";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock console.log to capture audit logs
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

describe("Hybrid Routing Audit Trail Integrity", () => {
  let auditTrail: AuditTrailSystem;
  let supportManager: BedrockSupportManager;
  let intelligentRouter: IntelligentRouter;
  let directBedrockClient: DirectBedrockClient;
  let mcpRouter: MCPRouter;

  beforeEach(() => {
    // Initialize audit trail with strict integrity checking
    auditTrail = new AuditTrailSystem({
      enableAuditTrail: true,
      enableIntegrityChecking: true,
      enablePIILogging: true,
      retentionDays: 90,
      complianceMode: "strict",
      encryptionEnabled: true,
      anonymizationEnabled: false, // Disable for testing
    });

    // Mock components
    supportManager = {
      activate: jest.fn(),
      runInfrastructureAudit: jest.fn(),
      enableMetaMonitoring: jest.fn(),
      provideFallbackSupport: jest.fn(),
    } as any;

    intelligentRouter = {
      makeRoutingDecision: jest.fn(),
      executeSupportOperation: jest.fn(),
      checkRouteHealth: jest.fn(),
    } as any;

    directBedrockClient = {
      analyze: jest.fn(),
      emergencySupport: jest.fn(),
      detectPii: jest.fn(),
    } as any;

    mcpRouter = {
      route: jest.fn(),
      checkHealth: jest.fn(),
    } as any;

    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("Hybrid Routing Decision Audit Trail", () => {
    it("should maintain audit trail integrity for routing decisions", async () => {
      const requestId = "hybrid-routing-test-001";
      const correlationId = "corr-001";

      // Log routing decision
      await auditTrail.logHybridRoutingDecision(
        requestId,
        {
          selectedRoute: "direct",
          reason: "Emergency operation requires <5s latency",
          fallbackAvailable: true,
          estimatedLatency: 3000,
          correlationId,
          primaryRouteHealth: true,
          fallbackRouteHealth: true,
        },
        "emergency_operations",
        "critical"
      );

      // Log direct Bedrock operation
      await auditTrail.logDirectBedrockOperation(
        requestId,
        "emergency_operations",
        "critical",
        2800,
        true,
        { input: 50, output: 25 },
        0.03,
        undefined,
        false,
        {
          gdprCompliant: true,
          piiRedacted: false,
          auditLogged: true,
        }
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const routingEvent = JSON.parse(
        auditLogCalls[0][0].replace("AUDIT: ", "")
      );
      const operationEvent = JSON.parse(
        auditLogCalls[1][0].replace("AUDIT: ", "")
      );

      // Verify event chain integrity
      expect(operationEvent.previousEventHash).toBe(routingEvent.eventHash);
      expect(routingEvent.eventHash).toBeDefined();
      expect(operationEvent.eventHash).toBeDefined();

      // Verify routing decision audit
      expect(routingEvent).toMatchObject({
        eventType: "hybrid_routing_decision",
        requestId,
        operation: "hybrid_routing",
        complianceStatus: "compliant",
        routingDecision: {
          selectedRoute: "direct",
          reason: "Emergency operation requires <5s latency",
          fallbackAvailable: true,
          estimatedLatency: 3000,
          correlationId,
        },
        metadata: {
          operationType: "emergency_operations",
          priority: "critical",
          selectedRoute: "direct",
        },
      });

      // Verify operation audit
      expect(operationEvent).toMatchObject({
        eventType: "direct_bedrock_operation",
        requestId,
        provider: "bedrock",
        operation: "emergency_operations",
        latencyMs: 2800,
        complianceStatus: "compliant",
        metadata: {
          operationType: "emergency_operations",
          priority: "critical",
          routingPath: "direct_bedrock",
          success: true,
          gdprCompliant: true,
        },
      });
    });

    it("should validate audit trail integrity for MCP routing operations", async () => {
      const requestId = "mcp-routing-test-001";

      // Log routing decision for MCP
      await auditTrail.logHybridRoutingDecision(
        requestId,
        {
          selectedRoute: "mcp",
          reason: "Standard operation, MCP available",
          fallbackAvailable: true,
          estimatedLatency: 15000,
          correlationId: "corr-002",
          primaryRouteHealth: true,
          fallbackRouteHealth: true,
        },
        "standard_analysis",
        "medium"
      );

      // Log MCP routing operation
      await auditTrail.logMCPRoutingOperation(
        requestId,
        "standard_analysis",
        "medium",
        12500,
        true,
        5,
        0
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify chain integrity
      expect(events[1].previousEventHash).toBe(events[0].eventHash);

      // Verify MCP operation audit
      expect(events[1]).toMatchObject({
        eventType: "mcp_routing_operation",
        requestId,
        provider: "bedrock",
        operation: "standard_analysis",
        latencyMs: 12500,
        complianceStatus: "compliant",
        metadata: {
          operationType: "standard_analysis",
          priority: "medium",
          routingPath: "mcp_integration",
          success: true,
          queueSize: 5,
          retryCount: 0,
        },
      });
    });

    it("should maintain integrity during intelligent routing fallback", async () => {
      const requestId = "fallback-test-001";

      // Log initial routing decision
      await auditTrail.logHybridRoutingDecision(
        requestId,
        {
          selectedRoute: "direct",
          reason: "Critical operation priority",
          fallbackAvailable: true,
          estimatedLatency: 8000,
          correlationId: "corr-003",
          primaryRouteHealth: true,
          fallbackRouteHealth: true,
        },
        "infrastructure_audit",
        "high"
      );

      // Log fallback event
      await auditTrail.logIntelligentRoutingFallback(
        requestId,
        "direct",
        "mcp",
        "Direct Bedrock timeout after 10s",
        "infrastructure_audit",
        "Request timeout: exceeded 10s limit"
      );

      // Log successful MCP operation after fallback
      await auditTrail.logMCPRoutingOperation(
        requestId,
        "infrastructure_audit",
        "high",
        18000,
        true,
        2,
        1
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(3);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify complete chain integrity
      expect(events[1].previousEventHash).toBe(events[0].eventHash);
      expect(events[2].previousEventHash).toBe(events[1].eventHash);

      // Verify fallback event
      expect(events[1]).toMatchObject({
        eventType: "intelligent_routing_fallback",
        requestId,
        operation: "routing_fallback",
        complianceStatus: "warning",
        error: {
          type: "primary_route_error",
          message: "Request timeout: exceeded 10s limit",
        },
        metadata: {
          fromRoute: "direct",
          toRoute: "mcp",
          fallbackReason: "Direct Bedrock timeout after 10s",
          operationType: "infrastructure_audit",
        },
      });
    });
  });

  describe("Route Health Monitoring Audit Trail", () => {
    it("should maintain audit trail integrity for route health checks", async () => {
      // Log health checks for both routes
      await auditTrail.logRouteHealthCheck("direct", true, 2500, 0.98, 0);

      await auditTrail.logRouteHealthCheck(
        "mcp",
        false,
        25000,
        0.75,
        3,
        "Connection timeout to MCP service"
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify chain integrity
      expect(events[1].previousEventHash).toBe(events[0].eventHash);

      // Verify direct route health
      expect(events[0]).toMatchObject({
        eventType: "route_health_check",
        operation: "health_monitoring",
        latencyMs: 2500,
        complianceStatus: "compliant",
        routeHealth: {
          route: "direct",
          isHealthy: true,
          latencyMs: 2500,
          successRate: 0.98,
          consecutiveFailures: 0,
        },
      });

      // Verify MCP route health with error
      expect(events[1]).toMatchObject({
        eventType: "route_health_check",
        operation: "health_monitoring",
        latencyMs: 25000,
        complianceStatus: "warning",
        routeHealth: {
          route: "mcp",
          isHealthy: false,
          latencyMs: 25000,
          successRate: 0.75,
          consecutiveFailures: 3,
        },
        error: {
          type: "health_check_error",
          message: "Connection timeout to MCP service",
        },
      });
    });

    it("should log routing optimization with performance metrics", async () => {
      const recommendations = [
        "Increase direct Bedrock capacity for emergency operations",
        "Optimize MCP connection pool for better throughput",
        "Implement predictive routing based on operation patterns",
      ];

      const metrics = {
        totalRequests: 1000,
        directRouteUsage: 300,
        mcpRouteUsage: 650,
        fallbackUsage: 50,
        averageLatency: 8500,
        successRate: 0.96,
      };

      await auditTrail.logRoutingOptimization(recommendations, metrics);

      // Verify audit trail
      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCall).toBeDefined();

      const event = JSON.parse(auditLogCall![0].replace("AUDIT: ", ""));

      expect(event).toMatchObject({
        eventType: "routing_optimization",
        operation: "routing_analysis",
        complianceStatus: "compliant",
        metadata: {
          recommendations,
          totalRequests: 1000,
          directRouteUsage: 300,
          mcpRouteUsage: 650,
          fallbackUsage: 50,
          averageLatency: 8500,
          successRate: 0.96,
          directUsagePercent: 30,
          mcpUsagePercent: 65,
          fallbackUsagePercent: 5,
        },
      });
    });
  });

  describe("GDPR Compliance and PII Redaction Audit Trail", () => {
    it("should maintain audit trail integrity for GDPR compliance validation", async () => {
      const requestId = "gdpr-test-001";

      // Log GDPR compliance validation for direct Bedrock
      await auditTrail.logGDPRComplianceValidation(
        requestId,
        "direct_bedrock",
        "emergency_operations",
        true,
        "EU data residency confirmed, consent validated",
        150
      );

      // Log GDPR compliance validation for MCP
      await auditTrail.logGDPRComplianceValidation(
        requestId,
        "mcp_integration",
        "standard_analysis",
        false,
        "Missing user consent for data processing",
        200
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify chain integrity
      expect(events[1].previousEventHash).toBe(events[0].eventHash);

      // Verify compliant GDPR validation
      expect(events[0]).toMatchObject({
        eventType: "gdpr_compliance_validation",
        requestId,
        operation: "gdpr_validation",
        complianceStatus: "compliant",
        gdprLawfulBasis: "legitimate_interests",
        metadata: {
          routingPath: "direct_bedrock",
          operationType: "emergency_operations",
          gdprCompliant: true,
          validationReason: "EU data residency confirmed, consent validated",
          processingTimeMs: 150,
        },
      });

      // Verify non-compliant GDPR validation
      expect(events[1]).toMatchObject({
        eventType: "gdpr_compliance_validation",
        requestId,
        operation: "gdpr_validation",
        complianceStatus: "violation",
        error: {
          type: "gdpr_compliance_error",
          message: "Missing user consent for data processing",
        },
        metadata: {
          routingPath: "mcp_integration",
          operationType: "standard_analysis",
          gdprCompliant: false,
        },
      });
    });

    it("should maintain audit trail integrity for PII redaction operations", async () => {
      const requestId = "pii-redaction-test-001";

      // Log standard PII redaction
      await auditTrail.logPIIRedaction(
        requestId,
        "direct_bedrock",
        "infrastructure_audit",
        true,
        2,
        500,
        450,
        false
      );

      // Log emergency PII redaction
      await auditTrail.logPIIRedaction(
        requestId,
        "direct_bedrock",
        "emergency_operations",
        true,
        1,
        200,
        180,
        true
      );

      // Verify audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(2);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify chain integrity
      expect(events[1].previousEventHash).toBe(events[0].eventHash);

      // Verify standard PII redaction
      expect(events[0]).toMatchObject({
        eventType: "pii_redaction",
        requestId,
        operation: "pii_redaction",
        piiDetected: true,
        complianceStatus: "compliant",
        gdprLawfulBasis: "data_protection",
        metadata: {
          routingPath: "direct_bedrock",
          operationType: "infrastructure_audit",
          redactionApplied: true,
          piiViolationsCount: 2,
          originalLength: 500,
          redactedLength: 450,
          isEmergencyRedaction: false,
          redactionPercentage: 10,
        },
      });

      // Verify emergency PII redaction
      expect(events[1]).toMatchObject({
        eventType: "emergency_pii_redaction",
        requestId,
        operation: "pii_redaction",
        piiDetected: true,
        complianceStatus: "compliant",
        metadata: {
          routingPath: "direct_bedrock",
          operationType: "emergency_operations",
          isEmergencyRedaction: true,
          piiViolationsCount: 1,
          redactionPercentage: 10,
        },
      });
    });
  });

  describe("Audit Trail Integrity Validation", () => {
    it("should detect and report audit trail tampering", async () => {
      const requestId = "integrity-test-001";

      // Create a sequence of events
      await auditTrail.logHybridRoutingDecision(
        requestId,
        {
          selectedRoute: "direct",
          reason: "Test routing",
          fallbackAvailable: true,
          estimatedLatency: 5000,
          correlationId: "corr-test",
        },
        "test_operation",
        "medium"
      );

      await auditTrail.logDirectBedrockOperation(
        requestId,
        "test_operation",
        "medium",
        4500,
        true
      );

      // Get the events
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify integrity of valid chain
      const validResult = await auditTrail.verifyIntegrity(events);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Tamper with an event hash
      const tamperedEvents = [...events];
      tamperedEvents[0].eventHash = "tampered-hash";

      // Verify integrity detects tampering
      const tamperedResult = await auditTrail.verifyIntegrity(tamperedEvents);
      expect(tamperedResult.valid).toBe(false);
      expect(tamperedResult.errors).toContain(
        `Event ${tamperedEvents[0].eventId} has invalid hash`
      );

      // Break the chain link
      const brokenChainEvents = [...events];
      brokenChainEvents[1].previousEventHash = "broken-link";

      const brokenChainResult = await auditTrail.verifyIntegrity(
        brokenChainEvents
      );
      expect(brokenChainResult.valid).toBe(false);
      expect(brokenChainResult.errors).toContain(
        `Event ${brokenChainEvents[1].eventId} has broken chain link`
      );
    });

    it("should validate complete hybrid operation audit trail", async () => {
      const requestId = "complete-hybrid-test-001";
      const correlationId = "corr-complete-001";

      // Simulate complete hybrid operation flow

      // 1. Initial routing decision
      await auditTrail.logHybridRoutingDecision(
        requestId,
        {
          selectedRoute: "direct",
          reason: "Infrastructure audit requires low latency",
          fallbackAvailable: true,
          estimatedLatency: 8000,
          correlationId,
          primaryRouteHealth: true,
          fallbackRouteHealth: true,
        },
        "infrastructure_audit",
        "high"
      );

      // 2. GDPR compliance validation
      await auditTrail.logGDPRComplianceValidation(
        requestId,
        "direct_bedrock",
        "infrastructure_audit",
        true,
        "EU data residency confirmed",
        100
      );

      // 3. PII detection and redaction
      await auditTrail.logPIIRedaction(
        requestId,
        "direct_bedrock",
        "infrastructure_audit",
        true,
        1,
        1000,
        950,
        false
      );

      // 4. Direct Bedrock operation
      await auditTrail.logDirectBedrockOperation(
        requestId,
        "infrastructure_audit",
        "high",
        7500,
        true,
        { input: 200, output: 150 },
        0.12,
        undefined,
        true,
        {
          gdprCompliant: true,
          piiRedacted: true,
          auditLogged: true,
        }
      );

      // 5. Route health check
      await auditTrail.logRouteHealthCheck("direct", true, 7500, 0.99, 0);

      // Verify complete audit trail integrity
      const auditLogCalls = mockConsoleLog.mock.calls.filter((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCalls).toHaveLength(5);

      const events = auditLogCalls.map((call) =>
        JSON.parse(call[0].replace("AUDIT: ", ""))
      );

      // Verify complete chain integrity
      for (let i = 1; i < events.length; i++) {
        expect(events[i].previousEventHash).toBe(events[i - 1].eventHash);
      }

      // Verify all events have the same request ID
      events.forEach((event, index) => {
        if (index < 4) {
          // First 4 events should have the same requestId
          expect(event.requestId).toBe(requestId);
        }
      });

      // Verify event types in correct order
      expect(events[0].eventType).toBe("hybrid_routing_decision");
      expect(events[1].eventType).toBe("gdpr_compliance_validation");
      expect(events[2].eventType).toBe("pii_redaction");
      expect(events[3].eventType).toBe("direct_bedrock_operation");
      expect(events[4].eventType).toBe("route_health_check");

      // Verify compliance status progression
      expect(events[0].complianceStatus).toBe("compliant");
      expect(events[1].complianceStatus).toBe("compliant");
      expect(events[2].complianceStatus).toBe("compliant");
      expect(events[3].complianceStatus).toBe("compliant");
      expect(events[4].complianceStatus).toBe("compliant");

      // Verify final integrity check
      const integrityResult = await auditTrail.verifyIntegrity(events);
      expect(integrityResult.valid).toBe(true);
      expect(integrityResult.errors).toHaveLength(0);
    });

    it("should handle audit trail integrity with disabled integrity checking", async () => {
      const auditTrailNoIntegrity = new AuditTrailSystem({
        enableAuditTrail: true,
        enableIntegrityChecking: false,
      });

      const events: AuditEvent[] = [
        {
          eventId: "event-1",
          timestamp: "2025-01-14T10:00:00Z",
          eventType: "hybrid_routing_decision",
          requestId: "req-1",
          complianceStatus: "compliant",
          eventHash: "any-hash",
          previousEventHash: "",
        },
      ];

      const result = await auditTrailNoIntegrity.verifyIntegrity(events);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Hybrid Operations Compliance Reporting", () => {
    it("should generate compliance report for hybrid operations", async () => {
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
        recommendations: expect.arrayContaining([
          expect.stringContaining("compliance"),
        ]),
      });

      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("should log custom hybrid routing events with proper integrity", async () => {
      const requestId = "custom-event-test-001";

      // Log custom hybrid routing event
      await auditTrail.logEvent({
        eventType: "hybrid_compliance_validation",
        requestId,
        provider: "bedrock",
        complianceStatus: "compliant",
        metadata: {
          customValidationType: "hybrid_routing_compliance",
          validationResult: "passed",
          routingPaths: ["direct", "mcp"],
          complianceChecks: {
            gdpr: true,
            pii: true,
            auditTrail: true,
          },
        },
      });

      // Verify audit trail
      const auditLogCall = mockConsoleLog.mock.calls.find((call) =>
        call[0].includes("AUDIT:")
      );

      expect(auditLogCall).toBeDefined();

      const event = JSON.parse(auditLogCall![0].replace("AUDIT: ", ""));

      expect(event).toMatchObject({
        eventType: "hybrid_compliance_validation",
        requestId,
        provider: "bedrock",
        complianceStatus: "compliant",
        metadata: {
          customValidationType: "hybrid_routing_compliance",
          validationResult: "passed",
          routingPaths: ["direct", "mcp"],
        },
      });

      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.eventHash).toBeDefined();
    });
  });
});
