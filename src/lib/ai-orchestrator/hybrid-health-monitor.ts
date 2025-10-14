/**
 * Hybrid Health Monitor - Health Monitoring for Both MCP and Direct Bedrock Paths
 *
 * This module implements comprehensive health monitoring for the hybrid routing
 * architecture, tracking both MCP and direct Bedrock paths, analyzing routing
 * efficiency, and providing optimization recommendations.
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import {
  DirectBedrockClient,
  DirectBedrockHealthCheck,
} from "./direct-bedrock-client";
import { IntelligentRouter } from "./intelligent-router";
import { MCPHealthStatus, MCPRouter } from "./mcp-router";

// Hybrid Health Status
export interface HybridHealthStatus {
  overall: {
    isHealthy: boolean;
    healthScore: number; // 0-100
    lastCheck: Date;
    uptime: number; // milliseconds
  };
  routes: {
    mcp: MCPHealthStatus;
    directBedrock: DirectBedrockHealthCheck;
  };
  routing: {
    efficiency: number; // 0-1
    optimalRouteUsage: number; // 0-1
    fallbackRate: number; // 0-1
    averageDecisionTime: number; // milliseconds
  };
  performance: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  recommendations: {
    immediate: string[];
    optimization: string[];
    maintenance: string[];
  };
}

// Routing Efficiency Analysis
export interface RoutingEfficiencyAnalysis {
  analysisId: string;
  timestamp: Date;
  timeWindow: number; // milliseconds
  totalDecisions: number;
  optimalDecisions: number;
  suboptimalDecisions: number;
  routingPatterns: {
    mcpUsage: number;
    directBedrockUsage: number;
    fallbackOccurrences: number;
  };
  performanceComparison: {
    mcpPerformance: {
      averageLatency: number;
      successRate: number;
      throughput: number;
    };
    directBedrockPerformance: {
      averageLatency: number;
      successRate: number;
      throughput: number;
    };
  };
  recommendations: {
    routingOptimizations: string[];
    performanceImprovements: string[];
    configurationChanges: string[];
  };
  efficiency: number; // 0-1 overall efficiency score
}

// Health Check Configuration
export interface HybridHealthConfig {
  checkInterval: number; // How often to perform health checks
  analysisInterval: number; // How often to analyze routing efficiency
  performanceWindow: number; // Time window for performance analysis
  healthThresholds: {
    minHealthScore: number;
    maxLatency: number;
    minSuccessRate: number;
    maxFallbackRate: number;
  };
  enableContinuousMonitoring: boolean;
  enablePerformanceOptimization: boolean;
  alertThresholds: {
    criticalHealthScore: number;
    warningLatency: number;
    criticalLatency: number;
  };
}

// Performance Metrics
interface PerformanceMetrics {
  requests: Array<{
    timestamp: Date;
    route: "mcp" | "direct";
    latency: number;
    success: boolean;
    operationType: string;
  }>;
  routingDecisions: Array<{
    timestamp: Date;
    requestedRoute: "mcp" | "direct";
    actualRoute: "mcp" | "direct";
    decisionTime: number;
    reason: string;
  }>;
}

/**
 * Hybrid Health Monitor for MCP and Direct Bedrock Routing
 */
export class HybridHealthMonitor {
  private config: HybridHealthConfig;
  private featureFlags: AiFeatureFlags;
  private directBedrockClient: DirectBedrockClient;
  private mcpRouter: MCPRouter;
  private intelligentRouter: IntelligentRouter;

  // Health monitoring state
  private healthStatus: HybridHealthStatus;
  private performanceMetrics: PerformanceMetrics;
  private efficiencyAnalysisHistory: Map<string, RoutingEfficiencyAnalysis> =
    new Map();

  // Monitoring intervals
  private healthCheckInterval?: NodeJS.Timeout;
  private analysisInterval?: NodeJS.Timeout;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();

  // System state tracking
  private systemStartTime: Date;
  private lastHealthCheck: Date;

