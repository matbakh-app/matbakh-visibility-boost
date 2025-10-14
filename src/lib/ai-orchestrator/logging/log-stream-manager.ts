/**
 * Log Stream Manager for Hybrid Operations
 *
 * Advanced log stream management with real-time streaming,
 * filtering, and multi-destination support.
 *
 * @module LogStreamManager
 */

import { EventEmitter } from "events";
import { LogEntry, LogLevel, LogSource } from "./hybrid-log-aggregator";

/**
 * Log stream destination types
 */
export enum StreamDestination {
  CLOUDWATCH = "cloudwatch",
  ELASTICSEARCH = "elasticsearch",
  S3 = "s3",
  KINESIS = "kinesis",
  CONSOLE = "console",
  FILE = "file",
}

/**
 * Log filter configuration
 */
export interface LogFilter {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    levels?: LogLevel[];
    sources?: LogSource[];
    correlationIds?: string[];
    keywords?: string[];
    timeRange?: {
      start: Date;
      end: Date;
    };
    metadata?: Record<string, any>;
  };
}

/**
 * Stream destination configuration
 */
export interface StreamDestinationConfig {
  type: StreamDestination;
  enabled: boolean;
  config: Record<string, any>;
  filters: string[]; // Filter IDs
  batchSize?: number;
  flushInterval?: number;
}

/**
 * Log stream configuration
 */
export interface LogStreamConfig {
  streamId: string;
  name: string;
  enabled: boolean;
  destinations: StreamDestinationConfig[];
  filters: LogFilter[];
  realTimeEnabled: boolean;
  bufferSize: number;
  compressionEnabled: boolean;
}

/**
 * Stream statistics
 */
export interface StreamStats {
  streamId: string;
  totalLogs: number;
  logsPerSecond: number;
  bytesProcessed: number;
  destinationStats: Record<
    StreamDestination,
    {
      delivered: number;
      failed: number;
      pending: number;
    }
  >;
  filterStats: Record<
    string,
    {
      matched: number;
      filtered: number;
    }
  >;
  lastActivity: Date;
}

/**
 * Real-time log event
 */
export interface RealTimeLogEvent {
  streamId: string;
  logEntry: LogEntry;
  destinations: StreamDestination[];
  timestamp: Date;
}

/**
 * Log Stream Manager
 *
 * Manages multiple log streams with filtering, routing,
 * and real-time streaming capabilities.
 */
export class LogStreamManager extends EventEmitter {
  private streams: Map<string, LogStreamConfig>;
  private streamBuffers: Map<string, LogEntry[]>;
  private streamStats: Map<string, StreamStats>;
  private flushTimers: Map<string, NodeJS.Timeout>;
  private isStarted: boolean;

  constructor() {
    super();
    this.streams = new Map();
    this.streamBuffers = new Map();
    this.streamStats = new Map();
    this.flushTimers = new Map();
    this.isStarted = false;
  }

  /**
   * Start the stream manager
   */
  start(): void {
    if (this.isStarted) {
      return;
    }

    console.log("🚀 Starting Log Stream Manager");
    this.isStarted = true;
    this.emit("started");
  }

  /**
   * Stop the stream manager
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    console.log("🛑 Stopping Log Stream Manager");

    // Stop all flush timers
    for (const timer of this.flushTimers.values()) {
      clearInterval(timer);
    }
    this.flushTimers.clear();

    // Flush all remaining logs
    await this.flushAllStreams();

    this.isStarted = false;
    this.emit("stopped");
  }

  /**
   * Create a new log stream
   */
  createStream(config: LogStreamConfig): void {
    if (this.streams.has(config.streamId)) {
      throw new Error(`Stream ${config.streamId} already exists`);
    }

    this.streams.set(config.streamId, config);
    this.streamBuffers.set(config.streamId, []);
    this.initializeStreamStats(config.streamId);

    if (config.enabled) {
      this.startStreamFlushTimer(config);
    }

    console.log(`✅ Created log stream: ${config.name} (${config.streamId})`);
    this.emit("streamCreated", config.streamId);
  }

