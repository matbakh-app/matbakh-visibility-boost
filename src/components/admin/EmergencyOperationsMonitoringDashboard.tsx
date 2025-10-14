/**
 * Emergency Operations Monitoring Dashboard
 * 
 * Provides real-time monitoring and visualization of emergency operations performance
 * to validate the SLA requirement: "Emergency operations complete within 5 seconds > 95% of the time"
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Types for the dashboard
interface EmergencyPerformanceStats {
    totalOperations: number;
    successfulOperations: number;
    operationsWithinSLA: number;
    successRate: number;
    slaComplianceRate: number;
    averageLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    lastUpdated: Date;
    windowStartTime: Date;
    windowEndTime: Date;
}

interface EmergencyPerformanceAlert {
    type: "SLA_BREACH" | "SUCCESS_RATE_LOW" | "LATENCY_HIGH" | "CIRCUIT_BREAKER_OPEN";
    severity: "WARNING" | "CRITICAL";
    message: string;
    timestamp: Date;
    threshold: number;
    actualValue: number;
}

interface EmergencyPerformanceReport {
    stats: EmergencyPerformanceStats;
    isWithinSLA: boolean;
    recentAlerts: EmergencyPerformanceAlert[];
    recommendations: string[];
}

export const EmergencyOperationsMonitoringDashboard: React.FC = () => {
    const [performanceData, setPerformanceData] = useState<EmergencyPerformanceReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Simulate fetching performance data (in real implementation, this would call the API)
    const fetchPerformanceData = async (): Promise<EmergencyPerformanceReport> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data for demonstration
        return {
            stats: {
                totalOperations: 1247,
                successfulOperations: 1198,
                operationsWithinSLA: 1189,
                successRate: 96.1,
                slaComplianceRate: 95.3,
                averageLatencyMs: 3245,
                p95LatencyMs: 4850,
                p99LatencyMs: 4950,
                lastUpdated: new Date(),
                windowStartTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
                windowEndTime: new Date(),
            },
            isWithinSLA: true,
            recentAlerts: [
                {
                    type: "LATENCY_HIGH",
                    severity: "WARNING",
                    message: "P95 latency approaching SLA threshold",
                    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                    threshold: 5000,
                    actualValue: 4850,
                }
            ],
            recommendations: [
                "P95 latency (4850ms) is approaching SLA threshold (5000ms). Consider performance optimizations.",
                "Monitor traffic patterns during peak hours to identify optimization opportunities."
            ],
        };
    };

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPerformanceData();
            setPerformanceData(data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch performance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getSLAStatusBadge = (slaRate: number) => {
        if (slaRate >= 95) {
            return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Within SLA</Badge>;
        } else if (slaRate >= 90) {
            return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
        } else {
            return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Critical</Badge>;
        }
    };

    const getLatencyStatusIcon = (latency: number) => {
        if (latency < 4000) {
            return <TrendingUp className="w-4 h-4 text-green-500" />;
        } else if (latency < 4800) {
            return <Clock className="w-4 h-4 text-yellow-500" />;
        } else {
            return <TrendingDown className="w-4 h-4 text-red-500" />;
        }
    };

    if (isLoading && !performanceData) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!performanceData) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-gray-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load emergency operations performance data</p>
                            <Button onClick={refreshData} className="mt-4">Retry</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { stats, isWithinSLA, recentAlerts, recommendations } = performanceData;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Emergency Operations Monitoring</h1>
                    <p className="text-gray-600">
                        SLA Requirement: Emergency operations complete within 5 seconds &gt; 95% of the time
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </span>
                    <Button onClick={refreshData} disabled={isLoading}>
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* SLA Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.slaComplianceRate.toFixed(1)}%</div>
                            {getSLAStatusBadge(stats.slaComplianceRate)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.operationsWithinSLA} of {stats.totalOperations} operations within 5s
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                            {stats.successRate >= 95 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.successfulOperations} of {stats.totalOperations} operations successful
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.averageLatencyMs}ms</div>
                            {getLatencyStatusIcon(stats.averageLatencyMs)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Target: &lt; 5000ms
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">P95 Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stats.p95LatencyMs}ms</div>
                            {getLatencyStatusIcon(stats.p95LatencyMs)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            P99: {stats.p99LatencyMs}ms
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Overall Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        Overall SLA Status
                        {isWithinSLA ? (
                            <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500 ml-2" />
                        )}
                    </CardTitle>
                    <CardDescription>
                        Emergency operations performance against SLA requirements
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={`p-4 rounded-lg ${isWithinSLA ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">
                                    {isWithinSLA ? 'SLA Requirements Met' : 'SLA Requirements Not Met'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {isWithinSLA
                                        ? 'Emergency operations are performing within acceptable parameters'
                                        : 'Emergency operations are not meeting the required performance thresholds'
                                    }
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    {stats.slaComplianceRate.toFixed(1)}% / 95.0%
                                </div>
                                <div className="text-sm text-gray-500">
                                    Required / Actual
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Alerts */}
            {recentAlerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            Recent Alerts
                            <Badge variant="secondary" className="ml-2">{recentAlerts.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                            Performance alerts from the last 24 hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentAlerts.map((alert, index) => (
                                <div key={index} className={`p-3 rounded-lg border ${alert.severity === 'CRITICAL'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-yellow-50 border-yellow-200'
                                    }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                                    {alert.severity}
                                                </Badge>
                                                <span className="ml-2 font-medium">{alert.type.replace('_', ' ')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {alert.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Recommendations</CardTitle>
                        <CardDescription>
                            Automated suggestions to improve emergency operations performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recommendations.map((recommendation, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm text-gray-700">{recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>
                            Detailed performance statistics for emergency operations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Operations</span>
                                <span className="text-sm">{stats.totalOperations.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Successful Operations</span>
                                <span className="text-sm">{stats.successfulOperations.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Operations Within SLA</span>
                                <span className="text-sm">{stats.operationsWithinSLA.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Average Latency</span>
                                <span className="text-sm">{stats.averageLatencyMs}ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">P95 Latency</span>
                                <span className="text-sm">{stats.p95LatencyMs}ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">P99 Latency</span>
                                <span className="text-sm">{stats.p99LatencyMs}ms</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Monitoring Window</CardTitle>
                        <CardDescription>
                            Current monitoring period and data freshness
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Window Start</span>
                                <span className="text-sm">{stats.windowStartTime.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Window End</span>
                                <span className="text-sm">{stats.windowEndTime.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Last Updated</span>
                                <span className="text-sm">{stats.lastUpdated.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Dashboard Refresh</span>
                                <span className="text-sm">{lastRefresh.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SLA Progress Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle>SLA Compliance Progress</CardTitle>
                    <CardDescription>
                        Visual representation of emergency operations SLA compliance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* SLA Compliance Rate Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">SLA Compliance Rate</span>
                                <span className="text-sm">{stats.slaComplianceRate.toFixed(1)}% / 95.0%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${stats.slaComplianceRate >= 95 ? 'bg-green-500' :
                                            stats.slaComplianceRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(stats.slaComplianceRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Success Rate Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Success Rate</span>
                                <span className="text-sm">{stats.successRate.toFixed(1)}% / 95.0%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${stats.successRate >= 95 ? 'bg-green-500' :
                                            stats.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(stats.successRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* P95 Latency Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">P95 Latency</span>
                                <span className="text-sm">{stats.p95LatencyMs}ms / 5000ms</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${stats.p95LatencyMs < 4000 ? 'bg-green-500' :
                                            stats.p95LatencyMs < 4800 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min((stats.p95LatencyMs / 5000) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Emergency operations management and troubleshooting
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm">
                            View Detailed Logs
                        </Button>
                        <Button variant="outline" size="sm">
                            Export Performance Report
                        </Button>
                        <Button variant="outline" size="sm">
                            Configure Alerts
                        </Button>
                        <Button variant="outline" size="sm">
                            Run Health Check
                        </Button>
                        {!isWithinSLA && (
                            <Button variant="destructive" size="sm">
                                Investigate SLA Breach
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmergencyOperationsMonitoringDashboard;