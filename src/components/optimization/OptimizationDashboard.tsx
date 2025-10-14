/**
 * Optimization Dashboard Component
 * 
 * Provides a comprehensive view of automatic optimization engine status,
 * bundle analysis, and performance optimization opportunities.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Package, 
  Route, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

import { automaticOptimizationEngine } from '@/lib/optimization/automatic-optimization-engine';
import { bundleAnalyzer } from '@/lib/optimization/bundle-analyzer';
import type { 
  RouteAnalysis, 
  OptimizationOpportunity, 
  BundleAnalysisResult 
} from '@/lib/optimization/automatic-optimization-engine';

interface OptimizationDashboardProps {
  className?: string;
}

export const OptimizationDashboard: React.FC<OptimizationDashboardProps> = ({ 
  className = '' 
}) => {
  const [optimizationSummary, setOptimizationSummary] = useState<any>(null);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalysis[]>([]);
  const [bundleAnalysis, setBundleAnalysis] = useState<BundleAnalysisResult | null>(null);
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load optimization data
  useEffect(() => {
    loadOptimizationData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadOptimizationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true);

      // Get optimization engine data
      const summary = automaticOptimizationEngine.getOptimizationSummary();
      const routes = automaticOptimizationEngine.getRouteAnalytics();
      const opps = automaticOptimizationEngine.getOptimizationOpportunities();

      setOptimizationSummary(summary);
      setRouteAnalytics(routes);
      setOpportunities(opps);

      // Get bundle analysis
      try {
        const bundleResult = await bundleAnalyzer.analyzeBundleFromRuntime();
        setBundleAnalysis(bundleResult);
      } catch (error) {
        console.warn('Bundle analysis failed:', error);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadOptimizationData();
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading && !optimizationSummary) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading optimization data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimization Dashboard</h1>
          <p className="text-muted-foreground">
            Automatic performance optimization and bundle analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes Analyzed</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {optimizationSummary?.routesAnalyzed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active route monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimizations Applied</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {optimizationSummary?.optimizationsApplied || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Automatic improvements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bundleAnalysis ? `${bundleAnalysis.stats.totalSize.toFixed(1)}KB` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total bundle size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="routes">Route Analysis</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
        </TabsList>

        {/* Optimization Opportunities */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Optimization Opportunities</span>
              </CardTitle>
              <CardDescription>
                Recommended optimizations ranked by impact and effort
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All optimized!</p>
                  <p className="text-muted-foreground">
                    No optimization opportunities found at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunities.slice(0, 10).map((opportunity, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {opportunity.type.replace('_', ' ')}
                            </Badge>
                            <Badge className={getImpactColor(opportunity.impact)}>
                              {opportunity.impact} impact
                            </Badge>
                            <Badge className={getEffortColor(opportunity.effort)}>
                              {opportunity.effort} effort
                            </Badge>
                          </div>
                          <h4 className="font-medium">{opportunity.description}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opportunity.implementation}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ~{opportunity.estimatedImprovement.toFixed(0)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">
                            estimated improvement
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route Analysis */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5" />
                <span>Route Performance Analysis</span>
              </CardTitle>
              <CardDescription>
                Performance metrics and optimization status for each route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routeAnalytics.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No route data</p>
                  <p className="text-muted-foreground">
                    Navigate through the app to collect route performance data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {routeAnalytics.map((route, index) => (
                    <div 
                      key={index}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-3 h-3 rounded-full ${getPriorityColor(route.priority)}`}
                          />
                          <span className="font-medium">{route.path}</span>
                          <Badge variant="outline" className="capitalize">
                            {route.priority} priority
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {route.usage} visits
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Load Time</div>
                          <div className="font-medium">
                            {route.loadTime.toFixed(0)}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Bundle Size</div>
                          <div className="font-medium">
                            {route.bundleSize.toFixed(1)}KB
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Components</div>
                          <div className="font-medium">
                            {route.componentCount}
                          </div>
                        </div>
                      </div>

                      {route.dependencies.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-muted-foreground mb-1">Dependencies</div>
                          <div className="flex flex-wrap gap-1">
                            {route.dependencies.map((dep, depIndex) => (
                              <Badge key={depIndex} variant="secondary" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {route.optimizationOpportunities.length > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Optimization Opportunities ({route.optimizationOpportunities.length})
                          </div>
                          <div className="space-y-1">
                            {route.optimizationOpportunities.slice(0, 3).map((opp, oppIndex) => (
                              <div key={oppIndex} className="text-sm">
                                <Badge className={getImpactColor(opp.impact)} size="sm">
                                  {opp.impact}
                                </Badge>
                                <span className="ml-2">{opp.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundle Analysis */}
        <TabsContent value="bundle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Bundle Analysis</span>
              </CardTitle>
              <CardDescription>
                Detailed analysis of bundle composition and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bundleAnalysis ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Bundle analysis unavailable</p>
                  <p className="text-muted-foreground">
                    Bundle analysis data is not available at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bundle Health Score */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">Bundle Health Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Overall bundle optimization rating
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        {bundleAnalysis.score}
                      </div>
                      <Progress 
                        value={bundleAnalysis.score} 
                        className="w-24 mt-2"
                      />
                    </div>
                  </div>

                  {/* Bundle Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {bundleAnalysis.stats.chunks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Chunks</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {bundleAnalysis.stats.totalSize.toFixed(1)}KB
                      </div>
                      <div className="text-sm text-muted-foreground">Total Size</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {bundleAnalysis.stats.gzipSize.toFixed(1)}KB
                      </div>
                      <div className="text-sm text-muted-foreground">Gzipped</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {bundleAnalysis.issues.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Issues</div>
                    </div>
                  </div>

                  {/* Bundle Issues */}
                  {bundleAnalysis.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Bundle Issues</h4>
                      <div className="space-y-2">
                        {bundleAnalysis.issues.slice(0, 5).map((issue, index) => (
                          <div 
                            key={index}
                            className="flex items-start justify-between p-3 border rounded"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge 
                                  variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="text-sm font-medium capitalize">
                                  {issue.type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-sm">{issue.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {issue.recommendation}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">
                                {issue.estimatedImpact.toFixed(1)}KB
                              </div>
                              <div className="text-muted-foreground">
                                potential savings
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chunk Breakdown */}
                  <div>
                    <h4 className="font-medium mb-3">Chunk Breakdown</h4>
                    <div className="space-y-2">
                      {bundleAnalysis.stats.chunks
                        .sort((a, b) => b.size - a.size)
                        .slice(0, 8)
                        .map((chunk, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="font-medium">{chunk.name}</div>
                              {chunk.isAsync && (
                                <Badge variant="secondary" size="sm">async</Badge>
                              )}
                              {chunk.isEntry && (
                                <Badge variant="outline" size="sm">entry</Badge>
                              )}
                            </div>
                            <div className="text-sm">
                              {chunk.size.toFixed(1)}KB
                              {chunk.loadTime && (
                                <span className="text-muted-foreground ml-2">
                                  ({chunk.loadTime.toFixed(0)}ms)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Performance */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Cache Performance</span>
              </CardTitle>
              <CardDescription>
                Intelligent caching strategies and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Cache metrics coming soon</p>
                <p className="text-muted-foreground">
                  Cache performance data will be available once service worker is active.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizationDashboard;