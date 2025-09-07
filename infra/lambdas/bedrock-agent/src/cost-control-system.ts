/**
 * Cost Control System
 * 
 * Implements comprehensive cost monitoring, alerting, and automatic throttling
 * for AI operations to prevent budget overruns.
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { auditTrailSystem } from './audit-trail-system';

// Types for cost control
export interface CostThreshold {
  level: 'warning' | 'critical' | 'emergency';
  amount: number; // USD
  period: 'hour' | 'day' | 'week' | 'month';
  action: 'alert' | 'throttle' | 'shutdown';
}

export interface CostUsage {
  userId: string;
  period: string; // ISO date string
  totalCost: number;
  operationCosts: Record<string, number>;
  requestCount: number;
  lastUpdated: string;
}

export interface CostAlert {
  alertId: string;
  userId: string;
  threshold: CostThreshold;
  currentCost: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface ThrottleConfig {
  enabled: boolean;
  maxRequestsPerMinute: number;
  maxCostPerHour: number;
  emergencyShutdown: boolean;
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const COST_TRACKING_TABLE = 'bedrock_cost_tracking';
const COST_ALERTS_TABLE = 'bedrock_cost_alerts';
const THROTTLE_CONFIG_TABLE = 'bedrock_throttle_config';
const COST_ALERT_TOPIC = process.env.COST_ALERT_SNS_TOPIC;

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

// Default cost thresholds (per user per day)
const DEFAULT_COST_THRESHOLDS: CostThreshold[] = [
  {
    level: 'warning',
    amount: 5.0, // $5 per day
    period: 'day',
    action: 'alert'
  },
  {
    level: 'critical',
    amount: 10.0, // $10 per day
    period: 'day',
    action: 'throttle'
  },
  {
    level: 'emergency',
    amount: 25.0, // $25 per day
    period: 'day',
    action: 'shutdown'
  }
];

// Token cost mapping (per 1000 tokens)
const TOKEN_COSTS = {
  'claude-3-5-sonnet': {
    input: 0.003, // $3 per 1M input tokens
    output: 0.015 // $15 per 1M output tokens
  },
  'claude-3-haiku': {
    input: 0.00025, // $0.25 per 1M input tokens
    output: 0.00125 // $1.25 per 1M output tokens
  }
};

/**
 * Calculate cost for AI operation
 */
export function calculateOperationCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelKey = modelId.includes('sonnet') ? 'claude-3-5-sonnet' : 'claude-3-haiku';
  const costs = TOKEN_COSTS[modelKey] || TOKEN_COSTS['claude-3-5-sonnet'];

  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Track cost for user operation
 */
export async function trackOperationCost(
  userId: string,
  operation: string,
  cost: number,
  tokenUsage?: { input: number; output: number; total: number }
): Promise<void> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  
  const costKey = `${userId}:${today}`;
  const hourlyKey = `${userId}:${today}:${hour}`;

  try {
    // Update daily cost tracking
    await updateCostRecord(costKey, operation, cost, 'day');
    
    // Update hourly cost tracking
    await updateCostRecord(hourlyKey, operation, cost, 'hour');

    // Check thresholds
    await checkCostThresholds(userId, today);

    // Log the cost tracking
    await auditTrailSystem.logAction({
      action: 'cost_tracking',
      actor: {
        type: 'system',
        id: 'cost-control-system',
        ip_address: undefined,
        user_agent: 'bedrock-agent'
      },
      resource: {
        type: 'cost_record',
        id: costKey,
        metadata: {
          operation,
          cost,
          tokenUsage
        }
      },
      context: {
        userId,
        period: 'day',
        success: true
      }
    });

  } catch (error) {
    console.error('Cost tracking failed:', error);
    throw error;
  }
}

/**
 * Update cost record in DynamoDB
 */
