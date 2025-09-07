import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import jwt from 'jsonwebtoken';

// Database connection
let dbPool: Pool | null = null;
const secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });

interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

/**
 * Initialize database connection
 */
async function initializeDatabase(): Promise<Pool> {
  if (dbPool) return dbPool;

  try {
    const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
    const secret = await secretsClient.send(command);
    
    if (!secret.SecretString) {
      throw new Error('Database secret string is empty');
    }

    const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

    dbPool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('Database connection initialized');
    return dbPool;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Extract user information from JWT token
 */
function extractUserInfo(event: APIGatewayProxyEvent): { userId?: string; isAdmin: boolean } {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;
    const userId = decoded?.sub || decoded?.user_id;
    
    // Check if user is admin (simplified - in production use proper role verification)
    const isAdmin = decoded?.role === 'admin' || decoded?.role === 'super_admin';
    
    return { userId, isAdmin };
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return { isAdmin: false };
  }
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
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
}

/**
 * Get consent metrics
 */
async function getConsentMetrics(db: Pool): Promise<any> {
  const queries = [
    // Total consents
    'SELECT COUNT(*) as total FROM public.user_consent_tracking',
    
    // Active consents (given and not expired)
    `SELECT COUNT(*) as active FROM public.user_consent_tracking 
     WHERE consent_given = true 
     AND (meta->>'expiresAt' IS NULL OR (meta->>'expiresAt')::timestamptz > now())`,
    
    // Expired consents
    `SELECT COUNT(*) as expired FROM public.user_consent_tracking 
     WHERE consent_given = true 
     AND meta->>'expiresAt' IS NOT NULL 
     AND (meta->>'expiresAt')::timestamptz <= now()`,
    
    // Withdrawn consents
    'SELECT COUNT(*) as withdrawn FROM public.user_consent_tracking WHERE consent_given = false',
    
    // Consents by type
    `SELECT consent_type, COUNT(*) as count FROM public.user_consent_tracking 
     WHERE consent_given = true GROUP BY consent_type`,
    
    // Consents by source (from metadata)
    `SELECT 
       COALESCE(meta->>'source', 'unknown') as source, 
       COUNT(*) as count 
     FROM public.user_consent_tracking 
     WHERE consent_given = true 
     GROUP BY meta->>'source'`,
    
    // Average consent duration
    `SELECT AVG(EXTRACT(EPOCH FROM (
       CASE 
         WHEN meta->>'expiresAt' IS NOT NULL 
         THEN (meta->>'expiresAt')::timestamptz - created_at
         ELSE NULL
       END
     )) / 86400) as avg_duration_days
     FROM public.user_consent_tracking 
     WHERE consent_given = true AND meta->>'expiresAt' IS NOT NULL`
  ];

  const results = await Promise.all(
    queries.map(query => db.query(query))
  );

  const [totalResult, activeResult, expiredResult, withdrawnResult, typeResult, sourceResult, durationResult] = results;

  const consentsByType: Record<string, number> = {};
  for (const row of typeResult.rows) {
    consentsByType[row.consent_type] = parseInt(row.count);
  }

  const consentsBySource: Record<string, number> = {};
  for (const row of sourceResult.rows) {
    consentsBySource[row.source] = parseInt(row.count);
  }

  const totalConsents = parseInt(totalResult.rows[0].total);
  const activeConsents = parseInt(activeResult.rows[0].active);
  const expiredConsents = parseInt(expiredResult.rows[0].expired);
  const withdrawnConsents = parseInt(withdrawnResult.rows[0].withdrawn);
  const avgDuration = parseFloat(durationResult.rows[0].avg_duration_days) || 0;

  // Calculate renewal rate (simplified)
  const renewalRate = totalConsents > 0 ? ((activeConsents / totalConsents) * 100) : 0;

  return {
    totalConsents,
    activeConsents,
    expiredConsents,
    withdrawnConsents,
    consentsByType,
    consentsBySource,
    averageConsentDuration: avgDuration,
    renewalRate
  };
}

/**
 * Get quarantine statistics
 */
async function getQuarantineStats(db: Pool): Promise<any> {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM public.quarantine_records',
      'SELECT COUNT(*) as pending FROM public.quarantine_records WHERE status = \'quarantined\' AND review_required = true',
      'SELECT COUNT(*) as approved FROM public.quarantine_records WHERE status = \'approved\'',
      'SELECT COUNT(*) as rejected FROM public.quarantine_records WHERE status = \'rejected\'',
      `SELECT 
         metadata->>'riskLevel' as risk_level, 
         COUNT(*) as count 
       FROM public.quarantine_records 
       WHERE metadata->>'riskLevel' IS NOT NULL
       GROUP BY metadata->>'riskLevel'`,
      `SELECT 
         violation->>'type' as violation_type,
         COUNT(*) as count
       FROM public.quarantine_records,
       jsonb_array_elements(violations) as violation
       GROUP BY violation->>'type'`
    ];

    const results = await Promise.all(
      queries.map(query => db.query(query))
    );

    const [totalResult, pendingResult, approvedResult, rejectedResult, riskLevelResult, violationTypeResult] = results;

    const byRiskLevel: Record<string, number> = {};
    for (const row of riskLevelResult.rows) {
      byRiskLevel[row.risk_level] = parseInt(row.count);
    }

    const byViolationType: Record<string, number> = {};
    for (const row of violationTypeResult.rows) {
      byViolationType[row.violation_type] = parseInt(row.count);
    }

    return {
      totalQuarantined: parseInt(totalResult.rows[0].total),
      pendingReview: parseInt(pendingResult.rows[0].pending),
      approved: parseInt(approvedResult.rows[0].approved),
      rejected: parseInt(rejectedResult.rows[0].rejected),
      byRiskLevel,
      byViolationType
    };
  } catch (error) {
    console.warn('Quarantine table may not exist yet:', error);
    return {
      totalQuarantined: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      byRiskLevel: {},
      byViolationType: {}
    };
  }
}

