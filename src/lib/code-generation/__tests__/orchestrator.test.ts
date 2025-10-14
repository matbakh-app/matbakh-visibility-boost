/**
 * Code Generation Orchestrator Tests
 */

import { CodeGenerationOrchestrator } from '../orchestrator';
import { ApiSchema, CodeGenerationConfig, ComponentSpec } from '../types';

const mockConfig: CodeGenerationConfig = {
    outputDir: 'src',
    templates: {
        component: 'ui-component',
        test: 'unit-test',
        story: 'default-story',
        documentation: 'component-docs'
    },
    conventions: {
        naming: 'PascalCase',
        fileExtension: '.tsx',
        testSuffix: '.test'
    },
    features: {
        typescript: true,
        storybook: true,
        testing: true,
        documentation: true,
        i18n: true,
        accessibility: true
    }
};

describe('CodeGenerationOrchestrator', () => {
    let orchestrator: CodeGenerationOrchestrator;

    beforeEach(() => {
        orchestrator = new CodeGenerationOrchestrator(mockConfig);
    });

    describe('generateComponent', () => {
        it('generates a complete component with all files', async () => {
            const spec: ComponentSpec = {
                name: 'TestButton',
                type: 'ui',
                props: {
                    variant: 'string',
                    size: 'string',
                    onClick: 'function'
                },
                styling: 'tailwind',
                storybook: true,
                tests: true,
                documentation: true,
                i18n: true,
                accessibility: true
            };

            const result = await orchestrator.generateComponent(spec);

            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(5); // component, types, tests, stories, docs
            expect(result.files[0].type).toBe('component');
            expect(result.files[0].path).toContain('TestButton.tsx');
            expect(result.files[0].content).toContain('TestButton');
            expect(result.metrics?.filesGenerated).toBe(5);
        });

        it('generates minimal component without optional features', async () => {
            const spec: ComponentSpec = {
                name: 'SimpleComponent',
                type: 'ui',
                styling: 'tailwind',
                storybook: false,
                tests: false,
                documentation: false,
                i18n: false,
                accessibility: false
            };

            const result = await orchestrator.generateComponent(spec);

            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(2); // component and types only
            expect(result.files[0].content).toContain('SimpleComponent');
        });

        it('handles component generation errors gracefully', async () => {
            const spec: ComponentSpec = {
                name: '', // Invalid name
                type: 'ui',
                styling: 'tailwind'
            };

            const result = await orchestrator.generateComponent(spec);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
        });
    });

    describe('generateApiClient', () => {
        it('generates API client from OpenAPI schema', async () => {
            const schema: ApiSchema = {
                openapi: '3.0.0',
                info: {
                    title: 'Test API',
                    version: '1.0.0',
                    description: 'Test API for code generation'
                },
                servers: [
                    {
                        url: 'https://api.test.com',
                        description: 'Test server'
                    }
                ],
                paths: {
                    '/users': {
                        get: {
                            operationId: 'getUsers',
                            summary: 'Get all users',
                            responses: {
                                '200': {
                                    description: 'Success'
                                }
                            }
                        },
                        post: {
                            operationId: 'createUser',
                            summary: 'Create a user',
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object'
                                        }
                                    }
                                }
                            },
                            responses: {
                                '201': {
                                    description: 'Created'
                                }
                            }
                        }
                    }
                },
                components: {
                    schemas: {
                        User: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' }
                            }
                        }
                    }
                }
            };

            const result = await orchestrator.generateApiClient(schema);

            expect(result.success).toBe(true);
            expect(result.files).toHaveLength(4); // client, types, hooks, tests
            expect(result.files[0].content).toContain('TestApiClient');
            expect(result.files[0].content).toContain('getUsers');
            expect(result.files[0].content).toContain('createUser');
        });

        it('handles invalid OpenAPI schema', async () => {
            const invalidSchema = {} as ApiSchema;

            const result = await orchestrator.generateApiClient(invalidSchema);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });

    describe('generateFeature', () => {
        it('generates complete feature with component and API client', async () => {
            const componentSpec: ComponentSpec = {
                name: 'UserProfile',
                type: 'feature',
                props: {
                    user: 'User',
                    onUpdate: 'function'
                },
                styling: 'tailwind',
                storybook: true,
                tests: true,
                documentation: true,
                i18n: true,
                accessibility: true
            };

            const apiSchema: ApiSchema = {
                openapi: '3.0.0',
                info: {
                    title: 'User API',
                    version: '1.0.0'
                },
                paths: {
                    '/users/{id}': {
                        get: {
                            operationId: 'getUser',
                            parameters: [
                                {
                                    name: 'id',
                                    in: 'path',
                                    required: true,
                                    schema: { type: 'string' }
                                }
                            ],
                            responses: {
                                '200': { description: 'Success' }
                            }
                        }
                    }
                }
            };

            const result = await orchestrator.generateFeature({
                componentSpec,
                apiSchema,
                generateTests: true,
                generateDocs: true
            });

            expect(result.success).toBe(true);
            expect(result.files.length).toBeGreaterThan(5);
            expect(result.files.some(f => f.content.includes('UserProfile'))).toBe(true);
            expect(result.files.some(f => f.content.includes('UserApiClient'))).toBe(true);
        });
    });

    describe('validateGeneratedCode', () => {
        it('validates generated code successfully', async () => {
            const files = [
                {
                    path: 'src/components/TestComponent.tsx',
                    content: `
import React from 'react';

export function TestComponent() {
  return <div>Test</div>;
}
          `,
                    type: 'component' as const
                },
                {
                    path: 'src/components/TestComponent.test.tsx',
                    content: `
import { render } from '@testing-library/react';
import { TestComponent } from './TestComponent';

describe('TestComponent', () => {
  it('renders', () => {
    render(<TestComponent />);
  });
});
          `,
                    type: 'test' as const
                }
            ];

            const validation = await orchestrator.validateGeneratedCode(files);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('detects validation errors', async () => {
            const files = [
                {
                    path: 'src/components/EmptyComponent.tsx',
                    content: '',
                    type: 'component' as const
                },
                {
                    path: 'src/components/InvalidTest.test.tsx',
                    content: 'console.log("not a test");',
                    type: 'test' as const
                }
            ];

            const validation = await orchestrator.validateGeneratedCode(files);

            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors[0]).toContain('Empty file');
            expect(validation.errors[1]).toContain('Invalid test file structure');
        });
    });

    describe('performance', () => {
        it('generates components within reasonable time', async () => {
            const spec: ComponentSpec = {
                name: 'PerformanceTest',
                type: 'ui',
                styling: 'tailwind',
                storybook: true,
                tests: true,
                documentation: true
            };

            const startTime = performance.now();
            const result = await orchestrator.generateComponent(spec);
            const endTime = performance.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
            expect(result.metrics?.duration).toBeLessThan(1000);
        });
    });

    describe('error handling', () => {
        it('handles template rendering errors', async () => {
            const invalidConfig = {
                ...mockConfig,
                templates: {
                    ...mockConfig.templates,
                    component: 'non-existent-template'
                }
            };

            const orchestratorWithInvalidConfig = new CodeGenerationOrchestrator(invalidConfig);

            const spec: ComponentSpec = {
                name: 'TestComponent',
                type: 'ui',
                styling: 'tailwind'
            };

            const result = await orchestratorWithInvalidConfig.generateComponent(spec);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        it('provides helpful error messages', async () => {
            const spec: ComponentSpec = {
                name: 'Test Component', // Invalid name with space
                type: 'ui',
                styling: 'tailwind'
            };

            const result = await orchestrator.generateComponent(spec);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors![0]).toContain('Component generation failed');
        });
    });
});