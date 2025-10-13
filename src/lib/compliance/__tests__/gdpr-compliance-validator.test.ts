/**
 * GDPR Compliance Validator Tests
 *
 * Comprehensive test suite for GDPR compliance validation and reporting.
 */

import { GDPRComplianceValidator } from "../gdpr-compliance-validator";

describe("GDPRComplianceValidator", () => {
  let validator: GDPRComplianceValidator;

  beforeEach(() => {
    validator = new GDPRComplianceValidator();
  });

  describe("validateCompliance", () => {
    it("should generate a comprehensive compliance report", async () => {
      const report = await validator.validateCompliance();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.overallStatus).toMatch(
        /^(compliant|non_compliant|partial)$/
      );
      expect(report.totalChecks).toBeGreaterThan(0);
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
      expect(report.checks).toBeInstanceOf(Array);
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it("should include all required GDPR categories", async () => {
      const report = await validator.validateCompliance();
      const categories = Object.keys(report.summary);

      expect(categories).toContain("data_processing");
      expect(categories).toContain("data_storage");
      expect(categories).toContain("user_rights");
      expect(categories).toContain("consent");
      expect(categories).toContain("security");
      expect(categories).toContain("ai_operations");
    });

    it("should calculate compliance score correctly", async () => {
      const report = await validator.validateCompliance();
      const applicableChecks = report.totalChecks - report.notApplicableChecks;
      const expectedScore = Math.round(
        (report.compliantChecks / applicableChecks) * 100
      );

      expect(report.complianceScore).toBe(expectedScore);
    });

    it("should determine overall status correctly", async () => {
      const report = await validator.validateCompliance();

      if (report.nonCompliantChecks > 0) {
        expect(report.overallStatus).toBe("non_compliant");
      } else if (report.partialChecks > 0) {
        expect(report.overallStatus).toBe("partial");
      } else {
        expect(report.overallStatus).toBe("compliant");
      }
    });
  });

  describe("compliance checks", () => {
    it("should include data processing compliance checks", async () => {
      const report = await validator.validateCompliance();
      const dataProcessingChecks = report.checks.filter(
        (c) => c.category === "data_processing"
      );

      expect(dataProcessingChecks.length).toBeGreaterThan(0);

      // Check for specific data processing requirements
      const lawfulBasisCheck = dataProcessingChecks.find(
        (c) => c.id === "dp_001"
      );
      expect(lawfulBasisCheck).toBeDefined();
      expect(lawfulBasisCheck?.title).toBe("Lawful Basis for Processing");
      expect(lawfulBasisCheck?.requirement).toContain("GDPR Article 6");
    });

    it("should include data storage compliance checks", async () => {
      const report = await validator.validateCompliance();
      const dataStorageChecks = report.checks.filter(
        (c) => c.category === "data_storage"
      );

      expect(dataStorageChecks.length).toBeGreaterThan(0);

      // Check for EU data residency
      const residencyCheck = dataStorageChecks.find((c) => c.id === "ds_003");
      expect(residencyCheck).toBeDefined();
      expect(residencyCheck?.title).toBe("EU Data Residency");
      expect(residencyCheck?.status).toBe("compliant");
    });

    it("should include user rights compliance checks", async () => {
      const report = await validator.validateCompliance();
      const userRightsChecks = report.checks.filter(
        (c) => c.category === "user_rights"
      );

      expect(userRightsChecks.length).toBeGreaterThan(0);

      // Check for right to erasure
      const erasureCheck = userRightsChecks.find((c) => c.id === "ur_003");
      expect(erasureCheck).toBeDefined();
      expect(erasureCheck?.title).toBe("Right to Erasure");
      expect(erasureCheck?.requirement).toContain("GDPR Article 17");
    });

    it("should include consent management checks", async () => {
      const report = await validator.validateCompliance();
      const consentChecks = report.checks.filter(
        (c) => c.category === "consent"
      );

      expect(consentChecks.length).toBeGreaterThan(0);

      // Check for valid consent
      const validConsentCheck = consentChecks.find((c) => c.id === "cm_001");
      expect(validConsentCheck).toBeDefined();
      expect(validConsentCheck?.title).toBe("Valid Consent");
      expect(validConsentCheck?.requirement).toContain("GDPR Article 7");
    });

    it("should include security measures checks", async () => {
      const report = await validator.validateCompliance();
      const securityChecks = report.checks.filter(
        (c) => c.category === "security"
      );

      expect(securityChecks.length).toBeGreaterThan(0);

      // Check for encryption at rest
      const encryptionCheck = securityChecks.find((c) => c.id === "sm_001");
      expect(encryptionCheck).toBeDefined();
      expect(encryptionCheck?.title).toBe("Encryption at Rest");
      expect(encryptionCheck?.status).toBe("compliant");
    });

    it("should include AI operations compliance checks", async () => {
      const report = await validator.validateCompliance();
      const aiChecks = report.checks.filter(
        (c) => c.category === "ai_operations"
      );

      expect(aiChecks.length).toBeGreaterThan(0);

      // Check for AI processing transparency
      const transparencyCheck = aiChecks.find((c) => c.id === "ai_001");
      expect(transparencyCheck).toBeDefined();
      expect(transparencyCheck?.title).toBe("AI Processing Transparency");
      expect(transparencyCheck?.requirement).toContain("GDPR Article 13/14");
    });
  });

  describe("generateComplianceReport", () => {
    it("should generate a markdown compliance report", async () => {
      const markdown = await validator.generateComplianceReport();

      expect(markdown).toContain("# GDPR Compliance Report");
      expect(markdown).toContain("**Generated:**");
      expect(markdown).toContain("**Overall Status:**");
      expect(markdown).toContain("**Compliance Score:**");
      expect(markdown).toContain("## Summary");
      expect(markdown).toContain("## Compliance by Category");
      expect(markdown).toContain("## Detailed Checks");
      expect(markdown).toContain("## Recommendations");
    });

    it("should include all compliance categories in the report", async () => {
      const markdown = await validator.generateComplianceReport();

      expect(markdown).toContain("### Data Processing");
      expect(markdown).toContain("### Data Storage");
      expect(markdown).toContain("### User Rights");
      expect(markdown).toContain("### Consent");
      expect(markdown).toContain("### Security");
      expect(markdown).toContain("### Ai Operations");
    });

    it("should include status icons for checks", async () => {
      const markdown = await validator.generateComplianceReport();

      expect(markdown).toContain("✅"); // Compliant checks
      // May also contain ❌ (non-compliant), ⚠️ (partial), ➖ (not applicable)
    });
  });

  describe("exportComplianceData", () => {
    it("should export compliance data in structured format", async () => {
      const data = await validator.exportComplianceData();

      expect(data).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.generated).toBeInstanceOf(Date);
      expect(data.metadata.version).toBe("1.0.0");
      expect(data.metadata.system).toContain("matbakh.app");
      expect(data.compliance).toBeDefined();
      expect(data.compliance.checks).toBeInstanceOf(Array);
    });
  });

  describe("compliance check structure", () => {
    it("should have properly structured compliance checks", async () => {
      const report = await validator.validateCompliance();

      report.checks.forEach((check) => {
        expect(check.id).toBeDefined();
        expect(check.category).toMatch(
          /^(data_processing|data_storage|user_rights|consent|security|ai_operations)$/
        );
        expect(check.title).toBeDefined();
        expect(check.description).toBeDefined();
        expect(check.requirement).toBeDefined();
        expect(check.implementation).toBeDefined();
        expect(check.status).toMatch(
          /^(compliant|non_compliant|partial|not_applicable)$/
        );
        expect(check.evidence).toBeInstanceOf(Array);
        expect(check.lastChecked).toBeInstanceOf(Date);
      });
    });

    it("should have evidence for all compliance checks", async () => {
      const report = await validator.validateCompliance();

      report.checks.forEach((check) => {
        expect(check.evidence.length).toBeGreaterThan(0);
        check.evidence.forEach((evidence) => {
          expect(typeof evidence).toBe("string");
          expect(evidence.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("category summaries", () => {
    it("should generate accurate category summaries", async () => {
      const report = await validator.validateCompliance();

      Object.entries(report.summary).forEach(([category, summary]) => {
        expect(summary.total).toBeGreaterThan(0);
        expect(summary.compliant).toBeGreaterThanOrEqual(0);
        expect(summary.compliant).toBeLessThanOrEqual(summary.total);
        expect(summary.score).toBeGreaterThanOrEqual(0);
        expect(summary.score).toBeLessThanOrEqual(100);
        expect(summary.criticalIssues).toBeInstanceOf(Array);
      });
    });
  });

  describe("recommendations", () => {
    it("should provide general GDPR recommendations", async () => {
      const report = await validator.validateCompliance();

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain(
        "Conduct regular GDPR compliance audits (quarterly)"
      );
      expect(report.recommendations).toContain(
        "Keep privacy policy and consent forms up to date"
      );
      expect(report.recommendations).toContain(
        "Train staff on GDPR requirements and data handling procedures"
      );
    });
  });

  describe("timestamp handling", () => {
    it("should update lastChecked timestamp for all checks", async () => {
      const beforeTime = new Date();
      const report = await validator.validateCompliance();
      const afterTime = new Date();

      report.checks.forEach((check) => {
        expect(check.lastChecked.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
        expect(check.lastChecked.getTime()).toBeLessThanOrEqual(
          afterTime.getTime()
        );
      });
    });
  });
});
