#!/usr/bin/env tsx
/**
 * Targeted Test Executor CLI
 * Runs pre-validated tests with real-time analysis and failure classification
 * Requirements: 2.3, 2.4
 */

import { join } from 'path';
import { TargetedTestExecutor, runTargetedTestExecution } from '../src/lib/architecture-scanner/targeted-test-executor';
import type { ExecutorOptions } from '../src/lib/architecture-scanner/targeted-test-executor';

async function main() {
  console.log('🎯 Starting Targeted Test Executor...\n');

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = parseCommandLineArgs(args);
    
    console.log('⚙️ Configuration:');
    console.log(`   Coverage Map: ${options.coverageMapPath}`);
    console.log(`   Output Directory: ${options.executorOptions.outputDir}`);
    console.log(`   Test Timeout: ${options.executorOptions.testTimeout}ms`);
    console.log(`   Max Concurrency: ${options.executorOptions.maxConcurrency}`);
    console.log(`   Fail Fast: ${options.executorOptions.failFast}`);
    console.log(`   Dry Run: ${options.executorOptions.dryRun}`);
    console.log(`   Verbose: ${options.executorOptions.verbose}\n`);

    // Run targeted test execution
    const report = await runTargetedTestExecution(options.coverageMapPath, options.executorOptions);

    // Display execution summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🆔 Execution ID: ${report.executionId}`);
    console.log(`⏱️  Total Duration: ${(report.overallSummary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`📈 Success Rate: ${(report.overallSummary.overallSuccessRate * 100).toFixed(1)}%`);
    console.log(`🎯 Confidence Level: ${(report.overallSummary.confidenceLevel * 100).toFixed(1)}%`);
    
    console.log('\n📋 Test Results:');
    console.log(`   ✅ Passed: ${report.overallSummary.totalPassed}`);
    console.log(`   ❌ Failed: ${report.overallSummary.totalFailed}`);
    console.log(`   ⏭️  Skipped: ${report.overallSummary.totalSkipped}`);
    console.log(`   📊 Total: ${report.overallSummary.totalTests}`);

    // Phase breakdown
    console.log('\n🚀 Phase Breakdown:');
    report.phaseResults.forEach(phase => {
      const phaseLabel = phase.phase.toUpperCase();
      const successRate = (phase.summary.successRate * 100).toFixed(1);
      const duration = (phase.duration / 1000).toFixed(1);
      
      console.log(`   ${phaseLabel}: ${phase.passedTests}/${phase.totalTests} passed (${successRate}%) in ${duration}s`);
      
      if (phase.summary.expectedFailures > 0) {
        console.log(`     ⚠️  Expected failures: ${phase.summary.expectedFailures}`);
      }
      if (phase.summary.unexpectedFailures > 0) {
        console.log(`     🔴 Unexpected failures: ${phase.summary.unexpectedFailures}`);
      }
      if (phase.summary.infrastructureFailures > 0) {
        console.log(`     🔧 Infrastructure failures: ${phase.summary.infrastructureFailures}`);
      }
    });

    // Failure analysis
    if (report.overallSummary.totalFailed > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🔍 FAILURE ANALYSIS');
      console.log('='.repeat(60));
      
      if (report.failureAnalysis.unexpectedFailures.length > 0) {
        console.log(`\n🔴 Unexpected Failures (${report.failureAnalysis.unexpectedFailures.length}):`);
        report.failureAnalysis.unexpectedFailures.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.testFile}`);
          console.log(`      Severity: ${failure.failureClassification.severity}`);
          console.log(`      Category: ${failure.failureClassification.category}`);
          console.log(`      Description: ${failure.failureClassification.description}`);
          console.log(`      Action: ${failure.failureClassification.suggestedAction}`);
          if (failure.failureReason) {
            console.log(`      Reason: ${failure.failureReason}`);
          }
        });
      }
      
      if (report.failureAnalysis.infrastructureFailures.length > 0) {
        console.log(`\n🔧 Infrastructure Failures (${report.failureAnalysis.infrastructureFailures.length}):`);
        report.failureAnalysis.infrastructureFailures.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.testFile}`);
          console.log(`      Category: ${failure.failureClassification.category}`);
          console.log(`      Description: ${failure.failureClassification.description}`);
          console.log(`      Action: ${failure.failureClassification.suggestedAction}`);
        });
      }
      
      if (report.failureAnalysis.interfaceMismatches.length > 0) {
        console.log(`\n🔄 Interface Mismatches (${report.failureAnalysis.interfaceMismatches.length}):`);
        report.failureAnalysis.interfaceMismatches.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.testFile}`);
          console.log(`      Description: ${failure.failureClassification.description}`);
          console.log(`      Action: ${failure.failureClassification.suggestedAction}`);
        });
      }
      
      if (report.failureAnalysis.expectedFailures.length > 0) {
        console.log(`\n⚠️  Expected Failures (${report.failureAnalysis.expectedFailures.length}):`);
        report.failureAnalysis.expectedFailures.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.testFile}`);
          console.log(`      Description: ${failure.failureClassification.description}`);
          console.log(`      Known Issue: ${failure.failureClassification.isKnownIssue ? 'Yes' : 'No'}`);
        });
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('💡 RECOMMENDATIONS');
      console.log('='.repeat(60));
      
      report.recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      });
    }

    // Next steps
    if (report.nextSteps.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 NEXT STEPS');
      console.log('='.repeat(60));
      
      report.nextSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    }

    // Generated files
    console.log('\n' + '='.repeat(60));
    console.log('📄 GENERATED FILES');
    console.log('='.repeat(60));
    
    const outputDir = options.executorOptions.outputDir || 'reports';
    console.log(`📊 Detailed Report: ${join(outputDir, `${report.executionId}-detailed-report.json`)}`);
    console.log(`📝 Summary Report: ${join(outputDir, `${report.executionId}-summary.md`)}`);

    // Exit with appropriate code
    const hasUnexpectedFailures = report.failureAnalysis.unexpectedFailures.length > 0;
    const hasInfrastructureFailures = report.failureAnalysis.infrastructureFailures.length > 0;
    
    if (hasUnexpectedFailures || hasInfrastructureFailures) {
      console.log('\n❌ Test execution completed with critical failures');
      process.exit(1);
    } else if (report.overallSummary.totalFailed > 0) {
      console.log('\n⚠️  Test execution completed with expected failures only');
      process.exit(0);
    } else {
      console.log('\n✅ Test execution completed successfully');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Targeted Test Executor failed:', error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(args: string[]): {
  coverageMapPath?: string;
  executorOptions: ExecutorOptions;
} {
  const options: ExecutorOptions = {
    testTimeout: 30000,
    maxConcurrency: 4,
    failFast: false,
    outputDir: 'reports',
    verbose: false,
    dryRun: false
  };
  
  let coverageMapPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--coverage-map':
        coverageMapPath = args[++i];
        break;
      case '--timeout':
        options.testTimeout = parseInt(args[++i], 10);
        break;
      case '--concurrency':
        options.maxConcurrency = parseInt(args[++i], 10);
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`⚠️  Unknown option: ${arg}`);
        }
        break;
    }
  }

  return { coverageMapPath, executorOptions: options };
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🎯 Targeted Test Executor CLI

USAGE:
  npm run test-executor [OPTIONS]

OPTIONS:
  --coverage-map <path>     Path to test coverage map JSON file
                           (default: report/source-test-coverage-map.json)
  
  --timeout <ms>           Test timeout in milliseconds (default: 30000)
  
  --concurrency <num>      Maximum concurrent test executions (default: 4)
  
  --output-dir <path>      Output directory for reports (default: reports)
  
  --fail-fast             Stop execution on first unexpected failure
  
  --verbose               Enable verbose logging
  
  --dry-run               Simulate test execution without running actual tests
  
  --help, -h              Show this help message

EXAMPLES:
  # Run with default settings
  npm run test-executor

  # Run with custom coverage map and output directory
  npm run test-executor -- --coverage-map custom-coverage.json --output-dir test-results

  # Run in fail-fast mode with verbose output
  npm run test-executor -- --fail-fast --verbose

  # Dry run to see what would be executed
  npm run test-executor -- --dry-run

  # Run with custom timeout and concurrency
  npm run test-executor -- --timeout 60000 --concurrency 8

PHASES:
  Phase 1: High confidence tests (excellent status, Kiro components)
  Phase 2: Medium confidence tests (good status, interface match)
  Phase 3: Integration tests (validated integration scenarios)

FAILURE CLASSIFICATION:
  Expected:       Known interface mismatches, documented issues
  Unexpected:     New failures, assertion mismatches
  Infrastructure: Timeouts, missing dependencies, environment issues

EXIT CODES:
  0: Success or expected failures only
  1: Unexpected or infrastructure failures detected
`);
}

