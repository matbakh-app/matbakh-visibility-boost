/**
 * Global E2E Test Teardown
 * Part of System Optimization Enhancement - Task 4
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');
  
  try {
    // Generate test summary
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const summaryFile = path.join(testResultsDir, 'test-summary.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      testRun: {
        projects: config.projects.map(p => p.name),
        workers: config.workers,
        retries: config.retries,
      },
      results: {
        e2eReportExists: fs.existsSync(path.join(testResultsDir, 'e2e-report')),
        visualReportExists: fs.existsSync(path.join(testResultsDir, 'visual-report')),
        crossBrowserReportExists: fs.existsSync(path.join(testResultsDir, 'cross-browser-report')),
        lighthouseReportExists: fs.existsSync(path.join(testResultsDir, 'lighthouse')),
      }
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary saved to: ${summaryFile}`);
    
    // Clean up temporary files if needed
    const authFile = path.join(testResultsDir, 'auth-state.json');
    if (fs.existsSync(authFile)) {
      // Keep auth file for debugging, but could be cleaned up in CI
      console.log(`🔐 Auth state file preserved: ${authFile}`);
    }
    
    // Log test artifacts locations
    console.log('📁 Test artifacts available in:');
    console.log(`   - E2E Reports: ${path.join(testResultsDir, 'e2e-report')}`);
    console.log(`   - Visual Reports: ${path.join(testResultsDir, 'visual-report')}`);
    console.log(`   - Cross-browser Reports: ${path.join(testResultsDir, 'cross-browser-report')}`);
    console.log(`   - Lighthouse Reports: ${path.join(testResultsDir, 'lighthouse')}`);
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  }
  
  console.log('✅ Global E2E test teardown completed');
}

export default globalTeardown;