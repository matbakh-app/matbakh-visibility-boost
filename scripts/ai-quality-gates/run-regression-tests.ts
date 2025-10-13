#!/usr/bin/env tsx

/**
 * Regression Test Runner for AI Model Changes
 *
 * This script runs automated regression tests for AI models and generates
 * comprehensive reports to detect performance degradation or improvements.
 */

import { promises as fs } from "fs";
import path from "path";
import {
  AutomatedRegressionTester,
  ModelVersion,
  RegressionReport,
} from "../src/lib/ai-orchestrator/__tests__/automated-regression-testing.test";

interface RegressionConfig {
  modelId: string;
  baselineModelId?: string;
  testSuites: string[];
  thresholds: {
    minPassRate: number;
    maxLatency: number;
    maxRegressionTolerance: number;
  };
  outputDir: string;
  generateReport: boolean;
}

interface ModelChangeDetection {
  hasChanges: boolean;
  changedFiles: string[];
  impactLevel: "low" | "medium" | "high";
  affectedComponents: string[];
}

class RegressionTestRunner {
  private config: RegressionConfig;
  private tester: AutomatedRegressionTester;

  constructor(config: RegressionConfig) {
    this.config = config;
    this.tester = new AutomatedRegressionTester();
  }

  async runFullRegressionSuite(): Promise<{
    success: boolean;
    report: RegressionReport;
    recommendations: string[];
  }> {
    console.log("🚀 Starting Full Regression Test Suite");
    console.log(`📋 Model: ${this.config.modelId}`);
    console.log(
      `🎯 Thresholds: Pass Rate >= ${
        this.config.thresholds.minPassRate * 100
      }%, Latency <= ${this.config.thresholds.maxLatency}ms`
    );

    try {
      // Step 1: Detect model changes
      const changes = await this.detectModelChanges();
      console.log(
        `🔍 Change Detection: ${
          changes.hasChanges ? "Changes detected" : "No changes"
        } (Impact: ${changes.impactLevel})`
      );

      // Step 2: Set up baseline if provided
      if (this.config.baselineModelId) {
        await this.setupBaseline();
      }

      // Step 3: Run regression tests
      console.log("🧪 Running regression tests...");
      const report = await this.tester.runRegressionTests(this.config.modelId);

      // Step 4: Analyze results
      const analysis = await this.analyzeResults(report, changes);

      // Step 5: Generate comprehensive report
      if (this.config.generateReport) {
        await this.generateComprehensiveReport(report, changes, analysis);
      }

      // Step 6: Determine success/failure
      const success = this.determineSuccess(report, analysis);

      console.log(
        `\n${success ? "✅" : "❌"} Regression Test Suite ${
          success ? "PASSED" : "FAILED"
        }`
      );

      return {
        success,
        report,
        recommendations: analysis.recommendations,
      };
    } catch (error) {
      console.error("❌ Regression test suite failed:", error);
      throw error;
    }
  }

  private async detectModelChanges(): Promise<ModelChangeDetection> {
    // Simulate change detection by checking for AI-related file changes
    const aiFiles = [
      "src/lib/ai-orchestrator/",
      "infra/cdk/ai-",
      "scripts/ai-quality-gates/",
      "prompts/",
      "models/",
    ];

    // In a real implementation, this would use git diff or similar
    const changedFiles = [
      "src/lib/ai-orchestrator/router-policy-engine.ts",
      "src/lib/ai-orchestrator/tool-call-adapter.ts",
    ];

    const hasChanges = changedFiles.length > 0;

    // Determine impact level based on changed files
    let impactLevel: "low" | "medium" | "high" = "low";
    const affectedComponents: string[] = [];

    if (changedFiles.some((file) => file.includes("router-policy-engine"))) {
      impactLevel = "high";
      affectedComponents.push("Model Routing");
    }

    if (changedFiles.some((file) => file.includes("tool-call-adapter"))) {
      impactLevel =
        Math.max(
          impactLevel === "high" ? 2 : impactLevel === "medium" ? 1 : 0,
          1
        ) === 2
          ? "high"
          : "medium";
      affectedComponents.push("Tool Calling");
    }

    return {
      hasChanges,
      changedFiles,
      impactLevel,
      affectedComponents,
    };
  }

  private async setupBaseline(): Promise<void> {
    console.log(`📊 Setting up baseline model: ${this.config.baselineModelId}`);

    const baselineModel: ModelVersion = {
      id: this.config.baselineModelId!,
      version: "1.0.0",
      deployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      baselineMetrics: {
        accuracy: 0.85,
        latency: 800,
        throughput: 100,
        errorRate: 0.02,
        userSatisfaction: 0.8,
        costPerRequest: 0.01,
      },
    };

    this.tester.setBaselineModel(baselineModel);
  }

