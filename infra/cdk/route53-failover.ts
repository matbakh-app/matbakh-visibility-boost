import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface Route53FailoverProps {
    domainName: string;
    primaryRegion: string;
    secondaryRegion: string;
    primaryEndpoint: string;
    secondaryEndpoint: string;
    hostedZoneId: string;
}

export class Route53FailoverStack extends cdk.Stack {
    public readonly healthCheckPrimary: route53.HealthCheck;
    public readonly healthCheckSecondary: route53.HealthCheck;
    public readonly hostedZone: route53.IHostedZone;

    constructor(scope: Construct, id: string, props: Route53FailoverProps & cdk.StackProps) {
        super(scope, id, props);

        // Import existing hosted zone
        this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: props.hostedZoneId,
            zoneName: props.domainName,
        });

        // Health check for primary region
        this.healthCheckPrimary = new route53.HealthCheck(this, 'PrimaryHealthCheck', {
            type: route53.HealthCheckType.HTTPS,
            resourcePath: '/health',
            fqdn: props.primaryEndpoint,
            port: 443,
            requestInterval: cdk.Duration.seconds(30),
            failureThreshold: 3,
            measureLatency: true,
            regions: [
                route53.HealthCheckRegion.EU_WEST_1,
                route53.HealthCheckRegion.US_EAST_1,
                route53.HealthCheckRegion.AP_SOUTHEAST_1,
            ],
        });

        // Health check for secondary region
        this.healthCheckSecondary = new route53.HealthCheck(this, 'SecondaryHealthCheck', {
            type: route53.HealthCheckType.HTTPS,
            resourcePath: '/health',
            fqdn: props.secondaryEndpoint,
            port: 443,
            requestInterval: cdk.Duration.seconds(30),
            failureThreshold: 3,
            measureLatency: true,
            regions: [
                route53.HealthCheckRegion.EU_WEST_1,
                route53.HealthCheckRegion.US_EAST_1,
                route53.HealthCheckRegion.AP_SOUTHEAST_1,
            ],
        });

        // Primary failover record
        new route53.ARecord(this, 'PrimaryFailoverRecord', {
            zone: this.hostedZone,
            recordName: `api.${props.domainName}`,
            target: route53.RecordTarget.fromIpAddresses(props.primaryEndpoint),
            ttl: cdk.Duration.seconds(30),
            setIdentifier: 'primary',
            failover: route53.FailoverPolicy.PRIMARY,
            healthCheckId: this.healthCheckPrimary.healthCheckId,
        });

        // Secondary failover record
        new route53.ARecord(this, 'SecondaryFailoverRecord', {
            zone: this.hostedZone,
            recordName: `api.${props.domainName}`,
            target: route53.RecordTarget.fromIpAddresses(props.secondaryEndpoint),
            ttl: cdk.Duration.seconds(30),
            setIdentifier: 'secondary',
            failover: route53.FailoverPolicy.SECONDARY,
            healthCheckId: this.healthCheckSecondary.healthCheckId,
        });

        // Latency-based routing for canary testing (1-5%)
        new route53.ARecord(this, 'CanaryLatencyRecord', {
            zone: this.hostedZone,
            recordName: `canary.${props.domainName}`,
            target: route53.RecordTarget.fromIpAddresses(props.secondaryEndpoint),
            ttl: cdk.Duration.seconds(30),
            setIdentifier: 'canary-secondary',
            geoLocation: route53.GeoLocation.continent(route53.Continent.EUROPE),
            weight: 5, // 5% traffic to secondary for testing
        });

        // CloudWatch alarms for health checks
        new cloudwatch.Alarm(this, 'PrimaryHealthCheckAlarm', {
            metric: this.healthCheckPrimary.metricHealthCheckStatus(),
            threshold: 1,
            evaluationPeriods: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarmDescription: 'Primary region health check failed',
            treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        });

        new cloudwatch.Alarm(this, 'SecondaryHealthCheckAlarm', {
            metric: this.healthCheckSecondary.metricHealthCheckStatus(),
            threshold: 1,
            evaluationPeriods: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarmDescription: 'Secondary region health check failed',
            treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        });

        // Outputs
        new cdk.CfnOutput(this, 'PrimaryHealthCheckId', {
            value: this.healthCheckPrimary.healthCheckId,
            description: 'Primary region health check ID',
        });

        new cdk.CfnOutput(this, 'SecondaryHealthCheckId', {
            value: this.healthCheckSecondary.healthCheckId,
            description: 'Secondary region health check ID',
        });
    }
}