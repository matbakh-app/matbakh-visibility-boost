/**
 * Environment Manager - Handles environment promotion and configuration
 */

export interface Environment {
    name: string;
    type: 'development' | 'staging' | 'production';
    url: string;
    config: EnvironmentConfig;
    status: 'active' | 'inactive' | 'maintenance';
    lastDeployment?: {
        id: string;
        timestamp: Date;
        version: string;
        status: 'success' | 'failed';
    };
}

export interface EnvironmentConfig {
    replicas: number;
    resources: {
        cpu: string;
        memory: string;
    };
    scaling: {
        minReplicas: number;
        maxReplicas: number;
        targetCPU: number;
    };
    healthCheck: {
        path: string;
        interval: number;
        timeout: number;
        retries: number;
    };
    secrets: string[];
    environmentVariables: Record<string, string>;
}

export interface PromotionPlan {
    id: string;
    fromEnvironment: string;
    toEnvironment: string;
    version: string;
    changes: EnvironmentChange[];
    approvals: PromotionApproval[];
    status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
    createdAt: Date;
    executedAt?: Date;
}

export interface EnvironmentChange {
    type: 'config' | 'secret' | 'scaling' | 'feature_flag';
    key: string;
    oldValue: any;
    newValue: any;
    impact: 'low' | 'medium' | 'high';
}

export interface PromotionApproval {
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp?: Date;
    comment?: string;
}

export class EnvironmentManager {
    private environments = new Map<string, Environment>();
    private promotionPlans = new Map<string, PromotionPlan>();

    constructor() {
        this.initializeDefaultEnvironments();
    }

    /**
     * Initialize default environments
     */
    private initializeDefaultEnvironments(): void {
        const environments: Environment[] = [
            {
                name: 'development',
                type: 'development',
                url: 'https://dev.matbakh.app',
                status: 'active',
                config: {
                    replicas: 1,
                    resources: {
                        cpu: '0.5',
                        memory: '512Mi'
                    },
                    scaling: {
                        minReplicas: 1,
                        maxReplicas: 3,
                        targetCPU: 70
                    },
                    healthCheck: {
                        path: '/health',
                        interval: 30,
                        timeout: 5,
                        retries: 3
                    },
                    secrets: ['DATABASE_URL', 'API_KEYS'],
                    environmentVariables: {
                        NODE_ENV: 'development',
                        LOG_LEVEL: 'debug',
                        FEATURE_FLAGS: 'all_enabled'
                    }
                }
            },
            {
                name: 'staging',
                type: 'staging',
                url: 'https://staging.matbakh.app',
                status: 'active',
                config: {
                    replicas: 2,
                    resources: {
                        cpu: '1',
                        memory: '1Gi'
                    },
                    scaling: {
                        minReplicas: 2,
                        maxReplicas: 5,
                        targetCPU: 60
                    },
                    healthCheck: {
                        path: '/health',
                        interval: 20,
                        timeout: 5,
                        retries: 3
                    },
                    secrets: ['DATABASE_URL', 'API_KEYS', 'THIRD_PARTY_TOKENS'],
                    environmentVariables: {
                        NODE_ENV: 'staging',
                        LOG_LEVEL: 'info',
                        FEATURE_FLAGS: 'staging_enabled'
                    }
                }
            },
            {
                name: 'production',
                type: 'production',
                url: 'https://matbakh.app',
                status: 'active',
                config: {
                    replicas: 3,
                    resources: {
                        cpu: '2',
                        memory: '2Gi'
                    },
                    scaling: {
                        minReplicas: 3,
                        maxReplicas: 10,
                        targetCPU: 50
                    },
                    healthCheck: {
                        path: '/health',
                        interval: 10,
                        timeout: 3,
                        retries: 5
                    },
                    secrets: ['DATABASE_URL', 'API_KEYS', 'THIRD_PARTY_TOKENS', 'ENCRYPTION_KEYS'],
                    environmentVariables: {
                        NODE_ENV: 'production',
                        LOG_LEVEL: 'warn',
                        FEATURE_FLAGS: 'production_enabled'
                    }
                }
            }
        ];

        environments.forEach(env => {
            this.environments.set(env.name, env);
        });
    }

