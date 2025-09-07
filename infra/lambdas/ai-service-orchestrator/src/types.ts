/**
 * Types for AI Service Orchestration System
 */

export interface AIRequest {
  id: string;
  userId: string;
  type: AIRequestType;
  prompt: string;
  context?: Record<string, any>;
  constraints?: AIConstraints;
  preferences?: AIPreferences;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type AIRequestType = 
  | 'text_generation'
  | 'analysis'
  | 'translation'
  | 'summarization'
  | 'classification'
  | 'extraction'
  | 'conversation';

export interface AIConstraints {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json' | 'structured';
  safetyLevel?: 'strict' | 'moderate' | 'permissive';
}

export interface AIPreferences {
  preferredProviders?: string[];
  excludedProviders?: string[];
  maxCostPerRequest?: number;
  maxLatency?: number;
  qualityThreshold?: number;
}

export interface AIResponse {
  id: string;
  requestId: string;
  providerId: string;
  content: string;
  metadata: {
    tokensUsed: number;
    cost: number;
    latency: number;
    model: string;
    finishReason: string;
    confidence?: number;
    safetyScores?: Record<string, number>;
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  status: ProviderStatus;
  capabilities: AICapability[];
  pricing: ProviderPricing;
  performance: ProviderPerformance;
  configuration: ProviderConfiguration;
  healthCheck: ProviderHealthCheck;
}

export type AIProviderType = 'claude' | 'gemini' | 'openai' | 'custom';

export type ProviderStatus = 'active' | 'inactive' | 'degraded' | 'maintenance' | 'error';

export interface AICapability {
  type: AIRequestType;
  supported: boolean;
  maxTokens: number;
  languages: string[];
  specialFeatures: string[];
}

export interface ProviderPricing {
  inputTokenCost: number; // Cost per 1K input tokens
  outputTokenCost: number; // Cost per 1K output tokens
  minimumCost: number;
  currency: string;
  billingModel: 'per_token' | 'per_request' | 'subscription';
}

export interface ProviderPerformance {
  averageLatency: number;
  p95Latency: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  lastUpdated: string;
}

export interface ProviderConfiguration {
  apiKey?: string;
  endpoint?: string;
  region?: string;
  model: string;
  defaultConstraints: AIConstraints;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    concurrentRequests: number;
  };
}

export interface ProviderHealthCheck {
  lastCheck: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  errorMessage?: string;
  consecutiveFailures: number;
}

export interface ProviderSelection {
  selectedProvider: AIProvider;
  score: number;
  reasoning: string[];
  alternatives: Array<{
    provider: AIProvider;
    score: number;
    reason: string;
  }>;
}

export interface CircuitBreakerState {
  providerId: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime?: string;
  nextRetryTime?: string;
  successCount: number;
}

export interface ProviderMetrics {
  providerId: string;
  timeWindow: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  totalCost: number;
  tokensProcessed: number;
  errorTypes: Record<string, number>;
}

export interface FailoverEvent {
  id: string;
  originalProvider: string;
  fallbackProvider: string;
  reason: string;
  requestId: string;
  timestamp: string;
  success: boolean;
  latencyImpact: number;
}

export interface ProviderLoadBalancing {
  strategy: 'round_robin' | 'weighted' | 'least_latency' | 'least_cost' | 'intelligent';
  weights?: Record<string, number>;
  stickySession?: boolean;
  healthCheckRequired?: boolean;
}

export interface AIOrchestrationConfig {
  defaultProvider?: string;
  fallbackChain: string[];
  loadBalancing: ProviderLoadBalancing;
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxRequests: number;
  };
  costLimits: {
    dailyLimit: number;
    requestLimit: number;
    userLimit: number;
  };
  qualityThresholds: {
    minimumConfidence: number;
    maximumLatency: number;
    minimumSuccessRate: number;
  };
}