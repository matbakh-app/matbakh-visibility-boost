/**
 * Dashboard & Visualization System Lambda Handler
 * Main entry point for dashboard management and visualization rendering
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DashboardManager } from './dashboard-manager';
import { VisualizationEngine } from './visualization-engine';
import { DataConnector } from './data-connector';
import { 
  Dashboard, 
  DashboardWidget, 
  VisualizationRequest,
  ExportFormat 
} from './types';

// Initialize services
const dashboardManager = new DashboardManager('eu-central-1');
const visualizationEngine = new VisualizationEngine();
const dataConnector = new DataConnector('eu-central-1');

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
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

    // Extract user context
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization required' }),
      };
    }

    // Extract user ID from token (simplified)
    const userId = extractUserIdFromToken(authHeader);

    // Route requests
    if (path.startsWith('/dashboards')) {
      return await handleDashboardRequests(httpMethod, path, pathParameters, queryStringParameters, body, userId, corsHeaders);
    }

    if (path.startsWith('/visualizations')) {
      return await handleVisualizationRequests(httpMethod, path, pathParameters, queryStringParameters, body, userId, corsHeaders);
    }

    if (path.startsWith('/data')) {
      return await handleDataRequests(httpMethod, path, pathParameters, queryStringParameters, body, userId, corsHeaders);
    }

    if (path === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            dashboardManager: 'healthy',
            visualizationEngine: 'healthy',
            dataConnector: 'healthy',
          },
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
    console.error('Request error:', error);
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
  } finally {
    // Cleanup resources
    await dataConnector.cleanup();
  }
};

/**
 * Handle dashboard-related requests
 */
async function handleDashboardRequests(
  method: string,
  path: string,
  pathParams: any,
  queryParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {
  
  // GET /dashboards - List dashboards
  if (path === '/dashboards' && method === 'GET') {
    const type = queryParams?.type;
    const limit = parseInt(queryParams?.limit || '50');
    const lastKey = queryParams?.lastKey;

    const result = await dashboardManager.listDashboards(userId, type, limit, lastKey);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  }

  // POST /dashboards - Create dashboard
  if (path === '/dashboards' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const dashboardData = JSON.parse(body);
    dashboardData.createdBy = userId;

    const dashboard = await dashboardManager.createDashboard(dashboardData);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(dashboard),
    };
  }

  // GET /dashboards/{id} - Get dashboard
  if (path.match(/^\/dashboards\/[^\/]+$/) && method === 'GET') {
    const dashboardId = pathParams?.id;
    if (!dashboardId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID is required' }),
      };
    }

    const dashboard = await dashboardManager.getDashboard(dashboardId, userId);
    if (!dashboard) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(dashboard),
    };
  }

  // PUT /dashboards/{id} - Update dashboard
  if (path.match(/^\/dashboards\/[^\/]+$/) && method === 'PUT') {
    const dashboardId = pathParams?.id;
    if (!dashboardId || !body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID and request body are required' }),
      };
    }

    const updates = JSON.parse(body);
    const dashboard = await dashboardManager.updateDashboard(dashboardId, updates, userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(dashboard),
    };
  }

  // DELETE /dashboards/{id} - Delete dashboard
  if (path.match(/^\/dashboards\/[^\/]+$/) && method === 'DELETE') {
    const dashboardId = pathParams?.id;
    if (!dashboardId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID is required' }),
      };
    }

    await dashboardManager.deleteDashboard(dashboardId, userId);
    
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // POST /dashboards/{id}/clone - Clone dashboard
  if (path.match(/^\/dashboards\/[^\/]+\/clone$/) && method === 'POST') {
    const dashboardId = pathParams?.id;
    if (!dashboardId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID is required' }),
      };
    }

    const { name } = body ? JSON.parse(body) : {};
    const clonedDashboard = await dashboardManager.cloneDashboard(dashboardId, userId, name);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(clonedDashboard),
    };
  }

  // POST /dashboards/{id}/share - Share dashboard
  if (path.match(/^\/dashboards\/[^\/]+\/share$/) && method === 'POST') {
    const dashboardId = pathParams?.id;
    if (!dashboardId || !body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID and share config are required' }),
      };
    }

    const shareConfig = JSON.parse(body);
    const share = await dashboardManager.shareDashboard(dashboardId, userId, shareConfig);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(share),
    };
  }

  // GET /dashboards/{id}/analytics - Get dashboard analytics
  if (path.match(/^\/dashboards\/[^\/]+\/analytics$/) && method === 'GET') {
    const dashboardId = pathParams?.id;
    if (!dashboardId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Dashboard ID is required' }),
      };
    }

    const timeRange = queryParams?.start && queryParams?.end ? {
      start: queryParams.start,
      end: queryParams.end,
    } : undefined;

    const analytics = await dashboardManager.getDashboardAnalytics(dashboardId, userId, timeRange);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(analytics),
    };
  }

  // GET /dashboards/templates - List dashboard templates
  if (path === '/dashboards/templates' && method === 'GET') {
    const category = queryParams?.category;
    const limit = parseInt(queryParams?.limit || '50');

    const templates = await dashboardManager.listDashboardTemplates(category, limit);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ templates }),
    };
  }

  // POST /dashboards/templates/{id}/create - Create dashboard from template
  if (path.match(/^\/dashboards\/templates\/[^\/]+\/create$/) && method === 'POST') {
    const templateId = pathParams?.id;
    if (!templateId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Template ID is required' }),
      };
    }

    const customizations = body ? JSON.parse(body) : {};
    const dashboard = await dashboardManager.createFromTemplate(templateId, userId, customizations);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(dashboard),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Dashboard route not found' }),
  };
}

