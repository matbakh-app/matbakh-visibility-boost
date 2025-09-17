/**
 * Tests for Multi-Agent Workflow Lambda Handler
 */

import { handler } from '../index';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

// Helper function to handle union types
function assertApiGatewayResult(result: any): asserts result is APIGatewayProxyResult {
  if (!('statusCode' in result)) {
    throw new Error('Expected APIGatewayProxyResult');
  }
}

const asApi = (r: any): APIGatewayProxyResult => {
  if (r && typeof r === 'object' && 'statusCode' in r && 'headers' in r) {
    return r as APIGatewayProxyResult;
  }
  throw new Error('Expected APIGatewayProxyResult');
};
import { WorkflowEvent, WorkflowResponse } from '../types';

// Mock the orchestrator components
jest.mock('../workflow-orchestrator');
jest.mock('../agent-manager');
jest.mock('../decision-engine');
jest.mock('../communication-manager');
jest.mock('../workflow-templates');

describe('Multi-Agent Workflow Lambda Handler', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: 'test-log-group',
    logStreamName: 'test-log-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Gateway Events', () => {
    it('should handle workflow execution request', async () => {
      // Arrange
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/workflow/execute',
        headers: { 'Content-Type': 'application/json' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'POST',
          path: '/workflow/execute',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/workflow/execute',
          authorizer: null
        },
        resource: '/workflow/execute',
        body: JSON.stringify({
          workflowId: 'business-analysis-template',
          inputs: { business_id: 'test-business' },
          tenantId: 'test-tenant',
          userId: 'test-user'
        }),
        isBase64Encoded: false
      };

      // Act
      const result = await handler(apiEvent, mockContext);

      // Assert
      assertApiGatewayResult(result);
      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
    });

    it('should handle workflow status request', async () => {
      // Arrange
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/workflow/status',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: { executionId: 'test-execution-1' },
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'GET',
          path: '/workflow/status',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/workflow/status',
          authorizer: null
        },
        resource: '/workflow/status',
        body: JSON.stringify({ executionId: 'test-execution-1' }),
        isBase64Encoded: false
      };

      // Act
      const result = await handler(apiEvent, mockContext);

      // Assert
      const api = asApi(result);
      expect(api.statusCode).toBe(200);
      
      const responseBody = JSON.parse(api.body);
      expect(responseBody.success).toBe(true);
    });

    it('should handle workflow templates request', async () => {
      // Arrange
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/workflow/templates',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'GET',
          path: '/workflow/templates',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/workflow/templates',
          authorizer: null
        },
        resource: '/workflow/templates',
        body: null,
        isBase64Encoded: false
      };

      // Act
      const result = await handler(apiEvent, mockContext);

      // Assert
      const api = asApi(result);
      expect(api.statusCode).toBe(200);
      
      const responseBody = JSON.parse(api.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.metadata?.totalCount).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      // Arrange
      const corsEvent: APIGatewayProxyEvent = {
        httpMethod: 'OPTIONS',
        path: '/workflow/execute',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'OPTIONS',
          path: '/workflow/execute',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/workflow/execute',
          authorizer: null
        },
        resource: '/workflow/execute',
        body: null,
        isBase64Encoded: false
      };

      // Act
      const result = await handler(corsEvent, mockContext);

      // Assert
      const api = asApi(result);
      expect(api.statusCode).toBe(200);
      expect(api.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(api.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(api.body).toBe('');
    });

    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/workflow/execute',
        headers: { 'Content-Type': 'application/json' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'POST',
          path: '/workflow/execute',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/workflow/execute',
          authorizer: null
        },
        resource: '/workflow/execute',
        body: 'invalid json{',
        isBase64Encoded: false
      };

      // Act
      const result = await handler(apiEvent, mockContext);

      // Assert
      const api = asApi(result);
      expect(api.statusCode).toBe(400);
      
      const responseBody = JSON.parse(api.body);
      expect(responseBody.error).toBe('Invalid JSON in request body');
    });

    it('should handle 404 for unknown routes', async () => {
      // Arrange
      const apiEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/unknown/route',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          accountId: '123456789012',
          apiId: 'test-api',
          protocol: 'HTTP/1.1',
          httpMethod: 'GET',
          path: '/unknown/route',
          stage: 'test',
          requestId: 'test-request',
          requestTime: '01/Jan/2025:00:00:00 +0000',
          requestTimeEpoch: 1735689600,
          identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'test-agent',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
          },
          resourceId: 'test-resource',
          resourcePath: '/unknown/route',
          authorizer: null
        },
        resource: '/unknown/route',
        body: null,
        isBase64Encoded: false
      };

      // Act
      const result = await handler(apiEvent, mockContext);

      // Assert
      const api = asApi(result);
      expect(api.statusCode).toBe(404);
      
      const responseBody = JSON.parse(api.body);
      expect(responseBody.error).toBe('Route not found');
    });
  });

  describe('Direct Lambda Invocations', () => {
    it('should handle direct workflow execution', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'execute',
        workflowId: 'business-analysis-template',
        inputs: { business_id: 'test-business' },
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle direct workflow status request', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'status',
        executionId: 'test-execution-1',
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle direct workflow control actions', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'pause',
        executionId: 'test-execution-1',
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle direct workflow list request', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'list',
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle unsupported actions', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'unsupported' as any,
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported action');
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow errors gracefully', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'execute',
        workflowId: 'non-existent-workflow',
        inputs: {},
        tenantId: 'test-tenant',
        userId: 'test-user'
      };

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const workflowEvent: WorkflowEvent = {
        action: 'execute',
        // Missing required fields
        tenantId: 'test-tenant',
        userId: 'test-user'
      } as any;

      // Act
      const result = await handler(workflowEvent, mockContext) as unknown as WorkflowResponse;

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });
});