  /**
   * Remove a log stream
   */
  async removeStream(streamId: string): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Stop flush timer
    const timer = this.flushTimers.get(streamId);
    if (timer) {
      clearInterval(timer);
      this.flushTimers.delete(streamId);
    }

    // Flush remaining logs
    await this.flushStream(streamId);

    // Remove stream data
    this.streams.delete(streamId);
    this.streamBuffers.delete(streamId);
    this.streamStats.delete(streamId);

    console.log(`🗑️ Removed log stream: ${streamId}`);
    this.emit("streamRemoved", streamId);
  }

  /**
   * Update stream configuration
   */
  updateStream(streamId: string, updates: Partial<LogStreamConfig>): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const updatedStream = { ...stream, ...updates };
    this.streams.set(streamId, updatedStream);

    // Restart flush timer if needed
    if (updates.enabled !== undefined) {
      const timer = this.flushTimers.get(streamId);
      if (timer) {
        clearInterval(timer);
        this.flushTimers.delete(streamId);
      }

      if (updatedStream.enabled) {
        this.startStreamFlushTimer(updatedStream);
      }
    }

    console.log(`🔄 Updated log stream: ${streamId}`);
    this.emit("streamUpdated", streamId);
  }

  /**
   * Add log entry to streams
   */
  async addLogEntry(logEntry: LogEntry): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    const matchingStreams = this.findMatchingStreams(logEntry);

    for (const streamId of matchingStreams) {
      const stream = this.streams.get(streamId)!;
      const buffer = this.streamBuffers.get(streamId)!;

      // Apply filters
      const filteredDestinations = this.applyFilters(logEntry, stream);
      if (filteredDestinations.length === 0) {
        continue;
      }

      // Add to buffer
      buffer.push(logEntry);
      this.updateStreamStats(streamId, logEntry);

      // Real-time streaming
      if (stream.realTimeEnabled) {
        this.emit("realTimeLog", {
          streamId,
          logEntry,
          destinations: filteredDestinations,
          timestamp: new Date(),
        } as RealTimeLogEvent);
      }

      // Flush if buffer is full
      if (buffer.length >= stream.bufferSize) {
        await this.flushStream(streamId);
      }
    }
  }

  /**
   * Add filter to stream
   */
  addFilter(streamId: string, filter: LogFilter): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Remove existing filter with same ID
    stream.filters = stream.filters.filter((f) => f.id !== filter.id);
    stream.filters.push(filter);

    console.log(`🔍 Added filter ${filter.name} to stream ${streamId}`);
    this.emit("filterAdded", streamId, filter.id);
  }

  /**
   * Remove filter from stream
   */
  removeFilter(streamId: string, filterId: string): void {
    const stream = this.streams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    stream.filters = stream.filters.filter((f) => f.id !== filterId);

    console.log(`🗑️ Removed filter ${filterId} from stream ${streamId}`);
    this.emit("filterRemoved", streamId, filterId);
  }

  /**
   * Get stream statistics
   */
  getStreamStats(streamId: string): StreamStats | undefined {
    return this.streamStats.get(streamId);
  }

  /**
   * Get all stream statistics
   */
  getAllStreamStats(): Record<string, StreamStats> {
    const stats: Record<string, StreamStats> = {};
    for (const [streamId, streamStats] of this.streamStats) {
      stats[streamId] = { ...streamStats };
    }
    return stats;
  }

  /**
   * Get stream configuration
   */
  getStreamConfig(streamId: string): LogStreamConfig | undefined {
    return this.streams.get(streamId);
  }

  /**
   * Get all stream configurations
   */
  getAllStreamConfigs(): Record<string, LogStreamConfig> {
    const configs: Record<string, LogStreamConfig> = {};
    for (const [streamId, config] of this.streams) {
      configs[streamId] = { ...config };
    }
    return configs;
  }

  /**
   * Query logs by filter
   */
  queryLogs(filter: LogFilter): LogEntry[] {
    const results: LogEntry[] = [];

    for (const buffer of this.streamBuffers.values()) {
      for (const entry of buffer) {
        if (this.matchesFilter(entry, filter)) {
          results.push(entry);
        }
      }
    }

    return results;
  }

  /**
   * Initialize stream statistics
   */
  private initializeStreamStats(streamId: string): void {
    this.stats.set(streamId, {
      streamId,
      totalLogs: 0,
      logsPerSecond: 0,
      bytesProcessed: 0,
      destinationStats: {
        [StreamDestination.CLOUDWATCH]: { delivered: 0, failed: 0, pending: 0 },
        [StreamDestination.ELASTICSEARCH]: {
          delivered: 0,
          failed: 0,
          pending: 0,
        },
        [StreamDestination.S3]: { delivered: 0, failed: 0, pending: 0 },
        [StreamDestination.KINESIS]: { delivered: 0, failed: 0, pending: 0 },
        [StreamDestination.CONSOLE]: { delivered: 0, failed: 0, pending: 0 },
        [StreamDestination.FILE]: { delivered: 0, failed: 0, pending: 0 },
      },
      filterStats: {},
      lastActivity: new Date(),
    });
  }

  /**
   * Find matching streams for log entry
   */
  private findMatchingStreams(logEntry: LogEntry): string[] {
    const matchingStreams: string[] = [];

    for (const [streamId, stream] of this.streams) {
      if (!stream.enabled) {
        continue;
      }

      // Check if any filter matches
      let matches = stream.filters.length === 0; // If no filters, match all
      for (const filter of stream.filters) {
        if (filter.enabled && this.matchesFilter(logEntry, filter)) {
          matches = true;
          break;
        }
      }

      if (matches) {
        matchingStreams.push(streamId);
      }
    }

    return matchingStreams;
  }

  /**
   * Apply filters to log entry
   */
  private applyFilters(
    logEntry: LogEntry,
    stream: LogStreamConfig
  ): StreamDestination[] {
    const destinations: StreamDestination[] = [];

    for (const destConfig of stream.destinations) {
      if (!destConfig.enabled) {
        continue;
      }

      // Check if log passes all filters for this destination
      let passes = true;
      for (const filterId of destConfig.filters) {
        const filter = stream.filters.find((f) => f.id === filterId);
        if (filter && filter.enabled && !this.matchesFilter(logEntry, filter)) {
          passes = false;
          break;
        }
      }

      if (passes) {
        destinations.push(destConfig.type);
      }
    }

    return destinations;
  }

  /**
   * Check if log entry matches filter
   */
  private matchesFilter(logEntry: LogEntry, filter: LogFilter): boolean {
    const conditions = filter.conditions;

    // Check log levels
    if (conditions.levels && !conditions.levels.includes(logEntry.level)) {
      return false;
    }

    // Check sources
    if (conditions.sources && !conditions.sources.includes(logEntry.source)) {
      return false;
    }

    // Check correlation IDs
    if (
      conditions.correlationIds &&
      !conditions.correlationIds.includes(logEntry.correlationId)
    ) {
      return false;
    }

    // Check keywords
    if (conditions.keywords) {
      const messageMatch = conditions.keywords.some((keyword) =>
        logEntry.message.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!messageMatch) {
        return false;
      }
    }

    // Check time range
    if (conditions.timeRange) {
      const timestamp = logEntry.timestamp.getTime();
      const start = conditions.timeRange.start.getTime();
      const end = conditions.timeRange.end.getTime();
      if (timestamp < start || timestamp > end) {
        return false;
      }
    }

    // Check metadata
    if (conditions.metadata && logEntry.metadata) {
      for (const [key, value] of Object.entries(conditions.metadata)) {
        if (logEntry.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update stream statistics
   */
  private updateStreamStats(streamId: string, logEntry: LogEntry): void {
    const stats = this.streamStats.get(streamId);
    if (!stats) {
      return;
    }

    stats.totalLogs++;
    stats.bytesProcessed += JSON.stringify(logEntry).length;
    stats.lastActivity = new Date();

    // Update logs per second (simplified)
    const now = Date.now();
    const lastActivity = stats.lastActivity.getTime();
    const timeDiff = (now - lastActivity) / 1000;
    if (timeDiff > 0) {
      stats.logsPerSecond = 1 / timeDiff;
    }
  }

  /**
   * Start flush timer for stream
   */
  private startStreamFlushTimer(stream: LogStreamConfig): void {
    const flushInterval = stream.destinations[0]?.flushInterval || 5000;

    const timer = setInterval(async () => {
      try {
        await this.flushStream(stream.streamId);
      } catch (error) {
        console.error(`❌ Failed to flush stream ${stream.streamId}:`, error);
      }
    }, flushInterval);

    this.flushTimers.set(stream.streamId, timer);
  }

  /**
   * Flush specific stream
   */
  private async flushStream(streamId: string): Promise<void> {
    const buffer = this.streamBuffers.get(streamId);
    if (!buffer || buffer.length === 0) {
      return;
    }

    const stream = this.streams.get(streamId);
    if (!stream) {
      return;
    }

    const logsToFlush = [...buffer];
    this.streamBuffers.set(streamId, []);

    // Send to each enabled destination
    for (const destConfig of stream.destinations) {
      if (!destConfig.enabled) {
        continue;
      }

      try {
        await this.sendToDestination(streamId, destConfig.type, logsToFlush);
        this.updateDestinationStats(
          streamId,
          destConfig.type,
          "delivered",
          logsToFlush.length
        );
      } catch (error) {
        console.error(`❌ Failed to send logs to ${destConfig.type}:`, error);
        this.updateDestinationStats(
          streamId,
          destConfig.type,
          "failed",
          logsToFlush.length
        );
      }
    }

    this.emit("streamFlushed", streamId, logsToFlush.length);
  }

  /**
   * Flush all streams
   */
  private async flushAllStreams(): Promise<void> {
    const flushPromises: Promise<void>[] = [];

    for (const streamId of this.streams.keys()) {
      flushPromises.push(this.flushStream(streamId));
    }

    await Promise.all(flushPromises);
  }

  /**
   * Send logs to destination
   */
  private async sendToDestination(
    streamId: string,
    destination: StreamDestination,
    logs: LogEntry[]
  ): Promise<void> {
    switch (destination) {
      case StreamDestination.CLOUDWATCH:
        // CloudWatch implementation handled by HybridLogAggregator
        break;

      case StreamDestination.CONSOLE:
        logs.forEach((log) => {
          const message = `[${log.level}] [${log.source}] ${log.message}`;
          console.log(message);
        });
        break;

      case StreamDestination.FILE:
        // File destination would write to local file system
        // Implementation depends on environment
        break;

      case StreamDestination.ELASTICSEARCH:
      case StreamDestination.S3:
      case StreamDestination.KINESIS:
        // These would require additional AWS SDK clients
        // Placeholder for future implementation
        console.log(`📤 Would send ${logs.length} logs to ${destination}`);
        break;

      default:
        console.warn(`⚠️ Unknown destination: ${destination}`);
    }
  }

  /**
   * Update destination statistics
   */
  private updateDestinationStats(
    streamId: string,
    destination: StreamDestination,
    status: "delivered" | "failed" | "pending",
    count: number
  ): void {
    const stats = this.streamStats.get(streamId);
    if (!stats) {
      return;
    }

    stats.destinationStats[destination][status] += count;
  }
}
