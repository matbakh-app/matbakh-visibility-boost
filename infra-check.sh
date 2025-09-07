#!/bin/bash
set -euo pipefail

# AWS Infrastructure Health Check for matbakh.app
# Comprehensive status check for all AWS resources

REGION=${AWS_REGION:-eu-central-1}
PROJECT_NAME="matbakh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status symbols
SUCCESS="✅"
WARNING="⚠️ "
FAILURE="❌"
INFO="ℹ️ "

echo -e "${BLUE}🔍 AWS Infrastructure Health Check - matbakh.app${NC}"
echo "=================================================="
echo "Region: $REGION"
echo "Project: $PROJECT_NAME"
echo ""

# Function to check if resource exists and return status
check_resource() {
    local resource_type=$1
    local identifier=$2
    local query=$3
    
    local result=$(aws $resource_type $query 2>/dev/null || echo "")
    
    if [ -n "$result" ] && [ "$result" != "None" ] && [ "$result" != "null" ]; then
        echo "$result"
    else
        echo ""
    fi
}

# Function to print status line
print_status() {
    local status=$1
    local resource=$2
    local details=$3
    
    case $status in
        "success")
            echo -e "${GREEN}${SUCCESS} ${resource}${NC} ${details}"
            ;;
        "warning")
            echo -e "${YELLOW}${WARNING} ${resource}${NC} ${details}"
            ;;
        "failure")
            echo -e "${RED}${FAILURE} ${resource}${NC} ${details}"
            ;;
        "info")
            echo -e "${BLUE}${INFO} ${resource}${NC} ${details}"
            ;;
    esac
}

# Initialize counters
total_checks=0
passed_checks=0
warning_checks=0
failed_checks=0

# Function to update counters
update_counter() {
    local status=$1
    total_checks=$((total_checks + 1))
    
    case $status in
        "success") passed_checks=$((passed_checks + 1)) ;;
        "warning") warning_checks=$((warning_checks + 1)) ;;
        "failure") failed_checks=$((failed_checks + 1)) ;;
    esac
}

echo "🌐 NETWORKING INFRASTRUCTURE"
echo "============================"

# 1. Check VPC
vpc_id=$(check_resource "ec2" "matbakh-vpc" "describe-vpcs --filters 'Name=tag:Name,Values=matbakh-vpc' --query 'Vpcs[0].VpcId' --output text")
if [ -n "$vpc_id" ]; then
    vpc_cidr=$(aws ec2 describe-vpcs --vpc-ids "$vpc_id" --query 'Vpcs[0].CidrBlock' --output text)
    print_status "success" "VPC" "($vpc_id) CIDR: $vpc_cidr"
    update_counter "success"
else
    print_status "failure" "VPC" "matbakh-vpc not found"
    update_counter "failure"
fi

# 2. Check Internet Gateway
if [ -n "$vpc_id" ]; then
    igw_id=$(check_resource "ec2" "matbakh-igw" "describe-internet-gateways --filters 'Name=tag:Name,Values=matbakh-igw' --query 'InternetGateways[0].InternetGatewayId' --output text")
    if [ -n "$igw_id" ]; then
        igw_attachment=$(aws ec2 describe-internet-gateways --internet-gateway-ids "$igw_id" --query 'InternetGateways[0].Attachments[0].VpcId' --output text 2>/dev/null || echo "")
        if [ "$igw_attachment" = "$vpc_id" ]; then
            print_status "success" "Internet Gateway" "($igw_id) attached to VPC"
            update_counter "success"
        else
            print_status "warning" "Internet Gateway" "($igw_id) not attached to correct VPC"
            update_counter "warning"
        fi
    else
        print_status "failure" "Internet Gateway" "matbakh-igw not found"
        update_counter "failure"
    fi
fi

# 3. Check Subnets
if [ -n "$vpc_id" ]; then
    echo ""
    echo "📡 SUBNETS"
    echo "----------"
    
    # Public Subnets
    public_subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-public-*" --query 'Subnets[*].{ID:SubnetId,Name:Tags[?Key==`Name`].Value|[0],CIDR:CidrBlock,AZ:AvailabilityZone}' --output text 2>/dev/null || echo "")
    if [ -n "$public_subnets" ]; then
        public_count=$(echo "$public_subnets" | wc -l)
        print_status "success" "Public Subnets" "($public_count found)"
        update_counter "success"
    else
        print_status "failure" "Public Subnets" "No matbakh-public-* subnets found"
        update_counter "failure"
    fi
    
    # Private Subnets
    private_subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-private-*" --query 'Subnets[*].{ID:SubnetId,Name:Tags[?Key==`Name`].Value|[0],CIDR:CidrBlock,AZ:AvailabilityZone}' --output text 2>/dev/null || echo "")
    if [ -n "$private_subnets" ]; then
        private_count=$(echo "$private_subnets" | wc -l)
        print_status "success" "Private Subnets" "($private_count found)"
        update_counter "success"
    else
        print_status "failure" "Private Subnets" "No matbakh-private-* subnets found"
        update_counter "failure"
    fi
    
    # Database Subnets
    db_subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-db-*" --query 'Subnets[*].{ID:SubnetId,Name:Tags[?Key==`Name`].Value|[0],CIDR:CidrBlock,AZ:AvailabilityZone}' --output text 2>/dev/null || echo "")
    if [ -n "$db_subnets" ]; then
        db_count=$(echo "$db_subnets" | wc -l)
        print_status "success" "Database Subnets" "($db_count found)"
        update_counter "success"
    else
        print_status "failure" "Database Subnets" "No matbakh-db-* subnets found"
        update_counter "failure"
    fi
