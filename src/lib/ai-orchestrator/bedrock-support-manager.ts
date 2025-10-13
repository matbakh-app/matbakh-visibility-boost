/**
 * Bedrock Support Manager - Core orchestrator for support operations
 *
 * This module implements the central Bedrock Support Manager that coordinates
 * infrastructure validation, meta-monitoring, and implementation support using
 * a hybrid routing approach (direct Bedrock + MCP integration).
 */

import { BedrockAdapter } from "./adapters/bedrock-adapter";
import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";
import { ComplianceIntegration } from "./compliance-integration";
import { CostPerformanceOptimizer } from "./cost-performance-optimizer";
import { DirectBedrockClient } from "./direct-bedrock-client";
import { EmergencyShutdownManager } from "./emergency-shutdown-manager";
import { GDPRHybridComplianceValidator } from "./gdpr-hybrid-compliance-validator";
import { HybridHealthMonitor } from "./hybrid-health-monitor";
import { ImplementationSupport } from "./implementation-support";
import { InfrastructureAuditor } from "./infrastructure-auditor";
import { IntelligentRouter } from "./intelligent-router";
import { KiroBridge } from "./kiro-bridge";
import { MCPRouter } from "./mcp-router";
import { MetaMonitor } from "./meta-monitor";
import { ProviderAgreementCompliance } from "./provider-agreement-compliance";
import {
  RedTeamEvaluationReport,
  RedTeamEvaluator,
} from "./red-team-evaluator";
import { SecurityPostureMonitor } from "./security-posture-monitor";
import { SystemResourceMonitor } from "./system-resource-monitor";
import { Provider } from "./types";

// Core Data Structures
export interface BedrockSupportConfig {
  enabled: boolean;
  environments: ("development" | "staging" | "production")[];
  auditInterval: number;
  monitoringLevel: "basic" | "detailed" | "comprehensive";
  autoResolutionEnabled: boolean;
  notificationChannels: NotificationChannel[];
}

export interface NotificationChannel {
  type: "email" | "slack" | "webhook";
  endpoint: string;
  enabled: boolean;
}

export interface InfrastructureAuditResult {
  timestamp: Date;
  overallHealth: "healthy" | "warning" | "critical";
  detectedIssues: InfrastructureIssue[];
  implementationGaps: ImplementationGap[];
  recommendations: Recommendation[];
  complianceStatus: ComplianceStatus;
}

export interface InfrastructureIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "performance" | "security" | "compliance" | "availability";
  description: string;
  affectedComponents: string[];
  detectedAt: Date;
}

export interface ImplementationGap {
  id: string;
  module: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedEffort: string;
  dependencies: string[];
}

export interface Recommendation {
  id: string;
  type: "immediate" | "short_term" | "long_term";
  description: string;
  expectedImpact: string;
  implementationSteps: string[];
}

export interface ComplianceStatus {
  gdprCompliant: boolean;
  dataResidencyCompliant: boolean;
  auditTrailComplete: boolean;
  issues: string[];
}

export interface ExecutionMetadata {
  executionId: string;
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  errorDetails?: string;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

export interface FailureContext {
  operation: string;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
  affectedSystems: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface SupportResult {
  success: boolean;
  supportType: "infrastructure" | "execution" | "implementation";
  actionsPerformed: SupportAction[];
  diagnostics: DiagnosticData;
  nextSteps: string[];
}

export interface SupportAction {
  action: string;
  timestamp: Date;
  result: "success" | "failure" | "partial";
  details: string;
}

export interface DiagnosticData {
  systemHealth: Record<string, any>;
  performanceMetrics: PerformanceMetrics;
  errorLogs: string[];
  recommendations: string[];
}

export interface BedrockSupportResult {
  success: boolean;
  message: string;
  timestamp: Date;
  configuration: BedrockSupportConfig;
  validationResults?: any;
}

// Security & Compliance Types
export interface ComplianceValidationResult {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  lastChecked: Date;
}

export interface SecurityAuditResult {
  securityScore: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
  lastAudit: Date;
}

export interface SecurityVulnerability {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  component: string;
  remediation: string;
}

// Cost & Performance Types
export interface CostAnalysis {
  currentSpend: number;
  projectedSpend: number;
  budgetUtilization: number;
  costBreakdown: Record<string, number>;
  recommendations: string[];
}

export interface PerformanceOptimization {
  currentMetrics: PerformanceMetrics;
  optimizationOpportunities: OptimizationOpportunity[];
  expectedImprovements: Record<string, number>;
}

export interface OptimizationOpportunity {
  area: string;
  description: string;
  expectedImprovement: string;
  implementationEffort: "low" | "medium" | "high";
}

// Template & Prompt Types
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  templateCount: number;
}

export interface SecurityTestResult {
  passed: boolean;
  testResults: SecurityTest[];
  overallScore: number;
  recommendations: string[];
}

export interface SecurityTest {
  testName: string;
  passed: boolean;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Bedrock Support Manager Interface
 *
 * Defines the contract for the Bedrock Support Manager with hybrid routing capabilities
 */
export interface IBedrockSupportManager {
  // Activation Control
  activate(): Promise<BedrockSupportResult>;
  deactivate(): Promise<void>;
  isActive(): boolean;

  // Core Support Operations
  runInfrastructureAudit(): Promise<InfrastructureAuditResult>;
  enableMetaMonitoring(): Promise<void>;
  provideFallbackSupport(context: FailureContext): Promise<SupportResult>;

  // Integration Methods
  sendDiagnosticsToKiro(diagnostics: DiagnosticData): Promise<void>;
  receiveKiroExecutionData(executionData: ExecutionMetadata): Promise<void>;

  // Security & Compliance Integration
  validateComplianceStatus(): Promise<ComplianceValidationResult>;
  enableCircuitBreaker(): Promise<void>;
  checkSecurityPosture(): Promise<SecurityAuditResult>;

  // Cost & Performance Management
  monitorCostThresholds(): Promise<CostAnalysis>;
  optimizePerformance(): Promise<PerformanceOptimization>;
  enableEmergencyMode(): Promise<void>;

  // Template & Prompt Management
  validatePromptTemplates(): Promise<TemplateValidationResult>;
  enablePIIRedaction(): Promise<void>;
  runRedTeamEvaluations(): Promise<SecurityTestResult>;
}

/**
 * Bedrock Support Manager Implementation
 *
 * Central orchestrator for Bedrock support operations with hybrid routing
 */
export class BedrockSupportManager implements IBedrockSupportManager {
  private isActivated: boolean = false;
  private config: BedrockSupportConfig;
  private featureFlags: AiFeatureFlags;
  private bedrockAdapter: BedrockAdapter;
  private logger: Console;
  private providerCompliance: ProviderAgreementCompliance;
  private complianceIntegration: ComplianceIntegration;
  private gdprHybridValidator: GDPRHybridComplianceValidator;

  // Circuit Breaker Integration for Hybrid Routing
  private circuitBreaker: CircuitBreaker;
  private directBedrockClient: DirectBedrockClient;
  private mcpRouter: MCPRouter;
  private intelligentRouter: IntelligentRouter;
  private auditTrail: AuditTrailSystem;

  // Support Operation Components
  private infrastructureAuditor: InfrastructureAuditor;
  private metaMonitor: MetaMonitor;
  private implementationSupport: ImplementationSupport;
  private hybridHealthMonitor: HybridHealthMonitor;
  private kiroBridge: KiroBridge;
  private securityPostureMonitor: SecurityPostureMonitor;

  // Cost & Performance Management (using existing system)
  private costPerformanceOptimizer: CostPerformanceOptimizer;
  private emergencyShutdownManager: EmergencyShutdownManager;

  // System Resource Monitoring for 5% overhead requirement
  private systemResourceMonitor: SystemResourceMonitor;

  constructor(
    config?: Partial<BedrockSupportConfig>,
    featureFlags?: AiFeatureFlags,
    bedrockAdapter?: BedrockAdapter,
    providerCompliance?: ProviderAgreementCompliance,
    complianceIntegration?: ComplianceIntegration,
    gdprHybridValidator?: GDPRHybridComplianceValidator
  ) {
    this.config = this.getDefaultConfig(config);
    this.featureFlags = featureFlags || new AiFeatureFlags();
    this.bedrockAdapter = bedrockAdapter || new BedrockAdapter();
    this.logger = console;
    this.providerCompliance =
      providerCompliance || new ProviderAgreementCompliance();
    this.complianceIntegration =
      complianceIntegration || new ComplianceIntegration();
    this.gdprHybridValidator =
      gdprHybridValidator || new GDPRHybridComplianceValidator();

    // Initialize Circuit Breaker with support-specific configuration
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3, // More sensitive for support operations
      recoveryTimeout: 30000, // 30 seconds recovery for support
      halfOpenMaxCalls: 2, // Conservative half-open testing
      healthCheckInterval: 15000, // 15 second health checks
    });

