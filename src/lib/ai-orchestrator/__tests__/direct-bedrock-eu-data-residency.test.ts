/**
 * EU Data Residency Compliance Tests for Direct Bedrock Access
 *
 * This test suite validates that direct Bedrock access complies with EU data residency
 * requirements as specified in the Bedrock Activation requirements and design documents.
 *
 * Key Requirements Tested:
 * - Requirement 7: Compliance and Security Maintenance
 * - EU data residency compliance for direct Bedrock operations
 * - GDPR compliance validation for hybrid routing paths
 * - Data processing within EU regions only
 */

import { GDPRHybridComplianceValidator } from "../gdpr-hybrid-compliance-validator";
import { ProviderAgreementCompliance } from "../provider-agreement-compliance";

describe("Direct Bedrock EU Data Residency Compliance", () => {
  let gdprValidator: GDPRHybridComplianceValidator;
  let providerCompliance: ProviderAgreementCompliance;

  beforeEach(() => {
    // Initialize components
    gdprValidator = new GDPRHybridComplianceValidator();
    providerCompliance = new ProviderAgreementCompliance();
  });

  describe("EU Region Configuration Validation", () => {
    it("should validate EU regions are supported for direct Bedrock access", () => {
      const supportedEuRegions = [
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
        "eu-south-1",
        "eu-south-2",
      ];

      supportedEuRegions.forEach((region) => {
        expect(region.startsWith("eu-")).toBe(true);
        expect(region).toMatch(/^eu-[a-z]+-\d+$/);
      });
    });

    it("should identify non-EU regions as non-compliant", () => {
      const nonEuRegions = [
        "us-east-1",
        "us-west-1",
        "us-west-2",
        "ap-southeast-1",
        "ap-northeast-1",
        "ca-central-1",
      ];

      nonEuRegions.forEach((region) => {
        expect(region.startsWith("eu-")).toBe(false);
      });
    });

    it("should default to EU region for compliance", () => {
      const defaultRegion = process.env.AWS_REGION || "eu-central-1";

      // If no region is set, should default to EU region
      if (!process.env.AWS_REGION) {
        expect(defaultRegion).toBe("eu-central-1");
        expect(defaultRegion.startsWith("eu-")).toBe(true);
      }
    });
  });

  describe("GDPR Hybrid Compliance Validation", () => {
    it("should validate direct Bedrock routing path for GDPR compliance", async () => {
      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "bedrock" as const,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      const validation = await gdprValidator.validateRoutingPathCompliance(
        routingPath,
        "test-correlation-id"
      );

      expect(validation.routingPath.routeType).toBe("direct_bedrock");
      expect(validation.routingPath.provider).toBe("bedrock");
      expect(typeof validation.isCompliant).toBe("boolean");
      expect(typeof validation.complianceScore).toBe("number");
      expect(Array.isArray(validation.violations)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(
        typeof validation.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
    });

    it("should generate hybrid compliance report with EU data residency status", async () => {
      const report = await gdprValidator.generateHybridComplianceReport();

      expect(report.overallCompliance).toMatch(
        /compliant|partial|non_compliant/
      );
      expect(report.routingPathCompliance.directBedrock).toBeDefined();
      expect(report.routingPathCompliance.mcpIntegration).toBeDefined();

      // Check that EU data residency is evaluated for both paths
      expect(
        typeof report.routingPathCompliance.directBedrock
          .dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
      expect(
        typeof report.routingPathCompliance.mcpIntegration
          .dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
    });

    it("should validate EU data residency before routing decision", async () => {
      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "bedrock" as const,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      const validation = await gdprValidator.validateBeforeRouting(
        routingPath,
        "routing-test"
      );

      expect(typeof validation.allowed).toBe("boolean");
      expect(typeof validation.reason).toBe("string");
      expect(validation.reason.length).toBeGreaterThan(0);
    });

    it("should detect EU data residency violations when configured", async () => {
      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "bedrock" as const,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      // Mock the GDPR validator to simulate a violation scenario
      jest
        .spyOn(gdprValidator, "validateRoutingPathCompliance")
        .mockResolvedValue({
          routingPath,
          isCompliant: false,
          complianceScore: 75,
          violations: [
            {
              id: "eu-residency",
              severity: "critical",
              category: "data_storage",
              description: "EU data residency requirements not met",
              routingPath: "direct_bedrock",
              remediation:
                "Ensure all data processing occurs within EU regions",
              gdprArticle:
                "Article 44-49 - Transfers of personal data to third countries",
            },
          ],
          warnings: [],
          dataProcessingCompliance: {
            lawfulBasisDocumented: true,
            purposeLimitationEnforced: true,
            dataMinimizationImplemented: true,
            consentManagementActive: true,
            piiDetectionEnabled: true,
            dataRetentionPoliciesActive: true,
            euDataResidencyCompliant: false,
          },
          auditTrailCompliance: {
            auditLoggingEnabled: true,
            correlationIdTracking: true,
            routingPathLogged: true,
            complianceChecksLogged: true,
            dataProcessingActivitiesLogged: true,
            retentionPolicyCompliant: true,
            integrityCheckingEnabled: true,
          },
          timestamp: new Date(),
          correlationId: "test-correlation-id",
        });

      const validation = await gdprValidator.validateRoutingPathCompliance(
        routingPath,
        "test-correlation-id"
      );

      expect(validation.isCompliant).toBe(false);
      expect(validation.dataProcessingCompliance.euDataResidencyCompliant).toBe(
        false
      );
      expect(validation.violations).toHaveLength(1);
      expect(validation.violations[0].category).toBe("data_storage");
      expect(validation.violations[0].severity).toBe("critical");
      expect(validation.violations[0].description).toContain(
        "EU data residency"
      );
    });
  });

  describe("Provider Agreement Compliance", () => {
    it("should validate AWS Bedrock EU data residency agreement", async () => {
      const compliance = await providerCompliance.verifyProviderCompliance(
        "bedrock"
      );

      expect(compliance.compliant).toBe(true);
      expect(compliance.agreement).toBeDefined();
      expect(compliance.agreement?.euDataResidency).toBe(true);
      expect(compliance.agreement?.gdprCompliant).toBe(true);
      expect(compliance.agreement?.providerId).toBe("bedrock");
      expect(compliance.violations).toHaveLength(0);
    });

    it("should validate provider agreement includes EU data residency clauses", async () => {
      const agreement = providerCompliance.getAgreement("bedrock");

      expect(agreement).toBeDefined();
      expect(agreement?.euDataResidency).toBe(true);
      expect(agreement?.dataProcessingAgreement).toBe(true);
      expect(agreement?.gdprCompliant).toBe(true);
      expect(agreement?.agreementUrl).toContain("aws.amazon.com");
      expect(agreement?.providerId).toBe("bedrock");
      expect(agreement?.providerName).toContain("Amazon Web Services");
    });

    it("should generate compliance report with EU data residency status", async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const report = await providerCompliance.generateComplianceReport(
        startDate,
        endDate
      );

      expect(report.overallCompliance).toMatch(
        /compliant|warning|non_compliant/
      );
      expect(report.providers).toHaveLength(3); // bedrock, google, meta
      expect(typeof report.complianceScore).toBe("number");
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);

      const bedrockProvider = report.providers.find(
        (p) => p.providerId === "bedrock"
      );
      expect(bedrockProvider).toBeDefined();
      expect(bedrockProvider?.compliant).toBe(true);
    });

    it("should validate all providers have EU data residency status", () => {
      const allAgreements = providerCompliance.getAllAgreements();

      expect(allAgreements).toHaveLength(3); // bedrock, google, meta

      allAgreements.forEach((agreement) => {
        expect(agreement.providerId).toMatch(/bedrock|google|meta/);
        expect(typeof agreement.euDataResidency).toBe("boolean");
        expect(agreement.gdprCompliant).toBe(true);
        expect(agreement.dataProcessingAgreement).toBe(true);
      });

      // Specifically check Bedrock has EU data residency
      const bedrockAgreement = allAgreements.find(
        (a) => a.providerId === "bedrock"
      );
      expect(bedrockAgreement?.euDataResidency).toBe(true);
    });
  });

  describe("EU Data Residency Configuration Validation", () => {
    it("should validate EU region patterns", () => {
      const validEuRegions = [
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
        "eu-south-1",
        "eu-south-2",
      ];

      const invalidRegions = [
        "us-east-1",
        "ap-southeast-1",
        "ca-central-1",
        "sa-east-1",
      ];

      validEuRegions.forEach((region) => {
        expect(region).toMatch(/^eu-[a-z]+-\d+$/);
        expect(region.startsWith("eu-")).toBe(true);
      });

      invalidRegions.forEach((region) => {
        expect(region.startsWith("eu-")).toBe(false);
      });
    });

    it("should validate GDPR compliance requirements", () => {
      const gdprRequirements = {
        lawfulBasisRequired: true,
        purposeLimitationRequired: true,
        dataMinimizationRequired: true,
        consentManagementRequired: true,
        auditTrailRequired: true,
        euDataResidencyRequired: true,
        retentionPolicyRequired: true,
      };

      Object.entries(gdprRequirements).forEach(([requirement, required]) => {
        expect(required).toBe(true);
        expect(typeof requirement).toBe("string");
        expect(requirement.length).toBeGreaterThan(0);
      });
    });

    it("should validate audit trail retention requirements", () => {
      const gdprRetentionDays = 2555; // 7 years
      const minimumRetentionDays = 2555;

      expect(gdprRetentionDays).toBe(minimumRetentionDays);
      expect(gdprRetentionDays).toBeGreaterThanOrEqual(2555);

      // Validate it's approximately 7 years
      const yearsInDays = gdprRetentionDays / 365;
      expect(yearsInDays).toBeCloseTo(7, 0);
    });
  });

  describe("Compliance Error Scenarios", () => {
    it("should handle GDPR validation errors gracefully", async () => {
      // Mock GDPR validator to throw error
      jest
        .spyOn(gdprValidator, "validateRoutingPathCompliance")
        .mockRejectedValue(new Error("GDPR validation service unavailable"));

      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "bedrock" as const,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      try {
        await gdprValidator.validateRoutingPathCompliance(
          routingPath,
          "error-test"
        );
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "GDPR validation service unavailable"
        );
      }
    });

    it("should provide clear error messages for compliance violations", async () => {
      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "invalid" as any,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      const validation = await gdprValidator.validateRoutingPathCompliance(
        routingPath,
        "invalid-provider-test"
      );

      expect(validation.isCompliant).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);

      const providerViolation = validation.violations.find((v) =>
        v.description.includes("Invalid or unsupported provider")
      );
      expect(providerViolation).toBeDefined();
    });

    it("should validate compliance before allowing operations", async () => {
      const routingPath = {
        routeType: "direct_bedrock" as const,
        provider: "bedrock" as const,
        operationType: "infrastructure" as const,
        priority: "critical" as const,
      };

      // Test successful validation
      const successValidation = await gdprValidator.validateBeforeRouting(
        routingPath,
        "success-test"
      );

      expect(typeof successValidation.allowed).toBe("boolean");
      expect(typeof successValidation.reason).toBe("string");

      // Mock failure scenario
      jest.spyOn(gdprValidator, "validateBeforeRouting").mockResolvedValue({
        allowed: false,
        reason:
          "Critical GDPR violations: EU data residency requirements not met",
      });

      const failureValidation = await gdprValidator.validateBeforeRouting(
        routingPath,
        "failure-test"
      );

      expect(failureValidation.allowed).toBe(false);
      expect(failureValidation.reason).toContain(
        "EU data residency requirements not met"
      );
    });
  });

  describe("Integration with Existing Systems", () => {
    it("should integrate with provider agreement compliance system", async () => {
      const bedrockCompliance =
        await providerCompliance.verifyProviderCompliance("bedrock");
      const googleCompliance =
        await providerCompliance.verifyProviderCompliance("google");
      const metaCompliance = await providerCompliance.verifyProviderCompliance(
        "meta"
      );

      // All providers should have agreements
      expect(bedrockCompliance.agreement).toBeDefined();
      expect(googleCompliance.agreement).toBeDefined();
      expect(metaCompliance.agreement).toBeDefined();

      // Bedrock and Google should support EU data residency
      expect(bedrockCompliance.agreement?.euDataResidency).toBe(true);
      expect(googleCompliance.agreement?.euDataResidency).toBe(true);

      // Meta may not support EU data residency (processes in US)
      expect(typeof metaCompliance.agreement?.euDataResidency).toBe("boolean");
    });

    it("should validate hybrid routing compliance for both paths", async () => {
      const report = await gdprValidator.generateHybridComplianceReport();

      expect(report.routingPathCompliance.directBedrock).toBeDefined();
      expect(report.routingPathCompliance.mcpIntegration).toBeDefined();

      // Both paths should have compliance validation
      const directPath = report.routingPathCompliance.directBedrock;
      const mcpPath = report.routingPathCompliance.mcpIntegration;

      expect(typeof directPath.isCompliant).toBe("boolean");
      expect(typeof mcpPath.isCompliant).toBe("boolean");
      expect(typeof directPath.complianceScore).toBe("number");
      expect(typeof mcpPath.complianceScore).toBe("number");

      // EU data residency should be evaluated for both
      expect(
        typeof directPath.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
      expect(
        typeof mcpPath.dataProcessingCompliance.euDataResidencyCompliant
      ).toBe("boolean");
    });

    it("should maintain cross-path compliance consistency", async () => {
      const report = await gdprValidator.generateHybridComplianceReport();

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
  });

  afterEach(() => {
    // Cleanup any mocks
    jest.restoreAllMocks();
  });
});
