#!/usr/bin/env tsx

/**
 * Test Prioritization Generator
 * 
 * Analyzes component-map.json and architecture reports to identify
 * high-risk components without test coverage and generates prioritized
 * test recommendations with example test files.
 */

import fs from 'fs/promises';
import path from 'path';

interface ComponentData {
  path: string;
  origin: string;
  type: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  testCoverage: boolean;
  kiroAlternative: boolean;
  usage: 'active' | 'unused' | 'indirect';
  dependencies?: string[];
  exports?: string[];
  imports?: string[];
}

interface TestPriorityItem {
  componentName: string;
  filePath: string;
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  suggestedTestStrategy: 'unit' | 'integration' | 'mock';
  priority: number;
  type: string;
  hasKiroAlternative: boolean;
}

class TestPrioritizationGenerator {
  private componentMap: Record<string, ComponentData> = {};
  private prioritizedComponents: TestPriorityItem[] = [];

  /**
   * Load and analyze component data
   */
  async loadComponentData(): Promise<void> {
    try {
      // Try to load from the architecture scanner first
      let componentMapPath = 'reports/component-map.json';
      
      // Check if we have a more recent component map from architecture scanner
      try {
        await fs.access('src/lib/architecture-scanner/component-map.ts');
        console.log('📊 Found component-map.ts, running architecture scanner first...');
        
        // Import and run the architecture scanner
        const { ArchitectureScanner } = await import('../src/lib/architecture-scanner/architecture-scanner.js');
        const scanner = new ArchitectureScanner();
        await scanner.scanProject();
        
        // Now load the generated JSON
        componentMapPath = 'reports/component-map.json';
      } catch (scanError) {
        console.log('📊 Using existing component map file...');
      }
      
      const data = await fs.readFile(componentMapPath, 'utf-8');
      this.componentMap = JSON.parse(data);
      console.log(`📊 Loaded ${Object.keys(this.componentMap).length} components from component map`);
    } catch (error) {
      console.error('❌ Failed to load component map:', error);
      throw error;
    }
  }

  /**
   * Analyze components and generate test priorities
   */
  generateTestPriorities(): void {
    console.log('🔍 Analyzing components for test prioritization...');

    let matchCount = 0;

    for (const [componentName, component] of Object.entries(this.componentMap)) {
      const { riskScore, riskLevel, testCoverage, usage } = component;

      // Debug filtering logic
      const passesRisk = 
        riskScore >= 10 || riskLevel === "high" || riskLevel === "critical";
      const missingTests = testCoverage === false || testCoverage === undefined;
      const notUnusedMedium = !(usage === 'unused' && riskLevel === 'medium');

      const shouldInclude = passesRisk && missingTests && notUnusedMedium;

      if (shouldInclude) {
        const riskReasons = this.analyzeRiskReasons(component);
        const suggestedStrategy = this.determineSuggestedTestStrategy(component);
        const priority = this.calculateTestPriority(component);

        this.prioritizedComponents.push({
          componentName,
          filePath: component.path,
          riskScore: component.riskScore,
          riskLevel: component.riskLevel,
          riskReasons,
          suggestedTestStrategy: suggestedStrategy,
          priority,
          type: component.type,
          hasKiroAlternative: component.kiroAlternative
        });
        matchCount++;
      }

      // Debug-Ausgabe
      console.log(
        `🔍 ${componentName}: riskScore=${riskScore}, riskLevel=${riskLevel}, testCoverage=${testCoverage}, usage=${usage} → ${shouldInclude ? "✅ PRIORITIZED" : "❌ skipped"}`
      );
    }

    // Sort by priority (highest first)
    this.prioritizedComponents.sort((a, b) => b.priority - a.priority);

    console.log(`🎯 Gesamt priorisierte Komponenten: ${matchCount}`);
  }

  /**
   * Analyze risk reasons for a component
   */
  private analyzeRiskReasons(component: ComponentData): string[] {
    const reasons: string[] = [];

    if (!component.testCoverage) {
      reasons.push('No test coverage');
    }

    if (component.origin === 'Supabase') {
      reasons.push('Legacy Supabase component');
    }

    if (!component.kiroAlternative && component.origin !== 'Kiro') {
      reasons.push('No Kiro alternative available');
    }

    if (component.dependencies && component.dependencies.length > 10) {
      reasons.push('High dependency count');
    }

    if (component.type === 'Service' || component.type === 'Context') {
      reasons.push('Critical component type');
    }

    if (component.usage === 'active') {
      reasons.push('Actively used component');
    }

    if (component.riskLevel === 'critical' || component.riskLevel === 'high') {
      reasons.push(`${component.riskLevel} risk level`);
    }

    return reasons;
  }

