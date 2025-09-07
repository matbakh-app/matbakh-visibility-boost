/**
 * Lambda Pipeline Handler
 * 
 * Main handler that integrates all pipeline components:
 * - Request/Response transformation
 * - Lambda proxy system
 * - Cost control and rate limiting
 * - Circuit breaker patterns
 * - Comprehensive audit logging
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handleProxyRequest, transformRequest, ProxyRequest } from './lambda-pipeline-proxy';
import { 
  requestTransformationMiddleware, 
  responseTransformationMiddleware,
  StandardAIRequest,
  StandardAIResponse 
} from './request-response-transformer';
import { 
  trackOperationCost, 
  checkThrottleStatus, 
  calculateOperationCost,
  getCostUsage,
  getCostAnalytics 
} from './cost-control-system';
import { withCircuitBreaker, isFallbackResponse } from './circuit-breaker';
import { auditTrailSystem } from './audit-trail-system';
import { randomUUID } from 'crypto';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://matbakh.app',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

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
 * Extract user context from API Gateway event
 */
function extractUserContext(event: APIGatewayProxyEvent): { 
  userId?: string; 
  sessionId?: string; 
  ipAddress?: string;
  userAgent?: string;
} {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  let userId: string | undefined;
  let sessionId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // In production, implement proper JWT validation
      userId = `user-${token.substring(0, 8)}`;
    } catch (error) {
      console.warn('Failed to parse auth token:', error);
    }
  }

  sessionId = event.headers['X-Session-ID'] || event.headers['x-session-id'];
  const ipAddress = event.requestContext.identity?.sourceIp;
  const userAgent = event.headers['User-Agent'] || event.headers['user-agent'];

  return { userId, sessionId, ipAddress, userAgent };
}

/**
 * Handle proxy requests (RDS, S3, Secrets, External APIs)
 */
