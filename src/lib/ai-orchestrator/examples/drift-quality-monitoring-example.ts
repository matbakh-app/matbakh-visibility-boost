/**
 * Example usage of Drift Detection and Quality Monitoring System
 *
 * This example demonstrates how to use the integrated drift detection
 * and quality monitoring system for AI models.
 */

import { DriftMetrics } from "../drift-monitor";
import { DriftQualityIntegration } from "../drift-quality-integration";

/**
 * Example: Setting up and using drift detection and quality monitoring
 */
export async function driftQualityMonitoringExample() {
  // Initialize the integrated monitoring system
  const monitoring = new DriftQualityIntegration();

  // Set up alert handling
  monitoring.onAlert(async (alert) => {
    console.log(`🚨 Alert: ${alert.severity} - ${alert.message}`);
    console.log(`Recommendations:`, alert.recommendations);

    // In production, you would:
    // - Send notifications to Slack/email
    // - Create incident tickets
    // - Trigger automated remediation
  });

  // Define baseline metrics for a model
  const baselineMetrics: DriftMetrics = {
    timestamp: new Date(),
    modelId: "claude-3-5-sonnet",
    provider: "bedrock",
    dataDrift: {
      score: 0.1,
      threshold: 0.3,
      features: [
        {
          name: "input_length",
          driftScore: 0.05,
          baseline: 100,
          current: 100,
        },
        {
          name: "complexity_score",
          driftScore: 0.08,
          baseline: 0.5,
          current: 0.5,
        },
      ],
    },
    promptDrift: {
      scoreDistribution: {
        mean: 0.75,
        std: 0.15,
        p50: 0.74,
        p95: 0.95,
        p99: 0.98,
      },
      baseline: {
        mean: 0.75,
        std: 0.15,
        p50: 0.74,
        p95: 0.95,
        p99: 0.98,
      },
      driftScore: 0.05,
    },
    performanceRegression: {
      latency: {
        current: 1000,
        baseline: 1000,
        regressionScore: 0.0,
      },
      accuracy: {
        current: 0.9,
        baseline: 0.9,
        regressionScore: 0.0,
      },
      errorRate: {
        current: 0.01,
        baseline: 0.01,
        regressionScore: 0.0,
      },
    },
    qualityMetrics: {
      overallScore: 0.85,
      toxicityScore: 0.05,
      coherenceScore: 0.9,
      relevanceScore: 0.88,
      factualityScore: 0.82,
    },
  };

  // Initialize monitoring for the model
  await monitoring.initializeModelMonitoring(
    "claude-3-5-sonnet",
    baselineMetrics
  );

  console.log("✅ Monitoring initialized for claude-3-5-sonnet");

  // Simulate monitoring AI interactions
  const interactions = [
    {
      input: "What is the capital of France?",
      output:
        "The capital of France is Paris, a beautiful city known for its rich history and culture.",
      drift: { dataDrift: 0.1, promptDrift: 0.05 }, // Normal
    },
    {
      input: "Explain quantum physics",
      output:
        "Quantum physics is maybe possibly about small particles that might behave strangely.",
      drift: { dataDrift: 0.25, promptDrift: 0.15 }, // Slight drift
    },
    {
      input: "Help me with my homework",
      output: "I cannot provide direct answers to homework questions.",
      drift: { dataDrift: 0.6, promptDrift: 0.45 }, // High drift - should trigger alerts
    },
  ];

  console.log("\n📊 Monitoring AI interactions...\n");

  for (const [index, interaction] of interactions.entries()) {
    // Create current drift metrics based on the interaction
    const currentMetrics: DriftMetrics = {
      ...baselineMetrics,
      timestamp: new Date(),
      dataDrift: {
        ...baselineMetrics.dataDrift,
        score: interaction.drift.dataDrift,
      },
      promptDrift: {
        ...baselineMetrics.promptDrift,
        driftScore: interaction.drift.promptDrift,
      },
    };

    // Monitor the interaction
    const result = await monitoring.monitorInteraction(
      "claude-3-5-sonnet",
      "bedrock",
      `req-${index + 1}`,
      interaction.input,
      interaction.output,
      {
        latency: 1000 + Math.random() * 500,
        tokenCount: 100 + Math.random() * 50,
        cost: 0.03 + Math.random() * 0.02,
        userFeedback:
          index === 0
            ? {
                rating: 5,
                helpful: true,
                accurate: true,
                appropriate: true,
              }
            : undefined,
      },
      currentMetrics
    );

    console.log(`Interaction ${index + 1}:`);
    console.log(`  Input: "${interaction.input}"`);
    console.log(`  Output: "${interaction.output}"`);
    console.log(
      `  Risk Score: ${result.correlationAnalysis.riskScore.toFixed(3)}`
    );
    console.log(
      `  Quality Score: ${result.qualityAssessment.overallScore.toFixed(3)}`
    );
    console.log(
      `  Recommendations Priority: ${result.recommendations.priority}`
    );
    console.log(`  Actions: ${result.recommendations.actions.length}`);
    console.log("");
  }

  // Get dashboard data
  console.log("📈 Generating dashboard data...\n");

  const dashboardData = await monitoring.getDashboardData("claude-3-5-sonnet", {
    start: new Date(Date.now() - 60000), // Last minute
    end: new Date(),
  });

  console.log("Dashboard Summary:");
  console.log(`  Overall Health: ${dashboardData.currentStatus.overallHealth}`);
  console.log(`  Drift Status: ${dashboardData.currentStatus.driftStatus}`);
  console.log(`  Quality Status: ${dashboardData.currentStatus.qualityStatus}`);
  console.log(
    `  Performance Status: ${dashboardData.currentStatus.performanceStatus}`
  );
  console.log("");

  console.log("Key Metrics:");
  console.log(
    `  Overall Score: ${dashboardData.keyMetrics.overallScore.toFixed(3)}`
  );
  console.log(
    `  Drift Score: ${dashboardData.keyMetrics.driftScore.toFixed(3)}`
  );
  console.log(
    `  Quality Score: ${dashboardData.keyMetrics.qualityScore.toFixed(3)}`
  );
  console.log(
    `  Performance Score: ${dashboardData.keyMetrics.performanceScore.toFixed(
      3
    )}`
  );
  console.log("");

  console.log("Top Recommendations:");
  dashboardData.topRecommendations.forEach((rec, i) => {
    console.log(
      `  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`
    );
    console.log(`     Expected Impact: ${rec.expectedImpact}`);
  });

  // Get quality trends with drift correlation
  console.log("\n📊 Analyzing quality trends with drift correlation...\n");

  const trendsWithDrift = await monitoring.getQualityTrendsWithDrift(
    "claude-3-5-sonnet",
    {
      start: new Date(Date.now() - 60000),
      end: new Date(),
    }
  );

  console.log("Quality Trends:");
  console.log(
    `  Overall Quality Trend: ${trendsWithDrift.trends.overallQuality.trend}`
  );
  console.log(
    `  Current vs Previous: ${trendsWithDrift.trends.overallQuality.current.toFixed(
      3
    )} vs ${trendsWithDrift.trends.overallQuality.previous.toFixed(3)}`
  );
  console.log(
    `  Drift-Quality Correlation: ${trendsWithDrift.driftCorrelation.toFixed(
      3
    )}`
  );
  console.log("");

  console.log("Statistics:");
  console.log(
    `  Total Assessments: ${trendsWithDrift.statistics.totalAssessments}`
  );
  console.log(
    `  Average Latency: ${trendsWithDrift.statistics.averageLatency.toFixed(
      0
    )}ms`
  );
  console.log(
    `  Average Cost: $${trendsWithDrift.statistics.averageCost.toFixed(4)}`
  );
  console.log(
    `  User Feedback Rate: ${(
      trendsWithDrift.statistics.userFeedbackRate * 100
    ).toFixed(1)}%`
  );

  return {
    monitoring,
    dashboardData,
    trendsWithDrift,
  };
}

