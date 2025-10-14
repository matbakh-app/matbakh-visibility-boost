#!/usr/bin/env tsx
/**
 * Test Selection Engine CLI
 * Demonstrates the test selection functionality for system architecture cleanup
 */

import { join } from 'path';
import { TestSelectionEngine, runTestSelection } from '../src/lib/architecture-scanner/test-selection-engine';

async function main() {
  console.log('🔍 Starting Test Selection Engine...\n');

  try {
    // Configuration
    const coverageMapPath = 'report/source-test-coverage-map.json';
    const outputDir = 'reports';

    console.log(`📊 Loading test coverage map from: ${coverageMapPath}`);
    console.log(`📁 Output directory: ${outputDir}\n`);

    // Run complete test selection workflow
    const safeTestSuite = await runTestSelection(coverageMapPath, outputDir);

    // Display results
    console.log('\n📋 Test Selection Results:');
    console.log('=' .repeat(50));
    console.log(`📊 Total Tests: ${safeTestSuite.summary.totalTests}`);
    console.log(`✅ Safe Tests: ${safeTestSuite.summary.safeTests}`);
    console.log(`❌ Excluded Tests: ${safeTestSuite.summary.excludedTests}`);
    console.log(`🎯 Confidence Level: ${(safeTestSuite.summary.confidenceLevel * 100).toFixed(1)}%`);

    console.log('\n🚀 Execution Plan:');
    console.log(`Phase 1 (High Confidence): ${safeTestSuite.executionPlan.phase1.length} tests`);
    console.log(`Phase 2 (Medium Confidence): ${safeTestSuite.executionPlan.phase2.length} tests`);
    console.log(`Phase 3 (Integration): ${safeTestSuite.executionPlan.phase3.length} tests`);
    console.log(`Skip List: ${safeTestSuite.executionPlan.skipList.length} tests`);

    if (safeTestSuite.interfaceMismatches.length > 0) {
      console.log('\n⚠️  Interface Mismatches:');
      safeTestSuite.interfaceMismatches.forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.sourceFile}`);
        console.log(`   Type: ${mismatch.mismatchType} (${mismatch.severity})`);
        console.log(`   Fix: ${mismatch.suggestedFix}`);
      });
    }

    console.log('\n📄 Generated Files:');
    console.log(`- ${join(outputDir, 'safe-test-report.md')}`);
    console.log(`- ${join(outputDir, 'safe-test-suite.json')}`);

    // Generate test execution commands
    const engine = new TestSelectionEngine();
    await engine.loadCoverageMap(coverageMapPath);
    
    console.log('\n🔧 Recommended Test Commands:');
    console.log('Phase 1 (High Confidence):');
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log(`npm test -- ${safeTestSuite.executionPlan.phase1.join(' ')}`);
    } else {
      console.log('No high confidence tests available');
    }

    console.log('\nPhase 2 (Medium Confidence):');
    if (safeTestSuite.executionPlan.phase2.length > 0) {
      console.log(`npm test -- ${safeTestSuite.executionPlan.phase2.join(' ')}`);
    } else {
      console.log('No medium confidence tests available');
    }

    console.log('\nAll Safe Tests:');
    if (safeTestSuite.validated.length > 0) {
      console.log(`npm test -- ${safeTestSuite.validated.join(' ')}`);
    } else {
      console.log('No safe tests available');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    const criticalMismatches = safeTestSuite.interfaceMismatches.filter(m => m.severity === 'critical');
    const highMismatches = safeTestSuite.interfaceMismatches.filter(m => m.severity === 'high');
    
    if (criticalMismatches.length > 0) {
      console.log(`🔴 Fix ${criticalMismatches.length} critical interface mismatches immediately`);
    }
    
    if (highMismatches.length > 0) {
      console.log(`🟠 Address ${highMismatches.length} high-priority interface mismatches`);
    }
    
    if (safeTestSuite.summary.confidenceLevel < 0.7) {
      console.log('🟡 Low confidence level - review excluded tests and fix interface mismatches');
    }
    
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log('✅ Start with Phase 1 tests for immediate validation');
    }

    console.log('\n✅ Test Selection Engine completed successfully!');

  } catch (error) {
    console.error('❌ Test Selection Engine failed:', error);
    process.exit(1);
  }
}

// Additional utility functions for demonstration
async function demonstrateInterfaceMismatchDetection() {
  console.log('\n🔍 Demonstrating Interface Mismatch Detection...');
  
  const engine = new TestSelectionEngine();
  
  try {
    await engine.loadCoverageMap();
    const mismatches = await engine.detectInterfaceMismatches();
    
    console.log(`Found ${mismatches.length} interface mismatches:`);
    mismatches.forEach((mismatch, index) => {
      console.log(`\n${index + 1}. ${mismatch.sourceFile}`);
      console.log(`   Test: ${mismatch.testFile}`);
      console.log(`   Type: ${mismatch.mismatchType}`);
      console.log(`   Severity: ${mismatch.severity}`);
      console.log(`   Description: ${mismatch.description}`);
      console.log(`   Suggested Fix: ${mismatch.suggestedFix}`);
    });
  } catch (error) {
    console.error('Failed to demonstrate interface mismatch detection:', error);
  }
}

async function demonstrateKiroComponentFilter() {
  console.log('\n🎯 Demonstrating Kiro Component Filter...');
  
  const engine = new TestSelectionEngine();
  
  try {
    await engine.loadCoverageMap();
    const filter = await engine.createKiroComponentFilter();
    
    console.log(`Kiro Components: ${filter.kiroComponents.length}`);
    filter.kiroComponents.forEach(component => console.log(`  ✅ ${component}`));
    
    console.log(`\nLegacy Components: ${filter.legacyComponents.length}`);
    filter.legacyComponents.forEach(component => console.log(`  🔄 ${component}`));
    
    console.log(`\nUnknown Components: ${filter.unknownComponents.length}`);
    filter.unknownComponents.forEach(component => console.log(`  ❓ ${component}`));
    
  } catch (error) {
    console.error('Failed to demonstrate Kiro component filter:', error);
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Test Selection Engine CLI

Usage:
  npm run test-selection                    # Run complete test selection
  npm run test-selection -- --demo-mismatches  # Demo interface mismatch detection
  npm run test-selection -- --demo-filter      # Demo Kiro component filter
  npm run test-selection -- --help             # Show this help

Options:
  --demo-mismatches    Demonstrate interface mismatch detection
  --demo-filter        Demonstrate Kiro component filtering
  --help, -h          Show this help message

Examples:
  npm run test-selection
  npm run test-selection -- --demo-mismatches
  npm run test-selection -- --demo-filter
`);
  process.exit(0);
}

if (args.includes('--demo-mismatches')) {
  demonstrateInterfaceMismatchDetection().catch(console.error);
} else if (args.includes('--demo-filter')) {
  demonstrateKiroComponentFilter().catch(console.error);
} else {
  main().catch(console.error);
}