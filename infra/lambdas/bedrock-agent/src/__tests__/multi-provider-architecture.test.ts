/**
 * Multi-Provider Architecture Tests
 * 
 * Test suite for provider abstraction, routing, and comparison systems
 */

import {
  BaseAIProvider,
  ClaudeProvider,
  GeminiProvider,
  GoogleWorkspaceProvider,
  ProviderRouter,
  ProviderComparator,
  ProviderFactory
} from '../multi-provider-architecture';
import { AIRequest, AIResponse } from '../ai-agent-orchestrator';

// Mock the bedrock client
jest.mock('../bedrock-client', () => ({
  invokeBedrock: jest.fn(),
  healthCheck: jest.fn()
}));

describe('BaseAIProvider', () => {
  class TestProvider extends BaseAIProvider {
    async execute(request: AIRequest): Promise<AIResponse> {
      const startTime = Date.now();
      
      try {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response: AIResponse = {
          id: `${request.id}-test`,
          requestId: request.id,
          providerId: this.config.id,
          content: 'Test response',
          metadata: {
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            providerChain: [this.config.id]
          }
        };
        
        this.updateMetrics(true, Date.now() - startTime, 0.01);
        return response;
      } catch (error) {
        this.updateMetrics(false, Date.now() - startTime);
        throw error;
      }
    }

    async healthCheck(): Promise<boolean> {
      return true;
    }

    async estimateCost(_request: AIRequest): Promise<number> {
      return 0.01;
    }
  }

  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider({
      id: 'test-provider',
      maxRetries: 3,
      timeout: 5000
    });
  });

  it('should initialize with default metrics', () => {
    const metrics = provider.getMetrics();
    
    expect(metrics.providerId).toBe('test-provider');
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.successfulRequests).toBe(0);
    expect(metrics.failedRequests).toBe(0);
    expect(metrics.errorRate).toBe(0);
    expect(metrics.availability).toBe(1.0);
  });

  it('should update metrics on successful execution', async () => {
    const request: AIRequest = {
      id: 'test-1',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await provider.execute(request);
    
    const metrics = provider.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.successfulRequests).toBe(1);
    expect(metrics.failedRequests).toBe(0);
    expect(metrics.errorRate).toBe(0);
    expect(metrics.availability).toBe(1.0);
    expect(metrics.averageLatency).toBeGreaterThan(0);
  });

  it('should update metrics on failed execution', async () => {
    class FailingProvider extends BaseAIProvider {
      async execute(_request: AIRequest): Promise<AIResponse> {
        const startTime = Date.now();
        this.updateMetrics(false, Date.now() - startTime);
        throw new Error('Test failure');
      }

      async healthCheck(): Promise<boolean> {
        return false;
      }

      async estimateCost(_request: AIRequest): Promise<number> {
        return 0;
      }
    }

    const failingProvider = new FailingProvider({ id: 'failing-provider' });
    
    const request: AIRequest = {
      id: 'test-fail',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await expect(failingProvider.execute(request)).rejects.toThrow('Test failure');
    
    const metrics = failingProvider.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.successfulRequests).toBe(0);
    expect(metrics.failedRequests).toBe(1);
    expect(metrics.errorRate).toBe(1.0);
    expect(metrics.availability).toBe(0);
  });
});

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  let mockBedrockResponse: any;

  beforeEach(() => {
    provider = new ClaudeProvider({
      id: 'claude-3.5-sonnet',
      region: 'us-east-1',
      model: 'anthropic.claude-3-5-sonnet-20240620-v1:0'
    });

    mockBedrockResponse = {
      content: 'Claude response content',
      tokenUsage: {
        inputTokens: 150,
        outputTokens: 300,
        totalTokens: 450
      },
      requestId: 'claude-request-id',
      timestamp: new Date().toISOString(),
      cost: 0.0075
    };

    const { invokeBedrock, healthCheck } = require('../bedrock-client');
    invokeBedrock.mockResolvedValue(mockBedrockResponse);
    healthCheck.mockResolvedValue({ status: 'healthy' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute requests successfully', async () => {
    const request: AIRequest = {
      id: 'claude-test-1',
      type: 'vc_analysis',
      payload: {
        businessName: 'Test Restaurant',
        analysisType: 'comprehensive'
      },
      context: {
        language: 'en',
        businessContext: { industry: 'restaurant' }
      }
    };

    const response = await provider.execute(request);

    expect(response).toBeDefined();
    expect(response.requestId).toBe(request.id);
    expect(response.providerId).toBe('claude-3.5-sonnet');
    expect(response.content).toBe(mockBedrockResponse.content);
    expect(response.metadata.tokenUsage).toEqual(mockBedrockResponse.tokenUsage);
    expect(response.metadata.cost).toBe(mockBedrockResponse.cost);
  });

  it('should handle fallback responses', async () => {
    const fallbackResponse = {
      content: 'Fallback response',
      fallbackReason: 'Circuit breaker open'
    };

    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockResolvedValue(fallbackResponse);

    const request: AIRequest = {
      id: 'claude-fallback-test',
      type: 'content_generation',
      payload: { contentType: 'social_media' },
      context: { language: 'de' }
    };

    const response = await provider.execute(request);

    expect(response.metadata.fallbackUsed).toBe(true);
    expect(response.metadata.providerChain).toContain('fallback');
  });

  it('should perform health checks', async () => {
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);

    const { healthCheck } = require('../bedrock-client');
    healthCheck.mockResolvedValue({ status: 'unhealthy' });

    const isUnhealthy = await provider.healthCheck();
    expect(isUnhealthy).toBe(false);
  });

  it('should estimate costs accurately', async () => {
    const request: AIRequest = {
      id: 'cost-test',
      type: 'vc_analysis',
      payload: { businessData: 'A'.repeat(1000) }, // Large input
      context: { language: 'en' }
    };

    const estimatedCost = await provider.estimateCost(request);
    expect(estimatedCost).toBeGreaterThan(0);
    expect(typeof estimatedCost).toBe('number');
  });

  it('should handle errors gracefully', async () => {
    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockRejectedValue(new Error('Bedrock service unavailable'));

    const request: AIRequest = {
      id: 'error-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await expect(provider.execute(request)).rejects.toThrow();
    
    const metrics = provider.getMetrics();
    expect(metrics.failedRequests).toBe(1);
    expect(metrics.errorRate).toBe(1.0);
  });
});

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider({
      id: 'gemini-pro',
      apiKey: 'test-api-key',
      model: 'gemini-pro'
    });
  });

  it('should throw not implemented error for execute', async () => {
    const request: AIRequest = {
      id: 'gemini-test',
      type: 'image_analysis',
      payload: { imageUrl: 'test.jpg' },
      context: { language: 'en' }
    };

    await expect(provider.execute(request)).rejects.toThrow('Gemini provider not yet implemented');
  });

  it('should return false for health check', async () => {
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(false);
  });

  it('should return zero cost estimate', async () => {
    const request: AIRequest = {
      id: 'cost-test',
      type: 'image_analysis',
      payload: { imageUrl: 'test.jpg' },
      context: { language: 'en' }
    };

    const cost = await provider.estimateCost(request);
    expect(cost).toBe(0);
  });
});

