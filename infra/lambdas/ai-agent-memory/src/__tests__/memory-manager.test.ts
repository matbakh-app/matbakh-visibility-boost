/**
 * Tests for Memory Manager
 * 
 * This test suite validates the MemoryManager's ability to handle memory contexts,
 * coordinate between cache and storage, and maintain data consistency.
 */

import { MemoryManager } from '../memory-manager';
import { DynamoDBMemoryStorage } from '../memory-storage-provider';
import { RedisMemoryCache } from '../memory-cache-provider';
import {
  MemoryContext,
  MemoryQuery,
  ContextType,
  ConversationEntry,
  TaskEntry,
  InsightEntry
} from '../types';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  let mockStorage: any;
  let mockCache: any;

  beforeEach(() => {
    // Use centralized mock context factory
    const mockContext = createMockMemoryContext();

    mockStorage = {
      store: jest.fn().mockResolvedValue(undefined),
      retrieve: jest.fn().mockResolvedValue([mockContext]),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue({ deletedContexts: 5, compressedContexts: 0, memoryFreed: 0.5 }),
      getStats: jest.fn().mockResolvedValue({
        totalMemoryUsed: 75.5,
        memoryByType: { conversation: 50, user_profile: 25.5 },
        memoryByUser: { 'test-user': 75.5 },
        averageRelevanceScore: 0.85,
        oldestEntry: new Date('2024-01-01'),
        newestEntry: new Date()
      })
    } as any;

    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      getByTenant: jest.fn().mockResolvedValue([mockContext]),
      getByUser: jest.fn().mockResolvedValue([mockContext]),
      updateRelevanceScore: jest.fn().mockResolvedValue(undefined),
      getCacheStats: jest.fn().mockResolvedValue({ totalKeys: 0, memoryUsage: 'unknown' }),
      disconnect: jest.fn().mockResolvedValue(undefined)
    } as any;

    memoryManager = new MemoryManager(mockStorage, mockCache);
  });

  describe('storeContext', () => {
    it('should store new memory context with calculated relevance score', async () => {
      const tenantId = 'test-tenant';
      const userId = 'test-user';
      const sessionId = 'test-session';
      const agentId = 'test-agent';
      const contextType: ContextType = 'conversation';
      const content = {
        conversationHistory: [
          createMockConversationEntry({ content: 'Hello', relevanceScore: 0.8 })
        ],
        userPreferences: createMockUserPreferences(),
        businessContext: createMockBusinessContext(),
        taskHistory: [],
        insights: [],
        customData: {}
      };

      mockStorage.store.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      const result = await memoryManager.storeContext(
        tenantId,
        userId,
        sessionId,
        agentId,
        contextType,
        content
      );

      expect(result.id).toBeValidUUID();
      expect(result.tenantId).toBe(tenantId);
      expect(result.userId).toBe(userId);
      expect(result.contextType).toBe(contextType);
      expect(result.relevanceScore).toBeValidRelevanceScore();
      expect(result.relevanceScore).toBeCloseTo(0.8, 1); // Should match conversation entry score
      expect(mockStorage.store).toHaveBeenCalledWith(result);
      expect(mockCache.set).toHaveBeenCalledWith(
        `${tenantId}:${result.id}`,
        result,
        3600 // Default TTL for conversation
      );
    });

    it('should calculate different relevance scores for different context types', async () => {
      const baseParams = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        agentId: 'test-agent'
      };

      mockStorage.store.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);

      // User profile should have high relevance
      const userProfileContext = await memoryManager.storeContext(
        baseParams.tenantId,
        baseParams.userId,
        baseParams.sessionId,
        baseParams.agentId,
        'user_profile',
        {}
      );
      expect(userProfileContext.relevanceScore).toBeCloseTo(0.9, 5);

      // Business analysis should have high relevance
      const businessContext = await memoryManager.storeContext(
        baseParams.tenantId,
        baseParams.userId,
        baseParams.sessionId,
        baseParams.agentId,
        'business_analysis',
        {}
      );
      expect(businessContext.relevanceScore).toBeCloseTo(0.8, 5);
    });

    it('should build complete content with defaults', async () => {
      mockStorage.store.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      const result = await memoryManager.storeContext(
        'test-tenant',
        'test-user',
        'test-session',
        'test-agent',
        'conversation',
        {} // Empty content
      );

      expect(result.content.conversationHistory).toEqual([]);
      expect(result.content.userPreferences).toBeDefined();
      expect(result.content.businessContext).toBeDefined();
      expect(result.content.taskHistory).toEqual([]);
      expect(result.content.insights).toEqual([]);
      expect(result.content.customData).toEqual({});
    });
  });

  describe('retrieveContexts', () => {
    it('should try cache first for single user/session queries', async () => {
      const query: MemoryQuery = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        limit: 1
      };

      const cachedContexts = [createMockMemoryContext()];
      mockCache.getByTenant.mockResolvedValueOnce(cachedContexts);

      const results = await memoryManager.retrieveContexts(query);

      expect(results).toEqual(cachedContexts);
      expect(mockCache.getByTenant).toHaveBeenCalledWith('test-tenant', 10);
      expect(mockStorage.retrieve).not.toHaveBeenCalled();
    });

    it('should fallback to storage when cache miss', async () => {
      const query: MemoryQuery = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        limit: 1
      };

      const storageContexts = [createMockMemoryContext()];

      mockCache.getByTenant.mockResolvedValueOnce([]); // Cache miss - empty array
      mockStorage.retrieve.mockResolvedValueOnce(storageContexts);
      mockCache.set.mockResolvedValueOnce(undefined);

      const results = await memoryManager.retrieveContexts(query);

      expect(results).toEqual(storageContexts);
      expect(mockStorage.retrieve).toHaveBeenCalledWith(query);
      expect(mockCache.set).toHaveBeenCalledWith(
        `${storageContexts[0].tenantId}:${storageContexts[0].id}`,
        storageContexts[0],
        3600
      );
    });

    it('should use storage directly for complex queries', async () => {
      const query: MemoryQuery = {
        tenantId: 'test-tenant',
        contextTypes: ['conversation', 'user_profile'],
        relevanceThreshold: 0.5
      };

      const storageContexts = [createMockMemoryContext()];
      mockStorage.retrieve.mockResolvedValueOnce(storageContexts);
      mockCache.set.mockResolvedValueOnce(undefined);

      const results = await memoryManager.retrieveContexts(query);

      expect(results).toEqual(storageContexts);
      expect(mockStorage.retrieve).toHaveBeenCalledWith(query);
      expect(mockCache.getByTenant).not.toHaveBeenCalled();
    });
  });

  describe('updateContext', () => {
    it('should update context in both storage and cache', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const updates = {
        content: {
          conversationHistory: [createMockConversationEntry()],
          userPreferences: createMockUserPreferences({
            communicationStyle: 'formal',
            responseLength: 'brief'
          }),
          businessContext: createMockBusinessContext(),
          taskHistory: [],
          insights: [],
          customData: {}
        }
      };

      const cachedContext = createMockMemoryContext();

      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.get.mockResolvedValueOnce(cachedContext);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.updateContext(contextId, tenantId, updates);

      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          ...updates,
          relevanceScore: expect.any(Number),
          updatedAt: expect.any(Date)
        })
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        `${tenantId}:${contextId}`,
        expect.objectContaining({
          ...cachedContext,
          ...updates
        }),
        3600
      );
    });

    it('should recalculate relevance score when content changes', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const updates = {
        contextType: 'user_profile' as ContextType,
        content: {
          conversationHistory: [],
          userPreferences: createMockUserPreferences({
            communicationStyle: 'formal',
            responseLength: 'brief'
          }),
          businessContext: createMockBusinessContext(),
          taskHistory: [],
          insights: [],
          customData: {}
        }
      };

      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.get.mockResolvedValueOnce(null); // Not in cache

      await memoryManager.updateContext(contextId, tenantId, updates);

      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          relevanceScore: 0.9 // User profile should have high relevance
        })
      );
    });
  });

  describe('deleteContext', () => {
    it('should delete from both storage and cache', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';

      mockStorage.delete.mockResolvedValueOnce(undefined);
      mockCache.delete.mockResolvedValueOnce(undefined);

      await memoryManager.deleteContext(contextId, tenantId);

      expect(mockStorage.delete).toHaveBeenCalledWith(contextId, tenantId);
      expect(mockCache.delete).toHaveBeenCalledWith(`${tenantId}:${contextId}`);
    });
  });

  describe('addConversationEntry', () => {
    it('should add conversation entry to existing context', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const entry = {
        timestamp: new Date(),
        role: 'user' as const,
        content: 'New message'
      };

      const existingContext = createMockMemoryContext({
        content: {
          conversationHistory: [],
          userPreferences: createMockUserPreferences({
            communicationStyle: 'casual',
            responseLength: 'detailed'
          }),
          businessContext: createMockBusinessContext(),
          taskHistory: [],
          insights: [],
          customData: {}
        }
      });

      mockCache.get.mockResolvedValueOnce(existingContext);
      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.addConversationEntry(contextId, tenantId, entry);

      // Validate the storage update call
      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          content: expect.objectContaining({
            conversationHistory: [
              expect.objectContaining({
                id: expect.any(String),
                content: 'New message',
                role: 'user'
              })
            ]
          }),
          relevanceScore: expect.any(Number),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should retrieve from storage if not in cache', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const entry = {
        timestamp: new Date(),
        role: 'user' as const,
        content: 'New message'
      };

      const storageContext = createMockMemoryContext({ id: contextId });

      mockCache.get.mockResolvedValueOnce(null); // Not in cache
      mockStorage.retrieve.mockResolvedValueOnce([storageContext]);
      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.addConversationEntry(contextId, tenantId, entry);

      expect(mockStorage.retrieve).toHaveBeenCalledWith({
        tenantId,
        limit: 1
      });
      expect(storageContext.content.conversationHistory).toHaveLength(1);
    });

    it('should throw error if context not found', async () => {
      const contextId = 'nonexistent-context';
      const tenantId = 'test-tenant';
      const entry = {
        timestamp: new Date(),
        role: 'user' as const,
        content: 'New message'
      };

      mockCache.get.mockResolvedValueOnce(null);
      mockStorage.retrieve.mockResolvedValueOnce([]);

      await expect(
        memoryManager.addConversationEntry(contextId, tenantId, entry)
      ).rejects.toThrow('Context not found');
    });
  });

  describe('addTaskEntry', () => {
    it('should add task entry to existing context', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const task = {
        taskType: 'analysis',
        status: 'completed' as const,
        description: 'Test task',
        timestamp: new Date()
      };

      const existingContext = createMockMemoryContext();
      mockCache.get.mockResolvedValueOnce(existingContext);
      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.addTaskEntry(contextId, tenantId, task);

      // Validate the storage update call
      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          content: expect.objectContaining({
            taskHistory: [
              expect.objectContaining({
                id: expect.any(String),
                taskType: 'analysis',
                status: 'completed',
                description: 'Test task'
              })
            ]
          }),
          relevanceScore: expect.any(Number),
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should calculate task relevance based on status and age', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const recentCompletedTask = {
        taskType: 'analysis',
        status: 'completed' as const,
        description: 'Recent completed task',
        timestamp: new Date() // Recent
      };

      const existingContext = createMockMemoryContext();
      mockCache.get.mockResolvedValueOnce(existingContext);
      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.addTaskEntry(contextId, tenantId, recentCompletedTask);

      // Validate that storage.update was called with high relevance score
      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          content: expect.objectContaining({
            taskHistory: expect.arrayContaining([
              expect.objectContaining({
                relevanceScore: expect.any(Number)
              })
            ])
          })
        })
      );
    });
  });

  describe('addInsightEntry', () => {
    it('should add insight entry to existing context', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const insight = {
        type: 'recommendation' as const,
        content: 'Test insight',
        confidence: 0.9,
        source: 'test-agent',
        timestamp: new Date()
      };

      const existingContext = createMockMemoryContext();
      mockCache.get.mockResolvedValueOnce(existingContext);
      mockStorage.update.mockResolvedValueOnce(undefined);
      mockCache.set.mockResolvedValueOnce(undefined);

      await memoryManager.addInsightEntry(contextId, tenantId, insight);

      // Validate the storage update call
      expect(mockStorage.update).toHaveBeenCalledWith(
        contextId,
        expect.objectContaining({
          content: expect.objectContaining({
            insights: [
              expect.objectContaining({
                id: expect.any(String),
                type: 'recommendation',
                confidence: 0.9,
                relevanceScore: expect.any(Number)
              })
            ]
          }),
          relevanceScore: expect.any(Number),
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('optimizeMemory', () => {
    it('should cleanup old contexts and clear cache', async () => {
      const tenantId = 'test-tenant';
      const config = {
        maxMemorySize: 100,
        relevanceThreshold: 0.5,
        retentionPeriod: 30,
        compressionEnabled: false,
        cleanupInterval: 24
      };

      mockStorage.cleanup.mockResolvedValueOnce(5);
      mockCache.clear.mockResolvedValueOnce(10);
      mockStorage.getStats.mockResolvedValueOnce({
        totalMemoryUsed: 50,
        memoryByType: {} as any,
        memoryByUser: {},
        averageRelevanceScore: 0.7,
        oldestEntry: new Date(),
        newestEntry: new Date()
      });

      const result = await memoryManager.optimizeMemory(tenantId, config);

      expect(result.deletedContexts).toBe(5);
      expect(result.compressedContexts).toBe(0);
      expect(result.memoryFreed).toBeCloseTo(0.5, 5); // 5 * 0.1
      expect(mockStorage.cleanup).toHaveBeenCalledWith(tenantId, config);
      expect(mockCache.clear).toHaveBeenCalledWith(`tenant:${tenantId}:*`);
    });

    it('should use default config when not provided', async () => {
      const tenantId = 'test-tenant';

      mockStorage.cleanup.mockResolvedValueOnce(0);
      mockCache.clear.mockResolvedValueOnce(0);
      mockStorage.getStats.mockResolvedValueOnce({
        totalMemoryUsed: 0,
        memoryByType: {} as any,
        memoryByUser: {},
        averageRelevanceScore: 0,
        oldestEntry: new Date(),
        newestEntry: new Date()
      });

      await memoryManager.optimizeMemory(tenantId);

      expect(mockStorage.cleanup).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          maxMemorySize: 100,
          relevanceThreshold: 0.3,
          retentionPeriod: 30,
          compressionEnabled: false,
          cleanupInterval: 24
        })
      );
    });
  });

  describe('getMemoryStats', () => {
    it('should return memory statistics from storage', async () => {
      const tenantId = 'test-tenant';
      const expectedStats = {
        totalMemoryUsed: 75.5,
        memoryByType: { conversation: 50, user_profile: 25.5 },
        memoryByUser: { user1: 40, user2: 35.5 },
        averageRelevanceScore: 0.8,
        oldestEntry: new Date('2024-01-01'),
        newestEntry: new Date('2024-06-01')
      };

      mockStorage.getStats.mockResolvedValueOnce(expectedStats);

      const stats = await memoryManager.getMemoryStats(tenantId);

      expect(stats).toEqual(expectedStats);
      expect(mockStorage.getStats).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('tenant configuration', () => {
    it('should set and get tenant configuration', () => {
      const tenantId = 'test-tenant';
      const config = {
        tenantId,
        memoryQuota: 200,
        retentionPolicy: {
          conversationHistory: 7,
          userPreferences: 365,
          businessContext: 90,
          taskHistory: 30,
          insights: 180
        },
        sharingPolicy: {
          allowCrossTenant: false,
          allowCrossUser: true,
          sharedContextTypes: ['business_analysis' as ContextType],
          isolatedContextTypes: ['user_profile' as ContextType]
        },
        encryptionEnabled: true
      };

      memoryManager.setTenantConfig(tenantId, config);
      const retrievedConfig = memoryManager.getTenantConfig(tenantId);

      expect(retrievedConfig).toEqual(config);
    });

    it('should return undefined for non-existent tenant config', () => {
      const config = memoryManager.getTenantConfig('nonexistent-tenant');
      expect(config).toBeUndefined();
    });
  });
});