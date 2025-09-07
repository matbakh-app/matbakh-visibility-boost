/**
 * AI Agent Orchestration System
 * 
 * Central orchestrator for all AI agents and providers in the matbakh.app ecosystem.
 * Supports Claude (Bedrock), Gemini (future), and other AI services with unified interface.
 * 
 * Features:
 * - Multi-provider architecture with intelligent fallback
 * - Agent coordination for complex workflows
 * - Provider abstraction layer
 * - Comparative analysis and A/B testing
 * - Future-ready for Google Calendar, Gmail, Drive, YouTube, Ads
 */

import { BedrockRequest, BedrockResponse, invokeBedrock } from './bedrock-client';
import { CircuitBreakerError } from './circuit-breaker';

// Core types for the orchestration system
export interface AIProvider {
  id: string;
  name: string;
  type: 'llm' | 'vision' | 'translation' | 'content' | 'integration';
  capabilities: AICapability[];
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated';
  priority: number; // Lower number = higher priority
  costPerToken?: number;
  maxTokens?: number;
  supportedLanguages?: string[];
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  maxInputSize?: number;
  averageLatency?: number; // in milliseconds
}

export interface AIRequest {
  id: string;
  type: AIRequestType;
  payload: any;
  context: AIContext;
  preferences?: AIPreferences;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  requestId: string;
  providerId: string;
  content: any;
  metadata: {
    tokenUsage?: TokenUsage;
    cost?: number;
    latency: number;
    timestamp: string;
    fallbackUsed?: boolean;
    providerChain?: string[];
  };
  quality?: QualityMetrics;
}

export interface AIContext {
  userId?: string;
  sessionId?: string;
  persona?: string;
  language: string;
  businessContext?: {
    businessId?: string;
    industry?: string;
    location?: string;
  };
  previousRequests?: string[];
}

export interface AIPreferences {
  preferredProviders?: string[];
  maxCost?: number;
  maxLatency?: number;
  qualityThreshold?: number;
  enableFallback?: boolean;
  enableComparison?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface QualityMetrics {
  relevance: number; // 0-1
  accuracy: number; // 0-1
  completeness: number; // 0-1
  coherence: number; // 0-1
  overall: number; // 0-1
}

export type AIRequestType = 
  | 'vc_analysis'
  | 'content_generation'
  | 'persona_detection'
  | 'text_rewrite'
  | 'image_analysis'
  | 'translation'
  | 'calendar_integration'
  | 'email_generation'
  | 'social_media_post'
  | 'competitive_analysis'
  | 'trend_analysis';

// Workflow types for complex multi-step operations
export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  steps: AIWorkflowStep[];
  dependencies?: WorkflowDependency[];
  fallbackStrategy?: 'abort' | 'skip' | 'alternative';
}

export interface AIWorkflowStep {
  id: string;
  name: string;
  type: AIRequestType;
  provider?: string; // Optional provider preference
  inputMapping: Record<string, string>; // Map workflow data to step input
  outputMapping: Record<string, string>; // Map step output to workflow data
  condition?: string; // JavaScript expression for conditional execution
  retryPolicy?: RetryPolicy;
}

export interface WorkflowDependency {
  stepId: string;
  dependsOn: string[];
  type: 'sequential' | 'parallel' | 'conditional';
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number;
  maxDelay: number;
}

