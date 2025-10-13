/**
 * Deployment Dashboard - UI for managing deployments and monitoring
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeployment } from '@/hooks/useDeployment';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    GitBranch,
    Monitor,
    Play,
    RotateCcw,
    Settings,
    TrendingUp,
    XCircle
} from 'lucide-react';
import React, { useState } from 'react';

export const DeploymentDashboard: React.FC = () => {
    const {
        deployments,
        activeDeployment,
        metrics,
        alerts,
        environments,
        promotionPlans,
        startDeployment,
        rollbackDeployment,
        acknowledgeAlert,
        createPromotionPlan,
        approvePromotion
    } = useDeployment();

    const [selectedEnvironment, setSelectedEnvironment] = useState('staging');
    const [deploymentStrategy, setDeploymentStrategy] = useState<'blue-green' | 'rolling' | 'canary'>('blue-green');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'bg-green-500';
            case 'deploying': return 'bg-blue-500';
            case 'testing': return 'bg-yellow-500';
            case 'failed': return 'bg-red-500';
            case 'rolling_back': return 'bg-orange-500';
            case 'rolled_back': return 'bg-gray-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="h-4 w-4" />;
            case 'deploying': return <Activity className="h-4 w-4 animate-spin" />;
            case 'testing': return <Monitor className="h-4 w-4" />;
            case 'failed': return <XCircle className="h-4 w-4" />;
            case 'rolling_back': return <RotateCcw className="h-4 w-4 animate-spin" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'low': return 'bg-blue-100 text-blue-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'critical': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleStartDeployment = async () => {
        try {
            await startDeployment({
                environment: selectedEnvironment as any,
                strategy: deploymentStrategy,
                healthCheckUrl: `https://${selectedEnvironment}.matbakh.app/health`,
                rollbackThreshold: 5, // 5% error rate threshold
                deploymentTimeout: 30, // 30 minutes
                preDeploymentChecks: ['database', 'external-apis', 'feature-flags'],
                postDeploymentChecks: ['health', 'smoke-tests', 'performance']
            });
        } catch (error) {
            console.error('Deployment failed:', error);
        }
    };

    const handleRollback = async (deploymentId: string) => {
        try {
            await rollbackDeployment(deploymentId, 'Manual rollback initiated by user');
        } catch (error) {
            console.error('Rollback failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Deployment Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage deployments with one-click automation and monitoring
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleStartDeployment} className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Deploy to {selectedEnvironment}
                    </Button>
                </div>
            </div>

            {/* Active Alerts */}
            {alerts.filter(alert => !alert.resolvedAt).length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {alerts.filter(alert => !alert.resolvedAt).length} active deployment alerts require attention
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="deployments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="deployments">Deployments</TabsTrigger>
                    <TabsTrigger value="environments">Environments</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                </TabsList>

                {/* Deployments Tab */}
                <TabsContent value="deployments" className="space-y-4">
                    <div className="grid gap-4">
                        {/* Deployment Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Deployment Configuration
                                </CardTitle>
                                <CardDescription>
                                    Configure your deployment settings and strategy
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Environment</label>
                                        <select
                                            value={selectedEnvironment}
                                            onChange={(e) => setSelectedEnvironment(e.target.value)}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        >
                                            <option value="development">Development</option>
                                            <option value="staging">Staging</option>
                                            <option value="production">Production</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Strategy</label>
                                        <select
                                            value={deploymentStrategy}
                                            onChange={(e) => setDeploymentStrategy(e.target.value as any)}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        >
                                            <option value="blue-green">Blue-Green</option>
                                            <option value="rolling">Rolling</option>
                                            <option value="canary">Canary</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Active Deployment */}
                        {activeDeployment && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Active Deployment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(activeDeployment.status)}
                                                <span className="font-medium">{activeDeployment.id}</span>
                                                <Badge className={getStatusColor(activeDeployment.status)}>
                                                    {activeDeployment.status}
                                                </Badge>
                                            </div>
                                            {activeDeployment.status === 'deploying' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRollback(activeDeployment.id)}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    Rollback
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Environment:</span>
                                                <span className="ml-2 font-medium">{activeDeployment.environment}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Strategy:</span>
                                                <span className="ml-2 font-medium">{activeDeployment.strategy}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Started:</span>
                                                <span className="ml-2 font-medium">
                                                    {activeDeployment.startTime.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Duration:</span>
                                                <span className="ml-2 font-medium">
                                                    {Math.round((Date.now() - activeDeployment.startTime.getTime()) / 1000 / 60)}m
                                                </span>
                                            </div>
                                        </div>

                                        {/* Health Checks */}
                                        <div>
                                            <h4 className="font-medium mb-2">Health Checks</h4>
                                            <div className="space-y-2">
                                                {activeDeployment.healthChecks.map((check, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <span>{check.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {check.responseTime && (
                                                                <span className="text-muted-foreground">{check.responseTime}ms</span>
                                                            )}
                                                            <Badge
                                                                variant={check.status === 'pass' ? 'default' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {check.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div>
                                            <h4 className="font-medium mb-2">Current Metrics</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Error Rate:</span>
                                                    <span className="ml-2 font-medium">{activeDeployment.metrics.errorRate.toFixed(2)}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Response Time:</span>
                                                    <span className="ml-2 font-medium">{activeDeployment.metrics.responseTime.toFixed(0)}ms</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Throughput:</span>
                                                    <span className="ml-2 font-medium">{activeDeployment.metrics.throughput.toFixed(0)} req/min</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">CPU Usage:</span>
                                                    <span className="ml-2 font-medium">{activeDeployment.metrics.cpuUsage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Deployments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Deployments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {deployments.slice(0, 5).map((deployment) => (
                                        <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(deployment.status)}
                                                <div>
                                                    <div className="font-medium">{deployment.id}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {deployment.environment} • {deployment.strategy}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={getStatusColor(deployment.status)}>
                                                    {deployment.status}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {deployment.startTime.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Environments Tab */}
                <TabsContent value="environments" className="space-y-4">
                    <div className="grid gap-4">
                        {environments.map((env) => (
                            <Card key={env.name}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="capitalize">{env.name}</span>
                                        <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                                            {env.status}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>{env.url}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Replicas:</span>
                                            <span className="ml-2 font-medium">{env.config.replicas}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">CPU:</span>
                                            <span className="ml-2 font-medium">{env.config.resources.cpu}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Memory:</span>
                                            <span className="ml-2 font-medium">{env.config.resources.memory}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Max Replicas:</span>
                                            <span className="ml-2 font-medium">{env.config.scaling.maxReplicas}</span>
                                        </div>
                                    </div>
                                    {env.lastDeployment && (
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Last Deployment:</span>
                                                <span className="ml-2 font-medium">{env.lastDeployment.version}</span>
                                                <Badge
                                                    className={`ml-2 ${env.lastDeployment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {env.lastDeployment.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-4">
                    <div className="grid gap-4">
                        {/* Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Active Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {alerts.filter(alert => !alert.resolvedAt).map((alert) => (
                                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                <div>
                                                    <div className="font-medium">{alert.message}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {alert.deploymentId} • {alert.timestamp.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getSeverityColor(alert.severity)}>
                                                    {alert.severity}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.filter(alert => !alert.resolvedAt).length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                            No active alerts
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metrics Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Metrics Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Error Rate</div>
                                        <div className="text-2xl font-bold">2.1%</div>
                                        <Progress value={2.1} className="mt-2" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Response Time</div>
                                        <div className="text-2xl font-bold">145ms</div>
                                        <Progress value={14.5} className="mt-2" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Throughput</div>
                                        <div className="text-2xl font-bold">1.2k req/min</div>
                                        <Progress value={60} className="mt-2" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Availability</div>
                                        <div className="text-2xl font-bold">99.9%</div>
                                        <Progress value={99.9} className="mt-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Promotions Tab */}
                <TabsContent value="promotions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5" />
                                Environment Promotions
                            </CardTitle>
                            <CardDescription>
                                Manage environment promotions and approvals
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {promotionPlans.map((plan) => (
                                    <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium">
                                                {plan.fromEnvironment} → {plan.toEnvironment}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Version {plan.version} • {plan.changes.length} changes
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={plan.status === 'approved' ? 'default' : 'secondary'}>
                                                {plan.status}
                                            </Badge>
                                            {plan.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => approvePromotion(plan.id, 'current-user')}
                                                >
                                                    Approve
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {promotionPlans.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No promotion plans
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};