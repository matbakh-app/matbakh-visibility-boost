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
    Database,
    Gauge,
    RefreshCw,
    Settings,
    TrendingDown,
    TrendingUp,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
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

interface P95Metrics {
  operation: string;
  provider: string;
  p95: number;
  p99: number;
  target: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface SLOStatus {
  operation: string;
  goodRatio: number;
  target: number;
  isViolated: boolean;
  errorBudgetRemaining: number;
  burnRate5m: number;
  burnRate1h: number;
}

interface CacheMetrics {
  overall: { hitRate: number; eligibleCount: number; totalCount: number };
  topK: { hitRate: number; requestCount: number };
  longTail: { hitRate: number; requestCount: number };
}

interface AutopilotStatus {
  providerWeights: Record<string, number>;
  activeOptimizations: number;
  recentActions: Array<{
    type: string;
    provider: string;
    reason: string;
    timestamp: number;
    expectedImpact: string;
  }>;
  staleWhileRevalidateActive: boolean;
}

export const P95LatencyDashboard: React.FC = () => {
  const [p95Metrics, setP95Metrics] = useState<P95Metrics[]>([]);
  const [sloStatus, setSloStatus] = useState<SLOStatus[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration
  useEffect(() => {
    const loadMockData = () => {
      setP95Metrics([
        {
          operation: 'generation',
          provider: 'bedrock',
          p95: 1200,
          p99: 1800,
          target: 1500,
          status: 'healthy',
          trend: 'stable'
        },
        {
          operation: 'generation',
          provider: 'google',
          p95: 950,
          p99: 1400,
          target: 1500,
          status: 'healthy',
          trend: 'down'
        },
        {
          operation: 'rag',
          provider: 'bedrock',
          p95: 280,
          p99: 420,
          target: 300,
          status: 'healthy',
          trend: 'stable'
        },
        {
          operation: 'cached',
          provider: 'redis',
          p95: 45,
          p99: 85,
          target: 300,
          status: 'healthy',
          trend: 'stable'
        }
      ]);

      setSloStatus([
        {
          operation: 'generation',
          goodRatio: 0.967,
          target: 0.95,
          isViolated: false,
          errorBudgetRemaining: 0.66,
          burnRate5m: 2.1,
          burnRate1h: 1.8
        },
        {
          operation: 'rag',
          goodRatio: 0.982,
          target: 0.95,
          isViolated: false,
          errorBudgetRemaining: 0.36,
          burnRate5m: 1.2,
          burnRate1h: 1.4
        }
      ]);

      setCacheMetrics({
        overall: { hitRate: 78.5, eligibleCount: 1250, totalCount: 1600 },
        topK: { hitRate: 92.3, requestCount: 400 },
        longTail: { hitRate: 65.7, requestCount: 850 }
      });

      setAutopilotStatus({
        providerWeights: { bedrock: 1.0, google: 0.85, meta: 0.7 },
        activeOptimizations: 2,
        recentActions: [
          {
            type: 'weight_adjustment',
            provider: 'meta',
            reason: 'P95 drift (warning)',
            timestamp: Date.now() - 300000,
            expectedImpact: 'Reduce meta traffic by 30%'
          },
          {
            type: 'context_optimization',
            provider: 'google',
            reason: 'P95 drift mitigation',
            timestamp: Date.now() - 600000,
            expectedImpact: 'Reduce context size for faster processing'
          }
        ],
        staleWhileRevalidateActive: true
      });

      setIsLoading(false);
      setLastUpdated(new Date());
    };

    loadMockData();
    const interval = setInterval(loadMockData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading P95 metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">P95 Latency Dashboard</h1>
          <p className="text-gray-600">Real-time performance monitoring and SLO compliance</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {sloStatus.some(s => s.isViolated || s.burnRate5m > 6.0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>SLO Violation Detected</AlertTitle>
          <AlertDescription>
            One or more services are violating SLO targets. Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="p95-metrics">P95 Metrics</TabsTrigger>
          <TabsTrigger value="slo-status">SLO Status</TabsTrigger>
          <TabsTrigger value="cache-analysis">Cache Analysis</TabsTrigger>
          <TabsTrigger value="autopilot">Autopilot</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generation P95</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,075ms</div>
                <p className="text-xs text-muted-foreground">
                  Target: 1,500ms
                </p>
                <Progress value={71.7} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLO Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">96.7%</div>
                <p className="text-xs text-muted-foreground">
                  Target: 95.0%
                </p>
                <Progress value={96.7} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5%</div>
                <p className="text-xs text-muted-foreground">
                  Target: 80.0%
                </p>
                <Progress value={78.5} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Autopilot Actions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Active optimizations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* P95 Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>P95 Latency Trends</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { time: '00:00', generation: 1100, rag: 280, cached: 45 },
                  { time: '04:00', generation: 1050, rag: 290, cached: 42 },
                  { time: '08:00', generation: 1200, rag: 310, cached: 48 },
                  { time: '12:00', generation: 1150, rag: 285, cached: 46 },
                  { time: '16:00', generation: 1080, rag: 275, cached: 44 },
                  { time: '20:00', generation: 1075, rag: 280, cached: 45 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="generation" stroke="#8884d8" name="Generation" />
                  <Line type="monotone" dataKey="rag" stroke="#82ca9d" name="RAG" />
                  <Line type="monotone" dataKey="cached" stroke="#ffc658" name="Cached" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* P95 Metrics Tab */}
        <TabsContent value="p95-metrics" className="space-y-4">
          <div className="grid gap-4">
            {p95Metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize">{metric.operation} - {metric.provider}</CardTitle>
                      <CardDescription>P95 latency monitoring</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatDuration(metric.p95)}</div>
                      <p className="text-sm text-gray-600">P95 Latency</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatDuration(metric.p99)}</div>
                      <p className="text-sm text-gray-600">P99 Latency</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatDuration(metric.target)}</div>
                      <p className="text-sm text-gray-600">Target</p>
                    </div>
                  </div>
                  <Progress 
                    value={(metric.p95 / metric.target) * 100} 
                    className="mt-4"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SLO Status Tab */}
        <TabsContent value="slo-status" className="space-y-4">
          <div className="grid gap-4">
            {sloStatus.map((slo, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{slo.operation} SLO</CardTitle>
                    {slo.isViolated ? (
                      <Badge variant="destructive">Violated</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">Compliant</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{formatPercentage(slo.goodRatio)}</div>
                      <p className="text-sm text-gray-600">Good Ratio</p>
                      <p className="text-xs text-gray-500">Target: {formatPercentage(slo.target)}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatPercentage(slo.errorBudgetRemaining)}</div>
                      <p className="text-sm text-gray-600">Error Budget</p>
                      <p className="text-xs text-gray-500">Remaining</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{slo.burnRate5m.toFixed(1)}x</div>
                      <p className="text-sm text-gray-600">Burn Rate 5m</p>
                      <p className="text-xs text-gray-500">Threshold: 14.4x</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{slo.burnRate1h.toFixed(1)}x</div>
                      <p className="text-sm text-gray-600">Burn Rate 1h</p>
                      <p className="text-xs text-gray-500">Threshold: 6.0x</p>
                    </div>
                  </div>
                  
                  {/* Burn Rate Alert */}
                  {slo.burnRate5m > 6.0 && (
                    <Alert className="mt-4" variant={slo.burnRate5m > 14.4 ? "destructive" : "default"}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {slo.burnRate5m > 14.4 ? 'Critical Burn Rate' : 'Warning Burn Rate'}
                      </AlertTitle>
                      <AlertDescription>
                        Error budget will be exhausted in {slo.burnRate5m > 14.4 ? '2 hours' : '5 hours'} at current rate.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cache Analysis Tab */}
        <TabsContent value="cache-analysis" className="space-y-4">
          {cacheMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{cacheMetrics.overall.hitRate.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">
                      {cacheMetrics.overall.eligibleCount} eligible / {cacheMetrics.overall.totalCount} total
                    </p>
                    <Progress value={cacheMetrics.overall.hitRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top-K Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{cacheMetrics.topK.hitRate.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">
                      {cacheMetrics.topK.requestCount} requests
                    </p>
                    <Progress value={cacheMetrics.topK.hitRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Long-Tail Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{cacheMetrics.longTail.hitRate.toFixed(1)}%</div>
                    <p className="text-sm text-gray-600">
                      {cacheMetrics.longTail.requestCount} requests
                    </p>
                    <Progress value={cacheMetrics.longTail.hitRate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cache Hits', value: cacheMetrics.overall.hitRate, fill: '#10b981' },
                          { name: 'Cache Misses', value: 100 - cacheMetrics.overall.hitRate, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Autopilot Tab */}
        <TabsContent value="autopilot" className="space-y-4">
          {autopilotStatus && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Weights</CardTitle>
                    <CardDescription>Current routing weights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(autopilotStatus.providerWeights).map(([provider, weight]) => (
                        <div key={provider} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{provider}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={weight * 100} className="w-24" />
                            <span className="text-sm font-mono">{weight.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Autopilot Status</CardTitle>
                    <CardDescription>Current optimizations and features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Active Optimizations</span>
                        <Badge variant="outline">{autopilotStatus.activeOptimizations}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Stale-While-Revalidate</span>
                        <Badge variant={autopilotStatus.staleWhileRevalidateActive ? "default" : "secondary"}>
                          {autopilotStatus.staleWhileRevalidateActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recent Actions</span>
                        <Badge variant="outline">{autopilotStatus.recentActions.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Autopilot Actions</CardTitle>
                  <CardDescription>Automatic optimizations and adjustments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {autopilotStatus.recentActions.map((action, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4" />
                            <span className="font-medium capitalize">
                              {action.type.replace('_', ' ')}
                            </span>
                            <Badge variant="outline">{action.provider}</Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(action.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{action.reason}</p>
                        <p className="text-sm text-blue-600">{action.expectedImpact}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};