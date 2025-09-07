/**
 * AI Service Orchestrator Lambda Handler
 * Main entry point for advanced AI service orchestration
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseAIProvider } from './base-provider';
import { ClaudeProvider } from './claude-provider';
import { GeminiProvider } from './gemini-provider';
import { ProviderSelector } from './provider-selector';
import { ProviderHealthMonitor } from './health-monitor';
import { 
  AIRequest, 
  AIResponse, 
  AIProvider, 
  AIOrchestrationConfig,
  ProviderLoadBalancing 
} from './types';

// Global instances (cached across Lambda invocations)
let providerSelector: ProviderSelector | null = null;
let healthMonitor: ProviderHealthMonitor | null = null;
let initialized = false;

/**
 * Initialize the orchestrator with providers
 */
async function initializeOrchestrator(): Promise<void> {
  if (initialized) {
    return;
  }

  console.log('Initializing AI Service Orchestrator...');

  // Initialize components
  const loadBalancingStrategy: ProviderLoadBalancing = {
    strategy: 'intelligent',
    healthCheckRequired: true,
    stickySession: false,
  };

  providerSelector = new ProviderSelector(loadBalancingStrategy);
  healthMonitor = new ProviderHealthMonitor();

  // Initialize Claude provider
  const claudeProvider: AIProvider = {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    type: 'claude',
    status: 'active',
    capabilities: ClaudeProvider.getDefaultCapabilities(),
    pricing: ClaudeProvider.getDefaultPricing(),
    performance: {
      averageLatency: 2000,
      p95Latency: 5000,
      successRate: 0.99,
      errorRate: 0.01,
      throughput: 100,
      lastUpdated: new Date().toISOString(),
    },
    configuration: {
      model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      defaultConstraints: {
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9,
        responseFormat: 'text',
        safetyLevel: 'moderate',
      },
      rateLimits: {
        requestsPerMinute: 100,
        tokensPerMinute: 400000,
        concurrentRequests: 10,
      },
    },
    healthCheck: {
      lastCheck: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      consecutiveFailures: 0,
    },
  };

  const claudeProviderInstance = new ClaudeProvider(claudeProvider);
  providerSelector.registerProvider(claudeProviderInstance);
  healthMonitor.registerProvider(claudeProviderInstance);

  // Initialize Gemini provider
  const geminiProvider: AIProvider = {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    type: 'gemini',
    status: 'active',
    capabilities: GeminiProvider.getDefaultCapabilities(),
    pricing: GeminiProvider.getDefaultPricing(),
    performance: {
      averageLatency: 1500,
      p95Latency: 4000,
      successRate: 0.98,
      errorRate: 0.02,
      throughput: 120,
      lastUpdated: new Date().toISOString(),
    },
    configuration: {
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-1.5-pro',
      defaultConstraints: {
        maxTokens: 8000,
        temperature: 0.7,
        topP: 0.9,
        responseFormat: 'text',
        safetyLevel: 'moderate',
      },
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 1000000,
        concurrentRequests: 5,
      },
    },
    healthCheck: {
      lastCheck: new Date().toISOString(),
      status: 'unknown',
      responseTime: 0,
      consecutiveFailures: 0,
    },
  };

  const geminiProviderInstance = new GeminiProvider(geminiProvider);
  providerSelector.registerProvider(geminiProviderInstance);
  healthMonitor.registerProvider(geminiProviderInstance);

  // Start health monitoring
  healthMonitor.startMonitoring(60000); // Check every minute

  initialized = true;
  console.log('AI Service Orchestrator initialized successfully');
}

/**
 * Process AI request with provider orchestration
 */