fi

# 4. Check NAT Gateways
echo ""
echo "🌐 NAT GATEWAYS"
echo "---------------"

nat_gateways=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-*" --query 'NatGateways[*].{ID:NatGatewayId,State:State,PublicIP:NatGatewayAddresses[0].PublicIp,Tags:Tags[?Key==`Name`].Value|[0]}' --output text 2>/dev/null || echo "")
if [ -n "$nat_gateways" ]; then
    nat_count=$(echo "$nat_gateways" | wc -l)
    failed_nats=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-*" "Name=state,Values=failed" --query 'NatGateways[*].NatGatewayId' --output text 2>/dev/null || echo "")
    available_nats=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-*" "Name=state,Values=available" --query 'NatGateways[*].NatGatewayId' --output text 2>/dev/null || echo "")
    
    if [ -n "$failed_nats" ]; then
        failed_count=$(echo "$failed_nats" | wc -l)
        print_status "failure" "NAT Gateways" "($nat_count total, $failed_count failed) - Run: ./infra/aws/fix-failed-nat-gateways.sh"
        update_counter "failure"
    elif [ -n "$available_nats" ]; then
        available_count=$(echo "$available_nats" | wc -l)
        print_status "success" "NAT Gateways" "($available_count available)"
        update_counter "success"
    else
        print_status "warning" "NAT Gateways" "($nat_count found, unknown state)"
        update_counter "warning"
    fi
else
    print_status "failure" "NAT Gateways" "No matbakh-nat-* gateways found"
    update_counter "failure"
fi

# 5. Check Elastic IPs
echo ""
echo "📍 ELASTIC IPS"
echo "--------------"

elastic_ips=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-*" --query 'Addresses[*].{ID:AllocationId,IP:PublicIp,Associated:AssociationId,Tags:Tags[?Key==`Name`].Value|[0]}' --output text 2>/dev/null || echo "")
if [ -n "$elastic_ips" ]; then
    eip_count=$(echo "$elastic_ips" | wc -l)
    unassociated_eips=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-*" "Name=association-id,Values=" --query 'Addresses[*].AllocationId' --output text 2>/dev/null || echo "")
    
    if [ -n "$unassociated_eips" ]; then
        unassoc_count=$(echo "$unassociated_eips" | wc -l)
        print_status "warning" "Elastic IPs" "($eip_count total, $unassoc_count unassociated) - Run: ./infra/aws/cleanup-elastic-ips.sh"
        update_counter "warning"
    else
        print_status "success" "Elastic IPs" "($eip_count found, all associated)"
        update_counter "success"
    fi
else
    print_status "failure" "Elastic IPs" "No matbakh-nat-eip-* addresses found"
    update_counter "failure"
fi

# 6. Check Route Tables
echo ""
echo "🛣️  ROUTE TABLES"
echo "----------------"

if [ -n "$vpc_id" ]; then
    route_tables=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc_id" "Name=tag:Name,Values=matbakh-*" --query 'RouteTables[*].{ID:RouteTableId,Tags:Tags[?Key==`Name`].Value|[0]}' --output text 2>/dev/null || echo "")
    if [ -n "$route_tables" ]; then
        rt_count=$(echo "$route_tables" | wc -l)
        print_status "success" "Route Tables" "($rt_count matbakh route tables found)"
        update_counter "success"
    else
        print_status "failure" "Route Tables" "No matbakh-* route tables found"
        update_counter "failure"
    fi
fi

echo ""
echo "🔐 APPLICATION SERVICES"
echo "======================="

# 7. Check Cognito User Pool
cognito_pools=$(aws cognito-idp list-user-pools --max-items 50 --query 'UserPools[?contains(Name, `matbakh`) || contains(Name, `Matbakh`)].{ID:Id,Name:Name}' --output text 2>/dev/null || echo "")
if [ -n "$cognito_pools" ]; then
    pool_count=$(echo "$cognito_pools" | wc -l)
    print_status "success" "Cognito User Pool" "($pool_count pools found)"
    update_counter "success"
else
    print_status "failure" "Cognito User Pool" "No matbakh user pools found"
    update_counter "failure"
fi

