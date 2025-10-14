#!/usr/bin/env node

/**
 * Coverage Validator for Jest Test Infrastructure
 * Validates coverage thresholds and generates reports
 */

const fs = require('fs');
const path = require('path');

class CoverageValidator {
    constructor() {
        this.coverageFile = 'coverage/coverage-summary.json';
        this.thresholds = {
            global: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70
            },
            critical: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80
            }
        };
    }

    loadCoverageData() {
        if (!fs.existsSync(this.coverageFile)) {
            throw new Error(`Coverage file not found: ${this.coverageFile}`);
        }

        const data = fs.readFileSync(this.coverageFile, 'utf8');
        return JSON.parse(data);
    }

    validateThreshold(actual, threshold, metric) {
        return {
            metric,
            actual: actual.pct,
            threshold,
            passed: actual.pct >= threshold,
            covered: actual.covered,
            total: actual.total,
            skipped: actual.skipped || 0
        };
    }

    validateGlobalCoverage(coverage) {
        const total = coverage.total;
        const results = [];

        Object.entries(this.thresholds.global).forEach(([metric, threshold]) => {
            results.push(this.validateThreshold(total[metric], threshold, metric));
        });

        return results;
    }

    validateCriticalModules(coverage) {
        const criticalPaths = [
            'src/lib/ai-orchestrator',
            'src/lib/performance-monitoring.ts'
        ];

        const results = [];

        Object.entries(coverage).forEach(([filePath, fileData]) => {
            const isCritical = criticalPaths.some(path => filePath.includes(path));

            if (isCritical) {
                Object.entries(this.thresholds.critical).forEach(([metric, threshold]) => {
                    const result = this.validateThreshold(fileData[metric], threshold, metric);
                    result.filePath = filePath;
                    result.isCritical = true;
                    results.push(result);
                });
            }
        });

        return results;
    }

    generateReport(globalResults, criticalResults) {
        console.log('\n📊 Coverage Validation Report');
        console.log('================================\n');

        // Global coverage
        console.log('🌍 Global Coverage:');
        let globalPassed = true;
        globalResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            const percentage = result.actual.toFixed(2);
            console.log(`   ${status} ${result.metric}: ${percentage}% (threshold: ${result.threshold}%)`);
            console.log(`      Covered: ${result.covered}/${result.total} (skipped: ${result.skipped})`);

            if (!result.passed) {
                globalPassed = false;
            }
        });

        // Critical modules
        if (criticalResults.length > 0) {
            console.log('\n🎯 Critical Modules:');
            let criticalPassed = true;

            const groupedResults = {};
            criticalResults.forEach(result => {
                if (!groupedResults[result.filePath]) {
                    groupedResults[result.filePath] = [];
                }
                groupedResults[result.filePath].push(result);
            });

            Object.entries(groupedResults).forEach(([filePath, results]) => {
                console.log(`\n   📁 ${filePath}:`);
                results.forEach(result => {
                    const status = result.passed ? '✅' : '❌';
                    const percentage = result.actual.toFixed(2);
                    console.log(`      ${status} ${result.metric}: ${percentage}% (threshold: ${result.threshold}%)`);

                    if (!result.passed) {
                        criticalPassed = false;
                    }
                });
            });

            if (!criticalPassed) {
                globalPassed = false;
            }
        }

        // Summary
        console.log('\n📋 Summary:');
        if (globalPassed) {
            console.log('✅ All coverage thresholds met!');
            return true;
        } else {
            console.log('❌ Coverage thresholds not met!');
            console.log('\n💡 Tips to improve coverage:');
            console.log('   - Add unit tests for uncovered functions');
            console.log('   - Add integration tests for complex workflows');
            console.log('   - Remove dead code or add exclusions');
            console.log('   - Consider lowering thresholds if appropriate');
            return false;
        }
    }

    validate() {
        try {
            console.log('🔍 Loading coverage data...');
            const coverage = this.loadCoverageData();

            console.log('📊 Validating coverage thresholds...');
            const globalResults = this.validateGlobalCoverage(coverage);
            const criticalResults = this.validateCriticalModules(coverage);

            const passed = this.generateReport(globalResults, criticalResults);

            if (!passed) {
                process.exit(1);
            }

        } catch (error) {
            console.error('❌ Coverage validation failed:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const validator = new CoverageValidator();
    validator.validate();
}

module.exports = CoverageValidator;