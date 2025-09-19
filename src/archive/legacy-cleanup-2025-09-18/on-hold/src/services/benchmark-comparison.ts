/**
 * Industry Benchmark Comparison Service
 * Task: 1.3 Migrate BenchmarkComparison service from Supabase to AWS RDS
 * Provides functionality to compare business scores against industry and regional benchmarks
 */

import { AwsRdsClient } from './aws-rds-client';

export interface ScoreBenchmark {
  id: string;
  industry_id: string;
  region_id: string;
  score_type: 'visibility' | 'google_rating' | 'review_count' | 'social_engagement' | 'website_traffic';
  benchmark_value: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;
  sample_size: number;
  last_updated: string;
  data_source: string;
  metadata?: {
    business_size?: 'small' | 'medium' | 'large';
    franchise_type?: 'independent' | 'chain' | 'franchise';
    seasonal_adjustment?: boolean;
  };
}

export interface BenchmarkComparison {
  business_score: number;
  benchmark_value: number;
  percentile_rank: number;
  performance_category: 'well_below' | 'below' | 'average' | 'above' | 'well_above';
  improvement_potential: number;
  industry_position: string;
  regional_position: string;
  recommendations: string[];
}

export interface IndustryBenchmarkRequest {
  business_id: string;
  industry_id: string;
  region_id: string;
  score_type: string;
  current_score: number;
  business_metadata?: {
    size?: string;
    type?: string;
    location_count?: number;
  };
}

export class BenchmarkComparisonService {
  private rdsClient: AwsRdsClient;

  constructor() {
    this.rdsClient = new AwsRdsClient();
  }

  /**
   * Get industry benchmarks for a specific industry and region
   */
  async getIndustryBenchmarks(
    industryId: string, 
    regionId: string, 
    scoreType: string
  ): Promise<ScoreBenchmark | null> {
    try {
      const query = `
        SELECT * FROM score_benchmarks
        WHERE industry_id = ? AND region_id = ? AND score_type = ?
        ORDER BY last_updated DESC
        LIMIT 1
      `;
      
      const result = await this.rdsClient.executeQuery(query, [industryId, regionId, scoreType]);
      
      if (!result.records || result.records.length === 0) {
        return null;
      }

      return this.rdsClient.mapRecord(result.records[0]) as ScoreBenchmark;
    } catch (error) {
      console.error('Error in getIndustryBenchmarks:', error);
      return null;
    }
  }

  /**
   * Compare business score against industry benchmark
   */
  async compareToBenchmark(request: IndustryBenchmarkRequest): Promise<BenchmarkComparison | null> {
    try {
      const benchmark = await this.getIndustryBenchmarks(
        request.industry_id,
        request.region_id,
        request.score_type
      );

      if (!benchmark) {
        // Fallback to national benchmark if regional not available
        const nationalBenchmark = await this.getIndustryBenchmarks(
          request.industry_id,
          'national',
          request.score_type
        );
        
        if (!nationalBenchmark) {
          return null;
        }
        
        return this.calculateComparison(request.current_score, nationalBenchmark);
      }

      return this.calculateComparison(request.current_score, benchmark);
    } catch (error) {
      console.error('Error in compareToBenchmark:', error);
      return null;
    }
  }

