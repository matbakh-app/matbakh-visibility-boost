/**
 * Cost Management System Tests
 * 
 * Comprehensive test suite for all cost management components
 */

import { jest } from '@jest/globals';

// Mock AWS SDK
const mockDynamoClient = {
  send: jest.fn()
};

const mockSNSClient = {
  send: jest.fn()
};

const mockSESClient = {
  send: jest.fn()
};

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => mockDynamoClient),
  PutItemCommand: jest.fn(),
  GetItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => mockSNSClient),
  PublishCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(() => mockSESClient),
  SendEmailCommand: jest.fn()
}));

// Mock audit trail system
jest.mock('../audit-trail-system', () => ({
  auditTrailSystem: {
    logAction: jest.fn()
  }
}));

// Import modules after mocking
import { 
  trackTokenUsage, 
  calculateTokenCost, 
  getTokenAnalytics,
  generateOptimizationRecommendations,
  getCostProjection,
  exportTokenUsageData
} from '../token-usage-tracker';

import {
  createCostThreshold,
  getCostThresholds,
  monitorAllThresholds
} from '../cost-threshold-monitor';

import {
  analyzeUsagePatterns,
  generateCostOptimizationInsights,
  generateBusinessIntelligence,
  getBenchmarkData
} from '../usage-analytics-engine';

import {
  initializeAutoControl,
  getAutoControlConfig,
  executeAutoControls,
  reverseControlAction,
  hasActiveCostControls
} from '../automatic-cost-control';

