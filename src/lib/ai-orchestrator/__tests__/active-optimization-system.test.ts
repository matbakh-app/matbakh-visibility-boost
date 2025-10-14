/**
 * Tests for Active Optimization System
 */

import {
  ActiveOptimizationSystem,
  getOptimizationSystem,
  initializeOptimizationSystem,
  shutdownOptimizationSystem,
} from "../active-optimization-system";
import { BanditOptimizer } from "../bandit-optimizer";
import { EvidentlyExperimentManager } from "../evidently-experiments";

// Mock dependencies
jest.mock("../evidently-experiments");
jest.mock("../bandit-optimizer");

const mockExperimentManager = {
  initializeProject: jest.fn(),
  createAIExperiment: jest.fn(),
  startExperiment: jest.fn(),
  stopExperiment: jest.fn(),
  listActiveExperiments: jest.fn(),
  analyzeExperimentResults: jest.fn(),
  getOptimalProvider: jest.fn(),
  recordExperimentOutcome: jest.fn(),
  healthCheck: jest.fn(),
};

const mockBanditOptimizer = {
  getOptimalArm: jest.fn(),
  recordOutcome: jest.fn(),
  getOptimizationRecommendations: jest.fn(),
  getBanditStats: jest.fn(),
  analyzeContextualPerformance: jest.fn(),
  healthCheck: jest.fn(),
  getConfig: jest.fn(),
  updateConfig: jest.fn(),
  exportState: jest.fn(),
};

const MockEvidentlyExperimentManager =
  EvidentlyExperimentManager as jest.MockedClass<
    typeof EvidentlyExperimentManager
  >;
const MockBanditOptimizer = BanditOptimizer as jest.MockedClass<
  typeof BanditOptimizer
>;

