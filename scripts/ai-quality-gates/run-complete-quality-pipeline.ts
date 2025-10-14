#!/usr/bin/env tsx

/**
 * Complete Quality Pipeline Runner
 *
 * This script provides a comprehensive interface to run the complete
 * AI quality pipeline with various configurations and environments.
 */

import { promises as fs } from "fs";
import path from "path";
import {
  IntegratedQualityPipeline,
  PipelineConfig,
  PipelineResult,
} from "./integrated-quality-pipeline";

interface QualityPipelineRunner {
  runDevelopmentPipeline(): Promise<PipelineResult>;
  runStagingPipeline(): Promise<PipelineResult>;
  runProductionPipeline(): Promise<PipelineResult>;
  runCustomPipeline(config: Partial<PipelineConfig>): Promise<PipelineResult>;
  runBatchPipelines(
    configs: Partial<PipelineConfig>[]
  ): Promise<PipelineResult[]>;
  generateComparisonReport(results: PipelineResult[]): Promise<string>;
}

class CompleteQualityPipelineRunner implements QualityPipelineRunner {
  private baseConfig: PipelineConfig;

  constructor() {
    this.baseConfig = {
      modelId: "claude-3-5-sonnet-v2",
      previousModelId: "claude-3-5-sonnet-v1",
      environment: "development",
      skipOffline: false,
      skipCanary: false,
      skipPerformance: false,
      autoRollback: true,
      monitoringDuration: 0,
      outputDir: "./test/ai-quality-gates/results",
    };
  }

  async runDevelopmentPipeline(): Promise<PipelineResult> {
    console.log("🚀 Running Development Quality Pipeline");
    console.log("=====================================");

    const config: PipelineConfig = {
      ...this.baseConfig,
      environment: "development",
      skipOffline: false,
      skipCanary: true, // Skip canary in development
      skipPerformance: false,
      autoRollback: false, // Manual rollback in dev
      monitoringDuration: 5, // Short monitoring
      outputDir: "./test/ai-quality-gates/results/development",
    };

    const pipeline = new IntegratedQualityPipeline(config);
    return await pipeline.runCompletePipeline();
  }

  async runStagingPipeline(): Promise<PipelineResult> {
    console.log("🎯 Running Staging Quality Pipeline");
    console.log("==================================");

    const config: PipelineConfig = {
      ...this.baseConfig,
      environment: "staging",
      skipOffline: false,
      skipCanary: false,
      skipPerformance: false,
      autoRollback: true,
      monitoringDuration: 15, // Medium monitoring
      outputDir: "./test/ai-quality-gates/results/staging",
    };

    const pipeline = new IntegratedQualityPipeline(config);
    return await pipeline.runCompletePipeline();
  }

  async runProductionPipeline(): Promise<PipelineResult> {
    console.log("🏭 Running Production Quality Pipeline");
    console.log("====================================");

    const config: PipelineConfig = {
      ...this.baseConfig,
      environment: "production",
      skipOffline: false,
      skipCanary: false,
      skipPerformance: false,
      autoRollback: true,
      monitoringDuration: 30, // Extended monitoring
      outputDir: "./test/ai-quality-gates/results/production",
    };

    const pipeline = new IntegratedQualityPipeline(config);
    return await pipeline.runCompletePipeline();
  }

