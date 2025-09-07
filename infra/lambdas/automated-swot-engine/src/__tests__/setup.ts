/**
 * Test setup for Automated SWOT Engine
 */

import { TextAnalysisResult, ImageAnalysisResult } from '../types';

// Shared mock functions for command-based responses
export const awsSend = {
  comprehend: jest.fn(),
  rekognition: jest.fn(),
  bedrock: jest.fn(),
  s3: jest.fn(),
};

// Mock AWS SDK clients with shared send functions
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: awsSend.bedrock
  })),
  InvokeModelCommand: jest.fn(function InvokeModelCommand() { })
}));

jest.mock('@aws-sdk/client-comprehend', () => ({
  ComprehendClient: jest.fn().mockImplementation(() => ({
    send: awsSend.comprehend
  })),
  DetectSentimentCommand: jest.fn(function DetectSentimentCommand() { }),
  DetectKeyPhrasesCommand: jest.fn(function DetectKeyPhrasesCommand() { }),
  DetectEntitiesCommand: jest.fn(function DetectEntitiesCommand() { })
}));

jest.mock('@aws-sdk/client-rekognition', () => ({
  RekognitionClient: jest.fn().mockImplementation(() => ({
    send: awsSend.rekognition
  })),
  DetectLabelsCommand: jest.fn(function DetectLabelsCommand() { }),
  DetectFacesCommand: jest.fn(function DetectFacesCommand() { }),
  DetectModerationLabelsCommand: jest.fn(function DetectModerationLabelsCommand() { })
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: awsSend.s3
  })),
  GetObjectCommand: jest.fn(function GetObjectCommand() { })
}));

// Mock Sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg'
    }),
    stats: jest.fn().mockResolvedValue({
      channels: [
        { mean: 128, stdev: 45 },
        { mean: 130, stdev: 42 },
        { mean: 125, stdev: 48 }
      ]
    }),
    greyscale: jest.fn().mockReturnThis(),
    convolve: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data'))
  }));
});

// Mock fetch for external image downloads
global.fetch = jest.fn();

// Set up environment variables
process.env.AWS_REGION = 'eu-central-1';
process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
export const mockSWOTRequest = {
  businessId: 'test-business-123',
  businessName: 'Test Restaurant',
  businessCategory: 'restaurant',
  location: {
    address: 'Test Street 123',
    city: 'Berlin',
    country: 'Germany',
    coordinates: {
      lat: 52.5200,
      lng: 13.4050
    }
  },
  reviewTexts: [
    {
      id: 'review-1',
      platform: 'google' as const,
      text: 'Amazing food and excellent service! The pasta was delicious and the staff was very friendly.',
      rating: 5,
      date: '2024-01-15T10:30:00Z',
      language: 'en',
      sentiment: 'positive' as const,
      verified: true
    },
    {
      id: 'review-2',
      platform: 'yelp' as const,
      text: 'The food was okay but the service was slow. Had to wait 30 minutes for our order.',
      rating: 3,
      date: '2024-01-10T19:45:00Z',
      language: 'en',
      sentiment: 'neutral' as const,
      verified: false
    },
    {
      id: 'review-3',
      platform: 'google' as const,
      text: 'Terrible experience. Food was cold and the restaurant was dirty. Will not come back.',
      rating: 1,
      date: '2024-01-05T14:20:00Z',
      language: 'en',
      sentiment: 'negative' as const,
      verified: true
    }
  ],
  images: [
    {
      id: 'image-1',
      url: 'https://example.com/food-photo.jpg',
      platform: 'instagram' as const,
      type: 'food' as const,
      uploadDate: '2024-01-15T12:00:00Z',
      metadata: {
        width: 800,
        height: 600,
        fileSize: 150000,
        format: 'jpeg'
      }
    },
    {
      id: 'image-2',
      url: 'https://example.com/interior-photo.jpg',
      platform: 'google' as const,
      type: 'interior' as const,
      uploadDate: '2024-01-12T16:30:00Z',
      metadata: {
        width: 1024,
        height: 768,
        fileSize: 200000,
        format: 'jpeg'
      }
    }
  ],
  analysisOptions: {
    includeImageAnalysis: true,
    includeSentimentAnalysis: true,
    includeCompetitorComparison: false,
    analysisDepth: 'detailed' as const,
    language: 'en' as const,
    businessContext: {
      yearsInBusiness: 5,
      employeeCount: 15,
      averagePrice: 25,
      specialties: ['Italian cuisine', 'Pizza', 'Pasta']
    }
  }
};

export const mockTextAnalysisResult: TextAnalysisResult = {
  sentiment: 'positive',
  confidence: 0.85,
  keyPhrases: ['amazing food', 'excellent service', 'delicious pasta', 'friendly staff'],
  entities: [
    { name: 'pasta', type: 'OTHER', confidence: 0.9 },
    { name: 'staff', type: 'PERSON', confidence: 0.8 }
  ],
  themes: [
    { theme: 'food_quality', frequency: 3, sentiment: 'positive' },
    { theme: 'service', frequency: 2, sentiment: 'positive' }
  ]
};

