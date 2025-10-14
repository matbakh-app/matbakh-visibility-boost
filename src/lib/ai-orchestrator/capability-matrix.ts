import { Capability, ModelSpec, Provider } from "./types";

/**
 * Comprehensive capability matrix for AI providers
 * Used by the router policy engine to make intelligent routing decisions
 */
export class CapabilityMatrix {
  private static readonly MODELS: Record<string, ModelSpec> = {
    // Bedrock Models
    "anthropic.claude-3-5-sonnet": {
      provider: "bedrock",
      modelId: "anthropic.claude-3-5-sonnet",
      capability: {
        contextTokens: 200000,
        supportsTools: true,
        supportsJson: true,
        supportsVision: true,
        costPer1kInput: 0.003, // €3 per 1M input tokens
        costPer1kOutput: 0.015, // €15 per 1M output tokens
        defaultLatencyMs: 800,
      },
    },
    "anthropic.claude-3-haiku": {
      provider: "bedrock",
      modelId: "anthropic.claude-3-haiku",
      capability: {
        contextTokens: 200000,
        supportsTools: true,
        supportsJson: true,
        supportsVision: false,
        costPer1kInput: 0.00025, // €0.25 per 1M input tokens
        costPer1kOutput: 0.00125, // €1.25 per 1M output tokens
        defaultLatencyMs: 400,
      },
    },
    "amazon.titan-text-premier": {
      provider: "bedrock",
      modelId: "amazon.titan-text-premier",
      capability: {
        contextTokens: 32000,
        supportsTools: false,
        supportsJson: true,
        supportsVision: false,
        costPer1kInput: 0.0005, // €0.5 per 1M input tokens
        costPer1kOutput: 0.0015, // €1.5 per 1M output tokens
        defaultLatencyMs: 600,
      },
    },

    // Google Models
    "gemini-1.5-pro": {
      provider: "google",
      modelId: "gemini-1.5-pro",
      capability: {
        contextTokens: 1000000,
        supportsTools: true,
        supportsJson: true,
        supportsVision: true,
        costPer1kInput: 0.0035, // €3.5 per 1M input tokens
        costPer1kOutput: 0.0105, // €10.5 per 1M output tokens
        defaultLatencyMs: 1200,
      },
    },
    "gemini-1.5-flash": {
      provider: "google",
      modelId: "gemini-1.5-flash",
      capability: {
        contextTokens: 1000000,
        supportsTools: true,
        supportsJson: true,
        supportsVision: true,
        costPer1kInput: 0.000075, // €0.075 per 1M input tokens
        costPer1kOutput: 0.0003, // €0.3 per 1M output tokens
        defaultLatencyMs: 600,
      },
    },

    // Meta Models
    "llama-3-70b": {
      provider: "meta",
      modelId: "llama-3-70b",
      capability: {
        contextTokens: 32768,
        supportsTools: false,
        supportsJson: false,
        supportsVision: false,
        costPer1kInput: 0.00265, // €2.65 per 1M input tokens
        costPer1kOutput: 0.0035, // €3.5 per 1M output tokens
        defaultLatencyMs: 1000,
      },
    },
    "llama-3-8b": {
      provider: "meta",
      modelId: "llama-3-8b",
      capability: {
        contextTokens: 32768,
        supportsTools: false,
        supportsJson: false,
        supportsVision: false,
        costPer1kInput: 0.0003, // €0.3 per 1M input tokens
        costPer1kOutput: 0.0006, // €0.6 per 1M output tokens
        defaultLatencyMs: 400,
      },
    },
  };

  /**
   * Get all available models
   */
  static getAllModels(): ModelSpec[] {
    return Object.values(this.MODELS);
  }

  /**
   * Get models by provider
   */
  static getModelsByProvider(provider: Provider): ModelSpec[] {
    return Object.values(this.MODELS).filter(
      (model) => model.provider === provider
    );
  }

  /**
   * Get model specification by ID
   */
  static getModel(modelId: string): ModelSpec | undefined {
    return this.MODELS[modelId];
  }

  /**
   * Find models that support specific capabilities
   */
  static findModelsByCapability(requirements: {
    supportsTools?: boolean;
    supportsJson?: boolean;
    supportsVision?: boolean;
    minContextTokens?: number;
    maxCostPer1kInput?: number;
    maxLatencyMs?: number;
  }): ModelSpec[] {
    return Object.values(this.MODELS).filter((model) => {
      const cap = model.capability;

      if (requirements.supportsTools && !cap.supportsTools) return false;
      if (requirements.supportsJson && !cap.supportsJson) return false;
      if (requirements.supportsVision && !cap.supportsVision) return false;
      if (
        requirements.minContextTokens &&
        cap.contextTokens < requirements.minContextTokens
      )
        return false;
      if (
        requirements.maxCostPer1kInput &&
        cap.costPer1kInput > requirements.maxCostPer1kInput
      )
        return false;
      if (
        requirements.maxLatencyMs &&
        cap.defaultLatencyMs > requirements.maxLatencyMs
      )
        return false;

      return true;
    });
  }

