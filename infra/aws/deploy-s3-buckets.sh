#!/bin/bash

# Deploy S3 Buckets Stack for Matbakh File Storage Migration
# This script deploys the S3 infrastructure using AWS CDK

set -e

echo "🚀 Starting S3 Buckets Stack Deployment..."

# Check if CDK is available (via npx or global)
if ! command -v cdk &> /dev/null && ! npx cdk --version &> /dev/null; then
    echo "❌ AWS CDK is not available. Please install it first:"
    echo "npm install -g aws-cdk"
    exit 1
fi

# Use npx if global cdk is not available
CDK_CMD="cdk"
if ! command -v cdk &> /dev/null; then
    CDK_CMD="npx cdk"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Set environment variables
export AWS_REGION=${AWS_REGION:-eu-central-1}
export CDK_DEFAULT_REGION=$AWS_REGION
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

echo "📍 Deploying to Account: $CDK_DEFAULT_ACCOUNT"
echo "📍 Region: $AWS_REGION"

# Navigate to infrastructure directory
cd "$(dirname "$0")"

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing CDK dependencies..."
    npm install
fi

# Bootstrap CDK if not already done
echo "🔧 Bootstrapping CDK (if needed)..."
$CDK_CMD bootstrap aws://$CDK_DEFAULT_ACCOUNT/$AWS_REGION

# Synthesize the stack to check for errors
echo "🔍 Synthesizing CDK stack..."
$CDK_CMD synth MatbakhS3BucketsStack

# Deploy the stack
echo "🚀 Deploying S3 Buckets Stack..."
$CDK_CMD deploy MatbakhS3BucketsStack \
    --require-approval never \
    --outputs-file s3-buckets-outputs.json \
    --tags Project=matbakh \
    --tags Environment=production \
    --tags Component=file-storage

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ S3 Buckets Stack deployed successfully!"
    
    # Display outputs
    if [ -f "s3-buckets-outputs.json" ]; then
        echo ""
        echo "📋 Stack Outputs:"
        cat s3-buckets-outputs.json | jq '.'
        
        # Extract important values
        UPLOADS_BUCKET=$(cat s3-buckets-outputs.json | jq -r '.MatbakhS3BucketsStack.UploadsBucketName // empty')
        PROFILE_BUCKET=$(cat s3-buckets-outputs.json | jq -r '.MatbakhS3BucketsStack.ProfileBucketName // empty')
        REPORTS_BUCKET=$(cat s3-buckets-outputs.json | jq -r '.MatbakhS3BucketsStack.ReportsBucketName // empty')
        CLOUDFRONT_DOMAIN=$(cat s3-buckets-outputs.json | jq -r '.MatbakhS3BucketsStack.ReportsDistributionDomain // empty')
        
        echo ""
        echo "🎯 Key Resources Created:"
        echo "   📁 Uploads Bucket: $UPLOADS_BUCKET"
        echo "   👤 Profile Bucket: $PROFILE_BUCKET"
        echo "   📊 Reports Bucket: $REPORTS_BUCKET"
        echo "   🌐 CloudFront Domain: $CLOUDFRONT_DOMAIN"
    fi
    
    # Verify buckets are accessible
    echo ""
    echo "🔍 Verifying bucket accessibility..."
    
    if [ ! -z "$UPLOADS_BUCKET" ]; then
        aws s3 ls s3://$UPLOADS_BUCKET/ > /dev/null 2>&1 && echo "✅ Uploads bucket accessible" || echo "❌ Uploads bucket not accessible"
    fi
    
    if [ ! -z "$PROFILE_BUCKET" ]; then
        aws s3 ls s3://$PROFILE_BUCKET/ > /dev/null 2>&1 && echo "✅ Profile bucket accessible" || echo "❌ Profile bucket not accessible"
    fi
    
    if [ ! -z "$REPORTS_BUCKET" ]; then
        aws s3 ls s3://$REPORTS_BUCKET/ > /dev/null 2>&1 && echo "✅ Reports bucket accessible" || echo "❌ Reports bucket not accessible"
    fi
    
    echo ""
    echo "🎉 S3 File Storage Infrastructure is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy the Lambda function for presigned URLs"
    echo "2. Update frontend to use new S3 upload library"
    echo "3. Run database migrations for file metadata"
    echo ""
    
else
    echo "❌ Deployment failed!"
    exit 1
fi