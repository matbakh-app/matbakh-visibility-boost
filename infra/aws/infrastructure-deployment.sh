#!/bin/bash
set -euo pipefail

# AWS Infrastructure Deployment - VPC + RDS PostgreSQL
# Phase A2: Complete infrastructure setup for matbakh.app

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"

echo "🏗️ AWS Infrastructure Deployment - Phase A2"
echo "==========================================="
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# Initialize environment file
echo "# AWS Infrastructure Environment Variables" > .env.infrastructure
echo "# Generated on $(date)" >> .env.infrastructure
echo "ACCOUNT_ID=$ACCOUNT_ID" >> .env.infrastructure
echo "REGION=$REGION" >> .env.infrastructure
echo "" >> .env.infrastructure

# Function to check if resource exists
resource_exists() {
    local resource_type=$1
    local resource_name=$2
    
    case $resource_type in
        "vpc")
            aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$resource_name" --query 'Vpcs[0].VpcId' --output text 2>/dev/null | grep -v "None"
            ;;
        "subnet")
            aws ec2 describe-subnets --filters "Name=tag:Name,Values=$resource_name" --query 'Subnets[0].SubnetId' --output text 2>/dev/null | grep -v "None"
            ;;
        "rds-cluster")
            aws rds describe-db-clusters --db-cluster-identifier "$resource_name" --query 'DBClusters[0].DBClusterIdentifier' --output text 2>/dev/null
            ;;
        "secret")
            aws secretsmanager describe-secret --secret-id "$resource_name" --query 'Name' --output text 2>/dev/null
            ;;
    esac
}

echo "🔧 Starting infrastructure deployment..."
echo ""

# Step 1: Create VPC and Networking
create_vpc_infrastructure() {
    echo "🌐 Step 1: Creating VPC Infrastructure..."
    
    # Create VPC
    local vpc_id
    if vpc_id=$(resource_exists "vpc" "matbakh-vpc"); then
        echo "⚠️  VPC already exists: $vpc_id"
    else
        vpc_id=$(aws ec2 create-vpc \
            --cidr-block "10.0.0.0/16" \
            --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=matbakh-vpc},{Key=Environment,Value=production},{Key=Project,Value=matbakh-migration}]" \
            --query 'Vpc.VpcId' --output text)
        
        # Enable DNS hostnames and support
        aws ec2 modify-vpc-attribute --vpc-id "$vpc_id" --enable-dns-hostnames
        aws ec2 modify-vpc-attribute --vpc-id "$vpc_id" --enable-dns-support
        
        echo "✅ VPC created: $vpc_id"
    fi
    
    echo "VPC_ID=$vpc_id" >> .env.infrastructure
    
    # Create Internet Gateway
    local igw_id=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=matbakh-igw}]" \
        --query 'InternetGateway.InternetGatewayId' --output text 2>/dev/null || \
        aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=matbakh-igw" --query 'InternetGateways[0].InternetGatewayId' --output text)
    
    # Attach Internet Gateway to VPC
    aws ec2 attach-internet-gateway --vpc-id "$vpc_id" --internet-gateway-id "$igw_id" 2>/dev/null || true
    echo "✅ Internet Gateway: $igw_id"
    
    # Create Subnets
    create_subnets "$vpc_id"
    
    # Create NAT Gateways
    create_nat_gateways "$vpc_id"
    
    # Create Route Tables
    create_route_tables "$vpc_id" "$igw_id"
    
    # Create Security Groups
    create_security_groups "$vpc_id"
    
    echo ""
}

# Create all subnets
create_subnets() {
    local vpc_id=$1
    echo "🔗 Creating subnets..."
    
    # Public Subnets
    local public_subnets=(
        "matbakh-public-1a:10.0.1.0/24:eu-central-1a"
        "matbakh-public-1b:10.0.2.0/24:eu-central-1b"
        "matbakh-public-1c:10.0.3.0/24:eu-central-1c"
    )
    
    # Private Subnets
    local private_subnets=(
        "matbakh-private-1a:10.0.11.0/24:eu-central-1a"
        "matbakh-private-1b:10.0.12.0/24:eu-central-1b"
        "matbakh-private-1c:10.0.13.0/24:eu-central-1c"
    )
    
    # Database Subnets
    local db_subnets=(
        "matbakh-db-1a:10.0.21.0/24:eu-central-1a"
        "matbakh-db-1b:10.0.22.0/24:eu-central-1b"
        "matbakh-db-1c:10.0.23.0/24:eu-central-1c"
    )
    
    # Create public subnets
    for subnet_info in "${public_subnets[@]}"; do
        IFS=':' read -r name cidr az <<< "$subnet_info"
        create_subnet "$vpc_id" "$name" "$cidr" "$az" "true"
    done
    
    # Create private subnets
    for subnet_info in "${private_subnets[@]}"; do
        IFS=':' read -r name cidr az <<< "$subnet_info"
        create_subnet "$vpc_id" "$name" "$cidr" "$az" "false"
    done
    
    # Create database subnets
    for subnet_info in "${db_subnets[@]}"; do
        IFS=':' read -r name cidr az <<< "$subnet_info"
        create_subnet "$vpc_id" "$name" "$cidr" "$az" "false"
    done
}

