/**
 * A/B Testing Framework for Bedrock AI Core
 * 
 * Provides comprehensive A/B testing capabilities for:
 * - Different AI model approaches (Claude vs Gemini)
 * - Prompt template variations
 * - Response formatting strategies
 * - Cost optimization experiments
 * - User experience variations
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { featureFlagManager, UserContext, ABTestConfig, ABTestVariant } from './feature-flag-manager';

export interface ABTestExperiment {
  experiment_id: string;
  name: string;
  description: string;
  hypothesis: string;
  feature_flag: string;
  variants: ABTestVariant[];
  traffic_allocation: Record<string, number>; // variant -> percentage
  success_metrics: ABTestMetric[];
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  target_sample_size?: number;
  confidence_level: number; // e.g., 0.95 for 95%
  minimum_effect_size: number; // minimum improvement to detect
}

export interface ABTestMetric {
  metric_name: string;
  metric_type: 'conversion' | 'numeric' | 'duration' | 'cost';
  primary: boolean; // is this the primary success metric?
  target_improvement: number; // expected improvement percentage
  current_baseline?: number;
}

export interface ABTestAssignment {
  user_id: string;
  experiment_id: string;
  variant: string;
  assigned_at: string;
  session_id?: string;
  user_segment?: string;
  geographic_region?: string;
}

export interface ABTestEvent {
  event_id: string;
  experiment_id: string;
  user_id: string;
  variant: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id?: string;
  request_id?: string;
}

export interface ABTestResult {
  experiment_id: string;
  variant: string;
  metric_name: string;
  sample_size: number;
  mean_value: number;
  standard_deviation: number;
  confidence_interval: [number, number];
  p_value?: number;
  statistical_significance: boolean;
  practical_significance: boolean;
  last_updated: string;
}

/**
 * A/B Testing Framework Manager
 */
export class ABTestingFramework {
  private dynamoClient: DynamoDBClient;
  private experimentsTable: string;
  private assignmentsTable: string;
  private eventsTable: string;
  private resultsTable: string;

  constructor(region: string = 'eu-central-1') {
    this.dynamoClient = new DynamoDBClient({ region });
    this.experimentsTable = process.env.AB_EXPERIMENTS_TABLE || 'bedrock-ab-experiments';
    this.assignmentsTable = process.env.AB_ASSIGNMENTS_TABLE || 'bedrock-ab-assignments';
    this.eventsTable = process.env.AB_EVENTS_TABLE || 'bedrock-ab-events';
    this.resultsTable = process.env.AB_RESULTS_TABLE || 'bedrock-ab-results';
  }

