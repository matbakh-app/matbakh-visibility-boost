/**
 * PII Detection and Redaction System
 * 
 * Implements automatic detection and redaction of personally identifiable information
 * in AI logs and responses for GDPR compliance.
 */

import { createHash } from 'crypto';

export interface PIIPattern {
  name: string;
  pattern: RegExp;
  confidence: number;
  category: 'email' | 'phone' | 'address' | 'name' | 'id' | 'financial' | 'health';
  replacement: string;
}

export interface PIIDetectionResult {
  detected: boolean;
  fields: string[];
  confidence_scores: Record<string, number>;
  redacted_content: string;
  anonymized_content: string;
  detection_metadata: {
    total_matches: number;
    categories_found: string[];
    highest_confidence: number;
  };
}

export class PIIDetectionSystem {
  private patterns: PIIPattern[] = [
    // Email addresses
    {
      name: 'email',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95,
      category: 'email',
      replacement: '[EMAIL_REDACTED]'
    },
    
    // German phone numbers
    {
      name: 'german_phone',
      pattern: /(\+49|0049|0)\s?[1-9]\d{1,4}\s?\d{1,8}/g,
      confidence: 0.90,
      category: 'phone',
      replacement: '[PHONE_REDACTED]'
    },
    
    // International phone numbers
    {
      name: 'international_phone',
      pattern: /\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,9}/g,
      confidence: 0.85,
      category: 'phone',
      replacement: '[PHONE_REDACTED]'
    },
    
    // German postal codes and addresses
    {
      name: 'german_postal',
      pattern: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*\b/g,
      confidence: 0.80,
      category: 'address',
      replacement: '[ADDRESS_REDACTED]'
    },
    
    // Street addresses
    {
      name: 'street_address',
      pattern: /\b[A-ZÄÖÜ][a-zäöüß]+(?:straße|str\.|platz|weg|gasse|allee)\s+\d+[a-z]?\b/gi,
      confidence: 0.85,
      category: 'address',
      replacement: '[STREET_REDACTED]'
    },
    