    /**
     * Create environment promotion plan
     */
    createPromotionPlan(
        fromEnvironment: string,
        toEnvironment: string,
        version: string,
        requiredApprovers: string[]
    ): PromotionPlan {
        const fromEnv = this.environments.get(fromEnvironment);
        const toEnv = this.environments.get(toEnvironment);

        if (!fromEnv || !toEnv) {
            throw new Error('Invalid environment specified');
        }

        const changes = this.calculateEnvironmentChanges(fromEnv, toEnv);
        const approvals = requiredApprovers.map(approver => ({
            approver,
            status: 'pending' as const
        }));

        const plan: PromotionPlan = {
            id: this.generatePromotionId(),
            fromEnvironment,
            toEnvironment,
            version,
            changes,
            approvals,
            status: 'pending',
            createdAt: new Date()
        };

        this.promotionPlans.set(plan.id, plan);
        return plan;
    }

    /**
     * Calculate changes between environments
     */
    private calculateEnvironmentChanges(fromEnv: Environment, toEnv: Environment): EnvironmentChange[] {
        const changes: EnvironmentChange[] = [];

        // Compare scaling configuration
        if (fromEnv.config.scaling.maxReplicas !== toEnv.config.scaling.maxReplicas) {
            changes.push({
                type: 'scaling',
                key: 'maxReplicas',
                oldValue: fromEnv.config.scaling.maxReplicas,
                newValue: toEnv.config.scaling.maxReplicas,
                impact: 'medium'
            });
        }

        // Compare resources
        if (fromEnv.config.resources.cpu !== toEnv.config.resources.cpu) {
            changes.push({
                type: 'config',
                key: 'cpu',
                oldValue: fromEnv.config.resources.cpu,
                newValue: toEnv.config.resources.cpu,
                impact: 'high'
            });
        }

        if (fromEnv.config.resources.memory !== toEnv.config.resources.memory) {
            changes.push({
                type: 'config',
                key: 'memory',
                oldValue: fromEnv.config.resources.memory,
                newValue: toEnv.config.resources.memory,
                impact: 'high'
            });
        }

        // Compare environment variables
        Object.keys(toEnv.config.environmentVariables).forEach(key => {
            const fromValue = fromEnv.config.environmentVariables[key];
            const toValue = toEnv.config.environmentVariables[key];

            if (fromValue !== toValue) {
                changes.push({
                    type: 'config',
                    key: `env.${key}`,
                    oldValue: fromValue,
                    newValue: toValue,
                    impact: key.includes('FEATURE_FLAGS') ? 'high' : 'low'
                });
            }
        });

        // Compare secrets
        const newSecrets = toEnv.config.secrets.filter(secret => !fromEnv.config.secrets.includes(secret));
        newSecrets.forEach(secret => {
            changes.push({
                type: 'secret',
                key: secret,
                oldValue: null,
                newValue: 'NEW_SECRET',
                impact: 'high'
            });
        });

        return changes;
    }

    /**
     * Approve promotion plan
     */
    approvePromotion(planId: string, approver: string, comment?: string): boolean {
        const plan = this.promotionPlans.get(planId);
        if (!plan) {
            throw new Error('Promotion plan not found');
        }

        const approval = plan.approvals.find(a => a.approver === approver);
        if (!approval) {
            throw new Error('Approver not found in plan');
        }

        approval.status = 'approved';
        approval.timestamp = new Date();
        approval.comment = comment;

        // Check if all approvals are complete
        const allApproved = plan.approvals.every(a => a.status === 'approved');
        if (allApproved) {
            plan.status = 'approved';
        }

        return allApproved;
    }

    /**
     * Reject promotion plan
     */
    rejectPromotion(planId: string, approver: string, comment: string): void {
        const plan = this.promotionPlans.get(planId);
        if (!plan) {
            throw new Error('Promotion plan not found');
        }

        const approval = plan.approvals.find(a => a.approver === approver);
        if (!approval) {
            throw new Error('Approver not found in plan');
        }

        approval.status = 'rejected';
        approval.timestamp = new Date();
        approval.comment = comment;
        plan.status = 'rejected';
    }

