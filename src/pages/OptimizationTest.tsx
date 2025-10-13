/**
 * Optimization Test Page
 * 
 * Simple test page to verify the automatic optimization engine is working
 * and to demonstrate optimization features.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Package, 
  Route, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import { useOptimization } from '@/hooks/useOptimization';

const OptimizationTest: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    summary,
    routeAnalytics,
    bundleAnalysis,
    opportunities,
    error,
    refresh,
    recordCustomMetric,
    clearError
  } = useOptimization();

  const [testMetrics, setTestMetrics] = useState<Array<{
    name: string;
    value: number;
    timestamp: number;
  }>>([]);

  // Simulate some test metrics
  const simulateMetrics = async () => {
    const metrics = [
      { name: 'page_load_test', value: Math.random() * 3000 + 500 },
      { name: 'bundle_size_test', value: Math.random() * 500 + 200 },
      { name: 'cache_hit_test', value: Math.random() * 100 }
    ];

    for (const metric of metrics) {
      await recordCustomMetric(
        metric.name, 
        metric.value,
        metric.value < 1000 ? 'good' : metric.value < 2000 ? 'needs-improvement' : 'poor'
      );
      
      setTestMetrics(prev => [...prev, {
        ...metric,
        timestamp: Date.now()
      }]);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              Clear Error
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimization Engine Test</h1>
          <p className="text-muted-foreground">
            Test and verify automatic optimization functionality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Initialized" : "Not Initialized"}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engine Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {isInitialized ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {isInitialized ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Optimization engine status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes Analyzed</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.routesAnalyzed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active route monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.optimizationsApplied || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Applied automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Score</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bundleAnalysis?.score || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Bundle health score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>
            Simulate optimization scenarios and test engine functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={simulateMetrics} disabled={isLoading}>
              Simulate Performance Metrics
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Trigger Route Analysis
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Simulate a slow operation
                const start = performance.now();
                setTimeout(() => {
                  const duration = performance.now() - start;
                  recordCustomMetric('slow_operation_test', duration, 'poor');
                }, 100);
              }}
            >
              Simulate Slow Operation
            </Button>
          </div>

          {testMetrics.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recent Test Metrics</h4>
              <div className="space-y-1">
                {testMetrics.slice(-5).map((metric, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{metric.name}</span>
                    <span>{metric.value.toFixed(1)}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Analytics */}
      {routeAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Analytics</CardTitle>
            <CardDescription>
              Performance data for analyzed routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routeAnalytics.slice(0, 5).map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{route.path}</div>
                    <div className="text-sm text-muted-foreground">
                      {route.usage} visits • {route.componentCount} components
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{route.loadTime.toFixed(0)}ms</div>
                    <Badge variant="outline" className="text-xs">
                      {route.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Opportunities</CardTitle>
            <CardDescription>
              Recommended optimizations detected by the engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunities.slice(0, 3).map((opportunity, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {opportunity.type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={opportunity.impact === 'high' ? 'destructive' : 'secondary'}
                      >
                        {opportunity.impact} impact
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">
                      ~{opportunity.estimatedImprovement.toFixed(0)}ms
                    </div>
                  </div>
                  <p className="text-sm">{opportunity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {opportunity.implementation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundle Analysis */}
      {bundleAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Bundle Analysis</CardTitle>
            <CardDescription>
              Current bundle composition and health metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{bundleAnalysis.stats.chunks.length}</div>
                <div className="text-sm text-muted-foreground">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {bundleAnalysis.stats.totalSize.toFixed(1)}KB
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{bundleAnalysis.issues.length}</div>
                <div className="text-sm text-muted-foreground">Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{bundleAnalysis.recommendations.length}</div>
                <div className="text-sm text-muted-foreground">Recommendations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading optimization data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizationTest;