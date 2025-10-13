import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutoScaling } from '@/hooks/useAutoScaling';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Database,
    DollarSign,
    RefreshCw,
    Server,
    Settings,
    TrendingUp,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';

interface AutoScalingDashboardProps {
    environment: 'dev' | 'staging' | 'prod';
}

export const AutoScalingDashboard: React.FC<AutoScalingDashboardProps> = ({
    environment
}) => {
    const {
        status,
        metrics,
        recommendations,
        costEstimate,
        isLoading,
        error,
        refreshStatus,
        configureAutoScaling,
        removeAutoScaling
    } = useAutoScaling(environment);

    const [selectedService, setSelectedService] = useState<string>('overview');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading auto-scaling status...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Auto-Scaling Dashboard</h1>
                    <p className="text-muted-foreground">
                        Environment: <Badge variant="outline">{environment.toUpperCase()}</Badge>
                    </p>
                </div>
                <Button onClick={refreshStatus} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lambda Functions</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{status?.lambdaTargets?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Auto-scaling enabled
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">RDS Instances</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.rdsMetrics?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Monitored instances
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ElastiCache</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{status?.elastiCacheTargets?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Scaling targets
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">€{costEstimate?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Estimated
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Status */}
            {costEstimate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Status</CardTitle>
                        <CardDescription>
                            Current spending vs budget limits for {environment}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Soft Budget</span>
                                    <span>€{costEstimate.total} / €{costEstimate.softBudget}</span>
                                </div>
                                <Progress
                                    value={(costEstimate.total / costEstimate.softBudget) * 100}
                                    className="h-2"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Burst Budget</span>
                                    <span>€{costEstimate.total} / €{costEstimate.burstBudget}</span>
                                </div>
                                <Progress
                                    value={(costEstimate.total / costEstimate.burstBudget) * 100}
                                    className="h-2"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Service Tabs */}
            <Tabs value={selectedService} onValueChange={setSelectedService}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="lambda">Lambda</TabsTrigger>
                    <TabsTrigger value="rds">RDS</TabsTrigger>
                    <TabsTrigger value="elasticache">ElastiCache</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <OverviewTab
                        status={status}
                        metrics={metrics}
                        recommendations={recommendations}
                    />
                </TabsContent>

                <TabsContent value="lambda" className="space-y-4">
                    <LambdaTab
                        lambdaTargets={status?.lambdaTargets || []}
                        lambdaMetrics={metrics?.lambdaMetrics || []}
                        recommendations={recommendations?.lambda || []}
                        onConfigure={configureAutoScaling}
                        onRemove={removeAutoScaling}
                    />
                </TabsContent>

                <TabsContent value="rds" className="space-y-4">
                    <RDSTab
                        rdsMetrics={metrics?.rdsMetrics || []}
                        recommendations={recommendations?.rds || []}
                    />
                </TabsContent>

                <TabsContent value="elasticache" className="space-y-4">
                    <ElastiCacheTab
                        elastiCacheTargets={status?.elastiCacheTargets || []}
                        elastiCacheMetrics={metrics?.elastiCacheMetrics || []}
                        recommendations={recommendations?.elastiCache || []}
                        onConfigure={configureAutoScaling}
                        onRemove={removeAutoScaling}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Overview Tab Component
const OverviewTab: React.FC<{
    status: any;
    metrics: any;
    recommendations: any;
}> = ({ status, metrics, recommendations }) => {
    const totalRecommendations = Object.values(recommendations || {})
        .flat()
        .filter(Boolean).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        System Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span>Lambda Functions</span>
                            <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Healthy
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>RDS Instances</span>
                            <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Healthy
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>ElastiCache</span>
                            <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Healthy
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Recommendations
                    </CardTitle>
                    <CardDescription>
                        {totalRecommendations} optimization suggestions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recommendations?.general?.slice(0, 3).map((rec: string, index: number) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                                {rec}
                            </div>
                        ))}
                        {totalRecommendations > 3 && (
                            <p className="text-sm text-muted-foreground">
                                +{totalRecommendations - 3} more recommendations
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Lambda Tab Component
const LambdaTab: React.FC<{
    lambdaTargets: any[];
    lambdaMetrics: any[];
    recommendations: string[];
    onConfigure: (service: string, config: any) => void;
    onRemove: (service: string, resourceId: string) => void;
}> = ({ lambdaTargets, lambdaMetrics, recommendations, onConfigure, onRemove }) => {
    return (
        <div className="space-y-4">
            {/* Lambda Functions */}
            <Card>
                <CardHeader>
                    <CardTitle>Lambda Functions Auto-Scaling</CardTitle>
                    <CardDescription>
                        Provisioned concurrency and scaling policies
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {lambdaTargets.map((target, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded">
                                <div>
                                    <h4 className="font-medium">{target.ResourceId}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Min: {target.MinCapacity} | Max: {target.MaxCapacity}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onConfigure('lambda', target)}
                                    >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Configure
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRemove('lambda', target.ResourceId)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Lambda Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recommendations.map((rec, index) => (
                                <Alert key={index}>
                                    <TrendingUp className="h-4 w-4" />
                                    <AlertDescription>{rec}</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// RDS Tab Component
const RDSTab: React.FC<{
    rdsMetrics: any[];
    recommendations: string[];
}> = ({ rdsMetrics, recommendations }) => {
    return (
        <div className="space-y-4">
            {/* RDS Instances */}
            <Card>
                <CardHeader>
                    <CardTitle>RDS Instances Monitoring</CardTitle>
                    <CardDescription>
                        Database performance metrics and alerts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rdsMetrics.map((metric, index) => (
                            <div key={index} className="p-4 border rounded">
                                <h4 className="font-medium mb-2">{metric.dbInstanceIdentifier}</h4>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">CPU:</span>
                                        <span className="ml-2 font-medium">{metric.cpuUtilization}%</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Connections:</span>
                                        <span className="ml-2 font-medium">{metric.databaseConnections}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Memory:</span>
                                        <span className="ml-2 font-medium">
                                            {Math.round(metric.freeableMemory / 1000000000)}GB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>RDS Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recommendations.map((rec, index) => (
                                <Alert key={index}>
                                    <Database className="h-4 w-4" />
                                    <AlertDescription>{rec}</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// ElastiCache Tab Component
const ElastiCacheTab: React.FC<{
    elastiCacheTargets: any[];
    elastiCacheMetrics: any[];
    recommendations: string[];
    onConfigure: (service: string, config: any) => void;
    onRemove: (service: string, resourceId: string) => void;
}> = ({ elastiCacheTargets, elastiCacheMetrics, recommendations, onConfigure, onRemove }) => {
    return (
        <div className="space-y-4">
            {/* ElastiCache Clusters */}
            <Card>
                <CardHeader>
                    <CardTitle>ElastiCache Auto-Scaling</CardTitle>
                    <CardDescription>
                        Redis cluster scaling and performance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {elastiCacheTargets.map((target, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded">
                                <div>
                                    <h4 className="font-medium">{target.ResourceId}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Min Replicas: {target.MinCapacity} | Max Replicas: {target.MaxCapacity}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onConfigure('elasticache', target)}
                                    >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Configure
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRemove('elasticache', target.ResourceId)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>ElastiCache Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recommendations.map((rec, index) => (
                                <Alert key={index}>
                                    <Server className="h-4 w-4" />
                                    <AlertDescription>{rec}</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};