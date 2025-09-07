/**
 * Risk Classifier
 * Classifies and scores threats based on multiple factors
 */
import { 
  DetectedThreat, 
  ThreatDetectionRequest, 
  ThreatLevel, 
  ThreatSeverity,
  UserRiskProfile 
} from './types';

export class RiskClassifier {
  private readonly SEVERITY_WEIGHTS = {
    'info': 0.1,
    'low': 0.3,
    'medium': 0.6,
    'high': 0.8,
    'critical': 1.0,
  };

  private readonly THREAT_TYPE_WEIGHTS = {
    'prompt_injection': 0.9,
    'prompt_leak': 0.7,
    'jailbreak_attempt': 0.95,
    'hallucination_risk': 0.4,
    'anomalous_behavior': 0.5,
    'sensitive_data_exposure': 1.0,
    'malicious_content': 0.8,
    'social_engineering': 0.7,
    'data_exfiltration': 0.95,
    'model_manipulation': 0.6,
  };

  /**
   * Classify threats and calculate risk score
   */
  classify(threats: DetectedThreat[], request: ThreatDetectionRequest): {
    riskScore: number;
    threatLevel: ThreatLevel;
    confidence: number;
  } {
    if (threats.length === 0) {
      return {
        riskScore: 0,
        threatLevel: 'low',
        confidence: 1.0,
      };
    }

    // Calculate base risk score from threats
    const baseRiskScore = this.calculateBaseRiskScore(threats);
    
    // Apply contextual adjustments
    const contextualRiskScore = this.applyContextualAdjustments(baseRiskScore, request);
    
    // Apply user risk profile adjustments
    const finalRiskScore = this.applyUserRiskAdjustments(contextualRiskScore, request.context?.riskProfile);
    
    // Determine threat level
    const threatLevel = this.determineThreatLevel(finalRiskScore);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(threats);

    return {
      riskScore: Math.min(100, Math.max(0, finalRiskScore)),
      threatLevel,
      confidence: Math.min(1.0, Math.max(0.0, confidence)),
    };
  }

  /**
   * Calculate base risk score from detected threats
   */
  private calculateBaseRiskScore(threats: DetectedThreat[]): number {
    let totalScore = 0;
    let maxSeverityScore = 0;
    let threatTypeMultiplier = 1.0;

    for (const threat of threats) {
      // Get severity weight
      const severityWeight = this.SEVERITY_WEIGHTS[threat.severity];
      
      // Get threat type weight
      const typeWeight = this.THREAT_TYPE_WEIGHTS[threat.type] || 0.5;
      
      // Calculate threat score (severity * type weight * confidence)
      const threatScore = severityWeight * typeWeight * threat.confidence * 100;
      
      totalScore += threatScore;
      maxSeverityScore = Math.max(maxSeverityScore, threatScore);
      
      // Increase multiplier for high-impact threat types
      if (typeWeight >= 0.9) {
        threatTypeMultiplier *= 1.2;
      }
    }

    // Use a combination of total score and max severity
    // This prevents many low-severity threats from overwhelming one critical threat
    const combinedScore = (totalScore * 0.6) + (maxSeverityScore * 0.4);
    
    // Apply threat type multiplier
    return combinedScore * threatTypeMultiplier;
  }

  /**
   * Apply contextual adjustments based on request context
   */
  private applyContextualAdjustments(baseScore: number, request: ThreatDetectionRequest): number {
    let adjustedScore = baseScore;
    let multiplier = 1.0;

    // Environment-based adjustments
    if (request.context?.environment === 'production') {
      multiplier *= 1.2; // Higher risk in production
    } else if (request.context?.environment === 'development') {
      multiplier *= 0.8; // Lower risk in development
    }

    // Time-based adjustments
    if (request.metadata?.timestamp) {
      const requestTime = new Date(request.metadata.timestamp);
      const hour = requestTime.getHours();
      
      // Higher risk during off-hours (11 PM - 6 AM)
      if (hour >= 23 || hour <= 6) {
        multiplier *= 1.1;
      }
      
      // Weekend adjustments
      const dayOfWeek = requestTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier *= 1.05;
      }
    }

    // AI model parameter adjustments
    if (request.metadata) {
      // High temperature might indicate attempt to get unpredictable responses
      if (request.metadata.temperature && request.metadata.temperature > 1.0) {
        multiplier *= 1.1;
      }
      
      // Very high token limits might indicate data extraction attempts
      if (request.metadata.maxTokens && request.metadata.maxTokens > 4000) {
        multiplier *= 1.05;
      }
    }

