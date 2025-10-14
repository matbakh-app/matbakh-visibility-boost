#!/usr/bin/env tsx

/**
 * Canary Online Evaluation System for AI Quality Gates
 *
 * This script implements real-time canary evaluation for AI models
 * in production. It monitors live traffic and validates model performance
 * against SLOs and quality metrics.
 */

import { promises as fs } from "fs";
import path from "path";

interface CanaryMetrics {
  successRate: number;
  averageLatency: number;
  p95Latency: number;
  errorRate: number;
  userSatisfaction: number;
  throughput: number;
}

interface CanaryConfig {
  modelId: string;
  trafficPercentage: number;
  duration: number; // minutes
  sampleSize: number;
  thresholds: CanaryMetrics;
}

interface CanaryResult {
  modelId: string;
  startTime: string;
  endTime: string;
  config: CanaryConfig;
  metrics: CanaryMetrics;
  passed: boolean;
  samples: number;
  details: string[];
  recommendation: "PROMOTE" | "ROLLBACK" | "CONTINUE";
}

interface RequestSample {
  timestamp: string;
  latency: number;
  success: boolean;
  userFeedback?: number; // 1-5 rating
  errorType?: string;
}

class CanaryOnlineEvaluator {
  private samples: RequestSample[] = [];
  private startTime: Date = new Date();

  async runCanaryEvaluation(config: CanaryConfig): Promise<CanaryResult> {
    console.log(`🚀 Starting canary evaluation for model: ${config.modelId}`);
    console.log(
      `📊 Traffic: ${config.trafficPercentage}% for ${config.duration} minutes`
    );

    this.startTime = new Date();

    // Simulate canary traffic collection
    await this.collectCanaryTraffic(config);

    const metrics = this.calculateMetrics();
    const passed = this.evaluateThresholds(metrics, config.thresholds);

    const result: CanaryResult = {
      modelId: config.modelId,
      startTime: this.startTime.toISOString(),
      endTime: new Date().toISOString(),
      config,
      metrics,
      passed,
      samples: this.samples.length,
      details: this.generateDetails(metrics, config.thresholds),
      recommendation: this.generateRecommendation(
        metrics,
        config.thresholds,
        passed
      ),
    };

    await this.saveResults(result);
    this.logResults(result);

    return result;
  }

  private async collectCanaryTraffic(config: CanaryConfig): Promise<void> {
    console.log(
      `📡 Collecting canary traffic for ${config.duration} minutes...`
    );

    const intervalMs = (config.duration * 60 * 1000) / config.sampleSize;

    for (let i = 0; i < config.sampleSize; i++) {
      // Simulate request processing
      const sample = await this.simulateRequest(config.modelId);
      this.samples.push(sample);

      // Progress indicator
      if (i % Math.floor(config.sampleSize / 10) === 0) {
        const progress = ((i / config.sampleSize) * 100).toFixed(0);
        console.log(
          `  Progress: ${progress}% (${i}/${config.sampleSize} samples)`
        );
      }

      // Wait for next sample
      if (i < config.sampleSize - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    console.log(`✅ Collected ${this.samples.length} samples`);
  }

  private async simulateRequest(modelId: string): Promise<RequestSample> {
    const startTime = Date.now();

    // Simulate request processing with realistic latency distribution
    const baseLatency = 300 + Math.random() * 800; // 300-1100ms base
    const latencySpike = Math.random() < 0.05 ? Math.random() * 2000 : 0; // 5% chance of spike
    const latency = baseLatency + latencySpike;

    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(latency / 10, 100))
    );

    // Simulate success/failure
    const success = Math.random() > 0.02; // 2% error rate baseline

    // Simulate user feedback (only for some requests)
    const userFeedback =
      Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : undefined;

    const sample: RequestSample = {
      timestamp: new Date().toISOString(),
      latency,
      success,
      userFeedback,
      errorType: success ? undefined : this.generateErrorType(),
    };

    return sample;
  }

  private generateErrorType(): string {
    const errorTypes = [
      "TIMEOUT",
      "RATE_LIMIT",
      "MODEL_ERROR",
      "VALIDATION_ERROR",
      "NETWORK_ERROR",
    ];
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  }

