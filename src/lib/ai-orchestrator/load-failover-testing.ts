/**
 * Load & Failover Testing Suite
 *
 * Comprehensive testing for 10x load scenarios with burst, warm-up, cache-eviction
 * Multi-region failover with P95 tracking during failover events
 */
import { EventEmitter } from "events";
import { sloBurnRateMonitor } from "./slo-burn-rate-monitor";
import { streamingPercentileEngine } from "./streaming-percentile-engine";

export interface LoadTestScenario {
  name: string;
  duration: number; // seconds
  rampUp: number; // seconds
  targetRPS: number;
  burstMultiplier?: number; // e.g., 3x for burst testing
  warmUpRequests?: number;
  cacheEvictionRate?: number; // 0-1, percentage of cache to evict
  regions?: string[];
}

export interface LoadTestResult {
  scenario: string;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number; // RPS
  cacheHitRate: number;
  costPerRequest: number;
  providerDistribution: Record<string, number>;
  sloViolations: number;
  failoverEvents: number;
  regionMetrics?: Record<
    string,
    {
      p95: number;
      errorRate: number;
      throughput: number;
    }
  >;
}

export interface FailoverTestResult {
  scenario: string;
  failoverTrigger: "manual" | "health_check" | "p95_breach";
  failoverDuration: number; // ms
  recoveryDuration: number; // ms
  p95DuringFailover: number;
  p95AfterRecovery: number;
  requestsLostDuringFailover: number;
  alertsSuppressed: boolean;
  rollbackSuccessful: boolean;
}

export class LoadFailoverTester extends EventEmitter {
  private activeTests = new Map<
    string,
    {
      startTime: number;
      requests: Array<{
        timestamp: number;
        latency: number;
        success: boolean;
        provider: string;
        region: string;
        cached: boolean;
        cost: number;
      }>;
      scenario: LoadTestScenario;
    }
  >();

  private maintenanceWindows = new Map<
    string,
    {
      start: number;
      end: number;
      reason: string;
    }
  >();

  // Predefined test scenarios
  private readonly scenarios: Record<string, LoadTestScenario> = {
    baseline: {
      name: "Baseline Load",
      duration: 300, // 5 minutes
      rampUp: 60,
      targetRPS: 10,
    },
    burst: {
      name: "Burst Load Test",
      duration: 600, // 10 minutes
      rampUp: 30,
      targetRPS: 50,
      burstMultiplier: 3, // 150 RPS burst
      warmUpRequests: 100,
    },
    sustained: {
      name: "Sustained High Load",
      duration: 1800, // 30 minutes
      rampUp: 300,
      targetRPS: 100,
    },
    cacheEviction: {
      name: "Cache Eviction Stress",
      duration: 900, // 15 minutes
      rampUp: 60,
      targetRPS: 30,
      cacheEvictionRate: 0.8, // Evict 80% of cache
      warmUpRequests: 200,
    },
    multiRegion: {
      name: "Multi-Region Load",
      duration: 600,
      rampUp: 120,
      targetRPS: 75,
      regions: ["us-east-1", "eu-west-1"],
    },
  };

  async runLoadTest(scenarioName: string): Promise<LoadTestResult> {
    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    console.log(`Starting load test: ${scenario.name}`);
    this.emit("testStarted", { scenario: scenarioName });

    // Initialize test tracking
    const testId = `${scenarioName}-${Date.now()}`;
    this.activeTests.set(testId, {
      startTime: Date.now(),
      requests: [],
      scenario,
    });

    try {
      // Warm-up phase
      if (scenario.warmUpRequests) {
        await this.runWarmUp(testId, scenario.warmUpRequests);
      }

      // Cache eviction if specified
      if (scenario.cacheEvictionRate) {
        await this.evictCache(scenario.cacheEvictionRate);
      }

      // Main load test
      await this.executeLoadTest(testId, scenario);

      // Analyze results
      const result = this.analyzeResults(testId);
      this.activeTests.delete(testId);

      this.emit("testCompleted", { scenario: scenarioName, result });
      return result;
    } catch (error) {
      this.activeTests.delete(testId);
      this.emit("testFailed", { scenario: scenarioName, error });
      throw error;
    }
  }

