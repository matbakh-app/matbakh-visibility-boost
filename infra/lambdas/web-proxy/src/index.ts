import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://matbakh.app',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

// Allowed domains for web requests
const ALLOWED_DOMAINS = [
  'google.com',
  'www.google.com',
  'googleapis.com',
  'trends.google.com',
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'tripadvisor.com',
  'www.tripadvisor.com',
  'yelp.com',
  'www.yelp.com',
  'maps.googleapis.com',
  'places.googleapis.com',
];

// Rate limiting configuration
const RATE_LIMITS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  maxConcurrentRequests: 10,
};

// Request cache for reducing external API calls
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface WebProxyRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

interface WebProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  cached: boolean;
  requestId: string;
}

/**
 * Create standardized API response
 */
function createResponse(
  statusCode: number,
  body: any,
  additionalHeaders: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(body),
  };
}

/**
 * Validate if domain is allowed and check for SSRF attacks
 */
function isDomainAllowed(url: string): { allowed: boolean; reason?: string } {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return { allowed: false, reason: 'Only HTTPS URLs are allowed' };
    }
    
    // Block metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { allowed: false, reason: 'Metadata endpoints are blocked' };
    }
    
    // Block private IP ranges (RFC1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      
      // 10.0.0.0/8
      if (a === 10) {
        return { allowed: false, reason: 'Private IP range 10.0.0.0/8 is blocked' };
      }
      
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { allowed: false, reason: 'Private IP range 172.16.0.0/12 is blocked' };
      }
      
      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { allowed: false, reason: 'Private IP range 192.168.0.0/16 is blocked' };
      }
      
      // 127.0.0.0/8 (localhost)
      if (a === 127) {
        return { allowed: false, reason: 'Localhost is blocked' };
      }
      
      // 0.0.0.0/8
      if (a === 0) {
        return { allowed: false, reason: 'Invalid IP range 0.0.0.0/8 is blocked' };
      }
    }
    
    // Block IPv6 localhost and private ranges
    if (hostname === '::1' || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
      return { allowed: false, reason: 'IPv6 private ranges are blocked' };
    }
    
    // Block dangerous protocols in hostname (shouldn't happen with URL parsing, but extra safety)
    if (hostname.includes('file:') || hostname.includes('gopher:') || hostname.includes('ftp:')) {
      return { allowed: false, reason: 'Dangerous protocols detected' };
    }
    
    // Check against allowed domains
    const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => {
      return hostname === allowedDomain || hostname.endsWith('.' + allowedDomain);
    });
    
    if (!isAllowed) {
      return { allowed: false, reason: `Domain ${hostname} is not in allowed list` };
    }
    
    return { allowed: true };
  } catch (error) {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const allowedHeaders = [
    'content-type',
    'user-agent',
    'accept',
    'accept-language',
    'cache-control',
  ];
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (allowedHeaders.includes(lowerKey)) {
      sanitized[key] = value;
    }
  }
  
  // Add default headers
  sanitized['User-Agent'] = 'MatbakhBot/1.0 (https://matbakh.app)';
  
  return sanitized;
}

/**
 * Check cache for existing response
 */
function getCachedResponse(cacheKey: string): any | null {
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  
  if (cached) {
    requestCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Store response in cache
 */
function setCachedResponse(cacheKey: string, data: any, ttl: number = CACHE_TTL): void {
  // Limit cache size
  if (requestCache.size > 1000) {
    const oldestKey = requestCache.keys().next().value;
    requestCache.delete(oldestKey);
  }
  
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Make HTTP/HTTPS request with timeout and error handling
 */
function makeHttpRequest(
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeout: number;
  }
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      timeout: options.timeout,
    };
    
    const req = client.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers as Record<string, string>,
          body,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { requests: number[]; }>();

function checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, { requests: [] });
  }
  
  const clientData = rateLimitStore.get(clientId)!;
  
  // Remove old requests outside the window
  clientData.requests = clientData.requests.filter(timestamp => now - timestamp < windowMs);
  
  if (clientData.requests.length >= RATE_LIMITS.requestsPerMinute) {
    return { allowed: false, remaining: 0 };
  }
  
  clientData.requests.push(now);
  return { allowed: true, remaining: RATE_LIMITS.requestsPerMinute - clientData.requests.length };
}

