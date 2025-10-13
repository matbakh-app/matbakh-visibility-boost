/**
 * High Load Testing Engine - 10x Current Load Capacity
 * Implements comprehensive load testing with 10x current system capacity
 * Current baseline: 10 RPS -> Target: 100 RPS with 100 concurrent users
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
  LoadTestConfig,
  LoadTester,
  LoadTestPhase,
  LoadTestResult,
  LoadTestScenario,
} from "./load-tester";

export interface HighLoadTestConfig extends LoadTestConfig {
  scalingFactor: number; // Multiplier for current load (10x = 10)
  baselineRPS: number; // Current system baseline RPS
  targetRPS: number; // Target RPS for 10x load
  maxConcurrency: number; // Maximum concurrent users
  performanceThresholds: HighLoadThresholds;
}

export interface HighLoadThresholds {
  maxResponseTime: number; // Maximum acceptable response time (ms)
  maxErrorRate: number; // Maximum acceptable error rate (%)
  minThroughput: number; // Minimum required throughput (RPS)
  p95Threshold: number; // P95 response time threshold (ms)
  p99Threshold: number; // P99 response time threshold (ms)
}

export interface HighLoadTestResult extends LoadTestResult {
  scalingFactor: number;
  baselineComparison: {
    rpsIncrease: number;
    responseTimeDegradation: number;
    errorRateIncrease: number;
    throughputIncrease: number;
  };
  performanceGrades: {
    scalability: "A" | "B" | "C" | "D" | "F";
    stability: "A" | "B" | "C" | "D" | "F";
    efficiency: "A" | "B" | "C" | "D" | "F";
    overall: "A" | "B" | "C" | "D" | "F";
  };
  recommendations: HighLoadRecommendation[];
}

export interface HighLoadRecommendation {
  category:
    | "infrastructure"
    | "application"
    | "database"
    | "caching"
    | "monitoring";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  estimatedImpact: string;
  implementationEffort: "low" | "medium" | "high";
}

export class HighLoadTester extends LoadTester {
  private readonly DEFAULT_BASELINE_RPS = 10;
  private readonly DEFAULT_SCALING_FACTOR = 10;
  private readonly DEFAULT_THRESHOLDS: HighLoadThresholds = {
    maxResponseTime: 1000, // 1 second max response time
    maxErrorRate: 5, // 5% max error rate
    minThroughput: 90, // 90% of target throughput (90 RPS for 100 RPS target)
    p95Threshold: 800, // P95 under 800ms
    p99Threshold: 1500, // P99 under 1.5s
  };

  async runHighLoadTest(
    config: Partial<HighLoadTestConfig> = {}
  ): Promise<HighLoadTestResult> {
    console.log("🚀 Starting 10x High Load Test...");

    const fullConfig = this.buildHighLoadConfig(config);
    console.log(
      `📊 Target: ${fullConfig.targetRPS} RPS (${fullConfig.scalingFactor}x baseline of ${fullConfig.baselineRPS} RPS)`
    );
    console.log(`👥 Max Concurrency: ${fullConfig.maxConcurrency} users`);

    try {
      // Run the high load test
      const baseResult = await this.runLoadTest(fullConfig);

      // Enhance result with high load analysis
      const highLoadResult = await this.analyzeHighLoadResults(
        baseResult,
        fullConfig
      );

      // Generate detailed report
      await this.generateHighLoadReport(highLoadResult);

      console.log(
        `✅ High Load Test completed - Overall Grade: ${highLoadResult.performanceGrades.overall}`
      );
      return highLoadResult;
    } catch (error) {
      console.error("❌ High Load Test failed:", error);
      throw error;
    }
  }

  async runScalabilityTest(
    config: Partial<HighLoadTestConfig> = {}
  ): Promise<HighLoadTestResult> {
    console.log("📈 Starting Scalability Test (Progressive Load Increase)...");

    const fullConfig = this.buildHighLoadConfig(config);

    // Create progressive scaling phases
    const scalabilityPhases: LoadTestPhase[] = [
      { duration: 60, arrivalRate: fullConfig.baselineRPS, name: "baseline" },
      {
        duration: 120,
        arrivalRate: fullConfig.baselineRPS * 2,
        name: "2x-load",
      },
      {
        duration: 120,
        arrivalRate: fullConfig.baselineRPS * 5,
        name: "5x-load",
      },
      { duration: 180, arrivalRate: fullConfig.targetRPS, name: "10x-load" },
      {
        duration: 120,
        arrivalRate: fullConfig.baselineRPS * 5,
        name: "scale-down-5x",
      },
      { duration: 60, arrivalRate: fullConfig.baselineRPS, name: "recovery" },
    ];

    const scalabilityConfig = {
      ...fullConfig,
      phases: scalabilityPhases,
    };

    return this.runHighLoadTest(scalabilityConfig);
  }

  async runEnduranceTest(
    config: Partial<HighLoadTestConfig> = {}
  ): Promise<HighLoadTestResult> {
    console.log("⏱️ Starting Endurance Test (Sustained 10x Load)...");

    const fullConfig = this.buildHighLoadConfig(config);

    // Create endurance phases - sustained high load
    const endurancePhases: LoadTestPhase[] = [
      { duration: 120, arrivalRate: fullConfig.baselineRPS, name: "warmup" },
      {
        duration: 300,
        arrivalRate: fullConfig.targetRPS * 0.8,
        name: "ramp-up",
      },
      {
        duration: 1800,
        arrivalRate: fullConfig.targetRPS,
        name: "sustained-10x",
      }, // 30 minutes sustained
      { duration: 300, arrivalRate: fullConfig.baselineRPS, name: "cooldown" },
    ];

    const enduranceConfig = {
      ...fullConfig,
      phases: endurancePhases,
    };

    return this.runHighLoadTest(enduranceConfig);
  }

  private buildHighLoadConfig(
    config: Partial<HighLoadTestConfig>
  ): HighLoadTestConfig {
    const baselineRPS = config.baselineRPS || this.DEFAULT_BASELINE_RPS;
    const scalingFactor = config.scalingFactor || this.DEFAULT_SCALING_FACTOR;
    const targetRPS = config.targetRPS || baselineRPS * scalingFactor;

    return {
      target: config.target || "http://localhost:8080",
      scalingFactor,
      baselineRPS,
      targetRPS,
      maxConcurrency: config.maxConcurrency || targetRPS,
      performanceThresholds: {
        ...this.DEFAULT_THRESHOLDS,
        ...config.performanceThresholds,
      },
      phases:
        config.phases || this.generateHighLoadPhases(baselineRPS, targetRPS),
      scenarios: config.scenarios || this.getHighLoadScenarios(),
      thresholds:
        config.thresholds || this.generateHighLoadThresholds(targetRPS),
    };
  }

  private generateHighLoadPhases(
    baselineRPS: number,
    targetRPS: number
  ): LoadTestPhase[] {
    return [
      { duration: 60, arrivalRate: baselineRPS, name: "baseline-warmup" },
      {
        duration: 120,
        arrivalRate: Math.floor(targetRPS * 0.2),
        name: "ramp-up-20%",
      },
      {
        duration: 120,
        arrivalRate: Math.floor(targetRPS * 0.5),
        name: "ramp-up-50%",
      },
      {
        duration: 180,
        arrivalRate: Math.floor(targetRPS * 0.8),
        name: "ramp-up-80%",
      },
      { duration: 300, arrivalRate: targetRPS, name: "full-10x-load" }, // 5 minutes at full load
      {
        duration: 120,
        arrivalRate: Math.floor(targetRPS * 0.5),
        name: "ramp-down-50%",
      },
      { duration: 60, arrivalRate: baselineRPS, name: "recovery" },
    ];
  }

  private generateHighLoadThresholds(targetRPS: number): any {
    return {
      http_req_duration: ["p(95)<800", "p(99)<1500", "avg<500"],
      http_req_failed: ["rate<0.05"], // Less than 5% error rate
      http_reqs: [`rate>${targetRPS * 0.9}`], // At least 90% of target RPS
    };
  }

  private getHighLoadScenarios(): LoadTestScenario[] {
    return [
      {
        name: "High Load Visibility Check",
        weight: 60,
        flow: [
          { get: "/vc/quick" },
          { think: 1 }, // Reduced think time for high load
          {
            post: "/api/vc/start",
            json: {
              email: "loadtest@example.com",
              businessName: "Load Test Restaurant",
            },
          },
          { think: 2 },
          { get: "/vc/result?t={{ token }}" },
        ],
      },
      {
        name: "High Load Dashboard Access",
        weight: 25,
        flow: [
          { get: "/dashboard" },
          { think: 1 },
          { get: "/api/business/profile" },
          { get: "/api/analytics/summary" },
          { think: 1 },
          { get: "/api/analytics/performance" },
        ],
      },
      {
        name: "High Load API Stress",
        weight: 15,
        flow: [
          { get: "/api/health" },
          { get: "/api/qa/reports" },
          { post: "/api/qa/quick-scan", json: { files: ["src/test.ts"] } },
          { get: "/api/performance/metrics" },
        ],
      },
    ];
  }

  private async analyzeHighLoadResults(
    baseResult: LoadTestResult,
    config: HighLoadTestConfig
  ): Promise<HighLoadTestResult> {
    // Calculate baseline comparison
    const baselineComparison = {
      rpsIncrease:
        ((baseResult.requestsPerSecond - config.baselineRPS) /
          config.baselineRPS) *
        100,
      responseTimeDegradation: baseResult.averageResponseTime / 200, // Assuming 200ms baseline
      errorRateIncrease: baseResult.errorRate,
      throughputIncrease: ((baseResult.throughput - 1024) / 1024) * 100, // Assuming 1024 baseline throughput
    };

    // Calculate performance grades
    const performanceGrades = this.calculatePerformanceGrades(
      baseResult,
      config
    );

    // Generate recommendations
    const recommendations = this.generateHighLoadRecommendations(
      baseResult,
      config,
      performanceGrades
    );

    return {
      ...baseResult,
      scalingFactor: config.scalingFactor,
      baselineComparison,
      performanceGrades,
      recommendations,
    };
  }

  private calculatePerformanceGrades(
    result: LoadTestResult,
    config: HighLoadTestConfig
  ): HighLoadTestResult["performanceGrades"] {
    const thresholds = config.performanceThresholds;

    // Scalability grade (based on throughput achievement)
    const throughputAchievement = result.requestsPerSecond / config.targetRPS;
    const scalability = this.getGrade(
      [
        { threshold: 0.95, grade: "A" },
        { threshold: 0.85, grade: "B" },
        { threshold: 0.7, grade: "C" },
        { threshold: 0.5, grade: "D" },
      ],
      throughputAchievement
    );

    // Stability grade (based on error rate)
    const stability = this.getGrade(
      [
        { threshold: 0.01, grade: "A", inverse: true },
        { threshold: 0.025, grade: "B", inverse: true },
        { threshold: 0.05, grade: "C", inverse: true },
        { threshold: 0.1, grade: "D", inverse: true },
      ],
      result.errorRate / 100
    );

    // Efficiency grade (based on response time)
    const efficiency = this.getGrade(
      [
        { threshold: 300, grade: "A", inverse: true },
        { threshold: 500, grade: "B", inverse: true },
        { threshold: 800, grade: "C", inverse: true },
        { threshold: 1200, grade: "D", inverse: true },
      ],
      result.averageResponseTime
    );

    // Overall grade (weighted average)
    const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const overallScore =
      gradeValues[scalability] * 0.4 +
      gradeValues[stability] * 0.3 +
      gradeValues[efficiency] * 0.3;

    const overall = this.scoreToGrade(overallScore);

    return { scalability, stability, efficiency, overall };
  }

  private getGrade(
    thresholds: Array<{
      threshold: number;
      grade: "A" | "B" | "C" | "D";
      inverse?: boolean;
    }>,
    value: number
  ): "A" | "B" | "C" | "D" | "F" {
    for (const { threshold, grade, inverse } of thresholds) {
      if (inverse ? value <= threshold : value >= threshold) {
        return grade;
      }
    }
    return "F";
  }

  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 3.5) return "A";
    if (score >= 2.5) return "B";
    if (score >= 1.5) return "C";
    if (score >= 0.5) return "D";
    return "F";
  }

  private generateHighLoadRecommendations(
    result: LoadTestResult,
    config: HighLoadTestConfig,
    grades: HighLoadTestResult["performanceGrades"]
  ): HighLoadRecommendation[] {
    const recommendations: HighLoadRecommendation[] = [];

    // Scalability recommendations
    if (grades.scalability === "F" || grades.scalability === "D") {
      recommendations.push({
        category: "infrastructure",
        priority: "critical",
        title: "Scale Infrastructure Immediately",
        description: `System achieved only ${(
          (result.requestsPerSecond / config.targetRPS) *
          100
        ).toFixed(1)}% of target throughput. Immediate scaling required.`,
        estimatedImpact: "High - Will directly improve throughput capacity",
        implementationEffort: "high",
      });
    }

    // Stability recommendations
    if (grades.stability === "F" || grades.stability === "D") {
      recommendations.push({
        category: "application",
        priority: "critical",
        title: "Fix High Error Rate",
        description: `Error rate of ${result.errorRate.toFixed(
          2
        )}% is unacceptable for production load. Investigate and fix error sources.`,
        estimatedImpact: "Critical - System reliability at risk",
        implementationEffort: "medium",
      });
    }

    // Efficiency recommendations
    if (grades.efficiency === "F" || grades.efficiency === "D") {
      recommendations.push({
        category: "application",
        priority: "high",
        title: "Optimize Response Times",
        description: `Average response time of ${result.averageResponseTime.toFixed(
          0
        )}ms is too high for 10x load. Implement caching and optimize queries.`,
        estimatedImpact: "High - Will improve user experience significantly",
        implementationEffort: "medium",
      });
    }

    // Database recommendations
    if (result.averageResponseTime > 500) {
      recommendations.push({
        category: "database",
        priority: "high",
        title: "Implement Database Optimization",
        description:
          "High response times suggest database bottlenecks. Consider connection pooling, query optimization, and read replicas.",
        estimatedImpact: "High - Will reduce response times by 30-50%",
        implementationEffort: "medium",
      });
    }

    // Caching recommendations
    if (result.requestsPerSecond < config.targetRPS * 0.8) {
      recommendations.push({
        category: "caching",
        priority: "high",
        title: "Implement Aggressive Caching",
        description:
          "Low throughput indicates need for caching layer. Implement Redis caching for frequently accessed data.",
        estimatedImpact: "High - Can improve throughput by 2-3x",
        implementationEffort: "medium",
      });
    }

    // Monitoring recommendations
    recommendations.push({
      category: "monitoring",
      priority: "medium",
      title: "Enhanced Performance Monitoring",
      description:
        "Implement real-time performance monitoring to track system behavior under high load.",
      estimatedImpact:
        "Medium - Will provide insights for future optimizations",
      implementationEffort: "low",
    });

    return recommendations;
  }

  private async generateHighLoadReport(
    result: HighLoadTestResult
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = join(
      this.reportsDir || join(process.cwd(), "performance-reports"),
      `high-load-report-${timestamp}.md`
    );

    const reportContent = `# High Load Test Report - 10x Current Capacity

**Generated:** ${new Date().toISOString()}  
**Scaling Factor:** ${result.scalingFactor}x  
**Target Load:** ${result.scalingFactor * 10} RPS  
**Test Duration:** ${result.duration}ms

## Performance Summary

### Overall Grade: ${result.performanceGrades.overall}

- **Scalability:** ${
      result.performanceGrades.scalability
    } (Throughput Achievement)
- **Stability:** ${result.performanceGrades.stability} (Error Rate Management)
- **Efficiency:** ${
      result.performanceGrades.efficiency
    } (Response Time Performance)

### Key Metrics

- **Requests Per Second:** ${result.requestsPerSecond.toFixed(2)} RPS
- **Average Response Time:** ${result.averageResponseTime.toFixed(2)}ms
- **P95 Response Time:** ${result.p95ResponseTime.toFixed(2)}ms
- **P99 Response Time:** ${result.p99ResponseTime.toFixed(2)}ms
- **Error Rate:** ${result.errorRate.toFixed(2)}%
- **Total Requests:** ${result.totalRequests.toLocaleString()}

### Baseline Comparison

- **RPS Increase:** ${result.baselineComparison.rpsIncrease.toFixed(1)}%
- **Response Time Degradation:** ${result.baselineComparison.responseTimeDegradation.toFixed(
      2
    )}x
- **Error Rate:** ${result.baselineComparison.errorRateIncrease.toFixed(2)}%
- **Throughput Increase:** ${result.baselineComparison.throughputIncrease.toFixed(
      1
    )}%

## Recommendations

${result.recommendations
  .map(
    (rec) => `
### ${rec.title} (${rec.priority.toUpperCase()} Priority)

**Category:** ${rec.category}  
**Description:** ${rec.description}  
**Estimated Impact:** ${rec.estimatedImpact}  
**Implementation Effort:** ${rec.implementationEffort}
`
  )
  .join("\n")}

## Test Configuration

- **Target:** ${result.timestamp}
- **Scenarios:** ${result.scenarios.length} scenarios
- **Total Duration:** ${(result.duration / 1000 / 60).toFixed(1)} minutes

## Conclusion

${this.generateConclusion(result)}
`;

    writeFileSync(reportPath, reportContent);
    console.log(`📄 High Load Test Report generated: ${reportPath}`);
  }

  private generateConclusion(result: HighLoadTestResult): string {
    const grade = result.performanceGrades.overall;

    if (grade === "A") {
      return "🎉 **EXCELLENT**: System successfully handles 10x load with excellent performance. Ready for production scaling.";
    } else if (grade === "B") {
      return "✅ **GOOD**: System handles 10x load well with minor performance degradation. Consider implementing recommended optimizations.";
    } else if (grade === "C") {
      return "⚠️ **ACCEPTABLE**: System handles 10x load but with noticeable performance impact. Optimization required before production scaling.";
    } else if (grade === "D") {
      return "🚨 **POOR**: System struggles with 10x load. Significant optimization and infrastructure scaling required.";
    } else {
      return "❌ **FAILED**: System cannot handle 10x load. Critical infrastructure and application improvements needed before scaling.";
    }
  }

  // Static factory methods for common high load test configurations
  static getProductionReadinessTest(target: string): HighLoadTestConfig {
    return {
      target,
      scalingFactor: 10,
      baselineRPS: 10,
      targetRPS: 100,
      maxConcurrency: 100,
      performanceThresholds: {
        maxResponseTime: 800,
        maxErrorRate: 2,
        minThroughput: 90,
        p95Threshold: 600,
        p99Threshold: 1000,
      },
      phases: [
        { duration: 60, arrivalRate: 10, name: "baseline" },
        { duration: 180, arrivalRate: 50, name: "ramp-up" },
        { duration: 300, arrivalRate: 100, name: "full-load" },
        { duration: 120, arrivalRate: 10, name: "recovery" },
      ],
      scenarios: [],
    };
  }

  static getStressBreakingPointTest(target: string): HighLoadTestConfig {
    return {
      target,
      scalingFactor: 20, // Test beyond 10x to find breaking point
      baselineRPS: 10,
      targetRPS: 200,
      maxConcurrency: 200,
      performanceThresholds: {
        maxResponseTime: 2000,
        maxErrorRate: 10,
        minThroughput: 150,
        p95Threshold: 1500,
        p99Threshold: 3000,
      },
      phases: [
        { duration: 60, arrivalRate: 10, name: "baseline" },
        { duration: 120, arrivalRate: 50, name: "ramp-5x" },
        { duration: 120, arrivalRate: 100, name: "ramp-10x" },
        { duration: 120, arrivalRate: 150, name: "ramp-15x" },
        { duration: 180, arrivalRate: 200, name: "breaking-point" },
        { duration: 60, arrivalRate: 10, name: "recovery" },
      ],
      scenarios: [],
    };
  }
}

export const highLoadTester = new HighLoadTester();