  async runCustomPipeline(
    customConfig: Partial<PipelineConfig>
  ): Promise<PipelineResult> {
    console.log("⚙️ Running Custom Quality Pipeline");
    console.log("=================================");

    const config: PipelineConfig = {
      ...this.baseConfig,
      ...customConfig,
    };

    console.log(`📋 Configuration:`);
    console.log(`  Model: ${config.modelId}`);
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Skip Offline: ${config.skipOffline}`);
    console.log(`  Skip Canary: ${config.skipCanary}`);
    console.log(`  Skip Performance: ${config.skipPerformance}`);
    console.log(`  Auto Rollback: ${config.autoRollback}`);
    console.log(`  Monitoring: ${config.monitoringDuration} minutes`);

    const pipeline = new IntegratedQualityPipeline(config);
    return await pipeline.runCompletePipeline();
  }

  async runBatchPipelines(
    configs: Partial<PipelineConfig>[]
  ): Promise<PipelineResult[]> {
    console.log("📦 Running Batch Quality Pipelines");
    console.log("=================================");
    console.log(`📊 Total pipelines: ${configs.length}`);

    const results: PipelineResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(`\n🔄 Running pipeline ${i + 1}/${configs.length}`);
      console.log(`📋 Model: ${config.modelId || this.baseConfig.modelId}`);
      console.log(
        `🌍 Environment: ${config.environment || this.baseConfig.environment}`
      );

      try {
        const result = await this.runCustomPipeline(config);
        results.push(result);
        console.log(`✅ Pipeline ${i + 1} completed: ${result.overallStatus}`);
      } catch (error) {
        console.error(`❌ Pipeline ${i + 1} failed:`, error);
        // Create a failed result for consistency
        const failedResult: PipelineResult = {
          modelId: config.modelId || this.baseConfig.modelId,
          timestamp: new Date().toISOString(),
          environment: config.environment || this.baseConfig.environment,
          stages: {
            offline: { executed: false, passed: false },
            canary: { executed: false, passed: false },
            performance: { executed: false, passed: false },
            rollback: { executed: false, triggered: false },
            monitoring: { started: false, duration: 0 },
          },
          overallStatus: "FAILED",
          deploymentRecommendation: "REJECT",
          summary: `Pipeline failed with error: ${error}`,
          nextSteps: ["Fix pipeline errors", "Re-run pipeline"],
        };
        results.push(failedResult);
      }
    }

    console.log(`\n📊 Batch execution completed: ${results.length} pipelines`);
    console.log(
      `✅ Passed: ${results.filter((r) => r.overallStatus === "PASSED").length}`
    );
    console.log(
      `⚠️ Partial: ${
        results.filter((r) => r.overallStatus === "PARTIAL").length
      }`
    );
    console.log(
      `❌ Failed: ${results.filter((r) => r.overallStatus === "FAILED").length}`
    );

    return results;
  }

  async generateComparisonReport(results: PipelineResult[]): Promise<string> {
    console.log("📊 Generating Comparison Report");
    console.log("==============================");

    const timestamp = new Date().toISOString();
    const reportPath = path.join(
      this.baseConfig.outputDir,
      `comparison-report-${Date.now()}.md`
    );

    const report = `# AI Quality Pipeline Comparison Report

**Generated:** ${timestamp}
**Pipelines Compared:** ${results.length}

## Executive Summary

${this.generateExecutiveSummary(results)}

## Pipeline Comparison

| Model | Environment | Status | Deployment | Offline | Canary | Performance | Monitoring |
|-------|-------------|--------|------------|---------|--------|-------------|------------|
${results
  .map(
    (r) =>
      `| ${r.modelId} | ${r.environment} | ${this.getStatusIcon(
        r.overallStatus
      )} ${r.overallStatus} | ${this.getRecommendationIcon(
        r.deploymentRecommendation
      )} ${r.deploymentRecommendation} | ${this.getStageIcon(
        r.stages.offline
      )} | ${this.getStageIcon(r.stages.canary)} | ${this.getStageIcon(
        r.stages.performance
      )} | ${r.stages.monitoring.started ? "✅" : "⏭️"} |`
  )
  .join("\n")}

## Detailed Results

${results.map((r, i) => this.generateDetailedSection(r, i + 1)).join("\n\n")}

## Recommendations

${this.generateRecommendations(results)}

## Next Steps

${this.generateNextSteps(results)}

---
*Report generated by Complete Quality Pipeline Runner*`;

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);

    console.log(`📄 Comparison report saved: ${reportPath}`);
    return reportPath;
  }

  private generateExecutiveSummary(results: PipelineResult[]): string {
    const passed = results.filter((r) => r.overallStatus === "PASSED").length;
    const partial = results.filter((r) => r.overallStatus === "PARTIAL").length;
    const failed = results.filter((r) => r.overallStatus === "FAILED").length;

    const approvedForDeployment = results.filter(
      (r) =>
        r.deploymentRecommendation === "APPROVE" ||
        r.deploymentRecommendation === "CONDITIONAL"
    ).length;

    return `Out of ${results.length} pipelines executed:

- **${passed}** pipelines passed all quality gates
- **${partial}** pipelines passed with warnings
- **${failed}** pipelines failed critical gates
- **${approvedForDeployment}** models are approved for deployment

${
  passed === results.length
    ? "🎉 All pipelines passed successfully! All models are ready for deployment."
    : failed > passed
    ? "⚠️ More pipelines failed than passed. Review failed models before deployment."
    : "✅ Majority of pipelines passed. Review partial/failed results for deployment decisions."
}`;
  }

  private generateDetailedSection(
    result: PipelineResult,
    index: number
  ): string {
    return `### ${index}. ${result.modelId} (${result.environment})

**Status:** ${this.getStatusIcon(result.overallStatus)} ${result.overallStatus}
**Deployment:** ${this.getRecommendationIcon(
      result.deploymentRecommendation
    )} ${result.deploymentRecommendation}
**Timestamp:** ${result.timestamp}

**Summary:** ${result.summary}

**Stage Results:**
- Offline Evaluation: ${this.getStageIcon(
      result.stages.offline
    )} ${this.getStageStatus(result.stages.offline)}
- Canary Evaluation: ${this.getStageIcon(
      result.stages.canary
    )} ${this.getStageStatus(result.stages.canary)}
- Performance Gates: ${this.getStageIcon(
      result.stages.performance
    )} ${this.getStageStatus(result.stages.performance)}
- Quality Monitoring: ${
      result.stages.monitoring.started ? "✅ Active" : "⏭️ Configured"
    }

**Next Steps:**
${result.nextSteps.map((step) => `- ${step}`).join("\n")}`;
  }

  private generateRecommendations(results: PipelineResult[]): string {
    const recommendations: string[] = [];

    const failedResults = results.filter((r) => r.overallStatus === "FAILED");
    if (failedResults.length > 0) {
      recommendations.push(
        `🔴 **Critical:** ${failedResults.length} models failed quality gates and should not be deployed.`
      );
    }

    const partialResults = results.filter((r) => r.overallStatus === "PARTIAL");
    if (partialResults.length > 0) {
      recommendations.push(
        `🟡 **Warning:** ${partialResults.length} models passed with warnings. Deploy with enhanced monitoring.`
      );
    }

    const approvedResults = results.filter(
      (r) => r.deploymentRecommendation === "APPROVE"
    );
    if (approvedResults.length > 0) {
      recommendations.push(
        `🟢 **Ready:** ${approvedResults.length} models are approved for immediate deployment.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "📊 All pipelines completed. Review individual results for deployment decisions."
      );
    }

    return recommendations.join("\n\n");
  }

  private generateNextSteps(results: PipelineResult[]): string {
    const nextSteps = new Set<string>();

    results.forEach((result) => {
      result.nextSteps.forEach((step) => nextSteps.add(step));
    });

    return Array.from(nextSteps)
      .map((step) => `- ${step}`)
      .join("\n");
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case "PASSED":
        return "✅";
      case "PARTIAL":
        return "⚠️";
      case "FAILED":
        return "❌";
      default:
        return "❓";
    }
  }

  private getRecommendationIcon(recommendation: string): string {
    switch (recommendation) {
      case "APPROVE":
        return "✅";
      case "CONDITIONAL":
        return "⚠️";
      case "MONITOR":
        return "🔍";
      case "REJECT":
        return "❌";
      default:
        return "❓";
    }
  }

  private getStageIcon(stage: { executed: boolean; passed: boolean }): string {
    if (!stage.executed) return "⏭️";
    return stage.passed ? "✅" : "❌";
  }

  private getStageStatus(stage: {
    executed: boolean;
    passed: boolean;
  }): string {
    if (!stage.executed) return "SKIPPED";
    return stage.passed ? "PASSED" : "FAILED";
  }
}

