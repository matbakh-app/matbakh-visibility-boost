/**
 * Custom error classes and type guards for SWOT Analysis Engine
 */

export class AnalysisError extends Error {
  public code: string;
  public type: 'validation' | 'processing' | 'external_service' | 'timeout';
  public details?: unknown;

  constructor(
    message: string,
    code: string,
    type: 'validation' | 'processing' | 'external_service' | 'timeout',
    details?: unknown
  ) {
    super(message);
    this.name = 'AnalysisError';
    this.code = code;
    this.type = type;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AnalysisError);
    }
  }
}

/**
 * Type guard to check if an unknown error is an AnalysisError
 */
export function isAnalysisError(error: unknown): error is AnalysisError {
  return !!error && 
         typeof error === 'object' && 
         'name' in error && 
         (error as any).name === 'AnalysisError' &&
         'code' in error && 
         'type' in error &&
         'message' in error;
}

/**
 * Type guard to check if an unknown error is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe error message extraction from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isAnalysisError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}