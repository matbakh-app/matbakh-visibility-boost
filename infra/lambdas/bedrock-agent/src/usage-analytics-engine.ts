/**
 * Usage Analytics Engine
 * 
 * Comprehensive analytics engine for AI usage patterns, cost optimization,
 * and business intelligence insights.
 */

import { DynamoDBClient, QueryCommand, ScanCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { getTokenAnalytics, generateOptimizationRecommendations, getCostProjection } from './token-usage-tracker';
import { getCostUsage } from './cost-control-system';

// Types for analytics
export interface UsagePattern {
  userId: string;
  pattern: 'steady' | 'growing' | 'declining' | 'spiky' | 'seasonal';
  confidence: number;
  characteristics: {
    averageDailyCost: number;
    peakHours: number[];
    preferredModels: string[];
    commonOperations: string[];
    seasonality?: {
      period: 'weekly' | 'monthly';
      peakDays: number[];
    };
  };
  predictions: {
    nextWeekCost: number;
    nextMonthCost: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface CostOptimizationInsight {
  type: 'model_efficiency' | 'usage_timing' | 'operation_batching' | 'caching_opportunity' | 'prompt_optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    costSavings: number;
    percentageSavings: number;
    timeframe: string;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    steps: string[];
    estimatedHours: number;
  };
  metrics: {
    currentValue: number;
    targetValue: number;
    unit: string;
  };
}

export interface BusinessIntelligence {
  userId: string;
  period: string;
  summary: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    averageRequestCost: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  };
  breakdown: {
    byModel: Array<{ model: string; cost: number; tokens: number; requests: number; percentage: number }>;
    byOperation: Array<{ operation: string; cost: number; tokens: number; requests: number; percentage: number }>;
    byHour: Array<{ hour: number; cost: number; requests: number }>;
    byDay: Array<{ day: string; cost: number; requests: number }>;
  };
  insights: CostOptimizationInsight[];
  recommendations: string[];
  alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>;
}

export interface BenchmarkData {
  industry: string;
  userTier: 'starter' | 'professional' | 'enterprise';
  metrics: {
    averageMonthlyCost: number;
    averageTokensPerRequest: number;
    averageCostPerToken: number;
    cacheHitRate: number;
    preferredModels: string[];
  };
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const USAGE_PATTERNS_TABLE = 'bedrock_usage_patterns';
const ANALYTICS_CACHE_TABLE = 'bedrock_analytics_cache';
const BENCHMARKS_TABLE = 'bedrock_benchmarks';

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });

/**
 * Analyze usage patterns for user
 */
export async function analyzeUsagePatterns(userId: string, days: number = 30): Promise<UsagePattern> {
  const analytics = await getTokenAnalytics(userId, days);
  const costUsage = await getCostUsage(userId, 'month');

  // Analyze trend
  const dailyTrend = analytics.dailyTrend;
  const pattern = detectUsagePattern(dailyTrend);
  const confidence = calculatePatternConfidence(dailyTrend, pattern);

  // Extract characteristics
  const characteristics = extractUsageCharacteristics(analytics, costUsage);

  // Generate predictions
  const predictions = await generateUsagePredictions(userId, analytics, pattern);

  const usagePattern: UsagePattern = {
    userId,
    pattern,
    confidence,
    characteristics,
    predictions
  };

  // Cache the pattern analysis
  await cacheUsagePattern(usagePattern);

  return usagePattern;
}

/**
 * Detect usage pattern from daily trend
 */
function detectUsagePattern(dailyTrend: Array<{ date: string; tokens: number; cost: number }>): UsagePattern['pattern'] {
  if (dailyTrend.length < 7) {
    return 'steady'; // Not enough data
  }

  const costs = dailyTrend.map(d => d.cost);
  const tokens = dailyTrend.map(d => d.tokens);

  // Calculate trend using linear regression
  const costTrend = calculateLinearTrend(costs);
  const tokenTrend = calculateLinearTrend(tokens);

  // Calculate variance to detect spikiness
  const costVariance = calculateVariance(costs);
  const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const coefficientOfVariation = Math.sqrt(costVariance) / avgCost;

  // Detect seasonal patterns (weekly)
  const weeklyPattern = detectWeeklyPattern(dailyTrend);

  // Classification logic
  if (coefficientOfVariation > 0.5) {
    return 'spiky';
  }

  if (weeklyPattern.strength > 0.7) {
    return 'seasonal';
  }

  if (costTrend > 0.1 && tokenTrend > 0.1) {
    return 'growing';
  }

  if (costTrend < -0.1 && tokenTrend < -0.1) {
    return 'declining';
  }

  return 'steady';
}