  constructor(
    directBedrockClient: DirectBedrockClient,
    mcpRouter: MCPRouter,
    intelligentRouter: IntelligentRouter,
    config?: Partial<HybridHealthConfig>
  ) {
    this.directBedrockClient = directBedrockClient;
    this.mcpRouter = mcpRouter;
    this.intelligentRouter = intelligentRouter;
    this.featureFlags = new AiFeatureFlags();

    this.config = {
      checkInterval: 30000, // 30 seconds
      analysisInterval: 300000, // 5 minutes
      performanceWindow: 3600000, // 1 hour
      healthThresholds: {
        minHealthScore: 70,
        maxLatency: 5000, // 5 seconds
        minSuccessRate: 0.95,
        maxFallbackRate: 0.1, // 10%
      },
      enableContinuousMonitoring: true,
      enablePerformanceOptimization: true,
      alertThresholds: {
        criticalHealthScore: 50,
        warningLatency: 3000, // 3 seconds
        criticalLatency: 10000, // 10 seconds
      },
      ...config,
    };

    this.systemStartTime = new Date();
    this.lastHealthCheck = new Date();
    this.healthStatus = this.initializeHealthStatus();
    this.performanceMetrics = this.initializePerformanceMetrics();

    // Start monitoring if enabled
    if (this.featureFlags.isEnabled("ENABLE_HYBRID_HEALTH_MONITORING")) {
      this.startMonitoring();
    }
  }

  /**
   * Get comprehensive hybrid health status
   */
  async getHealthStatus(): Promise<HybridHealthStatus> {
    try {
      // Get health status from both routes
      const mcpHealth = await this.mcpRouter.getHealthStatus();
      const directBedrockHealth =
        await this.directBedrockClient.getHealthStatus();

      // Update route health
      this.healthStatus.routes.mcp = mcpHealth;
      this.healthStatus.routes.directBedrock = directBedrockHealth;

      // Calculate overall health
      this.calculateOverallHealth();

      // Update routing efficiency
      await this.updateRoutingEfficiency();

      // Update performance metrics
      this.updatePerformanceMetrics();

      // Generate recommendations
      this.generateHealthRecommendations();

      // Update last check time
      this.healthStatus.overall.lastCheck = new Date();
      this.lastHealthCheck = new Date();

      return { ...this.healthStatus };
    } catch (error) {
      console.error("Failed to get hybrid health status:", error);

      // Return degraded health status
      return {
        ...this.healthStatus,
        overall: {
          ...this.healthStatus.overall,
          isHealthy: false,
          healthScore: 0,
          lastCheck: new Date(),
        },
      };
    }
  }

  /**
   * Perform routing efficiency analysis
   */
  async analyzeRoutingEfficiency(): Promise<RoutingEfficiencyAnalysis> {
    const analysisId = this.generateAnalysisId();
    const timestamp = new Date();
    const timeWindow = this.config.performanceWindow;

    try {
      // Get recent routing decisions and performance data
      const recentDecisions = this.getRecentRoutingDecisions(timeWindow);
      const recentRequests = this.getRecentRequests(timeWindow);

      // Calculate routing patterns
      const routingPatterns = this.calculateRoutingPatterns(
        recentDecisions,
        recentRequests
      );

      // Analyze performance by route
      const performanceComparison =
        this.analyzePerformanceByRoute(recentRequests);

      // Calculate efficiency score
      const efficiency = this.calculateRoutingEfficiency(
        recentDecisions,
        performanceComparison
      );

      // Generate recommendations
      const recommendations = await this.generateRoutingRecommendations(
        routingPatterns,
        performanceComparison,
        efficiency
      );

      const analysis: RoutingEfficiencyAnalysis = {
        analysisId,
        timestamp,
        timeWindow,
        totalDecisions: recentDecisions.length,
        optimalDecisions: recentDecisions.filter(
          (d) => d.requestedRoute === d.actualRoute
        ).length,
        suboptimalDecisions: recentDecisions.filter(
          (d) => d.requestedRoute !== d.actualRoute
        ).length,
        routingPatterns,
        performanceComparison,
        recommendations,
        efficiency: recentDecisions.length === 0 ? 0 : efficiency, // Return 0 for empty data
      };

      // Store analysis
      this.efficiencyAnalysisHistory.set(analysisId, analysis);

      // Clean up old analyses (keep last 24 hours)
      this.cleanupOldAnalyses();

      return analysis;
    } catch (error) {
      console.error("Routing efficiency analysis failed:", error);

      // Return minimal analysis on error
      return {
        analysisId,
        timestamp,
        timeWindow,
        totalDecisions: 0,
        optimalDecisions: 0,
        suboptimalDecisions: 0,
        routingPatterns: {
          mcpUsage: 0,
          directBedrockUsage: 0,
          fallbackOccurrences: 0,
        },
        performanceComparison: {
          mcpPerformance: { averageLatency: 0, successRate: 0, throughput: 0 },
          directBedrockPerformance: {
            averageLatency: 0,
            successRate: 0,
            throughput: 0,
          },
        },
        recommendations: {
          routingOptimizations: [],
          performanceImprovements: [],
          configurationChanges: [],
        },
        efficiency: 0,
      };
    }
  }

