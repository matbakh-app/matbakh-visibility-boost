#!/bin/bash
set -euo pipefail

# NAT Gateway Strategy Optimizer
# This script helps decide between single vs dual NAT Gateway setup

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}

echo "🎯 NAT Gateway Strategy Optimizer"
echo "================================"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

echo "📊 Current Infrastructure Analysis:"
echo "=================================="

# Get current costs and setup
nat_count=$(aws ec2 describe-nat-gateways --filters "Name=state,Values=available" --query 'length(NatGateways)' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "0")
eip_count=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --query 'length(Addresses)' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "0")

echo "Current NAT Gateways: $nat_count"
echo "Current Elastic IPs: $eip_count"
echo ""

echo "💰 Cost Analysis:"
echo "================="
echo "NAT Gateway costs (eu-central-1):"
echo "  - Per NAT Gateway: ~$32/month (24/7 uptime)"
echo "  - Data processing: $0.045/GB"
echo "  - Current setup cost: ~$$(($nat_count * 32))/month"
echo ""
echo "Elastic IP costs:"
echo "  - Associated EIP: Free"
echo "  - Unassociated EIP: $0.005/hour = ~$3.60/month"
echo ""

echo "🏗️  Strategy Options:"
echo "===================="
echo ""
echo "Option 1: Single NAT Gateway (Cost Optimized)"
echo "✅ Pros:"
echo "   - Lower cost: ~$32/month"
echo "   - Simpler management"
echo "   - Sufficient for development/staging"
echo "❌ Cons:"
echo "   - Single point of failure"
echo "   - No cross-AZ redundancy"
echo ""
echo "Option 2: Dual NAT Gateway (High Availability)"
echo "✅ Pros:"
echo "   - High availability across AZs"
echo "   - Production-ready"
echo "   - Better fault tolerance"
echo "❌ Cons:"
echo "   - Higher cost: ~$64/month"
echo "   - More complex routing"
echo ""

echo "🤔 Recommendation for matbakh.app:"
echo "=================================="
echo "Based on your use case (production app with 2,500 users):"
echo "✅ RECOMMENDED: Dual NAT Gateway setup"
echo "   - Ensures high availability for user authentication"
echo "   - Protects against AZ failures"
echo "   - Cost is justified for production workload"
echo ""

read -p "Choose strategy (1=Single NAT, 2=Dual NAT, 3=Keep current): " strategy

case $strategy in
    1)
        echo ""
        echo "🎯 Selected: Single NAT Gateway Strategy"
        echo "======================================="
        echo "Configuration:"
        echo "  - 1 NAT Gateway in eu-central-1a"
        echo "  - 1 Elastic IP"
        echo "  - All private subnets route through this NAT"
        echo ""
        echo "⚠️  Warning: This creates a single point of failure!"
        echo ""
        
        # Update infrastructure deployment script for single NAT
        echo "📝 Would you like to update infrastructure-deployment.sh for single NAT? (y/n)"
        read -p "Update deployment script? " update_script
        
        if [[ $update_script =~ ^[Yy]$ ]]; then
            echo "✏️  Updating infrastructure-deployment.sh for single NAT strategy..."
            # This would modify the script to create only one NAT Gateway
            echo "   (Script modification would happen here)"
        fi
        ;;
        
    2)
        echo ""
        echo "🎯 Selected: Dual NAT Gateway Strategy"
        echo "===================================="
        echo "Configuration:"
        echo "  - NAT Gateway 1: eu-central-1a (for private subnets 1a)"
        echo "  - NAT Gateway 2: eu-central-1b (for private subnets 1b, 1c)"
        echo "  - 2 Elastic IPs"
        echo "  - Cross-AZ redundancy"
        echo ""
        echo "✅ This is the current configuration in infrastructure-deployment.sh"
        ;;
        
    3)
        echo ""
        echo "🎯 Selected: Keep Current Setup"
        echo "=============================="
        echo "No changes will be made to the NAT Gateway strategy."
        echo "Current setup will be maintained."
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Run network analysis: ./analyze-network-architecture.sh"
echo "2. Clean up existing NAT Gateways: ./complete-nat-cleanup.sh"
echo "3. Deploy fresh infrastructure: ./infra/aws/infrastructure-deployment.sh"
echo "4. Validate setup: ./infra-check.sh"
echo ""