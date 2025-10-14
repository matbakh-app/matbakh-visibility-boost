#!/usr/bin/env tsx
/**
 * Test Selection Engine Demo
 * Demonstrates the functionality of the Test Selection Engine
 */

import { TestSelectionEngine } from '../src/lib/architecture-scanner/test-selection-engine';

async function demonstrateTestSelectionEngine() {
  console.log('🚀 Test Selection Engine Demo\n');

  try {
    // Initialize the engine
    const engine = new TestSelectionEngine();
    
    console.log('📊 Step 1: Loading test coverage map...');
    await engine.loadCoverageMap('report/source-test-coverage-map.json');
    
    console.log('\n🔍 Step 2: Detecting interface mismatches...');
    const mismatches = await engine.detectInterfaceMismatches();
    
    console.log(`Found ${mismatches.length} interface mismatches:`);
    mismatches.forEach((mismatch, index) => {
      console.log(`  ${index + 1}. ${mismatch.sourceFile}`);
      console.log(`     Type: ${mismatch.mismatchType} (${mismatch.severity})`);
      console.log(`     Fix: ${mismatch.suggestedFix}`);
    });
    
    console.log('\n🎯 Step 3: Creating Kiro component filter...');
    const filter = await engine.createKiroComponentFilter();
    
    console.log(`Component Classification:`);
    console.log(`  ✅ Kiro Components: ${filter.kiroComponents.length}`);
    console.log(`  🔄 Legacy Components: ${filter.legacyComponents.length}`);
    console.log(`  ❓ Unknown Components: ${filter.unknownComponents.length}`);
    
    console.log('\n🛡️ Step 4: Generating safe test suite...');
    const safeTestSuite = await engine.generateSafeTestSuite();
    
    console.log(`Test Suite Analysis:`);
    console.log(`  📊 Total Tests: ${safeTestSuite.summary.totalTests}`);
    console.log(`  ✅ Safe Tests: ${safeTestSuite.summary.safeTests}`);
    console.log(`  ❌ Excluded Tests: ${safeTestSuite.summary.excludedTests}`);
    console.log(`  🎯 Confidence Level: ${(safeTestSuite.summary.confidenceLevel * 100).toFixed(1)}%`);
    
    console.log('\n📋 Execution Plan:');
    console.log(`  Phase 1 (High Confidence): ${safeTestSuite.executionPlan.phase1.length} tests`);
    console.log(`  Phase 2 (Medium Confidence): ${safeTestSuite.executionPlan.phase2.length} tests`);
    console.log(`  Phase 3 (Integration): ${safeTestSuite.executionPlan.phase3.length} tests`);
    console.log(`  Skip List: ${safeTestSuite.executionPlan.skipList.length} tests`);
    
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log('\n🚀 Phase 1 Tests (High Confidence):');
      safeTestSuite.executionPlan.phase1.forEach(test => {
        console.log(`  ✅ ${test}`);
      });
    }
    
    if (safeTestSuite.executionPlan.skipList.length > 0) {
      console.log('\n⚠️ Tests to Skip:');
      safeTestSuite.executionPlan.skipList.forEach(test => {
        console.log(`  ❌ ${test}`);
      });
    }
    
    console.log('\n📄 Step 5: Generating test report...');
    const report = await engine.generateSafeTestReport(safeTestSuite);
    
    console.log('Report generated successfully!');
    console.log(`Report length: ${report.length} characters`);
    
    console.log('\n💡 Recommendations:');
    const criticalMismatches = mismatches.filter(m => m.severity === 'critical');
    const highMismatches = mismatches.filter(m => m.severity === 'high');
    
    if (criticalMismatches.length > 0) {
      console.log(`  🔴 Fix ${criticalMismatches.length} critical interface mismatches immediately`);
      criticalMismatches.forEach(mismatch => {
        console.log(`     - ${mismatch.sourceFile}: ${mismatch.suggestedFix}`);
      });
    }
    
    if (highMismatches.length > 0) {
      console.log(`  🟠 Address ${highMismatches.length} high-priority interface mismatches`);
    }
    
    if (safeTestSuite.summary.confidenceLevel < 0.7) {
      console.log('  🟡 Low confidence level - review excluded tests and fix interface mismatches');
    }
    
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log('  ✅ Start with Phase 1 tests for immediate validation');
    }
    
    console.log('\n🔧 Test Execution Commands:');
    if (safeTestSuite.executionPlan.phase1.length > 0) {
      console.log('Phase 1 (High Confidence):');
      console.log(`npm test -- ${safeTestSuite.executionPlan.phase1.join(' ')}`);
    }
    
    if (safeTestSuite.executionPlan.phase2.length > 0) {
      console.log('\nPhase 2 (Medium Confidence):');
      console.log(`npm test -- ${safeTestSuite.executionPlan.phase2.join(' ')}`);
    }
    
    if (safeTestSuite.validated.length > 0) {
      console.log('\nAll Safe Tests:');
      console.log(`npm test -- ${safeTestSuite.validated.join(' ')}`);
    }
    
    console.log('\n✅ Test Selection Engine demo completed successfully!');
    
    return {
      engine,
      mismatches,
      filter,
      safeTestSuite,
      report
    };
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  demonstrateTestSelectionEngine()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateTestSelectionEngine };