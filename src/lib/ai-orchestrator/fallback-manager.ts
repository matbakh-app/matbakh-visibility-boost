import { CapabilityMatrix } from "./capability-matrix";
import {
  AiRequest,
  AiResponse,
  Provider,
  RouteDecision,
  RouterInputContext,
} from "./types";

export interface FallbackStrategy {
  maxRetries: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  degradationMode: "fast_answer" | "cached_response" | "simplified_model";
}

export interface FallbackContext {
  originalRequest: AiRequest;
  originalDecision: RouteDecision;
  attemptCount: number;
  lastError?: Error;
  fallbackReason:
    | "timeout"
    | "quota_exceeded"
    | "service_unavailable"
    | "quality_threshold";
}

/**
 * Manages fallback strategies and provider degradation for AI orchestration
 * Implements circuit breaker pattern with exponential backoff
 */
export class FallbackManager {
  private circuitBreakers = new Map<
    Provider,
    {
      failures: number;
      lastFailure: number;
      isOpen: boolean;
    }
  >();

  private readonly strategy: FallbackStrategy;

  constructor(strategy: Partial<FallbackStrategy> = {}) {
    this.strategy = {
      maxRetries: 3,
      retryDelayMs: 1000,
      circuitBreakerThreshold: 5,
      degradationMode: "fast_answer",
      ...strategy,
    };
  }

  /**
   * Execute request with fallback handling
   */
  async executeWithFallback<T>(
    context: FallbackContext,
    executor: (decision: RouteDecision) => Promise<T>
  ): Promise<T> {
    let currentDecision = context.originalDecision;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.strategy.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen(currentDecision.provider)) {
          throw new Error(
            `Circuit breaker open for provider: ${currentDecision.provider}`
          );
        }

        const result = await executor(currentDecision);

        // Success - reset circuit breaker
        this.recordSuccess(currentDecision.provider);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(currentDecision.provider);

        // If this is the last attempt, throw the error
        if (attempt === this.strategy.maxRetries - 1) {
          break;
        }

        // Get fallback decision
        const fallbackDecision = await this.getFallbackDecision(
          currentDecision,
          context.originalRequest.context,
          lastError
        );

        if (!fallbackDecision) {
          break; // No more fallbacks available
        }

        currentDecision = fallbackDecision;

