/**
 * Score Evolution Tracking System Types
 * Task 6.4 - Visibility Score Evolution Tracking
 */

export type ScoreType = 
  | 'overall_visibility'
  | 'google_presence'
  | 'social_media'
  | 'review_score'
  | 'local_seo'
  | 'content_quality'
  | 'competitive_position';

export type EventType = 
  | 'score_drop'
  | 'score_spike'
  | 'stagnation'
  | 'improvement'
  | 'benchmark_change'
  | 'algorithm_update';

export type TrendDirection = 'up' | 'down' | 'neutral' | 'volatile';

export type ForecastRange = 7 | 30 | 90;

export interface ScoreHistoryEntry {
  id: string;
  business_id: string;
  score_type: ScoreType;
  score_value: number;
  calculated_at: string; // ISO timestamp
  source: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VisibilityEvent {
  id: string;
  business_id: string;
  event_type: EventType;
  event_description: string;
  score_before?: number;
  score_after?: number;
  change_percentage?: number;
  triggered_at: string;
  source: string;
  meta: Record<string, any>;
  created_at: string;
}

export interface ScoreBenchmark {
  id: string;
  industry_category: string;
  region_code: string;
  score_type: ScoreType;
  benchmark_value: number;
  sample_size: number;
  calculated_at: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreTrendPoint {
  calculated_at: string;
  score_value: number;
  trend_direction: TrendDirection;
}

export interface ScoreAnomaly {
  event_date: string;
  score_before: number;
  score_after: number;
  change_percentage: number;
  anomaly_type: 'spike' | 'drop' | 'normal';
}

export interface ForecastPoint {
  date: string;
  predicted_value: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_level: number; // 0-1
}

export interface ScoreEvolutionData {
  business_id: string;
  score_type: ScoreType;
  current_score: number;
  historical_data: ScoreTrendPoint[];
  forecast_data: ForecastPoint[];
  events: VisibilityEvent[];
  benchmark: ScoreBenchmark | null;
  trend_analysis: TrendAnalysis;
  last_updated: string;
}

export interface TrendAnalysis {
  overall_trend: TrendDirection;
  trend_strength: number; // 0-1
  volatility: number; // 0-1
  momentum: number; // -1 to 1
  days_since_last_change: number;
  average_change_per_week: number;
  best_period: {
    start_date: string;
    end_date: string;
    score_improvement: number;
  } | null;
  worst_period: {
    start_date: string;
    end_date: string;
    score_decline: number;
  } | null;
}

export interface ScoreEvolutionRequest {
  business_id: string;
  score_types: ScoreType[];
  date_range: {
    start_date: string;
    end_date: string;
  };
  include_forecast: boolean;
  forecast_range?: ForecastRange;
  include_benchmarks: boolean;
  include_events: boolean;
}

export interface ScoreEvolutionResponse {
  request_id: string;
  business_id: string;
  generated_at: string;
  data: ScoreEvolutionData[];
  summary: {
    total_score_types: number;
    date_range_days: number;
    data_completeness: number; // 0-1
    forecast_accuracy?: number; // 0-1, if historical forecasts available
  };
  insights: ScoreInsight[];
  recommendations: string[]; // IDs from Task 6.3 system
}

export interface ScoreInsight {
  type: 'trend' | 'anomaly' | 'benchmark' | 'forecast' | 'opportunity';
  title: string;
  description: string;
  score_type: ScoreType;
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  actionable: boolean;
  related_events?: string[]; // Event IDs
  confidence: number; // 0-1
}

export interface ScoreEvolutionConfig {
  update_frequency: 'daily' | 'weekly' | 'monthly';
  anomaly_threshold: number; // Percentage change to trigger anomaly detection
  forecast_method: 'linear_regression' | 'moving_average' | 'exponential_smoothing';
  benchmark_update_frequency: 'weekly' | 'monthly' | 'quarterly';
  retention_period_days: number;
  alert_thresholds: {
    score_drop: number;
    stagnation_days: number;
    volatility_threshold: number;
  };
}

// Chart configuration types
export interface ChartDataPoint {
  date: string;
  value: number;
  type: 'historical' | 'forecast';
  confidence?: number;
  event?: VisibilityEvent;
}

export interface ChartConfig {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    line: string;
    forecast: string;
    confidence: string;
    events: Record<EventType, string>;
    benchmark: string;
  };
  show_confidence_interval: boolean;
  show_events: boolean;
  show_benchmark: boolean;
  animate_transitions: boolean;
}

// Filter and display options
export interface ScoreEvolutionFilters {
  score_types: ScoreType[];
  date_range: {
    start: string;
    end: string;
  };
  show_forecast: boolean;
  forecast_range: ForecastRange;
  show_benchmarks: boolean;
  show_events: boolean;
  event_types: EventType[];
  granularity: 'daily' | 'weekly' | 'monthly';
}

export interface ScoreEvolutionDisplayOptions {
  chart_type: 'line' | 'area' | 'candlestick';
  comparison_mode: 'single' | 'multiple' | 'benchmark';
  highlight_anomalies: boolean;
  show_trend_lines: boolean;
  show_moving_average: boolean;
  moving_average_period: number;
}

// API response types
export interface ScoreHistoryApiResponse {
  data: ScoreHistoryEntry[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface VisibilityEventsApiResponse {
  data: VisibilityEvent[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface BenchmarkApiResponse {
  data: ScoreBenchmark[];
  industry_categories: string[];
  regions: string[];
  last_updated: string;
}

// Error types
export class ScoreEvolutionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ScoreEvolutionError';
  }
}

export class ForecastingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ForecastingError';
  }
}

export class BenchmarkError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'BenchmarkError';
  }
}

