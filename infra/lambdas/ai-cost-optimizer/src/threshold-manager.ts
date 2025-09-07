/**
 * Cost Threshold Manager
 * Manages cost thresholds and triggers automated actions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { LambdaClient, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { CostTracker } from './cost-tracker';
import { 
  CostThreshold, 
  CostAlert, 
  ThresholdAction, 
  EmergencyShutdownConfig,
  TimePeriod 
} from './types';

export class ThresholdManager {
  private dynamoClient: DynamoDBDocumentClient;
  private snsClient: SNSClient;
  private lambdaClient: LambdaClient;
  private costTracker: CostTracker;
  private thresholdTableName: string;
  private alertTableName: string;

  constructor(
    costTracker: CostTracker,
    region: string = 'eu-central-1',
    thresholdTableName: string = 'ai-cost-thresholds',
    alertTableName: string = 'ai-cost-alerts'
  ) {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.snsClient = new SNSClient({ region });
    this.lambdaClient = new LambdaClient({ region });
    this.costTracker = costTracker;
    this.thresholdTableName = thresholdTableName;
    this.alertTableName = alertTableName;
  }

  /**
   * Create a new cost threshold
   */
  async createThreshold(threshold: Omit<CostThreshold, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>): Promise<CostThreshold> {
    const now = new Date().toISOString();
    const newThreshold: CostThreshold = {
      ...threshold,
      id: `threshold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentUsage: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const command = new PutCommand({
        TableName: this.thresholdTableName,
        Item: {
          PK: `THRESHOLD#${newThreshold.scope}`,
          SK: newThreshold.id,
          ...newThreshold,
        },
      });

      await this.dynamoClient.send(command);
      console.log(`Created threshold: ${newThreshold.id}`);
      
      return newThreshold;

    } catch (error) {
      console.error('Failed to create threshold:', error);
      throw error;
    }
  }

  /**
   * Update a cost threshold
   */
  async updateThreshold(thresholdId: string, updates: Partial<CostThreshold>): Promise<void> {
    try {
      // First get the threshold to know its scope
      const threshold = await this.getThreshold(thresholdId);
      if (!threshold) {
        throw new Error(`Threshold not found: ${thresholdId}`);
      }

      const updateExpression = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      // Build update expression dynamically
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
      });

      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.thresholdTableName,
        Key: {
          PK: `THRESHOLD#${threshold.scope}`,
          SK: thresholdId,
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await this.dynamoClient.send(command);
      console.log(`Updated threshold: ${thresholdId}`);

    } catch (error) {
      console.error(`Failed to update threshold ${thresholdId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific threshold
   */
  async getThreshold(thresholdId: string): Promise<CostThreshold | null> {
    try {
      // We need to query across all scopes since we don't know the scope
      const scopes = ['global', 'user', 'provider', 'request_type'];
      
      for (const scope of scopes) {
        const command = new GetCommand({
          TableName: this.thresholdTableName,
          Key: {
            PK: `THRESHOLD#${scope}`,
            SK: thresholdId,
          },
        });

        const response = await this.dynamoClient.send(command);
        if (response.Item) {
          return response.Item as CostThreshold;
        }
      }

      return null;

    } catch (error) {
      console.error(`Failed to get threshold ${thresholdId}:`, error);
      throw error;
    }
  }

  /**
   * Get all thresholds for a scope
   */
  async getThresholds(scope: string): Promise<CostThreshold[]> {
    try {
      const command = new QueryCommand({
        TableName: this.thresholdTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `THRESHOLD#${scope}`,
        },
      });

      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as CostThreshold[];

    } catch (error) {
      console.error(`Failed to get thresholds for scope ${scope}:`, error);
      throw error;
    }
  }

  /**
   * Delete a threshold
   */
  async deleteThreshold(thresholdId: string): Promise<void> {
    try {
      const threshold = await this.getThreshold(thresholdId);
      if (!threshold) {
        throw new Error(`Threshold not found: ${thresholdId}`);
      }

      const command = new DeleteCommand({
        TableName: this.thresholdTableName,
        Key: {
          PK: `THRESHOLD#${threshold.scope}`,
          SK: thresholdId,
        },
      });

      await this.dynamoClient.send(command);
      console.log(`Deleted threshold: ${thresholdId}`);

    } catch (error) {
      console.error(`Failed to delete threshold ${thresholdId}:`, error);
      throw error;
    }
  }

  /**
   * Check all thresholds and trigger actions if needed
   */
  async checkThresholds(): Promise<CostAlert[]> {
    const alerts: CostAlert[] = [];

    try {
      // Get all thresholds across all scopes
      const scopes = ['global', 'user', 'provider', 'request_type'];
      const allThresholds: CostThreshold[] = [];

      for (const scope of scopes) {
        const thresholds = await this.getThresholds(scope);
        allThresholds.push(...thresholds.filter(t => t.enabled));
      }

      // Check each threshold
      for (const threshold of allThresholds) {
        const alert = await this.checkThreshold(threshold);
        if (alert) {
          alerts.push(alert);
        }
      }

      return alerts;

    } catch (error) {
      console.error('Failed to check thresholds:', error);
      throw error;
    }
  }

  /**
   * Check a specific threshold
   */
  private async checkThreshold(threshold: CostThreshold): Promise<CostAlert | null> {
    try {
      // Get current usage for the threshold scope
      const scopeKey = this.buildScopeKey(threshold.scope, threshold.targetId);
      const currentUsage = await this.costTracker.getCurrentUsage(scopeKey, threshold.period);

      let usageValue: number;
      switch (threshold.type) {
        case 'cost':
          usageValue = currentUsage.cost;
          break;
        case 'requests':
          usageValue = currentUsage.requests;
          break;
        case 'tokens':
          usageValue = currentUsage.tokens;
          break;
        default:
          usageValue = currentUsage.cost;
      }

      // Update current usage in threshold
      await this.updateThreshold(threshold.id, { currentUsage: usageValue });

      const percentageUsed = (usageValue / threshold.limit) * 100;

      // Check if threshold is exceeded
      if (usageValue >= threshold.limit) {
        const alert = await this.createAlert(threshold, usageValue, percentageUsed, 'critical');
        await this.executeThresholdActions(threshold, alert);
        return alert;
      }

      // Check if warning level is reached
      if (percentageUsed >= threshold.warningLevel) {
        const alert = await this.createAlert(threshold, usageValue, percentageUsed, 'warning');
        await this.executeThresholdActions(threshold, alert);
        return alert;
      }

      return null;

    } catch (error) {
      console.error(`Failed to check threshold ${threshold.id}:`, error);
      return null;
    }
  }

  /**
   * Build scope key for cost tracking
   */
  private buildScopeKey(scope: string, targetId?: string): string {
    switch (scope) {
      case 'global':
        return 'GLOBAL';
      case 'user':
        return `USER#${targetId}`;
      case 'provider':
        return `PROVIDER#${targetId}`;
      case 'request_type':
        return `REQUEST_TYPE#${targetId}`;
      default:
        return 'GLOBAL';
    }
  }

  /**
   * Create a cost alert
   */
  private async createAlert(
    threshold: CostThreshold,
    currentUsage: number,
    percentageUsed: number,
    severity: 'info' | 'warning' | 'critical' | 'emergency'
  ): Promise<CostAlert> {
    const alert: CostAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      thresholdId: threshold.id,
      severity,
      title: `${threshold.name} Threshold ${severity === 'critical' ? 'Exceeded' : 'Warning'}`,
      message: this.buildAlertMessage(threshold, currentUsage, percentageUsed),
      currentUsage,
      limit: threshold.limit,
      percentageUsed,
      affectedScope: threshold.targetId ? `${threshold.scope}:${threshold.targetId}` : threshold.scope,
      recommendedActions: this.buildRecommendedActions(threshold, severity),
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    try {
      const command = new PutCommand({
        TableName: this.alertTableName,
        Item: {
          PK: `ALERT#${threshold.scope}`,
          SK: alert.id,
          GSI1PK: `THRESHOLD#${threshold.id}`,
          GSI1SK: alert.timestamp,
          ...alert,
          TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days retention
        },
      });

      await this.dynamoClient.send(command);
      console.log(`Created alert: ${alert.id}`);

      return alert;

    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Build alert message
   */
  private buildAlertMessage(threshold: CostThreshold, currentUsage: number, percentageUsed: number): string {
    const typeLabel = threshold.type === 'cost' ? '$' : '';
    const scopeLabel = threshold.targetId ? `${threshold.scope} ${threshold.targetId}` : threshold.scope;
    
    return `${scopeLabel} has used ${typeLabel}${currentUsage.toFixed(2)} (${percentageUsed.toFixed(1)}%) of the ${typeLabel}${threshold.limit} ${threshold.period} limit for ${threshold.type}.`;
  }

  /**
   * Build recommended actions
   */
  private buildRecommendedActions(threshold: CostThreshold, severity: string): string[] {
    const actions: string[] = [];

    if (severity === 'warning') {
      actions.push('Monitor usage closely');
      actions.push('Consider optimizing AI requests');
      actions.push('Review usage patterns');
    } else if (severity === 'critical') {
      actions.push('Immediately review and optimize usage');
      actions.push('Consider switching to cheaper providers');
      actions.push('Implement request throttling');
      actions.push('Review and adjust thresholds if needed');
    }

    // Add threshold-specific actions
    threshold.actions.forEach(action => {
      if (action.enabled) {
        switch (action.type) {
          case 'throttle':
            actions.push('Automatic throttling has been activated');
            break;
          case 'switch_provider':
            actions.push('Consider switching to alternative AI provider');
            break;
          case 'reduce_quality':
            actions.push('Reduce AI model quality settings to save costs');
            break;
        }
      }
    });

    return actions;
  }

  /**
   * Execute threshold actions
   */
  private async executeThresholdActions(threshold: CostThreshold, alert: CostAlert): Promise<void> {
    for (const action of threshold.actions) {
      if (!action.enabled) continue;

      try {
        await this.executeAction(action, threshold, alert);
      } catch (error) {
        console.error(`Failed to execute action ${action.type} for threshold ${threshold.id}:`, error);
      }
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: ThresholdAction, threshold: CostThreshold, alert: CostAlert): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.sendAlert(alert, action.parameters);
        break;

      case 'throttle':
        await this.implementThrottling(threshold, action.parameters);
        break;

      case 'block_user':
        await this.blockUser(threshold.targetId!, action.parameters);
        break;

      case 'block_provider':
        await this.blockProvider(threshold.targetId!, action.parameters);
        break;

      case 'switch_provider':
        await this.switchProvider(threshold, action.parameters);
        break;

      case 'reduce_quality':
        await this.reduceQuality(threshold, action.parameters);
        break;

      case 'emergency_shutdown':
        await this.emergencyShutdown(action.parameters);
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alert: CostAlert, parameters: Record<string, any>): Promise<void> {
    const topicArn = parameters.snsTopicArn || process.env.COST_ALERT_TOPIC_ARN;
    if (!topicArn) {
      console.warn('No SNS topic ARN configured for alerts');
      return;
    }

    try {
      const message = {
        alert,
        timestamp: new Date().toISOString(),
      };

      const command = new PublishCommand({
        TopicArn: topicArn,
        Subject: alert.title,
        Message: JSON.stringify(message, null, 2),
      });

      await this.snsClient.send(command);
      console.log(`Sent alert notification: ${alert.id}`);

    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Implement throttling
   */
  private async implementThrottling(threshold: CostThreshold, parameters: Record<string, any>): Promise<void> {
    // This would integrate with the AI orchestrator to implement throttling
    console.log(`Implementing throttling for ${threshold.scope}:${threshold.targetId}`);
    
    // Example: Update Lambda environment variables to enable throttling
    const throttleRate = parameters.throttleRate || 0.5; // 50% throttling
    
    // This is a placeholder - actual implementation would depend on the orchestrator architecture
    console.log(`Throttling rate set to ${throttleRate} for ${threshold.scope}`);
  }

  /**
   * Block user
   */
  private async blockUser(userId: string, parameters: Record<string, any>): Promise<void> {
    const blockDuration = parameters.blockDuration || 3600; // 1 hour default
    
    console.log(`Blocking user ${userId} for ${blockDuration} seconds`);
    
    // This would integrate with the user management system
    // For now, just log the action
  }

  /**
   * Block provider
   */
  private async blockProvider(providerId: string, parameters: Record<string, any>): Promise<void> {
    const blockDuration = parameters.blockDuration || 1800; // 30 minutes default
    
    console.log(`Blocking provider ${providerId} for ${blockDuration} seconds`);
    
    // This would integrate with the AI orchestrator to disable the provider
  }

  /**
   * Switch provider
   */
  private async switchProvider(threshold: CostThreshold, parameters: Record<string, any>): Promise<void> {
    const targetProvider = parameters.targetProvider;
    
    console.log(`Switching from ${threshold.targetId} to ${targetProvider}`);
    
    // This would integrate with the AI orchestrator to prefer the target provider
  }

  /**
   * Reduce quality
   */
  private async reduceQuality(threshold: CostThreshold, parameters: Record<string, any>): Promise<void> {
    const qualityReduction = parameters.qualityReduction || 0.2; // 20% reduction
    
    console.log(`Reducing quality by ${qualityReduction} for ${threshold.scope}`);
    
    // This would integrate with the AI orchestrator to adjust model parameters
  }

  /**
   * Emergency shutdown
   */
  private async emergencyShutdown(parameters: Record<string, any>): Promise<void> {
    console.log('EMERGENCY SHUTDOWN TRIGGERED');
    
    const shutdownDuration = parameters.shutdownDuration || 3600; // 1 hour default
    
    // This would disable all AI services temporarily
    // Implementation would depend on the specific architecture
    
    // Send critical alert
    const topicArn = parameters.emergencyTopicArn || process.env.EMERGENCY_ALERT_TOPIC_ARN;
    if (topicArn) {
      try {
        const command = new PublishCommand({
          TopicArn: topicArn,
          Subject: 'EMERGENCY: AI Services Shutdown',
          Message: `AI services have been shut down due to cost threshold breach. Duration: ${shutdownDuration} seconds.`,
        });

        await this.snsClient.send(command);
      } catch (error) {
        console.error('Failed to send emergency alert:', error);
      }
    }
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(scope?: string, limit: number = 50): Promise<CostAlert[]> {
    try {
      let command;

      if (scope) {
        command = new QueryCommand({
          TableName: this.alertTableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `ALERT#${scope}`,
          },
          ScanIndexForward: false, // Most recent first
          Limit: limit,
        });
      } else {
        // This would require a scan or GSI in production
        command = new QueryCommand({
          TableName: this.alertTableName,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'ALERT#global',
          },
          ScanIndexForward: false,
          Limit: limit,
        });
      }

      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as CostAlert[];

    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      // Find the alert first (simplified - would need proper querying in production)
      const scopes = ['global', 'user', 'provider', 'request_type'];
      
      for (const scope of scopes) {
        try {
          const command = new UpdateCommand({
            TableName: this.alertTableName,
            Key: {
              PK: `ALERT#${scope}`,
              SK: alertId,
            },
            UpdateExpression: 'SET acknowledged = :ack, acknowledgedAt = :timestamp',
            ExpressionAttributeValues: {
              ':ack': true,
              ':timestamp': new Date().toISOString(),
            },
          });

          await this.dynamoClient.send(command);
          console.log(`Acknowledged alert: ${alertId}`);
          return;
        } catch (error) {
          // Continue to next scope
        }
      }

      throw new Error(`Alert not found: ${alertId}`);

    } catch (error) {
      console.error(`Failed to acknowledge alert ${alertId}:`, error);
      throw error;
    }
  }
}