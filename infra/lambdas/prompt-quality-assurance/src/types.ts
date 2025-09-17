import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Core Types
export interface PromptExecution {
  id: string;
  templateId: string;
  templateVersion: string;
  prompt: string;
  output: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  executionTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  metadata: Record<string, any>;
}

export interface QualityMetrics {
  relevanceScore: number;
  coherenceScore: number;
  completenessScore: number;
  accuracyScore: number;
  userSatisfactionScore?: number;
  overallScore: number;
  confidence: number;
}

export interface UserFeedback {
  executionId: string;
  userId: string;
  rating: number; // 1-5 scale
  feedback: string;
  feedbackType: 'positive' | 'negative' | 'neutral';
  timestamp: string;
  categories: string[];
}

export interface PromptAuditRecord {
  id: string;
  executionId: string;
  templateId: string;
  templateVersion: string;
  prompt: string;
  output: string;
  qualityMetrics: QualityMetrics;
  userFeedback?: UserFeedback;
  performanceMetrics: {
    responseTime: number;
    tokenEfficiency: number;
    costPerToken: number;
    successRate: number;
  };
  contextData: {
    persona?: string;
    useCase: string;
    businessContext: Record<string, any>;
  };
  timestamp: string;
  auditVersion: string;
}

export interface OptimizationRecommendation {
  id: string;
  templateId: string;
  recommendationType: 'performance' | 'quality' | 'cost' | 'user_experience';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedChanges: {
    promptModifications?: string[];
    parameterAdjustments?: Record<string, any>;
    structuralChanges?: string[];
  };
  expectedImpact: {
    qualityImprovement: number;
    performanceGain: number;
    costReduction: number;
    userSatisfactionIncrease: number;
  };
  confidence: number;
  basedOnData: {
    executionCount: number;
    timeRange: string;
    userFeedbackCount: number;
  };
  timestamp: string;
}

export interface TestCase {
  id: string;
  templateId: string;
  name: string;
  description: string;
  inputData: Record<string, any>;
  expectedOutputCriteria: {
    minQualityScore: number;
    maxTokens: number;
    maxResponseTime: number;
    requiredElements: string[];
    forbiddenElements: string[];
  };
  testType: 'functional' | 'performance' | 'quality' | 'regression';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  executionId: string;
  status: 'passed' | 'failed' | 'warning';
  actualOutput: string;
  qualityMetrics: QualityMetrics;
  performanceMetrics: {
    responseTime: number;
    tokenUsage: number;
  };
  failureReasons?: string[];
  timestamp: string;
}

export interface ValidationFramework {
  id: string;
  name: string;
  description: string;
  rules: ValidationRule[];
  isActive: boolean;
  applicableTemplates: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'content' | 'structure' | 'performance' | 'safety';
  condition: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  autoFix?: boolean;
}

// API Types
export interface CreateAuditRecordRequest {
  execution: PromptExecution;
  qualityMetrics?: QualityMetrics;
  userFeedback?: UserFeedback;
  contextData?: Record<string, any>;
}

export interface GetAuditTrailRequest {
  templateId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyzeQualityRequest {
  executionId?: string;
  templateId?: string;
  prompt: string;
  output: string;
  contextData?: Record<string, any>;
}

export interface GenerateRecommendationsRequest {
  templateId: string;
  timeRange?: string;
  minExecutions?: number;
  includeUserFeedback?: boolean;
}

export interface RunTestSuiteRequest {
  templateId?: string;
  testType?: string;
  frameworkId?: string;
}

// Response Types
export interface QualityAssuranceResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    timestamp: string;
    version: string;
  };
}

// Lambda Handler Types
export type QualityAssuranceHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

// Configuration Types
export interface QualityAssuranceConfig {
  dynamoTableName: string;
  cloudWatchNamespace: string;
  qualityThresholds: {
    minimum: number;
    good: number;
    excellent: number;
  };
  testingConfig: {
    maxConcurrentTests: number;
    defaultTimeout: number;
    retryAttempts: number;
  };
  optimizationConfig: {
    minDataPoints: number;
    confidenceThreshold: number;
    updateFrequency: string;
  };
}

// Error Types
export class QualityAssuranceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'QualityAssuranceError';
  }
}

export class ValidationError extends QualityAssuranceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class TestExecutionError extends QualityAssuranceError {
  constructor(message: string) {
    super(message, 'TEST_EXECUTION_ERROR', 500);
    this.name = 'TestExecutionError';
  }
}