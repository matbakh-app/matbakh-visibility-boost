/**
 * Basic Logger for AI Orchestrator
 *
 * Implements structured logging with different levels and contexts
 * Supports CloudWatch integration and local development
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  provider?: string;
  modelId?: string;
  operation?: string;
  duration?: number;
  cost?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Basic Logger implementation
 */
export class BasicLogger {
  private serviceName: string;
  private environment: string;
  private minLevel: LogLevel;

  constructor(
    serviceName: string = "ai-orchestrator",
    environment: string = "development"
  ) {
    this.serviceName = serviceName;
    this.environment = environment;
    this.minLevel = this.getMinLogLevel();
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log("error", message, errorContext);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    this.log("fatal", message, errorContext);
  }

  /**
   * Log AI request start
   */
  logRequestStart(requestId: string, context: LogContext): void {
    this.info("AI request started", {
      requestId,
      ...context,
      operation: "request_start",
    });
  }

  /**
   * Log AI request completion
   */
  logRequestComplete(requestId: string, context: LogContext): void {
    this.info("AI request completed", {
      requestId,
      ...context,
      operation: "request_complete",
    });
  }

  /**
   * Log AI request error
   */
  logRequestError(requestId: string, error: Error, context: LogContext): void {
    this.error("AI request failed", error, {
      requestId,
      ...context,
      operation: "request_error",
    });
  }

  /**
   * Log provider fallback
   */
  logProviderFallback(
    requestId: string,
    fromProvider: string,
    toProvider: string,
    reason: string
  ): void {
    this.warn("Provider fallback triggered", {
      requestId,
      fromProvider,
      toProvider,
      reason,
      operation: "provider_fallback",
    });
  }

  /**
   * Log cache hit/miss
   */
  logCacheEvent(
    requestId: string,
    event: "hit" | "miss" | "set",
    key: string,
    ttl?: number
  ): void {
    this.debug(`Cache ${event}`, {
      requestId,
      cacheKey: key,
      ttl,
      operation: `cache_${event}`,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(
    requestId: string,
    metrics: {
      duration: number;
      provider: string;
      modelId: string;
      cost?: number;
      tokensUsed?: number;
    }
  ): void {
    this.info("Performance metrics", {
      requestId,
      ...metrics,
      operation: "performance_metrics",
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        environment: this.environment,
        ...context,
      },
    };

    // In production, this would send to CloudWatch
    // For now, use structured console logging
    if (this.environment === "production") {
      console.log(JSON.stringify(logEntry));
    } else {
      // Pretty print for development
      this.prettyPrint(logEntry);
    }
  }

  /**
   * Pretty print log entry for development
   */
  private prettyPrint(entry: LogEntry): void {
    const colors = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      fatal: "\x1b[35m", // Magenta
    };

    const reset = "\x1b[0m";
    const color = colors[entry.level] || "";

    console.log(
      `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}${reset}: ${
        entry.message
      }`,
      entry.context ? entry.context : ""
    );

    if (entry.context?.error) {
      console.error(`${color}Error Stack:${reset}`, entry.context.error.stack);
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };

    return levels[level] >= levels[this.minLevel];
  }

  /**
   * Get minimum log level from environment
   */
  private getMinLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    const validLevels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

    if (envLevel && validLevels.includes(envLevel)) {
      return envLevel;
    }

    // Default log levels by environment
    switch (this.environment) {
      case "production":
        return "info";
      case "staging":
        return "debug";
      default:
        return "debug";
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): BasicLogger {
    const childLogger = new BasicLogger(this.serviceName, this.environment);

    // Override log method to include parent context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (
      level: LogLevel,
      message: string,
      childContext?: LogContext
    ) => {
      originalLog(level, message, { ...context, ...childContext });
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new BasicLogger(
  "ai-orchestrator",
  process.env.NODE_ENV || "development"
);

/**
 * Create logger for specific service
 */
export const createLogger = (
  serviceName: string,
  environment?: string
): BasicLogger => {
  return new BasicLogger(
    serviceName,
    environment || process.env.NODE_ENV || "development"
  );
};