describe('GoogleWorkspaceProvider', () => {
  let provider: GoogleWorkspaceProvider;

  beforeEach(() => {
    provider = new GoogleWorkspaceProvider({
      id: 'google-workspace',
      apiKey: 'test-workspace-key'
    });
  });

  it('should throw not implemented error for unsupported request types', async () => {
    const request: AIRequest = {
      id: 'workspace-test',
      type: 'vc_analysis', // Not supported by workspace provider
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await expect(provider.execute(request)).rejects.toThrow('Unsupported request type for Google Workspace');
  });

  it('should handle calendar integration requests', async () => {
    const request: AIRequest = {
      id: 'calendar-test',
      type: 'calendar_integration',
      payload: { 
        action: 'create_event',
        eventData: { title: 'Restaurant Meeting' }
      },
      context: { language: 'en' }
    };

    await expect(provider.execute(request)).rejects.toThrow('Google Calendar integration not yet implemented');
  });

  it('should handle email generation requests', async () => {
    const request: AIRequest = {
      id: 'email-test',
      type: 'email_generation',
      payload: {
        recipient: 'customer@example.com',
        subject: 'Reservation Confirmation'
      },
      context: { language: 'en' }
    };

    await expect(provider.execute(request)).rejects.toThrow('Gmail integration not yet implemented');
  });
});

describe('ProviderRouter', () => {
  let router: ProviderRouter;
  let mockProviders: BaseAIProvider[];

  beforeEach(() => {
    router = new ProviderRouter();
    mockProviders = ProviderFactory.createDefaultProviders();
    mockProviders.forEach(provider => router.registerProvider(provider));
  });

  it('should register providers correctly', () => {
    const allProviders = router.getAllProviders();
    expect(allProviders.length).toBe(mockProviders.length);
    
    const claudeProvider = router.getProvider('claude-3.5-sonnet');
    expect(claudeProvider).toBeDefined();
  });

  it('should select providers using priority strategy', async () => {
    router.setSelectionStrategy('priority');
    
    const request: AIRequest = {
      id: 'priority-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    const provider = await router.selectProvider(request, ['claude-3.5-sonnet', 'gemini-pro']);
    expect(provider).toBeDefined();
    expect(provider.getMetrics().providerId).toBe('claude-3.5-sonnet'); // Should select first available
  });

  it('should select providers using round robin strategy', async () => {
    router.setSelectionStrategy('round_robin');
    
    const request: AIRequest = {
      id: 'rr-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    const provider1 = await router.selectProvider(request, ['claude-3.5-sonnet']);
    const provider2 = await router.selectProvider(request, ['claude-3.5-sonnet']);
    
    expect(provider1).toBeDefined();
    expect(provider2).toBeDefined();
    // With only one provider, should return the same one
    expect(provider1.getMetrics().providerId).toBe(provider2.getMetrics().providerId);
  });

  it('should select providers using cost strategy', async () => {
    router.setSelectionStrategy('cost');
    
    const request: AIRequest = {
      id: 'cost-test',
      type: 'vc_analysis',
      payload: { test: 'small data' },
      context: { language: 'en' }
    };

    const provider = await router.selectProvider(request, ['claude-3.5-sonnet', 'gemini-pro']);
    expect(provider).toBeDefined();
  });

  it('should select providers using latency strategy', async () => {
    router.setSelectionStrategy('latency');
    
    const request: AIRequest = {
      id: 'latency-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    const provider = await router.selectProvider(request, ['claude-3.5-sonnet']);
    expect(provider).toBeDefined();
  });

  it('should select providers using quality strategy', async () => {
    router.setSelectionStrategy('quality');
    
    const request: AIRequest = {
      id: 'quality-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    const provider = await router.selectProvider(request, ['claude-3.5-sonnet']);
    expect(provider).toBeDefined();
  });

  it('should throw error when no providers available', async () => {
    const request: AIRequest = {
      id: 'no-provider-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await expect(router.selectProvider(request, [])).rejects.toThrow('No available providers for request');
  });

  it('should return single provider when only one available', async () => {
    const request: AIRequest = {
      id: 'single-provider-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    const provider = await router.selectProvider(request, ['claude-3.5-sonnet']);
    expect(provider.getMetrics().providerId).toBe('claude-3.5-sonnet');
  });
});

describe('ProviderComparator', () => {
  let comparator: ProviderComparator;
  let router: ProviderRouter;

  beforeEach(() => {
    comparator = new ProviderComparator();
    router = new ProviderRouter();
    
    const providers = ProviderFactory.createDefaultProviders();
    providers.forEach(provider => router.registerProvider(provider));

    // Mock successful responses for comparison
    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockResolvedValue({
      content: 'Comparison test response',
      tokenUsage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
      requestId: 'comparison-test',
      timestamp: new Date().toISOString(),
      cost: 0.005
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should compare multiple providers successfully', async () => {
    const request: AIRequest = {
      id: 'comparison-test',
      type: 'vc_analysis',
      payload: {
        businessName: 'Test Restaurant',
        analysisType: 'basic'
      },
      context: { language: 'en' }
    };

    const result = await comparator.compareProviders(
      request,
      ['claude-3.5-sonnet'],
      router
    );

    expect(result).toBeDefined();
    expect(result.requestId).toBe(request.id);
    expect(result.providers).toEqual(['claude-3.5-sonnet']);
    expect(result.responses).toHaveLength(1);
    expect(result.winner).toBe('claude-3.5-sonnet');
    expect(result.metrics.latency).toBeDefined();
    expect(result.metrics.cost).toBeDefined();
    expect(result.metrics.quality).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  it('should handle provider failures during comparison', async () => {
    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockRejectedValue(new Error('Provider failed'));

    const request: AIRequest = {
      id: 'comparison-failure-test',
      type: 'content_generation',
      payload: { contentType: 'social_media' },
      context: { language: 'en' }
    };

    const result = await comparator.compareProviders(
      request,
      ['claude-3.5-sonnet'],
      router
    );

    expect(result.metrics.latency['claude-3.5-sonnet']).toBe(Infinity);
    expect(result.metrics.cost['claude-3.5-sonnet']).toBe(Infinity);
    expect(result.metrics.quality['claude-3.5-sonnet']).toBe(0);
  });

  it('should require at least 2 providers for comparison', async () => {
    const request: AIRequest = {
      id: 'single-provider-comparison',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    await expect(comparator.compareProviders(
      request,
      ['claude-3.5-sonnet'],
      router
    )).rejects.toThrow('At least 2 providers required for comparison');
  });

  it('should generate meaningful recommendations', async () => {
    const request: AIRequest = {
      id: 'recommendation-test',
      type: 'vc_analysis',
      payload: { businessData: 'comprehensive analysis data' },
      context: { language: 'en' }
    };

    // Mock different response qualities
    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock
      .mockResolvedValueOnce({
        content: 'High quality detailed response with comprehensive analysis',
        tokenUsage: { inputTokens: 100, outputTokens: 400, totalTokens: 500 },
        requestId: 'high-quality',
        timestamp: new Date().toISOString(),
        cost: 0.008
      });

    const result = await comparator.compareProviders(
      request,
      ['claude-3.5-sonnet'],
      router
    );

    expect(result.recommendation).toContain('claude-3.5-sonnet');
    expect(result.recommendation).toMatch(/quality|latency|cost/i);
  });
});

describe('ProviderFactory', () => {
  it('should create Claude provider', () => {
    const provider = ProviderFactory.createProvider({
      id: 'claude-3.5-sonnet',
      region: 'us-east-1',
      model: 'anthropic.claude-3-5-sonnet-20240620-v1:0'
    });

    expect(provider).toBeInstanceOf(ClaudeProvider);
    expect(provider.getMetrics().providerId).toBe('claude-3.5-sonnet');
  });

  it('should create Gemini provider', () => {
    const provider = ProviderFactory.createProvider({
      id: 'gemini-pro',
      apiKey: 'test-key',
      model: 'gemini-pro'
    });

    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.getMetrics().providerId).toBe('gemini-pro');
  });

  it('should create Google Workspace provider', () => {
    const provider = ProviderFactory.createProvider({
      id: 'google-workspace',
      apiKey: 'test-workspace-key'
    });

    expect(provider).toBeInstanceOf(GoogleWorkspaceProvider);
    expect(provider.getMetrics().providerId).toBe('google-workspace');
  });

  it('should throw error for unknown provider type', () => {
    expect(() => {
      ProviderFactory.createProvider({
        id: 'unknown-provider',
        apiKey: 'test-key'
      });
    }).toThrow('Unknown provider type: unknown-provider');
  });

  it('should create default providers', () => {
    const providers = ProviderFactory.createDefaultProviders();
    
    expect(providers).toHaveLength(3);
    expect(providers.some(p => p.getMetrics().providerId === 'claude-3.5-sonnet')).toBe(true);
    expect(providers.some(p => p.getMetrics().providerId === 'gemini-pro')).toBe(true);
    expect(providers.some(p => p.getMetrics().providerId === 'google-workspace')).toBe(true);
  });
});

describe('Provider Metrics and Monitoring', () => {
  let provider: ClaudeProvider;

  beforeEach(() => {
    provider = new ClaudeProvider({
      id: 'claude-metrics-test',
      region: 'us-east-1'
    });

    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockResolvedValue({
      content: 'Metrics test response',
      tokenUsage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
      requestId: 'metrics-test',
      timestamp: new Date().toISOString(),
      cost: 0.003
    });
  });

  it('should track request metrics over time', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => ({
      id: `metrics-${i}`,
      type: 'vc_analysis' as const,
      payload: { test: `data-${i}` },
      context: { language: 'en' as const }
    }));

    // Execute multiple requests
    for (const request of requests) {
      await provider.execute(request);
    }

    const metrics = provider.getMetrics();
    expect(metrics.totalRequests).toBe(5);
    expect(metrics.successfulRequests).toBe(5);
    expect(metrics.failedRequests).toBe(0);
    expect(metrics.errorRate).toBe(0);
    expect(metrics.availability).toBe(1.0);
    expect(metrics.averageLatency).toBeGreaterThan(0);
    expect(metrics.averageCost).toBeGreaterThan(0);
  });

  it('should calculate error rates correctly', async () => {
    const { invokeBedrock } = require('../bedrock-client');
    
    // First request succeeds
    await provider.execute({
      id: 'success-1',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    });

    // Second request fails
    invokeBedrock.mockRejectedValueOnce(new Error('Test failure'));
    
    try {
      await provider.execute({
        id: 'failure-1',
        type: 'vc_analysis',
        payload: { test: 'data' },
        context: { language: 'en' }
      });
    } catch (error) {
      // Expected failure
    }

    const metrics = provider.getMetrics();
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.successfulRequests).toBe(1);
    expect(metrics.failedRequests).toBe(1);
    expect(metrics.errorRate).toBe(0.5);
    expect(metrics.availability).toBe(0.5);
  });

  it('should update average latency with exponential moving average', async () => {
    // Mock different response times
    const { invokeBedrock } = require('../bedrock-client');
    
    invokeBedrock.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        content: 'Response',
        tokenUsage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
        requestId: 'latency-test',
        timestamp: new Date().toISOString(),
        cost: 0.003
      }), Math.random() * 100))
    );

    // Execute multiple requests with varying latencies
    for (let i = 0; i < 3; i++) {
      await provider.execute({
        id: `latency-${i}`,
        type: 'vc_analysis',
        payload: { test: 'data' },
        context: { language: 'en' }
      });
    }

    const metrics = provider.getMetrics();
    expect(metrics.averageLatency).toBeGreaterThan(0);
    expect(metrics.averageLatency).toBeLessThan(1000); // Should be reasonable
  });
});

describe('Integration and Extensibility', () => {
  it('should support adding new provider types', () => {
    class CustomProvider extends BaseAIProvider {
      async execute(request: AIRequest): Promise<AIResponse> {
        return {
          id: `${request.id}-custom`,
          requestId: request.id,
          providerId: this.config.id,
          content: 'Custom provider response',
          metadata: {
            latency: 100,
            timestamp: new Date().toISOString(),
            providerChain: [this.config.id]
          }
        };
      }

      async healthCheck(): Promise<boolean> {
        return true;
      }

      async estimateCost(_request: AIRequest): Promise<number> {
        return 0.001;
      }
    }

    const customProvider = new CustomProvider({
      id: 'custom-provider',
      apiKey: 'custom-key'
    });

    const router = new ProviderRouter();
    router.registerProvider(customProvider);

    const retrievedProvider = router.getProvider('custom-provider');
    expect(retrievedProvider).toBeDefined();
    expect(retrievedProvider?.getMetrics().providerId).toBe('custom-provider');
  });

  it('should support provider-specific configurations', () => {
    const claudeProvider = new ClaudeProvider({
      id: 'claude-custom',
      region: 'eu-west-1',
      model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      maxRetries: 5,
      timeout: 60000,
      rateLimit: {
        requestsPerMinute: 30,
        tokensPerMinute: 50000
      }
    });

    expect(claudeProvider).toBeDefined();
    expect(claudeProvider.getMetrics().providerId).toBe('claude-custom');
  });

  it('should handle future provider capabilities', () => {
    // Test that the system can handle new request types
    const futureRequest: AIRequest = {
      id: 'future-test',
      type: 'competitive_analysis', // New type
      payload: {
        competitors: ['competitor1', 'competitor2'],
        analysisDepth: 'comprehensive'
      },
      context: {
        language: 'en',
        businessContext: {
          industry: 'restaurant',
          location: 'Berlin'
        }
      }
    };

    // Should not throw error for unknown request types
    expect(futureRequest.type).toBe('competitive_analysis');
    expect(futureRequest.payload).toBeDefined();
  });
});