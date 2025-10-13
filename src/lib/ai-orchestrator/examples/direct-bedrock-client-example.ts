/**
 * Direct Bedrock Client Usage Examples
 *
 * This file demonstrates how to use the DirectBedrockClient for various
 * support operations with different latency requirements and configurations.
 */

import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "../direct-bedrock-client";

/**
 * Example 1: Emergency Operation (< 5s latency)
 *
 * Use case: System is down, need immediate diagnostic response
 */
export async function emergencySystemDiagnostic() {
  const client = new DirectBedrockClient({
    region: "eu-central-1",
    emergencyTimeout: 4000, // 4s timeout for emergency
    enableHealthMonitoring: true,
  });

  try {
    const response = await client.executeEmergencyOperation(
      "EMERGENCY: Main database connection lost. All user requests failing. Need immediate diagnostic steps.",
      {
        correlationId: "emergency-db-001",
        metadata: {
          severity: "critical",
          affectedSystems: ["database", "api", "frontend"],
        },
      }
    );

    if (response.success) {
      console.log("Emergency Response:", response.text);
      console.log("Response Time:", response.latencyMs, "ms");

      // Execute any tool calls if provided
      if (response.toolCalls?.length) {
        console.log("Recommended Actions:", response.toolCalls);
      }
    } else {
      console.error("Emergency operation failed:", response.error);
    }
  } finally {
    client.destroy();
  }
}

/**
 * Example 2: Critical Infrastructure Analysis (< 10s latency)
 *
 * Use case: Infrastructure audit detected issues, need detailed analysis
 */
export async function criticalInfrastructureAnalysis() {
  const client = new DirectBedrockClient({
    region: "eu-central-1",
    criticalTimeout: 8000, // 8s timeout for critical operations
    enableComplianceChecks: true,
  });

  const tools = [
    {
      name: "analyze_system_health",
      description: "Analyze system health metrics and identify issues",
      parameters: {
        system: { type: "string", description: "System to analyze" },
        metrics: { type: "array", description: "Metrics to check" },
      },
    },
    {
      name: "generate_remediation_plan",
      description: "Generate step-by-step remediation plan",
      parameters: {
        issues: { type: "array", description: "List of identified issues" },
        priority: { type: "string", description: "Priority level" },
      },
    },
  ];

  try {
    const response = await client.executeCriticalOperation(
      "Infrastructure audit detected high memory usage (>90%) and increased error rates (>5%) in the AI orchestrator service. Analyze the situation and provide remediation steps.",
      {
        userId: "system-admin",
        tenant: "matbakh-production",
        correlationId: "infra-audit-2024-001",
      },
      tools
    );

    if (response.success) {
      console.log("Analysis Result:", response.text);

      // Process tool calls for automated remediation
      if (response.toolCalls?.length) {
        for (const toolCall of response.toolCalls) {
          console.log(`Tool: ${toolCall.name}`);
          console.log(`Arguments:`, toolCall.arguments);

          // In a real implementation, you would execute these tool calls
          // await executeToolCall(toolCall);
        }
      }
    }
  } finally {
    client.destroy();
  }
}

/**
 * Example 3: Meta-Monitoring of Kiro Execution
 *
 * Use case: Monitor Kiro's performance and provide feedback
 */
export async function metaMonitoringExample() {
  const client = new DirectBedrockClient({
    region: "eu-central-1",
    enableHealthMonitoring: true,
    enableCircuitBreaker: true,
  });

  const request: SupportOperationRequest = {
    operation: "meta_monitor",
    priority: "high",
    prompt: `Analyze the following Kiro execution data:
    
    Execution ID: kiro-exec-12345
    Duration: 45 seconds
    Tasks Completed: 3/5
    Failed Tasks: 2 (timeout errors)
    Memory Usage: Peak 2.1GB
    Error Messages: ["Connection timeout to AWS Bedrock", "Circuit breaker open for Google AI"]
    
    Provide analysis of execution patterns and recommendations for improvement.`,
    context: {
      correlationId: "meta-monitor-001",
      metadata: {
        executionId: "kiro-exec-12345",
        timestamp: new Date().toISOString(),
      },
    },
    maxTokens: 2048,
    temperature: 0.3,
  };

  try {
    const response = await client.executeSupportOperation(request);

    if (response.success) {
      console.log("Meta-Monitoring Analysis:");
      console.log(response.text);
      console.log(`Cost: €${response.costEuro?.toFixed(4)}`);
      console.log(
        `Tokens Used: ${response.tokensUsed?.input} input, ${response.tokensUsed?.output} output`
      );
    }
  } finally {
    client.destroy();
  }
}

/**
 * Example 4: Implementation Support with Auto-Resolution
 *
 * Use case: Detect incomplete modules and provide remediation
 */
export async function implementationSupportExample() {
  const client = new DirectBedrockClient({
    region: "eu-central-1",
    enableComplianceChecks: true,
    enableCircuitBreaker: true,
  });

  const request: SupportOperationRequest = {
    operation: "implementation",
    priority: "high",
    prompt: `Implementation gap detected in the Evidently integration module:

    Module: src/lib/optimization/evidently-integration.ts
    Status: Incomplete
    Missing Components:
    - Feature flag configuration
    - A/B test result processing
    - Metric collection integration
    - Error handling for Evidently API failures
    
    Dependencies:
    - AWS Evidently service
    - CloudWatch metrics
    - Feature flag system
    
    Provide specific remediation steps and code examples for completing this module.`,
    context: {
      userId: "developer-001",
      correlationId: "impl-support-evidently",
      metadata: {
        module: "evidently-integration",
        priority: "high",
        deadline: "2024-10-15",
      },
    },
    tools: [
      {
        name: "generate_code_template",
        description: "Generate code template for missing components",
        parameters: {
          component: { type: "string" },
          language: { type: "string" },
          framework: { type: "string" },
        },
      },
      {
        name: "create_test_cases",
        description: "Generate test cases for the implementation",
        parameters: {
          module: { type: "string" },
          testType: { type: "string" },
        },
      },
    ],
  };

  try {
    const response = await client.executeSupportOperation(request);

    if (response.success) {
      console.log("Implementation Support Response:");
      console.log(response.text);

      // Process tool calls for code generation
      if (response.toolCalls?.length) {
        console.log("\nGenerated Code Templates:");
        response.toolCalls.forEach((toolCall, index) => {
          console.log(`${index + 1}. ${toolCall.name}:`, toolCall.arguments);
        });
      }
    }
  } finally {
    client.destroy();
  }
}

/**
 * Example 5: Health Monitoring and Circuit Breaker Integration
 *
 * Use case: Monitor client health and handle failures gracefully
 */
export async function healthMonitoringExample() {
  const client = new DirectBedrockClient({
    region: "eu-central-1",
    enableHealthMonitoring: true,
    enableCircuitBreaker: true,
  });

  try {
    // Check initial health status
    let healthStatus = client.getHealthStatus();
    console.log("Initial Health Status:", healthStatus);

    // Perform health check
    healthStatus = await client.performHealthCheck();
    console.log("Health Check Result:", {
      healthy: healthStatus.isHealthy,
      latency: healthStatus.latencyMs,
      failures: healthStatus.consecutiveFailures,
      circuitBreaker: healthStatus.circuitBreakerState,
    });

    // Example of handling circuit breaker open state
    if (!healthStatus.isHealthy) {
      console.log(
        "Direct Bedrock client is unhealthy, implementing fallback..."
      );

      // In a real implementation, you would:
      // 1. Switch to MCP routing
      // 2. Queue requests for retry
      // 3. Alert operations team
      // 4. Implement graceful degradation
    }

    // Simulate some operations
    for (let i = 0; i < 3; i++) {
      const response = await client.executeEmergencyOperation(
        `Health check operation ${i + 1}: System status check`
      );

      console.log(`Operation ${i + 1}:`, {
        success: response.success,
        latency: response.latencyMs,
        error: response.error,
      });
    }

    // Final health status
    healthStatus = client.getHealthStatus();
    console.log("Final Health Status:", healthStatus);
  } finally {
    client.destroy();
  }
}

/**
 * Example 6: Configuration and Error Handling
 *
 * Use case: Demonstrate different configurations and error scenarios
 */
export async function configurationExample() {
  // Configuration for development environment
  const devClient = new DirectBedrockClient({
    region: "eu-central-1",
    maxRetries: 2,
    timeout: 15000,
    emergencyTimeout: 3000,
    criticalTimeout: 8000,
    enableCircuitBreaker: false, // Disabled for development
    enableHealthMonitoring: false,
    enableComplianceChecks: false,
  });

  // Configuration for production environment
  const prodClient = new DirectBedrockClient({
    region: "eu-central-1",
    maxRetries: 3,
    timeout: 30000,
    emergencyTimeout: 5000,
    criticalTimeout: 10000,
    enableCircuitBreaker: true,
    enableHealthMonitoring: true,
    enableComplianceChecks: true,
  });

  try {
    // Test with development client (more permissive)
    console.log("Testing with development configuration...");
    const devResponse = await devClient.executeSupportOperation({
      operation: "standard",
      priority: "medium",
      prompt: "Test prompt with potentially sensitive data: user@example.com",
    });
    console.log(
      "Dev Response:",
      devResponse.success ? "Success" : devResponse.error
    );

    // Test with production client (strict compliance)
    console.log("Testing with production configuration...");
    const prodResponse = await prodClient.executeSupportOperation({
      operation: "standard",
      priority: "medium",
      prompt: "Test prompt with potentially sensitive data: user@example.com",
    });
    console.log(
      "Prod Response:",
      prodResponse.success ? "Success" : prodResponse.error
    );
  } finally {
    devClient.destroy();
    prodClient.destroy();
  }
}

// Export all examples for easy testing
export const examples = {
  emergencySystemDiagnostic,
  criticalInfrastructureAnalysis,
  metaMonitoringExample,
  implementationSupportExample,
  healthMonitoringExample,
  configurationExample,
};

// Example usage:
// import { examples } from './direct-bedrock-client-example';
// await examples.emergencySystemDiagnostic();
