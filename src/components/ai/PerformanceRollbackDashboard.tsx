/**
 * Performance Rollback Dashboard Component
 * 
 * Provides a UI for monitoring and managing performance rollbacks:
 * - Real-time rollback status
 * - Rollback history
 * - Manual rollback triggers
 * - Configuration management
 * - Performance metrics visualization
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
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
    RefreshCw,
    Settings,
    Shield,
    TrendingDown,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface RollbackState {
  id: string;
  timestamp: Date;
  reason: string;
  severity: 'warning' | 'critical' | 'emergency';
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  rollbackSteps: RollbackStep[];
  validationResults: ValidationResult[];
}

interface RollbackStep {
  id: string;
  type: 'traffic_reduction' | 'provider_switch' | 'model_rollback' | 'feature_disable' | 'emergency_stop';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

interface ValidationResult {
  step: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  passed: boolean;
  timestamp: Date;
}

interface PerformanceMetrics {
  errorRate: number;
  p95Latency: number;
  costPerRequest: number;
  throughputRPS: number;
  lastUpdated: Date;
}

interface RollbackDashboardProps {
  className?: string;
}

export const PerformanceRollbackDashboard: React.FC<RollbackDashboardProps> = ({ 
  className = '' 
}) => {
  const [currentRollback, setCurrentRollback] = useState<RollbackState | null>(null);
  const [rollbackHistory, setRollbackHistory] = useState<RollbackState[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [loading, setLoading] = useState(false);

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      // This would integrate with the actual rollback integration service
      setPerformanceMetrics({
        errorRate: 0.02,
        p95Latency: 1200,
        costPerRequest: 0.003,
        throughputRPS: 15,
        lastUpdated: new Date()
      });

      setRollbackHistory([
        {
          id: 'rollback_1704967200_abc123',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          reason: 'P95 latency exceeded 5000ms threshold',
          severity: 'critical',
          status: 'completed',
          rollbackSteps: [
            {
              id: 'provider_switch',
              type: 'provider_switch',
              description: 'Switch to last stable provider configuration',
              status: 'completed',
              startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
              endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
            }
          ],
          validationResults: [
            {
              step: 'provider_switch',
              metric: 'p95Latency',
              expectedValue: 1500,
              actualValue: 1200,
              passed: true,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000)
            }
          ]
        }
      ]);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleManualRollback = async () => {
    setLoading(true);
    try {
      // This would call the actual rollback service
      const newRollback: RollbackState = {
        id: `manual_rollback_${Date.now()}`,
        timestamp: new Date(),
        reason: 'Manual rollback triggered by user',
        severity: 'warning',
        status: 'initiated',
        rollbackSteps: [
          {
            id: 'manual_provider_switch',
            type: 'provider_switch',
            description: 'Manual provider configuration rollback',
            status: 'pending'
          }
        ],
        validationResults: []
      };

      setCurrentRollback(newRollback);
      
      // Simulate rollback execution
      setTimeout(() => {
        setCurrentRollback(prev => prev ? { ...prev, status: 'completed' } : null);
        setRollbackHistory(prev => [newRollback, ...prev]);
      }, 3000);

    } catch (error) {
      console.error('Failed to trigger manual rollback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRollback = async () => {
    if (currentRollback) {
      setCurrentRollback({ ...currentRollback, status: 'cancelled' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency_stop': return <Shield className="h-4 w-4 text-red-500" />;
      case 'traffic_reduction': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'provider_switch': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'model_rollback': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'feature_disable': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const calculateRollbackProgress = (rollback: RollbackState): number => {
    if (rollback.status === 'completed') return 100;
    if (rollback.status === 'failed' || rollback.status === 'cancelled') return 0;
    
    const completedSteps = rollback.rollbackSteps.filter(step => step.status === 'completed').length;
    return (completedSteps / rollback.rollbackSteps.length) * 100;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Rollback Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage automatic performance rollbacks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring Active" : "Monitoring Disabled"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? "Disable" : "Enable"} Monitoring
          </Button>
        </div>
      </div>

      {/* Current Rollback Alert */}
      {currentRollback && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Active Rollback:</strong> {currentRollback.reason}
                <div className="mt-2">
                  <Progress value={calculateRollbackProgress(currentRollback)} className="w-64" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentRollback.status)}
                <Badge variant={getSeverityColor(currentRollback.severity)}>
                  {currentRollback.severity}
                </Badge>
                {currentRollback.status === 'in_progress' && (
                  <Button variant="outline" size="sm" onClick={handleCancelRollback}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Rollback History</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Stable</div>
                <p className="text-xs text-muted-foreground">
                  No active rollbacks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics ? `${(performanceMetrics.errorRate * 100).toFixed(2)}%` : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Within normal range
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P95 Latency</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics ? `${performanceMetrics.p95Latency}ms` : 'Loading...'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Below threshold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rollbacks</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rollbackHistory.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Manual Rollback Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Rollback Controls</CardTitle>
              <CardDescription>
                Trigger manual rollbacks when needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleManualRollback}
                  disabled={loading || !!currentRollback}
                  variant="outline"
                >
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Trigger Manual Rollback
                </Button>
                <p className="text-sm text-muted-foreground">
                  Use only when automatic rollback is not sufficient
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollback History</CardTitle>
              <CardDescription>
                Recent performance rollbacks and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rollbackHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No rollbacks in the last 24 hours
                  </p>
                ) : (
                  rollbackHistory.map((rollback) => (
                    <div key={rollback.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(rollback.status)}
                          <span className="font-medium">{rollback.id}</span>
                          <Badge variant={getSeverityColor(rollback.severity)}>
                            {rollback.severity}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {rollback.timestamp.toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm">{rollback.reason}</p>
                      
                      {/* Rollback Steps */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Rollback Steps:</h4>
                        {rollback.rollbackSteps.map((step) => (
                          <div key={step.id} className="flex items-center space-x-2 text-sm">
                            {getStepTypeIcon(step.type)}
                            <span>{step.description}</span>
                            {getStatusIcon(step.status)}
                          </div>
                        ))}
                      </div>

                      {/* Validation Results */}
                      {rollback.validationResults.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Validation Results:</h4>
                          {rollback.validationResults.map((result, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{result.metric}: {result.actualValue} (expected: {result.expectedValue})</span>
                              {result.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Performance Metrics</CardTitle>
                <CardDescription>
                  Real-time system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceMetrics ? (
                  <>
                    <div className="flex justify-between">
                      <span>Error Rate:</span>
                      <span className="font-mono">{(performanceMetrics.errorRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P95 Latency:</span>
                      <span className="font-mono">{performanceMetrics.p95Latency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Request:</span>
                      <span className="font-mono">${performanceMetrics.costPerRequest.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Throughput:</span>
                      <span className="font-mono">{performanceMetrics.throughputRPS} RPS</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Last Updated:</span>
                      <span>{performanceMetrics.lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </>
                ) : (
                  <p>Loading metrics...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rollback Thresholds</CardTitle>
                <CardDescription>
                  Current thresholds that trigger automatic rollbacks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Emergency Error Rate:</span>
                  <span className="font-mono text-red-600">10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency P95 Latency:</span>
                  <span className="font-mono text-red-600">5000ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Cost/Request:</span>
                  <span className="font-mono text-red-600">$0.10</span>
                </div>
                <div className="flex justify-between">
                  <span>SLO Violation Threshold:</span>
                  <span className="font-mono text-orange-600">3 consecutive</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollback Configuration</CardTitle>
              <CardDescription>
                Configure rollback behavior and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monitoring Enabled</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={isMonitoring}
                      onChange={(e) => setIsMonitoring(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Enable automatic rollback monitoring</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gradual Rollback</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="rounded"
                    />
                    <span className="text-sm">Enable gradual traffic reduction</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Advanced Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};