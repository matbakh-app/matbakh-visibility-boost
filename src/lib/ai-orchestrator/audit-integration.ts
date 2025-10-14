/**
 * Audit Trail Integration
 *
 * Integrates audit trail system with existing AI orchestrator components
 * Provides seamless audit logging for all AI operations
 */

import { AuditTrailSystem, auditTrail } from "./audit-trail-system";
import { BasicLogger } from "./basic-logger";
import { SafetyCheckResult } from "./safety/guardrails-service";
import { AiRequest, AiResponse, Provider, RouterInputContext } from "./types";

/**
 * Audit-enabled AI Request wrapper
 */
export interface AuditedAiRequest extends AiRequest {
  requestId: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
}

/**
 * Audit-enabled AI Response wrapper
 */
export interface AuditedAiResponse extends AiResponse {
  auditEventIds: string[];
}

/**
 * AI Orchestrator with integrated audit trail
 */
export class AuditedAiOrchestrator {
  private auditTrail: AuditTrailSystem;
  private logger: BasicLogger;

  constructor(auditTrailSystem?: AuditTrailSystem) {
    this.auditTrail = auditTrailSystem || auditTrail;
    this.logger = new BasicLogger("audited-ai-orchestrator");
  }

  /**
   * Process AI request with full audit trail
   */
  async processRequest(request: AuditedAiRequest): Promise<AuditedAiResponse> {
    const auditEventIds: string[] = [];
    const startTime = Date.now();

    try {
      // Log request start
      await this.auditTrail.logRequestStart(
        request.requestId,
        request,
        request.userId,
        request.tenantId
      );

      // Simulate provider selection (would be actual routing logic)
      const selectedProvider = this.selectProvider(request.context);
      const modelId = this.selectModel(selectedProvider, request.context);

      await this.auditTrail.logProviderSelection(
        request.requestId,
        selectedProvider,
        modelId,
        "Context-based provider selection",
        this.getAlternativeProviders(selectedProvider)
      );

      // Simulate safety check
      const safetyResult = await this.performSafetyCheck(
        request,
        selectedProvider
      );

      await this.auditTrail.logSafetyCheck(
        request.requestId,
        selectedProvider,
        safetyResult,
        "prompt"
      );

      if (!safetyResult.allowed) {
        // Return error response with audit trail
        const errorResponse: AuditedAiResponse = {
          provider: selectedProvider,
          modelId,
          latencyMs: Date.now() - startTime,
          costEuro: 0,
          success: false,
          error: "Content safety check failed",
          requestId: request.requestId,
          auditEventIds,
        };

        await this.auditTrail.logRequestComplete(
          request.requestId,
          errorResponse,
          request.userId
        );

        return errorResponse;
      }

      // Simulate AI processing
      const response = await this.processWithProvider(
        request,
        selectedProvider,
        modelId
      );

      // Log cost tracking
      if (response.success && response.costEuro > 0) {
        await this.auditTrail.logCostTracking(
          request.requestId,
          selectedProvider,
          modelId,
          response.costEuro,
          { input: 100, output: 50 } // Would be actual token counts
        );
      }

      // Log request completion
      await this.auditTrail.logRequestComplete(
        request.requestId,
        response,
        request.userId
      );

      return {
        ...response,
        auditEventIds,
      };
    } catch (error) {
      // Log error and create error response
      const errorResponse: AuditedAiResponse = {
        provider: "bedrock", // Default fallback
        modelId: "unknown",
        latencyMs: Date.now() - startTime,
        costEuro: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: request.requestId,
        auditEventIds,
      };

      await this.auditTrail.logRequestComplete(
        request.requestId,
        errorResponse,
        request.userId
      );

      return errorResponse;
    }
  }

  /**
   * Process request with provider fallback and audit logging
   */
  async processWithFallback(
    request: AuditedAiRequest
  ): Promise<AuditedAiResponse> {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    let lastError: Error | null = null;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];

