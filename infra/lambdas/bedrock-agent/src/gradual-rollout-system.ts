/**
 * Gradual Rollout System for Bedrock AI Features
 * 
 * Provides sophisticated rollout capabilities including:
 * - Percentage-based rollouts with consistent user assignment
 * - Geographic and demographic targeting
 * - Time-based rollouts and scheduling
 * - Canary deployments with automatic rollback
 * - Health monitoring and circuit breaker integration
 */

import { featureFlagManager, UserContext } from './feature-flag-manager';
import { costControlManager } from './cost-control-feature-flags';

export interface RolloutStrategy {
  strategy_name: string;
  feature_flag: string;
  rollout_type: 'percentage' | 'geographic' | 'demographic' | 'time_based' | 'canary';
  configuration: RolloutConfiguration;
  health_checks: HealthCheck[];
  rollback_conditions: RollbackCondition[];
  created_by: string;
  created_at: string;
  status: 'active' | 'paused' | 'completed' | 'rolled_back';
}

export interface RolloutConfiguration {
  // Percentage rollout
  percentage?: number;
  increment_percentage?: number;
  increment_interval_hours?: number;
  
  // Geographic rollout
  target_regions?: string[];
  exclude_regions?: string[];
  
  // Demographic rollout
  target_user_segments?: string[];
  exclude_user_segments?: string[];
  
  // Time-based rollout
  start_time?: string;
  end_time?: string;
  timezone?: string;
  days_of_week?: number[];
  
  // Canary rollout
  canary_percentage?: number;
  canary_duration_hours?: number;
  promotion_criteria?: PromotionCriteria;
}

export interface HealthCheck {
  check_name: string;
  check_type: 'error_rate' | 'response_time' | 'cost' | 'user_satisfaction' | 'custom';
  threshold: number;
  comparison: 'less_than' | 'greater_than' | 'equals';
  window_minutes: number;
  enabled: boolean;
}

export interface RollbackCondition {
  condition_name: string;
  trigger_type: 'health_check_failure' | 'cost_threshold' | 'manual' | 'time_based';
  parameters: Record<string, any>;
  action: 'pause' | 'rollback' | 'alert';
  enabled: boolean;
}

export interface PromotionCriteria {
  min_success_rate: number;
  max_error_rate: number;
  max_response_time_ms: number;
  min_user_satisfaction: number;
  min_sample_size: number;
}

export interface RolloutMetrics {
  feature_flag: string;
  current_percentage: number;
  total_users_eligible: number;
  total_users_enrolled: number;
  success_rate: number;
  error_rate: number;
  average_response_time: number;
  total_cost: number;
  user_satisfaction_score: number;
  last_updated: string;
}

/**
 * Gradual Rollout System Manager
 */