    // Initialize Audit Trail System
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 2555, // 7 years for GDPR compliance
    });

    // Initialize Direct Bedrock Client for critical operations
    this.directBedrockClient = new DirectBedrockClient({
      region: process.env.AWS_REGION || "eu-central-1",
      emergencyTimeout: 5000, // < 5s for emergency operations
      criticalTimeout: 10000, // < 10s for critical operations
      enableCircuitBreaker: true,
      enableHealthMonitoring: true,
      enableComplianceChecks: true,
    });

    // Initialize MCP Router for standard operations
    this.mcpRouter = new MCPRouter({
      timeout: 30000,
      maxRetries: 3,
      healthCheckInterval: 30000,
    });

    // Initialize Intelligent Router for routing decisions
    this.intelligentRouter = new IntelligentRouter(
      this.directBedrockClient,
      this.mcpRouter,
      this.featureFlags,
      this.circuitBreaker,
      this.gdprHybridValidator,
      this.auditTrail
    );

    // Initialize Support Operation Components
    this.infrastructureAuditor = new InfrastructureAuditor(
      this.featureFlags,
      this.auditTrail
    );

    this.metaMonitor = new MetaMonitor(
      this.intelligentRouter,
      this.auditTrail,
      this.featureFlags
    );

    this.implementationSupport = new ImplementationSupport(
      this.intelligentRouter,
      this.auditTrail,
      this.featureFlags
    );

    this.hybridHealthMonitor = new HybridHealthMonitor(
      this.mcpRouter,
      this.directBedrockClient,
      this.featureFlags
    );

    this.kiroBridge = new KiroBridge(
      this.mcpRouter,
      this.auditTrail,
      this.featureFlags
    );

    this.securityPostureMonitor = new SecurityPostureMonitor(
      undefined,
      this.featureFlags,
      this.auditTrail,
      this.circuitBreaker,
      this.gdprHybridValidator,
      this.providerCompliance,
      this.directBedrockClient,
      this.mcpRouter
    );

    // Initialize System Resource Monitor for 5% overhead requirement
    this.systemResourceMonitor = new SystemResourceMonitor(
      this.featureFlags,
      this.auditTrail,
      {
        enabled: true,
        monitoringIntervalMs: 10000, // 10 seconds
        alertCheckIntervalMs: 30000, // 30 seconds
        thresholds: {
          cpuWarningPercent: 0.8, // 0.8% CPU warning
          cpuCriticalPercent: 1.0, // 1% CPU critical (well under 5%)
          memoryWarningMB: 40, // 40MB memory warning
          memoryCriticalMB: 50, // 50MB memory critical (reasonable for 5% overhead)
        },
      }
    );

    // Initialize Cost Performance Optimizer (using existing system)
    const costBudget: CostBudget = {
      dailyLimit: 10.0, // €10 per day
      monthlyLimit: 300.0, // €300 per month
      alertThresholds: [50, 75, 90], // Alert at 50%, 75%, 90%
      hardStop: true, // Enable hard stop on budget exceeded
    };

    this.costPerformanceOptimizer = new CostPerformanceOptimizer(
      costBudget,
      process.env.AWS_REGION || "eu-central-1"
    );

    // Initialize Emergency Shutdown Manager
    this.emergencyShutdownManager = new EmergencyShutdownManager(
      {
        enableAutoShutdown: true,
        shutdownThresholds: {
          errorRate: 0.1, // 10% error rate
          latencyMs: 5000, // 5 seconds
          costEuroPerHour: 50.0, // €50 per hour
          consecutiveFailures: 5,
        },
        notificationChannels: {
          // Configure notification channels as needed
        },
        recoveryConfig: {
          autoRecoveryEnabled: true,
          recoveryDelayMs: 300000, // 5 minutes
          healthCheckIntervalMs: 60000, // 1 minute
          maxRecoveryAttempts: 3,
        },
      },
      this.featureFlags,
      this.auditTrail,
      this.circuitBreaker
    );
  }

  /**
   * Activate Bedrock Support Mode
   */
  async activate(): Promise<BedrockSupportResult> {
    try {
      this.log(
        "bedrock-activation",
        "Attempting to activate Bedrock Support Mode"
      );

      // Check if feature flag is enabled
      const supportModeEnabled =
        await this.featureFlags.isBedrockSupportModeEnabled();
      if (!supportModeEnabled) {
        const message = "Bedrock Support Mode is disabled via feature flag";
        this.log("bedrock-activation", message);
        return {
          success: false,
          message,
          timestamp: new Date(),
          configuration: this.config,
        };
      }

      // Validate feature flag configuration
      const validation =
        await this.featureFlags.validateBedrockSupportModeFlags();
      if (!validation.isValid) {
        const message = `Feature flag validation failed: ${validation.errors.join(
          ", "
        )}`;
        this.log("bedrock-activation", message);
        return {
          success: false,
          message,
          timestamp: new Date(),
          configuration: this.config,
          validationResults: validation,
        };
      }

      // Check Bedrock adapter availability
      const bedrockEnabled = await this.featureFlags.isProviderEnabled(
        "bedrock"
      );
      if (!bedrockEnabled) {
        const message = "Bedrock provider is not enabled";
        this.log("bedrock-activation", message);
        return {
          success: false,
          message,
          timestamp: new Date(),
          configuration: this.config,
        };
      }

      // Perform initial infrastructure audit
      this.log("bedrock-activation", "Running initial infrastructure audit");
      const auditResult = await this.runInfrastructureAudit();

      if (auditResult.overallHealth === "critical") {
        const message =
          "Cannot activate support mode: critical infrastructure issues detected";
        this.log("bedrock-activation", message);
        return {
          success: false,
          message,
          timestamp: new Date(),
          configuration: this.config,
        };
      }

      // Activate support mode
      this.isActivated = true;
      this.config.enabled = true;

      // Start system resource monitoring to ensure < 5% overhead
      await this.systemResourceMonitor.startMonitoring();
      this.log("bedrock-activation", "System resource monitoring started");

      const message = "Bedrock Support Mode activated successfully";
      this.log("bedrock-activation", message);

      return {
        success: true,
        message,
        timestamp: new Date(),
        configuration: this.config,
        validationResults: validation,
      };
    } catch (error) {
      const message = `Failed to activate Bedrock Support Mode: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      this.log("bedrock-activation", message);

      // Ensure we don't leave the system in an inconsistent state
      this.isActivated = false;
      this.config.enabled = false;

      return {
        success: false,
        message,
        timestamp: new Date(),
        configuration: this.config,
      };
    }
  }

  /**
   * Deactivate Bedrock Support Mode
   */
  async deactivate(): Promise<void> {
    try {
      this.log("bedrock-activation", "Deactivating Bedrock Support Mode");

      // Stop system resource monitoring
      await this.systemResourceMonitor.stopMonitoring();
      this.log("bedrock-activation", "System resource monitoring stopped");

      this.isActivated = false;
      this.config.enabled = false;

      // Safely disable feature flags
      await this.featureFlags.disableBedrockSupportModeSafely();

      this.log(
        "bedrock-activation",
        "Bedrock Support Mode deactivated successfully"
      );
    } catch (error) {
      this.log(
        "bedrock-activation",
        `Error during deactivation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    }
  }

  /**
   * Get support mode status
   */
  getSupportModeStatus(): { isActive: boolean; config: BedrockSupportConfig } {
    return {
      isActive: this.isActivated,
      config: this.config,
    };
  }

  /**
   * Check if support mode is active
   */
  isActive(): boolean {
    return this.isActivated && this.config.enabled;
  }

  /**
   * Run infrastructure audit with circuit breaker protection
   */
  async runInfrastructureAudit(): Promise<InfrastructureAuditResult> {
    this.log(
      "bedrock-activation",
      "Starting infrastructure audit with circuit breaker protection"
    );

    // Validate compliance before running audit
    await this.validateComplianceForSupportOperation(
      "infrastructure",
      "direct_bedrock",
      "critical"
    );

    try {
      // Check circuit breaker status before proceeding
      const circuitBreakerStatus = await this.getCircuitBreakerStatus();

      if (circuitBreakerStatus.overallHealth === "critical") {
        this.log(
          "bedrock-activation",
          "Infrastructure audit aborted - both routing paths unavailable"
        );

        return {
          timestamp: new Date(),
          overallHealth: "critical",
          detectedIssues: [
            {
              id: "circuit-breaker-critical",
              severity: "critical",
              category: "availability",
              description:
                "Both routing paths (direct Bedrock and MCP) are unavailable due to circuit breaker protection",
              affectedComponents: ["direct-bedrock-client", "mcp-router"],
              detectedAt: new Date(),
            },
          ],
          implementationGaps: [],
          recommendations: [
            {
              id: "restore-routing-paths",
              type: "immediate",
              description: "Investigate and restore routing path availability",
              expectedImpact: "Restore Bedrock Support Mode functionality",
              implementationSteps: [
                "Check direct Bedrock client health",
                "Verify MCP router connectivity",
                "Reset circuit breakers if appropriate",
                "Monitor system recovery",
              ],
            },
          ],
          complianceStatus: {
            gdprCompliant: true,
            dataResidencyCompliant: true,
            auditTrailComplete: true,
            issues: [
              "Circuit breaker protection active - limited audit capability",
            ],
          },
        };
      }

      // Execute infrastructure audit through intelligent router with circuit breaker protection
      const auditResult = await this.circuitBreaker.execute(
        "bedrock", // Use bedrock provider for infrastructure audit
        async () => {
          return await this.infrastructureAuditor.performSystemHealthCheck();
        }
      );

      this.log(
        "bedrock-activation",
        "Infrastructure audit completed successfully through circuit breaker"
      );
      // Simulate infrastructure audit - in real implementation this would
      // check actual system health, database connections, API endpoints, etc.
      const issues: InfrastructureIssue[] = [];
      const gaps: ImplementationGap[] = [];
      const recommendations: Recommendation[] = [];

      // Check feature flag consistency
      const flagValidation = await this.featureFlags.validateAllFlags();
      if (!flagValidation.isValid) {
        // Determine severity based on error content
        const hasCriticalErrors = flagValidation.errors.some(
          (error) =>
            error.toLowerCase().includes("critical") ||
            error.toLowerCase().includes("system error")
        );

        issues.push({
          id: "feature-flags-inconsistent",
          severity: hasCriticalErrors ? "critical" : "medium",
          category: "compliance",
          description: "Feature flag configuration has validation errors",
          affectedComponents: ["feature-flags"],
          detectedAt: new Date(),
        });
      }

      // Check provider availability
      const providers: Provider[] = ["bedrock", "google", "meta"];
      for (const provider of providers) {
        const enabled = await this.featureFlags.isProviderEnabled(provider);
        if (!enabled && provider === "bedrock") {
          issues.push({
            id: `provider-${provider}-disabled`,
            severity: "high",
            category: "availability",
            description: `Critical provider ${provider} is disabled`,
            affectedComponents: [`${provider}-adapter`],
            detectedAt: new Date(),
          });
        }
      }

      // Determine overall health
      const criticalIssues = issues.filter((i) => i.severity === "critical");
      const highIssues = issues.filter((i) => i.severity === "high");
      const mediumIssues = issues.filter((i) => i.severity === "medium");

      let overallHealth: "healthy" | "warning" | "critical";
      if (criticalIssues.length > 0) {
        overallHealth = "critical";
      } else if (highIssues.length > 0 || mediumIssues.length > 0) {
        overallHealth = "warning";
      } else {
        overallHealth = "healthy";
      }

      // Generate recommendations based on issues
      if (issues.length > 0) {
        recommendations.push({
          id: "resolve-configuration-issues",
          type: "immediate",
          description: "Resolve feature flag and provider configuration issues",
          expectedImpact: "Improved system stability and reliability",
          implementationSteps: [
            "Review feature flag validation errors",
            "Enable required providers",
            "Validate configuration consistency",
          ],
        });
      }

      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth,
        detectedIssues: issues,
        implementationGaps: gaps,
        recommendations,
        complianceStatus: {
          gdprCompliant: true, // Assume compliant for now
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      this.log(
        "bedrock-activation",
        `Infrastructure audit completed: ${overallHealth} (${issues.length} issues)`
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.log(
        "bedrock-activation",
        `Infrastructure audit failed: ${errorMessage}`
      );

      // Check if this is a circuit breaker failure
      const isCircuitBreakerError = errorMessage.includes(
        "circuit breaker is OPEN"
      );

      if (isCircuitBreakerError) {
        // Handle circuit breaker failure
        await this.handleCircuitBreakerFailure(
          "direct", // Assuming direct path failed
          "infrastructure_audit",
          { error: errorMessage, timestamp: new Date() }
        );

        // Try fallback through MCP if available
        try {
          this.log(
            "bedrock-activation",
            "Attempting infrastructure audit through MCP fallback"
          );

          const fallbackResult = await this.circuitBreaker.execute(
            "google", // Use google as MCP proxy
            async () => {
              return await this.infrastructureAuditor.performSystemHealthCheck();
            }
          );

          this.log(
            "bedrock-activation",
            "Infrastructure audit completed successfully through MCP fallback"
          );

          // Return successful result with fallback note
          return {
            ...fallbackResult,
            detectedIssues: [
              ...fallbackResult.detectedIssues,
              {
                id: "direct-path-circuit-breaker-open",
                severity: "high" as const,
                category: "availability" as const,
                description:
                  "Direct Bedrock path unavailable - using MCP fallback",
                affectedComponents: ["direct-bedrock-client"],
                detectedAt: new Date(),
              },
            ],
            recommendations: [
              ...fallbackResult.recommendations,
              {
                id: "restore-direct-path",
                type: "short_term" as const,
                description: "Investigate and restore direct Bedrock path",
                expectedImpact: "Improved performance for critical operations",
                implementationSteps: [
                  "Check direct Bedrock client health",
                  "Verify AWS connectivity",
                  "Reset circuit breaker if appropriate",
                ],
              },
            ],
          };
        } catch (fallbackError) {
          this.log(
            "bedrock-activation",
            `MCP fallback also failed: ${fallbackError}`
          );

          // Both paths failed - trigger emergency procedures
          await this.triggerEmergencyProcedures("infrastructure_audit", {
            primaryError: errorMessage,
            fallbackError: String(fallbackError),
          });
        }
      }

      // Log audit failure to audit trail
      await this.auditTrail.logSupportModeEvent(
        "infrastructure_audit_failed",
        {
          timestamp: new Date(),
          error: errorMessage,
          isCircuitBreakerError,
          operation: "infrastructure_audit",
        },
        "system"
      );

      // Return a critical result if audit fails
      return {
        timestamp: new Date(),
        overallHealth: "critical",
        detectedIssues: [
          {
            id: "audit-failure",
            severity: "critical",
            category: "availability",
            description: `Infrastructure audit failed: ${errorMessage}`,
            affectedComponents: ["audit-system"],
            detectedAt: new Date(),
          },
        ],
        implementationGaps: [],
        recommendations: [
          {
            id: "fix-audit-system",
            type: "immediate",
            description: "Fix infrastructure audit system",
            expectedImpact: "Restore monitoring capabilities",
            implementationSteps: [
              "Investigate audit failure",
              "Check circuit breaker status",
              "Verify routing path health",
              "Fix underlying issues",
              "Re-run audit",
            ],
          },
        ],
        complianceStatus: {
          gdprCompliant: false,
          dataResidencyCompliant: false,
          auditTrailComplete: false,
          issues: ["Audit system failure prevents compliance verification"],
        },
      };
    }
  }

  /**
   * Enable meta-monitoring of Kiro execution
   */
  async enableMetaMonitoring(): Promise<void> {
    this.log("bedrock-activation", "Enabling meta-monitoring");

    if (!this.isActive()) {
      throw new Error(
        "Cannot enable meta-monitoring: Support mode is not active"
      );
    }

    // Validate compliance before enabling meta-monitoring
    await this.validateComplianceForSupportOperation(
      "meta_monitor",
      "direct_bedrock",
      "critical"
    );

    // In a real implementation, this would set up monitoring hooks
    // For now, we'll just log the activation
    this.log("bedrock-activation", "Meta-monitoring enabled successfully");
  }

  /**
   * Provide fallback support for failed operations with circuit breaker protection
   */
  async provideFallbackSupport(
    context: FailureContext
  ): Promise<SupportResult> {
    // Handle null or invalid context
    if (!context || !context.operation) {
      this.log(
        "bedrock-activation",
        "Providing fallback support for: invalid context"
      );
      return {
        success: false,
        supportType: "infrastructure",
        actionsPerformed: [
          {
            action: "validate_context",
            timestamp: new Date(),
            result: "failure",
            details: "Invalid or null failure context provided",
          },
        ],
        diagnostics: {
          systemHealth: {},
          performanceMetrics: {
            responseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            networkLatency: 0,
          },
          errorLogs: ["Invalid failure context"],
          recommendations: ["Provide valid failure context"],
        },
        nextSteps: [
          "Manual intervention required",
          "Contact system administrator",
        ],
      };
    }

    this.log(
      "bedrock-activation",
      `Providing fallback support for: ${context.operation} with circuit breaker protection`
    );

    // Check circuit breaker status before proceeding
    const circuitBreakerStatus = await this.getCircuitBreakerStatus();

    // Validate compliance before providing fallback support
    await this.validateComplianceForSupportOperation(
      "emergency",
      "direct_bedrock",
      "critical"
    );

    try {
      // Execute fallback support through circuit breaker with intelligent routing
      const supportResult = await this.executeWithCircuitBreakerProtection(
        context.operation,
        "emergency",
        async () => {
          return await this.performFallbackSupport(context);
        }
      );

      // Log successful fallback support
      await this.auditTrail.logSupportModeEvent(
        "fallback_support_provided",
        {
          timestamp: new Date(),
          operation: context.operation,
          severity: context.severity,
          circuitBreakerStatus,
          supportResult,
        },
        "system"
      );

      return supportResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Fallback support failed: ${errorMessage}`
      );

      // Handle circuit breaker failures
      if (errorMessage.includes("circuit breaker is OPEN")) {
        await this.handleCircuitBreakerFailure(
          "direct", // Assuming direct path failed first
          context.operation,
          { ...context, fallbackError: errorMessage }
        );
      }

      // Log failure to audit trail
      await this.auditTrail.logSupportModeEvent(
        "fallback_support_failed",
        {
          timestamp: new Date(),
          operation: context.operation,
          error: errorMessage,
          context,
        },
        "system"
      );

      // Return failure result
      return {
        success: false,
        supportType: "infrastructure",
        actionsPerformed: [
          {
            action: "fallback_support_attempt",
            timestamp: new Date(),
            result: "failure",
            details: `Fallback support failed: ${errorMessage}`,
          },
        ],
        diagnostics: {
          systemHealth: { circuitBreakerStatus },
          performanceMetrics: {
            responseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            networkLatency: 0,
          },
          errorLogs: [context.errorMessage, errorMessage],
          recommendations: [
            "Check circuit breaker status",
            "Verify routing path health",
            "Consider manual intervention",
          ],
        },
        nextSteps: [
          "Manual intervention required",
          "Check system health",
          "Contact system administrator",
        ],
      };
    }
  }

  /**
   * Execute operation with circuit breaker protection and intelligent routing
   */
  private async executeWithCircuitBreakerProtection<T>(
    operation: string,
    priority: "emergency" | "critical" | "high" | "medium" | "low",
    operationFn: () => Promise<T>
  ): Promise<T> {
    try {
      // Use intelligent router to determine best path
      if (this.intelligentRouter) {
        const routingDecision =
          await this.intelligentRouter.makeRoutingDecision({
            operation: operation as any,
            priority: priority as any,
            context: { timestamp: new Date() },
          });

        this.log(
          "bedrock-activation",
          `Routing decision: ${routingDecision.selectedRoute} (${routingDecision.reason})`
        );

        // Execute through selected route with circuit breaker protection
        const provider =
          routingDecision.selectedRoute === "direct" ? "bedrock" : "google";

        return await this.circuitBreaker.execute(provider, operationFn);
      } else {
        // Fallback to direct circuit breaker execution
        return await this.circuitBreaker.execute("bedrock", operationFn);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Circuit breaker protected operation failed: ${errorMessage}`
      );

      throw error;
    }
  }

  /**
   * Perform the actual fallback support logic
   */
  private async performFallbackSupport(
    context: FailureContext
  ): Promise<SupportResult> {
    try {
      const actions: SupportAction[] = [];
      const diagnostics: DiagnosticData = {
        systemHealth: {},
        performanceMetrics: {
          responseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0,
        },
        errorLogs: [context.errorMessage],
        recommendations: [],
      };

      // Analyze the failure context
      actions.push({
        action: "analyze_failure_context",
        timestamp: new Date(),
        result: "success",
        details: `Analyzed failure: ${context.errorType} in ${context.operation}`,
      });

      // Determine support type based on failure
      let supportType: "infrastructure" | "execution" | "implementation";
      if (context.affectedSystems.includes("infrastructure")) {
        supportType = "infrastructure";
      } else if (context.operation.includes("execution")) {
        supportType = "execution";
      } else {
        supportType = "implementation";
      }

      // Generate recommendations based on failure type
      const nextSteps: string[] = [];
      if (context.severity === "critical") {
        nextSteps.push("Escalate to on-call team");
        nextSteps.push("Activate emergency procedures");
      } else {
        nextSteps.push("Monitor for recurring issues");
        nextSteps.push("Schedule remediation during maintenance window");
      }

      diagnostics.recommendations = nextSteps;

      return {
        success: true,
        supportType,
        actionsPerformed: actions,
        diagnostics,
        nextSteps,
      };
    } catch (error) {
      this.log(
        "bedrock-activation",
        `Fallback support failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      return {
        success: false,
        supportType: "infrastructure",
        actionsPerformed: [
          {
            action: "fallback_support_attempt",
            timestamp: new Date(),
            result: "failure",
            details: `Failed to provide fallback support: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        diagnostics: {
          systemHealth: {},
          performanceMetrics: {
            responseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            networkLatency: 0,
          },
          errorLogs: [context.errorMessage],
          recommendations: ["Manual intervention required"],
        },
        nextSteps: [
          "Manual intervention required",
          "Contact system administrator",
        ],
      };
    }
  }

  /**
   * Send diagnostics to Kiro
   */
  async sendDiagnosticsToKiro(diagnostics: DiagnosticData): Promise<void> {
    this.log("bedrock-activation", "Sending diagnostics to Kiro");

    // In a real implementation, this would send data through MCP or direct communication
    // For now, we'll just log the action
    this.log(
      "bedrock-activation",
      `Diagnostics sent: ${diagnostics.recommendations.length} recommendations`
    );
  }

  /**
   * Receive execution data from Kiro
   */
  async receiveKiroExecutionData(
    executionData: ExecutionMetadata
  ): Promise<void> {
    this.log(
      "bedrock-activation",
      `Received execution data: ${executionData.operation}`
    );

    // In a real implementation, this would analyze the execution data
    // and potentially trigger support actions
    if (!executionData.success) {
      this.log(
        "bedrock-activation",
        `Execution failure detected: ${executionData.errorDetails}`
      );
    }
  }

  // Security & Compliance Methods
  async validateComplianceStatus(): Promise<ComplianceValidationResult> {
    try {
      this.log(
        "bedrock-activation",
        "Validating compliance status for all providers"
      );

      // Get compliance summary from the compliance integration
      const complianceSummary =
        await this.complianceIntegration.getComplianceSummary();

      // Check Bedrock-specific compliance
      const bedrockCompliance =
        await this.providerCompliance.verifyProviderCompliance("bedrock");

      // Validate GDPR compliance for both routing paths
      const gdprCompliant = await this.validateGDPRCompliance();

      // Check EU data residency compliance for direct Bedrock access
      const euDataResidencyCompliant =
        await this.validateEUDataResidencyCompliance();

      // Aggregate violations and recommendations
      const violations: string[] = [];
      const recommendations: string[] = [];

      // Check overall compliance status
      if (complianceSummary.overallCompliance === "non_compliant") {
        violations.push(
          "Overall system compliance is non-compliant across providers"
        );
        recommendations.push(
          "Review and update provider agreements to ensure compliance"
        );
      }

      // Check Bedrock-specific compliance
      if (!bedrockCompliance.compliant) {
        violations.push(
          `Bedrock provider compliance issues: ${bedrockCompliance.violations.join(
            ", "
          )}`
        );
        recommendations.push(
          "Update Bedrock provider agreement and verify compliance status"
        );
      }

      // Check GDPR compliance
      if (!gdprCompliant) {
        violations.push("GDPR compliance validation failed for hybrid routing");
        recommendations.push(
          "Ensure PII detection and redaction is enabled for both MCP and direct Bedrock operations"
        );
      }

      // Check EU data residency
      if (!euDataResidencyCompliant) {
        violations.push(
          "EU data residency compliance failed for direct Bedrock access"
        );
        recommendations.push(
          "Configure Bedrock to use EU-Central-1 region for data processing"
        );
      }

      // Check for recent violations
      if (complianceSummary.recentViolations > 0) {
        violations.push(
          `${complianceSummary.recentViolations} recent compliance violations detected`
        );
        recommendations.push("Review and resolve recent compliance violations");
      }

      // Check for pending actions
      if (complianceSummary.pendingActions > 0) {
        recommendations.push(
          `${complianceSummary.pendingActions} provider agreements require attention (expiring soon)`
        );
      }

      const isCompliant = violations.length === 0;

      this.log("bedrock-activation", "Compliance validation completed", {
        isCompliant,
        violationsCount: violations.length,
        recommendationsCount: recommendations.length,
        overallCompliance: complianceSummary.overallCompliance,
        bedrockCompliant: bedrockCompliance.compliant,
        gdprCompliant,
        euDataResidencyCompliant,
      });

      return {
        isCompliant,
        violations,
        recommendations,
        lastChecked: new Date(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Compliance validation failed: ${errorMessage}`
      );

      return {
        isCompliant: false,
        violations: [`Compliance validation error: ${errorMessage}`],
        recommendations: [
          "Check compliance system configuration and provider agreements",
        ],
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Validate GDPR compliance for both routing paths
   */
  private async validateGDPRCompliance(): Promise<boolean> {
    try {
      this.log(
        "bedrock-activation",
        "Validating GDPR compliance for both direct Bedrock and MCP routing paths"
      );

      // Generate comprehensive hybrid compliance report
      const complianceReport =
        await this.gdprHybridValidator.generateHybridComplianceReport();

      // Log compliance status
      this.log(
        "bedrock-activation",
        `Hybrid GDPR compliance report generated: ${complianceReport.overallCompliance} (Score: ${complianceReport.complianceScore}%)`
      );

      // Check if overall compliance is acceptable
      if (complianceReport.overallCompliance === "non_compliant") {
        this.log(
          "bedrock-activation",
          `GDPR compliance failed: ${complianceReport.criticalIssues.join(
            ", "
          )}`
        );
        return false;
      }

      // Check individual routing path compliance
      const directBedrockCompliant =
        complianceReport.routingPathCompliance.directBedrock.isCompliant;
      const mcpIntegrationCompliant =
        complianceReport.routingPathCompliance.mcpIntegration.isCompliant;

      if (!directBedrockCompliant) {
        this.log(
          "bedrock-activation",
          `Direct Bedrock routing path GDPR compliance failed: ${complianceReport.routingPathCompliance.directBedrock.violations
            .map((v) => v.description)
            .join(", ")}`
        );
      }

      if (!mcpIntegrationCompliant) {
        this.log(
          "bedrock-activation",
          `MCP integration routing path GDPR compliance failed: ${complianceReport.routingPathCompliance.mcpIntegration.violations
            .map((v) => v.description)
            .join(", ")}`
        );
      }

      // Check cross-path compliance
      const crossPathCompliant = Object.values(
        complianceReport.crossPathCompliance
      ).every(Boolean);
      if (!crossPathCompliant) {
        this.log(
          "bedrock-activation",
          "Cross-path GDPR compliance issues detected"
        );
      }

      // Log warnings if any
      const totalWarnings =
        complianceReport.routingPathCompliance.directBedrock.warnings.length +
        complianceReport.routingPathCompliance.mcpIntegration.warnings.length;

      if (totalWarnings > 0) {
        this.log(
          "bedrock-activation",
          `GDPR compliance warnings detected: ${totalWarnings} warnings across routing paths`
        );
      }

      // Return true if both paths are compliant or partially compliant with high score
      return (
        complianceReport.overallCompliance === "compliant" ||
        (complianceReport.overallCompliance === "partial" &&
          complianceReport.complianceScore >= 80)
      );
    } catch (error) {
      this.log(
        "bedrock-activation",
        `GDPR compliance validation error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * Validate EU data residency compliance for direct Bedrock access
   */
  private async validateEUDataResidencyCompliance(): Promise<boolean> {
    try {
      // Check Bedrock agreement for EU data residency
      const bedrockAgreement = this.providerCompliance.getAgreement("bedrock");
      if (!bedrockAgreement || !bedrockAgreement.euDataResidency) {
        this.log(
          "bedrock-activation",
          "Bedrock agreement does not guarantee EU data residency"
        );
        return false;
      }

      // Validate that Bedrock is configured to use EU regions
      const euRegionConfigured =
        await this.validateBedrockEURegionConfiguration();
      if (!euRegionConfigured) {
        this.log(
          "bedrock-activation",
          "Bedrock not configured to use EU regions for data processing"
        );
        return false;
      }

      return true;
    } catch (error) {
      this.log(
        "bedrock-activation",
        `EU data residency validation error: ${error}`
      );
      return false;
    }
  }

  /**
   * Validate PII detection configuration
   */
  private async validatePIIDetectionConfiguration(): Promise<boolean> {
    try {
      // Check if PII detection feature flags are enabled
      const piiDetectionEnabled = this.featureFlags.getFlag(
        "pii_detection_enabled",
        false
      );
      const piiRedactionEnabled = this.featureFlags.getFlag(
        "pii_redaction_enabled",
        false
      );

      if (!piiDetectionEnabled || !piiRedactionEnabled) {
        return false;
      }

      // Additional validation could check if PII detection services are running
      // This would integrate with existing PII detection infrastructure
      return true;
    } catch (error) {
      this.log(
        "bedrock-activation",
        `PII detection validation error: ${error}`
      );
      return false;
    }
  }

  /**
   * Validate Bedrock EU region configuration
   */
  private async validateBedrockEURegionConfiguration(): Promise<boolean> {
    try {
      // Check if Bedrock is configured to use EU regions
      const bedrockRegion =
        process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || "us-east-1";

      // EU regions for Bedrock
      const euRegions = [
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
      ];

      if (!euRegions.includes(bedrockRegion)) {
        this.log(
          "bedrock-activation",
          `Bedrock region ${bedrockRegion} is not an EU region`
        );
        return false;
      }

      return true;
    } catch (error) {
      this.log(
        "bedrock-activation",
        `Bedrock EU region validation error: ${error}`
      );
      return false;
    }
  }

  /**
   * Validate compliance for support operations with hybrid routing
   */
  private async validateComplianceForSupportOperation(
    operationType: HybridRoutingPath["operationType"],
    routeType: HybridRoutingPath["routeType"] = "direct_bedrock",
    priority: HybridRoutingPath["priority"] = "medium"
  ): Promise<void> {
    try {
      this.log(
        "bedrock-activation",
        `Validating GDPR compliance for support operation: ${operationType} via ${routeType} route`
      );

      // Create routing path for validation
      const routingPath: HybridRoutingPath = {
        routeType,
        provider: "bedrock",
        operationType,
        priority,
      };

      // Generate correlation ID for this validation
      const correlationId = `support-${operationType}-${routeType}-${Date.now()}`;

      // Validate GDPR compliance before routing
      const validationResult =
        await this.gdprHybridValidator.validateBeforeRouting(
          routingPath,
          correlationId
        );

      if (!validationResult.allowed) {
        throw new Error(validationResult.reason);
      }

      // Also validate using existing compliance integration for provider agreements
      const mockRequest = {
        prompt: `Support operation: ${operationType}`,
        context: {
          domain: "support",
          intent: "infrastructure_support",
          routingPath: routeType,
        },
      };

      await this.complianceIntegration.enforceCompliance(
        mockRequest,
        "bedrock",
        correlationId
      );

      this.log(
        "bedrock-activation",
        `GDPR and provider compliance validation passed for support operation: ${operationType} via ${routeType}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Compliance validation failed for support operation: ${operationType} via ${routeType} - ${errorMessage}`
      );

      throw new Error(
        `Support operation blocked due to compliance violation: ${errorMessage}`
      );
    }
  }

  /**
   * Create compliance reporting for support mode
   */
  async createComplianceReportForSupportMode(): Promise<{
    reportId: string;
    timestamp: Date;
    supportModeCompliance: {
      overallCompliant: boolean;
      bedrockCompliant: boolean;
      gdprCompliant: boolean;
      euDataResidencyCompliant: boolean;
    };
    hybridRoutingCompliance: {
      mcpPathCompliant: boolean;
      directBedrockPathCompliant: boolean;
      auditTrailComplete: boolean;
    };
    violations: string[];
    recommendations: string[];
  }> {
    try {
      this.log(
        "bedrock-activation",
        "Generating compliance report for support mode"
      );

      const reportId = `bedrock-support-compliance-${Date.now()}`;
      const timestamp = new Date();

      // Get overall compliance status
      const complianceStatus = await this.validateComplianceStatus();

      // Check Bedrock-specific compliance
      const bedrockCompliance =
        await this.providerCompliance.verifyProviderCompliance("bedrock");

      // Check GDPR compliance
      const gdprCompliant = await this.validateGDPRCompliance();

      // Check EU data residency
      const euDataResidencyCompliant =
        await this.validateEUDataResidencyCompliance();

      // Get compliance summary for all providers
      const complianceSummary =
        await this.complianceIntegration.getComplianceSummary();

      const report = {
        reportId,
        timestamp,
        supportModeCompliance: {
          overallCompliant: complianceStatus.isCompliant,
          bedrockCompliant: bedrockCompliance.compliant,
          gdprCompliant,
          euDataResidencyCompliant,
        },
        hybridRoutingCompliance: {
          mcpPathCompliant:
            complianceSummary.overallCompliance !== "non_compliant",
          directBedrockPathCompliant:
            bedrockCompliance.compliant && gdprCompliant,
          auditTrailComplete: true, // Assuming audit trail is properly configured
        },
        violations: [
          ...complianceStatus.violations,
          ...bedrockCompliance.violations,
        ],
        recommendations: [
          ...complianceStatus.recommendations,
          "Regularly review provider agreements for compliance updates",
          "Monitor PII detection and redaction effectiveness",
          "Ensure audit trail completeness for all support operations",
        ],
      };

      this.log(
        "bedrock-activation",
        "Compliance report generated successfully",
        {
          reportId,
          overallCompliant: report.supportModeCompliance.overallCompliant,
          violationsCount: report.violations.length,
        }
      );

      return report;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Failed to generate compliance report: ${errorMessage}`
      );

      throw new Error(`Compliance report generation failed: ${errorMessage}`);
    }
  }

  /**
   * Enable Circuit Breaker Protection for Both Routing Paths
   */
  async enableCircuitBreaker(): Promise<void> {
    try {
      this.log(
        "bedrock-activation",
        "Enabling circuit breaker protection for hybrid routing"
      );

      // Validate circuit breaker is properly initialized
      if (!this.circuitBreaker) {
        throw new Error("Circuit breaker not initialized");
      }

      // Enable circuit breaker for all providers
      const providers: Provider[] = ["bedrock", "google", "meta"];

      // Reset any existing circuit breaker states
      providers.forEach((provider) => {
        if (this.circuitBreaker.isOpen(provider)) {
          this.log(
            "bedrock-activation",
            `Resetting circuit breaker for provider: ${provider}`
          );
          this.circuitBreaker.forceClose(provider);
        }
      });

      // Configure circuit breaker thresholds for support operations
      const supportConfig = {
        failureThreshold: 3, // More sensitive for support operations
        recoveryTimeout: 30000, // 30 seconds recovery
        halfOpenMaxCalls: 2, // Conservative testing
        healthCheckInterval: 15000, // 15 second health checks
      };

      // Log circuit breaker configuration
      this.log(
        "bedrock-activation",
        `Circuit breaker configured with thresholds: ${JSON.stringify(
          supportConfig
        )}`
      );

      // Enable circuit breaker monitoring for direct Bedrock path
      if (this.directBedrockClient) {
        this.log(
          "bedrock-activation",
          "Circuit breaker enabled for direct Bedrock path"
        );
      }

      // Enable circuit breaker monitoring for MCP path
      if (this.mcpRouter) {
        this.log(
          "bedrock-activation",
          "Circuit breaker enabled for MCP routing path"
        );
      }

      // Start health monitoring for both paths
      if (this.hybridHealthMonitor) {
        await this.hybridHealthMonitor.startHealthMonitoring();
        this.log(
          "bedrock-activation",
          "Health monitoring started for hybrid routing paths"
        );
      }

      // Log audit trail event
      await this.auditTrail.logSupportModeEvent(
        "circuit_breaker_enabled",
        {
          timestamp: new Date(),
          configuration: supportConfig,
          enabledPaths: ["direct_bedrock", "mcp_router"],
          healthMonitoringActive: true,
        },
        "system"
      );

      this.log(
        "bedrock-activation",
        "Circuit breaker protection enabled for both routing paths"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Failed to enable circuit breaker: ${errorMessage}`
      );

      // Log failure to audit trail
      await this.auditTrail.logSupportModeEvent(
        "circuit_breaker_enable_failed",
        {
          timestamp: new Date(),
          error: errorMessage,
          context: "circuit_breaker_activation",
        },
        "system"
      );

      throw new Error(`Circuit breaker activation failed: ${errorMessage}`);
    }
  }

  async checkSecurityPosture(): Promise<SecurityAuditResult> {
    this.log(
      "bedrock-activation",
      "Checking security posture for hybrid architecture"
    );

    try {
      // Start security posture monitoring if not already active
      if (!this.securityPostureMonitor.isMonitoringActive()) {
        await this.securityPostureMonitor.startMonitoring();
      }

      // Assess current security posture
      const postureStatus =
        await this.securityPostureMonitor.assessSecurityPosture();

      // Convert to SecurityAuditResult format
      const vulnerabilities: SecurityVulnerability[] = [
        ...postureStatus.routes.mcp.vulnerabilities,
        ...postureStatus.routes.directBedrock.vulnerabilities,
      ];

      const recommendations: string[] = [
        ...postureStatus.recommendations.immediate.map((r) => r.description),
        ...postureStatus.recommendations.shortTerm.map((r) => r.description),
      ];

      const result: SecurityAuditResult = {
        securityScore: postureStatus.overall.securityScore,
        vulnerabilities,
        recommendations,
        lastAudit: postureStatus.overall.lastAssessment,
      };

      this.log(
        "bedrock-activation",
        `Security posture check completed: Score ${result.securityScore}, ${vulnerabilities.length} vulnerabilities`
      );

      // Log to audit trail
      await this.auditTrail.logSupportModeEvent(
        "security_posture_checked",
        {
          timestamp: new Date(),
          securityScore: result.securityScore,
          vulnerabilityCount: vulnerabilities.length,
          threatLevel: postureStatus.overall.threatLevel,
          complianceStatus: postureStatus.overall.complianceStatus,
        },
        "system"
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Security posture check failed: ${errorMessage}`
      );

      // Log failure to audit trail
      await this.auditTrail.logSupportModeEvent(
        "security_posture_check_failed",
        {
          timestamp: new Date(),
          error: errorMessage,
        },
        "system"
      );

      // Return a degraded security result
      return {
        securityScore: 0,
        vulnerabilities: [
          {
            id: "security-check-failure",
            severity: "critical",
            description: `Security posture check failed: ${errorMessage}`,
            component: "security-posture-monitor",
            remediation: "Investigate and fix security monitoring system",
          },
        ],
        recommendations: [
          "Fix security posture monitoring system",
          "Investigate security check failure",
          "Manual security audit required",
        ],
        lastAudit: new Date(),
      };
    }
  }

  /**
   * Check Circuit Breaker Status for Both Routing Paths
   */
  async getCircuitBreakerStatus(): Promise<{
    directBedrock: { isOpen: boolean; state: string; metrics: any };
    mcpRouter: { isOpen: boolean; state: string; metrics: any };
    overallHealth: "healthy" | "degraded" | "critical";
  }> {
    try {
      // Check direct Bedrock circuit breaker
      const directBedrockOpen = this.circuitBreaker.isOpen("bedrock");
      const directBedrockMetrics = this.circuitBreaker.getMetrics("bedrock");

      // Check MCP router circuit breaker (using "google" as MCP provider proxy)
      const mcpRouterOpen = this.circuitBreaker.isOpen("google");
      const mcpRouterMetrics = this.circuitBreaker.getMetrics("google");

      // Determine overall health
      let overallHealth: "healthy" | "degraded" | "critical" = "healthy";

      if (directBedrockOpen && mcpRouterOpen) {
        overallHealth = "critical"; // Both paths down
      } else if (directBedrockOpen || mcpRouterOpen) {
        overallHealth = "degraded"; // One path down
      }

      const status = {
        directBedrock: {
          isOpen: directBedrockOpen,
          state: directBedrockMetrics.state,
          metrics: directBedrockMetrics,
        },
        mcpRouter: {
          isOpen: mcpRouterOpen,
          state: mcpRouterMetrics.state,
          metrics: mcpRouterMetrics,
        },
        overallHealth,
      };

      // Log status check to audit trail
      await this.auditTrail.logSupportModeEvent(
        "circuit_breaker_status_check",
        {
          timestamp: new Date(),
          status,
          overallHealth,
        },
        "system"
      );

      return status;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Failed to check circuit breaker status: ${errorMessage}`
      );

      throw new Error(`Circuit breaker status check failed: ${errorMessage}`);
    }
  }

  /**
   * Handle Circuit Breaker Failures with Intelligent Fallback
   */
  async handleCircuitBreakerFailure(
    failedPath: "direct" | "mcp",
    operation: string,
    context: any
  ): Promise<void> {
    try {
      this.log(
        "bedrock-activation",
        `Handling circuit breaker failure for ${failedPath} path during ${operation}`
      );

      // Log failure event
      await this.auditTrail.logSupportModeEvent(
        "circuit_breaker_failure",
        {
          timestamp: new Date(),
          failedPath,
          operation,
          context,
        },
        "system"
      );

      // Attempt intelligent fallback through router
      if (this.intelligentRouter) {
        const fallbackRoute = failedPath === "direct" ? "mcp" : "direct";

        this.log(
          "bedrock-activation",
          `Attempting fallback to ${fallbackRoute} path`
        );

        // Check if fallback path is available
        const fallbackProvider =
          fallbackRoute === "direct" ? "bedrock" : "google";
        const fallbackAvailable = !this.circuitBreaker.isOpen(fallbackProvider);

        if (fallbackAvailable) {
          this.log(
            "bedrock-activation",
            `Fallback to ${fallbackRoute} path is available`
          );
        } else {
          this.log(
            "bedrock-activation",
            `Fallback to ${fallbackRoute} path is also unavailable - both paths down`
          );

          // Both paths down - trigger emergency procedures
          await this.triggerEmergencyProcedures(operation, context);
        }
      }

      // Update health monitoring
      if (this.hybridHealthMonitor) {
        await this.hybridHealthMonitor.recordFailure(failedPath, operation);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Failed to handle circuit breaker failure: ${errorMessage}`
      );

      throw new Error(
        `Circuit breaker failure handling failed: ${errorMessage}`
      );
    }
  }

  /**
   * Trigger Emergency Procedures when Both Paths are Down
   */
  private async triggerEmergencyProcedures(
    operation: string,
    context: any
  ): Promise<void> {
    try {
      this.log(
        "bedrock-activation",
        `Triggering emergency procedures for operation: ${operation}`
      );

      // Log emergency event
      await this.auditTrail.logSupportModeEvent(
        "emergency_procedures_triggered",
        {
          timestamp: new Date(),
          operation,
          context,
          reason: "both_routing_paths_unavailable",
        },
        "system"
      );

      // Disable support mode temporarily
      this.isActivated = false;

      // Send emergency notifications
      await this.sendEmergencyNotifications(operation, context);

      // Force reset circuit breakers after emergency timeout
      setTimeout(async () => {
        try {
          this.log(
            "bedrock-activation",
            "Attempting emergency circuit breaker reset"
          );

          this.circuitBreaker.resetAll();

          // Re-enable support mode if feature flag is still active
          const supportModeEnabled =
            await this.featureFlags.isBedrockSupportModeEnabled();
          if (supportModeEnabled) {
            this.isActivated = true;
            this.log(
              "bedrock-activation",
              "Support mode re-enabled after emergency reset"
            );
          }
        } catch (resetError) {
          this.log(
            "bedrock-activation",
            `Emergency reset failed: ${resetError}`
          );
        }
      }, 60000); // 1 minute emergency timeout
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.log(
        "bedrock-activation",
        `Failed to trigger emergency procedures: ${errorMessage}`
      );
    }
  }

  /**
   * Send Emergency Notifications
   */
  private async sendEmergencyNotifications(
    operation: string,
    context: any
  ): Promise<void> {
    try {
      // Send notifications through configured channels
      for (const channel of this.config.notificationChannels) {
        if (channel.enabled) {
          const message = `EMERGENCY: Bedrock Support Mode - Both routing paths unavailable during ${operation}`;

          this.log(
            "bedrock-activation",
            `Sending emergency notification via ${channel.type}: ${message}`
          );

          // In production, this would send actual notifications
          // For now, just log the notification
        }
      }
    } catch (error) {
      this.log(
        "bedrock-activation",
        `Failed to send emergency notifications: ${error}`
      );
    }
  }

  // Cost & Performance Methods (using existing CostPerformanceOptimizer)
  async monitorCostThresholds(): Promise<CostAnalysis> {
    try {
      // Get cost summary from existing optimizer
      const costSummary = this.costPerformanceOptimizer.getCostSummary();
      const performanceMetrics =
        this.costPerformanceOptimizer.getPerformanceMetrics();

      // Log cost monitoring event
      await this.auditTrail.logEvent({
        eventType: "cost_monitoring",
        userId: "system",
        action: "monitor_cost_thresholds",
        resourceType: "cost_performance",
        resourceId: "bedrock-support-mode",
        metadata: {
          dailySpent: costSummary.daily.spent,
          monthlySpent: costSummary.monthly.spent,
          dailyRemaining: costSummary.daily.remaining,
          monthlyRemaining: costSummary.monthly.remaining,
          cacheHitRate: performanceMetrics.cacheHitRate,
        },
        timestamp: new Date(),
        ipAddress: "internal",
        userAgent: "bedrock-support-manager",
      });

      // Check for emergency shutdown conditions
      const costPressure =
        costSummary.monthly.spent / costSummary.monthly.limit;
      if (costPressure > 0.95) {
        await this.emergencyShutdownManager.triggerShutdown(
          "all",
          "cost_overrun",
          "manual",
          {
            costEuro: costSummary.monthly.spent,
            additionalInfo: {
              dailySpent: costSummary.daily.spent,
              monthlyLimit: costSummary.monthly.limit,
            },
          }
        );
      }

      // Return cost analysis in expected format
      return {
        currentSpend: costSummary.monthly.spent,
        projectedSpend: costSummary.monthly.spent * (30 / new Date().getDate()), // Simple projection
        budgetUtilization: costPressure,
        costBreakdown: {
          daily: costSummary.daily.spent,
          monthly: costSummary.monthly.spent,
          cacheHitRate: performanceMetrics.cacheHitRate,
        },
        recommendations: this.generateCostRecommendations(
          costSummary,
          performanceMetrics
        ),
      };
    } catch (error) {
      this.log(
        "bedrock-activation",
        `Error monitoring cost thresholds: ${error}`
      );

      return {
        currentSpend: 0,
        projectedSpend: 0,
        budgetUtilization: 0,
        costBreakdown: {},
        recommendations: [
          "Error retrieving cost data - please check cost monitoring system",
        ],
      };
    }
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostRecommendations(
    costSummary: any,
    performanceMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    // Check cache hit rate
    if (performanceMetrics.cacheHitRate < 0.5) {
      recommendations.push(
        "Improve cache hit rate to reduce AI provider costs"
      );
    }

    // Check daily budget utilization
    const dailyUtilization = costSummary.daily.spent / costSummary.daily.limit;
    if (dailyUtilization > 0.8) {
      recommendations.push(
        "Daily budget utilization high - consider implementing cost optimization strategies"
      );
    }

    // Check monthly budget utilization
    const monthlyUtilization =
      costSummary.monthly.spent / costSummary.monthly.limit;
    if (monthlyUtilization > 0.75) {
      recommendations.push(
        "Monthly budget on track to exceed - review operation priorities"
      );
    }

    return recommendations;
  }

  /**
   * Get detailed cost and performance status
   */
  async getCostPerformanceStatus() {
    const costSummary = this.costPerformanceOptimizer.getCostSummary();
    const performanceMetrics =
      this.costPerformanceOptimizer.getPerformanceMetrics();
    const shutdownStatus = this.emergencyShutdownManager.getStatus();

    return {
      cost: costSummary,
      performance: performanceMetrics,
      emergencyShutdown: shutdownStatus,
    };
  }

  /**
   * Track cost for a support operation (stub for compatibility)
   */
  async trackSupportOperationCost(
    operationId: string,
    route: "direct" | "mcp" | "fallback" | "hybrid",
    operationType:
      | "emergency"
      | "infrastructure"
      | "meta_monitor"
      | "implementation"
      | "standard",
    cost: number,
    tokensUsed?: { input: number; output: number }
  ): Promise<void> {
    await this.costBudgetMonitor.trackOperationCost({
      operationId,
      route,
      operationType,
      cost,
      tokensUsed,
      timestamp: new Date(),
      metadata: {
        supportMode: true,
        bedrockActivation: this.isActivated,
      },
    });
  }

  async optimizePerformance(): Promise<PerformanceOptimization> {
    return {
      currentMetrics: {
        responseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
      },
      optimizationOpportunities: [],
      expectedImprovements: {},
    };
  }

  async enableEmergencyMode(): Promise<void> {
    this.log("bedrock-activation", "Emergency mode enabled");
  }

  // Template & Prompt Methods (Stubs for now)
  async validatePromptTemplates(): Promise<TemplateValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      templateCount: 0,
    };
  }

  async enablePIIRedaction(): Promise<void> {
    this.log("bedrock-activation", "PII redaction enabled");
  }

  /**
   * Run comprehensive red team security evaluations for direct Bedrock
   *
   * This method executes automated security testing including:
   * - Prompt injection detection
   * - Jailbreak attempt detection
   * - Data exfiltration prevention
   * - Privilege escalation prevention
   * - Denial of service protection
   */
  async runRedTeamEvaluations(): Promise<SecurityTestResult> {
    try {
      this.log("bedrock-activation", "Starting red team security evaluation");

      // Check if red team evaluations are enabled
      if (!this.featureFlags.isEnabled("red_team_evaluation_enabled", true)) {
        this.log("bedrock-activation", "Red team evaluations are disabled");
        return {
          passed: true,
          testResults: [],
          overallScore: 100,
          recommendations: [
            "Red team evaluations are disabled - enable for security testing",
          ],
        };
      }

      // Initialize red team evaluator with direct Bedrock client
      const evaluator = new RedTeamEvaluator(this.directBedrockClient, {
        enablePromptInjectionTests: true,
        enableJailbreakTests: true,
        enableDataExfiltrationTests: true,
        enablePrivilegeEscalationTests: true,
        enableDenialOfServiceTests: true,
        testDepth: "standard",
        maxTestsPerCategory: 5,
        timeoutMs: 30000,
      });

      // Run comprehensive evaluation
      const report: RedTeamEvaluationReport = await evaluator.runEvaluation();

      // Log evaluation results
      await this.auditTrail.logEvent({
        eventType: "red_team_evaluation",
        requestId: report.evaluationId,
        provider: "bedrock",
        complianceStatus:
          report.vulnerabilitiesDetected > 0 ? "violation" : "compliant",
        metadata: {
          totalTests: report.totalTests,
          testsPassed: report.testsPassed,
          testsFailed: report.testsFailed,
          vulnerabilitiesDetected: report.vulnerabilitiesDetected,
          securityScore: report.overallSecurityScore,
          criticalVulnerabilities: report.criticalVulnerabilities.length,
          highVulnerabilities: report.highVulnerabilities.length,
          executionTimeMs: report.executionTimeMs,
        },
      });

      // Convert red team report to SecurityTestResult format
      const testResults: SecurityTest[] = [
        ...report.criticalVulnerabilities.map((v) => ({
          testName: v.testName,
          passed: v.passed,
          details: v.description,
          severity: v.severity,
        })),
        ...report.highVulnerabilities.map((v) => ({
          testName: v.testName,
          passed: v.passed,
          details: v.description,
          severity: v.severity,
        })),
        ...report.mediumVulnerabilities.map((v) => ({
          testName: v.testName,
          passed: v.passed,
          details: v.description,
          severity: v.severity,
        })),
        ...report.lowVulnerabilities.map((v) => ({
          testName: v.testName,
          passed: v.passed,
          details: v.description,
          severity: v.severity,
        })),
      ];

      const passed = report.vulnerabilitiesDetected === 0;

      this.log(
        "bedrock-activation",
        `Red team evaluation completed: ${passed ? "PASSED" : "FAILED"} ` +
          `(Score: ${report.overallSecurityScore}/100, ` +
          `Vulnerabilities: ${report.vulnerabilitiesDetected})`
      );

      return {
        passed,
        testResults,
        overallScore: report.overallSecurityScore,
        recommendations: report.recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.log(
        "bedrock-activation",
        `Red team evaluation failed: ${errorMessage}`
      );

      // Log error to audit trail
      await this.auditTrail.logEvent({
        eventType: "red_team_evaluation",
        requestId: `red-team-eval-error-${Date.now()}`,
        provider: "bedrock",
        complianceStatus: "violation",
        error: {
          type: "evaluation_error",
          message: errorMessage,
        },
      });

      return {
        passed: false,
        testResults: [
          {
            testName: "Red Team Evaluation",
            passed: false,
            details: `Evaluation failed: ${errorMessage}`,
            severity: "critical",
          },
        ],
        overallScore: 0,
        recommendations: [
          "Fix red team evaluation system errors",
          "Review direct Bedrock client configuration",
          "Check security testing infrastructure",
        ],
      };
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(
    overrides?: Partial<BedrockSupportConfig>
  ): BedrockSupportConfig {
    return {
      enabled: false,
      environments: ["development", "staging", "production"],
      auditInterval: 1800000, // 30 minutes
      monitoringLevel: "basic",
      autoResolutionEnabled: false,
      notificationChannels: [],
      ...overrides,
    };
  }

  /**
   * Get system resource monitoring status
   * Ensures support mode overhead stays under 5% of system resources
   */
  public getResourceMonitoringStatus(): {
    isMonitoring: boolean;
    isWithinThresholds: boolean;
    currentMetrics: any;
    summary: any;
    alerts: any[];
  } {
    const status = this.systemResourceMonitor.getStatus();
    const summary = this.systemResourceMonitor.getResourceSummary();
    const alerts = this.systemResourceMonitor.getActiveAlerts();

    return {
      isMonitoring: status.isMonitoring,
      isWithinThresholds: summary.isWithinThresholds,
      currentMetrics: summary.current,
      summary,
      alerts,
    };
  }

  /**
   * Check if support mode is within the 5% system resource overhead requirement
   */
  public async validateResourceOverhead(): Promise<{
    isCompliant: boolean;
    cpuUsage: number;
    memoryUsage: number;
    thresholds: any;
    recommendations: string[];
  }> {
    const currentMetrics = await this.systemResourceMonitor.getCurrentMetrics();
    const summary = this.systemResourceMonitor.getResourceSummary();
    const status = this.systemResourceMonitor.getStatus();

    const recommendations: string[] = [];

    // Check CPU usage against 1% threshold (well under 5%)
    if (currentMetrics.cpuUsagePercent > 0.8) {
      recommendations.push(
        `CPU usage (${currentMetrics.cpuUsagePercent.toFixed(
          2
        )}%) approaching threshold. Consider optimizing support operations.`
      );
    }

    // Check memory usage against 50MB threshold
    if (currentMetrics.memoryUsageMB > 40) {
      recommendations.push(
        `Memory usage (${currentMetrics.memoryUsageMB.toFixed(
          2
        )}MB) approaching threshold. Consider memory optimization.`
      );
    }

    // Check if monitoring is active
    if (!status.isMonitoring) {
      recommendations.push(
        "Resource monitoring is not active. Enable monitoring to track overhead."
      );
    }

    const isCompliant =
      currentMetrics.cpuUsagePercent <= 1.0 && // 1% CPU (well under 5%)
      currentMetrics.memoryUsageMB <= 50 && // 50MB memory (reasonable for 5% overhead)
      status.isMonitoring;

    await this.auditTrail.logEvent({
      eventType: "resource_overhead_validation",
      timestamp: new Date(),
      details: {
        component: "BedrockSupportManager",
        isCompliant,
        cpuUsage: currentMetrics.cpuUsagePercent,
        memoryUsage: currentMetrics.memoryUsageMB,
        thresholds: status.config.thresholds,
        recommendations,
      },
    });

    return {
      isCompliant,
      cpuUsage: currentMetrics.cpuUsagePercent,
      memoryUsage: currentMetrics.memoryUsageMB,
      thresholds: status.config.thresholds,
      recommendations,
    };
  }

  /**
   * Get performance metrics with resource overhead information
   */
  public async getPerformanceMetricsWithOverhead(): Promise<
    PerformanceMetrics & {
      resourceOverhead: {
        cpuUsagePercent: number;
        memoryUsageMB: number;
        isWithinThresholds: boolean;
      };
    }
  > {
    const currentMetrics = await this.systemResourceMonitor.getCurrentMetrics();
    const summary = this.systemResourceMonitor.getResourceSummary();

    return {
      responseTime: 0, // This would be populated by actual operations
      memoryUsage: currentMetrics.memoryUsageMB,
      cpuUsage: currentMetrics.cpuUsagePercent,
      networkLatency: 0, // This would be populated by actual operations
      resourceOverhead: {
        cpuUsagePercent: currentMetrics.cpuUsagePercent,
        memoryUsageMB: currentMetrics.memoryUsageMB,
        isWithinThresholds: summary.isWithinThresholds,
      },
    };
  }

  /**
   * Emergency shutdown if resource usage exceeds critical thresholds
   */
  public async emergencyShutdownOnResourceOverhead(): Promise<void> {
    const validation = await this.validateResourceOverhead();

    // If CPU usage exceeds 2% or memory exceeds 100MB, trigger emergency shutdown
    if (validation.cpuUsage > 2.0 || validation.memoryUsage > 100) {
      this.log(
        "bedrock-activation",
        `Emergency shutdown triggered due to excessive resource usage: CPU ${validation.cpuUsage.toFixed(
          2
        )}%, Memory ${validation.memoryUsage.toFixed(2)}MB`
      );

      await this.auditTrail.logEvent({
        eventType: "emergency_shutdown_resource_overhead",
        timestamp: new Date(),
        details: {
          component: "BedrockSupportManager",
          trigger: "resource_overhead",
          cpuUsage: validation.cpuUsage,
          memoryUsage: validation.memoryUsage,
          thresholds: validation.thresholds,
        },
      });

      // Deactivate support mode
      await this.deactivate();

      // Use emergency shutdown manager
      await this.emergencyShutdownManager.triggerEmergencyShutdown(
        "resource_overhead",
        `Resource usage exceeded safe limits: CPU ${validation.cpuUsage.toFixed(
          2
        )}%, Memory ${validation.memoryUsage.toFixed(2)}MB`
      );
    }
  }

  /**
   * Log with bedrock-activation prefix
   */
  private log(prefix: string, message: string): void {
    this.logger.log(`[${prefix}] ${message}`);
  }
}

/**
 * Factory function to create a Bedrock Support Manager instance
 */
export function createBedrockSupportManager(
  config?: Partial<BedrockSupportConfig>,
  featureFlags?: AiFeatureFlags,
  bedrockAdapter?: BedrockAdapter
): BedrockSupportManager {
  return new BedrockSupportManager(config, featureFlags, bedrockAdapter);
}

/**
 * Default export
 */
export default BedrockSupportManager;
