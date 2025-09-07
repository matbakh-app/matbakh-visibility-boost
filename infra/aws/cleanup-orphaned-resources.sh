#!/bin/bash
set -euo pipefail

# AWS Infrastructure Cleanup - Orphaned Resources
# This script cleans up orphaned resources that might cause VPC conflicts

REGION=${AWS_REGION:-eu-central-1}
PROJECT_NAME="matbakh"

echo "🧹 AWS Infrastructure Cleanup - Orphaned Resources"
echo "=================================================="
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo ""

# Function to check if resource exists
resource_exists() {
    local resource_type=$1
    local identifier=$2
    
    case $resource_type in
        "vpc")
            aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$identifier" --query 'Vpcs[0].VpcId' --output text 2>/dev/null
            ;;
        "igw")
            aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=$identifier" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null
            ;;
        "route-table")
            aws ec2 describe-route-tables --filters "Name=tag:Name,Values=$identifier" --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null
            ;;
    esac
}

# Step 1: Analyze current infrastructure
echo "🔍 Step 1: Analyzing current infrastructure..."
echo ""

# Check VPCs
echo "📊 VPCs:"
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" \
    --query "Vpcs[*].{ID:VpcId,CIDR:CidrBlock,State:State}" --output table

# Check Internet Gateways
echo ""
echo "📊 Internet Gateways:"
aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=matbakh-igw" \
    --query "InternetGateways[*].{ID:InternetGatewayId,Attachments:Attachments}" --output table

# Check Route Tables
echo ""
echo "📊 Route Tables:"
vpc_id=$(resource_exists "vpc" "matbakh-vpc")
if [ "$vpc_id" != "None" ] && [ "$vpc_id" != "null" ] && [ -n "$vpc_id" ]; then
    aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc_id" \
        --query "RouteTables[*].{ID:RouteTableId,VPC:VpcId,Main:Associations[0].Main}" --output table
else
    echo "❌ No matbakh-vpc found"
fi

echo ""
echo "🔧 Step 2: Cleanup Options"
echo "=========================="
echo ""
echo "Choose cleanup action:"
echo "1) Fix VPC/IGW attachments (recommended)"
echo "2) Delete all matbakh resources and start fresh"
echo "3) Manual inspection only (no changes)"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Fixing VPC/IGW attachments..."
        
        vpc_id=$(resource_exists "vpc" "matbakh-vpc")
        igw_id=$(resource_exists "igw" "matbakh-igw")
        
        if [ "$vpc_id" != "None" ] && [ "$igw_id" != "None" ]; then
            # Check current IGW attachment
            current_vpc=$(aws ec2 describe-internet-gateways --internet-gateway-ids "$igw_id" \
                --query 'InternetGateways[0].Attachments[0].VpcId' --output text 2>/dev/null || echo "None")
            
            if [ "$current_vpc" != "$vpc_id" ]; then
                echo "🔄 Detaching IGW $igw_id from VPC $current_vpc"
                aws ec2 detach-internet-gateway --vpc-id "$current_vpc" --internet-gateway-id "$igw_id" 2>/dev/null || true
                
                echo "🔗 Attaching IGW $igw_id to VPC $vpc_id"
                aws ec2 attach-internet-gateway --vpc-id "$vpc_id" --internet-gateway-id "$igw_id"
                
                echo "✅ IGW attachment fixed"
            else
                echo "✅ IGW is already correctly attached"
            fi
        else
            echo "❌ Required resources not found (VPC: $vpc_id, IGW: $igw_id)"
        fi
        ;;
        
    2)
        echo ""
        echo "⚠️  WARNING: This will delete ALL matbakh AWS resources!"
        echo "This includes VPC, subnets, NAT gateways, RDS clusters, etc."
        echo ""
        read -p "Are you sure? Type 'DELETE' to confirm: " confirm
        
        if [ "$confirm" = "DELETE" ]; then
            echo "🗑️  Deleting all matbakh resources..."
            
            # Delete in reverse dependency order
            echo "1. Deleting RDS clusters..."
            aws rds delete-db-cluster --db-cluster-identifier matbakh-prod --skip-final-snapshot 2>/dev/null || true
            
            echo "2. Deleting NAT Gateways..."
            nat_gateways=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-*" --query 'NatGateways[*].NatGatewayId' --output text)
            for nat_id in $nat_gateways; do
                aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" 2>/dev/null || true
            done
            
            echo "3. Deleting Route Tables..."
            route_tables=$(aws ec2 describe-route-tables --filters "Name=tag:Name,Values=matbakh-*" --query 'RouteTables[*].RouteTableId' --output text)
            for rt_id in $route_tables; do
                aws ec2 delete-route-table --route-table-id "$rt_id" 2>/dev/null || true
            done
            
            echo "4. Deleting Subnets..."
            subnets=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-*" --query 'Subnets[*].SubnetId' --output text)
            for subnet_id in $subnets; do
                aws ec2 delete-subnet --subnet-id "$subnet_id" 2>/dev/null || true
            done
            
            echo "5. Deleting Internet Gateway..."
            igw_id=$(resource_exists "igw" "matbakh-igw")
            if [ "$igw_id" != "None" ]; then
                vpc_id=$(resource_exists "vpc" "matbakh-vpc")
                aws ec2 detach-internet-gateway --vpc-id "$vpc_id" --internet-gateway-id "$igw_id" 2>/dev/null || true
                aws ec2 delete-internet-gateway --internet-gateway-id "$igw_id" 2>/dev/null || true
            fi
            
            echo "6. Deleting VPC..."
            vpc_id=$(resource_exists "vpc" "matbakh-vpc")
            if [ "$vpc_id" != "None" ]; then
                aws ec2 delete-vpc --vpc-id "$vpc_id" 2>/dev/null || true
            fi
            
            echo "✅ Cleanup completed. You can now run infrastructure deployment fresh."
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
        
    3)
        echo ""
        echo "📋 Manual Inspection Commands:"
        echo "=============================="
        echo ""
        echo "# Check VPC details:"
        echo "aws ec2 describe-vpcs --filters \"Name=tag:Name,Values=matbakh-vpc\""
        echo ""
        echo "# Check IGW attachments:"
        echo "aws ec2 describe-internet-gateways --filters \"Name=tag:Name,Values=matbakh-igw\""
        echo ""
        echo "# Check route tables:"
        vpc_id=$(resource_exists "vpc" "matbakh-vpc")
        if [ "$vpc_id" != "None" ]; then
            echo "aws ec2 describe-route-tables --filters \"Name=vpc-id,Values=$vpc_id\""
        fi
        echo ""
        echo "# Fix IGW attachment manually:"
        echo "aws ec2 detach-internet-gateway --vpc-id <old-vpc-id> --internet-gateway-id <igw-id>"
        echo "aws ec2 attach-internet-gateway --vpc-id <correct-vpc-id> --internet-gateway-id <igw-id>"
        ;;
        
    4)
        echo "👋 Exiting cleanup script"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Run infrastructure deployment: ./infra/aws/infrastructure-deployment.sh"
echo "2. Test user migration: ./infra/aws/user-data-migration.sh"
echo "3. Validate results: ./infra/aws/migration-validation.sh"
echo ""