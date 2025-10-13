/**
 * Implementation Support Tests
 *
 * Comprehensive test suite for Implementation Support System covering
 * gap detection, remediation suggestions, auto-resolution, and backlog analysis.
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import {
  ImplementationGap,
  ImplementationSupport,
  ImplementationSupportConfig,
  RemediationSuggestion,
} from "../implementation-support";
import { IntelligentRouter } from "../intelligent-router";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../direct-bedrock-client");
jest.mock("../intelligent-router");

describe("ImplementationSupport", () => {
  let implementationSupport: ImplementationSupport;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;
  let mockConfig: ImplementationSupportConfig;

  beforeEach(() => {
    // Create mocks
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn(),
      getHealthStatus: jest.fn(),
      isAvailable: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockIntelligentRouter = {
      executeSupportOperation: jest.fn(),
      makeRoutingDecision: jest.fn(),
      checkRouteHealth: jest.fn(),
      destroy: jest.fn(),
    } as any;

    mockConfig = {
      scanInterval: 1000, // 1 second for testing
      autoResolutionEnabled: true,
      maxAutoResolutionAttempts: 2,
      analysisTimeout: 5000,
      backlogAnalysisInterval: 2000,
      enableContinuousMonitoring: false, // Disable for testing
      riskThreshold: "medium",
      testingRequired: false, // Disable for testing
    };

    // Mock feature flags to be enabled
    const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
    mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(true);

    implementationSupport = new ImplementationSupport(
      mockDirectBedrockClient,
      mockIntelligentRouter,
      mockConfig
    );
  });

  afterEach(() => {
    implementationSupport.destroy();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with default configuration", () => {
      const defaultSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter
      );

      expect(defaultSupport).toBeDefined();
      expect(defaultSupport.getMetrics().totalGapsDetected).toBe(0);

      defaultSupport.destroy();
    });

    it("should merge custom configuration with defaults", () => {
      const customConfig = { scanInterval: 5000 };
      const customSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        customConfig
      );

      expect(customSupport).toBeDefined();
      customSupport.destroy();
    });
  });

  describe("detectImplementationGaps", () => {
    it("should detect implementation gaps", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          gaps: [
            {
              type: "missing_implementation",
              severity: "high",
              title: "Missing user authentication",
              description: "User authentication module is not implemented",
              affectedModules: ["auth", "user"],
              businessImpact: "Users cannot log in",
              estimatedEffort: "medium",
              confidence: 0.9,
              technicalDetails: {
                missingComponents: ["AuthService", "LoginForm"],
              },
            },
            {
              type: "performance_issue",
              severity: "medium",
              title: "Slow database queries",
              description: "Database queries are not optimized",
              affectedModules: ["database"],
              businessImpact: "Poor user experience",
              estimatedEffort: "low",
              confidence: 0.8,
              technicalDetails: {
                performanceMetrics: { queryTime: 2000 },
              },
            },
          ],
        }),
        operationId: "gap-detection",
        latencyMs: 200,
        timestamp: new Date(),
      });

      const gaps = await implementationSupport.detectImplementationGaps();

      expect(gaps).toHaveLength(2);
      expect(gaps[0].type).toBe("missing_implementation");
      expect(gaps[0].severity).toBe("high");
      expect(gaps[0].title).toBe("Missing user authentication");
      expect(gaps[1].type).toBe("performance_issue");
      expect(gaps[1].severity).toBe("medium");

      expect(
        mockIntelligentRouter.executeSupportOperation
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "implementation",
          priority: "high",
        })
      );
    });

    it("should detect gaps for specific modules", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({ gaps: [] }),
        operationId: "gap-detection",
        latencyMs: 100,
        timestamp: new Date(),
      });

      const gaps = await implementationSupport.detectImplementationGaps([
        "auth",
        "user",
      ]);

      expect(gaps).toEqual([]);
      expect(
        mockIntelligentRouter.executeSupportOperation
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            metadata: expect.objectContaining({
              modules: ["auth", "user"],
            }),
          }),
        })
      );
    });

    it("should handle detection errors gracefully", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Detection failed")
      );

      const gaps = await implementationSupport.detectImplementationGaps();

      expect(gaps).toEqual([]);
    });

    it("should skip detection when feature is disabled", async () => {
      const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
      mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(false);

      const disabledSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        mockConfig
      );

      const gaps = await disabledSupport.detectImplementationGaps();

      expect(gaps).toEqual([]);
      expect(
        mockIntelligentRouter.executeSupportOperation
      ).not.toHaveBeenCalled();

      disabledSupport.destroy();
    });
  });

  describe("generateRemediationSuggestions", () => {
    const mockGap: ImplementationGap = {
      gapId: "gap-123",
      type: "missing_implementation",
      severity: "high",
      title: "Missing authentication",
      description: "Authentication module not implemented",
      affectedModules: ["auth"],
      detectedAt: new Date(),
      lastUpdated: new Date(),
      status: "detected",
      confidence: 0.9,
      estimatedEffort: "medium",
      businessImpact: "Users cannot authenticate",
      technicalDetails: {
        missingComponents: ["AuthService"],
      },
    };

    it("should generate remediation suggestions", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              type: "code_fix",
              priority: "high",
              title: "Implement AuthService",
              description: "Create authentication service with login/logout",
              implementation: {
                steps: ["Create AuthService class", "Implement login method"],
                codeChanges: [
                  {
                    file: "src/services/AuthService.ts",
                    changes: "export class AuthService { login() {} }",
                    explanation: "Basic auth service implementation",
                  },
                ],
              },
              estimatedTime: "4 hours",
              riskLevel: "low",
              testingRequired: true,
              autoResolvable: true,
            },
          ],
        }),
        operationId: "remediation",
        latencyMs: 300,
        timestamp: new Date(),
      });

      const suggestions =
        await implementationSupport.generateRemediationSuggestions(mockGap);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe("code_fix");
      expect(suggestions[0].priority).toBe("high");
      expect(suggestions[0].title).toBe("Implement AuthService");
      expect(suggestions[0].autoResolvable).toBe(true);
      expect(suggestions[0].implementation.codeChanges).toHaveLength(1);

      // Check that gap status was updated
      const gaps = implementationSupport.getDetectedGaps();
      const updatedGap = gaps.find((g) => g.gapId === mockGap.gapId);
      expect(updatedGap?.status).toBe("remediation_suggested");
    });

    it("should handle critical gaps with higher priority", async () => {
      const criticalGap: ImplementationGap = {
        ...mockGap,
        severity: "critical",
      };

      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              type: "code_fix",
              priority: "urgent",
              title: "Critical fix",
              description: "Urgent security fix",
              implementation: { steps: ["Fix security issue"] },
              estimatedTime: "1 hour",
              riskLevel: "high",
              testingRequired: true,
              autoResolvable: false,
            },
          ],
        }),
        operationId: "critical-remediation",
        latencyMs: 150,
        timestamp: new Date(),
      });

      const suggestions =
        await implementationSupport.generateRemediationSuggestions(criticalGap);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].priority).toBe("urgent");
      expect(
        mockIntelligentRouter.executeSupportOperation
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "critical",
        })
      );
    });

    it("should handle suggestion generation errors", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Suggestion generation failed")
      );

      const suggestions =
        await implementationSupport.generateRemediationSuggestions(mockGap);

      expect(suggestions).toEqual([]);
    });
  });

  describe("attemptAutoResolution", () => {
    const mockGap: ImplementationGap = {
      gapId: "gap-auto",
      type: "missing_implementation",
      severity: "medium",
      title: "Missing component",
      description: "Component not implemented",
      affectedModules: ["components"],
      detectedAt: new Date(),
      lastUpdated: new Date(),
      status: "remediation_suggested",
      confidence: 0.8,
      estimatedEffort: "low",
      businessImpact: "Minor functionality missing",
      technicalDetails: {},
    };

    const mockSuggestion: RemediationSuggestion = {
      suggestionId: "suggestion-auto",
      gapId: "gap-auto",
      type: "code_fix",
      priority: "medium",
      title: "Add missing component",
      description: "Create the missing component",
      implementation: {
        steps: ["Create component file"],
        codeChanges: [
          {
            file: "src/components/MissingComponent.tsx",
            changes:
              "export const MissingComponent = () => <div>Component</div>;",
            explanation: "Basic component implementation",
          },
        ],
      },
      estimatedTime: "1 hour",
      riskLevel: "low",
      testingRequired: false,
      createdAt: new Date(),
      autoResolvable: true,
    };

    it("should successfully auto-resolve implementation gap", async () => {
      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        mockSuggestion
      );

      expect(result.status).toBe("success");
      expect(result.gapId).toBe(mockGap.gapId);
      expect(result.suggestionId).toBe(mockSuggestion.suggestionId);
      expect(result.appliedChanges.filesModified).toContain(
        "src/components/MissingComponent.tsx"
      );
      expect(result.rollbackAvailable).toBe(true);

      // Check that gap status was updated
      const gaps = implementationSupport.getDetectedGaps();
      const resolvedGap = gaps.find((g) => g.gapId === mockGap.gapId);
      expect(resolvedGap?.status).toBe("resolved");

      // Check metrics
      const metrics = implementationSupport.getMetrics();
      expect(metrics.autoResolutionsAttempted).toBe(1);
      expect(metrics.autoResolutionsSuccessful).toBe(1);
      expect(metrics.gapsResolved).toBe(1);
    });

    it("should fail auto-resolution for non-auto-resolvable suggestions", async () => {
      const nonAutoSuggestion: RemediationSuggestion = {
        ...mockSuggestion,
        autoResolvable: false,
      };

      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        nonAutoSuggestion
      );

      expect(result.status).toBe("failed");
      expect(result.error).toContain("not auto-resolvable");

      // Check that gap status was updated to failed
      const gaps = implementationSupport.getDetectedGaps();
      const failedGap = gaps.find((g) => g.gapId === mockGap.gapId);
      expect(failedGap?.status).toBe("failed");
    });

    it("should fail auto-resolution for high-risk suggestions", async () => {
      const highRiskSuggestion: RemediationSuggestion = {
        ...mockSuggestion,
        riskLevel: "high",
      };

      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        highRiskSuggestion
      );

      expect(result.status).toBe("failed");
      expect(result.error).toContain("risk level exceeds threshold");
    });

    it("should fail auto-resolution when disabled", async () => {
      const disabledConfig = { ...mockConfig, autoResolutionEnabled: false };
      const disabledSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        disabledConfig
      );

      const result = await disabledSupport.attemptAutoResolution(
        mockGap,
        mockSuggestion
      );

      expect(result.status).toBe("failed");
      expect(result.error).toContain("Auto-resolution is disabled");

      disabledSupport.destroy();
    });

    it("should handle configuration changes", async () => {
      const suggestionWithConfig: RemediationSuggestion = {
        ...mockSuggestion,
        implementation: {
          ...mockSuggestion.implementation,
          configurationChanges: [
            {
              file: "config.json",
              changes: { feature: "enabled" },
              explanation: "Enable feature",
            },
          ],
        },
      };

      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        suggestionWithConfig
      );

      expect(result.status).toBe("success");
      expect(result.appliedChanges.configurationsChanged).toContain(
        "config.json"
      );
    });

    it("should handle dependency updates", async () => {
      const suggestionWithDeps: RemediationSuggestion = {
        ...mockSuggestion,
        implementation: {
          ...mockSuggestion.implementation,
          dependencies: {
            add: ["new-package"],
            update: { "existing-package": "^2.0.0" },
          },
        },
      };

      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        suggestionWithDeps
      );

      expect(result.status).toBe("success");
      expect(result.appliedChanges.dependenciesUpdated).toContain(
        "package.json"
      );
    });
  });

  describe("analyzeBacklog", () => {
    beforeEach(async () => {
      // Add some gaps to analyze
      mockIntelligentRouter.executeSupportOperation.mockResolvedValueOnce({
        success: true,
        text: JSON.stringify({
          gaps: [
            {
              type: "missing_implementation",
              severity: "high",
              title: "Missing auth",
              description: "Auth not implemented",
              affectedModules: ["auth"],
              businessImpact: "Users cannot login",
              estimatedEffort: "medium",
              confidence: 0.9,
              technicalDetails: {},
            },
            {
              type: "performance_issue",
              severity: "medium",
              title: "Slow queries",
              description: "Database queries are slow",
              affectedModules: ["database"],
              businessImpact: "Poor performance",
              estimatedEffort: "low",
              confidence: 0.8,
              technicalDetails: {},
            },
          ],
        }),
        operationId: "gap-detection",
        latencyMs: 200,
        timestamp: new Date(),
      });

      await implementationSupport.detectImplementationGaps();
    });

    it("should analyze backlog and provide recommendations", async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          prioritizedGaps: ["gap-1", "gap-2"],
          suggestedSprints: [
            {
              sprintNumber: 1,
              duration: "2 weeks",
              gaps: ["gap-1"],
              estimatedEffort: "20 hours",
              businessValue: "High - enables user authentication",
            },
            {
              sprintNumber: 2,
              duration: "1 week",
              gaps: ["gap-2"],
              estimatedEffort: "8 hours",
              businessValue: "Medium - improves performance",
            },
          ],
          recommendations: {
            immediate: ["Fix authentication issues"],
            shortTerm: ["Optimize database queries"],
            longTerm: ["Redesign authentication system"],
          },
          riskAssessment: {
            highRiskGaps: ["gap-1"],
            blockers: ["Missing auth service"],
            dependencies: { "gap-2": ["gap-1"] },
          },
        }),
        operationId: "backlog-analysis",
        latencyMs: 500,
        timestamp: new Date(),
      });

      const analysis = await implementationSupport.analyzeBacklog();

      expect(analysis).toBeDefined();
      expect(analysis.totalGaps).toBeGreaterThan(0);
      expect(analysis.suggestedSprints).toHaveLength(2);
      expect(analysis.recommendations.immediate).toContain(
        "Fix authentication issues"
      );
      expect(analysis.riskAssessment.highRiskGaps).toContain("gap-1");

      // Check metrics
      const metrics = implementationSupport.getMetrics();
      expect(metrics.backlogAnalysesPerformed).toBe(1);
    });

    it("should handle empty backlog", async () => {
      // Create support with no gaps
      const emptySupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        mockConfig
      );

      const analysis = await emptySupport.analyzeBacklog();

      expect(analysis.totalGaps).toBe(0);
      expect(analysis.prioritizedGaps).toEqual([]);
      expect(analysis.suggestedSprints).toEqual([]);

      emptySupport.destroy();
    });

    it("should handle backlog analysis errors", async () => {
      mockIntelligentRouter.executeSupportOperation.mockRejectedValue(
        new Error("Backlog analysis failed")
      );

      const analysis = await implementationSupport.analyzeBacklog();

      expect(analysis.totalGaps).toBe(0);
      expect(analysis.prioritizedGaps).toEqual([]);
    });
  });

  describe("Health Status and Metrics", () => {
    it("should return health status", () => {
      const health = implementationSupport.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.isHealthy).toBeDefined();
      expect(health.totalGaps).toBeDefined();
      expect(health.resolvedGaps).toBeDefined();
      expect(health.resolutionRate).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    it("should return metrics", () => {
      const metrics = implementationSupport.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalGapsDetected).toBeDefined();
      expect(metrics.gapsResolved).toBeDefined();
      expect(metrics.autoResolutionsAttempted).toBeDefined();
      expect(metrics.detectedGapsCount).toBeDefined();
    });

    it("should calculate health based on resolution rate", async () => {
      // Add and resolve some gaps
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          gaps: [
            {
              type: "missing_implementation",
              severity: "medium",
              title: "Test gap",
              description: "Test description",
              affectedModules: ["test"],
              businessImpact: "Test impact",
              estimatedEffort: "low",
              confidence: 0.8,
              technicalDetails: {},
            },
          ],
        }),
        operationId: "test",
        latencyMs: 100,
        timestamp: new Date(),
      });

      await implementationSupport.detectImplementationGaps();

      const healthBefore = implementationSupport.getHealthStatus();
      expect(healthBefore.resolutionRate).toBe(0); // No gaps resolved yet

      // Simulate resolving the gap
      const gaps = implementationSupport.getDetectedGaps();
      if (gaps.length > 0) {
        gaps[0].status = "resolved";
      }

      const healthAfter = implementationSupport.getHealthStatus();
      expect(healthAfter.resolutionRate).toBeGreaterThan(0);
    });
  });

  describe("Gap Management", () => {
    beforeEach(async () => {
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          gaps: [
            {
              type: "missing_implementation",
              severity: "high",
              title: "High severity gap",
              description: "High severity description",
              affectedModules: ["module1"],
              businessImpact: "High impact",
              estimatedEffort: "medium",
              confidence: 0.9,
              technicalDetails: {},
            },
            {
              type: "performance_issue",
              severity: "low",
              title: "Low severity gap",
              description: "Low severity description",
              affectedModules: ["module2"],
              businessImpact: "Low impact",
              estimatedEffort: "low",
              confidence: 0.7,
              technicalDetails: {},
            },
          ],
        }),
        operationId: "gap-detection",
        latencyMs: 200,
        timestamp: new Date(),
      });

      await implementationSupport.detectImplementationGaps();
    });

    it("should get all detected gaps", () => {
      const gaps = implementationSupport.getDetectedGaps();

      expect(gaps).toHaveLength(2);
      expect(gaps.some((g) => g.severity === "high")).toBe(true);
      expect(gaps.some((g) => g.severity === "low")).toBe(true);
    });

    it("should filter gaps by severity", () => {
      const highSeverityGaps = implementationSupport.getGapsBySeverity("high");
      const lowSeverityGaps = implementationSupport.getGapsBySeverity("low");

      expect(highSeverityGaps).toHaveLength(1);
      expect(highSeverityGaps[0].severity).toBe("high");
      expect(lowSeverityGaps).toHaveLength(1);
      expect(lowSeverityGaps[0].severity).toBe("low");
    });

    it("should get suggestions for specific gap", async () => {
      const gaps = implementationSupport.getDetectedGaps();
      const testGap = gaps[0];

      // Generate suggestions for the gap
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              type: "code_fix",
              priority: "high",
              title: "Fix implementation",
              description: "Implement missing functionality",
              implementation: { steps: ["Step 1"] },
              estimatedTime: "2 hours",
              riskLevel: "low",
              testingRequired: false,
              autoResolvable: true,
            },
          ],
        }),
        operationId: "suggestions",
        latencyMs: 300,
        timestamp: new Date(),
      });

      await implementationSupport.generateRemediationSuggestions(testGap);

      const suggestions = implementationSupport.getSuggestionsForGap(
        testGap.gapId
      );
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].gapId).toBe(testGap.gapId);
    });
  });

  describe("Resource Management", () => {
    it("should cleanup resources on destroy", () => {
      const metrics = implementationSupport.getMetrics();
      expect(metrics.detectedGapsCount).toBeGreaterThanOrEqual(0);

      implementationSupport.destroy();

      // After destroy, data should be cleared
      const postDestroyMetrics = implementationSupport.getMetrics();
      expect(postDestroyMetrics.detectedGapsCount).toBe(0);
    });

    it("should handle multiple destroy calls safely", () => {
      expect(() => {
        implementationSupport.destroy();
        implementationSupport.destroy();
      }).not.toThrow();
    });
  });

  describe("Configuration Validation", () => {
    it("should work with minimal configuration", () => {
      const minimalSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter,
        { scanInterval: 1000 }
      );

      expect(minimalSupport).toBeDefined();
      expect(minimalSupport.getHealthStatus()).toBeDefined();

      minimalSupport.destroy();
    });

    it("should handle invalid configuration gracefully", () => {
      const invalidConfig = {
        scanInterval: -1000,
        maxAutoResolutionAttempts: -1,
      } as any;

      expect(() => {
        const invalidSupport = new ImplementationSupport(
          mockDirectBedrockClient,
          mockIntelligentRouter,
          invalidConfig
        );
        invalidSupport.destroy();
      }).not.toThrow();
    });
  });
});
