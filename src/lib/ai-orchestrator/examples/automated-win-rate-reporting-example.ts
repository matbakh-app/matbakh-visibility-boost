/**
 * Automated Win-Rate Tracking and Reporting - Usage Examples
 *
 * This file demonstrates how to use the enhanced Win-Rate Tracker
 * with automated reporting capabilities for A/B testing and experiment monitoring.
 */

import { AiRequest, AiResponse, Provider } from "../types";
import {
  createWinRateTracker,
  ExperimentResult,
  ReportingConfig,
  WinRateTracker,
} from "../win-rate-tracker";

/**
 * Example 1: Basic Setup with Automated Reporting
 */
export function setupAutomatedWinRateTracking(): WinRateTracker {
  const reportingConfig: ReportingConfig = {
    enableDailyReports: true,
    enableWeeklyReports: true,
    enableMonthlyReports: true,
    enableRealTimeAlerts: true,
    alertThresholds: {
      winRateDropThreshold: 0.1, // Alert if win rate drops by 10%
      businessImpactThreshold: -0.05, // Alert if revenue impact < -5%
      costIncreaseThreshold: 0.2, // Alert if costs increase by 20%
    },
    reportRecipients: [
      "ai-team@matbakh.app",
      "product@matbakh.app",
      "engineering@matbakh.app",
    ],
    reportFormat: "html", // Default to HTML for better readability
  };

  const tracker = createWinRateTracker({
    winRateThreshold: 0.85, // 85% win rate target
    significanceThreshold: 0.95, // 95% confidence required
    minSampleSize: 50, // Minimum 50 comparisons for statistical significance
    reportingConfig,
  });

  // Schedule automated reporting
  tracker.scheduleAutomatedReporting();

  return tracker;
}

/**
 * Example 2: Running A/B Test with Automated Tracking
 */
export async function runABTestWithTracking(): Promise<void> {
  const tracker = setupAutomatedWinRateTracking();
  const experimentId = "claude-vs-gemini-restaurant-analysis";

  // Simulate experiment results over time
  for (let i = 0; i < 100; i++) {
    // Control group (Claude)
    const controlResult: ExperimentResult = {
      experimentId,
      variant: "control",
      provider: "bedrock" as Provider,
      modelId: "claude-3-sonnet",
      request: createMockRequest(`Restaurant analysis request ${i}`),
      response: createMockResponse(
        `Claude analysis ${i}`,
        1200 + Math.random() * 400, // 1200-1600ms latency
        0.015 + Math.random() * 0.005 // €0.015-0.020 cost
      ),
      userFeedback: 3 + Math.random() * 2, // 3-5 rating
      businessMetric: 100 + Math.random() * 50, // €100-150 revenue
      timestamp: new Date(),
    };

    // Treatment group (Gemini)
    const treatmentResult: ExperimentResult = {
      experimentId,
      variant: "treatment",
      provider: "google" as Provider,
      modelId: "gemini-pro",
      request: createMockRequest(`Restaurant analysis request ${i}`),
      response: createMockResponse(
        `Gemini analysis ${i}`,
        800 + Math.random() * 300, // 800-1100ms latency (faster)
        0.012 + Math.random() * 0.003 // €0.012-0.015 cost (cheaper)
      ),
      userFeedback: 3.5 + Math.random() * 1.5, // 3.5-5 rating (slightly better)
      businessMetric: 110 + Math.random() * 60, // €110-170 revenue (better)
      timestamp: new Date(),
    };

    // Record results
    tracker.recordResult(controlResult);
    tracker.recordResult(treatmentResult);

    // Check for alerts every 10 iterations
    if (i % 10 === 0) {
      const dailyReport = tracker.generateAutomatedReport(
        "daily",
        experimentId
      );

      // Process critical alerts
      const criticalAlerts = dailyReport.alerts.filter(
        (alert) => alert.severity === "critical"
      );
      if (criticalAlerts.length > 0) {
        console.log(
          `🚨 Critical alerts detected at iteration ${i}:`,
          criticalAlerts
        );
      }

      // Check recommendations
      const recommendations = dailyReport.recommendations;
      for (const rec of recommendations) {
        if (rec.action === "promote" && rec.confidence > 0.9) {
          console.log(
            `✅ High-confidence promotion recommendation: ${rec.reason}`
          );
        } else if (rec.action === "rollback" && rec.confidence > 0.8) {
          console.log(`❌ Rollback recommendation: ${rec.reason}`);
        }
      }
    }
  }

  // Generate final comprehensive report
  const finalReport = tracker.generateAutomatedReport(
    "experiment-complete",
    experimentId
  );

  console.log("📊 Final Experiment Report:");
  console.log(`- Total Comparisons: ${finalReport.summary.totalExperiments}`);
  console.log(`- Recommendation: ${finalReport.recommendations[0]?.action}`);
  console.log(
    `- Business Impact: ${finalReport.topPerformers[0]?.businessImpact}%`
  );

  // Export reports in different formats
  const htmlReport = tracker.exportReport(finalReport.reportId, "html");
  const jsonReport = tracker.exportReport(finalReport.reportId, "json");

  console.log("📄 Reports generated:");
  console.log(`- HTML Report: ${htmlReport.length} characters`);
  console.log(`- JSON Report: ${jsonReport.length} characters`);
}