    /**
     * Execute approved promotion
     */
    async executePromotion(planId: string): Promise<void> {
        const plan = this.promotionPlans.get(planId);
        if (!plan) {
            throw new Error('Promotion plan not found');
        }

        if (plan.status !== 'approved') {
            throw new Error('Promotion plan is not approved');
        }

        plan.status = 'executing';
        plan.executedAt = new Date();

        try {
            // Apply configuration changes
            await this.applyEnvironmentChanges(plan.toEnvironment, plan.changes);

            // Update environment with new deployment info
            const environment = this.environments.get(plan.toEnvironment)!;
            environment.lastDeployment = {
                id: plan.id,
                timestamp: new Date(),
                version: plan.version,
                status: 'success'
            };

            plan.status = 'completed';
        } catch (error) {
            plan.status = 'failed';

            // Update environment with failed deployment info
            const environment = this.environments.get(plan.toEnvironment)!;
            environment.lastDeployment = {
                id: plan.id,
                timestamp: new Date(),
                version: plan.version,
                status: 'failed'
            };

            throw error;
        }
    }

    /**
     * Apply environment changes
     */
    private async applyEnvironmentChanges(environmentName: string, changes: EnvironmentChange[]): Promise<void> {
        const environment = this.environments.get(environmentName);
        if (!environment) {
            throw new Error('Environment not found');
        }

        for (const change of changes) {
            switch (change.type) {
                case 'config':
                    await this.applyConfigChange(environment, change);
                    break;
                case 'scaling':
                    await this.applyScalingChange(environment, change);
                    break;
                case 'secret':
                    await this.applySecretChange(environment, change);
                    break;
                case 'feature_flag':
                    await this.applyFeatureFlagChange(environment, change);
                    break;
            }
        }
    }

    /**
     * Apply configuration change
     */
    private async applyConfigChange(environment: Environment, change: EnvironmentChange): Promise<void> {
        // Implementation would update actual environment configuration
        console.log(`Applying config change to ${environment.name}: ${change.key} = ${change.newValue}`);

        if (change.key === 'cpu') {
            environment.config.resources.cpu = change.newValue;
        } else if (change.key === 'memory') {
            environment.config.resources.memory = change.newValue;
        } else if (change.key.startsWith('env.')) {
            const envKey = change.key.substring(4);
            environment.config.environmentVariables[envKey] = change.newValue;
        }
    }

    /**
     * Apply scaling change
     */
    private async applyScalingChange(environment: Environment, change: EnvironmentChange): Promise<void> {
        console.log(`Applying scaling change to ${environment.name}: ${change.key} = ${change.newValue}`);

        if (change.key === 'maxReplicas') {
            environment.config.scaling.maxReplicas = change.newValue;
        } else if (change.key === 'minReplicas') {
            environment.config.scaling.minReplicas = change.newValue;
        }
    }

    /**
     * Apply secret change
     */
    private async applySecretChange(environment: Environment, change: EnvironmentChange): Promise<void> {
        console.log(`Applying secret change to ${environment.name}: ${change.key}`);

        if (!environment.config.secrets.includes(change.key)) {
            environment.config.secrets.push(change.key);
        }
    }

    /**
     * Apply feature flag change
     */
    private async applyFeatureFlagChange(environment: Environment, change: EnvironmentChange): Promise<void> {
        console.log(`Applying feature flag change to ${environment.name}: ${change.key} = ${change.newValue}`);
        // Implementation would update feature flag service
    }

    /**
     * Get environment
     */
    getEnvironment(name: string): Environment | undefined {
        return this.environments.get(name);
    }

    /**
     * List all environments
     */
    listEnvironments(): Environment[] {
        return Array.from(this.environments.values());
    }

    /**
     * Get promotion plan
     */
    getPromotionPlan(planId: string): PromotionPlan | undefined {
        return this.promotionPlans.get(planId);
    }

    /**
     * List promotion plans
     */
    listPromotionPlans(): PromotionPlan[] {
        return Array.from(this.promotionPlans.values());
    }

    /**
     * Update environment status
     */
    updateEnvironmentStatus(name: string, status: Environment['status']): void {
        const environment = this.environments.get(name);
        if (environment) {
            environment.status = status;
        }
    }

    private generatePromotionId(): string {
        return `promotion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const environmentManager = new EnvironmentManager();