export class GradualRolloutSystem {
  private rolloutStrategies: Map<string, RolloutStrategy> = new Map();
  private rolloutMetrics: Map<string, RolloutMetrics> = new Map();
  private rolloutTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialize with default rollout strategies
    this.initializeDefaultStrategies();
  }

  /**
   * Create new rollout strategy
   */
  async createRolloutStrategy(strategy: Omit<RolloutStrategy, 'created_at' | 'status'>): Promise<void> {
    const fullStrategy: RolloutStrategy = {
      ...strategy,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    this.rolloutStrategies.set(strategy.feature_flag, fullStrategy);
    
    // Start rollout execution
    await this.executeRolloutStrategy(fullStrategy);
    
    console.log(`Created rollout strategy for ${strategy.feature_flag}: ${strategy.strategy_name}`);
  }

  /**
   * Check if user should receive feature based on rollout strategy
   */
  async shouldUserReceiveFeature(
    featureFlag: string,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const strategy = this.rolloutStrategies.get(featureFlag);
    
    if (!strategy || strategy.status !== 'active') {
      // Fall back to basic feature flag check
      const flagResult = await featureFlagManager.isFeatureEnabled(featureFlag, userContext);
      return { enabled: flagResult.enabled, reason: flagResult.reason };
    }

    // Check rollout conditions based on strategy type
    switch (strategy.rollout_type) {
      case 'percentage':
        return await this.checkPercentageRollout(strategy, userContext);
      
      case 'geographic':
        return await this.checkGeographicRollout(strategy, userContext);
      
      case 'demographic':
        return await this.checkDemographicRollout(strategy, userContext);
      
      case 'time_based':
        return await this.checkTimeBasedRollout(strategy, userContext);
      
      case 'canary':
        return await this.checkCanaryRollout(strategy, userContext);
      
      default:
        return { enabled: false, reason: 'unknown_rollout_type' };
    }
  }

  /**
   * Check percentage-based rollout
   */
  private async checkPercentageRollout(
    strategy: RolloutStrategy,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const config = strategy.configuration;
    const currentPercentage = config.percentage || 0;
    
    if (currentPercentage <= 0) {
      return { enabled: false, reason: 'rollout_not_started' };
    }

    if (currentPercentage >= 100) {
      return { enabled: true, reason: 'full_rollout' };
    }

    // Check if user is in the rollout percentage
    const userId = userContext.userId || 'anonymous';
    const isInRollout = this.isUserInPercentage(userId, currentPercentage);
    
    if (!isInRollout) {
      return { 
        enabled: false, 
        reason: 'not_in_rollout_percentage',
        rollout_info: { current_percentage: currentPercentage }
      };
    }

    // Check health conditions
    const healthCheck = await this.checkHealthConditions(strategy);
    if (!healthCheck.healthy) {
      return { 
        enabled: false, 
        reason: 'health_check_failed',
        rollout_info: { health_issue: healthCheck.reason }
      };
    }

    return { 
      enabled: true, 
      reason: 'in_rollout_percentage',
      rollout_info: { current_percentage: currentPercentage }
    };
  }

  /**
   * Check geographic rollout
   */
  private async checkGeographicRollout(
    strategy: RolloutStrategy,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const config = strategy.configuration;
    const userRegion = userContext.geographicRegion;

    if (!userRegion) {
      return { enabled: false, reason: 'no_geographic_data' };
    }

    // Check if region is excluded
    if (config.exclude_regions?.includes(userRegion)) {
      return { 
        enabled: false, 
        reason: 'region_excluded',
        rollout_info: { user_region: userRegion, excluded_regions: config.exclude_regions }
      };
    }

    // Check if region is in target list
    if (config.target_regions && !config.target_regions.includes(userRegion)) {
      return { 
        enabled: false, 
        reason: 'region_not_targeted',
        rollout_info: { user_region: userRegion, target_regions: config.target_regions }
      };
    }

    return { 
      enabled: true, 
      reason: 'geographic_match',
      rollout_info: { user_region: userRegion }
    };
  }

  /**
   * Check demographic rollout
   */
  private async checkDemographicRollout(
    strategy: RolloutStrategy,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const config = strategy.configuration;
    const userSegment = userContext.userSegment;

    if (!userSegment) {
      return { enabled: false, reason: 'no_demographic_data' };
    }

    // Check if segment is excluded
    if (config.exclude_user_segments?.includes(userSegment)) {
      return { 
        enabled: false, 
        reason: 'segment_excluded',
        rollout_info: { user_segment: userSegment }
      };
    }

    // Check if segment is in target list
    if (config.target_user_segments && !config.target_user_segments.includes(userSegment)) {
      return { 
        enabled: false, 
        reason: 'segment_not_targeted',
        rollout_info: { user_segment: userSegment, target_segments: config.target_user_segments }
      };
    }

    return { 
      enabled: true, 
      reason: 'demographic_match',
      rollout_info: { user_segment: userSegment }
    };
  }

  /**
   * Check time-based rollout
   */
  private async checkTimeBasedRollout(
    strategy: RolloutStrategy,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const config = strategy.configuration;
    const now = new Date();
    const userTimezone = userContext.timezone || 'UTC';

    // Check if current time is within rollout window
    if (config.start_time && config.end_time) {
      const startTime = new Date(config.start_time);
      const endTime = new Date(config.end_time);
      
      if (now < startTime) {
        return { 
          enabled: false, 
          reason: 'rollout_not_started',
          rollout_info: { start_time: config.start_time }
        };
      }
      
      if (now > endTime) {
        return { 
          enabled: false, 
          reason: 'rollout_ended',
          rollout_info: { end_time: config.end_time }
        };
      }
    }

    // Check day of week restrictions
    if (config.days_of_week && config.days_of_week.length > 0) {
      const currentDay = now.getDay(); // 0 = Sunday
      if (!config.days_of_week.includes(currentDay)) {
        return { 
          enabled: false, 
          reason: 'day_not_allowed',
          rollout_info: { current_day: currentDay, allowed_days: config.days_of_week }
        };
      }
    }

    return { 
      enabled: true, 
      reason: 'time_window_active',
      rollout_info: { current_time: now.toISOString() }
    };
  }

  /**
   * Check canary rollout
   */
  private async checkCanaryRollout(
    strategy: RolloutStrategy,
    userContext: UserContext
  ): Promise<{ enabled: boolean; reason: string; rollout_info?: any }> {
    const config = strategy.configuration;
    const canaryPercentage = config.canary_percentage || 5;
    
    // Check if user is in canary group
    const userId = userContext.userId || 'anonymous';
    const isInCanary = this.isUserInPercentage(userId, canaryPercentage);
    
    if (!isInCanary) {
      return { 
        enabled: false, 
        reason: 'not_in_canary',
        rollout_info: { canary_percentage: canaryPercentage }
      };
    }

    // Check canary health
    const healthCheck = await this.checkHealthConditions(strategy);
    if (!healthCheck.healthy) {
      // Automatically rollback canary if health checks fail
      await this.rollbackStrategy(strategy.feature_flag, 'canary_health_failure');
      return { 
        enabled: false, 
        reason: 'canary_rolled_back',
        rollout_info: { health_issue: healthCheck.reason }
      };
    }

    return { 
      enabled: true, 
      reason: 'canary_active',
      rollout_info: { canary_percentage: canaryPercentage }
    };
  }

  /**
   * Check if user is in percentage rollout
   */
  private isUserInPercentage(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    // Generate consistent hash for user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    
    return Math.abs(hash) % 100 < percentage;
  }

  /**
   * Check health conditions for rollout
   */
  private async checkHealthConditions(strategy: RolloutStrategy): Promise<{ healthy: boolean; reason?: string }> {
    for (const healthCheck of strategy.health_checks) {
      if (!healthCheck.enabled) continue;
      
      const isHealthy = await this.evaluateHealthCheck(strategy.feature_flag, healthCheck);
      if (!isHealthy) {
        return { healthy: false, reason: `${healthCheck.check_name}_failed` };
      }
    }
    
    return { healthy: true };
  }

  /**
   * Evaluate individual health check
   */
  private async evaluateHealthCheck(featureFlag: string, healthCheck: HealthCheck): Promise<boolean> {
    const metrics = this.rolloutMetrics.get(featureFlag);
    if (!metrics) {
      return true; // No metrics available, assume healthy
    }

    let currentValue: number;
    
    switch (healthCheck.check_type) {
      case 'error_rate':
        currentValue = metrics.error_rate;
        break;
      case 'response_time':
        currentValue = metrics.average_response_time;
        break;
      case 'cost':
        currentValue = metrics.total_cost;
        break;
      case 'user_satisfaction':
        currentValue = metrics.user_satisfaction_score;
        break;
      default:
        return true; // Unknown check type, assume healthy
    }

    // Evaluate threshold
    switch (healthCheck.comparison) {
      case 'less_than':
        return currentValue < healthCheck.threshold;
      case 'greater_than':
        return currentValue > healthCheck.threshold;
      case 'equals':
        return currentValue === healthCheck.threshold;
      default:
        return true;
    }
  }

  /**
   * Execute rollout strategy
   */
  private async executeRolloutStrategy(strategy: RolloutStrategy): Promise<void> {
    switch (strategy.rollout_type) {
      case 'percentage':
        await this.executePercentageRollout(strategy);
        break;
      case 'canary':
        await this.executeCanaryRollout(strategy);
        break;
      // Other rollout types are passive and don't need execution
    }
  }

  /**
   * Execute percentage rollout with incremental increases
   */
  private async executePercentageRollout(strategy: RolloutStrategy): Promise<void> {
    const config = strategy.configuration;
    const incrementPercentage = config.increment_percentage || 10;
    const incrementInterval = (config.increment_interval_hours || 24) * 60 * 60 * 1000; // Convert to ms
    
    let currentPercentage = config.percentage || 0;
    
    const incrementRollout = async () => {
      if (currentPercentage >= 100 || strategy.status !== 'active') {
        return;
      }

      // Check health before incrementing
      const healthCheck = await this.checkHealthConditions(strategy);
      if (!healthCheck.healthy) {
        console.warn(`Pausing rollout for ${strategy.feature_flag} due to health check failure: ${healthCheck.reason}`);
        await this.pauseStrategy(strategy.feature_flag);
        return;
      }

      // Increment percentage
      currentPercentage = Math.min(100, currentPercentage + incrementPercentage);
      
      // Update feature flag
      await featureFlagManager.updateFlag(strategy.feature_flag, {
        rollout_percentage: currentPercentage
      }, 'gradual-rollout-system');

      console.log(`Incremented rollout for ${strategy.feature_flag} to ${currentPercentage}%`);

      // Schedule next increment
      if (currentPercentage < 100) {
        const timer = setTimeout(incrementRollout, incrementInterval);
        this.rolloutTimers.set(strategy.feature_flag, timer);
      } else {
        console.log(`Completed rollout for ${strategy.feature_flag}`);
        strategy.status = 'completed';
      }
    };

    // Start the rollout process
    const timer = setTimeout(incrementRollout, incrementInterval);
    this.rolloutTimers.set(strategy.feature_flag, timer);
  }

  /**
   * Execute canary rollout
   */
  private async executeCanaryRollout(strategy: RolloutStrategy): Promise<void> {
    const config = strategy.configuration;
    const canaryDuration = (config.canary_duration_hours || 24) * 60 * 60 * 1000; // Convert to ms
    
    // Set canary percentage
    await featureFlagManager.updateFlag(strategy.feature_flag, {
      rollout_percentage: config.canary_percentage || 5
    }, 'gradual-rollout-system');

    console.log(`Started canary rollout for ${strategy.feature_flag} at ${config.canary_percentage}%`);

    // Schedule canary evaluation
    const timer = setTimeout(async () => {
      await this.evaluateCanaryPromotion(strategy);
    }, canaryDuration);
    
    this.rolloutTimers.set(strategy.feature_flag, timer);
  }

  /**
   * Evaluate canary for promotion to full rollout
   */
  private async evaluateCanaryPromotion(strategy: RolloutStrategy): Promise<void> {
    const config = strategy.configuration;
    const criteria = config.promotion_criteria;
    
    if (!criteria) {
      console.warn(`No promotion criteria defined for canary ${strategy.feature_flag}`);
      return;
    }

    const metrics = this.rolloutMetrics.get(strategy.feature_flag);
    if (!metrics) {
      console.warn(`No metrics available for canary evaluation: ${strategy.feature_flag}`);
      return;
    }

    // Check promotion criteria
    const shouldPromote = 
      metrics.success_rate >= criteria.min_success_rate &&
      metrics.error_rate <= criteria.max_error_rate &&
      metrics.average_response_time <= criteria.max_response_time_ms &&
      metrics.user_satisfaction_score >= criteria.min_user_satisfaction &&
      metrics.total_users_enrolled >= criteria.min_sample_size;

    if (shouldPromote) {
      console.log(`Promoting canary ${strategy.feature_flag} to full rollout`);
      
      // Update to full rollout
      await featureFlagManager.updateFlag(strategy.feature_flag, {
        rollout_percentage: 100
      }, 'gradual-rollout-system');
      
      strategy.status = 'completed';
    } else {
      console.warn(`Canary ${strategy.feature_flag} failed promotion criteria, rolling back`);
      await this.rollbackStrategy(strategy.feature_flag, 'canary_promotion_failed');
    }
  }

  /**
   * Rollback rollout strategy
   */
  async rollbackStrategy(featureFlag: string, reason: string): Promise<void> {
    const strategy = this.rolloutStrategies.get(featureFlag);
    if (!strategy) {
      return;
    }

    console.warn(`Rolling back ${featureFlag}: ${reason}`);

    // Clear any timers
    const timer = this.rolloutTimers.get(featureFlag);
    if (timer) {
      clearTimeout(timer);
      this.rolloutTimers.delete(featureFlag);
    }

    // Disable feature flag
    await featureFlagManager.updateFlag(featureFlag, {
      enabled: false,
      rollout_percentage: 0,
      description: `Rolled back due to: ${reason}`
    }, 'gradual-rollout-system');

    strategy.status = 'rolled_back';
  }

  /**
   * Pause rollout strategy
   */
  async pauseStrategy(featureFlag: string): Promise<void> {
    const strategy = this.rolloutStrategies.get(featureFlag);
    if (!strategy) {
      return;
    }

    console.log(`Pausing rollout for ${featureFlag}`);

    // Clear any timers
    const timer = this.rolloutTimers.get(featureFlag);
    if (timer) {
      clearTimeout(timer);
      this.rolloutTimers.delete(featureFlag);
    }

    strategy.status = 'paused';
  }

  /**
   * Resume rollout strategy
   */
  async resumeStrategy(featureFlag: string): Promise<void> {
    const strategy = this.rolloutStrategies.get(featureFlag);
    if (!strategy || strategy.status !== 'paused') {
      return;
    }

    console.log(`Resuming rollout for ${featureFlag}`);
    
    strategy.status = 'active';
    await this.executeRolloutStrategy(strategy);
  }

  /**
   * Update rollout metrics
   */
  updateMetrics(featureFlag: string, metrics: Partial<RolloutMetrics>): void {
    const existing = this.rolloutMetrics.get(featureFlag) || {
      feature_flag: featureFlag,
      current_percentage: 0,
      total_users_eligible: 0,
      total_users_enrolled: 0,
      success_rate: 0,
      error_rate: 0,
      average_response_time: 0,
      total_cost: 0,
      user_satisfaction_score: 0,
      last_updated: new Date().toISOString()
    };

    const updated = {
      ...existing,
      ...metrics,
      last_updated: new Date().toISOString()
    };

    this.rolloutMetrics.set(featureFlag, updated);
  }

  /**
   * Get rollout status
   */
  getRolloutStatus(featureFlag: string): {
    strategy: RolloutStrategy | null;
    metrics: RolloutMetrics | null;
    status: string;
  } {
    const strategy = this.rolloutStrategies.get(featureFlag) || null;
    const metrics = this.rolloutMetrics.get(featureFlag) || null;
    
    return {
      strategy,
      metrics,
      status: strategy?.status || 'not_configured'
    };
  }

  /**
   * Initialize default rollout strategies
   */
  private initializeDefaultStrategies(): void {
    // Default Bedrock rollout strategy
    const bedrockStrategy: RolloutStrategy = {
      strategy_name: 'bedrock_gradual_rollout',
      feature_flag: 'vc_bedrock_live',
      rollout_type: 'percentage',
      configuration: {
        percentage: 10,
        increment_percentage: 10,
        increment_interval_hours: 24
      },
      health_checks: [
        {
          check_name: 'error_rate_check',
          check_type: 'error_rate',
          threshold: 5, // 5% max error rate
          comparison: 'less_than',
          window_minutes: 60,
          enabled: true
        },
        {
          check_name: 'response_time_check',
          check_type: 'response_time',
          threshold: 30000, // 30 seconds max
          comparison: 'less_than',
          window_minutes: 60,
          enabled: true
        }
      ],
      rollback_conditions: [
        {
          condition_name: 'high_error_rate',
          trigger_type: 'health_check_failure',
          parameters: { max_error_rate: 10 },
          action: 'rollback',
          enabled: true
        }
      ],
      created_by: 'system',
      created_at: new Date().toISOString(),
      status: 'active'
    };

    this.rolloutStrategies.set('vc_bedrock_live', bedrockStrategy);
  }
}

/**
 * Singleton instance for global use
 */
export const gradualRolloutSystem = new GradualRolloutSystem();