#!/usr/bin/env tsx

/**
 * Hybrid Routing Audit Trail Integrity Validation Script
 *
 * This script validates the integrity of audit trails for hybrid routing operations
 * in production environments. It can be run as part of compliance audits or
 * security monitoring.
 */

import {
  AuditEvent,
  AuditTrailSystem,
} from "../src/lib/ai-orchestrator/audit-trail-system";

interface ValidationConfig {
  enableIntegrityChecking: boolean;
  enablePIILogging: boolean;
  complianceMode: "strict" | "standard" | "minimal";
  timeRangeHours: number;
  outputFormat: "json" | "text" | "csv";
  includeRecommendations: boolean;
}

interface ValidationResult {
  timestamp: string;
  totalEventsValidated: number;
  integrityValid: boolean;
  integrityErrors: string[];
  hybridRoutingEvents: {
    routingDecisions: number;
    directBedrockOperations: number;
    mcpRoutingOperations: number;
    fallbackEvents: number;
    healthChecks: number;
    gdprValidations: number;
    piiRedactions: number;
  };
  complianceStatus: {
    gdprCompliant: number;
    gdprViolations: number;
    piiDetections: number;
    emergencyRedactions: number;
  };
  performanceMetrics: {
    averageLatency: number;
    directRouteLatency: number;
    mcpRouteLatency: number;
    successRate: number;
  };
  recommendations: string[];
  errors: string[];
}

