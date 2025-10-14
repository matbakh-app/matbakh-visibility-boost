import { AutoScalingConfigManager } from '../auto-scaling-config-manager';

describe('AutoScalingConfigManager', () => {
    describe('getAutoScalingConfig', () => {
        it('should return correct configuration for dev environment', () => {
            const config = AutoScalingConfigManager.getAutoScalingConfig('dev');

            expect(config.environment).toBe('dev');
            expect(config.budgetLimits.softBudget).toBe(15);
            expect(config.budgetLimits.burstBudget).toBe(30);
            expect(config.sloTargets.p95ResponseTime).toBe(500);
            expect(config.sloTargets.errorRate).toBe(5);
            expect(config.sloTargets.availability).toBe(95);
        });

        it('should return correct configuration for staging environment', () => {
            const config = AutoScalingConfigManager.getAutoScalingConfig('staging');

            expect(config.environment).toBe('staging');
            expect(config.budgetLimits.softBudget).toBe(25);
            expect(config.budgetLimits.burstBudget).toBe(50);
            expect(config.sloTargets.p95ResponseTime).toBe(300);
            expect(config.sloTargets.errorRate).toBe(2);
            expect(config.sloTargets.availability).toBe(99.5);
        });

        it('should return correct configuration for prod environment', () => {
            const config = AutoScalingConfigManager.getAutoScalingConfig('prod');

            expect(config.environment).toBe('prod');
            expect(config.budgetLimits.softBudget).toBe(60);
            expect(config.budgetLimits.burstBudget).toBe(120);
            expect(config.sloTargets.p95ResponseTime).toBe(200);
            expect(config.sloTargets.errorRate).toBe(1);
            expect(config.sloTargets.availability).toBe(99.9);
        });

        it('should throw error for unknown environment', () => {
            expect(() => {
                AutoScalingConfigManager.getAutoScalingConfig('unknown' as any);
            }).toThrow('Unknown environment: unknown');
        });
    });

    describe('generateLambdaScalingConfig', () => {
        it('should generate config for critical API function', () => {
            const config = AutoScalingConfigManager.generateLambdaScalingConfig(
                'persona-api',
                'arn:aws:lambda:eu-central-1:123456789012:function:persona-api',
                'prod'
            );

            expect(config.functionName).toBe('persona-api');
            expect(config.functionArn).toBe('arn:aws:lambda:eu-central-1:123456789012:function:persona-api');
            expect(config.isApiFunction).toBe(true);
            expect(config.isCriticalPath).toBe(true);
            expect(config.reservedConcurrency).toBe(200);
            expect(config.provisionedConcurrency).toEqual({
                min: 2,
                max: 20,
                targetUtilization: 70
            });
        });

        it('should generate config for non-critical function', () => {
            const config = AutoScalingConfigManager.generateLambdaScalingConfig(
                'background-job',
                'arn:aws:lambda:eu-central-1:123456789012:function:background-job',
                'dev'
            );

            expect(config.functionName).toBe('background-job');
            expect(config.isApiFunction).toBe(false);
            expect(config.isCriticalPath).toBe(false);
            expect(config.reservedConcurrency).toBe(10);
            expect(config.provisionedConcurrency).toBeUndefined();
        });

        it('should identify API functions correctly', () => {
            const apiPatterns = ['api-handler', 'http-endpoint', 'persona-service', 'vc-start', 'upload-handler'];

            apiPatterns.forEach(functionName => {
                const config = AutoScalingConfigManager.generateLambdaScalingConfig(
                    functionName,
                    `arn:aws:lambda:eu-central-1:123456789012:function:${functionName}`,
                    'prod'
                );
                expect(config.isApiFunction).toBe(true);
            });
        });

        it('should identify critical path functions correctly', () => {
            const criticalPatterns = ['persona-api', 'vc-start', 'vc-result', 'auth-handler', 'upload-service'];

            criticalPatterns.forEach(functionName => {
                const config = AutoScalingConfigManager.generateLambdaScalingConfig(
                    functionName,
                    `arn:aws:lambda:eu-central-1:123456789012:function:${functionName}`,
                    'prod'
                );
                expect(config.isCriticalPath).toBe(true);
            });
        });
    });

    describe('generateRDSScalingConfig', () => {
        it('should generate RDS config for dev environment', () => {
            const config = AutoScalingConfigManager.generateRDSScalingConfig('matbakh-db', 'dev');

            expect(config.dbInstanceIdentifier).toBe('matbakh-db');
            expect(config.enableStorageAutoScaling).toBe(true);
            expect(config.maxAllocatedStorage).toBe(100);
            expect(config.alarmThresholds.cpuUtilization).toBe(80);
            expect(config.alarmThresholds.databaseConnections).toBe(50);
            expect(config.alarmThresholds.freeableMemory).toBe(1000000000);
        });

        it('should generate RDS config for prod environment', () => {
            const config = AutoScalingConfigManager.generateRDSScalingConfig('matbakh-db', 'prod');

            expect(config.dbInstanceIdentifier).toBe('matbakh-db');
            expect(config.enableStorageAutoScaling).toBe(true);
            expect(config.maxAllocatedStorage).toBe(1000);
            expect(config.alarmThresholds.cpuUtilization).toBe(60);
            expect(config.alarmThresholds.databaseConnections).toBe(100);
            expect(config.alarmThresholds.freeableMemory).toBe(4000000000);
        });
    });

    describe('generateElastiCacheScalingConfig', () => {
        it('should generate ElastiCache config for dev environment', () => {
            const config = AutoScalingConfigManager.generateElastiCacheScalingConfig('matbakh-redis', 'dev');

            expect(config.replicationGroupId).toBe('matbakh-redis');
            expect(config.minReplicas).toBe(0);
            expect(config.maxReplicas).toBe(1);
            expect(config.targetCpuUtilization).toBe(70);
            expect(config.scaleInCooldown).toBe(600);
            expect(config.scaleOutCooldown).toBe(300);
        });

        it('should generate ElastiCache config for prod environment', () => {
            const config = AutoScalingConfigManager.generateElastiCacheScalingConfig('matbakh-redis', 'prod');

            expect(config.replicationGroupId).toBe('matbakh-redis');
            expect(config.minReplicas).toBe(1);
            expect(config.maxReplicas).toBe(3);
            expect(config.targetCpuUtilization).toBe(60);
            expect(config.scaleInCooldown).toBe(600);
            expect(config.scaleOutCooldown).toBe(300);
        });
    });

    describe('validateConfiguration', () => {
        it('should validate configuration within budget limits', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                10 // €10 estimated cost
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });

        it('should warn about exceeding soft budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                20 // €20 estimated cost (exceeds €15 soft budget)
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€20) exceeds soft budget (€15)'
            );
        });

        it('should warn about exceeding burst budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                35 // €35 estimated cost (exceeds €30 burst budget)
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€35) exceeds burst budget (€30)'
            );
        });

        it('should warn about high reserved concurrency usage', () => {
            const manyFunctions = Array.from({ length: 150 }, (_, i) => `persona-${i}`);

            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                manyFunctions,
                10
            );

            expect(result.warnings.some(w => w.includes('reserved concurrency'))).toBe(true);
            expect(result.recommendations.some(r => r.includes('reducing reserved concurrency'))).toBe(true);
        });

        it('should provide environment-specific recommendations', () => {
            const prodResult = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api'],
                50
            );

            expect(prodResult.recommendations).toContain('Enable detailed monitoring for all critical functions');
            expect(prodResult.recommendations).toContain('Set up cross-region failover for RDS');

            const devResult = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api'],
                10
            );

            expect(devResult.recommendations).toContain('Consider using on-demand scaling only to reduce costs');
        });
    });

    describe('estimateMonthlyCosts', () => {
        it('should estimate costs for Lambda functions', () => {
            const lambdaConfigs = [
                {
                    functionName: 'persona-api',
                    functionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:persona-api',
                    isApiFunction: true,
                    isCriticalPath: true,
                    provisionedConcurrency: { min: 2, max: 10, targetUtilization: 70 },
                    reservedConcurrency: 50
                }
            ];

            const costs = AutoScalingConfigManager.estimateMonthlyCosts(
                'prod',
                lambdaConfigs,
                [],
                []
            );

            expect(costs.lambda).toBeGreaterThan(0);
            expect(costs.total).toBeGreaterThan(0);
            expect(typeof costs.lambda).toBe('number');
            expect(typeof costs.total).toBe('number');
        });

        it('should estimate costs for RDS instances', () => {
            const rdsConfigs = [
                {
                    dbInstanceIdentifier: 'matbakh-db',
                    enableStorageAutoScaling: true,
                    alarmThresholds: {
                        cpuUtilization: 60,
                        databaseConnections: 100,
                        freeableMemory: 4000000000
                    }
                }
            ];

            const costs = AutoScalingConfigManager.estimateMonthlyCosts(
                'prod',
                [],
                rdsConfigs,
                []
            );

            expect(costs.rds).toBe(50); // Expected prod RDS cost
            expect(costs.total).toBeCloseTo(50, 0);
        });

        it('should estimate costs for ElastiCache clusters', () => {
            const elastiCacheConfigs = [
                {
                    replicationGroupId: 'matbakh-redis',
                    minReplicas: 1,
                    maxReplicas: 3,
                    targetCpuUtilization: 60,
                    scaleInCooldown: 600,
                    scaleOutCooldown: 300
                }
            ];

            const costs = AutoScalingConfigManager.estimateMonthlyCosts(
                'prod',
                [],
                [],
                elastiCacheConfigs
            );

            expect(costs.elastiCache).toBe(90); // 3 replicas * €30 each
            expect(costs.total).toBeCloseTo(90, 0);
        });

        it('should include CloudWatch costs', () => {
            const lambdaConfigs = [
                {
                    functionName: 'persona-api',
                    functionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:persona-api',
                    isApiFunction: true,
                    isCriticalPath: true,
                    provisionedConcurrency: { min: 2, max: 10, targetUtilization: 70 },
                    reservedConcurrency: 50
                }
            ];

            const costs = AutoScalingConfigManager.estimateMonthlyCosts(
                'dev',
                lambdaConfigs,
                [],
                []
            );

            expect(costs.cloudWatch).toBeGreaterThan(0);
            expect(costs.cloudWatch).toBe(0.3); // 3 alarms * $0.10 each
        });
    });

    describe('generateScalingRecommendations', () => {
        it('should generate Lambda recommendations based on metrics', () => {
            const currentMetrics = {
                lambdaMetrics: [
                    {
                        functionName: 'persona-api',
                        avgDuration: 300,
                        errorRate: 2,
                        throttles: 5,
                        concurrentExecutions: 10
                    }
                ],
                rdsMetrics: [],
                elastiCacheMetrics: []
            };

            const recommendations = AutoScalingConfigManager.generateScalingRecommendations(
                'prod',
                currentMetrics
            );

            expect(recommendations.lambda).toContain(
                'persona-api: Increase reserved concurrency (currently experiencing throttles)'
            );
            expect(recommendations.lambda).toContain(
                'persona-api: Consider increasing memory allocation or optimizing code (avg duration: 300ms)'
            );
            expect(recommendations.lambda).toContain(
                'persona-api: High error rate (2%) - investigate and fix errors'
            );
        });

        it('should generate RDS recommendations based on metrics', () => {
            const currentMetrics = {
                lambdaMetrics: [],
                rdsMetrics: [
                    {
                        dbInstanceIdentifier: 'matbakh-db',
                        cpuUtilization: 80,
                        databaseConnections: 120,
                        freeableMemory: 1000000000
                    }
                ],
                elastiCacheMetrics: []
            };

            const recommendations = AutoScalingConfigManager.generateScalingRecommendations(
                'prod',
                currentMetrics
            );

            expect(recommendations.rds).toContain(
                'matbakh-db: Consider upgrading instance class (CPU: 80%)'
            );
            expect(recommendations.rds).toContain(
                'matbakh-db: High connection count (120) - consider connection pooling'
            );
            expect(recommendations.rds).toContain(
                'matbakh-db: Low memory (1GB) - consider upgrading'
            );
        });

        it('should generate ElastiCache recommendations based on metrics', () => {
            const currentMetrics = {
                lambdaMetrics: [],
                rdsMetrics: [],
                elastiCacheMetrics: [
                    {
                        replicationGroupId: 'matbakh-redis',
                        cpuUtilization: 80,
                        memoryUsage: 85,
                        evictions: 10
                    }
                ]
            };

            const recommendations = AutoScalingConfigManager.generateScalingRecommendations(
                'prod',
                currentMetrics
            );

            expect(recommendations.elastiCache).toContain(
                'matbakh-redis: High CPU (80%) - consider adding replicas'
            );
            expect(recommendations.elastiCache).toContain(
                'matbakh-redis: High memory usage (85%) - consider scaling up'
            );
            expect(recommendations.elastiCache).toContain(
                'matbakh-redis: Evictions detected - increase memory or optimize TTL settings'
            );
        });

        it('should generate general recommendations for production', () => {
            const currentMetrics = {
                lambdaMetrics: [],
                rdsMetrics: [],
                elastiCacheMetrics: []
            };

            const recommendations = AutoScalingConfigManager.generateScalingRecommendations(
                'prod',
                currentMetrics
            );

            expect(recommendations.general).toContain('Enable AWS X-Ray tracing for better observability');
            expect(recommendations.general).toContain('Set up automated backup and disaster recovery procedures');
        });
    });

    describe('getAllEnvironmentConfigs', () => {
        it('should return all environment configurations', () => {
            const configs = AutoScalingConfigManager.getAllEnvironmentConfigs();

            expect(configs).toHaveProperty('dev');
            expect(configs).toHaveProperty('staging');
            expect(configs).toHaveProperty('prod');

            expect(configs.dev.environment).toBe('dev');
            expect(configs.staging.environment).toBe('staging');
            expect(configs.prod.environment).toBe('prod');
        });

        it('should return immutable configurations', () => {
            const configs1 = AutoScalingConfigManager.getAllEnvironmentConfigs();
            const configs2 = AutoScalingConfigManager.getAllEnvironmentConfigs();

            // Configs should be separate objects
            expect(configs1).not.toBe(configs2);
            expect(configs1.dev.budgetLimits.softBudget).toBe(15);
            expect(configs2.dev.budgetLimits.softBudget).toBe(15);
        });
    });
});