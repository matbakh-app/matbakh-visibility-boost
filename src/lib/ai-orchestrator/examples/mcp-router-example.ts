/**
 * MCP Router Usage Examples
 *
 * This file demonstrates how to use the MCP Router for hybrid Bedrock integration
 * with support mode operations, health monitoring, and Kiro bridge communication.
 */

import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";
import { IntelligentRouter } from "../intelligent-router";
import { MCPConnectionConfig, MCPRouter } from "../mcp-router";

/**
 * Example 1: Basic MCP Router Setup
 */
export async function basicMCPRouterSetup() {
  console.log("=== Basic MCP Router Setup ===");

  // Configure MCP router
  const mcpConfig: MCPConnectionConfig = {
    endpoint: "ws://localhost:8080/mcp",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    queueMaxSize: 1000,
    healthCheckInterval: 30000,
    enableCompression: true,
    enableEncryption: false,
  };

  // Create MCP router
  const mcpRouter = new MCPRouter(mcpConfig);

  // Wait for connection to establish
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check health status
  const healthStatus = await mcpRouter.getHealthStatus();
  console.log("MCP Health Status:", {
    isHealthy: healthStatus.isHealthy,
    connectionStatus: healthStatus.connectionStatus,
    latencyMs: healthStatus.latencyMs,
    queueSize: healthStatus.queueSize,
  });

  // Check availability
  console.log("MCP Available:", mcpRouter.isAvailable());

  // Cleanup
  mcpRouter.destroy();
}

/**
 * Example 2: Hybrid Routing with Intelligent Router
 */
export async function hybridRoutingExample() {
  console.log("=== Hybrid Routing Example ===");

  // Create direct Bedrock client (mock for example)
  const directBedrockClient = new DirectBedrockClient({
    region: "eu-central-1",
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    timeout: 30000,
    maxRetries: 3,
  });

  // Create MCP router
  const mcpRouter = new MCPRouter({
    endpoint: "ws://localhost:8080/mcp",
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    queueMaxSize: 500,
    healthCheckInterval: 30000,
    enableCompression: true,
    enableEncryption: false,
  });

  // Wait for MCP connection
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create intelligent router with both clients
  const intelligentRouter = new IntelligentRouter(
    directBedrockClient,
    mcpRouter
  );

  // Example operations with different routing
  const operations = [
    {
      name: "Emergency Operation (Direct Bedrock)",
      request: {
        operation: "emergency" as const,
        priority: "critical" as const,
        context: { urgency: "system_failure", impact: "high" },
        timeout: 5000,
      },
    },
    {
      name: "Infrastructure Audit (Direct Bedrock with MCP Fallback)",
      request: {
        operation: "infrastructure" as const,
        priority: "critical" as const,
        context: { auditType: "comprehensive", scope: "full_system" },
        timeout: 10000,
      },
    },
    {
      name: "Standard Analysis (MCP with Direct Fallback)",
      request: {
        operation: "standard" as const,
        priority: "medium" as const,
        context: { analysisType: "routine", depth: "standard" },
        timeout: 30000,
      },
    },
  ];

  for (const { name, request } of operations) {
    console.log(`\nExecuting: ${name}`);

    try {
      const response = await intelligentRouter.executeSupportOperation(request);
      console.log("Response:", {
        success: response.success,
        operationId: response.operationId,
        latencyMs: response.latencyMs,
        route: response.operationId.includes("mcp") ? "MCP" : "Direct",
      });
    } catch (error) {
      console.error("Operation failed:", error);
    }
  }

  // Get routing efficiency metrics
  const efficiency = intelligentRouter.getRoutingEfficiency();
  console.log("\nRouting Efficiency:", {
    totalRequests: efficiency.totalRequests,
    directUsage: efficiency.directRouteUsage,
    mcpUsage: efficiency.mcpRouteUsage,
    fallbackUsage: efficiency.fallbackUsage,
    averageLatency: efficiency.averageLatency,
    successRate: efficiency.successRate,
  });

  // Cleanup
  intelligentRouter.destroy();
  mcpRouter.destroy();
}

/**
 * Example 3: Kiro Bridge Communication
 */
export async function kiroBridgeCommunicationExample() {
  console.log("=== Kiro Bridge Communication Example ===");

  const mcpRouter = new MCPRouter({
    endpoint: "ws://localhost:8080/mcp",
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    queueMaxSize: 100,
    healthCheckInterval: 30000,
    enableCompression: false,
    enableEncryption: false,
  });

  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Send diagnostics to Kiro
  const diagnostics = {
    timestamp: new Date(),
    systemHealth: {
      overall: "good",
      components: {
        database: "healthy",
        cache: "healthy",
        ai_providers: "healthy",
      },
    },
    detectedIssues: [],
    recommendations: [
      {
        type: "optimization",
        priority: "medium",
        description: "Consider enabling response caching for frequent queries",
        estimatedImpact: "15% latency reduction",
      },
    ],
    metrics: {
      responseTime: 250,
      errorRate: 0.02,
      throughput: 150,
    },
  };

  console.log("Sending diagnostics to Kiro...");
  await mcpRouter.sendDiagnosticsToKiro(diagnostics, "diag-correlation-123");

  // Simulate receiving execution data from Kiro
  const executionData = {
    executionId: "kiro-exec-456",
    timestamp: new Date(),
    status: "completed",
    operation: "visibility_check",
    metrics: {
      duration: 2500,
      tokensUsed: 1200,
      cacheHit: false,
      success: true,
    },
    context: {
      userId: "user-789",
      businessId: "business-101",
      analysisType: "comprehensive",
    },
  };

  console.log("Processing execution data from Kiro...");
  await mcpRouter.receiveKiroExecutionData(
    executionData,
    "exec-correlation-456"
  );

  // Get MCP metrics
  const metrics = mcpRouter.getMetrics();
  console.log("MCP Metrics:", {
    totalMessages: metrics.totalMessages,
    successfulMessages: metrics.successfulMessages,
    failedMessages: metrics.failedMessages,
    averageLatency: metrics.averageLatency,
    queueSize: metrics.queueSize,
  });

  mcpRouter.destroy();
}