async function handleProxyOperation(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  const { userId, sessionId, ipAddress, userAgent } = extractUserContext(event);

  try {
    // Check throttling status
    const throttleStatus = await checkThrottleStatus(userId || 'anonymous');
    if (throttleStatus.throttled) {
      return createResponse(429, {
        error: 'Service throttled',
        message: throttleStatus.reason || 'Request rate limit exceeded',
        retryAfter: 60
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }

    // Transform request
    const proxyRequest = transformRequest({
      ...requestBody,
      userId,
      sessionId,
      requestId: context.awsRequestId
    });

    // Execute proxy request
    const response = await handleProxyRequest(proxyRequest);

    // Track cost if applicable
    if (response.costEstimate && response.costEstimate > 0) {
      await trackOperationCost(
        userId || 'anonymous',
        proxyRequest.operation,
        response.costEstimate
      );
    }

    return createResponse(200, {
      success: true,
      data: response.data,
      requestId: response.requestId,
      timestamp: response.timestamp,
      rateLimitRemaining: response.rateLimitRemaining
    });

  } catch (error) {
    console.error('Proxy operation failed:', error);

    // Audit log for failed operation
    await auditTrailSystem.logAction({
      action: 'proxy_operation_failed',
      actor: {
        type: 'user',
        id: userId || 'anonymous',
        ip_address: ipAddress,
        user_agent: userAgent
      },
      resource: {
        type: 'proxy_request',
        id: context.awsRequestId,
        metadata: {
          operation: event.path,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      context: {
        sessionId,
        success: false
      }
    });

    return createResponse(500, {
      error: 'Proxy operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: context.awsRequestId
    });
  }
}

/**
 * Handle AI operations with full pipeline
 */
async function handleAIOperation(
  event: APIGatewayProxyEvent,
  context: Context,
  operation: string
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  const { userId, sessionId, ipAddress, userAgent } = extractUserContext(event);

  try {
    // Check throttling status
    const throttleStatus = await checkThrottleStatus(userId || 'anonymous');
    if (throttleStatus.throttled) {
      if (throttleStatus.config?.emergencyShutdown) {
        return createResponse(503, {
          error: 'Service unavailable',
          message: 'AI services are temporarily disabled due to cost limits',
          contact: 'support@matbakh.app'
        });
      }

      return createResponse(429, {
        error: 'Service throttled',
        message: throttleStatus.reason || 'Request rate limit exceeded',
        retryAfter: 60
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }

    // Transform request through middleware
    const standardRequest = await requestTransformationMiddleware(
      requestBody,
      operation,
      userId,
      sessionId
    );

    // Execute AI operation with circuit breaker
    const aiResponse = await withCircuitBreaker(
      `ai-${operation}`,
      async () => {
        // This would call the actual AI service (Bedrock, etc.)
        // For now, return a mock response
        return {
          content: `AI response for ${operation}`,
          tokenUsage: { input: 100, output: 200, total: 300 },
          requestId: standardRequest.requestId,
          timestamp: new Date().toISOString(),
          cost: calculateOperationCost('claude-3-5-sonnet', 100, 200)
        };
      },
      operation
    );

    // Calculate and track cost
    let cost = 0;
    let tokenUsage;

    if (!isFallbackResponse(aiResponse)) {
      tokenUsage = aiResponse.tokenUsage;
      cost = aiResponse.cost || 0;

      if (cost > 0) {
        await trackOperationCost(
          userId || 'anonymous',
          operation,
          cost,
          tokenUsage
        );
      }
    }

    // Transform response through middleware
    const standardResponse = await responseTransformationMiddleware(
      isFallbackResponse(aiResponse) ? aiResponse : aiResponse.content,
      standardRequest.requestId,
      startTime,
      undefined,
      tokenUsage,
      cost,
      false
    );

    return createResponse(200, standardResponse);

  } catch (error) {
    console.error('AI operation failed:', error);

    // Transform error response
    const errorResponse = await responseTransformationMiddleware(
      null,
      context.awsRequestId,
      startTime,
      error instanceof Error ? error : new Error('Unknown error')
    );

    // Audit log for failed operation
    await auditTrailSystem.logAction({
      action: 'ai_operation_failed',
      actor: {
        type: 'user',
        id: userId || 'anonymous',
        ip_address: ipAddress,
        user_agent: userAgent
      },
      resource: {
        type: 'ai_request',
        id: context.awsRequestId,
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

    return createResponse(500, errorResponse);
  }
}

/**
 * Handle cost analytics requests
 */
async function handleCostAnalytics(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const { userId } = extractUserContext(event);

  if (!userId) {
    return createResponse(401, {
      error: 'Unauthorized',
      message: 'Authentication required for cost analytics'
    });
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const period = queryParams.period as 'day' | 'week' | 'month' || 'day';

    if (queryParams.analytics === 'true') {
      const analytics = await getCostAnalytics(userId);
      return createResponse(200, {
        success: true,
        data: analytics
      });
    } else {
      const usage = await getCostUsage(userId, period);
      return createResponse(200, {
        success: true,
        data: usage
      });
    }

  } catch (error) {
    console.error('Cost analytics failed:', error);
    return createResponse(500, {
      error: 'Analytics failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Main Lambda handler
 */
export async function handler(
  event: APIGatewayProxyEvent, 
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('Lambda Pipeline Handler invoked:', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.awsRequestId,
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight successful' });
  }

  try {
    // Route requests based on path
    const path = event.path;

    // Health check
    if (event.httpMethod === 'GET' && path === '/health') {
      return createResponse(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // Cost analytics
    if (event.httpMethod === 'GET' && path === '/cost/analytics') {
      return await handleCostAnalytics(event, context);
    }

    // Proxy operations
    if (path.startsWith('/proxy/')) {
      return await handleProxyOperation(event, context);
    }

    // AI operations
    if (event.httpMethod === 'POST') {
      if (path === '/ai/vc-analysis') {
        return await handleAIOperation(event, context, 'vc_analysis');
      }
      if (path === '/ai/content-generation') {
        return await handleAIOperation(event, context, 'content_generation');
      }
      if (path === '/ai/persona-detection') {
        return await handleAIOperation(event, context, 'persona_detection');
      }
      if (path === '/ai/text-rewrite') {
        return await handleAIOperation(event, context, 'text_rewrite');
      }
    }

    // Route not found
    return createResponse(404, {
      error: 'Not found',
      message: `Route ${event.httpMethod} ${path} not found`
    });

  } catch (error) {
    console.error('Lambda handler error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      requestId: context.awsRequestId
    });
  }
}

/**
 * Warmup handler to prevent cold starts
 */
export async function warmupHandler(): Promise<void> {
  console.log('Lambda warmup executed');
  
  // Initialize connections and caches
  try {
    // Warm up circuit breakers
    await withCircuitBreaker('warmup', async () => {
      return { status: 'warm' };
    }, 'warmup');

    console.log('Lambda warmup completed successfully');
  } catch (error) {
    console.error('Lambda warmup failed:', error);
  }
}