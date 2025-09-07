/**
 * Request Queue System
 * 
 * Implements request queuing for high-load scenarios with priority handling
 * Prevents system overload and ensures fair processing of AI requests
 */

import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { performanceMonitor } from './performance-monitoring';

export interface QueuedRequest {
  requestId: string;
  operation: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: any;
  userId?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'timeout';
}

export interface QueueConfig {
  maxQueueSize: number;
  maxConcurrentRequests: number;
  defaultTimeoutMs: number;
  maxRetries: number;
  priorityWeights: Record<string, number>;
}

export class RequestQueueSystem {
  private dynamodb: DynamoDBClient;
  private queueTableName: string;
  private processingRequests: Map<string, QueuedRequest> = new Map();
  private config: QueueConfig;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.dynamodb = new DynamoDBClient({ 
      region: process.env.AWS_REGION || 'eu-central-1' 
    });
    
    this.queueTableName = process.env.BEDROCK_QUEUE_TABLE || 'bedrock-request-queue';
    
    this.config = {
      maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '500'),
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
      defaultTimeoutMs: parseInt(process.env.DEFAULT_TIMEOUT_MS || '45000'), // 45 seconds
      maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
      priorityWeights: {
        'critical': 1000,
        'high': 100,
        'normal': 10,
        'low': 1
      }
    };
  }

  /**
   * Add request to queue
   */
  async enqueueRequest(
    requestId: string,
    operation: string,
    payload: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    userId?: string,
    timeoutMs?: number
  ): Promise<boolean> {
    try {
      // Check queue size
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.config.maxQueueSize) {
        console.warn(`Queue full (${queueSize}/${this.config.maxQueueSize}), rejecting request ${requestId}`);
        return false;
      }

      const queuedRequest: QueuedRequest = {
        requestId,
        operation,
        priority,
        payload,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        timeoutMs: timeoutMs || this.config.defaultTimeoutMs,
        status: 'queued'
      };

      // Calculate priority score for sorting
      const priorityScore = this.config.priorityWeights[priority] + (Date.now() - queuedRequest.timestamp);

      await this.dynamodb.send(new PutItemCommand({
        TableName: this.queueTableName,
        Item: marshall({
          ...queuedRequest,
          priorityScore,
          ttl: Math.floor((Date.now() + queuedRequest.timeoutMs) / 1000) // DynamoDB TTL
        })
      }));

      console.log(`Request ${requestId} queued with priority ${priority}`);
      return true;

    } catch (error) {
      console.error(`Failed to enqueue request ${requestId}:`, error);
      return false;
    }
  }

  /**
   * Get next request from queue
   */
  async dequeueRequest(): Promise<QueuedRequest | null> {
    try {
      // Check if we're at max concurrent requests
      if (this.processingRequests.size >= this.config.maxConcurrentRequests) {
        return null;
      }

      // Query for highest priority queued request
      const result = await this.dynamodb.send(new QueryCommand({
        TableName: this.queueTableName,
        IndexName: 'status-priorityScore-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':status': 'queued'
        }),
        ScanIndexForward: false, // Descending order (highest priority first)
        Limit: 1
      }));

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const queuedRequest = unmarshall(result.Items[0]) as QueuedRequest;

      // Mark as processing
      await this.updateRequestStatus(queuedRequest.requestId, 'processing');
      this.processingRequests.set(queuedRequest.requestId, queuedRequest);

      console.log(`Dequeued request ${queuedRequest.requestId} for processing`);
      return queuedRequest;

    } catch (error) {
      console.error('Failed to dequeue request:', error);
      return null;
    }
  }

  /**
   * Complete request processing
   */
  async completeRequest(requestId: string, success: boolean, result?: any): Promise<void> {
    try {
      const status = success ? 'completed' : 'failed';
      await this.updateRequestStatus(requestId, status, result);
      
      // Remove from processing map
      this.processingRequests.delete(requestId);

      // If failed and retries available, requeue
      const request = this.processingRequests.get(requestId);
      if (!success && request && request.retryCount < request.maxRetries) {
        await this.retryRequest(requestId);
      }

      console.log(`Request ${requestId} completed with status: ${status}`);

    } catch (error) {
      console.error(`Failed to complete request ${requestId}:`, error);
    }
  }

  /**
   * Retry failed request
   */
  private async retryRequest(requestId: string): Promise<void> {
    try {
      await this.dynamodb.send(new UpdateItemCommand({
        TableName: this.queueTableName,
        Key: marshall({ requestId }),
        UpdateExpression: 'SET #status = :status, retryCount = retryCount + :inc, priorityScore = :newPriority',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':status': 'queued',
          ':inc': 1,
          ':newPriority': this.config.priorityWeights['high'] + Date.now() // Higher priority for retries
        })
      }));

      console.log(`Request ${requestId} requeued for retry`);

    } catch (error) {
      console.error(`Failed to retry request ${requestId}:`, error);
    }
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(
    requestId: string, 
    status: QueuedRequest['status'], 
    result?: any
  ): Promise<void> {
    const updateExpression = 'SET #status = :status';
    const expressionAttributeNames: Record<string, string> = { '#status': 'status' };
    const expressionAttributeValues: Record<string, any> = { ':status': status };

    if (result) {
      updateExpression.concat(', result = :result');
      expressionAttributeValues[':result'] = result;
    }

    await this.dynamodb.send(new UpdateItemCommand({
      TableName: this.queueTableName,
      Key: marshall({ requestId }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues)
    }));
  }

  /**
   * Get current queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      const result = await this.dynamodb.send(new QueryCommand({
        TableName: this.queueTableName,
        IndexName: 'status-priorityScore-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':status': 'queued'
        }),
        Select: 'COUNT'
      }));

      return result.Count || 0;

    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    avgWaitTime: number;
  }> {
    try {
      const stats = {
        queued: 0,
        processing: this.processingRequests.size,
        completed: 0,
        failed: 0,
        avgWaitTime: 0
      };

      // Get counts by status
      for (const status of ['queued', 'completed', 'failed']) {
        const result = await this.dynamodb.send(new QueryCommand({
          TableName: this.queueTableName,
          IndexName: 'status-priorityScore-index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: marshall({
            ':status': status
          }),
          Select: 'COUNT'
        }));

        (stats as any)[status] = result.Count || 0;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        avgWaitTime: 0
      };
    }
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<void> {
    try {
      const now = Date.now();
      
      // Check processing requests for timeouts
      for (const [requestId, request] of this.processingRequests.entries()) {
        if (now - request.timestamp > request.timeoutMs) {
          console.warn(`Request ${requestId} timed out after ${request.timeoutMs}ms`);
          await this.updateRequestStatus(requestId, 'timeout');
          this.processingRequests.delete(requestId);
        }
      }

    } catch (error) {
      console.error('Failed to cleanup expired requests:', error);
    }
  }

  /**
   * Start queue processing
   */
  startProcessing(processingFunction: (request: QueuedRequest) => Promise<any>): void {
    if (this.processingInterval) {
      return; // Already started
    }

    this.processingInterval = setInterval(async () => {
      try {
        // Clean up expired requests
        await this.cleanupExpiredRequests();

        // Process queued requests
        while (this.processingRequests.size < this.config.maxConcurrentRequests) {
          const request = await this.dequeueRequest();
          if (!request) {
            break; // No more requests
          }

          // Process request asynchronously
          processingFunction(request)
            .then(result => this.completeRequest(request.requestId, true, result))
            .catch(error => {
              console.error(`Request ${request.requestId} failed:`, error);
              this.completeRequest(request.requestId, false, error.message);
            });
        }

      } catch (error) {
        console.error('Queue processing error:', error);
      }
    }, 1000); // Check every second

    console.log('Request queue processing started');
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      console.log('Request queue processing stopped');
    }
  }

  /**
   * Check if system should queue requests
   */
  shouldQueueRequest(): boolean {
    return performanceMonitor.isHighLoad() || this.processingRequests.size >= this.config.maxConcurrentRequests;
  }
}

// Singleton instance
export const requestQueue = new RequestQueueSystem();