/**
 * Test setup for Threat Detection Engine
 */

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Only show console output if TEST_VERBOSE is set
  if (!process.env.TEST_VERBOSE) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    promptId: 'test-prompt-123',
    userId: 'test-user-456',
    prompt: 'This is a test prompt',
    metadata: {
      timestamp: new Date().toISOString(),
      aiProvider: 'claude',
      model: 'claude-3-sonnet',
    },
    ...overrides,
  }),

  createMockThreat: (overrides = {}) => ({
    type: 'prompt_injection',
    severity: 'medium',
    confidence: 0.8,
    description: 'Test threat',
    evidence: ['test evidence'],
    location: undefined,
    mitigation: 'Test mitigation',
    ...overrides,
  }),

  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Extend Jest matchers
expect.extend({
  toBeValidThreatLevel(received) {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    const pass = validLevels.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid threat level`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid threat level (${validLevels.join(', ')})`,
        pass: false,
      };
    }
  },

  toBeValidThreatType(received) {
    const validTypes = [
      'prompt_injection',
      'prompt_leak',
      'jailbreak_attempt',
      'hallucination_risk',
      'anomalous_behavior',
      'sensitive_data_exposure',
      'malicious_content',
      'social_engineering',
      'data_exfiltration',
      'model_manipulation',
    ];
    const pass = validTypes.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid threat type`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid threat type`,
        pass: false,
      };
    }
  },

  toHaveValidRiskScore(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 100;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid risk score`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid risk score (0-100)`,
        pass: false,
      };
    }
  },
});

// Type declarations for global utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidThreatLevel(): R;
      toBeValidThreatType(): R;
      toHaveValidRiskScore(): R;
    }
  }

  var testUtils: {
    createMockRequest: (overrides?: any) => any;
    createMockThreat: (overrides?: any) => any;
    sleep: (ms: number) => Promise<void>;
  };
}