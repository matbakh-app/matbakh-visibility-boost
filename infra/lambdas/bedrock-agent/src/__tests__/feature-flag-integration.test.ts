/**
 * Feature Flag Integration Tests
 * 
 * Tests the complete feature flag system including:
 * - Basic feature flag functionality
 * - Cost control integration
 * - A/B testing framework
 * - Gradual rollout system
 * - Emergency shutdown procedures
 */

import { 
  featureFlagIntegration,
  BedrockFeatureIntegration,
  RequestContext 
} from '../feature-flag-integration';
import { featureFlagManager } from '../feature-flag-manager';
import { costControlManager } from '../cost-control-feature-flags';
import { abTestingFramework } from '../ab-testing-framework';
import { gradualRolloutSystem } from '../gradual-rollout-system';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-cloudwatch');

describe('Feature Flag Integration', () => {
  const mockUserContext = {
    userId: 'test-user-123',
    sessionId: 'session-456',
    userSegment: 'premium',
    geographicRegion: 'eu-central-1',
    timezone: 'Europe/Berlin'
  };

  const mockRequestContext: RequestContext = {
    requestType: 'vc_analysis',
    estimatedCost: 0.05,
    userContext: mockUserContext,
    requestId: 'req-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    featureFlagManager.clearCache();
  });

  describe('Basic Feature Flag Decisions', () => {
    it('should enable feature when all conditions are met', async () => {
      // Mock successful checks
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: true,
        reason: 'fully_enabled'
      });

      jest.spyOn(gradualRolloutSystem, 'shouldUserReceiveFeature').mockResolvedValue({
        enabled: true,
        reason: 'in_rollout_percentage',
        rollout_info: { current_percentage: 50 }
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(true);
      expect(decision.reason).toBe('all_checks_passed');
      expect(decision.metadata.feature_flag).toBe('vc_bedrock_live');
      expect(decision.metadata.user_id).toBe('test-user-123');
    });

    it('should disable feature when cost control blocks request', async () => {
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: false,
        reason: 'daily_limit_exceeded'
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(false);
      expect(decision.reason).toBe('cost_control_blocked: daily_limit_exceeded');
      expect(decision.cost_info?.blocked_reason).toBe('daily_limit_exceeded');
    });

    it('should disable feature when basic flag is disabled', async () => {
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: false,
        reason: 'globally_disabled'
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(false);
      expect(decision.reason).toBe('globally_disabled');
    });

    it('should disable feature when user not in rollout', async () => {
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: true,
        reason: 'fully_enabled'
      });

      jest.spyOn(gradualRolloutSystem, 'shouldUserReceiveFeature').mockResolvedValue({
        enabled: false,
        reason: 'not_in_rollout_percentage',
        rollout_info: { current_percentage: 10 }
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(false);
      expect(decision.reason).toBe('not_in_rollout_percentage');
      expect(decision.rollout_info?.current_percentage).toBe(10);
    });
  });

  describe('A/B Testing Integration', () => {
    it('should assign user to A/B test variant', async () => {
      // Mock successful basic checks
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: true,
        reason: 'fully_enabled'
      });

      jest.spyOn(gradualRolloutSystem, 'shouldUserReceiveFeature').mockResolvedValue({
        enabled: true,
        reason: 'in_rollout_percentage'
      });

      // Mock A/B test assignment
      jest.spyOn(featureFlagManager, 'getFlag').mockResolvedValue({
        flag_name: 'vc_bedrock_live',
        enabled: true,
        ab_test_config: {
          test_name: 'claude_vs_gemini',
          variants: [
            { name: 'claude', description: 'Claude 3.5 Sonnet', config: {}, weight: 50 },
            { name: 'gemini', description: 'Gemini Pro', config: {}, weight: 50 }
          ],
          traffic_split: { claude: 50, gemini: 50 },
          start_date: new Date().toISOString(),
          success_metrics: ['response_quality'],
          active: true
        }
      });

      jest.spyOn(abTestingFramework, 'getUserVariant').mockResolvedValue({
        variant: 'gemini',
        isNewAssignment: true
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(true);
      expect(decision.variant).toBe('gemini');
      expect(decision.ab_test_info?.experiment_id).toBe('vc_bedrock_live_ab_test');
      expect(decision.ab_test_info?.is_new_assignment).toBe(true);
    });
  });

  describe('Bedrock Feature Integration', () => {
    it('should check Bedrock enablement correctly', async () => {
      jest.spyOn(featureFlagIntegration, 'shouldEnableFeature').mockResolvedValue({
        enabled: true,
        reason: 'all_checks_passed',
        metadata: {
          feature_flag: 'vc_bedrock_live',
          user_id: 'test-user-123',
          session_id: 'session-456',
          timestamp: new Date().toISOString(),
          decision_path: ['cost_control_check', 'basic_flag_check', 'rollout_check']
        }
      });

      const decision = await BedrockFeatureIntegration.shouldEnableBedrock(mockRequestContext);

      expect(decision.enabled).toBe(true);
      expect(decision.reason).toBe('all_checks_passed');
    });

    it('should record AI success metrics', async () => {
      const recordCostSpy = jest.spyOn(costControlManager, 'recordRequestCost').mockResolvedValue();
      const updateMetricsSpy = jest.spyOn(gradualRolloutSystem, 'updateMetrics').mockImplementation();
      
      jest.spyOn(featureFlagManager, 'getFlag').mockResolvedValue({
        flag_name: 'vc_bedrock_live',
        enabled: true,
        ab_test_config: {
          test_name: 'test',
          variants: [],
          traffic_split: {},
          start_date: new Date().toISOString(),
          success_metrics: [],
          active: true
        }
      });

      jest.spyOn(abTestingFramework, 'recordEvent').mockResolvedValue();

      await BedrockFeatureIntegration.recordAISuccess(
        mockRequestContext,
        1500, // 1.5 seconds
        0.08, // $0.08
        92    // 92% quality score
      );

      expect(recordCostSpy).toHaveBeenCalledWith(
        'vc_analysis',
        0,
        0.08,
        mockUserContext
      );

      expect(updateMetricsSpy).toHaveBeenCalledWith('vc_bedrock_live', {
        success_rate: 100,
        average_response_time: 1500,
        total_cost: 0.08,
        user_satisfaction_score: 92
      });
    });

    it('should record AI failure metrics', async () => {
      const updateMetricsSpy = jest.spyOn(gradualRolloutSystem, 'updateMetrics').mockImplementation();
      
      jest.spyOn(featureFlagManager, 'getFlag').mockResolvedValue({
        flag_name: 'vc_bedrock_live',
        enabled: true,
        ab_test_config: {
          test_name: 'test',
          variants: [],
          traffic_split: {},
          start_date: new Date().toISOString(),
          success_metrics: [],
          active: true
        }
      });

      const recordEventSpy = jest.spyOn(abTestingFramework, 'recordEvent').mockResolvedValue();

      await BedrockFeatureIntegration.recordAIFailure(
        mockRequestContext,
        'timeout_error',
        'Request timed out after 30 seconds'
      );

      expect(updateMetricsSpy).toHaveBeenCalledWith('vc_bedrock_live', {
        error_rate: 10,
        success_rate: 90
      });

      expect(recordEventSpy).toHaveBeenCalledWith(
        'vc_bedrock_live_ab_test',
        mockUserContext,
        'ai_error',
        {
          error_type: 'timeout_error',
          error_message: 'Request timed out after 30 seconds',
          request_type: 'vc_analysis'
        }
      );
    });
  });

  describe('Emergency Shutdown', () => {
    it('should perform emergency shutdown of all systems', async () => {
      jest.spyOn(featureFlagManager, 'emergencyShutdown').mockResolvedValue(true);
      const rollbackSpy = jest.spyOn(gradualRolloutSystem, 'rollbackStrategy').mockResolvedValue();
      const endExperimentSpy = jest.spyOn(abTestingFramework, 'endExperiment').mockResolvedValue({
        winner: 'control',
        results: []
      });

      jest.spyOn(abTestingFramework, 'getActiveExperiments').mockResolvedValue([
        {
          experiment_id: 'exp_123',
          name: 'Test Experiment',
          description: 'Test',
          hypothesis: 'Test hypothesis',
          feature_flag: 'vc_bedrock_live',
          variants: [],
          traffic_allocation: {},
          success_metrics: [],
          start_date: new Date().toISOString(),
          status: 'active',
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          confidence_level: 0.95,
          minimum_effect_size: 5
        }
      ]);

      await featureFlagIntegration.emergencyShutdownAll('Critical system error', 'admin');

      expect(rollbackSpy).toHaveBeenCalledWith('vc_bedrock_live', 'Critical system error');
      expect(rollbackSpy).toHaveBeenCalledWith('vc_bedrock_rollout_percent', 'Critical system error');
      expect(endExperimentSpy).toHaveBeenCalledWith('exp_123', 'admin', 'Critical system error');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all systems are working', async () => {
      jest.spyOn(featureFlagManager, 'getCacheStats').mockReturnValue({ size: 5 });
      jest.spyOn(costControlManager, 'getCostSummary').mockResolvedValue({
        daily: { daily_cost: 10.50 } as any,
        monthly: null,
        alerts: [],
        thresholds: []
      });
      jest.spyOn(abTestingFramework, 'getActiveExperiments').mockResolvedValue([]);

      const health = await featureFlagIntegration.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.systems.feature_flags.status).toBe('healthy');
      expect(health.systems.cost_control.status).toBe('healthy');
      expect(health.systems.ab_testing.status).toBe('healthy');
      expect(health.systems.rollout_system.status).toBe('degraded'); // No strategy configured
    });

    it('should return unhealthy status when systems fail', async () => {
      jest.spyOn(featureFlagManager, 'getCacheStats').mockImplementation(() => {
        throw new Error('Cache error');
      });

      const health = await featureFlagIntegration.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.systems.feature_flags.status).toBe('unhealthy');
      expect(health.systems.feature_flags.details?.error).toBe('Cache error');
    });
  });

  describe('Error Handling', () => {
    it('should fail open when feature flag decision fails', async () => {
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockRejectedValue(
        new Error('DynamoDB connection failed')
      );

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      expect(decision.enabled).toBe(true);
      expect(decision.reason).toBe('decision_error_fail_open');
      expect(decision.metadata.decision_path).toContain('error_handling');
    });

    it('should handle missing user context gracefully', async () => {
      const requestContextWithoutUser: RequestContext = {
        requestType: 'vc_analysis',
        estimatedCost: 0.05,
        userContext: {},
        requestId: 'req-123'
      };

      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: true,
        reason: 'fully_enabled'
      });

      jest.spyOn(gradualRolloutSystem, 'shouldUserReceiveFeature').mockResolvedValue({
        enabled: true,
        reason: 'anonymous_user_allowed'
      });

      const decision = await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        requestContextWithoutUser
      );

      expect(decision.enabled).toBe(true);
      expect(decision.metadata.user_id).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should complete feature flag decision within reasonable time', async () => {
      jest.spyOn(costControlManager, 'shouldAllowRequest').mockResolvedValue({
        allowed: true,
        reason: 'within_limits'
      });

      jest.spyOn(featureFlagManager, 'isFeatureEnabled').mockResolvedValue({
        enabled: true,
        reason: 'fully_enabled'
      });

      jest.spyOn(gradualRolloutSystem, 'shouldUserReceiveFeature').mockResolvedValue({
        enabled: true,
        reason: 'in_rollout_percentage'
      });

      const startTime = Date.now();
      
      await featureFlagIntegration.shouldEnableFeature(
        'vc_bedrock_live',
        mockRequestContext
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});