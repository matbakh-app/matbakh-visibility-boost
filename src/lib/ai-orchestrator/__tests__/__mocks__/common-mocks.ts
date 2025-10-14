/**
 * Common Mock Implementations
 *
 * Shared mock implementations for common dependencies used across
 * Bedrock Support Manager tests.
 */

import type { FeatureFlagValidationResult } from "../../ai-feature-flags";
import type { CircuitBreakerState } from "../../circuit-breaker";
import type {
  ComplianceValidationResult,
  ProviderComplianceResult,
} from "../../compliance-integration";
import type { GDPRComplianceReport } from "../../gdpr-hybrid-compliance-validator";

/**
 * Mock Factory for AI Feature Flags
 */
export class MockAiFeatureFlags {
  public isBedrockSupportModeEnabled = jest.fn();
  public validateBedrockSupportModeFlags = jest.fn();
  public isProviderEnabled = jest.fn();
  public validateAllFlags = jest.fn();
  public disableBedrockSupportModeSafely = jest.fn();
  public getFlag = jest.fn();
  public isEnabled = jest.fn();
  public getAllFlags = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Support mode enabled
    this.isBedrockSupportModeEnabled.mockResolvedValue(true);

    // Default: Valid flags
    this.validateBedrockSupportModeFlags.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    } as FeatureFlagValidationResult);

    // Default: All providers enabled
    this.isProviderEnabled.mockResolvedValue(true);

    // Default: All flags valid
    this.validateAllFlags.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    // Default: Successful disable
    this.disableBedrockSupportModeSafely.mockResolvedValue(undefined);

    // Default: Generic flag getter
    this.getFlag.mockImplementation((flagName: string, defaultValue: any) => {
      return defaultValue;
    });

    // Default: isEnabled alias
    this.isEnabled.mockImplementation((flagName: string, defaultValue: any) => {
      return defaultValue;
    });

    // Default: All flags
    this.getAllFlags.mockReturnValue({
      bedrock_support_mode: true,
      intelligent_routing_enabled: true,
      direct_bedrock_fallback_enabled: true,
    });
  }

  /**
   * Configure mock for disabled support mode
   */
  configureDisabled(): void {
    this.isBedrockSupportModeEnabled.mockResolvedValue(false);
    this.getAllFlags.mockReturnValue({
      bedrock_support_mode: false,
      intelligent_routing_enabled: false,
      direct_bedrock_fallback_enabled: false,
    });
  }

  /**
   * Configure mock for validation failures
   */
  configureValidationFailure(errors: string[]): void {
    this.validateBedrockSupportModeFlags.mockResolvedValue({
      isValid: false,
      errors,
      warnings: [],
    });

    this.validateAllFlags.mockResolvedValue({
      isValid: false,
      errors,
      warnings: [],
    });
  }

  /**
   * Configure mock for specific provider disabled
   */
  configureProviderDisabled(provider: string): void {
    this.isProviderEnabled.mockImplementation((p: string) => {
      return Promise.resolve(p !== provider);
    });
  }

  /**
   * Configure mock for warnings
   */
  configureWithWarnings(warnings: string[]): void {
    this.validateBedrockSupportModeFlags.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings,
    });
  }
}

/**
 * Mock Factory for Circuit Breaker
 */
export class MockCircuitBreaker {
  public canExecute = jest.fn();
  public isOpen = jest.fn();
  public isClosed = jest.fn();
  public isHalfOpen = jest.fn();
  public getState = jest.fn();
  public recordSuccess = jest.fn();
  public recordFailure = jest.fn();
  public reset = jest.fn();
  public forceOpen = jest.fn();
  public forceClose = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Circuit closed (healthy)
    this.canExecute.mockReturnValue(true);
    this.isOpen.mockReturnValue(false);
    this.isClosed.mockReturnValue(true);
    this.isHalfOpen.mockReturnValue(false);
    this.getState.mockReturnValue("closed" as CircuitBreakerState);

