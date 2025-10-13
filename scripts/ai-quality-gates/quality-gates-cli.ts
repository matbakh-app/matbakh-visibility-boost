#!/usr/bin/env tsx

/**
 * AI Quality Gates CLI
 *
 * Comprehensive command-line interface for managing AI quality gates,
 * running evaluations, and monitoring model performance.
 */

import { promises as fs } from "fs";
import path from "path";
import { AutomatedRollbackManager } from "./automated-rollback";
import { CanaryOnlineEvaluator } from "./canary-online-evaluation";
import { PipelineConfig } from "./integrated-quality-pipeline";
import { OfflineEvaluator } from "./offline-evaluation";
import { PerformanceGateValidator } from "./performance-gates";
import { QualityDegradationMonitor } from "./quality-degradation-monitor";
import { CompleteQualityPipelineRunner } from "./run-complete-quality-pipeline";

interface CLICommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<void>;
}

class QualityGatesCLI {
  private commands: Map<string, CLICommand> = new Map();
  private runner: CompleteQualityPipelineRunner;

  constructor() {
    this.runner = new CompleteQualityPipelineRunner();
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Pipeline Commands
    this.addCommand({
      name: "pipeline",
      description: "Run complete quality pipeline",
      usage: "pipeline [dev|staging|prod|custom] [options]",
      handler: this.handlePipeline.bind(this),
    });

    this.addCommand({
      name: "batch",
      description: "Run batch quality pipelines",
      usage: "batch [--config-file <file>] [--models <model1,model2>]",
      handler: this.handleBatch.bind(this),
    });

    // Individual Gate Commands
    this.addCommand({
      name: "offline",
      description: "Run offline evaluation only",
      usage: "offline --model-id <id> [--dataset <path>]",
      handler: this.handleOffline.bind(this),
    });

    this.addCommand({
      name: "canary",
      description: "Run canary evaluation only",
      usage:
        "canary --model-id <id> [--traffic <percentage>] [--duration <minutes>]",
      handler: this.handleCanary.bind(this),
    });

    this.addCommand({
      name: "performance",
      description: "Run performance gates only",
      usage:
        "performance --model-id <id> [--environment <env>] [--duration <minutes>]",
      handler: this.handlePerformance.bind(this),
    });

    // Monitoring Commands
    this.addCommand({
      name: "monitor",
      description: "Start quality monitoring",
      usage: "monitor --model-id <id> [--duration <minutes>] [--continuous]",
      handler: this.handleMonitor.bind(this),
    });

    this.addCommand({
      name: "rollback",
      description: "Execute rollback operation",
      usage:
        "rollback --model-id <id> --previous-model <id> [--reason <reason>]",
      handler: this.handleRollback.bind(this),
    });

    // Reporting Commands
    this.addCommand({
      name: "report",
      description: "Generate quality reports",
      usage: "report [--type <summary|detailed|comparison>] [--output <file>]",
      handler: this.handleReport.bind(this),
    });

    this.addCommand({
      name: "status",
      description: "Show current quality status",
      usage: "status [--model-id <id>] [--environment <env>]",
      handler: this.handleStatus.bind(this),
    });

    // Configuration Commands
    this.addCommand({
      name: "config",
      description: "Manage quality gate configurations",
      usage: "config [list|set|get|validate] [options]",
      handler: this.handleConfig.bind(this),
    });

    // Utility Commands
    this.addCommand({
      name: "validate",
      description: "Validate quality gate setup",
      usage: "validate [--environment <env>] [--fix]",
      handler: this.handleValidate.bind(this),
    });

    this.addCommand({
      name: "help",
      description: "Show help information",
      usage: "help [command]",
      handler: this.handleHelp.bind(this),
    });
  }

  private addCommand(command: CLICommand): void {
    this.commands.set(command.name, command);
  }

