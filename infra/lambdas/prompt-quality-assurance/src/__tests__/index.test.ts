import { jest } from '@jest/globals';
import { handler, optionsHandler } from '../index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock all the manager classes
jest.mock('../audit-trail-manager');
jest.mock('../quality-scoring-engine');
jest.mock('../optimization-recommendation-engine');
jest.mock('../automated-testing-framework');

const mockAuditTrailManager = {
  createAuditRecord: jest.fn(),
  getAuditTrail: jest.fn(),
  getAuditRecord: jest.fn(),
  getTemplateAuditStats: jest.fn(),
  addUserFeedback: jest.fn()
};

const mockQualityScoringEngine = {
  analyzeQuality: jest.fn(),
  batchAnalyzeQuality: jest.fn(),
  incorporateUserFeedback: jest.fn(),
  getQualityBenchmarks: jest.fn()
};

const mockOptimizationEngine = {
  generateRecommendations: jest.fn(),
  trackRecommendationEffectiveness: jest.fn()
};

const mockTestingFramework = {
  createTestCase: jest.fn(),
  runTestSuite: jest.fn(),
  createValidationFramework: jest.fn(),
  validateOutput: jest.fn(),
  runRegressionTests: jest.fn(),
  generatePerformanceBenchmarks: jest.fn()
};

// Mock the imports
jest.doMock('../audit-trail-manager', () => ({
  AuditTrailManager: jest.fn().mockImplementation(() => mockAuditTrailManager)
}));

jest.doMock('../quality-scoring-engine', () => ({
  QualityScoringEngine: jest.fn().mockImplementation(() => mockQualityScoringEngine)
}));

jest.doMock('../optimization-recommendation-engine', () => ({
  OptimizationRecommendationEngine: jest.fn().mockImplementation(() => mockOptimizationEngine)
}));

jest.doMock('../automated-testing-framework', () => ({
  AutomatedTestingFramework: jest.fn().mockImplementation(() => mockTestingFramework)
}));

