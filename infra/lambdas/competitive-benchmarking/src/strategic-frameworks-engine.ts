/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Competitor,
  PlatformMetrics,
  BenchmarkingRequest,
  SWOTAnalysis,
  PortersFiveForces,
  BalancedScorecard,
  Nutzwertanalyse,
  HofstedeCulturalDimensions,
  StrategicAnalysis
} from './types';

/**
 * Strategic Frameworks Engine
 * 
 * Implements comprehensive business analysis frameworks:
 * - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
 * - Porter's Five Forces (Competitive positioning)
 * - Balanced Scorecard (Multi-dimensional performance)
 * - Nutzwertanalyse (ROI prioritization with revenue projections)
 * - Hofstede Cultural Dimensions (Regional adaptation)
 */
export class StrategicFrameworksEngine {
  
  /**
   * Generate comprehensive strategic analysis for competitor
   */
  async generateStrategicAnalysis(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any,
    request: BenchmarkingRequest,
    marketContext?: {
      averageScore: number;
      competitorCount: number;
      marketLeader?: { name: string; score: number };
    }
  ): Promise<StrategicAnalysis> {
    
    const frameworks = request.frameworks || ['swot', 'porter', 'balanced_scorecard', 'nutzwert', 'cultural'];
    
    // Generate each framework analysis
    const swot = frameworks.includes('swot') 
      ? await this.generateSWOTAnalysis(competitor, platforms, visibilityScore, marketContext)
      : this.getEmptySWOT();
      
    const portersFiveForces = frameworks.includes('porter')
      ? await this.generatePortersAnalysis(competitor, platforms, visibilityScore, request, marketContext)
      : this.getEmptyPorters();
      
    const balancedScorecard = frameworks.includes('balanced_scorecard')
      ? await this.generateBalancedScorecard(competitor, platforms, visibilityScore, marketContext)
      : this.getEmptyBalancedScorecard();
      
    const nutzwertanalyse = frameworks.includes('nutzwert')
      ? await this.generateNutzwertanalyse(competitor, platforms, visibilityScore, request)
      : this.getEmptyNutzwertanalyse();
      
    const culturalDimensions = frameworks.includes('cultural')
      ? await this.generateCulturalDimensions(competitor, request)
      : this.getEmptyCulturalDimensions();

    return {
      swot,
      portersFiveForces,
      balancedScorecard,
      nutzwertanalyse,
      culturalDimensions
    };
  }

