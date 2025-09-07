import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as path from 'path';
import { Tags } from 'aws-cdk-lib';

export class MatbakhS3BucketsStack extends cdk.Stack {
  public readonly uploadsBucket: s3.Bucket;
  public readonly profileBucket: s3.Bucket;
  public readonly reportsBucket: s3.Bucket;
  public readonly reportsDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 0. ACCESS LOGS BUCKET - For audit and compliance
    const accessLogsBucket = new s3.Bucket(this, 'MatbakhAccessLogs', {
      bucketName: 'matbakh-access-logs',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-access-logs',
          enabled: true,
          expiration: cdk.Duration.days(90), // GDPR compliance - 90 days retention
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 1. UPLOADS BUCKET - Private, permanent storage
    this.uploadsBucket = new s3.Bucket(this, 'MatbakhFilesUploads', {
      bucketName: 'matbakh-files-uploads',
      
      // Security Settings
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      
      // Access Logging
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'uploads/',
      
      // Versioning & Backup
      versioned: false, // Can be enabled later for advanced features
      
      // Lifecycle Management
      lifecycleRules: [
        {
          id: 'delete-temp-files',
          enabled: true,
          prefix: 'temp/',
          expiration: cdk.Duration.days(7),
        },
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      
      // CORS Configuration
      cors: [
        {
          allowedOrigins: ['https://matbakh.app', 'http://localhost:5173'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
          allowedHeaders: ['*'],
          maxAge: 3000,
          exposedHeaders: ['ETag'],
        },
      ],
      
      // Removal Policy
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2. PROFILE BUCKET - Semi-public, permanent storage
    this.profileBucket = new s3.Bucket(this, 'MatbakhFilesProfile', {
      bucketName: 'matbakh-files-profile',
      
      // Security Settings
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      
      // Access Logging
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'profile/',
      
      // Lifecycle Management
      lifecycleRules: [
        {
          id: 'delete-temp-files',
          enabled: true,
          prefix: 'temp/',
          expiration: cdk.Duration.days(7),
        },
        {
          id: 'optimize-storage',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      
      // CORS Configuration
      cors: [
        {
          allowedOrigins: ['https://matbakh.app', 'http://localhost:5173'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
          allowedHeaders: ['*'],
          maxAge: 3000,
          exposedHeaders: ['ETag'],
        },
      ],
      
      // Removal Policy
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 3. REPORTS BUCKET - Public via CloudFront, 30-day lifecycle
    this.reportsBucket = new s3.Bucket(this, 'MatbakhFilesReports', {
      bucketName: 'matbakh-files-reports',
      
      // Security Settings
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Access only via CloudFront
      enforceSSL: true,
      
      // Access Logging
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'reports/',
      
      // Lifecycle Management - Aggressive cleanup for reports
      lifecycleRules: [
        {
          id: 'expire-reports',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
        {
          id: 'expire-temp-reports',
          enabled: true,
          prefix: 'tmp/',
          expiration: cdk.Duration.days(7),
        },
      ],
      
      // CORS Configuration - Reports are read-only from frontend
      cors: [
        {
          allowedOrigins: ['https://matbakh.app', 'http://localhost:5173'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedHeaders: ['*'],
          maxAge: 3000,
          exposedHeaders: ['ETag'],
        },
      ],
      
      // Removal Policy
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 4. RESPONSE HEADERS POLICY for CloudFront
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'ReportsResponseHeadersPolicy', {
      responseHeadersPolicyName: 'matbakh-reports-headers-policy',
      comment: 'Security and CORS headers for matbakh reports',
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowOrigins: ['https://matbakh.app', 'https://*.matbakh.app'],
        accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
        accessControlAllowHeaders: ['*'],
        originOverride: true,
        accessControlExposeHeaders: ['ETag'],
        accessControlMaxAge: cdk.Duration.seconds(3600),
      },
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.seconds(31536000),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
    });

    // 5. CLOUDFRONT DISTRIBUTION for Reports Bucket
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'ReportsOAI', {
      comment: 'OAI for matbakh-files-reports bucket',
    });

    // Grant CloudFront access to reports bucket
    this.reportsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.reportsBucket.arnForObjects('*')],
        principals: [originAccessIdentity.grantPrincipal],
      })
    );

    this.reportsDistribution = new cloudfront.Distribution(this, 'ReportsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.reportsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: responseHeadersPolicy,
        compress: true,
      },
      
      // Additional behaviors for different file types
      additionalBehaviors: {
        '/vc-reports/*': {
          origin: new origins.S3Origin(this.reportsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy: responseHeadersPolicy,
          compress: true,
        },
        '/pdf-exports/*': {
          origin: new origins.S3Origin(this.reportsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // PDFs should not be cached long
          responseHeadersPolicy: responseHeadersPolicy,
        },
      },
      
      // Error pages
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      
      // Geographic restrictions (optional)
      geoRestriction: cloudfront.GeoRestriction.allowlist('DE', 'AT', 'CH', 'US', 'GB'),
      
      // Price class
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Europe and North America
      
      // Tags
      comment: 'CloudFront distribution for matbakh reports bucket',
    });

    // 5. BUCKET POLICIES for enhanced security

    // Uploads Bucket Policy - Enforce TLS only
    this.uploadsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [this.uploadsBucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Profile Bucket Policy - Enforce TLS only
    this.profileBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [this.profileBucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Reports Bucket Policy - Enforce TLS only (CloudFront access via OAI already configured above)
    this.reportsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureTransport',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [this.reportsBucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // 6. PRESIGNED URL LAMBDA FUNCTION
    const presignedUrlFunction = new lambdaNode.NodejsFunction(this, 'S3PresignedUrlFn', {
      functionName: 'matbakh-get-presigned-url',
      entry: path.join(__dirname, '../lambdas/s3-presigned-url/src/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        DB_SECRET_NAME: 'matbakh-db-postgres',
        UPLOADS_BUCKET: this.uploadsBucket.bucketName,
        PROFILE_BUCKET: this.profileBucket.bucketName,
        REPORTS_BUCKET: this.reportsBucket.bucketName,
      },
      bundling: {
        target: 'node18',
        esbuildVersion: '0.21.5',
        externalModules: [], // nichts extern, damit CDK kein "npm ci" ausführt
      },
    });

    // Grant comprehensive S3 permissions for presigned URL function (including multipart)
    presignedUrlFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        's3:PutObject',
        's3:PutObjectAcl', 
        's3:AbortMultipartUpload',
        's3:CreateMultipartUpload',
        's3:ListMultipartUploadParts',
        's3:CompleteMultipartUpload',
        's3:GetObject',
        's3:HeadObject',
        's3:PutObjectTagging'
      ],
      resources: [
        this.uploadsBucket.arnForObjects('*'),
        this.profileBucket.arnForObjects('*'),
        this.reportsBucket.arnForObjects('*'),
      ],
    }));

    presignedUrlFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [
        this.uploadsBucket.bucketArn, 
        this.profileBucket.bucketArn, 
        this.reportsBucket.bucketArn
      ],
    }));

    // Grant Secrets Manager access
    presignedUrlFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:matbakh-db-postgres-*`],
    }));

    // Add pg-client layer (if exists)
    try {
      const pgClientLayer = lambda.LayerVersion.fromLayerVersionArn(
        this,
        'PgClientLayerPresigned',
        `arn:aws:lambda:${this.region}:${this.account}:layer:pg-client-layer:1`
      );
      presignedUrlFunction.addLayers(pgClientLayer);
    } catch (error) {
      console.warn('pg-client-layer not found for presigned URL function, using bundled pg client');
    }

    // Add Function URL for direct access
    const presignedUrlFunctionUrl = presignedUrlFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['https://matbakh.app', 'http://localhost:5173'],
        allowedHeaders: ['*'],
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST], // No OPTIONS for Lambda Function URLs
        maxAge: cdk.Duration.seconds(600),
      },
    });

    // 7. S3 UPLOAD PROCESSOR LAMBDA
    const uploadProcessor = new lambdaNode.NodejsFunction(this, 'S3UploadProcessorFn', {
      functionName: 'matbakh-s3-upload-processor',
      entry: path.join(__dirname, '../lambdas/s3-upload-processor/src/index.ts'),
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        NODE_ENV: 'production',
        DB_SECRET_NAME: 'matbakh-db-postgres',
      },
      bundling: {
        target: 'node18',
        esbuildVersion: '0.21.5',
        externalModules: [], // nichts extern, damit CDK kein "npm ci" ausführt
      },
      // VPC configuration for RDS access (uncomment and configure if RDS is in VPC)
      // vpc: ec2.Vpc.fromLookup(this, 'ExistingVpc', { 
      //   vpcId: process.env.VPC_ID || 'vpc-xxxxxxxxx' 
      // }),
      // vpcSubnets: { 
      //   subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS 
      // },
      // securityGroups: [
      //   ec2.SecurityGroup.fromSecurityGroupId(this, 'LambdaSG', 
      //     process.env.LAMBDA_SECURITY_GROUP_ID || 'sg-xxxxxxxxx'
      //   )
      // ],
    });

    // Grant S3 read permissions to the processor
    this.uploadsBucket.grantRead(uploadProcessor);
    this.profileBucket.grantRead(uploadProcessor);
    this.reportsBucket.grantRead(uploadProcessor);

    // Grant Secrets Manager access
    uploadProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:matbakh-db-postgres-*`],
    }));

    // Add pg-client layer (if exists)
    try {
      const pgClientLayer = lambda.LayerVersion.fromLayerVersionArn(
        this,
        'PgClientLayer',
        `arn:aws:lambda:${this.region}:${this.account}:layer:pg-client-layer:1`
      );
      uploadProcessor.addLayers(pgClientLayer);
    } catch (error) {
      console.warn('pg-client-layer not found, processor will use bundled pg client');
    }

    // Configure S3 event notifications
    this.uploadsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(uploadProcessor),
      { prefix: 'user-uploads/' }
    );

    this.profileBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(uploadProcessor),
      { prefix: 'avatars/' }
    );

    this.profileBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(uploadProcessor),
      { prefix: 'logos/' }
    );

    this.reportsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(uploadProcessor),
      { prefix: 'vc-reports/' }
    );

    // 7. OUTPUTS
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: this.uploadsBucket.bucketName,
      description: 'Name of the uploads S3 bucket',
      exportName: 'MatbakhUploadsBucketName',
    });

    new cdk.CfnOutput(this, 'ProfileBucketName', {
      value: this.profileBucket.bucketName,
      description: 'Name of the profile S3 bucket',
      exportName: 'MatbakhProfileBucketName',
    });

    new cdk.CfnOutput(this, 'ReportsBucketName', {
      value: this.reportsBucket.bucketName,
      description: 'Name of the reports S3 bucket',
      exportName: 'MatbakhReportsBucketName',
    });

    new cdk.CfnOutput(this, 'ReportsDistributionDomain', {
      value: this.reportsDistribution.distributionDomainName,
      description: 'CloudFront distribution domain for reports',
      exportName: 'MatbakhReportsDistributionDomain',
    });

    new cdk.CfnOutput(this, 'ReportsDistributionId', {
      value: this.reportsDistribution.distributionId,
      description: 'CloudFront distribution ID for reports',
      exportName: 'MatbakhReportsDistributionId',
    });

    new cdk.CfnOutput(this, 'PresignedUrlFunctionArn', {
      value: presignedUrlFunction.functionArn,
      description: 'S3 Presigned URL Lambda Function ARN',
      exportName: 'MatbakhPresignedUrlFunctionArn',
    });

    new cdk.CfnOutput(this, 'PresignedUrlFunctionUrl', {
      value: presignedUrlFunctionUrl.url,
      description: 'S3 Presigned URL Lambda Function URL',
      exportName: 'MatbakhPresignedUrlFunctionUrl',
    });

    new cdk.CfnOutput(this, 'UploadProcessorFunctionArn', {
      value: uploadProcessor.functionArn,
      description: 'S3 Upload Processor Lambda Function ARN',
      exportName: 'MatbakhUploadProcessorFunctionArn',
    });

    new cdk.CfnOutput(this, 'AccessLogsBucketName', {
      value: accessLogsBucket.bucketName,
      description: 'Name of the access logs S3 bucket',
      exportName: 'MatbakhAccessLogsBucketName',
    });

    // Add tags to buckets
    Tags.of(this.uploadsBucket).add('Project', 'matbakh');
    Tags.of(this.uploadsBucket).add('Environment', 'production');
    Tags.of(this.uploadsBucket).add('BucketType', 'uploads');

    Tags.of(this.profileBucket).add('Project', 'matbakh');
    Tags.of(this.profileBucket).add('Environment', 'production');
    Tags.of(this.profileBucket).add('BucketType', 'profile');

    Tags.of(this.reportsBucket).add('Project', 'matbakh');
    Tags.of(this.reportsBucket).add('Environment', 'production');
    Tags.of(this.reportsBucket).add('BucketType', 'reports');
  }

  // Helper method to create IAM policy for Lambda functions
  public createLambdaS3Policy(): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:PutObject',
            's3:PutObjectAcl',
            's3:GetObject',
            's3:DeleteObject',
          ],
          resources: [
            this.uploadsBucket.arnForObjects('*'),
            this.profileBucket.arnForObjects('*'),
            this.reportsBucket.arnForObjects('*'),
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:ListBucket',
          ],
          resources: [
            this.uploadsBucket.bucketArn,
            this.profileBucket.bucketArn,
            this.reportsBucket.bucketArn,
          ],
        }),
      ],
    });
  }
}