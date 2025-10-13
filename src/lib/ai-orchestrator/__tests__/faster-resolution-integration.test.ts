/**
 * Tests for Faster Resolution Integration with Implementation Support
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import { FasterResolutionOptimizer } from "../faster-resolution-optimizer";
import {
  ImplementationGap,
  ImplementationSupport,
  RemediationSuggestion,
} from "../implementation-support";
import { IntelligentRouter } from "../intelligent-router";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../direct-bedrock-client");
jest.mock("../intelligent-router");
jest.mock("../faster-resolution-optimizer");

describe("Faster Resolution Integration", () => {
  let implementationSupport: ImplementationSupport;
  let mockDirectBedrockClient: jest.Mocked<DirectBedrockClient>;
  let mockIntelligentRouter: jest.Mocked<IntelligentRouter>;
  let mockFasterResolutionOptimizer: jest.Mocked<FasterResolutionOptimizer>;

  beforeEach(() => {
    // Setup mocks
    mockDirectBedrockClient = {
      executeSupportOperation: jest.fn(),
      getHealthStatus: jest.fn(),
    } as any;

    mockIntelligentRouter = {
      executeSupportOperation: jest.fn(),
      makeRoutingDecision: jest.fn(),
    } as any;

    mockFasterResolutionOptimizer = {
      optimizeResolutionSpeed: jest.fn(),
      getSpeedMetrics: jest.fn(),
      isTargetSpeedAchieved: jest.fn(),
      getSpeedOptimizationRecommendations: jest.fn(),
      performSpeedOptimization: jest.fn(),
      destroy: jest.fn(),
    } as any;

    // Mock feature flags
    const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
    mockFeatureFlags.prototype.isEnabled = jest.fn().mockReturnValue(true);

    // Create implementation support instance
    implementationSupport = new ImplementationSupport(
      mockDirectBedrockClient,
      mockIntelligentRouter
    );

    // Replace the faster resolution optimizer with our mock
    (implementationSupport as any).fasterResolutionOptimizer =
      mockFasterResolutionOptimizer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("optimizeResolutionSpeed", () => {
    it("should use faster resolution optimizer when enabled", async () => {
      // Arrange
      const mockGaps: ImplementationGap[] = [
        {
          gapId: "gap-1",
          type: "missing_implementation",
          severity: "high",
          title: "Missing API endpoint",
          description: "API endpoint not implemented",
          affectedModules: ["api"],
          detectedAt: new Date(),
          lastUpdated: new Date(),
          status: "detected",
          confidence: 0.9,
          estimatedEffort: "medium",
          businessImpact: "High impact on user experience",
          technicalDetails: {
            missingComponents: ["endpoint handler"],
          },
        },
        {
          gapId: "gap-2",
          type: "incomplete_feature",
          severity: "medium",
          title: "Incomplete validation",
          description: "Input validation not complete",
          affectedModules: ["validation"],
          detectedAt: new Date(),
          lastUpdated: new Date(),
          status: "detected",
          confidence: 0.8,
          estimatedEffort: "low",
          businessImpact: "Medium security risk",
          technicalDetails: {
            missingComponents: ["validation rules"],
          },
        },
      ];

      const mockSuggestions = new Map([
        [
          "gap-1",
          [
            {
              suggestionId: "suggestion-1",
              gapId: "gap-1",
              type: "code_fix",
              priority: "high",
              title: "Implement API endpoint",
              description: "Add missing endpoint handler",
              implementation: {
                steps: ["Create handler", "Add routing"],
              },
              estimatedTime: "2 hours",
              riskLevel: "low",
              testingRequired: true,
              createdAt: new Date(),
              autoResolvable: true,
            },
          ],
        ],
        [
          "gap-2",
          [
            {
              suggestionId: "suggestion-2",
              gapId: "gap-2",
              type: "code_fix",
              priority: "medium",
              title: "Add validation rules",
              description: "Complete input validation",
              implementation: {
                steps: ["Add validation schema", "Update middleware"],
              },
              estimatedTime: "1 hour",
              riskLevel: "low",
              testingRequired: true,
              createdAt: new Date(),
              autoResolvable: true,
            },
          ],
        ],
      ]);

      const mockOptimizationResult = {
        results: [
          {
            resolutionId: "resolution-1",
            gapId: "gap-1",
            suggestionId: "suggestion-1",
            status: "success" as const,
            startedAt: new Date(),
            completedAt: new Date(),
            appliedChanges: {
              filesModified: ["api/handler.ts"],
              configurationsChanged: [],
              dependenciesUpdated: [],
            },
            validationResults: {
              testsRun: 2,
              testsPassed: 2,
              testsFailed: 0,
            },
            rollbackAvailable: true,
            logs: ["Successfully implemented API endpoint"],
          },
          {
            resolutionId: "resolution-2",
            gapId: "gap-2",
            suggestionId: "suggestion-2",
            status: "success" as const,
            startedAt: new Date(),
            completedAt: new Date(),
            appliedChanges: {
              filesModified: ["validation/schema.ts"],
              configurationsChanged: [],
              dependenciesUpdated: [],
            },
            validationResults: {
              testsRun: 1,
              testsPassed: 1,
              testsFailed: 0,
            },
            rollbackAvailable: true,
            logs: ["Successfully added validation rules"],
          },
        ],
        speedMetrics: {
          averageResolutionTime: 25000, // 25 seconds
          fastestResolution: 20000,
          slowestResolution: 30000,
          totalResolutionsProcessed: 2,
          parallelProcessingEfficiency: 0.8,
          cacheHitRate: 0.6,
          batchProcessingGains: 15,
          targetSpeedAchieved: true,
          speedImprovement: 44.4, // 44.4% improvement over 45s baseline
        },
        optimizationGains: 44.4,
      };

      // Mock the intelligent router to return suggestions
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              suggestionId: "suggestion-1",
              type: "code_fix",
              title: "Implement API endpoint",
              autoResolvable: true,
            },
            {
              suggestionId: "suggestion-2",
              type: "code_fix",
              title: "Add validation rules",
              autoResolvable: true,
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 200 },
        latency: 1500,
      });

      // Mock the faster resolution optimizer
      mockFasterResolutionOptimizer.optimizeResolutionSpeed.mockResolvedValue(
        mockOptimizationResult
      );

      // Act
      const result = await implementationSupport.optimizeResolutionSpeed(
        mockGaps
      );

      // Assert
      expect(
        mockFasterResolutionOptimizer.optimizeResolutionSpeed
      ).toHaveBeenCalledWith(mockGaps, expect.any(Map));
      expect(result.results).toHaveLength(2);
      expect(result.speedMetrics.targetSpeedAchieved).toBe(true);
      expect(result.optimizationGains).toBe(44.4);
      expect(result.speedMetrics.averageResolutionTime).toBe(25000);
    });

    it("should fall back to standard resolution when faster optimizer is disabled", async () => {
      // Arrange
      const mockFeatureFlags = require("../ai-feature-flags").AiFeatureFlags;
      mockFeatureFlags.prototype.isEnabled = jest
        .fn()
        .mockImplementation((flag: string) => {
          if (flag === "ENABLE_FASTER_RESOLUTION_OPTIMIZER") return false;
          return true; // Enable other flags
        });

      // Create a new instance with the updated feature flags
      const newImplementationSupport = new ImplementationSupport(
        mockDirectBedrockClient,
        mockIntelligentRouter
      );
      (newImplementationSupport as any).fasterResolutionOptimizer =
        mockFasterResolutionOptimizer;

      const mockGaps: ImplementationGap[] = [
        {
          gapId: "gap-1",
          type: "missing_implementation",
          severity: "high",
          title: "Missing API endpoint",
          description: "API endpoint not implemented",
          affectedModules: ["api"],
          detectedAt: new Date(),
          lastUpdated: new Date(),
          status: "detected",
          confidence: 0.9,
          estimatedEffort: "medium",
          businessImpact: "High impact on user experience",
          technicalDetails: {
            missingComponents: ["endpoint handler"],
          },
        },
      ];

      // Mock suggestion generation
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              suggestionId: "suggestion-1",
              type: "code_fix",
              title: "Implement API endpoint",
              autoResolvable: true,
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 200 },
        latency: 1500,
      });

      // Mock speed metrics
      mockFasterResolutionOptimizer.getSpeedMetrics.mockReturnValue({
        averageResolutionTime: 0,
        targetSpeedAchieved: false,
      });

      // Act
      const result = await newImplementationSupport.optimizeResolutionSpeed(
        mockGaps
      );

      // Assert
      expect(
        mockFasterResolutionOptimizer.optimizeResolutionSpeed
      ).not.toHaveBeenCalled();
      expect(result.optimizationGains).toBe(0);
      expect(mockFasterResolutionOptimizer.getSpeedMetrics).toHaveBeenCalled();
    });

    it("should handle errors gracefully and fall back to standard resolution", async () => {
      // Arrange
      const mockGaps: ImplementationGap[] = [
        {
          gapId: "gap-1",
          type: "missing_implementation",
          severity: "high",
          title: "Missing API endpoint",
          description: "API endpoint not implemented",
          affectedModules: ["api"],
          detectedAt: new Date(),
          lastUpdated: new Date(),
          status: "detected",
          confidence: 0.9,
          estimatedEffort: "medium",
          businessImpact: "High impact on user experience",
          technicalDetails: {
            missingComponents: ["endpoint handler"],
          },
        },
      ];

      // Mock suggestion generation
      mockIntelligentRouter.executeSupportOperation.mockResolvedValue({
        success: true,
        text: JSON.stringify({
          suggestions: [
            {
              suggestionId: "suggestion-1",
              type: "code_fix",
              title: "Implement API endpoint",
              autoResolvable: true,
            },
          ],
        }),
        usage: { inputTokens: 100, outputTokens: 200 },
        latency: 1500,
      });

      // Mock faster resolution optimizer to throw error
      mockFasterResolutionOptimizer.optimizeResolutionSpeed.mockRejectedValue(
        new Error("Optimization failed")
      );

      // Mock speed metrics
      mockFasterResolutionOptimizer.getSpeedMetrics.mockReturnValue({
        averageResolutionTime: 0,
        targetSpeedAchieved: false,
      });

      // Act
      const result = await implementationSupport.optimizeResolutionSpeed(
        mockGaps
      );

      // Assert
      expect(
        mockFasterResolutionOptimizer.optimizeResolutionSpeed
      ).toHaveBeenCalled();
      expect(result.optimizationGains).toBe(0);
      expect(mockFasterResolutionOptimizer.getSpeedMetrics).toHaveBeenCalled();
    });
  });

  describe("faster resolution metrics and status", () => {
    it("should check if faster resolution target is achieved", () => {
      // Arrange
      mockFasterResolutionOptimizer.isTargetSpeedAchieved.mockReturnValue(true);

      // Act
      const isAchieved =
        implementationSupport.isFasterResolutionTargetAchieved();

      // Assert
      expect(isAchieved).toBe(true);
      expect(
        mockFasterResolutionOptimizer.isTargetSpeedAchieved
      ).toHaveBeenCalled();
    });

    it("should get faster resolution metrics", () => {
      // Arrange
      const mockMetrics = {
        averageResolutionTime: 25000,
        targetSpeedAchieved: true,
        speedImprovement: 44.4,
      };
      mockFasterResolutionOptimizer.getSpeedMetrics.mockReturnValue(
        mockMetrics
      );

      // Act
      const metrics = implementationSupport.getFasterResolutionMetrics();

      // Assert
      expect(metrics).toEqual(mockMetrics);
      expect(mockFasterResolutionOptimizer.getSpeedMetrics).toHaveBeenCalled();
    });

    it("should get speed optimization recommendations", () => {
      // Arrange
      const mockRecommendations = [
        "Enable pattern caching for better performance",
        "Increase parallel processing for faster resolution",
      ];
      mockFasterResolutionOptimizer.getSpeedOptimizationRecommendations.mockReturnValue(
        mockRecommendations
      );

      // Act
      const recommendations =
        implementationSupport.getSpeedOptimizationRecommendations();

      // Assert
      expect(recommendations).toEqual(mockRecommendations);
      expect(
        mockFasterResolutionOptimizer.getSpeedOptimizationRecommendations
      ).toHaveBeenCalled();
    });

    it("should perform speed optimization analysis", async () => {
      // Arrange
      const mockOptimizationAnalysis = {
        currentMetrics: {
          averageResolutionTime: 35000,
          cacheHitRate: 0.3,
        },
        optimizationActions: [
          "Preload common resolution patterns",
          "Increase parallel processing capacity",
        ],
        estimatedImprovement: 25,
      };
      mockFasterResolutionOptimizer.performSpeedOptimization.mockResolvedValue(
        mockOptimizationAnalysis
      );

      // Act
      const result = await implementationSupport.performSpeedOptimization();

      // Assert
      expect(result).toEqual(mockOptimizationAnalysis);
      expect(
        mockFasterResolutionOptimizer.performSpeedOptimization
      ).toHaveBeenCalled();
    });
  });

  describe("integration with existing auto-resolution", () => {
    it("should maintain compatibility with existing auto-resolution methods", async () => {
      // Arrange
      const mockGap: ImplementationGap = {
        gapId: "gap-1",
        type: "missing_implementation",
        severity: "high",
        title: "Missing API endpoint",
        description: "API endpoint not implemented",
        affectedModules: ["api"],
        detectedAt: new Date(),
        lastUpdated: new Date(),
        status: "detected",
        confidence: 0.9,
        estimatedEffort: "medium",
        businessImpact: "High impact on user experience",
        technicalDetails: {
          missingComponents: ["endpoint handler"],
        },
      };

      const mockSuggestion: RemediationSuggestion = {
        suggestionId: "suggestion-1",
        gapId: "gap-1",
        type: "code_fix",
        priority: "high",
        title: "Implement API endpoint",
        description: "Add missing endpoint handler",
        implementation: {
          steps: ["Create handler", "Add routing"],
        },
        estimatedTime: "2 hours",
        riskLevel: "low",
        testingRequired: true,
        createdAt: new Date(),
        autoResolvable: true,
      };

      // Mock the auto-resolution optimizer
      const mockAutoResolutionOptimizer = {
        performEnhancedRiskAssessment: jest.fn().mockResolvedValue({
          recommendedAction: "auto_resolve",
          overallRisk: "low",
        }),
        optimizeResolutionStrategy: jest.fn().mockResolvedValue({
          strategy: "direct_implementation",
        }),
        executeOptimizedResolution: jest.fn().mockResolvedValue({
          resolutionId: "resolution-1",
          gapId: "gap-1",
          suggestionId: "suggestion-1",
          status: "success",
          startedAt: new Date(),
          completedAt: new Date(),
          appliedChanges: {
            filesModified: ["api/handler.ts"],
            configurationsChanged: [],
            dependenciesUpdated: [],
          },
          validationResults: {
            testsRun: 2,
            testsPassed: 2,
            testsFailed: 0,
          },
          rollbackAvailable: true,
          logs: ["Successfully implemented API endpoint"],
        }),
      };

      (implementationSupport as any).autoResolutionOptimizer =
        mockAutoResolutionOptimizer;

      // Act
      const result = await implementationSupport.attemptAutoResolution(
        mockGap,
        mockSuggestion
      );

      // Assert
      expect(result.status).toBe("success");
      expect(
        mockAutoResolutionOptimizer.performEnhancedRiskAssessment
      ).toHaveBeenCalled();
      expect(
        mockAutoResolutionOptimizer.optimizeResolutionStrategy
      ).toHaveBeenCalled();
      expect(
        mockAutoResolutionOptimizer.executeOptimizedResolution
      ).toHaveBeenCalled();
    });
  });
});
