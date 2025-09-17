/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handler } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK
const mockKMSSign = jest.fn();
const mockKMSVerify = jest.fn();
const mockS3GetObject = jest.fn();
const mockS3PutObject = jest.fn();

jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      if (command.constructor.name === 'SignCommand') {
        return mockKMSSign(command);
      }
      if (command.constructor.name === 'VerifyCommand') {
        return mockKMSVerify(command);
      }
    })
  })),
  SignCommand: jest.fn(),
  VerifyCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      if (command.constructor.name === 'GetObjectCommand') {
        return mockS3GetObject(command);
      }
      if (command.constructor.name === 'PutObjectCommand') {
        return mockS3PutObject(command);
      }
    })
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

describe('Template Security System Lambda', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      httpMethod: 'POST',
      path: '/template-security',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: 'template-123',
        content: 'Test template content',
        action: 'sign'
      }),
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        requestId: 'test-request-id',
        stage: 'test',
        httpMethod: 'POST',
        path: '/template-security',
        protocol: 'HTTP/1.1',
        requestTime: '2024-01-15T10:30:00Z',
        requestTimeEpoch: 1705315800000,
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-agent',
        },
        accountId: '123456789012',
        apiId: 'test-api-id',
        resourceId: 'test-resource-id',
        resourcePath: '/template-security',
      } as any,
      resource: '/template-security',
      isBase64Encoded: false,
      multiValueHeaders: {},
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'template-security-system',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:template-security-system',
      memoryLimitInMB: '256',
      awsRequestId: 'test-aws-request-id',
      logGroupName: '/aws/lambda/template-security-system',
      logStreamName: '2024/01/15/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  describe('Template Signing', () => {
    it('should sign template content successfully', async () => {
      const mockSignature = Buffer.from('mock-signature');
      mockKMSSign.mockResolvedValue({
        Signature: mockSignature,
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
      });

      mockS3PutObject.mockResolvedValue({
        ETag: '"test-etag"',
        VersionId: 'test-version-id'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.templateId).toBe('template-123');
      expect(responseBody.signature).toBeDefined();
      expect(responseBody.signedAt).toBeDefined();

      expect(mockKMSSign).toHaveBeenCalledWith(
        expect.objectContaining({
          KeyId: expect.any(String),
          Message: expect.any(Buffer),
          MessageType: 'RAW',
          SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
        })
      );

      expect(mockS3PutObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: expect.any(String),
          Key: expect.stringContaining('template-123'),
          Body: expect.any(String),
          ContentType: 'application/json'
        })
      );
    });

    it('should handle template signing errors', async () => {
      mockKMSSign.mockRejectedValue(new Error('KMS signing failed'));

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('KMS signing failed');
    });

    it('should validate template content before signing', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: '', // Empty content
          action: 'sign'
        })
      };

      const result = await handler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Template content cannot be empty');
    });
  });

  describe('Template Verification', () => {
    it('should verify template signature successfully', async () => {
      const verifyEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: 'Test template content',
          signature: 'mock-signature-base64',
          action: 'verify'
        })
      };

      mockKMSVerify.mockResolvedValue({
        SignatureValid: true,
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
      });

      const result = await handler(verifyEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.valid).toBe(true);
      expect(responseBody.templateId).toBe('template-123');

      expect(mockKMSVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          KeyId: expect.any(String),
          Message: expect.any(Buffer),
          Signature: expect.any(Buffer),
          MessageType: 'RAW',
          SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
        })
      );
    });

    it('should detect invalid signatures', async () => {
      const verifyEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: 'Test template content',
          signature: 'invalid-signature',
          action: 'verify'
        })
      };

      mockKMSVerify.mockResolvedValue({
        SignatureValid: false,
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
      });

      const result = await handler(verifyEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.valid).toBe(false);
      expect(responseBody.templateId).toBe('template-123');
    });

    it('should handle verification errors', async () => {
      const verifyEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: 'Test template content',
          signature: 'mock-signature',
          action: 'verify'
        })
      };

      mockKMSVerify.mockRejectedValue(new Error('KMS verification failed'));

      const result = await handler(verifyEvent, mockContext);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('KMS verification failed');
    });
  });

  describe('Template Retrieval', () => {
    it('should retrieve signed template successfully', async () => {
      const getEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        pathParameters: {
          templateId: 'template-123'
        },
        body: null
      };

      const mockTemplate = {
        templateId: 'template-123',
        content: 'Test template content',
        signature: 'mock-signature',
        signedAt: '2024-01-15T10:30:00Z',
        keyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
      };

      mockS3GetObject.mockResolvedValue({
        Body: {
          transformToString: async () => JSON.stringify(mockTemplate)
        },
        ContentType: 'application/json',
        LastModified: new Date('2024-01-15T10:30:00Z')
      });

      const result = await handler(getEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.template).toEqual(mockTemplate);

      expect(mockS3GetObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: expect.any(String),
          Key: expect.stringContaining('template-123')
        })
      );
    });

    it('should handle template not found', async () => {
      const getEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        pathParameters: {
          templateId: 'non-existent-template'
        },
        body: null
      };

      mockS3GetObject.mockRejectedValue({
        name: 'NoSuchKey',
        message: 'The specified key does not exist'
      });

      const result = await handler(getEvent, mockContext);

      expect(result.statusCode).toBe(404);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Template not found');
    });
  });

  describe('Template Audit Trail', () => {
    it('should log template operations for audit', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockKMSSign.mockResolvedValue({
        Signature: Buffer.from('mock-signature'),
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
      });

      mockS3PutObject.mockResolvedValue({
        ETag: '"test-etag"'
      });

      await handler(mockEvent, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Template security operation'),
        expect.objectContaining({
          templateId: 'template-123',
          action: 'sign',
          requestId: 'test-request-id',
          sourceIp: '127.0.0.1'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should include security metadata in audit logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockKMSSign.mockResolvedValue({
        Signature: Buffer.from('mock-signature'),
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
      });

      mockS3PutObject.mockResolvedValue({
        ETag: '"test-etag"'
      });

      await handler(mockEvent, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Template signed successfully'),
        expect.objectContaining({
          keyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id',
          algorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
          signatureLength: expect.any(Number)
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate required fields for signing', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: JSON.stringify({
          // Missing templateId and content
          action: 'sign'
        })
      };

      const result = await handler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('templateId and content are required');
    });

    it('should validate JSON body format', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: 'invalid-json'
      };

      const result = await handler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Invalid JSON body');
    });

    it('should validate supported actions', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: 'Test content',
          action: 'invalid-action'
        })
      };

      const result = await handler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Unsupported action');
    });
  });

  describe('Security Features', () => {
    it('should include CORS headers in response', async () => {
      mockKMSSign.mockResolvedValue({
        Signature: Buffer.from('mock-signature'),
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
      });

      mockS3PutObject.mockResolvedValue({
        ETag: '"test-etag"'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.headers).toEqual(
        expect.objectContaining({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        })
      );
    });

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const optionsEvent = {
        ...mockEvent,
        httpMethod: 'OPTIONS'
      };

      const result = await handler(optionsEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual(
        expect.objectContaining({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        })
      );
    });

    it('should sanitize template content for security', async () => {
      const maliciousEvent = {
        ...mockEvent,
        body: JSON.stringify({
          templateId: 'template-123',
          content: '<script>alert("xss")</script>Template content',
          action: 'sign'
        })
      };

      mockKMSSign.mockResolvedValue({
        Signature: Buffer.from('mock-signature'),
        KeyId: 'arn:aws:kms:us-east-1:123456789012:key/test-key-id'
      });

      mockS3PutObject.mockResolvedValue({
        ETag: '"test-etag"'
      });

      const result = await handler(maliciousEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      // Verify that the content was sanitized before signing
      expect(mockKMSSign).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.not.stringContaining('<script>')
        })
      );
    });
  });
});