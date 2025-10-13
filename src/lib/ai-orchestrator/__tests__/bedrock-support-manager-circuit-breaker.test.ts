/**
 * Bedrock Support Manager Circuit Breaker Integration Tests
 *
 * Tests the integration of circuit breaker patterns with both routing paths
 * (direct Bedrock and MCP) in the Bedrock Support Manager.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { BedrockSupportManager } from "../bedrock-support-manager";
import { CircuitBreaker } from "../circuit-breaker";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPRouter } from "../mcp-router";

// Mock dependencies
jest.mock("../circuit-breaker");
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../direct-bedrock-client");
jest.mock("../mcp-router");
jest.mock("../intelligent-router");
jest.mock("../infrastructure-auditor");
jest.mock("../meta-monitor");
jest.mock("../implementation-support");
jest.mock("../hybrid-health-monitor");
jest.mock("../kiro-bridge");

const MockedCircuitBreaker = CircuitBreaker as jest.MockedClass<
  typeof CircuitBreaker
>;
const MockedAiFeatureFlags = AiFeatureFlags as jest.MockedClass<
  typeof AiFeatureFlags
>;
const MockedAuditTrailSystem = AuditTrailSystem as jest.MockedClass<
  typeof AuditTrailSystem
>;
const MockedDirectBedrockClient = DirectBedrockClient as jest.MockedClass<
  typeof DirectBedrockClient
>;
const MockedMCPRouter = MCPRouter as jest.MockedClass<typeof MCPRouter>;
const MockedIntelligentRouter = IntelligentRouter as jest.MockedClass<
  typeof IntelligentRouter
>;

describe("BedrockSupportManager Circuit Breaker Integration", () => {
  let supportManager: BedrockSupportManager;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockMCPRouter: jest.Mocked<MCPRouter>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockCircuitBreaker = {
      isOpen: jest.fn(),
      execute: jest.fn(),
      getMetrics: jest.fn(),
      forceClose: jest.fn(),
      forceOpen: jest.fn(),
      resetAll: jest.fn(),
      isAvailable: jest.fn(),
      getAvailableProviders: jest.fn(),
      getAllMetrics: jest.fn(),
      reset: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockFeatureFlags = {
      isBedrockSupportModeEnabled: jest.fn().mockResolvedValue(true),
      validateBedrockSupportModeFlags: jest
        .fn()
        .mockResolvedValue({ isValid: true, errors: [] }),
      validateAllFlags: jest
        .fn()
        .mockResolvedValue({ isValid: true, errors: [] }),
      isProviderEnabled: jest.fn().mockResolvedValue(true),
      isEnabled: jest.fn().mockReturnValue(true),
    } as any;

    mockAuditTrail = {
      logSupportModeEvent: jest.fn().mockResolvedValue(undefined),
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockDirectBedrockClient = {} as any;
    mockMCPRouter = {} as any;
    mockIntelligentRouter = {
      makeRoutingDecision: jest.fn(),
    } as any;

    // Add missing mock for hybrid health monitor
    const mockHybridHealthMonitor = {
      startHealthMonitoring: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn().mockResolvedValue(undefined),
    };

    // Add missing mock for infrastructure auditor
    const mockInfrastructureAuditor = {
      performSystemHealthCheck: jest.fn().mockResolvedValue({
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      }),
    };

    // Mock the component constructors to return our mocks
    jest.doMock("../hybrid-health-monitor", () => ({
      HybridHealthMonitor: jest
        .fn()
        .mockImplementation(() => mockHybridHealthMonitor),
    }));

    jest.doMock("../infrastructure-auditor", () => ({
      InfrastructureAuditor: jest
        .fn()
        .mockImplementation(() => mockInfrastructureAuditor),
    }));

    // Setup constructor mocks
    MockedCircuitBreaker.mockImplementation(() => mockCircuitBreaker);
    MockedAiFeatureFlags.mockImplementation(() => mockFeatureFlags);
    MockedAuditTrailSystem.mockImplementation(() => mockAuditTrail);
    MockedDirectBedrockClient.mockImplementation(() => mockDirectBedrockClient);
    MockedMCPRouter.mockImplementation(() => mockMCPRouter);
    MockedIntelligentRouter.mockImplementation(() => mockIntelligentRouter);

    // Create support manager instance
    supportManager = new BedrockSupportManager();
  });

  describe("Circuit Breaker Initialization", () => {
    it("should initialize circuit breaker with support-specific configuration", () => {
      expect(MockedCircuitBreaker).toHaveBeenCalledWith({
        failureThreshold: 3, // More sensitive for support operations
        recoveryTimeout: 30000, // 30 seconds recovery
        halfOpenMaxCalls: 2, // Conservative half-open testing
        healthCheckInterval: 15000, // 15 second health checks
      });
    });

    it("should initialize all required components for hybrid routing", () => {
      expect(MockedDirectBedrockClient).toHaveBeenCalledWith({
        region: "eu-central-1",
        emergencyTimeout: 5000,
        criticalTimeout: 10000,
        enableCircuitBreaker: true,
        enableHealthMonitoring: true,
        enableComplianceChecks: true,
      });

      expect(MockedMCPRouter).toHaveBeenCalledWith({
        timeout: 30000,
        maxRetries: 3,
        healthCheckInterval: 30000,
      });
    });
  });

  describe("enableCircuitBreaker", () => {
    it("should enable circuit breaker protection for both routing paths", async () => {
      // Setup mocks
      mockCircuitBreaker.isOpen.mockReturnValue(false);

      // Execute
      await supportManager.enableCircuitBreaker();

      // Verify circuit breaker checks for all providers
      expect(mockCircuitBreaker.isOpen).toHaveBeenCalledWith("bedrock");
      expect(mockCircuitBreaker.isOpen).toHaveBeenCalledWith("google");
      expect(mockCircuitBreaker.isOpen).toHaveBeenCalledWith("meta");

      // Verify audit logging
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "circuit_breaker_enabled",
        expect.objectContaining({
          configuration: expect.any(Object),
          enabledPaths: ["direct_bedrock", "mcp_router"],
          healthMonitoringActive: true,
        }),
        "system"
      );
    });

    it("should reset open circuit breakers during enablement", async () => {
      // Setup mocks - circuit breaker is open
      mockCircuitBreaker.isOpen.mockReturnValue(true);

      // Execute
      await supportManager.enableCircuitBreaker();

      // Verify circuit breakers are reset
      expect(mockCircuitBreaker.forceClose).toHaveBeenCalledWith("bedrock");
      expect(mockCircuitBreaker.forceClose).toHaveBeenCalledWith("google");
      expect(mockCircuitBreaker.forceClose).toHaveBeenCalledWith("meta");
    });

    it("should handle circuit breaker enablement failures", async () => {
      // Setup mocks - circuit breaker throws error
      mockCircuitBreaker.isOpen.mockImplementation(() => {
        throw new Error("Circuit breaker initialization failed");
      });

      // Execute and verify error
      await expect(supportManager.enableCircuitBreaker()).rejects.toThrow(
        "Circuit breaker activation failed: Circuit breaker initialization failed"
      );

      // Verify failure is logged
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "circuit_breaker_enable_failed",
        expect.objectContaining({
          error: "Circuit breaker initialization failed",
        }),
        "system"
      );
    });
  });

  describe("getCircuitBreakerStatus", () => {
    it("should return healthy status when both paths are available", async () => {
      // Setup mocks
      mockCircuitBreaker.isOpen.mockReturnValue(false);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "closed",
        failureRate: 0,
        uptime: 1,
        lastFailure: null,
        lastSuccess: new Date(),
        totalFailures: 0,
        totalSuccesses: 10,
        circuitOpenTime: 0,
      });

      // Execute
      const status = await supportManager.getCircuitBreakerStatus();

      // Verify
      expect(status.overallHealth).toBe("healthy");
      expect(status.directBedrock.isOpen).toBe(false);
      expect(status.mcpRouter.isOpen).toBe(false);
    });

    it("should return degraded status when one path is down", async () => {
      // Setup mocks - direct Bedrock is down
      mockCircuitBreaker.isOpen
        .mockReturnValueOnce(true) // bedrock
        .mockReturnValueOnce(false); // google (MCP)

      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "open",
        failureRate: 0.8,
        uptime: 0.2,
        lastFailure: new Date(),
        lastSuccess: null,
        totalFailures: 8,
        totalSuccesses: 2,
        circuitOpenTime: 30000,
      });

      // Execute
      const status = await supportManager.getCircuitBreakerStatus();

      // Verify
      expect(status.overallHealth).toBe("degraded");
      expect(status.directBedrock.isOpen).toBe(true);
      expect(status.mcpRouter.isOpen).toBe(false);
    });

    it("should return critical status when both paths are down", async () => {
      // Setup mocks - both paths down
      mockCircuitBreaker.isOpen.mockReturnValue(true);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "open",
        failureRate: 1,
        uptime: 0,
        lastFailure: new Date(),
        lastSuccess: null,
        totalFailures: 10,
        totalSuccesses: 0,
        circuitOpenTime: 60000,
      });

      // Execute
      const status = await supportManager.getCircuitBreakerStatus();

      // Verify
      expect(status.overallHealth).toBe("critical");
      expect(status.directBedrock.isOpen).toBe(true);
      expect(status.mcpRouter.isOpen).toBe(true);
    });
  });

  describe("runInfrastructureAudit with Circuit Breaker Protection", () => {
    it("should execute audit through circuit breaker when paths are healthy", async () => {
      // Setup mocks
      mockCircuitBreaker.isOpen.mockReturnValue(false);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "closed",
        failureRate: 0,
        uptime: 1,
        lastFailure: null,
        lastSuccess: new Date(),
        totalFailures: 0,
        totalSuccesses: 10,
        circuitOpenTime: 0,
      });

      const mockAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy" as const,
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      mockCircuitBreaker.execute.mockResolvedValue(mockAuditResult);

      // Execute
      const result = await supportManager.runInfrastructureAudit();

      // Verify circuit breaker execution
      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith(
        "bedrock",
        expect.any(Function)
      );

      // Verify result
      expect(result.overallHealth).toBe("healthy");
    });

    it("should return critical status when both paths are unavailable", async () => {
      // Setup mocks - both paths down
      mockCircuitBreaker.isOpen.mockReturnValue(true);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "open",
        failureRate: 1,
        uptime: 0,
        lastFailure: new Date(),
        lastSuccess: null,
        totalFailures: 10,
        totalSuccesses: 0,
        circuitOpenTime: 60000,
      });

      // Execute
      const result = await supportManager.runInfrastructureAudit();

      // Verify critical result
      expect(result.overallHealth).toBe("critical");
      expect(result.detectedIssues).toHaveLength(1);
      expect(result.detectedIssues[0].id).toBe("circuit-breaker-critical");
      expect(result.detectedIssues[0].description).toContain(
        "Both routing paths"
      );
    });

    it("should handle circuit breaker failures with fallback", async () => {
      // Setup mocks - direct path fails, MCP succeeds
      mockCircuitBreaker.isOpen.mockReturnValue(false);
      mockCircuitBreaker.execute
        .mockRejectedValueOnce(
          new Error("Circuit breaker is OPEN for provider bedrock")
        )
        .mockResolvedValueOnce({
          timestamp: new Date(),
          overallHealth: "healthy" as const,
          detectedIssues: [],
          implementationGaps: [],
          recommendations: [],
          complianceStatus: {
            gdprCompliant: true,
            dataResidencyCompliant: true,
            auditTrailComplete: true,
            issues: [],
          },
        });

      // Execute
      const result = await supportManager.runInfrastructureAudit();

      // Verify fallback was attempted
      expect(mockCircuitBreaker.execute).toHaveBeenCalledTimes(2);
      expect(mockCircuitBreaker.execute).toHaveBeenNthCalledWith(
        1,
        "bedrock",
        expect.any(Function)
      );
      expect(mockCircuitBreaker.execute).toHaveBeenNthCalledWith(
        2,
        "google",
        expect.any(Function)
      );

      // Verify result includes fallback information
      expect(
        result.detectedIssues.some(
          (issue) => issue.id === "direct-path-circuit-breaker-open"
        )
      ).toBe(true);
    });
  });

  describe("provideFallbackSupport with Circuit Breaker Protection", () => {
    const mockFailureContext = {
      operation: "test-operation",
      errorType: "timeout",
      errorMessage: "Operation timed out",
      timestamp: new Date(),
      affectedSystems: ["infrastructure"],
      severity: "high" as const,
    };

    it("should execute fallback support through circuit breaker protection", async () => {
      // Setup mocks
      mockCircuitBreaker.isOpen.mockReturnValue(false);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        provider: "bedrock",
        state: "closed",
        failureRate: 0,
        uptime: 1,
        lastFailure: null,
        lastSuccess: new Date(),
        totalFailures: 0,
        totalSuccesses: 10,
        circuitOpenTime: 0,
      });

      mockIntelligentRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Emergency operation requires direct access",
        fallbackAvailable: true,
        estimatedLatency: 3000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      const mockSupportResult = {
        success: true,
        supportType: "infrastructure" as const,
        actionsPerformed: [],
        diagnostics: {
          systemHealth: {},
          performanceMetrics: {
            responseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            networkLatency: 0,
          },
          errorLogs: [],
          recommendations: [],
        },
        nextSteps: [],
      };

      mockCircuitBreaker.execute.mockResolvedValue(mockSupportResult);

      // Execute
      const result = await supportManager.provideFallbackSupport(
        mockFailureContext
      );

      // Verify intelligent routing was used
      expect(mockIntelligentRouter.makeRoutingDecision).toHaveBeenCalled();

      // Verify circuit breaker execution
      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith(
        "bedrock",
        expect.any(Function)
      );

      // Verify successful result
      expect(result.success).toBe(true);

      // Verify audit logging
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "fallback_support_provided",
        expect.objectContaining({
          operation: "test-operation",
          severity: "high",
        }),
        "system"
      );
    });

    it("should handle circuit breaker failures in fallback support", async () => {
      // Setup mocks - circuit breaker failure
      mockCircuitBreaker.execute.mockRejectedValue(
        new Error("Circuit breaker is OPEN for provider bedrock")
      );

      mockIntelligentRouter.makeRoutingDecision.mockResolvedValue({
        selectedRoute: "direct",
        reason: "Emergency operation requires direct access",
        fallbackAvailable: true,
        estimatedLatency: 3000,
        correlationId: "test-correlation-id",
        timestamp: new Date(),
      });

      // Execute
      const result = await supportManager.provideFallbackSupport(
        mockFailureContext
      );

      // Verify failure result
      expect(result.success).toBe(false);
      expect(result.diagnostics.recommendations).toContain(
        "Check circuit breaker status"
      );

      // Verify failure logging
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "fallback_support_failed",
        expect.objectContaining({
          operation: "test-operation",
          error: "Circuit breaker is OPEN for provider bedrock",
        }),
        "system"
      );
    });
  });

  describe("handleCircuitBreakerFailure", () => {
    it("should handle circuit breaker failure with intelligent fallback", async () => {
      // Setup mocks
      mockCircuitBreaker.isOpen
        .mockReturnValueOnce(true) // failed path
        .mockReturnValueOnce(false); // fallback path

      // Execute
      await supportManager.handleCircuitBreakerFailure(
        "direct",
        "test-operation",
        { test: "context" }
      );

      // Verify failure logging
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "circuit_breaker_failure",
        expect.objectContaining({
          failedPath: "direct",
          operation: "test-operation",
        }),
        "system"
      );
    });

    it("should trigger emergency procedures when both paths are down", async () => {
      // Setup mocks - both paths down
      mockCircuitBreaker.isOpen.mockReturnValue(true);

      // Execute
      await supportManager.handleCircuitBreakerFailure(
        "direct",
        "test-operation",
        { test: "context" }
      );

      // Verify emergency procedures triggered
      expect(mockAuditTrail.logSupportModeEvent).toHaveBeenCalledWith(
        "emergency_procedures_triggered",
        expect.objectContaining({
          operation: "test-operation",
          reason: "both_routing_paths_unavailable",
        }),
        "system"
      );
    });
  });
});
