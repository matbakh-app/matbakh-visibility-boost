# Facebook Webhook Deployment Guide

**Version:** 1.0  
**Date:** 2025-01-20  
**Target:** AWS Lambda  
**Status:** Production Ready

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Facebook webhook handler to AWS Lambda, including prerequisites, deployment steps, configuration, and verification procedures.

## 📋 Prerequisites

### AWS Requirements

- ✅ AWS Account with appropriate permissions
- ✅ AWS CLI configured with credentials
- ✅ IAM role for Lambda execution
- ✅ AWS Lambda service access

### Facebook Requirements

- ✅ Facebook App created in Facebook Developer Console
- ✅ App Secret and Verify Token generated
- ✅ Webhook permissions configured

### Development Environment

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ TypeScript compiler
- ✅ AWS SAM CLI (optional, for local testing)

## 🏗️ Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Facebook      │───▶│  API Gateway     │───▶│  Lambda         │
│   Platform      │    │  (Optional)      │    │  Function       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  CloudWatch      │    │  Environment    │
                       │  Logs            │    │  Variables      │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Deployment Steps

### Step 1: Prepare the Code

1. **Build the TypeScript code:**

   ```bash
   npm run build
   ```

2. **Create deployment package:**

   ```bash
   # Create deployment directory
   mkdir -p deployment/facebook-webhook

   # Copy compiled JavaScript
   cp dist/api/facebookWebhookHandler.js deployment/facebook-webhook/index.js

   # Copy package.json (production dependencies only)
   npm prune --production
   cp package.json deployment/facebook-webhook/
   cp -r node_modules deployment/facebook-webhook/

   # Create ZIP package
   cd deployment/facebook-webhook
   zip -r ../facebook-webhook.zip .
   cd ../..
   ```

### Step 2: Create IAM Role

1. **Create execution role:**

   ```bash
   aws iam create-role \
     --role-name facebook-webhook-execution-role \
     --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Principal": {
             "Service": "lambda.amazonaws.com"
           },
           "Action": "sts:AssumeRole"
         }
       ]
     }'
   ```

2. **Attach basic execution policy:**
   ```bash
   aws iam attach-role-policy \
     --role-name facebook-webhook-execution-role \
     --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
   ```

### Step 3: Create Lambda Function

1. **Create the function:**

   ```bash
   aws lambda create-function \
     --function-name facebook-webhook-handler \
     --runtime nodejs18.x \
     --role arn:aws:iam::YOUR_ACCOUNT_ID:role/facebook-webhook-execution-role \
     --handler index.handler \
     --zip-file fileb://deployment/facebook-webhook.zip \
     --timeout 30 \
     --memory-size 128 \
     --description "Facebook webhook handler for matbakh.app"
   ```

2. **Set environment variables:**
   ```bash
   aws lambda update-function-configuration \
     --function-name facebook-webhook-handler \
     --environment Variables='{
       "FB_APP_SECRET":"your_facebook_app_secret",
       "FB_VERIFY_TOKEN":"your_webhook_verify_token",
       "FB_APP_ID":"your_facebook_app_id"
     }'
   ```

### Step 4: Create Function URL (Optional)

If not using API Gateway:

```bash
aws lambda create-function-url-config \
  --function-name facebook-webhook-handler \
  --auth-type NONE \
  --cors '{
    "AllowCredentials": false,
    "AllowHeaders": ["content-type", "x-hub-signature", "x-hub-signature-256"],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowOrigins": ["*"],
    "ExposeHeaders": [],
    "MaxAge": 86400
  }'
```

### Step 5: Configure API Gateway (Recommended)

1. **Create REST API:**

   ```bash
   aws apigateway create-rest-api \
     --name facebook-webhook-api \
     --description "Facebook webhook API for matbakh.app"
   ```

2. **Create resource and methods:**

   ```bash
   # Get API ID from previous command
   API_ID="your_api_id"

   # Get root resource ID
   ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)

   # Create webhook resource
   RESOURCE_ID=$(aws apigateway create-resource \
     --rest-api-id $API_ID \
     --parent-id $ROOT_ID \
     --path-part webhook \
     --query 'id' --output text)

   # Create GET method
   aws apigateway put-method \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method GET \
     --authorization-type NONE

   # Create POST method
   aws apigateway put-method \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method POST \
     --authorization-type NONE
   ```

