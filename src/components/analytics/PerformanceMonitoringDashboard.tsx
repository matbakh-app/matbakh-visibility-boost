/**
 * Performance Monitoring Dashboard Component
 * 
 * Real-time performance monitoring dashboard with Core Web Vitals,
 * alerts, and regression detection visualization.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Gauge, 
  RefreshCw, 
  TrendingUp,
  Zap
} from 'lucide-react';
import { 
  performanceMonitoring, 
  PerformanceMetric, 
  PerformanceAlert,
  CORE_WEB_VITALS_THRESHOLDS 
} from '@/lib/performance-monitoring';

interface PerformanceMonitoringDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitoringDashboard: React.FC<PerformanceMonitoringDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Filter states
  const [routeFilter, setRouteFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [scoreMode, setScoreMode] = useState<'latest' | 'p75' | 'p95'>('latest');

  // Refresh data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const currentMetrics = performanceMonitoring.getMetrics();
      const currentAlerts = performanceMonitoring.getAlerts();
      const currentSummary = performanceMonitoring.getPerformanceSummary();

      setMetrics(currentMetrics);
      setAlerts(currentAlerts);
      setSummary(currentSummary);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Filter metrics based on route and device
  const filteredMetrics = metrics.filter(m => 
    (routeFilter === 'all' || m.url.includes(routeFilter)) && 
    (deviceFilter === 'all' || m.deviceType === deviceFilter)
  );

  // Calculate P75/P95 scores
  const calculateAggregatedScore = (metrics: PerformanceMetric[], mode: 'latest' | 'p75' | 'p95') => {
    if (metrics.length === 0) return 0;
    
    if (mode === 'latest') {
      // Use latest metrics for each type
      const latestMetrics = new Map<string, PerformanceMetric>();
      metrics.forEach(metric => {
        const existing = latestMetrics.get(metric.name);
        if (!existing || metric.timestamp > existing.timestamp) {
          latestMetrics.set(metric.name, metric);
        }
      });
      
      let totalScore = 0;
      let count = 0;
      latestMetrics.forEach(metric => {
        const score = metric.rating === 'good' ? 100 : 
                     metric.rating === 'needs-improvement' ? 60 : 20;
        totalScore += score;
        count++;
      });
      
      return count > 0 ? Math.round(totalScore / count) : 0;
    }
    
    // Calculate P75 or P95
    const values = metrics.map(m => {
      return m.rating === 'good' ? 100 : 
             m.rating === 'needs-improvement' ? 60 : 20;
    }).sort((a, b) => a - b);
    
    if (values.length === 0) return 0;
    
    const percentile = mode === 'p75' ? 0.75 : 0.95;
    const index = Math.floor(percentile * values.length);
    return values[Math.min(index, values.length - 1)];
  };

  // Get unique routes and devices for filter options
  const uniqueRoutes = Array.from(new Set(metrics.map(m => new URL(m.url).pathname))).slice(0, 10);
  const uniqueDevices = Array.from(new Set(metrics.map(m => m.deviceType).filter(Boolean)));

  // Prepare chart data
  const prepareChartData = () => {
    const chartData: Record<string, any[]> = {
      timeline: [],
      vitals: [],
      ratings: []
    };

    // Timeline data (last 20 filtered metrics)
    const recentMetrics = filteredMetrics.slice(-20);
    chartData.timeline = recentMetrics.map((metric, index) => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      [metric.name]: metric.value,
      rating: metric.rating
    }));

    // Core Web Vitals summary
    const vitalsSummary = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map(vital => {
      const latestMetric = filteredMetrics
        .filter(m => m.name === vital)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return {
        name: vital,
        value: latestMetric?.value || 0,
        rating: latestMetric?.rating || 'good',
        threshold: CORE_WEB_VITALS_THRESHOLDS[vital as keyof typeof CORE_WEB_VITALS_THRESHOLDS]?.good || 0
      };
    });
    chartData.vitals = vitalsSummary;

    // Rating distribution
    const ratingCounts = filteredMetrics.reduce((acc, metric) => {
      acc[metric.rating] = (acc[metric.rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    chartData.ratings = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating,
      count,
      percentage: filteredMetrics.length ? Math.round((count / filteredMetrics.length) * 100) : 0
    }));

    return chartData;
  };

  const chartData = prepareChartData();

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  // Performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time Core Web Vitals and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Route:</label>
          <select 
            value={routeFilter} 
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Routes</option>
            {uniqueRoutes.map(route => (
              <option key={route} value={route}>{route || '/'}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Device:</label>
          <select 
            value={deviceFilter} 
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Devices</option>
            {uniqueDevices.map(device => (
              <option key={device} value={device}>{device}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Score Mode:</label>
          <select 
            value={scoreMode} 
            onChange={(e) => setScoreMode(e.target.value as 'latest' | 'p75' | 'p95')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="latest">Latest</option>
            <option value="p75">P75</option>
            <option value="p95">P95</option>
          </select>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredMetrics.length} of {metrics.length} metrics
        </div>
      </div>

      {/* Performance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(calculateAggregatedScore(filteredMetrics, scoreMode))}`}>
              {calculateAggregatedScore(filteredMetrics, scoreMode)}
            </div>
            <Progress value={calculateAggregatedScore(filteredMetrics, scoreMode)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metrics Collected</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Ratings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {chartData.ratings.find(r => r.rating === 'good')?.percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of all metrics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Current performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.vitals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Rating breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.ratings}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                    >
                      {chartData.ratings.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.rating === 'good' ? '#10b981' : 
                               entry.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData.vitals.map((vital) => (
              <Card key={vital.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {vital.name}
                    <Badge className={getRatingColor(vital.rating)}>
                      {vital.rating}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {vital.name === 'LCP' && 'Largest Contentful Paint'}
                    {vital.name === 'INP' && 'Interaction to Next Paint'}
                    {vital.name === 'CLS' && 'Cumulative Layout Shift'}
                    {vital.name === 'FCP' && 'First Contentful Paint'}
                    {vital.name === 'TTFB' && 'Time to First Byte'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vital.name === 'CLS' ? vital.value.toFixed(3) : `${Math.round(vital.value)}ms`}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Threshold: {vital.name === 'CLS' ? vital.threshold.toFixed(3) : `${vital.threshold}ms`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Active Alerts</h3>
                  <p className="text-muted-foreground">All performance metrics are within acceptable ranges.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Alert key={index} className={getAlertSeverityColor(alert.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.type.replace('_', ' ').toUpperCase()}</span>
                    <Badge variant="outline" className={getAlertSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>{alert.message}</p>
                      <div className="text-xs mt-2 space-y-1">
                        <p>Metric: {alert.metric}</p>
                        <p>Value: {alert.value}ms</p>
                        <p>Time: {new Date(alert.timestamp).toLocaleString()}</p>
                        <p>URL: {alert.url}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Timeline</CardTitle>
              <CardDescription>Recent performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="LCP" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="INP" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="FCP" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="TTFB" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoringDashboard;