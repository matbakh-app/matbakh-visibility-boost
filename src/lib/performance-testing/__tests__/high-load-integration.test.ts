/**
 * High Load Testing Integration Tests
 * End-to-end tests for 10x load testing capabilities
 */

import { existsSync } from "fs";
import { join } from "path";
import { HighLoadTestConfig, highLoadTester } from "../high-load-tester";

describe("High Load Testing Integration", () => {
  const testTarget = "http://localhost:8080";
  const reportsDir = join(process.cwd(), "performance-reports");

  beforeAll(() => {
    // Ensure reports directory exists
    if (!existsSync(reportsDir)) {
      require("fs").mkdirSync(reportsDir, { recursive: true });
    }
  });

  describe("10x Load Test Execution", () => {
    it("should execute complete 10x load test workflow", async () => {
      // Mock the actual load test execution for integration test
      const mockLoadTestResult = {
        timestamp: new Date().toISOString(),
        duration: 300000, // 5 minutes
        totalRequests: 30000, // 100 RPS * 300 seconds
        requestsPerSecond: 95, // 95% of target (100 RPS)
        averageResponseTime: 350,
        p95ResponseTime: 500,
        p99ResponseTime: 800,
        errorRate: 2.1,
        throughput: 97280,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 630,
          criticalErrors: 0,
          recommendations: ["Good performance under high load"],
        },
      };

      // Mock the runLoadTest method for integration test
      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockResolvedValue(mockLoadTestResult);

      const config: Partial<HighLoadTestConfig> = {
        target: testTarget,
        baselineRPS: 10,
        scalingFactor: 10,
        targetRPS: 100,
        maxConcurrency: 100,
      };

      const result = await highLoadTester.runHighLoadTest(config);

      // Verify complete result structure
      expect(result).toMatchObject({
        scalingFactor: 10,
        requestsPerSecond: 95,
        averageResponseTime: 350,
        errorRate: 2.1,
        performanceGrades: {
          scalability: expect.stringMatching(/^[A-F]$/),
          stability: expect.stringMatching(/^[A-F]$/),
          efficiency: expect.stringMatching(/^[A-F]$/),
          overall: expect.stringMatching(/^[A-F]$/),
        },
        baselineComparison: {
          rpsIncrease: expect.any(Number),
          responseTimeDegradation: expect.any(Number),
          errorRateIncrease: expect.any(Number),
          throughputIncrease: expect.any(Number),
        },
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            category: expect.stringMatching(
              /^(infrastructure|application|database|caching|monitoring)$/
            ),
            priority: expect.stringMatching(/^(critical|high|medium|low)$/),
            title: expect.any(String),
            description: expect.any(String),
            estimatedImpact: expect.any(String),
            implementationEffort: expect.stringMatching(/^(low|medium|high)$/),
          }),
        ]),
      });

      // Verify performance grading logic
      expect(result.performanceGrades.scalability).toBe("A"); // 95% of target = A grade
      expect(result.performanceGrades.stability).toBe("B"); // 2.1% error rate = B grade
      expect(result.performanceGrades.efficiency).toBe("B"); // 350ms response time = B grade
      expect(result.performanceGrades.overall).toBe("B"); // Overall B grade
    }, 30000); // 30 second timeout for integration test

    it("should handle different test types correctly", async () => {
      const mockResult = {
        timestamp: new Date().toISOString(),
        duration: 600000,
        totalRequests: 50000,
        requestsPerSecond: 83,
        averageResponseTime: 400,
        p95ResponseTime: 600,
        p99ResponseTime: 1000,
        errorRate: 1.5,
        throughput: 84992,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 750,
          criticalErrors: 0,
          recommendations: [],
        },
      };

      jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(mockResult);

      // Test scalability test
      const scalabilityResult = await highLoadTester.runScalabilityTest({
        target: testTarget,
      });
      expect(scalabilityResult.scalingFactor).toBe(10);
      expect(scalabilityResult.performanceGrades).toBeDefined();

      // Test endurance test
      const enduranceResult = await highLoadTester.runEnduranceTest({
        target: testTarget,
      });
      expect(enduranceResult.scalingFactor).toBe(10);
      expect(enduranceResult.performanceGrades).toBeDefined();

      // Verify different test configurations were used
      const loadTestCalls = (highLoadTester.runLoadTest as jest.Mock).mock
        .calls;
      expect(loadTestCalls.length).toBe(2);

      // Scalability test should have progressive phases
      const scalabilityConfig = loadTestCalls[0][0];
      expect(scalabilityConfig.phases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "baseline" }),
          expect.objectContaining({ name: "2x-load" }),
          expect.objectContaining({ name: "5x-load" }),
          expect.objectContaining({ name: "10x-load" }),
        ])
      );

      // Endurance test should have sustained phase
      const enduranceConfig = loadTestCalls[1][0];
      const sustainedPhase = enduranceConfig.phases.find(
        (p: any) => p.name === "sustained-10x"
      );
      expect(sustainedPhase).toBeDefined();
      expect(sustainedPhase.duration).toBe(1800); // 30 minutes
    });
  });

  describe("Performance Grading System", () => {
    it("should assign correct grades based on performance metrics", async () => {
      const testCases = [
        {
          name: "Excellent Performance",
          metrics: { rps: 98, responseTime: 200, errorRate: 0.5 },
          expectedGrades: {
            scalability: "A",
            stability: "A",
            efficiency: "A",
            overall: "A",
          },
        },
        {
          name: "Good Performance",
          metrics: { rps: 88, responseTime: 400, errorRate: 1.8 },
          expectedGrades: {
            scalability: "B",
            stability: "B",
            efficiency: "B",
            overall: "B",
          },
        },
        {
          name: "Acceptable Performance",
          metrics: { rps: 75, responseTime: 700, errorRate: 4.2 },
          expectedGrades: {
            scalability: "C",
            stability: "C",
            efficiency: "C",
            overall: "C",
          },
        },
        {
          name: "Poor Performance",
          metrics: { rps: 55, responseTime: 1100, errorRate: 8.5 },
          expectedGrades: {
            scalability: "D",
            stability: "D",
            efficiency: "D",
            overall: "D",
          },
        },
        {
          name: "Failed Performance",
          metrics: { rps: 25, responseTime: 2500, errorRate: 15.0 },
          expectedGrades: {
            scalability: "F",
            stability: "F",
            efficiency: "F",
            overall: "F",
          },
        },
      ];

      for (const testCase of testCases) {
        const mockResult = {
          timestamp: new Date().toISOString(),
          duration: 300000,
          totalRequests: testCase.metrics.rps * 300,
          requestsPerSecond: testCase.metrics.rps,
          averageResponseTime: testCase.metrics.responseTime,
          p95ResponseTime: testCase.metrics.responseTime * 1.5,
          p99ResponseTime: testCase.metrics.responseTime * 2,
          errorRate: testCase.metrics.errorRate,
          throughput: testCase.metrics.rps * 1024,
          scenarios: [],
          summary: {
            passed: true,
            totalErrors: 0,
            criticalErrors: 0,
            recommendations: [],
          },
        };

        jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(mockResult);

        const result = await highLoadTester.runHighLoadTest({ targetRPS: 100 });

        expect(result.performanceGrades.scalability).toBe(
          testCase.expectedGrades.scalability
        );
        expect(result.performanceGrades.stability).toBe(
          testCase.expectedGrades.stability
        );
        expect(result.performanceGrades.efficiency).toBe(
          testCase.expectedGrades.efficiency
        );
        expect(result.performanceGrades.overall).toBe(
          testCase.expectedGrades.overall
        );
      }
    });
  });

  describe("Recommendation Engine", () => {
    it("should generate appropriate recommendations for different performance issues", async () => {
      // Test case: Low throughput (scalability issue)
      const lowThroughputResult = {
        timestamp: new Date().toISOString(),
        duration: 300000,
        totalRequests: 15000, // Only 50 RPS instead of 100
        requestsPerSecond: 50,
        averageResponseTime: 300,
        p95ResponseTime: 450,
        p99ResponseTime: 700,
        errorRate: 1.0,
        throughput: 51200,
        scenarios: [],
        summary: {
          passed: false,
          totalErrors: 150,
          criticalErrors: 0,
          recommendations: [],
        },
      };

      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockResolvedValue(lowThroughputResult);

      const result = await highLoadTester.runHighLoadTest({ targetRPS: 100 });

      // Should recommend infrastructure scaling
      const infrastructureRec = result.recommendations.find(
        (r) => r.category === "infrastructure"
      );
      expect(infrastructureRec).toBeDefined();
      expect(infrastructureRec?.priority).toBe("critical");
      expect(infrastructureRec?.title).toContain("Scale Infrastructure");

      // Test case: High error rate (stability issue)
      const highErrorResult = {
        ...lowThroughputResult,
        requestsPerSecond: 95, // Good throughput
        errorRate: 12.0, // High error rate
        summary: {
          passed: false,
          totalErrors: 11400,
          criticalErrors: 100,
          recommendations: [],
        },
      };

      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockResolvedValue(highErrorResult);

      const errorResult = await highLoadTester.runHighLoadTest({
        targetRPS: 100,
      });

      // Should recommend fixing error rate
      const stabilityRec = errorResult.recommendations.find((r) =>
        r.title.includes("Fix High Error Rate")
      );
      expect(stabilityRec).toBeDefined();
      expect(stabilityRec?.priority).toBe("critical");
      expect(stabilityRec?.category).toBe("application");

      // Test case: High response times (efficiency issue)
      const highLatencyResult = {
        ...lowThroughputResult,
        requestsPerSecond: 95, // Good throughput
        averageResponseTime: 1500, // High response time
        errorRate: 1.0, // Low error rate
        summary: {
          passed: false,
          totalErrors: 150,
          criticalErrors: 0,
          recommendations: [],
        },
      };

      jest
        .spyOn(highLoadTester, "runLoadTest")
        .mockResolvedValue(highLatencyResult);

      const latencyResult = await highLoadTester.runHighLoadTest({
        targetRPS: 100,
      });

      // Should recommend response time optimization
      const efficiencyRec = latencyResult.recommendations.find((r) =>
        r.title.includes("Optimize Response Times")
      );
      expect(efficiencyRec).toBeDefined();
      expect(efficiencyRec?.priority).toBe("high");
      expect(efficiencyRec?.category).toBe("application");
    });

    it("should always include monitoring recommendation", async () => {
      const mockResult = {
        timestamp: new Date().toISOString(),
        duration: 300000,
        totalRequests: 30000,
        requestsPerSecond: 100,
        averageResponseTime: 200,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        errorRate: 0.5,
        throughput: 102400,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 150,
          criticalErrors: 0,
          recommendations: [],
        },
      };

      jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(mockResult);

      const result = await highLoadTester.runHighLoadTest();

      // Should always include monitoring recommendation
      const monitoringRec = result.recommendations.find(
        (r) => r.category === "monitoring"
      );
      expect(monitoringRec).toBeDefined();
      expect(monitoringRec?.title).toContain("Enhanced Performance Monitoring");
      expect(monitoringRec?.priority).toBe("medium");
    });
  });

  describe("Configuration Validation", () => {
    it("should handle various configuration combinations", async () => {
      const mockResult = {
        timestamp: new Date().toISOString(),
        duration: 300000,
        totalRequests: 30000,
        requestsPerSecond: 100,
        averageResponseTime: 300,
        p95ResponseTime: 450,
        p99ResponseTime: 700,
        errorRate: 2.0,
        throughput: 102400,
        scenarios: [],
        summary: {
          passed: true,
          totalErrors: 600,
          criticalErrors: 0,
          recommendations: [],
        },
      };

      jest.spyOn(highLoadTester, "runLoadTest").mockResolvedValue(mockResult);

      // Test with minimal configuration
      const minimalResult = await highLoadTester.runHighLoadTest({});
      expect(minimalResult.scalingFactor).toBe(10); // Default
      expect(minimalResult.baselineComparison).toBeDefined();

      // Test with custom scaling factor
      const customScalingResult = await highLoadTester.runHighLoadTest({
        scalingFactor: 15,
        baselineRPS: 20,
      });
      expect(customScalingResult.scalingFactor).toBe(15);

      // Test with custom thresholds
      const customThresholdsResult = await highLoadTester.runHighLoadTest({
        performanceThresholds: {
          maxResponseTime: 600,
          maxErrorRate: 3,
          minThroughput: 85,
          p95Threshold: 500,
          p99Threshold: 1000,
        },
      });
      expect(customThresholdsResult.performanceGrades).toBeDefined();

      // Verify all configurations were applied correctly
      const loadTestCalls = (highLoadTester.runLoadTest as jest.Mock).mock
        .calls;
      expect(loadTestCalls.length).toBe(3);

      // Check custom scaling factor was applied
      const customScalingConfig = loadTestCalls[1][0];
      expect(customScalingConfig.scalingFactor).toBe(15);
      expect(customScalingConfig.baselineRPS).toBe(20);
      expect(customScalingConfig.targetRPS).toBe(300); // 20 * 15
    });
  });

  describe("Static Factory Methods", () => {
    it("should create production readiness test configuration", () => {
      const config = highLoadTester.constructor.getProductionReadinessTest(
        "https://api.matbakh.app"
      );

      expect(config).toMatchObject({
        target: "https://api.matbakh.app",
        scalingFactor: 10,
        baselineRPS: 10,
        targetRPS: 100,
        maxConcurrency: 100,
        performanceThresholds: {
          maxResponseTime: 800,
          maxErrorRate: 2,
          minThroughput: 90,
          p95Threshold: 600,
          p99Threshold: 1000,
        },
      });

      expect(config.phases).toHaveLength(4);
      expect(config.phases[2]).toMatchObject({
        duration: 300,
        arrivalRate: 100,
        name: "full-load",
      });
    });

    it("should create stress breaking point test configuration", () => {
      const config = highLoadTester.constructor.getStressBreakingPointTest(
        "https://api.matbakh.app"
      );

      expect(config).toMatchObject({
        target: "https://api.matbakh.app",
        scalingFactor: 20, // Beyond 10x
        baselineRPS: 10,
        targetRPS: 200,
        maxConcurrency: 200,
        performanceThresholds: {
          maxResponseTime: 2000,
          maxErrorRate: 10,
          minThroughput: 150,
          p95Threshold: 1500,
          p99Threshold: 3000,
        },
      });

      expect(config.phases).toHaveLength(6);
      const breakingPointPhase = config.phases.find(
        (p) => p.name === "breaking-point"
      );
      expect(breakingPointPhase).toMatchObject({
        duration: 180,
        arrivalRate: 200,
        name: "breaking-point",
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