/**
 * Demonstration functions for specific scenarios
 */
async function demonstrateFailureClassification() {
  console.log('\n🔍 Demonstrating Failure Classification...');
  
  const executor = new TargetedTestExecutor({ verbose: true });
  
  try {
    const safeTestSuite = await executor.initializeTestRunner();
    console.log(`Loaded ${safeTestSuite.summary.safeTests} safe tests for classification demo`);
    
    // This would normally run actual tests, but in demo mode we can show the classification logic
    console.log('\nFailure Classification Categories:');
    console.log('  🔴 Unexpected: New test failures, assertion mismatches');
    console.log('  🔧 Infrastructure: Timeouts, missing dependencies, environment issues');
    console.log('  🔄 Interface Mismatch: Known API interface changes');
    console.log('  ⚠️  Expected: Documented failures, known issues');
    
  } catch (error) {
    console.error('Failed to demonstrate failure classification:', error);
  }
}

async function demonstrateRealTimeAnalysis() {
  console.log('\n📊 Demonstrating Real-time Analysis...');
  
  const executor = new TargetedTestExecutor({ 
    verbose: true,
    maxConcurrency: 2,
    dryRun: true // Use dry run for demo
  });
  
  try {
    const safeTestSuite = await executor.initializeTestRunner();
    console.log('Running real-time analysis demo...');
    
    const report = await executor.executeTestSuite(safeTestSuite);
    
    console.log('\nReal-time Analysis Features:');
    console.log(`  📊 Live progress tracking: ${report.overallSummary.totalTests} tests processed`);
    console.log(`  🎯 Success rate monitoring: ${(report.overallSummary.overallSuccessRate * 100).toFixed(1)}%`);
    console.log(`  🔍 Immediate failure classification: ${report.failureAnalysis.unexpectedFailures.length} unexpected`);
    console.log(`  📈 Confidence level adjustment: ${(report.overallSummary.confidenceLevel * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Failed to demonstrate real-time analysis:', error);
  }
}

// Handle command line arguments for demo modes
const args = process.argv.slice(2);

if (args.includes('--demo-classification')) {
  demonstrateFailureClassification().catch(console.error);
} else if (args.includes('--demo-analysis')) {
  demonstrateRealTimeAnalysis().catch(console.error);
} else if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  main().catch(console.error);
}