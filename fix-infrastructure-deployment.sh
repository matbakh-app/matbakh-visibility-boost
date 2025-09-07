#!/bin/bash
set -euo pipefail

# Fix Infrastructure Deployment Script
# This script fixes the EIP reuse logic that causes conflicts

echo "🔧 Fixing Infrastructure Deployment Script"
echo "=========================================="

# Create backup of original script
cp infra/aws/infrastructure-deployment.sh infra/aws/infrastructure-deployment.sh.backup
echo "✅ Created backup: infrastructure-deployment.sh.backup"

# Create improved NAT Gateway creation function
cat > temp_nat_function.sh << 'EOF'
# Create NAT Gateways with improved EIP handling
create_nat_gateways() {
    local vpc_id=$1
    echo "🌐 Creating NAT Gateways..."
    
    # Get public subnet IDs
    local public_1a_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1a" --query 'Subnets[0].SubnetId' --output text)
    local public_1b_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1b" --query 'Subnets[0].SubnetId' --output text)
    
    echo "🔍 Checking for available Elastic IPs..."
    
    # Check if EIPs with our tags exist and are available (not associated)
    local eip_1a_available=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1a" --query 'Addresses[?AssociationId==null].AllocationId' --output text 2>/dev/null)
    local eip_1b_available=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1b" --query 'Addresses[?AssociationId==null].AllocationId' --output text 2>/dev/null)
    
    # Create or get EIP 1a
    if [ -z "$eip_1a_available" ] || [ "$eip_1a_available" = "None" ] || [ "$eip_1a_available" = "null" ]; then
        echo "📍 Creating new Elastic IP for NAT Gateway 1a..."
        local eip_1a=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
        aws ec2 create-tags --resources "$eip_1a" --tags Key=Name,Value=matbakh-nat-eip-1a Key=Purpose,Value=NAT-Gateway
        echo "✅ Created EIP 1a: $eip_1a"
    else
        local eip_1a="$eip_1a_available"
        echo "♻️  Using available EIP 1a: $eip_1a"
    fi
    
    # Create or get EIP 1b
    if [ -z "$eip_1b_available" ] || [ "$eip_1b_available" = "None" ] || [ "$eip_1b_available" = "null" ]; then
        echo "📍 Creating new Elastic IP for NAT Gateway 1b..."
        local eip_1b=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
        aws ec2 create-tags --resources "$eip_1b" --tags Key=Name,Value=matbakh-nat-eip-1b Key=Purpose,Value=NAT-Gateway
        echo "✅ Created EIP 1b: $eip_1b"
    else
        local eip_1b="$eip_1b_available"
        echo "♻️  Using available EIP 1b: $eip_1b"
    fi
    
    # Verify EIPs are not associated before creating NAT Gateways
    echo "🔍 Verifying EIP availability..."
    local eip_1a_status=$(aws ec2 describe-addresses --allocation-ids "$eip_1a" --query 'Addresses[0].AssociationId' --output text)
    local eip_1b_status=$(aws ec2 describe-addresses --allocation-ids "$eip_1b" --query 'Addresses[0].AssociationId' --output text)
    
    if [ "$eip_1a_status" != "None" ] && [ "$eip_1a_status" != "null" ]; then
        echo "❌ EIP $eip_1a is already associated with: $eip_1a_status"
        echo "   Please run cleanup first: ./complete-nat-cleanup.sh"
        exit 1
    fi
    
    if [ "$eip_1b_status" != "None" ] && [ "$eip_1b_status" != "null" ]; then
        echo "❌ EIP $eip_1b is already associated with: $eip_1b_status"
        echo "   Please run cleanup first: ./complete-nat-cleanup.sh"
        exit 1
    fi
    
    echo "✅ Both EIPs are available for use"
    
    # Create NAT Gateways
    echo "🚀 Creating NAT Gateways..."
    local nat_1a=$(aws ec2 create-nat-gateway --subnet-id "$public_1a_id" --allocation-id "$eip_1a" --query 'NatGateway.NatGatewayId' --output text)
    local nat_1b=$(aws ec2 create-nat-gateway --subnet-id "$public_1b_id" --allocation-id "$eip_1b" --query 'NatGateway.NatGatewayId' --output text)
    
    # Add tags
    aws ec2 create-tags --resources "$nat_1a" --tags Key=Name,Value=matbakh-nat-1a Key=AZ,Value=eu-central-1a
    aws ec2 create-tags --resources "$nat_1b" --tags Key=Name,Value=matbakh-nat-1b Key=AZ,Value=eu-central-1b
    
    echo "✅ NAT Gateway 1a: $nat_1a (EIP: $eip_1a)"
    echo "✅ NAT Gateway 1b: $nat_1b (EIP: $eip_1b)"
    
    # Save to environment file
    echo "NAT_GATEWAY_1A_ID=$nat_1a" >> .env.infrastructure
    echo "NAT_GATEWAY_1B_ID=$nat_1b" >> .env.infrastructure
    echo "EIP_1A_ID=$eip_1a" >> .env.infrastructure
    echo "EIP_1B_ID=$eip_1b" >> .env.infrastructure
    
    # Wait for NAT Gateways to be available
    echo "⏳ Waiting for NAT Gateways to be available..."
    
    for nat_id in "$nat_1a" "$nat_1b"; do
        echo "⏳ Waiting for NAT Gateway $nat_id..."
        
        if ! aws ec2 wait nat-gateway-available --nat-gateway-ids "$nat_id" --cli-read-timeout 300; then
            echo "❌ NAT Gateway $nat_id failed to become available"
            
            # Check failure reason
            local failure_reason=$(aws ec2 describe-nat-gateways --nat-gateway-ids "$nat_id" --query 'NatGateways[0].FailureMessage' --output text)
            echo "   Failure reason: $failure_reason"
            exit 1
        fi
        
        echo "✅ NAT Gateway $nat_id is now available"
    done
    
    echo "🎉 All NAT Gateways are ready!"
}
EOF

