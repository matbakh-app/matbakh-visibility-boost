// Recommendation Trigger Engine - Task 6.4.4.3
// Core logic for score evaluation and recommendation triggering
// Requirements: B.3

import type { ScorePoint } from '@/types/score-history';
import type {
  RecommendationTriggerResult,
  TriggerReason,
  TriggerAction,
  ThresholdOptions,
  TriggerContext
} from '@/types/recommendation';
import {
  defaultThresholds,
  getContextualThresholds,
  getSeverityLevel,
  calculateTriggerConfidence,
  validateThresholds
} from './thresholds';

const MIN_SCORE_DELTA = 1.0;
const EPSILON = Number.EPSILON * 10;

export function evaluateScoreTrend(
  data: ScorePoint[],
  options: ThresholdOptions = defaultThresholds,
  context?: TriggerContext
): RecommendationTriggerResult {
  if (!data || data.length < (options.minDataPoints || 5)) {
    return {
      triggered: false,
      reason: null,
      action: null,
      confidence: 0
    };
  }

  const validation = validateThresholds(options);
  if (!validation.isValid) {
    console.warn('Invalid thresholds:', validation.errors);
    return {
      triggered: false,
      reason: null,
      action: null,
      confidence: 0
    };
  }

  const sortedData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-Math.min(data.length, options.evaluationPeriod || 30));

  if (sortedData.length < (options.minDataPoints || 5)) {
    return {
      triggered: false,
      reason: null,
      action: null,
      confidence: 0
    };
  }

  const firstScore = sortedData[0].score_value;
  const currentScore = sortedData[sortedData.length - 1].score_value;
  const scores = sortedData.map(p => p.score_value);

  const absoluteChange = currentScore - firstScore;
  const relativeChange = firstScore > 0 ? (firstScore - currentScore) / firstScore : 0;

  const trend: 'improving' | 'declining' | 'stable' =
    absoluteChange > MIN_SCORE_DELTA ? 'improving' :
    absoluteChange < -MIN_SCORE_DELTA ? 'declining' :
    'stable';

  const scoreStats = calculateScoreStatistics(scores);

  // Drop detection
  if ((relativeChange + EPSILON >= options.dropThreshold) && absoluteChange < 0) {
    const severity = getSeverityLevel(relativeChange, options) || 'medium';
    const confidence = calculateTriggerConfidence(
      sortedData.length,
      options.evaluationPeriod || 30,
      scoreStats.standardDeviation
    );

    return {
      triggered: true,
      reason: 'drop',
      action: determineActionForDrop(context?.scoreType, severity),
      severity,
      confidence,
      metadata: {
        scoreChange: relativeChange,
        daysSinceChange: sortedData.length,
        previousScore: firstScore,
        currentScore,
        trend: 'declining'
      }
    };
  }

  // Stagnation detection
  const stagnationResult = checkForStagnation(sortedData, options, context);
  if (stagnationResult.triggered) {
    return stagnationResult;
  }

  return {
    triggered: false,
    reason: null,
    action: null,
    confidence: calculateTriggerConfidence(
      sortedData.length,
      options.evaluationPeriod || 30,
      scoreStats.standardDeviation
    ),
    metadata: {
      scoreChange: relativeChange,
      daysSinceChange: 0,
      previousScore: firstScore,
      currentScore,
      trend
    }
  };
}

