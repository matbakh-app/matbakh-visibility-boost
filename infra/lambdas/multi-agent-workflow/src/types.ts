/**
 * Multi-Agent Workflow Orchestration Types
 * Comprehensive type definitions for agentic AI workflow system
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: WorkflowCategory;
  steps: WorkflowStep[];
  agents: AgentDefinition[];
  decisionTrees: DecisionTree[];
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowCategory = 
  | 'business_analysis'
  | 'content_generation'
  | 'customer_support'
  | 'data_processing'
  | 'quality_assurance'
  | 'research_analysis'
  | 'custom';

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  agentId: string;
  inputs: StepInput[];
  outputs: StepOutput[];
  conditions: StepCondition[];
  timeout: number; // in seconds
  retryPolicy: RetryPolicy;
  dependencies: string[]; // step IDs that must complete first
  parallelExecution: boolean;
  metadata: Record<string, any>;
}

export type StepType = 
  | 'analysis'
  | 'generation'
  | 'validation'
  | 'transformation'
  | 'decision'
  | 'aggregation'
  | 'notification'
  | 'human_review';

export interface StepInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  source: InputSource;
  required: boolean;
  validation?: ValidationRule[];
  transformation?: TransformationRule[];
}

export interface StepOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  destination: OutputDestination;
  format?: OutputFormat;
  validation?: ValidationRule[];
}

export interface InputSource {
  type: 'workflow_input' | 'step_output' | 'agent_memory' | 'external_api' | 'constant';
  reference: string;
  path?: string; // JSONPath for nested data
}

export interface OutputDestination {
  type: 'workflow_output' | 'step_input' | 'agent_memory' | 'external_api' | 'notification';
  reference: string;
  path?: string;
}

export interface StepCondition {
  type: 'success' | 'failure' | 'timeout' | 'custom';
  expression: string; // JavaScript expression
  action: ConditionAction;
}

export interface ConditionAction {
  type: 'continue' | 'skip' | 'retry' | 'fail' | 'branch' | 'notify';
  target?: string; // step ID for branching
  parameters?: Record<string, any>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number; // in milliseconds
  maxDelay: number;
  retryableErrors: string[];
  timeoutMs?: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  type: AgentType;
  specialization: AgentSpecialization;
  capabilities: AgentCapability[];
  configuration: AgentConfiguration;
  memoryConfig: AgentMemoryConfig;
  communicationProtocols: CommunicationProtocol[];
  performanceMetrics: AgentPerformanceMetrics;
}

export type AgentType = 
  | 'analysis_agent'
  | 'content_agent'
  | 'recommendation_agent'
  | 'validation_agent'
  | 'coordination_agent'
  | 'specialist_agent';

export interface AgentSpecialization {
  domain: string; // e.g., 'restaurant_analysis', 'content_creation'
  expertise: string[]; // specific skills
  languages: string[];
  outputFormats: string[];
  qualityThresholds: QualityThreshold[];
}

export interface AgentCapability {
  name: string;
  type: CapabilityType;
  inputTypes: string[];
  outputTypes: string[];
  processingTime: number; // average in milliseconds
  accuracy: number; // 0-1 score
  costPerOperation: number;
}

export type CapabilityType = 
  | 'text_analysis'
  | 'content_generation'
  | 'data_extraction'
  | 'quality_assessment'
  | 'decision_making'
  | 'coordination'
  | 'validation';

export interface AgentConfiguration {
  aiProvider: string; // 'claude', 'gemini', etc.
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  contextWindow: number;
  responseFormat: 'text' | 'json' | 'structured';
  safetySettings: SafetySettings;
}

export interface SafetySettings {
  contentFiltering: boolean;
  biasDetection: boolean;
  factualityCheck: boolean;
  toxicityThreshold: number;
  privacyProtection: boolean;
}

export interface AgentMemoryConfig {
  enabled: boolean;
  retentionPeriod: number; // in days
  contextTypes: string[];
  sharingPolicy: MemorySharingPolicy;
  compressionEnabled: boolean;
}

export interface MemorySharingPolicy {
  allowCrossAgent: boolean;
  allowCrossWorkflow: boolean;
  sharedContextTypes: string[];
  isolatedContextTypes: string[];
}

export interface CommunicationProtocol {
  type: 'direct' | 'message_queue' | 'event_driven' | 'consensus';
  format: 'json' | 'xml' | 'natural_language';
  encryption: boolean;
  compression: boolean;
  acknowledgment: boolean;
}

export interface AgentPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  qualityScore: number;
  costEfficiency: number;
  collaborationScore: number;
  lastUpdated: Date;
}

export interface DecisionTree {
  id: string;
  name: string;
  rootNode: DecisionNode;
  variables: DecisionVariable[];
  outcomes: DecisionOutcome[];
}

export interface DecisionNode {
  id: string;
  type: 'condition' | 'action' | 'leaf';
  condition?: string; // JavaScript expression
  trueNode?: string; // node ID
  falseNode?: string; // node ID
  action?: DecisionAction;
  confidence?: number;
}

export interface DecisionVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  source: string; // where to get the value
  defaultValue?: any;
}

export interface DecisionOutcome {
  id: string;
  name: string;
  description: string;
  actions: DecisionAction[];
  probability?: number;
}

export interface DecisionAction {
  type: 'assign_agent' | 'modify_workflow' | 'send_notification' | 'escalate' | 'terminate';
  parameters: Record<string, any>;
}

export interface WorkflowMetadata {
  author: string;
  tags: string[];
  businessDomain: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedDuration: number; // in minutes
  costEstimate: number;
  successRate: number;
  usageCount: number;
  lastUsed?: Date;
  maxConcurrentSteps?: number;
  allowCustomExpressions?: boolean;
}

// Execution Types

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  steps: StepExecution[];
  agents: AgentExecution[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalCost: number;
  qualityScore?: number;
  errorDetails?: ExecutionError[];
  metadata: ExecutionMetadata;
}

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface StepExecution {
  stepId: string;
  agentId: string;
  status: ExecutionStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  attempts: number;
  cost: number;
  qualityScore?: number;
  errorDetails?: ExecutionError[];
}

export interface AgentExecution {
  agentId: string;
  status: ExecutionStatus;
  assignedSteps: string[];
  completedSteps: string[];
  totalProcessingTime: number;
  totalCost: number;
  averageQualityScore: number;
  communicationLog: CommunicationEntry[];
  memoryUpdates: MemoryUpdate[];
}

export interface CommunicationEntry {
  id: string;
  fromAgent: string;
  toAgent: string;
  messageType: 'request' | 'response' | 'notification' | 'coordination';
  content: any;
  timestamp: Date;
  acknowledged: boolean;
}

export interface MemoryUpdate {
  contextId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

export interface ExecutionError {
  stepId?: string;
  agentId?: string;
  errorType: string;
  errorMessage: string;
  errorCode?: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}

export interface ExecutionMetadata {
  userId: string;
  tenantId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  parentExecutionId?: string;
  childExecutionIds: string[];
  humanReviewRequired: boolean;
  qualityGates: QualityGate[];
}

export interface QualityGate {
  id: string;
  name: string;
  threshold: number;
  metric: string;
  status: 'pending' | 'passed' | 'failed';
  actualValue?: number;
  timestamp?: Date;
}

export interface QualityThreshold {
  metric: string;
  minValue?: number;
  maxValue?: number;
  target?: number;
  weight: number;
}

// Validation and Transformation Types

export interface ValidationRule {
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  parameters: Record<string, any>;
  errorMessage: string;
}

export interface TransformationRule {
  type: 'map' | 'filter' | 'aggregate' | 'format' | 'custom';
  parameters: Record<string, any>;
}

export interface OutputFormat {
  type: 'json' | 'xml' | 'csv' | 'text' | 'html' | 'markdown';
  schema?: string;
  template?: string;
}

// Event Types for Lambda

export interface WorkflowEvent {
  action: 'create' | 'execute' | 'pause' | 'resume' | 'cancel' | 'status' | 'list';
  workflowId?: string;
  executionId?: string;
  definition?: WorkflowDefinition;
  inputs?: Record<string, any>;
  filters?: WorkflowFilters;
  tenantId: string;
  userId: string;
}

export interface WorkflowFilters {
  category?: WorkflowCategory;
  status?: ExecutionStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  agentIds?: string[];
}

export interface WorkflowResponse {
  success: boolean;
  data?: WorkflowExecution | WorkflowExecution[] | WorkflowDefinition | WorkflowDefinition[];
  error?: string;
  metadata?: {
    totalCount?: number;
    executionTime?: number;
    cost?: number;
    qualityScore?: number;
  };
}

// Error Types

export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(workflowId: string) {
    super(`Workflow not found: ${workflowId}`, 'WORKFLOW_NOT_FOUND', 404);
  }
}

export class ExecutionNotFoundError extends WorkflowError {
  constructor(executionId: string) {
    super(`Execution not found: ${executionId}`, 'EXECUTION_NOT_FOUND', 404);
  }
}

export class AgentNotAvailableError extends WorkflowError {
  constructor(agentId: string) {
    super(`Agent not available: ${agentId}`, 'AGENT_NOT_AVAILABLE', 503);
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(details: string) {
    super(`Workflow validation failed: ${details}`, 'VALIDATION_ERROR', 400);
  }
}

export class ExecutionTimeoutError extends WorkflowError {
  constructor(message: string) {
    super(message, 'EXECUTION_TIMEOUT', 408);
  }
}