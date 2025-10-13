/**
 * Tests for Environment Manager
 */

import { EnvironmentManager } from '../environment-manager';

describe('EnvironmentManager', () => {
    let manager: EnvironmentManager;

    beforeEach(() => {
        manager = new EnvironmentManager();
    });

    describe('initialization', () => {
        it('should initialize with default environments', () => {
            const environments = manager.listEnvironments();

            expect(environments).toHaveLength(3);
            expect(environments.map(env => env.name)).toEqual(['development', 'staging', 'production']);

            environments.forEach(env => {
                expect(env.status).toBe('active');
                expect(env.config).toBeDefined();
                expect(env.config.replicas).toBeGreaterThan(0);
                expect(env.config.resources).toBeDefined();
                expect(env.config.scaling).toBeDefined();
                expect(env.config.healthCheck).toBeDefined();
                expect(Array.isArray(env.config.secrets)).toBe(true);
                expect(typeof env.config.environmentVariables).toBe('object');
            });
        });

        it('should have correct environment configurations', () => {
            const dev = manager.getEnvironment('development');
            const staging = manager.getEnvironment('staging');
            const prod = manager.getEnvironment('production');

            expect(dev?.config.replicas).toBe(1);
            expect(staging?.config.replicas).toBe(2);
            expect(prod?.config.replicas).toBe(3);

            expect(dev?.config.scaling.maxReplicas).toBe(3);
            expect(staging?.config.scaling.maxReplicas).toBe(5);
            expect(prod?.config.scaling.maxReplicas).toBe(10);
        });
    });

    describe('getEnvironment', () => {
        it('should return environment by name', () => {
            const env = manager.getEnvironment('staging');

            expect(env).toBeDefined();
            expect(env?.name).toBe('staging');
            expect(env?.type).toBe('staging');
            expect(env?.url).toBe('https://staging.matbakh.app');
        });

        it('should return undefined for non-existent environment', () => {
            const env = manager.getEnvironment('non-existent');
            expect(env).toBeUndefined();
        });
    });

    describe('createPromotionPlan', () => {
        it('should create promotion plan between environments', () => {
            const plan = manager.createPromotionPlan(
                'staging',
                'production',
                'v1.2.3',
                ['tech-lead', 'devops-lead']
            );

            expect(plan).toBeDefined();
            expect(plan.fromEnvironment).toBe('staging');
            expect(plan.toEnvironment).toBe('production');
            expect(plan.version).toBe('v1.2.3');
            expect(plan.status).toBe('pending');
            expect(plan.approvals).toHaveLength(2);
            expect(plan.approvals.every(a => a.status === 'pending')).toBe(true);
            expect(plan.changes.length).toBeGreaterThan(0);
        });

        it('should calculate environment changes correctly', () => {
            const plan = manager.createPromotionPlan(
                'development',
                'production',
                'v1.0.0',
                ['admin']
            );

            expect(plan.changes.length).toBeGreaterThan(0);

            // Should detect scaling differences
            const scalingChanges = plan.changes.filter(c => c.type === 'scaling');
            expect(scalingChanges.length).toBeGreaterThan(0);

            // Should detect resource differences
            const resourceChanges = plan.changes.filter(c => c.type === 'config' && (c.key === 'cpu' || c.key === 'memory'));
            expect(resourceChanges.length).toBeGreaterThan(0);

            // Should detect environment variable differences
            const envChanges = plan.changes.filter(c => c.key.startsWith('env.'));
            expect(envChanges.length).toBeGreaterThan(0);
        });

        it('should throw error for invalid environments', () => {
            expect(() => {
                manager.createPromotionPlan('invalid', 'production', 'v1.0.0', ['admin']);
            }).toThrow('Invalid environment specified');

            expect(() => {
                manager.createPromotionPlan('staging', 'invalid', 'v1.0.0', ['admin']);
            }).toThrow('Invalid environment specified');
        });
    });

    describe('approvePromotion', () => {
        it('should approve promotion plan', () => {
            const plan = manager.createPromotionPlan(
                'staging',
                'production',
                'v1.0.0',
                ['tech-lead', 'devops-lead']
            );

            const result1 = manager.approvePromotion(plan.id, 'tech-lead', 'Looks good');
            expect(result1).toBe(false); // Not all approvals complete

            const result2 = manager.approvePromotion(plan.id, 'devops-lead', 'Approved');
            expect(result2).toBe(true); // All approvals complete

            const updatedPlan = manager.getPromotionPlan(plan.id);
            expect(updatedPlan?.status).toBe('approved');
            expect(updatedPlan?.approvals.every(a => a.status === 'approved')).toBe(true);
        });

        it('should throw error for non-existent plan', () => {
            expect(() => {
                manager.approvePromotion('non-existent', 'admin');
            }).toThrow('Promotion plan not found');
        });

        it('should throw error for non-existent approver', () => {
            const plan = manager.createPromotionPlan('staging', 'production', 'v1.0.0', ['admin']);

            expect(() => {
                manager.approvePromotion(plan.id, 'non-existent-approver');
            }).toThrow('Approver not found in plan');
        });
    });

    describe('rejectPromotion', () => {
        it('should reject promotion plan', () => {
            const plan = manager.createPromotionPlan('staging', 'production', 'v1.0.0', ['admin']);

            manager.rejectPromotion(plan.id, 'admin', 'Security concerns');

            const updatedPlan = manager.getPromotionPlan(plan.id);
            expect(updatedPlan?.status).toBe('rejected');

            const approval = updatedPlan?.approvals.find(a => a.approver === 'admin');
            expect(approval?.status).toBe('rejected');
            expect(approval?.comment).toBe('Security concerns');
        });

        it('should throw error for non-existent plan', () => {
            expect(() => {
                manager.rejectPromotion('non-existent', 'admin', 'Rejected');
            }).toThrow('Promotion plan not found');
        });
    });

    describe('executePromotion', () => {
        it('should execute approved promotion', async () => {
            const plan = manager.createPromotionPlan('staging', 'production', 'v1.0.0', ['admin']);

            // Approve the plan
            manager.approvePromotion(plan.id, 'admin');

            // Execute the promotion
            await manager.executePromotion(plan.id);

            const updatedPlan = manager.getPromotionPlan(plan.id);
            expect(updatedPlan?.status).toBe('completed');
            expect(updatedPlan?.executedAt).toBeInstanceOf(Date);

            // Check that environment was updated
            const environment = manager.getEnvironment('production');
            expect(environment?.lastDeployment?.id).toBe(plan.id);
            expect(environment?.lastDeployment?.version).toBe('v1.0.0');
            expect(environment?.lastDeployment?.status).toBe('success');
        });

        it('should throw error for non-approved promotion', async () => {
            const plan = manager.createPromotionPlan('staging', 'production', 'v1.0.0', ['admin']);

            await expect(manager.executePromotion(plan.id)).rejects.toThrow('Promotion plan is not approved');
        });

        it('should throw error for non-existent plan', async () => {
            await expect(manager.executePromotion('non-existent')).rejects.toThrow('Promotion plan not found');
        });
    });

    describe('updateEnvironmentStatus', () => {
        it('should update environment status', () => {
            manager.updateEnvironmentStatus('staging', 'maintenance');

            const environment = manager.getEnvironment('staging');
            expect(environment?.status).toBe('maintenance');
        });

        it('should handle non-existent environment gracefully', () => {
            expect(() => {
                manager.updateEnvironmentStatus('non-existent', 'maintenance');
            }).not.toThrow();
        });
    });

    describe('listPromotionPlans', () => {
        it('should return empty list initially', () => {
            const plans = manager.listPromotionPlans();
            expect(plans).toEqual([]);
        });

        it('should return all promotion plans', () => {
            const plan1 = manager.createPromotionPlan('development', 'staging', 'v1.0.0', ['admin']);
            const plan2 = manager.createPromotionPlan('staging', 'production', 'v1.0.0', ['admin']);

            const plans = manager.listPromotionPlans();
            expect(plans).toHaveLength(2);
            expect(plans.map(p => p.id)).toContain(plan1.id);
            expect(plans.map(p => p.id)).toContain(plan2.id);
        });
    });

    describe('environment change detection', () => {
        it('should detect scaling changes', () => {
            const plan = manager.createPromotionPlan('development', 'production', 'v1.0.0', ['admin']);

            const scalingChanges = plan.changes.filter(c => c.type === 'scaling');
            expect(scalingChanges.length).toBeGreaterThan(0);

            const maxReplicasChange = scalingChanges.find(c => c.key === 'maxReplicas');
            expect(maxReplicasChange).toBeDefined();
            expect(maxReplicasChange?.oldValue).toBe(3); // development max replicas
            expect(maxReplicasChange?.newValue).toBe(10); // production max replicas
        });

        it('should detect resource changes', () => {
            const plan = manager.createPromotionPlan('development', 'production', 'v1.0.0', ['admin']);

            const resourceChanges = plan.changes.filter(c => c.type === 'config' && (c.key === 'cpu' || c.key === 'memory'));
            expect(resourceChanges.length).toBeGreaterThanOrEqual(2); // CPU and memory

            const cpuChange = resourceChanges.find(c => c.key === 'cpu');
            expect(cpuChange?.oldValue).toBe('0.5'); // development CPU
            expect(cpuChange?.newValue).toBe('2'); // production CPU
        });

        it('should detect environment variable changes', () => {
            const plan = manager.createPromotionPlan('development', 'production', 'v1.0.0', ['admin']);

            const envChanges = plan.changes.filter(c => c.key.startsWith('env.'));
            expect(envChanges.length).toBeGreaterThan(0);

            const logLevelChange = envChanges.find(c => c.key === 'env.LOG_LEVEL');
            expect(logLevelChange?.oldValue).toBe('debug'); // development log level
            expect(logLevelChange?.newValue).toBe('warn'); // production log level
        });

        it('should detect new secrets', () => {
            const plan = manager.createPromotionPlan('development', 'production', 'v1.0.0', ['admin']);

            const secretChanges = plan.changes.filter(c => c.type === 'secret');
            expect(secretChanges.length).toBeGreaterThan(0);

            // Production has ENCRYPTION_KEYS that development doesn't have
            const encryptionKeysChange = secretChanges.find(c => c.key === 'ENCRYPTION_KEYS');
            expect(encryptionKeysChange).toBeDefined();
            expect(encryptionKeysChange?.oldValue).toBeNull();
            expect(encryptionKeysChange?.newValue).toBe('NEW_SECRET');
        });
    });

    describe('change impact assessment', () => {
        it('should assign appropriate impact levels', () => {
            const plan = manager.createPromotionPlan('development', 'production', 'v1.0.0', ['admin']);

            // Resource changes should be high impact
            const resourceChanges = plan.changes.filter(c => c.key === 'cpu' || c.key === 'memory');
            resourceChanges.forEach(change => {
                expect(change.impact).toBe('high');
            });

            // Secret changes should be high impact
            const secretChanges = plan.changes.filter(c => c.type === 'secret');
            secretChanges.forEach(change => {
                expect(change.impact).toBe('high');
            });

            // Feature flag changes should be high impact
            const featureFlagChanges = plan.changes.filter(c => c.key.includes('FEATURE_FLAGS'));
            featureFlagChanges.forEach(change => {
                expect(change.impact).toBe('high');
            });
        });
    });
});