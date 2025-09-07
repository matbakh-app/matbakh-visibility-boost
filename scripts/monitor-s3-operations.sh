#!/bin/bash

# S3 Operations Monitoring Script
# This script provides real-time monitoring and health checks for S3 operations

set -e

# Configuration
REGION="eu-central-1"
BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E2W4JULEW8BXSD}"
LAMBDA_FUNCTIONS=("matbakh-get-presigned-url" "matbakh-s3-upload-processor")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
LOG_FILE="/tmp/s3-monitoring-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check S3 bucket health
check_s3_bucket() {
    local bucket=$1
    info "Checking S3 bucket: $bucket"
    
    # Check if bucket exists and is accessible
    if aws s3api head-bucket --bucket "$bucket" --region "$REGION" 2>/dev/null; then
        success "Bucket $bucket is accessible"
        
        # Get bucket size
        local size=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/S3 \
            --metric-name BucketSizeBytes \
            --dimensions Name=BucketName,Value="$bucket" Name=StorageType,Value=StandardStorage \
            --start-time "$(date -u -d '2 days ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 86400 \
            --statistics Average \
            --region "$REGION" \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$size" != "None" ] && [ "$size" != "0" ]; then
            local size_gb=$(echo "scale=2; $size / 1024 / 1024 / 1024" | bc -l 2>/dev/null || echo "0")
            info "Bucket size: ${size_gb} GB"
        else
            info "Bucket size: Empty or no data available"
        fi
        
        # Get recent error count
        local errors=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/S3 \
            --metric-name 4xxErrors \
            --dimensions Name=BucketName,Value="$bucket" \
            --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 3600 \
            --statistics Sum \
            --region "$REGION" \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$errors" != "None" ] && [ "$errors" != "0" ] && [ "$errors" -gt 0 ]; then
            warning "Recent 4xx errors: $errors"
        else
            success "No recent errors"
        fi
        
    else
        error "Bucket $bucket is not accessible or does not exist"
        return 1
    fi
}

# Function to check CloudFront distribution
check_cloudfront() {
    info "Checking CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    
    # Get distribution status
    local status=$(aws cloudfront get-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --region us-east-1 \
        --query 'Distribution.Status' \
        --output text 2>/dev/null || echo "NotFound")
    
    if [ "$status" = "Deployed" ]; then
        success "CloudFront distribution is deployed"
        
        # Get cache hit rate
        local cache_hit_rate=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/CloudFront \
            --metric-name CacheHitRate \
            --dimensions Name=DistributionId,Value="$CLOUDFRONT_DISTRIBUTION_ID" \
            --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 3600 \
            --statistics Average \
            --region us-east-1 \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$cache_hit_rate" != "None" ] && [ "$cache_hit_rate" != "0" ]; then
            local hit_rate=$(echo "scale=1; $cache_hit_rate" | bc -l 2>/dev/null || echo "0")
            if (( $(echo "$hit_rate > 80" | bc -l) )); then
                success "Cache hit rate: ${hit_rate}%"
            else
                warning "Cache hit rate is low: ${hit_rate}%"
            fi
        else
            info "Cache hit rate: No data available"
        fi
        
    elif [ "$status" = "InProgress" ]; then
        warning "CloudFront distribution is being updated"
    else
        error "CloudFront distribution status: $status"
        return 1
    fi
}

# Function to check Lambda functions
check_lambda_function() {
    local function_name=$1
    info "Checking Lambda function: $function_name"
    
    # Check if function exists
    if aws lambda get-function --function-name "$function_name" --region "$REGION" >/dev/null 2>&1; then
        success "Lambda function $function_name exists"
        
        # Get recent error count
        local errors=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Errors \
            --dimensions Name=FunctionName,Value="$function_name" \
            --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 3600 \
            --statistics Sum \
            --region "$REGION" \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$errors" != "None" ] && [ "$errors" != "0" ] && [ "$errors" -gt 0 ]; then
            warning "Recent errors: $errors"
        else
            success "No recent errors"
        fi
        
        # Get average duration
        local duration=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Duration \
            --dimensions Name=FunctionName,Value="$function_name" \
            --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 3600 \
            --statistics Average \
            --region "$REGION" \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$duration" != "None" ] && [ "$duration" != "0" ]; then
            local duration_ms=$(echo "scale=0; $duration" | bc -l 2>/dev/null || echo "0")
            info "Average duration: ${duration_ms}ms"
        else
            info "Duration: No recent invocations"
        fi
        
    else
        error "Lambda function $function_name does not exist or is not accessible"
        return 1
    fi
}

