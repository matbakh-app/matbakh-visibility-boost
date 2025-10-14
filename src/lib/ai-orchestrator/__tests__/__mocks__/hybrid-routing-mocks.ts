/**
 * Hybrid Routing Mock Implementations
 *
 * Comprehensive mock implementations for testing hybrid routing scenarios
 * in the Bedrock Support Manager system.
 *
 * This file provides:
 * - Mock factories for all hybrid routing components
 * - Scenario-based mock configurations
 * - Test data generators
 * - Mock state management utilities
 */

import type {
  DirectBedrockConfig,
  EmergencyOperationRequest,
  HealthStatus,
  SupportOperationRequest,
  SupportOperationResponse,
} from "../../direct-bedrock-client";
import type {
  HybridHealthStatus,
  RoutingEfficiencyReport,
} from "../../hybrid-health-monitor";
import type {
  BacklogAnalysis,
  RemediationSuggestion,
} from "../../implementation-support";
import type {
  ImplementationGap,
  InfrastructureAuditResult,
} from "../../infrastructure-auditor";
import type {
  RouteHealthStatus,
  RoutingDecision,
} from "../../intelligent-router";
import type { MCPMessage, MCPResponse } from "../../mcp-router";
import type { ExecutionAnalysis, FailurePattern } from "../../meta-monitor";

/**
 * Mock Factory for Direct Bedrock Client
 */
export class MockDirectBedrockClient {
  public executeSupportOperation = jest.fn();
  public executeEmergencyOperation = jest.fn();
  public getHealthStatus = jest.fn();
  public updateConfig = jest.fn();
  public cleanup = jest.fn();

  constructor(config?: Partial<DirectBedrockConfig>) {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful support operation
    this.executeSupportOperation.mockResolvedValue({
      success: true,
      operationId: "mock-op-123",
      result: { analysis: "Mock analysis result" },
      latency: 250,
      tokensUsed: 150,
      cost: 0.001,
      timestamp: new Date(),
    } as SupportOperationResponse);

    // Default: Successful emergency operation
    this.executeEmergencyOperation.mockResolvedValue({
      success: true,
      operationId: "mock-emergency-456",
      result: { action: "Emergency action taken" },
      latency: 100,
      tokensUsed: 50,
      cost: 0.0005,
      timestamp: new Date(),
    });

    // Default: Healthy status
    this.getHealthStatus.mockResolvedValue({
      status: "healthy",
      lastCheck: new Date(),
      latency: 50,
      errorRate: 0,
      circuitBreakerState: "closed",
    } as HealthStatus);
  }

  /**
   * Configure mock for high latency scenario
   */
  public configureHighLatency(): void {
    this.executeSupportOperation.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        success: true,
        operationId: "slow-op-789",
        result: { analysis: "Slow analysis" },
        latency: 2000,
        tokensUsed: 200,
        cost: 0.002,
        timestamp: new Date(),
      };
    });
  }

  /**
   * Configure mock for failure scenario
   */
  public configureFailure(errorMessage: string = "Mock failure"): void {
    this.executeSupportOperation.mockRejectedValue(new Error(errorMessage));
    this.getHealthStatus.mockResolvedValue({
      status: "unhealthy",
      lastCheck: new Date(),
      latency: 5000,
      errorRate: 0.5,
      circuitBreakerState: "open",
      lastError: errorMessage,
    });
  }

  /**
   * Configure mock for degraded performance
   */
  public configureDegraded(): void {
    this.getHealthStatus.mockResolvedValue({
      status: "degraded",
      lastCheck: new Date(),
      latency: 1500,
      errorRate: 0.1,
      circuitBreakerState: "half-open",
    });
  }
}

/**
 * Mock Factory for MCP Router
 */
export class MockMCPRouter {
  public route = jest.fn();
  public sendMessage = jest.fn();
  public getHealthStatus = jest.fn();
  public cleanup = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful routing
    this.route.mockResolvedValue({
      success: true,
      provider: "bedrock",
      response: { result: "Mock MCP response" },
      latency: 300,
      timestamp: new Date(),
    } as MCPResponse);

