/**
 * Request/Response Transformation Layer
 * 
 * Provides standardized transformation, validation, and sanitization
 * for all AI operations and external API calls.
 */

import { randomUUID } from 'crypto';
import { auditTrailSystem } from './audit-trail-system';

// Standard request/response interfaces
export interface StandardAIRequest {
  requestId: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  operation: string;
  payload: any;
  metadata: {
    source: 'bedrock_agent' | 'external_api' | 'user_input';
    version: string;
    traceId?: string;
  };
}

export interface StandardAIResponse {
  requestId: string;
  timestamp: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    processingTime: number;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    cost?: number;
    cacheHit?: boolean;
  };
}

export interface TransformationRule {
  field: string;
  type: 'sanitize' | 'validate' | 'transform' | 'redact';
  rule: string | RegExp | ((value: any) => any);
  required?: boolean;
  defaultValue?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

// Transformation rules for different request types
const TRANSFORMATION_RULES: Record<string, TransformationRule[]> = {
  'vc_analysis': [
    {
      field: 'business_name',
      type: 'sanitize',
      rule: /[<>\"'&]/g,
      required: true
    },
    {
      field: 'location',
      type: 'validate',
      rule: /^[a-zA-Z0-9\s,.-]+$/,
      required: true
    },
    {
      field: 'email',
      type: 'redact',
      rule: (value: string) => value.replace(/(.{2}).*(@.*)/, '$1***$2')
    },
    {
      field: 'phone',
      type: 'redact',
      rule: (value: string) => value.replace(/(\d{3}).*(\d{3})/, '$1***$2')
    }
  ],
  'content_generation': [
    {
      field: 'content_type',
      type: 'validate',
      rule: /^(social_media|email|blog|description)$/,
      required: true
    },
    {
      field: 'target_audience',
      type: 'sanitize',
      rule: /[<>\"'&]/g
    },
    {
      field: 'brand_voice',
      type: 'validate',
      rule: /^(professional|casual|friendly|formal|playful)$/,
      defaultValue: 'friendly'
    }
  ],
  'external_api': [
    {
      field: 'url',
      type: 'validate',
      rule: /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
      required: true
    },
    {
      field: 'method',
      type: 'validate',
      rule: /^(GET|POST|PUT|DELETE)$/,
      defaultValue: 'GET'
    }
  ]
};

// Sensitive data patterns for redaction
const SENSITIVE_PATTERNS = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]'
  },
  {
    name: 'phone',
    pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE_REDACTED]'
  },
  {
    name: 'credit_card',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]'
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]'
  },
  {
    name: 'api_key',
    pattern: /\b[A-Za-z0-9]{32,}\b/g,
    replacement: '[API_KEY_REDACTED]'
  }
];

/**
 * Transform incoming request to standard format
 */
export function transformIncomingRequest(
  rawRequest: any,
  operation: string,
  userId?: string,
  sessionId?: string
): StandardAIRequest {
  const requestId = rawRequest.requestId || randomUUID();
  const timestamp = new Date().toISOString();

  // Apply transformation rules
  const rules = TRANSFORMATION_RULES[operation] || [];
  const transformedPayload = applyTransformationRules(rawRequest, rules);

  return {
    requestId,
    timestamp,
    userId,
    sessionId,
    operation,
    payload: transformedPayload,
    metadata: {
      source: rawRequest.source || 'user_input',
      version: '1.0',
      traceId: rawRequest.traceId || generateTraceId()
    }
  };
}

/**
 * Transform outgoing response to standard format
 */
export function transformOutgoingResponse(
  data: any,
  requestId: string,
  processingStartTime: number,
  error?: Error,
  tokenUsage?: { input: number; output: number; total: number },
  cost?: number,
  cacheHit?: boolean
): StandardAIResponse {
  const timestamp = new Date().toISOString();
  const processingTime = Date.now() - processingStartTime;

  const response: StandardAIResponse = {
    requestId,
    timestamp,
    success: !error,
    metadata: {
      processingTime,
      tokenUsage,
      cost,
      cacheHit
    }
  };

  if (error) {
    response.error = {
      code: (error as any).code || 'UNKNOWN_ERROR',
      message: error.message,
      details: (error as any).details
    };
  } else {
    // Sanitize response data
    response.data = sanitizeResponseData(data);
  }

  return response;
}

/**
 * Apply transformation rules to request data
 */
