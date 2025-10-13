/**
 * Performance Regression Detection System
 * 
 * Automatically detects performance regressions by comparing current metrics
 * against historical baselines and statistical thresholds.
 */

import { PerformanceMetric, PerformanceMetricName, PerformanceAlert } from './performance-monitoring';
import { publishMetric } from './monitoring';

interface RegressionThreshold {
  metric: PerformanceMetricName;
  percentageIncrease: number; // Percentage increase to trigger regression
  minimumSamples: number; // Minimum samples needed for comparison
  timeWindow: number; // Time window in milliseconds for baseline calculation
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BaselineData {
  metric: PerformanceMetricName;
  mean: number;
  median: number;
  p95: number;
  standardDeviation: number;
  sampleCount: number;
  lastUpdated: number;
  confidence: number; // 0-1, confidence in the baseline
}

interface RegressionResult {
  isRegression: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  baselineValue: number;
  percentageIncrease: number;
  confidence: number;
  message: string;
  recommendations: string[];
}

class PerformanceRegressionDetector {
  private baselines: Map<PerformanceMetricName, BaselineData> = new Map();
  private thresholds: RegressionThreshold[] = [];
  private recentMetrics: PerformanceMetric[] = [];
  private maxMetricsHistory = 1000;
  private isInitialized = false;

  constructor() {
    this.initializeDefaultThresholds();
    this.loadBaselinesFromStorage();
  }

  /**
   * Initialize default regression thresholds
   */
  private initializeDefaultThresholds(): void {
    this.thresholds = [
      {
        metric: 'LCP',
        percentageIncrease: 20,
        minimumSamples: 10,
        timeWindow: 3600000, // 1 hour
        severity: 'high'
      },
      {
        metric: 'INP',
        percentageIncrease: 30,
        minimumSamples: 10,
        timeWindow: 3600000,
        severity: 'medium'
      },
      {
        metric: 'CLS',
        percentageIncrease: 50,
        minimumSamples: 10,
        timeWindow: 3600000,
        severity: 'high'
      },
      {
        metric: 'FCP',
        percentageIncrease: 25,
        minimumSamples: 10,
        timeWindow: 3600000,
        severity: 'medium'
      },
      {
        metric: 'TTFB',
        percentageIncrease: 40,
        minimumSamples: 10,
        timeWindow: 3600000,
        severity: 'medium'
      },
      {
        metric: 'CUSTOM',
        percentageIncrease: 50,
        minimumSamples: 5,
        timeWindow: 1800000, // 30 minutes
        severity: 'low'
      }
    ];
  }

  /**
   * Add performance metric for regression analysis
   */
  public addMetric(metric: PerformanceMetric): void {
    this.recentMetrics.push(metric);
    
    // Keep only recent metrics to prevent memory issues
    if (this.recentMetrics.length > this.maxMetricsHistory) {
      this.recentMetrics = this.recentMetrics.slice(-this.maxMetricsHistory);
    }

    // Update baseline for this metric type
    this.updateBaseline(metric.name);
  }

  /**
   * Check for performance regression
   */
  public async checkForRegression(metric: PerformanceMetric): Promise<RegressionResult | null> {
    const threshold = this.thresholds.find(t => t.metric === metric.name);
    if (!threshold) {
      return null;
    }

    const baseline = this.baselines.get(metric.name);
    if (!baseline || baseline.sampleCount < threshold.minimumSamples) {
      // Not enough data for regression detection
      return null;
    }

    // Calculate regression based on different statistical measures
    const regressionChecks = [
      this.checkMeanRegression(metric, baseline, threshold),
      this.checkMedianRegression(metric, baseline, threshold),
      this.checkP95Regression(metric, baseline, threshold)
    ];

    // Use the most conservative (highest confidence) regression result
    const significantRegression = regressionChecks
      .filter(check => check.isRegression)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (significantRegression) {
      // Log regression detection
      await this.logRegression(metric, significantRegression);
      
      // Send CloudWatch metric
      await publishMetric({
        metricName: 'PerformanceRegression',
        value: 1,
        dimensions: {
          Metric: metric.name,
          Severity: significantRegression.severity,
          PercentageIncrease: Math.round(significantRegression.percentageIncrease).toString()
        }
      });

      return significantRegression;
    }

    return null;
  }

