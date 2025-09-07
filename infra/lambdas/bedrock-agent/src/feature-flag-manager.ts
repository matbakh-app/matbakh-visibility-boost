/**
 * Feature Flag Manager for Bedrock AI Core
 * 
 * Provides centralized feature flag management with:
 * - Database integration for dynamic flag updates
 * - Gradual rollout system with user-based distribution
 * - A/B testing framework for different AI approaches
 * - Cost control and emergency shutdown capabilities
 * - Caching for performance optimization
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface FeatureFlag {
  flag_name: string;
  enabled: boolean;
  value?: string | null;
  description?: string;
  updated_by?: string;
  updated_at?: string;
  rollout_percentage?: number;
  ab_test_config?: ABTestConfig;
  cost_threshold?: number;
  emergency_shutdown?: boolean;
}

export interface ABTestConfig {
  test_name: string;
  variants: ABTestVariant[];
  traffic_split: Record<string, number>; // variant_name -> percentage
  start_date: string;
  end_date?: string;
  success_metrics: string[];
  active: boolean;
}

export interface ABTestVariant {
  name: string;
  description: string;
  config: Record<string, any>;
  weight: number;
}

export interface RolloutConfig {
  enabled: boolean;
  percentage: number;
  user_segments?: string[];
  geographic_regions?: string[];
  time_windows?: TimeWindow[];
}

export interface TimeWindow {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  timezone: string;
  days_of_week: number[]; // 0-6, Sunday = 0
}

export interface CostControlConfig {
  daily_limit_usd: number;
  monthly_limit_usd: number;
  per_request_limit_usd: number;
  emergency_threshold_usd: number;
  auto_shutdown_enabled: boolean;
  alert_thresholds: number[];
}

export interface UserContext {
  userId?: string;
  sessionId?: string;
  userSegment?: string;
  geographicRegion?: string;
  timezone?: string;
  requestCount?: number;
  totalCost?: number;
}

/**
 * Feature Flag Manager with advanced rollout and testing capabilities
 */
