/**
 * Controlled Web Access System
 * 
 * Implements secure, whitelisted external API access for AI agents.
 * Provides Lambda proxy for Google APIs, Instagram, and other external services
 * with comprehensive request sanitization, response caching, and audit logging.
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { auditTrailSystem } from './audit-trail-system';
import { withCircuitBreaker } from './circuit-breaker';
import { randomUUID } from 'crypto';

// Types for web access control
export interface WebAccessRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  cacheTTL?: number; // Override default cache TTL
}

export interface WebAccessResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId: string;
  timestamp: string;
  cached: boolean;
  rateLimitRemaining?: number;
  costEstimate?: number;
}

export interface DomainConfig {
  domain: string;
  allowedEndpoints: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  requiresAuth: boolean;
  secretName?: string; // AWS Secrets Manager secret name for API keys
  defaultCacheTTL: number; // seconds
  costPerRequest: number; // USD
  allowedMethods: string[];
  requestSanitization: boolean;
  responseSanitization: boolean;
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const WEB_ACCESS_CACHE_TABLE = 'bedrock_web_access_cache';
const WEB_ACCESS_LOGS_TABLE = 'bedrock_web_access_logs';
const RATE_LIMIT_TABLE = 'bedrock_web_rate_limits';

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });

// Allowed domains and their configurations
const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  'maps.googleapis.com': {
    domain: 'maps.googleapis.com',
    allowedEndpoints: [
      '/maps/api/place/details/json',
      '/maps/api/place/nearbysearch/json',
      '/maps/api/place/textsearch/json',
      '/maps/api/geocode/json',
      '/maps/api/place/photo'
    ],
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 2000
    },
    requiresAuth: true,
    secretName: 'google/maps-api-key',
    defaultCacheTTL: 3600, // 1 hour
    costPerRequest: 0.005, // $0.005 per request
    allowedMethods: ['GET'],
    requestSanitization: true,
    responseSanitization: true
  },
  'trends.googleapis.com': {
    domain: 'trends.googleapis.com',
    allowedEndpoints: [
      '/trends/api/explore',
      '/trends/api/widgetdata/relatedsearches',
      '/trends/api/widgetdata/multiline'
    ],
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500
    },
    requiresAuth: false,
    defaultCacheTTL: 7200, // 2 hours
    costPerRequest: 0.001, // $0.001 per request
    allowedMethods: ['GET'],
    requestSanitization: true,
    responseSanitization: true
  },
  'graph.instagram.com': {
    domain: 'graph.instagram.com',
    allowedEndpoints: [
      '/me/media',
      '/me/accounts',
      '/{media-id}',
      '/{user-id}/media'
    ],
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      requestsPerDay: 1000
    },
    requiresAuth: true,
    secretName: 'instagram/access-token',
    defaultCacheTTL: 1800, // 30 minutes
    costPerRequest: 0.002, // $0.002 per request
    allowedMethods: ['GET', 'POST'],
    requestSanitization: true,
    responseSanitization: true
  },
  'graph.facebook.com': {
    domain: 'graph.facebook.com',
    allowedEndpoints: [
      '/me/accounts',
      '/{page-id}/posts',
      '/{page-id}/insights'
    ],
    rateLimits: {
      requestsPerMinute: 15,
      requestsPerHour: 150,
      requestsPerDay: 800
    },
    requiresAuth: true,
    secretName: 'facebook/access-token',
    defaultCacheTTL: 1800, // 30 minutes
    costPerRequest: 0.002, // $0.002 per request
    allowedMethods: ['GET', 'POST'],
    requestSanitization: true,
    responseSanitization: true
  },
  'api.yelp.com': {
    domain: 'api.yelp.com',
    allowedEndpoints: [
      '/v3/businesses/search',
      '/v3/businesses/{id}',
      '/v3/businesses/{id}/reviews'
    ],
    rateLimits: {
      requestsPerMinute: 25,
      requestsPerHour: 300,
      requestsPerDay: 1500
    },
    requiresAuth: true,
    secretName: 'yelp/api-key',
    defaultCacheTTL: 3600, // 1 hour
    costPerRequest: 0.003, // $0.003 per request
    allowedMethods: ['GET'],
    requestSanitization: true,
    responseSanitization: true
  }
};

/**
 * Validate web access request
 */
