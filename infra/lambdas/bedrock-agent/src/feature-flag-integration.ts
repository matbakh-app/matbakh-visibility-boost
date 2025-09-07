/**
 * Feature Flag Integration Layer
 * 
 * Integrates all feature flag systems into a unified interface:
 * - Feature flag management with database integration
 * - Cost control and emergency shutdown
 * - A/B testing framework
 * - Gradual rollout system
 * - Health monitoring and circuit breaker integration
 */

import { 
  featureFlagManager, 
  BedrockFeatureFlags, 
  UserContext 
} from './feature-flag-manager';
import { costControlManager } from './cost-control-feature-flags';
import { abTestingFramework, BedrockABTests } from './ab-testing-framework';
import { gradualRolloutSystem } from './gradual-rollout-system';

export interface FeatureDecision {
  enabled: boolean;
  reason: string;
  variant?: string;
  rollout_info?: any;
  cost_info?: any;
  ab_test_info?: any;
  metadata: {
    feature_flag: string;
    user_id?: string;
    session_id?: string;
    timestamp: string;
    decision_path: string[];
  };
}

export interface RequestContext {
  requestType: string;
  estimatedCost: number;
  userContext: UserContext;
  requestId: string;
  sessionId?: string;
}

/**
 * Unified Feature Flag Integration Manager
 */
export class FeatureFlagIntegration {
  private static instance: FeatureFlagIntegration;
  
  private constructor() {}

  static getInstance(): FeatureFlagIntegration {
    if (!FeatureFlagIntegration.instance) {
      FeatureFlagIntegration.instance = new FeatureFlagIntegration();
    }
    return FeatureFlagIntegration.instance;
  }

  /**
   * Main decision engine - determines if a feature should be enabled for a user
   */
  async shouldEnableFeature(
    featureFlag: string,
    requestContext: RequestContext
  ): Promise<FeatureDecision> {
    const decisionPath: string[] = [];
    const startTime = Date.now();

    try {
      // Step 1: Check cost controls first (fail fast if over budget)
      decisionPath.push('cost_control_check');
      const costCheck = await costControlManager.shouldAllowRequest(
        requestContext.requestType,
        requestContext.estimatedCost,
        requestContext.userContext
      );

      if (!costCheck.allowed) {
        return this.createDecision({
          enabled: false,
          reason: `cost_control_blocked: ${costCheck.reason}`,
          featureFlag,
          userContext: requestContext.userContext,
          decisionPath,
          cost_info: { blocked_reason: costCheck.reason }
        });
      }

      // Step 2: Check basic feature flag status
      decisionPath.push('basic_flag_check');
      const basicFlagResult = await featureFlagManager.isFeatureEnabled(
        featureFlag,
        requestContext.userContext
      );

      if (!basicFlagResult.enabled) {
        return this.createDecision({
          enabled: false,
          reason: basicFlagResult.reason,
          featureFlag,
          userContext: requestContext.userContext,
          decisionPath
        });
      }

      // Step 3: Check gradual rollout system
      decisionPath.push('rollout_check');
      const rolloutResult = await gradualRolloutSystem.shouldUserReceiveFeature(
        featureFlag,
        requestContext.userContext
      );

      if (!rolloutResult.enabled) {
        return this.createDecision({
          enabled: false,
          reason: rolloutResult.reason,
          featureFlag,
          userContext: requestContext.userContext,
          decisionPath,
          rollout_info: rolloutResult.rollout_info
        });
      }

      // Step 4: Check A/B testing (if applicable)
      decisionPath.push('ab_test_check');
      const abTestResult = await this.checkABTestAssignment(
        featureFlag,
        requestContext.userContext
      );

      // Step 5: Record the decision and usage
      decisionPath.push('decision_recording');
      await this.recordFeatureUsage(featureFlag, requestContext, true);

      // Step 6: Update rollout metrics
      decisionPath.push('metrics_update');
      gradualRolloutSystem.updateMetrics(featureFlag, {
        total_users_enrolled: 1 // This would be properly calculated in a real implementation
      });

      const decision = this.createDecision({
        enabled: true,
        reason: 'all_checks_passed',
        variant: abTestResult.variant,
        featureFlag,
        userContext: requestContext.userContext,
        decisionPath,
        rollout_info: rolloutResult.rollout_info,
        ab_test_info: abTestResult.ab_test_info,
        cost_info: { estimated_cost: requestContext.estimatedCost }
      });

      console.log(`Feature decision for ${featureFlag}: ENABLED (${Date.now() - startTime}ms)`, {
        user_id: requestContext.userContext.userId,
        reason: decision.reason,
        variant: decision.variant
      });

      return decision;

    } catch (error) {
      decisionPath.push('error_handling');
      console.error(`Feature flag decision error for ${featureFlag}:`, error);
      
      // Fail open - allow feature if we can't make a decision
      return this.createDecision({
        enabled: true,
        reason: 'decision_error_fail_open',
        featureFlag,
        userContext: requestContext.userContext,
        decisionPath
      });
    }
  }