    // Default: Successful message sending
    this.sendMessage.mockResolvedValue({
      success: true,
      messageId: "mock-msg-123",
      timestamp: new Date(),
    });

    // Default: Healthy status
    this.getHealthStatus.mockResolvedValue({
      status: "healthy",
      lastCheck: new Date(),
      latency: 100,
      errorRate: 0,
    });
  }

  /**
   * Configure mock for MCP unavailable scenario
   */
  public configureUnavailable(): void {
    this.route.mockRejectedValue(new Error("MCP service unavailable"));
    this.getHealthStatus.mockResolvedValue({
      status: "unhealthy",
      lastCheck: new Date(),
      latency: 10000,
      errorRate: 1.0,
      lastError: "Service unavailable",
    });
  }

  /**
   * Configure mock for slow MCP scenario
   */
  public configureSlow(): void {
    this.route.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        success: true,
        provider: "bedrock",
        response: { result: "Slow MCP response" },
        latency: 3000,
        timestamp: new Date(),
      };
    });
  }
}

/**
 * Mock Factory for Intelligent Router
 */
export class MockIntelligentRouter {
  public decide = jest.fn();
  public executeSupportOperation = jest.fn();
  public executeWithFallback = jest.fn();
  public getRouteHealth = jest.fn();
  public analyzeRoutingEfficiency = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Route to direct Bedrock
    this.decide.mockReturnValue({
      operationType: "support",
      priority: "high",
      latencyRequirement: 10000,
      useDirectBedrock: true,
      fallbackStrategy: "mcp",
    } as RoutingDecision);

    // Default: Successful operation execution
    this.executeSupportOperation.mockResolvedValue({
      success: true,
      result: { analysis: "Mock routing result" },
      route: "direct",
      latency: 200,
      timestamp: new Date(),
    });

    // Default: Healthy routes
    this.getRouteHealth.mockResolvedValue({
      direct: {
        status: "healthy",
        latency: 200,
        errorRate: 0,
      },
      mcp: {
        status: "healthy",
        latency: 300,
        errorRate: 0,
      },
    } as Record<string, RouteHealthStatus>);

    // Default: Good routing efficiency
    this.analyzeRoutingEfficiency.mockResolvedValue({
      overallEfficiency: 0.85,
      directBedrockEfficiency: 0.9,
      mcpEfficiency: 0.8,
      recommendations: [],
    });
  }

  /**
   * Configure mock for MCP-preferred routing
   */
  public configureMCPPreferred(): void {
    this.decide.mockReturnValue({
      operationType: "standard",
      priority: "medium",
      latencyRequirement: 30000,
      useDirectBedrock: false,
      fallbackStrategy: "direct",
    });
  }

  /**
   * Configure mock for emergency routing
   */
  public configureEmergency(): void {
    this.decide.mockReturnValue({
      operationType: "emergency",
      priority: "critical",
      latencyRequirement: 5000,
      useDirectBedrock: true,
      fallbackStrategy: "none",
    });
  }

  /**
   * Configure mock for fallback scenario
   */
  public configureFallback(): void {
    this.executeWithFallback.mockImplementation(
      async (operation, primary, fallback) => {
        try {
          return await primary();
        } catch (error) {
          return await fallback();
        }
      }
    );
  }
}

/**
 * Mock Factory for Infrastructure Auditor
 */
export class MockInfrastructureAuditor {
  public performSystemHealthCheck = jest.fn();
  public detectImplementationGaps = jest.fn();
  public analyzeSystemConsistency = jest.fn();
  public generateAuditReport = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Healthy system
    this.performSystemHealthCheck.mockResolvedValue({
      overallHealth: "healthy",
      components: {
        directBedrock: { status: "healthy", latency: 200 },
        mcpRouter: { status: "healthy", latency: 300 },
        intelligentRouter: { status: "healthy", latency: 50 },
      },
      timestamp: new Date(),
    });

    // Default: No implementation gaps
    this.detectImplementationGaps.mockResolvedValue([]);

    // Default: Consistent system
    this.analyzeSystemConsistency.mockResolvedValue({
      consistent: true,
      inconsistencies: [],
      recommendations: [],
    });

