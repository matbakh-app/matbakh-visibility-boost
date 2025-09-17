// 🔧 CRITICAL: Mock AWS SDK BEFORE importing handler to prevent initialization issues

// Mock AWS SDK - Complete and robust mocking
const mockSecretsManagerSend = jest.fn().mockResolvedValue({
  SecretString: JSON.stringify({
    GOOGLE_MAPS_API_KEY: 'test-api-key'
  })
});

const mockDynamoDBSend = jest.fn().mockImplementation((command) => {
  console.log('[MOCK] DynamoDB command:', command.constructor.name);
  // Mock GetCommand for cache lookup
  if (command.constructor.name === 'GetCommand') {
    return Promise.resolve({ Item: null }); // No cache hit by default
  }
  // Mock PutCommand for cache/result storage
  if (command.constructor.name === 'PutCommand') {
    return Promise.resolve({});
  }
  return Promise.resolve({});
});

jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: mockSecretsManagerSend
  })),
  GetSecretValueCommand: jest.fn().mockImplementation((params) => ({ params }))
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: mockDynamoDBSend
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockDynamoDBSend
    })
  },
  GetCommand: jest.fn().mockImplementation((params) => ({ 
    constructor: { name: 'GetCommand' },
    params 
  })),
  PutCommand: jest.fn().mockImplementation((params) => ({ 
    constructor: { name: 'PutCommand' },
    params 
  }))
}));

// Mock engines
jest.mock('../competitor-discovery-engine');
jest.mock('../platform-data-collector');
jest.mock('../competitive-analysis-engine');

// 💡 NOW import handler AFTER mocking
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

// 💡 DEBUG: Verify correct import path
console.log('[TEST SETUP] 📁 Handler imported from:', require.resolve('../index'));

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
    it('should return 400 if no competitors are found (JTBD: Job cannot be completed)', async () => {
      // 💡 DEBUG-Sicherstellung: Wird diese Zeile erreicht?
      console.log('[TEST] 🧪 Test-Start erreicht.');

      const mockEvent: CompetitiveBenchmarkingEvent = {
        httpMethod: 'POST',
        path: '/competitive-benchmarking',
        headers: {
          'Content-Type': 'application/json'
        },
        queryStringParameters: null,
        body: JSON.stringify({
          businessId: 'test-business-id',
          businessName: 'Test Restaurant',
          address: 'Remote Location, Nowhere',
          coordinates: { lat: 0, lng: 0 },
          category: 'restaurant',
          radius: 1000,
          maxCompetitors: 3,
          platforms: ['google', 'instagram'],
          includeInactive: false,
          forceRefresh: true,
          analysisDepth: 'standard',
          frameworks: ['swot']
        }),
        requestContext: {
          requestId: 'test-request',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-agent'
          }
        }
      };

      // Mock Discovery Engine to return empty array (no competitors found)
      const mockDiscoveryEngine = new MockedCompetitorDiscoveryEngine({} as any);
      mockDiscoveryEngine.discoverCompetitors = jest.fn().mockResolvedValue([]); // Empty result, not error

      const mockDataCollector = new MockedPlatformDataCollector({} as any);
      mockDataCollector.cleanup = jest.fn().mockResolvedValue(undefined);

      MockedCompetitorDiscoveryEngine.mockImplementation(() => mockDiscoveryEngine);
      MockedPlatformDataCollector.mockImplementation(() => mockDataCollector);

      try {
        console.log('[TEST] 🚀 About to call handler...');
        const result = await handler(mockEvent, mockContext);
        console.log('[TEST] ✅ Handler call completed');

        // 💡 DEBUG
        console.log('[TEST] 🔁 Handler Response:', JSON.stringify(result, null, 2));

        // JTBD: Clear error communication when job cannot be completed
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toHaveProperty('error');
        expect(JSON.parse(result.body).error.message).toContain('No competitors found');
      } catch (err) {
        console.error('[TEST ERROR] ❌ Fehler beim Ausführen des Handlers:', err);
        throw err; // Test weiterhin failen lassen
      }
    });

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
        competitors: [],
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
        recommendations: [],
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
      expect(JSON.parse(result.body)).toHaveProperty('marketInsights');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await healthCheck();

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveProperty('status', 'healthy');
      expect(JSON.parse(result.body)).toHaveProperty('service', 'competitive-benchmarking');
    });
  });
});