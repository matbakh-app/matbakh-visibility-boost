/**
 * Performance Monitoring System
 * 
 * Implements response time monitoring and alerting with 30-second target
 * Tracks performance metrics and sends alerts when thresholds are exceeded
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export interface PerformanceMetrics {
  requestId: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorType?: string;
  tokenCount?: number;
  cacheHit?: boolean;
}

export interface AlertThresholds {
  responseTimeWarning: number; // 25 seconds
  responseTimeCritical: number; // 30 seconds
  errorRateWarning: number; // 5%
  errorRateCritical: number; // 10%
  queueDepthWarning: number; // 50 requests
  queueDepthCritical: number; // 100 requests
}

export class PerformanceMonitor {
  private cloudWatch: CloudWatchClient;
  private sns: SNSClient;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private alertThresholds: AlertThresholds;
  private alertTopic: string;

  constructor() {
    this.cloudWatch = new CloudWatchClient({ 
      region: process.env.AWS_REGION || 'eu-central-1' 
    });
    this.sns = new SNSClient({ 
      region: process.env.AWS_REGION || 'eu-central-1' 
    });
    
    this.alertThresholds = {
      responseTimeWarning: 25000, // 25 seconds
      responseTimeCritical: 30000, // 30 seconds
      errorRateWarning: 0.05, // 5%
      errorRateCritical: 0.10, // 10%
      queueDepthWarning: 50,
      queueDepthCritical: 100
    };

    this.alertTopic = process.env.BEDROCK_ALERT_TOPIC_ARN || '';
  }

  /**
   * Start tracking a request
   */
  startRequest(requestId: string, operation: string): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      requestId,
      operation,
      startTime: Date.now(),
      success: false
    };

    this.metrics.set(requestId, metrics);
    return metrics;
  }

  /**
   * Complete tracking a request
   */
  async completeRequest(
    requestId: string, 
    success: boolean, 
    errorType?: string,
    tokenCount?: number,
    cacheHit?: boolean
  ): Promise<void> {
    const metrics = this.metrics.get(requestId);
    if (!metrics) {
      console.warn(`No metrics found for request ${requestId}`);
      return;
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = success;
    metrics.errorType = errorType;
    metrics.tokenCount = tokenCount;
    metrics.cacheHit = cacheHit;

    // Send metrics to CloudWatch
    await this.sendMetrics(metrics);

    // Check for alerts
    await this.checkAlerts(metrics);

    // Clean up
    this.metrics.delete(requestId);
  }

  /**
   * Send metrics to CloudWatch
   */
  private async sendMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const metricData = [
        {
          MetricName: 'ResponseTime',
          Value: metrics.duration || 0,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Operation', Value: metrics.operation },
            { Name: 'Success', Value: metrics.success.toString() }
          ]
        },
        {
          MetricName: 'RequestCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Operation', Value: metrics.operation },
            { Name: 'Success', Value: metrics.success.toString() }
          ]
        }
      ];

      // Add token count if available
      if (metrics.tokenCount) {
        metricData.push({
          MetricName: 'TokenUsage',
          Value: metrics.tokenCount,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Operation', Value: metrics.operation }
          ]
        });
      }

      // Add cache hit metric
      if (metrics.cacheHit !== undefined) {
        metricData.push({
          MetricName: 'CacheHitRate',
          Value: metrics.cacheHit ? 1 : 0,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Operation', Value: metrics.operation }
          ]
        });
      }

      // Add error type if failed
      if (!metrics.success && metrics.errorType) {
        metricData.push({
          MetricName: 'ErrorCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Operation', Value: metrics.operation },
            { Name: 'ErrorType', Value: metrics.errorType }
          ]
        });
      }

      await this.cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'Bedrock/AI/Performance',
        MetricData: metricData
      }));

    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(metrics: PerformanceMetrics): Promise<void> {
    const alerts: string[] = [];

    // Response time alerts
    if (metrics.duration) {
      if (metrics.duration >= this.alertThresholds.responseTimeCritical) {
        alerts.push(`CRITICAL: Response time ${metrics.duration}ms exceeds 30s threshold for ${metrics.operation}`);
      } else if (metrics.duration >= this.alertThresholds.responseTimeWarning) {
        alerts.push(`WARNING: Response time ${metrics.duration}ms exceeds 25s threshold for ${metrics.operation}`);
      }
    }

    // Error alerts
    if (!metrics.success) {
      alerts.push(`ERROR: Request failed for ${metrics.operation}: ${metrics.errorType || 'Unknown error'}`);
    }

    // Send alerts if any
    for (const alert of alerts) {
      await this.sendAlert(alert, metrics);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlert(message: string, metrics: PerformanceMetrics): Promise<void> {
    if (!this.alertTopic) {
      console.warn('No alert topic configured, logging alert:', message);
      return;
    }

    try {
      const alertData = {
        timestamp: new Date().toISOString(),
        message,
        requestId: metrics.requestId,
        operation: metrics.operation,
        duration: metrics.duration,
        success: metrics.success,
        errorType: metrics.errorType
      };

      await this.sns.send(new PublishCommand({
        TopicArn: this.alertTopic,
        Message: JSON.stringify(alertData, null, 2),
        Subject: `Bedrock AI Performance Alert: ${metrics.operation}`
      }));

    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Get current queue depth
   */
  getQueueDepth(): number {
    return this.metrics.size;
  }

  /**
   * Check if system is under high load
   */
  isHighLoad(): boolean {
    return this.getQueueDepth() >= this.alertThresholds.queueDepthWarning;
  }

  /**
   * Check if system is at critical load
   */
  isCriticalLoad(): boolean {
    return this.getQueueDepth() >= this.alertThresholds.queueDepthCritical;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    activeRequests: number;
    averageResponseTime: number;
    successRate: number;
    cacheHitRate: number;
  } {
    const activeRequests = this.metrics.size;
    
    // These would typically come from CloudWatch metrics
    // For now, return basic info
    return {
      activeRequests,
      averageResponseTime: 0, // Would be calculated from recent metrics
      successRate: 0, // Would be calculated from recent metrics
      cacheHitRate: 0 // Would be calculated from recent metrics
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();