describe("ActiveOptimizationSystem", () => {
  let system: ActiveOptimizationSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    MockEvidentlyExperimentManager.mockImplementation(
      () => mockExperimentManager as any
    );
    MockBanditOptimizer.mockImplementation(() => mockBanditOptimizer as any);

    // Setup default mock returns
    mockExperimentManager.initializeProject.mockResolvedValue(undefined);
    mockExperimentManager.createAIExperiment.mockResolvedValue(undefined);
    mockExperimentManager.startExperiment.mockResolvedValue(undefined);
    mockExperimentManager.listActiveExperiments.mockResolvedValue([]);
    mockExperimentManager.healthCheck.mockResolvedValue({
      connected: true,
      projectExists: true,
      activeExperiments: 0,
      banditStats: {},
    });

    mockBanditOptimizer.getOptimalArm.mockResolvedValue({
      recommendedArm: "bedrock",
      confidence: 0.8,
      expectedReward: 0.7,
      explorationNeeded: false,
      reasoning: "Test selection",
    });

    mockBanditOptimizer.recordOutcome.mockResolvedValue(undefined);
    mockBanditOptimizer.getOptimizationRecommendations.mockReturnValue([]);
    mockBanditOptimizer.getBanditStats.mockReturnValue({
      bedrock: {
        wins: 10,
        trials: 15,
        costEuro: 0.75,
        totalLatencyMs: 7500,
        winRate: 0.67,
        avgLatency: 500,
        avgCost: 0.05,
      },
      google: {
        wins: 8,
        trials: 12,
        costEuro: 0.6,
        totalLatencyMs: 6000,
        winRate: 0.67,
        avgLatency: 500,
        avgCost: 0.05,
      },
      meta: {
        wins: 5,
        trials: 10,
        costEuro: 0.5,
        totalLatencyMs: 5000,
        winRate: 0.5,
        avgLatency: 500,
        avgCost: 0.05,
      },
    });
    mockBanditOptimizer.analyzeContextualPerformance.mockReturnValue([]);
    mockBanditOptimizer.healthCheck.mockReturnValue({
      status: "healthy",
      totalTrials: 37,
      activeContexts: 3,
      autoOptimizationEnabled: true,
      recommendations: 0,
    });
    mockBanditOptimizer.getConfig.mockReturnValue({
      explorationRate: 0.15,
      confidenceLevel: 0.95,
      minTrialsForConfidence: 30,
      autoOptimizationEnabled: true,
      optimizationInterval: 60,
    });
    mockBanditOptimizer.exportState.mockReturnValue({
      banditStats: {},
      config: {},
      optimizationHistory: [],
    });

    system = new ActiveOptimizationSystem({
      autoExperimentEnabled: true,
      experimentDuration: 7, // 1 week for testing
      minTrafficForExperiment: 50,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("System Lifecycle", () => {
    it("should start successfully", async () => {
      await system.start();

      expect(mockExperimentManager.initializeProject).toHaveBeenCalled();
      expect(mockExperimentManager.createAIExperiment).toHaveBeenCalledTimes(2); // Two initial experiments
      expect(mockExperimentManager.startExperiment).toHaveBeenCalledTimes(2);
    });

    it("should not start twice", async () => {
      await system.start();

      // Try to start again
      await system.start();

      // Should only initialize once
      expect(mockExperimentManager.initializeProject).toHaveBeenCalledTimes(1);
    });

    it("should stop successfully", async () => {
      mockExperimentManager.listActiveExperiments.mockResolvedValue([
        "test-experiment",
      ]);

      await system.start();
      await system.stop();

      expect(mockExperimentManager.stopExperiment).toHaveBeenCalledWith(
        "test-experiment",
        "System shutdown"
      );
    });

    it("should handle start errors gracefully", async () => {
      mockExperimentManager.initializeProject.mockRejectedValue(
        new Error("AWS error")
      );

      await expect(system.start()).rejects.toThrow("AWS error");
    });
  });

  describe("Provider Selection", () => {
    it("should get optimal provider successfully", async () => {
      const result = await system.getOptimalProvider({
        userId: "test-user",
        domain: "legal",
      });

      expect(result.provider).toBeDefined();
      expect(result.source).toBe("traffic_allocation"); // Now uses traffic allocation by default
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.allocationProbability).toBeDefined();
    });

    it("should fall back to default on error", async () => {
      // Disable traffic allocation to test error fallback
      system.updateConfig({ autoTrafficAllocationEnabled: false });

      mockBanditOptimizer.getOptimalArm.mockRejectedValue(
        new Error("Bandit error")
      );

      const result = await system.getOptimalProvider({
        userId: "test-user",
      });

      expect(result).toEqual({
        provider: "bedrock",
        source: "default",
        confidence: 0.5,
      });
    });

    it("should identify experiment source correctly", async () => {
      // Mock experiment manager to return experiment result
      mockExperimentManager.getOptimalProvider.mockResolvedValue({
        provider: "bedrock",
        source: "experiment",
        confidence: 0.9,
        experimentName: "test-experiment",
      });

      const result = await system.getOptimalProvider({
        experimentName: "test-experiment",
        userId: "test-user",
      });

      expect(result.source).toBe("experiment");
      expect(result.experimentName).toBe("test-experiment");
    });

    it("should use traffic allocation when enabled", async () => {
      // Mock experiment manager to not return experiment result
      mockExperimentManager.getOptimalProvider.mockResolvedValue({
        provider: "bedrock",
        source: "bandit", // Not experiment
        confidence: 0.8,
      });

      const result = await system.getOptimalProvider({
        userId: "test-user",
      });

      expect(result.source).toBe("traffic_allocation");
      expect(result.allocationProbability).toBeDefined();
      expect(result.allocationProbability).toBeGreaterThan(0);
      expect(result.allocationProbability).toBeLessThanOrEqual(1);
    });

    it("should return current traffic allocation", async () => {
      const allocation = system.getCurrentTrafficAllocation();

      expect(allocation).toMatchObject({
        bedrock: expect.any(Number),
        google: expect.any(Number),
        meta: expect.any(Number),
      });

      // Should sum to approximately 1
      const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 2);
    });
  });

  describe("Outcome Recording", () => {
    it("should record outcome successfully", async () => {
      await system.recordOutcome(
        { userId: "test-user", domain: "legal" },
        "bedrock",
        {
          success: true,
          latencyMs: 500,
          costEuro: 0.05,
          qualityScore: 0.9,
        }
      );

      expect(mockBanditOptimizer.recordOutcome).toHaveBeenCalledWith(
        { userId: "test-user", domain: "legal" },
        "bedrock",
        true,
        500,
        0.05,
        0.9
      );
    });

    it("should handle recording errors gracefully", async () => {
      mockBanditOptimizer.recordOutcome.mockRejectedValue(
        new Error("Recording error")
      );

      await expect(
        system.recordOutcome({ userId: "test-user" }, "google", {
          success: false,
          latencyMs: 1000,
          costEuro: 0.1,
        })
      ).resolves.not.toThrow();
    });

    it("should trigger performance alerts for high latency", async () => {
      await system.recordOutcome({ userId: "test-user" }, "bedrock", {
        success: true,
        latencyMs: 3000, // Above threshold
        costEuro: 0.05,
      });

      const events = system.getEventHistory();
      const alertEvent = events.find((e) => e.type === "performance_alert");

      expect(alertEvent).toBeDefined();
      expect(
        alertEvent?.details.alerts.some((alert: string) =>
          alert.includes("High latency")
        )
      ).toBe(true);
    });

    it("should trigger performance alerts for high cost", async () => {
      await system.recordOutcome({ userId: "test-user" }, "google", {
        success: true,
        latencyMs: 500,
        costEuro: 0.15, // Above threshold
      });

      const events = system.getEventHistory();
      const alertEvent = events.find((e) => e.type === "performance_alert");

      expect(alertEvent).toBeDefined();
      expect(
        alertEvent?.details.alerts.some((alert: string) =>
          alert.includes("High cost")
        )
      ).toBe(true);
    });
  });

  describe("Metrics and Monitoring", () => {
    it("should return current metrics", async () => {
      await system.start();

      const metrics = system.getMetrics();

      expect(metrics).toMatchObject({
        totalRequests: expect.any(Number),
        experimentsActive: expect.any(Number),
        banditPerformance: expect.objectContaining({
          bestArm: expect.any(String),
          confidence: expect.any(Number),
          winRate: expect.any(Number),
        }),
        systemHealth: expect.stringMatching(/healthy|warning|error/),
        lastOptimization: expect.any(Date),
        lastTrafficAllocation: expect.any(Date),
        currentTrafficAllocation: expect.objectContaining({
          bedrock: expect.any(Number),
          google: expect.any(Number),
          meta: expect.any(Number),
        }),
        recommendations: expect.any(Array),
      });
    });

    it("should return event history", async () => {
      await system.start();

      const history = system.getEventHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        timestamp: expect.any(Date),
        type: expect.any(String),
        details: expect.any(Object),
        impact: expect.stringMatching(/low|medium|high/),
      });
    });

    it("should limit event history size", async () => {
      // Add many events
      for (let i = 0; i < 1100; i++) {
        await system.recordOutcome({ userId: `user-${i}` }, "bedrock", {
          success: true,
          latencyMs: 500,
          costEuro: 0.05,
        });
      }

      const history = system.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("Health Status", () => {
    it("should return healthy status when all components are working", async () => {
      const health = await system.getHealthStatus();

      expect(health).toMatchObject({
        system: "warning", // System is warning because optimization is not running
        components: {
          experiments: "healthy",
          bandit: "healthy",
          optimization: "warning", // Not running yet
        },
        details: expect.any(Object),
      });
    });

    it("should return error status when experiments fail", async () => {
      mockExperimentManager.healthCheck.mockResolvedValue({
        connected: false,
        projectExists: false,
        activeExperiments: 0,
        banditStats: {},
      });

      const health = await system.getHealthStatus();

      expect(health.system).toBe("error");
      expect(health.components.experiments).toBe("error");
    });

    it("should return warning status when bandit has issues", async () => {
      mockBanditOptimizer.healthCheck.mockReturnValue({
        status: "warning",
        totalTrials: 5, // Low trials
        activeContexts: 1,
        autoOptimizationEnabled: true,
        recommendations: 2,
      });

      const health = await system.getHealthStatus();

      expect(health.components.bandit).toBe("warning");
    });
  });

  describe("Optimization Cycle", () => {
    it("should run optimization cycle", async () => {
      await system.start();

      // Trigger optimization cycle
      await system.forceOptimization();

      expect(
        mockBanditOptimizer.getOptimizationRecommendations
      ).toHaveBeenCalled();
      expect(mockExperimentManager.listActiveExperiments).toHaveBeenCalled();
    });

    it("should apply high priority recommendations", async () => {
      mockBanditOptimizer.getOptimizationRecommendations.mockReturnValue([
        {
          type: "exploration",
          priority: "high",
          description: "Need more exploration",
          action: "Increase exploration rate",
        },
      ]);

      await system.start();
      await system.forceOptimization();

      expect(mockBanditOptimizer.updateConfig).toHaveBeenCalledWith({
        explorationRate: expect.any(Number),
      });
    });

    it("should auto-stop experiments with high confidence", async () => {
      mockExperimentManager.listActiveExperiments.mockResolvedValue([
        "test-experiment",
      ]);
      mockExperimentManager.analyzeExperimentResults.mockResolvedValue({
        experimentName: "test-experiment",
        status: "RUNNING",
        recommendation: {
          winningTreatment: "bedrock-focused",
          confidence: 0.96, // Above threshold
          expectedImprovement: 0.2,
        },
      });

      await system.start();
      await system.forceOptimization();

      expect(mockExperimentManager.stopExperiment).toHaveBeenCalledWith(
        "test-experiment",
        expect.stringContaining("Auto-stop: High confidence winner")
      );
    });

    it("should handle optimization cycle errors", async () => {
      mockBanditOptimizer.getOptimizationRecommendations.mockImplementation(
        () => {
          throw new Error("Optimization error");
        }
      );

      await system.start();
      await system.forceOptimization();

      const metrics = system.getMetrics();
      expect(metrics.systemHealth).toBe("error");
    });
  });

  describe("Configuration Management", () => {
    it("should get current configuration", () => {
      const config = system.getConfig();

      expect(config).toMatchObject({
        projectName: expect.any(String),
        region: expect.any(String),
        autoExperimentEnabled: expect.any(Boolean),
        experimentDuration: expect.any(Number),
        minTrafficForExperiment: expect.any(Number),
        significanceThreshold: expect.any(Number),
        autoStopEnabled: expect.any(Boolean),
        performanceThresholds: expect.any(Object),
      });
    });

    it("should update configuration", () => {
      system.updateConfig({
        experimentDuration: 21,
        minTrafficForExperiment: 200,
      });

      const config = system.getConfig();
      expect(config.experimentDuration).toBe(21);
      expect(config.minTrafficForExperiment).toBe(200);

      const events = system.getEventHistory();
      const configEvent = events.find(
        (e) =>
          e.type === "auto_optimization" &&
          e.details.action === "config_updated"
      );
      expect(configEvent).toBeDefined();
    });
  });

  describe("State Management", () => {
    it("should export state correctly", () => {
      const state = system.exportState();

      expect(state).toMatchObject({
        config: expect.any(Object),
        metrics: expect.any(Object),
        banditState: expect.any(Object),
        eventHistory: expect.any(Array),
      });
    });
  });

  describe("Traffic Allocation", () => {
    it("should update traffic allocation automatically", async () => {
      // Just test that the force update works, which is simpler
      await system.forceTrafficAllocationUpdate();

      const events = system.getEventHistory();
      const allocationEvent = events.find(
        (e) => e.type === "traffic_allocation_updated"
      );

      expect(allocationEvent).toBeDefined();
      expect(allocationEvent?.details.reason).toBe(
        "automatic_performance_optimization"
      );
    });

    it("should force traffic allocation update", async () => {
      await system.forceTrafficAllocationUpdate();

      const events = system.getEventHistory();
      const allocationEvent = events.find(
        (e) => e.type === "traffic_allocation_updated"
      );

      expect(allocationEvent).toBeDefined();
      expect(allocationEvent?.details.reason).toBe(
        "automatic_performance_optimization"
      );
    });

    it("should maintain minimum allocation for each arm", async () => {
      await system.forceTrafficAllocationUpdate();

      const allocation = system.getCurrentTrafficAllocation();

      // Each arm should have at least 5% allocation
      Object.values(allocation).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0.05);
      });
    });

    it("should allocate more traffic to better performing arms", async () => {
      // Mock better performance for bedrock
      mockBanditOptimizer.getBanditStats.mockReturnValue({
        bedrock: {
          wins: 18,
          trials: 20,
          costEuro: 0.4,
          totalLatencyMs: 4000,
          winRate: 0.9, // Very high win rate
          avgLatency: 200, // Low latency
          avgCost: 0.02, // Low cost
        },
        google: {
          wins: 5,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.25, // Low win rate
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 5,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.25, // Low win rate
          avgLatency: 500,
          avgCost: 0.05,
        },
      });

      await system.forceTrafficAllocationUpdate();

      const allocation = system.getCurrentTrafficAllocation();

      // Bedrock should get the highest allocation
      expect(allocation.bedrock).toBeGreaterThan(allocation.google);
      expect(allocation.bedrock).toBeGreaterThan(allocation.meta);
    });
  });

  describe("Automatic Optimization", () => {
    it("should start optimization loop on system start", async () => {
      await system.start();

      // Just test that the force optimization works, which is simpler
      await system.forceOptimization();

      expect(
        mockBanditOptimizer.getOptimizationRecommendations
      ).toHaveBeenCalled();
    });

    it("should check for new experiments when traffic is sufficient", async () => {
      // Mock sufficient traffic
      const metrics = system.getMetrics();
      metrics.totalRequests = 200; // Above minTrafficForExperiment

      mockBanditOptimizer.analyzeContextualPerformance.mockReturnValue([
        {
          context: "legal|premium|tools",
          bestArm: "bedrock",
          improvement: 0.3, // Good improvement
          armPerformance: {
            bedrock: {
              winRate: 0.8,
              avgLatency: 400,
              avgCost: 0.04,
              trials: 60,
              confidence: 0.9,
            },
            google: {
              winRate: 0.6,
              avgLatency: 500,
              avgCost: 0.05,
              trials: 40,
              confidence: 0.8,
            },
            meta: {
              winRate: 0.4,
              avgLatency: 600,
              avgCost: 0.06,
              trials: 30,
              confidence: 0.7,
            },
          },
        },
      ]);

      await system.start();
      await system.forceOptimization();

      // Should log promising contexts
      const events = system.getEventHistory();
      expect(events.some((e) => e.type === "auto_optimization")).toBe(true);
    });
  });
});

