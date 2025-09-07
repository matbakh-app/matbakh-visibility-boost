/**
 * Comprehensive Test Runner for Bedrock AI Core
 * Orchestrates all test suites and generates consolidated reports
 * Requirements: 8.3, 10.5, 11.4, 11.5
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestSuite {
  name: string;
  file: string;
  category: 'unit' | 'integration' | 'performance' | 'security';
  timeout: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
  warnings?: string[];
}

interface TestReport {
  timestamp: string;
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalDuration: number;
  overallCoverage: number;
  results: TestResult[];
  summary: {
    aiOperations: TestResult;
    personaAccuracy: TestResult;
    templateSecurity: TestResult;
    loadTesting: TestResult;
  };
  recommendations: string[];
}

class TestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'AI Operations Integration',
      file: 'comprehensive-ai-operations.test.ts',
      category: 'integration',
      timeout: 120000, // 2 minutes
      critical: true
    },
    {
      name: 'Persona Detection Accuracy',
      file: 'persona-detection-accuracy.test.ts',
      category: 'unit',
      timeout: 60000, // 1 minute
      critical: true
    },
    {
      name: 'Template Security Validation',
      file: 'prompt-template-security.test.ts',
      category: 'security',
      timeout: 90000, // 1.5 minutes
      critical: true
    },
    {
      name: 'AI Service Load Testing',
      file: 'ai-service-load-testing.test.ts',
      category: 'performance',
      timeout: 300000, // 5 minutes
      critical: false
    },
    // Existing test suites
    {
      name: 'Business Framework Engine',
      file: 'business-framework-engine.test.ts',
      category: 'unit',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Data Collection Framework',
      file: 'data-collection-framework.test.ts',
      category: 'unit',
      timeout: 30000,
      critical: true
    },
    {
      name: 'VC Orchestrator',
      file: 'vc-orchestrator.test.ts',
      category: 'integration',
      timeout: 60000,
      critical: true
    },
    {
      name: 'Logging System',
      file: 'logging-system.test.ts',
      category: 'unit',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Cost Management',
      file: 'cost-management-system.test.ts',
      category: 'unit',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Performance Reliability',
      file: 'performance-reliability.test.ts',
      category: 'performance',
      timeout: 60000,
      critical: false
    }
  ];

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Bedrock AI Core Test Suite');
    console.log(`📊 Running ${this.testSuites.length} test suites\n`);

    const startTime = Date.now();
    const results: TestResult[] = [];

    // Run critical tests first
    const criticalSuites = this.testSuites.filter(suite => suite.critical);
    const nonCriticalSuites = this.testSuites.filter(suite => !suite.critical);

    console.log('🔥 Running Critical Tests First...\n');
    for (const suite of criticalSuites) {
      const result = await this.runTestSuite(suite);
      results.push(result);
      
      if (!result.passed) {
        console.log(`❌ Critical test failed: ${suite.name}`);
        console.log('⚠️  Continuing with remaining tests...\n');
      }
    }

    console.log('⚡ Running Performance and Load Tests...\n');
    for (const suite of nonCriticalSuites) {
      const result = await this.runTestSuite(suite);
      results.push(result);
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Generate comprehensive report
    const report = this.generateReport(results, totalDuration);
    
    // Save report to file
    await this.saveReport(report);
    
    // Print summary
    this.printSummary(report);

    return report;
  }

  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    console.log(`🧪 Running ${suite.name} (${suite.category})...`);
    
    const startTime = Date.now();
    let passed = false;
    let errors: string[] = [];
    let warnings: string[] = [];
    let coverage = 0;

    try {
      // Run Jest with specific test file
      const jestCommand = [
        'npx jest',
        `--testPathPattern=${suite.file}`,
        '--verbose',
        '--coverage',
        '--coverageReporters=json-summary',
        `--testTimeout=${suite.timeout}`,
        '--detectOpenHandles',
        '--forceExit'
      ].join(' ');

      const output = execSync(jestCommand, { 
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '..', '..'),
        timeout: suite.timeout + 10000 // Add buffer
      });

      passed = !output.includes('FAIL') && !output.includes('failed');
      
      // Extract coverage if available
      try {
        const coveragePath = path.resolve(__dirname, '..', '..', 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          coverage = coverageData.total?.statements?.pct || 0;
        }
      } catch (coverageError) {
        warnings.push('Could not extract coverage data');
      }

      // Extract warnings from output
      const warningMatches = output.match(/console\.warn.*$/gm);
      if (warningMatches) {
        warnings.push(...warningMatches);
      }

    } catch (error: any) {
      passed = false;
      errors.push(error.message || 'Unknown test execution error');
      
      // Try to extract specific error details
      if (error.stdout) {
        const errorLines = error.stdout.split('\n').filter((line: string) => 
          line.includes('FAIL') || line.includes('Error:') || line.includes('Expected:')
        );
        errors.push(...errorLines);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(`${passed ? '✅' : '❌'} ${suite.name} - ${duration}ms`);
    if (coverage > 0) {
      console.log(`📊 Coverage: ${coverage.toFixed(1)}%`);
    }
    if (errors.length > 0) {
      console.log(`🚨 Errors: ${errors.length}`);
    }
    if (warnings.length > 0) {
      console.log(`⚠️  Warnings: ${warnings.length}`);
    }
    console.log('');

    return {
      suite: suite.name,
      passed,
      duration,
      coverage: coverage > 0 ? coverage : undefined,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private generateReport(results: TestResult[], totalDuration: number): TestReport {
    const passedSuites = results.filter(r => r.passed).length;
    const failedSuites = results.length - passedSuites;
    
    // Calculate overall coverage
    const coverageResults = results.filter(r => r.coverage !== undefined);
    const overallCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0) / coverageResults.length
      : 0;

    // Extract key test results
    const aiOperations = results.find(r => r.suite.includes('AI Operations')) || { suite: 'AI Operations', passed: false, duration: 0 };
    const personaAccuracy = results.find(r => r.suite.includes('Persona Detection')) || { suite: 'Persona Detection', passed: false, duration: 0 };
    const templateSecurity = results.find(r => r.suite.includes('Template Security')) || { suite: 'Template Security', passed: false, duration: 0 };
    const loadTesting = results.find(r => r.suite.includes('Load Testing')) || { suite: 'Load Testing', passed: false, duration: 0 };

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      timestamp: new Date().toISOString(),
      totalSuites: results.length,
      passedSuites,
      failedSuites,
      totalDuration,
      overallCoverage,
      results,
      summary: {
        aiOperations,
        personaAccuracy,
        templateSecurity,
        loadTesting
      },
      recommendations
    };
  }

  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    // Coverage recommendations
    const lowCoverageTests = results.filter(r => r.coverage && r.coverage < 80);
    if (lowCoverageTests.length > 0) {
      recommendations.push(`Improve test coverage for: ${lowCoverageTests.map(t => t.suite).join(', ')}`);
    }

    // Performance recommendations
    const slowTests = results.filter(r => r.duration > 60000);
    if (slowTests.length > 0) {
      recommendations.push(`Optimize performance for slow tests: ${slowTests.map(t => t.suite).join(', ')}`);
    }

    // Error analysis
    const testsWithErrors = results.filter(r => r.errors && r.errors.length > 0);
    if (testsWithErrors.length > 0) {
      recommendations.push(`Address test failures in: ${testsWithErrors.map(t => t.suite).join(', ')}`);
    }

    // Warning analysis
    const testsWithWarnings = results.filter(r => r.warnings && r.warnings.length > 0);
    if (testsWithWarnings.length > 0) {
      recommendations.push(`Review warnings in: ${testsWithWarnings.map(t => t.suite).join(', ')}`);
    }

    // Critical test failures
    const criticalFailures = results.filter(r => !r.passed && this.testSuites.find(s => s.name === r.suite)?.critical);
    if (criticalFailures.length > 0) {
      recommendations.push(`🚨 CRITICAL: Fix failed critical tests: ${criticalFailures.map(t => t.suite).join(', ')}`);
    }

    // Overall health recommendations
    const passRate = results.filter(r => r.passed).length / results.length;
    if (passRate < 0.9) {
      recommendations.push('Overall test pass rate is below 90% - investigate systematic issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests are performing well! 🎉');
    }

    return recommendations;
  }

  private async saveReport(report: TestReport): Promise<void> {
    const reportDir = path.resolve(__dirname, '..', '..', 'test-reports');
    
    // Ensure report directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `test-report-${Date.now()}.json`);
    const summaryFile = path.join(reportDir, 'latest-test-summary.json');

    // Save detailed report
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Save summary for quick access
    const summary = {
      timestamp: report.timestamp,
      passedSuites: report.passedSuites,
      totalSuites: report.totalSuites,
      overallCoverage: report.overallCoverage,
      totalDuration: report.totalDuration,
      criticalTestsPassed: report.summary.aiOperations.passed && 
                          report.summary.personaAccuracy.passed && 
                          report.summary.templateSecurity.passed,
      recommendations: report.recommendations
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`📄 Test report saved to: ${reportFile}`);
    console.log(`📋 Test summary saved to: ${summaryFile}`);
  }

  private printSummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 BEDROCK AI CORE TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📊 Total Suites: ${report.totalSuites}`);
    console.log(`✅ Passed: ${report.passedSuites}`);
    console.log(`❌ Failed: ${report.failedSuites}`);
    console.log(`⏱️  Total Duration: ${(report.totalDuration / 1000).toFixed(1)}s`);
    console.log(`📈 Overall Coverage: ${report.overallCoverage.toFixed(1)}%`);
    
    console.log('\n🔍 KEY TEST RESULTS:');
    console.log(`AI Operations: ${report.summary.aiOperations.passed ? '✅' : '❌'} (${report.summary.aiOperations.duration}ms)`);
    console.log(`Persona Accuracy: ${report.summary.personaAccuracy.passed ? '✅' : '❌'} (${report.summary.personaAccuracy.duration}ms)`);
    console.log(`Template Security: ${report.summary.templateSecurity.passed ? '✅' : '❌'} (${report.summary.templateSecurity.duration}ms)`);
    console.log(`Load Testing: ${report.summary.loadTesting.passed ? '✅' : '❌'} (${report.summary.loadTesting.duration}ms)`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    const overallStatus = report.failedSuites === 0 ? 'PASS' : 'FAIL';
    const statusEmoji = overallStatus === 'PASS' ? '🎉' : '🚨';
    
    console.log(`\n${statusEmoji} OVERALL STATUS: ${overallStatus}`);
    console.log('='.repeat(60) + '\n');
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.runAllTests()
    .then(report => {
      const exitCode = report.failedSuites > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('🚨 Test runner failed:', error);
      process.exit(1);
    });
}

export { TestRunner, TestReport, TestResult };