    // Default: Clean audit report
    this.generateAuditReport.mockResolvedValue({
      timestamp: new Date(),
      overallHealth: "healthy",
      detectedIssues: [],
      implementationGaps: [],
      recommendations: [],
      complianceStatus: {
        gdprCompliant: true,
        euDataResidency: true,
        auditTrailComplete: true,
      },
    } as InfrastructureAuditResult);
  }

  /**
   * Configure mock for system with issues
   */
  public configureWithIssues(): void {
    this.performSystemHealthCheck.mockResolvedValue({
      overallHealth: "warning",
      components: {
        directBedrock: { status: "degraded", latency: 1500 },
        mcpRouter: { status: "healthy", latency: 300 },
        intelligentRouter: { status: "healthy", latency: 50 },
      },
      timestamp: new Date(),
    });

    this.detectImplementationGaps.mockResolvedValue([
      {
        id: "gap-1",
        module: "test-module",
        severity: "medium",
        description: "Mock implementation gap",
        impact: "Performance degradation",
        recommendations: ["Implement missing feature"],
      } as ImplementationGap,
    ]);
  }

  /**
   * Configure mock for critical system state
   */
  public configureCritical(): void {
    this.performSystemHealthCheck.mockResolvedValue({
      overallHealth: "critical",
      components: {
        directBedrock: { status: "unhealthy", latency: 5000 },
        mcpRouter: { status: "unhealthy", latency: 10000 },
        intelligentRouter: { status: "degraded", latency: 500 },
      },
      timestamp: new Date(),
    });
  }
}

/**
 * Mock Factory for Meta Monitor
 */
export class MockMetaMonitor {
  public analyzeKiroExecution = jest.fn();
  public detectFailurePatterns = jest.fn();
  public identifyPerformanceBottlenecks = jest.fn();
  public generateExecutionFeedback = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful execution analysis
    this.analyzeKiroExecution.mockResolvedValue({
      executionId: "mock-exec-123",
      timestamp: new Date(),
      performanceMetrics: {
        responseTime: 200,
        memoryUsage: 50,
        cpuUsage: 30,
        networkLatency: 10,
      },
      failurePoints: [],
      bottlenecks: [],
      recommendations: [],
    } as ExecutionAnalysis);

    // Default: No failure patterns
    this.detectFailurePatterns.mockResolvedValue([]);

    // Default: No bottlenecks
    this.identifyPerformanceBottlenecks.mockResolvedValue({
      bottlenecks: [],
      overallPerformance: "good",
    });

    // Default: Positive feedback
    this.generateExecutionFeedback.mockResolvedValue({
      overallAssessment: "good",
      strengths: ["Fast response time", "Low resource usage"],
      improvements: [],
      recommendations: [],
    });
  }

  /**
   * Configure mock for failure detection
   */
  public configureWithFailures(): void {
    this.detectFailurePatterns.mockResolvedValue([
      {
        patternId: "pattern-1",
        frequency: 5,
        severity: "medium",
        description: "Timeout pattern detected",
        affectedOperations: ["op-1", "op-2"],
        recommendations: ["Increase timeout threshold"],
      } as FailurePattern,
    ]);
  }

  /**
   * Configure mock for performance issues
   */
  public configurePerformanceIssues(): void {
    this.identifyPerformanceBottlenecks.mockResolvedValue({
      bottlenecks: [
        {
          component: "direct-bedrock",
          severity: "high",
          impact: "High latency",
          recommendation: "Optimize request batching",
        },
      ],
      overallPerformance: "poor",
    });
  }
}

/**
 * Mock Factory for Implementation Support
 */
export class MockImplementationSupport {
  public supportIncompleteModule = jest.fn();
  public provideRemediationSuggestions = jest.fn();
  public attemptAutoResolution = jest.fn();
  public analyzeImplementationBacklog = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful module support
    this.supportIncompleteModule.mockResolvedValue({
      success: true,
      moduleId: "mock-module",
      supportProvided: ["Analysis", "Recommendations"],
      timestamp: new Date(),
    });

