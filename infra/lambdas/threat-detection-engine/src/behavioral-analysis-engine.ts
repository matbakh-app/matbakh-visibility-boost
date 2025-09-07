/**
 * Behavioral Analysis Engine
 * Analyzes user behavior patterns and detects anomalies
 */
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  ThreatDetectionRequest, 
  BehavioralAnalysis, 
  UserRiskProfile, 
  BehaviorProfile 
} from './types';

export class BehavioralAnalysisEngine {
  private dynamoClient: DynamoDBDocumentClient;

  constructor(region: string = 'eu-central-1') {
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  /**
   * Analyze user behavior for anomalies
   */
  async analyze(request: ThreatDetectionRequest): Promise<BehavioralAnalysis> {
    try {
      // Get user's historical behavior profile
      const userProfile = await this.getUserProfile(request.userId);
      const behaviorProfile = userProfile?.behaviorProfile;

      if (!behaviorProfile) {
        // First-time user - create baseline and return low-risk analysis
        await this.createUserProfile(request);
        return this.createBaselineAnalysis();
      }

      // Analyze current request against historical patterns
      const analysis: BehavioralAnalysis = {
        tokenUsageAnomaly: this.detectTokenUsageAnomaly(request, behaviorProfile),
        responseTimeAnomaly: this.detectResponseTimeAnomaly(request, behaviorProfile),
        frequencyAnomaly: await this.detectFrequencyAnomaly(request.userId),
        patternAnomaly: this.detectPatternAnomaly(request, behaviorProfile),
        userBehaviorScore: this.calculateUserBehaviorScore(request, behaviorProfile),
        sessionRiskScore: await this.calculateSessionRiskScore(request),
        historicalComparison: {
          avgTokens: behaviorProfile.avgTokensPerPrompt,
          avgResponseTime: behaviorProfile.typicalResponseTimes.reduce((a, b) => a + b, 0) / behaviorProfile.typicalResponseTimes.length,
          typicalPatterns: behaviorProfile.commonPatterns,
        },
      };

      // Update user profile with current request
      await this.updateUserProfile(request, analysis);

      return analysis;
    } catch (error) {
      console.error('Behavioral analysis failed:', error);
      return this.createBaselineAnalysis();
    }
  }

  /**
   * Get user risk profile
   */
  async getUserProfile(userId: string): Promise<UserRiskProfile | null> {
    try {
      const command = new GetCommand({
        TableName: 'user-risk-profiles',
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      });

      const response = await this.dynamoClient.send(command);
      return response.Item as UserRiskProfile | null;
    } catch (error) {
      console.error(`Failed to get user profile for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create new user profile
   */
  private async createUserProfile(request: ThreatDetectionRequest): Promise<void> {
    const profile: UserRiskProfile = {
      userId: request.userId,
      riskScore: 0.1, // Low initial risk
      riskLevel: 'low',
      factors: [],
      lastUpdated: new Date().toISOString(),
      threatHistory: [],
      behaviorProfile: {
        avgTokensPerPrompt: request.metadata?.tokenCount || 100,
        avgPromptsPerSession: 1,
        commonPatterns: [this.extractPattern(request.prompt)],
        preferredModels: request.metadata?.model ? [request.metadata.model] : [],
        typicalResponseTimes: request.metadata?.responseTime ? [request.metadata.responseTime] : [1000],
        anomalyThreshold: 0.7,
        lastAnalyzed: new Date().toISOString(),
      },
      restrictions: [],
    };

    const command = new PutCommand({
      TableName: 'user-risk-profiles',
      Item: {
        PK: `USER#${request.userId}`,
        SK: 'PROFILE',
        ...profile,
      },
    });

    await this.dynamoClient.send(command);
  }