  async runFailoverTest(
    trigger: "manual" | "health_check" | "p95_breach",
    targetRegion?: string
  ): Promise<FailoverTestResult> {
    const testId = `failover-${trigger}-${Date.now()}`;
    console.log(`Starting failover test: ${trigger}`);

    const startTime = Date.now();
    let failoverStarted = false;
    let failoverCompleted = false;
    let recoveryCompleted = false;

    // Start maintenance window to suppress alerts
    this.startMaintenanceWindow("failover-test", "Planned failover testing");

    try {
      // Baseline measurement
      const baselineP95 = streamingPercentileEngine.getP95("generation");

      // Trigger failover based on type
      const failoverStart = Date.now();
      await this.triggerFailover(trigger, targetRegion);
      failoverStarted = true;

      // Monitor failover completion
      const failoverEnd = await this.waitForFailoverCompletion();
      failoverCompleted = true;

      // Measure P95 during failover
      const p95DuringFailover = streamingPercentileEngine.getP95("generation");

      // Wait for recovery
      const recoveryStart = Date.now();
      await this.waitForRecovery();
      recoveryCompleted = true;
      const recoveryEnd = Date.now();

      // Final measurements
      const p95AfterRecovery = streamingPercentileEngine.getP95("generation");

      const result: FailoverTestResult = {
        scenario: `failover-${trigger}`,
        failoverTrigger: trigger,
        failoverDuration: failoverEnd - failoverStart,
        recoveryDuration: recoveryEnd - recoveryStart,
        p95DuringFailover,
        p95AfterRecovery,
        requestsLostDuringFailover: this.calculateLostRequests(
          failoverStart,
          failoverEnd
        ),
        alertsSuppressed: true,
        rollbackSuccessful: recoveryCompleted,
      };

      this.emit("failoverTestCompleted", result);
      return result;
    } catch (error) {
      this.emit("failoverTestFailed", { trigger, error });
      throw error;
    } finally {
      this.endMaintenanceWindow("failover-test");
    }
  }

  private async runWarmUp(testId: string, requestCount: number): Promise<void> {
    console.log(`Running warm-up: ${requestCount} requests`);

    const warmUpPromises = [];
    for (let i = 0; i < requestCount; i++) {
      warmUpPromises.push(this.sendRequest(testId, "warm-up"));

      // Spread warm-up requests over 30 seconds
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await Promise.all(warmUpPromises);
    console.log("Warm-up completed");
  }

  private async evictCache(evictionRate: number): Promise<void> {
    console.log(`Evicting ${evictionRate * 100}% of cache`);

    // This would integrate with your actual cache implementation
    // For now, we simulate cache eviction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.emit("cacheEvicted", { rate: evictionRate });
  }

  private async executeLoadTest(
    testId: string,
    scenario: LoadTestScenario
  ): Promise<void> {
    const test = this.activeTests.get(testId)!;
    const startTime = Date.now();
    const endTime = startTime + scenario.duration * 1000;
    const rampUpEnd = startTime + scenario.rampUp * 1000;

    console.log(`Executing load test for ${scenario.duration}s`);

    while (Date.now() < endTime) {
      const now = Date.now();
      const progress = Math.min(
        1,
        (now - startTime) / (scenario.rampUp * 1000)
      );

      // Calculate current RPS based on ramp-up
      let currentRPS = scenario.targetRPS * progress;

      // Apply burst multiplier if specified
      if (scenario.burstMultiplier && now > rampUpEnd) {
        const burstPhase = Math.sin((now - rampUpEnd) / 10000) > 0.8;
        if (burstPhase) {
          currentRPS *= scenario.burstMultiplier;
        }
      }

      // Send requests for this second
      const requestsThisSecond = Math.floor(currentRPS);
      const requestPromises = [];

      for (let i = 0; i < requestsThisSecond; i++) {
        const region = scenario.regions
          ? scenario.regions[i % scenario.regions.length]
          : "us-east-1";

        requestPromises.push(this.sendRequest(testId, region));
      }

      await Promise.all(requestPromises);

      // Wait for next second
      const nextSecond = Math.ceil(now / 1000) * 1000;
      const waitTime = nextSecond - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    console.log("Load test execution completed");
  }

  private async sendRequest(testId: string, region: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Simulate AI request - this would integrate with your actual AI router
      const latency = this.simulateRequest();
      const success = latency < 5000; // Timeout at 5s
      const provider = this.selectProvider();
      const cached = Math.random() < 0.3; // 30% cache hit rate
      const cost = this.calculateCost(provider, cached);

      const test = this.activeTests.get(testId)!;
      test.requests.push({
        timestamp: startTime,
        latency,
        success,
        provider,
        region,
        cached,
        cost,
      });

      // Record metrics
      streamingPercentileEngine.addMetric({
        timestamp: startTime,
        value: latency,
        operation: "generation",
        provider,
        role: "user-worker",
      });

      sloBurnRateMonitor.recordSLI(
        "generation",
        provider,
        "user-worker",
        latency
      );
    } catch (error) {
      const test = this.activeTests.get(testId)!;
      test.requests.push({
        timestamp: startTime,
        latency: 5000,
        success: false,
        provider: "unknown",
        region,
        cached: false,
        cost: 0,
      });
    }
  }

  private simulateRequest(): number {
    // Simulate realistic latency distribution
    const base = 200 + Math.random() * 800; // 200-1000ms base
    const spike = Math.random() < 0.05 ? Math.random() * 3000 : 0; // 5% chance of spike
    return Math.floor(base + spike);
  }

  private selectProvider(): string {
    const providers = ["bedrock", "google", "meta"];
    const weights = [0.5, 0.3, 0.2]; // Weighted selection

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < providers.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return providers[i];
      }
    }

