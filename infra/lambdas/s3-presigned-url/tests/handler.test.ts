/**
 * Unit tests for the main Lambda handler
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../src/index';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('pg');

// Mock security and error modules
jest.mock('../src/security');
jest.mock('../src/errors');

import * as security from '../src/security';
import * as errors from '../src/errors';

describe('Lambda Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mocks
    (security.validateMimeType as jest.Mock).mockReturnValue(true);
    (security.validateFilename as jest.Mock).mockReturnValue({ valid: true });
    (security.validateFileSize as jest.Mock).mockReturnValue(true);
    (security.validateBucketRules as jest.Mock).mockReturnValue({ valid: true });
    (security.generateSecureS3Key as jest.Mock).mockReturnValue('test/key/file.jpg');
    (security.getSecurityHeaders as jest.Mock).mockReturnValue({
      'Access-Control-Allow-Origin': 'https://matbakh.app',
      'Content-Type': 'application/json',
    });
    (security.RateLimiter.checkLimit as jest.Mock).mockReturnValue(true);

    // Setup mock event
    mockEvent = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://matbakh.app',
      },
      body: JSON.stringify({
        bucket: 'matbakh-files-uploads',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        userId: 'test-user-id',
        fileSize: 1024,
      }),
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-id',
          },
        },
      },
    } as any;

    // Setup mock context
    mockContext = {
      awsRequestId: 'test-request-id',
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '256',
      remainingTimeInMillis: () => 30000,
    } as any;
  });

  describe('OPTIONS requests', () => {
    test('should handle preflight requests', async () => {
      mockEvent.httpMethod = 'OPTIONS';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('');
      expect(security.getSecurityHeaders).toHaveBeenCalledWith('https://matbakh.app');
    });
  });

  describe('POST requests', () => {
    test('should handle valid request successfully', async () => {
      // Mock successful S3 presigned URL generation
      const mockGetSignedUrl = jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-url');
      jest.doMock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: mockGetSignedUrl,
      }));

      // Mock successful database operations
      const mockValidateUserPermissions = jest.fn().mockResolvedValue(undefined);
      const mockLogUploadActivity = jest.fn().mockResolvedValue(undefined);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.uploadUrl).toBeDefined();
      expect(responseBody.fileUrl).toBeDefined();
      expect(responseBody.expiresAt).toBeDefined();
    });

    test('should reject request with missing body', async () => {
      mockEvent.body = null;

      const mockError = new errors.AppError('VALIDATION_ERROR' as any, 'Missing body');
      (errors.ValidationErrors.missingRequiredFields as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'VALIDATION_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(errors.ValidationErrors.missingRequiredFields).toHaveBeenCalledWith(['body']);
    });

    test('should reject request with invalid JSON', async () => {
      mockEvent.body = 'invalid json';

      const mockError = new errors.AppError('VALIDATION_ERROR' as any, 'Invalid JSON');
      (errors.handleUnknownError as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'VALIDATION_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    test('should reject request with missing required fields', async () => {
      mockEvent.body = JSON.stringify({
        bucket: 'matbakh-files-uploads',
        // Missing filename and contentType
      });

      const mockError = new errors.AppError('VALIDATION_ERROR' as any, 'Missing fields');
      (errors.ValidationErrors.missingRequiredFields as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'VALIDATION_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(errors.ValidationErrors.missingRequiredFields).toHaveBeenCalledWith(['filename', 'contentType']);
    });

    test('should reject request with invalid bucket', async () => {
      mockEvent.body = JSON.stringify({
        bucket: 'invalid-bucket',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
      });

      const mockError = new errors.AppError('VALIDATION_ERROR' as any, 'Invalid bucket');
      (errors.ValidationErrors.invalidBucket as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'VALIDATION_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(errors.ValidationErrors.invalidBucket).toHaveBeenCalledWith(
        'invalid-bucket',
        ['matbakh-files-uploads', 'matbakh-files-profile', 'matbakh-files-reports']
      );
    });

    test('should reject request with invalid filename', async () => {
      (security.validateFilename as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'Invalid characters',
      });

      const mockError = new errors.AppError('INVALID_FILE' as any, 'Invalid filename');
      (errors.ValidationErrors.invalidFilename as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'INVALID_FILE' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(errors.ValidationErrors.invalidFilename).toHaveBeenCalledWith('test.jpg', 'Invalid characters');
    });

    test('should reject request with invalid MIME type', async () => {
      (security.validateMimeType as jest.Mock).mockReturnValue(false);

      const mockError = new errors.AppError('INVALID_FILE' as any, 'Invalid MIME type');
      (errors.ValidationErrors.invalidMimeType as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'INVALID_FILE' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    test('should reject request with oversized file', async () => {
      (security.validateFileSize as jest.Mock).mockReturnValue(false);

      const mockError = new errors.AppError('INVALID_FILE' as any, 'File too large');
      (errors.ValidationErrors.fileSizeExceeded as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'INVALID_FILE' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    test('should reject request without authentication', async () => {
      mockEvent.requestContext.authorizer = undefined;
      mockEvent.body = JSON.stringify({
        bucket: 'matbakh-files-uploads',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        // No userId provided
      });

      const mockError = new errors.AppError('AUTH_ERROR' as any, 'Authentication required');
      (errors.PermissionErrors.authenticationRequired as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 401,
        headers: {},
        body: JSON.stringify({ error: 'AUTH_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(errors.PermissionErrors.authenticationRequired).toHaveBeenCalled();
    });

    test('should reject request when rate limited', async () => {
      (security.RateLimiter.checkLimit as jest.Mock).mockReturnValue(false);
      (security.RateLimiter.getResetTime as jest.Mock).mockReturnValue(Date.now() + 60000);

      const mockError = new errors.AppError('RATE_LIMITED' as any, 'Rate limited');
      (errors.RateLimitErrors.rateLimitExceeded as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 429,
        headers: {},
        body: JSON.stringify({ error: 'RATE_LIMITED' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(429);
    });

    test('should handle bucket rule validation failure', async () => {
      (security.validateBucketRules as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'File too large for bucket',
      });

      const mockError = new errors.AppError('VALIDATION_ERROR' as any, 'Bucket rule violation');
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 400,
        headers: {},
        body: JSON.stringify({ error: 'VALIDATION_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });

    test('should handle S3 presigned URL generation failure', async () => {
      // Mock S3 error
      const mockGetSignedUrl = jest.fn().mockRejectedValue(new Error('S3 access denied'));
      jest.doMock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: mockGetSignedUrl,
      }));

      const mockError = new errors.AppError('S3_ERROR' as any, 'S3 error');
      (errors.S3Errors.presignedUrlFailed as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 500,
        headers: {},
        body: JSON.stringify({ error: 'S3_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
    });

    test('should handle unexpected errors', async () => {
      // Force an unexpected error
      (security.validateMimeType as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const mockError = new errors.AppError('INTERNAL_ERROR' as any, 'Internal error');
      (errors.handleUnknownError as jest.Mock).mockReturnValue(mockError);
      (errors.createErrorResponse as jest.Mock).mockReturnValue({
        statusCode: 500,
        headers: {},
        body: JSON.stringify({ error: 'INTERNAL_ERROR' }),
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(errors.handleUnknownError).toHaveBeenCalled();
    });
  });

  describe('Request validation', () => {
    test('should validate all security checks in correct order', async () => {
      await handler(mockEvent, mockContext);

      // Verify security checks are called in the right order
      expect(security.validateFilename).toHaveBeenCalledWith('test.jpg');
      expect(security.validateMimeType).toHaveBeenCalledWith('image/jpeg');
      expect(security.validateFileSize).toHaveBeenCalled();
      expect(security.validateBucketRules).toHaveBeenCalledWith(
        'matbakh-files-uploads',
        'image/jpeg',
        expect.any(Number),
        undefined
      );
      expect(security.RateLimiter.checkLimit).toHaveBeenCalledWith('test-user-id');
    });

    test('should extract user ID from different sources', async () => {
      // Test with userId in request body
      mockEvent.body = JSON.stringify({
        bucket: 'matbakh-files-uploads',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        userId: 'body-user-id',
      });

      await handler(mockEvent, mockContext);

      expect(security.RateLimiter.checkLimit).toHaveBeenCalledWith('body-user-id');
    });

    test('should generate secure S3 key with correct parameters', async () => {
      await handler(mockEvent, mockContext);

      expect(security.generateSecureS3Key).toHaveBeenCalledWith(
        'matbakh-files-uploads',
        '',
        'test.jpg',
        'test-user-id',
        undefined
      );
    });
  });
});