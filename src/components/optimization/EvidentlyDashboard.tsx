/**
 * Evidently Optimization Dashboard Component
 * 
 * Provides:
 * - Feature flag management interface
 * - Experiment monitoring and control
 * - Performance metrics visualization
 * - A/B test results display
 */

import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Settings,
    TrendingDown,
    TrendingUp,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useEvidentlyOptimization } from '../../hooks/useEvidentlyOptimization';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  variation: string;
  traffic: number;
}

interface ExperimentStatus {
  name: string;
  status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  participants: number;
  treatments: Array<{
    name: string;
    traffic: number;
    conversionRate?: number;
  }>;
  metrics: Array<{
    name: string;
    improvement: number;
    significance: boolean;
  }>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export const EvidentlyDashboard: React.FC = () => {
  const {
    evaluateMultipleFeatures,
    recordMetric,
    recordPerformanceMetrics,
    getBundleOptimization,
    getCachingStrategy,
    getLazyLoadingMode,
    getDatabaseOptimization,
    isLoading,
    error,
    healthCheck
  } = useEvidentlyOptimization();

  const [activeTab, setActiveTab] = useState('features');
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [experiments, setExperiments] = useState<ExperimentStatus[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      // Check health
      const healthy = await healthCheck();
      setIsHealthy(healthy);

      // Load feature flags
      const featureResults = evaluateMultipleFeatures([
        'bundle-optimization',
        'caching-strategy',
        'lazy-loading',
        'database-optimization'
      ]);

      const featureFlags: FeatureFlag[] = [
        {
          name: 'bundle-optimization',
          description: 'Advanced bundle optimization techniques',
          enabled: featureResults['bundle-optimization']?.value !== false,
          variation: featureResults['bundle-optimization']?.variation || 'disabled',
          traffic: 100
        },
        {
          name: 'caching-strategy',
          description: 'Intelligent caching strategy selection',
          enabled: featureResults['caching-strategy']?.value !== 'none',
          variation: featureResults['caching-strategy']?.variation || 'memory',
          traffic: 100
        },
        {
          name: 'lazy-loading',
          description: 'Component and route lazy loading',
          enabled: featureResults['lazy-loading']?.value !== false,
          variation: featureResults['lazy-loading']?.variation || 'routes',
          traffic: 100
        },
        {
          name: 'database-optimization',
          description: 'Database query optimization features',
          enabled: featureResults['database-optimization']?.value !== false,
          variation: featureResults['database-optimization']?.variation || 'pooling',
          traffic: 100
        }
      ];

      setFeatures(featureFlags);

      // Mock experiment data (in real implementation, this would come from Evidently API)
      setExperiments([
        {
          name: 'bundle-size-optimization',
          status: 'RUNNING',
          startDate: '2025-01-14',
          participants: 1250,
          treatments: [
            { name: 'control', traffic: 50, conversionRate: 12.5 },
            { name: 'treatment', traffic: 50, conversionRate: 15.2 }
          ],
          metrics: [
            { name: 'bundleSize', improvement: -23.5, significance: true },
            { name: 'loadTime', improvement: -18.2, significance: true }
          ]
        },
        {
          name: 'caching-performance-test',
          status: 'RUNNING',
          startDate: '2025-01-10',
          participants: 2100,
          treatments: [
            { name: 'memory-only', traffic: 33, conversionRate: 11.8 },
            { name: 'redis-only', traffic: 33, conversionRate: 14.1 },
            { name: 'hybrid', traffic: 34, conversionRate: 16.3 }
          ],
          metrics: [
            { name: 'cacheHitRate', improvement: 34.7, significance: true },
            { name: 'renderTime', improvement: -12.8, significance: false }
          ]
        }
      ]);

      // Mock performance metrics
      setMetrics([
        { name: 'Page Load Time', value: 1.2, unit: 's', trend: 'down', change: -15.3 },
        { name: 'Bundle Size', value: 450, unit: 'KB', trend: 'down', change: -23.5 },
        { name: 'Cache Hit Rate', value: 92.5, unit: '%', trend: 'up', change: 8.2 },
        { name: 'Error Rate', value: 0.8, unit: '%', trend: 'down', change: -45.2 }
      ]);
    };

    initializeDashboard();
  }, [evaluateMultipleFeatures, healthCheck]);

  const handleFeatureToggle = async (featureName: string, enabled: boolean) => {
    // In a real implementation, this would update the feature flag via Evidently API
    setFeatures(prev => prev.map(feature => 
      feature.name === featureName 
        ? { ...feature, enabled }
        : feature
    ));

    // Record the change as a metric
    await recordMetric('feature_toggle', enabled ? 1 : 0);
  };

  const handleExperimentAction = async (experimentName: string, action: 'start' | 'stop') => {
    // In a real implementation, this would start/stop the experiment via Evidently API
    setExperiments(prev => prev.map(exp => 
      exp.name === experimentName 
        ? { ...exp, status: action === 'start' ? 'RUNNING' : 'COMPLETED' }
        : exp
    ));

    await recordMetric('experiment_action', action === 'start' ? 1 : 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Evidently dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Evidently dashboard: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Optimization Dashboard</h1>
          <p className="text-gray-600">CloudWatch Evidently A/B Testing & Feature Flags</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isHealthy ? 'default' : 'destructive'}>
            {isHealthy ? 'Healthy' : 'Unhealthy'}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Feature Flags Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {feature.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(enabled) => handleFeatureToggle(feature.name, enabled)}
                  />
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-2">
                    {feature.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm">
                    <span>Variation: <Badge variant="outline">{feature.variation}</Badge></span>
                    <span>Traffic: {feature.traffic}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          {experiments.map((experiment) => (
            <Card key={experiment.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(experiment.status)}
                    <CardTitle>{experiment.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                    <Badge variant={experiment.status === 'RUNNING' ? 'default' : 'secondary'}>
                      {experiment.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    {experiment.status === 'CREATED' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleExperimentAction(experiment.name, 'start')}
                      >
                        Start
                      </Button>
                    )}
                    {experiment.status === 'RUNNING' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExperimentAction(experiment.name, 'stop')}
                      >
                        Stop
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Participants */}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>{experiment.participants.toLocaleString()}</strong> participants
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Started {experiment.startDate}
                    </span>
                  </div>

                  {/* Treatments */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Treatments:</span>
                    {experiment.treatments.map((treatment) => (
                      <div key={treatment.name} className="flex items-center justify-between text-sm">
                        <span>{treatment.name}</span>
                        <div className="flex items-center space-x-2">
                          <span>{treatment.traffic}%</span>
                          {treatment.conversionRate && (
                            <Badge variant="outline">{treatment.conversionRate}% CVR</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 space-y-2">
                  <span className="text-sm font-medium">Key Metrics:</span>
                  {experiment.metrics.map((metric) => (
                    <div key={metric.name} className="flex items-center justify-between">
                      <span className="text-sm">{metric.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          metric.improvement > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                        </span>
                        {metric.significance && (
                          <Badge variant="default" className="text-xs">Significant</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  {getTrendIcon(metric.trend)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </div>
                  <p className={`text-xs ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% from last week
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Key performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Performance chart would be displayed here</p>
                  <p className="text-sm text-gray-400">Integration with monitoring system required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Optimization Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                  <p className="text-sm font-medium text-green-800">Bundle Optimization</p>
                  <p className="text-sm text-green-700">
                    Advanced optimization shows 23.5% size reduction. Consider rolling out to 100% of users.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800">Caching Strategy</p>
                  <p className="text-sm text-blue-700">
                    Hybrid caching shows best performance. Recommend gradual rollout.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm font-medium text-yellow-800">Database Optimization</p>
                  <p className="text-sm text-yellow-700">
                    Connection pooling is stable. Consider testing full optimization suite.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experiment Calendar</CardTitle>
                <CardDescription>Upcoming and ongoing experiments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">Bundle Size Optimization</span>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Caching Performance Test</span>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Lazy Loading Experiment</span>
                    <Badge variant="outline">Planned</Badge>
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