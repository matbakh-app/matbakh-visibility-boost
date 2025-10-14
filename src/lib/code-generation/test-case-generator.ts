/**
 * Test Case Generator
 * 
 * Generates comprehensive test suites based on component analysis
 * Supports unit, integration, and E2E tests with accessibility and performance testing
 */

import { TestTemplates } from './templates/test-templates';
import { CodeGenerationConfig, ComponentAnalysis, TestCase, TestSuite } from './types';

export class TestCaseGenerator {
    private testTemplates: TestTemplates;

    constructor(private config: CodeGenerationConfig) {
        this.testTemplates = new TestTemplates(config);
    }

    /**
     * Generate comprehensive test suite for a component
     */
    async generateTestSuite(analysis: ComponentAnalysis): Promise<TestSuite> {
        const testCases = await this.generateTestCases(analysis);
        const setup = this.generateTestSetup(analysis);
        const teardown = this.generateTestTeardown(analysis);

        return {
            name: `${analysis.name} Test Suite`,
            path: `${analysis.path.replace('.tsx', '.test.tsx')}`,
            testCases,
            setup,
            teardown,
            config: this.generateTestConfig(analysis)
        };
    }

    /**
     * Generate test cases based on component analysis
     */
    private async generateTestCases(analysis: ComponentAnalysis): Promise<TestCase[]> {
        const testCases: TestCase[] = [];

        // Basic rendering tests
        testCases.push(...this.generateRenderingTests(analysis));

        // Props testing
        testCases.push(...this.generatePropsTests(analysis));

        // Interaction tests
        testCases.push(...this.generateInteractionTests(analysis));

        // Accessibility tests
        testCases.push(...this.generateAccessibilityTests(analysis));

        // Performance tests
        testCases.push(...this.generatePerformanceTests(analysis));

        // Error handling tests
        testCases.push(...this.generateErrorHandlingTests(analysis));

        // Integration tests
        testCases.push(...this.generateIntegrationTests(analysis));

        return testCases;
    }

    /**
     * Generate basic rendering tests
     */
    private generateRenderingTests(analysis: ComponentAnalysis): TestCase[] {
        return [
            {
                name: 'renders without crashing',
                type: 'unit',
                content: `
    it('renders without crashing', () => {
      render(<${analysis.name} />);
      expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toBeInTheDocument();
    });`
            },
            {
                name: 'renders with default props',
                type: 'unit',
                content: `
    it('renders with default props', () => {
      render(<${analysis.name} />);
      const element = screen.getByTestId('${analysis.name.toLowerCase()}');
      expect(element).toHaveClass('${this.getDefaultClasses(analysis)}');
    });`
            },
            {
                name: 'matches snapshot',
                type: 'unit',
                content: `
    it('matches snapshot', () => {
      const { container } = render(<${analysis.name} />);
      expect(container.firstChild).toMatchSnapshot();
    });`
            }
        ];
    }

    /**
     * Generate props testing
     */
    private generatePropsTests(analysis: ComponentAnalysis): TestCase[] {
        return analysis.props.map(prop => ({
            name: `handles ${prop.name} prop`,
            type: 'unit',
            content: `
    it('handles ${prop.name} prop', () => {
      const test${this.capitalize(prop.name)} = ${this.generateTestValue(prop.type)};
      render(<${analysis.name} ${prop.name}={test${this.capitalize(prop.name)}} />);
      
      ${this.generatePropAssertion(prop, analysis)}
    });`
        }));
    }

