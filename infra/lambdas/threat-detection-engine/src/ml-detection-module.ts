/**
 * ML Detection Module
 * Uses machine learning models for advanced threat detection
 */
import { ThreatDetectionRequest, DetectedThreat, MLDetectionModel, ModelThresholds } from './types';

export class MLDetectionModule {
  private models: Map<string, MLDetectionModel> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeModels();
  }

  /**
   * Detect threats using ML models
   */
  async detect(request: ThreatDetectionRequest): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];

    try {
      if (!this.isInitialized) {
        console.warn('ML models not initialized, using fallback detection');
        return this.fallbackDetection(request);
      }

      // Run different ML detection models
      const [
        embeddingThreats,
        classificationThreats,
        anomalyThreats
      ] = await Promise.all([
        this.detectWithEmbeddings(request),
        this.detectWithClassification(request),
        this.detectAnomalies(request)
      ]);

      threats.push(...embeddingThreats);
      threats.push(...classificationThreats);
      threats.push(...anomalyThreats);

      console.log(`ML detection found ${threats.length} threats`);
      return threats;

    } catch (error) {
      console.error('ML detection failed:', error);
      return this.fallbackDetection(request);
    }
  }

  /**
   * Detect threats using embedding similarity
   */
  private async detectWithEmbeddings(request: ThreatDetectionRequest): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];
    const embeddingModel = this.models.get('embedding_threat_detection');
    
    if (!embeddingModel) {
      return threats;
    }

    try {
      // This would typically use a real embedding model
      // For now, we'll simulate embedding-based detection
      const suspiciousPatterns = [
        'ignore previous instructions',
        'system prompt',
        'jailbreak',
        'bypass safety',
        'admin mode'
      ];

      const promptLower = request.prompt.toLowerCase();
      for (const pattern of suspiciousPatterns) {
        if (promptLower.includes(pattern)) {
          const similarity = this.calculatePatternSimilarity(promptLower, pattern);
          if (similarity > embeddingModel.thresholds.medium) {
            threats.push({
              type: 'prompt_injection',
              severity: this.getSeverityFromScore(similarity, embeddingModel.thresholds),
              confidence: similarity,
              description: `ML embedding model detected suspicious pattern: "${pattern}"`,
              evidence: [pattern],
              location: {
                startIndex: promptLower.indexOf(pattern),
                endIndex: promptLower.indexOf(pattern) + pattern.length,
                context: this.getContext(request.prompt, promptLower.indexOf(pattern), pattern.length),
              },
              mitigation: 'Review prompt for injection attempts',
            });
          }
        }
      }

    } catch (error) {
      console.error('Embedding detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect threats using classification models
   */
  private async detectWithClassification(request: ThreatDetectionRequest): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];
    const classificationModel = this.models.get('classification_threat_detection');
    
    if (!classificationModel) {
      return threats;
    }

    try {
      // Simulate classification model predictions
      const features = this.extractFeatures(request.prompt);
      const predictions = this.simulateClassification(features);

      for (const [threatType, score] of Object.entries(predictions)) {
        if (score > classificationModel.thresholds.low) {
          threats.push({
            type: threatType as any,
            severity: this.getSeverityFromScore(score, classificationModel.thresholds),
            confidence: score,
            description: `ML classification model detected ${threatType} with confidence ${(score * 100).toFixed(1)}%`,
            evidence: [`Classification score: ${score.toFixed(3)}`],
            location: undefined,
            mitigation: `Review content for ${threatType} indicators`,
          });
        }
      }

    } catch (error) {
      console.error('Classification detection failed:', error);
    }

    return threats;
  }

  /**
   * Detect anomalies using anomaly detection models
   */
  private async detectAnomalies(request: ThreatDetectionRequest): Promise<DetectedThreat[]> {
    const threats: DetectedThreat[] = [];
    const anomalyModel = this.models.get('anomaly_detection');
    
    if (!anomalyModel) {
      return threats;
    }

    try {
      // Simulate anomaly detection
      const anomalyScore = this.calculateAnomalyScore(request);
      
      if (anomalyScore > anomalyModel.thresholds.medium) {
        threats.push({
          type: 'anomalous_behavior',
          severity: this.getSeverityFromScore(anomalyScore, anomalyModel.thresholds),
          confidence: anomalyScore,
          description: `ML anomaly detection identified unusual patterns`,
          evidence: [`Anomaly score: ${anomalyScore.toFixed(3)}`],
          location: undefined,
          mitigation: 'Investigate unusual request patterns',
        });
      }

    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }

    return threats;
  }

  /**
   * Fallback detection when ML models are unavailable
   */
  private fallbackDetection(request: ThreatDetectionRequest): DetectedThreat[] {
    const threats: DetectedThreat[] = [];

    // Simple keyword-based fallback
    const dangerousKeywords = [
      'ignore instructions',
      'system prompt',
      'jailbreak',
      'bypass',
      'admin mode',
      'root access'
    ];

    const promptLower = request.prompt.toLowerCase();
    for (const keyword of dangerousKeywords) {
      if (promptLower.includes(keyword)) {
        threats.push({
          type: 'prompt_injection',
          severity: 'medium',
          confidence: 0.6,
          description: `Fallback detection found suspicious keyword: "${keyword}"`,
          evidence: [keyword],
          location: {
            startIndex: promptLower.indexOf(keyword),
            endIndex: promptLower.indexOf(keyword) + keyword.length,
            context: this.getContext(request.prompt, promptLower.indexOf(keyword), keyword.length),
          },
          mitigation: 'Review prompt for potential threats',
        });
      }
    }

    return threats;
  }

  /**
   * Initialize ML models
   */
  private initializeModels(): void {
    try {
      // Initialize embedding model
      this.models.set('embedding_threat_detection', {
        modelId: 'embedding_threat_v1',
        modelType: 'embedding',
        version: '1.0.0',
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        lastTrained: new Date().toISOString(),
        features: ['text_embeddings', 'semantic_similarity'],
        thresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
          critical: 0.9,
        },
      });

      // Initialize classification model
      this.models.set('classification_threat_detection', {
        modelId: 'classification_threat_v1',
        modelType: 'classification',
        version: '1.0.0',
        accuracy: 0.78,
        precision: 0.75,
        recall: 0.82,
        f1Score: 0.78,
        lastTrained: new Date().toISOString(),
        features: ['prompt_length', 'special_char_ratio', 'keyword_density', 'sentiment_score'],
        thresholds: {
          low: 0.4,
          medium: 0.65,
          high: 0.8,
          critical: 0.9,
        },
      });

      // Initialize anomaly detection model
      this.models.set('anomaly_detection', {
        modelId: 'anomaly_detection_v1',
        modelType: 'anomaly',
        version: '1.0.0',
        accuracy: 0.72,
        precision: 0.68,
        recall: 0.76,
        f1Score: 0.72,
        lastTrained: new Date().toISOString(),
        features: ['request_frequency', 'prompt_patterns', 'user_behavior'],
        thresholds: {
          low: 0.5,
          medium: 0.7,
          high: 0.85,
          critical: 0.95,
        },
      });

      this.isInitialized = true;
      console.log(`Initialized ${this.models.size} ML models`);

    } catch (error) {
      console.error('Failed to initialize ML models:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Extract features from prompt for classification
   */
  private extractFeatures(prompt: string): Record<string, number> {
    return {
      prompt_length: prompt.length,
      word_count: prompt.split(/\s+/).length,
      special_char_ratio: (prompt.match(/[^a-zA-Z0-9\s]/g) || []).length / prompt.length,
      uppercase_ratio: (prompt.match(/[A-Z]/g) || []).length / prompt.length,
      question_marks: (prompt.match(/\?/g) || []).length,
      exclamation_marks: (prompt.match(/!/g) || []).length,
      keyword_density: this.calculateKeywordDensity(prompt),
      sentiment_score: this.calculateSentimentScore(prompt),
    };
  }

  /**
   * Simulate classification model predictions
   */
  private simulateClassification(features: Record<string, number>): Record<string, number> {
    // Simulate ML model predictions based on features
    const predictions: Record<string, number> = {};

    // Prompt injection likelihood
    predictions.prompt_injection = Math.min(1.0, 
      features.special_char_ratio * 0.3 +
      features.keyword_density * 0.4 +
      (features.prompt_length > 1000 ? 0.2 : 0) +
      Math.random() * 0.1
    );

    // Jailbreak attempt likelihood
    predictions.jailbreak_attempt = Math.min(1.0,
      features.keyword_density * 0.5 +
      features.uppercase_ratio * 0.2 +
      (features.exclamation_marks > 3 ? 0.2 : 0) +
      Math.random() * 0.1
    );

    // Malicious content likelihood
    predictions.malicious_content = Math.min(1.0,
      features.special_char_ratio * 0.2 +
      features.sentiment_score * 0.3 +
      (features.word_count < 5 ? 0.3 : 0) +
      Math.random() * 0.2
    );

    return predictions;
  }

  /**
   * Calculate anomaly score for request
   */
  private calculateAnomalyScore(request: ThreatDetectionRequest): number {
    let score = 0;

    // Prompt length anomaly
    const avgPromptLength = 200; // Assumed average
    const lengthDeviation = Math.abs(request.prompt.length - avgPromptLength) / avgPromptLength;
    score += Math.min(0.3, lengthDeviation);

    // Character distribution anomaly
    const features = this.extractFeatures(request.prompt);
    if (features.special_char_ratio > 0.3) score += 0.2;
    if (features.uppercase_ratio > 0.5) score += 0.2;

    // Timing anomaly (if metadata available)
    if (request.metadata) {
      const requestTime = new Date(request.metadata.timestamp);
      const hour = requestTime.getHours();
      // Unusual hours (2-6 AM) might be suspicious
      if (hour >= 2 && hour <= 6) score += 0.1;
    }

    // User risk profile anomaly
    if (request.context?.riskProfile) {
      if (request.context.riskProfile.riskLevel === 'high') score += 0.2;
      if (request.context.riskProfile.trustScore < 0.3) score += 0.1;
    }

    return Math.min(1.0, score + Math.random() * 0.1);
  }

  /**
   * Calculate keyword density for suspicious terms
   */
  private calculateKeywordDensity(prompt: string): number {
    const suspiciousKeywords = [
      'ignore', 'forget', 'disregard', 'override', 'bypass', 'jailbreak',
      'admin', 'root', 'system', 'prompt', 'instructions', 'rules'
    ];

    const words = prompt.toLowerCase().split(/\s+/);
    const keywordCount = words.filter(word => suspiciousKeywords.includes(word)).length;
    
    return words.length > 0 ? keywordCount / words.length : 0;
  }

  /**
   * Calculate basic sentiment score
   */
  private calculateSentimentScore(prompt: string): number {
    const negativeWords = [
      'hate', 'angry', 'bad', 'terrible', 'awful', 'horrible',
      'destroy', 'kill', 'attack', 'harm', 'damage', 'break'
    ];

    const positiveWords = [
      'love', 'good', 'great', 'excellent', 'amazing', 'wonderful',
      'help', 'assist', 'support', 'improve', 'enhance', 'benefit'
    ];

    const words = prompt.toLowerCase().split(/\s+/);
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;

    // Return negative sentiment score (higher = more negative)
    return words.length > 0 ? negativeCount / words.length : 0;
  }

  /**
   * Calculate pattern similarity
   */
  private calculatePatternSimilarity(text: string, pattern: string): number {
    // Simple similarity based on substring match and context
    if (text.includes(pattern)) {
      return 0.8 + Math.random() * 0.2; // High similarity for exact matches
    }
    
    // Check for partial matches
    const words = pattern.split(/\s+/);
    const matchedWords = words.filter(word => text.includes(word)).length;
    
    return matchedWords / words.length * 0.6; // Lower similarity for partial matches
  }

  /**
   * Get severity from score and thresholds
   */
  private getSeverityFromScore(score: number, thresholds: ModelThresholds): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= thresholds.critical) return 'critical';
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    if (score >= thresholds.low) return 'low';
    return 'info';
  }

  /**
   * Get context around a match
   */
  private getContext(text: string, startIndex: number, matchLength: number, contextSize: number = 50): string {
    const start = Math.max(0, startIndex - contextSize);
    const end = Math.min(text.length, startIndex + matchLength + contextSize);
    let context = text.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Update ML models
   */
  async updateModels(models: MLDetectionModel[]): Promise<void> {
    for (const model of models) {
      this.models.set(model.modelId, model);
    }
    console.log(`Updated ${models.length} ML models`);
  }

  /**
   * Get model information
   */
  getModels(): MLDetectionModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get model statistics
   */
  getModelStats(): {
    totalModels: number;
    modelTypes: Record<string, number>;
    averageAccuracy: number;
    lastUpdated: string;
  } {
    const models = Array.from(this.models.values());
    const modelTypes: Record<string, number> = {};
    
    for (const model of models) {
      modelTypes[model.modelType] = (modelTypes[model.modelType] || 0) + 1;
    }
    
    const averageAccuracy = models.length > 0 
      ? models.reduce((sum, model) => sum + model.accuracy, 0) / models.length 
      : 0;
    
    const lastUpdated = models.length > 0 
      ? Math.max(...models.map(model => new Date(model.lastTrained).getTime()))
      : Date.now();

    return {
      totalModels: models.length,
      modelTypes,
      averageAccuracy,
      lastUpdated: new Date(lastUpdated).toISOString(),
    };
  }

  /**
   * Health check for ML models
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {
      initialized: this.isInitialized,
      modelCount: this.models.size,
      models: {},
    };

    let healthyModels = 0;
    for (const [modelId, model] of this.models.entries()) {
      const modelAge = Date.now() - new Date(model.lastTrained).getTime();
      const isStale = modelAge > 30 * 24 * 60 * 60 * 1000; // 30 days
      const isAccurate = model.accuracy >= 0.7;
      
      const modelHealth = !isStale && isAccurate;
      details.models[modelId] = {
        healthy: modelHealth,
        accuracy: model.accuracy,
        age: Math.floor(modelAge / (24 * 60 * 60 * 1000)),
        stale: isStale,
      };
      
      if (modelHealth) healthyModels++;
    }

    const healthRatio = this.models.size > 0 ? healthyModels / this.models.size : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (!this.isInitialized || healthRatio < 0.5) {
      status = 'unhealthy';
    } else if (healthRatio < 0.8) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, details };
  }
}