#!/bin/bash
set -euo pipefail

# Complete Network Architecture Analysis
# This script analyzes the entire network structure before cleanup

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}

echo "🔍 Complete Network Architecture Analysis"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo ""

# Step 1: VPC and Basic Network Info
echo "🌐 STEP 1: VPC AND BASIC NETWORK INFO"
echo "====================================="

vpc_id=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "None")

if [ "$vpc_id" != "None" ] && [ "$vpc_id" != "null" ]; then
    echo "✅ VPC Found: $vpc_id"
    
    # Get VPC CIDR
    vpc_cidr=$(aws ec2 describe-vpcs --vpc-ids "$vpc_id" --query 'Vpcs[0].CidrBlock' --output text --region $REGION --profile $PROFILE)
    echo "   CIDR Block: $vpc_cidr"
    
    # Get Internet Gateway
    igw_id=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpc_id" --query 'InternetGateways[0].InternetGatewayId' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "None")
    if [ "$igw_id" != "None" ]; then
        echo "✅ Internet Gateway: $igw_id (attached to VPC)"
    else
        echo "❌ No Internet Gateway found for VPC"
    fi
else
    echo "❌ VPC not found"
    exit 1
fi

echo ""

# Step 2: Subnet Analysis
echo "📡 STEP 2: SUBNET ANALYSIS"
echo "=========================="

# Public Subnets
echo "🌍 Public Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-public-*" \
    --query 'Subnets[*].{Name:Tags[?Key==`Name`].Value|[0],SubnetId:SubnetId,CIDR:CidrBlock,AZ:AvailabilityZone,Public:MapPublicIpOnLaunch}' \
    --output table --region $REGION --profile $PROFILE

echo ""
echo "🔒 Private Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-private-*" \
    --query 'Subnets[*].{Name:Tags[?Key==`Name`].Value|[0],SubnetId:SubnetId,CIDR:CidrBlock,AZ:AvailabilityZone,Public:MapPublicIpOnLaunch}' \
    --output table --region $REGION --profile $PROFILE

echo ""
echo "🗄️  Database Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-db-*" \
    --query 'Subnets[*].{Name:Tags[?Key==`Name`].Value|[0],SubnetId:SubnetId,CIDR:CidrBlock,AZ:AvailabilityZone,Public:MapPublicIpOnLaunch}' \
    --output table --region $REGION --profile $PROFILE

echo ""

# Step 3: NAT Gateway Analysis
echo "🌐 STEP 3: NAT GATEWAY ANALYSIS"
echo "=============================="

echo "📊 All NAT Gateways:"
aws ec2 describe-nat-gateways --filters "Name=vpc-id,Values=$vpc_id" \
    --query 'NatGateways[*].{ID:NatGatewayId,State:State,SubnetId:SubnetId,PublicIP:NatGatewayAddresses[0].PublicIp,EIP:NatGatewayAddresses[0].AllocationId,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table --region $REGION --profile $PROFILE

echo ""

# Step 4: Elastic IP Analysis
echo "📍 STEP 4: ELASTIC IP ANALYSIS"
echo "=============================="

echo "📊 All Elastic IPs:"
aws ec2 describe-addresses --filters "Name=domain,Values=vpc" \
    --query 'Addresses[*].{AllocationId:AllocationId,PublicIp:PublicIp,AssociationId:AssociationId,NetworkInterfaceId:NetworkInterfaceId,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table --region $REGION --profile $PROFILE

echo ""

# Step 5: Route Table Analysis
echo "🛣️  STEP 5: ROUTE TABLE ANALYSIS"
echo "================================"

echo "📊 All Route Tables for VPC:"
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc_id" \
    --query 'RouteTables[*].{RouteTableId:RouteTableId,Main:Associations[0].Main,Tags:Tags[?Key==`Name`].Value|[0]}' \
    --output table --region $REGION --profile $PROFILE

echo ""
echo "🔍 Detailed Route Analysis:"

# Get all route tables for the VPC
route_tables=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc_id" --query 'RouteTables[*].RouteTableId' --output text --region $REGION --profile $PROFILE)

