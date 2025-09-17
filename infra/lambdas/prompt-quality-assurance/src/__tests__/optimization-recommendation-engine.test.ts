import { jest } from '@jest/globals';
import { OptimizationRecommendationEngine } from '../optimization-recommendation-engine';
import { AuditTrailManager } from '../audit-trail-manager';
import { mockQualityMetrics } from './setup';

// Mock AuditTrailManager
const mockGetAuditTrail = jest.fn();
const mockAuditTrailManager = {
  getAuditTrail: mockGetAuditTrail
} as unknown as AuditTrailManager;

describe('OptimizationRecommendationEngine', () => {
  let optimizationEngine: OptimizationRecommendationEngine;

  beforeEach(() => {
    optimizationEngine = new OptimizationRecommendationEngine(mockAuditTrailManager, 5, 0.7);
    jest.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on audit data', async () => {
      const mockAuditRecords = [
        {
          id: 'audit-1',
          templateId: 'template-123',
          qualityMetrics: { ...mockQualityMetrics, overallScore: 0.6 }, // Low quality
          performanceMetrics: { responseTime: 3000, tokenEfficiency: 0.4, costPerToken: 0.0001 },
          userFeedback: { rating: 3, feedback: 'Could be better' }
        },
        {
          id: 'audit-2',
          templateId: 'template-123',
          qualityMetrics: { ...mockQualityMetrics, overallScore: 0.5 }, // Low quality
          performanceMetrics: { responseTime: 4000, tokenEfficiency: 0.3, costPerToken: 0.00012 },
          userFeedback: { rating: 2, feedback: 'Not helpful' }
        },
        {
          id: 'audit-3',
          templateId: 'template-123',
          qualityMetrics: { ...mockQualityMetrics, overallScore: 0.55 },
          performanceMetrics: { responseTime: 3500, tokenEfficiency: 0.35, costPerToken: 0.00011 },
          userFeedback: { rating: 3, feedback: 'Average response' }
        },
        {
          id: 'audit-4',
          templateId: 'template-123',
          qualityMetrics: { ...mockQualityMetrics, overallScore: 0.65 },
          performanceMetrics: { responseTime: 2500, tokenEfficiency: 0.45, costPerToken: 0.0001 },
          userFeedback: { rating: 4, feedback: 'Good but could improve' }
        },
        {
          id: 'audit-5',
          templateId: 'template-123',
          qualityMetrics: { ...mockQualityMetrics, overallScore: 0.58 },
          performanceMetrics: { responseTime: 3200, tokenEfficiency: 0.38, costPerToken: 0.00011 },
          userFeedback: { rating: 3, feedback: 'Okay response' }
        }
      ];

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const request = {
        templateId: 'template-123',
        timeRange: '30d',
        includeUserFeedback: true
      };

      const recommendations = await optimizationEngine.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have quality improvement recommendations due to low scores
      const qualityRecs = recommendations.filter(r => r.recommendationType === 'quality');
      expect(qualityRecs.length).toBeGreaterThan(0);
      
      // Should have user experience recommendations due to low satisfaction
      const uxRecs = recommendations.filter(r => r.recommendationType === 'user_experience');
      expect(uxRecs.length).toBeGreaterThan(0);
      
      // Recommendations should be sorted by priority and confidence
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const currentPriority = priorityOrder[current.priority];
        const nextPriority = priorityOrder[next.priority];
        
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
      }
    });

    it('should return insufficient data recommendation when not enough executions', async () => {
      const mockAuditRecords = [
        {
          id: 'audit-1',
          templateId: 'template-123',
          qualityMetrics: mockQualityMetrics,
          performanceMetrics: { responseTime: 2000, tokenEfficiency: 0.6, costPerToken: 0.0001 }
        }
      ]; // Only 1 record, less than minDataPoints (5)

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const request = {
        templateId: 'template-123'
      };

      const recommendations = await optimizationEngine.generateRecommendations(request);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Insufficient Data');
      expect(recommendations[0].priority).toBe('low');
    });

    it('should generate performance recommendations for slow responses', async () => {
      const mockAuditRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `audit-${i}`,
        templateId: 'template-123',
        qualityMetrics: mockQualityMetrics,
        performanceMetrics: { 
          responseTime: 8000, // Slow response time
          tokenEfficiency: 0.6, 
          costPerToken: 0.0001 
        }
      }));

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const recommendations = await optimizationEngine.generateRecommendations({
        templateId: 'template-123'
      });

      const performanceRecs = recommendations.filter(r => r.recommendationType === 'performance');
      expect(performanceRecs.length).toBeGreaterThan(0);
      
      const responseTimeRec = performanceRecs.find(r => r.title.includes('Response Time'));
      expect(responseTimeRec).toBeDefined();
      expect(responseTimeRec?.priority).toBe('high'); // Should be high priority for 8s response time
    });

    it('should generate cost optimization recommendations', async () => {
      const mockAuditRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `audit-${i}`,
        templateId: 'template-123',
        qualityMetrics: mockQualityMetrics,
        performanceMetrics: { 
          responseTime: 2000,
          tokenEfficiency: 0.2, // Low efficiency
          costPerToken: 0.0002 // High cost
        }
      }));

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const recommendations = await optimizationEngine.generateRecommendations({
        templateId: 'template-123'
      });

      const costRecs = recommendations.filter(r => r.recommendationType === 'cost');
      expect(costRecs.length).toBeGreaterThan(0);
      
      const costRec = costRecs[0];
      expect(costRec.expectedImpact.costReduction).toBeGreaterThan(0);
    });

    it('should handle error during recommendation generation', async () => {
      mockGetAuditTrail.mockRejectedValueOnce(new Error('Database error'));

      const request = {
        templateId: 'template-123'
      };

      await expect(optimizationEngine.generateRecommendations(request)).rejects.toThrow('Failed to generate recommendations');
    });
  });

  describe('trackRecommendationEffectiveness', () => {
    it('should track positive recommendation effectiveness', async () => {
      const beforeMetrics = { ...mockQualityMetrics, overallScore: 0.6, userSatisfactionScore: 0.6 };
      const afterMetrics = { ...mockQualityMetrics, overallScore: 0.8, userSatisfactionScore: 0.8 };

      const result = await optimizationEngine.trackRecommendationEffectiveness(
        'rec-123',
        beforeMetrics,
        afterMetrics
      );

      expect(result.effectiveness).toBeGreaterThan(0);
      expect(result.actualImpact.qualityImprovement).toBe(0.2);
      expect(result.actualImpact.userSatisfactionIncrease).toBe(0.2);
      expect(result.recommendation).toContain('highly effective');
    });

    it('should track negative recommendation effectiveness', async () => {
      const beforeMetrics = { ...mockQualityMetrics, overallScore: 0.8, userSatisfactionScore: 0.8 };
      const afterMetrics = { ...mockQualityMetrics, overallScore: 0.6, userSatisfactionScore: 0.6 };

      const result = await optimizationEngine.trackRecommendationEffectiveness(
        'rec-123',
        beforeMetrics,
        afterMetrics
      );

      expect(result.effectiveness).toBeLessThan(0);
      expect(result.actualImpact.qualityImprovement).toBe(-0.2);
      expect(result.recommendation).toContain('negative impact');
    });

    it('should handle moderate effectiveness', async () => {
      const beforeMetrics = { ...mockQualityMetrics, overallScore: 0.7, userSatisfactionScore: 0.7 };
      const afterMetrics = { ...mockQualityMetrics, overallScore: 0.75, userSatisfactionScore: 0.8 };

      const result = await optimizationEngine.trackRecommendationEffectiveness(
        'rec-123',
        beforeMetrics,
        afterMetrics
      );

      expect(result.effectiveness).toBeGreaterThan(0);
      expect(result.effectiveness).toBeLessThan(0.2);
      expect(result.recommendation).toContain('moderate improvement');
    });
  });

  describe('private analysis methods', () => {
    it('should calculate average quality metrics correctly', () => {
      const engine = optimizationEngine as any;
      
      const auditRecords = [
        { qualityMetrics: { relevanceScore: 0.8, coherenceScore: 0.7, completenessScore: 0.9, accuracyScore: 0.6, overallScore: 0.75, confidence: 0.8 } },
        { qualityMetrics: { relevanceScore: 0.6, coherenceScore: 0.8, completenessScore: 0.7, accuracyScore: 0.9, overallScore: 0.75, confidence: 0.7 } }
      ];
      
      const avgMetrics = engine.calculateAverageQualityMetrics(auditRecords);
      
      expect(avgMetrics.relevanceScore).toBe(0.7);
      expect(avgMetrics.coherenceScore).toBe(0.75);
      expect(avgMetrics.completenessScore).toBe(0.8);
      expect(avgMetrics.accuracyScore).toBe(0.75);
      expect(avgMetrics.overallScore).toBe(0.75);
      expect(avgMetrics.confidence).toBe(0.75);
    });

    it('should handle empty audit records', () => {
      const engine = optimizationEngine as any;
      
      const avgMetrics = engine.calculateAverageQualityMetrics([]);
      
      expect(avgMetrics.relevanceScore).toBe(0);
      expect(avgMetrics.coherenceScore).toBe(0);
      expect(avgMetrics.completenessScore).toBe(0);
      expect(avgMetrics.accuracyScore).toBe(0);
      expect(avgMetrics.overallScore).toBe(0);
      expect(avgMetrics.confidence).toBe(0);
    });

    it('should analyze common complaints from feedback', () => {
      const engine = optimizationEngine as any;
      
      const recordsWithFeedback = [
        { userFeedback: { feedback: 'The response was too long and verbose' } },
        { userFeedback: { feedback: 'Very lengthy explanation, hard to read' } },
        { userFeedback: { feedback: 'Too vague and not specific enough' } },
        { userFeedback: { feedback: 'Generic response, not helpful' } },
        { userFeedback: { feedback: 'The answer was confusing and unclear' } }
      ];
      
      const complaints = engine.analyzeCommonComplaints(recordsWithFeedback);
      
      expect(complaints).toContain('too long');
      expect(complaints).toContain('not specific');
      expect(complaints).toContain('not helpful');
      expect(complaints).toContain('confusing');
    });

    it('should convert time range to start date', () => {
      const engine = optimizationEngine as any;
      
      const startDate7d = engine.getStartDateFromRange('7d');
      const startDate30d = engine.getStartDateFromRange('30d');
      const startDate1w = engine.getStartDateFromRange('1w');
      const startDate1m = engine.getStartDateFromRange('1m');
      
      const now = new Date();
      const date7d = new Date(startDate7d);
      const date30d = new Date(startDate30d);
      
      expect(now.getTime() - date7d.getTime()).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -5);
      expect(now.getTime() - date30d.getTime()).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -5);
    });
  });

  describe('recommendation generation for specific issues', () => {
    it('should generate relevance improvement recommendations', async () => {
      const mockAuditRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `audit-${i}`,
        templateId: 'template-123',
        qualityMetrics: { 
          ...mockQualityMetrics, 
          relevanceScore: 0.5, // Low relevance
          overallScore: 0.6 
        },
        performanceMetrics: { responseTime: 2000, tokenEfficiency: 0.6, costPerToken: 0.0001 }
      }));

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const recommendations = await optimizationEngine.generateRecommendations({
        templateId: 'template-123'
      });

      const relevanceRec = recommendations.find(r => r.title.includes('Relevance'));
      expect(relevanceRec).toBeDefined();
      expect(relevanceRec?.priority).toBe('high');
      expect(relevanceRec?.suggestedChanges.promptModifications).toContain('Clarify the main objective in the prompt');
    });

    it('should generate coherence improvement recommendations', async () => {
      const mockAuditRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `audit-${i}`,
        templateId: 'template-123',
        qualityMetrics: { 
          ...mockQualityMetrics, 
          coherenceScore: 0.5, // Low coherence
          overallScore: 0.6 
        },
        performanceMetrics: { responseTime: 2000, tokenEfficiency: 0.6, costPerToken: 0.0001 }
      }));

      mockGetAuditTrail.mockResolvedValueOnce(mockAuditRecords);

      const recommendations = await optimizationEngine.generateRecommendations({
        templateId: 'template-123'
      });

      const coherenceRec = recommendations.find(r => r.title.includes('Coherence'));
      expect(coherenceRec).toBeDefined();
      expect(coherenceRec?.priority).toBe('medium');
      expect(coherenceRec?.suggestedChanges.parameterAdjustments?.temperature).toBe(0.4);
    });
  });
});