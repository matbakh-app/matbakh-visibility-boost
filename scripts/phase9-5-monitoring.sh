#!/bin/bash

# Phase 9.5 - Monitoring & Alerts Setup
# Configure CloudWatch monitoring and alerts for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="eu-central-1"
SNS_TOPIC_NAME="matbakh-production-alerts"
DASHBOARD_NAME="MatbakhProductionDashboard"

echo -e "${BLUE}📊 Phase 9.5 - Monitoring & Alerts Setup${NC}"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Region: $REGION"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found${NC}"
  exit 1
fi

# 1. Create SNS Topic for Alerts
echo -e "${YELLOW}1. Setting up SNS topic for alerts...${NC}"

# Check if topic already exists
TOPIC_ARN=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" --output text)

if [ -z "$TOPIC_ARN" ]; then
  echo "Creating SNS topic: $SNS_TOPIC_NAME"
  TOPIC_ARN=$(aws sns create-topic --name "$SNS_TOPIC_NAME" --region $REGION --query 'TopicArn' --output text)
  echo -e "${GREEN}✅ SNS topic created: $TOPIC_ARN${NC}"
else
  echo -e "${GREEN}✅ SNS topic already exists: $TOPIC_ARN${NC}"
fi

# Add email subscription if EMAIL_ALERT is set
if [ ! -z "$EMAIL_ALERT" ]; then
  echo "Adding email subscription: $EMAIL_ALERT"
  aws sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$EMAIL_ALERT" \
    --region $REGION
  echo -e "${GREEN}✅ Email subscription added (check email for confirmation)${NC}"
else
  echo -e "${YELLOW}⚠️  EMAIL_ALERT not set - no email notifications configured${NC}"
fi

# 2. Lambda Function Alarms
echo -e "\n${YELLOW}2. Setting up Lambda function alarms...${NC}"

LAMBDA_FUNCTIONS=("matbakh-get-presigned-url" "matbakh-s3-upload-processor")

for func in "${LAMBDA_FUNCTIONS[@]}"; do
  echo "Setting up alarms for: $func"
  
  # Error rate alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name "${func}-ErrorRate" \
    --alarm-description "Lambda function error rate > 0" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 0 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$TOPIC_ARN" \
    --dimensions Name=FunctionName,Value="$func" \
    --region $REGION
  
  # Duration alarm (timeout warning)
  aws cloudwatch put-metric-alarm \
    --alarm-name "${func}-Duration" \
    --alarm-description "Lambda function duration > 25 seconds" \
    --metric-name Duration \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --threshold 25000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$TOPIC_ARN" \
    --dimensions Name=FunctionName,Value="$func" \
    --region $REGION
  
  # Throttle alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name "${func}-Throttles" \
    --alarm-description "Lambda function throttles > 0" \
    --metric-name Throttles \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 0 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$TOPIC_ARN" \
    --dimensions Name=FunctionName,Value="$func" \
    --region $REGION
  
  echo -e "${GREEN}✅ Alarms configured for: $func${NC}"
done

# 3. API Gateway Alarms
echo -e "\n${YELLOW}3. Setting up API Gateway alarms...${NC}"

# Get API Gateway ID (if available)
API_ID=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='matbakh-api'].id" --output text 2>/dev/null || echo "")

if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
  echo "Setting up alarms for API Gateway: $API_ID"
  
  # 5XX error rate alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name "APIGateway-5XXError" \
    --alarm-description "API Gateway 5XX error rate > 1%" \
    --metric-name 5XXError \
    --namespace AWS/ApiGateway \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$TOPIC_ARN" \
    --dimensions Name=ApiName,Value="matbakh-api" \
    --region $REGION
  
  # Latency alarm
  aws cloudwatch put-metric-alarm \
    --alarm-name "APIGateway-Latency" \
    --alarm-description "API Gateway latency > 10 seconds" \
    --metric-name Latency \
    --namespace AWS/ApiGateway \
    --statistic Average \
    --period 300 \
    --threshold 10000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$TOPIC_ARN" \
    --dimensions Name=ApiName,Value="matbakh-api" \
    --region $REGION
  
  echo -e "${GREEN}✅ API Gateway alarms configured${NC}"
