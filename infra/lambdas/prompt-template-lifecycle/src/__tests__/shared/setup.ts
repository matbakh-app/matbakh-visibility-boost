/* eslint-disable @typescript-eslint/no-explicit-any */

import { jest } from '@jest/globals';

// Set environment variables for table names
process.env.AB_TESTS_TABLE = process.env.AB_TESTS_TABLE || 'test-ab-tests';
process.env.TEMPLATES_TABLE = process.env.TEMPLATES_TABLE || 'test-templates';
process.env.VERSIONS_TABLE = process.env.VERSIONS_TABLE || 'test-versions';
process.env.EXECUTIONS_TABLE = process.env.EXECUTIONS_TABLE || 'test-executions';

// ===== UUID Mock =====
jest.mock('uuid'); // nimmt src/__mocks__/uuid.ts

// Optional: feste UUID für deterministische Tests
(globalThis as any).TEST_UUID = '11111111-1111-4111-8111-111111111111';

// =====================
// Global Jest Matchers
// =====================
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidTimestamp(): R;
      toBeValidRelevanceScore(): R;
    }
  }

  // Globale Helper (ohne Import in Tests)
  // eslint-disable-next-line no-var
  var expectMockCalledWithPattern: (mockFn: jest.Mock, pattern: any, callIndex?: number) => void;
  // eslint-disable-next-line no-var
  var validateABTestStructure: (cfg: any) => void;

  // Globaler Dynamo-Mock
  // eslint-disable-next-line no-var
  var mockSend: jest.Mock;
  
  // Context Factory Functions
  // eslint-disable-next-line no-var
  var createMockTemplate: typeof import('../context-factory').createMockTemplate;
  // eslint-disable-next-line no-var
  var createMockVersion: typeof import('../context-factory').createMockVersion;
  // eslint-disable-next-line no-var
  var createMockExecution: typeof import('../context-factory').createMockExecution;
  // eslint-disable-next-line no-var
  var createMockABTest: typeof import('../context-factory').createMockABTest;
  // eslint-disable-next-line no-var
  var createMockApprovalWorkflow: typeof import('../context-factory').createMockApprovalWorkflow;
  // eslint-disable-next-line no-var
  var createMockPerformanceMetrics: typeof import('../context-factory').createMockPerformanceMetrics;
  // eslint-disable-next-line no-var
  var createMockRollbackInfo: typeof import('../context-factory').createMockRollbackInfo;
  
  // DynamoDB Response Helpers
  // eslint-disable-next-line no-var
  var createMockDynamoResponse: <T>(item: T) => { Item: T };
  // eslint-disable-next-line no-var
  var createMockDynamoListResponse: <T>(items: T[]) => { Items: T[] };
  // eslint-disable-next-line no-var
  var createMockDynamoEmptyResponse: () => {};
  // eslint-disable-next-line no-var
  var createMockDynamoNullResponse: () => { Item: null };
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

expect.extend({
  toBeValidUUID(received: unknown) {
    const pass = typeof received === 'string' && UUID_V4_REGEX.test(received);
    return {
      pass,
      message: () =>
        `Expected "${String(received)}" to ${pass ? 'not ' : ''}match UUID v4 format`,
    };
  },

  toBeValidTimestamp(received: unknown) {
    let time = Number.NaN;
    if (typeof received === 'number') time = received;
    if (typeof received === 'string') time = Date.parse(received);

    const valid = Number.isFinite(time);
    if (!valid) {
      return {
        pass: false,
        message: () => `Expected a valid timestamp, got "${String(received)}"`,
      };
    }
    const d = new Date(time);
    const year = d.getUTCFullYear();
    const pass = year >= 2000 && year <= 2100;
    return {
      pass,
      message: () => `Expected year 2000..2100, got ${year} for value "${String(received)}"`,
    };
  },

  toBeValidRelevanceScore(received: unknown) {
    const n = typeof received === 'number' ? received : Number.NaN;
    const pass = Number.isFinite(n) && n >= 0 && n <= 100;
    return {
      pass,
      message: () => `Expected relevance score 0..100, got "${String(received)}"`,
    };
  },
});

// =====================
// Global Helper
// =====================
function expectMockCalledWithPatternImpl(
  mockFn: jest.Mock,
  pattern: any,
  callIndex?: number
): void {
  const calls: any[][] = (mockFn?.mock?.calls ?? []) as any[][];
  const matchesArgs = (args: any[]): boolean =>
    args?.some((arg) =>
      typeof arg === 'object' && arg !== null
        ? (expect.objectContaining(pattern) as any).asymmetricMatch(arg)
        : false
    );

  if (typeof callIndex === 'number') {
    const args = calls[callIndex] ?? [];
    expect(matchesArgs(args)).toBe(true);
    return;
  }
  const found = calls.some((args) => matchesArgs(args));
  expect(found).toBe(true);
}

function validateABTestStructureImpl(cfg: any): void {
  expect(cfg).toBeDefined();
  expect(cfg).toHaveProperty('id');
  expect(cfg).toHaveProperty('name');
  expect(cfg).toHaveProperty('variants');
  expect(Array.isArray(cfg.variants)).toBe(true);
}

(globalThis as any).expectMockCalledWithPattern = expectMockCalledWithPatternImpl;
(globalThis as any).validateABTestStructure = validateABTestStructureImpl;

// =====================
// AWS DynamoDB Mocks
// =====================

// Ein gemeinsamer send()-Mock für alle Tests
const mockSendImpl = jest.fn();
(globalThis as any).mockSend = mockSendImpl;

// Robuster Mock: unterstützt sowohl `from(...)` als auch `new ...()`
jest.mock('@aws-sdk/lib-dynamodb', () => {
  class PutCommand { constructor(public input: any) {} }
  class GetCommand { constructor(public input: any) {} }
  class QueryCommand { constructor(public input: any) {} }
  class UpdateCommand { constructor(public input: any) {} }
  class DeleteCommand { constructor(public input: any) {} }

  class DynamoDBDocumentClient {
    static from(..._args: any[]) {
      return { send: (globalThis as any).mockSend };
    }
    constructor(..._args: any[]) {
      return { send: (globalThis as any).mockSend };
    }
  }

  return {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
  };
});

// Import context factory and make functions globally available
import { contextFactory } from '../context-factory';

(globalThis as any).createMockTemplate = contextFactory.createMockTemplate;
(globalThis as any).createMockVersion = contextFactory.createMockVersion;
(globalThis as any).createMockExecution = contextFactory.createMockExecution;
(globalThis as any).createMockABTest = contextFactory.createMockABTest;
(globalThis as any).createMockApprovalWorkflow = contextFactory.createMockApprovalWorkflow;
(globalThis as any).createMockPerformanceMetrics = contextFactory.createMockPerformanceMetrics;
(globalThis as any).createMockRollbackInfo = contextFactory.createMockRollbackInfo;

// DynamoDB response helpers
const createMockDynamoResponse = <T>(item: T) => ({ Item: item });
const createMockDynamoListResponse = <T>(items: T[]) => ({ Items: items });
const createMockDynamoNullResponse = () => ({ Item: null });
const createMockDynamoEmptyResponse = () => ({});

(globalThis as any).createMockDynamoResponse = createMockDynamoResponse;
(globalThis as any).createMockDynamoListResponse = createMockDynamoListResponse;
(globalThis as any).createMockDynamoEmptyResponse = createMockDynamoEmptyResponse;
(globalThis as any).createMockDynamoNullResponse = createMockDynamoNullResponse;

// Vor jedem Test send()-Mock zurücksetzen
beforeEach(() => {
  (globalThis as any).mockSend.mockReset();
});

export {};