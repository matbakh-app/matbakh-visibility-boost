import { randomUUID } from "crypto";
import { BedrockAdapter } from "./adapters/bedrock-adapter";
import { GoogleAdapter } from "./adapters/google-adapter";
import { MetaAdapter } from "./adapters/meta-adapter";
import { ToolCallAdapter } from "./adapters/tool-call-adapter";
import { p95LatencyMonitor } from "./p95-latency-monitor";
import { RouterPolicyEngine } from "./router-policy-engine";
import {
  AiRequest,
  AiResponse,
  ModelSpec,
  RouterInputContext,
  ToolSpec,
} from "./types";

export interface AiRouterGatewayOptions {
  models: ModelSpec[];
  defaultTemperature?: number;
  enableCaching?: boolean;
  enableMetrics?: boolean;
}

export class AiRouterGateway {
  private readonly engine: RouterPolicyEngine;
  private readonly adapters: Record<string, ToolCallAdapter> = {
    bedrock: new BedrockAdapter(),
    google: new GoogleAdapter(),
    meta: new MetaAdapter(),
  } as const;

  constructor(private readonly options: AiRouterGatewayOptions) {
    this.engine = new RouterPolicyEngine({
      models: options.models,
      defaultTemperature: options.defaultTemperature,
    });
  }

  /**
   * Route a request to the appropriate provider and return routing information
   * Implements intelligent provider selection based on task type:
   * - Bedrock: System/Orchestration tasks (Priority 1)
   * - Google: User-facing tasks (Priority 2)
   * - Meta: Audience analysis tasks (Priority 3)
   */
  route(prompt: string, ctx: RouterInputContext, tools?: ToolSpec[]) {
    // Determine task type and get provider priority order
    const providerPriority = this.determineProviderPriority(prompt, ctx, tools);

    // Use the policy engine with provider priority
    const decision = this.engine.decide(ctx, tools, providerPriority);
    const adapter = this.adapters[decision.provider];

    if (!adapter) {
      throw new Error(`No adapter found for provider: ${decision.provider}`);
    }

    const payload = adapter.buildRequest({
      prompt,
      decision,
      streaming: false,
      maxTokens: this.getMaxTokens(ctx),
    });

    return { decision, adapter, payload };
  }

  /**
   * Determine provider priority based on task type
   */
  private determineProviderPriority(
    prompt: string,
    ctx: RouterInputContext,
    tools?: ToolSpec[]
  ): string[] {
    // 1. Bedrock for System/Orchestration tasks (Priority 1)
    if (this.isSystemTask(prompt, ctx, tools)) {
      return ["bedrock", "google", "meta"];
    }

    // 2. Meta for Audience Analysis tasks (Priority 3)
    if (this.isAudienceAnalysisTask(prompt, ctx)) {
      return ["meta", "google", "bedrock"];
    }

    // 3. Google for all other User tasks (Priority 2)
    return ["google", "meta", "bedrock"];
  }

  /**
   * Check if this is a system/orchestration task
   */
  private isSystemTask(
    prompt: string,
    ctx: RouterInputContext,
    tools?: ToolSpec[]
  ): boolean {
    // System task indicators
    const systemKeywords = [
      "orchestrate",
      "manage",
      "coordinate",
      "delegate",
      "system",
      "infrastructure",
      "deployment",
      "monitoring",
      "scaling",
      "create agent",
      "new agent",
      "agent creation",
      "workflow",
    ];

    const promptLower = prompt.toLowerCase();
    const hasSystemKeywords = systemKeywords.some((keyword) =>
      promptLower.includes(keyword)
    );

    // Check for system domains
    const isSystemDomain =
      ctx.domain === "system" || ctx.domain === "infrastructure";

    // Check for orchestration tools
    const hasOrchestrationTools = tools?.some((tool) =>
      ["orchestrate", "manage", "coordinate", "system"].some((keyword) =>
        tool.name.toLowerCase().includes(keyword)
      )
    );

    return hasSystemKeywords || isSystemDomain || !!hasOrchestrationTools;
  }

