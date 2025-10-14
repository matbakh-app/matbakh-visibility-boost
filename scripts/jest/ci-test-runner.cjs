#!/usr/bin/env node

/**
 * Enhanced CI Test Runner for Jest Test Infrastructure
 * Provides optimized test execution with coverage, fail-fast, and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CITestRunner {
    constructor() {
        this.isCI = process.env.CI === 'true';
        this.coverage = process.argv.includes('--coverage');
        this.failFast = process.argv.includes('--fail-fast');
        this.verbose = process.argv.includes('--verbose');
        this.testPattern = this.getTestPattern();
    }

    getTestPattern() {
        const patternArg = process.argv.find(arg => arg.startsWith('--testPathPattern='));
        return patternArg ? patternArg.split('=')[1] : null;
    }

    buildJestCommand() {
        const baseCmd = 'npx jest';
        const options = [];

        // CI-specific options
        if (this.isCI) {
            options.push('--ci');
            options.push('--maxWorkers=2');
            options.push('--reporters=default');
            options.push('--reporters=jest-junit');
        } else {
            options.push('--runInBand');
        }

        // Coverage options
        if (this.coverage) {
            options.push('--coverage');
            options.push('--watchAll=false');
        }

        // Fail-fast option
        if (this.failFast) {
            options.push('--bail=1');
        }

        // Test pattern
        if (this.testPattern) {
            options.push(`--testPathPattern="${this.testPattern}"`);
        }

        // Verbose output
        if (this.verbose) {
            options.push('--verbose');
        }

        // Always include fail-on-pending reporter
        options.push('--reporters=./scripts/jest/fail-on-pending-reporter.cjs');

        return `${baseCmd} ${options.join(' ')}`;
    }

    ensureDirectories() {
        const dirs = ['coverage', 'test-results', '.jest-cache'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    clearCache() {
        try {
            execSync('npx jest --clearCache', { stdio: 'inherit' });
            console.log('✅ Jest cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear Jest cache:', error.message);
        }
    }

    validateMocks() {
        const mockFiles = [
            'src/setupTests.cjs',
            'src/__mocks__/aws-sdk-client-mock.js'
        ];

        const missingMocks = mockFiles.filter(file => !fs.existsSync(file));

        if (missingMocks.length > 0) {
            console.error('❌ Missing required mock files:');
            missingMocks.forEach(file => console.error(`   - ${file}`));
            process.exit(1);
        }

        console.log('✅ All required mock files present');
    }

    run() {
        console.log('🚀 Starting CI Test Runner...');
        console.log(`   CI Mode: ${this.isCI}`);
        console.log(`   Coverage: ${this.coverage}`);
        console.log(`   Fail Fast: ${this.failFast}`);
        console.log(`   Test Pattern: ${this.testPattern || 'all tests'}`);

        // Prepare environment
        this.ensureDirectories();
        this.clearCache();
        this.validateMocks();

        // Build and execute Jest command
        const command = this.buildJestCommand();
        console.log(`\n📋 Executing: ${command}\n`);

        try {
            execSync(command, {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    JEST_WORKER_ID: '1'
                }
            });

            console.log('\n✅ All tests passed successfully!');

            // Generate coverage summary if coverage was collected
            if (this.coverage && fs.existsSync('coverage/lcov-report/index.html')) {
                console.log('📊 Coverage report generated: coverage/lcov-report/index.html');
            }

        } catch (error) {
            console.error('\n❌ Tests failed!');
            console.error('Exit code:', error.status);
            process.exit(error.status || 1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new CITestRunner();
    runner.run();
}

module.exports = CITestRunner;