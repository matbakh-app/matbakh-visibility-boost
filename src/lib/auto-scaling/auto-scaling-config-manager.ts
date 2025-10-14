/**
 * Auto-Scaling Configuration Manager
 * Manages environment-specific auto-scaling configurations and policies
 */

import { AutoScalingConfig, ElastiCacheScalingConfig, LambdaScalingConfig, RDSScalingConfig } from './auto-scaling-orchestrator';

export interface EnvironmentConfig {
    environment: 'dev' | 'staging' | 'prod';
    budgetLimits: {
        softBudget: number;
        burstBudget: number;
    };
    sloTargets: {
        p95ResponseTime: number;
        errorRate: number;
        availability: number;
    };
    lambdaLimits: {
        reservedConcurrency: number;
        provisionedConcurrency: {
            min: number;
            max: number;
            targetUtilization: number;
        };
    };
    rdsLimits: {
        cpuThreshold: number;
        connectionThreshold: number;
        memoryThreshold: number;
    };
    elastiCacheLimits: {
        minReplicas: number;
        maxReplicas: number;
        targetCpuUtilization: number;
    };
}

export class AutoScalingConfigManager {
    private static readonly ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
        dev: {
            environment: 'dev',
            budgetLimits: {
                softBudget: 15, // €15/month
                burstBudget: 30  // €30/month burst
            },
            sloTargets: {
                p95ResponseTime: 500, // 500ms for dev (relaxed)
                errorRate: 5,         // 5% error rate (relaxed)
                availability: 95      // 95% availability
            },
            lambdaLimits: {
                reservedConcurrency: 10,
                provisionedConcurrency: {
                    min: 0,
                    max: 2,
                    targetUtilization: 70
                }
            },
            rdsLimits: {
                cpuThreshold: 80,     // 80% CPU
                connectionThreshold: 50,
                memoryThreshold: 1000000000 // 1GB
            },
            elastiCacheLimits: {
                minReplicas: 0,
                maxReplicas: 1,
                targetCpuUtilization: 70
            }
        },
        staging: {
            environment: 'staging',
            budgetLimits: {
                softBudget: 25, // €25/month
                burstBudget: 50  // €50/month burst
            },
            sloTargets: {
                p95ResponseTime: 300, // 300ms for staging
                errorRate: 2,         // 2% error rate
                availability: 99.5    // 99.5% availability
            },
            lambdaLimits: {
                reservedConcurrency: 50,
                provisionedConcurrency: {
                    min: 1,
                    max: 5,
                    targetUtilization: 70
                }
            },
            rdsLimits: {
                cpuThreshold: 70,     // 70% CPU
                connectionThreshold: 80,
                memoryThreshold: 2000000000 // 2GB
            },
            elastiCacheLimits: {
                minReplicas: 0,
                maxReplicas: 2,
                targetCpuUtilization: 65
            }
        },
        prod: {
            environment: 'prod',
            budgetLimits: {
                softBudget: 60,  // €60/month
                burstBudget: 120 // €120/month burst
            },
            sloTargets: {
                p95ResponseTime: 200, // 200ms for production
                errorRate: 1,         // 1% error rate
                availability: 99.9    // 99.9% availability
            },
            lambdaLimits: {
                reservedConcurrency: 200,
                provisionedConcurrency: {
                    min: 2,
                    max: 20,
                    targetUtilization: 70
                }
            },
            rdsLimits: {
                cpuThreshold: 60,     // 60% CPU
                connectionThreshold: 100,
                memoryThreshold: 4000000000 // 4GB
            },
            elastiCacheLimits: {
                minReplicas: 1,
                maxReplicas: 3,
                targetCpuUtilization: 60
            }
        }
    };

    /**
     * Get auto-scaling configuration for environment
     */
    static getAutoScalingConfig(environment: 'dev' | 'staging' | 'prod'): AutoScalingConfig {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];
        if (!envConfig) {
            throw new Error(`Unknown environment: ${environment}`);
        }

        return {
            environment: envConfig.environment,
            sloTargets: envConfig.sloTargets,
            budgetLimits: envConfig.budgetLimits
        };
    }

    /**
     * Generate Lambda scaling configuration
     */
    static generateLambdaScalingConfig(
        functionName: string,
        functionArn: string,
        environment: 'dev' | 'staging' | 'prod'
    ): LambdaScalingConfig {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];
        const isApiFunction = this.isApiFunction(functionName);
        const isCriticalPath = this.isCriticalPath(functionName);

        return {
            functionName,
            functionArn,
            isApiFunction,
            isCriticalPath,
            reservedConcurrency: envConfig.lambdaLimits.reservedConcurrency,
            provisionedConcurrency: (isApiFunction && isCriticalPath) ? {
                min: envConfig.lambdaLimits.provisionedConcurrency.min,
                max: envConfig.lambdaLimits.provisionedConcurrency.max,
                targetUtilization: envConfig.lambdaLimits.provisionedConcurrency.targetUtilization
            } : undefined
        };
    }

    /**
     * Generate RDS scaling configuration
     */
    static generateRDSScalingConfig(
        dbInstanceIdentifier: string,
        environment: 'dev' | 'staging' | 'prod'
    ): RDSScalingConfig {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];

        return {
            dbInstanceIdentifier,
            enableStorageAutoScaling: true,
            maxAllocatedStorage: environment === 'prod' ? 1000 : 100, // GB
            alarmThresholds: {
                cpuUtilization: envConfig.rdsLimits.cpuThreshold,
                databaseConnections: envConfig.rdsLimits.connectionThreshold,
                freeableMemory: envConfig.rdsLimits.memoryThreshold
            }
        };
    }

    /**
     * Generate ElastiCache scaling configuration
     */
    static generateElastiCacheScalingConfig(
        replicationGroupId: string,
        environment: 'dev' | 'staging' | 'prod'
    ): ElastiCacheScalingConfig {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];

        return {
            replicationGroupId,
            minReplicas: envConfig.elastiCacheLimits.minReplicas,
            maxReplicas: envConfig.elastiCacheLimits.maxReplicas,
            targetCpuUtilization: envConfig.elastiCacheLimits.targetCpuUtilization,
            scaleInCooldown: 600,  // 10 minutes
            scaleOutCooldown: 300  // 5 minutes
        };
    }

    /**
     * Get all environment configurations
     */
    static getAllEnvironmentConfigs(): Record<string, EnvironmentConfig> {
        return { ...this.ENVIRONMENT_CONFIGS };
    }

    /**
     * Validate configuration against budget limits
     */
    static validateConfiguration(
        environment: 'dev' | 'staging' | 'prod',
        lambdaFunctions: string[],
        estimatedMonthlyCost: number
    ): {
        isValid: boolean;
        warnings: string[];
        recommendations: string[];
    } {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check budget limits
        if (estimatedMonthlyCost > envConfig.budgetLimits.softBudget) {
            warnings.push(
                `Estimated monthly cost (€${estimatedMonthlyCost}) exceeds soft budget (€${envConfig.budgetLimits.softBudget})`
            );
        }

        if (estimatedMonthlyCost > envConfig.budgetLimits.burstBudget) {
            warnings.push(
                `Estimated monthly cost (€${estimatedMonthlyCost}) exceeds burst budget (€${envConfig.budgetLimits.burstBudget})`
            );
        }

        // Check function count vs reserved concurrency
        const criticalFunctions = lambdaFunctions.filter(fn => this.isCriticalPath(fn));
        const totalReservedConcurrency = lambdaFunctions.length * envConfig.lambdaLimits.reservedConcurrency;

        if (totalReservedConcurrency > 1000) { // AWS account limit
            warnings.push(
                `Total reserved concurrency (${totalReservedConcurrency}) may exceed AWS account limits`
            );
            recommendations.push(
                'Consider reducing reserved concurrency per function or using shared concurrency pools'
            );
        }

        // Environment-specific recommendations
        if (environment === 'prod') {
            recommendations.push('Enable detailed monitoring for all critical functions');
            recommendations.push('Set up cross-region failover for RDS');
            recommendations.push('Configure Multi-AZ deployment for ElastiCache');
        }

        if (environment === 'dev') {
            recommendations.push('Consider using on-demand scaling only to reduce costs');
            recommendations.push('Disable provisioned concurrency for non-critical functions');
        }

        return {
            isValid: warnings.length === 0,
            warnings,
            recommendations
        };
    }

    /**
     * Calculate estimated monthly costs
     */
    static estimateMonthlyCosts(
        environment: 'dev' | 'staging' | 'prod',
        lambdaFunctions: LambdaScalingConfig[],
        rdsInstances: RDSScalingConfig[],
        elastiCacheClusters: ElastiCacheScalingConfig[]
    ): {
        lambda: number;
        rds: number;
        elastiCache: number;
        cloudWatch: number;
        total: number;
    } {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];

        // Lambda costs (simplified estimation)
        const lambdaCost = lambdaFunctions.reduce((total, func) => {
            const pcCost = func.provisionedConcurrency
                ? func.provisionedConcurrency.max * 0.0000041667 * 24 * 30 // $0.0000041667 per GB-hour
                : 0;
            const invocationCost = 1000000 * 0.0000002; // Assume 1M invocations per month
            return total + pcCost + invocationCost;
        }, 0);

        // RDS costs (simplified estimation)
        const rdsCost = rdsInstances.length * (environment === 'prod' ? 50 : environment === 'staging' ? 25 : 10);

        // ElastiCache costs (simplified estimation)
        const elastiCacheCost = elastiCacheClusters.reduce((total, cluster) => {
            const nodeCost = cluster.maxReplicas * (environment === 'prod' ? 30 : environment === 'staging' ? 15 : 5);
            return total + nodeCost;
        }, 0);

        // CloudWatch costs (alarms + metrics)
        const alarmCount = lambdaFunctions.length * 3 + rdsInstances.length * 3 + elastiCacheClusters.length * 2;
        const cloudWatchCost = alarmCount * 0.10; // $0.10 per alarm per month

        const total = lambdaCost + rdsCost + elastiCacheCost + cloudWatchCost;

        return {
            lambda: Math.round(lambdaCost * 100) / 100,
            rds: Math.round(rdsCost * 100) / 100,
            elastiCache: Math.round(elastiCacheCost * 100) / 100,
            cloudWatch: Math.round(cloudWatchCost * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    }

    /**
     * Generate scaling recommendations based on current metrics
     */
    static generateScalingRecommendations(
        environment: 'dev' | 'staging' | 'prod',
        currentMetrics: {
            lambdaMetrics: Array<{
                functionName: string;
                avgDuration: number;
                errorRate: number;
                throttles: number;
                concurrentExecutions: number;
            }>;
            rdsMetrics: Array<{
                dbInstanceIdentifier: string;
                cpuUtilization: number;
                databaseConnections: number;
                freeableMemory: number;
            }>;
            elastiCacheMetrics: Array<{
                replicationGroupId: string;
                cpuUtilization: number;
                memoryUsage: number;
                evictions: number;
            }>;
        }
    ): {
        lambda: string[];
        rds: string[];
        elastiCache: string[];
        general: string[];
    } {
        const envConfig = this.ENVIRONMENT_CONFIGS[environment];
        const recommendations = {
            lambda: [] as string[],
            rds: [] as string[],
            elastiCache: [] as string[],
            general: [] as string[]
        };

        // Lambda recommendations
        currentMetrics.lambdaMetrics.forEach(metric => {
            if (metric.throttles > 0) {
                recommendations.lambda.push(
                    `${metric.functionName}: Increase reserved concurrency (currently experiencing throttles)`
                );
            }

            if (metric.avgDuration > envConfig.sloTargets.p95ResponseTime) {
                recommendations.lambda.push(
                    `${metric.functionName}: Consider increasing memory allocation or optimizing code (avg duration: ${metric.avgDuration}ms)`
                );
            }

            if (metric.errorRate > envConfig.sloTargets.errorRate) {
                recommendations.lambda.push(
                    `${metric.functionName}: High error rate (${metric.errorRate}%) - investigate and fix errors`
                );
            }
        });

        // RDS recommendations
        currentMetrics.rdsMetrics.forEach(metric => {
            if (metric.cpuUtilization > envConfig.rdsLimits.cpuThreshold) {
                recommendations.rds.push(
                    `${metric.dbInstanceIdentifier}: Consider upgrading instance class (CPU: ${metric.cpuUtilization}%)`
                );
            }

            if (metric.databaseConnections > envConfig.rdsLimits.connectionThreshold) {
                recommendations.rds.push(
                    `${metric.dbInstanceIdentifier}: High connection count (${metric.databaseConnections}) - consider connection pooling`
                );
            }

            if (metric.freeableMemory < envConfig.rdsLimits.memoryThreshold) {
                recommendations.rds.push(
                    `${metric.dbInstanceIdentifier}: Low memory (${Math.round(metric.freeableMemory / 1000000000)}GB) - consider upgrading`
                );
            }
        });

        // ElastiCache recommendations
        currentMetrics.elastiCacheMetrics.forEach(metric => {
            if (metric.cpuUtilization > envConfig.elastiCacheLimits.targetCpuUtilization) {
                recommendations.elastiCache.push(
                    `${metric.replicationGroupId}: High CPU (${metric.cpuUtilization}%) - consider adding replicas`
                );
            }

            if (metric.memoryUsage > 75) {
                recommendations.elastiCache.push(
                    `${metric.replicationGroupId}: High memory usage (${metric.memoryUsage}%) - consider scaling up`
                );
            }

            if (metric.evictions > 0) {
                recommendations.elastiCache.push(
                    `${metric.replicationGroupId}: Evictions detected - increase memory or optimize TTL settings`
                );
            }
        });

        // General recommendations
        if (environment === 'prod') {
            recommendations.general.push('Enable AWS X-Ray tracing for better observability');
            recommendations.general.push('Set up automated backup and disaster recovery procedures');
        }

        return recommendations;
    }

    // Private helper methods

    private static isApiFunction(functionName: string): boolean {
        const apiPatterns = [
            'api', 'http', 'rest', 'graphql', 'endpoint',
            'persona', 'vc-', 'upload', 'auth'
        ];
        return apiPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }

    private static isCriticalPath(functionName: string): boolean {
        const criticalPatterns = [
            'persona', 'vc-start', 'vc-result', 'auth', 'upload'
        ];
        return criticalPatterns.some(pattern =>
            functionName.toLowerCase().includes(pattern)
        );
    }
}