  /**
   * Determine suggested test strategy
   */
  private determineSuggestedTestStrategy(component: ComponentData): 'unit' | 'integration' | 'mock' {
    // Services and utilities typically need unit tests
    if (component.type === 'Service' || component.type === 'Utility' || component.type === 'Hook') {
      return 'unit';
    }

    // Pages and complex UI components need integration tests
    if (component.type === 'Page' || component.type === 'Context') {
      return 'integration';
    }

    // Components with many dependencies need mocking
    if (component.dependencies && component.dependencies.length > 5) {
      return 'mock';
    }

    // Default to unit tests
    return 'unit';
  }

  /**
   * Calculate test priority score
   */
  private calculateTestPriority(component: ComponentData): number {
    let priority = component.riskScore;

    // Boost priority for critical types
    if (component.type === 'Service') priority += 5;
    if (component.type === 'Hook') priority += 4;
    if (component.type === 'Context') priority += 6;

    // Boost priority for active components
    if (component.usage === 'active') priority += 3;

    // Reduce priority if Kiro alternative exists
    if (component.kiroAlternative) priority -= 2;

    // Boost priority for legacy components
    if (component.origin === 'Supabase') priority += 3;

    return Math.max(0, priority);
  }

  /**
   * Generate test prioritization markdown report
   */
  async generateReport(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    let content = `# Test Prioritization Report

**Generated:** ${timestamp}  
**Total Components Analyzed:** ${Object.keys(this.componentMap).length}  
**Components Requiring Tests:** ${this.prioritizedComponents.length}

## 📊 Executive Summary

This report identifies high-risk components without test coverage and provides prioritized recommendations for implementing tests. The analysis focuses on:

- Components with **medium to critical risk levels**
- **Active components** that are currently in use
- **Legacy components** without Kiro alternatives
- **Critical component types** (Services, Hooks, Contexts)

## 🎯 Test Priority Matrix

| Priority | Component | Risk Score | Risk Level | Type | Strategy | Reasons |
|----------|-----------|------------|------------|------|----------|---------|
`;

    // Add top 20 components to the table
    const topComponents = this.prioritizedComponents.slice(0, 20);
    
    for (const [index, component] of topComponents.entries()) {
      const checkbox = '[ ]';
      const reasons = component.riskReasons.slice(0, 2).join(', ');
      
      content += `| ${checkbox} | **${component.componentName}** | ${component.riskScore} | ${component.riskLevel} | ${component.type} | ${component.suggestedTestStrategy} | ${reasons} |\n`;
    }

    content += `

## 🧪 Detailed Test Recommendations

### High Priority Components (Top 10)

`;

    // Add detailed recommendations for top 10
    const top10 = this.prioritizedComponents.slice(0, 10);
    
    for (const [index, component] of top10.entries()) {
      content += `#### ${index + 1}. ${component.componentName}

- **File:** \`${component.filePath}\`
- **Risk Score:** ${component.riskScore} (${component.riskLevel})
- **Type:** ${component.type}
- **Strategy:** ${component.suggestedTestStrategy.toUpperCase()} tests
- **Kiro Alternative:** ${component.hasKiroAlternative ? '✅ Available' : '❌ Not available'}

**Risk Factors:**
${component.riskReasons.map(reason => `- ${reason}`).join('\n')}

**Recommended Test Approach:**
${this.getTestApproach(component)}

---

`;
    }

    content += `
## 📈 Test Strategy Guidelines

### Unit Tests
- **Target:** Services, Hooks, Utilities
- **Focus:** Individual function behavior, edge cases, error handling
- **Tools:** Jest, React Testing Library
- **Priority:** High for business logic components

### Integration Tests  
- **Target:** Pages, Contexts, Complex UI components
- **Focus:** Component interactions, data flow, user workflows
- **Tools:** Jest + React Testing Library, MSW for API mocking
- **Priority:** Medium for user-facing components

### Mock Tests
- **Target:** Components with many external dependencies
- **Focus:** Isolated behavior with mocked dependencies
- **Tools:** Jest mocks, MSW, test doubles
- **Priority:** High for components with external API calls

## 🎯 Implementation Roadmap

### Phase 1: Critical Components (Week 1-2)
Focus on the top 5 highest-priority components:
${top10.slice(0, 5).map((c, i) => `${i + 1}. ${c.componentName} (${c.suggestedTestStrategy} tests)`).join('\n')}

### Phase 2: High-Risk Services (Week 3-4)  
Implement tests for remaining high-risk services and hooks:
${top10.slice(5, 10).map((c, i) => `${i + 6}. ${c.componentName} (${c.suggestedTestStrategy} tests)`).join('\n')}

### Phase 3: Legacy Components (Week 5-6)
Address legacy Supabase components without Kiro alternatives.

## 📊 Expected Impact

### Coverage Improvement
- **Current Coverage:** ~3.89%
- **Target Coverage:** 25-30% (focusing on critical components)
- **Components to Test:** ${this.prioritizedComponents.length}

### Risk Reduction
- **High-Risk Components:** ${this.prioritizedComponents.filter(c => c.riskLevel === 'high').length}
- **Critical Components:** ${this.prioritizedComponents.filter(c => c.riskLevel === 'critical').length}
- **Legacy Components:** ${this.prioritizedComponents.filter(c => !c.hasKiroAlternative).length}

## 🚀 Next Steps

1. **Review this prioritization** with the development team
2. **Start with Phase 1** components for immediate impact
3. **Set up test infrastructure** if not already available
4. **Implement tests incrementally** following the suggested strategies
5. **Monitor coverage improvements** using Jest coverage reports
6. **Update this report** as components are tested or refactored

---

*This report was automatically generated from architecture analysis data.*
*For detailed component information, see \`reports/component-map.json\`.*
`;

    await fs.writeFile('reports/test-prioritization.md', content);
    console.log('✅ Test prioritization report generated: reports/test-prioritization.md');
  }

