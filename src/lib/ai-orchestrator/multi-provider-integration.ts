/**
 * PR-3: Multi-Provider Integration
 *
 * Implements:
 * - Unified provider interface for Bedrock, Google, Meta
 * - Intelligent model routing and selection
 * - Provider-specific optimizations
 * - Fallback and circuit breaker patterns
 */

import { randomUUID } from "crypto";
import { BedrockAdapter } from "./adapters/bedrock-adapter";
import { GoogleAdapter } from "./adapters/google-adapter";
import { MetaAdapter } from "./adapters/meta-adapter";
import { GuardrailsService } from "./safety/guardrails-service";
import { Provider } from "./types";

interface ProviderConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  apiKey?: string;
  endpoint?: string;
}

interface ModelCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsVision: boolean;
  supportsJSON: boolean;
  languages: string[];
  domains: string[];
}

interface AiRequest {
  prompt: string;
  context: any;
  provider?: Provider;
  capabilities?: Partial<ModelCapabilities>;
  maxLatency?: number;
  maxCost?: number;
  domain?: string;
}

interface AiResponse {
  content: string;
  provider: Provider;
  requestId: string;
  processingTime: number;
  success: boolean;
  routing?: any;
}

export interface ProviderMetrics {
  latency: number;
  successRate: number;
  costPerToken: number;
  availability: number;
  lastUpdated: Date;
}

export interface RoutingDecision {
  provider: Provider;
  model: string;
  confidence: number;
  reasoning: string;
  fallbacks: Array<{ provider: Provider; model: string }>;
}

export interface ProviderHealth {
  provider: Provider;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  errorRate: number;
  lastCheck: Date;
}

/**
 * Circuit Breaker for Provider Health Management
 */
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: Date | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 3
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime.getTime() > this.recoveryTimeout
    );
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

/**
 * Multi-Provider Integration Service
 */
export class MultiProviderIntegration {
  private adapters: Map<Provider, any> = new Map();
  private circuitBreakers: Map<Provider, CircuitBreaker> = new Map();
  private providerMetrics: Map<Provider, ProviderMetrics> = new Map();
  private guardrails: GuardrailsService;

  constructor(
    private readonly configs: Map<Provider, ProviderConfig>,
    private readonly region: string = "eu-central-1"
  ) {
    this.guardrails = new GuardrailsService(region);
    this.initializeAdapters();
    this.initializeCircuitBreakers();
    this.startHealthMonitoring();
  }

  private initializeAdapters(): void {
    for (const [provider, config] of this.configs) {
      switch (provider) {
        case "bedrock":
          this.adapters.set(provider, new BedrockAdapter(config));
          break;
        case "google":
          this.adapters.set(provider, new GoogleAdapter(config));
          break;
        case "meta":
          this.adapters.set(provider, new MetaAdapter(config));
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    }
  }

  private initializeCircuitBreakers(): void {
    for (const provider of this.configs.keys()) {
      this.circuitBreakers.set(provider, new CircuitBreaker());
    }
  }

  private startHealthMonitoring(): void {
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);
  }

  /**
   * Route request to optimal provider based on capabilities and health
   */
  async routeRequest(request: AiRequest): Promise<AiResponse> {
    const requestId = randomUUID();
    const startTime = Date.now();

    try {
      // Input safety check
      const inputSafety = await this.guardrails.checkInput(
        request.prompt,
        request.provider || "bedrock",
        request.domain,
        requestId
      );

      if (!inputSafety.allowed) {
        throw new Error(
          `Input blocked by guardrails: ${inputSafety.violations
            .map((v) => v.details)
            .join(", ")}`
        );
      }

      // Use modified prompt if PII was redacted
      const safePrompt = inputSafety.modifiedContent || request.prompt;
      const safeRequest = { ...request, prompt: safePrompt };

      // Route to best provider
      const routing = await this.selectProvider(safeRequest);
      const response = await this.executeWithFallback(safeRequest, routing);

      // Output safety check
      const outputSafety = await this.guardrails.checkOutput(
        response.content,
        routing.provider,
        request.domain,
        requestId
      );

      if (!outputSafety.allowed) {
        throw new Error(
          `Output blocked by guardrails: ${outputSafety.violations
            .map((v) => v.details)
            .join(", ")}`
        );
      }

      // Use modified content if safety filters applied
      const safeContent = outputSafety.modifiedContent || response.content;

      // Update metrics
      this.updateProviderMetrics(
        routing.provider,
        Date.now() - startTime,
        true
      );

      return {
        ...response,
        content: safeContent,
        provider: routing.provider,
        requestId,
        processingTime: Date.now() - startTime,
        routing: {
          decision: routing,
          inputSafety,
          outputSafety,
        },
      };
    } catch (error) {
      console.error("Multi-provider routing failed:", error);
      throw error;
    } finally {
      // Clean up PII tokens
      this.guardrails.clearPIITokens(requestId);
    }
  }