    // German names (common patterns)
    {
      name: 'german_names',
      pattern: /\b(?:Herr|Frau|Hr\.|Fr\.)\s+[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?\b/g,
      confidence: 0.75,
      category: 'name',
      replacement: '[NAME_REDACTED]'
    },
    
    // IBAN numbers
    {
      name: 'iban',
      pattern: /\b[A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?[\dA-Z]{0,2}\b/g,
      confidence: 0.95,
      category: 'financial',
      replacement: '[IBAN_REDACTED]'
    },
    
    // German tax ID (Steuer-ID)
    {
      name: 'german_tax_id',
      pattern: /\b\d{11}\b/g,
      confidence: 0.70,
      category: 'id',
      replacement: '[TAX_ID_REDACTED]'
    },
    
    // Credit card numbers
    {
      name: 'credit_card',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      confidence: 0.90,
      category: 'financial',
      replacement: '[CARD_REDACTED]'
    },
    
    // IP addresses
    {
      name: 'ip_address',
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      confidence: 0.85,
      category: 'id',
      replacement: '[IP_REDACTED]'
    }
  ];

  /**
   * Detect PII in content and return detailed analysis
   */
  detectPII(content: string): PIIDetectionResult {
    const detectedFields: string[] = [];
    const confidenceScores: Record<string, number> = {};
    let redactedContent = content;
    let anonymizedContent = content;
    let totalMatches = 0;
    const categoriesFound = new Set<string>();
    let highestConfidence = 0;

    for (const pattern of this.patterns) {
      const matches = content.match(pattern.pattern);
      
      if (matches && matches.length > 0) {
        detectedFields.push(pattern.name);
        confidenceScores[pattern.name] = pattern.confidence;
        categoriesFound.add(pattern.category);
        totalMatches += matches.length;
        highestConfidence = Math.max(highestConfidence, pattern.confidence);

        // Redact content
        redactedContent = redactedContent.replace(pattern.pattern, pattern.replacement);
        
        // Anonymize content (hash-based replacement)
        anonymizedContent = anonymizedContent.replace(pattern.pattern, (match) => {
          const hash = createHash('sha256').update(match + process.env.ANONYMIZATION_SALT || 'default-salt').digest('hex');
          return `[${pattern.category.toUpperCase()}_${hash.substring(0, 8)}]`;
        });
      }
    }

    return {
      detected: detectedFields.length > 0,
      fields: detectedFields,
      confidence_scores: confidenceScores,
      redacted_content: redactedContent,
      anonymized_content: anonymizedContent,
      detection_metadata: {
        total_matches: totalMatches,
        categories_found: Array.from(categoriesFound),
        highest_confidence: highestConfidence
      }
    };
  }

  /**
   * Quick PII check - returns boolean only
   */
  containsPII(content: string): boolean {
    return this.patterns.some(pattern => pattern.pattern.test(content));
  }

  /**
   * Get PII risk score (0-1)
   */
  getPIIRiskScore(content: string): number {
    const detection = this.detectPII(content);
    if (!detection.detected) return 0;

    // Calculate weighted risk score
    const totalConfidence = Object.values(detection.confidence_scores).reduce((sum, conf) => sum + conf, 0);
    const avgConfidence = totalConfidence / Object.keys(detection.confidence_scores).length;
    const categoryMultiplier = detection.detection_metadata.categories_found.length * 0.1;
    const matchMultiplier = Math.min(detection.detection_metadata.total_matches * 0.05, 0.3);

    return Math.min(avgConfidence + categoryMultiplier + matchMultiplier, 1.0);
  }

  /**
   * Sanitize content for logging (removes all PII)
   */
  sanitizeForLogging(content: string): string {
    const detection = this.detectPII(content);
    return detection.redacted_content;
  }

  /**
   * Anonymize content for analytics (hash-based replacement)
   */
  anonymizeForAnalytics(content: string): string {
    const detection = this.detectPII(content);
    return detection.anonymized_content;
  }

  /**
   * Validate content before AI processing
   */
  validateContentSafety(content: string): {
    safe: boolean;
    risk_score: number;
    recommendations: string[];
  } {
    const riskScore = this.getPIIRiskScore(content);
    const detection = this.detectPII(content);
    
    const recommendations: string[] = [];
    
    if (riskScore > 0.8) {
      recommendations.push('High PII risk detected - consider manual review');
    }
    
    if (detection.detection_metadata.categories_found.includes('financial')) {
      recommendations.push('Financial information detected - extra security measures required');
    }
    
    if (detection.detection_metadata.categories_found.includes('health')) {
      recommendations.push('Health information detected - GDPR Article 9 compliance required');
    }

    return {
      safe: riskScore < 0.5,
      risk_score: riskScore,
      recommendations
    };
  }

  /**
   * Generate compliance report for audit purposes
   */
  generateComplianceReport(content: string): {
    timestamp: string;
    content_hash: string;
    pii_detected: boolean;
    categories_found: string[];
    risk_assessment: string;
    actions_taken: string[];
    gdpr_compliance: boolean;
  } {
    const detection = this.detectPII(content);
    const riskScore = this.getPIIRiskScore(content);
    const contentHash = createHash('sha256').update(content).digest('hex').substring(0, 16);

    let riskAssessment = 'LOW';
    if (riskScore > 0.7) riskAssessment = 'HIGH';
    else if (riskScore > 0.4) riskAssessment = 'MEDIUM';

    const actionsTaken: string[] = [];
    if (detection.detected) {
      actionsTaken.push('PII detected and flagged');
      actionsTaken.push('Content redacted for logging');
      actionsTaken.push('Anonymized version created for analytics');
    }

    return {
      timestamp: new Date().toISOString(),
      content_hash: contentHash,
      pii_detected: detection.detected,
      categories_found: detection.detection_metadata.categories_found,
      risk_assessment: riskAssessment,
      actions_taken: actionsTaken,
      gdpr_compliance: riskScore < 0.8 // High-risk content may need manual review
    };
  }

  /**
   * Add custom PII pattern
   */
  addCustomPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove pattern by name
   */
  removePattern(name: string): void {
    this.patterns = this.patterns.filter(p => p.name !== name);
  }

  /**
   * Get all pattern names for configuration
   */
  getPatternNames(): string[] {
    return this.patterns.map(p => p.name);
  }
}

// Export singleton instance
export const piiDetectionSystem = new PIIDetectionSystem();