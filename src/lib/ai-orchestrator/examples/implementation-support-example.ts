/**
 * Implementation Support System Usage Examples
 *
 * This file demonstrates how to use the Implementation Support System for
 * detecting implementation gaps, generating remediation suggestions, and
 * attempting auto-resolution using direct Bedrock access.
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import {
  ImplementationGap,
  ImplementationSupport,
  ImplementationSupportConfig,
  RemediationSuggestion,
} from "../implementation-support";
import { IntelligentRouter } from "../intelligent-router";

/**
 * Example 1: Basic Implementation Support Setup
 */
export async function basicImplementationSupportSetup(): Promise<void> {
  console.log("=== Basic Implementation Support Setup ===");

  // Initialize dependencies
  const directBedrockClient = new DirectBedrockClient({
    region: "eu-central-1",
    enableHealthMonitoring: true,
    enableComplianceChecks: true,
  });

  const intelligentRouter = new IntelligentRouter(
    directBedrockClient,
    {} as any, // MCP router would be provided here
    {
      enableHealthMonitoring: true,
      routingOptimization: true,
    }
  );

  // Configure implementation support
  const config: ImplementationSupportConfig = {
    scanInterval: 600000, // 10 minutes
    autoResolutionEnabled: true,
    maxAutoResolutionAttempts: 3,
    analysisTimeout: 15000, // 15 seconds
    backlogAnalysisInterval: 3600000, // 1 hour
    enableContinuousMonitoring: true,
    riskThreshold: "medium",
    testingRequired: true,
  };

  // Create implementation support
  const implementationSupport = new ImplementationSupport(
    directBedrockClient,
    intelligentRouter,
    config
  );

  console.log("Implementation Support initialized successfully");
  console.log("Health Status:", implementationSupport.getHealthStatus());
  console.log("Initial Metrics:", implementationSupport.getMetrics());

  // Cleanup
  implementationSupport.destroy();
  intelligentRouter.destroy();
  directBedrockClient.destroy();
}

/**
 * Example 2: Detecting Implementation Gaps
 */
export async function detectImplementationGapsExample(): Promise<void> {
  console.log("=== Detecting Implementation Gaps ===");

  const implementationSupport = await createImplementationSupport();

  // Detect gaps in all modules
  console.log("Scanning all modules for implementation gaps...");
  const allGaps = await implementationSupport.detectImplementationGaps();
  console.log(`Found ${allGaps.length} implementation gaps:`);

  allGaps.forEach((gap, index) => {
    console.log(`\nGap ${index + 1}:`);
    console.log(`  ID: ${gap.gapId}`);
    console.log(`  Type: ${gap.type}`);
    console.log(`  Severity: ${gap.severity}`);
    console.log(`  Title: ${gap.title}`);
    console.log(`  Description: ${gap.description}`);
    console.log(`  Affected Modules: ${gap.affectedModules.join(", ")}`);
    console.log(`  Business Impact: ${gap.businessImpact}`);
    console.log(`  Estimated Effort: ${gap.estimatedEffort}`);
    console.log(`  Confidence: ${(gap.confidence * 100).toFixed(1)}%`);
  });

  // Detect gaps in specific modules
  console.log("\nScanning specific modules (auth, user)...");
  const specificGaps = await implementationSupport.detectImplementationGaps([
    "auth",
    "user",
  ]);
  console.log(`Found ${specificGaps.length} gaps in auth and user modules`);

  // Get gaps by severity
  const criticalGaps = implementationSupport.getGapsBySeverity("critical");
  const highGaps = implementationSupport.getGapsBySeverity("high");
  const mediumGaps = implementationSupport.getGapsBySeverity("medium");
  const lowGaps = implementationSupport.getGapsBySeverity("low");

  console.log("\nGaps by Severity:");
  console.log(`  Critical: ${criticalGaps.length}`);
  console.log(`  High: ${highGaps.length}`);
  console.log(`  Medium: ${mediumGaps.length}`);
  console.log(`  Low: ${lowGaps.length}`);

  // Cleanup
  implementationSupport.destroy();
}

/**
 * Example 3: Generating Remediation Suggestions
 */
