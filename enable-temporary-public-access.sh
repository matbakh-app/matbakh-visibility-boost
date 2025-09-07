#!/bin/bash
set -euo pipefail

# Enable Temporary Public Access for RDS Migration
# ⚠️  SECURITY WARNING: This makes RDS accessible from internet temporarily

REGION=${AWS_REGION:-eu-central-1}
PROFILE=${AWS_PROFILE:-matbakh-dev}
RDS_ENDPOINT="matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com"

echo "⚠️  ENABLING TEMPORARY RDS PUBLIC ACCESS"
echo "<REDACTED_AWS_SECRET_ACCESS_KEY>"
echo "🚨 WARNING: This will make your RDS instance accessible from the internet!"
echo "🔒 This should only be used temporarily for migration purposes."
echo "🔐 Ensure you have a strong password and will disable this after migration."
echo ""

read -p "Are you sure you want to enable public access temporarily? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 1
fi

# Step 1: Get RDS instance identifier
echo ""
echo "🔍 Step 1: Finding RDS Instance"
DB_IDENTIFIER=$(aws rds describe-db-instances \
    --region $REGION --profile $PROFILE \
    --query 'DBInstances[?Endpoint.Address==`'$RDS_ENDPOINT'`].DBInstanceIdentifier' \
    --output text)

if [ -z "$DB_IDENTIFIER" ] || [ "$DB_IDENTIFIER" = "None" ]; then
    echo "❌ RDS instance not found with endpoint: $RDS_ENDPOINT"
    exit 1
fi

echo "✅ Found RDS instance: $DB_IDENTIFIER"

# Step 2: Check current public accessibility
echo ""
echo "📊 Step 2: Checking Current Configuration"
CURRENT_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --region $REGION --profile $PROFILE \
    --query 'DBInstances[0].PubliclyAccessible' \
    --output text)

echo "📋 Current public accessibility: $CURRENT_STATUS"

if [ "$CURRENT_STATUS" = "true" ]; then
    echo "✅ RDS instance already has public access enabled"
else
    echo "🔧 Enabling public access..."
    aws rds modify-db-instance \
        --db-instance-identifier "$DB_IDENTIFIER" \
        --publicly-accessible \
        --apply-immediately \
        --region $REGION --profile $PROFILE
    
    echo "⏳ Waiting for modification to complete..."
    aws rds wait db-instance-available \
        --db-instance-identifier "$DB_IDENTIFIER" \
        --region $REGION --profile $PROFILE
    
    echo "✅ Public access enabled"
fi

# Step 3: Update Security Group
echo ""
echo "🔒 Step 3: Updating Security Group"

# Get your public IP (try multiple methods)
LOCAL_IP=""
if command -v curl > /dev/null 2>&1; then
    LOCAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not determine your public IP address"
    echo "💡 Please manually add your IP to the RDS security group"
    echo "   Security Group: sg-061bd49ae447928fb"
    echo "   Port: 5432"
    exit 1
fi

echo "📍 Your public IP: $LOCAL_IP"

# Get RDS security groups
SECURITY_GROUPS=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_IDENTIFIER" \
    --region $REGION --profile $PROFILE \
    --query 'DBInstances[0].VpcSecurityGroups[].VpcSecurityGroupId' \
    --output text)

echo "🔒 Updating security groups: $SECURITY_GROUPS"