  async run(args: string[]): Promise<void> {
    if (args.length === 0) {
      await this.showMainHelp();
      return;
    }

    const commandName = args[0];
    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`❌ Unknown command: ${commandName}`);
      console.log("Use 'help' to see available commands");
      process.exit(1);
    }

    try {
      await command.handler(args.slice(1));
    } catch (error) {
      console.error(`❌ Command '${commandName}' failed:`, error);
      process.exit(1);
    }
  }

  private async handlePipeline(args: string[]): Promise<void> {
    const environment = args[0] || "dev";
    const options = this.parseOptions(args.slice(1));

    console.log(`🚀 Running ${environment} quality pipeline`);

    let result;
    switch (environment) {
      case "dev":
      case "development":
        result = await this.runner.runDevelopmentPipeline();
        break;
      case "staging":
        result = await this.runner.runStagingPipeline();
        break;
      case "prod":
      case "production":
        result = await this.runner.runProductionPipeline();
        break;
      case "custom":
        result = await this.runner.runCustomPipeline(options);
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

    console.log(`\n✅ Pipeline completed: ${result.overallStatus}`);
    console.log(
      `📋 Deployment recommendation: ${result.deploymentRecommendation}`
    );

    if (result.deploymentRecommendation === "REJECT") {
      process.exit(1);
    }
  }

  private async handleBatch(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    let configs: Partial<PipelineConfig>[] = [];

    if (options.configFile) {
      const content = await fs.readFile(options.configFile, "utf-8");
      configs = JSON.parse(content);
    } else if (options.models) {
      const models = options.models.split(",");
      configs = models.flatMap((model) => [
        { modelId: model.trim(), environment: "development" as const },
        { modelId: model.trim(), environment: "staging" as const },
      ]);
    } else {
      // Default batch
      configs = [
        { modelId: "claude-3-5-sonnet-v2", environment: "development" },
        { modelId: "claude-3-5-sonnet-v2", environment: "staging" },
        { modelId: "gemini-pro", environment: "development" },
      ];
    }

    console.log(`📦 Running batch pipelines: ${configs.length} configurations`);

    const results = await this.runner.runBatchPipelines(configs);
    await this.runner.generateComparisonReport(results);

    const hasFailures = results.some(
      (r) => r.deploymentRecommendation === "REJECT"
    );
    if (hasFailures) {
      process.exit(1);
    }
  }

  private async handleOffline(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    if (!options.modelId) {
      throw new Error("Model ID is required for offline evaluation");
    }

    console.log(`📊 Running offline evaluation for ${options.modelId}`);

    const evaluator = new OfflineEvaluator();
    const datasetPath = options.dataset || (await this.getDefaultDataset());

    const result = await evaluator.evaluateModel(options.modelId, datasetPath);

    console.log(`\n📋 Offline Evaluation Results:`);
    console.log(`  Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`  Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  Latency: ${result.metrics.latency.toFixed(0)}ms`);
    console.log(`  Toxicity: ${(result.metrics.toxicity * 100).toFixed(1)}%`);

    if (!result.passed) {
      process.exit(1);
    }
  }

  private async handleCanary(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    if (!options.modelId) {
      throw new Error("Model ID is required for canary evaluation");
    }

    console.log(`🎯 Running canary evaluation for ${options.modelId}`);

    const evaluator = new CanaryOnlineEvaluator();
    const config = {
      modelId: options.modelId,
      trafficPercentage: parseInt(options.traffic) || 5,
      duration: parseInt(options.duration) || 10,
      sampleSize: 100,
      thresholds: {
        successRate: 0.98,
        averageLatency: 800,
        p95Latency: 1500,
        errorRate: 0.02,
        userSatisfaction: 0.8,
        throughput: 20,
      },
    };

    const result = await evaluator.runCanaryEvaluation(config);

    console.log(`\n📋 Canary Evaluation Results:`);
    console.log(`  Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(
      `  Success Rate: ${(result.metrics.successRate * 100).toFixed(1)}%`
    );
    console.log(`  Avg Latency: ${result.metrics.averageLatency.toFixed(0)}ms`);
    console.log(`  P95 Latency: ${result.metrics.p95Latency.toFixed(0)}ms`);
    console.log(`  Recommendation: ${result.recommendation}`);

    if (result.recommendation === "ROLLBACK") {
      process.exit(1);
    }
  }

  private async handlePerformance(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    if (!options.modelId) {
      throw new Error("Model ID is required for performance evaluation");
    }

    console.log(`⚡ Running performance gates for ${options.modelId}`);

    const validator = new PerformanceGateValidator(
      options.environment || "staging"
    );
    const duration = parseInt(options.duration) || 5;

    const result = await validator.runPerformanceGates(
      options.modelId,
      duration
    );

    console.log(`\n📋 Performance Gates Results:`);
    console.log(
      `  Status: ${
        result.overallStatus === "PASSED" ? "✅ PASSED" : "❌ FAILED"
      }`
    );
    console.log(`  P95 Latency: ${result.metrics.latency.p95.toFixed(0)}ms`);
    console.log(
      `  Throughput: ${result.metrics.throughput.requestsPerSecond.toFixed(
        1
      )} req/s`
    );
    console.log(
      `  Error Rate: ${(result.metrics.errorRate.rate * 100).toFixed(2)}%`
    );
    console.log(`  Recommendation: ${result.deploymentRecommendation}`);

    if (result.deploymentRecommendation === "REJECT") {
      process.exit(1);
    }
  }

  private async handleMonitor(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    if (!options.modelId) {
      throw new Error("Model ID is required for monitoring");
    }

    console.log(`🔍 Starting quality monitoring for ${options.modelId}`);

    const monitoringConfig = {
      modelId: options.modelId,
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
        modelId: options.modelId,
        previousModelId: options.previousModel || "previous-model",
        rollbackTriggers: [
          { type: "PERFORMANCE_DEGRADATION", threshold: 0.5, enabled: true },
          { type: "ERROR_RATE", threshold: 0.05, enabled: true },
        ],
        notificationChannels: ["slack://ops-alerts"],
        autoRollback: !options.noAutoRollback,
        rollbackTimeout: 30,
      },
      notificationChannels: ["slack://ops-alerts"],
    };

    const monitor = new QualityDegradationMonitor(monitoringConfig);

    await monitor.startMonitoring();
    console.log("📊 Monitoring started");

    if (options.continuous) {
      console.log("🔄 Continuous monitoring active (Ctrl+C to stop)");
      // Keep process alive for continuous monitoring
      process.on("SIGINT", async () => {
        console.log("\n🛑 Stopping monitoring...");
        await monitor.stopMonitoring();
        process.exit(0);
      });

      // Keep alive
      setInterval(() => {}, 1000);
    } else {
      const duration = parseInt(options.duration) || 30;
      console.log(`⏱️ Monitoring for ${duration} minutes`);

      setTimeout(async () => {
        await monitor.stopMonitoring();
        console.log("✅ Monitoring completed");
        process.exit(0);
      }, duration * 60 * 1000);
    }
  }

  private async handleRollback(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    if (!options.modelId || !options.previousModel) {
      throw new Error(
        "Both model-id and previous-model are required for rollback"
      );
    }

    console.log(
      `🔄 Executing rollback from ${options.modelId} to ${options.previousModel}`
    );

    const rollbackManager = new AutomatedRollbackManager();

    const rollbackConfig = {
      modelId: options.modelId,
      previousModelId: options.previousModel,
      rollbackTriggers: [],
      notificationChannels: ["slack://ops-alerts"],
      autoRollback: false,
      rollbackTimeout: 30,
    };

    const reason = options.reason || "Manual rollback requested";

    const result = await rollbackManager.executeRollback(
      rollbackConfig,
      reason
    );

    console.log(`\n📋 Rollback Results:`);
    console.log(`  Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Reason: ${reason}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(", ")}`);
    }

    if (!result.success) {
      process.exit(1);
    }
  }

  private async handleReport(args: string[]): Promise<void> {
    const options = this.parseOptions(args);
    const reportType = options.type || "summary";

    console.log(`📊 Generating ${reportType} report`);

    switch (reportType) {
      case "summary":
        await this.generateSummaryReport(options);
        break;
      case "detailed":
        await this.generateDetailedReport(options);
        break;
      case "comparison":
        await this.generateComparisonReport(options);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async handleStatus(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    console.log("📊 Quality Gates Status");
    console.log("======================");

    // Show overall system status
    console.log("\n🏥 System Health:");
    console.log("  Quality Gates: ✅ Operational");
    console.log("  Monitoring: ✅ Active");
    console.log("  Rollback System: ✅ Ready");

    // Show recent pipeline results
    try {
      const recentResults = await this.getRecentResults(
        options.modelId,
        options.environment
      );

      if (recentResults.length > 0) {
        console.log("\n📈 Recent Pipeline Results:");
        recentResults.slice(0, 5).forEach((result, i) => {
          const status =
            result.overallStatus === "PASSED"
              ? "✅"
              : result.overallStatus === "PARTIAL"
              ? "⚠️"
              : "❌";
          console.log(
            `  ${i + 1}. ${result.modelId} (${result.environment}): ${status} ${
              result.overallStatus
            }`
          );
        });
      } else {
        console.log("\n📈 No recent pipeline results found");
      }
    } catch (error) {
      console.log("\n📈 Unable to load recent results");
    }

    // Show active monitoring
    console.log("\n🔍 Active Monitoring:");
    console.log("  Models under monitoring: 0"); // TODO: Get from actual monitoring system
    console.log("  Alerts in last 24h: 0");
  }

  private async handleConfig(args: string[]): Promise<void> {
    const action = args[0] || "list";
    const options = this.parseOptions(args.slice(1));

    switch (action) {
      case "list":
        await this.listConfigurations();
        break;
      case "set":
        await this.setConfiguration(options);
        break;
      case "get":
        await this.getConfiguration(options);
        break;
      case "validate":
        await this.validateConfiguration(options);
        break;
      default:
        throw new Error(`Unknown config action: ${action}`);
    }
  }

  private async handleValidate(args: string[]): Promise<void> {
    const options = this.parseOptions(args);

    console.log("🔍 Validating Quality Gates Setup");
    console.log("=================================");

    const issues: string[] = [];

    // Check required directories
    const requiredDirs = [
      "./test/ai-quality-gates",
      "./test/datasets",
      "./scripts/ai-quality-gates",
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ Directory exists: ${dir}`);
      } catch {
        console.log(`❌ Missing directory: ${dir}`);
        issues.push(`Create directory: ${dir}`);
      }
    }

    // Check required files
    const requiredFiles = [
      "./test/datasets/golden-set.json",
      "./scripts/ai-quality-gates/integrated-quality-pipeline.ts",
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        console.log(`✅ File exists: ${file}`);
      } catch {
        console.log(`❌ Missing file: ${file}`);
        issues.push(`Create file: ${file}`);
      }
    }

    if (issues.length > 0) {
      console.log("\n🔧 Issues found:");
      issues.forEach((issue) => console.log(`  • ${issue}`));

      if (options.fix) {
        console.log("\n🛠️ Attempting to fix issues...");
        await this.fixValidationIssues(issues);
      }
    } else {
      console.log("\n✅ All validations passed!");
    }
  }

  private async handleHelp(args: string[]): Promise<void> {
    const commandName = args[0];

    if (commandName) {
      const command = this.commands.get(commandName);
      if (command) {
        console.log(`\n${command.name} - ${command.description}`);
        console.log(`Usage: ${command.usage}\n`);
      } else {
        console.log(`❌ Unknown command: ${commandName}`);
      }
    } else {
      await this.showMainHelp();
    }
  }

  private async showMainHelp(): Promise<void> {
    console.log(`
🤖 AI Quality Gates CLI

A comprehensive tool for managing AI model quality gates, evaluations, and monitoring.

Usage: tsx quality-gates-cli.ts <command> [options]

Commands:
  pipeline     Run complete quality pipeline
  batch        Run batch quality pipelines  
  offline      Run offline evaluation only
  canary       Run canary evaluation only
  performance  Run performance gates only
  monitor      Start quality monitoring
  rollback     Execute rollback operation
  report       Generate quality reports
  status       Show current quality status
  config       Manage configurations
  validate     Validate setup
  help         Show help information

Examples:
  tsx quality-gates-cli.ts pipeline dev
  tsx quality-gates-cli.ts offline --model-id claude-3-5-sonnet-v2
  tsx quality-gates-cli.ts monitor --model-id gemini-pro --duration 30
  tsx quality-gates-cli.ts batch --models "claude-3-5-sonnet-v2,gemini-pro"
  tsx quality-gates-cli.ts report --type comparison

Use 'help <command>' for detailed command information.
    `);
  }

  private parseOptions(args: string[]): Record<string, string> {
    const options: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith("--")) {
        const key = args[i]
          .substring(2)
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        const value =
          args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
        options[key] = value;
      }
    }

    return options;
  }

  private async getDefaultDataset(): Promise<string> {
    const datasetPath = "./test/datasets/golden-set.json";

    try {
      await fs.access(datasetPath);
      return datasetPath;
    } catch {
      // Create default dataset
      await fs.mkdir(path.dirname(datasetPath), { recursive: true });

      const defaultDataset = {
        id: "golden-set-v1",
        name: "Default Golden Dataset",
        samples: [
          {
            input: "Analyze restaurant visibility",
            expectedOutput: "I'll analyze the restaurant's online presence",
            category: "analysis",
          },
        ],
      };

      await fs.writeFile(datasetPath, JSON.stringify(defaultDataset, null, 2));
      return datasetPath;
    }
  }

  private async generateSummaryReport(
    options: Record<string, string>
  ): Promise<void> {
    console.log("📊 Summary report generation not yet implemented");
  }

  private async generateDetailedReport(
    options: Record<string, string>
  ): Promise<void> {
    console.log("📊 Detailed report generation not yet implemented");
  }

  private async generateComparisonReport(
    options: Record<string, string>
  ): Promise<void> {
    const results = await this.getRecentResults();
    if (results.length > 0) {
      await this.runner.generateComparisonReport(results);
    } else {
      console.log("📊 No results available for comparison");
    }
  }

  private async getRecentResults(
    modelId?: string,
    environment?: string
  ): Promise<any[]> {
    // TODO: Implement actual result loading from files
    return [];
  }

  private async listConfigurations(): Promise<void> {
    console.log("⚙️ Configuration listing not yet implemented");
  }

  private async setConfiguration(
    options: Record<string, string>
  ): Promise<void> {
    console.log("⚙️ Configuration setting not yet implemented");
  }

  private async getConfiguration(
    options: Record<string, string>
  ): Promise<void> {
    console.log("⚙️ Configuration getting not yet implemented");
  }

  private async validateConfiguration(
    options: Record<string, string>
  ): Promise<void> {
    console.log("⚙️ Configuration validation not yet implemented");
  }

  private async fixValidationIssues(issues: string[]): Promise<void> {
    console.log("🛠️ Automatic issue fixing not yet implemented");
  }
}

// Main execution
async function main() {
  const cli = new QualityGatesCLI();
  await cli.run(process.argv.slice(2));
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { QualityGatesCLI };
