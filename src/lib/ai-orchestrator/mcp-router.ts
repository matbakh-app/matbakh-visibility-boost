/**
 * MCP Router - Model Context Protocol Integration for Hybrid Bedrock Support
 *
 * This module implements MCP (Model Context Protocol) integration for the Bedrock
 * Support Mode, providing reliable communication between Bedrock and Kiro through
 * MCP with message queuing, retry logic, and health monitoring.
 */

import WebSocket from "ws";
import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";
import {
  OperationPriority,
  SupportOperationRequest,
  SupportOperationResponse,
} from "./direct-bedrock-client";
import { RouteHealth } from "./intelligent-router";

// Configure WebSocket for Node.js environment
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket as any;
}

// MCP Message Types
export interface MCPMessage {
  id: string;
  type: "request" | "response" | "notification";
  method: string;
  params?: any;
  result?: any;
  error?: MCPError;
  timestamp: Date;
  correlationId: string;
  retryCount: number;
  priority: OperationPriority;
  timeout?: number;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// MCP Connection Configuration
export interface MCPConnectionConfig {
  endpoint: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  queueMaxSize: number;
  healthCheckInterval: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

// MCP Health Status
export interface MCPHealthStatus extends RouteHealth {
  connectionStatus: "connected" | "disconnected" | "connecting" | "error";
  queueSize: number;
  pendingOperations: number;
  lastSuccessfulOperation: Date | null;
  errorRate: number;
}

// Message Queue Item
interface QueuedMessage {
  message: MCPMessage;
  resolve: (value: SupportOperationResponse) => void;
  reject: (error: Error) => void;
  enqueuedAt: Date;
  attempts: number;
  timeoutId?: NodeJS.Timeout;
}

// Kiro Bridge Communication Protocol
export interface KiroBridgeMessage {
  type: "diagnostics" | "support_request" | "execution_data" | "health_check";
  source: "bedrock_support" | "kiro" | "mcp_router";
  payload: any;
  timestamp: Date;
  correlationId: string;
  routingPath: "mcp" | "direct" | "hybrid";
}

/**
 * MCP Router Implementation for Hybrid Bedrock Integration
 */
export class MCPRouter {
  private config: MCPConnectionConfig;
  private featureFlags: AiFeatureFlags;
  private circuitBreaker: CircuitBreaker;
  private auditTrail: AuditTrailSystem;

  // Connection and messaging
  private connection: WebSocket | null = null;
  private messageQueue: Map<string, QueuedMessage> = new Map();
  private pendingMessages: Map<string, QueuedMessage> = new Map();
  private priorityQueue: QueuedMessage[] = [];

  // Health monitoring
  private healthStatus: MCPHealthStatus;
  private healthCheckInterval?: NodeJS.Timeout;
  private connectionRetryTimeout?: NodeJS.Timeout;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();
  private activeIntervals: Set<NodeJS.Timeout> = new Set();

  // Metrics and monitoring
  private metrics: {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    averageLatency: number;
    queueOverflows: number;
    connectionResets: number;
  };

  constructor(config?: Partial<MCPConnectionConfig>) {
    this.config = {
      endpoint: process.env.MCP_ENDPOINT || "ws://localhost:8080/mcp",
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      queueMaxSize: 1000,
      healthCheckInterval: 30000,
      enableCompression: true,
      enableEncryption: false,
      ...config,
    };

    this.featureFlags = new AiFeatureFlags();
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000,
      halfOpenMaxCalls: 3,
    });