echo "✅ Created improved NAT Gateway function"

# Replace the function in the main script
echo "🔄 Updating infrastructure-deployment.sh..."

# Find the start and end of the create_nat_gateways function
start_line=$(grep -n "^create_nat_gateways()" infra/aws/infrastructure-deployment.sh | cut -d: -f1)
end_line=$(grep -n "^}" infra/aws/infrastructure-deployment.sh | awk -v start="$start_line" '$1 > start {print $1; exit}')

if [ -n "$start_line" ] && [ -n "$end_line" ]; then
    # Create new script with improved function
    head -n $((start_line - 1)) infra/aws/infrastructure-deployment.sh > temp_script.sh
    cat temp_nat_function.sh >> temp_script.sh
    tail -n +$((end_line + 1)) infra/aws/infrastructure-deployment.sh >> temp_script.sh
    
    # Replace original script
    mv temp_script.sh infra/aws/infrastructure-deployment.sh
    chmod +x infra/aws/infrastructure-deployment.sh
    
    echo "✅ Successfully updated infrastructure-deployment.sh"
else
    echo "❌ Could not find create_nat_gateways function boundaries"
    echo "   Manual update required"
fi

# Cleanup
rm -f temp_nat_function.sh

echo ""
echo "🎯 What was fixed:"
echo "=================="
echo "✅ EIP availability check before reuse"
echo "✅ Proper association status verification"
echo "✅ Clear error messages for conflicts"
echo "✅ Better tagging for resource tracking"
echo "✅ Improved error handling and timeouts"
echo ""
echo "🚀 Next steps:"
echo "=============="
echo "1. Run network analysis: ./analyze-network-architecture.sh"
echo "2. Clean up existing resources: ./complete-nat-cleanup.sh"
echo "3. Deploy with fixed script: ./infra/aws/infrastructure-deployment.sh"
echo ""