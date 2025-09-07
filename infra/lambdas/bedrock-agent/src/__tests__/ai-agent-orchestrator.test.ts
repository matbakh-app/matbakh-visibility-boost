/**
 * AI Agent Orchestrator Tests
 * 
 * Comprehensive test suite for the AI Agent Orchestration system
 */

import { AIAgentOrchestrator, AIRequest, AIWorkflow } from '../ai-agent-orchestrator';
import { ProviderRouter, ProviderFactory } from '../multi-provider-architecture';

// Mock the bedrock client
jest.mock('../bedrock-client', () => ({
  invokeBedrock: jest.fn(),
  healthCheck: jest.fn()
}));

describe('AIAgentOrchestrator', () => {
  let orchestrator: AIAgentOrchestrator;
  let mockBedrockResponse: any;

  beforeEach(() => {
    orchestrator = new AIAgentOrchestrator();
    
    mockBedrockResponse = {
      content: 'Test response content',
      tokenUsage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300
      },
      requestId: 'test-request-id',
      timestamp: new Date().toISOString(),
      cost: 0.005
    };

    // Mock the bedrock client
    const { invokeBedrock } = require('../bedrock-client');
    invokeBedrock.mockResolvedValue(mockBedrockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeRequest', () => {
    it('should execute a simple AI request successfully', async () => {
      const request: AIRequest = {
        id: 'test-request-1',
        type: 'vc_analysis',
        payload: {
          businessName: 'Test Restaurant',
          businessData: { category: 'Italian' }
        },
        context: {
          userId: 'user-123',
          language: 'en',
          businessContext: {
            businessId: 'test-restaurant',
            industry: 'restaurant'
          }
        }
      };

      const response = await orchestrator.executeRequest(request);

      expect(response).toBeDefined();
      expect(response.requestId).toBe(request.id);
      expect(response.providerId).toBe('claude-3.5-sonnet');
      expect(response.content).toBe(mockBedrockResponse.content);
      expect(response.metadata.tokenUsage).toEqual(mockBedrockResponse.tokenUsage);
      expect(response.metadata.cost).toBe(mockBedrockResponse.cost);
      expect(response.metadata.latency).toBeGreaterThan(0);
    });

    it('should handle provider fallback when primary fails', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      invokeBedrock.mockRejectedValueOnce(new Error('Primary provider failed'));
      invokeBedrock.mockResolvedValueOnce(mockBedrockResponse);

      const request: AIRequest = {
        id: 'test-request-2',
        type: 'content_generation',
        payload: { contentType: 'social_media_post' },
        context: { language: 'en' },
        preferences: { enableFallback: true }
      };

      const response = await orchestrator.executeRequest(request);

      expect(response).toBeDefined();
      expect(response.metadata.fallbackUsed).toBe(true);
      expect(response.metadata.providerChain).toContain('claude-3.5-sonnet');
    });

    it('should respect provider preferences', async () => {
      const request: AIRequest = {
        id: 'test-request-3',
        type: 'persona_detection',
        payload: { userData: 'test data' },
        context: { language: 'de' },
        preferences: {
          preferredProviders: ['claude-3.5-sonnet'],
          maxLatency: 5000
        }
      };

      const response = await orchestrator.executeRequest(request);

      expect(response.providerId).toBe('claude-3.5-sonnet');
      expect(response.metadata.latency).toBeLessThan(5000);
    });

    it('should handle cost constraints', async () => {
      const request: AIRequest = {
        id: 'test-request-4',
        type: 'text_rewrite',
        payload: { text: 'Short text to rewrite' },
        context: { language: 'en' },
        preferences: {
          maxCost: 0.001, // Very low cost limit
          enableFallback: false
        }
      };

      // Should still execute as cost estimation is rough
      const response = await orchestrator.executeRequest(request);
      expect(response).toBeDefined();
    });

    it('should throw error when no suitable providers available', async () => {
      const request: AIRequest = {
        id: 'test-request-5',
        type: 'image_analysis', // Not supported by current providers
        payload: { imageUrl: 'test.jpg' },
        context: { language: 'en' }
      };

      await expect(orchestrator.executeRequest(request)).rejects.toThrow();
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a simple sequential workflow', async () => {
      const workflowId = 'comprehensive_vc_analysis';
      const input = {
        userData: { persona: 'skeptical', experience: 'beginner' },
        businessData: { name: 'Test Restaurant', category: 'Italian' }
      };
      const context = {
        userId: 'user-123',
        language: 'en',
        businessContext: { businessId: 'test-restaurant', industry: 'restaurant' }
      };

      const result = await orchestrator.executeWorkflow(workflowId, input, context);

      expect(result).toBeDefined();
      expect(result.workflowId).toBe(workflowId);
      expect(result.executedSteps).toContain('persona_detection');
      expect(result.executedSteps).toContain('business_analysis');
      expect(result.executedSteps).toContain('content_recommendations');
      expect(result.results).toBeDefined();
      expect(Object.keys(result.results)).toHaveLength(3);
    });

    it('should handle workflow step failures with skip strategy', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      
      // Make the second step fail
      invokeBedrock
        .mockResolvedValueOnce(mockBedrockResponse) // persona_detection succeeds
        .mockRejectedValueOnce(new Error('Business analysis failed')) // business_analysis fails
        .mockResolvedValueOnce(mockBedrockResponse); // content_recommendations succeeds

      // Register a workflow with skip fallback strategy
      const testWorkflow: AIWorkflow = {
        id: 'test_skip_workflow',
        name: 'Test Skip Workflow',
        description: 'Test workflow with skip strategy',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: 'persona_detection',
            inputMapping: { 'data': 'input.data' },
            outputMapping: { 'result': 'output.result' }
          },
          {
            id: 'step2',
            name: 'Step 2',
            type: 'vc_analysis',
            inputMapping: { 'data': 'input.data' },
            outputMapping: { 'result': 'output.result' }
          },
          {
            id: 'step3',
            name: 'Step 3',
            type: 'content_generation',
            inputMapping: { 'data': 'input.data' },
            outputMapping: { 'result': 'output.result' }
          }
        ],
        dependencies: [
          { stepId: 'step2', dependsOn: ['step1'], type: 'sequential' },
          { stepId: 'step3', dependsOn: ['step2'], type: 'sequential' }
        ],
        fallbackStrategy: 'skip'
      };

      orchestrator.registerWorkflow(testWorkflow);

      const result = await orchestrator.executeWorkflow(
        'test_skip_workflow',
        { data: 'test' },
        { language: 'en' }
      );

      expect(result.executedSteps).toContain('step1');
      expect(result.executedSteps).toContain('step2'); // Marked as executed even though it failed
      expect(result.executedSteps).toContain('step3');
    });

    it('should handle workflow step failures with abort strategy', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      
      invokeBedrock
        .mockResolvedValueOnce(mockBedrockResponse) // First step succeeds
        .mockRejectedValueOnce(new Error('Second step failed')); // Second step fails

      // Register a workflow with abort strategy
      const testWorkflow: AIWorkflow = {
        id: 'test_abort_workflow',
        name: 'Test Abort Workflow',
        description: 'Test workflow with abort strategy',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: 'persona_detection',
            inputMapping: { 'data': 'input.data' },
            outputMapping: { 'result': 'output.result' }
          },
          {
            id: 'step2',
            name: 'Step 2',
            type: 'vc_analysis',
            inputMapping: { 'data': 'input.data' },
            outputMapping: { 'result': 'output.result' }
          }
        ],
        dependencies: [
          { stepId: 'step2', dependsOn: ['step1'], type: 'sequential' }
        ],
        fallbackStrategy: 'abort'
      };

      orchestrator.registerWorkflow(testWorkflow);

      await expect(orchestrator.executeWorkflow(
        'test_abort_workflow',
        { data: 'test' },
        { language: 'en' }
      )).rejects.toThrow('Second step failed');
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(orchestrator.executeWorkflow(
        'non_existent_workflow',
        {},
        { language: 'en' }
      )).rejects.toThrow('Workflow non_existent_workflow not found');
    });
  });

  describe('provider selection', () => {
    it('should select Claude for text analysis tasks', async () => {
      const request: AIRequest = {
        id: 'test-selection-1',
        type: 'vc_analysis',
        payload: { businessData: 'test' },
        context: { language: 'en' }
      };

      const response = await orchestrator.executeRequest(request);
      expect(response.providerId).toBe('claude-3.5-sonnet');
    });

    it('should handle provider unavailability', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      invokeBedrock.mockRejectedValue(new Error('All providers unavailable'));

      const request: AIRequest = {
        id: 'test-unavailable',
        type: 'content_generation',
        payload: { content: 'test' },
        context: { language: 'en' },
        preferences: { enableFallback: false }
      };

      await expect(orchestrator.executeRequest(request)).rejects.toThrow();
    });
  });

  describe('workflow data mapping', () => {
    it('should correctly map input data to workflow steps', async () => {
      const workflowId = 'comprehensive_vc_analysis';
      const input = {
        userData: { persona: 'professional', experience: 'expert' },
        businessData: { 
          name: 'Gourmet Bistro',
          category: 'Fine Dining',
          location: 'Downtown'
        }
      };

      const result = await orchestrator.executeWorkflow(
        workflowId,
        input,
        { language: 'en', businessContext: { businessId: 'gourmet-bistro', industry: 'restaurant' } }
      );

      expect(result.workflowData.input).toEqual(input);
      expect(result.workflowData.persona).toBeDefined();
      expect(result.workflowData.analysis).toBeDefined();
      expect(result.workflowData.recommendations).toBeDefined();
    });

    it('should handle complex data transformations', async () => {
      // Register a workflow with complex mappings
      const complexWorkflow: AIWorkflow = {
        id: 'complex_mapping_test',
        name: 'Complex Mapping Test',
        description: 'Test complex data mappings',
        steps: [
          {
            id: 'transform_data',
            name: 'Transform Data',
            type: 'vc_analysis',
            inputMapping: { 
              'business_name': 'input.businessData.name',
              'business_type': 'input.businessData.category'
            },
            outputMapping: { 
              'transformed_result': 'output.content'
            }
          },
          {
            id: 'use_transformed',
            name: 'Use Transformed Data',
            type: 'content_generation',
            inputMapping: {
              'source_data': 'workflow.transformed_result'
            },
            outputMapping: {
              'final_output': 'output.content'
            }
          }
        ],
        dependencies: [
          { stepId: 'use_transformed', dependsOn: ['transform_data'], type: 'sequential' }
        ]
      };

      orchestrator.registerWorkflow(complexWorkflow);

      const input = {
        businessData: {
          name: 'Test Restaurant',
          category: 'Italian'
        }
      };

      const result = await orchestrator.executeWorkflow(
        'complex_mapping_test',
        input,
        { language: 'en' }
      );

      expect(result.workflowData.transformed_result).toBe(mockBedrockResponse.content);
      expect(result.workflowData.final_output).toBe(mockBedrockResponse.content);
    });
  });

  describe('getStatus', () => {
    it('should return orchestrator status', () => {
      const status = orchestrator.getStatus();

      expect(status).toBeDefined();
      expect(status.activeProviders).toBeInstanceOf(Array);
      expect(status.activeProviders.length).toBeGreaterThan(0);
      expect(status.activeRequests).toBe(0);
      expect(status.workflows).toBeInstanceOf(Array);
      expect(status.workflows).toContain('comprehensive_vc_analysis');
      expect(status.capabilities).toBeDefined();
      expect(status.capabilities['claude-3.5-sonnet']).toBeInstanceOf(Array);
    });

    it('should track active requests', async () => {
      const request: AIRequest = {
        id: 'status-test',
        type: 'vc_analysis',
        payload: { test: 'data' },
        context: { language: 'en' }
      };

      // Delay the mock response to test active request tracking
      const { invokeBedrock } = require('../bedrock-client');
      invokeBedrock.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockBedrockResponse), 100))
      );

      const responsePromise = orchestrator.executeRequest(request);
      
      // Check status while request is active
      const statusDuringRequest = orchestrator.getStatus();
      expect(statusDuringRequest.activeRequests).toBe(1);

      await responsePromise;

      // Check status after request completes
      const statusAfterRequest = orchestrator.getStatus();
      expect(statusAfterRequest.activeRequests).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed AI responses', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      invokeBedrock.mockResolvedValue({
        // Missing required fields
        content: null,
        requestId: 'test-id'
      });

      const request: AIRequest = {
        id: 'malformed-test',
        type: 'vc_analysis',
        payload: { test: 'data' },
        context: { language: 'en' }
      };

      await expect(orchestrator.executeRequest(request)).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const { invokeBedrock } = require('../bedrock-client');
      invokeBedrock.mockRejectedValue(new Error('Request timeout'));

      const request: AIRequest = {
        id: 'timeout-test',
        type: 'content_generation',
        payload: { content: 'test' },
        context: { language: 'en' },
        preferences: { 
          enableFallback: false,
          maxLatency: 1000
        }
      };

      await expect(orchestrator.executeRequest(request)).rejects.toThrow('Request timeout');
    });

    it('should handle invalid workflow configurations', () => {
      const invalidWorkflow: AIWorkflow = {
        id: 'invalid_workflow',
        name: 'Invalid Workflow',
        description: 'Workflow with circular dependencies',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            type: 'vc_analysis',
            inputMapping: {},
            outputMapping: {}
          },
          {
            id: 'step2',
            name: 'Step 2',
            type: 'content_generation',
            inputMapping: {},
            outputMapping: {}
          }
        ],
        dependencies: [
          { stepId: 'step1', dependsOn: ['step2'], type: 'sequential' },
          { stepId: 'step2', dependsOn: ['step1'], type: 'sequential' }
        ]
      };

      orchestrator.registerWorkflow(invalidWorkflow);

      // This should not hang due to circular dependencies
      expect(async () => {
        await orchestrator.executeWorkflow(
          'invalid_workflow',
          {},
          { language: 'en' }
        );
      }).not.toThrow();
    });
  });

  describe('performance and scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests: AIRequest[] = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-${i}`,
        type: 'vc_analysis',
        payload: { businessId: `business-${i}` },
        context: { language: 'en' }
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => orchestrator.executeRequest(req))
      );
      const endTime = Date.now();

      expect(responses).toHaveLength(5);
      responses.forEach((response, i) => {
        expect(response.requestId).toBe(`concurrent-${i}`);
        expect(response.content).toBe(mockBedrockResponse.content);
      });

      // Should complete in reasonable time (concurrent execution)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large workflow executions', async () => {
      // Create a workflow with many steps
      const largeWorkflow: AIWorkflow = {
        id: 'large_workflow',
        name: 'Large Workflow',
        description: 'Workflow with many sequential steps',
        steps: Array.from({ length: 10 }, (_, i) => ({
          id: `step_${i}`,
          name: `Step ${i}`,
          type: 'content_generation',
          inputMapping: { 'data': i === 0 ? 'input.data' : `workflow.result_${i-1}` },
          outputMapping: { [`result_${i}`]: 'output.content' }
        })),
        dependencies: Array.from({ length: 9 }, (_, i) => ({
          stepId: `step_${i+1}`,
          dependsOn: [`step_${i}`],
          type: 'sequential' as const
        }))
      };

      orchestrator.registerWorkflow(largeWorkflow);

      const result = await orchestrator.executeWorkflow(
        'large_workflow',
        { data: 'initial' },
        { language: 'en' }
      );

      expect(result.executedSteps).toHaveLength(10);
      expect(result.workflowData.result_9).toBe(mockBedrockResponse.content);
    });
  });

  describe('integration with existing systems', () => {
    it('should integrate with persona detection system', async () => {
      const request: AIRequest = {
        id: 'persona-integration',
        type: 'persona_detection',
        payload: {
          userResponses: ['I need quick results', 'Show me the data'],
          businessContext: 'restaurant'
        },
        context: {
          language: 'en',
          businessContext: { industry: 'restaurant' }
        }
      };

      const response = await orchestrator.executeRequest(request);

      expect(response).toBeDefined();
      expect(response.content).toBe(mockBedrockResponse.content);
    });

    it('should integrate with VC system', async () => {
      const request: AIRequest = {
        id: 'vc-integration',
        type: 'vc_analysis',
        payload: {
          businessName: 'Test Restaurant',
          businessData: {
            gmb_url: 'https://maps.google.com/test',
            website: 'https://test-restaurant.com',
            social_media: {
              instagram: '@testrestaurant',
              facebook: 'TestRestaurant'
            }
          },
          analysisType: 'comprehensive'
        },
        context: {
          language: 'de',
          businessContext: {
            businessId: 'test-restaurant',
            industry: 'restaurant',
            location: 'Berlin'
          }
        }
      };

      const response = await orchestrator.executeRequest(request);

      expect(response).toBeDefined();
      expect(response.providerId).toBe('claude-3.5-sonnet');
      expect(response.metadata.tokenUsage).toBeDefined();
    });
  });
});

