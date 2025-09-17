/**
 * AI Agent Memory Architecture Types
 * Comprehensive type definitions for persistent memory layer
 */

export interface MemoryContext {
  id: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  agentId: string;
  contextType: ContextType;
  content: MemoryContent;
  metadata: MemoryMetadata;
  relevanceScore: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MemoryContent {
  conversationHistory: ConversationEntry[];
  userPreferences: UserPreferences;
  businessContext: BusinessContext;
  taskHistory: TaskEntry[];
  insights: InsightEntry[];
  customData: Record<string, any>;
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  preferredLanguage: string;
  timezone: string;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface BusinessContext {
  businessId?: string;
  businessType: string;
  industry: string;
  location: string;
  goals: string[];
  challenges: string[];
  currentProjects: string[];
}

export interface TaskEntry {
  id: string;
  taskType: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  result?: any;
  timestamp: Date;
  relevanceScore: number;
}

export interface InsightEntry {
  id: string;
  type: 'recommendation' | 'observation' | 'prediction';
  content: string;
  confidence: number;
  source: string;
  timestamp: Date;
  relevanceScore: number;
}

export type ContextType = 
  | 'conversation'
  | 'user_profile'
  | 'business_analysis'
  | 'task_execution'
  | 'learning_insights';

export interface MemoryMetadata {
  version: string;
  source: string;
  tags: string[];
  accessCount: number;
  lastAccessed: Date;
  compressionLevel?: number;
  encryptionKey?: string;
}

export interface MemoryQuery {
  tenantId: string;
  userId?: string;
  sessionId?: string;
  agentId?: string;
  contextTypes?: ContextType[];
  timeRange?: TimeRange;
  relevanceThreshold?: number;
  limit?: number;
  tags?: string[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface MemoryOptimizationConfig {
  maxMemorySize: number; // in MB
  relevanceThreshold: number;
  retentionPeriod: number; // in days
  compressionEnabled: boolean;
  cleanupInterval: number; // in hours
}

export interface TenantConfig {
  tenantId: string;
  memoryQuota: number; // in MB
  retentionPolicy: RetentionPolicy;
  sharingPolicy: SharingPolicy;
  encryptionEnabled: boolean;
}

export interface RetentionPolicy {
  conversationHistory: number; // days
  userPreferences: number; // days
  businessContext: number; // days
  taskHistory: number; // days
  insights: number; // days
}

export interface SharingPolicy {
  allowCrossTenant: boolean;
  allowCrossUser: boolean;
  sharedContextTypes: ContextType[];
  isolatedContextTypes: ContextType[];
}

export interface MemoryStats {
  totalMemoryUsed: number; // in MB
  memoryByType: Record<ContextType, number>;
  memoryByUser: Record<string, number>;
  averageRelevanceScore: number;
  oldestEntry: Date;
  newestEntry: Date;
  compressionRatio?: number;
}

export interface MemoryOperation {
  operation: 'create' | 'read' | 'update' | 'delete' | 'cleanup';
  contextId: string;
  tenantId: string;
  userId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Lambda Event Types
export interface MemoryEvent {
  action: 'store' | 'retrieve' | 'update' | 'delete' | 'cleanup' | 'optimize';
  tenantId: string;
  userId?: string;
  sessionId?: string;
  agentId?: string;
  context?: Partial<MemoryContext>;
  query?: MemoryQuery;
  config?: MemoryOptimizationConfig;
}

export interface MemoryResponse {
  success: boolean;
  data?: MemoryContext | MemoryContext[] | MemoryStats | {
    deletedContexts: number;
    compressedContexts: number;
    memoryFreed: number;
  };
  error?: string;
  metadata?: {
    totalCount?: number;
    relevanceScores?: number[];
    cacheHit?: boolean;
    processingTime?: number;
  };
}

// Storage Provider Interfaces
export interface MemoryStorageProvider {
  store(context: MemoryContext): Promise<void>;
  retrieve(query: MemoryQuery): Promise<MemoryContext[]>;
  update(contextId: string, updates: Partial<MemoryContext>): Promise<void>;
  delete(contextId: string, tenantId: string): Promise<void>;
  cleanup(tenantId: string, config: MemoryOptimizationConfig): Promise<number>;
  getStats(tenantId: string): Promise<MemoryStats>;
}

export interface MemoryCacheProvider {
  get(key: string): Promise<MemoryContext | null>;
  set(key: string, context: MemoryContext, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  getByUser(tenantId: string, userId: string, limit?: number): Promise<MemoryContext[]>;
  getByTenant(tenantId: string, limit?: number): Promise<MemoryContext[]>;
  getCacheStats(): Promise<{ totalKeys: number; memoryUsage: string; hitRate?: number; }>;
}

// Error Types
export class MemoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class TenantQuotaExceededError extends MemoryError {
  constructor(tenantId: string, currentUsage: number, quota: number) {
    super(
      `Tenant ${tenantId} exceeded memory quota: ${currentUsage}MB / ${quota}MB`,
      'QUOTA_EXCEEDED',
      429
    );
  }
}

export class MemoryNotFoundError extends MemoryError {
  constructor(contextId: string) {
    super(`Memory context not found: ${contextId}`, 'NOT_FOUND', 404);
  }
}

export class InvalidMemoryQueryError extends MemoryError {
  constructor(reason: string) {
    super(`Invalid memory query: ${reason}`, 'INVALID_QUERY', 400);
  }
}