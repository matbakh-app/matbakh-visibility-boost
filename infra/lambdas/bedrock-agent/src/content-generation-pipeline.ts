/**
 * Content Generation Pipeline
 * 
 * Multi-provider content generation system supporting text, images, and multimedia content.
 * Designed for restaurant marketing with persona-adaptive outputs and quality assessment.
 */

import { AIRequest, AIResponse, AIContext } from './ai-agent-orchestrator';
import { BaseAIProvider, ProviderRouter } from './multi-provider-architecture';

// Content types and formats
export type ContentType = 
  | 'social_media_post'
  | 'blog_article'
  | 'email_newsletter'
  | 'menu_description'
  | 'event_announcement'
  | 'review_response'
  | 'seo_content'
  | 'ad_copy';

export type ContentFormat = 'text' | 'html' | 'markdown' | 'json';

export type SocialPlatform = 
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'google_my_business'
  | 'youtube';

// Content generation request structure
export interface ContentGenerationRequest {
  type: ContentType;
  format: ContentFormat;
  platform?: SocialPlatform;
  context: ContentContext;
  requirements: ContentRequirements;
  persona?: string;
  language: string;
}

export interface ContentContext {
  businessName: string;
  businessType: string;
  location?: string;
  cuisine?: string[];
  specialties?: string[];
  targetAudience?: string;
  brandVoice?: 'professional' | 'casual' | 'friendly' | 'luxury' | 'family';
  seasonality?: string;
  currentEvents?: string[];
  competitorInfo?: CompetitorInfo[];
}

export interface ContentRequirements {
  maxLength?: number;
  minLength?: number;
  includeHashtags?: boolean;
  includeCallToAction?: boolean;
  includeEmojis?: boolean;
  tone?: 'informative' | 'promotional' | 'engaging' | 'urgent' | 'celebratory';
  keywords?: string[];
  avoidWords?: string[];
  mustInclude?: string[];
}

export interface CompetitorInfo {
  name: string;
  strengths?: string[];
  weaknesses?: string[];
  contentStyle?: string;
}

// Content generation response
export interface ContentGenerationResponse {
  content: GeneratedContent;
  alternatives?: GeneratedContent[];
  metadata: ContentMetadata;
  qualityScore: number;
  suggestions?: ContentSuggestion[];
}

export interface GeneratedContent {
  text: string;
  hashtags?: string[];
  callToAction?: string;
  imagePrompts?: string[];
  schedulingSuggestions?: SchedulingSuggestion[];
}

export interface ContentMetadata {
  wordCount: number;
  characterCount: number;
  readabilityScore?: number;
  sentimentScore?: number;
  keywordDensity?: Record<string, number>;
  platformOptimized: boolean;
  personaAlignment: number; // 0-1
}

export interface ContentSuggestion {
  type: 'improvement' | 'alternative' | 'enhancement';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface SchedulingSuggestion {
  platform: SocialPlatform;
  optimalTime: string;
  frequency: string;
  reasoning: string;
}

// Platform-specific optimization rules
const PLATFORM_RULES: Record<SocialPlatform, {
  maxLength: number;
  hashtagLimit: number;
  preferredTone: string[];
  imageRequired: boolean;
  videoSupported: boolean;
}> = {
  instagram: {
    maxLength: 2200,
    hashtagLimit: 30,
    preferredTone: ['engaging', 'visual', 'lifestyle'],
    imageRequired: true,
    videoSupported: true
  },
  facebook: {
    maxLength: 63206,
    hashtagLimit: 5,
    preferredTone: ['conversational', 'community', 'informative'],
    imageRequired: false,
    videoSupported: true
  },
  twitter: {
    maxLength: 280,
    hashtagLimit: 3,
    preferredTone: ['concise', 'timely', 'engaging'],
    imageRequired: false,
    videoSupported: true
  },
  linkedin: {
    maxLength: 3000,
    hashtagLimit: 5,
    preferredTone: ['professional', 'informative', 'business'],
    imageRequired: false,
    videoSupported: true
  },
  tiktok: {
    maxLength: 150,
    hashtagLimit: 10,
    preferredTone: ['trendy', 'fun', 'creative'],
    imageRequired: false,
    videoSupported: true
  },
  google_my_business: {
    maxLength: 1500,
    hashtagLimit: 0,
    preferredTone: ['informative', 'local', 'helpful'],
    imageRequired: false,
    videoSupported: false
  },
  youtube: {
    maxLength: 5000,
    hashtagLimit: 15,
    preferredTone: ['descriptive', 'engaging', 'searchable'],
    imageRequired: false,
    videoSupported: true
  }
};

// Content generation pipeline
export class ContentGenerationPipeline {
  private router: ProviderRouter;
  private qualityThreshold: number = 0.7;

