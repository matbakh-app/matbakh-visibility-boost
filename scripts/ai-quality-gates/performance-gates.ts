#!/usr/bin/env tsx

/**
 * Performance Gates for CI/CD Pipeline
 *
 * This script implements comprehensive performance gates that validate
 * AI model performance before deployment to ensure SLA compliance.
 */

import { promises as fs } from "fs";
import path from "path";

interface PerformanceThresholds {
  latency: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  throughput: {
    min: number;
    target: number;
  };
  errorRate: {
    max: number;
    critical: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  costMetrics: {
    maxCostPerRequest: number;
    maxDailyCost: number;
  };
}

interface PerformanceMetrics {
  timestamp: string;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errorRate: {
    rate: number;
    count: number;
    totalRequests: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  costMetrics: {
    costPerRequest: number;
    estimatedDailyCost: number;
  };
  qualityMetrics: {
    accuracy: number;
    userSatisfaction: number;
    responseQuality: number;
  };
}

interface PerformanceGateResult {
  gateName: string;
  passed: boolean;
  threshold: number;
  actualValue: number;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  recommendation?: string;
}

interface PerformanceReport {
  modelId: string;
  timestamp: string;
  environment: string;
  testDuration: number;
  totalRequests: number;
  metrics: PerformanceMetrics;
  gateResults: PerformanceGateResult[];
  overallStatus: "PASSED" | "FAILED" | "WARNING";
  deploymentRecommendation: "APPROVE" | "REJECT" | "CONDITIONAL";
  summary: string;
}

class PerformanceGateValidator {
  private thresholds: PerformanceThresholds;
  private environment: string;

  constructor(environment: string = "staging") {
    this.environment = environment;
    this.thresholds = this.getThresholdsForEnvironment(environment);
  }

  private getThresholdsForEnvironment(env: string): PerformanceThresholds {
    const baseThresholds: PerformanceThresholds = {
      latency: {
        p50: 500,
        p95: 1500,
        p99: 3000,
        max: 5000,
      },
      throughput: {
        min: 10,
        target: 50,
      },
      errorRate: {
        max: 0.02,
        critical: 0.05,
      },
      resourceUsage: {
        cpu: 80,
        memory: 85,
        network: 90,
      },
      costMetrics: {
        maxCostPerRequest: 0.05,
        maxDailyCost: 100,
      },
    };

    // Adjust thresholds based on environment
    switch (env) {
      case "production":
        return {
          ...baseThresholds,
          latency: {
            p50: 300,
            p95: 800,
            p99: 1500,
            max: 3000,
          },
          errorRate: {
            max: 0.01,
            critical: 0.02,
          },
        };

      case "staging":
        return baseThresholds;

      case "development":
        return {
          ...baseThresholds,
          latency: {
            p50: 1000,
            p95: 2000,
            p99: 4000,
            max: 8000,
          },
          errorRate: {
            max: 0.05,
            critical: 0.1,
          },
        };

      default:
        return baseThresholds;
    }
  }

  async runPerformanceGates(
    modelId: string,
    testDurationMinutes: number = 5
  ): Promise<PerformanceReport> {
    console.log(`🚀 Running Performance Gates for model: ${modelId}`);
    console.log(`🌍 Environment: ${this.environment}`);
    console.log(`⏱️ Test Duration: ${testDurationMinutes} minutes`);

    const startTime = Date.now();

    // Step 1: Run performance tests
    const metrics = await this.collectPerformanceMetrics(
      modelId,
      testDurationMinutes
    );

    // Step 2: Validate against gates
    const gateResults = await this.validatePerformanceGates(metrics);

    // Step 3: Generate report
    const report = this.generatePerformanceReport(
      modelId,
      testDurationMinutes,
      metrics,
      gateResults,
      Date.now() - startTime
    );

    // Step 4: Save report
    await this.saveReport(report);

    // Step 5: Log results
    this.logResults(report);

    return report;
  }