# Create individual subnet
create_subnet() {
    local vpc_id=$1
    local name=$2
    local cidr=$3
    local az=$4
    local map_public_ip=$5
    
    local subnet_id
    if subnet_id=$(resource_exists "subnet" "$name"); then
        echo "⚠️  Subnet already exists: $name ($subnet_id)"
    else
        subnet_id=$(aws ec2 create-subnet \
            --vpc-id "$vpc_id" \
            --cidr-block "$cidr" \
            --availability-zone "$az" \
            --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$name}]" \
            --query 'Subnet.SubnetId' --output text)
        
        if [ "$map_public_ip" = "true" ]; then
            aws ec2 modify-subnet-attribute --subnet-id "$subnet_id" --map-public-ip-on-launch
        fi
        
        echo "✅ Subnet created: $name ($subnet_id)"
    fi
    
    # Store subnet ID in environment
    local env_var_name=$(echo "$name" | tr '-' '_' | tr '[:lower:]' '[:upper:]')_ID
    echo "${env_var_name}=$subnet_id" >> .env.infrastructure
}

# Create NAT Gateways
create_nat_gateways() {
    local vpc_id=$1
    echo "🌐 Creating NAT Gateways..."
    
    # Get public subnet IDs
    local public_1a_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1a" --query 'Subnets[0].SubnetId' --output text)
    local public_1b_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-public-1b" --query 'Subnets[0].SubnetId' --output text)
    
    # Create or reuse Elastic IPs
    echo "🔍 Checking for existing Elastic IPs..."
    
    # Try to find existing EIPs first
    local eip_1a=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1a" --query 'Addresses[0].AllocationId' --output text 2>/dev/null)
    local eip_1b=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=matbakh-nat-eip-1b" --query 'Addresses[0].AllocationId' --output text 2>/dev/null)
    
    # Create EIP 1a if not exists
    if [ "$eip_1a" = "None" ] || [ "$eip_1a" = "null" ] || [ -z "$eip_1a" ]; then
        echo "📍 Creating Elastic IP for NAT Gateway 1a..."
        eip_1a=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
        aws ec2 create-tags --resources "$eip_1a" --tags Key=Name,Value=matbakh-nat-eip-1a
        echo "✅ Created EIP 1a: $eip_1a"
    else
        echo "♻️  Reusing existing EIP 1a: $eip_1a"
    fi
    
    # Create EIP 1b if not exists
    if [ "$eip_1b" = "None" ] || [ "$eip_1b" = "null" ] || [ -z "$eip_1b" ]; then
        echo "📍 Creating Elastic IP for NAT Gateway 1b..."
        eip_1b=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
        aws ec2 create-tags --resources "$eip_1b" --tags Key=Name,Value=matbakh-nat-eip-1b
        echo "✅ Created EIP 1b: $eip_1b"
    else
        echo "♻️  Reusing existing EIP 1b: $eip_1b"
    fi
    
    local nat_1a=$(aws ec2 create-nat-gateway --subnet-id "$public_1a_id" --allocation-id "$eip_1a" --query 'NatGateway.NatGatewayId' --output text)
    local nat_1b=$(aws ec2 create-nat-gateway --subnet-id "$public_1b_id" --allocation-id "$eip_1b" --query 'NatGateway.NatGatewayId' --output text)
    
    # Add tags separately (NAT Gateways don't support tags during creation)
    aws ec2 create-tags --resources "$nat_1a" --tags Key=Name,Value=matbakh-nat-1a
    aws ec2 create-tags --resources "$nat_1b" --tags Key=Name,Value=matbakh-nat-1b
    
    echo "✅ NAT Gateway 1a: $nat_1a"
    echo "✅ NAT Gateway 1b: $nat_1b"
    
    echo "NAT_GATEWAY_1A_ID=$nat_1a" >> .env.infrastructure
    echo "NAT_GATEWAY_1B_ID=$nat_1b" >> .env.infrastructure
    
    # Wait for NAT Gateways to be available with better error handling
    echo "⏳ Waiting for NAT Gateways to be available..."
    
    # Wait for each NAT Gateway individually with timeout
    for nat_id in "$nat_1a" "$nat_1b"; do
        echo "⏳ Waiting for NAT Gateway $nat_id..."
        
        # Wait with timeout and check for failure
        if ! aws ec2 wait nat-gateway-available --nat-gateway-ids "$nat_id" --cli-read-timeout 300; then
            echo "❌ NAT Gateway $nat_id failed to become available"
            
            # Check the failure reason
            local failure_info=$(aws ec2 describe-nat-gateways --nat-gateway-ids "$nat_id" \
                --query 'NatGateways[0].{State:State,FailureCode:FailureCode,FailureMessage:FailureMessage}' \
                --output json)
            
            echo "🔍 Failure details: $failure_info"
            echo ""
            echo "🛠️  To fix this issue, run:"
            echo "   chmod +x infra/aws/fix-failed-nat-gateways.sh"
            echo "   ./infra/aws/fix-failed-nat-gateways.sh"
            echo ""
            exit 1
        fi
        
        echo "✅ NAT Gateway $nat_id is available"
    done
    
    echo "✅ All NAT Gateways are ready"
}