# Function to check CloudWatch alarms
check_alarms() {
    info "Checking CloudWatch alarms"
    
    local alarms=$(aws cloudwatch describe-alarms \
        --alarm-name-prefix "matbakh-" \
        --state-value ALARM \
        --region "$REGION" \
        --query 'MetricAlarms[].AlarmName' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$alarms" ]; then
        warning "Active alarms:"
        for alarm in $alarms; do
            warning "  - $alarm"
        done
    else
        success "No active alarms"
    fi
}

# Function to test upload functionality
test_upload() {
    info "Testing upload functionality"
    
    # Create a test file
    local test_file="/tmp/s3-test-$(date +%s).txt"
    echo "S3 monitoring test file - $(date)" > "$test_file"
    
    # Test upload to uploads bucket
    if aws s3 cp "$test_file" "s3://matbakh-files-uploads/monitoring-test/" --region "$REGION" 2>/dev/null; then
        success "Test upload successful"
        
        # Clean up test file
        aws s3 rm "s3://matbakh-files-uploads/monitoring-test/$(basename $test_file)" --region "$REGION" 2>/dev/null || true
    else
        error "Test upload failed"
    fi
    
    # Clean up local test file
    rm -f "$test_file"
}

# Function to generate monitoring report
generate_report() {
    local report_file="/tmp/s3-monitoring-report-$(date +%Y%m%d-%H%M%S).json"
    
    info "Generating monitoring report: $report_file"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "region": "$REGION",
  "buckets": [
EOF

    local first_bucket=true
    for bucket in "${BUCKETS[@]}"; do
        if [ "$first_bucket" = false ]; then
            echo "," >> "$report_file"
        fi
        first_bucket=false
        
        local size=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/S3 \
            --metric-name BucketSizeBytes \
            --dimensions Name=BucketName,Value="$bucket" Name=StorageType,Value=StandardStorage \
            --start-time "$(date -u -d '2 days ago' +%Y-%m-%dT%H:%M:%S)" \
            --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
            --period 86400 \
            --statistics Average \
            --region "$REGION" \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        cat >> "$report_file" << EOF
    {
      "name": "$bucket",
      "size_bytes": ${size:-0},
      "accessible": $(aws s3api head-bucket --bucket "$bucket" --region "$REGION" >/dev/null 2>&1 && echo "true" || echo "false")
    }
EOF
    done
    
    cat >> "$report_file" << EOF
  ],
  "cloudfront": {
    "distribution_id": "$CLOUDFRONT_DISTRIBUTION_ID",
    "status": "$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --region us-east-1 --query 'Distribution.Status' --output text 2>/dev/null || echo "Unknown")"
  },
  "lambda_functions": [
EOF

    local first_function=true
    for function in "${LAMBDA_FUNCTIONS[@]}"; do
        if [ "$first_function" = false ]; then
            echo "," >> "$report_file"
        fi
        first_function=false
        
        cat >> "$report_file" << EOF
    {
      "name": "$function",
      "exists": $(aws lambda get-function --function-name "$function" --region "$REGION" >/dev/null 2>&1 && echo "true" || echo "false")
    }
EOF
    done
    
    cat >> "$report_file" << EOF
  ]
}
EOF

    success "Report generated: $report_file"
    echo "$report_file"
}

# Main monitoring function
main() {
    echo -e "${BLUE}🔍 S3 Operations Monitoring - $(date)${NC}"
    echo "Log file: $LOG_FILE"
    echo ""
    
    # Check S3 buckets
    for bucket in "${BUCKETS[@]}"; do
        check_s3_bucket "$bucket"
        echo ""
    done
    
    # Check CloudFront
    check_cloudfront
    echo ""
    
    # Check Lambda functions
    for function in "${LAMBDA_FUNCTIONS[@]}"; do
        check_lambda_function "$function"
        echo ""
    done
    
    # Check alarms
    check_alarms
    echo ""
    
    # Test upload functionality
    test_upload
    echo ""
    
    # Generate report
    local report_file=$(generate_report)
    
    echo -e "${GREEN}🎯 Monitoring complete!${NC}"
    echo "Log file: $LOG_FILE"
    echo "Report file: $report_file"
}

# Handle command line arguments
case "${1:-}" in
    "buckets")
        for bucket in "${BUCKETS[@]}"; do
            check_s3_bucket "$bucket"
        done
        ;;
    "cloudfront")
        check_cloudfront
        ;;
    "lambda")
        for function in "${LAMBDA_FUNCTIONS[@]}"; do
            check_lambda_function "$function"
        done
        ;;
    "alarms")
        check_alarms
        ;;
    "test")
        test_upload
        ;;
    "report")
        generate_report
        ;;
    *)
        main
        ;;
esac