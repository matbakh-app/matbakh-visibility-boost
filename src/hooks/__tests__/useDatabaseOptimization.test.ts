/**
 * Database Optimization Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDatabaseOptimization, useDatabasePerformance } from '../useDatabaseOptimization';

// Mock the database optimization module
jest.mock('../../lib/database', () => ({
  getDatabasePerformanceSummary: jest.fn(),
  getAllPerformanceAlerts: jest.fn(),
  getOptimizationRecommendations: jest.fn(),
  executeOptimizedQuery: jest.fn(),
  invalidateTableCache: jest.fn(),
  initializeDatabaseOptimization: jest.fn(),
  shutdownDatabaseOptimization: jest.fn()
}));

const mockDatabase = require('../../lib/database');

describe('useDatabaseOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockDatabase.initializeDatabaseOptimization.mockResolvedValue(undefined);
    
    // "good" but not "excellent" - neutral values for stable tests
    mockDatabase.getDatabasePerformanceSummary.mockResolvedValue({
      performance: {
        queryPerformance: {
          totalQueries: 1000,
          averageExecutionTimeMs: 120,
          slowQueries: 50,
          slowQueryPercentage: 5  // < 20 but not < 5 for "excellent"
        },
        connectionPool: {
          utilization: 75,  // 70-90 keeps it in "good" range
          totalConnections: 20,
          activeConnections: 15,
          waitingRequests: 0
        },
        cache: {
          hitRatio: 75,  // 50-80 keeps it in "good" (not "excellent")
          totalRequests: 5000,
          memoryUsageMB: 128
        },
        alerts: {
          total: 1,
          unresolved: 1,
          critical: 0
        },
        indexRecommendations: {
          total: 3,
          highPriority: 1
        }
      },
      optimization: {
        totalRecommendations: 3,
        highPriorityRecommendations: 1,
        averageImprovementPercentage: 35,
        totalQueriesAnalyzed: 1000,
        tablesAnalyzed: 5,
        lastAnalysis: Date.now()
      },
      connectionPool: {
        status: 'healthy',
        totalConnections: 20,
        healthyConnections: 19,
        utilization: 75,
        waitingRequests: 0,
        averageHealthScore: 92
      },
      timestamp: Date.now()
    });

    // Only medium alerts (should NOT flip to critical)
    mockDatabase.getAllPerformanceAlerts.mockResolvedValue({
      database: [
        {
          id: 'alert-1',
          type: 'slow_query',
          severity: 'medium',
          message: 'Query execution time exceeded threshold',
          timestamp: Date.now(),
          resolved: false
        }
      ],
      connectionPool: [],
      indexOptimizer: []
    });

    mockDatabase.getOptimizationRecommendations.mockResolvedValue({
      indexes: [
        {
          id: 'idx-1',
          tableName: 'users',
          columns: ['email'],
          indexType: 'btree',
          estimatedImpact: 'high',
          improvementPercentage: 40,
          priority: 85,
          reason: 'WHERE clause on email column',
          createStatement: 'CREATE INDEX idx_users_email ON users (email);'
        }
      ],
      queries: [
        {
          query: 'SELECT * FROM users WHERE email = ?',
          executionTimeMs: 2500
        }
      ],
      connectionPool: {
        status: 'healthy'
      }
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockDatabase.initializeDatabaseOptimization).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockDatabase.initializeDatabaseOptimization.mockRejectedValue(
        new Error('Initialization failed')
      );

      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.error).toBe('Initialization failed');
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('data loading', () => {
    it('should load performance data after initialization', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.performanceSummary).toBeDefined();
      });

      expect(result.current.alerts).toBeDefined();
      expect(result.current.recommendations).toBeDefined();
      expect(result.current.lastUpdate).toBeInstanceOf(Date);
    });

    it('should update metrics from performance data', async () => {
      const { result } = renderHook(() => useDatabaseOptimization({
        autoRefresh: false,
        enableRealTimeMetrics: false
      }));

      // Wait for initialization & first load to finish
      await waitFor(() => {
        expect(result.current.performanceSummary).toBeTruthy();
      });

      expect(result.current.metrics.queryCount).toBe(1000);
      expect(result.current.metrics.averageResponseTime).toBe(120);
      expect(result.current.metrics.cacheHitRatio).toBe(75);
      expect(result.current.metrics.connectionPoolUtilization).toBe(75);
      expect(result.current.metrics.activeAlerts).toBe(1);
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh data when enabled', async () => {
      const { result } = renderHook(() => 
        useDatabaseOptimization({ autoRefresh: true, refreshInterval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockDatabase.getDatabasePerformanceSummary).toHaveBeenCalled();
      });
    });

    it('should not auto-refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useDatabaseOptimization({ autoRefresh: false })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear initial calls
      jest.clearAllMocks();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have been called again
      expect(mockDatabase.getDatabasePerformanceSummary).not.toHaveBeenCalled();
    });
  });

  describe('alert callbacks', () => {
    it('should call onAlert for new alerts', async () => {
      const onAlert = jest.fn();
      
      const { result } = renderHook(() => 
        useDatabaseOptimization({ onAlert })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.alerts).toBeDefined();
      });

      // Should call onAlert for initial alerts
      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'slow_query',
          severity: 'medium'
        })
      );
    });

    it('should call onRecommendation for new recommendations', async () => {
      const onRecommendation = jest.fn();
      
      const { result } = renderHook(() => 
        useDatabaseOptimization({ onRecommendation })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.recommendations).toBeDefined();
      });

      // Should call onRecommendation for initial recommendations
      expect(onRecommendation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'idx-1',
          tableName: 'users',
          columns: ['email']
        })
      );
    });
  });

  describe('query execution', () => {
    it('should execute optimized queries', async () => {
      mockDatabase.executeOptimizedQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const query = 'SELECT * FROM users WHERE id = $1';
      const params = [123];

      await act(async () => {
        const queryResult = await result.current.executeQuery(query, params);
        expect(queryResult).toEqual({ rows: [], rowCount: 0 });
      });

      expect(mockDatabase.executeOptimizedQuery).toHaveBeenCalledWith(
        query, 
        params, 
        {}
      );
    });

    it('should handle query execution errors', async () => {
      mockDatabase.executeOptimizedQuery.mockRejectedValue(
        new Error('Query failed')
      );

      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await expect(
        result.current.executeQuery('SELECT 1')
      ).rejects.toThrow('Query failed');
    });

    it('should throw error when not initialized', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      // Don't wait for initialization
      await expect(
        result.current.executeQuery('SELECT 1')
      ).rejects.toThrow('Database optimization not initialized');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate table cache', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.invalidateCache('users', 'update');
      });

      expect(mockDatabase.invalidateTableCache).toHaveBeenCalledWith('users', 'update');
    });
  });

  describe('performance status', () => {
    it('should calculate performance status correctly', async () => {
      const { result } = renderHook(() => useDatabaseOptimization({
        autoRefresh: false,
        enableRealTimeMetrics: false
      }));

      // Wait for initialization & first load to finish
      await waitFor(() => {
        expect(result.current.performanceSummary).toBeTruthy();
      });

      expect(result.current.performanceStatus).toBe('good');
    });

    it('should return critical status for critical alerts', async () => {
      mockDatabase.getAllPerformanceAlerts.mockResolvedValue({
        database: [
          {
            id: 'critical-alert-1',
            type: 'connection_pool_exhausted',
            severity: 'critical',
            message: 'Connection pool exhausted',
            timestamp: Date.now(),
            resolved: false
          }
        ],
        connectionPool: [],
        indexOptimizer: []
      });

      const { result } = renderHook(() => useDatabaseOptimization({
        autoRefresh: false,
        enableRealTimeMetrics: false
      }));

      // Wait for initialization & first load to finish
      await waitFor(() => {
        expect(result.current.performanceSummary).toBeTruthy();
      });

      expect(result.current.performanceStatus).toBe('critical');
    });
  });

  describe('optimization score', () => {
    it('should calculate optimization score', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.performanceSummary).toBeDefined();
      });

      const score = result.current.optimizationScore;
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('manual refresh', () => {
    it('should refresh data manually', async () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear initial calls
      jest.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockDatabase.getDatabasePerformanceSummary).toHaveBeenCalled();
      expect(mockDatabase.getAllPerformanceAlerts).toHaveBeenCalled();
      expect(mockDatabase.getOptimizationRecommendations).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should format duration correctly', () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      expect(result.current.formatDuration(500)).toBe('500ms');
      expect(result.current.formatDuration(1500)).toBe('1.5s');
      expect(result.current.formatDuration(65000)).toBe('1.1m');
    });

    it('should format bytes correctly', () => {
      const { result } = renderHook(() => useDatabaseOptimization());

      expect(result.current.formatBytes(512)).toBe('512B');
      expect(result.current.formatBytes(1536)).toBe('1.5KB');
      expect(result.current.formatBytes(2097152)).toBe('2.0MB');
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      unmount();

      expect(mockDatabase.shutdownDatabaseOptimization).toHaveBeenCalled();
    });

    it('should clear intervals on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = renderHook(() => useDatabaseOptimization());

      await waitFor(() => {
        // Wait for initialization
      });

      unmount();

      // Should clear intervals
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });
  });
});

describe('useDatabasePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase.getDatabasePerformanceSummary.mockResolvedValue({
      performance: {
        queryPerformance: {
          totalQueries: 500,
          averageExecutionTimeMs: 120,
          slowQueryPercentage: 3
        },
        cache: {
          hitRatio: 90
        },
        connectionPool: {
          utilization: 55
        }
      }
    });

    mockDatabase.getAllPerformanceAlerts.mockResolvedValue({
      database: []
    });
  });

  it('should load performance metrics', async () => {
    const { result } = renderHook(() => useDatabasePerformance());

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.metrics).toBeTruthy();
    });

    expect(result.current.metrics.queryCount).toBe(500);
    expect(result.current.metrics.averageResponseTime).toBe(120);
    expect(result.current.metrics.cacheHitRatio).toBe(90);
    expect(result.current.metrics.connectionPoolUtilization).toBe(55);
    expect(result.current.metrics.optimizationScore).toBeGreaterThan(0);
  });

  it('should handle loading errors gracefully', async () => {
    mockDatabase.getDatabasePerformanceSummary.mockRejectedValue(
      new Error('Failed to load')
    );

    const { result } = renderHook(() => useDatabasePerformance());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have default values
    expect(result.current.metrics.queryCount).toBe(0);
    expect(result.current.metrics.averageResponseTime).toBe(0);
  });
});