  /**
   * Create new A/B test experiment
   */
  async createExperiment(experiment: Omit<ABTestExperiment, 'experiment_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullExperiment: ABTestExperiment = {
      ...experiment,
      experiment_id: experimentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const command = new PutItemCommand({
        TableName: this.experimentsTable,
        Item: marshall(fullExperiment),
        ConditionExpression: 'attribute_not_exists(experiment_id)'
      });

      await this.dynamoClient.send(command);
      
      // Update feature flag with A/B test configuration
      await this.updateFeatureFlagForExperiment(fullExperiment);
      
      console.log(`Created A/B test experiment: ${experimentId}`);
      return experimentId;
    } catch (error) {
      console.error('Failed to create A/B test experiment:', error);
      throw error;
    }
  }

  /**
   * Get user's variant assignment for an experiment
   */
  async getUserVariant(
    experimentId: string,
    userContext: UserContext
  ): Promise<{ variant: string; isNewAssignment: boolean }> {
    const userId = userContext.userId || 'anonymous';
    
    // Check if user already has an assignment
    const existingAssignment = await this.getExistingAssignment(experimentId, userId);
    if (existingAssignment) {
      return { variant: existingAssignment.variant, isNewAssignment: false };
    }

    // Get experiment configuration
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return { variant: 'control', isNewAssignment: false };
    }

    // Assign user to variant based on traffic allocation
    const variant = this.assignUserToVariant(userId, experiment.traffic_allocation);
    
    // Record the assignment
    await this.recordAssignment({
      user_id: userId,
      experiment_id: experimentId,
      variant,
      assigned_at: new Date().toISOString(),
      session_id: userContext.sessionId,
      user_segment: userContext.userSegment,
      geographic_region: userContext.geographicRegion
    });

    return { variant, isNewAssignment: true };
  }

  /**
   * Record an event for A/B test analysis
   */
  async recordEvent(
    experimentId: string,
    userContext: UserContext,
    eventType: string,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    const userId = userContext.userId || 'anonymous';
    
    // Get user's variant assignment
    const assignment = await this.getExistingAssignment(experimentId, userId);
    if (!assignment) {
      console.warn(`No A/B test assignment found for user ${userId} in experiment ${experimentId}`);
      return;
    }

    const event: ABTestEvent = {
      event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      experiment_id: experimentId,
      user_id: userId,
      variant: assignment.variant,
      event_type: eventType,
      event_data: eventData,
      timestamp: new Date().toISOString(),
      session_id: userContext.sessionId,
      request_id: eventData.requestId
    };

    try {
      const command = new PutItemCommand({
        TableName: this.eventsTable,
        Item: marshall(event)
      });

      await this.dynamoClient.send(command);
      
      console.log(`Recorded A/B test event: ${eventType} for ${userId} in ${experimentId}/${assignment.variant}`);
    } catch (error) {
      console.error('Failed to record A/B test event:', error);
    }
  }

  /**
   * Get experiment configuration
   */
  async getExperiment(experimentId: string): Promise<ABTestExperiment | null> {
    try {
      const command = new GetItemCommand({
        TableName: this.experimentsTable,
        Key: marshall({ experiment_id: experimentId })
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      return unmarshall(response.Item) as ABTestExperiment;
    } catch (error) {
      console.error(`Failed to get experiment ${experimentId}:`, error);
      return null;
    }
  }

  /**
   * Get existing assignment for user
   */
  private async getExistingAssignment(experimentId: string, userId: string): Promise<ABTestAssignment | null> {
    try {
      const command = new GetItemCommand({
        TableName: this.assignmentsTable,
        Key: marshall({ 
          experiment_id: experimentId,
          user_id: userId 
        })
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      return unmarshall(response.Item) as ABTestAssignment;
    } catch (error) {
      console.error('Failed to get existing assignment:', error);
      return null;
    }
  }

  /**
   * Assign user to variant based on traffic allocation
   */
  private assignUserToVariant(userId: string, trafficAllocation: Record<string, number>): string {
    // Generate consistent hash for user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    
    const normalizedHash = Math.abs(hash) % 100;
    
    // Determine variant based on traffic allocation
    let cumulativePercentage = 0;
    for (const [variant, percentage] of Object.entries(trafficAllocation)) {
      cumulativePercentage += percentage;
      if (normalizedHash < cumulativePercentage) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return Object.keys(trafficAllocation)[0] || 'control';
  }

  /**
   * Record user assignment
   */
  private async recordAssignment(assignment: ABTestAssignment): Promise<void> {
    try {
      const command = new PutItemCommand({
        TableName: this.assignmentsTable,
        Item: marshall(assignment)
      });

      await this.dynamoClient.send(command);
    } catch (error) {
      console.error('Failed to record assignment:', error);
    }
  }

  /**
   * Update feature flag with A/B test configuration
   */
  private async updateFeatureFlagForExperiment(experiment: ABTestExperiment): Promise<void> {
    const abTestConfig: ABTestConfig = {
      test_name: experiment.name,
      variants: experiment.variants,
      traffic_split: experiment.traffic_allocation,
      start_date: experiment.start_date,
      end_date: experiment.end_date,
      success_metrics: experiment.success_metrics.map(m => m.metric_name),
      active: experiment.status === 'active'
    };

    await featureFlagManager.updateFlag(experiment.feature_flag, {
      ab_test_config: abTestConfig
    }, experiment.created_by);
  }

  /**
   * Calculate experiment results
   */
  async calculateResults(experimentId: string): Promise<ABTestResult[]> {
    // This would implement statistical analysis of the A/B test results
    // For now, return placeholder results
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      return [];
    }

    const results: ABTestResult[] = [];
    
    for (const variant of experiment.variants) {
      for (const metric of experiment.success_metrics) {
        // In a real implementation, this would query events and calculate statistics
        const result: ABTestResult = {
          experiment_id: experimentId,
          variant: variant.name,
          metric_name: metric.metric_name,
          sample_size: 100, // placeholder
          mean_value: Math.random() * 100, // placeholder
          standard_deviation: Math.random() * 10, // placeholder
          confidence_interval: [0, 100], // placeholder
          statistical_significance: Math.random() > 0.5,
          practical_significance: Math.random() > 0.7,
          last_updated: new Date().toISOString()
        };
        
        results.push(result);
      }
    }

    return results;
  }

  /**
   * End experiment and determine winner
   */
  async endExperiment(
    experimentId: string,
    endedBy: string,
    reason: string = 'completed'
  ): Promise<{ winner: string; results: ABTestResult[] }> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Calculate final results
    const results = await this.calculateResults(experimentId);
    
    // Determine winner (simplified logic)
    const primaryMetric = experiment.success_metrics.find(m => m.primary);
    let winner = 'control';
    
    if (primaryMetric) {
      const metricResults = results.filter(r => r.metric_name === primaryMetric.metric_name);
      winner = metricResults.reduce((best, current) => 
        current.mean_value > best.mean_value ? current : best
      ).variant;
    }

    // Update experiment status
    await this.updateExperiment(experimentId, {
      status: 'completed',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Update feature flag to use winning variant
    await featureFlagManager.updateFlag(experiment.feature_flag, {
      ab_test_config: {
        ...experiment.ab_test_config!,
        active: false
      }
    }, endedBy);

    console.log(`Experiment ${experimentId} completed. Winner: ${winner}`);
    
    return { winner, results };
  }

  /**
   * Update experiment
   */
  private async updateExperiment(
    experimentId: string,
    updates: Partial<ABTestExperiment>
  ): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    const command = new UpdateItemCommand({
      TableName: this.experimentsTable,
      Key: marshall({ experiment_id: experimentId }),
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues)
    });

    await this.dynamoClient.send(command);
  }

  /**
   * Get all active experiments
   */
  async getActiveExperiments(): Promise<ABTestExperiment[]> {
    // In a real implementation, this would query for active experiments
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get experiment summary for dashboard
   */
  async getExperimentSummary(experimentId: string): Promise<{
    experiment: ABTestExperiment | null;
    results: ABTestResult[];
    totalAssignments: number;
    variantDistribution: Record<string, number>;
  }> {
    const experiment = await this.getExperiment(experimentId);
    const results = await this.calculateResults(experimentId);
    
    // In a real implementation, these would be calculated from actual data
    const totalAssignments = 1000; // placeholder
    const variantDistribution = experiment?.variants.reduce((acc, variant) => {
      acc[variant.name] = Math.floor(Math.random() * 500);
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      experiment,
      results,
      totalAssignments,
      variantDistribution
    };
  }
}

/**
 * Singleton instance for global use
 */
export const abTestingFramework = new ABTestingFramework();

/**
 * Convenience functions for common A/B tests
 */
export class BedrockABTests {
  private static framework = abTestingFramework;

  /**
   * Create A/B test for different AI models
   */
  static async createModelComparisonTest(
    name: string,
    description: string,
    models: string[],
    trafficSplit: Record<string, number>
  ): Promise<string> {
    const variants: ABTestVariant[] = models.map((model, index) => ({
      name: model,
      description: `Using ${model} for AI processing`,
      config: { model_name: model },
      weight: Object.values(trafficSplit)[index] || 0
    }));

    const experiment: Omit<ABTestExperiment, 'experiment_id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      hypothesis: `${models[1]} will perform better than ${models[0]} for restaurant analysis`,
      feature_flag: 'ai_model_selection',
      variants,
      traffic_allocation: trafficSplit,
      success_metrics: [
        {
          metric_name: 'response_quality_score',
          metric_type: 'numeric',
          primary: true,
          target_improvement: 10
        },
        {
          metric_name: 'response_time',
          metric_type: 'duration',
          primary: false,
          target_improvement: -20 // negative for improvement (faster)
        },
        {
          metric_name: 'cost_per_request',
          metric_type: 'cost',
          primary: false,
          target_improvement: -15 // negative for improvement (cheaper)
        }
      ],
      start_date: new Date().toISOString(),
      status: 'active',
      created_by: 'system',
      confidence_level: 0.95,
      minimum_effect_size: 5
    };

    return await this.framework.createExperiment(experiment);
  }

  /**
   * Create A/B test for prompt templates
   */
  static async createPromptTemplateTest(
    name: string,
    templateVariants: Array<{ name: string; template: string }>,
    trafficSplit: Record<string, number>
  ): Promise<string> {
    const variants: ABTestVariant[] = templateVariants.map(variant => ({
      name: variant.name,
      description: `Using ${variant.name} prompt template`,
      config: { prompt_template: variant.template },
      weight: trafficSplit[variant.name] || 0
    }));

    const experiment: Omit<ABTestExperiment, 'experiment_id' | 'created_at' | 'updated_at'> = {
      name,
      description: 'Testing different prompt templates for better AI responses',
      hypothesis: 'Optimized prompt templates will improve response quality and relevance',
      feature_flag: 'prompt_template_selection',
      variants,
      traffic_allocation: trafficSplit,
      success_metrics: [
        {
          metric_name: 'user_satisfaction_score',
          metric_type: 'numeric',
          primary: true,
          target_improvement: 15
        },
        {
          metric_name: 'response_relevance_score',
          metric_type: 'numeric',
          primary: false,
          target_improvement: 10
        }
      ],
      start_date: new Date().toISOString(),
      status: 'active',
      created_by: 'system',
      confidence_level: 0.95,
      minimum_effect_size: 8
    };

    return await this.framework.createExperiment(experiment);
  }

  /**
   * Record AI response quality event
   */
  static async recordResponseQuality(
    experimentId: string,
    userContext: UserContext,
    qualityScore: number,
    responseTime: number,
    cost: number
  ): Promise<void> {
    await this.framework.recordEvent(experimentId, userContext, 'ai_response_generated', {
      quality_score: qualityScore,
      response_time_ms: responseTime,
      cost_usd: cost,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record user interaction event
   */
  static async recordUserInteraction(
    experimentId: string,
    userContext: UserContext,
    interactionType: string,
    satisfactionScore?: number
  ): Promise<void> {
    await this.framework.recordEvent(experimentId, userContext, 'user_interaction', {
      interaction_type: interactionType,
      satisfaction_score: satisfactionScore,
      timestamp: new Date().toISOString()
    });
  }
}