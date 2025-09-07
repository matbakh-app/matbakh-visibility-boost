/**
 * Lambda Pipeline Proxy System
 * 
 * Provides secure proxy layer for all external API calls from AI agents.
 * Implements rate limiting, cost control, and circuit breaker patterns.
 * 
 * Security Constraints:
 * - No direct S3/RDS/Secrets access from AI agents
 * - All external calls go through this proxy
 * - Request/response transformation and validation
 * - Comprehensive audit logging
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { withCircuitBreaker, isFallbackResponse } from './circuit-breaker';
import { auditTrailSystem } from './audit-trail-system';
import { randomUUID } from 'crypto';

// Types for proxy operations
export interface ProxyRequest {
  operation: 'rds_query' | 's3_read' | 's3_write' | 'secrets_read' | 'external_api';
  target: string; // Database name, bucket name, secret name, or API endpoint
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId: string;
  timestamp: string;
  rateLimitRemaining?: number;
  costEstimate?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  costLimitPerDay: number; // in USD
}

export interface ExternalAPIConfig {
  allowedDomains: string[];
  allowedEndpoints: string[];
  rateLimits: RateLimitConfig;
  requiresAuth: boolean;
  cacheTTL?: number; // seconds
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const RATE_LIMIT_TABLE = 'bedrock_rate_limits';
const PROXY_CACHE_TABLE = 'bedrock_proxy_cache';
const COST_TRACKING_TABLE = 'bedrock_cost_tracking';

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const rdsClient = new RDSDataClient({ region: REGION });

// Default rate limits per user/session
const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  costLimitPerDay: 10.0, // $10 per day
};

// Allowed external APIs configuration
const EXTERNAL_API_CONFIG: Record<string, ExternalAPIConfig> = {
  'google_maps': {
    allowedDomains: ['maps.googleapis.com'],
    allowedEndpoints: [
      '/maps/api/place/details/json',
      '/maps/api/place/nearbysearch/json',
      '/maps/api/geocode/json'
    ],
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      costLimitPerDay: 5.0
    },
    requiresAuth: true,
    cacheTTL: 3600 // 1 hour
  },
  'google_trends': {
    allowedDomains: ['trends.googleapis.com'],
    allowedEndpoints: [
      '/trends/api/explore',
      '/trends/api/widgetdata/relatedsearches'
    ],
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500,
      costLimitPerDay: 2.0
    },
    requiresAuth: false,
    cacheTTL: 7200 // 2 hours
  },
  'instagram_basic': {
    allowedDomains: ['graph.instagram.com'],
    allowedEndpoints: [
      '/me/media',
      '/me/accounts'
    ],
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      requestsPerDay: 1000,
      costLimitPerDay: 1.0
    },
    requiresAuth: true,
    cacheTTL: 1800 // 30 minutes
  }
};

/**
 * Rate limiting check and update
 */
