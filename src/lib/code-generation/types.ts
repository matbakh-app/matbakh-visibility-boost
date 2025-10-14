/**
 * Type definitions for code generation tools
 */

export interface ComponentSpec {
    name: string;
    type: 'ui' | 'feature' | 'page' | 'layout';
    props?: Record<string, string>;
    children?: ComponentSpec[];
    styling?: 'tailwind' | 'css-modules' | 'styled-components';
    storybook?: boolean;
    tests?: boolean;
    documentation?: boolean;
    i18n?: boolean;
    accessibility?: boolean;
}

export interface GeneratedComponent {
    name: string;
    path: string;
    content: string;
    tests?: string;
    stories?: string;
    documentation?: string;
    types?: string;
}

export interface ApiSchema {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, any>;
    components?: {
        schemas?: Record<string, any>;
        responses?: Record<string, any>;
        parameters?: Record<string, any>;
    };
}

export interface GeneratedApiClient {
    name: string;
    path: string;
    content: string;
    types: string;
    hooks?: string;
    tests?: string;
}

export interface TestCase {
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    content: string;
    setup?: string;
    teardown?: string;
}

export interface TestSuite {
    name: string;
    path: string;
    testCases: TestCase[];
    setup?: string;
    teardown?: string;
    config?: string;
}

export interface GeneratedDocumentation {
    name: string;
    path: string;
    content: string;
    format: 'markdown' | 'html' | 'json';
    sections: {
        overview?: string;
        api?: string;
        examples?: string;
        changelog?: string;
    };
}

export interface CodeGenerationConfig {
    outputDir: string;
    templates: {
        component: string;
        test: string;
        story: string;
        documentation: string;
    };
    conventions: {
        naming: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case';
        fileExtension: '.tsx' | '.ts' | '.js' | '.jsx';
        testSuffix: '.test' | '.spec';
    };
    features: {
        typescript: boolean;
        storybook: boolean;
        testing: boolean;
        documentation: boolean;
        i18n: boolean;
        accessibility: boolean;
    };
}

export interface ComponentAnalysis {
    name: string;
    path: string;
    type: string;
    props: Array<{
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }>;
    dependencies: string[];
    exports: string[];
    complexity: number;
    testCoverage?: number;
}

export interface CodeAnalysis {
    files: ComponentAnalysis[];
    dependencies: Record<string, string[]>;
    patterns: string[];
    metrics: {
        totalFiles: number;
        totalLines: number;
        complexity: number;
        testCoverage: number;
    };
}

export interface GenerationResult {
    success: boolean;
    files: Array<{
        path: string;
        content: string;
        type: 'component' | 'test' | 'story' | 'documentation' | 'types';
    }>;
    errors?: string[];
    warnings?: string[];
    metrics?: {
        filesGenerated: number;
        linesGenerated: number;
        duration: number;
    };
}