describe('Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (
    httpMethod: string,
    path: string,
    body?: any,
    queryStringParameters?: Record<string, string>
  ): APIGatewayProxyEvent => ({
    httpMethod,
    path,
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
    headers: {},
    multiValueHeaders: {},
    pathParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    isBase64Encoded: false
  });

  describe('POST requests', () => {
    it('should handle audit record creation', async () => {
      const mockAuditRecord = {
        id: 'audit-123',
        executionId: 'exec-123',
        templateId: 'template-456'
      };

      mockAuditTrailManager.createAuditRecord.mockResolvedValueOnce(mockAuditRecord);

      const event = createMockEvent('POST', '/audit/create', {
        execution: {
          id: 'exec-123',
          templateId: 'template-456',
          templateVersion: '1.0',
          prompt: 'Test prompt',
          output: 'Test output',
          timestamp: '2025-01-09T10:00:00Z',
          executionTime: 2000,
          tokenUsage: { input: 100, output: 200, total: 300 },
          metadata: {}
        }
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockAuditTrailManager.createAuditRecord).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockAuditRecord);
    });

    it('should handle quality analysis', async () => {
      const mockQualityMetrics = {
        relevanceScore: 0.8,
        coherenceScore: 0.85,
        completenessScore: 0.75,
        accuracyScore: 0.9,
        overallScore: 0.825,
        confidence: 0.8
      };

      mockQualityScoringEngine.analyzeQuality.mockResolvedValueOnce(mockQualityMetrics);

      const event = createMockEvent('POST', '/quality/analyze', {
        prompt: 'Analyze this restaurant',
        output: 'The restaurant has good visibility',
        contextData: { businessType: 'restaurant' }
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockQualityScoringEngine.analyzeQuality).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockQualityMetrics);
    });

    it('should handle recommendation generation', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          templateId: 'template-123',
          recommendationType: 'quality',
          priority: 'high',
          title: 'Improve Quality',
          description: 'Quality needs improvement'
        }
      ];

      mockOptimizationEngine.generateRecommendations.mockResolvedValueOnce(mockRecommendations);

      const event = createMockEvent('POST', '/recommendations/generate', {
        templateId: 'template-123',
        timeRange: '30d'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockOptimizationEngine.generateRecommendations).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockRecommendations);
    });

    it('should handle test suite execution', async () => {
      const mockTestResults = {
        summary: {
          totalTests: 5,
          passed: 4,
          failed: 1,
          warnings: 0,
          executionTime: 15000
        },
        results: [],
        recommendations: ['Improve test coverage']
      };

      mockTestingFramework.runTestSuite.mockResolvedValueOnce(mockTestResults);

      const event = createMockEvent('POST', '/testing/run-suite', {
        templateId: 'template-123',
        testType: 'functional'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockTestingFramework.runTestSuite).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockTestResults);
    });
  });

  describe('GET requests', () => {
    it('should handle audit trail retrieval', async () => {
      const mockAuditRecords = [
        { id: 'audit-1', templateId: 'template-123' },
        { id: 'audit-2', templateId: 'template-123' }
      ];

      mockAuditTrailManager.getAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const event = createMockEvent('GET', '/audit/trail', null, {
        templateId: 'template-123',
        limit: '10'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockAuditTrailManager.getAuditTrail).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockAuditRecords);
    });

    it('should handle specific audit record retrieval', async () => {
      const mockAuditRecord = { id: 'audit-123', templateId: 'template-456' };

      mockAuditTrailManager.getAuditRecord.mockResolvedValueOnce(mockAuditRecord);

      const event = createMockEvent('GET', '/audit/record/audit-123');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockAuditTrailManager.getAuditRecord).toHaveBeenCalledWith('audit-123');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockAuditRecord);
    });

    it('should handle template audit stats', async () => {
      const mockStats = {
        totalExecutions: 100,
        averageQualityScore: 0.8,
        averageResponseTime: 2500,
        userSatisfactionRate: 0.85
      };

      mockAuditTrailManager.getTemplateAuditStats.mockResolvedValueOnce(mockStats);

      const event = createMockEvent('GET', '/audit/stats/template-123', null, {
        timeRange: '30d'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockAuditTrailManager.getTemplateAuditStats).toHaveBeenCalledWith('template-123', '30d');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockStats);
    });

    it('should handle quality benchmarks retrieval', async () => {
      const mockBenchmarks = {
        industry: { overallScore: 0.75 },
        template: { overallScore: 0.82 },
        topPerforming: { overallScore: 0.91 }
      };

      mockQualityScoringEngine.getQualityBenchmarks.mockResolvedValueOnce(mockBenchmarks);

      const event = createMockEvent('GET', '/quality/benchmarks/template-123', null, {
        timeRange: '30d'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockQualityScoringEngine.getQualityBenchmarks).toHaveBeenCalledWith('template-123', '30d');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockBenchmarks);
    });

    it('should handle health check', async () => {
      const event = createMockEvent('GET', '/health');

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.status).toBe('healthy');
      expect(responseBody.data.timestamp).toBeDefined();
    });
  });

  describe('PUT requests', () => {
    it('should handle user feedback addition', async () => {
      mockAuditTrailManager.addUserFeedback.mockResolvedValueOnce(undefined);

      const event = createMockEvent('PUT', '/audit/feedback/audit-123', {
        executionId: 'exec-123',
        userId: 'user-456',
        rating: 4,
        feedback: 'Good response',
        feedbackType: 'positive',
        timestamp: '2025-01-09T10:05:00Z',
        categories: ['helpful']
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockAuditTrailManager.addUserFeedback).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle missing request body for POST', async () => {
      const event = createMockEvent('POST', '/audit/create');

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Request body is required');
    });

    it('should handle invalid JSON in request body', async () => {
      const event = {
        ...createMockEvent('POST', '/audit/create'),
        body: 'invalid json'
      };

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
    });

    it('should handle unknown endpoint', async () => {
      const event = createMockEvent('POST', '/unknown/endpoint', {});

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Unknown endpoint');
    });

    it('should handle unsupported HTTP method', async () => {
      const event = createMockEvent('DELETE', '/audit/create', {});

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Unsupported HTTP method');
    });

    it('should handle service errors', async () => {
      mockAuditTrailManager.createAuditRecord.mockRejectedValueOnce(new Error('Service error'));

      const event = createMockEvent('POST', '/audit/create', {
        execution: {
          id: 'exec-123',
          templateId: 'template-456',
          templateVersion: '1.0',
          prompt: 'Test',
          output: 'Test',
          timestamp: '2025-01-09T10:00:00Z',
          executionTime: 2000,
          tokenUsage: { input: 100, output: 200, total: 300 },
          metadata: {}
        }
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Service error');
    });
  });

  describe('Response format', () => {
    it('should include proper CORS headers', async () => {
      const event = createMockEvent('GET', '/health');

      const result = await handler(event);

      expect(result.headers).toBeDefined();
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(result.headers!['Access-Control-Allow-Methods']).toContain('GET');
    });

    it('should include execution metadata', async () => {
      const event = createMockEvent('GET', '/health');

      const result = await handler(event);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.metadata).toBeDefined();
      expect(responseBody.metadata.executionTime).toBeGreaterThan(0);
      expect(responseBody.metadata.timestamp).toBeDefined();
      expect(responseBody.metadata.version).toBe('1.0.0');
    });
  });

  describe('OPTIONS handler', () => {
    it('should handle OPTIONS requests for CORS', async () => {
      const result = await optionsHandler();

      expect(result.statusCode).toBe(200);
      expect(result.headers).toBeDefined();
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Access-Control-Allow-Methods']).toContain('OPTIONS');
      expect(result.body).toBe('');
    });
  });

  describe('Complex operations', () => {
    it('should handle batch quality analysis', async () => {
      const mockBatchResults = [
        { overallScore: 0.8 },
        { overallScore: 0.75 },
        { overallScore: 0.9 }
      ];

      mockQualityScoringEngine.batchAnalyzeQuality.mockResolvedValueOnce(mockBatchResults);

      const event = createMockEvent('POST', '/quality/batch', {
        executions: [
          { id: 'exec-1', prompt: 'Test 1', output: 'Output 1' },
          { id: 'exec-2', prompt: 'Test 2', output: 'Output 2' },
          { id: 'exec-3', prompt: 'Test 3', output: 'Output 3' }
        ]
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockQualityScoringEngine.batchAnalyzeQuality).toHaveBeenCalledTimes(1);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockBatchResults);
    });

    it('should handle regression testing', async () => {
      const mockRegressionResults = {
        regressionDetected: false,
        qualityDelta: 0.05,
        performanceDelta: 0.1,
        failedTests: [],
        recommendations: ['Continue monitoring']
      };

      mockTestingFramework.runRegressionTests.mockResolvedValueOnce(mockRegressionResults);

      const event = createMockEvent('POST', '/testing/regression', {
        templateId: 'template-123',
        newVersion: 'v2.0',
        baselineVersion: 'v1.0'
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockTestingFramework.runRegressionTests).toHaveBeenCalledWith(
        'template-123',
        'v2.0',
        'v1.0'
      );
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockRegressionResults);
    });

    it('should handle recommendation effectiveness tracking', async () => {
      const mockEffectiveness = {
        effectiveness: 0.25,
        actualImpact: {
          qualityImprovement: 0.15,
          performanceGain: 0.1,
          userSatisfactionIncrease: 0.2
        },
        recommendation: 'Recommendation was highly effective'
      };

      mockOptimizationEngine.trackRecommendationEffectiveness.mockResolvedValueOnce(mockEffectiveness);

      const event = createMockEvent('POST', '/recommendations/effectiveness', {
        recommendationId: 'rec-123',
        beforeMetrics: { overallScore: 0.6 },
        afterMetrics: { overallScore: 0.8 }
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(mockOptimizationEngine.trackRecommendationEffectiveness).toHaveBeenCalledWith(
        'rec-123',
        { overallScore: 0.6 },
        { overallScore: 0.8 }
      );
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockEffectiveness);
    });
  });
});