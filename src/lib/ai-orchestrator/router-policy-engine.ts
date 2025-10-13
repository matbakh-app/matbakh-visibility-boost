import {
  ModelSpec,
  RouteDecision,
  RouterInputContext,
  ToolSpec,
} from "./types";

export interface RouterPolicyEngineOpts {
  models: ModelSpec[];
  defaultTemperature?: number;
}

export class RouterPolicyEngine {
  constructor(private readonly opts: RouterPolicyEngineOpts) {}

  decide(
    input: RouterInputContext,
    tools?: ToolSpec[],
    providerPriority?: string[]
  ): RouteDecision {
    // 1) Filter by hard constraints (tools, context length, budget)
    let candidates = this.opts.models.filter((m) => {
      if (input.requireTools && !m.capability.supportsTools) return false;

      // Budget constraint
      if (input.maxCostEuro && m.capability.costPer1kInput > input.maxCostEuro)
        return false;

      // Domain-specific filtering
      if (input.domain === "legal" && m.provider === "meta") return false; // Example constraint

      return true;
    });

    // 2) Apply provider priority if specified
    if (providerPriority && providerPriority.length > 0) {
      candidates = candidates.sort((a, b) => {
        const aPriority = providerPriority.indexOf(a.provider);
        const bPriority = providerPriority.indexOf(b.provider);

        // If provider not in priority list, put it at the end
        const aIndex = aPriority === -1 ? 999 : aPriority;
        const bIndex = bPriority === -1 ? 999 : bPriority;

        return aIndex - bIndex;
      });
    }

    // 3) Multi-criteria scoring with proper weighting
    const sla = input.slaMs ?? 1500;
    const score = (m: ModelSpec) => {
      const latencyScore = Math.max(0, 2 - m.capability.defaultLatencyMs / sla); // Higher weight for latency
      const costScore = this.getCostScore(m, input.budgetTier);
      const toolScore =
        input.requireTools && m.capability.supportsTools ? 0.5 : 0;
      const domainScore = this.getDomainScore(m, input.domain);

      // Add provider priority bonus
      const priorityBonus = providerPriority
        ? Math.max(
            0,
            (providerPriority.length - providerPriority.indexOf(m.provider)) *
              0.1
          )
        : 0;

      return latencyScore + costScore + toolScore + domainScore + priorityBonus;
    };

    if (candidates.length === 0) {
      throw new Error("No model candidates match constraints");
    }

    candidates = candidates.sort((a, b) => score(b) - score(a));
    const chosen = candidates[0];

    const priorityInfo = providerPriority
      ? ` (priority: ${providerPriority.join(" > ")})`
      : "";

    return {
      provider: chosen.provider,
      modelId: chosen.modelId,
      temperature: this.getTemperature(input, chosen),
      tools,
      reason: `picked ${chosen.modelId} (provider=${
        chosen.provider
      }) by score: ${score(chosen).toFixed(3)}${priorityInfo}`,
    };
  }

  private getCostScore(model: ModelSpec, budgetTier?: string): number {
    switch (budgetTier) {
      case "low":
        return 1 - model.capability.costPer1kInput / 0.01; // Normalize against max expected cost
      case "premium":
        return 0.5; // Cost less important for premium tier
      default:
        return 0.7 - model.capability.costPer1kInput / 0.005;
    }
  }

  private getDomainScore(model: ModelSpec, domain?: string): number {
    // Domain-specific model preferences with stronger weights
    switch (domain) {
      case "legal":
        return model.provider === "bedrock" ? 1.0 : 0.2; // Strong preference for Claude for legal
      case "culinary":
        return model.provider === "google" ? 1.0 : 0.2; // Strong preference for Gemini for culinary
      case "medical":
        return model.provider === "bedrock" ? 1.0 : 0.0; // Only Claude for medical
      default:
        return 0.5; // Neutral for general domain
    }
  }

  private getTemperature(input: RouterInputContext, model: ModelSpec): number {
    // Domain-specific temperature adjustments
    const baseTemp = this.opts.defaultTemperature ?? 0.2;

    switch (input.domain) {
      case "legal":
      case "medical":
        return Math.min(baseTemp, 0.1); // Lower temperature for precision domains
      case "culinary":
        return Math.min(baseTemp + 0.1, 0.7); // Slightly higher for creativity
      default:
        return baseTemp;
    }
  }

  // Method to update model capabilities (for dynamic learning)
  updateModelCapability(
    provider: string,
    modelId: string,
    updates: Partial<ModelSpec["capability"]>
  ): void {
    const model = this.opts.models.find(
      (m) => m.provider === provider && m.modelId === modelId
    );
    if (model) {
      Object.assign(model.capability, updates);
    }
  }

  // Get available models for a given context
  getAvailableModels(input: RouterInputContext): ModelSpec[] {
    return this.opts.models.filter((m) => {
      if (input.requireTools && !m.capability.supportsTools) return false;
      if (input.maxCostEuro && m.capability.costPer1kInput > input.maxCostEuro)
        return false;
      return true;
    });
  }
}
