#!/usr/bin/env tsx

/**
 * CI/CD Guard Manager - Cleanup 2
 *
 * Orchestrates CI/CD guards and prevention systems
 * Manages configuration, monitoring, and reporting
 *
 * Requirements: 3.1, 3.2, 4.1, 4.2
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { LegacyReferenceScanner, ScanResult } from "./legacy-scanner";
import { PreCommitGuard, PreCommitResult } from "./pre-commit-guard";

export interface GuardConfig {
  preCommitGuard: {
    enabled: boolean;
    blocking: Record<string, boolean>;
    warnings: Record<string, boolean>;
    serviceRules: Record<string, any>;
    exemptions: {
      files: string[];
      patterns: string[];
      temporary: Array<{
        file: string;
        reason: string;
        expires: string;
        approver: string;
      }>;
    };
  };
  cicdPipeline: {
    enabled: boolean;
    triggers: string[];
    branches: {
      protected: string[];
      requireChecks: string[];
    };
    onFailure: {
      blockMerge: boolean;
      notifyTeam: boolean;
      createIssue: boolean;
    };
  };
  detectionEngine: any;
  reporting: any;
  integrations: any;
  metrics: any;
}

export interface GuardMetrics {
  timestamp: string;
  totalScans: number;
  blockedCommits: number;
  allowedCommits: number;
  criticalReferences: number;
  exemptionsUsed: number;
  averageScanTime: number;
  topBlockedServices: Array<{ service: string; count: number }>;
}

export interface GuardReport {
  summary: {
    period: string;
    totalActivity: number;
    blockRate: number;
    topIssues: string[];
  };
  metrics: GuardMetrics;
  recommendations: string[];
  trends: {
    referencesOverTime: Array<{ date: string; count: number }>;
    blockRateOverTime: Array<{ date: string; rate: number }>;
  };
}

export class CICDGuardManager {
  private config: GuardConfig;
  private scanner: LegacyReferenceScanner;
  private preCommitGuard: PreCommitGuard;
  private configPath: string;
  private metricsPath: string;

  constructor(configPath: string = "scripts/cleanup-2/ci-cd-config.yaml") {
    this.configPath = configPath;
    this.metricsPath = "reports/guard-metrics.json";
    this.config = this.loadConfig();
    this.scanner = new LegacyReferenceScanner();
    this.preCommitGuard = new PreCommitGuard(this.buildPreCommitConfig());
  }

  /**
   * Load configuration from YAML file
   */
  private loadConfig(): GuardConfig {
    try {
      const configContent = fs.readFileSync(this.configPath, "utf-8");
      return yaml.load(configContent) as GuardConfig;
    } catch (error) {
      console.warn(
        `⚠️  Failed to load config from ${this.configPath}, using defaults`
      );
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): GuardConfig {
    return {
      preCommitGuard: {
        enabled: true,
        blocking: { critical: true, high: true, medium: false, low: false },
        warnings: { medium: true, low: false },
        serviceRules: {},
        exemptions: { files: [], patterns: [], temporary: [] },
      },
      cicdPipeline: {
        enabled: true,
        triggers: ["push", "pull_request"],
        branches: { protected: ["main"], requireChecks: ["legacy-detection"] },
        onFailure: { blockMerge: true, notifyTeam: true, createIssue: false },
      },
      detectionEngine: {},
      reporting: {},
      integrations: {},
      metrics: { enabled: true },
    };
  }

  /**
   * Build pre-commit guard configuration from main config
   */
  private buildPreCommitConfig() {
    const preCommitConfig = this.config.preCommitGuard;
    return {
      blockCritical: preCommitConfig.blocking.critical,
      blockHigh: preCommitConfig.blocking.high,
      warnMedium: preCommitConfig.warnings.medium,
      exemptFiles: preCommitConfig.exemptions.files,
      exemptPatterns: preCommitConfig.exemptions.patterns.map(
        (p) => new RegExp(p)
      ),
    };
  }

  /**
   * Run comprehensive guard check
   */
  async runGuardCheck(): Promise<{
    preCommitResult?: PreCommitResult;
    scanResult: ScanResult;
    complianceStatus: boolean;
    recommendations: string[];
  }> {
    console.log("🛡️  Running comprehensive guard check...");

    const startTime = Date.now();

    // Run full scan
    const scanResult = await this.scanner.scanDirectory(".");

    // Run pre-commit check if in Git repository
    let preCommitResult: PreCommitResult | undefined;
    if (this.isGitRepository()) {
      try {
        preCommitResult = await this.preCommitGuard.checkStagedFiles();
      } catch (error) {
        console.warn("⚠️  Pre-commit check failed:", error);
      }
    }

    // Check compliance
    const complianceStatus = this.checkCompliance(scanResult);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      scanResult,
      preCommitResult
    );

    // Record metrics
    await this.recordMetrics({
      scanResult,
      preCommitResult,
      scanTime: Date.now() - startTime,
    });

    return {
      preCommitResult,
      scanResult,
      complianceStatus,
      recommendations,
    };
  }

  /**
   * Check if current directory is a Git repository
   */
  private isGitRepository(): boolean {
    try {
      execSync("git rev-parse --git-dir", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check compliance against policies
   */
  private checkCompliance(scanResult: ScanResult): boolean {
    const criticalCount = scanResult.summary.criticalCount;
    const highRiskCount = scanResult.summary.highRiskCount;

    // Check against thresholds
    if (criticalCount > 0 && this.config.preCommitGuard.blocking.critical) {
      return false;
    }

    if (highRiskCount > 10 && this.config.preCommitGuard.blocking.high) {
      return false;
    }

    return true;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    scanResult: ScanResult,
    preCommitResult?: PreCommitResult
  ): string[] {
    const recommendations: string[] = [];

    // Scan-based recommendations
    if (scanResult.summary.criticalCount > 0) {
      recommendations.push(
        `🚨 Address ${scanResult.summary.criticalCount} critical legacy references immediately`
      );
    }

    if (scanResult.summary.highRiskCount > 20) {
      recommendations.push(
        `⚠️  Plan cleanup for ${scanResult.summary.highRiskCount} high-risk references`
      );
    }

    // Service-specific recommendations
    const topService = scanResult.summary.topServices[0];
    if (topService && topService.count > 50) {
      recommendations.push(
        `🎯 Prioritize ${topService.service} cleanup (${topService.count} references)`
      );
    }

    // Pre-commit recommendations
    if (preCommitResult && !preCommitResult.allowed) {
      recommendations.push(
        `🔒 ${preCommitResult.blockedReferences.length} references blocking commits`
      );
    }

    // Configuration recommendations
    if (!this.config.preCommitGuard.enabled) {
      recommendations.push(
        "🛡️  Enable pre-commit guards for better protection"
      );
    }

    return recommendations;
  }

  /**
   * Record metrics for monitoring
   */
  private async recordMetrics(data: {
    scanResult: ScanResult;
    preCommitResult?: PreCommitResult;
    scanTime: number;
  }): Promise<void> {
    if (!this.config.metrics.enabled) return;

    const metrics: GuardMetrics = {
      timestamp: new Date().toISOString(),
      totalScans: 1,
      blockedCommits: data.preCommitResult
        ? data.preCommitResult.allowed
          ? 0
          : 1
        : 0,
      allowedCommits: data.preCommitResult
        ? data.preCommitResult.allowed
          ? 1
          : 0
        : 0,
      criticalReferences: data.scanResult.summary.criticalCount,
      exemptionsUsed: 0, // TODO: Track exemption usage
      averageScanTime: data.scanTime,
      topBlockedServices: data.scanResult.summary.topServices,
    };

    // Load existing metrics
    let existingMetrics: GuardMetrics[] = [];
    if (fs.existsSync(this.metricsPath)) {
      try {
        const content = fs.readFileSync(this.metricsPath, "utf-8");
        existingMetrics = JSON.parse(content);
      } catch (error) {
        console.warn("⚠️  Failed to load existing metrics:", error);
      }
    }

    // Add new metrics
    existingMetrics.push(metrics);

    // Keep only last 1000 entries
    if (existingMetrics.length > 1000) {
      existingMetrics = existingMetrics.slice(-1000);
    }

    // Save metrics
    fs.mkdirSync(path.dirname(this.metricsPath), { recursive: true });
    fs.writeFileSync(
      this.metricsPath,
      JSON.stringify(existingMetrics, null, 2)
    );
  }

  /**
   * Generate comprehensive guard report
   */
  async generateGuardReport(period: string = "7d"): Promise<GuardReport> {
    console.log(`📊 Generating guard report for period: ${period}`);

    // Load metrics
    let metrics: GuardMetrics[] = [];
    if (fs.existsSync(this.metricsPath)) {
      const content = fs.readFileSync(this.metricsPath, "utf-8");
      metrics = JSON.parse(content);
    }

    // Filter by period
    const periodStart = this.getPeriodStart(period);
    const filteredMetrics = metrics.filter(
      (m) => new Date(m.timestamp) >= periodStart
    );

    // Calculate summary
    const totalActivity = filteredMetrics.length;
    const totalBlocked = filteredMetrics.reduce(
      (sum, m) => sum + m.blockedCommits,
      0
    );
    const totalAllowed = filteredMetrics.reduce(
      (sum, m) => sum + m.allowedCommits,
      0
    );
    const blockRate =
      totalActivity > 0 ? totalBlocked / (totalBlocked + totalAllowed) : 0;

    // Generate trends
    const referencesOverTime = this.generateTrend(
      filteredMetrics,
      "criticalReferences"
    );
    const blockRateOverTime = this.generateBlockRateTrend(filteredMetrics);

    // Top issues
    const topIssues = this.getTopIssues(filteredMetrics);

    // Latest metrics
    const latestMetrics = filteredMetrics[filteredMetrics.length - 1] || {
      timestamp: new Date().toISOString(),
      totalScans: 0,
      blockedCommits: 0,
      allowedCommits: 0,
      criticalReferences: 0,
      exemptionsUsed: 0,
      averageScanTime: 0,
      topBlockedServices: [],
    };

    return {
      summary: {
        period,
        totalActivity,
        blockRate,
        topIssues,
      },
      metrics: latestMetrics,
      recommendations: await this.generatePeriodRecommendations(
        filteredMetrics
      ),
      trends: {
        referencesOverTime,
        blockRateOverTime,
      },
    };
  }

  /**
   * Get period start date
   */
  private getPeriodStart(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([dwmy])/);

    if (!match) return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default 7 days

    const [, amount, unit] = match;
    const num = parseInt(amount);

    switch (unit) {
      case "d":
        return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case "w":
        return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case "m":
        return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
      case "y":
        return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Generate trend data
   */
  private generateTrend(
    metrics: GuardMetrics[],
    field: keyof GuardMetrics
  ): Array<{ date: string; count: number }> {
    return metrics.map((m) => ({
      date: m.timestamp.split("T")[0],
      count: typeof m[field] === "number" ? (m[field] as number) : 0,
    }));
  }

  /**
   * Generate block rate trend
   */
  private generateBlockRateTrend(
    metrics: GuardMetrics[]
  ): Array<{ date: string; rate: number }> {
    return metrics.map((m) => {
      const total = m.blockedCommits + m.allowedCommits;
      const rate = total > 0 ? m.blockedCommits / total : 0;
      return {
        date: m.timestamp.split("T")[0],
        rate,
      };
    });
  }

  /**
   * Get top issues from metrics
   */
  private getTopIssues(metrics: GuardMetrics[]): string[] {
    const issues: string[] = [];

    const avgCritical =
      metrics.reduce((sum, m) => sum + m.criticalReferences, 0) /
      metrics.length;
    if (avgCritical > 10) {
      issues.push(
        `High average critical references: ${avgCritical.toFixed(1)}`
      );
    }

    const avgBlockRate =
      metrics.reduce((sum, m) => {
        const total = m.blockedCommits + m.allowedCommits;
        return sum + (total > 0 ? m.blockedCommits / total : 0);
      }, 0) / metrics.length;

    if (avgBlockRate > 0.2) {
      issues.push(`High block rate: ${(avgBlockRate * 100).toFixed(1)}%`);
    }

    return issues;
  }

  /**
   * Generate period-specific recommendations
   */
  private async generatePeriodRecommendations(
    metrics: GuardMetrics[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.length === 0) {
      recommendations.push(
        "📊 No activity in this period - consider running scans"
      );
      return recommendations;
    }

    const avgCritical =
      metrics.reduce((sum, m) => sum + m.criticalReferences, 0) /
      metrics.length;
    if (avgCritical > 5) {
      recommendations.push(
        `🚨 Average critical references (${avgCritical.toFixed(
          1
        )}) is high - prioritize cleanup`
      );
    }

    const totalBlocked = metrics.reduce((sum, m) => sum + m.blockedCommits, 0);
    if (totalBlocked > 10) {
      recommendations.push(
        `🔒 ${totalBlocked} commits blocked - review and address issues`
      );
    }

    return recommendations;
  }

  /**
   * Install all guard components
   */
  async installGuards(): Promise<void> {
    console.log("🛡️  Installing CI/CD guards...");

    // Install pre-commit hook
    if (this.config.preCommitGuard.enabled) {
      await PreCommitGuard.installHook();
      console.log("✅ Pre-commit hook installed");
    }

    // Verify GitHub workflow exists
    const workflowPath = ".github/workflows/cleanup-2-guards.yml";
    if (fs.existsSync(workflowPath)) {
      console.log("✅ GitHub workflow found");
    } else {
      console.log("⚠️  GitHub workflow not found - please ensure it exists");
    }

    // Create initial metrics file
    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(path.dirname(this.metricsPath), { recursive: true });
      fs.writeFileSync(this.metricsPath, "[]");
      console.log("✅ Metrics tracking initialized");
    }

    console.log("🎉 Guard installation complete");
  }

  /**
   * Uninstall guard components
   */
  async uninstallGuards(): Promise<void> {
    console.log("🗑️  Uninstalling CI/CD guards...");

    // Uninstall pre-commit hook
    await PreCommitGuard.uninstallHook();

    console.log("✅ Guards uninstalled");
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    const command = process.argv[2];
    const manager = new CICDGuardManager();

    try {
      switch (command) {
        case "check":
          const result = await manager.runGuardCheck();
          console.log("\n📋 GUARD CHECK RESULTS");
          console.log("=".repeat(30));
          console.log(
            `Compliance: ${result.complianceStatus ? "✅ PASS" : "❌ FAIL"}`
          );
          console.log(
            `Critical References: ${result.scanResult.summary.criticalCount}`
          );
          if (result.preCommitResult) {
            console.log(
              `Pre-commit: ${
                result.preCommitResult.allowed ? "✅ ALLOWED" : "❌ BLOCKED"
              }`
            );
          }
          console.log("\n🔧 Recommendations:");
          result.recommendations.forEach((rec) => console.log(`  ${rec}`));
          process.exit(result.complianceStatus ? 0 : 1);
          break;

        case "report":
          const period = process.argv[3] || "7d";
          const report = await manager.generateGuardReport(period);
          console.log("\n📊 GUARD REPORT");
          console.log("=".repeat(20));
          console.log(`Period: ${report.summary.period}`);
          console.log(`Activity: ${report.summary.totalActivity}`);
          console.log(
            `Block Rate: ${(report.summary.blockRate * 100).toFixed(1)}%`
          );
          console.log(
            `Critical References: ${report.metrics.criticalReferences}`
          );
          break;

        case "install":
          await manager.installGuards();
          break;

        case "uninstall":
          await manager.uninstallGuards();
          break;

        default:
          console.log("CI/CD Guard Manager");
          console.log("===================");
          console.log("Usage: ci-cd-guard-manager.ts <command>");
          console.log("");
          console.log("Commands:");
          console.log("  check              - Run comprehensive guard check");
          console.log(
            "  report [period]    - Generate guard report (7d, 30d, etc.)"
          );
          console.log("  install            - Install all guard components");
          console.log("  uninstall          - Uninstall guard components");
      }
    } catch (error) {
      console.error("❌ Command failed:", error);
      process.exit(1);
    }
  }

  main();
}