export class FeatureFlagManager {
  private dynamoClient: DynamoDBClient;
  private tableName: string;
  private cache: Map<string, { flag: FeatureFlag; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(region: string = 'eu-central-1') {
    this.dynamoClient = new DynamoDBClient({ region });
    this.tableName = process.env.FEATURE_FLAGS_TABLE || 'bedrock-feature-flags';
  }

  /**
   * Get feature flag with caching
   */
  async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(flagName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.flag;
    }

    try {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ flag_name: flagName })
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Item) {
        return null;
      }

      const flag = unmarshall(response.Item) as FeatureFlag;
      
      // Cache the result
      this.cache.set(flagName, { flag, timestamp: Date.now() });
      
      return flag;
    } catch (error) {
      console.error(`Failed to get feature flag ${flagName}:`, error);
      return null;
    }
  }

  /**
   * Check if feature is enabled for user with rollout logic
   */
  async isFeatureEnabled(
    flagName: string, 
    userContext: UserContext = {}
  ): Promise<{ enabled: boolean; variant?: string; reason: string }> {
    const flag = await this.getFlag(flagName);
    
    if (!flag) {
      return { enabled: false, reason: 'flag_not_found' };
    }

    // Check emergency shutdown
    if (flag.emergency_shutdown) {
      return { enabled: false, reason: 'emergency_shutdown' };
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return { enabled: false, reason: 'globally_disabled' };
    }

    // Check cost thresholds
    if (flag.cost_threshold && userContext.totalCost && userContext.totalCost > flag.cost_threshold) {
      return { enabled: false, reason: 'cost_threshold_exceeded' };
    }

    // Check rollout percentage
    const rolloutPercentage = flag.rollout_percentage || 100;
    if (!this.isUserInRollout(userContext.userId || 'anonymous', rolloutPercentage)) {
      return { enabled: false, reason: 'not_in_rollout' };
    }

    // Check A/B test configuration
    if (flag.ab_test_config && flag.ab_test_config.active) {
      const variant = this.getABTestVariant(flag.ab_test_config, userContext);
      return { enabled: true, variant, reason: 'ab_test_active' };
    }

    return { enabled: true, reason: 'fully_enabled' };
  }

  /**
   * Get A/B test variant for user
   */
  private getABTestVariant(abConfig: ABTestConfig, userContext: UserContext): string {
    const userId = userContext.userId || 'anonymous';
    
    // Generate consistent hash for user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    
    const normalizedHash = Math.abs(hash) % 100;
    
    // Determine variant based on traffic split
    let cumulativePercentage = 0;
    for (const [variantName, percentage] of Object.entries(abConfig.traffic_split)) {
      cumulativePercentage += percentage;
      if (normalizedHash < cumulativePercentage) {
        return variantName;
      }
    }
    
    // Fallback to first variant
    return Object.keys(abConfig.traffic_split)[0] || 'control';
  }

  /**
   * Check if user is in rollout percentage
   */
  private isUserInRollout(userId: string, rolloutPercentage: number): boolean {
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;
    
    // Generate consistent hash for user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    
    return Math.abs(hash) % 100 < rolloutPercentage;
  }

  /**
   * Update feature flag
   */
  async updateFlag(
    flagName: string, 
    updates: Partial<FeatureFlag>,
    updatedBy: string = 'system'
  ): Promise<boolean> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Build update expression dynamically
      Object.entries(updates).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      });

      // Add metadata
      updateExpression.push('#updatedBy = :updatedBy', '#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedBy'] = 'updated_by';
      expressionAttributeNames['#updatedAt'] = 'updated_at';
      expressionAttributeValues[':updatedBy'] = updatedBy;
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ flag_name: flagName }),
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ReturnValues: 'ALL_NEW'
      });

      await this.dynamoClient.send(command);
      
      // Invalidate cache
      this.cache.delete(flagName);
      
      return true;
    } catch (error) {
      console.error(`Failed to update feature flag ${flagName}:`, error);
      return false;
    }
  }

  /**
   * Create new feature flag
   */
  async createFlag(flag: FeatureFlag): Promise<boolean> {
    try {
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          ...flag,
          updated_at: new Date().toISOString()
        }),
        ConditionExpression: 'attribute_not_exists(flag_name)'
      });

      await this.dynamoClient.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to create feature flag ${flag.flag_name}:`, error);
      return false;
    }
  }

  /**
   * Emergency shutdown for specific flag
   */
  async emergencyShutdown(flagName: string, reason: string, shutdownBy: string): Promise<boolean> {
    console.warn(`EMERGENCY SHUTDOWN: ${flagName} - Reason: ${reason} - By: ${shutdownBy}`);
    
    return await this.updateFlag(flagName, {
      emergency_shutdown: true,
      enabled: false,
      description: `EMERGENCY SHUTDOWN: ${reason}`
    }, shutdownBy);
  }

  /**
   * Get all active A/B tests
   */
  async getActiveABTests(): Promise<FeatureFlag[]> {
    // In a real implementation, this would scan the table for active A/B tests
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Record A/B test metrics
   */
  async recordABTestMetric(
    flagName: string,
    variant: string,
    metric: string,
    value: number,
    userContext: UserContext
  ): Promise<void> {
    // Implementation would record metrics to analytics system
    console.log(`A/B Test Metric: ${flagName}/${variant} - ${metric}: ${value}`, userContext);
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
      // Hit rate would require tracking hits/misses
    };
  }
}

/**
 * Singleton instance for global use
 */
export const featureFlagManager = new FeatureFlagManager();

/**
 * Convenience functions for common feature flags
 */
export class BedrockFeatureFlags {
  private static manager = featureFlagManager;

  /**
   * Check if Bedrock AI is enabled for user
   */
  static async isBedrockEnabled(userContext: UserContext = {}): Promise<{ enabled: boolean; reason: string }> {
    const result = await this.manager.isFeatureEnabled('vc_bedrock_live', userContext);
    return { enabled: result.enabled, reason: result.reason };
  }

  /**
   * Get rollout percentage for Bedrock
   */
  static async getBedrockRolloutPercentage(): Promise<number> {
    const flag = await this.manager.getFlag('vc_bedrock_rollout_percent');
    return flag?.rollout_percentage || parseInt(flag?.value || '0', 10);
  }

  /**
   * Check if user is in Bedrock rollout
   */
  static async isUserInBedrockRollout(userContext: UserContext): Promise<boolean> {
    const result = await this.manager.isFeatureEnabled('vc_bedrock_rollout_percent', userContext);
    return result.enabled;
  }

  /**
   * Get A/B test variant for AI approach
   */
  static async getAIApproachVariant(userContext: UserContext): Promise<string | null> {
    const result = await this.manager.isFeatureEnabled('ai_approach_ab_test', userContext);
    return result.variant || null;
  }

  /**
   * Emergency shutdown of all Bedrock features
   */
  static async emergencyShutdownAll(reason: string, shutdownBy: string): Promise<void> {
    await Promise.all([
      this.manager.emergencyShutdown('vc_bedrock_live', reason, shutdownBy),
      this.manager.emergencyShutdown('vc_bedrock_rollout_percent', reason, shutdownBy),
      this.manager.emergencyShutdown('ai_approach_ab_test', reason, shutdownBy)
    ]);
  }
}