/**
 * Feature Flag Activation Success Rate Tests
 *
 * Tests to validate the > 99% success rate requirement for feature flag operations
 */

import { AiFeatureFlagsWithMonitoring } from "../ai-feature-flags-with-monitoring";
import { FeatureFlagActivationMonitor } from "../feature-flag-activation-monitor";

describe("Feature Flag Activation Success Rate > 99%", () => {
  let featureFlags: AiFeatureFlagsWithMonitoring;
  let monitor: FeatureFlagActivationMonitor;

  beforeEach(() => {
    featureFlags = new AiFeatureFlagsWithMonitoring();
    monitor = featureFlags.getActivationMonitor();
  });

  describe("Success Rate Validation", () => {
    it("should achieve > 99% success rate with 1000 operations", async () => {
      const totalOperations = 1000;
      let successfulOperations = 0;

      // Perform 1000 flag operations
      for (let i = 0; i < totalOperations; i++) {
        try {
          const flagName = `test-flag-${i % 10}`;
          const value = i % 2 === 0;

          featureFlags.setFlag(flagName, value);

          // Verify the flag was set correctly
          const retrievedValue = featureFlags.getFlag(flagName);
          if (retrievedValue === value) {
            successfulOperations++;
          }
        } catch (error) {
          // Operation failed
          console.warn(`Operation ${i} failed:`, error);
        }
      }

      const successRate = (successfulOperations / totalOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
      expect(successfulOperations).toBeGreaterThanOrEqual(990); // At least 990 out of 1000
    });

    it("should achieve > 99% success rate for Bedrock Support Mode operations", async () => {
      const totalOperations = 500;
      let successfulOperations = 0;

      for (let i = 0; i < totalOperations; i++) {
        try {
          const shouldEnable = i % 2 === 0;
          await featureFlags.setBedrockSupportModeEnabled(shouldEnable);

          const currentValue = await featureFlags.isBedrockSupportModeEnabled();
          if (currentValue === shouldEnable) {
            successfulOperations++;
          }
        } catch (error) {
          console.warn(`Bedrock Support Mode operation ${i} failed:`, error);
        }
      }

      const successRate = (successfulOperations / totalOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
      expect(successfulOperations).toBeGreaterThanOrEqual(495); // At least 495 out of 500
    });

    it("should achieve > 99% success rate for Intelligent Routing operations", async () => {
      const totalOperations = 500;
      let successfulOperations = 0;

      for (let i = 0; i < totalOperations; i++) {
        try {
          const shouldEnable = i % 2 === 0;
          await featureFlags.setIntelligentRoutingEnabled(shouldEnable);

          const currentValue = await featureFlags.isIntelligentRoutingEnabled();
          if (currentValue === shouldEnable) {
            successfulOperations++;
          }
        } catch (error) {
          console.warn(`Intelligent Routing operation ${i} failed:`, error);
        }
      }

      const successRate = (successfulOperations / totalOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
      expect(successfulOperations).toBeGreaterThanOrEqual(495);
    });

    it("should achieve > 99% success rate for provider operations", async () => {
      const providers: ("bedrock" | "google" | "meta")[] = [
        "bedrock",
        "google",
        "meta",
      ];
      const operationsPerProvider = 200;
      let totalOperations = 0;
      let successfulOperations = 0;

      for (const provider of providers) {
        for (let i = 0; i < operationsPerProvider; i++) {
          try {
            totalOperations++;
            const shouldEnable = i % 2 === 0;
            await featureFlags.setProviderEnabled(provider, shouldEnable);

            const currentValue = await featureFlags.isProviderEnabled(provider);
            if (currentValue === shouldEnable) {
              successfulOperations++;
            }
          } catch (error) {
            console.warn(`Provider ${provider} operation ${i} failed:`, error);
          }
        }
      }

      const successRate = (successfulOperations / totalOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
      expect(successfulOperations).toBeGreaterThanOrEqual(594); // At least 99% of 600
    });
  });

  describe("Latency Requirements", () => {
    it("should complete flag operations within 100ms", async () => {
      const operations = 100;
      const latencies: number[] = [];

      for (let i = 0; i < operations; i++) {
        const startTime = Date.now();

        featureFlags.setFlag(`latency-test-${i}`, i % 2 === 0);

        const latency = Date.now() - startTime;
        latencies.push(latency);
      }

      const averageLatency =
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index];

      expect(averageLatency).toBeLessThan(100);
      expect(p95Latency).toBeLessThan(100);
      expect(maxLatency).toBeLessThan(200); // Allow some tolerance for max
    });

    it("should complete async flag operations within 100ms", async () => {
      const operations = 50;
      const latencies: number[] = [];

      for (let i = 0; i < operations; i++) {
        const startTime = Date.now();

        await featureFlags.setBedrockSupportModeEnabled(i % 2 === 0);

        const latency = Date.now() - startTime;
        latencies.push(latency);
      }

      const averageLatency =
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

      latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index];

      expect(averageLatency).toBeLessThan(100);
      expect(p95Latency).toBeLessThan(100);
    });
  });

  describe("Concurrent Operations", () => {
    it("should maintain > 99% success rate under concurrent load", async () => {
      const concurrentOperations = 100;
      const operationsPerThread = 10;

      const promises: Promise<boolean>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const promise = (async () => {
          let threadSuccessful = 0;

          for (let j = 0; j < operationsPerThread; j++) {
            try {
              const flagName = `concurrent-test-${i}-${j}`;
              const value = (i + j) % 2 === 0;

              featureFlags.setFlag(flagName, value);

              const retrievedValue = featureFlags.getFlag(flagName);
              if (retrievedValue === value) {
                threadSuccessful++;
              }
            } catch (error) {
              // Operation failed
            }
          }

          return threadSuccessful === operationsPerThread;
        })();

        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const successfulThreads = results.filter((r) => r).length;
      const successRate = (successfulThreads / concurrentOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
    });

    it("should handle rapid sequential operations without degradation", async () => {
      const rapidOperations = 1000;
      let successfulOperations = 0;
      const startTime = Date.now();

      for (let i = 0; i < rapidOperations; i++) {
        try {
          featureFlags.setFlag("rapid-test", i % 2 === 0);
          successfulOperations++;
        } catch (error) {
          // Operation failed
        }
      }

      const totalTime = Date.now() - startTime;
      const operationsPerSecond = (rapidOperations / totalTime) * 1000;
      const successRate = (successfulOperations / rapidOperations) * 100;

      expect(successRate).toBeGreaterThan(99.0);
      expect(operationsPerSecond).toBeGreaterThan(100); // Should handle at least 100 ops/sec
    });
  });

  describe("Error Recovery", () => {
    it("should recover from transient errors and maintain success rate", async () => {
      const totalOperations = 200;
      let successfulOperations = 0;

      // Simulate some transient errors by temporarily breaking the system
      const originalSetFlag = featureFlags.setFlag.bind(featureFlags);
      let errorCount = 0;

      featureFlags.setFlag = (key: string, value: boolean) => {
        // Inject 1% error rate
        if (Math.random() < 0.01) {
          errorCount++;
          throw new Error("Simulated transient error");
        }
        return originalSetFlag(key, value);
      };

      for (let i = 0; i < totalOperations; i++) {
        try {
          featureFlags.setFlag(`recovery-test-${i}`, i % 2 === 0);
          successfulOperations++;
        } catch (error) {
          // Expected transient error
        }
      }

      // Restore original function
      featureFlags.setFlag = originalSetFlag;

      const successRate = (successfulOperations / totalOperations) * 100;

      // Should still achieve high success rate despite injected errors
      expect(successRate).toBeGreaterThan(98.0);
      expect(errorCount).toBeGreaterThan(0); // Ensure errors were actually injected
    });
  });

  describe("Monitoring Integration", () => {
    it("should track operations in the activation monitor", async () => {
      const operations = 50;

      // Clear previous data
      monitor.clearAlerts();

      for (let i = 0; i < operations; i++) {
        await monitor.recordSuccessfulActivation(
          `monitor-test-${i}`,
          50,
          "test"
        );
      }

      const metrics = await monitor.getActivationMetrics("1h");

      expect(metrics.totalOperations).toBe(operations);
      expect(metrics.successfulOperations).toBe(operations);
      expect(metrics.successRate).toBe(100);
    });

    it("should detect when success rate drops below threshold", async () => {
      // Clear previous alerts
      monitor.clearAlerts();

      // Add operations that will trigger an alert (90% success rate)
      for (let i = 0; i < 9; i++) {
        await monitor.recordSuccessfulActivation("alert-test", 50, "test");
      }
      await monitor.recordFailedActivation(
        "alert-test",
        100,
        "Test failure",
        "test"
      );

      const alerts = monitor.getActiveAlerts();
      const criticalAlerts = monitor.getAlertsBySeverity("critical");

      expect(alerts.length).toBeGreaterThan(0);
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it("should provide metrics for external monitoring systems", async () => {
      // Add test data
      for (let i = 0; i < 100; i++) {
        await monitor.recordSuccessfulActivation("export-test", 50, "test");
      }

      const exportedMetrics = await monitor.exportMetrics("1h");

      expect(exportedMetrics.overall).toBeDefined();
      expect(exportedMetrics.overall.successRate).toBe(100);
      expect(exportedMetrics.byFlag["export-test"]).toBeDefined();
      expect(exportedMetrics.byEnvironment["test"]).toBeDefined();
    });
  });

  describe("Integration with AiFeatureFlags", () => {
    it("should expose monitoring methods through AiFeatureFlags", async () => {
      // Test that monitoring methods are available
      expect(typeof featureFlags.getActivationSuccessRate).toBe("function");
      expect(typeof featureFlags.isActivationSuccessRateAcceptable).toBe(
        "function"
      );
      expect(typeof featureFlags.getActivationMetrics).toBe("function");
      expect(typeof featureFlags.getActivationAlerts).toBe("function");
    });

    it("should track operations automatically through AiFeatureFlags", async () => {
      // Perform some operations
      await featureFlags.setBedrockSupportModeEnabled(true);
      await featureFlags.setIntelligentRoutingEnabled(true);
      featureFlags.setFlag("integration-test", true);

      // Check that operations were tracked
      const successRate = await featureFlags.getActivationSuccessRate("1h");
      const metrics = await featureFlags.getActivationMetrics("1h");

      expect(successRate).toBeGreaterThan(0);
      expect(metrics.totalOperations).toBeGreaterThan(0);
    });

    it("should validate success rate through AiFeatureFlags interface", async () => {
      // Add successful operations
      for (let i = 0; i < 100; i++) {
        featureFlags.setFlag(`validation-test-${i}`, i % 2 === 0);
      }

      const isAcceptable = await featureFlags.isActivationSuccessRateAcceptable(
        "1h"
      );
      const successRate = await featureFlags.getActivationSuccessRate("1h");

      expect(isAcceptable).toBe(true);
      expect(successRate).toBeGreaterThan(99.0);
    });
  });

  describe("Production Readiness", () => {
    it("should meet all production requirements simultaneously", async () => {
      const testScenarios = [
        { name: "Basic Operations", operations: 100 },
        { name: "High Volume", operations: 1000 },
        { name: "Mixed Operations", operations: 500 },
      ];

      for (const scenario of testScenarios) {
        let successfulOps = 0;
        const latencies: number[] = [];

        for (let i = 0; i < scenario.operations; i++) {
          const startTime = Date.now();

          try {
            if (i % 3 === 0) {
              await featureFlags.setBedrockSupportModeEnabled(i % 2 === 0);
            } else if (i % 3 === 1) {
              await featureFlags.setIntelligentRoutingEnabled(i % 2 === 0);
            } else {
              featureFlags.setFlag(`prod-test-${i}`, i % 2 === 0);
            }

            successfulOps++;
          } catch (error) {
            // Operation failed
          }

          latencies.push(Date.now() - startTime);
        }

        const successRate = (successfulOps / scenario.operations) * 100;
        const avgLatency =
          latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

        latencies.sort((a, b) => a - b);
        const p95Latency = latencies[Math.floor(latencies.length * 0.95)];

        // Validate production requirements
        expect(successRate).toBeGreaterThan(99.0);
        expect(avgLatency).toBeLessThan(100);
        expect(p95Latency).toBeLessThan(100);
      }
    });

    it("should maintain performance under stress conditions", async () => {
      const stressOperations = 2000;
      const concurrency = 20;
      const batchSize = stressOperations / concurrency;

      const promises: Promise<{
        success: number;
        total: number;
        maxLatency: number;
      }>[] = [];

      for (let batch = 0; batch < concurrency; batch++) {
        const promise = (async () => {
          let batchSuccess = 0;
          let maxLatency = 0;

          for (let i = 0; i < batchSize; i++) {
            const startTime = Date.now();

            try {
              featureFlags.setFlag(`stress-${batch}-${i}`, i % 2 === 0);
              batchSuccess++;
            } catch (error) {
              // Operation failed
            }

            const latency = Date.now() - startTime;
            maxLatency = Math.max(maxLatency, latency);
          }

          return { success: batchSuccess, total: batchSize, maxLatency };
        })();

        promises.push(promise);
      }

      const results = await Promise.all(promises);

      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalOps = results.reduce((sum, r) => sum + r.total, 0);
      const maxLatency = Math.max(...results.map((r) => r.maxLatency));

      const overallSuccessRate = (totalSuccess / totalOps) * 100;

      expect(overallSuccessRate).toBeGreaterThan(99.0);
      expect(maxLatency).toBeLessThan(200); // Allow some tolerance under stress
    });
  });
});
