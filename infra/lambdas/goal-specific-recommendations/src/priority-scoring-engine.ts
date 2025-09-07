import { 
  Recommendation, 
  GoalProfile, 
  ScoringCriteria, 
  PrioritizedRecommendation,
  RecommendationRequest,
  PrioritizedRecommendationSchema
} from './types';

/**
 * Priority Scoring Engine
 * Scores and prioritizes recommendations based on impact, effort, and business context
 */
export class PriorityScoringEngine {
  /**
   * Score and prioritize recommendations
   */
  public scoreRecommendations(
    recommendations: Recommendation[],
    goalProfile: GoalProfile,
    request: RecommendationRequest
  ): PrioritizedRecommendation[] {
    const scoredRecommendations = recommendations.map(rec => {
      const scoring = this.calculateScoring(rec, goalProfile, request);
      const prioritized: PrioritizedRecommendation = {
        recommendation: rec,
        scoring,
        rank: 0, // Will be set after sorting
        percentile: 0, // Will be set after sorting
        category: this.categorizeRecommendation(rec, scoring),
        dependencies: this.identifyDependencies(rec, recommendations),
        alternatives: this.identifyAlternatives(rec, recommendations),
        customizations: []
      };
      return prioritized;
    });

    // Sort by overall score
    scoredRecommendations.sort((a, b) => b.scoring.overallScore - a.scoring.overallScore);

    // Assign ranks and percentiles
    scoredRecommendations.forEach((rec, index) => {
      rec.rank = index + 1;
      rec.percentile = Math.round(((scoredRecommendations.length - index) / scoredRecommendations.length) * 100);
    });

    return scoredRecommendations.map(rec => PrioritizedRecommendationSchema.parse(rec));
  }

  /**
   * Calculate comprehensive scoring for a recommendation
   */
  private calculateScoring(
    recommendation: Recommendation,
    goalProfile: GoalProfile,
    request: RecommendationRequest
  ): ScoringCriteria {
    const impactScore = this.calculateImpactScore(recommendation, goalProfile);
    const effortScore = this.calculateEffortScore(recommendation, request);
    const urgencyScore = this.calculateUrgencyScore(recommendation, goalProfile);
    const feasibilityScore = this.calculateFeasibilityScore(recommendation, request);
    const alignmentScore = this.calculateAlignmentScore(recommendation, goalProfile);
    const roiScore = this.calculateROIScore(recommendation);
    const riskScore = this.calculateRiskScore(recommendation);
    const competitiveAdvantageScore = this.calculateCompetitiveAdvantageScore(recommendation, goalProfile);

    // Calculate weighted overall score
    const weights = goalProfile.recommendationWeights;
    const overallScore = Math.round(
      (impactScore * weights.impact) +
      (effortScore * weights.effort) +
      (urgencyScore * weights.priority) +
      (feasibilityScore * 0.15) +
      (alignmentScore * 0.15) +
      (roiScore * 0.1) +
      (riskScore * 0.1) +
      (competitiveAdvantageScore * 0.1)
    );

    const reasoning = this.generateScoringReasoning(
      recommendation,
      {
        impactScore,
        effortScore,
        urgencyScore,
        feasibilityScore,
        alignmentScore,
        roiScore,
        riskScore,
        competitiveAdvantageScore,
        overallScore
      }
    );

    return {
      impactScore,
      effortScore,
      urgencyScore,
      feasibilityScore,
      alignmentScore,
      roiScore,
      riskScore,
      competitiveAdvantageScore,
      overallScore,
      reasoning
    };
  }

