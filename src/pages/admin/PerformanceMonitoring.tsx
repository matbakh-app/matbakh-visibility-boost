/**
 * Admin Performance Monitoring Page
 * 
 * Comprehensive performance monitoring dashboard for administrators
 * with real-time metrics, alerts, and regression analysis.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Database, 
  Eye, 
  Gauge, 
  RefreshCw, 
  Settings, 
  TrendingDown, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import PerformanceMonitoringDashboard from '@/components/analytics/PerformanceMonitoringDashboard';
import { usePerformanceMonitoringContext } from '@/components/analytics/PerformanceMonitoringProvider';
import { regressionDetector } from '@/lib/performance-regression-detector';

const PerformanceMonitoringPage: React.FC = () => {
  const {
    metrics,
    alerts,
    summary,
    isInitialized,
    isLoading,
    lastUpdate,
    refresh,
    isHealthy,
    healthScore
  } = usePerformanceMonitoringContext();

  const [regressionStatus, setRegressionStatus] = useState<any>({});
  const [systemStats, setSystemStats] = useState<any>({});

  // Load additional system statistics
  useEffect(() => {
    const loadSystemStats = () => {
      const status = regressionDetector.getStatus();
      setRegressionStatus(status);

      // Calculate system statistics
      const now = Date.now();
      const last24h = now - 24 * 60 * 60 * 1000;
      const recentMetrics = metrics.filter(m => m.timestamp >= last24h);
      
      const deviceTypes = recentMetrics.reduce((acc, metric) => {
        const device = metric.deviceType || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const connectionTypes = recentMetrics.reduce((acc, metric) => {
        const connection = metric.connectionType || 'unknown';
        acc[connection] = (acc[connection] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pages = recentMetrics.reduce((acc, metric) => {
        const page = new URL(metric.url).pathname;
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setSystemStats({
        totalSessions: new Set(recentMetrics.map(m => m.sessionId)).size,
        totalUsers: new Set(recentMetrics.filter(m => m.userId).map(m => m.userId)).size,
        deviceTypes,
        connectionTypes,
        topPages: Object.entries(pages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([page, count]) => ({ page, count }))
      });
    };

    loadSystemStats();
    const interval = setInterval(loadSystemStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [metrics]);

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthStatusText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time performance analytics and regression detection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getHealthStatusColor(healthScore)}>
            {getHealthStatusText(healthScore)} ({healthScore}/100)
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {isHealthy ? 'Healthy' : 'Issues'}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.severity === 'critical').length} critical alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.totalSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalUsers || 0} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regression Detection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {regressionStatus.baselinesCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active baselines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Collection</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Metrics collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'critical').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Performance Issues Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {alerts.filter(a => a.severity === 'critical').length} critical performance issues require immediate attention.
            <div className="mt-2 space-y-1">
              {alerts.filter(a => a.severity === 'critical').slice(0, 3).map((alert, index) => (
                <div key={index} className="text-sm">
                  • {alert.metric}: {alert.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="regression">Regression</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <PerformanceMonitoringDashboard 
            autoRefresh={true}
            refreshInterval={15000}
          />
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Metrics</CardTitle>
                <CardDescription>Latest performance measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {metrics.slice(-20).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{metric.name}</Badge>
                        <span className="text-sm">{metric.value.toFixed(2)}ms</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          metric.rating === 'good' ? 'bg-green-100 text-green-800' :
                          metric.rating === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {metric.rating}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device & Connection Stats</CardTitle>
                <CardDescription>User environment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Device Types</h4>
                    <div className="space-y-1">
                      {Object.entries(systemStats.deviceTypes || {}).map(([device, count]) => (
                        <div key={device} className="flex justify-between text-sm">
                          <span className="capitalize">{device}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Connection Types</h4>
                    <div className="space-y-1">
                      {Object.entries(systemStats.connectionTypes || {}).map(([connection, count]) => (
                        <div key={connection} className="flex justify-between text-sm">
                          <span>{connection}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Active Alerts</h3>
                  <p className="text-muted-foreground">All performance metrics are within acceptable ranges.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Alert key={index} className={
                  alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.type.replace('_', ' ').toUpperCase()}</span>
                    <Badge variant="outline" className={
                      alert.severity === 'critical' ? 'border-red-300 text-red-700' :
                      alert.severity === 'high' ? 'border-orange-300 text-orange-700' :
                      alert.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                      'border-blue-300 text-blue-700'
                    }>
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>{alert.message}</p>
                      <div className="text-xs mt-2 grid grid-cols-2 gap-2">
                        <div>Metric: {alert.metric}</div>
                        <div>Value: {alert.value}ms</div>
                        <div>Time: {new Date(alert.timestamp).toLocaleString()}</div>
                        <div>URL: {new URL(alert.url).pathname}</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Regression Tab */}
        <TabsContent value="regression" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regression Detection Status</CardTitle>
                <CardDescription>Statistical baseline analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{regressionStatus.baselinesCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Baselines</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{regressionStatus.totalMetrics || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Metrics</div>
                    </div>
                  </div>
                  
                  {regressionStatus.oldestBaseline && (
                    <div className="text-sm">
                      <div>Oldest Baseline: {new Date(regressionStatus.oldestBaseline).toLocaleString()}</div>
                      <div>Newest Baseline: {new Date(regressionStatus.newestBaseline).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regression Alerts</CardTitle>
                <CardDescription>Performance degradation detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.filter(a => a.type === 'regression_detected').length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">No regressions detected</div>
                    </div>
                  ) : (
                    alerts.filter(a => a.type === 'regression_detected').map((alert, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{alert.metric}</Badge>
                          <Badge className={
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="text-sm mt-1">{alert.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most monitored pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemStats.topPages?.map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-mono">{page.page}</span>
                      <Badge variant="outline">{page.count} metrics</Badge>
                    </div>
                  )) || <div className="text-sm text-muted-foreground">No data available</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Monitoring system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Monitoring Status</span>
                    <Badge className={isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {isInitialized ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update</span>
                    <span className="text-sm text-muted-foreground">
                      {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Score</span>
                    <span className={`font-medium ${
                      healthScore >= 90 ? 'text-green-600' :
                      healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {healthScore}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoringPage;