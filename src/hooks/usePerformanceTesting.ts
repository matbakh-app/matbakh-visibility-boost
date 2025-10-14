/**
 * Performance Testing Hook
 * React hook for performance testing operations
 */

import { useState, useCallback } from 'react';
import { 
  performanceOrchestrator, 
  PerformanceTestSuite, 
  PerformanceTestResult,
  LoadTestConfig,
  LoadTestResult,
  loadTester,
  regressionDetector,
  PerformanceMetrics,
  RegressionResult,
  benchmarkComparator,
  ComparisonResult
} from '@/lib/performance-testing';

export interface UsePerformanceTestingReturn {
  // State
  isRunning: boolean;
  results: PerformanceTestResult | null;
  loadTestResults: LoadTestResult | null;
  regressionResults: RegressionResult | null;
  benchmarkResults: ComparisonResult | null;
  error: string | null;
  
  // Actions
  runTestSuite: (suite: PerformanceTestSuite) => Promise<PerformanceTestResult | null>;
  runLoadTest: (config: LoadTestConfig) => Promise<LoadTestResult | null>;
  runStressTest: (config: LoadTestConfig) => Promise<LoadTestResult | null>;
  runSpikeTest: (config: LoadTestConfig) => Promise<LoadTestResult | null>;
  analyzeRegressions: (metrics: PerformanceMetrics) => Promise<RegressionResult | null>;
  compareBenchmarks: (metrics: Record<string, number>, category?: string) => Promise<ComparisonResult | null>;
  
  // Utilities
  clearResults: () => void;
  clearError: () => void;
  getStandardSuite: (target: string) => PerformanceTestSuite;
}

export default function usePerformanceTesting(): UsePerformanceTestingReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PerformanceTestResult | null>(null);
  const [loadTestResults, setLoadTestResults] = useState<LoadTestResult | null>(null);
  const [regressionResults, setRegressionResults] = useState<RegressionResult | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTestSuite = useCallback(async (suite: PerformanceTestSuite): Promise<PerformanceTestResult | null> => {
    if (isRunning) {
      setError('Performance test already running');
      return null;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      console.log('🚀 Starting performance test suite:', suite.name);
      const result = await performanceOrchestrator.runPerformanceTestSuite(suite);
      setResults(result);
      console.log('✅ Performance test suite completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Performance test failed';
      setError(errorMessage);
      console.error('❌ Performance test suite failed:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const runLoadTest = useCallback(async (config: LoadTestConfig): Promise<LoadTestResult | null> => {
    if (isRunning) {
      setError('Test already running');
      return null;
    }

    setIsRunning(true);
    setError(null);
    setLoadTestResults(null);

    try {
      console.log('🔥 Starting load test');
      const result = await loadTester.runLoadTest(config);
      setLoadTestResults(result);
      console.log('✅ Load test completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Load test failed';
      setError(errorMessage);
      console.error('❌ Load test failed:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const runStressTest = useCallback(async (config: LoadTestConfig): Promise<LoadTestResult | null> => {
    if (isRunning) {
      setError('Test already running');
      return null;
    }

    setIsRunning(true);
    setError(null);
    setLoadTestResults(null);

    try {
      console.log('💥 Starting stress test');
      const result = await loadTester.runStressTest(config);
      setLoadTestResults(result);
      console.log('✅ Stress test completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stress test failed';
      setError(errorMessage);
      console.error('❌ Stress test failed:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const runSpikeTest = useCallback(async (config: LoadTestConfig): Promise<LoadTestResult | null> => {
    if (isRunning) {
      setError('Test already running');
      return null;
    }

    setIsRunning(true);
    setError(null);
    setLoadTestResults(null);

    try {
      console.log('⚡ Starting spike test');
      const result = await loadTester.runSpikeTest(config);
      setLoadTestResults(result);
      console.log('✅ Spike test completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Spike test failed';
      setError(errorMessage);
      console.error('❌ Spike test failed:', err);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const analyzeRegressions = useCallback(async (metrics: PerformanceMetrics): Promise<RegressionResult | null> => {
    setError(null);
    setRegressionResults(null);

    try {
      console.log('🔍 Analyzing performance regressions');
      const result = await regressionDetector.detectRegressions(metrics);
      setRegressionResults(result);
      console.log('✅ Regression analysis completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Regression analysis failed';
      setError(errorMessage);
      console.error('❌ Regression analysis failed:', err);
      return null;
    }
  }, []);

  const compareBenchmarks = useCallback(async (
    metrics: Record<string, number>, 
    category: string = 'restaurant'
  ): Promise<ComparisonResult | null> => {
    setError(null);
    setBenchmarkResults(null);

    try {
      console.log('📊 Comparing with industry benchmarks');
      const result = await benchmarkComparator.compareWithBenchmarks(metrics, category);
      setBenchmarkResults(result);
      console.log('✅ Benchmark comparison completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Benchmark comparison failed';
      setError(errorMessage);
      console.error('❌ Benchmark comparison failed:', err);
      return null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setLoadTestResults(null);
    setRegressionResults(null);
    setBenchmarkResults(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getStandardSuite = useCallback((target: string): PerformanceTestSuite => {
    return performanceOrchestrator.getStandardWebAppSuite(target);
  }, []);

  return {
    // State
    isRunning,
    results,
    loadTestResults,
    regressionResults,
    benchmarkResults,
    error,
    
    // Actions
    runTestSuite,
    runLoadTest,
    runStressTest,
    runSpikeTest,
    analyzeRegressions,
    compareBenchmarks,
    
    // Utilities
    clearResults,
    clearError,
    getStandardSuite,
  };
}