  /**
   * Update user profile with current request data
   */
  private async updateUserProfile(request: ThreatDetectionRequest, analysis: BehavioralAnalysis): Promise<void> {
    try {
      const updateExpression = [
        'SET lastUpdated = :now',
        'ADD behaviorProfile.avgPromptsPerSession :one',
      ];

      const expressionAttributeValues: any = {
        ':now': new Date().toISOString(),
        ':one': 1,
      };

      // Update token average if available
      if (request.metadata?.tokenCount) {
        updateExpression.push('SET behaviorProfile.avgTokensPerPrompt = :avgTokens');
        expressionAttributeValues[':avgTokens'] = request.metadata.tokenCount;
      }

      // Update response time if available
      if (request.metadata?.responseTime) {
        updateExpression.push('SET behaviorProfile.typicalResponseTimes = list_append(if_not_exists(behaviorProfile.typicalResponseTimes, :emptyList), :responseTime)');
        expressionAttributeValues[':responseTime'] = [request.metadata.responseTime];
        expressionAttributeValues[':emptyList'] = [];
      }

      // Update common patterns
      const pattern = this.extractPattern(request.prompt);
      updateExpression.push('SET behaviorProfile.commonPatterns = list_append(if_not_exists(behaviorProfile.commonPatterns, :emptyList), :pattern)');
      expressionAttributeValues[':pattern'] = [pattern];

      const command = new UpdateCommand({
        TableName: 'user-risk-profiles',
        Key: {
          PK: `USER#${request.userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await this.dynamoClient.send(command);
    } catch (error) {
      console.error(`Failed to update user profile for ${request.userId}:`, error);
    }
  }

  /**
   * Detect token usage anomalies
   */
  private detectTokenUsageAnomaly(request: ThreatDetectionRequest, profile: BehaviorProfile): boolean {
    if (!request.metadata?.tokenCount) return false;

    const currentTokens = request.metadata.tokenCount;
    const avgTokens = profile.avgTokensPerPrompt;
    const threshold = profile.anomalyThreshold;

    // Check if current usage is significantly different from average
    const deviation = Math.abs(currentTokens - avgTokens) / avgTokens;
    return deviation > threshold;
  }

  /**
   * Detect response time anomalies
   */
  private detectResponseTimeAnomaly(request: ThreatDetectionRequest, profile: BehaviorProfile): boolean {
    if (!request.metadata?.responseTime || profile.typicalResponseTimes.length === 0) return false;

    const currentResponseTime = request.metadata.responseTime;
    const avgResponseTime = profile.typicalResponseTimes.reduce((a, b) => a + b, 0) / profile.typicalResponseTimes.length;
    const threshold = profile.anomalyThreshold;

    // Check if current response time is significantly different
    const deviation = Math.abs(currentResponseTime - avgResponseTime) / avgResponseTime;
    return deviation > threshold;
  }

  /**
   * Detect frequency anomalies
   */
  private async detectFrequencyAnomaly(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const command = new QueryCommand({
        TableName: 'threat-detection-logs',
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK > :timestamp',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':timestamp': oneHourAgo.toISOString(),
        },
      });

      const response = await this.dynamoClient.send(command);
      const requestCount = response.Items?.length || 0;

      // Consider more than 100 requests per hour as anomalous
      return requestCount > 100;
    } catch (error) {
      console.error('Failed to detect frequency anomaly:', error);
      return false;
    }
  }

  /**
   * Detect pattern anomalies
   */
  private detectPatternAnomaly(request: ThreatDetectionRequest, profile: BehaviorProfile): boolean {
    const currentPattern = this.extractPattern(request.prompt);
    const commonPatterns = profile.commonPatterns;

    // Check if current pattern is similar to any common patterns
    for (const pattern of commonPatterns) {
      const similarity = this.calculateSimilarity(currentPattern, pattern);
      if (similarity > 0.7) {
        return false; // Pattern is familiar
      }
    }

    // Pattern is significantly different from usual patterns
    return commonPatterns.length > 5; // Only flag as anomaly if we have enough historical data
  }

  /**
   * Calculate user behavior score
   */
  private calculateUserBehaviorScore(request: ThreatDetectionRequest, profile: BehaviorProfile): number {
    let score = 0;

    // Token usage factor
    if (request.metadata?.tokenCount) {
      const tokenDeviation = Math.abs(request.metadata.tokenCount - profile.avgTokensPerPrompt) / profile.avgTokensPerPrompt;
      score += Math.min(tokenDeviation, 1.0) * 0.3;
    }

    // Response time factor
    if (request.metadata?.responseTime && profile.typicalResponseTimes.length > 0) {
      const avgResponseTime = profile.typicalResponseTimes.reduce((a, b) => a + b, 0) / profile.typicalResponseTimes.length;
      const timeDeviation = Math.abs(request.metadata.responseTime - avgResponseTime) / avgResponseTime;
      score += Math.min(timeDeviation, 1.0) * 0.2;
    }

    // Pattern novelty factor
    const currentPattern = this.extractPattern(request.prompt);
    let maxSimilarity = 0;
    for (const pattern of profile.commonPatterns) {
      const similarity = this.calculateSimilarity(currentPattern, pattern);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    score += (1 - maxSimilarity) * 0.3;

    // Model usage factor
    if (request.metadata?.model && !profile.preferredModels.includes(request.metadata.model)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate session risk score
   */
  private async calculateSessionRiskScore(request: ThreatDetectionRequest): Promise<number> {
    if (!request.context?.sessionId) return 0;

    try {
      // Get recent requests in this session
      const command = new QueryCommand({
        TableName: 'threat-detection-logs',
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `SESSION#${request.context.sessionId}`,
        },
        Limit: 50,
      });

      const response = await this.dynamoClient.send(command);
      const sessionRequests = response.Items || [];

      if (sessionRequests.length === 0) return 0;

      // Calculate risk based on session characteristics
      let riskScore = 0;

      // High frequency in short time
      const timeSpan = this.calculateTimeSpan(sessionRequests);
      if (timeSpan < 300000 && sessionRequests.length > 10) { // 5 minutes, 10+ requests
        riskScore += 0.4;
      }

      // Escalating threat levels
      const threatLevels = sessionRequests.map(req => req.threatLevel);
      const highThreatCount = threatLevels.filter(level => level === 'high' || level === 'critical').length;
      riskScore += (highThreatCount / sessionRequests.length) * 0.6;

      return Math.min(riskScore, 1.0);
    } catch (error) {
      console.error('Failed to calculate session risk score:', error);
      return 0;
    }
  }