# 8. Check RDS Clusters
rds_clusters=$(aws rds describe-db-clusters --query 'DBClusters[?contains(DBClusterIdentifier, `matbakh`)].{ID:DBClusterIdentifier,Status:Status,Engine:Engine}' --output text 2>/dev/null || echo "")
if [ -n "$rds_clusters" ]; then
    cluster_count=$(echo "$rds_clusters" | wc -l)
    print_status "success" "RDS Clusters" "($cluster_count clusters found)"
    update_counter "success"
else
    print_status "failure" "RDS Clusters" "No matbakh RDS clusters found"
    update_counter "failure"
fi

# 9. Check Lambda Functions
lambda_functions=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `matbakh`)].{Name:FunctionName,Runtime:Runtime,State:State}' --output text 2>/dev/null || echo "")
if [ -n "$lambda_functions" ]; then
    lambda_count=$(echo "$lambda_functions" | wc -l)
    print_status "success" "Lambda Functions" "($lambda_count functions found)"
    update_counter "success"
else
    print_status "failure" "Lambda Functions" "No matbakh lambda functions found"
    update_counter "failure"
fi

# 10. Check Secrets Manager
secrets=$(aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `matbakh`)].{Name:Name,LastChanged:LastChangedDate}' --output text 2>/dev/null || echo "")
if [ -n "$secrets" ]; then
    secret_count=$(echo "$secrets" | wc -l)
    print_status "success" "Secrets Manager" "($secret_count secrets found)"
    update_counter "success"
else
    print_status "failure" "Secrets Manager" "No matbakh secrets found"
    update_counter "failure"
fi

# 11. Check API Gateway
api_gateways=$(aws apigateway get-rest-apis --query 'items[?contains(name, `matbakh`) || contains(name, `Matbakh`)].{ID:id,Name:name}' --output text 2>/dev/null || echo "")
if [ -n "$api_gateways" ]; then
    api_count=$(echo "$api_gateways" | wc -l)
    print_status "success" "API Gateway" "($api_count APIs found)"
    update_counter "success"
else
    print_status "failure" "API Gateway" "No matbakh APIs found"
    update_counter "failure"
fi

# Summary
echo ""
echo "📊 INFRASTRUCTURE HEALTH SUMMARY"
echo "================================="
echo ""

# Calculate percentages
if [ $total_checks -gt 0 ]; then
    success_pct=$((passed_checks * 100 / total_checks))
    warning_pct=$((warning_checks * 100 / total_checks))
    failure_pct=$((failed_checks * 100 / total_checks))
else
    success_pct=0
    warning_pct=0
    failure_pct=0
fi

echo -e "${GREEN}✅ Passed: $passed_checks/$total_checks ($success_pct%)${NC}"
echo -e "${YELLOW}⚠️  Warnings: $warning_checks/$total_checks ($warning_pct%)${NC}"
echo -e "${RED}❌ Failed: $failed_checks/$total_checks ($failure_pct%)${NC}"
echo ""

# Overall status
if [ $failed_checks -eq 0 ] && [ $warning_checks -eq 0 ]; then
    echo -e "${GREEN}🎉 INFRASTRUCTURE STATUS: HEALTHY${NC}"
    echo "   All systems operational!"
elif [ $failed_checks -eq 0 ]; then
    echo -e "${YELLOW}⚠️  INFRASTRUCTURE STATUS: NEEDS ATTENTION${NC}"
    echo "   Some warnings detected, but core systems operational"
elif [ $success_pct -ge 70 ]; then
    echo -e "${YELLOW}⚠️  INFRASTRUCTURE STATUS: PARTIALLY DEPLOYED${NC}"
    echo "   Core infrastructure exists but some services missing"
else
    echo -e "${RED}❌ INFRASTRUCTURE STATUS: INCOMPLETE${NC}"
    echo "   Major infrastructure components missing"
fi

echo ""
echo "🛠️  RECOMMENDED ACTIONS"
echo "======================"

if [ $failed_checks -gt 0 ]; then
    echo "1. Fix infrastructure issues:"
    echo "   - Run: ./infra/aws/infrastructure-deployment.sh"
    
    if [ -n "$failed_nats" ]; then
        echo "   - Fix NAT Gateways: ./infra/aws/fix-failed-nat-gateways.sh"
    fi
    
    if [ -n "$unassociated_eips" ]; then
        echo "   - Cleanup EIPs: ./infra/aws/cleanup-elastic-ips.sh"
    fi
fi

if [ $warning_checks -gt 0 ]; then
    echo "2. Address warnings:"
    echo "   - Review resource configurations"
    echo "   - Check resource associations"
fi

if [ $success_pct -ge 70 ]; then
    echo "3. Continue with application deployment:"
    echo "   - Deploy Cognito: ./infra/aws/cognito-deployment.sh"
    echo "   - Test migration: ./infra/aws/user-data-migration.sh"
fi

echo ""
echo "📚 For detailed logs, check: docs/hackathon/"
echo ""