export async function generateRemediationSuggestionsExample(): Promise<void> {
  console.log("=== Generating Remediation Suggestions ===");

  const implementationSupport = await createImplementationSupport();

  // First, detect some gaps
  const gaps = await implementationSupport.detectImplementationGaps();

  if (gaps.length === 0) {
    console.log("No gaps detected, creating a mock gap for demonstration");
    // In a real scenario, gaps would be detected from actual code analysis
    return;
  }

  // Generate suggestions for each gap
  for (const gap of gaps.slice(0, 3)) {
    // Limit to first 3 gaps
    console.log(`\n=== Generating suggestions for: ${gap.title} ===`);

    const suggestions =
      await implementationSupport.generateRemediationSuggestions(gap);

    console.log(`Generated ${suggestions.length} suggestions:`);

    suggestions.forEach((suggestion, index) => {
      console.log(`\nSuggestion ${index + 1}:`);
      console.log(`  ID: ${suggestion.suggestionId}`);
      console.log(`  Type: ${suggestion.type}`);
      console.log(`  Priority: ${suggestion.priority}`);
      console.log(`  Title: ${suggestion.title}`);
      console.log(`  Description: ${suggestion.description}`);
      console.log(`  Estimated Time: ${suggestion.estimatedTime}`);
      console.log(`  Risk Level: ${suggestion.riskLevel}`);
      console.log(`  Auto-resolvable: ${suggestion.autoResolvable}`);
      console.log(`  Testing Required: ${suggestion.testingRequired}`);

      if (suggestion.implementation.steps.length > 0) {
        console.log("  Implementation Steps:");
        suggestion.implementation.steps.forEach((step, stepIndex) => {
          console.log(`    ${stepIndex + 1}. ${step}`);
        });
      }

      if (suggestion.implementation.codeChanges) {
        console.log("  Code Changes:");
        suggestion.implementation.codeChanges.forEach((change) => {
          console.log(`    File: ${change.file}`);
          console.log(`    Explanation: ${change.explanation}`);
          console.log(`    Changes: ${change.changes.substring(0, 100)}...`);
        });
      }

      if (suggestion.rollbackPlan) {
        console.log(`  Rollback Plan: ${suggestion.rollbackPlan}`);
      }
    });
  }

  // Cleanup
  implementationSupport.destroy();
}

/**
 * Example 4: Auto-Resolution of Implementation Gaps
 */