# Create Route Tables
create_route_tables() {
    local vpc_id=$1
    local igw_id=$2
    echo "🛣️ Creating Route Tables..."
    
    # Verify IGW is attached to the correct VPC
    local igw_vpc_id=$(aws ec2 describe-internet-gateways --internet-gateway-ids "$igw_id" --query 'InternetGateways[0].Attachments[0].VpcId' --output text)
    if [ "$igw_vpc_id" != "$vpc_id" ]; then
        echo "❌ ERROR: Internet Gateway $igw_id is attached to VPC $igw_vpc_id, but we need VPC $vpc_id"
        echo "🔧 Fixing VPC attachment..."
        
        # Detach from wrong VPC if attached
        if [ "$igw_vpc_id" != "None" ] && [ "$igw_vpc_id" != "null" ]; then
            aws ec2 detach-internet-gateway --vpc-id "$igw_vpc_id" --internet-gateway-id "$igw_id" 2>/dev/null || true
        fi
        
        # Attach to correct VPC
        aws ec2 attach-internet-gateway --vpc-id "$vpc_id" --internet-gateway-id "$igw_id"
        echo "✅ Internet Gateway $igw_id now attached to VPC $vpc_id"
    fi
    
    # Public Route Table
    local public_rt=$(aws ec2 create-route-table --vpc-id "$vpc_id" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-public-rt}]" --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-route --route-table-id "$public_rt" --destination-cidr-block "0.0.0.0/0" --gateway-id "$igw_id"
    
    # Associate public subnets
    local public_subnets=("matbakh-public-1a" "matbakh-public-1b" "matbakh-public-1c")
    for subnet_name in "${public_subnets[@]}"; do
        local subnet_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=$subnet_name" --query 'Subnets[0].SubnetId' --output text)
        aws ec2 associate-route-table --subnet-id "$subnet_id" --route-table-id "$public_rt"
    done
    
    echo "✅ Public Route Table: $public_rt"
    
    # Private Route Tables
    local nat_1a_id=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-1a" --query 'NatGateways[0].NatGatewayId' --output text)
    local nat_1b_id=$(aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=matbakh-nat-1b" --query 'NatGateways[0].NatGatewayId' --output text)
    
    # Private RT for AZ 1a
    local private_rt_1a=$(aws ec2 create-route-table --vpc-id "$vpc_id" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-private-rt-1a}]" --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-route --route-table-id "$private_rt_1a" --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$nat_1a_id"
    
    local private_1a_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1a" --query 'Subnets[0].SubnetId' --output text)
    aws ec2 associate-route-table --subnet-id "$private_1a_id" --route-table-id "$private_rt_1a"
    
    # Private RT for AZ 1b/1c
    local private_rt_1b=$(aws ec2 create-route-table --vpc-id "$vpc_id" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-private-rt-1b}]" --query 'RouteTable.RouteTableId' --output text)
    aws ec2 create-route --route-table-id "$private_rt_1b" --destination-cidr-block "0.0.0.0/0" --nat-gateway-id "$nat_1b_id"
    
    local private_1b_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1b" --query 'Subnets[0].SubnetId' --output text)
    local private_1c_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1c" --query 'Subnets[0].SubnetId' --output text)
    aws ec2 associate-route-table --subnet-id "$private_1b_id" --route-table-id "$private_rt_1b"
    aws ec2 associate-route-table --subnet-id "$private_1c_id" --route-table-id "$private_rt_1b"
    
    # Database Route Table (no internet access)
    local db_rt=$(aws ec2 create-route-table --vpc-id "$vpc_id" --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=matbakh-db-rt}]" --query 'RouteTable.RouteTableId' --output text)
    
    local db_subnets=("matbakh-db-1a" "matbakh-db-1b" "matbakh-db-1c")
    for subnet_name in "${db_subnets[@]}"; do
        local subnet_id=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=$subnet_name" --query 'Subnets[0].SubnetId' --output text)
        aws ec2 associate-route-table --subnet-id "$subnet_id" --route-table-id "$db_rt"
    done
    
    echo "✅ Route Tables created and associated"
}

