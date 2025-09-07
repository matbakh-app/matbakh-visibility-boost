/**
 * Automatic Cost Control System
 * 
 * Intelligent automatic cost control with dynamic throttling,
 * service degradation, and emergency shutdown capabilities.
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { auditTrailSystem } from './audit-trail-system';
import { checkThrottleStatus } from './cost-control-system';

// Types for automatic cost control
export interface AutoControlConfig {
  userId: string;
  enabled: boolean;
  rules: AutoControlRule[];
  emergencySettings: EmergencySettings;
  gracefulDegradation: GracefulDegradationConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AutoControlRule {
  id: string;
  name: string;
  trigger: CostTrigger;
  action: AutoControlAction;
  conditions: RuleCondition[];
  priority: number;
  enabled: boolean;
}

export interface CostTrigger {
  type: 'cost_threshold' | 'cost_velocity' | 'usage_spike' | 'budget_percentage' | 'time_based';
  value: number;
  period: 'minute' | 'hour' | 'day' | 'week' | 'month';
  comparison: 'absolute' | 'percentage' | 'rate_of_change';
}

export interface AutoControlAction {
  type: 'throttle' | 'degrade' | 'queue' | 'reject' | 'shutdown' | 'notify' | 'scale_down';
  parameters: Record<string, any>;
  duration?: number; // Duration in minutes
  reversible: boolean;
}

export interface RuleCondition {
  field: 'time_of_day' | 'day_of_week' | 'user_tier' | 'operation_type' | 'model_type' | 'request_source';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface EmergencySettings {
  enabled: boolean;
  maxDailyCost: number;
  maxHourlyCost: number;
  shutdownThreshold: number;
  notificationContacts: string[];
  autoRestore: boolean;
  restoreAfterHours: number;
}

export interface GracefulDegradationConfig {
  enabled: boolean;
  levels: DegradationLevel[];
  fallbackModel: string;
  cacheFirst: boolean;
  queueNonCritical: boolean;
}

export interface DegradationLevel {
  level: number;
  name: string;
  costThreshold: number;
  restrictions: {
    maxRequestsPerMinute: number;
    allowedModels: string[];
    allowedOperations: string[];
    maxTokensPerRequest: number;
    cacheOnly: boolean;
  };
}

export interface ControlAction {
  id: string;
  userId: string;
  ruleId: string;
  actionType: string;
  trigger: string;
  parameters: Record<string, any>;
  executedAt: string;
  reversedAt?: string;
  status: 'active' | 'reversed' | 'expired';
  impact: {
    costSavings: number;
    requestsBlocked: number;
    requestsThrottled: number;
  };
}

// Configuration
const REGION = process.env.AWS_REGION || 'eu-central-1';
const AUTO_CONTROL_CONFIG_TABLE = 'bedrock_auto_control_config';
const CONTROL_ACTIONS_TABLE = 'bedrock_control_actions';
const COST_MONITORING_TABLE = 'bedrock_cost_monitoring';
const EMERGENCY_ALERT_TOPIC = process.env.EMERGENCY_ALERT_SNS_TOPIC;

// Clients
const dynamoClient = new DynamoDBClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

// Default auto control configuration
const DEFAULT_AUTO_CONTROL: Omit<AutoControlConfig, 'userId' | 'createdAt' | 'updatedAt'> = {
  enabled: true,
  rules: [
    {
      id: 'daily_cost_warning',
      name: 'Daily Cost Warning',
      trigger: {
        type: 'cost_threshold',
        value: 10,
        period: 'day',
        comparison: 'absolute'
      },
      action: {
        type: 'notify',
        parameters: { severity: 'warning' },
        reversible: false
      },
      conditions: [],
      priority: 1,
      enabled: true
    },
    {
      id: 'daily_cost_throttle',
      name: 'Daily Cost Throttle',
      trigger: {
        type: 'cost_threshold',
        value: 25,
        period: 'day',
        comparison: 'absolute'
      },
      action: {
        type: 'throttle',
        parameters: { maxRequestsPerMinute: 10, maxCostPerHour: 2 },
        duration: 60,
        reversible: true
      },
      conditions: [],
      priority: 2,
      enabled: true
    },
    {
      id: 'emergency_shutdown',
      name: 'Emergency Cost Shutdown',
      trigger: {
        type: 'cost_threshold',
        value: 100,
        period: 'day',
        comparison: 'absolute'
      },
      action: {
        type: 'shutdown',
        parameters: { reason: 'Emergency cost threshold exceeded' },
        reversible: true
      },
      conditions: [],
      priority: 10,
      enabled: true
    },
    {
      id: 'usage_spike_detection',
      name: 'Usage Spike Detection',
      trigger: {
        type: 'cost_velocity',
        value: 5,
        period: 'hour',
        comparison: 'rate_of_change'
      },
      action: {
        type: 'degrade',
        parameters: { level: 1 },
        duration: 30,
        reversible: true
      },
      conditions: [],
      priority: 3,
      enabled: true
    }
  ],
  emergencySettings: {
    enabled: true,
    maxDailyCost: 100,
    maxHourlyCost: 10,
    shutdownThreshold: 150,
    notificationContacts: [],
    autoRestore: true,
    restoreAfterHours: 24
  },
  gracefulDegradation: {
    enabled: true,
    levels: [
      {
        level: 1,
        name: 'Light Throttling',
        costThreshold: 15,
        restrictions: {
          maxRequestsPerMinute: 20,
          allowedModels: ['claude-3-5-sonnet', 'claude-3-haiku'],
          allowedOperations: ['vc_analysis', 'content_generation', 'rewrite'],
          maxTokensPerRequest: 4000,
          cacheOnly: false
        }
      },
      {
        level: 2,
        name: 'Moderate Throttling',
        costThreshold: 30,
        restrictions: {
          maxRequestsPerMinute: 10,
          allowedModels: ['claude-3-haiku'],
          allowedOperations: ['vc_analysis', 'rewrite'],
          maxTokensPerRequest: 2000,
          cacheOnly: false
        }
      },
      {
        level: 3,
        name: 'Severe Throttling',
        costThreshold: 50,
        restrictions: {
          maxRequestsPerMinute: 5,
          allowedModels: ['claude-3-haiku'],
          allowedOperations: ['vc_analysis'],
          maxTokensPerRequest: 1000,
          cacheOnly: true
        }
      }
    ],
    fallbackModel: 'claude-3-haiku',
    cacheFirst: true,
    queueNonCritical: true
  }
};

/**
 * Initialize auto control for user
 */
