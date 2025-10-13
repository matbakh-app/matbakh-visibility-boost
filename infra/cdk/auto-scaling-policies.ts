/**
 * Auto-Scaling Policies - Infrastructure as Code
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 * 
 * This module contains all auto-scaling policies for Lambda, RDS, ElastiCache, and CloudFront
 * All policies are versioned and reviewed for production deployment
 */

import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

export interface AutoScalingPolicyProps {
    environment: 'dev' | 'staging' | 'prod';
    resourceId: string;
    serviceNamespace: string;
    scalableDimension: string;
    minCapacity: number;
    maxCapacity: number;
    targetValue: number;
    scaleInCooldown?: number;
    scaleOutCooldown?: number;
}

/**
 * Lambda Provisioned Concurrency Auto-Scaling Policy
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class LambdaProvisionedConcurrencyPolicy extends Construct {
    public readonly scalableTarget: applicationautoscaling.ScalableTarget;
    public readonly scalingPolicy: applicationautoscaling.TargetTrackingScalingPolicy;

    constructor(scope: Construct, id: string, props: AutoScalingPolicyProps) {
        super(scope, id);

        // Create scalable target
        this.scalableTarget = new applicationautoscaling.ScalableTarget(this, 'ScalableTarget', {
            serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
            scalableDimension: 'lambda:function:ProvisionedConcurrency',
            resourceId: props.resourceId,
            minCapacity: props.minCapacity,
            maxCapacity: props.maxCapacity,
        });

        // Create target tracking scaling policy
        this.scalingPolicy = this.scalableTarget.scaleToTrackMetric('TargetTrackingPolicy', {
            targetValue: props.targetValue,
            predefinedMetric: applicationautoscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
            scaleInCooldown: cdk.Duration.seconds(props.scaleInCooldown || 300),
            scaleOutCooldown: cdk.Duration.seconds(props.scaleOutCooldown || 120),
        });

        // Add tags
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('Service', 'auto-scaling');
        cdk.Tags.of(this).add('Component', 'lambda-provisioned-concurrency');
        cdk.Tags.of(this).add('Version', '1.0.0');
    }
}

/**
 * ElastiCache Replica Auto-Scaling Policy
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class ElastiCacheReplicaPolicy extends Construct {
    public readonly scalableTarget: applicationautoscaling.ScalableTarget;
    public readonly scalingPolicy: applicationautoscaling.TargetTrackingScalingPolicy;

    constructor(scope: Construct, id: string, props: AutoScalingPolicyProps) {
        super(scope, id);

        // Create scalable target
        this.scalableTarget = new applicationautoscaling.ScalableTarget(this, 'ScalableTarget', {
            serviceNamespace: applicationautoscaling.ServiceNamespace.ELASTICACHE,
            scalableDimension: 'elasticache:replication-group:Replicas',
            resourceId: props.resourceId,
            minCapacity: props.minCapacity,
            maxCapacity: props.maxCapacity,
        });

        // Create target tracking scaling policy
        this.scalingPolicy = this.scalableTarget.scaleToTrackMetric('TargetTrackingPolicy', {
            targetValue: props.targetValue,
            predefinedMetric: applicationautoscaling.PredefinedMetric.ELASTICACHE_PRIMARY_ENGINE_CPU_UTILIZATION,
            scaleInCooldown: cdk.Duration.seconds(props.scaleInCooldown || 600),
            scaleOutCooldown: cdk.Duration.seconds(props.scaleOutCooldown || 300),
        });

        // Add tags
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('Service', 'auto-scaling');
        cdk.Tags.of(this).add('Component', 'elasticache-replica');
        cdk.Tags.of(this).add('Version', '1.0.0');
    }
}

/**
 * Step Scaling Policy for burst scenarios
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class StepScalingPolicy extends Construct {
    public readonly scalingPolicy: applicationautoscaling.StepScalingPolicy;

    constructor(scope: Construct, id: string, props: {
        scalableTarget: applicationautoscaling.ScalableTarget;
        environment: string;
        steps: Array<{ lower?: number; upper?: number; change: number }>;
        adjustmentType?: applicationautoscaling.AdjustmentType;
        cooldown?: cdk.Duration;
    }) {
        super(scope, id);

        this.scalingPolicy = new applicationautoscaling.StepScalingPolicy(this, 'StepScalingPolicy', {
            scalingTarget: props.scalableTarget,
            adjustmentType: props.adjustmentType || applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
            cooldown: props.cooldown || cdk.Duration.minutes(5),
            scalingSteps: props.steps.map(step => ({
                lower: step.lower,
                upper: step.upper,
                change: step.change
            }))
        });

        // Add tags
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('Service', 'auto-scaling');
        cdk.Tags.of(this).add('Component', 'step-scaling');
        cdk.Tags.of(this).add('Version', '1.0.0');
    }
}

/**
 * Schedule-based Scaling Policy for predictable patterns
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class ScheduleScalingPolicy extends Construct {
    constructor(scope: Construct, id: string, props: {
        scalableTarget: applicationautoscaling.ScalableTarget;
        environment: string;
        schedules: Array<{
            name: string;
            schedule: applicationautoscaling.Schedule;
            minCapacity?: number;
            maxCapacity?: number;
        }>;
    }) {
        super(scope, id);

        props.schedules.forEach((schedule, index) => {
            props.scalableTarget.scaleOnSchedule(`Schedule${index}`, {
                schedule: schedule.schedule,
                minCapacity: schedule.minCapacity,
                maxCapacity: schedule.maxCapacity,
            });
        });

        // Add tags
        cdk.Tags.of(this).add('Environment', props.environment);
        cdk.Tags.of(this).add('Service', 'auto-scaling');
        cdk.Tags.of(this).add('Component', 'schedule-scaling');
        cdk.Tags.of(this).add('Version', '1.0.0');
    }
}

/**
 * Policy Factory for creating environment-specific policies
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class AutoScalingPolicyFactory {
    /**
     * Create Lambda Provisioned Concurrency policy for environment
     */
    static createLambdaPolicy(
        scope: Construct,
        id: string,
        functionName: string,
        environment: 'dev' | 'staging' | 'prod'
    ): LambdaProvisionedConcurrencyPolicy {
        const configs = {
            dev: { min: 0, max: 2, target: 70 },
            staging: { min: 1, max: 5, target: 70 },
            prod: { min: 2, max: 20, target: 70 }
        };

        const config = configs[environment];

        return new LambdaProvisionedConcurrencyPolicy(scope, id, {
            environment,
            resourceId: `function:${functionName}`,
            serviceNamespace: 'lambda',
            scalableDimension: 'lambda:function:ProvisionedConcurrency',
            minCapacity: config.min,
            maxCapacity: config.max,
            targetValue: config.target,
            scaleInCooldown: 300,
            scaleOutCooldown: 120
        });
    }

    /**
     * Create ElastiCache Replica policy for environment
     */
    static createElastiCachePolicy(
        scope: Construct,
        id: string,
        replicationGroupId: string,
        environment: 'dev' | 'staging' | 'prod'
    ): ElastiCacheReplicaPolicy {
        const configs = {
            dev: { min: 0, max: 1, target: 70 },
            staging: { min: 0, max: 2, target: 65 },
            prod: { min: 1, max: 3, target: 60 }
        };

        const config = configs[environment];

        return new ElastiCacheReplicaPolicy(scope, id, {
            environment,
            resourceId: `replication-group/${replicationGroupId}`,
            serviceNamespace: 'elasticache',
            scalableDimension: 'elasticache:replication-group:Replicas',
            minCapacity: config.min,
            maxCapacity: config.max,
            targetValue: config.target,
            scaleInCooldown: 600,
            scaleOutCooldown: 300
        });
    }

    /**
     * Create business hours schedule for production
     */
    static createBusinessHoursSchedule(
        scope: Construct,
        id: string,
        scalableTarget: applicationautoscaling.ScalableTarget,
        environment: string
    ): ScheduleScalingPolicy {
        if (environment !== 'prod') {
            // Only create schedule for production
            return new ScheduleScalingPolicy(scope, id, {
                scalableTarget,
                environment,
                schedules: []
            });
        }

        return new ScheduleScalingPolicy(scope, id, {
            scalableTarget,
            environment,
            schedules: [
                {
                    name: 'BusinessHoursScaleUp',
                    schedule: applicationautoscaling.Schedule.cron({
                        hour: '6', // 8 AM CET = 6 AM UTC
                        minute: '0'
                    }),
                    minCapacity: 5,
                    maxCapacity: 20
                },
                {
                    name: 'OffHoursScaleDown',
                    schedule: applicationautoscaling.Schedule.cron({
                        hour: '20', // 10 PM CET = 8 PM UTC
                        minute: '0'
                    }),
                    minCapacity: 2,
                    maxCapacity: 20
                }
            ]
        });
    }
}