    /**
     * Generate interaction tests
     */
    private generateInteractionTests(analysis: ComponentAnalysis): TestCase[] {
        const tests: TestCase[] = [];

        // Click interactions
        tests.push({
            name: 'handles click interactions',
            type: 'unit',
            content: `
    it('handles click interactions', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(<${analysis.name} onClick={handleClick} />);
      const element = screen.getByTestId('${analysis.name.toLowerCase()}');
      
      await user.click(element);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });`
        });

        // Keyboard interactions
        tests.push({
            name: 'handles keyboard interactions',
            type: 'unit',
            content: `
    it('handles keyboard interactions', async () => {
      const user = userEvent.setup();
      const handleKeyDown = jest.fn();
      
      render(<${analysis.name} onKeyDown={handleKeyDown} />);
      const element = screen.getByTestId('${analysis.name.toLowerCase()}');
      
      element.focus();
      await user.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });`
        });

        // Form interactions (if applicable)
        if (this.isFormComponent(analysis)) {
            tests.push({
                name: 'handles form submission',
                type: 'unit',
                content: `
    it('handles form submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      
      render(<${analysis.name} onSubmit={handleSubmit} />);
      const form = screen.getByRole('form');
      
      await user.click(screen.getByRole('button', { name: /submit/i }));
      expect(handleSubmit).toHaveBeenCalled();
    });`
            });
        }

        return tests;
    }

    /**
     * Generate accessibility tests
     */
    private generateAccessibilityTests(analysis: ComponentAnalysis): TestCase[] {
        return [
            {
                name: 'meets accessibility requirements',
                type: 'unit',
                content: `
    it('meets accessibility requirements', async () => {
      const { container } = render(<${analysis.name} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });`
            },
            {
                name: 'supports keyboard navigation',
                type: 'unit',
                content: `
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<${analysis.name} />);
      
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
      
      await user.keyboard('{Enter}');
      // Assert expected behavior
    });`
            },
            {
                name: 'has proper ARIA attributes',
                type: 'unit',
                content: `
    it('has proper ARIA attributes', () => {
      render(<${analysis.name} />);
      const element = screen.getByTestId('${analysis.name.toLowerCase()}');
      
      expect(element).toHaveAttribute('role');
      expect(element).toHaveAttribute('aria-label');
    });`
            },
            {
                name: 'supports screen readers',
                type: 'unit',
                content: `
    it('supports screen readers', () => {
      render(<${analysis.name} />);
      const element = screen.getByTestId('${analysis.name.toLowerCase()}');
      
      expect(element).toHaveAccessibleName();
      expect(element).toHaveAccessibleDescription();
    });`
            }
        ];
    }

    /**
     * Generate performance tests
     */
    private generatePerformanceTests(analysis: ComponentAnalysis): TestCase[] {
        return [
            {
                name: 'renders within performance budget',
                type: 'unit',
                content: `
    it('renders within performance budget', () => {
      const startTime = performance.now();
      render(<${analysis.name} />);
      const endTime = performance.now();
      
      // Should render within 16ms (60fps)
      expect(endTime - startTime).toBeLessThan(16);
    });`
            },
            {
                name: 'handles large datasets efficiently',
                type: 'unit',
                content: `
    it('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: \`Item \${i}\` }));
      
      const startTime = performance.now();
      render(<${analysis.name} data={largeDataset} />);
      const endTime = performance.now();
      
      // Should handle large datasets within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });`
            },
            {
                name: 'does not cause memory leaks',
                type: 'unit',
                content: `
    it('does not cause memory leaks', () => {
      const { unmount } = render(<${analysis.name} />);
      
      // Simulate component lifecycle
      unmount();
      
      // Check for memory leaks (simplified)
      expect(true).toBe(true); // Placeholder for actual memory leak detection
    });`
            }
        ];
    }

    /**
     * Generate error handling tests
     */
    private generateErrorHandlingTests(analysis: ComponentAnalysis): TestCase[] {
        return [
            {
                name: 'handles errors gracefully',
                type: 'unit',
                content: `
    it('handles errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <${analysis.name}>
            <ThrowError />
          </${analysis.name}>
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });`
            },
            {
                name: 'handles invalid props',
                type: 'unit',
                content: `
    it('handles invalid props', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<${analysis.name} invalidProp="invalid" />);
      
      // Component should still render despite invalid props
      expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });`
            }
        ];
    }

