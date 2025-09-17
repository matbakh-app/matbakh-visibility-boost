import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  TemplateExecution,
  PerformanceMetrics,
  DetailedMetrics,
  TokenUsage,
  ExecutionStatus,
  ExecutionError,
  ExecutionMetadata,
  AIProvider,
  Environment,
  TemplateAnalytics,
  TrendDataPoint
} from './types';

export class PerformanceTrackingManager {
  private dynamoClient: DynamoDBDocumentClient;
  private executionsTable: string;
  private versionsTable: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.executionsTable = process.env.EXECUTIONS_TABLE || 'template-executions';
    this.versionsTable = process.env.VERSIONS_TABLE || 'template-versions';
  }

  async recordExecution(execution: Omit<TemplateExecution, 'id' | 'timestamp'>): Promise<string> {
    const executionId = uuidv4();
    const timestamp = new Date().toISOString();

    const fullExecution: TemplateExecution = {
      ...execution,
      id: executionId,
      timestamp
    };

    // Store execution record
    await this.dynamoClient.send(new PutCommand({
      TableName: this.executionsTable,
      Item: fullExecution
    }));

    // Update performance metrics asynchronously
    this.updatePerformanceMetrics(execution.templateVersionId, fullExecution).catch(error => {
      console.error('Failed to update performance metrics:', error);
    });

    return executionId;
  }

  async getExecutionHistory(
    templateVersionId: string,
    limit: number = 100,
    startTime?: string,
    endTime?: string
  ): Promise<TemplateExecution[]> {
    const keyCondition = 'templateVersionId = :templateVersionId';
    const expressionValues: any = {
      ':templateVersionId': templateVersionId
    };

    let filterExpression = '';
    if (startTime || endTime) {
      const conditions = [];
      if (startTime) {
        conditions.push('#timestamp >= :startTime');
        expressionValues[':startTime'] = startTime;
      }
      if (endTime) {
        conditions.push('#timestamp <= :endTime');
        expressionValues[':endTime'] = endTime;
      }
      filterExpression = conditions.join(' AND ');
    }

    const params: any = {
      TableName: this.executionsTable,
      IndexName: 'templateVersionId-timestamp-index',
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      Limit: limit,
      ScanIndexForward: false
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeNames = { '#timestamp': 'timestamp' };
    }

    const result = await this.dynamoClient.send(new QueryCommand(params));
    return result.Items as TemplateExecution[] || [];
  }

  async getPerformanceMetrics(templateVersionId: string): Promise<PerformanceMetrics | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.versionsTable,
      Key: { id: templateVersionId },
      ProjectionExpression: 'performanceMetrics'
    }));

    return result.Item?.performanceMetrics as PerformanceMetrics || null;
  }

  async getTemplateAnalytics(
    templateId: string,
    startDate: string,
    endDate: string
  ): Promise<TemplateAnalytics> {
    // Get all versions for the template
    const versionsResult = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'templateId-version-index',
      KeyConditionExpression: 'templateId = :templateId',
      ExpressionAttributeValues: {
        ':templateId': templateId
      }
    }));

    const versions = versionsResult.Items || [];
    const versionIds = versions.map(v => v.id);

    // Aggregate metrics across all versions
    let totalExecutions = 0;
    let uniqueUsers = new Set<string>();
    const trendData: Record<string, TrendDataPoint> = {};
    const variantPerformance: Record<string, any> = {};

    for (const versionId of versionIds) {
      const executions = await this.getExecutionHistory(versionId, 1000, startDate, endDate);
      
      totalExecutions += executions.length;
      
      executions.forEach(exec => {
        if (exec.userId) uniqueUsers.add(exec.userId);
        
        // Aggregate by date
        const date = exec.timestamp.split('T')[0];
        if (!trendData[date]) {
          trendData[date] = {
            date,
            executions: 0,
            successRate: 0,
            averageResponseTime: 0,
            cost: 0
          };
        }
        
        trendData[date].executions++;
        trendData[date].averageResponseTime += exec.responseTime;
        trendData[date].cost += exec.tokenUsage.cost;
        
        if (exec.status === 'success') {
          trendData[date].successRate++;
        }

        // Track variant performance
        if (exec.abTestVariant) {
          if (!variantPerformance[exec.abTestVariant]) {
            variantPerformance[exec.abTestVariant] = {
              variantId: exec.abTestVariant,
              name: exec.abTestVariant,
              executions: 0,
              performanceScore: 0,
              conversionRate: 0
            };
          }
          variantPerformance[exec.abTestVariant].executions++;
        }
      });
    }

    // Calculate averages and success rates
    Object.values(trendData).forEach(point => {
      if (point.executions > 0) {
        point.averageResponseTime /= point.executions;
        point.successRate = (point.successRate / point.executions) * 100;
      }
    });

    // Calculate average performance metrics
    const averagePerformance = await this.calculateAveragePerformance(versionIds);

    return {
      templateId,
      timeRange: { start: startDate, end: endDate },
      totalExecutions,
      uniqueUsers: uniqueUsers.size,
      averagePerformance,
      trendData: Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date)),
      topVariants: Object.values(variantPerformance),
      recommendations: this.generateRecommendations(averagePerformance, totalExecutions)
    };
  }

  async getExecutionsByStatus(
    templateVersionId: string,
    status: ExecutionStatus,
    limit: number = 50
  ): Promise<TemplateExecution[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.executionsTable,
      IndexName: 'templateVersionId-status-index',
      KeyConditionExpression: 'templateVersionId = :templateVersionId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':templateVersionId': templateVersionId,
        ':status': status
      },
      Limit: limit,
      ScanIndexForward: false
    }));

    return result.Items as TemplateExecution[] || [];
  }

  async getTopErrorPatterns(templateVersionId: string, limit: number = 10): Promise<Array<{
    errorCode: string;
    count: number;
    percentage: number;
    lastOccurrence: string;
  }>> {
    const errorExecutions = await this.getExecutionsByStatus(templateVersionId, 'error', 1000);
    
    const errorCounts: Record<string, { count: number; lastOccurrence: string }> = {};
    
    errorExecutions.forEach(exec => {
      if (exec.error) {
        const code = exec.error.code;
        if (!errorCounts[code]) {
          errorCounts[code] = { count: 0, lastOccurrence: exec.timestamp };
        }
        errorCounts[code].count++;
        if (exec.timestamp > errorCounts[code].lastOccurrence) {
          errorCounts[code].lastOccurrence = exec.timestamp;
        }
      }
    });

    const totalErrors = errorExecutions.length;
    
    return Object.entries(errorCounts)
      .map(([errorCode, data]) => ({
        errorCode,
        count: data.count,
        percentage: (data.count / totalErrors) * 100,
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async updatePerformanceMetrics(templateVersionId: string, execution: TemplateExecution): Promise<void> {
    const currentMetrics = await this.getPerformanceMetrics(templateVersionId);
    
    if (!currentMetrics) {
      console.error(`No performance metrics found for version ${templateVersionId}`);
      return;
    }

    const isSuccess = execution.status === 'success';
    const newTotalExecutions = currentMetrics.totalExecutions + 1;
    
    // Update basic metrics
    const updatedMetrics: PerformanceMetrics = {
      ...currentMetrics,
      totalExecutions: newTotalExecutions,
      successRate: this.calculateRunningAverage(
        currentMetrics.successRate,
        currentMetrics.totalExecutions,
        isSuccess ? 100 : 0
      ),
      averageResponseTime: this.calculateRunningAverage(
        currentMetrics.averageResponseTime,
        currentMetrics.totalExecutions,
        execution.responseTime
      ),
      averageTokenUsage: this.calculateRunningAverage(
        currentMetrics.averageTokenUsage,
        currentMetrics.totalExecutions,
        execution.tokenUsage.totalTokens
      ),
      errorRate: this.calculateRunningAverage(
        currentMetrics.errorRate,
        currentMetrics.totalExecutions,
        isSuccess ? 0 : 100
      ),
      costPerExecution: this.calculateRunningAverage(
        currentMetrics.costPerExecution,
        currentMetrics.totalExecutions,
        execution.tokenUsage.cost
      ),
      lastUpdated: new Date().toISOString()
    };

    // Update detailed metrics
    const today = execution.timestamp.split('T')[0];
    updatedMetrics.detailedMetrics.executionsByDay[today] = 
      (updatedMetrics.detailedMetrics.executionsByDay[today] || 0) + 1;

    if (execution.error) {
      updatedMetrics.detailedMetrics.errorsByType[execution.error.code] = 
        (updatedMetrics.detailedMetrics.errorsByType[execution.error.code] || 0) + 1;
    }

    if (execution.metadata.region) {
      updatedMetrics.detailedMetrics.geographicDistribution[execution.metadata.region] = 
        (updatedMetrics.detailedMetrics.geographicDistribution[execution.metadata.region] || 0) + 1;
    }

    // Update token usage distribution
    const tokenUsage = execution.tokenUsage.totalTokens;
    const tokenDist = updatedMetrics.detailedMetrics.tokenUsageDistribution;
    tokenDist.min = Math.min(tokenDist.min || tokenUsage, tokenUsage);
    tokenDist.max = Math.max(tokenDist.max || tokenUsage, tokenUsage);
    tokenDist.avg = this.calculateRunningAverage(tokenDist.avg, currentMetrics.totalExecutions, tokenUsage);

    // Save updated metrics
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: templateVersionId },
      UpdateExpression: 'SET performanceMetrics = :metrics',
      ExpressionAttributeValues: {
        ':metrics': updatedMetrics
      }
    }));
  }

  private calculateRunningAverage(currentAvg: number, count: number, newValue: number): number {
    return ((currentAvg * count) + newValue) / (count + 1);
  }

  private async calculateAveragePerformance(versionIds: string[]): Promise<PerformanceMetrics> {
    const metricsPromises = versionIds.map(id => this.getPerformanceMetrics(id));
    const allMetrics = (await Promise.all(metricsPromises)).filter(m => m !== null) as PerformanceMetrics[];

    if (allMetrics.length === 0) {
      return {
        templateVersionId: '',
        totalExecutions: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageTokenUsage: 0,
        errorRate: 0,
        costPerExecution: 0,
        lastUpdated: new Date().toISOString(),
        detailedMetrics: {
          executionsByDay: {},
          responseTimePercentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
          errorsByType: {},
          tokenUsageDistribution: { min: 0, max: 0, avg: 0, median: 0 },
          geographicDistribution: {}
        }
      };
    }

    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    
    return {
      templateVersionId: '',
      totalExecutions,
      successRate: this.weightedAverage(allMetrics, 'successRate'),
      averageResponseTime: this.weightedAverage(allMetrics, 'averageResponseTime'),
      averageTokenUsage: this.weightedAverage(allMetrics, 'averageTokenUsage'),
      errorRate: this.weightedAverage(allMetrics, 'errorRate'),
      costPerExecution: this.weightedAverage(allMetrics, 'costPerExecution'),
      lastUpdated: new Date().toISOString(),
      detailedMetrics: this.aggregateDetailedMetrics(allMetrics)
    };
  }

  private weightedAverage(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    const totalWeight = metrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    if (totalWeight === 0) return 0;

    return metrics.reduce((sum, m) => {
      const value = m[field] as number;
      return sum + (value * m.totalExecutions);
    }, 0) / totalWeight;
  }

  private aggregateDetailedMetrics(metrics: PerformanceMetrics[]): DetailedMetrics {
    const aggregated: DetailedMetrics = {
      executionsByDay: {},
      responseTimePercentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
      errorsByType: {},
      tokenUsageDistribution: { min: 0, max: 0, avg: 0, median: 0 },
      geographicDistribution: {}
    };

    metrics.forEach(m => {
      // Aggregate executions by day
      Object.entries(m.detailedMetrics.executionsByDay).forEach(([date, count]) => {
        aggregated.executionsByDay[date] = (aggregated.executionsByDay[date] || 0) + count;
      });

      // Aggregate errors by type
      Object.entries(m.detailedMetrics.errorsByType).forEach(([type, count]) => {
        aggregated.errorsByType[type] = (aggregated.errorsByType[type] || 0) + count;
      });

      // Aggregate geographic distribution
      Object.entries(m.detailedMetrics.geographicDistribution).forEach(([region, count]) => {
        aggregated.geographicDistribution[region] = (aggregated.geographicDistribution[region] || 0) + count;
      });
    });

    return aggregated;
  }

  private generateRecommendations(metrics: PerformanceMetrics, totalExecutions: number): any[] {
    const recommendations = [];

    if (metrics.successRate < 95) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Low Success Rate Detected',
        description: `Success rate is ${metrics.successRate.toFixed(1)}%, below the recommended 95% threshold.`,
        actionItems: [
          'Review error patterns and common failure modes',
          'Improve input validation and error handling',
          'Consider template content optimization'
        ],
        estimatedImpact: 'Could improve success rate by 5-10%'
      });
    }

    if (metrics.averageResponseTime > 5000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'High Response Time',
        description: `Average response time is ${(metrics.averageResponseTime / 1000).toFixed(1)}s, which may impact user experience.`,
        actionItems: [
          'Optimize template content for shorter responses',
          'Consider using faster AI models for simple tasks',
          'Implement response caching where appropriate'
        ],
        estimatedImpact: 'Could reduce response time by 20-30%'
      });
    }

    if (metrics.costPerExecution > 0.10) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: 'High Cost Per Execution',
        description: `Cost per execution is $${metrics.costPerExecution.toFixed(3)}, which may be optimizable.`,
        actionItems: [
          'Review template complexity and token usage',
          'Consider using more cost-effective AI models',
          'Implement intelligent caching strategies'
        ],
        estimatedImpact: 'Could reduce costs by 15-25%'
      });
    }

    if (totalExecutions < 100) {
      recommendations.push({
        type: 'usage',
        priority: 'low',
        title: 'Low Usage Volume',
        description: 'Template has low usage volume, which may indicate adoption issues.',
        actionItems: [
          'Review template discoverability and documentation',
          'Gather user feedback on template utility',
          'Consider promoting template to relevant user groups'
        ],
        estimatedImpact: 'Could increase usage by 50-100%'
      });
    }

    return recommendations;
  }
}