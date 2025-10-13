/**
 * API Client Generator
 * 
 * Generates TypeScript API clients from OpenAPI specifications
 * with React hooks integration and comprehensive error handling
 */

import { ApiSchema, CodeGenerationConfig, GeneratedApiClient } from './types';

export class ApiClientGenerator {
    constructor(private config: CodeGenerationConfig) { }

    /**
     * Generate API client from OpenAPI specification
     */
    async generateApiClient(schema: ApiSchema): Promise<GeneratedApiClient> {
        const clientName = this.formatClientName(schema.info.title);
        const clientPath = `src/api/${clientName.toLowerCase()}-client.ts`;

        // Generate main client
        const clientContent = await this.generateClientContent(schema);

        // Generate TypeScript types
        const types = await this.generateTypes(schema);

        // Generate React hooks
        const hooks = await this.generateHooks(schema);

        // Generate tests
        const tests = await this.generateTests(schema);

        return {
            name: clientName,
            path: clientPath,
            content: clientContent,
            types,
            hooks,
            tests
        };
    }

    /**
     * Generate the main API client content
     */
    private async generateClientContent(schema: ApiSchema): Promise<string> {
        const clientName = this.formatClientName(schema.info.title);
        const baseUrl = schema.servers?.[0]?.url || '';
        const endpoints = this.extractEndpoints(schema);

        return `/**
 * ${clientName} API Client
 * Generated from OpenAPI specification
 * 
 * ${schema.info.description || ''}
 * Version: ${schema.info.version}
 */

import { ApiClient, ApiResponse, ApiError } from './base-client';
import type {
  ${this.generateTypeImports(schema)}
} from './types/${clientName.toLowerCase()}-types';

export class ${clientName}Client extends ApiClient {
  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    super({
      baseUrl: config?.baseUrl || '${baseUrl}',
      apiKey: config?.apiKey,
      timeout: 30000,
      retries: 3
    });
  }

${endpoints.map(endpoint => this.generateEndpointMethod(endpoint)).join('\n\n')}

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request({
      method: 'GET',
      url: '/health',
      timeout: 5000
    });
  }
}

// Export singleton instance
export const ${clientName.toLowerCase()}Client = new ${clientName}Client();
`;
    }

    /**
     * Generate TypeScript types from OpenAPI schema
     */
    private async generateTypes(schema: ApiSchema): Promise<string> {
        const clientName = this.formatClientName(schema.info.title);
        const schemas = schema.components?.schemas || {};

        return `/**
 * ${clientName} API Types
 * Generated from OpenAPI specification
 */

// Base types
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
  };
}

// Generated types from schema
${Object.entries(schemas).map(([name, schema]) =>
            this.generateTypeDefinition(name, schema)
        ).join('\n\n')}

// Request/Response types
${this.generateRequestResponseTypes(schema)}
`;
    }

    /**
     * Generate React hooks for API client
     */
    private async generateHooks(schema: ApiSchema): Promise<string> {
        const clientName = this.formatClientName(schema.info.title);
        const endpoints = this.extractEndpoints(schema);

        return `/**
 * ${clientName} API Hooks
 * React hooks for ${clientName} API client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ${clientName.toLowerCase()}Client } from './${clientName.toLowerCase()}-client';
import type {
  ${this.generateTypeImports(schema)}
} from './types/${clientName.toLowerCase()}-types';

// Query keys
export const ${clientName.toLowerCase()}Keys = {
${this.generateQueryKeys(endpoints)}
} as const;

${endpoints.map(endpoint => this.generateHookForEndpoint(endpoint, clientName)).join('\n\n')}

/**
 * Hook for invalidating all ${clientName.toLowerCase()} queries
 */
export function useInvalidate${clientName}() {
  const queryClient = useQueryClient();
  
  return {
    all: () => queryClient.invalidateQueries({ queryKey: ['${clientName.toLowerCase()}'] }),
    ${endpoints
                .filter(e => e.method === 'GET')
                .map(e => `${this.formatMethodName(e)}: () => queryClient.invalidateQueries({ queryKey: ${clientName.toLowerCase()}Keys.${this.formatMethodName(e)} })`)
                .join(',\n    ')}
  };
}
`;
    }

    /**
     * Generate tests for API client
     */
    private async generateTests(schema: ApiSchema): Promise<string> {
        const clientName = this.formatClientName(schema.info.title);
        const endpoints = this.extractEndpoints(schema);

        return `/**
 * ${clientName} API Client Tests
 * Generated test suite for API client
 */

import { ${clientName}Client } from '../${clientName.toLowerCase()}-client';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer();

describe('${clientName}Client', () => {
  let client: ${clientName}Client;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    client = new ${clientName}Client({
      baseUrl: 'http://localhost:3000',
      apiKey: 'test-api-key'
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
        apiKey: 'custom-key'
      });
      expect(customClient).toBeInstanceOf(${clientName}Client);
    });
  });

${endpoints.map(endpoint => this.generateEndpointTest(endpoint, clientName)).join('\n\n')}

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

      await expect(client.healthCheck()).rejects.toThrow('Invalid request');
    });
  });
});
`;
    }