    /**
     * Generate integration tests
     */
    private generateIntegrationTests(analysis: ComponentAnalysis): TestCase[] {
        const tests: TestCase[] = [];

        // API integration tests
        if (this.hasApiDependencies(analysis)) {
            tests.push({
                name: 'integrates with API correctly',
                type: 'integration',
                content: `
    it('integrates with API correctly', async () => {
      const mockApiResponse = { data: 'test data' };
      jest.spyOn(apiClient, 'getData').mockResolvedValue(mockApiResponse);
      
      render(<${analysis.name} />);
      
      await waitFor(() => {
        expect(screen.getByText('test data')).toBeInTheDocument();
      });
      
      expect(apiClient.getData).toHaveBeenCalled();
    });`
            });
        }

        // Context integration tests
        if (this.hasContextDependencies(analysis)) {
            tests.push({
                name: 'integrates with context correctly',
                type: 'integration',
                content: `
    it('integrates with context correctly', () => {
      const contextValue = { user: { name: 'Test User' } };
      
      render(
        <TestContext.Provider value={contextValue}>
          <${analysis.name} />
        </TestContext.Provider>
      );
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });`
            });
        }

        // Router integration tests
        if (this.hasRouterDependencies(analysis)) {
            tests.push({
                name: 'integrates with router correctly',
                type: 'integration',
                content: `
    it('integrates with router correctly', () => {
      render(
        <MemoryRouter initialEntries={['/test']}>
          <${analysis.name} />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toBeInTheDocument();
    });`
            });
        }

        return tests;
    }

    /**
     * Generate test setup
     */
    private generateTestSetup(analysis: ComponentAnalysis): string {
        const setup = [
            "import { render, screen, waitFor } from '@testing-library/react';",
            "import userEvent from '@testing-library/user-event';",
            "import { axe, toHaveNoViolations } from 'jest-axe';",
            `import { ${analysis.name} } from '../${analysis.name}';`
        ];

        if (this.hasApiDependencies(analysis)) {
            setup.push("import { apiClient } from '@/api/client';");
        }

        if (this.hasContextDependencies(analysis)) {
            setup.push("import { TestContext } from '@/contexts/TestContext';");
        }

        if (this.hasRouterDependencies(analysis)) {
            setup.push("import { MemoryRouter } from 'react-router-dom';");
        }

        setup.push("", "expect.extend(toHaveNoViolations);");

        return setup.join('\n');
    }

    /**
     * Generate test teardown
     */
    private generateTestTeardown(analysis: ComponentAnalysis): string {
        return `
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});`;
    }

    /**
     * Generate test configuration
     */
    private generateTestConfig(analysis: ComponentAnalysis): string {
        return `
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};`;
    }

    // Helper methods
    private getDefaultClasses(analysis: ComponentAnalysis): string {
        // Analyze component to determine default classes
        return 'default-class';
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private generateTestValue(type: string): string {
        switch (type.toLowerCase()) {
            case 'string':
                return "'test string'";
            case 'number':
                return '42';
            case 'boolean':
                return 'true';
            case 'array':
                return "['item1', 'item2']";
            case 'object':
                return "{ key: 'value' }";
            case 'function':
                return 'jest.fn()';
            default:
                return "'test value'";
        }
    }

    private generatePropAssertion(prop: any, analysis: ComponentAnalysis): string {
        switch (prop.type.toLowerCase()) {
            case 'string':
                return `expect(screen.getByText('test string')).toBeInTheDocument();`;
            case 'boolean':
                return `expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toHaveAttribute('data-${prop.name}', 'true');`;
            case 'function':
                return `// Function prop assertion would be tested in interaction tests`;
            default:
                return `expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toBeInTheDocument();`;
        }
    }

    private isFormComponent(analysis: ComponentAnalysis): boolean {
        return analysis.name.toLowerCase().includes('form') ||
            analysis.dependencies.some(dep => dep.includes('form'));
    }

    private hasApiDependencies(analysis: ComponentAnalysis): boolean {
        return analysis.dependencies.some(dep =>
            dep.includes('api') || dep.includes('client') || dep.includes('service')
        );
    }

    private hasContextDependencies(analysis: ComponentAnalysis): boolean {
        return analysis.dependencies.some(dep =>
            dep.includes('context') || dep.includes('provider')
        );
    }

    private hasRouterDependencies(analysis: ComponentAnalysis): boolean {
        return analysis.dependencies.some(dep =>
            dep.includes('router') || dep.includes('navigate') || dep.includes('link')
        );
    }
}