# Create Security Groups
create_security_groups() {
    local vpc_id=$1
    echo "🔒 Creating Security Groups..."
    
    # Lambda Security Group
    local lambda_sg=$(aws ec2 create-security-group \
        --group-name "matbakh-lambda-sg" \
        --description "Security group for Lambda functions" \
        --vpc-id "$vpc_id" \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=matbakh-lambda-sg}]" \
        --query 'GroupId' --output text)
    
    # RDS Security Group
    local rds_sg=$(aws ec2 create-security-group \
        --group-name "matbakh-rds-sg" \
        --description "Security group for RDS PostgreSQL" \
        --vpc-id "$vpc_id" \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=matbakh-rds-sg}]" \
        --query 'GroupId' --output text)
    
    # VPC Endpoints Security Group
    local vpc_endpoints_sg=$(aws ec2 create-security-group \
        --group-name "matbakh-vpc-endpoints-sg" \
        --description "Security group for VPC endpoints" \
        --vpc-id "$vpc_id" \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=matbakh-vpc-endpoints-sg}]" \
        --query 'GroupId' --output text)
    
    # Configure Lambda SG rules
    aws ec2 authorize-security-group-egress \
        --group-id "$lambda_sg" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 2>/dev/null || true
    
    aws ec2 authorize-security-group-egress \
        --group-id "$lambda_sg" \
        --protocol tcp \
        --port 5432 \
        --source-group "$rds_sg" 2>/dev/null || true
    
    # Configure RDS SG rules
    aws ec2 authorize-security-group-ingress \
        --group-id "$rds_sg" \
        --protocol tcp \
        --port 5432 \
        --source-group "$lambda_sg" 2>/dev/null || true
    
    # Configure VPC Endpoints SG rules
    aws ec2 authorize-security-group-ingress \
        --group-id "$vpc_endpoints_sg" \
        --protocol tcp \
        --port 443 \
        --cidr 10.0.0.0/16 2>/dev/null || true
    
    echo "✅ Security Groups created:"
    echo "   Lambda SG: $lambda_sg"
    echo "   RDS SG: $rds_sg"
    echo "   VPC Endpoints SG: $vpc_endpoints_sg"
    
    echo "LAMBDA_SECURITY_GROUP_ID=$lambda_sg" >> .env.infrastructure
    echo "RDS_SECURITY_GROUP_ID=$rds_sg" >> .env.infrastructure
    echo "VPC_ENDPOINTS_SECURITY_GROUP_ID=$vpc_endpoints_sg" >> .env.infrastructure
}

# Step 2: Create Secrets Manager secrets
create_secrets() {
    echo "🔐 Step 2: Creating Secrets Manager secrets..."
    
    # Master password secret
    local master_secret_name="matbakh/rds/master-password"
    if resource_exists "secret" "$master_secret_name" > /dev/null 2>&1; then
        echo "⚠️  Master password secret already exists"
    else
        aws secretsmanager create-secret \
            --name "$master_secret_name" \
            --description "Master password for matbakh RDS cluster" \
            --generate-random-password \
            --password-length 32 \
            --exclude-characters '"@/\' \
            --tags '[{"Key":"Name","Value":"matbakh-rds-master-password"},{"Key":"Environment","Value":"production"}]' > /dev/null
        
        echo "✅ Master password secret created"
    fi
    
    # Application credentials secret
    local app_secret_name="matbakh/rds/app-credentials"
    if resource_exists "secret" "$app_secret_name" > /dev/null 2>&1; then
        echo "⚠️  Application credentials secret already exists"
    else
        local app_secret_value='{
            "username": "matbakh_app",
            "password": "temp-password-will-be-updated",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "matbakh_main",
            "dbClusterIdentifier": "matbakh-prod"
        }'
        
        aws secretsmanager create-secret \
            --name "$app_secret_name" \
            --description "Application credentials for matbakh database access" \
            --secret-string "$app_secret_value" \
            --tags '[{"Key":"Name","Value":"matbakh-rds-app-credentials"},{"Key":"Environment","Value":"production"}]' > /dev/null
        
        echo "✅ Application credentials secret created"
    fi
    
    echo "MASTER_SECRET_ARN=arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:$master_secret_name" >> .env.infrastructure
    echo "APP_SECRET_ARN=arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:$app_secret_name" >> .env.infrastructure
    echo ""
}

