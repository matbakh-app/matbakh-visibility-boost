#!/usr/bin/env tsx

/**
 * Automated Rollback System for AI Quality Gates
 *
 * This script implements automated rollback mechanisms when AI models
 * fail quality gates or show performance degradation in production.
 */

import { promises as fs } from "fs";
import path from "path";
import { CanaryResult } from "./canary-online-evaluation";
import { EvaluationResult } from "./offline-evaluation";

interface RollbackConfig {
  modelId: string;
  previousModelId: string;
  rollbackTriggers: RollbackTrigger[];
  notificationChannels: string[];
  autoRollback: boolean;
  rollbackTimeout: number; // seconds
}

interface RollbackTrigger {
  type:
    | "OFFLINE_EVAL"
    | "CANARY_EVAL"
    | "PERFORMANCE_DEGRADATION"
    | "ERROR_RATE"
    | "USER_FEEDBACK";
  threshold: number;
  duration?: number; // seconds
  enabled: boolean;
}

interface RollbackResult {
  modelId: string;
  previousModelId: string;
  timestamp: string;
  trigger: RollbackTrigger;
  reason: string;
  success: boolean;
  rollbackTime: number; // seconds
  affectedRequests: number;
  details: string[];
}

interface PerformanceMetrics {
  timestamp: string;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  userSatisfaction: number;
}

class AutomatedRollbackManager {
  private performanceHistory: PerformanceMetrics[] = [];
  private rollbackInProgress = false;

  async evaluateRollbackNeed(
    config: RollbackConfig,
    offlineResult?: EvaluationResult,
    canaryResult?: CanaryResult,
    currentMetrics?: PerformanceMetrics
  ): Promise<RollbackResult | null> {
    console.log(`🔍 Evaluating rollback need for model: ${config.modelId}`);

    if (this.rollbackInProgress) {
      console.log("⚠️ Rollback already in progress, skipping evaluation");
      return null;
    }

    // Check each trigger type
    for (const trigger of config.rollbackTriggers) {
      if (!trigger.enabled) continue;

      const shouldRollback = await this.checkTrigger(
        trigger,
        config,
        offlineResult,
        canaryResult,
        currentMetrics
      );

      if (shouldRollback) {
        const reason = this.generateRollbackReason(
          trigger,
          offlineResult,
          canaryResult,
          currentMetrics
        );

        if (config.autoRollback) {
          return await this.executeRollback(config, trigger, reason);
        } else {
          console.log(
            `🚨 Rollback trigger activated but auto-rollback disabled: ${reason}`
          );
          await this.sendNotification(config, trigger, reason, false);
          return null;
        }
      }
    }

    console.log("✅ No rollback triggers activated");
    return null;
  }

  private async checkTrigger(
    trigger: RollbackTrigger,
    config: RollbackConfig,
    offlineResult?: EvaluationResult,
    canaryResult?: CanaryResult,
    currentMetrics?: PerformanceMetrics
  ): Promise<boolean> {
    switch (trigger.type) {
      case "OFFLINE_EVAL":
        return this.checkOfflineEvalTrigger(trigger, offlineResult);

      case "CANARY_EVAL":
        return this.checkCanaryEvalTrigger(trigger, canaryResult);

      case "PERFORMANCE_DEGRADATION":
        return this.checkPerformanceDegradationTrigger(trigger, currentMetrics);

      case "ERROR_RATE":
        return this.checkErrorRateTrigger(trigger, currentMetrics);

      case "USER_FEEDBACK":
        return this.checkUserFeedbackTrigger(trigger, currentMetrics);

      default:
        console.warn(`Unknown trigger type: ${trigger.type}`);
        return false;
    }
  }

  private checkOfflineEvalTrigger(
    trigger: RollbackTrigger,
    result?: EvaluationResult
  ): boolean {
    if (!result) return false;

    // Rollback if offline evaluation failed
    if (!result.passed) {
      console.log(`🔴 Offline evaluation failed for model: ${result.modelId}`);
      return true;
    }

    // Rollback if accuracy is below threshold
    if (result.metrics.accuracy < trigger.threshold) {
      console.log(
        `🔴 Offline accuracy below threshold: ${result.metrics.accuracy} < ${trigger.threshold}`
      );
      return true;
    }

    return false;
  }

