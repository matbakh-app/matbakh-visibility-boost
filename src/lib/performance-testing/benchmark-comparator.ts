/**
 * Benchmark Comparison System
 * Compares performance metrics against industry benchmarks and competitors
 */

export interface BenchmarkData {
  category: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  date: string;
  confidence: number; // 0-1
}

export interface ComparisonResult {
  timestamp: string;
  category: string;
  comparisons: MetricComparison[];
  overallRanking: BenchmarkRanking;
  recommendations: string[];
  summary: ComparisonSummary;
}

export interface MetricComparison {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  industryAverage: number;
  topPercentile: number;
  ranking: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
  percentile: number;
  improvement: number; // How much improvement needed to reach next tier
}

export interface BenchmarkRanking {
  overall: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
  percentile: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonSummary {
  totalMetrics: number;
  excellentMetrics: number;
  goodMetrics: number;
  averageMetrics: number;
  belowAverageMetrics: number;
  poorMetrics: number;
  competitiveAdvantages: string[];
  improvementAreas: string[];
}

export class BenchmarkComparator {
  private benchmarks: Map<string, BenchmarkData[]>;

  constructor() {
    this.benchmarks = new Map();
    this.initializeIndustryBenchmarks();
  }

  private initializeIndustryBenchmarks(): void {
    // Restaurant/Hospitality Industry Benchmarks
    const restaurantBenchmarks: BenchmarkData[] = [
      {
        category: 'restaurant-web',
        metric: 'page-load-time',
        value: 2.5,
        unit: 'seconds',
        source: 'Google PageSpeed Insights - Restaurant Industry',
        date: '2024-12-01',
        confidence: 0.9,
      },
      {
        category: 'restaurant-web',
        metric: 'first-contentful-paint',
        value: 1.8,
        unit: 'seconds',
        source: 'Core Web Vitals - Hospitality',
        date: '2024-12-01',
        confidence: 0.85,
      },
      {
        category: 'restaurant-web',
        metric: 'largest-contentful-paint',
        value: 2.5,
        unit: 'seconds',
        source: 'Core Web Vitals - Hospitality',
        date: '2024-12-01',
        confidence: 0.85,
      },
      {
        category: 'restaurant-web',
        metric: 'cumulative-layout-shift',
        value: 0.1,
        unit: 'score',
        source: 'Core Web Vitals - Hospitality',
        date: '2024-12-01',
        confidence: 0.85,
      },
      {
        category: 'restaurant-web',
        metric: 'time-to-interactive',
        value: 3.8,
        unit: 'seconds',
        source: 'Lighthouse - Restaurant Websites',
        date: '2024-12-01',
        confidence: 0.8,
      },
      {
        category: 'restaurant-api',
        metric: 'api-response-time',
        value: 200,
        unit: 'milliseconds',
        source: 'Industry API Performance Study',
        date: '2024-12-01',
        confidence: 0.75,
      },
      {
        category: 'restaurant-api',
        metric: 'api-throughput',
        value: 1000,
        unit: 'requests/second',
        source: 'Industry API Performance Study',
        date: '2024-12-01',
        confidence: 0.75,
      },
      {
        category: 'restaurant-api',
        metric: 'api-error-rate',
        value: 0.5,
        unit: 'percentage',
        source: 'Industry API Performance Study',
        date: '2024-12-01',
        confidence: 0.75,
      },
    ];

    // SaaS Industry Benchmarks
    const saasBenchmarks: BenchmarkData[] = [
      {
        category: 'saas-web',
        metric: 'page-load-time',
        value: 2.0,
        unit: 'seconds',
        source: 'SaaS Performance Report 2024',
        date: '2024-12-01',
        confidence: 0.9,
      },
      {
        category: 'saas-api',
        metric: 'api-response-time',
        value: 150,
        unit: 'milliseconds',
        source: 'SaaS API Benchmarks',
        date: '2024-12-01',
        confidence: 0.85,
      },
      {
        category: 'saas-api',
        metric: 'api-uptime',
        value: 99.9,
        unit: 'percentage',
        source: 'SaaS Reliability Report',
        date: '2024-12-01',
        confidence: 0.95,
      },
    ];

    this.benchmarks.set('restaurant', restaurantBenchmarks);
    this.benchmarks.set('saas', saasBenchmarks);
  }

