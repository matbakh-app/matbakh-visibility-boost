/**
 * Jest setup file for Lambda function tests
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.AWS_REGION = 'eu-central-1';
process.env.CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';
process.env.UPLOADS_BUCKET = 'matbakh-files-uploads';
process.env.PROFILE_BUCKET = 'matbakh-files-profile';
process.env.REPORTS_BUCKET = 'matbakh-files-reports';

// Mock Date.now for consistent timestamps in tests
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
Date.now = jest.fn(() => mockDate.getTime());

// Global test utilities
global.createMockEvent = (overrides = {}) => ({
  httpMethod: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://matbakh.app',
  },
  body: JSON.stringify({
    bucket: 'matbakh-files-uploads',
    filename: 'test.jpg',
    contentType: 'image/jpeg',
    userId: 'test-user-id',
    fileSize: 1024,
  }),
  requestContext: {
    authorizer: {
      claims: {
        sub: 'test-user-id',
      },
    },
  },
  ...overrides,
});

global.createMockContext = (overrides = {}) => ({
  awsRequestId: 'test-request-id',
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '256',
  remainingTimeInMillis: () => 30000,
  ...overrides,
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});