describe('Token Usage Tracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTokenCost', () => {
    it('should calculate cost correctly for Claude 3.5 Sonnet', () => {
      const cost = calculateTokenCost('claude-3-5-sonnet', 1000, 500);
      // Input: 1000 tokens * $0.003 = $0.003
      // Output: 500 tokens * $0.015 = $0.0075
      // Total: $0.0105
      expect(cost).toBeCloseTo(0.0105, 4);
    });

    it('should calculate cost correctly for Claude 3 Haiku', () => {
      const cost = calculateTokenCost('claude-3-haiku', 1000, 500);
      // Input: 1000 tokens * $0.00025 = $0.00025
      // Output: 500 tokens * $0.00125 = $0.000625
      // Total: $0.000875
      expect(cost).toBeCloseTo(0.000875, 6);
    });

    it('should default to Sonnet pricing for unknown models', () => {
      const cost = calculateTokenCost('unknown-model', 1000, 500);
      expect(cost).toBeCloseTo(0.0105, 4);
    });
  });

  describe('trackTokenUsage', () => {
    it('should track token usage successfully', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const usage = {
        requestId: 'req-123',
        userId: 'user-123',
        operation: 'vc_analysis',
        modelId: 'claude-3-5-sonnet',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      };

      const result = await trackTokenUsage(usage);

      expect(result).toMatchObject({
        ...usage,
        cost: expect.any(Number),
        timestamp: expect.any(String)
      });

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(2); // Store usage + update analytics
    });

    it('should handle tracking errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));

      const usage = {
        requestId: 'req-123',
        userId: 'user-123',
        operation: 'vc_analysis',
        modelId: 'claude-3-5-sonnet',
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500
      };

      await expect(trackTokenUsage(usage)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getTokenAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const mockUsageData = [
        {
          requestId: 'req-1',
          userId: 'user-123',
          operation: 'vc_analysis',
          modelId: 'claude-3-5-sonnet',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          cost: 0.0105,
          timestamp: '2025-01-09T10:00:00Z',
          cacheHit: false
        },
        {
          requestId: 'req-2',
          userId: 'user-123',
          operation: 'content_generation',
          modelId: 'claude-3-haiku',
          inputTokens: 800,
          outputTokens: 400,
          totalTokens: 1200,
          cost: 0.0007,
          timestamp: '2025-01-09T11:00:00Z',
          cacheHit: true
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockUsageData.map(item => ({
          request_id: { S: item.requestId },
          user_id: { S: item.userId },
          operation: { S: item.operation },
          model_id: { S: item.modelId },
          input_tokens: { N: item.inputTokens.toString() },
          output_tokens: { N: item.outputTokens.toString() },
          total_tokens: { N: item.totalTokens.toString() },
          cost: { N: item.cost.toString() },
          timestamp: { S: item.timestamp },
          cache_hit: { BOOL: item.cacheHit }
        }))
      });

      const analytics = await getTokenAnalytics('user-123', 7);

      expect(analytics).toMatchObject({
        totalTokens: 2700,
        totalCost: expect.any(Number),
        averageTokensPerRequest: 1350,
        tokensByModel: {
          'claude-3-5-sonnet': 1500,
          'claude-3-haiku': 1200
        },
        tokensByOperation: {
          'vc_analysis': 1500,
          'content_generation': 1200
        },
        efficiency: {
          inputOutputRatio: expect.any(Number),
          cacheHitRate: 0.5,
          costPerToken: expect.any(Number)
        }
      });
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should generate model switch recommendations', async () => {
      const analytics = {
        totalTokens: 10000,
        totalCost: 0.105,
        tokensByModel: {
          'claude-3-5-sonnet': 8000,
          'claude-3-haiku': 2000
        },
        costsByModel: {
          'claude-3-5-sonnet': 0.084,
          'claude-3-haiku': 0.021
        },
        efficiency: {
          inputOutputRatio: 1.5,
          cacheHitRate: 0.2,
          costPerToken: 0.0000105
        },
        dailyTrend: []
      };

      const recommendations = await generateOptimizationRecommendations('user-123', analytics);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'model_switch',
            priority: 'high',
            description: expect.stringContaining('Claude 3 Haiku'),
            potentialSavings: expect.any(Number)
          })
        ])
      );
    });

    it('should generate caching recommendations for low hit rate', async () => {
      const analytics = {
        totalTokens: 10000,
        totalCost: 0.105,
        tokensByModel: {},
        costsByModel: {},
        efficiency: {
          inputOutputRatio: 1.5,
          cacheHitRate: 0.1, // Low cache hit rate
          costPerToken: 0.0000105
        },
        dailyTrend: []
      };

      const recommendations = await generateOptimizationRecommendations('user-123', analytics);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'caching',
            priority: 'high',
            description: expect.stringContaining('cache hit rate'),
            potentialSavings: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('getCostProjection', () => {
    it('should project costs based on recent usage', async () => {
      const mockAnalytics = {
        dailyTrend: [
          { date: '2025-01-03', cost: 1.0, tokens: 10000 },
          { date: '2025-01-04', cost: 1.2, tokens: 12000 },
          { date: '2025-01-05', cost: 1.1, tokens: 11000 },
          { date: '2025-01-06', cost: 1.3, tokens: 13000 },
          { date: '2025-01-07', cost: 1.0, tokens: 10000 },
          { date: '2025-01-08', cost: 1.4, tokens: 14000 },
          { date: '2025-01-09', cost: 1.2, tokens: 12000 }
        ],
        costsByModel: {
          'claude-3-5-sonnet': 5.0,
          'claude-3-haiku': 3.2
        },
        costsByOperation: {
          'vc_analysis': 4.0,
          'content_generation': 4.2
        }
      };

      // Mock getTokenAnalytics
      jest.doMock('../token-usage-tracker', () => ({
        ...jest.requireActual('../token-usage-tracker'),
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
      }));

      const projection = await getCostProjection('user-123', 30);

      expect(projection).toMatchObject({
        currentDailyCost: expect.any(Number),
        projectedMonthlyCost: expect.any(Number),
        projectedCost: expect.any(Number),
        confidence: expect.any(Number),
        breakdown: {
          byModel: expect.any(Object),
          byOperation: expect.any(Object)
        }
      });

      expect(projection.confidence).toBeGreaterThan(0);
      expect(projection.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('exportTokenUsageData', () => {
    it('should export data in JSON format', async () => {
      const mockUsageData = [
        {
          requestId: 'req-1',
          userId: 'user-123',
          operation: 'vc_analysis',
          modelId: 'claude-3-5-sonnet',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          cost: 0.0105,
          timestamp: '2025-01-09T10:00:00Z',
          cacheHit: false
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockUsageData.map(item => ({
          request_id: { S: item.requestId },
          user_id: { S: item.userId },
          operation: { S: item.operation },
          model_id: { S: item.modelId },
          input_tokens: { N: item.inputTokens.toString() },
          output_tokens: { N: item.outputTokens.toString() },
          total_tokens: { N: item.totalTokens.toString() },
          cost: { N: item.cost.toString() },
          timestamp: { S: item.timestamp },
          cache_hit: { BOOL: item.cacheHit }
        }))
      });

      const jsonData = await exportTokenUsageData('user-123', '2025-01-01', '2025-01-31', 'json');
      const parsedData = JSON.parse(jsonData);

      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData[0]).toMatchObject({
        requestId: 'req-1',
        operation: 'vc_analysis',
        modelId: 'claude-3-5-sonnet'
      });
    });

    it('should export data in CSV format', async () => {
      const mockUsageData = [
        {
          requestId: 'req-1',
          userId: 'user-123',
          operation: 'vc_analysis',
          modelId: 'claude-3-5-sonnet',
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          cost: 0.0105,
          timestamp: '2025-01-09T10:00:00Z',
          cacheHit: false
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockUsageData.map(item => ({
          request_id: { S: item.requestId },
          user_id: { S: item.userId },
          operation: { S: item.operation },
          model_id: { S: item.modelId },
          input_tokens: { N: item.inputTokens.toString() },
          output_tokens: { N: item.outputTokens.toString() },
          total_tokens: { N: item.totalTokens.toString() },
          cost: { N: item.cost.toString() },
          timestamp: { S: item.timestamp },
          cache_hit: { BOOL: item.cacheHit }
        }))
      });

      const csvData = await exportTokenUsageData('user-123', '2025-01-01', '2025-01-31', 'csv');
      
      expect(csvData).toContain('Request ID,Operation,Model');
      expect(csvData).toContain('req-1,vc_analysis,claude-3-5-sonnet');
    });
  });
});

describe('Cost Threshold Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCostThreshold', () => {
    it('should create cost threshold successfully', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const threshold = {
        userId: 'user-123',
        name: 'Daily Cost Limit',
        amount: 10,
        period: 'day' as const,
        type: 'absolute' as const,
        actions: [
          {
            type: 'email' as const,
            target: 'user@example.com'
          }
        ],
        enabled: true
      };

      const result = await createCostThreshold(threshold);

      expect(result).toMatchObject({
        ...threshold,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCostThresholds', () => {
    it('should retrieve user thresholds', async () => {
      const mockThresholds = [
        {
          threshold_id: { S: 'threshold-1' },
          user_id: { S: 'user-123' },
          name: { S: 'Daily Limit' },
          amount: { N: '10' },
          period: { S: 'day' },
          type: { S: 'absolute' },
          actions: { S: '[]' },
          enabled: { BOOL: true },
          created_at: { S: '2025-01-09T10:00:00Z' },
          updated_at: { S: '2025-01-09T10:00:00Z' }
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockThresholds
      });

      const thresholds = await getCostThresholds('user-123');

      expect(thresholds).toHaveLength(1);
      expect(thresholds[0]).toMatchObject({
        id: 'threshold-1',
        userId: 'user-123',
        name: 'Daily Limit',
        amount: 10,
        period: 'day',
        type: 'absolute',
        enabled: true
      });
    });

    it('should filter out disabled thresholds', async () => {
      const mockThresholds = [
        {
          threshold_id: { S: 'threshold-1' },
          user_id: { S: 'user-123' },
          name: { S: 'Enabled Threshold' },
          amount: { N: '10' },
          period: { S: 'day' },
          type: { S: 'absolute' },
          actions: { S: '[]' },
          enabled: { BOOL: true },
          created_at: { S: '2025-01-09T10:00:00Z' },
          updated_at: { S: '2025-01-09T10:00:00Z' }
        },
        {
          threshold_id: { S: 'threshold-2' },
          user_id: { S: 'user-123' },
          name: { S: 'Disabled Threshold' },
          amount: { N: '20' },
          period: { S: 'day' },
          type: { S: 'absolute' },
          actions: { S: '[]' },
          enabled: { BOOL: false },
          created_at: { S: '2025-01-09T10:00:00Z' },
          updated_at: { S: '2025-01-09T10:00:00Z' }
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockThresholds
      });

      const thresholds = await getCostThresholds('user-123');

      expect(thresholds).toHaveLength(1);
      expect(thresholds[0].name).toBe('Enabled Threshold');
    });
  });

  describe('monitorAllThresholds', () => {
    it('should monitor all active thresholds', async () => {
      const mockThresholds = [
        {
          threshold_id: { S: 'threshold-1' },
          user_id: { S: 'user-123' },
          name: { S: 'Daily Limit' },
          amount: { N: '10' },
          period: { S: 'day' },
          type: { S: 'absolute' },
          actions: { S: '[]' },
          enabled: { BOOL: true },
          created_at: { S: '2025-01-09T10:00:00Z' },
          updated_at: { S: '2025-01-09T10:00:00Z' }
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockThresholds
      });

      await expect(monitorAllThresholds()).resolves.not.toThrow();
      expect(mockDynamoClient.send).toHaveBeenCalled();
    });

    it('should handle monitoring errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(monitorAllThresholds()).rejects.toThrow('DynamoDB error');
    });
  });
});

describe('Usage Analytics Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeUsagePatterns', () => {
    it('should detect steady usage pattern', async () => {
      // Mock consistent daily costs
      const mockAnalytics = {
        dailyTrend: [
          { date: '2025-01-01', cost: 1.0, tokens: 10000 },
          { date: '2025-01-02', cost: 1.1, tokens: 11000 },
          { date: '2025-01-03', cost: 0.9, tokens: 9000 },
          { date: '2025-01-04', cost: 1.0, tokens: 10000 },
          { date: '2025-01-05', cost: 1.1, tokens: 11000 },
          { date: '2025-01-06', cost: 0.9, tokens: 9000 },
          { date: '2025-01-07', cost: 1.0, tokens: 10000 }
        ],
        tokensByModel: { 'claude-3-5-sonnet': 70000 },
        tokensByOperation: { 'vc_analysis': 70000 }
      };

      // Mock dependencies
      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
      }));

      jest.doMock('../cost-control-system', () => ({
        getCostUsage: jest.fn().mockResolvedValue([
          { totalCost: 7.0, period: '2025-01-07' }
        ])
      }));

      const pattern = await analyzeUsagePatterns('user-123', 7);

      expect(pattern).toMatchObject({
        userId: 'user-123',
        pattern: 'steady',
        confidence: expect.any(Number),
        characteristics: {
          averageDailyCost: 1.0,
          preferredModels: ['claude-3-5-sonnet'],
          commonOperations: ['vc_analysis']
        },
        predictions: {
          nextWeekCost: expect.any(Number),
          nextMonthCost: expect.any(Number),
          riskLevel: expect.any(String)
        }
      });
    });

    it('should detect growing usage pattern', async () => {
      // Mock increasing daily costs
      const mockAnalytics = {
        dailyTrend: [
          { date: '2025-01-01', cost: 0.5, tokens: 5000 },
          { date: '2025-01-02', cost: 0.7, tokens: 7000 },
          { date: '2025-01-03', cost: 0.9, tokens: 9000 },
          { date: '2025-01-04', cost: 1.1, tokens: 11000 },
          { date: '2025-01-05', cost: 1.3, tokens: 13000 },
          { date: '2025-01-06', cost: 1.5, tokens: 15000 },
          { date: '2025-01-07', cost: 1.7, tokens: 17000 }
        ],
        tokensByModel: { 'claude-3-5-sonnet': 77000 },
        tokensByOperation: { 'vc_analysis': 77000 }
      };

      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
      }));

      jest.doMock('../cost-control-system', () => ({
        getCostUsage: jest.fn().mockResolvedValue([
          { totalCost: 8.7, period: '2025-01-07' }
        ])
      }));

      const pattern = await analyzeUsagePatterns('user-123', 7);

      expect(pattern.pattern).toBe('growing');
      expect(pattern.predictions.riskLevel).toBe('medium');
    });

    it('should detect spiky usage pattern', async () => {
      // Mock highly variable daily costs
      const mockAnalytics = {
        dailyTrend: [
          { date: '2025-01-01', cost: 0.1, tokens: 1000 },
          { date: '2025-01-02', cost: 5.0, tokens: 50000 },
          { date: '2025-01-03', cost: 0.2, tokens: 2000 },
          { date: '2025-01-04', cost: 4.5, tokens: 45000 },
          { date: '2025-01-05', cost: 0.1, tokens: 1000 },
          { date: '2025-01-06', cost: 6.0, tokens: 60000 },
          { date: '2025-01-07', cost: 0.3, tokens: 3000 }
        ],
        tokensByModel: { 'claude-3-5-sonnet': 162000 },
        tokensByOperation: { 'vc_analysis': 162000 }
      };

      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
      }));

      jest.doMock('../cost-control-system', () => ({
        getCostUsage: jest.fn().mockResolvedValue([
          { totalCost: 16.2, period: '2025-01-07' }
        ])
      }));

      const pattern = await analyzeUsagePatterns('user-123', 7);

      expect(pattern.pattern).toBe('spiky');
      expect(pattern.predictions.riskLevel).toBe('high');
    });
  });

  describe('generateCostOptimizationInsights', () => {
    it('should generate comprehensive insights', async () => {
      const mockAnalytics = {
        totalCost: 50,
        totalTokens: 500000,
        efficiency: {
          cacheHitRate: 0.2,
          inputOutputRatio: 2.5,
          costPerToken: 0.0001
        }
      };

      const mockUsagePattern = {
        pattern: 'spiky',
        confidence: 0.8
      };

      // Mock dependencies
      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
        generateOptimizationRecommendations: jest.fn().mockResolvedValue([
          {
            type: 'model_switch',
            priority: 'high',
            description: 'Switch to cheaper model',
            potentialSavings: 20,
            implementation: 'Update model selection',
            impact: 'Reduce costs by 40%'
          }
        ])
      }));

      const insights = await generateCostOptimizationInsights('user-123');

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            priority: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            impact: {
              costSavings: expect.any(Number),
              percentageSavings: expect.any(Number),
              timeframe: expect.any(String)
            },
            implementation: {
              difficulty: expect.any(String),
              steps: expect.any(Array),
              estimatedHours: expect.any(Number)
            }
          })
        ])
      );
    });
  });

  describe('generateBusinessIntelligence', () => {
    it('should generate comprehensive BI report', async () => {
      const mockAnalytics = {
        totalTokens: 100000,
        totalCost: 10,
        averageTokensPerRequest: 1000,
        averageCostPerRequest: 0.1,
        tokensByModel: {
          'claude-3-5-sonnet': 60000,
          'claude-3-haiku': 40000
        },
        costsByModel: {
          'claude-3-5-sonnet': 6,
          'claude-3-haiku': 4
        },
        tokensByOperation: {
          'vc_analysis': 50000,
          'content_generation': 50000
        },
        costsByOperation: {
          'vc_analysis': 5,
          'content_generation': 5
        },
        dailyTrend: [
          { date: '2025-01-01', cost: 1.5, tokens: 15000 },
          { date: '2025-01-02', cost: 1.3, tokens: 13000 }
        ],
        efficiency: {
          cacheHitRate: 0.4,
          inputOutputRatio: 1.5,
          costPerToken: 0.0001
        }
      };

      // Mock dependencies
      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
      }));

      const bi = await generateBusinessIntelligence('user-123', 'month');

      expect(bi).toMatchObject({
        userId: 'user-123',
        period: 'month',
        summary: {
          totalCost: 10,
          totalTokens: 100000,
          totalRequests: expect.any(Number),
          averageRequestCost: 0.1,
          costTrend: expect.any(String),
          efficiency: expect.any(String)
        },
        breakdown: {
          byModel: expect.arrayContaining([
            expect.objectContaining({
              model: expect.any(String),
              cost: expect.any(Number),
              tokens: expect.any(Number),
              percentage: expect.any(Number)
            })
          ]),
          byOperation: expect.arrayContaining([
            expect.objectContaining({
              operation: expect.any(String),
              cost: expect.any(Number),
              tokens: expect.any(Number),
              percentage: expect.any(Number)
            })
          ])
        },
        insights: expect.any(Array),
        recommendations: expect.any(Array),
        alerts: expect.any(Array)
      });
    });
  });

  describe('getBenchmarkData', () => {
    it('should return benchmark data for industry and tier', async () => {
      const benchmark = await getBenchmarkData('hospitality', 'professional');

      expect(benchmark).toMatchObject({
        industry: 'hospitality',
        userTier: 'professional',
        metrics: {
          averageMonthlyCost: expect.any(Number),
          averageTokensPerRequest: expect.any(Number),
          averageCostPerToken: expect.any(Number),
          cacheHitRate: expect.any(Number),
          preferredModels: expect.any(Array)
        },
        percentiles: {
          p25: expect.any(Number),
          p50: expect.any(Number),
          p75: expect.any(Number),
          p90: expect.any(Number),
          p95: expect.any(Number)
        }
      });
    });

    it('should return different benchmarks for different tiers', async () => {
      const starterBenchmark = await getBenchmarkData('hospitality', 'starter');
      const enterpriseBenchmark = await getBenchmarkData('hospitality', 'enterprise');

      expect(starterBenchmark.metrics.averageMonthlyCost).toBeLessThan(
        enterpriseBenchmark.metrics.averageMonthlyCost
      );
    });
  });
});

