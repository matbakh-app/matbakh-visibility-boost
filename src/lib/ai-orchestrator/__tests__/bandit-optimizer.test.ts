/**
 * Tests for Bandit Optimizer
 */

import { ThompsonBandit } from "../bandit-controller";
import { BanditOptimizer, BanditUtils } from "../bandit-optimizer";
import { EvidentlyExperimentManager } from "../evidently-experiments";

// Mock the experiment manager
jest.mock("../evidently-experiments");

describe("BanditOptimizer", () => {
  let optimizer: BanditOptimizer;
  let mockBandit: ThompsonBandit;
  let mockExperimentManager: jest.Mocked<EvidentlyExperimentManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBandit = new ThompsonBandit();
    mockExperimentManager =
      new EvidentlyExperimentManager() as jest.Mocked<EvidentlyExperimentManager>;

    optimizer = new BanditOptimizer(mockBandit, mockExperimentManager, {
      autoOptimizationEnabled: false, // Disable for testing
      explorationRate: 0.1,
      confidenceLevel: 0.95,
      minTrialsForConfidence: 20,
      optimizationInterval: 60,
    });
  });

  describe("UCB Algorithm", () => {
    it("should select unplayed arm first", () => {
      // Mock bandit with no trials
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
        google: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
        meta: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
      });

      const result = optimizer.selectArmUCB();

      expect(result.explorationNeeded).toBe(true);
      expect(result.reasoning).toContain("No historical data available");
      expect(["bedrock", "google", "meta"]).toContain(result.recommendedArm);
    });

    it("should calculate UCB scores correctly", () => {
      // Mock bandit with some trial data
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 8,
          trials: 10,
          costEuro: 0.5,
          totalLatencyMs: 5000,
          winRate: 0.8,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 6,
          trials: 12,
          costEuro: 0.6,
          totalLatencyMs: 6000,
          winRate: 0.5,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
      });

      const result = optimizer.selectArmUCB();

      // Should select meta (unplayed arm with infinite UCB)
      expect(result.recommendedArm).toBe("meta");
      expect(result.explorationNeeded).toBe(true);
    });

    it("should prefer high-performing arms when exploration is low", () => {
      // Mock bandit with sufficient trials for all arms
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 18,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.9,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 12,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.6,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 8,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.4,
          avgLatency: 500,
          avgCost: 0.05,
        },
      });

      const result = optimizer.selectArmUCB();

      // Should prefer bedrock (highest win rate)
      expect(result.recommendedArm).toBe("bedrock");
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe("Thompson Sampling", () => {
    it("should use bandit choose method", () => {
      const chooseSpy = jest
        .spyOn(mockBandit, "choose")
        .mockReturnValue("google");
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 5,
          trials: 10,
          costEuro: 0.5,
          totalLatencyMs: 5000,
          winRate: 0.5,
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
          wins: 2,
          trials: 5,
          costEuro: 0.2,
          totalLatencyMs: 2500,
          winRate: 0.4,
          avgLatency: 500,
          avgCost: 0.04,
        },
      });

      const context = { domain: "legal", budgetTier: "premium" };
      const result = optimizer.selectArmThompson(context);

      expect(chooseSpy).toHaveBeenCalledWith(context);
      expect(result.recommendedArm).toBe("google");
      expect(result.reasoning).toContain("Thompson Sampling");
    });

    it("should indicate exploration needed for low trial counts", () => {
      jest.spyOn(mockBandit, "choose").mockReturnValue("bedrock");
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 3,
          trials: 5,
          costEuro: 0.25,
          totalLatencyMs: 2500,
          winRate: 0.6,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 2,
          trials: 4,
          costEuro: 0.2,
          totalLatencyMs: 2000,
          winRate: 0.5,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 1,
          trials: 3,
          costEuro: 0.15,
          totalLatencyMs: 1500,
          winRate: 0.33,
          avgLatency: 500,
          avgCost: 0.05,
        },
      });

      const result = optimizer.selectArmThompson();

      expect(result.explorationNeeded).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe("Hybrid Selection", () => {
    it("should use UCB for early exploration", () => {
      // Mock low total trials
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 2,
          trials: 3,
          costEuro: 0.15,
          totalLatencyMs: 1500,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 1,
          trials: 2,
          costEuro: 0.1,
          totalLatencyMs: 1000,
          winRate: 0.5,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
      });

      const result = optimizer.selectArmHybrid();

      // Should use UCB (exploration) and select unplayed arm
      expect(result.recommendedArm).toBe("meta");
      expect(result.explorationNeeded).toBe(true);
    });

    it("should use Thompson Sampling for exploitation", () => {
      const chooseSpy = jest
        .spyOn(mockBandit, "choose")
        .mockReturnValue("bedrock");

      // Mock high total trials (> minTrialsForConfidence * 3)
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 45,
          trials: 50,
          costEuro: 2.5,
          totalLatencyMs: 25000,
          winRate: 0.9,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 30,
          trials: 40,
          costEuro: 2.0,
          totalLatencyMs: 20000,
          winRate: 0.75,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 20,
          trials: 30,
          costEuro: 1.5,
          totalLatencyMs: 15000,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        },
      });

      const result = optimizer.selectArmHybrid();

      expect(chooseSpy).toHaveBeenCalled();
      expect(result.reasoning).toContain("Thompson Sampling");
    });
  });

  describe("Experiment Integration", () => {
    it("should use experiment assignment when available", async () => {
      mockExperimentManager.getOptimalProvider.mockResolvedValue({
        provider: "google",
        source: "experiment",
        confidence: 0.9,
        experimentName: "test-experiment",
      });

      const result = await optimizer.getOptimalArm({
        experimentName: "test-experiment",
        userId: "test-user",
      });

      expect(result).toEqual({
        recommendedArm: "google",
        confidence: 0.9,
        expectedReward: 0.8,
        explorationNeeded: false,
        reasoning: "Experiment assignment: test-experiment",
      });
    });

    it("should fall back to bandit when experiment fails", async () => {
      mockExperimentManager.getOptimalProvider.mockRejectedValue(
        new Error("Experiment error")
      );

      jest.spyOn(mockBandit, "choose").mockReturnValue("bedrock");
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 15,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.75,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 8,
          trials: 15,
          costEuro: 0.75,
          totalLatencyMs: 7500,
          winRate: 0.53,
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

      const result = await optimizer.getOptimalArm({
        userId: "test-user",
      });

      expect(result.recommendedArm).toBe("bedrock");
      expect(result.reasoning).toMatch(
        /Thompson Sampling|Exploitation.*confidence/
      );
    });
  });

  describe("Outcome Recording", () => {
    it("should record outcome in both bandit and experiment manager", async () => {
      const banditRecordSpy = jest.spyOn(mockBandit, "record");
      mockExperimentManager.recordExperimentOutcome.mockResolvedValue();

      const context = {
        experimentName: "test-experiment",
        userId: "test-user",
        domain: "legal",
      };

      await optimizer.recordOutcome(context, "bedrock", true, 500, 0.05, 0.9);

      expect(banditRecordSpy).toHaveBeenCalledWith(
        "bedrock",
        true,
        0.05,
        500,
        context
      );
      expect(
        mockExperimentManager.recordExperimentOutcome
      ).toHaveBeenCalledWith(context, "bedrock", {
        success: true,
        latencyMs: 500,
        costEuro: 0.05,
        qualityScore: 0.9,
      });
    });

    it("should handle experiment manager errors gracefully", async () => {
      const banditRecordSpy = jest.spyOn(mockBandit, "record");
      mockExperimentManager.recordExperimentOutcome.mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        optimizer.recordOutcome(
          { userId: "test-user" },
          "google",
          false,
          1000,
          0.1
        )
      ).resolves.not.toThrow();

      expect(banditRecordSpy).toHaveBeenCalled();
    });
  });

  describe("Contextual Performance Analysis", () => {
    it("should analyze performance across contexts", () => {
      // Mock different contexts with different performance
      jest
        .spyOn(mockBandit, "getStats")
        .mockReturnValueOnce({
          // Legal context - bedrock performs best
          bedrock: {
            wins: 18,
            trials: 20,
            costEuro: 1.0,
            totalLatencyMs: 10000,
            winRate: 0.9,
            avgLatency: 500,
            avgCost: 0.05,
          },
          google: {
            wins: 10,
            trials: 15,
            costEuro: 0.75,
            totalLatencyMs: 7500,
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
        })
        .mockReturnValueOnce({
          // Culinary context - google performs best
          bedrock: {
            wins: 8,
            trials: 15,
            costEuro: 0.75,
            totalLatencyMs: 7500,
            winRate: 0.53,
            avgLatency: 500,
            avgCost: 0.05,
          },
          google: {
            wins: 16,
            trials: 20,
            costEuro: 1.0,
            totalLatencyMs: 10000,
            winRate: 0.8,
            avgLatency: 500,
            avgCost: 0.05,
          },
          meta: {
            wins: 6,
            trials: 10,
            costEuro: 0.5,
            totalLatencyMs: 5000,
            winRate: 0.6,
            avgLatency: 500,
            avgCost: 0.05,
          },
        });

      const analysis = optimizer.analyzeContextualPerformance();

      expect(analysis.length).toBeGreaterThanOrEqual(2); // At least two contexts
      expect(analysis[0]).toMatchObject({
        context: expect.any(String),
        bestArm: expect.stringMatching(/bedrock|google|meta/),
        improvement: expect.any(Number),
        armPerformance: expect.objectContaining({
          bedrock: expect.objectContaining({
            winRate: expect.any(Number),
            confidence: expect.any(Number),
          }),
        }),
      });
    });
  });

  describe("Optimization Recommendations", () => {
    it("should recommend exploration for under-explored arms", () => {
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 15,
          trials: 25,
          costEuro: 1.25,
          totalLatencyMs: 12500,
          winRate: 0.6,
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
          wins: 2,
          trials: 3,
          costEuro: 0.15,
          totalLatencyMs: 1500,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        }, // Under-explored
      });

      const recommendations = optimizer.getOptimizationRecommendations();

      const explorationRec = recommendations.find(
        (r) => r.type === "exploration"
      );
      expect(explorationRec).toBeDefined();
      expect(explorationRec?.priority).toBe("high");
      expect(explorationRec?.description).toContain("meta");
    });

    it("should recommend exploitation for high-confidence winners", () => {
      // Mock contextual performance with high confidence
      jest.spyOn(optimizer, "analyzeContextualPerformance").mockReturnValue([
        {
          context: "legal|premium|tools",
          bestArm: "bedrock",
          improvement: 0.5,
          armPerformance: {
            bedrock: {
              winRate: 0.9,
              avgLatency: 400,
              avgCost: 0.04,
              trials: 60,
              confidence: 0.95,
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

      const recommendations = optimizer.getOptimizationRecommendations();

      const exploitationRec = recommendations.find(
        (r) => r.type === "exploitation"
      );
      expect(exploitationRec).toBeDefined();
      expect(exploitationRec?.priority).toBe("low");
      expect(exploitationRec?.description).toContain("High confidence winners");
    });

    it("should suggest experiments for promising contexts", () => {
      jest.spyOn(optimizer, "analyzeContextualPerformance").mockReturnValue([
        {
          context: "culinary|standard|no-tools",
          bestArm: "google",
          improvement: 0.3, // Good improvement
          armPerformance: {
            bedrock: {
              winRate: 0.5,
              avgLatency: 500,
              avgCost: 0.05,
              trials: 25,
              confidence: 0.7,
            },
            google: {
              winRate: 0.8,
              avgLatency: 450,
              avgCost: 0.045,
              trials: 35,
              confidence: 0.85,
            },
            meta: {
              winRate: 0.4,
              avgLatency: 550,
              avgCost: 0.055,
              trials: 20,
              confidence: 0.6,
            },
          },
        },
      ]);

      const recommendations = optimizer.getOptimizationRecommendations();

      const experimentRec = recommendations.find(
        (r) => r.type === "experiment"
      );
      expect(experimentRec).toBeDefined();
      expect(experimentRec?.priority).toBe("medium");
      expect(experimentRec?.description).toContain("Promising contexts");
    });
  });

  describe("Configuration Management", () => {
    it("should get current configuration", () => {
      const config = optimizer.getConfig();

      expect(config).toMatchObject({
        explorationRate: 0.1,
        confidenceLevel: 0.95,
        minTrialsForConfidence: 20,
        autoOptimizationEnabled: false,
        optimizationInterval: 60,
      });
    });

    it("should update configuration", () => {
      optimizer.updateConfig({
        explorationRate: 0.2,
        autoOptimizationEnabled: true,
      });

      const config = optimizer.getConfig();
      expect(config.explorationRate).toBe(0.2);
      expect(config.autoOptimizationEnabled).toBe(true);
      expect(config.confidenceLevel).toBe(0.95); // Unchanged
    });
  });

  describe("Health Check", () => {
    it("should return healthy status with sufficient data", () => {
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 15,
          trials: 20,
          costEuro: 1.0,
          totalLatencyMs: 10000,
          winRate: 0.75,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 10,
          trials: 15,
          costEuro: 0.75,
          totalLatencyMs: 7500,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 8,
          trials: 12,
          costEuro: 0.6,
          totalLatencyMs: 6000,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        },
      });

      const health = optimizer.healthCheck();

      expect(health).toMatchObject({
        status: expect.stringMatching(/healthy|warning/),
        totalTrials: 47,
        activeContexts: expect.any(Number),
        autoOptimizationEnabled: false,
        recommendations: expect.any(Number),
      });
    });

    it("should return warning status with insufficient data", () => {
      jest.spyOn(mockBandit, "getStats").mockReturnValue({
        bedrock: {
          wins: 2,
          trials: 3,
          costEuro: 0.15,
          totalLatencyMs: 1500,
          winRate: 0.67,
          avgLatency: 500,
          avgCost: 0.05,
        },
        google: {
          wins: 1,
          trials: 2,
          costEuro: 0.1,
          totalLatencyMs: 1000,
          winRate: 0.5,
          avgLatency: 500,
          avgCost: 0.05,
        },
        meta: {
          wins: 0,
          trials: 0,
          costEuro: 0,
          totalLatencyMs: 0,
          winRate: 0,
          avgLatency: 0,
          avgCost: 0,
        },
      });

      const health = optimizer.healthCheck();

      expect(health.status).toBe("warning");
      expect(health.totalTrials).toBeLessThan(10);
    });
  });

  describe("State Management", () => {
    it("should export state correctly", () => {
      const state = optimizer.exportState();

      expect(state).toMatchObject({
        banditStats: expect.any(Object),
        config: expect.any(Object),
        optimizationHistory: expect.any(Array),
      });
    });

    it("should reset state", () => {
      // Add some history first
      optimizer.recordOutcome({ userId: "test" }, "bedrock", true, 500, 0.05);

      optimizer.reset();

      const history = optimizer.getOptimizationHistory();
      expect(history).toHaveLength(0);
    });
  });
});