/**
 * Example 3: Multi-Experiment Monitoring Dashboard
 */
export function createMonitoringDashboard(): {
  tracker: WinRateTracker;
  getDashboardData: () => any;
} {
  const tracker = setupAutomatedWinRateTracking();

  const getDashboardData = () => {
    const activeExperiments = tracker.getActiveExperiments();
    const recentReports = tracker.getReports().slice(0, 5);

    const dashboardData = {
      overview: {
        totalExperiments: activeExperiments.length,
        recentReports: recentReports.length,
        criticalAlerts: recentReports.reduce(
          (count, report) =>
            count +
            report.alerts.filter((alert) => alert.severity === "critical")
              .length,
          0
        ),
      },
      experiments: activeExperiments.map((expId) => {
        const summary = tracker.getExperimentSummary(expId);
        const metrics = tracker.getWinRateMetrics(expId);

        return {
          id: expId,
          status: metrics?.recommendedAction || "collecting-data",
          winRate: metrics?.treatmentWinRate || 0,
          confidence: metrics?.statisticalSignificance || 0,
          businessImpact: metrics?.businessImpact.revenueLift || 0,
          totalResults: summary?.totalResults || 0,
        };
      }),
      alerts: recentReports
        .flatMap((report) => report.alerts)
        .filter(
          (alert) => alert.severity === "high" || alert.severity === "critical"
        )
        .slice(0, 10),
      trends: recentReports.length > 0 ? recentReports[0].trends : null,
    };

    return dashboardData;
  };

  return { tracker, getDashboardData };
}

/**
 * Example 4: Automated Decision Making
 */
