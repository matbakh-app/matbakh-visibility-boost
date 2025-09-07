/**
 * Provider Health Monitor
 * Monitors provider health and manages automatic failover
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { BaseAIProvider } from './base-provider';
import { CircuitBreakerState, ProviderHealthCheck, FailoverEvent } from './types';

export class ProviderHealthMonitor {
  private dynamoClient: DynamoDBDocumentClient;
  private cloudWatch: CloudWatchClient;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private providers: Map<string, BaseAIProvider> = new Map();
  private failoverEvents: FailoverEvent[] = [];

  // Circuit breaker configuration
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  private readonly halfOpenMaxRequests = 3;

  constructor(region: string = 'eu-central-1') {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.cloudWatch = new CloudWatchClient({ region });
  }

  /**
   * Register provider for health monitoring
   */
  registerProvider(provider: BaseAIProvider): void {
    const providerId = provider.getProvider().id;
    this.providers.set(providerId, provider);
    
    // Initialize circuit breaker
    this.circuitBreakers.set(providerId, {
      providerId,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
    });

    console.log(`Registered provider for health monitoring: ${providerId}`);
  }

  /**
   * Unregister provider
   */
  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
    this.circuitBreakers.delete(providerId);
    console.log(`Unregistered provider from health monitoring: ${providerId}`);
  }

  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, intervalMs);

    console.log(`Started health monitoring with ${intervalMs}ms interval`);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('Stopped health monitoring');
  }

  /**
   * Perform health checks on all registered providers
   */
  async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.entries()).map(
      async ([providerId, provider]) => {
        try {
          const healthCheck = await provider.performHealthCheck();
          await this.updateProviderHealth(providerId, healthCheck);
          await this.updateCircuitBreaker(providerId, healthCheck.status === 'healthy');
        } catch (error) {
          console.error(`Health check failed for provider ${providerId}:`, error);
          await this.updateCircuitBreaker(providerId, false);
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Update provider health status
   */
  private async updateProviderHealth(providerId: string, healthCheck: ProviderHealthCheck): Promise<void> {
    try {
      // Store health check result in DynamoDB
      const command = new PutCommand({
        TableName: 'provider-health-checks',
        Item: {
          PK: `PROVIDER#${providerId}`,
          SK: healthCheck.lastCheck,
          providerId,
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          errorMessage: healthCheck.errorMessage,
          consecutiveFailures: healthCheck.consecutiveFailures,
          timestamp: healthCheck.lastCheck,
          TTL: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days retention
        },
      });

      await this.dynamoClient.send(command);

      // Send metrics to CloudWatch
      await this.sendHealthMetrics(providerId, healthCheck);

    } catch (error) {
      console.error(`Failed to update health status for provider ${providerId}:`, error);
    }
  }

  /**
   * Send health metrics to CloudWatch
   */
  private async sendHealthMetrics(providerId: string, healthCheck: ProviderHealthCheck): Promise<void> {
    try {
      const metricData = [
        {
          MetricName: 'ProviderHealth',
          Value: healthCheck.status === 'healthy' ? 1 : 0,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: providerId },
          ],
        },
        {
          MetricName: 'ProviderResponseTime',
          Value: healthCheck.responseTime,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'ProviderId', Value: providerId },
          ],
        },
        {
          MetricName: 'ConsecutiveFailures',
          Value: healthCheck.consecutiveFailures,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: providerId },
          ],
        },
      ];

      const command = new PutMetricDataCommand({
        Namespace: 'AIOrchestrator/ProviderHealth',
        MetricData: metricData,
      });

      await this.cloudWatch.send(command);

    } catch (error) {
      console.error(`Failed to send health metrics for provider ${providerId}:`, error);
    }
  }

  /**
   * Update circuit breaker state
   */
  private async updateCircuitBreaker(providerId: string, success: boolean): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) {
      return;
    }

    const now = new Date().toISOString();

    if (success) {
      circuitBreaker.successCount++;
      
      if (circuitBreaker.state === 'half_open') {
        if (circuitBreaker.successCount >= this.halfOpenMaxRequests) {
          // Transition to closed state
          circuitBreaker.state = 'closed';
          circuitBreaker.failureCount = 0;
          circuitBreaker.successCount = 0;
          console.log(`Circuit breaker closed for provider ${providerId}`);
        }
      } else if (circuitBreaker.state === 'open') {
        // Check if recovery timeout has passed
        const lastFailureTime = new Date(circuitBreaker.lastFailureTime || 0);
        const recoveryTime = new Date(lastFailureTime.getTime() + this.recoveryTimeout);
        
        if (new Date() >= recoveryTime) {
          circuitBreaker.state = 'half_open';
          circuitBreaker.successCount = 1;
          console.log(`Circuit breaker half-open for provider ${providerId}`);
        }
      }
    } else {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = now;
      circuitBreaker.successCount = 0;

      if (circuitBreaker.state === 'closed' && circuitBreaker.failureCount >= this.failureThreshold) {
        // Transition to open state
        circuitBreaker.state = 'open';
        circuitBreaker.nextRetryTime = new Date(Date.now() + this.recoveryTimeout).toISOString();
        console.log(`Circuit breaker opened for provider ${providerId}`);
        
        // Record failover event
        await this.recordFailoverEvent(providerId, 'circuit_breaker_opened');
      } else if (circuitBreaker.state === 'half_open') {
        // Transition back to open state
        circuitBreaker.state = 'open';
        circuitBreaker.nextRetryTime = new Date(Date.now() + this.recoveryTimeout).toISOString();
        console.log(`Circuit breaker re-opened for provider ${providerId}`);
      }
    }

    // Update circuit breaker state in storage
    await this.storeCircuitBreakerState(circuitBreaker);
  }

  /**
   * Store circuit breaker state
   */
  private async storeCircuitBreakerState(circuitBreaker: CircuitBreakerState): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: 'circuit-breaker-states',
        Item: {
          PK: `CIRCUIT_BREAKER#${circuitBreaker.providerId}`,
          SK: 'CURRENT',
          ...circuitBreaker,
          updatedAt: new Date().toISOString(),
        },
      });

      await this.dynamoClient.send(command);

    } catch (error) {
      console.error(`Failed to store circuit breaker state for ${circuitBreaker.providerId}:`, error);
    }
  }

  /**
   * Check if provider is available (circuit breaker check)
   */
  isProviderAvailable(providerId: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) {
      return true; // Default to available if no circuit breaker
    }

    switch (circuitBreaker.state) {
      case 'closed':
        return true;
      
      case 'open':
        // Check if recovery timeout has passed
        if (circuitBreaker.nextRetryTime) {
          const nextRetryTime = new Date(circuitBreaker.nextRetryTime);
          if (new Date() >= nextRetryTime) {
            // Transition to half-open
            circuitBreaker.state = 'half_open';
            circuitBreaker.successCount = 0;
            return true;
          }
        }
        return false;
      
      case 'half_open':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(providerId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(providerId);
  }

  /**
   * Record failover event
   */
  private async recordFailoverEvent(
    originalProvider: string,
    reason: string,
    fallbackProvider?: string,
    requestId?: string
  ): Promise<void> {
    const failoverEvent: FailoverEvent = {
      id: `failover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalProvider,
      fallbackProvider: fallbackProvider || 'none',
      reason,
      requestId: requestId || 'health_check',
      timestamp: new Date().toISOString(),
      success: !!fallbackProvider,
      latencyImpact: 0, // Would be calculated in actual failover
    };

    this.failoverEvents.push(failoverEvent);

    // Keep only recent events (last 100)
    if (this.failoverEvents.length > 100) {
      this.failoverEvents = this.failoverEvents.slice(-100);
    }

    try {
      // Store failover event
      const command = new PutCommand({
        TableName: 'failover-events',
        Item: {
          PK: `FAILOVER#${failoverEvent.originalProvider}`,
          SK: failoverEvent.timestamp,
          ...failoverEvent,
          TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days retention
        },
      });

      await this.dynamoClient.send(command);

    } catch (error) {
      console.error('Failed to store failover event:', error);
    }
  }

  /**
   * Get recent failover events
   */
  getRecentFailoverEvents(providerId?: string, limit: number = 10): FailoverEvent[] {
    let events = this.failoverEvents;
    
    if (providerId) {
      events = events.filter(event => event.originalProvider === providerId);
    }
    
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get provider health summary
   */
  async getProviderHealthSummary(): Promise<Record<string, {
    status: string;
    circuitBreakerState: string;
    consecutiveFailures: number;
    lastCheck: string;
    responseTime: number;
  }>> {
    const summary: Record<string, any> = {};

    for (const [providerId, provider] of this.providers.entries()) {
      const providerInfo = provider.getProvider();
      const circuitBreaker = this.circuitBreakers.get(providerId);

      summary[providerId] = {
        status: providerInfo.healthCheck.status,
        circuitBreakerState: circuitBreaker?.state || 'unknown',
        consecutiveFailures: providerInfo.healthCheck.consecutiveFailures,
        lastCheck: providerInfo.healthCheck.lastCheck,
        responseTime: providerInfo.healthCheck.responseTime,
      };
    }

    return summary;
  }

  /**
   * Force circuit breaker state (for testing/admin purposes)
   */
  async forceCircuitBreakerState(providerId: string, state: 'closed' | 'open' | 'half_open'): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker found for provider ${providerId}`);
    }

    circuitBreaker.state = state;
    circuitBreaker.failureCount = state === 'open' ? this.failureThreshold : 0;
    circuitBreaker.successCount = 0;

    if (state === 'open') {
      circuitBreaker.nextRetryTime = new Date(Date.now() + this.recoveryTimeout).toISOString();
    }

    await this.storeCircuitBreakerState(circuitBreaker);
    console.log(`Forced circuit breaker state to ${state} for provider ${providerId}`);
  }

  /**
   * Reset circuit breaker (for admin purposes)
   */
  async resetCircuitBreaker(providerId: string): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker found for provider ${providerId}`);
    }

    circuitBreaker.state = 'closed';
    circuitBreaker.failureCount = 0;
    circuitBreaker.successCount = 0;
    circuitBreaker.lastFailureTime = undefined;
    circuitBreaker.nextRetryTime = undefined;

    await this.storeCircuitBreakerState(circuitBreaker);
    console.log(`Reset circuit breaker for provider ${providerId}`);
  }
}