    // Default: Helpful remediation suggestions
    this.provideRemediationSuggestions.mockResolvedValue([
      {
        id: "suggestion-1",
        priority: "high",
        description: "Implement missing validation",
        estimatedEffort: "2 hours",
        expectedImpact: "Improved reliability",
      } as RemediationSuggestion,
    ]);

    // Default: Successful auto-resolution
    this.attemptAutoResolution.mockResolvedValue({
      success: true,
      issueId: "issue-1",
      resolution: "Applied automated fix",
      timestamp: new Date(),
    });

    // Default: Clean backlog
    this.analyzeImplementationBacklog.mockResolvedValue({
      totalItems: 5,
      highPriority: 1,
      mediumPriority: 2,
      lowPriority: 2,
      recommendations: ["Focus on high-priority items"],
    } as BacklogAnalysis);
  }

  /**
   * Configure mock for complex backlog
   */
  public configureComplexBacklog(): void {
    this.analyzeImplementationBacklog.mockResolvedValue({
      totalItems: 50,
      highPriority: 15,
      mediumPriority: 20,
      lowPriority: 15,
      recommendations: [
        "Prioritize high-priority items",
        "Consider team expansion",
        "Implement automation for low-priority items",
      ],
    });
  }

  /**
   * Configure mock for auto-resolution failure
   */
  public configureAutoResolutionFailure(): void {
    this.attemptAutoResolution.mockResolvedValue({
      success: false,
      issueId: "issue-2",
      resolution: "Manual intervention required",
      reason: "Issue too complex for automation",
      timestamp: new Date(),
    });
  }
}

/**
 * Mock Factory for Hybrid Health Monitor
 */
export class MockHybridHealthMonitor {
  public checkMCPHealth = jest.fn();
  public checkDirectBedrockHealth = jest.fn();
  public analyzeRoutingEfficiency = jest.fn();
  public optimizeRoutingRules = jest.fn();
  public getOverallHealth = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Healthy MCP
    this.checkMCPHealth.mockResolvedValue({
      status: "healthy",
      latency: 300,
      errorRate: 0,
      lastSuccessfulRequest: new Date(),
    });

    // Default: Healthy Direct Bedrock
    this.checkDirectBedrockHealth.mockResolvedValue({
      status: "healthy",
      latency: 200,
      errorRate: 0,
      lastSuccessfulRequest: new Date(),
    });

    // Default: Good routing efficiency
    this.analyzeRoutingEfficiency.mockResolvedValue({
      mcpSuccessRate: 0.95,
      directBedrockSuccessRate: 0.98,
      averageLatencyMCP: 300,
      averageLatencyDirect: 200,
      recommendedRoutingChanges: [],
    } as RoutingEfficiencyReport);

    // Default: No optimization needed
    this.optimizeRoutingRules.mockResolvedValue({
      optimizationsApplied: [],
      expectedImprovement: "No changes needed",
    });

    // Default: Overall healthy
    this.getOverallHealth.mockResolvedValue({
      overallStatus: "healthy",
      mcpHealth: { status: "healthy", latency: 300, errorRate: 0 },
      directBedrockHealth: { status: "healthy", latency: 200, errorRate: 0 },
      routingEfficiency: 0.85,
      recommendations: [],
    } as HybridHealthStatus);
  }

  /**
   * Configure mock for MCP degradation
   */
  public configureMCPDegraded(): void {
    this.checkMCPHealth.mockResolvedValue({
      status: "degraded",
      latency: 2000,
      errorRate: 0.15,
      lastSuccessfulRequest: new Date(Date.now() - 60000),
    });

    this.getOverallHealth.mockResolvedValue({
      overallStatus: "degraded",
      mcpHealth: { status: "degraded", latency: 2000, errorRate: 0.15 },
      directBedrockHealth: { status: "healthy", latency: 200, errorRate: 0 },
      routingEfficiency: 0.65,
      recommendations: ["Consider routing more traffic to Direct Bedrock"],
    });
  }

  /**
   * Configure mock for both paths degraded
   */
  public configureBothDegraded(): void {
    this.checkMCPHealth.mockResolvedValue({
      status: "degraded",
      latency: 2000,
      errorRate: 0.15,
      lastSuccessfulRequest: new Date(Date.now() - 60000),
    });

    this.checkDirectBedrockHealth.mockResolvedValue({
      status: "degraded",
      latency: 1500,
      errorRate: 0.1,
      lastSuccessfulRequest: new Date(Date.now() - 30000),
    });

    this.getOverallHealth.mockResolvedValue({
      overallStatus: "critical",
      mcpHealth: { status: "degraded", latency: 2000, errorRate: 0.15 },
      directBedrockHealth: {
        status: "degraded",
        latency: 1500,
        errorRate: 0.1,
      },
      routingEfficiency: 0.45,
      recommendations: [
        "Investigate system-wide performance issues",
        "Consider emergency mode activation",
      ],
    });
  }
}

