// Forecast Types - Task 6.4.3.1
// Type definitions for forecasting system
// Requirements: B.3

export type ForecastRange = 7 | 30 | 90;

export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface ForecastPoint {
  date: string; // ISO Date
  predicted_score: number;
  confidence_lower: number;
  confidence_upper: number;
}

export interface ScorePoint {
  date: string; // ISO Date
  score_value: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: number; // 0-1, where 1 is very strong trend
  slope: number; // points per day
  r_squared: number; // correlation coefficient
  volatility: number; // standard deviation of residuals
}

export interface ForecastResult {
  forecast_points: ForecastPoint[];
  trend_analysis: TrendAnalysis;
  confidence_level: number; // 0-1
  forecast_range_days: ForecastRange;
  generated_at: string;
}

export interface ForecastOptions {
  confidenceLevel?: number; // Default 0.95 for 95% confidence
  minDataPoints?: number; // Default 5
  maxDataPoints?: number; // Default 365
}