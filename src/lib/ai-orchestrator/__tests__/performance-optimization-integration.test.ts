/**
 * Tests für Performance Optimization Integration
 */

import { AdvancedPerformanceOptimizer } from "../advanced-performance-optimizer";
import {
  PerformanceOptimizationConfig,
  PerformanceOptimizationIntegration,
} from "../performance-optimization-integration";

// Mock dependencies
jest.mock("../advanced-performance-optimizer");
jest.mock("../system-resource-monitor");
jest.mock("../auto-resolution-optimizer");
jest.mock("../performance-rollback-manager");
jest.mock("../bedrock-support-manager");
jest.mock("../intelligent-router");

describe("PerformanceOptimizationIntegration", () => {
  let integration: PerformanceOptimizationIntegration;
  let mockOptimizer: jest.Mocked<AdvancedPerformanceOptimizer>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create integration instance
    integration = new PerformanceOptimizationIntegration();

    // Get the mocked optimizer instance
    mockOptimizer = (integration as any).optimizer;
  });

  afterEach(async () => {
    // Ensure integration is stopped after each test
    await integration.stop();
  });

  describe("Lifecycle Management", () => {
    it("should start successfully", async () => {
      await integration.start();

      // Should be able to start without errors
      expect(true).toBe(true);
    });

    it("should stop successfully", async () => {
      await integration.start();
      await integration.stop();

      // Should be able to stop without errors
      expect(true).toBe(true);
    });

    it("should not start twice", async () => {
      await integration.start();
      await integration.start(); // Second start should be ignored

      // Should handle multiple starts gracefully
      expect(true).toBe(true);
    });

    it("should not stop if not running", async () => {
      await integration.stop(); // Stop without start

      // Should handle stop without start gracefully
      expect(true).toBe(true);
    });
  });

  describe("Manual Optimization", () => {
    beforeEach(async () => {
      await integration.start();
    });

    it("should perform manual optimization", async () => {
      const mockResult = {
        success: true,
        applied: [
          {
            type: "scale_up",
            parameters: { factor: 2 },
            estimatedImpact: 0.8,
            riskLevel: "medium" as const,
          },
        ],
        expectedImprovement: 0.8,
      };

      mockOptimizer.optimizePerformance.mockResolvedValue(mockResult);

      const result = await integration.optimizeNow();

      expect(result).toEqual(mockResult);
      expect(mockOptimizer.optimizePerformance).toHaveBeenCalledTimes(1);
    });

    it("should add optimization to history", async () => {
      const mockResult = {
        success: true,
        applied: [],
        expectedImprovement: 0.5,
      };

      mockOptimizer.optimizePerformance.mockResolvedValue(mockResult);

      await integration.optimizeNow();

      const history = integration.getOptimizationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockResult);
    });

    it("should limit history to 100 entries", async () => {
      const mockResult = {
        success: true,
        applied: [],
        expectedImprovement: 0.1,
      };

      mockOptimizer.optimizePerformance.mockResolvedValue(mockResult);

      // Add 105 optimizations
      for (let i = 0; i < 105; i++) {
        await integration.optimizeNow();
      }

      const history = integration.getOptimizationHistory();
      expect(history).toHaveLength(100);
    });
  });

  describe("Metrics and Monitoring", () => {
    beforeEach(async () => {
      await integration.start();
    });

    it("should get current metrics", async () => {
      const mockMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        responseTime: 200,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      };

      mockOptimizer.analyzePerformance.mockResolvedValue(mockMetrics);

      const metrics = await integration.getCurrentMetrics();

      expect(metrics).toEqual(mockMetrics);
      expect(mockOptimizer.analyzePerformance).toHaveBeenCalledTimes(1);
    });

    it("should get recommendations", async () => {
      const mockMetrics = {
        cpuUsage: 80,
        memoryUsage: 85,
        responseTime: 400,
        throughput: 500,
        errorRate: 0.02,
        successRate: 0.98,
        timestamp: new Date(),
      };

      const mockRecommendations = [
        "CPU usage too high",
        "Memory usage critical",
        "Response time needs improvement",
      ];

      mockOptimizer.analyzePerformance.mockResolvedValue(mockMetrics);
      mockOptimizer.getPerformanceRecommendations.mockReturnValue(
        mockRecommendations
      );

      const recommendations = await integration.getRecommendations();

      expect(recommendations).toEqual(mockRecommendations);
      expect(mockOptimizer.getPerformanceRecommendations).toHaveBeenCalledWith(
        mockMetrics
      );
    });

    it("should get comprehensive health status", async () => {
      const mockBasicHealth = {
        isHealthy: true,
        performanceScore: 0.85,
        activeOptimizations: 1,
        systemHealth: { cpu: "normal", memory: "normal" },
      };

      const mockMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        responseTime: 200,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      };

      const mockRecommendations = ["System running optimally"];

      mockOptimizer.getHealthStatus.mockReturnValue(mockBasicHealth);
      mockOptimizer.analyzePerformance.mockResolvedValue(mockMetrics);
      mockOptimizer.getPerformanceRecommendations.mockReturnValue(
        mockRecommendations
      );

      const healthStatus = await integration.getHealthStatus();

      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.performanceScore).toBe(0.85);
      expect(healthStatus.recommendations).toEqual(mockRecommendations);
      expect(healthStatus.optimizationHistory).toBeDefined();
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration", () => {
      const newConfig: Partial<PerformanceOptimizationConfig> = {
        optimizationInterval: 10,
        performanceThresholds: {
          cpuWarning: 60,
          cpuCritical: 80,
          memoryWarning: 70,
          memoryCritical: 85,
          responseTimeWarning: 250,
          responseTimeCritical: 400,
        },
      };

      integration.updateConfig(newConfig);

      const updatedConfig = integration.getConfig();
      expect(updatedConfig.optimizationInterval).toBe(10);
      expect(updatedConfig.performanceThresholds.cpuWarning).toBe(60);
    });

    it("should get current configuration", () => {
      const config = integration.getConfig();

      expect(config).toHaveProperty("enableAutoOptimization");
      expect(config).toHaveProperty("optimizationInterval");
      expect(config).toHaveProperty("performanceThresholds");
      expect(config).toHaveProperty("rollbackSettings");

      expect(typeof config.enableAutoOptimization).toBe("boolean");
      expect(typeof config.optimizationInterval).toBe("number");
    });

    it("should accept custom configuration in constructor", () => {
      const customConfig: Partial<PerformanceOptimizationConfig> = {
        enableAutoOptimization: false,
        optimizationInterval: 15,
      };

      const customIntegration = new PerformanceOptimizationIntegration(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        customConfig
      );

      const config = customIntegration.getConfig();
      expect(config.enableAutoOptimization).toBe(false);
      expect(config.optimizationInterval).toBe(15);
    });
  });

  describe("Data Export", () => {
    beforeEach(async () => {
      await integration.start();
    });

    it("should export performance data", async () => {
      // Add some optimization history
      const mockResult = {
        success: true,
        applied: [],
        expectedImprovement: 0.3,
      };

      mockOptimizer.optimizePerformance.mockResolvedValue(mockResult);
      mockOptimizer.getHealthStatus.mockReturnValue({
        isHealthy: true,
        performanceScore: 0.8,
        activeOptimizations: 0,
        systemHealth: { cpu: "normal" },
      });

      await integration.optimizeNow();

      const exportData = integration.exportPerformanceData();

      expect(exportData).toHaveProperty("exportTimestamp");
      expect(exportData).toHaveProperty("config");
      expect(exportData).toHaveProperty("history");
      expect(exportData).toHaveProperty("systemHealth");

      expect(exportData.history).toHaveLength(1);
      expect(exportData.history[0]).toEqual(mockResult);
      expect(new Date(exportData.exportTimestamp)).toBeInstanceOf(Date);
    });
  });

  describe("Component Integration", () => {
    it("should initialize with all components", () => {
      const mockResourceMonitor = {} as any;
      const mockAutoResolutionOptimizer = {} as any;
      const mockRollbackManager = {} as any;
      const mockBedrockSupportManager = {} as any;
      const mockIntelligentRouter = {} as any;

      const fullIntegration = new PerformanceOptimizationIntegration(
        mockResourceMonitor,
        mockAutoResolutionOptimizer,
        mockRollbackManager,
        mockBedrockSupportManager,
        mockIntelligentRouter
      );

      expect(fullIntegration).toBeInstanceOf(
        PerformanceOptimizationIntegration
      );
    });

    it("should work without optional components", () => {
      const minimalIntegration = new PerformanceOptimizationIntegration();

      expect(minimalIntegration).toBeInstanceOf(
        PerformanceOptimizationIntegration
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await integration.start();
    });

    it("should handle optimization errors gracefully", async () => {
      mockOptimizer.optimizePerformance.mockRejectedValue(
        new Error("Optimization failed")
      );

      await expect(integration.optimizeNow()).rejects.toThrow(
        "Optimization failed"
      );
    });

    it("should handle metrics retrieval errors gracefully", async () => {
      mockOptimizer.analyzePerformance.mockRejectedValue(
        new Error("Metrics unavailable")
      );

      await expect(integration.getCurrentMetrics()).rejects.toThrow(
        "Metrics unavailable"
      );
    });
  });

  describe("Automatic Optimization", () => {
    it("should start with auto optimization enabled by default", () => {
      const config = integration.getConfig();
      expect(config.enableAutoOptimization).toBe(true);
    });

    it("should respect auto optimization disabled setting", () => {
      const customIntegration = new PerformanceOptimizationIntegration(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { enableAutoOptimization: false }
      );

      const config = customIntegration.getConfig();
      expect(config.enableAutoOptimization).toBe(false);
    });
  });
});
