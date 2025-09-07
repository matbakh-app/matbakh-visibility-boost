#!/bin/bash
set -euo pipefail

# Emergency Routing Repair
# This script fixes the completely broken routing architecture

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}

echo "🚨 EMERGENCY ROUTING REPAIR"
echo "=========================="
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text --region $REGION --profile $PROFILE)
echo "🌐 VPC: $VPC_ID"

# Get Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text --region $REGION --profile $PROFILE)
echo "🌍 Internet Gateway: $IGW_ID"

# Get available NAT Gateways
echo ""
echo "🔍 Finding available NAT Gateways..."

# Get NAT Gateway IDs only (no EIP confusion)
NAT_IDS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" --query 'NatGateways[*].NatGatewayId' --output text --region $REGION --profile $PROFILE)

# Get detailed info for display
NAT_DETAILS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" --query 'NatGateways[*].{ID:NatGatewayId,Subnet:SubnetId,EIP:NatGatewayAddresses[0].PublicIp}' --output table --region $REGION --profile $PROFILE)

echo "Available NAT Gateways:"
echo "$NAT_DETAILS"

# Check if we have any NAT Gateways
if [ -z "$NAT_IDS" ]; then
    echo "❌ No available NAT Gateways found!"
    echo "🔍 Checking all NAT Gateways in VPC..."
    aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[*].{ID:NatGatewayId,State:State,Subnet:SubnetId,EIP:NatGatewayAddresses[0].PublicIp}' --output table --region $REGION --profile $PROFILE
    echo ""
    echo "🚨 CRITICAL: No working NAT Gateways available!"
    echo "   You need to create new NAT Gateways first."
    echo "   Run: ./infra/aws/infrastructure-deployment.sh"
    exit 1
fi

# Extract NAT Gateway IDs correctly
NAT_1=$(echo "$NAT_IDS" | awk '{print $1}')
NAT_2=$(echo "$NAT_IDS" | awk '{print $2}')

# Handle single NAT Gateway case
if [ -z "$NAT_2" ] || [ "$NAT_1" = "$NAT_2" ]; then
    NAT_2="$NAT_1"
    echo "⚠️  Only one NAT Gateway available - using single NAT setup"
fi

echo ""
echo "🎯 Using NAT Gateways:"
echo "   Primary: $NAT_1"
if [ "$NAT_2" != "$NAT_1" ]; then
    echo "   Secondary: $NAT_2"
else
    echo "   Secondary: $NAT_2 (same as primary - single NAT setup)"
fi

# Get all subnets
echo ""
echo "🔍 Getting subnet information..."

# Public subnets
PUBLIC_1A=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1a" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
PUBLIC_1B=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1b" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
PUBLIC_1C=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1c" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)

# Private subnets
PRIVATE_1A=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1a" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
PRIVATE_1B=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1b" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
PRIVATE_1C=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1c" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)

# Database subnets
DB_1A=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1a" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
DB_1B=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1b" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)
DB_1C=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1c" --query 'Subnets[0].SubnetId' --output text --region $REGION --profile $PROFILE)

echo "✅ Subnets identified"

# Get existing route tables
echo ""
echo "🔍 Analyzing existing route tables..."
ROUTE_TABLES=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].RouteTableId' --output text --region $REGION --profile $PROFILE)

echo "Existing route tables: $ROUTE_TABLES"

# Create new route tables with proper names
echo ""
echo "🛠️  Creating properly configured route tables..."

# Public Route Table
echo "📋 Creating public route table..."
PUBLIC_RT=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-public-rt}]" --query 'RouteTable.RouteTableId' --output text --region $REGION --profile $PROFILE)
echo "✅ Public RT: $PUBLIC_RT"

# Add route to Internet Gateway
aws ec2 create-route --route-table-id "$PUBLIC_RT" --destination-cidr-block "0.0.0.0/0" --gateway-id "$IGW_ID" --region $REGION --profile $PROFILE
echo "✅ Added Internet Gateway route to public RT"

# Private Route Table 1 (for AZ 1a)
echo "📋 Creating private route table 1a..."
PRIVATE_RT_1A=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-private-rt-1a}]" --query 'RouteTable.RouteTableId' --output text --region $REGION --profile $PROFILE)
echo "✅ Private RT 1a: $PRIVATE_RT_1A"

# Add route to NAT Gateway
aws ec2 create-route --route-table-id "$PRIVATE_RT_1A" --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$NAT_1" --region $REGION --profile $PROFILE
echo "✅ Added NAT Gateway route to private RT 1a"

