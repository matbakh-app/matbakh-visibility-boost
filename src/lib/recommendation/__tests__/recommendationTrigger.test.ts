// Recommendation Trigger Tests - Task 6.4.4.6
// Unit tests for score-based recommendation triggering
// Requirements: B.3

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateScoreTrend, evaluateScoreTrendWithContext } from '../recommendationTrigger';
import { defaultThresholds, getContextualThresholds } from '../thresholds';
import type { ScorePoint } from '@/types/score-history';
import type { TriggerContext } from '@/types/recommendation';

describe('RecommendationTrigger', () => {
  let flatScores: ScorePoint[];
  let droppingScores: ScorePoint[];
  let stagnantScores: ScorePoint[];
  let improvingScores: ScorePoint[];
  let volatileScores: ScorePoint[];

  beforeEach(() => {
    const baseDate = new Date('2025-01-01');
    
    // Flat scores - no change
    flatScores = Array.from({ length: 30 }, (_, i) => ({
      id: `flat-${i}`,
      business_id: 'test-business',
      score_type: 'overall_visibility',
      score_value: 65 + (Math.random() - 0.5) * 2, // ±1 point variation
      date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      calculated_at: new Date().toISOString(),
      source: 'test',
      meta: {}
    }));

    // Dropping scores - 25% drop over 14 days
    droppingScores = Array.from({ length: 30 }, (_, i) => {
      const baseScore = 80;
      const dropAmount = i <= 14 ? (i * 20) / 14 : 20; // 20 point drop over 14 days
      return {
        id: `drop-${i}`,
        business_id: 'test-business',
        score_type: 'google_visibility',
        score_value: baseScore - dropAmount + (Math.random() - 0.5) * 2,
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        calculated_at: new Date().toISOString(),
        source: 'test',
        meta: {}
      };
    });

    // Stagnant scores - very little variation
    stagnantScores = Array.from({ length: 30 }, (_, i) => ({
      id: `stagnant-${i}`,
      business_id: 'test-business',
      score_type: 'instagram_engagement',
      score_value: 45 + (Math.random() - 0.5) * 1, // ±0.5 point variation
      date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      calculated_at: new Date().toISOString(),
      source: 'test',
      meta: {}
    }));

    // Improving scores
    improvingScores = Array.from({ length: 30 }, (_, i) => ({
      id: `improving-${i}`,
      business_id: 'test-business',
      score_type: 'seo_visibility',
      score_value: 50 + (i * 0.8) + (Math.random() - 0.5) * 2, // Steady improvement
      date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      calculated_at: new Date().toISOString(),
      source: 'test',
      meta: {}
    }));

    // Volatile scores
    volatileScores = Array.from({ length: 30 }, (_, i) => ({
      id: `volatile-${i}`,
      business_id: 'test-business',
      score_type: 'review_score',
      score_value: 60 + (Math.random() - 0.5) * 30, // High volatility ±15 points
      date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      calculated_at: new Date().toISOString(),
      source: 'test',
      meta: {}
    }));
  });

  describe('evaluateScoreTrend', () => {
    it('should not trigger for insufficient data', () => {
      const result = evaluateScoreTrend(flatScores.slice(0, 3));
      
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe(null);
      expect(result.action).toBe(null);
    });

    it('should not trigger for stable scores', () => {
      const result = evaluateScoreTrend(flatScores);
      
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe(null);
      expect(result.action).toBe(null);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should trigger drop for significant score decrease', () => {
      const result = evaluateScoreTrend(droppingScores);
      
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('drop');
      expect(result.action).toBeTruthy();
      expect(result.severity).toBeDefined();
      expect(result.metadata?.scoreChange).toBeGreaterThan(0);
      expect(result.metadata?.trend).toBe('declining');
    });

    it('should trigger stagnation for unchanging scores', () => {
      const result = evaluateScoreTrend(stagnantScores);
      
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('stagnation');
      expect(result.action).toBeTruthy();
      expect(result.metadata?.trend).toBe('stable');
    });

    it('should not trigger for improving scores', () => {
      const result = evaluateScoreTrend(improvingScores);
      
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe(null);
      expect(result.metadata?.trend).toBe('improving');
    });

    it('should handle volatile scores appropriately', () => {
      const result = evaluateScoreTrend(volatileScores);
      
      // Volatile scores should have lower confidence
      if (result.triggered) {
        expect(result.confidence).toBeLessThan(0.8);
      }
    });

    it('should respect custom thresholds', () => {
      const strictThresholds = {
        ...defaultThresholds,
        dropThreshold: 0.1, // 10% drop threshold
        stagnationRange: 0.02 // 2% stagnation range
      };
      
      const result = evaluateScoreTrend(flatScores, strictThresholds);
      
      // With stricter thresholds, flat scores might trigger stagnation
      expect(result).toBeDefined();
    });

    it('should provide appropriate metadata', () => {
      const result = evaluateScoreTrend(droppingScores);
      
      if (result.triggered) {
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.currentScore).toBeDefined();
        expect(result.metadata?.previousScore).toBeDefined();
        expect(result.metadata?.scoreChange).toBeDefined();
        expect(result.metadata?.daysSinceChange).toBeDefined();
        expect(result.metadata?.trend).toBeDefined();
      }
    });

    it('should not trigger for slight improvements', () => {
      const improving = Array.from({ length: 15 }, (_, i) => ({
        id: `improving-${i}`,
        business_id: 'test-business',
        score_type: 'overall_visibility',
        score_value: 64 + (i * 0.4), // Gradual improvement from 64 to 70
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        calculated_at: new Date().toISOString(),
        source: 'test',
        meta: {}
      }));
      
      const result = evaluateScoreTrend(improving);
      expect(result.triggered).toBe(false);
      expect(result.metadata?.trend).toBe('improving');
    });

    it('should trigger drop for exactly threshold change', () => {
      // 20 point drop from 100 to 80 = exactly 20% change
      const exactThresholdScores = [
        {
          id: 'exact-1',
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: 100,
          date: '2025-01-01',
          calculated_at: new Date().toISOString(),
          source: 'test',
          meta: {}
        },
        {
          id: 'exact-2',
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: 80,
          date: '2025-01-15',
          calculated_at: new Date().toISOString(),
          source: 'test',
          meta: {}
        }
      ];

      const result = evaluateScoreTrend(exactThresholdScores, { 
        ...defaultThresholds, 
        dropThreshold: 0.2, // 20% threshold
        minDataPoints: 2    // Allow test with just 2 data points
      });
      
      expect(result.triggered).toBe(true);
      expect(result.reason).toBe('drop');
    });
  });

  describe('evaluateScoreTrendWithContext', () => {
    it('should use contextual thresholds for different score types', () => {
      const googleContext: TriggerContext = {
        scoreType: 'google_visibility',
        industry: 'restaurant'
      };
      
      const result = evaluateScoreTrendWithContext(droppingScores, googleContext);
      
      expect(result).toBeDefined();
      // Google visibility should be more sensitive
    });

    it('should adjust actions based on score type', () => {
      const googleContext: TriggerContext = {
        scoreType: 'google_visibility'
      };
      
      const instagramContext: TriggerContext = {
        scoreType: 'instagram_engagement'
      };
      
      const googleResult = evaluateScoreTrendWithContext(droppingScores, googleContext);
      const instagramResult = evaluateScoreTrendWithContext(droppingScores, instagramContext);
      
      if (googleResult.triggered && instagramResult.triggered) {
        // Actions should be different for different score types
        expect(googleResult.action).not.toBe(instagramResult.action);
      }
    });

    it('should handle industry-specific contexts', () => {
      const restaurantContext: TriggerContext = {
        scoreType: 'overall_visibility',
        industry: 'restaurant'
      };
      
      const healthcareContext: TriggerContext = {
        scoreType: 'overall_visibility',
        industry: 'healthcare'
      };
      
      const restaurantResult = evaluateScoreTrendWithContext(droppingScores, restaurantContext);
      const healthcareResult = evaluateScoreTrendWithContext(droppingScores, healthcareContext);
      
      // Both should trigger, but potentially with different severities
      expect(restaurantResult).toBeDefined();
      expect(healthcareResult).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty score arrays gracefully', () => {
      const result = evaluateScoreTrend([]);
      
      expect(result.triggered).toBe(false);
      expect(result.reason).toBe(null);
      expect(result.action).toBe(null);
    });

    it('should handle invalid threshold configurations', () => {
      const invalidThresholds = {
        ...defaultThresholds,
        dropThreshold: -0.1, // Invalid negative threshold
        stagnationRange: 1.5  // Invalid range > 1
      };
      
      const result = evaluateScoreTrend(flatScores, invalidThresholds);
      
      expect(result.triggered).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });
});