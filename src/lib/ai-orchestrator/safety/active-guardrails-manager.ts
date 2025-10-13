/**
 * Active Guardrails Manager
 *
 * Orchestrates all safety checks and integrates with AI request pipeline
 */

import { BedrockGuardrails } from "../bedrock-guardrails";
import { AiRequest, AiResponse, Provider } from "../types";
import { GuardrailsService } from "./guardrails-service";
import { PIIToxicityDetectionService } from "./pii-toxicity-detector";

// Robust defaults and helper functions
type Violation = { type: string; severity?: string; message?: string };

const asArray = <T>(x: T[] | undefined | null): T[] =>
  Array.isArray(x) ? x : [];
const nn = <T>(x: T | undefined | null, fallback: T): T => x ?? fallback;

type ProviderResult = {
  shouldDelegate?: boolean;
  violations?: Violation[];
  confidence?: number;
  guardrailsApplied?: string[];
  modifiedRequest?: { prompt?: string; content?: string };
  modifiedResponse?: { content?: string };
  allowed?: boolean;
};

const normalizeProviderResult = (
  r?: ProviderResult
): Required<ProviderResult> => ({
  shouldDelegate: !!r?.shouldDelegate,
  violations: asArray(r?.violations),
  confidence: nn(r?.confidence, 1),
  guardrailsApplied: asArray(r?.guardrailsApplied),
  modifiedRequest: r?.modifiedRequest,
  modifiedResponse: r?.modifiedResponse,
  allowed: nn(r?.allowed, true),
});

export interface GuardrailsConfig {
  enablePIIDetection: boolean;
  enableToxicityDetection: boolean;
  enablePromptInjection: boolean;
  enableBedrockGuardrails: boolean;
  strictMode: boolean;
  logViolations: boolean;
  blockOnViolation: boolean;
  redactionMode: "MASK" | "REMOVE" | "REPLACE";
}

export interface GuardrailsResult {
  allowed: boolean;
  confidence: number;
  violations: any[];
  modifiedRequest?: AiRequest;
  modifiedResponse?: AiResponse;
  processingTimeMs: number;
  guardrailsApplied: string[];
}

/**
 * Active Guardrails Manager - Central safety orchestrator
 */
export class ActiveGuardrailsManager {
  private guardrailsService: GuardrailsService;
  private piiToxicityDetector: PIIToxicityDetectionService;
  private bedrockGuardrails: BedrockGuardrails;
  private config: GuardrailsConfig;

  constructor(config: Partial<GuardrailsConfig> = {}) {
    this.config = {
      enablePIIDetection: true,
      enableToxicityDetection: true,
      enablePromptInjection: true,
      enableBedrockGuardrails: true,
      strictMode: false,
      logViolations: true,
      blockOnViolation: true,
      redactionMode: "MASK",
      ...config,
    };

    this.guardrailsService = new GuardrailsService();
    this.piiToxicityDetector = new PIIToxicityDetectionService({
      enablePII: this.config.enablePIIDetection,
      enableToxicity: this.config.enableToxicityDetection,
      enablePromptInjection: this.config.enablePromptInjection,
      strictMode: this.config.strictMode,
      redactionMode: this.config.redactionMode,
      confidenceThreshold: 0.7,
    });
    this.bedrockGuardrails = new BedrockGuardrails();
  }