  /**
   * Check regression against mean baseline
   */
  private checkMeanRegression(
    metric: PerformanceMetric, 
    baseline: BaselineData, 
    threshold: RegressionThreshold
  ): RegressionResult {
    const percentageIncrease = ((metric.value - baseline.mean) / baseline.mean) * 100;
    const isRegression = percentageIncrease > threshold.percentageIncrease;
    
    return {
      isRegression,
      severity: this.calculateSeverity(percentageIncrease, threshold),
      currentValue: metric.value,
      baselineValue: baseline.mean,
      percentageIncrease: Math.abs(percentageIncrease),
      confidence: baseline.confidence * 0.8, // Mean is less reliable than median
      message: `${metric.name} increased by ${percentageIncrease.toFixed(1)}% compared to mean baseline`,
      recommendations: this.generateRecommendations(metric.name, percentageIncrease)
    };
  }

  /**
   * Check regression against median baseline
   */
  private checkMedianRegression(
    metric: PerformanceMetric, 
    baseline: BaselineData, 
    threshold: RegressionThreshold
  ): RegressionResult {
    const percentageIncrease = ((metric.value - baseline.median) / baseline.median) * 100;
    const isRegression = percentageIncrease > threshold.percentageIncrease;
    
    return {
      isRegression,
      severity: this.calculateSeverity(percentageIncrease, threshold),
      currentValue: metric.value,
      baselineValue: baseline.median,
      percentageIncrease: Math.abs(percentageIncrease),
      confidence: baseline.confidence, // Median is most reliable
      message: `${metric.name} increased by ${percentageIncrease.toFixed(1)}% compared to median baseline`,
      recommendations: this.generateRecommendations(metric.name, percentageIncrease)
    };
  }

  /**
   * Check regression against P95 baseline
   */
  private checkP95Regression(
    metric: PerformanceMetric, 
    baseline: BaselineData, 
    threshold: RegressionThreshold
  ): RegressionResult {
    const percentageIncrease = ((metric.value - baseline.p95) / baseline.p95) * 100;
    const isRegression = percentageIncrease > (threshold.percentageIncrease * 0.5); // More lenient for P95
    
    return {
      isRegression,
      severity: this.calculateSeverity(percentageIncrease, threshold),
      currentValue: metric.value,
      baselineValue: baseline.p95,
      percentageIncrease: Math.abs(percentageIncrease),
      confidence: baseline.confidence * 0.6, // P95 is less reliable for regression detection
      message: `${metric.name} increased by ${percentageIncrease.toFixed(1)}% compared to P95 baseline`,
      recommendations: this.generateRecommendations(metric.name, percentageIncrease)
    };
  }

