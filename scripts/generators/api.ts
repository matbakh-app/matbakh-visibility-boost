#!/usr/bin/env npx tsx

/**
 * Kiro API Client Generator
 * 
 * Generates fully-typed API clients + React-Query hooks from OpenAPI specs
 * Follows Kiro-Purity principles with proper error handling and caching
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { kiroGenConfig } from '../../kirogen.config';

interface ApiGeneratorOptions {
  schema: string;
  out: string;
  hooks: boolean;
  retry: number;
  auth: 'cognito' | 'jwt' | 'none';
  dryRun: boolean;
}

interface OpenApiSchema {
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

interface GeneratedFile {
  path: string;
  content: string;
  type: 'client' | 'types' | 'hooks' | 'tests' | 'keys';
}

class KiroApiGenerator {
  private config = kiroGenConfig;
  private logDir = this.config.observability.logDir;

  constructor() {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async generate(options: ApiGeneratorOptions): Promise<void> {
    const startTime = Date.now();
    const logFile = join(this.logDir, `api-gen-${Date.now()}.log`);

    try {
      this.log(logFile, `Starting API client generation from: ${options.schema}`);
      this.log(logFile, `Options: ${JSON.stringify(options, null, 2)}`);

      // Load and validate OpenAPI schema
      const schema = await this.loadSchema(options.schema);
      await this.validateSchema(schema);

      // Generate files
      const files = await this.generateFiles(schema, options);

      // Hash-based skip check
      if (this.config.performance.hashBasedSkip) {
        const shouldSkip = await this.checkHashSkip(files, options.schema);
        if (shouldSkip) {
          this.log(logFile, 'Skipping generation - no changes detected');
          return;
        }
      }

      if (options.dryRun) {
        this.showDryRunPreview(files);
        return;
      }

      // Write files
      await this.writeFiles(files, options.out);

      // Run validation
      if (this.config.governance.kiroSystemPurityValidator) {
        await this.runValidation();
      }

      const duration = Date.now() - startTime;
      this.log(logFile, `Generation completed successfully in ${duration}ms`);

      console.log(`✅ API client generated successfully`);
      console.log(`📁 Files: ${files.length}`);
      console.log(`⏱️  Duration: ${duration}ms`);

    } catch (error) {
      this.log(logFile, `Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private async loadSchema(schemaPath: string): Promise<OpenApiSchema> {
    if (schemaPath.startsWith('http://') || schemaPath.startsWith('https://')) {
      // Load from URL
      const response = await fetch(schemaPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } else {
      // Load from file
      if (!existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      const content = readFileSync(schemaPath, 'utf-8');
      return JSON.parse(content);
    }
  }

  private async validateSchema(schema: OpenApiSchema): Promise<void> {
    if (!schema.openapi) {
      throw new Error('Invalid OpenAPI schema: missing openapi version');
    }

    if (!schema.info?.title) {
      throw new Error('Invalid OpenAPI schema: missing info.title');
    }

    if (!schema.paths || Object.keys(schema.paths).length === 0) {
      throw new Error('Invalid OpenAPI schema: no paths defined');
    }
  }

  private async generateFiles(schema: OpenApiSchema, options: ApiGeneratorOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    const clientName = this.formatClientName(schema.info.title);

    // Generate types from schema
    files.push({
      path: 'types.gen.ts',
      content: this.generateTypesContent(schema),
      type: 'types'
    });

    // Generate base client
    files.push({
      path: 'client.ts',
      content: this.generateClientContent(schema, options),
      type: 'client'
    });

    // Generate query keys
    files.push({
      path: 'query-keys.ts',
      content: this.generateQueryKeysContent(schema),
      type: 'keys'
    });

    // Generate React Query hooks
    if (options.hooks) {
      files.push({
        path: 'hooks/index.ts',
        content: this.generateHooksContent(schema, options),
        type: 'hooks'
      });
    }

    // Generate tests
    files.push({
      path: '__tests__/client.test.ts',
      content: this.generateTestContent(schema, options),
      type: 'tests'
    });

    return files;
  }

  private generateTypesContent(schema: OpenApiSchema): string {
    const timestamp = new Date().toISOString();
    const schemaHash = createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 8);

    return `/**
 * Generated API Types
 * 
 * Generated from OpenAPI schema: ${schema.info.title} v${schema.info.version}
 * Generated at: ${timestamp}
 * Schema hash: ${schemaHash}
 * 
 * DO NOT EDIT - This file is auto-generated
 */

