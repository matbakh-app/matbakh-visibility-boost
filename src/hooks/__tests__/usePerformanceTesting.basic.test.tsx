/**
 * usePerformanceTesting Hook Basic Tests
 * Basic integration tests for performance testing hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import usePerformanceTesting from '../usePerformanceTesting';

// Mock the performance testing modules
jest.mock('@/lib/performance-testing', () => ({
  performanceOrchestrator: {
    runPerformanceTestSuite: jest.fn(),
    getStandardWebAppSuite: jest.fn(),
  },
  loadTester: {
    runLoadTest: jest.fn(),
    runStressTest: jest.fn(),
    runSpikeTest: jest.fn(),
  },
  regressionDetector: {
    detectRegressions: jest.fn(),
  },
  benchmarkComparator: {
    compareWithBenchmarks: jest.fn(),
  },
}));

describe('usePerformanceTesting (Basic Integration)', () => {
  const mockPerformanceResult = {
    timestamp: '2025-01-14T10:00:00Z',
    suiteName: 'Test Suite',
    environment: 'staging',
    overallStatus: 'passed' as const,
    duration: 180000,
    testResults: [
      {
        testName: 'Load Test',
        type: 'load',
        status: 'passed' as const,
        duration: 60000,
        metrics: {
          responseTime: 150,
          throughput: 100,
          errorRate: 0.5,
          concurrency: 10,
        },
      },
    ],
    summary: {
      totalTests: 1,
      passedTests: 1,
      failedTests: 0,
      skippedTests: 0,
      averageResponseTime: 150,
      totalThroughput: 100,
      overallErrorRate: 0.5,
      performanceScore: 85,
      recommendations: ['Good performance'],
    },
    reports: {
      json: '/path/to/report.json',
    },
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePerformanceTesting());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.results).toBeNull();
      expect(result.current.loadTestResults).toBeNull();
      expect(result.current.regressionResults).toBeNull();
      expect(result.current.benchmarkResults).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => usePerformanceTesting());

      expect(typeof result.current.runTestSuite).toBe('function');
      expect(typeof result.current.runLoadTest).toBe('function');
      expect(typeof result.current.runStressTest).toBe('function');
      expect(typeof result.current.runSpikeTest).toBe('function');
      expect(typeof result.current.analyzeRegressions).toBe('function');
      expect(typeof result.current.compareBenchmarks).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.getStandardSuite).toBe('function');
    });
  });

  describe('Test Suite Execution', () => {
    it('should run test suite successfully', async () => {
      const { performanceOrchestrator } = require('@/lib/performance-testing');
      performanceOrchestrator.runPerformanceTestSuite.mockResolvedValue(mockPerformanceResult);

      const { result } = renderHook(() => usePerformanceTesting());

      const testSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [],
      };

      await act(async () => {
        const testResult = await result.current.runTestSuite(testSuite);
        expect(testResult).toEqual(mockPerformanceResult);
      });

      expect(result.current.results).toEqual(mockPerformanceResult);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle test suite errors', async () => {
      const { performanceOrchestrator } = require('@/lib/performance-testing');
      performanceOrchestrator.runPerformanceTestSuite.mockRejectedValue(new Error('Test failed'));

      const { result } = renderHook(() => usePerformanceTesting());

      const testSuite = {
        name: 'Failing Suite',
        description: 'Failing test suite',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [],
      };

      await act(async () => {
        const testResult = await result.current.runTestSuite(testSuite);
        expect(testResult).toBeNull();
      });

      expect(result.current.error).toBe('Test failed');
      expect(result.current.results).toBeNull();
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('Load Test Execution', () => {
    it('should run load test successfully', async () => {
      const { loadTester } = require('@/lib/performance-testing');
      loadTester.runLoadTest.mockResolvedValue(mockLoadTestResult);

      const { result } = renderHook(() => usePerformanceTesting());

      const loadConfig = {
        target: 'http://localhost:3000',
        phases: [{ duration: 60, arrivalRate: 10 }],
        scenarios: [],
      };

      await act(async () => {
        const testResult = await result.current.runLoadTest(loadConfig);
        expect(testResult).toEqual(mockLoadTestResult);
      });

      expect(result.current.loadTestResults).toEqual(mockLoadTestResult);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should clear results', async () => {
      const { performanceOrchestrator } = require('@/lib/performance-testing');
      performanceOrchestrator.runPerformanceTestSuite.mockResolvedValue(mockPerformanceResult);

      const { result } = renderHook(() => usePerformanceTesting());

      // First run a test to set some state
      const testSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        config: {
          target: 'http://localhost:3000',
          environment: 'staging' as const,
          parallel: false,
          timeout: 300000,
          retries: 1,
          reportFormat: ['json' as const],
        },
        tests: [],
      };

      await act(async () => {
        await result.current.runTestSuite(testSuite);
      });

      // Verify state is set
      expect(result.current.results).not.toBeNull();

      // Clear results
      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toBeNull();
      expect(result.current.loadTestResults).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should get standard suite', () => {
      const { performanceOrchestrator } = require('@/lib/performance-testing');
      const mockSuite = {
        name: 'Standard Suite',
        description: 'Standard web app suite',
        config: { target: 'http://localhost:3000' },
        tests: [],
      };
      performanceOrchestrator.getStandardWebAppSuite.mockReturnValue(mockSuite);

      const { result } = renderHook(() => usePerformanceTesting());

      const suite = result.current.getStandardSuite('http://localhost:3000');
      expect(suite).toEqual(mockSuite);
      expect(performanceOrchestrator.getStandardWebAppSuite).toHaveBeenCalledWith('http://localhost:3000');
    });
  });

  describe('Concurrent Test Prevention', () => {
    it('should prevent concurrent test execution', async () => {
      const { loadTester } = require('@/lib/performance-testing');
      loadTester.runLoadTest.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockLoadTestResult), 100))
      );

      const { result } = renderHook(() => usePerformanceTesting());

      const loadConfig = {
        target: 'http://localhost:3000',
        phases: [{ duration: 60, arrivalRate: 10 }],
        scenarios: [],
      };

      // Start first test
      act(() => {
        result.current.runLoadTest(loadConfig);
      });

      expect(result.current.isRunning).toBe(true);

      // Try to start second test while first is running
      await act(async () => {
        const secondResult = await result.current.runLoadTest(loadConfig);
        expect(secondResult).toBeNull();
      });

      expect(result.current.error).toBe('Test already running');
    });
  });
});