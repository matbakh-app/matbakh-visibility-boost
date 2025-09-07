/**
 * Real-time Cost Tracking System
 * Tracks AI service costs across all providers and users
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CostTrackingRecord, CostAnalytics, UsagePattern, TimePeriod } from './types';

export class CostTracker {
  private dynamoClient: DynamoDBDocumentClient;
  private cloudWatch: CloudWatchClient;
  private costTableName: string;
  private aggregatesTableName: string;

  constructor(
    region: string = 'eu-central-1',
    costTableName: string = 'ai-cost-tracking',
    aggregatesTableName: string = 'ai-cost-aggregates'
  ) {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.cloudWatch = new CloudWatchClient({ region });
    this.costTableName = costTableName;
    this.aggregatesTableName = aggregatesTableName;
  }

  /**
   * Record a cost tracking event
   */
  async recordCost(record: CostTrackingRecord): Promise<void> {
    try {
      // Store detailed record
      const command = new PutCommand({
        TableName: this.costTableName,
        Item: {
          PK: `USER#${record.userId}`,
          SK: `${record.timestamp}#${record.id}`,
          GSI1PK: `PROVIDER#${record.providerId}`,
          GSI1SK: record.timestamp,
          GSI2PK: `REQUEST_TYPE#${record.requestType}`,
          GSI2SK: record.timestamp,
          ...record,
          TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days retention
        },
      });

      await this.dynamoClient.send(command);

      // Update real-time aggregates
      await this.updateAggregates(record);

      // Send metrics to CloudWatch
      await this.sendCostMetrics(record);

      console.log(`Cost recorded: ${record.id} - $${record.cost.toFixed(4)}`);

    } catch (error) {
      console.error('Failed to record cost:', error);
      throw error;
    }
  }

  /**
   * Update real-time cost aggregates
   */
  private async updateAggregates(record: CostTrackingRecord): Promise<void> {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}`;
    const dayKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const updates = [
      // Global aggregates
      this.updateAggregate('GLOBAL', 'HOURLY', hourKey, record),
      this.updateAggregate('GLOBAL', 'DAILY', dayKey, record),
      this.updateAggregate('GLOBAL', 'MONTHLY', monthKey, record),
      
      // User aggregates
      this.updateAggregate(`USER#${record.userId}`, 'HOURLY', hourKey, record),
      this.updateAggregate(`USER#${record.userId}`, 'DAILY', dayKey, record),
      this.updateAggregate(`USER#${record.userId}`, 'MONTHLY', monthKey, record),
      
      // Provider aggregates
      this.updateAggregate(`PROVIDER#${record.providerId}`, 'HOURLY', hourKey, record),
      this.updateAggregate(`PROVIDER#${record.providerId}`, 'DAILY', dayKey, record),
      this.updateAggregate(`PROVIDER#${record.providerId}`, 'MONTHLY', monthKey, record),
      
      // Request type aggregates
      this.updateAggregate(`REQUEST_TYPE#${record.requestType}`, 'HOURLY', hourKey, record),
      this.updateAggregate(`REQUEST_TYPE#${record.requestType}`, 'DAILY', dayKey, record),
      this.updateAggregate(`REQUEST_TYPE#${record.requestType}`, 'MONTHLY', monthKey, record),
    ];

    await Promise.allSettled(updates);
  }

  /**
   * Update a specific aggregate
   */
  private async updateAggregate(
    scope: string,
    period: string,
    timeKey: string,
    record: CostTrackingRecord
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: this.aggregatesTableName,
        Key: {
          PK: scope,
          SK: `${period}#${timeKey}`,
        },
        UpdateExpression: `
          ADD totalCost :cost, 
              totalRequests :requests, 
              totalTokens :tokens,
              successfulRequests :success
          SET updatedAt = :timestamp
        `,
        ExpressionAttributeValues: {
          ':cost': record.cost,
          ':requests': 1,
          ':tokens': record.tokensUsed,
          ':success': record.metadata.success ? 1 : 0,
          ':timestamp': record.timestamp,
        },
      });

      await this.dynamoClient.send(command);

    } catch (error) {
      console.error(`Failed to update aggregate ${scope}:${period}:${timeKey}:`, error);
    }
  }

  /**
   * Send cost metrics to CloudWatch
   */
  private async sendCostMetrics(record: CostTrackingRecord): Promise<void> {
    try {
      const metricData = [
        {
          MetricName: 'AIServiceCost',
          Value: record.cost,
          Unit: 'None',
          Dimensions: [
            { Name: 'ProviderId', Value: record.providerId },
            { Name: 'RequestType', Value: record.requestType },
            { Name: 'UserId', Value: record.userId },
          ],
        },
        {
          MetricName: 'AIServiceTokens',
          Value: record.tokensUsed,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: record.providerId },
            { Name: 'RequestType', Value: record.requestType },
          ],
        },
        {
          MetricName: 'AIServiceRequests',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: record.providerId },
            { Name: 'RequestType', Value: record.requestType },
            { Name: 'Success', Value: record.metadata.success ? 'true' : 'false' },
          ],
        },
      ];

      const command = new PutMetricDataCommand({
        Namespace: 'AIOrchestrator/Costs',
        MetricData: metricData,
      });

      await this.cloudWatch.send(command);

    } catch (error) {
      console.error('Failed to send cost metrics:', error);
    }
  }

  /**
   * Get cost analytics for a specific period
   */
  async getCostAnalytics(
    period: TimePeriod,
    startDate: string,
    endDate: string,
    scope?: { type: string; id: string }
  ): Promise<CostAnalytics> {
    try {
      const scopeKey = scope ? `${scope.type.toUpperCase()}#${scope.id}` : 'GLOBAL';
      const periodKey = period.toUpperCase();

      // Query aggregates for the period
      const command = new QueryCommand({
        TableName: this.aggregatesTableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :period)',
        ExpressionAttributeValues: {
          ':pk': scopeKey,
          ':period': periodKey,
        },
      });

      const response = await this.dynamoClient.send(command);
      const aggregates = response.Items || [];

      // Calculate totals
      let totalCost = 0;
      let totalRequests = 0;
      let totalTokens = 0;
      let successfulRequests = 0;

      for (const aggregate of aggregates) {
        totalCost += aggregate.totalCost || 0;
        totalRequests += aggregate.totalRequests || 0;
        totalTokens += aggregate.totalTokens || 0;
        successfulRequests += aggregate.successfulRequests || 0;
      }

      // Get breakdown by provider, request type, and user (if global scope)
      const [costByProvider, costByRequestType, costByUser] = await Promise.all([
        this.getCostBreakdown('PROVIDER', period, startDate, endDate),
        this.getCostBreakdown('REQUEST_TYPE', period, startDate, endDate),
        scope?.type === 'global' ? this.getCostBreakdown('USER', period, startDate, endDate) : Promise.resolve({}),
      ]);

      // Calculate trends (simplified - would need historical data)
      const trends = {
        costTrend: 0, // Would calculate from previous period
        requestTrend: 0,
        efficiencyTrend: 0,
      };

      // Identify top cost drivers
      const allCosts = [
        ...Object.entries(costByProvider).map(([id, cost]) => ({ type: 'provider' as const, id, cost, percentage: (cost / totalCost) * 100 })),
        ...Object.entries(costByRequestType).map(([id, cost]) => ({ type: 'request_type' as const, id, cost, percentage: (cost / totalCost) * 100 })),
        ...Object.entries(costByUser).map(([id, cost]) => ({ type: 'user' as const, id, cost, percentage: (cost / totalCost) * 100 })),
      ];

      const topCostDrivers = allCosts
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      return {
        period,
        startDate,
        endDate,
        totalCost,
        totalRequests,
        totalTokens,
        averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
        averageCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
        costByProvider,
        costByRequestType,
        costByUser,
        topCostDrivers,
        trends,
      };

    } catch (error) {
      console.error('Failed to get cost analytics:', error);
      throw error;
    }
  }

  /**
   * Get cost breakdown by a specific dimension
   */
  private async getCostBreakdown(
    dimension: string,
    period: TimePeriod,
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> {
    try {
      // This would require a more complex query in production
      // For now, return empty object
      return {};
    } catch (error) {
      console.error(`Failed to get cost breakdown for ${dimension}:`, error);
      return {};
    }
  }

  /**
   * Get current usage for a scope
   */
  async getCurrentUsage(
    scope: string,
    period: TimePeriod = 'daily'
  ): Promise<{
    cost: number;
    requests: number;
    tokens: number;
  }> {
    try {
      const now = new Date();
      let timeKey: string;

      switch (period) {
        case 'hourly':
          timeKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}`;
          break;
        case 'daily':
          timeKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
          break;
        case 'weekly':
          // Calculate week start
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          timeKey = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'monthly':
          timeKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          timeKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      }

      const command = new QueryCommand({
        TableName: this.aggregatesTableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': scope,
          ':sk': `${period.toUpperCase()}#${timeKey}`,
        },
      });

      const response = await this.dynamoClient.send(command);
      const aggregate = response.Items?.[0];

      return {
        cost: aggregate?.totalCost || 0,
        requests: aggregate?.totalRequests || 0,
        tokens: aggregate?.totalTokens || 0,
      };

    } catch (error) {
      console.error(`Failed to get current usage for ${scope}:`, error);
      return { cost: 0, requests: 0, tokens: 0 };
    }
  }

  /**
   * Get usage pattern for analysis
   */
  async getUsagePattern(
    scope: string,
    lookbackDays: number = 30
  ): Promise<UsagePattern> {
    try {
      // This would require complex aggregation queries
      // For now, return a basic pattern
      return {
        pattern: {
          hourlyDistribution: new Array(24).fill(0),
          dailyDistribution: new Array(7).fill(0),
          monthlyTrend: new Array(12).fill(0),
        },
        averageRequestCost: 0,
        peakUsageHours: [],
        seasonality: [],
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`Failed to get usage pattern for ${scope}:`, error);
      throw error;
    }
  }

  /**
   * Batch record multiple cost events
   */
  async batchRecordCosts(records: CostTrackingRecord[]): Promise<void> {
    try {
      // Process in batches of 25 (DynamoDB limit)
      const batchSize = 25;
      const batches = [];

      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const writeRequests = batch.map(record => ({
          PutRequest: {
            Item: {
              PK: `USER#${record.userId}`,
              SK: `${record.timestamp}#${record.id}`,
              GSI1PK: `PROVIDER#${record.providerId}`,
              GSI1SK: record.timestamp,
              GSI2PK: `REQUEST_TYPE#${record.requestType}`,
              GSI2SK: record.timestamp,
              ...record,
              TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
            },
          },
        }));

        const command = new BatchWriteCommand({
          RequestItems: {
            [this.costTableName]: writeRequests,
          },
        });

        await this.dynamoClient.send(command);

        // Update aggregates for each record
        await Promise.all(batch.map(record => this.updateAggregates(record)));
      }

      console.log(`Batch recorded ${records.length} cost events`);

    } catch (error) {
      console.error('Failed to batch record costs:', error);
      throw error;
    }
  }

  /**
   * Get cost summary for dashboard
   */
  async getCostSummary(userId?: string): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    topProvider: string;
    topRequestType: string;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      const scope = userId ? `USER#${userId}` : 'GLOBAL';
      
      const [today, thisWeek, thisMonth] = await Promise.all([
        this.getCurrentUsage(scope, 'daily'),
        this.getCurrentUsage(scope, 'weekly'),
        this.getCurrentUsage(scope, 'monthly'),
      ]);

      return {
        today: today.cost,
        thisWeek: thisWeek.cost,
        thisMonth: thisMonth.cost,
        topProvider: 'claude-3-5-sonnet', // Would be calculated from actual data
        topRequestType: 'text_generation',
        trend: 'stable', // Would be calculated from historical data
      };

    } catch (error) {
      console.error('Failed to get cost summary:', error);
      throw error;
    }
  }
}