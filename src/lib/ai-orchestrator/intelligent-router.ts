/**
 * Intelligent Router - Hybrid Routing for Bedrock Support Operations
 *
 * This module implements intelligent routing decisions between direct Bedrock access
 * and MCP integration based on operation type, priority, latency requirements,
 * and system health status.
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";
import {
  DirectBedrockClient,
  OperationPriority,
  OperationType,
  SupportOperationRequest,
  SupportOperationResponse,
} from "./direct-bedrock-client";
import {
  GDPRHybridComplianceValidator,
  HybridRoutingPath,
} from "./gdpr-hybrid-compliance-validator";
import { MCPFallbackReliabilitySystem } from "./mcp-fallback-reliability-system";
import { MCPRouter } from "./mcp-router";

// Routing Decision Matrix Configuration
export interface RoutingRule {
  operationType: OperationType;
  priority: OperationPriority;
  latencyRequirement: number; // milliseconds
  primaryRoute: RouteType;
  fallbackRoute: RouteType | null;
  healthCheckRequired: boolean;
}

export type RouteType = "direct" | "mcp";

// Routing Decision Result
export interface RoutingDecision {
  selectedRoute: RouteType;
  reason: string;
  fallbackAvailable: boolean;
  estimatedLatency: number;
  correlationId: string;
  timestamp: Date;
}

// Route Health Status
export interface RouteHealth {
  route: RouteType;
  isHealthy: boolean;
  latencyMs: number;
  successRate: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

// Routing Efficiency Metrics
export interface RoutingEfficiency {
  totalRequests: number;
  directRouteUsage: number;
  mcpRouteUsage: number;
  fallbackUsage: number;
  averageLatency: number;
  successRate: number;
  costEfficiency: number;
  optimizationRecommendations: string[];
}

// Import MCP Router from implementation
export { MCPRouter } from "./mcp-router";

/**
 * Intelligent Router for Hybrid Bedrock/MCP Operations
 */
export class IntelligentRouter {
  private directBedrockClient: DirectBedrockClient;
  private mcpRouter: MCPRouter | null = null;
  private featureFlags: AiFeatureFlags;
  private circuitBreaker: CircuitBreaker;
  private gdprHybridValidator: GDPRHybridComplianceValidator;
  private auditTrail: AuditTrailSystem;
  private mcpFallbackSystem: MCPFallbackReliabilitySystem | null = null;
  private costOptimizer: IntelligentRoutingCostOptimizer | null = null;

  // Routing configuration
  private routingRules: RoutingRule[];
  private routeHealthStatus: Map<RouteType, RouteHealth>;
  private routingMetrics: RoutingEfficiency;
  private healthCheckInterval?: NodeJS.Timeout;

  // Default routing decision matrix
  private readonly defaultRoutingRules: RoutingRule[] = [
    {
      operationType: "emergency",
      priority: "critical",
      latencyRequirement: 5000, // < 5s
      primaryRoute: "direct",
      fallbackRoute: null, // No fallback for emergency
      healthCheckRequired: true,
    },
    {
      operationType: "infrastructure",
      priority: "critical",
      latencyRequirement: 10000, // < 10s
      primaryRoute: "direct",
      fallbackRoute: "mcp",
      healthCheckRequired: true,
    },
    {
      operationType: "meta_monitor",
      priority: "high",
      latencyRequirement: 15000, // < 15s
      primaryRoute: "direct",
      fallbackRoute: "mcp",
      healthCheckRequired: true,
    },
    {
      operationType: "implementation",
      priority: "high",
      latencyRequirement: 15000, // < 15s
      primaryRoute: "direct",
      fallbackRoute: "mcp",
      healthCheckRequired: true,
    },
    {
      operationType: "standard",
      priority: "medium",
      latencyRequirement: 30000, // < 30s
      primaryRoute: "mcp",
      fallbackRoute: "direct",
      healthCheckRequired: false,
    },
  ];

