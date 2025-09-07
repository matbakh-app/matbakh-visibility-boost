#!/bin/bash
set -euo pipefail

# Create Bastion Host for RDS Access
# This script creates a temporary EC2 instance for secure RDS access

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
KEY_NAME=${KEY_NAME:-matbakh-bastion-key}

echo "🏗️  CREATING BASTION HOST FOR RDS ACCESS"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "Region: $REGION"
echo "Profile: $PROFILE"
echo "Key Name: $KEY_NAME"
echo ""

# Step 1: Get VPC and Subnet Information
echo "📡 Step 1: Getting VPC Information"
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=tag:Name,Values=matbakh-vpc" \
    --query 'Vpcs[0].VpcId' \
    --output text \
    --region $REGION --profile $PROFILE)

if [ "$VPC_ID" = "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ VPC 'matbakh-vpc' not found"
    exit 1
fi

PUBLIC_SUBNET=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=matbakh-public-1a" \
    --query 'Subnets[0].SubnetId' \
    --output text \
    --region $REGION --profile $PROFILE)

if [ "$PUBLIC_SUBNET" = "None" ] || [ -z "$PUBLIC_SUBNET" ]; then
    echo "❌ Public subnet 'matbakh-public-1a' not found"
    exit 1
fi

echo "✅ VPC ID: $VPC_ID"
echo "✅ Public Subnet: $PUBLIC_SUBNET"

# Step 2: Create Key Pair (if not exists)
echo ""
echo "🔑 Step 2: Creating Key Pair"
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION --profile $PROFILE > /dev/null 2>&1; then
    echo "✅ Key pair '$KEY_NAME' already exists"
else
    echo "🔧 Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --query 'KeyMaterial' \
        --output text \
        --region $REGION --profile $PROFILE > "${KEY_NAME}.pem"
    chmod 400 "${KEY_NAME}.pem"
    echo "✅ Key pair created: ${KEY_NAME}.pem"
fi

# Step 3: Create Security Group for Bastion
echo ""
echo "🔒 Step 3: Creating Bastion Security Group"
BASTION_SG_NAME="matbakh-bastion-sg"

# Check if security group exists
BASTION_SG=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$BASTION_SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION --profile $PROFILE 2>/dev/null || echo "None")

if [ "$BASTION_SG" = "None" ] || [ -z "$BASTION_SG" ]; then
    echo "🔧 Creating security group..."
    BASTION_SG=$(aws ec2 create-security-group \
        --group-name "$BASTION_SG_NAME" \
        --description "Bastion host security group for RDS access" \
        --vpc-id "$VPC_ID" \
        --query 'GroupId' \
        --output text \
        --region $REGION --profile $PROFILE)
    echo "✅ Created security group: $BASTION_SG"
else
    echo "✅ Security group already exists: $BASTION_SG"
fi

# Get your public IP
LOCAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "0.0.0.0")
echo "📍 Your public IP: $LOCAL_IP"

# Add SSH rule if not exists
echo "🔧 Adding SSH access rule..."
aws ec2 authorize-security-group-ingress \
    --group-id "$BASTION_SG" \
    --protocol tcp \
    --port 22 \
    --cidr "$LOCAL_IP/32" \
    --region $REGION --profile $PROFILE 2>/dev/null || echo "   ℹ️  SSH rule may already exist"

# Step 4: Create User Data Script
echo ""
echo "📝 Step 4: Creating User Data Script"
cat > bastion-user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y postgresql15

# Create connection script
cat > /home/ec2-user/connect-rds.sh << 'INNER_EOF'
#!/bin/bash
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"
echo "🔗 Connecting to RDS..."
echo "Enter password when prompted:"
psql -h "$RDS_ENDPOINT" -U postgres -d postgres -p 5432
INNER_EOF

chmod +x /home/ec2-user/connect-rds.sh
chown ec2-user:ec2-user /home/ec2-user/connect-rds.sh

