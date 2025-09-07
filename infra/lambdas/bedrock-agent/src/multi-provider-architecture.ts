/**
 * Multi-Provider Architecture
 * 
 * Unified interface for all AI providers with intelligent routing,
 * fallback mechanisms, and comparative analysis capabilities.
 */

import { AIProvider, AIRequest, AIResponse, AIContext, TokenUsage } from './ai-agent-orchestrator';

// Provider-specific interfaces
export interface ProviderConfig {
  id: string;
  apiKey?: string;
  endpoint?: string;
  region?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  averageCost: number;
  lastUsed: string;
  errorRate: number;
  availability: number; // 0-1
}

export interface ComparisonResult {
  requestId: string;
  providers: string[];
  responses: AIResponse[];
  winner?: string;
  metrics: {
    latency: Record<string, number>;
    cost: Record<string, number>;
    quality: Record<string, number>;
  };
  recommendation: string;
}

// Abstract base class for all AI providers
export abstract class BaseAIProvider {
  protected config: ProviderConfig;
  protected metrics: ProviderMetrics;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.metrics = {
      providerId: config.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      averageCost: 0,
      lastUsed: new Date().toISOString(),
      errorRate: 0,
      availability: 1.0
    };
  }

  abstract execute(request: AIRequest): Promise<AIResponse>;
  abstract healthCheck(): Promise<boolean>;
  abstract estimateCost(request: AIRequest): Promise<number>;

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  protected updateMetrics(success: boolean, latency: number, cost?: number): void {
    this.metrics.totalRequests++;
    this.metrics.lastUsed = new Date().toISOString();

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    this.metrics.availability = this.metrics.successfulRequests / this.metrics.totalRequests;

    // Update average latency (exponential moving average)
    const alpha = 0.1;
    this.metrics.averageLatency = alpha * latency + (1 - alpha) * this.metrics.averageLatency;

    if (cost !== undefined) {
      this.metrics.averageCost = alpha * cost + (1 - alpha) * this.metrics.averageCost;
    }
  }
}

// Claude provider implementation
export class ClaudeProvider extends BaseAIProvider {
  private bedrockClient: any; // Will be imported from bedrock-client

  constructor(config: ProviderConfig) {
    super(config);
    // Initialize Bedrock client
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Import bedrock client dynamically to avoid circular dependencies
      const { invokeBedrock } = await import('./bedrock-client');
      
      const bedrockRequest = this.convertToBedrockRequest(request);
      const bedrockResponse = await invokeBedrock(bedrockRequest);
      
      const latency = Date.now() - startTime;
      const cost = 'cost' in bedrockResponse ? bedrockResponse.cost : 0;
      
      this.updateMetrics(true, latency, cost);
      
      return this.convertFromBedrockResponse(bedrockResponse, request, latency);
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { healthCheck } = await import('./bedrock-client');
      const result = await healthCheck();
      return result.status === 'healthy';
    } catch {
      return false;
    }
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // Rough estimation based on input size
    const inputText = JSON.stringify(request.payload);
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    const estimatedOutputTokens = Math.min(estimatedInputTokens * 2, 4000);
    
    // Claude 3.5 Sonnet pricing: $3/1M input, $15/1M output
    const inputCost = (estimatedInputTokens / 1000000) * 3.0;
    const outputCost = (estimatedOutputTokens / 1000000) * 15.0;
    
    return inputCost + outputCost;
  }

  private convertToBedrockRequest(request: AIRequest): any {
    return {
      requestType: request.type,
      templateVariables: request.payload,
      userId: request.context.userId,
      sessionId: request.context.sessionId,
      useTemplate: true
    };
  }

  private convertFromBedrockResponse(bedrockResponse: any, request: AIRequest, latency: number): AIResponse {
    // Handle fallback response
    if ('fallbackReason' in bedrockResponse) {
      return {
        id: `${request.id}-claude-fallback`,
        requestId: request.id,
        providerId: this.config.id,
        content: bedrockResponse.content,
        metadata: {
          latency,
          timestamp: new Date().toISOString(),
          fallbackUsed: true,
          providerChain: [this.config.id, 'fallback']
        }
      };
    }

    return {
      id: `${request.id}-${bedrockResponse.requestId}`,
      requestId: request.id,
      providerId: this.config.id,
      content: bedrockResponse.content,
      metadata: {
        tokenUsage: bedrockResponse.tokenUsage,
        cost: bedrockResponse.cost,
        latency,
        timestamp: bedrockResponse.timestamp,
        providerChain: [this.config.id]
      }
    };
  }
}

// Gemini provider implementation (future)
export class GeminiProvider extends BaseAIProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    // TODO: Implement Gemini API integration
    throw new Error('Gemini provider not yet implemented');
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Implement Gemini health check
    return false;
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // TODO: Implement Gemini cost estimation
    return 0;
  }
}

