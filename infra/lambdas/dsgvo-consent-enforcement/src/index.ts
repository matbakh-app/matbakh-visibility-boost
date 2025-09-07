import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ConsentEnforcementEngine } from './consent-enforcement-engine';
import { ConsentDatabase } from './consent-database';
import { ConsentCache } from './consent-cache';
import { 
  ConsentVerificationRequestSchema, 
  ConsentEnforcementConfig,
  ConsentTypeSchema 
} from './types';
import jwt from 'jsonwebtoken';

// Global instances (cached across Lambda invocations)
let enforcementEngine: ConsentEnforcementEngine | null = null;

/**
 * Initialize the consent enforcement engine
 */
async function initializeEngine(): Promise<ConsentEnforcementEngine> {
  if (enforcementEngine) {
    return enforcementEngine;
  }

  // Configuration
  const config: ConsentEnforcementConfig = {
    strictMode: process.env.CONSENT_STRICT_MODE === 'true',
    defaultExpirationDays: parseInt(process.env.CONSENT_EXPIRATION_DAYS || '365'),
    gracePeriodDays: parseInt(process.env.CONSENT_GRACE_PERIOD_DAYS || '30'),
    cacheExpirationSeconds: parseInt(process.env.CACHE_EXPIRATION_SECONDS || '300'),
    requiredConsentsPerOperation: {
      upload: ['upload', 'data_storage'],
      analysis: ['vc', 'ai_processing'],
      processing: ['ai_processing', 'data_storage'],
      storage: ['data_storage'],
      sharing: ['third_party_sharing'],
      newsletter: ['newsletter', 'marketing'],
      analytics: ['analytics']
    }
  };

  // Initialize database
  const database = new ConsentDatabase();
  await database.connect();

  // Initialize cache
  const cache = new ConsentCache(process.env.REDIS_URL);
  await cache.connect();

  // Create engine
  enforcementEngine = new ConsentEnforcementEngine(database, cache, config);
  
  console.log('Consent enforcement engine initialized', {
    strictMode: config.strictMode,
    defaultExpirationDays: config.defaultExpirationDays,
    gracePeriodDays: config.gracePeriodDays
  });

  return enforcementEngine;
}

/**
 * Extract user information from request
 */
function extractUserInfo(event: APIGatewayProxyEvent): {
  userId?: string;
  ipAddress: string;
  userAgent: string;
} {
  // Extract user ID from JWT token
  let userId: string | undefined;
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as any;
      userId = decoded?.sub || decoded?.user_id;
    } catch (error) {
      console.warn('Failed to decode JWT token:', error);
    }
  }

  // Extract IP address
  const ipAddress = (
    event.requestContext?.identity?.sourceIp ||
    event.headers['X-Forwarded-For']?.split(',')[0]?.trim() ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  );

  // Extract user agent
  const userAgent = (
    event.headers['User-Agent'] ||
    event.headers['user-agent'] ||
    'unknown'
  );

  return { userId, ipAddress, userAgent };
}

/**
 * Get CORS headers
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'https://matbakh.app',
    'https://staging.matbakh.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Handle consent verification requests
 */
async function handleVerifyConsent(
  event: APIGatewayProxyEvent,
  engine: ConsentEnforcementEngine
): Promise<APIGatewayProxyResult> {
  const { userId, ipAddress, userAgent } = extractUserInfo(event);
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    
    // Validate request
    const validatedRequest = ConsentVerificationRequestSchema.parse({
      ...requestData,
      userId,
      ipAddress,
      metadata: { ...requestData.metadata, userAgent }
    });

    // Verify consent
    const result = await engine.verifyConsent(validatedRequest);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        result,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error verifying consent:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to verify consent'
      })
    };
  }
}

/**
 * Handle consent storage requests
 */
async function handleStoreConsent(
  event: APIGatewayProxyEvent,
  engine: ConsentEnforcementEngine
): Promise<APIGatewayProxyResult> {
  const { userId, ipAddress, userAgent } = extractUserInfo(event);
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    
    // Validate consent type
    const consentType = ConsentTypeSchema.parse(requestData.consentType);
    const consentGiven = requestData.consentGiven !== false; // Default to true
    const version = requestData.version || '1.0';
    const expirationDays = requestData.expirationDays;
    const metadata = requestData.metadata || {};

    // Store consent
    const consentId = await engine.storeConsent(
      userId,
      ipAddress,
      userAgent,
      consentType,
      consentGiven,
      version,
      expirationDays,
      metadata
    );

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        consentId,
        consentType,
        consentGiven,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error storing consent:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to store consent'
      })
    };
  }
}

/**
 * Handle consent status requests
 */
async function handleGetConsentStatus(
  event: APIGatewayProxyEvent,
  engine: ConsentEnforcementEngine
): Promise<APIGatewayProxyResult> {
  const { userId } = extractUserInfo(event);
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  try {
    const status = await engine.getConsentStatus(userId);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        userId,
        ...status,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error getting consent status:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to get consent status'
      })
    };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  console.log(`DSGVO Consent Enforcement request [${requestId}]:`, {
    method: event.httpMethod,
    path: event.path,
    resource: event.resource
  });

  // Get CORS headers
  const origin = event.headers.Origin || event.headers.origin;
  const headers = getCorsHeaders(origin);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize engine
    const engine = await initializeEngine();

    // Route requests based on path
    const path = event.resource || event.path;
    
    switch (true) {
      case path.includes('/verify') && event.httpMethod === 'POST':
        return await handleVerifyConsent(event, engine);
        
      case path.includes('/store') && event.httpMethod === 'POST':
        return await handleStoreConsent(event, engine);
        
      case path.includes('/status') && event.httpMethod === 'GET':
        return await handleGetConsentStatus(event, engine);
        
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error(`Error in consent enforcement handler [${requestId}]:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId
      })
    };
  }
};