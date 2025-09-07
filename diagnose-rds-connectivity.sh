#!/bin/bash
set -euo pipefail

# RDS Connectivity Diagnosis
# Analyzes network connectivity issues to RDS instance

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"

echo "🔍 RDS CONNECTIVITY DIAGNOSIS"
echo "============================"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo ""

# Step 1: Find RDS Instance
echo "🗄️  STEP 1: RDS INSTANCE ANALYSIS"
echo "================================="

echo "🔍 Finding RDS instance..."
RDS_INFO=$(aws rds describe-db-instances --region $REGION --profile $PROFILE --query 'DBInstances[?contains(Endpoint.Address, `matbakh-db`)]' --output json)

if [ "$(echo "$RDS_INFO" | jq length)" -eq 0 ]; then
    echo "❌ No RDS instance found with endpoint containing 'matbakh-db'"
    echo "🔍 Listing all RDS instances:"
    aws rds describe-db-instances --region $REGION --profile $PROFILE --query 'DBInstances[*].{Identifier:DBInstanceIdentifier,Status:DBInstanceStatus,Endpoint:Endpoint.Address}' --output table
    exit 1
fi

# Extract RDS details
DB_IDENTIFIER=$(echo "$RDS_INFO" | jq -r '.[0].DBInstanceIdentifier')
DB_STATUS=$(echo "$RDS_INFO" | jq -r '.[0].DBInstanceStatus')
DB_ENDPOINT=$(echo "$RDS_INFO" | jq -r '.[0].Endpoint.Address')
DB_PORT=$(echo "$RDS_INFO" | jq -r '.[0].Endpoint.Port')
DB_VPC_ID=$(echo "$RDS_INFO" | jq -r '.[0].DBSubnetGroup.VpcId')
PUBLIC_ACCESSIBLE=$(echo "$RDS_INFO" | jq -r '.[0].PubliclyAccessible')

echo "✅ RDS Instance Found:"
echo "   Identifier: $DB_IDENTIFIER"
echo "   Status: $DB_STATUS"
echo "   Endpoint: $DB_ENDPOINT"
echo "   Port: $DB_PORT"
echo "   VPC: $DB_VPC_ID"
echo "   Public Accessible: $PUBLIC_ACCESSIBLE"

if [ "$DB_STATUS" != "available" ]; then
    echo "❌ RDS Instance is not available (Status: $DB_STATUS)"
    echo "   Wait for instance to become available before testing connectivity"
    exit 1
fi

echo ""

# Step 2: Subnet Group Analysis
echo "🌐 STEP 2: SUBNET GROUP ANALYSIS"
echo "================================"

SUBNET_GROUP=$(echo "$RDS_INFO" | jq -r '.[0].DBSubnetGroup.DBSubnetGroupName')
echo "🔍 Analyzing subnet group: $SUBNET_GROUP"

SUBNET_INFO=$(aws rds describe-db-subnet-groups --db-subnet-group-name "$SUBNET_GROUP" --region $REGION --profile $PROFILE --output json)
SUBNETS=$(echo "$SUBNET_INFO" | jq -r '.DBSubnetGroups[0].Subnets[].SubnetIdentifier')

echo "📋 RDS Subnets:"
for subnet_id in $SUBNETS; do
    subnet_info=$(aws ec2 describe-subnets --subnet-ids "$subnet_id" --region $REGION --profile $PROFILE --query 'Subnets[0].{Name:Tags[?Key==`Name`].Value|[0],CIDR:CidrBlock,AZ:AvailabilityZone}' --output json)
    subnet_name=$(echo "$subnet_info" | jq -r '.Name // "Unnamed"')
    subnet_cidr=$(echo "$subnet_info" | jq -r '.CIDR')
    subnet_az=$(echo "$subnet_info" | jq -r '.AZ')
    
    echo "   ✅ $subnet_id ($subnet_name) - $subnet_cidr in $subnet_az"
done

echo ""

# Step 3: Security Group Analysis
echo "🔒 STEP 3: SECURITY GROUP ANALYSIS"
echo "=================================="

SECURITY_GROUPS=$(echo "$RDS_INFO" | jq -r '.[0].VpcSecurityGroups[].VpcSecurityGroupId')

echo "🔍 Analyzing RDS Security Groups:"
for sg_id in $SECURITY_GROUPS; do
    echo ""
    echo "📋 Security Group: $sg_id"
    
    # Get security group details
    sg_info=$(aws ec2 describe-security-groups --group-ids "$sg_id" --region $REGION --profile $PROFILE --output json)
    sg_name=$(echo "$sg_info" | jq -r '.SecurityGroups[0].GroupName')
    sg_description=$(echo "$sg_info" | jq -r '.SecurityGroups[0].Description')
    
    echo "   Name: $sg_name"
    echo "   Description: $sg_description"
    
    # Check inbound rules for PostgreSQL (port 5432)
    echo "   Inbound Rules (Port 5432):"
    inbound_rules=$(echo "$sg_info" | jq -r '.SecurityGroups[0].IpPermissions[] | select(.FromPort == 5432 or .ToPort == 5432) | "     \(.IpProtocol) \(.FromPort)-\(.ToPort) from \(.IpRanges[].CidrIp // .UserIdGroupPairs[].GroupId // "N/A")"')
    
    if [ -n "$inbound_rules" ]; then
        echo "$inbound_rules"
    else
        echo "     ❌ No rules found for port 5432"
    fi
    
    # Check if local IP is allowed
    echo "   🔍 Checking local IP access..."
    local_ip=$(curl -s ifconfig.me || echo "unknown")
    echo "   Your public IP: $local_ip"
    
    # Check if IP is in allowed ranges
    allowed_cidrs=$(echo "$sg_info" | jq -r '.SecurityGroups[0].IpPermissions[] | select(.FromPort == 5432 or .ToPort == 5432) | .IpRanges[].CidrIp')
    
    if [ -n "$allowed_cidrs" ]; then
        echo "   Allowed CIDR blocks:"
        for cidr in $allowed_cidrs; do
            echo "     - $cidr"
        done
    else
        echo "   ❌ No CIDR blocks allow external access to port 5432"
    fi