async function checkAndUpdateRateLimit(
  userId: string,
  operation: string,
  costEstimate: number = 0
): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  const minute = Math.floor(now / 60000);

  const rateLimitKey = `${userId}:${operation}:${today}`;

  try {
    // Get current rate limit data
    const getCommand = new GetItemCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: {
        rate_limit_key: { S: rateLimitKey }
      }
    });

    const response = await dynamoClient.send(getCommand);
    
    let currentData = {
      requestsThisMinute: 0,
      requestsThisHour: 0,
      requestsThisDay: 0,
      costThisDay: 0,
      lastMinute: minute,
      lastHour: hour,
      lastUpdate: now
    };

    if (response.Item) {
      currentData = {
        requestsThisMinute: parseInt(response.Item.requests_this_minute?.N || '0'),
        requestsThisHour: parseInt(response.Item.requests_this_hour?.N || '0'),
        requestsThisDay: parseInt(response.Item.requests_this_day?.N || '0'),
        costThisDay: parseFloat(response.Item.cost_this_day?.N || '0'),
        lastMinute: parseInt(response.Item.last_minute?.N || '0'),
        lastHour: parseInt(response.Item.last_hour?.N || '0'),
        lastUpdate: parseInt(response.Item.last_update?.N || '0')
      };

      // Reset counters if time periods have changed
      if (currentData.lastMinute !== minute) {
        currentData.requestsThisMinute = 0;
        currentData.lastMinute = minute;
      }
      if (currentData.lastHour !== hour) {
        currentData.requestsThisHour = 0;
        currentData.lastHour = hour;
      }
    }

    // Check limits
    const limits = DEFAULT_RATE_LIMITS;
    if (currentData.requestsThisMinute >= limits.requestsPerMinute ||
        currentData.requestsThisHour >= limits.requestsPerHour ||
        currentData.requestsThisDay >= limits.requestsPerDay ||
        currentData.costThisDay + costEstimate > limits.costLimitPerDay) {
      
      return {
        allowed: false,
        remaining: Math.max(0, limits.requestsPerMinute - currentData.requestsThisMinute),
        resetTime: (minute + 1) * 60000
      };
    }

    // Update counters
    const updateCommand = new UpdateItemCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: {
        rate_limit_key: { S: rateLimitKey }
      },
      UpdateExpression: 'SET requests_this_minute = :minute, requests_this_hour = :hour, requests_this_day = :day, cost_this_day = :cost, last_minute = :lm, last_hour = :lh, last_update = :lu',
      ExpressionAttributeValues: {
        ':minute': { N: (currentData.requestsThisMinute + 1).toString() },
        ':hour': { N: (currentData.requestsThisHour + 1).toString() },
        ':day': { N: (currentData.requestsThisDay + 1).toString() },
        ':cost': { N: (currentData.costThisDay + costEstimate).toString() },
        ':lm': { N: minute.toString() },
        ':lh': { N: hour.toString() },
        ':lu': { N: now.toString() }
      }
    });

    await dynamoClient.send(updateCommand);

    return {
      allowed: true,
      remaining: Math.max(0, limits.requestsPerMinute - currentData.requestsThisMinute - 1)
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open for now, but log the error
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Check cache for previous responses
 */
async function checkCache(cacheKey: string): Promise<any | null> {
  try {
    const command = new GetItemCommand({
      TableName: PROXY_CACHE_TABLE,
      Key: {
        cache_key: { S: cacheKey }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (response.Item) {
      const expiresAt = parseInt(response.Item.expires_at?.N || '0');
      if (Date.now() < expiresAt) {
        return JSON.parse(response.Item.cached_data?.S || '{}');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Cache check failed:', error);
    return null;
  }
}

/**
 * Store response in cache
 */
async function storeInCache(cacheKey: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    
    const command = new PutItemCommand({
      TableName: PROXY_CACHE_TABLE,
      Item: {
        cache_key: { S: cacheKey },
        cached_data: { S: JSON.stringify(data) },
        expires_at: { N: expiresAt.toString() },
        created_at: { S: new Date().toISOString() }
      }
    });

    await dynamoClient.send(command);
  } catch (error) {
    console.error('Cache storage failed:', error);
    // Don't throw - caching failure shouldn't break the operation
  }
}

/**
 * Validate external API request
 */
function validateExternalAPIRequest(url: string, method: string = 'GET'): {
  valid: boolean;
  config?: ExternalAPIConfig;
  error?: string;
} {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Find matching API configuration
    for (const [apiName, config] of Object.entries(EXTERNAL_API_CONFIG)) {
      if (config.allowedDomains.includes(domain)) {
        // Check if endpoint is allowed
        const endpointAllowed = config.allowedEndpoints.some(endpoint => 
          pathname.startsWith(endpoint)
        );
        
        if (!endpointAllowed) {
          return {
            valid: false,
            error: `Endpoint ${pathname} not allowed for ${apiName}`
          };
        }

        return { valid: true, config };
      }
    }

    return {
      valid: false,
      error: `Domain ${domain} not in allowed list`
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Execute RDS query through proxy
 */
async function executeRDSQuery(
  query: string,
  parameters: any[] = [],
  userId?: string
): Promise<any> {
  // Validate query for safety
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i,
    /TRUNCATE/i,
    /ALTER\s+TABLE/i,
    /CREATE\s+TABLE/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error(`Dangerous SQL pattern detected: ${pattern.source}`);
    }
  }

  // Execute query with RDS Data API
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.RDS_CLUSTER_ARN,
    secretArn: process.env.RDS_SECRET_ARN,
    database: process.env.RDS_DATABASE_NAME || 'matbakh',
    sql: query,
    parameters: parameters.map(param => ({ value: { stringValue: String(param) } }))
  });

  const response = await rdsClient.send(command);
  return response.records;
}

/**
 * Execute S3 operation through proxy
 */
async function executeS3Operation(
  operation: 'read' | 'write',
  bucket: string,
  key: string,
  data?: any,
  userId?: string
): Promise<any> {
  // Validate bucket and key
  const allowedBuckets = [
    process.env.S3_UPLOADS_BUCKET,
    process.env.S3_CACHE_BUCKET,
    process.env.S3_LOGS_BUCKET
  ].filter(Boolean);

  if (!allowedBuckets.includes(bucket)) {
    throw new Error(`Bucket ${bucket} not in allowed list`);
  }

  // Ensure user can only access their own data
  if (userId && !key.startsWith(`users/${userId}/`)) {
    throw new Error('Access denied: can only access own user data');
  }

  if (operation === 'read') {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();
    return body;
  } else {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });
    
    await s3Client.send(command);
    return { success: true, key };
  }
}

/**
 * Execute external API call through proxy
 */
async function executeExternalAPICall(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  body?: any,
  userId?: string
): Promise<any> {
  const validation = validateExternalAPIRequest(url, method);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const config = validation.config!;
  
  // Check cache first
  const cacheKey = `external_api:${url}:${JSON.stringify(body)}`;
  if (config.cacheTTL && method === 'GET') {
    const cachedResponse = await checkCache(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Add authentication if required
  if (config.requiresAuth) {
    const apiKey = await getAPIKey(url);
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  // Make the request
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'matbakh-ai-agent/1.0',
      ...headers
    }
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`External API call failed: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();

  // Cache successful GET responses
  if (config.cacheTTL && method === 'GET') {
    await storeInCache(cacheKey, responseData, config.cacheTTL);
  }

  return responseData;
}

/**
 * Get API key from Secrets Manager
 */
async function getAPIKey(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Map domains to secret names
    const secretMap: Record<string, string> = {
      'maps.googleapis.com': 'google/maps-api-key',
      'graph.instagram.com': 'instagram/access-token'
    };

    const secretName = secretMap[domain];
    if (!secretName) {
      return null;
    }

    const command = new GetSecretValueCommand({
      SecretId: secretName
    });

    const response = await secretsClient.send(command);
    return response.SecretString || null;
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

/**
 * Main proxy handler with circuit breaker
 */
export async function handleProxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
  const requestId = request.requestId || randomUUID();
  const startTime = Date.now();

  return withCircuitBreaker(
    `proxy-${request.operation}`,
    async () => {
      // Rate limiting check
      const rateLimitResult = await checkAndUpdateRateLimit(
        request.userId || 'anonymous',
        request.operation,
        0.01 // Estimated cost per operation
      );

      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded');
      }

      let result: any;

      // Execute operation based on type
      switch (request.operation) {
        case 'rds_query':
          result = await executeRDSQuery(
            request.payload.query,
            request.payload.parameters,
            request.userId
          );
          break;

        case 's3_read':
          result = await executeS3Operation(
            'read',
            request.target,
            request.payload.key,
            undefined,
            request.userId
          );
          break;

        case 's3_write':
          result = await executeS3Operation(
            'write',
            request.target,
            request.payload.key,
            request.payload.data,
            request.userId
          );
          break;

        case 'secrets_read':
          const command = new GetSecretValueCommand({
            SecretId: request.target
          });
          const secretResponse = await secretsClient.send(command);
          result = { value: secretResponse.SecretString };
          break;

        case 'external_api':
          result = await executeExternalAPICall(
            request.target,
            request.method,
            request.headers,
            request.payload,
            request.userId
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${request.operation}`);
      }

      const response: ProxyResponse = {
        success: true,
        data: result,
        requestId,
        timestamp: new Date().toISOString(),
        rateLimitRemaining: rateLimitResult.remaining,
        costEstimate: 0.01
      };

      // Audit log
      await auditTrailSystem.logAction({
        action: 'proxy_request',
        actor: {
          type: 'ai_agent',
          id: request.userId || 'anonymous',
          ip_address: undefined,
          user_agent: 'bedrock-agent'
        },
        resource: {
          type: request.operation,
          id: request.target,
          metadata: {
            method: request.method,
            requestId
          }
        },
        context: {
          sessionId: request.sessionId,
          duration: Date.now() - startTime,
          success: true
        }
      });

      return response;
    },
    request.operation
  );
}