/**
 * Scenario-based Mock Configurations
 */
export class HybridRoutingScenarios {
  /**
   * Scenario: Normal Operations
   * Both paths healthy, intelligent routing working optimally
   */
  static normalOperations(): {
    directBedrock: MockDirectBedrockClient;
    mcpRouter: MockMCPRouter;
    intelligentRouter: MockIntelligentRouter;
    healthMonitor: MockHybridHealthMonitor;
  } {
    return {
      directBedrock: new MockDirectBedrockClient(),
      mcpRouter: new MockMCPRouter(),
      intelligentRouter: new MockIntelligentRouter(),
      healthMonitor: new MockHybridHealthMonitor(),
    };
  }

  /**
   * Scenario: MCP Failure with Fallback
   * MCP unavailable, system falls back to Direct Bedrock
   */
  static mcpFailureWithFallback(): {
    directBedrock: MockDirectBedrockClient;
    mcpRouter: MockMCPRouter;
    intelligentRouter: MockIntelligentRouter;
    healthMonitor: MockHybridHealthMonitor;
  } {
    const directBedrock = new MockDirectBedrockClient();
    const mcpRouter = new MockMCPRouter();
    const intelligentRouter = new MockIntelligentRouter();
    const healthMonitor = new MockHybridHealthMonitor();

    // Configure MCP as unavailable
    mcpRouter.configureUnavailable();

    // Configure health monitor to reflect MCP issues
    healthMonitor.configureMCPDegraded();

    // Configure router to prefer direct Bedrock
    intelligentRouter.decide.mockReturnValue({
      operationType: "support",
      priority: "high",
      latencyRequirement: 10000,
      useDirectBedrock: true,
      fallbackStrategy: "none",
    });

    return { directBedrock, mcpRouter, intelligentRouter, healthMonitor };
  }

  /**
   * Scenario: High Load
   * System under high load, both paths experiencing latency
   */
  static highLoad(): {
    directBedrock: MockDirectBedrockClient;
    mcpRouter: MockMCPRouter;
    intelligentRouter: MockIntelligentRouter;
    healthMonitor: MockHybridHealthMonitor;
  } {
    const directBedrock = new MockDirectBedrockClient();
    const mcpRouter = new MockMCPRouter();
    const intelligentRouter = new MockIntelligentRouter();
    const healthMonitor = new MockHybridHealthMonitor();

    // Configure high latency for both paths
    directBedrock.configureHighLatency();
    mcpRouter.configureSlow();

    // Configure health monitor to show degraded performance
    healthMonitor.configureBothDegraded();

    return { directBedrock, mcpRouter, intelligentRouter, healthMonitor };
  }

  /**
   * Scenario: Emergency Operations
   * Critical operation requiring immediate Direct Bedrock access
   */
  static emergencyOperations(): {
    directBedrock: MockDirectBedrockClient;
    mcpRouter: MockMCPRouter;
    intelligentRouter: MockIntelligentRouter;
    healthMonitor: MockHybridHealthMonitor;
  } {
    const directBedrock = new MockDirectBedrockClient();
    const mcpRouter = new MockMCPRouter();
    const intelligentRouter = new MockIntelligentRouter();
    const healthMonitor = new MockHybridHealthMonitor();

    // Configure router for emergency mode
    intelligentRouter.configureEmergency();

    return { directBedrock, mcpRouter, intelligentRouter, healthMonitor };
  }

