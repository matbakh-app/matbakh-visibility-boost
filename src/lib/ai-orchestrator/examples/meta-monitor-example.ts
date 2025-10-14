/**
 * Meta Monitor Usage Examples
 *
 * This file demonstrates how to use the Meta Monitor for Kiro execution analysis,
 * pattern detection, and feedback generation using direct Bedrock access.
 */

import { DirectBedrockClient } from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import {
  KiroExecutionData,
  MetaMonitor,
  MetaMonitorConfig,
} from "../meta-monitor";

/**
 * Example 1: Basic Meta Monitor Setup
 */
export async function basicMetaMonitorSetup(): Promise<void> {
  console.log("=== Basic Meta Monitor Setup ===");

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

  // Configure meta monitor
  const config: MetaMonitorConfig = {
    analysisInterval: 300000, // 5 minutes
    failureThreshold: 3,
    performanceThreshold: 5000, // 5 seconds
    retentionPeriod: 86400000, // 24 hours
    enableRealTimeAnalysis: true,
    enablePredictiveAnalysis: true,
    maxAnalysisLatency: 15000, // 15 seconds
  };

  // Create meta monitor
  const metaMonitor = new MetaMonitor(
    directBedrockClient,
    intelligentRouter,
    config
  );

  console.log("Meta Monitor initialized successfully");
  console.log("Health Status:", metaMonitor.getHealthStatus());
  console.log("Initial Metrics:", metaMonitor.getMetrics());

  // Cleanup
  metaMonitor.destroy();
  intelligentRouter.destroy();
  directBedrockClient.destroy();
}

/**
 * Example 2: Analyzing Kiro Execution Data
 */
export async function analyzeKiroExecutionExample(): Promise<void> {
  console.log("=== Analyzing Kiro Execution Data ===");

  const metaMonitor = await createMetaMonitor();

  // Example successful execution
  const successfulExecution: KiroExecutionData = {
    executionId: "exec-success-001",
    timestamp: new Date(),
    operation: "code-generation",
    status: "success",
    latencyMs: 2500,
    context: {
      userId: "user-123",
      taskType: "component-generation",
      complexity: "medium",
      metadata: {
        linesOfCode: 150,
        componentsGenerated: 3,
      },
    },
    performance: {
      memoryUsage: 128, // MB
      cpuUsage: 45, // %
      networkLatency: 50, // ms
    },
    correlationId: "corr-success-001",
  };

  // Analyze successful execution
  const successFeedback = await metaMonitor.analyzeKiroExecution(
    successfulExecution
  );
  console.log("Success Feedback:", successFeedback);

  // Example failed execution
  const failedExecution: KiroExecutionData = {
    executionId: "exec-failure-001",
    timestamp: new Date(),
    operation: "code-analysis",
    status: "failure",
    latencyMs: 8000,
    context: {
      userId: "user-456",
      taskType: "code-review",
      complexity: "complex",
      metadata: {
        fileSize: 5000,
        analysisDepth: "deep",
      },
    },
    error: {
      type: "TimeoutError",
      message: "Analysis timed out after 8 seconds",
      code: "TIMEOUT_EXCEEDED",
      stack: "Error: Analysis timed out...",
    },
    performance: {
      memoryUsage: 512, // High memory usage
      cpuUsage: 95, // High CPU usage
      networkLatency: 200, // High network latency
    },
    correlationId: "corr-failure-001",
  };

  // Analyze failed execution
  const failureFeedback = await metaMonitor.analyzeKiroExecution(
    failedExecution
  );
  console.log("Failure Feedback:", failureFeedback);

  // Cleanup
  metaMonitor.destroy();
}

/**
 * Example 3: Pattern Detection and Analysis
 */
export async function patternDetectionExample(): Promise<void> {
  console.log("=== Pattern Detection and Analysis ===");

  const metaMonitor = await createMetaMonitor();

  // Simulate multiple similar failures
  const timeoutFailures: KiroExecutionData[] = [
    {
      executionId: "timeout-001",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      operation: "large-file-processing",
      status: "failure",
      latencyMs: 10000,
      context: { taskType: "file-analysis", complexity: "complex" },
      error: { type: "TimeoutError", message: "Processing timeout" },
      performance: { memoryUsage: 800, cpuUsage: 98 },
      correlationId: "timeout-corr-001",
    },
    {
      executionId: "timeout-002",
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
      operation: "large-file-processing",
      status: "failure",
      latencyMs: 12000,
      context: { taskType: "file-analysis", complexity: "complex" },
      error: { type: "TimeoutError", message: "Processing timeout" },
      performance: { memoryUsage: 850, cpuUsage: 99 },
      correlationId: "timeout-corr-002",
    },
    {
      executionId: "timeout-003",
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      operation: "large-file-processing",
      status: "error",
      latencyMs: 11500,
      context: { taskType: "file-analysis", complexity: "complex" },
      error: { type: "TimeoutError", message: "Processing timeout" },
      performance: { memoryUsage: 820, cpuUsage: 97 },
      correlationId: "timeout-corr-003",
    },
  ];

  // Analyze each failure to build history
  for (const failure of timeoutFailures) {
    await metaMonitor.analyzeKiroExecution(failure);
  }

  // Detect patterns
  const detectedPatterns = await metaMonitor.detectFailurePatterns();
  console.log("Detected Patterns:", detectedPatterns);

  // Generate feedback for the latest failure
  const latestFailure = timeoutFailures[timeoutFailures.length - 1];
  const feedback = await metaMonitor.generateExecutionFeedback(
    latestFailure,
    detectedPatterns
  );
  console.log("Generated Feedback:", feedback);

  // Cleanup
  metaMonitor.destroy();
}

