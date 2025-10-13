/**
 * Hybrid Operations Log Aggregator
 *
 * Centralized log aggregation system for hybrid routing operations.
 * Collects, correlates, and stores logs from both MCP and direct Bedrock paths.
 *
 * @module HybridLogAggregator
 */

import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { BasicLogger, LogContext } from "../basic-logger";

/**
 * Log entry for hybrid operations
 */
export interface HybridLogEntry {
  timestamp: Date;
  requestId: string;
  correlationId: string;
  routingPath: "mcp" | "direct-bedrock" | "fallback" | "hybrid";
  operation: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata: {
    provider?: string;
    latencyMs?: number;
    costEuro?: number;
    success?: boolean;
    errorType?: string;
    errorMessage?: string;
    routeHealth?: string;
    cacheHit?: boolean;
    retryCount?: number;
  };
  context?: LogContext;
}

/**
 * Log query parameters
 */
export interface LogQueryParams {
  startTime: Date;
  endTime: Date;
  routingPath?: "mcp" | "direct-bedrock" | "fallback" | "hybrid";
  level?: "debug" | "info" | "warn" | "error";
  requestId?: string;
  correlationId?: string;
  operation?: string;
  limit?: number;
}

/**
 * Log aggregation statistics
 */
export interface LogAggregationStats {
  totalLogs: number;
  logsByPath: Record<string, number>;
  logsByLevel: Record<string, number>;
  logsByOperation: Record<string, number>;
  averageLatency: number;
  totalCost: number;
  errorRate: number;
  cacheHitRate: number;
}

/**
 * Log stream configuration
 */
export interface LogStreamConfig {
  logGroupName: string;
  logStreamName: string;
  retentionDays?: number;
}

/**
 * Hybrid Log Aggregator
 *
 * Manages centralized logging for hybrid routing operations
 */
