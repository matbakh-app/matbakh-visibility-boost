/**
 * Bedrock Guardrails System
 *
 * Implements strict architectural guardrails for Bedrock usage:
 * - Bedrock ONLY for system/orchestrator tasks
 * - NEVER as user-worker for web tasks
 * - Automatic delegation to worker providers
 * - Telemetry tagging for role tracking
 */

import { AiRequest, AiResponse, Provider } from "./types";

export type TaskRole = "orchestrator" | "user-worker" | "audience-specialist";
export type TaskType = "system" | "user" | "audience";

export interface DelegationResult {
  shouldDelegate: boolean;
  reason: string;
  targetProviders: Provider[];
  originalProvider: Provider;
  role: TaskRole;
}

export interface GuardrailViolation {
  id: string;
  timestamp: number;
  violation:
    | "bedrock_user_task"
    | "bedrock_audience_task"
    | "invalid_delegation";
  request: {
    prompt: string;
    domain?: string;
    intent?: string;
  };
  attemptedProvider: Provider;
  correctedProvider?: Provider;
  action: "delegated" | "blocked" | "corrected";
}

/**
 * Bedrock Guardrails enforcing architectural constraints
 */
export class BedrockGuardrails {
  private violations: GuardrailViolation[] = [];
  private readonly maxViolations = 1000;

  /**
   * Check if Bedrock usage violates architectural guardrails
   */
  checkBedrockUsage(
    request: AiRequest,
    intendedProvider: Provider
  ): DelegationResult {
    const taskType = this.determineTaskType(request);
    const role = this.determineTaskRole(taskType);

    // Bedrock is only allowed for system/orchestrator tasks
    if (intendedProvider === "bedrock" && taskType !== "system") {
      const targetProviders = this.getWorkerProviders(taskType);

      this.recordViolation({
        violation:
          taskType === "audience"
            ? "bedrock_audience_task"
            : "bedrock_user_task",
        request: {
          prompt: request.prompt.substring(0, 200),
          domain: request.context.domain,
          intent: request.context.intent,
        },
        attemptedProvider: intendedProvider,
        correctedProvider: targetProviders[0],
        action: "delegated",
      });

      return {
        shouldDelegate: true,
        reason: `Bedrock not allowed for ${taskType} tasks - delegating to ${targetProviders.join(
          ", "
        )}`,
        targetProviders,
        originalProvider: intendedProvider,
        role,
      };
    }

    // Allow Bedrock for system tasks
    if (intendedProvider === "bedrock" && taskType === "system") {
      return {
        shouldDelegate: false,
        reason: "Bedrock allowed for system/orchestrator tasks",
        targetProviders: [],
        originalProvider: intendedProvider,
        role: "orchestrator",
      };
    }

    // No delegation needed for non-Bedrock providers
    return {
      shouldDelegate: false,
      reason: "Non-Bedrock provider - no guardrail restrictions",
      targetProviders: [],
      originalProvider: intendedProvider,
      role,
    };
  }

