#!/usr/bin/env tsx

/**
 * Quality Degradation Monitor and Automated Rollback System
 *
 * This script continuously monitors AI model quality in production
 * and triggers automated rollbacks when degradation is detected.
 */

import { promises as fs } from "fs";
import path from "path";
import { AutomatedRollbackManager, RollbackConfig } from "./automated-rollback";
import { PerformanceGateValidator } from "./performance-gates";

interface QualityMetrics {
  timestamp: string;
  modelId: string;
  accuracy: number;
  latency: number;
  errorRate: number;
  userSatisfaction: number;
  throughput: number;
  costPerRequest: number;
}

interface DegradationAlert {
  id: string;
  timestamp: string;
  modelId: string;
  alertType:
    | "PERFORMANCE"
    | "ACCURACY"
    | "ERROR_RATE"
    | "USER_SATISFACTION"
    | "COST";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  currentValue: number;
  baselineValue: number;
  threshold: number;
  degradationPercentage: number;
  message: string;
  actionTaken: "NONE" | "ALERT" | "ROLLBACK" | "SCALE";
}

interface MonitoringConfig {
  modelId: string;
  monitoringInterval: number; // seconds
  baselineWindow: number; // minutes
  alertThresholds: {
    accuracy: { warning: number; critical: number };
    latency: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
    userSatisfaction: { warning: number; critical: number };
    costIncrease: { warning: number; critical: number };
  };
  rollbackConfig: RollbackConfig;
  notificationChannels: string[];
}

