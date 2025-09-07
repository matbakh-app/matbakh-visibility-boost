#!/bin/bash
set -euo pipefail

# Cleanup Partial Routing Setup
# This script cleans up the partially created route tables from the failed run

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}

echo "🧹 CLEANUP PARTIAL ROUTING SETUP"
echo "================================"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text --region $REGION --profile $PROFILE)
echo "🌐 VPC: $VPC_ID"

# Find route tables created by the failed script
echo ""
echo "🔍 Finding route tables created by emergency script..."

# Look for route tables with our naming pattern
EMERGENCY_RTS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=matbakh-*-rt*" --query 'RouteTables[*].{ID:RouteTableId,Name:Tags[?Key==`Name`].Value|[0]}' --output text --region $REGION --profile $PROFILE)

if [ -n "$EMERGENCY_RTS" ]; then
    echo "📋 Found emergency route tables:"
    echo "$EMERGENCY_RTS"
    echo ""
    
    # Extract route table IDs
    RT_IDS=$(echo "$EMERGENCY_RTS" | awk '{print $1}')
    
    echo "🗑️  Deleting emergency route tables..."
    for rt_id in $RT_IDS; do
        rt_name=$(aws ec2 describe-route-tables --route-table-ids "$rt_id" --query 'RouteTables[0].Tags[?Key==`Name`].Value|[0]' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "Unnamed")
        
        echo "   Deleting: $rt_id ($rt_name)"
        
        # First, disassociate any subnets
        associations=$(aws ec2 describe-route-tables --route-table-ids "$rt_id" --query 'RouteTables[0].Associations[?!Main].AssociationId' --output text --region $REGION --profile $PROFILE)
        
        if [ -n "$associations" ]; then
            for assoc_id in $associations; do
                echo "     Disassociating: $assoc_id"
                aws ec2 disassociate-route-table --association-id "$assoc_id" --region $REGION --profile $PROFILE
            done
        fi
        
        # Delete the route table
        aws ec2 delete-route-table --route-table-id "$rt_id" --region $REGION --profile $PROFILE
        echo "     ✅ Deleted: $rt_id"
    done
    
    echo ""
    echo "✅ Cleanup complete!"
else
    echo "ℹ️  No emergency route tables found to clean up"
fi

echo ""
echo "🎯 Next steps:"
echo "=============="
echo "1. Run the fixed emergency script: ./emergency-routing-repair.sh"
echo "2. Test connectivity: ./test-connectivity.sh"
echo ""