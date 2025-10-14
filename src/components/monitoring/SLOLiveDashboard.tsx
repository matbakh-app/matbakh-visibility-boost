/**
 * Live SLO Dashboard Component
 * 
 * Real-time monitoring dashboard for all SLOs with live updates and alerts
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperimentWinRate } from '@/hooks/useExperimentWinRate';
import { useSLOMonitoring } from '@/hooks/useSLOMonitoring';
import { SLOStatus } from '@/lib/monitoring/slo-monitoring-service';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';

interface SLOLiveDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showExperiments?: boolean;
}

export const SLOLiveDashboard: React.FC<SLOLiveDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
  showExperiments = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const {
    sloDefinitions,
    sloStatuses,
    activeAlerts,
    systemHealth,
    isLoading,
    error,
    refreshData,
    resolveAlert
  } = useSLOMonitoring({ autoRefresh, refreshInterval });

  const {
    experiments,
    winRates,
    costImpact,
    isLoading: experimentsLoading,
    refreshExperiments
  } = useExperimentWinRate({ autoRefresh, refreshInterval });

  // Get SLO status color
  const getStatusColor = (status: SLOStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get SLO status icon
  const getStatusIcon = (status: SLOStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter SLOs by category
  const filteredSLOs = sloStatuses.filter(slo => {
    if (selectedCategory === 'all') return true;
    const definition = sloDefinitions.find(def => def.id === slo.sloId);
    return definition?.category === selectedCategory;
  });

  // Filter alerts
  const filteredAlerts = activeAlerts.filter(alert => {
    if (alertFilter === 'all') return true;
    return alert.severity === alertFilter;
  });

  // Get categories
  const categories = ['all', ...new Set(sloDefinitions.map(def => def.category))];

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading SLO Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live SLO Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all Service Level Objectives
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={systemHealth.overall === 'healthy' ? 'default' : 'destructive'}>
            {systemHealth.overall.toUpperCase()}
          </Badge>
          <Button onClick={refreshData} disabled={isLoading} size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.sloCompliance.toFixed(1)}%</div>
            <Progress value={systemHealth.sloCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{systemHealth.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.criticalAlerts} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Up</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.services.filter(s => s.status === 'up').length}/
              {systemHealth.services.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(systemHealth.services.reduce((acc, s) => acc + s.uptime, 0) / systemHealth.services.length).toFixed(1)}% avg uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date().toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="slos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="slos">SLOs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({activeAlerts.length})</TabsTrigger>
          {showExperiments && (
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
          )}
        </TabsList>

        {/* SLOs Tab */}
        <TabsContent value="slos" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Category:</span>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* SLO Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSLOs.map(slo => {
              const definition = sloDefinitions.find(def => def.id === slo.sloId);
              if (!definition) return null;

              return (
                <Card key={slo.sloId} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{definition.name}</CardTitle>
                      {getStatusIcon(slo.status)}
                    </div>
                    <CardDescription className="text-xs">
                      {definition.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Current Value vs Target */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current</span>
                      <span className={`text-sm font-medium ${getStatusColor(slo.status)}`}>
                        {slo.currentValue.toFixed(1)} {definition.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Target</span>
                      <span className="text-sm font-medium">
                        {definition.operator === 'lte' ? '≤' : '≥'} {definition.target} {definition.unit}
                      </span>
                    </div>

                    {/* Compliance */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Compliance</span>
                        <span className="text-sm font-medium">{slo.compliance.toFixed(1)}%</span>
                      </div>
                      <Progress value={slo.compliance} />
                    </div>

                    {/* Error Budget */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Error Budget</span>
                        <span className="text-sm font-medium">{slo.errorBudgetRemaining.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={slo.errorBudgetRemaining} 
                        className={slo.errorBudgetRemaining < 20 ? 'bg-red-100' : ''}
                      />
                    </div>

                    {/* Trend */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trend</span>
                      <div className="flex items-center space-x-1">
                        {slo.trend === 'improving' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : slo.trend === 'degrading' ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <Activity className="h-3 w-3 text-gray-600" />
                        )}
                        <span className="text-xs capitalize">{slo.trend}</span>
                      </div>
                    </div>

                    {/* Violations */}
                    {slo.violationCount24h > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Violations (24h)</span>
                        <Badge variant="destructive" className="text-xs">
                          {slo.violationCount24h}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Severity:</span>
            {(['all', 'critical', 'warning'] as const).map(severity => (
              <Button
                key={severity}
                variant={alertFilter === severity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertFilter(severity)}
              >
                {severity}
              </Button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-2">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No active alerts</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map(alert => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>SLO: {alert.sloId}</span>
                          <span>Current: {alert.currentValue}</span>
                          <span>Threshold: {alert.threshold}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Experiments Tab */}
        {showExperiments && (
          <TabsContent value="experiments" className="space-y-4">
            <ExperimentWinRateSection 
              experiments={experiments}
              winRates={winRates}
              costImpact={costImpact}
              isLoading={experimentsLoading}
              onRefresh={refreshExperiments}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Experiment Win Rate Section Component
interface ExperimentWinRateSectionProps {
  experiments: any[];
  winRates: any[];
  costImpact: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ExperimentWinRateSection: React.FC<ExperimentWinRateSectionProps> = ({
  experiments,
  winRates,
  costImpact,
  isLoading,
  onRefresh
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Experiment Win Rates & Cost Impact</h3>
        <Button onClick={onRefresh} disabled={isLoading} size="sm">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map(experiment => {
          const winRate = winRates.find(wr => wr.experimentId === experiment.id);
          const cost = costImpact.find(ci => ci.experimentId === experiment.id);

          return (
            <Card key={experiment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{experiment.name}</CardTitle>
                  <Badge variant={experiment.status === 'running' ? 'default' : 'secondary'}>
                    {experiment.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {experiment.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Win Rate */}
                {winRate && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-sm font-medium">{winRate.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={winRate.rate} />
                  </div>
                )}

                {/* Cost Impact */}
                {cost && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Impact</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-sm font-medium ${
                        cost.impact > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {cost.impact > 0 ? '+' : ''}{cost.impact.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {/* Traffic Split */}
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Traffic Split</span>
                  {experiment.variants?.map((variant: any, index: number) => (
                    <div key={variant.name} className="flex items-center justify-between">
                      <span className="text-xs">{variant.name}</span>
                      <span className="text-xs font-medium">{variant.traffic}%</span>
                    </div>
                  ))}
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Participants</span>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{experiment.participants || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {experiments.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active experiments</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SLOLiveDashboard;