/**
 * Global Jest Setup – Test Infrastructure
 * -----------------------------------------
 * Polyfills, global mocks & cleanup for consistent test execution.
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// -------------------------------
// Mock von import.meta.env für Hooks und Services
// -------------------------------
(globalThis as any).importMetaEnv = {
  VITE_CLOUDFRONT_URL: 'https://test-cdn.cloudfront.net',
  VITE_VC_API_PROVIDER: 'aws',
  VITE_PUBLIC_API_BASE: 'https://test-api.matbakh.app',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
};

// Optional: alias für vite typische Nutzung
process.env.VITE_CLOUDFRONT_URL = 'https://test-cdn.cloudfront.net';
process.env.VITE_VC_API_PROVIDER = 'aws';
process.env.VITE_PUBLIC_API_BASE = 'https://test-api.matbakh.app';

// -------------------------------
// Polyfills
// -------------------------------
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// Polyfill crypto.subtle.digest (jsdom-compatible)
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  globalThis.crypto = {
    subtle: {
      digest: jest.fn().mockResolvedValue(new Uint8Array(32)),
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  } as unknown as Crypto;
}

// Polyfill performance.now
(global as any).performance = {
  now: jest.fn(() => Date.now()),
};

// Polyfill AbortSignal.timeout (Node <18)
if (!(AbortSignal as any).timeout) {
  (AbortSignal as any).timeout = jest.fn().mockImplementation((delay: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  });
}

// -------------------------------
// Global AWS SDK Mocks
// -------------------------------

// Main RDS Client Mock
const mockExecuteQuery = jest.fn();
const mockMapRecord = jest.fn((record: any) => record);

jest.mock('@/services/aws-rds-client', () => {
  return {
    AwsRdsClient: jest.fn().mockImplementation(() => ({
      executeQuery: mockExecuteQuery,
      mapRecord: mockMapRecord,
    })),
  };
});

// CloudWatch Mock
jest.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: jest.fn(),
  PutMetricDataCommand: jest.fn(),
}));

// SNS Mock
jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(),
  PublishCommand: jest.fn(),
}));

// -------------------------------
// Expose mocks globally
// -------------------------------
declare global {
  // eslint-disable-next-line no-var
  var mockExecuteQuery: any;
  // eslint-disable-next-line no-var
  var mockMapRecord: any;
}

(global as any).mockExecuteQuery = mockExecuteQuery;
(global as any).mockMapRecord = mockMapRecord;

// -------------------------------
// Global helpers
// -------------------------------
(global as any).createMockFile = (name: string, type: string, content = 'test content') => {
  return new File([content], name, { type });
};

(global as any).createMockResponse = (data: any, ok = true) => {
  return {
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  } as Response;
};

// -------------------------------
// Cleanup after each test
// -------------------------------
afterEach(() => {
  jest.clearAllMocks();
  mockExecuteQuery.mockReset();
  mockMapRecord.mockReset();
});

// -------------------------------
// Suppress noisy console warnings
// -------------------------------
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('React Router Future Flag Warning')) {
    return;
  }
  originalWarn(...args);
};