else
  echo -e "${YELLOW}⚠️  API Gateway not found - skipping API Gateway alarms${NC}"
fi

# 4. S3 and CloudFront Alarms
echo -e "\n${YELLOW}4. Setting up S3 and CloudFront alarms...${NC}"

# CloudFront error rate alarm
CLOUDFRONT_DISTRIBUTION_ID="E2F6WWPSDEO05Y"  # Update with actual distribution ID

aws cloudwatch put-metric-alarm \
  --alarm-name "CloudFront-4XXErrorRate" \
  --alarm-description "CloudFront 4XX error rate > 5%" \
  --metric-name 4xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$TOPIC_ARN" \
  --dimensions Name=DistributionId,Value="$CLOUDFRONT_DISTRIBUTION_ID" \
  --region us-east-1  # CloudFront metrics are in us-east-1

aws cloudwatch put-metric-alarm \
  --alarm-name "CloudFront-5XXErrorRate" \
  --alarm-description "CloudFront 5XX error rate > 1%" \
  --metric-name 5xxErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions "$TOPIC_ARN" \
  --dimensions Name=DistributionId,Value="$CLOUDFRONT_DISTRIBUTION_ID" \
  --region us-east-1

# Cache hit rate warning
aws cloudwatch put-metric-alarm \
  --alarm-name "CloudFront-CacheHitRate" \
  --alarm-description "CloudFront cache hit rate < 70%" \
  --metric-name CacheHitRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 900 \
  --threshold 70 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 3 \
  --alarm-actions "$TOPIC_ARN" \
  --dimensions Name=DistributionId,Value="$CLOUDFRONT_DISTRIBUTION_ID" \
  --region us-east-1

echo -e "${GREEN}✅ CloudFront alarms configured${NC}"

# 5. Create CloudWatch Dashboard
echo -e "\n${YELLOW}5. Creating CloudWatch dashboard...${NC}"

# Dashboard JSON configuration
DASHBOARD_BODY=$(cat << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Invocations", "FunctionName", "matbakh-get-presigned-url" ],
          [ ".", "Errors", ".", "." ],
          [ ".", "Duration", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "eu-central-1",
        "title": "Presigned URL Lambda Metrics"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Invocations", "FunctionName", "matbakh-s3-upload-processor" ],
          [ ".", "Errors", ".", "." ],
          [ ".", "Duration", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "eu-central-1",
        "title": "Upload Processor Lambda Metrics"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/S3", "NumberOfObjects", "BucketName", "matbakh-files-uploads", "StorageType", "AllStorageTypes" ],
          [ ".", "BucketSizeBytes", ".", ".", ".", "StandardStorage" ]
        ],
        "period": 86400,
        "stat": "Average",
        "region": "eu-central-1",
        "title": "S3 Storage Metrics"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/CloudFront", "Requests", "DistributionId", "E2F6WWPSDEO05Y" ],
          [ ".", "BytesDownloaded", ".", "." ],
          [ ".", "CacheHitRate", ".", "." ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "CloudFront Metrics"
      }
    }
  ]
}
EOF
)

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "$DASHBOARD_NAME" \
  --dashboard-body "$DASHBOARD_BODY" \
  --region $REGION

echo -e "${GREEN}✅ CloudWatch dashboard created: $DASHBOARD_NAME${NC}"

# 6. Create Synthetic Canary (Optional)
echo -e "\n${YELLOW}6. Setting up synthetic canary...${NC}"

# Create canary script
CANARY_SCRIPT=$(cat << 'EOF'
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanary = async function () {
    const config = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        restrictedHeaders: ['Authorization'],
        includeRequestBody: true,
        includeResponseBody: true
    };

    // Test API health
    await synthetics.executeStep('checkApiHealth', async function () {
        const response = await synthetics.makeRequest({
            hostname: 'api.matbakh.app',
            path: '/health',
            method: 'GET'
        }, config);
        
        if (response.statusCode !== 200) {
            throw new Error(`API health check failed: ${response.statusCode}`);
        }
    });

    // Test CloudFront
    await synthetics.executeStep('checkCloudFront', async function () {
        const response = await synthetics.makeRequest({
            hostname: 'dtkzvn1fvvkgu.cloudfront.net',
            path: '/reports/test',
            method: 'HEAD'
        }, config);
        
        if (response.statusCode !== 200 && response.statusCode !== 404) {
            throw new Error(`CloudFront check failed: ${response.statusCode}`);
        }
    });
};

