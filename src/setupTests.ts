// Jest setup file for testing environment
import "@testing-library/jest-dom";

// Mock environment variables
process.env.NODE_ENV = "test";

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