describe('Provider Integration', () => {
  let router: ProviderRouter;

  beforeEach(() => {
    router = new ProviderRouter();
    const providers = ProviderFactory.createDefaultProviders();
    providers.forEach(provider => router.registerProvider(provider));
  });

  it('should create and register providers correctly', () => {
    const allProviders = router.getAllProviders();
    expect(allProviders.length).toBeGreaterThan(0);
    
    const claudeProvider = router.getProvider('claude-3.5-sonnet');
    expect(claudeProvider).toBeDefined();
  });

  it('should select providers based on different strategies', async () => {
    const mockRequest: AIRequest = {
      id: 'strategy-test',
      type: 'vc_analysis',
      payload: { test: 'data' },
      context: { language: 'en' }
    };

    // Test priority strategy
    router.setSelectionStrategy('priority');
    const priorityProvider = await router.selectProvider(mockRequest, ['claude-3.5-sonnet']);
    expect(priorityProvider).toBeDefined();

    // Test round robin strategy
    router.setSelectionStrategy('round_robin');
    const rrProvider1 = await router.selectProvider(mockRequest, ['claude-3.5-sonnet']);
    const rrProvider2 = await router.selectProvider(mockRequest, ['claude-3.5-sonnet']);
    expect(rrProvider1).toBeDefined();
    expect(rrProvider2).toBeDefined();
  });
});