  async compareWithBenchmarks(
    metrics: Record<string, number>,
    category: string = 'restaurant'
  ): Promise<ComparisonResult> {
    console.log(`📊 Comparing metrics with ${category} industry benchmarks...`);

    const benchmarkData = this.benchmarks.get(category) || [];
    const comparisons: MetricComparison[] = [];

    for (const [metricName, currentValue] of Object.entries(metrics)) {
      const benchmark = benchmarkData.find(b => 
        b.metric === metricName || 
        this.normalizeMetricName(b.metric) === this.normalizeMetricName(metricName)
      );

      if (benchmark) {
        const comparison = this.createMetricComparison(
          metricName,
          currentValue,
          benchmark,
          category
        );
        comparisons.push(comparison);
      }
    }

    const overallRanking = this.calculateOverallRanking(comparisons);
    const summary = this.createComparisonSummary(comparisons);
    const recommendations = this.generateBenchmarkRecommendations(comparisons, overallRanking);

    const result: ComparisonResult = {
      timestamp: new Date().toISOString(),
      category,
      comparisons,
      overallRanking,
      recommendations,
      summary,
    };

    console.log(`✅ Benchmark comparison complete - Overall ranking: ${overallRanking.overall}`);
    return result;
  }

  private createMetricComparison(
    metricName: string,
    currentValue: number,
    benchmark: BenchmarkData,
    category: string
  ): MetricComparison {
    // Define percentile thresholds based on metric type
    const thresholds = this.getMetricThresholds(benchmark.metric, benchmark.value);
    
    const ranking = this.calculateRanking(currentValue, thresholds, benchmark.metric);
    const percentile = this.calculatePercentile(currentValue, thresholds, benchmark.metric);
    const improvement = this.calculateImprovementNeeded(currentValue, thresholds, ranking, benchmark.metric);

    return {
      metric: metricName,
      currentValue,
      benchmarkValue: benchmark.value,
      industryAverage: thresholds.average,
      topPercentile: thresholds.excellent,
      ranking,
      percentile,
      improvement,
    };
  }

  private getMetricThresholds(metricName: string, benchmarkValue: number) {
    // Define thresholds based on metric type (lower is better vs higher is better)
    const isLowerBetter = this.isLowerBetterMetric(metricName);
    
    if (isLowerBetter) {
      // For metrics where lower is better (response time, error rate, etc.)
      return {
        excellent: benchmarkValue * 0.7,    // 30% better than benchmark
        good: benchmarkValue * 0.85,        // 15% better than benchmark
        average: benchmarkValue,             // At benchmark
        belowAverage: benchmarkValue * 1.25, // 25% worse than benchmark
        poor: benchmarkValue * 1.5,          // 50% worse than benchmark
      };
    } else {
      // For metrics where higher is better (throughput, uptime, etc.)
      return {
        excellent: benchmarkValue * 1.3,     // 30% better than benchmark
        good: benchmarkValue * 1.15,         // 15% better than benchmark
        average: benchmarkValue,             // At benchmark
        belowAverage: benchmarkValue * 0.75, // 25% worse than benchmark
        poor: benchmarkValue * 0.5,          // 50% worse than benchmark
      };
    }
  }

  private isLowerBetterMetric(metricName: string): boolean {
    const lowerBetterMetrics = [
      'page-load-time',
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'time-to-interactive',
      'api-response-time',
      'api-error-rate',
      'response-time',
      'error-rate',
      'latency',
    ];

    return lowerBetterMetrics.some(metric => 
      metricName.toLowerCase().includes(metric) || 
      this.normalizeMetricName(metricName).includes(metric)
    );
  }

