#!/usr/bin/env tsx

/**
 * System Stability Metrics Demo
 *
 * Demonstrates the comprehensive system stability monitoring capabilities
 * for Bedrock Support Mode.
 */

import { AiFeatureFlags } from "../src/lib/ai-orchestrator/ai-feature-flags";
import { AuditTrailSystem } from "../src/lib/ai-orchestrator/audit-trail-system";
import { SystemResourceMonitor } from "../src/lib/ai-orchestrator/system-resource-monitor";
import { SystemStabilityIntegration } from "../src/lib/ai-orchestrator/system-stability-integration";
import { SystemStabilityMetrics } from "../src/lib/ai-orchestrator/system-stability-metrics";

/**
 * Demo configuration
 */
const DEMO_CONFIG = {
  demoName: "System Stability Metrics Demo",
  duration: 60000, // 1 minute demo
  eventInterval: 5000, // Generate events every 5 seconds
  metricsInterval: 10000, // Collect metrics every 10 seconds
  showDetailedOutput: true,
};

/**
 * Console formatting utilities
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatTimestamp(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function printHeader(title: string): void {
  const border = "=".repeat(60);
  console.log(colorize(border, "cyan"));
  console.log(colorize(`  ${title}`, "bright"));
  console.log(colorize(border, "cyan"));
}

function printSection(title: string): void {
  console.log(colorize(`\n📊 ${title}`, "blue"));
  console.log(colorize("-".repeat(40), "blue"));
}

function printMetric(
  label: string,
  value: string | number,
  unit?: string
): void {
  const formattedValue = typeof value === "number" ? value.toFixed(2) : value;
  const displayValue = unit ? `${formattedValue}${unit}` : formattedValue;
  console.log(`  ${colorize(label + ":", "yellow")} ${displayValue}`);
}

function printStatus(status: string, isGood: boolean): void {
  const color = isGood ? "green" : "red";
  const icon = isGood ? "✅" : "❌";
  console.log(`  ${icon} ${colorize(status, color)}`);
}

/**
 * Demo event generator
 */
class DemoEventGenerator {
  private eventCounter = 0;
  private scenarios = [
    "normal_operation",
    "performance_degradation",
    "routing_failure",
    "recovery_success",
    "high_error_rate",
    "availability_issue",
  ];

  generateRandomEvent(): {
    type: any;
    severity: "low" | "medium" | "high" | "critical";
    component: string;
    description: string;
    impact: { availability: number; performance: number; reliability: number };
  } {
    this.eventCounter++;
    const scenario =
      this.scenarios[Math.floor(Math.random() * this.scenarios.length)];

    switch (scenario) {
      case "performance_degradation":
        return {
          type: "performance_degradation",
          severity: "medium",
          component: "PerformanceMonitor",
          description: `Performance degradation detected (Event #${this.eventCounter})`,
          impact: { availability: 0.05, performance: 0.2, reliability: 0.1 },
        };

      case "routing_failure":
        return {
          type: "routing_failure",
          severity: "high",
          component: "IntelligentRouter",
          description: `Routing failure in hybrid system (Event #${this.eventCounter})`,
          impact: { availability: 0.1, performance: 0.15, reliability: 0.2 },
        };

      case "recovery_success":
        return {
          type: "recovery_completed",
          severity: "low",
          component: "AutoRecoverySystem",
          description: `Successful recovery from previous issue (Event #${this.eventCounter})`,
          impact: { availability: 0, performance: 0, reliability: 0 },
        };

      case "high_error_rate":
        return {
          type: "failure_detected",
          severity: "critical",
          component: "BedrockSupportManager",
          description: `High error rate detected in support operations (Event #${this.eventCounter})`,
          impact: { availability: 0.2, performance: 0.1, reliability: 0.3 },
        };

      case "availability_issue":
        return {
          type: "failure_detected",
          severity: "high",
          component: "SystemAvailability",
          description: `Availability issue detected (Event #${this.eventCounter})`,
          impact: { availability: 0.3, performance: 0.05, reliability: 0.15 },
        };

      default: // normal_operation
        return {
          type: "system_start",
          severity: "low",
          component: "SystemMonitor",
          description: `Normal operation checkpoint (Event #${this.eventCounter})`,
          impact: { availability: 0, performance: 0, reliability: 0 },
        };
    }
  }
}

