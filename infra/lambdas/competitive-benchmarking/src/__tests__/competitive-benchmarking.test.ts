import { handler, healthCheck } from '../index';
import { CompetitorDiscoveryEngine } from '../competitor-discovery-engine';
import { PlatformDataCollector } from '../platform-data-collector';
import { CompetitiveAnalysisEngine } from '../competitive-analysis-engine';
import {
  BenchmarkingRequest,
  Competitor,
  PlatformMetrics,
  CompetitiveBenchmarkingEvent,
  CompetitiveBenchmarkingContext
} from '../types';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: { from: jest.fn() },
    GetCommand: jest.fn(function GetCommand() { }),
    PutCommand: jest.fn(function PutCommand() { })
  };
});

// Mock engines
jest.mock('../competitor-discovery-engine');
jest.mock('../platform-data-collector');
jest.mock('../competitive-analysis-engine');

const MockedCompetitorDiscoveryEngine = CompetitorDiscoveryEngine as jest.MockedClass<typeof CompetitorDiscoveryEngine>;
const MockedPlatformDataCollector = PlatformDataCollector as jest.MockedClass<typeof PlatformDataCollector>;
const MockedCompetitiveAnalysisEngine = CompetitiveAnalysisEngine as jest.MockedClass<typeof CompetitiveAnalysisEngine>;

// Console error suppression for clean test logs
const origError = console.error;
beforeAll(() => { console.error = jest.fn(); });
afterAll(() => { console.error = origError; });

