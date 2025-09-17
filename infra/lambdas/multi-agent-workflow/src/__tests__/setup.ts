/**
 * Test setup for Multi-Agent Workflow tests
 */

import { jest } from '@jest/globals';
import {
  AgentDefinition,
  AgentPerformanceMetrics,
  AgentType,
  WorkflowExecution,
  AgentConfiguration,
  CommunicationProtocol,
  AgentMemoryConfig
} from '../types';

// AWS SDK mocks are handled by moduleNameMapper in jest.config.js

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

// --- Performance defaults ---
const defaultPerformance: AgentPerformanceMetrics = {
  averageResponseTime: 50,
  successRate: 0.95,
  qualityScore: 0.9,
  costEfficiency: 10,
  collaborationScore: 0.9, // <- NEU
  lastUpdated: new Date(),
};

// --- Base Agent (schlank & streng) ---
const baseAgent: AgentDefinition = {
  id: 'test-agent',
  name: 'Test Agent',
  type: 'analysis_agent' as AgentType,
  capabilities: [
    { 
      name: 'text_analysis',
      type: 'text_analysis', 
      inputTypes: ['text'],
      outputTypes: ['json'],
      processingTime: 1000,
      accuracy: 0.9,
      costPerOperation: 0.00005
    } as any,
  ] as any, // content_generation NICHT default, Tests überschreiben es bei Bedarf
  
  specialization: {
    domain: 'generic',
    expertise: ['analysis', 'formal'],
    qualityThresholds: [],
    languages: ['en', 'de'],
    outputFormats: ['text', 'json'],
  },
  
  performanceMetrics: defaultPerformance,
  
  // Passe die Felder 1:1 an eure Typen an (siehe types.ts):
  configuration: {
    aiProvider: 'claude',
    model: 'claude-3-5-sonnet',
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'Test prompt',
    contextWindow: 8000,
    responseFormat: 'json',
    safetySettings: {
      contentFiltering: true,
      biasDetection: true,
      factualityCheck: true,
      toxicityThreshold: 0.1,
      privacyProtection: true
    }
  } as AgentConfiguration,
  
  communicationProtocols: [
    // min. ein gültiges Protokoll laut eurem Typ
    { 
      type: 'direct',
      format: 'json',
      encryption: false,
      compression: false,
      acknowledgment: true
    } as CommunicationProtocol,
  ],
  
  memoryConfig: {
    enabled: true,
    retentionPeriod: 14, // in days
    contextTypes: ['execution'],
    sharingPolicy: {
      allowCrossAgent: false,
      allowCrossWorkflow: false,
      sharedContextTypes: [],
      isolatedContextTypes: ['execution']
    },
    compressionEnabled: false,
  } as AgentMemoryConfig,
};

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset environment variables
  process.env.AWS_REGION = 'us-east-1';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Fabriken - sowohl global als auch exportiert
export const createMockAgentDefinition = (overrides?: Partial<AgentDefinition>): AgentDefinition => ({
  ...baseAgent,
  ...overrides,
  specialization: { ...baseAgent.specialization, ...(overrides?.specialization as any) },
  performanceMetrics: { ...defaultPerformance, ...(overrides?.performanceMetrics as any) },
  configuration: { ...baseAgent.configuration, ...(overrides?.configuration as any) },
  memoryConfig: { ...baseAgent.memoryConfig, ...(overrides?.memoryConfig as any) },
  communicationProtocols: overrides?.communicationProtocols ?? baseAgent.communicationProtocols,
});

export const createMockWorkflowExecution = (overrides?: Partial<WorkflowExecution>): WorkflowExecution => ({
  id: 'exec-1', // default id
  workflowId: 'wf-1',
  status: 'running',
  inputs: {},
  outputs: {},
  steps: [],
  agents: [],
  startTime: new Date(),
  totalCost: 0,
  errorDetails: [],
  metadata: {
    userId: 'u1',
    tenantId: 't1',
    priority: 'normal',
    tags: ['test'],
    childExecutionIds: [],
    humanReviewRequired: false,
    qualityGates: [],
  },
  ...overrides,
});

// Auch global für Kompatibilität
globalThis.createMockAgentDefinition = createMockAgentDefinition;
globalThis.createMockWorkflowExecution = createMockWorkflowExecution;

// Global test utilities
global.createMockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return mockDate;
};

// Extend global namespace for TypeScript
declare global {
  var createMockDate: (dateString: string) => Date;
  var createMockWorkflowExecution: (overrides?: Partial<WorkflowExecution>) => WorkflowExecution;
  var createMockAgentDefinition: (overrides?: Partial<AgentDefinition>) => AgentDefinition;
}