export class HybridLogAggregator {
  private client: CloudWatchLogsClient;
  private logger: BasicLogger;
  private logGroupName: string;
  private environment: string;
  private region: string;
  private buffer: HybridLogEntry[];
  private bufferSize: number;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    region: string = "eu-central-1",
    environment: string = "production",
    bufferSize: number = 100,
    flushInterval: number = 5000
  ) {
    this.client = new CloudWatchLogsClient({ region });
    this.logger = new BasicLogger("hybrid-log-aggregator", environment);
    this.logGroupName = `/matbakh/${environment}/hybrid-routing`;
    this.environment = environment;
    this.region = region;
    this.buffer = [];
    this.bufferSize = bufferSize;
    this.flushInterval = flushInterval;

    // Start auto-flush timer
    this.startAutoFlush();
  }

  /**
   * Initialize log group and streams
   */
  async initialize(): Promise<void> {
    try {
      // Create log group
      await this.client.send(
        new CreateLogGroupCommand({
          logGroupName: this.logGroupName,
        })
      );

      this.logger.info("Log group created", {
        logGroupName: this.logGroupName,
      });
    } catch (error: any) {
      if (error.name !== "ResourceAlreadyExistsException") {
        this.logger.error("Failed to create log group", error as Error, {
          logGroupName: this.logGroupName,
        });
        throw error;
      }
    }

    // Create log streams for each routing path
    const paths = ["mcp", "direct-bedrock", "fallback", "hybrid"];
    for (const path of paths) {
      try {
        await this.createLogStream(path);
      } catch (error: any) {
        if (error.name !== "ResourceAlreadyExistsException") {
          this.logger.warn(`Failed to create log stream for ${path}`, {
            path,
            error: error.message,
          });
        }
      }
    }
  }

  /**
   * Create log stream for routing path
   */
  private async createLogStream(routingPath: string): Promise<void> {
    const logStreamName = `${routingPath}-${Date.now()}`;

    await this.client.send(
      new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName,
      })
    );

    this.logger.debug("Log stream created", {
      logStreamName,
      routingPath,
    });
  }

  /**
   * Log hybrid operation
   */
  async log(entry: HybridLogEntry): Promise<void> {
    // Add to buffer
    this.buffer.push(entry);

    // Log locally for development
    if (this.environment === "development") {
      this.logToConsole(entry);
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Log to console (development only)
   */
  private logToConsole(entry: HybridLogEntry): void {
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[entry.level];

    console.log(
      `${emoji} [${entry.routingPath}] ${entry.operation}: ${entry.message}`,
      entry.metadata
    );
  }

  /**
   * Flush buffer to CloudWatch
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      // Group logs by routing path
      const logsByPath = this.groupLogsByPath(logsToFlush);

      // Send to CloudWatch for each path
      for (const [path, logs] of Object.entries(logsByPath)) {
        await this.sendToCloudWatch(path, logs);
      }

      this.logger.debug("Logs flushed to CloudWatch", {
        count: logsToFlush.length,
      });
    } catch (error) {
      this.logger.error("Failed to flush logs", error as Error, {
        count: logsToFlush.length,
      });

      // Re-add failed logs to buffer
      this.buffer.unshift(...logsToFlush);
    }
  }

  /**
   * Group logs by routing path
   */
  private groupLogsByPath(
    logs: HybridLogEntry[]
  ): Record<string, HybridLogEntry[]> {
    const grouped: Record<string, HybridLogEntry[]> = {};

    for (const log of logs) {
      if (!grouped[log.routingPath]) {
        grouped[log.routingPath] = [];
      }
      grouped[log.routingPath].push(log);
    }

    return grouped;
  }

  /**
   * Send logs to CloudWatch
   */
  private async sendToCloudWatch(
    routingPath: string,
    logs: HybridLogEntry[]
  ): Promise<void> {
    // Get or create log stream
    const logStreamName = await this.getLogStreamName(routingPath);

    // Format log events
    const logEvents = logs.map((log) => ({
      timestamp: log.timestamp.getTime(),
      message: JSON.stringify({
        level: log.level,
        message: log.message,
        requestId: log.requestId,
        correlationId: log.correlationId,
        operation: log.operation,
        metadata: log.metadata,
        context: log.context,
      }),
    }));

    // Send to CloudWatch
    await this.client.send(
      new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName,
        logEvents,
      })
    );
  }

  /**
   * Get log stream name for routing path
   */
  private async getLogStreamName(routingPath: string): Promise<string> {
    try {
      const response = await this.client.send(
        new DescribeLogStreamsCommand({
          logGroupName: this.logGroupName,
          logStreamNamePrefix: routingPath,
          orderBy: "LastEventTime",
          descending: true,
          limit: 1,
        })
      );

      if (response.logStreams && response.logStreams.length > 0) {
        return response.logStreams[0].logStreamName!;
      }
    } catch (error) {
      this.logger.warn("Failed to get log stream", {
        routingPath,
        error: (error as Error).message,
      });
    }

    // Create new log stream
    const logStreamName = `${routingPath}-${Date.now()}`;
    await this.createLogStream(routingPath);
    return logStreamName;
  }

  /**
   * Query logs
   */
  async queryLogs(params: LogQueryParams): Promise<HybridLogEntry[]> {
    const filterPattern = this.buildFilterPattern(params);

    const response = await this.client.send(
      new FilterLogEventsCommand({
        logGroupName: this.logGroupName,
        startTime: params.startTime.getTime(),
        endTime: params.endTime.getTime(),
        filterPattern,
        limit: params.limit || 100,
      })
    );

    if (!response.events) {
      return [];
    }

    return response.events
      .map((event) => {
        try {
          const parsed = JSON.parse(event.message || "{}");
          return {
            timestamp: new Date(event.timestamp || Date.now()),
            requestId: parsed.requestId,
            correlationId: parsed.correlationId,
            routingPath: this.extractRoutingPath(event.logStreamName || ""),
            operation: parsed.operation,
            level: parsed.level,
            message: parsed.message,
            metadata: parsed.metadata || {},
            context: parsed.context,
          };
        } catch (error) {
          this.logger.warn("Failed to parse log event", {
            error: (error as Error).message,
          });
          return null;
        }
      })
      .filter((entry): entry is HybridLogEntry => entry !== null);
  }

  /**
   * Build CloudWatch filter pattern
   */
  private buildFilterPattern(params: LogQueryParams): string {
    const filters: string[] = [];

    if (params.requestId) {
      filters.push(`{ $.requestId = "${params.requestId}" }`);
    }

    if (params.correlationId) {
      filters.push(`{ $.correlationId = "${params.correlationId}" }`);
    }

    if (params.level) {
      filters.push(`{ $.level = "${params.level}" }`);
    }

    if (params.operation) {
      filters.push(`{ $.operation = "${params.operation}" }`);
    }

    return filters.length > 0 ? filters.join(" && ") : "";
  }

  /**
   * Extract routing path from log stream name
   */
  private extractRoutingPath(
    logStreamName: string
  ): "mcp" | "direct-bedrock" | "fallback" | "hybrid" {
    if (logStreamName.startsWith("mcp")) return "mcp";
    if (logStreamName.startsWith("direct-bedrock")) return "direct-bedrock";
    if (logStreamName.startsWith("fallback")) return "fallback";
    return "hybrid";
  }

  /**
   * Get aggregation statistics
   */
  async getStatistics(
    startTime: Date,
    endTime: Date
  ): Promise<LogAggregationStats> {
    const logs = await this.queryLogs({
      startTime,
      endTime,
      limit: 10000,
    });

    const stats: LogAggregationStats = {
      totalLogs: logs.length,
      logsByPath: {},
      logsByLevel: {},
      logsByOperation: {},
      averageLatency: 0,
      totalCost: 0,
      errorRate: 0,
      cacheHitRate: 0,
    };

    let totalLatency = 0;
    let latencyCount = 0;
    let errorCount = 0;
    let cacheHits = 0;
    let cacheTotal = 0;

    for (const log of logs) {
      // Count by path
      stats.logsByPath[log.routingPath] =
        (stats.logsByPath[log.routingPath] || 0) + 1;

      // Count by level
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;

      // Count by operation
      if (log.operation) {
        stats.logsByOperation[log.operation] =
          (stats.logsByOperation[log.operation] || 0) + 1;
      }

      // Calculate latency
      if (log.metadata.latencyMs) {
        totalLatency += log.metadata.latencyMs;
        latencyCount++;
      }

      // Calculate cost
      if (log.metadata.costEuro) {
        stats.totalCost += log.metadata.costEuro;
      }

      // Count errors
      if (log.level === "error") {
        errorCount++;
      }

      // Calculate cache hit rate
      if (log.metadata.cacheHit !== undefined) {
        cacheTotal++;
        if (log.metadata.cacheHit) {
          cacheHits++;
        }
      }
    }

    stats.averageLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;
    stats.errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0;
    stats.cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;

    return stats;
  }

  /**
   * Get logs by correlation ID
   */
  async getLogsByCorrelation(correlationId: string): Promise<HybridLogEntry[]> {
    return this.queryLogs({
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endTime: new Date(),
      correlationId,
      limit: 1000,
    });
  }

  /**
   * Get logs by request ID
   */
  async getLogsByRequest(requestId: string): Promise<HybridLogEntry[]> {
    return this.queryLogs({
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endTime: new Date(),
      requestId,
      limit: 1000,
    });
  }

  /**
   * Get error logs
   */
  async getErrorLogs(
    startTime: Date,
    endTime: Date,
    limit: number = 100
  ): Promise<HybridLogEntry[]> {
    return this.queryLogs({
      startTime,
      endTime,
      level: "error",
      limit,
    });
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        this.logger.error("Auto-flush failed", error as Error);
      });
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Shutdown aggregator
   */
  async shutdown(): Promise<void> {
    this.stopAutoFlush();
    await this.flush();
    this.logger.info("Hybrid log aggregator shutdown complete");
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }
}

