/**
 * Context Factory for Standardized Test Object Creation
 * 
 * This factory provides consistent, realistic test objects across all test suites.
 * It includes validation helpers and common test scenarios to reduce duplication
 * and improve test reliability.
 */

import { v4 as uuidv4 } from 'uuid';

// Template factory with realistic defaults
export const createMockTemplate = (overrides: any = {}) => ({
  id: overrides.id || uuidv4(),
  name: overrides.name || 'Test Template',
  description: overrides.description || 'A test template for validation',
  content: overrides.content || 'Hello {{name}}! Welcome to {{business_name}}.',
  variables: overrides.variables || [
    {
      name: 'name',
      type: 'string' as const,
      required: true,
      description: 'User name',
      defaultValue: 'Guest'
    },
    {
      name: 'business_name',
      type: 'string' as const,
      required: false,
      description: 'Business name',
      defaultValue: 'Our Business'
    }
  ],
  provider: overrides.provider || 'claude' as const,
  category: overrides.category || 'generation' as const,
  tags: overrides.tags || ['test', 'validation'],
  metadata: {
    author: overrides.metadata?.author || 'test-user',
    version: overrides.metadata?.version || '1.0.0',
    changelog: overrides.metadata?.changelog || 'Initial version',
    estimatedTokens: overrides.metadata?.estimatedTokens || 50,
    complexity: overrides.metadata?.complexity || 'low' as const,
    usageContext: overrides.metadata?.usageContext || ['testing', 'validation'],
    ...overrides.metadata
  },
  createdAt: overrides.createdAt || new Date().toISOString(),
  updatedAt: overrides.updatedAt || new Date().toISOString(),
  ...overrides
});

// Version factory with realistic workflow states
export const createMockVersion = (overrides: any = {}) => {
  const versionId = overrides.id || uuidv4();
  const templateId = overrides.templateId || uuidv4();
  
  return {
    id: versionId,
    templateId,
    version: overrides.version || '1.0.0',
    content: overrides.content || 'Hello {{name}}! Welcome to {{business_name}}.',
    variables: overrides.variables || [
      {
        name: 'name',
        type: 'string' as const,
        required: true,
        description: 'User name',
        defaultValue: 'Guest'
      },
      {
        name: 'business_name',
        type: 'string' as const,
        required: false,
        description: 'Business name',
        defaultValue: 'Our Business'
      }
    ],
    metadata: {
      author: overrides.metadata?.author || 'test-user',
      version: overrides.metadata?.version || '1.0.0',
      changelog: overrides.metadata?.changelog || 'Initial version',
      estimatedTokens: overrides.metadata?.estimatedTokens || 50,
      complexity: overrides.metadata?.complexity || 'low' as const,
      usageContext: overrides.metadata?.usageContext || ['testing'],
      ...overrides.metadata
    },
    status: overrides.status || 'draft' as const,
    environment: overrides.environment || 'development' as const,
    approvalWorkflow: overrides.approvalWorkflow || createMockApprovalWorkflow({
      templateVersionId: versionId,
      ...overrides.approvalWorkflowOverrides
    }),
    performanceMetrics: overrides.performanceMetrics || createMockPerformanceMetrics({
      templateVersionId: versionId,
      ...overrides.performanceMetricsOverrides
    }),
    rollbackInfo: overrides.rollbackInfo || null,
    createdAt: overrides.createdAt || new Date().toISOString(),
    ...overrides
  };
};

// Approval workflow factory with realistic stages
export const createMockApprovalWorkflow = (overrides: any = {}) => ({
  id: overrides.id || uuidv4(),
  templateVersionId: overrides.templateVersionId || uuidv4(),
  status: overrides.status || 'pending' as const,
  stages: overrides.stages || [
    {
      id: uuidv4(),
      name: 'Technical Review',
      approvers: ['tech-lead', 'senior-dev'],
      requiredApprovals: 1,
      approvals: [],
      status: 'pending' as const,
      autoApprove: false,
      timeoutHours: 24
    },
    {
      id: uuidv4(),
      name: 'Security Review',
      approvers: ['security-team'],
      requiredApprovals: 1,
      approvals: [],
      status: 'pending' as const,
      autoApprove: false,
      timeoutHours: 48
    }
  ],
  currentStage: overrides.currentStage || 0,
  requestedBy: overrides.requestedBy || 'test-user',
  requestedAt: overrides.requestedAt || new Date().toISOString(),
  completedAt: overrides.completedAt || null,
  comments: overrides.comments || [],
  ...overrides
});

