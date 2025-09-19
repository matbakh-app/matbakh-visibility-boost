// useRecommendations Hook - Task 6.4.4.6
// React hook for score-based recommendation triggers
// Requirements: B.3, B.4

import { useMemo, useState, useEffect } from 'react';
import type { ScorePoint } from '@/types/score-history';
import type { TriggeredRecommendation, RecommendationTriggerResult } from '@/types/recommendation';
import { 
  getTriggeredRecommendation, 
  getBatchTriggeredRecommendations 
} from '@/lib/recommendation/recommendationFlow';
import { evaluateScoreTrend } from '@/lib/recommendation/recommendationTrigger';

interface UseRecommendationsOptions {
  businessCategory?: string;
  businessId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseRecommendationsReturn {
  recommendation: TriggeredRecommendation | null;
  trigger: RecommendationTriggerResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for single score type recommendation analysis
 */
export function useRecommendations(
  scoreType: string,
  scores: ScorePoint[],
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const {
    businessCategory,
    businessId,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized recommendation calculation
  const { recommendation, trigger } = useMemo(() => {
    if (!scores || scores.length === 0) {
      return { recommendation: null, trigger: null };
    }

    try {
      // Evaluate trigger conditions
      const triggerResult = evaluateScoreTrend(scores, scoreType, businessCategory);
      
      // Generate recommendation if triggered
      const recommendationResult = getTriggeredRecommendation(
        scoreType,
        scores,
        businessCategory,
        businessId
      );

      return {
        recommendation: recommendationResult,
        trigger: triggerResult
      };
    } catch (err) {
      console.error('Error generating recommendations:', err);
      return { recommendation: null, trigger: null };
    }
  }, [scores, scoreType, businessCategory, businessId]);

  // Manual refresh function
  const refresh = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate async operation (in real app, this might trigger data refetch)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    recommendation,
    trigger,
    isLoading,
    error,
    refresh
  };
}

interface UseBatchRecommendationsOptions extends UseRecommendationsOptions {
  maxRecommendations?: number;
}

interface UseBatchRecommendationsReturn {
  recommendations: TriggeredRecommendation[];
  triggers: Record<string, RecommendationTriggerResult>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  hasHighPriorityTriggers: boolean;
  triggerCount: number;
}

/**
 * Hook for batch recommendation analysis across multiple score types
 */
export function useBatchRecommendations(
  scoreData: Record<string, ScorePoint[]>,
  options: UseBatchRecommendationsOptions = {}
): UseBatchRecommendationsReturn {
  const {
    businessCategory,
    businessId,
    maxRecommendations = 5,
    autoRefresh = false,
    refreshInterval = 300000
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized batch analysis
  const { recommendations, triggers, hasHighPriorityTriggers, triggerCount } = useMemo(() => {
    if (!scoreData || Object.keys(scoreData).length === 0) {
      return { 
        recommendations: [], 
        triggers: {}, 
        hasHighPriorityTriggers: false, 
        triggerCount: 0 
      };
    }

    try {
      // Generate all recommendations
      const allRecommendations = getBatchTriggeredRecommendations(
        scoreData,
        businessCategory,
        businessId
      );

      // Limit recommendations
      const limitedRecommendations = allRecommendations.slice(0, maxRecommendations);

      // Generate trigger results for all score types
      const allTriggers: Record<string, RecommendationTriggerResult> = {};
      for (const [scoreType, scores] of Object.entries(scoreData)) {
        allTriggers[scoreType] = evaluateScoreTrend(scores, scoreType, businessCategory);
      }

      // Check for high priority triggers
      const highPriorityTriggers = Object.values(allTriggers).filter(
        trigger => trigger.triggered && trigger.severity === 'high'
      );

      // Count total triggered recommendations
      const totalTriggers = Object.values(allTriggers).filter(
        trigger => trigger.triggered
      ).length;

      return {
        recommendations: limitedRecommendations,
        triggers: allTriggers,
        hasHighPriorityTriggers: highPriorityTriggers.length > 0,
        triggerCount: totalTriggers
      };
    } catch (err) {
      console.error('Error generating batch recommendations:', err);
      return { 
        recommendations: [], 
        triggers: {}, 
        hasHighPriorityTriggers: false, 
        triggerCount: 0 
      };
    }
  }, [scoreData, businessCategory, businessId, maxRecommendations]);

  // Manual refresh function
  const refresh = () => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    recommendations,
    triggers,
    isLoading,
    error,
    refresh,
    hasHighPriorityTriggers,
    triggerCount
  };
}

/**
 * Hook for monitoring specific trigger conditions
 */
export function useTriggerMonitoring(
  scoreType: string,
  scores: ScorePoint[],
  businessCategory?: string
) {
  const trigger = useMemo(() => {
    if (!scores || scores.length === 0) return null;
    
    return evaluateScoreTrend(scores, scoreType, businessCategory);
  }, [scores, scoreType, businessCategory]);

  const isTriggered = trigger?.triggered || false;
  const severity = trigger?.severity || 'low';
  const confidence = trigger?.confidence || 0;
  const reason = trigger?.reason;

  return {
    trigger,
    isTriggered,
    severity,
    confidence,
    reason,
    metadata: trigger?.metadata
  };
}

export default useRecommendations;