# Step 3: Create RDS Aurora PostgreSQL Cluster
create_rds_cluster() {
    echo "🗄️ Step 3: Creating RDS Aurora PostgreSQL Cluster..."
    
    # Check if cluster already exists
    if resource_exists "rds-cluster" "matbakh-prod" > /dev/null 2>&1; then
        echo "⚠️  RDS cluster already exists: matbakh-prod"
        local cluster_endpoint=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].Endpoint' --output text)
        echo "RDS_CLUSTER_ENDPOINT=$cluster_endpoint" >> .env.infrastructure
        return 0
    fi
    
    # Get subnet IDs for DB subnet group
    local db_subnet_1a=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1a" --query 'Subnets[0].SubnetId' --output text)
    local db_subnet_1b=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1b" --query 'Subnets[0].SubnetId' --output text)
    local db_subnet_1c=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-db-1c" --query 'Subnets[0].SubnetId' --output text)
    
    # Create DB subnet group
    aws rds create-db-subnet-group \
        --db-subnet-group-name "matbakh-db-subnet-group" \
        --db-subnet-group-description "Subnet group for matbakh RDS cluster" \
        --subnet-ids "$db_subnet_1a" "$db_subnet_1b" "$db_subnet_1c" \
        --tags "Key=Name,Value=matbakh-db-subnet-group" > /dev/null
    
    echo "✅ DB Subnet Group created"
    
    # Create cluster parameter group
    aws rds create-db-cluster-parameter-group \
        --db-cluster-parameter-group-name "matbakh-cluster-pg" \
        --db-parameter-group-family "aurora-postgresql15" \
        --description "Custom parameter group for matbakh cluster" \
        --tags "Key=Name,Value=matbakh-cluster-pg" > /dev/null
    
    # Set cluster parameters
    aws rds modify-db-cluster-parameter-group \
        --db-cluster-parameter-group-name "matbakh-cluster-pg" \
        --parameters "ParameterName=shared_preload_libraries,ParameterValue=pg_stat_statements,ApplyMethod=pending-reboot" \
                     "ParameterName=log_statement,ParameterValue=all,ApplyMethod=immediate" \
                     "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" > /dev/null
    
    echo "✅ Cluster Parameter Group created and configured"
    
    # Create instance parameter group
    aws rds create-db-parameter-group \
        --db-parameter-group-name "matbakh-instance-pg" \
        --db-parameter-group-family "aurora-postgresql15" \
        --description "Custom parameter group for matbakh instances" \
        --tags "Key=Name,Value=matbakh-instance-pg" > /dev/null
    
    echo "✅ Instance Parameter Group created"
    
    # Get master password from Secrets Manager
    local master_secret_arn="arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:matbakh/rds/master-password"
    
    # Get RDS security group ID
    local rds_sg_id=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=matbakh-rds-sg" --query 'SecurityGroups[0].GroupId' --output text)
    
    # Create RDS Aurora cluster
    echo "⏳ Creating Aurora PostgreSQL cluster (this may take 10-15 minutes)..."
    
    aws rds create-db-cluster \
        --db-cluster-identifier "matbakh-prod" \
        --engine "aurora-postgresql" \
        --engine-version "15.5" \
        --master-username "matbakh_admin" \
        --manage-master-user-password \
        --master-user-secret-kms-key-id "alias/aws/secretsmanager" \
        --database-name "matbakh_main" \
        --db-cluster-parameter-group-name "matbakh-cluster-pg" \
        --db-subnet-group-name "matbakh-db-subnet-group" \
        --vpc-security-group-ids "$rds_sg_id" \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "sun:04:00-sun:05:00" \
        --enable-cloudwatch-logs-exports "postgresql" \
        --enable-iam-database-authentication \
        --enable-http-endpoint \
        --storage-encrypted \
        --kms-key-id "alias/aws/rds" \
        --deletion-protection \
        --tags "Key=Name,Value=matbakh-prod-cluster" \
               "Key=Environment,Value=production" \
               "Key=Project,Value=matbakh-migration" > /dev/null
    
    echo "✅ Aurora cluster creation initiated"
    
    # Wait for cluster to be available
    echo "⏳ Waiting for cluster to be available..."
    aws rds wait db-cluster-available --db-cluster-identifier "matbakh-prod"
    
    # Get cluster endpoint
    local cluster_endpoint=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].Endpoint' --output text)
    local cluster_reader_endpoint=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].ReaderEndpoint' --output text)
    
    echo "✅ Aurora cluster is available"
    echo "   Writer Endpoint: $cluster_endpoint"
    echo "   Reader Endpoint: $cluster_reader_endpoint"
    
    echo "RDS_CLUSTER_ENDPOINT=$cluster_endpoint" >> .env.infrastructure
    echo "RDS_CLUSTER_READER_ENDPOINT=$cluster_reader_endpoint" >> .env.infrastructure
    echo "RDS_CLUSTER_ARN=arn:aws:rds:$REGION:$ACCOUNT_ID:cluster:matbakh-prod" >> .env.infrastructure
    
    echo ""
}