  /**
   * Execute request with guardrail enforcement
   */
  async executeWithGuardrails(
    request: AiRequest,
    intendedProvider: Provider,
    executeFunction: (provider: Provider, role: TaskRole) => Promise<AiResponse>
  ): Promise<AiResponse> {
    const delegationResult = this.checkBedrockUsage(request, intendedProvider);

    if (delegationResult.shouldDelegate) {
      // Try delegation to worker providers
      const errors: Error[] = [];

      for (const targetProvider of delegationResult.targetProviders) {
        try {
          console.log(
            `🔄 Delegating from ${intendedProvider} to ${targetProvider} for ${this.determineTaskType(
              request
            )} task`
          );

          const response = await executeFunction(
            targetProvider,
            delegationResult.role
          );

          // Tag response with delegation info
          return {
            ...response,
            provider: targetProvider,
            metadata: {
              ...response.metadata,
              delegated: true,
              originalProvider: intendedProvider,
              delegationReason: delegationResult.reason,
              role: delegationResult.role,
            },
          };
        } catch (error) {
          errors.push(
            error instanceof Error ? error : new Error(String(error))
          );
          console.warn(`Delegation to ${targetProvider} failed:`, error);
        }
      }

      // All delegations failed
      this.recordViolation({
        violation: "invalid_delegation",
        request: {
          prompt: request.prompt.substring(0, 200),
          domain: request.context.domain,
          intent: request.context.intent,
        },
        attemptedProvider: intendedProvider,
        action: "blocked",
      });

      throw new Error(
        `All providers failed: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    // Execute with original provider (allowed by guardrails)
    return executeFunction(intendedProvider, delegationResult.role);
  }

  /**
   * Determine task type from request
   */
  determineTaskType(request: AiRequest): TaskType {
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

    const promptLower = request.prompt.toLowerCase();

    // Check for system tasks
    if (
      systemKeywords.some((keyword) => promptLower.includes(keyword)) ||
      request.context.domain === "system" ||
      request.context.domain === "infrastructure" ||
      request.context.intent === "orchestration"
    ) {
      return "system";
    }

    // Check for audience analysis tasks
    if (
      audienceKeywords.some((keyword) => promptLower.includes(keyword)) ||
      ["marketing", "analytics", "research"].includes(
        request.context.domain || ""
      ) ||
      request.context.intent === "audience_analysis"
    ) {
      return "audience";
    }

    // Default to user task
    return "user";
  }

  /**
   * Determine task role from task type
   */
  determineTaskRole(taskType: TaskType): TaskRole {
    switch (taskType) {
      case "system":
        return "orchestrator";
      case "audience":
        return "audience-specialist";
      case "user":
        return "user-worker";
      default:
        return "user-worker";
    }
  }

  /**
   * Get appropriate worker providers for task type
   */
  getWorkerProviders(taskType: TaskType): Provider[] {
    switch (taskType) {
      case "system":
        return ["bedrock", "google", "meta"]; // Bedrock allowed for system
      case "audience":
        return ["meta", "google", "bedrock"]; // Meta preferred for audience
      case "user":
        return ["google", "meta", "bedrock"]; // Google preferred for user
      default:
        return ["google", "meta"]; // Exclude Bedrock by default
    }
  }

  /**
   * Get provider priority order with explicit preference
   */
  getOrderedProvidersFor(request: AiRequest): Provider[] {
    // Explicit provider preference overrides heuristics
    if (request.context.preferredProvider) {
      const preferred = request.context.preferredProvider as Provider;
      const others = (["bedrock", "google", "meta"] as Provider[]).filter(
        (p) => p !== preferred
      );
      return [preferred, ...others];
    }

    const taskType = this.determineTaskType(request);
    return this.getWorkerProviders(taskType);
  }

  /**
   * Get guardrail violations summary
   */
  getViolationsSummary(timeWindowMs = 24 * 60 * 60 * 1000): {
    totalViolations: number;
    violationsByType: Map<string, number>;
    recentViolations: GuardrailViolation[];
    topViolatedDomains: Array<{ domain: string; count: number }>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentViolations = this.violations.filter(
      (v) => v.timestamp > cutoff
    );

    const violationsByType = new Map<string, number>();
    const domainCounts = new Map<string, number>();

    for (const violation of recentViolations) {
      // Count by violation type
      const count = violationsByType.get(violation.violation) || 0;
      violationsByType.set(violation.violation, count + 1);

      // Count by domain
      const domain = violation.request.domain || "unknown";
      const domainCount = domainCounts.get(domain) || 0;
      domainCounts.set(domain, domainCount + 1);
    }

    const topViolatedDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalViolations: recentViolations.length,
      violationsByType,
      recentViolations: recentViolations.slice(-10), // Last 10
      topViolatedDomains,
    };
  }

  /**
   * Check if provider/task combination is compliant
   */
  isCompliant(provider: Provider, taskType: TaskType): boolean {
    if (provider === "bedrock" && taskType !== "system") {
      return false;
    }
    return true;
  }

  /**
   * Get compliance status for all provider/task combinations
   */
  getComplianceMatrix(): Array<{
    provider: Provider;
    taskType: TaskType;
    compliant: boolean;
    reason: string;
  }> {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    const taskTypes: TaskType[] = ["system", "user", "audience"];
    const matrix = [];

    for (const provider of providers) {
      for (const taskType of taskTypes) {
        const compliant = this.isCompliant(provider, taskType);
        let reason = "";

        if (provider === "bedrock") {
          reason =
            taskType === "system"
              ? "Bedrock allowed for system/orchestrator tasks"
              : "Bedrock restricted to system tasks only";
        } else {
          reason = "Non-Bedrock provider - no restrictions";
        }

        matrix.push({
          provider,
          taskType,
          compliant,
          reason,
        });
      }
    }

    return matrix;
  }

  /**
   * Record guardrail violation
   */
  private recordViolation(
    violationData: Omit<GuardrailViolation, "id" | "timestamp">
  ): void {
    const violation: GuardrailViolation = {
      id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...violationData,
    };

    this.violations.push(violation);

    // Maintain memory limits
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations);
    }

    console.warn(`🚫 Bedrock Guardrail Violation: ${violation.violation}`, {
      attemptedProvider: violation.attemptedProvider,
      correctedProvider: violation.correctedProvider,
      action: violation.action,
      domain: violation.request.domain,
    });
  }

  /**
   * Reset violations (for testing)
   */
  reset(): void {
    this.violations = [];
  }
}

// Singleton instance
export const bedrockGuardrails = new BedrockGuardrails();
