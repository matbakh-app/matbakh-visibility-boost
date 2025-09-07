/**
 * Base AI Provider Abstract Class
 * Provides common functionality for all AI providers
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { 
  AIRequest, 
  AIResponse, 
  AIProvider, 
  ProviderHealthCheck, 
  ProviderMetrics,
  AIConstraints 
} from './types';

export abstract class BaseAIProvider {
  protected cloudWatch: CloudWatchClient;
  protected provider: AIProvider;
  protected requestCount: number = 0;
  protected lastHealthCheck?: ProviderHealthCheck;

  constructor(provider: AIProvider, region: string = 'eu-central-1') {
    this.provider = provider;
    this.cloudWatch = new CloudWatchClient({ region });
  }

  /**
   * Abstract method to be implemented by concrete providers
   */
  abstract processRequest(request: AIRequest): Promise<AIResponse>;

  /**
   * Abstract method for provider-specific health check
   */
  abstract performHealthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Get provider information
   */
  getProvider(): AIProvider {
    return { ...this.provider };
  }

  /**
   * Update provider status
   */
  updateStatus(status: AIProvider['status'], reason?: string): void {
    this.provider.status = status;
    this.provider.healthCheck.lastCheck = new Date().toISOString();
    
    if (reason && status === 'error') {
      this.provider.healthCheck.errorMessage = reason;
      this.provider.healthCheck.consecutiveFailures++;
    } else if (status === 'active') {
      this.provider.healthCheck.consecutiveFailures = 0;
      this.provider.healthCheck.errorMessage = undefined;
    }
  }

  /**
   * Check if provider supports the request type
   */
  supportsRequest(request: AIRequest): boolean {
    const capability = this.provider.capabilities.find(cap => cap.type === request.type);
    return capability?.supported || false;
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(request: AIRequest, estimatedOutputTokens: number = 1000): number {
    const inputTokens = this.estimateTokens(request.prompt);
    const outputTokens = Math.min(
      estimatedOutputTokens,
      request.constraints?.maxTokens || 4000
    );

    const inputCost = (inputTokens / 1000) * this.provider.pricing.inputTokenCost;
    const outputCost = (outputTokens / 1000) * this.provider.pricing.outputTokenCost;
    
    return Math.max(inputCost + outputCost, this.provider.pricing.minimumCost);
  }

  /**
   * Estimate token count (simplified)
   */
  protected estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate request constraints
   */
  protected validateConstraints(request: AIRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const capability = this.provider.capabilities.find(cap => cap.type === request.type);

    if (!capability) {
      errors.push(`Request type ${request.type} not supported by provider ${this.provider.id}`);
      return { valid: false, errors };
    }

    if (request.constraints?.maxTokens && request.constraints.maxTokens > capability.maxTokens) {
      errors.push(`Max tokens ${request.constraints.maxTokens} exceeds provider limit ${capability.maxTokens}`);
    }

    if (request.constraints?.temperature && (request.constraints.temperature < 0 || request.constraints.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (request.constraints?.topP && (request.constraints.topP < 0 || request.constraints.topP > 1)) {
      errors.push('TopP must be between 0 and 1');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Apply default constraints
   */
  protected applyDefaultConstraints(request: AIRequest): AIConstraints {
    const defaults = this.provider.configuration.defaultConstraints;
    return {
      maxTokens: request.constraints?.maxTokens || defaults.maxTokens || 4000,
      temperature: request.constraints?.temperature ?? defaults.temperature ?? 0.7,
      topP: request.constraints?.topP ?? defaults.topP ?? 0.9,
      stopSequences: request.constraints?.stopSequences || defaults.stopSequences || [],
      responseFormat: request.constraints?.responseFormat || defaults.responseFormat || 'text',
      safetyLevel: request.constraints?.safetyLevel || defaults.safetyLevel || 'moderate',
    };
  }

  /**
   * Record metrics for the request
   */
  protected async recordMetrics(
    request: AIRequest,
    response: AIResponse,
    startTime: number
  ): Promise<void> {
    const endTime = Date.now();
    const latency = endTime - startTime;

    try {
      // Update provider performance metrics
      this.provider.performance.lastUpdated = new Date().toISOString();
      
      // Send metrics to CloudWatch
      const metricData = [
        {
          MetricName: 'RequestLatency',
          Value: latency,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'ProviderId', Value: this.provider.id },
            { Name: 'RequestType', Value: request.type },
          ],
        },
        {
          MetricName: 'TokensUsed',
          Value: response.metadata.tokensUsed,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: this.provider.id },
            { Name: 'RequestType', Value: request.type },
          ],
        },
        {
          MetricName: 'RequestCost',
          Value: response.metadata.cost,
          Unit: 'None',
          Dimensions: [
            { Name: 'ProviderId', Value: this.provider.id },
            { Name: 'RequestType', Value: request.type },
          ],
        },
        {
          MetricName: 'RequestSuccess',
          Value: response.success ? 1 : 0,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ProviderId', Value: this.provider.id },
            { Name: 'RequestType', Value: request.type },
          ],
        },
      ];

      const command = new PutMetricDataCommand({
        Namespace: 'AIOrchestrator',
        MetricData: metricData,
      });

      await this.cloudWatch.send(command);

    } catch (error) {
      console.error('Failed to record metrics:', error);
      // Don't throw - metrics recording shouldn't fail the request
    }
  }

  /**
   * Handle provider errors and update health status
   */
  protected handleError(error: Error, request: AIRequest): AIResponse {
    console.error(`Provider ${this.provider.id} error:`, error);

    // Update provider health
    this.provider.healthCheck.consecutiveFailures++;
    this.provider.healthCheck.lastCheck = new Date().toISOString();
    this.provider.healthCheck.errorMessage = error.message;

    // Determine if provider should be marked as degraded or error
    if (this.provider.healthCheck.consecutiveFailures >= 3) {
      this.provider.status = 'error';
    } else if (this.provider.healthCheck.consecutiveFailures >= 2) {
      this.provider.status = 'degraded';
    }

    return {
      id: `error-${Date.now()}`,
      requestId: request.id,
      providerId: this.provider.id,
      content: '',
      metadata: {
        tokensUsed: 0,
        cost: 0,
        latency: 0,
        model: this.provider.configuration.model,
        finishReason: 'error',
      },
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
    };
  }

  /**
   * Check rate limits
   */
  protected checkRateLimit(): { allowed: boolean; reason?: string } {
    const limits = this.provider.configuration.rateLimits;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Simple rate limiting check (in production, use Redis or DynamoDB)
    if (this.requestCount >= limits.requestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.requestCount}/${limits.requestsPerMinute} requests per minute`,
      };
    }

    return { allowed: true };
  }

  /**
   * Increment request counter
   */
  protected incrementRequestCount(): void {
    this.requestCount++;
    
    // Reset counter every minute (simplified)
    setTimeout(() => {
      this.requestCount = Math.max(0, this.requestCount - 1);
    }, 60000);
  }

  /**
   * Get provider score for selection algorithm
   */
  getProviderScore(request: AIRequest): number {
    let score = 100; // Base score

    // Penalize based on health status
    switch (this.provider.status) {
      case 'active':
        break; // No penalty
      case 'degraded':
        score -= 20;
        break;
      case 'error':
      case 'maintenance':
        return 0; // Don't use this provider
      case 'inactive':
        return 0;
    }

    // Factor in performance metrics
    const perf = this.provider.performance;
    
    // Latency penalty (prefer faster providers)
    if (perf.averageLatency > 5000) score -= 30;
    else if (perf.averageLatency > 2000) score -= 15;
    else if (perf.averageLatency < 1000) score += 10;

    // Success rate bonus/penalty
    if (perf.successRate > 0.99) score += 15;
    else if (perf.successRate > 0.95) score += 5;
    else if (perf.successRate < 0.90) score -= 25;
    else if (perf.successRate < 0.95) score -= 10;

    // Cost consideration (prefer cheaper providers, but not at expense of quality)
    const estimatedCost = this.estimateCost(request);
    if (estimatedCost < 0.01) score += 5;
    else if (estimatedCost > 0.10) score -= 10;

    // Capability match bonus
    const capability = this.provider.capabilities.find(cap => cap.type === request.type);
    if (capability?.specialFeatures.length) {
      score += capability.specialFeatures.length * 2;
    }

    // User preferences
    if (request.preferences?.preferredProviders?.includes(this.provider.id)) {
      score += 25;
    }
    if (request.preferences?.excludedProviders?.includes(this.provider.id)) {
      return 0;
    }

    return Math.max(0, score);
  }

  /**
   * Prepare request for provider-specific processing
   */
  protected prepareRequest(request: AIRequest): {
    processedRequest: AIRequest;
    constraints: AIConstraints;
  } {
    const constraints = this.applyDefaultConstraints(request);
    
    const processedRequest: AIRequest = {
      ...request,
      constraints,
    };

    return { processedRequest, constraints };
  }

  /**
   * Post-process response
   */
  protected postProcessResponse(response: AIResponse, request: AIRequest): AIResponse {
    // Add provider-specific metadata
    response.metadata = {
      ...response.metadata,
      providerId: this.provider.id,
      providerType: this.provider.type,
    };

    // Validate response content
    if (!response.content && response.success) {
      response.success = false;
      response.error = 'Empty response content';
    }

    return response;
  }
}