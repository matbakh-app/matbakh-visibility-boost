/**
 * Test Selection Engine
 * Implements selective test validation for system architecture cleanup
 * Requirements: 2.1, 2.2
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

// Types
export interface TestCoverageMap {
  analysis_metadata: {
    generated_at: string;
    total_test_files: number;
    total_source_files: number;
    coverage_analysis_version: string;
  };
  source_to_test_mapping: Record<string, TestMappingInfo>;
  component_to_test_mapping: Record<string, TestMappingInfo>;
  lambda_to_test_mapping: Record<string, TestMappingInfo>;
  integration_tests: Record<string, IntegrationTestInfo>;
  coverage_gaps: {
    untested_services: string[];
    untested_components: string[];
    missing_integration_tests: string[];
  };
  dangerous_patterns: {
    over_mocked_tests: string[];
    interface_mismatches: string[];
    false_confidence_risks: string[];
  };
  test_quality_metrics: {
    total_assertions: number;
    mock_usage_ratio: number;
    integration_test_ratio: number;
    unit_test_ratio: number;
    estimated_false_positive_rate: number;
    estimated_coverage_accuracy: number;
  };
  execution_readiness: {
    safe_to_run: string[];
    fix_before_running: string[];
    overall_status: string;
    confidence_level: number;
  };
}

export interface TestMappingInfo {
  test_file: string;
  status: 'EXCELLENT' | 'GOOD' | 'PARTIAL' | 'BROKEN';
  interface_match: boolean;
  coverage_estimate: number;
  issues: string[];
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IntegrationTestInfo {
  covers: string[];
  status: 'EXCELLENT' | 'GOOD' | 'PARTIAL' | 'BROKEN';
  coverage_estimate: number;
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface InterfaceMismatch {
  sourceFile: string;
  testFile: string;
  mismatchType: 'return_type' | 'method_signature' | 'missing_method' | 'wrong_parameters';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
}

export interface SafeTestSuite {
  validated: string[];
  excluded: string[];
  interfaceMismatches: InterfaceMismatch[];
  executionPlan: TestExecutionPlan;
  summary: {
    totalTests: number;
    safeTests: number;
    excludedTests: number;
    confidenceLevel: number;
  };
}

export interface TestExecutionPlan {
  phase1: string[]; // High confidence tests
  phase2: string[]; // Medium confidence tests
  phase3: string[]; // Integration tests
  skipList: string[]; // Tests to skip
}

export interface KiroComponentFilter {
  kiroComponents: string[];
  legacyComponents: string[];
  unknownComponents: string[];
  componentOrigins: Record<string, 'kiro' | 'supabase' | 'lovable' | 'unknown'>;
}

/**
 * Test Selection Engine - Main class
 */
export class TestSelectionEngine {
  private coverageMap: TestCoverageMap | null = null;
  private kiroFilter: KiroComponentFilter | null = null;

  /**
   * Parse existing source-test-coverage-map.json
   */
  async loadCoverageMap(mapPath: string = 'report/source-test-coverage-map.json'): Promise<TestCoverageMap> {
    try {
      const mapContent = await readFile(mapPath, 'utf-8');
      this.coverageMap = JSON.parse(mapContent) as TestCoverageMap;
      
      console.log(`✅ Loaded test coverage map with ${this.coverageMap.analysis_metadata.total_test_files} test files`);
      return this.coverageMap;
    } catch (error) {
      console.error('❌ Failed to load test coverage map:', error);
      throw new Error(`Failed to load test coverage map from ${mapPath}: ${error}`);
    }
  }

  /**
   * Build interface mismatch detector
   */
  async detectInterfaceMismatches(): Promise<InterfaceMismatch[]> {
    if (!this.coverageMap) {
      throw new Error('Coverage map not loaded. Call loadCoverageMap() first.');
    }

    const mismatches: InterfaceMismatch[] = [];

    // Check source-to-test mappings
    for (const [sourceFile, testInfo] of Object.entries(this.coverageMap.source_to_test_mapping)) {
      if (!testInfo.interface_match) {
        const mismatch = await this.analyzeInterfaceMismatch(sourceFile, testInfo);
        if (mismatch) {
          mismatches.push(mismatch);
        }
      }
    }

    // Check component-to-test mappings
    for (const [componentFile, testInfo] of Object.entries(this.coverageMap.component_to_test_mapping)) {
      if (!testInfo.interface_match) {
        const mismatch = await this.analyzeInterfaceMismatch(componentFile, testInfo);
        if (mismatch) {
          mismatches.push(mismatch);
        }
      }
    }

    console.log(`🔍 Detected ${mismatches.length} interface mismatches`);
    return mismatches;
  }