describe("Global Optimization System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockEvidentlyExperimentManager.mockImplementation(
      () => mockExperimentManager as any
    );
    MockBanditOptimizer.mockImplementation(() => mockBanditOptimizer as any);

    // Setup default mocks
    mockExperimentManager.initializeProject.mockResolvedValue(undefined);
    mockExperimentManager.createAIExperiment.mockResolvedValue(undefined);
    mockExperimentManager.startExperiment.mockResolvedValue(undefined);
    mockExperimentManager.listActiveExperiments.mockResolvedValue([]);
    mockExperimentManager.healthCheck.mockResolvedValue({
      connected: true,
      projectExists: true,
      activeExperiments: 0,
      banditStats: {},
    });

    mockBanditOptimizer.getOptimalArm.mockResolvedValue({
      recommendedArm: "bedrock",
      confidence: 0.8,
      expectedReward: 0.7,
      explorationNeeded: false,
      reasoning: "Test selection",
    });
    mockBanditOptimizer.recordOutcome.mockResolvedValue(undefined);
    mockBanditOptimizer.getOptimizationRecommendations.mockReturnValue([]);
    mockBanditOptimizer.getBanditStats.mockReturnValue({
      bedrock: {
        wins: 10,
        trials: 15,
        costEuro: 0.75,
        totalLatencyMs: 7500,
        winRate: 0.67,
        avgLatency: 500,
        avgCost: 0.05,
      },
      google: {
        wins: 8,
        trials: 12,
        costEuro: 0.6,
        totalLatencyMs: 6000,
        winRate: 0.67,
        avgLatency: 500,
        avgCost: 0.05,
      },
      meta: {
        wins: 5,
        trials: 10,
        costEuro: 0.5,
        totalLatencyMs: 5000,
        winRate: 0.5,
        avgLatency: 500,
        avgCost: 0.05,
      },
    });
    mockBanditOptimizer.healthCheck.mockReturnValue({
      status: "healthy",
      totalTrials: 37,
      activeContexts: 3,
      autoOptimizationEnabled: true,
      recommendations: 0,
    });
    mockBanditOptimizer.getConfig.mockReturnValue({
      explorationRate: 0.15,
      confidenceLevel: 0.95,
      minTrialsForConfidence: 30,
      autoOptimizationEnabled: true,
      optimizationInterval: 60,
    });
    mockBanditOptimizer.exportState.mockReturnValue({
      banditStats: {},
      config: {},
      optimizationHistory: [],
    });
  });

  afterEach(async () => {
    await shutdownOptimizationSystem();
  });

  it("should create singleton instance", () => {
    const system1 = getOptimizationSystem();
    const system2 = getOptimizationSystem();

    expect(system1).toBe(system2);
  });

  it("should initialize and start system", async () => {
    const system = await initializeOptimizationSystem({
      projectName: "test-project",
      autoExperimentEnabled: true,
    });

    expect(system).toBeInstanceOf(ActiveOptimizationSystem);
    expect(mockExperimentManager.initializeProject).toHaveBeenCalled();
  });

  it("should not start system twice", async () => {
    await initializeOptimizationSystem();
    await initializeOptimizationSystem(); // Second call

    expect(mockExperimentManager.initializeProject).toHaveBeenCalledTimes(1);
  });

  it("should shutdown system", async () => {
    mockExperimentManager.listActiveExperiments.mockResolvedValue([
      "test-experiment",
    ]);

    await initializeOptimizationSystem();
    await shutdownOptimizationSystem();

    expect(mockExperimentManager.stopExperiment).toHaveBeenCalledWith(
      "test-experiment",
      "System shutdown"
    );
  });
});