  private async analyzeResults(
    report: RegressionReport,
    changes: ModelChangeDetection
  ): Promise<{
    riskLevel: "low" | "medium" | "high";
    criticalIssues: string[];
    recommendations: string[];
    deploymentReady: boolean;
  }> {
    console.log("📈 Analyzing regression test results...");

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Analyze pass rate
    if (report.passRate < this.config.thresholds.minPassRate) {
      const severity = report.passRate < 0.6 ? "CRITICAL" : "WARNING";
      criticalIssues.push(
        `${severity}: Pass rate ${(report.passRate * 100).toFixed(
          1
        )}% below threshold ${(
          this.config.thresholds.minPassRate * 100
        ).toFixed(1)}%`
      );
      riskLevel = report.passRate < 0.6 ? "high" : "medium";
    }

    // Analyze latency
    if (report.averageLatency > this.config.thresholds.maxLatency) {
      criticalIssues.push(
        `WARNING: Average latency ${report.averageLatency.toFixed(
          0
        )}ms exceeds threshold ${this.config.thresholds.maxLatency}ms`
      );
      riskLevel =
        Math.max(
          riskLevel === "high" ? 2 : riskLevel === "medium" ? 1 : 0,
          1
        ) === 2
          ? "high"
          : "medium";
    }

    // Analyze regression detection
    if (report.regressionDetected) {
      criticalIssues.push("CRITICAL: Regression detected in model performance");
      riskLevel = "high";
    }

    // Analyze based on change impact
    if (
      changes.hasChanges &&
      changes.impactLevel === "high" &&
      report.passRate < 0.9
    ) {
      criticalIssues.push(
        "WARNING: High-impact changes with sub-optimal test results"
      );
      riskLevel =
        Math.max(
          riskLevel === "high" ? 2 : riskLevel === "medium" ? 1 : 0,
          1
        ) === 2
          ? "high"
          : "medium";
    }

    // Generate recommendations
    if (riskLevel === "high") {
      recommendations.push(
        "🚨 DO NOT DEPLOY: Critical issues detected that must be resolved"
      );
      recommendations.push(
        "🔄 Consider rolling back to previous model version"
      );
      recommendations.push(
        "🧪 Run additional targeted tests on failed components"
      );
    } else if (riskLevel === "medium") {
      recommendations.push(
        "⚠️ DEPLOY WITH CAUTION: Monitor closely in production"
      );
      recommendations.push(
        "📊 Set up enhanced monitoring for affected components"
      );
      recommendations.push(
        "🎯 Consider gradual rollout with canary deployment"
      );
    } else {
      recommendations.push(
        "✅ SAFE TO DEPLOY: All regression tests passed successfully"
      );
      recommendations.push(
        "📈 Consider this as new baseline for future comparisons"
      );
    }

    // Add specific recommendations from the report
    recommendations.push(...report.recommendations);

    const deploymentReady = riskLevel !== "high" && !report.regressionDetected;

    return {
      riskLevel,
      criticalIssues,
      recommendations,
      deploymentReady,
    };
  }