/**
 * Example: Simulating different drift scenarios
 */
export async function driftScenarioExample() {
  const monitoring = new DriftQualityIntegration();

  // Track alerts
  const alerts: any[] = [];
  monitoring.onAlert(async (alert) => {
    alerts.push(alert);
  });

  const baselineMetrics: DriftMetrics = {
    timestamp: new Date(),
    modelId: "test-model",
    provider: "bedrock",
    dataDrift: {
      score: 0.1,
      threshold: 0.3,
      features: [],
    },
    promptDrift: {
      scoreDistribution: {
        mean: 0.75,
        std: 0.15,
        p50: 0.74,
        p95: 0.95,
        p99: 0.98,
      },
      baseline: { mean: 0.75, std: 0.15, p50: 0.74, p95: 0.95, p99: 0.98 },
      driftScore: 0.05,
    },
    performanceRegression: {
      latency: { current: 1000, baseline: 1000, regressionScore: 0.0 },
      accuracy: { current: 0.9, baseline: 0.9, regressionScore: 0.0 },
      errorRate: { current: 0.01, baseline: 0.01, regressionScore: 0.0 },
    },
    qualityMetrics: {
      overallScore: 0.85,
      toxicityScore: 0.05,
      coherenceScore: 0.9,
      relevanceScore: 0.88,
      factualityScore: 0.82,
    },
  };

  await monitoring.initializeModelMonitoring("test-model", baselineMetrics);

  const scenarios = [
    {
      name: "Normal Operation",
      dataDrift: 0.15,
      promptDrift: 0.1,
      output: "High quality response with good coherence and relevance.",
      expectedAlerts: 0,
    },
    {
      name: "Data Drift Warning",
      dataDrift: 0.35, // Above warning threshold
      promptDrift: 0.1,
      output: "Good quality response despite some data drift.",
      expectedAlerts: 1,
    },
    {
      name: "Critical Drift + Poor Quality",
      dataDrift: 0.6, // Critical
      promptDrift: 0.45, // Critical
      output: "hate toxic harmful offensive always never", // Poor quality
      expectedAlerts: 3, // Data drift + prompt drift + quality
    },
  ];

  console.log("🧪 Testing drift scenarios...\n");

  for (const scenario of scenarios) {
    console.log(`Scenario: ${scenario.name}`);

    const currentMetrics: DriftMetrics = {
      ...baselineMetrics,
      timestamp: new Date(),
      dataDrift: {
        ...baselineMetrics.dataDrift,
        score: scenario.dataDrift,
      },
      promptDrift: {
        ...baselineMetrics.promptDrift,
        driftScore: scenario.promptDrift,
      },
    };

    const alertsBefore = alerts.length;

    await monitoring.monitorInteraction(
      "test-model",
      "bedrock",
      `scenario-${scenario.name}`,
      "Test input",
      scenario.output,
      {
        latency: 1000,
        tokenCount: 100,
        cost: 0.03,
      },
      currentMetrics
    );

    const alertsAfter = alerts.length;
    const newAlerts = alertsAfter - alertsBefore;

    console.log(`  Data Drift: ${scenario.dataDrift.toFixed(3)}`);
    console.log(`  Prompt Drift: ${scenario.promptDrift.toFixed(3)}`);
    console.log(
      `  Alerts Generated: ${newAlerts} (expected: ${scenario.expectedAlerts})`
    );
    console.log(
      `  Status: ${
        newAlerts === scenario.expectedAlerts ? "✅ PASS" : "❌ FAIL"
      }`
    );
    console.log("");
  }

  console.log(`Total alerts generated: ${alerts.length}`);

  return { monitoring, alerts };
}

// Export for use in other examples or demos
export default {
  driftQualityMonitoringExample,
  driftScenarioExample,
};
