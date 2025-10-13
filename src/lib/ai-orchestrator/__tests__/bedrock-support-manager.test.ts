/**
 * Bedrock Support Manager Tests
 *
 * Unit tests for the Bedrock Support Manager core functionality
 */

// Mock the dependencies first
jest.mock("../ai-feature-flags");
jest.mock("../adapters/bedrock-adapter");
jest.mock("../compliance-integration", () => ({
  ComplianceIntegration: jest.fn().mockImplementation(() => ({
    validateCompliance: jest.fn().mockResolvedValue({
      compliant: true,
      violations: [],
      warnings: [],
      score: 100,
    }),
    enforceCompliance: jest.fn().mockResolvedValue({
      allowed: true,
      reason: "Test compliance enforcement",
    }),
    getComplianceSummary: jest.fn().mockResolvedValue({
      overallCompliance: "compliant",
      providers: {
        bedrock: { compliant: true, violations: [], warnings: [] },
        google: { compliant: true, violations: [], warnings: [] },
        meta: { compliant: true, violations: [], warnings: [] },
      },
    }),
  })),
}));
jest.mock("../gdpr-hybrid-compliance-validator", () => ({
  GDPRHybridComplianceValidator: jest.fn().mockImplementation(() => ({
    validateBeforeRouting: jest
      .fn()
      .mockResolvedValue({ allowed: true, reason: "Test compliance" }),
    generateHybridComplianceReport: jest.fn().mockResolvedValue({
      overallCompliance: "compliant",
      complianceScore: 100,
      routingPathCompliance: {
        directBedrock: { isCompliant: true, violations: [], warnings: [] },
        mcpIntegration: { isCompliant: true, violations: [], warnings: [] },
      },
      crossPathCompliance: {},
      recommendations: [],
      criticalIssues: [],
      nextActions: [],
    }),
  })),
}));

import { BedrockAdapter } from "../adapters/bedrock-adapter";
import { AiFeatureFlags } from "../ai-feature-flags";
import {
  BedrockSupportConfig,
  BedrockSupportManager,
  FailureContext,
  createBedrockSupportManager,
} from "../bedrock-support-manager";