for rt_id in $route_tables; do
    echo ""
    echo "📋 Route Table: $rt_id"
    
    # Get route table name
    rt_name=$(aws ec2 describe-route-tables --route-table-ids "$rt_id" --query 'RouteTables[0].Tags[?Key==`Name`].Value|[0]' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "Unnamed")
    echo "   Name: $rt_name"
    
    # Get routes
    echo "   Routes:"
    aws ec2 describe-route-tables --route-table-ids "$rt_id" \
        --query 'RouteTables[0].Routes[*].{Destination:DestinationCidrBlock,Target:GatewayId,NATGateway:NatGatewayId,State:State}' \
        --output table --region $REGION --profile $PROFILE
    
    # Get associations
    echo "   Subnet Associations:"
    aws ec2 describe-route-tables --route-table-ids "$rt_id" \
        --query 'RouteTables[0].Associations[*].{SubnetId:SubnetId,Main:Main}' \
        --output table --region $REGION --profile $PROFILE
done

echo ""

# Step 6: Network Interface Analysis
echo "🔌 STEP 6: NETWORK INTERFACE ANALYSIS"
echo "====================================="

echo "📊 NAT Gateway Network Interfaces:"
aws ec2 describe-network-interfaces --filters "Name=interface-type,Values=nat_gateway" "Name=vpc-id,Values=$vpc_id" \
    --query 'NetworkInterfaces[*].{NetworkInterfaceId:NetworkInterfaceId,Status:Status,SubnetId:SubnetId,PrivateIpAddress:PrivateIpAddress,PublicIp:Association.PublicIp,Description:Description}' \
    --output table --region $REGION --profile $PROFILE

echo ""

# Step 7: Communication Flow Analysis
echo "📡 STEP 7: COMMUNICATION FLOW ANALYSIS"
echo "======================================"

echo "🔍 Analyzing communication paths..."
echo ""

# Check if private subnets have routes to NAT Gateways
echo "📋 Private Subnet → NAT Gateway Routing:"
private_subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-private-*" --query 'Subnets[*].SubnetId' --output text --region $REGION --profile $PROFILE)

for subnet_id in $private_subnets; do
    subnet_name=$(aws ec2 describe-subnets --subnet-ids "$subnet_id" --query 'Subnets[0].Tags[?Key==`Name`].Value|[0]' --output text --region $REGION --profile $PROFILE)
    
    # Find route table for this subnet
    rt_id=$(aws ec2 describe-route-tables --filters "Name=association.subnet-id,Values=$subnet_id" --query 'RouteTables[0].RouteTableId' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "None")
    
    if [ "$rt_id" != "None" ]; then
        # Check for 0.0.0.0/0 route to NAT Gateway
        nat_route=$(aws ec2 describe-route-tables --route-table-ids "$rt_id" --query 'RouteTables[0].Routes[?DestinationCidrBlock==`0.0.0.0/0`].NatGatewayId' --output text --region $REGION --profile $PROFILE 2>/dev/null || echo "None")
        
        if [ "$nat_route" != "None" ] && [ "$nat_route" != "null" ]; then
            echo "✅ $subnet_name ($subnet_id) → NAT Gateway: $nat_route"
        else
            echo "❌ $subnet_name ($subnet_id) → No NAT Gateway route found"
        fi
    else
        echo "❌ $subnet_name ($subnet_id) → No route table association found"
    fi
done

echo ""

# Step 8: Summary and Recommendations
echo "📊 STEP 8: SUMMARY AND RECOMMENDATIONS"
echo "======================================"

# Count resources
nat_count=$(aws ec2 describe-nat-gateways --filters "Name=vpc-id,Values=$vpc_id" "Name=state,Values=available" --query 'length(NatGateways)' --output text --region $REGION --profile $PROFILE)
eip_count=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --query 'length(Addresses)' --output text --region $REGION --profile $PROFILE)
private_subnet_count=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-private-*" --query 'length(Subnets)' --output text --region $REGION --profile $PROFILE)

echo "📈 Resource Summary:"
echo "   Available NAT Gateways: $nat_count"
echo "   Total Elastic IPs: $eip_count"
echo "   Private Subnets: $private_subnet_count"
echo ""

echo "💡 Architecture Recommendations:"
if [ "$nat_count" -gt 2 ]; then
    echo "⚠️  You have $nat_count NAT Gateways - consider consolidating to 2 (one per AZ)"
fi

if [ "$eip_count" -ge 5 ]; then
    echo "⚠️  You're at/near the EIP limit ($eip_count/5) - cleanup recommended"
fi

echo "✅ For high availability: Use 2 NAT Gateways in different AZs"
echo "✅ For cost optimization: Use 1 NAT Gateway (single point of failure)"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Review the routing analysis above"
echo "2. Decide on NAT Gateway strategy (1 or 2 gateways)"
echo "3. Run cleanup if needed: ./complete-nat-cleanup.sh"
echo "4. Deploy fresh infrastructure: ./infra/aws/infrastructure-deployment.sh"
echo ""