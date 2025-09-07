// Forecasting Engine - Task 6.4.3.1
// Linear regression forecasting for visibility score projections
// Requirements: B.3

import type { ScorePoint } from '@/types/score-history';

export type ForecastRange = 7 | 30 | 90;

export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface ForecastPoint {
  date: string;
  predicted_score: number;
  confidence_lower: number;
  confidence_upper: number;
  is_forecast: true;
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

// Linear regression implementation
class LinearRegression {
  private slope: number = 0;
  private intercept: number = 0;
  private rSquared: number = 0;
  private residuals: number[] = [];

  fit(x: number[], y: number[]): void {
    if (x.length !== y.length || x.length < 2) {
      throw new Error('Invalid data for linear regression');
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    // Calculate slope and intercept
    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    
    this.residuals = y.map((val, i) => val - this.predict(x[i]));
    const residualSumSquares = this.residuals.reduce((sum, val) => sum + val * val, 0);
    
    this.rSquared = 1 - (residualSumSquares / totalSumSquares);
  }

  predict(x: number): number {
    return this.slope * x + this.intercept;
  }

  getSlope(): number {
    return this.slope;
  }

  getIntercept(): number {
    return this.intercept;
  }

  getRSquared(): number {
    return this.rSquared;
  }

  getResiduals(): number[] {
    return [...this.residuals];
  }

  getStandardError(): number {
    if (this.residuals.length < 2) return 0;
    const variance = this.residuals.reduce((sum, val) => sum + val * val, 0) / (this.residuals.length - 2);
    return Math.sqrt(variance);
  }
}

// Main forecasting engine
export class ForecastingEngine {
  private static readonly MIN_DATA_POINTS = 5;
  private static readonly MAX_DATA_POINTS = 365; // Limit to 1 year of data
  private static readonly CONFIDENCE_INTERVAL = 1.96; // 95% confidence

  /**
   * Generate forecast for visibility scores
   */
  static generateForecast(
    historicalData: ScorePoint[],
    forecastDays: ForecastRange = 30
  ): ForecastResult {
    // Validate input data
    if (historicalData.length < this.MIN_DATA_POINTS) {
      throw new Error(`Insufficient data points. Need at least ${this.MIN_DATA_POINTS}, got ${historicalData.length}`);
    }

    // Sort data by date and limit to recent data
    const sortedData = [...historicalData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-this.MAX_DATA_POINTS);

    // Prepare data for regression
    const baseDate = new Date(sortedData[0].date).getTime();
    const xValues = sortedData.map(point => 
      (new Date(point.date).getTime() - baseDate) / (1000 * 60 * 60 * 24) // Days since start
    );
    const yValues = sortedData.map(point => point.score_value);

    // Fit linear regression model
    const regression = new LinearRegression();
    regression.fit(xValues, yValues);

    // Generate trend analysis
    const trendAnalysis = this.analyzeTrend(regression, yValues);

    // Generate forecast points
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    const forecastPoints = this.generateForecastPoints(
      regression,
      lastDate,
      forecastDays,
      baseDate
    );

    // Calculate overall confidence
    const confidence = this.calculateConfidence(regression, sortedData.length);

    return {
      forecast_points: forecastPoints,
      trend_analysis: trendAnalysis,
      confidence_level: confidence,
      forecast_range_days: forecastDays,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Analyze trend direction and strength
   */
  private static analyzeTrend(regression: LinearRegression, yValues: number[]): TrendAnalysis {
    const slope = regression.getSlope();
    const rSquared = regression.getRSquared();
    const residuals = regression.getResiduals();
    
    // Calculate volatility (standard deviation of residuals)
    const volatility = Math.sqrt(
      residuals.reduce((sum, val) => sum + val * val, 0) / residuals.length
    );

    // Determine trend direction
    let direction: TrendDirection = 'stable';
    const slopeThreshold = 0.1; // Minimum slope to consider as trend
    
    if (Math.abs(slope) > slopeThreshold) {
      direction = slope > 0 ? 'rising' : 'falling';
    }

    // Calculate trend strength (0-1)
    // Based on R-squared and slope magnitude
    const slopeStrength = Math.min(Math.abs(slope) / 2, 1); // Normalize slope
    const strength = rSquared * slopeStrength;

    return {
      direction,
      strength: Math.max(0, Math.min(1, strength)),
      slope,
      r_squared: rSquared,
      volatility
    };
  }

  /**
   * Generate forecast points with confidence intervals
   */
  private static generateForecastPoints(
    regression: LinearRegression,
    lastDate: Date,
    forecastDays: ForecastRange,
    baseDate: number
  ): ForecastPoint[] {
    const points: ForecastPoint[] = [];
    const standardError = regression.getStandardError();
    
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Calculate x value for regression
      const xValue = (forecastDate.getTime() - baseDate) / (1000 * 60 * 60 * 24);
      
      // Predict score
      const predictedScore = regression.predict(xValue);
      
      // Calculate confidence interval
      // Confidence interval widens with distance from training data
      const distanceFactor = Math.sqrt(1 + (i / forecastDays)); // Increases uncertainty over time
      const marginOfError = this.CONFIDENCE_INTERVAL * standardError * distanceFactor;
      
      points.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted_score: Math.max(0, Math.min(100, predictedScore)), // Clamp to 0-100
        confidence_lower: Math.max(0, predictedScore - marginOfError),
        confidence_upper: Math.min(100, predictedScore + marginOfError),
        is_forecast: true
      });
    }

    return points;
  }

  /**
   * Calculate overall forecast confidence
   */
  private static calculateConfidence(regression: LinearRegression, dataPoints: number): number {
    const rSquared = regression.getRSquared();
    const dataQuality = Math.min(dataPoints / 30, 1); // More data = higher confidence
    
    // Combine R-squared with data quality
    return Math.max(0, Math.min(1, rSquared * 0.7 + dataQuality * 0.3));
  }

  /**
   * Detect significant changes in trend
   */
  static detectTrendChanges(
    historicalData: ScorePoint[],
    windowSize: number = 14
  ): Array<{
    date: string;
    change_type: 'acceleration' | 'deceleration' | 'reversal';
    magnitude: number;
    confidence: number;
  }> {
    if (historicalData.length < windowSize * 2) {
      return [];
    }

    const changes: Array<{
      date: string;
      change_type: 'acceleration' | 'deceleration' | 'reversal';
      magnitude: number;
      confidence: number;
    }> = [];

    const sortedData = [...historicalData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sliding window analysis
    for (let i = windowSize; i < sortedData.length - windowSize; i++) {
      const beforeWindow = sortedData.slice(i - windowSize, i);
      const afterWindow = sortedData.slice(i, i + windowSize);

      // Calculate trends for both windows
      const beforeTrend = this.calculateWindowTrend(beforeWindow);
      const afterTrend = this.calculateWindowTrend(afterWindow);

      // Detect significant changes
      const slopeDifference = afterTrend.slope - beforeTrend.slope;
      const magnitudeThreshold = 0.2; // Minimum change to consider significant

      if (Math.abs(slopeDifference) > magnitudeThreshold) {
        let changeType: 'acceleration' | 'deceleration' | 'reversal';
        
        if (beforeTrend.slope > 0 && afterTrend.slope < 0) {
          changeType = 'reversal';
        } else if (beforeTrend.slope < 0 && afterTrend.slope > 0) {
          changeType = 'reversal';
        } else if (Math.abs(afterTrend.slope) > Math.abs(beforeTrend.slope)) {
          changeType = 'acceleration';
        } else {
          changeType = 'deceleration';
        }

        const confidence = Math.min(beforeTrend.r_squared, afterTrend.r_squared);

        changes.push({
          date: sortedData[i].date,
          change_type: changeType,
          magnitude: Math.abs(slopeDifference),
          confidence
        });
      }
    }

    return changes;
  }

  /**
   * Calculate trend for a data window
   */
  private static calculateWindowTrend(data: ScorePoint[]): { slope: number; r_squared: number } {
    if (data.length < 2) {
      return { slope: 0, r_squared: 0 };
    }

    const baseDate = new Date(data[0].date).getTime();
    const xValues = data.map(point => 
      (new Date(point.date).getTime() - baseDate) / (1000 * 60 * 60 * 24)
    );
    const yValues = data.map(point => point.score_value);

    const regression = new LinearRegression();
    regression.fit(xValues, yValues);

    return {
      slope: regression.getSlope(),
      r_squared: regression.getRSquared()
    };
  }

  /**
   * Get forecast summary for UI display
   */
  static getForecastSummary(forecast: ForecastResult): {
    trend_description: string;
    confidence_description: string;
    key_insights: string[];
    recommended_actions: string[];
  } {
    const { trend_analysis, confidence_level, forecast_points } = forecast;
    
    // Trend description
    let trendDescription = '';
    switch (trend_analysis.direction) {
      case 'rising':
        trendDescription = `Aufwärtstrend (${(trend_analysis.slope * 30).toFixed(1)} Punkte/Monat)`;
        break;
      case 'falling':
        trendDescription = `Abwärtstrend (${(Math.abs(trend_analysis.slope) * 30).toFixed(1)} Punkte/Monat)`;
        break;
      case 'stable':
        trendDescription = 'Stabiler Verlauf';
        break;
    }

    // Confidence description
    let confidenceDescription = '';
    if (confidence_level > 0.8) {
      confidenceDescription = 'Hohe Vorhersagegenauigkeit';
    } else if (confidence_level > 0.6) {
      confidenceDescription = 'Mittlere Vorhersagegenauigkeit';
    } else {
      confidenceDescription = 'Niedrige Vorhersagegenauigkeit';
    }

    // Key insights
    const insights: string[] = [];
    const lastForecast = forecast_points[forecast_points.length - 1];
    const firstForecast = forecast_points[0];
    const totalChange = lastForecast.predicted_score - firstForecast.predicted_score;

    if (Math.abs(totalChange) > 5) {
      insights.push(`Erwartete Änderung: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} Punkte`);
    }

    if (trend_analysis.volatility > 5) {
      insights.push('Hohe Schwankungsbreite erkannt');
    }

    if (trend_analysis.strength > 0.7) {
      insights.push('Starker Trend mit hoher Wahrscheinlichkeit');
    }

    // Recommended actions
    const actions: string[] = [];
    if (trend_analysis.direction === 'falling' && trend_analysis.strength > 0.5) {
      actions.push('Sofortige Maßnahmen zur Trendumkehr empfohlen');
    }
    
    if (confidence_level < 0.6) {
      actions.push('Mehr Daten sammeln für bessere Vorhersagen');
    }

    if (trend_analysis.volatility > 10) {
      actions.push('Stabilisierungsmaßnahmen prüfen');
    }

    return {
      trend_description: trendDescription,
      confidence_description: confidenceDescription,
      key_insights: insights,
      recommended_actions: actions
    };
  }
}

export default ForecastingEngine;