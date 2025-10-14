#!/bin/bash

# Enable S3 Request Metrics
# This script enables detailed request metrics for S3 buckets (required for CloudWatch alarms)

set -e

BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")
REGION="eu-central-1"

echo "🔍 Enabling S3 Request Metrics for detailed monitoring..."
echo "Note: This will incur additional costs (~$0.10 per million requests)"
echo ""

for bucket in "${BUCKETS[@]}"; do
    echo "Enabling request metrics for $bucket..."
    
    # Enable request metrics for entire bucket
    if aws s3api put-bucket-metrics-configuration \
        --bucket $bucket \
        --id EntireBucket \
        --metrics-configuration Id=EntireBucket \
        --region $REGION; then
        echo "✅ Request metrics enabled for $bucket"
    else
        echo "❌ Failed to enable request metrics for $bucket"
    fi
    
    # Verify configuration
    echo "Verifying configuration for $bucket..."
    aws s3api get-bucket-metrics-configuration \
        --bucket $bucket \
        --id EntireBucket \
        --region $REGION \
        --query 'MetricsConfiguration.Id' \
        --output text
    
    echo ""
done

echo "✅ S3 Request Metrics configuration completed"
echo ""
echo "📊 Metrics will be available in CloudWatch within 15 minutes"
echo "💰 Cost: ~$0.10 per million requests (1-minute granularity)"