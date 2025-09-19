/**
 * Targeted Test Executor Tests
 * Validates the test execution, real-time analysis, and failure classification functionality
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { TargetedTestExecutor, runTargetedTestExecution } from '../targeted-test-executor';
import type { 
  TestExecutionResult, 
  ExecutionPhaseResult, 
  SafeTestReport, 
  FailureClassification,
  ExecutorOptions 
} from '../targeted-test-executor';
import type { SafeTestSuite, InterfaceMismatch } from '../test-selection-engine';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn()
}));

const mockSpawn = jest.mocked(require('child_process').spawn);
const mockWriteFile = jest.mocked(require('fs/promises').writeFile);
const mockMkdir = jest.mocked(require('fs/promises').mkdir);
const mockReadFile = jest.mocked(require('fs/promises').readFile);

// Mock TestSelectionEngine
jest.mock('../test-selection-engine', () => ({
  TestSelectionEngine: jest.fn().mockImplementation(() => ({
    loadCoverageMap: jest.fn(),
    createKiroComponentFilter: jest.fn(),
    generateSafeTestSuite: jest.fn()
  }))
}));

const MockTestSelectionEngine = jest.mocked(require('../test-selection-engine').TestSelectionEngine);

// Mock data
const mockSafeTestSuite: SafeTestSuite = {
  validated: [
    'src/services/__tests__/auth.test.ts',
    'src/services/__tests__/ProfileService.test.ts',
    'src/services/__tests__/aws-rds-client.test.ts'
  ],
  excluded: [
    'src/services/__tests__/persona-api.test.ts',
    'src/services/__tests__/vc.test.ts'
  ],
  interfaceMismatches: [
    {
      sourceFile: 'src/services/persona-api.ts',
      testFile: 'src/services/__tests__/persona-api.test.ts',
      mismatchType: 'method_signature',
      description: 'Complete API interface mismatch',
      severity: 'critical',
      suggestedFix: 'Rewrite test file to match current API interface'
    }
  ],
  executionPlan: {
    phase1: ['src/services/__tests__/auth.test.ts'],
    phase2: ['src/services/__tests__/ProfileService.test.ts', 'src/services/__tests__/aws-rds-client.test.ts'],
    phase3: ['test/integration/enhanced-visibility-check.test.ts'],
    skipList: ['src/services/__tests__/persona-api.test.ts', 'src/services/__tests__/vc.test.ts']
  },
  summary: {
    totalTests: 5,
    safeTests: 3,
    excludedTests: 2,
    confidenceLevel: 0.75
  }
};

const mockInterfaceMismatches: InterfaceMismatch[] = [
  {
    sourceFile: 'src/services/persona-api.ts',
    testFile: 'src/services/__tests__/persona-api.test.ts',
    mismatchType: 'method_signature',
    description: 'Complete API interface mismatch',
    severity: 'critical',
    suggestedFix: 'Rewrite test file to match current API interface'
  }
];

describe('TargetedTestExecutor', () => {
  let executor: TargetedTestExecutor;
  let mockTestSelectionEngine: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock TestSelectionEngine
    mockTestSelectionEngine = {
      loadCoverageMap: jest.fn().mockResolvedValue({}),
      createKiroComponentFilter: jest.fn().mockResolvedValue({}),
      generateSafeTestSuite: jest.fn().mockResolvedValue(mockSafeTestSuite)
    };
    
    MockTestSelectionEngine.mockImplementation(() => mockTestSelectionEngine);
    
    executor = new TargetedTestExecutor({
      testTimeout: 10000,
      maxConcurrency: 2,
      outputDir: 'test-reports',
      verbose: false,
      dryRun: false
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultExecutor = new TargetedTestExecutor();
      expect(defaultExecutor).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions: ExecutorOptions = {
        testTimeout: 20000,
        maxConcurrency: 8,
        failFast: true,
        outputDir: 'custom-reports',
        verbose: true,
        dryRun: true
      };
      
      const customExecutor = new TargetedTestExecutor(customOptions);
      expect(customExecutor).toBeDefined();
    });
  });

  describe('initializeTestRunner', () => {
    it('should initialize test runner with safe test suite', async () => {
      const result = await executor.initializeTestRunner('test-coverage.json');

      expect(mockTestSelectionEngine.loadCoverageMap).toHaveBeenCalledWith('test-coverage.json');
      expect(mockTestSelectionEngine.createKiroComponentFilter).toHaveBeenCalled();
      expect(mockTestSelectionEngine.generateSafeTestSuite).toHaveBeenCalled();
      expect(result).toEqual(mockSafeTestSuite);
    });

    it('should use default coverage map path if not provided', async () => {
      await executor.initializeTestRunner();

      expect(mockTestSelectionEngine.loadCoverageMap).toHaveBeenCalledWith(undefined);
    });

    it('should handle initialization errors gracefully', async () => {
      mockTestSelectionEngine.loadCoverageMap.mockRejectedValue(new Error('Coverage map not found'));

      await expect(executor.initializeTestRunner()).rejects.toThrow('Coverage map not found');
    });
  });

  describe('executeTestSuite', () => {
    beforeEach(() => {
      // Mock successful test execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        // Simulate successful test execution
        setTimeout(() => {
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(0); // Exit code 0 = success
        }, 10);
        
        return mockProcess;
      });
      
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it('should execute all phases of test suite', async () => {
      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report).toBeDefined();
      expect(report.executionId).toMatch(/^test-execution-\d+$/);
      expect(report.phaseResults).toHaveLength(3); // phase1, phase2, phase3
      expect(report.overallSummary.totalTests).toBe(4); // Total tests from all phases (1 + 2 + 1)
    });

    it('should handle empty phases gracefully', async () => {
      const emptySafeTestSuite: SafeTestSuite = {
        ...mockSafeTestSuite,
        executionPlan: {
          phase1: [],
          phase2: [],
          phase3: [],
          skipList: []
        }
      };

      const report = await executor.executeTestSuite(emptySafeTestSuite);

      expect(report.phaseResults).toHaveLength(0);
      expect(report.overallSummary.totalTests).toBe(0);
    });

    it('should stop execution on fail-fast mode', async () => {
      const failFastExecutor = new TargetedTestExecutor({ failFast: true });
      
      // Mock failed test execution
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1); // Exit code 1 = failure
        }, 10);
        
        return mockProcess;
      });

      const report = await failFastExecutor.executeTestSuite(mockSafeTestSuite);

      // Should stop after phase1 failure
      expect(report.phaseResults.length).toBeLessThanOrEqual(1);
    });
  });

  describe('dry run mode', () => {
    it('should simulate test execution in dry run mode', async () => {
      const dryRunExecutor = new TargetedTestExecutor({ dryRun: true });
      
      const report = await dryRunExecutor.executeTestSuite(mockSafeTestSuite);

      expect(report).toBeDefined();
      expect(report.overallSummary.overallSuccessRate).toBe(1.0); // All simulated tests pass
      expect(mockSpawn).not.toHaveBeenCalled(); // No actual test execution
    });
  });

  describe('failure classification', () => {
    it('should classify interface mismatch failures as expected', async () => {
      // Mock failed test with interface mismatch
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Complete API interface mismatch');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const testSuiteWithMismatch: SafeTestSuite = {
        ...mockSafeTestSuite,
        executionPlan: {
          phase1: ['src/services/__tests__/persona-api.test.ts'],
          phase2: [],
          phase3: [],
          skipList: []
        }
      };

      const report = await executor.executeTestSuite(testSuiteWithMismatch);

      expect(report.failureAnalysis.expectedFailures.length).toBeGreaterThan(0);
      expect(report.failureAnalysis.interfaceMismatches.length).toBeGreaterThan(0);
    });

    it('should classify timeout failures as infrastructure', async () => {
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Test execution timeout');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const report = await executor.executeTestSuite(mockSafeTestSuite);

      const timeoutFailures = report.failureAnalysis.infrastructureFailures.filter(
        failure => failure.failureClassification.category === 'timeout'
      );
      expect(timeoutFailures.length).toBeGreaterThan(0);
    });

    it('should classify dependency errors as infrastructure', async () => {
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Cannot find module');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const report = await executor.executeTestSuite(mockSafeTestSuite);

      const dependencyFailures = report.failureAnalysis.infrastructureFailures.filter(
        failure => failure.failureClassification.category === 'dependency'
      );
      expect(dependencyFailures.length).toBeGreaterThan(0);
    });

    it('should classify assertion errors as unexpected', async () => {
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Expected 200 but received 500');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report.failureAnalysis.unexpectedFailures.length).toBeGreaterThan(0);
    });
  });

  describe('report generation', () => {
    beforeEach(() => {
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(0);
        }, 10);
        
        return mockProcess;
      });
      
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
    });

    it('should generate comprehensive test report', async () => {
      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report.executionId).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.configuration).toBeDefined();
      expect(report.safeTestSuite).toEqual(mockSafeTestSuite);
      expect(report.phaseResults).toBeDefined();
      expect(report.overallSummary).toBeDefined();
      expect(report.failureAnalysis).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.nextSteps).toBeDefined();
    });

    it('should save report files to disk', async () => {
      await executor.executeTestSuite(mockSafeTestSuite);

      expect(mockMkdir).toHaveBeenCalledWith('test-reports', { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2); // JSON and Markdown reports
      
      const jsonCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('detailed-report.json')
      );
      const markdownCall = mockWriteFile.mock.calls.find(call => 
        call[0].toString().includes('summary.md')
      );
      
      expect(jsonCall).toBeDefined();
      expect(markdownCall).toBeDefined();
    });

    it('should handle file write errors gracefully', async () => {
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      // Should not throw, just log error
      const report = await executor.executeTestSuite(mockSafeTestSuite);
      expect(report).toBeDefined();
    });

    it('should generate appropriate recommendations', async () => {
      // Mock some failures
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Expected 200 but received 500');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.nextSteps.length).toBeGreaterThan(0);
      
      // Should have critical recommendation for unexpected failures
      const criticalRec = report.recommendations.find(rec => rec.includes('CRITICAL'));
      expect(criticalRec).toBeDefined();
    });
  });

  describe('confidence level adjustment', () => {
    it('should adjust confidence level based on execution results', async () => {
      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report.overallSummary.confidenceLevel).toBeDefined();
      expect(report.overallSummary.confidenceLevel).toBeGreaterThanOrEqual(0.1);
      expect(report.overallSummary.confidenceLevel).toBeLessThanOrEqual(0.95);
    });

    it('should lower confidence for unexpected failures', async () => {
      // Mock unexpected failures
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          const stderrHandler = mockProcess.stderr.on.mock.calls.find(call => call[0] === 'data')?.[1];
          if (stderrHandler) stderrHandler('Unexpected error');
          
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(1);
        }, 10);
        
        return mockProcess;
      });

      const report = await executor.executeTestSuite(mockSafeTestSuite);

      expect(report.overallSummary.confidenceLevel).toBeLessThan(mockSafeTestSuite.summary.confidenceLevel);
    });
  });

  describe('concurrency control', () => {
    it('should respect max concurrency setting', async () => {
      const concurrencyExecutor = new TargetedTestExecutor({ maxConcurrency: 1 });
      
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;
      
      mockSpawn.mockImplementation(() => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn()
        };
        
        setTimeout(() => {
          concurrentCalls--;
          const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
          if (onClose) onClose(0);
        }, 50);
        
        return mockProcess;
      });

      await concurrencyExecutor.executeTestSuite(mockSafeTestSuite);

      expect(maxConcurrentCalls).toBeLessThanOrEqual(1);
    });
  });
});

describe('runTargetedTestExecution utility function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockTestSelectionEngine = {
      loadCoverageMap: jest.fn().mockResolvedValue({}),
      createKiroComponentFilter: jest.fn().mockResolvedValue({}),
      generateSafeTestSuite: jest.fn().mockResolvedValue(mockSafeTestSuite)
    };
    
    MockTestSelectionEngine.mockImplementation(() => mockTestSelectionEngine);
    
    mockSpawn.mockImplementation(() => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      
      setTimeout(() => {
        const onClose = mockProcess.on.mock.calls.find(call => call[0] === 'close')?.[1];
        if (onClose) onClose(0);
      }, 10);
      
      return mockProcess;
    });
    
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('should run complete targeted test execution workflow', async () => {
    const result = await runTargetedTestExecution('test-coverage.json', {
      outputDir: 'test-output',
      verbose: true
    });

    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(result.overallSummary).toBeDefined();
    expect(result.phaseResults).toBeDefined();
    expect(result.failureAnalysis).toBeDefined();
  });

  it('should work with default parameters', async () => {
    const result = await runTargetedTestExecution();

    expect(result).toBeDefined();
    expect(result.overallSummary.totalTests).toBeGreaterThanOrEqual(0);
  });

  it('should handle execution errors gracefully', async () => {
    const mockTestSelectionEngine = {
      loadCoverageMap: jest.fn().mockRejectedValue(new Error('Coverage map error')),
      createKiroComponentFilter: jest.fn(),
      generateSafeTestSuite: jest.fn()
    };
    
    MockTestSelectionEngine.mockImplementation(() => mockTestSelectionEngine);

    await expect(runTargetedTestExecution()).rejects.toThrow('Coverage map error');
  });
});

describe('FailureClassification', () => {
  let executor: TargetedTestExecutor;

  beforeEach(() => {
    executor = new TargetedTestExecutor();
  });

  it('should create proper failure classification structure', () => {
    const classification: FailureClassification = {
      type: 'unexpected',
      severity: 'high',
      category: 'test_logic',
      description: 'Test assertion failure',
      suggestedAction: 'Review test assertions',
      isKnownIssue: false
    };

    expect(classification.type).toBe('unexpected');
    expect(classification.severity).toBe('high');
    expect(classification.category).toBe('test_logic');
    expect(classification.description).toBeDefined();
    expect(classification.suggestedAction).toBeDefined();
    expect(classification.isKnownIssue).toBe(false);
  });
});

describe('TestExecutionResult', () => {
  it('should create proper test execution result structure', () => {
    const result: TestExecutionResult = {
      testFile: 'src/services/__tests__/auth.test.ts',
      status: 'passed',
      duration: 1500,
      output: 'Test output',
      errorOutput: '',
      failureClassification: {
        type: 'expected',
        severity: 'low',
        category: 'test_logic',
        description: 'Test passed successfully',
        suggestedAction: 'No action required',
        isKnownIssue: false
      },
      timestamp: '2025-01-14T10:00:00Z'
    };

    expect(result.testFile).toBeDefined();
    expect(result.status).toBe('passed');
    expect(result.duration).toBeGreaterThan(0);
    expect(result.failureClassification).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});