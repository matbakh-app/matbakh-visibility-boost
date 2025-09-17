/**
 * AB Testing Manager Test Suite
 * 
 * This test suite validates A/B testing functionality including test creation,
 * variant selection, performance tracking, and statistical analysis.
 */

import { jest } from '@jest/globals';
/**
 * @jest-environment node
 */

import { ABTestingManager } from '../ab-testing-manager';
import { PerformanceTrackingManager } from '../performance-tracking-manager';

// Mock dependencies
jest.mock('../performance-tracking-manager');

// Helper function (robust for lib-dynamodb Command wrappers)
const expectMockCalledWithPattern = (mockFn: jest.MockedFunction<any>, pattern: any) => {
  const calls = mockFn.mock.calls;
  const matchingCall = calls.find((args: any[]) => {
    const arg = args?.[0];
    const payload = (arg && typeof arg === 'object' && 'input' in arg) ? (arg as any).input : arg;
    if (!payload || typeof payload !== 'object') return false;

    return Object.entries(pattern).every(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (!payload[k] || typeof payload[k] !== 'object') return false;
        return Object.entries(v).every(([nk, nv]) => JSON.stringify(payload[k][nk]) === JSON.stringify(nv));
      }
      return JSON.stringify(payload[k]) === JSON.stringify(v);
    });
  });

  expect(matchingCall).toBeDefined();
  return matchingCall;
};

// Import context factory
import { contextFactory } from './context-factory';
const { 
  createMockABTest, 
  createMockVersion, 
  createMockExecution, 
  validateABTestStructure 
} = contextFactory;

// DynamoDB response helpers
const createMockDynamoResponse = <T>(item: T) => ({ Item: item });
const createMockDynamoListResponse = <T>(items: T[]) => ({ Items: items });
const createMockDynamoNullResponse = () => ({ Item: null });
const createMockDynamoEmptyResponse = () => ({});

// Helper function is now provided globally from shared/setup.ts