/**
 * Example 4: Comprehensive Analysis and Recommendations
 */
export async function comprehensiveAnalysisExample(): Promise<void> {
  console.log("=== Comprehensive Analysis and Recommendations ===");

  const metaMonitor = await createMetaMonitor();

  // Simulate a mix of executions over time
  const mixedExecutions: KiroExecutionData[] = [
    // Successful executions
    ...Array.from({ length: 15 }, (_, i) => ({
      executionId: `success-${i + 1}`,
      timestamp: new Date(Date.now() - (20 - i) * 60000), // Spread over 20 minutes
      operation: "standard-analysis",
      status: "success" as const,
      latencyMs: 1000 + Math.random() * 2000,
      context: { taskType: "analysis", complexity: "medium" as const },
      performance: {
        memoryUsage: 100 + Math.random() * 50,
        cpuUsage: 30 + Math.random() * 40,
      },
      correlationId: `success-corr-${i + 1}`,
    })),
    // Some failures
    ...Array.from({ length: 3 }, (_, i) => ({
      executionId: `failure-${i + 1}`,
      timestamp: new Date(Date.now() - (10 - i * 2) * 60000),
      operation: "complex-analysis",
      status: "failure" as const,
      latencyMs: 8000 + Math.random() * 2000,
      context: { taskType: "analysis", complexity: "complex" as const },
      error: {
        type: "ResourceError",
        message: "Insufficient resources for complex analysis",
      },
      performance: {
        memoryUsage: 400 + Math.random() * 200,
        cpuUsage: 80 + Math.random() * 15,
      },
      correlationId: `failure-corr-${i + 1}`,
    })),
    // Performance issues
    ...Array.from({ length: 5 }, (_, i) => ({
      executionId: `slow-${i + 1}`,
      timestamp: new Date(Date.now() - (15 - i) * 60000),
      operation: "data-processing",
      status: "success" as const,
      latencyMs: 6000 + Math.random() * 2000, // Slow but successful
      context: { taskType: "processing", complexity: "medium" as const },
      performance: {
        memoryUsage: 200 + Math.random() * 100,
        cpuUsage: 60 + Math.random() * 20,
      },
      correlationId: `slow-corr-${i + 1}`,
    })),
  ];

  // Process all executions
  for (const execution of mixedExecutions) {
    await metaMonitor.analyzeKiroExecution(execution);
  }

  // Perform comprehensive analysis
  const analysisResult = await metaMonitor.performComprehensiveAnalysis();

  console.log("=== Analysis Results ===");
  console.log(`Analysis ID: ${analysisResult.analysisId}`);
  console.log(`Execution Count: ${analysisResult.executionCount}`);
  console.log(
    `Success Rate: ${(analysisResult.successRate * 100).toFixed(1)}%`
  );
  console.log(`Average Latency: ${analysisResult.averageLatency.toFixed(0)}ms`);
  console.log(`Health Score: ${analysisResult.healthScore}/100`);
  console.log(`Analysis Time: ${analysisResult.analysisLatencyMs}ms`);

  console.log("\n=== Detected Patterns ===");
  analysisResult.detectedPatterns.forEach((pattern, index) => {
    console.log(`Pattern ${index + 1}:`);
    console.log(`  Type: ${pattern.type}`);
    console.log(`  Severity: ${pattern.severity}`);
    console.log(
      `  Affected Operations: ${pattern.affectedOperations.join(", ")}`
    );
    console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    console.log(`  Suggested Actions: ${pattern.suggestedActions.join(", ")}`);
  });

  console.log("\n=== Generated Feedback ===");
  analysisResult.generatedFeedback.forEach((feedback, index) => {
    console.log(`Feedback ${index + 1}:`);
    console.log(`  Type: ${feedback.type}`);
    console.log(`  Priority: ${feedback.priority}`);
    console.log(`  Message: ${feedback.message}`);
    if (feedback.suggestedFix) {
      console.log(`  Suggested Fix: ${feedback.suggestedFix.description}`);
      console.log(
        `  Estimated Impact: ${feedback.suggestedFix.estimatedImpact}`
      );
    }
  });

  console.log("\n=== Recommendations ===");
  console.log("Immediate Actions:");
  analysisResult.recommendations.immediate.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action}`);
  });

  console.log("Short-term Improvements:");
  analysisResult.recommendations.shortTerm.forEach((improvement, index) => {
    console.log(`  ${index + 1}. ${improvement}`);
  });

  console.log("Long-term Strategic Changes:");
  analysisResult.recommendations.longTerm.forEach((strategy, index) => {
    console.log(`  ${index + 1}. ${strategy}`);
  });

  // Cleanup
  metaMonitor.destroy();
}

/**
 * Example 5: Real-time Monitoring and Health Checks
 */
export async function realTimeMonitoringExample(): Promise<void> {
  console.log("=== Real-time Monitoring and Health Checks ===");

  const metaMonitor = await createMetaMonitor();

  // Simulate real-time execution monitoring
  console.log("Starting real-time monitoring...");

  // Monitor health status
  const healthStatus = metaMonitor.getHealthStatus();
  console.log("Current Health Status:", healthStatus);

  // Monitor metrics
  const metrics = metaMonitor.getMetrics();
  console.log("Current Metrics:", metrics);

  // Simulate incoming execution data
  const realtimeExecution: KiroExecutionData = {
    executionId: "realtime-001",
    timestamp: new Date(),
    operation: "live-analysis",
    status: "success",
    latencyMs: 1500,
    context: {
      userId: "realtime-user",
      taskType: "live-processing",
      complexity: "medium",
    },
    performance: {
      memoryUsage: 150,
      cpuUsage: 55,
      networkLatency: 30,
    },
    correlationId: "realtime-corr-001",
  };

  // Process real-time execution
  const realtimeFeedback = await metaMonitor.analyzeKiroExecution(
    realtimeExecution
  );
  console.log("Real-time Feedback:", realtimeFeedback);

  // Check updated metrics
  const updatedMetrics = metaMonitor.getMetrics();
  console.log("Updated Metrics:", updatedMetrics);

  // Cleanup
  metaMonitor.destroy();
}

/**
 * Example 6: Error Handling and Edge Cases
 */
export async function errorHandlingExample(): Promise<void> {
  console.log("=== Error Handling and Edge Cases ===");

  const metaMonitor = await createMetaMonitor();

  // Test with malformed execution data
  const malformedExecution = {
    executionId: "malformed-001",
    // Missing required fields
    timestamp: new Date(),
    status: "unknown", // Invalid status
    correlationId: "malformed-corr-001",
  } as any;

  try {
    const feedback = await metaMonitor.analyzeKiroExecution(malformedExecution);
    console.log("Malformed execution handled gracefully:", feedback);
  } catch (error) {
    console.log("Error handling malformed execution:", error);
  }

  // Test with very large execution data
  const largeExecution: KiroExecutionData = {
    executionId: "large-001",
    timestamp: new Date(),
    operation: "massive-processing",
    status: "success",
    latencyMs: 30000, // 30 seconds
    context: {
      taskType: "bulk-processing",
      complexity: "complex",
      metadata: {
        // Large metadata object
        ...Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`field${i}`, `value${i}`])
        ),
      },
    },
    performance: {
      memoryUsage: 2048, // 2GB
      cpuUsage: 100,
      networkLatency: 1000,
    },
    correlationId: "large-corr-001",
  };

  const largeFeedback = await metaMonitor.analyzeKiroExecution(largeExecution);
  console.log(
    "Large execution processed:",
    largeFeedback.length,
    "feedback items"
  );

  // Test resource cleanup
  console.log("Testing resource cleanup...");
  metaMonitor.destroy();
  console.log("Resources cleaned up successfully");
}

/**
 * Helper function to create a configured meta monitor
 */
async function createMetaMonitor(): Promise<MetaMonitor> {
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

  const config: MetaMonitorConfig = {
    analysisInterval: 60000, // 1 minute for examples
    failureThreshold: 2, // Lower threshold for examples
    performanceThreshold: 3000, // 3 seconds
    retentionPeriod: 3600000, // 1 hour for examples
    enableRealTimeAnalysis: true,
    enablePredictiveAnalysis: true,
    maxAnalysisLatency: 10000, // 10 seconds for examples
  };

  return new MetaMonitor(directBedrockClient, intelligentRouter, config);
}

/**
 * Run all examples
 */
export async function runAllMetaMonitorExamples(): Promise<void> {
  console.log("🚀 Running Meta Monitor Examples...\n");

  try {
    await basicMetaMonitorSetup();
    console.log("\n" + "=".repeat(50) + "\n");

    await analyzeKiroExecutionExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await patternDetectionExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await comprehensiveAnalysisExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await realTimeMonitoringExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await errorHandlingExample();

    console.log("\n✅ All Meta Monitor examples completed successfully!");
  } catch (error) {
    console.error("❌ Error running Meta Monitor examples:", error);
  }
}

// Export individual examples for selective testing
export {
  analyzeKiroExecutionExample,
  basicMetaMonitorSetup,
  comprehensiveAnalysisExample,
  errorHandlingExample,
  patternDetectionExample,
  realTimeMonitoringExample,
};
