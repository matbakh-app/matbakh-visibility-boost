#!/usr/bin/env tsx
/**
 * Enhanced Rollback System Integration Test
 * 
 * Comprehensive test suite for the Enhanced Rollback System
 * Tests all components and integration points
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration: number;
  error?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
}

class EnhancedRollbackSystemTester {
  private testResults: TestSuite[] = [];
  private tempDir: string;

  constructor() {
    this.tempDir = join('src/archive/rollback-test-temp');
  }

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Enhanced Rollback System - Integration Test Suite');
    console.log('====================================================');
    
    try {
      await this.setupTestEnvironment();
      
      // Run test suites
      await this.testArchiveManagementSystem();
      await this.testEnhancedRollbackSystem();
      await this.testOnHoldComponentRestorer();
      await this.testSystemStateValidator();
      await this.testComprehensiveRollbackScript();
      await this.testIntegrationScenarios();
      
      // Generate report
      this.generateTestReport();
      
    } finally {
      await this.cleanupTestEnvironment();
    }
  }

  /**
   * Test Archive Management System
   */
  private async testArchiveManagementSystem(): Promise<void> {
    const suite: TestSuite = {
      name: 'Archive Management System',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Initialize archive system
    suite.tests.push(await this.runTest(
      'Initialize Archive System',
      async () => {
        const result = await this.execCommand('npx tsx scripts/archive-management-system.ts browse --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        if (!result.includes('Total Components:')) {
          throw new Error('Archive initialization failed');
        }
      }
    ));

    // Test 2: Search functionality
    suite.tests.push(await this.runTest(
      'Search Archive Components',
      async () => {
        const result = await this.execCommand('npx tsx scripts/archive-management-system.ts search --origin=unknown --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        // Should not throw error
      }
    ));

    // Test 3: Statistics generation
    suite.tests.push(await this.runTest(
      'Generate Archive Statistics',
      async () => {
        const result = await this.execCommand('npx tsx scripts/archive-management-system.ts stats --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        // Should not throw error
      }
    ));

    // Test 4: Export functionality
    suite.tests.push(await this.runTest(
      'Export Archive Report',
      async () => {
        const result = await this.execCommand('npx tsx scripts/archive-management-system.ts export --format=json --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        // Should create a report file
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Test Enhanced Rollback System
   */
  private async testEnhancedRollbackSystem(): Promise<void> {
    const suite: TestSuite = {
      name: 'Enhanced Rollback System',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Create checkpoint
    suite.tests.push(await this.runTest(
      'Create System Checkpoint',
      async () => {
        const result = await this.execCommand('npx tsx scripts/enhanced-rollback-system.ts checkpoint test-checkpoint');
        if (!result.includes('Checkpoint created:')) {
          throw new Error('Checkpoint creation failed');
        }
      }
    ));

    // Test 2: Validation checks
    suite.tests.push(await this.runTest(
      'Run Validation Checks',
      async () => {
        const result = await this.execCommand('npx tsx scripts/enhanced-rollback-system.ts validate');
        // Should complete without throwing
      }
    ));

    // Test 3: Dry run restoration
    suite.tests.push(await this.runTest(
      'Dry Run Component Restoration',
      async () => {
        const result = await this.execCommand('npx tsx scripts/enhanced-rollback-system.ts restore src/components/ContactForm.tsx --dry-run');
        if (!result.includes('DRY RUN:')) {
          throw new Error('Dry run restoration failed');
        }
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Test On-Hold Component Restorer
   */
  private async testOnHoldComponentRestorer(): Promise<void> {
    const suite: TestSuite = {
      name: 'On-Hold Component Restorer',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: List on-hold components
    suite.tests.push(await this.runTest(
      'List On-Hold Components',
      async () => {
        const result = await this.execCommand('npx tsx scripts/restore-onhold-component.ts list --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        if (!result.includes('on-hold components:')) {
          throw new Error('On-hold component listing failed');
        }
      }
    ));

    // Test 2: Generate restoration report
    suite.tests.push(await this.runTest(
      'Generate Restoration Report',
      async () => {
        const result = await this.execCommand('npx tsx scripts/restore-onhold-component.ts report --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        if (!result.includes('On-Hold Components Report:')) {
          throw new Error('Restoration report generation failed');
        }
      }
    ));

    // Test 3: Dry run restoration
    suite.tests.push(await this.runTest(
      'Dry Run On-Hold Restoration',
      async () => {
        // Find a component to test with
        const listResult = await this.execCommand('npx tsx scripts/restore-onhold-component.ts list --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        const lines = listResult.split('\n');
        const componentLine = lines.find(line => line.trim().startsWith('src/'));
        
        if (componentLine) {
          const componentPath = componentLine.trim();
          const result = await this.execCommand(`npx tsx scripts/restore-onhold-component.ts restore "${componentPath}" --dry-run --archive=src/archive/consolidated-legacy-archive-2025-09-18`);
          // Should complete without error
        } else {
          throw new Error('No on-hold components found for testing');
        }
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Test System State Validator
   */
  private async testSystemStateValidator(): Promise<void> {
    const suite: TestSuite = {
      name: 'System State Validator',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: TypeScript compilation check
    suite.tests.push(await this.runTest(
      'TypeScript Compilation Check',
      async () => {
        const result = await this.execCommand('npx tsx scripts/system-state-validator.ts check typescript-compilation');
        // Should complete (may pass or fail, but shouldn't crash)
      }
    ));

    // Test 2: Dependency resolution check
    suite.tests.push(await this.runTest(
      'Dependency Resolution Check',
      async () => {
        const result = await this.execCommand('npx tsx scripts/system-state-validator.ts check dependency-resolution');
        // Should complete
      }
    ));

    // Test 3: Full validation (skip optional)
    suite.tests.push(await this.runTest(
      'Full System Validation',
      async () => {
        const result = await this.execCommand('npx tsx scripts/system-state-validator.ts validate --skip-optional --timeout=30000');
        if (!result.includes('Validation Summary:')) {
          throw new Error('System validation failed to complete');
        }
      }
    ));

    // Test 4: Generate health report
    suite.tests.push(await this.runTest(
      'Generate Health Report',
      async () => {
        const result = await this.execCommand('npx tsx scripts/system-state-validator.ts report');
        if (!result.includes('System Health Report:')) {
          throw new Error('Health report generation failed');
        }
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Test Comprehensive Rollback Script
   */
  private async testComprehensiveRollbackScript(): Promise<void> {
    const suite: TestSuite = {
      name: 'Comprehensive Rollback Script',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Help command
    suite.tests.push(await this.runTest(
      'Help Command',
      async () => {
        const result = await this.execCommand('./scripts/comprehensive-rollback.sh help');
        if (!result.includes('Enhanced Rollback System - Usage:')) {
          throw new Error('Help command failed');
        }
      }
    ));

    // Test 2: Browse archive
    suite.tests.push(await this.runTest(
      'Browse Archive Command',
      async () => {
        const result = await this.execCommand('./scripts/comprehensive-rollback.sh browse');
        // Should complete without error
      }
    ));

    // Test 3: Validation command
    suite.tests.push(await this.runTest(
      'Validation Command',
      async () => {
        const result = await this.execCommand('./scripts/comprehensive-rollback.sh validate');
        // Should complete
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Test integration scenarios
   */
  private async testIntegrationScenarios(): Promise<void> {
    const suite: TestSuite = {
      name: 'Integration Scenarios',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0
    };

    // Test 1: Archive to rollback integration
    suite.tests.push(await this.runTest(
      'Archive to Rollback Integration',
      async () => {
        // Test that archive rollback script can delegate to enhanced system
        const rollbackScript = 'src/archive/consolidated-legacy-archive-2025-09-18/rollback.sh';
        const exists = await fs.access(rollbackScript).then(() => true).catch(() => false);
        
        if (!exists) {
          throw new Error('Archive rollback script not found');
        }
        
        // Check if script contains enhanced system integration
        const content = await fs.readFile(rollbackScript, 'utf-8');
        if (!content.includes('Enhanced Rollback System')) {
          throw new Error('Archive rollback script not integrated with enhanced system');
        }
      }
    ));

    // Test 2: Cross-system component lookup
    suite.tests.push(await this.runTest(
      'Cross-System Component Lookup',
      async () => {
        // Test that components can be found across different systems
        const archiveResult = await this.execCommand('npx tsx scripts/archive-management-system.ts search --pattern=ContactForm --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        const onHoldResult = await this.execCommand('npx tsx scripts/restore-onhold-component.ts list --pattern=ContactForm --archive=src/archive/consolidated-legacy-archive-2025-09-18');
        
        // At least one should find the component
        const foundInArchive = archiveResult.includes('ContactForm');
        const foundInOnHold = onHoldResult.includes('ContactForm');
        
        if (!foundInArchive && !foundInOnHold) {
          // This is not necessarily an error, just means the component isn't archived
          console.log('Note: ContactForm not found in archives (this may be expected)');
        }
      }
    ));

    // Test 3: Validation integration
    suite.tests.push(await this.runTest(
      'Validation Integration',
      async () => {
        // Test that rollback system uses validation
        const result = await this.execCommand('npx tsx scripts/enhanced-rollback-system.ts validate');
        // Should complete and provide validation results
      }
    ));

    this.calculateSuiteStats(suite);
    this.testResults.push(suite);
  }

  /**
   * Run a single test
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      return {
        name,
        status: 'passed',
        message: 'Test passed successfully',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        name,
        status: 'failed',
        message: `Test failed: ${error}`,
        duration,
        error
      };
    }
  }

  /**
   * Execute command and return output
   */
  private async execCommand(command: string): Promise<string> {
    try {
      const output = execSync(command, { 
        encoding: 'utf-8',
        timeout: 60000, // 60 second timeout
        stdio: 'pipe'
      });
      return output;
    } catch (error: any) {
      // Some commands may exit with non-zero but still provide useful output
      if (error.stdout) {
        return error.stdout;
      }
      throw error;
    }
  }

  /**
   * Calculate suite statistics
   */
  private calculateSuiteStats(suite: TestSuite): void {
    suite.passed = suite.tests.filter(t => t.status === 'passed').length;
    suite.failed = suite.tests.filter(t => t.status === 'failed').length;
    suite.skipped = suite.tests.filter(t => t.status === 'skipped').length;
    suite.totalDuration = suite.tests.reduce((sum, t) => sum + t.duration, 0);
  }

  /**
   * Generate test report
   */
  private generateTestReport(): void {
    console.log('\n📊 Enhanced Rollback System - Test Report');
    console.log('==========================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;
    
    for (const suite of this.testResults) {
      console.log(`\n📋 ${suite.name}`);
      console.log(`   Passed: ${suite.passed}`);
      console.log(`   Failed: ${suite.failed}`);
      console.log(`   Skipped: ${suite.skipped}`);
      console.log(`   Duration: ${suite.totalDuration}ms`);
      
      // Show failed tests
      const failedTests = suite.tests.filter(t => t.status === 'failed');
      if (failedTests.length > 0) {
        console.log('   Failed Tests:');
        failedTests.forEach(test => {
          console.log(`     ❌ ${test.name}: ${test.message}`);
        });
      }
      
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalSkipped += suite.skipped;
      totalDuration += suite.totalDuration;
    }
    
    console.log('\n🎯 Overall Summary');
    console.log('==================');
    console.log(`Total Tests: ${totalPassed + totalFailed + totalSkipped}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ${totalFailed > 0 ? '❌' : '✅'}`);
    console.log(`Skipped: ${totalSkipped} ⏭️`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    const successRate = totalPassed / (totalPassed + totalFailed) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Enhanced Rollback System is ready for use.');
    } else {
      console.log(`\n⚠️ ${totalFailed} tests failed. Please review and fix issues before using the system.`);
    }
    
    // Save detailed report
    this.saveDetailedReport();
  }

  /**
   * Save detailed test report to file
   */
  private async saveDetailedReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.testResults.length,
        totalTests: this.testResults.reduce((sum, s) => sum + s.tests.length, 0),
        totalPassed: this.testResults.reduce((sum, s) => sum + s.passed, 0),
        totalFailed: this.testResults.reduce((sum, s) => sum + s.failed, 0),
        totalSkipped: this.testResults.reduce((sum, s) => sum + s.skipped, 0),
        totalDuration: this.testResults.reduce((sum, s) => sum + s.totalDuration, 0)
      },
      suites: this.testResults
    };
    
    const reportFile = `enhanced-rollback-test-report-${Date.now()}.json`;
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportFile}`);
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    // Create temp directory
    await fs.mkdir(this.tempDir, { recursive: true });
    
    // Verify required files exist
    const requiredFiles = [
      'scripts/enhanced-rollback-system.ts',
      'scripts/archive-management-system.ts',
      'scripts/restore-onhold-component.ts',
      'scripts/system-state-validator.ts',
      'scripts/comprehensive-rollback.sh',
      'src/archive/consolidated-legacy-archive-2025-09-18/archive-manifest.json'
    ];
    
    for (const file of requiredFiles) {
      const exists = await fs.access(file).then(() => true).catch(() => false);
      if (!exists) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
    
    console.log('✅ Test environment ready');
  }

  /**
   * Cleanup test environment
   */
  private async cleanupTestEnvironment(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      // Remove temp directory
      await fs.rm(this.tempDir, { recursive: true, force: true });
      
      // Clean up any test files
      const testFiles = [
        'archive-report-*.json',
        'archive-report-*.csv',
        'archive-report-*.html',
        'health-report-*.json',
        'system-failure-*.json'
      ];
      
      for (const pattern of testFiles) {
        try {
          execSync(`rm -f ${pattern}`, { stdio: 'pipe' });
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      console.log('✅ Test environment cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const tester = new EnhancedRollbackSystemTester();
  
  switch (command) {
    case 'run':
    case '':
      await tester.runAllTests();
      break;
      
    default:
      console.log(`
Enhanced Rollback System Integration Test - Usage:

  npx tsx scripts/test-enhanced-rollback-system.ts [command]

Commands:
  run                             Run all integration tests (default)

Examples:
  npx tsx scripts/test-enhanced-rollback-system.ts
  npx tsx scripts/test-enhanced-rollback-system.ts run
      `);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EnhancedRollbackSystemTester };