  constructor(router: ProviderRouter) {
    this.router = router;
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    // Step 1: Validate and prepare request
    const validatedRequest = this.validateRequest(request);
    
    // Step 2: Build AI request
    const aiRequest = this.buildAIRequest(validatedRequest);
    
    // Step 3: Generate content with primary provider
    const primaryResponse = await this.generateWithProvider(aiRequest, 'primary');
    
    // Step 4: Quality assessment
    const qualityScore = await this.assessContentQuality(primaryResponse, validatedRequest);
    
    // Step 5: Generate alternatives if quality is below threshold
    let alternatives: GeneratedContent[] = [];
    if (qualityScore < this.qualityThreshold) {
      alternatives = await this.generateAlternatives(aiRequest, validatedRequest);
    }
    
    // Step 6: Platform optimization
    const optimizedContent = this.optimizeForPlatform(primaryResponse, validatedRequest);
    
    // Step 7: Generate suggestions
    const suggestions = this.generateSuggestions(optimizedContent, validatedRequest, qualityScore);
    
    // Step 8: Create metadata
    const metadata = this.createContentMetadata(optimizedContent, validatedRequest);
    
    return {
      content: optimizedContent,
      alternatives,
      metadata,
      qualityScore,
      suggestions
    };
  }

  private validateRequest(request: ContentGenerationRequest): ContentGenerationRequest {
    // Apply platform-specific constraints
    if (request.platform) {
      const rules = PLATFORM_RULES[request.platform];
      if (!request.requirements.maxLength) {
        request.requirements.maxLength = rules.maxLength;
      }
      
      // Adjust hashtag requirements
      if (request.requirements.includeHashtags && rules.hashtagLimit === 0) {
        request.requirements.includeHashtags = false;
      }
    }

    // Validate required fields
    if (!request.context.businessName) {
      throw new Error('Business name is required for content generation');
    }

    return request;
  }

  private buildAIRequest(request: ContentGenerationRequest): AIRequest {
    const templateVariables = {
      contentType: request.type,
      platform: request.platform,
      businessContext: request.context,
      requirements: request.requirements,
      persona: request.persona,
      language: request.language,
      platformRules: request.platform ? PLATFORM_RULES[request.platform] : undefined
    };

    return {
      id: `content-gen-${Date.now()}`,
      type: 'content_generation',
      payload: templateVariables,
      context: {
        language: request.language,
        businessContext: {
          businessId: request.context.businessName.toLowerCase().replace(/\s+/g, '-'),
          industry: 'restaurant',
          location: request.context.location
        }
      },
      preferences: {
        enableFallback: true,
        maxLatency: 15000,
        qualityThreshold: this.qualityThreshold
      }
    };
  }

  private async generateWithProvider(aiRequest: AIRequest, priority: 'primary' | 'fallback'): Promise<GeneratedContent> {
    try {
      const availableProviders = priority === 'primary' 
        ? ['claude-3.5-sonnet'] 
        : ['gemini-pro', 'claude-3.5-sonnet'];
      
      const provider = await this.router.selectProvider(aiRequest, availableProviders);
      const response = await provider.execute(aiRequest);
      
      return this.parseContentResponse(response);
    } catch (error) {
      console.error(`Content generation failed with ${priority} provider:`, error);
      
      if (priority === 'primary') {
        // Try fallback
        return await this.generateWithProvider(aiRequest, 'fallback');
      }
      
      throw error;
    }
  }

  private parseContentResponse(response: AIResponse): GeneratedContent {
    let content: any;
    
    try {
      // Try to parse as JSON first
      content = JSON.parse(response.content.toString());
    } catch {
      // If not JSON, treat as plain text
      content = { text: response.content.toString() };
    }

    return {
      text: content.text || content.content || response.content.toString(),
      hashtags: content.hashtags || [],
      callToAction: content.callToAction || content.cta,
      imagePrompts: content.imagePrompts || content.image_suggestions || [],
      schedulingSuggestions: content.schedulingSuggestions || []
    };
  }