# Step 4: Create RDS Instances
create_rds_instances() {
    echo "💾 Step 4: Creating RDS Instances..."
    
    # Create writer instance
    echo "⏳ Creating writer instance..."
    aws rds create-db-instance \
        --db-instance-identifier "matbakh-prod-writer" \
        --db-instance-class "db.t4g.medium" \
        --engine "aurora-postgresql" \
        --db-cluster-identifier "matbakh-prod" \
        --db-parameter-group-name "matbakh-instance-pg" \
        --availability-zone "eu-central-1a" \
        --no-publicly-accessible \
        --auto-minor-version-upgrade \
        --enable-performance-insights \
        --performance-insights-retention-period 7 \
        --monitoring-interval 60 \
        --tags "Key=Name,Value=matbakh-prod-writer" \
               "Key=Role,Value=writer" > /dev/null
    
    # Create reader instance
    echo "⏳ Creating reader instance..."
    aws rds create-db-instance \
        --db-instance-identifier "matbakh-prod-reader" \
        --db-instance-class "db.t4g.medium" \
        --engine "aurora-postgresql" \
        --db-cluster-identifier "matbakh-prod" \
        --db-parameter-group-name "matbakh-instance-pg" \
        --availability-zone "eu-central-1b" \
        --no-publicly-accessible \
        --auto-minor-version-upgrade \
        --enable-performance-insights \
        --performance-insights-retention-period 7 \
        --monitoring-interval 60 \
        --tags "Key=Name,Value=matbakh-prod-reader" \
               "Key=Role,Value=reader" > /dev/null
    
    echo "⏳ Waiting for instances to be available (this may take 10-15 minutes)..."
    aws rds wait db-instance-available --db-instance-identifier "matbakh-prod-writer"
    aws rds wait db-instance-available --db-instance-identifier "matbakh-prod-reader"
    
    echo "✅ RDS instances are available"
    echo ""
}

# Step 5: Create VPC Endpoints
create_vpc_endpoints() {
    echo "🔗 Step 5: Creating VPC Endpoints..."
    
    local vpc_id=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text)
    local private_subnet_1a=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1a" --query 'Subnets[0].SubnetId' --output text)
    local private_subnet_1b=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=matbakh-private-1b" --query 'Subnets[0].SubnetId' --output text)
    local vpc_endpoints_sg=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=matbakh-vpc-endpoints-sg" --query 'SecurityGroups[0].GroupId' --output text)
    
    # Secrets Manager VPC Endpoint
    local secrets_endpoint=$(aws ec2 create-vpc-endpoint \
        --vpc-id "$vpc_id" \
        --service-name "com.amazonaws.$REGION.secretsmanager" \
        --vpc-endpoint-type "Interface" \
        --subnet-ids "$private_subnet_1a" "$private_subnet_1b" \
        --security-group-ids "$vpc_endpoints_sg" \
        --private-dns-enabled \
        --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=matbakh-secretsmanager-endpoint}]" \
        --query 'VpcEndpoint.VpcEndpointId' --output text)
    
    # RDS Data API VPC Endpoint
    local rds_data_endpoint=$(aws ec2 create-vpc-endpoint \
        --vpc-id "$vpc_id" \
        --service-name "com.amazonaws.$REGION.rds-data" \
        --vpc-endpoint-type "Interface" \
        --subnet-ids "$private_subnet_1a" "$private_subnet_1b" \
        --security-group-ids "$vpc_endpoints_sg" \
        --private-dns-enabled \
        --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=matbakh-rds-data-endpoint}]" \
        --query 'VpcEndpoint.VpcEndpointId' --output text)
    
    echo "✅ VPC Endpoints created:"
    echo "   Secrets Manager: $secrets_endpoint"
    echo "   RDS Data API: $rds_data_endpoint"
    
    echo "SECRETS_MANAGER_ENDPOINT_ID=$secrets_endpoint" >> .env.infrastructure
    echo "RDS_DATA_ENDPOINT_ID=$rds_data_endpoint" >> .env.infrastructure
    echo ""
}

