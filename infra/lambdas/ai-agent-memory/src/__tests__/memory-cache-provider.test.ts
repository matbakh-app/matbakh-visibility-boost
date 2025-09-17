/**
 * Tests for Redis Memory Cache Provider
 */

// Mock Redis before any imports
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    mGet: jest.fn(),
    info: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };

  return {
    createClient: jest.fn(() => mockClient),
  };
});

import { RedisMemoryCache } from '../memory-cache-provider';
import { createClient } from 'redis';

// Register global mock helper
function createMockMemoryContext(overrides: Partial<any> = {}) {
  const now = new Date();
  return {
    id: 'test-context-id',
    tenantId: 'test-tenant',
    userId: 'test-user',
    contextType: 'conversation',
    content: {
      conversationHistory: [],
      taskHistory: [],
      insights: [],
      userPreferences: {},
      businessContext: {},
      customData: {}
    },
    metadata: {
      accessCount: 0,
      lastAccessed: now,
      tags: [],
      priority: 'medium'
    },
    relevanceScore: 0.5,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

(global as any).createMockMemoryContext = createMockMemoryContext;

describe('RedisMemoryCache', () => {
  let cache: RedisMemoryCache;
  let mockClient: any;

  beforeEach(() => {
    // Get the mocked client from createClient
    const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
    mockClient = mockedCreateClient();

    // Reset all mocks and set default return values
    jest.clearAllMocks();
    
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.get.mockResolvedValue(null);
    mockClient.setEx.mockResolvedValue('OK');
    mockClient.del.mockResolvedValue(1);
    mockClient.keys.mockResolvedValue([]);
    mockClient.mGet.mockResolvedValue([]);
    mockClient.info.mockResolvedValue('used_memory_human:1M\r\n');
    mockClient.quit.mockResolvedValue('OK');
    mockClient.exists.mockResolvedValue(0);

    cache = new RedisMemoryCache();
  });

  // Test that mocking works correctly
  it('should mock redis client correctly', () => {
    expect(jest.isMockFunction(createClient)).toBe(true);
    expect(mockClient).toBeDefined();
  });

  describe('get', () => {
    it('should retrieve cached memory context', async () => {
      const context = global.createMockMemoryContext();
      const serializedContext = JSON.stringify(context);
      
      mockClient.get.mockResolvedValueOnce(serializedContext);

      const result = await cache.get('test-key');

      expect(result).toBeDefined();
      expect(result?.id).toBe(context.id);
      expect(result?.metadata.accessCount).toBe(1); // Should increment access count
      expect(mockClient.get).toHaveBeenCalledWith('ai-memory:test-key');
    });

    it('should return null for non-existent key', async () => {
      mockClient.get.mockResolvedValueOnce(null);

      const result = await cache.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should handle connection errors gracefully', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = await cache.get('test-key');
      
      expect(result).toBe(null);
    });

    it('should convert date strings back to Date objects', async () => {
      const context = global.createMockMemoryContext();
      const serializedContext = JSON.stringify(context);
      
      mockClient.get.mockResolvedValueOnce(serializedContext);

      const result = await cache.get('test-key');

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('set', () => {
    it('should cache memory context with TTL', async () => {
      const context = global.createMockMemoryContext();
      const ttl = 3600;

      mockClient.setEx.mockResolvedValueOnce('OK');

      await cache.set('test-key', context, ttl);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        'ai-memory:test-key',
        ttl,
        JSON.stringify(context)
      );
    });

    it('should use default TTL when not specified', async () => {
      const context = global.createMockMemoryContext();

      mockClient.setEx.mockResolvedValueOnce('OK');

      await cache.set('test-key', context);

      expect(mockClient.setEx).toHaveBeenCalledWith(
        'ai-memory:test-key',
        3600, // Default TTL
        JSON.stringify(context)
      );
    });

    it('should handle cache errors gracefully', async () => {
      const context = (global as any).createMockMemoryContext();
      
      mockClient.setEx.mockRejectedValueOnce(new Error('Cache error'));

      // Should not throw
      await expect(cache.set('test-key', context)).resolves.toBeUndefined();
    });

    it('should set reverse lookup keys', async () => {
      const context = global.createMockMemoryContext();

      mockClient.setEx.mockResolvedValue('OK');

      await cache.set('test-key', context, 3600);

      // Should call setEx multiple times for reverse lookups
      expect(mockClient.setEx).toHaveBeenCalledTimes(5); // Main key + 4 reverse lookups
    });
  });

  describe('delete', () => {
    it('should delete cached context', async () => {
      mockClient.del.mockResolvedValueOnce(1);

      await cache.delete('test-key');

      expect(mockClient.del).toHaveBeenCalledWith('ai-memory:test-key');
    });

    it('should handle delete errors gracefully', async () => {
      mockClient.del.mockRejectedValueOnce(new Error('Delete error'));

      // Should not throw
      await expect(cache.delete('test-key')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear contexts matching pattern', async () => {
      const keys = ['ai-memory:tenant:test:ctx1', 'ai-memory:tenant:test:ctx2'];
      
      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.del.mockResolvedValueOnce(2);

      const deletedCount = await cache.clear('tenant:test:*');

      expect(deletedCount).toBe(2);
      expect(mockClient.keys).toHaveBeenCalledWith('ai-memory:tenant:test:*');
      expect(mockClient.del).toHaveBeenCalledWith(keys);
    });

    it('should handle empty pattern results', async () => {
      mockClient.keys.mockResolvedValueOnce([]);

      const deletedCount = await cache.clear('nonexistent:*');

      expect(deletedCount).toBe(0);
      expect(mockClient.del).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockClient.exists.mockResolvedValueOnce(1);

      const exists = await cache.exists('test-key');

      expect(exists).toBe(true);
      expect(mockClient.exists).toHaveBeenCalledWith('ai-memory:test-key');
    });

    it('should return false for non-existent key', async () => {
      mockClient.exists.mockResolvedValueOnce(0);

      const exists = await cache.exists('nonexistent-key');

      expect(exists).toBe(false);
    });
  });

  describe('getByTenant', () => {
    it('should retrieve contexts by tenant', async () => {
      const contexts = [
        global.createMockMemoryContext({ id: 'ctx1' }),
        global.createMockMemoryContext({ id: 'ctx2' })
      ];
      
      const keys = ['ai-memory:tenant:test:ctx1', 'ai-memory:tenant:test:ctx2'];
      const values = contexts.map(ctx => JSON.stringify(ctx));

      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.mGet.mockResolvedValueOnce(values);

      const results = await cache.getByTenant('test-tenant', 10);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('ctx1');
      expect(results[1].id).toBe('ctx2');
    });

    it('should sort results by relevance and creation date', async () => {
      const contexts = [
        global.createMockMemoryContext({ 
          id: 'ctx1', 
          relevanceScore: 0.5,
          createdAt: new Date('2024-01-01')
        }),
        global.createMockMemoryContext({ 
          id: 'ctx2', 
          relevanceScore: 0.9,
          createdAt: new Date('2024-01-02')
        })
      ];
      
      const keys = ['ai-memory:tenant:test:ctx1', 'ai-memory:tenant:test:ctx2'];
      const values = contexts.map(ctx => JSON.stringify(ctx));

      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.mGet.mockResolvedValueOnce(values);

      const results = await cache.getByTenant('test-tenant', 10);

      expect(results[0].id).toBe('ctx2'); // Higher relevance score should come first
      expect(results[1].id).toBe('ctx1');
    });

    it('should handle parsing errors gracefully', async () => {
      const keys = ['ai-memory:tenant:test:ctx1'];
      const values = ['invalid-json'];

      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.mGet.mockResolvedValueOnce(values);

      const results = await cache.getByTenant('test-tenant', 10);

      expect(results).toHaveLength(0); // Should skip invalid entries
    });
  });

  describe('getByUser', () => {
    it('should retrieve contexts by user', async () => {
      const contexts = [
        global.createMockMemoryContext({ 
          id: 'ctx1',
          createdAt: new Date('2024-01-02')
        }),
        global.createMockMemoryContext({ 
          id: 'ctx2',
          createdAt: new Date('2024-01-01')
        })
      ];
      
      const keys = ['ai-memory:tenant:test:user:user1:ctx1', 'ai-memory:tenant:test:user:user1:ctx2'];
      const values = contexts.map(ctx => JSON.stringify(ctx));

      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.mGet.mockResolvedValueOnce(values);

      const results = await cache.getByUser('test-tenant', 'user1', 10);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('ctx1'); // More recent should come first
      expect(results[1].id).toBe('ctx2');
    });
  });

  describe('updateRelevanceScore', () => {
    it('should update relevance score of cached context', async () => {
      const context = global.createMockMemoryContext({ relevanceScore: 0.5 });
      const serializedContext = JSON.stringify(context);
      
      mockClient.get.mockResolvedValueOnce(serializedContext);
      mockClient.setEx.mockResolvedValueOnce('OK');

      await cache.updateRelevanceScore('test-key', 0.9);

      expect(mockClient.get).toHaveBeenCalledWith('ai-memory:test-key');
      expect(mockClient.setEx).toHaveBeenCalledWith(
        'ai-memory:test-key',
        3600,
        expect.stringContaining('"relevanceScore":0.9')
      );
    });

    it('should handle non-existent context gracefully', async () => {
      mockClient.get.mockResolvedValueOnce(null);

      // Should not throw
      await expect(cache.updateRelevanceScore('nonexistent-key', 0.9)).resolves.toBeUndefined();
      expect(mockClient.setEx).not.toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const memoryInfo = 'used_memory_human:10.5M\r\n';
      const keyspaceInfo = 'db0:keys=100,expires=50\r\n';
      const keys = ['ai-memory:key1', 'ai-memory:key2'];

      mockClient.info.mockImplementation((section) => {
        if (section === 'memory') return Promise.resolve(memoryInfo);
        if (section === 'keyspace') return Promise.resolve(keyspaceInfo);
        return Promise.resolve('');
      });
      mockClient.keys.mockResolvedValueOnce(keys);

      const stats = await cache.getCacheStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.memoryUsage).toBe('10.5M');
    });

    it('should handle stats errors gracefully', async () => {
      mockClient.info.mockRejectedValueOnce(new Error('Stats error'));
      mockClient.keys.mockRejectedValueOnce(new Error('Keys error'));

      const stats = await cache.getCacheStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.memoryUsage).toBe('unknown');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis gracefully', async () => {
      // First ensure the cache is connected
      await cache.get('test-key'); // This will trigger connection
      
      mockClient.quit.mockResolvedValueOnce('OK');

      await cache.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockClient.quit.mockRejectedValueOnce(new Error('Disconnect error'));

      // Should not throw
      await expect(cache.disconnect()).resolves.toBeUndefined();
    });
  });
});