  /**
   * Check if this is an audience analysis task
   */
  private isAudienceAnalysisTask(
    prompt: string,
    ctx: RouterInputContext
  ): boolean {
    // Audience analysis indicators
    const audienceKeywords = [
      "audience",
      "target group",
      "demographics",
      "market segment",
      "customer persona",
      "user persona",
      "reach analysis",
      "zielgruppe",
      "reichweite",
      "demografie",
      "marktsegment",
    ];

    const promptLower = prompt.toLowerCase();
    const hasAudienceKeywords = audienceKeywords.some((keyword) =>
      promptLower.includes(keyword)
    );

    // Check for audience-related domains
    const isAudienceDomain = ["marketing", "analytics", "research"].includes(
      ctx.domain || ""
    );

    return hasAudienceKeywords || isAudienceDomain;
  }

  /**
   * Execute a complete AI request with routing, provider call, and response parsing
   */
  async execute(request: AiRequest): Promise<AiResponse> {
    const requestId = randomUUID();
    const startTime = Date.now();

    // Determine operation type for P95 monitoring
    const operation = this.determineOperationType(request);

    // Record request start for P95 monitoring
    p95LatencyMonitor.recordRequestStart(requestId, operation);

    try {
      // Route the request
      const { decision, adapter, payload } = this.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Check cache first for RAG/cached operations
      let cacheHit = false;
      if (operation === "rag" || operation === "cached") {
        const cachedResponse = await this.checkCache(request);
        if (cachedResponse) {
          cacheHit = true;

          // Record P95 metrics for cache hit
          p95LatencyMonitor.recordRequestComplete(
            requestId,
            decision.provider,
            decision.modelId,
            true, // cache hit
            (cachedResponse.tokensUsed?.input || 0) +
              (cachedResponse.tokensUsed?.output || 0),
            0 // no cost for cached responses
          );

          return {
            provider: decision.provider,
            modelId: decision.modelId,
            text: cachedResponse.text,
            toolCalls: cachedResponse.toolCalls,
            latencyMs: Date.now() - startTime,
            costEuro: 0,
            success: true,
            requestId,
          };
        }
      }

      // Execute the provider call (placeholder - implement actual provider SDKs)
      const providerResponse = await this.callProvider(
        decision.provider,
        payload
      );

      // Parse the response
      const parsedResponse = adapter.parseResponse(providerResponse);

      // Calculate metrics
      const latencyMs = Date.now() - startTime;
      const costEuro = this.calculateCost(decision, parsedResponse.tokensUsed);

      const response: AiResponse = {
        provider: decision.provider,
        modelId: decision.modelId,
        text: parsedResponse.text,
        toolCalls: parsedResponse.toolCalls,
        latencyMs,
        costEuro,
        success: true,
        requestId,
      };

      // Record P95 metrics for successful request
      p95LatencyMonitor.recordRequestComplete(
        requestId,
        decision.provider,
        decision.modelId,
        cacheHit,
        (parsedResponse.tokensUsed?.input || 0) +
          (parsedResponse.tokensUsed?.output || 0),
        costEuro
      );

      // Cache the response for future RAG requests
      if (operation === "rag" && this.options.enableCaching) {
        await this.cacheResponse(request, parsedResponse);
      }

      // Log metrics if enabled
      if (this.options.enableMetrics) {
        await this.logMetrics(request, response, decision);
      }

      return response;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Record P95 metrics for failed request
      p95LatencyMonitor.recordRequestComplete(
        requestId,
        "unknown",
        "unknown",
        false
      );

      return {
        provider: "unknown" as any,
        modelId: "unknown",
        latencyMs,
        costEuro: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        requestId,
      };
    }
  }

  /**
   * Get available models for a given context
   */
  getAvailableModels(context: RouterInputContext): ModelSpec[] {
    return this.engine.getAvailableModels(context);
  }

  /**
   * Update model capabilities based on observed performance
   */
  updateModelCapability(
    provider: string,
    modelId: string,
    updates: Partial<ModelSpec["capability"]>
  ): void {
    this.engine.updateModelCapability(provider, modelId, updates);
  }

  private getMaxTokens(ctx: RouterInputContext): number {
    // Adjust max tokens based on context
    switch (ctx.domain) {
      case "legal":
      case "medical":
        return 2048; // Longer responses for complex domains
      case "support":
        return 512; // Shorter responses for support
      default:
        return 1024;
    }
  }