function applyTransformationRules(data: any, rules: TransformationRule[]): any {
  const result = { ...data };
  const errors: string[] = [];

  for (const rule of rules) {
    const value = getNestedValue(result, rule.field);

    if (rule.required && (value === undefined || value === null)) {
      if (rule.defaultValue !== undefined) {
        setNestedValue(result, rule.field, rule.defaultValue);
      } else {
        errors.push(`Required field '${rule.field}' is missing`);
        continue;
      }
    }

    if (value !== undefined && value !== null) {
      try {
        const transformedValue = applyRule(value, rule);
        setNestedValue(result, rule.field, transformedValue);
      } catch (error) {
        errors.push(`Transformation failed for field '${rule.field}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Transformation errors: ${errors.join(', ')}`);
  }

  return result;
}

/**
 * Apply a single transformation rule
 */
function applyRule(value: any, rule: TransformationRule): any {
  switch (rule.type) {
    case 'sanitize':
      if (typeof value === 'string' && rule.rule instanceof RegExp) {
        return value.replace(rule.rule, '');
      }
      return value;

    case 'validate':
      if (rule.rule instanceof RegExp) {
        if (typeof value === 'string' && !rule.rule.test(value)) {
          throw new Error(`Value '${value}' does not match pattern ${rule.rule.source}`);
        }
      }
      return value;

    case 'transform':
      if (typeof rule.rule === 'function') {
        return rule.rule(value);
      }
      return value;

    case 'redact':
      if (typeof rule.rule === 'function') {
        return rule.rule(value);
      }
      return value;

    default:
      return value;
  }
}

/**
 * Validate request data
 */
export function validateRequest(
  request: StandardAIRequest,
  operation: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!request.requestId) {
    errors.push('Request ID is required');
  }

  if (!request.operation) {
    errors.push('Operation is required');
  }

  if (!request.payload) {
    errors.push('Payload is required');
  }

  // Operation-specific validation
  const rules = TRANSFORMATION_RULES[operation] || [];
  for (const rule of rules) {
    if (rule.required) {
      const value = getNestedValue(request.payload, rule.field);
      if (value === undefined || value === null) {
        errors.push(`Required field '${rule.field}' is missing`);
      }
    }
  }

  // Check for sensitive data
  const sensitiveDataFound = detectSensitiveData(JSON.stringify(request.payload));
  if (sensitiveDataFound.length > 0) {
    warnings.push(`Sensitive data detected: ${sensitiveDataFound.join(', ')}`);
  }

  // Sanitize data if validation passes
  let sanitizedData;
  if (errors.length === 0) {
    try {
      sanitizedData = sanitizeRequestData(request.payload);
    } catch (error) {
      errors.push(`Data sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData
  };
}

/**
 * Sanitize request data to prevent injection attacks
 */
function sanitizeRequestData(data: any): any {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeRequestData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip potentially dangerous keys
      if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype')) {
        continue;
      }
      sanitized[key] = sanitizeRequestData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Sanitize response data to prevent data leakage
 */
function sanitizeResponseData(data: any): any {
  if (typeof data === 'string') {
    // Redact sensitive patterns
    let sanitized = data;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern.pattern, pattern.replacement);
    }
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip internal fields
      if (key.startsWith('_') || key.includes('secret') || key.includes('password')) {
        continue;
      }
      sanitized[key] = sanitizeResponseData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Detect sensitive data in text
 */
function detectSensitiveData(text: string): string[] {
  const detected: string[] = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.pattern.test(text)) {
      detected.push(pattern.name);
    }
  }

  return detected;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Generate trace ID for request tracking
 */
function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware for request transformation
 */
export async function requestTransformationMiddleware(
  rawRequest: any,
  operation: string,
  userId?: string,
  sessionId?: string
): Promise<StandardAIRequest> {
  const startTime = Date.now();

  try {
    // Transform request
    const standardRequest = transformIncomingRequest(rawRequest, operation, userId, sessionId);

    // Validate request
    const validation = validateRequest(standardRequest, operation);
    if (!validation.valid) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('Request validation warnings:', validation.warnings);
    }

    // Update payload with sanitized data
    if (validation.sanitizedData) {
      standardRequest.payload = validation.sanitizedData;
    }

    // Audit log
    await auditTrailSystem.logAction({
      action: 'request_transformation',
      actor: {
        type: 'ai_agent',
        id: userId || 'anonymous',
        ip_address: undefined,
        user_agent: 'bedrock-agent'
      },
      resource: {
        type: 'ai_request',
        id: standardRequest.requestId,
        metadata: {
          operation,
          processingTime: Date.now() - startTime
        }
      },
      context: {
        sessionId,
        validationWarnings: validation.warnings.length,
        success: true
      }
    });

    return standardRequest;

  } catch (error) {
    // Audit log for failed transformation
    await auditTrailSystem.logAction({
      action: 'request_transformation',
      actor: {
        type: 'ai_agent',
        id: userId || 'anonymous',
        ip_address: undefined,
        user_agent: 'bedrock-agent'
      },
      resource: {
        type: 'ai_request',
        id: rawRequest.requestId || 'unknown',
        metadata: {
          operation,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      context: {
        sessionId,
        success: false
      }
    });

    throw error;
  }
}

/**
 * Middleware for response transformation
 */
export async function responseTransformationMiddleware(
  data: any,
  requestId: string,
  processingStartTime: number,
  error?: Error,
  tokenUsage?: { input: number; output: number; total: number },
  cost?: number,
  cacheHit?: boolean
): Promise<StandardAIResponse> {
  try {
    const response = transformOutgoingResponse(
      data,
      requestId,
      processingStartTime,
      error,
      tokenUsage,
      cost,
      cacheHit
    );

    // Additional response validation
    if (response.data && typeof response.data === 'object') {
      // Ensure no sensitive data leaks
      const sensitiveDataFound = detectSensitiveData(JSON.stringify(response.data));
      if (sensitiveDataFound.length > 0) {
        console.warn(`Sensitive data detected in response: ${sensitiveDataFound.join(', ')}`);
        // Re-sanitize if needed
        response.data = sanitizeResponseData(response.data);
      }
    }

    return response;

  } catch (transformError) {
    // If transformation fails, return error response
    return {
      requestId,
      timestamp: new Date().toISOString(),
      success: false,
      error: {
        code: 'RESPONSE_TRANSFORMATION_ERROR',
        message: transformError instanceof Error ? transformError.message : 'Response transformation failed',
        details: { originalError: error?.message }
      },
      metadata: {
        processingTime: Date.now() - processingStartTime
      }
    };
  }
}