  /**
   * Create baseline analysis for new users
   */
  private createBaselineAnalysis(): BehavioralAnalysis {
    return {
      tokenUsageAnomaly: false,
      responseTimeAnomaly: false,
      frequencyAnomaly: false,
      patternAnomaly: false,
      userBehaviorScore: 0.1,
      sessionRiskScore: 0.1,
      historicalComparison: {
        avgTokens: 100,
        avgResponseTime: 1000,
        typicalPatterns: [],
      },
    };
  }

  /**
   * Extract pattern from prompt text
   */
  private extractPattern(prompt: string): string {
    // Simplified pattern extraction - in production, use more sophisticated NLP
    const words = prompt.toLowerCase().split(/\s+/).slice(0, 10); // First 10 words
    return words.join(' ');
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculateSimilarity(pattern1: string, pattern2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(pattern1.split(' '));
    const set2 = new Set(pattern2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate time span of session requests
   */
  private calculateTimeSpan(requests: any[]): number {
    if (requests.length < 2) return 0;

    const timestamps = requests.map(req => new Date(req.timestamp).getTime()).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }
} 
     if (timeSpan < 60000) { // Less than 1 minute
        threats.push({
          type: 'anomalous_behavior',
          severity: 'high',
          confidence: 0.8,
          description: 'Rapid-fire messaging detected',
          evidence: [`${history.length} messages in ${Math.round(timeSpan / 1000)} seconds`],
          location: undefined,
          mitigation: 'Implement rate limiting and monitor for automated behavior',
        });
      }
    }

    // Check for conversation pattern anomalies
    const userMessages = history.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      // Check for repetitive content
      const contentSimilarity = this.calculateContentSimilarity(userMessages.map(msg => msg.content));
      if (contentSimilarity > 0.8) {
        threats.push({
          type: 'anomalous_behavior',
          severity: 'medium',
          confidence: 0.7,
          description: 'Highly repetitive conversation content detected',
          evidence: [`Content similarity: ${(contentSimilarity * 100).toFixed(1)}%`],
          location: undefined,
          mitigation: 'Check for automated or scripted interactions',
        });
      }
    }

