/**
 * Test Selection Engine Tests
 * Validates the test selection and interface mismatch detection functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TestSelectionEngine, runTestSelection } from '../test-selection-engine';
import type { TestCoverageMap, SafeTestSuite, InterfaceMismatch } from '../test-selection-engine';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const mockReadFile = jest.mocked(require('fs/promises').readFile);
const mockWriteFile = jest.mocked(require('fs/promises').writeFile);

// Mock test coverage map data
const mockCoverageMap: TestCoverageMap = {
  analysis_metadata: {
    generated_at: '2025-01-14T10:00:00Z',
    total_test_files: 8,
    total_source_files: 8,
    coverage_analysis_version: '1.0.0'
  },
  source_to_test_mapping: {
    'src/services/persona-api.ts': {
      test_file: 'src/services/__tests__/persona-api.test.ts',
      status: 'BROKEN',
      interface_match: false,
      coverage_estimate: 0,
      issues: ['Complete API interface mismatch', 'Tests non-existent methods'],
      priority: 'CRITICAL'
    },
    'src/services/auth.ts': {
      test_file: 'src/services/__tests__/auth.test.ts',
      status: 'EXCELLENT',
      interface_match: true,
      coverage_estimate: 95,
      issues: [],
      priority: 'NONE'
    },
    'src/services/aws-rds-client.ts': {
      test_file: 'src/services/__tests__/aws-rds-client.test.ts',
      status: 'GOOD',
      interface_match: true,
      coverage_estimate: 85,
      issues: ['Over-complex transaction scenarios'],
      priority: 'LOW'
    },
    'src/services/vc.ts': {
      test_file: 'src/services/__tests__/vc.test.ts',
      status: 'PARTIAL',
      interface_match: false,
      coverage_estimate: 70,
      issues: ['Return type assertion mismatch'],
      priority: 'MEDIUM'
    }
  },
  component_to_test_mapping: {
    'src/components/analytics/TrendChart.tsx': {
      test_file: 'src/components/analytics/__tests__/TrendChart.test.tsx',
      status: 'GOOD',
      interface_match: true,
      coverage_estimate: 60,
      issues: [],
      priority: 'MEDIUM'
    }
  },
  lambda_to_test_mapping: {
    'infra/lambdas/advanced-persona-system/src/index.ts': {
      test_file: 'infra/lambdas/advanced-persona-system/src/__tests__/advanced-persona-detector.test.ts',
      status: 'GOOD',
      interface_match: true,
      coverage_estimate: 80,
      issues: [],
      priority: 'LOW'
    }
  },
  integration_tests: {
    'test/integration/enhanced-visibility-check.test.ts': {
      covers: ['VC Pipeline', 'API Integration'],
      status: 'GOOD',
      coverage_estimate: 70,
      priority: 'MEDIUM'
    }
  },
  coverage_gaps: {
    untested_services: ['src/services/cognito-auth.ts'],
    untested_components: ['src/components/ErrorBoundary.tsx'],
    missing_integration_tests: ['Authentication flow end-to-end']
  },
  dangerous_patterns: {
    over_mocked_tests: ['src/services/__tests__/aws-rds-client.test.ts'],
    interface_mismatches: ['src/services/__tests__/persona-api.test.ts'],
    false_confidence_risks: ['src/services/__tests__/persona-api.test.ts']
  },
  test_quality_metrics: {
    total_assertions: 200,
    mock_usage_ratio: 0.65,
    integration_test_ratio: 0.15,
    unit_test_ratio: 0.85,
    estimated_false_positive_rate: 0.12,
    estimated_coverage_accuracy: 0.78
  },
  execution_readiness: {
    safe_to_run: [
      'src/services/__tests__/auth.test.ts',
      'src/services/__tests__/aws-rds-client.test.ts',
      'src/components/analytics/__tests__/TrendChart.test.tsx'
    ],
    fix_before_running: [
      'src/services/__tests__/persona-api.test.ts',
      'src/services/__tests__/vc.test.ts'
    ],
    overall_status: 'PROCEED_WITH_CAUTION',
    confidence_level: 0.75
  }
};

describe('TestSelectionEngine', () => {
  let engine: TestSelectionEngine;

  beforeEach(() => {
    engine = new TestSelectionEngine();
    jest.clearAllMocks();
  });

  describe('loadCoverageMap', () => {
    it('should load and parse test coverage map successfully', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));

      const result = await engine.loadCoverageMap('test-coverage-map.json');

      expect(mockReadFile).toHaveBeenCalledWith('test-coverage-map.json', 'utf-8');
      expect(result).toEqual(mockCoverageMap);
      expect(result.analysis_metadata.total_test_files).toBe(8);
    });

    it('should handle file read errors gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      await expect(engine.loadCoverageMap('nonexistent.json')).rejects.toThrow(
        'Failed to load test coverage map from nonexistent.json'
      );
    });

    it('should handle invalid JSON gracefully', async () => {
      mockReadFile.mockResolvedValue('invalid json');

      await expect(engine.loadCoverageMap('invalid.json')).rejects.toThrow(
        'Failed to load test coverage map from invalid.json'
      );
    });
  });

  describe('detectInterfaceMismatches', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
    });

    it('should detect interface mismatches correctly', async () => {
      const mismatches = await engine.detectInterfaceMismatches();

      expect(mismatches).toHaveLength(2); // persona-api and vc service
      
      const personaApiMismatch = mismatches.find(m => m.sourceFile === 'src/services/persona-api.ts');
      expect(personaApiMismatch).toBeDefined();
      expect(personaApiMismatch?.mismatchType).toBe('method_signature');
      expect(personaApiMismatch?.severity).toBe('critical');
      
      const vcMismatch = mismatches.find(m => m.sourceFile === 'src/services/vc.ts');
      expect(vcMismatch).toBeDefined();
      expect(vcMismatch?.mismatchType).toBe('return_type');
      expect(vcMismatch?.severity).toBe('medium');
    });

    it('should provide appropriate suggested fixes', async () => {
      const mismatches = await engine.detectInterfaceMismatches();

      const criticalMismatch = mismatches.find(m => m.severity === 'critical');
      expect(criticalMismatch?.suggestedFix).toBe('Rewrite test file to match current API interface');

      const mediumMismatch = mismatches.find(m => m.severity === 'medium');
      expect(mediumMismatch?.suggestedFix).toBe('Fix return type assertions in test');
    });

    it('should throw error if coverage map not loaded', async () => {
      const newEngine = new TestSelectionEngine();
      
      await expect(newEngine.detectInterfaceMismatches()).rejects.toThrow(
        'Coverage map not loaded. Call loadCoverageMap() first.'
      );
    });
  });

  describe('createKiroComponentFilter', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
    });

    it('should classify components by origin correctly', async () => {
      // Mock file content reads for origin detection
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockCoverageMap)) // Initial coverage map load
        .mockResolvedValueOnce('// Generated by Kiro\nexport class AuthService {}') // auth.ts
        .mockResolvedValueOnce('import { createClient } from "@supabase/supabase-js"') // persona-api.ts
        .mockResolvedValueOnce('// Kiro AI Generated\nexport class RDSClient {}') // aws-rds-client.ts
        .mockResolvedValueOnce('export const startVisibilityCheck = () => {}'); // vc.ts

      const filter = await engine.createKiroComponentFilter();

      expect(filter.kiroComponents.length).toBeGreaterThan(0);
      expect(filter.componentOrigins).toBeDefined();
      expect(Object.keys(filter.componentOrigins)).toContain('src/services/auth.ts');
    });

    it('should handle file read errors during origin detection', async () => {
      // Mock successful coverage map load, then file read errors
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(mockCoverageMap))
        .mockRejectedValue(new Error('File not readable'));

      const filter = await engine.createKiroComponentFilter();

      // Should still work with path-based detection
      expect(filter).toBeDefined();
      expect(filter.componentOrigins).toBeDefined();
    });
  });

  describe('generateSafeTestSuite', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
      await engine.createKiroComponentFilter();
    });

    it('should generate safe test suite with correct categorization', async () => {
      const safeTestSuite = await engine.generateSafeTestSuite();

      expect(safeTestSuite.summary.totalTests).toBeGreaterThan(0);
      expect(safeTestSuite.summary.safeTests).toBeGreaterThan(0);
      expect(safeTestSuite.summary.excludedTests).toBeGreaterThan(0);
      expect(safeTestSuite.summary.confidenceLevel).toBeGreaterThan(0);
      expect(safeTestSuite.summary.confidenceLevel).toBeLessThanOrEqual(1);
    });

    it('should exclude broken tests and interface mismatches', async () => {
      const safeTestSuite = await engine.generateSafeTestSuite();

      expect(safeTestSuite.excluded).toContain('src/services/__tests__/persona-api.test.ts');
      expect(safeTestSuite.excluded).toContain('src/services/__tests__/vc.test.ts');
    });

    it('should include excellent and good tests in validated list', async () => {
      const safeTestSuite = await engine.generateSafeTestSuite();

      expect(safeTestSuite.validated).toContain('src/services/__tests__/auth.test.ts');
      expect(safeTestSuite.validated).toContain('src/services/__tests__/aws-rds-client.test.ts');
    });

    it('should create proper execution plan phases', async () => {
      const safeTestSuite = await engine.generateSafeTestSuite();

      expect(safeTestSuite.executionPlan.phase1).toBeDefined();
      expect(safeTestSuite.executionPlan.phase2).toBeDefined();
      expect(safeTestSuite.executionPlan.phase3).toBeDefined();
      expect(safeTestSuite.executionPlan.skipList).toBeDefined();
      
      // Phase 1 should contain excellent tests
      expect(safeTestSuite.executionPlan.phase1).toContain('src/services/__tests__/auth.test.ts');
      
      // Skip list should contain broken tests
      expect(safeTestSuite.executionPlan.skipList).toContain('src/services/__tests__/persona-api.test.ts');
    });

    it('should include interface mismatches in results', async () => {
      const safeTestSuite = await engine.generateSafeTestSuite();

      expect(safeTestSuite.interfaceMismatches).toHaveLength(2);
      expect(safeTestSuite.interfaceMismatches[0]).toHaveProperty('sourceFile');
      expect(safeTestSuite.interfaceMismatches[0]).toHaveProperty('testFile');
      expect(safeTestSuite.interfaceMismatches[0]).toHaveProperty('mismatchType');
      expect(safeTestSuite.interfaceMismatches[0]).toHaveProperty('severity');
    });
  });

  describe('generateSafeTestReport', () => {
    let mockSafeTestSuite: SafeTestSuite;

    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
      await engine.createKiroComponentFilter();
      mockSafeTestSuite = await engine.generateSafeTestSuite();
    });

    it('should generate comprehensive test report', async () => {
      const report = await engine.generateSafeTestReport(mockSafeTestSuite);

      expect(report).toContain('# Safe Test Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Execution Plan');
      expect(report).toContain('## Interface Mismatches');
      expect(report).toContain('## Excluded Tests');
      expect(report).toContain('## Recommendations');
    });

    it('should include correct statistics in report', async () => {
      const report = await engine.generateSafeTestReport(mockSafeTestSuite);

      expect(report).toContain(`**Total Tests**: ${mockSafeTestSuite.summary.totalTests}`);
      expect(report).toContain(`**Safe Tests**: ${mockSafeTestSuite.summary.safeTests}`);
      expect(report).toContain(`**Excluded Tests**: ${mockSafeTestSuite.summary.excludedTests}`);
    });

    it('should list interface mismatches with details', async () => {
      const report = await engine.generateSafeTestReport(mockSafeTestSuite);

      expect(report).toContain('src/services/persona-api.ts');
      expect(report).toContain('**Type**: method_signature');
      expect(report).toContain('**Severity**: critical');
    });
  });

  describe('exportSafeTestSuite', () => {
    let mockSafeTestSuite: SafeTestSuite;

    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
      await engine.createKiroComponentFilter();
      mockSafeTestSuite = await engine.generateSafeTestSuite();
    });

    it('should export safe test suite to JSON file', async () => {
      await engine.exportSafeTestSuite(mockSafeTestSuite, 'test-output.json');

      expect(mockWriteFile).toHaveBeenCalledWith(
        'test-output.json',
        expect.stringContaining('"validated"'),
        'utf-8'
      );
    });

    it('should handle export errors gracefully', async () => {
      mockWriteFile.mockRejectedValue(new Error('Write permission denied'));

      await expect(
        engine.exportSafeTestSuite(mockSafeTestSuite, 'readonly.json')
      ).rejects.toThrow('Write permission denied');
    });
  });

  describe('getTestExecutionCommand', () => {
    beforeEach(async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));
      await engine.loadCoverageMap();
    });

    it('should generate correct test execution command', () => {
      const command = engine.getTestExecutionCommand('all');

      expect(command).toContain('npm test --');
      expect(command).toContain('src/services/__tests__/auth.test.ts');
      expect(command).toContain('src/services/__tests__/aws-rds-client.test.ts');
    });

    it('should throw error if coverage map not loaded', () => {
      const newEngine = new TestSelectionEngine();
      
      expect(() => newEngine.getTestExecutionCommand()).toThrow('Coverage map not loaded');
    });
  });
});

describe('runTestSelection utility function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to resolved state for utility function tests
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('should run complete test selection workflow', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));

    const result = await runTestSelection('test-coverage.json', 'output');

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.executionPlan).toBeDefined();
    expect(result.interfaceMismatches).toBeDefined();
    
    // Should have written report and suite files
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
  });

  it('should work without output directory', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(mockCoverageMap));

    const result = await runTestSelection('test-coverage.json');

    expect(result).toBeDefined();
    // Should not write files if no output directory
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});