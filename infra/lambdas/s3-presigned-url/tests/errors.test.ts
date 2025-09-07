/**
 * Unit tests for error handling utilities
 */

import {
  AppError,
  ErrorCode,
  ValidationErrors,
  PermissionErrors,
  RateLimitErrors,
  DatabaseErrors,
  S3Errors,
  InternalErrors,
  handleUnknownError,
  errorToResponse,
  createErrorResponse,
  sanitizeErrorDetails,
} from '../src/errors';

describe('Error Handling Utilities', () => {
  describe('AppError', () => {
    test('should create error with correct properties', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test message', { detail: 'test' });
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('AppError');
    });

    test('should maintain proper stack trace', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationErrors', () => {
    test('should create missing required fields error', () => {
      const error = ValidationErrors.missingRequiredFields(['field1', 'field2']);
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Missing required fields: field1, field2');
      expect(error.details.missingFields).toEqual(['field1', 'field2']);
    });

    test('should create invalid bucket error', () => {
      const error = ValidationErrors.invalidBucket('invalid-bucket', ['valid-bucket']);
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid bucket name');
      expect(error.details.providedBucket).toBe('invalid-bucket');
      expect(error.details.allowedBuckets).toEqual(['valid-bucket']);
    });

    test('should create invalid MIME type error', () => {
      const error = ValidationErrors.invalidMimeType('text/javascript', ['image/jpeg']);
      
      expect(error.code).toBe(ErrorCode.INVALID_FILE);
      expect(error.message).toBe('File type not allowed');
      expect(error.details.providedType).toBe('text/javascript');
      expect(error.details.allowedTypes).toEqual(['image/jpeg']);
    });

    test('should create file size exceeded error', () => {
      const error = ValidationErrors.fileSizeExceeded(20000000, 10000000);
      
      expect(error.code).toBe(ErrorCode.INVALID_FILE);
      expect(error.message).toBe('File size exceeds maximum limit of 9.54MB');
      expect(error.details.fileSize).toBe(20000000);
      expect(error.details.maxSize).toBe(10000000);
    });
  });

  describe('PermissionErrors', () => {
    test('should create authentication required error', () => {
      const error = PermissionErrors.authenticationRequired();
      
      expect(error.code).toBe(ErrorCode.AUTH_ERROR);
      expect(error.message).toBe('User authentication required');
    });

    test('should create user not found error', () => {
      const error = PermissionErrors.userNotFound('user123');
      
      expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe('User not found or inactive');
      expect(error.details.userId).toBe('user123');
    });

    test('should create partner access denied error', () => {
      const error = PermissionErrors.partnerAccessDenied('user123', 'partner456');
      
      expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(error.message).toBe('User does not have access to this partner');
      expect(error.details.userId).toBe('user123');
      expect(error.details.partnerId).toBe('partner456');
    });
  });

  describe('RateLimitErrors', () => {
    test('should create rate limit exceeded error', () => {
      const resetTime = Date.now() + 60000;
      const error = RateLimitErrors.rateLimitExceeded('user123', resetTime);
      
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
      expect(error.message).toBe('Rate limit exceeded. Please try again later.');
      expect(error.details.userId).toBe('user123');
      expect(error.details.resetTime).toBe(resetTime);
    });

    test('should create quota exceeded error', () => {
      const error = RateLimitErrors.quotaExceeded('user123', 100, 95);
      
      expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(error.message).toBe('Upload quota exceeded for this period');
      expect(error.details.quota).toBe(100);
      expect(error.details.used).toBe(95);
      expect(error.details.remaining).toBe(5);
    });
  });

  describe('DatabaseErrors', () => {
    test('should create connection failed error', () => {
      const originalError = new Error('Connection refused');
      const error = DatabaseErrors.connectionFailed(originalError);
      
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toBe('Database connection failed');
      expect(error.details.originalError).toBe('Connection refused');
    });

    test('should create query failed error', () => {
      const originalError = new Error('Syntax error');
      const error = DatabaseErrors.queryFailed('SELECT * FROM users', originalError);
      
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.message).toBe('Database query failed');
      expect(error.details.query).toBe('SELECT * FROM users');
      expect(error.details.originalError).toBe('Syntax error');
    });
  });

  describe('S3Errors', () => {
    test('should create presigned URL failed error', () => {
      const originalError = new Error('Access denied');
      const error = S3Errors.presignedUrlFailed('test-bucket', 'test-key', originalError);
      
      expect(error.code).toBe(ErrorCode.S3_ERROR);
      expect(error.message).toBe('Failed to generate presigned URL');
      expect(error.details.bucket).toBe('test-bucket');
      expect(error.details.key).toBe('test-key');
      expect(error.details.originalError).toBe('Access denied');
    });

    test('should create bucket access denied error', () => {
      const error = S3Errors.bucketAccessDenied('test-bucket');
      
      expect(error.code).toBe(ErrorCode.S3_ERROR);
      expect(error.message).toBe('Access denied to S3 bucket');
      expect(error.details.bucket).toBe('test-bucket');
    });
  });

  describe('handleUnknownError', () => {
    test('should return AppError as-is', () => {
      const appError = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
      const result = handleUnknownError(appError);
      
      expect(result).toBe(appError);
    });

    test('should handle AWS SDK NoSuchBucket error', () => {
      const awsError = new Error('Bucket not found');
      awsError.name = 'NoSuchBucket';
      
      const result = handleUnknownError(awsError);
      
      expect(result.code).toBe(ErrorCode.S3_ERROR);
      expect(result.message).toBe('Access denied to S3 bucket');
    });

    test('should handle AWS SDK AccessDenied error', () => {
      const awsError = new Error('Access denied');
      awsError.name = 'AccessDenied';
      
      const result = handleUnknownError(awsError);
      
      expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(result.message).toBe('Access denied');
    });

    test('should handle database connection errors', () => {
      const dbError = new Error('ECONNREFUSED: Connection refused');
      
      const result = handleUnknownError(dbError);
      
      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(result.message).toBe('Database connection failed');
    });

    test('should handle generic Error objects', () => {
      const genericError = new Error('Something went wrong');
      
      const result = handleUnknownError(genericError);
      
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
    });

    test('should handle non-Error objects', () => {
      const result = handleUnknownError('string error');
      
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.details.error).toBe('string error');
    });
  });

  describe('sanitizeErrorDetails', () => {
    test('should remove sensitive fields', () => {
      const details = {
        username: 'user123',
        password: 'secret123',
        token: 'jwt-token',
        secret: 'api-secret',
        key: 'encryption-key',
        stack: 'Error stack trace',
        originalError: 'Original error message',
        safeField: 'safe-value',
      };
      
      const sanitized = sanitizeErrorDetails(details);
      
      expect(sanitized.username).toBe('user123');
      expect(sanitized.safeField).toBe('safe-value');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.secret).toBeUndefined();
      expect(sanitized.key).toBeUndefined();
      expect(sanitized.stack).toBeUndefined();
      expect(sanitized.originalError).toBeUndefined();
    });

    test('should handle non-object details', () => {
      expect(sanitizeErrorDetails('string')).toBe('string');
      expect(sanitizeErrorDetails(123)).toBe(123);
      expect(sanitizeErrorDetails(null)).toBe(null);
      expect(sanitizeErrorDetails(undefined)).toBe(undefined);
    });
  });

  describe('errorToResponse', () => {
    test('should convert AppError to response format', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', { field: 'value' });
      const response = errorToResponse(error, 'request-123');
      
      expect(response.error).toBe('AppError');
      expect(response.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.message).toBe('Test error');
      expect(response.details).toEqual({ field: 'value' });
      expect(response.requestId).toBe('request-123');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('createErrorResponse', () => {
    test('should create API Gateway error response', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error');
      const headers = { 'Content-Type': 'application/json' };
      
      const response = createErrorResponse(error, headers, 'request-123');
      
      expect(response.statusCode).toBe(400);
      expect(response.headers).toBe(headers);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('AppError');
      expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.message).toBe('Test error');
      expect(body.requestId).toBe('request-123');
    });
  });
});