  /**
   * Get the most cost-effective model for given requirements
   */
  static getCheapestModel(requirements: {
    supportsTools?: boolean;
    supportsJson?: boolean;
    supportsVision?: boolean;
    minContextTokens?: number;
    maxLatencyMs?: number;
  }): ModelSpec | undefined {
    const candidates = this.findModelsByCapability(requirements);
    if (candidates.length === 0) return undefined;

    return candidates.reduce((cheapest, current) => {
      const cheapestCost =
        cheapest.capability.costPer1kInput +
        cheapest.capability.costPer1kOutput;
      const currentCost =
        current.capability.costPer1kInput + current.capability.costPer1kOutput;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  /**
   * Get the fastest model for given requirements
   */
  static getFastestModel(requirements: {
    supportsTools?: boolean;
    supportsJson?: boolean;
    supportsVision?: boolean;
    minContextTokens?: number;
    maxCostPer1kInput?: number;
  }): ModelSpec | undefined {
    const candidates = this.findModelsByCapability(requirements);
    if (candidates.length === 0) return undefined;

    return candidates.reduce((fastest, current) =>
      current.capability.defaultLatencyMs < fastest.capability.defaultLatencyMs
        ? current
        : fastest
    );
  }

  /**
   * Get the model with the largest context window for given requirements
   */
  static getLargestContextModel(requirements: {
    supportsTools?: boolean;
    supportsJson?: boolean;
    supportsVision?: boolean;
    maxCostPer1kInput?: number;
    maxLatencyMs?: number;
  }): ModelSpec | undefined {
    const candidates = this.findModelsByCapability(requirements);
    if (candidates.length === 0) return undefined;

    return candidates.reduce((largest, current) =>
      current.capability.contextTokens > largest.capability.contextTokens
        ? current
        : largest
    );
  }

  /**
   * Calculate estimated cost for a request
   */
  static estimateCost(
    modelId: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const model = this.getModel(modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000) * model.capability.costPer1kInput;
    const outputCost = (outputTokens / 1000) * model.capability.costPer1kOutput;

    return inputCost + outputCost;
  }

  /**
   * Get provider-specific routing recommendations
   */
  static getProviderRecommendations(provider: Provider): {
    cheapest: ModelSpec | undefined;
    fastest: ModelSpec | undefined;
    mostCapable: ModelSpec | undefined;
  } {
    const models = this.getModelsByProvider(provider);

    const cheapest = models.reduce((prev, current) => {
      const prevCost =
        prev.capability.costPer1kInput + prev.capability.costPer1kOutput;
      const currentCost =
        current.capability.costPer1kInput + current.capability.costPer1kOutput;
      return currentCost < prevCost ? current : prev;
    }, models[0]);

    const fastest = models.reduce(
      (prev, current) =>
        current.capability.defaultLatencyMs < prev.capability.defaultLatencyMs
          ? current
          : prev,
      models[0]
    );

    const mostCapable = models.reduce((prev, current) => {
      const prevScore = this.calculateCapabilityScore(prev.capability);
      const currentScore = this.calculateCapabilityScore(current.capability);
      return currentScore > prevScore ? current : prev;
    }, models[0]);

    return { cheapest, fastest, mostCapable };
  }

  /**
   * Calculate a capability score for ranking models
   */
  private static calculateCapabilityScore(capability: Capability): number {
    let score = 0;

    // Context tokens (normalized to 0-100)
    score += Math.min(capability.contextTokens / 10000, 100);

    // Feature support (20 points each)
    if (capability.supportsTools) score += 20;
    if (capability.supportsJson) score += 20;
    if (capability.supportsVision) score += 20;

    // Latency penalty (lower is better)
    score -= capability.defaultLatencyMs / 100;

    return score;
  }

  /**
   * Get fallback model recommendations for a given model
   */
  static getFallbackModels(primaryModelId: string): ModelSpec[] {
    const primaryModel = this.getModel(primaryModelId);
    if (!primaryModel) return [];

    // Find models with similar capabilities but different providers
    const fallbacks = Object.values(this.MODELS)
      .filter(
        (model) =>
          model.provider !== primaryModel.provider &&
          model.capability.supportsTools ===
            primaryModel.capability.supportsTools &&
          model.capability.supportsJson === primaryModel.capability.supportsJson
      )
      .sort((a, b) => {
        // Sort by capability similarity and cost
        const aScore = this.calculateCapabilityScore(a.capability);
        const bScore = this.calculateCapabilityScore(b.capability);
        return bScore - aScore;
      });

    return fallbacks.slice(0, 2); // Return top 2 fallbacks
  }
}