  /**
   * Scenario: System Recovery
   * System recovering from issues, gradual return to normal
   */
  static systemRecovery(): {
    directBedrock: MockDirectBedrockClient;
    mcpRouter: MockMCPRouter;
    intelligentRouter: MockIntelligentRouter;
    healthMonitor: MockHybridHealthMonitor;
  } {
    const directBedrock = new MockDirectBedrockClient();
    const mcpRouter = new MockMCPRouter();
    const intelligentRouter = new MockIntelligentRouter();
    const healthMonitor = new MockHybridHealthMonitor();

    // Configure degraded but improving state
    directBedrock.configureDegraded();
    healthMonitor.configureMCPDegraded();

    return { directBedrock, mcpRouter, intelligentRouter, healthMonitor };
  }
}

/**
 * Test Data Generators
 */
export class TestDataGenerators {
  /**
   * Generate mock support operation request
   */
  static supportOperationRequest(
    overrides?: Partial<SupportOperationRequest>
  ): SupportOperationRequest {
    return {
      operation: "infrastructure_audit",
      priority: "high",
      context: {
        requestId: "test-req-123",
        timestamp: new Date(),
      },
      timeout: 30000,
      ...overrides,
    } as SupportOperationRequest;
  }

  /**
   * Generate mock emergency operation request
   */
  static emergencyOperationRequest(
    overrides?: Partial<EmergencyOperationRequest>
  ): EmergencyOperationRequest {
    return {
      operation: "emergency_shutdown",
      severity: "critical",
      context: {
        requestId: "emergency-456",
        timestamp: new Date(),
        reason: "Critical system failure",
      },
      timeout: 5000,
      ...overrides,
    } as EmergencyOperationRequest;
  }

  /**
   * Generate mock MCP message
   */
  static mcpMessage(overrides?: Partial<MCPMessage>): MCPMessage {
    return {
      type: "support_request",
      source: "bedrock_support",
      payload: {
        operation: "test_operation",
        data: { test: "data" },
      },
      timestamp: new Date(),
      correlationId: "corr-789",
      ...overrides,
    } as MCPMessage;
  }

  /**
   * Generate mock routing decision
   */
  static routingDecision(
    overrides?: Partial<RoutingDecision>
  ): RoutingDecision {
    return {
      operationType: "support",
      priority: "high",
      latencyRequirement: 10000,
      useDirectBedrock: true,
      fallbackStrategy: "mcp",
      ...overrides,
    };
  }
}

/**
 * Mock State Management Utilities
 */
export class MockStateManager {
  private states: Map<string, any> = new Map();

  /**
   * Save mock state for later restoration
   */
  saveState(key: string, mock: any): void {
    this.states.set(key, {
      implementation: mock.getMockImplementation?.(),
      calls: mock.mock?.calls || [],
      results: mock.mock?.results || [],
    });
  }

  /**
   * Restore mock state
   */
  restoreState(key: string, mock: any): void {
    const state = this.states.get(key);
    if (state) {
      if (state.implementation) {
        mock.mockImplementation(state.implementation);
      }
    }
  }

  /**
   * Clear all saved states
   */
  clearStates(): void {
    this.states.clear();
  }

  /**
   * Reset all mocks to default behavior
   */
  resetAllMocks(mocks: Record<string, any>): void {
    Object.values(mocks).forEach((mock) => {
      if (mock && typeof mock.mockReset === "function") {
        mock.mockReset();
      }
    });
  }
}

/**
 * Export all mock factories and utilities
 */
export const HybridRoutingMocks = {
  DirectBedrockClient: MockDirectBedrockClient,
  MCPRouter: MockMCPRouter,
  IntelligentRouter: MockIntelligentRouter,
  InfrastructureAuditor: MockInfrastructureAuditor,
  MetaMonitor: MockMetaMonitor,
  ImplementationSupport: MockImplementationSupport,
  HybridHealthMonitor: MockHybridHealthMonitor,
  Scenarios: HybridRoutingScenarios,
  TestData: TestDataGenerators,
  StateManager: MockStateManager,
};
