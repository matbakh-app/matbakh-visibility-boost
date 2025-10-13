/**
 * Code Generation Demo Page
 * 
 * Interactive demo of the code generation tools
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeGenerationOrchestrator } from '@/lib/code-generation/orchestrator';
import { ApiSchema, CodeGenerationConfig, ComponentSpec } from '@/lib/code-generation/types';
import { useState } from 'react';

const defaultConfig: CodeGenerationConfig = {
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

export function CodeGenerationDemo() {
    const [activeTab, setActiveTab] = useState('component');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<any>(null);

    // Component generation state
    const [componentName, setComponentName] = useState('MyButton');
    const [componentType, setComponentType] = useState<'ui' | 'feature' | 'page' | 'layout'>('ui');
    const [componentProps, setComponentProps] = useState('variant:string,size:string,onClick:function');
    const [features, setFeatures] = useState({
        tests: true,
        stories: true,
        docs: true,
        i18n: true,
        accessibility: true
    });

    // API client generation state
    const [apiTitle, setApiTitle] = useState('User API');
    const [apiVersion, setApiVersion] = useState('1.0.0');
    const [apiDescription, setApiDescription] = useState('User management API');
    const [apiBaseUrl, setApiBaseUrl] = useState('https://api.example.com');

    const handleGenerateComponent = async () => {
        setIsGenerating(true);
        setGenerationResult(null);

        try {
            const orchestrator = new CodeGenerationOrchestrator(defaultConfig);

            // Parse props
            const props: Record<string, string> = {};
            if (componentProps) {
                componentProps.split(',').forEach(prop => {
                    const [name, type] = prop.split(':');
                    if (name && type) {
                        props[name.trim()] = type.trim();
                    }
                });
            }

            const spec: ComponentSpec = {
                name: componentName,
                type: componentType,
                props,
                styling: 'tailwind',
                storybook: features.stories,
                tests: features.tests,
                documentation: features.docs,
                i18n: features.i18n,
                accessibility: features.accessibility
            };

            const result = await orchestrator.generateComponent(spec);
            setGenerationResult(result);

        } catch (error) {
            setGenerationResult({
                success: false,
                errors: [error instanceof Error ? error.message : String(error)]
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateApiClient = async () => {
        setIsGenerating(true);
        setGenerationResult(null);

        try {
            const orchestrator = new CodeGenerationOrchestrator(defaultConfig);

            // Create a sample OpenAPI schema
            const schema: ApiSchema = {
                openapi: '3.0.0',
                info: {
                    title: apiTitle,
                    version: apiVersion,
                    description: apiDescription
                },
                servers: [
                    {
                        url: apiBaseUrl,
                        description: 'API server'
                    }
                ],
                paths: {
                    '/users': {
                        get: {
                            operationId: 'getUsers',
                            summary: 'Get all users',
                            responses: {
                                '200': {
                                    description: 'List of users',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/User' }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        post: {
                            operationId: 'createUser',
                            summary: 'Create a new user',
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: { $ref: '#/components/schemas/CreateUserRequest' }
                                    }
                                }
                            },
                            responses: {
                                '201': {
                                    description: 'User created',
                                    content: {
                                        'application/json': {
                                            schema: { $ref: '#/components/schemas/User' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '/users/{id}': {
                        get: {
                            operationId: 'getUserById',
                            summary: 'Get user by ID',
                            parameters: [
                                {
                                    name: 'id',
                                    in: 'path',
                                    required: true,
                                    schema: { type: 'string' }
                                }
                            ],
                            responses: {
                                '200': {
                                    description: 'User details',
                                    content: {
                                        'application/json': {
                                            schema: { $ref: '#/components/schemas/User' }
                                        }
                                    }
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
                                email: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' }
                            },
                            required: ['id', 'name', 'email']
                        },
                        CreateUserRequest: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string' }
                            },
                            required: ['name', 'email']
                        }
                    }
                }
            };

            const result = await orchestrator.generateApiClient(schema);
            setGenerationResult(result);

        } catch (error) {
            setGenerationResult({
                success: false,
                errors: [error instanceof Error ? error.message : String(error)]
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Code Generation Tools</h1>
                <p className="text-muted-foreground">
                    Interactive demo of the Kiro-compliant code generation system. Generate components, API clients, tests, and documentation.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="component">Component Generator</TabsTrigger>
                    <TabsTrigger value="api">API Client Generator</TabsTrigger>
                    <TabsTrigger value="tests">Test Generator</TabsTrigger>
                    <TabsTrigger value="docs">Documentation Generator</TabsTrigger>
                </TabsList>

                <TabsContent value="component" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Component Generator</CardTitle>
                            <CardDescription>
                                Generate Kiro-compliant React components with TypeScript, tests, stories, and documentation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="component-name">Component Name</Label>
                                    <Input
                                        id="component-name"
                                        value={componentName}
                                        onChange={(e) => setComponentName(e.target.value)}
                                        placeholder="MyButton"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="component-type">Component Type</Label>
                                    <Select value={componentType} onValueChange={(value: any) => setComponentType(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ui">UI Component</SelectItem>
                                            <SelectItem value="feature">Feature Component</SelectItem>
                                            <SelectItem value="page">Page Component</SelectItem>
                                            <SelectItem value="layout">Layout Component</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="component-props">Props (name:type,name:type)</Label>
                                <Input
                                    id="component-props"
                                    value={componentProps}
                                    onChange={(e) => setComponentProps(e.target.value)}
                                    placeholder="variant:string,size:string,onClick:function"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Features</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(features).map(([key, value]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={key}
                                                checked={value}
                                                onCheckedChange={(checked) =>
                                                    setFeatures(prev => ({ ...prev, [key]: !!checked }))
                                                }
                                            />
                                            <Label htmlFor={key} className="capitalize">
                                                {key === 'i18n' ? 'Internationalization' : key}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateComponent}
                                disabled={isGenerating || !componentName}
                                className="w-full"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Component'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Client Generator</CardTitle>
                            <CardDescription>
                                Generate TypeScript API clients from OpenAPI specifications with React hooks integration.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="api-title">API Title</Label>
                                    <Input
                                        id="api-title"
                                        value={apiTitle}
                                        onChange={(e) => setApiTitle(e.target.value)}
                                        placeholder="User API"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="api-version">Version</Label>
                                    <Input
                                        id="api-version"
                                        value={apiVersion}
                                        onChange={(e) => setApiVersion(e.target.value)}
                                        placeholder="1.0.0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-description">Description</Label>
                                <Input
                                    id="api-description"
                                    value={apiDescription}
                                    onChange={(e) => setApiDescription(e.target.value)}
                                    placeholder="User management API"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-base-url">Base URL</Label>
                                <Input
                                    id="api-base-url"
                                    value={apiBaseUrl}
                                    onChange={(e) => setApiBaseUrl(e.target.value)}
                                    placeholder="https://api.example.com"
                                />
                            </div>

                            <Button
                                onClick={handleGenerateApiClient}
                                disabled={isGenerating || !apiTitle}
                                className="w-full"
                            >
                                {isGenerating ? 'Generating...' : 'Generate API Client'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tests" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Generator</CardTitle>
                            <CardDescription>
                                Generate comprehensive test suites with unit, integration, accessibility, and performance tests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    Test generation is available via CLI:
                                </p>
                                <code className="bg-muted px-3 py-2 rounded text-sm">
                                    npm run generate:tests src/components/MyComponent.tsx
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="docs" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentation Generator</CardTitle>
                            <CardDescription>
                                Generate comprehensive documentation with JSDoc integration and interactive guides.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    Documentation generation is available via CLI:
                                </p>
                                <code className="bg-muted px-3 py-2 rounded text-sm">
                                    npm run generate:docs
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {generationResult && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Generation Result
                            <Badge variant={generationResult.success ? 'default' : 'destructive'}>
                                {generationResult.success ? 'Success' : 'Failed'}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {generationResult.success ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Generated Files ({generationResult.files?.length || 0})</h4>
                                    <div className="space-y-2">
                                        {generationResult.files?.map((file: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <span className="font-mono text-sm">{file.path}</span>
                                                <Badge variant="outline">{file.type}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {generationResult.metrics && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Metrics</h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Files:</span>
                                                <span className="ml-2 font-mono">{generationResult.metrics.filesGenerated}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Lines:</span>
                                                <span className="ml-2 font-mono">{generationResult.metrics.linesGenerated}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Duration:</span>
                                                <span className="ml-2 font-mono">{Math.round(generationResult.metrics.duration)}ms</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {generationResult.warnings?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-yellow-600">Warnings</h4>
                                        <ul className="space-y-1">
                                            {generationResult.warnings.map((warning: string, index: number) => (
                                                <li key={index} className="text-sm text-yellow-600">• {warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h4 className="font-semibold mb-2 text-red-600">Errors</h4>
                                <ul className="space-y-1">
                                    {generationResult.errors?.map((error: string, index: number) => (
                                        <li key={index} className="text-sm text-red-600">• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>CLI Usage</CardTitle>
                    <CardDescription>
                        Use these commands to generate code from the command line:
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Component Generation</h4>
                        <code className="block bg-muted p-3 rounded text-sm">
                            npm run generate:component MyButton --type=ui --props="variant:string,size:string"
                        </code>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">API Client Generation</h4>
                        <code className="block bg-muted p-3 rounded text-sm">
                            npm run generate:api-client openapi.json
                        </code>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Test Generation</h4>
                        <code className="block bg-muted p-3 rounded text-sm">
                            npm run generate:tests src/components --recursive
                        </code>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Documentation Generation</h4>
                        <code className="block bg-muted p-3 rounded text-sm">
                            npm run generate:docs
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}