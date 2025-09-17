/**
 * Jest setup file for Bedrock AI Core tests
 */

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch-logs', () => ({
  CloudWatchLogsClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ logEvents: [] })
  })),
  PutLogEventsCommand: jest.fn(),
  DescribeLogGroupsCommand: jest.fn(),
  DeleteLogGroupCommand: jest.fn(),
  PutRetentionPolicyCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ Items: [] })
  })),
  PutItemCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
  DeleteItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn((obj) => obj),
  unmarshall: jest.fn((obj) => obj)
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })
  }))
}));

// Set up environment variables for testing
process.env.AWS_REGION = 'eu-central-1';
process.env.BEDROCK_LOGS_TABLE = 'test-bedrock-logs';
process.env.AUDIT_TRAIL_TABLE = 'test-audit-trail';
process.env.BEDROCK_LOG_GROUP = '/aws/lambda/test-bedrock-agent';
process.env.ANONYMIZATION_SALT = 'test-salt';
process.env.ARCHIVE_ENCRYPTION_KEY = 'test-encryption-key';

// Global test timeout
jest.setTimeout(30000);/
/ Export to make this a module and prevent Jest "no tests" error
export {};