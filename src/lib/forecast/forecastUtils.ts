// Forecast Utilities - Task 6.4.3.1
// Helper functions for trend analysis, variance calculation, and interpolation
// Requirements: B.3

import type { ScorePoint, TrendDirection, TrendAnalysis } from './types';

/**
 * Calculate trend direction based on slope
 */
export const calculateTrendDirection = (slope: number): TrendDirection => {
  const dailyChangeThreshold = 0.033; // ~1% per month = 0.033% per day
  
  if (slope > dailyChangeThreshold) {
    return 'up';
  } else if (slope < -dailyChangeThreshold) {
    return 'down';
  } else {
    return 'flat';
  }
};

/**
 * Calculate confidence interval based on standard error and confidence level
 */
export const calculateConfidenceInterval = (
  predictedValue: number,
  standardError: number,
  confidenceLevel: number = 0.95,
  distanceFactor: number = 1
): { low: number; high: number } => {
  // Z-score for confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  
  const zScore = zScores[confidenceLevel] || 1.96;
  const marginOfError = zScore * standardError * distanceFactor;
  
  return {
    low: Math.max(0, predictedValue - marginOfError),
    high: Math.min(100, predictedValue + marginOfError)
  };
};

/**
 * Calculate variance and standard deviation of residuals
 */
export const calculateVariance = (residuals: number[]): { variance: number; stdDev: number } => {
  if (residuals.length === 0) {
    return { variance: 0, stdDev: 0 };
  }
  
  const mean = residuals.reduce((sum, val) => sum + val, 0) / residuals.length;
  const variance = residuals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / residuals.length;
  const stdDev = Math.sqrt(variance);
  
  return { variance, stdDev };
};

/**
 * Interpolate missing data points using linear interpolation
 */
export const interpolateMissingData = (data: ScorePoint[]): ScorePoint[] => {
  if (data.length < 2) return data;
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const interpolated: ScorePoint[] = [];
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    interpolated.push(sortedData[i]);
    
    const currentDate = new Date(sortedData[i].date);
    const nextDate = new Date(sortedData[i + 1].date);
    const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If there's a gap of more than 1 day, interpolate
    if (daysDiff > 1) {
      const currentValue = sortedData[i].score_value;
      const nextValue = sortedData[i + 1].score_value;
      const valueStep = (nextValue - currentValue) / daysDiff;
      
      for (let j = 1; j < daysDiff; j++) {
        const interpolatedDate = new Date(currentDate);
        interpolatedDate.setDate(interpolatedDate.getDate() + j);
        
        interpolated.push({
          date: interpolatedDate.toISOString().split('T')[0],
          score_value: currentValue + (valueStep * j)
        });
      }
    }
  }
  
  // Add the last point
  interpolated.push(sortedData[sortedData.length - 1]);
  
  return interpolated;
};

/**
 * Smooth data using simple moving average
 */
export const smoothData = (data: ScorePoint[], windowSize: number = 3): ScorePoint[] => {
  if (data.length < windowSize || windowSize < 2) return data;
  
  const smoothed: ScorePoint[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    
    const window = data.slice(start, end);
    const average = window.reduce((sum, point) => sum + point.score_value, 0) / window.length;
    
    smoothed.push({
      ...data[i],
      score_value: average
    });
  }
  
  return smoothed;
};

/**
 * Detect outliers using IQR method
 */
export const detectOutliers = (data: ScorePoint[]): { outliers: ScorePoint[]; cleaned: ScorePoint[] } => {
  if (data.length < 4) return { outliers: [], cleaned: data };
  
  const values = data.map(point => point.score_value).sort((a, b) => a - b);
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers: ScorePoint[] = [];
  const cleaned: ScorePoint[] = [];
  
  data.forEach(point => {
    if (point.score_value < lowerBound || point.score_value > upperBound) {
      outliers.push(point);
    } else {
      cleaned.push(point);
    }
  });
  
  return { outliers, cleaned };
};

/**
 * Calculate data quality score
 */
export const calculateDataQuality = (data: ScorePoint[]): {
  score: number; // 0-1
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let qualityScore = 1.0;
  
  // Check data quantity
  if (data.length < 10) {
    issues.push('Wenige Datenpunkte verfügbar');
    recommendations.push('Mehr historische Daten sammeln für bessere Vorhersagen');
    qualityScore -= 0.3;
  }
  
  // Check for gaps in data
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let gapCount = 0;
  
  for (let i = 1; i < sortedData.length; i++) {
    const prevDate = new Date(sortedData[i - 1].date);
    const currDate = new Date(sortedData[i].date);
    const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 2) { // Gap of more than 2 days
      gapCount++;
    }
  }
  
  if (gapCount > data.length * 0.1) { // More than 10% gaps
    issues.push('Lücken in den historischen Daten');
    recommendations.push('Regelmäßigere Datenerfassung implementieren');
    qualityScore -= 0.2;
  }
  
  // Check for outliers
  const { outliers } = detectOutliers(data);
  if (outliers.length > data.length * 0.05) { // More than 5% outliers
    issues.push('Ungewöhnliche Schwankungen in den Daten');
    recommendations.push('Datenqualität und Messverfahren überprüfen');
    qualityScore -= 0.1;
  }
  
  // Check variance
  const values = data.map(point => point.score_value);
  const { stdDev } = calculateVariance(values.map((val, i, arr) => val - (arr[i - 1] || val)));
  
  if (stdDev > 15) { // High volatility
    issues.push('Hohe Volatilität in den Daten');
    recommendations.push('Stabilisierungsmaßnahmen in Betracht ziehen');
    qualityScore -= 0.1;
  }
  
  return {
    score: Math.max(0, qualityScore),
    issues,
    recommendations
  };
};

/**
 * Format date for consistent display
 */
export const formatForecastDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Generate date sequence for forecast
 */
export const generateDateSequence = (startDate: string | Date, days: number): string[] => {
  const dates: string[] = [];
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(formatForecastDate(date));
  }
  
  return dates;
};

/**
 * Validate forecast input data
 */
export const validateForecastData = (data: ScorePoint[], minPoints: number = 5): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Daten müssen ein Array sein');
    return { isValid: false, errors };
  }
  
  if (data.length < minPoints) {
    errors.push(`Mindestens ${minPoints} Datenpunkte erforderlich, ${data.length} vorhanden`);
  }
  
  // Check data format
  data.forEach((point, index) => {
    if (!point.date || !point.score_value) {
      errors.push(`Datenpunkt ${index + 1}: Fehlende date oder score_value`);
    }
    
    if (typeof point.score_value !== 'number' || isNaN(point.score_value)) {
      errors.push(`Datenpunkt ${index + 1}: score_value muss eine gültige Zahl sein`);
    }
    
    if (point.score_value < 0 || point.score_value > 100) {
      errors.push(`Datenpunkt ${index + 1}: score_value muss zwischen 0 und 100 liegen`);
    }
    
    if (isNaN(new Date(point.date).getTime())) {
      errors.push(`Datenpunkt ${index + 1}: Ungültiges Datumsformat`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};