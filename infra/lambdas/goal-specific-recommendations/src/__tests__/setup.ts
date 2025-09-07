// Test setup file for Goal-Specific Recommendations Lambda
import { jest } from '@jest/globals';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn()
    })
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

// Mock environment variables
process.env.AWS_REGION = 'eu-central-1';
process.env.RECOMMENDATION_PROGRESS_TABLE = 'test-recommendation-progress';

// Global test utilities
global.mockDynamoResponse = (data: any) => {
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
  const mockClient = DynamoDBDocumentClient.from();
  mockClient.send.mockResolvedValueOnce(data);
  return mockClient;
};

global.mockDynamoError = (error: Error) => {
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
  const mockClient = DynamoDBDocumentClient.from();
  mockClient.send.mockRejectedValueOnce(error);
  return mockClient;
};

// Test data factories
global.createMockRecommendationRequest = () => ({
  businessId: 'test-business-123',
  businessProfile: {
    name: 'Test Restaurant',
    category: 'Italian Restaurant',
    location: {
      address: '123 Test Street, Test City',
      coordinates: { lat: 52.5200, lng: 13.4050 }
    },
    size: 'small' as const,
    establishedYear: 2020,
    currentMetrics: {
      monthlyRevenue: 15000,
      customerCount: 500,
      onlinePresenceScore: 65,
      reviewRating: 4.2,
      socialFollowers: 250
    }
  },
  objectives: ['increase_visibility', 'improve_reviews'],
  primaryObjective: 'increase_visibility' as const,
  constraints: {
    budget: {
      amount: 2000,
      currency: 'EUR',
      timeframe: '3 months'
    },
    timeline: {
      start: '2025-01-01T00:00:00Z',
      end: '2025-04-01T00:00:00Z'
    },
    resources: ['social_media_manager', 'basic_budget'],
    limitations: ['limited_technical_resources']
  },
  currentChallenges: ['low_online_visibility', 'inconsistent_reviews'],
  maxRecommendations: 10,
  includeQuickWins: true,
  includeLongTerm: true,
  personaType: 'Solo-Sarah' as const
});

global.createMockRecommendation = () => ({
  id: 'rec-test-001',
  title: 'Test Recommendation',
  description: 'A test recommendation for unit testing',
  category: 'seo_optimization' as const,
  objective: 'increase_visibility' as const,
  priority: 'high' as const,
  effort: 'low' as const,
  impact: 'high' as const,
  timeframe: 'short_term' as const,
  estimatedCost: { min: 100, max: 500, currency: 'EUR' },
  estimatedROI: { 
    percentage: 200, 
    timeframe: '3 months', 
    disclaimer: 'Unverbindliche Schätzung' 
  },
  prerequisites: ['google_account', 'business_verification'],
  steps: [
    { 
      order: 1, 
      action: 'Complete setup', 
      duration: '1 hour', 
      resources: ['admin_access'] 
    }
  ],
  successMetrics: [
    { 
      metric: 'visibility_score', 
      target: '+50%', 
      measurement: 'analytics_tool' 
    }
  ],
  risks: [
    { 
      risk: 'low_adoption', 
      probability: 'low' as const, 
      mitigation: 'proper_training' 
    }
  ],
  tags: ['seo', 'visibility', 'quick_win'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: 'template' as const,
  confidence: 0.9
});

global.createMockGoalProfile = () => ({
  id: 'goal-profile-test-001',
  name: 'Test Goal Profile',
  description: 'A test goal profile for unit testing',
  primaryObjective: 'increase_visibility' as const,
  secondaryObjectives: ['improve_reviews'],
  targetAudience: {
    demographics: ['local_residents', 'working_professionals'],
    behaviors: ['dines_out_regularly', 'uses_online_ordering'],
    preferences: ['quality_food', 'convenient_location']
  },
  keyMetrics: [
    {
      name: 'Google My Business Views',
      description: 'Monthly profile views',
      target: '+50% in 3 months',
      measurement: 'Google My Business Insights',
      weight: 0.3
    }
  ],
  recommendationWeights: {
    priority: 0.3,
    effort: 0.2,
    impact: 0.4,
    timeframe: 0.1
  },
  industryContext: {
    sector: 'food_service',
    businessModel: 'full_service_restaurant',
    marketSize: 'local' as const,
    competitionLevel: 'medium' as const
  },
  constraints: {
    budget: {
      amount: 2000,
      currency: 'EUR',
      timeframe: '3 months'
    },
    resources: ['social_media_manager'],
    limitations: ['limited_technical_resources']
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true
});

global.createMockProgressRecord = () => ({
  recommendationId: 'rec-test-001',
  businessId: 'test-business-123',
  status: 'in_progress' as const,
  progress: 50,
  startedAt: new Date().toISOString(),
  milestones: [
    {
      id: 'milestone-001',
      name: 'Setup Complete',
      description: 'Initial setup completed',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed' as const,
      completedDate: new Date().toISOString()
    }
  ],
  metrics: [
    {
      name: 'visibility_score',
      baseline: 65,
      current: 75,
      target: 90,
      unit: 'score',
      lastUpdated: new Date().toISOString()
    }
  ],
  notes: [
    {
      id: 'note-001',
      content: 'Initial setup completed successfully',
      author: 'test_user',
      createdAt: new Date().toISOString(),
      type: 'update' as const
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});