3. **Configure Lambda integration:**

   ```bash
   # Configure GET integration
   aws apigateway put-integration \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method GET \
     --type AWS_PROXY \
     --integration-http-method POST \
     --uri arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:YOUR_ACCOUNT_ID:function:facebook-webhook-handler/invocations

   # Configure POST integration
   aws apigateway put-integration \
     --rest-api-id $API_ID \
     --resource-id $RESOURCE_ID \
     --http-method POST \
     --type AWS_PROXY \
     --integration-http-method POST \
     --uri arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:YOUR_ACCOUNT_ID:function:facebook-webhook-handler/invocations
   ```

4. **Deploy API:**
   ```bash
   aws apigateway create-deployment \
     --rest-api-id $API_ID \
     --stage-name prod
   ```

### Step 6: Grant API Gateway Permission

```bash
aws lambda add-permission \
  --function-name facebook-webhook-handler \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:eu-central-1:YOUR_ACCOUNT_ID:$API_ID/*/*"
```

## 🔐 Security Configuration

### Environment Variables Security

1. **Use AWS Secrets Manager (Recommended):**

   ```bash
   # Store secrets
   aws secretsmanager create-secret \
     --name facebook-webhook-secrets \
     --secret-string '{
       "FB_APP_SECRET":"your_facebook_app_secret",
       "FB_VERIFY_TOKEN":"your_webhook_verify_token"
     }'

   # Update Lambda to use Secrets Manager
   aws lambda update-function-configuration \
     --function-name facebook-webhook-handler \
     --environment Variables='{
       "SECRETS_MANAGER_SECRET_NAME":"facebook-webhook-secrets"
     }'
   ```

2. **Update IAM role for Secrets Manager access:**
   ```bash
   aws iam attach-role-policy \
     --role-name facebook-webhook-execution-role \
     --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
   ```

### Network Security

1. **VPC Configuration (Optional):**

   ```bash
   aws lambda update-function-configuration \
     --function-name facebook-webhook-handler \
     --vpc-config SubnetIds=subnet-12345,SecurityGroupIds=sg-12345
   ```

2. **Security Group Rules:**
   - Outbound HTTPS (443) for Facebook API calls
   - No inbound rules needed (Lambda is invoked, not accessed directly)

## 🧪 Testing and Verification

### Step 1: Test Lambda Function Directly

```bash
# Test webhook verification
aws lambda invoke \
  --function-name facebook-webhook-handler \
  --payload '{
    "httpMethod": "GET",
    "queryStringParameters": {
      "hub.mode": "subscribe",
      "hub.verify_token": "your_verify_token",
      "hub.challenge": "test_challenge"
    }
  }' \
  response.json

# Check response
cat response.json
```

### Step 2: Test via API Gateway

```bash
# Get API Gateway URL
API_URL="https://$API_ID.execute-api.eu-central-1.amazonaws.com/prod/webhook"

# Test webhook verification
curl "$API_URL?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"

# Should return: test_challenge
```

### Step 3: Test Event Processing

```bash
# Create test payload
cat > test_payload.json << EOF
{
  "object": "page",
  "entry": [
    {
      "id": "page_id",
      "time": 1234567890,
      "changes": [
        {
          "field": "feed",
          "value": {
            "item": "status",
            "post_id": "post_123",
            "verb": "add"
          }
        }
      ]
    }
  ]
}
EOF

# Generate signature
SIGNATURE=$(echo -n "$(cat test_payload.json)" | openssl dgst -sha256 -hmac "your_app_secret" | sed 's/^.* //')

# Test POST request
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -d @test_payload.json

# Should return: EVENT_RECEIVED
```

## 📊 Monitoring Setup

### CloudWatch Alarms