  private checkCanaryEvalTrigger(
    trigger: RollbackTrigger,
    result?: CanaryResult
  ): boolean {
    if (!result) return false;

    // Rollback if canary evaluation failed
    if (!result.passed) {
      console.log(`🔴 Canary evaluation failed for model: ${result.modelId}`);
      return true;
    }

    // Rollback if recommendation is to rollback
    if (result.recommendation === "ROLLBACK") {
      console.log(
        `🔴 Canary evaluation recommends rollback for model: ${result.modelId}`
      );
      return true;
    }

    return false;
  }

  private checkPerformanceDegradationTrigger(
    trigger: RollbackTrigger,
    metrics?: PerformanceMetrics
  ): boolean {
    if (!metrics || this.performanceHistory.length < 5) return false;

    // Calculate baseline performance from recent history
    const recentHistory = this.performanceHistory.slice(-10);
    const baselineLatency =
      recentHistory.reduce((sum, m) => sum + m.averageLatency, 0) /
      recentHistory.length;

    // Check if current latency is significantly higher than baseline
    const degradationRatio = metrics.averageLatency / baselineLatency;

    if (degradationRatio > trigger.threshold) {
      console.log(
        `🔴 Performance degradation detected: ${degradationRatio.toFixed(
          2
        )}x baseline latency`
      );
      return true;
    }

    return false;
  }

  private checkErrorRateTrigger(
    trigger: RollbackTrigger,
    metrics?: PerformanceMetrics
  ): boolean {
    if (!metrics) return false;

    if (metrics.errorRate > trigger.threshold) {
      console.log(
        `🔴 Error rate above threshold: ${metrics.errorRate} > ${trigger.threshold}`
      );
      return true;
    }

    return false;
  }

  private checkUserFeedbackTrigger(
    trigger: RollbackTrigger,
    metrics?: PerformanceMetrics
  ): boolean {
    if (!metrics) return false;

    if (metrics.userSatisfaction < trigger.threshold) {
      console.log(
        `🔴 User satisfaction below threshold: ${metrics.userSatisfaction} < ${trigger.threshold}`
      );
      return true;
    }

    return false;
  }

  private generateRollbackReason(
    trigger: RollbackTrigger,
    offlineResult?: EvaluationResult,
    canaryResult?: CanaryResult,
    currentMetrics?: PerformanceMetrics
  ): string {
    switch (trigger.type) {
      case "OFFLINE_EVAL":
        return `Offline evaluation failed: ${
          offlineResult?.details.join(", ") || "Unknown reason"
        }`;

      case "CANARY_EVAL":
        return `Canary evaluation failed: ${
          canaryResult?.details.join(", ") || "Unknown reason"
        }`;

      case "PERFORMANCE_DEGRADATION":
        return `Performance degradation detected: Average latency ${currentMetrics?.averageLatency}ms exceeds threshold`;

      case "ERROR_RATE":
        return `Error rate too high: ${
          (currentMetrics?.errorRate || 0) * 100
        }% > ${trigger.threshold * 100}%`;

      case "USER_FEEDBACK":
        return `User satisfaction too low: ${
          (currentMetrics?.userSatisfaction || 0) * 100
        }% < ${trigger.threshold * 100}%`;

      default:
        return `Unknown trigger: ${trigger.type}`;
    }
  }

