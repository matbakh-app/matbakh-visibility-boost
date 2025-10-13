/**
 * Database Performance Dashboard Component
 * 
 * This component provides a comprehensive view of database performance including:
 * - Real-time performance metrics and alerts
 * - Connection pool status and auto-scaling information
 * - Query cache performance and hit rates
 * - Index optimization recommendations
 * - Performance trends and regression detection
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';

import { 
  getDatabasePerformanceSummary,
  getAllPerformanceAlerts,
  getOptimizationRecommendations,
  type DatabasePerformanceAlert,
  type IndexRecommendation
} from '@/lib/database';

interface DatabasePerformanceData {
  performance: {
    queryPerformance: {
      averageExecutionTimeMs: number;
      totalQueries: number;
      slowQueries: number;
      slowQueryPercentage: number;
    };
    connectionPool: {
      utilization: number;
      totalConnections: number;
      activeConnections: number;
      waitingRequests: number;
    } | null;
    cache: {
      hitRatio: number;
      totalRequests: number;
      memoryUsageMB: number;
    } | null;
    alerts: {
      total: number;
      unresolved: number;
      critical: number;
    };
    indexRecommendations: {
      total: number;
      highPriority: number;
    };
  };
  optimization: {
    totalRecommendations: number;
    highPriorityRecommendations: number;
    averageImprovementPercentage: number;
    totalQueriesAnalyzed: number;
    tablesAnalyzed: number;
    lastAnalysis: number;
  };
  connectionPool: {
    status: 'healthy' | 'degraded';
    totalConnections: number;
    healthyConnections: number;
    utilization: number;
    waitingRequests: number;
    averageHealthScore: number;
  };
  timestamp: number;
}

interface PerformanceAlerts {
  database: DatabasePerformanceAlert[];
  connectionPool: any[];
  indexOptimizer: IndexRecommendation[];
}

interface OptimizationRecommendations {
  indexes: IndexRecommendation[];
  queries: any[];
  connectionPool: any;
}

export function DatabasePerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<DatabasePerformanceData | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlerts | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load performance data
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      
      const [perfData, alertData, recData] = await Promise.all([
        getDatabasePerformanceSummary(),
        getAllPerformanceAlerts(),
        getOptimizationRecommendations()
      ]);
      
      setPerformanceData(perfData);
      setAlerts(alertData);
      setRecommendations(recData);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Failed to load database performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    loadPerformanceData();
    
    const interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (isLoading && !performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading database performance data...</span>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load database performance data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Database Performance</h2>
          <p className="text-muted-foreground">
            Monitor and optimize database performance, connection pools, and query efficiency
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={loadPerformanceData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts && alerts.database.filter(a => a.severity === 'critical' && !a.resolved).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Database Issues Detected</AlertTitle>
          <AlertDescription>
            {alerts.database.filter(a => a.severity === 'critical' && !a.resolved).length} critical issues require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(performanceData.performance.queryPerformance.averageExecutionTimeMs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
            <div className="mt-2">
              <Badge variant={performanceData.performance.queryPerformance.slowQueryPercentage > 10 ? 'destructive' : 'secondary'}>
                {performanceData.performance.queryPerformance.slowQueryPercentage.toFixed(1)}% slow queries
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Pool</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.connectionPool.utilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pool utilization
            </p>
            <div className="mt-2">
              <Progress value={performanceData.connectionPool.utilization} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceData.connectionPool.totalConnections} total connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.performance.cache?.hitRatio.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cache hit ratio
            </p>
            <div className="mt-2">
              <Progress 
                value={performanceData.performance.cache?.hitRatio || 0} 
                className="h-2" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes((performanceData.performance.cache?.memoryUsageMB || 0) * 1024 * 1024)} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.optimization.highPriorityRecommendations}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority recommendations
            </p>
            <div className="mt-2">
              <Badge variant={performanceData.optimization.highPriorityRecommendations > 0 ? 'default' : 'secondary'}>
                {performanceData.optimization.averageImprovementPercentage.toFixed(0)}% avg improvement
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Query Analysis</TabsTrigger>
          <TabsTrigger value="connections">Connection Pool</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="indexes">Index Optimization</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall database system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Pool</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${getStatusColor(performanceData.connectionPool.status)}`} />
                    <span className="capitalize">{performanceData.connectionPool.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Query Performance</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${performanceData.performance.queryPerformance.slowQueryPercentage < 5 ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span>{performanceData.performance.queryPerformance.slowQueryPercentage < 5 ? 'Good' : 'Needs Attention'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Cache Efficiency</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${(performanceData.performance.cache?.hitRatio || 0) > 70 ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span>{(performanceData.performance.cache?.hitRatio || 0) > 70 ? 'Excellent' : 'Moderate'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Queries (1h)</span>
                    <span>{performanceData.performance.queryPerformance.totalQueries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slow Queries</span>
                    <span>{performanceData.performance.queryPerformance.slowQueries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Connections</span>
                    <span>{performanceData.connectionPool.totalConnections}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Requests</span>
                    <span>{(performanceData.performance.cache?.totalRequests || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Performance Analysis</CardTitle>
              <CardDescription>Detailed analysis of query execution patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {performanceData.performance.queryPerformance.totalQueries.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Queries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {performanceData.performance.queryPerformance.slowQueries.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Slow Queries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDuration(performanceData.performance.queryPerformance.averageExecutionTimeMs)}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Time</p>
                  </div>
                </div>

                {recommendations?.queries && recommendations.queries.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Slowest Queries</h4>
                    <div className="space-y-2">
                      {recommendations.queries.slice(0, 5).map((query, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex-1 truncate">
                            <code className="text-sm">{query.query || 'Query details not available'}</code>
                          </div>
                          <Badge variant="outline">
                            {formatDuration(query.executionTimeMs || 0)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Pool Status</CardTitle>
              <CardDescription>Real-time connection pool monitoring and auto-scaling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Pool Utilization</h4>
                    <Progress value={performanceData.connectionPool.utilization} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {performanceData.connectionPool.utilization.toFixed(1)}% utilized
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Health Score</h4>
                    <Progress value={performanceData.connectionPool.averageHealthScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {performanceData.connectionPool.averageHealthScore.toFixed(1)}/100 average health
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{performanceData.connectionPool.totalConnections}</div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{performanceData.connectionPool.healthyConnections}</div>
                    <p className="text-sm text-muted-foreground">Healthy</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {Math.round(performanceData.connectionPool.utilization * performanceData.connectionPool.totalConnections / 100)}
                    </div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">{performanceData.connectionPool.waitingRequests}</div>
                    <p className="text-sm text-muted-foreground">Waiting</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Redis query cache statistics and optimization</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData.performance.cache ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {performanceData.performance.cache.hitRatio.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Hit Ratio</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {performanceData.performance.cache.totalRequests.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatBytes(performanceData.performance.cache.memoryUsageMB * 1024 * 1024)}
                      </div>
                      <p className="text-sm text-muted-foreground">Memory Usage</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Cache Efficiency</h4>
                    <Progress value={performanceData.performance.cache.hitRatio} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {performanceData.performance.cache.hitRatio > 80 ? 'Excellent' : 
                       performanceData.performance.cache.hitRatio > 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Cache not configured or no data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Index Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered index suggestions for improved query performance</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations?.indexes && recommendations.indexes.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.indexes.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{rec.tableName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Columns: {rec.columns.join(', ')}
                          </p>
                        </div>
                        <Badge variant={getAlertSeverityColor(rec.estimatedImpact)}>
                          {rec.estimatedImpact} impact
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-3">{rec.reason}</p>
                      
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Improvement:</span>
                          <span className="ml-1 font-medium">{rec.improvementPercentage.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <span className="ml-1 font-medium">{rec.priority}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <span className="ml-1 font-medium">{rec.estimatedSizeMB.toFixed(1)}MB</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <code className="text-xs bg-muted p-2 rounded block">
                          {rec.createStatement}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No optimization recommendations at this time</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system is analyzing query patterns to generate suggestions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts & Issues</CardTitle>
              <CardDescription>Active alerts and performance issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts && (alerts.database.length > 0 || alerts.connectionPool.length > 0) ? (
                <div className="space-y-4">
                  {alerts.database.filter(alert => !alert.resolved).map((alert, index) => (
                    <Alert key={index} variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <Badge variant={getAlertSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p>{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {alerts.connectionPool.filter(event => event.type === 'error' || event.type === 'warning').map((event, index) => (
                    <Alert key={`pool-${index}`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Connection Pool {event.type.toUpperCase()}</AlertTitle>
                      <AlertDescription>
                        <p>{event.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active alerts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All database systems are operating normally
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}