    return threats;
  }

  /**
   * Detect repetitive patterns in text
   */
  private detectRepetitivePatterns(text: string): {
    isRepetitive: boolean;
    pattern: string;
    count: number;
    confidence: number;
  } {
    const words = text.toLowerCase().split(/\s+/);
    const patterns: Map<string, number> = new Map();

    // Check for repeated phrases (2-5 words)
    for (let length = 2; length <= Math.min(5, words.length); length++) {
      for (let i = 0; i <= words.length - length; i++) {
        const pattern = words.slice(i, i + length).join(' ');
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    }

    // Find the most repeated pattern
    let maxCount = 0;
    let maxPattern = '';
    for (const [pattern, count] of patterns.entries()) {
      if (count > maxCount && count >= 3) {
        maxCount = count;
        maxPattern = pattern;
      }
    }

    const isRepetitive = maxCount >= 3;
    const confidence = Math.min(1.0, maxCount / 10);

    return {
      isRepetitive,
      pattern: maxPattern,
      count: maxCount,
      confidence,
    };
  }

  /**
   * Detect unusual characters in text
   */
  private detectUnusualCharacters(text: string): {
    hasUnusual: boolean;
    examples: string[];
  } {
    const examples: string[] = [];
    
    // Check for unusual Unicode characters
    const unusualChars = text.match(/[^\x00-\x7F\u00A0-\u024F\u1E00-\u1EFF]/g);
    if (unusualChars && unusualChars.length > 0) {
      examples.push(`Unusual Unicode characters: ${unusualChars.slice(0, 5).join(', ')}`);
    }

    // Check for excessive whitespace or control characters
    const controlChars = text.match(/[\x00-\x1F\x7F-\x9F]/g);
    if (controlChars && controlChars.length > 0) {
      examples.push(`Control characters detected: ${controlChars.length} instances`);
    }

    // Check for zero-width characters
    const zeroWidthChars = text.match(/[\u200B-\u200D\uFEFF]/g);
    if (zeroWidthChars && zeroWidthChars.length > 0) {
      examples.push(`Zero-width characters: ${zeroWidthChars.length} instances`);
    }

    return {
      hasUnusual: examples.length > 0,
      examples,
    };
  }

  /**
   * Calculate ratio of special characters to total characters
   */
  private calculateSpecialCharacterRatio(text: string): number {
    const specialChars = text.match(/[^a-zA-Z0-9\s]/g);
    return specialChars ? specialChars.length / text.length : 0;
  }

  /**
   * Calculate content similarity between messages
   */
  private calculateContentSimilarity(contents: string[]): number {
    if (contents.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < contents.length - 1; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        totalSimilarity += this.calculateTextSimilarity(contents[i], contents[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  /**
   * Calculate similarity between two texts using simple word overlap
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Update behavioral analysis parameters
   */
  updateParameters(params: {
    normalPromptLengthRange?: { min: number; max: number };
    suspiciousPromptLength?: number;
    rapidFireThreshold?: number;
    unusualTimingThreshold?: number;
  }): void {
    if (params.normalPromptLengthRange) {
      Object.assign(this.NORMAL_PROMPT_LENGTH_RANGE, params.normalPromptLengthRange);
    }
    if (params.suspiciousPromptLength) {
      this.SUSPICIOUS_PROMPT_LENGTH = params.suspiciousPromptLength;
    }
    if (params.rapidFireThreshold) {
      this.RAPID_FIRE_THRESHOLD = params.rapidFireThreshold;
    }
    if (params.unusualTimingThreshold) {
      this.UNUSUAL_TIMING_THRESHOLD = params.unusualTimingThreshold;
    }
    console.log('Behavioral analysis parameters updated');
  }

  /**
   * Get current analysis parameters
   */
  getParameters(): {
    normalPromptLengthRange: { min: number; max: number };
    suspiciousPromptLength: number;
    rapidFireThreshold: number;
    unusualTimingThreshold: number;
  } {
    return {
      normalPromptLengthRange: this.NORMAL_PROMPT_LENGTH_RANGE,
      suspiciousPromptLength: this.SUSPICIOUS_PROMPT_LENGTH,
      rapidFireThreshold: this.RAPID_FIRE_THRESHOLD,
      unusualTimingThreshold: this.UNUSUAL_TIMING_THRESHOLD,
    };
  }
}