// Chart Utilities - Extracted Common Patterns
// Consolidates formatDate, tooltip helpers, and chart data patterns

import type { ScorePoint } from '@/types/score-history';

// ===== DATE FORMATTING =====

/**
 * Format date for German locale display (DD.MM format)
 * Used in: ForecastChart, TrendChart, ScoreEvolutionChart
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit'
  });
};

/**
 * Format date for HTML input fields (YYYY-MM-DD format)
 * Used in: TrendFilters
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format date for detailed display with weekday
 * Used in: Tooltip components
 */
export const formatDateDetailed = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

// ===== CHART DATA HELPERS =====

/**
 * Base chart data point interface
 */
export interface BaseChartDataPoint {
  date: string;
  [key: string]: any;
}

/**
 * Sort chart data by date (ascending)
 */
export const sortChartDataByDate = <T extends BaseChartDataPoint>(data: T[]): T[] => {
  return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get previous score for change calculation
 * Used in: Multiple tooltip components
 */
export const getPreviousScore = (data: ScorePoint[], currentDate: string): number | undefined => {
  const currentIndex = data.findIndex(point => point.date === currentDate);
  if (currentIndex > 0) {
    return data[currentIndex - 1].score_value;
  }
  return undefined;
};

// ===== TOOLTIP HELPERS =====

/**
 * Base tooltip props interface
 */
export interface BaseTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

/**
 * Check if tooltip should be rendered
 */
export const shouldRenderTooltip = ({ active, payload }: BaseTooltipProps): boolean => {
  return !!(active && payload && payload.length);
};

/**
 * Generate tooltip content wrapper classes
 */
export const getTooltipWrapperClasses = (): string => {
  return "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-lg max-w-sm";
};

/**
 * Generate tooltip date header
 */
export const generateTooltipDateHeader = (label: string): string => {
  return `📅 ${formatDateDetailed(label)}`;
};

// ===== SCORE HELPERS =====

/**
 * Get score color based on value
 * Used in: Multiple chart components
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Get score background color for cards/badges
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 border-green-200';
  if (score >= 60) return 'bg-yellow-100 border-yellow-200';
  return 'bg-red-100 border-red-200';
};

// ===== CHART CONFIGURATION =====

/**
 * Standard chart margins for consistency
 */
export const CHART_MARGINS = {
  default: { top: 20, right: 30, left: 20, bottom: 40 },
  compact: { top: 5, right: 5, left: 5, bottom: 5 },
  detailed: { top: 20, right: 50, left: 50, bottom: 60 }
};

/**
 * Standard chart colors
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981', 
  accent: '#f59e0b',
  muted: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

/**
 * Common chart axis configuration
 */
export const getAxisConfig = () => ({
  tick: { fontSize: 12 },
  axisLine: { stroke: '#e0e0e0' },
  tickLine: { stroke: '#e0e0e0' }
});

/**
 * Common grid configuration
 */
export const getGridConfig = () => ({
  strokeDasharray: "3 3",
  stroke: "#f0f0f0"
});