  /**
   * Analyze specific interface mismatch
   */
  private async analyzeInterfaceMismatch(
    sourceFile: string, 
    testInfo: TestMappingInfo
  ): Promise<InterfaceMismatch | null> {
    try {
      // Determine mismatch type based on issues
      let mismatchType: InterfaceMismatch['mismatchType'] = 'return_type';
      let severity: InterfaceMismatch['severity'] = 'medium';
      let suggestedFix = 'Update test to match current implementation';

      if (testInfo.issues.includes('Complete API interface mismatch')) {
        mismatchType = 'method_signature';
        severity = 'critical';
        suggestedFix = 'Rewrite test file to match current API interface';
      } else if (testInfo.issues.includes('Tests non-existent methods')) {
        mismatchType = 'missing_method';
        severity = 'high';
        suggestedFix = 'Remove tests for non-existent methods or implement missing methods';
      } else if (testInfo.issues.includes('Wrong return types expected')) {
        mismatchType = 'return_type';
        severity = 'medium';
        suggestedFix = 'Update test assertions to match actual return types';
      } else if (testInfo.issues.includes('Return type assertion mismatch')) {
        mismatchType = 'return_type';
        severity = 'medium';
        suggestedFix = 'Fix return type assertions in test';
      }

      return {
        sourceFile,
        testFile: testInfo.test_file,
        mismatchType,
        description: testInfo.issues.join(', '),
        severity,
        suggestedFix
      };
    } catch (error) {
      console.warn(`⚠️ Failed to analyze interface mismatch for ${sourceFile}:`, error);
      return null;
    }
  }

  /**
   * Create Kiro-component filter logic
   */
  async createKiroComponentFilter(): Promise<KiroComponentFilter> {
    if (!this.coverageMap) {
      throw new Error('Coverage map not loaded. Call loadCoverageMap() first.');
    }

    const kiroComponents: string[] = [];
    const legacyComponents: string[] = [];
    const unknownComponents: string[] = [];
    const componentOrigins: Record<string, 'kiro' | 'supabase' | 'lovable' | 'unknown'> = {};

    // Analyze all mapped components
    const allComponents = [
      ...Object.keys(this.coverageMap.source_to_test_mapping),
      ...Object.keys(this.coverageMap.component_to_test_mapping),
      ...Object.keys(this.coverageMap.lambda_to_test_mapping)
    ];

    for (const component of allComponents) {
      const origin = await this.detectComponentOrigin(component);
      componentOrigins[component] = origin;

      switch (origin) {
        case 'kiro':
          kiroComponents.push(component);
          break;
        case 'supabase':
        case 'lovable':
          legacyComponents.push(component);
          break;
        default:
          unknownComponents.push(component);
      }
    }

    this.kiroFilter = {
      kiroComponents,
      legacyComponents,
      unknownComponents,
      componentOrigins
    };

    console.log(`🎯 Kiro filter created: ${kiroComponents.length} Kiro, ${legacyComponents.length} legacy, ${unknownComponents.length} unknown`);
    return this.kiroFilter;
  }

  /**
   * Detect component origin based on file path and content patterns
   */
  private async detectComponentOrigin(filePath: string): Promise<'kiro' | 'supabase' | 'lovable' | 'unknown'> {
    try {
      // Path-based detection
      if (filePath.includes('/kiro/') || filePath.includes('kiro-')) {
        return 'kiro';
      }
      
      if (filePath.includes('/supabase/') || filePath.includes('supabase-')) {
        return 'supabase';
      }
      
      if (filePath.includes('/lovable/') || filePath.includes('lovable-')) {
        return 'lovable';
      }

      // Content-based detection (if file exists and is readable)
      try {
        const content = await readFile(filePath, 'utf-8');
        
        // Look for Kiro markers
        if (content.includes('@kiro-generated') || 
            content.includes('// Generated by Kiro') ||
            content.includes('/* Kiro AI Generated */')) {
          return 'kiro';
        }
        
        // Look for Supabase markers
        if (content.includes('supabase') || 
            content.includes('@supabase/') ||
            content.includes('createClient')) {
          return 'supabase';
        }
        
        // Look for Lovable markers
        if (content.includes('@lovable/') || 
            content.includes('// Lovable generated') ||
            content.includes('lovable-ui')) {
          return 'lovable';
        }
      } catch (fileError) {
        // File might not exist or be readable, continue with path-based detection
      }

      // Default classification based on file patterns
      if (filePath.includes('/services/') && 
          (filePath.includes('auth') || filePath.includes('profile') || filePath.includes('aws-rds'))) {
        return 'kiro'; // These are likely Kiro-managed services
      }

      return 'unknown';
    } catch (error) {
      console.warn(`⚠️ Failed to detect origin for ${filePath}:`, error);
      return 'unknown';
    }
  }