// Provider registry and management
class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private capabilities: Map<string, AICapability[]> = new Map();

  constructor() {
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    // Claude 3.5 Sonnet via Bedrock
    this.registerProvider({
      id: 'claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      type: 'llm',
      capabilities: [
        {
          id: 'text_analysis',
          name: 'Text Analysis',
          description: 'Advanced text analysis and understanding',
          inputTypes: ['text'],
          outputTypes: ['text', 'json'],
          maxInputSize: 200000,
          averageLatency: 3000
        },
        {
          id: 'content_generation',
          name: 'Content Generation',
          description: 'Generate high-quality content',
          inputTypes: ['text', 'json'],
          outputTypes: ['text'],
          maxInputSize: 200000,
          averageLatency: 4000
        },
        {
          id: 'business_analysis',
          name: 'Business Analysis',
          description: 'Strategic business framework analysis',
          inputTypes: ['text', 'json'],
          outputTypes: ['json'],
          maxInputSize: 150000,
          averageLatency: 5000
        }
      ],
      status: 'active',
      priority: 1,
      costPerToken: 0.000015, // $15 per 1M output tokens
      maxTokens: 4096,
      supportedLanguages: ['en', 'de', 'fr', 'es', 'it']
    });

    // Future: Google Gemini
    this.registerProvider({
      id: 'gemini-pro',
      name: 'Google Gemini Pro',
      type: 'llm',
      capabilities: [
        {
          id: 'multimodal_analysis',
          name: 'Multimodal Analysis',
          description: 'Text and image analysis combined',
          inputTypes: ['text', 'image'],
          outputTypes: ['text', 'json'],
          maxInputSize: 1000000,
          averageLatency: 2500
        },
        {
          id: 'vision_analysis',
          name: 'Vision Analysis',
          description: 'Advanced image understanding',
          inputTypes: ['image'],
          outputTypes: ['text', 'json'],
          maxInputSize: 20000000,
          averageLatency: 3500
        }
      ],
      status: 'inactive', // Will be activated when integrated
      priority: 2,
      costPerToken: 0.000125,
      maxTokens: 8192,
      supportedLanguages: ['en', 'de', 'fr', 'es', 'it', 'ja', 'ko']
    });

    // Future: Google Workspace Integration
    this.registerProvider({
      id: 'google-workspace',
      name: 'Google Workspace',
      type: 'integration',
      capabilities: [
        {
          id: 'calendar_management',
          name: 'Calendar Management',
          description: 'Google Calendar integration',
          inputTypes: ['json'],
          outputTypes: ['json'],
          averageLatency: 1000
        },
        {
          id: 'gmail_automation',
          name: 'Gmail Automation',
          description: 'Email generation and sending',
          inputTypes: ['text', 'json'],
          outputTypes: ['json'],
          averageLatency: 1500
        },
        {
          id: 'drive_management',
          name: 'Drive Management',
          description: 'Google Drive file operations',
          inputTypes: ['file', 'json'],
          outputTypes: ['json'],
          averageLatency: 2000
        }
      ],
      status: 'inactive',
      priority: 3,
      supportedLanguages: ['en', 'de']
    });
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    this.capabilities.set(provider.id, provider.capabilities);
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProviders(): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => a.priority - b.priority);
  }

  getProvidersForCapability(capabilityId: string): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => 
        provider.status === 'active' &&
        provider.capabilities.some(cap => cap.id === capabilityId)
      )
      .sort((a, b) => a.priority - b.priority);
  }

  getCapabilities(providerId: string): AICapability[] {
    return this.capabilities.get(providerId) || [];
  }
}

// Main orchestrator class
export class AIAgentOrchestrator {
  private registry: AIProviderRegistry;
  private workflows: Map<string, AIWorkflow> = new Map();
  private activeRequests: Map<string, AIRequest> = new Map();

