/**
 * Kiro Bridge Communication Examples
 *
 * Demonstrates how to use the Kiro Bridge for bidirectional communication
 * between Bedrock Support Manager and Kiro with hybrid routing awareness.
 */

import { KiroBridge, KiroBridgeMessage } from "../kiro-bridge";

/**
 * Example: Basic Kiro Bridge Setup and Usage
 */
export async function basicKiroBridgeExample(): Promise<void> {
  console.log("=== Basic Kiro Bridge Example ===");

  // Initialize Kiro Bridge with custom configuration
  const kiroBridge = new KiroBridge({
    maxQueueSize: 500,
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
  });

  try {
    // Initialize the bridge
    await kiroBridge.initialize();
    console.log("✅ Kiro Bridge initialized");

    // Send a diagnostic request
    const diagnosticCorrelationId = await kiroBridge.sendDiagnosticRequest(
      "system_health",
      {
        components: ["bedrock-provider", "mcp-router", "circuit-breakers"],
        timestamp: new Date().toISOString(),
      },
      {
        priority: "high",
        routingPath: "direct_bedrock",
      }
    );

    console.log(
      `📊 Diagnostic request sent with correlation ID: ${diagnosticCorrelationId}`
    );

    // Send execution data
    const executionCorrelationId = await kiroBridge.sendExecutionData(
      "exec-001",
      "infrastructure-audit",
      "completed",
      {
        duration: 15000,
        result: {
          status: "healthy",
          score: 95,
          recommendations: ["Monitor circuit breaker recovery"],
        },
        performance: {
          latency: 4.2,
          resourceUsage: { cpu: 15, memory: 128 },
          efficiency: 92,
        },
      }
    );

    console.log(
      `🔄 Execution data sent with correlation ID: ${executionCorrelationId}`
    );

    // Get communication statistics
    const stats = kiroBridge.getStats();
    console.log("📈 Communication Statistics:", {
      messagesSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      queueSize: stats.queueSize,
      errorRate: stats.errorRate,
    });
  } finally {
    // Always shutdown gracefully
    await kiroBridge.shutdown();
    console.log("🔒 Kiro Bridge shutdown complete");
  }
}

/**
 * Example: Message Handler Registration and Processing
 */
export async function messageHandlerExample(): Promise<void> {
  console.log("=== Message Handler Example ===");

  const kiroBridge = new KiroBridge();

  try {
    await kiroBridge.initialize();

    // Register diagnostic response handler
    kiroBridge.registerMessageHandler(
      "diagnostic_response",
      async (message) => {
        console.log("📥 Received diagnostic response:", {
          correlationId: message.correlationId,
          routingPath: message.routingPath,
          payload: message.payload,
        });

        // Process diagnostic results
        if (message.payload.results) {
          const results = message.payload.results;
          console.log("🔍 Diagnostic Results:");

          for (const [component, status] of Object.entries(results)) {
            console.log(`  - ${component}: ${status}`);
          }
        }
      }
    );

    // Register execution feedback handler
    kiroBridge.registerMessageHandler("execution_feedback", async (message) => {
      console.log("💬 Received execution feedback:", {
        correlationId: message.correlationId,
        feedback: message.payload.feedback,
        recommendations: message.payload.recommendations,
      });
    });

    // Register health response handler
    kiroBridge.registerMessageHandler("health_response", async (message) => {
      console.log("❤️ Received health response:", {
        component: message.payload.component,
        status: message.payload.status,
        metrics: message.payload.metrics,
      });
    });

    // Simulate receiving messages from Kiro
    const mockDiagnosticResponse: KiroBridgeMessage = {
      id: "response-001",
      correlationId: "diag-001",
      type: "diagnostic_response",
      priority: "high",
      timestamp: new Date(),
      source: "kiro",
      destination: "bedrock",
      routingPath: "direct_bedrock",
      payload: {
        results: {
          "bedrock-provider": "healthy",
          "mcp-router": "warning",
          "circuit-breakers": "healthy",
        },
        recommendations: [
          "Monitor MCP router performance",
          "Consider increasing timeout thresholds",
        ],
      },
      metadata: {
        retryCount: 0,
        maxRetries: 3,
        timeout: 30000,
        expiresAt: new Date(Date.now() + 30000),
      },
    };

    await kiroBridge.receiveMessage(mockDiagnosticResponse);

    const mockHealthResponse: KiroBridgeMessage = {
      id: "health-001",
      correlationId: "health-check-001",
      type: "health_response",
      priority: "medium",
      timestamp: new Date(),
      source: "kiro",
      destination: "bedrock",
      routingPath: "hybrid",
      payload: {
        component: "intelligent-router",
        status: "healthy",
        metrics: {
          successRate: 98.5,
          averageLatency: 12.3,
          queueSize: 5,
        },
        lastCheck: new Date(),
      },
      metadata: {
        retryCount: 0,
        maxRetries: 3,
        timeout: 30000,
        expiresAt: new Date(Date.now() + 30000),
      },
    };

    await kiroBridge.receiveMessage(mockHealthResponse);
  } finally {
    await kiroBridge.shutdown();
  }
}

