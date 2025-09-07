#!/bin/bash
set -euo pipefail

# Complete NAT Gateway and EIP Cleanup
# This script removes all existing NAT Gateways and releases EIPs for fresh deployment

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}

echo "🧹 Complete NAT Gateway & EIP Cleanup"
echo "====================================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# Step 1: Delete the two active NAT Gateways
echo "🗑️  Step 1: Deleting active NAT Gateways..."

echo "Deleting NAT Gateway: nat-0c381b977a32513b3"
aws ec2 delete-nat-gateway \
    --nat-gateway-id nat-0c381b977a32513b3 \
    --region $REGION \
    --profile $PROFILE

echo "Deleting NAT Gateway: nat-0809fb67b1907c864"
aws ec2 delete-nat-gateway \
    --nat-gateway-id nat-0809fb67b1907c864 \
    --region $REGION \
    --profile $PROFILE

echo "✅ NAT Gateway deletion initiated"
echo ""

# Step 2: Wait for NAT Gateways to be deleted
echo "⏳ Step 2: Waiting for NAT Gateways to be deleted..."
echo "This may take 1-2 minutes..."

# Wait for first NAT Gateway
echo "Waiting for nat-0c381b977a32513b3 to be deleted..."
aws ec2 wait nat-gateway-deleted \
    --nat-gateway-ids nat-0c381b977a32513b3 \
    --region $REGION \
    --profile $PROFILE \
    --cli-read-timeout 300 || echo "⚠️  Timeout waiting for nat-0c381b977a32513b3"

# Wait for second NAT Gateway
echo "Waiting for nat-0809fb67b1907c864 to be deleted..."
aws ec2 wait nat-gateway-deleted \
    --nat-gateway-ids nat-0809fb67b1907c864 \
    --region $REGION \
    --profile $PROFILE \
    --cli-read-timeout 300 || echo "⚠️  Timeout waiting for nat-0809fb67b1907c864"

echo "✅ NAT Gateways deleted"
echo ""

# Step 3: Check NAT Gateway status
echo "📊 Step 3: Checking NAT Gateway status..."
aws ec2 describe-nat-gateways \
    --region $REGION \
    --query "NatGateways[*].{ID:NatGatewayId,State:State}" \
    --output table \
    --profile $PROFILE

echo ""

# Step 4: Check Network Interface status
echo "🔍 Step 4: Checking Network Interface status..."
aws ec2 describe-network-interfaces \
    --network-interface-ids eni-0e92de2dd6925e38d eni-002c769bc943720f5 \
    --region $REGION \
    --query "NetworkInterfaces[*].{ID:NetworkInterfaceId,Status:Status,Type:InterfaceType}" \
    --output table \
    --profile $PROFILE 2>/dev/null || echo "Network interfaces may already be deleted"

echo ""

# Step 5: Release the EIPs
echo "🔓 Step 5: Releasing Elastic IPs..."

echo "Releasing EIP: eipalloc-0fc993af770ee1f43 (52.29.51.82)"
aws ec2 release-address \
    --allocation-id eipalloc-0fc993af770ee1f43 \
    --region $REGION \
    --profile $PROFILE || echo "❌ Failed to release eipalloc-0fc993af770ee1f43"

echo "Releasing EIP: eipalloc-099a5c6fbbe27151f (63.177.23.19)"
aws ec2 release-address \
    --allocation-id eipalloc-099a5c6fbbe27151f \
    --region $REGION \
    --profile $PROFILE || echo "❌ Failed to release eipalloc-099a5c6fbbe27151f"

echo "✅ EIP release completed"
echo ""

# Step 6: Final status check
echo "📊 Step 6: Final EIP status check..."
aws ec2 describe-addresses \
    --region $REGION \
    --query "Addresses[*].{ID:AllocationId,PublicIp:PublicIp,Assoc:AssociationId,Tags:Tags[?Key=='Name'].Value|[0]}" \
    --output table \
    --profile $PROFILE

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Retry infrastructure deployment: ./infra/aws/infrastructure-deployment.sh"
echo "2. Check status: ./infra-check.sh"
echo "3. If successful, continue with migration: ./infra/aws/user-data-migration.sh"
echo ""