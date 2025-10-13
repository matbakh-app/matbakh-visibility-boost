#!/usr/bin/env tsx

/**
 * Monitoring Readiness Validation Script
 *
 * Validates that all monitoring and alerting components are ready
 * for production deployment of the hybrid architecture.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface ValidationResult {
  component: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

interface ValidationReport {
  timestamp: string;
  environment: string;
  overallStatus: "ready" | "not_ready" | "needs_attention";
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
}

class MonitoringReadinessValidator {
  private results: ValidationResult[] = [];

  /**
   * Run complete validation
   */
  async validate(): Promise<ValidationReport> {
    console.log(
      "🔍 Validating monitoring readiness for production deployment...\n"
    );

    // Infrastructure validation
    await this.validateInfrastructure();

    // Configuration validation
    await this.validateConfiguration();

    // Component validation
    await this.validateComponents();

    // Integration validation
    await this.validateIntegrations();

    // Performance validation
    await this.validatePerformance();

    // Security validation
    await this.validateSecurity();

    // Generate report
    return this.generateReport();
  }

  /**
   * Validate infrastructure components
   */
  private async validateInfrastructure(): Promise<void> {
    console.log("📋 Validating infrastructure components...");

    const requiredFiles = [
      {
        path: "infra/cdk/production-monitoring-stack.ts",
        description: "Production monitoring CDK stack",
      },
      {
        path: "infra/cdk/hybrid-routing-monitoring-stack.ts",
        description: "Hybrid routing monitoring CDK stack",
      },
      {
        path: "src/lib/ai-orchestrator/alerting/routing-efficiency-alerting.ts",
        description: "Routing efficiency alerting system",
      },
      {
        path: "src/lib/ai-orchestrator/alerting/cloudwatch-alarm-manager.ts",
        description: "CloudWatch alarm manager",
      },
      {
        path: "src/lib/ai-orchestrator/alerting/sns-notification-manager.ts",
        description: "SNS notification manager",
      },
      {
        path: "src/lib/ai-orchestrator/alerting/pagerduty-integration.ts",
        description: "PagerDuty integration",
      },
      {
        path: "src/lib/ai-orchestrator/hybrid-routing-performance-monitor.ts",
        description: "Hybrid routing performance monitor",
      },
      {
        path: "src/lib/ai-orchestrator/hybrid-health-monitor.ts",
        description: "Hybrid health monitor",
      },
    ];

    for (const file of requiredFiles) {
      if (existsSync(file.path)) {
        this.results.push({
          component: file.description,
          status: "pass",
          message: `File exists: ${file.path}`,
        });
      } else {
        this.results.push({
          component: file.description,
          status: "fail",
          message: `Missing required file: ${file.path}`,
        });
      }
    }
  }

  /**
   * Validate configuration files
   */
  private async validateConfiguration(): Promise<void> {
    console.log("⚙️  Validating configuration...");

    // Check environment configuration
    const envFiles = [
      ".env.bedrock.production",
      ".env.bedrock.staging",
      ".env.bedrock.development",
    ];

    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        try {
          const content = readFileSync(envFile, "utf-8");
          const hasMonitoringConfig =
            content.includes("MONITORING") || content.includes("ALERT");

          this.results.push({
            component: `Environment configuration (${envFile})`,
            status: hasMonitoringConfig ? "pass" : "warning",
            message: hasMonitoringConfig
              ? "Contains monitoring configuration"
              : "No monitoring configuration found",
          });
        } catch (error) {
          this.results.push({
            component: `Environment configuration (${envFile})`,
            status: "fail",
            message: `Error reading file: ${error.message}`,
          });
        }
      } else {
        this.results.push({
          component: `Environment configuration (${envFile})`,
          status: "warning",
          message: "Environment file not found",
        });
      }
    }

    // Check feature flags configuration
    if (existsSync("src/lib/ai-orchestrator/ai-feature-flags.ts")) {
      try {
        const content = readFileSync(
          "src/lib/ai-orchestrator/ai-feature-flags.ts",
          "utf-8"
        );
        const hasMonitoringFlags =
          content.includes("monitoring") || content.includes("alerting");

        this.results.push({
          component: "Feature flags configuration",
          status: hasMonitoringFlags ? "pass" : "warning",
          message: hasMonitoringFlags
            ? "Contains monitoring feature flags"
            : "No monitoring feature flags found",
        });
      } catch (error) {
        this.results.push({
          component: "Feature flags configuration",
          status: "fail",
          message: `Error reading feature flags: ${error.message}`,
        });
      }
    }
  }

  /**
   * Validate monitoring components
   */
  private async validateComponents(): Promise<void> {
    console.log("🔧 Validating monitoring components...");

    // Test component imports
    const components = [
      {
        name: "Routing Efficiency Alerting",
        path: "src/lib/ai-orchestrator/alerting/routing-efficiency-alerting.ts",
        expectedExports: [
          "RoutingEfficiencyAlertingSystem",
          "createRoutingEfficiencyAlertingSystem",
        ],
      },
      {
        name: "CloudWatch Alarm Manager",
        path: "src/lib/ai-orchestrator/alerting/cloudwatch-alarm-manager.ts",
        expectedExports: ["CloudWatchAlarmManager"],
      },
      {
        name: "SNS Notification Manager",
        path: "src/lib/ai-orchestrator/alerting/sns-notification-manager.ts",
        expectedExports: ["SNSNotificationManager"],
      },
      {
        name: "PagerDuty Integration",
        path: "src/lib/ai-orchestrator/alerting/pagerduty-integration.ts",
        expectedExports: ["PagerDutyIntegration"],
      },
      {
        name: "Hybrid Routing Performance Monitor",
        path: "src/lib/ai-orchestrator/hybrid-routing-performance-monitor.ts",
        expectedExports: ["HybridRoutingPerformanceMonitor"],
      },
      {
        name: "Hybrid Health Monitor",
        path: "src/lib/ai-orchestrator/hybrid-health-monitor.ts",
        expectedExports: ["HybridHealthMonitor"],
      },
    ];

    for (const component of components) {
      if (existsSync(component.path)) {
        try {
          const content = readFileSync(component.path, "utf-8");
          const missingExports = component.expectedExports.filter(
            (exp) =>
              !content.includes(`export class ${exp}`) &&
              !content.includes(`export function ${exp}`)
          );

          if (missingExports.length === 0) {
            this.results.push({
              component: component.name,
              status: "pass",
              message: "All expected exports found",
            });
          } else {
            this.results.push({
              component: component.name,
              status: "fail",
              message: `Missing exports: ${missingExports.join(", ")}`,
            });
          }
        } catch (error) {
          this.results.push({
            component: component.name,
            status: "fail",
            message: `Error validating component: ${error.message}`,
          });
        }
      } else {
        this.results.push({
          component: component.name,
          status: "fail",
          message: "Component file not found",
        });
      }
    }
  }

  /**
   * Validate integrations
   */
  private async validateIntegrations(): Promise<void> {
    console.log("🔗 Validating integrations...");

    // Check test files exist
    const testFiles = [
      "src/lib/ai-orchestrator/__tests__/routing-efficiency-alerting.test.ts",
      "src/lib/ai-orchestrator/__tests__/cloudwatch-alarm-manager.test.ts",
      "src/lib/ai-orchestrator/__tests__/sns-notification-manager.test.ts",
      "src/lib/ai-orchestrator/__tests__/pagerduty-integration.test.ts",
      "src/lib/ai-orchestrator/__tests__/hybrid-routing-performance-monitor.test.ts",
      "src/lib/ai-orchestrator/__tests__/hybrid-health-monitor.test.ts",
    ];

    let testFilesFound = 0;
    for (const testFile of testFiles) {
      if (existsSync(testFile)) {
        testFilesFound++;
      }
    }

    this.results.push({
      component: "Test coverage",
      status: testFilesFound >= testFiles.length * 0.8 ? "pass" : "warning",
      message: `${testFilesFound}/${testFiles.length} test files found`,
      details: { testFilesFound, totalTestFiles: testFiles.length },
    });

    // Check CDK stack integration
    if (existsSync("infra/cdk/production-monitoring-stack.ts")) {
      const content = readFileSync(
        "infra/cdk/production-monitoring-stack.ts",
        "utf-8"
      );
      const hasCloudWatchIntegration = content.includes("cloudwatch");
      const hasSNSIntegration = content.includes("sns");

      this.results.push({
        component: "CDK stack integration",
        status:
          hasCloudWatchIntegration && hasSNSIntegration ? "pass" : "warning",
        message: `CloudWatch: ${hasCloudWatchIntegration}, SNS: ${hasSNSIntegration}`,
      });
    }
  }

  /**
   * Validate performance requirements
   */
  private async validatePerformance(): Promise<void> {
    console.log("⚡ Validating performance requirements...");

    // Check if performance monitoring is configured
    const performanceFiles = [
      "src/lib/ai-orchestrator/hybrid-routing-performance-monitor.ts",
      "src/lib/ai-orchestrator/performance-monitor.ts",
    ];

    let performanceMonitoringFound = false;
    for (const file of performanceFiles) {
      if (existsSync(file)) {
        const content = readFileSync(file, "utf-8");
        if (
          content.includes("P95") ||
          content.includes("latency") ||
          content.includes("performance")
        ) {
          performanceMonitoringFound = true;
          break;
        }
      }
    }

    this.results.push({
      component: "Performance monitoring",
      status: performanceMonitoringFound ? "pass" : "fail",
      message: performanceMonitoringFound
        ? "Performance monitoring components found"
        : "No performance monitoring components found",
    });

    // Check latency thresholds configuration
    const alertingFile =
      "src/lib/ai-orchestrator/alerting/routing-efficiency-alerting.ts";
    if (existsSync(alertingFile)) {
      const content = readFileSync(alertingFile, "utf-8");
      const hasLatencyThresholds =
        content.includes("latencyThresholds") ||
        content.includes("emergency") ||
        content.includes("critical");

      this.results.push({
        component: "Latency thresholds",
        status: hasLatencyThresholds ? "pass" : "warning",
        message: hasLatencyThresholds
          ? "Latency thresholds configured"
          : "No latency thresholds found in alerting configuration",
      });
    }
  }

  /**
   * Validate security requirements
   */
  private async validateSecurity(): Promise<void> {
    console.log("🔒 Validating security requirements...");

    // Check security monitoring components
    const securityFiles = [
      "src/lib/ai-orchestrator/security-posture-monitor.ts",
      "src/lib/ai-orchestrator/gdpr-hybrid-compliance-validator.ts",
    ];

    let securityMonitoringFound = false;
    for (const file of securityFiles) {
      if (existsSync(file)) {
        securityMonitoringFound = true;
        break;
      }
    }

    this.results.push({
      component: "Security monitoring",
      status: securityMonitoringFound ? "pass" : "warning",
      message: securityMonitoringFound
        ? "Security monitoring components found"
        : "No security monitoring components found",
    });

    // Check compliance validation
    if (
      existsSync("src/lib/ai-orchestrator/gdpr-hybrid-compliance-validator.ts")
    ) {
      const content = readFileSync(
        "src/lib/ai-orchestrator/gdpr-hybrid-compliance-validator.ts",
        "utf-8"
      );
      const hasGDPRValidation =
        content.includes("GDPR") || content.includes("compliance");

      this.results.push({
        component: "GDPR compliance validation",
        status: hasGDPRValidation ? "pass" : "warning",
        message: hasGDPRValidation
          ? "GDPR compliance validation found"
          : "No GDPR compliance validation found",
      });
    }

    // Check audit trail integration
    if (existsSync("src/lib/ai-orchestrator/audit-trail-system.ts")) {
      this.results.push({
        component: "Audit trail system",
        status: "pass",
        message: "Audit trail system found",
      });
    } else {
      this.results.push({
        component: "Audit trail system",
        status: "warning",
        message: "No audit trail system found",
      });
    }
  }

  /**
   * Generate validation report
   */
  private generateReport(): ValidationReport {
    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const warnings = this.results.filter((r) => r.status === "warning").length;

    let overallStatus: "ready" | "not_ready" | "needs_attention";
    if (failed > 0) {
      overallStatus = "not_ready";
    } else if (warnings > 0) {
      overallStatus = "needs_attention";
    } else {
      overallStatus = "ready";
    }

    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      environment: "production",
      overallStatus,
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        warnings,
      },
      recommendations,
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedResults = this.results.filter((r) => r.status === "fail");
    const warningResults = this.results.filter((r) => r.status === "warning");

    if (failedResults.length > 0) {
      recommendations.push(
        "❌ Critical issues must be resolved before production deployment:"
      );
      failedResults.forEach((result) => {
        recommendations.push(`   - ${result.component}: ${result.message}`);
      });
    }

    if (warningResults.length > 0) {
      recommendations.push(
        "⚠️  Address these warnings to improve monitoring reliability:"
      );
      warningResults.forEach((result) => {
        recommendations.push(`   - ${result.component}: ${result.message}`);
      });
    }

    // Specific recommendations based on common issues
    const missingComponents = failedResults.filter((r) =>
      r.message.includes("not found")
    );
    if (missingComponents.length > 0) {
      recommendations.push("🔧 Implement missing monitoring components");
    }

    const configIssues = [...failedResults, ...warningResults].filter(
      (r) =>
        r.component.includes("configuration") || r.component.includes("flags")
    );
    if (configIssues.length > 0) {
      recommendations.push("⚙️  Review and update monitoring configuration");
    }

    const testIssues = [...failedResults, ...warningResults].filter(
      (r) => r.component.includes("test") || r.component.includes("Test")
    );
    if (testIssues.length > 0) {
      recommendations.push(
        "🧪 Improve test coverage for monitoring components"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "✅ All monitoring components are ready for production deployment"
      );
    }

    return recommendations;
  }

  /**
   * Print validation results
   */
  printResults(report: ValidationReport): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 MONITORING READINESS VALIDATION REPORT");
    console.log("=".repeat(80));
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Environment: ${report.environment}`);
    console.log(
      `Overall Status: ${this.getStatusEmoji(
        report.overallStatus
      )} ${report.overallStatus.toUpperCase()}`
    );
    console.log("");

    console.log("📈 SUMMARY");
    console.log("-".repeat(40));
    console.log(`Total Components: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log("");

    if (report.summary.failed > 0) {
      console.log("❌ FAILED COMPONENTS");
      console.log("-".repeat(40));
      report.results
        .filter((r) => r.status === "fail")
        .forEach((result) => {
          console.log(`• ${result.component}: ${result.message}`);
        });
      console.log("");
    }

    if (report.summary.warnings > 0) {
      console.log("⚠️  WARNING COMPONENTS");
      console.log("-".repeat(40));
      report.results
        .filter((r) => r.status === "warning")
        .forEach((result) => {
          console.log(`• ${result.component}: ${result.message}`);
        });
      console.log("");
    }

    console.log("💡 RECOMMENDATIONS");
    console.log("-".repeat(40));
    report.recommendations.forEach((rec) => {
      console.log(rec);
    });
    console.log("");

    console.log("=".repeat(80));
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case "ready":
        return "✅";
      case "not_ready":
        return "❌";
      case "needs_attention":
        return "⚠️";
      default:
        return "❓";
    }
  }
}

// Main execution
async function main() {
  const validator = new MonitoringReadinessValidator();
  const report = await validator.validate();

  validator.printResults(report);

  // Write report to file
  const outputPath = join(
    process.cwd(),
    "docs",
    "monitoring-readiness-report.json"
  );
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${outputPath}`);

  // Exit with appropriate code
  process.exit(report.overallStatus === "not_ready" ? 1 : 0);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MonitoringReadinessValidator };
