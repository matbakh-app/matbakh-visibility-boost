# Presigned-URL Lambda Deployment Fix

## Problem Summary
The Presigned-URL Lambda function `matbakh-get-presigned-url` is not being deployed due to:
1. TypeScript compilation errors in bundling configuration
2. Invalid CORS configuration for Lambda Function URLs
3. CloudFormation stack rollback preventing deployment

## Root Cause Analysis

### 1. Bundling Configuration Error
```typescript
// ❌ Incorrect - Array format not supported
esbuildArgs: ['--packages=bundle']

// ✅ Correct - Object format required
esbuildArgs: {
  '--packages': 'bundle'
}
```

### 2. CORS Configuration Error
```typescript
// ❌ Incorrect - OPTIONS not allowed in Lambda Function URLs
allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS]

// ✅ Correct - Only GET/POST allowed
allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST]
```

### 3. TypeScript Compilation Issues
- Missing type definitions for monitoring stack
- Import errors in user migration scripts
- Incorrect property types in CloudFront configuration

## Solution Implementation

### Step 1: Fix Bundling Configuration
Update both Lambda functions in `s3-buckets-stack.ts`:

```typescript
bundling: {
  target: 'node18',
  esbuildArgs: {
    '--packages': 'bundle'
  },
  externalModules: [], // No external modules to avoid npm ci
}
```

### Step 2: Fix CORS Configuration
Update Lambda Function URL CORS settings:

```typescript
const presignedUrlFunctionUrl = presignedUrlFunction.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['https://matbakh.app', 'http://localhost:5173'],
    allowedHeaders: ['*'],
    allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST], // No OPTIONS
    maxAge: cdk.Duration.seconds(600),
  },
});
```

### Step 3: Handle OPTIONS in Lambda Code
If preflight requests are needed, handle them in the Lambda function:

```typescript
if (event.requestContext.http.method === 'OPTIONS') {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Headers': '*',
    },
    body: '',
  };
}
```

## Deployment Commands

```bash
# 1. Clean CDK artifacts
cd infra/aws
rm -rf cdk.out

# 2. Verify TypeScript compilation
npx tsc -b

# 3. Synthesize and check template
npx cdk synth MatbakhS3BucketsStack > /tmp/template.yaml
grep -n "S3PresignedUrlFn" /tmp/template.yaml

# 4. Deploy with fixed configuration
npx cdk deploy MatbakhS3BucketsStack --require-approval never --outputs-file s3-outputs.json

# 5. Verify deployment
aws lambda list-functions --query "Functions[?FunctionName=='matbakh-get-presigned-url'].FunctionName"
```

## Verification Steps

1. **Lambda Function Exists**:
   ```bash
   aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'matbakh')].FunctionName"
   ```

2. **Function URL Available**:
   ```bash
   jq -r '.MatbakhS3BucketsStack.PresignedUrlFunctionUrl' s3-outputs.json
   ```

3. **Test Function**:
   ```bash
   curl -X POST "$(jq -r '.MatbakhS3BucketsStack.PresignedUrlFunctionUrl' s3-outputs.json)" \
     -H "Content-Type: application/json" \
     -d '{"action":"getPutUrl","contentType":"image/png","key":"test/ping.png"}'
   ```

## Expected Outputs

After successful deployment:
- `matbakh-get-presigned-url` Lambda function visible in AWS Console
- Function URL available in stack outputs
- CORS properly configured for web requests
- No CloudFormation rollback errors

## Rollback Plan

If deployment fails:
1. Check CloudFormation events for specific errors
2. Revert to previous working configuration
3. Deploy incrementally with minimal changes

## Next Steps

1. Apply the fixes to `s3-buckets-stack.ts`
2. Deploy and verify Lambda function
3. Test presigned URL generation
4. Update frontend to use new Lambda endpoint
5. Complete S3 file storage migration