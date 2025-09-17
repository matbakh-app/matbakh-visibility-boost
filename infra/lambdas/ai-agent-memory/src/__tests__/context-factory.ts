/**
 * Context Factory for AI Agent Memory Test Standardization
 * 
 * This factory provides consistent, realistic test objects for memory contexts
 * and related entities. It includes validation helpers and common test scenarios
 * to reduce duplication and improve test reliability.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MemoryContext,
  ContextType,
  ConversationEntry,
  TaskEntry,
  InsightEntry,
  UserPreferences,
  BusinessContext,
  MemoryQuery,
  TenantConfig
} from '../types';

// Memory context factory with realistic defaults
export const createMockMemoryContext = (overrides: Partial<MemoryContext> = {}): MemoryContext => {
  const contextId = overrides.id || uuidv4();
  const tenantId = overrides.tenantId || 'test-tenant';
  const userId = overrides.userId || 'test-user';

  return {
    id: contextId,
    tenantId,
    userId,
    sessionId: overrides.sessionId || 'test-session',
    agentId: overrides.agentId || 'test-agent',
    contextType: overrides.contextType || 'conversation',
    content: {
      conversationHistory: overrides.content?.conversationHistory || [],
      userPreferences: overrides.content?.userPreferences || createMockUserPreferences(),
      businessContext: overrides.content?.businessContext || createMockBusinessContext(),
      taskHistory: overrides.content?.taskHistory || [],
      insights: overrides.content?.insights || [],
      customData: overrides.content?.customData || {},
      ...overrides.content
    },
    metadata: {
      version: overrides.metadata?.version || '1.0',
      source: overrides.metadata?.source || 'test-agent',
      tags: overrides.metadata?.tags || ['test'],
      accessCount: overrides.metadata?.accessCount || 0,
      lastAccessed: overrides.metadata?.lastAccessed || new Date().toISOString(),
      ...overrides.metadata
    },
    relevanceScore: overrides.relevanceScore || 0.8,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    ...overrides
  };
};

// User preferences factory
export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  communicationStyle: overrides.communicationStyle || 'casual',
  responseLength: overrides.responseLength || 'detailed',
  preferredLanguage: overrides.preferredLanguage || 'en',
  timezone: overrides.timezone || 'UTC',
  notificationSettings: {
    email: overrides.notificationSettings?.email ?? true,
    push: overrides.notificationSettings?.push ?? false,
    frequency: overrides.notificationSettings?.frequency || 'daily',
    ...overrides.notificationSettings
  },
  ...overrides
});

// Business context factory
export const createMockBusinessContext = (overrides: Partial<BusinessContext> = {}): BusinessContext => ({
  businessType: overrides.businessType || 'restaurant',
  industry: overrides.industry || 'hospitality',
  location: overrides.location || 'Munich',
  goals: overrides.goals || ['increase_visibility', 'improve_reviews'],
  challenges: overrides.challenges || ['online_presence', 'competition'],
  currentProjects: overrides.currentProjects || [],
  ...overrides
});

// Conversation entry factory
export const createMockConversationEntry = (overrides: Partial<ConversationEntry> = {}): ConversationEntry => ({
  id: overrides.id || uuidv4(),
  timestamp: overrides.timestamp || new Date(),
  role: overrides.role || 'user',
  content: overrides.content || 'Test message content',
  relevanceScore: overrides.relevanceScore || 0.7,
  metadata: overrides.metadata || {},
  ...overrides
});

// Task entry factory
export const createMockTaskEntry = (overrides: Partial<TaskEntry> = {}): TaskEntry => ({
  id: overrides.id || uuidv4(),
  taskType: overrides.taskType || 'analysis',
  status: overrides.status || 'completed',
  description: overrides.description || 'Test task description',
  timestamp: overrides.timestamp || new Date(),
  relevanceScore: overrides.relevanceScore || 0.8,
  metadata: overrides.metadata || {},
  result: overrides.result || null,
  ...overrides
});

// Insight entry factory
export const createMockInsightEntry = (overrides: Partial<InsightEntry> = {}): InsightEntry => ({
  id: overrides.id || uuidv4(),
  type: overrides.type || 'recommendation',
  content: overrides.content || 'Test insight content',
  confidence: overrides.confidence || 0.9,
  source: overrides.source || 'test-agent',
  timestamp: overrides.timestamp || new Date(),
  relevanceScore: overrides.relevanceScore || 0.9,
  metadata: overrides.metadata || {},
  ...overrides
});

// Memory query factory
export const createMockMemoryQuery = (overrides: Partial<MemoryQuery> = {}): MemoryQuery => ({
  tenantId: overrides.tenantId || 'test-tenant',
  userId: overrides.userId,
  sessionId: overrides.sessionId,
  agentId: overrides.agentId,
  contextTypes: overrides.contextTypes,
  relevanceThreshold: overrides.relevanceThreshold,
  limit: overrides.limit || 10,
  offset: overrides.offset || 0,
  sortBy: overrides.sortBy || 'relevanceScore',
  sortOrder: overrides.sortOrder || 'desc',
  dateRange: overrides.dateRange,
  ...overrides
});

// Tenant config factory
export const createMockTenantConfig = (overrides: Partial<TenantConfig> = {}): TenantConfig => ({
  tenantId: overrides.tenantId || 'test-tenant',
  memoryQuota: overrides.memoryQuota || 100,
  retentionPolicy: {
    conversationHistory: overrides.retentionPolicy?.conversationHistory || 7,
    userPreferences: overrides.retentionPolicy?.userPreferences || 365,
    businessContext: overrides.retentionPolicy?.businessContext || 90,
    taskHistory: overrides.retentionPolicy?.taskHistory || 30,
    insights: overrides.retentionPolicy?.insights || 180,
    ...overrides.retentionPolicy
  },
  sharingPolicy: {
    allowCrossTenant: overrides.sharingPolicy?.allowCrossTenant ?? false,
    allowCrossUser: overrides.sharingPolicy?.allowCrossUser ?? true,
    sharedContextTypes: overrides.sharingPolicy?.sharedContextTypes || ['business_analysis'],
    isolatedContextTypes: overrides.sharingPolicy?.isolatedContextTypes || ['user_profile'],
    ...overrides.sharingPolicy
  },
  encryptionEnabled: overrides.encryptionEnabled ?? true,
  ...overrides
});

// Validation helpers for memory contexts
export const validateMemoryContextStructure = (context: any) => {
  expect(context).toHaveProperty('id');
  expect(context).toHaveProperty('tenantId');
  expect(context).toHaveProperty('userId');
  expect(context).toHaveProperty('contextType');
  expect(context).toHaveProperty('content');
  expect(context).toHaveProperty('metadata');
  expect(context).toHaveProperty('relevanceScore');
  expect(context).toHaveProperty('createdAt');
  expect(context).toHaveProperty('updatedAt');

  // Validate content structure
  expect(context.content).toHaveProperty('conversationHistory');
  expect(context.content).toHaveProperty('userPreferences');
  expect(context.content).toHaveProperty('businessContext');
  expect(context.content).toHaveProperty('taskHistory');
  expect(context.content).toHaveProperty('insights');
  expect(context.content).toHaveProperty('customData');

  // Validate arrays
  expect(Array.isArray(context.content.conversationHistory)).toBe(true);
  expect(Array.isArray(context.content.taskHistory)).toBe(true);
  expect(Array.isArray(context.content.insights)).toBe(true);

  // Validate relevance score
  expect(context.relevanceScore).toBeGreaterThanOrEqual(0);
  expect(context.relevanceScore).toBeLessThanOrEqual(1);
};

export const validateConversationEntryStructure = (entry: any) => {
  expect(entry).toHaveProperty('id');
  expect(entry).toHaveProperty('timestamp');
  expect(entry).toHaveProperty('role');
  expect(entry).toHaveProperty('content');
  expect(entry).toHaveProperty('relevanceScore');
  expect(['user', 'assistant', 'system']).toContain(entry.role);
  expect(entry.relevanceScore).toBeGreaterThanOrEqual(0);
  expect(entry.relevanceScore).toBeLessThanOrEqual(1);
};

export const validateTaskEntryStructure = (entry: any) => {
  expect(entry).toHaveProperty('id');
  expect(entry).toHaveProperty('taskType');
  expect(entry).toHaveProperty('status');
  expect(entry).toHaveProperty('description');
  expect(entry).toHaveProperty('timestamp');
  expect(entry).toHaveProperty('relevanceScore');
  expect(['pending', 'in_progress', 'completed', 'failed']).toContain(entry.status);
};

export const validateInsightEntryStructure = (entry: any) => {
  expect(entry).toHaveProperty('id');
  expect(entry).toHaveProperty('type');
  expect(entry).toHaveProperty('content');
  expect(entry).toHaveProperty('confidence');
  expect(entry).toHaveProperty('source');
  expect(entry).toHaveProperty('timestamp');
  expect(entry).toHaveProperty('relevanceScore');
  expect(['recommendation', 'observation', 'prediction', 'warning']).toContain(entry.type);
  expect(entry.confidence).toBeGreaterThanOrEqual(0);
  expect(entry.confidence).toBeLessThanOrEqual(1);
};

// Common test scenarios
export const createConversationScenario = () => {
  const context = createMockMemoryContext({
    contextType: 'conversation',
    content: {
      conversationHistory: [
        createMockConversationEntry({
          role: 'user',
          content: 'Hello, I need help with my restaurant visibility',
          relevanceScore: 0.9
        }),
        createMockConversationEntry({
          role: 'assistant',
          content: 'I can help you improve your restaurant\'s online presence. Let me analyze your current situation.',
          relevanceScore: 0.8
        })
      ],
      userPreferences: createMockUserPreferences(),
      businessContext: createMockBusinessContext(),
      taskHistory: [],
      insights: [],
      customData: {}
    }
  });

  return {
    context,
    expectedRelevanceScore: 0.85, // Average of conversation entries
    expectedConversationCount: 2
  };
};

export const createTaskHistoryScenario = () => {
  const context = createMockMemoryContext({
    contextType: 'task_execution',
    content: {
      conversationHistory: [],
      userPreferences: createMockUserPreferences(),
      businessContext: createMockBusinessContext(),
      taskHistory: [
        createMockTaskEntry({
          taskType: 'visibility_analysis',
          status: 'completed',
          description: 'Analyzed restaurant online presence',
          relevanceScore: 0.9
        }),
        createMockTaskEntry({
          taskType: 'recommendation_generation',
          status: 'completed',
          description: 'Generated improvement recommendations',
          relevanceScore: 0.8
        })
      ],
      insights: [],
      customData: {}
    }
  });

  return {
    context,
    expectedTaskCount: 2,
    expectedCompletedTasks: 2
  };
};

export const createInsightScenario = () => {
  const context = createMockMemoryContext({
    contextType: 'business_analysis',
    content: {
      conversationHistory: [],
      userPreferences: createMockUserPreferences(),
      businessContext: createMockBusinessContext(),
      taskHistory: [],
      insights: [
        createMockInsightEntry({
          type: 'recommendation',
          content: 'Consider updating your Google My Business profile with recent photos',
          confidence: 0.9,
          relevanceScore: 0.85
        }),
        createMockInsightEntry({
          type: 'observation',
          content: 'Your restaurant has limited online reviews compared to competitors',
          confidence: 0.8,
          relevanceScore: 0.7
        })
      ],
      customData: {}
    }
  });

  return {
    context,
    expectedInsightCount: 2,
    expectedHighConfidenceInsights: 1
  };
};

export const createMultiContextScenario = () => {
  const tenantId = 'test-tenant';
  const userId = 'test-user';
  const sessionId = 'test-session';

  return {
    conversationContext: createMockMemoryContext({
      tenantId,
      userId,
      sessionId,
      contextType: 'conversation',
      relevanceScore: 0.8
    }),
    userProfileContext: createMockMemoryContext({
      tenantId,
      userId,
      sessionId,
      contextType: 'user_profile',
      relevanceScore: 0.9
    }),
    businessAnalysisContext: createMockMemoryContext({
      tenantId,
      userId,
      sessionId,
      contextType: 'business_analysis',
      relevanceScore: 0.85
    }),
    expectedContextCount: 3,
    expectedAverageRelevance: 0.85
  };
};

// Export all factories and helpers
export const memoryContextFactory = {
  createMockMemoryContext,
  createMockUserPreferences,
  createMockBusinessContext,
  createMockConversationEntry,
  createMockTaskEntry,
  createMockInsightEntry,
  createMockMemoryQuery,
  createMockTenantConfig,
  validateMemoryContextStructure,
  validateConversationEntryStructure,
  validateTaskEntryStructure,
  validateInsightEntryStructure,
  createConversationScenario,
  createTaskHistoryScenario,
  createInsightScenario,
  createMultiContextScenario
};