async function updateCostRecord(
  costKey: string,
  operation: string,
  cost: number,
  period: 'hour' | 'day'
): Promise<void> {
  const updateExpression = [
    'ADD total_cost :cost',
    'ADD request_count :one',
    `ADD operation_costs.#op :cost`,
    'SET last_updated = :timestamp',
    'SET #period = :period_value'
  ].join(', ');

  const command = new UpdateItemCommand({
    TableName: COST_TRACKING_TABLE,
    Key: {
      cost_key: { S: costKey }
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: {
      '#op': operation,
      '#period': 'period'
    },
    ExpressionAttributeValues: {
      ':cost': { N: cost.toString() },
      ':one': { N: '1' },
      ':timestamp': { S: new Date().toISOString() },
      ':period_value': { S: period }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Check cost thresholds and trigger alerts/actions
 */
async function checkCostThresholds(userId: string, date: string): Promise<void> {
  const costKey = `${userId}:${date}`;

  // Get current cost
  const getCommand = new GetItemCommand({
    TableName: COST_TRACKING_TABLE,
    Key: {
      cost_key: { S: costKey }
    }
  });

  const response = await dynamoClient.send(getCommand);
  if (!response.Item) {
    return;
  }

  const currentCost = parseFloat(response.Item.total_cost?.N || '0');
  const thresholds = await getCostThresholds(userId);

  for (const threshold of thresholds) {
    if (currentCost >= threshold.amount) {
      await handleThresholdExceeded(userId, threshold, currentCost);
    }
  }
}

/**
 * Get cost thresholds for user (custom or default)
 */
async function getCostThresholds(userId: string): Promise<CostThreshold[]> {
  try {
    // Try to get custom thresholds for user
    const command = new GetItemCommand({
      TableName: 'bedrock_user_thresholds',
      Key: {
        user_id: { S: userId }
      }
    });

    const response = await dynamoClient.send(command);
    if (response.Item && response.Item.thresholds?.S) {
      return JSON.parse(response.Item.thresholds.S);
    }
  } catch (error) {
    console.warn('Failed to get custom thresholds, using defaults:', error);
  }

  return DEFAULT_COST_THRESHOLDS;
}

/**
 * Handle threshold exceeded
 */
async function handleThresholdExceeded(
  userId: string,
  threshold: CostThreshold,
  currentCost: number
): Promise<void> {
  const alertId = `${userId}:${threshold.level}:${Date.now()}`;

  // Check if alert already exists for this threshold today
  const existingAlert = await getExistingAlert(userId, threshold.level);
  if (existingAlert) {
    return; // Don't spam alerts
  }

  // Create alert record
  const alert: CostAlert = {
    alertId,
    userId,
    threshold,
    currentCost,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  await storeAlert(alert);

  // Execute threshold action
  switch (threshold.action) {
    case 'alert':
      await sendCostAlert(alert);
      break;
    
    case 'throttle':
      await enableThrottling(userId, threshold);
      await sendCostAlert(alert);
      break;
    
    case 'shutdown':
      await enableEmergencyShutdown(userId);
      await sendCostAlert(alert);
      break;
  }

  // Audit log
  await auditTrailSystem.logAction({
    action: 'cost_threshold_exceeded',
    actor: {
      type: 'system',
      id: 'cost-control-system',
      ip_address: undefined,
      user_agent: 'bedrock-agent'
    },
    resource: {
      type: 'cost_threshold',
      id: alertId,
      metadata: {
        threshold,
        currentCost,
        action: threshold.action
      }
    },
    context: {
      userId,
      severity: threshold.level,
      success: true
    }
  });
}

/**
 * Check for existing alert
 */
async function getExistingAlert(userId: string, level: string): Promise<CostAlert | null> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const command = new QueryCommand({
      TableName: COST_ALERTS_TABLE,
      IndexName: 'user-date-index',
      KeyConditionExpression: 'user_id = :userId AND begins_with(alert_date, :date)',
      FilterExpression: 'threshold_level = :level',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':date': { S: today },
        ':level': { S: level }
      }
    });

    const response = await dynamoClient.send(command);
    if (response.Items && response.Items.length > 0) {
      const item = response.Items[0];
      return {
        alertId: item.alert_id?.S || '',
        userId: item.user_id?.S || '',
        threshold: JSON.parse(item.threshold?.S || '{}'),
        currentCost: parseFloat(item.current_cost?.N || '0'),
        timestamp: item.timestamp?.S || '',
        acknowledged: item.acknowledged?.BOOL || false
      };
    }
  } catch (error) {
    console.error('Failed to check existing alert:', error);
  }

  return null;
}

/**
 * Store alert in database
 */
async function storeAlert(alert: CostAlert): Promise<void> {
  const command = new PutItemCommand({
    TableName: COST_ALERTS_TABLE,
    Item: {
      alert_id: { S: alert.alertId },
      user_id: { S: alert.userId },
      alert_date: { S: alert.timestamp.split('T')[0] },
      threshold: { S: JSON.stringify(alert.threshold) },
      threshold_level: { S: alert.threshold.level },
      current_cost: { N: alert.currentCost.toString() },
      timestamp: { S: alert.timestamp },
      acknowledged: { BOOL: alert.acknowledged }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Send cost alert notification
 */
async function sendCostAlert(alert: CostAlert): Promise<void> {
  if (!COST_ALERT_TOPIC) {
    console.warn('Cost alert SNS topic not configured');
    return;
  }

  const message = {
    alertId: alert.alertId,
    userId: alert.userId,
    level: alert.threshold.level,
    currentCost: alert.currentCost,
    threshold: alert.threshold.amount,
    action: alert.threshold.action,
    timestamp: alert.timestamp
  };

  const command = new PublishCommand({
    TopicArn: COST_ALERT_TOPIC,
    Subject: `Cost Alert: ${alert.threshold.level.toUpperCase()} - User ${alert.userId}`,
    Message: JSON.stringify(message, null, 2)
  });

  try {
    await snsClient.send(command);
    console.log(`Cost alert sent for user ${alert.userId}: ${alert.threshold.level}`);
  } catch (error) {
    console.error('Failed to send cost alert:', error);
  }
}

/**
 * Enable throttling for user
 */
async function enableThrottling(userId: string, threshold: CostThreshold): Promise<void> {
  const throttleConfig: ThrottleConfig = {
    enabled: true,
    maxRequestsPerMinute: 10, // Reduced from normal limits
    maxCostPerHour: threshold.amount / 24, // Spread daily limit across hours
    emergencyShutdown: false
  };

  const command = new PutItemCommand({
    TableName: THROTTLE_CONFIG_TABLE,
    Item: {
      user_id: { S: userId },
      config: { S: JSON.stringify(throttleConfig) },
      enabled_at: { S: new Date().toISOString() },
      reason: { S: `Cost threshold exceeded: ${threshold.level}` }
    }
  });

  await dynamoClient.send(command);
  console.log(`Throttling enabled for user ${userId}`);
}

/**
 * Enable emergency shutdown for user
 */
async function enableEmergencyShutdown(userId: string): Promise<void> {
  const throttleConfig: ThrottleConfig = {
    enabled: true,
    maxRequestsPerMinute: 0, // Complete shutdown
    maxCostPerHour: 0,
    emergencyShutdown: true
  };

  const command = new PutItemCommand({
    TableName: THROTTLE_CONFIG_TABLE,
    Item: {
      user_id: { S: userId },
      config: { S: JSON.stringify(throttleConfig) },
      enabled_at: { S: new Date().toISOString() },
      reason: { S: 'Emergency cost threshold exceeded' }
    }
  });

  await dynamoClient.send(command);
  console.error(`Emergency shutdown enabled for user ${userId}`);
}

/**
 * Check if user is throttled
 */
export async function checkThrottleStatus(userId: string): Promise<{
  throttled: boolean;
  config?: ThrottleConfig;
  reason?: string;
}> {
  try {
    const command = new GetItemCommand({
      TableName: THROTTLE_CONFIG_TABLE,
      Key: {
        user_id: { S: userId }
      }
    });

    const response = await dynamoClient.send(command);
    if (response.Item) {
      const config: ThrottleConfig = JSON.parse(response.Item.config?.S || '{}');
      const reason = response.Item.reason?.S;

      return {
        throttled: config.enabled,
        config,
        reason
      };
    }
  } catch (error) {
    console.error('Failed to check throttle status:', error);
  }

  return { throttled: false };
}

/**
 * Get cost usage for user
 */
export async function getCostUsage(
  userId: string,
  period: 'day' | 'week' | 'month' = 'day'
): Promise<CostUsage[]> {
  const usage: CostUsage[] = [];
  const now = new Date();
  
  let dates: string[] = [];
  
  switch (period) {
    case 'day':
      dates = [now.toISOString().split('T')[0]];
      break;
    case 'week':
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'month':
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      break;
  }

  for (const date of dates) {
    const costKey = `${userId}:${date}`;
    
    try {
      const command = new GetItemCommand({
        TableName: COST_TRACKING_TABLE,
        Key: {
          cost_key: { S: costKey }
        }
      });

      const response = await dynamoClient.send(command);
      if (response.Item) {
        usage.push({
          userId,
          period: date,
          totalCost: parseFloat(response.Item.total_cost?.N || '0'),
          operationCosts: response.Item.operation_costs?.M ? 
            Object.fromEntries(
              Object.entries(response.Item.operation_costs.M).map(([k, v]) => [k, parseFloat((v as any).N || '0')])
            ) : {},
          requestCount: parseInt(response.Item.request_count?.N || '0'),
          lastUpdated: response.Item.last_updated?.S || ''
        });
      }
    } catch (error) {
      console.error(`Failed to get cost usage for ${date}:`, error);
    }
  }

  return usage.sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Get cost analytics and insights
 */
export async function getCostAnalytics(userId: string): Promise<{
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
  topOperations: Array<{ operation: string; cost: number; percentage: number }>;
  projectedMonthlyCost: number;
  recommendations: string[];
}> {
  const weeklyUsage = await getCostUsage(userId, 'week');
  const monthlyUsage = await getCostUsage(userId, 'month');

  const weeklyTotal = weeklyUsage.reduce((sum, usage) => sum + usage.totalCost, 0);
  const monthlyTotal = monthlyUsage.reduce((sum, usage) => sum + usage.totalCost, 0);
  const dailyAverage = weeklyTotal / 7;

  // Calculate top operations
  const operationTotals: Record<string, number> = {};
  monthlyUsage.forEach(usage => {
    Object.entries(usage.operationCosts).forEach(([op, cost]) => {
      operationTotals[op] = (operationTotals[op] || 0) + cost;
    });
  });

  const topOperations = Object.entries(operationTotals)
    .map(([operation, cost]) => ({
      operation,
      cost,
      percentage: (cost / monthlyTotal) * 100
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // Project monthly cost based on daily average
  const projectedMonthlyCost = dailyAverage * 30;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (projectedMonthlyCost > 50) {
    recommendations.push('Consider optimizing prompts to reduce token usage');
  }
  
  if (topOperations[0]?.percentage > 60) {
    recommendations.push(`${topOperations[0].operation} accounts for ${topOperations[0].percentage.toFixed(1)}% of costs - consider optimization`);
  }
  
  if (dailyAverage > 2) {
    recommendations.push('Daily costs are above $2 - consider implementing caching for repeated requests');
  }

  return {
    dailyAverage,
    weeklyTotal,
    monthlyTotal,
    topOperations,
    projectedMonthlyCost,
    recommendations
  };
}

/**
 * Reset throttling for user (admin function)
 */
export async function resetThrottling(userId: string, adminUserId: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: THROTTLE_CONFIG_TABLE,
    Key: {
      user_id: { S: userId }
    },
    UpdateExpression: 'SET config = :config, reset_by = :admin, reset_at = :timestamp',
    ExpressionAttributeValues: {
      ':config': { S: JSON.stringify({ enabled: false, maxRequestsPerMinute: 0, maxCostPerHour: 0, emergencyShutdown: false }) },
      ':admin': { S: adminUserId },
      ':timestamp': { S: new Date().toISOString() }
    }
  });

  await dynamoClient.send(command);

  // Audit log
  await auditTrailSystem.logAction({
    action: 'throttling_reset',
    actor: {
      type: 'admin',
      id: adminUserId,
      ip_address: undefined,
      user_agent: 'admin-panel'
    },
    resource: {
      type: 'throttle_config',
      id: userId,
      metadata: {
        resetReason: 'Admin override'
      }
    },
    context: {
      targetUserId: userId,
      success: true
    }
  });

  console.log(`Throttling reset for user ${userId} by admin ${adminUserId}`);
}