describe("BedrockSupportManager", () => {
  let supportManager: BedrockSupportManager;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockBedrockAdapter: jest.Mocked<BedrockAdapter>;

  beforeEach(() => {
    // Create mocked instances
    mockFeatureFlags = new AiFeatureFlags() as jest.Mocked<AiFeatureFlags>;
    mockBedrockAdapter = new BedrockAdapter() as jest.Mocked<BedrockAdapter>;

    // Setup default mock implementations
    mockFeatureFlags.isBedrockSupportModeEnabled.mockResolvedValue(true);
    mockFeatureFlags.validateBedrockSupportModeFlags.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
    mockFeatureFlags.isProviderEnabled.mockResolvedValue(true);
    mockFeatureFlags.validateAllFlags.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    // Create support manager instance
    supportManager = new BedrockSupportManager(
      undefined,
      mockFeatureFlags,
      mockBedrockAdapter
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor and Factory", () => {
    it("should create instance with default configuration", () => {
      const manager = new BedrockSupportManager();
      expect(manager).toBeInstanceOf(BedrockSupportManager);
      expect(manager.isActive()).toBe(false);
    });

    it("should create instance with custom configuration", () => {
      const config: Partial<BedrockSupportConfig> = {
        enabled: true,
        monitoringLevel: "comprehensive",
      };
      const manager = new BedrockSupportManager(config);
      expect(manager).toBeInstanceOf(BedrockSupportManager);
    });

    it("should create instance using factory function", () => {
      const manager = createBedrockSupportManager();
      expect(manager).toBeInstanceOf(BedrockSupportManager);
    });
  });

  describe("Activation and Deactivation", () => {
    it("should activate successfully when conditions are met", async () => {
      const result = await supportManager.activate();

      expect(result.success).toBe(true);
      expect(result.message).toContain("activated successfully");
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(supportManager.isActive()).toBe(true);

      // Verify feature flag checks were called
      expect(mockFeatureFlags.isBedrockSupportModeEnabled).toHaveBeenCalled();
      expect(
        mockFeatureFlags.validateBedrockSupportModeFlags
      ).toHaveBeenCalled();
      expect(mockFeatureFlags.isProviderEnabled).toHaveBeenCalledWith(
        "bedrock"
      );
    });

    it("should fail activation when feature flag is disabled", async () => {
      mockFeatureFlags.isBedrockSupportModeEnabled.mockResolvedValue(false);

      const result = await supportManager.activate();

      expect(result.success).toBe(false);
      expect(result.message).toContain("disabled via feature flag");
      expect(supportManager.isActive()).toBe(false);
    });

    it("should fail activation when validation fails", async () => {
      mockFeatureFlags.validateBedrockSupportModeFlags.mockResolvedValue({
        isValid: false,
        errors: ["Test validation error"],
        warnings: [],
      });

      const result = await supportManager.activate();

      expect(result.success).toBe(false);
      expect(result.message).toContain("validation failed");
      expect(result.validationResults).toBeDefined();
      expect(supportManager.isActive()).toBe(false);
    });

    it("should fail activation when Bedrock provider is disabled", async () => {
      mockFeatureFlags.isProviderEnabled.mockResolvedValue(false);

      const result = await supportManager.activate();

      expect(result.success).toBe(false);
      expect(result.message).toContain("not enabled");
      expect(supportManager.isActive()).toBe(false);
    });

    it("should fail activation when infrastructure audit shows critical issues", async () => {
      // Mock critical infrastructure issues
      mockFeatureFlags.validateAllFlags.mockResolvedValue({
        isValid: false,
        errors: ["Critical system error"],
        warnings: [],
      });

      const result = await supportManager.activate();

      expect(result.success).toBe(false);
      expect(result.message).toContain("critical infrastructure issues");
      expect(supportManager.isActive()).toBe(false);
    });

    it("should handle activation errors gracefully", async () => {
      mockFeatureFlags.isBedrockSupportModeEnabled.mockRejectedValue(
        new Error("Test error")
      );

      const result = await supportManager.activate();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to activate");
      expect(supportManager.isActive()).toBe(false);
    });

    it("should deactivate successfully", async () => {
      // First activate
      await supportManager.activate();
      expect(supportManager.isActive()).toBe(true);

      // Then deactivate
      await supportManager.deactivate();
      expect(supportManager.isActive()).toBe(false);
      expect(
        mockFeatureFlags.disableBedrockSupportModeSafely
      ).toHaveBeenCalled();
    });

    it("should handle deactivation errors", async () => {
      mockFeatureFlags.disableBedrockSupportModeSafely.mockRejectedValue(
        new Error("Deactivation error")
      );

      await expect(supportManager.deactivate()).rejects.toThrow(
        "Deactivation error"
      );
    });
  });

  describe("Infrastructure Audit", () => {
    it("should run infrastructure audit successfully", async () => {
      const result = await supportManager.runInfrastructureAudit();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.overallHealth).toMatch(/^(healthy|warning|critical)$/);
      expect(Array.isArray(result.detectedIssues)).toBe(true);
      expect(Array.isArray(result.implementationGaps)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.complianceStatus).toBeDefined();
    });

    it("should detect feature flag issues during audit", async () => {
      mockFeatureFlags.validateAllFlags.mockResolvedValue({
        isValid: false,
        errors: ["Feature flag error"],
        warnings: [],
      });

      const result = await supportManager.runInfrastructureAudit();

      expect(result.detectedIssues.length).toBeGreaterThan(0);
      expect(result.detectedIssues[0].category).toBe("compliance");
      expect(result.overallHealth).toBe("warning");
    });

    it("should detect provider issues during audit", async () => {
      mockFeatureFlags.isProviderEnabled.mockImplementation((provider) => {
        return Promise.resolve(provider !== "bedrock");
      });

      const result = await supportManager.runInfrastructureAudit();

      expect(result.detectedIssues.length).toBeGreaterThan(0);
      const bedrockIssue = result.detectedIssues.find(
        (issue) => issue.id === "provider-bedrock-disabled"
      );
      expect(bedrockIssue).toBeDefined();
      expect(bedrockIssue?.severity).toBe("high");
    });

    it("should handle audit errors gracefully", async () => {
      mockFeatureFlags.validateAllFlags.mockRejectedValue(
        new Error("Audit error")
      );

      const result = await supportManager.runInfrastructureAudit();

      expect(result.overallHealth).toBe("critical");
      expect(result.detectedIssues.length).toBe(1);
      expect(result.detectedIssues[0].severity).toBe("critical");
      expect(result.detectedIssues[0].description).toContain("audit failed");
    });
  });

  describe("Meta Monitoring", () => {
    it("should enable meta monitoring when active", async () => {
      await supportManager.activate();

      await expect(
        supportManager.enableMetaMonitoring()
      ).resolves.not.toThrow();
    });

    it("should fail to enable meta monitoring when not active", async () => {
      await expect(supportManager.enableMetaMonitoring()).rejects.toThrow(
        "Cannot enable meta-monitoring: Support mode is not active"
      );
    });
  });

  describe("Fallback Support", () => {
    const mockFailureContext: FailureContext = {
      operation: "test-operation",
      errorType: "timeout",
      errorMessage: "Operation timed out",
      timestamp: new Date(),
      affectedSystems: ["api-gateway"],
      severity: "medium",
    };

    it("should provide fallback support successfully", async () => {
      const result = await supportManager.provideFallbackSupport(
        mockFailureContext
      );

      expect(result.success).toBe(true);
      expect(result.supportType).toMatch(
        /^(infrastructure|execution|implementation)$/
      );
      expect(Array.isArray(result.actionsPerformed)).toBe(true);
      expect(result.actionsPerformed.length).toBeGreaterThan(0);
      expect(result.diagnostics).toBeDefined();
      expect(Array.isArray(result.nextSteps)).toBe(true);
    });

    it("should determine support type based on failure context", async () => {
      const infrastructureContext: FailureContext = {
        ...mockFailureContext,
        affectedSystems: ["infrastructure", "database"],
      };

      const result = await supportManager.provideFallbackSupport(
        infrastructureContext
      );
      expect(result.supportType).toBe("infrastructure");
    });

    it("should escalate critical failures", async () => {
      const criticalContext: FailureContext = {
        ...mockFailureContext,
        severity: "critical",
      };

      const result = await supportManager.provideFallbackSupport(
        criticalContext
      );
      expect(result.nextSteps).toContain("Escalate to on-call team");
      expect(result.nextSteps).toContain("Activate emergency procedures");
    });

    it("should handle fallback support errors gracefully", async () => {
      // Force an error by passing invalid context
      const invalidContext = null as any;

      const result = await supportManager.provideFallbackSupport(
        invalidContext
      );
      expect(result.success).toBe(false);
      expect(result.nextSteps).toContain("Manual intervention required");
    });
  });

  describe("Kiro Integration", () => {
    it("should send diagnostics to Kiro", async () => {
      const diagnostics = {
        systemHealth: { status: "ok" },
        performanceMetrics: {
          responseTime: 100,
          memoryUsage: 50,
          cpuUsage: 25,
          networkLatency: 10,
        },
        errorLogs: [],
        recommendations: ["Optimize performance"],
      };

      await expect(
        supportManager.sendDiagnosticsToKiro(diagnostics)
      ).resolves.not.toThrow();
    });

    it("should receive execution data from Kiro", async () => {
      const executionData = {
        executionId: "test-123",
        timestamp: new Date(),
        operation: "test-operation",
        duration: 1000,
        success: true,
        performanceMetrics: {
          responseTime: 100,
          memoryUsage: 50,
          cpuUsage: 25,
          networkLatency: 10,
        },
      };

      await expect(
        supportManager.receiveKiroExecutionData(executionData)
      ).resolves.not.toThrow();
    });

    it("should handle failed execution data", async () => {
      const executionData = {
        executionId: "test-456",
        timestamp: new Date(),
        operation: "failed-operation",
        duration: 5000,
        success: false,
        errorDetails: "Operation failed due to timeout",
        performanceMetrics: {
          responseTime: 5000,
          memoryUsage: 80,
          cpuUsage: 90,
          networkLatency: 1000,
        },
      };

      await expect(
        supportManager.receiveKiroExecutionData(executionData)
      ).resolves.not.toThrow();
    });
  });

  describe("Security and Compliance", () => {
    it("should validate compliance status", async () => {
      const result = await supportManager.validateComplianceStatus();

      expect(result).toBeDefined();
      expect(typeof result.isCompliant).toBe("boolean");
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it("should enable circuit breaker", async () => {
      await expect(
        supportManager.enableCircuitBreaker()
      ).resolves.not.toThrow();
    });

    it("should check security posture", async () => {
      const result = await supportManager.checkSecurityPosture();

      expect(result).toBeDefined();
      expect(typeof result.securityScore).toBe("number");
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.lastAudit).toBeInstanceOf(Date);
    });
  });

  describe("Cost and Performance Management", () => {
    it("should monitor cost thresholds", async () => {
      const result = await supportManager.monitorCostThresholds();

      expect(result).toBeDefined();
      expect(typeof result.currentSpend).toBe("number");
      expect(typeof result.projectedSpend).toBe("number");
      expect(typeof result.budgetUtilization).toBe("number");
      expect(typeof result.costBreakdown).toBe("object");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should optimize performance", async () => {
      const result = await supportManager.optimizePerformance();

      expect(result).toBeDefined();
      expect(result.currentMetrics).toBeDefined();
      expect(Array.isArray(result.optimizationOpportunities)).toBe(true);
      expect(typeof result.expectedImprovements).toBe("object");
    });

    it("should enable emergency mode", async () => {
      await expect(supportManager.enableEmergencyMode()).resolves.not.toThrow();
    });
  });

  describe("Template and Prompt Management", () => {
    it("should validate prompt templates", async () => {
      const result = await supportManager.validatePromptTemplates();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.templateCount).toBe("number");
    });

    it("should enable PII redaction", async () => {
      await expect(supportManager.enablePIIRedaction()).resolves.not.toThrow();
    });

    it("should run red team evaluations", async () => {
      const result = await supportManager.runRedTeamEvaluations();

      expect(result).toBeDefined();
      expect(typeof result.passed).toBe("boolean");
      expect(Array.isArray(result.testResults)).toBe(true);
      expect(typeof result.overallScore).toBe("number");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe("Compliance Reporting", () => {
    it("should create compliance report for support mode", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result).toBeDefined();
      expect(result.reportId).toMatch(/^bedrock-support-compliance-\d+$/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.supportModeCompliance).toBeDefined();
      expect(result.hybridRoutingCompliance).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should include support mode compliance details", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      // Overall compliance may be false if EU data residency is not met
      expect(typeof result.supportModeCompliance.overallCompliant).toBe(
        "boolean"
      );
      expect(result.supportModeCompliance.bedrockCompliant).toBe(true);
      expect(result.supportModeCompliance.gdprCompliant).toBe(true);
      // EU data residency may be false if using us-east-1 region
      expect(typeof result.supportModeCompliance.euDataResidencyCompliant).toBe(
        "boolean"
      );
    });

    it("should include hybrid routing compliance details", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result.hybridRoutingCompliance.mcpPathCompliant).toBe(true);
      expect(result.hybridRoutingCompliance.directBedrockPathCompliant).toBe(
        true
      );
      expect(result.hybridRoutingCompliance.auditTrailComplete).toBe(true);
    });

    it("should include recommendations for compliance improvement", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result.recommendations).toContain(
        "Regularly review provider agreements for compliance updates"
      );
      expect(result.recommendations).toContain(
        "Monitor PII detection and redaction effectiveness"
      );
      expect(result.recommendations).toContain(
        "Ensure audit trail completeness for all support operations"
      );
    });

    it("should handle compliance report generation errors", async () => {
      // Mock a failure in compliance validation
      const mockComplianceIntegration = supportManager[
        "complianceIntegration"
      ] as any;
      mockComplianceIntegration.getComplianceSummary.mockRejectedValue(
        new Error("Compliance validation failed")
      );

      await expect(
        supportManager.createComplianceReportForSupportMode()
      ).rejects.toThrow("Compliance report generation failed");
    });

    it("should log compliance report generation", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await supportManager.createComplianceReportForSupportMode();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[bedrock-activation] Generating compliance report for support mode"
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[bedrock-activation] Compliance report generated successfully"
        )
      );

      consoleSpy.mockRestore();
    });

    it("should include violation details when compliance issues exist", async () => {
      // Mock compliance issues by creating a spy on the method
      const mockVerifyCompliance = jest
        .spyOn(supportManager["providerCompliance"], "verifyProviderCompliance")
        .mockResolvedValue({
          compliant: false,
          agreement: undefined,
          violations: ["Test violation 1", "Test violation 2"],
          warnings: ["Test warning"],
        });

      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result.violations).toContain("Test violation 1");
      expect(result.violations).toContain("Test violation 2");
      expect(result.supportModeCompliance.bedrockCompliant).toBe(false);

      // Restore the original method
      mockVerifyCompliance.mockRestore();
    });

    it("should generate unique report IDs", async () => {
      const result1 =
        await supportManager.createComplianceReportForSupportMode();
      const result2 =
        await supportManager.createComplianceReportForSupportMode();

      expect(result1.reportId).not.toBe(result2.reportId);
      expect(result1.reportId).toMatch(/^bedrock-support-compliance-\d+$/);
      expect(result2.reportId).toMatch(/^bedrock-support-compliance-\d+$/);
    });

    it("should validate GDPR compliance in report", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result.supportModeCompliance.gdprCompliant).toBe(true);
      // EU data residency may be false if using us-east-1 region
      expect(typeof result.supportModeCompliance.euDataResidencyCompliant).toBe(
        "boolean"
      );
    });

    it("should validate audit trail completeness", async () => {
      const result =
        await supportManager.createComplianceReportForSupportMode();

      expect(result.hybridRoutingCompliance.auditTrailComplete).toBe(true);
    });
  });

  describe("Logging", () => {
    it("should log with bedrock-activation prefix", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await supportManager.activate();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[bedrock-activation]")
      );

      consoleSpy.mockRestore();
    });
  });
});
