/**
 * Compliance Integration for AI Orchestrator
 *
 * Integrates provider agreement compliance checks into the AI request flow
 * Ensures all AI requests are validated against provider agreements
 */

import { AuditTrailSystem } from "./audit-trail-system";
import { BasicLogger } from "./basic-logger";
import { ProviderAgreementCompliance } from "./provider-agreement-compliance";
import { AiRequest, AiResponse, Provider } from "./types";

export interface ComplianceCheckResult {
  allowed: boolean;
  provider: Provider;
  violations: string[];
  warnings: string[];
  complianceScore: number;
  agreementStatus: "active" | "expired" | "missing";
  lastVerified: string;
}

export interface ComplianceEnforcementConfig {
  enforceCompliance: boolean;
  blockOnViolations: boolean;
  blockOnExpiredAgreements: boolean;
  blockOnMissingAgreements: boolean;
  warningThresholdDays: number; // Days before agreement expiry to warn
  maxVerificationAgeDays: number; // Max days since last verification
}

/**
 * Compliance Integration Manager
 */
export class ComplianceIntegration {
  private logger: BasicLogger;
  private auditTrail: AuditTrailSystem;
  private config: ComplianceEnforcementConfig;
  private providerCompliance: ProviderAgreementCompliance;

  constructor(config: Partial<ComplianceEnforcementConfig> = {}) {
    this.logger = new BasicLogger("compliance-integration");
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
    });
    this.providerCompliance = new ProviderAgreementCompliance();

    this.config = {
      enforceCompliance: true,
      blockOnViolations: true,
      blockOnExpiredAgreements: true,
      blockOnMissingAgreements: true,
      warningThresholdDays: 30,
      maxVerificationAgeDays: 90,
      ...config,
    };
  }

  /**
   * Perform compliance check before AI request
   */
  async performComplianceCheck(
    request: AiRequest,
    provider: Provider,
    requestId: string
  ): Promise<ComplianceCheckResult> {
    const startTime = Date.now();

    try {
      // Get provider compliance status
      const complianceResult =
        await this.providerCompliance.verifyProviderCompliance(provider);

      const agreement = complianceResult.agreement;
      const violations = [...complianceResult.violations];
      const warnings = [...complianceResult.warnings];

      // Additional compliance checks
      let complianceScore = 100;
      let agreementStatus: ComplianceCheckResult["agreementStatus"] = "missing";

      if (agreement) {
        // Check agreement expiry
        const now = new Date();
        const expiryDate = new Date(agreement.expiryDate);
        const daysUntilExpiry =
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (now > expiryDate) {
          agreementStatus = "expired";
          violations.push(
            `Agreement expired ${Math.floor(-daysUntilExpiry)} days ago`
          );
          complianceScore -= 50;
        } else {
          agreementStatus = "active";

          // Warn if expiring soon
          if (daysUntilExpiry <= this.config.warningThresholdDays) {
            warnings.push(
              `Agreement expires in ${Math.floor(daysUntilExpiry)} days`
            );
            complianceScore -= 10;
          }
        }

        // Check verification age
        const lastVerified = new Date(agreement.lastVerified);
        const daysSinceVerification =
          (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceVerification > this.config.maxVerificationAgeDays) {
          warnings.push(
            `Agreement not verified in ${Math.floor(
              daysSinceVerification
            )} days`
          );
          complianceScore -= 15;
        }

        // Check core compliance requirements
        if (!agreement.noTrainingOnCustomerData) {
          violations.push(
            "Provider does not guarantee no training on customer data"
          );
          complianceScore -= 40;
        }

        if (!agreement.dataProcessingAgreement) {
          violations.push("No valid Data Processing Agreement");
          complianceScore -= 30;
        }

        if (!agreement.gdprCompliant) {
          violations.push("Provider is not GDPR compliant");
          complianceScore -= 25;
        }
      } else {
        violations.push(`No agreement found for provider: ${provider}`);
        complianceScore = 0;
      }

      // Determine if request should be allowed
      let allowed = true;

      if (this.config.enforceCompliance) {
        if (
          this.config.blockOnMissingAgreements &&
          agreementStatus === "missing"
        ) {
          allowed = false;
        }

        if (
          this.config.blockOnExpiredAgreements &&
          agreementStatus === "expired"
        ) {
          allowed = false;
        }

        if (this.config.blockOnViolations && violations.length > 0) {
          allowed = false;
        }
      }

      const result: ComplianceCheckResult = {
        allowed,
        provider,
        violations,
        warnings,
        complianceScore: Math.max(0, complianceScore),
        agreementStatus,
        lastVerified: agreement?.lastVerified || "never",
      };

      // Log compliance check to audit trail
      await this.auditTrail.logEvent({
        eventType: "compliance_check",
        requestId,
        provider,
        complianceStatus: allowed ? "compliant" : "violation",
        metadata: {
          complianceScore: result.complianceScore,
          agreementStatus: result.agreementStatus,
          violationsCount: violations.length,
          warningsCount: warnings.length,
          processingTimeMs: Date.now() - startTime,
        },
      });

      this.logger.info("Compliance check completed", {
        requestId,
        provider,
        allowed,
        complianceScore: result.complianceScore,
        violations: violations.length,
        warnings: warnings.length,
        processingTimeMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error("Compliance check failed", {
        requestId,
        provider,
        error: errorMessage,
      });

      // Log error to audit trail
      await this.auditTrail.logEvent({
        eventType: "compliance_check",
        requestId,
        provider,
        complianceStatus: "violation",
        error: {
          type: "compliance_check_error",
          message: errorMessage,
        },
      });

      // Return restrictive result on error
      return {
        allowed: false,
        provider,
        violations: [`Compliance check failed: ${errorMessage}`],
        warnings: [],
        complianceScore: 0,
        agreementStatus: "missing",
        lastVerified: "never",
      };
    }
  }

  /**
   * Enforce compliance for AI request
   */
  async enforceCompliance(
    request: AiRequest,
    provider: Provider,
    requestId: string
  ): Promise<void> {
    const complianceResult = await this.performComplianceCheck(
      request,
      provider,
      requestId
    );

    if (!complianceResult.allowed) {
      const errorMessage = `Compliance violation prevents AI request: ${complianceResult.violations.join(
        ", "
      )}`;

      // Record compliance violation
      await this.providerCompliance.recordViolation({
        providerId: provider,
        violationType:
          complianceResult.agreementStatus === "missing"
            ? "unauthorized_access"
            : complianceResult.agreementStatus === "expired"
            ? "agreement_expired"
            : "training_detected",
        severity: "high",
        description: `AI request blocked due to compliance violation`,
        evidence: `Request ID: ${requestId}, Violations: ${complianceResult.violations.join(
          ", "
        )}`,
      });

      throw new Error(errorMessage);
    }

    // Log warnings if any
    if (complianceResult.warnings.length > 0) {
      this.logger.warn("Compliance warnings detected", {
        requestId,
        provider,
        warnings: complianceResult.warnings,
      });
    }
  }

  /**
   * Wrap AI response with compliance metadata
   */
  async wrapResponseWithCompliance(
    response: AiResponse,
    complianceResult: ComplianceCheckResult
  ): Promise<AiResponse> {
    return {
      ...response,
      metadata: {
        ...response.metadata,
        compliance: {
          checked: true,
          score: complianceResult.complianceScore,
          agreementStatus: complianceResult.agreementStatus,
          lastVerified: complianceResult.lastVerified,
          violations: complianceResult.violations.length,
          warnings: complianceResult.warnings.length,
        },
      },
    };
  }

  /**
   * Get compliance summary for monitoring
   */
  async getComplianceSummary(): Promise<{
    overallCompliance: "compliant" | "warning" | "non_compliant";
    providers: Array<{
      provider: Provider;
      compliant: boolean;
      score: number;
      agreementStatus: string;
      lastVerified: string;
    }>;
    recentViolations: number;
    pendingActions: number;
  }> {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    const providerSummaries = [];
    let totalScore = 0;
    let compliantProviders = 0;

    for (const provider of providers) {
      const complianceResult =
        await this.providerCompliance.verifyProviderCompliance(provider);
      const agreement = complianceResult.agreement;

      let score = 100;
      if (complianceResult.violations.length > 0) {
        score = Math.max(0, 100 - complianceResult.violations.length * 25);
      }
      if (complianceResult.warnings.length > 0) {
        score = Math.max(0, score - complianceResult.warnings.length * 10);
      }

      const compliant = complianceResult.compliant && score >= 80;
      if (compliant) compliantProviders++;
      totalScore += score;

      providerSummaries.push({
        provider,
        compliant,
        score,
        agreementStatus: agreement
          ? new Date() > new Date(agreement.expiryDate)
            ? "expired"
            : "active"
          : "missing",
        lastVerified: agreement?.lastVerified || "never",
      });
    }

    const averageScore = totalScore / providers.length;
    const overallCompliance =
      averageScore >= 95
        ? "compliant"
        : averageScore >= 80
        ? "warning"
        : "non_compliant";

    // Get recent violations (last 7 days)
    const violations = this.providerCompliance.getAllViolations();
    const recentViolations = violations.filter((v) => {
      const violationDate = new Date(v.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return violationDate > weekAgo && v.status === "open";
    }).length;

    // Count pending actions (expiring agreements)
    const agreements = this.providerCompliance.getAllAgreements();
    const pendingActions = agreements.filter((a) => {
      const expiryDate = new Date(a.expiryDate);
      const daysUntilExpiry =
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length;

    return {
      overallCompliance,
      providers: providerSummaries,
      recentViolations,
      pendingActions,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ComplianceEnforcementConfig>): void {
    this.config = { ...this.config, ...newConfig };

    this.logger.info("Compliance configuration updated", {
      config: this.config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ComplianceEnforcementConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const complianceIntegration = new ComplianceIntegration();
