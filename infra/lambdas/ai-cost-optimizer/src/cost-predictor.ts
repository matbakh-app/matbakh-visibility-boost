/**
 * Cost Prediction Engine
 * Predicts future AI service costs based on usage patterns
 */

import { CostTracker } from './cost-tracker';
import { CostPrediction, UsagePattern, PredictionFactor, TimePeriod } from './types';

export class CostPredictor {
  private costTracker: CostTracker;

  constructor(costTracker: CostTracker) {
    this.costTracker = costTracker;
  }

  /**
   * Generate cost prediction for a user or provider
   */
  async generatePrediction(
    scope: string,
    period: TimePeriod,
    lookbackDays: number = 30
  ): Promise<CostPrediction> {
    try {
      // Get historical usage pattern
      const usagePattern = await this.costTracker.getUsagePattern(scope, lookbackDays);
      const currentUsage = await this.costTracker.getCurrentUsage(scope, period);

      // Calculate base prediction using linear trend
      const basePrediction = this.calculateLinearTrend(usagePattern, period);

      // Apply prediction factors
      const factors = await this.calculatePredictionFactors(scope, usagePattern, period);
      const adjustedPrediction = this.applyPredictionFactors(basePrediction, factors);

      // Calculate confidence based on data quality and consistency
      const confidence = this.calculatePredictionConfidence(usagePattern, factors);

      return {
        period,
        currentUsage: currentUsage.cost,
        predictedUsage: Math.max(0, adjustedPrediction),
        confidence,
        factors,
        generatedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`Failed to generate prediction for ${scope}:`, error);
      throw error;
    }
  }