/**
 * Example: Emergency Support Communication
 */
export async function emergencySupportExample(): Promise<void> {
  console.log("=== Emergency Support Example ===");

  const kiroBridge = new KiroBridge();

  try {
    await kiroBridge.initialize();

    // Register support response handler
    kiroBridge.registerMessageHandler("support_response", async (message) => {
      console.log("🚨 Emergency support response received:", {
        correlationId: message.correlationId,
        status: message.payload.response?.status,
        result: message.payload.response?.result,
      });
    });

    // Send emergency diagnostic request
    const emergencyCorrelationId = await kiroBridge.sendDiagnosticRequest(
      "error_analysis",
      {
        errorType: "system_failure",
        affectedComponents: ["direct-bedrock-client"],
        severity: "critical",
        timestamp: new Date().toISOString(),
        context: {
          lastSuccessfulOperation: "2025-01-14T10:30:00Z",
          errorCount: 15,
          impactedUsers: 25,
        },
      },
      {
        priority: "emergency",
        routingPath: "direct_bedrock",
      }
    );

    console.log(`🚨 Emergency diagnostic sent: ${emergencyCorrelationId}`);

    // Simulate emergency response
    const emergencyResponse: KiroBridgeMessage = {
      id: "emergency-response-001",
      correlationId: emergencyCorrelationId,
      type: "support_response",
      priority: "emergency",
      timestamp: new Date(),
      source: "kiro",
      destination: "bedrock",
      routingPath: "direct_bedrock",
      payload: {
        supportType: "emergency_support",
        response: {
          status: "completed",
          result: {
            rootCause: "Circuit breaker stuck in open state",
            immediateActions: [
              "Reset circuit breaker for direct-bedrock-client",
              "Switch to MCP fallback temporarily",
              "Monitor for 5 minutes",
            ],
            estimatedRecoveryTime: "2-3 minutes",
          },
          recommendations: [
            "Implement circuit breaker health monitoring",
            "Add automatic recovery mechanisms",
            "Review circuit breaker thresholds",
          ],
          nextSteps: [
            "Execute immediate actions",
            "Monitor system recovery",
            "Schedule post-incident review",
          ],
        },
      },
      metadata: {
        retryCount: 0,
        maxRetries: 1,
        timeout: 10000,
        expiresAt: new Date(Date.now() + 10000),
      },
    };

    await kiroBridge.receiveMessage(emergencyResponse);

    console.log("✅ Emergency support workflow completed");
  } finally {
    await kiroBridge.shutdown();
  }
}

/**
 * Example: Hybrid Routing Demonstration
 */
export async function hybridRoutingExample(): Promise<void> {
  console.log("=== Hybrid Routing Example ===");

  const kiroBridge = new KiroBridge();

  try {
    await kiroBridge.initialize();

    // Emergency operation - Direct Bedrock
    await kiroBridge.sendDiagnosticRequest(
      "system_health",
      { urgency: "immediate" },
      { priority: "emergency", routingPath: "direct_bedrock" }
    );
    console.log("🔴 Emergency request routed via Direct Bedrock");

    // Critical operation - Direct Bedrock
    await kiroBridge.sendDiagnosticRequest(
      "gap_detection",
      { scope: "infrastructure" },
      { priority: "critical", routingPath: "direct_bedrock" }
    );
    console.log("🟠 Critical request routed via Direct Bedrock");

    // Standard operation - MCP
    await kiroBridge.sendExecutionData(
      "exec-standard",
      "routine-monitoring",
      "running",
      { progress: 75 }
    );
    console.log("🟡 Standard request routed via MCP (default)");

    // Background operation - MCP
    await kiroBridge.sendDiagnosticRequest(
      "performance",
      { type: "background_analysis" },
      { priority: "low", routingPath: "mcp" }
    );
    console.log("🟢 Background request routed via MCP");

    // Fallback scenario
    await kiroBridge.sendDiagnosticRequest(
      "error_analysis",
      { fallback_scenario: true },
      { priority: "medium", routingPath: "fallback" }
    );
    console.log("🔵 Fallback request routed via Fallback mechanism");

    const stats = kiroBridge.getStats();
    console.log(`📊 Total messages sent: ${stats.messagesSent}`);
  } finally {
    await kiroBridge.shutdown();
  }
}

