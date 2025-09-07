import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AuditLogger } from './audit-logger';
import { AuditQueryEngine } from './audit-query-engine';
import { 
  AuditConfig, 
  AuditEventTypeSchema, 
  AuditSeveritySchema, 
  AuditSourceSchema,
  AuditQueryParams
} from './types';
import jwt from 'jsonwebtoken';

// Global instances (cached across Lambda invocations)
let auditLogger: AuditLogger | null = null;
let queryEngine: AuditQueryEngine | null = null;

/**
 * Initialize audit system
 */
async function initializeAuditSystem(): Promise<{ logger: AuditLogger; queryEngine: AuditQueryEngine }> {
  if (auditLogger && queryEngine) {
    return { logger: auditLogger, queryEngine };
  }

  // Configuration
  const config: AuditConfig = {
    enableCloudWatchLogs: process.env.ENABLE_CLOUDWATCH_LOGS !== 'false',
    enableS3Archive: process.env.ENABLE_S3_ARCHIVE !== 'false',
    enableDatabaseStorage: process.env.ENABLE_DATABASE_STORAGE !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years default
    archiveAfterDays: parseInt(process.env.AUDIT_ARCHIVE_AFTER_DAYS || '365'),
    encryptionEnabled: process.env.AUDIT_ENCRYPTION_ENABLED === 'true',
    checksumValidation: process.env.AUDIT_CHECKSUM_VALIDATION !== 'false',
    realTimeAlerts: process.env.AUDIT_REAL_TIME_ALERTS === 'true'
  };

  // Initialize logger
  auditLogger = new AuditLogger(config);
  await auditLogger.initializeDatabase();

  // Initialize query engine
  queryEngine = new AuditQueryEngine();
  await queryEngine.initialize();

  console.log('Audit system initialized', {
    cloudWatchLogs: config.enableCloudWatchLogs,
    s3Archive: config.enableS3Archive,
    databaseStorage: config.enableDatabaseStorage,
    retentionDays: config.retentionDays
  });

  return { logger: auditLogger, queryEngine };
}

/**
 * Extract user information from request
 */
function extractUserInfo(event: APIGatewayProxyEvent): {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
} {
  // Extract user ID from JWT token
  let userId: string | undefined;
  let sessionId: string | undefined;
  
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as any;
      userId = decoded?.sub || decoded?.user_id;
      sessionId = decoded?.session_id || decoded?.sid;
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

  return { userId, sessionId, ipAddress, userAgent };
}

/**
 * Get system information
 */
function getSystemInfo(context: Context): any {
  return {
    service: 'consent-audit-protocol',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    region: process.env.AWS_REGION || 'eu-central-1',
    requestId: context.awsRequestId
  };
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
 * Handle audit log creation
 */
async function handleLogAuditEvent(
  event: APIGatewayProxyEvent,
  context: Context,
  logger: AuditLogger
): Promise<APIGatewayProxyResult> {
  const { userId, sessionId, ipAddress, userAgent } = extractUserInfo(event);
  const systemInfo = getSystemInfo(context);
  
  if (!event.body) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);
    
    // Validate required fields
    const eventType = AuditEventTypeSchema.parse(requestData.eventType);
    const severity = AuditSeveritySchema.parse(requestData.severity);
    const source = AuditSourceSchema.parse(requestData.source);

    // Log the audit event
    const auditId = await logger.logEvent(
      eventType,
      severity,
      userId,
      ipAddress,
      userAgent,
      source,
      systemInfo,
      requestData.consentInteraction,
      requestData.dataAccess,
      { ...requestData.metadata, sessionId }
    );

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        auditId,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error logging audit event:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to log audit event'
      })
    };
  }
}

/**
 * Handle audit log queries
 */
async function handleQueryAuditLogs(
  event: APIGatewayProxyEvent,
  queryEngine: AuditQueryEngine
): Promise<APIGatewayProxyResult> {
  const { userId } = extractUserInfo(event);
  
  // Check if user has admin permissions (simplified check)
  if (!userId) {
    return {
      statusCode: 401,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    
    const params: AuditQueryParams = {
      userId: queryParams.userId,
      eventType: queryParams.eventType as any,
      severity: queryParams.severity as any,
      source: queryParams.source as any,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      ipAddress: queryParams.ipAddress,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 100,
      offset: queryParams.offset ? parseInt(queryParams.offset) : 0
    };

    const result = await queryEngine.queryAuditLogs(params);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error querying audit logs:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to query audit logs'
      })
    };
  }
}

/**
 * Handle audit statistics requests
 */
async function handleGetAuditStatistics(
  event: APIGatewayProxyEvent,
  queryEngine: AuditQueryEngine
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
    const queryParams = event.queryStringParameters || {};
    
    const startDate = queryParams.startDate 
      ? new Date(queryParams.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    
    const endDate = queryParams.endDate 
      ? new Date(queryParams.endDate)
      : new Date(); // Default: now

    const statistics = await queryEngine.getAuditStatistics(startDate, endDate);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        statistics,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to get audit statistics'
      })
    };
  }
}

/**
 * Handle compliance report generation
 */
async function handleGenerateComplianceReport(
  event: APIGatewayProxyEvent,
  queryEngine: AuditQueryEngine
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
    const queryParams = event.queryStringParameters || {};
    
    const startDate = queryParams.startDate 
      ? new Date(queryParams.startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: last 90 days
    
    const endDate = queryParams.endDate 
      ? new Date(queryParams.endDate)
      : new Date(); // Default: now

    const report = await queryEngine.generateComplianceReport(startDate, endDate);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        success: true,
        report,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.Origin || event.headers.origin),
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to generate compliance report'
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
  console.log(`Consent Audit Protocol request [${requestId}]:`, {
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
    // Initialize audit system
    const { logger, queryEngine } = await initializeAuditSystem();

    // Route requests based on path
    const path = event.resource || event.path;
    
    switch (true) {
      case path.includes('/log') && event.httpMethod === 'POST':
        return await handleLogAuditEvent(event, context, logger);
        
      case path.includes('/query') && event.httpMethod === 'GET':
        return await handleQueryAuditLogs(event, queryEngine);
        
      case path.includes('/statistics') && event.httpMethod === 'GET':
        return await handleGetAuditStatistics(event, queryEngine);
        
      case path.includes('/compliance-report') && event.httpMethod === 'GET':
        return await handleGenerateComplianceReport(event, queryEngine);
        
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error(`Error in audit protocol handler [${requestId}]:`, error);
    
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