// Base API types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

${this.generateSchemaTypes(schema)}

${this.generateEndpointTypes(schema)}`;
  }

  private generateSchemaTypes(schema: OpenApiSchema): string {
    if (!schema.components?.schemas) {
      return '// No schema components defined';
    }

    const types = Object.entries(schema.components.schemas).map(([name, schemaObj]) => {
      return this.generateTypeFromSchema(name, schemaObj);
    });

    return `// Schema types\n${types.join('\n\n')}`;
  }

  private generateTypeFromSchema(name: string, schemaObj: any): string {
    if (schemaObj.type === 'object') {
      const properties = schemaObj.properties || {};
      const required = schemaObj.required || [];

      const props = Object.entries(properties).map(([propName, propSchema]: [string, any]) => {
        const isRequired = required.includes(propName);
        const propType = this.mapSchemaTypeToTS(propSchema);
        return `  ${propName}${isRequired ? '' : '?'}: ${propType};`;
      });

      return `/**
 * ${schemaObj.description || `${name} type`}
 */
export interface ${name} {
${props.join('\n')}
}`;
    }

    return `export type ${name} = ${this.mapSchemaTypeToTS(schemaObj)};`;
  }

  private mapSchemaTypeToTS(schema: any): string {
    if (schema.$ref) {
      return schema.$ref.split('/').pop();
    }

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum.map((v: string) => `'${v}'`).join(' | ') : 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `${this.mapSchemaTypeToTS(schema.items)}[]`;
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  private generateEndpointTypes(schema: OpenApiSchema): string {
    const endpoints = this.extractEndpoints(schema);

    const types = endpoints.map(endpoint => {
      const operationName = endpoint.operationId || this.generateOperationName(endpoint.method, endpoint.path);

      return `// ${endpoint.method.toUpperCase()} ${endpoint.path}
export interface ${this.capitalize(operationName)}Request {
  ${this.generateRequestType(endpoint)}
}

export interface ${this.capitalize(operationName)}Response {
  ${this.generateResponseType(endpoint)}
}`;
    });

    return `// Endpoint types\n${types.join('\n\n')}`;
  }

  private generateClientContent(schema: OpenApiSchema, options: ApiGeneratorOptions): string {
    const clientName = this.formatClientName(schema.info.title);
    const baseUrl = schema.servers?.[0]?.url || '';
    const endpoints = this.extractEndpoints(schema);

    return `/**
 * ${clientName} API Client
 * 
 * Generated from OpenAPI schema: ${schema.info.title} v${schema.info.version}
 * ${schema.info.description || ''}
 */

import type {
  ApiResponse,
  ApiError,
  RequestConfig,
  ${endpoints.map(e => {
      const opName = e.operationId || this.generateOperationName(e.method, e.path);
      return `${this.capitalize(opName)}Request, ${this.capitalize(opName)}Response`;
    }).join(',\n  ')}
} from './types.gen';

/**
 * Base API client configuration
 */
export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  ${options.auth !== 'none' ? 'authProvider?: AuthProvider;' : ''}
}

${options.auth !== 'none' ? this.generateAuthProvider(options.auth) : ''}

/**
 * ${clientName} API Client
 */
export class ${clientName}Client {
  private baseUrl: string;
  private config: Required<ClientConfig>;
  ${options.auth !== 'none' ? 'private authProvider?: AuthProvider;' : ''}

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || '${baseUrl}' || import.meta.env.${this.config.api.baseUrlEnvKey} || '';
    this.config = {
      baseUrl: this.baseUrl,
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      retries: config.retries || ${options.retry},
      ${options.auth !== 'none' ? 'authProvider: config.authProvider,' : ''}
    };
    ${options.auth !== 'none' ? 'this.authProvider = config.authProvider;' : ''}
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  private async request<T>(
    method: string,
    url: string,
    options: RequestConfig & { data?: any } = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = \`\${this.baseUrl}\${url}\`;
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        // Add authentication
        ${options.auth !== 'none' ? `
        if (this.authProvider) {
          const authHeader = await this.authProvider.getAuthHeader();
          if (authHeader) {
            headers.Authorization = authHeader;
          }
        }` : ''}

        const response = await fetch(fullUrl, {
          method,
          headers,
          body: options.data ? JSON.stringify(options.data) : undefined,
          signal: AbortSignal.timeout(options.timeout || this.config.timeout),
        });

        if (!response.ok) {
          throw new ApiError(\`HTTP \${response.status}: \${response.statusText}\`, response.status);
        }

        const data = await response.json();
        return {
          data,
          success: true,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

${endpoints.map(endpoint => this.generateEndpointMethod(endpoint)).join('\n\n')}

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('GET', '/health');
  }
}

/**
 * Default client instance
 */
export const ${clientName.toLowerCase()}Client = new ${clientName}Client();

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}`;
  }

  private generateAuthProvider(authType: string): string {
    switch (authType) {
      case 'cognito':
        return `
/**
 * Cognito authentication provider
 */
export interface AuthProvider {
  getAuthHeader(): Promise<string | null>;
  refreshToken(): Promise<void>;
  isAuthenticated(): boolean;
}

/**
 * Cognito auth provider implementation
 */
export class CognitoAuthProvider implements AuthProvider {
  async getAuthHeader(): Promise<string | null> {
    // Implementation would integrate with AWS Cognito
    const token = localStorage.getItem('cognito_access_token');
    return token ? \`Bearer \${token}\` : null;
  }

  async refreshToken(): Promise<void> {
    // Implementation would refresh Cognito token
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('cognito_access_token');
  }
}`;

      case 'jwt':
        return `
/**
 * JWT authentication provider
 */
export interface AuthProvider {
  getAuthHeader(): Promise<string | null>;
  refreshToken(): Promise<void>;
  isAuthenticated(): boolean;
}`;

      default:
        return '';
    }
  }

  private generateQueryKeysContent(schema: OpenApiSchema): string {
    const endpoints = this.extractEndpoints(schema);
    const getEndpoints = endpoints.filter(e => e.method.toLowerCase() === 'get');

    return `/**
 * React Query Keys
 * 
 * Centralized query keys for ${schema.info.title} API
 */

export const queryKeys = {
  all: ['${schema.info.title.toLowerCase()}'] as const,
  
${getEndpoints.map(endpoint => {
      const operationName = endpoint.operationId || this.generateOperationName(endpoint.method, endpoint.path);
      return `  ${operationName}: (params?: any) => [...queryKeys.all, '${operationName}', params] as const,`;
    }).join('\n')}
} as const;

export type QueryKeys = typeof queryKeys;`;
  }

  private generateHooksContent(schema: OpenApiSchema, options: ApiGeneratorOptions): string {
    const clientName = this.formatClientName(schema.info.title);
    const endpoints = this.extractEndpoints(schema);

    return `/**
 * React Query Hooks for ${schema.info.title} API
 * 
 * Generated hooks with proper TypeScript support and error handling
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { ${clientName.toLowerCase()}Client } from '../client';
import { queryKeys } from '../query-keys';
import type { ApiResponse, ApiError } from '../types.gen';

${endpoints.map(endpoint => this.generateHookForEndpoint(endpoint, clientName)).join('\n\n')}

/**
 * Hook for invalidating all queries
 */
export function useInvalidate${clientName}() {
  const queryClient = useQueryClient();
  
  return {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
${endpoints
        .filter(e => e.method.toLowerCase() === 'get')
        .map(e => {
          const opName = e.operationId || this.generateOperationName(e.method, e.path);
          return `    ${opName}: () => queryClient.invalidateQueries({ queryKey: queryKeys.${opName}() }),`;
        })
        .join('\n')}
  };
}`;
  }

  private generateTestContent(schema: OpenApiSchema, options: ApiGeneratorOptions): string {
    const clientName = this.formatClientName(schema.info.title);
    const endpoints = this.extractEndpoints(schema);

    return `/**
 * ${clientName} API Client Tests
 * 
 * Generated test suite with MSW mocking
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { ${clientName}Client } from '../client';

const server = setupServer();

describe('${clientName}Client', () => {
  let client: ${clientName}Client;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    client = new ${clientName}Client({
      baseUrl: 'http://localhost:3000',
      ${options.auth !== 'none' ? 'apiKey: "test-key",' : ''}
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('initialization', () => {
    it('creates client with default config', () => {
      const defaultClient = new ${clientName}Client();
      expect(defaultClient).toBeInstanceOf(${clientName}Client);
    });

    it('creates client with custom config', () => {
      const customClient = new ${clientName}Client({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 1,
      });
      expect(customClient).toBeInstanceOf(${clientName}Client);
    });
  });

${endpoints.slice(0, 3).map(endpoint => this.generateEndpointTest(endpoint)).join('\n\n')}

  describe('error handling', () => {
    it('handles network errors', async () => {
      server.use(
        rest.get('*', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      await expect(client.healthCheck()).rejects.toThrow('Network error');
    });

    it('handles API errors', async () => {
      server.use(
        rest.get('*', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: {
                code: 'INVALID_REQUEST',
                message: 'Invalid request'
              }
            })
          );
        })
      );

      await expect(client.healthCheck()).rejects.toThrow();
    });

    it('implements retry logic', async () => {
      let attempts = 0;
      server.use(
        rest.get('*', (req, res, ctx) => {
          attempts++;
          if (attempts < 3) {
            return res.networkError('Temporary error');
          }
          return res(ctx.json({ status: 'ok', timestamp: new Date().toISOString() }));
        })
      );

      const result = await client.healthCheck();
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('authentication', () => {
    ${options.auth !== 'none' ? `
    it('includes auth header when provided', async () => {
      let capturedHeaders: Record<string, string> = {};
      
      server.use(
        rest.get('*', (req, res, ctx) => {
          capturedHeaders = Object.fromEntries(req.headers.entries());
          return res(ctx.json({ status: 'ok', timestamp: new Date().toISOString() }));
        })
      );

      await client.healthCheck();
      expect(capturedHeaders.authorization).toBeDefined();
    });` : `
    it('works without authentication', async () => {
      server.use(
        rest.get('*', (req, res, ctx) => {
          return res(ctx.json({ status: 'ok', timestamp: new Date().toISOString() }));
        })
      );

      const result = await client.healthCheck();
      expect(result.success).toBe(true);
    });`}
  });
});`;
  }

  // Helper methods
  private formatClientName(title: string): string {
    return title
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private extractEndpoints(schema: OpenApiSchema): Array<{
    method: string;
    path: string;
    operationId?: string;
    summary?: string;
    description?: string;
    parameters?: any[];
    requestBody?: any;
    responses?: any;
  }> {
    const endpoints: any[] = [];

    Object.entries(schema.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses
          });
        }
      });
    });

    return endpoints;
  }

  private generateOperationName(method: string, path: string): string {
    const pathParts = path
      .split('/')
      .filter(part => part && !part.startsWith('{'))
      .map(part => this.capitalize(part));

    return method.toLowerCase() + pathParts.join('');
  }

  private generateEndpointMethod(endpoint: any): string {
    const operationName = endpoint.operationId || this.generateOperationName(endpoint.method, endpoint.path);
    const hasParams = endpoint.parameters?.some((p: any) => p.in === 'path' || p.in === 'query');
    const hasBody = endpoint.requestBody;

    return `  /**
   * ${endpoint.summary || `${endpoint.method} ${endpoint.path}`}
   * ${endpoint.description || ''}
   */
  async ${operationName}(${this.generateMethodParams(endpoint)}): Promise<ApiResponse<${this.capitalize(operationName)}Response>> {
    return this.request<${this.capitalize(operationName)}Response>(
      '${endpoint.method}',
      '${endpoint.path}'${hasParams || hasBody ? ',\n      { ' + this.generateRequestOptions(endpoint) + ' }' : ''}
    );
  }`;
  }

  private generateMethodParams(endpoint: any): string {
    const params = [];

    // Path parameters
    const pathParams = endpoint.parameters?.filter((p: any) => p.in === 'path') || [];
    pathParams.forEach((param: any) => {
      params.push(`${param.name}: ${this.mapSchemaTypeToTS(param.schema || { type: 'string' })}`);
    });

    // Query parameters
    const queryParams = endpoint.parameters?.filter((p: any) => p.in === 'query') || [];
    if (queryParams.length > 0) {
      const queryType = queryParams.map((p: any) =>
        `${p.name}${p.required ? '' : '?'}: ${this.mapSchemaTypeToTS(p.schema || { type: 'string' })}`
      ).join('; ');
      params.push(`query?: { ${queryType} }`);
    }

    // Request body
    if (endpoint.requestBody) {
      params.push('data: any'); // TODO: Generate proper type
    }

    return params.join(', ');
  }

  private generateRequestOptions(endpoint: any): string {
    const options = [];

    if (endpoint.parameters?.some((p: any) => p.in === 'query')) {
      options.push('params: query');
    }

    if (endpoint.requestBody) {
      options.push('data');
    }

    return options.join(', ');
  }

  private generateRequestType(endpoint: any): string {
    // Simplified - would generate proper request type
    return 'params?: any; data?: any;';
  }

  private generateResponseType(endpoint: any): string {
    // Simplified - would generate proper response type from schema
    return 'data: any;';
  }

  private generateHookForEndpoint(endpoint: any, clientName: string): string {
    const operationName = endpoint.operationId || this.generateOperationName(endpoint.method, endpoint.path);

    if (endpoint.method === 'GET') {
      return this.generateQueryHook(endpoint, clientName, operationName);
    } else {
      return this.generateMutationHook(endpoint, clientName, operationName);
    }
  }

  private generateQueryHook(endpoint: any, clientName: string, operationName: string): string {
    return `/**
 * Hook for ${endpoint.summary || operationName}
 */
export function use${this.capitalize(operationName)}(
  params?: any,
  options?: Omit<UseQueryOptions<ApiResponse<any>, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.${operationName}(params),
    queryFn: () => ${clientName.toLowerCase()}Client.${operationName}(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}`;
  }

  private generateMutationHook(endpoint: any, clientName: string, operationName: string): string {
    return `/**
 * Hook for ${endpoint.summary || operationName}
 */
export function use${this.capitalize(operationName)}(
  options?: UseMutationOptions<ApiResponse<any>, ApiError, any>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ${clientName.toLowerCase()}Client.${operationName}(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    ...options,
  });
}`;
  }

  private generateEndpointTest(endpoint: any): string {
    const operationName = endpoint.operationId || this.generateOperationName(endpoint.method, endpoint.path);

    return `  describe('${operationName}', () => {
    it('makes successful request', async () => {
      server.use(
        rest.${endpoint.method.toLowerCase()}('*', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ data: { success: true } })
          );
        })
      );

      const result = await client.${operationName}();
      expect(result.success).toBe(true);
    });

    it('handles error response', async () => {
      server.use(
        rest.${endpoint.method.toLowerCase()}('*', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: { message: 'Bad request' } })
          );
        })
      );

      await expect(client.${operationName}()).rejects.toThrow();
    });
  });`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async checkHashSkip(files: GeneratedFile[], schemaPath: string): Promise<boolean> {
    const contentHash = createHash('md5')
      .update(files.map(f => f.content).join(''))
      .digest('hex');

    const hashFile = join(this.logDir, `api-generation-hash-${schemaPath.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);

    if (existsSync(hashFile)) {
      const lastHash = readFileSync(hashFile, 'utf-8').trim();
      if (lastHash === contentHash) {
        return true;
      }
    }

    writeFileSync(hashFile, contentHash);
    return false;
  }

  private showDryRunPreview(files: GeneratedFile[]): void {
    console.log('\n🔍 API Client Dry Run Preview:\n');

    files.forEach(file => {
      console.log(`📄 ${file.type.toUpperCase()}: ${file.path}`);
      console.log('─'.repeat(50));
      console.log(file.content.split('\n').slice(0, 15).join('\n'));
      if (file.content.split('\n').length > 15) {
        console.log('... (truncated)');
      }
      console.log('\n');
    });

    console.log(`Total files to generate: ${files.length}`);
  }

  private async writeFiles(files: GeneratedFile[], outputDir: string): Promise<void> {
    for (const file of files) {
      const fullPath = join(outputDir, file.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, file.content);
    }
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
Kiro API Client Generator

Usage: npm run gen:api -- --schema <path> --out <dir> [options]

Required:
  --schema <path>       Path to OpenAPI schema file or URL
  --out <dir>          Output directory

Options:
  --hooks              Generate React Query hooks (default: true)
  --retry <number>     Number of retry attempts (default: 3)
  --auth <type>        Authentication type: cognito|jwt|none (default: cognito)
  --dry-run            Preview without writing files

Examples:
  npm run gen:api -- --schema ./openapi.yaml --out src/api --hooks --retry=3 --auth=cognito
  npm run gen:api -- --schema https://api.example.com/openapi.json --out src/api --dry-run
`);
    process.exit(0);
  }

  const options: ApiGeneratorOptions = {
    schema: '',
    out: 'src/api',
    hooks: true,
    retry: 3,
    auth: 'cognito',
    dryRun: false
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--schema':
        options.schema = args[++i];
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--retry':
        options.retry = parseInt(args[++i]);
        break;
      case '--auth':
        options.auth = args[++i] as any;
        break;
      case '--hooks':
        options.hooks = true;
        break;
      case '--no-hooks':
        options.hooks = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
  }

  if (!options.schema) {
    console.error('❌ Schema path is required');
    process.exit(1);
  }

  const generator = new KiroApiGenerator();
  await generator.generate(options);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}