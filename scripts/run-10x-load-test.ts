#!/usr/bin/env tsx

/**
 * 10x Load Testing Script
 * Runs comprehensive load testing with 10x current system capacity
 *
 * Usage:
 *   npm run test:load-10x
 *   tsx scripts/run-10x-load-test.ts --target https://api.matbakh.app
 *   tsx scripts/run-10x-load-test.ts --type scalability
 *   tsx scripts/run-10x-load-test.ts --type endurance --duration 3600
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
  HighLoadTestConfig,
  highLoadTester,
} from "../src/lib/performance-testing/high-load-tester";

interface TestOptions {
  target?: string;
  type?: "standard" | "scalability" | "endurance" | "breaking-point";
  baselineRPS?: number;
  scalingFactor?: number;
  duration?: number;
  environment?: "development" | "staging" | "production";
  reportFormat?: "json" | "markdown" | "both";
  verbose?: boolean;
}

async function main() {
  const options = parseArguments();

  console.log("🚀 Starting 10x Load Testing Suite");
  console.log("=====================================");
  console.log(`Target: ${options.target}`);
  console.log(`Test Type: ${options.type}`);
  console.log(`Environment: ${options.environment}`);
  console.log(`Baseline RPS: ${options.baselineRPS}`);
  console.log(`Scaling Factor: ${options.scalingFactor}x`);
  console.log("");

  try {
    const startTime = Date.now();
    let result;

    switch (options.type) {
      case "scalability":
        console.log(
          "📈 Running Scalability Test (Progressive Load Increase)..."
        );
        result = await highLoadTester.runScalabilityTest(buildConfig(options));
        break;

      case "endurance":
        console.log("⏱️ Running Endurance Test (Sustained High Load)...");
        result = await highLoadTester.runEnduranceTest(buildConfig(options));
        break;

      case "breaking-point":
        console.log("💥 Running Breaking Point Test (Beyond 10x Load)...");
        const breakingConfig = buildConfig(options);
        breakingConfig.scalingFactor = 20; // Test beyond 10x
        breakingConfig.targetRPS = (options.baselineRPS || 10) * 20;
        result = await highLoadTester.runHighLoadTest(breakingConfig);
        break;

      default:
        console.log("🔥 Running Standard 10x Load Test...");
        result = await highLoadTester.runHighLoadTest(buildConfig(options));
        break;
    }

    const duration = Date.now() - startTime;

    // Display results
    displayResults(result, duration, options);

    // Generate reports
    await generateReports(result, options);

    // Exit with appropriate code
    const exitCode = determineExitCode(result);
    console.log(
      `\n🏁 Test completed in ${(duration / 1000 / 60).toFixed(1)} minutes`
    );
    console.log(
      `Exit code: ${exitCode} (${exitCode === 0 ? "SUCCESS" : "FAILURE"})`
    );

    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Load test failed:", error);
    process.exit(1);
  }
}

function parseArguments(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    target: "http://localhost:8080",
    type: "standard",
    baselineRPS: 10,
    scalingFactor: 10,
    environment: "staging",
    reportFormat: "both",
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--target":
      case "-t":
        options.target = nextArg;
        i++;
        break;

      case "--type":
        if (
          ["standard", "scalability", "endurance", "breaking-point"].includes(
            nextArg
          )
        ) {
          options.type = nextArg as TestOptions["type"];
        }
        i++;
        break;

      case "--baseline-rps":
        options.baselineRPS = parseInt(nextArg);
        i++;
        break;

      case "--scaling-factor":
        options.scalingFactor = parseInt(nextArg);
        i++;
        break;

      case "--duration":
        options.duration = parseInt(nextArg);
        i++;
        break;

      case "--environment":
      case "--env":
        if (["development", "staging", "production"].includes(nextArg)) {
          options.environment = nextArg as TestOptions["environment"];
        }
        i++;
        break;

      case "--report-format":
        if (["json", "markdown", "both"].includes(nextArg)) {
          options.reportFormat = nextArg as TestOptions["reportFormat"];
        }
        i++;
        break;

      case "--verbose":
      case "-v":
        options.verbose = true;
        break;

      case "--help":
      case "-h":
        displayHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function buildConfig(options: TestOptions): Partial<HighLoadTestConfig> {
  const config: Partial<HighLoadTestConfig> = {
    target: options.target,
    baselineRPS: options.baselineRPS,
    scalingFactor: options.scalingFactor,
    targetRPS: (options.baselineRPS || 10) * (options.scalingFactor || 10),
  };

  // Environment-specific thresholds
  if (options.environment === "production") {
    config.performanceThresholds = {
      maxResponseTime: 500,
      maxErrorRate: 1,
      minThroughput: config.targetRPS! * 0.95,
      p95Threshold: 400,
      p99Threshold: 800,
    };
  } else if (options.environment === "staging") {
    config.performanceThresholds = {
      maxResponseTime: 800,
      maxErrorRate: 3,
      minThroughput: config.targetRPS! * 0.85,
      p95Threshold: 600,
      p99Threshold: 1200,
    };
  }

  return config;
}

function displayResults(
  result: any,
  duration: number,
  options: TestOptions
): void {
  console.log("\n📊 TEST RESULTS");
  console.log("================");
  console.log(`Overall Grade: ${result.performanceGrades.overall} 🎯`);
  console.log(`Test Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
  console.log("");

  console.log("📈 Performance Grades:");
  console.log(
    `  Scalability: ${result.performanceGrades.scalability} (Throughput Achievement)`
  );
  console.log(
    `  Stability:   ${result.performanceGrades.stability} (Error Rate Management)`
  );
  console.log(
    `  Efficiency:  ${result.performanceGrades.efficiency} (Response Time Performance)`
  );
  console.log("");

  console.log("🔢 Key Metrics:");
  console.log(`  Requests/Second: ${result.requestsPerSecond.toFixed(2)} RPS`);
  console.log(`  Avg Response:    ${result.averageResponseTime.toFixed(2)}ms`);
  console.log(`  P95 Response:    ${result.p95ResponseTime.toFixed(2)}ms`);
  console.log(`  P99 Response:    ${result.p99ResponseTime.toFixed(2)}ms`);
  console.log(`  Error Rate:      ${result.errorRate.toFixed(2)}%`);
  console.log(`  Total Requests:  ${result.totalRequests.toLocaleString()}`);
  console.log("");

  console.log("📊 Baseline Comparison:");
  console.log(
    `  RPS Increase:        ${result.baselineComparison.rpsIncrease.toFixed(
      1
    )}%`
  );
  console.log(
    `  Response Degradation: ${result.baselineComparison.responseTimeDegradation.toFixed(
      2
    )}x`
  );
  console.log(
    `  Error Rate:          ${result.baselineComparison.errorRateIncrease.toFixed(
      2
    )}%`
  );
  console.log("");

  if (options.verbose && result.recommendations.length > 0) {
    console.log("💡 Top Recommendations:");
    result.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
      console.log(
        `  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`
      );
      console.log(`     ${rec.description}`);
      console.log(`     Impact: ${rec.estimatedImpact}`);
      console.log("");
    });
  }
}

async function generateReports(
  result: any,
  options: TestOptions
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportsDir = join(process.cwd(), "performance-reports");

  if (options.reportFormat === "json" || options.reportFormat === "both") {
    const jsonPath = join(
      reportsDir,
      `10x-load-test-${options.type}-${timestamp}.json`
    );
    writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`📄 JSON Report: ${jsonPath}`);
  }

  if (options.reportFormat === "markdown" || options.reportFormat === "both") {
    const markdownPath = join(
      reportsDir,
      `10x-load-test-${options.type}-${timestamp}.md`
    );
    const markdownContent = generateMarkdownReport(result, options);
    writeFileSync(markdownPath, markdownContent);
    console.log(`📄 Markdown Report: ${markdownPath}`);
  }
}

function generateMarkdownReport(result: any, options: TestOptions): string {
  return `# 10x Load Test Report - ${options.type?.toUpperCase()}

**Generated:** ${new Date().toISOString()}  
**Target:** ${options.target}  
**Environment:** ${options.environment}  
**Test Type:** ${options.type}  
**Scaling Factor:** ${result.scalingFactor}x

## Executive Summary

### Overall Performance Grade: ${result.performanceGrades.overall}

${getGradeDescription(result.performanceGrades.overall)}

## Performance Breakdown

| Metric | Grade | Value | Threshold |
|--------|-------|-------|-----------|
| Scalability | ${
    result.performanceGrades.scalability
  } | ${result.requestsPerSecond.toFixed(2)} RPS | ${
    (options.baselineRPS || 10) * (options.scalingFactor || 10)
  } RPS target |
| Stability | ${
    result.performanceGrades.stability
  } | ${result.errorRate.toFixed(2)}% | <5% error rate |
| Efficiency | ${
    result.performanceGrades.efficiency
  } | ${result.averageResponseTime.toFixed(2)}ms | <800ms avg response |

## Detailed Metrics

- **Total Requests:** ${result.totalRequests.toLocaleString()}
- **Test Duration:** ${(result.duration / 1000 / 60).toFixed(1)} minutes
- **Average Response Time:** ${result.averageResponseTime.toFixed(2)}ms
- **P95 Response Time:** ${result.p95ResponseTime.toFixed(2)}ms
- **P99 Response Time:** ${result.p99ResponseTime.toFixed(2)}ms
- **Throughput:** ${result.requestsPerSecond.toFixed(2)} RPS
- **Error Rate:** ${result.errorRate.toFixed(2)}%

## Baseline Comparison

- **RPS Increase:** ${result.baselineComparison.rpsIncrease.toFixed(1)}%
- **Response Time Degradation:** ${result.baselineComparison.responseTimeDegradation.toFixed(
    2
  )}x
- **Error Rate Change:** ${result.baselineComparison.errorRateIncrease.toFixed(
    2
  )}%

## Recommendations

${result.recommendations
  .map(
    (rec: any, index: number) => `
### ${index + 1}. ${rec.title} (${rec.priority.toUpperCase()} Priority)

**Category:** ${rec.category}  
**Implementation Effort:** ${rec.implementationEffort}  

${rec.description}

**Estimated Impact:** ${rec.estimatedImpact}
`
  )
  .join("\n")}

## Conclusion

${getConclusion(result)}

---
*Generated by matbakh.app 10x Load Testing Suite*
`;
}

function getGradeDescription(grade: string): string {
  switch (grade) {
    case "A":
      return "🎉 **EXCELLENT** - System handles 10x load exceptionally well";
    case "B":
      return "✅ **GOOD** - System performs well under 10x load with minor issues";
    case "C":
      return "⚠️ **ACCEPTABLE** - System handles 10x load but needs optimization";
    case "D":
      return "🚨 **POOR** - System struggles with 10x load, significant improvements needed";
    case "F":
      return "❌ **FAILED** - System cannot handle 10x load, critical issues detected";
    default:
      return "Unknown performance grade";
  }
}

function getConclusion(result: any): string {
  const grade = result.performanceGrades.overall;
  const criticalRecs = result.recommendations.filter(
    (r: any) => r.priority === "critical"
  ).length;

  if (grade === "A") {
    return "System is ready for 10x scaling in production. Excellent performance across all metrics.";
  } else if (grade === "B") {
    return "System performs well under 10x load. Consider implementing recommended optimizations for production readiness.";
  } else if (grade === "C") {
    return "System can handle 10x load but requires optimization before production scaling. Focus on high-priority recommendations.";
  } else if (grade === "D") {
    return `System struggles with 10x load. ${criticalRecs} critical issues must be addressed before scaling.`;
  } else {
    return `System failed 10x load test. ${criticalRecs} critical issues require immediate attention before any scaling attempts.`;
  }
}

function determineExitCode(result: any): number {
  const grade = result.performanceGrades.overall;
  const criticalIssues = result.recommendations.filter(
    (r: any) => r.priority === "critical"
  ).length;

  // Success: Grade A or B with no critical issues
  if ((grade === "A" || grade === "B") && criticalIssues === 0) {
    return 0;
  }

  // Failure: Grade D or F, or any critical issues
  if (grade === "D" || grade === "F" || criticalIssues > 0) {
    return 1;
  }

  // Warning: Grade C - acceptable but needs work
  return 0; // Still success, but with warnings
}

function displayHelp(): void {
  console.log(`
10x Load Testing Suite - matbakh.app

USAGE:
  tsx scripts/run-10x-load-test.ts [OPTIONS]

OPTIONS:
  -t, --target <url>           Target URL for testing (default: http://localhost:8080)
  --type <type>               Test type: standard|scalability|endurance|breaking-point
  --baseline-rps <number>     Baseline RPS (default: 10)
  --scaling-factor <number>   Scaling factor (default: 10)
  --duration <seconds>        Test duration for endurance tests
  --env <environment>         Environment: development|staging|production
  --report-format <format>    Report format: json|markdown|both
  -v, --verbose               Verbose output
  -h, --help                  Show this help

EXAMPLES:
  # Standard 10x load test
  tsx scripts/run-10x-load-test.ts

  # Scalability test with custom target
  tsx scripts/run-10x-load-test.ts --target https://api.matbakh.app --type scalability

  # Endurance test for production
  tsx scripts/run-10x-load-test.ts --type endurance --env production --duration 3600

  # Breaking point test (20x load)
  tsx scripts/run-10x-load-test.ts --type breaking-point --baseline-rps 20

PERFORMANCE GRADES:
  A - Excellent (90-100%)     Ready for production scaling
  B - Good (80-89%)          Minor optimizations recommended  
  C - Acceptable (70-79%)    Optimization required
  D - Poor (60-69%)          Significant improvements needed
  F - Failed (<60%)          Critical issues must be fixed
`);
}

// Run the script if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as run10xLoadTest };