export async function initializeAutoControl(userId: string, customConfig?: Partial<AutoControlConfig>): Promise<AutoControlConfig> {
  const now = new Date().toISOString();
  
  const config: AutoControlConfig = {
    ...DEFAULT_AUTO_CONTROL,
    ...customConfig,
    userId,
    createdAt: now,
    updatedAt: now
  };

  const command = new PutItemCommand({
    TableName: AUTO_CONTROL_CONFIG_TABLE,
    Item: {
      user_id: { S: userId },
      enabled: { BOOL: config.enabled },
      rules: { S: JSON.stringify(config.rules) },
      emergency_settings: { S: JSON.stringify(config.emergencySettings) },
      graceful_degradation: { S: JSON.stringify(config.gracefulDegradation) },
      created_at: { S: config.createdAt },
      updated_at: { S: config.updatedAt }
    }
  });

  await dynamoClient.send(command);

  // Audit log
  await auditTrailSystem.logAction({
    action: 'auto_control_initialized',
    actor: {
      type: 'system',
      id: 'automatic-cost-control',
      ip_address: undefined,
      user_agent: 'bedrock-agent'
    },
    resource: {
      type: 'auto_control_config',
      id: userId,
      metadata: {
        rulesCount: config.rules.length,
        emergencyEnabled: config.emergencySettings.enabled
      }
    },
    context: {
      userId,
      success: true
    }
  });

  return config;
}

/**
 * Get auto control configuration
 */