  /**
   * Record a routing decision for analysis
   */
  recordRoutingDecision(
    requestedRoute: "mcp" | "direct",
    actualRoute: "mcp" | "direct",
    decisionTime: number,
    reason: string
  ): void {
    this.performanceMetrics.routingDecisions.push({
      timestamp: new Date(),
      requestedRoute,
      actualRoute,
      decisionTime,
      reason,
    });

    // Keep only recent decisions (last hour)
    const cutoffTime = Date.now() - this.config.performanceWindow;
    this.performanceMetrics.routingDecisions =
      this.performanceMetrics.routingDecisions.filter(
        (decision) => decision.timestamp.getTime() > cutoffTime
      );
  }

  /**
   * Record a request performance for analysis
   */
  recordRequestPerformance(
    route: "mcp" | "direct",
    latency: number,
    success: boolean,
    operationType: string
  ): void {
    this.performanceMetrics.requests.push({
      timestamp: new Date(),
      route,
      latency,
      success,
      operationType,
    });

    // Keep only recent requests (last hour)
    const cutoffTime = Date.now() - this.config.performanceWindow;
    this.performanceMetrics.requests = this.performanceMetrics.requests.filter(
      (request) => request.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Get routing optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    try {
      const analysis = await this.analyzeRoutingEfficiency();

      const allRecommendations = [
        ...analysis.recommendations.routingOptimizations,
        ...analysis.recommendations.performanceImprovements,
        ...analysis.recommendations.configurationChanges,
      ];

      return allRecommendations;
    } catch (error) {
      console.error("Failed to get optimization recommendations:", error);
      return [
        "Monitor system health regularly",
        "Check routing efficiency metrics",
        "Review performance thresholds",
      ];
    }
  }

  /**
   * Get hybrid health metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.systemStartTime.getTime();
    const recentRequests = this.getRecentRequests(
      this.config.performanceWindow
    );

    return {
      uptime,
      totalRequests: this.performanceMetrics.requests.length,
      recentRequests: recentRequests.length,
      routingDecisions: this.performanceMetrics.routingDecisions.length,
      efficiencyAnalyses: this.efficiencyAnalysisHistory.size,
      healthChecks: this.lastHealthCheck ? 1 : 0,
      systemStartTime: this.systemStartTime,
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }

    // Clear timeouts
    this.activeTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();

    // Clear data
    this.efficiencyAnalysisHistory.clear();
    this.performanceMetrics.requests = [];
    this.performanceMetrics.routingDecisions = [];
  }

  // Private implementation methods

  private initializeHealthStatus(): HybridHealthStatus {
    return {
      overall: {
        isHealthy: false,
        healthScore: 0,
        lastCheck: new Date(),
        uptime: 0,
      },
      routes: {
        mcp: {
          route: "mcp",
          isHealthy: false,
          latencyMs: 0,
          successRate: 0,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          connectionStatus: "disconnected",
          queueSize: 0,
          pendingOperations: 0,
          lastSuccessfulOperation: null,
          errorRate: 0,
        },
        directBedrock: {
          isHealthy: false,
          latencyMs: 0,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          circuitBreakerState: "closed",
        },
      },
      routing: {
        efficiency: 0,
        optimalRouteUsage: 0,
        fallbackRate: 0,
        averageDecisionTime: 0,
      },
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      },
      recommendations: {
        immediate: [],
        optimization: [],
        maintenance: [],
      },
    };
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      requests: [],
      routingDecisions: [],
    };
  }

  private startMonitoring(): void {
    // Start health check monitoring
    if (this.config.enableContinuousMonitoring) {
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.getHealthStatus();
        } catch (error) {
          console.error("Periodic health check failed:", error);
        }
      }, this.config.checkInterval);
    }

    // Start efficiency analysis
    if (this.config.enablePerformanceOptimization) {
      this.analysisInterval = setInterval(async () => {
        try {
          await this.analyzeRoutingEfficiency();
        } catch (error) {
          console.error("Periodic efficiency analysis failed:", error);
        }
      }, this.config.analysisInterval);
    }
  }

  private calculateOverallHealth(): void {
    const mcpHealth = this.healthStatus.routes.mcp;
    const directBedrockHealth = this.healthStatus.routes.directBedrock;

    // Calculate weighted health score
    let healthScore = 0;
    let totalWeight = 0;

    // MCP health (weight: 0.4)
    if (mcpHealth.isHealthy) {
      healthScore += 40 * (1 - mcpHealth.errorRate);
    }
    totalWeight += 40;

    // Direct Bedrock health (weight: 0.4)
    if (directBedrockHealth.isHealthy) {
      const latencyScore = Math.max(
        0,
        1 -
          directBedrockHealth.latencyMs /
            this.config.healthThresholds.maxLatency
      );
      healthScore += 40 * latencyScore;
    }
    totalWeight += 40;

    // Routing efficiency (weight: 0.2)
    healthScore += 20 * this.healthStatus.routing.efficiency;
    totalWeight += 20;

    // Normalize score
    const finalScore = totalWeight > 0 ? (healthScore / totalWeight) * 100 : 0;

    // Update overall health
    this.healthStatus.overall.healthScore = Math.round(finalScore);
    this.healthStatus.overall.isHealthy =
      finalScore >= this.config.healthThresholds.minHealthScore;
    this.healthStatus.overall.uptime =
      Date.now() - this.systemStartTime.getTime();
  }

  private async updateRoutingEfficiency(): Promise<void> {
    const recentDecisions = this.getRecentRoutingDecisions(
      this.config.performanceWindow
    );

    if (recentDecisions.length === 0) {
      this.healthStatus.routing.efficiency = 1.0; // Perfect efficiency with no decisions
      this.healthStatus.routing.optimalRouteUsage = 1.0;
      this.healthStatus.routing.fallbackRate = 0;
      this.healthStatus.routing.averageDecisionTime = 0;
      return;
    }

    // Calculate efficiency metrics
    const optimalDecisions = recentDecisions.filter(
      (d) => d.requestedRoute === d.actualRoute
    ).length;
    const fallbackDecisions = recentDecisions.filter(
      (d) => d.requestedRoute !== d.actualRoute
    ).length;

    this.healthStatus.routing.efficiency =
      optimalDecisions / recentDecisions.length;
    this.healthStatus.routing.optimalRouteUsage =
      optimalDecisions / recentDecisions.length;
    this.healthStatus.routing.fallbackRate =
      fallbackDecisions / recentDecisions.length;

    const totalDecisionTime = recentDecisions.reduce(
      (sum, d) => sum + d.decisionTime,
      0
    );
    this.healthStatus.routing.averageDecisionTime =
      totalDecisionTime / recentDecisions.length;
  }

  private updatePerformanceMetrics(): void {
    const recentRequests = this.getRecentRequests(
      this.config.performanceWindow
    );

    if (recentRequests.length === 0) {
      this.healthStatus.performance = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      };
      return;
    }

    const successfulRequests = recentRequests.filter((r) => r.success);
    const failedRequests = recentRequests.filter((r) => !r.success);

    // Calculate latency percentiles
    const latencies = recentRequests
      .map((r) => r.latency)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    const totalLatency = latencies.reduce((sum, latency) => sum + latency, 0);

    this.healthStatus.performance = {
      totalRequests: recentRequests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageLatency: totalLatency / recentRequests.length,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
    };
  }

  private generateHealthRecommendations(): void {
    const immediate: string[] = [];
    const optimization: string[] = [];
    const maintenance: string[] = [];

    // Check critical health issues
    if (
      this.healthStatus.overall.healthScore <
      this.config.alertThresholds.criticalHealthScore
    ) {
      immediate.push(
        "Critical health issue detected - investigate system status"
      );
    }

    if (
      this.healthStatus.performance.p95Latency >
      this.config.alertThresholds.criticalLatency
    ) {
      immediate.push("Critical latency detected - check system performance");
    }

    // Check MCP health
    if (!this.healthStatus.routes.mcp.isHealthy) {
      immediate.push(
        "MCP route is unhealthy - check connection and configuration"
      );
    }

    if (this.healthStatus.routes.mcp.queueSize > 100) {
      optimization.push(
        "MCP queue size is high - consider increasing processing capacity"
      );
    }

    // Check Direct Bedrock health
    if (!this.healthStatus.routes.directBedrock.isHealthy) {
      immediate.push(
        "Direct Bedrock route is unhealthy - check AWS connectivity"
      );
    }

    if (this.healthStatus.routes.directBedrock.consecutiveFailures > 5) {
      optimization.push(
        "Direct Bedrock has consecutive failures - review error patterns"
      );
    }

    // Check routing efficiency
    if (this.healthStatus.routing.efficiency < 0.8) {
      optimization.push(
        "Routing efficiency is low - review routing decision logic"
      );
    }

    if (
      this.healthStatus.routing.fallbackRate >
      this.config.healthThresholds.maxFallbackRate
    ) {
      optimization.push(
        "High fallback rate detected - optimize primary route selection"
      );
    }

    // Performance recommendations
    if (
      this.healthStatus.performance.p95Latency >
      this.config.alertThresholds.warningLatency
    ) {
      optimization.push(
        "P95 latency is elevated - consider performance optimizations"
      );
    }

    const successRate =
      this.healthStatus.performance.totalRequests > 0
        ? this.healthStatus.performance.successfulRequests /
          this.healthStatus.performance.totalRequests
        : 1.0;

    if (successRate < this.config.healthThresholds.minSuccessRate) {
      immediate.push(
        "Success rate is below threshold - investigate error patterns"
      );
    }

    // Maintenance recommendations
    maintenance.push("Review health monitoring configuration regularly");
    maintenance.push("Update routing thresholds based on performance trends");
    maintenance.push("Clean up old performance data and analysis history");

    this.healthStatus.recommendations = {
      immediate,
      optimization,
      maintenance,
    };
  }

  private getRecentRoutingDecisions(timeWindow: number) {
    const cutoffTime = Date.now() - timeWindow;
    return this.performanceMetrics.routingDecisions.filter(
      (decision) => decision.timestamp.getTime() > cutoffTime
    );
  }

  private getRecentRequests(timeWindow: number) {
    const cutoffTime = Date.now() - timeWindow;
    return this.performanceMetrics.requests.filter(
      (request) => request.timestamp.getTime() > cutoffTime
    );
  }

  private calculateRoutingPatterns(
    decisions: PerformanceMetrics["routingDecisions"],
    requests: PerformanceMetrics["requests"]
  ) {
    const mcpRequests = requests.filter((r) => r.route === "mcp").length;
    const directBedrockRequests = requests.filter(
      (r) => r.route === "direct"
    ).length;
    const totalRequests = requests.length;

    const fallbackOccurrences = decisions.filter(
      (d) => d.requestedRoute !== d.actualRoute
    ).length;

    return {
      mcpUsage: totalRequests > 0 ? mcpRequests / totalRequests : 0,
      directBedrockUsage:
        totalRequests > 0 ? directBedrockRequests / totalRequests : 0,
      fallbackOccurrences,
    };
  }

  private analyzePerformanceByRoute(requests: PerformanceMetrics["requests"]) {
    const mcpRequests = requests.filter((r) => r.route === "mcp");
    const directBedrockRequests = requests.filter((r) => r.route === "direct");

    const calculatePerformance = (routeRequests: typeof requests) => {
      if (routeRequests.length === 0) {
        return { averageLatency: 0, successRate: 0, throughput: 0 };
      }

      const totalLatency = routeRequests.reduce((sum, r) => sum + r.latency, 0);
      const successfulRequests = routeRequests.filter((r) => r.success).length;
      const timeSpan = this.config.performanceWindow / 1000; // Convert to seconds

      return {
        averageLatency: totalLatency / routeRequests.length,
        successRate: successfulRequests / routeRequests.length,
        throughput: routeRequests.length / timeSpan, // requests per second
      };
    };

    return {
      mcpPerformance: calculatePerformance(mcpRequests),
      directBedrockPerformance: calculatePerformance(directBedrockRequests),
    };
  }

  private calculateRoutingEfficiency(
    decisions: PerformanceMetrics["routingDecisions"],
    performance: ReturnType<typeof this.analyzePerformanceByRoute>
  ): number {
    if (decisions.length === 0) return 1.0;

    // Calculate decision efficiency (optimal route selection)
    const optimalDecisions = decisions.filter(
      (d) => d.requestedRoute === d.actualRoute
    ).length;
    const decisionEfficiency = optimalDecisions / decisions.length;

    // Calculate performance efficiency (actual performance vs expected)
    const mcpPerf = performance.mcpPerformance;
    const directPerf = performance.directBedrockPerformance;

    let performanceEfficiency = 1.0;
    if (mcpPerf.averageLatency > 0 && directPerf.averageLatency > 0) {
      // Compare actual performance to expected thresholds
      const mcpEfficiency = Math.max(
        0,
        1 - mcpPerf.averageLatency / this.config.healthThresholds.maxLatency
      );
      const directEfficiency = Math.max(
        0,
        1 - directPerf.averageLatency / this.config.healthThresholds.maxLatency
      );
      performanceEfficiency = (mcpEfficiency + directEfficiency) / 2;
    }

    // Combine decision and performance efficiency
    return decisionEfficiency * 0.6 + performanceEfficiency * 0.4;
  }

  private async generateRoutingRecommendations(
    patterns: ReturnType<typeof this.calculateRoutingPatterns>,
    performance: ReturnType<typeof this.analyzePerformanceByRoute>,
    efficiency: number
  ): Promise<RoutingEfficiencyAnalysis["recommendations"]> {
    const routingOptimizations: string[] = [];
    const performanceImprovements: string[] = [];
    const configurationChanges: string[] = [];

    // Routing optimization recommendations
    if (efficiency < 0.8) {
      routingOptimizations.push(
        "Review routing decision algorithm for better efficiency"
      );
    }

    if (patterns.fallbackOccurrences > patterns.mcpUsage * 0.1) {
      routingOptimizations.push(
        "High fallback rate - consider adjusting route health thresholds"
      );
    }

    if (
      patterns.mcpUsage < 0.3 &&
      performance.mcpPerformance.successRate > 0.9
    ) {
      routingOptimizations.push(
        "MCP route underutilized despite good performance - review routing preferences"
      );
    }

    // Performance improvement recommendations
    if (
      performance.mcpPerformance.averageLatency >
      this.config.alertThresholds.warningLatency
    ) {
      performanceImprovements.push(
        "MCP route latency is high - investigate connection and processing delays"
      );
    }

    if (
      performance.directBedrockPerformance.averageLatency >
      this.config.alertThresholds.warningLatency
    ) {
      performanceImprovements.push(
        "Direct Bedrock latency is high - check AWS region and network connectivity"
      );
    }

    if (performance.mcpPerformance.successRate < 0.95) {
      performanceImprovements.push(
        "MCP route success rate is low - investigate error patterns"
      );
    }

    if (performance.directBedrockPerformance.successRate < 0.95) {
      performanceImprovements.push(
        "Direct Bedrock success rate is low - check AWS service limits and errors"
      );
    }

    // Configuration change recommendations
    if (patterns.directBedrockUsage > 0.7) {
      configurationChanges.push(
        "High Direct Bedrock usage - consider increasing MCP capacity"
      );
    }

    if (
      performance.mcpPerformance.throughput <
      performance.directBedrockPerformance.throughput * 0.5
    ) {
      configurationChanges.push(
        "MCP throughput is significantly lower - review MCP configuration"
      );
    }

    configurationChanges.push(
      "Review health check intervals based on current usage patterns"
    );
    configurationChanges.push(
      "Consider adjusting routing thresholds based on performance trends"
    );

    return {
      routingOptimizations,
      performanceImprovements,
      configurationChanges,
    };
  }

  private cleanupOldAnalyses(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, analysis] of this.efficiencyAnalysisHistory.entries()) {
      if (analysis.timestamp.getTime() < cutoffTime) {
        this.efficiencyAnalysisHistory.delete(id);
      }
    }
  }

  private generateAnalysisId(): string {
    return `hybrid-analysis-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }
}

// Export types for external use
export {
  type HybridHealthConfig,
  type HybridHealthStatus,
  type RoutingEfficiencyAnalysis,
};
