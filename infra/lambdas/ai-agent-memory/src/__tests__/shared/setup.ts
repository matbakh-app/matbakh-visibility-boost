/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- Global Jest Matchers ----
declare global {
  // Erweiterung der Jest-Matcher
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidTimestamp(): R;
      toBeValidRelevanceScore(): R;
      toHaveValidMemoryContextStructure(): R;
    }
  }

  // Global verfügbare Helper (ohne Import in den Tests)
  // eslint-disable-next-line no-var
  var expectMockCalledWithPattern: (mockFn: jest.Mock, pattern: any, callIndex?: number) => void;
  // eslint-disable-next-line no-var
  var calculateExpectedRelevanceScore: (contextType: string, content: any) => number;
  // eslint-disable-next-line no-var
  var createMockMemoryContext: (overrides?: any) => any;
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

expect.extend({
  toBeValidUUID(received: unknown) {
    const pass = typeof received === 'string' && (UUID_V4_REGEX.test(received) || received.startsWith('test-uuid'));
    return {
      pass,
      message: () =>
        `Expected "${String(received)}" to ${pass ? 'not ' : ''}match UUID v4 format or test-uuid pattern`,
    };
  },

  toBeValidTimestamp(received: unknown) {
    // akzeptiert number (epoch ms), string-dates oder Date objects
    let time = Number.NaN;
    if (typeof received === 'number') time = received;
    if (typeof received === 'string') time = Date.parse(received);
    if (received instanceof Date) time = received.getTime();

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
      message: () =>
        `Expected year 2000..2100, got ${year} for value "${String(received)}"`,
    };
  },

  toBeValidRelevanceScore(received: unknown) {
    const n = typeof received === 'number' ? received : Number.NaN;
    const pass = Number.isFinite(n) && n >= 0 && n <= 1;
    return {
      pass,
      message: () =>
        `Expected relevance score 0..1, got "${String(received)}"`,
    };
  },

  toHaveValidMemoryContextStructure(received: unknown) {
    if (!received || typeof received !== 'object') {
      return {
        pass: false,
        message: () => `Expected object, got "${String(received)}"`,
      };
    }

    const obj = received as any;
    const requiredFields = ['id', 'tenantId', 'userId', 'contextType', 'content', 'metadata', 'relevanceScore', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => obj[field] === undefined);
    
    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    const hasValidContent = obj.content && 
      Array.isArray(obj.content.conversationHistory) &&
      Array.isArray(obj.content.taskHistory) &&
      Array.isArray(obj.content.insights) &&
      typeof obj.content.userPreferences === 'object' &&
      typeof obj.content.businessContext === 'object' &&
      typeof obj.content.customData === 'object';

    return {
      pass: hasValidContent,
      message: () => hasValidContent 
        ? `Memory context structure is valid`
        : `Invalid content structure in memory context`,
    };
  },
});

// ---- Global Helper ----

/**
 * Prüft, ob der gegebene Mock mindestens EINEN Aufruf enthält,
 * dessen irgendein Argument ein Objekt ist, das "pattern" enthält.
 * Optional kann ein bestimmter callIndex geprüft werden.
 */
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

/**
 * Berechnet erwarteten Relevance Score basierend auf Context Type und Content
 */
function calculateExpectedRelevanceScoreImpl(contextType: string, content: any): number {
  const baseScores = {
    'conversation': 0.7,
    'user_profile': 0.9,
    'business_analysis': 0.8,
    'task_execution': 0.6,
    'system_state': 0.5
  };
  
  let score = baseScores[contextType as keyof typeof baseScores] || 0.5;
  
  // Adjust based on content
  if (content.conversationHistory?.length > 0) {
    const avgConversationScore = content.conversationHistory.reduce((sum: number, entry: any) => 
      sum + (entry.relevanceScore || 0.5), 0) / content.conversationHistory.length;
    score = (score + avgConversationScore) / 2;
  }
  
  if (content.insights?.length > 0) {
    const avgInsightScore = content.insights.reduce((sum: number, insight: any) => 
      sum + (insight.relevanceScore || 0.5), 0) / content.insights.length;
    score = (score + avgInsightScore) / 2;
  }
  
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Creates a mock memory context for testing
 */
function createMockMemoryContextImpl(overrides: any = {}): any {
  const now = new Date();
  return {
    id: 'test-context-id',
    tenantId: 'test-tenant',
    userId: 'test-user',
    contextType: 'conversation',
    content: {
      conversationHistory: [],
      taskHistory: [],
      insights: [],
      userPreferences: {},
      businessContext: {},
      customData: {}
    },
    metadata: {
      accessCount: 0,
      lastAccessed: now,
      tags: [],
      priority: 'medium'
    },
    relevanceScore: 0.5,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

// global verfügbar machen (ohne Import in Tests)
(globalThis as any).expectMockCalledWithPattern = expectMockCalledWithPatternImpl;
(globalThis as any).calculateExpectedRelevanceScore = calculateExpectedRelevanceScoreImpl;
(globalThis as any).createMockMemoryContext = createMockMemoryContextImpl;

// ---- Hinweise ----
// 1) Hier bewusst KEINE jest.mock(...) mit relativen Pfaden auf interne Module.
//    Solche Mocks gehören in die jeweilige Testdatei (damit Pfade korrekt sind).
// 2) Weitere globale Utilities bitte hier zentralisieren, damit Tests deterministisch bleiben.

export {};