function validateWebAccessRequest(request: WebAccessRequest): {
  valid: boolean;
  config?: DomainConfig;
  error?: string;
} {
  try {
    const url = new URL(request.url);
    const domain = url.hostname;
    const pathname = url.pathname;

    // Check if domain is allowed
    const config = DOMAIN_CONFIGS[domain];
    if (!config) {
      return {
        valid: false,
        error: `Domain ${domain} is not in the allowed list`
      };
    }

    // Check if method is allowed
    if (!config.allowedMethods.includes(request.method)) {
      return {
        valid: false,
        error: `Method ${request.method} not allowed for domain ${domain}`
      };
    }

    // Check if endpoint is allowed
    const endpointAllowed = config.allowedEndpoints.some(endpoint => {
      // Support parameterized endpoints like /{media-id}
      const pattern = endpoint.replace(/\{[^}]+\}/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname) || pathname.startsWith(endpoint);
    });

    if (!endpointAllowed) {
      return {
        valid: false,
        error: `Endpoint ${pathname} not allowed for domain ${domain}`
      };
    }

    return { valid: true, config };

  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check rate limits for domain and user
 */
async function checkWebAccessRateLimit(
  userId: string,
  domain: string,
  config: DomainConfig
): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);

  const rateLimitKey = `${userId}:${domain}:${day}`;

  try {
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
      lastMinute: minute,
      lastHour: hour,
      lastUpdate: now
    };

    if (response.Item) {
      currentData = {
        requestsThisMinute: parseInt(response.Item.requests_this_minute?.N || '0'),
        requestsThisHour: parseInt(response.Item.requests_this_hour?.N || '0'),
        requestsThisDay: parseInt(response.Item.requests_this_day?.N || '0'),
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
    if (currentData.requestsThisMinute >= config.rateLimits.requestsPerMinute ||
        currentData.requestsThisHour >= config.rateLimits.requestsPerHour ||
        currentData.requestsThisDay >= config.rateLimits.requestsPerDay) {
      
      return {
        allowed: false,
        remaining: Math.max(0, config.rateLimits.requestsPerMinute - currentData.requestsThisMinute),
        resetTime: (minute + 1) * 60000
      };
    }

    // Update counters
    const updateCommand = new UpdateItemCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: {
        rate_limit_key: { S: rateLimitKey }
      },
      UpdateExpression: 'SET requests_this_minute = :minute, requests_this_hour = :hour, requests_this_day = :day, last_minute = :lm, last_hour = :lh, last_update = :lu',
      ExpressionAttributeValues: {
        ':minute': { N: (currentData.requestsThisMinute + 1).toString() },
        ':hour': { N: (currentData.requestsThisHour + 1).toString() },
        ':day': { N: (currentData.requestsThisDay + 1).toString() },
        ':lm': { N: minute.toString() },
        ':lh': { N: hour.toString() },
        ':lu': { N: now.toString() }
      }
    });

    await dynamoClient.send(updateCommand);

    return {
      allowed: true,
      remaining: Math.max(0, config.rateLimits.requestsPerMinute - currentData.requestsThisMinute - 1)
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open for now, but log the error
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Get cached response
 */
async function getCachedResponse(cacheKey: string): Promise<any | null> {
  try {
    const command = new GetItemCommand({
      TableName: WEB_ACCESS_CACHE_TABLE,
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
    console.error('Cache retrieval failed:', error);
    return null;
  }
}

/**
 * Store response in cache
 */
async function cacheResponse(cacheKey: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    
    const command = new PutItemCommand({
      TableName: WEB_ACCESS_CACHE_TABLE,
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
 * Get API credentials from Secrets Manager
 */
async function getAPICredentials(secretName: string): Promise<string | null> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName
    });

    const response = await secretsClient.send(command);
    
    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      return secret.apiKey || secret.accessToken || secret.token || response.SecretString;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get API credentials for ${secretName}:`, error);
    return null;
  }
}

/**
 * Sanitize request data
 */
function sanitizeRequest(request: WebAccessRequest, config: DomainConfig): WebAccessRequest {
  if (!config.requestSanitization) {
    return request;
  }

  const sanitized = { ...request };

  // Sanitize URL parameters
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Remove potentially dangerous parameters
    const dangerousParams = ['callback', 'jsonp', 'script', 'eval'];
    dangerousParams.forEach(param => params.delete(param));
    
    // Limit parameter values length
    for (const [key, value] of params.entries()) {
      if (value.length > 1000) {
        params.set(key, value.substring(0, 1000));
      }
    }
    
    sanitized.url = url.toString();
  } catch (error) {
    console.warn('URL sanitization failed:', error);
  }

  // Sanitize headers
  if (sanitized.headers) {
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(sanitized.headers)) {
      // Skip potentially dangerous headers
      if (key.toLowerCase().includes('script') || key.toLowerCase().includes('eval')) {
        continue;
      }
      sanitizedHeaders[key] = String(value).substring(0, 500);
    }
    sanitized.headers = sanitizedHeaders;
  }

  // Sanitize body
  if (sanitized.body && typeof sanitized.body === 'object') {
    sanitized.body = sanitizeObject(sanitized.body);
  }

  return sanitized;
}

/**
 * Sanitize response data
 */
function sanitizeResponse(data: any, config: DomainConfig): any {
  if (!config.responseSanitization) {
    return data;
  }

  return sanitizeObject(data);
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      // Remove potentially dangerous content
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip potentially dangerous keys
    if (key.includes('__proto__') || key.includes('constructor') || key.includes('eval')) {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Log web access request
 */
async function logWebAccess(
  request: WebAccessRequest,
  response: WebAccessResponse,
  config: DomainConfig,
  cached: boolean
): Promise<void> {
  try {
    const logEntry = {
      request_id: { S: response.requestId },
      timestamp: { S: response.timestamp },
      user_id: { S: request.userId || 'anonymous' },
      session_id: { S: request.sessionId || 'none' },
      domain: { S: config.domain },
      url: { S: request.url },
      method: { S: request.method },
      success: { BOOL: response.success },
      cached: { BOOL: cached },
      cost_estimate: { N: response.costEstimate?.toString() || '0' },
      rate_limit_remaining: { N: response.rateLimitRemaining?.toString() || '0' },
      error_message: { S: response.error || 'none' }
    };

    const command = new PutItemCommand({
      TableName: WEB_ACCESS_LOGS_TABLE,
      Item: logEntry
    });

    await dynamoClient.send(command);
  } catch (error) {
    console.error('Web access logging failed:', error);
    // Don't throw - logging failure shouldn't break the operation
  }
}

/**
 * Execute web access request with circuit breaker
 */
export async function executeWebAccessRequest(request: WebAccessRequest): Promise<WebAccessResponse> {
  const requestId = request.requestId || randomUUID();
  const startTime = Date.now();

  return withCircuitBreaker(
    `web-access-${new URL(request.url).hostname}`,
    async () => {
      // Validate request
      const validation = validateWebAccessRequest(request);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const config = validation.config!;
      const domain = new URL(request.url).hostname;

      // Check rate limits
      const rateLimitResult = await checkWebAccessRateLimit(
        request.userId || 'anonymous',
        domain,
        config
      );

      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded for domain');
      }

      // Sanitize request
      const sanitizedRequest = sanitizeRequest(request, config);

      // Check cache for GET requests
      let cachedResponse = null;
      const cacheKey = `${domain}:${sanitizedRequest.method}:${sanitizedRequest.url}`;
      
      if (sanitizedRequest.method === 'GET') {
        cachedResponse = await getCachedResponse(cacheKey);
        if (cachedResponse) {
          const response: WebAccessResponse = {
            success: true,
            data: cachedResponse,
            requestId,
            timestamp: new Date().toISOString(),
            cached: true,
            rateLimitRemaining: rateLimitResult.remaining,
            costEstimate: 0 // No cost for cached responses
          };

          await logWebAccess(sanitizedRequest, response, config, true);
          return response;
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'matbakh-ai-agent/1.0',
        ...sanitizedRequest.headers
      };

      // Add authentication if required
      if (config.requiresAuth && config.secretName) {
        const credentials = await getAPICredentials(config.secretName);
        if (credentials) {
          if (domain.includes('googleapis.com')) {
            // Google APIs use API key in URL or header
            if (sanitizedRequest.url.includes('?')) {
              sanitizedRequest.url += `&key=${credentials}`;
            } else {
              sanitizedRequest.url += `?key=${credentials}`;
            }
          } else {
            // Most other APIs use Bearer token
            headers['Authorization'] = `Bearer ${credentials}`;
          }
        } else {
          throw new Error(`Failed to get API credentials for ${config.secretName}`);
        }
      }

      // Make the request
      const fetchOptions: RequestInit = {
        method: sanitizedRequest.method,
        headers
      };

      if (sanitizedRequest.body && sanitizedRequest.method !== 'GET') {
        fetchOptions.body = JSON.stringify(sanitizedRequest.body);
      }

      const fetchResponse = await fetch(sanitizedRequest.url, fetchOptions);
      
      if (!fetchResponse.ok) {
        throw new Error(`External API call failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      let responseData;
      const contentType = fetchResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await fetchResponse.json();
      } else {
        responseData = await fetchResponse.text();
      }

      // Sanitize response
      const sanitizedData = sanitizeResponse(responseData, config);

      // Cache successful GET responses
      if (sanitizedRequest.method === 'GET') {
        const ttl = request.cacheTTL || config.defaultCacheTTL;
        await cacheResponse(cacheKey, sanitizedData, ttl);
      }

      const response: WebAccessResponse = {
        success: true,
        data: sanitizedData,
        requestId,
        timestamp: new Date().toISOString(),
        cached: false,
        rateLimitRemaining: rateLimitResult.remaining,
        costEstimate: config.costPerRequest
      };

      // Log the request
      await logWebAccess(sanitizedRequest, response, config, false);

      // Audit log
      await auditTrailSystem.logAction({
        action: 'web_access_request',
        actor: {
          type: 'ai_agent',
          id: request.userId || 'anonymous',
          ip_address: undefined,
          user_agent: 'bedrock-agent'
        },
        resource: {
          type: 'external_api',
          id: domain,
          metadata: {
            url: sanitizedRequest.url,
            method: sanitizedRequest.method,
            processingTime: Date.now() - startTime,
            cached: false,
            cost: config.costPerRequest
          }
        },
        context: {
          sessionId: request.sessionId,
          requestId,
          success: true
        }
      });

      return response;
    },
    'web_access'
  );
}

/**
 * Get allowed domains and their configurations
 */
export function getAllowedDomains(): Record<string, DomainConfig> {
  return { ...DOMAIN_CONFIGS };
}

/**
 * Check if domain is allowed
 */
export function isDomainAllowed(domain: string): boolean {
  return domain in DOMAIN_CONFIGS;
}

/**
 * Get domain configuration
 */
export function getDomainConfig(domain: string): DomainConfig | null {
  return DOMAIN_CONFIGS[domain] || null;
}