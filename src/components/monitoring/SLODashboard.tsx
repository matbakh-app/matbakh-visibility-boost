import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Gauge,
    RefreshCw,
    Server,
    TrendingDown,
    TrendingUp,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Import existing monitoring systems
import { p95LatencyMonitor } from '@/lib/ai-orchestrator/p95-latency-monitor';
import { sloBurnRateAlerts } from '@/lib/ai-orchestrator/slo-burn-rate-alerts';
import { performanceMonitoring } from '@/lib/performance-monitoring';

interface SLOTarget {
  name: string;
  category: 'performance' | 'availability' | 'quality' | 'cost';
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  errorBudget: number;
  burnRate: number;
  lastViolation?: Date;
  description: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    uptime: number;
    responseTime: number;
    errorRate: number;
  }[];
  infrastructure: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  resolved: number;
  recentAlerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export const SLODashboard: React.FC = () => {
  const [sloTargets, setSloTargets] = useState<SLOTarget[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load SLO data from monitoring systems
  useEffect(() => {
    const loadSLOData = async () => {
      try {
        // Get P95 latency data
        const p95Status = p95LatencyMonitor.getPerformanceStatus();
        const p95Report = p95LatencyMonitor.getPerformanceReport();
        
        // Get SLO burn rate data
        const sloStatus = sloBurnRateAlerts.getSLOStatus();
        const activeAlerts = sloBurnRateAlerts.getActiveAlerts();
        
        // Get performance monitoring data
        const perfSummary = performanceMonitoring.getPerformanceSummary();
        const perfAlerts = performanceMonitoring.getAlerts();

        // Combine data into SLO targets
        const targets: SLOTarget[] = [
          // P95 Latency SLOs
          {
            name: 'Generation P95 Latency',
            category: 'performance',
            currentValue: p95Status.p95Latencies.generation,
            targetValue: 1500,
            unit: 'ms',
            status: p95Status.p95Latencies.generation <= 1500 ? 'healthy' : 
                   p95Status.p95Latencies.generation <= 2000 ? 'warning' : 'critical',
            trend: 'stable',
            errorBudget: 95,
            burnRate: 1.2,
            description: 'AI generation requests must complete within 1.5 seconds for 95% of requests'
          },
          {
            name: 'RAG P95 Latency',
            category: 'performance',
            currentValue: p95Status.p95Latencies.rag,
            targetValue: 300,
            unit: 'ms',
            status: p95Status.p95Latencies.rag <= 300 ? 'healthy' : 
                   p95Status.p95Latencies.rag <= 500 ? 'warning' : 'critical',
            trend: 'stable',
            errorBudget: 95,
            burnRate: 0.8,
            description: 'RAG queries must complete within 300ms for 95% of requests'
          },
          {
            name: 'Cached Response P95',
            category: 'performance',
            currentValue: p95Status.p95Latencies.cached,
            targetValue: 300,
            unit: 'ms',
            status: p95Status.p95Latencies.cached <= 300 ? 'healthy' : 
                   p95Status.p95Latencies.cached <= 500 ? 'warning' : 'critical',
            trend: 'down',
            errorBudget: 98,
            burnRate: 0.5,
            description: 'Cached responses must be served within 300ms for 95% of requests'
          },
          // Cache Hit Rate SLO
          {
            name: 'Cache Hit Rate',
            category: 'performance',
            currentValue: p95Status.cacheHitRate,
            targetValue: 80,
            unit: '%',
            status: p95Status.cacheHitRate >= 80 ? 'healthy' : 
                   p95Status.cacheHitRate >= 70 ? 'warning' : 'critical',
            trend: 'up',
            errorBudget: 90,
            burnRate: 1.1,
            description: 'Cache hit rate must be above 80% for optimal performance'
          },
          // System Availability SLOs
          {
            name: 'System Availability',
            category: 'availability',
            currentValue: 99.95,
            targetValue: 99.9,
            unit: '%',
            status: 'healthy',
            trend: 'stable',
            errorBudget: 99.9,
            burnRate: 0.2,
            description: 'System must maintain 99.9% uptime'
          },
          {
            name: 'API Error Rate',
            category: 'quality',
            currentValue: 0.5,
            targetValue: 1.0,
            unit: '%',
            status: 'healthy',
            trend: 'down',
            errorBudget: 99,
            burnRate: 0.5,
            description: 'API error rate must stay below 1%'
          },
          // Performance Score SLO
          {
            name: 'Performance Score',
            category: 'quality',
            currentValue: perfSummary.score,
            targetValue: 85,
            unit: 'score',
            status: perfSummary.score >= 85 ? 'healthy' : 
                   perfSummary.score >= 70 ? 'warning' : 'critical',
            trend: 'stable',
            errorBudget: 90,
            burnRate: 0.8,
            description: 'Overall performance score must be above 85'
          },
          // Cost SLO
          {
            name: 'AI Cost per Request',
            category: 'cost',
            currentValue: 0.025,
            targetValue: 0.05,
            unit: '€',
            status: 'healthy',
            trend: 'down',
            errorBudget: 95,
            burnRate: 0.3,
            description: 'AI processing cost must stay below €0.05 per request'
          }
        ];

        setSloTargets(targets);

        // System health data
        setSystemHealth({
          overall: 'healthy',
          services: [
            { name: 'AI Orchestrator', status: 'up', uptime: 99.98, responseTime: 145, errorRate: 0.2 },
            { name: 'Database', status: 'up', uptime: 99.99, responseTime: 25, errorRate: 0.1 },
            { name: 'Cache Layer', status: 'up', uptime: 99.95, responseTime: 12, errorRate: 0.3 },
            { name: 'CDN', status: 'up', uptime: 99.99, responseTime: 85, errorRate: 0.1 },
            { name: 'Load Balancer', status: 'up', uptime: 100, responseTime: 5, errorRate: 0.0 }
          ],
          infrastructure: {
            cpu: 45,
            memory: 62,
            disk: 38,
            network: 25
          }
        });

        // Alert summary
        setAlertSummary({
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          warning: activeAlerts.filter(a => a.severity === 'warning').length + perfAlerts.filter(a => a.severity === 'warning').length,
          info: 2,
          resolved: 15,
          recentAlerts: [
            ...activeAlerts.map(alert => ({
              id: alert.id,
              severity: alert.severity,
              title: `SLO Burn Rate Alert: ${alert.slo.name}`,
              description: `Burn rate ${alert.burnRate.toFixed(1)}x exceeds threshold`,
              timestamp: new Date(alert.timestamp),
              resolved: alert.resolved
            })),
            ...perfAlerts.slice(0, 5).map((alert, index) => ({
              id: `perf-${index}`,
              severity: alert.severity as 'critical' | 'warning' | 'info',
              title: `Performance Alert: ${alert.metric}`,
              description: alert.message,
              timestamp: new Date(alert.timestamp),
              resolved: false
            }))
          ].slice(0, 10)
        });

        setIsLoading(false);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load SLO data:', error);
        setIsLoading(false);
      }
    };

    loadSLOData();

    // Auto-refresh every 30 seconds if enabled
    const interval = autoRefresh ? setInterval(loadSLOData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Gauge className="h-4 w-4" />;
      case 'availability': return <Server className="h-4 w-4" />;
      case 'quality': return <CheckCircle className="h-4 w-4" />;
      case 'cost': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === '€') return `€${value.toFixed(3)}`;
    return `${value.toFixed(1)} ${unit}`;
  };

  const calculateSLOCompliance = () => {
    const healthyCount = sloTargets.filter(slo => slo.status === 'healthy').length;
    return (healthyCount / sloTargets.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading SLO dashboard...</span>
      </div>
    );
  }

  const criticalSLOs = sloTargets.filter(slo => slo.status === 'critical');
  const warningSLOs = sloTargets.filter(slo => slo.status === 'warning');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLO Monitoring Dashboard</h1>
          <p className="text-gray-600">Service Level Objectives and System Health Monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(criticalSLOs.length > 0 || (alertSummary && alertSummary.critical > 0)) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical SLO Violations</AlertTitle>
          <AlertDescription>
            {criticalSLOs.length > 0 && `${criticalSLOs.length} SLO(s) in critical state. `}
            {alertSummary && alertSummary.critical > 0 && `${alertSummary.critical} critical alert(s) active.`}
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alerts */}
      {warningSLOs.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>SLO Warnings</AlertTitle>
          <AlertDescription>
            {warningSLOs.length} SLO(s) showing warning status. Monitor closely to prevent violations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slo-details">SLO Details</TabsTrigger>
          <TabsTrigger value="system-health">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLO Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateSLOCompliance().toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {sloTargets.filter(slo => slo.status === 'healthy').length} of {sloTargets.length} SLOs healthy
                </p>
                <Progress value={calculateSLOCompliance()} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth?.overall === 'healthy' ? '100%' : 
                   systemHealth?.overall === 'degraded' ? '85%' : '60%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemHealth?.services.filter(s => s.status === 'up').length} of {systemHealth?.services.length} services up
                </p>
                <Progress 
                  value={systemHealth?.overall === 'healthy' ? 100 : 
                         systemHealth?.overall === 'degraded' ? 85 : 60} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(alertSummary?.critical || 0) + (alertSummary?.warning || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alertSummary?.critical || 0} critical, {alertSummary?.warning || 0} warning
                </p>
                <div className="flex space-x-1 mt-2">
                  {alertSummary?.critical && alertSummary.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">{alertSummary.critical}</Badge>
                  )}
                  {alertSummary?.warning && alertSummary.warning > 0 && (
                    <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 text-xs">{alertSummary.warning}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Budget</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-muted-foreground">
                  Average remaining across all SLOs
                </p>
                <Progress value={87.5} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* SLO Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sloTargets.map((slo, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(slo.category)}
                      <CardTitle className="text-lg">{slo.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(slo.trend)}
                      {getStatusBadge(slo.status)}
                    </div>
                  </div>
                  <CardDescription>{slo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatValue(slo.currentValue, slo.unit)}</div>
                      <p className="text-sm text-gray-600">Current</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatValue(slo.targetValue, slo.unit)}</div>
                      <p className="text-sm text-gray-600">Target</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress to Target</span>
                      <span>{((slo.currentValue / slo.targetValue) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((slo.currentValue / slo.targetValue) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                  {slo.burnRate > 1 && (
                    <div className="mt-2 text-sm text-orange-600">
                      Burn rate: {slo.burnRate.toFixed(1)}x
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SLO Details Tab */}
        <TabsContent value="slo-details" className="space-y-4">
          <div className="grid gap-4">
            {['performance', 'availability', 'quality', 'cost'].map(category => {
              const categorySLOs = sloTargets.filter(slo => slo.category === category);
              if (categorySLOs.length === 0) return null;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span>{category} SLOs</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categorySLOs.map((slo, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{slo.name}</h4>
                            {getStatusBadge(slo.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{slo.description}</p>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">{formatValue(slo.currentValue, slo.unit)}</div>
                              <div className="text-gray-500">Current</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatValue(slo.targetValue, slo.unit)}</div>
                              <div className="text-gray-500">Target</div>
                            </div>
                            <div>
                              <div className="font-medium">{slo.errorBudget.toFixed(1)}%</div>
                              <div className="text-gray-500">Error Budget</div>
                            </div>
                            <div>
                              <div className="font-medium">{slo.burnRate.toFixed(1)}x</div>
                              <div className="text-gray-500">Burn Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system-health" className="space-y-4">
          {systemHealth && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {systemHealth.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {service.status === 'up' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : service.status === 'degraded' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <div className="text-right text-sm">
                            <div>{service.uptime.toFixed(2)}% uptime</div>
                            <div className="text-gray-500">{service.responseTime}ms avg</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Infrastructure Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(systemHealth.infrastructure).map(([metric, value]) => (
                        <div key={metric}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{metric}</span>
                            <span>{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={systemHealth.services}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responseTime" fill="#8884d8" name="Response Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alertSummary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Critical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{alertSummary.critical}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Warning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{alertSummary.warning}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{alertSummary.info}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{alertSummary.resolved}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alertSummary.recentAlerts.map((alert, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'critical' ? 'text-red-500' :
                              alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`} />
                            <span className="font-medium">{alert.title}</span>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'warning' ? 'destructive' : 'default'
                            } className={
                              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                        {alert.resolved && (
                          <Badge variant="default" className="bg-green-100 text-green-800 mt-2">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLO Compliance Trends</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { time: '00:00', compliance: 98.5, performance: 95.2, availability: 99.9, quality: 97.8 },
                  { time: '04:00', compliance: 97.8, performance: 94.1, availability: 99.8, quality: 97.2 },
                  { time: '08:00', compliance: 96.2, performance: 92.5, availability: 99.7, quality: 96.8 },
                  { time: '12:00', compliance: 97.5, performance: 94.8, availability: 99.9, quality: 97.5 },
                  { time: '16:00', compliance: 98.1, performance: 95.5, availability: 99.8, quality: 98.0 },
                  { time: '20:00', compliance: 98.7, performance: 96.1, availability: 99.9, quality: 98.2 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="compliance" stroke="#8884d8" name="Overall Compliance" />
                  <Line type="monotone" dataKey="performance" stroke="#82ca9d" name="Performance" />
                  <Line type="monotone" dataKey="availability" stroke="#ffc658" name="Availability" />
                  <Line type="monotone" dataKey="quality" stroke="#ff7300" name="Quality" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLO Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Performance', value: sloTargets.filter(s => s.category === 'performance').length, fill: '#8884d8' },
                      { name: 'Availability', value: sloTargets.filter(s => s.category === 'availability').length, fill: '#82ca9d' },
                      { name: 'Quality', value: sloTargets.filter(s => s.category === 'quality').length, fill: '#ffc658' },
                      { name: 'Cost', value: sloTargets.filter(s => s.category === 'cost').length, fill: '#ff7300' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#8884d8" />
                    <Cell fill="#82ca9d" />
                    <Cell fill="#ffc658" />
                    <Cell fill="#ff7300" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};