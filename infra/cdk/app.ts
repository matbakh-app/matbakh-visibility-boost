import * as cdk from "aws-cdk-lib";
import { MetricsIngestStack } from "./metrics-ingest-stack";

const app = new cdk.App();
new MetricsIngestStack(app, "MetricsIngestStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "eu-central-1",
  },
});