    // Initialize audit trail system
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 2555, // 7 years for GDPR compliance
    });

    this.healthStatus = this.initializeHealthStatus();
    this.metrics = this.initializeMetrics();

    // Initialize connection if MCP is enabled
    if (this.featureFlags.isEnabled("ENABLE_MCP_INTEGRATION")) {
      this.initializeConnection();
    }
  }

  /**
   * Execute support operation through MCP
   */
  async executeSupportOperation(
    request: SupportOperationRequest
  ): Promise<SupportOperationResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      // Check if MCP integration is enabled
      if (!this.featureFlags.isEnabled("ENABLE_MCP_INTEGRATION")) {
        throw new Error("MCP integration is disabled");
      }

      // Check circuit breaker
      if (this.circuitBreaker.isOpen("mcp" as any)) {
        throw new Error("MCP router circuit breaker is open");
      }

      // Validate connection
      await this.ensureConnection();

      // Create MCP message
      const mcpMessage: MCPMessage = {
        id: this.generateMessageId(),
        type: "request",
        method: "support_operation",
        params: {
          operation: request.operation,
          priority: request.priority,
          context: request.context,
          timeout: 30000, // Default 30s timeout
        },
        timestamp: new Date(),
        correlationId,
        retryCount: 0,
        priority: request.priority,
        timeout: 30000, // Default 30s timeout
      };

      // Execute with retry logic
      const response = await this.executeWithRetry(mcpMessage);

      // Update metrics on success
      this.updateMetrics(true, Date.now() - startTime);

      // Log successful operation to audit trail
      await this.auditTrail.logMCPRoutingOperation(
        correlationId,
        request.operation,
        request.priority,
        Date.now() - startTime,
        true,
        this.messageQueue.size,
        0 // No retries for successful operation
      );

      // Log successful operation (console logging)
      this.logOperation("success", mcpMessage, response);

      return {
        success: true,
        operationId: response.operationId || correlationId,
        latencyMs: Date.now() - startTime,
        timestamp: new Date(),
        text: response.result?.text,
        toolCalls: response.result?.toolCalls,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Update metrics on failure
      this.updateMetrics(false, latencyMs);

      // Log failed operation to audit trail
      await this.auditTrail.logMCPRoutingOperation(
        correlationId,
        request.operation,
        request.priority,
        latencyMs,
        false,
        this.messageQueue.size,
        0, // Retry count would be tracked in executeWithRetry
        error instanceof Error ? error.message : "MCP operation failed"
      );

      // Log failed operation (console logging)
      this.logOperation("error", null, null, error as Error);

      // Return error response
      return {
        success: false,
        operationId: correlationId,
        latencyMs,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "MCP operation failed",
      };
    }
  }

  /**
   * Get MCP health status
   */
  async getHealthStatus(): Promise<MCPHealthStatus> {
    // Update real-time metrics
    this.healthStatus.queueSize =
      this.messageQueue.size + this.priorityQueue.length;
    this.healthStatus.pendingOperations = this.pendingMessages.size;
    this.healthStatus.lastCheck = new Date();

    // Check connection status (preserve error state)
    if (this.connection?.readyState === WebSocket.OPEN) {
      this.healthStatus.connectionStatus = "connected";
      this.healthStatus.isHealthy = true;
    } else if (this.connection?.readyState === WebSocket.CONNECTING) {
      this.healthStatus.connectionStatus = "connecting";
      this.healthStatus.isHealthy = false;
    } else {
      // Only change to disconnected if not already in error state
      if (this.healthStatus.connectionStatus !== "error") {
        this.healthStatus.connectionStatus = "disconnected";
      }
      this.healthStatus.isHealthy = false;
    }

    // Calculate error rate
    if (this.metrics.totalMessages > 0) {
      this.healthStatus.errorRate =
        this.metrics.failedMessages / this.metrics.totalMessages;
    }

    // Update latency
    this.healthStatus.latencyMs = this.metrics.averageLatency;

    return { ...this.healthStatus };
  }

  /**
   * Check if MCP router is available
   */
  isAvailable(): boolean {
    return (
      this.featureFlags.isEnabled("ENABLE_MCP_INTEGRATION") &&
      this.connection?.readyState === WebSocket.OPEN &&
      !this.circuitBreaker.isOpen("mcp" as any)
    );
  }

  /**
   * Send diagnostics to Kiro through MCP
   */
  async sendDiagnosticsToKiro(
    diagnostics: any,
    correlationId: string
  ): Promise<void> {
    // Check if MCP is available
    if (!this.isAvailable()) {
      throw new Error("MCP router is not available");
    }

    const bridgeMessage: KiroBridgeMessage = {
      type: "diagnostics",
      source: "bedrock_support",
      payload: diagnostics,
      timestamp: new Date(),
      correlationId,
      routingPath: "mcp",
    };

    await this.sendKiroBridgeMessage(bridgeMessage);
  }

  /**
   * Receive execution data from Kiro
   */
  async receiveKiroExecutionData(
    executionData: any,
    correlationId: string
  ): Promise<void> {
    const bridgeMessage: KiroBridgeMessage = {
      type: "execution_data",
      source: "kiro",
      payload: executionData,
      timestamp: new Date(),
      correlationId,
      routingPath: "mcp",
    };

    // Process execution data for support operations
    await this.processKiroExecutionData(bridgeMessage);
  }

  /**
   * Get MCP router metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      healthStatus: this.healthStatus,
      queueSize: this.messageQueue.size,
      priorityQueueSize: this.priorityQueue.length,
      pendingOperations: this.pendingMessages.size,
      totalQueuedOperations: this.messageQueue.size + this.priorityQueue.length,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all tracked intervals
    this.activeIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.activeIntervals.clear();

    // Clear all tracked timeouts
    this.activeTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();

    // Clear specific intervals and timeouts
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    if (this.connectionRetryTimeout) {
      clearTimeout(this.connectionRetryTimeout);
      this.connectionRetryTimeout = undefined;
    }

    // Clean up all pending message timeouts
    this.pendingMessages.forEach((queuedMessage) => {
      if (queuedMessage.timeoutId) {
        clearTimeout(queuedMessage.timeoutId);
      }
      queuedMessage.reject(new Error("MCP router destroyed"));
    });

    // Clean up priority queue timeouts
    this.priorityQueue.forEach((queuedMessage) => {
      if (queuedMessage.timeoutId) {
        clearTimeout(queuedMessage.timeoutId);
      }
      queuedMessage.reject(new Error("MCP router destroyed"));
    });

    // Close connection
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }

    // Clear queues
    this.messageQueue.clear();
    this.pendingMessages.clear();
    this.priorityQueue = [];
  }

  // Private implementation methods

  private initializeHealthStatus(): MCPHealthStatus {
    return {
      route: "mcp",
      isHealthy: false,
      latencyMs: 0,
      successRate: 1.0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      connectionStatus: "disconnected",
      queueSize: 0,
      pendingOperations: 0,
      lastSuccessfulOperation: null,
      errorRate: 0,
    };
  }

  private initializeMetrics() {
    return {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageLatency: 0,
      queueOverflows: 0,
      connectionResets: 0,
    };
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.connection = new WebSocket(this.config.endpoint);

      this.connection.onopen = () => {
        console.log("MCP connection established");
        this.healthStatus.connectionStatus = "connected";
        this.healthStatus.isHealthy = true;
        this.startHealthMonitoring();

        // Handle connection recovery and process queued messages
        this.handleConnectionRecovery();
        this.processPriorityQueue();
      };

      this.connection.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.connection.onclose = () => {
        console.log("MCP connection closed");
        // Only change to disconnected if not already in error state
        if (this.healthStatus.connectionStatus !== "error") {
          this.healthStatus.connectionStatus = "disconnected";
        }
        this.healthStatus.isHealthy = false;
        this.scheduleReconnection();
      };

      this.connection.onerror = (error) => {
        console.error("MCP connection error:", error);
        this.healthStatus.connectionStatus = "error";
        this.healthStatus.isHealthy = false;
        this.metrics.connectionResets++;

        // Don't immediately reconnect on error - wait for close event
        // This allows the error state to be observed in tests
      };
    } catch (error) {
      console.error("Failed to initialize MCP connection:", error);
      this.scheduleReconnection();
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (this.connection?.readyState === WebSocket.CONNECTING) {
      // Wait for connection to establish
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, this.config.timeout);

        const checkConnection = () => {
          if (this.connection?.readyState === WebSocket.OPEN) {
            clearTimeout(timeout);
            resolve(void 0);
          } else if (this.connection?.readyState === WebSocket.CLOSED) {
            clearTimeout(timeout);
            reject(new Error("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        checkConnection();
      });
    } else {
      // Reconnect
      await this.initializeConnection();
      await this.ensureConnection();
    }
  }

  private async executeWithRetry(
    message: MCPMessage
  ): Promise<SupportOperationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        message.retryCount = attempt;
        return await this.sendMessage(message);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.log(
            `MCP operation failed, retrying in ${delay}ms (attempt ${
              attempt + 1
            }/${this.config.maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("MCP operation failed after all retries");
  }

  private async sendMessage(
    message: MCPMessage
  ): Promise<SupportOperationResponse> {
    return new Promise((resolve, reject) => {
      // Check queue size before adding to queue
      if (this.messageQueue.size >= this.config.queueMaxSize) {
        this.metrics.queueOverflows++;
        reject(new Error("Message queue is full"));
        return;
      }

      // Add to queue
      const queuedMessage: QueuedMessage = {
        message,
        resolve,
        reject,
        enqueuedAt: new Date(),
        attempts: 0,
      };

      this.messageQueue.set(message.id, queuedMessage);

      // Set timeout for the operation
      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(message.id)) {
          this.pendingMessages.delete(message.id);
          this.messageQueue.delete(message.id);
          this.removePendingMessage(message.id);
          reject(new Error("MCP operation timeout"));
        }
      }, message.timeout || this.config.timeout);

      // Store timeout ID for cleanup
      queuedMessage.timeoutId = timeoutId;

      // Try to send immediately or queue for later
      if (this.connection?.readyState === WebSocket.OPEN) {
        this.sendMessageImmediate(queuedMessage);
      } else {
        // Add to priority queue for processing when connection is available
        this.addToPriorityQueue(queuedMessage);
      }
    });
  }

  private sendMessageImmediate(queuedMessage: QueuedMessage): void {
    try {
      // Check if we have room for pending operations
      if (this.pendingMessages.size >= this.config.queueMaxSize) {
        // Clean up and reject due to pending queue full
        if (queuedMessage.timeoutId) {
          clearTimeout(queuedMessage.timeoutId);
        }
        this.messageQueue.delete(queuedMessage.message.id);
        this.metrics.queueOverflows++;
        queuedMessage.reject(new Error("Pending operations queue is full"));
        return;
      }

      this.pendingMessages.set(queuedMessage.message.id, queuedMessage);
      this.connection!.send(JSON.stringify(queuedMessage.message));
    } catch (error) {
      // Clean up on send error
      if (queuedMessage.timeoutId) {
        clearTimeout(queuedMessage.timeoutId);
      }
      this.messageQueue.delete(queuedMessage.message.id);
      this.pendingMessages.delete(queuedMessage.message.id);
      queuedMessage.reject(error as Error);
    }
  }

  private addToPriorityQueue(queuedMessage: QueuedMessage): void {
    // Insert based on priority (emergency > critical > high > medium > low)
    const priorityOrder = {
      emergency: 0,
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

    const messagePriority = priorityOrder[queuedMessage.message.priority] || 4;

    let insertIndex = this.priorityQueue.length;
    for (let i = 0; i < this.priorityQueue.length; i++) {
      const queuePriority =
        priorityOrder[this.priorityQueue[i].message.priority] || 4;
      if (messagePriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.priorityQueue.splice(insertIndex, 0, queuedMessage);
  }

  private processPriorityQueue(): void {
    while (
      this.priorityQueue.length > 0 &&
      this.connection?.readyState === WebSocket.OPEN
    ) {
      const queuedMessage = this.priorityQueue.shift()!;
      this.sendMessageImmediate(queuedMessage);
    }
  }

  private removePendingMessage(messageId: string): void {
    // Remove from priority queue if present
    const queueIndex = this.priorityQueue.findIndex(
      (q) => q.message.id === messageId
    );
    if (queueIndex >= 0) {
      this.priorityQueue.splice(queueIndex, 1);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: MCPMessage = JSON.parse(data);

      // Handle response messages
      if (message.type === "response" && this.pendingMessages.has(message.id)) {
        const queuedMessage = this.pendingMessages.get(message.id)!;

        // Clean up timeout
        if (queuedMessage.timeoutId) {
          clearTimeout(queuedMessage.timeoutId);
        }

        this.pendingMessages.delete(message.id);
        this.messageQueue.delete(message.id);

        if (message.error) {
          queuedMessage.reject(new Error(message.error.message));
        } else {
          const messageTimestamp =
            message.timestamp instanceof Date
              ? message.timestamp.getTime()
              : new Date(message.timestamp).getTime();

          queuedMessage.resolve({
            success: true,
            operationId: message.id,
            latencyMs: Date.now() - messageTimestamp,
            timestamp: new Date(),
            text: message.result?.text,
            toolCalls: message.result?.toolCalls,
          });
        }
      }

      // Handle notification messages (from Kiro)
      if (message.type === "notification") {
        this.handleKiroNotification(message);
      }
    } catch (error) {
      console.error("Failed to handle MCP message:", error);
    }
  }

  private async sendKiroBridgeMessage(
    message: KiroBridgeMessage
  ): Promise<void> {
    const mcpMessage: MCPMessage = {
      id: this.generateMessageId(),
      type: "notification",
      method: "kiro_bridge",
      params: message,
      timestamp: new Date(),
      correlationId: message.correlationId,
      retryCount: 0,
      priority: "medium",
      timeout: 5000, // 5 second timeout for bridge messages
    };

    // For notifications, we don't need to wait for a response
    // Just send and resolve immediately
    if (this.connection?.readyState === WebSocket.OPEN) {
      try {
        this.connection.send(JSON.stringify(mcpMessage));
      } catch (error) {
        throw new Error(`Failed to send Kiro bridge message: ${error}`);
      }
    } else {
      throw new Error("MCP connection not available");
    }
  }

  private async processKiroExecutionData(
    message: KiroBridgeMessage
  ): Promise<void> {
    // Process execution data for support analysis
    console.log(`Processing Kiro execution data: ${message.correlationId}`);

    // This would integrate with the meta monitor and implementation support
    // For now, just log the received data
    this.logOperation("kiro_data", null, message);
  }

  private handleKiroNotification(message: MCPMessage): void {
    console.log(`Received Kiro notification: ${message.method}`);

    // Handle different types of notifications from Kiro
    switch (message.method) {
      case "execution_update":
        // Handle execution updates
        break;
      case "health_check":
        // Respond to health checks
        this.respondToHealthCheck(message);
        break;
      default:
        console.log(`Unknown notification method: ${message.method}`);
    }
  }

  private respondToHealthCheck(message: MCPMessage): void {
    const response: MCPMessage = {
      id: this.generateMessageId(),
      type: "response",
      method: "health_check_response",
      result: {
        status: "healthy",
        timestamp: new Date(),
        metrics: this.getMetrics(),
      },
      timestamp: new Date(),
      correlationId: message.correlationId,
      retryCount: 0,
      priority: "high",
    };

    if (this.connection?.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(response));
    }
  }

  private scheduleReconnection(): void {
    if (this.connectionRetryTimeout) {
      clearTimeout(this.connectionRetryTimeout);
      this.activeTimeouts.delete(this.connectionRetryTimeout);
    }

    this.connectionRetryTimeout = setTimeout(() => {
      console.log("Attempting MCP reconnection...");
      this.initializeConnection();
    }, 5000); // Retry after 5 seconds

    this.activeTimeouts.add(this.connectionRetryTimeout);
  }

  /**
   * Handle connection recovery - retry failed messages
   */
  private handleConnectionRecovery(): void {
    // Move pending messages back to priority queue for retry
    const failedMessages: QueuedMessage[] = [];

    this.pendingMessages.forEach((queuedMessage) => {
      // Only retry if not exceeded max attempts
      if (queuedMessage.attempts < this.config.maxRetries) {
        queuedMessage.attempts++;
        queuedMessage.message.retryCount = queuedMessage.attempts;
        failedMessages.push(queuedMessage);
      } else {
        // Reject messages that exceeded retry limit
        if (queuedMessage.timeoutId) {
          clearTimeout(queuedMessage.timeoutId);
        }
        queuedMessage.reject(
          new Error("MCP operation failed after max retries")
        );
      }
    });

    // Clear pending messages
    this.pendingMessages.clear();

    // Add failed messages back to priority queue
    failedMessages.forEach((queuedMessage) => {
      this.addToPriorityQueue(queuedMessage);
    });

    // Process the queue
    this.processPriorityQueue();
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.activeIntervals.delete(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("MCP health check failed:", error);
        this.healthStatus.consecutiveFailures++;
      }
    }, this.config.healthCheckInterval);

    this.activeIntervals.add(this.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    if (this.connection?.readyState === WebSocket.OPEN) {
      const healthMessage: MCPMessage = {
        id: this.generateMessageId(),
        type: "request",
        method: "ping",
        timestamp: new Date(),
        correlationId: this.generateCorrelationId(),
        retryCount: 0,
        priority: "low",
      };

      try {
        await this.sendMessage(healthMessage);
        this.healthStatus.consecutiveFailures = 0;
        this.healthStatus.lastSuccessfulOperation = new Date();
      } catch (error) {
        this.healthStatus.consecutiveFailures++;
      }
    }
  }

  private updateMetrics(success: boolean, latencyMs: number): void {
    this.metrics.totalMessages++;

    if (success) {
      this.metrics.successfulMessages++;
    } else {
      this.metrics.failedMessages++;
    }

    // Update average latency (rolling average)
    const totalLatency =
      this.metrics.averageLatency * (this.metrics.totalMessages - 1) +
      latencyMs;
    this.metrics.averageLatency = totalLatency / this.metrics.totalMessages;
  }

  private logOperation(
    type: "success" | "error" | "kiro_data",
    message: MCPMessage | null,
    response: any,
    error?: Error
  ): void {
    const logEntry = {
      timestamp: new Date(),
      type,
      messageId: message?.id,
      correlationId: message?.correlationId,
      method: message?.method,
      success: type === "success",
      error: error?.message,
      latencyMs: response?.latencyMs,
    };

    console.log(`[MCPRouter] ${JSON.stringify(logEntry)}`);
  }

  private generateMessageId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateCorrelationId(): string {
    return `mcp-corr-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }
}

// Export types for external use
export {
  type KiroBridgeMessage,
  type MCPConnectionConfig,
  type MCPError,
  type MCPHealthStatus,
  type MCPMessage,
};