    // Helper methods
    private formatClientName(title: string): string {
        return title
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private extractEndpoints(schema: ApiSchema): Array<{
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

    private generateEndpointMethod(endpoint: any): string {
        const methodName = this.formatMethodName(endpoint);
        const parameters = this.generateMethodParameters(endpoint);
        const returnType = this.generateReturnType(endpoint);

        return `  /**
   * ${endpoint.summary || endpoint.description || `${endpoint.method} ${endpoint.path}`}
   */
  async ${methodName}(${parameters}): Promise<${returnType}> {
    return this.request({
      method: '${endpoint.method}',
      url: '${endpoint.path}',
      ${this.generateRequestOptions(endpoint)}
    });
  }`;
    }

    private formatMethodName(endpoint: any): string {
        if (endpoint.operationId) {
            return endpoint.operationId;
        }

        const method = endpoint.method.toLowerCase();
        const pathParts = endpoint.path
            .split('/')
            .filter(part => part && !part.startsWith('{'))
            .map(part => part.charAt(0).toUpperCase() + part.slice(1));

        return method + pathParts.join('');
    }

    private generateMethodParameters(endpoint: any): string {
        const params = [];

        // Path parameters
        const pathParams = endpoint.parameters?.filter((p: any) => p.in === 'path') || [];
        pathParams.forEach((param: any) => {
            params.push(`${param.name}: ${this.mapOpenApiType(param.schema?.type || 'string')}`);
        });

        // Query parameters
        const queryParams = endpoint.parameters?.filter((p: any) => p.in === 'query') || [];
        if (queryParams.length > 0) {
            params.push(`query?: { ${queryParams.map((p: any) =>
                `${p.name}${p.required ? '' : '?'}: ${this.mapOpenApiType(p.schema?.type || 'string')}`
            ).join('; ')} }`);
        }

        // Request body
        if (endpoint.requestBody) {
            params.push(`data: any`); // TODO: Generate proper type from schema
        }

        return params.join(', ');
    }

    private generateReturnType(endpoint: any): string {
        // TODO: Generate proper return type from response schema
        return 'ApiResponse<any>';
    }

    private generateRequestOptions(endpoint: any): string {
        const options = [];

        if (endpoint.parameters?.some((p: any) => p.in === 'query')) {
            options.push('params: query');
        }

        if (endpoint.requestBody) {
            options.push('data');
        }

        return options.join(',\n      ');
    }

    private generateTypeImports(schema: ApiSchema): string {
        const schemas = schema.components?.schemas || {};
        return Object.keys(schemas).join(',\n  ');
    }

    private generateTypeDefinition(name: string, schema: any): string {
        // Simplified type generation - in a real implementation, this would be more comprehensive
        return `export interface ${name} {
  // TODO: Generate from schema
  [key: string]: any;
}`;
    }

    private generateRequestResponseTypes(schema: ApiSchema): string {
        // Generate request/response types for each endpoint
        return '// TODO: Generate request/response types';
    }

    private generateQueryKeys(endpoints: any[]): string {
        return endpoints
            .filter(e => e.method === 'GET')
            .map(e => `  ${this.formatMethodName(e)}: ['${this.formatMethodName(e)}'] as const`)
            .join(',\n');
    }

    private generateHookForEndpoint(endpoint: any, clientName: string): string {
        const methodName = this.formatMethodName(endpoint);

        if (endpoint.method === 'GET') {
            return this.generateQueryHook(endpoint, clientName, methodName);
        } else {
            return this.generateMutationHook(endpoint, clientName, methodName);
        }
    }

    private generateQueryHook(endpoint: any, clientName: string, methodName: string): string {
        return `/**
 * Hook for ${endpoint.summary || methodName}
 */
export function use${this.capitalize(methodName)}(
  params?: any,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: ${clientName.toLowerCase()}Keys.${methodName},
    queryFn: () => ${clientName.toLowerCase()}Client.${methodName}(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
  });
}`;
    }

    private generateMutationHook(endpoint: any, clientName: string, methodName: string): string {
        return `/**
 * Hook for ${endpoint.summary || methodName}
 */
export function use${this.capitalize(methodName)}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ${clientName.toLowerCase()}Client.${methodName}(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['${clientName.toLowerCase()}'] });
    },
  });
}`;
    }

    private generateEndpointTest(endpoint: any, clientName: string): string {
        const methodName = this.formatMethodName(endpoint);

        return `  describe('${methodName}', () => {
    it('makes successful request', async () => {
      server.use(
        rest.${endpoint.method.toLowerCase()}('*', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ success: true, data: {} })
          );
        })
      );

      const result = await client.${methodName}();
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

      await expect(client.${methodName}()).rejects.toThrow('Bad request');
    });
  });`;
    }

    private mapOpenApiType(type: string): string {
        switch (type) {
            case 'integer':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                return 'any[]';
            case 'object':
                return 'object';
            default:
                return 'string';
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}