/**
 * Calculate linear trend (slope)
 */
function calculateLinearTrend(values: number[]): number {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return variance;
}

/**
 * Detect weekly pattern
 */
function detectWeeklyPattern(dailyTrend: Array<{ date: string; tokens: number; cost: number }>): { strength: number; peakDays: number[] } {
  const weeklyData: Record<number, number[]> = {};

  // Group by day of week
  dailyTrend.forEach(day => {
    const dayOfWeek = new Date(day.date).getDay();
    if (!weeklyData[dayOfWeek]) {
      weeklyData[dayOfWeek] = [];
    }
    weeklyData[dayOfWeek].push(day.cost);
  });

  // Calculate average for each day of week
  const weeklyAverages: Record<number, number> = {};
  Object.entries(weeklyData).forEach(([day, costs]) => {
    weeklyAverages[parseInt(day)] = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  });

  // Calculate pattern strength (coefficient of variation across days)
  const averages = Object.values(weeklyAverages);
  const overallAverage = averages.reduce((sum, a) => sum + a, 0) / averages.length;
  const variance = averages.reduce((sum, a) => sum + Math.pow(a - overallAverage, 2), 0) / averages.length;
  const strength = Math.sqrt(variance) / overallAverage;

  // Find peak days (above average)
  const peakDays = Object.entries(weeklyAverages)
    .filter(([, avg]) => avg > overallAverage)
    .map(([day]) => parseInt(day));

  return { strength, peakDays };
}

/**
 * Calculate pattern confidence
 */
function calculatePatternConfidence(
  dailyTrend: Array<{ date: string; tokens: number; cost: number }>,
  pattern: UsagePattern['pattern']
): number {
  const dataPoints = dailyTrend.length;
  
  // Base confidence on data quantity
  let confidence = Math.min(dataPoints / 30, 1); // Max confidence with 30+ days

  // Adjust based on pattern consistency
  const costs = dailyTrend.map(d => d.cost);
  const variance = calculateVariance(costs);
  const mean = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const cv = Math.sqrt(variance) / mean;

  switch (pattern) {
    case 'steady':
      confidence *= (1 - Math.min(cv, 0.5)); // Lower variance = higher confidence
      break;
    case 'growing':
    case 'declining':
      const trend = calculateLinearTrend(costs);
      confidence *= Math.min(Math.abs(trend), 0.5) * 2; // Stronger trend = higher confidence
      break;
    case 'spiky':
      confidence *= Math.min(cv, 1); // Higher variance = higher confidence for spiky
      break;
    case 'seasonal':
      const weeklyPattern = detectWeeklyPattern(dailyTrend);
      confidence *= weeklyPattern.strength;
      break;
  }

  return Math.max(0.1, Math.min(1, confidence));
}

/**
 * Extract usage characteristics
 */
function extractUsageCharacteristics(analytics: any, costUsage: any[]): UsagePattern['characteristics'] {
  const averageDailyCost = analytics.dailyTrend.length > 0
    ? analytics.dailyTrend.reduce((sum: number, day: any) => sum + day.cost, 0) / analytics.dailyTrend.length
    : 0;

  // Find peak hours (would need hourly data)
  const peakHours = [9, 10, 11, 14, 15, 16]; // Default business hours

  // Get preferred models
  const preferredModels = Object.entries(analytics.tokensByModel)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([model]) => model);

  // Get common operations
  const commonOperations = Object.entries(analytics.tokensByOperation)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([operation]) => operation);

  return {
    averageDailyCost,
    peakHours,
    preferredModels,
    commonOperations
  };
}

/**
 * Generate usage predictions
 */