  /**
   * Get detailed test approach for a component
   */
  private getTestApproach(component: TestPriorityItem): string {
    switch (component.suggestedTestStrategy) {
      case 'unit':
        return `- Test individual functions and methods in isolation
- Mock external dependencies and API calls
- Focus on edge cases and error handling
- Verify return values and side effects`;

      case 'integration':
        return `- Test component interactions and data flow
- Use React Testing Library for user interaction simulation
- Mock external APIs but test internal component communication
- Verify complete user workflows`;

      case 'mock':
        return `- Heavily mock external dependencies
- Focus on component behavior with mocked inputs
- Test error scenarios with controlled mock responses
- Verify proper handling of async operations`;

      default:
        return '- Follow standard testing practices for this component type';
    }
  }

  /**
   * Generate example test files for top priority components
   */
  async generateExampleTests(): Promise<void> {
    console.log('📝 Generating example test files...');

    const top5 = this.prioritizedComponents.slice(0, 5);
    
    for (const component of top5) {
      await this.generateExampleTestFile(component);
    }

    console.log(`✅ Generated ${top5.length} example test files`);
  }

  /**
   * Generate an example test file for a specific component
   */
  private async generateExampleTestFile(component: TestPriorityItem): Promise<void> {
    const testFileName = this.getTestFileName(component.filePath);
    const componentName = component.componentName;
    
    let testContent = '';

    switch (component.suggestedTestStrategy) {
      case 'unit':
        testContent = this.generateUnitTestTemplate(componentName, component);
        break;
      case 'integration':
        testContent = this.generateIntegrationTestTemplate(componentName, component);
        break;
      case 'mock':
        testContent = this.generateMockTestTemplate(componentName, component);
        break;
    }

    const testDir = path.dirname(testFileName);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFileName, testContent);
    
