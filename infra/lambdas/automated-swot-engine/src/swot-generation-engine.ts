import { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} from '@aws-sdk/client-bedrock-runtime';
import { 
  SWOTAnalysisRequest, 
  SWOTAnalysisResult, 
  SWOTItem, 
  SWOTItemWithType,
  Evidence, 
  BusinessInsight,
  ActionRecommendation,
  TextAnalysisResult,
  ImageAnalysisResult
} from './types';
import { AnalysisError } from './errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * SWOT Generation Engine
 * 
 * Generates comprehensive SWOT analysis from review texts and images:
 * - AI-powered SWOT item generation using AWS Bedrock
 * - Business category and location-based analysis
 * - Evidence-backed insights with confidence scoring
 * - Actionable recommendations with ROI estimates
 * - Interactive visualization data preparation
 */
export class SWOTGenerationEngine {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });
    
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.maxTokens = 4000;
    this.temperature = 0.3; // Lower temperature for more consistent analysis
  }

  /**
   * Generate comprehensive SWOT analysis
   */
  async generateSWOTAnalysis(
    request: SWOTAnalysisRequest,
    textAnalysis: Map<string, TextAnalysisResult>,
    imageAnalysis: Map<string, ImageAnalysisResult>,
    failedReviews: number = 0,
    failedImages: number = 0
  ): Promise<SWOTAnalysisResult> {
    const startTime = Date.now();
    const requestId = `swot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let usedFallback = false;
    const errorKinds: string[] = [];

    try {
      console.log(`Generating SWOT analysis for ${request.businessName}`);

      // Prepare analysis context
      const analysisContext = this.prepareAnalysisContext(request, textAnalysis, imageAnalysis);

      // Generate SWOT items using AI
      const swotGeneration = await this.generateSWOTItems(request, analysisContext);
      const swotItems = swotGeneration.items;
      usedFallback = swotGeneration.usedFallback;
      errorKinds.push(...swotGeneration.errorKinds);

      // Generate business insights
      const insights = this.generateBusinessInsights(swotItems, analysisContext);

      // Generate action recommendations
      const actionRecommendations = this.generateActionRecommendations(swotItems, insights, request);

      // Prepare visualizations
      const visualizations = this.prepareVisualizations(swotItems, insights, analysisContext);

      // Calculate data quality metrics
      const dataQuality = this.calculateDataQuality(textAnalysis, imageAnalysis, request);

      const processingTime = Date.now() - startTime;

      const result: SWOTAnalysisResult = {
        requestId,
        businessId: request.businessId,
        analysisDate: new Date().toISOString(),
        swotAnalysis: {
          strengths: swotItems.filter(item => item.swotType === 'strength'),
          weaknesses: swotItems.filter(item => item.swotType === 'weakness'),
          opportunities: swotItems.filter(item => item.swotType === 'opportunity'),
          threats: swotItems.filter(item => item.swotType === 'threat')
        },
        insights,
        actionRecommendations,
        visualizations,
        dataQuality,
        processingTime,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          analysisEngine: 'automated-swot-engine',
          textAnalysisCount: textAnalysis.size,
          imageAnalysisCount: imageAnalysis.size,
          totalSWOTItems: swotItems.length,
          totalRecommendations: actionRecommendations.length,
          totalVisualizations: visualizations.length,
          usedFallback,
          failedImages,
          failedReviews,
          errorKinds: errorKinds.length > 0 ? errorKinds : undefined,
          partialSuccess: usedFallback || failedImages > 0 || failedReviews > 0
        }
      };

      console.log(`SWOT analysis completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('SWOT generation failed:', error);
      throw new AnalysisError(
        `Failed to generate SWOT analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'swot_generation',
        'processing',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Prepare analysis context from text and image analysis
   */
  private prepareAnalysisContext(
    request: SWOTAnalysisRequest,
    textAnalysis: Map<string, TextAnalysisResult>,
    imageAnalysis: Map<string, ImageAnalysisResult>
  ): {
    textInsights: any;
    imageInsights: any;
    businessContext: any;
    competitiveContext: any;
  } {
    // Aggregate text analysis results
    const textResults = Array.from(textAnalysis.values());
    const textInsights = this.aggregateTextInsights(textResults);

    // Aggregate image analysis results
    const imageResults = Array.from(imageAnalysis.values());
    const imageInsights = this.aggregateImageInsights(imageResults);

    // Prepare business context
    const businessContext = {
      name: request.businessName,
      category: request.businessCategory,
      location: request.location,
      reviewCount: request.reviewTexts.length,
      imageCount: request.images.length,
      businessInfo: request.analysisOptions?.businessContext || {}
    };

    // Prepare competitive context from platform data
    const competitiveContext = this.prepareCompetitiveContext(request.platformData || []);

    return {
      textInsights,
      imageInsights,
      businessContext,
      competitiveContext
    };
  }

  /**
   * Aggregate text analysis insights
   */
  private aggregateTextInsights(results: TextAnalysisResult[]): any {
    if (results.length === 0) {
      return {
        overallSentiment: { positive: 0, negative: 0, neutral: 1 },
        topThemes: [],
        keyPhrases: [],
        commonEntities: []
      };
    }

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const themeFrequency = new Map<string, { count: number; sentiments: string[] }>();
    const phraseFrequency = new Map<string, number>();
    const entityFrequency = new Map<string, number>();

    for (const result of results) {
      sentimentCounts[result.sentiment]++;

      // Aggregate themes
      for (const theme of result.themes) {
        const existing = themeFrequency.get(theme.theme) || { count: 0, sentiments: [] };
        existing.count += theme.frequency;
        existing.sentiments.push(theme.sentiment);
        themeFrequency.set(theme.theme, existing);
      }

      // Aggregate phrases
      for (const phrase of result.keyPhrases) {
        phraseFrequency.set(phrase, (phraseFrequency.get(phrase) || 0) + 1);
      }

      // Aggregate entities
      for (const entity of result.entities) {
        entityFrequency.set(entity.name, (entityFrequency.get(entity.name) || 0) + entity.confidence);
      }
    }

    const total = results.length;
    const overallSentiment = {
      positive: sentimentCounts.positive / total,
      negative: sentimentCounts.negative / total,
      neutral: sentimentCounts.neutral / total
    };

    const topThemes = Array.from(themeFrequency.entries())
      .map(([theme, data]) => ({
        theme,
        frequency: data.count,
        sentiment: this.determineDominantSentiment(data.sentiments)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const keyPhrases = Array.from(phraseFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([phrase]) => phrase);

    const commonEntities = Array.from(entityFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([entity]) => entity);

    return {
      overallSentiment,
      topThemes,
      keyPhrases,
      commonEntities
    };
  }

  /**
   * Aggregate image analysis insights
   */
  private aggregateImageInsights(results: ImageAnalysisResult[]): any {
    if (results.length === 0) {
      return {
        contentDistribution: {},
        averageQuality: { overall: 50 },
        emotionalTone: {},
        visualThemes: []
      };
    }

    const contentCounts = {
      hasFood: 0,
      hasInterior: 0,
      hasExterior: 0,
      hasPeople: 0,
      hasMenu: 0
    };

    const qualityScores: number[] = [];
    const emotionCounts = new Map<string, number>();
    const labelFrequency = new Map<string, number>();

    for (const result of results) {
      // Count content types
      if (result.content.hasFood) contentCounts.hasFood++;
      if (result.content.hasInterior) contentCounts.hasInterior++;
      if (result.content.hasExterior) contentCounts.hasExterior++;
      if (result.content.hasPeople) contentCounts.hasPeople++;
      if (result.content.hasMenu) contentCounts.hasMenu++;

      qualityScores.push(result.quality.overall);

      // Aggregate emotions
      if (result.emotions) {
        for (const emotion of result.emotions) {
          emotionCounts.set(emotion.emotion, (emotionCounts.get(emotion.emotion) || 0) + emotion.confidence);
        }
      }

      // Aggregate labels
      for (const label of result.labels) {
        labelFrequency.set(label.name, (labelFrequency.get(label.name) || 0) + label.confidence);
      }
    }

    const total = results.length;
    const contentDistribution = Object.fromEntries(
      Object.entries(contentCounts).map(([key, count]) => [key, count / total])
    );

    const averageQuality = {
      overall: Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / total)
    };

    const emotionalTone = Object.fromEntries(
      Array.from(emotionCounts.entries()).map(([emotion, totalConfidence]) => [
        emotion,
        totalConfidence / total
      ])
    );

    const visualThemes = Array.from(labelFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([label, confidence]) => ({ label, confidence: confidence / total }));

    return {
      contentDistribution,
      averageQuality,
      emotionalTone,
      visualThemes
    };
  }

  /**
   * Prepare competitive context
   */
  private prepareCompetitiveContext(platformData: any[]): any {
    if (platformData.length === 0) {
      return {
        hasCompetitiveData: false,
        marketPosition: 'unknown'
      };
    }

    // Analyze platform metrics for competitive insights
    const totalFollowers = platformData.reduce((sum, platform) => sum + (platform.followers || 0), 0);
    const totalReviews = platformData.reduce((sum, platform) => sum + (platform.reviews?.count || 0), 0);
    const averageRating = platformData
      .filter(p => p.reviews?.averageRating)
      .reduce((sum, p, _, arr) => sum + p.reviews.averageRating / arr.length, 0);

    return {
      hasCompetitiveData: true,
      totalFollowers,
      totalReviews,
      averageRating,
      platformCount: platformData.length,
      marketPosition: this.assessMarketPosition(totalFollowers, totalReviews, averageRating)
    };
  }

  /**
   * Generate SWOT items using AI
   */
  private async generateSWOTItems(
    request: SWOTAnalysisRequest,
    context: any
  ): Promise<{
    items: SWOTItemWithType[];
    usedFallback: boolean;
    errorKinds: string[];
  }> {
    const prompt = this.buildSWOTPrompt(request, context);
    
    try {
      const response = await this.invokeBedrockModel(prompt);
      const swotData = this.parseSWOTResponse(response);
      const items = this.enrichSWOTItems(swotData, context, request);
      
      return {
        items,
        usedFallback: false,
        errorKinds: []
      };

    } catch (error) {
      console.error('AI SWOT generation failed:', error);
      // Fallback to rule-based SWOT generation
      const fallbackItems = this.generateFallbackSWOT(context, request);
      
      return {
        items: fallbackItems,
        usedFallback: true,
        errorKinds: ['bedrock']
      };
    }
  }

  /**
   * Build prompt for AI SWOT generation
   */
  private buildSWOTPrompt(request: SWOTAnalysisRequest, context: any): string {
    const language = request.analysisOptions?.language || 'en';
    
    const prompt = `
You are a business analyst specializing in restaurant and hospitality industry analysis. Generate a comprehensive SWOT analysis for the following restaurant business.

Business Information:
- Name: ${request.businessName}
- Category: ${request.businessCategory}
- Location: ${request.location.city}, ${request.location.country}
- Reviews Analyzed: ${request.reviewTexts.length}
- Images Analyzed: ${request.images.length}

Customer Feedback Analysis:
- Overall Sentiment: ${Math.round(context.textInsights.overallSentiment.positive * 100)}% positive, ${Math.round(context.textInsights.overallSentiment.negative * 100)}% negative
- Top Themes: ${context.textInsights.topThemes.map((t: any) => `${t.theme} (${t.sentiment})`).join(', ')}
- Key Phrases: ${context.textInsights.keyPhrases.slice(0, 10).join(', ')}

Visual Content Analysis:
- Content Distribution: ${Object.entries(context.imageInsights.contentDistribution).map(([key, value]) => `${key}: ${Math.round((value as number) * 100)}%`).join(', ')}
- Average Image Quality: ${context.imageInsights.averageQuality.overall}/100
- Emotional Tone: ${Object.entries(context.imageInsights.emotionalTone).map(([emotion, confidence]) => `${emotion}: ${Math.round((confidence as number) * 100)}%`).join(', ')}

${context.competitiveContext.hasCompetitiveData ? `
Competitive Context:
- Total Social Followers: ${context.competitiveContext.totalFollowers}
- Total Reviews: ${context.competitiveContext.totalReviews}
- Average Rating: ${context.competitiveContext.averageRating?.toFixed(1)}/5
- Market Position: ${context.competitiveContext.marketPosition}
` : ''}

Generate a detailed SWOT analysis with the following structure:

STRENGTHS (4-6 items):
- Focus on what the business does well based on customer feedback and visual content
- Include specific evidence from reviews and images
- Consider operational, marketing, and customer service strengths

WEAKNESSES (4-6 items):
- Identify areas for improvement based on negative feedback and content gaps
- Include specific issues mentioned in reviews
- Consider operational, marketing, and service weaknesses

OPPORTUNITIES (4-6 items):
- Identify market opportunities and growth potential
- Consider underutilized strengths and market trends
- Include digital marketing and customer engagement opportunities

THREATS (4-6 items):
- Identify competitive threats and market challenges
- Consider reputation risks and operational threats
- Include industry trends that could impact the business

For each SWOT item, provide:
1. A clear, specific title
2. A detailed description with evidence
3. Impact level (low/medium/high)
4. Confidence score (0.0-1.0)
5. Category (operational/marketing/financial/strategic/customer/competitive)

Format your response as valid JSON with this structure:
{
  "strengths": [
    {
      "title": "Strength title",
      "description": "Detailed description with evidence",
      "impact": "high|medium|low",
      "confidence": 0.85,
      "category": "operational|marketing|financial|strategic|customer|competitive",
      "evidence": ["Evidence point 1", "Evidence point 2"]
    }
  ],
  "weaknesses": [...],
  "opportunities": [...],
  "threats": [...]
}

${language === 'de' ? 'Respond in German.' : 'Respond in English.'}
`;

    return prompt;
  }

  /**
   * Invoke Bedrock model for SWOT generation
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody)
    });

    const response = await this.bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new Error('Invalid response format from Bedrock');
    }

    return responseBody.content[0].text;
  }

  /**
   * Parse SWOT response from AI
   */
  private parseSWOTResponse(response: string): any {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[0];
      return JSON.parse(jsonStr);

    } catch (error) {
      console.error('Failed to parse SWOT response:', error);
      throw new Error('Invalid JSON response from AI model');
    }
  }

  /**
   * Enrich SWOT items with additional metadata
   */
  private enrichSWOTItems(
    swotData: any,
    context: any,
    request: SWOTAnalysisRequest
  ): SWOTItemWithType[] {
    const enrichedItems: SWOTItemWithType[] = [];

    // Process each SWOT category
    const categories = ['strengths', 'weaknesses', 'opportunities', 'threats'] as const;
    const categoryMap = {
      strengths: 'strength' as const,
      weaknesses: 'weakness' as const,
      opportunities: 'opportunity' as const,
      threats: 'threat' as const
    };

    for (const category of categories) {
      const items = swotData[category] || [];
      
      for (const item of items) {
        const enrichedItem: SWOTItemWithType = {
          id: uuidv4(),
          swotType: categoryMap[category],
          category: item.category || 'operational',
          title: item.title || 'Untitled',
          description: item.description || '',
          confidence: Math.min(1, Math.max(0, item.confidence || 0.5)),
          impact: item.impact || 'medium',
          evidence: this.createEvidence(item.evidence || [], context, request),
          relatedItems: [] // Will be populated later if needed
        };

        enrichedItems.push(enrichedItem);
      }
    }

    return enrichedItems;
  }

  /**
   * Create evidence objects from evidence points
   */
  private createEvidence(evidencePoints: string[], context: any, request: SWOTAnalysisRequest): Evidence[] {
    return evidencePoints.map(point => ({
      type: this.determineEvidenceType(point),
      source: this.determineEvidenceSource(point, request),
      data: { description: point },
      relevanceScore: 0.8, // Default relevance score
      extractedAt: new Date().toISOString()
    }));
  }

  /**
   * Determine evidence type from content
   */
  private determineEvidenceType(evidencePoint: string): 'review' | 'image' | 'metric' | 'trend' {
    const lowerPoint = evidencePoint.toLowerCase();
    
    if (lowerPoint.includes('review') || lowerPoint.includes('customer') || lowerPoint.includes('feedback')) {
      return 'review';
    } else if (lowerPoint.includes('photo') || lowerPoint.includes('image') || lowerPoint.includes('visual')) {
      return 'image';
    } else if (lowerPoint.includes('rating') || lowerPoint.includes('score') || lowerPoint.includes('%')) {
      return 'metric';
    } else {
      return 'trend';
    }
  }

  /**
   * Determine evidence source
   */
  private determineEvidenceSource(evidencePoint: string, request: SWOTAnalysisRequest): string {
    const lowerPoint = evidencePoint.toLowerCase();
    
    if (lowerPoint.includes('google')) return 'google';
    if (lowerPoint.includes('yelp')) return 'yelp';
    if (lowerPoint.includes('facebook')) return 'facebook';
    if (lowerPoint.includes('instagram')) return 'instagram';
    if (lowerPoint.includes('tripadvisor')) return 'tripadvisor';
    
    return 'analysis';
  }

  /**
   * Generate fallback SWOT when AI fails
   */
  private generateFallbackSWOT(
    context: any,
    request: SWOTAnalysisRequest
  ): SWOTItemWithType[] {
    const items: SWOTItemWithType[] = [];

    // Generate basic strengths
    if (context.textInsights.overallSentiment.positive > 0.6) {
      items.push({
        id: uuidv4(),
        swotType: 'strength',
        category: 'customer',
        title: 'Positive Customer Feedback',
        description: `${Math.round(context.textInsights.overallSentiment.positive * 100)}% of customer reviews are positive, indicating strong customer satisfaction.`,
        confidence: 0.8,
        impact: 'high',
        evidence: [{
          type: 'metric',
          source: 'analysis',
          data: { positivePercentage: context.textInsights.overallSentiment.positive },
          relevanceScore: 0.9,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    // Generate basic weaknesses
    if (context.textInsights.overallSentiment.negative > 0.3) {
      items.push({
        id: uuidv4(),
        swotType: 'weakness',
        category: 'customer',
        title: 'Customer Satisfaction Issues',
        description: `${Math.round(context.textInsights.overallSentiment.negative * 100)}% of reviews express negative sentiment, indicating areas for improvement.`,
        confidence: 0.7,
        impact: 'medium',
        evidence: [{
          type: 'metric',
          source: 'analysis',
          data: { negativePercentage: context.textInsights.overallSentiment.negative },
          relevanceScore: 0.8,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    // Generate basic opportunities
    if (context.imageInsights.contentDistribution.hasFood < 0.5) {
      items.push({
        id: uuidv4(),
        swotType: 'opportunity',
        category: 'marketing',
        title: 'Enhance Food Photography',
        description: 'Limited food photography presents an opportunity to showcase menu items and attract more customers.',
        confidence: 0.6,
        impact: 'medium',
        evidence: [{
          type: 'image',
          source: 'analysis',
          data: { foodPhotoPercentage: context.imageInsights.contentDistribution.hasFood },
          relevanceScore: 0.7,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    // Generate basic threats
    if (context.competitiveContext.hasCompetitiveData && context.competitiveContext.averageRating > 4.0) {
      items.push({
        id: uuidv4(),
        swotType: 'threat',
        category: 'competitive',
        title: 'Strong Competition',
        description: 'Competitors maintain high ratings and strong market presence, requiring continuous improvement to compete effectively.',
        confidence: 0.5,
        impact: 'medium',
        evidence: [{
          type: 'metric',
          source: 'competitive_analysis',
          data: { competitorRating: context.competitiveContext.averageRating },
          relevanceScore: 0.6,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    return items;
  }

  /**
   * Generate business insights from SWOT items
   */
  private generateBusinessInsights(
    swotItems: SWOTItemWithType[],
    context: any
  ): BusinessInsight[] {
    const insights: BusinessInsight[] = [];

    // Analyze SWOT distribution
    const strengthCount = swotItems.filter(item => item.swotType === 'strength').length;
    const weaknessCount = swotItems.filter(item => item.swotType === 'weakness').length;
    const opportunityCount = swotItems.filter(item => item.swotType === 'opportunity').length;
    const threatCount = swotItems.filter(item => item.swotType === 'threat').length;

    // Generate strategic insights
    if (strengthCount > weaknessCount * 1.5) {
      insights.push({
        id: uuidv4(),
        type: 'pattern',
        title: 'Strong Foundation for Growth',
        description: 'The business demonstrates more strengths than weaknesses, providing a solid foundation for expansion and market growth.',
        confidence: 0.8,
        impact: 'high',
        timeframe: 'medium-term',
        supportingEvidence: [{
          type: 'metric',
          source: 'swot_analysis',
          data: { strengthCount, weaknessCount },
          relevanceScore: 0.9,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    if (opportunityCount > threatCount) {
      insights.push({
        id: uuidv4(),
        type: 'opportunity',
        title: 'Favorable Market Conditions',
        description: 'Market analysis reveals more opportunities than threats, suggesting favorable conditions for business development.',
        confidence: 0.7,
        impact: 'medium',
        timeframe: 'short-term',
        supportingEvidence: [{
          type: 'metric',
          source: 'swot_analysis',
          data: { opportunityCount, threatCount },
          relevanceScore: 0.8,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    // Generate customer sentiment insights
    if (context.textInsights.overallSentiment.positive > 0.7) {
      insights.push({
        id: uuidv4(),
        type: 'trend',
        title: 'Excellent Customer Satisfaction',
        description: 'High positive sentiment in customer reviews indicates strong customer loyalty and satisfaction.',
        confidence: 0.9,
        impact: 'high',
        timeframe: 'immediate',
        supportingEvidence: [{
          type: 'metric',
          source: 'sentiment_analysis',
          data: { positivePercentage: context.textInsights.overallSentiment.positive },
          relevanceScore: 0.95,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    // Generate visual content insights
    if (context.imageInsights.averageQuality.overall < 60) {
      insights.push({
        id: uuidv4(),
        type: 'risk',
        title: 'Visual Content Quality Concerns',
        description: 'Below-average image quality may negatively impact customer perception and online engagement.',
        confidence: 0.6,
        impact: 'medium',
        timeframe: 'immediate',
        supportingEvidence: [{
          type: 'metric',
          source: 'image_analysis',
          data: { averageQuality: context.imageInsights.averageQuality.overall },
          relevanceScore: 0.7,
          extractedAt: new Date().toISOString()
        }]
      });
    }

    return insights;
  }

  /**
   * Generate action recommendations
   */
  private generateActionRecommendations(
    swotItems: SWOTItemWithType[],
    insights: BusinessInsight[],
    request: SWOTAnalysisRequest
  ): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];

    // Generate recommendations based on weaknesses
    const weaknesses = swotItems.filter(item => item.swotType === 'weakness');
    for (const weakness of weaknesses.slice(0, 3)) { // Top 3 weaknesses
      const recommendation = this.createRecommendationFromWeakness(weakness, request);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations based on opportunities
    const opportunities = swotItems.filter(item => item.swotType === 'opportunity');
    for (const opportunity of opportunities.slice(0, 2)) { // Top 2 opportunities
      const recommendation = this.createRecommendationFromOpportunity(opportunity, request);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations based on high-impact insights
    const highImpactInsights = insights.filter(insight => insight.impact === 'high');
    for (const insight of highImpactInsights.slice(0, 2)) {
      const recommendation = this.createRecommendationFromInsight(insight, request);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create recommendation from weakness
   */
  private createRecommendationFromWeakness(
    weakness: SWOTItem,
    request: SWOTAnalysisRequest
  ): ActionRecommendation | null {
    const title = `Address ${weakness.title}`;
    const description = `Implement targeted improvements to address identified weakness: ${weakness.description}`;
    
    // Determine category and steps based on weakness type
    let category: ActionRecommendation['category'] = 'operations';
    let steps: string[] = [];
    let timeframe = '2-4 weeks';
    let estimatedCost = 'Low';

    if (weakness.title.toLowerCase().includes('service')) {
      category = 'customer-service';
      steps = [
        'Conduct staff training on customer service excellence',
        'Implement customer feedback collection system',
        'Establish service quality monitoring procedures',
        'Create customer service improvement action plan'
      ];
      timeframe = '4-6 weeks';
      estimatedCost = 'Medium';
    } else if (weakness.title.toLowerCase().includes('food') || weakness.title.toLowerCase().includes('quality')) {
      category = 'operations';
      steps = [
        'Review and improve food preparation processes',
        'Implement quality control checkpoints',
        'Train kitchen staff on consistency standards',
        'Monitor customer feedback on food quality'
      ];
      timeframe = '2-3 weeks';
      estimatedCost = 'Low-Medium';
    } else if (weakness.title.toLowerCase().includes('marketing') || weakness.title.toLowerCase().includes('visibility')) {
      category = 'marketing';
      steps = [
        'Develop comprehensive marketing strategy',
        'Improve online presence and social media activity',
        'Create engaging visual content',
        'Implement customer engagement campaigns'
      ];
      timeframe = '6-8 weeks';
      estimatedCost = 'Medium';
    }

    return {
      id: uuidv4(),
      title,
      description,
      category,
      priority: weakness.impact === 'high' ? 'high' : 'medium',
      effort: 'medium',
      expectedImpact: weakness.impact,
      timeframe,
      estimatedCost,
      expectedROI: this.calculateExpectedROI(weakness.impact, category),
      steps,
      relatedSWOTItems: [weakness.id],
      successMetrics: this.generateSuccessMetrics(category, weakness.title)
    };
  }

  /**
   * Create recommendation from opportunity
   */
  private createRecommendationFromOpportunity(
    opportunity: SWOTItem,
    request: SWOTAnalysisRequest
  ): ActionRecommendation | null {
    const title = `Capitalize on ${opportunity.title}`;
    const description = `Develop strategy to leverage identified opportunity: ${opportunity.description}`;
    
    let category: ActionRecommendation['category'] = 'marketing';
    let steps: string[] = [];
    let timeframe = '4-8 weeks';
    let estimatedCost = 'Medium';

    if (opportunity.title.toLowerCase().includes('digital') || opportunity.title.toLowerCase().includes('online')) {
      category = 'digital-presence';
      steps = [
        'Audit current digital presence',
        'Develop digital marketing strategy',
        'Implement social media content calendar',
        'Optimize online listings and reviews'
      ];
    } else if (opportunity.title.toLowerCase().includes('market') || opportunity.title.toLowerCase().includes('customer')) {
      category = 'marketing';
      steps = [
        'Conduct market research and customer analysis',
        'Develop targeted marketing campaigns',
        'Create customer acquisition strategy',
        'Implement customer retention programs'
      ];
    }

    return {
      id: uuidv4(),
      title,
      description,
      category,
      priority: opportunity.impact === 'high' ? 'high' : 'medium',
      effort: 'medium',
      expectedImpact: opportunity.impact,
      timeframe,
      estimatedCost,
      expectedROI: this.calculateExpectedROI(opportunity.impact, category),
      steps,
      relatedSWOTItems: [opportunity.id],
      successMetrics: this.generateSuccessMetrics(category, opportunity.title)
    };
  }

  /**
   * Create recommendation from insight
   */
  private createRecommendationFromInsight(
    insight: BusinessInsight,
    request: SWOTAnalysisRequest
  ): ActionRecommendation | null {
    if (insight.type === 'risk') {
      return {
        id: uuidv4(),
        title: `Mitigate Risk: ${insight.title}`,
        description: `Address identified risk to prevent negative impact: ${insight.description}`,
        category: 'operations',
        priority: 'high',
        effort: 'medium',
        expectedImpact: 'high',
        timeframe: insight.timeframe === 'immediate' ? '1-2 weeks' : '4-6 weeks',
        estimatedCost: 'Medium',
        expectedROI: 'Risk mitigation - prevent revenue loss',
        steps: [
          'Assess current risk exposure',
          'Develop risk mitigation strategy',
          'Implement preventive measures',
          'Monitor risk indicators'
        ],
        relatedSWOTItems: [],
        successMetrics: ['Risk indicators reduced', 'Customer satisfaction maintained', 'Revenue stability']
      };
    }

    return null;
  }

  /**
   * Calculate expected ROI
   */
  private calculateExpectedROI(impact: string, category: string): string {
    const baseROI = {
      'customer-service': '15-25% increase in customer satisfaction',
      'marketing': '20-40% increase in customer acquisition',
      'digital-presence': '25-50% increase in online engagement',
      'operations': '10-20% improvement in efficiency',
      'competitive': '15-30% market share improvement'
    };

    const multiplier = impact === 'high' ? 1.5 : impact === 'medium' ? 1.0 : 0.7;
    const base = baseROI[category as keyof typeof baseROI] || '10-20% improvement';
    
    return `${base} (estimates are non-binding)`;
  }

  /**
   * Generate success metrics
   */
  private generateSuccessMetrics(category: string, title: string): string[] {
    const baseMetrics = {
      'customer-service': ['Customer satisfaction score', 'Review ratings', 'Complaint resolution time'],
      'marketing': ['Brand awareness', 'Customer acquisition rate', 'Marketing ROI'],
      'digital-presence': ['Online engagement rate', 'Website traffic', 'Social media followers'],
      'operations': ['Operational efficiency', 'Cost reduction', 'Process improvement'],
      'competitive': ['Market share', 'Competitive positioning', 'Differentiation metrics']
    };

    return baseMetrics[category as keyof typeof baseMetrics] || ['Performance improvement', 'Customer satisfaction', 'Business growth'];
  }

  /**
   * Prepare visualizations for SWOT analysis
   */
  private prepareVisualizations(
    swotItems: SWOTItemWithType[],
    insights: BusinessInsight[],
    context: any
  ): any[] {
    const visualizations = [];

    // SWOT Matrix visualization
    visualizations.push({
      type: 'matrix',
      title: 'SWOT Analysis Matrix',
      description: 'Interactive SWOT matrix showing all identified items',
      data: {
        strengths: swotItems.filter(item => item.swotType === 'strength'),
        weaknesses: swotItems.filter(item => item.swotType === 'weakness'),
        opportunities: swotItems.filter(item => item.swotType === 'opportunity'),
        threats: swotItems.filter(item => item.swotType === 'threat')
      },
      config: {
        width: 800,
        height: 600,
        interactive: true,
        colors: ['#4CAF50', '#F44336', '#2196F3', '#FF9800']
      }
    });

    // Impact vs Confidence chart
    visualizations.push({
      type: 'chart',
      title: 'Impact vs Confidence Analysis',
      description: 'Bubble chart showing SWOT items plotted by impact and confidence',
      data: swotItems.map(item => ({
        x: item.confidence,
        y: item.impact === 'high' ? 3 : item.impact === 'medium' ? 2 : 1,
        size: item.evidence.length,
        category: item.swotType,
        title: item.title
      })),
      config: {
        width: 600,
        height: 400,
        interactive: true
      }
    });

    // Sentiment timeline (if applicable)
    if (context.textInsights.topThemes.length > 0) {
      visualizations.push({
        type: 'heatmap',
        title: 'Customer Feedback Themes',
        description: 'Heatmap showing frequency and sentiment of customer feedback themes',
        data: context.textInsights.topThemes.map((theme: any) => ({
          theme: theme.theme,
          frequency: theme.frequency,
          sentiment: theme.sentiment
        })),
        config: {
          width: 700,
          height: 300,
          colors: ['#f44336', '#ffeb3b', '#4caf50']
        }
      });
    }

    return visualizations;
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(
    textAnalysis: Map<string, TextAnalysisResult>,
    imageAnalysis: Map<string, ImageAnalysisResult>,
    request: SWOTAnalysisRequest
  ): any {
    const reviewCoverage = textAnalysis.size / Math.max(request.reviewTexts.length, 1);
    const imageCoverage = imageAnalysis.size / Math.max(request.images.length, 1);
    
    // Calculate data freshness based on review dates
    const now = Date.now();
    const recentReviews = request.reviewTexts.filter(review => {
      const reviewDate = new Date(review.date).getTime();
      return (now - reviewDate) < (90 * 24 * 60 * 60 * 1000); // 90 days
    }).length;
    
    const dataFreshness = recentReviews / Math.max(request.reviewTexts.length, 1);
    
    // Estimate sentiment accuracy based on confidence scores
    const sentimentAccuracy = Array.from(textAnalysis.values())
      .reduce((sum, result) => sum + result.confidence, 0) / Math.max(textAnalysis.size, 1);
    
    const overallQuality = (reviewCoverage + imageCoverage + dataFreshness + sentimentAccuracy) / 4;
    
    const limitations: string[] = [];
    const recommendations: string[] = [];
    
    if (reviewCoverage < 0.8) {
      limitations.push('Some reviews could not be analyzed due to processing errors');
      recommendations.push('Improve review text preprocessing and error handling');
    }
    
    if (imageCoverage < 0.7) {
      limitations.push('Some images could not be analyzed due to access or format issues');
      recommendations.push('Ensure all images are accessible and in supported formats');
    }
    
    if (dataFreshness < 0.5) {
      limitations.push('Analysis based on older reviews may not reflect current business state');
      recommendations.push('Encourage more recent customer reviews for up-to-date insights');
    }
    
    if (request.reviewTexts.length < 20) {
      limitations.push('Limited review data may affect analysis accuracy');
      recommendations.push('Collect more customer reviews to improve analysis reliability');
    }

    return {
      reviewCoverage,
      imageCoverage,
      dataFreshness,
      sentimentAccuracy,
      overallQuality,
      limitations,
      recommendations
    };
  }

  /**
   * Helper methods
   */
  private determineDominantSentiment(sentiments: string[]): 'positive' | 'negative' | 'neutral' {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    
    for (const sentiment of sentiments) {
      if (sentiment in counts) {
        counts[sentiment as keyof typeof counts]++;
      }
    }
    
    const max = Math.max(counts.positive, counts.negative, counts.neutral);
    
    if (counts.positive === max) return 'positive';
    if (counts.negative === max) return 'negative';
    return 'neutral';
  }

  private assessMarketPosition(followers: number, reviews: number, rating: number): string {
    const score = (Math.log10(followers + 1) * 0.3) + (Math.log10(reviews + 1) * 0.4) + (rating * 0.3);
    
    if (score >= 4.0) return 'market_leader';
    if (score >= 3.0) return 'strong_competitor';
    if (score >= 2.0) return 'average_performer';
    return 'emerging_player';
  }
}