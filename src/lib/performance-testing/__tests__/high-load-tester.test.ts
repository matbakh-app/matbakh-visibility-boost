/**
 * High Load Tester Tests
 * Tests for 10x load testing capabilities
 */

import { HighLoadTestConfig, HighLoadTester } from "../high-load-tester";
import { LoadTestResult } from "../load-tester";

// Mock the base LoadTester
jest.mock("../load-tester");

describe("HighLoadTester", () => {
  let highLoadTester: HighLoadTester;
  let mockLoadTestResult: LoadTestResult;

  beforeEach(() => {
    highLoadTester = new HighLoadTester();

    // Mock successful load test result
    mockLoadTestResult = {
      timestamp: "2025-01-14T10:00:00Z",
      duration: 600000, // 10 minutes
      totalRequests: 60000, // 100 RPS * 600 seconds
      requestsPerSecond: 100,
      averageResponseTime: 250,
      p95ResponseTime: 400,
      p99ResponseTime: 800,
      errorRate: 1.5,
      throughput: 102400,
      scenarios: [],
      summary: {
        passed: true,
        totalErrors: 900,
        criticalErrors: 0,
        recommendations: ["Good performance under high load"],
      },
    };

    // Mock the runLoadTest method
    jest
      .spyOn(highLoadTester, "runLoadTest")
      .mockResolvedValue(mockLoadTestResult);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("runHighLoadTest", () => {
    it("should successfully run 10x load test with default configuration", async () => {
      const result = await highLoadTester.runHighLoadTest();

      expect(result).toBeDefined();
      expect(result.scalingFactor).toBe(10);
      expect(result.baselineComparison).toBeDefined();
      expect(result.performanceGrades).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.performanceGrades.overall).toMatch(/^[A-F]$/);
    });

    it("should handle custom configuration", async () => {
      const customConfig: Partial<HighLoadTestConfig> = {
        target: "https://api.matbakh.app",
        scalingFactor: 15,
        baselineRPS: 20,
        targetRPS: 300,
        maxConcurrency: 300,
        performanceThresholds: {
          maxResponseTime: 500,
          maxErrorRate: 2,
          minThroughput: 270,
          p95Threshold: 400,
          p99Threshold: 800,
        },
      };

      const result = await highLoadTester.runHighLoadTest(customConfig);

      expect(result.scalingFactor).toBe(15);
      expect(highLoadTester.runLoadTest).toHaveBeenCalledWith(
        expect.objectContaining({
          target: "https://api.matbakh.app",
          targetRPS: 300,
          maxConcurrency: 300,
        })
      );
    });

    it("should calculate performance grades correctly", async () => {
      const result = await highLoadTester.runHighLoadTest();

      expect(result.performanceGrades).toEqual({
        scalability: expect.stringMatching(/^[A-F]$/),
        stability: expect.stringMatching(/^[A-F]$/),
        efficiency: expect.stringMatching(/^[A-F]$/),
        overall: expect.stringMatching(/^[A-F]$/),
      });

      // With good performance metrics, should get good grades
      expect(["A", "B", "C"]).toContain(result.performanceGrades.overall);
    });

    it("should generate appropriate recommendations", async () => {
      const result = await highLoadTester.runHighLoadTest();

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);

      result.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("category");
        expect(rec).toHaveProperty("priority");
        expect(rec).toHaveProperty("title");
        expect(rec).toHaveProperty("description");
        expect(rec).toHaveProperty("estimatedImpact");
        expect(rec).toHaveProperty("implementationEffort");

        expect([
          "infrastructure",
          "application",
          "database",
          "caching",
          "monitoring",
        ]).toContain(rec.category);
        expect(["critical", "high", "medium", "low"]).toContain(rec.priority);
        expect(["low", "medium", "high"]).toContain(rec.implementationEffort);
      });
    });
  });

  describe("runScalabilityTest", () => {
    it("should run progressive scaling test", async () => {
      const result = await highLoadTester.runScalabilityTest();

      expect(result).toBeDefined();
      expect(highLoadTester.runLoadTest).toHaveBeenCalledWith(
        expect.objectContaining({
          phases: expect.arrayContaining([
            expect.objectContaining({ name: "baseline" }),
            expect.objectContaining({ name: "2x-load" }),
            expect.objectContaining({ name: "5x-load" }),
            expect.objectContaining({ name: "10x-load" }),
            expect.objectContaining({ name: "recovery" }),
          ]),
        })
      );
    });

    it("should test progressive load increases", async () => {
      const config: Partial<HighLoadTestConfig> = {
        baselineRPS: 20,
        targetRPS: 200,
      };

      await highLoadTester.runScalabilityTest(config);

      const callArgs = (highLoadTester.runLoadTest as jest.Mock).mock
        .calls[0][0];
      const phases = callArgs.phases;

      expect(phases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ arrivalRate: 20, name: "baseline" }),
          expect.objectContaining({ arrivalRate: 40, name: "2x-load" }),
          expect.objectContaining({ arrivalRate: 100, name: "5x-load" }),
          expect.objectContaining({ arrivalRate: 200, name: "10x-load" }),
        ])
      );
    });
  });

  describe("runEnduranceTest", () => {
    it("should run sustained high load test", async () => {
      const result = await highLoadTester.runEnduranceTest();

      expect(result).toBeDefined();
      expect(highLoadTester.runLoadTest).toHaveBeenCalledWith(
        expect.objectContaining({
          phases: expect.arrayContaining([
            expect.objectContaining({ name: "warmup" }),
            expect.objectContaining({ name: "sustained-10x", duration: 1800 }), // 30 minutes
            expect.objectContaining({ name: "cooldown" }),
          ]),
        })
      );
    });

    it("should maintain high load for extended duration", async () => {
      await highLoadTester.runEnduranceTest({ targetRPS: 150 });

      const callArgs = (highLoadTester.runLoadTest as jest.Mock).mock
        .calls[0][0];
      const sustainedPhase = callArgs.phases.find(
        (p: any) => p.name === "sustained-10x"
      );

      expect(sustainedPhase).toBeDefined();
      expect(sustainedPhase.duration).toBe(1800); // 30 minutes
      expect(sustainedPhase.arrivalRate).toBe(150);
    });
  });

  describe("performance grading", () => {
    it("should assign grade A for excellent performance", async () => {
      // Mock excellent performance
      const excellentResult = {
        ...mockLoadTestResult,
        requestsPerSecond: 98, // 98% of target (100 RPS)
        averageResponseTime: 200, // Fast response
        errorRate: 0.5, // Low error rate
      };

      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockResolvedValue(excellentResult);

      const result = await highLoadTester.runHighLoadTest();

      expect(result.performanceGrades.scalability).toBe("A");
      expect(result.performanceGrades.stability).toBe("A");
      expect(result.performanceGrades.efficiency).toBe("A");
      expect(result.performanceGrades.overall).toBe("A");
    });

    it("should assign grade F for poor performance", async () => {
      // Mock poor performance
      const poorResult = {
        ...mockLoadTestResult,
        requestsPerSecond: 30, // Only 30% of target
        averageResponseTime: 2000, // Very slow
        errorRate: 15, // High error rate
      };

      jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(poorResult);

      const result = await highLoadTester.runHighLoadTest();

      expect(result.performanceGrades.scalability).toBe("F");
      expect(result.performanceGrades.stability).toBe("F");
      expect(result.performanceGrades.efficiency).toBe("F");
      expect(result.performanceGrades.overall).toBe("F");
    });

    it("should generate critical recommendations for poor performance", async () => {
      // Mock poor performance
      const poorResult = {
        ...mockLoadTestResult,
        requestsPerSecond: 20,
        averageResponseTime: 3000,
        errorRate: 20,
      };

      jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(poorResult);

      const result = await highLoadTester.runHighLoadTest();

      const criticalRecs = result.recommendations.filter(
        (r) => r.priority === "critical"
      );
      expect(criticalRecs.length).toBeGreaterThan(0);

      const infrastructureRec = result.recommendations.find(
        (r) => r.category === "infrastructure"
      );
      expect(infrastructureRec).toBeDefined();
      expect(infrastructureRec?.title).toContain("Scale Infrastructure");
    });
  });

  describe("baseline comparison", () => {
    it("should calculate accurate baseline comparison", async () => {
      const result = await highLoadTester.runHighLoadTest({
        baselineRPS: 10,
        targetRPS: 100,
      });

      expect(result.baselineComparison).toBeDefined();
      expect(result.baselineComparison.rpsIncrease).toBe(900); // 100 vs 10 = 900% increase
      expect(result.baselineComparison.responseTimeDegradation).toBe(1.25); // 250ms vs 200ms baseline
      expect(result.baselineComparison.errorRateIncrease).toBe(1.5); // 1.5% error rate
    });

    it("should handle different baseline configurations", async () => {
      const result = await highLoadTester.runHighLoadTest({
        baselineRPS: 25,
        scalingFactor: 8, // 8x instead of 10x
      });

      expect(result.scalingFactor).toBe(8);
      expect(result.baselineComparison.rpsIncrease).toBe(300); // 100 vs 25 = 300% increase
    });
  });

  describe("static factory methods", () => {
    it("should create production readiness test configuration", () => {
      const config = HighLoadTester.getProductionReadinessTest(
        "https://api.matbakh.app"
      );

      expect(config.target).toBe("https://api.matbakh.app");
      expect(config.scalingFactor).toBe(10);
      expect(config.targetRPS).toBe(100);
      expect(config.maxConcurrency).toBe(100);
      expect(config.performanceThresholds.maxResponseTime).toBe(800);
      expect(config.performanceThresholds.maxErrorRate).toBe(2);
      expect(config.phases).toHaveLength(4);
    });

    it("should create stress breaking point test configuration", () => {
      const config = HighLoadTester.getStressBreakingPointTest(
        "https://api.matbakh.app"
      );

      expect(config.scalingFactor).toBe(20); // Beyond 10x
      expect(config.targetRPS).toBe(200);
      expect(config.maxConcurrency).toBe(200);
      expect(config.performanceThresholds.maxResponseTime).toBe(2000);
      expect(config.phases).toHaveLength(6);

      const breakingPointPhase = config.phases.find(
        (p) => p.name === "breaking-point"
      );
      expect(breakingPointPhase).toBeDefined();
      expect(breakingPointPhase?.arrivalRate).toBe(200);
    });
  });

  describe("error handling", () => {
    it("should handle load test failures gracefully", async () => {
      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockRejectedValue(new Error("Load test failed"));

      await expect(highLoadTester.runHighLoadTest()).rejects.toThrow(
        "Load test failed"
      );
    });

    it("should provide meaningful error messages", async () => {
      const errorMessage = "Connection timeout";
      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockRejectedValue(new Error(errorMessage));

      try {
        await highLoadTester.runHighLoadTest();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });
  });

  describe("configuration validation", () => {
    it("should use default values for missing configuration", async () => {
      const result = await highLoadTester.runHighLoadTest({});

      expect(result.scalingFactor).toBe(10); // Default scaling factor
      expect(highLoadTester.runLoadTest).toHaveBeenCalledWith(
        expect.objectContaining({
          baselineRPS: 10,
          targetRPS: 100,
          maxConcurrency: 100,
        })
      );
    });

    it("should merge custom thresholds with defaults", async () => {
      const customThresholds = {
        maxResponseTime: 600,
        maxErrorRate: 3,
      };

      await highLoadTester.runHighLoadTest({
        performanceThresholds: customThresholds,
      });

      const callArgs = (highLoadTester.runLoadTest as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.performanceThresholds).toEqual(
        expect.objectContaining(customThresholds)
      );
      expect(callArgs.performanceThresholds.minThroughput).toBeDefined(); // Default should be preserved
    });
  });

  describe("report generation", () => {
    it("should generate comprehensive high load report", async () => {
      const result = await highLoadTester.runHighLoadTest();

      // Verify report structure
      expect(result.performanceGrades).toBeDefined();
      expect(result.baselineComparison).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.scalingFactor).toBeDefined();

      // Verify all required fields are present
      expect(result.performanceGrades).toHaveProperty("scalability");
      expect(result.performanceGrades).toHaveProperty("stability");
      expect(result.performanceGrades).toHaveProperty("efficiency");
      expect(result.performanceGrades).toHaveProperty("overall");
    });
  });
});