  /**
   * Implement safe test suite generator
   */
  async generateSafeTestSuite(): Promise<SafeTestSuite> {
    if (!this.coverageMap || !this.kiroFilter) {
      throw new Error('Coverage map and Kiro filter must be loaded first.');
    }

    const validated: string[] = [];
    const excluded: string[] = [];
    const interfaceMismatches = await this.detectInterfaceMismatches();

    // Phase 1: High confidence tests (EXCELLENT status, interface match, Kiro components)
    const phase1Tests: string[] = [];
    
    // Phase 2: Medium confidence tests (GOOD status, interface match)
    const phase2Tests: string[] = [];
    
    // Phase 3: Integration tests
    const phase3Tests: string[] = [];
    
    // Skip list: Tests with interface mismatches or broken status
    const skipList: string[] = [];

    // Process source-to-test mappings
    for (const [sourceFile, testInfo] of Object.entries(this.coverageMap.source_to_test_mapping)) {
      const isKiroComponent = this.kiroFilter.kiroComponents.includes(sourceFile);
      
      if (testInfo.status === 'BROKEN' || !testInfo.interface_match) {
        excluded.push(testInfo.test_file);
        skipList.push(testInfo.test_file);
      } else if (testInfo.status === 'EXCELLENT' && isKiroComponent) {
        validated.push(testInfo.test_file);
        phase1Tests.push(testInfo.test_file);
      } else if (testInfo.status === 'GOOD' && testInfo.interface_match) {
        validated.push(testInfo.test_file);
        phase2Tests.push(testInfo.test_file);
      } else {
        excluded.push(testInfo.test_file);
        skipList.push(testInfo.test_file);
      }
    }

    // Process component-to-test mappings
    for (const [componentFile, testInfo] of Object.entries(this.coverageMap.component_to_test_mapping)) {
      const isKiroComponent = this.kiroFilter.kiroComponents.includes(componentFile);
      
      if (testInfo.status === 'BROKEN' || !testInfo.interface_match) {
        excluded.push(testInfo.test_file);
        skipList.push(testInfo.test_file);
      } else if (testInfo.status === 'GOOD' && testInfo.interface_match) {
        validated.push(testInfo.test_file);
        if (isKiroComponent) {
          phase1Tests.push(testInfo.test_file);
        } else {
          phase2Tests.push(testInfo.test_file);
        }
      }
    }

    // Process lambda-to-test mappings
    for (const [lambdaFile, testInfo] of Object.entries(this.coverageMap.lambda_to_test_mapping)) {
      if (testInfo.status === 'GOOD' && testInfo.interface_match) {
        validated.push(testInfo.test_file);
        phase2Tests.push(testInfo.test_file);
      }
    }

    // Process integration tests
    for (const [testFile, testInfo] of Object.entries(this.coverageMap.integration_tests)) {
      if (testInfo.status === 'GOOD') {
        validated.push(testFile);
        phase3Tests.push(testFile);
      } else {
        excluded.push(testFile);
        skipList.push(testFile);
      }
    }

    // Remove duplicates
    const uniqueValidated = [...new Set(validated)];
    const uniqueExcluded = [...new Set(excluded)];

    const executionPlan: TestExecutionPlan = {
      phase1: [...new Set(phase1Tests)],
      phase2: [...new Set(phase2Tests)],
      phase3: [...new Set(phase3Tests)],
      skipList: [...new Set(skipList)]
    };

    const safeTestSuite: SafeTestSuite = {
      validated: uniqueValidated,
      excluded: uniqueExcluded,
      interfaceMismatches,
      executionPlan,
      summary: {
        totalTests: uniqueValidated.length + uniqueExcluded.length,
        safeTests: uniqueValidated.length,
        excludedTests: uniqueExcluded.length,
        confidenceLevel: this.calculateConfidenceLevel(uniqueValidated.length, uniqueExcluded.length)
      }
    };

    console.log(`✅ Safe test suite generated:`);
    console.log(`   📊 Total tests: ${safeTestSuite.summary.totalTests}`);
    console.log(`   ✅ Safe tests: ${safeTestSuite.summary.safeTests}`);
    console.log(`   ❌ Excluded tests: ${safeTestSuite.summary.excludedTests}`);
    console.log(`   🎯 Confidence level: ${(safeTestSuite.summary.confidenceLevel * 100).toFixed(1)}%`);

    return safeTestSuite;
  }

