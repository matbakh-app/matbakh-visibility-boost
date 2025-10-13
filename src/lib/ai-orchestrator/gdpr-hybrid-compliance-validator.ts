/**
 * GDPR Hybrid Compliance Validator
 *
 * Validates GDPR compliance for both direct Bedrock and MCP routing paths
 * in the Bedrock Support Manager hybrid architecture.
 */

import { GDPRComplianceValidator } from "../compliance/gdpr-compliance-validator";
import { AuditTrailSystem } from "./audit-trail-system";
import { BasicLogger } from "./basic-logger";
import { ComplianceIntegration } from "./compliance-integration";
import { ProviderAgreementCompliance } from "./provider-agreement-compliance";
import { Provider } from "./types";

export interface HybridRoutingPath {
  routeType: "direct_bedrock" | "mcp_integration";
  provider: Provider;
  operationType:
    | "emergency"
    | "infrastructure"
    | "meta_monitor"
    | "implementation"
    | "kiro_communication"
    | "standard_analysis"
    | "background_tasks";
  priority: "critical" | "high" | "medium" | "low";
}

export interface GDPRComplianceValidation {
  routingPath: HybridRoutingPath;
  isCompliant: boolean;
  complianceScore: number;
  violations: GDPRViolation[];
  warnings: GDPRWarning[];
  dataProcessingCompliance: DataProcessingCompliance;
  auditTrailCompliance: AuditTrailCompliance;
  timestamp: Date;
  correlationId: string;
}

export interface GDPRViolation {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "data_processing"
    | "data_storage"
    | "user_rights"
    | "consent"
    | "security"
    | "ai_operations";
  description: string;
  routingPath: "direct_bedrock" | "mcp_integration" | "both";
  remediation: string;
  gdprArticle: string;
}

export interface GDPRWarning {
  id: string;
  category:
    | "data_processing"
    | "data_storage"
    | "user_rights"
    | "consent"
    | "security"
    | "ai_operations";
  description: string;
  routingPath: "direct_bedrock" | "mcp_integration" | "both";
  recommendation: string;
}

export interface DataProcessingCompliance {
  lawfulBasisDocumented: boolean;
  purposeLimitationEnforced: boolean;
  dataMinimizationImplemented: boolean;
  consentManagementActive: boolean;
  piiDetectionEnabled: boolean;
  dataRetentionPoliciesActive: boolean;
  euDataResidencyCompliant: boolean;
}

export interface AuditTrailCompliance {
  auditLoggingEnabled: boolean;
  correlationIdTracking: boolean;
  routingPathLogged: boolean;
  complianceChecksLogged: boolean;
  dataProcessingActivitiesLogged: boolean;
  retentionPolicyCompliant: boolean;
  integrityCheckingEnabled: boolean;
}

export interface HybridComplianceReport {
  timestamp: Date;
  overallCompliance: "compliant" | "non_compliant" | "partial";
  complianceScore: number;
  routingPathCompliance: {
    directBedrock: GDPRComplianceValidation;
    mcpIntegration: GDPRComplianceValidation;
  };
  crossPathCompliance: {
    dataConsistency: boolean;
    auditTrailContinuity: boolean;
    consentPropagation: boolean;
    piiHandlingConsistency: boolean;
  };
  recommendations: string[];
  criticalIssues: string[];
  nextActions: Array<{
    action: string;
    priority: "low" | "medium" | "high" | "critical";
    dueDate: Date;
    routingPath: "direct_bedrock" | "mcp_integration" | "both";
  }>;
}

/**
 * GDPR Hybrid Compliance Validator
 */
export class GDPRHybridComplianceValidator {
  private logger: BasicLogger;
  private auditTrail: AuditTrailSystem;
  private gdprValidator: GDPRComplianceValidator;
  private complianceIntegration: ComplianceIntegration;
  private providerCompliance: ProviderAgreementCompliance;

