/**
 * Cost Control Feature Flag System
 * 
 * Integrates cost monitoring with feature flags to provide:
 * - Real-time cost tracking and thresholds
 * - Automatic feature disabling based on cost limits
 * - Emergency shutdown capabilities
 * - Cost-based A/B testing controls
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { featureFlagManager, UserContext } from './feature-flag-manager';

export interface CostMetrics {
  daily_cost: number;
  monthly_cost: number;
  total_requests: number;
  average_cost_per_request: number;
  last_updated: string;
  cost_breakdown: {
    bedrock_claude: number;
    bedrock_other: number;
    external_apis: number;
    storage: number;
  };
}

export interface CostThreshold {
  threshold_name: string;
  limit_usd: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  action: 'alert' | 'throttle' | 'disable' | 'emergency_shutdown';
  affected_features: string[];
  alert_channels: string[];
  enabled: boolean;
}

export interface CostAlert {
  alert_id: string;
  threshold_name: string;
  current_cost: number;
  limit: number;
  percentage: number;
  timestamp: string;
  action_taken: string;
  affected_features: string[];
}

/**
 * Cost Control Manager with Feature Flag Integration
 */
export class CostControlManager {
  private dynamoClient: DynamoDBClient;
  private cloudWatchClient: CloudWatchClient;
  private costMetricsTable: string;
  private costThresholdsTable: string;
  private costAlertsTable: string;

  constructor(region: string = 'eu-central-1') {
    this.dynamoClient = new DynamoDBClient({ region });
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.costMetricsTable = process.env.COST_METRICS_TABLE || 'bedrock-cost-metrics';
    this.costThresholdsTable = process.env.COST_THRESHOLDS_TABLE || 'bedrock-cost-thresholds';
    this.costAlertsTable = process.env.COST_ALERTS_TABLE || 'bedrock-cost-alerts';
  }

  /**
   * Record cost for a request
   */
  async recordRequestCost(
    requestType: string,
    tokenUsage: number,
    estimatedCost: number,
    _userContext: UserContext
  ): Promise<void> {
    try {
      // Update daily metrics
      await this.updateDailyCostMetrics(requestType, estimatedCost, tokenUsage);
      
      // Send metrics to CloudWatch
      await this.sendCloudWatchMetrics(requestType, estimatedCost, tokenUsage);
      
      // Check cost thresholds
      await this.checkCostThresholds();
      
      console.log(`Cost recorded: ${requestType} - $${estimatedCost.toFixed(4)} (${tokenUsage} tokens)`);
    } catch (error) {
      console.error('Failed to record request cost:', error);
    }
  }

  /**
   * Update daily cost metrics in DynamoDB
   */
  private async updateDailyCostMetrics(
    requestType: string,
    cost: number,
    tokenUsage: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = { date: today, request_type: requestType };

    try {
      const command = new UpdateItemCommand({
        TableName: this.costMetricsTable,
        Key: marshall(key),
        UpdateExpression: `
          ADD daily_cost :cost, total_requests :one, total_tokens :tokens
          SET last_updated = :timestamp
        `,
        ExpressionAttributeValues: marshall({
          ':cost': cost,
          ':one': 1,
          ':tokens': tokenUsage,
          ':timestamp': new Date().toISOString()
        }),
        ReturnValues: 'ALL_NEW'
      });

      await this.dynamoClient.send(command);
    } catch (error) {
      console.error('Failed to update daily cost metrics:', error);
    }
  }

