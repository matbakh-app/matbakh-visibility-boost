/**
 * Gemini AI Provider Implementation
 * Integrates with Google's Gemini AI models
 */

import { GoogleAuth } from 'google-auth-library';
import { BaseAIProvider } from './base-provider';
import { AIRequest, AIResponse, AIProvider, ProviderHealthCheck } from './types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends BaseAIProvider {
  private auth: GoogleAuth;
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(provider: AIProvider, region: string = 'eu-central-1') {
    super(provider, region);
    
    this.apiKey = provider.configuration.apiKey || process.env.GOOGLE_API_KEY || '';
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/generative-language'],
    });

    if (!this.apiKey) {
      console.warn('Google API key not provided for Gemini provider');
    }
  }

  /**
   * Process AI request using Gemini
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      const validation = this.validateConstraints(request);
      if (!validation.valid) {
        throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit();
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason || 'Rate limit exceeded');
      }

      this.incrementRequestCount();

      // Prepare request
      const { processedRequest, constraints } = this.prepareRequest(request);

      // Build Gemini-specific payload
      const geminiPayload = this.buildGeminiPayload(processedRequest, constraints);

      // Make API call to Gemini
      const response = await this.callGeminiAPI(geminiPayload);
      
      // Parse response
      const aiResponse = this.parseGeminiResponse(response, request, startTime);

      // Record metrics
      await this.recordMetrics(request, aiResponse, startTime);

      // Update provider health on success
      this.provider.healthCheck.consecutiveFailures = 0;
      this.provider.status = 'active';

      return this.postProcessResponse(aiResponse, request);

    } catch (error) {
      console.error('Gemini provider error:', error);
      return this.handleError(error as Error, request);
    }
  }

  /**
   * Build Gemini-specific payload
   */
  private buildGeminiPayload(request: AIRequest, constraints: any): any {
    const payload: any = {
      contents: [],
      generationConfig: {
        maxOutputTokens: constraints.maxTokens,
        temperature: constraints.temperature,
        topP: constraints.topP,
      },
      safetySettings: this.buildSafetySettings(constraints.safetyLevel),
    };

    // Handle different request types
    switch (request.type) {
      case 'text_generation':
      case 'analysis':
      case 'summarization':
        payload.contents = [
          {
            parts: [{ text: this.buildPrompt(request) }],
          },
        ];
        break;

      case 'conversation':
        payload.contents = this.buildConversationContents(request);
        break;

      case 'classification':
        payload.contents = [
          {
            parts: [{ text: this.buildClassificationPrompt(request) }],
          },
        ];
        break;

      case 'extraction':
        payload.contents = [
          {
            parts: [{ text: this.buildExtractionPrompt(request) }],
          },
        ];
        break;

      case 'translation':
        payload.contents = [
          {
            parts: [{ text: this.buildTranslationPrompt(request) }],
          },
        ];
        break;

      default:
        payload.contents = [
          {
            parts: [{ text: request.prompt }],
          },
        ];
    }

    // Add stop sequences if specified
    if (constraints.stopSequences && constraints.stopSequences.length > 0) {
      payload.generationConfig.stopSequences = constraints.stopSequences;
    }

    return payload;
  }

  /**
   * Build safety settings for Gemini
   */
  private buildSafetySettings(safetyLevel: string = 'moderate'): any[] {
    const categories = [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT',
    ];

    let threshold = 'BLOCK_MEDIUM_AND_ABOVE';
    switch (safetyLevel) {
      case 'strict':
        threshold = 'BLOCK_LOW_AND_ABOVE';
        break;
      case 'moderate':
        threshold = 'BLOCK_MEDIUM_AND_ABOVE';
        break;
      case 'permissive':
        threshold = 'BLOCK_ONLY_HIGH';
        break;
    }

    return categories.map(category => ({
      category,
      threshold,
    }));
  }

  /**
   * Build enhanced prompt based on request type
   */
  private buildPrompt(request: AIRequest): string {
    let prompt = request.prompt;

    // Add context if available
    if (request.context) {
      const contextStr = Object.entries(request.context)
        .filter(([key]) => key !== 'systemMessage')
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
      
      if (contextStr) {
        prompt = `Context:\n${contextStr}\n\nRequest: ${prompt}`;
      }
    }

    // Add response format instructions
    if (request.constraints?.responseFormat === 'json') {
      prompt += '\n\nPlease respond with valid JSON only.';
    } else if (request.constraints?.responseFormat === 'structured') {
      prompt += '\n\nPlease provide a structured response with clear sections.';
    }

    return prompt;
  }

  /**
   * Build conversation contents for multi-turn chat
   */
  private buildConversationContents(request: AIRequest): any[] {
    const contents = [];

    // Add conversation history if available
    if (request.context?.conversationHistory) {
      const history = request.context.conversationHistory as Array<{
        role: 'user' | 'model';
        content: string;
      }>;
      
      for (const message of history) {
        contents.push({
          role: message.role,
          parts: [{ text: message.content }],
        });
      }
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: request.prompt }],
    });

    return contents;
  }

  /**
   * Build classification-specific prompt
   */
  private buildClassificationPrompt(request: AIRequest): string {
    const categories = request.context?.categories || [];
    const categoriesStr = categories.length > 0 
      ? `\n\nAvailable categories: ${categories.join(', ')}`
      : '';

    return `${request.prompt}${categoriesStr}\n\nPlease classify the above and respond with the most appropriate category.`;
  }

  /**
   * Build extraction-specific prompt
   */
  private buildExtractionPrompt(request: AIRequest): string {
    const fields = request.context?.extractionFields || [];
    const fieldsStr = fields.length > 0 
      ? `\n\nExtract the following fields: ${fields.join(', ')}`
      : '';

    return `${request.prompt}${fieldsStr}\n\nPlease extract the requested information and format as JSON.`;
  }

  /**
   * Build translation-specific prompt
   */
  private buildTranslationPrompt(request: AIRequest): string {
    const targetLanguage = request.context?.targetLanguage || 'English';
    const sourceLanguage = request.context?.sourceLanguage || 'auto-detect';

    return `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${request.prompt}`;
  }

  /**
   * Make API call to Gemini
   */
  private async callGeminiAPI(payload: any): Promise<GeminiResponse> {
    const model = this.provider.configuration.model || 'gemini-1.5-pro';
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Parse Gemini response
   */
  private parseGeminiResponse(responseBody: GeminiResponse, request: AIRequest, startTime: number): AIResponse {
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Extract content from Gemini response
    let content = '';
    if (responseBody.candidates && responseBody.candidates.length > 0) {
      const candidate = responseBody.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        content = candidate.content.parts[0].text || '';
      }
    }

    // Get token usage
    const tokensUsed = responseBody.usageMetadata?.totalTokenCount || this.estimateTokens(content);
    const inputTokens = responseBody.usageMetadata?.promptTokenCount || this.estimateTokens(request.prompt);
    const outputTokens = responseBody.usageMetadata?.candidatesTokenCount || this.estimateTokens(content);

    const cost = this.calculateCost(inputTokens, outputTokens);

    // Get finish reason
    const finishReason = responseBody.candidates?.[0]?.finishReason || 'completed';

    return {
      id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      providerId: this.provider.id,
      content,
      metadata: {
        tokensUsed,
        cost,
        latency,
        model: this.provider.configuration.model,
        finishReason,
        confidence: this.calculateConfidence(responseBody),
        safetyScores: this.extractSafetyScores(responseBody),
      },
      timestamp: new Date().toISOString(),
      success: true,
    };
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.provider.pricing.inputTokenCost;
    const outputCost = (outputTokens / 1000) * this.provider.pricing.outputTokenCost;
    return Math.max(inputCost + outputCost, this.provider.pricing.minimumCost);
  }

  /**
   * Calculate confidence score based on response metadata
   */
  private calculateConfidence(responseBody: GeminiResponse): number {
    let confidence = 0.8; // Base confidence

    if (!responseBody.candidates || responseBody.candidates.length === 0) {
      return 0;
    }

    const candidate = responseBody.candidates[0];

    // Adjust based on finish reason
    switch (candidate.finishReason) {
      case 'STOP':
        confidence += 0.1;
        break;
      case 'MAX_TOKENS':
        confidence -= 0.1;
        break;
      case 'SAFETY':
        confidence -= 0.3;
        break;
      case 'RECITATION':
        confidence -= 0.2;
        break;
    }

    // Adjust based on safety ratings
    if (candidate.safetyRatings) {
      const highRiskRatings = candidate.safetyRatings.filter(
        rating => rating.probability === 'HIGH' || rating.probability === 'MEDIUM'
      );
      confidence -= highRiskRatings.length * 0.1;
    }

    // Adjust based on response length
    const content = candidate.content?.parts?.[0]?.text || '';
    if (content.length < 10) {
      confidence -= 0.2;
    } else if (content.length > 100) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract safety scores from Gemini response
   */
  private extractSafetyScores(responseBody: GeminiResponse): Record<string, number> {
    const safetyScores: Record<string, number> = {};

    if (responseBody.candidates && responseBody.candidates.length > 0) {
      const candidate = responseBody.candidates[0];
      
      if (candidate.safetyRatings) {
        for (const rating of candidate.safetyRatings) {
          const category = rating.category.toLowerCase().replace('harm_category_', '');
          
          // Convert probability to numeric score
          let score = 0;
          switch (rating.probability) {
            case 'NEGLIGIBLE':
              score = 0.1;
              break;
            case 'LOW':
              score = 0.3;
              break;
            case 'MEDIUM':
              score = 0.6;
              break;
            case 'HIGH':
              score = 0.9;
              break;
          }
          
          safetyScores[category] = score;
        }
      }
    }

    return safetyScores;
  }

  /**
   * Perform health check for Gemini provider
   */
  async performHealthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    try {
      // Simple health check request
      const testRequest: AIRequest = {
        id: `health-check-${Date.now()}`,
        userId: 'system',
        type: 'text_generation',
        prompt: 'Hello, please respond with "OK" to confirm you are working.',
        constraints: {
          maxTokens: 10,
          temperature: 0,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await this.processRequest(testRequest);
      const responseTime = Date.now() - startTime;

      const healthCheck: ProviderHealthCheck = {
        lastCheck: new Date().toISOString(),
        status: response.success ? 'healthy' : 'unhealthy',
        responseTime,
        errorMessage: response.error,
        consecutiveFailures: response.success ? 0 : this.provider.healthCheck.consecutiveFailures + 1,
      };

      this.lastHealthCheck = healthCheck;
      return healthCheck;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: ProviderHealthCheck = {
        lastCheck: new Date().toISOString(),
        status: 'unhealthy',
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        consecutiveFailures: this.provider.healthCheck.consecutiveFailures + 1,
      };

      this.lastHealthCheck = healthCheck;
      return healthCheck;
    }
  }

  /**
   * Get Gemini-specific capabilities
   */
  static getDefaultCapabilities() {
    return [
      {
        type: 'text_generation' as const,
        supported: true,
        maxTokens: 1048576, // Gemini 1.5 Pro has very large context
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['multimodal', 'long_context', 'code_generation', 'reasoning'],
      },
      {
        type: 'analysis' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['multimodal_analysis', 'structured_output', 'reasoning'],
      },
      {
        type: 'conversation' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['context_awareness', 'multi_turn', 'personality', 'multimodal'],
      },
      {
        type: 'summarization' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['extractive', 'abstractive', 'key_points', 'long_document'],
      },
      {
        type: 'classification' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['multi_class', 'confidence_scores', 'reasoning', 'multimodal'],
      },
      {
        type: 'extraction' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['structured_extraction', 'entity_recognition', 'json_output', 'multimodal'],
      },
      {
        type: 'translation' as const,
        supported: true,
        maxTokens: 1048576,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar'],
        specialFeatures: ['context_aware', 'cultural_adaptation', 'technical_translation', 'multimodal'],
      },
    ];
  }

  /**
   * Get default pricing for Gemini
   */
  static getDefaultPricing() {
    return {
      inputTokenCost: 0.00125, // $1.25 per 1M input tokens (Gemini 1.5 Pro)
      outputTokenCost: 0.005, // $5 per 1M output tokens
      minimumCost: 0.0001,
      currency: 'USD',
      billingModel: 'per_token' as const,
    };
  }
}