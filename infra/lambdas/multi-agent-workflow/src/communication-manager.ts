/**
 * Communication Manager - Handles inter-agent communication and data sharing
 * Manages message routing, protocol handling, and communication optimization
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CommunicationEntry,
  CommunicationProtocol,
  AgentDefinition,
  WorkflowExecution,
  WorkflowError
} from './types';

export interface MessageQueue {
  id: string;
  messages: QueuedMessage[];
  maxSize: number;
  processingRate: number; // messages per second
  retentionTime: number; // in milliseconds
}

export interface QueuedMessage {
  id: string;
  message: CommunicationEntry;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryCount: number;
  maxRetries: number;
  queuedAt: Date;
  processAfter?: Date;
}

export interface MessageRoute {
  fromAgent: string;
  toAgent: string;
  protocol: CommunicationProtocol;
  messageTypes: string[];
  filters: MessageFilter[];
  transformations: MessageTransformation[];
}

export interface MessageFilter {
  type: 'content' | 'size' | 'frequency' | 'security';
  condition: string;
  action: 'allow' | 'block' | 'modify' | 'delay';
  parameters?: Record<string, any>;
}

export interface MessageTransformation {
  type: 'format' | 'compress' | 'encrypt' | 'translate';
  parameters: Record<string, any>;
}

export interface CommunicationStats {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesByAgent: Record<string, number>;
  averageLatency: number;
  errorRate: number;
  throughput: number; // messages per minute
  queueDepth: number;
}

export class CommunicationManager {
  private messageQueues: Map<string, MessageQueue> = new Map();
  private messageRoutes: Map<string, MessageRoute[]> = new Map();
  private communicationStats: CommunicationStats;
  private messageHistory: Map<string, CommunicationEntry[]> = new Map();
  private protocolHandlers: Map<string, ProtocolHandler> = new Map();

  constructor() {
    this.communicationStats = {
      totalMessages: 0,
      messagesByType: {},
      messagesByAgent: {},
      averageLatency: 0,
      errorRate: 0,
      throughput: 0,
      queueDepth: 0
    };

    this.initializeProtocolHandlers();
    this.startMessageProcessing();
  }

  /**
   * Send a message between agents
   */
  async sendMessage(message: CommunicationEntry): Promise<void> {
    const startTime = Date.now();

    console.log(`Sending message: ${message.id} from ${message.fromAgent} to ${message.toAgent}`);

    try {
      // Validate message
      this.validateMessage(message);

      // Find appropriate route
      const route = await this.findMessageRoute(message);

      // Apply filters
      const filteredMessage = await this.applyMessageFilters(message, route);
      if (!filteredMessage) {
        console.log(`Message filtered out: ${message.id}`);
        return;
      }

      // Apply transformations
      const transformedMessage = await this.applyMessageTransformations(filteredMessage, route);

      // Queue message for delivery
      await this.queueMessage(transformedMessage, route);

      // Update statistics
      this.updateCommunicationStats(message, Date.now() - startTime);

      // Record in history
      this.recordMessage(message);

    } catch (error) {
      console.error(`Failed to send message ${message.id}:`, error);
      this.communicationStats.errorRate = (this.communicationStats.errorRate * 0.9) + 0.1;
      throw error;
    }
  }

  /**
   * Broadcast a message to multiple agents
   */
  async broadcastMessage(
    message: Omit<CommunicationEntry, 'id' | 'toAgent'>,
    targetAgents: string[]
  ): Promise<void> {
    console.log(`Broadcasting message from ${message.fromAgent} to ${targetAgents.length} agents`);

    const broadcastPromises = targetAgents.map(async (agentId) => {
      const agentMessage: CommunicationEntry = {
        ...message,
        id: uuidv4(),
        toAgent: agentId
      };

      return this.sendMessage(agentMessage);
    });

    await Promise.all(broadcastPromises);
  }

  /**
   * Register communication route between agents
   */
  registerRoute(route: MessageRoute): void {
    const routeKey = `${route.fromAgent}->${route.toAgent}`;

    if (!this.messageRoutes.has(routeKey)) {
      this.messageRoutes.set(routeKey, []);
    }

    this.messageRoutes.get(routeKey)!.push(route);
    console.log(`Route registered: ${routeKey}`);
  }

  /**
   * Create message queue for an agent
   */
  createMessageQueue(
    agentId: string,
    maxSize: number = 1000,
    processingRate: number = 10,
    retentionTime: number = 3600000 // 1 hour
  ): void {
    const queue: MessageQueue = {
      id: agentId,
      messages: [],
      maxSize,
      processingRate,
      retentionTime
    };

    this.messageQueues.set(agentId, queue);
    console.log(`Message queue created for agent: ${agentId}`);
  }

  /**
   * Get messages for an agent
   */
  async getMessages(
    agentId: string,
    messageTypes?: string[],
    limit?: number
  ): Promise<CommunicationEntry[]> {
    const queue = this.messageQueues.get(agentId);
    if (!queue) {
      return [];
    }

    let messages = queue.messages
      .filter(qm => !messageTypes || messageTypes.includes(qm.message.messageType))
      .map(qm => qm.message);

    if (limit) {
      messages = messages.slice(0, limit);
    }

    // Mark messages as acknowledged
    for (const message of messages) {
      message.acknowledged = true;
    }

    return messages;
  }

  /**
   * Acknowledge message receipt
   */
  async acknowledgeMessage(messageId: string, agentId: string): Promise<void> {
    const queue = this.messageQueues.get(agentId);
    if (!queue) return;

    const messageIndex = queue.messages.findIndex(qm => qm.message.id === messageId);
    if (messageIndex >= 0) {
      queue.messages[messageIndex].message.acknowledged = true;
      console.log(`Message acknowledged: ${messageId} by ${agentId}`);
    }
  }

  /**
   * Get communication statistics
   */
  getCommunicationStats(): CommunicationStats {
    // Update queue depth
    this.communicationStats.queueDepth = Array.from(this.messageQueues.values())
      .reduce((total, queue) => total + queue.messages.length, 0);

    return { ...this.communicationStats };
  }

  /**
   * Get message history for an agent or execution
   */
  getMessageHistory(
    agentId?: string,
    executionId?: string,
    messageType?: string
  ): CommunicationEntry[] {
    let allMessages: CommunicationEntry[] = [];

    if (agentId) {
      allMessages = this.messageHistory.get(agentId) || [];
    } else {
      // Get all messages
      for (const messages of this.messageHistory.values()) {
        allMessages.push(...messages);
      }
    }

    // Filter by execution ID if provided
    if (executionId) {
      allMessages = allMessages.filter(m =>
        m.content?.executionId === executionId
      );
    }

    // Filter by message type if provided
    if (messageType) {
      allMessages = allMessages.filter(m => m.messageType === messageType);
    }

    return allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Setup agent collaboration protocols
   */
  async setupAgentCollaboration(
    agents: AgentDefinition[],
    execution: WorkflowExecution
  ): Promise<void> {
    console.log(`Setting up collaboration for ${agents.length} agents in execution: ${execution.id}`);

    // Create message queues for all agents
    for (const agent of agents) {
      this.createMessageQueue(agent.id);
    }

    // Setup communication routes based on agent protocols
    for (const agent of agents) {
      for (const protocol of agent.communicationProtocols) {
        await this.setupProtocolRoutes(agent, agents, protocol, execution);
      }
    }

    // Initialize collaboration session
    await this.initializeCollaborationSession(agents, execution);
  }

  // Private methods

  private validateMessage(message: CommunicationEntry): void {
    if (!message.id || !message.fromAgent || !message.toAgent) {
      throw new WorkflowError('Invalid message: missing required fields', 'INVALID_MESSAGE', 400);
    }

    if (!message.content) {
      throw new WorkflowError('Invalid message: missing content', 'INVALID_MESSAGE', 400);
    }

    if (!['request', 'response', 'notification', 'coordination'].includes(message.messageType)) {
      throw new WorkflowError(`Invalid message type: ${message.messageType}`, 'INVALID_MESSAGE', 400);
    }
  }

  private async findMessageRoute(message: CommunicationEntry): Promise<MessageRoute> {
    const routeKey = `${message.fromAgent}->${message.toAgent}`;
    const routes = this.messageRoutes.get(routeKey) || [];

    // Find route that supports this message type
    const compatibleRoute = routes.find(route =>
      route.messageTypes.includes(message.messageType) ||
      route.messageTypes.includes('*')
    );

    if (!compatibleRoute) {
      // Create default route
      return this.createDefaultRoute(message.fromAgent, message.toAgent);
    }

    return compatibleRoute;
  }

  private createDefaultRoute(fromAgent: string, toAgent: string): MessageRoute {
    return {
      fromAgent,
      toAgent,
      protocol: {
        type: 'direct',
        format: 'json',
        encryption: false,
        compression: false,
        acknowledgment: true
      },
      messageTypes: ['*'],
      filters: [],
      transformations: []
    };
  }

  private async applyMessageFilters(
    message: CommunicationEntry,
    route: MessageRoute
  ): Promise<CommunicationEntry | null> {
    let filteredMessage = message;

    for (const filter of route.filters) {
      const result = await this.applyFilter(filteredMessage, filter);

      if (result === null) {
        return null; // Message blocked
      }

      filteredMessage = result;
    }

    return filteredMessage;
  }

  private async applyFilter(
    message: CommunicationEntry,
    filter: MessageFilter
  ): Promise<CommunicationEntry | null> {
    switch (filter.type) {
      case 'content':
        return this.applyContentFilter(message, filter);

      case 'size':
        return this.applySizeFilter(message, filter);

      case 'frequency':
        return this.applyFrequencyFilter(message, filter);

      case 'security':
        return this.applySecurityFilter(message, filter);

      default:
        return message;
    }
  }

  private applyContentFilter(message: CommunicationEntry, filter: MessageFilter): CommunicationEntry | null {
    // Simple content filtering based on condition
    const contentStr = JSON.stringify(message.content);

    if (filter.condition && contentStr.includes(filter.condition)) {
      switch (filter.action) {
        case 'block':
          return null;
        case 'modify':
          // Modify content based on parameters
          return { ...message, content: this.sanitizeContent(message.content) };
        default:
          return message;
      }
    }

    return message;
  }

  private applySizeFilter(message: CommunicationEntry, filter: MessageFilter): CommunicationEntry | null {
    const messageSize = JSON.stringify(message).length;
    const maxSize = filter.parameters?.maxSize || 10000;

    if (messageSize > maxSize) {
      switch (filter.action) {
        case 'block':
          return null;
        case 'modify':
          // Truncate content
          return { ...message, content: this.truncateContent(message.content, maxSize) };
        default:
          return message;
      }
    }

    return message;
  }

  private applyFrequencyFilter(message: CommunicationEntry, filter: MessageFilter): CommunicationEntry | null {
    // Simple frequency limiting - in production, use more sophisticated rate limiting
    const recentMessages = this.getRecentMessages(message.fromAgent, 60000); // Last minute
    const maxMessages = filter.parameters?.maxPerMinute || 60;

    if (recentMessages.length >= maxMessages) {
      switch (filter.action) {
        case 'block':
          return null;
        case 'delay':
          // In a real implementation, this would delay the message
          return message;
        default:
          return message;
      }
    }

    return message;
  }

  private applySecurityFilter(message: CommunicationEntry, filter: MessageFilter): CommunicationEntry | null {
    // Basic security filtering - check for sensitive data patterns
    const contentStr = JSON.stringify(message.content);
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/ // SSN pattern
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(contentStr)) {
        switch (filter.action) {
          case 'block':
            return null;
          case 'modify':
            return { ...message, content: this.redactSensitiveData(message.content) };
          default:
            return message;
        }
      }
    }

    return message;
  }

  private async applyMessageTransformations(
    message: CommunicationEntry,
    route: MessageRoute
  ): Promise<CommunicationEntry> {
    let transformedMessage = message;

    for (const transformation of route.transformations) {
      transformedMessage = await this.applyTransformation(transformedMessage, transformation);
    }

    return transformedMessage;
  }

  private async applyTransformation(
    message: CommunicationEntry,
    transformation: MessageTransformation
  ): Promise<CommunicationEntry> {
    switch (transformation.type) {
      case 'format':
        return this.formatMessage(message, transformation.parameters);

      case 'compress':
        return this.compressMessage(message, transformation.parameters);

      case 'encrypt':
        return this.encryptMessage(message, transformation.parameters);

      case 'translate':
        return this.translateMessage(message, transformation.parameters);

      default:
        return message;
    }
  }

  private async queueMessage(message: CommunicationEntry, route: MessageRoute): Promise<void> {
    const queue = this.messageQueues.get(message.toAgent);
    if (!queue) {
      throw new WorkflowError(`No message queue for agent: ${message.toAgent}`, 'QUEUE_NOT_FOUND', 404);
    }

    // Check queue capacity
    if (queue.messages.length >= queue.maxSize) {
      // Remove oldest messages
      queue.messages.shift();
    }

    const queuedMessage: QueuedMessage = {
      id: uuidv4(),
      message,
      priority: this.determineMessagePriority(message),
      retryCount: 0,
      maxRetries: 3,
      queuedAt: new Date()
    };

    // Insert message based on priority
    this.insertMessageByPriority(queue, queuedMessage);

    console.log(`Message queued: ${message.id} for agent: ${message.toAgent}`);
  }

  private determineMessagePriority(message: CommunicationEntry): 'low' | 'normal' | 'high' | 'urgent' {
    switch (message.messageType) {
      case 'coordination':
        return 'high';
      case 'request':
        return 'normal';
      case 'response':
        return 'normal';
      case 'notification':
        return 'low';
      default:
        return 'normal';
    }
  }

  private insertMessageByPriority(queue: MessageQueue, message: QueuedMessage): void {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

    const insertIndex = queue.messages.findIndex(
      qm => priorityOrder[qm.priority] > priorityOrder[message.priority]
    );

    if (insertIndex === -1) {
      queue.messages.push(message);
    } else {
      queue.messages.splice(insertIndex, 0, message);
    }
  }

  private updateCommunicationStats(message: CommunicationEntry, latency: number): void {
    this.communicationStats.totalMessages++;

    // Update message type stats
    this.communicationStats.messagesByType[message.messageType] =
      (this.communicationStats.messagesByType[message.messageType] || 0) + 1;

    // Update agent stats
    this.communicationStats.messagesByAgent[message.fromAgent] =
      (this.communicationStats.messagesByAgent[message.fromAgent] || 0) + 1;

    // Update average latency
    this.communicationStats.averageLatency =
      (this.communicationStats.averageLatency * 0.9) + (latency * 0.1);

    // Update throughput (messages per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMessages = Array.from(this.messageHistory.values())
      .flat()
      .filter(m => m.timestamp.getTime() > oneMinuteAgo);

    this.communicationStats.throughput = recentMessages.length;
  }

  private recordMessage(message: CommunicationEntry): void {
    // Record for sender
    if (!this.messageHistory.has(message.fromAgent)) {
      this.messageHistory.set(message.fromAgent, []);
    }
    this.messageHistory.get(message.fromAgent)!.push(message);

    // Record for receiver
    if (!this.messageHistory.has(message.toAgent)) {
      this.messageHistory.set(message.toAgent, []);
    }
    this.messageHistory.get(message.toAgent)!.push(message);

    // Cleanup old messages (keep last 1000 per agent)
    for (const [agentId, messages] of this.messageHistory.entries()) {
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
    }
  }

  private getRecentMessages(agentId: string, timeWindow: number): CommunicationEntry[] {
    const messages = this.messageHistory.get(agentId) || [];
    const cutoff = Date.now() - timeWindow;

    return messages.filter(m => m.timestamp.getTime() > cutoff);
  }

  private sanitizeContent(content: any): any {
    // Simple content sanitization
    if (typeof content === 'string') {
      return content.replace(/[<>]/g, '');
    }
    return content;
  }

  private truncateContent(content: any, maxSize: number): any {
    const contentStr = JSON.stringify(content);
    if (contentStr.length <= maxSize) return content;

    return { truncated: true, content: contentStr.substring(0, maxSize - 50) + '...' };
  }

  private redactSensitiveData(content: any): any {
    let contentStr = JSON.stringify(content);

    // Redact patterns
    contentStr = contentStr.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED-CARD]');
    contentStr = contentStr.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
    contentStr = contentStr.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[REDACTED-SSN]');

    try {
      return JSON.parse(contentStr);
    } catch {
      return { redacted: true, content: contentStr };
    }
  }

  private formatMessage(message: CommunicationEntry, parameters: Record<string, any>): CommunicationEntry {
    // Format transformation based on parameters
    return message;
  }

  private compressMessage(message: CommunicationEntry, parameters: Record<string, any>): CommunicationEntry {
    // Compression transformation
    return message;
  }

  private encryptMessage(message: CommunicationEntry, parameters: Record<string, any>): CommunicationEntry {
    // Encryption transformation
    return message;
  }

  private translateMessage(message: CommunicationEntry, parameters: Record<string, any>): CommunicationEntry {
    // Translation transformation
    return message;
  }

  private async setupProtocolRoutes(
    agent: AgentDefinition,
    allAgents: AgentDefinition[],
    protocol: CommunicationProtocol,
    execution: WorkflowExecution
  ): Promise<void> {
    // Setup routes based on protocol type
    switch (protocol.type) {
      case 'direct':
        await this.setupDirectRoutes(agent, allAgents, protocol);
        break;

      case 'message_queue':
        await this.setupQueueRoutes(agent, allAgents, protocol);
        break;

      case 'event_driven':
        await this.setupEventRoutes(agent, allAgents, protocol);
        break;

      case 'consensus':
        await this.setupConsensusRoutes(agent, allAgents, protocol);
        break;
    }
  }

  private async setupDirectRoutes(
    agent: AgentDefinition,
    allAgents: AgentDefinition[],
    protocol: CommunicationProtocol
  ): Promise<void> {
    // Create direct routes to all other agents
    for (const otherAgent of allAgents) {
      if (otherAgent.id !== agent.id) {
        const route: MessageRoute = {
          fromAgent: agent.id,
          toAgent: otherAgent.id,
          protocol,
          messageTypes: ['request', 'response', 'notification'],
          filters: [],
          transformations: []
        };

        this.registerRoute(route);
      }
    }
  }

  private async setupQueueRoutes(
    agent: AgentDefinition,
    allAgents: AgentDefinition[],
    protocol: CommunicationProtocol
  ): Promise<void> {
    // Setup message queue based routing
    // Implementation would depend on specific queue requirements
  }

  private async setupEventRoutes(
    agent: AgentDefinition,
    allAgents: AgentDefinition[],
    protocol: CommunicationProtocol
  ): Promise<void> {
    // Setup event-driven communication
    // Implementation would depend on event system
  }

  private async setupConsensusRoutes(
    agent: AgentDefinition,
    allAgents: AgentDefinition[],
    protocol: CommunicationProtocol
  ): Promise<void> {
    // Setup consensus-based communication
    // Implementation would depend on consensus algorithm
  }

  private async initializeCollaborationSession(
    agents: AgentDefinition[],
    execution: WorkflowExecution
  ): Promise<void> {
    // Send initialization message to all agents
    const initMessage = {
      fromAgent: 'orchestrator',
      messageType: 'notification' as const,
      content: {
        action: 'initialize_collaboration',
        executionId: execution.id,
        participants: agents.map(a => a.id),
        protocols: agents.flatMap(a => a.communicationProtocols)
      },
      timestamp: new Date(),
      acknowledged: false
    };

    await this.broadcastMessage(initMessage, agents.map(a => a.id));
  }

  private initializeProtocolHandlers(): void {
    this.protocolHandlers.set('direct', new DirectProtocolHandler());
    this.protocolHandlers.set('message_queue', new MessageQueueProtocolHandler());
    this.protocolHandlers.set('event_driven', new EventDrivenProtocolHandler());
    this.protocolHandlers.set('consensus', new ConsensusProtocolHandler());
  }

  private startMessageProcessing(): void {
    // Start background message processing
    setInterval(() => {
      this.processMessageQueues();
    }, 1000); // Process every second
  }

  private async processMessageQueues(): Promise<void> {
    for (const [agentId, queue] of this.messageQueues.entries()) {
      await this.processQueue(queue);
    }
  }

  private async processQueue(queue: MessageQueue): Promise<void> {
    const now = Date.now();
    const messagesToProcess = Math.min(
      queue.messages.length,
      Math.ceil(queue.processingRate / 60) // Convert per-second rate to per-minute
    );

    for (let i = 0; i < messagesToProcess; i++) {
      const queuedMessage = queue.messages.shift();
      if (!queuedMessage) break;

      // Check if message should be processed now
      if (queuedMessage.processAfter && queuedMessage.processAfter.getTime() > now) {
        // Put back in queue for later processing
        queue.messages.unshift(queuedMessage);
        break;
      }

      try {
        await this.deliverMessage(queuedMessage);
      } catch (error) {
        console.error(`Message delivery failed: ${queuedMessage.id}`, error);

        // Retry logic
        if (queuedMessage.retryCount < queuedMessage.maxRetries) {
          queuedMessage.retryCount++;
          queuedMessage.processAfter = new Date(now + (queuedMessage.retryCount * 5000)); // Exponential backoff
          queue.messages.push(queuedMessage);
        }
      }
    }

    // Cleanup old messages
    const cutoff = now - queue.retentionTime;
    queue.messages = queue.messages.filter(qm => qm.queuedAt.getTime() > cutoff);
  }

  private async deliverMessage(queuedMessage: QueuedMessage): Promise<void> {
    const { message } = queuedMessage;
    const protocolHandler = this.protocolHandlers.get(message.messageType);

    if (protocolHandler) {
      await protocolHandler.deliver(message);
    } else {
      // Default delivery - just log
      console.log(`Message delivered: ${message.id} to ${message.toAgent}`);
    }
  }
}

// Protocol Handlers

interface ProtocolHandler {
  deliver(message: CommunicationEntry): Promise<void>;
}

class DirectProtocolHandler implements ProtocolHandler {
  async deliver(message: CommunicationEntry): Promise<void> {
    console.log(`Direct delivery: ${message.id}`);
    // Implementation would deliver directly to agent
  }
}

class MessageQueueProtocolHandler implements ProtocolHandler {
  async deliver(message: CommunicationEntry): Promise<void> {
    console.log(`Queue delivery: ${message.id}`);
    // Implementation would use message queue system
  }
}

class EventDrivenProtocolHandler implements ProtocolHandler {
  async deliver(message: CommunicationEntry): Promise<void> {
    console.log(`Event delivery: ${message.id}`);
    // Implementation would publish as event
  }
}

class ConsensusProtocolHandler implements ProtocolHandler {
  async deliver(message: CommunicationEntry): Promise<void> {
    console.log(`Consensus delivery: ${message.id}`);
    // Implementation would handle consensus protocol
  }
}