describe("HighLoadTester Integration", () => {
  let highLoadTester: HighLoadTester;

  beforeEach(() => {
    highLoadTester = new HighLoadTester();
  });

  it("should create valid high load test phases", () => {
    const phases = (highLoadTester as any).generateHighLoadPhases(10, 100);

    expect(phases).toHaveLength(7);
    expect(phases[0]).toEqual({
      duration: 60,
      arrivalRate: 10,
      name: "baseline-warmup",
    });
    expect(phases[4]).toEqual({
      duration: 300,
      arrivalRate: 100,
      name: "full-10x-load",
    });
    expect(phases[6]).toEqual({
      duration: 60,
      arrivalRate: 10,
      name: "recovery",
    });
  });

  it("should create appropriate high load scenarios", () => {
    const scenarios = (highLoadTester as any).getHighLoadScenarios();

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0].name).toBe("High Load Visibility Check");
    expect(scenarios[0].weight).toBe(60);
    expect(scenarios[1].name).toBe("High Load Dashboard Access");
    expect(scenarios[2].name).toBe("High Load API Stress");

    // Verify total weight is 100%
    const totalWeight = scenarios.reduce(
      (sum: number, s: any) => sum + s.weight,
      0
    );
    expect(totalWeight).toBe(100);
  });

  it("should generate appropriate thresholds for target RPS", () => {
    const thresholds = (highLoadTester as any).generateHighLoadThresholds(150);

    expect(thresholds.http_req_duration).toContain("p(95)<800");
    expect(thresholds.http_req_duration).toContain("p(99)<1500");
    expect(thresholds.http_req_failed).toContain("rate<0.05");
    expect(thresholds.http_reqs).toContain("rate>135"); // 90% of 150
  });
});