    // Default: Successful recording
    this.recordSuccess.mockReturnValue(undefined);
    this.recordFailure.mockReturnValue(undefined);
    this.reset.mockReturnValue(undefined);
    this.forceOpen.mockReturnValue(undefined);
    this.forceClose.mockReturnValue(undefined);
  }

  /**
   * Configure mock for open circuit (unhealthy)
   */
  configureOpen(): void {
    this.canExecute.mockReturnValue(false);
    this.isOpen.mockReturnValue(true);
    this.isClosed.mockReturnValue(false);
    this.isHalfOpen.mockReturnValue(false);
    this.getState.mockReturnValue("open");
  }

  /**
   * Configure mock for half-open circuit (recovering)
   */
  configureHalfOpen(): void {
    this.canExecute.mockReturnValue(true);
    this.isOpen.mockReturnValue(false);
    this.isClosed.mockReturnValue(false);
    this.isHalfOpen.mockReturnValue(true);
    this.getState.mockReturnValue("half-open");
  }

  /**
   * Configure mock for service-specific state
   */
  configureServiceState(service: string, state: CircuitBreakerState): void {
    this.isOpen.mockImplementation((s?: string) => {
      return s === service ? state === "open" : false;
    });

    this.canExecute.mockImplementation((s?: string) => {
      return s === service ? state !== "open" : true;
    });

    this.getState.mockImplementation((s?: string) => {
      return s === service ? state : "closed";
    });
  }
}

/**
 * Mock Factory for Compliance Integration
 */
export class MockComplianceIntegration {
  public validateCompliance = jest.fn();
  public enforceCompliance = jest.fn();
  public getComplianceSummary = jest.fn();
  public checkProviderCompliance = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Compliant
    this.validateCompliance.mockResolvedValue({
      compliant: true,
      violations: [],
      warnings: [],
      score: 100,
    } as ComplianceValidationResult);

    // Default: Allowed
    this.enforceCompliance.mockResolvedValue({
      allowed: true,
      reason: "Compliance requirements met",
    });

    // Default: All providers compliant
    this.getComplianceSummary.mockResolvedValue({
      overallCompliance: "compliant",
      providers: {
        bedrock: { compliant: true, violations: [], warnings: [] },
        google: { compliant: true, violations: [], warnings: [] },
        meta: { compliant: true, violations: [], warnings: [] },
      },
    });

    // Default: Provider compliant
    this.checkProviderCompliance.mockResolvedValue({
      compliant: true,
      violations: [],
      warnings: [],
    } as ProviderComplianceResult);
  }

  /**
   * Configure mock for compliance violations
   */
  configureViolations(violations: string[]): void {
    this.validateCompliance.mockResolvedValue({
      compliant: false,
      violations,
      warnings: [],
      score: 50,
    });

    this.enforceCompliance.mockResolvedValue({
      allowed: false,
      reason: `Compliance violations: ${violations.join(", ")}`,
    });
  }

  /**
   * Configure mock for specific provider non-compliant
   */
  configureProviderNonCompliant(provider: string, violations: string[]): void {
    this.checkProviderCompliance.mockImplementation((p: string) => {
      if (p === provider) {
        return Promise.resolve({
          compliant: false,
          violations,
          warnings: [],
        });
      }
      return Promise.resolve({
        compliant: true,
        violations: [],
        warnings: [],
      });
    });
  }

  /**
   * Configure mock with warnings
   */
  configureWithWarnings(warnings: string[]): void {
    this.validateCompliance.mockResolvedValue({
      compliant: true,
      violations: [],
      warnings,
      score: 85,
    });
  }
}

/**
 * Mock Factory for GDPR Hybrid Compliance Validator
 */
export class MockGDPRHybridComplianceValidator {
  public validateBeforeRouting = jest.fn();
  public generateHybridComplianceReport = jest.fn();
  public validateEUDataResidency = jest.fn();
  public checkPIIHandling = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Allowed
    this.validateBeforeRouting.mockResolvedValue({
      allowed: true,
      reason: "GDPR compliance validated",
    });

    // Default: Compliant report
    this.generateHybridComplianceReport.mockResolvedValue({
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
    } as GDPRComplianceReport);

    // Default: EU data residency met
    this.validateEUDataResidency.mockResolvedValue({
      compliant: true,
      region: "eu-central-1",
    });

