import { 
  ComprehendClient, 
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectEntitiesCommand
} from '@aws-sdk/client-comprehend';
import { ReviewText, TextAnalysisResult, AnalysisError } from './types';

/**
 * Text Analysis Engine
 * 
 * Analyzes review texts using AWS Comprehend and custom algorithms:
 * - Sentiment analysis with confidence scores
 * - Key phrase extraction
 * - Entity recognition
 * - Theme identification
 * - Business-specific insights extraction
 */
export class TextAnalysisEngine {
  private comprehendClient: ComprehendClient;
  private restaurantKeywords: Map<string, string[]>;
  private sentimentThresholds: { positive: number; negative: number };

  constructor() {
    this.comprehendClient = new ComprehendClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });

    // Restaurant-specific keywords for theme identification
    this.restaurantKeywords = new Map([
      ['food_quality', ['delicious', 'tasty', 'fresh', 'flavorful', 'amazing', 'excellent', 'perfect', 'bland', 'stale', 'overcooked', 'undercooked', 'terrible']],
      ['service', ['friendly', 'attentive', 'professional', 'quick', 'slow', 'rude', 'helpful', 'knowledgeable', 'staff', 'waiter', 'waitress', 'server']],
      ['atmosphere', ['cozy', 'romantic', 'lively', 'quiet', 'noisy', 'crowded', 'spacious', 'clean', 'dirty', 'ambiance', 'atmosphere', 'decor']],
      ['value', ['expensive', 'cheap', 'affordable', 'overpriced', 'reasonable', 'worth', 'value', 'price', 'cost', 'money']],
      ['location', ['convenient', 'accessible', 'parking', 'location', 'easy to find', 'hard to find', 'central', 'remote']],
      ['cleanliness', ['clean', 'dirty', 'hygienic', 'sanitary', 'messy', 'spotless', 'filthy', 'tidy']],
      ['speed', ['fast', 'slow', 'quick', 'prompt', 'delayed', 'waiting', 'efficient', 'sluggish']],
      ['portion_size', ['large', 'small', 'huge', 'tiny', 'generous', 'skimpy', 'portion', 'size', 'amount']]
    ]);

    this.sentimentThresholds = {
      positive: 0.6,
      negative: 0.6
    };
  }

  /**
   * Analyze multiple review texts
   */
  async analyzeReviews(reviews: ReviewText[]): Promise<{
    results: Map<string, TextAnalysisResult>;
    failedReviews: number;
  }> {
    const results = new Map<string, TextAnalysisResult>();
    let failedReviews = 0;
    
    console.log(`Analyzing ${reviews.length} reviews`);

    // Process reviews in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchPromises = batch.map(review => this.analyzeReviewText(review));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batch.forEach((review, index) => {
          const result = batchResults[index];
          if (result) {
            // Robust success heuristic - any signal counts as success
            const hasSignal = 
              (result.confidence ?? 0) > 0 ||
              (result.keyPhrases?.length ?? 0) > 0 ||
              (result.entities?.length ?? 0) > 0 ||
              (result.themes?.length ?? 0) > 0;
            
            if (hasSignal) {
              results.set(review.id, result);
            } else {
              failedReviews++;
            }
          } else {
            failedReviews++;
          }
        });
      } catch (error) {
        console.error(`Failed to analyze batch ${i / batchSize + 1}:`, error);
        failedReviews += batch.length;
        // Continue with next batch
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < reviews.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully analyzed ${results.size} out of ${reviews.length} reviews`);
    return { results, failedReviews };
  }

  /**
   * Analyze individual review text
   */
  private async analyzeReviewText(review: ReviewText): Promise<TextAnalysisResult> {
    try {
      const text = review.text.trim();
      if (!text || text.length < 10) {
        return this.createEmptyResult();
      }

      // Detect language if not provided
      const language = review.language || this.detectLanguage(text);
      
      // Run parallel analysis
      const [sentimentResult, keyPhrasesResult, entitiesResult] = await Promise.all([
        this.detectSentiment(text, language),
        this.detectKeyPhrases(text, language),
        this.detectEntities(text, language)
      ]);

      // Extract themes using custom algorithm
      const themes = this.extractThemes(text, keyPhrasesResult.keyPhrases);

      return {
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        keyPhrases: keyPhrasesResult.keyPhrases,
        entities: entitiesResult.entities,
        themes
      };

    } catch (error) {
      console.error(`Failed to analyze review ${review.id}:`, error);
      return this.createEmptyResult();
    }
  }

  /**
   * Detect sentiment using AWS Comprehend
   */
  private async detectSentiment(text: string, language: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    try {
      const command = new DetectSentimentCommand({
        Text: text,
        LanguageCode: language === 'de' ? 'de' : 'en'
      });

      const response = await this.comprehendClient.send(command);
      
      if (!response.Sentiment || !response.SentimentScore) {
        return { sentiment: 'neutral', confidence: 0 };
      }

      const scores = response.SentimentScore;
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let confidence = 0;

      // Determine sentiment based on highest confidence score
      if (scores.Positive && scores.Positive >= this.sentimentThresholds.positive) {
        sentiment = 'positive';
        confidence = scores.Positive;
      } else if (scores.Negative && scores.Negative >= this.sentimentThresholds.negative) {
        sentiment = 'negative';
        confidence = scores.Negative;
      } else if (scores.Neutral) {
        sentiment = 'neutral';
        confidence = scores.Neutral;
      }

      return { sentiment, confidence };

    } catch (error) {
      console.error('Sentiment detection failed:', error);
      return { sentiment: 'neutral', confidence: 0 };
    }
  }

  /**
   * Extract key phrases using AWS Comprehend
   */
  private async detectKeyPhrases(text: string, language: string): Promise<{
    keyPhrases: string[];
  }> {
    try {
      const command = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: language === 'de' ? 'de' : 'en'
      });

      const response = await this.comprehendClient.send(command);
      
      if (!response.KeyPhrases) {
        return { keyPhrases: [] };
      }

      // Filter and sort key phrases by confidence
      const keyPhrases = response.KeyPhrases
        .filter(phrase => phrase.Score && phrase.Score >= 0.7)
        .sort((a, b) => (b.Score || 0) - (a.Score || 0))
        .slice(0, 10) // Top 10 key phrases
        .map(phrase => phrase.Text || '')
        .filter(text => text.length > 0);

      return { keyPhrases };

    } catch (error) {
      console.error('Key phrase detection failed:', error);
      return { keyPhrases: [] };
    }
  }

  /**
   * Detect entities using AWS Comprehend
   */
  private async detectEntities(text: string, language: string): Promise<{
    entities: Array<{
      name: string;
      type: string;
      confidence: number;
    }>;
  }> {
    try {
      const command = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: language === 'de' ? 'de' : 'en'
      });

      const response = await this.comprehendClient.send(command);
      
      if (!response.Entities) {
        return { entities: [] };
      }

      // Filter and format entities
      const entities = response.Entities
        .filter(entity => entity.Score && entity.Score >= 0.7)
        .map(entity => ({
          name: entity.Text || '',
          type: entity.Type || 'OTHER',
          confidence: entity.Score || 0
        }))
        .filter(entity => entity.name.length > 0);

      return { entities };

    } catch (error) {
      console.error('Entity detection failed:', error);
      return { entities: [] };
    }
  }

  /**
   * Extract restaurant-specific themes from text
   */
  private extractThemes(text: string, keyPhrases: string[]): Array<{
    theme: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }> {
    const themes = new Map<string, { count: number; sentiments: string[] }>();
    const lowerText = text.toLowerCase();
    const allPhrases = [...keyPhrases, ...text.split(/\s+/)];

    // Check for restaurant-specific themes
    for (const [theme, keywords] of this.restaurantKeywords) {
      let themeCount = 0;
      const themeSentiments: string[] = [];

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Count occurrences in text
        const matches = (lowerText.match(new RegExp(`\\b${keywordLower}\\b`, 'g')) || []).length;
        
        // Count occurrences in key phrases
        const phraseMatches = allPhrases.filter(phrase => 
          phrase.toLowerCase().includes(keywordLower)
        ).length;

        if (matches > 0 || phraseMatches > 0) {
          themeCount += matches + phraseMatches;
          
          // Determine sentiment context for this keyword
          const sentiment = this.getKeywordSentiment(keyword, lowerText);
          themeSentiments.push(sentiment);
        }
      }

      if (themeCount > 0) {
        themes.set(theme, {
          count: themeCount,
          sentiments: themeSentiments
        });
      }
    }

    // Convert to result format
    return Array.from(themes.entries()).map(([theme, data]) => {
      const positiveSentiments = data.sentiments.filter(s => s === 'positive').length;
      const negativeSentiments = data.sentiments.filter(s => s === 'negative').length;
      
      let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveSentiments > negativeSentiments) {
        overallSentiment = 'positive';
      } else if (negativeSentiments > positiveSentiments) {
        overallSentiment = 'negative';
      }

      return {
        theme,
        frequency: data.count,
        sentiment: overallSentiment
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Determine sentiment context for a keyword
   */
  private getKeywordSentiment(keyword: string, text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'best'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'bad', 'poor'];
    
    // Look for sentiment words near the keyword
    const keywordIndex = text.indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return 'neutral';
    
    const contextStart = Math.max(0, keywordIndex - 50);
    const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 50);
    const context = text.substring(contextStart, contextEnd);
    
    const hasPositive = positiveWords.some(word => context.includes(word));
    const hasNegative = negativeWords.some(word => context.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'war', 'haben', 'sein', 'mit', 'auf', 'für', 'von', 'zu', 'im', 'nicht', 'sehr', 'gut', 'schlecht'];
    const englishWords = ['the', 'and', 'is', 'was', 'have', 'be', 'with', 'on', 'for', 'from', 'to', 'in', 'not', 'very', 'good', 'bad'];
    
    const lowerText = text.toLowerCase();
    const germanMatches = germanWords.filter(word => lowerText.includes(word)).length;
    const englishMatches = englishWords.filter(word => lowerText.includes(word)).length;
    
    return germanMatches > englishMatches ? 'de' : 'en';
  }

  /**
   * Create empty result for failed analysis
   */
  private createEmptyResult(): TextAnalysisResult {
    return {
      sentiment: 'neutral',
      confidence: 0,
      keyPhrases: [],
      entities: [],
      themes: []
    };
  }

  /**
   * Aggregate analysis results for SWOT generation
   */
  aggregateResults(results: Map<string, TextAnalysisResult>): {
    overallSentiment: { positive: number; negative: number; neutral: number };
    topThemes: Array<{ theme: string; frequency: number; sentiment: string }>;
    keyInsights: string[];
    commonPhrases: string[];
  } {
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const themeAggregation = new Map<string, { frequency: number; sentiments: string[] }>();
    const allPhrases: string[] = [];
    const allEntities: string[] = [];

    // Aggregate all results
    for (const result of results.values()) {
      sentimentCounts[result.sentiment]++;
      
      // Aggregate themes
      for (const theme of result.themes) {
        const existing = themeAggregation.get(theme.theme) || { frequency: 0, sentiments: [] };
        existing.frequency += theme.frequency;
        existing.sentiments.push(theme.sentiment);
        themeAggregation.set(theme.theme, existing);
      }
      
      allPhrases.push(...result.keyPhrases);
      allEntities.push(...result.entities.map(e => e.name));
    }

    // Calculate percentages
    const total = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;
    const overallSentiment = {
      positive: total > 0 ? sentimentCounts.positive / total : 0,
      negative: total > 0 ? sentimentCounts.negative / total : 0,
      neutral: total > 0 ? sentimentCounts.neutral / total : 0
    };

    // Get top themes
    const topThemes = Array.from(themeAggregation.entries())
      .map(([theme, data]) => {
        const positiveSentiments = data.sentiments.filter(s => s === 'positive').length;
        const negativeSentiments = data.sentiments.filter(s => s === 'negative').length;
        
        let overallThemeSentiment = 'neutral';
        if (positiveSentiments > negativeSentiments) {
          overallThemeSentiment = 'positive';
        } else if (negativeSentiments > positiveSentiments) {
          overallThemeSentiment = 'negative';
        }

        return {
          theme,
          frequency: data.frequency,
          sentiment: overallThemeSentiment
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Generate key insights
    const keyInsights = this.generateKeyInsights(overallSentiment, topThemes, total);

    // Get most common phrases
    const phraseFrequency = new Map<string, number>();
    for (const phrase of allPhrases) {
      phraseFrequency.set(phrase, (phraseFrequency.get(phrase) || 0) + 1);
    }
    
    const commonPhrases = Array.from(phraseFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([phrase]) => phrase);

    return {
      overallSentiment,
      topThemes,
      keyInsights,
      commonPhrases
    };
  }

  /**
   * Generate key insights from aggregated data
   */
  private generateKeyInsights(
    sentiment: { positive: number; negative: number; neutral: number },
    themes: Array<{ theme: string; frequency: number; sentiment: string }>,
    totalReviews: number
  ): string[] {
    const insights: string[] = [];

    // Sentiment insights
    if (sentiment.positive > 0.7) {
      insights.push(`Overwhelmingly positive customer feedback (${Math.round(sentiment.positive * 100)}% positive reviews)`);
    } else if (sentiment.negative > 0.4) {
      insights.push(`Significant negative feedback requiring attention (${Math.round(sentiment.negative * 100)}% negative reviews)`);
    }

    // Theme insights
    const topPositiveThemes = themes.filter(t => t.sentiment === 'positive').slice(0, 3);
    const topNegativeThemes = themes.filter(t => t.sentiment === 'negative').slice(0, 3);

    if (topPositiveThemes.length > 0) {
      insights.push(`Strongest positive aspects: ${topPositiveThemes.map(t => t.theme).join(', ')}`);
    }

    if (topNegativeThemes.length > 0) {
      insights.push(`Areas needing improvement: ${topNegativeThemes.map(t => t.theme).join(', ')}`);
    }

    // Volume insights
    if (totalReviews < 10) {
      insights.push('Limited review data - consider encouraging more customer feedback');
    } else if (totalReviews > 100) {
      insights.push('Extensive customer feedback provides reliable insights');
    }

    return insights;
  }
}