/**
 * Policy Validation and Testing
 * Version: 1.0.0
 * Reviewed: 2025-01-14
 */
export class PolicyValidator {
    /**
     * Validate policy configuration
     */
    static validatePolicy(props: AutoScalingPolicyProps): string[] {
        const errors: string[] = [];

        if (props.minCapacity < 0) {
            errors.push('minCapacity must be >= 0');
        }

        if (props.maxCapacity <= props.minCapacity) {
            errors.push('maxCapacity must be > minCapacity');
        }

        if (props.targetValue <= 0 || props.targetValue > 100) {
            errors.push('targetValue must be between 0 and 100');
        }

        if (props.scaleInCooldown && props.scaleInCooldown < 60) {
            errors.push('scaleInCooldown must be >= 60 seconds');
        }

        if (props.scaleOutCooldown && props.scaleOutCooldown < 60) {
            errors.push('scaleOutCooldown must be >= 60 seconds');
        }

        return errors;
    }

    /**
     * Get recommended settings for environment
     */
    static getRecommendedSettings(environment: 'dev' | 'staging' | 'prod'): {
        lambda: { min: number; max: number; target: number };
        elastiCache: { min: number; max: number; target: number };
        cooldowns: { scaleIn: number; scaleOut: number };
    } {
        const settings = {
            dev: {
                lambda: { min: 0, max: 2, target: 70 },
                elastiCache: { min: 0, max: 1, target: 70 },
                cooldowns: { scaleIn: 300, scaleOut: 120 }
            },
            staging: {
                lambda: { min: 1, max: 5, target: 70 },
                elastiCache: { min: 0, max: 2, target: 65 },
                cooldowns: { scaleIn: 300, scaleOut: 120 }
            },
            prod: {
                lambda: { min: 2, max: 20, target: 70 },
                elastiCache: { min: 1, max: 3, target: 60 },
                cooldowns: { scaleIn: 300, scaleOut: 120 }
            }
        };

        return settings[environment];
    }
}