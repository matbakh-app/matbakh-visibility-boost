import { Duration, Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Distribution, ViewerProtocolPolicy, AllowedMethods, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { RestApi, LambdaIntegration, Cors } from 'aws-cdk-lib/aws-apigateway';
import { Runtime, Code, Function as LambdaFn } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class MatbakhVcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Static website bucket + CloudFront (optional in Phase A)
    const webBucket = new Bucket(this, 'WebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const distro = new Distribution(this, 'WebDistro', {
      defaultBehavior: {
        origin: new S3BucketOrigin(webBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        // Verwende die gemanagten Security-Header der aktuellen CDK-API:
        responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS
      }
    });

    // Gemeinsame Env-Variablen für beide Lambdas
    const envCommon = {
      CORS_ORIGINS: 'https://matbakh.app,https://*.vercel.app,http://localhost:5173',
      RESULT_URL: 'https://matbakh.app/vc/result'
    };

    const vcStart = new LambdaFn(this, 'VcStartFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('../../lambda/vc-start'),
      timeout: Duration.seconds(15),
      environment: envCommon
    });

    const vcConfirm = new LambdaFn(this, 'VcConfirmFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset('../../lambda/vc-confirm'),
      timeout: Duration.seconds(10),
      environment: envCommon
    });

    // Public API (REST)
    const api = new RestApi(this, 'PublicApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: ['Content-Type','Authorization'],
        allowMethods: ['GET','POST','OPTIONS']
      }
    });

    const vc = api.root.addResource('vc');
    vc.addResource('start').addMethod('POST', new LambdaIntegration(vcStart));
    const confirm = vc.addResource('confirm');
    confirm.addMethod('GET', new LambdaIntegration(vcConfirm));
    confirm.addMethod('OPTIONS', new LambdaIntegration(vcConfirm)); // Preflight

    new CfnOutput(this, 'WebBucketName', { value: webBucket.bucketName });
    new CfnOutput(this, 'CloudFrontDomain', { value: distro.domainName });
    new CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