1. **Error Rate Alarm:**

   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name facebook-webhook-error-rate \
     --alarm-description "Facebook webhook error rate too high" \
     --metric-name Errors \
     --namespace AWS/Lambda \
     --statistic Sum \
     --period 300 \
     --threshold 5 \
     --comparison-operator GreaterThanThreshold \
     --dimensions Name=FunctionName,Value=facebook-webhook-handler \
     --evaluation-periods 2
   ```

2. **Duration Alarm:**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name facebook-webhook-duration \
     --alarm-description "Facebook webhook duration too high" \
     --metric-name Duration \
     --namespace AWS/Lambda \
     --statistic Average \
     --period 300 \
     --threshold 5000 \
     --comparison-operator GreaterThanThreshold \
     --dimensions Name=FunctionName,Value=facebook-webhook-handler \
     --evaluation-periods 2
   ```

### Log Groups

```bash
# Create log group (if not auto-created)
aws logs create-log-group \
  --log-group-name /aws/lambda/facebook-webhook-handler \
  --retention-in-days 30
```

## 🔄 Update Procedures

### Code Updates

1. **Build and package new version:**

   ```bash
   npm run build
   cd deployment/facebook-webhook
   zip -r ../facebook-webhook-v2.zip .
   cd ../..
   ```

2. **Update function code:**
   ```bash
   aws lambda update-function-code \
     --function-name facebook-webhook-handler \
     --zip-file fileb://deployment/facebook-webhook-v2.zip
   ```

### Configuration Updates

```bash
# Update environment variables
aws lambda update-function-configuration \
  --function-name facebook-webhook-handler \
  --environment Variables='{
    "FB_APP_SECRET":"new_secret",
    "FB_VERIFY_TOKEN":"new_token"
  }'

# Update timeout or memory
aws lambda update-function-configuration \
  --function-name facebook-webhook-handler \
  --timeout 60 \
  --memory-size 256
```

## 🔧 Troubleshooting

### Common Issues

1. **Permission Denied:**

   ```bash
   # Check IAM role permissions
   aws iam get-role --role-name facebook-webhook-execution-role
   aws iam list-attached-role-policies --role-name facebook-webhook-execution-role
   ```

2. **Function Not Found:**

   ```bash
   # List functions
   aws lambda list-functions --query 'Functions[?contains(FunctionName, `facebook`)]'
   ```

3. **Environment Variables Not Set:**
   ```bash
   # Check current configuration
   aws lambda get-function-configuration --function-name facebook-webhook-handler
   ```

### Debug Commands

```bash
# View recent logs
aws logs describe-log-streams \
  --log-group-name /aws/lambda/facebook-webhook-handler \
  --order-by LastEventTime \
  --descending \
  --max-items 1

# Get latest log stream
STREAM_NAME=$(aws logs describe-log-streams \
  --log-group-name /aws/lambda/facebook-webhook-handler \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

# View logs
aws logs get-log-events \
  --log-group-name /aws/lambda/facebook-webhook-handler \
  --log-stream-name "$STREAM_NAME"
```

## 📋 Post-Deployment Checklist

- [ ] Lambda function created and deployed
- [ ] Environment variables configured
- [ ] IAM permissions set correctly
- [ ] API Gateway configured (if used)
- [ ] CloudWatch monitoring enabled
- [ ] Function URL or API endpoint accessible
- [ ] Webhook verification test passed
- [ ] Event processing test passed
- [ ] Facebook app webhook URL updated
- [ ] Production monitoring alerts configured

## 🔄 Rollback Plan

If issues occur after deployment:

1. **Revert to previous version:**

   ```bash
   # List versions
   aws lambda list-versions-by-function --function-name facebook-webhook-handler

   # Update alias to previous version
   aws lambda update-alias \
     --function-name facebook-webhook-handler \
     --name LIVE \
     --function-version previous_version_number
   ```

2. **Restore previous configuration:**
   ```bash
   # Restore from backup
   aws lambda update-function-configuration \
     --function-name facebook-webhook-handler \
     --cli-input-json file://backup-config.json
   ```

## 📚 References

- [AWS Lambda Deployment Guide](https://docs.aws.amazon.com/lambda/latest/dg/lambda-deploy-functions.html)
- [API Gateway Lambda Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-integrations.html)
- [Facebook Webhook Setup](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [AWS CLI Lambda Commands](https://docs.aws.amazon.com/cli/latest/reference/lambda/)

---

**Deployment Status:** ✅ Ready for Production  
**Last Updated:** 2025-01-20  
**Next Review:** After first production deployment
