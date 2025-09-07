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
