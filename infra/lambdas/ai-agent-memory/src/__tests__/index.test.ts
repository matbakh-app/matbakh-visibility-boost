/**
 * Tests for Lambda Handler
 */

// 🔧 1. Mock UUID FIRST - VOR allen Imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

// 🔧 2. Mock ALL modules BEFORE imports - Korrekte Factory-Funktionen
jest.mock('../memory-storage-provider', () => ({
  DynamoDBMemoryStorage: jest.fn().mockImplementation(() => ({
    store: jest.fn().mockResolvedValue(undefined),
    retrieve: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue({ deletedContexts: 5, compressedContexts: 0, memoryFreed: 0.5 }),
    getStats: jest.fn().mockResolvedValue({
      totalMemoryUsed: 75.5,
      memoryByType: {},
      memoryByUser: {},
      averageRelevanceScore: 0.8,
      oldestEntry: new Date(),
      newestEntry: new Date()
    })
  }))
}));

jest.mock('../memory-cache-provider', () => ({
  RedisMemoryCache: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(false),
    getByTenant: jest.fn().mockResolvedValue([]),
    getCacheStats: jest.fn().mockResolvedValue({ totalKeys: 0, memoryUsage: 'unknown' }),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }))
}));

// 🔧 3. Create mock memory manager with ALL required methods
const mockMemoryManager = {
  storeContext: jest.fn(),
  retrieveContexts: jest.fn(),
  updateContext: jest.fn().mockResolvedValue(undefined),
  deleteContext: jest.fn().mockResolvedValue(undefined),
  optimizeMemory: jest.fn(),
  getMemoryStats: jest.fn(),
  addConversationEntry: jest.fn().mockResolvedValue(undefined),
  addTaskEntry: jest.fn().mockResolvedValue(undefined),
  addInsightEntry: jest.fn().mockResolvedValue(undefined),
  setTenantConfig: jest.fn().mockResolvedValue(undefined),
  getTenantConfig: jest.fn().mockResolvedValue({})
};

jest.mock('../memory-manager', () => ({
  MemoryManager: jest.fn().mockImplementation(() => mockMemoryManager)
}));

// 🔧 4. NOW import the modules - NACH den Mocks
import { handler, healthCheck, addConversation, addTask, addInsight } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