# Step 6: Update Secrets with actual RDS endpoints
update_secrets() {
    echo "🔄 Step 6: Updating secrets with RDS endpoints..."
    
    local cluster_endpoint=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].Endpoint' --output text)
    local cluster_arn=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].DBClusterArn' --output text)
    
    # Update application credentials secret
    local app_secret_value="{
        \"username\": \"matbakh_app\",
        \"password\": \"$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)\",
        \"engine\": \"postgres\",
        \"host\": \"$cluster_endpoint\",
        \"port\": 5432,
        \"dbname\": \"matbakh_main\",
        \"dbClusterIdentifier\": \"matbakh-prod\",
        \"dbClusterArn\": \"$cluster_arn\"
    }"
    
    aws secretsmanager update-secret \
        --secret-id "matbakh/rds/app-credentials" \
        --secret-string "$app_secret_value" > /dev/null
    
    echo "✅ Application credentials secret updated with RDS endpoints"
    echo ""
}

# Validation and Testing
validate_infrastructure() {
    echo "🔍 Step 7: Validating Infrastructure..."
    
    # Test VPC connectivity
    local vpc_id=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=matbakh-vpc" --query 'Vpcs[0].VpcId' --output text)
    if [ "$vpc_id" != "None" ] && [ -n "$vpc_id" ]; then
        echo "✅ VPC is accessible: $vpc_id"
    else
        echo "❌ VPC validation failed"
        return 1
    fi
    
    # Test RDS cluster connectivity
    local cluster_status=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].Status' --output text)
    if [ "$cluster_status" = "available" ]; then
        echo "✅ RDS cluster is available"
    else
        echo "❌ RDS cluster validation failed (Status: $cluster_status)"
        return 1
    fi
    
    # Test secrets accessibility
    local master_secret=$(aws secretsmanager describe-secret --secret-id "matbakh/rds/master-password" --query 'Name' --output text 2>/dev/null)
    local app_secret=$(aws secretsmanager describe-secret --secret-id "matbakh/rds/app-credentials" --query 'Name' --output text 2>/dev/null)
    
    if [ -n "$master_secret" ] && [ -n "$app_secret" ]; then
        echo "✅ Secrets Manager secrets are accessible"
    else
        echo "❌ Secrets validation failed"
        return 1
    fi
    
    # Test VPC endpoints
    local secrets_endpoint_state=$(aws ec2 describe-vpc-endpoints --filters "Name=tag:Name,Values=matbakh-secretsmanager-endpoint" --query 'VpcEndpoints[0].State' --output text)
    if [ "$secrets_endpoint_state" = "available" ]; then
        echo "✅ VPC endpoints are available"
    else
        echo "⚠️  VPC endpoints may still be provisioning (State: $secrets_endpoint_state)"
    fi
    
    return 0
}