export async function autoResolutionExample(): Promise<void> {
  console.log("=== Auto-Resolution of Implementation Gaps ===");

  const implementationSupport = await createImplementationSupport();

  // Detect gaps and generate suggestions
  const gaps = await implementationSupport.detectImplementationGaps();

  if (gaps.length === 0) {
    console.log("No gaps detected for auto-resolution demonstration");
    implementationSupport.destroy();
    return;
  }

  // Find a gap suitable for auto-resolution
  let targetGap: ImplementationGap | null = null;
  let targetSuggestions: RemediationSuggestion[] = [];

  for (const gap of gaps) {
    const suggestions =
      await implementationSupport.generateRemediationSuggestions(gap);
    const autoResolvableSuggestions = suggestions.filter(
      (s) => s.autoResolvable && s.riskLevel !== "high"
    );

    if (autoResolvableSuggestions.length > 0) {
      targetGap = gap;
      targetSuggestions = autoResolvableSuggestions;
      break;
    }
  }

  if (!targetGap || targetSuggestions.length === 0) {
    console.log("No auto-resolvable gaps found");
    implementationSupport.destroy();
    return;
  }

  console.log(`\nAttempting auto-resolution for: ${targetGap.title}`);
  console.log(`Gap ID: ${targetGap.gapId}`);
  console.log(`Severity: ${targetGap.severity}`);
  console.log(
    `Available auto-resolvable suggestions: ${targetSuggestions.length}`
  );

  // Attempt auto-resolution with the first suitable suggestion
  const suggestion = targetSuggestions[0];
  console.log(`\nUsing suggestion: ${suggestion.title}`);
  console.log(`Risk Level: ${suggestion.riskLevel}`);
  console.log(`Estimated Time: ${suggestion.estimatedTime}`);

  const resolutionResult = await implementationSupport.attemptAutoResolution(
    targetGap,
    suggestion
  );

  console.log(`\n=== Auto-Resolution Result ===`);
  console.log(`Resolution ID: ${resolutionResult.resolutionId}`);
  console.log(`Status: ${resolutionResult.status}`);
  console.log(`Started: ${resolutionResult.startedAt.toISOString()}`);
  console.log(`Completed: ${resolutionResult.completedAt.toISOString()}`);
  console.log(
    `Duration: ${
      resolutionResult.completedAt.getTime() -
      resolutionResult.startedAt.getTime()
    }ms`
  );

  if (resolutionResult.status === "success") {
    console.log("\n✅ Auto-resolution successful!");
    console.log("Applied Changes:");
    console.log(
      `  Files Modified: ${resolutionResult.appliedChanges.filesModified.length}`
    );
    console.log(
      `  Configurations Changed: ${resolutionResult.appliedChanges.configurationsChanged.length}`
    );
    console.log(
      `  Dependencies Updated: ${resolutionResult.appliedChanges.dependenciesUpdated.length}`
    );

    if (resolutionResult.validationResults.testsRun > 0) {
      console.log("Validation Results:");
      console.log(
        `  Tests Run: ${resolutionResult.validationResults.testsRun}`
      );
      console.log(
        `  Tests Passed: ${resolutionResult.validationResults.testsPassed}`
      );
      console.log(
        `  Tests Failed: ${resolutionResult.validationResults.testsFailed}`
      );
    }

    console.log(`Rollback Available: ${resolutionResult.rollbackAvailable}`);
  } else {
    console.log("\n❌ Auto-resolution failed");
    console.log(`Error: ${resolutionResult.error}`);
  }

  console.log("\nResolution Logs:");
  resolutionResult.logs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log}`);
  });

  // Cleanup
  implementationSupport.destroy();
}

/**
 * Example 5: Backlog Analysis and Sprint Planning
 */
export async function backlogAnalysisExample(): Promise<void> {
  console.log("=== Backlog Analysis and Sprint Planning ===");

  const implementationSupport = await createImplementationSupport();

  // First, detect multiple gaps to create a meaningful backlog
  await implementationSupport.detectImplementationGaps();

  // Perform comprehensive backlog analysis
  const analysis = await implementationSupport.analyzeBacklog();

  console.log(`\n=== Backlog Analysis Results ===`);
  console.log(`Analysis ID: ${analysis.analysisId}`);
  console.log(`Timestamp: ${analysis.timestamp.toISOString()}`);
  console.log(`Total Gaps: ${analysis.totalGaps}`);

  console.log("\n=== Gaps by Type ===");
  Object.entries(analysis.gapsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log("\n=== Gaps by Severity ===");
  Object.entries(analysis.gapsBySeverity).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });

  console.log("\n=== Prioritized Gaps ===");
  analysis.prioritizedGaps.slice(0, 5).forEach((gap, index) => {
    console.log(`${index + 1}. ${gap.title} (${gap.severity} - ${gap.type})`);
    console.log(`   Impact: ${gap.businessImpact}`);
    console.log(`   Effort: ${gap.estimatedEffort}`);
  });

  console.log("\n=== Suggested Sprint Planning ===");
  analysis.suggestedSprints.forEach((sprint) => {
    console.log(`\nSprint ${sprint.sprintNumber} (${sprint.duration}):`);
    console.log(`  Estimated Effort: ${sprint.estimatedEffort}`);
    console.log(`  Business Value: ${sprint.businessValue}`);
    console.log(`  Gaps: ${sprint.gaps.length} items`);
  });

  console.log("\n=== Strategic Recommendations ===");
  console.log("Immediate Actions:");
  analysis.recommendations.immediate.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action}`);
  });

  console.log("Short-term Improvements:");
  analysis.recommendations.shortTerm.forEach((improvement, index) => {
    console.log(`  ${index + 1}. ${improvement}`);
  });

  console.log("Long-term Strategic Changes:");
  analysis.recommendations.longTerm.forEach((strategy, index) => {
    console.log(`  ${index + 1}. ${strategy}`);
  });

  console.log("\n=== Risk Assessment ===");
  console.log(`High-risk Gaps: ${analysis.riskAssessment.highRiskGaps.length}`);
  console.log(`Blockers: ${analysis.riskAssessment.blockers.length}`);
  console.log(
    `Dependencies: ${
      Object.keys(analysis.riskAssessment.dependencies).length
    } items`
  );

  if (analysis.riskAssessment.highRiskGaps.length > 0) {
    console.log("High-risk Gaps:");
    analysis.riskAssessment.highRiskGaps.forEach((gapId, index) => {
      const gap = analysis.prioritizedGaps.find((g) => g.gapId === gapId);
      console.log(`  ${index + 1}. ${gap?.title || gapId}`);
    });
  }

  if (analysis.riskAssessment.blockers.length > 0) {
    console.log("Blockers:");
    analysis.riskAssessment.blockers.forEach((blocker, index) => {
      console.log(`  ${index + 1}. ${blocker}`);
    });
  }

  // Cleanup
  implementationSupport.destroy();
}

