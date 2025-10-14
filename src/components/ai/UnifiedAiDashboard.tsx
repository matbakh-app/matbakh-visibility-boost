/**
 * Unified AI Dashboard Component
 * 
 * Provides comprehensive management interface for the multi-provider AI system
 * including provider health, metrics, configuration, and testing capabilities.
 */

import {
    Activity,
    AlertCircle,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Cpu,
    DollarSign,
    Network,
    RefreshCw,
    Settings,
    Shield,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { useAiMetrics, useProviderManagement } from '../../hooks/useUnifiedAi';
import { Provider } from '../../lib/ai-orchestrator/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface UnifiedAiDashboardProps {
  className?: string;
}

/**
 * Main dashboard component for unified AI management
 */
export function UnifiedAiDashboard({ className }: UnifiedAiDashboardProps) {
  const { metrics, health, isLoading, refreshMetrics } = useAiMetrics(10000);
  const { testAllProviders, resetAllCircuitBreakers } = useProviderManagement();
  const [testResults, setTestResults] = useState<Record<Provider, boolean> | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAllProviders = async () => {
    setIsTesting(true);
    try {
      const results = await testAllProviders();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to test providers:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetCircuitBreakers = () => {
    resetAllCircuitBreakers();
    refreshMetrics();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified AI Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage multi-provider AI integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestAllProviders}
            disabled={isTesting}
          >
            <Network className={`h-4 w-4 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
            Test All
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.successfulRequests || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageLatency ? `${Math.round(metrics.averageLatency)}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{metrics?.costPerRequest ? metrics.costPerRequest.toFixed(4) : '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.cacheHitRate ? `${Math.round(metrics.cacheHitRate * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Response caching
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {health.map((providerHealth) => (
              <ProviderHealthCard
                key={providerHealth.provider}
                health={providerHealth}
                onReset={() => handleResetCircuitBreakers()}
              />
            ))}
          </div>

          {/* Provider Distribution */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
                <CardDescription>
                  Request distribution across providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.providerDistribution).map(([provider, count]) => (
                    <div key={provider} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium capitalize">
                        {provider}
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={(count / metrics.totalRequests) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div className="w-16 text-sm text-muted-foreground text-right">
                        {count} ({Math.round((count / metrics.totalRequests) * 100)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <MetricsOverview metrics={metrics} health={health} />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <ProviderTesting 
            testResults={testResults}
            onTest={handleTestAllProviders}
            isTesting={isTesting}
          />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <ConfigurationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Provider health card component
 */
interface ProviderHealthCardProps {
  health: {
    provider: Provider;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    errorRate: number;
    lastCheck: Date;
    circuitBreakerState: 'closed' | 'open' | 'half-open';
  };
  onReset: () => void;
}

function ProviderHealthCard({ health, onReset }: ProviderHealthCardProps) {
  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
    }
  };

  const getCircuitBreakerColor = () => {
    switch (health.circuitBreakerState) {
      case 'closed':
        return 'text-green-600';
      case 'half-open':
        return 'text-yellow-600';
      case 'open':
        return 'text-red-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
          {health.provider}
        </CardTitle>
        {getStatusIcon()}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm capitalize">{health.status}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Latency:</span>
            <span>{Math.round(health.latency)}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error Rate:</span>
            <span>{(health.errorRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Circuit:</span>
            <span className={`capitalize ${getCircuitBreakerColor()}`}>
              {health.circuitBreakerState}
            </span>
          </div>
        </div>

        {health.circuitBreakerState === 'open' && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
          >
            <Shield className="h-3 w-3 mr-2" />
            Reset Circuit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Metrics overview component
 */
interface MetricsOverviewProps {
  metrics: any;
  health: any[];
}

function MetricsOverview({ metrics, health }: MetricsOverviewProps) {
  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">No metrics available</div>
        </CardContent>
      </Card>
    );
  }

  const successRate = metrics.totalRequests > 0 
    ? (metrics.successfulRequests / metrics.totalRequests) * 100 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Success Rate</span>
              <span>{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Requests</div>
              <div className="text-lg font-semibold">{metrics.totalRequests}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Failed Requests</div>
              <div className="text-lg font-semibold text-red-600">
                {metrics.failedRequests}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {health.map((h) => (
              <div key={h.provider} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    h.status === 'healthy' ? 'bg-green-500' :
                    h.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm capitalize">{h.provider}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(h.latency)}ms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Provider testing component
 */
interface ProviderTestingProps {
  testResults: Record<Provider, boolean> | null;
  onTest: () => void;
  isTesting: boolean;
}

function ProviderTesting({ testResults, onTest, isTesting }: ProviderTestingProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Provider Connectivity Test
          </CardTitle>
          <CardDescription>
            Test connectivity and basic functionality of all AI providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onTest} disabled={isTesting} className="w-full">
            <Network className={`h-4 w-4 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
            {isTesting ? 'Testing...' : 'Run Connectivity Tests'}
          </Button>

          {testResults && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Test Results:</h4>
              {Object.entries(testResults).map(([provider, success]) => (
                <div key={provider} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    {success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{provider}</span>
                  </div>
                  <Badge variant={success ? 'default' : 'destructive'}>
                    {success ? 'Connected' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Configuration panel component
 */
function ConfigurationPanel() {
  const [config, setConfig] = useState({
    fallbackStrategy: 'cost-optimized',
    enableCaching: true,
    enableMonitoring: true,
    maxRetries: 3,
    timeoutMs: 30000,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure unified AI API behavior and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Management</AlertTitle>
            <AlertDescription>
              Configuration changes require API restart to take effect. 
              This feature will be enhanced in future versions.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fallback Strategy</label>
              <select 
                className="w-full p-2 border rounded"
                value={config.fallbackStrategy}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  fallbackStrategy: e.target.value 
                }))}
              >
                <option value="cost-optimized">Cost Optimized</option>
                <option value="latency-optimized">Latency Optimized</option>
                <option value="round-robin">Round Robin</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Retries</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={config.maxRetries}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxRetries: parseInt(e.target.value) 
                }))}
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timeout (ms)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={config.timeoutMs}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  timeoutMs: parseInt(e.target.value) 
                }))}
                min="5000"
                max="120000"
                step="1000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableCaching"
                checked={config.enableCaching}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  enableCaching: e.target.checked 
                }))}
              />
              <label htmlFor="enableCaching" className="text-sm">
                Enable Response Caching
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableMonitoring"
                checked={config.enableMonitoring}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  enableMonitoring: e.target.checked 
                }))}
              />
              <label htmlFor="enableMonitoring" className="text-sm">
                Enable Performance Monitoring
              </label>
            </div>
          </div>

          <Button className="w-full" disabled>
            <Settings className="h-4 w-4 mr-2" />
            Apply Configuration (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}