  /**
   * Calculate impact score based on potential business impact
   */
  private calculateImpactScore(
    recommendation: Recommendation,
    goalProfile: GoalProfile
  ): number {
    let score = 50; // Base score

    // Impact level mapping
    switch (recommendation.impact) {
      case 'low': score += 10; break;
      case 'medium': score += 30; break;
      case 'high': score += 50; break;
    }

    // Objective alignment bonus
    if (recommendation.objective === goalProfile.primaryObjective) {
      score += 20;
    } else if (goalProfile.secondaryObjectives.includes(recommendation.objective)) {
      score += 10;
    }

    // ROI bonus
    if (recommendation.estimatedROI && recommendation.estimatedROI.percentage > 200) {
      score += 15;
    }

    // Success metrics quality
    if (recommendation.successMetrics.length >= 3) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate effort score (inverse - lower effort = higher score)
   */
  private calculateEffortScore(
    recommendation: Recommendation,
    request: RecommendationRequest
  ): number {
    let score = 50; // Base score

    // Effort level mapping (inverse scoring)
    switch (recommendation.effort) {
      case 'low': score += 40; break;
      case 'medium': score += 20; break;
      case 'high': score -= 10; break;
    }

    // Cost consideration
    if (recommendation.estimatedCost) {
      const budget = request.constraints.budget?.amount || 10000;
      const costRatio = recommendation.estimatedCost.max / budget;
      
      if (costRatio < 0.1) score += 20;
      else if (costRatio < 0.3) score += 10;
      else if (costRatio > 0.7) score -= 20;
    }

    // Prerequisites complexity
    if (recommendation.prerequisites.length <= 2) {
      score += 15;
    } else if (recommendation.prerequisites.length > 5) {
      score -= 15;
    }

    // Steps complexity
    if (recommendation.steps.length <= 3) {
      score += 10;
    } else if (recommendation.steps.length > 8) {
      score -= 10;
    }

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Calculate urgency score based on timeframe and priority
   */
  private calculateUrgencyScore(
    recommendation: Recommendation,
    goalProfile: GoalProfile
  ): number {
    let score = 50; // Base score

    // Priority level mapping
    switch (recommendation.priority) {
      case 'low': score += 10; break;
      case 'medium': score += 25; break;
      case 'high': score += 40; break;
      case 'critical': score += 50; break;
    }

    // Timeframe urgency
    switch (recommendation.timeframe) {
      case 'immediate': score += 30; break;
      case 'short_term': score += 20; break;
      case 'medium_term': score += 10; break;
      case 'long_term': score -= 10; break;
    }

    // Competition level urgency
    const competitionLevel = goalProfile.industryContext.competitionLevel;
    if (competitionLevel === 'intense') {
      score += 15;
    } else if (competitionLevel === 'high') {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate feasibility score based on constraints and resources
   */
  private calculateFeasibilityScore(
    recommendation: Recommendation,
    request: RecommendationRequest
  ): number {
    let score = 70; // Base score (assume most recommendations are feasible)

    // Budget feasibility
    if (recommendation.estimatedCost && request.constraints.budget) {
      const budget = request.constraints.budget.amount;
      if (recommendation.estimatedCost.min > budget) {
        score -= 40;
      } else if (recommendation.estimatedCost.max > budget * 1.5) {
        score -= 20;
      }
    }

    // Resource availability
    const availableResources = request.constraints.resources;
    const requiredResources = recommendation.steps.flatMap(step => step.resources);
    
    const resourceMatch = requiredResources.filter(resource => 
      availableResources.some(available => 
        available.toLowerCase().includes(resource.toLowerCase()) ||
        resource.toLowerCase().includes(available.toLowerCase())
      )
    ).length;
    
    const resourceScore = (resourceMatch / requiredResources.length) * 30;
    score += resourceScore - 15; // Adjust baseline

    // Timeline feasibility
    if (request.constraints.timeline) {
      const timelineMonths = this.getTimelineInMonths(request.constraints.timeline);
      const recTimeframe = this.getTimeframeInMonths(recommendation.timeframe);
      
      if (recTimeframe > timelineMonths) {
        score -= 30;
      } else if (recTimeframe <= timelineMonths * 0.5) {
        score += 10;
      }
    }

    // Limitation constraints
    const limitations = request.constraints.limitations;
    if (limitations.includes('no_technical_resources') && 
        recommendation.category === 'technology_upgrade') {
      score -= 25;
    }
    if (limitations.includes('limited_staff_time') && 
        recommendation.effort === 'high') {
      score -= 15;
    }

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Calculate alignment score with business objectives
   */
  private calculateAlignmentScore(
    recommendation: Recommendation,
    goalProfile: GoalProfile
  ): number {
    let score = 30; // Base score

    // Primary objective alignment
    if (recommendation.objective === goalProfile.primaryObjective) {
      score += 50;
    }

    // Secondary objective alignment
    if (goalProfile.secondaryObjectives.includes(recommendation.objective)) {
      score += 25;
    }

    // Key metrics alignment
    const alignedMetrics = recommendation.successMetrics.filter(metric =>
      goalProfile.keyMetrics.some(goalMetric =>
        metric.metric.toLowerCase().includes(goalMetric.name.toLowerCase()) ||
        goalMetric.name.toLowerCase().includes(metric.metric.toLowerCase())
      )
    );
    
    score += (alignedMetrics.length / recommendation.successMetrics.length) * 20;

    // Target audience alignment
    const audienceAlignment = this.calculateAudienceAlignment(recommendation, goalProfile);
    score += audienceAlignment;

    return Math.min(score, 100);
  }

  /**
   * Calculate ROI score based on estimated returns
   */
  private calculateROIScore(recommendation: Recommendation): number {
    if (!recommendation.estimatedROI) {
      return 50; // Neutral score for unknown ROI
    }

    const roiPercentage = recommendation.estimatedROI.percentage;
    
    if (roiPercentage >= 400) return 100;
    if (roiPercentage >= 300) return 90;
    if (roiPercentage >= 200) return 80;
    if (roiPercentage >= 150) return 70;
    if (roiPercentage >= 100) return 60;
    if (roiPercentage >= 50) return 40;
    return 20;
  }

  /**
   * Calculate risk score (inverse - lower risk = higher score)
   */
  private calculateRiskScore(recommendation: Recommendation): number {
    let score = 80; // Base score (assume low risk)

    // Risk assessment based on identified risks
    for (const risk of recommendation.risks) {
      switch (risk.probability) {
        case 'low': score -= 5; break;
        case 'medium': score -= 15; break;
        case 'high': score -= 25; break;
      }
    }

    // Effort-based risk
    switch (recommendation.effort) {
      case 'high': score -= 10; break;
      case 'medium': score -= 5; break;
    }

    // Cost-based risk
    if (recommendation.estimatedCost && recommendation.estimatedCost.max > 5000) {
      score -= 10;
    }

    // Complexity-based risk
    if (recommendation.steps.length > 6) {
      score -= 10;
    }

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Calculate competitive advantage score
   */
  private calculateCompetitiveAdvantageScore(
    recommendation: Recommendation,
    goalProfile: GoalProfile
  ): number {
    let score = 50; // Base score

    // Category-based advantage
    switch (recommendation.category) {
      case 'technology_upgrade': score += 20; break;
      case 'competitive_analysis': score += 25; break;
      case 'content_creation': score += 15; break;
      case 'customer_experience': score += 20; break;
      case 'operational_improvement': score += 15; break;
    }

    // Objective-based advantage
    switch (recommendation.objective) {
      case 'competitive_positioning': score += 30; break;
      case 'build_brand_awareness': score += 20; break;
      case 'increase_visibility': score += 15; break;
    }

    // Innovation factor
    if (recommendation.tags.includes('innovation') || 
        recommendation.tags.includes('technology')) {
      score += 15;
    }

    // Market competition adjustment
    const competitionLevel = goalProfile.industryContext.competitionLevel;
    switch (competitionLevel) {
      case 'intense': score += 20; break;
      case 'high': score += 15; break;
      case 'medium': score += 10; break;
      case 'low': score += 5; break;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate audience alignment score
   */
  private calculateAudienceAlignment(
    recommendation: Recommendation,
    goalProfile: GoalProfile
  ): number {
    // This is a simplified alignment calculation
    // In a real implementation, this would analyze recommendation content
    // against target audience characteristics
    
    const targetAudience = goalProfile.targetAudience;
    let alignmentScore = 0;

    // Check if recommendation tags align with audience behaviors
    const behaviorAlignment = recommendation.tags.filter(tag =>
      targetAudience.behaviors.some(behavior =>
        behavior.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(behavior.toLowerCase())
      )
    ).length;

    alignmentScore += (behaviorAlignment / recommendation.tags.length) * 10;

    // Check if recommendation category aligns with audience preferences
    const categoryAlignment = targetAudience.preferences.some(pref =>
      pref.toLowerCase().includes(recommendation.category.toLowerCase()) ||
      recommendation.category.toLowerCase().includes(pref.toLowerCase())
    );

    if (categoryAlignment) {
      alignmentScore += 10;
    }

    return Math.min(alignmentScore, 20);
  }

  /**
   * Categorize recommendation based on scoring
   */
  private categorizeRecommendation(
    recommendation: Recommendation,
    scoring: Partial<ScoringCriteria>
  ): 'quick_win' | 'strategic_initiative' | 'long_term_investment' | 'maintenance' {
    const impact = scoring.impactScore || 0;
    const effort = scoring.effortScore || 0;
    const urgency = scoring.urgencyScore || 0;

    // Quick wins: High impact, low effort, high urgency
    if (impact >= 70 && effort >= 70 && urgency >= 70) {
      return 'quick_win';
    }

    // Strategic initiatives: High impact, medium-high effort
    if (impact >= 70 && effort >= 40) {
      return 'strategic_initiative';
    }

    // Long-term investments: High impact, high effort, lower urgency
    if (impact >= 60 && effort <= 40 && urgency <= 50) {
      return 'long_term_investment';
    }

    // Maintenance: Lower impact, various effort levels
    return 'maintenance';
  }

  /**
   * Identify dependencies between recommendations
   */
  private identifyDependencies(
    recommendation: Recommendation,
    allRecommendations: Recommendation[]
  ): string[] {
    const dependencies: string[] = [];

    // Simple dependency logic based on categories and prerequisites
    for (const other of allRecommendations) {
      if (other.id === recommendation.id) continue;

      // Check if other recommendation's output is in this recommendation's prerequisites
      const hasPrerequisiteDependency = recommendation.prerequisites.some(prereq =>
        other.title.toLowerCase().includes(prereq.toLowerCase()) ||
        other.category === prereq.toLowerCase().replace(/\s+/g, '_')
      );

      if (hasPrerequisiteDependency) {
        dependencies.push(other.id);
      }

      // Logical dependencies based on categories
      if (this.hasLogicalDependency(recommendation, other)) {
        dependencies.push(other.id);
      }
    }

    return dependencies;
  }

  /**
   * Check for logical dependencies between recommendations
   */
  private hasLogicalDependency(rec1: Recommendation, rec2: Recommendation): boolean {
    // Social media content depends on social media presence
    if (rec1.category === 'content_creation' && 
        rec2.category === 'social_media' &&
        rec2.title.toLowerCase().includes('presence')) {
      return true;
    }

    // Review management depends on review request system
    if (rec1.title.toLowerCase().includes('review') && 
        rec1.title.toLowerCase().includes('management') &&
        rec2.title.toLowerCase().includes('review') && 
        rec2.title.toLowerCase().includes('request')) {
      return true;
    }

    // Advanced features depend on basic setup
    if (rec1.effort === 'high' && rec2.effort === 'low' &&
        rec1.category === rec2.category) {
      return true;
    }

    return false;
  }

  /**
   * Identify alternative recommendations
   */
  private identifyAlternatives(
    recommendation: Recommendation,
    allRecommendations: Recommendation[]
  ): string[] {
    const alternatives: string[] = [];

    for (const other of allRecommendations) {
      if (other.id === recommendation.id) continue;

      // Same objective and category = alternative approach
      if (other.objective === recommendation.objective &&
          other.category === recommendation.category) {
        alternatives.push(other.id);
      }

      // Similar success metrics = alternative approach
      const sharedMetrics = recommendation.successMetrics.filter(metric =>
        other.successMetrics.some(otherMetric =>
          metric.metric.toLowerCase() === otherMetric.metric.toLowerCase()
        )
      );

      if (sharedMetrics.length >= 2) {
        alternatives.push(other.id);
      }
    }

    return alternatives;
  }

  /**
   * Generate scoring reasoning
   */
  private generateScoringReasoning(
    recommendation: Recommendation,
    scores: Partial<ScoringCriteria>
  ): string[] {
    const reasoning: string[] = [];

    // Impact reasoning
    if ((scores.impactScore || 0) >= 80) {
      reasoning.push(`High impact potential due to ${recommendation.impact} expected business impact and strong ROI projections`);
    } else if ((scores.impactScore || 0) <= 40) {
      reasoning.push(`Limited impact expected based on ${recommendation.impact} impact level and objective alignment`);
    }

    // Effort reasoning
    if ((scores.effortScore || 0) >= 80) {
      reasoning.push(`Low implementation effort with ${recommendation.effort} complexity and minimal prerequisites`);
    } else if ((scores.effortScore || 0) <= 40) {
      reasoning.push(`High implementation effort due to ${recommendation.effort} complexity and resource requirements`);
    }

    // Urgency reasoning
    if ((scores.urgencyScore || 0) >= 80) {
      reasoning.push(`High urgency due to ${recommendation.priority} priority and ${recommendation.timeframe} timeframe`);
    }

    // ROI reasoning
    if (recommendation.estimatedROI && recommendation.estimatedROI.percentage >= 200) {
      reasoning.push(`Strong ROI potential with ${recommendation.estimatedROI.percentage}% estimated return`);
    }

    // Risk reasoning
    if ((scores.riskScore || 0) >= 80) {
      reasoning.push(`Low risk implementation with ${recommendation.risks.length} identified risks and mitigation strategies`);
    }

    return reasoning;
  }

  /**
   * Convert timeline to months
   */
  private getTimelineInMonths(timeline: { start: string; end: string }): number {
    const start = new Date(timeline.start);
    const end = new Date(timeline.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 30);
  }

  /**
   * Convert timeframe to months
   */
  private getTimeframeInMonths(timeframe: string): number {
    switch (timeframe) {
      case 'immediate': return 0.25;
      case 'short_term': return 3;
      case 'medium_term': return 6;
      case 'long_term': return 12;
      default: return 6;
    }
  }
}