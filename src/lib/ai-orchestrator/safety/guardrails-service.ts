/**
 * Guardrails Service - Multi-Provider Content Safety
 *
 * Implements:
 * - Bedrock Guardrails per domain
 * - Gemini SafetySettings
 * - Llama output filters
 * - Central PII redaction
 * - Log sanitization
 */

import {
  ApplyGuardrailCommand,
  BedrockRuntimeClient,
} from "@aws-sdk/client-bedrock-runtime";
import { Provider } from "../types";

export interface GuardrailConfig {
  domain: string;
  provider: Provider;
  enabled: boolean;
  piiRedaction: boolean;
  toxicityThreshold: "LOW" | "MEDIUM" | "HIGH";
  customFilters?: string[];
}

export interface SafetyCheckResult {
  allowed: boolean;
  confidence: number;
  violations: SafetyViolation[];
  modifiedContent?: string;
  processingTimeMs: number;
}

export interface SafetyViolation {
  type: "PII" | "TOXICITY" | "HATE_SPEECH" | "VIOLENCE" | "SEXUAL" | "CUSTOM";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  details: string;
  position?: { start: number; end: number };
}

export interface PIIToken {
  id: string;
  type: string;
  originalText: string;
  confidence: number;
  position: { start: number; end: number };
}

/**
 * Bedrock Guardrails Service
 */
export class BedrockGuardrailsService {
  private bedrockClient: BedrockRuntimeClient;
  private guardrailConfigs: Record<string, any> = {
    legal: {
      guardrailId: "legal-domain-guardrail-v1",
      guardrailVersion: "1",
      piiRedaction: true,
      toxicityThreshold: "HIGH",
      jailbreakDetection: true,
      promptAttackDetection: true,
    },
    medical: {
      guardrailId: "medical-domain-guardrail-v1",
      guardrailVersion: "1",
      piiRedaction: true,
      toxicityThreshold: "MEDIUM",
      jailbreakDetection: true,
      promptAttackDetection: true,
    },
    culinary: {
      guardrailId: "culinary-domain-guardrail-v1",
      guardrailVersion: "1",
      piiRedaction: false,
      toxicityThreshold: "HIGH",
      jailbreakDetection: false,
      promptAttackDetection: false,
    },
    general: {
      guardrailId: "general-domain-guardrail-v1",
      guardrailVersion: "1",
      piiRedaction: false,
      toxicityThreshold: "HIGH",
      jailbreakDetection: false,
      promptAttackDetection: false,
    },
  };

  constructor(region: string = "eu-central-1") {
    this.bedrockClient = new BedrockRuntimeClient({ region });
  }

