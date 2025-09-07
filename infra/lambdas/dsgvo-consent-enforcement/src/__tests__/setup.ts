// Jest setup file for DSGVO Consent Enforcement tests

// Mock AWS SDK
jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn(() => ({
    send: jest.fn()
  })),
  GetSecretValueCommand: jest.fn()
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  }))
}));

// Mock PostgreSQL
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

// Set test environment variables
process.env.CONSENT_STRICT_MODE = 'false';
process.env.CONSENT_EXPIRATION_DAYS = '365';
process.env.CONSENT_GRACE_PERIOD_DAYS = '30';
process.env.CACHE_EXPIRATION_SECONDS = '300';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};