  constructor(directBedrockClient: DirectBedrockClient, mcpRouter?: MCPRouter) {
    this.directBedrockClient = directBedrockClient;
    this.mcpRouter = mcpRouter || null;
    this.featureFlags = new AiFeatureFlags();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000,
      halfOpenMaxCalls: 2,
    });
    this.gdprHybridValidator = new GDPRHybridComplianceValidator();

    // Initialize audit trail system
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 2555, // 7 years for GDPR compliance
    });

    // Initialize routing configuration
    this.routingRules = [...this.defaultRoutingRules];
    this.routeHealthStatus = new Map();
    this.routingMetrics = this.initializeMetrics();

    // Initialize MCP fallback reliability system if MCP router is available
    if (this.mcpRouter) {
      try {
        this.mcpFallbackSystem = new MCPFallbackReliabilitySystem(
          this.mcpRouter
        );
      } catch (error) {
        // In test environments, the class might be mocked
        console.warn("Failed to initialize MCP fallback system:", error);
        this.mcpFallbackSystem = null;
      }
    }

    // Initialize health monitoring
    this.initializeHealthMonitoring();
    this.startHealthMonitoring();
  }

  /**
   * Execute support operation with intelligent routing
   */
  async executeSupportOperation(
    request: SupportOperationRequest
  ): Promise<SupportOperationResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      // Make cost-aware routing decision if cost optimizer is available
      let decision: RoutingDecision | CostAwareRoutingDecision;

      if (
        this.costOptimizer &&
        this.featureFlags.isEnabled("intelligent_routing_cost_optimization")
      ) {
        decision = await this.costOptimizer.makeCostAwareRoutingDecision(
          request
        );
        console.log(
          `[IntelligentRouter] Cost-aware routing: ${
            decision.selectedRoute
          } (savings: $${(
            decision as CostAwareRoutingDecision
          ).costSavings.toFixed(4)})`
        );
      } else {
        decision = await this.makeRoutingDecision(request, correlationId);
      }

      // Log routing decision to audit trail
      await this.auditTrail.logHybridRoutingDecision(
        correlationId,
        decision,
        request.operation,
        request.priority
      );

      // Log routing decision (console logging)
      this.logRoutingDecision(decision, request);

      // Execute operation on selected route
      const response = await this.executeOnRoute(
        decision.selectedRoute,
        request
      );

      // Update metrics on success
      this.updateMetrics(decision, response, Date.now() - startTime, true);

      // Add routing information to response
      const enhancedResponse = {
        ...response,
        operationId: `${response.operationId}-${decision.selectedRoute}`,
      };

      // Add cost information if available
      if ("costSavings" in decision) {
        (enhancedResponse as any).costSavings = decision.costSavings;
        (enhancedResponse as any).estimatedCost = decision.estimatedCost;
      }

      return enhancedResponse;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Try fallback if available
      const fallbackResponse = await this.tryFallback(
        request,
        error as Error,
        correlationId
      );
      if (fallbackResponse) {
        // Log successful fallback to audit trail
        await this.auditTrail.logIntelligentRoutingFallback(
          correlationId,
          "direct", // Assuming primary was direct
          "mcp", // Fallback to MCP
          "Primary route failed",
          request.operation,
          error instanceof Error ? error.message : "Unknown error"
        );

        this.updateMetrics(
          {
            selectedRoute: "mcp",
            reason: "fallback",
            fallbackAvailable: true,
            estimatedLatency: latencyMs,
            correlationId,
            timestamp: new Date(),
          },
          fallbackResponse,
          latencyMs,
          true
        );
        return fallbackResponse;
      }

      // Update metrics on failure
      this.updateMetrics(
        {
          selectedRoute: "direct",
          reason: "error",
          fallbackAvailable: false,
          estimatedLatency: latencyMs,
          correlationId,
          timestamp: new Date(),
        },
        null,
        latencyMs,
        false
      );

      // Return error response
      return {
        success: false,
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown routing error",
        operationId: `${correlationId}-error`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Make intelligent routing decision based on rules and health
   */
  async makeRoutingDecision(
    request: SupportOperationRequest,
    correlationId: string
  ): Promise<RoutingDecision> {
    // Find matching routing rule
    const rule = this.findMatchingRule(request);
    if (!rule) {
      throw new Error(
        `No routing rule found for operation: ${request.operation}`
      );
    }

    // Validate GDPR compliance for the intended routing path
    await this.validateGDPRComplianceForRouting(request, rule, correlationId);

    // Check if intelligent routing is enabled
    if (!this.featureFlags.isEnabled("ENABLE_INTELLIGENT_ROUTING")) {
      return {
        selectedRoute: "mcp", // Default to MCP when intelligent routing disabled
        reason: "Intelligent routing disabled, using MCP",
        fallbackAvailable: false,
        estimatedLatency: 30000,
        correlationId,
        timestamp: new Date(),
      };
    }

    // Check primary route health
    const primaryRouteHealth = await this.checkRouteHealth(rule.primaryRoute);

    // If primary route is healthy, use it
    if (primaryRouteHealth.isHealthy) {
      return {
        selectedRoute: rule.primaryRoute,
        reason: `Primary route (${rule.primaryRoute}) is healthy`,
        fallbackAvailable: rule.fallbackRoute !== null,
        estimatedLatency: primaryRouteHealth.latencyMs,
        correlationId,
        timestamp: new Date(),
      };
    }

    // Primary route unhealthy, try fallback
    if (rule.fallbackRoute) {
      const fallbackRouteHealth = await this.checkRouteHealth(
        rule.fallbackRoute
      );

      if (fallbackRouteHealth.isHealthy) {
        return {
          selectedRoute: rule.fallbackRoute,
          reason: `Primary route unhealthy, using fallback (${rule.fallbackRoute})`,
          fallbackAvailable: false, // Already using fallback
          estimatedLatency: fallbackRouteHealth.latencyMs,
          correlationId,
          timestamp: new Date(),
        };
      }
    }

    // Both routes unhealthy or no fallback available
    if (request.operation === "emergency") {
      // For emergency operations, force direct route even if unhealthy
      return {
        selectedRoute: "direct",
        reason:
          "Emergency operation - forcing direct route despite health issues",
        fallbackAvailable: false,
        estimatedLatency: 5000,
        correlationId,
        timestamp: new Date(),
      };
    }

    // Default to primary route and let circuit breaker handle failures
    return {
      selectedRoute: rule.primaryRoute,
      reason:
        "All routes unhealthy, using primary route with circuit breaker protection",
      fallbackAvailable: rule.fallbackRoute !== null,
      estimatedLatency: rule.latencyRequirement,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Execute operation on selected route
   */
  private async executeOnRoute(
    route: RouteType,
    request: SupportOperationRequest
  ): Promise<SupportOperationResponse> {
    switch (route) {
      case "direct":
        return await this.directBedrockClient.executeSupportOperation(request);

      case "mcp":
        if (!this.mcpRouter) {
          throw new Error("MCP router not available");
        }
        return await this.mcpRouter.executeSupportOperation(request);

      default:
        throw new Error(`Unknown route type: ${route}`);
    }
  }

  /**
   * Try fallback route on primary route failure with reliability system
   */
  private async tryFallback(
    request: SupportOperationRequest,
    primaryError: Error,
    correlationId: string
  ): Promise<SupportOperationResponse | null> {
    const rule = this.findMatchingRule(request);
    if (!rule || !rule.fallbackRoute) {
      return null; // No fallback available
    }

    try {
      console.log(
        `Primary route failed (${primaryError.message}), trying fallback: ${rule.fallbackRoute}`
      );

      // Use MCP fallback reliability system if available and fallback is MCP
      if (rule.fallbackRoute === "mcp" && this.mcpFallbackSystem) {
        const fallbackResult =
          await this.mcpFallbackSystem.executeFallbackOperation(
            request,
            correlationId,
            primaryError.message
          );

        if (fallbackResult.success && fallbackResult.response) {
          // Add fallback information to response
          return {
            ...fallbackResult.response,
            operationId: `${fallbackResult.response.operationId}-fallback-reliable`,
          };
        } else {
          throw new Error(fallbackResult.error || "MCP fallback failed");
        }
      } else {
        // Use standard fallback execution
        const response = await this.executeOnRoute(rule.fallbackRoute, request);

        // Add fallback information to response
        return {
          ...response,
          operationId: `${response.operationId}-fallback`,
        };
      }
    } catch (fallbackError) {
      console.error(`Fallback route also failed:`, fallbackError);
      return null;
    }
  }

  /**
   * Find matching routing rule for request
   */
  private findMatchingRule(
    request: SupportOperationRequest
  ): RoutingRule | null {
    const exactMatch = this.routingRules.find(
      (rule) =>
        rule.operationType === request.operation &&
        rule.priority === request.priority
    );

    if (exactMatch) return exactMatch;

    const operationMatch = this.routingRules.find(
      (rule) => rule.operationType === request.operation
    );

    if (operationMatch) return operationMatch;

    // Development fallback for unknown operations
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `No routing rule found for operation: ${request.operation}, using development fallback`
      );

      // Create a fallback rule based on operation type
      const fallbackRoute: RouteType =
        request.operation === "emergency" ||
        request.operation === "infrastructure" ||
        request.operation === "meta_monitor" ||
        request.operation === "implementation"
          ? "direct"
          : "mcp";

      return {
        operationType: request.operation,
        priority: request.priority || "medium",
        latencyRequirement: 30000,
        primaryRoute: fallbackRoute,
        fallbackRoute: fallbackRoute === "direct" ? "mcp" : "direct",
        healthCheckRequired: true,
      };
    }

    return null;
  }

  /**
   * Check route health status
   */
  async checkRouteHealth(route: RouteType): Promise<RouteHealth> {
    const cached = this.routeHealthStatus.get(route);

    // Return cached status if recent (< 30s)
    if (cached && Date.now() - cached.lastCheck.getTime() < 30000) {
      return cached;
    }

    // Perform fresh health check
    const startTime = Date.now();

    try {
      let isHealthy = false;
      let latencyMs = 0;

      switch (route) {
        case "direct":
          const directHealth =
            await this.directBedrockClient.performHealthCheck();
          isHealthy = directHealth.isHealthy;
          latencyMs = directHealth.latencyMs;
          break;

        case "mcp":
          if (this.mcpRouter) {
            const mcpHealth = await this.mcpRouter.getHealthStatus();
            isHealthy = mcpHealth.isHealthy;
            latencyMs = mcpHealth.latencyMs;
          } else {
            isHealthy = false;
            latencyMs = 0;
          }
          break;
      }

      const health: RouteHealth = {
        route,
        isHealthy,
        latencyMs,
        successRate: isHealthy ? 1.0 : 0.0,
        lastCheck: new Date(),
        consecutiveFailures: isHealthy
          ? 0
          : (cached?.consecutiveFailures || 0) + 1,
      };

      // Log health check to audit trail
      await this.auditTrail.logRouteHealthCheck(
        route,
        isHealthy,
        latencyMs,
        health.successRate,
        health.consecutiveFailures,
        isHealthy ? undefined : `${route} route health check failed`
      );

      this.routeHealthStatus.set(route, health);
      return health;
    } catch (error) {
      const health: RouteHealth = {
        route,
        isHealthy: false,
        latencyMs: Date.now() - startTime,
        successRate: 0.0,
        lastCheck: new Date(),
        consecutiveFailures: (cached?.consecutiveFailures || 0) + 1,
      };

      // Log health check failure to audit trail
      await this.auditTrail.logRouteHealthCheck(
        route,
        false,
        health.latencyMs,
        health.successRate,
        health.consecutiveFailures,
        error instanceof Error
          ? error.message
          : `${route} route health check failed`
      );

      this.routeHealthStatus.set(route, health);
      return health;
    }
  }

  /**
   * Get routing efficiency metrics
   */
  getRoutingEfficiency(): RoutingEfficiency {
    return { ...this.routingMetrics };
  }

  /**
   * Get current route health status
   */
  getRouteHealthStatus(): Map<RouteType, RouteHealth> {
    return new Map(this.routeHealthStatus);
  }

  /**
   * Optimize routing configuration based on metrics
   */
  async optimizeRouting(): Promise<string[]> {
    const recommendations: string[] = [];
    const efficiency = this.routingMetrics;

    // Analyze routing patterns
    if (efficiency.totalRequests > 100) {
      // Check if direct route is underutilized
      const directUsagePercent =
        (efficiency.directRouteUsage / efficiency.totalRequests) * 100;
      if (directUsagePercent < 30 && efficiency.averageLatency > 15000) {
        recommendations.push(
          "Consider routing more operations to direct Bedrock for better latency"
        );
      }

      // Check if MCP route is overloaded
      const mcpUsagePercent =
        (efficiency.mcpRouteUsage / efficiency.totalRequests) * 100;
      if (mcpUsagePercent > 80 && efficiency.successRate < 0.95) {
        recommendations.push(
          "Consider load balancing by routing more operations to direct Bedrock"
        );
      }

      // Check fallback usage
      const fallbackPercent =
        (efficiency.fallbackUsage / efficiency.totalRequests) * 100;
      if (fallbackPercent > 20) {
        recommendations.push(
          "High fallback usage detected - investigate primary route health issues"
        );
      }

      // Check cost efficiency
      if (efficiency.costEfficiency < 0.7) {
        recommendations.push(
          "Route more standard operations to MCP to reduce direct Bedrock costs"
        );
      }
    }

    return recommendations;
  }

  /**
   * Update routing rules (for dynamic configuration)
   */
  updateRoutingRules(newRules: RoutingRule[]): void {
    this.routingRules = [...newRules];
    console.log("Routing rules updated:", this.routingRules.length);
  }

  /**
   * Set MCP router (for late initialization)
   */
  setMCPRouter(mcpRouter: MCPRouter): void {
    this.mcpRouter = mcpRouter;

    // Initialize MCP fallback reliability system
    if (!this.mcpFallbackSystem) {
      try {
        this.mcpFallbackSystem = new MCPFallbackReliabilitySystem(mcpRouter);
      } catch (error) {
        // In test environments, the class might be mocked
        console.warn("Failed to initialize MCP fallback system:", error);
        this.mcpFallbackSystem = null;
      }
    }

    console.log("MCP router configured with fallback reliability system");
  }

  /**
   * Set cost optimizer (for cost-aware routing)
   */
  setCostOptimizer(costOptimizer: IntelligentRoutingCostOptimizer): void {
    this.costOptimizer = costOptimizer;
    console.log("Cost optimizer configured for intelligent routing");
  }

  /**
   * Get MCP fallback metrics
   */
  getMCPFallbackMetrics(): MCPFallbackMetrics | null {
    return this.mcpFallbackSystem?.getFallbackMetrics() || null;
  }

  /**
   * Validate MCP fallback reliability targets
   */
  async validateMCPFallbackReliability(): Promise<{
    meetsTarget: boolean;
    currentSuccessRate: number;
    targetSuccessRate: number;
    recommendations: string[];
  } | null> {
    return this.mcpFallbackSystem?.validateReliabilityTargets() || null;
  }

  /**
   * Force MCP fallback health check and recovery
   */
  async forceMCPFallbackRecovery(): Promise<{
    healthImproved: boolean;
    actions: string[];
  } | null> {
    return this.mcpFallbackSystem?.forceHealthCheckAndRecovery() || null;
  }

  /**
   * Get cost optimization metrics
   */
  getCostOptimizationMetrics(): any | null {
    return this.costOptimizer?.getCostOptimizationMetrics() || null;
  }

  /**
   * Get cost optimization status
   */
  getCostOptimizationStatus(): any | null {
    return this.costOptimizer?.getCostOptimizationStatus() || null;
  }

  /**
   * Check if cost reduction target is met
   */
  isCostReductionTargetMet(): boolean {
    return this.costOptimizer?.isCostReductionTargetMet() || false;
  }

  /**
   * Get current routing rules
   */
  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Cleanup MCP fallback system
    if (this.mcpFallbackSystem) {
      this.mcpFallbackSystem.destroy();
    }

    // Cleanup cost optimizer
    if (this.costOptimizer) {
      this.costOptimizer.destroy();
    }
  }

  // Private helper methods

  private initializeMetrics(): RoutingEfficiency {
    return {
      totalRequests: 0,
      directRouteUsage: 0,
      mcpRouteUsage: 0,
      fallbackUsage: 0,
      averageLatency: 0,
      successRate: 1.0,
      costEfficiency: 1.0,
      optimizationRecommendations: [],
    };
  }

  private initializeHealthMonitoring(): void {
    // Initialize health status for both routes
    this.routeHealthStatus.set("direct", {
      route: "direct",
      isHealthy: true,
      latencyMs: 0,
      successRate: 1.0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });

    this.routeHealthStatus.set("mcp", {
      route: "mcp",
      isHealthy: this.mcpRouter?.isAvailable() || false,
      latencyMs: 0,
      successRate: 1.0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Check both routes and log health status
        const directHealth = await this.checkRouteHealth("direct");
        await this.auditTrail.logRouteHealthCheck(
          "direct",
          directHealth.isHealthy,
          directHealth.latencyMs,
          directHealth.successRate,
          directHealth.consecutiveFailures,
          directHealth.isHealthy
            ? undefined
            : "Direct route health check failed"
        );

        if (this.mcpRouter) {
          const mcpHealth = await this.checkRouteHealth("mcp");
          await this.auditTrail.logRouteHealthCheck(
            "mcp",
            mcpHealth.isHealthy,
            mcpHealth.latencyMs,
            mcpHealth.successRate,
            mcpHealth.consecutiveFailures,
            mcpHealth.isHealthy ? undefined : "MCP route health check failed"
          );
        }

        // Run optimization analysis
        const recommendations = await this.optimizeRouting();
        if (recommendations.length > 0) {
          this.routingMetrics.optimizationRecommendations = recommendations;

          // Log routing optimization to audit trail
          await this.auditTrail.logRoutingOptimization(recommendations, {
            totalRequests: this.routingMetrics.totalRequests,
            directRouteUsage: this.routingMetrics.directRouteUsage,
            mcpRouteUsage: this.routingMetrics.mcpRouteUsage,
            fallbackUsage: this.routingMetrics.fallbackUsage,
            averageLatency: this.routingMetrics.averageLatency,
            successRate: this.routingMetrics.successRate,
          });

          console.log("Routing optimization recommendations:", recommendations);
        }
      } catch (error) {
        console.error("Health monitoring error:", error);
      }
    }, 60000); // Check every minute
  }

  private updateMetrics(
    decision: RoutingDecision,
    response: SupportOperationResponse | null,
    latencyMs: number,
    success: boolean
  ): void {
    this.routingMetrics.totalRequests++;

    // Update route usage
    if (decision.selectedRoute === "direct") {
      this.routingMetrics.directRouteUsage++;
    } else {
      this.routingMetrics.mcpRouteUsage++;
    }

    // Update fallback usage
    if (decision.reason.includes("fallback")) {
      this.routingMetrics.fallbackUsage++;
    }

    // Update average latency (rolling average)
    const totalLatency =
      this.routingMetrics.averageLatency *
        (this.routingMetrics.totalRequests - 1) +
      latencyMs;
    this.routingMetrics.averageLatency =
      totalLatency / this.routingMetrics.totalRequests;

    // Update success rate (rolling average)
    const totalSuccess =
      this.routingMetrics.successRate *
        (this.routingMetrics.totalRequests - 1) +
      (success ? 1 : 0);
    this.routingMetrics.successRate =
      totalSuccess / this.routingMetrics.totalRequests;

    // Update cost efficiency (simplified calculation)
    const directCostWeight = 1.0; // Direct Bedrock costs more
    const mcpCostWeight = 0.3; // MCP is cheaper
    const costWeight =
      decision.selectedRoute === "direct" ? directCostWeight : mcpCostWeight;
    const totalCost =
      this.routingMetrics.costEfficiency *
        (this.routingMetrics.totalRequests - 1) +
      costWeight;
    this.routingMetrics.costEfficiency =
      totalCost / this.routingMetrics.totalRequests;
  }

  private logRoutingDecision(
    decision: RoutingDecision,
    request: SupportOperationRequest
  ): void {
    console.log(
      `[IntelligentRouter] ${decision.correlationId}: ${request.operation}/${request.priority} -> ${decision.selectedRoute} (${decision.reason})`
    );
  }

  private generateCorrelationId(): string {
    return `router-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate GDPR compliance for routing decision
   */
  private async validateGDPRComplianceForRouting(
    request: SupportOperationRequest,
    rule: RoutingRule,
    correlationId: string
  ): Promise<void> {
    try {
      // Map operation type to hybrid routing path operation type
      const operationType = this.mapOperationTypeToHybridPath(
        request.operation
      );

      // Create routing path for primary route
      const primaryRoutingPath: HybridRoutingPath = {
        routeType:
          rule.primaryRoute === "direct" ? "direct_bedrock" : "mcp_integration",
        provider: "bedrock", // Default to bedrock for support operations
        operationType,
        priority: rule.priority,
      };

      // Validate GDPR compliance for primary route
      const primaryValidation =
        await this.gdprHybridValidator.validateBeforeRouting(
          primaryRoutingPath,
          `${correlationId}-primary`
        );

      if (!primaryValidation.allowed) {
        // If primary route fails GDPR validation, check fallback
        if (rule.fallbackRoute) {
          const fallbackRoutingPath: HybridRoutingPath = {
            routeType:
              rule.fallbackRoute === "direct"
                ? "direct_bedrock"
                : "mcp_integration",
            provider: "bedrock",
            operationType,
            priority: rule.priority,
          };

          const fallbackValidation =
            await this.gdprHybridValidator.validateBeforeRouting(
              fallbackRoutingPath,
              `${correlationId}-fallback`
            );

          if (!fallbackValidation.allowed) {
            throw new Error(
              `Both primary and fallback routes fail GDPR compliance: Primary: ${primaryValidation.reason}, Fallback: ${fallbackValidation.reason}`
            );
          }
        } else {
          throw new Error(
            `Primary route fails GDPR compliance and no fallback available: ${primaryValidation.reason}`
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `GDPR compliance validation failed for routing: ${errorMessage}`
      );
    }
  }

  /**
   * Map operation type to hybrid routing path operation type
   */
  private mapOperationTypeToHybridPath(
    operation: OperationType
  ): HybridRoutingPath["operationType"] {
    switch (operation) {
      case "emergency":
        return "emergency";
      case "infrastructure":
        return "infrastructure";
      case "meta_monitor":
        return "meta_monitor";
      case "implementation":
        return "implementation";
      case "standard":
        return "standard_analysis";
      default:
        return "background_tasks";
    }
  }
}

// Types are already exported as interfaces above
