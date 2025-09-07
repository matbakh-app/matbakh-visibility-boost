import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  uploadsBucket: s3.Bucket;
  profileBucket: s3.Bucket;
  reportsBucket: s3.Bucket;
  reportsDistribution: cloudfront.Distribution;
  presignedUrlFunction?: lambda.Function;
  uploadProcessorFunction?: lambda.Function;
  alertEmail: string;
}

export class MatbakhS3MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // 1. SNS TOPIC FOR ALERTS
    this.alertTopic = new sns.Topic(this, 'S3AlertTopic', {
      topicName: 'matbakh-s3-alerts',
      displayName: 'Matbakh S3 Storage Alerts',
    });

    // Subscribe email to alerts
    this.alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.alertEmail)
    );

    // 2. S3 BUCKET METRICS AND ALARMS

    // Upload failures alarm for uploads bucket
    const uploadsFailureAlarm = new cloudwatch.Alarm(this, 'UploadsFailureAlarm', {
      alarmName: 'matbakh-uploads-failure-rate',
      alarmDescription: 'High failure rate for uploads bucket operations',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: props.uploadsBucket.bucketName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    uploadsFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Profile bucket failure alarm
    const profileFailureAlarm = new cloudwatch.Alarm(this, 'ProfileFailureAlarm', {
      alarmName: 'matbakh-profile-failure-rate',
      alarmDescription: 'High failure rate for profile bucket operations',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: props.profileBucket.bucketName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    profileFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Reports bucket failure alarm
    const reportsFailureAlarm = new cloudwatch.Alarm(this, 'ReportsFailureAlarm', {
      alarmName: 'matbakh-reports-failure-rate',
      alarmDescription: 'High failure rate for reports bucket operations',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: props.reportsBucket.bucketName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    reportsFailureAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Storage size alarm for uploads bucket (warn at 100GB)
    const uploadsSizeAlarm = new cloudwatch.Alarm(this, 'UploadsSizeAlarm', {
      alarmName: 'matbakh-uploads-storage-size',
      alarmDescription: 'Uploads bucket storage size exceeding threshold',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: 'BucketSizeBytes',
        dimensionsMap: {
          BucketName: props.uploadsBucket.bucketName,
          StorageType: 'StandardStorage',
        },
        statistic: 'Average',
        period: cdk.Duration.hours(24),
      }),
      threshold: 100 * 1024 * 1024 * 1024, // 100GB in bytes
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    uploadsSizeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // 3. CLOUDFRONT MONITORING

    // CloudFront error rate alarm
    const cloudfrontErrorAlarm = new cloudwatch.Alarm(this, 'CloudFrontErrorAlarm', {
      alarmName: 'matbakh-cloudfront-error-rate',
      alarmDescription: 'High error rate for CloudFront distribution',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: '4xxErrorRate',
        dimensionsMap: {
          DistributionId: props.reportsDistribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5, // 5% error rate
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cloudfrontErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // CloudFront cache hit rate alarm (warn if below 80%)
    const cloudfrontCacheHitAlarm = new cloudwatch.Alarm(this, 'CloudFrontCacheHitAlarm', {
      alarmName: 'matbakh-cloudfront-cache-hit-rate',
      alarmDescription: 'Low cache hit rate for CloudFront distribution',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName: 'CacheHitRate',
        dimensionsMap: {
          DistributionId: props.reportsDistribution.distributionId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(15),
      }),
      threshold: 80, // 80% cache hit rate
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cloudfrontCacheHitAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // 4. LAMBDA FUNCTION MONITORING (if provided)

    if (props.presignedUrlFunction) {
      // Lambda error rate alarm
      const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'PresignedUrlErrorAlarm', {
        alarmName: 'matbakh-presigned-url-error-rate',
        alarmDescription: 'High error rate for presigned URL Lambda function',
        metric: props.presignedUrlFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

      // Lambda duration alarm
      const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'PresignedUrlDurationAlarm', {
        alarmName: 'matbakh-presigned-url-duration',
        alarmDescription: 'High duration for presigned URL Lambda function',
        metric: props.presignedUrlFunction.metricDuration({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000, // 10 seconds
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
    }

    if (props.uploadProcessorFunction) {
      // Upload processor error alarm
      const processorErrorAlarm = new cloudwatch.Alarm(this, 'UploadProcessorErrorAlarm', {
        alarmName: 'matbakh-upload-processor-error-rate',
        alarmDescription: 'High error rate for upload processor Lambda function',
        metric: props.uploadProcessorFunction.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 3,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      processorErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
    }

    // 5. CUSTOM METRICS FOR APPLICATION-LEVEL MONITORING

    // Create custom metric filters for application logs
    const uploadSuccessMetric = new cloudwatch.Metric({
      namespace: 'Matbakh/S3Upload',
      metricName: 'UploadSuccess',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const uploadFailureMetric = new cloudwatch.Metric({
      namespace: 'Matbakh/S3Upload',
      metricName: 'UploadFailure',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Upload success rate alarm
    const uploadSuccessRateAlarm = new cloudwatch.Alarm(this, 'UploadSuccessRateAlarm', {
      alarmName: 'matbakh-upload-success-rate',
      alarmDescription: 'Low success rate for file uploads',
      metric: new cloudwatch.MathExpression({
        expression: '(success / (success + failure)) * 100',
        usingMetrics: {
          success: uploadSuccessMetric,
          failure: uploadFailureMetric,
        },
        period: cdk.Duration.minutes(15),
      }),
      threshold: 95, // 95% success rate
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    uploadSuccessRateAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // 6. CLOUDWATCH DASHBOARD

    this.dashboard = new cloudwatch.Dashboard(this, 'S3MonitoringDashboard', {
      dashboardName: 'matbakh-s3-monitoring',
    });

    // S3 Operations Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'S3 Operations',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'AllRequests',
            dimensionsMap: {
              BucketName: props.uploadsBucket.bucketName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Uploads Bucket Requests',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'AllRequests',
            dimensionsMap: {
              BucketName: props.profileBucket.bucketName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Profile Bucket Requests',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'AllRequests',
            dimensionsMap: {
              BucketName: props.reportsBucket.bucketName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Reports Bucket Requests',
          }),
        ],
      }),

      // S3 Errors Widget
      new cloudwatch.GraphWidget({
        title: 'S3 Errors',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: '4xxErrors',
            dimensionsMap: {
              BucketName: props.uploadsBucket.bucketName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Uploads 4xx Errors',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: '5xxErrors',
            dimensionsMap: {
              BucketName: props.uploadsBucket.bucketName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Uploads 5xx Errors',
          }),
        ],
      })
    );

    // CloudFront Metrics Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudFront Performance',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'Requests',
            dimensionsMap: {
              DistributionId: props.reportsDistribution.distributionId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
            label: 'Total Requests',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: 'CacheHitRate',
            dimensionsMap: {
              DistributionId: props.reportsDistribution.distributionId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            label: 'Cache Hit Rate (%)',
          }),
        ],
      }),

      new cloudwatch.GraphWidget({
        title: 'CloudFront Errors',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: '4xxErrorRate',
            dimensionsMap: {
              DistributionId: props.reportsDistribution.distributionId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            label: '4xx Error Rate (%)',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CloudFront',
            metricName: '5xxErrorRate',
            dimensionsMap: {
              DistributionId: props.reportsDistribution.distributionId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
            label: '5xx Error Rate (%)',
          }),
        ],
      })
    );

    // Lambda Performance Widget (if functions provided)
    if (props.presignedUrlFunction || props.uploadProcessorFunction) {
      const lambdaMetrics: cloudwatch.IMetric[] = [];
      
      if (props.presignedUrlFunction) {
        lambdaMetrics.push(
          props.presignedUrlFunction.metricInvocations({
            period: cdk.Duration.minutes(5),
            label: 'Presigned URL Invocations',
          }),
          props.presignedUrlFunction.metricErrors({
            period: cdk.Duration.minutes(5),
            label: 'Presigned URL Errors',
          })
        );
      }

      if (props.uploadProcessorFunction) {
        lambdaMetrics.push(
          props.uploadProcessorFunction.metricInvocations({
            period: cdk.Duration.minutes(5),
            label: 'Upload Processor Invocations',
          }),
          props.uploadProcessorFunction.metricErrors({
            period: cdk.Duration.minutes(5),
            label: 'Upload Processor Errors',
          })
        );
      }

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Lambda Functions',
          width: 24,
          height: 6,
          left: lambdaMetrics,
        })
      );
    }

    // Storage Size Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Storage Usage (GB)',
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: 'uploads / 1024 / 1024 / 1024',
            usingMetrics: {
              uploads: new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.uploadsBucket.bucketName,
                  StorageType: 'StandardStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.hours(24),
              }),
            },
            label: 'Uploads Bucket (GB)',
          }),
          new cloudwatch.MathExpression({
            expression: 'profile / 1024 / 1024 / 1024',
            usingMetrics: {
              profile: new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.profileBucket.bucketName,
                  StorageType: 'StandardStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.hours(24),
              }),
            },
            label: 'Profile Bucket (GB)',
          }),
          new cloudwatch.MathExpression({
            expression: 'reports / 1024 / 1024 / 1024',
            usingMetrics: {
              reports: new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: props.reportsBucket.bucketName,
                  StorageType: 'StandardStorage',
                },
                statistic: 'Average',
                period: cdk.Duration.hours(24),
              }),
            },
            label: 'Reports Bucket (GB)',
          }),
        ],
      })
    );

    // 7. OUTPUTS
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Topic ARN for S3 alerts',
      exportName: 'MatbakhS3AlertTopicArn',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: 'MatbakhS3DashboardUrl',
    });
  }
}