/**
 * Types for AI Cost Optimization Engine
 */

export interface CostTrackingRecord {
  id: string;
  userId: string;
  providerId: string;
  requestId: string;
  requestType: string;
  tokensUsed: number;
  cost: number;
  timestamp: string;
  metadata: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    latency: number;
    success: boolean;
  };
}

export interface CostThreshold {
  id: string;
  name: string;
  type: ThresholdType;
  scope: ThresholdScope;
  targetId?: string; // userId, providerId, or global
  period: TimePeriod;
  limit: number;
  currentUsage: number;
  warningLevel: number; // Percentage of limit to trigger warning
  enabled: boolean;
  actions: ThresholdAction[];
  createdAt: string;
  updatedAt: string;
}

export type ThresholdType = 'cost' | 'requests' | 'tokens';
export type ThresholdScope = 'global' | 'user' | 'provider' | 'request_type';
export type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface ThresholdAction {
  type: ActionType;
  parameters: Record<string, any>;
  enabled: boolean;
}

export type ActionType = 
  | 'alert'
  | 'throttle'
  | 'block_user'
  | 'block_provider'
  | 'switch_provider'
  | 'reduce_quality'
  | 'emergency_shutdown';

export interface CostPrediction {
  userId?: string;
  providerId?: string;
  period: TimePeriod;
  currentUsage: number;
  predictedUsage: number;
  confidence: number;
  factors: PredictionFactor[];
  generatedAt: string;
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1, negative means cost reduction
  confidence: number;
  description: string;
}

export interface CostOptimizationRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  parameters: Record<string, any>;
  validUntil: string;
  createdAt: string;
}

export type RecommendationType = 
  | 'switch_provider'
  | 'adjust_parameters'
  | 'batch_requests'
  | 'cache_responses'
  | 'reduce_frequency'
  | 'optimize_prompts'
  | 'use_cheaper_model';

export interface UsagePattern {
  userId?: string;
  providerId?: string;
  requestType?: string;
  pattern: {
    hourlyDistribution: number[]; // 24 hours
    dailyDistribution: number[]; // 7 days
    monthlyTrend: number[]; // Last 12 months
  };
  averageRequestCost: number;
  peakUsageHours: number[];
  seasonality: SeasonalityPattern[];
  lastUpdated: string;
}

export interface SeasonalityPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  multiplier: number;
  description: string;
}

export interface CostAlert {
  id: string;
  thresholdId: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
  affectedScope: string;
  recommendedActions: string[];
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface EmergencyShutdownConfig {
  enabled: boolean;
  globalCostLimit: number;
  timeWindow: number; // minutes
  excludedUsers: string[];
  excludedProviders: string[];
  notificationChannels: string[];
  autoReactivationDelay: number; // minutes
}

export interface CostAnalytics {
  period: TimePeriod;
  startDate: string;
  endDate: string;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  averageCostPerRequest: number;
  averageCostPerToken: number;
  costByProvider: Record<string, number>;
  costByRequestType: Record<string, number>;
  costByUser: Record<string, number>;
  topCostDrivers: Array<{
    type: 'user' | 'provider' | 'request_type';
    id: string;
    cost: number;
    percentage: number;
  }>;
  trends: {
    costTrend: number; // percentage change from previous period
    requestTrend: number;
    efficiencyTrend: number; // cost per successful request
  };
}

export interface ModelSwitchingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: ModelSwitchCondition[];
  sourceModel: string;
  targetModel: string;
  costSavings: number;
  qualityImpact: number; // -1 to 1
  priority: number;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface ModelSwitchCondition {
  type: 'cost_threshold' | 'request_type' | 'user_tier' | 'time_of_day' | 'quality_acceptable';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  weight: number; // 0-1, for weighted condition evaluation
}

export interface CostBudget {
  id: string;
  name: string;
  scope: BudgetScope;
  targetId?: string;
  period: TimePeriod;
  amount: number;
  spent: number;
  remaining: number;
  alerts: BudgetAlert[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetScope {
  type: 'global' | 'user' | 'provider' | 'request_type' | 'project';
  filters?: Record<string, any>;
}

export interface BudgetAlert {
  percentage: number; // Trigger when this percentage of budget is used
  actions: ThresholdAction[];
  triggered: boolean;
  lastTriggered?: string;
}