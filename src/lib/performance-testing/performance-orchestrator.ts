/**
 * Performance Testing Orchestrator
 * Coordinates all performance testing activities and generates comprehensive reports
 */

import { loadTester, LoadTestConfig, LoadTestResult } from './load-tester';
import { regressionDetector, PerformanceMetrics, RegressionResult } from './regression-detector';
import { benchmarkComparator, ComparisonResult } from './benchmark-comparator';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface PerformanceTestSuite {
  name: string;
  description: string;
  tests: PerformanceTest[];
  config: PerformanceTestConfig;
}

export interface PerformanceTest {
  name: string;
  type: 'load' | 'stress' | 'spike' | 'endurance' | 'volume';
  config: LoadTestConfig;
  enabled: boolean;
}

export interface PerformanceTestConfig {
  target: string;
  environment: 'development' | 'staging' | 'production';
  parallel: boolean;
  timeout: number;
  retries: number;
  reportFormat: ('json' | 'html' | 'markdown')[];
}

export interface PerformanceTestResult {
  timestamp: string;
  suiteName: string;
  environment: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  duration: number;
  testResults: TestExecutionResult[];
  regressionAnalysis?: RegressionResult;
  benchmarkComparison?: ComparisonResult;
  summary: PerformanceTestSummary;
  reports: {
    json: string;
    html?: string;
    markdown?: string;
  };
}

export interface TestExecutionResult {
  testName: string;
  type: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  loadTestResult?: LoadTestResult;
  error?: string;
  metrics: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    concurrency: number;
  };
}

export interface PerformanceTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  averageResponseTime: number;
  totalThroughput: number;
  overallErrorRate: number;
  performanceScore: number;
  recommendations: string[];
}

export class PerformanceTestOrchestrator {
  private reportsDir: string;