// Performance metrics factory with realistic data
export const createMockPerformanceMetrics = (overrides: any = {}) => ({
  templateVersionId: overrides.templateVersionId || uuidv4(),
  totalExecutions: overrides.totalExecutions || 100,
  successRate: overrides.successRate || 95.5,
  averageResponseTime: overrides.averageResponseTime || 1200,
  averageTokenUsage: overrides.averageTokenUsage || 50,
  errorRate: overrides.errorRate || 4.5,
  costPerExecution: overrides.costPerExecution || 0.002,
  lastUpdated: overrides.lastUpdated || new Date().toISOString(),
  detailedMetrics: {
    executionsByDay: overrides.detailedMetrics?.executionsByDay || {
      [new Date().toISOString().split('T')[0]]: 100
    },
    responseTimePercentiles: overrides.detailedMetrics?.responseTimePercentiles || {
      p50: 1000,
      p90: 1500,
      p95: 1800,
      p99: 2500
    },
    errorsByType: overrides.detailedMetrics?.errorsByType || {
      'timeout': 3,
      'validation': 2
    },
    tokenUsageDistribution: overrides.detailedMetrics?.tokenUsageDistribution || {
      min: 20,
      max: 80,
      avg: 50,
      median: 45
    },
    geographicDistribution: overrides.detailedMetrics?.geographicDistribution || {
      'eu-central-1': 100
    },
    ...overrides.detailedMetrics
  },
  ...overrides
});

// Execution factory with realistic scenarios
export const createMockExecution = (overrides: Partial<any> = {}) => ({
  id: overrides.id ?? uuidv4(),
  abTestId: overrides.abTestId ?? uuidv4(),
  abTestVariant: overrides.abTestVariant ?? 'control',
  status: overrides.status ?? 'success', // 'success' | 'error'
  responseTime: overrides.responseTime ?? 900,
  timestamp: overrides.timestamp ?? new Date().toISOString(),
  // beliebige zusätzliche Felder erlaubt:
  templateVersionId: overrides.templateVersionId || uuidv4(),
  userId: overrides.userId || 'user-123',
  sessionId: overrides.sessionId || 'session-123',
  input: overrides.input || { name: 'Test User', business_name: 'Test Restaurant' },
  output: overrides.output || 'Hello Test User! Welcome to Test Restaurant.',
  provider: overrides.provider || 'claude' as const,
  tokenUsage: {
    inputTokens: overrides.tokenUsage?.inputTokens || 15,
    outputTokens: overrides.tokenUsage?.outputTokens || 8,
    totalTokens: overrides.tokenUsage?.totalTokens || 23,
    cost: overrides.tokenUsage?.cost || 0.0015,
    ...overrides.tokenUsage
  },
  environment: overrides.environment || 'development' as const,
  metadata: {
    userAgent: overrides.metadata?.userAgent || 'test-agent/1.0',
    ipAddress: overrides.metadata?.ipAddress || '127.0.0.1',
    region: overrides.metadata?.region || 'eu-central-1',
    persona: overrides.metadata?.persona || 'test-persona',
    requestId: overrides.metadata?.requestId || uuidv4(),
    ...overrides.metadata
  },
  error: overrides.error || null,
  ...overrides
});

// ==== AB TEST FACTORY (for prompt-template-lifecycle) ====
type ABTestStatus = 'draft' | 'running' | 'completed' | 'archived';

// A/B Test factory with realistic configurations
export const createMockABTest = (overrides: Partial<any> = {}) => {
  const now = new Date().toISOString();
  const controlVersion = createMockVersion().id;
  const variantVersion = createMockVersion().id;

  return {
    id: overrides.id ?? uuidv4(),
    name: overrides.name ?? 'A/B Test',
    description: overrides.description ?? '',
    status: (overrides.status ?? 'draft') as ABTestStatus,
    variants: overrides.variants ?? [
      { id: 'control', name: 'Control', templateVersionId: controlVersion, trafficPercentage: 50, description: '' },
      { id: 'variant-a', name: 'Variant A', templateVersionId: variantVersion, trafficPercentage: 50, description: '' },
    ],
    trafficSplit: overrides.trafficSplit ?? { control: 50, 'variant-a': 50 },
    successMetrics: overrides.successMetrics ?? [
      {
        name: 'response_time',
        type: 'response_time' as const,
        target: 1000,
        weight: 0.6,
        description: 'Average response time in milliseconds'
      },
      {
        name: 'conversion_rate',
        type: 'conversion_rate' as const,
        target: 95,
        weight: 0.4,
        description: 'Success rate percentage'
      }
    ],
    hypothesis: overrides.hypothesis ?? 'Hypothesis',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    results: overrides.results,
    ...overrides,
  };
};