  /**
   * Check A/B test assignment for user
   */
  private async checkABTestAssignment(
    featureFlag: string,
    userContext: UserContext
  ): Promise<{ variant?: string; ab_test_info?: any }> {
    try {
      // Check if there's an active A/B test for this feature
      const flag = await featureFlagManager.getFlag(featureFlag);
      
      if (flag?.ab_test_config?.active) {
        const assignment = await abTestingFramework.getUserVariant(
          `${featureFlag}_ab_test`,
          userContext
        );
        
        return {
          variant: assignment.variant,
          ab_test_info: {
            experiment_id: `${featureFlag}_ab_test`,
            is_new_assignment: assignment.isNewAssignment,
            test_name: flag.ab_test_config.test_name
          }
        };
      }
      
      return {};
    } catch (error) {
      console.error('A/B test assignment error:', error);
      return {};
    }
  }

  /**
   * Record feature usage for analytics and cost tracking
   */
  private async recordFeatureUsage(
    featureFlag: string,
    requestContext: RequestContext,
    enabled: boolean
  ): Promise<void> {
    try {
      // Record cost if feature was used
      if (enabled && requestContext.estimatedCost > 0) {
        await costControlManager.recordRequestCost(
          requestContext.requestType,
          0, // Token usage would be provided separately
          requestContext.estimatedCost,
          requestContext.userContext
        );
      }

      // Record A/B test event if applicable
      const flag = await featureFlagManager.getFlag(featureFlag);
      if (flag?.ab_test_config?.active && enabled) {
        await abTestingFramework.recordEvent(
          `${featureFlag}_ab_test`,
          requestContext.userContext,
          'feature_enabled',
          {
            request_type: requestContext.requestType,
            estimated_cost: requestContext.estimatedCost,
            request_id: requestContext.requestId
          }
        );
      }

    } catch (error) {
      console.error('Failed to record feature usage:', error);
      // Don't fail the request if we can't record usage
    }
  }

  /**
   * Create standardized feature decision
   */
  private createDecision(params: {
    enabled: boolean;
    reason: string;
    featureFlag: string;
    userContext: UserContext;
    decisionPath: string[];
    variant?: string;
    rollout_info?: any;
    cost_info?: any;
    ab_test_info?: any;
  }): FeatureDecision {
    return {
      enabled: params.enabled,
      reason: params.reason,
      variant: params.variant,
      rollout_info: params.rollout_info,
      cost_info: params.cost_info,
      ab_test_info: params.ab_test_info,
      metadata: {
        feature_flag: params.featureFlag,
        user_id: params.userContext.userId,
        session_id: params.userContext.sessionId,
        timestamp: new Date().toISOString(),
        decision_path: params.decisionPath
      }
    };
  }

