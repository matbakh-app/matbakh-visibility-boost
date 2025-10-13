/**
 * Performance Regression Detection System
 * Detects performance regressions by comparing current metrics with historical baselines
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface PerformanceMetrics {
  timestamp: string;
  testId: string;
  version?: string;
  branch?: string;
  commit?: string;
  metrics: {
    responseTime: MetricData;
    throughput: MetricData;
    errorRate: MetricData;
    cpuUsage: MetricData;
    memoryUsage: MetricData;
    networkLatency: MetricData;
  };
  userJourneys: UserJourneyMetrics[];
}

export interface MetricData {
  value: number;
  unit: string;
  p50?: number;
  p95?: number;
  p99?: number;
  min?: number;
  max?: number;
}

export interface UserJourneyMetrics {
  name: string;
  duration: number;
  steps: StepMetrics[];
  success: boolean;
}

export interface StepMetrics {
  name: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

export interface RegressionResult {
  timestamp: string;
  hasRegression: boolean;
  severity: 'none' | 'minor' | 'major' | 'critical';
  regressions: RegressionDetection[];
  improvements: ImprovementDetection[];
  summary: RegressionSummary;
  recommendations: string[];
}

export interface RegressionDetection {
  metric: string;
  current: number;
  baseline: number;
  change: number;
  changePercent: number;
  severity: 'minor' | 'major' | 'critical';
  threshold: number;
}

export interface ImprovementDetection {
  metric: string;
  current: number;
  baseline: number;
  improvement: number;
  improvementPercent: number;
}

export interface RegressionSummary {
  totalRegressions: number;
  criticalRegressions: number;
  majorRegressions: number;
  minorRegressions: number;
  totalImprovements: number;
  overallTrend: 'improving' | 'stable' | 'degrading';
}

export interface RegressionThresholds {
  responseTime: { minor: number; major: number; critical: number };
  throughput: { minor: number; major: number; critical: number };
  errorRate: { minor: number; major: number; critical: number };
  cpuUsage: { minor: number; major: number; critical: number };
  memoryUsage: { minor: number; major: number; critical: number };
}

export class PerformanceRegressionDetector {
  private dataDir: string;
  private thresholds: RegressionThresholds;

  constructor() {
    this.dataDir = join(process.cwd(), 'performance-data');
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }

    this.thresholds = {
      responseTime: { minor: 10, major: 25, critical: 50 }, // % increase
      throughput: { minor: 10, major: 25, critical: 50 }, // % decrease
      errorRate: { minor: 1, major: 5, critical: 10 }, // % increase
      cpuUsage: { minor: 15, major: 30, critical: 50 }, // % increase
      memoryUsage: { minor: 15, major: 30, critical: 50 }, // % increase
    };
  }

  async detectRegressions(currentMetrics: PerformanceMetrics): Promise<RegressionResult> {
    console.log('🔍 Analyzing performance metrics for regressions...');

    try {
      // Store current metrics
      await this.storeMetrics(currentMetrics);

      // Get baseline metrics
      const baseline = await this.getBaseline(currentMetrics.testId);
      
      if (!baseline) {
        console.log('📊 No baseline found, storing current metrics as baseline');
        return this.createNoBaselineResult(currentMetrics);
      }

      // Compare metrics
      const regressions = this.detectMetricRegressions(currentMetrics, baseline);
      const improvements = this.detectMetricImprovements(currentMetrics, baseline);

      // Analyze user journeys
      const journeyRegressions = this.detectJourneyRegressions(
        currentMetrics.userJourneys,
        baseline.userJourneys
      );

      const allRegressions = [...regressions, ...journeyRegressions];
      const severity = this.calculateOverallSeverity(allRegressions);

      const result: RegressionResult = {
        timestamp: new Date().toISOString(),
        hasRegression: allRegressions.length > 0,
        severity,
        regressions: allRegressions,
        improvements,
        summary: this.createSummary(allRegressions, improvements),
        recommendations: this.generateRecommendations(allRegressions, improvements),
      };

      console.log(`✅ Regression analysis complete - ${allRegressions.length} regressions found`);
      return result;
    } catch (error) {
      console.error('❌ Regression detection failed:', error);
      throw error;
    }
  }

  private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
    const filename = `${metrics.testId}-${Date.now()}.json`;
    const filepath = join(this.dataDir, filename);
    writeFileSync(filepath, JSON.stringify(metrics, null, 2));
  }

  private async getBaseline(testId: string): Promise<PerformanceMetrics | null> {
    try {
      // Get the most recent baseline for this test type
      const baselineFile = join(this.dataDir, `${testId}-baseline.json`);
      
      if (!existsSync(baselineFile)) {
        // Try to find the most recent metrics file for this test
        const files = require('fs').readdirSync(this.dataDir)
          .filter((f: string) => f.startsWith(testId) && f.endsWith('.json'))
          .sort()
          .reverse();
        
        if (files.length > 1) {
          // Use the second most recent as baseline
          const baselineData = readFileSync(join(this.dataDir, files[1]), 'utf-8');
          return JSON.parse(baselineData);
        }
        
        return null;
      }

      const baselineData = readFileSync(baselineFile, 'utf-8');
      return JSON.parse(baselineData);
    } catch (error) {
      console.warn('Failed to load baseline:', error);
      return null;
    }
  }

  private detectMetricRegressions(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): RegressionDetection[] {
    const regressions: RegressionDetection[] = [];

    // Response Time
    if (current.metrics.responseTime.value > baseline.metrics.responseTime.value) {
      const change = current.metrics.responseTime.value - baseline.metrics.responseTime.value;
      const changePercent = (change / baseline.metrics.responseTime.value) * 100;
      
      if (changePercent >= this.thresholds.responseTime.minor) {
        regressions.push({
          metric: 'Response Time',
          current: current.metrics.responseTime.value,
          baseline: baseline.metrics.responseTime.value,
          change,
          changePercent,
          severity: this.getSeverity(changePercent, this.thresholds.responseTime),
          threshold: this.thresholds.responseTime.minor,
        });
      }
    }

    // Throughput (regression = decrease)
    if (current.metrics.throughput.value < baseline.metrics.throughput.value) {
      const change = baseline.metrics.throughput.value - current.metrics.throughput.value;
      const changePercent = (change / baseline.metrics.throughput.value) * 100;
      
      if (changePercent >= this.thresholds.throughput.minor) {
        regressions.push({
          metric: 'Throughput',
          current: current.metrics.throughput.value,
          baseline: baseline.metrics.throughput.value,
          change: -change,
          changePercent: -changePercent,
          severity: this.getSeverity(changePercent, this.thresholds.throughput),
          threshold: this.thresholds.throughput.minor,
        });
      }
    }

    // Error Rate
    if (current.metrics.errorRate.value > baseline.metrics.errorRate.value) {
      const change = current.metrics.errorRate.value - baseline.metrics.errorRate.value;
      const changePercent = baseline.metrics.errorRate.value > 0 
        ? (change / baseline.metrics.errorRate.value) * 100
        : change * 100; // If baseline was 0, treat any error as 100% increase
      
      if (changePercent >= this.thresholds.errorRate.minor) {
        regressions.push({
          metric: 'Error Rate',
          current: current.metrics.errorRate.value,
          baseline: baseline.metrics.errorRate.value,
          change,
          changePercent,
          severity: this.getSeverity(changePercent, this.thresholds.errorRate),
          threshold: this.thresholds.errorRate.minor,
        });
      }
    }

    return regressions;
  }

  private detectMetricImprovements(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): ImprovementDetection[] {
    const improvements: ImprovementDetection[] = [];

    // Response Time improvement
    if (current.metrics.responseTime.value < baseline.metrics.responseTime.value) {
      const improvement = baseline.metrics.responseTime.value - current.metrics.responseTime.value;
      const improvementPercent = (improvement / baseline.metrics.responseTime.value) * 100;
      
      if (improvementPercent >= 5) { // 5% improvement threshold
        improvements.push({
          metric: 'Response Time',
          current: current.metrics.responseTime.value,
          baseline: baseline.metrics.responseTime.value,
          improvement,
          improvementPercent,
        });
      }
    }

    // Throughput improvement
    if (current.metrics.throughput.value > baseline.metrics.throughput.value) {
      const improvement = current.metrics.throughput.value - baseline.metrics.throughput.value;
      const improvementPercent = (improvement / baseline.metrics.throughput.value) * 100;
      
      if (improvementPercent >= 5) {
        improvements.push({
          metric: 'Throughput',
          current: current.metrics.throughput.value,
          baseline: baseline.metrics.throughput.value,
          improvement,
          improvementPercent,
        });
      }
    }

    return improvements;
  }

  private detectJourneyRegressions(
    currentJourneys: UserJourneyMetrics[],
    baselineJourneys: UserJourneyMetrics[]
  ): RegressionDetection[] {
    const regressions: RegressionDetection[] = [];

    for (const currentJourney of currentJourneys) {
      const baselineJourney = baselineJourneys.find(j => j.name === currentJourney.name);
      
      if (baselineJourney && currentJourney.duration > baselineJourney.duration) {
        const change = currentJourney.duration - baselineJourney.duration;
        const changePercent = (change / baselineJourney.duration) * 100;
        
        if (changePercent >= 15) { // 15% threshold for user journeys
          regressions.push({
            metric: `User Journey: ${currentJourney.name}`,
            current: currentJourney.duration,
            baseline: baselineJourney.duration,
            change,
            changePercent,
            severity: changePercent >= 50 ? 'critical' : changePercent >= 25 ? 'major' : 'minor',
            threshold: 15,
          });
        }
      }
    }

    return regressions;
  }

  private getSeverity(
    changePercent: number,
    thresholds: { minor: number; major: number; critical: number }
  ): 'minor' | 'major' | 'critical' {
    if (changePercent >= thresholds.critical) return 'critical';
    if (changePercent >= thresholds.major) return 'major';
    return 'minor';
  }

  private calculateOverallSeverity(regressions: RegressionDetection[]): 'none' | 'minor' | 'major' | 'critical' {
    if (regressions.length === 0) return 'none';
    
    const hasCritical = regressions.some(r => r.severity === 'critical');
    const hasMajor = regressions.some(r => r.severity === 'major');
    
    if (hasCritical) return 'critical';
    if (hasMajor) return 'major';
    return 'minor';
  }

  private createSummary(
    regressions: RegressionDetection[],
    improvements: ImprovementDetection[]
  ): RegressionSummary {
    const criticalRegressions = regressions.filter(r => r.severity === 'critical').length;
    const majorRegressions = regressions.filter(r => r.severity === 'major').length;
    const minorRegressions = regressions.filter(r => r.severity === 'minor').length;

    let overallTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    if (criticalRegressions > 0 || majorRegressions > 2) {
      overallTrend = 'degrading';
    } else if (improvements.length > regressions.length) {
      overallTrend = 'improving';
    }

    return {
      totalRegressions: regressions.length,
      criticalRegressions,
      majorRegressions,
      minorRegressions,
      totalImprovements: improvements.length,
      overallTrend,
    };
  }

  private generateRecommendations(
    regressions: RegressionDetection[],
    improvements: ImprovementDetection[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical regressions
    const criticalRegressions = regressions.filter(r => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      recommendations.push('🚨 Critical performance regressions detected - immediate investigation required');
      recommendations.push('Consider rolling back recent changes until issues are resolved');
    }

    // Response time regressions
    const responseTimeRegressions = regressions.filter(r => r.metric === 'Response Time');
    if (responseTimeRegressions.length > 0) {
      recommendations.push('Investigate database query performance and API response times');
      recommendations.push('Consider implementing or optimizing caching strategies');
    }

    // Throughput regressions
    const throughputRegressions = regressions.filter(r => r.metric === 'Throughput');
    if (throughputRegressions.length > 0) {
      recommendations.push('Review server capacity and scaling configuration');
      recommendations.push('Check for resource bottlenecks (CPU, memory, network)');
    }

    // Error rate regressions
    const errorRegressions = regressions.filter(r => r.metric === 'Error Rate');
    if (errorRegressions.length > 0) {
      recommendations.push('Investigate error logs for new failure patterns');
      recommendations.push('Review recent code changes for potential bugs');
    }

    // User journey regressions
    const journeyRegressions = regressions.filter(r => r.metric.startsWith('User Journey'));
    if (journeyRegressions.length > 0) {
      recommendations.push('Analyze user journey performance and optimize critical paths');
      recommendations.push('Consider frontend optimization and bundle size reduction');
    }

    // Improvements
    if (improvements.length > 0) {
      recommendations.push('✅ Performance improvements detected - document successful optimizations');
    }

    // No regressions
    if (regressions.length === 0) {
      recommendations.push('✅ No performance regressions detected - system performance is stable');
    }

    return recommendations;
  }

  private createNoBaselineResult(metrics: PerformanceMetrics): RegressionResult {
    return {
      timestamp: new Date().toISOString(),
      hasRegression: false,
      severity: 'none',
      regressions: [],
      improvements: [],
      summary: {
        totalRegressions: 0,
        criticalRegressions: 0,
        majorRegressions: 0,
        minorRegressions: 0,
        totalImprovements: 0,
        overallTrend: 'stable',
      },
      recommendations: [
        'Baseline metrics established for future regression detection',
        'Run additional tests to build performance history',
      ],
    };
  }

  async setBaseline(testId: string, metrics: PerformanceMetrics): Promise<void> {
    const baselineFile = join(this.dataDir, `${testId}-baseline.json`);
    writeFileSync(baselineFile, JSON.stringify(metrics, null, 2));
    console.log(`📊 Baseline set for test: ${testId}`);
  }

  async getPerformanceHistory(testId: string, days: number = 30): Promise<PerformanceMetrics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const files = require('fs').readdirSync(this.dataDir)
        .filter((f: string) => f.startsWith(testId) && f.endsWith('.json'))
        .map((f: string) => {
          const filepath = join(this.dataDir, f);
          const stats = require('fs').statSync(filepath);
          return { file: f, mtime: stats.mtime };
        })
        .filter(item => item.mtime >= cutoffDate)
        .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      const history: PerformanceMetrics[] = [];
      
      for (const item of files) {
        try {
          const data = readFileSync(join(this.dataDir, item.file), 'utf-8');
          history.push(JSON.parse(data));
        } catch (error) {
          console.warn(`Failed to parse metrics file ${item.file}:`, error);
        }
      }

      return history;
    } catch (error) {
      console.warn('Failed to load performance history:', error);
      return [];
    }
  }
}

export const regressionDetector = new PerformanceRegressionDetector();