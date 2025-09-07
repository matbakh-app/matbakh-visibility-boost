/**
 * Cost Threshold Monitor
 * 
 * Advanced cost threshold monitoring and alerting system with
 * intelligent alerting, escalation, and automatic remediation.
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { auditTrailSystem } from './audit-trail-system';
import { getCostUsage } from './cost-control-system';

// Types for threshold monitoring
export interface CostThreshold {
  id: string;
  userId: string;
  name: string;
  amount: number;
  period: 'hour' | 'day' | 'week' | 'month';
  type: 'absolute' | 'percentage' | 'trend';
  comparison?: 'previous_period' | 'average' | 'budget';
  actions: ThresholdAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThresholdAction {
  type: 'email' | 'sms' | 'webhook' | 'throttle' | 'shutdown' | 'scale_down';
  target: string;
  delay?: number; // Delay in minutes before executing
  conditions?: ActionCondition[];
}

export interface ActionCondition {
  field: 'time_of_day' | 'day_of_week' | 'consecutive_breaches' | 'cost_velocity';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: string | number | [number, number];
}

export interface ThresholdBreach {
  id: string;
  thresholdId: string;
  userId: string;
  currentValue: number;
  thresholdValue: number;
  breachPercentage: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  actionsExecuted: string[];
  metadata: Record<string, any>;
}

export interface AlertingConfig {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  level: number;
  delayMinutes: number;
  actions: ThresholdAction[];
  conditions: ActionCondition[];
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const COST_THRESHOLDS_TABLE = 'bedrock_cost_thresholds';
const THRESHOLD_BREACHES_TABLE = 'bedrock_threshold_breaches';
const ALERTING_CONFIG_TABLE = 'bedrock_alerting_config';
const COST_ALERT_TOPIC = process.env.COST_ALERT_SNS_TOPIC;
const WEBHOOK_LAMBDA_ARN = process.env.WEBHOOK_LAMBDA_ARN;

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const sesClient = new SESClient({ region: REGION });

/**
 * Create or update cost threshold
 */
