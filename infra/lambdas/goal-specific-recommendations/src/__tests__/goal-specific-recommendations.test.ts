import { handler } from '../index';
import { GoalProfileManager } from '../goal-profile-manager';
import { RecommendationGenerator } from '../recommendation-generator';
import { PriorityScoringEngine } from '../priority-scoring-engine';
import { ProgressTrackingManager } from '../progress-tracking-manager';
import { EffectivenessMeasurementEngine } from '../effectiveness-measurement-engine';

// Mock the managers
jest.mock('../goal-profile-manager');
jest.mock('../recommendation-generator');
jest.mock('../priority-scoring-engine');
jest.mock('../progress-tracking-manager');
jest.mock('../effectiveness-measurement-engine');

describe('Goal-Specific Recommendations Lambda', () => {
  const mockContext = {
    requestId: 'test-request-123',
    functionName: 'goal-specific-recommendations',
    functionVersion: '1',
    memoryLimitInMB: '512',
    remainingTimeInMillis: 30000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /recommendations', () => {
    it('should generate recommendations successfully', async () => {
      // Mock the managers
      const mockGoalProfile = global.createMockGoalProfile();
      const mockRecommendation = global.createMockRecommendation();
      const mockPrioritizedRecommendation = {
        recommendation: mockRecommendation,
        scoring: {
          impactScore: 85,
          effortScore: 75,
          urgencyScore: 80,
          feasibilityScore: 90,
          alignmentScore: 85,
          roiScore: 80,
          riskScore: 85,
          competitiveAdvantageScore: 75,
          overallScore: 82,
          reasoning: ['High impact potential', 'Low implementation effort']
        },
        rank: 1,
        percentile: 95,
        category: 'quick_win' as const,
        dependencies: [],
        alternatives: [],
        customizations: []
      };

      (GoalProfileManager.prototype.createGoalProfile as jest.Mock).mockReturnValue(mockGoalProfile);
      (RecommendationGenerator.prototype.generateRecommendations as jest.Mock).mockReturnValue([mockRecommendation]);
      (PriorityScoringEngine.prototype.scoreRecommendations as jest.Mock).mockReturnValue([mockPrioritizedRecommendation]);

      const event = {
        httpMethod: 'POST',
        path: '/recommendations',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify(global.createMockRecommendationRequest()),
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.requestId).toBeDefined();
      expect(responseBody.businessId).toBe('test-business-123');
      expect(responseBody.recommendations).toHaveLength(1);
      expect(responseBody.recommendations[0].rank).toBe(1);
      expect(responseBody.summary.totalRecommendations).toBe(1);
      expect(responseBody.summary.quickWins).toBe(1);
    });

    it('should handle invalid request body', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/recommendations',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify({ invalid: 'data' }),
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Validation Error');
    });

    it('should handle missing request body', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/recommendations',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Bad Request');
      expect(responseBody.message).toBe('Request body is required');
    });
  });

  describe('GET /recommendations/{id}/progress', () => {
    it('should get progress successfully', async () => {
      const mockProgress = global.createMockProgressRecord();
      (ProgressTrackingManager.prototype.getProgress as jest.Mock).mockResolvedValue(mockProgress);

      const event = {
        httpMethod: 'GET',
        path: '/recommendations/rec-test-001/progress',
        headers: {},
        queryStringParameters: { businessId: 'test-business-123' },
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.recommendationId).toBe('rec-test-001');
      expect(responseBody.businessId).toBe('test-business-123');
      expect(responseBody.status).toBe('in_progress');
    });

    it('should handle missing progress record', async () => {
      (ProgressTrackingManager.prototype.getProgress as jest.Mock).mockResolvedValue(null);

      const event = {
        httpMethod: 'GET',
        path: '/recommendations/rec-test-001/progress',
        headers: {},
        queryStringParameters: { businessId: 'test-business-123' },
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Not Found');
    });

    it('should handle missing parameters', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/recommendations/rec-test-001/progress',
        headers: {},
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Bad Request');
    });
  });

  describe('PUT /recommendations/{id}/progress', () => {
    it('should update progress successfully', async () => {
      const mockProgress = global.createMockProgressRecord();
      const updatedProgress = { ...mockProgress, progress: 75 };
      (ProgressTrackingManager.prototype.updateProgress as jest.Mock).mockResolvedValue(updatedProgress);

      const event = {
        httpMethod: 'PUT',
        path: '/recommendations/rec-test-001/progress',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify({
          businessId: 'test-business-123',
          progress: 75,
          status: 'in_progress'
        }),
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.progress).toBe(75);
    });

    it('should handle missing business ID', async () => {
      const event = {
        httpMethod: 'PUT',
        path: '/recommendations/rec-test-001/progress',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify({
          progress: 75,
          status: 'in_progress'
        }),
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Bad Request');
    });
  });

  describe('GET /recommendations/{id}/effectiveness', () => {
    it('should get effectiveness successfully', async () => {
      const mockEffectiveness = {
        effectivenessScore: 85,
        impactAnalysis: {
          predicted: 80,
          actual: 90,
          variance: 12.5,
          category: 'exceeded' as const
        },
        effortAnalysis: {
          predicted: 60,
          actual: 55,
          variance: -8.3,
          category: 'easier' as const
        },
        roiAnalysis: {
          predicted: 200,
          actual: 250,
          variance: 25,
          category: 'exceeded' as const
        },
        recommendations: ['Document success factors', 'Consider accelerating similar initiatives']
      };

      (EffectivenessMeasurementEngine.prototype.measureEffectiveness as jest.Mock).mockResolvedValue(mockEffectiveness);

      const event = {
        httpMethod: 'GET',
        path: '/recommendations/rec-test-001/effectiveness',
        headers: {},
        queryStringParameters: { businessId: 'test-business-123' },
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.effectivenessScore).toBe(85);
      expect(responseBody.impactAnalysis.category).toBe('exceeded');
    });

    it('should handle no effectiveness data', async () => {
      (EffectivenessMeasurementEngine.prototype.measureEffectiveness as jest.Mock)
        .mockRejectedValue(new Error('No effectiveness data available for this recommendation'));

      const event = {
        httpMethod: 'GET',
        path: '/recommendations/rec-test-001/effectiveness',
        headers: {},
        queryStringParameters: { businessId: 'test-business-123' },
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Not Found');
    });
  });

  describe('GET /analytics/effectiveness', () => {
    it('should get effectiveness report successfully', async () => {
      const mockReport = {
        summary: {
          totalRecommendations: 10,
          completedRecommendations: 6,
          averageEffectiveness: 78,
          successRate: 85,
          topPerformingCategories: ['seo_optimization', 'social_media'],
          underperformingCategories: ['technology_upgrade']
        },
        insights: {
          bestPractices: ['Focus on low-effort, high-impact recommendations'],
          commonChallenges: ['Resource allocation often exceeds estimates'],
          improvementOpportunities: ['Improve effort estimation accuracy']
        },
        recommendations: {
          strategic: ['Focus future initiatives on high-performing categories'],
          operational: ['Implement better resource planning'],
          tactical: ['Increase measurement frequency']
        }
      };

      (EffectivenessMeasurementEngine.prototype.generateEffectivenessReport as jest.Mock).mockResolvedValue(mockReport);

      const event = {
        httpMethod: 'GET',
        path: '/analytics/effectiveness',
        headers: {},
        queryStringParameters: { businessId: 'test-business-123' },
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.summary.totalRecommendations).toBe(10);
      expect(responseBody.summary.completedRecommendations).toBe(6);
      expect(responseBody.insights.bestPractices).toHaveLength(1);
    });

    it('should handle missing business ID', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/analytics/effectiveness',
        headers: {},
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Bad Request');
    });
  });

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight requests', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/recommendations',
        headers: {},
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('GET,POST,PUT,DELETE,OPTIONS');
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown paths', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/unknown/path',
        headers: {},
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Not Found');
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors', async () => {
      (GoalProfileManager.prototype.createGoalProfile as jest.Mock).mockImplementation(() => {
        throw new Error('Internal error');
      });

      const event = {
        httpMethod: 'POST',
        path: '/recommendations',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify(global.createMockRecommendationRequest()),
        requestContext: {
          requestId: 'test-request-123',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Internal Server Error');
      expect(responseBody.requestId).toBe('test-request-123');
    });
  });
});