export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
  provider: AIProvider;
  category: TemplateCategory;
  tags: string[];
  metadata: TemplateMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
}

export interface TemplateMetadata {
  author: string;
  version: string;
  changelog: string;
  estimatedTokens: number;
  complexity: 'low' | 'medium' | 'high';
  usageContext: string[];
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  status: VersionStatus;
  environment: Environment;
  approvalWorkflow: ApprovalWorkflow;
  performanceMetrics: PerformanceMetrics;
  abTestConfig?: ABTestConfig;
  createdAt: string;
  deployedAt?: string;
  rollbackInfo?: RollbackInfo;
}

export interface ApprovalWorkflow {
  id: string;
  templateVersionId: string;
  status: ApprovalStatus;
  stages: ApprovalStage[];
  currentStage: number;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  comments: ApprovalComment[];
}

export interface ApprovalStage {
  id: string;
  name: string;
  approvers: string[];
  requiredApprovals: number;
  approvals: Approval[];
  status: ApprovalStageStatus;
  deadline?: string;
  autoApprove?: boolean;
}

export interface Approval {
  approverId: string;
  status: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp: string;
}

export interface ApprovalComment {
  id: string;
  userId: string;
  comment: string;
  timestamp: string;
  type: 'general' | 'change_request' | 'approval' | 'rejection';
}

export interface PerformanceMetrics {
  templateVersionId: string;
  totalExecutions: number;
  successRate: number;
  averageResponseTime: number;
  averageTokenUsage: number;
  errorRate: number;
  userSatisfactionScore?: number;
  costPerExecution: number;
  lastUpdated: string;
  detailedMetrics: DetailedMetrics;
}

export interface DetailedMetrics {
  executionsByDay: Record<string, number>;
  responseTimePercentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errorsByType: Record<string, number>;
  tokenUsageDistribution: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  geographicDistribution: Record<string, number>;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficSplit: Record<string, number>;
  startDate: string;
  endDate?: string;
  status: ABTestStatus;
  successMetrics: SuccessMetric[];
  hypothesis: string;
  results?: ABTestResults;
  createdAt: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  templateVersionId: string;
  trafficPercentage: number;
  description: string;
}

export interface SuccessMetric {
  name: string;
  type: 'conversion_rate' | 'response_time' | 'user_satisfaction' | 'cost_efficiency' | 'error_rate';
  target: number;
  weight: number;
  description: string;
}

export interface ABTestResults {
  testId: string;
  status: 'running' | 'completed' | 'stopped';
  duration: number;
  totalParticipants: number;
  variantResults: VariantResult[];
  winningVariant?: string;
  confidenceLevel: number;
  statisticalSignificance: boolean;
  recommendations: string[];
  completedAt?: string;
}

export interface VariantResult {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  averageResponseTime: number;
  errorRate: number;
  userSatisfactionScore: number;
  costPerExecution: number;
  metrics: Record<string, number>;
}

export interface RollbackInfo {
  id: string;
  templateVersionId: string;
  previousVersionId: string;
  reason: string;
  triggeredBy: string;
  triggeredAt: string;
  rollbackType: 'manual' | 'automatic' | 'emergency';
  affectedEnvironments: Environment[];
  rollbackDuration: number;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
}

export interface TemplateExecution {
  id: string;
  templateVersionId: string;
  userId?: string;
  sessionId?: string;
  input: Record<string, any>;
  output: string;
  provider: AIProvider;
  tokenUsage: TokenUsage;
  responseTime: number;
  status: ExecutionStatus;
  error?: ExecutionError;
  timestamp: string;
  environment: Environment;
  abTestVariant?: string;
  metadata: ExecutionMetadata;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

export interface ExecutionMetadata {
  userAgent?: string;
  ipAddress?: string;
  region?: string;
  persona?: string;
  requestId: string;
  traceId?: string;
}

export type AIProvider = 'claude' | 'gemini' | 'gpt' | 'custom';
export type TemplateCategory = 'analysis' | 'generation' | 'classification' | 'summarization' | 'translation' | 'custom';
export type Environment = 'development' | 'staging' | 'production';
export type VersionStatus = 'draft' | 'pending_approval' | 'approved' | 'deployed' | 'deprecated' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalStageStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped';
export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
export type ExecutionStatus = 'success' | 'error' | 'timeout' | 'cancelled';

export interface TemplateLifecycleRequest {
  action: 'create' | 'update' | 'approve' | 'deploy' | 'rollback' | 'archive' | 'test' | 'metrics';
  templateId?: string;
  versionId?: string;
  data?: any;
  environment?: Environment;
  userId: string;
  metadata?: Record<string, any>;
}

export interface TemplateLifecycleResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface TemplateSearchQuery {
  query?: string;
  category?: TemplateCategory;
  provider?: AIProvider;
  status?: VersionStatus;
  environment?: Environment;
  tags?: string[];
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'usage_count' | 'performance_score';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateAnalytics {
  templateId: string;
  timeRange: {
    start: string;
    end: string;
  };
  totalExecutions: number;
  uniqueUsers: number;
  averagePerformance: PerformanceMetrics;
  trendData: TrendDataPoint[];
  topVariants: VariantPerformance[];
  recommendations: AnalyticsRecommendation[];
}

export interface TrendDataPoint {
  date: string;
  executions: number;
  successRate: number;
  averageResponseTime: number;
  cost: number;
}

export interface VariantPerformance {
  variantId: string;
  name: string;
  executions: number;
  performanceScore: number;
  conversionRate: number;
}

export interface AnalyticsRecommendation {
  type: 'performance' | 'cost' | 'usage' | 'quality';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: string;
}