  /**
   * Generate SWOT Analysis
   */
  private async generateSWOTAnalysis(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any,
    marketContext?: any
  ): Promise<SWOTAnalysis> {
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Analyze strengths
    if (visibilityScore.overall >= 80) {
      strengths.push('Exceptional overall online visibility and market presence');
    }
    if (visibilityScore.google >= 85) {
      strengths.push('Dominant Google My Business presence with strong local SEO');
    }
    if (visibilityScore.social >= 75) {
      strengths.push('Strong social media engagement and community building');
    }
    
    const googlePlatform = platforms.find(p => p.platform === 'google');
    if (googlePlatform?.reviews && googlePlatform.reviews.averageRating >= 4.5) {
      strengths.push('Outstanding customer satisfaction with excellent reviews');
    }
    if (googlePlatform?.reviews && googlePlatform.reviews.count >= 200) {
      strengths.push('Well-established reputation with extensive customer feedback');
    }

    // Analyze weaknesses
    if (visibilityScore.overall <= 40) {
      weaknesses.push('Poor overall online visibility limiting market reach');
    }
    if (visibilityScore.google <= 50) {
      weaknesses.push('Weak Google My Business optimization missing local opportunities');
    }
    if (visibilityScore.social <= 30) {
      weaknesses.push('Minimal social media presence reducing customer engagement');
    }
    if (visibilityScore.photos <= 40) {
      weaknesses.push('Insufficient visual content failing to attract customers');
    }

    // Analyze opportunities
    if (visibilityScore.social <= 60) {
      opportunities.push('Significant potential for social media growth and engagement');
    }
    if (visibilityScore.photos <= 70) {
      opportunities.push('Opportunity to enhance visual storytelling and brand appeal');
    }
    if (!googlePlatform?.businessHours || Object.keys(googlePlatform.businessHours).length < 7) {
      opportunities.push('Complete business information optimization for better discoverability');
    }
    
    const instagramPlatform = platforms.find(p => p.platform === 'instagram');
    if (!instagramPlatform || !instagramPlatform.isVerified) {
      opportunities.push('Instagram business verification and content strategy development');
    }

    // Analyze threats
    if (competitor.distance <= 500) {
      threats.push('Direct proximity competition creating market pressure');
    }
    if (marketContext && visibilityScore.overall < marketContext.averageScore - 20) {
      threats.push('Below-average market performance risking customer loss');
    }
    if (googlePlatform?.reviews && googlePlatform.reviews.averageRating <= 3.5) {
      threats.push('Poor customer ratings damaging reputation and trust');
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  /**
   * Generate Porter's Five Forces Analysis
   */
  private async generatePortersAnalysis(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any,
    request: BenchmarkingRequest,
    marketContext?: any
  ): Promise<PortersFiveForces> {
    
    // Competitive Rivalry Analysis
    const competitiveRivalry = {
      intensity: this.assessCompetitiveRivalry(competitor, marketContext, request),
      factors: this.getCompetitiveRivalryFactors(competitor, marketContext, request),
      score: this.calculateCompetitiveRivalryScore(competitor, marketContext, visibilityScore)
    };

    // Supplier Power Analysis
    const supplierPower = {
      intensity: this.assessSupplierPower(competitor, request),
      factors: this.getSupplierPowerFactors(competitor, request),
      score: this.calculateSupplierPowerScore(competitor, request)
    };

    // Buyer Power Analysis
    const buyerPower = {
      intensity: this.assessBuyerPower(competitor, platforms, request),
      factors: this.getBuyerPowerFactors(competitor, platforms, request),
      score: this.calculateBuyerPowerScore(competitor, platforms, request)
    };

    // Threat of Substitutes Analysis
    const threatOfSubstitutes = {
      intensity: this.assessThreatOfSubstitutes(competitor, request),
      factors: this.getThreatOfSubstitutesFactors(competitor, request),
      score: this.calculateThreatOfSubstitutesScore(competitor, request)
    };

    // Barrier to Entry Analysis
    const barrierToEntry = {
      intensity: this.assessBarrierToEntry(competitor, visibilityScore, request),
      factors: this.getBarrierToEntryFactors(competitor, visibilityScore, request),
      score: this.calculateBarrierToEntryScore(competitor, visibilityScore, request)
    };

    // Calculate overall market attractiveness
    const overallAttractiveness = Math.round(
      (competitiveRivalry.score + supplierPower.score + buyerPower.score + 
       threatOfSubstitutes.score + barrierToEntry.score) / 5
    );

    // Generate strategic recommendations
    const strategicRecommendations = this.generatePortersRecommendations(
      { competitiveRivalry, supplierPower, buyerPower, threatOfSubstitutes, barrierToEntry },
      overallAttractiveness
    );

    return {
      competitiveRivalry,
      supplierPower,
      buyerPower,
      threatOfSubstitutes,
      barrierToEntry,
      overallAttractiveness,
      strategicRecommendations
    };
  }

  /**
   * Generate Balanced Scorecard Analysis
   */
  private async generateBalancedScorecard(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any,
    marketContext?: any
  ): Promise<BalancedScorecard> {
    
    // Financial Perspective
    const financial = {
      metrics: [
        {
          name: 'Revenue Growth Potential',
          current: this.estimateRevenueGrowthPotential(visibilityScore),
          target: 85,
          trend: visibilityScore.overall > 60 ? 'improving' as const : 'declining' as const
        },
        {
          name: 'Cost Efficiency Score',
          current: this.calculateCostEfficiency(platforms, visibilityScore),
          target: 75,
          trend: 'stable' as const
        },
        {
          name: 'ROI Optimization',
          current: this.calculateROIOptimization(platforms, visibilityScore),
          target: 80,
          trend: visibilityScore.overall > 70 ? 'improving' as const : 'stable' as const
        }
      ],
      score: Math.round((visibilityScore.overall + this.calculateCostEfficiency(platforms, visibilityScore)) / 2)
    };

    // Customer Perspective
    const googlePlatform = platforms.find(p => p.platform === 'google');
    const customer = {
      metrics: [
        {
          name: 'Customer Satisfaction',
          current: googlePlatform?.reviews ? Math.round(googlePlatform.reviews.averageRating * 20) : 50,
          target: 90,
          trend: googlePlatform?.reviews && googlePlatform.reviews.averageRating >= 4.0 ? 'improving' as const : 'declining' as const
        },
        {
          name: 'Customer Acquisition',
          current: visibilityScore.overall,
          target: 85,
          trend: visibilityScore.overall > 60 ? 'improving' as const : 'stable' as const
        },
        {
          name: 'Customer Retention',
          current: googlePlatform?.reviews ? Math.min(googlePlatform.reviews.count / 5, 100) : 30,
          target: 80,
          trend: 'stable' as const
        }
      ],
      score: Math.round((visibilityScore.overall + (googlePlatform?.reviews ? googlePlatform.reviews.averageRating * 20 : 50)) / 2)
    };

    // Internal Processes Perspective
    const internalProcesses = {
      metrics: [
        {
          name: 'Digital Process Efficiency',
          current: this.calculateDigitalProcessEfficiency(platforms),
          target: 85,
          trend: 'improving' as const
        },
        {
          name: 'Content Management Quality',
          current: visibilityScore.photos,
          target: 80,
          trend: visibilityScore.photos > 60 ? 'improving' as const : 'stable' as const
        },
        {
          name: 'Response Time Management',
          current: this.estimateResponseTimeManagement(platforms),
          target: 90,
          trend: 'stable' as const
        }
      ],
      score: Math.round((this.calculateDigitalProcessEfficiency(platforms) + visibilityScore.photos) / 2)
    };

    // Learning and Growth Perspective
    const learningAndGrowth = {
      metrics: [
        {
          name: 'Digital Capability Development',
          current: this.assessDigitalCapability(platforms, visibilityScore),
          target: 80,
          trend: 'improving' as const
        },
        {
          name: 'Innovation Readiness',
          current: this.assessInnovationReadiness(platforms),
          target: 75,
          trend: 'stable' as const
        },
        {
          name: 'Market Adaptation',
          current: this.assessMarketAdaptation(competitor, marketContext),
          target: 85,
          trend: 'improving' as const
        }
      ],
      score: Math.round((this.assessDigitalCapability(platforms, visibilityScore) + this.assessInnovationReadiness(platforms)) / 2)
    };

    // Calculate overall balance
    const overallBalance = Math.round((financial.score + customer.score + internalProcesses.score + learningAndGrowth.score) / 4);

    // Generate strategic initiatives
    const strategicInitiatives = this.generateBalancedScorecardInitiatives(
      { financial, customer, internalProcesses, learningAndGrowth },
      overallBalance
    );

    return {
      financial,
      customer,
      internalProcesses,
      learningAndGrowth,
      overallBalance,
      strategicInitiatives
    };
  }

  /**
   * Generate Nutzwertanalyse (Value Analysis)
   */
  private async generateNutzwertanalyse(
    competitor: Competitor,
    platforms: PlatformMetrics[],
    visibilityScore: any,
    request: BenchmarkingRequest
  ): Promise<Nutzwertanalyse> {
    
    // Define evaluation criteria with weights
    const criteria = [
      {
        name: 'Online Visibility Optimization',
        weight: 0.3,
        alternatives: [
          {
            name: 'Google My Business Enhancement',
            score: this.scoreGMBEnhancement(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Social Media Strategy',
            score: this.scoreSocialMediaStrategy(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Website SEO Optimization',
            score: this.scoreWebsiteOptimization(platforms, visibilityScore),
            weightedScore: 0
          }
        ]
      },
      {
        name: 'Customer Engagement Impact',
        weight: 0.25,
        alternatives: [
          {
            name: 'Review Management System',
            score: this.scoreReviewManagement(platforms),
            weightedScore: 0
          },
          {
            name: 'Content Marketing Strategy',
            score: this.scoreContentMarketing(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Customer Service Digital Tools',
            score: this.scoreCustomerServiceTools(platforms),
            weightedScore: 0
          }
        ]
      },
      {
        name: 'Implementation Effort',
        weight: 0.2,
        alternatives: [
          {
            name: 'Quick Wins (1-4 weeks)',
            score: this.scoreQuickWins(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Medium-term Projects (1-3 months)',
            score: this.scoreMediumTermProjects(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Long-term Initiatives (3-12 months)',
            score: this.scoreLongTermInitiatives(platforms, visibilityScore),
            weightedScore: 0
          }
        ]
      },
      {
        name: 'Revenue Impact Potential',
        weight: 0.25,
        alternatives: [
          {
            name: 'Local Search Optimization',
            score: this.scoreLocalSearchROI(platforms, visibilityScore, request),
            weightedScore: 0
          },
          {
            name: 'Social Media ROI',
            score: this.scoreSocialMediaROI(platforms, visibilityScore),
            weightedScore: 0
          },
          {
            name: 'Customer Retention Improvement',
            score: this.scoreCustomerRetentionROI(platforms),
            weightedScore: 0
          }
        ]
      }
    ];

    // Calculate weighted scores
    criteria.forEach(criterion => {
      criterion.alternatives.forEach(alternative => {
        alternative.weightedScore = alternative.score * criterion.weight;
      });
    });

    // Aggregate results by alternative
    const alternativeNames = [...new Set(criteria.flatMap(c => c.alternatives.map(a => a.name)))];
    const results = alternativeNames.map(name => {
      const totalScore = criteria.reduce((sum, criterion) => {
        const alternative = criterion.alternatives.find(a => a.name === name);
        return sum + (alternative ? alternative.weightedScore : 0);
      }, 0);

      return {
        alternative: name,
        totalScore: Math.round(totalScore * 10) / 10,
        rank: 0, // Will be set after sorting
        revenueProjection: this.calculateRevenueProjection(name, totalScore, request)
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // Set ranks
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Generate recommendations
    const recommendations = this.generateNutzwertRecommendations(results, criteria);

    return {
      criteria,
      results,
      recommendations
    };
  }

  /**
   * Generate Hofstede Cultural Dimensions Analysis
   */
  private async generateCulturalDimensions(
    competitor: Competitor,
    request: BenchmarkingRequest
  ): Promise<HofstedeCulturalDimensions> {
    
    const country = request.culturalContext?.country || this.detectCountryFromAddress(competitor.address);
    const culturalData = this.getCulturalDimensionsData(country);

    const culturalRecommendations = this.generateCulturalRecommendations(culturalData, competitor);
    const communicationStyle = this.generateCommunicationStyle(culturalData);

    return {
      country,
      dimensions: culturalData,
      culturalRecommendations,
      communicationStyle
    };
  }

  // Helper methods for Porter's Five Forces
  private assessCompetitiveRivalry(competitor: Competitor, marketContext: any, request: BenchmarkingRequest): 'low' | 'medium' | 'high' {
    if (!marketContext) return 'medium';
    
    const competitorDensity = marketContext.competitorCount / (Math.PI * Math.pow(request.radius / 1000, 2)); // competitors per km²
    
    if (competitorDensity > 5) return 'high';
    if (competitorDensity > 2) return 'medium';
    return 'low';
  }

  private getCompetitiveRivalryFactors(competitor: Competitor, marketContext: any, request: BenchmarkingRequest): string[] {
    const factors = [];
    
    if (marketContext?.competitorCount > 10) {
      factors.push('High number of direct competitors in the area');
    }
    if (competitor.distance <= 500) {
      factors.push('Very close proximity to direct competitors');
    }
    if (request.category === 'restaurant') {
      factors.push('Highly competitive restaurant market with low switching costs');
    }
    
    return factors;
  }

  private calculateCompetitiveRivalryScore(competitor: Competitor, marketContext: any, visibilityScore: any): number {
    let score = 50; // Base score
    
    if (marketContext?.competitorCount > 15) score -= 20;
    if (competitor.distance <= 300) score -= 15;
    if (visibilityScore.overall > 70) score += 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private assessSupplierPower(competitor: Competitor, request: BenchmarkingRequest): 'low' | 'medium' | 'high' {
    // For restaurants, supplier power is generally medium due to food suppliers
    if (request.category === 'restaurant') return 'medium';
    return 'low';
  }

  private getSupplierPowerFactors(competitor: Competitor, request: BenchmarkingRequest): string[] {
    const factors = [];
    
    if (request.category === 'restaurant') {
      factors.push('Dependence on food suppliers and distributors');
      factors.push('Limited local supplier options may increase costs');
    }
    
    return factors;
  }

  private calculateSupplierPowerScore(competitor: Competitor, request: BenchmarkingRequest): number {
    if (request.category === 'restaurant') return 60;
    return 40;
  }

  private assessBuyerPower(competitor: Competitor, platforms: PlatformMetrics[], request: BenchmarkingRequest): 'low' | 'medium' | 'high' {
    const googlePlatform = platforms.find(p => p.platform === 'google');
    
    // High review count indicates strong customer voice
    if (googlePlatform?.reviews && googlePlatform.reviews.count > 200) return 'high';
    if (googlePlatform?.reviews && googlePlatform.reviews.count > 50) return 'medium';
    return 'low';
  }

  private getBuyerPowerFactors(competitor: Competitor, platforms: PlatformMetrics[], request: BenchmarkingRequest): string[] {
    const factors = [];
    const googlePlatform = platforms.find(p => p.platform === 'google');
    
    if (googlePlatform?.reviews && googlePlatform.reviews.count > 100) {
      factors.push('Strong customer voice through online reviews');
    }
    factors.push('Low switching costs for customers');
    factors.push('High price sensitivity in local market');
    
    return factors;
  }

  private calculateBuyerPowerScore(competitor: Competitor, platforms: PlatformMetrics[], request: BenchmarkingRequest): number {
    const googlePlatform = platforms.find(p => p.platform === 'google');
    let score = 60; // Base score for high buyer power
    
    if (googlePlatform?.reviews && googlePlatform.reviews.count > 200) score += 20;
    if (googlePlatform?.reviews && googlePlatform.reviews.averageRating < 4.0) score += 10;
    
    return Math.min(100, score);
  }

  private assessThreatOfSubstitutes(competitor: Competitor, request: BenchmarkingRequest): 'low' | 'medium' | 'high' {
    if (request.category === 'restaurant') return 'high'; // Many food options
    return 'medium';
  }

  private getThreatOfSubstitutesFactors(competitor: Competitor, request: BenchmarkingRequest): string[] {
    const factors = [];
    
    if (request.category === 'restaurant') {
      factors.push('High availability of alternative dining options');
      factors.push('Food delivery services as substitutes');
      factors.push('Home cooking and meal kits as alternatives');
    }
    
    return factors;
  }

  private calculateThreatOfSubstitutesScore(competitor: Competitor, request: BenchmarkingRequest): number {
    if (request.category === 'restaurant') return 75;
    return 50;
  }

  private assessBarrierToEntry(competitor: Competitor, visibilityScore: any, request: BenchmarkingRequest): 'low' | 'medium' | 'high' {
    if (request.category === 'restaurant') return 'medium'; // Moderate barriers
    return 'low';
  }

  private getBarrierToEntryFactors(competitor: Competitor, visibilityScore: any, request: BenchmarkingRequest): string[] {
    const factors = [];
    
    if (request.category === 'restaurant') {
      factors.push('Initial capital requirements for equipment and setup');
      factors.push('Regulatory requirements and licensing');
      factors.push('Need to establish customer base and reputation');
    }
    
    if (visibilityScore.overall > 80) {
      factors.push('Strong established players with high visibility');
    }
    
    return factors;
  }

  private calculateBarrierToEntryScore(competitor: Competitor, visibilityScore: any, request: BenchmarkingRequest): number {
    let score = 50;
    
    if (request.category === 'restaurant') score += 10;
    if (visibilityScore.overall > 80) score += 15;
    
    return Math.min(100, score);
  }

  private generatePortersRecommendations(forces: any, attractiveness: number): string[] {
    const recommendations = [];
    
    if (forces.competitiveRivalry.intensity === 'high') {
      recommendations.push('Develop unique value proposition to differentiate from competitors');
    }
    if (forces.buyerPower.intensity === 'high') {
      recommendations.push('Focus on customer loyalty programs and exceptional service');
    }
    if (forces.threatOfSubstitutes.intensity === 'high') {
      recommendations.push('Innovate service offerings to stay ahead of substitutes');
    }
    if (attractiveness < 60) {
      recommendations.push('Consider market repositioning or niche specialization');
    }
    
    return recommendations;
  }

  // Helper methods for Balanced Scorecard
  private estimateRevenueGrowthPotential(visibilityScore: any): number {
    return Math.min(100, visibilityScore.overall + 10);
  }

  private calculateCostEfficiency(platforms: PlatformMetrics[], visibilityScore: any): number {
    // Higher visibility usually means better cost efficiency
    return Math.min(100, visibilityScore.overall - 5);
  }

  private calculateROIOptimization(platforms: PlatformMetrics[], visibilityScore: any): number {
    return Math.min(100, visibilityScore.overall);
  }

  private calculateDigitalProcessEfficiency(platforms: PlatformMetrics[]): number {
    const completePlatforms = platforms.filter(p => !p.scrapingErrors || p.scrapingErrors.length === 0);
    return Math.round((completePlatforms.length / platforms.length) * 100);
  }

  private estimateResponseTimeManagement(platforms: PlatformMetrics[]): number {
    // Estimate based on platform completeness
    return 70; // Default estimate
  }

  private assessDigitalCapability(platforms: PlatformMetrics[], visibilityScore: any): number {
    return Math.round((platforms.length * 10) + (visibilityScore.overall * 0.5));
  }

  private assessInnovationReadiness(platforms: PlatformMetrics[]): number {
    const socialPlatforms = platforms.filter(p => ['instagram', 'facebook'].includes(p.platform));
    return Math.min(100, socialPlatforms.length * 25 + 25);
  }

  private assessMarketAdaptation(competitor: Competitor, marketContext: any): number {
    return marketContext ? Math.min(100, 60 + (marketContext.averageScore > 60 ? 20 : 0)) : 60;
  }

  private generateBalancedScorecardInitiatives(perspectives: any, balance: number): string[] {
    const initiatives = [];
    
    if (perspectives.financial.score < 70) {
      initiatives.push('Implement revenue optimization strategies');
    }
    if (perspectives.customer.score < 70) {
      initiatives.push('Launch customer satisfaction improvement program');
    }
    if (perspectives.internalProcesses.score < 70) {
      initiatives.push('Digitize and optimize internal processes');
    }
    if (perspectives.learningAndGrowth.score < 70) {
      initiatives.push('Invest in digital capability development');
    }
    
    return initiatives;
  }

  // Helper methods for Nutzwertanalyse
  private scoreGMBEnhancement(platforms: PlatformMetrics[], visibilityScore: any): number {
    const googlePlatform = platforms.find(p => p.platform === 'google');
    if (!googlePlatform) return 9; // High potential if not present
    
    return Math.max(1, 10 - Math.round(visibilityScore.google / 10));
  }

  private scoreSocialMediaStrategy(platforms: PlatformMetrics[], visibilityScore: any): number {
    return Math.max(1, 10 - Math.round(visibilityScore.social / 10));
  }

  private scoreWebsiteOptimization(platforms: PlatformMetrics[], visibilityScore: any): number {
    return Math.max(1, 10 - Math.round(visibilityScore.overall / 10));
  }

  private scoreReviewManagement(platforms: PlatformMetrics[]): number {
    const googlePlatform = platforms.find(p => p.platform === 'google');
    if (!googlePlatform?.reviews || googlePlatform.reviews.count < 50) return 8;
    if (googlePlatform.reviews.averageRating < 4.0) return 9;
    return 6;
  }

  private scoreContentMarketing(platforms: PlatformMetrics[], visibilityScore: any): number {
    return Math.max(1, 10 - Math.round(visibilityScore.photos / 10));
  }

  private scoreCustomerServiceTools(platforms: PlatformMetrics[]): number {
    return 7; // Default score
  }

  private scoreQuickWins(platforms: PlatformMetrics[], visibilityScore: any): number {
    // Higher score for more quick win opportunities
    let opportunities = 0;
    if (visibilityScore.google < 80) opportunities++;
    if (visibilityScore.photos < 70) opportunities++;
    if (visibilityScore.social < 60) opportunities++;
    
    return Math.min(10, 5 + opportunities * 2);
  }

  private scoreMediumTermProjects(platforms: PlatformMetrics[], visibilityScore: any): number {
    return 7; // Default score for medium-term projects
  }

  private scoreLongTermInitiatives(platforms: PlatformMetrics[], visibilityScore: any): number {
    return 6; // Default score for long-term initiatives
  }

  private scoreLocalSearchROI(platforms: PlatformMetrics[], visibilityScore: any, request: BenchmarkingRequest): number {
    if (visibilityScore.google < 70) return 9; // High ROI potential
    return 6;
  }

  private scoreSocialMediaROI(platforms: PlatformMetrics[], visibilityScore: any): number {
    if (visibilityScore.social < 60) return 8; // High ROI potential
    return 5;
  }

  private scoreCustomerRetentionROI(platforms: PlatformMetrics[]): number {
    const googlePlatform = platforms.find(p => p.platform === 'google');
    if (!googlePlatform?.reviews || googlePlatform.reviews.averageRating < 4.0) return 8;
    return 6;
  }

  private calculateRevenueProjection(alternative: string, score: number, request: BenchmarkingRequest): {
    amount: number;
    currency: string;
    timeframe: string;
    disclaimer: string;
  } {
    // Base revenue projection on score and business type
    let baseAmount = 500; // Base monthly revenue increase in EUR
    
    if (alternative.includes('Google')) baseAmount = 800;
    if (alternative.includes('Social')) baseAmount = 600;
    if (alternative.includes('Review')) baseAmount = 700;
    if (alternative.includes('Local Search')) baseAmount = 900;
    
    const amount = Math.round(baseAmount * (score / 10));
    
    return {
      amount,
      currency: 'EUR',
      timeframe: '3-6 Monate',
      disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt'
    };
  }

  private generateNutzwertRecommendations(results: any[], criteria: any[]): any[] {
    const recommendations: any[] = [];
    
    // Top 3 alternatives get recommendations
    results.slice(0, 3).forEach((result, index) => {
      recommendations.push({
        action: result.alternative,
        priority: index + 1,
        expectedROI: `${result.revenueProjection.amount}€ ${result.revenueProjection.timeframe}`,
        implementation: this.getImplementationGuidance(result.alternative)
      });
    });
    
    return recommendations;
  }

  private getImplementationGuidance(alternative: string): string {
    const guidance: Record<string, string> = {
      'Google My Business Enhancement': '1. Profil vervollständigen 2. Fotos hinzufügen 3. Bewertungen aktiv managen',
      'Social Media Strategy': '1. Content-Kalender erstellen 2. Regelmäßige Posts 3. Community-Engagement',
      'Review Management System': '1. Bewertungs-Workflow einrichten 2. Antwort-Templates erstellen 3. Monitoring-Tools',
      'Local Search Optimization': '1. Keywords optimieren 2. NAP-Konsistenz sicherstellen 3. Local Citations aufbauen'
    };
    
    return guidance[alternative] || 'Detaillierte Implementierungsplanung erforderlich';
  }

  // Helper methods for Cultural Dimensions
  private detectCountryFromAddress(address: string): string {
    // Simple country detection from address
    if (address.toLowerCase().includes('germany') || address.toLowerCase().includes('deutschland')) return 'Germany';
    if (address.toLowerCase().includes('austria') || address.toLowerCase().includes('österreich')) return 'Austria';
    if (address.toLowerCase().includes('switzerland') || address.toLowerCase().includes('schweiz')) return 'Switzerland';
    
    return 'Germany'; // Default
  }

  private getCulturalDimensionsData(country: string): HofstedeCulturalDimensions['dimensions'] {
    // Hofstede data for major DACH countries
    const culturalData: Record<string, HofstedeCulturalDimensions['dimensions']> = {
      'Germany': {
        powerDistance: {
          score: 35,
          interpretation: 'Low power distance - egalitarian society',
          businessImplications: ['Direct communication preferred', 'Flat organizational structures work well', 'Employees expect to be consulted']
        },
        individualism: {
          score: 67,
          interpretation: 'Individualistic society',
          businessImplications: ['Personal achievement valued', 'Individual responsibility important', 'Direct feedback appreciated']
        },
        masculinity: {
          score: 66,
          interpretation: 'Masculine society - competitive and achievement-oriented',
          businessImplications: ['Performance and success emphasized', 'Competition drives motivation', 'Clear goals and metrics important']
        },
        uncertaintyAvoidance: {
          score: 65,
          interpretation: 'High uncertainty avoidance',
          businessImplications: ['Detailed planning preferred', 'Rules and procedures important', 'Risk mitigation strategies needed']
        },
        longTermOrientation: {
          score: 83,
          interpretation: 'Long-term oriented society',
          businessImplications: ['Sustainable business practices valued', 'Long-term relationships important', 'Patience with gradual improvements']
        },
        indulgence: {
          score: 40,
          interpretation: 'Restrained society',
          businessImplications: ['Conservative approach to spending', 'Quality over quantity preferred', 'Traditional values respected']
        }
      },
      'Austria': {
        powerDistance: {
          score: 11,
          interpretation: 'Very low power distance',
          businessImplications: ['Extremely egalitarian approach', 'Hierarchy questioned', 'Consensus-building important']
        },
        individualism: {
          score: 55,
          interpretation: 'Moderately individualistic',
          businessImplications: ['Balance between individual and group', 'Team collaboration valued', 'Personal space respected']
        },
        masculinity: {
          score: 79,
          interpretation: 'Highly masculine society',
          businessImplications: ['Strong achievement orientation', 'Competition highly valued', 'Success metrics crucial']
        },
        uncertaintyAvoidance: {
          score: 70,
          interpretation: 'High uncertainty avoidance',
          businessImplications: ['Detailed procedures essential', 'Risk aversion high', 'Thorough planning required']
        },
        longTermOrientation: {
          score: 60,
          interpretation: 'Moderate long-term orientation',
          businessImplications: ['Balance of tradition and adaptation', 'Steady improvement valued', 'Pragmatic approach']
        },
        indulgence: {
          score: 63,
          interpretation: 'Moderately indulgent',
          businessImplications: ['Balanced approach to enjoyment', 'Quality of life important', 'Moderate optimism']
        }
      },
      'Switzerland': {
        powerDistance: {
          score: 34,
          interpretation: 'Low power distance',
          businessImplications: ['Democratic decision-making', 'Flat hierarchies preferred', 'Consultation expected']
        },
        individualism: {
          score: 68,
          interpretation: 'Individualistic society',
          businessImplications: ['Individual excellence valued', 'Personal responsibility high', 'Self-reliance important']
        },
        masculinity: {
          score: 70,
          interpretation: 'Masculine society',
          businessImplications: ['Achievement-oriented culture', 'Performance focus', 'Competitive environment']
        },
        uncertaintyAvoidance: {
          score: 58,
          interpretation: 'Moderate uncertainty avoidance',
          businessImplications: ['Structured approach preferred', 'Risk management important', 'Planning valued']
        },
        longTermOrientation: {
          score: 74,
          interpretation: 'Long-term oriented',
          businessImplications: ['Sustainable practices important', 'Long-term planning', 'Gradual improvement']
        },
        indulgence: {
          score: 66,
          interpretation: 'Moderately indulgent',
          businessImplications: ['Work-life balance valued', 'Quality experiences important', 'Optimistic outlook']
        }
      }
    };
    
    return culturalData[country] || culturalData['Germany'];
  }

  private generateCulturalRecommendations(culturalData: HofstedeCulturalDimensions['dimensions'], competitor: Competitor): HofstedeCulturalDimensions['culturalRecommendations'] {
    const recommendations = [];
    
    if (culturalData.powerDistance.score < 40) {
      recommendations.push({
        area: 'Customer Service',
        recommendation: 'Implement egalitarian service approach with personal attention',
        reasoning: 'Low power distance culture values equal treatment and personal connection'
      });
    }
    
    if (culturalData.uncertaintyAvoidance.score > 60) {
      recommendations.push({
        area: 'Information Transparency',
        recommendation: 'Provide detailed information about services, prices, and processes',
        reasoning: 'High uncertainty avoidance requires clear, comprehensive information'
      });
    }
    
    if (culturalData.longTermOrientation.score > 70) {
      recommendations.push({
        area: 'Sustainability Marketing',
        recommendation: 'Emphasize sustainable practices and long-term value',
        reasoning: 'Long-term oriented culture values sustainability and lasting relationships'
      });
    }
    
    return recommendations;
  }

  private generateCommunicationStyle(culturalData: HofstedeCulturalDimensions['dimensions']): HofstedeCulturalDimensions['communicationStyle'] {
    const style = {
      preferred: 'Direct and factual communication',
      avoid: [] as string[],
      emphasize: [] as string[]
    };
    
    if (culturalData.powerDistance.score < 40) {
      style.emphasize.push('Equality and accessibility');
      style.avoid.push('Hierarchical language');
    }
    
    if (culturalData.uncertaintyAvoidance.score > 60) {
      style.emphasize.push('Detailed information and guarantees');
      style.avoid.push('Vague promises or unclear terms');
    }
    
    if (culturalData.masculinity.score > 60) {
      style.emphasize.push('Achievement and success stories');
      style.emphasize.push('Competitive advantages');
    }
    
    return style;
  }

  // Empty framework generators for when frameworks are not requested
  private getEmptySWOT(): SWOTAnalysis {
    return { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  }

  private getEmptyPorters(): PortersFiveForces {
    return {
      competitiveRivalry: { intensity: 'medium', factors: [], score: 50 },
      supplierPower: { intensity: 'medium', factors: [], score: 50 },
      buyerPower: { intensity: 'medium', factors: [], score: 50 },
      threatOfSubstitutes: { intensity: 'medium', factors: [], score: 50 },
      barrierToEntry: { intensity: 'medium', factors: [], score: 50 },
      overallAttractiveness: 50,
      strategicRecommendations: []
    };
  }

  private getEmptyBalancedScorecard(): BalancedScorecard {
    return {
      financial: { metrics: [], score: 50 },
      customer: { metrics: [], score: 50 },
      internalProcesses: { metrics: [], score: 50 },
      learningAndGrowth: { metrics: [], score: 50 },
      overallBalance: 50,
      strategicInitiatives: []
    };
  }

  private getEmptyNutzwertanalyse(): Nutzwertanalyse {
    return {
      criteria: [],
      results: [],
      recommendations: []
    };
  }

  private getEmptyCulturalDimensions(): HofstedeCulturalDimensions {
    return {
      country: 'Unknown',
      dimensions: {
        powerDistance: { score: 50, interpretation: '', businessImplications: [] },
        individualism: { score: 50, interpretation: '', businessImplications: [] },
        masculinity: { score: 50, interpretation: '', businessImplications: [] },
        uncertaintyAvoidance: { score: 50, interpretation: '', businessImplications: [] },
        longTermOrientation: { score: 50, interpretation: '', businessImplications: [] },
        indulgence: { score: 50, interpretation: '', businessImplications: [] }
      },
      culturalRecommendations: [],
      communicationStyle: { preferred: '', avoid: [], emphasize: [] }
    };
  }
}