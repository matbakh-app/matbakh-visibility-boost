#!/usr/bin/env tsx

/**
 * Integrated Quality Pipeline for AI Models
 *
 * This script orchestrates the complete quality gate pipeline including
 * offline evaluation, canary testing, performance validation, and automated rollback.
 */

import { promises as fs } from "fs";
import path from "path";
import { AutomatedRollbackManager } from "./automated-rollback";
import {
  CanaryConfig,
  CanaryOnlineEvaluator,
  CanaryResult,
} from "./canary-online-evaluation";
import { EvaluationResult, OfflineEvaluator } from "./offline-evaluation";
import {
  PerformanceGateValidator,
  PerformanceReport,
} from "./performance-gates";
import {
  MonitoringConfig,
  QualityDegradationMonitor,
} from "./quality-degradation-monitor";

interface PipelineConfig {
  modelId: string;
  previousModelId: string;
  environment: "development" | "staging" | "production";
  skipOffline: boolean;
  skipCanary: boolean;
  skipPerformance: boolean;
  autoRollback: boolean;
  monitoringDuration: number; // minutes, 0 = continuous
  outputDir: string;
}

interface PipelineResult {
  modelId: string;
  timestamp: string;
  environment: string;
  stages: {
    offline: { executed: boolean; passed: boolean; result?: EvaluationResult };
    canary: { executed: boolean; passed: boolean; result?: CanaryResult };
    performance: {
      executed: boolean;
      passed: boolean;
      result?: PerformanceReport;
    };
    rollback: { executed: boolean; triggered: boolean; reason?: string };
    monitoring: { started: boolean; duration: number };
  };
  overallStatus: "PASSED" | "FAILED" | "PARTIAL";
  deploymentRecommendation: "APPROVE" | "REJECT" | "CONDITIONAL" | "MONITOR";
  summary: string;
  nextSteps: string[];
}

class IntegratedQualityPipeline {
  private config: PipelineConfig;
  private offlineEvaluator: OfflineEvaluator;
  private canaryEvaluator: CanaryOnlineEvaluator;
  private performanceValidator: PerformanceGateValidator;
  private rollbackManager: AutomatedRollbackManager;
  private qualityMonitor: QualityDegradationMonitor;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.offlineEvaluator = new OfflineEvaluator();
    this.canaryEvaluator = new CanaryOnlineEvaluator();
    this.performanceValidator = new PerformanceGateValidator(
      config.environment
    );
    this.rollbackManager = new AutomatedRollbackManager();

    // Set up monitoring configuration
    const monitoringConfig: MonitoringConfig = {
      modelId: config.modelId,
      monitoringInterval: 30,
      baselineWindow: 10,
      alertThresholds: {
        accuracy: { warning: 0.05, critical: 0.1 },
        latency: { warning: 0.2, critical: 0.5 },
        errorRate: { warning: 1.0, critical: 2.0 },
        userSatisfaction: { warning: 0.1, critical: 0.2 },
        costIncrease: { warning: 0.3, critical: 0.8 },
      },
      rollbackConfig: {
        modelId: config.modelId,
        previousModelId: config.previousModelId,
        rollbackTriggers: [
          { type: "PERFORMANCE_DEGRADATION", threshold: 0.5, enabled: true },
          { type: "ERROR_RATE", threshold: 0.05, enabled: true },
          { type: "USER_FEEDBACK", threshold: 0.7, enabled: true },
        ],
        notificationChannels: ["slack://ops-alerts", "pagerduty://ai-team"],
        autoRollback: config.autoRollback,
        rollbackTimeout: 30,
      },
      notificationChannels: [
        "slack://ops-alerts",
        "email://oncall@matbakh.app",
      ],
    };