  /**
   * Calculate performance comparison and percentile rank
   */
  private calculateComparison(currentScore: number, benchmark: ScoreBenchmark): BenchmarkComparison {
    // Calculate percentile rank
    let percentileRank = 50; // Default to median
    
    if (currentScore <= benchmark.percentile_25) {
      percentileRank = 25 * (currentScore / benchmark.percentile_25);
    } else if (currentScore <= benchmark.percentile_50) {
      percentileRank = 25 + 25 * ((currentScore - benchmark.percentile_25) / (benchmark.percentile_50 - benchmark.percentile_25));
    } else if (currentScore <= benchmark.percentile_75) {
      percentileRank = 50 + 25 * ((currentScore - benchmark.percentile_50) / (benchmark.percentile_75 - benchmark.percentile_50));
    } else if (currentScore <= benchmark.percentile_90) {
      percentileRank = 75 + 15 * ((currentScore - benchmark.percentile_75) / (benchmark.percentile_90 - benchmark.percentile_75));
    } else {
      percentileRank = 90 + 10 * Math.min(1, (currentScore - benchmark.percentile_90) / (benchmark.percentile_90 * 0.1));
    }

    // Determine performance category
    let performanceCategory: BenchmarkComparison['performance_category'];
    if (percentileRank < 25) {
      performanceCategory = 'well_below';
    } else if (percentileRank < 40) {
      performanceCategory = 'below';
    } else if (percentileRank < 60) {
      performanceCategory = 'average';
    } else if (percentileRank < 80) {
      performanceCategory = 'above';
    } else {
      performanceCategory = 'well_above';
    }

    // Calculate improvement potential
    const improvementPotential = Math.max(0, benchmark.percentile_75 - currentScore);

    // Generate position descriptions
    const industryPosition = this.getPositionDescription(percentileRank, 'industry');
    const regionalPosition = this.getPositionDescription(percentileRank, 'region');

    // Generate recommendations
    const recommendations = this.generateRecommendations(performanceCategory, currentScore, benchmark);

    return {
      business_score: currentScore,
      benchmark_value: benchmark.benchmark_value,
      percentile_rank: Math.round(percentileRank),
      performance_category: performanceCategory,
      improvement_potential: Math.round(improvementPotential * 100) / 100,
      industry_position: industryPosition,
      regional_position: regionalPosition,
      recommendations
    };
  }

  /**
   * Generate position description based on percentile rank
   */
  private getPositionDescription(percentileRank: number, scope: 'industry' | 'region'): string {
    const scopeText = scope === 'industry' ? 'der Branche' : 'der Region';
    
    if (percentileRank >= 90) {
      return `Top 10% in ${scopeText}`;
    } else if (percentileRank >= 75) {
      return `Top 25% in ${scopeText}`;
    } else if (percentileRank >= 50) {
      return `Obere Hälfte in ${scopeText}`;
    } else if (percentileRank >= 25) {
      return `Untere Hälfte in ${scopeText}`;
    } else {
      return `Untere 25% in ${scopeText}`;
    }
  }

  /**
   * Generate actionable recommendations based on performance
   */
  private generateRecommendations(
    category: BenchmarkComparison['performance_category'],
    currentScore: number,
    benchmark: ScoreBenchmark
  ): string[] {
    const recommendations: string[] = [];

    switch (category) {
      case 'well_below':
        recommendations.push('Sofortige Maßnahmen zur Verbesserung der Sichtbarkeit erforderlich');
        recommendations.push('Fokus auf Grundlagen: Google My Business Optimierung');
        recommendations.push('Regelmäßige Content-Erstellung und Social Media Aktivität');
        break;
      
      case 'below':
        recommendations.push('Systematische Verbesserung der Online-Präsenz');
        recommendations.push('Verstärkte Kundeninteraktion und Review-Management');
        recommendations.push('Lokale SEO-Optimierung priorisieren');
        break;
      
      case 'average':
        recommendations.push('Kontinuierliche Optimierung für Wettbewerbsvorteile');
        recommendations.push('Spezialisierung auf besonders erfolgreiche Kanäle');
        recommendations.push('Monitoring der Top-Performer in der Region');
        break;
      
      case 'above':
        recommendations.push('Position halten und weiter ausbauen');
        recommendations.push('Best Practices dokumentieren und skalieren');
        recommendations.push('Neue Kanäle und Innovationen testen');
        break;
      
      case 'well_above':
        recommendations.push('Marktführerposition nutzen für weitere Expansion');
        recommendations.push('Thought Leadership und Branding stärken');
        recommendations.push('Mentoring anderer Standorte (bei Franchise-Betrieben)');
        break;
    }

    // Add score-specific recommendations
    const targetScore = benchmark.percentile_75;
    if (currentScore < targetScore) {
      const gap = targetScore - currentScore;
      recommendations.push(`Ziel: Verbesserung um ${Math.round(gap * 100) / 100} Punkte für Top 25% Position`);
    }

    return recommendations;
  }

