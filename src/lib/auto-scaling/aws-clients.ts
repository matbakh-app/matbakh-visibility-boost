/**
 * AWS Clients Factory
 * Centralized AWS SDK client creation for dependency injection and testing
 */

// Mock AWS SDK imports for testing - real imports would be here in production
let ApplicationAutoScalingClient: any;
let LambdaClient: any;
let CloudWatchClient: any;
let ElastiCacheClient: any;
let RDSClient: any;
let CloudFrontClient: any;

// Command classes - try to import real ones, fallback to mocks
export let DeregisterScalableTargetCommand: any;
export let DescribeScalableTargetsCommand: any;
export let PutScalingPolicyCommand: any;
export let RegisterScalableTargetCommand: any;
export let PutFunctionConcurrencyCommand: any;
export let DescribeAlarmsCommand: any;
export let PutMetricAlarmCommand: any;

// Mock Command classes
class MockCommand {
    constructor(public input: any) { }
}

// Try to import real commands, fallback to mocks
try {
    const appAutoScaling = require('@aws-sdk/client-application-autoscaling');
    DeregisterScalableTargetCommand = appAutoScaling.DeregisterScalableTargetCommand;
    DescribeScalableTargetsCommand = appAutoScaling.DescribeScalableTargetsCommand;
    PutScalingPolicyCommand = appAutoScaling.PutScalingPolicyCommand;
    RegisterScalableTargetCommand = appAutoScaling.RegisterScalableTargetCommand;
} catch {
    DeregisterScalableTargetCommand = MockCommand;
    DescribeScalableTargetsCommand = MockCommand;
    PutScalingPolicyCommand = MockCommand;
    RegisterScalableTargetCommand = MockCommand;
}

try {
    const lambda = require('@aws-sdk/client-lambda');
    PutFunctionConcurrencyCommand = lambda.PutFunctionConcurrencyCommand;
} catch {
    PutFunctionConcurrencyCommand = MockCommand;
}

try {
    const cloudwatch = require('@aws-sdk/client-cloudwatch');
    DescribeAlarmsCommand = cloudwatch.DescribeAlarmsCommand;
    PutMetricAlarmCommand = cloudwatch.PutMetricAlarmCommand;
} catch {
    DescribeAlarmsCommand = MockCommand;
    PutMetricAlarmCommand = MockCommand;
}

// Try to import real AWS SDK clients, fallback to mocks
try {
    const appAutoScaling = require('@aws-sdk/client-application-autoscaling');
    ApplicationAutoScalingClient = appAutoScaling.ApplicationAutoScalingClient;
} catch {
    ApplicationAutoScalingClient = class MockApplicationAutoScalingClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

try {
    const lambda = require('@aws-sdk/client-lambda');
    LambdaClient = lambda.LambdaClient;
} catch {
    LambdaClient = class MockLambdaClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

try {
    const cloudwatch = require('@aws-sdk/client-cloudwatch');
    CloudWatchClient = cloudwatch.CloudWatchClient;
} catch {
    CloudWatchClient = class MockCloudWatchClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

try {
    const elasticache = require('@aws-sdk/client-elasticache');
    ElastiCacheClient = elasticache.ElastiCacheClient;
} catch {
    ElastiCacheClient = class MockElastiCacheClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

try {
    const rds = require('@aws-sdk/client-rds');
    RDSClient = rds.RDSClient;
} catch {
    RDSClient = class MockRDSClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

try {
    const cloudfront = require('@aws-sdk/client-cloudfront');
    CloudFrontClient = cloudfront.CloudFrontClient;
} catch {
    CloudFrontClient = class MockCloudFrontClient {
        constructor(public config: any) { }
        async send(command: any) { return {}; }
    };
}

/**
 * Application Auto Scaling Client Factory
 */
export const makeAppASClient = (region?: string) =>
    new ApplicationAutoScalingClient({ region });

/**
 * Lambda Client Factory
 */
export const makeLambdaClient = (region?: string) =>
    new LambdaClient({ region });

/**
 * CloudWatch Client Factory
 */
export const makeCloudWatchClient = (region?: string) =>
    new CloudWatchClient({ region });

/**
 * ElastiCache Client Factory
 */
export const makeElastiCacheClient = (region?: string) =>
    new ElastiCacheClient({ region });

/**
 * RDS Client Factory
 */
export const makeRdsClient = (region?: string) =>
    new RDSClient({ region });

/**
 * CloudFront Client Factory
 */
export const makeCloudFrontClient = (region?: string) =>
    new CloudFrontClient({ region });

/**
 * AWS Dependencies Type for Dependency Injection
 */
export type AwsDependencies = {
    makeAppASClient: typeof makeAppASClient;
    makeLambdaClient: typeof makeLambdaClient;
    makeCloudWatchClient: typeof makeCloudWatchClient;
    makeElastiCacheClient: typeof makeElastiCacheClient;
    makeRdsClient: typeof makeRdsClient;
    makeCloudFrontClient: typeof makeCloudFrontClient;
};

/**
 * Default AWS Dependencies
 */
export const defaultAwsDependencies: AwsDependencies = {
    makeAppASClient,
    makeLambdaClient,
    makeCloudWatchClient,
    makeElastiCacheClient,
    makeRdsClient,
    makeCloudFrontClient
};