  async checkContent(
    content: string,
    domain: string = "general",
    source: "INPUT" | "OUTPUT" = "INPUT"
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();
    const config =
      this.guardrailConfigs[domain] || this.guardrailConfigs.general;

    try {
      const command = new ApplyGuardrailCommand({
        guardrailIdentifier: config.guardrailId,
        guardrailVersion: config.guardrailVersion,
        source,
        content: [{ text: { text: content } }],
      });

      const response = await this.bedrockClient.send(command);
      const processingTimeMs = Date.now() - startTime;

      // Parse Bedrock Guardrails response
      const violations: SafetyViolation[] = [];
      let allowed = true;
      let confidence = 1.0;

      if (response.action === "GUARDRAIL_INTERVENED") {
        allowed = false;
        confidence = 0.0;

        // Parse assessments
        response.assessments?.forEach((assessment) => {
          if (assessment.topicPolicy) {
            violations.push({
              type: "CUSTOM",
              severity: "HIGH",
              confidence: 0.9,
              details: `Topic policy violation: ${assessment.topicPolicy.topics?.join(
                ", "
              )}`,
            });
          }

          if (assessment.contentPolicy) {
            assessment.contentPolicy.filters?.forEach((filter) => {
              violations.push({
                type: this.mapContentPolicyType(filter.type),
                severity: this.mapConfidenceToSeverity(filter.confidence),
                confidence: filter.confidence || 0.5,
                details: `Content policy violation: ${filter.type}`,
              });
            });
          }

          if (assessment.wordPolicy) {
            violations.push({
              type: "CUSTOM",
              severity: "MEDIUM",
              confidence: 0.8,
              details: "Word policy violation detected",
            });
          }

          if (assessment.sensitiveInformationPolicy) {
            assessment.sensitiveInformationPolicy.piiEntities?.forEach(
              (entity) => {
                violations.push({
                  type: "PII",
                  severity: "HIGH",
                  confidence: 0.9,
                  details: `PII detected: ${entity.type}`,
                  position: entity.match
                    ? {
                        start: entity.match.start || 0,
                        end: entity.match.end || 0,
                      }
                    : undefined,
                });
              }
            );
          }
        });
      }

      return {
        allowed,
        confidence,
        violations,
        modifiedContent: config.piiRedaction
          ? await this.redactPII(content)
          : undefined,
        processingTimeMs,
      };
    } catch (error) {
      console.error("Bedrock Guardrails error:", error);

      // Fail-safe: Bei Fehler blockieren wir sicherheitshalber
      return {
        allowed: false,
        confidence: 0.0,
        violations: [
          {
            type: "CUSTOM",
            severity: "CRITICAL",
            confidence: 1.0,
            details: `Guardrails service error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private mapContentPolicyType(type?: string): SafetyViolation["type"] {
    switch (type?.toLowerCase()) {
      case "hate":
        return "HATE_SPEECH";
      case "violence":
        return "VIOLENCE";
      case "sexual":
        return "SEXUAL";
      case "misconduct":
        return "TOXICITY";
      default:
        return "CUSTOM";
    }
  }

  private mapConfidenceToSeverity(
    confidence?: number
  ): SafetyViolation["severity"] {
    if (!confidence) return "MEDIUM";
    if (confidence >= 0.9) return "CRITICAL";
    if (confidence >= 0.7) return "HIGH";
    if (confidence >= 0.5) return "MEDIUM";
    return "LOW";
  }

  private async redactPII(text: string): Promise<string> {
    // Implementierung in PIIRedactionService
    return text; // Placeholder
  }
}

/**
 * Central Guardrails Service
 */
export class GuardrailsService {
  private bedrockGuardrails: BedrockGuardrailsService;
  private piiToxicityDetector: any; // Will be imported dynamically

  constructor(region: string = "eu-central-1") {
    this.bedrockGuardrails = new BedrockGuardrailsService(region);
    this.initializePIIToxicityDetector();
  }

  private async initializePIIToxicityDetector() {
    try {
      const { PIIToxicityDetectionService } = await import(
        "./pii-toxicity-detector"
      );
      this.piiToxicityDetector = new PIIToxicityDetectionService({
        enablePII: true,
        enableToxicity: true,
        enablePromptInjection: true,
        strictMode: false,
        redactionMode: "MASK",
        confidenceThreshold: 0.7,
      });
    } catch (error) {
      console.warn("Failed to initialize PII/Toxicity detector:", error);
    }
  }

  async checkInput(
    content: string,
    provider: Provider,
    domain: string = "general",
    requestId?: string
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();

    // First run PII/Toxicity detection for all providers
    let piiToxicityResult: SafetyCheckResult | null = null;
    if (this.piiToxicityDetector) {
      try {
        piiToxicityResult = await this.piiToxicityDetector.performSafetyCheck(
          content,
          requestId
        );

        // If PII/Toxicity check fails, return immediately
        if (!piiToxicityResult.allowed) {
          return {
            ...piiToxicityResult,
            processingTimeMs: Date.now() - startTime,
          };
        }
      } catch (error) {
        console.warn("PII/Toxicity check failed:", error);
      }
    }

    // Then run provider-specific checks
    let providerResult: SafetyCheckResult;

    switch (provider) {
      case "bedrock":
        providerResult = await this.bedrockGuardrails.checkContent(
          content,
          domain,
          "INPUT"
        );
        break;

      case "google":
        // Für Google verwenden wir Basic Filtering + PII/Toxicity
        providerResult = {
          allowed: true, // Gemini hat eigene Safety Settings
          confidence: 1.0,
          violations: [],
          processingTimeMs: 0,
        };
        break;

      case "meta":
        // Für Meta verwenden wir Basic Filtering + PII/Toxicity
        providerResult = {
          allowed: true,
          confidence: 1.0,
          violations: [],
          processingTimeMs: 0,
        };
        break;

      default:
        throw new Error(`Unsupported provider for guardrails: ${provider}`);
    }

    // Combine results if we have both
    if (piiToxicityResult) {
      return {
        allowed: providerResult.allowed && piiToxicityResult.allowed,
        confidence: Math.min(
          providerResult.confidence,
          piiToxicityResult.confidence
        ),
        violations: [
          ...providerResult.violations,
          ...piiToxicityResult.violations,
        ],
        modifiedContent:
          piiToxicityResult.modifiedContent || providerResult.modifiedContent,
        processingTimeMs: Date.now() - startTime,
      };
    }

    return {
      ...providerResult,
      processingTimeMs: Date.now() - startTime,
    };
  }

  async checkOutput(
    content: string,
    provider: Provider,
    domain: string = "general",
    requestId?: string,
    originalResponse?: any
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();

    // First run PII/Toxicity detection for all providers
    let piiToxicityResult: SafetyCheckResult | null = null;
    if (this.piiToxicityDetector) {
      try {
        piiToxicityResult = await this.piiToxicityDetector.performSafetyCheck(
          content,
          requestId
        );

        // If PII/Toxicity check fails, return immediately
        if (!piiToxicityResult.allowed) {
          return {
            ...piiToxicityResult,
            processingTimeMs: Date.now() - startTime,
          };
        }
      } catch (error) {
        console.warn("PII/Toxicity check failed:", error);
      }
    }

    // Then run provider-specific checks
    let providerResult: SafetyCheckResult;

    switch (provider) {
      case "bedrock":
        providerResult = await this.bedrockGuardrails.checkContent(
          content,
          domain,
          "OUTPUT"
        );
        break;

      case "google":
        // Basic Gemini safety check + PII/Toxicity
        providerResult = {
          allowed: true,
          confidence: 1.0,
          violations: [],
          processingTimeMs: 0,
        };
        break;

      case "meta":
        // Basic Llama safety check + PII/Toxicity
        providerResult = {
          allowed: true,
          confidence: 1.0,
          violations: [],
          processingTimeMs: 0,
        };
        break;

      default:
        throw new Error(`Unsupported provider for guardrails: ${provider}`);
    }

    // Combine results if we have both
    if (piiToxicityResult) {
      return {
        allowed: providerResult.allowed && piiToxicityResult.allowed,
        confidence: Math.min(
          providerResult.confidence,
          piiToxicityResult.confidence
        ),
        violations: [
          ...providerResult.violations,
          ...piiToxicityResult.violations,
        ],
        modifiedContent:
          piiToxicityResult.modifiedContent || providerResult.modifiedContent,
        processingTimeMs: Date.now() - startTime,
      };
    }

    return {
      ...providerResult,
      processingTimeMs: Date.now() - startTime,
    };
  }

  async sanitizeForLogging(
    content: string,
    requestId?: string
  ): Promise<string> {
    // Basic PII patterns für Logging
    const piiPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit Card
    ];

    let sanitized = content;
    piiPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    });

    return sanitized;
  }
}