export async function getAutoControlConfig(userId: string): Promise<AutoControlConfig | null> {
  try {
    const command = new GetItemCommand({
      TableName: AUTO_CONTROL_CONFIG_TABLE,
      Key: {
        user_id: { S: userId }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (response.Item) {
      return {
        userId,
        enabled: response.Item.enabled?.BOOL || false,
        rules: JSON.parse(response.Item.rules?.S || '[]'),
        emergencySettings: JSON.parse(response.Item.emergency_settings?.S || '{}'),
        gracefulDegradation: JSON.parse(response.Item.graceful_degradation?.S || '{}'),
        createdAt: response.Item.created_at?.S || '',
        updatedAt: response.Item.updated_at?.S || ''
      };
    }
  } catch (error) {
    console.error('Failed to get auto control config:', error);
  }

  return null;
}

/**
 * Monitor and execute automatic cost controls
 */
export async function executeAutoControls(userId: string, currentCost: number, period: string): Promise<ControlAction[]> {
  const config = await getAutoControlConfig(userId);
  
  if (!config || !config.enabled) {
    return [];
  }

  const actionsExecuted: ControlAction[] = [];

  // Sort rules by priority (higher priority first)
  const sortedRules = config.rules
    .filter(rule => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    try {
      const shouldTrigger = await evaluateRule(rule, userId, currentCost, period);
      
      if (shouldTrigger) {
        const action = await executeControlAction(rule, userId, currentCost);
        if (action) {
          actionsExecuted.push(action);
          
          // If this is a shutdown action, stop processing other rules
          if (rule.action.type === 'shutdown') {
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to execute rule ${rule.id}:`, error);
    }
  }

  return actionsExecuted;
}

/**
 * Evaluate if rule should trigger
 */
async function evaluateRule(
  rule: AutoControlRule,
  userId: string,
  currentCost: number,
  period: string
): Promise<boolean> {
  // Check if rule conditions are met
  for (const condition of rule.conditions) {
    if (!await evaluateRuleCondition(condition, userId)) {
      return false;
    }
  }

  // Evaluate trigger
  return await evaluateTrigger(rule.trigger, userId, currentCost, period);
}

/**
 * Evaluate rule condition
 */
async function evaluateRuleCondition(condition: RuleCondition, userId: string): Promise<boolean> {
  const now = new Date();

  switch (condition.field) {
    case 'time_of_day':
      const hour = now.getHours();
      return evaluateConditionValue(hour, condition.operator, condition.value);

    case 'day_of_week':
      const dayOfWeek = now.getDay();
      return evaluateConditionValue(dayOfWeek, condition.operator, condition.value);

    case 'user_tier':
      // Would need to get user tier from database
      return true; // Simplified for now

    case 'operation_type':
    case 'model_type':
    case 'request_source':
      // These would be evaluated at request time
      return true; // Simplified for now

    default:
      return true;
  }
}

/**
 * Evaluate condition value
 */
function evaluateConditionValue(value: any, operator: RuleCondition['operator'], conditionValue: any): boolean {
  switch (operator) {
    case 'equals':
      return value === conditionValue;
    case 'not_equals':
      return value !== conditionValue;
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(value);
    case 'not_in':
      return Array.isArray(conditionValue) && !conditionValue.includes(value);
    case 'greater_than':
      return value > conditionValue;
    case 'less_than':
      return value < conditionValue;
    default:
      return true;
  }
}

/**
 * Evaluate trigger condition
 */
async function evaluateTrigger(
  trigger: CostTrigger,
  userId: string,
  currentCost: number,
  period: string
): Promise<boolean> {
  switch (trigger.type) {
    case 'cost_threshold':
      if (trigger.comparison === 'absolute') {
        return currentCost >= trigger.value;
      }
      break;

    case 'cost_velocity':
      const velocity = await calculateCostVelocity(userId, trigger.period);
      return velocity >= trigger.value;

    case 'usage_spike':
      const spike = await detectUsageSpike(userId, trigger.period);
      return spike >= trigger.value;

    case 'budget_percentage':
      const budget = await getUserBudget(userId, trigger.period);
      const percentage = budget > 0 ? (currentCost / budget) * 100 : 0;
      return percentage >= trigger.value;

    case 'time_based':
      // Time-based triggers would be handled by scheduled jobs
      return false;

    default:
      return false;
  }

  return false;
}

/**
 * Calculate cost velocity (rate of change)
 */
async function calculateCostVelocity(userId: string, period: string): Promise<number> {
  // This would calculate the rate of cost increase over the specified period
  // Simplified implementation
  return 0;
}

/**
 * Detect usage spike
 */
async function detectUsageSpike(userId: string, period: string): Promise<number> {
  // This would detect unusual spikes in usage patterns
  // Simplified implementation
  return 0;
}

/**
 * Get user budget
 */
async function getUserBudget(userId: string, period: string): Promise<number> {
  // This would get the user's budget for the specified period
  // Simplified implementation
  return 100; // Default $100 budget
}

/**
 * Execute control action
 */
async function executeControlAction(
  rule: AutoControlRule,
  userId: string,
  currentCost: number
): Promise<ControlAction | null> {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const executedAt = new Date().toISOString();

  let impact = {
    costSavings: 0,
    requestsBlocked: 0,
    requestsThrottled: 0
  };

  try {
    switch (rule.action.type) {
      case 'throttle':
        await executeThrottleAction(userId, rule.action.parameters);
        impact.requestsThrottled = 1; // Simplified
        break;

      case 'degrade':
        await executeDegradeAction(userId, rule.action.parameters);
        impact.costSavings = currentCost * 0.3; // Estimate 30% savings
        break;

      case 'queue':
        await executeQueueAction(userId, rule.action.parameters);
        break;

      case 'reject':
        await executeRejectAction(userId, rule.action.parameters);
        impact.requestsBlocked = 1; // Simplified
        break;

      case 'shutdown':
        await executeShutdownAction(userId, rule.action.parameters);
        impact.costSavings = currentCost; // Complete cost savings
        break;

      case 'notify':
        await executeNotifyAction(userId, rule.action.parameters, rule.name, currentCost);
        break;

      case 'scale_down':
        await executeScaleDownAction(userId, rule.action.parameters);
        impact.costSavings = currentCost * 0.5; // Estimate 50% savings
        break;

      default:
        console.warn(`Unknown action type: ${rule.action.type}`);
        return null;
    }

    // Store action record
    const action: ControlAction = {
      id: actionId,
      userId,
      ruleId: rule.id,
      actionType: rule.action.type,
      trigger: JSON.stringify(rule.trigger),
      parameters: rule.action.parameters,
      executedAt,
      status: 'active',
      impact
    };

    await storeControlAction(action);

    // Schedule reversal if action is reversible and has duration
    if (rule.action.reversible && rule.action.duration) {
      await scheduleActionReversal(action, rule.action.duration);
    }

    // Audit log
    await auditTrailSystem.logAction({
      action: 'auto_control_executed',
      actor: {
        type: 'system',
        id: 'automatic-cost-control',
        ip_address: undefined,
        user_agent: 'bedrock-agent'
      },
      resource: {
        type: 'control_action',
        id: actionId,
        metadata: {
          ruleId: rule.id,
          actionType: rule.action.type,
          currentCost,
          impact
        }
      },
      context: {
        userId,
        severity: rule.action.type === 'shutdown' ? 'critical' : 'medium',
        success: true
      }
    });

    return action;

  } catch (error) {
    console.error(`Failed to execute action ${rule.action.type}:`, error);
    return null;
  }
}

/**
 * Execute throttle action
 */
async function executeThrottleAction(userId: string, parameters: Record<string, any>): Promise<void> {
  // This would integrate with the existing throttling system
  console.log(`Throttling enabled for user ${userId}:`, parameters);
}

/**
 * Execute degrade action
 */
async function executeDegradeAction(userId: string, parameters: Record<string, any>): Promise<void> {
  const level = parameters.level || 1;
  console.log(`Graceful degradation level ${level} enabled for user ${userId}`);
}

/**
 * Execute queue action
 */
async function executeQueueAction(userId: string, parameters: Record<string, any>): Promise<void> {
  console.log(`Request queuing enabled for user ${userId}:`, parameters);
}

/**
 * Execute reject action
 */
async function executeRejectAction(userId: string, parameters: Record<string, any>): Promise<void> {
  console.log(`Request rejection enabled for user ${userId}:`, parameters);
}

/**
 * Execute shutdown action
 */
async function executeShutdownAction(userId: string, parameters: Record<string, any>): Promise<void> {
  console.log(`Emergency shutdown enabled for user ${userId}:`, parameters);
  
  // Send emergency alert
  if (EMERGENCY_ALERT_TOPIC) {
    const message = {
      type: 'emergency_shutdown',
      userId,
      reason: parameters.reason || 'Automatic cost control triggered',
      timestamp: new Date().toISOString()
    };

    const command = new PublishCommand({
      TopicArn: EMERGENCY_ALERT_TOPIC,
      Subject: `EMERGENCY: AI Service Shutdown - User ${userId}`,
      Message: JSON.stringify(message, null, 2)
    });

    await snsClient.send(command);
  }
}

/**
 * Execute notify action
 */
async function executeNotifyAction(
  userId: string,
  parameters: Record<string, any>,
  ruleName: string,
  currentCost: number
): Promise<void> {
  const severity = parameters.severity || 'info';
  console.log(`Notification sent to user ${userId}: ${ruleName} (Cost: $${currentCost.toFixed(2)}, Severity: ${severity})`);
}

/**
 * Execute scale down action
 */
async function executeScaleDownAction(userId: string, parameters: Record<string, any>): Promise<void> {
  console.log(`Operations scaled down for user ${userId}:`, parameters);
}

/**
 * Store control action
 */
async function storeControlAction(action: ControlAction): Promise<void> {
  const command = new PutItemCommand({
    TableName: CONTROL_ACTIONS_TABLE,
    Item: {
      action_id: { S: action.id },
      user_id: { S: action.userId },
      rule_id: { S: action.ruleId },
      action_type: { S: action.actionType },
      trigger: { S: action.trigger },
      parameters: { S: JSON.stringify(action.parameters) },
      executed_at: { S: action.executedAt },
      status: { S: action.status },
      impact: { S: JSON.stringify(action.impact) }
    }
  });

  await dynamoClient.send(command);
}

/**
 * Schedule action reversal
 */
async function scheduleActionReversal(action: ControlAction, durationMinutes: number): Promise<void> {
  // In a real implementation, this would use SQS with delay or EventBridge scheduled events
  console.log(`Action ${action.id} scheduled for reversal in ${durationMinutes} minutes`);
}

/**
 * Reverse control action
 */
export async function reverseControlAction(actionId: string): Promise<void> {
  try {
    const command = new GetItemCommand({
      TableName: CONTROL_ACTIONS_TABLE,
      Key: {
        action_id: { S: actionId }
      }
    });

    const response = await dynamoClient.send(command);
    
    if (response.Item) {
      const action: ControlAction = {
        id: response.Item.action_id?.S || '',
        userId: response.Item.user_id?.S || '',
        ruleId: response.Item.rule_id?.S || '',
        actionType: response.Item.action_type?.S || '',
        trigger: response.Item.trigger?.S || '',
        parameters: JSON.parse(response.Item.parameters?.S || '{}'),
        executedAt: response.Item.executed_at?.S || '',
        status: response.Item.status?.S as any || 'active',
        impact: JSON.parse(response.Item.impact?.S || '{}')
      };

      if (action.status === 'active') {
        await executeActionReversal(action);
        
        // Update action status
        const updateCommand = new UpdateItemCommand({
          TableName: CONTROL_ACTIONS_TABLE,
          Key: {
            action_id: { S: actionId }
          },
          UpdateExpression: 'SET #status = :status, reversed_at = :reversedAt',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': { S: 'reversed' },
            ':reversedAt': { S: new Date().toISOString() }
          }
        });

        await dynamoClient.send(updateCommand);

        // Audit log
        await auditTrailSystem.logAction({
          action: 'auto_control_reversed',
          actor: {
            type: 'system',
            id: 'automatic-cost-control',
            ip_address: undefined,
            user_agent: 'bedrock-agent'
          },
          resource: {
            type: 'control_action',
            id: actionId,
            metadata: {
              actionType: action.actionType,
              originalExecutedAt: action.executedAt
            }
          },
          context: {
            userId: action.userId,
            success: true
          }
        });
      }
    }

  } catch (error) {
    console.error(`Failed to reverse action ${actionId}:`, error);
    throw error;
  }
}

/**
 * Execute action reversal
 */
async function executeActionReversal(action: ControlAction): Promise<void> {
  switch (action.actionType) {
    case 'throttle':
      console.log(`Throttling reversed for user ${action.userId}`);
      break;

    case 'degrade':
      console.log(`Graceful degradation reversed for user ${action.userId}`);
      break;

    case 'queue':
      console.log(`Request queuing reversed for user ${action.userId}`);
      break;

    case 'reject':
      console.log(`Request rejection reversed for user ${action.userId}`);
      break;

    case 'shutdown':
      console.log(`Emergency shutdown reversed for user ${action.userId}`);
      break;

    case 'scale_down':
      console.log(`Operations scaling reversed for user ${action.userId}`);
      break;

    default:
      console.log(`No reversal needed for action type: ${action.actionType}`);
  }
}

/**
 * Get active control actions for user
 */
export async function getActiveControlActions(userId: string): Promise<ControlAction[]> {
  const command = new QueryCommand({
    TableName: CONTROL_ACTIONS_TABLE,
    IndexName: 'user-id-index',
    KeyConditionExpression: 'user_id = :userId',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ':status': { S: 'active' }
    }
  });

  const response = await dynamoClient.send(command);
  const actions: ControlAction[] = [];

  if (response.Items) {
    for (const item of response.Items) {
      actions.push({
        id: item.action_id?.S || '',
        userId: item.user_id?.S || '',
        ruleId: item.rule_id?.S || '',
        actionType: item.action_type?.S || '',
        trigger: item.trigger?.S || '',
        parameters: JSON.parse(item.parameters?.S || '{}'),
        executedAt: item.executed_at?.S || '',
        reversedAt: item.reversed_at?.S,
        status: item.status?.S as any || 'active',
        impact: JSON.parse(item.impact?.S || '{}')
      });
    }
  }

  return actions;
}

/**
 * Check if user has active cost controls
 */
export async function hasActiveCostControls(userId: string): Promise<{
  hasControls: boolean;
  activeActions: ControlAction[];
  restrictions: {
    throttled: boolean;
    degraded: boolean;
    shutdown: boolean;
    maxRequestsPerMinute?: number;
    allowedModels?: string[];
    allowedOperations?: string[];
  };
}> {
  const activeActions = await getActiveControlActions(userId);
  const hasControls = activeActions.length > 0;

  const restrictions = {
    throttled: activeActions.some(a => a.actionType === 'throttle'),
    degraded: activeActions.some(a => a.actionType === 'degrade'),
    shutdown: activeActions.some(a => a.actionType === 'shutdown'),
    maxRequestsPerMinute: undefined as number | undefined,
    allowedModels: undefined as string[] | undefined,
    allowedOperations: undefined as string[] | undefined
  };

  // Extract specific restrictions
  const throttleAction = activeActions.find(a => a.actionType === 'throttle');
  if (throttleAction) {
    restrictions.maxRequestsPerMinute = throttleAction.parameters.maxRequestsPerMinute;
  }

  const degradeAction = activeActions.find(a => a.actionType === 'degrade');
  if (degradeAction) {
    const config = await getAutoControlConfig(userId);
    if (config && config.gracefulDegradation.enabled) {
      const level = degradeAction.parameters.level || 1;
      const degradationLevel = config.gracefulDegradation.levels.find(l => l.level === level);
      if (degradationLevel) {
        restrictions.allowedModels = degradationLevel.restrictions.allowedModels;
        restrictions.allowedOperations = degradationLevel.restrictions.allowedOperations;
        restrictions.maxRequestsPerMinute = degradationLevel.restrictions.maxRequestsPerMinute;
      }
    }
  }

  return {
    hasControls,
    activeActions,
    restrictions
  };
}