function checkForStagnation(
  sortedData: ScorePoint[],
  options: ThresholdOptions,
  context?: TriggerContext
): RecommendationTriggerResult {
  const evaluationPeriod = Math.min(options.evaluationPeriod || 30, sortedData.length);

  if (evaluationPeriod < 14) {
    return { triggered: false, reason: null, action: null };
  }

  const recentScores = sortedData.slice(-evaluationPeriod).map(p => p.score_value);
  const minScore = Math.min(...recentScores);
  const maxScore = Math.max(...recentScores);
  const scoreRange = maxScore - minScore;

  const stagnationThreshold = options.stagnationRange * (options.maxScore - options.minScore);

  if (scoreRange < stagnationThreshold) {
    const currentScore = sortedData[sortedData.length - 1].score_value;
    const avgScore = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;

    if (avgScore < 50) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (avgScore < 30) severity = 'high';
      else if (avgScore < 40) severity = 'medium';

      const confidence = calculateTriggerConfidence(
        sortedData.length,
        options.evaluationPeriod || 30,
        calculateScoreStatistics(recentScores).standardDeviation
      );

      return {
        triggered: true,
        reason: 'stagnation',
        action: determineActionForStagnation(context?.scoreType, avgScore),
        severity,
        confidence,
        metadata: {
          scoreChange: 0,
          daysSinceChange: evaluationPeriod,
          previousScore: avgScore,
          currentScore,
          trend: 'stable'
        }
      };
    }
  }

  return {
    triggered: false,
    reason: null,
    action: null
  };
}

function determineActionForDrop(
  scoreType?: string,
  severity?: 'low' | 'medium' | 'high'
): TriggerAction {
  if (!scoreType) return 'review_google';

  if (severity === 'high') {
    if (scoreType.includes('google')) return 'review_google';
    if (scoreType.includes('instagram') || scoreType.includes('social')) return 'boost_social';
    if (scoreType.includes('review')) return 'respond_reviews';
    return 'review_google';
  }

  if (severity === 'medium') {
    if (scoreType.includes('google')) return 'update_photos';
    if (scoreType.includes('instagram')) return 'check_ig';
    if (scoreType.includes('seo')) return 'optimize_seo';
    if (scoreType.includes('review')) return 'respond_reviews';
    return 'review_google';
  }

  if (scoreType.includes('instagram') || scoreType.includes('social')) return 'check_ig';
  if (scoreType.includes('seo')) return 'optimize_seo';
  return 'update_photos';
}

function determineActionForStagnation(
  scoreType?: string,
  avgScore?: number
): TriggerAction {
  if (!scoreType) return 'check_ig';

  if (avgScore && avgScore < 40) {
    if (scoreType.includes('google')) return 'review_google';
    if (scoreType.includes('review')) return 'respond_reviews';
    return 'review_google';
  }

  if (avgScore && avgScore < 70) {
    if (scoreType.includes('instagram')) return 'boost_social';
    if (scoreType.includes('seo')) return 'optimize_seo';
    if (scoreType.includes('google')) return 'update_photos';
    return 'update_photos';
  }

  if (scoreType.includes('instagram') || scoreType.includes('social')) return 'check_ig';
  if (scoreType.includes('seo')) return 'optimize_seo';
  return 'update_photos';
}

function calculateScoreStatistics(scores: number[]): {
  mean: number;
  standardDeviation: number;
  trend: 'improving' | 'declining' | 'stable';
  volatility: number;
} {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);

  const n = scores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = scores;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.1) trend = slope > 0 ? 'improving' : 'declining';

  const volatility = mean > 0 ? (standardDeviation / mean) * 100 : 0;

  return {
    mean,
    standardDeviation,
    trend,
    volatility
  };
}

export function evaluateScoreTrendWithContext(
  data: ScorePoint[],
  context: TriggerContext
): RecommendationTriggerResult {
  const thresholds = getContextualThresholds(context.scoreType, context.industry);
  return evaluateScoreTrend(data, thresholds, context);
}

export function evaluateMultipleScores(
  scoreData: Record<string, ScorePoint[]>,
  context: Omit<TriggerContext, 'scoreType'>
): Record<string, RecommendationTriggerResult> {
  const results: Record<string, RecommendationTriggerResult> = {};
  Object.entries(scoreData).forEach(([scoreType, data]) => {
    results[scoreType] = evaluateScoreTrendWithContext(data, {
      ...context,
      scoreType
    });
  });
  return results;
}

export default evaluateScoreTrend;
