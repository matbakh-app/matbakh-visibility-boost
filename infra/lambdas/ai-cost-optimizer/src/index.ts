/**
 * AI Cost Optimizer Lambda Handler
 * Main entry point for cost optimization and management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, ScheduledEvent } from 'aws-lambda';
import { CostTracker } from './cost-tracker';
import { CostPredictor } from './cost-predictor';
import { ThresholdManager } from './threshold-manager';
import { 
  CostTrackingRecord, 
  CostThreshold, 
  CostPrediction, 
  CostAnalytics,
  TimePeriod 
} from './types';

// Global instances (cached across Lambda invocations)
let costTracker: CostTracker | null = null;
let costPredictor: CostPredictor | null = null;
let thresholdManager: ThresholdManager | null = null;
let initialized = false;

/**
 * Initialize the cost optimizer
 */
async function initializeCostOptimizer(): Promise<void> {
  if (initialized) {
    return;
  }

  console.log('Initializing AI Cost Optimizer...');

  costTracker = new CostTracker();
  costPredictor = new CostPredictor(costTracker);
  thresholdManager = new ThresholdManager(costTracker);

  initialized = true;
  console.log('AI Cost Optimizer initialized successfully');
}

/**
 * Handle scheduled threshold checks
 */
async function handleScheduledEvent(event: ScheduledEvent): Promise<void> {
  console.log('Processing scheduled threshold check');

  if (!thresholdManager) {
    throw new Error('Threshold manager not initialized');
  }

  try {
    const alerts = await thresholdManager.checkThresholds();
    console.log(`Threshold check completed: ${alerts.length} alerts generated`);

    // Log alert summary
    if (alerts.length > 0) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
      const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
      
      console.log(`Alert summary: ${criticalAlerts} critical, ${warningAlerts} warnings`);
    }

  } catch (error) {
    console.error('Scheduled threshold check failed:', error);
    throw error;
  }
}

/**
 * Handle API Gateway requests
 */
async function handleAPIRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters, queryStringParameters, body, headers } = event;

  try {
    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Initialize cost optimizer
    await initializeCostOptimizer();

    // Route requests
    if (path === '/cost/track' && httpMethod === 'POST') {
      if (!body || !costTracker) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body and cost tracker required' }),
        };
      }

      const costRecord: CostTrackingRecord = JSON.parse(body);
      await costTracker.recordCost(costRecord);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Cost recorded successfully' }),
      };
    }

    if (path === '/cost/analytics' && httpMethod === 'GET') {
      if (!costTracker) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cost tracker not initialized' }),
        };
      }

      const period = (queryStringParameters?.period as TimePeriod) || 'daily';
      const startDate = queryStringParameters?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = queryStringParameters?.endDate || new Date().toISOString();
      const scopeType = queryStringParameters?.scopeType;
      const scopeId = queryStringParameters?.scopeId;

      const scope = scopeType && scopeId ? { type: scopeType, id: scopeId } : undefined;
      const analytics = await costTracker.getCostAnalytics(period, startDate, endDate, scope);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(analytics),
      };
    }

    if (path === '/cost/summary' && httpMethod === 'GET') {
      if (!costTracker) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cost tracker not initialized' }),
        };
      }

      const userId = queryStringParameters?.userId;
      const summary = await costTracker.getCostSummary(userId);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(summary),
      };
    }

    if (path === '/cost/predict' && httpMethod === 'POST') {
      if (!body || !costPredictor) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body and cost predictor required' }),
        };
      }

      const { scope, period, lookbackDays } = JSON.parse(body);
      const prediction = await costPredictor.generatePrediction(scope, period, lookbackDays);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(prediction),
      };
    }

    if (path === '/cost/thresholds' && httpMethod === 'GET') {
      if (!thresholdManager) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Threshold manager not initialized' }),
        };
      }

      const scope = queryStringParameters?.scope || 'global';
      const thresholds = await thresholdManager.getThresholds(scope);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ thresholds }),
      };
    }

    if (path === '/cost/thresholds' && httpMethod === 'POST') {
      if (!body || !thresholdManager) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body and threshold manager required' }),
        };
      }

      const thresholdData = JSON.parse(body);
      const threshold = await thresholdManager.createThreshold(thresholdData);
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(threshold),
      };
    }

    if (path.startsWith('/cost/thresholds/') && httpMethod === 'PUT') {
      const thresholdId = pathParameters?.thresholdId;
      if (!thresholdId || !body || !thresholdManager) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Threshold ID, request body, and threshold manager required' }),
        };
      }

      const updates = JSON.parse(body);
      await thresholdManager.updateThreshold(thresholdId, updates);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Threshold updated successfully' }),
      };
    }

    if (path.startsWith('/cost/thresholds/') && httpMethod === 'DELETE') {
      const thresholdId = pathParameters?.thresholdId;
      if (!thresholdId || !thresholdManager) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Threshold ID and threshold manager required' }),
        };
      }

      await thresholdManager.deleteThreshold(thresholdId);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Threshold deleted successfully' }),
      };
    }

    if (path === '/cost/alerts' && httpMethod === 'GET') {
      if (!thresholdManager) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Threshold manager not initialized' }),
        };
      }

      const scope = queryStringParameters?.scope;
      const limit = parseInt(queryStringParameters?.limit || '50');
      const alerts = await thresholdManager.getRecentAlerts(scope, limit);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ alerts }),
      };
    }

    if (path.startsWith('/cost/alerts/') && httpMethod === 'POST') {
      const alertId = pathParameters?.alertId;
      if (!alertId || !thresholdManager) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Alert ID and threshold manager required' }),
        };
      }

      const { action } = JSON.parse(body || '{}');
      
      if (action === 'acknowledge') {
        await thresholdManager.acknowledgeAlert(alertId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, message: 'Alert acknowledged' }),
        };
      }

      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }

    if (path === '/cost/check-thresholds' && httpMethod === 'POST') {
      if (!thresholdManager) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Threshold manager not initialized' }),
        };
      }

      const alerts = await thresholdManager.checkThresholds();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          alertsGenerated: alerts.length,
          alerts: alerts.map(a => ({ id: a.id, severity: a.severity, title: a.title }))
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('API request error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent | ScheduledEvent | any,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  console.log('AI Cost Optimizer invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle different event types
    if ('source' in event && event.source === 'aws.events') {
      // CloudWatch Events (scheduled)
      await handleScheduledEvent(event as ScheduledEvent);
      return;
    } else if ('httpMethod' in event) {
      // API Gateway event
      return await handleAPIRequest(event as APIGatewayProxyEvent);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unsupported event type',
        }),
      };
    }

  } catch (error) {
    console.error('Handler error:', error);
    
    if ('httpMethod' in event) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }
    
    throw error;
  }
};