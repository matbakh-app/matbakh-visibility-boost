#!/bin/bash
set -euo pipefail

# Fix Failed NAT Gateways Script
# This script identifies and fixes failed NAT Gateways

REGION=${AWS_REGION:-eu-central-1}

echo "🔧 Fix Failed NAT Gateways - matbakh.app"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Region: $REGION"
echo ""

# Step 1: Analyze current NAT Gateway state
echo "🔍 Step 1: Analyzing NAT Gateway states..."
echo ""

echo "📊 All NAT Gateways:"
aws ec2 describe-nat-gateways \
    --query 'NatGateways[*].{ID:NatGatewayId,State:State,Subnet:SubnetId,PublicIP:NatGatewayAddresses[0].PublicIp,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table

echo ""

# Check for failed NAT Gateways
failed_nats=$(aws ec2 describe-nat-gateways --filter "Name=state,Values=failed" --query 'NatGateways[*].NatGatewayId' --output text)

if [ -z "$failed_nats" ] || [ "$failed_nats" = "None" ]; then
    echo "✅ No failed NAT Gateways found"
    
    # Check for pending NAT Gateways
    pending_nats=$(aws ec2 describe-nat-gateways --filter "Name=state,Values=pending" --query 'NatGateways[*].NatGatewayId' --output text)
    
    if [ -n "$pending_nats" ] && [ "$pending_nats" != "None" ]; then
        echo "⏳ Found pending NAT Gateways: $pending_nats"
        echo "   Waiting for them to become available..."
        
        for nat_id in $pending_nats; do
            echo "⏳ Waiting for $nat_id..."
            aws ec2 wait nat-gateway-available --nat-gateway-ids "$nat_id" --cli-read-timeout 300 || {
                echo "❌ NAT Gateway $nat_id failed to become available"
                failed_nats="$failed_nats $nat_id"
            }
        done
    fi
    
    if [ -z "$failed_nats" ]; then
        echo "🎉 All NAT Gateways are healthy!"
        exit 0
    fi
fi

echo "❌ Found failed NAT Gateways: $failed_nats"
echo ""

# Step 2: Show detailed failure information
echo "🔍 Step 2: Analyzing failure details..."
for nat_id in $failed_nats; do
    echo ""
    echo "📋 NAT Gateway: $nat_id"
    aws ec2 describe-nat-gateways --nat-gateway-ids "$nat_id" \
        --query 'NatGateways[0].{State:State,FailureCode:FailureCode,FailureMessage:FailureMessage,SubnetId:SubnetId,VpcId:VpcId,CreateTime:CreateTime}' \
        --output table
done

echo ""
echo "🔧 Step 3: Cleanup and Recreation Options"
echo "=========================================="
echo ""
echo "Choose action:"
echo "1) Delete failed NAT Gateways and retry deployment (recommended)"
echo "2) Delete all matbakh NAT Gateways and start fresh"
echo "3) Manual inspection only (no changes)"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🗑️  Deleting failed NAT Gateways..."
        
        for nat_id in $failed_nats; do
            echo "🗑️  Deleting NAT Gateway: $nat_id"
            aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" || echo "❌ Failed to delete $nat_id"
        done
        
        echo ""
        echo "⏳ Waiting for NAT Gateways to be deleted..."
        for nat_id in $failed_nats; do
            echo "⏳ Waiting for $nat_id to be deleted..."
            aws ec2 wait nat-gateway-deleted --nat-gateway-ids "$nat_id" --cli-read-timeout 300 || echo "⚠️  Timeout waiting for $nat_id deletion"
        done
        
        echo "✅ Failed NAT Gateways deleted"
        echo ""
        echo "🚀 Ready to retry infrastructure deployment:"
        echo "   ./infra/aws/infrastructure-deployment.sh"
        ;;
        
    2)
        echo ""
        echo "⚠️  WARNING: This will delete ALL matbakh NAT Gateways!"
        read -p "Are you sure? Type 'DELETE' to confirm: " confirm
        
        if [ "$confirm" = "DELETE" ]; then
            echo "🗑️  Deleting all matbakh NAT Gateways..."
            
            all_nats=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-*" --query 'NatGateways[*].NatGatewayId' --output text)
            
            for nat_id in $all_nats; do
                echo "🗑️  Deleting NAT Gateway: $nat_id"
                aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" || echo "❌ Failed to delete $nat_id"
            done
            
            echo ""
            echo "⏳ Waiting for all NAT Gateways to be deleted..."
            for nat_id in $all_nats; do
                echo "⏳ Waiting for $nat_id to be deleted..."
                aws ec2 wait nat-gateway-deleted --nat-gateway-ids "$nat_id" --cli-read-timeout 300 || echo "⚠️  Timeout waiting for $nat_id deletion"
            done
            
            echo "✅ All NAT Gateways deleted"
        else
            echo "❌ Deletion cancelled"
        fi
        ;;
        
    3)
        echo ""
        echo "📋 Manual Commands:"
        echo "=================="
        echo ""
        echo "# Check NAT Gateway details:"
        echo "aws ec2 describe-nat-gateways --query 'NatGateways[*].{ID:NatGatewayId,State:State,FailureCode:FailureCode,FailureMessage:FailureMessage}' --output table"
        echo ""
        echo "# Delete specific failed NAT Gateway:"
        for nat_id in $failed_nats; do
            echo "aws ec2 delete-nat-gateway --nat-gateway-id $nat_id"
        done
        echo ""
        echo "# Wait for deletion:"
        for nat_id in $failed_nats; do
            echo "aws ec2 wait nat-gateway-deleted --nat-gateway-ids $nat_id"
        done
        ;;
        
    4)
        echo "👋 Exiting"
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
echo "2. If still issues, check EIP associations: ./infra/aws/cleanup-elastic-ips.sh"
echo "3. Test user migration: ./infra/aws/user-data-migration.sh"
echo ""