/**
 * Handle visualization-related requests
 */
async function handleVisualizationRequests(
  method: string,
  path: string,
  pathParams: any,
  queryParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /visualizations/render - Render visualization
  if (path === '/visualizations/render' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { widget, data, options } = JSON.parse(body);
    
    if (!widget || !data) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Widget and data are required' }),
      };
    }

    const result = await visualizationEngine.renderVisualization(widget, data, options);
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': result.contentType || 'application/json',
      },
      body: JSON.stringify(result),
    };
  }

  // POST /visualizations/export - Export visualization
  if (path === '/visualizations/export' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { widget, data, format, options } = JSON.parse(body);
    
    if (!widget || !data || !format) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Widget, data, and format are required' }),
      };
    }

    const result = await visualizationEngine.exportVisualization(widget, data, format as ExportFormat, options);
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': result.contentType || 'application/json',
        'Content-Disposition': `attachment; filename="visualization.${format}"`,
      },
      body: JSON.stringify(result),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Visualization route not found' }),
  };
}

/**
 * Handle data-related requests
 */
async function handleDataRequests(
  method: string,
  path: string,
  pathParams: any,
  queryParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /data/query - Execute data query
  if (path === '/data/query' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const dataSource = JSON.parse(body);
    
    if (!dataSource.type || !dataSource.query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Data source type and query are required' }),
      };
    }

    const data = await dataConnector.executeQuery(dataSource);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data }),
    };
  }

  // GET /data/sources - List available data sources
  if (path === '/data/sources' && method === 'GET') {
    const sources = [
      { type: 'analytics_api', name: 'Analytics API', description: 'Real-time analytics data' },
      { type: 'timestream', name: 'TimeStream', description: 'Time-series data' },
      { type: 'dynamodb', name: 'DynamoDB', description: 'NoSQL database' },
      { type: 'postgresql', name: 'PostgreSQL', description: 'Relational database' },
      { type: 'redis', name: 'Redis', description: 'In-memory cache' },
      { type: 's3', name: 'S3', description: 'Object storage' },
      { type: 'external_api', name: 'External API', description: 'Third-party APIs' },
      { type: 'static', name: 'Static Data', description: 'Static datasets' },
    ];
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sources }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Data route not found' }),
  };
}

/**
 * Extract user ID from authorization token
 */
function extractUserIdFromToken(authHeader: string): string {
  // This is a simplified implementation
  // In production, you would validate the JWT token and extract the user ID
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Decode JWT payload (without verification for this example)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || payload.user_id || 'anonymous';
  } catch (error) {
    return 'anonymous';
  }
}