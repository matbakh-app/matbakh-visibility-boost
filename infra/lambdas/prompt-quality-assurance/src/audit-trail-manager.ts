import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { v4 as uuidv4 } from 'uuid';
import {
  PromptExecution,
  PromptAuditRecord,
  QualityMetrics,
  UserFeedback,
  CreateAuditRecordRequest,
  GetAuditTrailRequest,
  QualityAssuranceError
} from './types';

export class AuditTrailManager {
  private dynamoClient: DynamoDBDocumentClient;
  private cloudWatchClient: CloudWatchClient;
  private tableName: string;

  constructor(
    tableName: string,
    region: string = 'eu-central-1'
  ) {
    const dynamoDBClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);
    this.cloudWatchClient = new CloudWatchClient({ region });
    this.tableName = tableName;
  }

  /**
   * Create comprehensive audit record for prompt execution
   */
  async createAuditRecord(request: CreateAuditRecordRequest): Promise<PromptAuditRecord> {
    try {
      const auditRecord: PromptAuditRecord = {
        id: uuidv4(),
        executionId: request.execution.id,
        templateId: request.execution.templateId,
        templateVersion: request.execution.templateVersion,
        prompt: request.execution.prompt,
        output: request.execution.output,
        qualityMetrics: request.qualityMetrics || await this.calculateDefaultQualityMetrics(request.execution),
        userFeedback: request.userFeedback,
        performanceMetrics: {
          responseTime: request.execution.executionTime,
          tokenEfficiency: this.calculateTokenEfficiency(request.execution),
          costPerToken: this.calculateCostPerToken(request.execution),
          successRate: 1.0 // Will be updated based on historical data
        },
        contextData: {
          persona: request.execution.metadata?.persona,
          useCase: request.execution.metadata?.useCase || 'unknown',
          businessContext: request.contextData || {}
        },
        timestamp: new Date().toISOString(),
        auditVersion: '1.0'
      };

      // Store in DynamoDB
      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: auditRecord
      }));

      // Send metrics to CloudWatch
      await this.sendAuditMetrics(auditRecord);

      return auditRecord;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to create audit record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUDIT_CREATION_ERROR'
      );
    }
  }

  /**
   * Retrieve audit trail with filtering and pagination
   */
  async getAuditTrail(request: GetAuditTrailRequest): Promise<PromptAuditRecord[]> {
    try {
      const queryParams: any = {
        TableName: this.tableName,
        Limit: request.limit || 50
      };

      if (request.templateId) {
        queryParams.IndexName = 'TemplateIdIndex';
        queryParams.KeyConditionExpression = 'templateId = :templateId';
        queryParams.ExpressionAttributeValues = {
          ':templateId': request.templateId
        };

        if (request.startDate || request.endDate) {
          queryParams.FilterExpression = this.buildDateFilter(request.startDate, request.endDate);
          queryParams.ExpressionAttributeValues = {
            ...queryParams.ExpressionAttributeValues,
            ...this.buildDateFilterValues(request.startDate, request.endDate)
          };
        }
      }

      if (request.offset) {
        // Note: DynamoDB doesn't support offset directly, this would need pagination tokens
        // For now, we'll implement a simple approach
      }

      const result = await this.dynamoClient.send(new QueryCommand(queryParams));
      return result.Items as PromptAuditRecord[];
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to retrieve audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUDIT_RETRIEVAL_ERROR'
      );
    }
  }

  /**
   * Get specific audit record by ID
   */
  async getAuditRecord(auditId: string): Promise<PromptAuditRecord | null> {
    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { id: auditId }
      }));

      return result.Item as PromptAuditRecord || null;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to get audit record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUDIT_GET_ERROR'
      );
    }
  }

  /**
   * Update audit record with user feedback
   */
  async addUserFeedback(auditId: string, feedback: UserFeedback): Promise<void> {
    try {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id: auditId },
        UpdateExpression: 'SET userFeedback = :feedback, updatedAt = :timestamp',
        ExpressionAttributeValues: {
          ':feedback': feedback,
          ':timestamp': new Date().toISOString()
        }
      }));

      // Update quality metrics based on feedback
      await this.updateQualityMetricsFromFeedback(auditId, feedback);
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to add user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FEEDBACK_UPDATE_ERROR'
      );
    }
  }

  /**
   * Get audit statistics for a template
   */
  async getTemplateAuditStats(templateId: string, timeRange?: string): Promise<any> {
    try {
      const auditRecords = await this.getAuditTrail({ 
        templateId, 
        startDate: timeRange ? this.getStartDateFromRange(timeRange) : undefined 
      });

      return {
        totalExecutions: auditRecords.length,
        averageQualityScore: this.calculateAverageQuality(auditRecords),
        averageResponseTime: this.calculateAverageResponseTime(auditRecords),
        userSatisfactionRate: this.calculateUserSatisfactionRate(auditRecords),
        tokenEfficiency: this.calculateAverageTokenEfficiency(auditRecords),
        costAnalysis: this.calculateCostAnalysis(auditRecords),
        qualityTrends: this.calculateQualityTrends(auditRecords),
        commonIssues: this.identifyCommonIssues(auditRecords)
      };
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to get template audit stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STATS_CALCULATION_ERROR'
      );
    }
  }

  // Private helper methods
  private async calculateDefaultQualityMetrics(execution: PromptExecution): Promise<QualityMetrics> {
    // Basic quality metrics calculation
    // In a real implementation, this would use ML models or more sophisticated analysis
    const outputLength = execution.output.length;
    const promptLength = execution.prompt.length;
    
    return {
      relevanceScore: Math.min(0.8 + (outputLength / promptLength) * 0.1, 1.0),
      coherenceScore: 0.85, // Would be calculated using NLP models
      completenessScore: Math.min(outputLength / 500, 1.0), // Assuming 500 chars is complete
      accuracyScore: 0.8, // Would require domain-specific validation
      overallScore: 0.82,
      confidence: 0.7
    };
  }

  private calculateTokenEfficiency(execution: PromptExecution): number {
    const { input, output } = execution.tokenUsage;
    return output / (input + output);
  }

  private calculateCostPerToken(execution: PromptExecution): number {
    // Approximate cost calculation (would be based on actual pricing)
    const inputCost = execution.tokenUsage.input * 0.00001;
    const outputCost = execution.tokenUsage.output * 0.00003;
    return (inputCost + outputCost) / execution.tokenUsage.total;
  }

  private async sendAuditMetrics(auditRecord: PromptAuditRecord): Promise<void> {
    const metrics = [
      {
        MetricName: 'PromptQualityScore',
        Value: auditRecord.qualityMetrics.overallScore,
        Unit: 'None',
        Dimensions: [
          { Name: 'TemplateId', Value: auditRecord.templateId },
          { Name: 'TemplateVersion', Value: auditRecord.templateVersion }
        ]
      },
      {
        MetricName: 'PromptResponseTime',
        Value: auditRecord.performanceMetrics.responseTime,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'TemplateId', Value: auditRecord.templateId }
        ]
      },
      {
        MetricName: 'TokenEfficiency',
        Value: auditRecord.performanceMetrics.tokenEfficiency,
        Unit: 'None',
        Dimensions: [
          { Name: 'TemplateId', Value: auditRecord.templateId }
        ]
      }
    ];

    await this.cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: 'PromptQualityAssurance',
      MetricData: metrics.map(metric => ({
        ...metric,
        Unit: metric.Unit as any,
        Timestamp: new Date()
      }))
    }));
  }

  private buildDateFilter(startDate?: string, endDate?: string): string {
    const filters = [];
    if (startDate) filters.push('#timestamp >= :startDate');
    if (endDate) filters.push('#timestamp <= :endDate');
    return filters.join(' AND ');
  }

  private buildDateFilterValues(startDate?: string, endDate?: string): Record<string, any> {
    const values: Record<string, any> = {};
    if (startDate) values[':startDate'] = startDate;
    if (endDate) values[':endDate'] = endDate;
    return values;
  }

  private async updateQualityMetricsFromFeedback(auditId: string, feedback: UserFeedback): Promise<void> {
    // Update quality metrics based on user feedback
    const userSatisfactionScore = feedback.rating / 5.0;
    
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { id: auditId },
      UpdateExpression: 'SET qualityMetrics.userSatisfactionScore = :score',
      ExpressionAttributeValues: {
        ':score': userSatisfactionScore
      }
    }));
  }

  private getStartDateFromRange(timeRange: string): string {
    const now = new Date();
    const days = timeRange.includes('day') ? parseInt(timeRange) : 
                 timeRange.includes('week') ? parseInt(timeRange) * 7 :
                 timeRange.includes('month') ? parseInt(timeRange) * 30 : 7;
    
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  }

  private calculateAverageQuality(records: PromptAuditRecord[]): number {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, record) => acc + record.qualityMetrics.overallScore, 0);
    return sum / records.length;
  }

  private calculateAverageResponseTime(records: PromptAuditRecord[]): number {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, record) => acc + record.performanceMetrics.responseTime, 0);
    return sum / records.length;
  }

  private calculateUserSatisfactionRate(records: PromptAuditRecord[]): number {
    const recordsWithFeedback = records.filter(r => r.userFeedback);
    if (recordsWithFeedback.length === 0) return 0;
    
    const satisfiedCount = recordsWithFeedback.filter(r => 
      r.userFeedback && r.userFeedback.rating >= 4
    ).length;
    
    return satisfiedCount / recordsWithFeedback.length;
  }

  private calculateAverageTokenEfficiency(records: PromptAuditRecord[]): number {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, record) => acc + record.performanceMetrics.tokenEfficiency, 0);
    return sum / records.length;
  }

  private calculateCostAnalysis(records: PromptAuditRecord[]): any {
    if (records.length === 0) return { totalCost: 0, averageCost: 0, costTrend: 'stable' };
    
    const totalCost = records.reduce((acc, record) => 
      acc + record.performanceMetrics.costPerToken, 0
    );
    
    return {
      totalCost,
      averageCost: totalCost / records.length,
      costTrend: 'stable' // Would calculate actual trend
    };
  }

  private calculateQualityTrends(records: PromptAuditRecord[]): any {
    // Calculate quality trends over time
    const sortedRecords = records.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return {
      trend: 'improving', // Would calculate actual trend
      dataPoints: sortedRecords.map(r => ({
        timestamp: r.timestamp,
        qualityScore: r.qualityMetrics.overallScore
      }))
    };
  }

  private identifyCommonIssues(records: PromptAuditRecord[]): string[] {
    // Identify common issues from feedback and quality metrics
    const issues: string[] = [];
    
    const lowQualityRecords = records.filter(r => r.qualityMetrics.overallScore < 0.6);
    if (lowQualityRecords.length > records.length * 0.2) {
      issues.push('High rate of low-quality outputs');
    }
    
    const slowRecords = records.filter(r => r.performanceMetrics.responseTime > 5000);
    if (slowRecords.length > records.length * 0.1) {
      issues.push('Performance issues with response time');
    }
    
    return issues;
  }
}