describe('Automatic Cost Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeAutoControl', () => {
    it('should initialize auto control with default config', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const config = await initializeAutoControl('user-123');

      expect(config).toMatchObject({
        userId: 'user-123',
        enabled: true,
        rules: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            trigger: expect.any(Object),
            action: expect.any(Object)
          })
        ]),
        emergencySettings: expect.objectContaining({
          enabled: true,
          maxDailyCost: expect.any(Number)
        }),
        gracefulDegradation: expect.objectContaining({
          enabled: true,
          levels: expect.any(Array)
        })
      });

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(1);
    });

    it('should initialize auto control with custom config', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const customConfig = {
        enabled: false,
        emergencySettings: {
          enabled: false,
          maxDailyCost: 50,
          maxHourlyCost: 5,
          shutdownThreshold: 75,
          notificationContacts: ['admin@example.com'],
          autoRestore: false,
          restoreAfterHours: 12
        }
      };

      const config = await initializeAutoControl('user-123', customConfig);

      expect(config.enabled).toBe(false);
      expect(config.emergencySettings.maxDailyCost).toBe(50);
      expect(config.emergencySettings.notificationContacts).toContain('admin@example.com');
    });
  });

  describe('getAutoControlConfig', () => {
    it('should retrieve auto control config', async () => {
      const mockConfig = {
        user_id: { S: 'user-123' },
        enabled: { BOOL: true },
        rules: { S: JSON.stringify([]) },
        emergency_settings: { S: JSON.stringify({ enabled: true, maxDailyCost: 100 }) },
        graceful_degradation: { S: JSON.stringify({ enabled: true, levels: [] }) },
        created_at: { S: '2025-01-09T10:00:00Z' },
        updated_at: { S: '2025-01-09T10:00:00Z' }
      };

      mockDynamoClient.send.mockResolvedValue({
        Item: mockConfig
      });

      const config = await getAutoControlConfig('user-123');

      expect(config).toMatchObject({
        userId: 'user-123',
        enabled: true,
        rules: [],
        emergencySettings: { enabled: true, maxDailyCost: 100 },
        gracefulDegradation: { enabled: true, levels: [] }
      });
    });

    it('should return null if config not found', async () => {
      mockDynamoClient.send.mockResolvedValue({});

      const config = await getAutoControlConfig('user-123');

      expect(config).toBeNull();
    });
  });

  describe('executeAutoControls', () => {
    it('should execute applicable control rules', async () => {
      const mockConfig = {
        userId: 'user-123',
        enabled: true,
        rules: [
          {
            id: 'daily_warning',
            name: 'Daily Warning',
            trigger: {
              type: 'cost_threshold',
              value: 5,
              period: 'day',
              comparison: 'absolute'
            },
            action: {
              type: 'notify',
              parameters: { severity: 'warning' },
              reversible: false
            },
            conditions: [],
            priority: 1,
            enabled: true
          }
        ],
        emergencySettings: { enabled: true },
        gracefulDegradation: { enabled: true },
        createdAt: '2025-01-09T10:00:00Z',
        updatedAt: '2025-01-09T10:00:00Z'
      };

      // Mock getAutoControlConfig
      jest.doMock('../automatic-cost-control', () => ({
        ...jest.requireActual('../automatic-cost-control'),
        getAutoControlConfig: jest.fn().mockResolvedValue(mockConfig)
      }));

      mockDynamoClient.send.mockResolvedValue({});

      const actions = await executeAutoControls('user-123', 10, 'day');

      expect(actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-123',
            ruleId: 'daily_warning',
            actionType: 'notify',
            status: 'active'
          })
        ])
      );
    });

    it('should not execute controls if disabled', async () => {
      const mockConfig = {
        userId: 'user-123',
        enabled: false,
        rules: [],
        emergencySettings: { enabled: false },
        gracefulDegradation: { enabled: false },
        createdAt: '2025-01-09T10:00:00Z',
        updatedAt: '2025-01-09T10:00:00Z'
      };

      jest.doMock('../automatic-cost-control', () => ({
        ...jest.requireActual('../automatic-cost-control'),
        getAutoControlConfig: jest.fn().mockResolvedValue(mockConfig)
      }));

      const actions = await executeAutoControls('user-123', 10, 'day');

      expect(actions).toHaveLength(0);
    });
  });

  describe('hasActiveCostControls', () => {
    it('should detect active cost controls', async () => {
      const mockActions = [
        {
          action_id: { S: 'action-1' },
          user_id: { S: 'user-123' },
          rule_id: { S: 'rule-1' },
          action_type: { S: 'throttle' },
          trigger: { S: '{}' },
          parameters: { S: JSON.stringify({ maxRequestsPerMinute: 10 }) },
          executed_at: { S: '2025-01-09T10:00:00Z' },
          status: { S: 'active' },
          impact: { S: '{}' }
        }
      ];

      mockDynamoClient.send.mockResolvedValue({
        Items: mockActions
      });

      const result = await hasActiveCostControls('user-123');

      expect(result).toMatchObject({
        hasControls: true,
        activeActions: expect.arrayContaining([
          expect.objectContaining({
            actionType: 'throttle',
            status: 'active'
          })
        ]),
        restrictions: {
          throttled: true,
          degraded: false,
          shutdown: false,
          maxRequestsPerMinute: 10
        }
      });
    });

    it('should return no controls if none active', async () => {
      mockDynamoClient.send.mockResolvedValue({
        Items: []
      });

      const result = await hasActiveCostControls('user-123');

      expect(result).toMatchObject({
        hasControls: false,
        activeActions: [],
        restrictions: {
          throttled: false,
          degraded: false,
          shutdown: false
        }
      });
    });
  });

  describe('reverseControlAction', () => {
    it('should reverse active control action', async () => {
      const mockAction = {
        action_id: { S: 'action-1' },
        user_id: { S: 'user-123' },
        rule_id: { S: 'rule-1' },
        action_type: { S: 'throttle' },
        trigger: { S: '{}' },
        parameters: { S: '{}' },
        executed_at: { S: '2025-01-09T10:00:00Z' },
        status: { S: 'active' },
        impact: { S: '{}' }
      };

      mockDynamoClient.send
        .mockResolvedValueOnce({ Item: mockAction }) // GetItem
        .mockResolvedValueOnce({}); // UpdateItem

      await expect(reverseControlAction('action-1')).resolves.not.toThrow();

      expect(mockDynamoClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle reversal errors gracefully', async () => {
      mockDynamoClient.send.mockRejectedValue(new Error('DynamoDB error'));

      await expect(reverseControlAction('action-1')).rejects.toThrow('DynamoDB error');
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Cost Management Flow', () => {
    it('should track usage, detect threshold breach, and execute controls', async () => {
      // Mock successful operations
      mockDynamoClient.send.mockResolvedValue({});

      // 1. Track token usage
      const usage = {
        requestId: 'req-123',
        userId: 'user-123',
        operation: 'vc_analysis',
        modelId: 'claude-3-5-sonnet',
        inputTokens: 5000,
        outputTokens: 2500,
        totalTokens: 7500
      };

      const trackedUsage = await trackTokenUsage(usage);
      expect(trackedUsage.cost).toBeGreaterThan(0);

      // 2. Initialize auto control
      const autoConfig = await initializeAutoControl('user-123');
      expect(autoConfig.enabled).toBe(true);

      // 3. Create cost threshold
      const threshold = await createCostThreshold({
        userId: 'user-123',
        name: 'Test Threshold',
        amount: 1,
        period: 'day',
        type: 'absolute',
        actions: [{ type: 'throttle', target: 'system' }],
        enabled: true
      });
      expect(threshold.id).toBeDefined();

      // 4. Execute auto controls (simulating high cost)
      const actions = await executeAutoControls('user-123', 5, 'day');
      expect(actions).toBeDefined();

      // Verify all operations completed without errors
      expect(mockDynamoClient.send).toHaveBeenCalled();
    });
  });

  describe('Cost Analytics Integration', () => {
    it('should generate comprehensive cost insights', async () => {
      // Mock analytics data
      const mockAnalytics = {
        totalTokens: 100000,
        totalCost: 10,
        averageTokensPerRequest: 1000,
        averageCostPerRequest: 0.1,
        tokensByModel: { 'claude-3-5-sonnet': 100000 },
        costsByModel: { 'claude-3-5-sonnet': 10 },
        tokensByOperation: { 'vc_analysis': 100000 },
        costsByOperation: { 'vc_analysis': 10 },
        dailyTrend: [
          { date: '2025-01-09', cost: 10, tokens: 100000 }
        ],
        efficiency: {
          cacheHitRate: 0.3,
          inputOutputRatio: 2.0,
          costPerToken: 0.0001
        }
      };

      // Mock dependencies
      jest.doMock('../token-usage-tracker', () => ({
        getTokenAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
        generateOptimizationRecommendations: jest.fn().mockResolvedValue([])
      }));

      jest.doMock('../cost-control-system', () => ({
        getCostUsage: jest.fn().mockResolvedValue([
          { totalCost: 10, period: '2025-01-09' }
        ])
      }));

      // Generate business intelligence
      const bi = await generateBusinessIntelligence('user-123');
      expect(bi.summary.totalCost).toBe(10);
      expect(bi.breakdown.byModel).toHaveLength(1);

      // Generate optimization insights
      const insights = await generateCostOptimizationInsights('user-123');
      expect(insights).toBeDefined();

      // Analyze usage patterns
      const patterns = await analyzeUsagePatterns('user-123');
      expect(patterns.userId).toBe('user-123');
    });
  });
});