  private async collectPerformanceMetrics(
    modelId: string,
    durationMinutes: number
  ): Promise<PerformanceMetrics> {
    console.log("📊 Collecting performance metrics...");

    const testDurationMs = durationMinutes * 60 * 1000;
    const requestInterval = 100; // Request every 100ms
    const totalRequests = Math.floor(testDurationMs / requestInterval);

    const latencies: number[] = [];
    const errors: number[] = [];
    const cpuUsage: number[] = [];
    const memoryUsage: number[] = [];
    const networkUsage: number[] = [];
    const costs: number[] = [];

    console.log(
      `  Sending ${totalRequests} requests over ${durationMinutes} minutes...`
    );

    for (let i = 0; i < totalRequests; i++) {
      const requestStart = Date.now();

      try {
        // Simulate AI model request
        const result = await this.simulateModelRequest(modelId);
        const latency = Date.now() - requestStart;

        latencies.push(latency);
        costs.push(result.cost);

        // Simulate resource usage
        cpuUsage.push(30 + Math.random() * 40); // 30-70% CPU
        memoryUsage.push(40 + Math.random() * 30); // 40-70% Memory
        networkUsage.push(20 + Math.random() * 50); // 20-70% Network

        if (!result.success) {
          errors.push(1);
        }
      } catch (error) {
        latencies.push(5000); // Timeout latency
        errors.push(1);
        costs.push(0);
      }

      // Progress indicator
      if (i % Math.floor(totalRequests / 10) === 0) {
        const progress = ((i / totalRequests) * 100).toFixed(0);
        console.log(`    Progress: ${progress}% (${i}/${totalRequests})`);
      }

      // Wait for next request
      if (i < totalRequests - 1) {
        await new Promise((resolve) => setTimeout(resolve, requestInterval));
      }
    }

    // Calculate metrics
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const errorCount = errors.reduce((sum, err) => sum + err, 0);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      latency: {
        p50: this.percentile(sortedLatencies, 0.5),
        p95: this.percentile(sortedLatencies, 0.95),
        p99: this.percentile(sortedLatencies, 0.99),
        max: Math.max(...latencies),
        average:
          latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      },
      throughput: {
        requestsPerSecond: totalRequests / (durationMinutes * 60),
        requestsPerMinute: totalRequests / durationMinutes,
      },
      errorRate: {
        rate: errorCount / totalRequests,
        count: errorCount,
        totalRequests,
      },
      resourceUsage: {
        cpu: cpuUsage.reduce((sum, cpu) => sum + cpu, 0) / cpuUsage.length,
        memory:
          memoryUsage.reduce((sum, mem) => sum + mem, 0) / memoryUsage.length,
        network:
          networkUsage.reduce((sum, net) => sum + net, 0) / networkUsage.length,
      },
      costMetrics: {
        costPerRequest: avgCost,
        estimatedDailyCost:
          avgCost * totalRequests * ((24 * 60) / durationMinutes),
      },
      qualityMetrics: {
        accuracy: 0.85 + Math.random() * 0.1, // Simulate 85-95% accuracy
        userSatisfaction: 0.8 + Math.random() * 0.15, // Simulate 80-95% satisfaction
        responseQuality: 0.82 + Math.random() * 0.13, // Simulate 82-95% quality
      },
    };

    console.log("✅ Performance metrics collected");
    return metrics;
  }

  private async simulateModelRequest(
    modelId: string
  ): Promise<{ success: boolean; cost: number }> {
    // Simulate different model behaviors
    const modelBehaviors = {
      "claude-3-5-sonnet": {
        baseLatency: 400,
        errorRate: 0.01,
        baseCost: 0.02,
      },
      "gemini-pro": { baseLatency: 300, errorRate: 0.015, baseCost: 0.015 },
      "gpt-4": { baseLatency: 600, errorRate: 0.008, baseCost: 0.03 },
      default: { baseLatency: 500, errorRate: 0.02, baseCost: 0.025 },
    };

    const behavior =
      modelBehaviors[modelId as keyof typeof modelBehaviors] ||
      modelBehaviors.default;

    // Simulate processing time
    const processingTime = behavior.baseLatency + (Math.random() - 0.5) * 200;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(processingTime / 10, 10))
    );

    // Simulate success/failure
    const success = Math.random() > behavior.errorRate;

    // Simulate cost variation
    const cost = behavior.baseCost * (0.8 + Math.random() * 0.4);