  /**
   * Check request before processing
   */
  async checkRequest(
    request: AiRequest,
    provider: Provider,
    requestId?: string
  ): Promise<GuardrailsResult> {
    const startTime = Date.now();
    const guardrailsApplied: string[] = [];
    let violations: any[] = [];
    let allowed = true;
    let confidence = 1.0;
    let modifiedRequest = request;

    try {
      // 1. Bedrock architectural guardrails
      if (this.config.enableBedrockGuardrails) {
        try {
          const delegationResult = this.bedrockGuardrails.checkBedrockUsage(
            request || { prompt: "", context: {}, metadata: {} },
            provider
          );
          guardrailsApplied.push("bedrock-architectural");

          if (delegationResult && delegationResult.shouldDelegate) {
            console.log(`🔄 Bedrock guardrail: ${delegationResult.reason}`);
            // This would be handled by the router, not blocking here
          }
        } catch (error) {
          console.warn("Bedrock guardrails check failed:", error);
          guardrailsApplied.push("bedrock-architectural-error");
        }
      }

      // 2. PII/Toxicity/Prompt Injection Detection
      let piiToxicityResult: any = null;
      if (
        this.config.enablePIIDetection ||
        this.config.enableToxicityDetection ||
        this.config.enablePromptInjection
      ) {
        try {
          piiToxicityResult = await this.piiToxicityDetector.performSafetyCheck(
            this.extractText(request?.prompt),
            requestId
          );

          guardrailsApplied.push("pii-toxicity-detection");

          // Robust violation handling
          const piiViolations = asArray(piiToxicityResult?.violations);
          violations.push(...piiViolations);

          if (
            !nn(piiToxicityResult?.allowed, true) &&
            this.config.blockOnViolation
          ) {
            allowed = false;
          }

          confidence = Math.min(
            confidence,
            nn(piiToxicityResult?.confidence, 1.0)
          );

          // Apply content modifications if needed
          if (
            piiToxicityResult?.modifiedContent &&
            piiToxicityResult.modifiedContent !== request.prompt
          ) {
            modifiedRequest = {
              ...request,
              prompt: piiToxicityResult.modifiedContent,
            };
          }
        } catch (error) {
          console.warn("PII/Toxicity detection failed:", error);
          guardrailsApplied.push("pii-toxicity-detection-error");
        }
      }

      // 3. Provider-specific guardrails
      let providerResult: any = null;
      try {
        const providerSafetyResultRaw = await this.guardrailsService.checkInput(
          this.extractText(request?.prompt),
          provider,
          request?.context?.domain,
          requestId
        );

        providerResult = normalizeProviderResult(providerSafetyResultRaw);
        guardrailsApplied.push(`${provider}-specific`);

        // Robust violation handling
        const providerViolations = asArray(providerResult?.violations);
        violations.push(...providerViolations);

        if (
          !nn(providerResult?.allowed, true) &&
          this.config.blockOnViolation
        ) {
          allowed = false;
        }

        confidence = Math.min(confidence, nn(providerResult?.confidence, 1.0));
      } catch (error) {
        console.warn("Provider guardrails check failed:", error);
        guardrailsApplied.push(`${provider}-specific-error`);
      }

      // Ensure modifiedRequest is set if violations found and content was modified
      if (!allowed && violations.length > 0 && modifiedRequest === request) {
        // Minimal fallback: basic PII redaction if no other modification was made
        const originalPrompt = this.extractText(request?.prompt);
        const redactedPrompt = originalPrompt.replace(
          /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
          "[REDACTED]"
        );
        if (redactedPrompt !== originalPrompt && request) {
          modifiedRequest = {
            ...request,
            prompt: redactedPrompt,
          };
        }
      }

      // Log violations if enabled
      if (this.config.logViolations && violations.length > 0) {
        console.warn(`🚫 Guardrails violations detected:`, {
          requestId,
          provider,
          violationCount: violations.length,
          violations: violations.map((v) => ({
            type: v.type,
            severity: v.severity,
          })),
        });
      }

      return {
        allowed,
        confidence,
        violations,
        modifiedRequest:
          modifiedRequest !== request ? modifiedRequest : undefined,
        processingTimeMs: Date.now() - startTime,
        guardrailsApplied,
      };
    } catch (error) {
      console.error("Guardrails check failed:", error);

      return {
        allowed: false,
        confidence: 0.0,
        violations: [
          {
            type: "SYSTEM_ERROR",
            severity: "CRITICAL",
            confidence: 1.0,
            details: `Guardrails system error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        processingTimeMs: Date.now() - startTime,
        guardrailsApplied,
      };
    }
  }

  /**
   * Check response after processing
   */
  async checkResponse(
    response: AiResponse,
    provider: Provider,
    requestId?: string
  ): Promise<GuardrailsResult> {
    const startTime = Date.now();
    const guardrailsApplied: string[] = [];
    let violations: any[] = [];
    let allowed = true;
    let confidence = 1.0;
    let modifiedResponse = response;

    try {
      // Extract text content from response
      const responseText = this.extractResponseText(response);

      if (!responseText) {
        return {
          allowed: true,
          confidence: 1.0,
          violations: [],
          processingTimeMs: Date.now() - startTime,
          guardrailsApplied: ["no-content"],
        };
      }

      // 1. PII/Toxicity Detection on output
      let outputSafetyResult: any = null;
      if (
        this.config.enablePIIDetection ||
        this.config.enableToxicityDetection
      ) {
        try {
          outputSafetyResult =
            await this.piiToxicityDetector.performSafetyCheck(
              responseText,
              requestId
            );

          guardrailsApplied.push("output-pii-toxicity-detection");

          // Robust violation handling
          const outputViolations = asArray(outputSafetyResult?.violations);
          violations.push(...outputViolations);

          if (
            !nn(outputSafetyResult?.allowed, true) &&
            this.config.blockOnViolation
          ) {
            allowed = false;
          }

          confidence = Math.min(
            confidence,
            nn(outputSafetyResult?.confidence, 1.0)
          );

          // Apply content modifications if needed
          if (
            outputSafetyResult?.modifiedContent &&
            outputSafetyResult.modifiedContent !== responseText
          ) {
            modifiedResponse = this.updateResponseText(
              response,
              outputSafetyResult.modifiedContent
            );
          }
        } catch (error) {
          console.warn("Output PII/Toxicity detection failed:", error);
          guardrailsApplied.push("output-pii-toxicity-detection-error");
        }
      }

      // 2. Provider-specific output checks
      let providerOutputResult: any = null;
      try {
        const providerSafetyResultRaw =
          await this.guardrailsService.checkOutput(
            responseText,
            provider,
            "general",
            requestId,
            response
          );

        providerOutputResult = normalizeProviderResult(providerSafetyResultRaw);
        guardrailsApplied.push(`${provider}-output-specific`);

        // Robust violation handling
        const providerOutputViolations = asArray(
          providerOutputResult?.violations
        );
        violations.push(...providerOutputViolations);

        if (
          !nn(providerOutputResult?.allowed, true) &&
          this.config.blockOnViolation
        ) {
          allowed = false;
        }

        confidence = Math.min(
          confidence,
          nn(providerOutputResult?.confidence, 1.0)
        );
      } catch (error) {
        console.warn("Provider output guardrails check failed:", error);
        guardrailsApplied.push(`${provider}-output-specific-error`);
      }

      // Ensure modifiedResponse is set if violations found and content was modified
      if (!allowed && violations.length > 0 && modifiedResponse === response) {
        // Minimal fallback: basic PII redaction if no other modification was made
        const redactedText = responseText.replace(
          /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
          "[REDACTED]"
        );
        if (redactedText !== responseText) {
          modifiedResponse = this.updateResponseText(response, redactedText);
        }
      }

      // Log violations if enabled
      if (this.config.logViolations && violations.length > 0) {
        console.warn(`🚫 Response guardrails violations detected:`, {
          requestId,
          provider,
          violationCount: violations.length,
          violations: violations.map((v) => ({
            type: v.type,
            severity: v.severity,
          })),
        });
      }

      return {
        allowed,
        confidence,
        violations,
        modifiedResponse:
          modifiedResponse !== response ? modifiedResponse : undefined,
        processingTimeMs: Date.now() - startTime,
        guardrailsApplied,
      };
    } catch (error) {
      console.error("Response guardrails check failed:", error);

      return {
        allowed: false,
        confidence: 0.0,
        violations: [
          {
            type: "SYSTEM_ERROR",
            severity: "CRITICAL",
            confidence: 1.0,
            details: `Response guardrails system error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        processingTimeMs: Date.now() - startTime,
        guardrailsApplied,
      };
    }
  }

  /**
   * Get guardrails status and statistics
   */
  getGuardrailsStatus(): {
    config: GuardrailsConfig;
    bedrockViolations: any;
    systemHealth: "healthy" | "degraded" | "error";
  } {
    try {
      const bedrockViolations =
        this.bedrockGuardrails?.getViolationsSummary() || {
          totalViolations: 0,
          violationsByType: new Map(),
          recentViolations: [],
          topViolatedDomains: [],
        };

      return {
        config: this.config,
        bedrockViolations,
        systemHealth: "healthy", // Could be enhanced with actual health checks
      };
    } catch (error) {
      console.warn("Failed to get guardrails status:", error);
      return {
        config: this.config,
        bedrockViolations: {
          totalViolations: 0,
          violationsByType: new Map(),
          recentViolations: [],
          topViolatedDomains: [],
        },
        systemHealth: "error",
      };
    }
  }

  /**
   * Update guardrails configuration
   */
  updateConfig(newConfig: Partial<GuardrailsConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update PII/Toxicity detector config
    this.piiToxicityDetector.updateConfig({
      enablePII: this.config.enablePIIDetection,
      enableToxicity: this.config.enableToxicityDetection,
      enablePromptInjection: this.config.enablePromptInjection,
      strictMode: this.config.strictMode,
      redactionMode: this.config.redactionMode,
    });
  }

  /**
   * Extract text from any input (request prompt, response content, etc.)
   */
  private extractText(input: unknown): string {
    if (typeof input === "string") return input;
    if (!input) return "";
    if (typeof input === "object") {
      const o = input as any;
      const candidate = o.content ?? o.prompt ?? o.text ?? o.message;
      if (typeof candidate === "string") return candidate;
      try {
        return JSON.stringify(candidate ?? o);
      } catch {
        return String(o);
      }
    }
    return String(input);
  }

  /**
   * Extract text content from AI response
   */
  private extractResponseText(response: AiResponse): string {
    if (typeof response.content === "string") {
      return response.content;
    }

    if (response.content && typeof response.content === "object") {
      // Handle structured content
      if ("text" in response.content) {
        return response.content.text as string;
      }

      // Try to extract text from various formats
      return JSON.stringify(response.content);
    }

    return "";
  }

  /**
   * Update response text content
   */
  private updateResponseText(
    response: AiResponse,
    newText: string
  ): AiResponse {
    if (typeof response.content === "string") {
      return {
        ...response,
        content: newText,
      };
    }

    if (
      response.content &&
      typeof response.content === "object" &&
      "text" in response.content
    ) {
      return {
        ...response,
        content: {
          ...response.content,
          text: newText,
        },
      };
    }

    return response;
  }
}

// Export singleton instance
export const activeGuardrailsManager = new ActiveGuardrailsManager();
