#!/bin/bash
set -euo pipefail

# Quick Environment Setup for matbakh.app Migration
# This script helps you configure the environment variables

echo "🔧 matbakh.app Migration - Environment Setup"
echo "==========================================="
echo ""

echo "📋 This script will help you configure the environment variables needed for migration."
echo "   You can either:"
echo "   A) Run the full infrastructure deployment (recommended)"
echo "   B) Manually configure existing AWS resources"
echo ""

read -p "Do you want to run full infrastructure deployment? (y/n): " deploy_infra

if [[ $deploy_infra =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Running full infrastructure deployment..."
    echo "   This will create all AWS resources needed for the migration."
    echo ""
    
    # Check if deployment scripts exist
    if [ -f "infra/aws/infrastructure-deployment.sh" ]; then
        echo "✅ Infrastructure deployment script found"
        chmod +x infra/aws/infrastructure-deployment.sh
        
        echo "⚠️  This will create AWS resources and may incur costs."
        read -p "Continue with deployment? (y/n): " confirm_deploy
        
        if [[ $confirm_deploy =~ ^[Yy]$ ]]; then
            echo "🚀 Starting infrastructure deployment..."
            ./infra/aws/infrastructure-deployment.sh
            
            echo ""
            echo "✅ Infrastructure deployment completed!"
            echo "   Environment files have been generated automatically."
        else
            echo "❌ Deployment cancelled."
        fi
    else
        echo "❌ Infrastructure deployment script not found."
        echo "   Please ensure you're in the correct directory."
    fi
else
    echo ""
    echo "📝 Manual configuration mode"
    echo "   Please update the following files with your AWS resource IDs:"
    echo ""
    echo "   📁 .env.infrastructure - VPC, RDS, and networking resources"
    echo "   📁 .env.cognito - Cognito User Pool configuration"
    echo "   📁 .env.lambda - Lambda function ARNs"
    echo ""
    echo "💡 You can find these values in the AWS Console:"
    echo "   - VPC: https://console.aws.amazon.com/vpc/"
    echo "   - RDS: https://console.aws.amazon.com/rds/"
    echo "   - Cognito: https://console.aws.amazon.com/cognito/"
    echo "   - Lambda: https://console.aws.amazon.com/lambda/"
    echo ""
fi

echo "📊 Current environment files status:"
for file in ".env.infrastructure" ".env.cognito" ".env.lambda"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

echo ""
echo "🎯 Next steps:"
echo "   1. Verify environment variables in .env files"
echo "   2. Run: ./infra/aws/generate-sample-users.sh (for testing)"
echo "   3. Run: ./infra/aws/user-data-migration.sh (for migration)"
echo ""
echo "📚 For help, check: docs/hackathon/2025-08-28-user-data-migration-log.md"
echo ""