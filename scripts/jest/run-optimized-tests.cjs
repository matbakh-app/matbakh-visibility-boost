#!/usr/bin/env node

/**
 * Optimized Test Runner for Jest Test Infrastructure
 * Combines performance optimization, coverage collection, and CI integration
 */

const { execSync } = require('child_process');
const CITestRunner = require('./ci-test-runner.cjs');
const JestPerformanceOptimizer = require('./performance-optimizer.cjs');
const CoverageValidator = require('./coverage-validator.cjs');

class OptimizedTestRunner {
    constructor() {
        this.args = process.argv.slice(2);
        this.options = this.parseArguments();
    }

    parseArguments() {
        return {
            coverage: this.args.includes('--coverage'),
            failFast: this.args.includes('--fail-fast'),
            optimize: this.args.includes('--optimize'),
            validate: this.args.includes('--validate-coverage'),
            pattern: this.getArgValue('--testPathPattern'),
            suite: this.getArgValue('--suite'),
            verbose: this.args.includes('--verbose')
        };
    }

    getArgValue(argName) {
        const arg = this.args.find(a => a.startsWith(`${argName}=`));
        return arg ? arg.split('=')[1] : null;
    }

    runTestSuite(suiteName) {
        const suites = {
            'core': 'src/lib/ai-orchestrator',
            'performance': 'performance-monitoring',
            'database': 'database',
            'deployment': 'deployment',
            'coverage': 'coverage',
            'integration': 'integration',
            'unit': '__tests__',
            'react': 'components.*test',
            'hooks': 'hooks.*test'
        };

        const pattern = suites[suiteName];
        if (!pattern) {
            console.error(`❌ Unknown test suite: ${suiteName}`);
            console.log('Available suites:', Object.keys(suites).join(', '));
            process.exit(1);
        }

        return pattern;
    }

    buildCommand() {
        let command = 'node scripts/jest/ci-test-runner.cjs';

        if (this.options.coverage) {
            command += ' --coverage';
        }

        if (this.options.failFast) {
            command += ' --fail-fast';
        }

        if (this.options.verbose) {
            command += ' --verbose';
        }

        if (this.options.pattern) {
            command += ` --testPathPattern=${this.options.pattern}`;
        } else if (this.options.suite) {
            const pattern = this.runTestSuite(this.options.suite);
            command += ` --testPathPattern=${pattern}`;
        }

        return command;
    }

    async run() {
        console.log('🚀 Optimized Test Runner');
        console.log('=========================\n');

        try {
            // Step 1: Performance optimization
            if (this.options.optimize) {
                console.log('⚡ Running performance optimization...');
                const optimizer = new JestPerformanceOptimizer();
                optimizer.optimize();
                console.log('');
            }

            // Step 2: Execute tests
            console.log('🧪 Executing tests...');
            const command = this.buildCommand();
            console.log(`Command: ${command}\n`);

            execSync(command, {
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'test'
                }
            });

            // Step 3: Validate coverage if requested
            if (this.options.validate && this.options.coverage) {
                console.log('\n📊 Validating coverage...');
                const validator = new CoverageValidator();
                validator.validate();
            }

            console.log('\n✅ All tests completed successfully!');

        } catch (error) {
            console.error('\n❌ Test execution failed!');
            console.error('Error:', error.message);
            process.exit(error.status || 1);
        }
    }

    showHelp() {
        console.log(`
🚀 Optimized Test Runner

Usage: node scripts/jest/run-optimized-tests.cjs [options]

Options:
  --coverage              Collect test coverage
  --fail-fast            Stop on first test failure
  --optimize             Run performance optimization
  --validate-coverage    Validate coverage thresholds
  --verbose              Verbose output
  --testPathPattern=X    Run tests matching pattern
  --suite=X              Run predefined test suite

Test Suites:
  core                   AI orchestrator core tests
  performance           Performance monitoring tests
  database              Database optimization tests
  deployment            Deployment automation tests
  coverage              Coverage-related tests
  integration           Integration tests
  unit                  Unit tests
  react                 React component tests
  hooks                 React hooks tests

Examples:
  # Run all tests with coverage and optimization
  node scripts/jest/run-optimized-tests.cjs --coverage --optimize --validate-coverage

  # Run core tests with fail-fast
  node scripts/jest/run-optimized-tests.cjs --suite=core --fail-fast

  # Run specific pattern with verbose output
  node scripts/jest/run-optimized-tests.cjs --testPathPattern="performance" --verbose
`);
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new OptimizedTestRunner();

    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        runner.showHelp();
    } else {
        runner.run();
    }
}

module.exports = OptimizedTestRunner;