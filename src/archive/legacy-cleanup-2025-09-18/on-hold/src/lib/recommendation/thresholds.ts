// Threshold Configuration - Task 6.4.4.2
// Configurable thresholds for different score types and contexts
// Requirements: B.3

import type { ThresholdOptions } from '@/types/recommendation';

// Default thresholds for general visibility scores
export const defaultThresholds: ThresholdOptions = {
  dropThreshold: 0.2,        // >20% Drop in 14 Tagen
  stagnationRange: 0.05,     // <5% Veränderung in 30 Tagen
  minScore: 0,
  maxScore: 100,
  evaluationPeriod: 30,      // Look back 30 days
  minDataPoints: 5           // Need at least 5 data points
};

// Score-type specific thresholds
export const scoreTypeThresholds: Record<string, ThresholdOptions> = {
  // Google Business Profile visibility
  google_visibility: {
    dropThreshold: 0.15,       // More sensitive for Google
    stagnationRange: 0.03,     // Tighter stagnation range
    minScore: 0,
    maxScore: 100,
    evaluationPeriod: 21,      // 3 weeks
    minDataPoints: 7
  },
  
  // Instagram engagement scores
  instagram_engagement: {
    dropThreshold: 0.25,       // Less sensitive for social media
    stagnationRange: 0.08,     // More tolerance for fluctuation
    minScore: 0,
    maxScore: 100,
    evaluationPeriod: 14,      // 2 weeks
    minDataPoints: 5
  },
  
  // Overall visibility composite score
  overall_visibility: {
    dropThreshold: 0.18,
    stagnationRange: 0.04,
    minScore: 0,
    maxScore: 100,
    evaluationPeriod: 28,      // 4 weeks
    minDataPoints: 8
  },
  
  // Review scores
  review_score: {
    dropThreshold: 0.12,       // Very sensitive for reviews
    stagnationRange: 0.02,
    minScore: 0,
    maxScore: 5,               // Review scores are typically 1-5
    evaluationPeriod: 45,      // Longer period for reviews
    minDataPoints: 6
  },
  
  // SEO visibility
  seo_visibility: {
    dropThreshold: 0.22,
    stagnationRange: 0.06,
    minScore: 0,
    maxScore: 100,
    evaluationPeriod: 35,      // SEO changes take time
    minDataPoints: 10
  }
};

// Industry-specific threshold modifiers
export const industryModifiers: Record<string, Partial<ThresholdOptions>> = {
  restaurant: {
    dropThreshold: 0.15,       // Restaurants need quick response
    stagnationRange: 0.03,
    evaluationPeriod: 14
  },
  
  retail: {
    dropThreshold: 0.18,
    stagnationRange: 0.04,
    evaluationPeriod: 21
  },
  
  healthcare: {
    dropThreshold: 0.12,       // Healthcare is reputation-sensitive
    stagnationRange: 0.02,
    evaluationPeriod: 28
  },
  
  professional_services: {
    dropThreshold: 0.20,
    stagnationRange: 0.05,
    evaluationPeriod: 35
  },
  
  hospitality: {
    dropThreshold: 0.14,
    stagnationRange: 0.03,
    evaluationPeriod: 18
  }
};

// Business size modifiers
export const businessSizeModifiers: Record<string, Partial<ThresholdOptions>> = {
  small: {
    dropThreshold: 0.15,       // Small businesses need faster response
    evaluationPeriod: 14
  },
  
  medium: {
    dropThreshold: 0.18,
    evaluationPeriod: 21
  },
  
  large: {
    dropThreshold: 0.22,       // Large businesses can tolerate more variation
    evaluationPeriod: 28
  },
  
  enterprise: {
    dropThreshold: 0.25,
    evaluationPeriod: 35
  }
};

/**
 * Get contextual thresholds based on score type, industry, and business size
 */
export function getContextualThresholds(
  scoreType: string,
  industry?: string,
  businessSize?: string
): ThresholdOptions {
  // Start with default thresholds
  let thresholds = { ...defaultThresholds };
  
  // Apply score-type specific thresholds
  if (scoreTypeThresholds[scoreType]) {
    thresholds = { ...thresholds, ...scoreTypeThresholds[scoreType] };
  }
  
  // Apply industry modifiers
  if (industry && industryModifiers[industry]) {
    thresholds = { ...thresholds, ...industryModifiers[industry] };
  }
  
  // Apply business size modifiers
  if (businessSize && businessSizeModifiers[businessSize]) {
    thresholds = { ...thresholds, ...businessSizeModifiers[businessSize] };
  }
  
  return thresholds;
}

/**
 * Get severity level based on the magnitude of the issue
 */
export function getSeverityLevel(
  scoreChange: number,
  thresholds: ThresholdOptions
): 'low' | 'medium' | 'high' {
  const changeRatio = Math.abs(scoreChange);
  
  if (changeRatio >= thresholds.dropThreshold * 2) {
    return 'high';    // Very significant drop
  } else if (changeRatio >= thresholds.dropThreshold * 1.5) {
    return 'medium';  // Significant drop
  } else {
    return 'low';     // Moderate drop
  }
}

/**
 * Calculate confidence level for trigger based on data quality
 */
export function calculateTriggerConfidence(
  dataPoints: number,
  evaluationPeriod: number,
  scoreVariability: number
): number {
  // Base confidence on data completeness
  const dataCompleteness = Math.min(dataPoints / evaluationPeriod, 1);
  
  // Reduce confidence for high variability
  const variabilityPenalty = Math.min(scoreVariability / 20, 0.5); // Max 50% penalty
  
  // Calculate final confidence (0-1)
  const confidence = Math.max(0.1, dataCompleteness - variabilityPenalty);
  
  return Math.min(1, confidence);
}

/**
 * Validate threshold configuration
 */
export function validateThresholds(thresholds: ThresholdOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (thresholds.dropThreshold <= 0 || thresholds.dropThreshold >= 1) {
    errors.push('dropThreshold must be between 0 and 1');
  }
  
  if (thresholds.stagnationRange <= 0 || thresholds.stagnationRange >= 1) {
    errors.push('stagnationRange must be between 0 and 1');
  }
  
  if (thresholds.minScore >= thresholds.maxScore) {
    errors.push('minScore must be less than maxScore');
  }
  
  if (thresholds.evaluationPeriod && thresholds.evaluationPeriod < 7) {
    errors.push('evaluationPeriod should be at least 7 days');
  }
  
  if (thresholds.minDataPoints && thresholds.minDataPoints < 2) {
    errors.push('minDataPoints should be at least 2');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
/**
 
* Normalize and clamp thresholds to prevent invalid configurations
 */
export function normalizeThresholds(raw: Partial<ThresholdOptions>): ThresholdOptions {
  return {
    dropThreshold: Math.min(1, Math.max(0, raw.dropThreshold ?? 0.2)),
    stagnationRange: Math.min(1, Math.max(0, raw.stagnationRange ?? 0.05)),
    minScore: raw.minScore ?? 0,
    maxScore: raw.maxScore ?? 100,
    evaluationPeriod: Math.max(7, raw.evaluationPeriod ?? 30),
    minDataPoints: Math.max(3, raw.minDataPoints ?? 5)
  };
}