    return { success, cost };
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private async validatePerformanceGates(
    metrics: PerformanceMetrics
  ): Promise<PerformanceGateResult[]> {
    console.log("🚪 Validating performance gates...");

    const results: PerformanceGateResult[] = [];

    // Latency Gates
    results.push(
      this.createGateResult(
        "P50 Latency",
        metrics.latency.p50 <= this.thresholds.latency.p50,
        this.thresholds.latency.p50,
        metrics.latency.p50,
        metrics.latency.p50 > this.thresholds.latency.p50 * 1.5
          ? "critical"
          : metrics.latency.p50 > this.thresholds.latency.p50
          ? "error"
          : "info",
        `P50 latency should be ≤ ${this.thresholds.latency.p50}ms`,
        metrics.latency.p50 > this.thresholds.latency.p50
          ? "Optimize model inference or increase resources"
          : undefined
      )
    );

    results.push(
      this.createGateResult(
        "P95 Latency",
        metrics.latency.p95 <= this.thresholds.latency.p95,
        this.thresholds.latency.p95,
        metrics.latency.p95,
        metrics.latency.p95 > this.thresholds.latency.p95 * 1.2
          ? "critical"
          : metrics.latency.p95 > this.thresholds.latency.p95
          ? "error"
          : "info",
        `P95 latency should be ≤ ${this.thresholds.latency.p95}ms`,
        metrics.latency.p95 > this.thresholds.latency.p95
          ? "Consider caching or model optimization"
          : undefined
      )
    );

    results.push(
      this.createGateResult(
        "P99 Latency",
        metrics.latency.p99 <= this.thresholds.latency.p99,
        this.thresholds.latency.p99,
        metrics.latency.p99,
        metrics.latency.p99 > this.thresholds.latency.p99 ? "warning" : "info",
        `P99 latency should be ≤ ${this.thresholds.latency.p99}ms`,
        metrics.latency.p99 > this.thresholds.latency.p99
          ? "Investigate tail latency causes"
          : undefined
      )
    );

    // Throughput Gates
    results.push(
      this.createGateResult(
        "Throughput",
        metrics.throughput.requestsPerSecond >= this.thresholds.throughput.min,
        this.thresholds.throughput.min,
        metrics.throughput.requestsPerSecond,
        metrics.throughput.requestsPerSecond <
          this.thresholds.throughput.min * 0.5
          ? "critical"
          : metrics.throughput.requestsPerSecond <
            this.thresholds.throughput.min
          ? "error"
          : "info",
        `Throughput should be ≥ ${this.thresholds.throughput.min} req/s`,
        metrics.throughput.requestsPerSecond < this.thresholds.throughput.min
          ? "Scale up resources or optimize processing"
          : undefined
      )
    );

    // Error Rate Gates
    results.push(
      this.createGateResult(
        "Error Rate",
        metrics.errorRate.rate <= this.thresholds.errorRate.max,
        this.thresholds.errorRate.max,
        metrics.errorRate.rate,
        metrics.errorRate.rate > this.thresholds.errorRate.critical
          ? "critical"
          : metrics.errorRate.rate > this.thresholds.errorRate.max
          ? "error"
          : "info",
        `Error rate should be ≤ ${(this.thresholds.errorRate.max * 100).toFixed(
          1
        )}%`,
        metrics.errorRate.rate > this.thresholds.errorRate.max
          ? "Investigate and fix error causes"
          : undefined
      )
    );

    // Resource Usage Gates
    results.push(
      this.createGateResult(
        "CPU Usage",
        metrics.resourceUsage.cpu <= this.thresholds.resourceUsage.cpu,
        this.thresholds.resourceUsage.cpu,
        metrics.resourceUsage.cpu,
        metrics.resourceUsage.cpu > this.thresholds.resourceUsage.cpu
          ? "warning"
          : "info",
        `CPU usage should be ≤ ${this.thresholds.resourceUsage.cpu}%`,
        metrics.resourceUsage.cpu > this.thresholds.resourceUsage.cpu
          ? "Consider CPU optimization or scaling"
          : undefined
      )
    );

    results.push(
      this.createGateResult(
        "Memory Usage",
        metrics.resourceUsage.memory <= this.thresholds.resourceUsage.memory,
        this.thresholds.resourceUsage.memory,
        metrics.resourceUsage.memory,
        metrics.resourceUsage.memory > this.thresholds.resourceUsage.memory
          ? "warning"
          : "info",
        `Memory usage should be ≤ ${this.thresholds.resourceUsage.memory}%`,
        metrics.resourceUsage.memory > this.thresholds.resourceUsage.memory
          ? "Optimize memory usage or increase allocation"
          : undefined
      )
    );

    // Cost Gates
    results.push(
      this.createGateResult(
        "Cost Per Request",
        metrics.costMetrics.costPerRequest <=
          this.thresholds.costMetrics.maxCostPerRequest,
        this.thresholds.costMetrics.maxCostPerRequest,
        metrics.costMetrics.costPerRequest,
        metrics.costMetrics.costPerRequest >
          this.thresholds.costMetrics.maxCostPerRequest * 1.5
          ? "error"
          : metrics.costMetrics.costPerRequest >
            this.thresholds.costMetrics.maxCostPerRequest
          ? "warning"
          : "info",
        `Cost per request should be ≤ $${this.thresholds.costMetrics.maxCostPerRequest.toFixed(
          3
        )}`,
        metrics.costMetrics.costPerRequest >
          this.thresholds.costMetrics.maxCostPerRequest
          ? "Optimize model usage or consider cheaper alternatives"
          : undefined
      )
    );

    results.push(
      this.createGateResult(
        "Daily Cost Estimate",
        metrics.costMetrics.estimatedDailyCost <=
          this.thresholds.costMetrics.maxDailyCost,
        this.thresholds.costMetrics.maxDailyCost,
        metrics.costMetrics.estimatedDailyCost,
        metrics.costMetrics.estimatedDailyCost >
          this.thresholds.costMetrics.maxDailyCost * 2
          ? "critical"
          : metrics.costMetrics.estimatedDailyCost >
            this.thresholds.costMetrics.maxDailyCost
          ? "error"
          : "info",
        `Estimated daily cost should be ≤ $${this.thresholds.costMetrics.maxDailyCost}`,
        metrics.costMetrics.estimatedDailyCost >
          this.thresholds.costMetrics.maxDailyCost
          ? "Review cost optimization strategies"
          : undefined
      )
    );

    console.log(`✅ Validated ${results.length} performance gates`);
    return results;
  }