// Predefined pipeline configurations
const PREDEFINED_CONFIGS = {
  development: {
    environment: "development" as const,
    skipCanary: true,
    autoRollback: false,
    monitoringDuration: 5,
  },
  staging: {
    environment: "staging" as const,
    skipOffline: false,
    skipCanary: false,
    autoRollback: true,
    monitoringDuration: 15,
  },
  production: {
    environment: "production" as const,
    skipOffline: false,
    skipCanary: false,
    autoRollback: true,
    monitoringDuration: 30,
  },
  quickTest: {
    environment: "development" as const,
    skipOffline: true,
    skipCanary: true,
    skipPerformance: true,
    monitoringDuration: 0,
  },
  fullValidation: {
    environment: "staging" as const,
    skipOffline: false,
    skipCanary: false,
    skipPerformance: false,
    monitoringDuration: 20,
  },
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Complete AI Quality Pipeline Runner

Usage: tsx run-complete-quality-pipeline.ts [command] [options]

Commands:
  dev, development     Run development pipeline
  staging              Run staging pipeline  
  prod, production     Run production pipeline
  custom               Run custom pipeline with options
  batch                Run multiple pipelines
  compare              Generate comparison report from existing results

Predefined Configurations:
  --config development    Development environment (skip canary, manual rollback)
  --config staging        Staging environment (full pipeline, auto rollback)
  --config production     Production environment (full pipeline, extended monitoring)
  --config quick-test     Quick test (skip most gates)
  --config full-validation Full validation pipeline

Options:
  --model-id <id>         Model ID to test
  --previous-model <id>   Previous model ID for rollback
  --skip-offline         Skip offline evaluation
  --skip-canary          Skip canary evaluation  
  --skip-performance     Skip performance gates
  --no-auto-rollback     Disable automatic rollback
  --monitoring <minutes>  Monitoring duration (0 = continuous)
  --output-dir <dir>     Output directory for reports
  --batch-file <file>    JSON file with batch configurations
  --help, -h             Show this help message

Examples:
  tsx run-complete-quality-pipeline.ts dev
  tsx run-complete-quality-pipeline.ts staging --model-id gemini-pro
  tsx run-complete-quality-pipeline.ts custom --config production --monitoring 60
  tsx run-complete-quality-pipeline.ts batch --batch-file ./configs/batch-test.json
  tsx run-complete-quality-pipeline.ts compare
    `);
    process.exit(0);
  }

  const runner = new CompleteQualityPipelineRunner();
  const command = args[0] || "dev";

  try {
    let result: PipelineResult | PipelineResult[] | string;

    switch (command) {
      case "dev":
      case "development":
        result = await runner.runDevelopmentPipeline();
        break;

      case "staging":
        result = await runner.runStagingPipeline();
        break;

      case "prod":
      case "production":
        result = await runner.runProductionPipeline();
        break;

      case "custom":
        const customConfig = parseCustomConfig(args.slice(1));
        result = await runner.runCustomPipeline(customConfig);
        break;

      case "batch":
        const batchConfigs = await parseBatchConfig(args.slice(1));
        result = await runner.runBatchPipelines(batchConfigs);

        // Generate comparison report for batch results
        if (Array.isArray(result)) {
          await runner.generateComparisonReport(result);
        }
        break;

      case "compare":
        // Load existing results and generate comparison
        const existingResults = await loadExistingResults();
        result = await runner.generateComparisonReport(existingResults);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log("Use --help for available commands");
        process.exit(1);
    }

    // Determine exit code
    if (Array.isArray(result)) {
      const hasFailures = result.some(
        (r) => r.deploymentRecommendation === "REJECT"
      );
      process.exit(hasFailures ? 1 : 0);
    } else if (
      typeof result === "object" &&
      "deploymentRecommendation" in result
    ) {
      process.exit(result.deploymentRecommendation === "REJECT" ? 1 : 0);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Complete quality pipeline runner failed:", error);
    process.exit(1);
  }
}

function parseCustomConfig(args: string[]): Partial<PipelineConfig> {
  const config: Partial<PipelineConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--config":
        const predefinedConfig =
          PREDEFINED_CONFIGS[args[++i] as keyof typeof PREDEFINED_CONFIGS];
        if (predefinedConfig) {
          Object.assign(config, predefinedConfig);
        }
        break;
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

  return config;
}

async function parseBatchConfig(
  args: string[]
): Promise<Partial<PipelineConfig>[]> {
  const batchFileIndex = args.indexOf("--batch-file");

  if (batchFileIndex !== -1 && batchFileIndex + 1 < args.length) {
    const batchFile = args[batchFileIndex + 1];
    try {
      const content = await fs.readFile(batchFile, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to load batch file: ${batchFile}`, error);
      process.exit(1);
    }
  }

  // Default batch configurations
  return [
    { modelId: "claude-3-5-sonnet-v2", environment: "development" },
    { modelId: "claude-3-5-sonnet-v2", environment: "staging" },
    { modelId: "gemini-pro", environment: "development" },
    { modelId: "gemini-pro", environment: "staging" },
  ];
}

async function loadExistingResults(): Promise<PipelineResult[]> {
  const resultsDir = "./test/ai-quality-gates/results";
  const results: PipelineResult[] = [];

  try {
    const files = await fs.readdir(resultsDir, { recursive: true });
    const jsonFiles = files.filter(
      (file) =>
        typeof file === "string" &&
        file.endsWith(".json") &&
        file.includes("pipeline-report")
    );

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(resultsDir, file as string);
        const content = await fs.readFile(filePath, "utf-8");
        const result = JSON.parse(content) as PipelineResult;
        results.push(result);
      } catch (error) {
        console.warn(`⚠️ Failed to load result file: ${file}`, error);
      }
    }
  } catch (error) {
    console.warn("⚠️ No existing results found, using empty results");
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CompleteQualityPipelineRunner, PREDEFINED_CONFIGS };
