import { handler } from '../index';
import { TextAnalysisEngine } from '../text-analysis-engine';
import { ImageAnalysisEngine } from '../image-analysis-engine';
import { SWOTGenerationEngine } from '../swot-generation-engine';
import { VisualizationEngine } from '../visualization-engine';
import { TextAnalysisResult, ImageAnalysisResult } from '../types';
import {
  mockSWOTRequest,
  mockTextAnalysisResult,
  mockImageAnalysisResult,
  mockBedrockResponse,
  createMockEvent,
  createMockContext,
  setupMockAWSServices
} from './setup';

describe('Automated SWOT Engine', () => {
  let mockAWSServices: ReturnType<typeof setupMockAWSServices>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAWSServices = setupMockAWSServices();
  });

  describe('Lambda Handler', () => {
    test('should handle valid SWOT analysis request', async () => {
      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.requestId).toBeDefined();
      expect(body.businessId).toBe(mockSWOTRequest.businessId);
      expect(body.swotAnalysis).toBeDefined();
      expect(body.swotAnalysis.strengths).toBeInstanceOf(Array);
      expect(body.swotAnalysis.weaknesses).toBeInstanceOf(Array);
      expect(body.swotAnalysis.opportunities).toBeInstanceOf(Array);
      expect(body.swotAnalysis.threats).toBeInstanceOf(Array);
      expect(body.insights).toBeInstanceOf(Array);
      expect(body.actionRecommendations).toBeInstanceOf(Array);
      expect(body.visualizations).toBeInstanceOf(Array);
      expect(body.dataQuality).toBeDefined();
      expect(body.processingTime).toBeGreaterThan(0);
      expect(body.metadata).toBeDefined();
    });

    test('should handle request with no reviews or images', async () => {
      const requestWithoutData = {
        ...mockSWOTRequest,
        reviewTexts: [],
        images: []
      };

      const event = createMockEvent(requestWithoutData);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.swotAnalysis).toBeDefined();
      expect(body.metadata.textAnalysisCount).toBe(0);
      expect(body.metadata.imageAnalysisCount).toBe(0);
    });

    test('should return 400 for invalid request body', async () => {
      const invalidRequest = {
        businessId: 'test',
        // Missing required fields
      };

      const event = createMockEvent(invalidRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Validation error');
      expect(body.message).toContain('businessName is required');
    });

    test('should return 400 for malformed JSON', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/swot/analyze',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      } as any;

      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Invalid JSON');
    });

    test('should handle OPTIONS request for CORS', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/swot/analyze'
      } as any;

      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.body).toBe('');
    });

    test('should handle health check request', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/swot/health'
      } as any;

      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('automated-swot-engine');
      expect(body.capabilities).toBeDefined();
      expect(body.capabilities.textAnalysis).toBe(true);
      expect(body.capabilities.imageAnalysis).toBe(true);
      expect(body.capabilities.swotGeneration).toBe(true);
    });

    test('should return 404 for unknown routes', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/unknown/route'
      } as any;

      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(404);
      
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Route not found');
      expect(body.availableRoutes).toBeInstanceOf(Array);
    });
  });

  describe('Text Analysis Engine', () => {
    let textEngine: TextAnalysisEngine;
    let mockAWSServices: ReturnType<typeof setupMockAWSServices>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockAWSServices = setupMockAWSServices();
      textEngine = new TextAnalysisEngine();
    });

    test('should analyze review texts successfully', async () => {
      // Debug: Test mock directly
      const testCmd = { constructor: { name: 'DetectSentimentCommand' } };
      const mockResult = await mockAWSServices.mockComprehendSend(testCmd);
      console.log('Mock test result:', mockResult);

      const analysis = await textEngine.analyzeReviews(mockSWOTRequest.reviewTexts);

      expect(analysis.results.size).toBe(mockSWOTRequest.reviewTexts.length);
      expect(analysis.failedReviews).toBe(0);
      
      for (const [reviewId, result] of analysis.results) {
        expect(result.sentiment).toMatch(/^(positive|negative|neutral)$/);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(result.keyPhrases).toBeInstanceOf(Array);
        expect(result.entities).toBeInstanceOf(Array);
        expect(result.themes).toBeInstanceOf(Array);
      }
    });

    test('should handle empty review list', async () => {
      const analysis = await textEngine.analyzeReviews([]);

      expect(analysis.results.size).toBe(0);
      expect(analysis.failedReviews).toBe(0);
    });

    test('should aggregate analysis results correctly', async () => {
      const mockResults = new Map<string, TextAnalysisResult>([
        ['review-1', mockTextAnalysisResult],
        ['review-2', { ...mockTextAnalysisResult, sentiment: 'negative', confidence: 0.7 }]
      ]);

      const aggregated = textEngine.aggregateResults(mockResults);

      expect(aggregated.overallSentiment).toBeDefined();
      expect(aggregated.overallSentiment.positive).toBeGreaterThanOrEqual(0);
      expect(aggregated.overallSentiment.negative).toBeGreaterThanOrEqual(0);
      expect(aggregated.overallSentiment.neutral).toBeGreaterThanOrEqual(0);
      expect(aggregated.topThemes).toBeInstanceOf(Array);
      expect(aggregated.keyInsights).toBeInstanceOf(Array);
      expect(aggregated.commonPhrases).toBeInstanceOf(Array);
    });
  });

  describe('Image Analysis Engine', () => {
    let imageEngine: ImageAnalysisEngine;

    beforeEach(() => {
      imageEngine = new ImageAnalysisEngine();
    });

    test('should analyze images successfully', async () => {
      const analysis = await imageEngine.analyzeImages(mockSWOTRequest.images);

      expect(analysis.results.size).toBeGreaterThan(0);
      expect(analysis.failedImages).toBe(0);
      
      for (const [imageId, result] of analysis.results) {
        expect(result.labels).toBeInstanceOf(Array);
        expect(result.quality).toBeDefined();
        expect(result.quality.overall).toBeGreaterThanOrEqual(0);
        expect(result.quality.overall).toBeLessThanOrEqual(100);
        expect(result.content).toBeDefined();
        expect(typeof result.content.hasFood).toBe('boolean');
        expect(typeof result.content.hasInterior).toBe('boolean');
      }
    });

    test('should handle empty image list', async () => {
      const analysis = await imageEngine.analyzeImages([]);

      expect(analysis.results.size).toBe(0);
      expect(analysis.failedImages).toBe(0);
    });

    test('should aggregate image analysis results correctly', async () => {
      const mockResults = new Map<string, ImageAnalysisResult>([
        ['image-1', mockImageAnalysisResult],
        ['image-2', { ...mockImageAnalysisResult, content: { ...mockImageAnalysisResult.content, hasInterior: true } }]
      ]);

      const aggregated = imageEngine.aggregateResults(mockResults);

      expect(aggregated.contentDistribution).toBeDefined();
      expect(aggregated.averageQuality).toBeDefined();
      expect(aggregated.averageQuality.overall).toBeGreaterThanOrEqual(0);
      expect(aggregated.averageQuality.overall).toBeLessThanOrEqual(100);
      expect(aggregated.emotionalTone).toBeDefined();
      expect(aggregated.keyInsights).toBeInstanceOf(Array);
      expect(aggregated.qualityIssues).toBeInstanceOf(Array);
    });
  });

  describe('SWOT Generation Engine', () => {
    let swotEngine: SWOTGenerationEngine;

    beforeEach(() => {
      swotEngine = new SWOTGenerationEngine();
    });

    test('should generate comprehensive SWOT analysis', async () => {
      const textResults = new Map([['review-1', mockTextAnalysisResult]]);
      const imageResults = new Map([['image-1', mockImageAnalysisResult]]);

      const result = await swotEngine.generateSWOTAnalysis(
        mockSWOTRequest,
        textResults,
        imageResults,
        0, // failedReviews
        0  // failedImages
      );

      expect(result.requestId).toBeDefined();
      expect(result.businessId).toBe(mockSWOTRequest.businessId);
      expect(result.analysisDate).toBeDefined();
      
      expect(result.swotAnalysis.strengths).toBeInstanceOf(Array);
      expect(result.swotAnalysis.weaknesses).toBeInstanceOf(Array);
      expect(result.swotAnalysis.opportunities).toBeInstanceOf(Array);
      expect(result.swotAnalysis.threats).toBeInstanceOf(Array);

      // Validate SWOT items structure
      const allItems = [
        ...result.swotAnalysis.strengths,
        ...result.swotAnalysis.weaknesses,
        ...result.swotAnalysis.opportunities,
        ...result.swotAnalysis.threats
      ];

      for (const item of allItems) {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.confidence).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high']).toContain(item.impact);
        expect(item.evidence).toBeInstanceOf(Array);
      }

      expect(result.insights).toBeInstanceOf(Array);
      expect(result.actionRecommendations).toBeInstanceOf(Array);
      expect(result.visualizations).toBeInstanceOf(Array);
      expect(result.dataQuality).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle analysis with no data', async () => {
      const emptyTextResults = new Map();
      const emptyImageResults = new Map();

      const result = await swotEngine.generateSWOTAnalysis(
        { ...mockSWOTRequest, reviewTexts: [], images: [] },
        emptyTextResults,
        emptyImageResults,
        0, // failedReviews
        0  // failedImages
      );

      expect(result.swotAnalysis).toBeDefined();
      expect(result.dataQuality.reviewCoverage).toBe(0);
      expect(result.dataQuality.imageCoverage).toBe(0);
    });
  });

  describe('Visualization Engine', () => {
    let vizEngine: VisualizationEngine;

    beforeEach(() => {
      vizEngine = new VisualizationEngine();
    });

    test('should generate contract-compliant visualizations', async () => {
      const mockSWOTResult = {
        requestId: 'test-request',
        businessId: 'test-business',
        analysisDate: new Date().toISOString(),
        swotAnalysis: {
          strengths: [{
            id: 'strength-1',
            category: 'operational' as const,
            title: 'Test Strength',
            description: 'Test description',
            confidence: 0.8,
            impact: 'high' as const,
            evidence: []
          }],
          weaknesses: [],
          opportunities: [],
          threats: []
        },
        insights: [],
        actionRecommendations: [],
        visualizations: [],
        dataQuality: {
          reviewCoverage: 1,
          imageCoverage: 1,
          dataFreshness: 1,
          sentimentAccuracy: 0.8,
          overallQuality: 0.9,
          limitations: [],
          recommendations: []
        },
        processingTime: 1000
      };

      const visualizations = vizEngine.generateVisualizations(mockSWOTResult);

      // Contract Guard: Ensure no vendor-specific props leak into config
      for (const viz of visualizations) {
        expect(viz.config).toBeDefined();
        
        // Domain-neutral config properties are allowed
        const allowedConfigProps = ['width', 'height', 'colors', 'interactive', 'responsive', 'exportable', 'tooltip', 'legend'];
        const configKeys = Object.keys(viz.config);
        
        for (const key of configKeys) {
          expect(allowedConfigProps).toContain(key);
        }
        
        // Vendor-specific props should be in vendorConfig if present
        if (viz.vendorConfig) {
          expect(viz.vendorConfig.library).toBeDefined();
          expect(['chartjs', 'echarts', 'recharts', 'custom']).toContain(viz.vendorConfig.library);
        }
      }
    });

    test('should generate comprehensive visualizations', async () => {
      const mockSWOTResult = {
        requestId: 'test-request',
        businessId: 'test-business',
        analysisDate: new Date().toISOString(),
        swotAnalysis: {
          strengths: [{
            id: 'strength-1',
            category: 'operational' as const,
            title: 'Test Strength',
            description: 'Test description',
            confidence: 0.8,
            impact: 'high' as const,
            evidence: []
          }],
          weaknesses: [],
          opportunities: [],
          threats: []
        },
        insights: [],
        actionRecommendations: [],
        visualizations: [],
        dataQuality: {
          reviewCoverage: 1,
          imageCoverage: 1,
          dataFreshness: 1,
          sentimentAccuracy: 0.8,
          overallQuality: 0.9,
          limitations: [],
          recommendations: []
        },
        processingTime: 1000
      };

      const visualizations = vizEngine.generateVisualizations(mockSWOTResult);

      expect(visualizations).toBeInstanceOf(Array);
      expect(visualizations.length).toBeGreaterThan(0);

      for (const viz of visualizations) {
        expect(viz.type).toBeDefined();
        expect(viz.title).toBeDefined();
        expect(viz.description).toBeDefined();
        expect(viz.data).toBeDefined();
        expect(viz.config).toBeDefined();
      }

      // Check for specific visualization types
      const vizTypes = visualizations.map(v => v.type);
      expect(vizTypes).toContain('matrix');
      expect(vizTypes).toContain('chart');
    });

    test('should handle empty SWOT result', async () => {
      const emptySWOTResult = {
        requestId: 'test-request',
        businessId: 'test-business',
        analysisDate: new Date().toISOString(),
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: []
        },
        insights: [],
        actionRecommendations: [],
        visualizations: [],
        dataQuality: {
          reviewCoverage: 0,
          imageCoverage: 0,
          dataFreshness: 0,
          sentimentAccuracy: 0,
          overallQuality: 0,
          limitations: [],
          recommendations: []
        },
        processingTime: 100
      };

      const visualizations = vizEngine.generateVisualizations(emptySWOTResult);

      expect(visualizations).toBeInstanceOf(Array);
      // Should still generate some visualizations even with empty data
      expect(visualizations.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle Bedrock service errors gracefully', async () => {
      // Mock Bedrock to throw an error - override the command-based implementation
      mockAWSServices.mockBedrockSend.mockImplementationOnce(() => {
        return Promise.reject(new Error('Bedrock service unavailable'));
      });

      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['X-Degraded']).toBe('true');
      
      const body = JSON.parse(result.body);
      expect(body.metadata.usedFallback).toBe(true);
      expect(body.metadata.errorKinds).toContain('bedrock');
      expect(body.swotAnalysis).toBeDefined();
      expect(body.processingTime).toBeDefined();
    });

    test('should handle Comprehend service errors gracefully', async () => {
      // Mock Comprehend to throw an error - override the command-based implementation
      mockAWSServices.mockComprehendSend.mockImplementationOnce(() => {
        return Promise.reject(new Error('Comprehend service unavailable'));
      });

      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      // Should still complete analysis with fallback mechanisms
      expect(result.statusCode).toBe(200);
    });

    test('should handle image download failures gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      // Should still complete analysis with partial success
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      // Bei 2 Bildern und 1 Fehler sollte imageAnalysisCount = 1 sein
      expect(body.metadata.imageAnalysisCount).toBe(1);
      expect(body.metadata.failedImages).toBeGreaterThanOrEqual(1);
      expect(body.dataQuality.imageCoverage).toBeGreaterThan(0);
      expect(body.dataQuality.imageCoverage).toBeLessThan(1);
    });
  });

  describe('Performance and Limits', () => {
    test('should reject requests with too many reviews', async () => {
      const largeRequest = {
        ...mockSWOTRequest,
        reviewTexts: Array(1001).fill(mockSWOTRequest.reviewTexts[0]).map((review, index) => ({
          ...review,
          id: `review-${index}`
        }))
      };

      const event = createMockEvent(largeRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Maximum 1000 reviews allowed');
    });

    test('should reject requests with too many images', async () => {
      const largeRequest = {
        ...mockSWOTRequest,
        images: Array(101).fill(mockSWOTRequest.images[0]).map((image, index) => ({
          ...image,
          id: `image-${index}`
        }))
      };

      const event = createMockEvent(largeRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('Maximum 100 images allowed');
    });

    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);
      
      const endTime = Date.now();
      const actualTime = endTime - startTime;

      expect(result.statusCode).toBe(200);
      expect(actualTime).toBeLessThan(10000); // Should complete within 10 seconds in test environment
      
      const body = JSON.parse(result.body);
      expect(body.processingTime).toBeGreaterThan(0);
      expect(body.processingTime).toBeLessThan(actualTime + 1000); // Allow some margin
    });
  });

  describe('Data Quality Assessment', () => {
    test('should provide accurate data quality metrics', async () => {
      const event = createMockEvent(mockSWOTRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      const dataQuality = body.dataQuality;

      expect(dataQuality.reviewCoverage).toBeGreaterThanOrEqual(0);
      expect(dataQuality.reviewCoverage).toBeLessThanOrEqual(1);
      expect(dataQuality.imageCoverage).toBeGreaterThanOrEqual(0);
      expect(dataQuality.imageCoverage).toBeLessThanOrEqual(1);
      expect(dataQuality.dataFreshness).toBeGreaterThanOrEqual(0);
      expect(dataQuality.dataFreshness).toBeLessThanOrEqual(1);
      expect(dataQuality.sentimentAccuracy).toBeGreaterThanOrEqual(0);
      expect(dataQuality.sentimentAccuracy).toBeLessThanOrEqual(1);
      expect(dataQuality.overallQuality).toBeGreaterThanOrEqual(0);
      expect(dataQuality.overallQuality).toBeLessThanOrEqual(1);
      expect(dataQuality.limitations).toBeInstanceOf(Array);
      expect(dataQuality.recommendations).toBeInstanceOf(Array);
    });

    test('should identify data quality issues', async () => {
      const lowQualityRequest = {
        ...mockSWOTRequest,
        reviewTexts: [
          {
            ...mockSWOTRequest.reviewTexts[0],
            date: '2020-01-01T00:00:00Z' // Very old review
          }
        ]
      };

      const event = createMockEvent(lowQualityRequest);
      const context = createMockContext();

      const result = await handler(event, context);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      const dataQuality = body.dataQuality;

      expect(dataQuality.dataFreshness).toBeLessThan(0.5);
      expect(dataQuality.limitations.length).toBeGreaterThan(0);
      expect(dataQuality.recommendations.length).toBeGreaterThan(0);
    });
  });
});