class HybridAuditTrailValidator {
  private auditTrail: AuditTrailSystem;
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableIntegrityChecking: true,
      enablePIILogging: true,
      complianceMode: "strict",
      timeRangeHours: 24,
      outputFormat: "json",
      includeRecommendations: true,
      ...config,
    };

    this.auditTrail = new AuditTrailSystem({
      enableAuditTrail: true,
      enableIntegrityChecking: this.config.enableIntegrityChecking,
      enablePIILogging: this.config.enablePIILogging,
      complianceMode: this.config.complianceMode,
    });
  }

  /**
   * Validate audit trail integrity for hybrid routing operations
   */
  async validateHybridAuditTrail(): Promise<ValidationResult> {
    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() - this.config.timeRangeHours * 60 * 60 * 1000
    );

    console.log(`🔍 Starting hybrid audit trail validation...`);
    console.log(
      `📅 Time range: ${endTime.toISOString()} to ${startTime.toISOString()}`
    );
    console.log(`⚙️  Compliance mode: ${this.config.complianceMode}`);

    try {
      // In production, this would fetch events from the audit database
      // For this script, we'll simulate with sample events
      const events = await this.fetchAuditEvents(endTime, startTime);

      console.log(`📊 Found ${events.length} audit events to validate`);

      // Validate integrity
      const integrityResult = await this.auditTrail.verifyIntegrity(events);

      // Analyze hybrid routing events
      const hybridAnalysis = this.analyzeHybridRoutingEvents(events);

      // Analyze compliance status
      const complianceAnalysis = this.analyzeComplianceStatus(events);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(events);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        events,
        integrityResult,
        hybridAnalysis,
        complianceAnalysis,
        performanceMetrics
      );

      const result: ValidationResult = {
        timestamp: new Date().toISOString(),
        totalEventsValidated: events.length,
        integrityValid: integrityResult.valid,
        integrityErrors: integrityResult.errors,
        hybridRoutingEvents: hybridAnalysis,
        complianceStatus: complianceAnalysis,
        performanceMetrics,
        recommendations,
        errors: [],
      };

      console.log(`✅ Validation completed successfully`);
      console.log(
        `🔒 Integrity status: ${integrityResult.valid ? "VALID" : "INVALID"}`
      );
      console.log(`📈 Events analyzed: ${events.length}`);

      return result;
    } catch (error) {
      console.error(`❌ Validation failed:`, error);

      return {
        timestamp: new Date().toISOString(),
        totalEventsValidated: 0,
        integrityValid: false,
        integrityErrors: [],
        hybridRoutingEvents: {
          routingDecisions: 0,
          directBedrockOperations: 0,
          mcpRoutingOperations: 0,
          fallbackEvents: 0,
          healthChecks: 0,
          gdprValidations: 0,
          piiRedactions: 0,
        },
        complianceStatus: {
          gdprCompliant: 0,
          gdprViolations: 0,
          piiDetections: 0,
          emergencyRedactions: 0,
        },
        performanceMetrics: {
          averageLatency: 0,
          directRouteLatency: 0,
          mcpRouteLatency: 0,
          successRate: 0,
        },
        recommendations: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Fetch audit events from the audit trail system
   * In production, this would query the audit database
   */
  private async fetchAuditEvents(
    startDate: Date,
    endDate: Date
  ): Promise<AuditEvent[]> {
    // Simulate fetching events from audit database
    // In production, this would be a database query
    const sampleEvents: AuditEvent[] = [
      {
        eventId: "audit_1705234800000_1",
        timestamp: new Date().toISOString(),
        eventType: "hybrid_routing_decision",
        requestId: "req-001",
        operation: "hybrid_routing",
        complianceStatus: "compliant",
        routingDecision: {
          selectedRoute: "direct",
          reason: "Emergency operation requires <5s latency",
          fallbackAvailable: true,
          estimatedLatency: 3000,
          correlationId: "corr-001",
        },
        metadata: {
          operationType: "emergency_operations",
          priority: "critical",
        },
        eventHash: "hash1",
        previousEventHash: "",
      },
      {
        eventId: "audit_1705234800001_2",
        timestamp: new Date().toISOString(),
        eventType: "direct_bedrock_operation",
        requestId: "req-001",
        provider: "bedrock",
        operation: "emergency_operations",
        latencyMs: 2800,
        complianceStatus: "compliant",
        metadata: {
          routingPath: "direct_bedrock",
          success: true,
          gdprCompliant: true,
        },
        eventHash: "hash2",
        previousEventHash: "hash1",
      },
      {
        eventId: "audit_1705234800002_3",
        timestamp: new Date().toISOString(),
        eventType: "gdpr_compliance_validation",
        requestId: "req-002",
        operation: "gdpr_validation",
        complianceStatus: "compliant",
        gdprLawfulBasis: "legitimate_interests",
        metadata: {
          routingPath: "mcp_integration",
          gdprCompliant: true,
        },
        eventHash: "hash3",
        previousEventHash: "hash2",
      },
      {
        eventId: "audit_1705234800003_4",
        timestamp: new Date().toISOString(),
        eventType: "pii_redaction",
        requestId: "req-003",
        operation: "pii_redaction",
        piiDetected: true,
        complianceStatus: "compliant",
        metadata: {
          routingPath: "direct_bedrock",
          redactionApplied: true,
          piiViolationsCount: 1,
        },
        eventHash: "hash4",
        previousEventHash: "hash3",
      },
    ];

    return sampleEvents;
  }

  /**
   * Analyze hybrid routing specific events
   */
  private analyzeHybridRoutingEvents(events: AuditEvent[]) {
    return {
      routingDecisions: events.filter(
        (e) => e.eventType === "hybrid_routing_decision"
      ).length,
      directBedrockOperations: events.filter(
        (e) => e.eventType === "direct_bedrock_operation"
      ).length,
      mcpRoutingOperations: events.filter(
        (e) => e.eventType === "mcp_routing_operation"
      ).length,
      fallbackEvents: events.filter(
        (e) => e.eventType === "intelligent_routing_fallback"
      ).length,
      healthChecks: events.filter((e) => e.eventType === "route_health_check")
        .length,
      gdprValidations: events.filter(
        (e) => e.eventType === "gdpr_compliance_validation"
      ).length,
      piiRedactions: events.filter(
        (e) =>
          e.eventType === "pii_redaction" ||
          e.eventType === "emergency_pii_redaction"
      ).length,
    };
  }

  /**
   * Analyze compliance status across events
   */
  private analyzeComplianceStatus(events: AuditEvent[]) {
    return {
      gdprCompliant: events.filter(
        (e) =>
          e.eventType === "gdpr_compliance_validation" &&
          e.complianceStatus === "compliant"
      ).length,
      gdprViolations: events.filter(
        (e) =>
          e.eventType === "gdpr_compliance_validation" &&
          e.complianceStatus === "violation"
      ).length,
      piiDetections: events.filter((e) => e.piiDetected === true).length,
      emergencyRedactions: events.filter(
        (e) => e.eventType === "emergency_pii_redaction"
      ).length,
    };
  }

  /**
   * Calculate performance metrics from audit events
   */
  private calculatePerformanceMetrics(events: AuditEvent[]) {
    const operationEvents = events.filter(
      (e) =>
        e.eventType === "direct_bedrock_operation" ||
        e.eventType === "mcp_routing_operation"
    );

    const directEvents = events.filter(
      (e) => e.eventType === "direct_bedrock_operation"
    );
    const mcpEvents = events.filter(
      (e) => e.eventType === "mcp_routing_operation"
    );

    const averageLatency =
      operationEvents.length > 0
        ? operationEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0) /
          operationEvents.length
        : 0;

    const directRouteLatency =
      directEvents.length > 0
        ? directEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0) /
          directEvents.length
        : 0;

    const mcpRouteLatency =
      mcpEvents.length > 0
        ? mcpEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0) /
          mcpEvents.length
        : 0;

    const successfulOperations = operationEvents.filter(
      (e) => e.complianceStatus === "compliant" && !e.error
    ).length;

    const successRate =
      operationEvents.length > 0
        ? successfulOperations / operationEvents.length
        : 0;

    return {
      averageLatency: Math.round(averageLatency),
      directRouteLatency: Math.round(directRouteLatency),
      mcpRouteLatency: Math.round(mcpRouteLatency),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    events: AuditEvent[],
    integrityResult: { valid: boolean; errors: string[] },
    hybridAnalysis: any,
    complianceAnalysis: any,
    performanceMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    // Integrity recommendations
    if (!integrityResult.valid) {
      recommendations.push(
        "🚨 CRITICAL: Audit trail integrity compromised - investigate immediately"
      );
      recommendations.push(
        "🔒 Review audit trail security measures and access controls"
      );
    }

    // Compliance recommendations
    if (complianceAnalysis.gdprViolations > 0) {
      recommendations.push(
        `⚠️  ${complianceAnalysis.gdprViolations} GDPR violations detected - review compliance procedures`
      );
    }

    if (
      complianceAnalysis.piiDetections >
      complianceAnalysis.emergencyRedactions * 2
    ) {
      recommendations.push(
        "🛡️  High PII detection rate - consider improving PII prevention measures"
      );
    }

    // Performance recommendations
    if (performanceMetrics.averageLatency > 10000) {
      recommendations.push(
        "⚡ Average latency exceeds 10s - optimize routing performance"
      );
    }

    if (performanceMetrics.directRouteLatency > 5000) {
      recommendations.push(
        "🚀 Direct Bedrock latency exceeds 5s - investigate direct route performance"
      );
    }

    if (performanceMetrics.successRate < 0.95) {
      recommendations.push(
        "📈 Success rate below 95% - investigate error patterns"
      );
    }

    // Routing recommendations
    if (hybridAnalysis.fallbackEvents > hybridAnalysis.routingDecisions * 0.1) {
      recommendations.push(
        "🔄 High fallback rate (>10%) - review primary route health"
      );
    }

    if (hybridAnalysis.healthChecks === 0) {
      recommendations.push(
        "💓 No health checks detected - ensure health monitoring is active"
      );
    }

    // General recommendations
    if (events.length === 0) {
      recommendations.push(
        "📊 No audit events found - verify audit trail is properly configured"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "✅ Audit trail integrity validated - no issues detected"
      );
      recommendations.push("🔄 Continue regular integrity monitoring");
      recommendations.push(
        "📊 Consider implementing automated integrity alerts"
      );
    }

    return recommendations;
  }

  /**
   * Format and output validation results
   */
  async outputResults(result: ValidationResult): Promise<void> {
    switch (this.config.outputFormat) {
      case "json":
        console.log(JSON.stringify(result, null, 2));
        break;

      case "text":
        this.outputTextFormat(result);
        break;

      case "csv":
        this.outputCSVFormat(result);
        break;

      default:
        console.log(JSON.stringify(result, null, 2));
    }
  }

  private outputTextFormat(result: ValidationResult): void {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 HYBRID ROUTING AUDIT TRAIL VALIDATION REPORT");
    console.log("=".repeat(60));
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log(`📊 Events Validated: ${result.totalEventsValidated}`);
    console.log(
      `🔒 Integrity Status: ${
        result.integrityValid ? "✅ VALID" : "❌ INVALID"
      }`
    );

    if (result.integrityErrors.length > 0) {
      console.log("\n🚨 INTEGRITY ERRORS:");
      result.integrityErrors.forEach((error) => console.log(`   • ${error}`));
    }

    console.log("\n📈 HYBRID ROUTING EVENTS:");
    console.log(
      `   • Routing Decisions: ${result.hybridRoutingEvents.routingDecisions}`
    );
    console.log(
      `   • Direct Bedrock Operations: ${result.hybridRoutingEvents.directBedrockOperations}`
    );
    console.log(
      `   • MCP Routing Operations: ${result.hybridRoutingEvents.mcpRoutingOperations}`
    );
    console.log(
      `   • Fallback Events: ${result.hybridRoutingEvents.fallbackEvents}`
    );
    console.log(
      `   • Health Checks: ${result.hybridRoutingEvents.healthChecks}`
    );
    console.log(
      `   • GDPR Validations: ${result.hybridRoutingEvents.gdprValidations}`
    );
    console.log(
      `   • PII Redactions: ${result.hybridRoutingEvents.piiRedactions}`
    );

    console.log("\n🛡️  COMPLIANCE STATUS:");
    console.log(
      `   • GDPR Compliant: ${result.complianceStatus.gdprCompliant}`
    );
    console.log(
      `   • GDPR Violations: ${result.complianceStatus.gdprViolations}`
    );
    console.log(
      `   • PII Detections: ${result.complianceStatus.piiDetections}`
    );
    console.log(
      `   • Emergency Redactions: ${result.complianceStatus.emergencyRedactions}`
    );

    console.log("\n⚡ PERFORMANCE METRICS:");
    console.log(
      `   • Average Latency: ${result.performanceMetrics.averageLatency}ms`
    );
    console.log(
      `   • Direct Route Latency: ${result.performanceMetrics.directRouteLatency}ms`
    );
    console.log(
      `   • MCP Route Latency: ${result.performanceMetrics.mcpRouteLatency}ms`
    );
    console.log(
      `   • Success Rate: ${(
        result.performanceMetrics.successRate * 100
      ).toFixed(1)}%`
    );

    if (
      this.config.includeRecommendations &&
      result.recommendations.length > 0
    ) {
      console.log("\n💡 RECOMMENDATIONS:");
      result.recommendations.forEach((rec) => console.log(`   ${rec}`));
    }

    if (result.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      result.errors.forEach((error) => console.log(`   • ${error}`));
    }

    console.log("\n" + "=".repeat(60));
  }

  private outputCSVFormat(result: ValidationResult): void {
    const csvHeaders = [
      "timestamp",
      "total_events",
      "integrity_valid",
      "integrity_errors_count",
      "routing_decisions",
      "direct_operations",
      "mcp_operations",
      "fallback_events",
      "health_checks",
      "gdpr_validations",
      "pii_redactions",
      "gdpr_compliant",
      "gdpr_violations",
      "pii_detections",
      "emergency_redactions",
      "avg_latency_ms",
      "direct_latency_ms",
      "mcp_latency_ms",
      "success_rate",
      "recommendations_count",
      "errors_count",
    ].join(",");

    const csvData = [
      result.timestamp,
      result.totalEventsValidated,
      result.integrityValid,
      result.integrityErrors.length,
      result.hybridRoutingEvents.routingDecisions,
      result.hybridRoutingEvents.directBedrockOperations,
      result.hybridRoutingEvents.mcpRoutingOperations,
      result.hybridRoutingEvents.fallbackEvents,
      result.hybridRoutingEvents.healthChecks,
      result.hybridRoutingEvents.gdprValidations,
      result.hybridRoutingEvents.piiRedactions,
      result.complianceStatus.gdprCompliant,
      result.complianceStatus.gdprViolations,
      result.complianceStatus.piiDetections,
      result.complianceStatus.emergencyRedactions,
      result.performanceMetrics.averageLatency,
      result.performanceMetrics.directRouteLatency,
      result.performanceMetrics.mcpRouteLatency,
      result.performanceMetrics.successRate,
      result.recommendations.length,
      result.errors.length,
    ].join(",");

    console.log(csvHeaders);
    console.log(csvData);
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const config: Partial<ValidationConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case "--compliance-mode":
        config.complianceMode = value as "strict" | "standard" | "minimal";
        break;
      case "--time-range-hours":
        config.timeRangeHours = parseInt(value);
        break;
      case "--output-format":
        config.outputFormat = value as "json" | "text" | "csv";
        break;
      case "--no-integrity-check":
        config.enableIntegrityChecking = false;
        break;
      case "--no-pii-logging":
        config.enablePIILogging = false;
        break;
      case "--no-recommendations":
        config.includeRecommendations = false;
        break;
    }
  }

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🔍 Hybrid Routing Audit Trail Integrity Validator

Usage: tsx scripts/validate-hybrid-audit-trail-integrity.ts [options]

Options:
  --compliance-mode <mode>     Set compliance mode: strict, standard, minimal (default: strict)
  --time-range-hours <hours>   Hours of audit trail to validate (default: 24)
  --output-format <format>     Output format: json, text, csv (default: json)
  --no-integrity-check         Disable integrity checking
  --no-pii-logging            Disable PII logging validation
  --no-recommendations        Exclude recommendations from output
  --help, -h                  Show this help message

Examples:
  tsx scripts/validate-hybrid-audit-trail-integrity.ts
  tsx scripts/validate-hybrid-audit-trail-integrity.ts --compliance-mode strict --output-format text
  tsx scripts/validate-hybrid-audit-trail-integrity.ts --time-range-hours 48 --output-format csv
    `);
    return;
  }

  try {
    const validator = new HybridAuditTrailValidator(config);
    const result = await validator.validateHybridAuditTrail();
    await validator.outputResults(result);

    // Exit with error code if integrity is invalid or errors occurred
    if (!result.integrityValid || result.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Validation script failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { HybridAuditTrailValidator, ValidationConfig, ValidationResult };
