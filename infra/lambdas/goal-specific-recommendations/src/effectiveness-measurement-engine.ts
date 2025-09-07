import { 
  RecommendationProgress, 
  PrioritizedRecommendation,
  BusinessObjective,
  RecommendationRequest
} from './types';
import { ProgressTrackingManager } from './progress-tracking-manager';

/**
 * Effectiveness Measurement Engine
 * Measures and analyzes the effectiveness of implemented recommendations
 */
export class EffectivenessMeasurementEngine {
  private progressManager: ProgressTrackingManager;

  constructor() {
    this.progressManager = new ProgressTrackingManager();
  }

  /**
   * Measure recommendation effectiveness
   */
  public async measureEffectiveness(
    recommendationId: string,
    businessId: string,
    actualMetrics: Record<string, number>
  ): Promise<{
    effectivenessScore: number;
    impactAnalysis: {
      predicted: number;
      actual: number;
      variance: number;
      category: 'exceeded' | 'met' | 'underperformed';
    };
    effortAnalysis: {
      predicted: number;
      actual: number;
      variance: number;
      category: 'easier' | 'as_expected' | 'harder';
    };
    roiAnalysis: {
      predicted?: number;
      actual?: number;
      variance?: number;
      category?: 'exceeded' | 'met' | 'underperformed';
    };
    recommendations: string[];
  }> {
    const progress = await this.progressManager.getProgress(recommendationId, businessId);
    if (!progress || !progress.effectiveness) {
      throw new Error('No effectiveness data available for this recommendation');
    }

    const effectiveness = progress.effectiveness;
    
    // Calculate impact analysis
    const impactAnalysis = this.analyzeImpact(
      this.getImpactScore(progress.recommendation?.impact || 'medium'),
      effectiveness.actualImpact
    );

    // Calculate effort analysis
    const effortAnalysis = this.analyzeEffort(
      this.getEffortScore(progress.recommendation?.effort || 'medium'),
      effectiveness.actualEffort
    );

    // Calculate ROI analysis
    const roiAnalysis = this.analyzeROI(
      progress.recommendation?.estimatedROI?.percentage,
      effectiveness.actualROI
    );

    // Calculate overall effectiveness score
    const effectivenessScore = this.calculateOverallEffectiveness(
      impactAnalysis,
      effortAnalysis,
      roiAnalysis
    );

    // Generate recommendations for improvement
    const recommendations = this.generateImprovementRecommendations(
      impactAnalysis,
      effortAnalysis,
      roiAnalysis,
      effectiveness.lessonsLearned
    );

    return {
      effectivenessScore,
      impactAnalysis,
      effortAnalysis,
      roiAnalysis,
      recommendations
    };
  }

  /**
   * Generate effectiveness report for all recommendations
   */
  public async generateEffectivenessReport(businessId: string): Promise<{
    summary: {
      totalRecommendations: number;
      completedRecommendations: number;
      averageEffectiveness: number;
      successRate: number;
      topPerformingCategories: string[];
      underperformingCategories: string[];
    };
    insights: {
      bestPractices: string[];
      commonChallenges: string[];
      improvementOpportunities: string[];
    };
    recommendations: {
      strategic: string[];
      operational: string[];
      tactical: string[];
    };
  }> {
    const analytics = await this.progressManager.getEffectivenessAnalytics(businessId);
    const allProgress = await this.progressManager.getBusinessProgress(businessId);
    
    // Analyze performance by category
    const categoryPerformance = this.analyzeCategoryPerformance(allProgress);
    
    // Generate insights
    const insights = this.generateInsights(allProgress, analytics);
    
    // Generate strategic recommendations
    const recommendations = this.generateStrategicRecommendations(
      analytics,
      categoryPerformance,
      insights
    );

    return {
      summary: {
        totalRecommendations: allProgress.length,
        completedRecommendations: analytics.totalCompleted,
        averageEffectiveness: this.calculateAverageEffectiveness(allProgress),
        successRate: analytics.recommendationRate,
        topPerformingCategories: categoryPerformance.top,
        underperformingCategories: categoryPerformance.bottom
      },
      insights,
      recommendations
    };
  }

  /**
   * Optimize future recommendations based on effectiveness data
   */
  public async optimizeRecommendations(
    businessId: string,
    newRecommendations: PrioritizedRecommendation[]
  ): Promise<PrioritizedRecommendation[]> {
    const analytics = await this.progressManager.getEffectivenessAnalytics(businessId);
    const allProgress = await this.progressManager.getBusinessProgress(businessId);
    
    // Learn from past performance
    const learnings = this.extractLearnings(allProgress);
    
    // Adjust recommendations based on learnings
    return newRecommendations.map(rec => this.adjustRecommendation(rec, learnings, analytics));
  }

