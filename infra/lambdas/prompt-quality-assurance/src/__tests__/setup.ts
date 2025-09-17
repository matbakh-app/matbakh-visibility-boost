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
  QueryCommand: jest.fn(),
  UpdateCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutMetricDataCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeModelCommand: jest.fn()
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

// Set up environment variables
process.env.DYNAMO_TABLE_NAME = 'test-prompt-quality-assurance';
process.env.AWS_REGION = 'eu-central-1';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Helper functions for tests
export const mockPromptExecution = {
  id: 'exec-123',
  templateId: 'template-456',
  templateVersion: '1.0',
  prompt: 'Test prompt',
  output: 'Test output',
  timestamp: '2025-01-09T10:00:00Z',
  executionTime: 2000,
  tokenUsage: {
    input: 100,
    output: 200,
    total: 300
  },
  metadata: {
    persona: 'Solo-Sarah',
    useCase: 'visibility-check'
  }
};

export const mockQualityMetrics = {
  relevanceScore: 0.8,
  coherenceScore: 0.85,
  completenessScore: 0.75,
  accuracyScore: 0.9,
  overallScore: 0.825,
  confidence: 0.8
};

export const mockUserFeedback = {
  executionId: 'exec-123',
  userId: 'user-789',
  rating: 4,
  feedback: 'Good response, very helpful',
  feedbackType: 'positive' as const,
  timestamp: '2025-01-09T10:05:00Z',
  categories: ['helpful', 'accurate']
};

export const mockTestCase = {
  id: 'test-case-123',
  templateId: 'template-456',
  name: 'Basic functionality test',
  description: 'Test basic prompt functionality',
  inputData: {
    businessName: 'Test Restaurant',
    location: 'Berlin'
  },
  expectedOutputCriteria: {
    minQualityScore: 0.7,
    maxTokens: 1000,
    maxResponseTime: 5000,
    requiredElements: ['restaurant', 'visibility'],
    forbiddenElements: ['error', 'failed']
  },
  testType: 'functional' as const,
  isActive: true,
  createdAt: '2025-01-09T09:00:00Z',
  updatedAt: '2025-01-09T09:00:00Z'
};// E
xport to make this a module and prevent Jest "no tests" error
export {};