  /**
   * Emergency shutdown all AI features
   */
  async emergencyShutdownAll(reason: string, shutdownBy: string): Promise<void> {
    console.error(`EMERGENCY SHUTDOWN INITIATED: ${reason} by ${shutdownBy}`);
    
    try {
      // Shutdown via feature flags
      await BedrockFeatureFlags.emergencyShutdownAll(reason, shutdownBy);
      
      // Rollback all active rollouts
      await gradualRolloutSystem.rollbackStrategy('vc_bedrock_live', reason);
      await gradualRolloutSystem.rollbackStrategy('vc_bedrock_rollout_percent', reason);
      
      // End all active A/B tests
      const activeExperiments = await abTestingFramework.getActiveExperiments();
      for (const experiment of activeExperiments) {
        await abTestingFramework.endExperiment(experiment.experiment_id, shutdownBy, reason);
      }
      
      console.error(`Emergency shutdown completed: ${activeExperiments.length} experiments ended`);
      
    } catch (error) {
      console.error('Emergency shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive feature status
   */
  async getFeatureStatus(featureFlag: string): Promise<{
    basic_flag: any;
    rollout_status: any;
    cost_summary: any;
    ab_tests: any[];
  }> {
    try {
      const [basicFlag, rolloutStatus, costSummary, activeExperiments] = await Promise.all([
        featureFlagManager.getFlag(featureFlag),
        gradualRolloutSystem.getRolloutStatus(featureFlag),
        costControlManager.getCostSummary(),
        abTestingFramework.getActiveExperiments()
      ]);

      const relevantABTests = activeExperiments.filter(exp => 
        exp.feature_flag === featureFlag
      );

      return {
        basic_flag: basicFlag,
        rollout_status: rolloutStatus,
        cost_summary: costSummary,
        ab_tests: relevantABTests
      };
    } catch (error) {
      console.error(`Failed to get feature status for ${featureFlag}:`, error);
      throw error;
    }
  }

  /**
   * Health check for all feature flag systems
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    systems: Record<string, { status: string; details?: any }>;
  }> {
    const systems: Record<string, { status: string; details?: any }> = {};
    
    try {
      // Check feature flag manager
      const cacheStats = featureFlagManager.getCacheStats();
      systems.feature_flags = {
        status: 'healthy',
        details: { cache_size: cacheStats.size }
      };
    } catch (error) {
      systems.feature_flags = {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }

    try {
      // Check cost control system
      const costSummary = await costControlManager.getCostSummary();
      systems.cost_control = {
        status: 'healthy',
        details: { 
          daily_cost: costSummary.daily?.daily_cost || 0,
          alerts_count: costSummary.alerts.length 
        }
      };
    } catch (error) {
      systems.cost_control = {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }

    try {
      // Check A/B testing system
      const activeExperiments = await abTestingFramework.getActiveExperiments();
      systems.ab_testing = {
        status: 'healthy',
        details: { active_experiments: activeExperiments.length }
      };
    } catch (error) {
      systems.ab_testing = {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }

    // Check rollout system
    const bedrockRolloutStatus = gradualRolloutSystem.getRolloutStatus('vc_bedrock_live');
    systems.rollout_system = {
      status: bedrockRolloutStatus.strategy ? 'healthy' : 'degraded',
      details: { 
        bedrock_status: bedrockRolloutStatus.status,
        current_percentage: bedrockRolloutStatus.metrics?.current_percentage || 0
      }
    };

    // Determine overall status
    const systemStatuses = Object.values(systems).map(s => s.status);
    const overallStatus = systemStatuses.includes('unhealthy') ? 'unhealthy' :
                         systemStatuses.includes('degraded') ? 'degraded' : 'healthy';

    return { status: overallStatus, systems };
  }
}

/**
 * Singleton instance for global use
 */
export const featureFlagIntegration = FeatureFlagIntegration.getInstance();

/**
 * Convenience functions for common operations
 */
export class BedrockFeatureIntegration {
  private static integration = featureFlagIntegration;

  /**
   * Check if Bedrock should be enabled for a request
   */
  static async shouldEnableBedrock(requestContext: RequestContext): Promise<FeatureDecision> {
    return await this.integration.shouldEnableFeature('vc_bedrock_live', requestContext);
  }

  /**
   * Check if user is in Bedrock rollout
   */
  static async isInBedrockRollout(userContext: UserContext): Promise<FeatureDecision> {
    const requestContext: RequestContext = {
      requestType: 'rollout_check',
      estimatedCost: 0,
      userContext,
      requestId: `rollout_check_${Date.now()}`
    };
    
    return await this.integration.shouldEnableFeature('vc_bedrock_rollout_percent', requestContext);
  }

  /**
   * Record successful AI operation
   */
  static async recordAISuccess(
    requestContext: RequestContext,
    responseTime: number,
    actualCost: number,
    qualityScore?: number
  ): Promise<void> {
    try {
      // Update cost tracking
      await costControlManager.recordRequestCost(
        requestContext.requestType,
        0, // Token usage would be calculated separately
        actualCost,
        requestContext.userContext
      );

      // Update rollout metrics
      gradualRolloutSystem.updateMetrics('vc_bedrock_live', {
        success_rate: 100, // This would be calculated properly
        average_response_time: responseTime,
        total_cost: actualCost,
        user_satisfaction_score: qualityScore || 80
      });

      // Record A/B test metrics if applicable
      const flag = await featureFlagManager.getFlag('vc_bedrock_live');
      if (flag?.ab_test_config?.active) {
        await BedrockABTests.recordResponseQuality(
          'vc_bedrock_live_ab_test',
          requestContext.userContext,
          qualityScore || 80,
          responseTime,
          actualCost
        );
      }

    } catch (error) {
      console.error('Failed to record AI success metrics:', error);
    }
  }

  /**
   * Record AI operation failure
   */
  static async recordAIFailure(
    requestContext: RequestContext,
    errorType: string,
    errorMessage: string
  ): Promise<void> {
    try {
      // Update rollout metrics
      gradualRolloutSystem.updateMetrics('vc_bedrock_live', {
        error_rate: 10, // This would be calculated properly
        success_rate: 90
      });

      // Record A/B test event
      const flag = await featureFlagManager.getFlag('vc_bedrock_live');
      if (flag?.ab_test_config?.active) {
        await abTestingFramework.recordEvent(
          'vc_bedrock_live_ab_test',
          requestContext.userContext,
          'ai_error',
          {
            error_type: errorType,
            error_message: errorMessage,
            request_type: requestContext.requestType
          }
        );
      }

    } catch (error) {
      console.error('Failed to record AI failure metrics:', error);
    }
  }

  /**
   * Emergency shutdown with comprehensive logging
   */
  static async emergencyShutdown(reason: string, shutdownBy: string = 'system'): Promise<void> {
    console.error(`BEDROCK EMERGENCY SHUTDOWN: ${reason}`);
    await this.integration.emergencyShutdownAll(reason, shutdownBy);
  }
}