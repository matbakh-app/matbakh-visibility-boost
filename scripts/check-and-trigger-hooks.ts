#!/usr/bin/env tsx

/**
 * Check and Trigger Hooks Script
 * Checks which hooks should be triggered and executes them
 */

import { execSync } from 'child_process';

try {
  console.log('🔍 Checking for hooks to trigger...');
  execSync('npx tsx scripts/fix-kiro-hook-system.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Hook trigger failed:', error);
}