// Google Workspace provider implementation (future)
export class GoogleWorkspaceProvider extends BaseAIProvider {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (request.type) {
        case 'calendar_integration':
          result = await this.handleCalendarRequest(request);
          break;
        case 'email_generation':
          result = await this.handleEmailRequest(request);
          break;
        default:
          throw new Error(`Unsupported request type for Google Workspace: ${request.type}`);
      }
      
      const latency = Date.now() - startTime;
      this.updateMetrics(true, latency);
      
      return {
        id: `${request.id}-gws`,
        requestId: request.id,
        providerId: this.config.id,
        content: result,
        metadata: {
          latency,
          timestamp: new Date().toISOString(),
          providerChain: [this.config.id]
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(false, latency);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Implement Google Workspace health check
    return false;
  }

  async estimateCost(request: AIRequest): Promise<number> {
    // Google Workspace operations are typically free within quotas
    return 0;
  }

  private async handleCalendarRequest(request: AIRequest): Promise<any> {
    // TODO: Implement Google Calendar integration
    throw new Error('Google Calendar integration not yet implemented');
  }

  private async handleEmailRequest(request: AIRequest): Promise<any> {
    // TODO: Implement Gmail integration
    throw new Error('Gmail integration not yet implemented');
  }
}

// Provider selection and routing logic
export class ProviderRouter {
  private providers: Map<string, BaseAIProvider> = new Map();
  private selectionStrategy: 'priority' | 'cost' | 'latency' | 'quality' | 'round_robin' = 'priority';
  private roundRobinIndex = 0;

  registerProvider(provider: BaseAIProvider): void {
    this.providers.set(provider.getMetrics().providerId, provider);
  }

  setSelectionStrategy(strategy: typeof this.selectionStrategy): void {
    this.selectionStrategy = strategy;
  }

  async selectProvider(request: AIRequest, availableProviders: string[]): Promise<BaseAIProvider> {
    const candidates = availableProviders
      .map(id => this.providers.get(id))
      .filter((p): p is BaseAIProvider => p !== undefined);

    if (candidates.length === 0) {
      throw new Error('No available providers for request');
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    switch (this.selectionStrategy) {
      case 'priority':
        return this.selectByPriority(candidates);
      
      case 'cost':
        return await this.selectByCost(candidates, request);
      
      case 'latency':
        return this.selectByLatency(candidates);
      
      case 'quality':
        return this.selectByQuality(candidates);
      
      case 'round_robin':
        return this.selectRoundRobin(candidates);
      
      default:
        return candidates[0];
    }
  }

  private selectByPriority(candidates: BaseAIProvider[]): BaseAIProvider {
    // Assume providers are already sorted by priority in the orchestrator
    return candidates[0];
  }

  private async selectByCost(candidates: BaseAIProvider[], request: AIRequest): Promise<BaseAIProvider> {
    const costsPromises = candidates.map(async provider => ({
      provider,
      cost: await provider.estimateCost(request)
    }));
    
    const costs = await Promise.all(costsPromises);
    costs.sort((a, b) => a.cost - b.cost);
    
    return costs[0].provider;
  }

  private selectByLatency(candidates: BaseAIProvider[]): BaseAIProvider {
    const sorted = candidates.sort((a, b) => 
      a.getMetrics().averageLatency - b.getMetrics().averageLatency
    );
    return sorted[0];
  }

  private selectByQuality(candidates: BaseAIProvider[]): BaseAIProvider {
    // Quality can be measured by success rate and availability
    const sorted = candidates.sort((a, b) => {
      const qualityA = a.getMetrics().availability * (1 - a.getMetrics().errorRate);
      const qualityB = b.getMetrics().availability * (1 - b.getMetrics().errorRate);
      return qualityB - qualityA;
    });
    return sorted[0];
  }

  private selectRoundRobin(candidates: BaseAIProvider[]): BaseAIProvider {
    const provider = candidates[this.roundRobinIndex % candidates.length];
    this.roundRobinIndex++;
    return provider;
  }

  getAllProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): BaseAIProvider | undefined {
    return this.providers.get(id);
  }
}

// Comparative analysis system for A/B testing
export class ProviderComparator {
  async compareProviders(
    request: AIRequest,
    providerIds: string[],
    router: ProviderRouter
  ): Promise<ComparisonResult> {
    if (providerIds.length < 2) {
      throw new Error('At least 2 providers required for comparison');
    }

    const responses: AIResponse[] = [];
    const latencies: Record<string, number> = {};
    const costs: Record<string, number> = {};
    const qualities: Record<string, number> = {};

    // Execute request with each provider
    for (const providerId of providerIds) {
      const provider = router.getProvider(providerId);
      if (!provider) {
        console.warn(`Provider ${providerId} not found, skipping comparison`);
        continue;
      }

      try {
        const startTime = Date.now();
        const response = await provider.execute(request);
        const endTime = Date.now();

        responses.push(response);
        latencies[providerId] = endTime - startTime;
        costs[providerId] = response.metadata.cost || 0;
        qualities[providerId] = await this.assessQuality(response, request);
      } catch (error) {
        console.error(`Provider ${providerId} failed during comparison:`, error);
        latencies[providerId] = Infinity;
        costs[providerId] = Infinity;
        qualities[providerId] = 0;
      }
    }

    // Determine winner based on composite score
    const winner = this.selectWinner(providerIds, latencies, costs, qualities);
    const recommendation = this.generateRecommendation(providerIds, latencies, costs, qualities, winner);

    return {
      requestId: request.id,
      providers: providerIds,
      responses,
      winner,
      metrics: {
        latency: latencies,
        cost: costs,
        quality: qualities
      },
      recommendation
    };
  }