class QualityDegradationMonitor {
  private config: MonitoringConfig;
  private rollbackManager: AutomatedRollbackManager;
  private performanceValidator: PerformanceGateValidator;
  private metricsHistory: QualityMetrics[] = [];
  private alerts: DegradationAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.rollbackManager = new AutomatedRollbackManager();
    this.performanceValidator = new PerformanceGateValidator("production");
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("⚠️ Monitoring is already running");
      return;
    }

    console.log(
      `🔍 Starting quality degradation monitoring for model: ${this.config.modelId}`
    );
    console.log(`📊 Monitoring interval: ${this.config.monitoringInterval}s`);
    console.log(`📈 Baseline window: ${this.config.baselineWindow} minutes`);

    this.isMonitoring = true;

    // Load historical metrics if available
    await this.loadHistoricalMetrics();

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performQualityCheck();
      } catch (error) {
        console.error("❌ Error during quality check:", error);
      }
    }, this.config.monitoringInterval * 1000);

    console.log("✅ Quality degradation monitoring started");
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log("⚠️ Monitoring is not running");
      return;
    }

    console.log("🛑 Stopping quality degradation monitoring...");

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;

    // Save metrics history
    await this.saveMetricsHistory();

    console.log("✅ Quality degradation monitoring stopped");
  }

  private async performQualityCheck(): Promise<void> {
    console.log(`🔍 Performing quality check at ${new Date().toISOString()}`);

    try {
      // Step 1: Collect current metrics
      const currentMetrics = await this.collectCurrentMetrics();
      this.metricsHistory.push(currentMetrics);

      // Step 2: Calculate baseline metrics
      const baselineMetrics = this.calculateBaselineMetrics();

      // Step 3: Detect degradation
      const alerts = await this.detectDegradation(
        currentMetrics,
        baselineMetrics
      );

      // Step 4: Process alerts and take actions
      for (const alert of alerts) {
        await this.processAlert(alert);
      }

      // Step 5: Cleanup old metrics
      this.cleanupOldMetrics();

      console.log(
        `✅ Quality check completed. ${alerts.length} alerts generated.`
      );
    } catch (error) {
      console.error("❌ Quality check failed:", error);
    }
  }

  private async collectCurrentMetrics(): Promise<QualityMetrics> {
    // In a real implementation, this would collect metrics from monitoring systems
    // For simulation, we'll generate realistic metrics with potential degradation

    const baseMetrics = {
      accuracy: 0.85,
      latency: 800,
      errorRate: 0.02,
      userSatisfaction: 0.8,
      throughput: 50,
      costPerRequest: 0.025,
    };

    // Simulate potential degradation scenarios
    const degradationScenarios = [
      { type: "normal", probability: 0.7 },
      { type: "latency_spike", probability: 0.1 },
      { type: "accuracy_drop", probability: 0.1 },
      { type: "error_increase", probability: 0.05 },
      { type: "cost_spike", probability: 0.05 },
    ];

    const scenario = this.selectScenario(degradationScenarios);

    let metrics = { ...baseMetrics };

    switch (scenario) {
      case "latency_spike":
        metrics.latency *= 1.5 + Math.random() * 1.0; // 1.5x to 2.5x increase
        break;
      case "accuracy_drop":
        metrics.accuracy *= 0.7 + Math.random() * 0.2; // 70-90% of baseline
        break;
      case "error_increase":
        metrics.errorRate *= 2 + Math.random() * 3; // 2x to 5x increase
        break;
      case "cost_spike":
        metrics.costPerRequest *= 1.8 + Math.random() * 1.2; // 1.8x to 3x increase
        break;
      default:
        // Normal variation
        metrics.accuracy *= 0.95 + Math.random() * 0.1;
        metrics.latency *= 0.9 + Math.random() * 0.2;
        metrics.errorRate *= 0.5 + Math.random() * 1.0;
        metrics.userSatisfaction *= 0.95 + Math.random() * 0.1;
        metrics.throughput *= 0.9 + Math.random() * 0.2;
        metrics.costPerRequest *= 0.9 + Math.random() * 0.2;
    }

    return {
      timestamp: new Date().toISOString(),
      modelId: this.config.modelId,
      ...metrics,
    };
  }

  private selectScenario(
    scenarios: Array<{ type: string; probability: number }>
  ): string {
    const random = Math.random();
    let cumulative = 0;

    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        return scenario.type;
      }
    }

    return "normal";
  }

  private calculateBaselineMetrics(): QualityMetrics | null {
    const baselineWindowMs = this.config.baselineWindow * 60 * 1000;
    const cutoffTime = Date.now() - baselineWindowMs;

    const baselineMetrics = this.metricsHistory.filter(
      (m) => new Date(m.timestamp).getTime() >= cutoffTime
    );

    if (baselineMetrics.length === 0) {
      return null;
    }

    // Calculate averages for baseline
    const avgMetrics = baselineMetrics.reduce(
      (acc, metrics) => ({
        timestamp: new Date().toISOString(),
        modelId: this.config.modelId,
        accuracy: acc.accuracy + metrics.accuracy,
        latency: acc.latency + metrics.latency,
        errorRate: acc.errorRate + metrics.errorRate,
        userSatisfaction: acc.userSatisfaction + metrics.userSatisfaction,
        throughput: acc.throughput + metrics.throughput,
        costPerRequest: acc.costPerRequest + metrics.costPerRequest,
      }),
      {
        timestamp: "",
        modelId: "",
        accuracy: 0,
        latency: 0,
        errorRate: 0,
        userSatisfaction: 0,
        throughput: 0,
        costPerRequest: 0,
      }
    );

    const count = baselineMetrics.length;
    return {
      timestamp: new Date().toISOString(),
      modelId: this.config.modelId,
      accuracy: avgMetrics.accuracy / count,
      latency: avgMetrics.latency / count,
      errorRate: avgMetrics.errorRate / count,
      userSatisfaction: avgMetrics.userSatisfaction / count,
      throughput: avgMetrics.throughput / count,
      costPerRequest: avgMetrics.costPerRequest / count,
    };
  }

  private async detectDegradation(
    current: QualityMetrics,
    baseline: QualityMetrics | null
  ): Promise<DegradationAlert[]> {
    const alerts: DegradationAlert[] = [];

    if (!baseline) {
      console.log("📊 No baseline available yet, collecting more data...");
      return alerts;
    }

    // Check accuracy degradation
    const accuracyDegradation =
      (baseline.accuracy - current.accuracy) / baseline.accuracy;
    if (accuracyDegradation > this.config.alertThresholds.accuracy.critical) {
      alerts.push(
        this.createAlert(
          "ACCURACY",
          "CRITICAL",
          current.accuracy,
          baseline.accuracy,
          this.config.alertThresholds.accuracy.critical,
          accuracyDegradation,
          `Accuracy dropped by ${(accuracyDegradation * 100).toFixed(1)}%`
        )
      );
    } else if (
      accuracyDegradation > this.config.alertThresholds.accuracy.warning
    ) {
      alerts.push(
        this.createAlert(
          "ACCURACY",
          "HIGH",
          current.accuracy,
          baseline.accuracy,
          this.config.alertThresholds.accuracy.warning,
          accuracyDegradation,
          `Accuracy degraded by ${(accuracyDegradation * 100).toFixed(1)}%`
        )
      );
    }

    // Check latency degradation
    const latencyIncrease =
      (current.latency - baseline.latency) / baseline.latency;
    if (latencyIncrease > this.config.alertThresholds.latency.critical) {
      alerts.push(
        this.createAlert(
          "PERFORMANCE",
          "CRITICAL",
          current.latency,
          baseline.latency,
          this.config.alertThresholds.latency.critical,
          latencyIncrease,
          `Latency increased by ${(latencyIncrease * 100).toFixed(1)}%`
        )
      );
    } else if (latencyIncrease > this.config.alertThresholds.latency.warning) {
      alerts.push(
        this.createAlert(
          "PERFORMANCE",
          "HIGH",
          current.latency,
          baseline.latency,
          this.config.alertThresholds.latency.warning,
          latencyIncrease,
          `Latency degraded by ${(latencyIncrease * 100).toFixed(1)}%`
        )
      );
    }

    // Check error rate increase
    const errorRateIncrease =
      (current.errorRate - baseline.errorRate) / baseline.errorRate;
    if (errorRateIncrease > this.config.alertThresholds.errorRate.critical) {
      alerts.push(
        this.createAlert(
          "ERROR_RATE",
          "CRITICAL",
          current.errorRate,
          baseline.errorRate,
          this.config.alertThresholds.errorRate.critical,
          errorRateIncrease,
          `Error rate increased by ${(errorRateIncrease * 100).toFixed(1)}%`
        )
      );
    } else if (
      errorRateIncrease > this.config.alertThresholds.errorRate.warning
    ) {
      alerts.push(
        this.createAlert(
          "ERROR_RATE",
          "HIGH",
          current.errorRate,
          baseline.errorRate,
          this.config.alertThresholds.errorRate.warning,
          errorRateIncrease,
          `Error rate degraded by ${(errorRateIncrease * 100).toFixed(1)}%`
        )
      );
    }

    // Check user satisfaction degradation
    const satisfactionDegradation =
      (baseline.userSatisfaction - current.userSatisfaction) /
      baseline.userSatisfaction;
    if (
      satisfactionDegradation >
      this.config.alertThresholds.userSatisfaction.critical
    ) {
      alerts.push(
        this.createAlert(
          "USER_SATISFACTION",
          "CRITICAL",
          current.userSatisfaction,
          baseline.userSatisfaction,
          this.config.alertThresholds.userSatisfaction.critical,
          satisfactionDegradation,
          `User satisfaction dropped by ${(
            satisfactionDegradation * 100
          ).toFixed(1)}%`
        )
      );
    } else if (
      satisfactionDegradation >
      this.config.alertThresholds.userSatisfaction.warning
    ) {
      alerts.push(
        this.createAlert(
          "USER_SATISFACTION",
          "HIGH",
          current.userSatisfaction,
          baseline.userSatisfaction,
          this.config.alertThresholds.userSatisfaction.warning,
          satisfactionDegradation,
          `User satisfaction degraded by ${(
            satisfactionDegradation * 100
          ).toFixed(1)}%`
        )
      );
    }

    // Check cost increase
    const costIncrease =
      (current.costPerRequest - baseline.costPerRequest) /
      baseline.costPerRequest;
    if (costIncrease > this.config.alertThresholds.costIncrease.critical) {
      alerts.push(
        this.createAlert(
          "COST",
          "CRITICAL",
          current.costPerRequest,
          baseline.costPerRequest,
          this.config.alertThresholds.costIncrease.critical,
          costIncrease,
          `Cost per request increased by ${(costIncrease * 100).toFixed(1)}%`
        )
      );
    } else if (
      costIncrease > this.config.alertThresholds.costIncrease.warning
    ) {
      alerts.push(
        this.createAlert(
          "COST",
          "MEDIUM",
          current.costPerRequest,
          baseline.costPerRequest,
          this.config.alertThresholds.costIncrease.warning,
          costIncrease,
          `Cost per request increased by ${(costIncrease * 100).toFixed(1)}%`
        )
      );
    }

    return alerts;
  }

  private createAlert(
    alertType: DegradationAlert["alertType"],
    severity: DegradationAlert["severity"],
    currentValue: number,
    baselineValue: number,
    threshold: number,
    degradationPercentage: number,
    message: string
  ): DegradationAlert {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      modelId: this.config.modelId,
      alertType,
      severity,
      currentValue,
      baselineValue,
      threshold,
      degradationPercentage,
      message,
      actionTaken: "NONE",
    };
  }

  private async processAlert(alert: DegradationAlert): Promise<void> {
    console.log(`🚨 Processing ${alert.severity} alert: ${alert.message}`);

    this.alerts.push(alert);

    // Determine action based on severity and type
    if (alert.severity === "CRITICAL") {
      // Critical alerts trigger immediate rollback
      console.log(
        "🔄 Critical degradation detected, initiating automated rollback..."
      );

      try {
        const rollbackResult = await this.rollbackManager.evaluateRollbackNeed(
          this.config.rollbackConfig,
          undefined, // offline result
          undefined, // canary result
          this.convertToPerformanceMetrics(
            this.metricsHistory[this.metricsHistory.length - 1]
          )
        );

        if (rollbackResult) {
          alert.actionTaken = "ROLLBACK";
          console.log("✅ Automated rollback completed successfully");
        } else {
          alert.actionTaken = "ALERT";
          console.log("⚠️ Rollback evaluation did not trigger rollback");
        }
      } catch (error) {
        console.error("❌ Automated rollback failed:", error);
        alert.actionTaken = "ALERT";
      }
    } else if (alert.severity === "HIGH") {
      // High severity alerts send notifications and may trigger scaling
      console.log("📢 High severity alert, sending notifications...");
      await this.sendNotification(alert);
      alert.actionTaken = "ALERT";
    } else {
      // Medium/Low severity alerts are logged
      console.log("📝 Alert logged for monitoring");
      alert.actionTaken = "ALERT";
    }

    // Save alert to history
    await this.saveAlert(alert);
  }

  private convertToPerformanceMetrics(qualityMetrics: QualityMetrics): any {
    return {
      timestamp: qualityMetrics.timestamp,
      successRate: 1 - qualityMetrics.errorRate,
      averageLatency: qualityMetrics.latency,
      errorRate: qualityMetrics.errorRate,
      userSatisfaction: qualityMetrics.userSatisfaction,
    };
  }

  private async sendNotification(alert: DegradationAlert): Promise<void> {
    const message =
      `🚨 Quality Degradation Alert\n` +
      `Model: ${alert.modelId}\n` +
      `Type: ${alert.alertType}\n` +
      `Severity: ${alert.severity}\n` +
      `Message: ${alert.message}\n` +
      `Time: ${alert.timestamp}`;

    console.log(
      `📤 Sending notification to ${this.config.notificationChannels.length} channels`
    );

    for (const channel of this.config.notificationChannels) {
      console.log(`  📧 Notification sent to ${channel}`);
      // In real implementation, send to Slack, PagerDuty, email, etc.
    }
  }

  private cleanupOldMetrics(): void {
    // Keep only last 24 hours of metrics
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter(
      (m) => new Date(m.timestamp).getTime() >= cutoffTime
    );

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const metricsPath = path.join(
        process.cwd(),
        "test",
        "ai-quality-gates",
        "metrics-history.json"
      );
      const content = await fs.readFile(metricsPath, "utf-8");
      this.metricsHistory = JSON.parse(content);
      console.log(`📊 Loaded ${this.metricsHistory.length} historical metrics`);
    } catch (error) {
      console.log("📊 No historical metrics found, starting fresh");
      this.metricsHistory = [];
    }
  }

  private async saveMetricsHistory(): Promise<void> {
    try {
      const outputDir = path.join(process.cwd(), "test", "ai-quality-gates");
      await fs.mkdir(outputDir, { recursive: true });

      const metricsPath = path.join(outputDir, "metrics-history.json");
      await fs.writeFile(
        metricsPath,
        JSON.stringify(this.metricsHistory, null, 2)
      );
      console.log(`💾 Saved ${this.metricsHistory.length} metrics to history`);
    } catch (error) {
      console.error("❌ Failed to save metrics history:", error);
    }
  }

  private async saveAlert(alert: DegradationAlert): Promise<void> {
    try {
      const outputDir = path.join(
        process.cwd(),
        "test",
        "ai-quality-gates",
        "alerts"
      );
      await fs.mkdir(outputDir, { recursive: true });

      const alertPath = path.join(outputDir, `alert-${alert.id}.json`);
      await fs.writeFile(alertPath, JSON.stringify(alert, null, 2));
    } catch (error) {
      console.error("❌ Failed to save alert:", error);
    }
  }

  getMetricsHistory(): QualityMetrics[] {
    return [...this.metricsHistory];
  }

  getAlerts(): DegradationAlert[] {
    return [...this.alerts];
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// Default monitoring configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  modelId: "claude-3-5-sonnet-v2",
  monitoringInterval: 30, // 30 seconds
  baselineWindow: 10, // 10 minutes
  alertThresholds: {
    accuracy: { warning: 0.05, critical: 0.1 }, // 5% and 10% degradation
    latency: { warning: 0.2, critical: 0.5 }, // 20% and 50% increase
    errorRate: { warning: 1.0, critical: 2.0 }, // 100% and 200% increase
    userSatisfaction: { warning: 0.1, critical: 0.2 }, // 10% and 20% degradation
    costIncrease: { warning: 0.3, critical: 0.8 }, // 30% and 80% increase
  },
  rollbackConfig: {
    modelId: "claude-3-5-sonnet-v2",
    previousModelId: "claude-3-5-sonnet-v1",
    rollbackTriggers: [
      { type: "PERFORMANCE_DEGRADATION", threshold: 0.5, enabled: true },
      { type: "ERROR_RATE", threshold: 0.05, enabled: true },
      { type: "USER_FEEDBACK", threshold: 0.7, enabled: true },
    ],
    notificationChannels: ["slack://ops-alerts", "pagerduty://ai-team"],
    autoRollback: true,
    rollbackTimeout: 30,
  },
  notificationChannels: ["slack://ops-alerts", "email://oncall@matbakh.app"],
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Quality Degradation Monitor and Automated Rollback System

Usage: tsx quality-degradation-monitor.ts [command] [options]

Commands:
  start                Start monitoring (default)
  stop                 Stop monitoring
  status               Show monitoring status
  alerts               Show recent alerts
  metrics              Show recent metrics

Options:
  --model-id <id>      Model ID to monitor (default: claude-3-5-sonnet-v2)
  --interval <sec>     Monitoring interval in seconds (default: 30)
  --baseline <min>     Baseline window in minutes (default: 10)
  --duration <min>     How long to run monitoring (default: continuous)
  --help, -h          Show this help message

Examples:
  tsx quality-degradation-monitor.ts start --model-id gemini-pro
  tsx quality-degradation-monitor.ts --interval 60 --baseline 15
    `);
    process.exit(0);
  }

  const command = args[0] || "start";

  // Parse options
  const config = { ...DEFAULT_CONFIG };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--model-id":
        config.modelId = args[++i];
        config.rollbackConfig.modelId = config.modelId;
        break;
      case "--interval":
        config.monitoringInterval = parseInt(args[++i]);
        break;
      case "--baseline":
        config.baselineWindow = parseInt(args[++i]);
        break;
    }
  }

  try {
    const monitor = new QualityDegradationMonitor(config);

    switch (command) {
      case "start":
        console.log("🚀 Quality Degradation Monitor");
        console.log("==============================");

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
          console.log("\n🛑 Received shutdown signal...");
          await monitor.stopMonitoring();
          process.exit(0);
        });

        await monitor.startMonitoring();

        // Keep the process running
        await new Promise(() => {}); // Run indefinitely
        break;

      case "stop":
        await monitor.stopMonitoring();
        break;

      case "status":
        console.log(
          `Monitoring Status: ${
            monitor.isCurrentlyMonitoring() ? "🟢 ACTIVE" : "🔴 INACTIVE"
          }`
        );
        console.log(`Model: ${config.modelId}`);
        console.log(`Interval: ${config.monitoringInterval}s`);
        console.log(`Baseline Window: ${config.baselineWindow} minutes`);
        break;

      case "alerts":
        const alerts = monitor.getAlerts();
        console.log(`📋 Recent Alerts (${alerts.length})`);
        alerts.slice(-10).forEach((alert) => {
          console.log(
            `  ${alert.severity} - ${alert.message} (${alert.timestamp})`
          );
        });
        break;

      case "metrics":
        const metrics = monitor.getMetricsHistory();
        console.log(`📊 Recent Metrics (${metrics.length})`);
        metrics.slice(-5).forEach((metric) => {
          console.log(
            `  ${metric.timestamp}: Accuracy=${(metric.accuracy * 100).toFixed(
              1
            )}%, Latency=${metric.latency.toFixed(0)}ms, Errors=${(
              metric.errorRate * 100
            ).toFixed(2)}%`
          );
        });
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Quality degradation monitor failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  DegradationAlert,
  MonitoringConfig,
  QualityDegradationMonitor,
  QualityMetrics,
};
