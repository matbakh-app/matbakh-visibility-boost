import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";

export class MetricsIngestStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "MetricsIngestLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const fn = new lambdaNode.NodejsFunction(this, "MetricsIngestFn", {
      entry: path.join(__dirname, "../lambdas/metrics-ingest/index.ts"),
      handler: "handler",
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      bundling: {
        minify: true,
        sourcesContent: false,
        externalModules: ["aws-sdk"], // provided by Lambda
        target: "node20",
      },
      environment: {
        METRICS_NS: this.node.tryGetContext("metricsNs") || "Matbakh/Web",
        LOG_LEVEL: this.node.tryGetContext("logLevel") || "info",
        CORS_ORIGIN: this.node.tryGetContext("corsOrigin") || "*",
      },
      logGroup,
    });

    // IAM: allow PutMetricData only
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ["cloudwatch:PutMetricData"],
      resources: ["*"], // PutMetricData does not support resource ARNs
      conditions: { 
        StringEquals: { 
          "cloudwatch:namespace": [this.node.tryGetContext("metricsNs") || "Matbakh/Web"] 
        } 
      },
    }));

    const httpApi = new apigwv2.HttpApi(this, "MetricsIngestApi", {
      corsPreflight: {
        allowOrigins: [this.node.tryGetContext("corsOrigin") || "*"],
        allowMethods: [apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ["content-type", "authorization", "x-requested-with"],
        maxAge: cdk.Duration.days(10),
      },
      createDefaultStage: true,
      apiName: "metrics-ingest",
    });

    httpApi.addRoutes({
      path: "/metrics",
      methods: [cdk.aws_apigatewayv2.HttpMethod.POST, cdk.aws_apigatewayv2.HttpMethod.OPTIONS],
      integration: new integrations.HttpLambdaIntegration("MetricsIngestIntegration", fn),
    });

    this.apiUrl = new cdk.CfnOutput(this, "MetricsEndpoint", {
      value: httpApi.apiEndpoint + "/metrics",
      exportName: "MetricsEndpoint",
    });
  }
}