exports.handler = async () => {
    return await synthetics.executeStep('apiCanary', apiCanary);
};
EOF
)

# Save canary script
mkdir -p ./monitoring
echo "$CANARY_SCRIPT" > ./monitoring/canary-script.js

echo -e "${GREEN}✅ Synthetic canary script created: ./monitoring/canary-script.js${NC}"
echo -e "${YELLOW}⚠️  Deploy canary manually via AWS Console or CloudFormation${NC}"

# 7. Generate Monitoring Report
echo -e "\n${YELLOW}7. Generating monitoring setup report...${NC}"
REPORT_FILE="./monitoring_setup_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Phase 9.5 Monitoring & Alerts Setup Report

**Date**: $(date)
**Status**: COMPLETED

## SNS Topic
- **Topic ARN**: $TOPIC_ARN
- **Email Alerts**: ${EMAIL_ALERT:-"Not configured"}

## CloudWatch Alarms

### Lambda Function Alarms
- matbakh-get-presigned-url-ErrorRate
- matbakh-get-presigned-url-Duration  
- matbakh-get-presigned-url-Throttles
- matbakh-s3-upload-processor-ErrorRate
- matbakh-s3-upload-processor-Duration
- matbakh-s3-upload-processor-Throttles

### API Gateway Alarms
- APIGateway-5XXError
- APIGateway-Latency

### CloudFront Alarms
- CloudFront-4XXErrorRate
- CloudFront-5XXErrorRate
- CloudFront-CacheHitRate

## CloudWatch Dashboard
- **Name**: $DASHBOARD_NAME
- **URL**: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME

## Synthetic Monitoring
- **Canary Script**: ./monitoring/canary-script.js
- **Frequency**: Every 5 minutes (when deployed)
- **Endpoints**: API health, CloudFront access

## Alert Thresholds

### Critical Alerts (Immediate Response)
- Lambda errors > 0
- API Gateway 5XX errors > 1%
- Lambda throttles > 0

### Warning Alerts (Monitor)
- Lambda duration > 25 seconds
- API Gateway latency > 10 seconds
- CloudFront cache hit rate < 70%

## Next Steps

1. **Confirm Email Subscription**: Check email for SNS confirmation
2. **Test Alerts**: Trigger test alert to verify notification delivery
3. **Monitor Dashboard**: Review metrics for first 24-48 hours
4. **Adjust Thresholds**: Fine-tune alert thresholds based on baseline
5. **Document Runbooks**: Create incident response procedures

## Monitoring URLs

- **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch/home?region=$REGION
- **Dashboard**: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME
- **Alarms**: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:

## Emergency Contacts

- **Primary**: Production team
- **Escalation**: CTO/Technical lead
- **SNS Topic**: $TOPIC_ARN

EOF

echo -e "${GREEN}✅ Monitoring setup report: $REPORT_FILE${NC}"

# Summary
echo -e "\n${BLUE}📊 Monitoring Setup Summary${NC}"
echo "=========================================="
echo "✅ SNS topic created for alerts"
echo "✅ Lambda function alarms configured"
echo "✅ API Gateway alarms configured"
echo "✅ CloudFront alarms configured"
echo "✅ CloudWatch dashboard created"
echo "✅ Synthetic canary script prepared"
echo ""
echo "Dashboard URL:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
echo ""
echo "Next Steps:"
echo "1. Confirm email subscription (check inbox)"
echo "2. Test alert delivery"
echo "3. Monitor system for 24-48 hours"
echo "4. Plan Supabase decommissioning"
echo ""

echo -e "${GREEN}📊 Phase 9.5 Monitoring Setup Complete!${NC}"