/**
 * Example 6: Continuous Monitoring and Health Tracking
 */
export async function continuousMonitoringExample(): Promise<void> {
  console.log("=== Continuous Monitoring and Health Tracking ===");

  const implementationSupport = await createImplementationSupport();

  // Monitor health status over time
  console.log("Initial Health Status:");
  let health = implementationSupport.getHealthStatus();
  console.log(`  Healthy: ${health.isHealthy}`);
  console.log(`  Total Gaps: ${health.totalGaps}`);
  console.log(`  Resolved Gaps: ${health.resolvedGaps}`);
  console.log(
    `  Resolution Rate: ${(health.resolutionRate * 100).toFixed(1)}%`
  );
  console.log(
    `  Auto-resolution Success Rate: ${(
      health.autoResolutionSuccessRate * 100
    ).toFixed(1)}%`
  );

  // Simulate some activity
  console.log("\nDetecting implementation gaps...");
  await implementationSupport.detectImplementationGaps();

  // Check updated health
  health = implementationSupport.getHealthStatus();
  console.log("\nUpdated Health Status:");
  console.log(`  Healthy: ${health.isHealthy}`);
  console.log(`  Total Gaps: ${health.totalGaps}`);
  console.log(`  Critical Gaps: ${health.criticalGaps}`);

  // Monitor metrics
  const metrics = implementationSupport.getMetrics();
  console.log("\nCurrent Metrics:");
  console.log(`  Total Gaps Detected: ${metrics.totalGapsDetected}`);
  console.log(`  Gaps Resolved: ${metrics.gapsResolved}`);
  console.log(
    `  Auto-resolutions Attempted: ${metrics.autoResolutionsAttempted}`
  );
  console.log(
    `  Auto-resolutions Successful: ${metrics.autoResolutionsSuccessful}`
  );
  console.log(`  Suggestions Generated: ${metrics.suggestionsGenerated}`);
  console.log(
    `  Average Resolution Time: ${metrics.averageResolutionTime.toFixed(0)}ms`
  );
  console.log(
    `  Backlog Analyses Performed: ${metrics.backlogAnalysesPerformed}`
  );

  // Show gap distribution
  const allGaps = implementationSupport.getDetectedGaps();
  if (allGaps.length > 0) {
    console.log("\nGap Status Distribution:");
    const statusCounts = allGaps.reduce((acc, gap) => {
      acc[gap.status] = (acc[gap.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }

  // Cleanup
  implementationSupport.destroy();
}

/**
 * Example 7: Error Handling and Edge Cases
 */
export async function errorHandlingExample(): Promise<void> {
  console.log("=== Error Handling and Edge Cases ===");

  const implementationSupport = await createImplementationSupport();

  // Test with disabled auto-resolution
  console.log("Testing with auto-resolution disabled...");
  const disabledConfig: ImplementationSupportConfig = {
    scanInterval: 60000,
    autoResolutionEnabled: false,
    maxAutoResolutionAttempts: 0,
    analysisTimeout: 5000,
    backlogAnalysisInterval: 60000,
    enableContinuousMonitoring: false,
    riskThreshold: "low",
    testingRequired: true,
  };

  const disabledSupport = await createImplementationSupport(disabledConfig);

  // Try to perform auto-resolution (should fail)
  const mockGap: ImplementationGap = {
    gapId: "test-gap",
    type: "missing_implementation",
    severity: "medium",
    title: "Test gap",
    description: "Test description",
    affectedModules: ["test"],
    detectedAt: new Date(),
    lastUpdated: new Date(),
    status: "detected",
    confidence: 0.8,
    estimatedEffort: "low",
    businessImpact: "Test impact",
    technicalDetails: {},
  };

  const mockSuggestion: RemediationSuggestion = {
    suggestionId: "test-suggestion",
    gapId: "test-gap",
    type: "code_fix",
    priority: "medium",
    title: "Test suggestion",
    description: "Test description",
    implementation: {
      steps: ["Test step"],
    },
    estimatedTime: "1 hour",
    riskLevel: "low",
    testingRequired: false,
    createdAt: new Date(),
    autoResolvable: true,
  };

  const result = await disabledSupport.attemptAutoResolution(
    mockGap,
    mockSuggestion
  );
  console.log(`Auto-resolution with disabled config: ${result.status}`);
  console.log(`Error: ${result.error}`);

  // Test with high-risk suggestion
  console.log("\nTesting with high-risk suggestion...");
  const highRiskSuggestion: RemediationSuggestion = {
    ...mockSuggestion,
    riskLevel: "high",
  };

  const highRiskResult = await implementationSupport.attemptAutoResolution(
    mockGap,
    highRiskSuggestion
  );
  console.log(`High-risk auto-resolution: ${highRiskResult.status}`);
  console.log(`Error: ${highRiskResult.error}`);

  // Test resource cleanup
  console.log("\nTesting resource cleanup...");
  implementationSupport.destroy();
  disabledSupport.destroy();
  console.log("Resources cleaned up successfully");
}

/**
 * Helper function to create a configured implementation support instance
 */
async function createImplementationSupport(
  customConfig?: Partial<ImplementationSupportConfig>
): Promise<ImplementationSupport> {
  const directBedrockClient = new DirectBedrockClient({
    region: "eu-central-1",
    enableHealthMonitoring: true,
    enableComplianceChecks: true,
  });

  const intelligentRouter = new IntelligentRouter(
    directBedrockClient,
    {} as any, // MCP router mock
    {
      enableHealthMonitoring: true,
      routingOptimization: true,
    }
  );

  const config: ImplementationSupportConfig = {
    scanInterval: 300000, // 5 minutes for examples
    autoResolutionEnabled: true,
    maxAutoResolutionAttempts: 2,
    analysisTimeout: 10000, // 10 seconds for examples
    backlogAnalysisInterval: 600000, // 10 minutes for examples
    enableContinuousMonitoring: false, // Disable for examples
    riskThreshold: "medium",
    testingRequired: false, // Disable for examples
    ...customConfig,
  };

  return new ImplementationSupport(
    directBedrockClient,
    intelligentRouter,
    config
  );
}

/**
 * Run all examples
 */
export async function runAllImplementationSupportExamples(): Promise<void> {
  console.log("🚀 Running Implementation Support Examples...\n");

  try {
    await basicImplementationSupportSetup();
    console.log("\n" + "=".repeat(50) + "\n");

    await detectImplementationGapsExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await generateRemediationSuggestionsExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await autoResolutionExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await backlogAnalysisExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await continuousMonitoringExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await errorHandlingExample();

    console.log(
      "\n✅ All Implementation Support examples completed successfully!"
    );
  } catch (error) {
    console.error("❌ Error running Implementation Support examples:", error);
  }
}

// Export individual examples for selective testing
export {
  autoResolutionExample,
  backlogAnalysisExample,
  basicImplementationSupportSetup,
  continuousMonitoringExample,
  detectImplementationGapsExample,
  errorHandlingExample,
  generateRemediationSuggestionsExample,
};