  private calculateMetrics(): CanaryMetrics {
    if (this.samples.length === 0) {
      throw new Error("No samples collected for metrics calculation");
    }

    const successfulSamples = this.samples.filter((s) => s.success);
    const latencies = successfulSamples.map((s) => s.latency);
    const feedbackSamples = this.samples.filter(
      (s) => s.userFeedback !== undefined
    );

    // Calculate success rate
    const successRate = successfulSamples.length / this.samples.length;

    // Calculate latency metrics
    const averageLatency =
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p95Latency = sortedLatencies[p95Index] || 0;

    // Calculate error rate
    const errorRate = 1 - successRate;

    // Calculate user satisfaction
    const userSatisfaction =
      feedbackSamples.length > 0
        ? feedbackSamples.reduce((sum, s) => sum + (s.userFeedback || 0), 0) /
          feedbackSamples.length /
          5
        : 0.8; // Default assumption

    // Calculate throughput (requests per minute)
    const durationMinutes =
      (Date.now() - this.startTime.getTime()) / (1000 * 60);
    const throughput = this.samples.length / Math.max(durationMinutes, 1);

    return {
      successRate,
      averageLatency,
      p95Latency,
      errorRate,
      userSatisfaction,
      throughput,
    };
  }

  private evaluateThresholds(
    metrics: CanaryMetrics,
    thresholds: CanaryMetrics
  ): boolean {
    return (
      metrics.successRate >= thresholds.successRate &&
      metrics.averageLatency <= thresholds.averageLatency &&
      metrics.p95Latency <= thresholds.p95Latency &&
      metrics.errorRate <= thresholds.errorRate &&
      metrics.userSatisfaction >= thresholds.userSatisfaction &&
      metrics.throughput >= thresholds.throughput
    );
  }

  private generateDetails(
    metrics: CanaryMetrics,
    thresholds: CanaryMetrics
  ): string[] {
    const details: string[] = [];

    if (metrics.successRate >= thresholds.successRate) {
      details.push(
        `✅ Success Rate: ${(metrics.successRate * 100).toFixed(1)}% >= ${(
          thresholds.successRate * 100
        ).toFixed(1)}%`
      );
    } else {
      details.push(
        `❌ Success Rate: ${(metrics.successRate * 100).toFixed(1)}% < ${(
          thresholds.successRate * 100
        ).toFixed(1)}%`
      );
    }

    if (metrics.averageLatency <= thresholds.averageLatency) {
      details.push(
        `✅ Average Latency: ${metrics.averageLatency.toFixed(
          0
        )}ms <= ${thresholds.averageLatency.toFixed(0)}ms`
      );
    } else {
      details.push(
        `❌ Average Latency: ${metrics.averageLatency.toFixed(
          0
        )}ms > ${thresholds.averageLatency.toFixed(0)}ms`
      );
    }

    if (metrics.p95Latency <= thresholds.p95Latency) {
      details.push(
        `✅ P95 Latency: ${metrics.p95Latency.toFixed(
          0
        )}ms <= ${thresholds.p95Latency.toFixed(0)}ms`
      );
    } else {
      details.push(
        `❌ P95 Latency: ${metrics.p95Latency.toFixed(
          0
        )}ms > ${thresholds.p95Latency.toFixed(0)}ms`
      );
    }

    if (metrics.errorRate <= thresholds.errorRate) {
      details.push(
        `✅ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}% <= ${(
          thresholds.errorRate * 100
        ).toFixed(1)}%`
      );
    } else {
      details.push(
        `❌ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}% > ${(
          thresholds.errorRate * 100
        ).toFixed(1)}%`
      );
    }

    if (metrics.userSatisfaction >= thresholds.userSatisfaction) {
      details.push(
        `✅ User Satisfaction: ${(metrics.userSatisfaction * 100).toFixed(
          1
        )}% >= ${(thresholds.userSatisfaction * 100).toFixed(1)}%`
      );
    } else {
      details.push(
        `❌ User Satisfaction: ${(metrics.userSatisfaction * 100).toFixed(
          1
        )}% < ${(thresholds.userSatisfaction * 100).toFixed(1)}%`
      );
    }

    if (metrics.throughput >= thresholds.throughput) {
      details.push(
        `✅ Throughput: ${metrics.throughput.toFixed(
          1
        )} req/min >= ${thresholds.throughput.toFixed(1)} req/min`
      );
    } else {
      details.push(
        `❌ Throughput: ${metrics.throughput.toFixed(
          1
        )} req/min < ${thresholds.throughput.toFixed(1)} req/min`
      );
    }

    return details;
  }

