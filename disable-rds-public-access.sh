#!/bin/bash
set -euo pipefail

echo "🔒 DISABLING RDS PUBLIC ACCESS"
echo "============================="

# Disable public access
aws rds modify-db-instance \
    --db-instance-identifier matbakh-db \
    --no-publicly-accessible \
    --apply-immediately \
    --region eu-central-1 --profile matbakh-dev

echo "⏳ Waiting for modification to complete..."
aws rds wait db-instance-available \
    --db-instance-identifier matbakh-db \
    --region eu-central-1 --profile matbakh-dev

# Remove security group rules
echo "🗑️  Removing temporary security group rules..."
aws ec2 revoke-security-group-ingress \
    --group-id sg-062c8ca1721afbe22 \
    --protocol tcp --port 5432 \
    --cidr 2a09:bac3:2966:2482::3a3:15/32 \
    --region eu-central-1 --profile matbakh-dev 2>/dev/null || echo "Rule may already be removed"
aws ec2 revoke-security-group-ingress \
    --group-id sg-061bd49ae447928fb \
    --protocol tcp --port 5432 \
    --cidr 2a09:bac3:2966:2482::3a3:15/32 \
    --region eu-central-1 --profile matbakh-dev 2>/dev/null || echo "Rule may already be removed"

echo "✅ RDS public access disabled"
echo "✅ Security group rules removed"
echo "🔒 RDS is now secure again"
