/**
 * Targeted Test Executor
 * Implements pre-validated test runner with real-time result analysis
 * Requirements: 2.3, 2.4
 */

import { spawn, ChildProcess } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { TestSelectionEngine, SafeTestSuite, InterfaceMismatch } from './test-selection-engine';

// Types
export interface TestExecutionResult {
  testFile: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  output: string;
  errorOutput: string;
  failureReason?: string;
  failureClassification: FailureClassification;
  timestamp: string;
}

export interface FailureClassification {
  type: 'expected' | 'unexpected' | 'infrastructure' | 'timeout' | 'interface_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'test_logic' | 'environment' | 'dependency' | 'interface' | 'timeout' | 'unknown';
  description: string;
  suggestedAction: string;
  isKnownIssue: boolean;
}

export interface ExecutionPhaseResult {
  phase: 'phase1' | 'phase2' | 'phase3';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: TestExecutionResult[];
  summary: {
    successRate: number;
    expectedFailures: number;
    unexpectedFailures: number;
    infrastructureFailures: number;
  };
}

export interface SafeTestReport {
  executionId: string;
  timestamp: string;
  configuration: {
    coverageMapPath: string;
    testTimeout: number;
    maxConcurrency: number;
    failFast: boolean;
  };
  safeTestSuite: SafeTestSuite;
  phaseResults: ExecutionPhaseResult[];
  overallSummary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    totalDuration: number;
    overallSuccessRate: number;
    confidenceLevel: number;
  };
  failureAnalysis: {
    expectedFailures: TestExecutionResult[];
    unexpectedFailures: TestExecutionResult[];
    infrastructureFailures: TestExecutionResult[];
    interfaceMismatches: TestExecutionResult[];
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface ExecutorOptions {
  testTimeout?: number;
  maxConcurrency?: number;
  failFast?: boolean;
  outputDir?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Targeted Test Executor - Main class
 */
export class TargetedTestExecutor {
  private testSelectionEngine: TestSelectionEngine;
  private options: Required<ExecutorOptions>;
  private executionId: string;
  private startTime: number = 0;

  constructor(options: ExecutorOptions = {}) {
    this.testSelectionEngine = new TestSelectionEngine();
    this.options = {
      testTimeout: options.testTimeout || 30000, // 30 seconds per test
      maxConcurrency: options.maxConcurrency || 4,
      failFast: options.failFast || false,
      outputDir: options.outputDir || 'reports',
      verbose: options.verbose || false,
      dryRun: options.dryRun || false
    };
    this.executionId = `test-execution-${Date.now()}`;
  }

  /**
   * Build pre-validated test runner
   */
  async initializeTestRunner(coverageMapPath?: string): Promise<SafeTestSuite> {
    console.log('🚀 Initializing Targeted Test Executor...');
    
    // Load coverage map and create safe test suite
    await this.testSelectionEngine.loadCoverageMap(coverageMapPath);
    await this.testSelectionEngine.createKiroComponentFilter();
    const safeTestSuite = await this.testSelectionEngine.generateSafeTestSuite();
    
    console.log(`✅ Test runner initialized with ${safeTestSuite.summary.safeTests} safe tests`);
    console.log(`📊 Confidence level: ${(safeTestSuite.summary.confidenceLevel * 100).toFixed(1)}%`);
    
    return safeTestSuite;
  }

  /**
   * Execute tests with real-time result analysis
   */
  async executeTestSuite(safeTestSuite: SafeTestSuite): Promise<SafeTestReport> {
    this.startTime = Date.now();
    console.log(`🎯 Starting test execution (ID: ${this.executionId})`);
    
    const phaseResults: ExecutionPhaseResult[] = [];
    
    // Execute Phase 1: High Confidence Tests
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log('\n📋 Phase 1: High Confidence Tests');
      const phase1Result = await this.executePhase('phase1', safeTestSuite.executionPlan.phase1, safeTestSuite.interfaceMismatches);
      phaseResults.push(phase1Result);
      
      if (this.options.failFast && phase1Result.summary.unexpectedFailures > 0) {
        console.log('⚠️ Fail-fast enabled: Stopping execution due to unexpected failures in Phase 1');
        return this.generateSafeTestReport(safeTestSuite, phaseResults);
      }
    }
    
    // Execute Phase 2: Medium Confidence Tests
    if (safeTestSuite.executionPlan.phase2.length > 0) {
      console.log('\n📋 Phase 2: Medium Confidence Tests');
      const phase2Result = await this.executePhase('phase2', safeTestSuite.executionPlan.phase2, safeTestSuite.interfaceMismatches);
      phaseResults.push(phase2Result);
      
      if (this.options.failFast && phase2Result.summary.unexpectedFailures > 0) {
        console.log('⚠️ Fail-fast enabled: Stopping execution due to unexpected failures in Phase 2');
        return this.generateSafeTestReport(safeTestSuite, phaseResults);
      }
    }
    
    // Execute Phase 3: Integration Tests
    if (safeTestSuite.executionPlan.phase3.length > 0) {
      console.log('\n📋 Phase 3: Integration Tests');
      const phase3Result = await this.executePhase('phase3', safeTestSuite.executionPlan.phase3, safeTestSuite.interfaceMismatches);
      phaseResults.push(phase3Result);
    }
    
    return this.generateSafeTestReport(safeTestSuite, phaseResults);
  }

  /**
   * Execute a specific phase of tests
   */
  private async executePhase(
    phase: 'phase1' | 'phase2' | 'phase3',
    testFiles: string[],
    interfaceMismatches: InterfaceMismatch[]
  ): Promise<ExecutionPhaseResult> {
    const phaseStartTime = Date.now();
    const results: TestExecutionResult[] = [];
    
    console.log(`🔄 Executing ${testFiles.length} tests in ${phase}...`);
    
    if (this.options.dryRun) {
      console.log('🔍 Dry run mode: Simulating test execution');
      return this.simulatePhaseExecution(phase, testFiles);
    }
    
    // Execute tests with controlled concurrency
    const batches = this.createTestBatches(testFiles, this.options.maxConcurrency);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Executing batch ${batchIndex + 1}/${batches.length} (${batch.length} tests)`);
      
      const batchPromises = batch.map(testFile => 
        this.executeIndividualTest(testFile, interfaceMismatches)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Real-time progress reporting
      const completed = results.length;
      const total = testFiles.length;
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      console.log(`📊 Progress: ${completed}/${total} (${passed} passed, ${failed} failed)`);
    }
    
    const phaseDuration = Date.now() - phaseStartTime;
    
    return this.analyzePhaseResults(phase, results, phaseDuration);
  }

  /**
   * Execute individual test with timeout and error handling
   */
  private async executeIndividualTest(
    testFile: string,
    interfaceMismatches: InterfaceMismatch[]
  ): Promise<TestExecutionResult> {
    const testStartTime = Date.now();
    const timestamp = new Date().toISOString();
    
    if (this.options.verbose) {
      console.log(`🧪 Running: ${testFile}`);
    }
    
    try {
      const result = await this.runJestTest(testFile);
      const duration = Date.now() - testStartTime;
      
      const failureClassification = result.status === 'failed' 
        ? this.classifyFailure(testFile, result.errorOutput, interfaceMismatches)
        : this.createSuccessClassification();
      
      return {
        testFile,
        status: result.status,
        duration,
        output: result.output,
        errorOutput: result.errorOutput,
        failureReason: result.failureReason,
        failureClassification,
        timestamp
      };
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        testFile,
        status: 'failed',
        duration,
        output: '',
        errorOutput: errorMessage,
        failureReason: 'Test execution error',
        failureClassification: this.classifyFailure(testFile, errorMessage, interfaceMismatches),
        timestamp
      };
    }
  }

  /**
   * Run Jest test using child process
   */
  private async runJestTest(testFile: string): Promise<{
    status: 'passed' | 'failed' | 'timeout';
    output: string;
    errorOutput: string;
    failureReason?: string;
  }> {
    return new Promise((resolve) => {
      const jestProcess = spawn('npm', ['test', '--', testFile, '--verbose'], {
        stdio: 'pipe',
        timeout: this.options.testTimeout
      });
      
      let output = '';
      let errorOutput = '';
      
      jestProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      jestProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      jestProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ status: 'passed', output, errorOutput });
        } else {
          resolve({ 
            status: 'failed', 
            output, 
            errorOutput,
            failureReason: `Jest exited with code ${code}`
          });
        }
      });
      
      jestProcess.on('error', (error) => {
        resolve({
          status: 'failed',
          output,
          errorOutput: error.message,
          failureReason: 'Process execution error'
        });
      });
      
      // Handle timeout
      setTimeout(() => {
        jestProcess.kill('SIGTERM');
        resolve({
          status: 'timeout',
          output,
          errorOutput: 'Test execution timeout',
          failureReason: `Test exceeded ${this.options.testTimeout}ms timeout`
        });
      }, this.options.testTimeout);
    });
  }

  /**
   * Create failure classification system (expected vs unexpected)
   */
  private classifyFailure(
    testFile: string,
    errorOutput: string,
    interfaceMismatches: InterfaceMismatch[]
  ): FailureClassification {
    // Check if this is a known interface mismatch
    const knownMismatch = interfaceMismatches.find(m => m.testFile === testFile);
    if (knownMismatch) {
      return {
        type: 'expected',
        severity: knownMismatch.severity,
        category: 'interface',
        description: `Known interface mismatch: ${knownMismatch.description}`,
        suggestedAction: knownMismatch.suggestedFix,
        isKnownIssue: true
      };
    }
    
    // Analyze error patterns
    const errorLower = errorOutput.toLowerCase();
    
    // Timeout errors
    if (errorLower.includes('timeout') || errorLower.includes('exceeded')) {
      return {
        type: 'infrastructure',
        severity: 'medium',
        category: 'timeout',
        description: 'Test execution timeout',
        suggestedAction: 'Increase timeout or optimize test performance',
        isKnownIssue: false
      };
    }
    
    // Environment/dependency errors
    if (errorLower.includes('cannot find module') || 
        errorLower.includes('module not found') ||
        errorLower.includes('enoent')) {
      return {
        type: 'infrastructure',
        severity: 'high',
        category: 'dependency',
        description: 'Missing dependency or module',
        suggestedAction: 'Install missing dependencies or fix import paths',
        isKnownIssue: false
      };
    }
    
    // Mock/setup errors
    if (errorLower.includes('mock') || 
        errorLower.includes('jest.fn()') ||
        errorLower.includes('mockreturnvalue')) {
      return {
        type: 'expected',
        severity: 'medium',
        category: 'test_logic',
        description: 'Mock configuration or test setup issue',
        suggestedAction: 'Review and fix test mocks and setup',
        isKnownIssue: false
      };
    }
    
    // Assertion errors
    if (errorLower.includes('expected') && errorLower.includes('received')) {
      return {
        type: 'unexpected',
        severity: 'high',
        category: 'test_logic',
        description: 'Test assertion failure - possible implementation change',
        suggestedAction: 'Review test assertions against current implementation',
        isKnownIssue: false
      };
    }
    
    // Default classification for unknown errors
    return {
      type: 'unexpected',
      severity: 'high',
      category: 'unknown',
      description: 'Unknown test failure',
      suggestedAction: 'Manual investigation required',
      isKnownIssue: false
    };
  }

  /**
   * Create success classification
   */
  private createSuccessClassification(): FailureClassification {
    return {
      type: 'expected',
      severity: 'low',
      category: 'test_logic',
      description: 'Test passed successfully',
      suggestedAction: 'No action required',
      isKnownIssue: false
    };
  }

  /**
   * Analyze phase results and generate summary
   */
  private analyzePhaseResults(
    phase: 'phase1' | 'phase2' | 'phase3',
    results: TestExecutionResult[],
    duration: number
  ): ExecutionPhaseResult {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const skippedTests = results.filter(r => r.status === 'skipped').length;
    
    const expectedFailures = results.filter(r => 
      r.status === 'failed' && r.failureClassification.type === 'expected'
    ).length;
    
    const unexpectedFailures = results.filter(r => 
      r.status === 'failed' && r.failureClassification.type === 'unexpected'
    ).length;
    
    const infrastructureFailures = results.filter(r => 
      r.status === 'failed' && r.failureClassification.type === 'infrastructure'
    ).length;
    
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    
    console.log(`✅ ${phase} completed: ${passedTests}/${totalTests} passed (${(successRate * 100).toFixed(1)}%)`);
    if (expectedFailures > 0) {
      console.log(`⚠️ Expected failures: ${expectedFailures}`);
    }
    if (unexpectedFailures > 0) {
      console.log(`❌ Unexpected failures: ${unexpectedFailures}`);
    }
    if (infrastructureFailures > 0) {
      console.log(`🔧 Infrastructure failures: ${infrastructureFailures}`);
    }
    
    return {
      phase,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration,
      results,
      summary: {
        successRate,
        expectedFailures,
        unexpectedFailures,
        infrastructureFailures
      }
    };
  }

  /**
   * Generate safe test report with detailed results
   */
  private async generateSafeTestReport(
    safeTestSuite: SafeTestSuite,
    phaseResults: ExecutionPhaseResult[]
  ): Promise<SafeTestReport> {
    const totalDuration = Date.now() - this.startTime;
    
    // Calculate overall summary
    const totalTests = phaseResults.reduce((sum, phase) => sum + phase.totalTests, 0);
    const totalPassed = phaseResults.reduce((sum, phase) => sum + phase.passedTests, 0);
    const totalFailed = phaseResults.reduce((sum, phase) => sum + phase.failedTests, 0);
    const totalSkipped = phaseResults.reduce((sum, phase) => sum + phase.skippedTests, 0);
    const overallSuccessRate = totalTests > 0 ? totalPassed / totalTests : 0;
    
    // Collect all results for failure analysis
    const allResults = phaseResults.flatMap(phase => phase.results);
    
    const failureAnalysis = {
      expectedFailures: allResults.filter(r => 
        r.status === 'failed' && r.failureClassification.type === 'expected'
      ),
      unexpectedFailures: allResults.filter(r => 
        r.status === 'failed' && r.failureClassification.type === 'unexpected'
      ),
      infrastructureFailures: allResults.filter(r => 
        r.status === 'failed' && r.failureClassification.type === 'infrastructure'
      ),
      interfaceMismatches: allResults.filter(r => 
        r.status === 'failed' && r.failureClassification.category === 'interface'
      )
    };
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(failureAnalysis, overallSuccessRate);
    const nextSteps = this.generateNextSteps(failureAnalysis, safeTestSuite);
    
    // Calculate adjusted confidence level
    const adjustedConfidenceLevel = this.calculateAdjustedConfidenceLevel(
      safeTestSuite.summary.confidenceLevel,
      overallSuccessRate,
      failureAnalysis
    );
    
    const report: SafeTestReport = {
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      configuration: {
        coverageMapPath: 'report/source-test-coverage-map.json',
        testTimeout: this.options.testTimeout,
        maxConcurrency: this.options.maxConcurrency,
        failFast: this.options.failFast
      },
      safeTestSuite,
      phaseResults,
      overallSummary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        totalDuration,
        overallSuccessRate,
        confidenceLevel: adjustedConfidenceLevel
      },
      failureAnalysis,
      recommendations,
      nextSteps
    };
    
    // Save report to file
    await this.saveReportToFile(report);
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${(overallSuccessRate * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Expected Failures: ${failureAnalysis.expectedFailures.length}`);
    console.log(`   Unexpected Failures: ${failureAnalysis.unexpectedFailures.length}`);
    console.log(`   Infrastructure Failures: ${failureAnalysis.infrastructureFailures.length}`);
    console.log(`   Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`   Confidence Level: ${(adjustedConfidenceLevel * 100).toFixed(1)}%`);
    
    return report;
  }

  /**
   * Generate recommendations based on failure analysis
   */
  private generateRecommendations(
    failureAnalysis: SafeTestReport['failureAnalysis'],
    successRate: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (failureAnalysis.unexpectedFailures.length > 0) {
      recommendations.push(
        `🔴 CRITICAL: Address ${failureAnalysis.unexpectedFailures.length} unexpected test failures immediately`
      );
    }
    
    if (failureAnalysis.infrastructureFailures.length > 0) {
      recommendations.push(
        `🔧 Fix ${failureAnalysis.infrastructureFailures.length} infrastructure issues (dependencies, timeouts, environment)`
      );
    }
    
    if (failureAnalysis.interfaceMismatches.length > 0) {
      recommendations.push(
        `🔄 Update ${failureAnalysis.interfaceMismatches.length} tests with interface mismatches`
      );
    }
    
    if (successRate < 0.8) {
      recommendations.push(
        `📈 Low success rate (${(successRate * 100).toFixed(1)}%) - review test quality and implementation alignment`
      );
    }
    
    if (failureAnalysis.expectedFailures.length > 0) {
      recommendations.push(
        `✅ ${failureAnalysis.expectedFailures.length} expected failures are documented and can be addressed systematically`
      );
    }
    
    return recommendations;
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    failureAnalysis: SafeTestReport['failureAnalysis'],
    safeTestSuite: SafeTestSuite
  ): string[] {
    const nextSteps: string[] = [];
    
    if (failureAnalysis.unexpectedFailures.length === 0 && failureAnalysis.infrastructureFailures.length === 0) {
      nextSteps.push('✅ All critical issues resolved - proceed with system cleanup');
    } else {
      nextSteps.push('🔧 Fix critical and infrastructure failures before proceeding');
    }
    
    if (safeTestSuite.excluded.length > 0) {
      nextSteps.push(`📝 Review and fix ${safeTestSuite.excluded.length} excluded tests`);
    }
    
    nextSteps.push('📊 Run architecture cleanup Phase 3 with validated test suite');
    nextSteps.push('🔄 Update test coverage map with execution results');
    nextSteps.push('📈 Monitor system stability after cleanup implementation');
    
    return nextSteps;
  }

  /**
   * Calculate adjusted confidence level based on execution results
   */
  private calculateAdjustedConfidenceLevel(
    originalConfidence: number,
    successRate: number,
    failureAnalysis: SafeTestReport['failureAnalysis']
  ): number {
    let adjustedConfidence = originalConfidence;
    
    // Adjust based on success rate
    const successRateAdjustment = (successRate - 0.8) * 0.5; // +/- 0.1 for every 20% above/below 80%
    adjustedConfidence += successRateAdjustment;
    
    // Penalize for unexpected failures
    const unexpectedFailurePenalty = failureAnalysis.unexpectedFailures.length * 0.05;
    adjustedConfidence -= unexpectedFailurePenalty;
    
    // Penalize for infrastructure failures
    const infrastructurePenalty = failureAnalysis.infrastructureFailures.length * 0.03;
    adjustedConfidence -= infrastructurePenalty;
    
    // Ensure confidence stays within bounds
    return Math.max(0.1, Math.min(0.95, adjustedConfidence));
  }

  /**
   * Create test batches for controlled concurrency
   */
  private createTestBatches(testFiles: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < testFiles.length; i += batchSize) {
      batches.push(testFiles.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Simulate phase execution for dry run mode
   */
  private async simulatePhaseExecution(
    phase: 'phase1' | 'phase2' | 'phase3',
    testFiles: string[]
  ): Promise<ExecutionPhaseResult> {
    console.log(`🔍 Simulating ${testFiles.length} tests in ${phase}...`);
    
    const results: TestExecutionResult[] = testFiles.map(testFile => ({
      testFile,
      status: 'passed' as const,
      duration: Math.random() * 5000 + 1000, // 1-6 seconds
      output: 'Simulated test output',
      errorOutput: '',
      failureClassification: this.createSuccessClassification(),
      timestamp: new Date().toISOString()
    }));
    
    return {
      phase,
      totalTests: testFiles.length,
      passedTests: testFiles.length,
      failedTests: 0,
      skippedTests: 0,
      duration: 5000,
      results,
      summary: {
        successRate: 1.0,
        expectedFailures: 0,
        unexpectedFailures: 0,
        infrastructureFailures: 0
      }
    };
  }

  /**
   * Save report to file
   */
  private async saveReportToFile(report: SafeTestReport): Promise<void> {
    try {
      // Ensure output directory exists
      await mkdir(this.options.outputDir, { recursive: true });
      
      // Save detailed JSON report
      const jsonPath = join(this.options.outputDir, `${this.executionId}-detailed-report.json`);
      await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
      
      // Save markdown summary
      const markdownPath = join(this.options.outputDir, `${this.executionId}-summary.md`);
      const markdownReport = this.generateMarkdownReport(report);
      await writeFile(markdownPath, markdownReport, 'utf-8');
      
      console.log(`📄 Reports saved:`);
      console.log(`   📊 Detailed: ${jsonPath}`);
      console.log(`   📝 Summary: ${markdownPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save report:', error);
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: SafeTestReport): string {
    const timestamp = new Date(report.timestamp).toLocaleString();
    
    return `# Safe Test Execution Report

**Execution ID:** ${report.executionId}  
**Generated:** ${timestamp}  
**Duration:** ${(report.overallSummary.totalDuration / 1000).toFixed(1)}s

## Executive Summary

- **Total Tests:** ${report.overallSummary.totalTests}
- **Success Rate:** ${(report.overallSummary.overallSuccessRate * 100).toFixed(1)}%
- **Confidence Level:** ${(report.overallSummary.confidenceLevel * 100).toFixed(1)}%
- **Passed:** ${report.overallSummary.totalPassed}
- **Failed:** ${report.overallSummary.totalFailed}
- **Skipped:** ${report.overallSummary.totalSkipped}

## Phase Results

${report.phaseResults.map(phase => `
### ${phase.phase.toUpperCase()}
- **Tests:** ${phase.totalTests}
- **Passed:** ${phase.passedTests} (${(phase.summary.successRate * 100).toFixed(1)}%)
- **Failed:** ${phase.failedTests}
- **Duration:** ${(phase.duration / 1000).toFixed(1)}s
- **Expected Failures:** ${phase.summary.expectedFailures}
- **Unexpected Failures:** ${phase.summary.unexpectedFailures}
- **Infrastructure Failures:** ${phase.summary.infrastructureFailures}
`).join('\n')}

## Failure Analysis

### Unexpected Failures (${report.failureAnalysis.unexpectedFailures.length})
${report.failureAnalysis.unexpectedFailures.map(failure => `
- **${failure.testFile}**
  - Severity: ${failure.failureClassification.severity}
  - Category: ${failure.failureClassification.category}
  - Description: ${failure.failureClassification.description}
  - Action: ${failure.failureClassification.suggestedAction}
`).join('\n')}

### Infrastructure Failures (${report.failureAnalysis.infrastructureFailures.length})
${report.failureAnalysis.infrastructureFailures.map(failure => `
- **${failure.testFile}**
  - Category: ${failure.failureClassification.category}
  - Description: ${failure.failureClassification.description}
  - Action: ${failure.failureClassification.suggestedAction}
`).join('\n')}

### Interface Mismatches (${report.failureAnalysis.interfaceMismatches.length})
${report.failureAnalysis.interfaceMismatches.map(failure => `
- **${failure.testFile}**
  - Description: ${failure.failureClassification.description}
  - Action: ${failure.failureClassification.suggestedAction}
`).join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

${report.nextSteps.map(step => `- ${step}`).join('\n')}

## Configuration

- **Test Timeout:** ${report.configuration.testTimeout}ms
- **Max Concurrency:** ${report.configuration.maxConcurrency}
- **Fail Fast:** ${report.configuration.failFast}
- **Coverage Map:** ${report.configuration.coverageMapPath}

---
*Generated by Targeted Test Executor v1.0.0*
`;
  }
}

/**
 * Utility function to run targeted test execution
 */
export async function runTargetedTestExecution(
  coverageMapPath?: string,
  options: ExecutorOptions = {}
): Promise<SafeTestReport> {
  const executor = new TargetedTestExecutor(options);
  
  // Initialize test runner with safe test suite
  const safeTestSuite = await executor.initializeTestRunner(coverageMapPath);
  
  // Execute tests with real-time analysis
  const report = await executor.executeTestSuite(safeTestSuite);
  
  return report;
}

export default TargetedTestExecutor;