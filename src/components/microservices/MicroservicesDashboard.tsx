/**
 * Microservices Dashboard Component
 * 
 * Provides a comprehensive dashboard for monitoring and managing
 * microservices including health status, metrics, and operations.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMicroservices } from '@/hooks/useMicroservices';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Cpu,
    DollarSign,
    Globe,
    MemoryStick,
    Network,
    RefreshCw,
    Settings,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MicroservicesDashboardProps {
    environment: 'development' | 'staging' | 'production';
    region: 'eu-central-1' | 'eu-west-1';
    refreshInterval?: number; // milliseconds
}

export const MicroservicesDashboard: React.FC<MicroservicesDashboardProps> = ({
    environment,
    region,
    refreshInterval = 30000, // 30 seconds
}) => {
    const {
        services,
        meshStatus,
        costAnalysis,
        discoveryStats,
        isLoading,
        error,
        refreshData,
        scaleService,
        deployService,
        removeService,
    } = useMicroservices(environment, region);

    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh data
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            refreshData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, refreshData]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-100';
            case 'degraded':
                return 'text-yellow-600 bg-yellow-100';
            case 'unhealthy':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="h-4 w-4" />;
            case 'degraded':
                return <AlertTriangle className="h-4 w-4" />;
            case 'unhealthy':
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load microservices data: {error.message}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Microservices Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage your microservices infrastructure
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                        {environment} • {region}
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
                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Auto Refresh
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {services.filter(s => s.status === 'healthy').length} healthy
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mesh Status</CardTitle>
                        <Network className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{meshStatus?.status || 'Unknown'}</div>
                        <p className="text-xs text-muted-foreground">
                            {meshStatus?.virtualServices || 0} virtual services
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            €{costAnalysis?.totalMonthlyCost.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {costAnalysis?.budgetUtilization.toFixed(1) || '0'}% of budget
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Discovery Health</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {discoveryStats?.healthyServices || 0}/{discoveryStats?.totalServices || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {discoveryStats?.averageResponseTime.toFixed(0) || '0'}ms avg response
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="services" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="mesh">Service Mesh</TabsTrigger>
                    <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                    <TabsTrigger value="discovery">Service Discovery</TabsTrigger>
                </TabsList>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-4">
                    <div className="grid gap-4">
                        {services.map((service) => (
                            <Card key={service.serviceName}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                                            <Badge className={getStatusColor(service.status)}>
                                                {getStatusIcon(service.status)}
                                                <span className="ml-1 capitalize">{service.status}</span>
                                            </Badge>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedService(
                                                    selectedService === service.serviceName ? null : service.serviceName
                                                )}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                {selectedService === service.serviceName ? 'Hide' : 'Manage'}
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Last checked: {service.lastCheck.toLocaleTimeString()}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {/* Service Metrics */}
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">CPU</span>
                                            </div>
                                            <Progress value={service.metrics.cpu || 0} className="h-2" />
                                            <p className="text-xs text-muted-foreground">
                                                {service.metrics.cpu?.toFixed(1) || '0'}%
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Memory</span>
                                            </div>
                                            <Progress value={service.metrics.memory || 0} className="h-2" />
                                            <p className="text-xs text-muted-foreground">
                                                {service.metrics.memory?.toFixed(1) || '0'}%
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Requests/min</span>
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {service.metrics.requestRate?.toFixed(0) || '0'}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Error Rate</span>
                                            </div>
                                            <p className="text-lg font-semibold">
                                                {service.metrics.errorRate?.toFixed(2) || '0'}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Service Management */}
                                    {selectedService === service.serviceName && (
                                        <div className="mt-4 pt-4 border-t space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => scaleService(service.serviceName, 'up')}
                                                >
                                                    <TrendingUp className="h-4 w-4 mr-2" />
                                                    Scale Up
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => scaleService(service.serviceName, 'down')}
                                                >
                                                    <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                                                    Scale Down
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deployService(service.serviceName)}
                                                >
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Deploy
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeService(service.serviceName)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>

                                            {/* Instance Details */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Instances</h4>
                                                <div className="grid gap-2">
                                                    {service.instances.map((instance, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-2 bg-muted rounded"
                                                        >
                                                            <span className="text-sm">Instance {index + 1}</span>
                                                            <Badge variant="outline">Running</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {service.error && (
                                        <Alert variant="destructive" className="mt-4">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Service Error</AlertTitle>
                                            <AlertDescription>{service.error}</AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Service Mesh Tab */}
                <TabsContent value="mesh" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Mesh Status</CardTitle>
                            <CardDescription>
                                AWS App Mesh configuration and health
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {meshStatus && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getStatusColor(meshStatus.status)}>
                                            {getStatusIcon(meshStatus.status)}
                                            <span className="ml-1 capitalize">{meshStatus.status}</span>
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Last updated: {meshStatus.lastUpdated.toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Virtual Services</h4>
                                            <p className="text-2xl font-bold">{meshStatus.virtualServices}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Virtual Routers</h4>
                                            <p className="text-2xl font-bold">{meshStatus.virtualRouters}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Virtual Nodes</h4>
                                            <p className="text-2xl font-bold">{meshStatus.virtualNodes}</p>
                                        </div>
                                    </div>

                                    {meshStatus.errors.length > 0 && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Mesh Errors</AlertTitle>
                                            <AlertDescription>
                                                <ul className="list-disc list-inside">
                                                    {meshStatus.errors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cost Analysis Tab */}
                <TabsContent value="costs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost Analysis</CardTitle>
                            <CardDescription>
                                Monthly cost breakdown and budget utilization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {costAnalysis && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Total Monthly Cost</h4>
                                            <p className="text-3xl font-bold">
                                                €{costAnalysis.totalMonthlyCost.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Budget Utilization</h4>
                                            <div className="space-y-2">
                                                <Progress value={costAnalysis.budgetUtilization} className="h-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    {costAnalysis.budgetUtilization.toFixed(1)}% of monthly budget
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {costAnalysis.recommendations.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Cost Recommendations</h4>
                                            <ul className="space-y-1">
                                                {costAnalysis.recommendations.map((recommendation, index) => (
                                                    <li key={index} className="text-sm text-muted-foreground">
                                                        • {recommendation}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Service Discovery Tab */}
                <TabsContent value="discovery" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Discovery</CardTitle>
                            <CardDescription>
                                AWS Cloud Map service registration and health
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {discoveryStats && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Total Services</h4>
                                            <p className="text-2xl font-bold">{discoveryStats.totalServices}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Healthy Services</h4>
                                            <p className="text-2xl font-bold text-green-600">
                                                {discoveryStats.healthyServices}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Unhealthy Services</h4>
                                            <p className="text-2xl font-bold text-red-600">
                                                {discoveryStats.unhealthyServices}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Avg Response Time</h4>
                                            <p className="text-2xl font-bold">
                                                {discoveryStats.averageResponseTime.toFixed(0)}ms
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Services by Environment</h4>
                                            <div className="space-y-1">
                                                {Array.from(discoveryStats.servicesByEnvironment.entries()).map(
                                                    ([env, count]) => (
                                                        <div key={env} className="flex justify-between">
                                                            <span className="text-sm">{env}</span>
                                                            <span className="text-sm font-medium">{count}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Services by Region</h4>
                                            <div className="space-y-1">
                                                {Array.from(discoveryStats.servicesByRegion.entries()).map(
                                                    ([region, count]) => (
                                                        <div key={region} className="flex justify-between">
                                                            <span className="text-sm">{region}</span>
                                                            <span className="text-sm font-medium">{count}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};