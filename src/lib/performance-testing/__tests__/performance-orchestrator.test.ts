/**
 * Performance Orchestrator Tests
 * Tests for the performance testing orchestrator
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PerformanceTestOrchestrator } from '../performance-orchestrator';

// Mock the dependencies
jest.mock('../load-tester', () => ({
  loadTester: {
    runLoadTest: jest.fn(),
    runStressTest: jest.fn(),
    runSpikeTest: jest.fn(),
    getVisibilityCheckScenario: jest.fn(() => ({
      name: 'Visibility Check Flow',
      weight: 70,
      flow: [],
    })),
    getDashboardScenario: jest.fn(() => ({
      name: 'Dashboard Access',
      weight: 20,
      flow: [],
    })),
    getAPIScenario: jest.fn(() => ({
      name: 'API Endpoints',
      weight: 10,
      flow: [],
    })),
  },
}));

jest.mock('../regression-detector', () => ({
  regressionDetector: {
    detectRegressions: jest.fn(),
  },
}));

jest.mock('../benchmark-comparator', () => ({
  benchmarkComparator: {
    compareWithBenchmarks: jest.fn(),
  },
}));

describe('PerformanceTestOrchestrator', () => {
  let orchestrator: PerformanceTestOrchestrator;
  const { loadTester } = require('../load-tester');
  const { regressionDetector } = require('../regression-detector');
  const { benchmarkComparator } = require('../benchmark-comparator');

  beforeEach(() => {
    orchestrator = new PerformanceTestOrchestrator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('runPerformanceTestSuite', () => {
    it('should run a complete test suite successfully', async () => {
      // Mock successful load test results
      const mockLoadTestResult = {
        timestamp: '2025-01-14T10:00:00Z',
        duration: 180000,
        totalRequests: 1000,
        requestsPerSecond: 10,
        averageResponseTime: 200,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        errorRate: 1,
        throughput: 1024,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 10,
          criticalErrors: 0,
          recommendations: ['Good performance'],
        },
      };

      loadTester.runLoadTest.mockResolvedValue(mockLoadTestResult);
      loadTester.runStressTest.mockResolvedValue(mockLoadTestResult);
      loadTester.runSpikeTest.mockResolvedValue(mockLoadTestResult);

      // Mock regression analysis
      regressionDetector.detectRegressions.mockResolvedValue({
        timestamp: '2025-01-14T10:00:00Z',
        hasRegression: false,
        severity: 'none',
        regressions: [],
        improvements: [],
        summary: {
          totalRegressions: 0,
          criticalRegressions: 0,
          majorRegressions: 0,
          minorRegressions: 0,
          totalImprovements: 0,
          overallTrend: 'stable',
        },
        recommendations: ['No regressions detected'],
      });

      // Mock benchmark comparison
      benchmarkComparator.compareWithBenchmarks.mockResolvedValue({
        timestamp: '2025-01-14T10:00:00Z',
        category: 'restaurant',
        comparisons: [],
        overallRanking: {
          overall: 'good',
          percentile: 75,
          strengths: ['Response Time'],
          weaknesses: [],
        },
        recommendations: ['Good performance'],
        summary: {
          totalMetrics: 3,
          excellentMetrics: 1,
          goodMetrics: 2,
          averageMetrics: 0,
          belowAverageMetrics: 0,
          poorMetrics: 0,
          competitiveAdvantages: [],
          improvementAreas: [],
        },
      });

      const testSuite = {
        name: 'Test Suite',
        description: 'Test performance suite',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [
          {
            name: 'Load Test',
            type: 'load' as const,
            enabled: true,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 10 }],
              scenarios: [],
            },
          },
        ],
      };

      const result = await orchestrator.runPerformanceTestSuite(testSuite);

      expect(result).toBeDefined();
      expect(result.overallStatus).toBe('passed');
      expect(result.testResults).toHaveLength(1);
      expect(result.testResults[0].status).toBe('passed');
      expect(result.regressionAnalysis).toBeDefined();
      expect(result.benchmarkComparison).toBeDefined();
      expect(loadTester.runLoadTest).toHaveBeenCalledTimes(1);
    });

    it('should handle test failures gracefully', async () => {
      loadTester.runLoadTest.mockRejectedValue(new Error('Load test failed'));

      const testSuite = {
        name: 'Failing Test Suite',
        description: 'Test suite with failures',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [
          {
            name: 'Failing Load Test',
            type: 'load' as const,
            enabled: true,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 10 }],
              scenarios: [],
            },
          },
        ],
      };

      const result = await orchestrator.runPerformanceTestSuite(testSuite);

      expect(result).toBeDefined();
      expect(result.overallStatus).toBe('failed');
      expect(result.testResults).toHaveLength(1);
      expect(result.testResults[0].status).toBe('failed');
      expect(result.testResults[0].error).toBe('Load test failed');
    });

    it('should run tests in parallel when configured', async () => {
      const mockLoadTestResult = {
        timestamp: '2025-01-14T10:00:00Z',
        duration: 180000,
        totalRequests: 1000,
        requestsPerSecond: 10,
        averageResponseTime: 200,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        errorRate: 1,
        throughput: 1024,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 10,
          criticalErrors: 0,
          recommendations: ['Good performance'],
        },
      };

      loadTester.runLoadTest.mockResolvedValue(mockLoadTestResult);
      loadTester.runStressTest.mockResolvedValue(mockLoadTestResult);

      const testSuite = {
        name: 'Parallel Test Suite',
        description: 'Test suite with parallel execution',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: true,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [
          {
            name: 'Load Test',
            type: 'load' as const,
            enabled: true,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 10 }],
              scenarios: [],
            },
          },
          {
            name: 'Stress Test',
            type: 'stress' as const,
            enabled: true,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 50 }],
              scenarios: [],
            },
          },
        ],
      };

      const result = await orchestrator.runPerformanceTestSuite(testSuite);

      expect(result).toBeDefined();
      expect(result.testResults).toHaveLength(2);
      expect(loadTester.runLoadTest).toHaveBeenCalledTimes(1);
      expect(loadTester.runStressTest).toHaveBeenCalledTimes(1);
    });

    it('should skip disabled tests', async () => {
      const testSuite = {
        name: 'Test Suite with Disabled Tests',
        description: 'Test suite with some disabled tests',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [
          {
            name: 'Enabled Test',
            type: 'load' as const,
            enabled: true,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 10 }],
              scenarios: [],
            },
          },
          {
            name: 'Disabled Test',
            type: 'stress' as const,
            enabled: false,
            config: {
              target: 'http://localhost:3000',
              phases: [{ duration: 60, arrivalRate: 50 }],
              scenarios: [],
            },
          },
        ],
      };

      loadTester.runLoadTest.mockResolvedValue({
        timestamp: '2025-01-14T10:00:00Z',
        duration: 180000,
        totalRequests: 1000,
        requestsPerSecond: 10,
        averageResponseTime: 200,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        errorRate: 1,
        throughput: 1024,
        scenarios: [],
        summary: { passed: true, totalErrors: 10, criticalErrors: 0, recommendations: [] },
      });

      const result = await orchestrator.runPerformanceTestSuite(testSuite);

      expect(result).toBeDefined();
      expect(result.testResults).toHaveLength(1);
      expect(result.testResults[0].testName).toBe('Enabled Test');
      expect(loadTester.runLoadTest).toHaveBeenCalledTimes(1);
      expect(loadTester.runStressTest).not.toHaveBeenCalled();
    });
  });

  describe('getStandardWebAppSuite', () => {
    it('should create a standard web app test suite', () => {
      const target = 'http://localhost:3000';
      const suite = PerformanceTestOrchestrator.getStandardWebAppSuite(target);

      expect(suite).toBeDefined();
      expect(suite.name).toBe('Standard Web Application');
      expect(suite.config.target).toBe(target);
      expect(suite.tests).toHaveLength(3);
      expect(suite.tests[0].name).toBe('Load Test - Normal Traffic');
      expect(suite.tests[1].name).toBe('Stress Test - High Load');
      expect(suite.tests[2].name).toBe('Spike Test - Traffic Spikes');
    });
  });
});