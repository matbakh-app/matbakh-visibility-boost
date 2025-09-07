/**
 * Threat Detection Engine
 * Core engine for detecting security threats in AI prompts and outputs
 */
import { 
  ThreatDetectionRequest, 
  ThreatDetectionResult, 
  ThreatIssue, 
  ThreatLevel, 
  ThreatType,
  ResponseAction,
  ThreatPattern,
  BehavioralAnalysis,
  MLDetectionResult,
  ThreatDetectionConfig 
} from './types';
import { StaticAnalysisEngine } from './static-analysis-engine';
import { BehavioralAnalysisEngine } from './behavioral-analysis-engine';
import { MLDetectionModule } from './ml-detection-module';
import { RiskClassifier } from './risk-classifier';

export class ThreatDetectionEngine {
  private staticAnalysis: StaticAnalysisEngine;
  private behavioralAnalysis: BehavioralAnalysisEngine;
  private mlDetection: MLDetectionModule;
  private riskClassifier: RiskClassifier;
  private config: ThreatDetectionConfig;

  constructor(config: ThreatDetectionConfig) {
    this.config = config;
    this.staticAnalysis = new StaticAnalysisEngine(config.patterns);
    this.behavioralAnalysis = new BehavioralAnalysisEngine();
    this.mlDetection = new MLDetectionModule();
    this.riskClassifier = new RiskClassifier(config.thresholds);
  }