  private calculateRanking(
    value: number,
    thresholds: any,
    metricName: string
  ): 'excellent' | 'good' | 'average' | 'below-average' | 'poor' {
    const isLowerBetter = this.isLowerBetterMetric(metricName);

    if (isLowerBetter) {
      if (value <= thresholds.excellent) return 'excellent';
      if (value <= thresholds.good) return 'good';
      if (value <= thresholds.average) return 'average';
      if (value <= thresholds.belowAverage) return 'below-average';
      return 'poor';
    } else {
      if (value >= thresholds.excellent) return 'excellent';
      if (value >= thresholds.good) return 'good';
      if (value >= thresholds.average) return 'average';
      if (value >= thresholds.belowAverage) return 'below-average';
      return 'poor';
    }
  }

  private calculatePercentile(
    value: number,
    thresholds: any,
    metricName: string
  ): number {
    const isLowerBetter = this.isLowerBetterMetric(metricName);
    
    if (isLowerBetter) {
      if (value <= thresholds.excellent) return 90 + (thresholds.excellent - value) / thresholds.excellent * 10;
      if (value <= thresholds.good) return 75 + (thresholds.good - value) / (thresholds.good - thresholds.excellent) * 15;
      if (value <= thresholds.average) return 50 + (thresholds.average - value) / (thresholds.average - thresholds.good) * 25;
      if (value <= thresholds.belowAverage) return 25 + (thresholds.belowAverage - value) / (thresholds.belowAverage - thresholds.average) * 25;
      return Math.max(0, 25 - (value - thresholds.belowAverage) / thresholds.belowAverage * 25);
    } else {
      if (value >= thresholds.excellent) return 90 + (value - thresholds.excellent) / thresholds.excellent * 10;
      if (value >= thresholds.good) return 75 + (value - thresholds.good) / (thresholds.excellent - thresholds.good) * 15;
      if (value >= thresholds.average) return 50 + (value - thresholds.average) / (thresholds.good - thresholds.average) * 25;
      if (value >= thresholds.belowAverage) return 25 + (value - thresholds.belowAverage) / (thresholds.average - thresholds.belowAverage) * 25;
      return Math.max(0, 25 - (thresholds.belowAverage - value) / thresholds.belowAverage * 25);
    }
  }

  private calculateImprovementNeeded(
    currentValue: number,
    thresholds: any,
    ranking: string,
    metricName: string
  ): number {
    const isLowerBetter = this.isLowerBetterMetric(metricName);
    
    switch (ranking) {
      case 'excellent':
        return 0; // Already excellent
      case 'good':
        return isLowerBetter 
          ? currentValue - thresholds.excellent
          : thresholds.excellent - currentValue;
      case 'average':
        return isLowerBetter
          ? currentValue - thresholds.good
          : thresholds.good - currentValue;
      case 'below-average':
        return isLowerBetter
          ? currentValue - thresholds.average
          : thresholds.average - currentValue;
      case 'poor':
        return isLowerBetter
          ? currentValue - thresholds.belowAverage
          : thresholds.belowAverage - currentValue;
      default:
        return 0;
    }
  }

  private calculateOverallRanking(comparisons: MetricComparison[]): BenchmarkRanking {
    if (comparisons.length === 0) {
      return {
        overall: 'average',
        percentile: 50,
        strengths: [],
        weaknesses: [],
      };
    }

    const averagePercentile = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;
    
    let overall: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
    if (averagePercentile >= 90) overall = 'excellent';
    else if (averagePercentile >= 75) overall = 'good';
    else if (averagePercentile >= 50) overall = 'average';
    else if (averagePercentile >= 25) overall = 'below-average';
    else overall = 'poor';

    const strengths = comparisons
      .filter(c => c.ranking === 'excellent' || c.ranking === 'good')
      .map(c => c.metric);

    const weaknesses = comparisons
      .filter(c => c.ranking === 'below-average' || c.ranking === 'poor')
      .map(c => c.metric);

    return {
      overall,
      percentile: Math.round(averagePercentile),
      strengths,
      weaknesses,
    };
  }

