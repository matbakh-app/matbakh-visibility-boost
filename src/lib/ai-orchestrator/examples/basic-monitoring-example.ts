/**
 * Example: Basic Monitoring and Logging Integration
 *
 * This example shows how to integrate basic monitoring and logging
 * into the AI orchestrator system.
 */

import { BasicLogger, BasicMonitor } from "../index";
import { AiRequest, AiResponse } from "../types";

/**
 * Example AI service with monitoring and logging
 */
export class MonitoredAiService {
  private logger: BasicLogger;
  private monitor: BasicMonitor;

  constructor(serviceName: string = "ai-service") {
    this.logger = new BasicLogger(serviceName);
    this.monitor = new BasicMonitor(this.logger);
  }

  /**
   * Process AI request with monitoring
   */
  async processRequest(request: AiRequest): Promise<AiResponse> {
    const requestId = this.monitor.recordRequestStart(request);
    const startTime = Date.now();

    try {
      // Log request start
      this.logger.info("Processing AI request", {
        requestId,
        provider: request.provider,
        modelId: request.modelId,
        userId: request.context?.userId,
      });

      // Simulate AI processing
      const response = await this.simulateAiProcessing(request);

      // Record successful completion
      this.monitor.recordRequestComplete(
        requestId,
        request,
        response,
        startTime
      );

      return response;
    } catch (error) {
      // Record error
      this.monitor.recordRequestError(
        requestId,
        request,
        error as Error,
        startTime
      );

      // Return error response
      return {
        success: false,
        provider: request.provider,
        modelId: request.modelId,
        error: (error as Error).message,
        requestId,
      };
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return this.monitor.getHealthStatus();
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Check if service is healthy
   */
  isHealthy(): boolean {
    return this.monitor.isHealthy();
  }

  /**
   * Simulate AI processing (for example purposes)
   */
  private async simulateAiProcessing(request: AiRequest): Promise<AiResponse> {
    // Simulate processing time
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      // 5% failure rate
      throw new Error("Simulated AI processing error");
    }

    // Simulate different response times by provider
    const latencyByProvider = {
      bedrock: 600,
      google: 700,
      meta: 800,
    };

    const baseLatency = latencyByProvider[request.provider] || 600;
    const actualLatency = baseLatency + (Math.random() * 200 - 100); // ±100ms variance

    return {
      success: true,
      provider: request.provider,
      modelId: request.modelId,
      content: `Simulated response for: ${request.prompt}`,
      costEuro: Math.random() * 0.1, // Random cost up to 0.1 EUR
      tokensUsed: Math.floor(Math.random() * 200 + 50), // 50-250 tokens
      requestId: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      latencyMs: actualLatency,
    };
  }
}

/**
 * Example usage
 */
export async function runMonitoringExample() {
  const service = new MonitoredAiService("example-ai-service");

  console.log("🚀 Starting AI service monitoring example...\n");

  // Process some requests
  const requests: AiRequest[] = [
    {
      provider: "bedrock",
      modelId: "claude-3",
      prompt: "What is the weather like today?",
      context: { userId: "user-123" },
    },
    {
      provider: "google",
      modelId: "gemini-pro",
      prompt: "Explain quantum computing",
      context: { userId: "user-456" },
    },
    {
      provider: "meta",
      modelId: "llama-3",
      prompt: "Write a short story",
      context: { userId: "user-789" },
    },
  ];

  // Process requests concurrently
  const responses = await Promise.allSettled(
    requests.map((request) => service.processRequest(request))
  );

  console.log(`📊 Processed ${responses.length} requests\n`);

  // Show results
  responses.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(
        `✅ Request ${index + 1}: ${
          result.value.success ? "Success" : "Failed"
        }`
      );
    } else {
      console.log(`❌ Request ${index + 1}: Error - ${result.reason}`);
    }
  });

  // Show health status
  console.log("\n🏥 Health Status:");
  const health = service.getHealthStatus();
  console.log(`Overall: ${health.overall}`);
  console.log(`Active Alerts: ${health.alerts.length}`);

  // Show metrics
  console.log("\n📈 Metrics:");
  const metrics = service.getMetrics();
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(
    `Success Rate: ${(
      (metrics.successfulRequests / metrics.totalRequests) *
      100
    ).toFixed(1)}%`
  );
  console.log(`Average Latency: ${metrics.averageLatency.toFixed(0)}ms`);
  console.log(`Total Cost: €${metrics.totalCost.toFixed(4)}`);

  // Show provider health
  console.log("\n🔧 Provider Health:");
  health.providers.forEach((provider) => {
    console.log(
      `${provider.provider}: ${
        provider.isHealthy ? "✅ Healthy" : "❌ Unhealthy"
      } (${provider.requestCount} requests)`
    );
  });

  // Show alerts if any
  if (health.alerts.length > 0) {
    console.log("\n🚨 Active Alerts:");
    health.alerts.forEach((alert) => {
      console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);
    });
  }

  console.log("\n✨ Monitoring example completed!");
}

// Run example if this file is executed directly
if (require.main === module) {
  runMonitoringExample().catch(console.error);
}
