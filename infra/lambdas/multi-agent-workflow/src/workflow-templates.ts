/**
 * Workflow Templates - Pre-defined workflow templates for common business scenarios
 * Provides ready-to-use workflow definitions for typical restaurant business tasks
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowDefinition,
  WorkflowStep,
  AgentDefinition,
  DecisionTree,
  DecisionNode,
  WorkflowCategory,
  StepType,
  AgentType
} from './types';

export class WorkflowTemplateManager {
  private templates: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Get all available workflow templates
   */
  getTemplates(): WorkflowDefinition[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WorkflowDefinition | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: WorkflowCategory): WorkflowDefinition[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Create workflow instance from template
   */
  createWorkflowFromTemplate(
    templateId: string,
    customizations?: Partial<WorkflowDefinition>
  ): WorkflowDefinition {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Deep clone template
    const workflow = JSON.parse(JSON.stringify(template));
    
    // Apply customizations
    if (customizations) {
      Object.assign(workflow, customizations);
    }

    // Generate new IDs
    workflow.id = uuidv4();
    workflow.createdAt = new Date();
    workflow.updatedAt = new Date();

    return workflow;
  }

  /**
   * Register a new template
   */
  registerTemplate(template: WorkflowDefinition): void {
    this.templates.set(template.id, template);
  }

  // Private methods

  private initializeDefaultTemplates(): void {
    // Business Analysis Workflow
    this.registerTemplate(this.createBusinessAnalysisWorkflow());
    
    // Content Generation Workflow
    this.registerTemplate(this.createContentGenerationWorkflow());
    
    // Customer Support Workflow
    this.registerTemplate(this.createCustomerSupportWorkflow());
    
    // Quality Assurance Workflow
    this.registerTemplate(this.createQualityAssuranceWorkflow());
    
    // Competitive Analysis Workflow
    this.registerTemplate(this.createCompetitiveAnalysisWorkflow());
    
    // Multi-Location Management Workflow
    this.registerTemplate(this.createMultiLocationWorkflow());
  }

  private createBusinessAnalysisWorkflow(): WorkflowDefinition {
    const workflowId = 'business-analysis-template';
    
    const agents: AgentDefinition[] = [
      {
        id: 'data-analyst',
        name: 'Business Data Analyst',
        type: 'analysis_agent',
        specialization: {
          domain: 'restaurant_analysis',
          expertise: ['data_analysis', 'metrics_calculation', 'trend_identification'],
          languages: ['en', 'de'],
          outputFormats: ['json', 'csv'],
          qualityThresholds: [
            { metric: 'accuracy', minValue: 0.85, target: 0.95, weight: 0.4 },
            { metric: 'completeness', minValue: 0.9, target: 0.98, weight: 0.3 },
            { metric: 'relevance', minValue: 0.8, target: 0.9, weight: 0.3 }
          ]
        },
        capabilities: [
          {
            name: 'business_metrics_analysis',
            type: 'data_extraction',
            inputTypes: ['json', 'csv'],
            outputTypes: ['json'],
            processingTime: 5000,
            accuracy: 0.92,
            costPerOperation: 0.05
          }
        ],
        configuration: {
          aiProvider: 'claude',
          model: 'claude-3-5-sonnet',
          temperature: 0.3,
          maxTokens: 4000,
          systemPrompt: 'You are a business analyst specializing in restaurant performance analysis.',
          contextWindow: 8000,
          responseFormat: 'json',
          safetySettings: {
            contentFiltering: true,
            biasDetection: true,
            factualityCheck: true,
            toxicityThreshold: 0.1,
            privacyProtection: true
          }
        },
        memoryConfig: {
          enabled: true,
          retentionPeriod: 30,
          contextTypes: ['business_analysis', 'user_profile'],
          sharingPolicy: {
            allowCrossAgent: true,
            allowCrossWorkflow: false,
            sharedContextTypes: ['business_analysis'],
            isolatedContextTypes: ['user_profile']
          },
          compressionEnabled: true
        },
        communicationProtocols: [
          {
            type: 'direct',
            format: 'json',
            encryption: false,
            compression: true,
            acknowledgment: true
          }
        ],
        performanceMetrics: {
          averageResponseTime: 5000,
          successRate: 0.95,
          qualityScore: 0.9,
          costEfficiency: 18,
          collaborationScore: 0.85,
          lastUpdated: new Date()
        }
      },
      {
        id: 'insight-generator',
        name: 'Business Insight Generator',
        type: 'recommendation_agent',
        specialization: {
          domain: 'business_insights',
          expertise: ['pattern_recognition', 'recommendation_generation', 'strategic_planning'],
          languages: ['en', 'de'],
          outputFormats: ['json', 'markdown'],
          qualityThresholds: [
            { metric: 'actionability', minValue: 0.8, target: 0.9, weight: 0.5 },
            { metric: 'relevance', minValue: 0.85, target: 0.95, weight: 0.3 },
            { metric: 'clarity', minValue: 0.8, target: 0.9, weight: 0.2 }
          ]
        },
        capabilities: [
          {
            name: 'insight_generation',
            type: 'decision_making',
            inputTypes: ['json'],
            outputTypes: ['json', 'markdown'],
            processingTime: 7000,
            accuracy: 0.88,
            costPerOperation: 0.08
          }
        ],
        configuration: {
          aiProvider: 'claude',
          model: 'claude-3-5-sonnet',
          temperature: 0.7,
          maxTokens: 6000,
          systemPrompt: 'You are a business strategist who generates actionable insights from restaurant data.',
          contextWindow: 12000,
          responseFormat: 'json',
          safetySettings: {
            contentFiltering: true,
            biasDetection: true,
            factualityCheck: true,
            toxicityThreshold: 0.1,
            privacyProtection: true
          }
        },
        memoryConfig: {
          enabled: true,
          retentionPeriod: 60,
          contextTypes: ['business_analysis', 'learning_insights'],
          sharingPolicy: {
            allowCrossAgent: true,
            allowCrossWorkflow: true,
            sharedContextTypes: ['learning_insights'],
            isolatedContextTypes: ['business_analysis']
          },
          compressionEnabled: true
        },
        communicationProtocols: [
          {
            type: 'direct',
            format: 'json',
            encryption: false,
            compression: true,
            acknowledgment: true
          }
        ],
        performanceMetrics: {
          averageResponseTime: 7000,
          successRate: 0.92,
          qualityScore: 0.88,
          costEfficiency: 11,
          collaborationScore: 0.9,
          lastUpdated: new Date()
        }
      }
    ];

    const steps: WorkflowStep[] = [
      {
        id: 'collect-business-data',
        name: 'Collect Business Data',
        type: 'analysis',
        agentId: 'data-analyst',
        inputs: [
          {
            name: 'business_id',
            type: 'string',
            source: { type: 'workflow_input', reference: 'business_id' },
            required: true
          },
          {
            name: 'analysis_period',
            type: 'object',
            source: { type: 'workflow_input', reference: 'analysis_period' },
            required: true
          }
        ],
        outputs: [
          {
            name: 'business_metrics',
            type: 'object',
            destination: { type: 'step_input', reference: 'generate-insights' }
          },
          {
            name: 'performance_data',
            type: 'object',
            destination: { type: 'workflow_output', reference: 'raw_data' }
          }
        ],
        conditions: [
          {
            type: 'success',
            expression: 'business_metrics && business_metrics.completeness > 0.8',
            action: { type: 'continue' }
          },
          {
            type: 'failure',
            expression: 'true',
            action: { type: 'retry' }
          }
        ],
        timeout: 30,
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'exponential',
          baseDelay: 2000,
          maxDelay: 10000,
          retryableErrors: ['TimeoutError', 'DataSourceError']
        },
        dependencies: [],
        parallelExecution: false,
        metadata: {
          description: 'Collect and analyze business performance data',
          estimatedDuration: 15
        }
      },
      {
        id: 'generate-insights',
        name: 'Generate Business Insights',
        type: 'generation',
        agentId: 'insight-generator',
        inputs: [
          {
            name: 'business_metrics',
            type: 'object',
            source: { type: 'step_output', reference: 'collect-business-data', path: 'business_metrics' },
            required: true
          },
          {
            name: 'business_context',
            type: 'object',
            source: { type: 'workflow_input', reference: 'business_context' },
            required: false
          }
        ],
        outputs: [
          {
            name: 'insights',
            type: 'array',
            destination: { type: 'workflow_output', reference: 'insights' }
          },
          {
            name: 'recommendations',
            type: 'array',
            destination: { type: 'workflow_output', reference: 'recommendations' }
          }
        ],
        conditions: [
          {
            type: 'success',
            expression: 'insights && insights.length >= 3',
            action: { type: 'continue' }
          }
        ],
        timeout: 45,
        retryPolicy: {
          maxAttempts: 2,
          backoffStrategy: 'linear',
          baseDelay: 3000,
          maxDelay: 15000,
          retryableErrors: ['GenerationError']
        },
        dependencies: ['collect-business-data'],
        parallelExecution: false,
        metadata: {
          description: 'Generate actionable business insights and recommendations',
          estimatedDuration: 25
        }
      }
    ];

    const decisionTree: DecisionTree = {
      id: 'quality-gate',
      name: 'Analysis Quality Gate',
      rootNode: {
        id: 'check-data-quality',
        type: 'condition',
        condition: 'business_metrics.completeness >= 0.8 && business_metrics.accuracy >= 0.85',
        trueNode: 'proceed-to-insights',
        falseNode: 'request-more-data'
      },
      variables: [
        {
          name: 'completeness',
          type: 'number',
          source: 'stepOutputs.collect-business-data.business_metrics.completeness'
        },
        {
          name: 'accuracy',
          type: 'number',
          source: 'stepOutputs.collect-business-data.business_metrics.accuracy'
        }
      ],
      outcomes: [
        {
          id: 'proceed-to-insights',
          name: 'Proceed to Insight Generation',
          description: 'Data quality is sufficient for insight generation',
          actions: [
            {
              type: 'modify_workflow',
              parameters: { action: 'continue', target: 'generate-insights' }
            }
          ]
        },
        {
          id: 'request-more-data',
          name: 'Request Additional Data',
          description: 'Data quality is insufficient, request more data',
          actions: [
            {
              type: 'modify_workflow',
              parameters: { action: 'retry', target: 'collect-business-data' }
            }
          ]
        }
      ]
    };

    return {
      id: workflowId,
      name: 'Business Analysis Workflow',
      description: 'Comprehensive business performance analysis with insights generation',
      version: '1.0.0',
      category: 'business_analysis',
      steps,
      agents,
      decisionTrees: [decisionTree],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['business', 'analysis', 'insights', 'restaurant'],
        businessDomain: 'restaurant_management',
        complexity: 'moderate',
        estimatedDuration: 40,
        costEstimate: 0.25,
        successRate: 0.92,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createContentGenerationWorkflow(): WorkflowDefinition {
    const workflowId = 'content-generation-template';
    
    const agents: AgentDefinition[] = [
      {
        id: 'content-strategist',
        name: 'Content Strategy Agent',
        type: 'content_agent',
        specialization: {
          domain: 'content_strategy',
          expertise: ['content_planning', 'audience_analysis', 'brand_voice'],
          languages: ['en', 'de'],
          outputFormats: ['json', 'markdown'],
          qualityThresholds: [
            { metric: 'brand_alignment', minValue: 0.85, target: 0.95, weight: 0.4 },
            { metric: 'engagement_potential', minValue: 0.8, target: 0.9, weight: 0.3 },
            { metric: 'originality', minValue: 0.75, target: 0.85, weight: 0.3 }
          ]
        },
        capabilities: [
          {
            name: 'content_strategy',
            type: 'content_generation',
            inputTypes: ['json'],
            outputTypes: ['json', 'markdown'],
            processingTime: 8000,
            accuracy: 0.87,
            costPerOperation: 0.12
          }
        ],
        configuration: {
          aiProvider: 'claude',
          model: 'claude-3-5-sonnet',
          temperature: 0.8,
          maxTokens: 8000,
          systemPrompt: 'You are a content strategist specializing in restaurant marketing and social media.',
          contextWindow: 16000,
          responseFormat: 'json',
          safetySettings: {
            contentFiltering: true,
            biasDetection: true,
            factualityCheck: false,
            toxicityThreshold: 0.2,
            privacyProtection: true
          }
        },
        memoryConfig: {
          enabled: true,
          retentionPeriod: 90,
          contextTypes: ['conversation', 'business_analysis'],
          sharingPolicy: {
            allowCrossAgent: true,
            allowCrossWorkflow: false,
            sharedContextTypes: ['business_analysis'],
            isolatedContextTypes: ['conversation']
          },
          compressionEnabled: true
        },
        communicationProtocols: [
          {
            type: 'direct',
            format: 'json',
            encryption: false,
            compression: true,
            acknowledgment: true
          }
        ],
        performanceMetrics: {
          averageResponseTime: 8000,
          successRate: 0.89,
          qualityScore: 0.87,
          costEfficiency: 7.25,
          collaborationScore: 0.82,
          lastUpdated: new Date()
        }
      },
      {
        id: 'content-creator',
        name: 'Content Creation Agent',
        type: 'content_agent',
        specialization: {
          domain: 'content_creation',
          expertise: ['copywriting', 'social_media', 'visual_content'],
          languages: ['en', 'de'],
          outputFormats: ['text', 'html', 'markdown'],
          qualityThresholds: [
            { metric: 'readability', minValue: 0.8, target: 0.9, weight: 0.3 },
            { metric: 'engagement', minValue: 0.75, target: 0.85, weight: 0.4 },
            { metric: 'brand_consistency', minValue: 0.85, target: 0.95, weight: 0.3 }
          ]
        },
        capabilities: [
          {
            name: 'content_creation',
            type: 'content_generation',
            inputTypes: ['json', 'text'],
            outputTypes: ['text', 'html', 'markdown'],
            processingTime: 10000,
            accuracy: 0.85,
            costPerOperation: 0.15
          }
        ],
        configuration: {
          aiProvider: 'claude',
          model: 'claude-3-5-sonnet',
          temperature: 0.9,
          maxTokens: 6000,
          systemPrompt: 'You are a creative content writer specializing in restaurant marketing content.',
          contextWindow: 12000,
          responseFormat: 'text',
          safetySettings: {
            contentFiltering: true,
            biasDetection: false,
            factualityCheck: false,
            toxicityThreshold: 0.3,
            privacyProtection: true
          }
        },
        memoryConfig: {
          enabled: true,
          retentionPeriod: 60,
          contextTypes: ['conversation', 'learning_insights'],
          sharingPolicy: {
            allowCrossAgent: true,
            allowCrossWorkflow: true,
            sharedContextTypes: ['learning_insights'],
            isolatedContextTypes: ['conversation']
          },
          compressionEnabled: true
        },
        communicationProtocols: [
          {
            type: 'direct',
            format: 'json',
            encryption: false,
            compression: true,
            acknowledgment: true
          }
        ],
        performanceMetrics: {
          averageResponseTime: 10000,
          successRate: 0.91,
          qualityScore: 0.85,
          costEfficiency: 5.67,
          collaborationScore: 0.88,
          lastUpdated: new Date()
        }
      }
    ];

    const steps: WorkflowStep[] = [
      {
        id: 'develop-content-strategy',
        name: 'Develop Content Strategy',
        type: 'analysis',
        agentId: 'content-strategist',
        inputs: [
          {
            name: 'business_profile',
            type: 'object',
            source: { type: 'workflow_input', reference: 'business_profile' },
            required: true
          },
          {
            name: 'target_audience',
            type: 'object',
            source: { type: 'workflow_input', reference: 'target_audience' },
            required: true
          },
          {
            name: 'content_goals',
            type: 'array',
            source: { type: 'workflow_input', reference: 'content_goals' },
            required: true
          }
        ],
        outputs: [
          {
            name: 'content_strategy',
            type: 'object',
            destination: { type: 'step_input', reference: 'create-content' }
          },
          {
            name: 'brand_guidelines',
            type: 'object',
            destination: { type: 'step_input', reference: 'create-content' }
          }
        ],
        conditions: [
          {
            type: 'success',
            expression: 'content_strategy && content_strategy.themes && content_strategy.themes.length >= 3',
            action: { type: 'continue' }
          }
        ],
        timeout: 60,
        retryPolicy: {
          maxAttempts: 2,
          backoffStrategy: 'exponential',
          baseDelay: 5000,
          maxDelay: 20000,
          retryableErrors: ['StrategyGenerationError']
        },
        dependencies: [],
        parallelExecution: false,
        metadata: {
          description: 'Develop comprehensive content strategy based on business profile and goals',
          estimatedDuration: 30
        }
      },
      {
        id: 'create-content',
        name: 'Create Content',
        type: 'generation',
        agentId: 'content-creator',
        inputs: [
          {
            name: 'content_strategy',
            type: 'object',
            source: { type: 'step_output', reference: 'develop-content-strategy', path: 'content_strategy' },
            required: true
          },
          {
            name: 'brand_guidelines',
            type: 'object',
            source: { type: 'step_output', reference: 'develop-content-strategy', path: 'brand_guidelines' },
            required: true
          },
          {
            name: 'content_count',
            type: 'number',
            source: { type: 'workflow_input', reference: 'content_count' },
            required: false
          }
        ],
        outputs: [
          {
            name: 'generated_content',
            type: 'array',
            destination: { type: 'workflow_output', reference: 'content' }
          },
          {
            name: 'content_metadata',
            type: 'object',
            destination: { type: 'workflow_output', reference: 'metadata' }
          }
        ],
        conditions: [
          {
            type: 'success',
            expression: 'generated_content && generated_content.length > 0',
            action: { type: 'continue' }
          }
        ],
        timeout: 90,
        retryPolicy: {
          maxAttempts: 3,
          backoffStrategy: 'linear',
          baseDelay: 10000,
          maxDelay: 30000,
          retryableErrors: ['ContentGenerationError', 'QualityError']
        },
        dependencies: ['develop-content-strategy'],
        parallelExecution: false,
        metadata: {
          description: 'Generate content based on strategy and brand guidelines',
          estimatedDuration: 45
        }
      }
    ];

    return {
      id: workflowId,
      name: 'Content Generation Workflow',
      description: 'Strategic content creation workflow for restaurant marketing',
      version: '1.0.0',
      category: 'content_generation',
      steps,
      agents,
      decisionTrees: [],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['content', 'marketing', 'social_media', 'restaurant'],
        businessDomain: 'restaurant_marketing',
        complexity: 'moderate',
        estimatedDuration: 75,
        costEstimate: 0.35,
        successRate: 0.88,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createCustomerSupportWorkflow(): WorkflowDefinition {
    // Implementation for customer support workflow
    return {
      id: 'customer-support-template',
      name: 'Customer Support Workflow',
      description: 'Automated customer support with escalation handling',
      version: '1.0.0',
      category: 'customer_support',
      steps: [],
      agents: [],
      decisionTrees: [],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['support', 'customer', 'automation'],
        businessDomain: 'customer_service',
        complexity: 'simple',
        estimatedDuration: 20,
        costEstimate: 0.15,
        successRate: 0.94,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createQualityAssuranceWorkflow(): WorkflowDefinition {
    // Implementation for QA workflow
    return {
      id: 'quality-assurance-template',
      name: 'Quality Assurance Workflow',
      description: 'Multi-stage quality validation and improvement workflow',
      version: '1.0.0',
      category: 'quality_assurance',
      steps: [],
      agents: [],
      decisionTrees: [],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['quality', 'validation', 'improvement'],
        businessDomain: 'quality_management',
        complexity: 'complex',
        estimatedDuration: 60,
        costEstimate: 0.40,
        successRate: 0.96,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createCompetitiveAnalysisWorkflow(): WorkflowDefinition {
    // Implementation for competitive analysis workflow
    return {
      id: 'competitive-analysis-template',
      name: 'Competitive Analysis Workflow',
      description: 'Comprehensive competitive intelligence and benchmarking',
      version: '1.0.0',
      category: 'research_analysis',
      steps: [],
      agents: [],
      decisionTrees: [],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['competitive', 'analysis', 'benchmarking', 'intelligence'],
        businessDomain: 'competitive_intelligence',
        complexity: 'expert',
        estimatedDuration: 120,
        costEstimate: 0.60,
        successRate: 0.85,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createMultiLocationWorkflow(): WorkflowDefinition {
    // Implementation for multi-location management workflow
    return {
      id: 'multi-location-template',
      name: 'Multi-Location Management Workflow',
      description: 'Coordinated analysis and management across multiple restaurant locations',
      version: '1.0.0',
      category: 'business_analysis',
      steps: [],
      agents: [],
      decisionTrees: [],
      metadata: {
        author: 'Matbakh AI Team',
        tags: ['multi-location', 'management', 'coordination', 'enterprise'],
        businessDomain: 'enterprise_management',
        complexity: 'expert',
        estimatedDuration: 180,
        costEstimate: 1.20,
        successRate: 0.82,
        usageCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}