describe('Lambda Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockLambdaContext: Context;

  beforeEach(() => {
    // 🔧 5. Reset all mocks before each test
    jest.clearAllMocks();
    
    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/memory',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    mockLambdaContext = {} as Context;

    // 🔧 6. Setup mock data with correct structure
    const mockMemoryContext = global.createMockMemoryContext();
    const mockContexts = [mockMemoryContext];
    const mockCleanupResult = { 
      deletedContexts: 5, 
      compressedContexts: 0, 
      memoryFreed: 0.5 
    };
    const mockStats = {
      totalMemoryUsed: 75.5,
      memoryByType: {},
      memoryByUser: {},
      averageRelevanceScore: 0.8,
      oldestEntry: new Date(),
      newestEntry: new Date()
    };

    // 🔧 7. Configure mock returns with EXACT method signatures
    mockMemoryManager.storeContext.mockResolvedValue(mockMemoryContext);
    mockMemoryManager.retrieveContexts.mockResolvedValue(mockContexts);
    mockMemoryManager.optimizeMemory.mockResolvedValue(mockCleanupResult);
    mockMemoryManager.getMemoryStats.mockResolvedValue(mockStats);
  });

  describe('handler', () => {
    it('should handle store action successfully', async () => {
      const mockMemoryContext = global.createMockMemoryContext();
      mockMemoryManager.storeContext.mockResolvedValueOnce(mockMemoryContext);

      mockEvent.body = JSON.stringify({
        action: 'store',
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        agentId: 'test-agent',
        context: {
          contextType: 'conversation',
          content: {
            conversationHistory: []
          }
        }
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true,
        data: expect.any(Object),
        metadata: expect.objectContaining({
          processingTime: expect.any(Number)
        })
      }));
    });

    it('should handle retrieve action successfully', async () => {
      const mockContexts = [global.createMockMemoryContext()];
      mockMemoryManager.retrieveContexts.mockResolvedValueOnce(mockContexts);

      mockEvent.body = JSON.stringify({
        action: 'retrieve',
        tenantId: 'test-tenant',
        query: {
          tenantId: 'test-tenant',
          userId: 'test-user',
          limit: 10
        }
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        metadata: expect.objectContaining({
          processingTime: expect.any(Number)
        })
      }));
    });

    it('should handle cleanup action successfully', async () => {
      const mockResult = { 
        deletedContexts: 5, 
        compressedContexts: 0, 
        memoryFreed: 0.5 
      };
      mockMemoryManager.optimizeMemory.mockResolvedValueOnce(mockResult);

      mockEvent.body = JSON.stringify({
        action: 'cleanup',
        tenantId: 'test-tenant',
        config: {
          maxMemorySize: 100,
          relevanceThreshold: 0.5,
          retentionPeriod: 30,
          compressionEnabled: false,
          cleanupInterval: 24
        }
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          deletedContexts: 5,
          compressedContexts: 0,
          memoryFreed: 0.5
        }),
        metadata: expect.objectContaining({
          processingTime: expect.any(Number)
        })
      }));
    });

    it('should handle optimize action successfully', async () => {
      const mockStats = {
        totalMemoryUsed: 75.5,
        memoryByType: {},
        memoryByUser: {},
        averageRelevanceScore: 0.8,
        oldestEntry: new Date(),
        newestEntry: new Date()
      };
      mockMemoryManager.getMemoryStats.mockResolvedValueOnce(mockStats);

      mockEvent.body = JSON.stringify({
        action: 'optimize',
        tenantId: 'test-tenant'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalMemoryUsed: 75.5,
          averageRelevanceScore: 0.8
        }),
        metadata: expect.objectContaining({
          processingTime: expect.any(Number)
        })
      }));
    });

    it('should extract tenant ID from headers', async () => {
      const mockStats = {
        totalMemoryUsed: 75.5,
        memoryByType: {},
        memoryByUser: {},
        averageRelevanceScore: 0.8,
        oldestEntry: new Date(),
        newestEntry: new Date()
      };
      mockMemoryManager.getMemoryStats.mockResolvedValueOnce(mockStats);

      mockEvent.body = JSON.stringify({
        action: 'optimize'
      });
      mockEvent.headers = {
        'x-tenant-id': 'header-tenant'
      };

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(mockMemoryManager.getMemoryStats).toHaveBeenCalledWith('header-tenant');
    });

    it('should extract parameters from query string', async () => {
      const mockStats = {
        totalMemoryUsed: 75.5,
        memoryByType: {},
        memoryByUser: {},
        averageRelevanceScore: 0.8,
        oldestEntry: new Date(),
        newestEntry: new Date()
      };
      mockMemoryManager.getMemoryStats.mockResolvedValueOnce(mockStats);

      mockEvent.body = null;
      mockEvent.queryStringParameters = {
        action: 'optimize',
        tenantId: 'query-tenant'
      };

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(200);
      expect(mockMemoryManager.getMemoryStats).toHaveBeenCalledWith('query-tenant');
    });

    it('should return 400 for missing action', async () => {
      mockEvent.body = JSON.stringify({
        tenantId: 'test-tenant'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        code: 'MISSING_ACTION',
        error: 'Action required'
      }));
    });

    it('should return 400 for missing tenant ID', async () => {
      mockEvent.body = JSON.stringify({
        action: 'optimize'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        code: 'MISSING_TENANT_ID',
        error: 'Tenant ID required'
      }));
    });

    it('should return 400 for invalid action', async () => {
      mockEvent.body = JSON.stringify({
        action: 'invalid-action',
        tenantId: 'test-tenant'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        error: 'Unknown action: invalid-action'
      }));
    });

    it('should return 400 for missing required fields in store', async () => {
      mockEvent.body = JSON.stringify({
        action: 'store',
        tenantId: 'test-tenant'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        error: 'Missing required fields for store operation'
      }));
    });

    it('should return 400 for missing query in retrieve', async () => {
      mockEvent.body = JSON.stringify({
        action: 'retrieve',
        tenantId: 'test-tenant'
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        error: 'Query required for retrieve operation'
      }));
    });

    it('should return 500 for internal errors', async () => {
      // 🔧 8. Mock to throw error for internal error test
      mockMemoryManager.storeContext.mockRejectedValueOnce(new Error('Database error'));

      mockEvent.body = JSON.stringify({
        action: 'store',
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        agentId: 'test-agent',
        context: {
          contextType: 'conversation',
          content: {
            conversationHistory: []
          }
        }
      });

      const result = await handler(mockEvent, mockLambdaContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        error: 'Internal server error'
      }));
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when services are available', async () => {
      const result = await healthCheck();

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
    });

    it('should return unhealthy status when services are unavailable', async () => {
      // 🔧 9. Mock getMemoryStats to throw error for health check test
      mockMemoryManager.getMemoryStats.mockRejectedValueOnce(new Error('Storage error'));
      
      const result = await healthCheck();

      expect(result.statusCode).toBe(503);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('unhealthy');
      expect(body.error).toBe('Storage error');
    });
  });

  describe('addConversation', () => {
    it('should add conversation entry successfully', async () => {
      const testEvent: APIGatewayProxyEvent = {
        body: JSON.stringify({
          tenantId: 'test-tenant',
          contextId: 'test-context',
          entry: {
            timestamp: new Date().toISOString(),
            role: 'user',
            content: 'Test message'
          }
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/memory/conversation',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await addConversation(testEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true
      }));
    });

    it('should return 400 for missing required fields', async () => {
      const testEvent: APIGatewayProxyEvent = {
        body: JSON.stringify({
          tenantId: 'test-tenant'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/memory/conversation',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await addConversation(testEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: false,
        error: 'Missing required fields'
      }));
    });
  });

  describe('addTask', () => {
    it('should add task entry successfully', async () => {
      const testEvent: APIGatewayProxyEvent = {
        body: JSON.stringify({
          tenantId: 'test-tenant',
          contextId: 'test-context',
          task: {
            taskType: 'analysis',
            status: 'completed',
            description: 'Test task',
            timestamp: new Date().toISOString()
          }
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/memory/task',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await addTask(testEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('addInsight', () => {
    it('should add insight entry successfully', async () => {
      const testEvent: APIGatewayProxyEvent = {
        body: JSON.stringify({
          tenantId: 'test-tenant',
          contextId: 'test-context',
          insight: {
            type: 'recommendation',
            content: 'Test insight',
            confidence: 0.9,
            source: 'test-agent',
            timestamp: new Date().toISOString()
          }
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/memory/insight',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await addInsight(testEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(expect.objectContaining({
        success: true
      }));
    });
  });
});