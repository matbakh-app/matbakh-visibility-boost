/**
 * Code Generation Tools - Main Entry Point
 * 
 * This module provides comprehensive code generation capabilities for the matbakh.app system:
 * - Kiro-compliant component generation
 * - API client generation from OpenAPI specs
 * - Test case generation based on component analysis
 * - Automatic documentation generation with JSDoc
 * 
 * Requirements: 3.2, 3.3 (Developer Experience Enhancement)
 */

export { ApiClientGenerator } from './api-client-generator';
export { ComponentGenerator } from './component-generator';
export { DocumentationGenerator } from './documentation-generator';
export { CodeGenerationOrchestrator } from './orchestrator';
export { TestCaseGenerator } from './test-case-generator';

export type {
    ApiSchema, CodeGenerationConfig, ComponentSpec, GeneratedApiClient, GeneratedComponent, GeneratedDocumentation, TestSuite
} from './types';
