/**
 * Security Posture Monitor Tests
 *
 * Comprehensive test suite for security posture monitoring functionality
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { CircuitBreaker } from "../circuit-breaker";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { GDPRHybridComplianceValidator } from "../gdpr-hybrid-compliance-validator";
import { MCPRouter } from "../mcp-router";
import { ProviderAgreementCompliance } from "../provider-agreement-compliance";
import { SecurityPostureMonitor } from "../security-posture-monitor";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../circuit-breaker");
jest.mock("../direct-bedrock-client");
jest.mock("../gdpr-hybrid-compliance-validator");
jest.mock("../mcp-router");
jest.mock("../provider-agreement-compliance");

describe("SecurityPostureMonitor", () => {
  let monitor: SecurityPostureMonitor;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockGDPRValidator: jest.Mocked<GDPRHybridComplianceValidator>;
  let mockProviderCompliance: jest.Mocked<ProviderAgreementCompliance>;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockMCPRouter: jest.Mocked<MCPRouter>;

  beforeEach(() => {
    // Create mock instances
    mockFeatureFlags = new AiFeatureFlags() as jest.Mocked<AiFeatureFlags>;
    mockAuditTrail = new AuditTrailSystem() as jest.Mocked<AuditTrailSystem>;
    mockCircuitBreaker = new CircuitBreaker() as jest.Mocked<CircuitBreaker>;
    mockGDPRValidator =
      new GDPRHybridComplianceValidator() as jest.Mocked<GDPRHybridComplianceValidator>;
    mockProviderCompliance =
      new ProviderAgreementCompliance() as jest.Mocked<ProviderAgreementCompliance>;
    mockDirectBedrockClient =
      new DirectBedrockClient() as jest.Mocked<DirectBedrockClient>;
    mockMCPRouter = new MCPRouter() as jest.Mocked<MCPRouter>;

    // Setup default mock behaviors
    mockFeatureFlags.getFlag = jest.fn().mockResolvedValue(true);
    mockFeatureFlags.validateAllFlags = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    mockAuditTrail.logSupportModeEvent = jest.fn().mockResolvedValue(undefined);

    mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(false);

    mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
      isCompliant: true,
      violations: [],
      recommendations: [],
      validatedAt: new Date(),
    });

    mockDirectBedrockClient.checkHealth = jest.fn().mockResolvedValue({
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 100,
      errorRate: 0,
    });

    mockMCPRouter.checkHealth = jest.fn().mockResolvedValue({
      isHealthy: true,
      lastCheck: new Date(),
      latency: 50,
      errorRate: 0,
    });

    // Create monitor instance
    monitor = new SecurityPostureMonitor(
      undefined,
      mockFeatureFlags,
      mockAuditTrail,
      mockCircuitBreaker,
      mockGDPRValidator,
      mockProviderCompliance,
      mockDirectBedrockClient,
      mockMCPRouter
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Monitoring Lifecycle", () => {
    it("should start monitoring successfully", async () => {
      await monitor.startMonitoring();

      expect(monitor.isMonitoringActive()).toBe(true);
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "security_monitoring_started",
        expect.objectContaining({
          timestamp: expect.any(Date),
        }),
        "system"
      );
    });

    it("should not start monitoring if already active", async () => {
      await monitor.startMonitoring();
      const firstCallCount =
        mockAuditTrail.logSupportModeEvent.mock.calls.length;

      await monitor.startMonitoring();
      const secondCallCount =
        mockAuditTrail.logSupportModeEvent.mock.calls.length;

      // Should not log again if already active
      expect(secondCallCount).toBe(firstCallCount);
    });

    it("should stop monitoring successfully", async () => {
      await monitor.startMonitoring();
      await monitor.stopMonitoring();

      expect(monitor.isMonitoringActive()).toBe(false);
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "security_monitoring_stopped",
        expect.objectContaining({
          timestamp: expect.any(Date),
          metrics: expect.any(Object),
        }),
        "system"
      );
    });

    it("should handle stop when not active", async () => {
      await monitor.stopMonitoring();

      expect(monitor.isMonitoringActive()).toBe(false);
    });
  });

  describe("Security Assessment", () => {
    it("should assess security posture successfully", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status).toMatchObject({
        overall: {
          securityScore: expect.any(Number),
          threatLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
          lastAssessment: expect.any(Date),
          complianceStatus: expect.stringMatching(
            /^(compliant|warning|non-compliant)$/
          ),
        },
        routes: {
          mcp: expect.objectContaining({
            isSecure: expect.any(Boolean),
            securityScore: expect.any(Number),
          }),
          directBedrock: expect.objectContaining({
            isSecure: expect.any(Boolean),
            securityScore: expect.any(Number),
          }),
        },
        threats: {
          active: expect.any(Array),
          mitigated: expect.any(Array),
          totalDetected: expect.any(Number),
        },
        compliance: expect.objectContaining({
          gdpr: expect.any(Object),
          dataResidency: expect.any(Object),
          auditTrail: expect.any(Object),
        }),
        recommendations: expect.objectContaining({
          immediate: expect.any(Array),
          shortTerm: expect.any(Array),
          longTerm: expect.any(Array),
        }),
      });
    });

    it("should detect high security score with healthy routes", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.overall.securityScore).toBeGreaterThanOrEqual(70);
      expect(status.overall.threatLevel).toBe("low");
      expect(status.routes.mcp.isSecure).toBe(true);
      expect(status.routes.directBedrock.isSecure).toBe(true);
    });

    it("should detect critical threat level with circuit breaker open", async () => {
      mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(true);

      const status = await monitor.assessSecurityPosture();

      expect(status.threats.active.length).toBeGreaterThan(0);
      expect(status.threats.active[0].type).toBe("unauthorized_access");
      expect(status.threats.active[0].severity).toBe("high");
    });

    it("should detect compliance violations", async () => {
      mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
        isCompliant: false,
        violations: ["Data processing without consent"],
        recommendations: ["Obtain user consent", "Review data processing"],
        validatedAt: new Date(),
      });

      const status = await monitor.assessSecurityPosture();

      expect(
        status.threats.active.some((t) => t.type === "compliance_violation")
      ).toBe(true);
      expect(status.overall.complianceStatus).toBe("non-compliant");
    });

    it("should detect misconfigurations", async () => {
      mockFeatureFlags.validateAllFlags = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ["Invalid feature flag configuration"],
        warnings: [],
      });

      const status = await monitor.assessSecurityPosture();

      expect(
        status.threats.active.some((t) => t.type === "misconfiguration")
      ).toBe(true);
    });

    it("should log assessment completion to audit trail", async () => {
      await monitor.assessSecurityPosture();

      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "security_assessment_completed",
        expect.objectContaining({
          timestamp: expect.any(Date),
          securityScore: expect.any(Number),
          threatLevel: expect.any(String),
          activeThreats: expect.any(Number),
        }),
        "system"
      );
    });

    it("should handle assessment failures gracefully", async () => {
      mockDirectBedrockClient.checkHealth = jest
        .fn()
        .mockRejectedValue(new Error("Health check failed"));

      await expect(monitor.assessSecurityPosture()).rejects.toThrow(
        "Health check failed"
      );

      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "security_assessment_failed",
        expect.objectContaining({
          timestamp: expect.any(Date),
          error: "Health check failed",
        }),
        "system"
      );
    });
  });

  describe("Route Security Assessment", () => {
    it("should assess MCP route security", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.routes.mcp).toMatchObject({
        isSecure: true,
        securityScore: expect.any(Number),
        lastCheck: expect.any(Date),
        vulnerabilities: expect.any(Array),
        encryptionStatus: "enabled",
        accessControlStatus: "strict",
        threatDetectionEnabled: true,
      });
    });

    it("should assess direct Bedrock route security", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.routes.directBedrock).toMatchObject({
        isSecure: true,
        securityScore: expect.any(Number),
        lastCheck: expect.any(Date),
        vulnerabilities: expect.any(Array),
        encryptionStatus: "enabled",
        accessControlStatus: "strict",
        threatDetectionEnabled: true,
      });
    });

    it("should detect vulnerabilities in unhealthy routes", async () => {
      mockMCPRouter.checkHealth = jest.fn().mockResolvedValue({
        isHealthy: false,
        lastCheck: new Date(),
        latency: 5000,
        errorRate: 0.5,
      });

      const status = await monitor.assessSecurityPosture();

      expect(status.routes.mcp.vulnerabilities.length).toBeGreaterThan(0);
      expect(status.routes.mcp.vulnerabilities[0].component).toBe("mcp-router");
    });

    it("should calculate lower security score for partial encryption", async () => {
      mockFeatureFlags.getFlag = jest
        .fn()
        .mockImplementation((flag: string) => {
          if (flag === "mcp_encryption_enabled") return Promise.resolve(false);
          return Promise.resolve(true);
        });

      const status = await monitor.assessSecurityPosture();

      expect(status.routes.mcp.encryptionStatus).toBe("partial");
      expect(status.routes.mcp.securityScore).toBeLessThan(100);
    });
  });

  describe("Threat Detection", () => {
    it("should detect no threats in healthy system", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.threats.active.length).toBe(0);
      expect(status.overall.threatLevel).toBe("low");
    });

    it("should detect unauthorized access threats", async () => {
      mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(true);

      const status = await monitor.assessSecurityPosture();

      const unauthorizedThreat = status.threats.active.find(
        (t) => t.type === "unauthorized_access"
      );
      expect(unauthorizedThreat).toBeDefined();
      expect(unauthorizedThreat?.severity).toBe("high");
      expect(unauthorizedThreat?.affectedRoute).toBe("direct_bedrock");
    });

    it("should detect compliance violation threats", async () => {
      mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
        isCompliant: false,
        violations: ["Missing user consent"],
        recommendations: ["Obtain consent"],
        validatedAt: new Date(),
      });

      const status = await monitor.assessSecurityPosture();

      const complianceThreat = status.threats.active.find(
        (t) => t.type === "compliance_violation"
      );
      expect(complianceThreat).toBeDefined();
      expect(complianceThreat?.severity).toBe("critical");
    });

    it("should detect misconfiguration threats", async () => {
      mockFeatureFlags.validateAllFlags = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ["Invalid configuration"],
        warnings: [],
      });

      const status = await monitor.assessSecurityPosture();

      const misconfigThreat = status.threats.active.find(
        (t) => t.type === "misconfiguration"
      );
      expect(misconfigThreat).toBeDefined();
      expect(misconfigThreat?.severity).toBe("medium");
    });
  });

  describe("Compliance Checking", () => {
    it("should verify GDPR compliance", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.compliance.gdpr).toMatchObject({
        isCompliant: true,
        complianceScore: 100,
        violations: [],
        lastAudit: expect.any(Date),
        nextAuditDue: expect.any(Date),
      });
    });

    it("should detect GDPR violations", async () => {
      mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
        isCompliant: false,
        violations: ["Data processing violation"],
        recommendations: ["Fix data processing"],
        validatedAt: new Date(),
      });

      const status = await monitor.assessSecurityPosture();

      expect(status.compliance.gdpr.isCompliant).toBe(false);
      expect(status.compliance.gdpr.violations.length).toBeGreaterThan(0);
    });

    it("should verify data residency compliance in EU region", async () => {
      process.env.AWS_REGION = "eu-central-1";

      const status = await monitor.assessSecurityPosture();

      expect(status.compliance.dataResidency.isCompliant).toBe(true);
      expect(status.compliance.dataResidency.complianceScore).toBe(100);
    });

    it("should detect data residency violations outside EU", async () => {
      process.env.AWS_REGION = "us-east-1";

      const status = await monitor.assessSecurityPosture();

      expect(status.compliance.dataResidency.isCompliant).toBe(false);
      expect(status.compliance.dataResidency.violations.length).toBeGreaterThan(
        0
      );
    });

    it("should verify audit trail compliance", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.compliance.auditTrail).toMatchObject({
        isCompliant: true,
        complianceScore: 100,
        violations: [],
      });
    });
  });

  describe("Security Recommendations", () => {
    it("should generate immediate recommendations for critical threats", async () => {
      mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(true);

      const status = await monitor.assessSecurityPosture();

      expect(status.recommendations.immediate.length).toBeGreaterThan(0);
      expect(status.recommendations.immediate[0].priority).toBe("critical");
    });

    it("should generate short-term recommendations for low security scores", async () => {
      // Make both routes unhealthy AND disable encryption to drop security score below 70
      mockMCPRouter.checkHealth = jest.fn().mockResolvedValue({
        isHealthy: false,
        lastCheck: new Date(),
        latency: 5000,
        errorRate: 0.5,
      });

      mockDirectBedrockClient.checkHealth = jest.fn().mockResolvedValue({
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: 5000,
        errorRate: 0.5,
      });

      // Disable encryption to further reduce security score
      mockFeatureFlags.getFlag = jest
        .fn()
        .mockImplementation((flag: string) => {
          if (flag === "mcp_encryption_enabled") return Promise.resolve(false);
          if (flag === "mcp_access_control_strict")
            return Promise.resolve(false);
          return Promise.resolve(true);
        });

      const status = await monitor.assessSecurityPosture();

      // Should have short-term recommendations due to low security scores
      expect(status.recommendations.shortTerm.length).toBeGreaterThan(0);
      expect(status.routes.mcp.securityScore).toBeLessThan(70);
    });

    it("should generate long-term recommendations for continuous improvement", async () => {
      const status = await monitor.assessSecurityPosture();

      expect(status.recommendations.longTerm.length).toBeGreaterThan(0);
      expect(
        status.recommendations.longTerm.some(
          (r) => r.id === "implement-continuous-monitoring"
        )
      ).toBe(true);
    });

    it("should generate compliance recommendations for violations", async () => {
      mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
        isCompliant: false,
        violations: ["Compliance violation"],
        recommendations: ["Fix violation"],
        validatedAt: new Date(),
      });

      const status = await monitor.assessSecurityPosture();

      const complianceRec = status.recommendations.immediate.find(
        (r) => r.id === "fix-compliance-violations"
      );
      expect(complianceRec).toBeDefined();
      expect(complianceRec?.priority).toBe("critical");
    });
  });

  describe("Security Metrics", () => {
    it("should track security metrics", async () => {
      await monitor.assessSecurityPosture();

      const metrics = monitor.getSecurityMetrics();

      expect(metrics).toMatchObject({
        totalAssessments: expect.any(Number),
        threatsDetected: expect.any(Number),
        threatsMitigated: expect.any(Number),
        complianceViolations: expect.any(Number),
      });
    });

    it("should increment assessment counter", async () => {
      const initialMetrics = monitor.getSecurityMetrics();
      await monitor.assessSecurityPosture();
      const updatedMetrics = monitor.getSecurityMetrics();

      expect(updatedMetrics.totalAssessments).toBe(
        initialMetrics.totalAssessments + 1
      );
    });

    it("should track detected threats", async () => {
      mockCircuitBreaker.isOpen = jest.fn().mockReturnValue(true);

      await monitor.assessSecurityPosture();
      const metrics = monitor.getSecurityMetrics();

      expect(metrics.threatsDetected).toBeGreaterThan(0);
    });

    it("should track compliance violations", async () => {
      mockGDPRValidator.validateHybridRouting = jest.fn().mockResolvedValue({
        isCompliant: false,
        violations: ["Violation"],
        recommendations: [],
        validatedAt: new Date(),
      });

      await monitor.assessSecurityPosture();
      const metrics = monitor.getSecurityMetrics();

      expect(metrics.complianceViolations).toBeGreaterThan(0);
    });
  });

  describe("Monitoring Status", () => {
    it("should return monitoring status", () => {
      expect(monitor.isMonitoringActive()).toBe(false);
    });

    it("should return last assessment time", async () => {
      expect(monitor.getLastAssessmentTime()).toBeNull();

      await monitor.assessSecurityPosture();

      expect(monitor.getLastAssessmentTime()).toBeInstanceOf(Date);
    });
  });
});