    this.qualityMonitor = new QualityDegradationMonitor(monitoringConfig);
  }

  async runCompletePipeline(): Promise<PipelineResult> {
    console.log("🚀 Starting Integrated AI Quality Pipeline");
    console.log("==========================================");
    console.log(`📋 Model: ${this.config.modelId}`);
    console.log(`🌍 Environment: ${this.config.environment}`);
    console.log(
      `🔄 Auto-rollback: ${this.config.autoRollback ? "Enabled" : "Disabled"}`
    );

    const startTime = Date.now();

    const result: PipelineResult = {
      modelId: this.config.modelId,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      stages: {
        offline: { executed: false, passed: false },
        canary: { executed: false, passed: false },
        performance: { executed: false, passed: false },
        rollback: { executed: false, triggered: false },
        monitoring: { started: false, duration: 0 },
      },
      overallStatus: "FAILED",
      deploymentRecommendation: "REJECT",
      summary: "",
      nextSteps: [],
    };

    try {
      // Stage 1: Offline Evaluation
      if (!this.config.skipOffline) {
        console.log("\n📊 Stage 1: Offline Evaluation");
        console.log("==============================");

        const datasetPath = await this.ensureGoldenDataset();
        const offlineResult = await this.offlineEvaluator.evaluateModel(
          this.config.modelId,
          datasetPath
        );

        result.stages.offline = {
          executed: true,
          passed: offlineResult.passed,
          result: offlineResult,
        };

        if (!offlineResult.passed) {
          console.log("❌ Offline evaluation failed, stopping pipeline");
          result.deploymentRecommendation = "REJECT";
          result.summary = "Pipeline failed at offline evaluation stage";
          result.nextSteps = [
            "Fix model issues identified in offline evaluation",
            "Re-run pipeline after fixes",
          ];
          return result;
        }
      }

      // Stage 2: Canary Online Evaluation
      if (!this.config.skipCanary) {
        console.log("\n🎯 Stage 2: Canary Online Evaluation");
        console.log("===================================");

        const canaryConfig: CanaryConfig = {
          modelId: this.config.modelId,
          trafficPercentage: this.config.environment === "production" ? 5 : 10,
          duration: this.config.environment === "production" ? 10 : 5,
          sampleSize: this.config.environment === "production" ? 200 : 100,
          thresholds: {
            successRate: 0.98,
            averageLatency:
              this.config.environment === "production" ? 800 : 1200,
            p95Latency: this.config.environment === "production" ? 1500 : 2000,
            errorRate: 0.02,
            userSatisfaction: 0.8,
            throughput: this.config.environment === "production" ? 20 : 10,
          },
        };

        const canaryResult = await this.canaryEvaluator.runCanaryEvaluation(
          canaryConfig
        );

        result.stages.canary = {
          executed: true,
          passed: canaryResult.passed,
          result: canaryResult,
        };

        if (canaryResult.recommendation === "ROLLBACK") {
          console.log(
            "❌ Canary evaluation recommends rollback, stopping pipeline"
          );
          result.deploymentRecommendation = "REJECT";
          result.summary = "Pipeline failed at canary evaluation stage";
          result.nextSteps = [
            "Investigate canary failures",
            "Consider rollback to previous version",
          ];
          return result;
        }
      }

      // Stage 3: Performance Gates
      if (!this.config.skipPerformance) {
        console.log("\n⚡ Stage 3: Performance Gates");
        console.log("=============================");

        const performanceResult =
          await this.performanceValidator.runPerformanceGates(
            this.config.modelId,
            this.config.environment === "production" ? 5 : 3
          );

        result.stages.performance = {
          executed: true,
          passed: performanceResult.overallStatus === "PASSED",
          result: performanceResult,
        };

        if (performanceResult.deploymentRecommendation === "REJECT") {
          console.log("❌ Performance gates failed, stopping pipeline");
          result.deploymentRecommendation = "REJECT";
          result.summary = "Pipeline failed at performance gates stage";
          result.nextSteps = [
            "Optimize model performance",
            "Review resource allocation",
            "Re-run performance tests",
          ];
          return result;
        }
      }

      // Stage 4: Start Quality Monitoring
      console.log("\n🔍 Stage 4: Quality Monitoring Setup");
      console.log("====================================");

      if (this.config.monitoringDuration > 0) {
        await this.qualityMonitor.startMonitoring();
        result.stages.monitoring = {
          started: true,
          duration: this.config.monitoringDuration,
        };

        console.log(
          `📊 Monitoring started for ${this.config.monitoringDuration} minutes`
        );

        // Run monitoring for specified duration
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.monitoringDuration * 60 * 1000)
        );

        await this.qualityMonitor.stopMonitoring();
        console.log("✅ Monitoring completed");
      } else {
        console.log("📊 Continuous monitoring configuration ready");
        result.stages.monitoring = { started: false, duration: 0 };
      }

      // Determine final status
      const allStagesPassed =
        (!result.stages.offline.executed || result.stages.offline.passed) &&
        (!result.stages.canary.executed || result.stages.canary.passed) &&
        (!result.stages.performance.executed ||
          result.stages.performance.passed);

      if (allStagesPassed) {
        result.overallStatus = "PASSED";
        result.deploymentRecommendation = "APPROVE";
        result.summary = "All quality gates passed successfully";
        result.nextSteps = [
          "Proceed with deployment",
          "Monitor performance in production",
          "Set up continuous quality monitoring",
        ];
      } else {
        result.overallStatus = "PARTIAL";
        result.deploymentRecommendation = "CONDITIONAL";
        result.summary = "Some quality gates passed with warnings";
        result.nextSteps = [
          "Review failed stages",
          "Consider conditional deployment with enhanced monitoring",
          "Prepare rollback plan",
        ];
      }

      // Save comprehensive report
      await this.saveComprehensiveReport(result);

      console.log(
        `\n🏁 Pipeline completed in ${((Date.now() - startTime) / 1000).toFixed(
          1
        )}s`
      );
      this.logFinalResults(result);

      return result;
    } catch (error) {
      console.error("❌ Pipeline execution failed:", error);
      result.overallStatus = "FAILED";
      result.deploymentRecommendation = "REJECT";
      result.summary = `Pipeline failed with error: ${error}`;
      result.nextSteps = ["Fix pipeline errors", "Re-run complete pipeline"];

      await this.saveComprehensiveReport(result);
      throw error;
    }
  }

  private async ensureGoldenDataset(): Promise<string> {
    const datasetPath = path.join(
      process.cwd(),
      "test",
      "datasets",
      "golden-set.json"
    );

    try {
      await fs.access(datasetPath);
      return datasetPath;
    } catch {
      // Create golden dataset if it doesn't exist
      console.log("📝 Creating golden dataset...");

      await fs.mkdir(path.dirname(datasetPath), { recursive: true });

      const goldenDataset = {
        id: "golden-set-v1",
        name: "AI Quality Gates Golden Dataset",
        samples: [
          {
            input: "Analyze the visibility of a restaurant in Munich",
            expectedOutput:
              "I'll analyze the restaurant's online visibility across multiple platforms including Google My Business, social media presence, and review platforms.",
            category: "visibility-analysis",
          },
          {
            input: "Create a social media post for a new menu item",
            expectedOutput:
              "Here's a compelling social media post highlighting your new menu item with engaging copy and relevant hashtags.",
            category: "content-generation",
          },
          {
            input: "Help me improve my restaurant's online reviews",
            expectedOutput:
              "I'll provide strategies to improve your online reviews including response templates, review request workflows, and reputation management tips.",
            category: "reputation-management",
          },
        ],
      };

      await fs.writeFile(datasetPath, JSON.stringify(goldenDataset, null, 2));
      console.log(`✅ Golden dataset created at: ${datasetPath}`);

      return datasetPath;
    }
  }

  private async saveComprehensiveReport(result: PipelineResult): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });

    const timestamp = Date.now();

    // Save JSON report
    const jsonPath = path.join(
      this.config.outputDir,
      `pipeline-report-${result.modelId}-${timestamp}.json`
    );
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));

    // Save Markdown report
    const mdPath = path.join(
      this.config.outputDir,
      `pipeline-report-${result.modelId}-${timestamp}.md`
    );
    const markdownReport = this.generateMarkdownReport(result);
    await fs.writeFile(mdPath, markdownReport);

    console.log(`📊 Comprehensive reports saved:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  Markdown: ${mdPath}`);
  }

  private generateMarkdownReport(result: PipelineResult): string {
    return `# AI Quality Pipeline Report

**Model:** ${result.modelId}
**Environment:** ${result.environment}
**Timestamp:** ${result.timestamp}
**Overall Status:** ${
      result.overallStatus === "PASSED"
        ? "✅"
        : result.overallStatus === "PARTIAL"
        ? "⚠️"
        : "❌"
    } ${result.overallStatus}
**Deployment Recommendation:** ${result.deploymentRecommendation}

## Executive Summary

${result.summary}

## Stage Results

### 📊 Offline Evaluation
- **Executed:** ${result.stages.offline.executed ? "Yes" : "No"}
- **Status:** ${result.stages.offline.passed ? "✅ PASSED" : "❌ FAILED"}
${
  result.stages.offline.result
    ? `- **Accuracy:** ${(
        result.stages.offline.result.metrics.accuracy * 100
      ).toFixed(1)}%
- **Latency:** ${result.stages.offline.result.metrics.latency.toFixed(0)}ms
- **Toxicity:** ${(result.stages.offline.result.metrics.toxicity * 100).toFixed(
        1
      )}%`
    : ""
}

### 🎯 Canary Online Evaluation
- **Executed:** ${result.stages.canary.executed ? "Yes" : "No"}
- **Status:** ${result.stages.canary.passed ? "✅ PASSED" : "❌ FAILED"}
${
  result.stages.canary.result
    ? `- **Success Rate:** ${(
        result.stages.canary.result.metrics.successRate * 100
      ).toFixed(1)}%
- **Average Latency:** ${result.stages.canary.result.metrics.averageLatency.toFixed(
        0
      )}ms
- **P95 Latency:** ${result.stages.canary.result.metrics.p95Latency.toFixed(
        0
      )}ms
- **Recommendation:** ${result.stages.canary.result.recommendation}`
    : ""
}

### ⚡ Performance Gates
- **Executed:** ${result.stages.performance.executed ? "Yes" : "No"}
- **Status:** ${result.stages.performance.passed ? "✅ PASSED" : "❌ FAILED"}
${
  result.stages.performance.result
    ? `- **P95 Latency:** ${result.stages.performance.result.metrics.latency.p95.toFixed(
        0
      )}ms
- **Throughput:** ${result.stages.performance.result.metrics.throughput.requestsPerSecond.toFixed(
        1
      )} req/s
- **Error Rate:** ${(
        result.stages.performance.result.metrics.errorRate.rate * 100
      ).toFixed(2)}%
- **Cost/Request:** $${result.stages.performance.result.metrics.costMetrics.costPerRequest.toFixed(
        4
      )}`
    : ""
}

### 🔄 Rollback System
- **Executed:** ${result.stages.rollback.executed ? "Yes" : "No"}
- **Triggered:** ${result.stages.rollback.triggered ? "Yes" : "No"}
${
  result.stages.rollback.reason
    ? `- **Reason:** ${result.stages.rollback.reason}`
    : ""
}

### 🔍 Quality Monitoring
- **Started:** ${result.stages.monitoring.started ? "Yes" : "No"}
- **Duration:** ${result.stages.monitoring.duration} minutes

## Next Steps

${result.nextSteps.map((step) => `- ${step}`).join("\n")}

## Recommendations

Based on the pipeline results, we recommend:

${
  result.deploymentRecommendation === "APPROVE"
    ? "✅ **APPROVE DEPLOYMENT**\n\n- All quality gates passed successfully\n- Model is ready for production deployment\n- Continue with standard deployment procedures"
    : result.deploymentRecommendation === "CONDITIONAL"
    ? "⚠️ **CONDITIONAL DEPLOYMENT**\n\n- Some quality gates passed with warnings\n- Deploy with enhanced monitoring\n- Prepare immediate rollback capability"
    : result.deploymentRecommendation === "MONITOR"
    ? "🔍 **DEPLOY WITH MONITORING**\n\n- Quality gates passed but require close monitoring\n- Set up real-time alerts\n- Monitor for 24-48 hours before full rollout"
    : "❌ **REJECT DEPLOYMENT**\n\n- Critical quality gates failed\n- Do not deploy to production\n- Fix identified issues and re-run pipeline"
}

---
*Report generated by Integrated AI Quality Pipeline*`;
  }

  private logFinalResults(result: PipelineResult): void {
    console.log("\n🏆 Final Pipeline Results");
    console.log("=========================");
    console.log(`Model: ${result.modelId}`);
    console.log(`Environment: ${result.environment}`);
    console.log(
      `Overall Status: ${
        result.overallStatus === "PASSED"
          ? "✅"
          : result.overallStatus === "PARTIAL"
          ? "⚠️"
          : "❌"
      } ${result.overallStatus}`
    );
    console.log(
      `Deployment: ${
        result.deploymentRecommendation === "APPROVE"
          ? "✅"
          : result.deploymentRecommendation === "CONDITIONAL"
          ? "⚠️"
          : result.deploymentRecommendation === "MONITOR"
          ? "🔍"
          : "❌"
      } ${result.deploymentRecommendation}`
    );

    console.log("\nStage Summary:");
    console.log(
      `  Offline Evaluation: ${
        result.stages.offline.executed
          ? result.stages.offline.passed
            ? "✅"
            : "❌"
          : "⏭️"
      } ${
        result.stages.offline.executed
          ? result.stages.offline.passed
            ? "PASSED"
            : "FAILED"
          : "SKIPPED"
      }`
    );
    console.log(
      `  Canary Evaluation: ${
        result.stages.canary.executed
          ? result.stages.canary.passed
            ? "✅"
            : "❌"
          : "⏭️"
      } ${
        result.stages.canary.executed
          ? result.stages.canary.passed
            ? "PASSED"
            : "FAILED"
          : "SKIPPED"
      }`
    );
    console.log(
      `  Performance Gates: ${
        result.stages.performance.executed
          ? result.stages.performance.passed
            ? "✅"
            : "❌"
          : "⏭️"
      } ${
        result.stages.performance.executed
          ? result.stages.performance.passed
            ? "PASSED"
            : "FAILED"
          : "SKIPPED"
      }`
    );
    console.log(
      `  Rollback System: ${result.stages.rollback.executed ? "✅" : "⏭️"} ${
        result.stages.rollback.triggered ? "TRIGGERED" : "READY"
      }`
    );
    console.log(
      `  Quality Monitoring: ${
        result.stages.monitoring.started ? "✅" : "⏭️"
      } ${result.stages.monitoring.started ? "ACTIVE" : "CONFIGURED"}`
    );

    console.log(`\n📋 Summary: ${result.summary}`);

    console.log("\n🎯 Next Steps:");
    result.nextSteps.forEach((step) => console.log(`  • ${step}`));

    console.log("=========================\n");
  }
}