describe('ABTestingManager', () => {
  let manager: ABTestingManager;
  let mockPerformanceManager: jest.Mocked<PerformanceTrackingManager>;

  beforeEach(() => {
    mockPerformanceManager = new PerformanceTrackingManager() as jest.Mocked<PerformanceTrackingManager>;
    
    // Use the new constructor with mocked dependencies
    manager = new ABTestingManager({
      performanceManager: mockPerformanceManager,
      tableName: 'test-ab-tests'
    });
  });

  describe('createABTest', () => {
    it('should create a new A/B test with realistic configuration', async () => {
      const testConfigData = createMockABTest({
        name: 'Template Performance Test',
        description: 'Testing response time improvements with realistic data',
        variants: [
          {
            id: 'control',
            name: 'Control Template',
            templateVersionId: createMockVersion().id,
            trafficPercentage: 50,
            description: 'Original template with baseline performance'
          },
          {
            id: 'variant-a',
            name: 'Optimized Template',
            templateVersionId: createMockVersion().id,
            trafficPercentage: 50,
            description: 'Optimized template with improved prompts'
          }
        ],
        trafficSplit: {
          'control': 50,
          'variant-a': 50
        },
        hypothesis: 'Optimized template will reduce response time by 20% while maintaining quality'
      });
      
      // Remove id for createABTest call (it generates its own)
      const { id, status, results, ...testConfig } = testConfigData;

      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.createABTest(testConfig);

      console.log('DEBUG: result =', JSON.stringify(result, null, 2));
      console.log('DEBUG: result.id =', result.id);

      expect(result).toMatchObject({
        name: testConfig.name,
        status: 'draft',
        variants: testConfig.variants,
        trafficSplit: testConfig.trafficSplit,
        hypothesis: testConfig.hypothesis
      });
      expect(result.id).toBeValidUUID();
      expect(result.name).toBe(testConfig.name);
      expect(result.variants).toHaveLength(2);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should validate traffic split consistency', async () => {
      const testConfigData = createMockABTest({
        name: 'Invalid Traffic Split Test',
        variants: [
          {
            id: 'control',
            name: 'Control',
            templateVersionId: createMockVersion().id,
            trafficPercentage: 50,
            description: 'Original template'
          }
        ],
        trafficSplit: {
          'control': 60 // Inconsistent with variant percentage
        }
      });
      
      const { id, status, results, ...testConfig } = testConfigData;

      await expect(manager.createABTest(testConfig)).rejects.toThrow(
        'Traffic split must add up to 100%'
      );
    });

    it('should validate all variants are included in traffic split', async () => {
      const testConfigData = createMockABTest({
        name: 'Missing Variant Test',
        variants: [
          {
            id: 'control',
            name: 'Control',
            templateVersionId: createMockVersion().id,
            trafficPercentage: 50,
            description: 'Original template'
          },
          {
            id: 'variant-a',
            name: 'Variant A',
            templateVersionId: createMockVersion().id,
            trafficPercentage: 50,
            description: 'Test variant'
          }
        ],
        trafficSplit: {
          'control': 100 // Missing variant-a in traffic split
        }
      });
      
      const { id, status, results, ...testConfig } = testConfigData;

      await expect(manager.createABTest(testConfig)).rejects.toThrow(
        'Variant variant-a not found in traffic split'
      );
    });
  });

  describe('startABTest', () => {
    it('should transition draft test to running status', async () => {
      const mockTest = createMockABTest({
        status: 'draft',
        startDate: new Date().toISOString()
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.startABTest(mockTest.id);

      expect(result.status).toBe('running');
      expect(result.startDate).toBeValidTimestamp();
      expectMockCalledWithPattern(mockSend, {
        Key: { id: mockTest.id }
      });
    });

    it('should validate test status before starting', async () => {
      const mockTest = createMockABTest({
        status: 'running' // Already running
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));

      await expect(manager.startABTest(mockTest.id)).rejects.toThrow(
        `A/B test ${mockTest.id} is not in draft status`
      );
    });

    it('should handle test not found scenario', async () => {
      const testId = 'nonexistent-test';
      
      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      await expect(manager.startABTest(testId)).rejects.toThrow();
    });
  });

  describe('selectVariant', () => {
    it('should select variant based on traffic distribution', async () => {
      const mockTest = createMockABTest({
        status: 'running',
        trafficSplit: {
          'control': 70,
          'variant-a': 30
        }
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));

      // Mock Math.random to return 0.5 (should select control with 70% traffic)
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5) as any;

      const result = await manager.selectVariant(mockTest.id);

      expect(result).toBe('control');
      expect(mockSend).toHaveBeenCalledTimes(1);

      Math.random = originalRandom;
    });

    it('should provide consistent variant assignment for same user', async () => {
      const userId = 'consistent-user-123';
      const mockTest = createMockABTest({
        status: 'running',
        trafficSplit: {
          'control': 50,
          'variant-a': 50
        }
      });

      // Mock multiple calls with same test data
      mockSend.mockResolvedValue(createMockDynamoResponse(mockTest));

      const result1 = await manager.selectVariant(mockTest.id, userId);
      const result2 = await manager.selectVariant(mockTest.id, userId);
      const result3 = await manager.selectVariant(mockTest.id, userId);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(['control', 'variant-a']).toContain(result1);
    });

    it('should handle inactive test gracefully', async () => {
      const mockTest = createMockABTest({
        status: 'completed'
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));

      const result = await manager.selectVariant(mockTest.id);

      expect(result).toBeNull();
    });

    it('should handle test not found scenario', async () => {
      const testId = 'nonexistent-test';
      
      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      const result = await manager.selectVariant(testId);

      expect(result).toBeNull();
    });
  });

  describe('stopABTest', () => {
    it('should complete running test and calculate comprehensive results', async () => {
      const testId = '00000000-0000-4000-8000-000000000001';
      const mockTest = createMockABTest({
        id: testId,
        status: 'running',
        startDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        variants: [
          {
            id: 'control',
            name: 'Control',
            templateVersionId: createMockVersion().id
          },
          {
            id: 'variant-a',
            name: 'Variant A',
            templateVersionId: createMockVersion().id
          }
        ]
      });

      const mockExecutions = [
        createMockExecution({
          abTestVariant: 'control',
          status: 'success',
          responseTime: 1000
        }),
        createMockExecution({
          abTestVariant: 'variant-a',
          status: 'success',
          responseTime: 800
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));
      mockPerformanceManager.getExecutionHistory.mockResolvedValueOnce(mockExecutions);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.stopABTest(testId);

      expect(result.status).toBe('completed');
      expect(result.results).toBeDefined();
      expect(result.endDate).toBeValidTimestamp();
      expect(result.results?.variantResults).toHaveLength(2);
      expect(result.results?.statisticalSignificance).toBeDefined();
    });

    it('should handle test with no execution data', async () => {
      const testId = '00000000-0000-4000-8000-000000000002';
      const mockTest = createMockABTest({
        id: testId,
        status: 'running'
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));
      mockPerformanceManager.getExecutionHistory.mockResolvedValueOnce([]);
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.stopABTest(testId);

      expect(result.status).toBe('completed');
      expect(result.results?.totalParticipants).toBe(0);
    });
  });

  describe('getABTestResults', () => {
    it('should return cached results for completed test', async () => {
      const mockResults = {
        testId: 'completed-test',
        status: 'completed' as const,
        duration: 86400000,
        totalParticipants: 100,
        variantResults: [
          {
            variantId: 'control',
            participants: 50,
            successRate: 95,
            averageResponseTime: 1000,
            conversionRate: 85
          },
          {
            variantId: 'variant-a',
            participants: 50,
            successRate: 97,
            averageResponseTime: 800,
            conversionRate: 90
          }
        ],
        confidenceLevel: 95,
        statisticalSignificance: true,
        recommendations: ['Variant A shows significant improvement']
      };

      const mockTest = createMockABTest({
        status: 'completed',
        results: mockResults
      });

      mockSend.mockResolvedValueOnce(createMockDynamoResponse(mockTest));

      const result = await manager.getABTestResults(mockTest.id);

      expect(result).toEqual(mockResults);
      expect(result?.variantResults).toHaveLength(2);
      expect(result?.statisticalSignificance).toBe(true);
    });

    it('should calculate real-time results for running test', async () => {
      const mockTest = createMockABTest({
        status: 'running',
        startDate: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      });

      const mockExecutions = [
        createMockExecution({ abTestVariant: 'control', status: 'success' }),
        createMockExecution({ abTestVariant: 'variant-a', status: 'success' })
      ];

      mockSend.mockResolvedValue(createMockDynamoResponse(mockTest));
      mockPerformanceManager.getExecutionHistory.mockResolvedValue(mockExecutions);

      const result = await manager.getABTestResults(mockTest.id);

      expect(result).toBeDefined();
      expect(result!.status).toBe('running');
      expect(result!.testId).toBe(mockTest.id);
      expect(result!.totalParticipants).toBe(2);
    });

    it('should handle test not found scenario', async () => {
      const testId = 'nonexistent-test';
      
      mockSend.mockResolvedValueOnce(createMockDynamoNullResponse());

      const result = await manager.getABTestResults(testId);

      expect(result).toBeNull();
    });
  });

  describe('getActiveABTests', () => {
    it('should return all running A/B tests with proper filtering', async () => {
      const mockTests = [
        createMockABTest({
          name: 'Performance Test 1',
          status: 'running'
        }),
        createMockABTest({
          name: 'Quality Test 2',
          status: 'running'
        })
      ];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockTests));

      const result = await manager.getActiveABTests();

      expect(result).toHaveLength(2);
      expect(result.every(test => test.status === 'running')).toBe(true);
      expectMockCalledWithPattern(mockSend, {
        IndexName: 'status-index'
      });
    });

    it('should handle empty result set', async () => {
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([]));

      const result = await manager.getActiveABTests();

      expect(result).toHaveLength(0);
    });

    it('should validate test structure in results', async () => {
      const mockTests = [createMockABTest({ status: 'running' })];

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse(mockTests));

      const result = await manager.getActiveABTests();

      expect(result).toHaveLength(1);
      validateABTestStructure(result[0]);
    });
  });
});