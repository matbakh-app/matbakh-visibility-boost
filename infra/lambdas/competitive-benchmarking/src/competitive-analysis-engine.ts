import {
  Competitor,
  PlatformMetrics,
  CompetitorAnalysis,
  BenchmarkingRequest,
  BenchmarkingResponse,
  AnalysisError,
  AnalysisConfig
} from './types';
import { StrategicFrameworksEngine } from './strategic-frameworks-engine';

// --- intern: verhindert TS6133 ohne Logik zu verändern ---
const __use = (..._args: unknown[]): void => {};

/**
 * Competitive Analysis Engine
 * 
 * Analyzes competitor data and generates insights:
 * - Visibility score calculation
 * - SWOT analysis generation
 * - Market positioning analysis
 * - Actionable recommendations
 */
export class CompetitiveAnalysisEngine {
  private config: AnalysisConfig;
  private strategicFrameworksEngine: StrategicFrameworksEngine;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.strategicFrameworksEngine = new StrategicFrameworksEngine();
  }

  /**
   * Analyze competitors and generate comprehensive benchmarking report
   */
  async analyzeBenchmarking(
    request: BenchmarkingRequest,
    competitors: Competitor[],
    platformData: Map<string, PlatformMetrics[]>
  ): Promise<BenchmarkingResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Analyzing ${competitors.length} competitors for ${request.businessName}`);

      // Analyze each competitor
      const competitorAnalyses: CompetitorAnalysis[] = [];
      
      for (const competitor of competitors) {
        const platforms = platformData.get(competitor.id) || [];
        const analysis = await this.analyzeCompetitor(competitor, platforms, request);
        competitorAnalyses.push(analysis);
      }

      // Generate market insights
      const marketInsights = this.generateMarketInsights(competitorAnalyses, request);

      // Generate recommendations
      const recommendations = this.generateRecommendations(competitorAnalyses, marketInsights, request);

      // Calculate data quality metrics
      const dataQuality = this.calculateDataQuality(competitorAnalyses, platformData);

      const processingTime = Date.now() - startTime;

      const response: BenchmarkingResponse = {
        requestId: `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        businessId: request.businessId,
        analysisDate: new Date().toISOString(),
        competitors: competitorAnalyses,
        marketInsights,
        recommendations,
        dataQuality,
        processingTime,
        cacheHit: false, // This would be set by the calling function
        nextUpdateRecommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      console.log(`Competitive analysis completed in ${processingTime}ms`);
      return response;

    } catch (error) {
      console.error('Competitive analysis failed:', error);
      throw new AnalysisError(
        `Failed to analyze competitors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'benchmarking_analysis',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyze individual competitor
   */
  private async analyzeCompetitor(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    request: BenchmarkingRequest
  ): Promise<CompetitorAnalysis> {
    try {
      // Calculate visibility scores
      const visibilityScore = this.calculateVisibilityScore(platforms);

      // Generate comprehensive strategic analysis
      const strategicAnalysis = await this.strategicFrameworksEngine.generateStrategicAnalysis(
        competitor,
        platforms,
        visibilityScore,
        request,
        {
          averageScore: 50, // Default average score for individual analysis
          competitorCount: 1 // Single competitor analysis
          // marketLeader omitted (not undefined) for exactOptionalPropertyTypes compliance
        }
      );

      // Generate key insights
      const keyInsights = this.generateKeyInsights(competitor, platforms, visibilityScore);

      // Generate recommended actions from all frameworks
      const recommendedActions = this.generateRecommendedActions(
        competitor,
        platforms,
        visibilityScore,
        strategicAnalysis
      );

      // Calculate data freshness
      const dataFreshness = this.calculateDataFreshness(platforms);

      const analysis: CompetitorAnalysis = {
        competitor,
        platforms,
        visibilityScore,
        strategicAnalysis,
        keyInsights,
        recommendedActions,
        analysisDate: new Date().toISOString(),
        dataFreshness
      };

      return analysis;

    } catch (error) {
      console.error(`Failed to analyze competitor ${competitor.name}:`, error);
      throw new AnalysisError(
        `Failed to analyze competitor ${competitor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'competitor_analysis',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculate visibility score for competitor
   */
  private calculateVisibilityScore(platforms: PlatformMetrics[]): {
    overall: number;
    google: number;
    social: number;
    reviews: number;
    photos: number;
  } {
    let googleScore = 0;
    let socialScore = 0;
    let reviewsScore = 0;
    let photosScore = 0;

    for (const platform of platforms) {
      switch (platform.platform) {
        case 'google':
          googleScore = this.calculateGoogleScore(platform);
          break;
        case 'instagram':
        case 'facebook':
          socialScore = Math.max(socialScore, this.calculateSocialScore(platform));
          break;
        case 'yelp':
        case 'tripadvisor':
          reviewsScore = Math.max(reviewsScore, this.calculateReviewScore(platform));
          break;
      }

      // Photos score from any platform
      if (platform.photos?.count) {
        photosScore = Math.max(photosScore, this.calculatePhotoScore(platform));
      }
    }

    // Calculate weighted overall score
    const overall = (
      googleScore * this.config.weightings.google +
      socialScore * this.config.weightings.social +
      reviewsScore * this.config.weightings.reviews +
      photosScore * this.config.weightings.photos
    ) / (this.config.weightings.google + this.config.weightings.social + this.config.weightings.reviews + this.config.weightings.photos);

    return {
      overall: Math.round(overall),
      google: Math.round(googleScore),
      social: Math.round(socialScore),
      reviews: Math.round(reviewsScore),
      photos: Math.round(photosScore)
    };
  }

  /**
   * Calculate Google-specific visibility score
   */
  private calculateGoogleScore(platform: PlatformMetrics): number {
    let score = 20; // Base score for having a Google presence

    if (platform.reviews) {
      // Review count contribution (0-30 points)
      const reviewCount = platform.reviews.count;
      score += Math.min(reviewCount / 10, 30);

      // Rating contribution (0-25 points)
      const rating = platform.reviews.averageRating;
      score += (rating / 5) * 25;
    }

    if (platform.photos?.count) {
      // Photo count contribution (0-15 points)
      score += Math.min(platform.photos.count / 5, 15);
    }

    if (platform.businessHours) {
      // Business hours completeness (0-10 points)
      const hoursCount = Object.keys(platform.businessHours).length;
      score += (hoursCount / 7) * 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate social media visibility score
   */
  private calculateSocialScore(platform: PlatformMetrics): number {
    let score = 10; // Base score for having social presence

    if (platform.isVerified) {
      score += 20; // Verification bonus
    }

    if (platform.followers) {
      // Follower count contribution (0-40 points)
      score += Math.min(Math.log10(platform.followers + 1) * 8, 40);
    }

    if (platform.posts) {
      // Post count contribution (0-20 points)
      score += Math.min(platform.posts / 10, 20);
    }

    if (platform.photos?.count) {
      // Photo quality contribution (0-10 points)
      score += Math.min(platform.photos.count / 20, 10);
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate review platform score
   */
  private calculateReviewScore(platform: PlatformMetrics): number {
    let score = 15; // Base score for having review presence

    if (platform.reviews) {
      // Review count contribution (0-35 points)
      const reviewCount = platform.reviews.count;
      score += Math.min(reviewCount / 5, 35);

      // Rating contribution (0-30 points)
      const rating = platform.reviews.averageRating;
      score += (rating / 5) * 30;

      // Recent reviews bonus (0-20 points)
      if (platform.reviews.recentReviews && platform.reviews.recentReviews.length > 0) {
        const recentPositive = platform.reviews.recentReviews.filter(r => r.rating >= 4).length;
        score += (recentPositive / platform.reviews.recentReviews.length) * 20;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate photo quality score
   */
  private calculatePhotoScore(platform: PlatformMetrics): number {
    if (!platform.photos?.count) return 0;

    let score = 20; // Base score for having photos

    // Photo count contribution (0-50 points)
    score += Math.min(platform.photos.count / 2, 50);

    // Recent photos bonus (0-30 points)
    if (platform.photos.recentPhotos && platform.photos.recentPhotos.length > 0) {
      score += Math.min(platform.photos.recentPhotos.length * 5, 30);
    }

    return Math.min(score, 100);
  }



  /**
   * Generate key insights for competitor
   */
  private generateKeyInsights(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any
  ): string[] {
    const insights: string[] = [];

    // Distance-based insights
    if (competitor.distance <= 200) {
      insights.push(`Direct competitor located only ${Math.round(competitor.distance)}m away`);
    } else if (competitor.distance <= 1000) {
      insights.push(`Close competitor within ${Math.round(competitor.distance / 100) * 100}m radius`);
    }

    // Visibility insights
    if (visibilityScore.overall >= 80) {
      insights.push('Market leader with exceptional online presence');
    } else if (visibilityScore.overall >= 60) {
      insights.push('Strong competitor with good online visibility');
    } else if (visibilityScore.overall <= 40) {
      insights.push('Weak online presence - potential opportunity');
    }

    // Platform-specific insights
    const googlePlatform = platforms.find(p => p.platform === 'google');
    if (googlePlatform?.reviews) {
      if (googlePlatform.reviews.count >= 500) {
        insights.push('Highly established with extensive customer feedback');
      }
      
      if (googlePlatform.reviews.averageRating >= 4.7) {
        insights.push('Exceptional customer satisfaction ratings');
      } else if (googlePlatform.reviews.averageRating <= 3.0) {
        insights.push('Poor customer satisfaction - potential competitive advantage');
      }
    }

    // Social media insights
    const socialPlatforms = platforms.filter(p => ['instagram', 'facebook'].includes(p.platform));
    const totalFollowers = socialPlatforms.reduce((sum, p) => sum + (p.followers || 0), 0);
    
    if (totalFollowers >= 10000) {
      insights.push('Strong social media following and engagement');
    } else if (totalFollowers <= 500) {
      insights.push('Limited social media presence - opportunity for differentiation');
    }

    // Category-specific insights
    if (competitor.category === 'restaurant') {
      if (googlePlatform?.priceLevel) {
        const priceLabels = ['Budget-friendly', 'Moderate pricing', 'Upscale', 'Fine dining'];
        insights.push(`${priceLabels[googlePlatform.priceLevel - 1]} establishment`);
      }
    }

    return insights;
  }

  /**
   * Generate recommended actions from all strategic frameworks
   */
  private generateRecommendedActions(
    competitor: Competitor,
    _platforms: PlatformMetrics[],
    visibilityScore: any,
    strategicAnalysis: any
  ): Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
    framework?: 'swot' | 'porter' | 'balanced_scorecard' | 'nutzwert' | 'cultural';
  }> {
    __use(competitor, visibilityScore, strategicAnalysis); // _platforms already marked with underscore
    const actions: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      timeframe: string;
      framework?: 'swot' | 'porter' | 'balanced_scorecard' | 'nutzwert' | 'cultural';
    }> = [];

    // SWOT-based actions
    if (strategicAnalysis.swot.weaknesses.length > 0) {
      if (visibilityScore.google <= 50) {
        actions.push({
          action: 'Optimize Google My Business profile completeness',
          priority: 'high',
          effort: 'low',
          impact: 'high',
          timeframe: '1-2 weeks',
          framework: 'swot'
        });
      }

      if (visibilityScore.photos <= 40) {
        actions.push({
          action: 'Add high-quality photos to all platforms',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          timeframe: '2-4 weeks',
          framework: 'swot'
        });
      }
    }

    // Porter's Five Forces-based actions
    if (strategicAnalysis.portersFiveForces.competitiveRivalry.intensity === 'high') {
      actions.push({
        action: 'Develop unique value proposition to differentiate from competitors',
        priority: 'critical',
        effort: 'high',
        impact: 'high',
        timeframe: '1-3 months',
        framework: 'porter'
      });
    }

    if (strategicAnalysis.portersFiveForces.buyerPower.intensity === 'high') {
      actions.push({
        action: 'Implement customer loyalty program and exceptional service standards',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: '2-4 weeks',
        framework: 'porter'
      });
    }

    // Balanced Scorecard-based actions
    if (strategicAnalysis.balancedScorecard.customer.score < 70) {
      actions.push({
        action: 'Launch customer satisfaction improvement program',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        timeframe: '1-2 months',
        framework: 'balanced_scorecard'
      });
    }

    if (strategicAnalysis.balancedScorecard.internalProcesses.score < 70) {
      actions.push({
        action: 'Digitize and optimize internal processes',
        priority: 'medium',
        effort: 'high',
        impact: 'medium',
        timeframe: '3-6 months',
        framework: 'balanced_scorecard'
      });
    }

    // Nutzwertanalyse-based actions (top 2 recommendations)
    if (strategicAnalysis.nutzwertanalyse.recommendations.length > 0) {
      strategicAnalysis.nutzwertanalyse.recommendations.slice(0, 2).forEach((rec: any) => {
        actions.push({
          action: rec.action,
          priority: rec.priority <= 2 ? 'high' as const : 'medium' as const,
          effort: 'medium',
          impact: 'high',
          timeframe: rec.expectedROI.includes('3-6') ? '3-6 months' : '1-3 months',
          framework: 'nutzwert'
        });
      });
    }

    // Cultural Dimensions-based actions
    if (strategicAnalysis.culturalDimensions.culturalRecommendations.length > 0) {
      strategicAnalysis.culturalDimensions.culturalRecommendations.slice(0, 2).forEach((rec: any) => {
        actions.push({
          action: `${rec.area}: ${rec.recommendation}`,
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          timeframe: '2-4 weeks',
          framework: 'cultural'
        });
      });
    }

    // Competitive response actions
    if (competitor.distance <= 500 && visibilityScore.overall >= 70) {
      actions.push({
        action: 'Develop differentiation strategy against strong nearby competitor',
        priority: 'critical',
        effort: 'high',
        impact: 'high',
        timeframe: '1-2 months',
        framework: 'porter'
      });
    }

    return actions;
  }

  /**
   * Generate market insights from all competitor analyses
   */
  private generateMarketInsights(
    analyses: CompetitorAnalysis[],
    _request: BenchmarkingRequest
  ): BenchmarkingResponse['marketInsights'] {
    __use(); // _request already marked with underscore, analyses is used below
    const visibilityScores = analyses.map(a => a.visibilityScore.overall);
    const averageVisibilityScore = visibilityScores.reduce((sum, score) => sum + score, 0) / visibilityScores.length;

    // Find market leader
    const marketLeader = analyses.reduce((leader, current) => 
      current.visibilityScore.overall > leader.visibilityScore.overall ? current : leader
    );

    // Calculate market position (assuming business has score of 50 for example)
    const businessScore = 50; // This would come from actual business analysis
    const betterCompetitors = visibilityScores.filter(score => score > businessScore).length;
    const rank = betterCompetitors + 1;
    const percentile = ((analyses.length - rank + 1) / analyses.length) * 100;

    let category: 'leader' | 'strong' | 'average' | 'weak' | 'laggard';
    if (percentile >= 90) category = 'leader';
    else if (percentile >= 70) category = 'strong';
    else if (percentile >= 40) category = 'average';
    else if (percentile >= 20) category = 'weak';
    else category = 'laggard';

    // Generate key trends
    const keyTrends: string[] = [];
    const highSocialScores = analyses.filter(a => a.visibilityScore.social >= 70).length;
    const highPhotoScores = analyses.filter(a => a.visibilityScore.photos >= 70).length;
    
    if (highSocialScores / analyses.length >= 0.6) {
      keyTrends.push('Strong social media adoption in the market');
    }
    
    if (highPhotoScores / analyses.length >= 0.7) {
      keyTrends.push('Visual content is crucial for competitive advantage');
    }

    const avgGoogleScore = analyses.reduce((sum, a) => sum + a.visibilityScore.google, 0) / analyses.length;
    if (avgGoogleScore >= 70) {
      keyTrends.push('Google My Business optimization is table stakes');
    }

    // Generate opportunities and threats
    const opportunities: string[] = [];
    const threats: string[] = [];

    if (averageVisibilityScore <= 60) {
      opportunities.push('Market has room for a strong digital presence leader');
    }

    const lowSocialScores = analyses.filter(a => a.visibilityScore.social <= 40).length;
    if (lowSocialScores / analyses.length >= 0.5) {
      opportunities.push('Social media gap presents growth opportunity');
    }

    const strongCompetitors = analyses.filter(a => a.visibilityScore.overall >= 80).length;
    if (strongCompetitors >= 3) {
      threats.push('Highly competitive market with multiple strong players');
    }

    const nearbyStrongCompetitors = analyses.filter(a => 
      a.competitor.distance <= 1000 && a.visibilityScore.overall >= 70
    ).length;
    if (nearbyStrongCompetitors >= 2) {
      threats.push('Multiple strong competitors in immediate vicinity');
    }

    return {
      totalCompetitors: analyses.length,
      averageVisibilityScore: Math.round(averageVisibilityScore),
      marketLeader: {
        name: marketLeader.competitor.name,
        visibilityScore: marketLeader.visibilityScore.overall
      },
      marketPosition: {
        rank,
        percentile: Math.round(percentile),
        category
      },
      keyTrends,
      opportunities,
      threats
    };
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(
    analyses: CompetitorAnalysis[],
    marketInsights: BenchmarkingResponse['marketInsights'],
    _request: BenchmarkingRequest
  ): BenchmarkingResponse['recommendations'] {
    __use(); // _request already marked with underscore, analyses and marketInsights are used below
    const recommendations: BenchmarkingResponse['recommendations'] = [];

    // Google optimization recommendations
    const avgGoogleScore = analyses.reduce((sum, a) => sum + a.visibilityScore.google, 0) / analyses.length;
    if (avgGoogleScore >= 70) {
      recommendations.push({
        category: 'Google My Business',
        priority: 'critical',
        actions: [
          'Complete all Google My Business profile sections',
          'Add high-quality photos regularly',
          'Respond to all customer reviews promptly',
          'Post updates and offers weekly'
        ],
        expectedImpact: 'Significant improvement in local search visibility',
        timeframe: '2-4 weeks',
        resources: ['Marketing team', 'Photography', 'Content creation']
      });
    }

    // Social media recommendations
    const avgSocialScore = analyses.reduce((sum, a) => sum + a.visibilityScore.social, 0) / analyses.length;
    if (avgSocialScore <= 50) {
      recommendations.push({
        category: 'Social Media',
        priority: 'high',
        actions: [
          'Establish consistent posting schedule',
          'Create engaging visual content',
          'Interact with followers and local community',
          'Use location-based hashtags and geotags'
        ],
        expectedImpact: 'Improved brand awareness and customer engagement',
        timeframe: '1-3 months',
        resources: ['Social media manager', 'Content creator', 'Photography']
      });
    }

    // Review management recommendations
    const competitorsWithManyReviews = analyses.filter(a => {
      const googlePlatform = a.platforms.find(p => p.platform === 'google');
      return googlePlatform?.reviews && googlePlatform.reviews.count >= 100;
    }).length;

    if (competitorsWithManyReviews >= 3) {
      recommendations.push({
        category: 'Review Management',
        priority: 'high',
        actions: [
          'Implement systematic review request process',
          'Train staff on customer service excellence',
          'Address negative reviews professionally and promptly',
          'Showcase positive reviews in marketing materials'
        ],
        expectedImpact: 'Enhanced online reputation and customer trust',
        timeframe: '2-6 months',
        resources: ['Customer service team', 'Management', 'Marketing materials']
      });
    }

    // Competitive differentiation
    if (marketInsights.marketPosition.category === 'weak' || marketInsights.marketPosition.category === 'laggard') {
      recommendations.push({
        category: 'Competitive Positioning',
        priority: 'critical',
        actions: [
          'Identify unique value propositions',
          'Highlight differentiating factors in all marketing',
          'Focus on underserved customer segments',
          'Develop signature offerings or experiences'
        ],
        expectedImpact: 'Improved market position and customer acquisition',
        timeframe: '1-4 months',
        resources: ['Marketing strategy', 'Product development', 'Brand management']
      });
    }

    return recommendations;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(
    analyses: CompetitorAnalysis[],
    _platformData: Map<string, PlatformMetrics[]>
  ): BenchmarkingResponse['dataQuality'] {
    __use(); // _platformData already marked with underscore, analyses is used below
    let totalDataPoints = 0;
    let completeDataPoints = 0;
    let freshDataPoints = 0;
    let accurateDataPoints = 0;
    const sources = new Set<string>();
    const limitations: string[] = [];

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const analysis of analyses) {
      for (const platform of analysis.platforms) {
        totalDataPoints++;
        sources.add(platform.platform);

        // Check completeness
        let isComplete = true;
        if (platform.platform === 'google') {
          if (!platform.reviews || !platform.businessHours) {
            isComplete = false;
          }
        } else if (['instagram', 'facebook'].includes(platform.platform)) {
          if (!platform.followers || !platform.posts) {
            isComplete = false;
          }
        }

        if (isComplete) completeDataPoints++;

        // Check freshness
        const scrapedTime = new Date(platform.lastScraped).getTime();
        if (scrapedTime >= oneDayAgo) {
          freshDataPoints++;
        }

        // Check accuracy (based on presence of errors)
        if (!platform.scrapingErrors || platform.scrapingErrors.length === 0) {
          accurateDataPoints++;
        }
      }
    }

    // Add limitations based on analysis
    if (completeDataPoints / totalDataPoints < 0.8) {
      limitations.push('Some competitor data is incomplete');
    }

    if (freshDataPoints / totalDataPoints < 0.7) {
      limitations.push('Some data may be outdated');
    }

    if (accurateDataPoints / totalDataPoints < 0.9) {
      limitations.push('Some data collection encountered errors');
    }

    if (analyses.length < 5) {
      limitations.push('Limited number of competitors analyzed');
    }

    return {
      completeness: totalDataPoints > 0 ? completeDataPoints / totalDataPoints : 0,
      freshness: totalDataPoints > 0 ? freshDataPoints / totalDataPoints : 0,
      accuracy: totalDataPoints > 0 ? accurateDataPoints / totalDataPoints : 0,
      sources: Array.from(sources),
      limitations
    };
  }

  /**
   * Calculate data freshness for platforms
   */
  private calculateDataFreshness(platforms: PlatformMetrics[]): CompetitorAnalysis['dataFreshness'] {
    const freshness: CompetitorAnalysis['dataFreshness'] = {
      google: new Date().toISOString()
    };

    for (const platform of platforms) {
      switch (platform.platform) {
        case 'google':
          freshness.google = platform.lastScraped;
          break;
        case 'instagram':
          freshness.instagram = platform.lastScraped;
          break;
        case 'facebook':
          freshness.facebook = platform.lastScraped;
          break;
        case 'yelp':
          freshness.yelp = platform.lastScraped;
          break;
        case 'tripadvisor':
          freshness.tripadvisor = platform.lastScraped;
          break;
      }
    }

    return freshness;
  }
}