#!/usr/bin/env tsx
/**
 * Emergency Shutdown System Verification Script
 *
 * Verifies that the emergency shutdown procedures are properly implemented
 * and integrated with the hybrid routing system.
 */

import { EmergencyShutdownManager } from "../src/lib/ai-orchestrator/emergency-shutdown-manager";

interface VerificationResult {
  component: string;
  status: "pass" | "fail";
  message: string;
}

const results: VerificationResult[] = [];

function logResult(
  component: string,
  status: "pass" | "fail",
  message: string
) {
  results.push({ component, status, message });
  const icon = status === "pass" ? "✅" : "❌";
  console.log(`${icon} ${component}: ${message}`);
}

async function verifyEmergencyShutdown() {
  console.log("🔍 Verifying Emergency Shutdown System...\n");

  // Test 1: Manager Initialization
  try {
    const manager = new EmergencyShutdownManager({
      enableAutoShutdown: false,
      recoveryConfig: {
        autoRecoveryEnabled: false,
        recoveryDelayMs: 1000,
        healthCheckIntervalMs: 500,
        maxRecoveryAttempts: 3,
      },
    });
    logResult("Manager Initialization", "pass", "Manager created successfully");

    // Test 2: Manual Shutdown
    try {
      const event = await manager.triggerShutdown(
        "all",
        "manual_intervention",
        "manual",
        { test: true }
      );
      if (
        event.eventId &&
        event.scope === "all" &&
        event.reason === "manual_intervention"
      ) {
        logResult("Manual Shutdown", "pass", `Event ID: ${event.eventId}`);
      } else {
        logResult("Manual Shutdown", "fail", "Invalid event structure");
      }
    } catch (error) {
      logResult("Manual Shutdown", "fail", `Error: ${error}`);
    }

    // Test 3: Status Tracking
    try {
      const status = manager.getStatus();
      if (status.isShutdown && status.scope === "all") {
        logResult(
          "Status Tracking",
          "pass",
          "Status correctly reflects shutdown"
        );
      } else {
        logResult("Status Tracking", "fail", "Status not updated correctly");
      }
    } catch (error) {
      logResult("Status Tracking", "fail", `Error: ${error}`);
    }

    // Test 4: Shutdown History
    try {
      const history = manager.getHistory();
      if (history.length > 0) {
        logResult(
          "Shutdown History",
          "pass",
          `${history.length} events recorded`
        );
      } else {
        logResult("Shutdown History", "fail", "No events in history");
      }
    } catch (error) {
      logResult("Shutdown History", "fail", `Error: ${error}`);
    }

    // Test 5: Cleanup
    try {
      manager.cleanup();
      logResult("Cleanup", "pass", "Manager cleaned up successfully");
    } catch (error) {
      logResult("Cleanup", "fail", `Error: ${error}`);
    }
  } catch (error) {
    logResult("Manager Initialization", "fail", `Error: ${error}`);
  }

  // Test 6: Automatic Shutdown Triggers
  try {
    const autoManager = new EmergencyShutdownManager({
      enableAutoShutdown: true,
      shutdownThresholds: {
        errorRate: 0.1,
        latencyMs: 5000,
        costEuroPerHour: 100,
        consecutiveFailures: 5,
      },
      recoveryConfig: {
        autoRecoveryEnabled: false,
        recoveryDelayMs: 1000,
        healthCheckIntervalMs: 500,
        maxRecoveryAttempts: 3,
      },
    });

    // Trigger automatic shutdown via high error rate
    autoManager.updateMetrics({ errorRate: 0.15 });

    const status = autoManager.getStatus();
    if (status.isShutdown && status.triggeredBy === "automatic") {
      logResult("Automatic Shutdown", "pass", "Triggered by high error rate");
    } else {
      logResult("Automatic Shutdown", "fail", "Not triggered automatically");
    }

    autoManager.cleanup();
  } catch (error) {
    logResult("Automatic Shutdown", "fail", `Error: ${error}`);
  }

  // Test 7: Shutdown Scopes
  const scopes: Array<
    "all" | "direct_bedrock" | "mcp" | "intelligent_router" | "support_mode"
  > = ["all", "direct_bedrock", "mcp", "intelligent_router", "support_mode"];

  for (const scope of scopes) {
    try {
      const scopeManager = new EmergencyShutdownManager({
        enableAutoShutdown: false,
        recoveryConfig: {
          autoRecoveryEnabled: false,
          recoveryDelayMs: 1000,
          healthCheckIntervalMs: 500,
          maxRecoveryAttempts: 3,
        },
      });

      const event = await scopeManager.triggerShutdown(
        scope,
        "manual_intervention",
        "manual"
      );
      if (event.scope === scope) {
        logResult(
          `Shutdown Scope: ${scope}`,
          "pass",
          "Scope handled correctly"
        );
      } else {
        logResult(
          `Shutdown Scope: ${scope}`,
          "fail",
          "Scope not set correctly"
        );
      }

      scopeManager.cleanup();
    } catch (error) {
      logResult(`Shutdown Scope: ${scope}`, "fail", `Error: ${error}`);
    }
  }

  // Summary
  console.log("\n📊 Verification Summary:");
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed === 0) {
    console.log(
      "\n🎉 All emergency shutdown procedures verified successfully!"
    );
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  Some verification tests failed. Please review the results above."
    );
    process.exit(1);
  }
}

// Run verification
verifyEmergencyShutdown().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});
