// Forecast Engine - Task 6.4.3.1
// Core logic for linear regression and score prediction
// Requirements: B.3

import type { ScorePoint, ForecastPoint, ForecastRange, TrendAnalysis, ForecastResult, ForecastOptions } from './types';
import {
  calculateTrendDirection,
  calculateConfidenceInterval,
  calculateVariance,
  interpolateMissingData,
  smoothData,
  detectOutliers,
  calculateDataQuality,
  generateDateSequence,
  validateForecastData
} from './forecastUtils';

/**
 * Simple Linear Regression implementation
 */
class LinearRegression {
  private slope: number = 0;
  private intercept: number = 0;
  private rSquared: number = 0;
  private residuals: number[] = [];
  private standardError: number = 0;

  /**
   * Fit the regression model to the data
   */
  fit(x: number[], y: number[]): void {
    if (x.length !== y.length || x.length < 2) {
      throw new Error('Invalid data for linear regression');
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    // Calculate slope and intercept using least squares method
    const denominator = n * sumXX - sumX * sumX;
    
    if (Math.abs(denominator) < 1e-10) {
      // Handle case where all x values are the same
      this.slope = 0;
      this.intercept = sumY / n;
    } else {
      this.slope = (n * sumXY - sumX * sumY) / denominator;
      this.intercept = (sumY - this.slope * sumX) / n;
    }

    // Calculate R-squared and residuals
    const yMean = sumY / n;
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    this.residuals = [];
    
    for (let i = 0; i < n; i++) {
      const predicted = this.predict(x[i]);
      const residual = y[i] - predicted;
      
      this.residuals.push(residual);
      totalSumSquares += Math.pow(y[i] - yMean, 2);
      residualSumSquares += residual * residual;
    }

    this.rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    
    // Calculate standard error
    this.standardError = n > 2 ? Math.sqrt(residualSumSquares / (n - 2)) : 0;
  }

  /**
   * Predict y value for given x
   */
  predict(x: number): number {
    return this.slope * x + this.intercept;
  }

  /**
   * Get regression statistics
   */
  getStats() {
    return {
      slope: this.slope,
      intercept: this.intercept,
      rSquared: this.rSquared,
      standardError: this.standardError,
      residuals: [...this.residuals]
    };
  }
}

/**
 * Main Forecast Engine
 */
export class ForecastEngine {
  private static readonly DEFAULT_OPTIONS: Required<ForecastOptions> = {
    confidenceLevel: 0.95,
    minDataPoints: 5,
    maxDataPoints: 365
  };

  /**
   * Generate forecast for visibility scores
   * @param data Historical score data
   * @param days Number of days to forecast (7, 30, or 90)
   * @param options Forecast options
   * @returns Array of forecast points or empty array if insufficient data
   */
  static generateForecast(
    data: ScorePoint[],
    days: ForecastRange,
    options: ForecastOptions = {}
  ): ForecastPoint[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Validate input data
    const validation = validateForecastData(data, opts.minDataPoints);
    if (!validation.isValid) {
      console.warn('Forecast validation failed:', validation.errors);
      return []; // Return empty array instead of throwing
    }

    try {
      // Prepare and clean data
      const processedData = this.preprocessData(data, opts.maxDataPoints);
      
      if (processedData.length < opts.minDataPoints) {
        return [];
      }

      // Fit regression model
      const regression = this.fitRegressionModel(processedData);
      
      // Generate forecast points
      const lastDate = processedData[processedData.length - 1].date;
      const forecastDates = generateDateSequence(lastDate, days);
      const baseDate = new Date(processedData[0].date).getTime();
      
      const forecastPoints: ForecastPoint[] = [];
      const stats = regression.getStats();
      const trendDirection = calculateTrendDirection(stats.slope);

      forecastDates.forEach((date, index) => {
        const daysSinceStart = (new Date(date).getTime() - baseDate) / (1000 * 60 * 60 * 24);
        const predictedValue = regression.predict(daysSinceStart);
        
        // Calculate confidence interval with increasing uncertainty over time
        const distanceFactor = Math.sqrt(1 + (index + 1) / days);
        const confidence = calculateConfidenceInterval(
          predictedValue,
          stats.standardError,
          opts.confidenceLevel,
          distanceFactor
        );

        forecastPoints.push({
          date,
          forecast_value: Math.max(0, Math.min(100, predictedValue)),
          confidence_low: confidence.low,
          confidence_high: confidence.high,
          trend: trendDirection
        });
      });

      return forecastPoints;
      
    } catch (error) {
      console.error('Error generating forecast:', error);
      return [];
    }
  }