  /**
   * Calculate linear trend from usage pattern
   */
  private calculateLinearTrend(pattern: UsagePattern, period: TimePeriod): number {
    let trendData: number[];
    let multiplier: number;

    switch (period) {
      case 'hourly':
        trendData = pattern.pattern.hourlyDistribution;
        multiplier = 1;
        break;
      case 'daily':
        trendData = pattern.pattern.dailyDistribution;
        multiplier = 1;
        break;
      case 'weekly':
        trendData = pattern.pattern.dailyDistribution;
        multiplier = 7;
        break;
      case 'monthly':
        trendData = pattern.pattern.monthlyTrend;
        multiplier = 1;
        break;
      default:
        trendData = pattern.pattern.dailyDistribution;
        multiplier = 1;
    }

    // Simple linear regression
    const n = trendData.length;
    if (n < 2) {
      return pattern.averageRequestCost;
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += trendData[i];
      sumXY += i * trendData[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextValue = slope * n + intercept;
    return Math.max(0, nextValue * multiplier * pattern.averageRequestCost);
  }

  /**
   * Calculate factors that might affect future costs
   */
  private async calculatePredictionFactors(
    scope: string,
    pattern: UsagePattern,
    period: TimePeriod
  ): Promise<PredictionFactor[]> {
    const factors: PredictionFactor[] = [];

    // Seasonality factor
    const seasonalityFactor = this.calculateSeasonalityFactor(pattern, period);
    if (seasonalityFactor.impact !== 0) {
      factors.push(seasonalityFactor);
    }

    // Growth trend factor
    const growthFactor = this.calculateGrowthFactor(pattern);
    if (growthFactor.impact !== 0) {
      factors.push(growthFactor);
    }

    // Peak usage factor
    const peakFactor = this.calculatePeakUsageFactor(pattern, period);
    if (peakFactor.impact !== 0) {
      factors.push(peakFactor);
    }

    // Model efficiency factor (based on provider improvements)
    const efficiencyFactor = this.calculateEfficiencyFactor(scope);
    if (efficiencyFactor.impact !== 0) {
      factors.push(efficiencyFactor);
    }

    // Market pricing factor
    const pricingFactor = this.calculatePricingFactor();
    if (pricingFactor.impact !== 0) {
      factors.push(pricingFactor);
    }

    return factors;
  }

  /**
   * Calculate seasonality impact
   */
  private calculateSeasonalityFactor(pattern: UsagePattern, period: TimePeriod): PredictionFactor {
    const now = new Date();
    let impact = 0;
    let description = 'No significant seasonal patterns detected';

    // Check for relevant seasonality patterns
    for (const seasonal of pattern.seasonality) {
      if (this.isSeasonalityRelevant(seasonal.type, period)) {
        impact += (seasonal.multiplier - 1) * 0.5; // Moderate the impact
        description = `${seasonal.description} (${seasonal.multiplier}x multiplier)`;
      }
    }

    // Add day-of-week patterns for daily/weekly predictions
    if (period === 'daily' || period === 'weekly') {
      const dayOfWeek = now.getDay();
      const weekdayAverage = pattern.pattern.dailyDistribution.slice(1, 6).reduce((a, b) => a + b, 0) / 5;
      const weekendAverage = (pattern.pattern.dailyDistribution[0] + pattern.pattern.dailyDistribution[6]) / 2;
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        if (weekendAverage > weekdayAverage * 1.2) {
          impact += 0.2;
          description = 'Weekend usage typically higher';
        } else if (weekendAverage < weekdayAverage * 0.8) {
          impact -= 0.2;
          description = 'Weekend usage typically lower';
        }
      }
    }

    return {
      name: 'Seasonality',
      impact: Math.max(-0.5, Math.min(0.5, impact)),
      confidence: 0.7,
      description,
    };
  }

  /**
   * Calculate growth trend factor
   */
  private calculateGrowthFactor(pattern: UsagePattern): PredictionFactor {
    const monthlyTrend = pattern.pattern.monthlyTrend;
    if (monthlyTrend.length < 3) {
      return {
        name: 'Growth Trend',
        impact: 0,
        confidence: 0.3,
        description: 'Insufficient data for trend analysis',
      };
    }

    // Calculate growth rate from last 3 months
    const recent = monthlyTrend.slice(-3);
    const growthRate = (recent[2] - recent[0]) / (recent[0] || 1);

    let impact = 0;
    let description = 'Stable usage pattern';

    if (growthRate > 0.1) {
      impact = Math.min(0.3, growthRate * 0.5);
      description = `Growing usage trend (+${(growthRate * 100).toFixed(1)}%)`;
    } else if (growthRate < -0.1) {
      impact = Math.max(-0.3, growthRate * 0.5);
      description = `Declining usage trend (${(growthRate * 100).toFixed(1)}%)`;
    }

    return {
      name: 'Growth Trend',
      impact,
      confidence: 0.8,
      description,
    };
  }

  /**
   * Calculate peak usage factor
   */
  private calculatePeakUsageFactor(pattern: UsagePattern, period: TimePeriod): PredictionFactor {
    const now = new Date();
    const currentHour = now.getHours();
    
    let impact = 0;
    let description = 'Normal usage period';

    if (period === 'hourly' || period === 'daily') {
      if (pattern.peakUsageHours.includes(currentHour)) {
        const peakMultiplier = pattern.pattern.hourlyDistribution[currentHour] / 
          (pattern.pattern.hourlyDistribution.reduce((a, b) => a + b, 0) / 24);
        
        if (peakMultiplier > 1.5) {
          impact = Math.min(0.4, (peakMultiplier - 1) * 0.3);
          description = `Peak usage hour (${peakMultiplier.toFixed(1)}x average)`;
        }
      }
    }

    return {
      name: 'Peak Usage',
      impact,
      confidence: 0.9,
      description,
    };
  }

  /**
   * Calculate model efficiency improvements factor
   */
  private calculateEfficiencyFactor(scope: string): PredictionFactor {
    // This would be based on historical efficiency improvements
    // For now, assume gradual efficiency improvements
    const monthlyEfficiencyGain = -0.02; // 2% cost reduction per month

    return {
      name: 'Model Efficiency',
      impact: monthlyEfficiencyGain,
      confidence: 0.6,
      description: 'Expected model efficiency improvements',
    };
  }

  /**
   * Calculate market pricing factor
   */
  private calculatePricingFactor(): PredictionFactor {
    // This would be based on market analysis and provider announcements
    // For now, assume stable pricing with slight downward pressure
    return {
      name: 'Market Pricing',
      impact: -0.01, // 1% cost reduction due to market competition
      confidence: 0.5,
      description: 'Market competition driving prices down',
    };
  }

  /**
   * Apply prediction factors to base prediction
   */
  private applyPredictionFactors(basePrediction: number, factors: PredictionFactor[]): number {
    let adjustedPrediction = basePrediction;

    for (const factor of factors) {
      const adjustment = basePrediction * factor.impact * factor.confidence;
      adjustedPrediction += adjustment;
    }

    return adjustedPrediction;
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(pattern: UsagePattern, factors: PredictionFactor[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data quality
    const dataPoints = pattern.pattern.monthlyTrend.filter(x => x > 0).length;
    confidence += Math.min(0.3, dataPoints * 0.05);

    // Increase confidence based on pattern consistency
    const monthlyVariance = this.calculateVariance(pattern.pattern.monthlyTrend);
    const monthlyMean = pattern.pattern.monthlyTrend.reduce((a, b) => a + b, 0) / pattern.pattern.monthlyTrend.length;
    const coefficientOfVariation = monthlyVariance / (monthlyMean || 1);
    
    if (coefficientOfVariation < 0.5) {
      confidence += 0.2; // Consistent patterns increase confidence
    } else if (coefficientOfVariation > 1.5) {
      confidence -= 0.2; // Highly variable patterns decrease confidence
    }

    // Adjust based on factor confidence
    const averageFactorConfidence = factors.reduce((sum, f) => sum + f.confidence, 0) / (factors.length || 1);
    confidence = (confidence + averageFactorConfidence) / 2;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Calculate variance of a dataset
   */
  private calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * Check if seasonality pattern is relevant for the prediction period
   */
  private isSeasonalityRelevant(seasonalType: string, period: TimePeriod): boolean {
    switch (period) {
      case 'hourly':
        return seasonalType === 'daily';
      case 'daily':
        return seasonalType === 'daily' || seasonalType === 'weekly';
      case 'weekly':
        return seasonalType === 'weekly' || seasonalType === 'monthly';
      case 'monthly':
        return seasonalType === 'monthly' || seasonalType === 'yearly';
      default:
        return false;
    }
  }

  /**
   * Generate predictions for multiple scopes
   */
  async generateBatchPredictions(
    scopes: string[],
    period: TimePeriod,
    lookbackDays: number = 30
  ): Promise<Record<string, CostPrediction>> {
    const predictions: Record<string, CostPrediction> = {};

    const predictionPromises = scopes.map(async (scope) => {
      try {
        const prediction = await this.generatePrediction(scope, period, lookbackDays);
        predictions[scope] = prediction;
      } catch (error) {
        console.error(`Failed to generate prediction for ${scope}:`, error);
        // Create a fallback prediction
        predictions[scope] = {
          period,
          currentUsage: 0,
          predictedUsage: 0,
          confidence: 0.1,
          factors: [{
            name: 'Error',
            impact: 0,
            confidence: 0,
            description: 'Prediction failed due to insufficient data',
          }],
          generatedAt: new Date().toISOString(),
        };
      }
    });

    await Promise.allSettled(predictionPromises);
    return predictions;
  }

  /**
   * Get prediction accuracy metrics
   */
  async getPredictionAccuracy(
    scope: string,
    period: TimePeriod,
    lookbackDays: number = 7
  ): Promise<{
    accuracy: number;
    meanAbsoluteError: number;
    meanAbsolutePercentageError: number;
    predictions: number;
  }> {
    // This would compare historical predictions with actual usage
    // For now, return placeholder metrics
    return {
      accuracy: 0.75,
      meanAbsoluteError: 0.15,
      meanAbsolutePercentageError: 12.5,
      predictions: 10,
    };
  }
}