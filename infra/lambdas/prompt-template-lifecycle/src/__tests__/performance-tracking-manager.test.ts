/**
 * Performance Tracking Manager Test Suite
 * 
 * This test suite validates performance tracking functionality including execution
 * recording, metrics calculation, analytics generation, and error pattern analysis.
 */

import { jest } from '@jest/globals';
/**
 * @jest-environment node
 */

import { PerformanceTrackingManager } from '../performance-tracking-manager';

describe('PerformanceTrackingManager', () => {
  let manager: PerformanceTrackingManager;

  beforeEach(() => {
    manager = new PerformanceTrackingManager();
  });

  describe('recordExecution', () => {
    it('should record execution with comprehensive metadata', async () => {
      const execution = createMockExecution({
        templateVersionId: 'version-performance-test',
        userId: 'performance-user-123',
        sessionId: 'perf-session-456',
        input: { name: 'Performance Test User', context: 'restaurant analysis' },
        output: 'Comprehensive analysis completed for restaurant visibility',
        provider: 'claude',
        tokenUsage: {
          inputTokens: 25,
          outputTokens: 15,
          totalTokens: 40,
          cost: 0.002
        },
        responseTime: 1200,
        status: 'success',
        environment: 'production',
        metadata: {
          userAgent: 'matbakh-app/1.0',
          ipAddress: '192.168.1.100',
          region: 'eu-central-1',
          persona: 'restaurant-owner',
          requestId: 'perf-req-789'
        }
      });

      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const executionId = await manager.recordExecution(execution);

      expect(executionId).toBeValidUUID();
      expectMockCalledWithPattern(mockSend, {
        TableName: 'test-executions',
        Item: expect.objectContaining({
          templateVersionId: execution.templateVersionId,
          userId: execution.userId,
          status: execution.status,
          responseTime: execution.responseTime,
          tokenUsage: execution.tokenUsage
        })
      });
    });

    it('should handle execution recording with error status', async () => {
      const failedExecution = createMockExecution({
        status: 'error',
        error: {
          code: 'timeout',
          message: 'Request timeout after 30 seconds',
          stack: 'Error stack trace...'
        },
        responseTime: 30000,
        output: null
      });

      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const executionId = await manager.recordExecution(failedExecution);

      expect(executionId).toBeValidUUID();
      expectMockCalledWithPattern(mockSend, {
        TableName: 'test-executions',
        Item: expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: 'timeout',
            message: expect.stringContaining('timeout')
          })
        })
      });
    });
  });

  describe('getExecutionHistory', () => {
    it('should retrieve comprehensive execution history', async () => {
      const templateVersionId = 'version-history-test';
      const mockExecutions = [
        createMockExecution({
          templateVersionId,
          timestamp: '2025-01-09T10:00:00Z',
          status: 'success',
          responseTime: 1000
        }),
        createMockExecution({
          templateVersionId,
          timestamp: '2025-01-09T10:05:00Z',
          status: 'success',
          responseTime: 1200
        }),
        createMockExecution({
          templateVersionId,
          timestamp: '2025-01-09T10:10:00Z',
          status: 'error',
          responseTime: 5000
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockExecutions));

      const result = await manager.getExecutionHistory(templateVersionId);

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockExecutions);
      expectMockCalledWithPattern(mockSend, {
        TableName: 'test-executions',
        IndexName: 'templateVersionId-timestamp-index',
        KeyConditionExpression: 'templateVersionId = :templateVersionId'
      });
    });

    it('should apply time range filtering correctly', async () => {
      const templateVersionId = 'version-time-filter';
      const startTime = '2025-01-09T09:00:00Z';
      const endTime = '2025-01-09T11:00:00Z';
      const limit = 50;
      
      const mockExecutions = [
        createMockExecution({
          templateVersionId,
          timestamp: '2025-01-09T10:30:00Z'
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockExecutions));

      const result = await manager.getExecutionHistory(templateVersionId, limit, startTime, endTime);

      expect(result).toEqual(mockExecutions);
      expectMockCalledWithPattern(mockSend, {
        FilterExpression: '#timestamp >= :startTime AND #timestamp <= :endTime',
        ExpressionAttributeNames: { '#timestamp': 'timestamp' },
        ExpressionAttributeValues: expect.objectContaining({
          ':templateVersionId': templateVersionId,
          ':startTime': startTime,
          ':endTime': endTime
        }),
        Limit: limit
      });
    });

    it('should handle empty execution history', async () => {
      const templateVersionId = 'version-no-executions';

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      const result = await manager.getExecutionHistory(templateVersionId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return comprehensive performance metrics', async () => {
      const templateVersionId = 'version-metrics-test';
      const mockMetrics = createMockPerformanceMetrics({
        templateVersionId,
        totalExecutions: 250,
        successRate: 96.8,
        averageResponseTime: 1150,
        averageTokenUsage: 45,
        errorRate: 3.2,
        costPerExecution: 0.0018,
        detailedMetrics: {
          executionsByDay: { 
            '2025-01-08': 80,
            '2025-01-09': 170
          },
          responseTimePercentiles: { 
            p50: 950, 
            p90: 1400, 
            p95: 1750, 
            p99: 2300 
          },
          errorsByType: { 
            'timeout': 5, 
            'validation': 3,
            'rate_limit': 1
          },
          tokenUsageDistribution: { 
            min: 15, 
            max: 85, 
            avg: 45, 
            median: 42 
          },
          geographicDistribution: { 
            'eu-central-1': 180,
            'us-east-1': 70
          }
        }
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ performanceMetrics: mockMetrics }));

      const result = await manager.getPerformanceMetrics(templateVersionId);

      expect(result).toEqual(mockMetrics);
      expect(result?.totalExecutions).toBe(250);
      expect(result?.successRate).toBeCloseTo(96.8, 1);
      expect(result?.detailedMetrics.errorsByType).toHaveProperty('timeout');
      expectMockCalledWithPattern(mockSend, {
        TableName: 'test-versions',
        Key: { id: templateVersionId },
        ProjectionExpression: 'performanceMetrics'
      });
    });

    it('should handle missing performance metrics gracefully', async () => {
      const templateVersionId = 'version-no-metrics';

      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      const result = await manager.getPerformanceMetrics(templateVersionId);

      expect(result).toBeNull();
    });

    it('should handle partial metrics data', async () => {
      const templateVersionId = 'version-partial-metrics';
      const partialMetrics = {
        templateVersionId,
        totalExecutions: 10,
        successRate: 100,
        averageResponseTime: 800,
        // Missing some fields
        lastUpdated: '2025-01-09T10:00:00Z'
      };

      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ performanceMetrics: partialMetrics }));

      const result = await manager.getPerformanceMetrics(templateVersionId);

      expect(result).toEqual(partialMetrics);
      expect(result?.totalExecutions).toBe(10);
      expect(result?.successRate).toBe(100);
    });
  });

  describe('getTemplateAnalytics', () => {
    it('should generate comprehensive template analytics', async () => {
      const templateId = 'template-analytics-test';
      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-01-09T23:59:59Z';

      const mockVersions = [
        createMockVersion({ id: 'version-1', templateId }),
        createMockVersion({ id: 'version-2', templateId })
      ];

      const mockExecutions = [
        createMockExecution({
          templateVersionId: 'version-1',
          userId: 'user-restaurant-1',
          timestamp: '2025-01-09T10:00:00Z',
          status: 'success',
          responseTime: 950,
          tokenUsage: { cost: 0.0015, totalTokens: 30 }
        }),
        createMockExecution({
          templateVersionId: 'version-1',
          userId: 'user-restaurant-2',
          timestamp: '2025-01-09T14:00:00Z',
          status: 'success',
          responseTime: 1100,
          tokenUsage: { cost: 0.0018, totalTokens: 35 }
        }),
        createMockExecution({
          templateVersionId: 'version-2',
          userId: 'user-restaurant-3',
          timestamp: '2025-01-09T16:00:00Z',
          status: 'error',
          responseTime: 3000,
          tokenUsage: { cost: 0.001, totalTokens: 20 }
        })
      ];

      // Mock versions query
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockVersions));
      
      // Mock executions queries for each version
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([mockExecutions[0], mockExecutions[1]]));
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([mockExecutions[2]]));
      
      // Mock performance metrics queries
      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ 
        performanceMetrics: createMockPerformanceMetrics({
          templateVersionId: 'version-1',
          totalExecutions: 2,
          successRate: 100
        })
      }));
      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ 
        performanceMetrics: createMockPerformanceMetrics({
          templateVersionId: 'version-2',
          totalExecutions: 1,
          successRate: 0
        })
      }));

      const result = await manager.getTemplateAnalytics(templateId, startDate, endDate);

      expect(result).toMatchObject({
        templateId,
        timeRange: { start: startDate, end: endDate },
        totalExecutions: 3,
        uniqueUsers: 3,
        averageResponseTime: expect.any(Number),
        totalCost: expect.any(Number)
      });
      expect(result.trendData).toHaveLength(1);
      expect(result.trendData[0].date).toBe('2025-01-09');
      expect(result.trendData[0].executions).toBe(3);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle template with no executions', async () => {
      const templateId = 'template-no-executions';
      const startDate = '2025-01-01T00:00:00Z';
      const endDate = '2025-01-09T23:59:59Z';

      const mockVersions = [
        createMockVersion({ id: 'version-empty', templateId })
      ];

      // Mock versions query
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockVersions));
      // Mock empty executions query
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));
      // Mock performance metrics query
      mockSend.mockResolvedValueOnce(createMockDynamoResponse({ 
        performanceMetrics: createMockPerformanceMetrics({
          templateVersionId: 'version-empty',
          totalExecutions: 0
        })
      }));

      const result = await manager.getTemplateAnalytics(templateId, startDate, endDate);

      expect(result.totalExecutions).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.trendData).toHaveLength(0);
      expect(result.recommendations).toContain('No executions found');
    });
  });

  describe('getExecutionsByStatus', () => {
    it('should filter executions by specific status', async () => {
      const templateVersionId = 'version-status-filter';
      const status = 'error';
      
      const mockExecutions = [
        createMockExecution({ 
          templateVersionId,
          status: 'error', 
          error: { 
            code: 'timeout', 
            message: 'Request timeout after 30 seconds',
            stack: 'Error: timeout...'
          },
          responseTime: 30000
        }),
        createMockExecution({ 
          templateVersionId,
          status: 'error', 
          error: { 
            code: 'validation', 
            message: 'Invalid input parameters',
            stack: 'ValidationError: invalid...'
          },
          responseTime: 500
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockExecutions));

      const result = await manager.getExecutionsByStatus(templateVersionId, status);

      expect(result).toHaveLength(2);
      expect(result.every(exec => exec.status === 'error')).toBe(true);
      expect(result[0].error).toBeDefined();
      expect(result[1].error).toBeDefined();
      expectMockCalledWithPattern(mockSend, {
        TableName: 'test-executions',
        IndexName: 'templateVersionId-status-index',
        KeyConditionExpression: 'templateVersionId = :templateVersionId AND #status = :status',
        ExpressionAttributeValues: {
          ':templateVersionId': templateVersionId,
          ':status': status
        }
      });
    });

    it('should handle successful executions filtering', async () => {
      const templateVersionId = 'version-success-filter';
      const status = 'success';
      
      const mockExecutions = [
        createMockExecution({ 
          templateVersionId,
          status: 'success',
          responseTime: 1000,
          output: 'Successful analysis completed'
        }),
        createMockExecution({ 
          templateVersionId,
          status: 'success',
          responseTime: 1200,
          output: 'Another successful execution'
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockExecutions));

      const result = await manager.getExecutionsByStatus(templateVersionId, status);

      expect(result).toHaveLength(2);
      expect(result.every(exec => exec.status === 'success')).toBe(true);
      expect(result.every(exec => exec.output !== null)).toBe(true);
    });

    it('should return empty array when no executions match status', async () => {
      const templateVersionId = 'version-no-matches';
      const status = 'pending';

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      const result = await manager.getExecutionsByStatus(templateVersionId, status);

      expect(result).toHaveLength(0);
    });
  });

  describe('getTopErrorPatterns', () => {
    it('should analyze and rank error patterns by frequency', async () => {
      const templateVersionId = 'version-error-analysis';
      
      const mockErrorExecutions = [
        createMockExecution({
          templateVersionId,
          status: 'error',
          error: { code: 'timeout', message: 'Request timeout after 30s' },
          timestamp: '2025-01-09T10:00:00Z'
        }),
        createMockExecution({
          templateVersionId,
          status: 'error',
          error: { code: 'timeout', message: 'Connection timeout' },
          timestamp: '2025-01-09T10:15:00Z'
        }),
        createMockExecution({
          templateVersionId,
          status: 'error',
          error: { code: 'timeout', message: 'Gateway timeout' },
          timestamp: '2025-01-09T10:30:00Z'
        }),
        createMockExecution({
          templateVersionId,
          status: 'error',
          error: { code: 'validation', message: 'Invalid input parameters' },
          timestamp: '2025-01-09T11:00:00Z'
        }),
        createMockExecution({
          templateVersionId,
          status: 'error',
          error: { code: 'rate_limit', message: 'Rate limit exceeded' },
          timestamp: '2025-01-09T11:30:00Z'
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockErrorExecutions));

      const result = await manager.getTopErrorPatterns(templateVersionId);

      expect(result).toHaveLength(3);
      
      // Should be sorted by frequency (timeout most common)
      expect(result[0]).toMatchObject({
        errorCode: 'timeout',
        count: 3,
        percentage: 60,
        sampleMessage: expect.stringContaining('timeout')
      });
      
      expect(result[1]).toMatchObject({
        errorCode: 'validation',
        count: 1,
        percentage: 20
      });
      
      expect(result[2]).toMatchObject({
        errorCode: 'rate_limit',
        count: 1,
        percentage: 20
      });

      // Verify percentages add up to 100
      const totalPercentage = result.reduce((sum, pattern) => sum + pattern.percentage, 0);
      expect(totalPercentage).toBe(100);
    });

    it('should handle template with no errors', async () => {
      const templateVersionId = 'version-no-errors';

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      const result = await manager.getTopErrorPatterns(templateVersionId);

      expect(result).toHaveLength(0);
    });

    it('should include temporal analysis in error patterns', async () => {
      const templateVersionId = 'version-temporal-errors';
      
      const mockErrorExecutions = [
        createMockExecution({
          status: 'error',
          error: { code: 'memory', message: 'Out of memory' },
          timestamp: '2025-01-09T10:00:00Z'
        }),
        createMockExecution({
          status: 'error',
          error: { code: 'memory', message: 'Memory allocation failed' },
          timestamp: '2025-01-09T10:01:00Z'
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockErrorExecutions));

      const result = await manager.getTopErrorPatterns(templateVersionId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        errorCode: 'memory',
        count: 2,
        percentage: 100,
        firstOccurrence: '2025-01-09T10:00:00Z',
        lastOccurrence: '2025-01-09T10:01:00Z'
      });
    });
  });
});

// Helper function moved to context factory - no longer needed here