  private async assessContentQuality(content: GeneratedContent, request: ContentGenerationRequest): Promise<number> {
    let score = 0.5; // Base score

    // Length appropriateness
    const wordCount = content.text.split(/\s+/).length;
    const targetLength = request.requirements.maxLength ? request.requirements.maxLength / 5 : 50; // Rough word estimate
    
    if (wordCount >= targetLength * 0.7 && wordCount <= targetLength * 1.3) {
      score += 0.15;
    }

    // Required elements present
    if (request.requirements.includeHashtags && content.hashtags && content.hashtags.length > 0) {
      score += 0.1;
    }
    
    if (request.requirements.includeCallToAction && content.callToAction) {
      score += 0.1;
    }

    // Keyword inclusion
    if (request.requirements.keywords) {
      const textLower = content.text.toLowerCase();
      const keywordMatches = request.requirements.keywords.filter(keyword => 
        textLower.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / request.requirements.keywords.length) * 0.15;
    }

    // Business context relevance
    const businessName = request.context.businessName.toLowerCase();
    if (content.text.toLowerCase().includes(businessName)) {
      score += 0.1;
    }

    // Avoid forbidden words
    if (request.requirements.avoidWords) {
      const textLower = content.text.toLowerCase();
      const forbiddenFound = request.requirements.avoidWords.some(word => 
        textLower.includes(word.toLowerCase())
      );
      if (forbiddenFound) {
        score -= 0.2;
      }
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private async generateAlternatives(aiRequest: AIRequest, request: ContentGenerationRequest): Promise<GeneratedContent[]> {
    const alternatives: GeneratedContent[] = [];
    
    try {
      // Generate 2-3 alternatives with different approaches
      const alternativePrompts = [
        { ...aiRequest.payload, tone: 'more_creative', variation: 1 },
        { ...aiRequest.payload, tone: 'more_professional', variation: 2 },
        { ...aiRequest.payload, tone: 'more_engaging', variation: 3 }
      ];

      for (const promptVariation of alternativePrompts.slice(0, 2)) {
        const altRequest = { ...aiRequest, payload: promptVariation };
        try {
          const altResponse = await this.generateWithProvider(altRequest, 'primary');
          alternatives.push(altResponse);
        } catch (error) {
          console.warn('Failed to generate alternative content:', error);
        }
      }
    } catch (error) {
      console.error('Error generating alternatives:', error);
    }

    return alternatives;
  }

  private optimizeForPlatform(content: GeneratedContent, request: ContentGenerationRequest): GeneratedContent {
    if (!request.platform) {
      return content;
    }

    const rules = PLATFORM_RULES[request.platform];
    const optimized = { ...content };

    // Truncate text if too long
    if (optimized.text.length > rules.maxLength) {
      optimized.text = optimized.text.substring(0, rules.maxLength - 3) + '...';
    }

    // Limit hashtags
    if (optimized.hashtags && optimized.hashtags.length > rules.hashtagLimit) {
      optimized.hashtags = optimized.hashtags.slice(0, rules.hashtagLimit);
    }

    // Remove hashtags if platform doesn't support them
    if (rules.hashtagLimit === 0) {
      optimized.hashtags = [];
    }

    // Add platform-specific scheduling suggestions
    if (!optimized.schedulingSuggestions) {
      optimized.schedulingSuggestions = [];
    }

    optimized.schedulingSuggestions.push(this.getOptimalScheduling(request.platform, request.context));

    return optimized;
  }

  private getOptimalScheduling(platform: SocialPlatform, context: ContentContext): SchedulingSuggestion {
    // Basic scheduling recommendations (could be enhanced with ML)
    const schedules: Record<SocialPlatform, SchedulingSuggestion> = {
      instagram: {
        platform,
        optimalTime: '11:00-13:00, 17:00-19:00',
        frequency: '1-2 posts per day',
        reasoning: 'Peak engagement during lunch and dinner times for restaurants'
      },
      facebook: {
        platform,
        optimalTime: '12:00-15:00, 18:00-21:00',
        frequency: '3-5 posts per week',
        reasoning: 'Afternoon and evening engagement peaks'
      },
      twitter: {
        platform,
        optimalTime: '12:00-15:00, 17:00-18:00',
        frequency: '3-5 tweets per day',
        reasoning: 'Lunch break and commute times'
      },
      linkedin: {
        platform,
        optimalTime: '08:00-10:00, 12:00-14:00',
        frequency: '2-3 posts per week',
        reasoning: 'Business hours engagement'
      },
      tiktok: {
        platform,
        optimalTime: '18:00-24:00',
        frequency: '1-3 videos per week',
        reasoning: 'Evening entertainment consumption'
      },
      google_my_business: {
        platform,
        optimalTime: '10:00-12:00',
        frequency: '2-3 posts per week',
        reasoning: 'Morning search activity for dining decisions'
      },
      youtube: {
        platform,
        optimalTime: '14:00-16:00, 20:00-22:00',
        frequency: '1-2 videos per week',
        reasoning: 'Afternoon and evening video consumption'
      }
    };

    return schedules[platform];
  }

  private generateSuggestions(content: GeneratedContent, request: ContentGenerationRequest, qualityScore: number): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Quality-based suggestions
    if (qualityScore < 0.8) {
      suggestions.push({
        type: 'improvement',
        description: 'Consider adding more specific details about your restaurant\'s unique features',
        impact: 'medium'
      });
    }

    // Length suggestions
    const wordCount = content.text.split(/\s+/).length;
    if (request.platform === 'instagram' && wordCount < 20) {
      suggestions.push({
        type: 'enhancement',
        description: 'Instagram posts perform better with more descriptive captions (20-50 words)',
        impact: 'medium'
      });
    }

    // Hashtag suggestions
    if (request.requirements.includeHashtags && (!content.hashtags || content.hashtags.length < 3)) {
      suggestions.push({
        type: 'enhancement',
        description: 'Add more relevant hashtags to increase discoverability',
        impact: 'high'
      });
    }

    // Call-to-action suggestions
    if (!content.callToAction && request.type === 'social_media_post') {
      suggestions.push({
        type: 'improvement',
        description: 'Add a clear call-to-action to drive customer engagement',
        impact: 'high'
      });
    }

    // Image prompt suggestions
    if (request.platform && PLATFORM_RULES[request.platform].imageRequired && (!content.imagePrompts || content.imagePrompts.length === 0)) {
      suggestions.push({
        type: 'enhancement',
        description: 'This platform performs better with images. Consider adding visual content',
        impact: 'high'
      });
    }

    return suggestions;
  }

  private createContentMetadata(content: GeneratedContent, request: ContentGenerationRequest): ContentMetadata {
    const text = content.text;
    const wordCount = text.split(/\s+/).length;
    const characterCount = text.length;

    // Simple readability score (Flesch Reading Ease approximation)
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);
    const readabilityScore = 206.835 - (1.015 * (wordCount / sentences)) - (84.6 * (syllables / wordCount));

    // Simple sentiment analysis (positive words vs negative words)
    const positiveWords = ['great', 'excellent', 'amazing', 'delicious', 'wonderful', 'fantastic', 'perfect', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing'];
    
    const textLower = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    const sentimentScore = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);

    // Keyword density
    const keywordDensity: Record<string, number> = {};
    if (request.requirements.keywords) {
      for (const keyword of request.requirements.keywords) {
        const matches = (textLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        keywordDensity[keyword] = matches / wordCount;
      }
    }

    // Platform optimization check
    const platformOptimized = request.platform ? 
      characterCount <= PLATFORM_RULES[request.platform].maxLength : true;

    // Persona alignment (simplified)
    let personaAlignment = 0.7; // Default
    if (request.persona) {
      // This could be enhanced with more sophisticated persona matching
      personaAlignment = 0.8;
    }

    return {
      wordCount,
      characterCount,
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      sentimentScore,
      keywordDensity,
      platformOptimized,
      personaAlignment
    };
  }

  private countSyllables(text: string): number {
    // Simple syllable counting algorithm
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let syllableCount = 0;

    for (const word of words) {
      const vowelMatches = word.match(/[aeiouy]+/g);
      let syllables = vowelMatches ? vowelMatches.length : 1;
      
      // Adjust for silent 'e'
      if (word.endsWith('e')) {
        syllables--;
      }
      
      syllableCount += Math.max(1, syllables);
    }

    return syllableCount;
  }

  setQualityThreshold(threshold: number): void {
    this.qualityThreshold = Math.max(0, Math.min(1, threshold));
  }

  getQualityThreshold(): number {
    return this.qualityThreshold;
  }
}

// Export main components
export { ContentGenerationPipeline };