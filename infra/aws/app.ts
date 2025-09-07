#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MatbakhS3BucketsStack } from './s3-buckets-stack';

const app = new cdk.App();

// Deploy S3 Buckets Stack
new MatbakhS3BucketsStack(app, 'MatbakhS3BucketsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '055062860590', // Explicit fallback
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
  
  // Stack-level tags
  tags: {
    Project: 'matbakh',
    Environment: 'production',
    Component: 'file-storage',
    ManagedBy: 'cdk',
  },
  
  description: 'S3 buckets and CloudFront distribution for Matbakh file storage system',
});