  constructor() {
    this.registry = new AIProviderRegistry();
    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows(): void {
    // Comprehensive VC Analysis Workflow
    this.registerWorkflow({
      id: 'comprehensive_vc_analysis',
      name: 'Comprehensive Visibility Check Analysis',
      description: 'Multi-step analysis combining business frameworks, content analysis, and recommendations',
      steps: [
        {
          id: 'persona_detection',
          name: 'Detect User Persona',
          type: 'persona_detection',
          inputMapping: { 'user_data': 'input.userData' },
          outputMapping: { 'persona': 'output.persona' },
          retryPolicy: { maxAttempts: 2, backoffStrategy: 'linear', baseDelay: 1000, maxDelay: 3000 }
        },
        {
          id: 'business_analysis',
          name: 'Business Framework Analysis',
          type: 'vc_analysis',
          inputMapping: { 
            'business_data': 'input.businessData',
            'persona': 'workflow.persona'
          },
          outputMapping: { 'analysis': 'output.analysis' },
          retryPolicy: { maxAttempts: 3, backoffStrategy: 'exponential', baseDelay: 1000, maxDelay: 10000 }
        },
        {
          id: 'content_recommendations',
          name: 'Generate Content Recommendations',
          type: 'content_generation',
          inputMapping: { 
            'analysis': 'workflow.analysis',
            'persona': 'workflow.persona'
          },
          outputMapping: { 'recommendations': 'output.recommendations' }
        }
      ],
      dependencies: [
        {
          stepId: 'business_analysis',
          dependsOn: ['persona_detection'],
          type: 'sequential'
        },
        {
          stepId: 'content_recommendations',
          dependsOn: ['business_analysis'],
          type: 'sequential'
        }
      ],
      fallbackStrategy: 'alternative'
    });

    // Future: Multi-channel content creation workflow
    this.registerWorkflow({
      id: 'multi_channel_content_creation',
      name: 'Multi-Channel Content Creation',
      description: 'Create and optimize content for multiple social media platforms',
      steps: [
        {
          id: 'trend_analysis',
          name: 'Analyze Current Trends',
          type: 'trend_analysis',
          inputMapping: { 'business_context': 'input.businessContext' },
          outputMapping: { 'trends': 'output.trends' }
        },
        {
          id: 'content_generation',
          name: 'Generate Base Content',
          type: 'content_generation',
          inputMapping: { 
            'trends': 'workflow.trends',
            'business_context': 'input.businessContext'
          },
          outputMapping: { 'base_content': 'output.content' }
        },
        {
          id: 'platform_optimization',
          name: 'Optimize for Each Platform',
          type: 'social_media_post',
          inputMapping: { 'base_content': 'workflow.base_content' },
          outputMapping: { 'optimized_content': 'output.platformContent' }
        }
      ],
      dependencies: [
        {
          stepId: 'content_generation',
          dependsOn: ['trend_analysis'],
          type: 'sequential'
        },
        {
          stepId: 'platform_optimization',
          dependsOn: ['content_generation'],
          type: 'sequential'
        }
      ]
    });
  }

  registerWorkflow(workflow: AIWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Execute a single AI request with provider selection and fallback
   */
  async executeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    this.activeRequests.set(request.id, request);

    try {
      // Select optimal provider
      const provider = await this.selectProvider(request);
      
      // Execute request with selected provider
      const response = await this.executeWithProvider(request, provider);
      
      // Add orchestration metadata
      response.metadata.latency = Date.now() - startTime;
      response.metadata.timestamp = new Date().toISOString();
      
      return response;
    } catch (error) {
      // Handle fallback if enabled
      if (request.preferences?.enableFallback) {
        return await this.executeFallback(request, error);
      }
      throw error;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Execute a complex workflow with multiple steps
   */
  async executeWorkflow(workflowId: string, input: any, context: AIContext): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflowData: Record<string, any> = { input };
    const executedSteps: Set<string> = new Set();
    const results: Record<string, any> = {};

    // Execute steps based on dependencies
    for (const step of workflow.steps) {
      if (await this.canExecuteStep(step, workflow.dependencies || [], executedSteps)) {
        try {
          const stepInput = this.mapStepInput(step, workflowData);
          const stepRequest: AIRequest = {
            id: `${workflowId}-${step.id}-${Date.now()}`,
            type: step.type,
            payload: stepInput,
            context,
            preferences: {
              enableFallback: true,
              maxLatency: 30000
            }
          };

          const stepResponse = await this.executeRequest(stepRequest);
          
          // Map output back to workflow data
          this.mapStepOutput(step, stepResponse.content, workflowData);
          results[step.id] = stepResponse;
          executedSteps.add(step.id);
          
        } catch (error) {
          console.error(`Step ${step.id} failed:`, error);
          
          if (workflow.fallbackStrategy === 'abort') {
            throw error;
          } else if (workflow.fallbackStrategy === 'skip') {
            console.warn(`Skipping failed step: ${step.id}`);
            executedSteps.add(step.id);
            continue;
          }
          // 'alternative' strategy would try different providers/approaches
        }
      }
    }

    return {
      workflowId,
      results,
      workflowData,
      executedSteps: Array.from(executedSteps),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Provider selection logic with intelligent fallback
   */
  private async selectProvider(request: AIRequest): Promise<AIProvider> {
    // Check user preferences first
    if (request.preferences?.preferredProviders) {
      for (const providerId of request.preferences.preferredProviders) {
        const provider = this.registry.getProvider(providerId);
        if (provider && provider.status === 'active') {
          return provider;
        }
      }
    }

    // Find providers that support the request type
    const capabilityMap: Record<AIRequestType, string> = {
      'vc_analysis': 'business_analysis',
      'content_generation': 'content_generation',
      'persona_detection': 'text_analysis',
      'text_rewrite': 'content_generation',
      'image_analysis': 'vision_analysis',
      'translation': 'text_analysis',
      'calendar_integration': 'calendar_management',
      'email_generation': 'gmail_automation',
      'social_media_post': 'content_generation',
      'competitive_analysis': 'business_analysis',
      'trend_analysis': 'text_analysis'
    };

    const requiredCapability = capabilityMap[request.type];
    const suitableProviders = this.registry.getProvidersForCapability(requiredCapability);

    if (suitableProviders.length === 0) {
      throw new Error(`No providers available for request type: ${request.type}`);
    }

    // Apply cost and latency constraints
    const filteredProviders = suitableProviders.filter(provider => {
      if (request.preferences?.maxCost && provider.costPerToken) {
        // Estimate cost based on input size (rough approximation)
        const estimatedTokens = JSON.stringify(request.payload).length / 4;
        const estimatedCost = estimatedTokens * provider.costPerToken;
        if (estimatedCost > request.preferences.maxCost) {
          return false;
        }
      }

      if (request.preferences?.maxLatency) {
        const capability = provider.capabilities.find(cap => cap.id === requiredCapability);
        if (capability?.averageLatency && capability.averageLatency > request.preferences.maxLatency) {
          return false;
        }
      }

      return true;
    });

    if (filteredProviders.length === 0) {
      throw new Error('No providers meet the specified constraints');
    }

    // Return highest priority provider
    return filteredProviders[0];
  }

  /**
   * Execute request with specific provider
   */
  private async executeWithProvider(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    switch (provider.id) {
      case 'claude-3.5-sonnet':
        return await this.executeWithClaude(request, provider);
      
      case 'gemini-pro':
        return await this.executeWithGemini(request, provider);
      
      case 'google-workspace':
        return await this.executeWithGoogleWorkspace(request, provider);
      
      default:
        throw new Error(`Provider ${provider.id} not implemented`);
    }
  }

  /**
   * Execute request with Claude via Bedrock
   */
  private async executeWithClaude(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    // Convert orchestrator request to Bedrock request
    const bedrockRequest: BedrockRequest = {
      requestType: request.type,
      templateVariables: request.payload,
      userId: request.context.userId,
      sessionId: request.context.sessionId,
      useTemplate: true
    };

    try {
      const bedrockResponse = await invokeBedrock(bedrockRequest);
      
      // Handle fallback response
      if ('fallbackReason' in bedrockResponse) {
        return {
          id: `${request.id}-fallback`,
          requestId: request.id,
          providerId: provider.id,
          content: bedrockResponse.content,
          metadata: {
            latency: 0,
            timestamp: new Date().toISOString(),
            fallbackUsed: true,
            providerChain: [provider.id, 'fallback']
          }
        };
      }

      return {
        id: `${request.id}-${bedrockResponse.requestId}`,
        requestId: request.id,
        providerId: provider.id,
        content: bedrockResponse.content,
        metadata: {
          tokenUsage: bedrockResponse.tokenUsage,
          cost: bedrockResponse.cost,
          latency: 0, // Will be set by caller
          timestamp: bedrockResponse.timestamp,
          providerChain: [provider.id]
        }
      };
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        throw new Error(`Claude provider unavailable: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Execute request with Gemini (future implementation)
   */
  private async executeWithGemini(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    // TODO: Implement Gemini integration via Opal
    throw new Error('Gemini provider not yet implemented');
  }

  /**
   * Execute request with Google Workspace (future implementation)
   */
  private async executeWithGoogleWorkspace(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    // TODO: Implement Google Workspace integration
    throw new Error('Google Workspace provider not yet implemented');
  }

  /**
   * Execute fallback strategy when primary provider fails
   */
  private async executeFallback(request: AIRequest, originalError: any): Promise<AIResponse> {
    console.warn(`Primary provider failed, attempting fallback:`, originalError);

    // Get alternative providers
    const allProviders = this.registry.getActiveProviders();
    const alternativeProviders = allProviders.filter(p => 
      p.id !== request.preferences?.preferredProviders?.[0]
    );

    for (const provider of alternativeProviders) {
      try {
        const response = await this.executeWithProvider(request, provider);
        response.metadata.fallbackUsed = true;
        response.metadata.providerChain = [
          request.preferences?.preferredProviders?.[0] || 'unknown',
          provider.id
        ];
        return response;
      } catch (fallbackError) {
        console.warn(`Fallback provider ${provider.id} also failed:`, fallbackError);
        continue;
      }
    }

    throw new Error(`All providers failed. Original error: ${originalError.message}`);
  }

  /**
   * Check if a workflow step can be executed based on dependencies
   */
  private async canExecuteStep(
    step: AIWorkflowStep, 
    dependencies: WorkflowDependency[], 
    executedSteps: Set<string>
  ): Promise<boolean> {
    const stepDependency = dependencies.find(dep => dep.stepId === step.id);
    
    if (!stepDependency) {
      return true; // No dependencies
    }

    // Check if all dependencies are satisfied
    return stepDependency.dependsOn.every(depId => executedSteps.has(depId));
  }

  /**
   * Map workflow data to step input
   */
  private mapStepInput(step: AIWorkflowStep, workflowData: Record<string, any>): any {
    const stepInput: any = {};
    
    for (const [stepKey, workflowPath] of Object.entries(step.inputMapping)) {
      const value = this.getNestedValue(workflowData, workflowPath);
      stepInput[stepKey] = value;
    }
    
    return stepInput;
  }

  /**
   * Map step output back to workflow data
   */
  private mapStepOutput(step: AIWorkflowStep, stepOutput: any, workflowData: Record<string, any>): void {
    for (const [stepKey, workflowPath] of Object.entries(step.outputMapping)) {
      const value = stepOutput[stepKey] || stepOutput;
      this.setNestedValue(workflowData, workflowPath, value);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get orchestrator status and metrics
   */
  getStatus(): {
    activeProviders: AIProvider[];
    activeRequests: number;
    workflows: string[];
    capabilities: Record<string, string[]>;
  } {
    const activeProviders = this.registry.getActiveProviders();
    const capabilities: Record<string, string[]> = {};
    
    for (const provider of activeProviders) {
      capabilities[provider.id] = provider.capabilities.map(cap => cap.id);
    }

    return {
      activeProviders,
      activeRequests: this.activeRequests.size,
      workflows: Array.from(this.workflows.keys()),
      capabilities
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new AIAgentOrchestrator();