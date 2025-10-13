/**
 * Provider Agreement Compliance System Tests
 */

import { ProviderAgreementCompliance } from "../provider-agreement-compliance";
import { Provider } from "../types";

// Mock the audit trail system
jest.mock("../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("ProviderAgreementCompliance", () => {
  let compliance: ProviderAgreementCompliance;

  beforeEach(() => {
    compliance = new ProviderAgreementCompliance();
  });

  describe("Provider Agreement Verification", () => {
    it("should verify compliant provider", async () => {
      const result = await compliance.verifyProviderCompliance("bedrock");

      expect(result.compliant).toBe(true);
      expect(result.agreement).toBeDefined();
      expect(result.agreement?.noTrainingOnCustomerData).toBe(true);
      expect(result.agreement?.dataProcessingAgreement).toBe(true);
      expect(result.agreement?.gdprCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should detect non-existent provider agreement", async () => {
      const result = await compliance.verifyProviderCompliance(
        "unknown" as Provider
      );

      expect(result.compliant).toBe(false);
      expect(result.agreement).toBeUndefined();
      expect(result.violations).toContain(
        "No agreement found for provider: unknown"
      );
    });

    it("should warn about old verification dates", async () => {
      // Update agreement with old verification date
      await compliance.updateAgreementVerification(
        "google",
        "verified",
        "contract_review"
      );

      // Manually set old date for testing
      const agreement = compliance.getAgreement("google");
      if (agreement) {
        agreement.lastVerified = new Date(
          Date.now() - 100 * 24 * 60 * 60 * 1000
        ).toISOString(); // 100 days ago
      }

      const result = await compliance.verifyProviderCompliance("google");

      expect(result.compliant).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Agreement not verified in");
    });
  });

  describe("Agreement Management", () => {
    it("should get all provider agreements", () => {
      const agreements = compliance.getAllAgreements();

      expect(agreements).toHaveLength(3);
      expect(agreements.map((a) => a.providerId)).toContain("bedrock");
      expect(agreements.map((a) => a.providerId)).toContain("google");
      expect(agreements.map((a) => a.providerId)).toContain("meta");
    });

    it("should get specific provider agreement", () => {
      const agreement = compliance.getAgreement("bedrock");

      expect(agreement).toBeDefined();
      expect(agreement?.providerId).toBe("bedrock");
      expect(agreement?.providerName).toBe("Amazon Web Services (Bedrock)");
      expect(agreement?.noTrainingOnCustomerData).toBe(true);
    });

    it("should update agreement verification", async () => {
      await compliance.updateAgreementVerification(
        "bedrock",
        "verified",
        "api_confirmation",
        "API endpoint confirmed no-training policy"
      );

      const agreement = compliance.getAgreement("bedrock");
      expect(agreement?.verificationStatus).toBe("verified");
      expect(agreement?.verificationMethod).toBe("api_confirmation");
      expect(agreement?.auditTrail.length).toBeGreaterThan(1);
    });
  });

  describe("Violation Management", () => {
    it("should record compliance violation", async () => {
      const violationId = await compliance.recordViolation({
        providerId: "google",
        violationType: "training_detected",
        severity: "high",
        description: "Detected potential training on customer data",
        evidence: "API response indicated model training",
      });

      expect(violationId).toBeDefined();
      expect(violationId).toMatch(/^violation-/);

      const violations = compliance.getAllViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].providerId).toBe("google");
      expect(violations[0].violationType).toBe("training_detected");
      expect(violations[0].status).toBe("open");
    });

    it("should resolve violation", async () => {
      const violationId = await compliance.recordViolation({
        providerId: "meta",
        violationType: "data_retention",
        severity: "medium",
        description: "Data retained longer than agreed",
        evidence: "Audit log shows 95-day retention",
      });

      await compliance.resolveViolation(
        violationId,
        "Provider confirmed data deletion and updated retention policy"
      );

      const violations = compliance.getAllViolations();
      const resolvedViolation = violations.find(
        (v) => v.violationId === violationId
      );

      expect(resolvedViolation?.status).toBe("resolved");
      expect(resolvedViolation?.resolutionNotes).toContain(
        "Provider confirmed data deletion"
      );
      expect(resolvedViolation?.resolutionDate).toBeDefined();
    });

    it("should throw error when resolving non-existent violation", async () => {
      await expect(
        compliance.resolveViolation("non-existent-id", "Test resolution")
      ).rejects.toThrow("Violation not found: non-existent-id");
    });
  });

  describe("Compliance Reporting", () => {
    beforeEach(async () => {
      // Add some test violations
      await compliance.recordViolation({
        providerId: "google",
        violationType: "training_detected",
        severity: "high",
        description: "Test violation 1",
        evidence: "Test evidence 1",
      });

      await compliance.recordViolation({
        providerId: "meta",
        violationType: "data_retention",
        severity: "medium",
        description: "Test violation 2",
        evidence: "Test evidence 2",
      });
    });

    it("should generate comprehensive compliance report", async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const report = await compliance.generateComplianceReport(
        startDate,
        endDate
      );

      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.reportingPeriod.start).toBe(startDate);
      expect(report.reportingPeriod.end).toBe(endDate);

      // Overall compliance
      expect(report.overallCompliance).toMatch(
        /compliant|non_compliant|warning/
      );
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);

      // Provider status
      expect(report.providers).toHaveLength(3);
      expect(
        report.providers.every((p) => p.providerId && p.lastVerified)
      ).toBe(true);

      // Violations summary
      expect(report.violations.total).toBeGreaterThanOrEqual(2);
      expect(report.violations.byType).toHaveProperty("training_detected");
      expect(report.violations.byType).toHaveProperty("data_retention");
      expect(report.violations.bySeverity).toHaveProperty("high");
      expect(report.violations.bySeverity).toHaveProperty("medium");

      // Recommendations and actions
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.nextActions)).toBe(true);
    });

    it("should calculate correct compliance score", async () => {
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const report = await compliance.generateComplianceReport(
        startDate,
        endDate
      );

      // With 3 providers all having valid agreements, score should be 100%
      expect(report.complianceScore).toBe(100);
      expect(report.overallCompliance).toBe("compliant");
    });

    it("should identify expiring agreements", async () => {
      // Set an agreement to expire soon
      const agreement = compliance.getAgreement("bedrock");
      if (agreement) {
        agreement.expiryDate = new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString(); // 60 days from now
      }

      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const report = await compliance.generateComplianceReport(
        startDate,
        endDate
      );

      expect(report.nextActions.length).toBeGreaterThan(0);
      expect(
        report.nextActions.some(
          (action) =>
            action.action.includes("Renew agreement") &&
            action.priority === "high"
        )
      ).toBe(true);
    });
  });

  describe("Provider-Specific Compliance", () => {
    it("should validate AWS Bedrock compliance", async () => {
      const result = await compliance.verifyProviderCompliance("bedrock");

      expect(result.compliant).toBe(true);
      expect(result.agreement?.noTrainingOnCustomerData).toBe(true);
      expect(result.agreement?.gdprCompliant).toBe(true);
      expect(result.agreement?.euDataResidency).toBe(true);
      expect(result.agreement?.agreementUrl).toContain("aws.amazon.com");
    });

    it("should validate Google AI compliance", async () => {
      const result = await compliance.verifyProviderCompliance("google");

      expect(result.compliant).toBe(true);
      expect(result.agreement?.noTrainingOnCustomerData).toBe(true);
      expect(result.agreement?.gdprCompliant).toBe(true);
      expect(result.agreement?.euDataResidency).toBe(true);
      expect(result.agreement?.agreementUrl).toContain("cloud.google.com");
    });

    it("should validate Meta AI compliance", async () => {
      const result = await compliance.verifyProviderCompliance("meta");

      expect(result.compliant).toBe(true);
      expect(result.agreement?.noTrainingOnCustomerData).toBe(true);
      expect(result.agreement?.gdprCompliant).toBe(true);
      expect(result.agreement?.euDataResidency).toBe(false); // Meta processes in US
      expect(result.agreement?.agreementUrl).toContain(
        "developers.facebook.com"
      );
    });
  });

  describe("Audit Trail Integration", () => {
    it("should maintain audit trail for agreement changes", async () => {
      const initialAgreement = compliance.getAgreement("bedrock");
      const initialAuditLength = initialAgreement?.auditTrail.length || 0;

      await compliance.updateAgreementVerification(
        "bedrock",
        "verified",
        "certification",
        "SOC 2 Type II certification reviewed"
      );

      const updatedAgreement = compliance.getAgreement("bedrock");
      expect(updatedAgreement?.auditTrail.length).toBe(initialAuditLength + 1);

      const latestAudit =
        updatedAgreement?.auditTrail[updatedAgreement.auditTrail.length - 1];
      expect(latestAudit?.action).toBe("verified");
      expect(latestAudit?.evidence).toContain("SOC 2 Type II");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid provider gracefully", async () => {
      const result = await compliance.verifyProviderCompliance(
        "invalid" as Provider
      );

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain(
        "No agreement found for provider: invalid"
      );
    });

    it("should throw error for invalid agreement update", async () => {
      await expect(
        compliance.updateAgreementVerification(
          "invalid" as Provider,
          "verified",
          "contract_review"
        )
      ).rejects.toThrow("No agreement found for provider: invalid");
    });
  });

  describe("DoD Criteria Validation", () => {
    it("should meet DoD: All providers have no-training agreements", () => {
      const agreements = compliance.getAllAgreements();

      expect(agreements.every((a) => a.noTrainingOnCustomerData)).toBe(true);
      expect(agreements.every((a) => a.dataProcessingAgreement)).toBe(true);
      expect(agreements.every((a) => a.gdprCompliant)).toBe(true);
    });

    it("should meet DoD: Comprehensive audit trail", () => {
      const agreements = compliance.getAllAgreements();

      expect(agreements.every((a) => a.auditTrail.length > 0)).toBe(true);
      expect(
        agreements.every((a) =>
          a.auditTrail.every(
            (audit) =>
              audit.timestamp &&
              audit.action &&
              audit.details &&
              audit.performedBy
          )
        )
      ).toBe(true);
    });

    it("should meet DoD: Violation tracking and resolution", async () => {
      const violationId = await compliance.recordViolation({
        providerId: "bedrock",
        violationType: "training_detected",
        severity: "critical",
        description: "Test critical violation",
        evidence: "Test evidence",
      });

      const violations = compliance.getAllViolations();
      const violation = violations.find((v) => v.violationId === violationId);

      expect(violation).toBeDefined();
      expect(violation?.status).toBe("open");
      expect(violation?.severity).toBe("critical");

      await compliance.resolveViolation(violationId, "Test resolution");

      const resolvedViolations = compliance.getAllViolations();
      const resolvedViolation = resolvedViolations.find(
        (v) => v.violationId === violationId
      );

      expect(resolvedViolation?.status).toBe("resolved");
    });

    it("should meet DoD: Compliance reporting functionality", async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const report = await compliance.generateComplianceReport(
        startDate,
        endDate
      );

      expect(report.reportId).toBeDefined();
      expect(report.overallCompliance).toMatch(
        /compliant|non_compliant|warning/
      );
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.providers.length).toBe(3);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.nextActions)).toBe(true);
    });
  });
});
