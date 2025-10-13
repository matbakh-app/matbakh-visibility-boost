/**
 * System Impact Measurement
 *
 * Measures the system impact of hybrid routing implementation including
 * performance metrics, resource usage, and operational overhead.
 */

export interface SystemMetrics {
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

export interface MetricImpact {
  baseline: number;
  current: number;
  delta: number;
  percentageIncrease: number;
}

export interface OverallImpact {
  score: number;
  classification: "minimal" | "low" | "moderate" | "high" | "critical";
  summary: string;
}

export interface ImpactAnalysis {
  cpuImpact: MetricImpact;
  memoryImpact: MetricImpact;
  latencyImpact: MetricImpact;
  overallImpact: OverallImpact;
}

export interface SystemImpactReport {
  measurementId: string;
  timestamp: Date;
  baselineMetrics: SystemMetrics;
  currentMetrics: SystemMetrics;
  impactAnalysis: ImpactAnalysis;
  recommendations: string[];
}

export interface RoutingDecisionImpact {
  decisionLatency: number;
  measurementOverhead: number;
  efficiency: number;
  pathSwitchingCost: number;
}

export interface HealthCheckImpact {
  checkFrequency: number;
  checkLatency: number;
  resourceUsage: number;
  networkOverhead: number;
}

export interface SystemMetricsCollector {
  getCpuUsage(): Promise<number>;
  getMemoryUsage(): Promise<number>;
  getNetworkLatency(): Promise<number>;
  getDiskIo(): Promise<number>;
  getSystemLoad(): Promise<number>;
  getResourceUtilization(): Promise<number>;
}

export interface PerformanceMonitor {
  measureLatency(): Promise<number>;
  measureThroughput(): Promise<number>;
  measureErrorRate(): Promise<number>;
  measureResourceOverhead(): Promise<number>;
  generatePerformanceReport(): Promise<any>;
}

export interface HybridRoutingMetrics {
  getRoutingDecisionTime(): Promise<number>;
  getRoutingOverhead(): Promise<number>;
  getPathSwitchingLatency(): Promise<number>;
  getHealthCheckOverhead(): Promise<number>;
  getRoutingEfficiency(): Promise<number>;
}

/**
 * System Impact Measurement Service
 *
 * Provides comprehensive measurement and analysis of system impact
 * from hybrid routing implementation.
 */
export class SystemImpactMeasurement {
  private systemMetrics: SystemMetricsCollector;
  private performanceMonitor: PerformanceMonitor;
  private hybridRoutingMetrics: HybridRoutingMetrics;
  private baselineMetrics: SystemMetrics | null = null;
  private measurementActive: boolean = false;
  private measurementStartTime: number = 0;

  constructor(
    systemMetrics: SystemMetricsCollector,
    performanceMonitor: PerformanceMonitor,
    hybridRoutingMetrics: HybridRoutingMetrics
  ) {
    this.systemMetrics = systemMetrics;
    this.performanceMonitor = performanceMonitor;
    this.hybridRoutingMetrics = hybridRoutingMetrics;
  }

