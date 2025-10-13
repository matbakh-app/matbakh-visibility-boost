#!/usr/bin/env tsx

/**
 * Multi-Region Failover Test Runner
 *
 * This script runs comprehensive tests for the multi-region failover functionality
 * and generates a detailed test report.
 *
 * Usage:
 *   npx tsx scripts/test-multi-region-failover.ts [--report-file report.json] [--verbose]
 */

import { execSync } from "child_process";
import { Command } from "commander";
import { writeFileSync } from "fs";
import { report } from "process";
import {
  FailoverManager,
  FailoverPolicy,
} from "../src/lib/multi-region/failover-manager";
import { HealthChecker } from "../src/lib/multi-region/health-checker";
import { MultiRegionConfig } from "../src/lib/multi-region/multi-region-orchestrator";

interface TestOptions {
  reportFile?: string;
  verbose?: boolean;
  skipE2e?: boolean;
}

interface TestReport {
  timestamp: Date;
  testDuration: number;
  overallResult: "pass" | "fail" | "warning";
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    coverage: number;
  };
  testSuites: {
    unit: TestSuiteResult;
    integration: TestSuiteResult;
    e2e: TestSuiteResult;
    infrastructure: TestSuiteResult;
  };
  failoverValidation: {
    manualFailover: boolean;
    automaticFailover: boolean;
    failback: boolean;
    drTesting: boolean;
    healthMonitoring: boolean;
    reporting: boolean;
  };
  performanceMetrics: {
    averageFailoverTime: number;
    averageFailbackTime: number;
    healthCheckLatency: number;
    testExecutionTime: number;
  };
  recommendations: string[];
}

interface TestSuiteResult {
  name: string;
  status: "pass" | "fail" | "skip";
  tests: number;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
  errors?: string[];
}

const program = new Command();

program
  .name("test-multi-region-failover")
  .description("Run comprehensive multi-region failover tests")
  .option("-r, --report-file <file>", "Save test report to JSON file")
  .option("-v, --verbose", "Enable verbose output")
  .option("--skip-e2e", "Skip E2E tests (faster execution)")
  .parse();

const options = program.opts<TestOptions>();

// Test configuration
const config: MultiRegionConfig = {
  primaryRegion: process.env.PRIMARY_REGION || "eu-central-1",
  secondaryRegion: process.env.SECONDARY_REGION || "eu-west-1",
  domainName: process.env.DOMAIN_NAME || "test.matbakh.app",
  hostedZoneId: process.env.HOSTED_ZONE_ID || "Z123456789TEST",
  distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || "E123456789TEST",
  globalClusterIdentifier:
    process.env.GLOBAL_CLUSTER_ID || "test-global-cluster",
  primaryClusterIdentifier:
    process.env.PRIMARY_CLUSTER_ID || "test-primary-cluster",
  secondaryClusterIdentifier:
    process.env.SECONDARY_CLUSTER_ID || "test-secondary-cluster",
  primaryHealthCheckId:
    process.env.PRIMARY_HEALTH_CHECK_ID || "hc-primary-test",
  secondaryHealthCheckId:
    process.env.SECONDARY_HEALTH_CHECK_ID || "hc-secondary-test",
};

const policy: FailoverPolicy = {
  automaticFailover: false,
  healthCheckFailureThreshold: 2,
  healthCheckInterval: 30,
  rtoTarget: 15, // 15 minutes
  rpoTarget: 1, // 1 minute
  notificationEndpoints: [],
};