      try {
        const response = await this.processWithProvider(
          request,
          provider,
          this.selectModel(provider, request.context)
        );

        if (response.success) {
          return {
            ...response,
            auditEventIds: [],
          };
        }

        lastError = new Error(response.error || "Provider failed");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Log fallback if not the last provider
        if (i < providers.length - 1) {
          await this.auditTrail.logProviderFallback(
            request.requestId,
            provider,
            providers[i + 1],
            "Provider error",
            lastError
          );
        }
      }
    }

    // All providers failed
    const errorResponse: AuditedAiResponse = {
      provider: "bedrock",
      modelId: "unknown",
      latencyMs: 0,
      costEuro: 0,
      success: false,
      error: lastError?.message || "All providers failed",
      requestId: request.requestId,
      auditEventIds: [],
    };

    await this.auditTrail.logRequestComplete(
      request.requestId,
      errorResponse,
      request.userId
    );

    return errorResponse;
  }

  /**
   * Generate audit compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ) {
    this.logger.info("Generating compliance report", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userId,
    });

    return await this.auditTrail.generateComplianceReport(startDate, endDate);
  }

  /**
   * Verify audit trail integrity
   */
  async verifyAuditIntegrity(events: any[]) {
    return await this.auditTrail.verifyIntegrity(events);
  }

  /**
   * Private helper methods
   */
  private selectProvider(context: RouterInputContext): Provider {
    // Simple provider selection logic
    if (context.domain === "legal" || context.domain === "medical") {
      return "bedrock"; // Most secure for sensitive domains
    }
    if (context.slaMs && context.slaMs < 1000) {
      return "google"; // Fastest for low latency requirements
    }
    return "bedrock"; // Default
  }

  private selectModel(provider: Provider, context: RouterInputContext): string {
    switch (provider) {
      case "bedrock":
        return "anthropic.claude-3-5-sonnet-20241022-v2:0";
      case "google":
        return "gemini-1.5-pro";
      case "meta":
        return "llama-3-70b-instruct";
      default:
        return "unknown";
    }
  }

  private getAlternativeProviders(selectedProvider: Provider): Provider[] {
    const allProviders: Provider[] = ["bedrock", "google", "meta"];
    return allProviders.filter((p) => p !== selectedProvider);
  }

  private async performSafetyCheck(
    request: AuditedAiRequest,
    provider: Provider
  ): Promise<SafetyCheckResult> {
    // Simulate safety check - in real implementation would use GuardrailsService
    const hasPII =
      request.prompt.includes("@") || request.prompt.includes("phone");
    const hasToxicity = request.prompt.toLowerCase().includes("hate");

    if (hasPII || hasToxicity) {
      return {
        allowed: false,
        confidence: 0.9,
        violations: [
          ...(hasPII
            ? [
                {
                  type: "PII" as const,
                  severity: "HIGH" as const,
                  confidence: 0.95,
                  details: "Email or phone number detected",
                },
              ]
            : []),
          ...(hasToxicity
            ? [
                {
                  type: "TOXICITY" as const,
                  severity: "HIGH" as const,
                  confidence: 0.9,
                  details: "Toxic language detected",
                },
              ]
            : []),
        ],
        processingTimeMs: 150,
      };
    }

    return {
      allowed: true,
      confidence: 0.95,
      violations: [],
      processingTimeMs: 100,
    };
  }

  private async processWithProvider(
    request: AuditedAiRequest,
    provider: Provider,
    modelId: string
  ): Promise<AiResponse> {
    const startTime = Date.now();

    // Simulate AI processing
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    // Simulate different success rates per provider
    const successRate =
      provider === "bedrock" ? 0.95 : provider === "google" ? 0.9 : 0.85;
    const success = Math.random() < successRate;

    if (!success) {
      return {
        provider,
        modelId,
        latencyMs: Date.now() - startTime,
        costEuro: 0,
        success: false,
        error: `${provider} processing failed`,
        requestId: request.requestId,
      };
    }

    // Simulate successful response
    const responseText = `Analysis complete for: ${request.prompt.substring(
      0,
      50
    )}...`;
    const latencyMs = Date.now() - startTime;
    const costEuro = this.calculateCost(
      provider,
      request.prompt.length,
      responseText.length
    );

    return {
      provider,
      modelId,
      text: responseText,
      latencyMs,
      costEuro,
      success: true,
      requestId: request.requestId,
    };
  }

  private calculateCost(
    provider: Provider,
    inputLength: number,
    outputLength: number
  ): number {
    // Simplified cost calculation
    const costPer1kInput =
      provider === "bedrock" ? 0.003 : provider === "google" ? 0.002 : 0.001;
    const costPer1kOutput =
      provider === "bedrock" ? 0.015 : provider === "google" ? 0.006 : 0.003;

    const inputTokens = Math.ceil(inputLength / 4); // Rough token estimation
    const outputTokens = Math.ceil(outputLength / 4);

    return (
      (inputTokens / 1000) * costPer1kInput +
      (outputTokens / 1000) * costPer1kOutput
    );
  }
}

/**
 * Audit middleware for existing AI operations
 */
export class AuditMiddleware {
  private auditTrail: AuditTrailSystem;

  constructor(auditTrailSystem?: AuditTrailSystem) {
    this.auditTrail = auditTrailSystem || auditTrail;
  }

  /**
   * Wrap any AI operation with audit logging
   */
  async wrapOperation<T>(
    operationName: string,
    requestId: string,
    operation: () => Promise<T>,
    context?: {
      userId?: string;
      provider?: Provider;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Log operation start
      await this.auditTrail.logRequestStart(
        requestId,
        {
          prompt: `Operation: ${operationName}`,
          context: { userId: context?.userId },
        },
        context?.userId
      );

      // Execute operation
      const result = await operation();

      // Log operation success
      await this.auditTrail.logRequestComplete(
        requestId,
        {
          provider: context?.provider || "bedrock",
          modelId: "operation",
          text: `Operation ${operationName} completed`,
          latencyMs: Date.now() - startTime,
          costEuro: 0,
          success: true,
          requestId,
        },
        context?.userId
      );

      return result;
    } catch (error) {
      // Log operation error
      await this.auditTrail.logRequestComplete(
        requestId,
        {
          provider: context?.provider || "bedrock",
          modelId: "operation",
          latencyMs: Date.now() - startTime,
          costEuro: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          requestId,
        },
        context?.userId
      );

      throw error;
    }
  }
}

/**
 * Default instances
 */
export const auditedOrchestrator = new AuditedAiOrchestrator();
export const auditMiddleware = new AuditMiddleware();
