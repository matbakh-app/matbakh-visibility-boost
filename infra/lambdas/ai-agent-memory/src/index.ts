/**
 * AI Agent Memory Architecture - Lambda Handler
 * Main entry point for memory operations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBMemoryStorage } from './memory-storage-provider';
import { RedisMemoryCache } from './memory-cache-provider';
import { MemoryManager } from './memory-manager';
import {
  MemoryEvent,
  MemoryResponse,
  MemoryError,
  MemoryQuery,
  ContextType,
  TenantConfig
} from './types';

// Initialize providers
const storage = new DynamoDBMemoryStorage();
const cache = new RedisMemoryCache();
const memoryManager = new MemoryManager(storage, cache);

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Memory operation request:', JSON.stringify(event, null, 2));

  try {
    // Parse the request
    const memoryEvent = parseEvent(event);
    
    // Validate tenant access
    validateTenantAccess(memoryEvent);

    // Route to appropriate handler
    const response = await routeRequest(memoryEvent);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Memory operation error:', error);
    
    if (error instanceof MemoryError) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: error.message,
          code: error.code
        })
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      })
    };
  }
};

async function routeRequest(memoryEvent: MemoryEvent): Promise<MemoryResponse> {
  const startTime = Date.now();

  switch (memoryEvent.action) {
    case 'store':
      return await handleStore(memoryEvent);
    
    case 'retrieve':
      return await handleRetrieve(memoryEvent);
    
    case 'update':
      return await handleUpdate(memoryEvent);
    
    case 'delete':
      return await handleDelete(memoryEvent);
    
    case 'cleanup':
      return await handleCleanup(memoryEvent);
    
    case 'optimize':
      return await handleOptimize(memoryEvent);
    
    default:
      throw new MemoryError(`Unknown action: ${memoryEvent.action}`, 'INVALID_ACTION', 400);
  }
}

async function handleStore(event: MemoryEvent): Promise<MemoryResponse> {
  if (!event.context || !event.userId || !event.sessionId || !event.agentId) {
    throw new MemoryError('Missing required fields for store operation', 'INVALID_REQUEST', 400);
  }

  const context = await memoryManager.storeContext(
    event.tenantId,
    event.userId,
    event.sessionId,
    event.agentId,
    event.context.contextType || 'conversation',
    event.context.content || {},
    event.context.metadata
  );

  return {
    success: true,
    data: context,
    metadata: {
      processingTime: Date.now() - Date.now()
    }
  };
}

async function handleRetrieve(event: MemoryEvent): Promise<MemoryResponse> {
  if (!event.query) {
    throw new MemoryError('Query required for retrieve operation', 'INVALID_REQUEST', 400);
  }

  const contexts = await memoryManager.retrieveContexts(event.query);
  
  if (!contexts) {
    throw new MemoryError('Failed to retrieve contexts', 'RETRIEVAL_ERROR', 500);
  }
  
  return {
    success: true,
    data: contexts,
    metadata: {
      totalCount: contexts.length,
      relevanceScores: contexts.map(c => c.relevanceScore),
      processingTime: Date.now() - Date.now()
    }
  };
}

async function handleUpdate(event: MemoryEvent): Promise<MemoryResponse> {
  if (!event.context?.id) {
    throw new MemoryError('Context ID required for update operation', 'INVALID_REQUEST', 400);
  }

  await memoryManager.updateContext(
    event.context.id,
    event.tenantId,
    event.context
  );

  return {
    success: true,
    metadata: {
      processingTime: Date.now() - Date.now()
    }
  };
}

async function handleDelete(event: MemoryEvent): Promise<MemoryResponse> {
  if (!event.context?.id) {
    throw new MemoryError('Context ID required for delete operation', 'INVALID_REQUEST', 400);
  }

  await memoryManager.deleteContext(event.context.id, event.tenantId);

  return {
    success: true,
    metadata: {
      processingTime: Date.now() - Date.now()
    }
  };
}

async function handleCleanup(event: MemoryEvent): Promise<MemoryResponse> {
  const result = await memoryManager.optimizeMemory(event.tenantId, event.config);

  return {
    success: true,
    data: result,
    metadata: {
      processingTime: Date.now() - Date.now()
    }
  };
}

async function handleOptimize(event: MemoryEvent): Promise<MemoryResponse> {
  const stats = await memoryManager.getMemoryStats(event.tenantId);

  return {
    success: true,
    data: stats,
    metadata: {
      processingTime: Date.now() - Date.now()
    }
  };
}

function parseEvent(event: APIGatewayProxyEvent): MemoryEvent {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const pathParams = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    // Extract action from path or body
    const action = pathParams.action || body.action || queryParams.action;
    if (!action) {
      throw new MemoryError('Action required', 'MISSING_ACTION', 400);
    }

    // Extract tenant ID from headers or body
    const tenantId = event.headers['x-tenant-id'] || body.tenantId || queryParams.tenantId;
    if (!tenantId) {
      throw new MemoryError('Tenant ID required', 'MISSING_TENANT_ID', 400);
    }

    return {
      action: action as any,
      tenantId,
      userId: body.userId || queryParams.userId,
      sessionId: body.sessionId || queryParams.sessionId,
      agentId: body.agentId || queryParams.agentId,
      context: body.context,
      query: body.query,
      config: body.config
    };
  } catch (error) {
    if (error instanceof MemoryError) {
      throw error; // Re-throw MemoryError as-is to preserve original error codes
    }
    throw new MemoryError(`Failed to parse request: ${error}`, 'PARSE_ERROR', 400);
  }
}

function validateTenantAccess(event: MemoryEvent): void {
  // TODO: Implement proper tenant access validation
  // This should check JWT tokens, API keys, or other authentication mechanisms
  
  if (!event.tenantId || event.tenantId.length < 3) {
    throw new MemoryError('Invalid tenant ID', 'INVALID_TENANT', 403);
  }
}

// Health check endpoint
export const healthCheck = async (): Promise<APIGatewayProxyResult> => {
  try {
    // Test memory manager connection
    const testStats = await memoryManager.getMemoryStats('health-check');
    
    // Test cache connection
    const cacheStats = await cache.getCacheStats();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        storage: 'connected',
        cache: 'connected',
        cacheStats
      })
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Conversation management endpoints
export const addConversation = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { contextId, tenantId, entry } = body;

    if (!contextId || !tenantId || !entry) {
      throw new MemoryError('Missing required fields', 'INVALID_REQUEST', 400);
    }

    await memoryManager.addConversationEntry(contextId, tenantId, entry);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Conversation entry added successfully'
      })
    };
  } catch (error) {
    console.error('Add conversation error:', error);
    
    const statusCode = error instanceof MemoryError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: message
      })
    };
  }
};

// Task management endpoints
export const addTask = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { contextId, tenantId, task } = body;

    if (!contextId || !tenantId || !task) {
      throw new MemoryError('Missing required fields', 'INVALID_REQUEST', 400);
    }

    await memoryManager.addTaskEntry(contextId, tenantId, task);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Task entry added successfully'
      })
    };
  } catch (error) {
    console.error('Add task error:', error);
    
    const statusCode = error instanceof MemoryError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: message
      })
    };
  }
};

// Insight management endpoints
export const addInsight = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { contextId, tenantId, insight } = body;

    if (!contextId || !tenantId || !insight) {
      throw new MemoryError('Missing required fields', 'INVALID_REQUEST', 400);
    }

    await memoryManager.addInsightEntry(contextId, tenantId, insight);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Insight entry added successfully'
      })
    };
  } catch (error) {
    console.error('Add insight error:', error);
    
    const statusCode = error instanceof MemoryError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: message
      })
    };
  }
};