/**
 * Main Lambda handler for web proxy
 */
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('Web Proxy Lambda invoked:', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.awsRequestId,
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight successful' });
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createResponse(405, {
      error: 'Method not allowed',
      message: 'Only POST requests are supported',
    });
  }

  try {
    // Parse request body
    let requestBody: WebProxyRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      });
    }

    // Validate required fields
    if (!requestBody.url) {
      return createResponse(400, {
        error: 'Missing URL',
        message: 'URL is required in request body',
      });
    }
    
    // Validate request body size
    if (requestBody.body && requestBody.body.length > 1024 * 1024) { // 1MB limit
      return createResponse(413, {
        error: 'Request body too large',
        message: 'Request body must be less than 1MB',
      });
    }

    // Validate domain and check for SSRF
    const domainCheck = isDomainAllowed(requestBody.url);
    if (!domainCheck.allowed) {
      return createResponse(403, {
        error: 'Domain not allowed',
        message: domainCheck.reason || 'The requested domain is not allowed',
        allowedDomains: ALLOWED_DOMAINS,
      });
    }

    // Rate limiting
    const clientId = event.requestContext.identity.sourceIp || 'unknown';
    const rateLimitResult = checkRateLimit(clientId);
    if (!rateLimitResult.allowed) {
      return createResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
      });
    }

    // Check cache if cache key is provided
    const cacheKey = requestBody.cacheKey || `${requestBody.method || 'GET'}:${requestBody.url}`;
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response for:', cacheKey);
      return createResponse(200, {
        success: true,
        data: cachedResponse,
        cached: true,
        requestId: context.awsRequestId,
      });
    }

    // Prepare request options
    const method = requestBody.method || 'GET';
    const timeout = Math.min(requestBody.timeout || 10000, 30000); // Max 30 seconds
    const headers = sanitizeHeaders(requestBody.headers || {});

    // Make the external request
    console.log(`Making ${method} request to:`, requestBody.url);
    const response = await makeHttpRequest(requestBody.url, {
      method,
      headers,
      body: requestBody.body,
      timeout,
    });

    // Parse response body if it's JSON
    let responseData: any = response.body;
    try {
      if (response.headers['content-type']?.includes('application/json')) {
        responseData = JSON.parse(response.body);
      }
    } catch (error) {
      // Keep as string if not valid JSON
    }

    const proxyResponse: WebProxyResponse = {
      statusCode: response.statusCode,
      headers: response.headers,
      body: responseData,
      cached: false,
      requestId: context.awsRequestId,
    };

    // Cache successful responses
    if (response.statusCode >= 200 && response.statusCode < 300) {
      const cacheTTL = requestBody.cacheTTL || CACHE_TTL;
      setCachedResponse(cacheKey, proxyResponse, cacheTTL);
    }

    return createResponse(200, {
      success: true,
      data: proxyResponse,
      cached: false,
      requestId: context.awsRequestId,
    });

  } catch (error) {
    console.error('Web proxy error:', error);

    return createResponse(500, {
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      requestId: context.awsRequestId,
    });
  }
}

/**
 * Health check function
 */
export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
  try {
    // Test with a simple Google request
    const testResponse = await makeHttpRequest('https://www.google.com', {
      method: 'GET',
      headers: { 'User-Agent': 'MatbakhBot/1.0 (https://matbakh.app)' },
      timeout: 5000,
    });

    return {
      status: 'healthy',
      details: {
        testUrl: 'https://www.google.com',
        statusCode: testResponse.statusCode,
        cacheSize: requestCache.size,
        allowedDomains: ALLOWED_DOMAINS.length,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}