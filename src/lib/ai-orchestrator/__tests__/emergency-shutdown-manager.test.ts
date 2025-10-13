/**
 * Emergency Shutdown Manager Tests
 */

import { EmergencyShutdownManager } from "../emergency-shutdown-manager";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../circuit-breaker");

describe("EmergencyShutdownManager", () => {
  let manager: EmergencyShutdownManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new EmergencyShutdownManager({
      enableAutoShutdown: true,
      recoveryConfig: {
        autoRecoveryEnabled: false,
        recoveryDelayMs: 1000,
        healthCheckIntervalMs: 500,
        maxRecoveryAttempts: 3,
      },
    });
  });

  afterEach(() => {
    if (manager) {
      manager.cleanup();
    }
  });

  test("should trigger manual shutdown", async () => {
    const event = await manager.triggerShutdown(
      "all",
      "manual_intervention",
      "manual"
    );

    expect(event).toBeDefined();
    expect(event.scope).toBe("all");
    expect(event.reason).toBe("manual_intervention");
  });

  test("should track shutdown status", async () => {
    await manager.triggerShutdown("all", "security_incident", "manual");

    const status = manager.getStatus();
    expect(status.isShutdown).toBe(true);
    expect(status.scope).toBe("all");
  });

  test("should trigger automatic shutdown on high error rate", async () => {
    manager.updateMetrics({ errorRate: 0.15 });

    const status = manager.getStatus();
    expect(status.isShutdown).toBe(true);
    expect(status.reason).toBe("performance_degradation");
  });
});