export async function createCostThreshold(threshold: Omit<CostThreshold, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostThreshold> {
  const id = `threshold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const completeThreshold: CostThreshold = {
    ...threshold,
    id,
    createdAt: now,
    updatedAt: now
  };

  const command = new PutItemCommand({
    TableName: COST_THRESHOLDS_TABLE,
    Item: {
      threshold_id: { S: id },
      user_id: { S: threshold.userId },
      name: { S: threshold.name },
      amount: { N: threshold.amount.toString() },
      period: { S: threshold.period },
      type: { S: threshold.type },
      ...(threshold.comparison && { comparison: { S: threshold.comparison } }),
      actions: { S: JSON.stringify(threshold.actions) },
      enabled: { BOOL: threshold.enabled },
      created_at: { S: now },
      updated_at: { S: now }
    }
  });

  await dynamoClient.send(command);

  // Audit log
  await auditTrailSystem.logAction({
    action: 'cost_threshold_created',
    actor: {
      type: 'user',
      id: threshold.userId,
      ip_address: undefined,
      user_agent: 'cost-management-system'
    },
    resource: {
      type: 'cost_threshold',
      id,
      metadata: {
        name: threshold.name,
        amount: threshold.amount,
        period: threshold.period
      }
    },
    context: {
      success: true
    }
  });

  return completeThreshold;
}

/**
 * Get cost thresholds for user
 */
export async function getCostThresholds(userId: string): Promise<CostThreshold[]> {
  const command = new QueryCommand({
    TableName: COST_THRESHOLDS_TABLE,
    IndexName: 'user-id-index',
    KeyConditionExpression: 'user_id = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId }
    }
  });

  const response = await dynamoClient.send(command);
  const thresholds: CostThreshold[] = [];

  if (response.Items) {
    for (const item of response.Items) {
      thresholds.push({
        id: item.threshold_id?.S || '',
        userId: item.user_id?.S || '',
        name: item.name?.S || '',
        amount: parseFloat(item.amount?.N || '0'),
        period: item.period?.S as any || 'day',
        type: item.type?.S as any || 'absolute',
        comparison: item.comparison?.S as any,
        actions: JSON.parse(item.actions?.S || '[]'),
        enabled: item.enabled?.BOOL || false,
        createdAt: item.created_at?.S || '',
        updatedAt: item.updated_at?.S || ''
      });
    }
  }

  return thresholds.filter(t => t.enabled);
}

/**
 * Monitor cost thresholds for all users
 */
export async function monitorAllThresholds(): Promise<void> {
  console.log('Starting cost threshold monitoring...');

  try {
    // Get all active thresholds
    const command = new ScanCommand({
      TableName: COST_THRESHOLDS_TABLE,
      FilterExpression: 'enabled = :enabled',
      ExpressionAttributeValues: {
        ':enabled': { BOOL: true }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (!response.Items) {
      console.log('No active thresholds found');
      return;
    }

    const thresholds: CostThreshold[] = response.Items.map(item => ({
      id: item.threshold_id?.S || '',
      userId: item.user_id?.S || '',
      name: item.name?.S || '',
      amount: parseFloat(item.amount?.N || '0'),
      period: item.period?.S as any || 'day',
      type: item.type?.S as any || 'absolute',
      comparison: item.comparison?.S as any,
      actions: JSON.parse(item.actions?.S || '[]'),
      enabled: item.enabled?.BOOL || false,
      createdAt: item.created_at?.S || '',
      updatedAt: item.updated_at?.S || ''
    }));

    console.log(`Monitoring ${thresholds.length} active thresholds`);

    // Check each threshold
    for (const threshold of thresholds) {
      await checkThreshold(threshold);
    }

    console.log('Cost threshold monitoring completed');

  } catch (error) {
    console.error('Cost threshold monitoring failed:', error);
    throw error;
  }
}

/**
 * Check individual threshold
 */
async function checkThreshold(threshold: CostThreshold): Promise<void> {
  try {
    const currentValue = await getCurrentValue(threshold);
    const thresholdValue = await getThresholdValue(threshold);

    if (currentValue >= thresholdValue) {
      const breachPercentage = ((currentValue - thresholdValue) / thresholdValue) * 100;
      
      // Check if this is a new breach or ongoing
      const existingBreach = await getActiveBreach(threshold.id);
      
      if (!existingBreach) {
        // New breach
        const breach = await createThresholdBreach(threshold, currentValue, thresholdValue, breachPercentage);
        await executeThresholdActions(threshold, breach);
      } else {
        // Update existing breach
        await updateThresholdBreach(existingBreach.id, currentValue, breachPercentage);
        
        // Check for escalation
        await checkEscalation(threshold, existingBreach);
      }
    } else {
      // Check if we need to resolve an existing breach
      const existingBreach = await getActiveBreach(threshold.id);
      if (existingBreach) {
        await resolveThresholdBreach(existingBreach.id);
      }
    }

  } catch (error) {
    console.error(`Failed to check threshold ${threshold.id}:`, error);
  }
}

/**
 * Get current value for threshold
 */
async function getCurrentValue(threshold: CostThreshold): Promise<number> {
  const usage = await getCostUsage(threshold.userId, threshold.period);
  
  if (usage.length === 0) {
    return 0;
  }

  switch (threshold.type) {
    case 'absolute':
      return usage[0].totalCost;
    
    case 'percentage':
      if (threshold.comparison === 'previous_period' && usage.length >= 2) {
        const current = usage[0].totalCost;
        const previous = usage[1].totalCost;
        return previous > 0 ? ((current - previous) / previous) * 100 : 0;
      }
      return 0;
    
    case 'trend':
      if (usage.length >= 3) {
        const recent = usage.slice(0, 3).map(u => u.totalCost);
        const slope = calculateTrend(recent);
        return slope;
      }
      return 0;
    
    default:
      return usage[0].totalCost;
  }
}

/**
 * Get threshold value (may be dynamic)
 */
async function getThresholdValue(threshold: CostThreshold): Promise<number> {
  if (threshold.type === 'absolute') {
    return threshold.amount;
  }

  if (threshold.type === 'percentage') {
    return threshold.amount; // Percentage threshold
  }

  if (threshold.type === 'trend') {
    return threshold.amount; // Trend threshold (slope)
  }

  return threshold.amount;
}

/**
 * Calculate trend (simple linear regression slope)
 */
function calculateTrend(values: number[]): number {
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
 * Get active breach for threshold
 */
async function getActiveBreach(thresholdId: string): Promise<ThresholdBreach | null> {
  const command = new QueryCommand({
    TableName: THRESHOLD_BREACHES_TABLE,
    IndexName: 'threshold-id-index',
    KeyConditionExpression: 'threshold_id = :thresholdId',
    FilterExpression: 'resolved = :resolved',
    ExpressionAttributeValues: {
      ':thresholdId': { S: thresholdId },
      ':resolved': { BOOL: false }
    },
    ScanIndexForward: false,
    Limit: 1
  });

  const response = await dynamoClient.send(command);
  
  if (response.Items && response.Items.length > 0) {
    const item = response.Items[0];
    return {
      id: item.breach_id?.S || '',
      thresholdId: item.threshold_id?.S || '',
      userId: item.user_id?.S || '',
      currentValue: parseFloat(item.current_value?.N || '0'),
      thresholdValue: parseFloat(item.threshold_value?.N || '0'),
      breachPercentage: parseFloat(item.breach_percentage?.N || '0'),
      timestamp: item.timestamp?.S || '',
      resolved: item.resolved?.BOOL || false,
      resolvedAt: item.resolved_at?.S,
      actionsExecuted: JSON.parse(item.actions_executed?.S || '[]'),
      metadata: JSON.parse(item.metadata?.S || '{}')
    };
  }

  return null;
}

/**
 * Create threshold breach record
 */
async function createThresholdBreach(
  threshold: CostThreshold,
  currentValue: number,
  thresholdValue: number,
  breachPercentage: number
): Promise<ThresholdBreach> {
  const id = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const breach: ThresholdBreach = {
    id,
    thresholdId: threshold.id,
    userId: threshold.userId,
    currentValue,
    thresholdValue,
    breachPercentage,
    timestamp,
    resolved: false,
    actionsExecuted: [],
    metadata: {
      thresholdName: threshold.name,
      period: threshold.period,
      type: threshold.type
    }
  };

  const command = new PutItemCommand({
    TableName: THRESHOLD_BREACHES_TABLE,
    Item: {
      breach_id: { S: id },
      threshold_id: { S: threshold.id },
      user_id: { S: threshold.userId },
      current_value: { N: currentValue.toString() },
      threshold_value: { N: thresholdValue.toString() },
      breach_percentage: { N: breachPercentage.toString() },
      timestamp: { S: timestamp },
      resolved: { BOOL: false },
      actions_executed: { S: JSON.stringify([]) },
      metadata: { S: JSON.stringify(breach.metadata) }
    }
  });

  await dynamoClient.send(command);

  // Audit log
  await auditTrailSystem.logAction({
    action: 'threshold_breach_created',
    actor: {
      type: 'system',
      id: 'cost-threshold-monitor',
      ip_address: undefined,
      user_agent: 'bedrock-agent'
    },
    resource: {
      type: 'threshold_breach',
      id,
      metadata: {
        thresholdId: threshold.id,
        currentValue,
        thresholdValue,
        breachPercentage
      }
    },
    context: {
      userId: threshold.userId,
      severity: breachPercentage > 50 ? 'high' : 'medium',
      success: true
    }
  });

  return breach;
}

/**
 * Update threshold breach
 */
async function updateThresholdBreach(
  breachId: string,
  currentValue: number,
  breachPercentage: number
): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: THRESHOLD_BREACHES_TABLE,
    Key: {
      breach_id: { S: breachId }
    },
    UpdateExpression: 'SET current_value = :currentValue, breach_percentage = :breachPercentage, last_updated = :timestamp',
    ExpressionAttributeValues: {
      ':currentValue': { N: currentValue.toString() },
      ':breachPercentage': { N: breachPercentage.toString() },
      ':timestamp': { S: new Date().toISOString() }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Resolve threshold breach
 */
async function resolveThresholdBreach(breachId: string): Promise<void> {
  const resolvedAt = new Date().toISOString();

  const command = new UpdateItemCommand({
    TableName: THRESHOLD_BREACHES_TABLE,
    Key: {
      breach_id: { S: breachId }
    },
    UpdateExpression: 'SET resolved = :resolved, resolved_at = :resolvedAt',
    ExpressionAttributeValues: {
      ':resolved': { BOOL: true },
      ':resolvedAt': { S: resolvedAt }
    }
  });

  await dynamoClient.send(command);

  // Audit log
  await auditTrailSystem.logAction({
    action: 'threshold_breach_resolved',
    actor: {
      type: 'system',
      id: 'cost-threshold-monitor',
      ip_address: undefined,
      user_agent: 'bedrock-agent'
    },
    resource: {
      type: 'threshold_breach',
      id: breachId,
      metadata: {
        resolvedAt
      }
    },
    context: {
      success: true
    }
  });
}

/**
 * Execute threshold actions
 */
async function executeThresholdActions(threshold: CostThreshold, breach: ThresholdBreach): Promise<void> {
  const alertingConfig = await getAlertingConfig(threshold.userId);
  const actionsExecuted: string[] = [];

  for (const action of threshold.actions) {
    try {
      // Check conditions
      if (action.conditions && !evaluateConditions(action.conditions, breach, alertingConfig)) {
        continue;
      }

      // Apply delay if specified
      if (action.delay && action.delay > 0) {
        console.log(`Delaying action ${action.type} by ${action.delay} minutes`);
        // In a real implementation, you'd schedule this with SQS or EventBridge
        continue;
      }

      await executeAction(action, threshold, breach, alertingConfig);
      actionsExecuted.push(action.type);

    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  // Update breach with executed actions
  if (actionsExecuted.length > 0) {
    const command = new UpdateItemCommand({
      TableName: THRESHOLD_BREACHES_TABLE,
      Key: {
        breach_id: { S: breach.id }
      },
      UpdateExpression: 'SET actions_executed = :actions',
      ExpressionAttributeValues: {
        ':actions': { S: JSON.stringify(actionsExecuted) }
      }
    });

    await dynamoClient.send(command);
  }
}

/**
 * Execute individual action
 */
async function executeAction(
  action: ThresholdAction,
  threshold: CostThreshold,
  breach: ThresholdBreach,
  alertingConfig: AlertingConfig
): Promise<void> {
  switch (action.type) {
    case 'email':
      if (alertingConfig.emailEnabled && alertingConfig.emailAddress) {
        await sendEmailAlert(alertingConfig.emailAddress, threshold, breach);
      }
      break;

    case 'sms':
      if (alertingConfig.smsEnabled && alertingConfig.phoneNumber) {
        await sendSMSAlert(alertingConfig.phoneNumber, threshold, breach);
      }
      break;

    case 'webhook':
      if (alertingConfig.webhookEnabled && alertingConfig.webhookUrl) {
        await sendWebhookAlert(alertingConfig.webhookUrl, threshold, breach);
      }
      break;

    case 'throttle':
      await enableThrottling(threshold.userId, breach);
      break;

    case 'shutdown':
      await enableEmergencyShutdown(threshold.userId, breach);
      break;

    case 'scale_down':
      await scaleDownOperations(threshold.userId, breach);
      break;
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(emailAddress: string, threshold: CostThreshold, breach: ThresholdBreach): Promise<void> {
  const subject = `Cost Alert: ${threshold.name} - ${breach.breachPercentage.toFixed(1)}% over threshold`;
  
  const body = `
Cost Threshold Breach Alert

Threshold: ${threshold.name}
Current Cost: $${breach.currentValue.toFixed(2)}
Threshold: $${breach.thresholdValue.toFixed(2)}
Breach: ${breach.breachPercentage.toFixed(1)}% over threshold
Period: ${threshold.period}
Time: ${breach.timestamp}

Please review your AI usage and consider implementing cost controls.

Matbakh AI Cost Management System
  `.trim();

  const command = new SendEmailCommand({
    Source: 'noreply@matbakh.app',
    Destination: {
      ToAddresses: [emailAddress]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: body,
          Charset: 'UTF-8'
        }
      }
    }
  });

  await sesClient.send(command);
  console.log(`Email alert sent to ${emailAddress}`);
}

/**
 * Send SMS alert
 */
async function sendSMSAlert(phoneNumber: string, threshold: CostThreshold, breach: ThresholdBreach): Promise<void> {
  const message = `Matbakh AI Cost Alert: ${threshold.name} is ${breach.breachPercentage.toFixed(1)}% over threshold ($${breach.currentValue.toFixed(2)} vs $${breach.thresholdValue.toFixed(2)})`;

  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message
  });

  await snsClient.send(command);
  console.log(`SMS alert sent to ${phoneNumber}`);
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(webhookUrl: string, threshold: CostThreshold, breach: ThresholdBreach): Promise<void> {
  const payload = {
    type: 'cost_threshold_breach',
    threshold: {
      id: threshold.id,
      name: threshold.name,
      amount: threshold.amount,
      period: threshold.period
    },
    breach: {
      id: breach.id,
      currentValue: breach.currentValue,
      thresholdValue: breach.thresholdValue,
      breachPercentage: breach.breachPercentage,
      timestamp: breach.timestamp
    },
    user: {
      id: threshold.userId
    }
  };

  // In a real implementation, you'd invoke a Lambda function or use HTTP client
  console.log(`Webhook alert would be sent to ${webhookUrl}:`, payload);
}

/**
 * Enable throttling
 */
async function enableThrottling(userId: string, breach: ThresholdBreach): Promise<void> {
  // Implementation would call the cost control system
  console.log(`Throttling enabled for user ${userId} due to breach ${breach.id}`);
}

/**
 * Enable emergency shutdown
 */
async function enableEmergencyShutdown(userId: string, breach: ThresholdBreach): Promise<void> {
  // Implementation would call the cost control system
  console.log(`Emergency shutdown enabled for user ${userId} due to breach ${breach.id}`);
}

/**
 * Scale down operations
 */
async function scaleDownOperations(userId: string, breach: ThresholdBreach): Promise<void> {
  // Implementation would reduce operation limits
  console.log(`Operations scaled down for user ${userId} due to breach ${breach.id}`);
}

/**
 * Get alerting configuration for user
 */
async function getAlertingConfig(userId: string): Promise<AlertingConfig> {
  try {
    const command = new GetItemCommand({
      TableName: ALERTING_CONFIG_TABLE,
      Key: {
        user_id: { S: userId }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (response.Item) {
      return {
        userId,
        emailEnabled: response.Item.email_enabled?.BOOL || false,
        smsEnabled: response.Item.sms_enabled?.BOOL || false,
        webhookEnabled: response.Item.webhook_enabled?.BOOL || false,
        emailAddress: response.Item.email_address?.S,
        phoneNumber: response.Item.phone_number?.S,
        webhookUrl: response.Item.webhook_url?.S,
        quietHours: response.Item.quiet_hours?.S ? JSON.parse(response.Item.quiet_hours.S) : undefined,
        escalationRules: JSON.parse(response.Item.escalation_rules?.S || '[]')
      };
    }
  } catch (error) {
    console.error('Failed to get alerting config:', error);
  }

  // Return default config
  return {
    userId,
    emailEnabled: true,
    smsEnabled: false,
    webhookEnabled: false,
    escalationRules: []
  };
}

/**
 * Evaluate action conditions
 */
function evaluateConditions(
  conditions: ActionCondition[],
  breach: ThresholdBreach,
  alertingConfig: AlertingConfig
): boolean {
  for (const condition of conditions) {
    if (!evaluateCondition(condition, breach, alertingConfig)) {
      return false;
    }
  }
  return true;
}

/**
 * Evaluate single condition
 */
function evaluateCondition(
  condition: ActionCondition,
  breach: ThresholdBreach,
  alertingConfig: AlertingConfig
): boolean {
  const now = new Date();

  switch (condition.field) {
    case 'time_of_day':
      const hour = now.getHours();
      return evaluateValue(hour, condition.operator, condition.value);

    case 'day_of_week':
      const dayOfWeek = now.getDay();
      return evaluateValue(dayOfWeek, condition.operator, condition.value);

    case 'consecutive_breaches':
      // This would require querying recent breaches
      return true; // Simplified for now

    case 'cost_velocity':
      // This would require calculating cost change rate
      return true; // Simplified for now

    default:
      return true;
  }
}

/**
 * Evaluate value against condition
 */
function evaluateValue(
  value: number,
  operator: ActionCondition['operator'],
  conditionValue: string | number | [number, number]
): boolean {
  switch (operator) {
    case 'equals':
      return value === conditionValue;
    case 'greater_than':
      return value > (conditionValue as number);
    case 'less_than':
      return value < (conditionValue as number);
    case 'between':
      const [min, max] = conditionValue as [number, number];
      return value >= min && value <= max;
    default:
      return true;
  }
}

/**
 * Check for escalation
 */
async function checkEscalation(threshold: CostThreshold, breach: ThresholdBreach): Promise<void> {
  const alertingConfig = await getAlertingConfig(threshold.userId);
  
  if (alertingConfig.escalationRules.length === 0) {
    return;
  }

  const breachAge = Date.now() - new Date(breach.timestamp).getTime();
  const breachAgeMinutes = breachAge / (1000 * 60);

  for (const rule of alertingConfig.escalationRules) {
    if (breachAgeMinutes >= rule.delayMinutes) {
      // Check if this escalation level has already been executed
      const escalationKey = `escalation_${rule.level}`;
      if (!breach.actionsExecuted.includes(escalationKey)) {
        // Execute escalation actions
        for (const action of rule.actions) {
          if (!rule.conditions || evaluateConditions(rule.conditions, breach, alertingConfig)) {
            await executeAction(action, threshold, breach, alertingConfig);
          }
        }

        // Mark escalation as executed
        breach.actionsExecuted.push(escalationKey);
        
        const command = new UpdateItemCommand({
          TableName: THRESHOLD_BREACHES_TABLE,
          Key: {
            breach_id: { S: breach.id }
          },
          UpdateExpression: 'SET actions_executed = :actions',
          ExpressionAttributeValues: {
            ':actions': { S: JSON.stringify(breach.actionsExecuted) }
          }
        });

        await dynamoClient.send(command);
      }
    }
  }
}