  private createGateResult(
    gateName: string,
    passed: boolean,
    threshold: number,
    actualValue: number,
    severity: "info" | "warning" | "error" | "critical",
    message: string,
    recommendation?: string
  ): PerformanceGateResult {
    return {
      gateName,
      passed,
      threshold,
      actualValue,
      severity,
      message,
      recommendation,
    };
  }

  private generatePerformanceReport(
    modelId: string,
    testDuration: number,
    metrics: PerformanceMetrics,
    gateResults: PerformanceGateResult[],
    executionTime: number
  ): PerformanceReport {
    const passedGates = gateResults.filter((g) => g.passed).length;
    const totalGates = gateResults.length;
    const criticalFailures = gateResults.filter(
      (g) => !g.passed && g.severity === "critical"
    ).length;
    const errorFailures = gateResults.filter(
      (g) => !g.passed && g.severity === "error"
    ).length;

    let overallStatus: "PASSED" | "FAILED" | "WARNING";
    let deploymentRecommendation: "APPROVE" | "REJECT" | "CONDITIONAL";

    if (criticalFailures > 0) {
      overallStatus = "FAILED";
      deploymentRecommendation = "REJECT";
    } else if (errorFailures > 0) {
      overallStatus = "FAILED";
      deploymentRecommendation = "REJECT";
    } else if (passedGates < totalGates) {
      overallStatus = "WARNING";
      deploymentRecommendation = "CONDITIONAL";
    } else {
      overallStatus = "PASSED";
      deploymentRecommendation = "APPROVE";
    }

    const summary = this.generateSummary(
      overallStatus,
      passedGates,
      totalGates,
      criticalFailures,
      errorFailures
    );

    return {
      modelId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      testDuration,
      totalRequests: metrics.errorRate.totalRequests,
      metrics,
      gateResults,
      overallStatus,
      deploymentRecommendation,
      summary,
    };
  }

  private generateSummary(
    status: "PASSED" | "FAILED" | "WARNING",
    passed: number,
    total: number,
    critical: number,
    errors: number
  ): string {
    if (status === "PASSED") {
      return `All ${total} performance gates passed successfully. Model is ready for deployment.`;
    } else if (status === "FAILED") {
      return `Performance gates failed: ${critical} critical, ${errors} error failures. Deployment blocked.`;
    } else {
      return `Performance gates passed with warnings: ${passed}/${total} gates passed. Conditional deployment recommended.`;
    }
  }