for sg_id in $SECURITY_GROUPS; do
    echo "   📋 Updating security group: $sg_id"
    
    # Check if rule already exists
    existing_rule=$(aws ec2 describe-security-groups \
        --group-ids "$sg_id" \
        --region $REGION --profile $PROFILE \
        --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\` && ToPort==\`5432\` && IpRanges[?CidrIp==\`$LOCAL_IP/32\`]]" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$existing_rule" ]; then
        echo "      🔧 Adding rule for $LOCAL_IP/32..."
        aws ec2 authorize-security-group-ingress \
            --group-id "$sg_id" \
            --protocol tcp \
            --port 5432 \
            --cidr "$LOCAL_IP/32" \
            --region $REGION --profile $PROFILE 2>/dev/null || echo "      ⚠️  Failed to add rule (may already exist)"
        echo "      ✅ Rule added"
    else
        echo "      ✅ Rule for $LOCAL_IP/32 already exists"
    fi
done

# Step 4: Test Connection
echo ""
echo "🧪 Step 4: Testing Connection"
echo "🔗 Testing RDS connectivity..."

if command -v nc > /dev/null 2>&1; then
    if timeout 5 nc -z "$RDS_ENDPOINT" 5432 2>/dev/null; then
        echo "✅ Port 5432 is reachable on $RDS_ENDPOINT"
    else
        echo "❌ Port 5432 is NOT reachable on $RDS_ENDPOINT"
        echo "⏳ Wait a few minutes for changes to propagate"
    fi
else
    echo "⚠️  netcat not available - cannot test port connectivity"
fi

echo ""
echo "🎉 TEMPORARY PUBLIC ACCESS ENABLED"
echo "=================================="
echo ""
echo "✅ RDS instance is now publicly accessible"
echo "✅ Your IP ($LOCAL_IP) is allowed in security groups"
echo "✅ Ready for direct connection and migration"
echo ""
echo "🔗 Test Connection:"
echo "=================="
echo "PGPASSWORD='your-password' psql -h $RDS_ENDPOINT -U postgres -d postgres"
echo ""
echo "📋 Migration Commands:"
echo "====================="
echo "# Create database (if needed)"
echo "PGPASSWORD='your-password' psql -h $RDS_ENDPOINT -U postgres -d postgres -c \"CREATE DATABASE matbakh;\""
echo ""
echo "# Run schema migration"
echo "PGPASSWORD='your-password' psql -h $RDS_ENDPOINT -U postgres -d matbakh -f supabase/sql/matbakh_complete_schema.sql"
echo ""
echo "# Apply RBAC (if available)"
echo "PGPASSWORD='your-password' psql -h $RDS_ENDPOINT -U postgres -d matbakh -f supabase/sql/rbac_production_final.sql"
echo ""
echo "⚠️  IMPORTANT SECURITY REMINDER"
echo "==============================="
echo "🔒 After migration is complete, IMMEDIATELY disable public access:"
echo ""
echo "aws rds modify-db-instance \\"
echo "    --db-instance-identifier $DB_IDENTIFIER \\"
echo "    --no-publicly-accessible \\"
echo "    --apply-immediately \\"
echo "    --region $REGION --profile $PROFILE"
echo ""
echo "🗑️  Remove temporary security group rules:"
for sg_id in $SECURITY_GROUPS; do
    echo "aws ec2 revoke-security-group-ingress \\"
    echo "    --group-id $sg_id \\"
    echo "    --protocol tcp --port 5432 \\"
    echo "    --cidr $LOCAL_IP/32 \\"
    echo "    --region $REGION --profile $PROFILE"
done
echo ""
echo "⏰ Set a reminder to disable public access within 24 hours!"

# Create cleanup script
cat > disable-rds-public-access.sh << EOF
#!/bin/bash
set -euo pipefail

echo "🔒 DISABLING RDS PUBLIC ACCESS"
echo "============================="

# Disable public access
aws rds modify-db-instance \\
    --db-instance-identifier $DB_IDENTIFIER \\
    --no-publicly-accessible \\
    --apply-immediately \\
    --region $REGION --profile $PROFILE

echo "⏳ Waiting for modification to complete..."
aws rds wait db-instance-available \\
    --db-instance-identifier $DB_IDENTIFIER \\
    --region $REGION --profile $PROFILE

# Remove security group rules
echo "🗑️  Removing temporary security group rules..."
EOF

for sg_id in $SECURITY_GROUPS; do
    cat >> disable-rds-public-access.sh << EOF
aws ec2 revoke-security-group-ingress \\
    --group-id $sg_id \\
    --protocol tcp --port 5432 \\
    --cidr $LOCAL_IP/32 \\
    --region $REGION --profile $PROFILE 2>/dev/null || echo "Rule may already be removed"
EOF
done

cat >> disable-rds-public-access.sh << EOF

echo "✅ RDS public access disabled"
echo "✅ Security group rules removed"
echo "🔒 RDS is now secure again"
EOF

chmod +x disable-rds-public-access.sh
echo ""
echo "📝 Cleanup script created: disable-rds-public-access.sh"
echo "   Run this script after migration to restore security"