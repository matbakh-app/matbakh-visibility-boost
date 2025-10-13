/**
 * System Impact Measurement Tests
 *
 * Tests for measuring the system impact of hybrid routing implementation
 * including performance metrics, resource usage, and operational overhead.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// Mock implementations for system impact measurement
const mockSystemMetrics = {
  getCpuUsage: jest.fn(),
  getMemoryUsage: jest.fn(),
  getNetworkLatency: jest.fn(),
  getDiskIo: jest.fn(),
  getSystemLoad: jest.fn(),
  getResourceUtilization: jest.fn(),
};

const mockPerformanceMonitor = {
  measureLatency: jest.fn(),
  measureThroughput: jest.fn(),
  measureErrorRate: jest.fn(),
  measureResourceOverhead: jest.fn(),
  generatePerformanceReport: jest.fn(),
};

const mockHybridRoutingMetrics = {
  getRoutingDecisionTime: jest.fn(),
  getRoutingOverhead: jest.fn(),
  getPathSwitchingLatency: jest.fn(),
  getHealthCheckOverhead: jest.fn(),
  getRoutingEfficiency: jest.fn(),
};

// System Impact Measurement implementation
class SystemImpactMeasurement {
  private systemMetrics: typeof mockSystemMetrics;
  private performanceMonitor: typeof mockPerformanceMonitor;
  private hybridRoutingMetrics: typeof mockHybridRoutingMetrics;
  private baselineMetrics: any = null;
  private measurementActive: boolean = false;

  constructor(
    systemMetrics = mockSystemMetrics,
    performanceMonitor = mockPerformanceMonitor,
    hybridRoutingMetrics = mockHybridRoutingMetrics
  ) {
    this.systemMetrics = systemMetrics;
    this.performanceMonitor = performanceMonitor;
    this.hybridRoutingMetrics = hybridRoutingMetrics;
  }

  async startMeasurement(): Promise<void> {
    if (this.measurementActive) {
      throw new Error("Measurement already active");
    }

    // Capture baseline metrics
    this.baselineMetrics = await this.captureBaselineMetrics();
    this.measurementActive = true;
  }

  async stopMeasurement(): Promise<SystemImpactReport> {
    if (!this.measurementActive) {
      throw new Error("No active measurement to stop");
    }

    const currentMetrics = await this.captureCurrentMetrics();
    const impactAnalysis = this.calculateImpact(
      this.baselineMetrics,
      currentMetrics
    );

    this.measurementActive = false;

    return {
      measurementId: `impact-${Date.now()}`,
      timestamp: new Date(),
      baselineMetrics: this.baselineMetrics,
      currentMetrics,
      impactAnalysis,
      recommendations: this.generateRecommendations(impactAnalysis),
    };
  }

  private async captureBaselineMetrics(): Promise<SystemMetrics> {
    return {
      cpu: {
        usage: await this.systemMetrics.getCpuUsage(),
        load: await this.systemMetrics.getSystemLoad(),
      },
      memory: {
        usage: await this.systemMetrics.getMemoryUsage(),
        utilization: await this.systemMetrics.getResourceUtilization(),
      },
      network: {
        latency: await this.systemMetrics.getNetworkLatency(),
        throughput: await this.performanceMonitor.measureThroughput(),
      },
      performance: {
        responseTime: await this.performanceMonitor.measureLatency(),
        errorRate: await this.performanceMonitor.measureErrorRate(),
        overhead: await this.performanceMonitor.measureResourceOverhead(),
      },
    };
  }

  private async captureCurrentMetrics(): Promise<SystemMetrics> {
    const baseMetrics = await this.captureBaselineMetrics();

    // Add hybrid routing specific metrics
    return {
      ...baseMetrics,
      hybridRouting: {
        routingDecisionTime:
          await this.hybridRoutingMetrics.getRoutingDecisionTime(),
        routingOverhead: await this.hybridRoutingMetrics.getRoutingOverhead(),
        pathSwitchingLatency:
          await this.hybridRoutingMetrics.getPathSwitchingLatency(),
        healthCheckOverhead:
          await this.hybridRoutingMetrics.getHealthCheckOverhead(),
        routingEfficiency:
          await this.hybridRoutingMetrics.getRoutingEfficiency(),
      },
    };
  }

  private calculateImpact(
    baseline: SystemMetrics,
    current: SystemMetrics
  ): ImpactAnalysis {
    return {
      cpuImpact: {
        baseline: baseline.cpu.usage,
        current: current.cpu.usage,
        delta: current.cpu.usage - baseline.cpu.usage,
        percentageIncrease:
          ((current.cpu.usage - baseline.cpu.usage) / baseline.cpu.usage) * 100,
      },
      memoryImpact: {
        baseline: baseline.memory.usage,
        current: current.memory.usage,
        delta: current.memory.usage - baseline.memory.usage,
        percentageIncrease:
          ((current.memory.usage - baseline.memory.usage) /
            baseline.memory.usage) *
          100,
      },
      latencyImpact: {
        baseline: baseline.performance.responseTime,
        current: current.performance.responseTime,
        delta:
          current.performance.responseTime - baseline.performance.responseTime,
        percentageIncrease:
          ((current.performance.responseTime -
            baseline.performance.responseTime) /
            baseline.performance.responseTime) *
          100,
      },
      overallImpact: this.calculateOverallImpact(baseline, current),
    };
  }

  private calculateOverallImpact(
    baseline: SystemMetrics,
    current: SystemMetrics
  ): OverallImpact {
    const cpuDelta =
      ((current.cpu.usage - baseline.cpu.usage) / baseline.cpu.usage) * 100;
    const memoryDelta =
      ((current.memory.usage - baseline.memory.usage) / baseline.memory.usage) *
      100;
    const latencyDelta =
      ((current.performance.responseTime - baseline.performance.responseTime) /
        baseline.performance.responseTime) *
      100;

    const averageImpact = (cpuDelta + memoryDelta + latencyDelta) / 3;

    return {
      score: Math.max(0, Math.min(100, 100 - averageImpact)),
      classification: this.classifyImpact(averageImpact),
      summary: `System impact: ${averageImpact.toFixed(
        2
      )}% increase in resource usage`,
    };
  }

  private classifyImpact(
    impactPercentage: number
  ): "minimal" | "low" | "moderate" | "high" | "critical" {
    if (impactPercentage < 2) return "minimal";
    if (impactPercentage < 5) return "low";
    if (impactPercentage < 10) return "moderate";
    if (impactPercentage < 20) return "high";
    return "critical";
  }

  private generateRecommendations(impact: ImpactAnalysis): string[] {
    const recommendations: string[] = [];

    if (impact.cpuImpact.percentageIncrease > 5) {
      recommendations.push(
        "Consider optimizing routing decision algorithms to reduce CPU overhead"
      );
    }

    if (impact.memoryImpact.percentageIncrease > 10) {
      recommendations.push(
        "Implement memory pooling for routing state management"
      );
    }

    if (impact.latencyImpact.percentageIncrease > 3) {
      recommendations.push(
        "Optimize health check intervals and routing decision caching"
      );
    }

    if (
      impact.overallImpact.classification === "high" ||
      impact.overallImpact.classification === "critical"
    ) {
      recommendations.push(
        "Consider implementing circuit breakers to reduce system load during peak usage"
      );
    }

    return recommendations;
  }

  async measureRoutingDecisionImpact(): Promise<RoutingDecisionImpact> {
    const startTime = Date.now();
    const routingDecisionTime =
      await this.hybridRoutingMetrics.getRoutingDecisionTime();
    const endTime = Date.now();

    return {
      decisionLatency: routingDecisionTime,
      measurementOverhead: endTime - startTime,
      efficiency: await this.hybridRoutingMetrics.getRoutingEfficiency(),
      pathSwitchingCost:
        await this.hybridRoutingMetrics.getPathSwitchingLatency(),
    };
  }

  async measureHealthCheckImpact(): Promise<HealthCheckImpact> {
    const healthCheckOverhead =
      await this.hybridRoutingMetrics.getHealthCheckOverhead();

    return {
      checkFrequency: 30, // seconds
      checkLatency: healthCheckOverhead,
      resourceUsage: healthCheckOverhead * 0.1, // estimated CPU usage
      networkOverhead: healthCheckOverhead * 0.05, // estimated network usage
    };
  }
}

// Type definitions
interface SystemMetrics {
  cpu: {
    usage: number;
    load: number;
  };
  memory: {
    usage: number;
    utilization: number;
  };
  network: {
    latency: number;
    throughput: number;
  };
  performance: {
    responseTime: number;
    errorRate: number;
    overhead: number;
  };
  hybridRouting?: {
    routingDecisionTime: number;
    routingOverhead: number;
    pathSwitchingLatency: number;
    healthCheckOverhead: number;
    routingEfficiency: number;
  };
}

interface ImpactAnalysis {
  cpuImpact: MetricImpact;
  memoryImpact: MetricImpact;
  latencyImpact: MetricImpact;
  overallImpact: OverallImpact;
}

interface MetricImpact {
  baseline: number;
  current: number;
  delta: number;
  percentageIncrease: number;
}

interface OverallImpact {
  score: number;
  classification: "minimal" | "low" | "moderate" | "high" | "critical";
  summary: string;
}

interface SystemImpactReport {
  measurementId: string;
  timestamp: Date;
  baselineMetrics: SystemMetrics;
  currentMetrics: SystemMetrics;
  impactAnalysis: ImpactAnalysis;
  recommendations: string[];
}

interface RoutingDecisionImpact {
  decisionLatency: number;
  measurementOverhead: number;
  efficiency: number;
  pathSwitchingCost: number;
}

interface HealthCheckImpact {
  checkFrequency: number;
  checkLatency: number;
  resourceUsage: number;
  networkOverhead: number;
}

describe("System Impact Measurement", () => {
  let systemImpactMeasurement: SystemImpactMeasurement;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockSystemMetrics.getCpuUsage.mockResolvedValue(25.5);
    mockSystemMetrics.getMemoryUsage.mockResolvedValue(512);
    mockSystemMetrics.getNetworkLatency.mockResolvedValue(50);
    mockSystemMetrics.getSystemLoad.mockResolvedValue(1.2);
    mockSystemMetrics.getResourceUtilization.mockResolvedValue(60);

    mockPerformanceMonitor.measureLatency.mockResolvedValue(150);
    mockPerformanceMonitor.measureThroughput.mockResolvedValue(1000);
    mockPerformanceMonitor.measureErrorRate.mockResolvedValue(0.5);
    mockPerformanceMonitor.measureResourceOverhead.mockResolvedValue(5);

    mockHybridRoutingMetrics.getRoutingDecisionTime.mockResolvedValue(2.5);
    mockHybridRoutingMetrics.getRoutingOverhead.mockResolvedValue(1.2);
    mockHybridRoutingMetrics.getPathSwitchingLatency.mockResolvedValue(10);
    mockHybridRoutingMetrics.getHealthCheckOverhead.mockResolvedValue(0.8);
    mockHybridRoutingMetrics.getRoutingEfficiency.mockResolvedValue(95.5);

    systemImpactMeasurement = new SystemImpactMeasurement();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Measurement Lifecycle", () => {
    it("should start measurement and capture baseline metrics", async () => {
      await systemImpactMeasurement.startMeasurement();

      expect(mockSystemMetrics.getCpuUsage).toHaveBeenCalled();
      expect(mockSystemMetrics.getMemoryUsage).toHaveBeenCalled();
      expect(mockPerformanceMonitor.measureLatency).toHaveBeenCalled();
    });

    it("should prevent starting measurement when already active", async () => {
      await systemImpactMeasurement.startMeasurement();

      await expect(systemImpactMeasurement.startMeasurement()).rejects.toThrow(
        "Measurement already active"
      );
    });

    it("should stop measurement and generate impact report", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate system changes
      mockSystemMetrics.getCpuUsage.mockResolvedValue(27.0); // 1.5% increase
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(530); // ~3.5% increase
      mockPerformanceMonitor.measureLatency.mockResolvedValue(155); // ~3.3% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report).toHaveProperty("measurementId");
      expect(report).toHaveProperty("timestamp");
      expect(report).toHaveProperty("baselineMetrics");
      expect(report).toHaveProperty("currentMetrics");
      expect(report).toHaveProperty("impactAnalysis");
      expect(report).toHaveProperty("recommendations");
    });

    it("should prevent stopping measurement when not active", async () => {
      await expect(systemImpactMeasurement.stopMeasurement()).rejects.toThrow(
        "No active measurement to stop"
      );
    });
  });

  describe("Impact Analysis", () => {
    it("should calculate CPU impact correctly", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate 10% CPU increase
      mockSystemMetrics.getCpuUsage.mockResolvedValue(28.05); // 10% increase from 25.5

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.cpuImpact.baseline).toBe(25.5);
      expect(report.impactAnalysis.cpuImpact.current).toBe(28.05);
      expect(report.impactAnalysis.cpuImpact.delta).toBeCloseTo(2.55);
      expect(report.impactAnalysis.cpuImpact.percentageIncrease).toBeCloseTo(
        10
      );
    });

    it("should calculate memory impact correctly", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate 15% memory increase
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(588.8); // 15% increase from 512

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.memoryImpact.baseline).toBe(512);
      expect(report.impactAnalysis.memoryImpact.current).toBe(588.8);
      expect(report.impactAnalysis.memoryImpact.delta).toBeCloseTo(76.8);
      expect(report.impactAnalysis.memoryImpact.percentageIncrease).toBeCloseTo(
        15
      );
    });

    it("should calculate latency impact correctly", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate 5% latency increase
      mockPerformanceMonitor.measureLatency.mockResolvedValue(157.5); // 5% increase from 150

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.latencyImpact.baseline).toBe(150);
      expect(report.impactAnalysis.latencyImpact.current).toBe(157.5);
      expect(report.impactAnalysis.latencyImpact.delta).toBeCloseTo(7.5);
      expect(
        report.impactAnalysis.latencyImpact.percentageIncrease
      ).toBeCloseTo(5);
    });

    it("should classify impact levels correctly", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate minimal impact (1% increase across metrics)
      mockSystemMetrics.getCpuUsage.mockResolvedValue(25.755); // 1% increase
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(517.12); // 1% increase
      mockPerformanceMonitor.measureLatency.mockResolvedValue(151.5); // 1% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.overallImpact.classification).toBe(
        "minimal"
      );
      expect(report.impactAnalysis.overallImpact.score).toBeGreaterThan(95);
    });

    it("should classify high impact correctly", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate high impact (15% increase across metrics)
      mockSystemMetrics.getCpuUsage.mockResolvedValue(29.325); // 15% increase
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(588.8); // 15% increase
      mockPerformanceMonitor.measureLatency.mockResolvedValue(172.5); // 15% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.overallImpact.classification).toBe("high");
      expect(report.impactAnalysis.overallImpact.score).toBeLessThan(90);
    });
  });

  describe("Routing Decision Impact", () => {
    it("should measure routing decision impact", async () => {
      const routingImpact =
        await systemImpactMeasurement.measureRoutingDecisionImpact();

      expect(routingImpact).toHaveProperty("decisionLatency");
      expect(routingImpact).toHaveProperty("measurementOverhead");
      expect(routingImpact).toHaveProperty("efficiency");
      expect(routingImpact).toHaveProperty("pathSwitchingCost");

      expect(routingImpact.decisionLatency).toBe(2.5);
      expect(routingImpact.efficiency).toBe(95.5);
      expect(routingImpact.pathSwitchingCost).toBe(10);
    });

    it("should validate routing decision latency is within acceptable limits", async () => {
      const routingImpact =
        await systemImpactMeasurement.measureRoutingDecisionImpact();

      // Routing decision should be < 5ms for acceptable performance
      expect(routingImpact.decisionLatency).toBeLessThan(5);
      expect(routingImpact.efficiency).toBeGreaterThan(90);
    });
  });

  describe("Health Check Impact", () => {
    it("should measure health check impact", async () => {
      const healthCheckImpact =
        await systemImpactMeasurement.measureHealthCheckImpact();

      expect(healthCheckImpact).toHaveProperty("checkFrequency");
      expect(healthCheckImpact).toHaveProperty("checkLatency");
      expect(healthCheckImpact).toHaveProperty("resourceUsage");
      expect(healthCheckImpact).toHaveProperty("networkOverhead");

      expect(healthCheckImpact.checkFrequency).toBe(30);
      expect(healthCheckImpact.checkLatency).toBe(0.8);
    });

    it("should validate health check overhead is minimal", async () => {
      const healthCheckImpact =
        await systemImpactMeasurement.measureHealthCheckImpact();

      // Health check overhead should be minimal
      expect(healthCheckImpact.checkLatency).toBeLessThan(2);
      expect(healthCheckImpact.resourceUsage).toBeLessThan(1);
      expect(healthCheckImpact.networkOverhead).toBeLessThan(0.5);
    });
  });

  describe("Recommendations Generation", () => {
    it("should generate CPU optimization recommendations for high CPU impact", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate high CPU impact (8% increase)
      mockSystemMetrics.getCpuUsage.mockResolvedValue(27.54); // 8% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.recommendations).toContain(
        "Consider optimizing routing decision algorithms to reduce CPU overhead"
      );
    });

    it("should generate memory optimization recommendations for high memory impact", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate high memory impact (12% increase)
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(573.44); // 12% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.recommendations).toContain(
        "Implement memory pooling for routing state management"
      );
    });

    it("should generate latency optimization recommendations for high latency impact", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate high latency impact (5% increase)
      mockPerformanceMonitor.measureLatency.mockResolvedValue(157.5); // 5% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.recommendations).toContain(
        "Optimize health check intervals and routing decision caching"
      );
    });

    it("should generate circuit breaker recommendations for critical impact", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate critical impact (25% increase across metrics)
      mockSystemMetrics.getCpuUsage.mockResolvedValue(31.875); // 25% increase
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(640); // 25% increase
      mockPerformanceMonitor.measureLatency.mockResolvedValue(187.5); // 25% increase

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.recommendations).toContain(
        "Consider implementing circuit breakers to reduce system load during peak usage"
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle metric collection failures gracefully", async () => {
      mockSystemMetrics.getCpuUsage.mockRejectedValue(
        new Error("CPU metric unavailable")
      );

      await expect(systemImpactMeasurement.startMeasurement()).rejects.toThrow(
        "CPU metric unavailable"
      );
    });

    it("should handle zero baseline metrics", async () => {
      mockSystemMetrics.getCpuUsage.mockResolvedValue(0);
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(0);
      mockPerformanceMonitor.measureLatency.mockResolvedValue(0);

      await systemImpactMeasurement.startMeasurement();

      // Set current metrics to non-zero values
      mockSystemMetrics.getCpuUsage.mockResolvedValue(10);
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(100);
      mockPerformanceMonitor.measureLatency.mockResolvedValue(50);

      const report = await systemImpactMeasurement.stopMeasurement();

      // Should handle division by zero gracefully
      expect(report.impactAnalysis.cpuImpact.percentageIncrease).toBe(Infinity);
      expect(report.impactAnalysis.overallImpact.classification).toBe(
        "critical"
      );
    });

    it("should handle negative impact (performance improvement)", async () => {
      await systemImpactMeasurement.startMeasurement();

      // Simulate performance improvement (10% decrease)
      mockSystemMetrics.getCpuUsage.mockResolvedValue(22.95); // 10% decrease
      mockSystemMetrics.getMemoryUsage.mockResolvedValue(460.8); // 10% decrease
      mockPerformanceMonitor.measureLatency.mockResolvedValue(135); // 10% decrease

      const report = await systemImpactMeasurement.stopMeasurement();

      expect(report.impactAnalysis.cpuImpact.percentageIncrease).toBeCloseTo(
        -10
      );
      expect(report.impactAnalysis.overallImpact.score).toBe(100); // Score is capped at 100
      expect(report.impactAnalysis.overallImpact.classification).toBe(
        "minimal"
      );
    });
  });
});