/**
 * Example 4: Health Monitoring and Error Handling
 */
export async function healthMonitoringExample() {
  console.log("=== Health Monitoring Example ===");

  const mcpRouter = new MCPRouter({
    endpoint: "ws://localhost:8080/mcp",
    timeout: 5000,
    maxRetries: 2,
    retryDelay: 500,
    queueMaxSize: 50,
    healthCheckInterval: 10000,
    enableCompression: false,
    enableEncryption: false,
  });

  // Monitor health status over time
  const healthChecks = [];

  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const health = await mcpRouter.getHealthStatus();
    healthChecks.push({
      check: i + 1,
      timestamp: new Date(),
      isHealthy: health.isHealthy,
      connectionStatus: health.connectionStatus,
      latencyMs: health.latencyMs,
      errorRate: health.errorRate,
      queueSize: health.queueSize,
      pendingOperations: health.pendingOperations,
    });

    console.log(`Health Check ${i + 1}:`, healthChecks[i]);
  }

  // Test error handling
  console.log("\nTesting error scenarios...");

  // Test with invalid operation
  try {
    const invalidRequest: SupportOperationRequest = {
      operation: "invalid_operation" as any,
      priority: "medium",
      context: { test: "error" },
      timeout: 5000,
    };

    const response = await mcpRouter.executeSupportOperation(invalidRequest);
    console.log("Invalid operation response:", {
      success: response.success,
      error: response.error,
    });
  } catch (error) {
    console.log("Caught error:", error);
  }

  // Test timeout scenario
  try {
    const timeoutRequest: SupportOperationRequest = {
      operation: "infrastructure",
      priority: "high",
      context: { test: "timeout" },
      timeout: 1, // Very short timeout
    };

    const response = await mcpRouter.executeSupportOperation(timeoutRequest);
    console.log("Timeout response:", {
      success: response.success,
      error: response.error,
    });
  } catch (error) {
    console.log("Timeout error:", error);
  }

  mcpRouter.destroy();
}

/**
 * Example 5: Message Queuing and High Load Handling
 */
export async function messageQueuingExample() {
  console.log("=== Message Queuing Example ===");

  const mcpRouter = new MCPRouter({
    endpoint: "ws://localhost:8080/mcp",
    timeout: 10000,
    maxRetries: 1,
    retryDelay: 200,
    queueMaxSize: 20, // Small queue for demonstration
    healthCheckInterval: 5000,
    enableCompression: false,
    enableEncryption: false,
  });

  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate high load
  console.log("Generating high load with 25 concurrent operations...");

  const operations = Array.from({ length: 25 }, (_, i) => ({
    operation: "standard" as const,
    priority: "medium" as const,
    context: {
      batchId: "batch-001",
      operationIndex: i,
      timestamp: new Date(),
    },
    timeout: 30000,
  }));

  const startTime = Date.now();

  const promises = operations.map(async (request, index) => {
    try {
      const response = await mcpRouter.executeSupportOperation(request);
      return {
        index,
        success: response.success,
        latencyMs: response.latencyMs,
        operationId: response.operationId,
        error: response.error,
      };
    } catch (error) {
      return {
        index,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  const results = await Promise.allSettled(promises);
  const totalTime = Date.now() - startTime;

  // Analyze results
  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;

  const failed = results.length - successful;

  console.log("High Load Test Results:", {
    totalOperations: operations.length,
    successful,
    failed,
    successRate: (successful / operations.length) * 100,
    totalTimeMs: totalTime,
    averageLatency: totalTime / operations.length,
  });

  // Show queue overflow handling
  const metrics = mcpRouter.getMetrics();
  console.log("Queue Metrics:", {
    queueOverflows: metrics.queueOverflows,
    totalMessages: metrics.totalMessages,
    successfulMessages: metrics.successfulMessages,
    failedMessages: metrics.failedMessages,
  });

  mcpRouter.destroy();
}

/**
 * Run all examples
 */
export async function runAllMCPExamples() {
  console.log("🚀 Running MCP Router Examples\n");

  try {
    await basicMCPRouterSetup();
    console.log("\n" + "=".repeat(50) + "\n");

    await hybridRoutingExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await kiroBridgeCommunicationExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await healthMonitoringExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await messageQueuingExample();

    console.log("\n✅ All MCP Router examples completed successfully!");
  } catch (error) {
    console.error("❌ Example execution failed:", error);
  }
}

// Export individual examples for selective usage
export {
  basicMCPRouterSetup,
  healthMonitoringExample,
  hybridRoutingExample,
  kiroBridgeCommunicationExample,
  messageQueuingExample,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllMCPExamples().catch(console.error);
}
