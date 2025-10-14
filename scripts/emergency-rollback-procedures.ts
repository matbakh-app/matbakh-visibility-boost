#!/usr/bin/env tsx
/**
 * Emergency Rollback Procedures
 * Provides rapid recovery from test infrastructure failures
 */
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export class EmergencyRollbackProcedures {
  async executeEmergencyRollback(): Promise<void> {
    console.log('🚨 Executing Emergency Rollback Procedures...');
    
    try {
      // 1. Revert to previous Jest configuration
      await this.revertJestConfiguration();
      
      // 2. Disable quarantine system temporarily
      await this.disableQuarantineSystem();
      
      // 3. Switch to minimal test set
      await this.switchToMinimalTests();
      
      // 4. Clear test caches
      await this.clearTestCaches();
      
      // 5. Validate basic functionality
      await this.validateBasicFunctionality();
      
      console.log('✅ Emergency rollback completed successfully');
    } catch (error) {
      console.error('❌ Emergency rollback failed:', error.message);
      throw error;
    }
  }

  private async revertJestConfiguration(): Promise<void> {
    console.log('   🔄 Reverting Jest configuration...');
    
    const backupConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.cjs'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src/archive/'
  ],
  maxWorkers: '50%',
  testTimeout: 10000
};`;
    
    await fs.writeFile('jest.config.emergency.cjs', backupConfig);
    console.log('     ✅ Emergency Jest configuration created');
  }

  private async disableQuarantineSystem(): Promise<void> {
    console.log('   ⏸️ Disabling quarantine system...');
    
    // Create emergency test runner without quarantine
    const emergencyRunner = `#!/bin/bash
# Emergency Test Runner - No Quarantine
set -e

echo "🚨 Running Emergency Tests (No Quarantine)..."

# Basic compilation check
npx tsc --noEmit --skipLibCheck

# Core system tests only
jest --config=jest.config.emergency.cjs \
  --testPathPattern="(kiro-system-purity-validator|persona-api)\.test\.ts$" \
  --maxWorkers=1 \
  --verbose

echo "✅ Emergency Tests Completed"
`;
    
    await fs.writeFile('scripts/run-emergency-tests.sh', emergencyRunner);
    execSync('chmod +x scripts/run-emergency-tests.sh');
    console.log('     ✅ Emergency test runner created');
  }

  private async switchToMinimalTests(): Promise<void> {
    console.log('   📦 Switching to minimal test set...');
    
    // Create minimal test package.json script
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    packageJson.scripts['test:emergency'] = './scripts/run-emergency-tests.sh';
    
    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('     ✅ Emergency test script added to package.json');
  }

  private async clearTestCaches(): Promise<void> {
    console.log('   🧹 Clearing test caches...');
    
    try {
      execSync('npm run test -- --clearCache', { stdio: 'pipe' });
      execSync('rm -rf node_modules/.cache', { stdio: 'pipe' });
      console.log('     ✅ Test caches cleared');
    } catch (error) {
      console.warn('     ⚠️ Cache clearing had issues, continuing...');
    }
  }

  private async validateBasicFunctionality(): Promise<void> {
    console.log('   ✅ Validating basic functionality...');
    
    try {
      execSync('./scripts/run-emergency-tests.sh', { stdio: 'pipe', timeout: 120000 });
      console.log('     ✅ Basic functionality validated');
    } catch (error) {
      throw new Error(`Basic functionality validation failed: ${error.message}`);
    }
  }
}

// CLI Interface
async function main() {
  const procedures = new EmergencyRollbackProcedures();
  await procedures.executeEmergencyRollback();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