    // Prompt length adjustments
    if (request.prompt.length > 5000) {
      multiplier *= 1.15; // Very long prompts are suspicious
    } else if (request.prompt.length < 10) {
      multiplier *= 1.1; // Very short prompts might be probing
    }

    // Conversation history adjustments
    if (request.context?.conversationHistory) {
      const historyLength = request.context.conversationHistory.length;
      if (historyLength > 20) {
        multiplier *= 1.1; // Long conversations might be persistence attacks
      }
    }

    return adjustedScore * multiplier;
  }

  /**
   * Apply user risk profile adjustments
   */
  private applyUserRiskAdjustments(contextualScore: number, riskProfile?: UserRiskProfile): number {
    if (!riskProfile) {
      return contextualScore;
    }

    let multiplier = 1.0;

    // Risk level adjustments
    switch (riskProfile.riskLevel) {
      case 'high':
        multiplier *= 1.5;
        break;
      case 'medium':
        multiplier *= 1.2;
        break;
      case 'low':
        multiplier *= 0.9;
        break;
    }

    // Trust score adjustments
    if (riskProfile.trustScore < 0.3) {
      multiplier *= 1.4;
    } else if (riskProfile.trustScore < 0.6) {
      multiplier *= 1.2;
    } else if (riskProfile.trustScore > 0.8) {
      multiplier *= 0.9;
    }

    // Previous violations adjustments
    if (riskProfile.previousViolations > 0) {
      multiplier *= 1.0 + (riskProfile.previousViolations * 0.1);
    }

    // Account age adjustments (newer accounts are riskier)
    if (riskProfile.accountAge < 7) {
      multiplier *= 1.3; // Very new account
    } else if (riskProfile.accountAge < 30) {
      multiplier *= 1.1; // New account
    } else if (riskProfile.accountAge > 365) {
      multiplier *= 0.95; // Established account
    }

    // Verification status adjustments
    if (!riskProfile.verificationStatus) {
      multiplier *= 1.2;
    }

    return contextualScore * multiplier;
  }

  /**
   * Determine threat level from risk score
   */
  private determineThreatLevel(riskScore: number): ThreatLevel {
    if (riskScore >= 80) {
      return 'critical';
    } else if (riskScore >= 60) {
      return 'high';
    } else if (riskScore >= 30) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate overall confidence from individual threat confidences
   */
  private calculateOverallConfidence(threats: DetectedThreat[]): number {
    if (threats.length === 0) {
      return 1.0;
    }

    // Use weighted average of confidences, with higher severity threats having more weight
    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    for (const threat of threats) {
      const weight = this.SEVERITY_WEIGHTS[threat.severity];
      totalWeightedConfidence += threat.confidence * weight;
      totalWeight += weight;
    }

    const averageConfidence = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;
    
    // Adjust confidence based on number of threats
    // More threats generally increase confidence in the assessment
    const threatCountFactor = Math.min(1.2, 1.0 + (threats.length * 0.05));
    
    return Math.min(1.0, averageConfidence * threatCountFactor);
  }

  /**
   * Get detailed risk analysis
   */
  getDetailedAnalysis(threats: DetectedThreat[], request: ThreatDetectionRequest): {
    riskScore: number;
    threatLevel: ThreatLevel;
    confidence: number;
    breakdown: {
      baseScore: number;
      contextualAdjustments: number;
      userRiskAdjustments: number;
      finalScore: number;
    };
    threatSummary: {
      totalThreats: number;
      threatsBySeverity: Record<ThreatSeverity, number>;
      threatsByType: Record<string, number>;
      highestSeverity: ThreatSeverity;
      averageConfidence: number;
    };
    riskFactors: string[];
  } {
    const baseScore = this.calculateBaseRiskScore(threats);
    const contextualScore = this.applyContextualAdjustments(baseScore, request);
    const finalScore = this.applyUserRiskAdjustments(contextualScore, request.context?.riskProfile);
    
    const classification = this.classify(threats, request);
    
    // Calculate threat summary
    const threatsBySeverity: Record<ThreatSeverity, number> = {
      'info': 0, 'low': 0, 'medium': 0, 'high': 0, 'critical': 0
    };
    const threatsByType: Record<string, number> = {};
    
    let highestSeverity: ThreatSeverity = 'info';
    let totalConfidence = 0;
    
    for (const threat of threats) {
      threatsBySeverity[threat.severity]++;
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
      
      if (this.SEVERITY_WEIGHTS[threat.severity] > this.SEVERITY_WEIGHTS[highestSeverity]) {
        highestSeverity = threat.severity;
      }
      
      totalConfidence += threat.confidence;
    }
    
    const averageConfidence = threats.length > 0 ? totalConfidence / threats.length : 0;
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(threats, request);

    return {
      riskScore: classification.riskScore,
      threatLevel: classification.threatLevel,
      confidence: classification.confidence,
      breakdown: {
        baseScore,
        contextualAdjustments: contextualScore - baseScore,
        userRiskAdjustments: finalScore - contextualScore,
        finalScore,
      },
      threatSummary: {
        totalThreats: threats.length,
        threatsBySeverity,
        threatsByType,
        highestSeverity,
        averageConfidence,
      },
      riskFactors,
    };
  }

  /**
   * Identify specific risk factors
   */
  private identifyRiskFactors(threats: DetectedThreat[], request: ThreatDetectionRequest): string[] {
    const factors: string[] = [];

    // Threat-based factors
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    if (criticalThreats.length > 0) {
      factors.push(`${criticalThreats.length} critical threat(s) detected`);
    }

    const highThreats = threats.filter(t => t.severity === 'high');
    if (highThreats.length > 2) {
      factors.push(`Multiple high-severity threats (${highThreats.length})`);
    }

    // Threat type factors
    const injectionThreats = threats.filter(t => t.type === 'prompt_injection');
    if (injectionThreats.length > 0) {
      factors.push('Prompt injection attempts detected');
    }

    const jailbreakThreats = threats.filter(t => t.type === 'jailbreak_attempt');
    if (jailbreakThreats.length > 0) {
      factors.push('Jailbreak attempts detected');
    }

    const dataThreats = threats.filter(t => t.type === 'sensitive_data_exposure');
    if (dataThreats.length > 0) {
      factors.push('Sensitive data exposure risk');
    }

    // Context-based factors
    if (request.context?.environment === 'production') {
      factors.push('Production environment');
    }

    if (request.prompt.length > 5000) {
      factors.push('Unusually long prompt');
    }

    if (request.metadata?.temperature && request.metadata.temperature > 1.0) {
      factors.push('High temperature setting');
    }

    // User risk factors
    if (request.context?.riskProfile) {
      const profile = request.context.riskProfile;
      
      if (profile.riskLevel === 'high') {
        factors.push('High-risk user profile');
      }
      
      if (profile.trustScore < 0.3) {
        factors.push('Low user trust score');
      }
      
      if (profile.previousViolations > 0) {
        factors.push(`Previous violations: ${profile.previousViolations}`);
      }
      
      if (profile.accountAge < 7) {
        factors.push('Very new user account');
      }
      
      if (!profile.verificationStatus) {
        factors.push('Unverified user account');
      }
    }

    // Time-based factors
    if (request.metadata?.timestamp) {
      const requestTime = new Date(request.metadata.timestamp);
      const hour = requestTime.getHours();
      
      if (hour >= 23 || hour <= 6) {
        factors.push('Off-hours request');
      }
    }

    return factors;
  }

  /**
   * Update classification parameters
   */
  updateParameters(params: {
    severityWeights?: Partial<Record<ThreatSeverity, number>>;
    threatTypeWeights?: Partial<Record<string, number>>;
  }): void {
    if (params.severityWeights) {
      Object.assign(this.SEVERITY_WEIGHTS, params.severityWeights);
    }
    
    if (params.threatTypeWeights) {
      Object.assign(this.THREAT_TYPE_WEIGHTS, params.threatTypeWeights);
    }
    
    console.log('Risk classifier parameters updated');
  }

  /**
   * Get current classification parameters
   */
  getParameters(): {
    severityWeights: Record<ThreatSeverity, number>;
    threatTypeWeights: Record<string, number>;
  } {
    return {
      severityWeights: { ...this.SEVERITY_WEIGHTS },
      threatTypeWeights: { ...this.THREAT_TYPE_WEIGHTS },
    };
  }

  /**
   * Validate risk score calculation
   */
  validateRiskScore(riskScore: number): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (riskScore < 0) {
      issues.push('Risk score is negative');
    }
    
    if (riskScore > 100) {
      issues.push('Risk score exceeds maximum (100)');
    }
    
    if (isNaN(riskScore)) {
      issues.push('Risk score is not a number');
    }
    
    if (!isFinite(riskScore)) {
      issues.push('Risk score is not finite');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}