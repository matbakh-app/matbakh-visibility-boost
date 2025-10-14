/**
 * Hybrid Architecture Security Scanner Tests
 *
 * Comprehensive test suite for automated security scanning of the hybrid architecture
 * including both MCP and direct Bedrock routing paths.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HybridArchitectureSecurityScanner } from "../hybrid-architecture-security-scanner";
import type { HybridSecurityConfig } from "../types";

// Mock dependencies
const mockSecurityPostureMonitor = {
  getSecurityStatus: jest.fn(),
  performSecurityAssessment: jest.fn(),
};

const mockRedTeamEvaluator = {
  performRedTeamEvaluation: jest.fn(),
  testInjectionVulnerabilities: jest.fn(),
  testAuthenticationBypass: jest.fn(),
};

const mockGDPRValidator = {
  validateHybridCompliance: jest.fn(),
};

const mockCircuitBreaker = {
  isOpen: jest.fn(),
  execute: jest.fn(),
};

const mockAuditTrail = {
  logEvent: jest.fn(),
  validateIntegrity: jest.fn(),
};

jest.mock("../security-posture-monitor", () => ({
  SecurityPostureMonitor: jest.fn(() => mockSecurityPostureMonitor),
}));

jest.mock("../red-team-evaluator", () => ({
  RedTeamEvaluator: jest.fn(() => mockRedTeamEvaluator),
}));

jest.mock("../../gdpr-hybrid-compliance-validator", () => ({
  GDPRHybridComplianceValidator: jest.fn(() => mockGDPRValidator),
}));

jest.mock("../../circuit-breaker", () => ({
  CircuitBreaker: jest.fn(() => mockCircuitBreaker),
}));

jest.mock("../../audit-trail-system", () => ({
  AuditTrailSystem: jest.fn(() => mockAuditTrail),
}));

describe("HybridArchitectureSecurityScanner", () => {
  let scanner: HybridArchitectureSecurityScanner;
  let mockConfig: HybridSecurityConfig;

  beforeEach(() => {
    mockConfig = {
      scanDepth: "comprehensive",
      enablePenetrationTesting: true,
      enableComplianceValidation: true,
      enableVulnerabilityScanning: true,
      enableAuditTrailValidation: true,
      scanTimeout: 300000, // 5 minutes
      reportFormat: "detailed",
      excludePatterns: [],
      includePatterns: ["**/*.ts", "**/*.js"],
      securityThresholds: {
        critical: 0,
        high: 2,
        medium: 10,
        low: 50,
      },
    };

    scanner = new HybridArchitectureSecurityScanner(mockConfig);
  });

  describe("Comprehensive Security Scanning", () => {
    it("should perform full security scan of hybrid architecture", async () => {
      const result = await scanner.performComprehensiveScan();

      expect(result).toBeDefined();
      expect(result.scanId).toMatch(/^scan-[a-f0-9-]+$/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.overallSecurityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallSecurityScore).toBeLessThanOrEqual(100);
      expect(result.scanResults).toBeDefined();
      expect(result.scanResults.mcpRouting).toBeDefined();
      expect(result.scanResults.directBedrock).toBeDefined();
      expect(result.scanResults.hybridRouting).toBeDefined();
    });

    it("should scan MCP routing path security", async () => {
      const result = await scanner.scanMCPRoutingSecurity();

      expect(result.pathType).toBe("mcp");
      expect(result.securityScore).toBeGreaterThanOrEqual(0);
      expect(result.vulnerabilities).toBeInstanceOf(Array);
      expect(result.complianceStatus).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it("should scan direct Bedrock routing security", async () => {
      const result = await scanner.scanDirectBedrockSecurity();

      expect(result.pathType).toBe("direct_bedrock");
      expect(result.securityScore).toBeGreaterThanOrEqual(0);
      expect(result.vulnerabilities).toBeInstanceOf(Array);
      expect(result.complianceStatus).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it("should validate hybrid routing security integration", async () => {
      const result = await scanner.validateHybridRoutingIntegration();

      expect(result.pathType).toBe("hybrid");
      expect(result.integrationSecurityScore).toBeGreaterThanOrEqual(0);
      expect(result.crossPathVulnerabilities).toBeInstanceOf(Array);
      expect(result.routingSecurityValidation).toBeDefined();
    });
  });

  describe("Vulnerability Detection", () => {
    it("should detect authentication vulnerabilities", async () => {
      const vulnerabilities = await scanner.scanAuthenticationSecurity();

      expect(vulnerabilities).toBeInstanceOf(Array);
      vulnerabilities.forEach((vuln) => {
        expect(vuln.id).toBeDefined();
        expect(vuln.severity).toMatch(/^(critical|high|medium|low)$/);
        expect(vuln.category).toBe("authentication");
        expect(vuln.description).toBeDefined();
        expect(vuln.recommendation).toBeDefined();
      });
    });

    it("should detect authorization vulnerabilities", async () => {
      const vulnerabilities = await scanner.scanAuthorizationSecurity();

      expect(vulnerabilities).toBeInstanceOf(Array);
      vulnerabilities.forEach((vuln) => {
        expect(vuln.severity).toMatch(/^(critical|high|medium|low)$/);
        expect(vuln.category).toBe("authorization");
        expect(vuln.affectedComponents).toBeInstanceOf(Array);
      });
    });

    it("should detect data protection vulnerabilities", async () => {
      const vulnerabilities = await scanner.scanDataProtectionSecurity();

      expect(vulnerabilities).toBeInstanceOf(Array);
      vulnerabilities.forEach((vuln) => {
        expect(vuln.category).toBe("data_protection");
        expect(vuln.piiRisk).toBeDefined();
        expect(vuln.gdprCompliance).toBeDefined();
      });
    });

    it("should detect network security vulnerabilities", async () => {
      const vulnerabilities = await scanner.scanNetworkSecurity();

      expect(vulnerabilities).toBeInstanceOf(Array);
      vulnerabilities.forEach((vuln) => {
        expect(vuln.category).toBe("network_security");
        expect(vuln.networkLayer).toBeDefined();
        expect(vuln.exposureRisk).toBeDefined();
      });
    });
  });

  describe("Compliance Validation", () => {
    it("should validate GDPR compliance for hybrid architecture", async () => {
      const result = await scanner.validateGDPRCompliance();

      expect(result.overallCompliant).toBeDefined();
      expect(result.mcpPathCompliant).toBeDefined();
      expect(result.directBedrockCompliant).toBeDefined();
      expect(result.dataProcessingCompliant).toBeDefined();
      expect(result.consentManagementCompliant).toBeDefined();
      expect(result.violations).toBeInstanceOf(Array);
    });

    it("should validate EU data residency compliance", async () => {
      const result = await scanner.validateEUDataResidency();

      expect(result.compliant).toBeDefined();
      expect(result.dataLocations).toBeInstanceOf(Array);
      expect(result.crossBorderTransfers).toBeInstanceOf(Array);
      expect(result.violations).toBeInstanceOf(Array);
    });

    it("should validate provider agreement compliance", async () => {
      const result = await scanner.validateProviderAgreementCompliance();

      expect(result.overallCompliant).toBeDefined();
      expect(result.bedrockCompliant).toBeDefined();
      expect(result.mcpCompliant).toBeDefined();
      expect(result.agreementViolations).toBeInstanceOf(Array);
    });
  });

  describe("Penetration Testing", () => {
    it("should perform automated penetration testing", async () => {
      const result = await scanner.performPenetrationTesting();

      expect(result.testId).toBeDefined();
      expect(result.testResults).toBeInstanceOf(Array);
      expect(result.exploitAttempts).toBeInstanceOf(Array);
      expect(result.successfulExploits).toBeInstanceOf(Array);
      expect(result.securityGaps).toBeInstanceOf(Array);
    });

    it("should test injection vulnerabilities", async () => {
      const result = await scanner.testInjectionVulnerabilities();

      expect(result.sqlInjection).toBeDefined();
      expect(result.promptInjection).toBeDefined();
      expect(result.commandInjection).toBeDefined();
      expect(result.xssVulnerabilities).toBeDefined();
    });

    it("should test authentication bypass attempts", async () => {
      const result = await scanner.testAuthenticationBypass();

      expect(result.bypassAttempts).toBeInstanceOf(Array);
      expect(result.successfulBypasses).toBeInstanceOf(Array);
      expect(result.authenticationStrength).toBeDefined();
    });
  });

  describe("Circuit Breaker Security", () => {
    it("should validate circuit breaker security configuration", async () => {
      const result = await scanner.validateCircuitBreakerSecurity();

      expect(result.configurationSecure).toBeDefined();
      expect(result.failureHandlingSecure).toBeDefined();
      expect(result.stateTransitionSecure).toBeDefined();
      expect(result.monitoringSecure).toBeDefined();
    });

    it("should test circuit breaker failure scenarios", async () => {
      const result = await scanner.testCircuitBreakerFailureScenarios();

      expect(result.scenarios).toBeInstanceOf(Array);
      result.scenarios.forEach((scenario) => {
        expect(scenario.scenarioName).toBeDefined();
        expect(scenario.securityMaintained).toBeDefined();
        expect(scenario.dataLeakageRisk).toBeDefined();
      });
    });
  });

  describe("Audit Trail Security", () => {
    it("should validate audit trail integrity", async () => {
      const result = await scanner.validateAuditTrailIntegrity();

      expect(result.integrityMaintained).toBeDefined();
      expect(result.tamperProof).toBeDefined();
      expect(result.completeness).toBeDefined();
      expect(result.encryptionStatus).toBeDefined();
    });

    it("should test audit trail tampering resistance", async () => {
      const result = await scanner.testAuditTrailTamperingResistance();

      expect(result.tamperingAttempts).toBeInstanceOf(Array);
      expect(result.successfulTampering).toBeInstanceOf(Array);
      expect(result.detectionCapability).toBeDefined();
    });
  });

  describe("Security Reporting", () => {
    it("should generate comprehensive security report", async () => {
      const report = await scanner.generateSecurityReport();

      expect(report.reportId).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.detailedFindings).toBeInstanceOf(Array);
      expect(report.riskAssessment).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.complianceStatus).toBeDefined();
    });

    it("should export security scan results", async () => {
      const exportResult = await scanner.exportScanResults("json");

      expect(exportResult.format).toBe("json");
      expect(exportResult.data).toBeDefined();
      expect(exportResult.exportPath).toBeDefined();
      expect(exportResult.checksum).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle scan timeout gracefully", async () => {
      const shortTimeoutConfig = { ...mockConfig, scanTimeout: 1 };
      const timeoutScanner = new HybridArchitectureSecurityScanner(
        shortTimeoutConfig
      );

      await expect(timeoutScanner.performComprehensiveScan()).rejects.toThrow(
        "Security scan timeout"
      );
    });

    it("should handle invalid configuration", () => {
      const invalidConfig = { ...mockConfig, scanDepth: "invalid" as any };

      expect(
        () => new HybridArchitectureSecurityScanner(invalidConfig)
      ).toThrow("Invalid scan configuration");
    });

    it("should handle component unavailability", async () => {
      // Mock component failure
      jest
        .spyOn(scanner as any, "scanMCPRoutingSecurity")
        .mockRejectedValue(new Error("MCP unavailable"));

      const result = await scanner.performComprehensiveScan();

      expect(result.scanResults.mcpRouting.error).toBeDefined();
      expect(result.scanResults.mcpRouting.error).toContain("MCP unavailable");
    });
  });

  describe("Performance and Scalability", () => {
    it("should complete security scan within timeout", async () => {
      const startTime = Date.now();
      await scanner.performComprehensiveScan();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(mockConfig.scanTimeout);
    });

    it("should handle concurrent security scans", async () => {
      const promises = Array(3)
        .fill(null)
        .map(() => scanner.performComprehensiveScan());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.scanId).toBeDefined();
        expect(result.overallSecurityScore).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
