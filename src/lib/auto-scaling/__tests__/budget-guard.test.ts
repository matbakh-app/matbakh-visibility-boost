import { AutoScalingConfigManager } from '../auto-scaling-config-manager';

/**
 * Budget Guard Tests - Verhindert "Cost Runaway"
 * Diese Tests stellen sicher, dass Konfigurationen die Budget-Limits nicht überschreiten
 */

describe('Budget Guard System', () => {
    describe('Budget Validation', () => {
        it('should accept configuration within dev budget limits', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                10 // €10 estimated cost - within €15 soft budget
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });

        it('should accept configuration within staging budget limits', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'staging',
                ['persona-api', 'vc-start', 'upload-handler'],
                20 // €20 estimated cost - within €25 soft budget
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should accept configuration within prod budget limits', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api', 'vc-start', 'vc-result', 'auth-handler', 'upload-service'],
                55 // €55 estimated cost - within €60 soft budget
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });
    });

    describe('Soft Budget Violations', () => {
        it('should reject dev config that exceeds soft budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                20 // €20 estimated cost - exceeds €15 soft budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€20) exceeds soft budget (€15)'
            );
        });

        it('should reject staging config that exceeds soft budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'staging',
                ['persona-api', 'vc-start', 'upload-handler'],
                30 // €30 estimated cost - exceeds €25 soft budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€30) exceeds soft budget (€25)'
            );
        });

        it('should reject prod config that exceeds soft budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api', 'vc-start', 'vc-result', 'auth-handler'],
                70 // €70 estimated cost - exceeds €60 soft budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€70) exceeds soft budget (€60)'
            );
        });
    });

    describe('Burst Budget Violations', () => {
        it('should reject dev config that exceeds burst budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                35 // €35 estimated cost - exceeds €30 burst budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€35) exceeds burst budget (€30)'
            );
        });

        it('should reject staging config that exceeds burst budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'staging',
                ['persona-api', 'vc-start', 'upload-handler'],
                60 // €60 estimated cost - exceeds €50 burst budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€60) exceeds burst budget (€50)'
            );
        });

        it('should reject prod config that exceeds burst budget', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api', 'vc-start', 'vc-result', 'auth-handler'],
                130 // €130 estimated cost - exceeds €120 burst budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings).toContain(
                'Estimated monthly cost (€130) exceeds burst budget (€120)'
            );
        });
    });

    describe('Reserved Concurrency Limits', () => {
        it('should warn about high reserved concurrency usage', () => {
            // Create many critical functions to exceed concurrency limits
            const manyFunctions = Array.from({ length: 150 }, (_, i) => `persona-${i}`);

            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                manyFunctions,
                10 // Low cost but high concurrency
            );

            expect(result.warnings.some(w => w.includes('reserved concurrency'))).toBe(true);
            expect(result.recommendations.some(r => r.includes('reducing reserved concurrency'))).toBe(true);
        });

        it('should handle reasonable number of functions without warnings', () => {
            const reasonableFunctions = ['persona-api', 'vc-start', 'auth-handler'];

            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                reasonableFunctions,
                50
            );

            expect(result.warnings.some(w => w.includes('reserved concurrency'))).toBe(false);
        });
    });

    describe('Cost Estimation Accuracy', () => {
        it('should provide accurate cost estimates for Lambda functions', () => {
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
            expect(costs.lambda).toBeLessThan(100); // Reasonable upper bound
        });

        it('should include all cost components in total', () => {
            const lambdaConfigs = [
                {
                    functionName: 'persona-api',
                    functionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:persona-api',
                    isApiFunction: true,
                    isCriticalPath: true,
                    provisionedConcurrency: { min: 2, max: 5, targetUtilization: 70 },
                    reservedConcurrency: 50
                }
            ];

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
                lambdaConfigs,
                rdsConfigs,
                elastiCacheConfigs
            );

            expect(costs.total).toBe(costs.lambda + costs.rds + costs.elastiCache + costs.cloudWatch);
            expect(costs.lambda).toBeGreaterThan(0);
            expect(costs.rds).toBeGreaterThan(0);
            expect(costs.elastiCache).toBeGreaterThan(0);
            expect(costs.cloudWatch).toBeGreaterThan(0);
        });
    });

    describe('Environment-Specific Budget Guards', () => {
        it('should have different budget limits per environment', () => {
            const devConfig = AutoScalingConfigManager.getAutoScalingConfig('dev');
            const stagingConfig = AutoScalingConfigManager.getAutoScalingConfig('staging');
            const prodConfig = AutoScalingConfigManager.getAutoScalingConfig('prod');

            expect(devConfig.budgetLimits.softBudget).toBe(15);
            expect(devConfig.budgetLimits.burstBudget).toBe(30);

            expect(stagingConfig.budgetLimits.softBudget).toBe(25);
            expect(stagingConfig.budgetLimits.burstBudget).toBe(50);

            expect(prodConfig.budgetLimits.softBudget).toBe(60);
            expect(prodConfig.budgetLimits.burstBudget).toBe(120);

            // Ensure prod has highest limits
            expect(prodConfig.budgetLimits.softBudget).toBeGreaterThan(stagingConfig.budgetLimits.softBudget);
            expect(stagingConfig.budgetLimits.softBudget).toBeGreaterThan(devConfig.budgetLimits.softBudget);
        });

        it('should enforce burst budget as hard limit', () => {
            const environments: Array<'dev' | 'staging' | 'prod'> = ['dev', 'staging', 'prod'];
            const burstLimits = { dev: 30, staging: 50, prod: 120 };

            environments.forEach(env => {
                const exceedingCost = burstLimits[env] + 10;

                const result = AutoScalingConfigManager.validateConfiguration(
                    env,
                    ['persona-api'],
                    exceedingCost
                );

                expect(result.isValid).toBe(false);
                expect(result.warnings.some(w => w.includes('burst budget'))).toBe(true);
            });
        });
    });

    describe('Budget Guard Integration', () => {
        it('should provide cost-saving recommendations when approaching limits', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api', 'vc-start'],
                14 // €14 - close to €15 soft budget
            );

            expect(result.isValid).toBe(true);
            expect(result.recommendations).toContain('Consider using on-demand scaling only to reduce costs');
            expect(result.recommendations).toContain('Disable provisioned concurrency for non-critical functions');
        });

        it('should provide scaling recommendations for production', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api', 'vc-start', 'auth-handler'],
                50 // Within budget
            );

            expect(result.recommendations).toContain('Enable detailed monitoring for all critical functions');
            expect(result.recommendations).toContain('Set up cross-region failover for RDS');
            expect(result.recommendations).toContain('Configure Multi-AZ deployment for ElastiCache');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle zero cost estimates', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                [],
                0
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle negative cost estimates gracefully', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'dev',
                ['persona-api'],
                -10
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle empty function arrays', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                [],
                30
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle very large cost estimates', () => {
            const result = AutoScalingConfigManager.validateConfiguration(
                'prod',
                ['persona-api'],
                10000 // €10,000 - way over budget
            );

            expect(result.isValid).toBe(false);
            expect(result.warnings.length).toBeGreaterThanOrEqual(2); // Both soft and burst budget warnings
        });
    });

    describe('Budget Monitoring Integration', () => {
        it('should validate that budget monitoring is properly configured', () => {
            const environments = AutoScalingConfigManager.getAllEnvironmentConfigs();

            Object.entries(environments).forEach(([env, config]) => {
                expect(config.budgetLimits.softBudget).toBeGreaterThan(0);
                expect(config.budgetLimits.burstBudget).toBeGreaterThan(config.budgetLimits.softBudget);
                expect(config.environment).toBe(env);
            });
        });

        it('should ensure total budget allocation is reasonable', () => {
            const environments = AutoScalingConfigManager.getAllEnvironmentConfigs();
            const totalSoftBudget = Object.values(environments)
                .reduce((sum, config) => sum + config.budgetLimits.softBudget, 0);
            const totalBurstBudget = Object.values(environments)
                .reduce((sum, config) => sum + config.budgetLimits.burstBudget, 0);

            expect(totalSoftBudget).toBe(100); // €15 + €25 + €60 = €100
            expect(totalBurstBudget).toBe(200); // €30 + €50 + €120 = €200
        });
    });
});