# Create migration script
cat > /home/ec2-user/migrate-schema.sh << 'INNER_EOF'
#!/bin/bash
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"
SCHEMA_FILE="$1"

if [ -z "$SCHEMA_FILE" ]; then
    echo "Usage: $0 <schema-file.sql>"
    exit 1
fi

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    exit 1
fi

echo "🚀 Running schema migration..."
echo "Enter password when prompted:"
PGPASSWORD="$RDS_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -f "$SCHEMA_FILE"
echo "✅ Migration completed"
INNER_EOF

chmod +x /home/ec2-user/migrate-schema.sh
chown ec2-user:ec2-user /home/ec2-user/migrate-schema.sh

echo "Bastion host setup completed" > /var/log/user-data.log
EOF

# Step 5: Launch EC2 Instance
echo ""
echo "🚀 Step 5: Launching Bastion Instance"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0162584d82a32b572 \
    --instance-type t3.micro \
    --key-name "$KEY_NAME" \
    --security-group-ids "$BASTION_SG" \
    --subnet-id "$PUBLIC_SUBNET" \
    --associate-public-ip-address \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=matbakh-bastion},{Key=Purpose,Value=RDS-Migration}]" \
    --user-data file://bastion-user-data.sh \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region $REGION --profile $PROFILE)

echo "✅ Bastion instance launched: $INSTANCE_ID"

# Step 6: Wait for instance to be running
echo ""
echo "⏳ Step 6: Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region $REGION --profile $PROFILE
echo "✅ Instance is running"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region $REGION --profile $PROFILE)

echo "📍 Bastion Public IP: $PUBLIC_IP"

# Step 7: Update RDS Security Group
echo ""
echo "🔒 Step 7: Updating RDS Security Group"
RDS_SG="sg-061bd49ae447928fb"  # From diagnosis

# Get bastion private IP
BASTION_PRIVATE_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PrivateIpAddress' \
    --output text \
    --region $REGION --profile $PROFILE)

echo "📍 Bastion Private IP: $BASTION_PRIVATE_IP"

# Add rule for bastion to access RDS
echo "🔧 Adding RDS access rule for bastion..."
aws ec2 authorize-security-group-ingress \
    --group-id "$RDS_SG" \
    --protocol tcp \
    --port 5432 \
    --cidr "$BASTION_PRIVATE_IP/32" \
    --region $REGION --profile $PROFILE 2>/dev/null || echo "   ℹ️  RDS rule may already exist"

echo ""
echo "🎉 BASTION HOST SETUP COMPLETE"
echo "=============================="
echo ""
echo "✅ Bastion Instance: $INSTANCE_ID"
echo "✅ Public IP: $PUBLIC_IP"
echo "✅ Private IP: $BASTION_PRIVATE_IP"
echo "✅ Key File: ${KEY_NAME}.pem"
echo ""
echo "🔗 Connection Instructions:"
echo "=========================="
echo ""
echo "1. Connect to bastion via SSH:"
echo "   ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo ""
echo "2. Test RDS connection:"
echo "   ./connect-rds.sh"
echo ""
echo "3. Transfer schema file:"
echo "   scp -i ${KEY_NAME}.pem supabase/sql/matbakh_complete_schema.sql ec2-user@$PUBLIC_IP:~/"
echo ""
echo "4. Run migration:"
echo "   export RDS_PASSWORD='your-password'"
echo "   ./migrate-schema.sh matbakh_complete_schema.sql"
echo ""
echo "🗑️  Cleanup (after migration):"
echo "=============================="
echo "aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION --profile $PROFILE"
echo "aws ec2 delete-security-group --group-id $BASTION_SG --region $REGION --profile $PROFILE"
echo "aws ec2 delete-key-pair --key-name $KEY_NAME --region $REGION --profile $PROFILE"
echo "rm -f ${KEY_NAME}.pem bastion-user-data.sh"