/**
 * AWS Lambda Handler for Threat Detection Engine
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ThreatDetectionEngine } from './threat-detection-engine';
import { ThreatDetectionRequest, ThreatDetectionResult } from './types';

const threatDetectionEngine = new ThreatDetectionEngine();

/**
 * Lambda handler for threat detection requests
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Threat Detection Engine Lambda invoked', {
    requestId: context.awsRequestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    const path = event.path;
    const method = event.httpMethod;

    // Route requests based on path and method
    switch (true) {
      case method === 'POST' && path === '/threat-detection/analyze':
        return await handleThreatAnalysis(event, headers);
      
      case method === 'GET' && path === '/threat-detection/health':
        return await handleHealthCheck(event, headers);
      
      case method === 'GET' && path === '/threat-detection/stats':
        return await handleGetStats(event, headers);
      
      case method === 'POST' && path === '/threat-detection/patterns':
        return await handleUpdatePatterns(event, headers);
      
      case method === 'POST' && path === '/threat-detection/rules':
        return await handleUpdateRules(event, headers);
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Not Found',
            message: `Path ${path} with method ${method} not found`,
          }),
        };
    }

  } catch (error) {
    console.error('Threat Detection Engine error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: context.awsRequestId,
      }),
    };
  }
};

/**
 * Handle threat analysis requests
 */
async function handleThreatAnalysis(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
        }),
      };
    }

    const request: ThreatDetectionRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.promptId || !request.userId || !request.prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'promptId, userId, and prompt are required fields',
        }),
      };
    }

    // Perform threat detection
    const result: ThreatDetectionResult = await threatDetectionEngine.detectThreats(request);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };

  } catch (error) {
    console.error('Threat analysis error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Analysis Failed',
        message: error instanceof Error ? error.message : 'Threat analysis failed',
      }),
    };
  }
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const stats = await threatDetectionEngine.getDetectionStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      engine: {
        patternsLoaded: stats.patternsLoaded,
        rulesLoaded: stats.rulesLoaded,
        lastUpdated: stats.lastUpdated,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: health,
      }),
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      }),
    };
  }
}

/**
 * Handle get statistics requests
 */
async function handleGetStats(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    const stats = await threatDetectionEngine.getDetectionStats();
    const patterns = threatDetectionEngine.getThreatPatterns();
    const rules = threatDetectionEngine.getSecurityRules();

    const detailedStats = {
      engine: stats,
      patterns: {
        total: patterns.length,
        byType: patterns.reduce((acc, pattern) => {
          acc[pattern.type] = (acc[pattern.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        enabled: patterns.filter(p => p.enabled).length,
        disabled: patterns.filter(p => !p.enabled).length,
      },
      rules: {
        total: rules.length,
        enabled: rules.filter(r => r.enabled).length,
        disabled: rules.filter(r => !r.enabled).length,
        byPriority: rules.reduce((acc, rule) => {
          const priority = `priority_${rule.priority}`;
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: detailedStats,
      }),
    };

  } catch (error) {
    console.error('Get stats error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Stats Retrieval Failed',
        message: error instanceof Error ? error.message : 'Failed to retrieve statistics',
      }),
    };
  }
}

/**
 * Handle update patterns requests
 */
async function handleUpdatePatterns(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body with patterns is required',
        }),
      };
    }

    const { patterns } = JSON.parse(event.body);
    
    if (!Array.isArray(patterns)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'patterns must be an array',
        }),
      };
    }

    await threatDetectionEngine.updateThreatPatterns(patterns);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Updated ${patterns.length} threat patterns`,
      }),
    };

  } catch (error) {
    console.error('Update patterns error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Pattern Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update patterns',
      }),
    };
  }
}

/**
 * Handle update rules requests
 */
async function handleUpdateRules(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body with rules is required',
        }),
      };
    }

    const { rules } = JSON.parse(event.body);
    
    if (!Array.isArray(rules)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'rules must be an array',
        }),
      };
    }

    await threatDetectionEngine.updateSecurityRules(rules);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Updated ${rules.length} security rules`,
      }),
    };

  } catch (error) {
    console.error('Update rules error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Rules Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update rules',
      }),
    };
  }
}

/**
 * Batch threat detection handler for internal use
 */
export const batchHandler = async (
  event: { requests: ThreatDetectionRequest[] },
  context: Context
): Promise<{ results: ThreatDetectionResult[] }> => {
  console.log('Batch Threat Detection invoked', {
    requestId: context.awsRequestId,
    batchSize: event.requests.length,
  });

  const results: ThreatDetectionResult[] = [];

  try {
    // Process requests in parallel with concurrency limit
    const concurrencyLimit = 10;
    const batches = [];
    
    for (let i = 0; i < event.requests.length; i += concurrencyLimit) {
      const batch = event.requests.slice(i, i + concurrencyLimit);
      batches.push(batch);
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(request => threatDetectionEngine.detectThreats(request))
      );
      results.push(...batchResults);
    }

    console.log(`Batch processing completed: ${results.length} results`);
    
    return { results };

  } catch (error) {
    console.error('Batch processing error:', error);
    throw error;
  }
};