describe("BanditUtils", () => {
  describe("Statistical Significance", () => {
    it("should calculate significance correctly", () => {
      const arm1 = { wins: 80, trials: 100 }; // 80% win rate
      const arm2 = { wins: 60, trials: 100 }; // 60% win rate

      const result = BanditUtils.calculateSignificance(arm1, arm2);

      expect(result.significant).toBe(true);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(
        result.confidenceInterval[1]
      );
    });

    it("should handle zero trials", () => {
      const arm1 = { wins: 0, trials: 0 };
      const arm2 = { wins: 10, trials: 20 };

      const result = BanditUtils.calculateSignificance(arm1, arm2);

      expect(result.significant).toBe(false);
      expect(result.pValue).toBe(1);
    });

    it("should not find significance with similar performance", () => {
      const arm1 = { wins: 50, trials: 100 }; // 50% win rate
      const arm2 = { wins: 52, trials: 100 }; // 52% win rate

      const result = BanditUtils.calculateSignificance(arm1, arm2);

      expect(result.significant).toBe(false);
      expect(result.pValue).toBeGreaterThan(0.05);
    });
  });

  describe("Normal CDF", () => {
    it("should calculate normal CDF correctly", () => {
      expect(BanditUtils.normalCDF(0)).toBeCloseTo(0.5, 2);
      expect(BanditUtils.normalCDF(1.96)).toBeCloseTo(0.975, 2);
      expect(BanditUtils.normalCDF(-1.96)).toBeCloseTo(0.025, 2);
    });
  });

  describe("Regret Calculation", () => {
    it("should calculate regret correctly", () => {
      const trueRewards = {
        bedrock: 0.8,
        google: 0.6,
        meta: 0.4,
      };

      const selections = [
        { arm: "bedrock" as const, reward: 0.8 }, // Optimal choice
        { arm: "google" as const, reward: 0.6 }, // Suboptimal
        { arm: "meta" as const, reward: 0.4 }, // Worst choice
      ];

      const regret = BanditUtils.calculateRegret(trueRewards, selections);

      // Expected regret: (0 + 0.2 + 0.4) / 3 = 0.2
      expect(regret).toBeCloseTo(0.2, 2);
    });

    it("should return zero regret for optimal selections", () => {
      const trueRewards = {
        bedrock: 0.8,
        google: 0.6,
        meta: 0.4,
      };

      const selections = [
        { arm: "bedrock" as const, reward: 0.8 },
        { arm: "bedrock" as const, reward: 0.8 },
        { arm: "bedrock" as const, reward: 0.8 },
      ];

      const regret = BanditUtils.calculateRegret(trueRewards, selections);

      expect(regret).toBe(0);
    });
  });
});