  /**
   * Get multi-region benchmarks for franchise operations
   */
  async getMultiRegionBenchmarks(
    industryId: string,
    regionIds: string[],
    scoreType: string
  ): Promise<{ [regionId: string]: ScoreBenchmark }> {
    try {
      const placeholders = regionIds.map(() => '?').join(',');
      const query = `
        SELECT * FROM score_benchmarks
        WHERE industry_id = ? AND region_id IN (${placeholders}) AND score_type = ?
        ORDER BY last_updated DESC
      `;
      
      const params = [industryId, ...regionIds, scoreType];
      const result = await this.rdsClient.executeQuery(query, params);
      
      if (!result.records) {
        return {};
      }

      const data = result.records.map(record => 
        this.rdsClient.mapRecord(record) as ScoreBenchmark
      );

      // Group by region_id and take the most recent for each region
      const benchmarksByRegion: { [regionId: string]: ScoreBenchmark } = {};
      
      data.forEach((benchmark: ScoreBenchmark) => {
        if (!benchmarksByRegion[benchmark.region_id] || 
            benchmark.last_updated > benchmarksByRegion[benchmark.region_id].last_updated) {
          benchmarksByRegion[benchmark.region_id] = benchmark;
        }
      });

      return benchmarksByRegion;
    } catch (error) {
      console.error('Error in getMultiRegionBenchmarks:', error);
      return {};
    }
  }

  /**
   * Update benchmark data (admin function)
   */
  async updateBenchmark(benchmark: Omit<ScoreBenchmark, 'id' | 'last_updated'>): Promise<boolean> {
    try {
      // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert functionality
      const query = `
        INSERT INTO score_benchmarks (
          industry_id, region_id, score_type, benchmark_value,
          percentile_25, percentile_50, percentile_75, percentile_90,
          sample_size, data_source, metadata, last_updated, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          benchmark_value = VALUES(benchmark_value),
          percentile_25 = VALUES(percentile_25),
          percentile_50 = VALUES(percentile_50),
          percentile_75 = VALUES(percentile_75),
          percentile_90 = VALUES(percentile_90),
          sample_size = VALUES(sample_size),
          data_source = VALUES(data_source),
          metadata = VALUES(metadata),
          last_updated = NOW(),
          updated_at = NOW()
      `;

      const params = [
        benchmark.industry_id,
        benchmark.region_id,
        benchmark.score_type,
        benchmark.benchmark_value,
        benchmark.percentile_25,
        benchmark.percentile_50,
        benchmark.percentile_75,
        benchmark.percentile_90,
        benchmark.sample_size,
        benchmark.data_source,
        JSON.stringify(benchmark.metadata || {})
      ];

      await this.rdsClient.executeQuery(query, params);
      return true;
    } catch (error) {
      console.error('Error in updateBenchmark:', error);
      return false;
    }
  }
}

// Default industry and region mappings
export const INDUSTRY_MAPPINGS = {
  'restaurant': 'Gastronomie',
  'hotel': 'Hotellerie', 
  'retail': 'Einzelhandel',
  'service': 'Dienstleistung',
  'healthcare': 'Gesundheitswesen',
  'beauty': 'Beauty & Wellness'
} as const;

export const REGION_MAPPINGS = {
  'national': 'Deutschland',
  'bavaria': 'Bayern',
  'nrw': 'Nordrhein-Westfalen',
  'berlin': 'Berlin',
  'hamburg': 'Hamburg',
  'munich': 'München',
  'cologne': 'Köln',
  'frankfurt': 'Frankfurt'
} as const;

export type IndustryType = keyof typeof INDUSTRY_MAPPINGS;
export type RegionType = keyof typeof REGION_MAPPINGS;