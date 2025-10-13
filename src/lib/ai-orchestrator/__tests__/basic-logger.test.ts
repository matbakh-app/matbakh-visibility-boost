/**
 * Tests for BasicLogger
 */

import { BasicLogger } from "../basic-logger";

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(mockConsoleLog);
  jest.spyOn(console, "error").mockImplementation(mockConsoleError);
});

beforeEach(() => {
  mockConsoleLog.mockClear();
  mockConsoleError.mockClear();
  delete process.env.LOG_LEVEL;
  delete process.env.NODE_ENV;
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("BasicLogger", () => {
  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const logger = new BasicLogger();

      // Test by logging a debug message
      logger.debug("test message");

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("should initialize with custom service name and environment", () => {
      const logger = new BasicLogger("test-service", "production");

      logger.info("test message");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("test message")
      );
    });

    it("should respect LOG_LEVEL environment variable", () => {
      process.env.LOG_LEVEL = "error";

      const logger = new BasicLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.error("error message");

      // Only error should be logged
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("error message"),
        expect.any(Object)
      );
    });
  });

  describe("Log Levels", () => {
    let logger: BasicLogger;

    beforeEach(() => {
      logger = new BasicLogger("test", "development");
    });

    it("should log debug messages", () => {
      logger.debug("debug message", { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("DEBUG"),
        expect.objectContaining({ key: "value" })
      );
    });

    it("should log info messages", () => {
      logger.info("info message", { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("INFO"),
        expect.objectContaining({ key: "value" })
      );
    });

    it("should log warning messages", () => {
      logger.warn("warning message", { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("WARN"),
        expect.objectContaining({ key: "value" })
      );
    });

    it("should log error messages", () => {
      const error = new Error("test error");
      logger.error("error message", error, { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("ERROR"),
        expect.objectContaining({
          key: "value",
          error: expect.objectContaining({
            name: "Error",
            message: "test error",
            stack: expect.any(String),
          }),
        })
      );
    });

    it("should log fatal messages", () => {
      const error = new Error("fatal error");
      logger.fatal("fatal message", error, { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("FATAL"),
        expect.objectContaining({
          key: "value",
          error: expect.objectContaining({
            name: "Error",
            message: "fatal error",
          }),
        })
      );
    });
  });

  describe("AI-specific logging methods", () => {
    let logger: BasicLogger;

    beforeEach(() => {
      logger = new BasicLogger("ai-test", "development");
    });

    it("should log request start", () => {
      logger.logRequestStart("req-123", {
        provider: "bedrock",
        modelId: "claude-3",
        userId: "user-456",
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("AI request started"),
        expect.objectContaining({
          requestId: "req-123",
          provider: "bedrock",
          modelId: "claude-3",
          userId: "user-456",
          operation: "request_start",
        })
      );
    });

    it("should log request completion", () => {
      logger.logRequestComplete("req-123", {
        provider: "bedrock",
        duration: 1500,
        cost: 0.05,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("AI request completed"),
        expect.objectContaining({
          requestId: "req-123",
          provider: "bedrock",
          duration: 1500,
          cost: 0.05,
          operation: "request_complete",
        })
      );
    });

    it("should log request error", () => {
      const error = new Error("Request failed");
      logger.logRequestError("req-123", error, {
        provider: "bedrock",
        duration: 500,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("AI request failed"),
        expect.objectContaining({
          requestId: "req-123",
          provider: "bedrock",
          duration: 500,
          operation: "request_error",
          error: expect.objectContaining({
            name: "Error",
            message: "Request failed",
          }),
        })
      );
    });

    it("should log provider fallback", () => {
      logger.logProviderFallback("req-123", "bedrock", "google", "timeout");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Provider fallback triggered"),
        expect.objectContaining({
          requestId: "req-123",
          fromProvider: "bedrock",
          toProvider: "google",
          reason: "timeout",
          operation: "provider_fallback",
        })
      );
    });

    it("should log cache events", () => {
      logger.logCacheEvent("req-123", "hit", "cache-key-456", 3600);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Cache hit"),
        expect.objectContaining({
          requestId: "req-123",
          cacheKey: "cache-key-456",
          ttl: 3600,
          operation: "cache_hit",
        })
      );
    });

    it("should log performance metrics", () => {
      logger.logPerformanceMetrics("req-123", {
        duration: 1200,
        provider: "bedrock",
        modelId: "claude-3",
        cost: 0.03,
        tokensUsed: 150,
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Performance metrics"),
        expect.objectContaining({
          requestId: "req-123",
          duration: 1200,
          provider: "bedrock",
          modelId: "claude-3",
          cost: 0.03,
          tokensUsed: 150,
          operation: "performance_metrics",
        })
      );
    });
  });

  describe("Production mode", () => {
    it("should output JSON in production", () => {
      const logger = new BasicLogger("test", "production");

      logger.info("test message", { key: "value" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/^\{.*\}$/) // JSON string
      );

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(loggedData).toMatchObject({
        level: "info",
        message: "test message",
        context: expect.objectContaining({
          service: "test",
          environment: "production",
          key: "value",
        }),
      });
    });
  });

  describe("Child logger", () => {
    it("should create child logger with additional context", () => {
      const parentLogger = new BasicLogger("parent", "development");
      const childLogger = parentLogger.child({
        requestId: "req-123",
        userId: "user-456",
      });

      childLogger.info("child message", { additional: "context" });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("child message"),
        expect.objectContaining({
          requestId: "req-123",
          userId: "user-456",
          additional: "context",
        })
      );
    });
  });

  describe("Log level filtering", () => {
    it("should filter logs based on minimum level", () => {
      process.env.LOG_LEVEL = "warn";
      const logger = new BasicLogger("test", "development");

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(mockConsoleLog).toHaveBeenCalledTimes(2); // warn and error only
    });

    it("should use environment-specific default levels", () => {
      // Production should default to 'info'
      const prodLogger = new BasicLogger("test", "production");
      prodLogger.debug("debug message");

      expect(mockConsoleLog).not.toHaveBeenCalled();

      prodLogger.info("info message");
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });
});