    console.log(`📝 Generated example test: ${testFileName}`);
  }

  /**
   * Get test file name for a component
   */
  private getTestFileName(componentPath: string): string {
    const dir = path.dirname(componentPath);
    const name = path.basename(componentPath, path.extname(componentPath));
    return path.join(dir, '__tests__', `${name}.test.ts`);
  }

  /**
   * Generate unit test template
   */
  private generateUnitTestTemplate(componentName: string, component: TestPriorityItem): string {
    return `/**
 * Unit Tests for ${componentName}
 * 
 * Generated test template - customize based on actual component implementation
 * Risk Level: ${component.riskLevel} (Score: ${component.riskScore})
 * Strategy: Unit Testing
 */

import { ${componentName} } from '../${path.basename(component.filePath, path.extname(component.filePath))}';

describe('${componentName}', () => {
  beforeEach(() => {
    // Setup test environment
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
  });

  describe('Core Functionality', () => {
    test('should initialize correctly', () => {
      // TODO: Test component initialization
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle valid inputs', () => {
      // TODO: Test with valid inputs
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle invalid inputs gracefully', () => {
      // TODO: Test error handling
      expect(true).toBe(true); // Replace with actual test
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined inputs', () => {
      // TODO: Test edge cases
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle empty inputs', () => {
      // TODO: Test empty state handling
      expect(true).toBe(true); // Replace with actual test
    });
  });

  describe('Error Handling', () => {
    test('should throw appropriate errors for invalid operations', () => {
      // TODO: Test error scenarios
      expect(true).toBe(true); // Replace with actual test
    });

    test('should recover from errors gracefully', () => {
      // TODO: Test error recovery
      expect(true).toBe(true); // Replace with actual test
    });
  });
});

/*
 * Risk Factors Addressed:
${component.riskReasons.map(reason => ` * - ${reason}`).join('\n')}
 *
 * TODO: Customize these tests based on the actual ${componentName} implementation
 * TODO: Add specific test cases for the component's public API
 * TODO: Mock external dependencies appropriately
 * TODO: Add performance tests if applicable
 */
`;
  }

  /**
   * Generate integration test template
   */
  private generateIntegrationTestTemplate(componentName: string, component: TestPriorityItem): string {
    return `/**
 * Integration Tests for ${componentName}
 * 
 * Generated test template - customize based on actual component implementation
 * Risk Level: ${component.riskLevel} (Score: ${component.riskScore})
 * Strategy: Integration Testing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ${componentName} } from '../${path.basename(component.filePath, path.extname(component.filePath))}';

// Mock external dependencies
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('${componentName} Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      renderWithRouter(<${componentName} />);
      // TODO: Add specific assertions for rendered content
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should display expected content', () => {
      renderWithRouter(<${componentName} />);
      // TODO: Test for specific UI elements
      expect(true).toBe(true); // Replace with actual assertions
    });
  });

  describe('User Interactions', () => {
    test('should handle user input correctly', async () => {
      renderWithRouter(<${componentName} />);
      
      // TODO: Simulate user interactions
      // Example: fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        // TODO: Assert expected behavior after interaction
        expect(true).toBe(true); // Replace with actual assertions
      });
    });

    test('should navigate correctly', async () => {
      renderWithRouter(<${componentName} />);
      
      // TODO: Test navigation behavior
      expect(true).toBe(true); // Replace with actual test
    });
  });

  describe('Data Flow', () => {
    test('should load and display data correctly', async () => {
      // TODO: Mock API responses
      const mockData = { id: 1, name: 'Test Data' };
      
      renderWithRouter(<${componentName} />);
      
      await waitFor(() => {
        // TODO: Assert data is displayed correctly
        expect(true).toBe(true); // Replace with actual assertions
      });
    });

    test('should handle loading states', () => {
      renderWithRouter(<${componentName} />);
      
      // TODO: Test loading indicators
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle error states', async () => {
      // TODO: Mock API error responses
      
      renderWithRouter(<${componentName} />);
      
      await waitFor(() => {
        // TODO: Assert error handling
        expect(true).toBe(true); // Replace with actual assertions
      });
    });
  });
});

/*
 * Risk Factors Addressed:
${component.riskReasons.map(reason => ` * - ${reason}`).join('\n')}
 *
 * TODO: Customize these tests based on the actual ${componentName} implementation
 * TODO: Add tests for component interactions with other components
 * TODO: Test complete user workflows
 * TODO: Add accessibility tests
 * TODO: Test responsive behavior if applicable
 */
`;
  }

  /**
   * Generate mock test template
   */
  private generateMockTestTemplate(componentName: string, component: TestPriorityItem): string {
    return `/**
 * Mock Tests for ${componentName}
 * 
 * Generated test template - customize based on actual component implementation
 * Risk Level: ${component.riskLevel} (Score: ${component.riskScore})
 * Strategy: Mock Testing (Heavy Mocking)
 */

import { ${componentName} } from '../${path.basename(component.filePath, path.extname(component.filePath))}';

// Mock all external dependencies
jest.mock('../../services/api');
jest.mock('../../hooks/useAuth');
jest.mock('../../contexts/AppContext');

const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockUseAuth = {
  user: { id: 1, name: 'Test User' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};

describe('${componentName} Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (require('../../services/api') as any).apiClient = mockApiClient;
    (require('../../hooks/useAuth') as any).useAuth = jest.fn(() => mockUseAuth);
  });

  describe('Isolated Behavior', () => {
    test('should work with mocked dependencies', () => {
      // TODO: Test component behavior with all dependencies mocked
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle successful API responses', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true } });
      
      // TODO: Test component behavior with successful API response
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle API errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));
      
      // TODO: Test error handling with mocked API failure
      expect(true).toBe(true); // Replace with actual test
    });
  });

  describe('Authentication States', () => {
    test('should work with authenticated user', () => {
      // mockUseAuth is already set up with authenticated user
      
      // TODO: Test behavior with authenticated user
      expect(true).toBe(true); // Replace with actual test
    });

    test('should work with unauthenticated user', () => {
      (require('../../hooks/useAuth') as any).useAuth = jest.fn(() => ({
        ...mockUseAuth,
        user: null,
        isAuthenticated: false,
      }));
      
      // TODO: Test behavior with unauthenticated user
      expect(true).toBe(true); // Replace with actual test
    });
  });

  describe('Edge Cases with Mocks', () => {
    test('should handle null responses from API', async () => {
      mockApiClient.get.mockResolvedValue(null);
      
      // TODO: Test handling of null API responses
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle network timeouts', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network timeout'));
      
      // TODO: Test timeout handling
      expect(true).toBe(true); // Replace with actual test
    });

    test('should handle malformed data', async () => {
      mockApiClient.get.mockResolvedValue({ data: 'invalid-json' });
      
      // TODO: Test handling of malformed responses
      expect(true).toBe(true); // Replace with actual test
    });
  });
});

/*
 * Risk Factors Addressed:
${component.riskReasons.map(reason => ` * - ${reason}`).join('\n')}
 *
 * TODO: Customize these tests based on the actual ${componentName} implementation
 * TODO: Add more specific mocks for the component's dependencies
 * TODO: Test all possible mock scenarios
 * TODO: Add performance tests with mocked dependencies
 * TODO: Test component behavior under different mock conditions
 */
`;
  }

  /**
   * Run coverage analysis and generate summary
   */
  async generateCoverageSummary(): Promise<void> {
    console.log('📊 Generating test coverage summary...');

    // Skip running tests, just generate summary without coverage data
    const summary = `# Test Coverage Summary

**Generated:** ${new Date().toISOString().split('T')[0]}

## Current Status

Coverage analysis skipped to avoid test execution issues. Please run manually:

\`\`\`bash
npm test -- --coverage
\`\`\`

## Improvement Plan

Based on the test prioritization analysis:

- **Components Requiring Tests:** ${this.prioritizedComponents.length}
- **High Priority Components:** ${this.prioritizedComponents.filter(c => c.priority > 15).length}
- **Expected Coverage Improvement:** From ~3.89% to 25-30%

## Next Steps

1. Run \`npm test -- --coverage\` to get baseline
2. Implement tests for prioritized components
3. Monitor coverage improvements
4. Update this summary regularly

---

*This summary will be updated once coverage analysis is available*
`;

    await fs.writeFile('reports/test-coverage-summary.md', summary);
    console.log('✅ Test coverage summary generated (without coverage data): reports/test-coverage-summary.md');
  }
}

async function main(): Promise<void> {
  console.log('🧪 Starting test prioritization analysis...');

  try {
    const generator = new TestPrioritizationGenerator();
    
    // Load component data
    await generator.loadComponentData();
    
    // Generate test priorities
    generator.generateTestPriorities();
    
    // Generate reports
    await generator.generateReport();
    
    // Generate example test files
    await generator.generateExampleTests();
    
    // Generate coverage summary
    await generator.generateCoverageSummary();
    
    console.log('\n✅ Test prioritization complete!');
    console.log('📁 Generated files:');
    console.log('   📄 reports/test-prioritization.md - Main prioritization report');
    console.log('   📊 reports/test-coverage-summary.md - Coverage analysis');
    console.log('   🧪 Example test files in component __tests__ directories');
    
  } catch (error) {
    console.error('❌ Test prioritization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}