// Rollback info factory
export const createMockRollbackInfo = (overrides: any = {}) => ({
  id: overrides.id || uuidv4(),
  templateVersionId: overrides.templateVersionId || uuidv4(),
  previousVersionId: overrides.previousVersionId || uuidv4(),
  reason: overrides.reason || 'Performance degradation detected',
  triggeredBy: overrides.triggeredBy || 'admin-user',
  triggeredAt: overrides.triggeredAt || new Date().toISOString(),
  rollbackType: overrides.rollbackType || 'manual' as const,
  affectedEnvironments: overrides.affectedEnvironments || ['production'],
  rollbackDuration: overrides.rollbackDuration || 30000,
  status: overrides.status || 'completed' as const,
  completedAt: overrides.completedAt || new Date().toISOString(),
  ...overrides
});

// Validation helpers for common test scenarios
export const validateTemplateStructure = (template: any) => {
  expect(template).toHaveProperty('id');
  expect(template).toHaveProperty('name');
  expect(template).toHaveProperty('content');
  expect(template).toHaveProperty('variables');
  expect(template).toHaveProperty('provider');
  expect(template).toHaveProperty('metadata');
  expect(template.variables).toBeInstanceOf(Array);
  expect(template.metadata).toHaveProperty('author');
  expect(template.metadata).toHaveProperty('version');
};

export const validateVersionStructure = (version: any) => {
  expect(version).toHaveProperty('id');
  expect(version).toHaveProperty('templateId');
  expect(version).toHaveProperty('version');
  expect(version).toHaveProperty('status');
  expect(version).toHaveProperty('environment');
  expect(version).toHaveProperty('approvalWorkflow');
  expect(version).toHaveProperty('performanceMetrics');
};

export const validateExecutionStructure = (execution: any) => {
  expect(execution).toHaveProperty('id');
  expect(execution).toHaveProperty('templateVersionId');
  expect(execution).toHaveProperty('userId');
  expect(execution).toHaveProperty('status');
  expect(execution).toHaveProperty('tokenUsage');
  expect(execution).toHaveProperty('responseTime');
  expect(execution).toHaveProperty('timestamp');
  expect(execution.tokenUsage).toHaveProperty('totalTokens');
  expect(execution.tokenUsage).toHaveProperty('cost');
};

export const validateABTestStructure = (abTest: any) => {
  expect(abTest).toHaveProperty('id');
  expect(abTest).toHaveProperty('name');
  expect(abTest).toHaveProperty('variants');
  expect(abTest).toHaveProperty('trafficSplit');
  expect(abTest).toHaveProperty('successMetrics');
  expect(abTest.variants).toBeInstanceOf(Array);
  expect(abTest.successMetrics).toBeInstanceOf(Array);
};

// Common test scenarios
export const createSuccessfulExecutionScenario = () => ({
  execution: createMockExecution({
    status: 'success',
    responseTime: 800,
    tokenUsage: { totalTokens: 25, cost: 0.001 }
  }),
  expectedMetrics: {
    successRate: 100,
    averageResponseTime: 800,
    averageTokenUsage: 25
  }
});

export const createFailedExecutionScenario = () => ({
  execution: createMockExecution({
    status: 'error',
    error: {
      code: 'timeout',
      message: 'Request timeout after 30 seconds'
    },
    responseTime: 30000
  }),
  expectedMetrics: {
    successRate: 0,
    errorRate: 100
  }
});

export const createApprovalWorkflowScenario = () => ({
  pendingWorkflow: createMockApprovalWorkflow({
    status: 'pending',
    currentStage: 0
  }),
  approvedWorkflow: createMockApprovalWorkflow({
    status: 'approved',
    currentStage: 2,
    completedAt: new Date().toISOString()
  }),
  rejectedWorkflow: createMockApprovalWorkflow({
    status: 'rejected',
    currentStage: 0,
    completedAt: new Date().toISOString(),
    comments: [{
      id: uuidv4(),
      userId: 'tech-lead',
      comment: 'Security concerns identified',
      type: 'rejection',
      timestamp: new Date().toISOString()
    }]
  })
});

// Export all factories and helpers
export const contextFactory = {
  createMockTemplate,
  createMockVersion,
  createMockApprovalWorkflow,
  createMockPerformanceMetrics,
  createMockExecution,
  createMockABTest,
  createMockRollbackInfo,
  validateTemplateStructure,
  validateVersionStructure,
  validateExecutionStructure,
  validateABTestStructure,
  createSuccessfulExecutionScenario,
  createFailedExecutionScenario,
  createApprovalWorkflowScenario
};