  /**
   * Calculate confidence level based on test distribution
   */
  private calculateConfidenceLevel(safeTests: number, excludedTests: number): number {
    const totalTests = safeTests + excludedTests;
    if (totalTests === 0) return 0;
    
    const safeRatio = safeTests / totalTests;
    
    // Adjust confidence based on interface mismatches
    const mismatchPenalty = this.coverageMap?.dangerous_patterns.interface_mismatches.length || 0;
    const adjustedConfidence = Math.max(0.1, safeRatio - (mismatchPenalty * 0.05));
    
    return Math.min(0.95, adjustedConfidence);
  }

  /**
   * Generate safe test report
   */
  async generateSafeTestReport(safeTestSuite: SafeTestSuite): Promise<string> {
    const timestamp = new Date().toISOString();
    
    const report = `# Safe Test Report
Generated: ${timestamp}

## Summary
- **Total Tests**: ${safeTestSuite.summary.totalTests}
- **Safe Tests**: ${safeTestSuite.summary.safeTests}
- **Excluded Tests**: ${safeTestSuite.summary.excludedTests}
- **Confidence Level**: ${(safeTestSuite.summary.confidenceLevel * 100).toFixed(1)}%

## Execution Plan

### Phase 1: High Confidence Tests (${safeTestSuite.executionPlan.phase1.length})
${safeTestSuite.executionPlan.phase1.map(test => `- ${test}`).join('\n')}

### Phase 2: Medium Confidence Tests (${safeTestSuite.executionPlan.phase2.length})
${safeTestSuite.executionPlan.phase2.map(test => `- ${test}`).join('\n')}

### Phase 3: Integration Tests (${safeTestSuite.executionPlan.phase3.length})
${safeTestSuite.executionPlan.phase3.map(test => `- ${test}`).join('\n')}

## Interface Mismatches (${safeTestSuite.interfaceMismatches.length})
${safeTestSuite.interfaceMismatches.map(mismatch => `
### ${mismatch.sourceFile}
- **Test File**: ${mismatch.testFile}
- **Type**: ${mismatch.mismatchType}
- **Severity**: ${mismatch.severity}
- **Description**: ${mismatch.description}
- **Suggested Fix**: ${mismatch.suggestedFix}
`).join('\n')}

## Excluded Tests (${safeTestSuite.excluded.length})
${safeTestSuite.excluded.map(test => `- ${test}`).join('\n')}

## Recommendations
1. **Fix Interface Mismatches**: Address ${safeTestSuite.interfaceMismatches.filter(m => m.severity === 'critical').length} critical mismatches first
2. **Run Phase 1 Tests**: Execute high confidence tests immediately
3. **Validate Phase 2 Tests**: Review medium confidence tests before execution
4. **Update Excluded Tests**: Fix or remove ${safeTestSuite.excluded.length} excluded tests

---
*Generated by Test Selection Engine v1.0.0*
`;

    return report;
  }

  /**
   * Export safe test suite to JSON
   */
  async exportSafeTestSuite(
    safeTestSuite: SafeTestSuite, 
    outputPath: string = 'safe-test-suite.json'
  ): Promise<void> {
    try {
      const { writeFile } = await import('fs/promises');
      const jsonData = JSON.stringify(safeTestSuite, null, 2);
      await writeFile(outputPath, jsonData, 'utf-8');
      console.log(`✅ Safe test suite exported to ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to export safe test suite:', error);
      throw error;
    }
  }

  /**
   * Get test execution command for safe tests
   */
  getTestExecutionCommand(phase: 'phase1' | 'phase2' | 'phase3' | 'all' = 'all'): string {
    if (!this.coverageMap) {
      throw new Error('Coverage map not loaded');
    }

    const safeTests = this.coverageMap.execution_readiness.safe_to_run;
    
    if (phase === 'all') {
      return `npm test -- ${safeTests.join(' ')}`;
    }
    
    // For specific phases, would need the execution plan
    return `npm test -- --testPathPattern="${safeTests.join('|')}"`;
  }
}

/**
 * Utility function to create and run test selection engine
 */
export async function runTestSelection(
  coverageMapPath?: string,
  outputDir?: string
): Promise<SafeTestSuite> {
  const engine = new TestSelectionEngine();
  
  // Load coverage map
  await engine.loadCoverageMap(coverageMapPath);
  
  // Create Kiro component filter
  await engine.createKiroComponentFilter();
  
  // Generate safe test suite
  const safeTestSuite = await engine.generateSafeTestSuite();
  
  // Generate and save report
  const report = await engine.generateSafeTestReport(safeTestSuite);
  
  if (outputDir) {
    const { writeFile } = await import('fs/promises');
    await writeFile(join(outputDir, 'safe-test-report.md'), report, 'utf-8');
    await engine.exportSafeTestSuite(safeTestSuite, join(outputDir, 'safe-test-suite.json'));
  }
  
  return safeTestSuite;
}

export default TestSelectionEngine;