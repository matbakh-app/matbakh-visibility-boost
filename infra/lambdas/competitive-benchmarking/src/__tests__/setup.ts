import { jest } from '@jest/globals';

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  GetSecretValueCommand: jest.fn()
}));

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
  GetCommand: jest.fn()
}));

// Mock external dependencies with robust implementations
jest.mock('axios');
jest.mock('cheerio');
jest.mock('node-cache');

// Chromium (Lambda-tauglich) - vollständig gemockt
jest.mock('@sparticuz/chromium', () => ({
  __esModule: true,
  default: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: async () => '/usr/bin/chromium-browser',
    headless: 'new'
  }
}));

// Puppeteer-Core: **ohne** jest.fn(), nur Plain-Async-Funktionen
jest.mock('puppeteer-core', () => {
  // minimale, stabile Fakes – typneutral
  const fakePage = {
    goto: async (_url?: string) => undefined,
    setUserAgent: async (_ua?: string) => undefined,
    setViewport: async (_vp?: any) => undefined,
    content: async () => '<html><body>Mock HTML Content</body></html>',
    evaluate: async (_fn?: any, _arg?: any) => null,
    $: async (_sel?: string) => null,
    $$eval: async (_sel?: string, _fn?: any) => [],
    close: async () => undefined,
  };

  const fakeBrowser = {
    newPage: async () => fakePage,
    close: async () => undefined,
  };

  // default-Export-Objekt wie im echten Modul
  const defaultExport = {
    launch: async (_opts?: any) => fakeBrowser,
  };

  return { __esModule: true, default: defaultExport };
});

// Set up environment variables for tests
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'eu-central-1';
process.env.SECRETS_ARN = 'arn:aws:secretsmanager:eu-central-1:123456789012:secret:test-secret';
process.env.RESULTS_TABLE = 'test-results-table';
process.env.CACHE_TABLE = 'test-cache-table';

// Global test timeout
jest.setTimeout(30000);

// Console log suppression for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});