/**
 * Get compliance violations
 */
async function getViolations(db: Pool, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const query = `
      SELECT 
        id, violation_type, severity, description, user_id, timestamp,
        resolved, resolution, metadata
      FROM public.audit_violations
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `;

    const result = await db.query(query, [startDate, endDate]);

    return result.rows.map(row => ({
      id: row.id,
      type: row.violation_type,
      severity: row.severity,
      description: row.description,
      userId: row.user_id,
      timestamp: row.timestamp,
      resolved: row.resolved,
      resolution: row.resolution,
      metadata: row.metadata || {}
    }));
  } catch (error) {
    console.warn('Audit violations table may not exist yet:', error);
    return [];
  }
}

/**
 * Generate compliance report
 */
async function generateComplianceReport(db: Pool, startDate: Date, endDate: Date): Promise<any> {
  const consentMetrics = await getConsentMetrics(db);
  const violations = await getViolations(db, startDate, endDate);
  
  // Calculate summary metrics
  const summary = {
    totalConsentInteractions: consentMetrics.totalConsents,
    consentGranted: consentMetrics.activeConsents,
    consentWithdrawn: consentMetrics.withdrawnConsents,
    dataAccessEvents: 0, // Would be calculated from audit logs
    policyViolations: violations.length
  };

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (consentMetrics.expiredConsents > 0) {
    recommendations.push(`${consentMetrics.expiredConsents} abgelaufene Einverständnisse erneuern`);
  }
  
  if (violations.filter((v: any) => !v.resolved).length > 0) {
    recommendations.push(`${violations.filter((v: any) => !v.resolved).length} offene Verstöße beheben`);
  }
  
  if (consentMetrics.renewalRate < 80) {
    recommendations.push('Erneuerungsrate für Einverständnisse verbessern');
  }

  return {
    reportId: `compliance_${Date.now()}`,
    generatedAt: new Date(),
    period: { start: startDate, end: endDate },
    summary,
    consentMetrics,
    violations,
    recommendations
  };
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  console.log(`DSGVO Dashboard API request [${requestId}]:`, {
    method: event.httpMethod,
    path: event.path
  });

  const origin = event.headers.Origin || event.headers.origin;
  const headers = getCorsHeaders(origin);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check authentication and admin permissions
    const { userId, isAdmin } = extractUserInfo(event);
    
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Initialize database
    const db = await initializeDatabase();

    // Route requests
    const path = event.resource || event.path;
    
    if (path.includes('/consent-metrics') && event.httpMethod === 'GET') {
      const metrics = await getConsentMetrics(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, metrics })
      };
    }
    
    if (path.includes('/quarantine-stats') && event.httpMethod === 'GET') {
      const statistics = await getQuarantineStats(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, statistics })
      };
    }
    
    if (path.includes('/violations') && event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = queryParams.endDate ? new Date(queryParams.endDate) : new Date();
      
      const violations = await getViolations(db, startDate, endDate);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, violations })
      };
    }
    
    if (path.includes('/compliance-report') && event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = queryParams.endDate ? new Date(queryParams.endDate) : new Date();
      
      const report = await generateComplianceReport(db, startDate, endDate);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, report })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error(`Error in DSGVO dashboard API [${requestId}]:`, error);
    
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