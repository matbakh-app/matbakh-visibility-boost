/**
 * Error handling utilities for S3 presigned URL Lambda function
 */

// Error codes for consistent error handling
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_FILE = 'INVALID_FILE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  S3_ERROR = 'S3_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
}

// HTTP status codes mapping
export const HTTP_STATUS_CODES = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_FILE]: 400,
  [ErrorCode.AUTH_ERROR]: 401,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.S3_ERROR]: 500,
} as const;

// Error response interface
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

// Custom error class for application errors
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = HTTP_STATUS_CODES[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, AppError);
  }
}

// Validation error factory functions
export const ValidationErrors = {
  missingRequiredFields: (fields: string[]) => new AppError(
    ErrorCode.VALIDATION_ERROR,
    `Missing required fields: ${fields.join(', ')}`,
    { missingFields: fields }
  ),

  invalidBucket: (bucket: string, allowedBuckets: string[]) => new AppError(
    ErrorCode.VALIDATION_ERROR,
    'Invalid bucket name',
    { providedBucket: bucket, allowedBuckets }
  ),

  invalidMimeType: (contentType: string, allowedTypes: string[]) => new AppError(
    ErrorCode.INVALID_FILE,
    'File type not allowed',
    { providedType: contentType, allowedTypes }
  ),

  fileSizeExceeded: (size: number, maxSize: number) => new AppError(
    ErrorCode.INVALID_FILE,
    `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
    { fileSize: size, maxSize }
  ),

  invalidFilename: (filename: string, reason: string) => new AppError(
    ErrorCode.INVALID_FILE,
    `Invalid filename: ${reason}`,
    { filename, reason }
  ),

  invalidFolder: (folder: string, allowedFolders: string[]) => new AppError(
    ErrorCode.VALIDATION_ERROR,
    `Invalid folder: ${folder}`,
    { providedFolder: folder, allowedFolders }
  ),
};

// Permission error factory functions
export const PermissionErrors = {
  authenticationRequired: () => new AppError(
    ErrorCode.AUTH_ERROR,
    'User authentication required'
  ),

  invalidToken: (reason: string) => new AppError(
    ErrorCode.AUTH_ERROR,
    `Invalid authentication token: ${reason}`
  ),

  userNotFound: (userId: string) => new AppError(
    ErrorCode.PERMISSION_DENIED,
    'User not found or inactive',
    { userId }
  ),

  insufficientPermissions: (userId: string, bucket: string) => new AppError(
    ErrorCode.PERMISSION_DENIED,
    'User not authorized for this bucket',
    { userId, bucket }
  ),

  partnerAccessDenied: (userId: string, partnerId: string) => new AppError(
    ErrorCode.PERMISSION_DENIED,
    'User does not have access to this partner',
    { userId, partnerId }
  ),
};

// Rate limiting error factory functions
export const RateLimitErrors = {
  rateLimitExceeded: (userId: string, resetTime: number) => new AppError(
    ErrorCode.RATE_LIMITED,
    'Rate limit exceeded. Please try again later.',
    { 
      userId, 
      resetTime,
      resetTimeFormatted: new Date(resetTime).toISOString()
    }
  ),

  quotaExceeded: (userId: string, quota: number, used: number) => new AppError(
    ErrorCode.QUOTA_EXCEEDED,
    'Upload quota exceeded for this period',
    { userId, quota, used, remaining: Math.max(0, quota - used) }
  ),
};

// Database error factory functions
export const DatabaseErrors = {
  connectionFailed: (error: Error) => new AppError(
    ErrorCode.DATABASE_ERROR,
    'Database connection failed',
    { originalError: error.message }
  ),

  queryFailed: (query: string, error: Error) => new AppError(
    ErrorCode.DATABASE_ERROR,
    'Database query failed',
    { query: query.substring(0, 100), originalError: error.message }
  ),

  transactionFailed: (error: Error) => new AppError(
    ErrorCode.DATABASE_ERROR,
    'Database transaction failed',
    { originalError: error.message }
  ),
};

// S3 error factory functions
export const S3Errors = {
  presignedUrlFailed: (bucket: string, key: string, error: Error) => new AppError(
    ErrorCode.S3_ERROR,
    'Failed to generate presigned URL',
    { bucket, key, originalError: error.message }
  ),

  bucketAccessDenied: (bucket: string) => new AppError(
    ErrorCode.S3_ERROR,
    'Access denied to S3 bucket',
    { bucket }
  ),

  invalidBucketConfiguration: (bucket: string, error: Error) => new AppError(
    ErrorCode.S3_ERROR,
    'S3 bucket configuration error',
    { bucket, originalError: error.message }
  ),
};

// Internal error factory functions
export const InternalErrors = {
  unexpectedError: (error: Error) => new AppError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    { originalError: error.message, stack: error.stack }
  ),

  configurationError: (setting: string) => new AppError(
    ErrorCode.INTERNAL_ERROR,
    `Configuration error: ${setting}`,
    { setting }
  ),

  serviceUnavailable: (service: string) => new AppError(
    ErrorCode.INTERNAL_ERROR,
    `Service temporarily unavailable: ${service}`,
    { service }
  ),
};

/**
 * Convert AppError to API Gateway response format
 */
export function errorToResponse(error: AppError, requestId?: string): ErrorResponse {
  return {
    error: error.name,
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
    requestId,
  };
}

/**
 * Handle unknown errors and convert to AppError
 */
export function handleUnknownError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific AWS SDK errors
    if (error.name === 'NoSuchBucket') {
      return S3Errors.bucketAccessDenied(error.message);
    }
    
    if (error.name === 'AccessDenied') {
      return new AppError(ErrorCode.PERMISSION_DENIED, 'Access denied', { originalError: error.message });
    }
    
    if (error.name === 'InvalidParameterValue') {
      return new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid parameter', { originalError: error.message });
    }
    
    // Database connection errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return DatabaseErrors.connectionFailed(error);
    }
    
    // Generic error handling
    return InternalErrors.unexpectedError(error);
  }

  // Handle non-Error objects
  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    'An unknown error occurred',
    { error: String(error) }
  );
}

/**
 * Log error with appropriate level
 */
export function logError(error: AppError, context?: any): void {
  const logData = {
    error: {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack,
    },
    context,
  };

  // Log at different levels based on error type
  if (error.statusCode >= 500) {
    console.error('Internal server error:', JSON.stringify(logData, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn('Client error:', JSON.stringify(logData, null, 2));
  } else {
    console.info('Application error:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Sanitize error details for client response (remove sensitive information)
 */
export function sanitizeErrorDetails(details: any): any {
  if (!details || typeof details !== 'object') {
    return details;
  }

  const sanitized = { ...details };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'stack', 'originalError'];
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Create error response for API Gateway
 */
export function createErrorResponse(
  error: AppError,
  headers: Record<string, string>,
  requestId?: string
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  // Log the error
  logError(error, { requestId });

  // Create sanitized response
  const errorResponse: ErrorResponse = {
    error: error.name,
    code: error.code,
    message: error.message,
    details: sanitizeErrorDetails(error.details),
    timestamp: error.timestamp,
    requestId,
  };

  return {
    statusCode: error.statusCode,
    headers,
    body: JSON.stringify(errorResponse),
  };
}