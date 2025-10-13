/**
 * Hybrid Routing Compliance Validation Tests
 *
 * Tests compliance validation for both direct Bedrock and MCP integration routing paths
 * in the Bedrock Support Manager hybrid architecture.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ComplianceIntegration } from "../compliance-integration";
import {
  GDPRHybridComplianceValidator,
  HybridRoutingPath,
} from "../gdpr-hybrid-compliance-validator";
import { ProviderAgreementCompliance } from "../provider-agreement-compliance";
import { AiRequest, Provider } from "../types";

// Mock dependencies
jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("../basic-logger", () => ({
  BasicLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

jest.mock("../../compliance/gdpr-compliance-validator", () => ({
  GDPRComplianceValidator: jest.fn().mockImplementation(() => ({
    validateCompliance: jest.fn().mockResolvedValue({
      overallStatus: "compliant",
      complianceScore: 100,
    }),
  })),
}));

describe("Hybrid Routing Compliance Validation", () => {
  let complianceIntegration: ComplianceIntegration;
  let gdprValidator: GDPRHybridComplianceValidator;
  let providerCompliance: ProviderAgreementCompliance;
  let mockRequest: AiRequest;

  beforeEach(() => {
    complianceIntegration = new ComplianceIntegration();
    gdprValidator = new GDPRHybridComplianceValidator();
    providerCompliance = new ProviderAgreementCompliance();

    mockRequest = {
      prompt: "Test infrastructure audit request",
      context: {
        domain: "infrastructure",
        intent: "audit",
      },
    };
  });

  describe("Direct Bedrock Routing Path Compliance", () => {
    let directBedrockPath: HybridRoutingPath;

    beforeEach(() => {
      directBedrockPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };
    });

    it("should validate GDPR compliance for direct Bedrock operations", async () => {
      const correlationId = "test-direct-bedrock-gdpr";

      const result = await gdprValidator.validateRoutingPathCompliance(
        directBedrockPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(result.routingPath.routeType).toBe("direct_bedrock");
      expect(result.routingPath.provider).toBe("bedrock");
      expect(result.correlationId).toBe(correlationId);
      expect(typeof result.isCompliant).toBe("boolean");
      expect(typeof result.complianceScore).toBe("number");
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it("should validate provider agreement compliance for direct Bedrock", async () => {
      const result = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "bedrock",
        "test-direct-bedrock-provider"
      );

      expect(result.allowed).toBe(true);
      expect(result.provider).toBe("bedrock");
      expect(result.complianceScore).toBeGreaterThan(80);
      expect(result.agreementStatus).toBe("active");
      expect(result.violations).toHaveLength(0);
    });

    it("should validate data processing compliance for direct Bedrock", async () => {
      const correlationId = "test-direct-bedrock-data-processing";

      const result = await gdprValidator.validateRoutingPathCompliance(
        directBedrockPath,
        correlationId
      );

      expect(result.dataProcessingCompliance).toBeDefined();
      expect(typeof result.dataProcessingCompliance.lawfulBasisDocumented).toBe(
        "boolean"
      );
      expect(
        typeof result.dataProcessingCompliance.purposeLimitationEnforced
      ).toBe("boolean");
      expect(
        typeof result.dataProcessingCompliance.dataMinimizationImplemented
      ).toBe("boolean");
      expect(
        typeof result.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
    });

    it("should validate audit trail compliance for direct Bedrock", async () => {
      const correlationId = "test-direct-bedrock-audit-trail";

      const result = await gdprValidator.validateRoutingPathCompliance(
        directBedrockPath,
        correlationId
      );

      expect(result.auditTrailCompliance).toBeDefined();
      expect(typeof result.auditTrailCompliance.auditLoggingEnabled).toBe(
        "boolean"
      );
      expect(typeof result.auditTrailCompliance.correlationIdTracking).toBe(
        "boolean"
      );
      expect(typeof result.auditTrailCompliance.routingPathLogged).toBe(
        "boolean"
      );
      expect(typeof result.auditTrailCompliance.integrityCheckingEnabled).toBe(
        "boolean"
      );
    });

    it("should validate emergency operations compliance for direct Bedrock", async () => {
      const emergencyPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "emergency",
        priority: "critical",
      };

      const correlationId = "test-direct-bedrock-emergency";

      const result = await gdprValidator.validateRoutingPathCompliance(
        emergencyPath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("emergency");
      expect(result.routingPath.priority).toBe("critical");
      // Emergency operations should still maintain compliance
      expect(result.dataProcessingCompliance).toBeDefined();
      expect(result.auditTrailCompliance).toBeDefined();
    });

    it("should validate infrastructure audit operations compliance", async () => {
      const infrastructurePath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };

      const correlationId = "test-direct-bedrock-infrastructure";

      const result = await gdprValidator.validateRoutingPathCompliance(
        infrastructurePath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("infrastructure");
      // Infrastructure operations should have high compliance requirements
      expect(result.dataProcessingCompliance.euDataResidencyCompliant).toBe(
        true
      );
    });

    it("should validate meta monitoring operations compliance", async () => {
      const metaMonitorPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "meta_monitor",
        priority: "high",
      };

      const correlationId = "test-direct-bedrock-meta-monitor";

      const result = await gdprValidator.validateRoutingPathCompliance(
        metaMonitorPath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("meta_monitor");
      expect(result.routingPath.priority).toBe("high");
    });
  });

  describe("MCP Integration Routing Path Compliance", () => {
    let mcpIntegrationPath: HybridRoutingPath;

    beforeEach(() => {
      mcpIntegrationPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };
    });

    it("should validate GDPR compliance for MCP integration operations", async () => {
      const correlationId = "test-mcp-integration-gdpr";

      const result = await gdprValidator.validateRoutingPathCompliance(
        mcpIntegrationPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(result.routingPath.routeType).toBe("mcp_integration");
      expect(result.routingPath.provider).toBe("google");
      expect(result.correlationId).toBe(correlationId);
      expect(typeof result.isCompliant).toBe("boolean");
      expect(typeof result.complianceScore).toBe("number");
    });

    it("should validate provider agreement compliance for MCP integration", async () => {
      const result = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "google",
        "test-mcp-integration-provider"
      );

      expect(result.allowed).toBe(true);
      expect(result.provider).toBe("google");
      expect(result.complianceScore).toBeGreaterThan(70);
      expect(result.agreementStatus).toBe("active");
    });

    it("should validate data processing compliance for MCP integration", async () => {
      const correlationId = "test-mcp-integration-data-processing";

      const result = await gdprValidator.validateRoutingPathCompliance(
        mcpIntegrationPath,
        correlationId
      );

      expect(result.dataProcessingCompliance).toBeDefined();
      expect(typeof result.dataProcessingCompliance.lawfulBasisDocumented).toBe(
        "boolean"
      );
      expect(
        typeof result.dataProcessingCompliance.purposeLimitationEnforced
      ).toBe("boolean");
      expect(
        typeof result.dataProcessingCompliance.dataMinimizationImplemented
      ).toBe("boolean");
    });

    it("should validate Kiro communication operations compliance", async () => {
      const kiroCommPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "bedrock",
        operationType: "kiro_communication",
        priority: "medium",
      };

      const correlationId = "test-mcp-integration-kiro-comm";

      const result = await gdprValidator.validateRoutingPathCompliance(
        kiroCommPath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("kiro_communication");
      expect(result.routingPath.routeType).toBe("mcp_integration");
    });

    it("should validate standard analysis operations compliance", async () => {
      const standardAnalysisPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const correlationId = "test-mcp-integration-standard-analysis";

      const result = await gdprValidator.validateRoutingPathCompliance(
        standardAnalysisPath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("standard_analysis");
      expect(result.routingPath.provider).toBe("google");
    });

    it("should validate background tasks operations compliance", async () => {
      const backgroundTasksPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "meta",
        operationType: "background_tasks",
        priority: "low",
      };

      const correlationId = "test-mcp-integration-background-tasks";

      const result = await gdprValidator.validateRoutingPathCompliance(
        backgroundTasksPath,
        correlationId
      );

      expect(result.routingPath.operationType).toBe("background_tasks");
      expect(result.routingPath.priority).toBe("low");
    });
  });

  describe("Cross-Path Compliance Validation", () => {
    it("should validate compliance consistency between routing paths", async () => {
      const directBedrockPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };

      const mcpIntegrationPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "bedrock",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const directResult = await gdprValidator.validateRoutingPathCompliance(
        directBedrockPath,
        "test-cross-path-direct"
      );

      const mcpResult = await gdprValidator.validateRoutingPathCompliance(
        mcpIntegrationPath,
        "test-cross-path-mcp"
      );

      // Both paths should maintain consistent compliance standards
      expect(
        directResult.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe(mcpResult.dataProcessingCompliance.euDataResidencyCompliant);
      expect(directResult.auditTrailCompliance.auditLoggingEnabled).toBe(
        mcpResult.auditTrailCompliance.auditLoggingEnabled
      );
    });

    it("should generate comprehensive hybrid compliance report", async () => {
      const report = await gdprValidator.generateHybridComplianceReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(["compliant", "non_compliant", "partial"]).toContain(
        report.overallCompliance
      );
      expect(typeof report.complianceScore).toBe("number");

      // Validate both routing paths are included
      expect(report.routingPathCompliance.directBedrock).toBeDefined();
      expect(report.routingPathCompliance.mcpIntegration).toBeDefined();
      expect(
        report.routingPathCompliance.directBedrock.routingPath.routeType
      ).toBe("direct_bedrock");
      expect(
        report.routingPathCompliance.mcpIntegration.routingPath.routeType
      ).toBe("mcp_integration");

      // Validate cross-path compliance
      expect(report.crossPathCompliance).toBeDefined();
      expect(typeof report.crossPathCompliance.dataConsistency).toBe("boolean");
      expect(typeof report.crossPathCompliance.auditTrailContinuity).toBe(
        "boolean"
      );
      expect(typeof report.crossPathCompliance.consentPropagation).toBe(
        "boolean"
      );
      expect(typeof report.crossPathCompliance.piiHandlingConsistency).toBe(
        "boolean"
      );
    });

    it("should validate routing decision compliance", async () => {
      const directBedrockPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "emergency",
        priority: "critical",
      };

      const mcpIntegrationPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const directResult = await gdprValidator.validateBeforeRouting(
        directBedrockPath,
        "test-routing-decision-direct"
      );

      const mcpResult = await gdprValidator.validateBeforeRouting(
        mcpIntegrationPath,
        "test-routing-decision-mcp"
      );

      expect(directResult).toBeDefined();
      expect(typeof directResult.allowed).toBe("boolean");
      expect(typeof directResult.reason).toBe("string");

      expect(mcpResult).toBeDefined();
      expect(typeof mcpResult.allowed).toBe("boolean");
      expect(typeof mcpResult.reason).toBe("string");
    });
  });

  describe("Provider-Specific Compliance Validation", () => {
    it("should validate AWS Bedrock compliance for both routing paths", async () => {
      const directPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };

      const mcpPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "bedrock",
        operationType: "kiro_communication",
        priority: "medium",
      };

      const directResult = await gdprValidator.validateRoutingPathCompliance(
        directPath,
        "test-bedrock-direct"
      );

      const mcpResult = await gdprValidator.validateRoutingPathCompliance(
        mcpPath,
        "test-bedrock-mcp"
      );

      expect(directResult.routingPath.provider).toBe("bedrock");
      expect(mcpResult.routingPath.provider).toBe("bedrock");

      // Both should maintain AWS Bedrock compliance standards
      const directProviderResult =
        await complianceIntegration.performComplianceCheck(
          mockRequest,
          "bedrock",
          "test-bedrock-direct-provider"
        );

      const mcpProviderResult =
        await complianceIntegration.performComplianceCheck(
          mockRequest,
          "bedrock",
          "test-bedrock-mcp-provider"
        );

      expect(directProviderResult.allowed).toBe(true);
      expect(mcpProviderResult.allowed).toBe(true);
      expect(directProviderResult.complianceScore).toBeGreaterThan(80);
      expect(mcpProviderResult.complianceScore).toBeGreaterThan(80);
    });

    it("should validate Google AI compliance for MCP integration", async () => {
      const googlePath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const result = await gdprValidator.validateRoutingPathCompliance(
        googlePath,
        "test-google-mcp"
      );

      expect(result.routingPath.provider).toBe("google");

      const providerResult = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "google",
        "test-google-provider"
      );

      expect(providerResult.allowed).toBe(true);
      expect(providerResult.complianceScore).toBeGreaterThan(70);
    });

    it("should validate Meta AI compliance for MCP integration", async () => {
      const metaPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "meta",
        operationType: "background_tasks",
        priority: "low",
      };

      const result = await gdprValidator.validateRoutingPathCompliance(
        metaPath,
        "test-meta-mcp"
      );

      expect(result.routingPath.provider).toBe("meta");

      const providerResult = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "meta",
        "test-meta-provider"
      );

      expect(providerResult.allowed).toBe(true);
      expect(providerResult.complianceScore).toBeGreaterThan(80);
    });
  });

  describe("Operation Type Compliance Validation", () => {
    const operationTypes: Array<{
      type: HybridRoutingPath["operationType"];
      preferredRoute: "direct_bedrock" | "mcp_integration";
      priority: HybridRoutingPath["priority"];
    }> = [
      {
        type: "emergency",
        preferredRoute: "direct_bedrock",
        priority: "critical",
      },
      {
        type: "infrastructure",
        preferredRoute: "direct_bedrock",
        priority: "critical",
      },
      {
        type: "meta_monitor",
        preferredRoute: "direct_bedrock",
        priority: "high",
      },
      {
        type: "implementation",
        preferredRoute: "direct_bedrock",
        priority: "high",
      },
      {
        type: "kiro_communication",
        preferredRoute: "mcp_integration",
        priority: "medium",
      },
      {
        type: "standard_analysis",
        preferredRoute: "mcp_integration",
        priority: "medium",
      },
      {
        type: "background_tasks",
        preferredRoute: "mcp_integration",
        priority: "low",
      },
    ];

    operationTypes.forEach(({ type, preferredRoute, priority }) => {
      it(`should validate ${type} operations compliance on ${preferredRoute}`, async () => {
        const path: HybridRoutingPath = {
          routeType: preferredRoute,
          provider: preferredRoute === "direct_bedrock" ? "bedrock" : "google",
          operationType: type,
          priority,
        };

        const result = await gdprValidator.validateRoutingPathCompliance(
          path,
          `test-${type}-${preferredRoute}`
        );

        expect(result.routingPath.operationType).toBe(type);
        expect(result.routingPath.routeType).toBe(preferredRoute);
        expect(result.routingPath.priority).toBe(priority);

        // All operations should maintain basic compliance
        expect(result.dataProcessingCompliance).toBeDefined();
        expect(result.auditTrailCompliance).toBeDefined();
      });
    });
  });

  describe("Priority Level Compliance Validation", () => {
    const priorities: Array<HybridRoutingPath["priority"]> = [
      "critical",
      "high",
      "medium",
      "low",
    ];

    priorities.forEach((priority) => {
      it(`should validate ${priority} priority operations compliance`, async () => {
        const directPath: HybridRoutingPath = {
          routeType: "direct_bedrock",
          provider: "bedrock",
          operationType: "infrastructure",
          priority,
        };

        const mcpPath: HybridRoutingPath = {
          routeType: "mcp_integration",
          provider: "google",
          operationType: "standard_analysis",
          priority,
        };

        const directResult = await gdprValidator.validateRoutingPathCompliance(
          directPath,
          `test-${priority}-direct`
        );

        const mcpResult = await gdprValidator.validateRoutingPathCompliance(
          mcpPath,
          `test-${priority}-mcp`
        );

        expect(directResult.routingPath.priority).toBe(priority);
        expect(mcpResult.routingPath.priority).toBe(priority);

        // Higher priority operations should maintain stricter compliance
        if (priority === "critical") {
          expect(
            directResult.dataProcessingCompliance.euDataResidencyCompliant
          ).toBe(true);
          expect(directResult.auditTrailCompliance.auditLoggingEnabled).toBe(
            true
          );
        }
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid provider gracefully", async () => {
      const invalidPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "invalid" as Provider,
        operationType: "infrastructure",
        priority: "critical",
      };

      const result = await gdprValidator.validateRoutingPathCompliance(
        invalidPath,
        "test-invalid-provider"
      );

      expect(result.isCompliant).toBe(false);
      expect(result.complianceScore).toBe(0);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("should handle compliance check failures gracefully", async () => {
      const result = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "unknown" as Provider,
        "test-compliance-failure"
      );

      expect(result.allowed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.complianceScore).toBe(0);
    });

    it("should validate routing decision with compliance failures", async () => {
      const invalidPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "invalid" as Provider,
        operationType: "infrastructure",
        priority: "critical",
      };

      const result = await gdprValidator.validateBeforeRouting(
        invalidPath,
        "test-routing-failure"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("compliance");
    });
  });

  describe("Compliance Enforcement Integration", () => {
    it("should enforce compliance for direct Bedrock operations", async () => {
      await expect(
        complianceIntegration.enforceCompliance(
          mockRequest,
          "bedrock",
          "test-enforce-direct-bedrock"
        )
      ).resolves.not.toThrow();
    });

    it("should enforce compliance for MCP integration operations", async () => {
      await expect(
        complianceIntegration.enforceCompliance(
          mockRequest,
          "google",
          "test-enforce-mcp-integration"
        )
      ).resolves.not.toThrow();
    });

    it("should block non-compliant operations", async () => {
      await expect(
        complianceIntegration.enforceCompliance(
          mockRequest,
          "unknown" as Provider,
          "test-enforce-non-compliant"
        )
      ).rejects.toThrow("Compliance violation prevents AI request");
    });
  });

  describe("Compliance Summary and Reporting", () => {
    it("should generate compliance summary for both routing paths", async () => {
      const summary = await complianceIntegration.getComplianceSummary();

      expect(summary.overallCompliance).toMatch(
        /compliant|warning|non_compliant/
      );
      expect(summary.providers).toHaveLength(3);
      expect(
        summary.providers.every(
          (p) =>
            p.provider &&
            typeof p.compliant === "boolean" &&
            typeof p.score === "number"
        )
      ).toBe(true);
      expect(typeof summary.recentViolations).toBe("number");
      expect(typeof summary.pendingActions).toBe("number");
    });

    it("should provide actionable recommendations for compliance improvements", async () => {
      const report = await gdprValidator.generateHybridComplianceReport();

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.criticalIssues)).toBe(true);
      expect(Array.isArray(report.nextActions)).toBe(true);

      report.nextActions.forEach((action) => {
        expect(typeof action.action).toBe("string");
        expect(["low", "medium", "high", "critical"]).toContain(
          action.priority
        );
        expect(action.dueDate).toBeInstanceOf(Date);
        expect(["direct_bedrock", "mcp_integration", "both"]).toContain(
          action.routingPath
        );
      });
    });
  });

  describe("Requirement Validation", () => {
    it("should meet Requirement 7: Compliance and Security Maintenance", async () => {
      // Test that all existing GDPR compliance measures remain intact
      const directPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };

      const mcpPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const directResult = await gdprValidator.validateRoutingPathCompliance(
        directPath,
        "test-req7-direct"
      );

      const mcpResult = await gdprValidator.validateRoutingPathCompliance(
        mcpPath,
        "test-req7-mcp"
      );

      // GDPR compliance measures should remain intact
      expect(
        directResult.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe(true);
      expect(mcpResult.dataProcessingCompliance.euDataResidencyCompliant).toBe(
        true
      );

      // Audit trails should capture all activities
      expect(directResult.auditTrailCompliance.auditLoggingEnabled).toBe(true);
      expect(mcpResult.auditTrailCompliance.auditLoggingEnabled).toBe(true);
    });

    it("should meet Requirement 5: Controlled Integration with Existing Systems", async () => {
      // Test that compliance integration works with existing systems
      const bedrockResult = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "bedrock",
        "test-req5-bedrock"
      );

      const googleResult = await complianceIntegration.performComplianceCheck(
        mockRequest,
        "google",
        "test-req5-google"
      );

      // Existing compliance systems should continue to function
      expect(bedrockResult.allowed).toBe(true);
      expect(googleResult.allowed).toBe(true);
      expect(bedrockResult.complianceScore).toBeGreaterThan(80);
      expect(googleResult.complianceScore).toBeGreaterThan(70);
    });
  });
});
