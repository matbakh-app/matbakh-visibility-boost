/**
 * Kiro Bridge Communication System
 *
 * Provides bidirectional communication between Bedrock Support Manager and Kiro
 * with hybrid routing awareness, message queuing, and comprehensive error handling.
 */

// Simple UUID replacement for testing (no external dependencies)
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type KiroBridgeMessageType =
  | "diagnostic_request"
  | "diagnostic_response"
  | "execution_data"
  | "execution_feedback"
  | "health_check"
  | "health_response"
  | "support_request"
  | "support_response"
  | "routing_info"
  | "error_report";

export type MessagePriority =
  | "emergency"
  | "critical"
  | "high"
  | "medium"
  | "low";
export type RoutingPath = "direct_bedrock" | "mcp" | "fallback" | "hybrid";
export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "acknowledged"
  | "failed"
  | "timeout";

export interface KiroBridgeMessage {
  id: string;
  correlationId: string;
  type: KiroBridgeMessageType;
  priority: MessagePriority;
  timestamp: Date;
  source: "bedrock" | "kiro";
  destination: "bedrock" | "kiro";
  routingPath: RoutingPath;
  payload: Record<string, any>;
  metadata: {
    retryCount: number;
    maxRetries: number;
    timeout: number;
    expiresAt: Date;
  };
}

export interface MessageQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  priorityLevels: Record<MessagePriority, number>;
}

export interface CommunicationStats {
  messagesSent: number;
  messagesReceived: number;
  messagesDelivered: number;
  messagesFailed: number;
  averageLatency: number;
  queueSize: number;
  errorRate: number;
  lastActivity: Date;
}

/**
 * Kiro Bridge Communication System
 */
export class KiroBridge {
  private messageQueue: Map<string, KiroBridgeMessage> = new Map();
  private pendingMessages: Map<string, KiroBridgeMessage> = new Map();
  private messageHandlers: Map<
    KiroBridgeMessageType,
    (message: KiroBridgeMessage) => Promise<void>
  > = new Map();
  private stats: CommunicationStats;
  private config: MessageQueueConfig;
  private isActive: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(config?: Partial<MessageQueueConfig>) {
    this.config = {
      maxQueueSize: 1000,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      priorityLevels: {
        emergency: 1,
        critical: 2,
        high: 3,
        medium: 4,
        low: 5,
      },
      ...config,
    };

    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesDelivered: 0,
      messagesFailed: 0,
      averageLatency: 0,
      queueSize: 0,
      errorRate: 0,
      lastActivity: new Date(),
    };

    this.initializeDefaultHandlers();
  }

  public async initialize(): Promise<void> {
    this.isActive = true;
    this.processingInterval = setInterval(() => {
      this.processMessageQueue();
    }, 100);
    console.log("[KiroBridge] Communication system initialized");
  }

  public async shutdown(): Promise<void> {
    this.isActive = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    await this.processMessageQueue();
    console.log("[KiroBridge] Communication system shutdown");
  }

  public async sendDiagnosticRequest(
    diagnosticType:
      | "system_health"
      | "performance"
      | "error_analysis"
      | "gap_detection",
    data: Record<string, any>,
    options?: {
      priority?: MessagePriority;
      routingPath?: RoutingPath;
    }
  ): Promise<string> {
    const message: KiroBridgeMessage = {
      id: uuidv4(),
      correlationId: uuidv4(),
      type: "diagnostic_request",
      priority: options?.priority || "medium",
      timestamp: new Date(),
      source: "bedrock",
      destination: "kiro",
      routingPath: options?.routingPath || "hybrid",
      payload: { diagnosticType, data },
      metadata: {
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        timeout: this.config.timeoutMs,
        expiresAt: new Date(Date.now() + this.config.timeoutMs),
      },
    };

    await this.queueMessage(message);
    return message.correlationId;
  }

  public async sendExecutionData(
    executionId: string,
    operation: string,
    status: "started" | "running" | "completed" | "failed",
    data: Record<string, any>
  ): Promise<string> {
    const message: KiroBridgeMessage = {
      id: uuidv4(),
      correlationId: uuidv4(),
      type: "execution_data",
      priority: "medium",
      timestamp: new Date(),
      source: "bedrock",
      destination: "kiro",
      routingPath: "hybrid",
      payload: { executionId, operation, status, ...data },
      metadata: {
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        timeout: this.config.timeoutMs,
        expiresAt: new Date(Date.now() + this.config.timeoutMs),
      },
    };

    await this.queueMessage(message);
    return message.correlationId;
  }

  public registerMessageHandler(
    messageType: KiroBridgeMessageType,
    handler: (message: KiroBridgeMessage) => Promise<void>
  ): void {
    this.messageHandlers.set(messageType, handler);
  }

  public async receiveMessage(message: KiroBridgeMessage): Promise<void> {
    try {
      this.stats.messagesReceived++;
      this.stats.lastActivity = new Date();

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        await handler(message);
        this.stats.messagesDelivered++;
      }
    } catch (error) {
      console.error(`[KiroBridge] Error processing message:`, error);
      this.stats.messagesFailed++;
    }
  }

  public getStats(): CommunicationStats {
    this.stats.queueSize = this.messageQueue.size;
    this.stats.errorRate =
      this.stats.messagesFailed / Math.max(this.stats.messagesSent, 1);
    return { ...this.stats };
  }

  private initializeDefaultHandlers(): void {
    this.registerMessageHandler("diagnostic_response", async (message) => {
      console.log(
        `[KiroBridge] Received diagnostic response: ${message.correlationId}`
      );
    });

    this.registerMessageHandler("execution_feedback", async (message) => {
      console.log(
        `[KiroBridge] Received execution feedback: ${message.correlationId}`
      );
    });
  }

  private async queueMessage(message: KiroBridgeMessage): Promise<void> {
    if (this.messageQueue.size >= this.config.maxQueueSize) {
      throw new Error("Message queue is full");
    }

    this.messageQueue.set(message.id, message);
    this.stats.messagesSent++;
    this.stats.lastActivity = new Date();
  }

  private async processMessageQueue(): Promise<void> {
    if (!this.isActive || this.messageQueue.size === 0) {
      return;
    }

    const messages = Array.from(this.messageQueue.values()).sort(
      (a, b) =>
        this.config.priorityLevels[a.priority] -
        this.config.priorityLevels[b.priority]
    );

    for (const message of messages.slice(0, 10)) {
      try {
        await this.transmitMessage(message);
        this.messageQueue.delete(message.id);
      } catch (error) {
        console.error(`[KiroBridge] Failed to transmit message:`, error);
      }
    }
  }

  private async transmitMessage(message: KiroBridgeMessage): Promise<void> {
    console.log(
      `[KiroBridge] Transmitting message: ${message.id} via ${message.routingPath}`
    );
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
  }
}

// Default instance export
export const kiroBridge = new KiroBridge();

// The class is already exported above, no need to re-export