async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  if (!providerSelector || !healthMonitor) {
    throw new Error('Orchestrator not initialized');
  }

  console.log(`Processing AI request: ${request.id} (type: ${request.type})`);

  try {
    // Select optimal provider
    const selection = providerSelector.selectProvider(request);
    console.log(`Selected provider: ${selection.selectedProvider.id} (score: ${selection.score})`);

    // Check circuit breaker
    if (!healthMonitor.isProviderAvailable(selection.selectedProvider.id)) {
      console.log(`Provider ${selection.selectedProvider.id} unavailable due to circuit breaker`);
      
      // Try alternatives
      for (const alternative of selection.alternatives) {
        if (healthMonitor.isProviderAvailable(alternative.provider.id)) {
          console.log(`Falling back to provider: ${alternative.provider.id}`);
          const fallbackProvider = providerSelector.getProvider(alternative.provider.id);
          if (fallbackProvider) {
            return await fallbackProvider.processRequest(request);
          }
        }
      }
      
      throw new Error('No available providers after circuit breaker checks');
    }

    // Get provider instance and process request
    const providerInstance = providerSelector.getProvider(selection.selectedProvider.id);
    if (!providerInstance) {
      throw new Error(`Provider instance not found: ${selection.selectedProvider.id}`);
    }

    const response = await providerInstance.processRequest(request);
    
    // Add orchestration metadata
    response.metadata = {
      ...response.metadata,
      orchestration: {
        selectedProvider: selection.selectedProvider.id,
        selectionScore: selection.score,
        selectionReasoning: selection.reasoning,
        alternativeProviders: selection.alternatives.map(alt => alt.provider.id),
      },
    };

    return response;

  } catch (error) {
    console.error('AI request processing failed:', error);
    
    // Return error response
    return {
      id: `error-${Date.now()}`,
      requestId: request.id,
      providerId: 'orchestrator',
      content: '',
      metadata: {
        tokensUsed: 0,
        cost: 0,
        latency: 0,
        model: 'none',
        finishReason: 'error',
      },
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle API Gateway requests
 */
async function handleAPIRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters, queryStringParameters, body, headers } = event;

  try {
    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Initialize orchestrator
    await initializeOrchestrator();

    // Route requests
    if (path === '/ai/process' && httpMethod === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const aiRequest: AIRequest = JSON.parse(body);
      
      // Validate required fields
      if (!aiRequest.id || !aiRequest.userId || !aiRequest.type || !aiRequest.prompt) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields: id, userId, type, prompt' }),
        };
      }

      const response = await processAIRequest(aiRequest);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(response),
      };
    }

    if (path === '/ai/providers' && httpMethod === 'GET') {
      if (!providerSelector) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Orchestrator not initialized' }),
        };
      }

      const providers = providerSelector.getProviders().map(p => p.getProvider());
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ providers }),
      };
    }

    if (path === '/ai/health' && httpMethod === 'GET') {
      if (!healthMonitor) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Health monitor not initialized' }),
        };
      }

      const healthSummary = await healthMonitor.getProviderHealthSummary();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ health: healthSummary }),
      };
    }

    if (path === '/ai/stats' && httpMethod === 'GET') {
      if (!providerSelector) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Orchestrator not initialized' }),
        };
      }

      const timeWindow = parseInt(queryStringParameters?.timeWindow || '60');
      const stats = providerSelector.getSelectionStatistics(timeWindow);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats),
      };
    }

    if (path.startsWith('/ai/circuit-breaker/') && httpMethod === 'POST') {
      const providerId = pathParameters?.providerId;
      if (!providerId || !healthMonitor) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Provider ID required and health monitor must be initialized' }),
        };
      }

      const { action, state } = JSON.parse(body || '{}');
      
      if (action === 'reset') {
        await healthMonitor.resetCircuitBreaker(providerId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Circuit breaker reset' }),
        };
      } else if (action === 'force' && state) {
        await healthMonitor.forceCircuitBreakerState(providerId, state);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: `Circuit breaker forced to ${state}` }),
        };
      }

      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid action or missing state' }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('API request error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent | any,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('AI Service Orchestrator invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle API Gateway events
    if ('httpMethod' in event) {
      return await handleAPIRequest(event as APIGatewayProxyEvent);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unsupported event type',
        }),
      };
    }

  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};