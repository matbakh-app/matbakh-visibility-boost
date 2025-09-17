import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import {
  QualityMetrics,
  PromptExecution,
  UserFeedback,
  AnalyzeQualityRequest,
  QualityAssuranceError
} from './types';

export class QualityScoringEngine {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;

  constructor(region: string = 'eu-central-1', modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0') {
    this.bedrockClient = new BedrockRuntimeClient({ region });
    this.modelId = modelId;
  }

  /**
   * Analyze quality of prompt-output pair using multiple scoring methods
   */
  async analyzeQuality(request: AnalyzeQualityRequest): Promise<QualityMetrics> {
    try {
      // Combine multiple scoring approaches
      const [
        aiBasedScores,
        heuristicScores,
        structuralScores
      ] = await Promise.all([
        this.getAIBasedQualityScores(request.prompt, request.output, request.contextData),
        this.getHeuristicQualityScores(request.prompt, request.output),
        this.getStructuralQualityScores(request.prompt, request.output)
      ]);

      // Combine scores with weighted average
      const combinedMetrics = this.combineQualityScores([
        { scores: aiBasedScores, weight: 0.5 },
        { scores: heuristicScores, weight: 0.3 },
        { scores: structuralScores, weight: 0.2 }
      ]);

      return combinedMetrics;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to analyze quality: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'QUALITY_ANALYSIS_ERROR'
      );
    }
  }

  /**
   * Update quality metrics based on user feedback
   */
  async incorporateUserFeedback(
    currentMetrics: QualityMetrics,
    feedback: UserFeedback
  ): Promise<QualityMetrics> {
    try {
      const feedbackScore = feedback.rating / 5.0;
      const feedbackWeight = 0.3; // Weight of user feedback vs automated scoring
      
      // Adjust scores based on feedback
      const adjustedMetrics: QualityMetrics = {
        relevanceScore: this.adjustScore(currentMetrics.relevanceScore, feedbackScore, feedbackWeight),
        coherenceScore: this.adjustScore(currentMetrics.coherenceScore, feedbackScore, feedbackWeight),
        completenessScore: this.adjustScore(currentMetrics.completenessScore, feedbackScore, feedbackWeight),
        accuracyScore: this.adjustScore(currentMetrics.accuracyScore, feedbackScore, feedbackWeight),
        userSatisfactionScore: feedbackScore,
        overallScore: 0,
        confidence: Math.min(currentMetrics.confidence + 0.1, 1.0) // Increase confidence with feedback
      };

      // Recalculate overall score
      adjustedMetrics.overallScore = this.calculateOverallScore(adjustedMetrics);

      return adjustedMetrics;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to incorporate user feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FEEDBACK_INCORPORATION_ERROR'
      );
    }
  }

  /**
   * Batch analyze quality for multiple executions
   */
  async batchAnalyzeQuality(executions: PromptExecution[]): Promise<QualityMetrics[]> {
    try {
      const batchSize = 5; // Process in batches to avoid rate limits
      const results: QualityMetrics[] = [];

      for (let i = 0; i < executions.length; i += batchSize) {
        const batch = executions.slice(i, i + batchSize);
        const batchPromises = batch.map(execution =>
          this.analyzeQuality({
            prompt: execution.prompt,
            output: execution.output,
            contextData: execution.metadata
          })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < executions.length) {
          await this.delay(1000);
        }
      }

      return results;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to batch analyze quality: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BATCH_ANALYSIS_ERROR'
      );
    }
  }

  /**
   * Get quality benchmarks for comparison
   */
  async getQualityBenchmarks(templateId: string, timeRange: string = '30d'): Promise<{
    industry: QualityMetrics;
    template: QualityMetrics;
    topPerforming: QualityMetrics;
  }> {
    // This would typically query historical data
    // For now, return mock benchmarks
    return {
      industry: {
        relevanceScore: 0.75,
        coherenceScore: 0.80,
        completenessScore: 0.70,
        accuracyScore: 0.78,
        userSatisfactionScore: 0.72,
        overallScore: 0.75,
        confidence: 0.85
      },
      template: {
        relevanceScore: 0.82,
        coherenceScore: 0.85,
        completenessScore: 0.78,
        accuracyScore: 0.80,
        userSatisfactionScore: 0.79,
        overallScore: 0.81,
        confidence: 0.90
      },
      topPerforming: {
        relevanceScore: 0.92,
        coherenceScore: 0.95,
        completenessScore: 0.88,
        accuracyScore: 0.90,
        userSatisfactionScore: 0.89,
        overallScore: 0.91,
        confidence: 0.95
      }
    };
  }

  // Private methods for different scoring approaches

  private async getAIBasedQualityScores(
    prompt: string,
    output: string,
    contextData?: Record<string, any>
  ): Promise<QualityMetrics> {
    try {
      const analysisPrompt = this.buildQualityAnalysisPrompt(prompt, output, contextData);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: analysisPrompt
          }]
        })
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Parse AI response to extract quality scores
      return this.parseAIQualityResponse(responseBody.content[0].text);
    } catch (error) {
      // Fallback to heuristic scoring if AI analysis fails
      console.warn('AI-based quality scoring failed, using fallback:', error);
      return this.getHeuristicQualityScores(prompt, output);
    }
  }

  private getHeuristicQualityScores(prompt: string, output: string): QualityMetrics {
    const promptLength = prompt.length;
    const outputLength = output.length;
    const wordCount = output.split(/\s+/).length;
    
    // Heuristic calculations
    const relevanceScore = Math.min(1.0, outputLength / (promptLength * 2));
    const coherenceScore = this.calculateCoherenceScore(output);
    const completenessScore = Math.min(1.0, wordCount / 100); // Assume 100 words is complete
    const accuracyScore = this.calculateAccuracyScore(output);
    
    const overallScore = (relevanceScore + coherenceScore + completenessScore + accuracyScore) / 4;
    
    return {
      relevanceScore,
      coherenceScore,
      completenessScore,
      accuracyScore,
      overallScore,
      confidence: 0.6 // Lower confidence for heuristic scoring
    };
  }

  private getStructuralQualityScores(prompt: string, output: string): QualityMetrics {
    // Analyze structural aspects of the output
    const hasProperStructure = this.hasProperStructure(output);
    const hasActionableContent = this.hasActionableContent(output);
    const hasAppropriateLength = this.hasAppropriateLength(output);
    const followsPromptInstructions = this.followsPromptInstructions(prompt, output);
    
    const structuralScore = [
      hasProperStructure,
      hasActionableContent,
      hasAppropriateLength,
      followsPromptInstructions
    ].filter(Boolean).length / 4;
    
    return {
      relevanceScore: followsPromptInstructions ? 0.9 : 0.6,
      coherenceScore: hasProperStructure ? 0.9 : 0.6,
      completenessScore: hasAppropriateLength ? 0.9 : 0.6,
      accuracyScore: hasActionableContent ? 0.9 : 0.6,
      overallScore: structuralScore,
      confidence: 0.7
    };
  }

  private combineQualityScores(scoredMetrics: Array<{ scores: QualityMetrics; weight: number }>): QualityMetrics {
    const totalWeight = scoredMetrics.reduce((sum, item) => sum + item.weight, 0);
    
    const combinedScores = {
      relevanceScore: 0,
      coherenceScore: 0,
      completenessScore: 0,
      accuracyScore: 0,
      userSatisfactionScore: undefined,
      overallScore: 0,
      confidence: 0
    };
    
    scoredMetrics.forEach(({ scores, weight }) => {
      const normalizedWeight = weight / totalWeight;
      combinedScores.relevanceScore += scores.relevanceScore * normalizedWeight;
      combinedScores.coherenceScore += scores.coherenceScore * normalizedWeight;
      combinedScores.completenessScore += scores.completenessScore * normalizedWeight;
      combinedScores.accuracyScore += scores.accuracyScore * normalizedWeight;
      combinedScores.confidence += scores.confidence * normalizedWeight;
    });
    
    combinedScores.overallScore = this.calculateOverallScore(combinedScores);
    
    return combinedScores;
  }

  private buildQualityAnalysisPrompt(
    prompt: string,
    output: string,
    contextData?: Record<string, any>
  ): string {
    return `
Analyze the quality of this AI-generated response and provide scores from 0.0 to 1.0 for each dimension:

ORIGINAL PROMPT:
${prompt}

AI RESPONSE:
${output}

CONTEXT: ${contextData ? JSON.stringify(contextData, null, 2) : 'None provided'}

Please evaluate and provide scores (0.0-1.0) for:
1. RELEVANCE: How well does the response address the prompt?
2. COHERENCE: How logical and well-structured is the response?
3. COMPLETENESS: Does the response fully answer the question/request?
4. ACCURACY: How factually correct and reliable is the information?

Respond in this exact JSON format:
{
  "relevanceScore": 0.0,
  "coherenceScore": 0.0,
  "completenessScore": 0.0,
  "accuracyScore": 0.0,
  "reasoning": "Brief explanation of the scores"
}
`;
  }

  private parseAIQualityResponse(aiResponse: string): QualityMetrics {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        relevanceScore: parsed.relevanceScore || 0.5,
        coherenceScore: parsed.coherenceScore || 0.5,
        completenessScore: parsed.completenessScore || 0.5,
        accuracyScore: parsed.accuracyScore || 0.5,
        overallScore: (parsed.relevanceScore + parsed.coherenceScore + parsed.completenessScore + parsed.accuracyScore) / 4,
        confidence: 0.8 // High confidence for AI-based scoring
      };
    } catch (error) {
      // Fallback to default scores if parsing fails
      return {
        relevanceScore: 0.5,
        coherenceScore: 0.5,
        completenessScore: 0.5,
        accuracyScore: 0.5,
        overallScore: 0.5,
        confidence: 0.3
      };
    }
  }

  private calculateCoherenceScore(output: string): number {
    // Simple coherence calculation based on sentence structure
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const avgSentenceLength = output.length / sentences.length;
    const coherenceScore = Math.min(1.0, avgSentenceLength / 50); // Assume 50 chars per sentence is good
    
    return Math.max(0.3, coherenceScore); // Minimum score of 0.3
  }

  private calculateAccuracyScore(output: string): number {
    // Basic accuracy heuristics
    const hasNumbers = /\d/.test(output);
    const hasSpecificTerms = /\b(restaurant|business|marketing|visibility)\b/i.test(output);
    const hasActionableAdvice = /\b(should|recommend|suggest|improve|increase)\b/i.test(output);
    
    const accuracyFactors = [hasNumbers, hasSpecificTerms, hasActionableAdvice];
    return accuracyFactors.filter(Boolean).length / accuracyFactors.length;
  }

  private hasProperStructure(output: string): boolean {
    // Check for basic structure elements
    const hasHeadings = /^#+\s/m.test(output) || /\*\*.*\*\*/.test(output);
    const hasBulletPoints = /^[-*+]\s/m.test(output) || /^\d+\.\s/m.test(output);
    const hasParagraphs = output.split('\n\n').length > 1;
    
    return hasHeadings || hasBulletPoints || hasParagraphs;
  }

  private hasActionableContent(output: string): boolean {
    const actionWords = ['implement', 'create', 'improve', 'optimize', 'increase', 'develop', 'establish'];
    return actionWords.some(word => output.toLowerCase().includes(word));
  }

  private hasAppropriateLength(output: string): boolean {
    const wordCount = output.split(/\s+/).length;
    return wordCount >= 50 && wordCount <= 1000; // Reasonable range
  }

  private followsPromptInstructions(prompt: string, output: string): boolean {
    // Basic check if output addresses prompt requirements
    const promptKeywords = prompt.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const outputLower = output.toLowerCase();
    
    const matchedKeywords = promptKeywords.filter(keyword => 
      outputLower.includes(keyword)
    ).length;
    
    return matchedKeywords / Math.max(promptKeywords.length, 1) > 0.3;
  }

  private adjustScore(currentScore: number, feedbackScore: number, weight: number): number {
    return currentScore * (1 - weight) + feedbackScore * weight;
  }

  private calculateOverallScore(metrics: QualityMetrics): number {
    const scores = [
      metrics.relevanceScore,
      metrics.coherenceScore,
      metrics.completenessScore,
      metrics.accuracyScore
    ];
    
    if (metrics.userSatisfactionScore !== undefined) {
      scores.push(metrics.userSatisfactionScore);
    }
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}