  /**
   * Preprocess data: sort, limit, clean outliers, smooth
   */
  private static preprocessData(data: ScorePoint[], maxPoints: number): ScorePoint[] {
    // Sort by date
    let processed = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Limit to recent data
    if (processed.length > maxPoints) {
      processed = processed.slice(-maxPoints);
    }
    
    // Interpolate missing data points
    processed = interpolateMissingData(processed);
    
    // Remove extreme outliers (optional, can be disabled for more conservative approach)
    const { cleaned } = detectOutliers(processed);
    if (cleaned.length >= processed.length * 0.8) { // Only use cleaned data if we don't lose too much
      processed = cleaned;
    }
    
    // Light smoothing to reduce noise (optional)
    if (processed.length > 10) {
      processed = smoothData(processed, 3);
    }
    
    return processed;
  }

  /**
   * Fit linear regression model to processed data
   */
  private static fitRegressionModel(data: ScorePoint[]): LinearRegression {
    const baseDate = new Date(data[0].date).getTime();
    
    const xValues = data.map(point => 
      (new Date(point.date).getTime() - baseDate) / (1000 * 60 * 60 * 24)
    );
    const yValues = data.map(point => point.score_value);
    
    const regression = new LinearRegression();
    regression.fit(xValues, yValues);
    
    return regression;
  }

  /**
   * Analyze trend from historical data
   */
  static analyzeTrend(data: ScorePoint[]): TrendAnalysis {
    if (data.length < 2) {
      return {
        direction: 'flat',
        strength: 0,
        slope: 0,
        r_squared: 0,
        volatility: 0
      };
    }

    try {
      const processedData = this.preprocessData(data, this.DEFAULT_OPTIONS.maxDataPoints);
      const regression = this.fitRegressionModel(processedData);
      const stats = regression.getStats();
      
      const direction = calculateTrendDirection(stats.slope);
      const { stdDev } = calculateVariance(stats.residuals);
      
      // Calculate trend strength based on R-squared and slope magnitude
      const slopeStrength = Math.min(Math.abs(stats.slope) / 2, 1);
      const strength = Math.max(0, Math.min(1, stats.rSquared * slopeStrength));

      return {
        direction,
        strength,
        slope: stats.slope,
        r_squared: stats.rSquared,
        volatility: stdDev
      };
      
    } catch (error) {
      console.error('Error analyzing trend:', error);
      return {
        direction: 'flat',
        strength: 0,
        slope: 0,
        r_squared: 0,
        volatility: 0
      };
    }
  }

  /**
   * Get data quality assessment
   */
  static assessDataQuality(data: ScorePoint[]) {
    return calculateDataQuality(data);
  }

  /**
   * Generate comprehensive forecast result with metadata
   */
  static generateComprehensiveForecast(
    data: ScorePoint[],
    days: ForecastRange,
    options: ForecastOptions = {}
  ): ForecastResult {
    const forecastPoints = this.generateForecast(data, days, options);
    const trendAnalysis = this.analyzeTrend(data);
    const dataQuality = this.assessDataQuality(data);
    
    return {
      forecast_points: forecastPoints,
      trend_analysis: trendAnalysis,
      confidence_level: dataQuality.score,
      forecast_range_days: days,
      generated_at: new Date().toISOString()
    };
  }
}

// Export default for convenience
export default ForecastEngine;