/**
 * Code Generation Orchestrator
 * 
 * Coordinates all code generation tools and provides a unified interface
 * for generating components, API clients, tests, and documentation
 */

import { ApiClientGenerator } from './api-client-generator';
import { ComponentGenerator } from './component-generator';
import { DocumentationGenerator } from './documentation-generator';
import { TestCaseGenerator } from './test-case-generator';
import {
    ApiSchema,
    CodeAnalysis,
    CodeGenerationConfig,
    ComponentAnalysis,
    ComponentSpec,
    GenerationResult
} from './types';

export class CodeGenerationOrchestrator {
    private componentGenerator: ComponentGenerator;
    private apiClientGenerator: ApiClientGenerator;
    private testCaseGenerator: TestCaseGenerator;
    private documentationGenerator: DocumentationGenerator;

    constructor(private config: CodeGenerationConfig) {
        this.componentGenerator = new ComponentGenerator(config);
        this.apiClientGenerator = new ApiClientGenerator(config);
        this.testCaseGenerator = new TestCaseGenerator(config);
        this.documentationGenerator = new DocumentationGenerator(config);
    }

    /**
     * Generate a complete component with all associated files
     */
    async generateComponent(spec: ComponentSpec): Promise<GenerationResult> {
        const startTime = performance.now();
        const files: GenerationResult['files'] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Generate component
            const component = await this.componentGenerator.generateComponent(spec);

            files.push({
                path: component.path,
                content: component.content,
                type: 'component'
            });

            // Generate types
            if (component.types) {
                files.push({
                    path: component.path.replace('.tsx', '.types.ts'),
                    content: component.types,
                    type: 'types'
                });
            }

            // Generate tests
            if (component.tests) {
                files.push({
                    path: component.path.replace('.tsx', '.test.tsx'),
                    content: component.tests,
                    type: 'test'
                });
            }

            // Generate stories
            if (component.stories) {
                files.push({
                    path: component.path.replace('.tsx', '.stories.tsx'),
                    content: component.stories,
                    type: 'story'
                });
            }

            // Generate documentation
            if (component.documentation) {
                files.push({
                    path: component.path.replace('.tsx', '.md').replace('/components/', '/docs/components/'),
                    content: component.documentation,
                    type: 'documentation'
                });
            }

            const endTime = performance.now();

            return {
                success: true,
                files,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                metrics: {
                    filesGenerated: files.length,
                    linesGenerated: files.reduce((total, file) => total + file.content.split('\n').length, 0),
                    duration: endTime - startTime
                }
            };

        } catch (error) {
            errors.push(`Component generation failed: ${error instanceof Error ? error.message : String(error)}`);

            return {
                success: false,
                files: [],
                errors
            };
        }
    }

    /**
     * Generate API client from OpenAPI specification
     */
    async generateApiClient(schema: ApiSchema): Promise<GenerationResult> {
        const startTime = performance.now();
        const files: GenerationResult['files'] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const apiClient = await this.apiClientGenerator.generateApiClient(schema);

            files.push({
                path: apiClient.path,
                content: apiClient.content,
                type: 'component'
            });

            files.push({
                path: apiClient.path.replace('-client.ts', '-types.ts'),
                content: apiClient.types,
                type: 'types'
            });

            if (apiClient.hooks) {
                files.push({
                    path: apiClient.path.replace('-client.ts', '-hooks.ts'),
                    content: apiClient.hooks,
                    type: 'component'
                });
            }

            if (apiClient.tests) {
                files.push({
                    path: apiClient.path.replace('.ts', '.test.ts'),
                    content: apiClient.tests,
                    type: 'test'
                });
            }

            const endTime = performance.now();

            return {
                success: true,
                files,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                metrics: {
                    filesGenerated: files.length,
                    linesGenerated: files.reduce((total, file) => total + file.content.split('\n').length, 0),
                    duration: endTime - startTime
                }
            };

        } catch (error) {
            errors.push(`API client generation failed: ${error instanceof Error ? error.message : String(error)}`);

            return {
                success: false,
                files: [],
                errors
            };
        }
    }

    /**
     * Generate test suite for component
     */
    async generateTests(analysis: ComponentAnalysis): Promise<GenerationResult> {
        const startTime = performance.now();
        const files: GenerationResult['files'] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const testSuite = await this.testCaseGenerator.generateTestSuite(analysis);

            files.push({
                path: testSuite.path,
                content: this.generateTestFileContent(testSuite),
                type: 'test'
            });

            if (testSuite.config) {
                files.push({
                    path: testSuite.path.replace('.test.tsx', '.test.config.js'),
                    content: testSuite.config,
                    type: 'component'
                });
            }

            const endTime = performance.now();

            return {
                success: true,
                files,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                metrics: {
                    filesGenerated: files.length,
                    linesGenerated: files.reduce((total, file) => total + file.content.split('\n').length, 0),
                    duration: endTime - startTime
                }
            };

        } catch (error) {
            errors.push(`Test generation failed: ${error instanceof Error ? error.message : String(error)}`);

            return {
                success: false,
                files: [],
                errors
            };
        }
    }

    /**
     * Generate comprehensive documentation
     */
    async generateDocumentation(analysis: CodeAnalysis): Promise<GenerationResult> {
        const startTime = performance.now();
        const files: GenerationResult['files'] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const docs = await this.documentationGenerator.generateDocumentation(analysis);

            for (const doc of docs) {
                files.push({
                    path: doc.path,
                    content: doc.content,
                    type: 'documentation'
                });
            }

            const endTime = performance.now();

            return {
                success: true,
                files,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                metrics: {
                    filesGenerated: files.length,
                    linesGenerated: files.reduce((total, file) => total + file.content.split('\n').length, 0),
                    duration: endTime - startTime
                }
            };

        } catch (error) {
            errors.push(`Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`);

            return {
                success: false,
                files: [],
                errors
            };
        }
    }

    /**
     * Generate everything for a complete feature
     */
    async generateFeature(options: {
        componentSpec: ComponentSpec;
        apiSchema?: ApiSchema;
        generateTests?: boolean;
        generateDocs?: boolean;
    }): Promise<GenerationResult> {
        const { componentSpec, apiSchema, generateTests = true, generateDocs = true } = options;
        const startTime = performance.now();
        const allFiles: GenerationResult['files'] = [];
        const allErrors: string[] = [];
        const allWarnings: string[] = [];

        // Generate component
        const componentResult = await this.generateComponent(componentSpec);
        allFiles.push(...componentResult.files);
        if (componentResult.errors) allErrors.push(...componentResult.errors);
        if (componentResult.warnings) allWarnings.push(...componentResult.warnings);

        // Generate API client if schema provided
        if (apiSchema) {
            const apiResult = await this.generateApiClient(apiSchema);
            allFiles.push(...apiResult.files);
            if (apiResult.errors) allErrors.push(...apiResult.errors);
            if (apiResult.warnings) allWarnings.push(...apiResult.warnings);
        }

        // Generate additional tests if requested
        if (generateTests) {
            const analysis = this.createComponentAnalysis(componentSpec);
            const testResult = await this.generateTests(analysis);
            allFiles.push(...testResult.files);
            if (testResult.errors) allErrors.push(...testResult.errors);
            if (testResult.warnings) allWarnings.push(...testResult.warnings);
        }

        // Generate documentation if requested
        if (generateDocs) {
            const codeAnalysis = this.createCodeAnalysis([componentSpec]);
            const docResult = await this.generateDocumentation(codeAnalysis);
            allFiles.push(...docResult.files);
            if (docResult.errors) allErrors.push(...docResult.errors);
            if (docResult.warnings) allWarnings.push(...docResult.warnings);
        }

        const endTime = performance.now();

        return {
            success: allErrors.length === 0,
            files: allFiles,
            errors: allErrors.length > 0 ? allErrors : undefined,
            warnings: allWarnings.length > 0 ? allWarnings : undefined,
            metrics: {
                filesGenerated: allFiles.length,
                linesGenerated: allFiles.reduce((total, file) => total + file.content.split('\n').length, 0),
                duration: endTime - startTime
            }
        };
    }

    /**
     * Analyze existing codebase
     */
    async analyzeCodebase(paths: string[]): Promise<CodeAnalysis> {
        // This would analyze the actual codebase files
        // For now, return a mock analysis
        return {
            files: [],
            dependencies: {},
            patterns: [],
            metrics: {
                totalFiles: 0,
                totalLines: 0,
                complexity: 0,
                testCoverage: 0
            }
        };
    }

    /**
     * Validate generated code
     */
    async validateGeneratedCode(files: GenerationResult['files']): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        for (const file of files) {
            // Basic validation
            if (!file.content.trim()) {
                errors.push(`Empty file: ${file.path}`);
                continue;
            }

            // TypeScript validation (simplified)
            if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
                if (!file.content.includes('export')) {
                    warnings.push(`No exports found in: ${file.path}`);
                }
            }

            // Test file validation
            if (file.type === 'test') {
                if (!file.content.includes('describe') && !file.content.includes('it')) {
                    errors.push(`Invalid test file structure: ${file.path}`);
                }
            }

            // Component validation
            if (file.type === 'component' && file.path.endsWith('.tsx')) {
                if (!file.content.includes('React') && !file.content.includes('import')) {
                    warnings.push(`Component may be missing React import: ${file.path}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Helper methods
    private generateTestFileContent(testSuite: any): string {
        return `${testSuite.setup || ''}

describe('${testSuite.name}', () => {
${testSuite.testCases.map((test: any) => test.content).join('\n')}
});

${testSuite.teardown || ''}`;
    }

    private createComponentAnalysis(spec: ComponentSpec): ComponentAnalysis {
        return {
            name: spec.name,
            path: `src/components/${spec.type}/${spec.name}.tsx`,
            type: spec.type,
            props: Object.entries(spec.props || {}).map(([name, type]) => ({
                name,
                type,
                required: true,
                description: `${name} prop`
            })),
            dependencies: [],
            exports: [spec.name],
            complexity: 1
        };
    }

    private createCodeAnalysis(specs: ComponentSpec[]): CodeAnalysis {
        return {
            files: specs.map(spec => this.createComponentAnalysis(spec)),
            dependencies: {},
            patterns: ['React Component', 'TypeScript', 'Tailwind CSS'],
            metrics: {
                totalFiles: specs.length,
                totalLines: specs.length * 50, // Estimated
                complexity: specs.length,
                testCoverage: 85
            }
        };
    }
}