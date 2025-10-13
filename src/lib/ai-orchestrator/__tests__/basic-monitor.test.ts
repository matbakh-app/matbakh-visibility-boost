/**
 * Tests for BasicMonitor
 */

import { BasicLogger } from "../basic-logger";
import { BasicMonitor } from "../basic-monitor";
import { AiRequest, AiResponse } from "../types";

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logRequestStart: jest.fn(),
  logRequestComplete: jest.fn(),
  logRequestError: jest.fn(),
  logPerformanceMetrics: jest.fn(),
} as unknown as BasicLogger;

// Mock timers
jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe("BasicMonitor", () => {
  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const monitor = new BasicMonitor(mockLogger);

      const metrics = monitor.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    it("should initialize provider health for all providers", () => {
      const monitor = new BasicMonitor(mockLogger);

      const providerHealth = monitor.getProviderHealth();
      expect(providerHealth).toHaveLength(3);

      const providers = providerHealth.map((p) => p.provider);
      expect(providers).toContain("bedrock");
      expect(providers).toContain("google");
      expect(providers).toContain("meta");

      providerHealth.forEach((health) => {
        expect(health.isHealthy).toBe(true);
        expect(health.consecutiveFailures).toBe(0);
        expect(health.requestCount).toBe(0);
      });
    });
  });

  describe("Request tracking", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should record request start", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
        context: { userId: "user-123" },
      };

      const requestId = monitor.recordRequestStart(request);

      expect(requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(mockLogger.logRequestStart).toHaveBeenCalledWith(
        requestId,
        expect.objectContaining({
          provider: "bedrock",
          modelId: "claude-3",
          userId: "user-123",
        })
      );
    });

    it("should record successful request completion", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: true,
        provider: "bedrock",
        modelId: "claude-3",
        content: "response content",
        costEuro: 0.05,
        tokensUsed: 100,
        requestId: "req-123",
      };

      const startTime = Date.now() - 1000; // 1 second ago
      monitor.recordRequestComplete("req-123", request, response, startTime);

      const metrics = monitor.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.totalCost).toBe(0.05);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);

      expect(mockLogger.logRequestComplete).toHaveBeenCalled();
      expect(mockLogger.logPerformanceMetrics).toHaveBeenCalled();
    });

    it("should record failed request completion", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: false,
        provider: "bedrock",
        modelId: "claude-3",
        error: "Request failed",
        requestId: "req-123",
      };

      const startTime = Date.now() - 500;
      monitor.recordRequestComplete("req-123", request, response, startTime);

      const metrics = monitor.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.errorRate).toBe(1);
    });

    it("should record request error", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const error = new Error("Network error");
      const startTime = Date.now() - 300;

      monitor.recordRequestError("req-123", request, error, startTime);

      const metrics = monitor.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.errorRate).toBe(1);

      expect(mockLogger.logRequestError).toHaveBeenCalledWith(
        "req-123",
        error,
        expect.objectContaining({
          provider: "bedrock",
          modelId: "claude-3",
        })
      );
    });
  });

  describe("Provider health tracking", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should update provider health on successful requests", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: true,
        provider: "bedrock",
        modelId: "claude-3",
        content: "response",
        requestId: "req-123",
      };

      monitor.recordRequestComplete(
        "req-123",
        request,
        response,
        Date.now() - 1000
      );

      const bedrockHealth = monitor.getProviderHealth("bedrock")[0];
      expect(bedrockHealth.isHealthy).toBe(true);
      expect(bedrockHealth.consecutiveFailures).toBe(0);
      expect(bedrockHealth.requestCount).toBe(1);
      expect(bedrockHealth.lastSuccessTime).toBeInstanceOf(Date);
    });

    it("should update provider health on failed requests", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: false,
        provider: "bedrock",
        modelId: "claude-3",
        error: "Request failed",
        requestId: "req-123",
      };

      monitor.recordRequestComplete(
        "req-123",
        request,
        response,
        Date.now() - 500
      );

      const bedrockHealth = monitor.getProviderHealth("bedrock")[0];
      expect(bedrockHealth.consecutiveFailures).toBe(1);
      expect(bedrockHealth.requestCount).toBe(1);
      expect(bedrockHealth.lastFailureTime).toBeInstanceOf(Date);
      expect(bedrockHealth.isHealthy).toBe(true); // Still healthy after 1 failure
    });

    it("should mark provider as unhealthy after multiple failures", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      // Record 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      const bedrockHealth = monitor.getProviderHealth("bedrock")[0];
      expect(bedrockHealth.isHealthy).toBe(false);
      expect(bedrockHealth.consecutiveFailures).toBe(3);
    });
  });

  describe("Alerting", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should create alert for high error rate", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      // Create 10 failed requests to trigger high error rate
      for (let i = 0; i < 10; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const errorRateAlert = alerts.find((alert) => alert.type === "error");
      expect(errorRateAlert).toBeDefined();
      expect(errorRateAlert?.severity).toBe("high");
    });

    it("should create alert for high latency", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: true,
        provider: "bedrock",
        modelId: "claude-3",
        content: "response",
        requestId: "req-123",
      };

      // Record request with high latency (3 seconds)
      monitor.recordRequestComplete(
        "req-123",
        request,
        response,
        Date.now() - 3000
      );

      const alerts = monitor.getActiveAlerts();
      const latencyAlert = alerts.find((alert) => alert.type === "performance");
      expect(latencyAlert).toBeDefined();
      expect(latencyAlert?.severity).toBe("medium");
    });

    it("should create alert for unhealthy provider", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      // Record enough failures to make provider unhealthy
      for (let i = 0; i < 5; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      const alerts = monitor.getActiveAlerts();
      const providerAlert = alerts.find(
        (alert) => alert.type === "availability"
      );
      expect(providerAlert).toBeDefined();
      expect(providerAlert?.severity).toBe("high");
      expect(providerAlert?.context?.provider).toBe("bedrock");
    });

    it("should resolve alerts", () => {
      // Create an alert first
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      for (let i = 0; i < 10; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const resolved = monitor.resolveAlert(alertId);

      expect(resolved).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Alert resolved",
        expect.objectContaining({ alertId })
      );

      const activeAlerts = monitor.getActiveAlerts();
      expect(activeAlerts.find((a) => a.id === alertId)).toBeUndefined();
    });
  });

  describe("Health status", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should return healthy status initially", () => {
      const status = monitor.getHealthStatus();

      expect(status.overall).toBe("healthy");
      expect(status.metrics.totalRequests).toBe(0);
      expect(status.providers).toHaveLength(3);
      expect(status.alerts).toHaveLength(0);
    });

    it("should return degraded status with high error rate", () => {
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      // Create requests with 20% error rate (degraded but not unhealthy)
      for (let i = 0; i < 10; i++) {
        const response: AiResponse = {
          success: i < 8, // 8 success, 2 failures = 20% error rate
          provider: "bedrock",
          modelId: "claude-3",
          content: i < 8 ? "response" : undefined,
          error: i >= 8 ? "Request failed" : undefined,
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      const status = monitor.getHealthStatus();
      expect(status.overall).toBe("degraded");
    });

    it("should check if system is healthy", () => {
      expect(monitor.isHealthy()).toBe(true);

      // Create unhealthy condition
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      for (let i = 0; i < 10; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      expect(monitor.isHealthy()).toBe(false);
    });
  });

  describe("Periodic health checks", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should perform periodic health checks", () => {
      // Fast-forward 30 seconds to trigger health check
      jest.advanceTimersByTime(30000);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Health check completed",
        expect.objectContaining({
          overall: "healthy",
          totalRequests: 0,
          errorRate: 0,
        })
      );
    });

    it("should log warnings for unhealthy status", () => {
      // Create unhealthy condition
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      for (let i = 0; i < 10; i++) {
        const response: AiResponse = {
          success: false,
          provider: "bedrock",
          modelId: "claude-3",
          error: "Request failed",
          requestId: `req-${i}`,
        };

        monitor.recordRequestComplete(
          `req-${i}`,
          request,
          response,
          Date.now() - 500
        );
      }

      // Clear previous logs
      jest.clearAllMocks();

      // Trigger health check
      jest.advanceTimersByTime(30000);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("System health:"),
        expect.objectContaining({
          errorRate: expect.any(Number),
          averageLatency: expect.any(Number),
        })
      );
    });
  });

  describe("Reset functionality", () => {
    let monitor: BasicMonitor;

    beforeEach(() => {
      monitor = new BasicMonitor(mockLogger);
    });

    it("should reset all metrics and state", () => {
      // Add some data first
      const request: AiRequest = {
        provider: "bedrock",
        modelId: "claude-3",
        prompt: "test prompt",
      };

      const response: AiResponse = {
        success: true,
        provider: "bedrock",
        modelId: "claude-3",
        content: "response",
        requestId: "req-123",
      };

      monitor.recordRequestComplete(
        "req-123",
        request,
        response,
        Date.now() - 1000
      );

      // Verify data exists
      expect(monitor.getMetrics().totalRequests).toBe(1);

      // Reset
      monitor.reset();

      // Verify reset
      const metrics = monitor.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(monitor.getActiveAlerts()).toHaveLength(0);
    });
  });
});
