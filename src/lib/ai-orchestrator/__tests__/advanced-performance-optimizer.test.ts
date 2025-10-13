/**
 * Tests für Advanced Performance Optimizer
 */

import {
  AdvancedPerformanceOptimizer,
  PerformanceMetrics,
} from "../advanced-performance-optimizer";

describe("AdvancedPerformanceOptimizer", () => {
  let optimizer: AdvancedPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new AdvancedPerformanceOptimizer();
  });

  describe("Performance Analysis", () => {
    it("should analyze performance metrics", async () => {
      const metrics = await optimizer.analyzePerformance();

      expect(metrics).toHaveProperty("cpuUsage");
      expect(metrics).toHaveProperty("memoryUsage");
      expect(metrics).toHaveProperty("responseTime");
      expect(metrics).toHaveProperty("throughput");
      expect(metrics).toHaveProperty("errorRate");
      expect(metrics).toHaveProperty("successRate");
      expect(metrics).toHaveProperty("timestamp");

      expect(typeof metrics.cpuUsage).toBe("number");
      expect(typeof metrics.memoryUsage).toBe("number");
      expect(typeof metrics.responseTime).toBe("number");
      expect(typeof metrics.throughput).toBe("number");
      expect(typeof metrics.errorRate).toBe("number");
      expect(typeof metrics.successRate).toBe("number");
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it("should return valid metric ranges", async () => {
      const metrics = await optimizer.analyzePerformance();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
      expect(metrics.responseTime).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe("Performance Optimization", () => {
    it("should perform optimization successfully", async () => {
      const result = await optimizer.optimizePerformance();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("applied");
      expect(result).toHaveProperty("expectedImprovement");
      expect(typeof result.success).toBe("boolean");
      expect(Array.isArray(result.applied)).toBe(true);
      expect(typeof result.expectedImprovement).toBe("number");
    });

    it("should create rollback plan when optimizations are applied", async () => {
      // Mock metrics that trigger optimization
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 95,
        memoryUsage: 90,
        responseTime: 500,
        throughput: 500,
        errorRate: 0.1,
        successRate: 0.9,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.applied.length).toBeGreaterThan(0);
      expect(result.rollbackPlan).toBeDefined();
      expect(result.rollbackPlan?.strategyName).toBeDefined();
      expect(result.rollbackPlan?.rollbackActions).toBeDefined();
      expect(result.rollbackPlan?.checkpoints).toBeDefined();
    });

    it("should handle optimization errors gracefully", async () => {
      // Mock error in analyzePerformance
      jest
        .spyOn(optimizer, "analyzePerformance")
        .mockRejectedValue(new Error("Analysis failed"));

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(false);
      expect(result.applied).toEqual([]);
      expect(result.expectedImprovement).toBe(0);
      expect(result.error).toBe("Analysis failed");
    });
  });

  describe("Performance Target Evaluation", () => {
    it("should correctly evaluate performance targets", () => {
      const goodMetrics: PerformanceMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        responseTime: 150,
        throughput: 1200,
        errorRate: 0.005,
        successRate: 0.995,
        timestamp: new Date(),
      };

      const badMetrics: PerformanceMetrics = {
        cpuUsage: 90,
        memoryUsage: 95,
        responseTime: 500,
        throughput: 500,
        errorRate: 0.05,
        successRate: 0.95,
        timestamp: new Date(),
      };

      expect(optimizer.isPerformanceTargetMet(goodMetrics)).toBe(true);
      expect(optimizer.isPerformanceTargetMet(badMetrics)).toBe(false);
    });

    it("should update performance targets", () => {
      const newTargets = {
        responseTime: 100,
        throughput: 2000,
      };

      optimizer.updatePerformanceTargets(newTargets);
      const updatedTargets = optimizer.getPerformanceTargets();

      expect(updatedTargets.responseTime).toBe(100);
      expect(updatedTargets.throughput).toBe(2000);
      // Other targets should remain unchanged
      expect(updatedTargets.errorRate).toBe(0.01);
    });
  });

  describe("Performance Recommendations", () => {
    it("should provide recommendations for poor performance", () => {
      const poorMetrics: PerformanceMetrics = {
        cpuUsage: 85,
        memoryUsage: 90,
        responseTime: 400,
        throughput: 500,
        errorRate: 0.02,
        successRate: 0.98,
        timestamp: new Date(),
      };

      const recommendations =
        optimizer.getPerformanceRecommendations(poorMetrics);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((rec) => rec.includes("Response Time"))).toBe(
        true
      );
      expect(recommendations.some((rec) => rec.includes("Durchsatz"))).toBe(
        true
      );
      expect(recommendations.some((rec) => rec.includes("Fehlerrate"))).toBe(
        true
      );
      expect(recommendations.some((rec) => rec.includes("CPU"))).toBe(true);
      expect(recommendations.some((rec) => rec.includes("Memory"))).toBe(true);
    });

    it("should provide positive feedback for good performance", () => {
      const goodMetrics: PerformanceMetrics = {
        cpuUsage: 50,
        memoryUsage: 60,
        responseTime: 150,
        throughput: 1200,
        errorRate: 0.005,
        successRate: 0.995,
        timestamp: new Date(),
      };

      const recommendations =
        optimizer.getPerformanceRecommendations(goodMetrics);

      expect(recommendations).toContain(
        "Alle Performance-Ziele werden erreicht. System läuft optimal."
      );
    });
  });

  describe("Health Status", () => {
    it("should return health status", () => {
      const healthStatus = optimizer.getHealthStatus();

      expect(healthStatus).toHaveProperty("isHealthy");
      expect(healthStatus).toHaveProperty("performanceScore");
      expect(healthStatus).toHaveProperty("activeOptimizations");
      expect(healthStatus).toHaveProperty("systemHealth");

      expect(typeof healthStatus.isHealthy).toBe("boolean");
      expect(typeof healthStatus.performanceScore).toBe("number");
      expect(typeof healthStatus.activeOptimizations).toBe("number");
      expect(typeof healthStatus.systemHealth).toBe("object");

      expect(healthStatus.performanceScore).toBeGreaterThanOrEqual(0);
      expect(healthStatus.performanceScore).toBeLessThanOrEqual(1);
      expect(healthStatus.activeOptimizations).toBeGreaterThanOrEqual(0);
    });

    it("should correlate health status with performance score", () => {
      const healthStatus = optimizer.getHealthStatus();

      if (healthStatus.performanceScore > 0.8) {
        expect(healthStatus.isHealthy).toBe(true);
      }
      // Note: We can't test the false case reliably due to randomness
    });
  });

  describe("Optimization Strategies", () => {
    it("should select appropriate strategy for high CPU usage", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 95,
        memoryUsage: 50,
        responseTime: 200,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.strategyName).toBe("Emergency Scale Up");
    });

    it("should select appropriate strategy for high response time", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 50,
        memoryUsage: 50,
        responseTime: 400,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.strategyName).toBe(
        "Response Time Optimization"
      );
    });

    it("should select appropriate strategy for low throughput", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 50,
        memoryUsage: 50,
        responseTime: 200,
        throughput: 700,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.strategyName).toBe("Throughput Enhancement");
    });

    it("should select efficiency optimization for low resource usage", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 25,
        memoryUsage: 35,
        responseTime: 150,
        throughput: 1200,
        errorRate: 0.005,
        successRate: 0.995,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.strategyName).toBe("Efficiency Optimization");
    });

    it("should not apply optimization when performance is good", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 50,
        memoryUsage: 60,
        responseTime: 150,
        throughput: 1200,
        errorRate: 0.005,
        successRate: 0.995,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.applied).toEqual([]);
      expect(result.expectedImprovement).toBe(0);
    });
  });

  describe("Rollback Actions", () => {
    it("should create correct rollback actions for scale_up", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 95,
        memoryUsage: 50,
        responseTime: 200,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.rollbackActions).toBeDefined();

      const rollbackAction = result.rollbackPlan?.rollbackActions[0];
      expect(rollbackAction?.type).toBe("scale_down");
      expect(rollbackAction?.parameters.factor).toBe(0.5); // 1/2
    });

    it("should create correct rollback actions for cache_optimize", async () => {
      jest.spyOn(optimizer, "analyzePerformance").mockResolvedValue({
        cpuUsage: 75,
        memoryUsage: 50,
        responseTime: 200,
        throughput: 1000,
        errorRate: 0.01,
        successRate: 0.99,
        timestamp: new Date(),
      });

      const result = await optimizer.optimizePerformance();

      expect(result.success).toBe(true);
      expect(result.rollbackPlan?.rollbackActions).toBeDefined();

      const cacheRollback = result.rollbackPlan?.rollbackActions.find(
        (action) => action.type === "cache_reset"
      );
      expect(cacheRollback).toBeDefined();
    });
  });
});