describe('Competitive Benchmarking Lambda', () => {
  const mockContext: CompetitiveBenchmarkingContext = {
    requestId: 'test-request-id',
    functionName: 'competitive-benchmarking',
    functionVersion: '1.0.0',
    memoryLimitInMB: '512',
    remainingTimeInMillis: 30000
  };

  const mockRequest: BenchmarkingRequest = {
    businessId: 'test-business-id',
    businessName: 'Test Restaurant',
    address: '123 Test Street, Test City',
    coordinates: { lat: 52.5200, lng: 13.4050 },
    category: 'restaurant',
    radius: 2000,
    maxCompetitors: 10,
    platforms: ['google', 'instagram', 'facebook'],
    includeInactive: false,
    forceRefresh: false,
    analysisDepth: 'standard',
    frameworks: ['swot', 'porter', 'balanced_scorecard', 'nutzwert', 'cultural']
  };

  const mockCompetitor: Competitor = {
    id: 'test-competitor-1',
    name: 'Competitor Restaurant',
    address: '456 Competitor Street',
    coordinates: { lat: 52.5210, lng: 13.4060 },
    category: 'restaurant',
    distance: 500,
    discoveredAt: '2025-01-09T10:00:00Z',
    lastUpdated: '2025-01-09T10:00:00Z',
    status: 'active',
    confidence: 0.9,
    sources: ['google_places']
  };

  const mockPlatformMetrics: PlatformMetrics = {
    platform: 'google',
    isVerified: true,
    reviews: {
      count: 150,
      averageRating: 4.5
    },
    photos: {
      count: 25
    },
    businessHours: {
      monday: '9:00 AM - 10:00 PM',
      tuesday: '9:00 AM - 10:00 PM',
      wednesday: '9:00 AM - 10:00 PM',
      thursday: '9:00 AM - 10:00 PM',
      friday: '9:00 AM - 11:00 PM',
      saturday: '9:00 AM - 11:00 PM',
      sunday: '10:00 AM - 9:00 PM'
    },
    priceLevel: 2,
    lastScraped: '2025-01-09T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.AWS_REGION = 'eu-central-1';
    process.env.SECRETS_ARN = 'arn:aws:secretsmanager:eu-central-1:123456789012:secret:test-secret';
    process.env.RESULTS_TABLE = 'test-results-table';
    process.env.CACHE_TABLE = 'test-cache-table';
  });

  describe('handler', () => {
    it('should handle GET request successfully', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'GET',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: {
          businessId: mockRequest.businessId,
          businessName: mockRequest.businessName,
          address: mockRequest.address,
          coordinates: `${mockRequest.coordinates.lat},${mockRequest.coordinates.lng}`,
          category: mockRequest.category,
          radius: mockRequest.radius.toString(),
          maxCompetitors: mockRequest.maxCompetitors.toString(),
          platforms: mockRequest.platforms.join(','),
          frameworks: mockRequest.frameworks.join(',')
        },
        body: null,
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      // Mock AWS SDK responses - removed unused variables

      // Mock engine responses
      const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
      mockDiscoveryEngine.discoverCompetitors = jest.fn().mockResolvedValue([mockCompetitor]);

      const mockDataCollector = new MockedPlatformDataCollector({} as any);
      mockDataCollector.collectPlatformData = jest.fn().mockResolvedValue([mockPlatformMetrics]);
      mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

      const mockAnalysisEngine = new MockedCompetitiveAnalysisEngine({} as any);
      mockAnalysisEngine.analyzeBenchmarking = jest.fn().mockResolvedValue({
        requestId: 'test-request-id',
        businessId: mockRequest.businessId,
        analysisDate: '2025-01-09T10:00:00Z',
        competitors: [{
          competitor: mockCompetitor,
          platforms: [mockPlatformMetrics],
          visibilityScore: {
            overall: 75,
            google: 80,
            social: 60,
            reviews: 85,
            photos: 70
          },
          strategicAnalysis: {
            swot: {
              strengths: ['Strong Google presence'],
              weaknesses: ['Limited social media'],
              opportunities: ['Expand Instagram'],
              threats: ['Close proximity']
            },
            portersFiveForces: {
              competitiveRivalry: { intensity: 'high' as const, factors: [], score: 75 },
              supplierPower: { intensity: 'medium' as const, factors: [], score: 60 },
              buyerPower: { intensity: 'high' as const, factors: [], score: 70 },
              threatOfSubstitutes: { intensity: 'high' as const, factors: [], score: 75 },
              barrierToEntry: { intensity: 'medium' as const, factors: [], score: 50 },
              overallAttractiveness: 66,
              strategicRecommendations: []
            },
            balancedScorecard: {
              financial: { metrics: [], score: 75 },
              customer: { metrics: [], score: 80 },
              internalProcesses: { metrics: [], score: 70 },
              learningAndGrowth: { metrics: [], score: 65 },
              overallBalance: 72,
              strategicInitiatives: []
            },
            nutzwertanalyse: {
              criteria: [],
              results: [],
              recommendations: []
            },
            culturalDimensions: {
              country: 'Germany',
              dimensions: {
                powerDistance: { score: 35, interpretation: '', businessImplications: [] },
                individualism: { score: 67, interpretation: '', businessImplications: [] },
                masculinity: { score: 66, interpretation: '', businessImplications: [] },
                uncertaintyAvoidance: { score: 65, interpretation: '', businessImplications: [] },
                longTermOrientation: { score: 83, interpretation: '', businessImplications: [] },
                indulgence: { score: 40, interpretation: '', businessImplications: [] }
              },
              culturalRecommendations: [],
              communicationStyle: { preferred: '', avoid: [], emphasize: [] }
            }
          },
          keyInsights: ['Well-established competitor'],
          recommendedActions: [{
            action: 'Improve social media presence',
            priority: 'high' as const,
            effort: 'medium' as const,
            impact: 'high' as const,
            timeframe: '2-3 months',
            framework: 'swot' as const
          }],
          analysisDate: '2025-01-09T10:00:00Z',
          dataFreshness: {
            google: '2025-01-09T10:00:00Z'
          }
        }],
        marketInsights: {
          totalCompetitors: 1,
          averageVisibilityScore: 75,
          marketLeader: {
            name: 'Competitor Restaurant',
            visibilityScore: 75
          },
          marketPosition: {
            rank: 2,
            percentile: 50,
            category: 'average' as const
          },
          keyTrends: ['Strong Google adoption'],
          opportunities: ['Social media gap'],
          threats: ['Competitive market']
        },
        recommendations: [{
          category: 'Google My Business',
          priority: 'high' as const,
          actions: ['Complete profile', 'Add photos'],
          expectedImpact: 'Improved visibility',
          timeframe: '2-4 weeks',
          resources: ['Marketing team']
        }],
        dataQuality: {
          completeness: 0.9,
          freshness: 0.95,
          accuracy: 0.85,
          sources: ['google'],
          limitations: []
        },
        processingTime: 5000,
        cacheHit: false,
        nextUpdateRecommended: '2025-01-16T10:00:00Z'
      });

      // Mock constructors
      MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
      MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);
      MockedCompetitiveAnalysisEngine.mockImplementation(() => mockAnalysisEngine);

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveProperty('requestId');
      expect(JSON.parse(result.body)).toHaveProperty('competitors');
      expect(JSON.parse(result.body)).toHaveProperty('marketInsights');
      expect(JSON.parse(result.body)).toHaveProperty('recommendations');
    });

    it('should handle POST request successfully', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {
          'Content-Type': 'application/json'
        },
        queryStringParameters: null,
        body: JSON.stringify(mockRequest),
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      // Mock similar to GET test
      const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
      mockDiscoveryEngine.discoverCompetitors = jest.fn().mockResolvedValue([mockCompetitor]);

      const mockDataCollector = new MockedPlatformDataCollector({} as any);
      mockDataCollector.collectPlatformData = jest.fn().mockResolvedValue([mockPlatformMetrics]);
      mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

      const mockAnalysisEngine = new MockedCompetitiveAnalysisEngine({} as any);
      mockAnalysisEngine.analyzeBenchmarking = jest.fn().mockResolvedValue({
        requestId: 'test-request-id',
        businessId: mockRequest.businessId,
        analysisDate: '2025-01-09T10:00:00Z',
        competitors: [],
        marketInsights: {
          totalCompetitors: 0,
          averageVisibilityScore: 0,
          marketPosition: {
            rank: 1,
            percentile: 100,
            category: 'leader' as const
          },
          keyTrends: [],
          opportunities: [],
          threats: []
        },
        recommendations: [],
        dataQuality: {
          completeness: 1.0,
          freshness: 1.0,
          accuracy: 1.0,
          sources: [],
          limitations: []
        },
        processingTime: 1000,
        cacheHit: false,
        nextUpdateRecommended: '2025-01-16T10:00:00Z'
      });

      MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
      MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);
      MockedCompetitiveAnalysisEngine.mockImplementation(() => mockAnalysisEngine);

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveProperty('requestId');
    });

    it('should handle invalid request format', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: null,
        body: '{"invalid": "request"}',
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
      expect(JSON.parse(result.body).error.message).toContain('Invalid request format');
    });

    it('should handle unsupported HTTP method', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'DELETE',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: null,
        body: null,
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
      expect(JSON.parse(result.body).error.message).toContain('Unsupported HTTP method');
    });

    it('should handle no competitors found', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: null,
        body: JSON.stringify(mockRequest),
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
      mockDiscoveryEngine.discoverCompetitors = jest.fn().mockResolvedValue([]);

      const mockDataCollector = new MockedPlatformDataCollector({} as any);
      mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

      MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
      MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
      expect(JSON.parse(result.body).error.message).toContain('No competitors found');
    });

    it('should handle engine errors gracefully', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: null,
        body: JSON.stringify(mockRequest),
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
      mockDiscoveryEngine.discoverCompetitors = jest.fn().mockRejectedValue(new Error('Discovery failed'));

      const mockDataCollector = new MockedPlatformDataCollector({} as any);
      mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

      MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
      MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await healthCheck();

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('competitive-benchmarking');
      expect(body.version).toBe('1.0.0');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('Error handling', () => {
    it('should return appropriate status codes for different error types', async () => {
      const testCases = [
        { error: new Error('Invalid request format'), expectedStatus: 400 },
        { error: new Error('Business not found'), expectedStatus: 404 },
        { error: new Error('Rate limit exceeded'), expectedStatus: 429 },
        { error: new Error('Request timeout'), expectedStatus: 504 },
        { error: new Error('Unknown error'), expectedStatus: 500 }
      ];

      for (const testCase of testCases) {
        const event: CompetitiveBenchmarkingEvent = {
          httpMethod: 'POST',
          path: '/competitive-benchmarking',
          headers: {},
          queryStringParameters: null,
          body: JSON.stringify(mockRequest),
          requestContext: {
            requestId: 'test-request',
            identity: {
              sourceIp: '127.0.0.1',
              userAgent: 'test-agent'
            }
          }
        };

        const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
        mockDiscoveryEngine.discoverCompetitors = jest.fn().mockRejectedValue(testCase.error);

        const mockDataCollector = new MockedPlatformDataCollector({} as any);
        mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

        MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
        MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);

        const result = await handler(event, mockContext);

        expect(result.statusCode).toBe(testCase.expectedStatus);
        expect(JSON.parse(result.body)).toHaveProperty('error');
      }
    });
  });

  describe('Caching', () => {
    it('should return cached result when available', async () => {
      const event: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {},
        queryStringParameters: null,
        body: JSON.stringify(mockRequest),
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      const cachedResult = {
        requestId: 'cached-request-id',
        businessId: mockRequest.businessId,
        analysisDate: '2025-01-09T09:00:00Z',
        competitors: [],
        marketInsights: {
          totalCompetitors: 0,
          averageVisibilityScore: 0,
          marketPosition: {
            rank: 1,
            percentile: 100,
            category: 'leader' as const
          },
          keyTrends: [],
          opportunities: [],
          threats: []
        },
        recommendations: [],
        dataQuality: {
          completeness: 1.0,
          freshness: 1.0,
          accuracy: 1.0,
          sources: [],
          limitations: []
        },
        processingTime: 0,
        cacheHit: false,
        nextUpdateRecommended: '2025-01-16T09:00:00Z'
      };

      // Mock DynamoDB to return cached result (deterministic)
      const mockSend = jest.fn((cmd: any) => {
        // Liefere für GetCommand ein Item zurück → Cache-Hit
        if (cmd?.constructor?.name === 'GetCommand') {
          return Promise.resolve({ Item: cachedResult });
        }
        return Promise.resolve({});
      });

      (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({ send: mockSend });

      // Jetzt ausführen
      const res = await handler(event, mockContext);

      // Erwartung: Engines wurden nicht aufgerufen, da Cache gegriffen hat
      expect(MockedCompetitorDiscoveryEngine).not.toHaveBeenCalled();
      expect(MockedPlatformDataCollector).not.toHaveBeenCalled();
      expect(MockedCompetitiveAnalysisEngine).not.toHaveBeenCalled();

      // Optional: Response prüfen, dass es wirklich der Cache ist
      const body = JSON.parse(res.body);
      expect(body.requestId).toBe('cached-request-id');
    });
  });
});