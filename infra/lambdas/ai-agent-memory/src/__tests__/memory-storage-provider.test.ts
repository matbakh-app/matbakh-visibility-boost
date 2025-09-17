/**
 * Tests for DynamoDB Memory Storage Provider
 */

import { DynamoDBMemoryStorage } from '../memory-storage-provider';
import {
  MemoryContext,
  MemoryQuery,
  TenantQuotaExceededError,
  MemoryNotFoundError
} from '../types';

// Mock the send function
const mockSend = jest.fn();

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  PutItemCommand: jest.fn().mockImplementation((input) => ({ input })),
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  UpdateItemCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteItemCommand: jest.fn().mockImplementation((input) => ({ input })),
  ScanCommand: jest.fn().mockImplementation((input) => ({ input })),
  BatchWriteItemCommand: jest.fn().mockImplementation((input) => ({ input }))
}));

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn((obj) => obj),
  unmarshall: jest.fn((obj) => obj)
}));

describe('DynamoDBMemoryStorage', () => {
  let storage: DynamoDBMemoryStorage;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { send: mockSend };
    storage = new DynamoDBMemoryStorage('eu-central-1', 'test-memory-table', mockClient);
    
    // Setup default mock responses
    mockSend.mockImplementation((command) => {
      // Default response for queries
      return Promise.resolve({
        Items: [
          {
            id: 'ctx123',
            tenantId: 'test-tenant',
            userId: 'test-user',
            sessionId: 'test-session',
            agentId: 'test-agent',
            contextType: 'conversation',
            content: { conversationHistory: [] },
            metadata: { version: '1.0', source: 'test', tags: [], accessCount: 0, lastAccessed: new Date() },
            relevanceScore: 0.8,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });
    });
  });

  describe('store', () => {
    it('should store memory context successfully', async () => {
      const context = (global as any).createMockMemoryContext();
      
      // Mock checkTenantQuota call and store call
      mockSend
        .mockResolvedValueOnce({ Items: [] }) // checkTenantQuota succeeds
        .mockResolvedValueOnce({}); // store succeeds

      await storage.store(context);

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-memory-table'
          })
        })
      );
    });

    it('should throw error if context already exists', async () => {
      const context = (global as any).createMockMemoryContext();
      
      const error = {
        name: 'ConditionalCheckFailedException'
      };
      
      // Mock checkTenantQuota success, then failing store call
      mockSend
        .mockResolvedValueOnce({ Items: [] }) // checkTenantQuota succeeds
        .mockRejectedValueOnce(error); // store fails with ConditionalCheckFailedException

      await expect(storage.store(context)).rejects.toThrow('Memory context already exists');
    });
  });

  describe('retrieve', () => {
    it('should retrieve contexts by tenant', async () => {
      const query: MemoryQuery = {
        tenantId: 'test-tenant',
        limit: 10
      };

      const mockResponse = {
        Items: [
          {
            id: 'ctx1',
            tenantId: 'test-tenant',
            userId: 'user1',
            sessionId: 'session1',
            agentId: 'agent1',
            contextType: 'conversation',
            content: {},
            metadata: { version: '1.0', source: 'agent1', tags: [], accessCount: 0, lastAccessed: new Date() },
            relevanceScore: 0.8,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      mockSend.mockResolvedValueOnce(mockResponse);

      const results = await storage.retrieve(query);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('ctx1');
      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should retrieve contexts by user and session', async () => {
      const query: MemoryQuery = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        sessionId: 'test-session',
        limit: 5
      };

      const mockResponse = {
        Items: [(global as any).createMockMemoryContext()]
      };

      mockSend.mockResolvedValueOnce(mockResponse);

      const results = await storage.retrieve(query);

      expect(results).toHaveLength(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('update', () => {
    it('should update memory context successfully', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';
      const updates = {
        tenantId,
        relevanceScore: 0.9,
        metadata: { version: '1.1', source: 'agent1', tags: [], accessCount: 1, lastAccessed: new Date() }
      };

      mockSend.mockResolvedValueOnce({});

      await storage.update(contextId, updates);

      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error if context not found', async () => {
      const contextId = 'nonexistent-context';
      const tenantId = 'test-tenant';
      const updates = { tenantId, relevanceScore: 0.9 };

      const error = new Error('ConditionalCheckFailedException');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(storage.update(contextId, updates)).rejects.toThrow(MemoryNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete memory context successfully', async () => {
      const contextId = 'test-context';
      const tenantId = 'test-tenant';

      mockSend.mockResolvedValueOnce({});

      await storage.delete(contextId, tenantId);

      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error if context not found', async () => {
      const contextId = 'nonexistent-context';
      const tenantId = 'test-tenant';

      const error = new Error('ConditionalCheckFailedException');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(storage.delete(contextId, tenantId)).rejects.toThrow(MemoryNotFoundError);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old and low-relevance contexts', async () => {
      const tenantId = 'test-tenant';
      const config = {
        maxMemorySize: 100,
        relevanceThreshold: 0.5,
        retentionPeriod: 30,
        compressionEnabled: false,
        cleanupInterval: 24
      };

      const oldDate = new Date(Date.now() - (35 * 24 * 60 * 60 * 1000)); // 35 days ago
      const mockContexts = [
        (global as any).createMockMemoryContext({ 
          id: 'old-context',
          createdAt: oldDate,
          relevanceScore: 0.8
        }),
        (global as any).createMockMemoryContext({ 
          id: 'low-relevance-context',
          createdAt: new Date(),
          relevanceScore: 0.3
        }),
        (global as any).createMockMemoryContext({ 
          id: 'good-context',
          createdAt: new Date(),
          relevanceScore: 0.8
        })
      ];

      mockSend
        .mockResolvedValueOnce({ Items: mockContexts }) // Query
        .mockResolvedValueOnce({}); // Batch delete

      const deletedCount = await storage.cleanup(tenantId, config);

      expect(deletedCount).toBe(2); // Should delete old and low-relevance contexts
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should handle empty cleanup gracefully', async () => {
      const tenantId = 'test-tenant';
      const config = {
        maxMemorySize: 100,
        relevanceThreshold: 0.5,
        retentionPeriod: 30,
        compressionEnabled: false,
        cleanupInterval: 24
      };

      mockSend.mockResolvedValueOnce({ Items: [] });

      const deletedCount = await storage.cleanup(tenantId, config);

      expect(deletedCount).toBe(0);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('should return memory statistics', async () => {
      const tenantId = 'test-tenant';
      const mockContexts = [
        (global as any).createMockMemoryContext({ 
          contextType: 'conversation',
          userId: 'user1',
          relevanceScore: 0.8,
          createdAt: new Date('2024-01-01')
        }),
        (global as any).createMockMemoryContext({ 
          contextType: 'user_profile',
          userId: 'user2',
          relevanceScore: 0.9,
          createdAt: new Date('2024-06-01')
        })
      ];

      mockSend.mockResolvedValueOnce({ Items: mockContexts });

      const stats = await storage.getStats(tenantId);

      expect(stats.totalMemoryUsed).toBeGreaterThan(0);
      expect(stats.memoryByType).toHaveProperty('conversation');
      expect(stats.memoryByType).toHaveProperty('user_profile');
      expect(stats.memoryByUser).toHaveProperty('user1');
      expect(stats.memoryByUser).toHaveProperty('user2');
      expect(stats.averageRelevanceScore).toBeCloseTo(0.85, 2);
    });

    it('should handle empty stats gracefully', async () => {
      const tenantId = 'test-tenant';

      mockSend.mockResolvedValueOnce({ Items: [] });

      const stats = await storage.getStats(tenantId);

      expect(stats.totalMemoryUsed).toBe(0);
      expect(Object.keys(stats.memoryByType)).toHaveLength(0);
      expect(Object.keys(stats.memoryByUser)).toHaveLength(0);
      expect(stats.averageRelevanceScore).toBe(0);
    });
  });
});