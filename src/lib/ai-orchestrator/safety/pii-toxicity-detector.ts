/**
 * PII & Toxicity Detection System
 *
 * Active detection and prevention of:
 * - Personally Identifiable Information (PII)
 * - Toxic content and hate speech
 * - Prompt injection attacks
 * - Sensitive data leakage
 */

import {
  PIIToken,
  SafetyCheckResult,
  SafetyViolation,
} from "./guardrails-service";

export interface PIIPattern {
  type: string;
  pattern: RegExp;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

export interface ToxicityPattern {
  type: string;
  keywords: string[];
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
}

export interface DetectionConfig {
  enablePII: boolean;
  enableToxicity: boolean;
  enablePromptInjection: boolean;
  strictMode: boolean;
  redactionMode: "MASK" | "REMOVE" | "REPLACE";
  confidenceThreshold: number;
}

/**
 * PII Detection Patterns
 */
export class PIIDetector {
  private readonly piiPatterns: PIIPattern[] = [
    {
      type: "EMAIL",
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95,
      severity: "HIGH",
      description: "Email address detected",
    },
    {
      type: "PHONE_DE",
      pattern: /(?:\+49|0049|0)\s?(?:\d{2,4})\s?\d{6,8}/g,
      confidence: 0.9,
      severity: "HIGH",
      description: "German phone number detected",
    },
    {
      type: "PHONE_INTERNATIONAL",
      pattern: /\+\d{1,3}\s?\d{1,4}\s?\d{4,10}/g,
      confidence: 0.85,
      severity: "HIGH",
      description: "International phone number detected",
    },
    {
      type: "IBAN",
      pattern:
        /[A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?[\d{0,2}]/g,
      confidence: 0.95,
      severity: "CRITICAL",
      description: "IBAN bank account number detected",
    },
    {
      type: "CREDIT_CARD",
      pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      confidence: 0.8,
      severity: "CRITICAL",
      description: "Credit card number detected",
    },
    {
      type: "SSN_US",
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      confidence: 0.9,
      severity: "CRITICAL",
      description: "US Social Security Number detected",
    },
    {
      type: "GERMAN_ID",
      pattern: /\b\d{10,11}\b/g,
      confidence: 0.6,
      severity: "MEDIUM",
      description: "Potential German ID number detected",
    },
    {
      type: "ADDRESS",
      pattern:
        /\b\d{1,5}\s+[\w\s]+(?:str|straße|street|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl)\b/gi,
      confidence: 0.7,
      severity: "MEDIUM",
      description: "Street address detected",
    },
    {
      type: "POSTAL_CODE_DE",
      pattern: /\b\d{5}\b/g,
      confidence: 0.6,
      severity: "LOW",
      description: "German postal code detected",
    },
    {
      type: "IP_ADDRESS",
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      confidence: 0.8,
      severity: "MEDIUM",
      description: "IP address detected",
    },
  ];

  detectPII(text: string): PIIToken[] {
    const tokens: PIIToken[] = [];
    let tokenId = 1;

    for (const pattern of this.piiPatterns) {
      const matches = Array.from(text.matchAll(pattern.pattern));

      for (const match of matches) {
        if (match.index !== undefined) {
          tokens.push({
            id: `pii-${tokenId++}`,
            type: pattern.type,
            originalText: match[0],
            confidence: pattern.confidence,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      }
    }

    return tokens;
  }

  redactPII(
    text: string,
    mode: "MASK" | "REMOVE" | "REPLACE" = "MASK"
  ): string {
    let redactedText = text;
    const tokens = this.detectPII(text);

    // Sort by position (descending) to avoid index shifting
    tokens.sort((a, b) => b.position.start - a.position.start);

    for (const token of tokens) {
      const { start, end } = token.position;
      const originalText = redactedText.substring(start, end);

      let replacement: string;
      switch (mode) {
        case "MASK":
          replacement = "*".repeat(Math.min(originalText.length, 8));
          break;
        case "REMOVE":
          replacement = "";
          break;
        case "REPLACE":
          replacement = `[${token.type}]`;
          break;
      }

      redactedText =
        redactedText.substring(0, start) +
        replacement +
        redactedText.substring(end);
    }

    return redactedText;
  }
}

/**
 * Toxicity Detection System
 */
export class ToxicityDetector {
  private readonly toxicityPatterns: ToxicityPattern[] = [
    {
      type: "HATE_SPEECH",
      keywords: ["nazi", "hitler", "holocaust", "genocide", "ethnic cleansing"],
      confidence: 0.95,
      severity: "CRITICAL",
      description: "Hate speech content detected",
    },
    {
      type: "PROFANITY",
      keywords: ["fuck", "shit", "damn", "bitch", "asshole", "bastard"],
      confidence: 0.8,
      severity: "MEDIUM",
      description: "Profanity detected",
    },
    {
      type: "VIOLENCE",
      keywords: [
        "kill",
        "murder",
        "violence",
        "attack",
        "harm",
        "hurt",
        "destroy",
      ],
      confidence: 0.7,
      severity: "HIGH",
      description: "Violent content detected",
    },
    {
      type: "DISCRIMINATION",
      keywords: ["racist", "sexist", "homophobic", "transphobic", "xenophobic"],
      confidence: 0.9,
      severity: "HIGH",
      description: "Discriminatory content detected",
    },
    {
      type: "SEXUAL_EXPLICIT",
      keywords: ["porn", "sex", "nude", "naked", "explicit"],
      confidence: 0.75,
      severity: "HIGH",
      description: "Sexually explicit content detected",
    },
  ];

  detectToxicity(text: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const textLower = text.toLowerCase();

    for (const pattern of this.toxicityPatterns) {
      for (const keyword of pattern.keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          violations.push({
            type: "TOXICITY",
            severity: pattern.severity,
            confidence: pattern.confidence,
            details: `${pattern.description}: "${keyword}" detected`,
            position: {
              start: textLower.indexOf(keyword.toLowerCase()),
              end: textLower.indexOf(keyword.toLowerCase()) + keyword.length,
            },
          });
        }
      }
    }

    return violations;
  }

  calculateToxicityScore(text: string): number {
    const violations = this.detectToxicity(text);
    if (violations.length === 0) return 0;

    const totalScore = violations.reduce((sum, violation) => {
      const severityWeight = {
        LOW: 0.25,
        MEDIUM: 0.5,
        HIGH: 0.75,
        CRITICAL: 1.0,
      }[violation.severity];

      return sum + violation.confidence * severityWeight;
    }, 0);

    return Math.min(totalScore / violations.length, 1.0);
  }
}

/**
 * Prompt Injection Detection
 */
export class PromptInjectionDetector {
  private readonly injectionPatterns = [
    /ignore\s+(?:all\s+)?(?:previous\s+)?instructions?/gi,
    /forget\s+(?:everything|all)\s+(?:above|before)/gi,
    /system\s*:\s*you\s+are\s+now/gi,
    /\[system\]/gi,
    /\{\{.*\}\}/g,
    /<%.*%>/g,
    /<script.*<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi,
  ];

  detectPromptInjection(text: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const pattern of this.injectionPatterns) {
      const matches = Array.from(text.matchAll(pattern));

      for (const match of matches) {
        if (match.index !== undefined) {
          violations.push({
            type: "CUSTOM",
            severity: "HIGH",
            confidence: 0.8,
            details: `Potential prompt injection detected: "${match[0]}"`,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
          });
        }
      }
    }

    return violations;
  }
}

/**
 * Comprehensive PII & Toxicity Detection Service
 */
export class PIIToxicityDetectionService {
  private piiDetector: PIIDetector;
  private toxicityDetector: ToxicityDetector;
  private promptInjectionDetector: PromptInjectionDetector;
  private config: DetectionConfig;

  constructor(config: Partial<DetectionConfig> = {}) {
    this.piiDetector = new PIIDetector();
    this.toxicityDetector = new ToxicityDetector();
    this.promptInjectionDetector = new PromptInjectionDetector();

    this.config = {
      enablePII: true,
      enableToxicity: true,
      enablePromptInjection: true,
      strictMode: false,
      redactionMode: "MASK",
      confidenceThreshold: 0.7,
      ...config,
    };
  }

  async performSafetyCheck(
    content: string,
    requestId?: string
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();
    const violations: SafetyViolation[] = [];
    let modifiedContent = content;
    let allowed = true;

    try {
      // PII Detection
      if (this.config.enablePII) {
        const piiTokens = this.piiDetector.detectPII(content);

        for (const token of piiTokens) {
          if (token.confidence >= this.config.confidenceThreshold) {
            violations.push({
              type: "PII",
              severity: this.getSeverityFromConfidence(token.confidence),
              confidence: token.confidence,
              details: `PII detected: ${token.type}`,
              position: token.position,
            });

            if (this.config.strictMode || token.confidence >= 0.9) {
              allowed = false;
            }
          }
        }

        // Redact PII if violations found
        if (piiTokens.length > 0) {
          modifiedContent = this.piiDetector.redactPII(
            content,
            this.config.redactionMode
          );
        }
      }

      // Toxicity Detection
      if (this.config.enableToxicity) {
        const toxicityViolations =
          this.toxicityDetector.detectToxicity(content);
        violations.push(...toxicityViolations);

        const toxicityScore =
          this.toxicityDetector.calculateToxicityScore(content);
        if (
          toxicityScore >= this.config.confidenceThreshold ||
          toxicityViolations.length > 0
        ) {
          allowed = false;
        }
      }

      // Prompt Injection Detection
      if (this.config.enablePromptInjection) {
        const injectionViolations =
          this.promptInjectionDetector.detectPromptInjection(content);
        violations.push(...injectionViolations);

        if (injectionViolations.length > 0 && this.config.strictMode) {
          allowed = false;
        }
      }

      // Calculate overall confidence
      const confidence =
        violations.length > 0
          ? 1 -
            violations.reduce((sum, v) => sum + v.confidence, 0) /
              violations.length
          : 1.0;

      return {
        allowed,
        confidence,
        violations,
        modifiedContent:
          modifiedContent !== content ? modifiedContent : undefined,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("PII/Toxicity detection error:", error);

      return {
        allowed: false,
        confidence: 0.0,
        violations: [
          {
            type: "CUSTOM",
            severity: "CRITICAL",
            confidence: 1.0,
            details: `Detection service error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private getSeverityFromConfidence(
    confidence: number
  ): SafetyViolation["severity"] {
    if (confidence >= 0.9) return "CRITICAL";
    if (confidence >= 0.8) return "HIGH";
    if (confidence >= 0.6) return "MEDIUM";
    return "LOW";
  }

  updateConfig(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  // Test methods for validation
  testPIIDetection(text: string): PIIToken[] {
    return this.piiDetector.detectPII(text);
  }

  testToxicityDetection(text: string): SafetyViolation[] {
    return this.toxicityDetector.detectToxicity(text);
  }

  testPromptInjectionDetection(text: string): SafetyViolation[] {
    return this.promptInjectionDetector.detectPromptInjection(text);
  }
}

// Export singleton instance
export const piiToxicityDetector = new PIIToxicityDetectionService();
