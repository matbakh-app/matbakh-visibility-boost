// Types for Score History System
// Task: 6.4.1 Create ScoreHistory Database Schema
// Requirements: B.1, B.2

export type ScoreType = 
  | 'overall_visibility'
  | 'google_presence'
  | 'social_media'
  | 'website_performance'
  | 'review_management'
  | 'local_seo'
  | 'content_quality'
  | 'competitive_position';

export type ScoreSource = 
  | 'visibility_check'
  | 'manual_entry'
  | 'automated_analysis'
  | 'competitive_benchmarking'
  | 'swot_analysis';

export interface ScoreHistoryRecord {
  id: string;
  business_id: string;
  score_type: ScoreType;
  score_value: number;
  calculated_at: string;
  source: ScoreSource;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ScoreHistoryInsert {
  business_id: string;
  score_type: ScoreType;
  score_value: number;
  calculated_at?: string;
  source: ScoreSource;
  meta?: Record<string, any>;
}

export interface ScoreHistoryUpdate {
  score_value?: number;
  calculated_at?: string;
  source?: ScoreSource;
  meta?: Record<string, any>;
}

export interface ScoreHistoryQuery {
  business_id?: string;
  score_type?: ScoreType | ScoreType[];
  source?: ScoreSource | ScoreSource[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ScoreEvolutionData {
  score_type: ScoreType;
  data_points: Array<{
    date: string;
    score: number;
    source: ScoreSource;
    confidence?: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
  period_days: number;
}

export interface ScoreHistoryAnalytics {
  business_id: string;
  overall_trend: 'improving' | 'declining' | 'stable';
  score_evolution: ScoreEvolutionData[];
  key_insights: string[];
  recommendations: string[];
  last_updated: string;
}

// Database table interface for type safety
export interface ScoreHistoryTable {
  Row: ScoreHistoryRecord;
  Insert: ScoreHistoryInsert;
  Update: ScoreHistoryUpdate;
}

// Additional types for TrendChart component (Task 6.4.2.1)
export interface ScorePoint {
  date: string; // ISO Date string
  score_value: number;
  score_type: ScoreType;
  business_id: string;
}

// Enhanced Event System - Task 6.4.2.4.1
export type EventType = 
  | 'google_algorithm_update'
  | 'social_media_campaign'
  | 'review_spike'
  | 'visibility_dip'
  | 'seo_optimization'
  | 'platform_feature'
  | 'seasonal_event'
  | 'manual_annotation';

export interface VisibilityEvent {
  id: string;
  date: string; // ISO Date string
  title: string;
  type: EventType;
  description?: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

// Legacy support - will be deprecated
export interface LegacyVisibilityEvent {
  date: string; // ISO Date string
  label: string;
  type: 'campaign' | 'algorithm' | 'reviews' | 'other';
}

// TrendFilters Types (Task 6.4.2.3)
export interface TrendFilters {
  scoreType: ScoreType;
  dateRange: {
    from: Date;
    to: Date;
  };
  businessUnit?: string;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getDates: () => { from: Date; to: Date };
}

export interface BusinessUnit {
  id: string;
  name: string;
}