  /**
   * Analyze impact performance
   */
  private analyzeImpact(predicted: number, actual: number) {
    const variance = ((actual - predicted) / predicted) * 100;
    let category: 'exceeded' | 'met' | 'underperformed';
    
    if (variance > 20) category = 'exceeded';
    else if (variance >= -10) category = 'met';
    else category = 'underperformed';

    return { predicted, actual, variance, category };
  }

  /**
   * Analyze effort performance
   */
  private analyzeEffort(predicted: number, actual: number) {
    const variance = ((actual - predicted) / predicted) * 100;
    let category: 'easier' | 'as_expected' | 'harder';
    
    if (variance < -20) category = 'easier';
    else if (variance <= 10) category = 'as_expected';
    else category = 'harder';

    return { predicted, actual, variance, category };
  }

  /**
   * Analyze ROI performance
   */
  private analyzeROI(predicted?: number, actual?: number) {
    if (!predicted || !actual) {
      return {};
    }

    const variance = ((actual - predicted) / predicted) * 100;
    let category: 'exceeded' | 'met' | 'underperformed';
    
    if (variance > 25) category = 'exceeded';
    else if (variance >= -15) category = 'met';
    else category = 'underperformed';

    return { predicted, actual, variance, category };
  }

  /**
   * Calculate overall effectiveness score
   */
  private calculateOverallEffectiveness(
    impactAnalysis: any,
    effortAnalysis: any,
    roiAnalysis: any
  ): number {
    let score = 50; // Base score

    // Impact contribution (40% weight)
    switch (impactAnalysis.category) {
      case 'exceeded': score += 20; break;
      case 'met': score += 10; break;
      case 'underperformed': score -= 15; break;
    }

    // Effort contribution (30% weight)
    switch (effortAnalysis.category) {
      case 'easier': score += 15; break;
      case 'as_expected': score += 5; break;
      case 'harder': score -= 10; break;
    }

    // ROI contribution (30% weight)
    if (roiAnalysis.category) {
      switch (roiAnalysis.category) {
        case 'exceeded': score += 15; break;
        case 'met': score += 5; break;
        case 'underperformed': score -= 10; break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate improvement recommendations
   */
  private generateImprovementRecommendations(
    impactAnalysis: any,
    effortAnalysis: any,
    roiAnalysis: any,
    lessonsLearned: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Impact-based recommendations
    if (impactAnalysis.category === 'underperformed') {
      recommendations.push('Consider more thorough market research before implementation');
      recommendations.push('Increase measurement frequency to catch issues early');
    } else if (impactAnalysis.category === 'exceeded') {
      recommendations.push('Document success factors for replication in similar initiatives');
    }

    // Effort-based recommendations
    if (effortAnalysis.category === 'harder') {
      recommendations.push('Allocate more time for planning and resource preparation');
      recommendations.push('Consider breaking down complex initiatives into smaller phases');
    } else if (effortAnalysis.category === 'easier') {
      recommendations.push('Consider accelerating similar initiatives');
    }

    // ROI-based recommendations
    if (roiAnalysis.category === 'underperformed') {
      recommendations.push('Review cost estimation methodology');
      recommendations.push('Consider alternative implementation approaches');
    }

    // Lessons learned integration
    if (lessonsLearned.length > 0) {
      recommendations.push('Apply documented lessons learned to future similar initiatives');
    }

    return recommendations;
  }

  /**
   * Analyze performance by category
   */
  private analyzeCategoryPerformance(allProgress: RecommendationProgress[]) {
    const categoryScores: Record<string, number[]> = {};
    
    allProgress
      .filter(p => p.effectiveness)
      .forEach(progress => {
        const category = progress.recommendation?.category || 'unknown';
        if (!categoryScores[category]) {
          categoryScores[category] = [];
        }
        categoryScores[category].push(progress.effectiveness!.actualImpact);
      });

    const categoryAverages = Object.entries(categoryScores)
      .map(([category, scores]) => ({
        category,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .sort((a, b) => b.average - a.average);

    return {
      top: categoryAverages.slice(0, 3).map(c => c.category),
      bottom: categoryAverages.slice(-3).map(c => c.category)
    };
  }

  /**
   * Generate insights from effectiveness data
   */
  private generateInsights(
    allProgress: RecommendationProgress[],
    analytics: any
  ) {
    const bestPractices: string[] = [];
    const commonChallenges: string[] = [];
    const improvementOpportunities: string[] = [];

    // Analyze success patterns
    const successful = allProgress.filter(p => 
      p.effectiveness && p.effectiveness.actualImpact >= 70
    );

    if (successful.length > 0) {
      bestPractices.push('High-impact initiatives show consistent success');
      if (analytics.averageEffort < 60) {
        bestPractices.push('Focus on low-effort, high-impact recommendations');
      }
    }

    // Analyze challenge patterns
    const challenging = allProgress.filter(p => 
      p.effectiveness && p.effectiveness.actualEffort > 80
    );

    if (challenging.length > allProgress.length * 0.3) {
      commonChallenges.push('Resource allocation often exceeds estimates');
      improvementOpportunities.push('Improve effort estimation accuracy');
    }

    // ROI analysis
    if (analytics.averageROI < 150) {
      improvementOpportunities.push('Focus on higher ROI initiatives');
    }

    // Recommendation rate analysis
    if (analytics.recommendationRate < 70) {
      improvementOpportunities.push('Improve recommendation selection criteria');
    }

    return {
      bestPractices,
      commonChallenges,
      improvementOpportunities
    };
  }

  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    analytics: any,
    categoryPerformance: any,
    insights: any
  ) {
    const strategic: string[] = [];
    const operational: string[] = [];
    const tactical: string[] = [];

    // Strategic recommendations
    if (analytics.averageImpact < 60) {
      strategic.push('Reassess business objectives and recommendation alignment');
    }
    
    if (categoryPerformance.top.length > 0) {
      strategic.push(`Focus future initiatives on high-performing categories: ${categoryPerformance.top.join(', ')}`);
    }

    // Operational recommendations
    if (analytics.averageEffort > 70) {
      operational.push('Implement better resource planning and allocation processes');
    }
    
    if (insights.commonChallenges.length > 2) {
      operational.push('Develop standardized challenge mitigation protocols');
    }

    // Tactical recommendations
    if (analytics.recommendationRate < 80) {
      tactical.push('Improve recommendation quality through better filtering');
    }
    
    tactical.push('Increase measurement frequency for better tracking');

    return { strategic, operational, tactical };
  }

  /**
   * Extract learnings from past performance
   */
  private extractLearnings(allProgress: RecommendationProgress[]) {
    const learnings = {
      highPerformingCategories: new Set<string>(),
      lowPerformingCategories: new Set<string>(),
      effortUnderestimates: new Set<string>(),
      impactOverestimates: new Set<string>(),
      successFactors: [] as string[]
    };

    allProgress
      .filter(p => p.effectiveness)
      .forEach(progress => {
        const category = progress.recommendation?.category || 'unknown';
        const effectiveness = progress.effectiveness!;
        
        if (effectiveness.actualImpact >= 70) {
          learnings.highPerformingCategories.add(category);
        } else if (effectiveness.actualImpact < 40) {
          learnings.lowPerformingCategories.add(category);
        }
        
        if (effectiveness.actualEffort > 80) {
          learnings.effortUnderestimates.add(category);
        }
        
        learnings.successFactors.push(...effectiveness.lessonsLearned);
      });

    return learnings;
  }

  /**
   * Adjust recommendation based on learnings
   */
  private adjustRecommendation(
    recommendation: PrioritizedRecommendation,
    learnings: any,
    analytics: any
  ): PrioritizedRecommendation {
    const adjusted = { ...recommendation };
    const category = recommendation.recommendation.category;

    // Adjust scoring based on category performance
    if (learnings.highPerformingCategories.has(category)) {
      adjusted.scoring.overallScore = Math.min(100, adjusted.scoring.overallScore + 10);
      adjusted.rank = Math.max(1, adjusted.rank - 2);
    } else if (learnings.lowPerformingCategories.has(category)) {
      adjusted.scoring.overallScore = Math.max(0, adjusted.scoring.overallScore - 15);
      adjusted.rank = adjusted.rank + 3;
    }

    // Adjust effort estimates
    if (learnings.effortUnderestimates.has(category)) {
      adjusted.scoring.effortScore = Math.max(0, adjusted.scoring.effortScore - 10);
    }

    // Add customizations based on learnings
    if (learnings.successFactors.length > 0) {
      adjusted.customizations.push({
        field: 'implementation_notes',
        originalValue: '',
        customValue: `Consider these success factors: ${learnings.successFactors.slice(0, 3).join(', ')}`,
        reason: 'Based on past performance analysis'
      });
    }

    return adjusted;
  }

  /**
   * Calculate average effectiveness across all recommendations
   */
  private calculateAverageEffectiveness(allProgress: RecommendationProgress[]): number {
    const withEffectiveness = allProgress.filter(p => p.effectiveness);
    
    if (withEffectiveness.length === 0) return 0;
    
    const totalEffectiveness = withEffectiveness.reduce((sum, p) => {
      const impact = p.effectiveness!.actualImpact;
      const effort = 100 - p.effectiveness!.actualEffort; // Inverse effort
      return sum + ((impact + effort) / 2);
    }, 0);
    
    return totalEffectiveness / withEffectiveness.length;
  }

  /**
   * Get impact score from impact level
   */
  private getImpactScore(impact: string): number {
    switch (impact) {
      case 'low': return 30;
      case 'medium': return 60;
      case 'high': return 90;
      default: return 60;
    }
  }

  /**
   * Get effort score from effort level
   */
  private getEffortScore(effort: string): number {
    switch (effort) {
      case 'low': return 30;
      case 'medium': return 60;
      case 'high': return 90;
      default: return 60;
    }
  }
}