# Generate connection templates and documentation
generate_connection_templates() {
    echo "📋 Step 8: Generating connection templates..."
    
    # Load environment variables
    source .env.infrastructure
    
    # Create Lambda connection template
    cat > lambda-rds-connection-template.js << 'EOF'
// Lambda function template for RDS connection
const AWS = require('aws-sdk');

const rdsDataService = new AWS.RDSDataService({
    region: process.env.AWS_REGION
});

const secretsManager = new AWS.SecretsManager({
    region: process.env.AWS_REGION
});

// RDS Data API connection
const executeQuery = async (sql, parameters = []) => {
    const params = {
        resourceArn: process.env.RDS_CLUSTER_ARN,
        secretArn: process.env.RDS_SECRET_ARN,
        database: 'matbakh_main',
        sql: sql,
        parameters: parameters
    };
    
    try {
        const result = await rdsDataService.executeStatement(params).promise();
        return result;
    } catch (error) {
        console.error('Database query failed:', error);
        throw error;
    }
};

// Example usage in Lambda handler
exports.handler = async (event) => {
    try {
        // Example query
        const result = await executeQuery(
            'SELECT id, email FROM profiles WHERE id = :userId',
            [{ name: 'userId', value: { stringValue: event.userId } }]
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify(result.records)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
EOF
    
    # Create environment variables template
    cat > .env.template << EOF
# AWS Infrastructure Environment Variables
# Copy this to .env and update with actual values

# AWS Configuration
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID

# VPC Configuration
VPC_ID=$VPC_ID
LAMBDA_SECURITY_GROUP_ID=$LAMBDA_SECURITY_GROUP_ID
RDS_SECURITY_GROUP_ID=$RDS_SECURITY_GROUP_ID

# RDS Configuration
RDS_CLUSTER_ENDPOINT=$RDS_CLUSTER_ENDPOINT
RDS_CLUSTER_READER_ENDPOINT=$RDS_CLUSTER_READER_ENDPOINT
RDS_CLUSTER_ARN=$RDS_CLUSTER_ARN

# Secrets Manager
MASTER_SECRET_ARN=$MASTER_SECRET_ARN
APP_SECRET_ARN=$APP_SECRET_ARN

# Subnet IDs for Lambda deployment
PRIVATE_SUBNET_1A_ID=$MATBAKH_PRIVATE_1A_ID
PRIVATE_SUBNET_1B_ID=$MATBAKH_PRIVATE_1B_ID
PRIVATE_SUBNET_1C_ID=$MATBAKH_PRIVATE_1C_ID
EOF
    
    echo "✅ Connection templates generated:"
    echo "   - lambda-rds-connection-template.js"
    echo "   - .env.template"
    echo ""
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 AWS Infrastructure Deployment Completed!"
    echo ""
    echo "📊 Created Resources:"
    echo "===================="
    
    # Load environment variables for summary
    source .env.infrastructure
    
    echo "VPC Infrastructure:"
    echo "  - VPC ID: $VPC_ID"
    echo "  - Public Subnets: 3 (across 3 AZs)"
    echo "  - Private Subnets: 3 (across 3 AZs)"
    echo "  - Database Subnets: 3 (across 3 AZs)"
    echo "  - NAT Gateways: 2 (for HA)"
    echo "  - Security Groups: 3 (Lambda, RDS, VPC Endpoints)"
    echo ""
    
    echo "RDS Aurora PostgreSQL:"
    echo "  - Cluster: matbakh-prod"
    echo "  - Writer Endpoint: $RDS_CLUSTER_ENDPOINT"
    echo "  - Reader Endpoint: $RDS_CLUSTER_READER_ENDPOINT"
    echo "  - Engine: PostgreSQL 15.5"
    echo "  - Instances: 2 (Writer + Reader)"
    echo "  - Multi-AZ: Yes"
    echo "  - Encryption: Enabled"
    echo "  - Backup Retention: 7 days"
    echo ""
    
    echo "Security & Access:"
    echo "  - IAM Database Authentication: Enabled"
    echo "  - Secrets Manager: 2 secrets created"
    echo "  - VPC Endpoints: 2 (Secrets Manager, RDS Data API)"
    echo "  - Network Isolation: Complete"
    echo ""
    
    echo "📁 Generated Files:"
    echo "  - .env.infrastructure (all resource IDs)"
    echo "  - .env.template (template for applications)"
    echo "  - lambda-rds-connection-template.js (Lambda code template)"
    echo ""
    
    echo "🔗 AWS Console URLs:"
    echo "  - VPC: https://$REGION.console.aws.amazon.com/vpc/home?region=$REGION#vpcs:VpcId=$VPC_ID"
    echo "  - RDS: https://$REGION.console.aws.amazon.com/rds/home?region=$REGION#database:id=matbakh-prod;is-cluster=true"
    echo "  - Secrets: https://$REGION.console.aws.amazon.com/secretsmanager/home?region=$REGION"
    echo ""
    
    echo "💰 Estimated Monthly Costs:"
    echo "  - RDS Aurora (2x db.t4g.medium): ~€180-220"
    echo "  - NAT Gateways (2x): ~€60"
    echo "  - VPC Endpoints (2x): ~€15"
    echo "  - Data Transfer: ~€10-20"
    echo "  - Total: ~€265-315/month"
    echo ""
    
    echo "⚠️  Next Steps:"
    echo "  1. Update Lambda functions with VPC configuration"
    echo "  2. Test RDS connectivity from Lambda"
    echo "  3. Run database schema migration"
    echo "  4. Configure monitoring and alerting"
    echo "  5. Set up automated backups verification"
    echo ""
    
    echo "🔧 Quick Commands:"
    echo "  # Test RDS connectivity:"
    echo "  aws rds describe-db-clusters --db-cluster-identifier matbakh-prod"
    echo ""
    echo "  # Get database credentials:"
    echo "  aws secretsmanager get-secret-value --secret-id matbakh/rds/app-credentials"
    echo ""
    echo "  # Update Lambda function with VPC config:"
    echo "  aws lambda update-function-configuration \\"
    echo "    --function-name your-function-name \\"
    echo "    --vpc-config SubnetIds=$MATBAKH_PRIVATE_1A_ID,$MATBAKH_PRIVATE_1B_ID,SecurityGroupIds=$LAMBDA_SECURITY_GROUP_ID"
    echo ""
}

# Main execution
main() {
    echo "🚀 Starting AWS Infrastructure Deployment"
    echo "========================================="
    
    create_vpc_infrastructure
    create_secrets
    create_rds_cluster
    create_rds_instances
    create_vpc_endpoints
    update_secrets
    
    if validate_infrastructure; then
        generate_connection_templates
        output_summary
        echo "🎉 Infrastructure deployment completed successfully!"
    else
        echo "❌ Infrastructure validation failed. Please check the logs above."
        exit 1
    fi
}

# Run main function
main "$@"