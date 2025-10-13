# Supabase → AWS Migration - Detailed Implementation Guide

**SPEC_ID:** SUPABASE-AWS-MIGRATION-IMPLEMENTATION  
**STATUS:** Ready for Execution  
**OWNER:** CTO  
**DEPENDENCIES:** requirements.md, design.md, tasks.md, infrastructure-analysis.md  

## Phase 1: Infrastructure Foundation (Wochen 1-4)

### 1.1 AWS Account & IAM Setup
```bash
# Create dedicated AWS account
aws organizations create-account \
  --email matbakh-prod@company.com \
  --account-name "Matbakh Production"

# Set up IAM roles
aws iam create-role \
  --role-name MatbakhLambdaExecutionRole \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach managed policies
aws iam attach-role-policy \
  --role-name MatbakhLambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

### 1.2 VPC & Networking
```yaml
# CloudFormation Template: vpc-infrastructure.yaml
Resources:
  MatbakhVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MatbakhVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: eu-central-1a
      MapPublicIpOnLaunch: true
      
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MatbakhVPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: eu-central-1a
```

### 1.3 RDS PostgreSQL Setup
```bash
# Create RDS subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name matbakh-db-subnet-group \
  --db-subnet-group-description "Matbakh RDS subnet group" \
  --subnet-ids subnet-12345 subnet-67890

# Create RDS cluster
aws rds create-db-cluster \
  --db-cluster-identifier matbakh-prod \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username matbakh_admin \
  --manage-master-user-password \
  --db-subnet-group-name matbakh-db-subnet-group \
  --vpc-security-group-ids sg-rds-access
```

## Phase 2: Data Migration (Wochen 5-8)

### 2.1 Schema Migration
```sql
-- Export Supabase schema
pg_dump --schema-only \
  "postgresql://postgres:password@db.supabase.co:5432/postgres" \
  > supabase_schema.sql

-- Optimize for AWS RDS
-- Add partitioning for large tables
CREATE TABLE visibility_check_leads_partitioned (
    LIKE visibility_check_leads INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE visibility_check_leads_y2025m01 
PARTITION OF visibility_check_leads_partitioned 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 2.2 DMS Configuration
```json
{
  "ReplicationInstanceIdentifier": "matbakh-migration",
  "ReplicationInstanceClass": "dms.r5.xlarge",
  "AllocatedStorage": 100,
  "VpcSecurityGroupIds": ["sg-dms-access"],
  "ReplicationSubnetGroupIdentifier": "matbakh-dms-subnet-group",
  "MultiAZ": true,
  "PubliclyAccessible": false
}
```

## Phase 3: Application Migration (Wochen 9-12)

### 3.1 Lambda Functions
```javascript
// vc-start Lambda function
const { Client } = require('pg');
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const secretsManager = new AWS.SecretsManager();
    
    // Get database credentials from Secrets Manager
    const secret = await secretsManager.getSecretValue({
        SecretId: 'matbakh/database/credentials'
    }).promise();
    
    const dbCredentials = JSON.parse(secret.SecretString);
    
    const client = new Client({
        host: dbCredentials.host,
        database: dbCredentials.dbname,
        user: dbCredentials.username,
        password: dbCredentials.password,
        ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    try {
        const { email, business_name } = JSON.parse(event.body);
        
        const result = await client.query(
            'INSERT INTO visibility_check_leads (email, business_name, status) VALUES ($1, $2, $3) RETURNING id',
            [email, business_name, 'pending']
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                lead_id: result.rows[0].id 
            })
        };
    } finally {
        await client.end();
    }
};
```

### 3.2 Cognito Integration
```javascript
// Cognito User Pool configuration
const cognitoConfig = {
    UserPoolName: 'matbakh-users',
    Policies: {
        PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true
        }
    },
    AutoVerifiedAttributes: ['email'],
    Schema: [
        {
            Name: 'email',
            AttributeDataType: 'String',
            Required: true,
            Mutable: true
        },
        {
            Name: 'business_id',
            AttributeDataType: 'String',
            Required: false,
            Mutable: true
        }
    ]
};
```

## Phase 4: Monitoring & Optimization (Wochen 13-16)

### 4.1 CloudWatch Setup
```yaml
# CloudWatch Dashboard
DashboardBody: |
  {
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/ApiGateway", "Count", "ApiName", "matbakh-api"],
            ["AWS/ApiGateway", "Latency", "ApiName", "matbakh-api"]
          ],
          "period": 300,
          "stat": "Average",
          "region": "eu-central-1",
          "title": "API Performance"
        }
      }
    ]
  }
```

### 4.2 Performance Optimization
```sql
-- Database optimization
CREATE INDEX CONCURRENTLY idx_vc_leads_email_status 
ON visibility_check_leads(email, status) 
WHERE status != 'deleted';

-- Materialized views for analytics
CREATE MATERIALIZED VIEW mv_daily_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_leads
FROM visibility_check_leads
GROUP BY DATE(created_at);
```

## Implementation Checklist

### Week 1-2: Foundation
- [ ] AWS account setup and billing configuration
- [ ] IAM roles and policies creation
- [ ] VPC and networking infrastructure
- [ ] Security groups and NACLs
- [ ] KMS keys for encryption

### Week 3-4: Database Setup
- [ ] RDS cluster provisioning
- [ ] ElastiCache Redis cluster
- [ ] Database schema migration
- [ ] Connection testing and validation

### Week 5-6: Migration Tools
- [ ] DMS replication instance setup
- [ ] Source and target endpoints configuration
- [ ] Initial data validation scripts
- [ ] CDC configuration and testing

### Week 7-8: Application Layer
- [ ] Lambda functions development
- [ ] API Gateway configuration
- [ ] Cognito User Pool setup
- [ ] Authentication integration

### Week 9-10: Testing
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security testing
- [ ] Performance validation

### Week 11-12: Cutover
- [ ] Production migration execution
- [ ] DNS cutover
- [ ] Post-migration validation
- [ ] Legacy system decommission

### Week 13-16: Optimization
- [ ] Performance tuning
- [ ] Monitoring setup
- [ ] Documentation completion
- [ ] Team training

---

**EXECUTION STATUS:** Ready to begin Phase 1
**RISK ASSESSMENT:** Medium risk with comprehensive mitigation
**SUCCESS CRITERIA:** Zero data loss, <15 minute RTO, 60% cost reduction