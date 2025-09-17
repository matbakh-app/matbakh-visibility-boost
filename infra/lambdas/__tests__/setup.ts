/**
 * Lambda Tests Setup - Global Mocks for AWS SDK
 */
import { jest } from '@jest/globals';

// Global mock for AWS SDK DynamoDB
export const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({ 
        send: (...args: any[]) => mockSend(...args) 
      }),
    },
  };
});

// Global mock for AWS SDK Bedrock Runtime
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const actual = jest.requireActual('@aws-sdk/client-bedrock-runtime');
  return {
    ...actual,
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    }))
  };
});

// Global mock for AWS SDK Secrets Manager
jest.mock('@aws-sdk/client-secrets-manager', () => {
  const actual = jest.requireActual('@aws-sdk/client-secrets-manager');
  return {
    ...actual,
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    }))
  };
});

// Reset mocks after each test
afterEach(() => {
  mockSend.mockReset();
});

// Export for use in tests
export { mockSend as default };