/**
 * Token Usage Tracker
 * 
 * Comprehensive token usage tracking and cost calculation system
 * for all AI operations with detailed analytics and optimization insights.
 */

import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { auditTrailSystem } from './audit-trail-system';

// Types for token tracking
export interface TokenUsage {
  requestId: string;
  userId: string;
  operation: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: string;
  promptHash?: string;
  responseHash?: string;
  cacheHit?: boolean;
}

export interface TokenAnalytics {
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  averageCostPerRequest: number;
  tokensByModel: Record<string, number>;
  costsByModel: Record<string, number>;
  tokensByOperation: Record<string, number>;
  costsByOperation: Record<string, number>;
  dailyTrend: Array<{ date: string; tokens: number; cost: number }>;
  efficiency: {
    inputOutputRatio: number;
    cacheHitRate: number;
    costPerToken: number;
  };
}

export interface OptimizationRecommendation {
  type: 'model_switch' | 'prompt_optimization' | 'caching' | 'batching' | 'throttling';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: number;
  implementation: string;
  impact: string;
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const TOKEN_USAGE_TABLE = 'bedrock_token_usage';
const TOKEN_ANALYTICS_TABLE = 'bedrock_token_analytics';

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });

// Token cost mapping (per 1000 tokens) - Updated with latest pricing
const TOKEN_COSTS = {
  'claude-3-5-sonnet': {
    input: 0.003, // $3 per 1M input tokens
    output: 0.015, // $15 per 1M output tokens
    contextWindow: 200000
  },
  'claude-3-haiku': {
    input: 0.00025, // $0.25 per 1M input tokens
    output: 0.00125, // $1.25 per 1M output tokens
    contextWindow: 200000
  },
  'claude-3-opus': {
    input: 0.015, // $15 per 1M input tokens
    output: 0.075, // $75 per 1M output tokens
    contextWindow: 200000
  }
};

/**
 * Track token usage for an AI operation
 */
export async function trackTokenUsage(usage: Omit<TokenUsage, 'cost' | 'timestamp'>): Promise<TokenUsage> {
  const cost = calculateTokenCost(usage.modelId, usage.inputTokens, usage.outputTokens);
  const timestamp = new Date().toISOString();

  const completeUsage: TokenUsage = {
    ...usage,
    cost,
    timestamp
  };

  try {
    // Store detailed usage record
    await storeTokenUsage(completeUsage);

    // Update aggregated analytics
    await updateTokenAnalytics(completeUsage);

    // Log the tracking
    await auditTrailSystem.logAction({
      action: 'token_usage_tracked',
      actor: {
        type: 'system',
        id: 'token-usage-tracker',
        ip_address: undefined,
        user_agent: 'bedrock-agent'
      },
      resource: {
        type: 'token_usage',
        id: usage.requestId,
        metadata: {
          operation: usage.operation,
          modelId: usage.modelId,
          totalTokens: usage.totalTokens,
          cost
        }
      },
      context: {
        userId: usage.userId,
        success: true
      }
    });

    return completeUsage;

  } catch (error) {
    console.error('Token usage tracking failed:', error);
    throw error;
  }
}

/**
 * Calculate cost for token usage
 */
export function calculateTokenCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const modelKey = getModelKey(modelId);
  const costs = TOKEN_COSTS[modelKey] || TOKEN_COSTS['claude-3-5-sonnet'];

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Get standardized model key
 */
function getModelKey(modelId: string): keyof typeof TOKEN_COSTS {
  if (modelId.includes('sonnet')) return 'claude-3-5-sonnet';
  if (modelId.includes('haiku')) return 'claude-3-haiku';
  if (modelId.includes('opus')) return 'claude-3-opus';
  return 'claude-3-5-sonnet'; // Default
}

/**
 * Store token usage record
 */
async function storeTokenUsage(usage: TokenUsage): Promise<void> {
  const command = new PutItemCommand({
    TableName: TOKEN_USAGE_TABLE,
    Item: {
      request_id: { S: usage.requestId },
      user_id: { S: usage.userId },
      operation: { S: usage.operation },
      model_id: { S: usage.modelId },
      input_tokens: { N: usage.inputTokens.toString() },
      output_tokens: { N: usage.outputTokens.toString() },
      total_tokens: { N: usage.totalTokens.toString() },
      cost: { N: usage.cost.toString() },
      timestamp: { S: usage.timestamp },
      date: { S: usage.timestamp.split('T')[0] },
      hour: { N: new Date(usage.timestamp).getHours().toString() },
      ...(usage.promptHash && { prompt_hash: { S: usage.promptHash } }),
      ...(usage.responseHash && { response_hash: { S: usage.responseHash } }),
      ...(usage.cacheHit !== undefined && { cache_hit: { BOOL: usage.cacheHit } })
    }
  });

  await dynamoClient.send(command);
}

/**
 * Update aggregated token analytics
 */