/**
 * Log aggregation helper functions
 */
export class LogAggregationHelpers {
  /**
   * Create correlation ID for related operations
   */
  static createCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format log entry for display
   */
  static formatLogEntry(entry: HybridLogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const path = entry.routingPath.toUpperCase();
    const level = entry.level.toUpperCase();

    return `[${timestamp}] [${path}] [${level}] ${entry.operation}: ${entry.message}`;
  }

  /**
   * Extract error details from log entry
   */
  static extractErrorDetails(entry: HybridLogEntry): {
    type: string;
    message: string;
  } | null {
    if (entry.level !== "error" || !entry.metadata.errorType) {
      return null;
    }

    return {
      type: entry.metadata.errorType,
      message: entry.metadata.errorMessage || "Unknown error",
    };
  }

  /**
   * Calculate success rate from logs
   */
  static calculateSuccessRate(logs: HybridLogEntry[]): number {
    if (logs.length === 0) return 0;

    const successCount = logs.filter(
      (log) => log.metadata.success === true
    ).length;

    return (successCount / logs.length) * 100;
  }

  /**
   * Group logs by time window
   */
  static groupLogsByTimeWindow(
    logs: HybridLogEntry[],
    windowMinutes: number = 5
  ): Map<string, HybridLogEntry[]> {
    const grouped = new Map<string, HybridLogEntry[]>();
    const windowMs = windowMinutes * 60 * 1000;

    for (const log of logs) {
      const windowStart =
        Math.floor(log.timestamp.getTime() / windowMs) * windowMs;
      const windowKey = new Date(windowStart).toISOString();

      if (!grouped.has(windowKey)) {
        grouped.set(windowKey, []);
      }

      grouped.get(windowKey)!.push(log);
    }

    return grouped;
  }
}