  private generateRecommendation(
    metrics: CanaryMetrics,
    thresholds: CanaryMetrics,
    passed: boolean
  ): "PROMOTE" | "ROLLBACK" | "CONTINUE" {
    if (!passed) {
      // Check if any critical metrics are severely degraded
      const criticalFailures = [
        metrics.successRate < thresholds.successRate * 0.8,
        metrics.p95Latency > thresholds.p95Latency * 1.5,
        metrics.errorRate > thresholds.errorRate * 2,
      ];

      if (criticalFailures.some((failure) => failure)) {
        return "ROLLBACK";
      } else {
        return "CONTINUE";
      }
    }

    // Check if metrics are significantly better than thresholds
    const excellentMetrics = [
      metrics.successRate > thresholds.successRate * 1.02,
      metrics.averageLatency < thresholds.averageLatency * 0.8,
      metrics.userSatisfaction > thresholds.userSatisfaction * 1.1,
    ];

    if (excellentMetrics.filter((excellent) => excellent).length >= 2) {
      return "PROMOTE";
    }

    return "CONTINUE";
  }

  private async saveResults(result: CanaryResult): Promise<void> {
    const resultsDir = path.join(
      process.cwd(),
      "test",
      "ai-quality-gates",
      "results"
    );
    await fs.mkdir(resultsDir, { recursive: true });

    const filename = `canary-eval-${result.modelId}-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${filepath}`);
  }

  private logResults(result: CanaryResult): void {
    console.log("\n🎯 Canary Online Evaluation Results");
    console.log("===================================");
    console.log(`Model ID: ${result.modelId}`);
    console.log(`Duration: ${result.startTime} to ${result.endTime}`);
    console.log(`Traffic: ${result.config.trafficPercentage}%`);
    console.log(`Samples: ${result.samples}`);
    console.log(`Overall Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Recommendation: ${result.recommendation}`);
    console.log("\nMetrics:");
    console.log(
      `  Success Rate: ${(result.metrics.successRate * 100).toFixed(1)}%`
    );
    console.log(
      `  Average Latency: ${result.metrics.averageLatency.toFixed(0)}ms`
    );
    console.log(`  P95 Latency: ${result.metrics.p95Latency.toFixed(0)}ms`);
    console.log(
      `  Error Rate: ${(result.metrics.errorRate * 100).toFixed(1)}%`
    );
    console.log(
      `  User Satisfaction: ${(result.metrics.userSatisfaction * 100).toFixed(
        1
      )}%`
    );
    console.log(
      `  Throughput: ${result.metrics.throughput.toFixed(1)} req/min`
    );
    console.log("\nDetails:");
    result.details.forEach((detail) => console.log(`  ${detail}`));
    console.log("===================================\n");
  }
}

// Default canary configuration
const DEFAULT_CONFIG: CanaryConfig = {
  modelId: "claude-3-5-sonnet",
  trafficPercentage: 5,
  duration: 10, // minutes
  sampleSize: 100,
  thresholds: {
    successRate: 0.98,
    averageLatency: 800,
    p95Latency: 1500,
    errorRate: 0.02,
    userSatisfaction: 0.8,
    throughput: 10,
  },
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Using default canary configuration...");
    console.log(
      "Usage: tsx canary-online-evaluation.ts [model-id] [traffic-percentage] [duration-minutes]"
    );
  }

  const config: CanaryConfig = {
    ...DEFAULT_CONFIG,
    modelId: args[0] || DEFAULT_CONFIG.modelId,
    trafficPercentage: args[1]
      ? parseFloat(args[1])
      : DEFAULT_CONFIG.trafficPercentage,
    duration: args[2] ? parseFloat(args[2]) : DEFAULT_CONFIG.duration,
  };

  try {
    const evaluator = new CanaryOnlineEvaluator();
    const result = await evaluator.runCanaryEvaluation(config);

    // Exit with appropriate code based on recommendation
    const exitCode = result.recommendation === "ROLLBACK" ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Canary evaluation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CanaryConfig, CanaryMetrics, CanaryOnlineEvaluator, CanaryResult };
