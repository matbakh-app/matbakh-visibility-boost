import { jest } from '@jest/globals';
import { QualityScoringEngine } from '../quality-scoring-engine';
import { mockQualityMetrics, mockUserFeedback } from './setup';

// Mock the AWS SDK
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  InvokeModelCommand: jest.fn()
}));

describe('QualityScoringEngine', () => {
  let qualityScoringEngine: QualityScoringEngine;

  beforeEach(() => {
    qualityScoringEngine = new QualityScoringEngine('eu-central-1');
    jest.clearAllMocks();
  });

  describe('analyzeQuality', () => {
    it('should analyze quality using multiple scoring methods', async () => {
      // Mock Bedrock response
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              relevanceScore: 0.8,
              coherenceScore: 0.85,
              completenessScore: 0.75,
              accuracyScore: 0.9
            })
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockBedrockResponse);

      const request = {
        prompt: 'Analyze the visibility of this restaurant',
        output: 'The restaurant has good online presence with active social media and positive reviews.',
        contextData: { businessType: 'restaurant' }
      };

      const result = await qualityScoringEngine.analyzeQuality(request);

      expect(result).toBeDefined();
      expect(result.relevanceScore).toBeGreaterThan(0);
      expect(result.coherenceScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.accuracyScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should fallback to heuristic scoring when AI analysis fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Bedrock error'));

      const request = {
        prompt: 'Test prompt',
        output: 'Test output with restaurant and business keywords for better scoring'
      };

      const result = await qualityScoringEngine.analyzeQuality(request);

      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.8); // Heuristic scoring has lower confidence
    });

    it('should handle empty or invalid output', async () => {
      const request = {
        prompt: 'Test prompt',
        output: ''
      };

      const result = await qualityScoringEngine.analyzeQuality(request);

      expect(result.overallScore).toBeLessThan(0.5);
    });
  });

  describe('incorporateUserFeedback', () => {
    it('should adjust quality metrics based on user feedback', async () => {
      const currentMetrics = { ...mockQualityMetrics };
      const feedback = { ...mockUserFeedback, rating: 5 }; // Excellent rating

      const result = await qualityScoringEngine.incorporateUserFeedback(currentMetrics, feedback);

      expect(result.userSatisfactionScore).toBe(1.0); // 5/5 rating
      expect(result.confidence).toBeGreaterThan(currentMetrics.confidence);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should handle negative feedback appropriately', async () => {
      const currentMetrics = { ...mockQualityMetrics };
      const negativeFeedback = { ...mockUserFeedback, rating: 1 }; // Poor rating

      const result = await qualityScoringEngine.incorporateUserFeedback(currentMetrics, negativeFeedback);

      expect(result.userSatisfactionScore).toBe(0.2); // 1/5 rating
      expect(result.overallScore).toBeLessThan(currentMetrics.overallScore);
    });
  });

  describe('batchAnalyzeQuality', () => {
    it('should analyze multiple executions in batches', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          templateId: 'template-1',
          templateVersion: '1.0',
          prompt: 'Test prompt 1',
          output: 'Test output 1',
          timestamp: '2025-01-09T10:00:00Z',
          executionTime: 2000,
          tokenUsage: { input: 100, output: 200, total: 300 },
          metadata: {}
        },
        {
          id: 'exec-2',
          templateId: 'template-1',
          templateVersion: '1.0',
          prompt: 'Test prompt 2',
          output: 'Test output 2',
          timestamp: '2025-01-09T10:01:00Z',
          executionTime: 2500,
          tokenUsage: { input: 150, output: 250, total: 400 },
          metadata: {}
        }
      ];

      // Mock successful responses for both executions
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              relevanceScore: 0.8,
              coherenceScore: 0.8,
              completenessScore: 0.8,
              accuracyScore: 0.8
            })
          }]
        }))
      });

      const results = await qualityScoringEngine.batchAnalyzeQuality(mockExecutions);

      expect(results).toHaveLength(2);
      expect(results[0].overallScore).toBeGreaterThan(0);
      expect(results[1].overallScore).toBeGreaterThan(0);
    });

    it('should handle batch processing with rate limiting', async () => {
      const manyExecutions = Array.from({ length: 12 }, (_, i) => ({
        id: `exec-${i}`,
        templateId: 'template-1',
        templateVersion: '1.0',
        prompt: `Test prompt ${i}`,
        output: `Test output ${i}`,
        timestamp: '2025-01-09T10:00:00Z',
        executionTime: 2000,
        tokenUsage: { input: 100, output: 200, total: 300 },
        metadata: {}
      }));

      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              relevanceScore: 0.8,
              coherenceScore: 0.8,
              completenessScore: 0.8,
              accuracyScore: 0.8
            })
          }]
        }))
      });

      const startTime = Date.now();
      const results = await qualityScoringEngine.batchAnalyzeQuality(manyExecutions);
      const endTime = Date.now();

      expect(results).toHaveLength(12);
      expect(endTime - startTime).toBeGreaterThan(1000); // Should include delays for rate limiting
    });
  });

  describe('getQualityBenchmarks', () => {
    it('should return quality benchmarks for comparison', async () => {
      const benchmarks = await qualityScoringEngine.getQualityBenchmarks('template-123', '30d');

      expect(benchmarks).toBeDefined();
      expect(benchmarks.industry).toBeDefined();
      expect(benchmarks.template).toBeDefined();
      expect(benchmarks.topPerforming).toBeDefined();
      
      expect(benchmarks.industry.overallScore).toBeGreaterThan(0);
      expect(benchmarks.template.overallScore).toBeGreaterThan(0);
      expect(benchmarks.topPerforming.overallScore).toBeGreaterThan(0);
    });
  });

  describe('heuristic scoring methods', () => {
    it('should calculate coherence score based on sentence structure', () => {
      const engine = qualityScoringEngine as any;
      
      const coherentText = 'This is a well-structured response. It has multiple sentences. Each sentence is clear and concise.';
      const incoherentText = 'Short.';
      
      const coherentScore = engine.calculateCoherenceScore(coherentText);
      const incoherentScore = engine.calculateCoherenceScore(incoherentText);
      
      expect(coherentScore).toBeGreaterThan(incoherentScore);
      expect(coherentScore).toBeGreaterThan(0.3);
    });

    it('should calculate accuracy score based on content analysis', () => {
      const engine = qualityScoringEngine as any;
      
      const accurateText = 'The restaurant should improve its visibility by optimizing Google My Business profile with 123 reviews.';
      const inaccurateText = 'Random text without relevant content.';
      
      const accurateScore = engine.calculateAccuracyScore(accurateText);
      const inaccurateScore = engine.calculateAccuracyScore(inaccurateText);
      
      expect(accurateScore).toBeGreaterThan(inaccurateScore);
    });

    it('should detect proper structure in output', () => {
      const engine = qualityScoringEngine as any;
      
      const structuredText = '# Main Heading\n\n- Bullet point 1\n- Bullet point 2\n\n## Subheading\n\nParagraph text.';
      const unstructuredText = 'Just plain text without any structure or formatting.';
      
      const hasStructure1 = engine.hasProperStructure(structuredText);
      const hasStructure2 = engine.hasProperStructure(unstructuredText);
      
      expect(hasStructure1).toBe(true);
      expect(hasStructure2).toBe(false);
    });

    it('should detect actionable content', () => {
      const engine = qualityScoringEngine as any;
      
      const actionableText = 'You should implement these changes to improve your restaurant visibility.';
      const nonActionableText = 'This is just descriptive text without any recommendations.';
      
      const hasActionable1 = engine.hasActionableContent(actionableText);
      const hasActionable2 = engine.hasActionableContent(nonActionableText);
      
      expect(hasActionable1).toBe(true);
      expect(hasActionable2).toBe(false);
    });

    it('should validate appropriate length', () => {
      const engine = qualityScoringEngine as any;
      
      const appropriateText = 'This is a response with appropriate length that contains enough information to be useful but is not too verbose or overwhelming for the user to read and understand.';
      const tooShortText = 'Short.';
      const tooLongText = 'This is an extremely long response that goes on and on with unnecessary details and repetitive information that could overwhelm the user and make it difficult to extract the key insights and actionable recommendations that they are looking for in a concise and digestible format. ' + 'Lorem ipsum '.repeat(100);
      
      const appropriate = engine.hasAppropriateLength(appropriateText);
      const tooShort = engine.hasAppropriateLength(tooShortText);
      const tooLong = engine.hasAppropriateLength(tooLongText);
      
      expect(appropriate).toBe(true);
      expect(tooShort).toBe(false);
      expect(tooLong).toBe(false);
    });
  });

  describe('AI response parsing', () => {
    it('should parse valid AI quality response', () => {
      const engine = qualityScoringEngine as any;
      
      const validResponse = `
        Based on the analysis, here are the quality scores:
        {
          "relevanceScore": 0.85,
          "coherenceScore": 0.90,
          "completenessScore": 0.75,
          "accuracyScore": 0.80,
          "reasoning": "The response addresses the main points effectively."
        }
      `;
      
      const parsed = engine.parseAIQualityResponse(validResponse);
      
      expect(parsed.relevanceScore).toBe(0.85);
      expect(parsed.coherenceScore).toBe(0.90);
      expect(parsed.completenessScore).toBe(0.75);
      expect(parsed.accuracyScore).toBe(0.80);
    });

    it('should handle invalid AI response gracefully', () => {
      const engine = qualityScoringEngine as any;
      
      const invalidResponse = 'This is not a valid JSON response';
      
      const parsed = engine.parseAIQualityResponse(invalidResponse);
      
      expect(parsed.relevanceScore).toBe(0.5);
      expect(parsed.coherenceScore).toBe(0.5);
      expect(parsed.completenessScore).toBe(0.5);
      expect(parsed.accuracyScore).toBe(0.5);
      expect(parsed.confidence).toBe(0.3);
    });
  });
});