async function updateTokenAnalytics(usage: TokenUsage): Promise<void> {
  const date = usage.timestamp.split('T')[0];
  const analyticsKey = `${usage.userId}:${date}`;

  const updateExpression = [
    'ADD total_tokens :tokens',
    'ADD total_cost :cost',
    'ADD request_count :one',
    `ADD tokens_by_model.#model :tokens`,
    `ADD costs_by_model.#model :cost`,
    `ADD tokens_by_operation.#op :tokens`,
    `ADD costs_by_operation.#op :cost`,
    'SET last_updated = :timestamp'
  ].join(', ');

  const command = new UpdateItemCommand({
    TableName: TOKEN_ANALYTICS_TABLE,
    Key: {
      analytics_key: { S: analyticsKey }
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      '#model': usage.modelId,
      '#op': usage.operation
    },
    ExpressionAttributeValues: {
      ':tokens': { N: usage.totalTokens.toString() },
      ':cost': { N: usage.cost.toString() },
      ':one': { N: '1' },
      ':timestamp': { S: usage.timestamp }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Get token usage for user over specified period
 */
export async function getTokenUsage(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TokenUsage[]> {
  const usage: TokenUsage[] = [];

  try {
    const command = new QueryCommand({
      TableName: TOKEN_USAGE_TABLE,
      IndexName: 'user-date-index',
      KeyConditionExpression: 'user_id = :userId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':startDate': { S: startDate },
        ':endDate': { S: endDate }
      },
      ScanIndexForward: false // Most recent first
    });

    const response = await dynamoClient.send(command);
    
    if (response.Items) {
      for (const item of response.Items) {
        usage.push({
          requestId: item.request_id?.S || '',
          userId: item.user_id?.S || '',
          operation: item.operation?.S || '',
          modelId: item.model_id?.S || '',
          inputTokens: parseInt(item.input_tokens?.N || '0'),
          outputTokens: parseInt(item.output_tokens?.N || '0'),
          totalTokens: parseInt(item.total_tokens?.N || '0'),
          cost: parseFloat(item.cost?.N || '0'),
          timestamp: item.timestamp?.S || '',
          promptHash: item.prompt_hash?.S,
          responseHash: item.response_hash?.S,
          cacheHit: item.cache_hit?.BOOL
        });
      }
    }

  } catch (error) {
    console.error('Failed to get token usage:', error);
    throw error;
  }

  return usage;
}

/**
 * Get comprehensive token analytics
 */
export async function getTokenAnalytics(
  userId: string,
  days: number = 30
): Promise<TokenAnalytics> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const usage = await getTokenUsage(userId, startDate, endDate);

  // Calculate aggregated metrics
  const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0);
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
  const totalRequests = usage.length;

  const tokensByModel: Record<string, number> = {};
  const costsByModel: Record<string, number> = {};
  const tokensByOperation: Record<string, number> = {};
  const costsByOperation: Record<string, number> = {};

  usage.forEach(u => {
    tokensByModel[u.modelId] = (tokensByModel[u.modelId] || 0) + u.totalTokens;
    costsByModel[u.modelId] = (costsByModel[u.modelId] || 0) + u.cost;
    tokensByOperation[u.operation] = (tokensByOperation[u.operation] || 0) + u.totalTokens;
    costsByOperation[u.operation] = (costsByOperation[u.operation] || 0) + u.cost;
  });

  // Calculate daily trend
  const dailyData: Record<string, { tokens: number; cost: number }> = {};
  usage.forEach(u => {
    const date = u.timestamp.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { tokens: 0, cost: 0 };
    }
    dailyData[date].tokens += u.totalTokens;
    dailyData[date].cost += u.cost;
  });

  const dailyTrend = Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate efficiency metrics
  const totalInputTokens = usage.reduce((sum, u) => sum + u.inputTokens, 0);
  const totalOutputTokens = usage.reduce((sum, u) => sum + u.outputTokens, 0);
  const cacheHits = usage.filter(u => u.cacheHit).length;

  const efficiency = {
    inputOutputRatio: totalInputTokens > 0 ? totalOutputTokens / totalInputTokens : 0,
    cacheHitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
    costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0
  };

  return {
    totalTokens,
    totalCost,
    averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
    averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
    tokensByModel,
    costsByModel,
    tokensByOperation,
    costsByOperation,
    dailyTrend,
    efficiency
  };
}

/**
 * Generate optimization recommendations
 */
export async function generateOptimizationRecommendations(
  userId: string,
  analytics: TokenAnalytics
): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];

  // Model switching recommendations
  const mostUsedModel = Object.entries(analytics.tokensByModel)
    .sort(([,a], [,b]) => b - a)[0];

  if (mostUsedModel && mostUsedModel[0] === 'claude-3-5-sonnet') {
    const sonnetCost = analytics.costsByModel['claude-3-5-sonnet'] || 0;
    const potentialHaikuCost = sonnetCost * 0.17; // Haiku is ~17% of Sonnet cost
    const savings = sonnetCost - potentialHaikuCost;

    if (savings > 1) { // Only recommend if savings > $1
      recommendations.push({
        type: 'model_switch',
        priority: 'high',
        description: 'Consider using Claude 3 Haiku for simpler operations',
        potentialSavings: savings,
        implementation: 'Switch to claude-3-haiku for basic analysis and content generation',
        impact: `Could save ~$${savings.toFixed(2)} per month`
      });
    }
  }

  // Prompt optimization recommendations
  if (analytics.efficiency.inputOutputRatio > 2) {
    recommendations.push({
      type: 'prompt_optimization',
      priority: 'medium',
      description: 'High input-to-output ratio suggests verbose prompts',
      potentialSavings: analytics.totalCost * 0.2, // Estimate 20% savings
      implementation: 'Optimize prompts to be more concise and specific',
      impact: 'Reduce input tokens by 20-30% while maintaining quality'
    });
  }

  // Caching recommendations
  if (analytics.efficiency.cacheHitRate < 0.3) {
    recommendations.push({
      type: 'caching',
      priority: 'high',
      description: 'Low cache hit rate indicates missed optimization opportunities',
      potentialSavings: analytics.totalCost * 0.4, // Estimate 40% savings from better caching
      implementation: 'Implement response caching for repeated queries',
      impact: 'Could reduce costs by 30-50% for repeated operations'
    });
  }

  // Batching recommendations
  const avgTokensPerRequest = analytics.averageTokensPerRequest;
  if (avgTokensPerRequest < 1000 && analytics.totalCost > 10) {
    recommendations.push({
      type: 'batching',
      priority: 'medium',
      description: 'Many small requests could be batched for efficiency',
      potentialSavings: analytics.totalCost * 0.15, // Estimate 15% savings
      implementation: 'Batch multiple small operations into single requests',
      impact: 'Reduce overhead and improve cost efficiency'
    });
  }

  // Throttling recommendations
  const dailyAverage = analytics.dailyTrend.length > 0 
    ? analytics.dailyTrend.reduce((sum, day) => sum + day.cost, 0) / analytics.dailyTrend.length
    : 0;

  if (dailyAverage > 5) {
    recommendations.push({
      type: 'throttling',
      priority: 'low',
      description: 'High daily costs suggest need for usage controls',
      potentialSavings: dailyAverage * 0.3 * 30, // 30% reduction over 30 days
      implementation: 'Implement rate limiting and cost thresholds',
      impact: 'Prevent unexpected cost spikes and improve budget control'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get cost projection based on current usage
 */
export async function getCostProjection(
  userId: string,
  projectionDays: number = 30
): Promise<{
  currentDailyCost: number;
  projectedMonthlyCost: number;
  projectedCost: number;
  confidence: number;
  breakdown: {
    byModel: Record<string, number>;
    byOperation: Record<string, number>;
  };
}> {
  const analytics = await getTokenAnalytics(userId, 7); // Use last 7 days for projection
  
  const recentDays = analytics.dailyTrend.slice(-7);
  const currentDailyCost = recentDays.length > 0 
    ? recentDays.reduce((sum, day) => sum + day.cost, 0) / recentDays.length
    : 0;

  const projectedCost = currentDailyCost * projectionDays;
  const projectedMonthlyCost = currentDailyCost * 30;

  // Calculate confidence based on data consistency
  const dailyCosts = recentDays.map(day => day.cost);
  const variance = dailyCosts.length > 1 
    ? dailyCosts.reduce((sum, cost) => sum + Math.pow(cost - currentDailyCost, 2), 0) / dailyCosts.length
    : 0;
  const standardDeviation = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(1, 1 - (standardDeviation / currentDailyCost)));

  // Project breakdown
  const totalCurrentCost = Object.values(analytics.costsByModel).reduce((sum, cost) => sum + cost, 0);
  const breakdown = {
    byModel: Object.fromEntries(
      Object.entries(analytics.costsByModel).map(([model, cost]) => [
        model,
        (cost / totalCurrentCost) * projectedCost
      ])
    ),
    byOperation: Object.fromEntries(
      Object.entries(analytics.costsByOperation).map(([operation, cost]) => [
        operation,
        (cost / totalCurrentCost) * projectedCost
      ])
    )
  };

  return {
    currentDailyCost,
    projectedMonthlyCost,
    projectedCost,
    confidence,
    breakdown
  };
}

/**
 * Export token usage data for analysis
 */
export async function exportTokenUsageData(
  userId: string,
  startDate: string,
  endDate: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const usage = await getTokenUsage(userId, startDate, endDate);

  if (format === 'csv') {
    const headers = [
      'Request ID',
      'Operation',
      'Model',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Cost',
      'Timestamp',
      'Cache Hit'
    ];

    const rows = usage.map(u => [
      u.requestId,
      u.operation,
      u.modelId,
      u.inputTokens.toString(),
      u.outputTokens.toString(),
      u.totalTokens.toString(),
      u.cost.toFixed(6),
      u.timestamp,
      u.cacheHit ? 'Yes' : 'No'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  return JSON.stringify(usage, null, 2);
}