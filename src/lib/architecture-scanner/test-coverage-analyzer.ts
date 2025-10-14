/**
 * Test Coverage Analyzer
 * Integrates with existing test coverage analysis and maps components to tests
 */

import { TestCoverageInfo } from './types';

export class TestCoverageAnalyzer {
  /**
   * Load existing test coverage data from source-test-coverage-map.json
   */
  static async loadExistingCoverage(): Promise<any> {
    try {
      const { readFile } = await import('fs/promises');
      const coverageData = await readFile('report/source-test-coverage-map.json', 'utf-8');
      return JSON.parse(coverageData);
    } catch (error) {
      console.warn('Could not load existing test coverage data:', error);
      return null;
    }
  }

  /**
   * Analyze test coverage for components
   */
  static async analyzeTestCoverage(componentPaths: string[]): Promise<TestCoverageInfo> {
    const existingCoverage = await this.loadExistingCoverage();
    const testedFiles: string[] = [];
    const uncoveredComponents: string[] = [];

    for (const componentPath of componentPaths) {
      const hasTest = await this.hasTestFile(componentPath) || 
                     this.isInCoverageMap(componentPath, existingCoverage);
      
      if (hasTest) {
        testedFiles.push(componentPath);
      } else {
        uncoveredComponents.push(componentPath);
      }
    }

    const coveragePercentage = componentPaths.length 
      ? (testedFiles.length / componentPaths.length) * 100 
      : 0;

    return {
      totalFiles: componentPaths.length,
      testedFiles: testedFiles.length,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      uncoveredComponents
    };
  }

  /**
   * Check if a component has a corresponding test file
   */
  private static async hasTestFile(componentPath: string): Promise<boolean> {
    const testPatterns = [
      componentPath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      componentPath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
      componentPath.replace(/src\//, 'src/__tests__/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      componentPath.replace(/src\//, 'test/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      this.getTestFileInTestsDirectory(componentPath)
    ];

    try {
      const { access } = await import('fs/promises');
      
      for (const testPath of testPatterns) {
        try {
          await access(testPath);
          return true;
        } catch {
          // File doesn't exist, continue
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generate test file path in __tests__ directory
   */
  private static getTestFileInTestsDirectory(componentPath: string): string {
    const pathParts = componentPath.split('/');
    const fileName = pathParts.pop() || '';
    const directory = pathParts.join('/');
    const testFileName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
    
    return `${directory}/__tests__/${testFileName}`;
  }

  /**
   * Check if component is covered in existing coverage map
   */
  private static isInCoverageMap(componentPath: string, coverageMap: any): boolean {
    if (!coverageMap) return false;

    // Check various possible keys in the coverage map
    const possibleKeys = [
      componentPath,
      componentPath.replace(/^src\//, ''),
      componentPath.replace(/\.(ts|tsx|js|jsx)$/, ''),
      componentPath.replace(/^src\//, '').replace(/\.(ts|tsx|js|jsx)$/, '')
    ];

    return possibleKeys.some(key => 
      coverageMap[key] || 
      coverageMap.files?.[key] ||
      coverageMap.coverage?.[key]
    );
  }

  /**
   * Get test recommendations for uncovered components
   */
  static getTestRecommendations(uncoveredComponents: string[]): Array<{
    component: string;
    recommendedTestPath: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    return uncoveredComponents.map(component => {
      const priority = this.getTestPriority(component);
      const recommendedTestPath = this.getRecommendedTestPath(component);
      const reason = this.getTestReason(component, priority);

      return {
        component,
        recommendedTestPath,
        priority,
        reason
      };
    });
  }

  /**
   * Determine test priority based on component characteristics
   */
  private static getTestPriority(componentPath: string): 'high' | 'medium' | 'low' {
    // High priority for critical components
    if (componentPath.includes('/auth/') || 
        componentPath.includes('/services/') ||
        componentPath.includes('Context.tsx') ||
        componentPath.includes('/api/')) {
      return 'high';
    }

    // Medium priority for UI components and utilities
    if (componentPath.includes('/components/') ||
        componentPath.includes('/hooks/') ||
        componentPath.includes('/utils/')) {
      return 'medium';
    }

    // Low priority for pages and less critical files
    return 'low';
  }

  /**
   * Get recommended test file path
   */
  private static getRecommendedTestPath(componentPath: string): string {
    const pathParts = componentPath.split('/');
    const fileName = pathParts.pop() || '';
    const directory = pathParts.join('/');
    const testFileName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
    
    return `${directory}/__tests__/${testFileName}`;
  }

  /**
   * Get reason for test recommendation
   */
  private static getTestReason(componentPath: string, priority: 'high' | 'medium' | 'low'): string {
    const reasons = {
      high: 'Critical component requiring comprehensive test coverage',
      medium: 'Important component that should have basic test coverage',
      low: 'Component that would benefit from test coverage'
    };

    return reasons[priority];
  }
}