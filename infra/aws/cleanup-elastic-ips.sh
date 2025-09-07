#!/bin/bash
set -euo pipefail

# AWS Elastic IP Cleanup Utility
# This script helps manage Elastic IP addresses to avoid limits

REGION=${AWS_REGION:-eu-central-1}

echo "🔍 AWS Elastic IP Cleanup Utility"
echo "=================================="
echo "Region: $REGION"
echo ""

# Function to list all Elastic IPs
list_elastic_ips() {
    echo "📊 Current Elastic IP Addresses:"
    echo "================================="
    aws ec2 describe-addresses --query 'Addresses[*].{AllocationId:AllocationId,PublicIp:PublicIp,AssociationId:AssociationId,InstanceId:InstanceId,NetworkInterfaceId:NetworkInterfaceId,Tags:Tags[?Key==`Name`].Value|[0]}' --output table
    echo ""
    
    local total_eips=$(aws ec2 describe-addresses --query 'length(Addresses)' --output text)
    echo "📈 Total Elastic IPs: $total_eips/5 (AWS default limit)"
    echo ""
}

# Function to release unassociated Elastic IPs
cleanup_unassociated_eips() {
    echo "🧹 Finding unassociated Elastic IPs..."
    
    local unassociated_eips=$(aws ec2 describe-addresses --filters "Name=association-id,Values=" --query 'Addresses[*].AllocationId' --output text)
    
    if [ -z "$unassociated_eips" ] || [ "$unassociated_eips" = "None" ]; then
        echo "✅ No unassociated Elastic IPs found"
        return
    fi
    
    echo "⚠️  Found unassociated Elastic IPs:"
    for eip_id in $unassociated_eips; do
        local eip_info=$(aws ec2 describe-addresses --allocation-ids "$eip_id" --query 'Addresses[0].{IP:PublicIp,Tags:Tags[?Key==`Name`].Value|[0]}' --output text)
        echo "  - $eip_id ($eip_info)"
    done
    echo ""
    
    read -p "Release all unassociated Elastic IPs? (y/n): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        for eip_id in $unassociated_eips; do
            echo "🗑️  Releasing $eip_id..."
            aws ec2 release-address --allocation-id "$eip_id" || echo "❌ Failed to release $eip_id"
        done
        echo "✅ Cleanup completed"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Function to show NAT Gateway EIPs
show_nat_gateway_eips() {
    echo "🌐 NAT Gateway Elastic IPs:"
    echo "=========================="
    
    local nat_gateways=$(aws ec2 describe-nat-gateways --filters "Name=tag:Name,Values=matbakh-nat-*" --query 'NatGateways[*].{ID:NatGatewayId,State:State,EIP:NatGatewayAddresses[0].AllocationId,PublicIP:NatGatewayAddresses[0].PublicIp,Tags:Tags[?Key==`Name`].Value|[0]}' --output table)
    
    if [ -n "$nat_gateways" ]; then
        echo "$nat_gateways"
    else
        echo "❌ No matbakh NAT Gateways found"
    fi
    echo ""
}

# Function to request EIP limit increase
request_limit_increase() {
    echo "📈 Request Elastic IP Limit Increase"
    echo "===================================="
    echo ""
    echo "To request a limit increase:"
    echo "1. Go to AWS Service Quotas Console:"
    echo "   https://console.aws.amazon.com/servicequotas/home/services/ec2/quotas"
    echo ""
    echo "2. Search for 'EC2-VPC Elastic IPs'"
    echo "3. Click 'Request quota increase'"
    echo "4. Set new limit (recommended: 10-20)"
    echo "5. Provide justification: 'Infrastructure deployment for production application'"
    echo ""
    echo "⏱️  Approval typically takes 1-2 business days"
    echo ""
}

# Main menu
echo "Choose an action:"
echo "1) List all Elastic IPs"
echo "2) Cleanup unassociated Elastic IPs"
echo "3) Show NAT Gateway EIPs"
echo "4) Request limit increase info"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        list_elastic_ips
        ;;
    2)
        list_elastic_ips
        cleanup_unassociated_eips
        echo ""
        list_elastic_ips
        ;;
    3)
        show_nat_gateway_eips
        ;;
    4)
        request_limit_increase
        ;;
    5)
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
echo "1. If EIPs were cleaned up, retry: ./infra/aws/infrastructure-deployment.sh"
echo "2. If still hitting limits, request quota increase (option 4)"
echo "3. Alternative: Use fewer NAT Gateways (single AZ deployment)"
echo ""