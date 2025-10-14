#!/usr/bin/env npx tsx

/**
 * Simple test of Kiro System Purity Validator
 */

import { KiroSystemPurityValidator } from '../src/lib/architecture-scanner/kiro-system-purity-validator';

async function main() {
  console.log('🔍 Testing Kiro System Purity Validator...');
  
  try {
    const validator = new KiroSystemPurityValidator();
    console.log('✅ Validator created successfully');
    
    // Test individual methods first
    console.log('🧪 Testing API validation...');
    const apiResult = await (validator as any).validateAPIs();
    console.log('✅ API validation completed:', {
      totalAPIs: apiResult.totalAPIs,
      kiroAPIs: apiResult.kiroAPIs,
      purityScore: apiResult.purityScore
    });
    
    console.log('🧪 Testing test framework validation...');
    const testResult = await (validator as any).validateTestFrameworks();
    console.log('✅ Test framework validation completed:', {
      isKiroConfigured: testResult.isKiroConfigured,
      purityScore: testResult.purityScore
    });
    
    console.log('🧪 Testing full system validation...');
    const result = await validator.validateSystemPurity();
    console.log('✅ Full validation completed:', {
      isPure: result.isPure,
      score: result.score,
      violationsCount: result.violations.length
    });
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
declare global {
  interface ImportMeta { main?: boolean }
}

if ((import.meta as any).main) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}