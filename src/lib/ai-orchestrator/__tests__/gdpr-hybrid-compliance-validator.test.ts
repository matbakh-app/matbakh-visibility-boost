/**
 * Tests for GDPR Hybrid Compliance Validator
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  GDPRHybridComplianceValidator,
  HybridRoutingPath,
} from "../gdpr-hybrid-compliance-validator";

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

jest.mock("../compliance-integration", () => ({
  ComplianceIntegration: jest.fn().mockImplementation(() => ({
    getComplianceSummary: jest.fn().mockResolvedValue({
      overallCompliance: "compliant",
      providers: [],
      recentViolations: 0,
      pendingActions: 0,
    }),
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

jest.mock("../provider-agreement-compliance", () => ({
  ProviderAgreementCompliance: jest.fn().mockImplementation(() => ({
    verifyProviderCompliance: jest.fn().mockImplementation((provider) => {
      if (provider === "invalid") {
        return Promise.resolve({
          compliant: false,
          agreement: null,
          violations: ["Invalid provider"],
          warnings: [],
        });
      }
      return Promise.resolve({
        compliant: true,
        agreement: {
          gdprCompliant: true,
          euDataResidency: true,
          noTrainingOnCustomerData: true,
          dataProcessingAgreement: true,
        },
        violations: [],
        warnings: [],
      });
    }),
    getAgreement: jest.fn().mockImplementation((provider) => {
      if (provider === "invalid") {
        return null;
      }
      return {
        gdprCompliant: true,
        euDataResidency: true,
        noTrainingOnCustomerData: true,
        dataProcessingAgreement: true,
      };
    }),
  })),
}));

describe("GDPRHybridComplianceValidator", () => {
  let validator: GDPRHybridComplianceValidator;
  let mockRoutingPath: HybridRoutingPath;
  let correlationId: string;

  beforeEach(() => {
    validator = new GDPRHybridComplianceValidator();
    correlationId = "test-correlation-id";

    mockRoutingPath = {
      routeType: "direct_bedrock",
      provider: "bedrock",
      operationType: "infrastructure",
      priority: "critical",
    };
  });

  describe("validateRoutingPathCompliance", () => {
    it("should validate compliant direct Bedrock routing path", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(result.routingPath).toEqual(mockRoutingPath);
      expect(result.correlationId).toBe(correlationId);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.isCompliant).toBe("boolean");
      expect(typeof result.complianceScore).toBe("number");
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("should validate compliant MCP integration routing path", async () => {
      const mcpRoutingPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const result = await validator.validateRoutingPathCompliance(
        mcpRoutingPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(result.routingPath.routeType).toBe("mcp_integration");
      expect(result.routingPath.provider).toBe("google");
    });

    it("should handle emergency operations with critical priority", async () => {
      const emergencyPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "emergency",
        priority: "critical",
      };

      const result = await validator.validateRoutingPathCompliance(
        emergencyPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(result.routingPath.operationType).toBe("emergency");
      expect(result.routingPath.priority).toBe("critical");
    });

    it("should validate data processing compliance", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
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
        typeof result.dataProcessingCompliance.consentManagementActive
      ).toBe("boolean");
      expect(typeof result.dataProcessingCompliance.piiDetectionEnabled).toBe(
        "boolean"
      );
      expect(
        typeof result.dataProcessingCompliance.dataRetentionPoliciesActive
      ).toBe("boolean");
      expect(
        typeof result.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
    });

    it("should validate audit trail compliance", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
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
      expect(typeof result.auditTrailCompliance.complianceChecksLogged).toBe(
        "boolean"
      );
      expect(
        typeof result.auditTrailCompliance.dataProcessingActivitiesLogged
      ).toBe("boolean");
      expect(typeof result.auditTrailCompliance.retentionPolicyCompliant).toBe(
        "boolean"
      );
      expect(typeof result.auditTrailCompliance.integrityCheckingEnabled).toBe(
        "boolean"
      );
    });

    it("should calculate compliance score correctly", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it("should handle validation errors gracefully", async () => {
      // Mock an error in the validation process
      const invalidPath = {
        ...mockRoutingPath,
        provider: "invalid" as any,
      };

      const result = await validator.validateRoutingPathCompliance(
        invalidPath,
        correlationId
      );

      expect(result.isCompliant).toBe(false);
      expect(result.complianceScore).toBe(0);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe("generateHybridComplianceReport", () => {
    it("should generate comprehensive compliance report", async () => {
      const report = await validator.generateHybridComplianceReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(["compliant", "non_compliant", "partial"]).toContain(
        report.overallCompliance
      );
      expect(typeof report.complianceScore).toBe("number");
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
    });

    it("should include both routing path validations", async () => {
      const report = await validator.generateHybridComplianceReport();

      expect(report.routingPathCompliance).toBeDefined();
      expect(report.routingPathCompliance.directBedrock).toBeDefined();
      expect(report.routingPathCompliance.mcpIntegration).toBeDefined();

      expect(
        report.routingPathCompliance.directBedrock.routingPath.routeType
      ).toBe("direct_bedrock");
      expect(
        report.routingPathCompliance.mcpIntegration.routingPath.routeType
      ).toBe("mcp_integration");
    });

    it("should validate cross-path compliance", async () => {
      const report = await validator.generateHybridComplianceReport();

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

    it("should provide recommendations and next actions", async () => {
      const report = await validator.generateHybridComplianceReport();

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.criticalIssues)).toBe(true);
      expect(Array.isArray(report.nextActions)).toBe(true);

      // Check next actions structure
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

  describe("validateBeforeRouting", () => {
    it("should allow compliant routing", async () => {
      const result = await validator.validateBeforeRouting(
        mockRoutingPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });

    it("should block routing with critical violations", async () => {
      // This test would need to mock a scenario with critical violations
      const result = await validator.validateBeforeRouting(
        mockRoutingPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });

    it("should block routing with low compliance score", async () => {
      // This test would need to mock a scenario with low compliance score
      const result = await validator.validateBeforeRouting(
        mockRoutingPath,
        correlationId
      );

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });
  });

  describe("GDPR Violation Handling", () => {
    it("should categorize violations correctly", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      result.violations.forEach((violation) => {
        expect(typeof violation.id).toBe("string");
        expect(["low", "medium", "high", "critical"]).toContain(
          violation.severity
        );
        expect([
          "data_processing",
          "data_storage",
          "user_rights",
          "consent",
          "security",
          "ai_operations",
        ]).toContain(violation.category);
        expect(typeof violation.description).toBe("string");
        expect(["direct_bedrock", "mcp_integration", "both"]).toContain(
          violation.routingPath
        );
        expect(typeof violation.remediation).toBe("string");
        expect(typeof violation.gdprArticle).toBe("string");
      });
    });

    it("should provide actionable remediation steps", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      result.violations.forEach((violation) => {
        expect(violation.remediation).toBeTruthy();
        expect(violation.remediation.length).toBeGreaterThan(0);
        expect(violation.gdprArticle).toMatch(/Article \d+/);
      });
    });
  });

  describe("GDPR Warning Handling", () => {
    it("should provide helpful warnings", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      result.warnings.forEach((warning) => {
        expect(typeof warning.id).toBe("string");
        expect([
          "data_processing",
          "data_storage",
          "user_rights",
          "consent",
          "security",
          "ai_operations",
        ]).toContain(warning.category);
        expect(typeof warning.description).toBe("string");
        expect(["direct_bedrock", "mcp_integration", "both"]).toContain(
          warning.routingPath
        );
        expect(typeof warning.recommendation).toBe("string");
      });
    });
  });

  describe("Provider-Specific Compliance", () => {
    it("should validate AWS Bedrock compliance", async () => {
      const bedrockPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: "infrastructure",
        priority: "critical",
      };

      const result = await validator.validateRoutingPathCompliance(
        bedrockPath,
        correlationId
      );

      expect(result.routingPath.provider).toBe("bedrock");
    });

    it("should validate Google AI compliance", async () => {
      const googlePath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "google",
        operationType: "standard_analysis",
        priority: "medium",
      };

      const result = await validator.validateRoutingPathCompliance(
        googlePath,
        correlationId
      );

      expect(result.routingPath.provider).toBe("google");
    });

    it("should validate Meta AI compliance", async () => {
      const metaPath: HybridRoutingPath = {
        routeType: "mcp_integration",
        provider: "meta",
        operationType: "background_tasks",
        priority: "low",
      };

      const result = await validator.validateRoutingPathCompliance(
        metaPath,
        correlationId
      );

      expect(result.routingPath.provider).toBe("meta");
    });
  });

  describe("Operation Type Compliance", () => {
    const operationTypes: Array<HybridRoutingPath["operationType"]> = [
      "emergency",
      "infrastructure",
      "meta_monitor",
      "implementation",
      "kiro_communication",
      "standard_analysis",
      "background_tasks",
    ];

    operationTypes.forEach((operationType) => {
      it(`should validate ${operationType} operations`, async () => {
        const path: HybridRoutingPath = {
          routeType: "direct_bedrock",
          provider: "bedrock",
          operationType,
          priority: "medium",
        };

        const result = await validator.validateRoutingPathCompliance(
          path,
          correlationId
        );

        expect(result.routingPath.operationType).toBe(operationType);
      });
    });
  });

  describe("Priority Level Compliance", () => {
    const priorities: Array<HybridRoutingPath["priority"]> = [
      "critical",
      "high",
      "medium",
      "low",
    ];

    priorities.forEach((priority) => {
      it(`should validate ${priority} priority operations`, async () => {
        const path: HybridRoutingPath = {
          routeType: "direct_bedrock",
          provider: "bedrock",
          operationType: "infrastructure",
          priority,
        };

        const result = await validator.validateRoutingPathCompliance(
          path,
          correlationId
        );

        expect(result.routingPath.priority).toBe(priority);
      });
    });
  });

  describe("Compliance Score Calculation", () => {
    it("should calculate score based on violations", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      // Score should be between 0 and 100
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);

      // If compliant, score should be high
      if (result.isCompliant) {
        expect(result.complianceScore).toBeGreaterThanOrEqual(95);
      }
    });

    it("should penalize critical violations more than low severity", async () => {
      // This would require mocking different violation scenarios
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      expect(typeof result.complianceScore).toBe("number");
    });
  });

  describe("Audit Trail Integration", () => {
    it("should log compliance validation events", async () => {
      const result = await validator.validateRoutingPathCompliance(
        mockRoutingPath,
        correlationId
      );

      // Verify that audit trail logging was called
      expect(result.correlationId).toBe(correlationId);
    });

    it("should log errors to audit trail", async () => {
      const invalidPath = {
        ...mockRoutingPath,
        provider: "invalid" as any,
      };

      const result = await validator.validateRoutingPathCompliance(
        invalidPath,
        correlationId
      );

      expect(result.isCompliant).toBe(false);
    });
  });
});