// Default pipeline configuration
const DEFAULT_CONFIG: PipelineConfig = {
  modelId: "claude-3-5-sonnet-v2",
  previousModelId: "claude-3-5-sonnet-v1",
  environment: "staging",
  skipOffline: false,
  skipCanary: false,
  skipPerformance: false,
  autoRollback: true,
  monitoringDuration: 0, // Continuous
  outputDir: "./test/ai-quality-gates/results",
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Integrated AI Quality Pipeline

Usage: tsx integrated-quality-pipeline.ts [options]

Options:
  --model-id <id>          Model ID to test (default: claude-3-5-sonnet-v2)
  --previous-model <id>    Previous model ID for rollback (default: claude-3-5-sonnet-v1)
  --environment <env>      Environment (development|staging|production, default: staging)
  --skip-offline          Skip offline evaluation
  --skip-canary           Skip canary evaluation
  --skip-performance      Skip performance gates
  --no-auto-rollback      Disable automatic rollback
  --monitoring <minutes>   Monitoring duration (0 = continuous, default: 0)
  --output-dir <dir>      Output directory for reports
  --help, -h              Show this help message

Examples:
  tsx integrated-quality-pipeline.ts --model-id gemini-pro --environment production
  tsx integrated-quality-pipeline.ts --skip-offline --monitoring 30
  tsx integrated-quality-pipeline.ts --no-auto-rollback --environment development
    `);
    process.exit(0);
  }

  // Parse command line arguments
  const config: PipelineConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model-id":
        config.modelId = args[++i];
        break;
      case "--previous-model":
        config.previousModelId = args[++i];
        break;
      case "--environment":
        config.environment = args[++i] as any;
        break;
      case "--skip-offline":
        config.skipOffline = true;
        break;
      case "--skip-canary":
        config.skipCanary = true;
        break;
      case "--skip-performance":
        config.skipPerformance = true;
        break;
      case "--no-auto-rollback":
        config.autoRollback = false;
        break;
      case "--monitoring":
        config.monitoringDuration = parseInt(args[++i]);
        break;
      case "--output-dir":
        config.outputDir = args[++i];
        break;
    }
  }

  try {
    const pipeline = new IntegratedQualityPipeline(config);
    const result = await pipeline.runCompletePipeline();

    // Exit with appropriate code
    const exitCode = result.deploymentRecommendation === "REJECT" ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Integrated quality pipeline failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { IntegratedQualityPipeline, PipelineConfig, PipelineResult };
