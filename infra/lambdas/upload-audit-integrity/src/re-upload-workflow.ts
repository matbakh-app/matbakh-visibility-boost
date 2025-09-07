/**
 * Re-upload Workflow Manager
 * Handles automatic re-upload workflows for corrupted or failed uploads
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ReUploadWorkflow, ReUploadReason } from './types';
import { AuditLogger } from './audit-logger';

export class ReUploadWorkflowManager {
  private dynamoClient: DynamoDBDocumentClient;
  private sqsClient: SQSClient;
  private auditLogger: AuditLogger;
  private workflowTableName: string;
  private reUploadQueueUrl: string;

  constructor(
    region: string = 'eu-central-1',
    workflowTableName: string = 'upload-reupload-workflows',
    reUploadQueueUrl: string = process.env.RE_UPLOAD_QUEUE_URL || ''
  ) {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.sqsClient = new SQSClient({ region });
    this.auditLogger = new AuditLogger(region);
    this.workflowTableName = workflowTableName;
    this.reUploadQueueUrl = reUploadQueueUrl;
  }

  /**
   * Trigger re-upload workflow for a failed or corrupted upload
   */
  async triggerReUpload(
    originalUploadId: string,
    reason: ReUploadReason,
    userId: string,
    filename: string,
    s3Bucket: string,
    s3Key: string,
    maxRetries: number = 3
  ): Promise<ReUploadWorkflow> {
    const newUploadId = `reupload-${originalUploadId}-${Date.now()}`;
    const triggeredAt = new Date().toISOString();

    const workflow: ReUploadWorkflow = {
      originalUploadId,
      newUploadId,
      reason,
      maxRetries,
      currentRetry: 1,
      triggeredAt,
    };

    try {
      // Store workflow in DynamoDB
      await this.storeWorkflow(workflow);

      // Log audit event
      await this.auditLogger.logAuditEvent(
        originalUploadId,
        userId,
        're_upload_triggered',
        filename,
        s3Bucket,
        s3Key,
        0, // File size unknown at this point
        'unknown',
        '',
        {
          metadata: {
            reason,
            newUploadId,
            maxRetries,
            triggeredAt,
          },
        }
      );

      // Send message to re-upload queue
      await this.sendReUploadMessage({
        originalUploadId,
        newUploadId,
        userId,
        filename,
        s3Bucket,
        s3Key,
        reason,
        currentRetry: 1,
        maxRetries,
      });

      console.log(`Re-upload workflow triggered for ${originalUploadId}: ${reason}`);
      return workflow;

    } catch (error) {
      console.error(`Failed to trigger re-upload workflow for ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Store workflow in DynamoDB
   */
  private async storeWorkflow(workflow: ReUploadWorkflow): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.workflowTableName,
        Item: {
          PK: `WORKFLOW#${workflow.originalUploadId}`,
          SK: workflow.triggeredAt,
          GSI1PK: `STATUS#${workflow.success ? 'completed' : 'pending'}`,
          GSI1SK: workflow.triggeredAt,
          ...workflow,
          TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days retention
        },
      });

      await this.dynamoClient.send(command);

    } catch (error) {
      console.error('Failed to store re-upload workflow:', error);
      throw error;
    }
  }

  /**
   * Send re-upload message to SQS queue
   */
  private async sendReUploadMessage(message: {
    originalUploadId: string;
    newUploadId: string;
    userId: string;
    filename: string;
    s3Bucket: string;
    s3Key: string;
    reason: ReUploadReason;
    currentRetry: number;
    maxRetries: number;
  }): Promise<void> {
    if (!this.reUploadQueueUrl) {
      console.warn('Re-upload queue URL not configured, skipping SQS message');
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.reUploadQueueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          uploadId: {
            DataType: 'String',
            StringValue: message.originalUploadId,
          },
          reason: {
            DataType: 'String',
            StringValue: message.reason,
          },
          retry: {
            DataType: 'Number',
            StringValue: message.currentRetry.toString(),
          },
        },
        DelaySeconds: this.calculateRetryDelay(message.currentRetry),
      });

      await this.sqsClient.send(command);
      console.log(`Re-upload message sent to queue for ${message.originalUploadId}`);

    } catch (error) {
      console.error('Failed to send re-upload message to SQS:', error);
      throw error;
    }
  }

  /**
   * Calculate retry delay based on exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 2^retry * 60 seconds, max 15 minutes (900 seconds)
    const delay = Math.min(Math.pow(2, retryCount) * 60, 900);
    return delay;
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(
    originalUploadId: string,
    triggeredAt: string,
    updates: {
      success?: boolean;
      completedAt?: string;
      errorMessage?: string;
      currentRetry?: number;
    }
  ): Promise<void> {
    try {
      const updateExpression = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      if (updates.success !== undefined) {
        updateExpression.push('#success = :success');
        expressionAttributeNames['#success'] = 'success';
        expressionAttributeValues[':success'] = updates.success;
      }

      if (updates.completedAt) {
        updateExpression.push('completedAt = :completedAt');
        expressionAttributeValues[':completedAt'] = updates.completedAt;
      }

      if (updates.errorMessage) {
        updateExpression.push('errorMessage = :errorMessage');
        expressionAttributeValues[':errorMessage'] = updates.errorMessage;
      }

      if (updates.currentRetry !== undefined) {
        updateExpression.push('currentRetry = :currentRetry');
        expressionAttributeValues[':currentRetry'] = updates.currentRetry;
      }

      if (updateExpression.length === 0) {
        return; // No updates to make
      }

      const command = new UpdateCommand({
        TableName: this.workflowTableName,
        Key: {
          PK: `WORKFLOW#${originalUploadId}`,
          SK: triggeredAt,
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 
          ? expressionAttributeNames 
          : undefined,
      });

      await this.dynamoClient.send(command);
      console.log(`Workflow status updated for ${originalUploadId}`);

    } catch (error) {
      console.error(`Failed to update workflow status for ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflow(originalUploadId: string, triggeredAt: string): Promise<ReUploadWorkflow | null> {
    try {
      const command = new GetCommand({
        TableName: this.workflowTableName,
        Key: {
          PK: `WORKFLOW#${originalUploadId}`,
          SK: triggeredAt,
        },
      });

      const response = await this.dynamoClient.send(command);
      return response.Item as ReUploadWorkflow || null;

    } catch (error) {
      console.error(`Failed to get workflow for ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Get all workflows for an upload
   */
  async getUploadWorkflows(originalUploadId: string): Promise<ReUploadWorkflow[]> {
    try {
      const command = new QueryCommand({
        TableName: this.workflowTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `WORKFLOW#${originalUploadId}`,
        },
        ScanIndexForward: false, // Most recent first
      });

      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as ReUploadWorkflow[];

    } catch (error) {
      console.error(`Failed to get workflows for upload ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Check if upload should be retried
   */
  shouldRetryUpload(workflow: ReUploadWorkflow): boolean {
    return workflow.currentRetry < workflow.maxRetries && !workflow.success;
  }

  /**
   * Increment retry count and trigger next attempt
   */
  async retryUpload(
    originalUploadId: string,
    triggeredAt: string,
    userId: string,
    filename: string,
    s3Bucket: string,
    s3Key: string,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const workflow = await this.getWorkflow(originalUploadId, triggeredAt);
      if (!workflow) {
        throw new Error(`Workflow not found for ${originalUploadId}`);
      }

      if (!this.shouldRetryUpload(workflow)) {
        console.log(`Max retries reached for ${originalUploadId}, not retrying`);
        await this.updateWorkflowStatus(originalUploadId, triggeredAt, {
          success: false,
          completedAt: new Date().toISOString(),
          errorMessage: errorMessage || 'Max retries exceeded',
        });
        return false;
      }

      const nextRetry = workflow.currentRetry + 1;
      const newUploadId = `reupload-${originalUploadId}-${Date.now()}-retry${nextRetry}`;

      // Update workflow
      await this.updateWorkflowStatus(originalUploadId, triggeredAt, {
        currentRetry: nextRetry,
        errorMessage,
      });

      // Send retry message
      await this.sendReUploadMessage({
        originalUploadId,
        newUploadId,
        userId,
        filename,
        s3Bucket,
        s3Key,
        reason: workflow.reason,
        currentRetry: nextRetry,
        maxRetries: workflow.maxRetries,
      });

      console.log(`Retry ${nextRetry}/${workflow.maxRetries} triggered for ${originalUploadId}`);
      return true;

    } catch (error) {
      console.error(`Failed to retry upload for ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Mark workflow as completed successfully
   */
  async completeWorkflow(
    originalUploadId: string,
    triggeredAt: string,
    newUploadId: string
  ): Promise<void> {
    try {
      await this.updateWorkflowStatus(originalUploadId, triggeredAt, {
        success: true,
        completedAt: new Date().toISOString(),
      });

      console.log(`Re-upload workflow completed successfully: ${originalUploadId} -> ${newUploadId}`);

    } catch (error) {
      console.error(`Failed to complete workflow for ${originalUploadId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStatistics(
    startDate: string,
    endDate: string
  ): Promise<{
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    pendingWorkflows: number;
    averageRetries: number;
    reasonBreakdown: Record<ReUploadReason, number>;
  }> {
    try {
      // This would require a more complex query in production
      // For now, return a basic structure
      return {
        totalWorkflows: 0,
        successfulWorkflows: 0,
        failedWorkflows: 0,
        pendingWorkflows: 0,
        averageRetries: 0,
        reasonBreakdown: {
          corruption_detected: 0,
          checksum_mismatch: 0,
          file_size_mismatch: 0,
          content_type_mismatch: 0,
          user_requested: 0,
          system_recovery: 0,
        },
      };

    } catch (error) {
      console.error('Failed to get workflow statistics:', error);
      throw error;
    }
  }
}