  /**
   * Start system impact measurement
   * Captures baseline metrics for comparison
   */
  async startMeasurement(): Promise<void> {
    if (this.measurementActive) {
      throw new Error("Measurement already active");
    }

    try {
      this.measurementStartTime = Date.now();
      this.baselineMetrics = await this.captureBaselineMetrics();
      this.measurementActive = true;

      console.log("System impact measurement started", {
        measurementId: `impact-${this.measurementStartTime}`,
        timestamp: new Date(this.measurementStartTime).toISOString(),
        baselineMetrics: this.baselineMetrics,
      });
    } catch (error) {
      this.measurementActive = false;
      throw new Error(
        `Failed to start measurement: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Stop system impact measurement
   * Generates comprehensive impact report
   */
  async stopMeasurement(): Promise<SystemImpactReport> {
    if (!this.measurementActive) {
      throw new Error("No active measurement to stop");
    }

    if (!this.baselineMetrics) {
      throw new Error("No baseline metrics available");
    }

    try {
      const currentMetrics = await this.captureCurrentMetrics();
      const impactAnalysis = this.calculateImpact(
        this.baselineMetrics,
        currentMetrics
      );
      const measurementDuration = Date.now() - this.measurementStartTime;

      this.measurementActive = false;

      const report: SystemImpactReport = {
        measurementId: `impact-${this.measurementStartTime}`,
        timestamp: new Date(),
        baselineMetrics: this.baselineMetrics,
        currentMetrics,
        impactAnalysis,
        recommendations: this.generateRecommendations(impactAnalysis),
      };

      console.log("System impact measurement completed", {
        measurementId: report.measurementId,
        duration: measurementDuration,
        overallImpact: impactAnalysis.overallImpact,
        recommendationsCount: report.recommendations.length,
      });

      return report;
    } catch (error) {
      this.measurementActive = false;
      throw new Error(
        `Failed to stop measurement: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Measure routing decision impact specifically
   */
  async measureRoutingDecisionImpact(): Promise<RoutingDecisionImpact> {
    const startTime = Date.now();

    try {
      const routingDecisionTime =
        await this.hybridRoutingMetrics.getRoutingDecisionTime();
      const efficiency = await this.hybridRoutingMetrics.getRoutingEfficiency();
      const pathSwitchingCost =
        await this.hybridRoutingMetrics.getPathSwitchingLatency();

      const endTime = Date.now();
      const measurementOverhead = endTime - startTime;

      return {
        decisionLatency: routingDecisionTime,
        measurementOverhead,
        efficiency,
        pathSwitchingCost,
      };
    } catch (error) {
      throw new Error(
        `Failed to measure routing decision impact: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Measure health check impact specifically
   */
  async measureHealthCheckImpact(): Promise<HealthCheckImpact> {
    try {
      const healthCheckOverhead =
        await this.hybridRoutingMetrics.getHealthCheckOverhead();

      return {
        checkFrequency: 30, // seconds - configurable
        checkLatency: healthCheckOverhead,
        resourceUsage: healthCheckOverhead * 0.1, // estimated CPU usage
        networkOverhead: healthCheckOverhead * 0.05, // estimated network usage
      };
    } catch (error) {
      throw new Error(
        `Failed to measure health check impact: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get current measurement status
   */
  getMeasurementStatus(): {
    active: boolean;
    startTime: number | null;
    duration: number | null;
  } {
    return {
      active: this.measurementActive,
      startTime: this.measurementActive ? this.measurementStartTime : null,
      duration: this.measurementActive
        ? Date.now() - this.measurementStartTime
        : null,
    };
  }

  /**
   * Capture baseline system metrics
   */
  private async captureBaselineMetrics(): Promise<SystemMetrics> {
    try {
      const [
        cpuUsage,
        systemLoad,
        memoryUsage,
        resourceUtilization,
        networkLatency,
        throughput,
        responseTime,
        errorRate,
        resourceOverhead,
      ] = await Promise.all([
        this.systemMetrics.getCpuUsage(),
        this.systemMetrics.getSystemLoad(),
        this.systemMetrics.getMemoryUsage(),
        this.systemMetrics.getResourceUtilization(),
        this.systemMetrics.getNetworkLatency(),
        this.performanceMonitor.measureThroughput(),
        this.performanceMonitor.measureLatency(),
        this.performanceMonitor.measureErrorRate(),
        this.performanceMonitor.measureResourceOverhead(),
      ]);

      return {
        cpu: {
          usage: cpuUsage,
          load: systemLoad,
        },
        memory: {
          usage: memoryUsage,
          utilization: resourceUtilization,
        },
        network: {
          latency: networkLatency,
          throughput,
        },
        performance: {
          responseTime,
          errorRate,
          overhead: resourceOverhead,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to capture baseline metrics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Capture current system metrics including hybrid routing metrics
   */
  private async captureCurrentMetrics(): Promise<SystemMetrics> {
    try {
      const baseMetrics = await this.captureBaselineMetrics();

      // Add hybrid routing specific metrics
      const [
        routingDecisionTime,
        routingOverhead,
        pathSwitchingLatency,
        healthCheckOverhead,
        routingEfficiency,
      ] = await Promise.all([
        this.hybridRoutingMetrics.getRoutingDecisionTime(),
        this.hybridRoutingMetrics.getRoutingOverhead(),
        this.hybridRoutingMetrics.getPathSwitchingLatency(),
        this.hybridRoutingMetrics.getHealthCheckOverhead(),
        this.hybridRoutingMetrics.getRoutingEfficiency(),
      ]);

      return {
        ...baseMetrics,
        hybridRouting: {
          routingDecisionTime,
          routingOverhead,
          pathSwitchingLatency,
          healthCheckOverhead,
          routingEfficiency,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to capture current metrics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Calculate impact analysis between baseline and current metrics
   */
  private calculateImpact(
    baseline: SystemMetrics,
    current: SystemMetrics
  ): ImpactAnalysis {
    const cpuImpact = this.calculateMetricImpact(
      baseline.cpu.usage,
      current.cpu.usage
    );

    const memoryImpact = this.calculateMetricImpact(
      baseline.memory.usage,
      current.memory.usage
    );

    const latencyImpact = this.calculateMetricImpact(
      baseline.performance.responseTime,
      current.performance.responseTime
    );

    const overallImpact = this.calculateOverallImpact(
      cpuImpact,
      memoryImpact,
      latencyImpact
    );

    return {
      cpuImpact,
      memoryImpact,
      latencyImpact,
      overallImpact,
    };
  }

  /**
   * Calculate impact for a specific metric
   */
  private calculateMetricImpact(
    baseline: number,
    current: number
  ): MetricImpact {
    const delta = current - baseline;
    const percentageIncrease =
      baseline === 0
        ? current === 0
          ? 0
          : Infinity
        : (delta / baseline) * 100;

    return {
      baseline,
      current,
      delta,
      percentageIncrease,
    };
  }

  /**
   * Calculate overall system impact
   */
  private calculateOverallImpact(
    cpuImpact: MetricImpact,
    memoryImpact: MetricImpact,
    latencyImpact: MetricImpact
  ): OverallImpact {
    // Handle infinity values for percentage calculation
    const cpuPercent = isFinite(cpuImpact.percentageIncrease)
      ? cpuImpact.percentageIncrease
      : 100;
    const memoryPercent = isFinite(memoryImpact.percentageIncrease)
      ? memoryImpact.percentageIncrease
      : 100;
    const latencyPercent = isFinite(latencyImpact.percentageIncrease)
      ? latencyImpact.percentageIncrease
      : 100;

    const averageImpact = (cpuPercent + memoryPercent + latencyPercent) / 3;
    const score = Math.max(0, Math.min(100, 100 - averageImpact));
    const classification = this.classifyImpact(averageImpact);

    return {
      score,
      classification,
      summary: `System impact: ${averageImpact.toFixed(
        2
      )}% average change in resource usage`,
    };
  }

  /**
   * Classify impact level based on percentage
   */
  private classifyImpact(
    impactPercentage: number
  ): "minimal" | "low" | "moderate" | "high" | "critical" {
    const absImpact = Math.abs(impactPercentage);

    if (absImpact < 2) return "minimal";
    if (absImpact < 5) return "low";
    if (absImpact < 10) return "moderate";
    if (absImpact < 20) return "high";
    return "critical";
  }

  /**
   * Generate recommendations based on impact analysis
   */
  private generateRecommendations(impact: ImpactAnalysis): string[] {
    const recommendations: string[] = [];

    // CPU impact recommendations
    if (impact.cpuImpact.percentageIncrease > 5) {
      recommendations.push(
        "Consider optimizing routing decision algorithms to reduce CPU overhead"
      );
    }

    // Memory impact recommendations
    if (impact.memoryImpact.percentageIncrease > 10) {
      recommendations.push(
        "Implement memory pooling for routing state management"
      );
    }

    // Latency impact recommendations
    if (impact.latencyImpact.percentageIncrease > 3) {
      recommendations.push(
        "Optimize health check intervals and routing decision caching"
      );
    }

    // Overall impact recommendations
    if (
      impact.overallImpact.classification === "high" ||
      impact.overallImpact.classification === "critical"
    ) {
      recommendations.push(
        "Consider implementing circuit breakers to reduce system load during peak usage"
      );
    }

    // Performance improvement recommendations
    if (
      impact.overallImpact.classification === "minimal" &&
      impact.overallImpact.score > 98
    ) {
      recommendations.push(
        "System impact is minimal - current hybrid routing configuration is optimal"
      );
    }

    // Specific hybrid routing recommendations
    if (
      impact.cpuImpact.percentageIncrease > 2 &&
      impact.latencyImpact.percentageIncrease > 2
    ) {
      recommendations.push(
        "Consider adjusting routing decision frequency to balance accuracy and performance"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "System impact is within acceptable limits - no immediate action required"
      );
    }

    return recommendations;
  }

  /**
   * Export measurement data for external analysis
   */
  async exportMeasurementData(report: SystemImpactReport): Promise<string> {
    try {
      const exportData = {
        ...report,
        exportTimestamp: new Date().toISOString(),
        version: "1.0.0",
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to export measurement data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Cleanup resources and reset measurement state
   */
  cleanup(): void {
    this.measurementActive = false;
    this.baselineMetrics = null;
    this.measurementStartTime = 0;

    console.log("System impact measurement cleanup completed");
  }
}
