import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

// Types
interface ConsentRequest {
  consent_type: 'upload' | 'vc' | 'newsletter' | 'analytics' | 'marketing';
  consent_given?: boolean;
  meta?: Record<string, any>;
}

interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

// Constants
const ALLOWED_CONSENT_TYPES = ['upload', 'vc', 'newsletter', 'analytics', 'marketing'] as const;

// Cached database pool
let cachedPool: Pool | null = null;

// Initialize AWS clients
const secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });

/**
 * Get PostgreSQL connection pool
 */
async function getPgClient(): Promise<Pool> {
  if (cachedPool) {
    return cachedPool;
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
    const secret = await secretsClient.send(command);
    
    if (!secret.SecretString) {
      throw new Error('Secret string is empty');
    }

    const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

    cachedPool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('PostgreSQL connection pool created successfully');
    return cachedPool;

  } catch (error) {
    console.error('Failed to create PostgreSQL connection pool:', error);
    throw error;
  }
}

/**
 * Extract user ID from JWT token (simplified - in production use proper JWT verification)
 */
function extractUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    // In production, use proper JWT verification
    // For now, we'll extract from the token payload (unsafe but functional)
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || payload.user_id || null;
  } catch (error) {
    console.warn('Failed to extract user ID from token:', error);
    return null;
  }
}

/**
 * Get client IP address from event
 */
function getClientIpAddress(event: APIGatewayProxyEvent): string {
  return (
    event.requestContext?.identity?.sourceIp ||
    event.headers['X-Forwarded-For']?.split(',')[0]?.trim() ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Get user agent from event
 */
function getUserAgent(event: APIGatewayProxyEvent): string {
  return (
    event.headers['User-Agent'] ||
    event.headers['user-agent'] ||
    'unknown'
  );
}

/**
 * Store consent in database
 */
async function storeConsent(
  userId: string | null,
  ipAddress: string,
  userAgent: string,
  consentType: string,
  consentGiven: boolean,
  meta: Record<string, any>
): Promise<void> {
  const pool = await getPgClient();
  
  const query = `
    INSERT INTO public.user_consent_tracking (
      user_id, ip_address, user_agent, consent_type, consent_given, meta
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, created_at
  `;
  
  const values = [
    userId,
    ipAddress,
    userAgent,
    consentType,
    consentGiven,
    JSON.stringify(meta)
  ];
  
  const result = await pool.query(query, values);
  
  console.log(`Consent stored successfully:`, {
    id: result.rows[0].id,
    userId,
    consentType,
    consentGiven,
    createdAt: result.rows[0].created_at
  });
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
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Main Lambda handler
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  console.log(`Track consent request received [${requestId}]:`, JSON.stringify(event, null, 2));

  // Get CORS headers
  const origin = event.headers.Origin || event.headers.origin;
  const headers = getCorsHeaders(origin);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    let request: ConsentRequest;
    try {
      request = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate consent_type
    if (!request.consent_type || !ALLOWED_CONSENT_TYPES.includes(request.consent_type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid consent_type',
          allowed_types: ALLOWED_CONSENT_TYPES
        }),
      };
    }

    // Extract user information
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const userId = extractUserIdFromToken(authHeader);
    const ipAddress = getClientIpAddress(event);
    const userAgent = getUserAgent(event);
    const consentGiven = request.consent_given !== false; // Default to true
    const meta = {
      ...request.meta,
      requestId,
      timestamp: new Date().toISOString(),
      source: 'track-consent-lambda'
    };

    // Store consent in database
    await storeConsent(
      userId,
      ipAddress,
      userAgent,
      request.consent_type,
      consentGiven,
      meta
    );

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Consent tracked successfully',
        consent_type: request.consent_type,
        consent_given: consentGiven,
        user_id: userId,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error(`Error tracking consent [${requestId}]:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to track consent',
        requestId
      }),
    };
  }
};