async function generateUsagePredictions(
  userId: string,
  analytics: any,
  pattern: UsagePattern['pattern']
): Promise<UsagePattern['predictions']> {
  const projection = await getCostProjection(userId, 30);
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  if (projection.projectedMonthlyCost > 100) {
    riskLevel = 'high';
  } else if (projection.projectedMonthlyCost > 50) {
    riskLevel = 'medium';
  }

  // Adjust predictions based on pattern
  let nextWeekMultiplier = 1;
  let nextMonthMultiplier = 1;

  switch (pattern) {
    case 'growing':
      nextWeekMultiplier = 1.1;
      nextMonthMultiplier = 1.3;
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      break;
    case 'declining':
      nextWeekMultiplier = 0.9;
      nextMonthMultiplier = 0.8;
      break;
    case 'spiky':
      nextWeekMultiplier = 1.2; // Account for potential spikes
      nextMonthMultiplier = 1.1;
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      break;
  }

  return {
    nextWeekCost: projection.currentDailyCost * 7 * nextWeekMultiplier,
    nextMonthCost: projection.projectedMonthlyCost * nextMonthMultiplier,
    riskLevel
  };
}

/**
 * Generate comprehensive cost optimization insights
 */
export async function generateCostOptimizationInsights(userId: string): Promise<CostOptimizationInsight[]> {
  const analytics = await getTokenAnalytics(userId, 30);
  const usagePattern = await analyzeUsagePatterns(userId);
  const recommendations = await generateOptimizationRecommendations(userId, analytics);

  const insights: CostOptimizationInsight[] = [];

  // Convert recommendations to detailed insights
  for (const rec of recommendations) {
    const insight: CostOptimizationInsight = {
      type: rec.type as any,
      priority: rec.priority === 'high' ? 'critical' : rec.priority as any,
      title: getInsightTitle(rec.type),
      description: rec.description,
      impact: {
        costSavings: rec.potentialSavings,
        percentageSavings: (rec.potentialSavings / analytics.totalCost) * 100,
        timeframe: 'monthly'
      },
      implementation: {
        difficulty: getImplementationDifficulty(rec.type),
        steps: getImplementationSteps(rec.type),
        estimatedHours: getEstimatedHours(rec.type)
      },
      metrics: getInsightMetrics(rec.type, analytics)
    };

    insights.push(insight);
  }

  // Add pattern-specific insights
  if (usagePattern.pattern === 'spiky') {
    insights.push({
      type: 'usage_timing',
      priority: 'high',
      title: 'Optimize Usage Timing',
      description: 'Your usage shows high variability. Consider spreading operations more evenly.',
      impact: {
        costSavings: analytics.totalCost * 0.15,
        percentageSavings: 15,
        timeframe: 'monthly'
      },
      implementation: {
        difficulty: 'medium',
        steps: [
          'Analyze peak usage times',
          'Implement request queuing',
          'Schedule non-urgent operations during off-peak hours'
        ],
        estimatedHours: 8
      },
      metrics: {
        currentValue: usagePattern.confidence,
        targetValue: 0.8,
        unit: 'consistency_score'
      }
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate business intelligence report
 */
export async function generateBusinessIntelligence(userId: string, period: string = 'month'): Promise<BusinessIntelligence> {
  const analytics = await getTokenAnalytics(userId, period === 'month' ? 30 : 7);
  const insights = await generateCostOptimizationInsights(userId);
  const usagePattern = await analyzeUsagePatterns(userId);

  // Calculate summary
  const costTrend = analytics.dailyTrend.length >= 2
    ? analytics.dailyTrend[analytics.dailyTrend.length - 1].cost > analytics.dailyTrend[0].cost
      ? 'increasing' : 'decreasing'
    : 'stable';

  const efficiency = getEfficiencyRating(analytics.efficiency);

  // Prepare breakdown data
  const totalCost = analytics.totalCost;
  const byModel = Object.entries(analytics.costsByModel).map(([model, cost]) => ({
    model,
    cost: cost as number,
    tokens: analytics.tokensByModel[model] || 0,
    requests: Math.round((analytics.tokensByModel[model] || 0) / analytics.averageTokensPerRequest),
    percentage: ((cost as number) / totalCost) * 100
  })).sort((a, b) => b.cost - a.cost);

  const byOperation = Object.entries(analytics.costsByOperation).map(([operation, cost]) => ({
    operation,
    cost: cost as number,
    tokens: analytics.tokensByOperation[operation] || 0,
    requests: Math.round((analytics.tokensByOperation[operation] || 0) / analytics.averageTokensPerRequest),
    percentage: ((cost as number) / totalCost) * 100
  })).sort((a, b) => b.cost - a.cost);

  // Generate hourly breakdown (simplified)
  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    cost: totalCost / 24, // Simplified - would need actual hourly data
    requests: Math.round(analytics.totalTokens / analytics.averageTokensPerRequest / 24)
  }));

  const byDay = analytics.dailyTrend.map(day => ({
    day: day.date,
    cost: day.cost,
    requests: Math.round(day.tokens / analytics.averageTokensPerRequest)
  }));

  // Generate recommendations
  const recommendations = [
    `Your ${period}ly AI cost is $${totalCost.toFixed(2)}`,
    `Most used model: ${byModel[0]?.model || 'N/A'} (${byModel[0]?.percentage.toFixed(1)}% of costs)`,
    `Top operation: ${byOperation[0]?.operation || 'N/A'} (${byOperation[0]?.percentage.toFixed(1)}% of costs)`,
    `Usage pattern: ${usagePattern.pattern} (${(usagePattern.confidence * 100).toFixed(0)}% confidence)`
  ];

  // Generate alerts
  const alerts = [];
  if (usagePattern.predictions.riskLevel === 'high') {
    alerts.push({
      type: 'cost_risk',
      message: `High cost risk detected. Projected monthly cost: $${usagePattern.predictions.nextMonthCost.toFixed(2)}`,
      severity: 'error' as const
    });
  }

  if (analytics.efficiency.cacheHitRate < 0.3) {
    alerts.push({
      type: 'efficiency',
      message: `Low cache hit rate (${(analytics.efficiency.cacheHitRate * 100).toFixed(1)}%). Consider implementing better caching.`,
      severity: 'warning' as const
    });
  }

  return {
    userId,
    period,
    summary: {
      totalCost,
      totalTokens: analytics.totalTokens,
      totalRequests: Math.round(analytics.totalTokens / analytics.averageTokensPerRequest),
      averageRequestCost: analytics.averageCostPerRequest,
      costTrend,
      efficiency
    },
    breakdown: {
      byModel,
      byOperation,
      byHour,
      byDay
    },
    insights,
    recommendations,
    alerts
  };
}

/**
 * Get benchmark data for comparison
 */
export async function getBenchmarkData(
  industry: string = 'hospitality',
  userTier: 'starter' | 'professional' | 'enterprise' = 'professional'
): Promise<BenchmarkData> {
  try {
    const command = new QueryCommand({
      TableName: BENCHMARKS_TABLE,
      KeyConditionExpression: 'industry = :industry AND user_tier = :tier',
      ExpressionAttributeValues: {
        ':industry': { S: industry },
        ':tier': { S: userTier }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (response.Items && response.Items.length > 0) {
      const item = response.Items[0];
      return {
        industry,
        userTier,
        metrics: JSON.parse(item.metrics?.S || '{}'),
        percentiles: JSON.parse(item.percentiles?.S || '{}')
      };
    }
  } catch (error) {
    console.error('Failed to get benchmark data:', error);
  }

  // Return default benchmark data
  return {
    industry,
    userTier,
    metrics: {
      averageMonthlyCost: userTier === 'starter' ? 25 : userTier === 'professional' ? 75 : 200,
      averageTokensPerRequest: 1500,
      averageCostPerToken: 0.00001,
      cacheHitRate: 0.4,
      preferredModels: ['claude-3-5-sonnet', 'claude-3-haiku']
    },
    percentiles: {
      p25: userTier === 'starter' ? 10 : userTier === 'professional' ? 30 : 80,
      p50: userTier === 'starter' ? 25 : userTier === 'professional' ? 75 : 200,
      p75: userTier === 'starter' ? 45 : userTier === 'professional' ? 120 : 350,
      p90: userTier === 'starter' ? 70 : userTier === 'professional' ? 180 : 500,
      p95: userTier === 'starter' ? 100 : userTier === 'professional' ? 250 : 750
    }
  };
}

/**
 * Cache usage pattern
 */
async function cacheUsagePattern(pattern: UsagePattern): Promise<void> {
  const command = new PutItemCommand({
    TableName: USAGE_PATTERNS_TABLE,
    Item: {
      user_id: { S: pattern.userId },
      pattern_type: { S: pattern.pattern },
      confidence: { N: pattern.confidence.toString() },
      characteristics: { S: JSON.stringify(pattern.characteristics) },
      predictions: { S: JSON.stringify(pattern.predictions) },
      analyzed_at: { S: new Date().toISOString() },
      ttl: { N: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000).toString() } // 7 days TTL
    }
  });

  await dynamoClient.send(command);
}

// Helper functions
function getInsightTitle(type: string): string {
  const titles = {
    model_switch: 'Switch to More Cost-Effective Model',
    prompt_optimization: 'Optimize Prompt Efficiency',
    caching: 'Implement Response Caching',
    batching: 'Batch Small Operations',
    throttling: 'Implement Usage Controls',
    usage_timing: 'Optimize Usage Timing',
    operation_batching: 'Batch Similar Operations',
    caching_opportunity: 'Leverage Caching Opportunities'
  };
  return titles[type as keyof typeof titles] || 'Optimization Opportunity';
}

function getImplementationDifficulty(type: string): 'easy' | 'medium' | 'hard' {
  const difficulties = {
    model_switch: 'easy',
    prompt_optimization: 'medium',
    caching: 'medium',
    batching: 'hard',
    throttling: 'easy',
    usage_timing: 'medium',
    operation_batching: 'hard',
    caching_opportunity: 'medium'
  };
  return difficulties[type as keyof typeof difficulties] || 'medium';
}

function getImplementationSteps(type: string): string[] {
  const steps = {
    model_switch: [
      'Identify operations suitable for cheaper models',
      'Update model selection logic',
      'Test with sample operations',
      'Monitor quality and cost impact'
    ],
    prompt_optimization: [
      'Analyze current prompt efficiency',
      'Identify verbose or redundant sections',
      'Rewrite prompts for conciseness',
      'A/B test optimized prompts'
    ],
    caching: [
      'Identify cacheable operations',
      'Implement cache key strategy',
      'Set up cache storage',
      'Monitor cache hit rates'
    ],
    batching: [
      'Identify batchable operations',
      'Implement batching logic',
      'Set up batch processing queues',
      'Monitor batch efficiency'
    ]
  };
  return steps[type as keyof typeof steps] || ['Analyze current state', 'Plan implementation', 'Execute changes', 'Monitor results'];
}

function getEstimatedHours(type: string): number {
  const hours = {
    model_switch: 4,
    prompt_optimization: 8,
    caching: 12,
    batching: 16,
    throttling: 2,
    usage_timing: 6,
    operation_batching: 16,
    caching_opportunity: 10
  };
  return hours[type as keyof typeof hours] || 8;
}

function getInsightMetrics(type: string, analytics: any): { currentValue: number; targetValue: number; unit: string } {
  switch (type) {
    case 'model_switch':
      return {
        currentValue: analytics.costsByModel['claude-3-5-sonnet'] || 0,
        targetValue: (analytics.costsByModel['claude-3-5-sonnet'] || 0) * 0.5,
        unit: 'cost_usd'
      };
    case 'caching':
      return {
        currentValue: analytics.efficiency.cacheHitRate,
        targetValue: 0.7,
        unit: 'hit_rate'
      };
    case 'prompt_optimization':
      return {
        currentValue: analytics.efficiency.inputOutputRatio,
        targetValue: 1.5,
        unit: 'ratio'
      };
    default:
      return {
        currentValue: analytics.totalCost,
        targetValue: analytics.totalCost * 0.8,
        unit: 'cost_usd'
      };
  }
}

function getEfficiencyRating(efficiency: any): 'excellent' | 'good' | 'fair' | 'poor' {
  const score = (
    (efficiency.cacheHitRate * 0.4) +
    (Math.min(efficiency.inputOutputRatio / 2, 1) * 0.3) +
    (Math.max(0, 1 - efficiency.costPerToken * 10000) * 0.3)
  );

  if (score >= 0.8) return 'excellent';
  if (score >= 0.6) return 'good';
  if (score >= 0.4) return 'fair';
  return 'poor';
}