/**
 * Claude AI Provider Implementation
 * Integrates with AWS Bedrock Claude models
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BaseAIProvider } from './base-provider';
import { AIRequest, AIResponse, AIProvider, ProviderHealthCheck } from './types';

export class ClaudeProvider extends BaseAIProvider {
  private bedrockClient: BedrockRuntimeClient;

  constructor(provider: AIProvider, region: string = 'eu-central-1') {
    super(provider, region);
    this.bedrockClient = new BedrockRuntimeClient({ region });
  }

  /**
   * Process AI request using Claude via AWS Bedrock
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

      // Build Claude-specific payload
      const claudePayload = this.buildClaudePayload(processedRequest, constraints);

      // Invoke Bedrock
      const command = new InvokeModelCommand({
        modelId: this.provider.configuration.model,
        body: JSON.stringify(claudePayload),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.bedrockClient.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const aiResponse = this.parseClaudeResponse(responseBody, request, startTime);

      // Record metrics
      await this.recordMetrics(request, aiResponse, startTime);

      // Update provider health on success
      this.provider.healthCheck.consecutiveFailures = 0;
      this.provider.status = 'active';

      return this.postProcessResponse(aiResponse, request);

    } catch (error) {
      console.error('Claude provider error:', error);
      return this.handleError(error as Error, request);
    }
  }

  /**
   * Build Claude-specific payload for Bedrock
   */
  private buildClaudePayload(request: AIRequest, constraints: any): any {
    const payload: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: constraints.maxTokens,
      temperature: constraints.temperature,
      top_p: constraints.topP,
    };

    // Handle different request types
    switch (request.type) {
      case 'text_generation':
      case 'analysis':
      case 'summarization':
        payload.messages = [
          {
            role: 'user',
            content: this.buildPrompt(request),
          },
        ];
        break;

      case 'conversation':
        payload.messages = this.buildConversationMessages(request);
        break;

      case 'classification':
        payload.messages = [
          {
            role: 'user',
            content: this.buildClassificationPrompt(request),
          },
        ];
        break;

      case 'extraction':
        payload.messages = [
          {
            role: 'user',
            content: this.buildExtractionPrompt(request),
          },
        ];
        break;

      case 'translation':
        payload.messages = [
          {
            role: 'user',
            content: this.buildTranslationPrompt(request),
          },
        ];
        break;

      default:
        payload.messages = [
          {
            role: 'user',
            content: request.prompt,
          },
        ];
    }

    // Add stop sequences if specified
    if (constraints.stopSequences && constraints.stopSequences.length > 0) {
      payload.stop_sequences = constraints.stopSequences;
    }

    // Add system message if context provides one
    if (request.context?.systemMessage) {
      payload.system = request.context.systemMessage;
    }

    return payload;
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
   * Build conversation messages for multi-turn chat
   */
  private buildConversationMessages(request: AIRequest): any[] {
    const messages = [];

    // Add conversation history if available
    if (request.context?.conversationHistory) {
      const history = request.context.conversationHistory as Array<{
        role: 'user' | 'assistant';
        content: string;
      }>;
      
      messages.push(...history);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    return messages;
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
   * Parse Claude response from Bedrock
   */
  private parseClaudeResponse(responseBody: any, request: AIRequest, startTime: number): AIResponse {
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Extract content from Claude response
    let content = '';
    if (responseBody.content && responseBody.content.length > 0) {
      content = responseBody.content[0].text || '';
    }

    // Calculate tokens and cost
    const inputTokens = this.estimateTokens(request.prompt);
    const outputTokens = responseBody.usage?.output_tokens || this.estimateTokens(content);
    const totalTokens = inputTokens + outputTokens;

    const cost = this.calculateCost(inputTokens, outputTokens);

    return {
      id: `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      providerId: this.provider.id,
      content,
      metadata: {
        tokensUsed: totalTokens,
        cost,
        latency,
        model: this.provider.configuration.model,
        finishReason: responseBody.stop_reason || 'completed',
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
  private calculateConfidence(responseBody: any): number {
    // Claude doesn't provide explicit confidence scores
    // We can infer confidence from response characteristics
    let confidence = 0.8; // Base confidence

    // Adjust based on stop reason
    if (responseBody.stop_reason === 'end_turn') {
      confidence += 0.1;
    } else if (responseBody.stop_reason === 'max_tokens') {
      confidence -= 0.1;
    }

    // Adjust based on response length (very short responses might be less confident)
    const content = responseBody.content?.[0]?.text || '';
    if (content.length < 10) {
      confidence -= 0.2;
    } else if (content.length > 100) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract safety scores from response
   */
  private extractSafetyScores(responseBody: any): Record<string, number> {
    // Claude/Bedrock doesn't provide explicit safety scores in the same format
    // We can implement basic safety assessment based on content
    const content = responseBody.content?.[0]?.text || '';
    
    return {
      toxicity: this.assessToxicity(content),
      bias: this.assessBias(content),
      appropriateness: this.assessAppropriateness(content),
    };
  }

  /**
   * Basic toxicity assessment (simplified)
   */
  private assessToxicity(content: string): number {
    const toxicPatterns = [
      /\b(hate|violence|harm|threat)\b/gi,
      /\b(kill|murder|death)\b/gi,
      /\b(racist|sexist|discriminat)\b/gi,
    ];

    let toxicityScore = 0;
    for (const pattern of toxicPatterns) {
      if (pattern.test(content)) {
        toxicityScore += 0.3;
      }
    }

    return Math.min(1, toxicityScore);
  }

  /**
   * Basic bias assessment (simplified)
   */
  private assessBias(content: string): number {
    const biasPatterns = [
      /\b(all (men|women|people) are)\b/gi,
      /\b(always|never) (men|women|people)\b/gi,
      /\b(typical|stereotypical)\b/gi,
    ];

    let biasScore = 0;
    for (const pattern of biasPatterns) {
      if (pattern.test(content)) {
        biasScore += 0.2;
      }
    }

    return Math.min(1, biasScore);
  }

  /**
   * Basic appropriateness assessment
   */
  private assessAppropriateness(content: string): number {
    // Higher score means more appropriate
    let appropriatenessScore = 1.0;

    const inappropriatePatterns = [
      /\b(explicit|nsfw|adult)\b/gi,
      /\b(illegal|criminal|fraud)\b/gi,
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        appropriatenessScore -= 0.3;
      }
    }

    return Math.max(0, appropriatenessScore);
  }

  /**
   * Perform health check for Claude provider
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
   * Get Claude-specific capabilities
   */
  static getDefaultCapabilities() {
    return [
      {
        type: 'text_generation' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['long_context', 'code_generation', 'analysis', 'reasoning'],
      },
      {
        type: 'analysis' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['deep_analysis', 'structured_output', 'reasoning'],
      },
      {
        type: 'conversation' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['context_awareness', 'multi_turn', 'personality'],
      },
      {
        type: 'summarization' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['extractive', 'abstractive', 'key_points'],
      },
      {
        type: 'classification' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['multi_class', 'confidence_scores', 'reasoning'],
      },
      {
        type: 'extraction' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['structured_extraction', 'entity_recognition', 'json_output'],
      },
      {
        type: 'translation' as const,
        supported: true,
        maxTokens: 200000,
        languages: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ja', 'ko', 'zh'],
        specialFeatures: ['context_aware', 'cultural_adaptation', 'technical_translation'],
      },
    ];
  }

  /**
   * Get default pricing for Claude
   */
  static getDefaultPricing() {
    return {
      inputTokenCost: 0.003, // $3 per 1M input tokens (Claude 3.5 Sonnet)
      outputTokenCost: 0.015, // $15 per 1M output tokens
      minimumCost: 0.0001,
      currency: 'USD',
      billingModel: 'per_token' as const,
    };
  }
}