/**
 * Main demo function
 */
async function runSystemStabilityDemo(): Promise<void> {
  printHeader(DEMO_CONFIG.demoName);

  console.log(colorize(`🚀 Starting demo at ${formatTimestamp()}`, "green"));
  console.log(
    colorize(
      `⏱️  Demo duration: ${DEMO_CONFIG.duration / 1000} seconds`,
      "blue"
    )
  );
  console.log(
    colorize(
      `📈 Metrics collection interval: ${
        DEMO_CONFIG.metricsInterval / 1000
      } seconds`,
      "blue"
    )
  );
  console.log(
    colorize(
      `🎲 Event generation interval: ${
        DEMO_CONFIG.eventInterval / 1000
      } seconds`,
      "blue"
    )
  );

  // Initialize components
  console.log(colorize("\n🔧 Initializing components...", "yellow"));

  const featureFlags = new AiFeatureFlags();
  const auditTrail = new AuditTrailSystem();
  const resourceMonitor = new SystemResourceMonitor(featureFlags, auditTrail);

  // Initialize stability metrics with demo configuration
  const stabilityMetrics = new SystemStabilityMetrics(
    featureFlags,
    auditTrail,
    resourceMonitor,
    undefined, // No Bedrock Support Manager for demo
    undefined, // No Intelligent Router for demo
    {
      enabled: true,
      metricsCollectionIntervalMs: DEMO_CONFIG.metricsInterval,
      thresholds: {
        minAvailabilityPercent: 99.0,
        maxErrorRate: 0.05,
        minSuccessRate: 0.95,
        maxResponseTimeVariance: 0.3,
        minStabilityScore: 0.9,
      },
    }
  );

  // Initialize stability integration
  const stabilityIntegration = new SystemStabilityIntegration(
    featureFlags,
    auditTrail,
    resourceMonitor,
    undefined,
    undefined,
    {
      enabled: true,
      autoStartMonitoring: true,
      stabilityThresholds: {
        criticalStabilityScore: 0.8,
        warningStabilityScore: 0.9,
        maxAllowedErrorRate: 0.05,
        minRequiredAvailability: 99.0,
      },
      responseActions: {
        enableAutoRecovery: true,
        enablePerformanceOptimization: true,
        enableRoutingAdjustments: true,
        enableResourceScaling: false,
      },
    }
  );

  const eventGenerator = new DemoEventGenerator();

  try {
    // Start monitoring
    console.log(colorize("✅ Starting stability monitoring...", "green"));
    await stabilityMetrics.startMonitoring();
    await stabilityIntegration.initialize();

    // Demo event generation timer
    const eventTimer = setInterval(async () => {
      const event = eventGenerator.generateRandomEvent();
      await stabilityMetrics.recordEvent(event);

      if (DEMO_CONFIG.showDetailedOutput) {
        console.log(colorize(`\n🎲 Generated Event: ${event.type}`, "magenta"));
        console.log(`   Component: ${event.component}`);
        console.log(`   Severity: ${event.severity}`);
        console.log(`   Description: ${event.description}`);
      }
    }, DEMO_CONFIG.eventInterval);

    // Demo metrics display timer
    const metricsTimer = setInterval(async () => {
      await displayCurrentMetrics(stabilityMetrics, stabilityIntegration);
    }, DEMO_CONFIG.metricsInterval);

    // Run demo for specified duration
    await new Promise((resolve) => setTimeout(resolve, DEMO_CONFIG.duration));

    // Cleanup timers
    clearInterval(eventTimer);
    clearInterval(metricsTimer);

    // Final metrics display
    printSection("Final Demo Results");
    await displayFinalResults(stabilityMetrics, stabilityIntegration);
  } catch (error) {
    console.error(colorize(`❌ Demo error: ${error}`, "red"));
  } finally {
    // Cleanup
    console.log(colorize("\n🧹 Cleaning up...", "yellow"));
    await stabilityIntegration.cleanup();
    await stabilityMetrics.cleanup();
    console.log(colorize("✅ Demo completed successfully!", "green"));
  }
}