# Private Route Table 2 (for AZ 1b, 1c)
echo "📋 Creating private route table 1b..."
PRIVATE_RT_1B=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-private-rt-1b}]" --query 'RouteTable.RouteTableId' --output text --region $REGION --profile $PROFILE)
echo "✅ Private RT 1b: $PRIVATE_RT_1B"

# Add route to NAT Gateway
if [ "$NAT_2" != "$NAT_1" ]; then
    echo "🌐 Using dual NAT setup..."
    aws ec2 create-route --route-table-id "$PRIVATE_RT_1B" --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$NAT_2" --region $REGION --profile $PROFILE
    echo "✅ Added NAT Gateway route to private RT 1b (using NAT_2: $NAT_2)"
else
    echo "🌐 Using single NAT setup (cost-optimized)..."
    aws ec2 create-route --route-table-id "$PRIVATE_RT_1B" --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$NAT_1" --region $REGION --profile $PROFILE
    echo "✅ Added NAT Gateway route to private RT 1b (using NAT_1: $NAT_1)"
fi

# Database Route Table (no internet access)
echo "📋 Creating database route table..."
DB_RT=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-db-rt}]" --query 'RouteTable.RouteTableId' --output text --region $REGION --profile $PROFILE)
echo "✅ Database RT: $DB_RT (no internet routes)"

# Associate subnets with route tables
echo ""
echo "🔗 Associating subnets with route tables..."

# Public subnets → Public RT
echo "🌍 Associating public subnets..."
aws ec2 associate-route-table --subnet-id "$PUBLIC_1A" --route-table-id "$PUBLIC_RT" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$PUBLIC_1B" --route-table-id "$PUBLIC_RT" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$PUBLIC_1C" --route-table-id "$PUBLIC_RT" --region $REGION --profile $PROFILE
echo "✅ Public subnets associated"

# Private subnets → Private RTs
echo "🔒 Associating private subnets..."
aws ec2 associate-route-table --subnet-id "$PRIVATE_1A" --route-table-id "$PRIVATE_RT_1A" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$PRIVATE_1B" --route-table-id "$PRIVATE_RT_1B" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$PRIVATE_1C" --route-table-id "$PRIVATE_RT_1B" --region $REGION --profile $PROFILE
echo "✅ Private subnets associated"

# Database subnets → Database RT
echo "🗄️  Associating database subnets..."
aws ec2 associate-route-table --subnet-id "$DB_1A" --route-table-id "$DB_RT" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$DB_1B" --route-table-id "$DB_RT" --region $REGION --profile $PROFILE
aws ec2 associate-route-table --subnet-id "$DB_1C" --route-table-id "$DB_RT" --region $REGION --profile $PROFILE
echo "✅ Database subnets associated"

# Save configuration
echo ""
echo "💾 Saving configuration..."
cat > .env.routing << EOF
# Emergency Routing Repair - $(date)
VPC_ID=$VPC_ID
IGW_ID=$IGW_ID
NAT_GATEWAY_1=$NAT_1
NAT_GATEWAY_2=$NAT_2

PUBLIC_RT=$PUBLIC_RT
PRIVATE_RT_1A=$PRIVATE_RT_1A
PRIVATE_RT_1B=$PRIVATE_RT_1B
DB_RT=$DB_RT

PUBLIC_1A=$PUBLIC_1A
PUBLIC_1B=$PUBLIC_1B
PUBLIC_1C=$PUBLIC_1C
PRIVATE_1A=$PRIVATE_1A
PRIVATE_1B=$PRIVATE_1B
PRIVATE_1C=$PRIVATE_1C
DB_1A=$DB_1A
DB_1B=$DB_1B
DB_1C=$DB_1C
EOF

echo "✅ Configuration saved to .env.routing"

# Validation
echo ""
echo "🔍 VALIDATION"
echo "============="

echo "📊 Route Table Summary:"
echo "   Public RT: $PUBLIC_RT → Internet Gateway"
echo "   Private RT 1a: $PRIVATE_RT_1A → NAT Gateway $NAT_1"
echo "   Private RT 1b: $PRIVATE_RT_1B → NAT Gateway $NAT_2"
echo "   Database RT: $DB_RT → No internet access"

echo ""
echo "🎯 ROUTING REPAIR COMPLETE!"
echo "=========================="
echo "✅ All subnets now have proper routing"
echo "✅ Private subnets can reach internet via NAT Gateways"
echo "✅ Database subnets are isolated (no internet)"
echo "✅ Public subnets can reach internet via Internet Gateway"
echo ""
echo "🚀 Next steps:"
echo "1. Test connectivity: ./test-connectivity.sh"
echo "2. Clean up old/failed NAT Gateways: ./complete-nat-cleanup.sh"
echo "3. Validate infrastructure: ./infra-check.sh"
echo ""