/**
 * Example: Comprehensive Integration Test
 */
export async function comprehensiveIntegrationExample(): Promise<void> {
  console.log("=== Comprehensive Integration Example ===");

  const kiroBridge = new KiroBridge({
    maxQueueSize: 1000,
    maxRetries: 3,
    retryDelayMs: 500,
    timeoutMs: 60000,
  });

  try {
    await kiroBridge.initialize();

    // Set up comprehensive message handlers
    const messageLog: Array<{
      type: string;
      correlationId: string;
      timestamp: Date;
    }> = [];

    kiroBridge.registerMessageHandler(
      "diagnostic_response",
      async (message) => {
        messageLog.push({
          type: "diagnostic_response",
          correlationId: message.correlationId,
          timestamp: new Date(),
        });
      }
    );

    kiroBridge.registerMessageHandler("execution_feedback", async (message) => {
      messageLog.push({
        type: "execution_feedback",
        correlationId: message.correlationId,
        timestamp: new Date(),
      });
    });

    kiroBridge.registerMessageHandler("support_response", async (message) => {
      messageLog.push({
        type: "support_response",
        correlationId: message.correlationId,
        timestamp: new Date(),
      });
    });

    // Simulate a complete workflow
    console.log("🚀 Starting comprehensive workflow...");

    // 1. Infrastructure health check
    const healthCheckId = await kiroBridge.sendDiagnosticRequest(
      "system_health",
      { components: ["all"] },
      { priority: "high", routingPath: "direct_bedrock" }
    );

    // 2. Performance analysis
    const performanceId = await kiroBridge.sendDiagnosticRequest(
      "performance",
      { metrics: ["latency", "throughput", "error_rate"] },
      { priority: "medium", routingPath: "hybrid" }
    );

    // 3. Gap detection
    const gapDetectionId = await kiroBridge.sendDiagnosticRequest(
      "gap_detection",
      { scope: "implementation" },
      { priority: "medium", routingPath: "mcp" }
    );

    // 4. Send execution updates
    await kiroBridge.sendExecutionData(
      "workflow-001",
      "comprehensive-analysis",
      "running",
      { progress: 33, stage: "health_check" }
    );

    await kiroBridge.sendExecutionData(
      "workflow-001",
      "comprehensive-analysis",
      "running",
      { progress: 66, stage: "performance_analysis" }
    );

    await kiroBridge.sendExecutionData(
      "workflow-001",
      "comprehensive-analysis",
      "completed",
      {
        progress: 100,
        stage: "gap_detection",
        result: {
          healthScore: 92,
          performanceGrade: "A",
          gapsFound: 2,
          recommendations: 5,
        },
      }
    );

    // Allow processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Display final statistics
    const finalStats = kiroBridge.getStats();
    console.log("📊 Final Statistics:", {
      messagesSent: finalStats.messagesSent,
      messagesReceived: finalStats.messagesReceived,
      messagesDelivered: finalStats.messagesDelivered,
      messagesFailed: finalStats.messagesFailed,
      queueSize: finalStats.queueSize,
      errorRate: finalStats.errorRate.toFixed(3),
    });

    console.log(`📝 Message log entries: ${messageLog.length}`);
    console.log("✅ Comprehensive integration test completed");
  } finally {
    await kiroBridge.shutdown();
  }
}

/**
 * Run all examples
 */
export async function runAllKiroBridgeExamples(): Promise<void> {
  console.log("🌉 Running all Kiro Bridge examples...\n");

  try {
    await basicKiroBridgeExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await messageHandlerExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await emergencySupportExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await hybridRoutingExample();
    console.log("\n" + "=".repeat(50) + "\n");

    await comprehensiveIntegrationExample();

    console.log("\n🎉 All Kiro Bridge examples completed successfully!");
  } catch (error) {
    console.error("❌ Error running Kiro Bridge examples:", error);
    throw error;
  }
}

// Export for individual use
export {
  basicKiroBridgeExample,
  comprehensiveIntegrationExample,
  emergencySupportExample,
  hybridRoutingExample,
  messageHandlerExample,
};