/**
 * Display current metrics
 */
async function displayCurrentMetrics(
  stabilityMetrics: SystemStabilityMetrics,
  stabilityIntegration: SystemStabilityIntegration
): Promise<void> {
  printSection(`Stability Metrics - ${formatTimestamp()}`);

  try {
    // Get current metrics
    const currentMetrics = await stabilityMetrics.getCurrentStabilityMetrics();
    const stabilitySummary = await stabilityMetrics.getStabilitySummary();
    const integrationStatus = stabilityIntegration.getStatus();

    if (currentMetrics) {
      // Uptime metrics
      console.log(colorize("\n📈 Uptime & Availability:", "cyan"));
      printMetric(
        "System Uptime",
        (currentMetrics.uptime.totalUptimeMs / 1000).toFixed(0),
        "s"
      );
      printMetric(
        "Availability",
        currentMetrics.uptime.availabilityPercent,
        "%"
      );
      printMetric("MTBF", (currentMetrics.uptime.mtbf / 1000).toFixed(0), "s");
      printMetric("MTTR", (currentMetrics.uptime.mttr / 1000).toFixed(0), "s");

      // Reliability metrics
      console.log(colorize("\n🔒 Reliability:", "cyan"));
      printMetric(
        "Success Rate",
        currentMetrics.reliability.successRate * 100,
        "%"
      );
      printMetric(
        "Error Rate",
        currentMetrics.reliability.errorRate * 100,
        "%"
      );
      printMetric("Failure Count", currentMetrics.reliability.failureCount);
      printMetric("Recovery Count", currentMetrics.reliability.recoveryCount);

      // Performance metrics
      console.log(colorize("\n⚡ Performance:", "cyan"));
      printMetric(
        "Response Time Stability",
        currentMetrics.performance.responseTimeStability * 100,
        "%"
      );
      printMetric(
        "Throughput Stability",
        currentMetrics.performance.throughputStability * 100,
        "%"
      );
      printMetric(
        "Latency Variance",
        currentMetrics.performance.latencyVariance
      );
      printMetric(
        "Degradation Events",
        currentMetrics.performance.performanceDegradationEvents
      );

      // Routing metrics
      console.log(colorize("\n🔀 Hybrid Routing:", "cyan"));
      printMetric(
        "Routing Stability",
        currentMetrics.routing.hybridRoutingStability * 100,
        "%"
      );
      printMetric("Routing Failures", currentMetrics.routing.routingFailures);
      printMetric(
        "Fallback Activations",
        currentMetrics.routing.fallbackActivations
      );
      printMetric(
        "Routing Efficiency",
        currentMetrics.routing.routingEfficiency * 100,
        "%"
      );

      // Support operations metrics
      console.log(colorize("\n🛠️  Support Operations:", "cyan"));
      printMetric(
        "Support Stability",
        currentMetrics.support.supportOperationsStability * 100,
        "%"
      );
      printMetric(
        "Support Failures",
        currentMetrics.support.supportOperationFailures
      );
      printMetric(
        "Auto-Resolution Stability",
        currentMetrics.support.autoResolutionStability * 100,
        "%"
      );
      printMetric(
        "Implementation Gap Stability",
        currentMetrics.support.implementationGapStability * 100,
        "%"
      );

      // Trends and overall score
      console.log(colorize("\n📊 Trends & Overall Score:", "cyan"));
      printMetric(
        "Stability Score",
        currentMetrics.trends.stabilityScore * 100,
        "%"
      );
      printMetric("Trend Direction", currentMetrics.trends.stabilityTrend);
      printMetric(
        "Trend Confidence",
        currentMetrics.trends.trendConfidence * 100,
        "%"
      );

      // Enhanced stability metrics
      console.log(colorize("\n🚀 Enhanced Stability Metrics:", "magenta"));
      printMetric(
        "Predictive Stability",
        currentMetrics.enhanced.predictiveStabilityScore * 100,
        "%"
      );
      printMetric(
        "Anomaly Detection",
        currentMetrics.enhanced.anomalyDetectionScore * 100,
        "%"
      );
      printMetric(
        "System Health Grade",
        currentMetrics.enhanced.systemHealthGrade
      );
      printMetric(
        "Critical Path Stability",
        currentMetrics.enhanced.criticalPathStability * 100,
        "%"
      );
      printMetric(
        "Resource Efficiency",
        currentMetrics.enhanced.resourceUtilizationEfficiency * 100,
        "%"
      );
      printMetric(
        "Adaptability Score",
        currentMetrics.enhanced.adaptabilityScore * 100,
        "%"
      );

      // System status
      console.log(colorize("\n🎯 System Status:", "cyan"));
      printStatus(
        `System Stable: ${stabilitySummary.isStable ? "YES" : "NO"}`,
        stabilitySummary.isStable
      );
      printStatus(
        `Critical Events: ${stabilitySummary.criticalEvents}`,
        stabilitySummary.criticalEvents === 0
      );
      printStatus(
        `Integration Active: ${integrationStatus.isActive ? "YES" : "NO"}`,
        integrationStatus.isActive
      );

      // Recommendations
      if (stabilitySummary.recommendations.length > 0) {
        console.log(colorize("\n💡 Recommendations:", "yellow"));
        stabilitySummary.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
    } else {
      console.log(colorize("⏳ Collecting initial metrics...", "yellow"));
    }

    // Integration response history
    const responseHistory = stabilityIntegration.getResponseHistory(3);
    if (responseHistory.length > 0) {
      console.log(colorize("\n🔧 Recent Response Actions:", "magenta"));
      responseHistory.forEach((response, index) => {
        const status = response.success ? "✅" : "❌";
        console.log(`  ${status} ${response.action}: ${response.details}`);
      });
    }
  } catch (error) {
    console.error(colorize(`❌ Error displaying metrics: ${error}`, "red"));
  }
}

/**
 * Display final demo results
 */
async function displayFinalResults(
  stabilityMetrics: SystemStabilityMetrics,
  stabilityIntegration: SystemStabilityIntegration
): Promise<void> {
  try {
    const metricsHistory = stabilityMetrics.getStabilityHistory();
    const events = stabilityMetrics.getStabilityEvents();
    const responseHistory = stabilityIntegration.getResponseHistory();
    const finalSummary = await stabilityMetrics.getStabilitySummary();

    console.log(colorize("\n📋 Demo Summary:", "bright"));
    printMetric("Total Metrics Collected", metricsHistory.length);
    printMetric("Total Events Recorded", events.length);
    printMetric("Response Actions Taken", responseHistory.length);

    if (finalSummary.current) {
      printMetric(
        "Final Stability Score",
        finalSummary.current.trends.stabilityScore * 100,
        "%"
      );
      printMetric(
        "Final Availability",
        finalSummary.current.uptime.availabilityPercent,
        "%"
      );
      printMetric(
        "Final Error Rate",
        finalSummary.current.reliability.errorRate * 100,
        "%"
      );
    }

    // Event breakdown
    console.log(colorize("\n📊 Event Breakdown:", "cyan"));
    const eventTypes = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(eventTypes).forEach(([type, count]) => {
      printMetric(type, count);
    });

    // Response action breakdown
    if (responseHistory.length > 0) {
      console.log(colorize("\n🔧 Response Action Breakdown:", "magenta"));
      const actionTypes = responseHistory.reduce((acc, response) => {
        acc[response.action] = (acc[response.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(actionTypes).forEach(([action, count]) => {
        printMetric(action, count);
      });

      const successfulActions = responseHistory.filter((r) => r.success).length;
      printMetric(
        "Success Rate",
        (successfulActions / responseHistory.length) * 100,
        "%"
      );
    }

    console.log(colorize("\n🎉 Demo completed successfully!", "green"));
    console.log(
      colorize(
        "The system stability metrics are now ready for production use.",
        "blue"
      )
    );
  } catch (error) {
    console.error(
      colorize(`❌ Error displaying final results: ${error}`, "red")
    );
  }
}

/**
 * Run the demo
 */
if (require.main === module) {
  runSystemStabilityDemo().catch((error) => {
    console.error(colorize(`❌ Demo failed: ${error}`, "red"));
    process.exit(1);
  });
}

export { runSystemStabilityDemo };
