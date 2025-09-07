// Recommendation Types - Task 6.4.4.2
// Type definitions for recommendation trigger system
// Requirements: B.3, B.4

export type TriggerReason = 'drop' | 'stagnation' | null;

export type TriggerAction = 
  | 'review_google' 
  | 'check_ig' 
  | 'update_content'
  | 'improve_seo'
  | 'boost_reviews'
  | 'optimize_website'
  | null;

export interface RecommendationTriggerResult {
  triggered: boolean;
  reason: TriggerReason;
  action: TriggerAction;
  severity?: 'low' | 'medium' | 'high';
  confidence?: number; // 0-1
  metadata?: {
    scoreChange?: number;
    timeframe?: string;
    threshold?: number;
    previousScore?: number;
    currentScore?: number;
  };
}

export interface ThresholdOptions {
  dropThreshold: number;        // >20% Drop in 14 Tagen
  stagnationRange: number;      // <5% Veränderung in 30 Tagen
  minScore: number;             // Minimum score to consider
  maxScore: number;             // Maximum score to consider
  minDataPoints: number;        // Minimum data points required
  severityThresholds: {
    high: number;               // >30% drop = high severity
    medium: number;             // >15% drop = medium severity
    low: number;                // >5% drop = low severity
  };
}

export interface TriggeredRecommendation {
  id: string;
  scoreType: string;
  trigger: RecommendationTriggerResult;
  recommendation: {
    title: string;
    description: string;
    actionItems: string[];
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    timeToImplement: string;
  };
  generatedAt: string;
}

// Integration with existing goal recommendations
export interface ScoreBasedRecommendationContext {
  scoreType: string;
  businessId?: string;
  currentScore: number;
  previousScore?: number;
  trend: 'up' | 'down' | 'flat';
  timeframe: string;
}