// Utility types
export type ScoreEvolutionHook = {
  data: ScoreEvolutionData[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<ScoreEvolutionFilters>) => void;
};

export type ScoreEvolutionContextType = {
  config: ScoreEvolutionConfig;
  filters: ScoreEvolutionFilters;
  displayOptions: ScoreEvolutionDisplayOptions;
  updateConfig: (config: Partial<ScoreEvolutionConfig>) => void;
  updateFilters: (filters: Partial<ScoreEvolutionFilters>) => void;
  updateDisplayOptions: (options: Partial<ScoreEvolutionDisplayOptions>) => void;
};

// Constants
export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  overall_visibility: 'Gesamtsichtbarkeit',
  google_presence: 'Google Präsenz',
  social_media: 'Social Media',
  review_score: 'Bewertungen',
  local_seo: 'Lokale SEO',
  content_quality: 'Content Qualität',
  competitive_position: 'Wettbewerbsposition'
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  score_drop: 'Score-Rückgang',
  score_spike: 'Score-Anstieg',
  stagnation: 'Stagnation',
  improvement: 'Verbesserung',
  benchmark_change: 'Benchmark-Änderung',
  algorithm_update: 'Algorithmus-Update'
};

export const TREND_DIRECTION_LABELS: Record<TrendDirection, string> = {
  up: 'Aufwärtstrend',
  down: 'Abwärtstrend',
  neutral: 'Stabil',
  volatile: 'Volatil'
};

export const DEFAULT_SCORE_EVOLUTION_CONFIG: ScoreEvolutionConfig = {
  update_frequency: 'daily',
  anomaly_threshold: 20,
  forecast_method: 'linear_regression',
  benchmark_update_frequency: 'monthly',
  retention_period_days: 365,
  alert_thresholds: {
    score_drop: 15,
    stagnation_days: 14,
    volatility_threshold: 30
  }
};

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  width: 800,
  height: 400,
  margin: { top: 20, right: 30, bottom: 40, left: 40 },
  colors: {
    line: '#3b82f6',
    forecast: '#94a3b8',
    confidence: '#e2e8f0',
    events: {
      score_drop: '#ef4444',
      score_spike: '#22c55e',
      stagnation: '#f59e0b',
      improvement: '#10b981',
      benchmark_change: '#8b5cf6',
      algorithm_update: '#f97316'
    },
    benchmark: '#6b7280'
  },
  show_confidence_interval: true,
  show_events: true,
  show_benchmark: true,
  animate_transitions: true
};