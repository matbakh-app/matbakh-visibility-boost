/**
 * Intelligent Database Connection Pool with Auto-Scaling
 * 
 * This module provides advanced connection pool management with:
 * - Dynamic scaling based on demand and performance metrics
 * - Health monitoring and automatic recovery
 * - Load balancing across multiple database instances
 * - Connection lifecycle management and optimization
 * - Performance analytics and alerting
 */

import { publishMetric } from '../monitoring';

// Connection pool configuration
export interface ConnectionPoolConfig {
  // Pool sizing
  minConnections: number;
  maxConnections: number;
  initialConnections: number;
  
  // Scaling behavior
  scaleUpThreshold: number; // Utilization percentage to trigger scale up
  scaleDownThreshold: number; // Utilization percentage to trigger scale down
  scaleUpIncrement: number; // Number of connections to add when scaling up
  scaleDownIncrement: number; // Number of connections to remove when scaling down
  scaleUpCooldown: number; // Milliseconds to wait before scaling up again
  scaleDownCooldown: number; // Milliseconds to wait before scaling down again
  
  // Timeouts and limits
  acquireTimeoutMs: number; // Max time to wait for a connection
  idleTimeoutMs: number; // Max time a connection can be idle
  maxLifetimeMs: number; // Max lifetime of a connection
  connectionTimeoutMs: number; // Database connection timeout
  
  // Health and monitoring
  healthCheckIntervalMs: number; // How often to check connection health
  maxRetries: number; // Max connection retry attempts
  retryDelayMs: number; // Delay between retry attempts
  
  // Database configuration
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxQueryTimeMs?: number;
  };
}

// Connection state
export interface DatabaseConnection {
  id: string;
  state: 'idle' | 'active' | 'connecting' | 'error' | 'closing';
  createdAt: number;
  lastUsed: number;
  totalQueries: number;
  totalErrors: number;
  averageQueryTimeMs: number;
  client?: any; // Database client instance
  healthScore: number; // 0-100, based on performance and errors
  processId?: number; // Database process ID for cancellation (PostgreSQL)
  activeQueries: Set<AbortController>; // Track active queries for cancellation
  _lastDegradeTs?: number; // Internal: timestamp of last health degradation for hysteresis
}

// Pool metrics
export interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  connectingConnections: number;
  errorConnections: number;
  waitingRequests: number;
  
  // Performance metrics
  averageAcquireTimeMs: number;
  averageQueryTimeMs: number;
  totalQueries: number;
  totalErrors: number;
  
  // Scaling metrics
  lastScaleUp?: number;
  lastScaleDown?: number;
  scaleUpCount: number;
  scaleDownCount: number;
  
  timestamp: number;
}

// Pool events
export interface PoolEvent {
  type: 'connection_created' | 'connection_destroyed' | 'connection_acquired' | 'connection_released' | 
        'scale_up' | 'scale_down' | 'health_check' | 'error' | 'warning';
  connectionId?: string;
  message: string;
  details?: any;
  timestamp: number;
}