export const mockImageAnalysisResult: ImageAnalysisResult = {
  labels: [
    { name: 'Food', confidence: 0.95, category: 'food' },
    { name: 'Pasta', confidence: 0.88, category: 'food' },
    { name: 'Restaurant', confidence: 0.82, category: 'interior' }
  ],
  quality: {
    brightness: 75,
    contrast: 68,
    sharpness: 72,
    composition: 80,
    overall: 74
  },
  content: {
    hasFood: true,
    hasInterior: false,
    hasExterior: false,
    hasPeople: false,
    hasMenu: false
  },
  emotions: [
    { emotion: 'HAPPY', confidence: 0.7 },
    { emotion: 'CALM', confidence: 0.3 }
  ]
};

export const mockBedrockResponse = {
  strengths: [
    {
      title: 'Excellent Food Quality',
      description: 'Customers consistently praise the quality and taste of food, particularly pasta dishes.',
      impact: 'high',
      confidence: 0.9,
      category: 'operational',
      evidence: ['Customer reviews highlight delicious food', 'High-quality food photography']
    },
    {
      title: 'Friendly Service',
      description: 'Staff receives positive feedback for being friendly and attentive to customers.',
      impact: 'medium',
      confidence: 0.8,
      category: 'customer',
      evidence: ['Multiple reviews mention friendly staff', 'Positive service interactions']
    }
  ],
  weaknesses: [
    {
      title: 'Service Speed Issues',
      description: 'Some customers report slow service and long wait times for orders.',
      impact: 'medium',
      confidence: 0.7,
      category: 'operational',
      evidence: ['Customer complaints about wait times', 'Service efficiency concerns']
    }
  ],
  opportunities: [
    {
      title: 'Digital Marketing Enhancement',
      description: 'Limited online presence presents opportunity for social media growth.',
      impact: 'high',
      confidence: 0.6,
      category: 'marketing',
      evidence: ['Few social media posts', 'Opportunity for visual content improvement']
    }
  ],
  threats: [
    {
      title: 'Reputation Risk',
      description: 'Negative reviews about cleanliness could damage restaurant reputation.',
      impact: 'high',
      confidence: 0.8,
      category: 'competitive',
      evidence: ['Negative cleanliness reviews', 'Potential customer deterrent']
    }
  ]
};

// Helper functions for tests
export function createMockEvent(body: any, httpMethod = 'POST', path = '/swot/analyze') {
  return {
    httpMethod,
    path,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    },
    queryStringParameters: null,
    pathParameters: null,
    requestContext: {
      requestId: 'test-request-id'
    }
  } as any;
}

export function createMockContext() {
  return {
    awsRequestId: 'test-aws-request-id',
    functionName: 'automated-swot-engine',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:automated-swot-engine',
    memoryLimitInMB: '512',
    remainingTimeInMillis: () => 30000
  } as any;
}

export function setupMockAWSServices() {
  // Setup Bedrock mock (command-based, not sequential)
  awsSend.bedrock.mockImplementation((cmd: any) => {
    const name = cmd?.constructor?.name;
    if (name === 'InvokeModelCommand') {
      return Promise.resolve({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify(mockBedrockResponse)
          }]
        }))
      });
    }
    return Promise.resolve({});
  });

  // Setup Comprehend mocks (command-based, not sequential)
  awsSend.comprehend.mockImplementation((cmd: any) => {
    const name = cmd?.constructor?.name;
    switch (name) {
      case 'DetectSentimentCommand':
        return Promise.resolve({
          Sentiment: 'POSITIVE',
          SentimentScore: {
            Positive: 0.85,
            Negative: 0.05,
            Neutral: 0.10,
            Mixed: 0.00
          }
        });
      case 'DetectKeyPhrasesCommand':
        return Promise.resolve({
          KeyPhrases: [
            { Text: 'amazing food', Score: 0.95 },
            { Text: 'excellent service', Score: 0.90 },
            { Text: 'delicious pasta', Score: 0.88 }
          ]
        });
      case 'DetectEntitiesCommand':
        return Promise.resolve({
          Entities: [
            { Text: 'pasta', Type: 'OTHER', Score: 0.90 },
            { Text: 'staff', Type: 'PERSON', Score: 0.80 }
          ]
        });
      default:
        return Promise.resolve({});
    }
  });

  // Setup Rekognition mocks (command-based, not sequential)
  awsSend.rekognition.mockImplementation((cmd: any) => {
    const name = cmd?.constructor?.name;
    switch (name) {
      case 'DetectLabelsCommand':
        return Promise.resolve({
          Labels: [
            { Name: 'Food', Confidence: 95 },
            { Name: 'Pasta', Confidence: 88 },
            { Name: 'Restaurant', Confidence: 82 }
          ]
        });
      case 'DetectFacesCommand':
        return Promise.resolve({
          FaceDetails: [
            {
              Emotions: [
                { Type: 'HAPPY', Confidence: 70 },
                { Type: 'CALM', Confidence: 30 }
              ],
              AgeRange: { Low: 25, High: 35 },
              Gender: { Value: 'Female' }
            }
          ]
        });
      case 'DetectModerationLabelsCommand':
        return Promise.resolve({ ModerationLabels: [] });
      default:
        return Promise.resolve({});
    }
  });

  // Setup S3 mock for image download
  awsSend.s3.mockResolvedValue({
    Body: {
      transformToWebStream: () => ({
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3, 4]) })
            .mockResolvedValueOnce({ done: true, value: undefined })
        })
      })
    }
  });

  // Setup fetch mock for external images
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000))
  });

  return {
    mockBedrockSend: awsSend.bedrock,
    mockComprehendSend: awsSend.comprehend,
    mockRekognitionSend: awsSend.rekognition,
    mockS3Send: awsSend.s3
  };
}