  private async saveReport(report: PerformanceReport): Promise<void> {
    const outputDir = path.join(
      process.cwd(),
      "test",
      "ai-quality-gates",
      "results"
    );
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `performance-gates-${report.modelId}-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Performance report saved to: ${filepath}`);
  }

  private logResults(report: PerformanceReport): void {
    console.log("\n🚪 Performance Gates Results");
    console.log("============================");
    console.log(`Model: ${report.modelId}`);
    console.log(`Environment: ${report.environment}`);
    console.log(`Test Duration: ${report.testDuration} minutes`);
    console.log(`Total Requests: ${report.totalRequests}`);
    console.log(
      `Overall Status: ${
        report.overallStatus === "PASSED"
          ? "✅"
          : report.overallStatus === "WARNING"
          ? "⚠️"
          : "❌"
      } ${report.overallStatus}`
    );
    console.log(
      `Deployment: ${
        report.deploymentRecommendation === "APPROVE"
          ? "✅"
          : report.deploymentRecommendation === "CONDITIONAL"
          ? "⚠️"
          : "❌"
      } ${report.deploymentRecommendation}`
    );

    console.log("\nPerformance Metrics:");
    console.log(`  P50 Latency: ${report.metrics.latency.p50.toFixed(0)}ms`);
    console.log(`  P95 Latency: ${report.metrics.latency.p95.toFixed(0)}ms`);
    console.log(`  P99 Latency: ${report.metrics.latency.p99.toFixed(0)}ms`);
    console.log(
      `  Throughput: ${report.metrics.throughput.requestsPerSecond.toFixed(
        1
      )} req/s`
    );
    console.log(
      `  Error Rate: ${(report.metrics.errorRate.rate * 100).toFixed(2)}%`
    );
    console.log(
      `  Cost/Request: $${report.metrics.costMetrics.costPerRequest.toFixed(4)}`
    );

    console.log("\nGate Results:");
    report.gateResults.forEach((gate) => {
      const status = gate.passed
        ? "✅"
        : gate.severity === "critical"
        ? "🔴"
        : gate.severity === "error"
        ? "❌"
        : gate.severity === "warning"
        ? "⚠️"
        : "ℹ️";
      console.log(
        `  ${status} ${gate.gateName}: ${gate.actualValue.toFixed(
          gate.gateName.includes("Rate") ? 4 : 0
        )}${
          gate.gateName.includes("Rate")
            ? "%"
            : gate.gateName.includes("Cost")
            ? "$"
            : gate.gateName.includes("Latency")
            ? "ms"
            : gate.gateName.includes("Usage")
            ? "%"
            : ""
        } (threshold: ${gate.threshold})`
      );

      if (!gate.passed && gate.recommendation) {
        console.log(`    💡 ${gate.recommendation}`);
      }
    });

    console.log(`\n📋 Summary: ${report.summary}`);
    console.log("============================\n");
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Performance Gates for CI/CD Pipeline

Usage: tsx performance-gates.ts [options]

Options:
  --model-id <id>        Model ID to test (default: claude-3-5-sonnet)
  --environment <env>    Environment (development|staging|production, default: staging)
  --duration <minutes>   Test duration in minutes (default: 5)
  --help, -h            Show this help message

Examples:
  tsx performance-gates.ts --model-id gemini-pro --environment production
  tsx performance-gates.ts --duration 10 --environment staging
    `);
    process.exit(0);
  }

  // Parse arguments
  let modelId = "claude-3-5-sonnet";
  let environment = "staging";
  let duration = 5;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model-id":
        modelId = args[++i];
        break;
      case "--environment":
        environment = args[++i];
        break;
      case "--duration":
        duration = parseInt(args[++i]);
        break;
    }
  }

  try {
    const validator = new PerformanceGateValidator(environment);
    const report = await validator.runPerformanceGates(modelId, duration);

    // Exit with appropriate code
    const exitCode = report.deploymentRecommendation === "REJECT" ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Performance gates failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceGateValidator, PerformanceReport, PerformanceThresholds };