    // Default: PII handling compliant
    this.checkPIIHandling.mockResolvedValue({
      compliant: true,
      piiDetected: false,
      redactionApplied: false,
    });
  }

  /**
   * Configure mock for GDPR violations
   */
  configureGDPRViolations(violations: string[]): void {
    this.validateBeforeRouting.mockResolvedValue({
      allowed: false,
      reason: `GDPR violations: ${violations.join(", ")}`,
    });

    this.generateHybridComplianceReport.mockResolvedValue({
      overallCompliance: "non-compliant",
      complianceScore: 40,
      routingPathCompliance: {
        directBedrock: {
          isCompliant: false,
          violations,
          warnings: [],
        },
        mcpIntegration: { isCompliant: true, violations: [], warnings: [] },
      },
      crossPathCompliance: {},
      recommendations: ["Address GDPR violations immediately"],
      criticalIssues: violations,
      nextActions: ["Review data handling procedures"],
    });
  }

  /**
   * Configure mock for EU data residency failure
   */
  configureNonEURegion(): void {
    this.validateEUDataResidency.mockResolvedValue({
      compliant: false,
      region: "us-east-1",
      reason: "Data processed outside EU",
    });
  }

  /**
   * Configure mock for PII detection
   */
  configurePIIDetected(): void {
    this.checkPIIHandling.mockResolvedValue({
      compliant: true,
      piiDetected: true,
      redactionApplied: true,
      piiTypes: ["email", "phone"],
    });
  }
}

/**
 * Mock Factory for Bedrock Adapter
 */
export class MockBedrockAdapter {
  public runInfrastructureCheck = jest.fn();
  public probe = jest.fn();
  public analyzeSystem = jest.fn();
  public getHealthStatus = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful infrastructure check
    this.runInfrastructureCheck.mockResolvedValue({
      success: true,
      status: "healthy",
      checks: [],
      timestamp: new Date(),
    });

    // Default: Successful probe
    this.probe.mockResolvedValue({
      success: true,
      response: "Probe successful",
      latency: 100,
    });

    // Default: Successful analysis
    this.analyzeSystem.mockResolvedValue({
      success: true,
      analysis: "System analysis complete",
      recommendations: [],
    });

    // Default: Healthy status
    this.getHealthStatus.mockResolvedValue({
      status: "healthy",
      latency: 100,
      errorRate: 0,
    });
  }

  /**
   * Configure mock for infrastructure issues
   */
  configureInfrastructureIssues(): void {
    this.runInfrastructureCheck.mockResolvedValue({
      success: false,
      status: "unhealthy",
      checks: [
        {
          name: "database",
          status: "failed",
          error: "Connection timeout",
        },
      ],
      timestamp: new Date(),
    });
  }

  /**
   * Configure mock for probe failure
   */
  configureProbeFailure(): void {
    this.probe.mockRejectedValue(new Error("Probe failed"));
  }
}

/**
 * Mock Factory for Kiro Bridge
 */
export class MockKiroBridge {
  public sendDiagnostics = jest.fn();
  public receiveExecutionData = jest.fn();
  public sendMessage = jest.fn();
  public getConnectionStatus = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful diagnostics send
    this.sendDiagnostics.mockResolvedValue({
      success: true,
      messageId: "diag-123",
      timestamp: new Date(),
    });

    // Default: Successful execution data receive
    this.receiveExecutionData.mockResolvedValue({
      success: true,
      processed: true,
    });

    // Default: Successful message send
    this.sendMessage.mockResolvedValue({
      success: true,
      messageId: "msg-456",
    });

    // Default: Connected
    this.getConnectionStatus.mockReturnValue({
      connected: true,
      lastActivity: new Date(),
    });
  }

  /**
   * Configure mock for disconnected state
   */
  configureDisconnected(): void {
    this.sendDiagnostics.mockRejectedValue(
      new Error("Kiro bridge disconnected")
    );
    this.sendMessage.mockRejectedValue(new Error("Kiro bridge disconnected"));
    this.getConnectionStatus.mockReturnValue({
      connected: false,
      lastActivity: new Date(Date.now() - 300000),
    });
  }

  /**
   * Configure mock for slow communication
   */
  configureSlow(): void {
    this.sendDiagnostics.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        success: true,
        messageId: "slow-diag-789",
        timestamp: new Date(),
      };
    });
  }
}

/**
 * Export all common mocks
 */
export const CommonMocks = {
  AiFeatureFlags: MockAiFeatureFlags,
  CircuitBreaker: MockCircuitBreaker,
  ComplianceIntegration: MockComplianceIntegration,
  GDPRHybridComplianceValidator: MockGDPRHybridComplianceValidator,
  BedrockAdapter: MockBedrockAdapter,
  KiroBridge: MockKiroBridge,
};