  /**
   * Select optimal provider based on request requirements and provider health
   */
  private async selectProvider(request: AiRequest): Promise<RoutingDecision> {
    const availableProviders = await this.getHealthyProviders();

    if (availableProviders.length === 0) {
      throw new Error("No healthy providers available");
    }

    // If specific provider requested and healthy, use it
    if (
      request.provider &&
      availableProviders.some((p) => p.provider === request.provider)
    ) {
      return {
        provider: request.provider,
        model: this.getDefaultModel(request.provider),
        confidence: 1.0,
        reasoning: "User-specified provider",
        fallbacks: this.getFallbacks(request.provider, availableProviders),
      };
    }

    // Score providers based on request requirements
    const scores = availableProviders.map((health) => {
      const provider = health.provider;
      const metrics = this.providerMetrics.get(provider);
      const capabilities = this.getProviderCapabilities(provider);

      let score = 0;

      // Latency preference (lower is better)
      if (request.maxLatency) {
        const latencyScore = Math.max(
          0,
          1 - health.latency / request.maxLatency
        );
        score += latencyScore * 0.3;
      }

      // Cost preference (lower is better)
      if (request.maxCost && metrics) {
        const costScore = Math.max(
          0,
          1 - metrics.costPerToken / request.maxCost
        );
        score += costScore * 0.2;
      }

      // Capability matching
      if (request.capabilities) {
        const capabilityScore = this.calculateCapabilityMatch(
          request.capabilities,
          capabilities
        );
        score += capabilityScore * 0.3;
      }

      // Health and reliability
      const healthScore =
        (1 - health.errorRate) * health.status === "healthy" ? 1 : 0.5;
      score += healthScore * 0.2;

      return {
        provider,
        score,
        health,
        metrics,
      };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    return {
      provider: best.provider,
      model: this.getDefaultModel(best.provider),
      confidence: best.score,
      reasoning: `Best match based on latency, cost, capabilities, and health (score: ${best.score.toFixed(
        2
      )})`,
      fallbacks: scores.slice(1, 3).map((s) => ({
        provider: s.provider,
        model: this.getDefaultModel(s.provider),
      })),
    };
  }

  /**
   * Execute request with fallback support
   */
  private async executeWithFallback(
    request: AiRequest,
    routing: RoutingDecision
  ): Promise<AiResponse> {
    const providers = [
      { provider: routing.provider, model: routing.model },
      ...routing.fallbacks,
    ];

    let lastError: Error | null = null;

    for (const { provider, model } of providers) {
      try {
        const circuitBreaker = this.circuitBreakers.get(provider);
        if (!circuitBreaker) {
          throw new Error(`No circuit breaker for provider: ${provider}`);
        }

        const adapter = this.adapters.get(provider);
        if (!adapter) {
          throw new Error(`No adapter for provider: ${provider}`);
        }

        const response = await circuitBreaker.execute(async () => {
          return adapter.generateResponse({
            ...request,
            model,
          });
        });

        return response;
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        lastError = error as Error;

        // Update metrics for failed attempt
        this.updateProviderMetrics(provider, 0, false);
        continue;
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Get healthy providers based on circuit breaker state and recent metrics
   */
  private async getHealthyProviders(): Promise<ProviderHealth[]> {
    const healthChecks: ProviderHealth[] = [];

    for (const [provider, circuitBreaker] of this.circuitBreakers) {
      const metrics = this.providerMetrics.get(provider);
      const adapter = this.adapters.get(provider);

      if (!adapter) continue;

      let status: ProviderHealth["status"] = "healthy";
      let latency = 0;
      let errorRate = 0;

      // Check circuit breaker state
      if (circuitBreaker.getState() === "open") {
        status = "unhealthy";
      } else if (circuitBreaker.getState() === "half-open") {
        status = "degraded";
      }

      // Use metrics if available
      if (metrics) {
        latency = metrics.latency;
        errorRate = 1 - metrics.successRate;

        // Determine status based on metrics
        if (errorRate > 0.1 || latency > 5000) {
          status = "unhealthy";
        } else if (errorRate > 0.05 || latency > 2000) {
          status = "degraded";
        }
      }

      healthChecks.push({
        provider,
        status,
        latency,
        errorRate,
        lastCheck: new Date(),
      });
    }

    // Return only healthy and degraded providers
    return healthChecks.filter((h) => h.status !== "unhealthy");
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    for (const [provider, adapter] of this.adapters) {
      try {
        const startTime = Date.now();

        // Simple health check request
        await adapter.healthCheck();

        const latency = Date.now() - startTime;
        this.updateProviderMetrics(provider, latency, true);
      } catch (error) {
        console.warn(`Health check failed for ${provider}:`, error);
        this.updateProviderMetrics(provider, 0, false);
      }
    }
  }

  /**
   * Update provider metrics
   */
  private updateProviderMetrics(
    provider: Provider,
    latency: number,
    success: boolean
  ): void {
    const existing = this.providerMetrics.get(provider);

    if (!existing) {
      this.providerMetrics.set(provider, {
        latency,
        successRate: success ? 1 : 0,
        costPerToken: this.getProviderCostPerToken(provider),
        availability: success ? 1 : 0,
        lastUpdated: new Date(),
      });
      return;
    }

    // Exponential moving average for metrics
    const alpha = 0.1; // Smoothing factor

    this.providerMetrics.set(provider, {
      latency: existing.latency * (1 - alpha) + latency * alpha,
      successRate:
        existing.successRate * (1 - alpha) + (success ? 1 : 0) * alpha,
      costPerToken: existing.costPerToken, // Updated separately
      availability:
        existing.availability * (1 - alpha) + (success ? 1 : 0) * alpha,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get provider capabilities
   */
  private getProviderCapabilities(provider: Provider): ModelCapabilities {
    // This would typically come from a configuration or discovery service
    const capabilities: Record<Provider, ModelCapabilities> = {
      bedrock: {
        maxTokens: 200000,
        supportsStreaming: true,
        supportsToolCalling: true,
        supportsVision: true,
        supportsJSON: true,
        languages: ["en", "de", "fr", "es", "it"],
        domains: ["general", "legal", "medical", "culinary"],
      },
      google: {
        maxTokens: 1000000,
        supportsStreaming: true,
        supportsToolCalling: true,
        supportsVision: true,
        supportsJSON: true,
        languages: ["en", "de", "fr", "es", "it", "ja", "ko"],
        domains: ["general", "culinary"],
      },
      meta: {
        maxTokens: 128000,
        supportsStreaming: true,
        supportsToolCalling: true,
        supportsVision: false,
        supportsJSON: true,
        languages: ["en", "de", "fr", "es"],
        domains: ["general", "culinary"],
      },
    };

    return capabilities[provider];
  }

  /**
   * Calculate capability match score
   */
  private calculateCapabilityMatch(
    required: Partial<ModelCapabilities>,
    available: ModelCapabilities
  ): number {
    let score = 0;
    let checks = 0;

    if (required.maxTokens !== undefined) {
      score += available.maxTokens >= required.maxTokens ? 1 : 0;
      checks++;
    }

    if (required.supportsStreaming !== undefined) {
      score +=
        available.supportsStreaming === required.supportsStreaming ? 1 : 0;
      checks++;
    }

    if (required.supportsToolCalling !== undefined) {
      score +=
        available.supportsToolCalling === required.supportsToolCalling ? 1 : 0;
      checks++;
    }

    if (required.supportsVision !== undefined) {
      score += available.supportsVision === required.supportsVision ? 1 : 0;
      checks++;
    }

    if (required.supportsJSON !== undefined) {
      score += available.supportsJSON === required.supportsJSON ? 1 : 0;
      checks++;
    }

    if (required.languages && required.languages.length > 0) {
      const supportedLanguages = required.languages.filter((lang) =>
        available.languages.includes(lang)
      );
      score += supportedLanguages.length / required.languages.length;
      checks++;
    }

    if (required.domains && required.domains.length > 0) {
      const supportedDomains = required.domains.filter((domain) =>
        available.domains.includes(domain)
      );
      score += supportedDomains.length / required.domains.length;
      checks++;
    }

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: Provider): string {
    const defaultModels: Record<Provider, string> = {
      bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      google: "gemini-1.5-pro",
      meta: "meta.llama3-2-90b-instruct-v1:0",
    };

    return defaultModels[provider];
  }

  /**
   * Get fallback providers
   */
  private getFallbacks(
    primary: Provider,
    available: ProviderHealth[]
  ): Array<{ provider: Provider; model: string }> {
    return available
      .filter((h) => h.provider !== primary)
      .slice(0, 2)
      .map((h) => ({
        provider: h.provider,
        model: this.getDefaultModel(h.provider),
      }));
  }

  /**
   * Get provider cost per token (placeholder - would come from pricing API)
   */
  private getProviderCostPerToken(provider: Provider): number {
    const costs: Record<Provider, number> = {
      bedrock: 0.003, // $3 per 1K tokens
      google: 0.0025, // $2.50 per 1K tokens
      meta: 0.002, // $2 per 1K tokens
    };

    return costs[provider];
  }

  /**
   * Get current provider metrics
   */
  getProviderMetrics(): Map<Provider, ProviderMetrics> {
    return new Map(this.providerMetrics);
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Map<Provider, string> {
    const states = new Map<Provider, string>();
    for (const [provider, breaker] of this.circuitBreakers) {
      states.set(provider, breaker.getState());
    }
    return states;
  }

  /**
   * Force circuit breaker reset for a provider
   */
  resetCircuitBreaker(provider: Provider): void {
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      // Reset by creating new circuit breaker
      this.circuitBreakers.set(provider, new CircuitBreaker());
    }
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(provider: Provider, config: ProviderConfig): void {
    this.configs.set(provider, config);
    // Reinitialize adapter with new config
    this.initializeAdapters();
  }
}