done

echo ""

# Step 4: Network Connectivity Analysis
echo "📡 STEP 4: NETWORK CONNECTIVITY ANALYSIS"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"

echo "🔍 Analyzing network path to RDS..."

# Check if RDS is in private subnets
echo "📋 RDS Network Configuration:"
echo "   Endpoint: $DB_ENDPOINT"
echo "   Private IP: 10.0.22.226 (from your info)"
echo "   Public Accessible: $PUBLIC_ACCESSIBLE"

if [ "$PUBLIC_ACCESSIBLE" = "false" ]; then
    echo "   ✅ RDS is correctly configured as private (not publicly accessible)"
    echo ""
    echo "🛣️  Required Network Path:"
    echo "   Local Machine → Internet → NAT Gateway → Private Subnet → RDS"
    echo ""
    echo "❌ PROBLEM IDENTIFIED:"
    echo "   You cannot directly connect from your local machine to a private RDS instance!"
    echo ""
    echo "🔧 SOLUTIONS:"
    echo "   1. Create a Bastion Host in a public subnet"
    echo "   2. Use AWS Systems Manager Session Manager"
    echo "   3. Temporarily enable public accessibility (NOT recommended)"
    echo "   4. Use AWS RDS Proxy with public endpoint"
else
    echo "   ⚠️  RDS is publicly accessible - checking internet connectivity..."
    
    # Test basic connectivity
    echo "🧪 Testing connectivity to RDS endpoint..."
    if nc -z "$DB_ENDPOINT" "$DB_PORT" 2>/dev/null; then
        echo "   ✅ Port $DB_PORT is reachable on $DB_ENDPOINT"
    else
        echo "   ❌ Port $DB_PORT is NOT reachable on $DB_ENDPOINT"
        echo "   This could be due to:"
        echo "     - Security group blocking your IP"
        echo "     - Network ACLs"
        echo "     - RDS instance not fully started"
    fi
fi

echo ""

# Step 5: Recommendations
echo "🎯 STEP 5: CONNECTIVITY SOLUTIONS"
echo "================================="

if [ "$PUBLIC_ACCESSIBLE" = "false" ]; then
    echo "🔧 RECOMMENDED SOLUTION: Bastion Host"
    echo "====================================="
    echo ""
    echo "Create a temporary EC2 instance in a public subnet:"
    echo ""
    echo "1. Launch EC2 instance:"
    echo "   - AMI: Amazon Linux 2023"
    echo "   - Instance Type: t3.micro (free tier)"
    echo "   - Subnet: matbakh-public-1a"
    echo "   - Security Group: Allow SSH (port 22) from your IP"
    echo "   - Key Pair: Create or use existing"
    echo ""
    echo "2. Install PostgreSQL client on bastion:"
    echo "   ssh -i your-key.pem ec2-user@bastion-ip"
    echo "   sudo dnf install -y postgresql15"
    echo ""
    echo "3. Connect to RDS from bastion:"
    echo "   PGPASSWORD='your-password' psql \\"
    echo "     -h $DB_ENDPOINT \\"
    echo "     -U postgres \\"
    echo "     -d postgres \\"
    echo "     -p $DB_PORT"
    echo ""
    echo "4. Transfer SQL file to bastion:"
    echo "   scp -i your-key.pem supabase/sql/matbakh_complete_schema.sql ec2-user@bastion-ip:~/"
    echo ""
    echo "5. Execute migration:"
    echo "   psql -h $DB_ENDPOINT -U postgres -d postgres -f matbakh_complete_schema.sql"
    
else
    echo "🔧 RECOMMENDED SOLUTION: Security Group Fix"
    echo "=========================================="
    echo ""
    echo "Your RDS is publicly accessible but security groups are blocking access."
    echo ""
    echo "Add your IP to the security group:"
    echo "   aws ec2 authorize-security-group-ingress \\"
    echo "     --group-id [SECURITY_GROUP_ID] \\"
    echo "     --protocol tcp \\"
    echo "     --port 5432 \\"
    echo "     --cidr $local_ip/32 \\"
    echo "     --region $REGION \\"
    echo "     --profile $PROFILE"
fi

echo ""
echo "🚀 ALTERNATIVE: AWS Systems Manager Session Manager"
echo "=================================================="
echo ""
echo "1. Create EC2 instance with SSM role"
echo "2. Connect via Session Manager (no SSH key needed)"
echo "3. Install PostgreSQL client and connect to RDS"
echo ""
echo "This is more secure than traditional SSH bastion."

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Choose your preferred connection method"
echo "2. Set up the connection (bastion/SSM/security group)"
echo "3. Test connectivity: psql connection"
echo "4. Migrate schema: run SQL files"
echo "5. Validate migration: check tables and data"
echo ""