  private async executeRollback(
    config: RollbackConfig,
    trigger: RollbackTrigger,
    reason: string
  ): Promise<RollbackResult> {
    console.log(`🔄 Executing automated rollback for model: ${config.modelId}`);
    console.log(`📋 Reason: ${reason}`);

    this.rollbackInProgress = true;
    const startTime = Date.now();

    try {
      // Step 1: Stop new traffic to the failing model
      console.log("🛑 Stopping new traffic to failing model...");
      await this.stopTrafficToModel(config.modelId);

      // Step 2: Switch traffic to previous model
      console.log(
        `🔀 Switching traffic to previous model: ${config.previousModelId}`
      );
      await this.switchTrafficToModel(config.previousModelId);

      // Step 3: Wait for in-flight requests to complete
      console.log("⏳ Waiting for in-flight requests to complete...");
      await this.waitForInflightRequests(config.rollbackTimeout);

      // Step 4: Update model registry
      console.log("📝 Updating model registry...");
      await this.updateModelRegistry(config.modelId, config.previousModelId);

      // Step 5: Send notifications
      await this.sendNotification(config, trigger, reason, true);

      const rollbackTime = (Date.now() - startTime) / 1000;

      const result: RollbackResult = {
        modelId: config.modelId,
        previousModelId: config.previousModelId,
        timestamp: new Date().toISOString(),
        trigger,
        reason,
        success: true,
        rollbackTime,
        affectedRequests: await this.getAffectedRequestsCount(config.modelId),
        details: [
          "Traffic stopped to failing model",
          `Traffic switched to ${config.previousModelId}`,
          "Model registry updated",
          "Notifications sent",
        ],
      };

      await this.saveRollbackResult(result);
      this.logRollbackResult(result);

      return result;
    } catch (error) {
      console.error("❌ Rollback failed:", error);

      const result: RollbackResult = {
        modelId: config.modelId,
        previousModelId: config.previousModelId,
        timestamp: new Date().toISOString(),
        trigger,
        reason,
        success: false,
        rollbackTime: (Date.now() - startTime) / 1000,
        affectedRequests: 0,
        details: [`Rollback failed: ${error}`],
      };

      await this.saveRollbackResult(result);
      return result;
    } finally {
      this.rollbackInProgress = false;
    }
  }

  private async stopTrafficToModel(modelId: string): Promise<void> {
    // Simulate stopping traffic to the model
    console.log(`  Updating load balancer to exclude ${modelId}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`  ✅ Traffic stopped to ${modelId}`);
  }

  private async switchTrafficToModel(modelId: string): Promise<void> {
    // Simulate switching traffic to the previous model
    console.log(`  Updating load balancer to route to ${modelId}...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(`  ✅ Traffic switched to ${modelId}`);
  }

  private async waitForInflightRequests(timeoutSeconds: number): Promise<void> {
    // Simulate waiting for in-flight requests
    const waitTime = Math.min(timeoutSeconds * 1000, 5000); // Max 5 seconds for simulation
    console.log(`  Waiting ${waitTime / 1000}s for in-flight requests...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    console.log(`  ✅ In-flight requests completed`);
  }

  private async updateModelRegistry(
    failedModelId: string,
    activeModelId: string
  ): Promise<void> {
    // Simulate updating model registry
    console.log(`  Marking ${failedModelId} as inactive...`);
    console.log(`  Marking ${activeModelId} as active...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`  ✅ Model registry updated`);
  }

  private async getAffectedRequestsCount(modelId: string): Promise<number> {
    // Simulate getting affected requests count
    return Math.floor(Math.random() * 1000) + 100;
  }

  private async sendNotification(
    config: RollbackConfig,
    trigger: RollbackTrigger,
    reason: string,
    executed: boolean
  ): Promise<void> {
    const status = executed ? "EXECUTED" : "TRIGGERED";
    const message =
      `🚨 AI Model Rollback ${status}\n` +
      `Model: ${config.modelId}\n` +
      `Trigger: ${trigger.type}\n` +
      `Reason: ${reason}\n` +
      `Time: ${new Date().toISOString()}`;

    console.log(
      `📢 Sending notifications to ${config.notificationChannels.length} channels...`
    );

    for (const channel of config.notificationChannels) {
      console.log(`  📤 Notification sent to ${channel}`);
      // In real implementation, send to Slack, PagerDuty, email, etc.
    }
  }

  private async saveRollbackResult(result: RollbackResult): Promise<void> {
    const resultsDir = path.join(
      process.cwd(),
      "test",
      "ai-quality-gates",
      "results"
    );
    await fs.mkdir(resultsDir, { recursive: true });

    const filename = `rollback-${result.modelId}-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Rollback result saved to: ${filepath}`);
  }