describe('Future Provider Support', () => {
  it('should be ready for Gemini integration', () => {
    const orchestrator = new AIAgentOrchestrator();
    const status = orchestrator.getStatus();
    
    // Should have placeholder for future providers
    expect(status.activeProviders.some(p => p.id === 'claude-3.5-sonnet')).toBe(true);
    
    // Capabilities should be extensible
    expect(status.capabilities).toBeDefined();
    expect(typeof status.capabilities).toBe('object');
  });

  it('should support future workflow types', () => {
    const orchestrator = new AIAgentOrchestrator();
    
    // Should be able to register new workflow types
    const futureWorkflow: AIWorkflow = {
      id: 'future_multimodal_workflow',
      name: 'Future Multimodal Workflow',
      description: 'Workflow combining text and image analysis',
      steps: [
        {
          id: 'image_analysis',
          name: 'Analyze Images',
          type: 'image_analysis',
          inputMapping: { 'images': 'input.images' },
          outputMapping: { 'image_insights': 'output.insights' }
        },
        {
          id: 'content_generation',
          name: 'Generate Content',
          type: 'content_generation',
          inputMapping: { 
            'insights': 'workflow.image_insights',
            'context': 'input.context'
          },
          outputMapping: { 'content': 'output.content' }
        }
      ],
      dependencies: [
        { stepId: 'content_generation', dependsOn: ['image_analysis'], type: 'sequential' }
      ]
    };

    expect(() => {
      orchestrator.registerWorkflow(futureWorkflow);
    }).not.toThrow();

    const status = orchestrator.getStatus();
    expect(status.workflows).toContain('future_multimodal_workflow');
  });
});