  /**
   * Calculate severity based on percentage increase
   */
  private calculateSeverity(
    percentageIncrease: number, 
    threshold: RegressionThreshold
  ): 'low' | 'medium' | 'high' | 'critical' {
    const baseThreshold = threshold.percentageIncrease;
    
    if (percentageIncrease > baseThreshold * 3) return 'critical';
    if (percentageIncrease > baseThreshold * 2) return 'high';
    if (percentageIncrease > baseThreshold * 1.5) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on metric and regression
   */
  private generateRecommendations(metric: PerformanceMetricName, percentageIncrease: number): string[] {
    const recommendations: string[] = [];

    switch (metric) {
      case 'LCP':
        recommendations.push('Check for large images or resources that may be loading slowly');
        recommendations.push('Optimize server response times and consider CDN usage');
        recommendations.push('Review recent code changes that might affect rendering');
        break;
      
      case 'INP':
        recommendations.push('Reduce JavaScript execution time during interactions');
        recommendations.push('Break up long-running tasks into smaller chunks');
        recommendations.push('Consider code splitting and lazy loading');
        break;
      
      case 'CLS':
        recommendations.push('Ensure images and ads have defined dimensions');
        recommendations.push('Avoid inserting content above existing content');
        recommendations.push('Use CSS transforms instead of changing layout properties');
        break;
      
      case 'FCP':
        recommendations.push('Optimize critical rendering path');
        recommendations.push('Reduce render-blocking resources');
        recommendations.push('Improve server response times');
        break;
      
      case 'TTFB':
        recommendations.push('Optimize server processing time');
        recommendations.push('Check database query performance');
        recommendations.push('Review CDN configuration and caching strategies');
        break;
      
      default:
        recommendations.push('Review recent changes that might affect performance');
        recommendations.push('Check for resource loading issues');
        break;
    }

    if (percentageIncrease > 100) {
      recommendations.unshift('URGENT: Performance has degraded significantly - immediate investigation required');
    }

    return recommendations;
  }

  /**
   * Update baseline for a metric type
   */
  private updateBaseline(metricName: PerformanceMetricName): void {
    const threshold = this.thresholds.find(t => t.metric === metricName);
    if (!threshold) return;

    const now = Date.now();
    const windowStart = now - threshold.timeWindow;
    
    // Get recent metrics within the time window
    const recentMetrics = this.recentMetrics
      .filter(m => m.name === metricName && m.timestamp >= windowStart)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (recentMetrics.length < threshold.minimumSamples) {
      return; // Not enough samples
    }

    // Calculate statistical measures
    const mean = recentMetrics.reduce((sum, val) => sum + val, 0) / recentMetrics.length;
    const median = this.calculateMedian(recentMetrics);
    const p95 = this.calculatePercentile(recentMetrics, 95);
    const standardDeviation = this.calculateStandardDeviation(recentMetrics, mean);
    
    // Calculate confidence based on sample size and consistency
    const confidence = Math.min(
      recentMetrics.length / (threshold.minimumSamples * 2), // More samples = higher confidence
      1 - (standardDeviation / mean) // Lower variance = higher confidence
    );

    const baseline: BaselineData = {
      metric: metricName,
      mean,
      median,
      p95,
      standardDeviation,
      sampleCount: recentMetrics.length,
      lastUpdated: now,
      confidence: Math.max(0, Math.min(1, confidence))
    };

    this.baselines.set(metricName, baseline);
    this.saveBaselinesToStorage();
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate percentile value
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Log regression detection
   */
  private async logRegression(metric: PerformanceMetric, regression: RegressionResult): Promise<void> {
    console.warn('Performance Regression Detected:', {
      metric: metric.name,
      currentValue: regression.currentValue,
      baselineValue: regression.baselineValue,
      percentageIncrease: regression.percentageIncrease,
      severity: regression.severity,
      confidence: regression.confidence,
      url: metric.url,
      timestamp: new Date(metric.timestamp).toISOString()
    });
  }

  /**
   * Get current baselines
   */
  public getBaselines(): Map<PerformanceMetricName, BaselineData> {
    return new Map(this.baselines);
  }

  /**
   * Get regression thresholds
   */
  public getThresholds(): RegressionThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Update regression threshold
   */
  public updateThreshold(metric: PerformanceMetricName, updates: Partial<RegressionThreshold>): void {
    const index = this.thresholds.findIndex(t => t.metric === metric);
    if (index >= 0) {
      this.thresholds[index] = { ...this.thresholds[index], ...updates };
    }
  }

  /**
   * Reset baseline for a metric
   */
  public resetBaseline(metric: PerformanceMetricName): void {
    this.baselines.delete(metric);
    this.saveBaselinesToStorage();
  }

  /**
   * Load baselines from localStorage
   */
  private loadBaselinesFromStorage(): void {
    try {
      const stored = localStorage.getItem('performance_baselines');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]) => {
          this.baselines.set(key as PerformanceMetricName, value as BaselineData);
        });
      }
    } catch (error) {
      console.warn('Failed to load performance baselines:', error);
    }
  }

  /**
   * Save baselines to localStorage
   */
  private saveBaselinesToStorage(): void {
    try {
      const data = Object.fromEntries(this.baselines);
      localStorage.setItem('performance_baselines', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save performance baselines:', error);
    }
  }

  /**
   * Get regression detection status
   */
  public getStatus(): {
    baselinesCount: number;
    totalMetrics: number;
    oldestBaseline: number | null;
    newestBaseline: number | null;
  } {
    const baselines = Array.from(this.baselines.values());
    
    return {
      baselinesCount: baselines.length,
      totalMetrics: this.recentMetrics.length,
      oldestBaseline: baselines.length > 0 ? Math.min(...baselines.map(b => b.lastUpdated)) : null,
      newestBaseline: baselines.length > 0 ? Math.max(...baselines.map(b => b.lastUpdated)) : null
    };
  }
}

// Global regression detector instance
export const regressionDetector = new PerformanceRegressionDetector();

export { PerformanceRegressionDetector, type RegressionResult, type BaselineData, type RegressionThreshold };