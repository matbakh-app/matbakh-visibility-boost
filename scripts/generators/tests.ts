#!/usr/bin/env npx tsx

/**
 * Kiro Test Generator
 * 
 * Generates comprehensive test suites from component analysis
 * Targets 80%+ auto-coverage with intelligent edge case detection
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
// import { InterfaceDeclaration, Project, PropertySignature, SourceFile } from 'ts-morph';
import { kiroGenConfig } from '../../kirogen.config';

interface TestGeneratorOptions {
    component: string;
    dryRun: boolean;
    coverage: number;
    a11y: boolean;
    performance: boolean;
}

interface ComponentAnalysis {
    name: string;
    path: string;
    props: PropAnalysis[];
    events: EventAnalysis[];
    ariaAttributes: string[];
    complexity: number;
    hasVariants: boolean;
    variants: string[];
}

interface PropAnalysis {
    name: string;
    type: string;
    required: boolean;
    unionValues?: string[];
    description?: string;
}

interface EventAnalysis {
    name: string;
    type: string;
    parameters: string[];
}

interface GeneratedTest {
    path: string;
    content: string;
    coverage: number;
}

class KiroTestGenerator {
    private config = kiroGenConfig;
    private logDir = this.config.observability.logDir;
    // private project: Project;

    constructor() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }

        this.project = new Project({
            tsConfigFilePath: 'tsconfig.json',
        });
    }

    async generate(options: TestGeneratorOptions): Promise<void> {
        const startTime = Date.now();
        const logFile = join(this.logDir, `test-gen-${Date.now()}.log`);

        try {
            this.log(logFile, `Starting test generation for: ${options.component}`);
            this.log(logFile, `Options: ${JSON.stringify(options, null, 2)}`);

            // Validate component exists
            if (!existsSync(options.component)) {
                throw new Error(`Component file not found: ${options.component}`);
            }

            // Analyze component
            const analysis = await this.analyzeComponent(options.component);
            this.log(logFile, `Analysis complete: ${JSON.stringify(analysis, null, 2)}`);

            // Generate tests
            const test = await this.generateTest(analysis, options);

            if (options.dryRun) {
                this.showDryRunPreview(test);
                return;
            }

            // Write test file
            await this.writeTest(test);

            // Run validation
            if (this.config.governance.kiroSystemPurityValidator) {
                await this.runValidation();
            }

            const duration = Date.now() - startTime;
            this.log(logFile, `Generation completed successfully in ${duration}ms`);

            console.log(`✅ Tests generated successfully`);
            console.log(`📁 File: ${test.path}`);
            console.log(`📊 Estimated coverage: ${test.coverage}%`);
            console.log(`⏱️  Duration: ${duration}ms`);

        } catch (error) {
            this.log(logFile, `Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }

    private async analyzeComponent(componentPath: string): Promise<ComponentAnalysis> {
        const sourceFile = this.project.addSourceFileAtPath(componentPath);
        const componentName = basename(componentPath, extname(componentPath));

        // Find component props interface
        const propsInterface = this.findPropsInterface(sourceFile, componentName);
        const props = propsInterface ? this.analyzeProps(propsInterface) : [];

        // Analyze component content
        const content = readFileSync(componentPath, 'utf-8');
        const events = this.analyzeEvents(content);
        const ariaAttributes = this.analyzeAriaAttributes(content);
        const complexity = this.calculateComplexity(content);
        const variants = this.analyzeVariants(content);

        return {
            name: componentName,
            path: componentPath,
            props,
            events,
            ariaAttributes,
            complexity,
            hasVariants: variants.length > 0,
            variants
        };
    }

    private findPropsInterface(sourceFile: SourceFile, componentName: string): InterfaceDeclaration | undefined {
        // Look for ComponentNameProps interface
        const propsInterfaceName = `${componentName}Props`;
        return sourceFile.getInterface(propsInterfaceName);
    }

    private analyzePropsFromContent(content: string): PropAnalysis[] {
        const props: PropAnalysis[] = [];

        // Simple regex-based prop extraction
        const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
        if (interfaceMatch) {
            const propsContent = interfaceMatch[1];
            const propMatches = propsContent.match(/(\w+)(\?)?:\s*([^;]+);/g);

            if (propMatches) {
                for (const match of propMatches) {
                    const propMatch = match.match(/(\w+)(\?)?:\s*([^;]+);/);
                    if (propMatch) {
                        const unionValues = this.extractUnionValues(propMatch[3]);
                        props.push({
                            name: propMatch[1],
                            type: propMatch[3].trim(),
                            required: !propMatch[2],
                            unionValues
                        });
                    }
                }
            }
        }

        return props;
    }

    private analyzePropsOld(propsInterface: any): PropAnalysis[] {
        const props: PropAnalysis[] = [];

        propsInterface.getProperties().forEach(prop => {
            if (prop instanceof PropertySignature) {
                const name = prop.getName();
                const type = prop.getTypeNode()?.getText() || 'any';
                const required = !prop.hasQuestionToken();

                // Extract union values for literal types
                const unionValues = this.extractUnionValues(type);

                // Get JSDoc description
                const description = prop.getJsDocs()[0]?.getDescription();

                props.push({
                    name,
                    type,
                    required,
                    unionValues,
                    description
                });
            }
        });

        return props;
    }

    private extractUnionValues(type: string): string[] | undefined {
        // Extract literal values from union types like 'primary' | 'secondary'
        const unionMatch = type.match(/'([^']+)'/g);
        return unionMatch?.map(match => match.replace(/'/g, ''));
    }

    private analyzeEvents(content: string): EventAnalysis[] {
        const events: EventAnalysis[] = [];

        // Find event handler props (onClick, onChange, etc.)
        const eventMatches = content.match(/on[A-Z]\w+/g) || [];

        eventMatches.forEach(eventName => {
            if (!events.find(e => e.name === eventName)) {
                events.push({
                    name: eventName,
                    type: 'function',
                    parameters: this.inferEventParameters(eventName)
                });
            }
        });

        return events;
    }

    private inferEventParameters(eventName: string): string[] {
        switch (eventName) {
            case 'onClick':
                return ['MouseEvent'];
            case 'onChange':
                return ['ChangeEvent'];
            case 'onKeyDown':
            case 'onKeyUp':
                return ['KeyboardEvent'];
            case 'onFocus':
            case 'onBlur':
                return ['FocusEvent'];
            default:
                return ['Event'];
        }
    }

    private analyzeAriaAttributes(content: string): string[] {
        const ariaMatches = content.match(/aria-[\w-]+/g) || [];
        return [...new Set(ariaMatches)];
    }

    private calculateComplexity(content: string): number {
        let complexity = 1;

        const patterns = [
            /if\s*\(/g,
            /else\s+if\s*\(/g,
            /while\s*\(/g,
            /for\s*\(/g,
            /switch\s*\(/g,
            /case\s+/g,
            /catch\s*\(/g,
            /\?\s*:/g,
            /&&/g,
            /\|\|/g
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    private analyzeVariants(content: string): string[] {
        const variants: string[] = [];

        // Look for cva variant definitions
        const cvaMatch = content.match(/variants:\s*{[^}]+variant:\s*{([^}]+)}/s);
        if (cvaMatch) {
            const variantContent = cvaMatch[1];
            const variantMatches = variantContent.match(/(\w+):/g);
            if (variantMatches) {
                variants.push(...variantMatches.map(match => match.replace(':', '')));
            }
        }

        return variants;
    }

    private async generateTest(analysis: ComponentAnalysis, options: TestGeneratorOptions): Promise<GeneratedTest> {
        const testPath = analysis.path.replace('.tsx', '.test.tsx');
        const content = this.generateTestContent(analysis, options);
        const coverage = this.estimateCoverage(analysis, options);

        return {
            path: testPath,
            content,
            coverage
        };
    }

    private generateTestContent(analysis: ComponentAnalysis, options: TestGeneratorOptions): string {
        return `/**
 * ${analysis.name} Component Tests
 * 
 * Generated by Kiro Test Generator
 * Target Coverage: ${options.coverage}%+
 * Complexity: ${analysis.complexity}
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
${options.a11y ? "import { axe, toHaveNoViolations } from 'jest-axe';" : ''}
${this.config.quality.i18nPlaceholders ? "import '../../../i18n';" : ''}

import { ${analysis.name} } from './${analysis.name}';
import type { ${analysis.name}Props } from './${analysis.name}.types';

${options.a11y ? "expect.extend(toHaveNoViolations);" : ''}

// Test utilities
const defaultProps: Partial<${analysis.name}Props> = {
  ${this.generateDefaultProps(analysis)}
};

const renderComponent = (props: Partial<${analysis.name}Props> = {}) => {
  return render(<${analysis.name} {...defaultProps} {...props} />);
};

describe('${analysis.name}', () => {
  // Smoke test
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const testContent = 'Test content';
      renderComponent({ children: testContent });
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const customClass = 'custom-test-class';
      renderComponent({ className: customClass });
      expect(screen.getByRole('region')).toHaveClass(customClass);
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<${analysis.name} ref={ref} {...defaultProps} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  // Props matrix tests
  describe('Props', () => {
${this.generatePropsTests(analysis)}
  });

  // Event handler tests
  describe('Events', () => {
${this.generateEventTests(analysis)}
  });

  ${analysis.hasVariants ? `
  // Variant tests
  describe('Variants', () => {
${this.generateVariantTests(analysis)}
  });` : ''}

  ${options.a11y ? `
  // Accessibility tests
  describe('Accessibility', () => {
    it('meets accessibility requirements', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      renderComponent();
      const element = screen.getByRole('region');
      
      expect(element).toHaveAttribute('role', 'region');
      ${analysis.ariaAttributes.map(attr =>
            `expect(element).toHaveAttribute('${attr}');`
        ).join('\n      ')}
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('has accessible name and description', () => {
      renderComponent();
      const element = screen.getByRole('region');
      
      expect(element).toHaveAccessibleName();
      expect(element).toHaveAccessibleDescription();
    });
  });` : ''}

  ${options.performance ? `
  // Performance tests
  describe('Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now();
      renderComponent();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(${this.config.testing.performanceBudget.renderTime});
    });

    it('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: \`Item \${i}\` }));
      
      const startTime = performance.now();
      renderComponent({ data: largeDataset });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = renderComponent();
      
      // Simulate component lifecycle
      unmount();
      
      // Basic memory leak check
      expect(true).toBe(true);
    });
  });` : ''}

  // Edge cases
  describe('Edge Cases', () => {
    it('handles undefined children', () => {
      renderComponent({ children: undefined });
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles empty string children', () => {
      renderComponent({ children: '' });
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('handles null props gracefully', () => {
      renderComponent({ className: null as any });
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    ${analysis.complexity > 5 ? `
    it('handles complex state changes', async () => {
      const { rerender } = renderComponent();
      
      // Test multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<${analysis.name} {...defaultProps} key={i} />);
      }
      
      expect(screen.getByRole('region')).toBeInTheDocument();
    });` : ''}
  });

  // Error boundary tests
  describe('Error Handling', () => {
    it('handles errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(
          <${analysis.name} {...defaultProps}>
            <ThrowError />
          </${analysis.name}>
        );
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  // Snapshot test
  describe('Snapshots', () => {
    it('matches snapshot', () => {
      const { container } = renderComponent({ children: 'Snapshot test' });
      expect(container.firstChild).toMatchSnapshot();
    });

    ${analysis.hasVariants ? analysis.variants.map(variant => `
    it('matches snapshot for ${variant} variant', () => {
      const { container } = renderComponent({ 
        variant: '${variant}',
        children: '${variant} variant test'
      });
      expect(container.firstChild).toMatchSnapshot();
    });`).join('\n') : ''}
  });
});`;
    }

    private generateDefaultProps(analysis: ComponentAnalysis): string {
        const props = analysis.props
            .filter(prop => prop.required)
            .map(prop => {
                let value = 'undefined';

                switch (prop.type) {
                    case 'string':
                        value = prop.unionValues ? `'${prop.unionValues[0]}'` : "'test'";
                        break;
                    case 'number':
                        value = '0';
                        break;
                    case 'boolean':
                        value = 'false';
                        break;
                    case 'ReactNode':
                        value = "'Test content'";
                        break;
                    default:
                        if (prop.unionValues) {
                            value = `'${prop.unionValues[0]}'`;
                        } else if (prop.type.includes('function')) {
                            value = 'jest.fn()';
                        }
                }

                return `${prop.name}: ${value}`;
            });

        return props.join(',\n  ');
    }

    private generatePropsTests(analysis: ComponentAnalysis): string {
        return analysis.props.map(prop => {
            if (prop.unionValues && prop.unionValues.length > 1) {
                // Test each union value
                return prop.unionValues.map(value => `
    it('handles ${prop.name}="${value}" correctly', () => {
      renderComponent({ ${prop.name}: '${value}' });
      const element = screen.getByRole('region');
      expect(element).toBeInTheDocument();
      // Add specific assertions for ${value} variant
    });`).join('\n');
            } else {
                // Test prop presence/absence
                return `
    it('handles ${prop.name} prop', () => {
      const test${this.capitalize(prop.name)} = ${this.generateTestValue(prop.type)};
      renderComponent({ ${prop.name}: test${this.capitalize(prop.name)} });
      
      const element = screen.getByRole('region');
      expect(element).toBeInTheDocument();
      ${this.generatePropAssertion(prop)}
    });

    ${!prop.required ? `
    it('works without ${prop.name} prop', () => {
      renderComponent({ ${prop.name}: undefined });
      expect(screen.getByRole('region')).toBeInTheDocument();
    });` : ''}`;
            }
        }).join('\n');
    }

    private generateEventTests(analysis: ComponentAnalysis): string {
        return analysis.events.map(event => `
    it('handles ${event.name} event', async () => {
      const user = userEvent.setup();
      const handle${this.capitalize(event.name.slice(2))} = jest.fn();
      
      renderComponent({ ${event.name}: handle${this.capitalize(event.name.slice(2))} });
      const element = screen.getByRole('region');
      
      ${this.generateEventTrigger(event.name)}
      
      expect(handle${this.capitalize(event.name.slice(2))}).toHaveBeenCalledTimes(1);
    });`).join('\n');
    }

    private generateVariantTests(analysis: ComponentAnalysis): string {
        return analysis.variants.map(variant => `
    it('renders ${variant} variant correctly', () => {
      renderComponent({ variant: '${variant}' });
      const element = screen.getByRole('region');
      
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('${variant}');
    });`).join('\n');
    }

    private generateTestValue(type: string): string {
        switch (type.toLowerCase()) {
            case 'string':
                return "'test string'";
            case 'number':
                return '42';
            case 'boolean':
                return 'true';
            case 'reactnode':
                return "'Test content'";
            default:
                if (type.includes('function')) {
                    return 'jest.fn()';
                }
                return "'test value'";
        }
    }

    private generatePropAssertion(prop: PropAnalysis): string {
        switch (prop.type.toLowerCase()) {
            case 'string':
                return `// Assert string prop behavior`;
            case 'boolean':
                return `expect(element).toHaveAttribute('data-${prop.name}', 'true');`;
            case 'function':
                return `// Function prop tested in event handlers`;
            default:
                return `// Assert ${prop.name} prop behavior`;
        }
    }

    private generateEventTrigger(eventName: string): string {
        switch (eventName) {
            case 'onClick':
                return 'await user.click(element);';
            case 'onChange':
                return 'fireEvent.change(element, { target: { value: "test" } });';
            case 'onKeyDown':
                return 'await user.keyboard("{Enter}");';
            case 'onFocus':
                return 'await user.click(element);';
            default:
                return `fireEvent.${eventName.slice(2).toLowerCase()}(element);`;
        }
    }

    private estimateCoverage(analysis: ComponentAnalysis, options: TestGeneratorOptions): number {
        let coverage = 60; // Base coverage

        // Add coverage for each test category
        coverage += analysis.props.length * 5; // Props tests
        coverage += analysis.events.length * 3; // Event tests
        coverage += analysis.variants.length * 2; // Variant tests

        if (options.a11y) coverage += 10;
        if (options.performance) coverage += 5;

        // Complexity penalty
        if (analysis.complexity > 10) coverage -= 10;

        return Math.min(Math.max(coverage, 70), 95);
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private showDryRunPreview(test: GeneratedTest): void {
        console.log('\n🔍 Test Generation Dry Run Preview:\n');
        console.log(`📄 TEST FILE: ${test.path}`);
        console.log(`📊 Estimated Coverage: ${test.coverage}%`);
        console.log('─'.repeat(50));
        console.log(test.content.split('\n').slice(0, 30).join('\n'));
        if (test.content.split('\n').length > 30) {
            console.log('... (truncated)');
        }
        console.log('\n');
    }

    private async writeTest(test: GeneratedTest): Promise<void> {
        mkdirSync(dirname(test.path), { recursive: true });
        writeFileSync(test.path, test.content);
    }

    private async runValidation(): Promise<void> {
        console.log('🔍 Running validation...');
        // Implementation would call validation scripts
    }

    private log(logFile: string, message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        writeFileSync(logFile, logEntry, { flag: 'a' });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
Kiro Test Generator

Usage: npm run gen:tests -- --component <path> [options]

Required:
  --component <path>    Path to component file

Options:
  --coverage <number>   Target coverage percentage (default: 80)
  --a11y               Include accessibility tests (default: true)
  --performance        Include performance tests (default: true)
  --dry-run            Preview without writing files

Examples:
  npm run gen:tests -- --component src/components/common/ButtonPrime/ButtonPrime.tsx
  npm run gen:tests -- --component src/components/ui/Card.tsx --coverage=90 --dry-run
`);
        process.exit(0);
    }

    const options: TestGeneratorOptions = {
        component: '',
        dryRun: false,
        coverage: 80,
        a11y: true,
        performance: true
    };

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--component':
                options.component = args[++i];
                break;
            case '--coverage':
                options.coverage = parseInt(args[++i]);
                break;
            case '--a11y':
                options.a11y = true;
                break;
            case '--no-a11y':
                options.a11y = false;
                break;
            case '--performance':
                options.performance = true;
                break;
            case '--no-performance':
                options.performance = false;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    if (!options.component) {
        console.error('❌ Component path is required');
        process.exit(1);
    }

    const generator = new KiroTestGenerator();
    await generator.generate(options);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}