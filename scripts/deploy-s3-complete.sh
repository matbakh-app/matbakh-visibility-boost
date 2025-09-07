#!/bin/bash

# Complete S3 Infrastructure Deployment Script
# This script deploys all S3-related infrastructure with security enhancements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="eu-central-1"
ALERT_EMAIL="${ALERT_EMAIL:-info@matbakh.app}"

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Header
echo -e "${BLUE}🚀 Complete S3 Infrastructure Deployment${NC}"
echo "Region: $REGION"
echo "Alert Email: $ALERT_EMAIL"
echo ""

# 1. Install dependencies
log "Installing dependencies..."
cd infra/aws
npm install
cd ../..

# Install Lambda dependencies
for lambda_dir in infra/lambdas/*/; do
    if [ -f "$lambda_dir/package.json" ]; then
        log "Installing dependencies for $(basename $lambda_dir)..."
        cd "$lambda_dir"
        npm install
        cd - > /dev/null
    fi
done

success "Dependencies installed"

# 2. Bootstrap CDK (if needed)
log "Bootstrapping CDK..."
cd infra/aws
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION || true
cd ../..

# 3. Deploy S3 buckets stack
log "Deploying S3 buckets stack..."
cd infra/aws
cdk deploy matbakh-s3-buckets --require-approval never --outputs-file s3-outputs.json
cd ../..

if [ $? -eq 0 ]; then
    success "S3 buckets stack deployed"
else
    error "Failed to deploy S3 buckets stack"
fi

# 4. Deploy monitoring stack
log "Deploying monitoring stack..."
cd infra/aws
cdk deploy matbakh-s3-monitoring \
    --context alertEmail=$ALERT_EMAIL \
    --require-approval never \
    --outputs-file monitoring-outputs.json
cd ../..

if [ $? -eq 0 ]; then
    success "Monitoring stack deployed"
else
    warning "Monitoring stack deployment failed (continuing...)"
fi

# 5. Update CORS configuration
log "Updating S3 CORS configuration..."
./scripts/update-s3-cors.sh

# 6. Enable S3 Request Metrics (manual step - inform user)
warning "MANUAL STEP REQUIRED: Enable S3 Request Metrics"
echo "To enable detailed S3 monitoring, run the following commands:"
echo ""
echo "aws s3api put-bucket-metrics-configuration --bucket matbakh-files-uploads \\"
echo "  --id EntireBucket --metrics-configuration Id=EntireBucket"
echo ""
echo "aws s3api put-bucket-metrics-configuration --bucket matbakh-files-profile \\"
echo "  --id EntireBucket --metrics-configuration Id=EntireBucket"
echo ""
echo "aws s3api put-bucket-metrics-configuration --bucket matbakh-files-reports \\"
echo "  --id EntireBucket --metrics-configuration Id=EntireBucket"
echo ""

# 7. Deploy Lambda functions individually (if CDK deployment didn't work)
log "Verifying Lambda functions..."

LAMBDA_FUNCTIONS=("matbakh-get-presigned-url" "matbakh-s3-upload-processor")
for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name $func --region $REGION >/dev/null 2>&1; then
        success "Lambda function $func is deployed"
    else
        warning "Lambda function $func not found - attempting individual deployment"
        
        # Try to deploy from individual directories
        case $func in
            "matbakh-get-presigned-url")
                cd infra/lambdas/s3-presigned-url
                if [ -f "deploy.sh" ]; then
                    ./deploy.sh
                fi
                cd - > /dev/null
                ;;
            "matbakh-s3-upload-processor")
                cd infra/lambdas/s3-upload-processor
                if [ -f "deploy.sh" ]; then
                    ./deploy.sh
                fi
                cd - > /dev/null
                ;;
        esac
    fi
done

# 8. Validate deployment
log "Validating deployment..."

# Check S3 buckets
BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports" "matbakh-access-logs")
for bucket in "${BUCKETS[@]}"; do
    if aws s3 ls s3://$bucket/ --region $REGION >/dev/null 2>&1; then
        success "S3 bucket $bucket is accessible"
    else
        error "S3 bucket $bucket is not accessible"
    fi
done

# Check CloudFront distribution
if [ -f "infra/aws/s3-outputs.json" ]; then
    DISTRIBUTION_ID=$(jq -r '.["matbakh-s3-buckets"].ReportsDistributionId // empty' infra/aws/s3-outputs.json)
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "null" ]; then
        if aws cloudfront get-distribution --id $DISTRIBUTION_ID >/dev/null 2>&1; then
            success "CloudFront distribution $DISTRIBUTION_ID is accessible"
        else
            warning "CloudFront distribution $DISTRIBUTION_ID not accessible"
        fi
    else
        warning "CloudFront distribution ID not found in outputs"
    fi
fi

# 9. Run validation script
log "Running comprehensive validation..."
if [ -f "scripts/validate-s3-migration-complete.sh" ]; then
    ./scripts/validate-s3-migration-complete.sh || warning "Validation found some issues (see output above)"
else
    warning "Validation script not found"
fi

# 10. Display deployment summary
echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "===================="

if [ -f "infra/aws/s3-outputs.json" ]; then
    echo -e "${GREEN}S3 Resources:${NC}"
    jq -r 'to_entries[] | "  \(.key): \(.value)"' infra/aws/s3-outputs.json
fi

if [ -f "infra/aws/monitoring-outputs.json" ]; then
    echo -e "${GREEN}Monitoring Resources:${NC}"
    jq -r 'to_entries[] | "  \(.key): \(.value)"' infra/aws/monitoring-outputs.json
fi

echo ""
echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "1. Enable S3 Request Metrics (see commands above)"
echo "2. Confirm SNS email subscription for alerts"
echo "3. Test file upload functionality"
echo "4. Monitor CloudWatch dashboard"
echo "5. Run cleanup script: ./scripts/cleanup-migration-artifacts.sh"

echo ""
echo -e "${GREEN}✅ S3 Infrastructure Deployment Complete!${NC}"