  /**
   * Send cost metrics to CloudWatch
   */
  private async sendCloudWatchMetrics(
    requestType: string,
    cost: number,
    tokenUsage: number
  ): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'BedrockAI/Costs',
        MetricData: [
          {
            MetricName: 'RequestCost',
            Value: cost,
            Unit: 'None',
            Dimensions: [
              { Name: 'RequestType', Value: requestType }
            ],
            Timestamp: new Date()
          },
          {
            MetricName: 'TokenUsage',
            Value: tokenUsage,
            Unit: 'Count',
            Dimensions: [
              { Name: 'RequestType', Value: requestType }
            ],
            Timestamp: new Date()
          }
        ]
      });

      await this.cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to send CloudWatch metrics:', error);
    }
  }

  /**
   * Get current cost metrics
   */
  async getCurrentCostMetrics(period: 'daily' | 'monthly' = 'daily'): Promise<CostMetrics | null> {
    try {
      const date = period === 'daily' 
        ? new Date().toISOString().split('T')[0]
        : new Date().toISOString().substring(0, 7); // YYYY-MM

      const command = new GetItemCommand({
        TableName: this.costMetricsTable,
        Key: marshall({ date, request_type: 'total' })
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      return unmarshall(response.Item) as CostMetrics;
    } catch (error) {
      console.error('Failed to get current cost metrics:', error);
      return null;
    }
  }

  /**
   * Check all cost thresholds and take actions
   */
  async checkCostThresholds(): Promise<void> {
    try {
      const thresholds = await this.getAllCostThresholds();
      const currentMetrics = await this.getCurrentCostMetrics();

      if (!currentMetrics) {
        return;
      }

      for (const threshold of thresholds) {
        if (!threshold.enabled) continue;

        const currentCost = currentMetrics.daily_cost;
        const percentage = (currentCost / threshold.limit_usd) * 100;

        // Check if threshold is exceeded
        if (currentCost >= threshold.limit_usd) {
          await this.handleThresholdExceeded(threshold, currentCost, percentage);
        }
        // Check if approaching threshold (80% or higher)
        else if (percentage >= 80) {
          await this.handleThresholdWarning(threshold, currentCost, percentage);
        }
      }
    } catch (error) {
      console.error('Failed to check cost thresholds:', error);
    }
  }

  /**
   * Handle threshold exceeded
   */
  private async handleThresholdExceeded(
    threshold: CostThreshold,
    currentCost: number,
    percentage: number
  ): Promise<void> {
    console.warn(`Cost threshold exceeded: ${threshold.threshold_name} - $${currentCost} (${percentage.toFixed(1)}%)`);

    // Create alert
    const alert: CostAlert = {
      alert_id: `alert-${Date.now()}`,
      threshold_name: threshold.threshold_name,
      current_cost: currentCost,
      limit: threshold.limit_usd,
      percentage,
      timestamp: new Date().toISOString(),
      action_taken: threshold.action,
      affected_features: threshold.affected_features
    };

    await this.recordCostAlert(alert);

    // Take action based on threshold configuration
    switch (threshold.action) {
      case 'alert':
        await this.sendCostAlert(alert);
        break;
      
      case 'throttle':
        await this.throttleFeatures(threshold.affected_features, 50); // 50% throttle
        break;
      
      case 'disable':
        await this.disableFeatures(threshold.affected_features, 'cost_threshold_exceeded');
        break;
      
      case 'emergency_shutdown':
        await this.emergencyShutdownFeatures(threshold.affected_features, 'cost_limit_exceeded');
        break;
    }
  }

  /**
   * Handle threshold warning (approaching limit)
   */
  private async handleThresholdWarning(
    threshold: CostThreshold,
    currentCost: number,
    percentage: number
  ): Promise<void> {
    console.warn(`Approaching cost threshold: ${threshold.threshold_name} - $${currentCost} (${percentage.toFixed(1)}%)`);

    const alert: CostAlert = {
      alert_id: `warning-${Date.now()}`,
      threshold_name: threshold.threshold_name,
      current_cost: currentCost,
      limit: threshold.limit_usd,
      percentage,
      timestamp: new Date().toISOString(),
      action_taken: 'warning',
      affected_features: threshold.affected_features
    };

    await this.recordCostAlert(alert);
    await this.sendCostAlert(alert);
  }

  /**
   * Throttle features by reducing rollout percentage
   */
  private async throttleFeatures(featureNames: string[], throttlePercentage: number): Promise<void> {
    for (const featureName of featureNames) {
      const flag = await featureFlagManager.getFlag(featureName);
      if (flag && flag.rollout_percentage) {
        const newPercentage = Math.max(0, flag.rollout_percentage * (throttlePercentage / 100));
        await featureFlagManager.updateFlag(featureName, {
          rollout_percentage: newPercentage
        }, 'cost-control-system');
        
        console.log(`Throttled ${featureName}: ${flag.rollout_percentage}% -> ${newPercentage}%`);
      }
    }
  }

  /**
   * Disable features
   */
  private async disableFeatures(featureNames: string[], reason: string): Promise<void> {
    for (const featureName of featureNames) {
      await featureFlagManager.updateFlag(featureName, {
        enabled: false,
        description: `Disabled due to: ${reason}`
      }, 'cost-control-system');
      
      console.log(`Disabled feature: ${featureName} - Reason: ${reason}`);
    }
  }

  /**
   * Emergency shutdown features
   */
  private async emergencyShutdownFeatures(featureNames: string[], reason: string): Promise<void> {
    for (const featureName of featureNames) {
      await featureFlagManager.emergencyShutdown(featureName, reason, 'cost-control-system');
      console.error(`EMERGENCY SHUTDOWN: ${featureName} - Reason: ${reason}`);
    }
  }

  /**
   * Get all cost thresholds
   */
  private async getAllCostThresholds(): Promise<CostThreshold[]> {
    // In a real implementation, this would scan the thresholds table
    // For now, return default thresholds
    return [
      {
        threshold_name: 'daily_bedrock_limit',
        limit_usd: 100,
        period: 'daily',
        action: 'throttle',
        affected_features: ['vc_bedrock_live'],
        alert_channels: ['email', 'slack'],
        enabled: true
      },
      {
        threshold_name: 'daily_emergency_limit',
        limit_usd: 500,
        period: 'daily',
        action: 'emergency_shutdown',
        affected_features: ['vc_bedrock_live', 'vc_bedrock_rollout_percent'],
        alert_channels: ['email', 'slack', 'pagerduty'],
        enabled: true
      }
    ];
  }

  /**
   * Record cost alert
   */
  private async recordCostAlert(alert: CostAlert): Promise<void> {
    try {
      const command = new PutItemCommand({
        TableName: this.costAlertsTable,
        Item: marshall(alert)
      });

      await this.dynamoClient.send(command);
    } catch (error) {
      console.error('Failed to record cost alert:', error);
    }
  }

  /**
   * Send cost alert (placeholder implementation)
   */
  private async sendCostAlert(alert: CostAlert): Promise<void> {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.warn('COST ALERT:', JSON.stringify(alert, null, 2));
  }

  /**
   * Check if request should be allowed based on cost controls
   */
  async shouldAllowRequest(
    _requestType: string,
    estimatedCost: number,
    _userContext: UserContext
  ): Promise<{ allowed: boolean; reason: string }> {
    try {
      const currentMetrics = await this.getCurrentCostMetrics();
      
      if (!currentMetrics) {
        return { allowed: true, reason: 'no_metrics_available' };
      }

      // Check if adding this request would exceed any thresholds
      const projectedCost = currentMetrics.daily_cost + estimatedCost;
      const thresholds = await this.getAllCostThresholds();

      for (const threshold of thresholds) {
        if (!threshold.enabled) continue;
        
        if (projectedCost >= threshold.limit_usd) {
          return { 
            allowed: false, 
            reason: `would_exceed_${threshold.threshold_name}` 
          };
        }
      }

      return { allowed: true, reason: 'within_limits' };
    } catch (error) {
      console.error('Failed to check cost controls:', error);
      // Fail open - allow request if we can't check costs
      return { allowed: true, reason: 'cost_check_failed' };
    }
  }

  /**
   * Get cost summary for monitoring dashboard
   */
  async getCostSummary(): Promise<{
    daily: CostMetrics | null;
    monthly: CostMetrics | null;
    alerts: CostAlert[];
    thresholds: CostThreshold[];
  }> {
    const [daily, monthly, thresholds] = await Promise.all([
      this.getCurrentCostMetrics('daily'),
      this.getCurrentCostMetrics('monthly'),
      this.getAllCostThresholds()
    ]);

    // Get recent alerts (placeholder - would query alerts table)
    const alerts: CostAlert[] = [];

    return { daily, monthly, alerts, thresholds };
  }
}

/**
 * Singleton instance for global use
 */
export const costControlManager = new CostControlManager();