/**
 * Request/Response transformation middleware
 */
export function transformRequest(rawRequest: any): ProxyRequest {
  // Validate and sanitize incoming request
  const request: ProxyRequest = {
    operation: rawRequest.operation,
    target: rawRequest.target,
    method: rawRequest.method || 'GET',
    payload: rawRequest.payload || {},
    headers: rawRequest.headers || {},
    userId: rawRequest.userId,
    sessionId: rawRequest.sessionId,
    requestId: rawRequest.requestId || randomUUID()
  };

  // Sanitize payload to prevent injection attacks
  if (request.payload && typeof request.payload === 'object') {
    request.payload = sanitizeObject(request.payload);
  }

  return request;
}

/**
 * Sanitize object to prevent injection attacks
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove potentially dangerous keys
    if (key.includes('__') || key.includes('$') || key.includes('..')) {
      continue;
    }

    if (typeof value === 'string') {
      // Basic SQL injection prevention
      sanitized[key] = value.replace(/[';--]/g, '');
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Cost tracking and alerting
 */
export async function trackCost(
  userId: string,
  operation: string,
  cost: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const costKey = `${userId}:${today}`;

    const updateCommand = new UpdateItemCommand({
      TableName: COST_TRACKING_TABLE,
      Key: {
        cost_key: { S: costKey }
      },
      UpdateExpression: 'ADD total_cost :cost SET last_updated = :timestamp',
      ExpressionAttributeValues: {
        ':cost': { N: cost.toString() },
        ':timestamp': { S: new Date().toISOString() }
      }
    });

    await dynamoClient.send(updateCommand);

    // Check if cost threshold exceeded
    const getCommand = new GetItemCommand({
      TableName: COST_TRACKING_TABLE,
      Key: {
        cost_key: { S: costKey }
      }
    });

    const response = await dynamoClient.send(getCommand);
    if (response.Item) {
      const totalCost = parseFloat(response.Item.total_cost?.N || '0');
      if (totalCost > DEFAULT_RATE_LIMITS.costLimitPerDay) {
        console.warn(`Cost limit exceeded for user ${userId}: $${totalCost}`);
        // TODO: Send alert to administrators
      }
    }
  } catch (error) {
    console.error('Cost tracking failed:', error);
  }
}