  constructor() {
    this.reportsDir = join(process.cwd(), 'performance-reports');
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runPerformanceTestSuite(suite: PerformanceTestSuite): Promise<PerformanceTestResult> {
    console.log(`🚀 Starting performance test suite: ${suite.name}`);
    const startTime = Date.now();

    try {
      const testResults: TestExecutionResult[] = [];

      // Execute tests
      if (suite.config.parallel) {
        const promises = suite.tests
          .filter(test => test.enabled)
          .map(test => this.executeTest(test, suite.config));
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            testResults.push(result.value);
          } else {
            testResults.push({
              testName: suite.tests[index].name,
              type: suite.tests[index].type,
              status: 'failed',
              duration: 0,
              error: result.reason?.message || 'Unknown error',
              metrics: { responseTime: 0, throughput: 0, errorRate: 100, concurrency: 0 },
            });
          }
        });
      } else {
        // Sequential execution
        for (const test of suite.tests.filter(t => t.enabled)) {
          try {
            const result = await this.executeTest(test, suite.config);
            testResults.push(result);
          } catch (error) {
            testResults.push({
              testName: test.name,
              type: test.type,
              status: 'failed',
              duration: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
              metrics: { responseTime: 0, throughput: 0, errorRate: 100, concurrency: 0 },
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      
      // Analyze results
      const summary = this.createSummary(testResults);
      const overallStatus = this.determineOverallStatus(testResults, summary);

      // Regression analysis
      let regressionAnalysis: RegressionResult | undefined;
      try {
        const metrics = this.extractMetricsForRegression(testResults, suite.name);
        regressionAnalysis = await regressionDetector.detectRegressions(metrics);
      } catch (error) {
        console.warn('Regression analysis failed:', error);
      }

      // Benchmark comparison
      let benchmarkComparison: ComparisonResult | undefined;
      try {
        const metrics = this.extractMetricsForBenchmark(testResults);
        benchmarkComparison = await benchmarkComparator.compareWithBenchmarks(metrics);
      } catch (error) {
        console.warn('Benchmark comparison failed:', error);
      }

      // Generate reports
      const reports = await this.generateReports(
        suite,
        testResults,
        summary,
        regressionAnalysis,
        benchmarkComparison
      );

      const result: PerformanceTestResult = {
        timestamp: new Date().toISOString(),
        suiteName: suite.name,
        environment: suite.config.environment,
        overallStatus,
        duration,
        testResults,
        regressionAnalysis,
        benchmarkComparison,
        summary,
        reports,
      };

      console.log(`✅ Performance test suite completed - Status: ${overallStatus}`);
      return result;
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }

  private async executeTest(test: PerformanceTest, config: PerformanceTestConfig): Promise<TestExecutionResult> {
    console.log(`🧪 Executing ${test.type} test: ${test.name}`);
    const startTime = Date.now();

    try {
      let loadTestResult: LoadTestResult;

      switch (test.type) {
        case 'load':
          loadTestResult = await loadTester.runLoadTest(test.config);
          break;
        case 'stress':
          loadTestResult = await loadTester.runStressTest(test.config);
          break;
        case 'spike':
          loadTestResult = await loadTester.runSpikeTest(test.config);
          break;
        case 'endurance':
          // Endurance test - extended duration
          const enduranceConfig = {
            ...test.config,
            phases: [{ duration: 1800, arrivalRate: 10, name: 'endurance' }], // 30 minutes
          };
          loadTestResult = await loadTester.runLoadTest(enduranceConfig);
          break;
        case 'volume':
          // Volume test - high data volume
          const volumeConfig = {
            ...test.config,
            phases: [{ duration: 300, arrivalRate: 50, name: 'volume' }], // 5 minutes high volume
          };
          loadTestResult = await loadTester.runLoadTest(volumeConfig);
          break;
        default:
          throw new Error(`Unknown test type: ${test.type}`);
      }

      const duration = Date.now() - startTime;
      const status = loadTestResult.summary.passed ? 'passed' : 'failed';

      return {
        testName: test.name,
        type: test.type,
        status,
        duration,
        loadTestResult,
        metrics: {
          responseTime: loadTestResult.averageResponseTime,
          throughput: loadTestResult.requestsPerSecond,
          errorRate: loadTestResult.errorRate,
          concurrency: test.config.phases[0]?.arrivalRate || 0,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        testName: test.name,
        type: test.type,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { responseTime: 0, throughput: 0, errorRate: 100, concurrency: 0 },
      };
    }
  }

  private createSummary(testResults: TestExecutionResult[]): PerformanceTestSummary {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const skippedTests = testResults.filter(r => r.status === 'skipped').length;

    const validResults = testResults.filter(r => r.status === 'passed');
    
    const averageResponseTime = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / validResults.length
      : 0;

    const totalThroughput = validResults.reduce((sum, r) => sum + r.metrics.throughput, 0);
    
    const overallErrorRate = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.metrics.errorRate, 0) / validResults.length
      : 100;

    // Calculate performance score (0-100)
    let performanceScore = 0;
    if (validResults.length > 0) {
      const responseTimeScore = Math.max(0, 100 - (averageResponseTime / 10)); // 1000ms = 0 points
      const throughputScore = Math.min(100, totalThroughput / 10); // 1000 rps = 100 points
      const errorRateScore = Math.max(0, 100 - (overallErrorRate * 10)); // 10% error = 0 points
      const passRateScore = (passedTests / totalTests) * 100;
      
      performanceScore = (responseTimeScore + throughputScore + errorRateScore + passRateScore) / 4;
    }

    const recommendations = this.generateSummaryRecommendations(
      averageResponseTime,
      totalThroughput,
      overallErrorRate,
      passedTests,
      totalTests
    );

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      averageResponseTime,
      totalThroughput,
      overallErrorRate,
      performanceScore: Math.round(performanceScore),
      recommendations,
    };
  }

  private determineOverallStatus(
    testResults: TestExecutionResult[],
    summary: PerformanceTestSummary
  ): 'passed' | 'failed' | 'warning' {
    if (summary.failedTests > 0) return 'failed';
    if (summary.overallErrorRate > 5 || summary.averageResponseTime > 2000) return 'warning';
    return 'passed';
  }

  private extractMetricsForRegression(
    testResults: TestExecutionResult[],
    suiteName: string
  ): PerformanceMetrics {
    const validResults = testResults.filter(r => r.status === 'passed');
    
    const avgResponseTime = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / validResults.length
      : 0;

    const totalThroughput = validResults.reduce((sum, r) => sum + r.metrics.throughput, 0);
    const avgErrorRate = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.metrics.errorRate, 0) / validResults.length
      : 0;

    return {
      timestamp: new Date().toISOString(),
      testId: suiteName,
      version: process.env.npm_package_version,
      branch: process.env.GITHUB_REF_NAME,
      commit: process.env.GITHUB_SHA,
      metrics: {
        responseTime: { value: avgResponseTime, unit: 'ms' },
        throughput: { value: totalThroughput, unit: 'rps' },
        errorRate: { value: avgErrorRate, unit: '%' },
        cpuUsage: { value: 0, unit: '%' }, // Would be collected from monitoring
        memoryUsage: { value: 0, unit: 'MB' }, // Would be collected from monitoring
        networkLatency: { value: 0, unit: 'ms' }, // Would be collected from monitoring
      },
      userJourneys: testResults.map(r => ({
        name: r.testName,
        duration: r.duration,
        steps: [{ name: r.type, duration: r.duration, success: r.status === 'passed' }],
        success: r.status === 'passed',
      })),
    };
  }

  private extractMetricsForBenchmark(testResults: TestExecutionResult[]): Record<string, number> {
    const validResults = testResults.filter(r => r.status === 'passed');
    
    if (validResults.length === 0) return {};

    const avgResponseTime = validResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / validResults.length;
    const totalThroughput = validResults.reduce((sum, r) => sum + r.metrics.throughput, 0);
    const avgErrorRate = validResults.reduce((sum, r) => sum + r.metrics.errorRate, 0) / validResults.length;

    return {
      'api-response-time': avgResponseTime,
      'api-throughput': totalThroughput,
      'api-error-rate': avgErrorRate,
    };
  }

  private generateSummaryRecommendations(
    avgResponseTime: number,
    totalThroughput: number,
    errorRate: number,
    passedTests: number,
    totalTests: number
  ): string[] {
    const recommendations: string[] = [];

    if (passedTests === totalTests) {
      recommendations.push('✅ All tests passed successfully');
    } else {
      recommendations.push(`⚠️ ${totalTests - passedTests} tests failed - investigate failures`);
    }

    if (avgResponseTime > 2000) {
      recommendations.push('🐌 High response times detected - optimize API performance');
    } else if (avgResponseTime > 1000) {
      recommendations.push('⚠️ Response times above 1s - consider optimization');
    } else {
      recommendations.push('⚡ Good response times - maintain current performance');
    }

    if (totalThroughput < 100) {
      recommendations.push('📈 Low throughput - consider scaling infrastructure');
    } else if (totalThroughput > 1000) {
      recommendations.push('🚀 Excellent throughput - system handles load well');
    }

    if (errorRate > 5) {
      recommendations.push('🚨 High error rate - investigate and fix error sources');
    } else if (errorRate > 1) {
      recommendations.push('⚠️ Some errors detected - monitor error patterns');
    } else {
      recommendations.push('✅ Low error rate - system is stable');
    }

    return recommendations;
  }

  private async generateReports(
    suite: PerformanceTestSuite,
    testResults: TestExecutionResult[],
    summary: PerformanceTestSummary,
    regressionAnalysis?: RegressionResult,
    benchmarkComparison?: ComparisonResult
  ): Promise<{ json: string; html?: string; markdown?: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `performance-report-${suite.name}-${timestamp}`;

    // JSON Report
    const jsonReport = {
      suite: suite.name,
      timestamp: new Date().toISOString(),
      summary,
      testResults,
      regressionAnalysis,
      benchmarkComparison,
    };

    const jsonPath = join(this.reportsDir, `${baseFilename}.json`);
    writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    const reports: { json: string; html?: string; markdown?: string } = {
      json: jsonPath,
    };

    // Markdown Report
    if (suite.config.reportFormat.includes('markdown')) {
      const markdownContent = this.generateMarkdownReport(suite, summary, testResults, regressionAnalysis, benchmarkComparison);
      const markdownPath = join(this.reportsDir, `${baseFilename}.md`);
      writeFileSync(markdownPath, markdownContent);
      reports.markdown = markdownPath;
    }

    // HTML Report (simplified - in real implementation, use a template engine)
    if (suite.config.reportFormat.includes('html')) {
      const htmlContent = this.generateHTMLReport(suite, summary, testResults, regressionAnalysis, benchmarkComparison);
      const htmlPath = join(this.reportsDir, `${baseFilename}.html`);
      writeFileSync(htmlPath, htmlContent);
      reports.html = htmlPath;
    }

    return reports;
  }

  private generateMarkdownReport(
    suite: PerformanceTestSuite,
    summary: PerformanceTestSummary,
    testResults: TestExecutionResult[],
    regressionAnalysis?: RegressionResult,
    benchmarkComparison?: ComparisonResult
  ): string {
    return `# Performance Test Report: ${suite.name}

**Generated:** ${new Date().toISOString()}  
**Environment:** ${suite.config.environment}  
**Target:** ${suite.config.target}

## Summary

- **Performance Score:** ${summary.performanceScore}/100
- **Tests Passed:** ${summary.passedTests}/${summary.totalTests}
- **Average Response Time:** ${summary.averageResponseTime.toFixed(2)}ms
- **Total Throughput:** ${summary.totalThroughput.toFixed(2)} req/s
- **Error Rate:** ${summary.overallErrorRate.toFixed(2)}%

## Test Results

${testResults.map(result => `
### ${result.testName} (${result.type})

- **Status:** ${result.status}
- **Duration:** ${result.duration}ms
- **Response Time:** ${result.metrics.responseTime.toFixed(2)}ms
- **Throughput:** ${result.metrics.throughput.toFixed(2)} req/s
- **Error Rate:** ${result.metrics.errorRate.toFixed(2)}%
${result.error ? `- **Error:** ${result.error}` : ''}
`).join('\n')}

## Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

${regressionAnalysis ? `
## Regression Analysis

- **Has Regression:** ${regressionAnalysis.hasRegression ? 'Yes' : 'No'}
- **Severity:** ${regressionAnalysis.severity}
- **Regressions Found:** ${regressionAnalysis.regressions.length}
- **Improvements Found:** ${regressionAnalysis.improvements.length}

### Regression Recommendations
${regressionAnalysis.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

${benchmarkComparison ? `
## Benchmark Comparison

- **Overall Ranking:** ${benchmarkComparison.overallRanking.overall}
- **Percentile:** ${benchmarkComparison.overallRanking.percentile}th
- **Category:** ${benchmarkComparison.category}

### Benchmark Recommendations
${benchmarkComparison.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}
`;
  }

  private generateHTMLReport(
    suite: PerformanceTestSuite,
    summary: PerformanceTestSummary,
    testResults: TestExecutionResult[],
    regressionAnalysis?: RegressionResult,
    benchmarkComparison?: ComparisonResult
  ): string {
    // Simplified HTML report - in real implementation, use a proper template
    return `<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report: ${suite.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .warning { border-left: 5px solid #ff9800; }
    </style>
</head>
<body>
    <h1>Performance Test Report: ${suite.name}</h1>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Performance Score:</strong> ${summary.performanceScore}/100</p>
        <p><strong>Tests Passed:</strong> ${summary.passedTests}/${summary.totalTests}</p>
        <p><strong>Average Response Time:</strong> ${summary.averageResponseTime.toFixed(2)}ms</p>
        <p><strong>Total Throughput:</strong> ${summary.totalThroughput.toFixed(2)} req/s</p>
        <p><strong>Error Rate:</strong> ${summary.overallErrorRate.toFixed(2)}%</p>
    </div>
    
    <h2>Test Results</h2>
    ${testResults.map(result => `
        <div class="test-result ${result.status}">
            <h3>${result.testName} (${result.type})</h3>
            <p><strong>Status:</strong> ${result.status}</p>
            <p><strong>Response Time:</strong> ${result.metrics.responseTime.toFixed(2)}ms</p>
            <p><strong>Throughput:</strong> ${result.metrics.throughput.toFixed(2)} req/s</p>
            <p><strong>Error Rate:</strong> ${result.metrics.errorRate.toFixed(2)}%</p>
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
        </div>
    `).join('')}
    
    <h2>Recommendations</h2>
    <ul>
        ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>`;
  }

  // Predefined test suites
  static getStandardWebAppSuite(target: string): PerformanceTestSuite {
    return {
      name: 'Standard Web Application',
      description: 'Comprehensive performance testing for web applications',
      config: {
        target,
        environment: 'staging',
        parallel: false,
        timeout: 300000, // 5 minutes
        retries: 1,
        reportFormat: ['json', 'markdown'],
      },
      tests: [
        {
          name: 'Load Test - Normal Traffic',
          type: 'load',
          enabled: true,
          config: {
            target,
            phases: [
              { duration: 60, arrivalRate: 5, name: 'ramp-up' },
              { duration: 120, arrivalRate: 10, name: 'steady' },
              { duration: 60, arrivalRate: 5, name: 'ramp-down' },
            ],
            scenarios: [loadTester.getVisibilityCheckScenario(), loadTester.getDashboardScenario()],
          },
        },
        {
          name: 'Stress Test - High Load',
          type: 'stress',
          enabled: true,
          config: {
            target,
            phases: [
              { duration: 60, arrivalRate: 10, name: 'ramp-up' },
              { duration: 120, arrivalRate: 50, name: 'stress' },
              { duration: 60, arrivalRate: 10, name: 'ramp-down' },
            ],
            scenarios: [loadTester.getVisibilityCheckScenario()],
          },
        },
        {
          name: 'Spike Test - Traffic Spikes',
          type: 'spike',
          enabled: true,
          config: {
            target,
            phases: [
              { duration: 30, arrivalRate: 5, name: 'baseline' },
              { duration: 10, arrivalRate: 100, name: 'spike' },
              { duration: 30, arrivalRate: 5, name: 'recovery' },
            ],
            scenarios: [loadTester.getAPIScenario()],
          },
        },
      ],
    };
  }
}

export const performanceOrchestrator = new PerformanceTestOrchestrator();