  private logRollbackResult(result: RollbackResult): void {
    console.log("\n🔄 Automated Rollback Result");
    console.log("============================");
    console.log(`Model ID: ${result.modelId}`);
    console.log(`Previous Model: ${result.previousModelId}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Trigger: ${result.trigger.type}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Success: ${result.success ? "✅ YES" : "❌ NO"}`);
    console.log(`Rollback Time: ${result.rollbackTime.toFixed(1)}s`);
    console.log(`Affected Requests: ${result.affectedRequests}`);
    console.log("\nDetails:");
    result.details.forEach((detail) => console.log(`  • ${detail}`));
    console.log("============================\n");
  }

  addPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    // Keep only last 100 metrics to prevent memory issues
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }
}

// Default rollback configuration
const DEFAULT_CONFIG: RollbackConfig = {
  modelId: "claude-3-5-sonnet-v2",
  previousModelId: "claude-3-5-sonnet-v1",
  rollbackTriggers: [
    {
      type: "OFFLINE_EVAL",
      threshold: 0.8,
      enabled: true,
    },
    {
      type: "CANARY_EVAL",
      threshold: 0.95,
      enabled: true,
    },
    {
      type: "ERROR_RATE",
      threshold: 0.05,
      duration: 300,
      enabled: true,
    },
    {
      type: "PERFORMANCE_DEGRADATION",
      threshold: 1.5,
      duration: 600,
      enabled: true,
    },
    {
      type: "USER_FEEDBACK",
      threshold: 0.7,
      duration: 900,
      enabled: true,
    },
  ],
  notificationChannels: [
    "slack://ops-alerts",
    "pagerduty://ai-team",
    "email://oncall@matbakh.app",
  ],
  autoRollback: true,
  rollbackTimeout: 30,
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: tsx automated-rollback.ts <action> [options]");
    console.error("Actions:");
    console.error("  evaluate - Evaluate rollback need with current metrics");
    console.error("  simulate - Simulate a rollback scenario");
    console.error("  config - Show default configuration");
    process.exit(1);
  }

  const action = args[0];

  try {
    const manager = new AutomatedRollbackManager();

    switch (action) {
      case "evaluate":
        // Simulate current metrics that would trigger rollback
        const currentMetrics: PerformanceMetrics = {
          timestamp: new Date().toISOString(),
          successRate: 0.92, // Below threshold
          averageLatency: 1200,
          errorRate: 0.08, // Above threshold
          userSatisfaction: 0.65, // Below threshold
        };

        const result = await manager.evaluateRollbackNeed(
          DEFAULT_CONFIG,
          undefined,
          undefined,
          currentMetrics
        );

        if (result) {
          console.log("🔄 Rollback executed");
          process.exit(0);
        } else {
          console.log("✅ No rollback needed");
          process.exit(0);
        }
        break;

      case "simulate":
        console.log("🎭 Simulating rollback scenario...");
        const simulatedTrigger: RollbackTrigger = {
          type: "ERROR_RATE",
          threshold: 0.05,
          enabled: true,
        };

        const simulatedResult = await manager.executeRollback(
          DEFAULT_CONFIG,
          simulatedTrigger,
          "Simulated high error rate for testing"
        );

        process.exit(simulatedResult.success ? 0 : 1);
        break;

      case "config":
        console.log("📋 Default Rollback Configuration:");
        console.log(JSON.stringify(DEFAULT_CONFIG, null, 2));
        process.exit(0);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Automated rollback failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  AutomatedRollbackManager,
  RollbackConfig,
  RollbackResult,
  RollbackTrigger,
};
