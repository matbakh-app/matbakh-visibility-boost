/**
 * Performance & Reliability Orchestrator
 * 
 * Main orchestrator that integrates all performance and reliability systems
 * Provides unified interface for monitoring, queuing, caching, and degradation
 */

import { performanceMonitor, PerformanceMetrics } from './performance-monitoring';
import { requestQueue, QueuedRequest } from './request-queue-system';
import { responseCache } from './response-cache-system';
import { gracefulDegradation, FallbackResponse } from './graceful-degradation';

export interface ReliabilityConfig {
  enablePerformanceMonitoring: boolean;
  enableRequestQueuing: boolean;
  enableResponseCaching: boolean;
  enableGracefulDegradation: boolean;
  maxResponseTimeMs: number;
  queueThreshold: number;
  cacheDefaultTtlHours: number;
}

export interface ProcessingResult {
  success: boolean;
  response?: any;
  error?: Error;
  metadata: {
    processingTime: number;
    fromCache: boolean;
    fromQueue: boolean;
    degraded: boolean;
    tokenCount?: number;
  };
}

export class PerformanceReliabilityOrchestrator {
  private config: ReliabilityConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
      enableRequestQueuing: process.env.ENABLE_REQUEST_QUEUING !== 'false',
      enableResponseCaching: process.env.ENABLE_RESPONSE_CACHING !== 'false',
      enableGracefulDegradation: process.env.ENABLE_GRACEFUL_DEGRADATION !== 'false',
      maxResponseTimeMs: parseInt(process.env.MAX_RESPONSE_TIME_MS || '30000'),
      queueThreshold: parseInt(process.env.QUEUE_THRESHOLD || '50'),
      cacheDefaultTtlHours: parseInt(process.env.CACHE_DEFAULT_TTL_HOURS || '24')
    };
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing Performance & Reliability Orchestrator...');

    // Start request queue processing if enabled
    if (this.config.enableRequestQueuing) {
      requestQueue.startProcessing(this.processQueuedRequest.bind(this));
      console.log('Request queue processing started');
    }

    // Initialize cache warmup if enabled
    if (this.config.enableResponseCaching) {
      await this.warmupCache();
      console.log('Response cache initialized');
    }

    this.isInitialized = true;
    console.log('Performance & Reliability Orchestrator initialized successfully');
  }

  /**
   * Process a request with full performance and reliability features
   */
  async processRequest(
    requestId: string,
    operation: string,
    payload: any,
    processingFunction: (payload: any) => Promise<any>,
    options: {
      userId?: string;
      personaType?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      bypassCache?: boolean;
      timeoutMs?: number;
    } = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    let metrics: PerformanceMetrics | undefined;

    try {
      // Start performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        metrics = performanceMonitor.startRequest(requestId, operation);
      }

      // Check for cached response first (unless bypassed)
      if (this.config.enableResponseCaching && !options.bypassCache) {
        const cachedResponse = await responseCache.getCachedResponse(
          operation,
          payload,
          options.userId,
          options.personaType
        );

        if (cachedResponse) {
          const processingTime = Date.now() - startTime;
          
          // Complete monitoring
          if (metrics) {
            await performanceMonitor.completeRequest(
              requestId,
              true,
              undefined,
              cachedResponse.metadata.tokenCount,
              true
            );
          }

          return {
            success: true,
            response: cachedResponse.response,
            metadata: {
              processingTime,
              fromCache: true,
              fromQueue: false,
              degraded: false,
              tokenCount: cachedResponse.metadata.tokenCount
            }
          };
        }
      }

      // Check if we should queue the request
      if (this.config.enableRequestQueuing && this.shouldQueueRequest()) {
        const queued = await requestQueue.enqueueRequest(
          requestId,
          operation,
          payload,
          options.priority,
          options.userId,
          options.timeoutMs
        );

        if (queued) {
          return {
            success: true,
            response: {
              queued: true,
              message: 'Request queued for processing',
              estimatedWaitTime: await this.estimateWaitTime()
            },
            metadata: {
              processingTime: Date.now() - startTime,
              fromCache: false,
              fromQueue: true,
              degraded: false
            }
          };
        }
      }

      // Check if service should be degraded
      if (this.config.enableGracefulDegradation && gracefulDegradation.shouldDegrade()) {
        const fallbackResponse = await gracefulDegradation.getFallbackResponse(
          operation,
          payload,
          new Error('Service degraded'),
          options.userId,
          options.personaType
        );

        const processingTime = Date.now() - startTime;

        // Complete monitoring
        if (metrics) {
          await performanceMonitor.completeRequest(requestId, true, 'degraded');
        }

        return {
          success: true,
          response: fallbackResponse.response,
          metadata: {
            processingTime,
            fromCache: fallbackResponse.type === 'cached',
            fromQueue: false,
            degraded: true
          }
        };
      }

      // Process the request normally
      const response = await this.executeWithTimeout(
        processingFunction(payload),
        options.timeoutMs || this.config.maxResponseTimeMs
      );

      const processingTime = Date.now() - startTime;

      // Cache the response
      if (this.config.enableResponseCaching) {
        await responseCache.cacheResponse(
          operation,
          payload,
          response,
          {
            processingTime,
            userId: options.userId,
            personaType: options.personaType,
            tokenCount: this.extractTokenCount(response)
          },
          this.config.cacheDefaultTtlHours
        );
      }

      // Record success
      if (this.config.enableGracefulDegradation) {
        gracefulDegradation.recordSuccess(operation);
      }

      // Complete monitoring
      if (metrics) {
        await performanceMonitor.completeRequest(
          requestId,
          true,
          undefined,
          this.extractTokenCount(response),
          false
        );
      }

      return {
        success: true,
        response,
        metadata: {
          processingTime,
          fromCache: false,
          fromQueue: false,
          degraded: false,
          tokenCount: this.extractTokenCount(response)
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const err = error as Error;

      // Record failure
      if (this.config.enableGracefulDegradation) {
        gracefulDegradation.recordFailure(operation, err);
      }

      // Complete monitoring
      if (metrics) {
        await performanceMonitor.completeRequest(requestId, false, err.name);
      }

      // Try to get fallback response
      if (this.config.enableGracefulDegradation) {
        const fallbackResponse = await gracefulDegradation.getFallbackResponse(
          operation,
          payload,
          err,
          options.userId,
          options.personaType
        );

        return {
          success: false,
          response: fallbackResponse.response,
          error: err,
          metadata: {
            processingTime,
            fromCache: fallbackResponse.type === 'cached',
            fromQueue: false,
            degraded: true
          }
        };
      }

      return {
        success: false,
        error: err,
        metadata: {
          processingTime,
          fromCache: false,
          fromQueue: false,
          degraded: false
        }
      };
    }
  }

  /**
   * Process queued request
   */
  private async processQueuedRequest(request: QueuedRequest): Promise<any> {
    console.log(`Processing queued request: ${request.requestId}`);
    
    // This would call the actual processing function
    // For now, return a placeholder
    return {
      processed: true,
      requestId: request.requestId,
      operation: request.operation,
      timestamp: Date.now()
    };
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Check if request should be queued
   */
  private shouldQueueRequest(): boolean {
    if (!this.config.enableRequestQueuing) {
      return false;
    }

    return requestQueue.shouldQueueRequest() || 
           performanceMonitor.getQueueDepth() >= this.config.queueThreshold;
  }

  /**
   * Estimate wait time for queued requests
   */
  private async estimateWaitTime(): Promise<number> {
    const queueStats = await requestQueue.getQueueStats();
    const avgProcessingTime = 15000; // 15 seconds average
    
    return queueStats.queued * avgProcessingTime;
  }

  /**
   * Extract token count from response
   */
  private extractTokenCount(response: any): number | undefined {
    if (response && typeof response === 'object') {
      return response.tokenCount || response.usage?.total_tokens;
    }
    return undefined;
  }

  /**
   * Warm up cache with common requests
   */
  private async warmupCache(): Promise<void> {
    const commonRequests = [
      {
        operation: 'vc-analysis',
        payload: { businessType: 'restaurant', category: 'italian' }
      },
      {
        operation: 'persona-detection',
        payload: { responses: ['quick', 'efficient'] }
      },
      {
        operation: 'content-generation',
        payload: { type: 'social-media', category: 'restaurant' }
      }
    ];

    await responseCache.warmupCache(commonRequests);
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    performance: any;
    queue: any;
    cache: any;
    degradation: any;
    overall: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const performanceStats = performanceMonitor.getPerformanceSummary();
    const queueStats = requestQueue.getQueueStats();
    const cacheStats = responseCache.getCacheStats();
    const degradationStats = gracefulDegradation.getDegradationStats();

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (degradationStats.circuitBreakerOpen || degradationStats.failureRate > 0.1) {
      overall = 'unhealthy';
    } else if (degradationStats.degradationLevel !== 'none' || queueStats.queued > 50) {
      overall = 'degraded';
    }

    return {
      performance: performanceStats,
      queue: queueStats,
      cache: cacheStats,
      degradation: degradationStats,
      overall
    };
  }

  /**
   * Shutdown orchestrator gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Performance & Reliability Orchestrator...');

    if (this.config.enableRequestQueuing) {
      requestQueue.stopProcessing();
    }

    // Wait for processing requests to complete
    let attempts = 0;
    while (performanceMonitor.getQueueDepth() > 0 && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    this.isInitialized = false;
    console.log('Performance & Reliability Orchestrator shutdown complete');
  }

  /**
   * Get configuration
   */
  getConfig(): ReliabilityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ReliabilityConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('Configuration updated:', updates);
  }
}

// Singleton instance
export const performanceReliabilityOrchestrator = new PerformanceReliabilityOrchestrator();