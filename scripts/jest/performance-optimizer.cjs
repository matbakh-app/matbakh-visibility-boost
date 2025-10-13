#!/usr/bin/env node

/**
 * Jest Performance Optimizer
 * Optimizes Jest configuration and execution for better performance
 */

const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

class JestPerformanceOptimizer {
    constructor() {
        this.isCI = process.env.CI === 'true';
        this.cpuCount = os.cpus().length;
        this.totalMemory = os.totalmem();
        this.freeMemory = os.freemem();
    }

    analyzeSystem() {
        console.log('🔍 System Analysis:');
        console.log(`   CPU Cores: ${this.cpuCount}`);
        console.log(`   Total Memory: ${Math.round(this.totalMemory / 1024 / 1024 / 1024)}GB`);
        console.log(`   Free Memory: ${Math.round(this.freeMemory / 1024 / 1024 / 1024)}GB`);
        console.log(`   CI Environment: ${this.isCI}`);
    }

    getOptimalWorkerCount() {
        if (this.isCI) {
            // In CI, use fewer workers to avoid memory issues
            return Math.min(2, Math.max(1, Math.floor(this.cpuCount / 2)));
        } else {
            // Locally, use more conservative approach
            return 1; // Single worker for stability
        }
    }

    getOptimalMemoryLimit() {
        const availableMemory = this.freeMemory;
        const memoryPerWorker = Math.floor(availableMemory / this.getOptimalWorkerCount() * 0.7); // 70% of available
        return Math.min(512 * 1024 * 1024, memoryPerWorker); // Cap at 512MB
    }

    generateOptimizedConfig() {
        const workerCount = this.getOptimalWorkerCount();
        const memoryLimit = Math.floor(this.getOptimalMemoryLimit() / 1024 / 1024); // Convert to MB

        return {
            maxWorkers: workerCount,
            workerIdleMemoryLimit: `${memoryLimit}MB`,
            maxConcurrency: this.isCI ? Math.min(10, workerCount * 2) : 5,
            cache: true,
            cacheDirectory: '<rootDir>/.jest-cache',
            bail: this.isCI ? 1 : 0,
            detectOpenHandles: true,
            forceExit: true,
            testTimeout: this.isCI ? 60000 : 30000
        };
    }

    clearCaches() {
        console.log('🧹 Clearing caches...');

        try {
            // Clear Jest cache
            execSync('npx jest --clearCache', { stdio: 'pipe' });
            console.log('   ✅ Jest cache cleared');
        } catch (error) {
            console.log('   ⚠️ Jest cache clear failed');
        }

        // Clear node_modules cache if exists
        const nodeModulesCache = 'node_modules/.cache';
        if (fs.existsSync(nodeModulesCache)) {
            try {
                fs.rmSync(nodeModulesCache, { recursive: true, force: true });
                console.log('   ✅ Node modules cache cleared');
            } catch (error) {
                console.log('   ⚠️ Node modules cache clear failed');
            }
        }
    }

    optimizeEnvironment() {
        console.log('⚡ Optimizing test environment...');

        // Set optimal Node.js flags
        const nodeOptions = [
            '--max-old-space-size=4096', // 4GB heap
            '--max-semi-space-size=128',  // 128MB semi-space
        ];

        process.env.NODE_OPTIONS = nodeOptions.join(' ');
        console.log(`   ✅ Node options set: ${process.env.NODE_OPTIONS}`);

        // Set Jest-specific environment variables
        process.env.JEST_WORKER_ID = '1';
        process.env.NODE_ENV = 'test';

        console.log('   ✅ Environment variables optimized');
    }

    generateReport() {
        const config = this.generateOptimizedConfig();

        console.log('\n📊 Optimization Report:');
        console.log('========================');
        console.log(`   Optimal Workers: ${config.maxWorkers}`);
        console.log(`   Memory Limit: ${config.workerIdleMemoryLimit}`);
        console.log(`   Max Concurrency: ${config.maxConcurrency}`);
        console.log(`   Cache Enabled: ${config.cache}`);
        console.log(`   Fail Fast: ${config.bail > 0}`);
        console.log(`   Test Timeout: ${config.testTimeout}ms`);

        return config;
    }

    optimize() {
        console.log('🚀 Jest Performance Optimizer');
        console.log('==============================\n');

        this.analyzeSystem();
        this.clearCaches();
        this.optimizeEnvironment();

        const config = this.generateReport();

        console.log('\n💡 Recommendations:');
        console.log('   - Run tests with --runInBand for maximum stability');
        console.log('   - Use --coverage only when needed');
        console.log('   - Consider splitting large test suites');
        console.log('   - Monitor memory usage during test execution');

        return config;
    }
}

// Run if called directly
if (require.main === module) {
    const optimizer = new JestPerformanceOptimizer();
    optimizer.optimize();
}

module.exports = JestPerformanceOptimizer;