  /**
   * Main threat detection method
   */
  async detectThreats(request: ThreatDetectionRequest): Promise<ThreatDetectionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting threat detection for prompt ${request.promptId}`);

      // Check if detection is enabled
      if (!this.config.enabled) {
        return this.createSafeResult(request, startTime);
      }

      // Check whitelist
      if (this.isWhitelisted(request)) {
        console.log(`Request ${request.promptId} is whitelisted`);
        return this.createSafeResult(request, startTime);
      }

      // Check blacklist
      if (this.isBlacklisted(request)) {
        console.log(`Request ${request.promptId} is blacklisted`);
        return this.createBlockedResult(request, startTime, 'Blacklisted user or pattern');
      }

      const threats: ThreatIssue[] = [];

      // 1. Static Analysis - Pattern matching and rule-based detection
      console.log('Running static analysis...');
      const staticThreats = await this.staticAnalysis.analyze(request.prompt, request.output);
      threats.push(...staticThreats);

      // 2. Behavioral Analysis - Analyze usage patterns and anomalies
      if (this.config.behavioralAnalysisEnabled) {
        console.log('Running behavioral analysis...');
        const behavioralResult = await this.behavioralAnalysis.analyze(request);
        const behavioralThreats = this.convertBehavioralToThreats(behavioralResult);
        threats.push(...behavioralThreats);
      }

      // 3. ML Detection - Machine learning based threat detection
      if (this.config.mlDetectionEnabled) {
        console.log('Running ML detection...');
        const mlResults = await this.mlDetection.detect(request.prompt, request.output, request.metadata);
        const mlThreats = this.convertMLToThreats(mlResults);
        threats.push(...mlThreats);
      }

      // 4. Risk Classification - Determine overall risk level and response
      const riskResult = this.riskClassifier.classify(threats, request);
      
      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(threats, riskResult.threatLevel);

      const result: ThreatDetectionResult = {
        promptId: request.promptId,
        threatLevel: riskResult.threatLevel,
        overallScore: riskResult.score,
        threats,
        responseAction: this.determineResponseAction(riskResult.threatLevel),
        recommendations,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      console.log(`Threat detection completed for ${request.promptId}: ${result.threatLevel} (${threats.length} threats)`);
      return result;

    } catch (error) {
      console.error(`Threat detection failed for ${request.promptId}:`, error);
      
      // Return safe result on error to avoid blocking legitimate requests
      return {
        promptId: request.promptId,
        threatLevel: 'low',
        overallScore: 0,
        threats: [{
          type: 'anomalous_behavior',
          severity: 'low',
          confidence: 0.5,
          description: 'Threat detection system error - defaulting to safe mode',
          evidence: [error instanceof Error ? error.message : 'Unknown error'],
        }],
        responseAction: 'log',
        recommendations: ['Review threat detection system logs', 'Consider manual review if suspicious'],
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update threat patterns
   */
  async updatePatterns(patterns: ThreatPattern[]): Promise<void> {
    console.log(`Updating ${patterns.length} threat patterns`);
    this.config.patterns = patterns;
    await this.staticAnalysis.updatePatterns(patterns);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ThreatDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Threat detection configuration updated');
  }

  /**
   * Get detection statistics
   */
  getStats(): Record<string, any> {
    return {
      patternsLoaded: this.config.patterns.length,
      enabledPatterns: this.config.patterns.filter(p => p.enabled).length,
      mlModelsLoaded: this.mlDetection.getLoadedModels(),
      configLastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Private helper methods
   */
  private createSafeResult(request: ThreatDetectionRequest, startTime: number): ThreatDetectionResult {
    return {
      promptId: request.promptId,
      threatLevel: 'low',
      overallScore: 0,
      threats: [],
      responseAction: 'allow',
      recommendations: [],
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  private createBlockedResult(request: ThreatDetectionRequest, startTime: number, reason: string): ThreatDetectionResult {
    return {
      promptId: request.promptId,
      threatLevel: 'critical',
      overallScore: 100,
      threats: [{
        type: 'unauthorized_access',
        severity: 'critical',
        confidence: 1.0,
        description: reason,
        evidence: ['Blacklist match'],
      }],
      responseAction: 'block',
      recommendations: ['Contact administrator', 'Review access permissions'],
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  private isWhitelisted(request: ThreatDetectionRequest): boolean {
    const { whitelist } = this.config;
    
    // Check user whitelist
    if (whitelist.users.includes(request.userId)) {
      return true;
    }

    // Check template whitelist
    if (request.templateId && whitelist.templates.includes(request.templateId)) {
      return true;
    }

    // Check pattern whitelist
    for (const pattern of whitelist.patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(request.prompt)) {
        return true;
      }
    }

    return false;
  }

  private isBlacklisted(request: ThreatDetectionRequest): boolean {
    const { blacklist } = this.config;
    
    // Check user blacklist
    if (blacklist.users.includes(request.userId)) {
      return true;
    }

    // Check pattern blacklist
    for (const pattern of blacklist.patterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(request.prompt)) {
        return true;
      }
    }

    // Check keyword blacklist
    const promptLower = request.prompt.toLowerCase();
    for (const keyword of blacklist.keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private convertBehavioralToThreats(behavioral: BehavioralAnalysis): ThreatIssue[] {
    const threats: ThreatIssue[] = [];

    if (behavioral.tokenUsageAnomaly) {
      threats.push({
        type: 'token_abuse',
        severity: 'medium',
        confidence: 0.7,
        description: 'Unusual token usage pattern detected',
        evidence: [`Token usage anomaly detected`],
        mitigation: 'Monitor token usage patterns',
      });
    }

    if (behavioral.responseTimeAnomaly) {
      threats.push({
        type: 'anomalous_behavior',
        severity: 'low',
        confidence: 0.6,
        description: 'Unusual response time pattern',
        evidence: [`Response time anomaly detected`],
      });
    }

    if (behavioral.frequencyAnomaly) {
      threats.push({
        type: 'rate_limit_violation',
        severity: 'medium',
        confidence: 0.8,
        description: 'Unusual request frequency detected',
        evidence: [`Frequency anomaly detected`],
        mitigation: 'Implement rate limiting',
      });
    }

    if (behavioral.userBehaviorScore > 0.8) {
      threats.push({
        type: 'anomalous_behavior',
        severity: 'high',
        confidence: behavioral.userBehaviorScore,
        description: 'High-risk user behavior pattern',
        evidence: [`User behavior score: ${behavioral.userBehaviorScore}`],
        mitigation: 'Review user activity and consider restrictions',
      });
    }

    return threats;
  }

  private convertMLToThreats(mlResults: MLDetectionResult[]): ThreatIssue[] {
    const threats: ThreatIssue[] = [];

    for (const result of mlResults) {
      if (result.prediction === 'malicious' || result.prediction === 'suspicious') {
        const severity: ThreatLevel = result.prediction === 'malicious' ? 'high' : 'medium';
        
        threats.push({
          type: 'model_manipulation',
          severity,
          confidence: result.confidence,
          description: `ML model detected ${result.prediction} content`,
          evidence: [
            `Model: ${result.modelName}`,
            `Confidence: ${result.confidence}`,
            ...(result.explanation ? [result.explanation] : [])
          ],
          mitigation: 'Review content and consider blocking',
        });
      }
    }

    return threats;
  }

  private determineResponseAction(threatLevel: ThreatLevel): ResponseAction {
    return this.config.responseActions[threatLevel] || 'log';
  }

  private generateRecommendations(threats: ThreatIssue[], threatLevel: ThreatLevel): string[] {
    const recommendations: string[] = [];

    // General recommendations based on threat level
    switch (threatLevel) {
      case 'critical':
        recommendations.push('Immediate action required - block request');
        recommendations.push('Escalate to security team');
        recommendations.push('Review user access permissions');
        break;
      case 'high':
        recommendations.push('Quarantine request for manual review');
        recommendations.push('Monitor user activity closely');
        break;
      case 'medium':
        recommendations.push('Log incident for analysis');
        recommendations.push('Consider additional monitoring');
        break;
      case 'low':
        recommendations.push('Continue monitoring');
        break;
    }

    // Specific recommendations based on threat types
    const threatTypes = new Set(threats.map(t => t.type));

    if (threatTypes.has('prompt_injection')) {
      recommendations.push('Implement input sanitization');
      recommendations.push('Review prompt templates for vulnerabilities');
    }

    if (threatTypes.has('prompt_leak')) {
      recommendations.push('Audit system prompts for sensitive information');
      recommendations.push('Implement output filtering');
    }

    if (threatTypes.has('jailbreak_attempt')) {
      recommendations.push('Update jailbreak detection patterns');
      recommendations.push('Consider stricter content policies');
    }

    if (threatTypes.has('pii_exposure')) {
      recommendations.push('Implement PII detection and redaction');
      recommendations.push('Review data handling procedures');
    }

    if (threatTypes.has('token_abuse')) {
      recommendations.push('Implement rate limiting');
      recommendations.push('Monitor token usage patterns');
    }

    // Remove duplicates and return
    return [...new Set(recommendations)];
  }
}