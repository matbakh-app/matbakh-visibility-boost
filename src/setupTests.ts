/**
 * Test setup file for Jest
 */

import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_PUBLIC_API_BASE = 'https://test-api.matbakh.app';
process.env.VITE_CLOUDFRONT_URL = 'https://test-cdn.cloudfront.net';

// Mock crypto.subtle for SHA256 calculations
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock AbortSignal.timeout for older environments
if (!AbortSignal.timeout) {
  AbortSignal.timeout = jest.fn().mockImplementation((delay: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  });
}

// Mock performance.now for performance tests
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Global test utilities
global.createMockFile = (name: string, type: string, content = 'test content') => {
  return new File([content], name, { type });
};

global.createMockResponse = (data: any, ok = true) => {
  return {
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  } as Response;
};

// Suppress console warnings in tests unless explicitly testing them
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.includes?.('React Router Future Flag Warning')) {
    return;
  }
  originalWarn(...args);
};