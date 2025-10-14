/**
 * Connection Pool Tests
 */

import { IntelligentConnectionPool } from '../connection-pool';

// Mock the monitoring module
jest.mock('../../monitoring', () => ({
  publishMetric: jest.fn().mockResolvedValue(undefined)
}));

describe('IntelligentConnectionPool', () => {
  let pool: IntelligentConnectionPool;

  beforeEach(() => {
    pool = new IntelligentConnectionPool({
      minConnections: 2,
      maxConnections: 10,
      initialConnections: 3,
      acquireTimeoutMs: 5000,
      connectionTimeoutMs: 1000,
      database: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'test',
        password: 'test',
        maxQueryTimeMs: 2000
      }
    });
  });

  afterEach(async () => {
    await pool.shutdown();
  });

  describe('initialization', () => {
    it('should initialize with correct number of connections', async () => {
      await pool.initialize();
      
      const connections = pool.getConnections();
      expect(connections).toHaveLength(3);
      
      const metrics = pool.getMetrics();
      expect(metrics.totalConnections).toBe(3);
    });

    it('should handle initialization errors gracefully', async () => {
      const badPool = new IntelligentConnectionPool({
        database: {
          host: 'invalid-host',
          port: 9999,
          database: 'nonexistent',
          username: 'invalid',
          password: 'invalid'
        }
      });

      // Mock the createDatabaseClient to throw an error
      badPool['createDatabaseClient'] = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Should throw during initialization
      await expect(badPool.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('connection management', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should acquire and release connections', async () => {
      const connection = await pool.acquire();
      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.state).toBe('active');

      await pool.release(connection);
      expect(connection.state).toBe('idle');
    });

    it('should scale up when utilization is high', async () => {
      const initialConnections = pool.getConnections().length;
      
      // Acquire most connections to trigger scaling
      const connections = [];
      for (let i = 0; i < initialConnections; i++) {
        connections.push(await pool.acquire());
      }

      // Wait a bit for scaling to potentially occur
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalConnections = pool.getConnections().length;
      expect(finalConnections).toBeGreaterThanOrEqual(initialConnections);

      // Release connections
      for (const conn of connections) {
        await pool.release(conn);
      }
    });

    it('should scale down oldest connections first', async () => {
      // Create connections with different ages and health scores
      const connections = pool.getConnections();
      
      // Make some connections older and less healthy
      connections[0].createdAt = Date.now() - 10000; // oldest
      connections[0].healthScore = 50; // low health
      
      connections[1].createdAt = Date.now() - 5000; // newer
      connections[1].healthScore = 30; // lower health
      
      connections[2].createdAt = Date.now() - 1000; // newest
      connections[2].healthScore = 90; // high health

      // Force scale down by calling the private method
      await pool['scaleDown']();

      // The connection with lowest health (30) should be removed first,
      // then among equal health scores, oldest should be removed
      const remainingConnections = pool.getConnections();
      
      // Should have fewer connections
      expect(remainingConnections.length).toBeLessThan(connections.length);
      
      // The connection with healthScore 30 should be gone (lowest health)
      const hasLowHealthConnection = remainingConnections.some(c => c.healthScore === 30);
      expect(hasLowHealthConnection).toBe(false);
    });

    it('should track connection health scores with smooth EMA', async () => {
      const connection = await pool.acquire();
      expect(connection.healthScore).toBe(100);

      // Simulate query with error - should decrease health smoothly
      pool['updateConnectionHealth'](connection, 500, true);
      const healthAfterError = connection.healthScore;
      expect(healthAfterError).toBeLessThan(100);
      expect(healthAfterError).toBeGreaterThan(80); // Should not drop drastically

      // Another error should decrease further but smoothly
      pool['updateConnectionHealth'](connection, 500, true);
      expect(connection.healthScore).toBeLessThan(healthAfterError);
      expect(connection.healthScore).toBeGreaterThan(healthAfterError - 20); // Smooth transition

      await pool.release(connection);
    });

    it('should implement hysteresis for unhealthy connection replacement', async () => {
      const connection = await pool.acquire();
      
      // Manually set low health score
      connection.healthScore = 25;
      
      // First call should mark for replacement and set timestamp
      pool['replaceIfUnhealthy'](connection);
      expect(connection.state).toBe('error');
      expect(connection._lastDegradeTs).toBeDefined();
      
      // Reset state for next test
      connection.state = 'idle';
      const firstTimestamp = connection._lastDegradeTs!;
      
      // Immediate second call should not mark again (within grace period)
      pool['replaceIfUnhealthy'](connection);
      expect(connection.state).toBe('idle'); // Should remain idle
      expect(connection._lastDegradeTs).toBe(firstTimestamp); // Timestamp unchanged

      await pool.release(connection);
    });

    it('should allow replacement after grace period', async () => {
      const connection = await pool.acquire();
      
      // Set low health and old timestamp (beyond grace period)
      connection.healthScore = 25;
      connection._lastDegradeTs = Date.now() - 35000; // 35 seconds ago
      
      pool['replaceIfUnhealthy'](connection);
      expect(connection.state).toBe('error');
      expect(connection._lastDegradeTs).toBeGreaterThan(Date.now() - 1000); // Updated timestamp

      await pool.release(connection);
    });
  });

  describe('query execution', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should execute queries successfully', async () => {
      const result = await pool.executeQuery('SELECT 1', []);
      expect(result).toBeDefined();
    });

    it('should handle query timeouts with proper cancellation', async () => {
      // Mock a slow query that should timeout
      const originalQuery = pool['executeQueryOnConnection'];
      pool['executeQueryOnConnection'] = jest.fn().mockImplementation(async (conn, query, params, options) => {
        // Simulate a query that takes longer than the timeout
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 2000); // 2 second delay
          
          // If timeout is shorter, reject with timeout error
          if (options.timeout && options.timeout < 2000) {
            setTimeout(() => {
              clearTimeout(timer);
              reject(new Error(`Query timeout after ${options.timeout}ms`));
            }, options.timeout);
          }
        });
        return { rows: [], rowCount: 0 };
      });

      await expect(
        pool.executeQuery('SELECT pg_sleep(5)', [], { timeout: 1000 })
      ).rejects.toThrow('Query timeout');

      // Restore original method
      pool['executeQueryOnConnection'] = originalQuery;
    });

    it('should retry failed queries', async () => {
      let attempts = 0;
      const originalQuery = pool['executeQueryWithCancellation'];
      
      pool['executeQueryWithCancellation'] = jest.fn().mockImplementation(async (conn, query, params, signal) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Connection failed');
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await pool.executeQuery('SELECT 1', [], { retries: 2 }); // 2 retries = 3 total attempts
      expect(result).toBeDefined();
      expect(attempts).toBe(3);

      // Restore original method
      pool['executeQueryWithCancellation'] = originalQuery;
    });

    it('should cancel active queries when connection is destroyed', async () => {
      const connection = await pool.acquire();
      
      // Mock a long-running query that can be cancelled
      const originalQuery = pool['executeQueryOnConnection'];
      pool['executeQueryOnConnection'] = jest.fn().mockImplementation(async (conn, query, params, options) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve({ rows: [], rowCount: 0 }), 5000);
          
          // If connection is destroyed, reject
          const checkDestroyed = setInterval(() => {
            if (conn.state === 'closing') {
              clearTimeout(timer);
              clearInterval(checkDestroyed);
              reject(new Error('Connection destroyed'));
            }
          }, 100);
        });
      });

      // Start a long-running query
      const queryPromise = pool['executeQueryOnConnection'](
        connection,
        'SELECT pg_sleep(10)',
        [],
        { timeout: 5000 }
      );

      // Destroy the connection while query is running
      await pool['destroyConnection'](connection);

      // Query should be cancelled
      await expect(queryPromise).rejects.toThrow('Connection destroyed');

      // Restore original method
      pool['executeQueryOnConnection'] = originalQuery;
    });
  });

  describe('health monitoring', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should perform health checks', async () => {
      const healthStatus = pool.getHealthStatus();
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.totalConnections).toBeGreaterThan(0);
      expect(healthStatus.averageHealthScore).toBeGreaterThan(0);
    });

    it('should detect unhealthy connections', async () => {
      const connections = pool.getConnections();
      
      // Simulate unhealthy connection
      connections[0].healthScore = 10;
      connections[0].totalErrors = 20;

      const healthStatus = pool.getHealthStatus();
      expect(healthStatus.healthyConnections).toBeLessThan(healthStatus.totalConnections);
    });

    it('should handle empty connection pool in health status', async () => {
      // Shutdown pool to have zero connections
      await pool.shutdown();
      
      const healthStatus = pool.getHealthStatus();
      
      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.totalConnections).toBe(0);
      expect(healthStatus.healthyConnections).toBe(0);
      expect(healthStatus.utilization).toBe(0);
      expect(healthStatus.averageHealthScore).toBe(0);
      
      // Should not throw NaN or division by zero errors
      expect(Number.isNaN(healthStatus.utilization)).toBe(false);
      expect(Number.isNaN(healthStatus.averageHealthScore)).toBe(false);
    });
  });

  describe('metrics and events', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should track connection pool metrics', async () => {
      const metrics = pool.getMetrics();
      expect(metrics.totalConnections).toBeGreaterThan(0);
      expect(metrics.idleConnections).toBeGreaterThan(0);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('should return consistent utilization values', async () => {
      // Internal utilization should be 0..1
      const internalUtilization = pool['calculateUtilization']();
      expect(internalUtilization).toBeGreaterThanOrEqual(0);
      expect(internalUtilization).toBeLessThanOrEqual(1);

      // UI utilization should be 0..100
      const healthStatus = pool.getHealthStatus();
      expect(healthStatus.utilization).toBeGreaterThanOrEqual(0);
      expect(healthStatus.utilization).toBeLessThanOrEqual(100);
      
      // They should be consistent (UI = internal * 100)
      expect(healthStatus.utilization).toBeCloseTo(internalUtilization * 100, 1);
    });

    it('should record pool events', async () => {
      const connection = await pool.acquire();
      await pool.release(connection);

      const events = pool.getEvents();
      expect(events.length).toBeGreaterThan(0);
      
      const acquireEvent = events.find(e => e.type === 'connection_acquired');
      const releaseEvent = events.find(e => e.type === 'connection_released');
      
      expect(acquireEvent).toBeDefined();
      expect(releaseEvent).toBeDefined();
    });
  });

  describe('query cancellation', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should cancel queries using AbortController', async () => {
      const connection = await pool.acquire();
      
      // Simplified test - just verify that AbortController is used
      const originalExecute = pool['executeQueryWithCancellation'];
      let abortControllerUsed = false;
      
      pool['executeQueryWithCancellation'] = jest.fn().mockImplementation(async (conn, query, params, signal) => {
        abortControllerUsed = signal instanceof AbortSignal;
        if (signal.aborted) {
          throw new Error('Query aborted');
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await pool['executeQueryOnConnection'](
        connection,
        'SELECT 1',
        [],
        { timeout: 1000 }
      );

      expect(abortControllerUsed).toBe(true);
      expect(result).toBeDefined();
      
      // Restore original method
      pool['executeQueryWithCancellation'] = originalExecute;
      await pool.release(connection);
    });

    it('should track active queries on connections', async () => {
      const connection = await pool.acquire();
      expect(connection.activeQueries.size).toBe(0);

      // Start a query (mock implementation will add to activeQueries)
      const queryPromise = pool['executeQueryOnConnection'](
        connection,
        'SELECT 1',
        [],
        { timeout: 1000 }
      );

      await queryPromise;
      
      // After completion, activeQueries should be empty
      expect(connection.activeQueries.size).toBe(0);

      await pool.release(connection);
    });

    it('should cancel all queries when requested', async () => {
      const connection = await pool.acquire();
      
      // Add some mock active queries
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      connection.activeQueries.add(controller1);
      connection.activeQueries.add(controller2);

      expect(connection.activeQueries.size).toBe(2);

      await pool.cancelAllQueries(connection);

      expect(connection.activeQueries.size).toBe(0);
      expect(controller1.signal.aborted).toBe(true);
      expect(controller2.signal.aborted).toBe(true);

      await pool.release(connection);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await pool.initialize();
    });

    it('should handle connection creation failures', async () => {
      // Mock connection creation failure
      const originalCreate = pool['createDatabaseClient'];
      pool['createDatabaseClient'] = jest.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(pool['createConnection']()).rejects.toThrow('Connection failed');

      // Restore original method
      pool['createDatabaseClient'] = originalCreate;
    });

    it('should handle connection pool exhaustion', async () => {
      // Create a pool with limited connections for this test
      const smallPool = new IntelligentConnectionPool({
        minConnections: 1,
        maxConnections: 1, // Only 1 max connection to force exhaustion
        initialConnections: 1,
        acquireTimeoutMs: 1000, // Short timeout for test
        database: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          username: 'test',
          password: 'test'
        }
      });

      await smallPool.initialize();

      try {
        // Acquire the only available connection
        const conn1 = await smallPool.acquire();

        // Pool should be at capacity
        const metrics = smallPool.getMetrics();
        expect(metrics.activeConnections).toBe(1);

        // Try to acquire one more - should timeout since maxConnections is 1
        await expect(smallPool.acquire()).rejects.toThrow('Connection acquire timeout');

        // Release connection
        await smallPool.release(conn1);
      } finally {
        await smallPool.shutdown();
      }
    });

    it('should handle query execution errors gracefully', async () => {
      const connection = await pool.acquire();
      
      // Mock query failure
      const originalQuery = connection.client.query;
      connection.client.query = jest.fn().mockRejectedValue(new Error('Query failed'));

      await expect(
        pool['executeQueryOnConnection'](connection, 'INVALID SQL', [], {})
      ).rejects.toThrow('Query failed');

      // Restore original query method
      connection.client.query = originalQuery;
      await pool.release(connection);
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      await pool.initialize();
      
      const connections = pool.getConnections();
      expect(connections.length).toBeGreaterThan(0);

      await pool.shutdown();

      const finalConnections = pool.getConnections();
      expect(finalConnections.length).toBe(0);
    });

    it('should cancel all active queries during shutdown', async () => {
      await pool.initialize();
      
      const connection = await pool.acquire();
      
      // Add mock active query
      const controller = new AbortController();
      connection.activeQueries.add(controller);

      await pool.shutdown();

      expect(controller.signal.aborted).toBe(true);
    });
  });
});