export function setupAutomatedDecisionMaking(tracker: WinRateTracker): void {
  // Set up automated decision making based on reports
  const checkAndActOnRecommendations = () => {
    const activeExperiments = tracker.getActiveExperiments();

    for (const experimentId of activeExperiments) {
      const metrics = tracker.getWinRateMetrics(experimentId);

      if (!metrics) continue;

      // Automatic promotion for high-confidence winners
      if (tracker.shouldPromote(experimentId)) {
        console.log(`🚀 Auto-promoting experiment ${experimentId}`);
        console.log(
          `  - Win Rate: ${(metrics.treatmentWinRate * 100).toFixed(1)}%`
        );
        console.log(
          `  - Confidence: ${(metrics.statisticalSignificance * 100).toFixed(
            1
          )}%`
        );
        console.log(
          `  - Business Impact: +${(
            metrics.businessImpact.revenueLift * 100
          ).toFixed(1)}%`
        );

        // In a real implementation, this would trigger the promotion process
        // promoteExperiment(experimentId);
      }

      // Automatic rollback for poor performers
      if (tracker.shouldRollback(experimentId)) {
        console.log(`⚠️ Auto-rolling back experiment ${experimentId}`);
        console.log(
          `  - Win Rate: ${(metrics.treatmentWinRate * 100).toFixed(1)}%`
        );
        console.log(
          `  - Business Impact: ${(
            metrics.businessImpact.revenueLift * 100
          ).toFixed(1)}%`
        );

        // In a real implementation, this would trigger the rollback process
        // rollbackExperiment(experimentId);
      }
    }
  };

  // Run automated checks every hour (in a real implementation)
  // setInterval(checkAndActOnRecommendations, 60 * 60 * 1000);

  // For demo purposes, run once
  checkAndActOnRecommendations();
}

/**
 * Example 5: Custom Alert Handling
 */
export function setupCustomAlertHandling(tracker: WinRateTracker): void {
  // Update reporting configuration for custom alerts
  tracker.updateReportingConfig({
    alertThresholds: {
      winRateDropThreshold: 0.05, // More sensitive - 5% drop
      businessImpactThreshold: -0.02, // More sensitive - 2% impact
      costIncreaseThreshold: 0.15, // Less sensitive - 15% increase
    },
    reportRecipients: ["alerts@matbakh.app", "on-call@matbakh.app"],
  });

  // Generate report with custom thresholds
  const report = tracker.generateAutomatedReport("daily");

  // Custom alert processing
  for (const alert of report.alerts) {
    switch (alert.severity) {
      case "critical":
        console.log(`🚨 CRITICAL: ${alert.message}`);
        // Send to PagerDuty, immediate notification
        break;
      case "high":
        console.log(`⚠️ HIGH: ${alert.message}`);
        // Send to Slack, email notification
        break;
      case "medium":
        console.log(`ℹ️ MEDIUM: ${alert.message}`);
        // Log to monitoring system
        break;
      case "low":
        console.log(`📝 LOW: ${alert.message}`);
        // Add to daily digest
        break;
    }
  }
}

/**
 * Helper Functions
 */
function createMockRequest(prompt: string): AiRequest {
  return {
    prompt,
    context: {
      domain: "restaurant",
      locale: "de",
      userId: "test-user",
      sessionId: "test-session",
    },
    options: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  };
}

function createMockResponse(
  text: string,
  latencyMs: number,
  costEuro: number
): AiResponse {
  return {
    text,
    latencyMs,
    costEuro,
    tokensUsed: {
      input: 100,
      output: 200,
      total: 300,
    },
    provider: "bedrock" as Provider,
    modelId: "claude-3-sonnet",
    requestId: `req-${Date.now()}`,
    timestamp: new Date(),
  };
}

/**
 * Example Usage
 */
export async function demonstrateAutomatedWinRateTracking(): Promise<void> {
  console.log("🚀 Starting Automated Win-Rate Tracking Demo");

  // 1. Setup tracking
  const tracker = setupAutomatedWinRateTracking();

  // 2. Run A/B test
  await runABTestWithTracking();

  // 3. Setup monitoring dashboard
  const { getDashboardData } = createMonitoringDashboard();
  const dashboardData = getDashboardData();
  console.log("📊 Dashboard Data:", dashboardData);

  // 4. Setup automated decision making
  setupAutomatedDecisionMaking(tracker);

  // 5. Setup custom alert handling
  setupCustomAlertHandling(tracker);

  console.log("✅ Automated Win-Rate Tracking Demo Complete");
}

// Export for use in other modules
export {
  createMonitoringDashboard,
  demonstrateAutomatedWinRateTracking,
  runABTestWithTracking,
  setupAutomatedDecisionMaking,
  setupAutomatedWinRateTracking,
  setupCustomAlertHandling,
};
