#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { MatbakhVcStack } from '../lib/matbakh-vc-stack';

const app = new App();
new MatbakhVcStack(app, 'MatbakhVcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