  private async generateComprehensiveReport(
    report: RegressionReport,
    changes: ModelChangeDetection,
    analysis: any
  ): Promise<void> {
    console.log("📄 Generating comprehensive regression report...");

    const reportContent = this.buildReportContent(report, changes, analysis);

    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Save JSON report
    const jsonPath = path.join(
      this.config.outputDir,
      `regression-report-${report.modelVersion}-${Date.now()}.json`
    );
    await fs.writeFile(
      jsonPath,
      JSON.stringify(
        {
          report,
          changes,
          analysis,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );

    // Save Markdown report
    const mdPath = path.join(
      this.config.outputDir,
      `regression-report-${report.modelVersion}-${Date.now()}.md`
    );
    await fs.writeFile(mdPath, reportContent);

    console.log(`📊 Reports saved:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  }

  private buildReportContent(
    report: RegressionReport,
    changes: ModelChangeDetection,
    analysis: any
  ): string {
    const timestamp = new Date().toISOString();

    return `# AI Model Regression Test Report

**Generated:** ${timestamp}
**Model:** ${report.modelVersion}
**Test Suite:** Full Regression Suite

## Executive Summary

- **Overall Status:** ${analysis.deploymentReady ? "✅ PASSED" : "❌ FAILED"}
- **Risk Level:** ${analysis.riskLevel.toUpperCase()}
- **Pass Rate:** ${(report.passRate * 100).toFixed(1)}% (${
      report.passedTests
    }/${report.totalTests})
- **Average Latency:** ${report.averageLatency.toFixed(0)}ms
- **Regression Detected:** ${report.regressionDetected ? "YES" : "NO"}

## Change Analysis

- **Changes Detected:** ${changes.hasChanges ? "YES" : "NO"}
- **Impact Level:** ${changes.impactLevel.toUpperCase()}
- **Affected Components:** ${changes.affectedComponents.join(", ") || "None"}
- **Changed Files:** ${changes.changedFiles.length}

### Changed Files
${changes.changedFiles.map((file) => `- ${file}`).join("\n")}

## Test Results

### Summary
- **Total Tests:** ${report.totalTests}
- **Passed:** ${report.passedTests} (${(report.passRate * 100).toFixed(1)}%)
- **Failed:** ${report.failedTests} (${((1 - report.passRate) * 100).toFixed(
      1
    )}%)

### Failed Tests
${
  report.results
    .filter((r) => !r.passed)
    .map(
      (result) =>
        `- **${result.testCaseId}**: Similarity ${(
          result.similarity * 100
        ).toFixed(1)}% (Expected ≥ 70%)`
    )
    .join("\n") || "None"
}

### Performance Metrics
- **Average Latency:** ${report.averageLatency.toFixed(0)}ms
- **Slowest Test:** ${Math.max(...report.results.map((r) => r.latency)).toFixed(
      0
    )}ms
- **Fastest Test:** ${Math.min(...report.results.map((r) => r.latency)).toFixed(
      0
    )}ms

## Critical Issues

${
  analysis.criticalIssues.length > 0
    ? analysis.criticalIssues.map((issue: string) => `- ${issue}`).join("\n")
    : "No critical issues detected."
}

## Recommendations

${analysis.recommendations.map((rec: string) => `- ${rec}`).join("\n")}

## Detailed Test Results

| Test ID | Status | Similarity | Latency | Notes |
|---------|--------|------------|---------|-------|
${report.results
  .map(
    (result) =>
      `| ${result.testCaseId} | ${result.passed ? "✅" : "❌"} | ${(
        result.similarity * 100
      ).toFixed(1)}% | ${result.latency.toFixed(0)}ms | ${
        result.errorMessage || "-"
      } |`
  )
  .join("\n")}

## Next Steps

${
  analysis.deploymentReady
    ? "✅ **APPROVED FOR DEPLOYMENT**\n\n- Proceed with deployment to production\n- Monitor performance metrics closely\n- Set up alerts for regression detection"
    : "❌ **DEPLOYMENT BLOCKED**\n\n- Resolve critical issues before deployment\n- Re-run regression tests after fixes\n- Consider rollback to previous stable version"
}

---
*Report generated by AI Quality Gates System*`;
  }

  private determineSuccess(report: RegressionReport, analysis: any): boolean {
    return (
      report.passRate >= this.config.thresholds.minPassRate &&
      report.averageLatency <= this.config.thresholds.maxLatency &&
      !report.regressionDetected &&
      analysis.riskLevel !== "high"
    );
  }
}

// Default configuration
const DEFAULT_CONFIG: RegressionConfig = {
  modelId: "claude-3-5-sonnet-v2",
  baselineModelId: "claude-3-5-sonnet-v1",
  testSuites: ["core", "integration", "performance"],
  thresholds: {
    minPassRate: 0.8,
    maxLatency: 2000,
    maxRegressionTolerance: 0.1,
  },
  outputDir: "./test/ai-quality-gates/results",
  generateReport: true,
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
AI Model Regression Test Runner

Usage: tsx run-regression-tests.ts [options]

Options:
  --model-id <id>          Model ID to test (default: claude-3-5-sonnet-v2)
  --baseline <id>          Baseline model for comparison
  --min-pass-rate <rate>   Minimum pass rate threshold (0-1, default: 0.8)
  --max-latency <ms>       Maximum latency threshold (default: 2000ms)
  --output-dir <dir>       Output directory for reports
  --no-report             Skip report generation
  --help, -h              Show this help message

Examples:
  tsx run-regression-tests.ts --model-id gemini-pro-v1
  tsx run-regression-tests.ts --baseline claude-3-5-sonnet-v1 --min-pass-rate 0.85
    `);
    process.exit(0);
  }

  // Parse command line arguments
  const config: RegressionConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model-id":
        config.modelId = args[++i];
        break;
      case "--baseline":
        config.baselineModelId = args[++i];
        break;
      case "--min-pass-rate":
        config.thresholds.minPassRate = parseFloat(args[++i]);
        break;
      case "--max-latency":
        config.thresholds.maxLatency = parseInt(args[++i]);
        break;
      case "--output-dir":
        config.outputDir = args[++i];
        break;
      case "--no-report":
        config.generateReport = false;
        break;
    }
  }

  try {
    console.log("🧪 AI Model Regression Test Runner");
    console.log("==================================");

    const runner = new RegressionTestRunner(config);
    const result = await runner.runFullRegressionSuite();

    console.log("\n📋 Final Results:");
    console.log(`  Success: ${result.success ? "✅ YES" : "❌ NO"}`);
    console.log(`  Pass Rate: ${(result.report.passRate * 100).toFixed(1)}%`);
    console.log(
      `  Average Latency: ${result.report.averageLatency.toFixed(0)}ms`
    );
    console.log(
      `  Regression Detected: ${
        result.report.regressionDetected ? "❌ YES" : "✅ NO"
      }`
    );

    console.log("\n💡 Recommendations:");
    result.recommendations.forEach((rec) => console.log(`  ${rec}`));

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("❌ Regression test runner failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { RegressionConfig, RegressionTestRunner };