  private async callProvider(provider: string, payload: any): Promise<any> {
    // Placeholder for actual provider SDK calls
    // In real implementation, this would call:
    // - AWS Bedrock Runtime for 'bedrock'
    // - Google Generative AI SDK for 'google'
    // - Meta API or Bedrock for 'meta'

    switch (provider) {
      case "bedrock":
        return this.callBedrock(payload);
      case "google":
        return this.callGoogle(payload);
      case "meta":
        return this.callMeta(payload);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callBedrock(payload: any): Promise<any> {
    // TODO: Implement actual Bedrock Runtime call
    // const client = new BedrockRuntimeClient({});
    // const command = new InvokeModelCommand(payload);
    // return await client.send(command);

    // Mock response for now
    return {
      body: JSON.stringify({
        content: [{ text: `[Bedrock Mock] Response to: ${payload.body}` }],
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    };
  }

  private async callGoogle(payload: any): Promise<any> {
    // TODO: Implement actual Google Generative AI call
    // const genAI = new GoogleGenerativeAI(apiKey);
    // const model = genAI.getGenerativeModel({ model: modelId });
    // return await model.generateContent(payload);

    // Mock response for now
    return {
      candidates: [
        {
          content: {
            parts: [
              { text: `[Google Mock] Response to: ${JSON.stringify(payload)}` },
            ],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
    };
  }

  private async callMeta(payload: any): Promise<any> {
    // TODO: Implement actual Meta/Llama call
    // This could be via Bedrock or direct endpoint

    // Mock response for now
    return {
      generated_text: `[Meta Mock] Response to: ${payload.prompt}`,
      prompt_token_count: 10,
      generation_token_count: 20,
    };
  }

  private calculateCost(
    decision: any,
    tokensUsed?: { input: number; output: number }
  ): number {
    if (!tokensUsed) return 0;

    const model = this.options.models.find(
      (m) => m.provider === decision.provider && m.modelId === decision.modelId
    );

    if (!model) return 0;

    const inputCost =
      (tokensUsed.input / 1000) * model.capability.costPer1kInput;
    const outputCost =
      (tokensUsed.output / 1000) * model.capability.costPer1kOutput;

    return inputCost + outputCost;
  }

  private async logMetrics(
    request: AiRequest,
    response: AiResponse,
    decision: any
  ): Promise<void> {
    // TODO: Implement metrics logging to CloudWatch/Evidently
    console.log("AI Request Metrics:", {
      requestId: response.requestId,
      provider: response.provider,
      modelId: response.modelId,
      latencyMs: response.latencyMs,
      costEuro: response.costEuro,
      success: response.success,
      domain: request.context.domain,
      hasTools: !!request.tools?.length,
    });
  }

  /**
   * Determine operation type for P95 monitoring
   */
  private determineOperationType(
    request: AiRequest
  ): "generation" | "rag" | "cached" {
    // Check if this is a RAG request (retrieval-related domains or keywords)
    const ragKeywords = [
      "search",
      "find",
      "lookup",
      "retrieve",
      "what is",
      "how to",
    ];
    const promptLower = request.prompt.toLowerCase();
    const hasRagKeywords = ragKeywords.some((keyword) =>
      promptLower.includes(keyword)
    );

    if (hasRagKeywords || request.context.domain === "support") {
      return "rag";
    }

    // Check if this is a cached request (simple, short queries)
    if (
      request.prompt.length < 100 &&
      !request.tools?.length &&
      hasRagKeywords
    ) {
      return "cached";
    }

    // Default to generation for complex requests
    return "generation";
  }

  /**
   * Check cache for existing response
   */
  private async checkCache(request: AiRequest): Promise<any | null> {
    // TODO: Implement actual cache lookup (Redis/ElastiCache)
    // For now, return null (no cache hit)
    return null;
  }

  /**
   * Cache response for future requests
   */
  private async cacheResponse(
    request: AiRequest,
    response: any
  ): Promise<void> {
    // TODO: Implement actual cache storage (Redis/ElastiCache)
    // For now, just log the caching action
    console.log("Caching response for future RAG requests:", {
      promptHash: this.hashPrompt(request.prompt),
      responseLength: response.text?.length || 0,
    });
  }

  /**
   * Generate hash for prompt caching
   */
  private hashPrompt(prompt: string): string {
    // Simple hash for demonstration - use proper hashing in production
    return Buffer.from(prompt).toString("base64").substring(0, 32);
  }

  /**
   * Get P95 latency performance status
   */
  getP95PerformanceStatus() {
    return p95LatencyMonitor.getPerformanceStatus();
  }

  /**
   * Get detailed P95 performance report
   */
  getP95PerformanceReport() {
    return p95LatencyMonitor.getPerformanceReport();
  }
}
