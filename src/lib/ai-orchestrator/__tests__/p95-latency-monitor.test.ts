/**
 * P95 Latency Monitor Tests
 *
 * Tests for P95 latency targets:
 * - Generation: ≤ 1.5s (1500ms)
 * - RAG only/cached: ≤ 300ms
 */

import { P95LatencyMonitor } from "../p95-latency-monitor";

describe("P95LatencyMonitor", () => {
  let monitor: P95LatencyMonitor;

  beforeEach(() => {
    monitor = new P95LatencyMonitor();
    monitor.reset();
  });

  afterEach(() => {
    monitor.removeAllListeners();
  });

  describe("Basic Functionality", () => {
    it("should initialize with empty metrics", () => {
      const status = monitor.getPerformanceStatus();

      expect(status.p95Latencies.generation).toBe(0);
      expect(status.p95Latencies.rag).toBe(0);
      expect(status.p95Latencies.cached).toBe(0);
      expect(status.activeRequests).toBe(0);
      expect(status.performanceGrade).toBe("A"); // No requests = perfect score
    });

    it("should record request start and completion", () => {
      const requestId = "test-request-1";

      monitor.recordRequestStart(requestId, "generation");
      expect(monitor.getPerformanceStatus().activeRequests).toBe(1);

      monitor.recordRequestComplete(
        requestId,
        "bedrock",
        "claude-3",
        false,
        100,
        0.01
      );
      expect(monitor.getPerformanceStatus().activeRequests).toBe(0);
    });
  });

  describe("P95 Latency Calculation", () => {
    it("should calculate P95 latency correctly for generation operations", () => {
      // Generate 100 requests with varying latencies
      const latencies = Array.from({ length: 100 }, (_, i) => 100 + i * 10); // 100ms to 1090ms

      latencies.forEach((latency, index) => {
        const requestId = `gen-${index}`;
        monitor.recordRequestStart(requestId, "generation");

        // Simulate the latency by recording a metric directly
        monitor.recordMetric({
          requestId,
          operation: "generation",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
          modelId: "claude-3",
        });
      });

      const p95Latency = monitor.getP95Latency("generation");

      // P95 of 100 values should be around the 95th percentile
      expect(p95Latency).toBeGreaterThan(1000);
      expect(p95Latency).toBeLessThan(1100);
    });

    it("should meet P95 target for generation operations under 1.5s", () => {
      // Generate requests that meet the 1.5s target
      const latencies = Array.from(
        { length: 100 },
        () => Math.random() * 1400 + 100
      ); // 100ms to 1500ms

      latencies.forEach((latency, index) => {
        monitor.recordMetric({
          requestId: `gen-${index}`,
          operation: "generation",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
        });
      });

      const status = monitor.getPerformanceStatus();
      expect(status.p95Latencies.generation).toBeLessThanOrEqual(1500);
      expect(status.targetsStatus.generation).toBe(true);
    });

    it("should meet P95 target for RAG operations under 300ms", () => {
      // Generate requests that meet the 300ms target
      const latencies = Array.from(
        { length: 100 },
        () => Math.random() * 250 + 50
      ); // 50ms to 300ms

      latencies.forEach((latency, index) => {
        monitor.recordMetric({
          requestId: `rag-${index}`,
          operation: "rag",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
        });
      });

      const status = monitor.getPerformanceStatus();
      expect(status.p95Latencies.rag).toBeLessThanOrEqual(300);
      expect(status.targetsStatus.rag).toBe(true);
    });

    it("should meet P95 target for cached operations under 300ms", () => {
      // Generate requests that meet the 300ms target (cached should be even faster)
      const latencies = Array.from(
        { length: 100 },
        () => Math.random() * 100 + 10
      ); // 10ms to 110ms

      latencies.forEach((latency, index) => {
        monitor.recordMetric({
          requestId: `cached-${index}`,
          operation: "cached",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
          cacheHit: true,
        });
      });

      const status = monitor.getPerformanceStatus();
      expect(status.p95Latencies.cached).toBeLessThanOrEqual(300);
      expect(status.targetsStatus.cached).toBe(true);
    });
  });

  describe("Cache Hit Rate Monitoring", () => {
    it("should calculate cache hit rate correctly", () => {
      // Record 80 cache hits and 20 misses
      for (let i = 0; i < 80; i++) {
        monitor.recordMetric({
          requestId: `hit-${i}`,
          operation: "cached",
          latency: 50,
          timestamp: Date.now(),
          cacheHit: true,
        });
      }

      for (let i = 0; i < 20; i++) {
        monitor.recordMetric({
          requestId: `miss-${i}`,
          operation: "cached",
          latency: 200,
          timestamp: Date.now(),
          cacheHit: false,
        });
      }

      const cacheHitRate = monitor.getCacheHitRate();
      expect(cacheHitRate).toBe(80);
    });

    it("should meet cache hit rate target of 80%", () => {
      // Record 85 cache hits and 15 misses (85% hit rate)
      for (let i = 0; i < 85; i++) {
        monitor.recordMetric({
          requestId: `hit-${i}`,
          operation: "rag",
          latency: 100,
          timestamp: Date.now(),
          cacheHit: true,
        });
      }

      for (let i = 0; i < 15; i++) {
        monitor.recordMetric({
          requestId: `miss-${i}`,
          operation: "rag",
          latency: 250,
          timestamp: Date.now(),
          cacheHit: false,
        });
      }

      const status = monitor.getPerformanceStatus();
      expect(status.cacheHitRate).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Alert System", () => {
    it("should generate alert for P95 breach", (done) => {
      monitor.on("alert", (alert) => {
        expect(alert.type).toBe("p95_breach");
        expect(alert.operation).toBe("generation");
        expect(alert.currentValue).toBeGreaterThan(1500);
        expect(alert.severity).toBe("warning");
        done();
      });

      // Generate requests that exceed the 1.5s target
      const latencies = Array.from(
        { length: 100 },
        () => Math.random() * 1000 + 1600
      ); // 1600ms to 2600ms

      latencies.forEach((latency, index) => {
        monitor.recordMetric({
          requestId: `slow-${index}`,
          operation: "generation",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
        });
      });

      // Trigger periodic check manually
      (monitor as any).checkP95Targets();
    });

    it("should generate critical alert for severe P95 breach", (done) => {
      monitor.on("alert", (alert) => {
        expect(alert.type).toBe("p95_breach");
        expect(alert.severity).toBe("critical");
        done();
      });

      // Generate requests that severely exceed the target (>1.5x)
      const latencies = Array.from(
        { length: 100 },
        () => Math.random() * 1000 + 2500
      ); // 2500ms to 3500ms

      latencies.forEach((latency, index) => {
        monitor.recordMetric({
          requestId: `very-slow-${index}`,
          operation: "generation",
          latency,
          timestamp: Date.now(),
          provider: "bedrock",
        });
      });

      (monitor as any).checkP95Targets();
    });

    it("should generate alert for latency spike", (done) => {
      monitor.on("alert", (alert) => {
        expect(alert.type).toBe("latency_spike");
        expect(alert.currentValue).toBeGreaterThan(3000); // 2x the 1500ms target
        expect(alert.severity).toBe("critical");
        done();
      });

      // Record a single very slow request (spike)
      monitor.recordMetric({
        requestId: "spike-request",
        operation: "generation",
        latency: 3500, // Much higher than 1500ms target
        timestamp: Date.now(),
        provider: "bedrock",
      });
    });

    it("should generate alert for low cache hit rate", (done) => {
      monitor.on("alert", (alert) => {
        expect(alert.type).toBe("cache_miss_rate");
        expect(alert.currentValue).toBeLessThan(80);
        done();
      });

      // Record low cache hit rate (30%)
      for (let i = 0; i < 30; i++) {
        monitor.recordMetric({
          requestId: `hit-${i}`,
          operation: "cached",
          latency: 50,
          timestamp: Date.now(),
          cacheHit: true,
        });
      }

      for (let i = 0; i < 70; i++) {
        monitor.recordMetric({
          requestId: `miss-${i}`,
          operation: "cached",
          latency: 200,
          timestamp: Date.now(),
          cacheHit: false,
        });
      }

      (monitor as any).checkCacheHitRate();
    });
  });

  describe("Performance Grading", () => {
    it("should assign grade A for excellent performance", () => {
      // Perfect performance: all targets met, high cache hit rate
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric({
          requestId: `perfect-${i}`,
          operation: "generation",
          latency: Math.random() * 1000 + 500, // 500ms to 1500ms
          timestamp: Date.now(),
          cacheHit: Math.random() > 0.1, // 90% cache hit rate
        });
      }

      const status = monitor.getPerformanceStatus();
      expect(status.performanceGrade).toBe("A");
    });

    it("should assign grade F for poor performance", () => {
      // Poor performance: all targets missed, low cache hit rate
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric({
          requestId: `poor-${i}`,
          operation: "generation",
          latency: Math.random() * 2000 + 2000, // 2000ms to 4000ms (exceeds 1500ms target)
          timestamp: Date.now(),
          cacheHit: Math.random() > 0.8, // 20% cache hit rate
        });
      }

      const status = monitor.getPerformanceStatus();
      expect(status.performanceGrade).toBe("F");
    });
  });

  describe("Provider Comparison", () => {
    it("should compare provider performance", () => {
      // Record metrics for different providers
      const providers = ["bedrock", "google", "meta"];

      providers.forEach((provider, providerIndex) => {
        for (let i = 0; i < 50; i++) {
          monitor.recordMetric({
            requestId: `${provider}-${i}`,
            operation: "generation",
            latency: Math.random() * 500 + providerIndex * 300 + 500, // Different performance per provider
            timestamp: Date.now(),
            provider,
          });
        }
      });

      const comparison = monitor.getProviderComparison();

      expect(Object.keys(comparison)).toHaveLength(3);
      expect(comparison.bedrock).toBeDefined();
      expect(comparison.google).toBeDefined();
      expect(comparison.meta).toBeDefined();

      // Bedrock should be fastest (lowest latency)
      expect(comparison.bedrock.averageLatency).toBeLessThan(
        comparison.google.averageLatency
      );
      expect(comparison.google.averageLatency).toBeLessThan(
        comparison.meta.averageLatency
      );
    });
  });

  describe("Performance Report", () => {
    it("should generate comprehensive performance report", () => {
      // Generate mixed workload
      const operations: Array<"generation" | "rag" | "cached"> = [
        "generation",
        "rag",
        "cached",
      ];

      operations.forEach((operation) => {
        const targetLatency = operation === "generation" ? 1200 : 200;

        for (let i = 0; i < 30; i++) {
          monitor.recordMetric({
            requestId: `${operation}-${i}`,
            operation,
            latency: Math.random() * 200 + targetLatency,
            timestamp: Date.now(),
            provider: "bedrock",
            cost: Math.random() * 0.01,
            cacheHit: Math.random() > 0.2, // 80% cache hit rate
          });
        }
      });

      const report = monitor.getPerformanceReport();

      expect(report.status).toBeDefined();
      expect(report.averageLatencies).toBeDefined();
      expect(report.maxLatencies).toBeDefined();
      expect(report.requestCounts).toBeDefined();
      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.recentAlerts).toBeDefined();

      // Verify all operations have metrics
      expect(report.requestCounts.generation).toBe(30);
      expect(report.requestCounts.rag).toBe(30);
      expect(report.requestCounts.cached).toBe(30);
    });
  });

  describe("Time Window Filtering", () => {
    it("should filter metrics by time window", () => {
      const now = Date.now();

      // Record old metrics (outside time window)
      monitor.recordMetric({
        requestId: "old-request",
        operation: "generation",
        latency: 2000,
        timestamp: now - 600000, // 10 minutes ago
      });

      // Record recent metrics (within time window)
      monitor.recordMetric({
        requestId: "recent-request",
        operation: "generation",
        latency: 1000,
        timestamp: now,
      });

      // P95 calculation should only consider recent metrics
      const p95Latency = monitor.getP95Latency("generation", 300000); // 5 minute window
      expect(p95Latency).toBe(1000); // Should only see the recent request
    });
  });

  describe("Load Testing Scenarios", () => {
    it("should handle high request volume", () => {
      const startTime = Date.now();

      // Simulate 1000 concurrent requests
      for (let i = 0; i < 1000; i++) {
        const requestId = `load-${i}`;
        const operation = ["generation", "rag", "cached"][i % 3] as
          | "generation"
          | "rag"
          | "cached";
        const latency = Math.random() * 1000 + 100;

        monitor.recordRequestStart(requestId, operation);
        monitor.recordRequestComplete(
          requestId,
          "bedrock",
          "claude-3",
          Math.random() > 0.2
        );
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 1000 requests quickly
      expect(processingTime).toBeLessThan(1000); // Less than 1 second

      const status = monitor.getPerformanceStatus();
      expect(status.activeRequests).toBe(0); // All requests completed
    });

    it("should maintain P95 targets under load", () => {
      // Simulate realistic load with mixed operations
      const operations: Array<"generation" | "rag" | "cached"> = [
        "generation",
        "rag",
        "cached",
      ];

      operations.forEach((operation) => {
        const targetLatency = operation === "generation" ? 1200 : 250;

        for (let i = 0; i < 500; i++) {
          monitor.recordMetric({
            requestId: `load-${operation}-${i}`,
            operation,
            latency: Math.random() * 300 + targetLatency,
            timestamp: Date.now(),
            provider: "bedrock",
            cacheHit: operation !== "generation" && Math.random() > 0.2,
          });
        }
      });

      const status = monitor.getPerformanceStatus();

      // All targets should still be met under load
      expect(status.targetsStatus.generation).toBe(true);
      expect(status.targetsStatus.rag).toBe(true);
      expect(status.targetsStatus.cached).toBe(true);
      expect(status.cacheHitRate).toBeGreaterThanOrEqual(60); // Reasonable cache hit rate under load
    });
  });
});