  constructor() {
    this.logger = new BasicLogger("gdpr-hybrid-compliance-validator");
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 2555, // 7 years for GDPR compliance
    });
    this.gdprValidator = new GDPRComplianceValidator();
    this.complianceIntegration = new ComplianceIntegration();
    this.providerCompliance = new ProviderAgreementCompliance();
  }

  /**
   * Validate GDPR compliance for a specific routing path
   */
  async validateRoutingPathCompliance(
    routingPath: HybridRoutingPath,
    correlationId: string
  ): Promise<GDPRComplianceValidation> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      this.logger.info("Starting GDPR compliance validation", {
        routingPath: routingPath.routeType,
        provider: routingPath.provider,
        operationType: routingPath.operationType,
        correlationId,
      });

      // Validate provider agreement compliance
      const providerCompliance =
        await this.providerCompliance.verifyProviderCompliance(
          routingPath.provider
        );

      // Check for invalid provider
      if (routingPath.provider === "invalid" || !providerCompliance.agreement) {
        throw new Error(
          `Invalid or unsupported provider: ${routingPath.provider}`
        );
      }

      // Validate data processing compliance
      const dataProcessingCompliance =
        await this.validateDataProcessingCompliance(routingPath);

      // Validate audit trail compliance
      const auditTrailCompliance = await this.validateAuditTrailCompliance(
        routingPath
      );

      // Check routing-specific GDPR requirements
      const routingSpecificChecks = await this.performRoutingSpecificGDPRChecks(
        routingPath
      );

      // Collect violations and warnings
      const violations: GDPRViolation[] = [];
      const warnings: GDPRWarning[] = [];

      // Provider agreement violations
      if (!providerCompliance.compliant) {
        providerCompliance.violations.forEach((violation, index) => {
          violations.push({
            id: `provider-${index}`,
            severity: "high",
            category: "ai_operations",
            description: violation,
            routingPath: routingPath.routeType,
            remediation:
              "Update provider agreement or switch to compliant provider",
            gdprArticle: "Article 28 - Processor",
          });
        });
      }

      // Data processing violations
      if (!dataProcessingCompliance.lawfulBasisDocumented) {
        violations.push({
          id: "lawful-basis",
          severity: "critical",
          category: "data_processing",
          description: "No documented lawful basis for data processing",
          routingPath: routingPath.routeType,
          remediation: "Document lawful basis under GDPR Article 6",
          gdprArticle: "Article 6 - Lawfulness of processing",
        });
      }

      if (!dataProcessingCompliance.purposeLimitationEnforced) {
        violations.push({
          id: "purpose-limitation",
          severity: "high",
          category: "data_processing",
          description: "Purpose limitation not enforced in routing path",
          routingPath: routingPath.routeType,
          remediation: "Implement purpose limitation controls",
          gdprArticle: "Article 5(1)(b) - Purpose limitation",
        });
      }

      if (!dataProcessingCompliance.dataMinimizationImplemented) {
        violations.push({
          id: "data-minimization",
          severity: "high",
          category: "data_processing",
          description: "Data minimization not implemented",
          routingPath: routingPath.routeType,
          remediation: "Implement PII detection and data minimization",
          gdprArticle: "Article 5(1)(c) - Data minimisation",
        });
      }

      if (!dataProcessingCompliance.euDataResidencyCompliant) {
        violations.push({
          id: "eu-residency",
          severity: "critical",
          category: "data_storage",
          description: "EU data residency requirements not met",
          routingPath: routingPath.routeType,
          remediation: "Ensure all data processing occurs within EU regions",
          gdprArticle:
            "Article 44-49 - Transfers of personal data to third countries",
        });
      }

      // Audit trail violations
      if (!auditTrailCompliance.auditLoggingEnabled) {
        violations.push({
          id: "audit-logging",
          severity: "high",
          category: "security",
          description: "Audit logging not enabled for routing path",
          routingPath: routingPath.routeType,
          remediation: "Enable comprehensive audit logging",
          gdprArticle: "Article 30 - Records of processing activities",
        });
      }

      if (!auditTrailCompliance.routingPathLogged) {
        violations.push({
          id: "routing-audit",
          severity: "medium",
          category: "security",
          description: "Routing path decisions not logged in audit trail",
          routingPath: routingPath.routeType,
          remediation: "Log all routing decisions with correlation IDs",
          gdprArticle: "Article 30 - Records of processing activities",
        });
      }

      // Add warnings for non-critical issues
      if (!dataProcessingCompliance.piiDetectionEnabled) {
        warnings.push({
          id: "pii-detection",
          category: "ai_operations",
          description: "PII detection not enabled - potential privacy risk",
          routingPath: routingPath.routeType,
          recommendation: "Enable PII detection and redaction",
        });
      }

      if (!auditTrailCompliance.correlationIdTracking) {
        warnings.push({
          id: "correlation-tracking",
          category: "security",
          description: "Correlation ID tracking not implemented",
          routingPath: routingPath.routeType,
          recommendation:
            "Implement correlation ID tracking for request tracing",
        });
      }

      // Calculate compliance score
      const totalChecks = 12; // Total number of compliance checks
      const violationPenalty = violations.reduce((penalty, violation) => {
        switch (violation.severity) {
          case "critical":
            return penalty + 25;
          case "high":
            return penalty + 15;
          case "medium":
            return penalty + 10;
          case "low":
            return penalty + 5;
          default:
            return penalty;
        }
      }, 0);

      const complianceScore = Math.max(0, 100 - violationPenalty);
      const isCompliant = violations.length === 0 && complianceScore >= 95;

      const result: GDPRComplianceValidation = {
        routingPath,
        isCompliant,
        complianceScore,
        violations,
        warnings,
        dataProcessingCompliance,
        auditTrailCompliance,
        timestamp,
        correlationId,
      };

      // Log compliance validation to audit trail
      await this.auditTrail.logEvent({
        eventType: "gdpr_compliance_validation",
        requestId: correlationId,
        provider: routingPath.provider,
        complianceStatus: isCompliant ? "compliant" : "violation",
        metadata: {
          routingPath: routingPath.routeType,
          operationType: routingPath.operationType,
          complianceScore,
          violationsCount: violations.length,
          warningsCount: warnings.length,
          processingTimeMs: Date.now() - startTime,
        },
      });

      this.logger.info("GDPR compliance validation completed", {
        routingPath: routingPath.routeType,
        provider: routingPath.provider,
        isCompliant,
        complianceScore,
        violations: violations.length,
        warnings: warnings.length,
        correlationId,
        processingTimeMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error("GDPR compliance validation failed", {
        routingPath: routingPath.routeType,
        provider: routingPath.provider,
        error: errorMessage,
        correlationId,
      });

      // Log error to audit trail
      await this.auditTrail.logEvent({
        eventType: "gdpr_compliance_validation",
        requestId: correlationId,
        provider: routingPath.provider,
        complianceStatus: "violation",
        error: {
          type: "validation_error",
          message: errorMessage,
        },
      });

      // Return non-compliant result on error
      return {
        routingPath,
        isCompliant: false,
        complianceScore: 0,
        violations: [
          {
            id: "validation-error",
            severity: "critical",
            category: "security",
            description: `GDPR compliance validation failed: ${errorMessage}`,
            routingPath: routingPath.routeType,
            remediation: "Fix validation system and retry",
            gdprArticle:
              "Article 25 - Data protection by design and by default",
          },
        ],
        warnings: [],
        dataProcessingCompliance: {
          lawfulBasisDocumented: false,
          purposeLimitationEnforced: false,
          dataMinimizationImplemented: false,
          consentManagementActive: false,
          piiDetectionEnabled: false,
          dataRetentionPoliciesActive: false,
          euDataResidencyCompliant: false,
        },
        auditTrailCompliance: {
          auditLoggingEnabled: false,
          correlationIdTracking: false,
          routingPathLogged: false,
          complianceChecksLogged: false,
          dataProcessingActivitiesLogged: false,
          retentionPolicyCompliant: false,
          integrityCheckingEnabled: false,
        },
        timestamp,
        correlationId,
      };
    }
  }

  /**
   * Validate data processing compliance for routing path
   */
  private async validateDataProcessingCompliance(
    routingPath: HybridRoutingPath
  ): Promise<DataProcessingCompliance> {
    // Check if lawful basis is documented
    const lawfulBasisDocumented = await this.checkLawfulBasisDocumentation(
      routingPath
    );

    // Check purpose limitation enforcement
    const purposeLimitationEnforced = await this.checkPurposeLimitation(
      routingPath
    );

    // Check data minimization implementation
    const dataMinimizationImplemented = await this.checkDataMinimization(
      routingPath
    );

    // Check consent management
    const consentManagementActive = await this.checkConsentManagement(
      routingPath
    );

    // Check PII detection
    const piiDetectionEnabled = await this.checkPIIDetection(routingPath);

    // Check data retention policies
    const dataRetentionPoliciesActive = await this.checkDataRetentionPolicies(
      routingPath
    );

    // Check EU data residency
    const euDataResidencyCompliant = await this.checkEUDataResidency(
      routingPath
    );

    return {
      lawfulBasisDocumented,
      purposeLimitationEnforced,
      dataMinimizationImplemented,
      consentManagementActive,
      piiDetectionEnabled,
      dataRetentionPoliciesActive,
      euDataResidencyCompliant,
    };
  }

  /**
   * Validate audit trail compliance for routing path
   */
  private async validateAuditTrailCompliance(
    routingPath: HybridRoutingPath
  ): Promise<AuditTrailCompliance> {
    // Check audit logging
    const auditLoggingEnabled = await this.checkAuditLogging(routingPath);

    // Check correlation ID tracking
    const correlationIdTracking = await this.checkCorrelationIdTracking(
      routingPath
    );

    // Check routing path logging
    const routingPathLogged = await this.checkRoutingPathLogging(routingPath);

    // Check compliance checks logging
    const complianceChecksLogged = await this.checkComplianceChecksLogging(
      routingPath
    );

    // Check data processing activities logging
    const dataProcessingActivitiesLogged =
      await this.checkDataProcessingActivitiesLogging(routingPath);

    // Check retention policy compliance
    const retentionPolicyCompliant = await this.checkRetentionPolicyCompliance(
      routingPath
    );

    // Check integrity checking
    const integrityCheckingEnabled = await this.checkIntegrityChecking(
      routingPath
    );

    return {
      auditLoggingEnabled,
      correlationIdTracking,
      routingPathLogged,
      complianceChecksLogged,
      dataProcessingActivitiesLogged,
      retentionPolicyCompliant,
      integrityCheckingEnabled,
    };
  }

  /**
   * Perform routing-specific GDPR checks
   */
  private async performRoutingSpecificGDPRChecks(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    if (routingPath.routeType === "direct_bedrock") {
      return await this.validateDirectBedrockGDPRCompliance(routingPath);
    } else {
      return await this.validateMCPIntegrationGDPRCompliance(routingPath);
    }
  }

  /**
   * Validate direct Bedrock GDPR compliance
   */
  private async validateDirectBedrockGDPRCompliance(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if direct Bedrock access maintains GDPR compliance
    // This includes checking AWS Bedrock's GDPR compliance status
    const agreement = this.providerCompliance.getAgreement(
      routingPath.provider
    );

    if (!agreement) {
      return false;
    }

    // Verify AWS Bedrock specific GDPR requirements
    return (
      agreement.gdprCompliant &&
      agreement.euDataResidency &&
      agreement.noTrainingOnCustomerData &&
      agreement.dataProcessingAgreement
    );
  }

  /**
   * Validate MCP integration GDPR compliance
   */
  private async validateMCPIntegrationGDPRCompliance(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if MCP integration maintains GDPR compliance
    // This includes checking the MCP layer's compliance with GDPR
    const agreement = this.providerCompliance.getAgreement(
      routingPath.provider
    );

    if (!agreement) {
      return false;
    }

    // Verify MCP integration specific GDPR requirements
    // MCP should not add additional data processing that violates GDPR
    return agreement.gdprCompliant && agreement.dataProcessingAgreement;
  }

  // Individual compliance check methods
  private async checkLawfulBasisDocumentation(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if lawful basis is documented for this routing path
    // This would typically check configuration or database records
    return true; // Placeholder - implement actual check
  }

  private async checkPurposeLimitation(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if purpose limitation is enforced
    return true; // Placeholder - implement actual check
  }

  private async checkDataMinimization(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if data minimization is implemented
    return true; // Placeholder - implement actual check
  }

  private async checkConsentManagement(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if consent management is active
    return true; // Placeholder - implement actual check
  }

  private async checkPIIDetection(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if PII detection is enabled
    return true; // Placeholder - implement actual check
  }

  private async checkDataRetentionPolicies(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if data retention policies are active
    return true; // Placeholder - implement actual check
  }

  private async checkEUDataResidency(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if EU data residency is compliant
    const agreement = this.providerCompliance.getAgreement(
      routingPath.provider
    );
    return agreement?.euDataResidency || false;
  }

  private async checkAuditLogging(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if audit logging is enabled
    return true; // Placeholder - implement actual check
  }

  private async checkCorrelationIdTracking(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if correlation ID tracking is implemented
    return true; // Placeholder - implement actual check
  }

  private async checkRoutingPathLogging(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if routing path decisions are logged
    return true; // Placeholder - implement actual check
  }

  private async checkComplianceChecksLogging(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if compliance checks are logged
    return true; // Placeholder - implement actual check
  }

  private async checkDataProcessingActivitiesLogging(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if data processing activities are logged
    return true; // Placeholder - implement actual check
  }

  private async checkRetentionPolicyCompliance(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if retention policy is compliant
    return true; // Placeholder - implement actual check
  }

  private async checkIntegrityChecking(
    routingPath: HybridRoutingPath
  ): Promise<boolean> {
    // Check if integrity checking is enabled
    return true; // Placeholder - implement actual check
  }

  /**
   * Generate comprehensive hybrid compliance report
   */
  async generateHybridComplianceReport(): Promise<HybridComplianceReport> {
    const timestamp = new Date();
    const correlationId = `hybrid-compliance-${Date.now()}`;

    // Validate both routing paths
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

    const directBedrockCompliance = await this.validateRoutingPathCompliance(
      directBedrockPath,
      `${correlationId}-direct`
    );

    const mcpIntegrationCompliance = await this.validateRoutingPathCompliance(
      mcpIntegrationPath,
      `${correlationId}-mcp`
    );

    // Calculate overall compliance
    const averageScore =
      (directBedrockCompliance.complianceScore +
        mcpIntegrationCompliance.complianceScore) /
      2;
    const overallCompliance: HybridComplianceReport["overallCompliance"] =
      averageScore >= 95
        ? "compliant"
        : averageScore >= 80
        ? "partial"
        : "non_compliant";

    // Check cross-path compliance
    const crossPathCompliance = {
      dataConsistency: true, // Placeholder - implement actual check
      auditTrailContinuity: true, // Placeholder - implement actual check
      consentPropagation: true, // Placeholder - implement actual check
      piiHandlingConsistency: true, // Placeholder - implement actual check
    };

    // Generate recommendations
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];
    const nextActions: HybridComplianceReport["nextActions"] = [];

    // Collect critical issues and recommendations
    [directBedrockCompliance, mcpIntegrationCompliance].forEach(
      (compliance) => {
        compliance.violations.forEach((violation) => {
          if (violation.severity === "critical") {
            criticalIssues.push(
              `${violation.routingPath}: ${violation.description}`
            );
            nextActions.push({
              action: violation.remediation,
              priority: "critical",
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              routingPath: violation.routingPath,
            });
          }
        });

        compliance.warnings.forEach((warning) => {
          recommendations.push(
            `${warning.routingPath}: ${warning.recommendation}`
          );
        });
      }
    );

    // Add general recommendations
    if (averageScore < 100) {
      recommendations.push(
        "Implement comprehensive GDPR compliance monitoring"
      );
      recommendations.push("Regular compliance audits for both routing paths");
      recommendations.push("Staff training on GDPR requirements");
    }

    return {
      timestamp,
      overallCompliance,
      complianceScore: Math.round(averageScore),
      routingPathCompliance: {
        directBedrock: directBedrockCompliance,
        mcpIntegration: mcpIntegrationCompliance,
      },
      crossPathCompliance,
      recommendations,
      criticalIssues,
      nextActions,
    };
  }

  /**
   * Validate GDPR compliance before routing decision
   */
  async validateBeforeRouting(
    routingPath: HybridRoutingPath,
    correlationId: string
  ): Promise<{ allowed: boolean; reason: string }> {
    const compliance = await this.validateRoutingPathCompliance(
      routingPath,
      correlationId
    );

    if (!compliance.isCompliant) {
      const criticalViolations = compliance.violations.filter(
        (v) => v.severity === "critical"
      );
      if (criticalViolations.length > 0) {
        return {
          allowed: false,
          reason: `Critical GDPR violations: ${criticalViolations
            .map((v) => v.description)
            .join(", ")}`,
        };
      }
    }

    if (compliance.complianceScore < 80) {
      return {
        allowed: false,
        reason: `GDPR compliance score too low: ${compliance.complianceScore}%`,
      };
    }

    return {
      allowed: true,
      reason: "GDPR compliance validated",
    };
  }
}

// Export singleton instance
export const gdprHybridComplianceValidator =
  new GDPRHybridComplianceValidator();