  private async assessQuality(response: AIResponse, request: AIRequest): Promise<number> {
    // Simple quality assessment based on response characteristics
    let score = 0.5; // Base score

    // Check if response is not empty
    if (response.content && response.content.toString().trim().length > 0) {
      score += 0.2;
    }

    // Check if response seems complete (ends with proper punctuation or structure)
    const content = response.content.toString();
    if (content.match(/[.!?}]$/)) {
      score += 0.1;
    }

    // Check response length appropriateness
    const expectedLength = JSON.stringify(request.payload).length;
    const actualLength = content.length;
    if (actualLength >= expectedLength * 0.5 && actualLength <= expectedLength * 5) {
      score += 0.1;
    }

    // Check for JSON validity if expected
    if (request.type === 'vc_analysis' || request.type === 'persona_detection') {
      try {
        JSON.parse(content);
        score += 0.1;
      } catch {
        // Not JSON, which might be fine
      }
    }

    return Math.min(score, 1.0);
  }

  private selectWinner(
    providerIds: string[],
    latencies: Record<string, number>,
    costs: Record<string, number>,
    qualities: Record<string, number>
  ): string {
    let bestScore = -Infinity;
    let winner = providerIds[0];

    for (const providerId of providerIds) {
      // Composite score: quality is most important, then latency, then cost
      const qualityScore = qualities[providerId] || 0;
      const latencyScore = latencies[providerId] === Infinity ? 0 : 1 / (1 + latencies[providerId] / 1000);
      const costScore = costs[providerId] === Infinity ? 0 : 1 / (1 + costs[providerId] * 1000);

      const compositeScore = qualityScore * 0.5 + latencyScore * 0.3 + costScore * 0.2;

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        winner = providerId;
      }
    }

    return winner;
  }

  private generateRecommendation(
    providerIds: string[],
    latencies: Record<string, number>,
    costs: Record<string, number>,
    qualities: Record<string, number>,
    winner: string
  ): string {
    const winnerLatency = latencies[winner];
    const winnerCost = costs[winner];
    const winnerQuality = qualities[winner];

    let recommendation = `Provider ${winner} is recommended based on composite scoring. `;

    if (winnerQuality > 0.8) {
      recommendation += 'Excellent quality response. ';
    } else if (winnerQuality > 0.6) {
      recommendation += 'Good quality response. ';
    } else {
      recommendation += 'Acceptable quality response. ';
    }

    if (winnerLatency < 2000) {
      recommendation += 'Fast response time. ';
    } else if (winnerLatency < 5000) {
      recommendation += 'Moderate response time. ';
    } else {
      recommendation += 'Slow response time. ';
    }

    if (winnerCost < 0.01) {
      recommendation += 'Low cost.';
    } else if (winnerCost < 0.05) {
      recommendation += 'Moderate cost.';
    } else {
      recommendation += 'High cost.';
    }

    return recommendation;
  }
}

// Factory for creating providers
export class ProviderFactory {
  static createProvider(config: ProviderConfig): BaseAIProvider {
    switch (config.id) {
      case 'claude-3.5-sonnet':
        return new ClaudeProvider(config);
      
      case 'gemini-pro':
        return new GeminiProvider(config);
      
      case 'google-workspace':
        return new GoogleWorkspaceProvider(config);
      
      default:
        throw new Error(`Unknown provider type: ${config.id}`);
    }
  }

  static createDefaultProviders(): BaseAIProvider[] {
    const providers: BaseAIProvider[] = [];

    // Claude provider (active)
    providers.push(ProviderFactory.createProvider({
      id: 'claude-3.5-sonnet',
      region: process.env.AWS_REGION || 'us-east-1',
      model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      maxRetries: 3,
      timeout: 30000,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000
      }
    }));

    // Gemini provider (inactive, for future use)
    providers.push(ProviderFactory.createProvider({
      id: 'gemini-pro',
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-pro',
      maxRetries: 2,
      timeout: 25000,
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 120000
      }
    }));

    // Google Workspace provider (inactive, for future use)
    providers.push(ProviderFactory.createProvider({
      id: 'google-workspace',
      apiKey: process.env.GOOGLE_WORKSPACE_API_KEY,
      maxRetries: 2,
      timeout: 15000,
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 0 // No token-based limits
      }
    }));

    return providers;
  }
}

// Export main components
export {
  BaseAIProvider,
  ProviderRouter,
  ProviderComparator,
  ProviderFactory
};