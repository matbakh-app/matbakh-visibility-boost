/**
 * Memory Manager - Core orchestration layer
 * Manages memory operations with caching, optimization, and multi-tenant isolation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MemoryContext,
  MemoryQuery,
  MemoryStats,
  MemoryStorageProvider,
  MemoryCacheProvider,
  MemoryOptimizationConfig,
  TenantConfig,
  MemoryError,
  ContextType,
  MemoryContent,
  MemoryMetadata,
  ConversationEntry,
  TaskEntry,
  InsightEntry
} from './types';

export class MemoryManager {
  private storage: MemoryStorageProvider;
  private cache: MemoryCacheProvider;
  private tenantConfigs: Map<string, TenantConfig> = new Map();

  constructor(
    storage: MemoryStorageProvider,
    cache: MemoryCacheProvider
  ) {
    this.storage = storage;
    this.cache = cache;
  }

  /**
   * Store a new memory context with automatic relevance scoring
   */
  async storeContext(
    tenantId: string,
    userId: string,
    sessionId: string,
    agentId: string,
    contextType: ContextType,
    content: Partial<MemoryContent>,
    metadata?: Partial<MemoryMetadata>
  ): Promise<MemoryContext> {
    const contextId = uuidv4();
    const now = new Date();

    // Calculate relevance score based on content and context type
    const relevanceScore = this.calculateRelevanceScore(contextType, content);

    // Build complete memory context
    const context: MemoryContext = {
      id: contextId,
      tenantId,
      userId,
      sessionId,
      agentId,
      contextType,
      content: this.buildCompleteContent(content),
      metadata: {
        version: '1.0',
        source: agentId,
        tags: metadata?.tags || [],
        accessCount: 0,
        lastAccessed: now,
        ...metadata
      },
      relevanceScore,
      createdAt: now,
      updatedAt: now,
      expiresAt: this.calculateExpirationDate(tenantId, contextType)
    };

    // Store in persistent storage
    await this.storage.store(context);

    // Cache for quick access
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    await this.cache.set(cacheKey, context, this.getCacheTTL(contextType));

    return context;
  }

  /**
   * Retrieve memory contexts with intelligent caching
   */
  async retrieveContexts(query: MemoryQuery): Promise<MemoryContext[]> {
    // Try cache first for single context queries
    if (query.userId && query.sessionId && query.limit === 1) {
      const cachedContexts = await this.cache.getByTenant(query.tenantId, 10);
      const userFiltered = cachedContexts.filter(ctx => ctx.userId === query.userId);
      if (userFiltered.length > 0) {
        const filtered = this.applyQueryFilters(userFiltered, query);
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }

    // Fallback to storage
    const contexts = await this.storage.retrieve(query);

    // Cache retrieved contexts for future access
    for (const context of contexts) {
      const cacheKey = this.buildCacheKey(context.tenantId, context.id);
      await this.cache.set(cacheKey, context, this.getCacheTTL(context.contextType));
    }

    return contexts;
  }

  /**
   * Update memory context with relevance recalculation
   */
  async updateContext(
    contextId: string,
    tenantId: string,
    updates: Partial<MemoryContext>
  ): Promise<void> {
    // Recalculate relevance score if content changed
    if (updates.content) {
      const contextType = updates.contextType || 'conversation';
      updates.relevanceScore = this.calculateRelevanceScore(contextType, updates.content);
    }

    updates.updatedAt = new Date();

    // Update in storage
    await this.storage.update(contextId, updates);

    // Update cache
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    const cachedContext = await this.cache.get(cacheKey);
    if (cachedContext) {
      const updatedContext = { ...cachedContext, ...updates };
      await this.cache.set(cacheKey, updatedContext, this.getCacheTTL(updatedContext.contextType));
    }
  }

  /**
   * Delete memory context from both storage and cache
   */
  async deleteContext(contextId: string, tenantId: string): Promise<void> {
    // Delete from storage
    await this.storage.delete(contextId, tenantId);

    // Delete from cache
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    await this.cache.delete(cacheKey);
  }

  /**
   * Add conversation entry to existing context
   */
  async addConversationEntry(
    contextId: string,
    tenantId: string,
    entry: Omit<ConversationEntry, 'id' | 'relevanceScore'>
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    let context = await this.cache.get(cacheKey);
    
    if (!context) {
      // Retrieve from storage if not in cache
      const contexts = await this.storage.retrieve({
        tenantId,
        limit: 1
      });
      context = contexts.find(c => c.id === contextId);
      
      if (!context) {
        throw new MemoryError(`Context not found: ${contextId}`, 'NOT_FOUND', 404);
      }
    }

    // Add new conversation entry
    const conversationEntry: ConversationEntry = {
      ...entry,
      id: uuidv4(),
      relevanceScore: this.calculateConversationRelevance(entry)
    };

    context.content.conversationHistory.push(conversationEntry);
    
    // Recalculate overall relevance score
    context.relevanceScore = this.calculateRelevanceScore(context.contextType, context.content);
    context.updatedAt = new Date();

    // Update both storage and cache
    await this.storage.update(contextId, {
      content: context.content,
      relevanceScore: context.relevanceScore,
      updatedAt: context.updatedAt
    });

    await this.cache.set(cacheKey, context, this.getCacheTTL(context.contextType));
  }

  /**
   * Add task entry to existing context
   */
  async addTaskEntry(
    contextId: string,
    tenantId: string,
    task: Omit<TaskEntry, 'id' | 'relevanceScore'>
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    let context = await this.cache.get(cacheKey);
    
    if (!context) {
      const contexts = await this.storage.retrieve({
        tenantId,
        limit: 1
      });
      context = contexts.find(c => c.id === contextId);
      
      if (!context) {
        throw new MemoryError(`Context not found: ${contextId}`, 'NOT_FOUND', 404);
      }
    }

    const taskEntry: TaskEntry = {
      ...task,
      id: uuidv4(),
      relevanceScore: this.calculateTaskRelevance(task)
    };

    context.content.taskHistory.push(taskEntry);
    context.relevanceScore = this.calculateRelevanceScore(context.contextType, context.content);
    context.updatedAt = new Date();

    await this.storage.update(contextId, {
      content: context.content,
      relevanceScore: context.relevanceScore,
      updatedAt: context.updatedAt
    });

    await this.cache.set(cacheKey, context, this.getCacheTTL(context.contextType));
  }

  /**
   * Add insight entry to existing context
   */
  async addInsightEntry(
    contextId: string,
    tenantId: string,
    insight: Omit<InsightEntry, 'id' | 'relevanceScore'>
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(tenantId, contextId);
    let context = await this.cache.get(cacheKey);
    
    if (!context) {
      const contexts = await this.storage.retrieve({
        tenantId,
        limit: 1
      });
      context = contexts.find(c => c.id === contextId);
      
      if (!context) {
        throw new MemoryError(`Context not found: ${contextId}`, 'NOT_FOUND', 404);
      }
    }

    const insightEntry: InsightEntry = {
      ...insight,
      id: uuidv4(),
      relevanceScore: insight.confidence * 0.8 // Base relevance on confidence
    };

    context.content.insights.push(insightEntry);
    context.relevanceScore = this.calculateRelevanceScore(context.contextType, context.content);
    context.updatedAt = new Date();

    await this.storage.update(contextId, {
      content: context.content,
      relevanceScore: context.relevanceScore,
      updatedAt: context.updatedAt
    });

    await this.cache.set(cacheKey, context, this.getCacheTTL(context.contextType));
  }

  /**
   * Optimize memory usage for a tenant
   */
  async optimizeMemory(tenantId: string, config?: MemoryOptimizationConfig): Promise<{
    deletedContexts: number;
    compressedContexts: number;
    memoryFreed: number;
  }> {
    const optimizationConfig = config || this.getDefaultOptimizationConfig();
    
    // Clean up old and low-relevance contexts
    const deletedCount = await this.storage.cleanup(tenantId, optimizationConfig);
    
    // Clear corresponding cache entries
    await this.cache.clear(`tenant:${tenantId}:*`);
    
    // Get updated stats
    const stats = await this.storage.getStats(tenantId);
    
    return {
      deletedContexts: deletedCount,
      compressedContexts: 0, // TODO: Implement compression
      memoryFreed: deletedCount * 0.1 // Rough estimate
    };
  }

  /**
   * Get memory statistics for a tenant
   */
  async getMemoryStats(tenantId: string): Promise<MemoryStats> {
    return await this.storage.getStats(tenantId);
  }

  /**
   * Configure tenant-specific settings
   */
  setTenantConfig(tenantId: string, config: TenantConfig): void {
    this.tenantConfigs.set(tenantId, config);
  }

  /**
   * Get tenant configuration
   */
  getTenantConfig(tenantId: string): TenantConfig | undefined {
    return this.tenantConfigs.get(tenantId);
  }

  // Private helper methods

  private calculateRelevanceScore(contextType: ContextType, content: Partial<MemoryContent>): number {
    let score = 0.5; // Base score

    switch (contextType) {
      case 'conversation':
        if (content.conversationHistory) {
          const avgConversationScore = content.conversationHistory.reduce(
            (sum, entry) => sum + (entry.relevanceScore || 0.5), 0
          ) / content.conversationHistory.length;
          score = avgConversationScore;
        }
        break;

      case 'user_profile':
        score = 0.9; // User profiles are highly relevant
        break;

      case 'business_analysis':
        score = 0.8; // Business context is important
        break;

      case 'task_execution':
        if (content.taskHistory) {
          const completedTasks = content.taskHistory.filter(t => t.status === 'completed').length;
          const totalTasks = content.taskHistory.length;
          score = totalTasks > 0 ? (completedTasks / totalTasks) * 0.9 + 0.1 : 0.5;
        }
        break;

      case 'learning_insights':
        if (content.insights) {
          const avgConfidence = content.insights.reduce(
            (sum, insight) => sum + insight.confidence, 0
          ) / content.insights.length;
          score = avgConfidence;
        }
        break;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateConversationRelevance(entry: Omit<ConversationEntry, 'id' | 'relevanceScore'>): number {
    let score = 0.5;

    // Boost score for longer, more detailed messages
    if (entry.content.length > 100) score += 0.2;
    if (entry.content.length > 500) score += 0.2;

    // Boost score for assistant responses (they contain valuable information)
    if (entry.role === 'assistant') score += 0.1;

    // Boost score for recent messages
    const ageInHours = (Date.now() - entry.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 1) score += 0.2;
    else if (ageInHours < 24) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateTaskRelevance(task: Omit<TaskEntry, 'id' | 'relevanceScore'>): number {
    let score = 0.5;

    // Boost score for completed tasks
    if (task.status === 'completed') score += 0.3;
    else if (task.status === 'in_progress') score += 0.1;

    // Boost score for recent tasks
    const ageInHours = (Date.now() - task.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) score += 0.2;
    else if (ageInHours < 168) score += 0.1; // 1 week

    return Math.max(0, Math.min(1, score));
  }

  private buildCompleteContent(partial: Partial<MemoryContent>): MemoryContent {
    return {
      conversationHistory: partial.conversationHistory || [],
      userPreferences: partial.userPreferences || {
        communicationStyle: 'casual',
        responseLength: 'detailed',
        preferredLanguage: 'en',
        timezone: 'UTC',
        notificationSettings: {
          email: true,
          push: false,
          frequency: 'daily'
        }
      },
      businessContext: partial.businessContext || {
        businessType: 'unknown',
        industry: 'unknown',
        location: 'unknown',
        goals: [],
        challenges: [],
        currentProjects: []
      },
      taskHistory: partial.taskHistory || [],
      insights: partial.insights || [],
      customData: partial.customData || {}
    };
  }

  private calculateExpirationDate(tenantId: string, contextType: ContextType): Date | undefined {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) return undefined;

    const retentionDays = config.retentionPolicy[contextType] || 30;
    return new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000));
  }

  private getCacheTTL(contextType: ContextType): number {
    switch (contextType) {
      case 'conversation': return 3600; // 1 hour
      case 'user_profile': return 86400; // 24 hours
      case 'business_analysis': return 43200; // 12 hours
      case 'task_execution': return 7200; // 2 hours
      case 'learning_insights': return 21600; // 6 hours
      default: return 3600;
    }
  }

  private buildCacheKey(tenantId: string, contextId: string): string {
    return `${tenantId}:${contextId}`;
  }

  private applyQueryFilters(contexts: MemoryContext[], query: MemoryQuery): MemoryContext[] {
    let filtered = contexts;

    if (query.contextTypes) {
      filtered = filtered.filter(c => query.contextTypes!.includes(c.contextType));
    }

    if (query.relevanceThreshold !== undefined) {
      filtered = filtered.filter(c => c.relevanceScore >= query.relevanceThreshold!);
    }

    if (query.timeRange) {
      filtered = filtered.filter(c => 
        c.createdAt >= query.timeRange!.start && c.createdAt <= query.timeRange!.end
      );
    }

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(c =>
        query.tags!.some(tag => c.metadata.tags.includes(tag))
      );
    }

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  private getDefaultOptimizationConfig(): MemoryOptimizationConfig {
    return {
      maxMemorySize: 100, // 100MB
      relevanceThreshold: 0.3,
      retentionPeriod: 30, // 30 days
      compressionEnabled: false,
      cleanupInterval: 24 // 24 hours
    };
  }
}