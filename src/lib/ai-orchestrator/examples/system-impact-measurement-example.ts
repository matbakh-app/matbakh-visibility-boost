/**
 * System Impact Measurement Example
 *
 * Demonstrates how to use the System Impact Measurement service
 * to measure the impact of hybrid routing on system performance.
 */

import {
  HybridRoutingMetrics,
  PerformanceMonitor,
  SystemImpactMeasurement,
  SystemImpactReport,
  SystemMetricsCollector,
} from "../system-impact-measurement";

// Example implementation of system metrics collector
class ExampleSystemMetricsCollector implements SystemMetricsCollector {
  async getCpuUsage(): Promise<number> {
    // In a real implementation, this would collect actual CPU usage
    // For example, using Node.js os module or system monitoring tools
    return Math.random() * 100; // 0-100%
  }

  async getMemoryUsage(): Promise<number> {
    // In a real implementation, this would collect actual memory usage
    // For example, using process.memoryUsage() or system monitoring
    return Math.random() * 1024; // 0-1024 MB
  }

  async getNetworkLatency(): Promise<number> {
    // In a real implementation, this would measure actual network latency
    return Math.random() * 100 + 10; // 10-110 ms
  }

  async getDiskIo(): Promise<number> {
    // In a real implementation, this would measure disk I/O
    return Math.random() * 1000; // MB/s
  }

  async getSystemLoad(): Promise<number> {
    // In a real implementation, this would get system load average
    return Math.random() * 4; // 0-4 load average
  }

  async getResourceUtilization(): Promise<number> {
    // In a real implementation, this would calculate overall resource utilization
    return Math.random() * 100; // 0-100%
  }
}

// Example implementation of performance monitor
class ExamplePerformanceMonitor implements PerformanceMonitor {
  async measureLatency(): Promise<number> {
    // In a real implementation, this would measure actual response latency
    return Math.random() * 500 + 50; // 50-550 ms
  }

  async measureThroughput(): Promise<number> {
    // In a real implementation, this would measure actual throughput
    return Math.random() * 1000 + 500; // 500-1500 requests/sec
  }

  async measureErrorRate(): Promise<number> {
    // In a real implementation, this would calculate actual error rate
    return Math.random() * 5; // 0-5%
  }

  async measureResourceOverhead(): Promise<number> {
    // In a real implementation, this would measure resource overhead
    return Math.random() * 10; // 0-10%
  }

  async generatePerformanceReport(): Promise<any> {
    return {
      timestamp: new Date(),
      metrics: {
        latency: await this.measureLatency(),
        throughput: await this.measureThroughput(),
        errorRate: await this.measureErrorRate(),
      },
    };
  }
}

// Example implementation of hybrid routing metrics
class ExampleHybridRoutingMetrics implements HybridRoutingMetrics {
  async getRoutingDecisionTime(): Promise<number> {
    // In a real implementation, this would measure actual routing decision time
    return Math.random() * 5 + 1; // 1-6 ms
  }

  async getRoutingOverhead(): Promise<number> {
    // In a real implementation, this would measure routing overhead
    return Math.random() * 2 + 0.5; // 0.5-2.5%
  }

  async getPathSwitchingLatency(): Promise<number> {
    // In a real implementation, this would measure path switching latency
    return Math.random() * 20 + 5; // 5-25 ms
  }

  async getHealthCheckOverhead(): Promise<number> {
    // In a real implementation, this would measure health check overhead
    return Math.random() * 2 + 0.2; // 0.2-2.2 ms
  }

  async getRoutingEfficiency(): Promise<number> {
    // In a real implementation, this would calculate routing efficiency
    return Math.random() * 10 + 90; // 90-100%
  }
}

/**
 * Example: Basic System Impact Measurement
 */
