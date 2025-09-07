#!/bin/bash
set -euo pipefail

# Emergency Fix: Disassociate EIPs from old NAT Gateways
# This script manually fixes the "EIP already associated" problem

REGION=${AWS_REGION:-eu-central-1}

echo "🚨 Emergency EIP Disassociation Fix"
echo "==================================="
echo "Region: $REGION"
echo ""

# Step 1: Show current EIP associations
echo "📍 Current EIP Associations:"
aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-*" \
    --query 'Addresses[*].{AllocationId:AllocationId,PublicIp:PublicIp,AssociationId:AssociationId,NetworkInterfaceId:NetworkInterfaceId,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table

echo ""

# Step 2: Get association IDs for matbakh EIPs
echo "🔍 Finding associations to disassociate..."

eip_1a_assoc=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1a" --query 'Addresses[0].AssociationId' --output text 2>/dev/null || echo "None")
eip_1b_assoc=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1b" --query 'Addresses[0].AssociationId' --output text 2>/dev/null || echo "None")

echo "EIP 1a Association: $eip_1a_assoc"
echo "EIP 1b Association: $eip_1b_assoc"
echo ""

# Step 3: Disassociate EIPs
associations_to_remove=()

if [ "$eip_1a_assoc" != "None" ] && [ "$eip_1a_assoc" != "null" ] && [ -n "$eip_1a_assoc" ]; then
    associations_to_remove+=("$eip_1a_assoc")
fi

if [ "$eip_1b_assoc" != "None" ] && [ "$eip_1b_assoc" != "null" ] && [ -n "$eip_1b_assoc" ]; then
    associations_to_remove+=("$eip_1b_assoc")
fi

if [ ${#associations_to_remove[@]} -eq 0 ]; then
    echo "✅ No EIP associations found to remove"
    echo "   The EIPs are already disassociated"
else
    echo "⚠️  Found ${#associations_to_remove[@]} EIP associations to remove"
    echo ""
    
    read -p "Disassociate these EIPs? This will break existing NAT Gateways temporarily (y/n): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        for assoc_id in "${associations_to_remove[@]}"; do
            echo "🔓 Disassociating: $assoc_id"
            aws ec2 disassociate-address --association-id "$assoc_id" || echo "❌ Failed to disassociate $assoc_id"
        done
        
        echo ""
        echo "✅ EIP disassociation completed"
    else
        echo "❌ Disassociation cancelled"
        exit 1
    fi
fi

echo ""
echo "📍 EIP Status After Disassociation:"
aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-*" \
    --query 'Addresses[*].{AllocationId:AllocationId,PublicIp:PublicIp,AssociationId:AssociationId,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Retry infrastructure deployment: ./infra/aws/infrastructure-deployment.sh"
echo "2. Check status: ./infra-check.sh"
echo "3. If still issues, run complete cleanup: ./infra/aws/cleanup-orphaned-resources.sh"
echo ""