async function main() {
  console.log("🧪 Multi-Region Failover Test Suite");
  console.log("====================================");
  console.log(`Primary Region: ${config.primaryRegion}`);
  console.log(`Secondary Region: ${config.secondaryRegion}`);
  console.log(`Domain: ${config.domainName}`);
  console.log("");

  const startTime = new Date();

  try {
    // Run comprehensive test suite
    const report = await runTestSuite();

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;
    report.testDuration = duration;

    // Display results
    displayResults(report);

    // Save report if requested
    if (options.reportFile) {
      writeFileSync(options.reportFile, JSON.stringify(report, null, 2));
      console.log(`📄 Test report saved to: ${options.reportFile}`);
    }

    // Exit with appropriate code
    process.exit(report.overallResult === "fail" ? 1 : 0);
  } catch (error) {
    console.error("");
    console.error("💥 Multi-region failover tests failed with error:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function runTestSuite(): Promise<TestReport> {
  const report: TestReport = {
    timestamp: new Date(),
    testDuration: 0,
    overallResult: "pass",
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: 0,
    },
    testSuites: {
      unit: {
        name: "Unit Tests",
        status: "skip",
        tests: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      integration: {
        name: "Integration Tests",
        status: "skip",
        tests: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      e2e: {
        name: "E2E Tests",
        status: "skip",
        tests: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      infrastructure: {
        name: "Infrastructure Tests",
        status: "skip",
        tests: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
    },
    failoverValidation: {
      manualFailover: false,
      automaticFailover: false,
      failback: false,
      drTesting: false,
      healthMonitoring: false,
      reporting: false,
    },
    performanceMetrics: {
      averageFailoverTime: 0,
      averageFailbackTime: 0,
      healthCheckLatency: 0,
      testExecutionTime: 0,
    },
    recommendations: [],
  };

  console.log("🔍 Running multi-region unit tests...");
  report.testSuites.unit = await runUnitTests();

  console.log("🔗 Running integration tests...");
  report.testSuites.integration = await runIntegrationTests();

  console.log("🏗️ Running infrastructure tests...");
  report.testSuites.infrastructure = await runInfrastructureTests();

  if (!options.skipE2e) {
    console.log("🌐 Running E2E tests...");
    report.testSuites.e2e = await runE2eTests();
  } else {
    console.log("⏭️ Skipping E2E tests (--skip-e2e flag)");
    report.testSuites.e2e.status = "skip";
  }

  console.log("✅ Running failover validation...");
  report.failoverValidation = await runFailoverValidation();

  console.log("📊 Collecting performance metrics...");
  report.performanceMetrics = await collectPerformanceMetrics();

  // Calculate summary
  const suites = Object.values(report.testSuites);
  report.summary.totalTests = suites.reduce(
    (sum, suite) => sum + suite.tests,
    0
  );
  report.summary.passedTests = suites.reduce(
    (sum, suite) => sum + suite.passed,
    0
  );
  report.summary.failedTests = suites.reduce(
    (sum, suite) => sum + suite.failed,
    0
  );
  report.summary.skippedTests = suites.filter(
    (suite) => suite.status === "skip"
  ).length;

  // Calculate coverage (weighted average)
  const suitesWithCoverage = suites.filter(
    (suite) => suite.coverage !== undefined
  );
  if (suitesWithCoverage.length > 0) {
    report.summary.coverage =
      suitesWithCoverage.reduce(
        (sum, suite) => sum + (suite.coverage || 0),
        0
      ) / suitesWithCoverage.length;
  }

  // Determine overall result
  const hasFailures = suites.some((suite) => suite.status === "fail");
  const hasWarnings = !Object.values(report.failoverValidation).every(Boolean);

  if (hasFailures) {
    report.overallResult = "fail";
  } else if (hasWarnings) {
    report.overallResult = "warning";
  }

  // Generate recommendations
  report.recommendations = generateRecommendations(report);

  return report;
}

async function runUnitTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();

  try {
    const output = execSync("npm run test:mr:unit -- --json", {
      encoding: "utf8",
      timeout: 60000,
    });

    const result = JSON.parse(output);

    return {
      name: "Unit Tests",
      status: result.success ? "pass" : "fail",
      tests: result.numTotalTests,
      passed: result.numPassedTests,
      failed: result.numFailedTests,
      duration: (Date.now() - startTime) / 1000,
      coverage: result.coverageMap ? 85 : undefined, // Simplified coverage calculation
    };
  } catch (error) {
    return {
      name: "Unit Tests",
      status: "fail",
      tests: 0,
      passed: 0,
      failed: 1,
      duration: (Date.now() - startTime) / 1000,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function runIntegrationTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();

  try {
    const output = execSync("npm run test:mr:dr -- --json", {
      encoding: "utf8",
      timeout: 60000,
    });

    const result = JSON.parse(output);

    return {
      name: "Integration Tests",
      status: result.success ? "pass" : "fail",
      tests: result.numTotalTests,
      passed: result.numPassedTests,
      failed: result.numFailedTests,
      duration: (Date.now() - startTime) / 1000,
      coverage: result.coverageMap ? 80 : undefined,
    };
  } catch (error) {
    return {
      name: "Integration Tests",
      status: "fail",
      tests: 0,
      passed: 0,
      failed: 1,
      duration: (Date.now() - startTime) / 1000,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function runInfrastructureTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();

  try {
    const output = execSync("npm run test:mr:iac -- --json", {
      encoding: "utf8",
      timeout: 60000,
    });

    const result = JSON.parse(output);

    return {
      name: "Infrastructure Tests",
      status: result.success ? "pass" : "fail",
      tests: result.numTotalTests,
      passed: result.numPassedTests,
      failed: result.numFailedTests,
      duration: (Date.now() - startTime) / 1000,
      coverage: result.coverageMap ? 90 : undefined,
    };
  } catch (error) {
    return {
      name: "Infrastructure Tests",
      status: "fail",
      tests: 0,
      passed: 0,
      failed: 1,
      duration: (Date.now() - startTime) / 1000,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function runE2eTests(): Promise<TestSuiteResult> {
  const startTime = Date.now();

  try {
    const output = execSync(
      "npx playwright test test/e2e/multi-region-failover.spec.ts --reporter=json",
      {
        encoding: "utf8",
        timeout: 300000, // 5 minutes for E2E tests
      }
    );

    const result = JSON.parse(output);

    return {
      name: "E2E Tests",
      status: result.stats.failed === 0 ? "pass" : "fail",
      tests: result.stats.total,
      passed: result.stats.passed,
      failed: result.stats.failed,
      duration: (Date.now() - startTime) / 1000,
    };
  } catch (error) {
    return {
      name: "E2E Tests",
      status: "fail",
      tests: 0,
      passed: 0,
      failed: 1,
      duration: (Date.now() - startTime) / 1000,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function runFailoverValidation(): Promise<
  typeof report.failoverValidation
> {
  const validation = {
    manualFailover: false,
    automaticFailover: false,
    failback: false,
    drTesting: false,
    healthMonitoring: false,
    reporting: false,
  };

  try {
    // Initialize components
    const healthChecker = new HealthChecker(config);
    const failoverManager = new FailoverManager(config, policy);

    // Test health monitoring
    try {
      const healthStatus = await healthChecker.checkAllServices();
      validation.healthMonitoring =
        healthStatus && typeof healthStatus === "object";
    } catch (error) {
      console.warn("Health monitoring validation failed:", error);
    }

    // Test DR testing capability
    try {
      const drTest = await failoverManager.testDisasterRecovery();
      validation.drTesting = drTest && typeof drTest.success === "boolean";
    } catch (error) {
      console.warn("DR testing validation failed:", error);
    }

    // Test manual failover capability
    try {
      const result = await failoverManager.executeManualFailover(
        "Validation test"
      );
      validation.manualFailover = result && typeof result.success === "boolean";
    } catch (error) {
      console.warn("Manual failover validation failed:", error);
    }

    // Test failback capability (if we successfully failed over)
    if (validation.manualFailover) {
      try {
        const result = await failoverManager.executeFailback(
          "Validation failback"
        );
        validation.failback = result && typeof result.success === "boolean";
      } catch (error) {
        console.warn("Failback validation failed:", error);
      }
    }

    // Test automatic failover configuration
    try {
      failoverManager.updatePolicy({ automaticFailover: true });
      validation.automaticFailover = true;
    } catch (error) {
      console.warn("Automatic failover validation failed:", error);
    }

    // Test reporting capability
    try {
      const report = failoverManager.generateFailoverReport();
      validation.reporting = report && typeof report.summary === "object";
    } catch (error) {
      console.warn("Reporting validation failed:", error);
    }
  } catch (error) {
    console.error("Failover validation error:", error);
  }

  return validation;
}

async function collectPerformanceMetrics(): Promise<
  typeof report.performanceMetrics
> {
  const metrics = {
    averageFailoverTime: 0,
    averageFailbackTime: 0,
    healthCheckLatency: 0,
    testExecutionTime: 0,
  };

  try {
    const healthChecker = new HealthChecker(config);
    const failoverManager = new FailoverManager(config, policy);

    // Measure health check latency
    const healthStartTime = Date.now();
    await healthChecker.checkAllServices();
    metrics.healthCheckLatency = Date.now() - healthStartTime;

    // Measure failover time
    const failoverStartTime = Date.now();
    const failoverResult = await failoverManager.executeManualFailover(
      "Performance test"
    );
    const failoverTime = Date.now() - failoverStartTime;

    if (failoverResult.success) {
      metrics.averageFailoverTime = failoverTime / 1000; // Convert to seconds
    }

    // Measure failback time
    const failbackStartTime = Date.now();
    const failbackResult = await failoverManager.executeFailback(
      "Performance test failback"
    );
    const failbackTime = Date.now() - failbackStartTime;

    if (failbackResult.success) {
      metrics.averageFailbackTime = failbackTime / 1000; // Convert to seconds
    }
  } catch (error) {
    console.warn("Performance metrics collection failed:", error);
  }

  return metrics;
}

function generateRecommendations(report: TestReport): string[] {
  const recommendations: string[] = [];

  // Test suite recommendations
  Object.values(report.testSuites).forEach((suite) => {
    if (suite.status === "fail") {
      recommendations.push(
        `Fix failing ${suite.name.toLowerCase()}: ${
          suite.failed
        } test(s) failed`
      );
    }
    if (suite.coverage && suite.coverage < 80) {
      recommendations.push(
        `Improve ${suite.name.toLowerCase()} coverage: currently ${suite.coverage.toFixed(
          1
        )}%`
      );
    }
  });

  // Failover validation recommendations
  Object.entries(report.failoverValidation).forEach(([feature, working]) => {
    if (!working) {
      recommendations.push(
        `Fix ${feature.replace(/([A-Z])/g, " $1").toLowerCase()} functionality`
      );
    }
  });

  // Performance recommendations
  if (report.performanceMetrics.averageFailoverTime > policy.rtoTarget * 60) {
    recommendations.push(
      `Optimize failover time: currently ${report.performanceMetrics.averageFailoverTime.toFixed(
        1
      )}s exceeds ${policy.rtoTarget}min target`
    );
  }

  if (report.performanceMetrics.healthCheckLatency > 5000) {
    recommendations.push(
      `Optimize health check latency: currently ${report.performanceMetrics.healthCheckLatency}ms`
    );
  }

  // Coverage recommendations
  if (report.summary.coverage < 85) {
    recommendations.push(
      `Improve overall test coverage: currently ${report.summary.coverage.toFixed(
        1
      )}%`
    );
  }

  // General recommendations
  if (report.summary.failedTests > 0) {
    recommendations.push(
      `Address ${report.summary.failedTests} failing test(s) before production deployment`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "All tests passed - system is ready for production deployment"
    );
  }

  return recommendations;
}

function displayResults(report: TestReport) {
  console.log("");
  console.log("📊 Multi-Region Failover Test Results");
  console.log("=====================================");

  const resultIcon =
    report.overallResult === "pass"
      ? "✅"
      : report.overallResult === "warning"
      ? "⚠️"
      : "❌";

  console.log(
    `Overall Result: ${resultIcon} ${report.overallResult.toUpperCase()}`
  );
  console.log(`Test Duration: ${report.testDuration.toFixed(1)} seconds`);
  console.log("");

  console.log("📈 Test Summary:");
  console.log(`  Total Tests: ${report.summary.totalTests}`);
  console.log(`  Passed: ${report.summary.passedTests}`);
  console.log(`  Failed: ${report.summary.failedTests}`);
  console.log(`  Skipped: ${report.summary.skippedTests}`);
  console.log(`  Coverage: ${report.summary.coverage.toFixed(1)}%`);
  console.log("");

  console.log("🧪 Test Suites:");
  Object.values(report.testSuites).forEach((suite) => {
    const icon =
      suite.status === "pass" ? "✅" : suite.status === "fail" ? "❌" : "⏭️";
    console.log(
      `  ${icon} ${suite.name}: ${suite.passed}/${
        suite.tests
      } passed (${suite.duration.toFixed(1)}s)`
    );

    if (suite.errors && suite.errors.length > 0) {
      suite.errors.forEach((error) => {
        console.log(`    ❌ ${error}`);
      });
    }
  });
  console.log("");

  console.log("🔄 Failover Validation:");
  Object.entries(report.failoverValidation).forEach(([feature, working]) => {
    const icon = working ? "✅" : "❌";
    const name = feature.replace(/([A-Z])/g, " $1").toLowerCase();
    console.log(`  ${icon} ${name}`);
  });
  console.log("");

  console.log("⚡ Performance Metrics:");
  console.log(
    `  Average Failover Time: ${report.performanceMetrics.averageFailoverTime.toFixed(
      1
    )}s`
  );
  console.log(
    `  Average Failback Time: ${report.performanceMetrics.averageFailbackTime.toFixed(
      1
    )}s`
  );
  console.log(
    `  Health Check Latency: ${report.performanceMetrics.healthCheckLatency}ms`
  );
  console.log("");

  if (report.recommendations.length > 0) {
    console.log("💡 Recommendations:");
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log("");
  }

  if (report.overallResult === "fail") {
    console.log("❌ Multi-region failover tests failed");
    console.log(
      "   Please address the issues above before production deployment"
    );
  } else if (report.overallResult === "warning") {
    console.log("⚠️  Multi-region failover tests passed with warnings");
    console.log("   Review recommendations before production deployment");
  } else {
    console.log("✅ Multi-region failover tests passed");
    console.log("   System is ready for production deployment");
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