    return providers[0];
  }

  private calculateCost(provider: string, cached: boolean): number {
    if (cached) return 0;

    const baseCosts = {
      bedrock: 0.003,
      google: 0.002,
      meta: 0.001,
    };

    return baseCosts[provider as keyof typeof baseCosts] || 0.002;
  }

  private analyzeResults(testId: string): LoadTestResult {
    const test = this.activeTests.get(testId)!;
    const requests = test.requests;

    const totalRequests = requests.length;
    const successfulRequests = requests.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const latencies = requests
      .filter((r) => r.success)
      .map((r) => r.latency)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    const p95Latency = latencies[p95Index] || 0;
    const p99Latency = latencies[p99Index] || 0;

    const errorRate = (failedRequests / totalRequests) * 100;
    const duration = (Date.now() - test.startTime) / 1000;
    const throughput = totalRequests / duration;

    const cachedRequests = requests.filter((r) => r.cached).length;
    const cacheHitRate = (cachedRequests / totalRequests) * 100;

    const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
    const costPerRequest = totalCost / totalRequests;

    // Provider distribution
    const providerCounts: Record<string, number> = {};
    requests.forEach((r) => {
      providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
    });

    const providerDistribution: Record<string, number> = {};
    Object.entries(providerCounts).forEach(([provider, count]) => {
      providerDistribution[provider] = (count / totalRequests) * 100;
    });

    // SLO violations
    const sloViolations = requests.filter((r) => r.latency > 1500).length; // 1.5s SLO

    return {
      scenario: test.scenario.name,
      duration,
      totalRequests,
      successfulRequests,
      failedRequests,
      p95Latency,
      p99Latency,
      errorRate,
      throughput,
      cacheHitRate,
      costPerRequest,
      providerDistribution,
      sloViolations,
      failoverEvents: 0, // Would be tracked separately
    };
  }

  private async triggerFailover(
    trigger: "manual" | "health_check" | "p95_breach",
    targetRegion?: string
  ): Promise<void> {
    console.log(`Triggering failover: ${trigger}`);

    switch (trigger) {
      case "manual":
        // Simulate manual failover trigger
        await this.simulateManualFailover(targetRegion);
        break;
      case "health_check":
        // Simulate health check failure
        await this.simulateHealthCheckFailure();
        break;
      case "p95_breach":
        // Simulate P95 breach
        await this.simulateP95Breach();
        break;
    }
  }

  private async simulateManualFailover(targetRegion?: string): Promise<void> {
    // This would integrate with your actual failover mechanisms
    console.log(`Manual failover to ${targetRegion || "secondary region"}`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s failover time
  }

  private async simulateHealthCheckFailure(): Promise<void> {
    console.log("Simulating health check failure");
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s detection time
  }

  private async simulateP95Breach(): Promise<void> {
    console.log("Simulating P95 breach");
    // This would trigger the adaptive router autopilot
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3s detection time
  }

  private async waitForFailoverCompletion(): Promise<number> {
    // Wait for failover to complete
    const start = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s failover
    return Date.now();
  }

  private async waitForRecovery(): Promise<void> {
    // Wait for system to recover
    await new Promise((resolve) => setTimeout(resolve, 15000)); // 15s recovery
  }

  private calculateLostRequests(
    failoverStart: number,
    failoverEnd: number
  ): number {
    // Calculate requests that would have been lost during failover
    const failoverDuration = (failoverEnd - failoverStart) / 1000;
    const estimatedRPS = 50; // Assume 50 RPS during failover
    return Math.floor(failoverDuration * estimatedRPS * 0.1); // 10% loss rate
  }

  private startMaintenanceWindow(id: string, reason: string): void {
    this.maintenanceWindows.set(id, {
      start: Date.now(),
      end: Date.now() + 60 * 60 * 1000, // 1 hour default
      reason,
    });

    console.log(`Maintenance window started: ${reason}`);
    this.emit("maintenanceWindowStarted", { id, reason });
  }

  private endMaintenanceWindow(id: string): void {
    const window = this.maintenanceWindows.get(id);
    if (window) {
      this.maintenanceWindows.delete(id);
      console.log(`Maintenance window ended: ${window.reason}`);
      this.emit("maintenanceWindowEnded", { id, reason: window.reason });
    }
  }

  isInMaintenanceWindow(): boolean {
    const now = Date.now();
    for (const window of this.maintenanceWindows.values()) {
      if (now >= window.start && now <= window.end) {
        return true;
      }
    }
    return false;
  }

  getAvailableScenarios(): string[] {
    return Object.keys(this.scenarios);
  }

  getTestStatus(): {
    activeTests: number;
    maintenanceWindows: number;
    totalRequestsProcessed: number;
  } {
    let totalRequests = 0;
    this.activeTests.forEach((test) => {
      totalRequests += test.requests.length;
    });

    return {
      activeTests: this.activeTests.size,
      maintenanceWindows: this.maintenanceWindows.size,
      totalRequestsProcessed: totalRequests,
    };
  }

  reset(): void {
    this.activeTests.clear();
    this.maintenanceWindows.clear();
  }
}

export const loadFailoverTester = new LoadFailoverTester();