class IntelligentConnectionPool {
  private config: ConnectionPoolConfig;
  private connections = new Map<string, DatabaseConnection>();
  private waitingQueue: Array<{
    resolve: (connection: DatabaseConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private maxQueueSize = 1000; // Prevent OOM under extreme load
  
  private metrics: ConnectionPoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    connectingConnections: 0,
    errorConnections: 0,
    waitingRequests: 0,
    averageAcquireTimeMs: 0,
    averageQueryTimeMs: 0,
    totalQueries: 0,
    totalErrors: 0,
    scaleUpCount: 0,
    scaleDownCount: 0,
    timestamp: Date.now()
  };
  
  private events: PoolEvent[] = [];
  private isInitialized = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  
  // Counters for running averages
  private acquireCount = 0;
  private queryCount = 0;
  
  private scalingCooldowns = {
    lastScaleUp: 0,
    lastScaleDown: 0
  };

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      minConnections: 5,
      maxConnections: 50,
      initialConnections: 10,
      scaleUpThreshold: 0.8, // 80% utilization
      scaleDownThreshold: 0.3, // 30% utilization
      scaleUpIncrement: 5,
      scaleDownIncrement: 2,
      scaleUpCooldown: 60000, // 1 minute
      scaleDownCooldown: 300000, // 5 minutes
      acquireTimeoutMs: 10000,
      idleTimeoutMs: 300000, // 5 minutes
      maxLifetimeMs: 3600000, // 1 hour
      connectionTimeoutMs: 5000,
      healthCheckIntervalMs: 30000, // 30 seconds
      maxRetries: 3,
      retryDelayMs: 1000,
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'matbakh',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        maxQueryTimeMs: 30000
      },
      ...config
    };
  }

  /**
   * Initialize the connection pool
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`Initializing connection pool with ${this.config.initialConnections} connections...`);
      
      // Create initial connections
      const connectionPromises = [];
      for (let i = 0; i < this.config.initialConnections; i++) {
        connectionPromises.push(this.createConnection());
      }
      
      await Promise.all(connectionPromises);
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      this.isInitialized = true;
      this.addEvent('connection_created', undefined, 
        `Pool initialized with ${this.connections.size} connections`);
      
      console.log(`Connection pool initialized successfully`);
      
    } catch (error) {
      console.error('Failed to initialize connection pool:', error);
      throw error;
    }
  }

  /**
   * Acquire a connection from the pool
   */
  public async acquire(): Promise<DatabaseConnection> {
    const startTime = Date.now();
    
    try {
      // Check for available idle connection
      const idleConnection = this.findIdleConnection();
      if (idleConnection) {
        idleConnection.state = 'active';
        idleConnection.lastUsed = Date.now();
        this.updateMetrics();
        
        const acquireTime = Date.now() - startTime;
        this.updateAverageAcquireTime(acquireTime);
        
        this.addEvent('connection_acquired', idleConnection.id, 
          `Connection acquired in ${acquireTime}ms`);
        
        return idleConnection;
      }

      // Try to scale up if needed and possible
      await this.checkAndScale();

      // Check queue overflow to prevent OOM
      if (this.waitingQueue.length >= this.maxQueueSize) {
        throw new Error(`Connection queue overflow: ${this.waitingQueue.length} >= ${this.maxQueueSize}`);
      }

      // Wait for connection to become available
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Remove from queue
          const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
          if (index >= 0) {
            this.waitingQueue.splice(index, 1);
          }
          
          this.metrics.waitingRequests = this.waitingQueue.length;
          reject(new Error(`Connection acquire timeout after ${this.config.acquireTimeoutMs}ms`));
        }, this.config.acquireTimeoutMs);

        this.waitingQueue.push({
          resolve: (connection) => {
            clearTimeout(timeout);
            const acquireTime = Date.now() - startTime;
            this.updateAverageAcquireTime(acquireTime);
            resolve(connection);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
          timestamp: startTime
        });

        this.metrics.waitingRequests = this.waitingQueue.length;
      });

    } catch (error) {
      this.metrics.totalErrors++;
      this.addEvent('error', undefined, `Failed to acquire connection: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  public async release(connection: DatabaseConnection): Promise<void> {
    try {
      if (connection.state === 'active') {
        connection.state = 'idle';
        connection.lastUsed = Date.now();
        
        // Serve waiting requests
        if (this.waitingQueue.length > 0) {
          const waiter = this.waitingQueue.shift()!;
          connection.state = 'active';
          waiter.resolve(connection);
          this.metrics.waitingRequests = this.waitingQueue.length;
        }
        
        this.updateMetrics();
        this.addEvent('connection_released', connection.id, 'Connection released to pool');
      }
    } catch (error) {
      this.addEvent('error', connection.id, `Failed to release connection: ${error.message}`, { error });
    }
  }

  /**
   * Execute query with automatic connection management
   */
  public async executeQuery<T>(
    query: string, 
    params: any[] = [],
    options: { timeout?: number; retries?: number } = {}
  ): Promise<T> {
    const connection = await this.acquire();
    const startTime = Date.now();
    
    try {
      // Execute query (mock implementation)
      const result = await this.executeQueryOnConnection<T>(connection, query, params, options);
      
      const queryTime = Date.now() - startTime;
      connection.totalQueries++;
      connection.averageQueryTimeMs = 
        ((connection.averageQueryTimeMs * (connection.totalQueries - 1)) + queryTime) / connection.totalQueries;
      
      this.metrics.totalQueries++;
      this.updateAverageQueryTime(queryTime);
      
      // Update connection health score
      this.updateConnectionHealth(connection, queryTime, false);
      
      // Check if connection should be replaced due to poor health
      this.replaceIfUnhealthy(connection);
      
      return result;
      
    } catch (error) {
      const queryTime = Date.now() - startTime;
      connection.totalErrors++;
      this.metrics.totalErrors++;
      
      // Update connection health score
      this.updateConnectionHealth(connection, queryTime, true);
      
      // Check if connection should be replaced due to poor health
      this.replaceIfUnhealthy(connection);
      
      throw error;
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Serve waiting requests from the queue
   */
  private serveWaitingQueue(): void {
    while (this.waitingQueue.length > 0) {
      const idle = this.findIdleConnection();
      if (!idle) break;
      
      const waiter = this.waitingQueue.shift()!;
      idle.state = 'active';
      idle.lastUsed = Date.now();
      waiter.resolve(idle);
    }
    this.metrics.waitingRequests = this.waitingQueue.length;
  }

  /**
   * Create a new database connection
   */
  private async createConnection(): Promise<DatabaseConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const connection: DatabaseConnection = {
      id: connectionId,
      state: 'connecting',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      totalQueries: 0,
      totalErrors: 0,
      averageQueryTimeMs: 0,
      healthScore: 100,
      activeQueries: new Set<AbortController>()
    };

    this.connections.set(connectionId, connection);

    try {
      // Create database client (mock implementation)
      connection.client = await this.createDatabaseClient();
      connection.state = 'idle';
      
      this.addEvent('connection_created', connectionId, 'New connection created successfully');
      
      // Serve waiting requests immediately after creating connection
      this.serveWaitingQueue();
      
      return connection;
      
    } catch (error) {
      connection.state = 'error';
      this.addEvent('error', connectionId, `Failed to create connection: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Create database client (mock implementation with abort support)
   */
  private async createDatabaseClient(): Promise<any> {
    // Simulate connection creation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      query: async (sql: string, params: any[], options?: { signal?: AbortSignal }) => {
        // Check for abort signal
        if (options?.signal?.aborted) {
          throw new Error('Query aborted');
        }

        // Mock query execution with abort support
        return new Promise((resolve, reject) => {
          const executionTime = Math.random() * 100 + 10;
          
          const timeoutId = setTimeout(() => {
            resolve({ rows: [], rowCount: 0 });
          }, executionTime);
          
          // Handle abort signal
          const abortHandler = () => {
            clearTimeout(timeoutId);
            reject(new Error('Query aborted'));
          };
          
          if (options?.signal) {
            if (options.signal.aborted) {
              clearTimeout(timeoutId);
              abortHandler();
              return;
            }
            
            options.signal.addEventListener('abort', abortHandler);
            
            // Cleanup listener when query completes
            const originalResolve = resolve;
            const originalReject = reject;
            
            resolve = (value: any) => {
              options.signal!.removeEventListener('abort', abortHandler);
              originalResolve(value);
            };
            
            reject = (reason: any) => {
              options.signal!.removeEventListener('abort', abortHandler);
              originalReject(reason);
            };
          }
        });
      },
      end: async () => {
        // Mock connection close
        await new Promise(resolve => setTimeout(resolve, 10));
      },
      cancel: async () => {
        // Mock query cancellation
        console.log('Mock: Cancelling active queries on connection');
      }
    };
  }

  /**
   * Execute query on specific connection with proper cancellation
   */
  private async executeQueryOnConnection<T>(
    connection: DatabaseConnection,
    query: string,
    params: any[],
    options: { timeout?: number; retries?: number }
  ): Promise<T> {
    const timeout = options.timeout || this.config.database.maxQueryTimeMs || 30000;
    const retries = options.retries || this.config.maxRetries;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
      
      // Track active query for potential cancellation
      connection.activeQueries.add(controller);
      
      try {
        // Set database-side timeout for PostgreSQL
        await this.setStatementTimeout(connection, timeout);
        
        // Execute query with AbortController signal
        const result = await this.executeQueryWithCancellation<T>(
          connection, 
          query, 
          params, 
          controller.signal
        );
        
        clearTimeout(timeoutId);
        connection.activeQueries.delete(controller);
        return result;
        
      } catch (error) {
        clearTimeout(timeoutId);
        connection.activeQueries.delete(controller);
        lastError = error as Error;
        
        // If query was aborted, try to cancel it on the database side
        if (controller.signal.aborted) {
          await this.cancelQuery(connection);
          lastError = new Error(`Query timeout after ${timeout}ms`);
        }
        
        if (attempt < retries) {
          // Exponential backoff with jitter
          const backoffMs = this.config.retryDelayMs * Math.pow(2, attempt);
          const jitterMs = Math.floor(Math.random() * 100);
          await new Promise(resolve => setTimeout(resolve, backoffMs + jitterMs));
        }
      }
    }
    
    throw lastError || new Error('Query failed after all retries');
  }

  /**
   * Set statement timeout for PostgreSQL connections
   */
  private async setStatementTimeout(connection: DatabaseConnection, timeoutMs: number): Promise<void> {
    try {
      // Convert to seconds for PostgreSQL
      const timeoutSeconds = Math.ceil(timeoutMs / 1000);
      
      // Set local statement timeout (only affects current transaction/query)
      await connection.client.query(`SET LOCAL statement_timeout = '${timeoutSeconds}s'`);
    } catch (error) {
      // Ignore errors if database doesn't support statement_timeout
      console.warn('Failed to set statement timeout:', error);
    }
  }

  /**
   * Execute query with proper cancellation support
   */
  private async executeQueryWithCancellation<T>(
    connection: DatabaseConnection,
    query: string,
    params: any[],
    signal: AbortSignal
  ): Promise<T> {
    // Check if already aborted
    if (signal.aborted) {
      throw new Error('Query was aborted before execution');
    }

    // For real PostgreSQL client (pg), you would pass the signal:
    // return await connection.client.query(query, params, { signal });
    
    // Mock implementation with abort support
    return new Promise<T>((resolve, reject) => {
      // Handle abort signal
      const abortHandler = () => {
        reject(new Error('Query was aborted'));
      };
      
      if (signal.aborted) {
        abortHandler();
        return;
      }
      
      signal.addEventListener('abort', abortHandler);
      
      // Simulate query execution
      const queryPromise = connection.client.query(query, params);
      
      queryPromise
        .then((result: T) => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch((error: Error) => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  /**
   * Cancel running query on database connection
   */
  private async cancelQuery(connection: DatabaseConnection): Promise<void> {
    try {
      // For PostgreSQL with pg library, you would use:
      // await connection.client.cancel();
      
      // Or send a cancel request through a separate connection:
      // const cancelClient = new Client(this.config.database);
      // await cancelClient.connect();
      // await cancelClient.query('SELECT pg_cancel_backend($1)', [connection.processId]);
      // await cancelClient.end();
      
      console.log(`Attempting to cancel query on connection ${connection.id}`);
      
      // Mock cancellation - in real implementation, this would send
      // a cancellation request to the database server
      if (connection.client?.cancel) {
        await connection.client.cancel();
      }
      
    } catch (error) {
      console.warn('Failed to cancel query:', error);
    }
  }

  /**
   * Cancel all active queries on a connection
   */
  public async cancelAllQueries(connection: DatabaseConnection): Promise<void> {
    console.log(`Cancelling ${connection.activeQueries.size} active queries on connection ${connection.id}`);
    
    // Abort all active queries
    for (const controller of connection.activeQueries) {
      controller.abort();
    }
    
    // Clear the set
    connection.activeQueries.clear();
    
    // Also try to cancel on database side
    await this.cancelQuery(connection);
  }

  /**
   * Find an available idle connection
   */
  private findIdleConnection(): DatabaseConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.state === 'idle' && connection.healthScore > 50) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Check if scaling is needed and perform scaling
   */
  private async checkAndScale(): Promise<void> {
    const now = Date.now();
    const utilization = this.calculateUtilization();
    
    // Scale up if utilization is high
    if (utilization > this.config.scaleUpThreshold && 
        this.connections.size < this.config.maxConnections &&
        now - this.scalingCooldowns.lastScaleUp > this.config.scaleUpCooldown) {
      
      await this.scaleUp();
    }
    
    // Scale down if utilization is low
    else if (utilization < this.config.scaleDownThreshold && 
             this.connections.size > this.config.minConnections &&
             now - this.scalingCooldowns.lastScaleDown > this.config.scaleDownCooldown) {
      
      await this.scaleDown();
    }
  }

  /**
   * Scale up the connection pool
   */
  private async scaleUp(): Promise<void> {
    const connectionsToAdd = Math.min(
      this.config.scaleUpIncrement,
      this.config.maxConnections - this.connections.size
    );
    
    if (connectionsToAdd <= 0) return;
    
    try {
      const promises = [];
      for (let i = 0; i < connectionsToAdd; i++) {
        promises.push(this.createConnection());
      }
      
      await Promise.all(promises);
      
      // Serve waiting requests immediately after scaling up
      this.serveWaitingQueue();
      
      this.scalingCooldowns.lastScaleUp = Date.now();
      this.metrics.scaleUpCount++;
      this.metrics.lastScaleUp = Date.now();
      
      this.addEvent('scale_up', undefined, 
        `Scaled up by ${connectionsToAdd} connections (total: ${this.connections.size})`);
      
      // Record scaling metric
      await publishMetric({
        metricName: 'db_connection_pool_scale_up',
        value: connectionsToAdd,
        unit: 'Count',
        dimensions: {
          Service: 'DatabaseConnectionPool',
          Environment: process.env.NODE_ENV || 'development',
          TotalConnections: this.connections.size.toString(),
          Utilization: (this.calculateUtilization() * 100).toFixed(1)
        }
      });
      
    } catch (error) {
      this.addEvent('error', undefined, `Failed to scale up: ${error.message}`, { error });
    }
  }

  /**
   * Scale down the connection pool
   */
  private async scaleDown(): Promise<void> {
    const connectionsToRemove = Math.min(
      this.config.scaleDownIncrement,
      this.connections.size - this.config.minConnections
    );
    
    if (connectionsToRemove <= 0) return;
    
    try {
      // Find connections to remove (prefer oldest idle connections with low health scores)
      const candidates = Array.from(this.connections.values())
        .filter(conn => conn.state === 'idle')
        .sort((a, b) => {
          // Sort by health score (ascending) then by age (ascending - oldest first)
          if (a.healthScore !== b.healthScore) {
            return a.healthScore - b.healthScore;
          }
          return a.createdAt - b.createdAt; // älteste zuerst
        })
        .slice(0, connectionsToRemove);
      
      for (const connection of candidates) {
        await this.destroyConnection(connection);
      }
      
      this.scalingCooldowns.lastScaleDown = Date.now();
      this.metrics.scaleDownCount++;
      this.metrics.lastScaleDown = Date.now();
      
      this.addEvent('scale_down', undefined, 
        `Scaled down by ${candidates.length} connections (total: ${this.connections.size})`);
      
      // Record scaling metric
      await publishMetric({
        metricName: 'db_connection_pool_scale_down',
        value: candidates.length,
        unit: 'Count',
        dimensions: {
          Service: 'DatabaseConnectionPool',
          Environment: process.env.NODE_ENV || 'development',
          TotalConnections: this.connections.size.toString(),
          Utilization: (this.calculateUtilization() * 100).toFixed(1)
        }
      });
      
    } catch (error) {
      this.addEvent('error', undefined, `Failed to scale down: ${error.message}`, { error });
    }
  }

  /**
   * Destroy a connection
   */
  private async destroyConnection(connection: DatabaseConnection): Promise<void> {
    try {
      connection.state = 'closing';
      
      // Cancel all active queries first
      await this.cancelAllQueries(connection);
      
      if (connection.client) {
        await connection.client.end();
      }
      
      this.connections.delete(connection.id);
      this.addEvent('connection_destroyed', connection.id, 'Connection destroyed');
      
    } catch (error) {
      this.addEvent('error', connection.id, `Failed to destroy connection: ${error.message}`, { error });
    }
  }

  /**
   * Calculate current pool utilization
   */
  private calculateUtilization(): number {
    const totalConnections = this.connections.size;
    if (totalConnections === 0) return 0;
    
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.state === 'active').length;
    
    return activeConnections / totalConnections;
  }

  /**
   * Update connection health score with smooth EMA and hysteresis
   */
  private updateConnectionHealth(connection: DatabaseConnection, queryTimeMs: number, hasError: boolean): void {
    const alpha = 0.1; // EMA smoothing factor
    
    // Calculate target health score based on current event
    const target = Math.max(0, Math.min(100,
      hasError 
        ? connection.healthScore - 15 
        : connection.healthScore + (queryTimeMs < 100 ? 2 : queryTimeMs > 1000 ? -5 : 0)
    ));
    
    // Apply exponential moving average for smooth transitions
    connection.healthScore = (1 - alpha) * connection.healthScore + alpha * target;
  }

  /**
   * Check if connection should be replaced due to poor health (with hysteresis)
   */
  private replaceIfUnhealthy(connection: DatabaseConnection): void {
    const now = Date.now();
    const gracePeriodMs = 30_000; // 30 seconds grace period
    const lastDegradeTs = connection._lastDegradeTs ?? 0;
    
    if (connection.healthScore < 30 && now - lastDegradeTs > gracePeriodMs) {
      connection._lastDegradeTs = now;
      this.addEvent('warning', connection.id, 
        `Health degraded (${connection.healthScore.toFixed(1)}), scheduling replacement`);
      connection.state = 'error';
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health check on all connections
   */
  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    const connectionsToCheck = Array.from(this.connections.values());
    
    for (const connection of connectionsToCheck) {
      try {
        // Check for idle timeout
        if (connection.state === 'idle' && 
            now - connection.lastUsed > this.config.idleTimeoutMs) {
          
          this.addEvent('warning', connection.id, 'Connection idle timeout, destroying');
          await this.destroyConnection(connection);
          continue;
        }
        
        // Check for max lifetime
        if (now - connection.createdAt > this.config.maxLifetimeMs) {
          this.addEvent('warning', connection.id, 'Connection max lifetime reached, destroying');
          await this.destroyConnection(connection);
          continue;
        }
        
        // Check connection health
        if (connection.state === 'idle' && connection.healthScore < 20) {
          this.addEvent('warning', connection.id, 'Connection health critical, destroying');
          await this.destroyConnection(connection);
          continue;
        }
        
        // Ping connection if idle for too long
        if (connection.state === 'idle' && 
            now - connection.lastUsed > this.config.healthCheckIntervalMs * 2) {
          
          try {
            await connection.client?.query('SELECT 1');
            connection.healthScore = Math.min(100, connection.healthScore + 5);
          } catch (error) {
            connection.healthScore = Math.max(0, connection.healthScore - 20);
            this.addEvent('warning', connection.id, 'Health check failed', { error });
          }
        }
        
      } catch (error) {
        this.addEvent('error', connection.id, `Health check error: ${error.message}`, { error });
      }
    }
    
    this.addEvent('health_check', undefined, 
      `Health check completed for ${connectionsToCheck.length} connections`);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      this.updateMetrics();
      await this.publishMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(): void {
    const connections = Array.from(this.connections.values());
    
    this.metrics.totalConnections = connections.length;
    this.metrics.activeConnections = connections.filter(c => c.state === 'active').length;
    this.metrics.idleConnections = connections.filter(c => c.state === 'idle').length;
    this.metrics.connectingConnections = connections.filter(c => c.state === 'connecting').length;
    this.metrics.errorConnections = connections.filter(c => c.state === 'error').length;
    this.metrics.waitingRequests = this.waitingQueue.length;
    this.metrics.timestamp = Date.now();
  }

  /**
   * Publish metrics to CloudWatch
   */
  private async publishMetrics(): Promise<void> {
    try {
      const utilization = this.calculateUtilization();
      
      const commonDimensions = {
        Service: 'DatabaseConnectionPool',
        Environment: process.env.NODE_ENV || 'development',
        PoolInstance: 'default'
      };

      await Promise.all([
        publishMetric({
          metricName: 'db_connection_pool_total',
          value: this.metrics.totalConnections,
          unit: 'Count',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_connection_pool_active',
          value: this.metrics.activeConnections,
          unit: 'Count',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_connection_pool_utilization',
          value: utilization,
          unit: 'Percent',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_connection_pool_waiting',
          value: this.metrics.waitingRequests,
          unit: 'Count',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_connection_pool_avg_query_time',
          value: this.metrics.averageQueryTimeMs,
          unit: 'Milliseconds',
          dimensions: commonDimensions
        })
      ]);
    } catch (error) {
      console.warn('Failed to publish connection pool metrics:', error);
    }
  }

  /**
   * Update average acquire time using running average
   */
  private updateAverageAcquireTime(acquireTimeMs: number): void {
    this.acquireCount++;
    this.metrics.averageAcquireTimeMs = 
      ((this.metrics.averageAcquireTimeMs * (this.acquireCount - 1)) + acquireTimeMs) / this.acquireCount;
  }

  /**
   * Update average query time using running average
   */
  private updateAverageQueryTime(queryTimeMs: number): void {
    this.queryCount++;
    this.metrics.averageQueryTimeMs = 
      ((this.metrics.averageQueryTimeMs * (this.queryCount - 1)) + queryTimeMs) / this.queryCount;
  }

  /**
   * Add event to history
   */
  private addEvent(
    type: PoolEvent['type'], 
    connectionId: string | undefined, 
    message: string, 
    details?: any
  ): void {
    this.events.push({
      type,
      connectionId,
      message,
      details,
      timestamp: Date.now()
    });
    
    // Keep only recent events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Public API methods
   */
  public getMetrics(): ConnectionPoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  public getConnections(): DatabaseConnection[] {
    return Array.from(this.connections.values());
  }

  public getEvents(): PoolEvent[] {
    return [...this.events];
  }

  public getHealthStatus() {
    const connections = Array.from(this.connections.values());
    
    if (connections.length === 0) {
      return {
        status: 'degraded',
        totalConnections: 0,
        healthyConnections: 0,
        utilization: 0,
        waitingRequests: this.waitingQueue.length,
        averageHealthScore: 0
      };
    }
    
    const healthyConnections = connections.filter(c => c.healthScore > 70).length;
    const utilization = this.calculateUtilization();
    
    return {
      status: healthyConnections / connections.length > 0.8 ? 'healthy' : 'degraded',
      totalConnections: connections.length,
      healthyConnections,
      utilization: utilization * 100,
      waitingRequests: this.waitingQueue.length,
      averageHealthScore: connections.reduce((sum, c) => sum + c.healthScore, 0) / connections.length
    };
  }

  /**
   * Shutdown the connection pool
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down connection pool...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Reject all waiting requests
    this.waitingQueue.forEach(waiter => {
      waiter.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingQueue = [];
    
    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(connection => 
      this.destroyConnection(connection)
    );
    
    await Promise.all(closePromises);
    
    this.isInitialized = false;
    console.log('Connection pool shutdown complete');
  }
}

// Global connection pool instance
export const connectionPool = new IntelligentConnectionPool();

// Export for manual usage
export { IntelligentConnectionPool };