        // Wait before retry with exponential backoff
        await this.delay(this.strategy.retryDelayMs * Math.pow(2, attempt));
      }
    }

    // All fallbacks failed - try degradation mode
    return this.handleDegradation(context, lastError);
  }

  /**
   * Get fallback routing decision
   */
  private async getFallbackDecision(
    originalDecision: RouteDecision,
    context: RouterInputContext,
    error: Error
  ): Promise<RouteDecision | null> {
    const fallbackModels = CapabilityMatrix.getFallbackModels(
      originalDecision.modelId
    );

    // Filter out providers with open circuit breakers
    const availableFallbacks = fallbackModels.filter(
      (model) => !this.isCircuitBreakerOpen(model.provider)
    );

    if (availableFallbacks.length === 0) {
      return null;
    }

    // Select best fallback based on context and error type
    const selectedFallback = this.selectBestFallback(
      availableFallbacks,
      context,
      error
    );

    return {
      provider: selectedFallback.provider,
      modelId: selectedFallback.modelId,
      temperature: originalDecision.temperature,
      tools: originalDecision.tools,
      reason: `Fallback from ${originalDecision.provider} due to: ${error.message}`,
    };
  }

  /**
   * Select the best fallback model based on context and error
   */
  private selectBestFallback(
    fallbacks: any[],
    context: RouterInputContext,
    error: Error
  ): any {
    const errorMessage = error.message.toLowerCase();

    // If timeout error, prefer fastest model
    if (errorMessage.includes("timeout") || context.slaMs) {
      return fallbacks.reduce((fastest, current) =>
        current.capability.defaultLatencyMs <
        fastest.capability.defaultLatencyMs
          ? current
          : fastest
      );
    }

    // If quota/cost error, prefer cheapest model
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("limit") ||
      context.budgetTier === "low"
    ) {
      return fallbacks.reduce((cheapest, current) => {
        const cheapestCost =
          cheapest.capability.costPer1kInput +
          cheapest.capability.costPer1kOutput;
        const currentCost =
          current.capability.costPer1kInput +
          current.capability.costPer1kOutput;
        return currentCost < cheapestCost ? current : cheapest;
      });
    }

    // Default: select most capable model
    return fallbacks[0];
  }

  /**
   * Handle degradation when all fallbacks fail
   */
  private async handleDegradation<T>(
    context: FallbackContext,
    error?: Error
  ): Promise<T> {
    switch (this.strategy.degradationMode) {
      case "fast_answer":
        return this.provideFastAnswer(context) as T;

      case "cached_response":
        return this.provideCachedResponse(context) as T;

      case "simplified_model":
        return this.useSimplifiedModel(context) as T;

      default:
        throw new Error(
          `All fallbacks exhausted. Last error: ${error?.message}`
        );
    }
  }

  /**
   * Provide a fast, pre-generated answer
   */
  private provideFastAnswer(context: FallbackContext): AiResponse {
    const fastAnswers = {
      general:
        "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
      culinary:
        "I'm currently unable to provide culinary advice. Please check back shortly.",
      support:
        "Our AI support is temporarily unavailable. Please contact human support.",
      legal:
        "Legal AI services are temporarily unavailable. Please consult with a qualified attorney.",
      medical:
        "Medical AI services are temporarily unavailable. Please consult with a healthcare professional.",
    };

    const domain = context.originalRequest.context.domain || "general";
    const text = fastAnswers[domain] || fastAnswers.general;

    return {
      provider: "fallback" as Provider,
      modelId: "fast-answer",
      text,
      toolCalls: [],
      latencyMs: 50,
      costEuro: 0,
      success: true,
      requestId: `fallback_${Date.now()}`,
    };
  }

  /**
   * Provide a cached response if available
   */
  private provideCachedResponse(context: FallbackContext): AiResponse {
    // In a real implementation, this would check a cache
    // For now, return a generic cached response
    return {
      provider: "cache" as Provider,
      modelId: "cached-response",
      text: "This is a cached response due to service unavailability.",
      toolCalls: [],
      latencyMs: 10,
      costEuro: 0,
      success: true,
      requestId: `cached_${Date.now()}`,
    };
  }

  /**
   * Use a simplified model as last resort
   */
  private useSimplifiedModel(context: FallbackContext): AiResponse {
    // Find the simplest available model
    const simplestModel = CapabilityMatrix.getCheapestModel({});

    if (!simplestModel) {
      throw new Error("No simplified model available");
    }

    return {
      provider: simplestModel.provider,
      modelId: simplestModel.modelId,
      text: "Response generated using simplified model due to service issues.",
      toolCalls: [],
      latencyMs: simplestModel.capability.defaultLatencyMs,
      costEuro: 0.001, // Minimal cost
      success: true,
      requestId: `simplified_${Date.now()}`,
    };
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerOpen(provider: Provider): boolean {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return false;

    // Auto-reset circuit breaker after 5 minutes
    const resetTimeMs = 5 * 60 * 1000;
    if (breaker.isOpen && Date.now() - breaker.lastFailure > resetTimeMs) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }

    return breaker.isOpen;
  }

  private recordFailure(provider: Provider): void {
    const breaker = this.circuitBreakers.get(provider) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= this.strategy.circuitBreakerThreshold) {
      breaker.isOpen = true;
    }

    this.circuitBreakers.set(provider, breaker);
  }

  private recordSuccess(provider: Provider): void {
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
      this.circuitBreakers.set(provider, breaker);
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<
    Provider,
    {
      failures: number;
      isOpen: boolean;
      lastFailure?: Date;
    }
  > {
    const status: any = {};

    for (const [provider, breaker] of this.circuitBreakers.entries()) {
      status[provider] = {
        failures: breaker.failures,
        isOpen: breaker.isOpen,
        lastFailure: breaker.lastFailure
          ? new Date(breaker.lastFailure)
          : undefined,
      };
    }

    return status;
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreaker(provider: Provider): void {
    this.circuitBreakers.delete(provider);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