  private createComparisonSummary(comparisons: MetricComparison[]): ComparisonSummary {
    const excellentMetrics = comparisons.filter(c => c.ranking === 'excellent').length;
    const goodMetrics = comparisons.filter(c => c.ranking === 'good').length;
    const averageMetrics = comparisons.filter(c => c.ranking === 'average').length;
    const belowAverageMetrics = comparisons.filter(c => c.ranking === 'below-average').length;
    const poorMetrics = comparisons.filter(c => c.ranking === 'poor').length;

    const competitiveAdvantages = comparisons
      .filter(c => c.ranking === 'excellent')
      .map(c => `${c.metric}: ${c.percentile}th percentile`);

    const improvementAreas = comparisons
      .filter(c => c.ranking === 'below-average' || c.ranking === 'poor')
      .sort((a, b) => a.percentile - b.percentile)
      .map(c => `${c.metric}: needs ${c.improvement.toFixed(2)} improvement`);

    return {
      totalMetrics: comparisons.length,
      excellentMetrics,
      goodMetrics,
      averageMetrics,
      belowAverageMetrics,
      poorMetrics,
      competitiveAdvantages,
      improvementAreas,
    };
  }

  private generateBenchmarkRecommendations(
    comparisons: MetricComparison[],
    ranking: BenchmarkRanking
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance
    switch (ranking.overall) {
      case 'excellent':
        recommendations.push('🏆 Excellent performance! You\'re in the top 10% of the industry');
        recommendations.push('Focus on maintaining current performance levels');
        break;
      case 'good':
        recommendations.push('👍 Good performance! You\'re above industry average');
        recommendations.push('Consider optimizing weak areas to reach excellent tier');
        break;
      case 'average':
        recommendations.push('📊 Average performance - room for improvement');
        recommendations.push('Focus on key metrics to gain competitive advantage');
        break;
      case 'below-average':
        recommendations.push('⚠️ Below average performance - improvement needed');
        recommendations.push('Prioritize performance optimization initiatives');
        break;
      case 'poor':
        recommendations.push('🚨 Poor performance - immediate action required');
        recommendations.push('Consider performance audit and optimization strategy');
        break;
    }

    // Specific metric recommendations
    const poorMetrics = comparisons.filter(c => c.ranking === 'poor');
    if (poorMetrics.length > 0) {
      recommendations.push(`Critical: Address poor performing metrics: ${poorMetrics.map(m => m.metric).join(', ')}`);
    }

    const belowAverageMetrics = comparisons.filter(c => c.ranking === 'below-average');
    if (belowAverageMetrics.length > 0) {
      recommendations.push(`Improve below-average metrics: ${belowAverageMetrics.map(m => m.metric).join(', ')}`);
    }

    // Strengths
    if (ranking.strengths.length > 0) {
      recommendations.push(`✅ Leverage your strengths: ${ranking.strengths.join(', ')}`);
    }

    return recommendations;
  }

  private normalizeMetricName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  // Method to add custom benchmarks
  addCustomBenchmark(category: string, benchmark: BenchmarkData): void {
    if (!this.benchmarks.has(category)) {
      this.benchmarks.set(category, []);
    }
    this.benchmarks.get(category)!.push(benchmark);
  }

  // Method to get available benchmark categories
  getAvailableCategories(): string[] {
    return Array.from(this.benchmarks.keys());
  }

  // Method to get benchmarks for a category
  getBenchmarks(category: string): BenchmarkData[] {
    return this.benchmarks.get(category) || [];
  }
}

export const benchmarkComparator = new BenchmarkComparator();