export async function basicSystemImpactMeasurement(): Promise<SystemImpactReport> {
  console.log("🔍 Starting basic system impact measurement...");

  // Initialize dependencies
  const systemMetrics = new ExampleSystemMetricsCollector();
  const performanceMonitor = new ExamplePerformanceMonitor();
  const hybridRoutingMetrics = new ExampleHybridRoutingMetrics();

  // Create system impact measurement instance
  const impactMeasurement = new SystemImpactMeasurement(
    systemMetrics,
    performanceMonitor,
    hybridRoutingMetrics
  );

  try {
    // Start measurement
    await impactMeasurement.startMeasurement();
    console.log("✅ Measurement started, capturing baseline metrics...");

    // Simulate system activity for measurement period
    console.log("⏳ Simulating system activity for 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Stop measurement and get report
    const report = await impactMeasurement.stopMeasurement();
    console.log("✅ Measurement completed!");

    // Display results
    console.log("\n📊 System Impact Report:");
    console.log(`Measurement ID: ${report.measurementId}`);
    console.log(
      `Overall Impact: ${
        report.impactAnalysis.overallImpact.classification
      } (Score: ${report.impactAnalysis.overallImpact.score.toFixed(2)})`
    );
    console.log(
      `CPU Impact: ${report.impactAnalysis.cpuImpact.percentageIncrease.toFixed(
        2
      )}%`
    );
    console.log(
      `Memory Impact: ${report.impactAnalysis.memoryImpact.percentageIncrease.toFixed(
        2
      )}%`
    );
    console.log(
      `Latency Impact: ${report.impactAnalysis.latencyImpact.percentageIncrease.toFixed(
        2
      )}%`
    );

    console.log("\n💡 Recommendations:");
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    return report;
  } catch (error) {
    console.error("❌ Measurement failed:", error);
    throw error;
  } finally {
    impactMeasurement.cleanup();
  }
}

/**
 * Example: Routing Decision Impact Analysis
 */
export async function routingDecisionImpactAnalysis(): Promise<void> {
  console.log("🔍 Analyzing routing decision impact...");

  const systemMetrics = new ExampleSystemMetricsCollector();
  const performanceMonitor = new ExamplePerformanceMonitor();
  const hybridRoutingMetrics = new ExampleHybridRoutingMetrics();

  const impactMeasurement = new SystemImpactMeasurement(
    systemMetrics,
    performanceMonitor,
    hybridRoutingMetrics
  );

  try {
    // Measure routing decision impact
    const routingImpact =
      await impactMeasurement.measureRoutingDecisionImpact();

    console.log("\n🎯 Routing Decision Impact:");
    console.log(
      `Decision Latency: ${routingImpact.decisionLatency.toFixed(2)} ms`
    );
    console.log(
      `Measurement Overhead: ${routingImpact.measurementOverhead} ms`
    );
    console.log(`Routing Efficiency: ${routingImpact.efficiency.toFixed(2)}%`);
    console.log(
      `Path Switching Cost: ${routingImpact.pathSwitchingCost.toFixed(2)} ms`
    );

    // Validate performance requirements
    if (routingImpact.decisionLatency < 5) {
      console.log("✅ Routing decision latency meets requirements (< 5ms)");
    } else {
      console.log("⚠️ Routing decision latency exceeds requirements (>= 5ms)");
    }

    if (routingImpact.efficiency > 90) {
      console.log("✅ Routing efficiency meets requirements (> 90%)");
    } else {
      console.log("⚠️ Routing efficiency below requirements (<= 90%)");
    }
  } catch (error) {
    console.error("❌ Routing decision impact analysis failed:", error);
    throw error;
  } finally {
    impactMeasurement.cleanup();
  }
}

/**
 * Example: Health Check Impact Analysis
 */
export async function healthCheckImpactAnalysis(): Promise<void> {
  console.log("🔍 Analyzing health check impact...");

  const systemMetrics = new ExampleSystemMetricsCollector();
  const performanceMonitor = new ExamplePerformanceMonitor();
  const hybridRoutingMetrics = new ExampleHybridRoutingMetrics();

  const impactMeasurement = new SystemImpactMeasurement(
    systemMetrics,
    performanceMonitor,
    hybridRoutingMetrics
  );

  try {
    // Measure health check impact
    const healthCheckImpact =
      await impactMeasurement.measureHealthCheckImpact();

    console.log("\n🏥 Health Check Impact:");
    console.log(`Check Frequency: ${healthCheckImpact.checkFrequency} seconds`);
    console.log(
      `Check Latency: ${healthCheckImpact.checkLatency.toFixed(2)} ms`
    );
    console.log(
      `Resource Usage: ${healthCheckImpact.resourceUsage.toFixed(2)}%`
    );
    console.log(
      `Network Overhead: ${healthCheckImpact.networkOverhead.toFixed(2)}%`
    );

    // Validate health check overhead
    if (healthCheckImpact.checkLatency < 2) {
      console.log("✅ Health check latency is minimal (< 2ms)");
    } else {
      console.log("⚠️ Health check latency may be too high (>= 2ms)");
    }

    if (healthCheckImpact.resourceUsage < 1) {
      console.log("✅ Health check resource usage is minimal (< 1%)");
    } else {
      console.log("⚠️ Health check resource usage may be too high (>= 1%)");
    }
  } catch (error) {
    console.error("❌ Health check impact analysis failed:", error);
    throw error;
  } finally {
    impactMeasurement.cleanup();
  }
}

/**
 * Example: Continuous Impact Monitoring
 */
export async function continuousImpactMonitoring(
  durationMinutes: number = 10
): Promise<void> {
  console.log(
    `🔍 Starting continuous impact monitoring for ${durationMinutes} minutes...`
  );

  const systemMetrics = new ExampleSystemMetricsCollector();
  const performanceMonitor = new ExamplePerformanceMonitor();
  const hybridRoutingMetrics = new ExampleHybridRoutingMetrics();

  const impactMeasurement = new SystemImpactMeasurement(
    systemMetrics,
    performanceMonitor,
    hybridRoutingMetrics
  );

  const reports: SystemImpactReport[] = [];
  const measurementInterval = 60000; // 1 minute
  const totalMeasurements = durationMinutes;

  try {
    for (let i = 0; i < totalMeasurements; i++) {
      console.log(`\n📊 Measurement ${i + 1}/${totalMeasurements}...`);

      // Start measurement
      await impactMeasurement.startMeasurement();

      // Wait for measurement interval
      await new Promise((resolve) => setTimeout(resolve, measurementInterval));

      // Stop measurement and collect report
      const report = await impactMeasurement.stopMeasurement();
      reports.push(report);

      console.log(
        `Impact: ${
          report.impactAnalysis.overallImpact.classification
        } (${report.impactAnalysis.overallImpact.score.toFixed(2)})`
      );

      // Brief pause between measurements
      if (i < totalMeasurements - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Analyze trends
    console.log("\n📈 Impact Trend Analysis:");
    const avgCpuImpact =
      reports.reduce(
        (sum, r) => sum + r.impactAnalysis.cpuImpact.percentageIncrease,
        0
      ) / reports.length;
    const avgMemoryImpact =
      reports.reduce(
        (sum, r) => sum + r.impactAnalysis.memoryImpact.percentageIncrease,
        0
      ) / reports.length;
    const avgLatencyImpact =
      reports.reduce(
        (sum, r) => sum + r.impactAnalysis.latencyImpact.percentageIncrease,
        0
      ) / reports.length;

    console.log(`Average CPU Impact: ${avgCpuImpact.toFixed(2)}%`);
    console.log(`Average Memory Impact: ${avgMemoryImpact.toFixed(2)}%`);
    console.log(`Average Latency Impact: ${avgLatencyImpact.toFixed(2)}%`);

    // Export data for further analysis
    const exportData = await impactMeasurement.exportMeasurementData(
      reports[reports.length - 1]
    );
    console.log("\n💾 Measurement data exported for analysis");
  } catch (error) {
    console.error("❌ Continuous monitoring failed:", error);
    throw error;
  } finally {
    impactMeasurement.cleanup();
  }
}

/**
 * Example: Production Impact Validation
 */
export async function productionImpactValidation(): Promise<boolean> {
  console.log("🔍 Validating production impact requirements...");

  const systemMetrics = new ExampleSystemMetricsCollector();
  const performanceMonitor = new ExamplePerformanceMonitor();
  const hybridRoutingMetrics = new ExampleHybridRoutingMetrics();

  const impactMeasurement = new SystemImpactMeasurement(
    systemMetrics,
    performanceMonitor,
    hybridRoutingMetrics
  );

  try {
    // Run comprehensive measurement
    await impactMeasurement.startMeasurement();
    await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 second measurement
    const report = await impactMeasurement.stopMeasurement();

    // Validate against production requirements
    const requirements = {
      maxCpuImpact: 5, // 5% max CPU impact
      maxMemoryImpact: 10, // 10% max memory impact
      maxLatencyImpact: 3, // 3% max latency impact
      minOverallScore: 90, // Minimum overall score
    };

    const validations = [
      {
        name: "CPU Impact",
        actual: report.impactAnalysis.cpuImpact.percentageIncrease,
        requirement: requirements.maxCpuImpact,
        passes:
          report.impactAnalysis.cpuImpact.percentageIncrease <=
          requirements.maxCpuImpact,
      },
      {
        name: "Memory Impact",
        actual: report.impactAnalysis.memoryImpact.percentageIncrease,
        requirement: requirements.maxMemoryImpact,
        passes:
          report.impactAnalysis.memoryImpact.percentageIncrease <=
          requirements.maxMemoryImpact,
      },
      {
        name: "Latency Impact",
        actual: report.impactAnalysis.latencyImpact.percentageIncrease,
        requirement: requirements.maxLatencyImpact,
        passes:
          report.impactAnalysis.latencyImpact.percentageIncrease <=
          requirements.maxLatencyImpact,
      },
      {
        name: "Overall Score",
        actual: report.impactAnalysis.overallImpact.score,
        requirement: requirements.minOverallScore,
        passes:
          report.impactAnalysis.overallImpact.score >=
          requirements.minOverallScore,
      },
    ];

    console.log("\n✅ Production Impact Validation Results:");
    let allPassed = true;

    validations.forEach((validation) => {
      const status = validation.passes ? "✅" : "❌";
      console.log(
        `${status} ${validation.name}: ${validation.actual.toFixed(
          2
        )} (requirement: ${validation.requirement})`
      );
      if (!validation.passes) {
        allPassed = false;
      }
    });

    if (allPassed) {
      console.log(
        "\n🎉 All production requirements met! System ready for deployment."
      );
    } else {
      console.log(
        "\n⚠️ Some production requirements not met. Review recommendations:"
      );
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    return allPassed;
  } catch (error) {
    console.error("❌ Production impact validation failed:", error);
    return false;
  } finally {
    impactMeasurement.cleanup();
  }
}

// Example usage
if (require.main === module) {
  async function runExamples() {
    try {
      console.log("🚀 Running System Impact Measurement Examples\n");

      // Run basic measurement
      await basicSystemImpactMeasurement();

      console.log("\n" + "=".repeat(50) + "\n");

      // Run routing decision analysis
      await routingDecisionImpactAnalysis();

      console.log("\n" + "=".repeat(50) + "\n");

      // Run health check analysis
      await healthCheckImpactAnalysis();

      console.log("\n" + "=".repeat(50) + "\n");

      // Run production validation
      const productionReady = await productionImpactValidation();

      console.log("\n🏁 Examples completed!");
      console.log(`Production Ready: ${productionReady ? "Yes" : "No"}`);
    } catch (error) {
      console.error("❌ Examples failed:", error);
      process.exit(1);
    }
  }

  runExamples();
}
